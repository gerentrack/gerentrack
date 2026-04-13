/**
 * useRanking.js
 * Ranking separado por UF — cada estado tem seu próprio documento.
 *
 * Estrutura Firestore:
 *   ranking/
 *     MG → { entradas: [...] }
 *     SP → { entradas: [...] }
 *     MS → { entradas: [...] }
 *
 * NÃO existe documento BR — o nacional é a junção de todos os estados
 * feita no cliente (evita duplicação e limite de 1MB).
 *
 * Na leitura: escuta toda a coleção, junta todas as entradas em memória.
 * Na escrita: agrupa por eventoUf e salva em cada ranking/{UF}.
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
import { sanitize } from "../lib/utils/sanitize";

const COLLECTION = "ranking";

export function useRanking() {
  const [ranking, setLocal] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const ref = useRef(ranking);
  ref.current = ranking;

  // ── Escuta toda a coleção ranking/ e junta todas as entradas ────────────
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, COLLECTION),
      (snap) => {
        const todas = [];
        snap.forEach(d => {
          const data = d.data();
          if (Array.isArray(data.entradas)) {
            todas.push(...data.entradas);
          }
        });
        setLocal(todas);
        setCarregando(false);
      },
      (err) => {
        if (err.code !== "permission-denied") console.error("[useRanking] onSnapshot error:", err);
        setCarregando(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Salvar ranking (agrupa por UF e salva em cada documento) ────────────
  const setRanking = useCallback(async (updaterOrValue) => {
    const current = ref.current;
    const newValue = typeof updaterOrValue === "function" ? updaterOrValue(current) : updaterOrValue;
    if (!Array.isArray(newValue)) return;

    // Agrupar por UF
    const porUf = {};
    newValue.forEach(e => {
      const uf = (e.eventoUf || "").toUpperCase() || "OUTROS";
      if (!porUf[uf]) porUf[uf] = [];
      porUf[uf].push(e);
    });

    // UFs que tinham dados antes mas agora não (precisam ser limpas)
    const ufsAntigas = new Set(current.map(e => (e.eventoUf || "").toUpperCase() || "OUTROS"));
    const ufsNovas = new Set(Object.keys(porUf));

    const batch = writeBatch(db);
    // Salvar UFs com dados
    Object.entries(porUf).forEach(([uf, entradas]) => {
      batch.set(doc(db, COLLECTION, uf), sanitize({ entradas }));
    });
    // Limpar UFs que ficaram sem dados
    ufsAntigas.forEach(uf => {
      if (!ufsNovas.has(uf)) batch.set(doc(db, COLLECTION, uf), { entradas: [] });
    });
    await batch.commit();
  }, []);

  // ── Reset total ─────────────────────────────────────────────────────────
  const resetRanking = useCallback(async () => {
    const ufs = [...new Set(ref.current.map(e => (e.eventoUf || "").toUpperCase()).filter(Boolean))];
    if (ufs.length === 0) return;
    const batch = writeBatch(db);
    ufs.forEach(uf => batch.delete(doc(db, COLLECTION, uf)));
    await batch.commit();
  }, []);

  // ── Importar backup ─────────────────────────────────────────────────────
  const importarRanking = useCallback(async (lista) => {
    if (!Array.isArray(lista)) return;
    // Limpar tudo e regravar
    await resetRanking();
    ref.current = lista;
    await setRanking(lista);
  }, [setRanking, resetRanking]);

  return {
    ranking,
    carregando,
    rankingRef: ref,
    setRanking,
    resetRanking,
    importarRanking,
  };
}
