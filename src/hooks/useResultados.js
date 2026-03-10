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
  deleteDoc,
  onSnapshot,
  writeBatch,
} from "../firebase";
import { resKey } from "../shared/constants/fases";

const COLLECTION = "resultados";


// ── Sanitize: Firestore rejeita undefined, NaN, Infinity ─────────────────────
function sanitize(val) {
  if (val === undefined || val === null) return null;
  if (typeof val === "number") return isNaN(val) || !isFinite(val) ? null : val;
  if (typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map(sanitize);
  const out = {};
  for (const k in val) {
    if (Object.prototype.hasOwnProperty.call(val, k)) {
      out[k] = sanitize(val[k]);
    }
  }
  return out;
}

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

      // Mescla com dado existente
      const docAtual = resultadosRef.current[chave] || {};
      const prev = docAtual[atletaId];
      const entry = typeof prev === "object" && prev !== null ? prev : { marca: prev };

      const novoEntry = sanitize({
        ...entry,
        marca: normMarca,
        ...(raia      !== undefined ? { raia }            : {}),
        ...(normVento !== undefined ? { vento: normVento } : {}),
        ...(normTent  !== undefined ? normTent             : {}),
      });

      const docRef = doc(db, COLLECTION, chave);
      await setDoc(docRef, sanitize({ ...docAtual, [atletaId]: novoEntry }));

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
      const docAtual = { ...(resultadosRef.current[chave] || {}) };

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

      const docRef = doc(db, COLLECTION, chave);
      await setDoc(docRef, sanitize(docAtual));
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
