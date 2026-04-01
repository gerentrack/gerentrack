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
        // Merge pendências locais offline (interpreta dot-notation)
        const pendentes = lsRead(LS_PENDENTES, []);
        const pendMarcha = pendentes.filter(p => p.tipo === "marcha" && p.key.startsWith(eventoId + "_"));
        pendMarcha.forEach(p => {
          data[p.key] = applyDotFields(data[p.key], p.fields);
        });
        // Merge writes em andamento (evita snapshot sobrescrever updates otimistas)
        Object.entries(pendingFieldsRef.current).forEach(([k, fields]) => {
          if (k.startsWith(eventoId + "_")) {
            data[k] = applyDotFields(data[k] || {}, fields);
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

    // 2. Atualiza state imediatamente (interpreta dot-notation)
    setMarchaData(prev => ({
      ...prev,
      [key]: applyDotFields(prev[key], fields),
    }));

    // 3. Tentar Firestore
    try {
      const ref = doc(db, "marchaJuizes", key);
      await setDoc(ref, fields, { merge: true });
      // Sucesso: remover fields confirmados do pending
      const cur = pendingFieldsRef.current[key];
      if (cur) {
        const remaining = { ...cur };
        Object.keys(fields).forEach(f => delete remaining[f]);
        if (Object.keys(remaining).length === 0) {
          const copy = { ...pendingFieldsRef.current };
          delete copy[key];
          pendingFieldsRef.current = copy;
        } else {
          pendingFieldsRef.current = { ...pendingFieldsRef.current, [key]: remaining };
        }
      }
    } catch {
      // 4. Offline — fila de pendências (pendingFieldsRef mantém proteção)
      const pendentes = lsRead(LS_PENDENTES, []);
      const idx = pendentes.findIndex(p => p.key === key && p.tipo === "marcha");
      const entrada = { tipo: "marcha", colecao: "marchaJuizes", key, fields, ts: Date.now() };
      if (idx >= 0) {
        pendentes[idx] = { ...pendentes[idx], fields: { ...pendentes[idx].fields, ...fields }, ts: Date.now() };
      } else {
        pendentes.push(entrada);
      }
      lsWrite(LS_PENDENTES, pendentes);
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
    uploadAnexo,
    removerAnexo,
    getMarchaProva,
  };
}
