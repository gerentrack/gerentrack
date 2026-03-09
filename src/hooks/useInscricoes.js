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
  deleteDoc,
  onSnapshot,
  writeBatch,
} from "../firebase";

const COLLECTION = "inscricoes";

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
 * @param {Array}    opts.atletas        — lista de atletas (para auditoria)
 * @param {Function} opts.registrarAcao  — função de auditoria
 * @param {object}   opts.usuarioLogado  — usuário atual
 */
export function useInscricoes({ atletas = [], registrarAcao, usuarioLogado } = {}) {
  const [inscricoes, setInscricoesLocal] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const inscricoesRef = useRef(inscricoes);
  inscricoesRef.current = inscricoes;

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
      const docRef = doc(db, COLLECTION, insc.id);
      await setDoc(docRef, sanitize(insc));

      if (usuarioLogado && registrarAcao) {
        const atl = atletas.find((a) => a.id === insc.atletaId);
        registrarAcao(
          usuarioLogado.id,
          usuarioLogado.nome,
          "Inscreveu atleta",
          `${atl?.nome || insc.atletaId} — ${insc.provaNome || insc.provaId}`,
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
    async (id, { todasAsProvas, CombinedEventEngine } = {}) => {
      const insc = inscricoesRef.current.find((i) => i.id === id);

      // Proteger inscrições de componentes de provas combinadas
      if (insc && CombinedEventEngine?.isInscricaoProtegida(insc)) {
        alert(
          `⚠️ Esta inscrição faz parte da prova combinada "${insc.nomeCombinada || "Combinada"}".\n\nPara remover, exclua a inscrição da prova combinada principal.`
        );
        return;
      }

      if (
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

      // Deletar em lote
      const batch = writeBatch(db);
      idsParaRemover.forEach((iid) => batch.delete(doc(db, COLLECTION, iid)));
      await batch.commit();

      if (usuarioLogado && registrarAcao && insc) {
        const atl = atletas.find((a) => a.id === insc.atletaId);
        registrarAcao(
          usuarioLogado.id,
          usuarioLogado.nome,
          "Removeu inscrição",
          `${atl?.nome || insc.atletaId} — ${insc.provaNome || insc.provaId}`,
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
  };
}
