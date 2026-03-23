import React from "react";
import { useTema } from "../../shared/TemaContext";

function FormField({ label, value, onChange, type = "text", placeholder, error }) {
  const t = useTema();
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", color: t.textTertiary, fontSize: 12, marginBottom: 5, fontFamily: "'Barlow', sans-serif" }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ background: t.bgHover, border: `1px solid ${error ? t.danger : t.borderLight}`, color: t.textPrimary, borderRadius: 6, padding: "10px 14px", width: "100%", fontSize: 14, boxSizing: "border-box", fontFamily: "'Barlow', sans-serif" }}
      />
      {error && <div style={{ color: t.danger, fontSize: 11, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

export default FormField;
