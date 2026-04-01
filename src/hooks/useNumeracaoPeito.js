/**
 * useNumeracaoPeito.js
 * Substitui useLocalStorage("atl_numeracao_peito") por coleção Firestore.
 *
 * Estrutura Firestore:
 *   numeracaoPeito/
 *     {eventoId} → { atletaId1: numero1, atletaId2: numero2, ... }
 *
 * Cada documento = numeração de peito de 1 evento.
 * Resolve o limite de 1MB por documento quando todos os eventos
 * ficavam num único documento "state/atl_numeracao_peito".
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
  auth,
  onAuthStateChanged,
} from "../firebase";
import { sanitize } from "../lib/utils/sanitize";
import { cacheGet, cacheSet } from "../lib/cacheDB";

const COLLECTION = "numeracaoPeito";
const STORE = "cache_numeracaoPeito";

export function useNumeracaoPeito() {
  const [numeracaoPeito, setLocal] = useState({});
  const [carregando, setCarregando] = useState(true);

  const ref = useRef(numeracaoPeito);
  ref.current = numeracaoPeito;

  // ── Hidratar do IndexedDB (cache offline) ───────────────────────────────
  useEffect(() => {
    let cancelled = false;
    cacheGet(STORE).then((cached) => {
      if (!cancelled && cached && Object.keys(cached).length > 0) setLocal(cached);
    });
    return () => { cancelled = true; };
  }, []);

  // ── Escuta em tempo real (só após auth) ──────────────────────────────────
  useEffect(() => {
    let unsubSnap = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubSnap) { unsubSnap(); unsubSnap = null; }
      if (!user) { setCarregando(false); return; }
      unsubSnap = onSnapshot(
        collection(db, COLLECTION),
        (snap) => {
          const dados = {};
          snap.forEach((d) => { dados[d.id] = d.data(); });
          setLocal(dados);
          cacheSet(STORE, dados).catch(() => {});
          setCarregando(false);
        },
        (err) => {
          console.error("[useNumeracaoPeito] onSnapshot error:", err);
          setCarregando(false);
        }
      );
    });
    return () => { unsubAuth(); if (unsubSnap) unsubSnap(); };
  }, []);

  // ── Migração lazy: state/atl_numeracao_peito → coleção individual ───────
  const migradoRef = useRef(false);
  useEffect(() => {
    if (carregando || migradoRef.current) return;
    if (Object.keys(ref.current).length > 0) return; // já tem dados na coleção
    migradoRef.current = true;

    getDoc(doc(db, "state", "atl_numeracao_peito")).then(async (snap) => {
      if (!snap.exists()) return;
      const legado = snap.data()?.value;
      if (!legado || typeof legado !== "object" || Object.keys(legado).length === 0) return;

      // Gravar cada evento como doc individual
      const entradas = Object.entries(legado);
      const LOTE = 500;
      for (let i = 0; i < entradas.length; i += LOTE) {
        const batch = writeBatch(db);
        entradas.slice(i, i + LOTE).forEach(([eid, mapping]) => {
          batch.set(doc(db, COLLECTION, eid), sanitize(mapping));
        });
        await batch.commit();
      }

      // Remover documento legado
      deleteDoc(doc(db, "state", "atl_numeracao_peito")).catch(() => {});
      // Limpar localStorage
      try { localStorage.removeItem("atl_numeracao_peito"); } catch {}
    }).catch(() => {});
  }, [carregando]);

  // ── Salvar numeração de 1 evento ─────────────────────────────────────────
  const setNumeracaoEvento = useCallback(async (eventoId, mapping) => {
    if (!eventoId) return;
    if (!mapping || Object.keys(mapping).length === 0) {
      await deleteDoc(doc(db, COLLECTION, eventoId));
    } else {
      await setDoc(doc(db, COLLECTION, eventoId), sanitize(mapping));
    }
  }, []);

  // ── Limpar numeração de 1 evento (usado ao excluir evento) ───────────────
  const limparNumeracaoEvento = useCallback(async (eventoId) => {
    if (!eventoId) return;
    await deleteDoc(doc(db, COLLECTION, eventoId)).catch(() => {});
  }, []);

  // ── Reset total (limparTodosDados) ───────────────────────────────────────
  const resetNumeracao = useCallback(async () => {
    const chaves = Object.keys(ref.current);
    if (chaves.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < chaves.length; i += LOTE) {
      const batch = writeBatch(db);
      chaves.slice(i, i + LOTE).forEach((eid) => {
        batch.delete(doc(db, COLLECTION, eid));
      });
      await batch.commit();
    }
  }, []);

  // ── Importar backup ──────────────────────────────────────────────────────
  const importarNumeracao = useCallback(async (obj) => {
    if (!obj || typeof obj !== "object") return;
    await resetNumeracao();
    const entradas = Object.entries(obj);
    const LOTE = 500;
    for (let i = 0; i < entradas.length; i += LOTE) {
      const batch = writeBatch(db);
      entradas.slice(i, i + LOTE).forEach(([eid, mapping]) => {
        batch.set(doc(db, COLLECTION, eid), sanitize(mapping));
      });
      await batch.commit();
    }
  }, [resetNumeracao]);

  return {
    numeracaoPeito,
    carregando,
    setNumeracaoEvento,
    limparNumeracaoEvento,
    resetNumeracao,
    importarNumeracao,
  };
}
