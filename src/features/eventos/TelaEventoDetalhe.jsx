import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { getStatusEvento, getStatusInscricoes, labelStatusEvento } from "./eventoHelpers";
import { _getLocalEventoDisplay } from "../../shared/formatters/utils";
import { todasAsProvas, getComposicaoCombinada } from "../../shared/athletics/provasDef";
import { CATEGORIAS } from "../../shared/constants/categorias";

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
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 8 },
  eventoAcaoBtn: { background: "#0E1016", borderWidth: 1, borderStyle: "solid", borderColor: "#1E2130", borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: "#fff", fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
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
  modoSwitch: { display: "flex", gap: 0, background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, overflow: "hidden", marginBottom: 20, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: "#666", padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: "#141720", color: "#1976D2" },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: "#0E1016", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
  grupoProvasBox: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 10, marginBottom: 16, overflow: "hidden" },
  grupoProvasHeader: { background: "#0D0E12", borderBottom: "1px solid #1E2130", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  provaCheckBtn: { background: "#0E1016", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", lineHeight: 1.4, userSelect: "none" },
  provaCheckBtnSel: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
  // ── Tabs
  tabsWrapper: { marginBottom: 32 },
  tabsBar: {
    display: "flex", gap: 6,
    background: "#0a0c12",
    border: "1px solid #1E2130",
    borderRadius: 12,
    padding: 6,
    marginBottom: 24,
    width: "fit-content",
    boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
  },
  tabBtn: (ativo) => ({
    background: ativo ? "linear-gradient(135deg, #1976D2, #1255a0)" : "transparent",
    border: "none",
    borderRadius: 8,
    color: ativo ? "#fff" : "#666",
    padding: "11px 28px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: ativo ? 700 : 500,
    fontFamily: "'Barlow Condensed', sans-serif",
    letterSpacing: ativo ? 1 : 0.5,
    transition: "all 0.2s",
    whiteSpace: "nowrap",
    boxShadow: ativo ? "0 2px 10px rgba(25,118,210,0.35)" : "none",
    textTransform: "uppercase",
  }),
};

function StatCard({ value, label }) {
  return (
    <div style={{ background:"#0E1016", border:"1px solid #1E2130", borderRadius:12, padding:"20px 24px", flex:1, minWidth:160, textAlign:"center" }}>
      <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:36, fontWeight:900, color:"#1976D2", lineHeight:1 }}>{value}</div>
      <div style={{ color:"#666", fontSize:12, letterSpacing:1, textTransform:"uppercase", marginTop:6 }}>{label}</div>
    </div>
  );
}

