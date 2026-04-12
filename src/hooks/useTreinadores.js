/**
 * useTreinadores.js
 * Substitui useLocalStorage("atl_treinadores") por coleção Firestore.
 *
 * Estrutura Firestore:
 *   treinadores/
 *     {id} → { nome, email, cpf, cargo, equipeId, organizadorId, permissoes, ... }
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

const COLLECTION = "treinadores";
const STORE = "cache_treinadores";


export function useTreinadores() {
  const [treinadores, setLocal] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const ref = useRef(treinadores);
  ref.current = treinadores;

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
        if (err.code !== "permission-denied") console.error("[useTreinadores] onSnapshot error:", err);
        setCarregando(false);
      }
    );
    return () => unsub();
  }, []);

  const adicionarTreinador = useCallback(async (tr) => {
    const { senha, ...semSenha } = tr;
    await setDoc(doc(db, COLLECTION, tr.id), sanitize(semSenha));
  }, []);

  const atualizarTreinador = useCallback(async (tr) => {
    const { senha, ...semSenha } = tr;
    await setDoc(doc(db, COLLECTION, tr.id), sanitize(semSenha));
  }, []);

  const excluirTreinador = useCallback(async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }, []);

  const resetTreinadores = useCallback(async () => {
    const todos = ref.current;
    if (todos.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < todos.length; i += LOTE) {
      const batch = writeBatch(db);
      todos.slice(i, i + LOTE).forEach(tr =>
        batch.delete(doc(db, COLLECTION, tr.id))
      );
      await batch.commit();
    }
  }, []);

  const importarTreinadores = useCallback(async (lista) => {
    if (!Array.isArray(lista) || lista.length === 0) return;
    await resetTreinadores();
    const LOTE = 500;
    for (let i = 0; i < lista.length; i += LOTE) {
      const batch = writeBatch(db);
      lista.slice(i, i + LOTE).forEach(tr => {
        const { senha, ...semSenha } = tr;
        batch.set(doc(db, COLLECTION, tr.id), sanitize(semSenha));
      });
      await batch.commit();
    }
  }, [resetTreinadores]);

  // Setter compatível com padrão antigo (function updater)
  const setTreinadores = useCallback(async (updaterOrValue) => {
    const current = ref.current;
    const newValue = typeof updaterOrValue === "function" ? updaterOrValue(current) : updaterOrValue;
    if (!Array.isArray(newValue)) return;

    const newIds = new Set(newValue.map(tr => tr.id));
    const oldIds = new Set(current.map(tr => tr.id));

    const removidos = current.filter(tr => !newIds.has(tr.id));
    const adicionados = newValue.filter(tr => !oldIds.has(tr.id));
    const atualizados = newValue.filter(tr => {
      if (!oldIds.has(tr.id)) return false;
      const old = current.find(x => x.id === tr.id);
      return JSON.stringify(old) !== JSON.stringify(tr);
    });

    const ops = [...adicionados, ...atualizados];
    if (ops.length === 0 && removidos.length === 0) return;

    const LOTE = 500;
    const all = [...ops.map(tr => ({ type: "set", tr })), ...removidos.map(tr => ({ type: "del", tr }))];
    for (let i = 0; i < all.length; i += LOTE) {
      const batch = writeBatch(db);
      all.slice(i, i + LOTE).forEach(op => {
        const { senha, ...semSenha } = op.tr;
        if (op.type === "set") batch.set(doc(db, COLLECTION, op.tr.id), sanitize(semSenha));
        else batch.delete(doc(db, COLLECTION, op.tr.id));
      });
      await batch.commit();
    }
  }, []);

  return {
    treinadores,
    carregando,
    treinadoresRef: ref,
    adicionarTreinador,
    atualizarTreinador,
    excluirTreinador,
    setTreinadores,
    resetTreinadores,
    importarTreinadores,
  };
}
