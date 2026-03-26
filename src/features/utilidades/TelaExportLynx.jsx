import React, { useState, useMemo } from "react";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { gerarEvt } from "../../shared/engines/lynxExportEngine";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";

function getStyles(t) {
  return {
    page: { maxWidth: 900, margin: "0 auto", padding: "24px 16px" },
    pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, color: t.textPrimary, letterSpacing: 1, marginBottom: 4 },
    subtitle: { fontSize: 13, color: t.textTertiary, marginBottom: 20 },
    card: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px", marginBottom: 16 },
    label: { fontSize: 12, color: t.textMuted, fontWeight: 600, marginBottom: 6, display: "block" },
    preview: { width: "100%", minHeight: 300, maxHeight: 500, fontFamily: "monospace", fontSize: 12, background: t.bgHeaderSolid, color: t.textSecondary, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14, resize: "vertical", overflowY: "auto", whiteSpace: "pre", lineHeight: 1.5 },
    btnPrimary: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", background: t.accent, color: "#fff", border: "none", borderRadius: 8, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 1, cursor: "pointer", transition: "all 0.2s" },
    btnGhost: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", background: "transparent", color: t.textSecondary, border: `1px solid ${t.border}`, borderRadius: 8, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 1, cursor: "pointer" },
    badge: { display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700 },
    aviso: { display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", borderRadius: 8, fontSize: 12, lineHeight: 1.5, background: `${t.warning}12`, border: `1px solid ${t.warning}33`, color: t.warning, marginBottom: 6 },
  };
}

function TelaExportLynx() {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { eventoAtual, inscricoes, atletas, equipes, numeracaoPeito } = useEvento();
  const { setTela } = useApp();

  const resultado = useMemo(() => {
    if (!eventoAtual) return { conteudo: "", avisos: ["Selecione uma competição."], totalEventos: 0, totalAtletas: 0 };
    return gerarEvt(eventoAtual, inscricoes, atletas, equipes, numeracaoPeito);
  }, [eventoAtual, inscricoes, atletas, equipes, numeracaoPeito]);

  const [mostrarAvisos, setMostrarAvisos] = useState(true);

  const handleDownload = () => {
    if (!resultado.conteudo) return;
    const blob = new Blob([resultado.conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const nomeArquivo = (eventoAtual?.nome || "evento").replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
    a.href = url;
    a.download = `${nomeArquivo}.evt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!eventoAtual) return (
    <div style={s.page}>
      <p style={{ color: t.textDimmed }}>Selecione uma competição.</p>
      <button style={s.btnGhost} onClick={() => setTela("home")}>Voltar</button>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={s.pageTitle}>Exportar FinishLynx (.evt)</h1>
          <div style={s.subtitle}>{eventoAtual.nome}</div>
        </div>
        <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
      </div>

      {/* Resumo */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <span style={{ ...s.badge, background: `${t.accent}15`, color: t.accent, border: `1px solid ${t.accent}44` }}>
          {resultado.totalEventos} evento(s)
        </span>
        <span style={{ ...s.badge, background: `${t.success}15`, color: t.success, border: `1px solid ${t.success}44` }}>
          {resultado.totalAtletas} atleta(s)
        </span>
        {resultado.avisos.length > 0 && (
          <span
            style={{ ...s.badge, background: `${t.warning}15`, color: t.warning, border: `1px solid ${t.warning}44`, cursor: "pointer" }}
            onClick={() => setMostrarAvisos(v => !v)}
          >
            {resultado.avisos.length} aviso(s) {mostrarAvisos ? "▲" : "▼"}
          </span>
        )}
      </div>

      {/* Avisos */}
      {mostrarAvisos && resultado.avisos.length > 0 && (
        <div style={s.card}>
          <label style={s.label}>Avisos</label>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {resultado.avisos.map((av, idx) => (
              <div key={idx} style={s.aviso}>
                <span style={{ flexShrink: 0 }}>⚠</span>
                <span>{av}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      <div style={s.card}>
        <label style={s.label}>Preview do arquivo .evt</label>
        <textarea
          readOnly
          value={resultado.conteudo || "(nenhum dado para exportar)"}
          style={s.preview}
        />
      </div>

      {/* Ações */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          style={{ ...s.btnPrimary, opacity: resultado.conteudo ? 1 : 0.5 }}
          disabled={!resultado.conteudo}
          onClick={handleDownload}
        >
          📥 Baixar .evt
        </button>
        <button
          style={s.btnGhost}
          disabled={!resultado.conteudo}
          onClick={() => {
            if (resultado.conteudo) {
              navigator.clipboard.writeText(resultado.conteudo);
              alert("Conteúdo copiado para a área de transferência.");
            }
          }}
        >
          📋 Copiar
        </button>
      </div>
    </div>
  );
}

export default TelaExportLynx;
