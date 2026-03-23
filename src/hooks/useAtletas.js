/**
 * useAtletas.js
 * Substitui useLocalStorage("atl_atletas") por coleção Firestore.
 *
 * Estrutura Firestore:
 *   atletas/
 *     {id} → { nome, cpf, dataNasc, equipeId, clube, ... }
 *
 * Cada documento = 1 atleta com seu próprio ID.
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

const COLLECTION = "atletas";


export function useAtletas() {
  const [atletas, setAtletasLocal] = useState(() => {
    try { const c = localStorage.getItem("cache_atletas"); return c ? JSON.parse(c) : []; }
    catch { return []; }
  });
  const [carregando, setCarregando] = useState(true);

  const atletasRef = useRef(atletas);
  atletasRef.current = atletas;

  // ── Escuta em tempo real toda a coleção ──────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, COLLECTION),
      (snap) => {
        const lista = [];
        snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
        setAtletasLocal(lista);
        try { localStorage.setItem("cache_atletas", JSON.stringify(lista)); } catch {}
        setCarregando(false);
      },
      (err) => {
        console.error("[useAtletas] onSnapshot error:", err);
        setCarregando(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Adicionar 1 atleta ───────────────────────────────────────────────────
  const adicionarAtleta = useCallback(async (a) => {
    const docRef = doc(db, COLLECTION, a.id);
    await setDoc(docRef, sanitize(a));
  }, []);

  // ── Adicionar vários atletas em lote ─────────────────────────────────────
  const adicionarAtletasEmLote = useCallback(async (lista) => {
    if (!lista || lista.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < lista.length; i += LOTE) {
      const batch = writeBatch(db);
      lista.slice(i, i + LOTE).forEach((a) =>
        batch.set(doc(db, COLLECTION, a.id), sanitize(a))
      );
      await batch.commit();
    }
  }, []);

  // ── Atualizar 1 atleta ───────────────────────────────────────────────────
  const atualizarAtleta = useCallback(async (a) => {
    const docRef = doc(db, COLLECTION, a.id);
    await setDoc(docRef, sanitize(a));
  }, []);

  // ── Excluir 1 atleta por ID (sem confirm — confirm fica no App.jsx) ──────
  const excluirAtletaPorId = useCallback(async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }, []);

  // ── Excluir vários atletas por Set de IDs ────────────────────────────────
  const excluirAtletasPorIds = useCallback(async (idsSet) => {
    const ids = [...idsSet];
    if (ids.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < ids.length; i += LOTE) {
      const batch = writeBatch(db);
      ids.slice(i, i + LOTE).forEach((id) =>
        batch.delete(doc(db, COLLECTION, id))
      );
      await batch.commit();
    }
  }, []);

  // ── Reset total (limparTodosDados) ───────────────────────────────────────
  const resetAtletas = useCallback(async () => {
    const todos = atletasRef.current;
    if (todos.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < todos.length; i += LOTE) {
      const batch = writeBatch(db);
      todos.slice(i, i + LOTE).forEach((a) =>
        batch.delete(doc(db, COLLECTION, a.id))
      );
      await batch.commit();
    }
  }, []);

  // ── Importar backup ──────────────────────────────────────────────────────
  const importarAtletas = useCallback(
    async (lista) => {
      if (!Array.isArray(lista) || lista.length === 0) return;
      await resetAtletas();
      await adicionarAtletasEmLote(lista);
    },
    [resetAtletas, adicionarAtletasEmLote]
  );

  return {
    atletas,
    carregando,
    adicionarAtleta,
    adicionarAtletasEmLote,
    atualizarAtleta,
    excluirAtletaPorId,
    excluirAtletasPorIds,
    resetAtletas,
    importarAtletas,
  };
}
