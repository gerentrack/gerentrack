/**
 * useMarchaJuizes.js
 * Hook dual-persistence (localStorage + Firestore) para:
 *   - Súmula digital de marcha atlética (juízes, advertências, DQs)
 *   - Upload de anexo (foto/PDF da súmula manual)
 *
 * Offline-first: salva no localStorage imediatamente, sincroniza
 * com Firestore quando online. Fila de pendências para reconexão.
 *
 * Coleção Firestore:
 *   marchaJuizes/{eventoId_provaId_catId_sexo}
 *     → { juizes, juizChefe, secretario, dados: { [atletaId]: {...} }, anexoUrl, anexoNome, anexoPath }
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { db, doc, setDoc, onSnapshot, collection, auth, onAuthStateChanged, storage, storageRef, uploadBytes, getDownloadURL, deleteObject } from "../firebase";
import { sanitizeForFirestore as sanitize } from "../lib/firestore/sanitize";

// ── Helpers de chave ─────────────────────────────────────────────────────────
export const marchaKey = (eId, pId, cId, sx) => `${eId}_${pId}_${cId}_${sx}`;

// ── localStorage helpers ─────────────────────────────────────────────────────
const LS_MARCHA    = "mc_marcha";
const LS_PENDENTES = "mc_pendentes"; // compartilhado com useMedalhasChamada

function lsRead(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Cálculo de totais (função pura exportável) ───────────────────────────────
export function calcMarchaTotals(dadosAtleta) {
  let tildes = 0, angles = 0;
  const judgesWithDq = new Set();
  for (let j = 0; j < 8; j++) {
    const jd = dadosAtleta?.[`j${j}`] || {};
    // Advertências (pá amarela): horário na coluna ~ ou <
    if (jd.r1t) tildes++;
    if (jd.r1l) angles++;
    // DQ (cartão vermelho): r1dq = horário, r2dq = tipo (informativo, não soma em ~/< )
    if (jd.r1dq) judgesWithDq.add(j);
  }
  return { tildes, angles, dqs: judgesWithDq.size };
}

// ── Helper: aplicar dot-notation no objeto (Firestore merge local) ───────────
function applyDotFields(obj, fields) {
  const result = JSON.parse(JSON.stringify(obj || {}));
  Object.entries(fields).forEach(([path, val]) => {
    const parts = path.split(".");
    let cur = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  });
  return result;
}

// ── Hook principal ────────────────────────────────────────────────────────────
export function useMarchaJuizes(eventoId) {
  // Estado inicial: ler do localStorage (cache imediato)
  const [marchaData, setMarchaData] = useState(() => {
    const all = lsRead(LS_MARCHA, {});
    const filtered = {};
    Object.entries(all).forEach(([k, v]) => { if (k.startsWith(eventoId + "_")) filtered[k] = v; });
    return filtered;
  });
  const [loading, setLoading] = useState(true);
  const unsubsRef = useRef([]);
  // Rastreia writes em andamento para evitar que onSnapshot sobrescreva updates otimistas
  const pendingFieldsRef = useRef({});

  // ── Persistir no localStorage quando estado muda ───────────────────────────
  useEffect(() => {
    if (!eventoId) return;
    const all = lsRead(LS_MARCHA, {});
    Object.keys(all).forEach(k => { if (k.startsWith(eventoId + "_")) delete all[k]; });
    Object.assign(all, marchaData);
    lsWrite(LS_MARCHA, all);
  }, [marchaData, eventoId]);

  // ── Firestore listener ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!eventoId) return;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubsRef.current.forEach(u => u());
      unsubsRef.current = [];

      if (!user) {
        setMarchaData({});
        setLoading(false);
        return;
      }

      const marchaCol = collection(db, "marchaJuizes");
      const unsubMarcha = onSnapshot(marchaCol, snap => {
        const data = {};
        snap.docs.forEach(d => {
          if (d.id.startsWith(eventoId + "_")) data[d.id] = d.data();
        });
        // Reconciliar pendências (localStorage + in-memory) com snapshot
        const pendentes = lsRead(LS_PENDENTES, []);
        let pendentesAlterado = false;

        // Processar pendências do localStorage (sobrevivem page reload)
        pendentes.forEach(p => {
          if (p.tipo !== "marcha" || !p.key.startsWith(eventoId + "_")) return;
          const snapDoc = data[p.key] || {};
          const stillPending = {};
          Object.entries(p.fields).forEach(([field, value]) => {
            const parts = field.split(".");
            let cur = snapDoc;
            for (const pt of parts) cur = cur?.[pt];
            if (cur === value) return; // confirmado pelo snapshot
            stillPending[field] = value;
          });
          if (Object.keys(stillPending).length > 0) {
            p.fields = stillPending;
            data[p.key] = applyDotFields(snapDoc, stillPending);
          } else {
            p._remover = true;
            pendentesAlterado = true;
          }
        });
        // Limpar pendências confirmadas do localStorage
        if (pendentesAlterado) {
          lsWrite(LS_PENDENTES, pendentes.filter(p => !p._remover));
        }

        // Processar pendências in-memory (protegem dentro da mesma sessão)
        Object.keys(pendingFieldsRef.current).forEach(k => {
          if (!k.startsWith(eventoId + "_")) return;
          const fields = pendingFieldsRef.current[k];
          const snapDoc = data[k] || {};
          const stillPending = {};
          Object.entries(fields).forEach(([field, value]) => {
            const parts = field.split(".");
            let cur = snapDoc;
            for (const pt of parts) cur = cur?.[pt];
            if (cur === value) return;
            stillPending[field] = value;
          });
          if (Object.keys(stillPending).length > 0) {
            pendingFieldsRef.current[k] = stillPending;
            data[k] = applyDotFields(snapDoc, stillPending);
          } else {
            delete pendingFieldsRef.current[k];
          }
        });
        setMarchaData(data);
        setLoading(false);
      }, (err) => {
        console.warn("[useMarchaJuizes] listener error:", err.code);
        setLoading(false);
      });

      unsubsRef.current = [unsubMarcha];
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
      const falhas = [];
      for (const p of pendentes) {
        if (p.tipo !== "marcha") continue;
        try {
          const ref = doc(db, p.colecao, p.key);
          await setDoc(ref, p.fields, { merge: true });
        } catch {
          falhas.push(p);
        }
      }
      // Manter pendências de outros tipos intactas + falhas de marcha
      const outrosTipos = pendentes.filter(p => p.tipo !== "marcha");
      lsWrite(LS_PENDENTES, [...outrosTipos, ...falhas]);
    };

    const onOnline = () => { processarPendentes(); };
    window.addEventListener("online", onOnline);
    if (navigator.onLine) processarPendentes();

    return () => window.removeEventListener("online", onOnline);
  }, []);

  // ── Helper: escrever com fallback offline ──────────────────────────────────
  const escreverComFallback = useCallback(async (key, fields) => {
    // 1. Rastrear write em andamento (protege contra onSnapshot sobrescrever)
    pendingFieldsRef.current = {
      ...pendingFieldsRef.current,
      [key]: { ...(pendingFieldsRef.current[key] || {}), ...fields },
    };

    // 2. Salvar no LS_PENDENTES ANTES do write (sobrevive a page reload)
    const pendentes = lsRead(LS_PENDENTES, []);
    const idx = pendentes.findIndex(p => p.key === key && p.tipo === "marcha");
    const entrada = { tipo: "marcha", colecao: "marchaJuizes", key, fields, ts: Date.now() };
    if (idx >= 0) {
      pendentes[idx] = { ...pendentes[idx], fields: { ...pendentes[idx].fields, ...fields }, ts: Date.now() };
    } else {
      pendentes.push(entrada);
    }
    lsWrite(LS_PENDENTES, pendentes);

    // 3. Atualiza state imediatamente (interpreta dot-notation)
    setMarchaData(prev => ({
      ...prev,
      [key]: applyDotFields(prev[key], fields),
    }));

    // 4. Tentar Firestore (pending é limpo pelo onSnapshot quando confirmar o valor)
    try {
      const ref = doc(db, "marchaJuizes", key);
      await setDoc(ref, fields, { merge: true });
    } catch {
      // Offline — pendência já salva no passo 2, nada mais a fazer
    }
  }, []);

  // ── Salvar dados de um atleta ──────────────────────────────────────────────
  const salvarDadosAtleta = useCallback(async (provaId, catId, sexo, atletaId, dadosJuiz) => {
    if (!eventoId) return;
    const key = marchaKey(eventoId, provaId, catId, sexo);
    await escreverComFallback(key, { [`dados.${atletaId}`]: dadosJuiz });
  }, [eventoId, escreverComFallback]);

  // ── Salvar nomes dos juízes / juiz-chefe / secretário ─────────────────────
  const salvarJuizes = useCallback(async (provaId, catId, sexo, dadosJuizes) => {
    if (!eventoId) return;
    const key = marchaKey(eventoId, provaId, catId, sexo);
    await escreverComFallback(key, dadosJuizes);
  }, [eventoId, escreverComFallback]);

  // ── Salvar campo individual de atleta (merge granular) ─────────────────────
  const salvarCampoAtleta = useCallback(async (provaId, catId, sexo, atletaId, campo, valor) => {
    if (!eventoId) return;
    const key = marchaKey(eventoId, provaId, catId, sexo);
    // Merge granular: usa dot-notation para não sobrescrever dados irmãos
    const fields = {};
    fields[`dados.${atletaId}.${campo}`] = valor;
    await escreverComFallback(key, fields);
  }, [eventoId, escreverComFallback]);

  // ── Upload de anexo (foto/PDF) ─────────────────────────────────────────────
  const uploadAnexo = useCallback(async (provaId, catId, sexo, file) => {
    if (!eventoId || !file) return null;
    const key = marchaKey(eventoId, provaId, catId, sexo);
    const ext = file.name?.split(".")?.pop() || "bin";
    const path = `marcha/${eventoId}/${provaId}_${catId}_${sexo}.${ext}`;

    // Deletar anexo anterior se existir
    const docAtual = marchaData[key] || {};
    if (docAtual.anexoPath) {
      try { await deleteObject(storageRef(storage, docAtual.anexoPath)); } catch {}
    }

    // Upload novo
    const ref = storageRef(storage, path);
    await uploadBytes(ref, file);
    const url = await getDownloadURL(ref);

    // Salvar referência no Firestore
    await escreverComFallback(key, { anexoUrl: url, anexoNome: file.name, anexoPath: path });
    return url;
  }, [eventoId, marchaData, escreverComFallback]);

  // ── Remover anexo ──────────────────────────────────────────────────────────
  const removerAnexo = useCallback(async (provaId, catId, sexo) => {
    if (!eventoId) return;
    const key = marchaKey(eventoId, provaId, catId, sexo);
    const docAtual = marchaData[key] || {};
    if (docAtual.anexoPath) {
      try { await deleteObject(storageRef(storage, docAtual.anexoPath)); } catch {}
    }
    await escreverComFallback(key, { anexoUrl: "", anexoNome: "", anexoPath: "" });
  }, [eventoId, marchaData, escreverComFallback]);

  // ── Salvar documento completo (botão Salvar) ───────────────────────────────
  const salvarDocCompleto = useCallback(async (provaId, catId, sexo, docCompleto) => {
    if (!eventoId) return;
    const key = marchaKey(eventoId, provaId, catId, sexo);
    // Preservar campos de anexo existentes
    const atual = marchaData[key] || {};
    const doc_ = {
      ...docCompleto,
      anexoUrl: atual.anexoUrl || "",
      anexoNome: atual.anexoNome || "",
      anexoPath: atual.anexoPath || "",
    };
    // Gravar otimisticamente + Firestore
    setMarchaData(prev => ({ ...prev, [key]: doc_ }));
    try {
      const ref = doc(db, "marchaJuizes", key);
      await setDoc(ref, sanitize(doc_));
    } catch {
      // Offline — salvar pendência completa
      const pendentes = lsRead(LS_PENDENTES, []);
      const idx = pendentes.findIndex(p => p.key === key && p.tipo === "marcha");
      if (idx >= 0) {
        pendentes[idx] = { tipo: "marcha", colecao: "marchaJuizes", key, fields: doc_, ts: Date.now() };
      } else {
        pendentes.push({ tipo: "marcha", colecao: "marchaJuizes", key, fields: doc_, ts: Date.now() });
      }
      lsWrite(LS_PENDENTES, pendentes);
    }
  }, [eventoId, marchaData]);

  // ── Getter por prova ───────────────────────────────────────────────────────
  const getMarchaProva = useCallback((provaId, catId, sexo) => {
    const key = marchaKey(eventoId, provaId, catId, sexo);
    return marchaData[key] || {};
  }, [eventoId, marchaData]);

  return {
    marchaData,
    loading,
    salvarDadosAtleta,
    salvarJuizes,
    salvarCampoAtleta,
    salvarDocCompleto,
    uploadAnexo,
    removerAnexo,
    getMarchaProva,
  };
}
