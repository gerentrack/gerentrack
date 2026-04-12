import React from "react";
import { useTema } from "../../shared/TemaContext";
import { useApp } from "../../contexts/AppContext";

function BlocoLGPD({ aceite, onChange, erro }) {
  const t = useTema();
  const { setTela } = useApp();
  const linkStyle = { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "underline" };
  return (
    <div style={{ background: t.bgCardAlt, border: `1px solid ${erro ? t.danger : t.accentBorder}`,
      borderRadius: 10, padding: "16px 18px", marginTop: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: t.accent, letterSpacing: 1,
        textTransform: "uppercase", marginBottom: 10 }}>Consentimento LGPD (Lei 13.709/2018)</div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={aceite} onChange={e => onChange(e.target.checked)}
          style={{ marginTop: 2, width: 16, height: 16, cursor: "pointer", flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.7 }}>
          Li e concordo com a{" "}
          <button type="button" onClick={() => setTela("privacidade")} style={linkStyle}>
            Política de Privacidade
          </button>
          {" "}e os{" "}
          <button type="button" onClick={() => setTela("termos")} style={linkStyle}>
            Termos de Uso
          </button>
          {" "}e autorizo o tratamento dos meus dados pessoais pelo GerenTrack para fins de gestão de competições de atletismo.
        </span>
      </label>
      <p style={{ fontSize: 11, color: t.textDimmed, marginTop: 8, lineHeight: 1.6, paddingLeft: 28 }}>
        Sem o consentimento, não será possível criar sua conta nem utilizar a plataforma (Art. 18, VIII da LGPD).
      </p>
      {erro && <div style={{ color: t.danger, fontSize: 12, marginTop: 8 }}>{erro}</div>}
    </div>
  );
}

export default BlocoLGPD;
