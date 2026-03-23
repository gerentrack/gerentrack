/**
 * useMedalhasChamada.js
 * Hook dual-persistence (localStorage + Firestore) para:
 *   - Câmara de Chamada (presença por prova)
 *   - Controle de Entrega de Medalhas
 *
 * Offline-first: salva no localStorage imediatamente, sincroniza
 * com Firestore quando online. Fila de pendências para reconexão.
 *
 * Coleções Firestore:
 *   chamada/{eventoId_provaId_catId_sexo}
 *     → { [atletaId]: "confirmado" | "dns" | null }
 *
 *   medalhas/{eventoId_provaId_catId_sexo_atletaId}
 *     → { tipo, entregue, entregueEm, entregueBy, entregueByNome }
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { db, doc, setDoc, onSnapshot, collection, auth, onAuthStateChanged } from "../firebase";

// ── Helpers de chave ─────────────────────────────────────────────────────────
export const chamadaKey  = (eId, pId, cId, sx) => `${eId}_${pId}_${cId}_${sx}`;
export const medalhaKey  = (eId, pId, cId, sx, aId) => `${eId}_${pId}_${cId}_${sx}_${aId}`;

// ── localStorage helpers ─────────────────────────────────────────────────────
const LS_CHAMADA   = "mc_chamada";
const LS_MEDALHAS  = "mc_medalhas";
const LS_PENDENTES = "mc_pendentes";

function lsRead(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Hook principal ────────────────────────────────────────────────────────────
export function useMedalhasChamada(eventoId) {
  // Estado inicial: ler do localStorage (cache imediato, sem flicker)
  const [chamada,  setChamada]  = useState(() => {
    const all = lsRead(LS_CHAMADA, {});
    const filtered = {};
    Object.entries(all).forEach(([k, v]) => { if (k.startsWith(eventoId + "_")) filtered[k] = v; });
    return filtered;
  });
  const [medalhas, setMedalhas] = useState(() => {
    const all = lsRead(LS_MEDALHAS, {});
    const filtered = {};
    Object.entries(all).forEach(([k, v]) => { if (k.startsWith(eventoId + "_")) filtered[k] = v; });
    return filtered;
  });
  const [loading, setLoading] = useState(true);

  const unsubsRef = useRef([]);

  // ── Persistir no localStorage quando estado muda ───────────────────────────
  useEffect(() => {
    if (!eventoId) return;
    const all = lsRead(LS_CHAMADA, {});
    // Remover dados antigos deste evento e substituir pelos atuais
    Object.keys(all).forEach(k => { if (k.startsWith(eventoId + "_")) delete all[k]; });
    Object.assign(all, chamada);
    lsWrite(LS_CHAMADA, all);
  }, [chamada, eventoId]);

  useEffect(() => {
    if (!eventoId) return;
    const all = lsRead(LS_MEDALHAS, {});
    Object.keys(all).forEach(k => { if (k.startsWith(eventoId + "_")) delete all[k]; });
    Object.assign(all, medalhas);
    lsWrite(LS_MEDALHAS, all);
  }, [medalhas, eventoId]);

  // ── Firestore listeners (sync em tempo real) ───────────────────────────────
  useEffect(() => {
    if (!eventoId) return;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubsRef.current.forEach(u => u());
      unsubsRef.current = [];

      if (!user) {
        setChamada({});
        setMedalhas({});
        setLoading(false);
        return;
      }

      // ── Câmara de chamada ──
      const chamadaCol = collection(db, "chamada");
      const unsubChamada = onSnapshot(chamadaCol, snap => {
        const data = {};
        snap.docs.forEach(d => {
          if (d.id.startsWith(eventoId + "_")) data[d.id] = d.data();
        });
        // Merge: dados remotos + pendências locais não sincronizadas
        const pendentes = lsRead(LS_PENDENTES, []);
        const pendChamada = pendentes.filter(p => p.tipo === "chamada" && p.key.startsWith(eventoId + "_"));
        pendChamada.forEach(p => {
          if (!data[p.key]) data[p.key] = {};
          Object.assign(data[p.key], p.fields);
        });
        setChamada(data);
      }, (err) => {
        console.warn("[useMedalhasChamada] chamada listener error:", err.code);
      });

      // ── Medalhas ──
      const medalhasCol = collection(db, "medalhas");
      const unsubMedalhas = onSnapshot(medalhasCol, snap => {
        const data = {};
        snap.docs.forEach(d => {
          if (d.id.startsWith(eventoId + "_")) data[d.id] = d.data();
        });
        // Merge pendências locais
        const pendentes = lsRead(LS_PENDENTES, []);
        const pendMedalhas = pendentes.filter(p => p.tipo === "medalha" && p.key.startsWith(eventoId + "_"));
        pendMedalhas.forEach(p => {
          data[p.key] = { ...(data[p.key] || {}), ...p.fields };
        });
        setMedalhas(data);
        setLoading(false);
      }, (err) => {
        console.warn("[useMedalhasChamada] medalhas listener error:", err.code);
        setLoading(false);
      });

      unsubsRef.current = [unsubChamada, unsubMedalhas];
    });

    return () => {
      unsubAuth();
      unsubsRef.current.forEach(u => u());
    };
  }, [eventoId]);

  // ── Fila de pendências: sync quando reconectar ─────────────────────────────
  useEffect(() => {
    const processarPendentes = async () => {
      const pendentes = lsRead(LS_PENDENTES, []);
      if (pendentes.length === 0) return;

      const restantes = [];
      for (const p of pendentes) {
        try {
          const ref = doc(db, p.colecao, p.key);
          await setDoc(ref, p.fields, { merge: true });
          // Sucesso — não adiciona aos restantes
        } catch {
          restantes.push(p); // Falhou — manter na fila
        }
      }
      lsWrite(LS_PENDENTES, restantes);
    };

    const onOnline = () => { processarPendentes(); };
    window.addEventListener("online", onOnline);

    // Tentar processar ao montar (caso já esteja online com pendências)
    if (navigator.onLine) processarPendentes();

    return () => window.removeEventListener("online", onOnline);
  }, []);

  // ── Helper: escrever com fallback offline ──────────────────────────────────
  const escreverComFallback = useCallback(async (colecao, key, fields, tipoPendencia) => {
    // 1. Salvar no state (atualiza UI imediatamente)
    if (colecao === "chamada") {
      setChamada(prev => ({
        ...prev,
        [key]: { ...(prev[key] || {}), ...fields },
      }));
    } else {
      setMedalhas(prev => ({
        ...prev,
        [key]: { ...(prev[key] || {}), ...fields },
      }));
    }

    // 2. Tentar Firestore
    try {
      const ref = doc(db, colecao, key);
      await setDoc(ref, fields, { merge: true });
    } catch {
      // 3. Offline — adicionar à fila de pendências
      const pendentes = lsRead(LS_PENDENTES, []);
      // Evitar duplicatas: substituir pendência existente com mesma key+tipo
      const idx = pendentes.findIndex(p => p.key === key && p.tipo === tipoPendencia);
      const entrada = { tipo: tipoPendencia, colecao, key, fields, ts: Date.now() };
      if (idx >= 0) {
        pendentes[idx] = { ...pendentes[idx], fields: { ...pendentes[idx].fields, ...fields }, ts: Date.now() };
      } else {
        pendentes.push(entrada);
      }
      lsWrite(LS_PENDENTES, pendentes);
    }
  }, []);

  // ── Câmara: atualiza estado de um atleta ─────────────────────────────────
  const atualizarPresenca = useCallback(async (provaId, catId, sexo, atletaId, novoEstado) => {
    if (!eventoId) return;
    const key = chamadaKey(eventoId, provaId, catId, sexo);
    await escreverComFallback("chamada", key, { [atletaId]: novoEstado }, "chamada");
  }, [eventoId, escreverComFallback]);

  const getPresenca = useCallback((provaId, catId, sexo, atletaId) => {
    const key = chamadaKey(eventoId, provaId, catId, sexo);
    const val = (chamada[key] || {})[atletaId];
    if (val === "confirmado" || val === "dns") return val;
    return null;
  }, [eventoId, chamada]);

  const getPresencaProva = useCallback((provaId, catId, sexo) => {
    const key = chamadaKey(eventoId, provaId, catId, sexo);
    const raw = chamada[key] || {};
    const sanitized = {};
    Object.entries(raw).forEach(([aId, val]) => {
      sanitized[aId] = (val === "confirmado" || val === "dns") ? val : null;
    });
    return sanitized;
  }, [eventoId, chamada]);

  // ── Medalhas: marcar entrega ─────────────────────────────────────────────
  const marcarEntrega = useCallback(async (provaId, catId, sexo, atletaId, tipo, userId, userName) => {
    if (!eventoId) return;
    const key = medalhaKey(eventoId, provaId, catId, sexo, atletaId);
    const atual = medalhas[key] || {};
    const jaEntregue = atual.entregue;
    const fields = {
      tipo,
      entregue:       !jaEntregue,
      entregueEm:     !jaEntregue ? new Date().toISOString() : null,
      entregueBy:     !jaEntregue ? userId : null,
      entregueByNome: !jaEntregue ? userName : null,
    };
    await escreverComFallback("medalhas", key, fields, "medalha");
  }, [eventoId, medalhas, escreverComFallback]);

  // Gravar tipo (calculado) sem alterar entregue
  const definirTipoMedalha = useCallback(async (provaId, catId, sexo, atletaId, tipo) => {
    if (!eventoId) return;
    const key = medalhaKey(eventoId, provaId, catId, sexo, atletaId);
    await escreverComFallback("medalhas", key, { tipo, entregue: false }, "medalha");
  }, [eventoId, escreverComFallback]);

  const getMedalha = useCallback((provaId, catId, sexo, atletaId) => {
    const key = medalhaKey(eventoId, provaId, catId, sexo, atletaId);
    return medalhas[key] || { tipo: null, entregue: false };
  }, [eventoId, medalhas]);

  return {
    chamada, medalhas, loading,
    atualizarPresenca, getPresenca, getPresencaProva,
    marcarEntrega, definirTipoMedalha, getMedalha,
  };
}
