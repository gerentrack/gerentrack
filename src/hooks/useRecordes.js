/**
 * useRecordes.js
 * Substitui useLocalStorage("atl_recordes") por coleção Firestore.
 *
 * Estrutura Firestore:
 *   recordes/
 *     {id} → { nome, sigla, escopo, estado, registros: [...], ... }
 *
 * Cada documento = 1 tipo de recorde com seus registros.
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
import { cacheGet, cacheSet } from "../lib/cacheDB";

const COLLECTION = "recordes";
const STORE = "cache_recordes";


export function useRecordes() {
  const [recordes, setLocal] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const ref = useRef(recordes);
  ref.current = recordes;

  useEffect(() => {
    let cancelled = false;
    cacheGet(STORE).then((cached) => {
      if (!cancelled && cached && cached.length > 0) setLocal(cached);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, COLLECTION),
      (snap) => {
        const lista = [];
        snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
        setLocal(lista);
        cacheSet(STORE, lista).catch(() => {});
        setCarregando(false);
      },
      (err) => {
        if (err.code !== "permission-denied") console.error("[useRecordes] onSnapshot error:", err);
        setCarregando(false);
      }
    );
    return () => unsub();
  }, []);

  const resetRecordes = useCallback(async () => {
    const todos = ref.current;
    if (todos.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < todos.length; i += LOTE) {
      const batch = writeBatch(db);
      todos.slice(i, i + LOTE).forEach(r =>
        batch.delete(doc(db, COLLECTION, r.id))
      );
      await batch.commit();
    }
  }, []);

  const importarRecordes = useCallback(async (lista) => {
    if (!Array.isArray(lista) || lista.length === 0) return;
    await resetRecordes();
    const LOTE = 500;
    for (let i = 0; i < lista.length; i += LOTE) {
      const batch = writeBatch(db);
      lista.slice(i, i + LOTE).forEach(r =>
        batch.set(doc(db, COLLECTION, r.id), sanitize(r))
      );
      await batch.commit();
    }
  }, [resetRecordes]);

  // Setter compatível com padrão antigo (function updater)
  const setRecordes = useCallback(async (updaterOrValue) => {
    const current = ref.current;
    const newValue = typeof updaterOrValue === "function" ? updaterOrValue(current) : updaterOrValue;
    if (!Array.isArray(newValue)) return;

    const newIds = new Set(newValue.map(r => r.id));
    const oldIds = new Set(current.map(r => r.id));

    const removidos = current.filter(r => !newIds.has(r.id));
    const adicionados = newValue.filter(r => !oldIds.has(r.id));
    const atualizados = newValue.filter(r => {
      if (!oldIds.has(r.id)) return false;
      const old = current.find(x => x.id === r.id);
      return JSON.stringify(old) !== JSON.stringify(r);
    });

    const ops = [...adicionados, ...atualizados];
    if (ops.length === 0 && removidos.length === 0) return;

    const LOTE = 500;
    const all = [...ops.map(r => ({ type: "set", r })), ...removidos.map(r => ({ type: "del", r }))];
    for (let i = 0; i < all.length; i += LOTE) {
      const batch = writeBatch(db);
      all.slice(i, i + LOTE).forEach(op => {
        if (op.type === "set") batch.set(doc(db, COLLECTION, op.r.id), sanitize(op.r));
        else batch.delete(doc(db, COLLECTION, op.r.id));
      });
      await batch.commit();
    }
  }, []);

  return {
    recordes,
    carregando,
    recordesRef: ref,
    setRecordes,
    resetRecordes,
    importarRecordes,
  };
}
