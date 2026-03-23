/**
 * RelatorioSync.jsx
 * Modal que aparece ao reconectar apos uso offline.
 * Mostra quantas acoes foram sincronizadas e se houve falhas.
 */

import React, { useEffect, useState } from "react";
import { useTema } from "../../shared/TemaContext";

function getStyles(t) {
  return {
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16 },
    modal: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: "24px 28px", maxWidth: 420, width: "100%", marginBottom: 32, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" },
    title: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: t.textPrimary, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 },
    msg: { fontSize: 14, color: t.textSecondary, lineHeight: 1.6, marginBottom: 16 },
    bar: { height: 4, borderRadius: 2, background: t.bgInput, marginBottom: 16, overflow: "hidden" },
    barFill: { height: "100%", borderRadius: 2, background: t.success, animation: "shrink 8s linear forwards" },
    btn: { background: "transparent", color: t.accent, border: `1px solid ${t.accent}`, padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  };
}

export default function RelatorioSync({ acabouDeReconectar, pendentesAntesSync, pendentesAtual, fecharRelatorio }) {
  const t = useTema();
  const s = getStyles(t);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (acabouDeReconectar && pendentesAntesSync > 0) {
      setVisivel(true);
    }
  }, [acabouDeReconectar, pendentesAntesSync]);

  useEffect(() => {
    if (!acabouDeReconectar && visivel) {
      // Timer expirou — fechar automaticamente
      const timer = setTimeout(() => setVisivel(false), 500);
      return () => clearTimeout(timer);
    }
  }, [acabouDeReconectar, visivel]);

  if (!visivel) return null;

  const sincronizadas = Math.max(0, pendentesAntesSync - (pendentesAtual || 0));
  const falhas = pendentesAtual || 0;
  const tudo = falhas === 0;

  const fechar = () => {
    setVisivel(false);
    if (fecharRelatorio) fecharRelatorio();
  };

  return (
    <div style={s.overlay} onClick={fechar}>
      <div style={s.modal} onClick={(ev) => ev.stopPropagation()}>
        <div style={s.title}>
          <span>{tudo ? "\u2705" : "\u26A0\uFE0F"}</span>
          <span>{tudo ? "Conexao restaurada!" : "Sincronizacao parcial"}</span>
        </div>
        <p style={s.msg}>
          {sincronizadas > 0 && <>{sincronizadas} acao(oes) sincronizada(s) com sucesso.<br /></>}
          {falhas > 0 && (
            <span style={{ color: t.warning }}>
              {falhas} acao(oes) ainda pendente(s) — serao reenviadas automaticamente.
            </span>
          )}
          {sincronizadas === 0 && falhas === 0 && "Todas as acoes foram sincronizadas."}
        </p>
        {!tudo && <div style={s.bar}><div style={s.barFill} /></div>}
        <button style={s.btn} onClick={fechar}>Fechar</button>
      </div>
    </div>
  );
}
