import React from "react";
import { getStatusEvento, labelStatusEvento } from "./eventoHelpers";
import { _getLocalEventoDisplay } from "../../shared/formatters/utils";

// Helper local — prioriza "em_breve" antes de checar inscricoesEncerradas
function _dtInsc(data, hora) {
  if (!data) return null;
  try { return new Date(data + "T" + (hora || "00:00") + ":00"); } catch { return null; }
}
function getStatusInscLocal(ev) {
  if (!ev) return "encerradas";
  const agora = new Date();
  const dtAb  = _dtInsc(ev.dataAberturaInscricoes, ev.horaAberturaInscricoes);
  if (dtAb && agora < dtAb) return "em_breve";
  const dtEnc = _dtInsc(ev.dataEncerramentoInscricoes, ev.horaEncerramentoInscricoes);
  if (dtEnc && agora > dtEnc) return "encerradas";
  if (ev.inscricoesEncerradas) return "encerradas";
  return "abertas";
}

const styles = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 20, letterSpacing: 1 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  statCard: { background: "#111318", border: "1px solid #1E2130", borderRadius: 12, padding: "18px 24px", textAlign: "center", minWidth: 100 },
  statValue: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: "#1976D2", lineHeight: 1, marginBottom: 6 },
  statLabel: { fontSize: 13, color: "#888", letterSpacing: 1 },
  btnPrimary: { background: "linear-gradient(135deg, #1976D2, #1565C0)", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: "#1976D2", border: "2px solid #1976D2", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost: { background: "transparent", color: "#888", border: "1px solid #2a2d3a", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  btnIconSm: { background: "#141720", border: "1px solid #252837", color: "#888", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: "#1a0a0a", border: "1px solid #3a1a1a", color: "#ff6b6b", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: "1px solid #1E2130" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#0D0E12", padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1E2130" },
  td: { padding: "12px 16px", fontSize: 14, color: "#bbb", borderBottom: "1px solid #12141a" },
  tr: { transition: "background 0.15s" },
  trOuro: { background: "#1a170a" },
  trPrata: { background: "#12141a" },
  trBronze: { background: "#14100a" },
  marca: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: "#1976D2" },
  emptyState: { textAlign: "center", padding: "60px 20px", color: "#444", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },
  painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  painelBtns: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { width: "100%", background: "#141720", borderWidth: 1, borderStyle: "solid", borderColor: "#252837", borderRadius: 8, padding: "10px 14px", color: "#E0E0E0", fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  select: { width: "100%", background: "#141720", borderWidth: 1, borderStyle: "solid", borderColor: "#252837", borderRadius: 8, padding: "10px 14px", color: "#E0E0E0", fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  erro: { background: "#2a1010", border: "1px solid #ff4444", color: "#ff6b6b", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn: { background: "none", border: "none", color: "#1976D2", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", padding: 0 },
  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  badgeGold: { background: "#1976D222", color: "#1976D2", border: "1px solid #1976D244", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  catBanner: { background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 14, color: "#aaa" },
  catPreview: { background: "#141720", border: "1px solid #1976D2", borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: "#aaa" },
  atletaInfo: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12, padding: "10px 14px", background: "#141720", borderRadius: 8, fontSize: 13 },
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#1976D2", marginBottom: 16 },
  formPage: { maxWidth: 640, margin: "60px auto", padding: "0 24px 80px" },
  formCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 16, padding: 32, marginBottom: 20 },
  formTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 8 },
  formSub: { color: "#666", textAlign: "center", fontSize: 14, marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },
  fieldError: { color: "#ff6b6b", fontSize: 12, marginTop: 2 },
  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: "#888", transition: "all 0.2s" },
  radioLabelActive: { background: "#1c1f2e", border: "1px solid #1976D2", color: "#1976D2" },
  resumoInscricao: { background: "#0E1016", border: "1px solid #1976D233", borderRadius: 10, padding: "16px 20px", marginTop: 16 },
  tagProva: { background: "#1976D222", color: "#1976D2", border: "1px solid #1976D244", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  sumuCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  savedBadge: { background: "#0a2a0a", border: "1px solid #2a6a2a", color: "#4aaa4a", padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  digitarDica: { color: "#666", fontSize: 12 },
  inputMarca: { background: "#141720", border: "1px solid #252837", borderRadius: 6, padding: "8px 12px", color: "#1976D2", fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
  infoCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: "#1976D2", marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: "1px solid #151820", fontSize: 14, color: "#bbb", display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: "#1976D2", fontWeight: 700 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: "linear-gradient(180deg, #0D1018 0%, transparent 100%)", borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroOverlay: { position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 100%)", zIndex: 0, borderRadius: 16, pointerEvents: "none" },
  heroContent: { position: "relative", zIndex: 1 },
  heroBadge: { display: "inline-block", background: "#1976D2", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: "#666" },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: "#888", flexWrap: "wrap", borderTop: "1px solid #141820", paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? "#3a0a0a" : status === "hoje_pre" ? "#2a2a0a" : status === "futuro" ? "#0a2a0a" : "#1a1a1a",
    color: status === "ao_vivo" ? "#ff6b6b" : status === "hoje_pre" ? "#1976D2" : status === "futuro" ? "#7acc44" : "#555",
    border: `1px solid ${status === "ao_vivo" ? "#6a2a2a" : status === "hoje_pre" ? "#4a4a0a" : status === "futuro" ? "#2a5a2a" : "#333"}`,
  }),
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: "#fff", fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  statusBarItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  statusDot: (cor) => ({ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }),
  statusDotInline: (cor) => ({ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: cor, background: cor + "22", border: `1px solid ${cor}44`, borderRadius: 10, padding: "2px 8px", whiteSpace: "nowrap" }),
  statusControlsCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusControlsTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: "#1976D2", letterSpacing: 1, marginBottom: 14 },
  statusControlsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  statusControlBox: (ativo, corAtiva, bgAtiva, disabled) => ({
    background: ativo ? bgAtiva : "#141720",
    border: `1px solid ${ativo ? corAtiva + "66" : "#252837"}`,
    borderRadius: 10, padding: "14px 16px",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s",
  }),
  statusControlLabel: { display: "flex", alignItems: "flex-start", cursor: "pointer", gap: 0 },
  permissividadeBox: { background: "#0d1117", border: "1px solid #1976D233", borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 4 },
  permissividadeHeader: { marginBottom: 10 },
  permissividadeLabel: { display: "flex", alignItems: "center", cursor: "pointer", fontSize: 14, color: "#ddd", fontWeight: 600 },
  permissividadeInfo: { background: "#111620", borderRadius: 8, padding: "12px 16px", borderLeft: "3px solid #1976D2" },
  permissividadeTag: (ativo) => ({ display: "inline-block", background: ativo ? "#1a2a0a" : "#1a1a1a", border: `1px solid ${ativo ? "#4a8a2a" : "#333"}`, color: ativo ? "#7acc44" : "#555", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600 }),
  permissividadeAlert: { display: "flex", gap: 14, alignItems: "flex-start", background: "#12180a", border: "1px solid #4a8a2a", borderRadius: 10, padding: "14px 18px", marginBottom: 20 },
  permissividadeAlertIcon: { fontSize: 28, flexShrink: 0, marginTop: 2 },
  permissividadeAlertTitle: { fontWeight: 700, color: "#7acc44", fontSize: 15, marginBottom: 4 },
  permissividadeAlertBody: { color: "#aaa", fontSize: 13, lineHeight: 1.6, marginBottom: 6 },
  permissividadeAlertRodape: { fontSize: 12, color: "#666", fontStyle: "italic" },
  filtroProvasBar: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 20 },
  filtroProvasBloco: { display: "flex", flexDirection: "column", gap: 8 },
  filtroProvasLabel: { fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 },
  filtroProvasPills: { display: "flex", flexWrap: "wrap", gap: 6 },
  filtroPill: { background: "#141720", border: "1px solid #252837", color: "#666", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5, transition: "all 0.15s" },
  filtroPillAtivo: { background: "#1a1c22", border: "1px solid #1976D2", color: "#1976D2" },
  filtroClearBtn: { background: "none", border: "none", color: "#1976D288", cursor: "pointer", fontSize: 11, fontFamily: "'Barlow', sans-serif", padding: "0 4px", textDecoration: "underline" },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? "#1a1c22" : "transparent", color: ativo ? "#1976D2" : "#444", border: `1px solid ${ativo ? "#1976D244" : "#1E2130"}` }),
  stepDivider: { flex: 1, height: 1, background: "#1E2130", margin: "0 8px" },
  modoSwitch: { display: "flex", gap: 0, background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: "#666", padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: "#141720", color: "#1976D2" },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: "#0E1016", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
  grupoProvasBox: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 10, marginBottom: 16, overflow: "hidden" },
  grupoProvasHeader: { background: "#0D0E12", borderBottom: "1px solid #1E2130", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  provaCheckBtn: { background: "#0E1016", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", lineHeight: 1.4, userSelect: "none" },
  provaCheckBtnSel: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
};

function StatCard({ value, label }) {
  return (
    <div style={{ background:"#0E1016", border:"1px solid #1E2130", borderRadius:12, padding:"20px 24px", flex:1, minWidth:160, textAlign:"center" }}>
      <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:36, fontWeight:900, color:"#1976D2", lineHeight:1 }}>{value}</div>
      <div style={{ color:"#666", fontSize:12, letterSpacing:1, textTransform:"uppercase", marginTop:6 }}>{label}</div>
    </div>
  );
}

