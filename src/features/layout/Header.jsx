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

function getStyles(t) { return {
  header: { background: t.bgHeader, borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, zIndex: 100, boxShadow: t.shadowLg, paddingTop: "env(safe-area-inset-top, 0px)" },
  headerInner: { maxWidth: 1200, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  headerInnerMobile: { maxWidth: 1200, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  logo: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 },
  logoMobile: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 },
  logoTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, color: t.accent, letterSpacing: 3, lineHeight: 1 },
  logoTitleMobile: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, color: t.accent, letterSpacing: 2, lineHeight: 1 },
  logoSub: { fontSize: 11, color: t.textDimmed, letterSpacing: 1.5, marginTop: 3 },
  nav: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  btnNav: { background: "transparent", border: `1px solid ${t.borderLight}`, color: t.textSecondary, padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", whiteSpace: "nowrap" },
  btnNavMobile: { background: "transparent", border: `1px solid ${t.borderLight}`, color: t.textSecondary, padding: "10px 16px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", whiteSpace: "nowrap", width: "100%" },
  btnNavActive: { background: t.bgHover, borderColor: t.accent, color: t.accent },
  btnSair: { background: "transparent", border: `1px solid ${t.danger}33`, color: t.danger, padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Barlow', sans-serif" },
  btnSairMobile: { background: "transparent", border: `1px solid ${t.danger}33`, color: t.danger, padding: "10px 16px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow', sans-serif", width: "100%" },
  eventoBar: { background: t.bgHeaderSolid, borderTop: `1px solid ${t.border}`, padding: "6px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  eventoBarMobile: { background: t.bgHeaderSolid, borderTop: `1px solid ${t.border}`, padding: "6px 12px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 },
  eventoBarLabel: { fontSize: 11, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase" },
  eventoBarNome: { fontSize: 13, fontWeight: 700, color: t.accent, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  eventoBarMeta: { fontSize: 12, color: t.textDimmed, marginLeft: "auto" },
  eventoBarMetaMobile: { fontSize: 11, color: t.textDimmed },
  statusDotInline: (cor) => ({ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: cor, background: cor + "22", border: `1px solid ${cor}44`, borderRadius: 10, padding: "2px 8px", whiteSpace: "nowrap" }),
  offlineBanner: { background: t.bgCardAlt, borderBottom: `1px solid ${t.warning}44`, padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, color: t.warning, fontWeight: 600, letterSpacing: 0.5 },
  hamburger: { background: "none", border: `1px solid ${t.borderLight}`, borderRadius: 6, cursor: "pointer", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4, alignItems: "center", justifyContent: "center" },
  hamburgerLine: { width: 20, height: 2, background: t.textSecondary, borderRadius: 1 },
  mobileMenu: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: t.bgOverlay, zIndex: 200, display: "flex", justifyContent: "flex-end" },
  mobileMenuPanel: { background: t.bgHeaderSolid, width: 280, maxWidth: "80vw", height: "100%", overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 8, borderLeft: `1px solid ${t.border}`, boxShadow: "-4px 0 30px rgba(0,0,0,0.5)" },
  mobileMenuHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${t.border}` },
  mobileMenuClose: { background: "none", border: "none", color: t.textMuted, fontSize: 24, cursor: "pointer", padding: "4px 8px" },
}; }

function NavBtn({ onClick, label, active, mobile, styles }) {
  const base = mobile ? styles.btnNavMobile : styles.btnNav;
  return (
    <button onClick={onClick} style={{ ...base, fontWeight: 700, ...(active ? styles.btnNavActive : {}) }}>
      {label}
    </button>
  );
}

function Header({ tela, setTela, usuarioLogado, logout, eventoAtual, perfisDisponiveis, gtIcon, gtNome, gtSlogan, pendenciasRecorde, ranking, temaClaro, setTemaClaro, online, pendentesOffline }) {
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
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", background: t.accentBg,
                border: `1px solid ${t.accentBorder}`, borderRadius: 6, cursor: "pointer", fontSize: 10, color: t.accent,
                fontFamily: "'Barlow', sans-serif", fontWeight: 600, ...(mobile ? { width: "100%", padding: "10px 16px", fontSize: 13, justifyContent: "center" } : {}) }}
            >
              Trocar
            </button>
          )}

          <button
            onClick={() => navegar("configuracoes")}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, cursor: "pointer", ...(mobile ? { width: "100%", padding: "10px 16px" } : {}) }}
            title="Configurações da conta"
          >
            <span style={{ fontSize: 11, color: t.textDimmed }}>👤</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span style={{ fontSize: 11, color: t.textTertiary, maxWidth: mobile ? "none" : 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{usuarioLogado.nome}</span>
              {usuarioLogado._organizadorNome && (
                <span style={{ fontSize: 9, color: t.accent, maxWidth: mobile ? "none" : 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{usuarioLogado._organizadorNome}</span>
              )}
            </div>
            <span style={{ fontSize: 9, color: t.textDimmed }}>⚙</span>
          </button>
          <button style={mobile ? styles.btnSairMobile : styles.btnSair} onClick={() => { logout(); setMenuAberto(false); }}>Sair</button>
        </>
      ) : (
        <button style={{ ...(mobile ? styles.btnNavMobile : styles.btnNav), background: t.accent, color: "#fff", fontWeight: 700 }} onClick={() => navegar("login")}>
          Entrar
        </button>
      )}
    </>
  );

  const temaToggle = (
    <div style={{
      display: "flex", alignItems: "center",
      background: t.bgHeaderSolid,
      border: `1px solid ${t.border}`,
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
          background: !temaClaro ? t.borderInput : "transparent",
          border: "none", borderRadius: 16, cursor: "pointer",
          padding: "4px 10px", fontSize: 11,
          color: !temaClaro ? t.textSecondary : t.textDisabled,
          fontFamily: "'Barlow', sans-serif", letterSpacing: 0.5, transition: "all 0.2s",
        }}
      >
        escuro
      </button>
      <button
        onClick={() => setTemaClaro(true)}
        title="Modo claro"
        style={{
          background: temaClaro ? t.borderInput : "transparent",
          border: "none", borderRadius: 16, cursor: "pointer",
          padding: "4px 10px", fontSize: 11,
          color: temaClaro ? t.textSecondary : t.textDisabled,
          fontFamily: "'Barlow', sans-serif", letterSpacing: 0.5, transition: "all 0.2s",
        }}
      >
        claro
      </button>
    </div>
  );

  const showEventoBar = eventoAtual && !["home","login","cadastro-equipe","cadastro-organizador","cadastro-atleta-login","recuperar-senha","trocar-senha","selecionar-perfil","configuracoes","recordes","ranking","painel","painel-organizador","gerenciar-equipes","funcionarios","cadastrar-atleta","editar-atleta","importar-atletas","treinadores","gerenciar-inscricoes","painel-atleta","admin","organizador-perfil"].includes(tela);

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
            <img src={gtIcon} alt="GT" style={{ width: mobile ? 34 : 44, height: mobile ? 34 : 44, objectFit: "contain", borderRadius: 6 }} />
            <div>
              <div style={mobile ? styles.logoTitleMobile : styles.logoTitle}>{gtNome || "GERENTRACK"}</div>
              {!mobile && <div style={styles.logoSub}>{gtSlogan || "COMPETIÇÃO COM PRECISÃO"}</div>}
            </div>
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
                <span style={{ color: t.textMuted, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>Menu</span>
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
              📅 {new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR")}
              &nbsp;·&nbsp;📍 {_getLocalEventoDisplay(eventoAtual)}
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
                <span style={{ color: t.textMuted, fontSize: 12 }}>
                  até {new Date(eventoAtual.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}
                </span>
              )}
              {["admin","organizador","funcionario"].includes(usuarioLogado?.tipo) && !eventoAtual.sumulaLiberada && (
                <span style={styles.statusDotInline(t.textDisabled)}>Súmulas restritas</span>
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
