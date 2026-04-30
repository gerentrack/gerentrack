import { temaDark } from "../tema";

const styles = {
  root: { minHeight: "100vh", background: "#0A0B0D", display: "flex", flexDirection: "column" },
  main: { flex: 1 },

  header: { background: "linear-gradient(90deg, #0D0E12 0%, #141720 100%)", borderBottom: "1px solid #1E2130", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 20px rgba(0,0,0,0.5)" },
  headerInner: { maxWidth: 1200, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  logo: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 },
  logoIcon: { fontSize: 36 },
  logoTitle: { fontFamily: temaDark.fontTitle, fontSize: 24, fontWeight: 900, color: "#1976D2", letterSpacing: 3, lineHeight: 1 },
  logoSub: { fontSize: 11, color: "#666", letterSpacing: 1.5, marginTop: 3 },

  nav: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  btnNav: { background: "transparent", border: "1px solid #2a2d3a", color: "#ccc", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontFamily: temaDark.fontBody, transition: "all 0.2s", whiteSpace: "nowrap" },
  btnNavActive: { background: temaDark.bgHover, borderColor: "#1976D2", color: "#1976D2" },
  btnSair: { background: "transparent", border: "1px solid #3a1a1a", color: "#ff6b6b", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: temaDark.fontBody },

  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: temaDark.fontTitle, fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 24, letterSpacing: 1 },

  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: "linear-gradient(180deg, #0D1018 0%, transparent 100%)", borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: "#1976D2", color: "#fff", fontFamily: temaDark.fontTitle, fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: temaDark.fontTitle, fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroMeta: { color: "#888", fontSize: 15, marginBottom: 32 },
  heroStats: { display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 36 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },

  statCard: { background: "#1C1F2A", border: "1px solid #1E2130", borderRadius: 12, padding: "18px 24px", textAlign: "center", minWidth: 100 },
  statValue: { fontFamily: temaDark.fontTitle, fontSize: 36, fontWeight: 900, color: "#1976D2", lineHeight: 1, marginBottom: 6 },
  statLabel: { fontSize: 13, color: "#888", letterSpacing: 1 },

  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },

  btnPrimary: { background: "linear-gradient(135deg, #1976D2, #1565C0)", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: temaDark.fontTitle, letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: "#1976D2", border: "2px solid #1976D2", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: temaDark.fontTitle, letterSpacing: 1 },
  btnGhost: { background: "transparent", color: "#888", border: "1px solid #2a2d3a", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: temaDark.fontBody },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 },
  infoCard: { background: "#181B25", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: temaDark.fontTitle, fontSize: 20, fontWeight: 700, color: "#1976D2", marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: `1px solid ${temaDark.border}`, fontSize: 14, color: "#bbb", display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: "#1976D2", fontWeight: 700 },

  catSection: { marginTop: 40 },
  sectionTitle: { fontFamily: temaDark.fontTitle, fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 20, letterSpacing: 1 },
  catGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 },
  catCard: { background: "#181B25", border: "1px solid #1E2130", borderRadius: 10, padding: "14px 18px" },
  catName: { fontFamily: temaDark.fontTitle, fontSize: 20, fontWeight: 800, color: "#1976D2" },
  catRange: { fontSize: 12, color: "#666", marginTop: 4 },

  formPage: { maxWidth: 640, margin: "60px auto", padding: "0 24px 80px" },
  formCard: { background: "#181B25", border: "1px solid #1E2130", borderRadius: 16, padding: 32, marginBottom: 20 },
  formIcon: { fontSize: 48, textAlign: "center", marginBottom: 16 },
  formTitle: { fontFamily: temaDark.fontTitle, fontSize: 32, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 8 },
  formSub: { color: "#666", textAlign: "center", fontSize: 14, marginBottom: 24 },
  formLink: { textAlign: "center", marginTop: 16, color: "#666", fontSize: 13 },
  formHint: { textAlign: "center", marginTop: 12, color: "#444" },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },

  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  input: { width: "100%", background: "#141720", borderWidth: 1, borderStyle: "solid", borderColor: "#252837", borderRadius: 8, padding: "10px 14px", color: "#E0E0E0", fontSize: 14, fontFamily: temaDark.fontBody, outline: "none", marginBottom: 4 },
  inputError: { borderColor: "#ff4444" },
  fieldError: { color: "#ff6b6b", fontSize: 12, marginTop: 2 },
  select: { width: "100%", background: "#141720", borderWidth: 1, borderStyle: "solid", borderColor: "#252837", borderRadius: 8, padding: "10px 14px", color: "#E0E0E0", fontSize: 14, fontFamily: temaDark.fontBody, outline: "none", marginBottom: 4 },
  erro: { background: "#2a1010", border: "1px solid #ff4444", color: "#ff6b6b", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn: { background: "none", border: "none", color: "#1976D2", cursor: "pointer", fontSize: 13, fontFamily: temaDark.fontBody, padding: 0 },

  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: "#888", transition: "all 0.2s" },
  radioLabelActive: { background: "#1c1f2e", border: "1px solid #1976D2", color: "#1976D2" },

  catPreview: { background: "#141720", border: "1px solid #1976D2", borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: "#aaa" },
  atletaInfo: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12, padding: "10px 14px", background: "#141720", borderRadius: 8, fontSize: 13 },

  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  badgeGold: { background: "#1976D222", color: "#1976D2", border: "1px solid #1976D244", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },

  painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  painelBtns: { display: "flex", gap: 10 },

  tableWrap: { overflowX: "auto", borderRadius: 12, border: "1px solid #1E2130" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#0D0E12", padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1E2130" },
  td: { padding: "12px 16px", fontSize: 14, color: "#bbb", borderBottom: `1px solid ${temaDark.border}` },
  tr: { transition: "background 0.15s" },
  trOuro: { background: "#1a170a" },
  trPrata: { background: temaDark.trPrata },
  trBronze: { background: "#14100a" },
  marca: { fontFamily: temaDark.fontTitle, fontSize: 20, fontWeight: 800, color: "#1976D2" },

  emptyState: { textAlign: "center", padding: "60px 20px", color: "#444", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },

  modoSwitch: { display: "flex", gap: 0, background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: "#666", padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: temaDark.fontBody, transition: "all 0.2s" },
  modoBtnActive: { background: "#141720", color: "#1976D2" },

  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },

  provaSection: { marginBottom: 28 },
  provaSecTitle: { fontFamily: temaDark.fontTitle, fontSize: 20, fontWeight: 700, color: "#aaa", marginBottom: 12, letterSpacing: 1 },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: "#181B25", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: temaDark.fontBody, transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: temaDark.bgHover, borderColor: "#1976D2", color: "#1976D2" },
  provaBtnInscrito: { opacity: 0.5, cursor: "not-allowed", borderColor: "#2a4a2a", color: "#4a8a4a" },

  resumoInscricao: { background: "#181B25", border: "1px solid #1976D233", borderRadius: 10, padding: "16px 20px", marginTop: 16 },
  tagProva: { background: "#1976D222", color: "#1976D2", border: "1px solid #1976D244", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },

  sumuCard: { background: "#181B25", border: "1px solid #1E2130", borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: temaDark.fontTitle, fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },

  digitarSection: { background: "#181B25", border: "1px solid #1E2130", borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  digitarDica: { color: "#666", fontSize: 12 },
  inputMarca: { background: "#141720", border: "1px solid #252837", borderRadius: 6, padding: "8px 12px", color: "#1976D2", fontSize: 16, fontFamily: temaDark.fontTitle, fontWeight: 700, width: 120, outline: "none" },
  savedBadge: { background: "#0a2a0a", border: "1px solid #2a6a2a", color: "#4aaa4a", padding: "8px 16px", borderRadius: 8, fontSize: 13 },

  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: "#181B25", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: temaDark.fontTitle, fontSize: 22, fontWeight: 800, color: "#1976D2", marginBottom: 16 },

  catBanner: { background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 14, color: "#aaa" },

  permissividadeTag: (ativo) => ({
    display: "inline-block",
    background: ativo ? "#1a2a0a" : temaDark.bgCard,
    border: `1px solid ${ativo ? "#4a8a2a" : "#333"}`,
    color: ativo ? "#7acc44" : "#555",
    borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600,
  }),
  permissividadeBox: {
    background: temaDark.bgHeaderSolid, border: "1px solid #1976D233",
    borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 4,
  },
  permissividadeHeader: { marginBottom: 10 },
  permissividadeLabel: {
    display: "flex", alignItems: "center", cursor: "pointer",
    fontSize: 14, color: "#ddd", fontWeight: 600,
  },
  permissividadeInfo: {
    background: temaDark.bgHover, borderRadius: 8, padding: "12px 16px",
    borderLeft: "3px solid #1976D2",
  },
  permissividadeAlert: {
    display: "flex", gap: 14, alignItems: "flex-start",
    background: "#12180a", border: "1px solid #4a8a2a",
    borderRadius: 10, padding: "14px 18px", marginBottom: 20,
  },
  permissividadeAlertIcon: { fontSize: 28, flexShrink: 0, marginTop: 2 },
  permissividadeAlertTitle: { fontWeight: 700, color: "#7acc44", fontSize: 15, marginBottom: 4 },
  permissividadeAlertBody: { color: "#aaa", fontSize: 13, lineHeight: 1.6, marginBottom: 6 },
  permissividadeAlertRodape: { fontSize: 12, color: "#666", fontStyle: "italic" },
  badgeOficial: {
    background: "#1a1a2a", color: "#8888cc", border: "1px solid #333366",
    borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600,
  },
  badgeNorma: {
    background: "#1a2a0a", color: "#7acc44", border: "1px solid #3a6a1a",
    borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, cursor: "help",
  },

  filtroProvasBar: {
    background: "#181B25", border: "1px solid #1E2130", borderRadius: 12,
    padding: "16px 20px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 20,
  },
  filtroProvasBloco: { display: "flex", flexDirection: "column", gap: 8 },
  filtroProvasLabel: { fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 },
  filtroProvasPills: { display: "flex", flexWrap: "wrap", gap: 6 },
  filtroPill: {
    background: "#141720", border: "1px solid #252837", color: "#666",
    borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600,
    cursor: "pointer", fontFamily: temaDark.fontTitle, letterSpacing: 0.5,
    transition: "all 0.15s",
  },
  filtroPillAtivo: {
    background: temaDark.bgHover, border: "1px solid #1976D2", color: "#1976D2",
  },
  filtroClearBtn: {
    background: "none", border: "none", color: "#1976D288", cursor: "pointer",
    fontSize: 11, fontFamily: temaDark.fontBody, padding: "0 4px", textDecoration: "underline",
  },

  statusBar: {
    display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
    background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10,
    padding: "12px 18px", marginBottom: 24,
  },
  statusBarItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  statusDot: (cor) => ({
    display: "inline-block", width: 8, height: 8, borderRadius: "50%",
    background: cor, flexShrink: 0,
  }),
  statusDotInline: (cor) => ({
    display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11,
    color: cor, background: cor + "22", border: `1px solid ${cor}44`,
    borderRadius: 10, padding: "2px 8px", whiteSpace: "nowrap",
  }),
  statusControlsCard: {
    background: "#181B25", border: "1px solid #1E2130", borderRadius: 12,
    padding: "20px 24px", marginBottom: 28,
  },
  statusControlsTitle: {
    fontFamily: temaDark.fontTitle, fontSize: 16, fontWeight: 700,
    color: "#1976D2", letterSpacing: 1, marginBottom: 14,
  },
  statusControlsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  statusControlBox: (ativo, corAtiva, bgAtiva, disabled) => ({
    background: ativo ? bgAtiva : "#141720",
    border: `1px solid ${ativo ? corAtiva + "66" : "#252837"}`,
    borderRadius: 10, padding: "14px 16px",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s",
  }),
  statusControlLabel: {
    display: "flex", alignItems: "flex-start", cursor: "pointer", gap: 0,
  },

  eventoBar: { background: "#0D0E12", borderTop: `1px solid ${temaDark.border}`, padding: "6px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  eventoBarLabel: { fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase" },
  eventoBarNome: { fontSize: 13, fontWeight: 700, color: "#1976D2", fontFamily: temaDark.fontTitle, letterSpacing: 1 },
  eventoBarMeta: { fontSize: 12, color: "#555", marginLeft: "auto" },

  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: "#181B25", border: "1px solid #1E2130", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  eventoCardNome: { fontFamily: temaDark.fontTitle, fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: "#666" },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: "#888", flexWrap: "wrap", borderTop: `1px solid ${temaDark.border}`, paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? "#3a0a0a" : status === "hoje_pre" ? "#2a2a0a" : status === "futuro" ? "#0a2a0a" : "#1a1a1a",
    color: status === "ao_vivo" ? "#ff6b6b" : status === "hoje_pre" ? "#1976D2" : status === "futuro" ? "#7acc44" : "#555",
    border: `1px solid ${status === "ao_vivo" ? "#6a2a2a" : status === "hoje_pre" ? "#4a4a0a" : status === "futuro" ? "#2a5a2a" : "#333"}`,
  }),

  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: "#181B25", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: "#fff", fontFamily: temaDark.fontBody, fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },

  grupoProvasBox: { background: "#181B25", border: "1px solid #1E2130", borderRadius: 10, marginBottom: 16, overflow: "hidden" },
  grupoProvasHeader: { background: "#0D0E12", borderBottom: "1px solid #1E2130", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  provaCheckBtn: { background: "#181B25", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: temaDark.fontBody, lineHeight: 1.4, userSelect: "none" },
  provaCheckBtnSel: { background: temaDark.bgHover, borderColor: "#1976D2", color: "#1976D2" },
  provaChip: { background: "#141720", border: "1px solid #252837", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#bbb", lineHeight: 1.4 },

  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: temaDark.fontTitle, letterSpacing: 1, background: ativo ? temaDark.bgHover : "transparent", color: ativo ? "#1976D2" : "#444", border: `1px solid ${ativo ? "#1976D244" : "#1E2130"}` }),
  stepDivider: { flex: 1, height: 1, background: "#1E2130", margin: "0 8px" },

  btnIconSm: { background: "#141720", border: "1px solid #252837", color: "#888", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: "#1a0a0a", border: "1px solid #3a1a1a", color: "#ff6b6b", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },

  footer: { padding: "60px 48px 48px", borderTop: "none", fontSize: 12, color: "#ccc", background: "#0a1628" },
};

export default styles;
