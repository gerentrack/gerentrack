/**
 * PrepararOffline.jsx
 * Tela de preparação para uso offline — verifica e exibe checklist
 * de dados cacheados no localStorage para funcionamento sem internet.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useTema } from "../../shared/TemaContext";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { cacheGet, cacheSet } from "../../lib/cacheDB";

function getStyles(t) {
  return {
    page: { maxWidth: 700, margin: "0 auto", padding: "40px 24px 80px" },
    title: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, fontWeight: 800, color: t.textPrimary, marginBottom: 8, letterSpacing: 1 },
    subtitle: { fontSize: 14, color: t.textMuted, marginBottom: 32 },
    card: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "24px", marginBottom: 20 },
    cardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: t.textPrimary, marginBottom: 16 },
    checkItem: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${t.border}` },
    checkIcon: { fontSize: 20, flexShrink: 0, width: 28, textAlign: "center" },
    checkLabel: { fontSize: 14, color: t.textSecondary, flex: 1 },
    checkValue: { fontSize: 13, color: t.textMuted, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 },
    btnSync: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "14px 32px", borderRadius: 8, cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, marginTop: 24, display: "block", width: "100%" },
    btnVoltar: { background: "transparent", color: t.accent, border: `2px solid ${t.accent}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, marginTop: 12, display: "block", width: "100%", textAlign: "center" },
    statusOk: { color: t.success },
    statusWarn: { color: t.warning },
    statusErr: { color: t.danger },
    storageBar: { height: 8, borderRadius: 4, background: t.bgInput, marginTop: 8, overflow: "hidden" },
    storageBarFill: { height: "100%", borderRadius: 4, transition: "width 0.3s" },
    storageText: { fontSize: 12, color: t.textMuted, marginTop: 4 },
    allGood: { textAlign: "center", padding: "20px", background: t.successBg || (t.success + "15"), border: `1px solid ${t.success}44`, borderRadius: 10, marginTop: 16 },
    allGoodText: { fontSize: 15, color: t.success, fontWeight: 700 },
  };
}

async function verificarItemIDB(storeName) {
  try {
    const data = await cacheGet(storeName);
    if (Array.isArray(data)) return { ok: data.length > 0, count: data.length };
    if (typeof data === "object" && data !== null) {
      const n = Object.keys(data).length;
      return { ok: n > 0, count: n };
    }
    return { ok: false, count: 0 };
  } catch {
    return { ok: false, count: 0 };
  }
}

async function estimarStorageUsado() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      return { usage: est.usage || 0, quota: est.quota || 0 };
    }
  } catch {}
  return { usage: 0, quota: 0 };
}

function verificarSW() {
  return "serviceWorker" in navigator && navigator.serviceWorker.controller != null;
}

export default function PrepararOffline({ eventoAtual, atletas, inscricoes, resultados, equipes, eventos, setTela }) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const [checks, setChecks] = useState(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [sincronizado, setSincronizado] = useState(false);

  const eventoId = eventoAtual?.id;

  const verificarTudo = useCallback(async () => {
    const swAtivo = verificarSW();

    const [cacheEventos, cacheAtletas, cacheEquipes, cacheInscricoes, cacheResultados] = await Promise.all([
      verificarItemIDB("cache_eventos"),
      verificarItemIDB("cache_atletas"),
      verificarItemIDB("cache_equipes"),
      verificarItemIDB("cache_inscricoes"),
      verificarItemIDB("cache_resultados"),
    ]);

    // Chamada e medalhas continuam em localStorage (useMedalhasChamada — fora do escopo)
    const verificarItemLS = (key) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return { ok: false, count: 0 };
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return { ok: parsed.length > 0, count: parsed.length };
        if (typeof parsed === "object" && parsed !== null) return { ok: Object.keys(parsed).length > 0, count: Object.keys(parsed).length };
        return { ok: false, count: 0 };
      } catch { return { ok: false, count: 0 }; }
    };
    const cacheChamada = verificarItemLS("mc_chamada");
    const cacheMedalhas = verificarItemLS("mc_medalhas");

    // Contar dados do evento atual
    const inscsEvento = inscricoes ? inscricoes.filter(i => i.eventoId === eventoId).length : 0;
    const atletasIds = inscricoes
      ? new Set(inscricoes.filter(i => i.eventoId === eventoId).map(i => i.atletaId))
      : new Set();
    const resEvento = resultados
      ? Object.keys(resultados).filter(k => k.startsWith(eventoId + "_")).length
      : 0;

    const storage = await estimarStorageUsado();

    setChecks({
      sw: swAtivo,
      eventos: cacheEventos,
      atletas: { ...cacheAtletas, eventoCount: atletasIds.size },
      equipes: cacheEquipes,
      inscricoes: { ...cacheInscricoes, eventoCount: inscsEvento },
      resultados: { ...cacheResultados, eventoCount: resEvento },
      chamada: cacheChamada,
      medalhas: cacheMedalhas,
      storageUsado: storage.usage,
      storageQuota: storage.quota,
    });
  }, [eventoId, inscricoes, resultados]);

  useEffect(() => { verificarTudo(); }, [verificarTudo]);

  const sincronizarAgora = useCallback(async () => {
    setSincronizando(true);
    try {
      await Promise.all([
        cacheSet("cache_atletas", atletas || []),
        cacheSet("cache_equipes", equipes || []),
        cacheSet("cache_inscricoes", inscricoes || []),
        cacheSet("cache_resultados", resultados || {}),
        cacheSet("cache_eventos", eventos || []),
      ]);
    } catch (err) {
      console.warn("[PrepararOffline] Erro ao salvar cache:", err);
    }
    await verificarTudo();
    setSincronizando(false);
    setSincronizado(true);
  }, [atletas, equipes, inscricoes, resultados, eventos, verificarTudo]);

  if (!checks) return null;

  const items = [
    { label: "Service Worker", ok: checks.sw, value: checks.sw ? "Ativo" : "Inativo" },
    { label: "Evento carregado", ok: checks.eventos.ok, value: checks.eventos.ok ? `${checks.eventos.count} evento(s)` : "Sem cache" },
    { label: `Atletas do evento`, ok: checks.atletas.ok, value: checks.atletas.ok ? `${checks.atletas.eventoCount} inscrito(s) · ${checks.atletas.count} total` : "Sem cache" },
    { label: "Equipes", ok: checks.equipes.ok, value: checks.equipes.ok ? `${checks.equipes.count} equipe(s)` : "Sem cache" },
    { label: `Inscricoes do evento`, ok: checks.inscricoes.ok, value: checks.inscricoes.ok ? `${checks.inscricoes.eventoCount} neste evento · ${checks.inscricoes.count} total` : "Sem cache" },
    { label: "Resultados", ok: checks.resultados.ok, value: checks.resultados.ok ? `${checks.resultados.eventoCount} prova(s) com resultado` : "Sem cache" },
    { label: "Chamada (presenca)", ok: checks.chamada.ok || checks.chamada.count === 0, value: checks.chamada.count > 0 ? `${checks.chamada.count} registro(s)` : "Vazio (normal antes de iniciar)" },
    { label: "Medalhas", ok: checks.medalhas.ok || checks.medalhas.count === 0, value: checks.medalhas.count > 0 ? `${checks.medalhas.count} registro(s)` : "Vazio (normal antes de iniciar)" },
  ];

  const todosOk = items.every(i => i.ok);
  const storageMB = (checks.storageUsado / (1024 * 1024)).toFixed(2);
  const storageQuotaMB = checks.storageQuota ? (checks.storageQuota / (1024 * 1024)).toFixed(0) : "—";
  const storagePct = checks.storageQuota ? Math.min((checks.storageUsado / checks.storageQuota) * 100, 100) : 0;
  const storageColor = storagePct > 80 ? t.danger : storagePct > 50 ? t.warning : t.success;

  return (
    <div style={s.page}>
      <button
        onClick={() => setTela("evento-detalhe")}
        style={{ background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 16, padding: 0 }}
      >
        &larr; Voltar ao evento
      </button>

      <h1 style={s.title}>Preparar para Uso Offline</h1>
      <p style={s.subtitle}>
        Verifique se todos os dados necessarios estao em cache para usar o app sem internet.
      </p>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Checklist de Dados</h3>
        {items.map((item, idx) => (
          <div key={idx} style={{ ...s.checkItem, ...(idx === items.length - 1 ? { borderBottom: "none" } : {}) }}>
            <span style={s.checkIcon}>
              {item.ok ? <span style={s.statusOk}>&#10003;</span> : <span style={s.statusWarn}>&#9888;</span>}
            </span>
            <span style={s.checkLabel}>{item.label}</span>
            <span style={s.checkValue}>{item.value}</span>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Armazenamento Local</h3>
        <div style={s.storageBar}>
          <div style={{ ...s.storageBarFill, width: `${storagePct}%`, background: storageColor }} />
        </div>
        <p style={s.storageText}>{storageMB} MB usado de ~{storageQuotaMB} MB disponivel ({storagePct.toFixed(0)}%)</p>
      </div>

      {todosOk && sincronizado && (
        <div style={s.allGood}>
          <p style={s.allGoodText}>&#10003; Tudo pronto para uso offline!</p>
        </div>
      )}

      <button
        style={{ ...s.btnSync, opacity: sincronizando ? 0.6 : 1 }}
        onClick={sincronizarAgora}
        disabled={sincronizando}
      >
        {sincronizando ? "Sincronizando..." : sincronizado ? "Sincronizar novamente" : "Sincronizar dados agora"}
      </button>

      <button style={s.btnVoltar} onClick={() => setTela("evento-detalhe")}>
        Voltar
      </button>
    </div>
  );
}
