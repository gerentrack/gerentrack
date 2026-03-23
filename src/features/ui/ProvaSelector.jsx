import React from "react";
import { useTema } from "../../shared/TemaContext";

export function ProvaSelector({ provas, titulo, selecionadas, onToggle, jaInscrito }) {
  const t = useTema();
  const s = {
    provaSection: { marginBottom: 28 },
    provaSecTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: t.textTertiary, marginBottom: 12, letterSpacing: 1 },
    provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
    provaBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
    provaBtnSel: { background: t.bgHover, borderColor: t.accent, color: t.accent },
    provaBtnInscrito: { opacity: 0.5, cursor: "not-allowed", borderColor: `${t.success}44`, color: `${t.success}88` },
  };

  return (
    <div style={s.provaSection}>
      <h3 style={s.provaSecTitle}>{titulo}</h3>
      <div style={s.provaGrid}>
        {provas.map((p) => {
          const inscrito = jaInscrito(p.id);
          const sel = selecionadas.includes(p.id);
          return (
            <button
              key={p.id}
              style={{ ...s.provaBtn, ...(sel ? s.provaBtnSel : {}), ...(inscrito ? s.provaBtnInscrito : {}) }}
              onClick={() => !inscrito && onToggle(p.id)}
              disabled={inscrito}
            >
              {inscrito ? "✓ " : sel ? "● " : "○ "}{p.nome}
              {inscrito && <span style={{ fontSize: 10, display: "block", opacity: 0.7 }}>já inscrito</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ProvaSelector;
