/**
 * useEquipes.js
 * Substitui useLocalStorage("atl_equipes") por coleção Firestore.
 *
 * Estrutura Firestore:
 *   equipes/
 *     {id} → { nome, cnpj, senha, ... }
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

const COLLECTION = "equipes";


export function useEquipes() {
  const [equipes, setEquipesLocal] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const equipesRef = useRef(equipes);
  equipesRef.current = equipes;

  // ── Escuta em tempo real toda a coleção ──────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, COLLECTION),
      (snap) => {
        const lista = [];
        snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
        setEquipesLocal(lista);
        setCarregando(false);
      },
      (err) => {
        console.error("[useEquipes] onSnapshot error:", err);
        setCarregando(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Adicionar 1 equipe ───────────────────────────────────────────────────
  const adicionarEquipe = useCallback(async (eq) => {
    await setDoc(doc(db, COLLECTION, eq.id), sanitize(eq));
  }, []);

  // ── Atualizar 1 equipe ───────────────────────────────────────────────────
  const atualizarEquipe = useCallback(async (eq) => {
    await setDoc(doc(db, COLLECTION, eq.id), sanitize(eq));
  }, []);

  // ── Merge parcial de 1 equipe (editarEquipeAdmin) ────────────────────────
  const mergeEquipe = useCallback(async (eq) => {
    const atual = equipesRef.current.find(e => e.id === eq.id);
    if (!atual) return;
    await setDoc(doc(db, COLLECTION, eq.id), sanitize({ ...atual, ...eq }));
  }, []);

  // ── Excluir 1 equipe ─────────────────────────────────────────────────────
  const excluirEquipePorId = useCallback(async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }, []);

  // ── Atualizar senha em todas as equipes que batem pelo CNPJ ──────────────
  // Usado em aplicarSenhaTemp e atualizarSenha
  const atualizarSenhaEquipes = useCallback(async (cnpj, senha, senhaTemporaria) => {
    if (!cnpj) return;
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length < 14) return;
    const matches = equipesRef.current.filter(
      e => e.cnpj && e.cnpj.replace(/\D/g, '') === cnpjLimpo
    );
    if (matches.length === 0) return;
    const batch = writeBatch(db);
    matches.forEach(e =>
      batch.set(doc(db, COLLECTION, e.id), sanitize({
        ...e,
        senha,
        ...(senhaTemporaria !== undefined ? { senhaTemporaria } : {}),
      }))
    );
    await batch.commit();
  }, []);

  // ── Atualizar campo específico de 1 equipe por ID ────────────────────────
  // Usado em aplicarSenhaTemp / atualizarSenha para a equipe específica
  const atualizarCamposEquipe = useCallback(async (id, campos) => {
    const atual = equipesRef.current.find(e => e.id === id);
    if (!atual) return;
    await setDoc(doc(db, COLLECTION, id), sanitize({ ...atual, ...campos }));
  }, []);

  // ── Reset total (limparTodosDados) ───────────────────────────────────────
  const resetEquipes = useCallback(async () => {
    const todas = equipesRef.current;
    if (todas.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < todas.length; i += LOTE) {
      const batch = writeBatch(db);
      todas.slice(i, i + LOTE).forEach(e =>
        batch.delete(doc(db, COLLECTION, e.id))
      );
      await batch.commit();
    }
  }, []);

  // ── Importar backup ──────────────────────────────────────────────────────
  const importarEquipes = useCallback(async (lista) => {
    if (!Array.isArray(lista) || lista.length === 0) return;
    await resetEquipes();
    const LOTE = 500;
    for (let i = 0; i < lista.length; i += LOTE) {
      const batch = writeBatch(db);
      lista.slice(i, i + LOTE).forEach(eq =>
        batch.set(doc(db, COLLECTION, eq.id), sanitize(eq))
      );
      await batch.commit();
    }
  }, [resetEquipes]);

  return {
    equipes,
    carregando,
    adicionarEquipe,
    atualizarEquipe,
    mergeEquipe,
    excluirEquipePorId,
    atualizarSenhaEquipes,
    atualizarCamposEquipe,
    resetEquipes,
    importarEquipes,
    equipesRef,
  };
}
