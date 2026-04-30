import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { gerarEvt, listarProvasExportaveis } from "../../shared/engines/lynxExportEngine";
import { FASE_NOME } from "../../shared/constants/fases";
import { useEvento } from "../../contexts/EventoContext";


function getStyles(t) {
  return {
    page: { maxWidth: 900, margin: "0 auto", padding: "24px 16px" },
    pageTitle: { fontFamily: t.fontTitle, fontSize: 28, fontWeight: 800, color: t.textPrimary, letterSpacing: 1, marginBottom: 4 },
    subtitle: { fontSize: 13, color: t.textTertiary, marginBottom: 20 },
    card: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px", marginBottom: 16 },
    label: { fontSize: 12, color: t.textMuted, fontWeight: 600, marginBottom: 6, display: "block" },
    preview: { width: "100%", minHeight: 300, maxHeight: 500, fontFamily: "monospace", fontSize: 12, background: t.bgHeaderSolid, color: t.textSecondary, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14, resize: "vertical", overflowY: "auto", whiteSpace: "pre", lineHeight: 1.5 },
    btnPrimary: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", background: t.accent, color: "#fff", border: "none", borderRadius: 8, fontFamily: t.fontTitle, fontSize: 15, fontWeight: 700, letterSpacing: 1, cursor: "pointer", transition: "all 0.2s" },
    btnGhost: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", background: "transparent", color: t.textSecondary, border: `1px solid ${t.border}`, borderRadius: 8, fontFamily: t.fontTitle, fontSize: 15, fontWeight: 700, letterSpacing: 1, cursor: "pointer" },
    badge: { display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700 },
    aviso: { display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", borderRadius: 8, fontSize: 12, lineHeight: 1.5, background: `${t.warning}12`, border: `1px solid ${t.warning}33`, color: t.warning, marginBottom: 6 },
  };
}

function faseLabel(faseSufixo) {
  return FASE_NOME[faseSufixo] || "";
}

function faseCor(faseSufixo, t) {
  if (faseSufixo === "ELI") return t.warning;
  if (faseSufixo === "SEM") return t.accent;
  if (faseSufixo === "FIN") return t.success;
  return t.textMuted;
}

function TelaFinishLynx() {
  const navigate = useNavigate();
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { eventoAtual, inscricoes, atletas, equipes, numeracaoPeito } = useEvento();
  const [selecionados, setSelecionados] = useState(null); // null = todas, Set<chave> = selecionadas
  const [mostrarAvisos, setMostrarAvisos] = useState(true);

  const itensDisp = useMemo(() => {
    if (!eventoAtual) return [];
    return listarProvasExportaveis(eventoAtual, inscricoes);
  }, [eventoAtual, inscricoes]);

  const resultado = useMemo(() => {
    if (!eventoAtual) return { conteudo: "", avisos: ["Selecione uma competição."], totalEventos: 0, totalAtletas: 0 };
    return gerarEvt(eventoAtual, inscricoes, atletas, equipes, numeracaoPeito, selecionados);
  }, [eventoAtual, inscricoes, atletas, equipes, numeracaoPeito, selecionados]);

  const toggleItem = (chave) => {
    setSelecionados(prev => {
      if (!prev) {
        // Estava em "Todas" → selecionar apenas este
        return new Set([chave]);
      }
      const next = new Set(prev);
      if (next.has(chave)) {
        next.delete(chave);
        // Se ficou vazio, voltar para "Todas"
        return next.size === 0 ? null : next;
      }
      next.add(chave);
      // Se selecionou todos, equivale a "Todas"
      return next.size === itensDisp.length ? null : next;
    });
  };

  const handleDownload = () => {
    if (!resultado.conteudo) return;
    const blob = new Blob([resultado.conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = (eventoAtual?.nome || "evento").replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
    a.href = url;
    a.download = `${base}.evt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!eventoAtual) return (
    <div style={s.page}>
      <p style={{ color: t.textDimmed }}>Selecione uma competição.</p>
      <button style={s.btnGhost} onClick={() => navigate("../sumulas")}>← Súmulas</button>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={s.pageTitle}>Exportar FinishLynx (.evt)</h1>
          <div style={s.subtitle}>{eventoAtual.nome}</div>
        </div>
        <button style={s.btnGhost} onClick={() => navigate("../sumulas")}>← Súmulas</button>
      </div>

      {/* Filtro multi-select por prova × fase */}
      {itensDisp.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <label style={s.label}>Exportar</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              onClick={() => setSelecionados(null)}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: `1px solid ${!selecionados ? t.accent : t.border}`,
                background: !selecionados ? `${t.accent}15` : "transparent",
                color: !selecionados ? t.accent : t.textMuted,
              }}
            >
              Todas ({itensDisp.length})
            </button>
            {itensDisp.map(item => {
              const ativo = selecionados ? selecionados.has(item.chave) : false;
              const cor = item.faseSufixo ? faseCor(item.faseSufixo, t) : t.accent;
              const fLabel = faseLabel(item.faseSufixo);
              return (
                <button key={item.chave}
                  onClick={() => toggleItem(item.chave)}
                  style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    border: `1px solid ${ativo ? cor : t.border}`,
                    background: ativo ? `${cor}15` : "transparent",
                    color: ativo ? cor : t.textMuted,
                    transition: "all 0.15s",
                  }}
                >
                  {item.provaNome} {item.sexo === "M" ? "M" : "F"}
                  {fLabel ? ` · ${fLabel}` : ""}
                  {item.series > 1 ? ` (${item.series} sér.)` : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
                <span style={{ flexShrink: 0 }}>!</span>
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
          Baixar .evt
        </button>
        <button
          style={s.btnGhost}
          disabled={!resultado.conteudo}
          onClick={() => {
            if (resultado.conteudo) {
              navigator.clipboard.writeText(resultado.conteudo);
            }
          }}
        >
          Copiar
        </button>
      </div>
    </div>
  );
}

export default TelaFinishLynx;
