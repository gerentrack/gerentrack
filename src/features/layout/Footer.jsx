import React from "react";
import { useNavigate } from "react-router-dom";
import { temaDark } from "../../shared/tema";
import { useApp } from "../../contexts/AppContext";
import styles from "../../shared/styles/appStyles";

const TELA_PATH = { planos: "/planos", faq: "/faq", privacidade: "/privacidade", termos: "/termos", recordes: "/recordes", ranking: "/ranking" };

export default function Footer() {
  const { siteBranding, gtIcon, gtNome, gtSlogan } = useApp();
  const navigate = useNavigate();

  return (
    <footer style={styles.footer}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 48, textAlign: "left" }}>
        {/* Coluna 1 — Marca */}
        <div>
          {siteBranding.logoFooter ? (
            <div style={{ marginBottom: 16, textAlign: "center" }}>
              <img loading="lazy" src={siteBranding.logoFooter} alt={gtNome} style={{ maxHeight: 140, maxWidth: "100%", objectFit: "contain", display: "block", margin: "0 auto" }} />
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                {gtIcon && <img loading="lazy" src={gtIcon} alt="" style={{ width: 44, height: 44, objectFit: "contain" }} />}
                <span style={{ fontFamily: temaDark.fontTitle, fontWeight: 800, fontSize: 24, color: "#fff", letterSpacing: 2 }}>{gtNome}</span>
              </div>
              <div style={{ fontSize: 15, color: "#777", lineHeight: 1.7 }}>{gtSlogan}</div>
            </>
          )}
          <div style={{ fontSize: 13, color: "#555", marginTop: 14, textAlign: "center" }}>© {new Date().getFullYear()} {gtNome}. Todos os direitos reservados.</div>
        </div>

        {/* Coluna 2 — Links */}
        <div>
          <div style={{ fontFamily: temaDark.fontTitle, fontWeight: 700, fontSize: 16, color: "#aaa", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>Links</div>
          {[
            { label: "Planos", tela: "planos" },
            { label: "FAQ", tela: "faq" },
            { label: "Privacidade", tela: "privacidade" },
            { label: "Termos de Uso", tela: "termos" },
            { label: "Recordes", tela: "recordes" },
            { label: "Ranking", tela: "ranking" },
          ].map(link => (
            <div key={link.tela} style={{ marginBottom: 12 }}>
              <span onClick={() => navigate(TELA_PATH[link.tela] || "/")} style={{ color: "#888", fontSize: 15, cursor: "pointer", textDecoration: "none" }}
                onMouseEnter={ev => ev.target.style.color = "#1976D2"}
                onMouseLeave={ev => ev.target.style.color = "#888"}>
                {link.label}
              </span>
            </div>
          ))}
        </div>

        {/* Coluna 3 — Contato + Redes */}
        <div>
          <div style={{ fontFamily: temaDark.fontTitle, fontWeight: 700, fontSize: 16, color: "#aaa", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>Contato</div>
          <div style={{ marginBottom: 12 }}>
            <a href="mailto:atendimento@gerentrack.com.br" style={{ color: "#888", fontSize: 15, textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}
              onMouseEnter={ev => ev.currentTarget.style.color = "#1976D2"}
              onMouseLeave={ev => ev.currentTarget.style.color = "#888"}>
              atendimento@gerentrack.com.br
            </a>
          </div>
          {(siteBranding.redesSociais || []).filter(r => r.ativo && (r.rede === "email" || r.rede === "whatsapp" || r.rede === "site")).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map((rede, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <a href={rede.url} target="_blank" rel="noopener noreferrer" style={{ color: "#888", fontSize: 15, textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}
                onMouseEnter={ev => ev.currentTarget.style.color = "#1976D2"}
                onMouseLeave={ev => ev.currentTarget.style.color = "#888"}>
                {rede.iconeUrl ? <img loading="lazy" src={rede.iconeUrl} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} /> : <span style={{ fontSize: 18 }}>{rede.emoji}</span>}
                {rede.label}
              </a>
            </div>
          ))}
          <div style={{ display: "flex", gap: 16, marginTop: 18 }}>
            {(siteBranding.redesSociais || []).filter(r => r.ativo && r.rede !== "email" && r.rede !== "whatsapp" && r.rede !== "site").sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map((rede, idx) => (
              <a key={idx} href={rede.url} target="_blank" rel="noopener noreferrer" title={rede.label} style={{ opacity: 0.6, textDecoration: "none", display: "inline-flex", alignItems: "center", transition: "opacity 0.2s" }}
                onMouseEnter={ev => ev.currentTarget.style.opacity = "1"}
                onMouseLeave={ev => ev.currentTarget.style.opacity = "0.6"}>
                {rede.iconeUrl ? <img loading="lazy" src={rede.iconeUrl} alt={rede.label} style={{ width: 48, height: 48, objectFit: "contain" }} /> : <span style={{ fontSize: 40 }}>{rede.emoji}</span>}
              </a>
            ))}
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: "#666" }}>CNPJ: 65.454.409/0001-23</div>
        </div>
      </div>
    </footer>
  );
}
