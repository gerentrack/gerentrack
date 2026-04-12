/**
 * ConfirmModal.jsx
 * Modal de confirmação que substitui window.confirm em todo o sistema.
 * Usado via hook useConfirm() — ver ConfirmContext.jsx
 */
import React from "react";
import { useTema } from "../../shared/TemaContext";

export function ConfirmModal({ mensagem, onConfirm, onCancel }) {
  const t = useTema();
  if (!mensagem) return null;

  const linhas = String(mensagem).split("\n");

  return (
    <div style={{ position: "fixed", inset: 0, background: t.bgOverlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }} onClick={onCancel}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.danger}44`, borderRadius: 14, padding: "28px 32px", maxWidth: 480, width: "100%", boxShadow: t.shadowLg, animation: "fadeInUp 0.18s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 36, textAlign: "center", marginBottom: 16 }}>!</div>
        <div style={{ marginBottom: 24 }}>
          {linhas.map((l, i) => (
            l.startsWith("•") ? (
              <div key={i} style={{ color: t.textTertiary, fontSize: 13, lineHeight: 1.6, paddingLeft: 8, fontFamily: "'Barlow', sans-serif" }}>{l}</div>
            ) : l === "" ? (
              <div key={i} style={{ height: 8 }} />
            ) : (
              <p key={i} style={{ color: t.textSecondary, fontSize: 14, lineHeight: 1.6, marginBottom: 4, fontFamily: "'Barlow', sans-serif" }}>{l}</p>
            )
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button style={{ background: "transparent", border: `1px solid ${t.borderLight}`, color: t.textMuted, padding: "10px 22px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif" }} onClick={onCancel}>Cancelar</button>
          <button style={{ background: "linear-gradient(135deg, #c0392b, #a93226)", border: "none", color: "#fff", padding: "10px 22px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }} onClick={onConfirm} autoFocus>Confirmar</button>
        </div>
      </div>
    </div>
  );
}
