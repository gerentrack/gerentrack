/**
 * ConfirmModal.jsx
 * Modal de confirmação que substitui window.confirm em todo o sistema.
 * Usado via hook useConfirm() — ver ConfirmContext.jsx
 */
import React from "react";

export function ConfirmModal({ mensagem, onConfirm, onCancel }) {
  if (!mensagem) return null;

  // Renderizar quebras de linha do texto
  const linhas = String(mensagem).split("\n");

  return (
    <div style={s.overlay} onClick={onCancel}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.icon}>⚠️</div>
        <div style={s.body}>
          {linhas.map((l, i) => (
            l.startsWith("•") ? (
              <div key={i} style={s.bullet}>{l}</div>
            ) : l === "" ? (
              <div key={i} style={{ height: 8 }} />
            ) : (
              <p key={i} style={s.linha}>{l}</p>
            )
          ))}
        </div>
        <div style={s.btns}>
          <button style={s.btnCancel} onClick={onCancel}>Cancelar</button>
          <button style={s.btnConfirm} onClick={onConfirm} autoFocus>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999, padding: 24,
  },
  modal: {
    background: "#0E1016", border: "1px solid #ff444444",
    borderRadius: 14, padding: "28px 32px", maxWidth: 480, width: "100%",
    boxShadow: "0 8px 40px rgba(0,0,0,0.8)",
    animation: "fadeInUp 0.18s ease",
  },
  icon: { fontSize: 36, textAlign: "center", marginBottom: 16 },
  body: { marginBottom: 24 },
  linha: {
    color: "#ccc", fontSize: 14, lineHeight: 1.6, marginBottom: 4,
    fontFamily: "'Barlow', sans-serif",
  },
  bullet: {
    color: "#aaa", fontSize: 13, lineHeight: 1.6, paddingLeft: 8,
    fontFamily: "'Barlow', sans-serif",
  },
  btns: { display: "flex", gap: 10, justifyContent: "flex-end" },
  btnCancel: {
    background: "transparent", border: "1px solid #2a2d3a",
    color: "#888", padding: "10px 22px", borderRadius: 8,
    cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif",
  },
  btnConfirm: {
    background: "linear-gradient(135deg, #c0392b, #a93226)",
    border: "none", color: "#fff", padding: "10px 22px",
    borderRadius: 8, cursor: "pointer", fontSize: 14,
    fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif",
    letterSpacing: 1,
  },
};