function TelaEventoDetalhe({ eventoAtual, setTela, inscricoes, atletas, resultados, usuarioLogado, alterarStatusEvento, selecionarEvento, recordes, setRecordes, equipes, getClubeAtleta, editarEvento, pendenciasRecorde, setPendenciasRecorde, historicoRecordes, setHistoricoRecordes, RecordDetectionEngine, organizadores = [],
  setCadEventoGoStep }) {
  const confirmar = useConfirm();

  // ── Aba ativa: inicializa conforme perfil ────────────────────────────────
  const [abaAtiva, setAbaAtiva] = useState(() => {
    if (!usuarioLogado) return null;
    const t = usuarioLogado.tipo;
    if (t === "equipe" || t === "treinador") return "inscricoes";
    if (t === "atleta") return "participacao";
    if (t === "admin" || t === "organizador") return "operacional";
    return "acompanhamento"; // funcionario
  });

  if (!eventoAtual) {
    return (
      <div style={styles.page}>
        <div style={styles.emptyState}>
          <p>Nenhuma competição selecionada.</p>
          <button style={styles.btnPrimary} onClick={() => setTela("home")}>Ver Competições</button>
        </div>
      </div>
    );
  }

  // ── Métricas ─────────────────────────────────────────────────────────────
  const nInscs     = inscricoes.filter((i) => i.eventoId === eventoAtual.id).length;
  const nAtletas   = [...new Set(inscricoes.filter((i) => i.eventoId === eventoAtual.id).map((i) => i.atletaId))].length;
  const nProvas    = (eventoAtual.provasPrograma || []).length;
  const nResultados = Object.entries(resultados).filter(([k]) => k.startsWith(eventoAtual.id + "_")).reduce((a, [, v]) => a + Object.keys(v).length, 0);
  const isAdmin    = usuarioLogado?.tipo === "admin" || usuarioLogado?.tipo === "organizador";

  // ── Helpers ───────────────────────────────────────────────────────────────
  const _dtInsc = (data, hora) => !data ? null : new Date(data + "T" + (hora || "00:00") + ":00");

  // ── Toggles de status ─────────────────────────────────────────────────────
  const toggleInscricoes = () => {
    const agora = new Date();
    const dtAb  = _dtInsc(eventoAtual.dataAberturaInscricoes,     eventoAtual.horaAberturaInscricoes);
    const dtEnc = _dtInsc(eventoAtual.dataEncerramentoInscricoes, eventoAtual.horaEncerramentoInscricoes);
    const novoEncerrado = !eventoAtual.inscricoesEncerradas;
    if (!novoEncerrado) {
      if (dtAb && agora < dtAb) {
        alert(`⚠️ Não é possível abrir as inscrições antes da data programada.\n\nAbertura agendada: ${dtAb.toLocaleString("pt-BR")}\n\nAs inscrições serão abertas automaticamente nessa data/hora.`);
        return;
      }
      if (dtEnc && agora >= dtEnc) {
        alert(`⚠️ O prazo de inscrições já encerrou.\n\nEncerramento foi em: ${dtEnc.toLocaleString("pt-BR")}\n\nPara reabrir, altere a data de encerramento no cadastro do evento.`);
        return;
      }
    }
    if (novoEncerrado) {
      if (dtEnc && agora < dtEnc) {
        alert(`⚠️ Não é possível encerrar as inscrições antes da data programada.\n\nEncerramento agendado: ${dtEnc.toLocaleString("pt-BR")}\n\nAs inscrições serão encerradas automaticamente nessa data/hora.`);
        return;
      }
    }
    alterarStatusEvento(eventoAtual.id, {
      inscricoesEncerradas: novoEncerrado,
      inscricoesForceEncerradas: novoEncerrado ? true : false,
      inscricoesForceAbertas:    novoEncerrado ? false : true,
      sumulaLiberada: novoEncerrado ? eventoAtual.sumulaLiberada : false,
    });
  };

  const toggleSumula = () => {
    if (!eventoAtual.inscricoesEncerradas) return;
    alterarStatusEvento(eventoAtual.id, { sumulaLiberada: !eventoAtual.sumulaLiberada });
  };

  // ── Pre-computes para tabs ────────────────────────────────────────────────
  const tpU        = usuarioLogado?.tipo;
  const evStatus   = getStatusEvento(eventoAtual, resultados);
  const provasRevez = todasAsProvas().filter(p => p.tipo === "revezamento" && (eventoAtual.provasPrograma || []).includes(p.id));
  const nInscsRevez = inscricoes.filter(i => i.eventoId === eventoAtual.id && i.tipo === "revezamento").length;

  const temAcessoSumulas =
    tpU === "admin" || tpU === "organizador" ||
    (tpU === "funcionario" && (usuarioLogado?.permissoes?.includes("sumulas") || usuarioLogado?.permissoes?.includes("resultados"))) ||
    (eventoAtual.sumulaLiberada && !!usuarioLogado);

  const podeVerResultados =
    tpU === "admin" || tpU === "organizador" || tpU === "funcionario" ||
    evStatus === "ao_vivo" || evStatus === "encerrado" || evStatus === "hoje_pre" ||
    !!eventoAtual.competicaoFinalizada;

  // ── Definição das abas por perfil ─────────────────────────────────────────
  const tabs = [];
  if (!usuarioLogado) {
    // sem abas — layout público direto
  } else if (tpU === "atleta") {
    tabs.push({ id: "participacao",   label: "✍️  Participação" });
    tabs.push({ id: "acompanhamento", label: "📊  Acompanhamento" });
  } else if (tpU === "equipe" || tpU === "treinador") {
    tabs.push({ id: "inscricoes",     label: "✍️  Inscrições" });
    tabs.push({ id: "acompanhamento", label: "📊  Acompanhamento" });
  } else if (tpU === "funcionario") {
    tabs.push({ id: "acompanhamento", label: "📊  Acompanhamento" });
    tabs.push({ id: "operacional",    label: "⚙️  Operacional" });
  } else if (tpU === "organizador") {
    tabs.push({ id: "acompanhamento", label: "📊  Acompanhamento" });
    tabs.push({ id: "operacional",    label: "⚙️  Operacional" });
    tabs.push({ id: "configuracao",   label: "🔧  Configuração" });
  } else if (tpU === "admin") {
    tabs.push({ id: "acompanhamento", label: "📊  Acompanhamento" });
    tabs.push({ id: "operacional",    label: "⚙️  Operacional" });
    tabs.push({ id: "configuracao",   label: "🔧  Configuração" });
  }

  const abaEfetiva = abaAtiva || tabs[0]?.id || null;

  // ── Conteúdo de cada aba ──────────────────────────────────────────────────
  const renderTabContent = () => {
    // ── Público (não logado) ─────────────────────────────────────────────
    if (!usuarioLogado) {
      return (
        <div style={styles.eventoAcoesGrid}>
          <button style={styles.eventoAcaoBtn} onClick={() => setTela("login")}>
            <span style={{ fontSize: 36 }}>✍️</span>
            <strong>Inscreva-se</strong>
            <span style={{ color: "#888", fontSize: 13 }}>Faça login ou cadastre-se para inscrever atletas</span>
          </button>
          {podeVerResultados ? (
            <button style={styles.eventoAcaoBtn} onClick={() => setTela("resultados")}>
              <span style={{ fontSize: 36 }}>🏆</span>
              <strong>Resultados</strong>
              <span style={{ color: "#666", fontSize: 13 }}>Classificação e marcas publicadas</span>
            </button>
          ) : (
            <div style={{ ...styles.eventoAcaoBtn, opacity: 0.35, cursor: "not-allowed" }}>
              <span style={{ fontSize: 36 }}>🏆</span>
              <strong>Resultados</strong>
              <span style={{ color: "#666", fontSize: 13 }}>Disponível a partir do dia da competição</span>
            </div>
          )}
        </div>
      );
    }

    switch (abaEfetiva) {

      // ── Atleta ────────────────────────────────────────────────────────────
      case "participacao":
        return (
          <div style={styles.eventoAcoesGrid}>
            {!eventoAtual.inscricoesEncerradas ? (
              <button style={styles.eventoAcaoBtn} onClick={() => setTela("inscricao-avulsa")}>
                <span style={{ fontSize: 36 }}>✍️</span>
                <strong>Inscrever-se</strong>
                <span style={{ color: "#666", fontSize: 13 }}>Inscrição individual em provas</span>
              </button>
            ) : (
              <div style={{ ...styles.eventoAcaoBtn, opacity: 0.4, cursor: "not-allowed" }}>
                <span style={{ fontSize: 36 }}>🔒</span>
                <strong>Inscrições Encerradas</strong>
                <span style={{ color: "#666", fontSize: 13 }}>Novas inscrições não são permitidas</span>
              </div>
            )}
          </div>
        );

      // ── Equipe / Treinador ────────────────────────────────────────────────
      case "inscricoes":
        return (
          <div style={styles.eventoAcoesGrid}>
            {!eventoAtual.inscricoesEncerradas ? (
              <button style={styles.eventoAcaoBtn} onClick={() => setTela("gestao-inscricoes")}>
                <span style={{ fontSize: 36 }}>✍️</span>
                <strong>Inscrever Atletas</strong>
                <span style={{ color: "#666", fontSize: 13 }}>Montar lote e confirmar inscrições</span>
              </button>
            ) : (
              <div style={{ ...styles.eventoAcaoBtn, opacity: 0.4, cursor: "not-allowed" }}>
                <span style={{ fontSize: 36 }}>🔒</span>
                <strong>Inscrições Encerradas</strong>
                <span style={{ color: "#666", fontSize: 13 }}>Novas inscrições não são permitidas</span>
              </div>
            )}
            {provasRevez.length > 0 && (
              <button style={{ ...styles.eventoAcaoBtn, borderColor: "#5dade266" }} onClick={() => setTela("inscricao-revezamento")}>
                <span style={{ fontSize: 36 }}>🏃‍♂️</span>
                <strong>Inscrição de Revezamento</strong>
                <span style={{ color: "#666", fontSize: 13 }}>
                  {nInscsRevez > 0 ? `${nInscsRevez} equipe(s) inscrita(s)` : "Montar equipes de revezamento"}
                </span>
              </button>
            )}
          </div>
        );

      // ── Acompanhamento (todos logados) ────────────────────────────────────
      case "acompanhamento":
        return (
          <div style={styles.eventoAcoesGrid}>
            {temAcessoSumulas ? (
              <button style={styles.eventoAcaoBtn} onClick={() => setTela("sumulas")}>
                <span style={{ fontSize: 36 }}>📋</span>
                <strong>Súmulas</strong>
                <span style={{ color: "#666", fontSize: 13 }}>
                  {tpU === "admin" && !eventoAtual.sumulaLiberada
                    ? "Visível apenas para admins"
                    : "Listas por prova, categoria e sexo"}
                </span>
              </button>
            ) : (
              <div style={{ ...styles.eventoAcaoBtn, opacity: 0.35, cursor: "not-allowed" }}>
                <span style={{ fontSize: 36 }}>🔐</span>
                <strong>Súmulas</strong>
                <span style={{ color: "#666", fontSize: 13 }}>Disponível após encerramento das inscrições</span>
              </div>
            )}
            {podeVerResultados ? (
              <button style={styles.eventoAcaoBtn} onClick={() => setTela("resultados")}>
                <span style={{ fontSize: 36 }}>🏆</span>
                <strong>Resultados</strong>
                <span style={{ color: "#666", fontSize: 13 }}>Classificação e marcas publicadas</span>
              </button>
            ) : (
              <div style={{ ...styles.eventoAcaoBtn, opacity: 0.35, cursor: "not-allowed" }}>
                <span style={{ fontSize: 36 }}>🏆</span>
                <strong>Resultados</strong>
                <span style={{ color: "#666", fontSize: 13 }}>Disponível a partir do dia da competição</span>
              </div>
            )}
          </div>
        );

      // ── Operacional (admin / org / func) ──────────────────────────────────
      case "operacional":
        return (
          <div style={styles.eventoAcoesGrid}>
            {tpU === "admin" && (
              <button style={{ ...styles.eventoAcaoBtn, borderColor: "#1976D266" }} onClick={() => setTela("digitar-resultados")}>
                <span style={{ fontSize: 36 }}>✏️</span>
                <strong style={{ color: "#1976D2" }}>Digitar Resultados</strong>
                <span style={{ color: "#666", fontSize: 13 }}>Inserir marcas e publicar</span>
              </button>
            )}
            <button style={{ ...styles.eventoAcaoBtn, borderColor: "#ffaa4466" }} onClick={() => setTela("gestao-inscricoes")}>
              <span style={{ fontSize: 36 }}>🔄</span>
              <strong>Gestão de Inscrições</strong>
              <span style={{ color: "#666", fontSize: 13 }}>Excluir, trocar prova ou inserir atleta</span>
            </button>
            <button style={{ ...styles.eventoAcaoBtn, borderColor: "#88ff8866" }} onClick={() => setTela("numeracao-peito")}>
              <span style={{ fontSize: 36 }}>🔢</span>
              <strong>Numeração de Peito</strong>
              <span style={{ color: "#666", fontSize: 13 }}>Numerar atletas automaticamente ou manualmente</span>
            </button>
            {provasRevez.length > 0 && (
              <button style={{ ...styles.eventoAcaoBtn, borderColor: "#5dade266" }} onClick={() => setTela("inscricao-revezamento")}>
                <span style={{ fontSize: 36 }}>🏃‍♂️</span>
                <strong>Inscrição de Revezamento</strong>
                <span style={{ color: "#666", fontSize: 13 }}>
                  {nInscsRevez > 0 ? `${nInscsRevez} equipe(s) inscrita(s)` : "Montar equipes de revezamento"}
                </span>
              </button>
            )}
            {(tpU === "admin" || tpU === "organizador") && (
              <button style={{ ...styles.eventoAcaoBtn, borderColor: "#1976D266" }} onClick={() => setTela("config-pontuacao-equipes")}>
                <span style={{ fontSize: 36 }}>🏅</span>
                <strong>Pontuação por Equipes</strong>
                <span style={{ color: "#666", fontSize: 13 }}>
                  {eventoAtual.pontuacaoEquipes?.ativo ? "✅ Ativa — configurar tabela" : "Configurar disputa por equipes"}
                </span>
              </button>
            )}
            {(tpU === "admin" || tpU === "organizador" || tpU === "funcionario") && (
              <button style={{ ...styles.eventoAcaoBtn, borderColor: "#2a6a6a66" }} onClick={() => setTela("secretaria")}>
                <span style={{ fontSize: 36 }}>📋</span>
                <strong>Secretaria</strong>
                <span style={{ color: "#666", fontSize: 13 }}>Câmara de chamada · Entrega de medalhas</span>
              </button>
            )}
          </div>
        );

      // ── Configuração (admin / org) ─────────────────────────────────────────
      case "configuracao":
        return (
          <div style={styles.eventoAcoesGrid}>
            <button style={{ ...styles.eventoAcaoBtn, borderColor: "#88aaff66" }}
                    onClick={async () => { selecionarEvento(eventoAtual.id); setTela("novo-evento"); }}>
              <span style={{ fontSize: 36 }}>⚙️</span>
              <strong>Editar Competição</strong>
              <span style={{ color: "#666", fontSize: 13 }}>Alterar dados, provas e configurações</span>
            </button>
            <button style={{ ...styles.eventoAcaoBtn, borderColor: "#ffcc0066" }}
                    onClick={async () => { selecionarEvento(eventoAtual.id); setCadEventoGoStep("step3"); setTela("novo-evento"); }}>
              <span style={{ fontSize: 36 }}>🕐</span>
              <strong>Programa Horário</strong>
              <span style={{ color: "#666", fontSize: 13 }}>Definir horários e fases das provas</span>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* ══ CABEÇALHO ═══════════════════════════════════════════════════════ */}
      <div style={styles.painelHeader}>
        <div style={{ flex: 1 }}>
          {eventoAtual.logoCompeticao && (
            <div style={{ marginBottom: 14, padding: 16, background: "#fff", borderRadius: 12, border: "1px solid #2a3050", display: "inline-block" }}>
              <img src={eventoAtual.logoCompeticao} alt="" style={{ maxWidth: 220, maxHeight: 140, objectFit: "contain", display: "block" }} />
            </div>
          )}
          <div style={{ color: "#666", fontSize: 13, marginBottom: 6 }}>
            📅 {new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            {eventoAtual.horaInicio && <> · ⏰ {eventoAtual.horaInicio}h</>}
            &nbsp;·&nbsp; 📍 {_getLocalEventoDisplay(eventoAtual)}
            <span style={{ marginLeft: 10 }}>
              <span style={styles.eventoStatusBadge(getStatusEvento(eventoAtual, resultados))}>
                {labelStatusEvento(getStatusEvento(eventoAtual, resultados), eventoAtual)}
              </span>
            </span>
          </div>
          <h1 style={{ ...styles.pageTitle, marginBottom: 4 }}>{eventoAtual.nome}</h1>
          {eventoAtual.permissividadeNorma && (
            <span style={styles.permissividadeTag(true)}>⚖️ Permissividade de norma ativa</span>
          )}
          {(eventoAtual.orgsAutorizadas || []).length > 0 && (() => {
            const orgsNomes = (eventoAtual.orgsAutorizadas || [])
              .map(id => organizadores.find(o => o.id === id))
              .filter(Boolean)
              .map(o => o.entidade || o.nome);
            return (
              <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <span style={{ display:"inline-block", padding:"3px 12px", borderRadius:20, fontSize:11, fontWeight:700, background:"#0a1a2a", color:"#5599ff", border:"1px solid #1a3a5a" }}>
                  🤝 Participação cruzada ativa
                </span>
                <span style={{ fontSize:12, color:"#556688" }}>
                  Atletas autorizados: {orgsNomes.join(", ") || `${(eventoAtual.orgsAutorizadas||[]).length} organizador(es)`}
                </span>
              </div>
            );
          })()}
          {(eventoAtual.limiteProvasIndividual > 0 || eventoAtual.limiteProvasRevezamento > 0) && (
            <div style={{ marginTop:6, display:"flex", gap:8, flexWrap:"wrap" }}>
              {eventoAtual.limiteProvasIndividual > 0 && (
                <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:"#0a1a2a", color:"#88aaff", border:"1px solid #1a3a5a" }}>
                  🎯 Máx. {eventoAtual.limiteProvasIndividual} prova(s) individual(is) por atleta
                </span>
              )}
              {eventoAtual.limiteProvasRevezamento > 0 && (
                <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:"#0a1a2a", color:"#88aaff", border:"1px solid #1a3a5a" }}>
                  🏃‍♂️ Máx. {eventoAtual.limiteProvasRevezamento} revezamento(s) por atleta
                </span>
              )}
            </div>
          )}
          {(eventoAtual.dataAberturaInscricoes || eventoAtual.dataEncerramentoInscricoes) ? (
            <div style={{ marginTop:8, fontSize:13, color:"#888" }}>
              📋 Inscrições:&nbsp;
              {eventoAtual.dataAberturaInscricoes && (
                <span>de <strong style={{ color:"#7acc44" }}>
                  {new Date(eventoAtual.dataAberturaInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}
                  {eventoAtual.horaAberturaInscricoes && <> às {eventoAtual.horaAberturaInscricoes}h</>}
                </strong></span>
              )}
              {eventoAtual.dataEncerramentoInscricoes && (
                <span>{eventoAtual.dataAberturaInscricoes ? " até " : "até "}<strong style={{ color:"#ff6b6b" }}>
                  {new Date(eventoAtual.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}
                  {eventoAtual.horaEncerramentoInscricoes && <> às {eventoAtual.horaEncerramentoInscricoes}h</>}
                </strong></span>
              )}
            </div>
          ) : (
            <div style={{ marginTop:8, fontSize:12, color:"#555" }}>
              📋 Período de inscrições não configurado — controle manual
            </div>
          )}
        </div>
        <button style={styles.btnGhost} onClick={() => setTela("home")}>← Competições</button>
      </div>

      {/* ══ STATS ════════════════════════════════════════════════════════════ */}
      <div style={styles.statsRow}>
        <StatCard value={nProvas}     label="Provas no Prog." />
        <StatCard value={nAtletas}    label="Atletas" />
        <StatCard value={nInscs}      label="Inscrições" />
        <StatCard value={nResultados} label="Resultados" />
      </div>

      {/* ══ BANNER COMPETIÇÃO FINALIZADA ════════════════════════════════════ */}
      {eventoAtual.competicaoFinalizada && (
        <div style={{ background:"#1a0a0a", border:"2px solid #6a2a2a", borderRadius:12, padding:"16px 20px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:"#ff6b6b", marginBottom:4 }}>🔒 Competição Finalizada</div>
            <div style={{ fontSize:12, color:"#888", lineHeight:1.5 }}>
              Finalizada em {eventoAtual.competicaoFinalizadaEm ? new Date(eventoAtual.competicaoFinalizadaEm).toLocaleString("pt-BR") : "—"}
              {eventoAtual.competicaoFinalizadaPor && <> por <strong style={{ color:"#aaa" }}>{eventoAtual.competicaoFinalizadaPor}</strong></>}.
              Os dados desta competição estão bloqueados para edição.
            </div>
          </div>
          {usuarioLogado?.tipo === "admin" && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button style={{ padding:"8px 18px", borderRadius:8, border:"1px solid #2a4a2a", background:"#0a1a0a", color:"#7cfc7c", fontWeight:700, fontSize:12, cursor:"pointer" }}
                onClick={async () => {
                  try {
                    const novasPendencias = RecordDetectionEngine.detectarQuebras(eventoAtual, resultados, recordes, atletas, equipes, inscricoes);
                    const antes = (pendenciasRecorde || []).length;
                    const merged = RecordDetectionEngine.mesclarPendencias(pendenciasRecorde || [], novasPendencias);
                    const novas = merged.length - antes;
                    setPendenciasRecorde(merged);
                    alert(novas > 0
                      ? `🏆 Reprocessamento concluído!\n\n${novasPendencias.length} quebra(s) detectada(s).\n${novas} nova(s) pendência(s) adicionada(s).\n\nAcesse 🏆 Recordes → ⏳ Pendências para analisar.`
                      : `✅ Reprocessamento concluído!\n\n${novasPendencias.length} quebra(s) detectada(s), mas todas já constavam como pendências existentes.\nNenhuma nova pendência adicionada.`
                    );
                  } catch (e) { alert("Erro ao reprocessar: " + e.message); }
                }}>
                🏆 Reprocessar Recordes
              </button>
              <button style={{ padding:"8px 18px", borderRadius:8, border:"1px solid #4a2a2a", background:"#2a0a0a", color:"#ff6b6b", fontWeight:700, fontSize:12, cursor:"pointer" }}
                onClick={async () => { 
                  if (await confirmar("Desbloquear esta competição para edição? Isso removerá a finalização."))
                    alterarStatusEvento(eventoAtual.id, { competicaoFinalizada: false, competicaoFinalizadaEm: null, competicaoFinalizadaPor: null  });
                }}>
                🔓 Desbloquear (Admin)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ ABAS — admin/org: ficam acima do programa horário ══════════════ */}
      {isAdmin && (
        <>
          <div style={styles.tabsWrapper}>
            {tabs.length > 1 && (
              <div style={styles.tabsBar}>
                {tabs.map((tab, idx) => (
                  <button
                    key={tab.id}
                    style={{
                      ...styles.tabBtn(abaEfetiva === tab.id),
                      borderRightWidth: idx < tabs.length - 1 ? 1 : 0,
                    }}
                    onClick={() => setAbaAtiva(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            {renderTabContent()}
          </div>

          <div style={{ height: 1, background: "#1E2130", marginBottom: 28 }} />

          <div style={styles.statusControlsCard}>
            <div style={styles.statusControlsTitle}>🔧 Controles de Status da Competição</div>
            <div style={styles.statusControlsGrid}>
              {(() => {
                const agora = new Date();
                const dtAb  = _dtInsc(eventoAtual.dataAberturaInscricoes, eventoAtual.horaAberturaInscricoes);
                const dtEnc = _dtInsc(eventoAtual.dataEncerramentoInscricoes, eventoAtual.horaEncerramentoInscricoes);
                const encerradas = !!eventoAtual.inscricoesEncerradas;
                const bloqReabrir = dtAb && agora < dtAb
                  ? `Abertura programada: ${dtAb.toLocaleString("pt-BR")}`
                  : dtEnc && agora >= dtEnc
                    ? `Prazo encerrado em ${dtEnc.toLocaleString("pt-BR")} — altere a data no cadastro para reabrir`
                    : null;
                const bloqEncerrar = dtEnc && agora < dtEnc ? `Encerramento programado: ${dtEnc.toLocaleString("pt-BR")}` : null;
                return (
                  <div style={styles.statusControlBox(encerradas, "#c0392b", "#3a0a0a")}>
                    <div style={{ fontWeight:700, fontSize:14, color: encerradas ? "#ff6b6b" : "#7acc44", marginBottom:8 }}>
                      {encerradas ? "🔒 Inscrições Encerradas" : "🟢 Inscrições Abertas"}
                    </div>
                    {(eventoAtual.dataAberturaInscricoes || eventoAtual.dataEncerramentoInscricoes) && (
                      <div style={{ fontSize:11, color:"#666", marginBottom:10 }}>
                        📅&nbsp;
                        {eventoAtual.dataAberturaInscricoes && `abertura ${new Date(eventoAtual.dataAberturaInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}`}
                        {eventoAtual.dataAberturaInscricoes && eventoAtual.dataEncerramentoInscricoes && " · "}
                        {eventoAtual.dataEncerramentoInscricoes && `encerramento ${new Date(eventoAtual.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}`}
                      </div>
                    )}
                    {!encerradas && (bloqEncerrar
                      ? <div style={{ fontSize:12, color:"#e67e22" }}>🔒 {bloqEncerrar}</div>
                      : <button onClick={toggleInscricoes} style={{ background:"#3a0a0a", border:"1px solid #c0392b44", color:"#ff6b6b", borderRadius:7, padding:"7px 16px", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"'Barlow', sans-serif" }}>🔒 Encerrar Inscrições</button>
                    )}
                    {encerradas && (bloqReabrir
                      ? <div style={{ fontSize:12, color:"#e67e22" }}>🔒 {bloqReabrir}</div>
                      : <button onClick={toggleInscricoes} style={{ background:"#0a2a0a", border:"1px solid #7acc4444", color:"#7acc44", borderRadius:7, padding:"7px 16px", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"'Barlow', sans-serif" }}>🔓 Reabrir Inscrições</button>
                    )}
                  </div>
                );
              })()}
              <div style={styles.statusControlBox(eventoAtual.sumulaLiberada, "#27ae60", "#0a2a0a", !eventoAtual.inscricoesEncerradas)}>
                <label style={{ ...styles.statusControlLabel, opacity: eventoAtual.inscricoesEncerradas ? 1 : 0.45, cursor: eventoAtual.inscricoesEncerradas ? "pointer" : "not-allowed" }}>
                  <input type="checkbox" checked={!!eventoAtual.sumulaLiberada} disabled={!eventoAtual.inscricoesEncerradas} onChange={toggleSumula}
                    style={{ width:18, height:18, accentColor:"#1976D2", cursor: eventoAtual.inscricoesEncerradas ? "pointer" : "not-allowed", marginRight:10, flexShrink:0 }} />
                  <div>
                    <div style={{ fontWeight:700, color: eventoAtual.sumulaLiberada ? "#7acc44" : "#aaa" }}>
                      {eventoAtual.sumulaLiberada ? "📋 Súmulas Liberadas para Consulta" : "🔐 Súmulas Restritas (só Admin)"}
                    </div>
                    <div style={{ fontSize:12, color:"#666", marginTop:3 }}>
                      {eventoAtual.inscricoesEncerradas
                        ? eventoAtual.sumulaLiberada ? "Equipes e atletas podem visualizar as súmulas." : "Marque para liberar as súmulas a equipes e atletas."
                        : "⚠️ Encerre as inscrições primeiro para liberar as súmulas."}
                    </div>
                  </div>
                </label>
              </div>
              <div style={styles.statusControlBox(eventoAtual.competicaoEncerrada, "#8e44ad", "#1a0a2a")}>
                <label style={styles.statusControlLabel}>
                  <input type="checkbox" checked={!!eventoAtual.competicaoEncerrada}
                    onChange={() => alterarStatusEvento(eventoAtual.id, { competicaoEncerrada: !eventoAtual.competicaoEncerrada })}
                    style={{ width:18, height:18, accentColor:"#8e44ad", cursor:"pointer", marginRight:10, flexShrink:0 }} />
                  <div>
                    <div style={{ fontWeight:700, color: eventoAtual.competicaoEncerrada ? "#c39bdf" : "#aaa" }}>
                      {eventoAtual.competicaoEncerrada ? "🏁 Competição Encerrada" : "▶️ Competição em Andamento"}
                    </div>
                    <div style={{ fontSize:12, color:"#666", marginTop:3 }}>
                      {eventoAtual.competicaoEncerrada ? "O status mostra 'Encerrado'. Desmarque para reativar." : "Marque quando a competição terminar para mudar o status para Encerrado."}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "#1E2130", marginBottom: 28 }} />
        </>
      )}

      {/* ══ PROGRAMA HORÁRIO ════════════════════════════════════════════════ */}
      {(() => {
        const prog   = eventoAtual.programaHorario || {};
        const oldH   = eventoAtual.horariosProvas || {};
        const oldF   = eventoAtual.fasesProvas || {};
        const progFinal = Object.keys(prog).length > 0 ? prog : (() => {
          const migrated = {};
          const allKeys = new Set([...Object.keys(oldH), ...Object.keys(oldF)]);
          allKeys.forEach(id => { migrated[id] = [{ fase: oldF[id] || "", horario: oldH[id] || "" }]; });
          return migrated;
        })();

        const provasDoEvento = (eventoAtual.provasPrograma || [])
          .map(id => todasAsProvas().find(p => p.id === id))
          .filter(Boolean);
        if (provasDoEvento.length === 0) return null;

        const provasBase = [];
        provasDoEvento.forEach(p => {
          if (p.tipo === "combinada") {
            const comp = getComposicaoCombinada(p.id);
            if (comp) {
              comp.provas.forEach((cp, idx) => {
                provasBase.push({ id: `COMP_${p.id}_${idx}_${cp.sufixo}`, nome: cp.nome, _parentNome: comp.nome, _parentId: p.id, _isComp: true, dia: cp.dia, ordem: idx + 1 });
              });
            } else {
              provasBase.push(p);
            }
          } else {
            provasBase.push(p);
          }
        });

        const faseColor = (fase) => {
          if (fase === "Eliminatória") return "#ff8844";
          if (fase?.includes("Semifinal")) return "#88aaff";
          if (fase?.includes("Final")) return "#7acc44";
          return "#555";
        };

        const linhas = [];
        provasBase.forEach(p => {
          const entries = progFinal[p.id] || [{ fase: "", horario: "" }];
          entries.forEach((entry, ei) => {
            linhas.push({ ...p, _entryIdx: ei, _fase: entry.fase || "", _horario: entry.horario || "" });
          });
        });

        const comHorario   = linhas.filter(l => l._horario).sort((a, b) => a._horario.localeCompare(b._horario));
        const semHorario   = linhas.filter(l => !l._horario).sort((a, b) => {
          if (a._isComp && b._isComp && a._parentId === b._parentId) return a.ordem - b.ordem;
          return (a.nome || "").localeCompare(b.nome || "");
        });
        const linhasOrdenadas = [...comHorario, ...semHorario];

        const pausa       = eventoAtual.programaPausa || {};
        const pausaHorario = pausa.horario || "";
        const pausaRetorno = pausa.retorno || "";
        const pausaDesc    = pausa.descricao || "";
        const temPausa     = !!pausaHorario;

        const manha        = temPausa ? linhasOrdenadas.filter(l => l._horario && l._horario < pausaHorario) : [];
        const tarde        = temPausa ? linhasOrdenadas.filter(l => l._horario && l._horario >= (pausaRetorno || pausaHorario)) : [];
        const semHorarioList = linhasOrdenadas.filter(l => !l._horario);
        const usarDivisao  = temPausa && (manha.length > 0 || tarde.length > 0);

        const thStyle = { textAlign:"left", padding:"8px 10px", color:"#888", fontWeight:600 };

        const agruparLinhas = (lista) => {
          const grupos = [];
          const map = new Map();
          lista.forEach(p => {
            const isComp  = p._isComp;
            const sexoId  = isComp ? p._parentId : p.id;
            const sexoAbrev = (sexoId || "").startsWith("M_") ? "M" : "F";
            const catNome = isComp
              ? (CATEGORIAS.find(c => (p._parentId || "").includes(`_${c.id}_`) || (p._parentId || "").endsWith(`_${c.id}`))?.nome || "")
              : (CATEGORIAS.find(c => p.id.includes(`_${c.id}_`) || p.id.endsWith(`_${c.id}`))?.nome || "");
            const chave = `${p._horario}||${p.nome}||${sexoAbrev}||${p._fase}||${isComp ? p._parentId?.replace(/^[MF]_/,"") : ""}`;
            if (map.has(chave)) {
              map.get(chave).cats.push(catNome);
            } else {
              const grupo = { ...p, cats: [catNome], _sexoAbrev: sexoAbrev, _sexoId: sexoId, _chave: chave };
              map.set(chave, grupo);
              grupos.push(grupo);
            }
          });
          return grupos;
        };

        const renderRow = (p, idx) => {
          const isComp    = p._isComp;
          const catsDisplay = (p.cats || []).join(", ");
          const sexoLabel = p._sexoAbrev === "M" ? "Masculino" : "Feminino";
          const sexoColor = p._sexoAbrev === "M" ? "#88aaff" : "#ff88aa";
          return (
            <tr key={`${p._chave}_${idx}`} style={{ borderBottom:"1px solid #1a1d2a", background: idx % 2 === 0 ? "transparent" : "#0d0e14" }}>
              <td style={{ padding:"8px 10px", fontFamily:"monospace", fontWeight:700, color: p._horario ? "#7acc44" : "#555", fontSize:14 }}>
                {p._horario || "—"}
              </td>
              <td style={{ padding:"8px 10px", color:"#ddd", fontWeight:600 }}>
                {isComp && <span style={{ color:"#1976D2", fontSize:10, marginRight:6 }}>{p._parentNome} {p.ordem}ª</span>}
                {p.nome}
                {isComp && p.dia && <span style={{ color:"#88aaff", fontSize:10, marginLeft:6 }}>(Dia {p.dia})</span>}
              </td>
              <td style={{ padding:"8px 10px", color: sexoColor, fontSize:12 }}>{sexoLabel}</td>
              <td style={{ padding:"8px 10px", color:"#aaa", fontSize:12 }}>{catsDisplay}</td>
              <td style={{ padding:"8px 10px", color: p._fase ? faseColor(p._fase) : "#555", fontSize:12, fontWeight: p._fase ? 700 : 400 }}>
                {p._fase || "—"}
              </td>
            </tr>
          );
        };

        const pausaRow = () => (
          <tr key="_pausa" style={{ background:"#0d1020" }}>
            <td colSpan={5} style={{ padding:"10px 14px", textAlign:"center" }}>
              <span style={{ color:"#1976D2", fontWeight:700, fontSize:13 }}>⏸️ {pausaDesc || "Intervalo"}</span>
              <span style={{ color:"#888", fontSize:12, marginLeft:10 }}>
                {pausaHorario}{pausaRetorno ? ` — ${pausaRetorno}` : ""}
              </span>
            </td>
          </tr>
        );

        const tHead = (
          <tr style={{ borderBottom:"2px solid #2a3050" }}>
            <th style={{ ...thStyle, width:70 }}>Horário</th>
            <th style={thStyle}>Prova</th>
            <th style={{ ...thStyle, width:80 }}>Sexo</th>
            <th style={thStyle}>Categorias</th>
            <th style={thStyle}>Fase</th>
          </tr>
        );

        const sectionLabel = (label) => (
          <tr key={`_label_${label}`}>
            <td colSpan={5} style={{ padding:"10px 10px 6px", fontWeight:800, fontSize:13, color:"#1976D2", borderBottom:"1px solid #2a3050", letterSpacing:1 }}>
              {label}
            </td>
          </tr>
        );

        const printRow = (p, idx) => {
          const isComp = p._isComp;
          const catsDisplay = (p.cats || []).join(", ");
          const sexoLabel = p._sexoAbrev === "M" ? "Masculino" : "Feminino";
          const sexoColor = p._sexoAbrev === "M" ? "#1a56cc" : "#cc1a7a";
          const fColor = p._fase === "Eliminatória" ? "#cc6600" : p._fase?.includes("Semifinal") ? "#1a56cc" : p._fase?.includes("Final") ? "#1a8a1a" : "#999";
          const provaNome = isComp
            ? `<span style="color:#b88a00;font-size:9px;margin-right:4px">${p._parentNome} ${p.ordem}ª</span>${p.nome}${p.dia ? ` <span style="color:#1a56cc;font-size:9px">(Dia ${p.dia})</span>` : ""}`
            : p.nome;
          return `<tr style="border-bottom:1px solid #ddd;${idx%2===1?"background:#f8f8fc":""}">
            <td style="padding:5px 10px;font-family:monospace;font-weight:700;font-size:12px;color:${p._horario?"#111":"#ccc"}">${p._horario||"—"}</td>
            <td style="padding:5px 10px;font-weight:600;font-size:11px">${provaNome}</td>
            <td style="padding:5px 10px;font-size:10px;color:${sexoColor}">${sexoLabel}</td>
            <td style="padding:5px 10px;font-size:10px;color:#555">${catsDisplay}</td>
            <td style="padding:5px 10px;font-size:10px;font-weight:700;color:${fColor}">${p._fase||"—"}</td>
          </tr>`;
        };

        return (
          <div style={{ background:"#0a0a1a", border:"1px solid #1a2a3a", borderRadius:10, padding:"20px 24px", marginBottom:24 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ color:"#1976D2", fontWeight:700, fontSize:14 }}>🕐 Programa Horário</div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:12, color:"#666" }}>{linhasOrdenadas.length} entrada(s)</span>
                {(tpU === "admin" || tpU === "organizador" || tpU === "funcionario") && (
                  <button onClick={async () => {
                    const dataEvt = new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
                    const logoComp = eventoAtual.logoCompeticao || "";
                    const logoCabEsq = eventoAtual.logoCabecalho || eventoAtual.logoCompeticao || "";
                    const logoCabDir = eventoAtual.logoCabecalhoDireito || "";
                    const logoRod  = eventoAtual.logoRodape || "";
                    const thPrint  = `<tr><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333;font-size:10px;color:#555;font-weight:700;width:55px">Horário</th><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333;font-size:10px;color:#555;font-weight:700">Prova</th><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333;font-size:10px;color:#555;font-weight:700;width:70px">Sexo</th><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333;font-size:10px;color:#555;font-weight:700">Categorias</th><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333;font-size:10px;color:#555;font-weight:700">Fase</th></tr>`;
                    const pausaPrint = temPausa ? `<tr><td colspan="5" style="padding:10px;text-align:center;background:#f0f0f0;border-bottom:1px solid #ddd"><strong style="color:#b88a00">⏸️ ${pausaDesc || "Intervalo"}</strong><span style="color:#666;margin-left:8px;font-size:11px">${pausaHorario}${pausaRetorno ? " — " + pausaRetorno : ""}</span></td></tr>` : "";
                    const secLabel = (label) => `<tr><td colspan="5" style="padding:8px 10px 4px;font-weight:800;font-size:12px;color:#b88a00;border-bottom:1px solid #ccc;letter-spacing:1px">${label}</td></tr>`;
                    let tableBody = "";
                    if (usarDivisao) {
                      tableBody += secLabel("☀️ MANHÃ");
                      agruparLinhas(manha).forEach((p,i) => { tableBody += printRow(p,i); });
                      tableBody += pausaPrint;
                      tableBody += secLabel("🌤️ TARDE");
                      agruparLinhas(tarde).forEach((p,i) => { tableBody += printRow(p,i); });
                      if (semHorarioList.length > 0) {
                        tableBody += secLabel("📋 A DEFINIR");
                        agruparLinhas(semHorarioList).forEach((p,i) => { tableBody += printRow(p,i); });
                      }
                    } else {
                      agruparLinhas(linhasOrdenadas).forEach((p,i) => { tableBody += printRow(p,i); });
                    }
                    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Programa Horário — ${eventoAtual.nome}</title>
                    <style>
                      @page{size:portrait;margin:10mm 12mm}
                      *{box-sizing:border-box;margin:0;padding:0}
                      body{font-family:'Segoe UI',Arial,sans-serif;color:#111;font-size:12px}
                      .page{width:210mm;min-height:297mm;padding:10mm 14mm 8mm;margin:0 auto;display:flex;flex-direction:column}
                      @media print{.page{width:auto;min-height:auto;padding:0}}
                      table{width:100%;border-collapse:collapse}
                      .rod-wrap{margin-top:auto;padding-top:12px;}
                    </style></head><body>
                    <div class="page">
                      <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;border-bottom:3px solid #1976D2;padding-bottom:10px">
                        ${logoCabEsq ? `<img src="${logoCabEsq}" style="max-height:60px;max-width:120px;object-fit:contain;flex-shrink:0"/>` : ""}
                        <div style="flex:1;min-width:0">
                          <div style="font-size:18px;font-weight:800;color:#111">${eventoAtual.nome}</div>
                          <div style="font-size:11px;color:#666;margin-top:2px">📅 ${dataEvt} · 📍 ${_getLocalEventoDisplay(eventoAtual)}</div>
                        </div>
                        ${logoCabDir ? `<img src="${logoCabDir}" style="max-height:60px;max-width:120px;object-fit:contain;flex-shrink:0"/>` : ""}
                      </div>
                      <div style="text-align:center;font-size:15px;font-weight:800;color:#333;margin:10px 0 14px;letter-spacing:1px">🕐 PROGRAMA HORÁRIO</div>
                      <table><thead>${thPrint}</thead><tbody>${tableBody}</tbody></table>
                      <div class="rod-wrap">
                        ${logoRod ? `<div style="margin-top:14px;padding-top:10px;border-top:1px solid #ddd;text-align:center;"><img src="${logoRod}" alt="" style="max-width:100%;max-height:28mm;object-fit:contain;"/></div>` : ""}
                        <div style="padding-top:6px;text-align:center;">
                          <div style="font-size:9px;color:#aaa;line-height:1.9">Gerado em: ${new Date().toLocaleString("pt-BR")} · Plataforma de Competições - GERENTRACK</div>
                        </div>
                      </div>
                    </div></body></html>`;
                    const win = window.open("", "_blank", "width=900,height=700");
                    if (!win) { alert("Permita pop-ups para imprimir."); return; }
                    win.document.open(); win.document.write(html); win.document.close();
                  }}
                  style={{ background:"transparent", border:"1px solid #2a3050", borderRadius:6, color:"#88aaff", fontSize:12, padding:"5px 14px", cursor:"pointer", fontWeight:600 }}>
                    🖨️ Imprimir
                  </button>
                )}
              </div>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>{tHead}</thead>
                <tbody>
                  {usarDivisao ? (<>
                    {sectionLabel("☀️ MANHÃ")}
                    {agruparLinhas(manha).map((p, i) => renderRow(p, i))}
                    {pausaRow()}
                    {sectionLabel("🌤️ TARDE")}
                    {agruparLinhas(tarde).map((p, i) => renderRow(p, i))}
                    {semHorarioList.length > 0 && (<>
                      {sectionLabel("📋 A DEFINIR")}
                      {agruparLinhas(semHorarioList).map((p, i) => renderRow(p, i))}
                    </>)}
                  </>) : (
                    agruparLinhas(linhasOrdenadas).map((p, i) => renderRow(p, i))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ══ DESCRIÇÃO ═══════════════════════════════════════════════════════ */}
      {eventoAtual.descricao && (
        <div style={{ background:"#0a0a1a", border:"1px solid #1a2a3a", borderRadius:10, padding:"20px 24px", marginBottom:24 }}>
          <div style={{ color:"#1976D2", fontWeight:700, fontSize:14, marginBottom:12 }}>📝 Informações</div>
          <div
            style={{ color:"#ddd", fontFamily:"'Inter', sans-serif", fontSize:14, lineHeight:1.7, wordBreak:"break-word", whiteSpace:"pre-wrap", maxHeight: isAdmin ? 320 : undefined, overflowY: isAdmin ? "auto" : undefined }}
            dangerouslySetInnerHTML={{ __html: eventoAtual.descricao }}
          />
        </div>
      )}

      {/* ══ ABAS — perfis não-admin: ficam após programa horário ════════════ */}
      {!isAdmin && (
        <div style={styles.tabsWrapper}>
          {tabs.length > 1 && (
            <div style={styles.tabsBar}>
              {tabs.map((tab, idx) => (
                <button
                  key={tab.id}
                  style={{
                    ...styles.tabBtn(abaEfetiva === tab.id),
                    borderRightWidth: idx < tabs.length - 1 ? 1 : 0,
                  }}
                  onClick={() => setAbaAtiva(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
          {renderTabContent()}
        </div>
      )}

      {/* ── Barra de status somente-leitura (não-admin logado) ── */}
      {!isAdmin && usuarioLogado && (
        <div style={styles.statusBar}>
          <div style={styles.statusBarItem}>
            <span style={styles.statusDot(
              getStatusInscricoes(eventoAtual) === "abertas" ? "#7acc44" :
              getStatusInscricoes(eventoAtual) === "em_breve" ? "#1976D2" : "#ff6b6b"
            )} />
            <span style={{ color:"#aaa", fontSize:13 }}>
              {getStatusInscricoes(eventoAtual) === "em_breve"
                ? <>Inscrições em breve — <span style={{ color:"#1976D2" }}>abre em {new Date(eventoAtual.dataAberturaInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}</span></>
                : getStatusInscricoes(eventoAtual) === "abertas"
                  ? <>Inscrições abertas{eventoAtual.dataEncerramentoInscricoes && (
                      <span style={{ color:"#666" }}> — até {new Date(eventoAtual.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                    )}</>
                  : "Inscrições encerradas"
              }
            </span>
          </div>
          <div style={styles.statusBarItem}>
            <span style={styles.statusDot(eventoAtual.sumulaLiberada ? "#7acc44" : "#555")} />
            <span style={{ color:"#aaa", fontSize:13 }}>
              {eventoAtual.sumulaLiberada ? "Súmulas disponíveis" : "Súmulas não disponíveis"}
            </span>
          </div>
        </div>
      )}

      {/* ══ FINALIZAR COMPETIÇÃO — admin/org, sempre no fim da página ═══════ */}
      {isAdmin && !eventoAtual.competicaoFinalizada && (
        <div style={{ background:"#0a0a14", border:"1px solid #2a1a3a", borderRadius:12, padding:"16px 20px", marginTop: 8 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:"#c39bdf", marginBottom:4 }}>🏁 Finalizar Competição</div>
              <div style={{ fontSize:12, color:"#888", lineHeight:1.5 }}>
                Ao finalizar, <strong style={{ color:"#ff6b6b" }}>todos os dados serão bloqueados para edição</strong> (inscrições, resultados, súmulas, programa de provas).
                Somente um <strong style={{ color:"#1976D2" }}>administrador</strong> poderá desbloquear mediante solicitação.
              </div>
            </div>
            <button
              style={{ padding:"10px 24px", borderRadius:8, border:"2px solid #8e44ad", background:"#2a0a3a", color:"#c39bdf", fontWeight:800, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", letterSpacing:0.5 }}
              onClick={async () => { 
                if (await confirmar(
                  "⚠️ FINALIZAR COMPETIÇÃO\n\n" +
                  "Após finalizar, NENHUM dado poderá ser editado:\n" +
                  "• Inscrições\n• Resultados\n• Súmulas\n• Programa de provas\n• Dados da competição\n\n" +
                  "Possíveis quebras de recorde serão detectadas e ficarão como PENDÊNCIAS para homologação pelo administrador.\n" +
                  "Para desbloquear será necessário solicitar autorização a um administrador.\n\n" +
                  "Deseja finalizar esta competição?"
                )) {
                  try {
                    const novasPendencias = RecordDetectionEngine.detectarQuebras(eventoAtual, resultados, recordes, atletas, equipes, inscricoes);
                    if (novasPendencias.length > 0)
                      setPendenciasRecorde(prev => RecordDetectionEngine.mesclarPendencias(prev, novasPendencias));
                   } catch (e) { console.error("Erro ao detectar quebras de recorde:", e); }
                  alterarStatusEvento(eventoAtual.id, {
                    competicaoFinalizada:    true,
                    competicaoFinalizadaEm:  Date.now(),
                    competicaoFinalizadaPor: usuarioLogado?.nome || "—",
                    competicaoEncerrada:     true,
                  });
                }
              }}>
              🔒 Finalizar Competição
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default TelaEventoDetalhe;
