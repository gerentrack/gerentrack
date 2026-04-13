/**
 * useRanking.js
 * Substitui useLocalStorage("atl_ranking") por coleção Firestore por UF.
 *
 * Estrutura Firestore:
 *   ranking/
 *     BR → { entradas: [...] }   ← todas as entradas (nacional)
 *     MG → { entradas: [...] }   ← entradas de competições em MG
 *     SP → { entradas: [...] }   ← entradas de competições em SP
 *     ...
 *
 * Na leitura: carrega BR (nacional) por padrão. Filtra por UF no cliente.
 * Na escrita: salva em ranking/BR e no ranking/{UF} da competição.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  db,
  collection,
  doc,
  setDoc,
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

  // ── Escuta ranking/BR (nacional — contém todas as entradas) ─────────────
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, COLLECTION, "BR"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setLocal(data.entradas || []);
        } else {
          setLocal([]);
        }
        setCarregando(false);
      },
      (err) => {
        if (err.code !== "permission-denied") console.error("[useRanking] onSnapshot error:", err);
        setCarregando(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Salvar ranking (atualiza BR + UF específico) ────────────────────────
  const setRanking = useCallback(async (updaterOrValue) => {
    const current = ref.current;
    const newValue = typeof updaterOrValue === "function" ? updaterOrValue(current) : updaterOrValue;
    if (!Array.isArray(newValue)) return;

    // Salvar no BR (nacional)
    await setDoc(doc(db, COLLECTION, "BR"), sanitize({ entradas: newValue }));

    // Agrupar por UF e salvar em cada ranking/{UF}
    const porUf = {};
    newValue.forEach(e => {
      const uf = (e.eventoUf || "").toUpperCase();
      if (uf && uf !== "BR") {
        if (!porUf[uf]) porUf[uf] = [];
        porUf[uf].push(e);
      }
    });

    const batch = writeBatch(db);
    Object.entries(porUf).forEach(([uf, entradas]) => {
      batch.set(doc(db, COLLECTION, uf), sanitize({ entradas }));
    });
    if (Object.keys(porUf).length > 0) await batch.commit();
  }, []);

  // ── Reset total ─────────────────────────────────────────────────────────
  const resetRanking = useCallback(async () => {
    // Lê todas as UFs e deleta
    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTION, "BR"), { entradas: [] });
    // UFs conhecidas
    const ufs = [...new Set(ref.current.map(e => (e.eventoUf || "").toUpperCase()).filter(Boolean))];
    ufs.forEach(uf => batch.set(doc(db, COLLECTION, uf), { entradas: [] }));
    await batch.commit();
  }, []);

  // ── Importar backup ─────────────────────────────────────────────────────
  const importarRanking = useCallback(async (lista) => {
    if (!Array.isArray(lista)) return;
    ref.current = lista;
    await setRanking(lista);
  }, [setRanking]);

  return {
    ranking,
    carregando,
    rankingRef: ref,
    setRanking,
    resetRanking,
    importarRanking,
  };
}
