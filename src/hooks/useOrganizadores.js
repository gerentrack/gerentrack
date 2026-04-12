/**
 * useOrganizadores.js
 * Substitui useLocalStorage("atl_organizadores") por coleção Firestore.
 *
 * Estrutura Firestore:
 *   organizadores/
 *     {id} → { nome, entidade, email, cnpj, status, plano, ... }
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

const COLLECTION = "organizadores";
const STORE = "cache_organizadores";


export function useOrganizadores() {
  const [organizadores, setLocal] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const ref = useRef(organizadores);
  ref.current = organizadores;

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
        if (err.code !== "permission-denied") console.error("[useOrganizadores] onSnapshot error:", err);
        setCarregando(false);
      }
    );
    return () => unsub();
  }, []);

  const adicionarOrganizador = useCallback(async (o) => {
    const { senha, ...semSenha } = o;
    await setDoc(doc(db, COLLECTION, o.id), sanitize(semSenha));
  }, []);

  const atualizarOrganizador = useCallback(async (o) => {
    const { senha, ...semSenha } = o;
    await setDoc(doc(db, COLLECTION, o.id), sanitize(semSenha));
  }, []);

  const excluirOrganizador = useCallback(async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }, []);

  const resetOrganizadores = useCallback(async () => {
    const todos = ref.current;
    if (todos.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < todos.length; i += LOTE) {
      const batch = writeBatch(db);
      todos.slice(i, i + LOTE).forEach(o =>
        batch.delete(doc(db, COLLECTION, o.id))
      );
      await batch.commit();
    }
  }, []);

  const importarOrganizadores = useCallback(async (lista) => {
    if (!Array.isArray(lista) || lista.length === 0) return;
    await resetOrganizadores();
    const LOTE = 500;
    for (let i = 0; i < lista.length; i += LOTE) {
      const batch = writeBatch(db);
      lista.slice(i, i + LOTE).forEach(o => {
        const { senha, ...semSenha } = o;
        batch.set(doc(db, COLLECTION, o.id), sanitize(semSenha));
      });
      await batch.commit();
    }
  }, [resetOrganizadores]);

  // Setter compatível com padrão antigo (function updater)
  const setOrganizadores = useCallback(async (updaterOrValue) => {
    const current = ref.current;
    const newValue = typeof updaterOrValue === "function" ? updaterOrValue(current) : updaterOrValue;
    if (!Array.isArray(newValue)) return;

    const newIds = new Set(newValue.map(o => o.id));
    const oldIds = new Set(current.map(o => o.id));

    const removidos = current.filter(o => !newIds.has(o.id));
    const adicionados = newValue.filter(o => !oldIds.has(o.id));
    const atualizados = newValue.filter(o => {
      if (!oldIds.has(o.id)) return false;
      const old = current.find(x => x.id === o.id);
      return JSON.stringify(old) !== JSON.stringify(o);
    });

    const ops = [...adicionados, ...atualizados];
    if (ops.length === 0 && removidos.length === 0) return;

    const LOTE = 500;
    const all = [...ops.map(o => ({ type: "set", o })), ...removidos.map(o => ({ type: "del", o }))];
    for (let i = 0; i < all.length; i += LOTE) {
      const batch = writeBatch(db);
      all.slice(i, i + LOTE).forEach(op => {
        const { senha, ...semSenha } = op.o;
        if (op.type === "set") batch.set(doc(db, COLLECTION, op.o.id), sanitize(semSenha));
        else batch.delete(doc(db, COLLECTION, op.o.id));
      });
      await batch.commit();
    }
  }, []);

  return {
    organizadores,
    carregando,
    organizadoresRef: ref,
    adicionarOrganizador,
    atualizarOrganizador,
    excluirOrganizador,
    setOrganizadores,
    resetOrganizadores,
    importarOrganizadores,
  };
}
