/**
 * useResultados.js
 * Substitui useLocalStorage("atl_resultados") por coleção Firestore.
 * 
 * Estrutura Firestore:
 *   resultados/
 *     {chave} → { atletaId1: { marca, raia, vento, ... }, atletaId2: {...} }
 * 
 * Cada documento = uma combinação de (eventoId, provaId, catId, sexo, fase).
 * Fiscais diferentes podem gravar provas diferentes sem conflito.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from "../firebase";
import { sanitize } from "../lib/utils/sanitize";
import { todasAsProvas } from "../shared/athletics/provasDef";

const COLLECTION = "resultados";

// ── Mesma função resKey do App.jsx (duplicada aqui para independência) ────────
const resKey = (eventoId, provaId, catId, sexo, faseSufixo) =>
  faseSufixo
    ? `${eventoId}_${provaId}_${catId}_${sexo}__${faseSufixo}`
    : `${eventoId}_${provaId}_${catId}_${sexo}`;

// ── Calcula posição de cada atleta/equipe no doc de resultados ────────────────
function calcularPosicoes(docResultados, provaId) {
  const provas = todasAsProvas();
  const prova = provas.find(p => p.id === provaId);
  if (!prova) return docResultados;

  const isPista = prova.unidade === "s";
  const isAltVara = prova.tipo === "salto" && (prova.id.includes("altura") || prova.id.includes("vara"));

  const STATUS_LIST = ["DNS","DNF","DQ","NM","NH"];
  const entradas = Object.entries(docResultados).map(([id, raw]) => {
    const obj = (raw != null && typeof raw === "object") ? raw : { marca: raw };
    const status = obj.status || "";
    const marcaStr = String(obj.marca || "").toUpperCase();
    const isStatus = STATUS_LIST.includes(status) || STATUS_LIST.includes(marcaStr);
    const statusEfetivo = STATUS_LIST.includes(status) ? status : STATUS_LIST.includes(marcaStr) ? marcaStr : "";
    const marcaNum = (!isStatus && obj.marca != null) ? parseFloat(obj.marca) : null;
    const marca = (marcaNum != null && !isNaN(marcaNum)) ? marcaNum : null;
    return { id, raw: obj, marca, status: statusEfetivo, isStatus };
  });

  entradas.sort((a, b) => {
    if (a.isStatus && !b.isStatus) return 1;
    if (!a.isStatus && b.isStatus) return -1;
    if (a.isStatus && b.isStatus) {
      const ord = isPista ? { DNF:0, DNS:1, DQ:2 } : { NM:0, DNS:1, DQ:2 };
      return (ord[a.status] ?? 9) - (ord[b.status] ?? 9);
    }
    if (a.marca == null && b.marca == null) return 0;
    if (a.marca == null) return 1;
    if (b.marca == null) return -1;

    if (isPista) return a.marca - b.marca;
    if (b.marca !== a.marca) return b.marca - a.marca;

    // Desempate altura/vara: RT 26.9
    if (isAltVara) {
      const getSU = (r) => {
        if (!r || typeof r !== "object") return 0;
        const tObj = (r.tentativas && typeof r.tentativas === "object") ? r.tentativas : {};
        const melhor = parseFloat(r.marca);
        if (isNaN(melhor)) return 0;
        const alts = Array.isArray(r.alturas) ? r.alturas : [];
        const key = alts.find(h => Math.abs(parseFloat(h) - melhor) < 0.001);
        if (!key) return 0;
        const arr = Array.isArray(tObj[key]) ? tObj[key] : Array.isArray(tObj[parseFloat(key).toFixed(2)]) ? tObj[parseFloat(key).toFixed(2)] : [];
        return arr.filter(t => t === "X" || t === "O").length;
      };
      const getFP = (r) => {
        if (!r || typeof r !== "object") return 0;
        const tObj = (r.tentativas && typeof r.tentativas === "object") ? r.tentativas : {};
        const alts = Array.isArray(r.alturas) ? r.alturas : [];
        let total = 0;
        alts.forEach(h => {
          const kStr = parseFloat(h).toFixed(2);
          const arr = Array.isArray(tObj[h]) ? tObj[h] : Array.isArray(tObj[kStr]) ? tObj[kStr] : [];
          if (arr.includes("O")) total += arr.filter(t => t === "X").length;
        });
        return total;
      };
      const suA = getSU(a.raw), suB = getSU(b.raw);
      if (suA !== suB) return suA - suB;
      const fpA = getFP(a.raw), fpB = getFP(b.raw);
      if (fpA !== fpB) return fpA - fpB;
      return 0;
    }

    // Desempate campo: RT 25.22 (sequência de melhores tentativas)
    const seqDesc = (r) => {
      if (r == null) return [];
      const obj = typeof r === "object" ? r : { marca: r };
      return [obj.t1,obj.t2,obj.t3,obj.t4,obj.t5,obj.t6]
        .map(v => { const n = parseFloat(v); return isNaN(n) ? null : n; })
        .filter(n => n !== null).sort((x,y) => y - x);
    };
    const sa = seqDesc(a.raw), sb = seqDesc(b.raw);
    const len = Math.max(sa.length, sb.length);
    for (let i = 0; i < len; i++) {
      const va = sa[i] ?? -Infinity, vb = sb[i] ?? -Infinity;
      if (vb > va) return  1;
      if (va > vb) return -1;
    }
    return 0;
  });

  const resultado = {};
  let posAtual = 1;
  entradas.forEach((e, idx) => {
    if (e.isStatus) {
      resultado[e.id] = { ...e.raw, posicao: null };
      return;
    }
    // Empate: mesma marca que o anterior → mesma posição
    if (idx > 0 && !entradas[idx - 1].isStatus && e.marca != null && entradas[idx - 1].marca != null && e.marca === entradas[idx - 1].marca) {
      resultado[e.id] = { ...e.raw, posicao: posAtual };
    } else {
      posAtual = idx + 1; // pula posições (ex: 1º, 1º, 3º)
      resultado[e.id] = { ...e.raw, posicao: posAtual };
    }
  });
  return resultado;
}

// ── Sanitize: Firestore rejeita undefined, NaN, Infinity ─────────────────────

/**
 * @param {object} opts
 * @param {Array}    opts.eventos      — lista de eventos (para snapshot de recordes)
 * @param {Array}    opts.recordes     — tipos de recorde (para snapshot de recordes)
 * @param {Function} opts.editarEvento — salva evento com snapshot (para snapshot de recordes)
 */
