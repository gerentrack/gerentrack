/**
 * useAtletasUsuarios.js
 * Substitui useLocalStorage("atl_atletas_usuarios") por coleção Firestore.
 *
 * Estrutura Firestore:
 *   atletasUsuarios/
 *     {id} → { nome, email, cpf, tipo: "atleta", organizadorId, ... }
 *
 * Cada documento = 1 atleta-usuário com seu próprio ID.
 * Resolve o problema de limite de 1MB por documento no Firestore.
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

const COLLECTION = "atletasUsuarios";
const STORE = "cache_atletasUsuarios";


export function useAtletasUsuarios() {
  const [atletasUsuarios, setLocal] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const ref = useRef(atletasUsuarios);
  ref.current = atletasUsuarios;
  const firestoreLoaded = useRef(false);

  // ── Hidratar do IndexedDB (cache offline) ───────────────────────────────
  useEffect(() => {
    let cancelled = false;
    cacheGet(STORE).then((cached) => {
      if (!cancelled && cached && cached.length > 0 && !firestoreLoaded.current) setLocal(cached);
    });
    return () => { cancelled = true; };
  }, []);

  // ── Escuta em tempo real toda a coleção ──────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, COLLECTION),
      (snap) => {
        firestoreLoaded.current = true;
        const lista = [];
        snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
        setLocal(lista);
        cacheSet(STORE, lista).catch(() => {});
        setCarregando(false);
      },
      (err) => {
        if (err.code !== "permission-denied") console.error("[useAtletasUsuarios] onSnapshot error:", err);
        setCarregando(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Adicionar 1 atleta-usuário ──────────────────────────────────────────
  const adicionarAtletaUsuario = useCallback(async (u) => {
    const { senha, ...semSenha } = u; // nunca persistir senha
    await setDoc(doc(db, COLLECTION, u.id), sanitize(semSenha));
  }, []);

  // ── Atualizar 1 atleta-usuário ──────────────────────────────────────────
  const atualizarAtletaUsuario = useCallback(async (u) => {
    const { senha, ...semSenha } = u;
    await setDoc(doc(db, COLLECTION, u.id), sanitize(semSenha));
  }, []);

  // ── Atualizar campos parciais (merge) ───────────────────────────────────
  const atualizarCamposAtletaUsuario = useCallback(async (id, campos) => {
    await setDoc(doc(db, COLLECTION, id), sanitize(campos), { merge: true });
  }, []);

  // ── Excluir 1 por ID ───────────────────────────────────────────────────
  const excluirAtletaUsuario = useCallback(async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }, []);

  // ── Filtrar/excluir por condição (retorna IDs removidos) ────────────────
  const filtrarAtletasUsuarios = useCallback(async (filterFn) => {
    const paraRemover = ref.current.filter(u => !filterFn(u));
    if (paraRemover.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < paraRemover.length; i += LOTE) {
      const batch = writeBatch(db);
      paraRemover.slice(i, i + LOTE).forEach(u =>
        batch.delete(doc(db, COLLECTION, u.id))
      );
      await batch.commit();
    }
  }, []);

  // ── Reset total (limparTodosDados) ───────────────────────────────────────
  const resetAtletasUsuarios = useCallback(async () => {
    const todos = ref.current;
    if (todos.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < todos.length; i += LOTE) {
      const batch = writeBatch(db);
      todos.slice(i, i + LOTE).forEach(u =>
        batch.delete(doc(db, COLLECTION, u.id))
      );
      await batch.commit();
    }
  }, []);

  // ── Importar backup ──────────────────────────────────────────────────────
  const importarAtletasUsuarios = useCallback(async (lista) => {
    if (!Array.isArray(lista) || lista.length === 0) return;
    await resetAtletasUsuarios();
    const LOTE = 500;
    for (let i = 0; i < lista.length; i += LOTE) {
      const batch = writeBatch(db);
      lista.slice(i, i + LOTE).forEach(u => {
        const { senha, ...semSenha } = u;
        batch.set(doc(db, COLLECTION, u.id), sanitize(semSenha));
      });
      await batch.commit();
    }
  }, [resetAtletasUsuarios]);

  // ── Setter compatível com padrão antigo (para migração gradual) ─────────
  // Aceita function updater: setAtletasUsuarios(prev => prev.filter(...))
  const setAtletasUsuarios = useCallback(async (updaterOrValue) => {
    const current = ref.current;
    const newValue = typeof updaterOrValue === "function" ? updaterOrValue(current) : updaterOrValue;
    if (!Array.isArray(newValue)) return;

    // Detectar adições, atualizações e remoções
    const newIds = new Set(newValue.map(u => u.id));
    const oldIds = new Set(current.map(u => u.id));

    const removidos = current.filter(u => !newIds.has(u.id));
    const adicionados = newValue.filter(u => !oldIds.has(u.id));
    const atualizados = newValue.filter(u => {
      if (!oldIds.has(u.id)) return false;
      const old = current.find(o => o.id === u.id);
      return JSON.stringify(old) !== JSON.stringify(u);
    });

    const ops = [...adicionados, ...atualizados];
    if (ops.length === 0 && removidos.length === 0) return;

    const LOTE = 500;
    const all = [...ops.map(u => ({ type: "set", u })), ...removidos.map(u => ({ type: "del", u }))];
    for (let i = 0; i < all.length; i += LOTE) {
      const batch = writeBatch(db);
      all.slice(i, i + LOTE).forEach(op => {
        const { senha, ...semSenha } = op.u;
        if (op.type === "set") batch.set(doc(db, COLLECTION, op.u.id), sanitize(semSenha));
        else batch.delete(doc(db, COLLECTION, op.u.id));
      });
      await batch.commit();
    }
  }, []);

  return {
    atletasUsuarios,
    carregando,
    atletasUsuariosRef: ref,
    adicionarAtletaUsuario,
    atualizarAtletaUsuario,
    atualizarCamposAtletaUsuario,
    excluirAtletaUsuario,
    filtrarAtletasUsuarios,
    setAtletasUsuarios,
    resetAtletasUsuarios,
    importarAtletasUsuarios,
  };
}
