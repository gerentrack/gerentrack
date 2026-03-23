/**
 * useMedalhasChamada.js
 * Hook Firestore com tempo real para:
 *   - Câmara de Chamada (presença por prova)
 *   - Controle de Entrega de Medalhas
 *
 * Coleções Firestore:
 *   chamada/{eventoId_provaId_catId_sexo}
 *     → { [atletaId]: "ausente" | "presente" | "confirmado" }
 *
 *   medalhas/{eventoId_provaId_catId_sexo_atletaId}
 *     → { tipo: "ouro"|"prata"|"bronze"|"participacao"|null,
 *          entregue: boolean, entregueEm: ISO, entregueBy: userId }
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { db, doc, setDoc, onSnapshot, collection, auth, onAuthStateChanged } from "../firebase";

// ── Helpers de chave ─────────────────────────────────────────────────────────
export const chamadaKey  = (eId, pId, cId, sx) => `${eId}_${pId}_${cId}_${sx}`;
export const medalhaKey  = (eId, pId, cId, sx, aId) => `${eId}_${pId}_${cId}_${sx}_${aId}`;

// ── Hook principal ────────────────────────────────────────────────────────────
export function useMedalhasChamada(eventoId) {
  const [chamada,  setChamada]  = useState({}); // { [chamadaKey]: { [atletaId]: estado } }
  const [medalhas, setMedalhas] = useState({}); // { [medalhaKey]: { tipo, entregue, ... } }
  const [loading,  setLoading]  = useState(true);

  const unsubsRef = useRef([]);

  useEffect(() => {
    if (!eventoId) return;

    // Aguarda Firebase Auth estar pronto antes de criar listeners
    // (coleções chamada/medalhas exigem request.auth != null para leitura)
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Limpa listeners anteriores
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
        if (d.id.startsWith(eventoId + "_")) {
          data[d.id] = d.data();
        }
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
        if (d.id.startsWith(eventoId + "_")) {
          data[d.id] = d.data();
        }
      });
      setMedalhas(data);
      setLoading(false);
    }, (err) => {
      console.warn("[useMedalhasChamada] medalhas listener error:", err.code);
      setLoading(false);
    });

    unsubsRef.current = [unsubChamada, unsubMedalhas];
    }); // fim onAuthStateChanged callback

    return () => {
      unsubAuth();
      unsubsRef.current.forEach(u => u());
    };
  }, [eventoId]);

  // ── Câmara: atualiza estado de um atleta ─────────────────────────────────
  // estados: null (sem marcação) | "confirmado" | "dns"
  const atualizarPresenca = useCallback(async (provaId, catId, sexo, atletaId, novoEstado) => {
    if (!eventoId) return;
    const key  = chamadaKey(eventoId, provaId, catId, sexo);
    const ref  = doc(db, "chamada", key);
    const atual = chamada[key] || {};
    await setDoc(ref, { ...atual, [atletaId]: novoEstado }, { merge: true });
  }, [eventoId, chamada]);

  const getPresenca = useCallback((provaId, catId, sexo, atletaId) => {
    const key = chamadaKey(eventoId, provaId, catId, sexo);
    const val = (chamada[key] || {})[atletaId];
    // Retrocompatibilidade: "ausente" e "presente" viram null
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
    const ref = doc(db, "medalhas", key);
    const atual = medalhas[key] || {};
    const jaEntregue = atual.entregue;
    await setDoc(ref, {
      tipo,
      entregue:    !jaEntregue,
      entregueEm:  !jaEntregue ? new Date().toISOString() : null,
      entregueBy:  !jaEntregue ? userId : null,
      entregueByNome: !jaEntregue ? userName : null,
    }, { merge: true });
  }, [eventoId, medalhas]);

  // Gravar tipo (calculado) sem alterar entregue
  const definirTipoMedalha = useCallback(async (provaId, catId, sexo, atletaId, tipo) => {
    if (!eventoId) return;
    const key = medalhaKey(eventoId, provaId, catId, sexo, atletaId);
    const ref = doc(db, "medalhas", key);
    await setDoc(ref, { tipo, entregue: false }, { merge: true });
  }, [eventoId]);

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
