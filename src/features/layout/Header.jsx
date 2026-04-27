import React, { useState } from "react";
import { _getLocalEventoDisplay } from "../../shared/formatters/utils";
import { useResponsivo } from "../../hooks/useResponsivo";
import { useTema } from "../../shared/TemaContext";

function _dtInscricoes(data, hora) {
  if (!data) return null;
  return new Date(data + "T" + (hora || "00:00") + ":00");
}

function getStatusInscricoes(ev) {
  if (!ev) return "encerradas";
  const agora = new Date();
  const dtAbertura = _dtInscricoes(ev.dataAberturaInscricoes, ev.horaAberturaInscricoes);
  if (dtAbertura && agora < dtAbertura) return "em_breve";
  const dtEncerramento = _dtInscricoes(ev.dataEncerramentoInscricoes, ev.horaEncerramentoInscricoes);
  if (dtEncerramento && agora > dtEncerramento) return "encerradas";
  if (ev.inscricoesEncerradas) return "encerradas";
  return "abertas";
}

function getStyles(t) {
  // Header com cores fixas (azul marinho) — independente do tema claro/escuro
  const H = {
    bg: "#0a1628",
    bgSolid: "#0d1a30",
    border: "#12233d",
    borderLight: "#1a2e4a",
    text: "#c8d0dc",
    textDim: "#6b7a90",
    accent: t.accent,
    danger: t.danger,
    warning: t.warning,
  };
  return {
  header: { background: H.bg, borderBottom: `1px solid ${H.border}`, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", paddingTop: "env(safe-area-inset-top, 0px)" },
  headerInner: { maxWidth: 1200, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  headerInnerMobile: { maxWidth: 1200, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  logo: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 },
  logoMobile: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 },
  logoTitle: { fontFamily: t.fontTitle, fontSize: 24, fontWeight: 900, color: H.accent, letterSpacing: 3, lineHeight: 1 },
  logoTitleMobile: { fontFamily: t.fontTitle, fontSize: 18, fontWeight: 900, color: H.accent, letterSpacing: 2, lineHeight: 1 },
  logoSub: { fontSize: 11, color: H.textDim, letterSpacing: 1.5, marginTop: 3 },
  nav: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  btnNav: { background: "transparent", border: `1px solid ${H.borderLight}`, color: H.text, padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: t.fontBody, transition: "all 0.2s", whiteSpace: "nowrap" },
  btnNavMobile: { background: "transparent", border: `1px solid ${H.borderLight}`, color: H.text, padding: "10px 16px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontFamily: t.fontBody, transition: "all 0.2s", whiteSpace: "nowrap", width: "100%" },
  btnNavActive: { background: "#0f2240", borderColor: H.accent, color: H.accent },
  btnSair: { background: "transparent", border: `1px solid ${H.danger}33`, color: H.danger, padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: t.fontBody },
  btnSairMobile: { background: "transparent", border: `1px solid ${H.danger}33`, color: H.danger, padding: "10px 16px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: t.fontBody, width: "100%" },
  eventoBar: { background: H.bgSolid, borderTop: `1px solid ${H.border}`, padding: "6px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  eventoBarMobile: { background: H.bgSolid, borderTop: `1px solid ${H.border}`, padding: "6px 12px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 },
  eventoBarLabel: { fontSize: 11, color: H.textDim, letterSpacing: 1, textTransform: "uppercase" },
  eventoBarNome: { fontSize: 13, fontWeight: 700, color: H.accent, fontFamily: t.fontTitle, letterSpacing: 1 },
  eventoBarMeta: { fontSize: 12, color: H.textDim, marginLeft: "auto" },
  eventoBarMetaMobile: { fontSize: 11, color: H.textDim },
  statusDotInline: (cor) => ({ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: cor, background: cor + "22", border: `1px solid ${cor}44`, borderRadius: 10, padding: "2px 8px", whiteSpace: "nowrap" }),
  offlineBanner: { background: "#0d1a30", borderBottom: `1px solid ${H.warning}44`, padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, color: H.warning, fontWeight: 600, letterSpacing: 0.5 },
  hamburger: { background: "none", border: `1px solid ${H.borderLight}`, borderRadius: 6, cursor: "pointer", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4, alignItems: "center", justifyContent: "center" },
  hamburgerLine: { width: 20, height: 2, background: H.text, borderRadius: 1 },
  mobileMenu: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", justifyContent: "flex-end" },
  mobileMenuPanel: { background: H.bg, width: 280, maxWidth: "80vw", height: "100%", overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 8, borderLeft: `1px solid ${H.border}`, boxShadow: "-4px 0 30px rgba(0,0,0,0.5)" },
  mobileMenuHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${H.border}` },
  mobileMenuClose: { background: "none", border: "none", color: H.textDim, fontSize: 24, cursor: "pointer", padding: "4px 8px" },
}; }

function NavBtn({ onClick, label, active, mobile, styles }) {
  const base = mobile ? styles.btnNavMobile : styles.btnNav;
  return (
    <button onClick={onClick} style={{ ...base, fontWeight: 700, ...(active ? styles.btnNavActive : {}) }}>
      {label}
    </button>
  );
}

function Header({ tela, setTela, usuarioLogado, logout, eventoAtual, perfisDisponiveis, gtIcon, gtLogo, gtNome, gtSlogan, pendenciasRecorde, ranking, temaClaro, setTemaClaro, online, pendentesOffline }) {
  const t = useTema();
  const styles = getStyles(t);
  const [menuAberto, setMenuAberto] = useState(false);
  const { mobile } = useResponsivo();

  // Fecha menu ao navegar
  const navegar = (destino) => { setTela(destino); setMenuAberto(false); };

  const pendCount = usuarioLogado?.tipo === "admin" ? (pendenciasRecorde || []).filter(p => p.status === "pendente").length : 0;
  const rankingPendCount = usuarioLogado?.tipo === "admin" ? (ranking || []).filter(r => r.status === "pendente").length : 0;

  const navItems = (
    <>
      <NavBtn styles={styles} onClick={() => navegar("home")} label="Competições" mobile={mobile} />
      <div style={{ position: "relative", display: mobile ? "block" : "inline-block", width: mobile ? "100%" : "auto" }}>
        <NavBtn styles={styles} onClick={() => navegar("recordes")} label="Recordes" mobile={mobile} />
        {pendCount > 0 && (
          <span style={{ position: "absolute", top: mobile ? 6 : -4, right: mobile ? 8 : -4, background: t.danger, color: "#fff", fontSize: 9,
            fontWeight: 800, borderRadius: 10, padding: "1px 5px", minWidth: 16, textAlign: "center" }}>{pendCount}</span>
        )}
      </div>
      <div style={{ position: "relative", display: mobile ? "block" : "inline-block", width: mobile ? "100%" : "auto" }}>
        <NavBtn styles={styles} onClick={() => navegar("ranking")} label="Ranking" mobile={mobile} />
        {rankingPendCount > 0 && (
          <span style={{ position: "absolute", top: mobile ? 6 : -4, right: mobile ? 8 : -4, background: t.danger, color: "#fff", fontSize: 9,
            fontWeight: 800, borderRadius: 10, padding: "1px 5px", minWidth: 16, textAlign: "center" }}>{rankingPendCount}</span>
        )}
      </div>
      {usuarioLogado ? (
        <>
          {usuarioLogado.tipo === "equipe"       && <NavBtn styles={styles} onClick={() => navegar("painel-equipe")}       label="Painel" active mobile={mobile} />}
          {usuarioLogado.tipo === "treinador"    && <NavBtn styles={styles} onClick={() => navegar("painel-equipe")}       label="Painel" active mobile={mobile} />}
          {usuarioLogado.tipo === "organizador" && <NavBtn styles={styles} onClick={() => navegar("painel-organizador")}  label="Painel" active mobile={mobile} />}
          {usuarioLogado.tipo === "funcionario"  && <NavBtn styles={styles} onClick={() => navegar("painel-organizador")}  label="Painel" active mobile={mobile} />}
          {usuarioLogado.tipo === "atleta"      && <NavBtn styles={styles} onClick={() => navegar("painel-atleta")}       label="Painel" active mobile={mobile} />}
          {usuarioLogado.tipo === "admin"       && <NavBtn styles={styles} onClick={() => navegar("admin")}               label="Admin" mobile={mobile} />}

          {usuarioLogado._temOutrosPerfis && perfisDisponiveis?.length > 1 && (
            <button
              onClick={() => navegar("selecionar-perfil")}
              title="Trocar perfil / organizador"
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", background: "#0f224022",
                border: "1px solid #1a2e4a", borderRadius: 6, cursor: "pointer", fontSize: 10, color: t.accent,
                fontFamily: t.fontBody, fontWeight: 600, ...(mobile ? { width: "100%", padding: "10px 16px", fontSize: 13, justifyContent: "center" } : {}) }}
            >
              Trocar
            </button>
          )}

          <button
            onClick={() => navegar("configuracoes")}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", background: "#0d1a30", border: "1px solid #1a2e4a", borderRadius: 6, cursor: "pointer", ...(mobile ? { width: "100%", padding: "10px 16px" } : {}) }}
            title="Configurações da conta"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7a90" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span style={{ fontSize: 11, color: "#c8d0dc", maxWidth: mobile ? "none" : 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{usuarioLogado.nome}</span>
              {usuarioLogado._organizadorNome && (
                <span style={{ fontSize: 9, color: t.accent, maxWidth: mobile ? "none" : 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{usuarioLogado._organizadorNome}</span>
              )}
            </div>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b7a90" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </button>
          <button style={mobile ? styles.btnSairMobile : styles.btnSair} onClick={() => { logout(); setMenuAberto(false); }}>Sair</button>
        </>
      ) : (
        <button style={{ ...(mobile ? styles.btnNavMobile : styles.btnNav), background: t.accent, color: "#fff", fontWeight: 700, border: "none" }} onClick={() => navegar("login")}>
          Entrar
        </button>
      )}
    </>
  );

  const temaToggle = (
    <div style={{
      display: "flex", alignItems: "center",
      background: "#0d1a30",
      border: "1px solid #12233d",
      borderRadius: 20,
      padding: 3,
      gap: 0,
      flexShrink: 0,
      ...(mobile ? { alignSelf: "center", marginTop: 8 } : { marginLeft: "auto" }),
    }}>
      <button
        onClick={() => setTemaClaro(false)}
        title="Modo escuro"
        style={{
          background: !temaClaro ? "#1a2e4a" : "transparent",
          border: "none", borderRadius: 16, cursor: "pointer",
          padding: "4px 10px", fontSize: 11,
          color: !temaClaro ? "#c8d0dc" : "#4a5568",
          fontFamily: t.fontBody, letterSpacing: 0.5, transition: "all 0.2s",
        }}
      >
        escuro
      </button>
      <button
        onClick={() => setTemaClaro(true)}
        title="Modo claro"
        style={{
          background: temaClaro ? "#1a2e4a" : "transparent",
          border: "none", borderRadius: 16, cursor: "pointer",
          padding: "4px 10px", fontSize: 11,
          color: temaClaro ? "#c8d0dc" : "#4a5568",
          fontFamily: t.fontBody, letterSpacing: 0.5, transition: "all 0.2s",
        }}
      >
        claro
      </button>
    </div>
  );

  const telasDeCompeticao = ["novo-evento","evento-detalhe","preparar-offline","regulamento","inscricao-avulsa","numeracao-peito","export-lynx","inscricao-revezamento","config-pontuacao-equipes","secretaria","sumulas","resultados","digitar-resultados","gerenciar-inscricoes"];
  const showEventoBar = eventoAtual && telasDeCompeticao.includes(tela);

  return (
    <>
      {!online && (
        <div style={styles.offlineBanner}>
          Sem conexao com a internet{pendentesOffline > 0 ? ` · ${pendentesOffline} acao(oes) pendente(s) de sync` : " — modo offline ativo"}
        </div>
      )}
      <header style={styles.header}>
        <div style={mobile ? styles.headerInnerMobile : styles.headerInner}>
          <button style={mobile ? styles.logoMobile : styles.logo} onClick={() => setTela("home")}>
            {gtLogo ? (
              <img src={gtLogo} alt={gtNome || "GERENTRACK"} style={{ height: mobile ? 34 : 44, maxWidth: mobile ? 180 : 280, objectFit: "contain" }} />
            ) : (
              <>
                <img src={gtIcon} alt="GT" style={{ width: mobile ? 34 : 44, height: mobile ? 34 : 44, objectFit: "contain", borderRadius: 6 }} />
                <div>
                  <div style={mobile ? styles.logoTitleMobile : styles.logoTitle}>{gtNome || "GERENTRACK"}</div>
                  {!mobile && <div style={styles.logoSub}>{gtSlogan || "COMPETIÇÃO COM PRECISÃO"}</div>}
                </div>
              </>
            )}
          </button>

          {mobile ? (
            <>
              {temaToggle}
              <button style={styles.hamburger} onClick={() => setMenuAberto(true)} aria-label="Abrir menu">
                <span style={styles.hamburgerLine} />
                <span style={styles.hamburgerLine} />
                <span style={styles.hamburgerLine} />
              </button>
            </>
          ) : (
            <>
              <nav style={styles.nav}>
                {navItems}
              </nav>
              {temaToggle}
            </>
          )}
        </div>

        {/* Mobile menu overlay */}
        {mobile && menuAberto && (
          <div style={styles.mobileMenu} onClick={(e) => { if (e.target === e.currentTarget) setMenuAberto(false); }}>
            <div style={styles.mobileMenuPanel}>
              <div style={styles.mobileMenuHeader}>
                <span style={{ color: "#6b7a90", fontSize: 13, fontFamily: t.fontTitle, letterSpacing: 1, textTransform: "uppercase" }}>Menu</span>
                <button style={styles.mobileMenuClose} onClick={() => setMenuAberto(false)} aria-label="Fechar menu">✕</button>
              </div>
              {navItems}
            </div>
          </div>
        )}

        {showEventoBar && (
          <div style={mobile ? styles.eventoBarMobile : styles.eventoBar}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={styles.eventoBarLabel}>Competição:</span>
              <span style={styles.eventoBarNome}>{eventoAtual.nome}</span>
            </div>
            <span style={mobile ? styles.eventoBarMetaMobile : styles.eventoBarMeta}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",marginRight:3}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR")}
              &nbsp;·&nbsp;<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",marginRight:3}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {_getLocalEventoDisplay(eventoAtual)}
            </span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={styles.statusDotInline(getStatusInscricoes(eventoAtual) === "abertas" ? t.success : getStatusInscricoes(eventoAtual) === "em_breve" ? t.accent : t.danger)}>
                {getStatusInscricoes(eventoAtual) === "em_breve"
                  ? `Em breve — abre em ${new Date(eventoAtual.dataAberturaInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}`
                  : getStatusInscricoes(eventoAtual) === "abertas"
                    ? "Inscrições abertas"
                    : "Inscrições encerradas"}
              </span>
              {eventoAtual.dataEncerramentoInscricoes && getStatusInscricoes(eventoAtual) === "abertas" && (
                <span style={{ color: "#6b7a90", fontSize: 12 }}>
                  até {new Date(eventoAtual.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}
                </span>
              )}
              {["admin","organizador","funcionario"].includes(usuarioLogado?.tipo) && !eventoAtual.sumulaLiberada && (
                <span style={styles.statusDotInline(t.textMuted)}>Súmulas restritas</span>
              )}
              {eventoAtual.sumulaLiberada && (
                <span style={styles.statusDotInline(t.success)}>Súmulas liberadas</span>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export { Header, NavBtn };
