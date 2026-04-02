import React from "react";
import { useTema } from "../../shared/TemaContext";

function BlocoLGPD({ aceite, onChange, erro }) {
  const t = useTema();
  return (
    <div style={{ background: t.bgCardAlt, border: `1px solid ${erro ? t.danger : t.accentBorder}`,
      borderRadius: 10, padding: "16px 18px", marginTop: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: t.accent, letterSpacing: 1,
        textTransform: "uppercase", marginBottom: 10 }}>🔒 Consentimento LGPD (Lei 13.709/2018)</div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={aceite} onChange={e => onChange(e.target.checked)}
          style={{ marginTop: 2, width: 16, height: 16, cursor: "pointer", flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.7 }}>
          Li e concordo com a{" "}
          <a href="/privacidade" target="_blank" rel="noopener noreferrer"
            style={{ color: t.accent, fontSize: 13, textDecoration: "underline" }}>
            Política de Privacidade
          </a>
          {" "}e os{" "}
          <a href="/termos" target="_blank" rel="noopener noreferrer"
            style={{ color: t.accent, fontSize: 13, textDecoration: "underline" }}>
            Termos de Uso
          </a>
          {" "}e autorizo o tratamento dos meus dados pessoais pelo GerenTrack para fins de gestão de competições de atletismo.
        </span>
      </label>
      {erro && <div style={{ color: t.danger, fontSize: 12, marginTop: 8 }}>⚠️ {erro}</div>}
    </div>
  );
}

export default BlocoLGPD;