export function useResultados({ eventos = [], recordes = [], editarEvento } = {}) {
  const [resultados, setResultadosLocal] = useState({});
  const [carregando, setCarregando] = useState(true);

  // Ref para acesso síncrono no callback sem re-closure
  const resultadosRef = useRef(resultados);
  resultadosRef.current = resultados;

  // ── Escuta em tempo real toda a coleção ──────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, COLLECTION),
      (snap) => {
        const dados = {};
        snap.forEach((d) => {
          dados[d.id] = d.data();
        });
        setResultadosLocal(dados);
        setCarregando(false);
      },
      (err) => {
        console.error("[useResultados] onSnapshot error:", err);
        setCarregando(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Grava / atualiza resultado de 1 atleta numa prova ───────────────────
  const atualizarResultado = useCallback(
    async (eventoId, provId, catId, sexo, atletaId, marca, raia, vento, tentativas, faseSufixo) => {
      const chave = resKey(eventoId, provId, catId, sexo, faseSufixo || "");

      // Normaliza: vírgula → ponto
      const normMarca = marca != null ? String(marca).replace(",", ".") : marca;
      const normVento = vento != null ? String(vento).replace(",", ".") : vento;
      const normTent = tentativas
        ? Object.fromEntries(
            Object.entries(tentativas).map(([k, v]) => {
              if (v == null || typeof v === "object") return [k, v];
              return [k, String(v).replace(",", ".")];
            })
          )
        : tentativas;

      // Lê estado mais recente do Firestore (evita race condition entre fiscais)
      const docRef = doc(db, COLLECTION, chave);
      const snap = await getDoc(docRef);
      const docAtual = snap.exists() ? snap.data() : {};
      const prev = docAtual[atletaId];
      const entry = typeof prev === "object" && prev !== null ? prev : { marca: prev };

      const novoEntry = sanitize({
        ...entry,
        marca: normMarca,
        ...(raia      !== undefined ? { raia }            : {}),
        ...(normVento !== undefined ? { vento: normVento } : {}),
        ...(normTent  !== undefined ? normTent             : {}),
      });

      const docComPosicoes = calcularPosicoes({ ...docAtual, [atletaId]: novoEntry }, provId);
      await setDoc(docRef, sanitize(docComPosicoes));

      // ── Snapshot de recordes (lazy: cria na primeira digitação se não existir) ──
      try {
        const evt = eventos.find((e) => e.id === eventoId);
        if (evt && !evt.recordesSnapshot && editarEvento) {
          const recSumulaIds = evt.recordesSumulas || [];
          const temVinculo =
            recSumulaIds.length > 0 ||
            recordes.some((t) => t.competicoesVinculadas?.includes(eventoId));
          if (temVinculo) {
            const snapshot = {};
            recordes.forEach((tipo) => {
              if (
                recSumulaIds.includes(tipo.id) ||
                tipo.competicoesVinculadas?.includes(eventoId)
              ) {
                snapshot[tipo.id] = (tipo.registros || []).map((r) => ({ ...r }));
              }
            });
            editarEvento({
              ...evt,
              recordesSnapshot: snapshot,
              recordesSnapshotEm: Date.now(),
            });
          }
        }
      } catch (_e) {
        /* silently ignore snapshot errors */
      }
    },
    [eventos, recordes, editarEvento]
  );

  // ── Remove resultado de 1 atleta numa prova ──────────────────────────────
  const limparResultado = useCallback(
    async (eventoId, provId, catId, sexo, atletaId, faseSufixo) => {
      const chave = resKey(eventoId, provId, catId, sexo, faseSufixo || "");
      const docAtual = { ...(resultadosRef.current[chave] || {}) };
      delete docAtual[atletaId];
      const docRef = doc(db, COLLECTION, chave);
      await setDoc(docRef, sanitize(docAtual));
    },
    []
  );

  // ── Grava resultados de MÚLTIPLOS atletas de uma vez (evita race condition) ──
  const atualizarResultadosEmLote = useCallback(
    async (eventoId, provId, catId, sexo, faseSufixo, entradas) => {
      // entradas = [{ atletaId, marca, tentData, statusData }]
      if (!entradas || entradas.length === 0) return;
      const chave = resKey(eventoId, provId, catId, sexo, faseSufixo || "");
      const docRef = doc(db, COLLECTION, chave);
      const snap = await getDoc(docRef);
      const docAtual = snap.exists() ? { ...snap.data() } : {};

      entradas.forEach(({ atletaId, marca, tentData, statusData }) => {
        const normMarca = marca != null ? String(marca).replace(",", ".") : marca;
        const normTent = tentData
          ? Object.fromEntries(
              Object.entries(tentData).map(([k, v]) => {
                if (v == null || typeof v === "object") return [k, v];
                return [k, String(v).replace(",", ".")];
              })
            )
          : {};
        const prev = docAtual[atletaId];
        const entry = typeof prev === "object" && prev !== null ? prev : {};
        docAtual[atletaId] = sanitize({
          ...entry,
          marca: normMarca,
          ...normTent,
          ...(statusData || {}),
        });
      });

      const docComPosicoes = calcularPosicoes(docAtual, provId);
      await setDoc(docRef, sanitize(docComPosicoes));
    },
    []
  );

    // ── Remove todos os resultados de uma prova ──────────────────────────────
  const limparTodosResultados = useCallback(
    async (eventoId, provId, catId, sexo, faseSufixo) => {
      const chave = resKey(eventoId, provId, catId, sexo, faseSufixo || "");
      const docRef = doc(db, COLLECTION, chave);
      await setDoc(docRef, {});
    },
    []
  );

  // ── Reseta TUDO (usado em limparTodosDados) ──────────────────────────────
  const resetResultados = useCallback(async () => {
    const chaves = Object.keys(resultadosRef.current);
    if (chaves.length === 0) return;

    // writeBatch suporta até 500 ops por lote
    const LOTE = 500;
    for (let i = 0; i < chaves.length; i += LOTE) {
      const batch = writeBatch(db);
      chaves.slice(i, i + LOTE).forEach((chave) => {
        batch.delete(doc(db, COLLECTION, chave));
      });
      await batch.commit();
    }
  }, []);

  // ── Importa backup completo (usado em importarDados) ─────────────────────
  // resultadosBackup = objeto { chave: { atletaId: {...} } }
  const importarResultados = useCallback(async (resultadosBackup) => {
    if (!resultadosBackup || typeof resultadosBackup !== "object") return;

    // 1. Apaga tudo existente
    await resetResultados();

    // 2. Grava o backup em lotes
    const entradas = Object.entries(resultadosBackup);
    const LOTE = 500;
    for (let i = 0; i < entradas.length; i += LOTE) {
      const batch = writeBatch(db);
      entradas.slice(i, i + LOTE).forEach(([chave, valor]) => {
        batch.set(doc(db, COLLECTION, chave), sanitize(valor));
      });
      await batch.commit();
    }
  }, [resetResultados]);

  return {
    resultados,
    carregando,
    atualizarResultado,
    limparResultado,
    limparTodosResultados,
    resetResultados,
    importarResultados,
    atualizarResultadosEmLote,
  };
}
