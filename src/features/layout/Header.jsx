import React, { useState, useEffect } from "react";
import { _getLocalEventoDisplay } from "../../shared/formatters/utils";

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

const styles = {
  header: { background: "linear-gradient(90deg, #0D0E12 0%, #141720 100%)", borderBottom: "1px solid #1E2130", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 20px rgba(0,0,0,0.5)" },
  headerInner: { maxWidth: 1200, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  logo: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 },
  logoTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, color: "#1976D2", letterSpacing: 3, lineHeight: 1 },
  logoSub: { fontSize: 11, color: "#666", letterSpacing: 1.5, marginTop: 3 },
  nav: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  btnNav: { background: "transparent", border: "1px solid #2a2d3a", color: "#ccc", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", whiteSpace: "nowrap" },
  btnNavActive: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
  btnSair: { background: "transparent", border: "1px solid #3a1a1a", color: "#ff6b6b", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow', sans-serif" },
  eventoBar: { background: "#0D0E12", borderTop: "1px solid #1a1c22", padding: "6px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  eventoBarLabel: { fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase" },
  eventoBarNome: { fontSize: 13, fontWeight: 700, color: "#1976D2", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  eventoBarMeta: { fontSize: 12, color: "#555", marginLeft: "auto" },
  statusDotInline: (cor) => ({ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: cor, background: cor + "22", border: `1px solid ${cor}44`, borderRadius: 10, padding: "2px 8px", whiteSpace: "nowrap" }),
  offlineBanner: { background: "#2a1500", borderBottom: "1px solid #ff880044", padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, color: "#ff8800", fontWeight: 600, letterSpacing: 0.5 },
};

function NavBtn({ onClick, label, active }) {
  return (
    <button onClick={onClick} style={{ ...styles.btnNav, fontWeight: 700, ...(active ? styles.btnNavActive : {}) }}>
      {label}
    </button>
  );
}

function Header({ tela, setTela, usuarioLogado, logout, eventoAtual, perfisDisponiveis, gtIcon, gtNome, gtSlogan, pendenciasRecorde }) {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline  = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      {!online && (
        <div style={styles.offlineBanner}>
          ⚡ Sem conexão com a internet — algumas funções podem não estar disponíveis
        </div>
      )}
      <header style={styles.header}>
      <div style={styles.headerInner}>
        <button style={styles.logo} onClick={() => setTela("home")}>
          <img src={gtIcon} alt="GT" style={{ width:44, height:44, objectFit:"contain", borderRadius:6 }} />
          <div>
            <div style={styles.logoTitle}>{gtNome || "GERENTRACK"}</div>
            <div style={styles.logoSub}>{gtSlogan || "COMPETIÇÃO COM PRECISÃO"}</div>
          </div>
        </button>
        <nav style={styles.nav}>
          <NavBtn onClick={() => setTela("home")} label="Competições" />
          {(() => {
            const pendCount = usuarioLogado?.tipo === "admin" ? (pendenciasRecorde || []).filter(p => p.status === "pendente").length : 0;
            return (
              <div style={{ position:"relative", display:"inline-block" }}>
                <NavBtn onClick={() => setTela("recordes")} label="Recordes" />
                {pendCount > 0 && (
                  <span style={{ position:"absolute", top:-4, right:-4, background:"#ff4444", color:"#fff", fontSize:9,
                    fontWeight:800, borderRadius:10, padding:"1px 5px", minWidth:16, textAlign:"center" }}>{pendCount}</span>
                )}
              </div>
            );
          })()}
          {usuarioLogado ? (
            <>
              {usuarioLogado.tipo === "equipe"       && <NavBtn onClick={() => setTela("painel-equipe")}       label="Painel" active />}
              {usuarioLogado.tipo === "treinador"    && <NavBtn onClick={() => setTela("painel-equipe")}       label="Painel" active />}
              {usuarioLogado.tipo === "organizador" && <NavBtn onClick={() => setTela("painel-organizador")}  label="Painel" active />}
              {usuarioLogado.tipo === "funcionario"  && <NavBtn onClick={() => setTela("painel-organizador")}  label="Painel" active />}
              {usuarioLogado.tipo === "atleta"      && <NavBtn onClick={() => setTela("painel-atleta")}       label="Meu Painel" active />}
              {usuarioLogado.tipo === "admin"       && <NavBtn onClick={() => setTela("admin")}               label="Admin" />}

              {usuarioLogado._temOutrosPerfis && perfisDisponiveis?.length > 1 && (
                <button
                  onClick={() => setTela("selecionar-perfil")}
                  title="Trocar perfil / organizador"
                  style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:"#1a1800",
                    border:"1px solid #1976D244", borderRadius:6, cursor:"pointer", fontSize:11, color:"#1976D2",
                    fontFamily:"'Barlow', sans-serif", fontWeight:600 }}
                >
                  🔄 Trocar Perfil
                </button>
              )}

              <button
                onClick={() => setTela("configuracoes")}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", background:"#141720", border:"1px solid #252837", borderRadius:6, cursor:"pointer" }}
                title="Configurações da conta"
              >
                <span style={{ fontSize:11, color:"#666" }}>👤</span>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
                  <span style={{ fontSize:12, color:"#aaa", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{usuarioLogado.nome}</span>
                  {usuarioLogado._organizadorNome && (
                    <span style={{ fontSize:9, color:"#1976D2", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{usuarioLogado._organizadorNome}</span>
                  )}
                </div>
                <span style={{ fontSize:9, color:"#555" }}>⚙</span>
              </button>
              <button style={styles.btnSair} onClick={logout}>Sair</button>
            </>
          ) : (
            <>
              <button style={{ ...styles.btnNav, background:"#1976D2", color:"#fff", fontWeight:700 }} onClick={() => setTela("login")}>
                Entrar
              </button>
            </>
          )}
        </nav>
      </div>
      {eventoAtual && !["home","recordes","painel","painel-organizador","gerenciar-equipes","funcionarios","cadastrar-atleta","editar-atleta","importar-atletas","treinadores","gerenciar-inscricoes","painel-atleta","admin"].includes(tela) && (
        <div style={styles.eventoBar}>
          <span style={styles.eventoBarLabel}>Competição:</span>
          <span style={styles.eventoBarNome}>{eventoAtual.nome}</span>
          <span style={styles.eventoBarMeta}>
            📅 {new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR")}
            &nbsp;·&nbsp;📍 {_getLocalEventoDisplay(eventoAtual)}
          </span>
          <span style={styles.statusDotInline(getStatusInscricoes(eventoAtual) === "abertas" ? "#7acc44" : getStatusInscricoes(eventoAtual) === "em_breve" ? "#1976D2" : "#ff6b6b")}>
            {getStatusInscricoes(eventoAtual) === "em_breve"
              ? `📅 Em breve — abre em ${new Date(eventoAtual.dataAberturaInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}`
              : getStatusInscricoes(eventoAtual) === "abertas"
                ? "Inscrições abertas"
                : "Inscrições encerradas"}
          </span>
          {eventoAtual.dataEncerramentoInscricoes && getStatusInscricoes(eventoAtual) === "abertas" && (
            <span style={{ color:"#888", fontSize:12 }}>
              até {new Date(eventoAtual.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}
            </span>
          )}
          {["admin","organizador","funcionario"].includes(usuarioLogado?.tipo) && !eventoAtual.sumulaLiberada && (
            <span style={styles.statusDotInline("#555")}>Súmulas restritas</span>
          )}
          {eventoAtual.sumulaLiberada && (
            <span style={styles.statusDotInline("#7acc44")}>Súmulas liberadas</span>
          )}
        </div>
      )}
    </header>
    </>
  );
}

export { Header, NavBtn };
