/**
 * useFuncionarios.js
 * Substitui useLocalStorage("atl_funcionarios") por coleção Firestore.
 *
 * Estrutura Firestore:
 *   funcionarios/
 *     {id} → { nome, email, cpf, cargo, organizadorId, permissoes, ... }
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

const COLLECTION = "funcionarios";
const STORE = "cache_funcionarios";


export function useFuncionarios() {
  const [funcionarios, setLocal] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const ref = useRef(funcionarios);
  ref.current = funcionarios;

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
        if (err.code !== "permission-denied") console.error("[useFuncionarios] onSnapshot error:", err);
        setCarregando(false);
      }
    );
    return () => unsub();
  }, []);

  const adicionarFuncionario = useCallback(async (f) => {
    const { senha, ...semSenha } = f;
    await setDoc(doc(db, COLLECTION, f.id), sanitize(semSenha));
  }, []);

  const atualizarFuncionario = useCallback(async (f) => {
    const { senha, ...semSenha } = f;
    await setDoc(doc(db, COLLECTION, f.id), sanitize(semSenha));
  }, []);

  const excluirFuncionario = useCallback(async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }, []);

  const resetFuncionarios = useCallback(async () => {
    const todos = ref.current;
    if (todos.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < todos.length; i += LOTE) {
      const batch = writeBatch(db);
      todos.slice(i, i + LOTE).forEach(f =>
        batch.delete(doc(db, COLLECTION, f.id))
      );
      await batch.commit();
    }
  }, []);

  const importarFuncionarios = useCallback(async (lista) => {
    if (!Array.isArray(lista) || lista.length === 0) return;
    await resetFuncionarios();
    const LOTE = 500;
    for (let i = 0; i < lista.length; i += LOTE) {
      const batch = writeBatch(db);
      lista.slice(i, i + LOTE).forEach(f => {
        const { senha, ...semSenha } = f;
        batch.set(doc(db, COLLECTION, f.id), sanitize(semSenha));
      });
      await batch.commit();
    }
  }, [resetFuncionarios]);

  // Setter compatível com padrão antigo (function updater)
  const setFuncionarios = useCallback(async (updaterOrValue) => {
    const current = ref.current;
    const newValue = typeof updaterOrValue === "function" ? updaterOrValue(current) : updaterOrValue;
    if (!Array.isArray(newValue)) return;

    const newIds = new Set(newValue.map(f => f.id));
    const oldIds = new Set(current.map(f => f.id));

    const removidos = current.filter(f => !newIds.has(f.id));
    const adicionados = newValue.filter(f => !oldIds.has(f.id));
    const atualizados = newValue.filter(f => {
      if (!oldIds.has(f.id)) return false;
      const old = current.find(x => x.id === f.id);
      return JSON.stringify(old) !== JSON.stringify(f);
    });

    const ops = [...adicionados, ...atualizados];
    if (ops.length === 0 && removidos.length === 0) return;

    const LOTE = 500;
    const all = [...ops.map(f => ({ type: "set", f })), ...removidos.map(f => ({ type: "del", f }))];
    for (let i = 0; i < all.length; i += LOTE) {
      const batch = writeBatch(db);
      all.slice(i, i + LOTE).forEach(op => {
        const { senha, ...semSenha } = op.f;
        if (op.type === "set") batch.set(doc(db, COLLECTION, op.f.id), sanitize(semSenha));
        else batch.delete(doc(db, COLLECTION, op.f.id));
      });
      await batch.commit();
    }
  }, []);

  return {
    funcionarios,
    carregando,
    funcionariosRef: ref,
    adicionarFuncionario,
    atualizarFuncionario,
    excluirFuncionario,
    setFuncionarios,
    resetFuncionarios,
    importarFuncionarios,
  };
}
