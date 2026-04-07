/**
 * useInscricoes.js
 * Substitui useLocalStorage("atl_inscricoes") por coleção Firestore.
 *
 * Estrutura Firestore:
 *   inscricoes/
 *     {id} → { atletaId, provaId, eventoId, ... }
 *
 * Cada documento = 1 inscrição com seu próprio ID.
 * Múltiplos usuários podem inscrever atletas simultaneamente sem conflito.
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
import { cacheGet, cacheSet } from "../lib/cacheDB";

const COLLECTION = "inscricoes";
const STORE = "cache_inscricoes";
const RES_COLLECTION = "resultados";

// Mesma lógica de chave do useResultados
const _resKey = (eventoId, provaId, catId, sexo, faseSufixo) =>
  faseSufixo
    ? `${eventoId}_${provaId}_${catId}_${sexo}__${faseSufixo}`
    : `${eventoId}_${provaId}_${catId}_${sexo}`;


/**
 * @param {object} opts
 * @param {Array}    opts.atletas        — lista de atletas (para auditoria)
 * @param {Function} opts.registrarAcao  — função de auditoria
 * @param {object}   opts.usuarioLogado  — usuário atual
 */
export function useInscricoes({ atletas = [], registrarAcao, usuarioLogado } = {}) {
  const [inscricoes, setInscricoesLocal] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const inscricoesRef = useRef(inscricoes);
  inscricoesRef.current = inscricoes;

  // ── Hidratar do IndexedDB (cache offline) ───────────────────────────────
  useEffect(() => {
    let cancelled = false;
    cacheGet(STORE).then((cached) => {
      if (!cancelled && cached && cached.length > 0) setInscricoesLocal(cached);
    });
    return () => { cancelled = true; };
  }, []);

  // ── Escuta em tempo real toda a coleção ──────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, COLLECTION),
      (snap) => {
        const lista = [];
        snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
        setInscricoesLocal(lista);
        // Compatibilidade: expõe no window para CombinedEventEngine
        if (typeof window !== "undefined") window.__atletismoInscricoes = lista;
        cacheSet(STORE, lista).catch(() => {});
        setCarregando(false);
      },
      (err) => {
        console.error("[useInscricoes] onSnapshot error:", err);
        setCarregando(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Adicionar 1 inscrição ────────────────────────────────────────────────
  const adicionarInscricao = useCallback(
    async (insc) => {
      // Guarda contra duplicatas: mesmo atleta + prova + evento + categoria + sexo + tipo
      // Revezamento: não bloqueia aqui (mesma equipe pode ter múltiplas equipes A/B)
      const tipoInsc = insc.tipo || "";
      const duplicada = tipoInsc !== "revezamento" && inscricoesRef.current.some(i =>
        i.atletaId === insc.atletaId &&
        i.provaId === insc.provaId &&
        i.eventoId === insc.eventoId &&
        (i.tipo || "") === tipoInsc &&
        (i.categoriaId || i.categoriaOficialId) === (insc.categoriaId || insc.categoriaOficialId) &&
        i.sexo === insc.sexo
      );
      if (duplicada) {
        console.warn("[useInscricoes] Inscrição duplicada bloqueada:", insc.atletaId, insc.provaId);
        return;
      }

      const docRef = doc(db, COLLECTION, insc.id);
      await setDoc(docRef, sanitize(insc));

      if (usuarioLogado && registrarAcao) {
        const atl = atletas.find((a) => a.id === insc.atletaId);
        registrarAcao(
          usuarioLogado.id,
          usuarioLogado.nome,
          "Inscreveu atleta",
          `${atl?.nome || insc.atletaId} — ${insc.provaNome || insc.provaComponenteNome || insc.provaId}`,
          usuarioLogado.organizadorId ||
            (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null),
          { equipeId: usuarioLogado.equipeId, modulo: "inscricoes" }
        );
      }
    },
    [atletas, registrarAcao, usuarioLogado]
  );

  // ── Excluir 1 inscrição (com lógica de combinada) ───────────────────────
  // Nota: window.confirm e CombinedEventEngine ficam aqui para manter
  // o comportamento idêntico ao App.jsx original
  const excluirInscricao = useCallback(
    async (id, { todasAsProvas, CombinedEventEngine, confirmado } = {}) => {
      const insc = inscricoesRef.current.find((i) => i.id === id);

      // Proteger inscrições de componentes de provas combinadas
      if (insc && CombinedEventEngine?.isInscricaoProtegida(insc)) {
        alert(
          `⚠️ Esta inscrição faz parte da prova combinada "${insc.nomeCombinada || "Combinada"}".\n\nPara remover, exclua a inscrição da prova combinada principal.`
        );
        return;
      }

      if (
        !confirmado &&
        !window.confirm(
          "⚠️ Excluir esta inscrição?\n\nEsta ação é IRREVERSÍVEL e removerá todos os resultados associados."
        )
      )
        return;

      // Se for combinada principal, remover componentes também
      let idsParaRemover = [id];
      if (insc && todasAsProvas && CombinedEventEngine) {
        const provaInfo = todasAsProvas().find((p) => p.id === insc.provaId);
        if (provaInfo && provaInfo.tipo === "combinada") {
          const compIds = CombinedEventEngine.getInscricoesComponentesParaRemover(
            inscricoesRef.current,
            insc.atletaId,
            insc.provaId,
            insc.eventoId
          );
          idsParaRemover = [id, ...compIds];
        }
      }

      // Capturar dados das inscrições ANTES de deletar (snapshot local)
      const inscsRemovidas = idsParaRemover.map(iid => inscricoesRef.current.find(i => i.id === iid)).filter(Boolean);

      // Deletar inscrições em lote
      const batch = writeBatch(db);
      idsParaRemover.forEach((iid) => batch.delete(doc(db, COLLECTION, iid)));
      await batch.commit();

      // Limpar resultados órfãos das inscrições removidas
      try {
        for (const ir of inscsRemovidas) {
          const catId = ir.categoriaId || ir.categoriaOficialId;
          // Tentar todas as fases possíveis + sem fase
          const fases = ["FIN", "SEM", "ELI", ""];
          for (const fase of fases) {
            const rk = _resKey(ir.eventoId, ir.provaId, catId, ir.sexo, fase || undefined);
            const resRef = doc(db, RES_COLLECTION, rk);
            const resSnap = await getDoc(resRef);
            if (resSnap.exists()) {
              const resData = resSnap.data();
              if (resData[ir.atletaId] != null) {
                delete resData[ir.atletaId];
                await setDoc(resRef, sanitize(resData));
              }
            }
          }
        }
      } catch (_e) { /* silently ignore cleanup errors */ }

      if (usuarioLogado && registrarAcao && insc) {
        const atl = atletas.find((a) => a.id === insc.atletaId);
        registrarAcao(
          usuarioLogado.id,
          usuarioLogado.nome,
          "Removeu inscrição",
          `${atl?.nome || insc.atletaId} — ${insc.provaNome || insc.provaComponenteNome || insc.provaId}`,
          usuarioLogado.organizadorId ||
            (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null),
          { equipeId: usuarioLogado.equipeId, modulo: "inscricoes" }
        );
      }
    },
    [atletas, registrarAcao, usuarioLogado]
  );

  // ── Atualizar 1 inscrição ────────────────────────────────────────────────
  const atualizarInscricao = useCallback(async (upd) => {
    const docRef = doc(db, COLLECTION, upd.id);
    await setDoc(docRef, sanitize(upd));
  }, []);

  // ── Excluir inscrições por set de atletaIds (excluirEquipe) ─────────────
  const excluirInscricoesPorAtletas = useCallback(async (idsAtletasSet) => {
    const paraRemover = inscricoesRef.current.filter((i) =>
      idsAtletasSet.has(i.atletaId)
    );
    if (paraRemover.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < paraRemover.length; i += LOTE) {
      const batch = writeBatch(db);
      paraRemover.slice(i, i + LOTE).forEach((insc) =>
        batch.delete(doc(db, COLLECTION, insc.id))
      );
      await batch.commit();
    }
  }, []);

  // ── Excluir inscrições por eventoId (excluirEvento) ─────────────────────
  const excluirInscricoesPorEvento = useCallback(async (eventoId) => {
    const paraRemover = inscricoesRef.current.filter(
      (i) => i.eventoId === eventoId
    );
    if (paraRemover.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < paraRemover.length; i += LOTE) {
      const batch = writeBatch(db);
      paraRemover.slice(i, i + LOTE).forEach((insc) =>
        batch.delete(doc(db, COLLECTION, insc.id))
      );
      await batch.commit();
    }
  }, []);

  // ── Reset total (limparTodosDados) ───────────────────────────────────────
  const resetInscricoes = useCallback(async () => {
    const todas = inscricoesRef.current;
    if (todas.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < todas.length; i += LOTE) {
      const batch = writeBatch(db);
      todas.slice(i, i + LOTE).forEach((insc) =>
        batch.delete(doc(db, COLLECTION, insc.id))
      );
      await batch.commit();
    }
  }, []);

  // ── Importar backup ──────────────────────────────────────────────────────
  const importarInscricoes = useCallback(
    async (lista) => {
      if (!Array.isArray(lista) || lista.length === 0) return;
      await resetInscricoes();
      const LOTE = 500;
      for (let i = 0; i < lista.length; i += LOTE) {
        const batch = writeBatch(db);
        lista.slice(i, i + LOTE).forEach((insc) =>
          batch.set(doc(db, COLLECTION, insc.id), sanitize(insc))
        );
        await batch.commit();
      }
    },
    [resetInscricoes]
  );

  // ── Migração: sincronizar nome da equipe em todas as inscrições ──────────
  const sincronizarNomesEquipes = useCallback(async (atletasArr, equipesArr) => {
    if (!atletasArr || !equipesArr) return 0;
    const atletaMap = Object.fromEntries(atletasArr.map(a => [a.id, a]));
    const equipeMap = Object.fromEntries(equipesArr.map(e => [e.id, e]));
    const atualizacoes = [];

    inscricoesRef.current.forEach(insc => {
      const atleta = atletaMap[insc.atletaId];
      if (!atleta) return;
      const eqId = insc.equipeCadastroId || atleta.equipeId;
      if (!eqId) return;
      const equipe = equipeMap[eqId];
      if (!equipe) return;
      const nomeAtual = equipe.nome || "";
      if (insc.equipeCadastro !== nomeAtual) {
        atualizacoes.push({ ...insc, equipeCadastro: nomeAtual });
      }
    });

    if (atualizacoes.length === 0) return 0;
    const LOTE = 500;
    for (let i = 0; i < atualizacoes.length; i += LOTE) {
      const batch = writeBatch(db);
      atualizacoes.slice(i, i + LOTE).forEach(insc => {
        batch.set(doc(db, COLLECTION, insc.id), sanitize(insc));
      });
      await batch.commit();
    }
    return atualizacoes.length;
  }, []);

  return {
    inscricoes,
    carregando,
    adicionarInscricao,
    excluirInscricao,
    atualizarInscricao,
    excluirInscricoesPorAtletas,
    excluirInscricoesPorEvento,
    resetInscricoes,
    importarInscricoes,
    sincronizarNomesEquipes,
  };
}
