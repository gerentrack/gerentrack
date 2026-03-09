import React from "react";

const s = {
  provaSection: { marginBottom: 28 },
  provaSecTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: "#aaa", marginBottom: 12, letterSpacing: 1 },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: "#0E1016", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
  provaBtnInscrito: { opacity: 0.5, cursor: "not-allowed", borderColor: "#2a4a2a", color: "#4a8a4a" },
};

export function ProvaSelector({ provas, titulo, selecionadas, onToggle, jaInscrito }) {
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