function InfoCard({ icon, title, items }) {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoCardTitle}>{icon ? `${icon} ` : ""}{title}</div>
      <ul style={styles.infoList}>
        {items.map((item, i) => (
          <li key={i} style={styles.infoItem}>
            <span style={styles.infoItemDot}>›</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TelaHome({ setTela, eventos, inscricoes, atletas, resultados, selecionarEvento, usuarioLogado, excluirEvento, organizadores, equipes, siteBranding }) {
  const totalResultados = resultados && typeof resultados === "object"
    ? Object.values(resultados).reduce((a, b) => a + (b && typeof b === "object" ? Object.keys(b).length : 0), 0)
    : 0;

  const [maisEventosPag, setMaisEventosPag] = React.useState(0);
  const MAIS_POR_PAG = 9;

  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const aprovados = eventos
    .filter(ev => !ev.statusAprovacao || ev.statusAprovacao === "aprovado");

  const proximosEventos = aprovados
    .filter(ev => {
      if (!ev.data) return false;
      const d = new Date(ev.data + "T12:00:00");
      return d >= hoje && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    })
    .sort((a, b) => new Date(a.data) - new Date(b.data));

  const eventoPassado = (ev) => {
    if (ev.competicaoFinalizada) return true;
    if (!ev.data) return false;
    return new Date(ev.data + "T12:00:00") < hoje;
  };
  const eventosPassados = aprovados
    .filter(eventoPassado)
    .sort((a, b) => new Date(b.data) - new Date(a.data));

  const maisEventos = aprovados
    .filter(ev => !eventoPassado(ev) && !proximosEventos.find(p => p.id === ev.id))
    .sort((a, b) => {
      const da = a.data ? new Date(a.data) : new Date(9999,0,1);
      const db = b.data ? new Date(b.data) : new Date(9999,0,1);
      return da - db;
    });

  const totalPagsMais = Math.ceil(maisEventos.length / MAIS_POR_PAG);
  const maisEventosPagAtual = maisEventos.slice(maisEventosPag * MAIS_POR_PAG, (maisEventosPag + 1) * MAIS_POR_PAG);

  const renderEvCard = (ev) => {
    const nInscs = inscricoes.filter((i) => i.eventoId === ev.id).length;
    const nAtletas = [...new Set(inscricoes.filter((i) => i.eventoId === ev.id).map((i) => i.atletaId))].length;
    const nProvas = (ev.provasPrograma || []).length;
    const dataEv = new Date(ev.data + "T12:00:00");
    const status = getStatusEvento(ev, resultados);
    const stInsc = getStatusInscLocal(ev);
    const insBadgeColor = stInsc === "em_breve" ? "#1976D2" : "#888";
    const insBadgeLabel = stInsc === "em_breve" ? `📅 Abre ${new Date(ev.dataAberturaInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}` : "🔒 Inscrições encerradas";
    return (
      <div key={ev.id} style={{ ...styles.eventoCard, padding:0, overflow:"hidden" }}>
        <div style={{ position:"relative", width:"100%", minHeight: ev.logoCompeticao ? 0 : 60, background: ev.logoCompeticao ? "transparent" : "linear-gradient(135deg, #0a1a2a 0%, #1a0a2a 100%)", borderBottom:"1px solid #1E2130", overflow:"hidden" }}>
          {ev.logoCompeticao ? (
            <img src={ev.logoCompeticao} alt="" style={{ width:"100%", display:"block", objectFit:"contain" }} />
          ) : (
            <span style={{ fontSize:28, opacity:0.3 }}>🏟️</span>
          )}
          <div style={{ position:"absolute", top:10, left:12, display:"flex", flexDirection:"column", gap:4 }}>
            <div style={styles.eventoStatusBadge(status)}>{labelStatusEvento(status, ev)}</div>
            {stInsc !== "abertas" && stInsc !== "em_breve" && (
              <div style={{ background: insBadgeColor + "22", color: insBadgeColor, border: `1px solid ${insBadgeColor}44`, borderRadius: 10, padding: "2px 8px", fontSize: 11, fontWeight: 600, backdropFilter:"blur(4px)" }}>{insBadgeLabel}</div>
            )}
          </div>
          {usuarioLogado?.tipo === "admin" && (
            <div style={{ position:"absolute", top:8, right:10, display:"flex", gap:6 }}>
              <button style={{ ...styles.btnIconSm, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }} onClick={() => { selecionarEvento(ev.id); setTela("novo-evento"); }} title="Editar">✏️</button>
              <button style={{ ...styles.btnIconSmDanger, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }} onClick={() => excluirEvento(ev.id)} title="Excluir">🗑</button>
            </div>
          )}
        </div>
        <div style={{ padding:"14px 20px 20px" }}>
          <div style={styles.eventoCardNome}>{ev.nome}</div>
          <div style={styles.eventoCardMeta}>
            <span>📅 {dataEv.toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" })}
              {ev.horaInicio && <> · ⏰ {ev.horaInicio}h</>}
            </span>
          </div>
          <div style={styles.eventoCardMeta}><span>📍 {_getLocalEventoDisplay(ev)}</span></div>
          {(ev.dataAberturaInscricoes || ev.dataEncerramentoInscricoes) && (
            <div style={styles.eventoCardMeta}>
              <span>📋 Inscrições:&nbsp;
                {ev.dataAberturaInscricoes && <>{new Date(ev.dataAberturaInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}</>}
                {ev.dataAberturaInscricoes && ev.dataEncerramentoInscricoes && " a "}
                {ev.dataEncerramentoInscricoes && <>{new Date(ev.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}</>}
              </span>
            </div>
          )}
          <div style={styles.eventoCardStats}>
            <span>🎯 {nProvas} prova{nProvas !== 1 ? "s" : ""}</span>
            <span>🏃 {nAtletas} atleta{nAtletas !== 1 ? "s" : ""}</span>
            <span>✍️ {nInscs} {nInscs !== 1 ? "inscrições" : "inscrição"}</span>
          </div>
          <div style={{ display:"flex", gap:6, marginBottom:10 }}>
            {(() => {
              const tpU = usuarioLogado?.tipo;
              const temAcessoSumula = tpU === "admin" || tpU === "organizador" ||
                (tpU === "funcionario" && (usuarioLogado?.permissoes?.includes("sumulas") || usuarioLogado?.permissoes?.includes("resultados"))) ||
                (ev.sumulaLiberada && usuarioLogado);
              return temAcessoSumula && (
                <button style={{...styles.btnSecondary, flex:1}} onClick={() => { selecionarEvento(ev.id); setTela("sumulas"); }}>
                  📋 Súmulas
                </button>
              );
            })()}
            {(status === "ao_vivo" || status === "encerrado" || status === "hoje_pre") && (
              <button style={{...styles.btnSecondary, flex:1}} onClick={() => { selecionarEvento(ev.id); setTela("resultados"); }}>
                🏆 Resultados
              </button>
            )}
          </div>
          <button style={styles.btnPrimary} onClick={() => selecionarEvento(ev.id)}>
            Acessar Competição →
          </button>
        </div>
      </div>
    );
  };


  return (
    <div style={styles.page}>
      <div style={{
        ...styles.heroSection,
        ...(siteBranding?.heroBg ? {
          backgroundImage: `url(${siteBranding.heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          background: undefined,
        } : {}),
      }}>
        {siteBranding?.heroBg && <div style={styles.heroOverlay} />}
        <div style={styles.heroContent}>
        <div style={styles.heroBadge}>PLATAFORMA DE COMPETIÇÕES</div>
        <h1 style={styles.heroTitle}>GERENTRACK</h1>
        <p style={{ color:"#888", fontSize:16, marginBottom:32 }}>
          Gerencie competições, inscrições, súmulas e resultados em um só lugar.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:20, marginBottom:40 }}>
          <StatCard value={eventos.filter(ev=>!ev.statusAprovacao||ev.statusAprovacao==="aprovado").length} label="Competições" />
          <StatCard value={organizadores?.filter(o => !o.status || o.status === "aprovado").length || 0} label="Organizadores" />
          <StatCard value={equipes?.length || 0} label="Equipes" />
          <StatCard value={atletas.length} label="Atletas" />
        </div>
        <div style={styles.heroBtns}>
          {usuarioLogado?.tipo === "admin" && (
            <button style={{ ...styles.btnPrimary, width:"auto" }} onClick={() => { selecionarEvento(null); setTela("novo-evento"); }}>
              + Nova Competição
            </button>
          )}
        </div>
        </div>
      </div>

      {/* ── PRÓXIMOS EVENTOS (mês atual) ── */}
      {aprovados.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={{ fontSize:56 }}>🏟</span>
          <p>Nenhuma competição cadastrada ainda.</p>
          {usuarioLogado?.tipo === "admin" && (
            <button style={{ ...styles.btnPrimary, width:"auto" }} onClick={() => { selecionarEvento(null); setTela("novo-evento"); }}>
              Cadastrar primeira competição
            </button>
          )}
        </div>
      ) : (
        <>
          {proximosEventos.length > 0 && (
            <div style={{ marginBottom:48 }}>
              <h2 style={styles.sectionTitle}>📅 Próximos Eventos</h2>
              <div style={styles.eventosGrid}>
                {proximosEventos.map(ev => renderEvCard(ev))}
              </div>
            </div>
          )}

          {eventosPassados.length > 0 && (
            <div style={{ marginBottom:48 }}>
              <h2 style={styles.sectionTitle}>🏆 Eventos Passados</h2>
              <div style={styles.eventosGrid}>
                {eventosPassados.map(ev => renderEvCard(ev))}
              </div>
            </div>
          )}

          {maisEventos.length > 0 && (
            <div style={{ marginBottom:48 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:24 }}>
                <h2 style={{ ...styles.sectionTitle, margin:0 }}>
                  📋 Mais Eventos
                  {totalPagsMais > 1 && <span style={{ color:"#555", fontSize:16, fontWeight:400, marginLeft:10 }}>— Seção {maisEventosPag + 1} de {totalPagsMais}</span>}
                </h2>
                {totalPagsMais > 1 && (
                  <div style={{ display:"flex", gap:8 }}>
                    <button disabled={maisEventosPag === 0}
                      onClick={() => setMaisEventosPag(p => p - 1)}
                      style={{ ...styles.btnGhost, opacity: maisEventosPag === 0 ? 0.3 : 1, cursor: maisEventosPag === 0 ? "default" : "pointer" }}>
                      ‹ Anterior
                    </button>
                    <button disabled={maisEventosPag >= totalPagsMais - 1}
                      onClick={() => setMaisEventosPag(p => p + 1)}
                      style={{ ...styles.btnGhost, opacity: maisEventosPag >= totalPagsMais - 1 ? 0.3 : 1, cursor: maisEventosPag >= totalPagsMais - 1 ? "default" : "pointer" }}>
                      Próximo ›
                    </button>
                  </div>
                )}
              </div>
              <div style={styles.eventosGrid}>
                {maisEventosPagAtual.map(ev => renderEvCard(ev))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:24, marginTop:48 }}>
        <InfoCard title="Provas de Pista" items={["Corridas Rasas","Corridas c/ Barreiras","Corrida c/ Obstáculos","Marcha Atlética","Revezamentos"]} />
        <InfoCard title="Provas de Campo" items={["Salto em Distância","Salto em Altura","Salto Triplo","Salto com Vara","Arremesso do Peso","Lançamento do Disco","Lançamento do Dardo","Lançamento do Martelo"]} />
        <InfoCard title="Provas Combinadas" items={["Decatlo (10 provas)","Heptatlo (7 provas)","Hexatlo Masc. (6 provas)","Pentatlo Fem. (5 provas)","Tetratlo (4 provas)"]} />
      </div>
    </div>
  );
}
