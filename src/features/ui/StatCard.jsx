import React from "react";
import { useTema } from "../../shared/TemaContext";

export function StatCard({ value, label, color }) {
  const t = useTema();
  return (
    <div style={{ background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 12, padding: "18px 24px", textAlign: "center", minWidth: 100, boxShadow: t.shadow }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: color || t.accent, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 13, color: t.textMuted, letterSpacing: 1 }}>{label}</div>
    </div>
  );
}

export default StatCard;
