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
import { cacheGet, cacheSet } from "../lib/cacheDB";
import { normalizarNome } from "../shared/formatters/normalizarNome";

const COLLECTION = "atletas";
const STORE = "cache_atletas";


export function useAtletas() {
  const [atletas, setAtletasLocal] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const atletasRef = useRef(atletas);
  atletasRef.current = atletas;
  const firestoreLoaded = useRef(false);

  // ── Hidratar do IndexedDB (cache offline) ───────────────────────────────
  useEffect(() => {
    let cancelled = false;
    cacheGet(STORE).then((cached) => {
      if (!cancelled && cached && cached.length > 0 && !firestoreLoaded.current) setAtletasLocal(cached);
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
        setAtletasLocal(lista);
        cacheSet(STORE, lista).catch(() => {});
        setCarregando(false);
      },
      (err) => {
        if (err.code !== "permission-denied") console.error("[useAtletas] onSnapshot error:", err);
        setCarregando(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Verificar CPF duplicado ───────────────────────────────────────────────
  const cpfDuplicado = useCallback((cpf, excluirId = null) => {
    if (!cpf) return null;
    const limpo = cpf.replace(/\D/g, "");
    if (limpo.length < 11) return null;
    return atletasRef.current.find(
      (a) => a.id !== excluirId && a.cpf && a.cpf.replace(/\D/g, "") === limpo
    ) || null;
  }, []);

  // ── Verificar email duplicado (entre atletas) ──────────────────────────
  const emailDuplicado = useCallback((email, excluirId = null) => {
    if (!email || !email.trim()) return null;
    const norm = email.trim().toLowerCase();
    return atletasRef.current.find(
      (a) => a.id !== excluirId && a.email && a.email.trim().toLowerCase() === norm
    ) || null;
  }, []);

  // ── Adicionar 1 atleta ───────────────────────────────────────────────────
  const adicionarAtleta = useCallback(async (a) => {
    if (a.nome && a.nome.includes("@")) throw new Error("Nome não pode ser um e-mail.");
    if (a.nome) a = { ...a, nome: normalizarNome(a.nome) };
    const dupCpf = cpfDuplicado(a.cpf, a.id);
    if (dupCpf) throw new Error(`CPF já cadastrado para o atleta "${dupCpf.nome}".`);
    const dupEmail = emailDuplicado(a.email, a.id);
    if (dupEmail) throw new Error(`E-mail já cadastrado para o atleta "${dupEmail.nome}".`);
    const docRef = doc(db, COLLECTION, a.id);
    await setDoc(docRef, sanitize(a));
  }, [cpfDuplicado, emailDuplicado]);

  // ── Adicionar vários atletas em lote ─────────────────────────────────────
  const adicionarAtletasEmLote = useCallback(async (lista) => {
    if (!lista || lista.length === 0) return;
    lista = lista.map(a => a.nome ? { ...a, nome: normalizarNome(a.nome) } : a);
    // Verificar duplicatas contra base existente e dentro do próprio lote
    const cpfsLote = new Set();
    const emailsLote = new Set();
    for (const a of lista) {
      if (a.cpf) {
        const limpo = a.cpf.replace(/\D/g, "");
        if (limpo.length >= 11) {
          const dup = cpfDuplicado(limpo, a.id);
          if (dup) throw new Error(`CPF ${a.cpf} já cadastrado para "${dup.nome}". Import cancelado.`);
          if (cpfsLote.has(limpo)) throw new Error(`CPF ${a.cpf} duplicado dentro do lote (${a.nome}). Import cancelado.`);
          cpfsLote.add(limpo);
        }
      }
      if (a.email && a.email.trim()) {
        const norm = a.email.trim().toLowerCase();
        const dup = emailDuplicado(norm, a.id);
        if (dup) throw new Error(`E-mail ${a.email} já cadastrado para "${dup.nome}". Import cancelado.`);
        if (emailsLote.has(norm)) throw new Error(`E-mail ${a.email} duplicado dentro do lote (${a.nome}). Import cancelado.`);
        emailsLote.add(norm);
      }
    }
    const LOTE = 500;
    for (let i = 0; i < lista.length; i += LOTE) {
      const batch = writeBatch(db);
      lista.slice(i, i + LOTE).forEach((a) =>
        batch.set(doc(db, COLLECTION, a.id), sanitize(a))
      );
      await batch.commit();
    }
  }, [cpfDuplicado, emailDuplicado]);

  // ── Atualizar 1 atleta ───────────────────────────────────────────────────
  const atualizarAtleta = useCallback(async (a) => {
    if (a.nome && a.nome.includes("@")) throw new Error("Nome não pode ser um e-mail.");
    if (a.nome) a = { ...a, nome: normalizarNome(a.nome) };
    const dupCpf = cpfDuplicado(a.cpf, a.id);
    if (dupCpf) throw new Error(`CPF já cadastrado para o atleta "${dupCpf.nome}".`);
    const dupEmail = emailDuplicado(a.email, a.id);
    if (dupEmail) throw new Error(`E-mail já cadastrado para o atleta "${dupEmail.nome}".`);
    const docRef = doc(db, COLLECTION, a.id);
    await setDoc(docRef, sanitize(a));
  }, [cpfDuplicado, emailDuplicado]);

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
