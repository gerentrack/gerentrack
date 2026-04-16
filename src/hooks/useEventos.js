/**
 * useEventos.js
 * Substitui useLocalStorage("atl_eventos") por coleção Firestore.
 *
 * Estrutura Firestore:
 *   eventos/
 *     {id} → { nome, data, provas, programaHorario, seriacao, ... }
 *
 * Cada documento = 1 evento com seu próprio ID.
 * Resolve o problema de limite de 1MB por documento no Firestore
 * quando todos os eventos ficavam num único documento "state/atl_eventos".
 *
 * IMPORTANTE: A lógica de negócio (geração de slug, statusAprovacao, etc.)
 * permanece no App.jsx. Este hook é puramente de persistência.
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

const COLLECTION = "eventos";
const STORE = "cache_eventos";


export function useEventos() {
  const [eventos, setEventosLocal] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const eventosRef = useRef(eventos);
  eventosRef.current = eventos;

  // ── Hidratar do IndexedDB (cache offline) ───────────────────────────────
  useEffect(() => {
    let cancelled = false;
    cacheGet(STORE).then((cached) => {
      if (!cancelled && cached && cached.length > 0) setEventosLocal(cached);
    });
    return () => { cancelled = true; };
  }, []);

  // ── Escuta em tempo real toda a coleção ──────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, COLLECTION),
      (snap) => {
        const lista = [];
        snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
        lista.sort((a, b) => {
          if (a.data && b.data) return b.data.localeCompare(a.data);
          return 0;
        });
        setEventosLocal(lista);
        cacheSet(STORE, lista).catch(() => {});
        setCarregando(false);
      },
      (err) => {
        if (err.code !== "permission-denied") console.error("[useEventos] onSnapshot error:", err);
        setCarregando(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Adicionar 1 evento ───────────────────────────────────────────────────
  const _adicionarEvento = useCallback(async (ev) => {
    const docRef = doc(db, COLLECTION, ev.id);
    await setDoc(docRef, sanitize(ev));
  }, []);

  // ── Atualizar / editar 1 evento ──────────────────────────────────────────
  // Usa merge:true para não sobrescrever campos que não estão no objeto
  // (ex: logoCompeticao, dataEncerramentoInscricoes quando form não os inclui)
  const _editarEvento = useCallback(async (ev) => {
    const docRef = doc(db, COLLECTION, ev.id);
    const camposEnviados = Object.keys(ev).filter(k => k !== "id");
    console.warn(`[useEventos] _editarEvento id=${ev.id} campos=[${camposEnviados.join(",")}]`, new Error().stack?.split("\n").slice(1, 4).join(" ← "));
    await setDoc(docRef, sanitize(ev), { merge: true });
  }, []);

  // ── Atualizar campos parciais de 1 evento (merge) ────────────────────────
  // Usa setDoc com { merge: true } para gravar APENAS os campos passados,
  // sem sobrescrever campos alterados por outro dispositivo/aba.
  const _atualizarCamposEvento = useCallback(async (id, campos) => {
    const docRef = doc(db, COLLECTION, id);
    const camposEnviados = Object.keys(campos);
    console.warn(`[useEventos] _atualizarCamposEvento id=${id} campos=[${camposEnviados.join(",")}]`, new Error().stack?.split("\n").slice(1, 4).join(" ← "));
    await setDoc(docRef, sanitize(campos), { merge: true });
  }, []);

  // ── Atualizar múltiplos eventos em lote ──────────────────────────────────
  // Usado pelo useEffect de auto-gestão de inscrições no App.jsx,
  // que pode precisar atualizar vários eventos de uma vez.
  const _atualizarEventosEmLote = useCallback(async (listaAtualizada) => {
    if (!listaAtualizada || listaAtualizada.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < listaAtualizada.length; i += LOTE) {
      const batch = writeBatch(db);
      listaAtualizada.slice(i, i + LOTE).forEach(ev =>
        batch.set(doc(db, COLLECTION, ev.id), sanitize(ev), { merge: true })
      );
      await batch.commit();
    }
  }, []);

  // ── Excluir 1 evento por ID ──────────────────────────────────────────────
  const excluirEventoPorId = useCallback(async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }, []);

  // ── Reset total (limparTodosDados) ───────────────────────────────────────
  const resetEventos = useCallback(async () => {
    const todos = eventosRef.current;
    if (todos.length === 0) return;
    const LOTE = 500;
    for (let i = 0; i < todos.length; i += LOTE) {
      const batch = writeBatch(db);
      todos.slice(i, i + LOTE).forEach(ev =>
        batch.delete(doc(db, COLLECTION, ev.id))
      );
      await batch.commit();
    }
  }, []);

  // ── Importar backup ──────────────────────────────────────────────────────
  const importarEventos = useCallback(async (lista) => {
    if (!Array.isArray(lista) || lista.length === 0) return;
    // 1. Apaga todos os eventos existentes
    await resetEventos();
    // 2. Importa em lotes de 500
    const LOTE = 500;
    for (let i = 0; i < lista.length; i += LOTE) {
      const batch = writeBatch(db);
      lista.slice(i, i + LOTE).forEach(ev =>
        batch.set(doc(db, COLLECTION, ev.id), sanitize(ev))
      );
      await batch.commit();
    }
  }, [resetEventos]);

  return {
    eventos,
    carregando,
    eventosRef,
    _adicionarEvento,
    _editarEvento,
    _atualizarCamposEvento,
    _atualizarEventosEmLote,
    excluirEventoPorId,
    resetEventos,
    importarEventos,
  };
}
