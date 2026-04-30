import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTema } from "../../shared/TemaContext";

const STORAGE_KEY = "gt_cookie_consent";

export function useCookieConsent() {
  const [consentimento, setConsentimento] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });
  const aceitar = () => { localStorage.setItem(STORAGE_KEY, "aceito"); setConsentimento("aceito"); };
  const recusar = () => { localStorage.setItem(STORAGE_KEY, "recusado"); setConsentimento("recusado"); };
  return { consentimento, aceito: consentimento === "aceito", aceitar, recusar };
}

function BannerCookies({ onAceitar, onRecusar }) {
  const navigate = useNavigate();
  const t = useTema();
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v) setVisivel(false);
  }, []);

  if (!visivel) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: t.bgCard, borderTop: `1px solid ${t.border}`,
      padding: "16px 24px", display: "flex", alignItems: "center",
      justifyContent: "center", gap: 16, flexWrap: "wrap",
      boxShadow: "0 -4px 20px #0004",
    }}>
      <div style={{ flex: 1, minWidth: 280, maxWidth: 700 }}>
        <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.7 }}>
          <strong style={{ color: t.textPrimary }}>PRIVACIDADE E COOKIES</strong>
          <br />
          Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência e analisar o uso do site.
          Ao aceitar, você concorda com o uso de cookies conforme nossa{" "}
          <button type="button" onClick={() => navigate("/privacidade")}
            style={{ background:"none", border:"none", color: t.accent, cursor:"pointer", fontSize:13, padding:0, textDecoration:"underline", fontFamily:"inherit" }}>
            Política de Privacidade
          </button>.
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button onClick={() => { setVisivel(false); onRecusar(); }}
          style={{
            background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted,
            borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13,
            fontFamily: t.fontBody, fontWeight: 600,
          }}>
          Recusar
        </button>
        <button onClick={() => { setVisivel(false); onAceitar(); }}
          style={{
            background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff",
            border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13,
            fontFamily: t.fontTitle, fontWeight: 700, letterSpacing: 1,
          }}>
          Aceitar
        </button>
      </div>
    </div>
  );
}

export default BannerCookies;
