import React from "react";

function FormField({ label, value, onChange, type = "text", placeholder, error }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", color: "#aaa", fontSize: 12, marginBottom: 5, fontFamily: "'Barlow', sans-serif" }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ background: "#1a1c22", border: `1px solid ${error ? "#ff6b6b" : "#2a2d3a"}`, color: "#fff", borderRadius: 6, padding: "10px 14px", width: "100%", fontSize: 14, boxSizing: "border-box", fontFamily: "'Barlow', sans-serif" }}
      />
      {error && <div style={{ color: "#ff6b6b", fontSize: 11, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

export default FormField;
