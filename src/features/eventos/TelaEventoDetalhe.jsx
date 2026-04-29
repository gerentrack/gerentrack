import React, { useState } from "react";
import DOMPurify from "dompurify";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { getStatusEvento, getStatusInscricoes, labelStatusEvento } from "./eventoHelpers";
import { _getLocalEventoDisplay, _getClubeAtleta as _getClubeAtletaUtil, _getCbat } from "../../shared/formatters/utils";
import { TeamScoringEngine } from "../../shared/engines/teamScoringEngine";
import { todasAsProvas, getComposicaoCombinada } from "../../shared/athletics/provasDef";
import { CATEGORIAS } from "../../shared/constants/categorias";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";
import { chamarApiComFallback } from "../../lib/apiClient";

import { IcoCalendar, IcoPin, IcoClock, IcoSignup, IcoTrophy, IcoLock, IcoUnlock, IcoEdit, IcoRefresh, IcoList, IcoHash, IcoRun, IcoMedal, IcoClipboard, IcoShield, IcoWifi, IcoSettings, IcoUsers, IcoPrinter, IcoFile, IcoInfo, IcoFlag } from "../../shared/icons";

function getStyles(t) {
  return {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: t.fontTitle, fontSize: 36, fontWeight: 800, color: t.textPrimary, marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: t.fontTitle, fontSize: 26, fontWeight: 800, color: t.textPrimary, marginBottom: 20, letterSpacing: 1 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  statCard: { background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 12, padding: "18px 24px", textAlign: "center", minWidth: 100 },
  statValue: { fontFamily: t.fontTitle, fontSize: 36, fontWeight: 900, color: t.accent, lineHeight: 1, marginBottom: 6 },
  statLabel: { fontSize: 13, color: t.textMuted, letterSpacing: 1 },
  btnPrimary: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: t.fontTitle, letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: t.accent, border: `2px solid ${t.accent}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: t.fontTitle, letterSpacing: 1 },
  btnGhost: { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: t.fontBody },
  btnIconSm: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textMuted, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: t.accentBg, border: `1px solid ${t.danger}44`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: `1px solid ${t.border}` },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: t.bgHeaderSolid, padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` },
  td: { padding: "12px 16px", fontSize: 14, color: t.textSecondary, borderBottom: `1px solid ${t.border}` },
  tr: { transition: "background 0.15s" },
  trOuro: { background: t.trOuro },
  trPrata: { background: t.trPrata },
  trBronze: { background: t.trBronze },
  marca: { fontFamily: t.fontTitle, fontSize: 20, fontWeight: 800, color: t.accent },
  emptyState: { textAlign: "center", padding: "60px 20px", color: t.textDisabled, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },
  painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  painelBtns: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { width: "100%", background: t.bgInput, borderWidth: 1, borderStyle: "solid", borderColor: t.borderInput, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: t.fontBody, outline: "none", marginBottom: 4 },
  select: { width: "100%", background: t.bgInput, borderWidth: 1, borderStyle: "solid", borderColor: t.borderInput, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: t.fontBody, outline: "none", marginBottom: 4 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  erro: { background: t.accentBg, border: `1px solid ${t.danger}`, color: t.danger, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn: { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: t.fontBody, padding: 0 },
  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  badgeGold: { background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  catBanner: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 14, color: t.textTertiary },
  catPreview: { background: t.bgInput, border: `1px solid ${t.accent}`, borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: t.textTertiary },
  atletaInfo: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12, padding: "10px 14px", background: t.bgInput, borderRadius: 8, fontSize: 13 },
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: t.fontTitle, fontSize: 22, fontWeight: 800, color: t.accent, marginBottom: 16 },
  formPage: { maxWidth: 640, margin: "60px auto", padding: "0 24px 80px" },
  formCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32, marginBottom: 20 },
  formTitle: { fontFamily: t.fontTitle, fontSize: 32, fontWeight: 800, color: t.textPrimary, textAlign: "center", marginBottom: 8 },
  formSub: { color: t.textDimmed, textAlign: "center", fontSize: 14, marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },
  fieldError: { color: t.danger, fontSize: 12, marginTop: 2 },
  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: t.textMuted, transition: "all 0.2s" },
  radioLabelActive: { background: t.bgHover, border: `1px solid ${t.accent}`, color: t.accent },
  resumoInscricao: { background: t.bgCard, border: `1px solid ${t.accent}33`, borderRadius: 10, padding: "16px 20px", marginTop: 16 },
  tagProva: { background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44`, borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  sumuCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: t.fontTitle, fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  savedBadge: { background: t.accentBg, border: `1px solid ${t.success}44`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  digitarDica: { color: t.textDimmed, fontSize: 12 },
  inputMarca: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", color: t.accent, fontSize: 16, fontFamily: t.fontTitle, fontWeight: 700, width: 120, outline: "none" },
  infoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: t.fontTitle, fontSize: 20, fontWeight: 700, color: t.accent, marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: `1px solid ${t.border}`, fontSize: 14, color: t.textSecondary, display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: t.accent, fontWeight: 700 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: t.bgHeader, borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: t.accent, color: "#fff", fontFamily: t.fontTitle, fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: t.fontTitle, fontSize: 56, fontWeight: 900, color: t.textPrimary, lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: t.fontTitle, fontSize: 22, fontWeight: 800, color: t.textPrimary, lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: t.textDimmed },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: t.textMuted, flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? t.accentBg : status === "hoje_pre" ? t.accentBg : status === "futuro" ? t.accentBg : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textMuted,
    border: `1px solid ${status === "ao_vivo" ? t.danger+"44" : status === "hoje_pre" ? t.accentBorder : status === "futuro" ? t.success+"44" : t.border}`,
  }),
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 8 },
  eventoAcaoBtn: { background: t.bgCard, borderWidth: 1, borderStyle: "solid", borderColor: t.border, borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: t.textPrimary, fontFamily: t.fontBody, fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  statusBarItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  statusDot: (cor) => ({ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }),
  statusDotInline: (cor) => ({ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: cor, background: cor + "22", border: `1px solid ${cor}44`, borderRadius: 10, padding: "2px 8px", whiteSpace: "nowrap" }),
  statusControlsCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusControlsTitle: { fontFamily: t.fontTitle, fontSize: 16, fontWeight: 700, color: t.accent, letterSpacing: 1, marginBottom: 14 },
  statusControlsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  statusControlBox: (ativo, corAtiva, bgAtiva, disabled) => ({
    background: ativo ? bgAtiva : t.bgInput,
    border: `1px solid ${ativo ? corAtiva + "66" : t.borderInput}`,
    borderRadius: 10, padding: "14px 16px",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s",
  }),
  statusControlLabel: { display: "flex", alignItems: "flex-start", cursor: "pointer", gap: 0 },
  permissividadeBox: { background: t.bgHeaderSolid, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 4 },
  permissividadeHeader: { marginBottom: 10 },
  permissividadeLabel: { display: "flex", alignItems: "center", cursor: "pointer", fontSize: 14, color: t.textSecondary, fontWeight: 600 },
  permissividadeInfo: { background: t.bgHover, borderRadius: 8, padding: "12px 16px", borderLeft: `3px solid ${t.accent}` },
  permissividadeTag: (ativo) => ({ display: "inline-block", background: ativo ? t.accentBg : t.bgCard, border: `1px solid ${ativo ? t.success+"66" : t.border}`, color: ativo ? t.success : t.textDimmed, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600 }),
  permissividadeAlert: { display: "flex", gap: 14, alignItems: "flex-start", background: t.accentBg, border: `1px solid ${t.success}66`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 },
  permissividadeAlertIcon: { fontSize: 28, flexShrink: 0, marginTop: 2 },
  permissividadeAlertTitle: { fontWeight: 700, color: t.success, fontSize: 15, marginBottom: 4 },
  permissividadeAlertBody: { color: t.textTertiary, fontSize: 13, lineHeight: 1.6, marginBottom: 6 },
  permissividadeAlertRodape: { fontSize: 12, color: t.textDimmed, fontStyle: "italic" },
  filtroProvasBar: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 20 },
  filtroProvasBloco: { display: "flex", flexDirection: "column", gap: 8 },
  filtroProvasLabel: { fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 },
  filtroProvasPills: { display: "flex", flexWrap: "wrap", gap: 6 },
  filtroPill: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textDimmed, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: t.fontTitle, letterSpacing: 0.5, transition: "all 0.15s" },
  filtroPillAtivo: { background: t.bgHover, border: `1px solid ${t.accent}`, color: t.accent },
  filtroClearBtn: { background: "none", border: "none", color: t.accent + "88", cursor: "pointer", fontSize: 11, fontFamily: t.fontBody, padding: "0 4px", textDecoration: "underline" },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: t.fontTitle, letterSpacing: 1, background: ativo ? t.bgHover : "transparent", color: ativo ? t.accent : t.textDisabled, border: `1px solid ${ativo ? t.accentBorder : t.border}` }),
  stepDivider: { flex: 1, height: 1, background: t.border, margin: "0 8px" },
  modoSwitch: { display: "flex", gap: 0, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 20, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: t.textDimmed, padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: t.fontBody, transition: "all 0.2s" },
  modoBtnActive: { background: t.bgInput, color: t.accent },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: t.fontBody, transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: t.bgHover, borderColor: t.accent, color: t.accent },
  grupoProvasBox: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 16, overflow: "hidden" },
  grupoProvasHeader: { background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  provaCheckBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: t.fontBody, lineHeight: 1.4, userSelect: "none" },
  provaCheckBtnSel: { background: t.bgHover, borderColor: t.accent, color: t.accent },
  // ── Tabs
  tabsWrapper: { marginBottom: 32 },
  tabsBar: {
    display: "flex", gap: 6,
    background: t.bgCardAlt,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    padding: 6,
    marginBottom: 24,
    width: "fit-content",
    boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
  },
  tabBtn: (ativo) => ({
    background: ativo ? `linear-gradient(135deg, ${t.accent}, ${t.accentDark})` : "transparent",
    border: "none",
    borderRadius: 8,
    color: ativo ? "#fff" : t.textDimmed,
    padding: "11px 28px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: ativo ? 700 : 500,
    fontFamily: t.fontTitle,
    letterSpacing: ativo ? 1 : 0.5,
    transition: "all 0.2s",
    whiteSpace: "nowrap",
    boxShadow: ativo ? "0 2px 10px rgba(25,118,210,0.35)" : "none",
    textTransform: "uppercase",
  }),
};
}

function StatCard({ value, label }) {
  const t = useTema();
  return (
    <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"20px 24px", flex:1, minWidth:160, textAlign:"center", boxShadow:t.shadow }}>
      <div style={{ fontFamily: t.fontTitle, fontSize:36, fontWeight:900, color: t.accent, lineHeight:1 }}>{value}</div>
      <div style={{ color: t.textDimmed, fontSize:12, letterSpacing:1, textTransform:"uppercase", marginTop:6 }}>{label}</div>
    </div>
  );
}

function TelaEventoDetalhe() {
  const { usuarioLogado } = useAuth();
  const { eventoAtual, inscricoes, atletas, resultados, alterarStatusEvento, selecionarEvento, recordes, setRecordes, equipes, getClubeAtleta, atualizarCamposEvento, pendenciasRecorde, setPendenciasRecorde, historicoRecordes, setHistoricoRecordes, RecordDetectionEngine, RankingExtractionEngine, ranking, setRanking } = useEvento();
  const { setTela, organizadores, setCadEventoGoStep, funcionarios, selecionarOrganizador } = useApp();
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const confirmar = useConfirm();

  // ── Aba ativa: inicializa conforme perfil ────────────────────────────────
  const [abaAtiva, setAbaAtiva] = useState(() => {
    if (!usuarioLogado) return null;
    const tp = usuarioLogado.tipo;
    if (tp === "equipe" || tp === "treinador") return "inscricoes";
    if (tp === "atleta") return "participacao";
    if (tp === "admin" || tp === "organizador") return "operacional";
    return "acompanhamento"; // funcionario
  });

  if (!eventoAtual) {
    return (
      <div style={s.page}>
        <div style={s.emptyState}>
          <p>Nenhuma competição selecionada.</p>
          <button style={s.btnPrimary} onClick={() => setTela("home")}>Ver Competições</button>
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
  const isDonoOuAdmin = usuarioLogado?.tipo === "admin"
    || (usuarioLogado?.tipo === "organizador" && eventoAtual.organizadorId === usuarioLogado?.id)
    || (usuarioLogado?.tipo === "funcionario" && eventoAtual.organizadorId === usuarioLogado?.organizadorId);

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
        alert(`Não é possível abrir as inscrições antes da data programada.\n\nAbertura agendada: ${dtAb.toLocaleString("pt-BR")}\n\nAs inscrições serão abertas automaticamente nessa data/hora.`);
        return;
      }
      if (dtEnc && agora >= dtEnc) {
        alert(`O prazo de inscrições já encerrou.\n\nEncerramento foi em: ${dtEnc.toLocaleString("pt-BR")}\n\nPara reabrir, altere a data de encerramento no cadastro do evento.`);
        return;
      }
    }
    if (novoEncerrado) {
      if (dtEnc && agora < dtEnc) {
        alert(`Não é possível encerrar as inscrições antes da data programada.\n\nEncerramento agendado: ${dtEnc.toLocaleString("pt-BR")}\n\nAs inscrições serão encerradas automaticamente nessa data/hora.`);
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
    tabs.push({ id: "participacao",   label: "Participação" });
    tabs.push({ id: "acompanhamento", label: "Acompanhamento" });
  } else if (tpU === "equipe" || tpU === "treinador") {
    tabs.push({ id: "inscricoes",     label: "Inscrições" });
    tabs.push({ id: "acompanhamento", label: "Acompanhamento" });
  } else if (tpU === "funcionario") {
    tabs.push({ id: "acompanhamento", label: "Acompanhamento" });
    if (eventoAtual.organizadorId === usuarioLogado?.organizadorId) {
      tabs.push({ id: "operacional",    label: "Operacional" });
    }
  } else if (tpU === "organizador") {
    tabs.push({ id: "acompanhamento", label: "Acompanhamento" });
    if (eventoAtual.organizadorId === usuarioLogado?.id) {
      tabs.push({ id: "operacional",    label: "Operacional" });
      tabs.push({ id: "configuracao",   label: "Configuração" });
    }
  } else if (tpU === "admin") {
    tabs.push({ id: "acompanhamento", label: "Acompanhamento" });
    tabs.push({ id: "operacional",    label: "Operacional" });
    tabs.push({ id: "configuracao",   label: "Configuração" });
  }

  const abaEfetiva = (abaAtiva && tabs.some(tab => tab.id === abaAtiva)) ? abaAtiva : tabs[0]?.id || null;

  // ── Conteúdo de cada aba ──────────────────────────────────────────────────
  const renderTabContent = () => {
    // ── Público (não logado) ─────────────────────────────────────────────
    if (!usuarioLogado) {
      return (
        <div style={s.eventoAcoesGrid}>
          {!eventoAtual.competicaoFinalizada && (
            <button style={s.eventoAcaoBtn} onClick={() => setTela("login")}>
              {IcoSignup(28)}
              <strong>Inscreva-se</strong>
              <span style={{ color: t.textMuted, fontSize: 13 }}>Faça login ou cadastre-se para inscrever atletas</span>
            </button>
          )}
          {podeVerResultados ? (
            <button style={s.eventoAcaoBtn} onClick={() => setTela("resultados")}>
              {IcoTrophy(28)}
              <strong>Resultados</strong>
              <span style={{ color: t.textDimmed, fontSize: 13 }}>Classificação e marcas publicadas</span>
            </button>
          ) : (
            <div style={{ ...s.eventoAcaoBtn, opacity: 0.35, cursor: "not-allowed" }}>
              {IcoTrophy(28)}
              <strong>Resultados</strong>
              <span style={{ color: t.textDimmed, fontSize: 13 }}>Disponível a partir do dia da competição</span>
            </div>
          )}
        </div>
      );
    }

    // Usar abaAtiva para sub-abas (func_acesso) que não estão em tabs
    switch (abaAtiva === "func_acesso" ? abaAtiva : abaEfetiva) {

      // ── Atleta ────────────────────────────────────────────────────────────
      case "participacao":
        return (
          <div style={s.eventoAcoesGrid}>
            {!eventoAtual.inscricoesEncerradas ? (
              <button style={s.eventoAcaoBtn} onClick={() => setTela("inscricao-avulsa")}>
                {IcoSignup(28)}
                <strong>Inscrever-se</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>Inscrição individual em provas</span>
              </button>
            ) : (
              <div style={{ ...s.eventoAcaoBtn, opacity: 0.4, cursor: "not-allowed" }}>
                {IcoLock(28)}
                <strong>Inscrições Encerradas</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>Novas inscrições não são permitidas</span>
              </div>
            )}
          </div>
        );

      // ── Equipe / Treinador ────────────────────────────────────────────────
      case "inscricoes":
        return (
          <div style={s.eventoAcoesGrid}>
            {!eventoAtual.inscricoesEncerradas ? (
              <button style={s.eventoAcaoBtn} onClick={() => setTela("gestao-inscricoes")}>
                {IcoSignup(28)}
                <strong>Inscrever Atletas</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>Montar lote e confirmar inscrições</span>
              </button>
            ) : (
              <div style={{ ...s.eventoAcaoBtn, opacity: 0.4, cursor: "not-allowed" }}>
                {IcoLock(28)}
                <strong>Inscrições Encerradas</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>Novas inscrições não são permitidas</span>
              </div>
            )}
            {provasRevez.length > 0 && eventoAtual.revezamentoInscAntecipada && (
              <button style={{ ...s.eventoAcaoBtn, borderColor: t.accent + "66" }} onClick={() => setTela("inscricao-revezamento")}>
                {IcoRun(28)}
                <strong>Inscrição de Revezamento</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>
                  {nInscsRevez > 0 ? `${nInscsRevez} equipe(s) inscrita(s)` : "Montar equipes de revezamento"}
                </span>
              </button>
            )}
          </div>
        );

      // ── Acompanhamento (todos logados) ────────────────────────────────────
      case "acompanhamento":
        return (
          <div style={s.eventoAcoesGrid}>
            {temAcessoSumulas ? (
              <button style={s.eventoAcaoBtn} onClick={() => setTela("sumulas")}>
                {IcoClipboard(28)}
                <strong>Súmulas</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>
                  {tpU === "admin" && !eventoAtual.sumulaLiberada
                    ? "Visível apenas para admins"
                    : "Listas por prova, categoria e sexo"}
                </span>
              </button>
            ) : (
              <div style={{ ...s.eventoAcaoBtn, opacity: 0.35, cursor: "not-allowed" }}>
                {IcoShield(28)}
                <strong>Súmulas</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>Disponível após encerramento das inscrições</span>
              </div>
            )}
            {podeVerResultados ? (
              <button style={s.eventoAcaoBtn} onClick={() => setTela("resultados")}>
                {IcoTrophy(28)}
                <strong>Resultados</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>Classificação e marcas publicadas</span>
              </button>
            ) : (
              <div style={{ ...s.eventoAcaoBtn, opacity: 0.35, cursor: "not-allowed" }}>
                {IcoTrophy(28)}
                <strong>Resultados</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>Disponível a partir do dia da competição</span>
              </div>
            )}
          </div>
        );

      // ── Operacional (admin / org / func) ──────────────────────────────────
      case "operacional": {
        const _perms = tpU === "funcionario" ? (usuarioLogado?.permissoes || []) : null;
        const _temPerm = (p) => _perms === null || _perms.includes(p);
        return (
          <div style={s.eventoAcoesGrid}>
            {_temPerm("resultados") && (
              <button style={{ ...s.eventoAcaoBtn, borderColor: t.accent + "66" }} onClick={() => setTela("digitar-resultados")}>
                {IcoEdit(28)}
                <strong style={{ color: t.accent }}>Digitar Resultados</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>Inserir marcas e publicar</span>
              </button>
            )}
            {_temPerm("inscricoes") && (
              <button style={{ ...s.eventoAcaoBtn, borderColor: t.warning + "66" }} onClick={() => setTela("gestao-inscricoes")}>
                {IcoRefresh(28)}
                <strong>Gestão de Inscrições</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>Excluir, trocar prova ou inserir atleta</span>
              </button>
            )}
            {_temPerm("inscricoes") && (
              <button style={{ ...s.eventoAcaoBtn, borderColor: t.success + "66" }} onClick={() => setTela("numeracao-peito")}>
                {IcoHash(28)}
                <strong>Numeração de Peito</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>Numerar atletas automaticamente ou manualmente</span>
              </button>
            )}
            {provasRevez.length > 0 && _temPerm("inscricoes") && (
              <button style={{ ...s.eventoAcaoBtn, borderColor: t.accent + "66" }} onClick={() => setTela("inscricao-revezamento")}>
                {IcoRun(28)}
                <strong>Inscrição de Revezamento</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>
                  {nInscsRevez > 0 ? `${nInscsRevez} equipe(s) inscrita(s)` : "Montar equipes de revezamento"}
                </span>
              </button>
            )}
            {(tpU === "admin" || tpU === "organizador") && (
              <button style={{ ...s.eventoAcaoBtn, borderColor: t.accent + "66" }} onClick={() => setTela("config-pontuacao-equipes")}>
                {IcoMedal(28)}
                <strong>Pontuação por Equipes</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>
                  {eventoAtual.pontuacaoEquipes?.ativo ? "Ativa — configurar tabela" : "Configurar disputa por equipes"}
                </span>
              </button>
            )}
            {_temPerm("camara_chamada") && (
              <button style={{ ...s.eventoAcaoBtn, borderColor: t.accent + "66" }} onClick={() => setTela("secretaria")}>
                {IcoClipboard(28)}
                <strong>Secretaria</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>Câmara de chamada · Entrega de medalhas</span>
              </button>
            )}
            {(tpU === "admin" || tpU === "organizador" || tpU === "funcionario") && (
              <button style={{ ...s.eventoAcaoBtn, borderColor: t.warning + "66" }} onClick={() => setTela("preparar-offline")}>
                {IcoWifi(28)}
                <strong>Preparar Offline</strong>
                <span style={{ color: t.textDimmed, fontSize: 13 }}>Sincronizar dados para uso sem internet</span>
              </button>
            )}
          </div>
        );
      }

      // ── Configuração (admin / org) ─────────────────────────────────────────
      case "configuracao":
        return (
          <div style={s.eventoAcoesGrid}>
            <button style={{ ...s.eventoAcaoBtn, borderColor: t.accent + "66" }}
                    onClick={async () => { selecionarEvento(eventoAtual.id, "novo-evento"); }}>
              {IcoSettings(28)}
              <strong>Editar Competição</strong>
              <span style={{ color: t.textDimmed, fontSize: 13 }}>Alterar dados, provas e configurações</span>
            </button>
            <button style={{ ...s.eventoAcaoBtn, borderColor: t.gold + "66" }}
                    onClick={async () => { selecionarEvento(eventoAtual.id, "novo-evento"); setCadEventoGoStep("step3"); }}>
              {IcoClock(28)}
              <strong>Programa Horário</strong>
              <span style={{ color: t.textDimmed, fontSize: 13 }}>Definir horários e fases das provas</span>
            </button>
            <button style={{ ...s.eventoAcaoBtn, borderColor: t.accent + "66" }}
                    onClick={() => setAbaAtiva("func_acesso")}>
              {IcoUsers(28)}
              <strong>Acesso de Funcionários</strong>
              <span style={{ color: t.textDimmed, fontSize: 13 }}>Definir quem pode ver esta competição</span>
            </button>
          </div>
        );

      case "func_acesso": {
        const orgId = usuarioLogado?.tipo === "organizador" ? usuarioLogado?.id : usuarioLogado?.organizadorId;
        const meusFuncs = (funcionarios || []).filter(f => f.organizadorId === orgId);
        const acessoAtual = eventoAtual.funcionariosVisiveis || [];

        const toggleFunc = (fId) => {
          const novo = acessoAtual.includes(fId)
            ? acessoAtual.filter(id => id !== fId)
            : [...acessoAtual, fId];
          atualizarCamposEvento(eventoAtual.id, { funcionariosVisiveis: novo });
        };
        const marcarTodos = () => {
          const ids = meusFuncs.filter(f => !(f.permissoes || []).includes("editar_competições")).map(f => f.id);
          atualizarCamposEvento(eventoAtual.id, { funcionariosVisiveis: ids });
        };
        const desmarcarTodos = () => {
          atualizarCamposEvento(eventoAtual.id, { funcionariosVisiveis: [] });
        };

        return (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <button style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: 14 }}
                onClick={() => setAbaAtiva("configuracao")}>← Voltar</button>
              <h3 style={{ fontFamily: t.fontTitle, fontSize: 22, fontWeight: 800, color: t.textPrimary, margin: 0 }}>
                Acesso de Funcionários
              </h3>
            </div>

            <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: t.textMuted, lineHeight: 1.6 }}>
              Funcionários com permissão <strong style={{ color: t.textTertiary }}>"Criar / editar competições"</strong> sempre têm acesso a todas as competições.
              Marque abaixo os demais funcionários que devem ter acesso a esta competição.
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button onClick={marcarTodos}
                style={{ background: t.accentBg, border: `1px solid ${t.accent}44`, color: t.accent, borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: t.fontBody }}>
                Marcar todos
              </button>
              <button onClick={desmarcarTodos}
                style={{ background: t.bgHeaderSolid, border: `1px solid ${t.borderInput}`, color: t.textMuted, borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: t.fontBody }}>
                Desmarcar todos
              </button>
              <span style={{ fontSize: 12, color: t.textDimmed, marginLeft: "auto", alignSelf: "center" }}>
                {acessoAtual.length} funcionário(s) com acesso
              </span>
            </div>

            {meusFuncs.length === 0 ? (
              <div style={{ color: t.textDimmed, fontSize: 13, padding: "20px 0", textAlign: "center" }}>
                Nenhum funcionário cadastrado.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {meusFuncs.map(f => {
                  const temEditar = (f.permissoes || []).includes("editar_competições");
                  const selecionado = acessoAtual.includes(f.id);
                  return (
                    <label key={f.id} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      background: temEditar ? t.accentBg : selecionado ? t.accentBg : t.bgHeaderSolid,
                      border: `1px solid ${temEditar ? t.accent+"44" : selecionado ? t.accent+"44" : t.border}`,
                      borderRadius: 8, cursor: temEditar ? "default" : "pointer",
                      opacity: temEditar ? 0.7 : 1,
                    }}>
                      <input type="checkbox"
                        checked={temEditar || selecionado}
                        disabled={temEditar}
                        onChange={() => !temEditar && toggleFunc(f.id)}
                        style={{ width: 16, height: 16, accentColor: t.accent, cursor: temEditar ? "default" : "pointer" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: t.textPrimary, fontSize: 13, fontWeight: 600 }}>
                          {f.nome}
                          {f.cargo && <span style={{ color: t.textDimmed, fontWeight: 400 }}> — {f.cargo}</span>}
                        </div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                          {(f.permissoes || []).map(pid => (
                            <span key={pid} style={{ fontSize: 9, background: t.bgCardAlt, color: t.textMuted, padding: "1px 6px", borderRadius: 3 }}>{pid}</span>
                          ))}
                        </div>
                      </div>
                      {temEditar && <span style={{ fontSize: 10, color: t.accent }}>acesso total</span>}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>

      {/* ══ CABEÇALHO ═══════════════════════════════════════════════════════ */}
      {(() => {
        const orgEvt = organizadores.find(o => o.id === eventoAtual.organizadorId);
        if (!orgEvt) return null;
        const corOrg = orgEvt.corPrimaria || t.accent;
        return (
          <div
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 14px", background: `${corOrg}08`, border: `1px solid ${corOrg}22`, borderRadius: 10, marginBottom: 16, cursor: orgEvt.slug ? "pointer" : "default", transition: "border-color 0.2s" }}
            onClick={() => { if (orgEvt.slug && selecionarOrganizador) selecionarOrganizador(orgEvt.id); }}
            onMouseEnter={e => { if (orgEvt.slug) e.currentTarget.style.borderColor = `${corOrg}66`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${corOrg}22`; }}>
            {orgEvt.logo && (
              <img loading="lazy" src={orgEvt.logo} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain", background: "#fff", border: `1px solid ${corOrg}22` }} />
            )}
            <span style={{ fontSize: 13, fontWeight: 600, color: corOrg }}>{orgEvt.entidade || orgEvt.nome}</span>
            {(orgEvt.cidade || orgEvt.estado) && (
              <span style={{ fontSize: 11, color: t.textDimmed }}>· {[orgEvt.cidade, orgEvt.estado].filter(Boolean).join(", ")}</span>
            )}
          </div>
        );
      })()}

      <div style={s.painelHeader}>
        <div style={{ flex: 1 }}>
          <div style={{ color: t.textDimmed, fontSize: 13, marginBottom: 6 }}>
            {IcoCalendar()} {new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            {eventoAtual.horaInicio && <> · {IcoClock()} {eventoAtual.horaInicio}h</>}
            &nbsp;·&nbsp; {IcoPin()} {_getLocalEventoDisplay(eventoAtual)}
            <span style={{ marginLeft: 10 }}>
              <span style={s.eventoStatusBadge(getStatusEvento(eventoAtual, resultados))}>
                {labelStatusEvento(getStatusEvento(eventoAtual, resultados), eventoAtual)}
              </span>
            </span>
          </div>
          <h1 style={{ ...s.pageTitle, marginBottom: 4 }}>{eventoAtual.nome}</h1>
          {eventoAtual.permissividadeNorma && (
            <span style={s.permissividadeTag(true)}>Permissividade de norma ativa</span>
          )}
          {(eventoAtual.orgsAutorizadas || []).length > 0 && (() => {
            const orgsNomes = (eventoAtual.orgsAutorizadas || [])
              .map(id => organizadores.find(o => o.id === id))
              .filter(Boolean)
              .map(o => o.entidade || o.nome);
            return (
              <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <span style={{ display:"inline-block", padding:"3px 12px", borderRadius:20, fontSize:11, fontWeight:700, background: t.accentBg, color: t.accent, border:`1px solid ${t.accentBorder}` }}>
                  Participação cruzada ativa
                </span>
                <span style={{ fontSize:12, color: t.textDimmed }}>
                  Atletas autorizados: {orgsNomes.join(", ") || `${(eventoAtual.orgsAutorizadas||[]).length} organizador(es)`}
                </span>
              </div>
            );
          })()}
          {(eventoAtual.limiteProvasIndividual > 0 || eventoAtual.limiteProvasRevezamento > 0) && (
            <div style={{ marginTop:6, display:"flex", gap:8, flexWrap:"wrap" }}>
              {eventoAtual.limiteProvasIndividual > 0 && (
                <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background: t.accentBg, color: t.accent, border:`1px solid ${t.accentBorder}` }}>
                  Máx. {eventoAtual.limiteProvasIndividual} prova(s) individual(is) por atleta
                </span>
              )}
              {eventoAtual.limiteProvasRevezamento > 0 && (
                <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background: t.accentBg, color: t.accent, border:`1px solid ${t.accentBorder}` }}>
                  Máx. {eventoAtual.limiteProvasRevezamento} revezamento(s) por atleta
                </span>
              )}
            </div>
          )}
          {(eventoAtual.dataAberturaInscricoes || eventoAtual.dataEncerramentoInscricoes) ? (
            <div style={{ marginTop:8, fontSize:13, color: t.textMuted }}>
              Inscrições:&nbsp;
              {eventoAtual.dataAberturaInscricoes && (
                <span>de <strong style={{ color: t.success }}>
                  {new Date(eventoAtual.dataAberturaInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}
                  {eventoAtual.horaAberturaInscricoes && <> às {eventoAtual.horaAberturaInscricoes}h</>}
                </strong></span>
              )}
              {eventoAtual.dataEncerramentoInscricoes && (
                <span>{eventoAtual.dataAberturaInscricoes ? " até " : "até "}<strong style={{ color: t.danger }}>
                  {new Date(eventoAtual.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}
                  {eventoAtual.horaEncerramentoInscricoes && <> às {eventoAtual.horaEncerramentoInscricoes}h</>}
                </strong></span>
              )}
            </div>
          ) : (
            <div style={{ marginTop:8, fontSize:12, color: t.textDimmed }}>
              Período de inscrições não configurado — controle manual
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
          <button style={s.btnGhost} onClick={() => setTela("home")}>← Competições</button>
          {eventoAtual.logoCompeticao && (
            <div style={{ padding: 12, background: "#fff", borderRadius: 12, border: `1px solid ${t.border}` }}>
              <img loading="lazy" src={eventoAtual.logoCompeticao} alt="" style={{ maxWidth: 180, maxHeight: 120, objectFit: "contain", display: "block" }} />
            </div>
          )}
        </div>
      </div>

      {/* ══ STATS ════════════════════════════════════════════════════════════ */}
      <div style={s.statsRow}>
        <StatCard value={nProvas}     label="Provas no Prog." />
        <StatCard value={nAtletas}    label="Atletas" />
        <StatCard value={nInscs}      label="Inscrições" />
        <StatCard value={nResultados} label="Resultados" />
        {(() => {
          const orgIds = new Set();
          inscricoes.filter(i => i.eventoId === eventoAtual.id).forEach(i => {
            const atl = atletas.find(a => a.id === i.atletaId);
            const oId = i.organizadorOrigem || atl?.organizadorId;
            if (oId && oId !== eventoAtual.organizadorId) orgIds.add(oId);
          });
          return orgIds.size > 0 ? <StatCard value={orgIds.size + 1} label="Federações" /> : null;
        })()}
      </div>
      {(() => {
        const fedMap = {};
        inscricoes.filter(i => i.eventoId === eventoAtual.id).forEach(i => {
          const atl = atletas.find(a => a.id === i.atletaId);
          const oId = i.organizadorOrigem || atl?.organizadorId;
          if (oId && oId !== eventoAtual.organizadorId) {
            if (!fedMap[oId]) fedMap[oId] = new Set();
            fedMap[oId].add(i.atletaId);
          }
        });
        const feds = Object.entries(fedMap);
        if (feds.length === 0) return null;
        return (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {feds.map(([oId, atlIds]) => {
              const org = organizadores.find(o => o.id === oId);
              return (
                <span key={oId} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: t.bgCardAlt, border: `1px solid ${t.border}`, color: t.textSecondary }}>
                  {org?.entidade || org?.nome || "Outra"}: <strong style={{ color: t.accent }}>{atlIds.size}</strong> atleta(s)
                </span>
              );
            })}
          </div>
        );
      })()}

      {/* ══ BANNER COMPETIÇÃO FINALIZADA ════════════════════════════════════ */}
      {eventoAtual.competicaoFinalizada && isDonoOuAdmin && (
        <div style={{ background: t.accentBg, border:`2px solid ${t.danger}44`, borderRadius:12, padding:"16px 20px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color: t.danger, marginBottom:4 }}>Competição Finalizada</div>
            <div style={{ fontSize:12, color: t.textMuted, lineHeight:1.5 }}>
              Finalizada em {eventoAtual.competicaoFinalizadaEm ? new Date(eventoAtual.competicaoFinalizadaEm).toLocaleString("pt-BR") : "—"}
              {eventoAtual.competicaoFinalizadaPor && <> por <strong style={{ color: t.textTertiary }}>{eventoAtual.competicaoFinalizadaPor}</strong></>}.
              Os dados desta competição estão bloqueados para edição.
            </div>
          </div>
          {usuarioLogado?.tipo === "admin" && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${t.success}44`, background: t.accentBg, color: t.success, fontWeight:700, fontSize:12, cursor:"pointer" }}
                onClick={async () => {
                  try {
                    // Recordes — API com fallback local
                    const resRecordes = await chamarApiComFallback(
                      "/api/recordes",
                      { method: "POST", body: { eventoId: eventoAtual.id } },
                      () => ({ pendencias: RecordDetectionEngine.detectarQuebras(eventoAtual, resultados, recordes, atletas, equipes, inscricoes) })
                    );
                    const novasPendencias = resRecordes.pendencias || [];
                    const antes = (pendenciasRecorde || []).length;
                    const merged = RecordDetectionEngine.mesclarPendencias(pendenciasRecorde || [], novasPendencias);
                    const novas = merged.length - antes;
                    setPendenciasRecorde(merged);
                    // Ranking — cálculo local (API de ranking é read-only, extração é sempre local)
                    let nRnk = 0;
                    try {
                      const novasRnk = RankingExtractionEngine.extrairEntradas(eventoAtual, resultados, atletas, equipes, inscricoes);
                      if (novasRnk.length > 0) {
                        const antesRnk = (ranking || []).length;
                        setRanking(prev => RankingExtractionEngine.mesclarEntradas(prev, novasRnk));
                        nRnk = novasRnk.length;
                      }
                    } catch (er) { console.error("Erro ranking:", er); }
                    alert(
                      `Reprocessamento concluído!\n\n` +
                      `Recordes: ${novasPendencias.length} quebra(s) detectada(s), ${novas} nova(s) pendência(s).\n` +
                      `Ranking: ${nRnk} entrada(s) extraída(s).` +
                      (novas > 0 ? `\n\nAcesse Recordes → Pendências para analisar.` : "")
                    );
                  } catch (e) { alert("Erro ao reprocessar: " + e.message); }
                }}>
                Reprocessar Recordes e Ranking
              </button>
              <button style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${t.danger}44`, background: t.accentBg, color: t.danger, fontWeight:700, fontSize:12, cursor:"pointer" }}
                onClick={async () => { 
                  if (await confirmar("Desbloquear esta competição para edição? Isso removerá a finalização.")) {
                    alterarStatusEvento(eventoAtual.id, { competicaoFinalizada: false, competicaoFinalizadaEm: null, competicaoFinalizadaPor: null, snapshotAtletas: null, snapshotClassifEquipes: null, snapshotClassifEquipesM: null, snapshotClassifEquipesF: null });
                    // Marcar como revisão no PostgreSQL (background)
                    chamarApiComFallback(
                      "/api/resultados/desfinalizar",
                      { method: "POST", body: { eventoId: eventoAtual.id } },
                      () => ({ ok: true })
                    ).catch(err => console.warn("Desfinalização PostgreSQL:", err.message));
                  }
                }}>
                Desbloquear (Admin)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ ABAS — admin/org dono: ficam acima do programa horário ════════════ */}
      {isDonoOuAdmin && (
        <>
          <div style={s.tabsWrapper}>
            {tabs.length > 1 && (
              <div style={s.tabsBar}>
                {tabs.map((tab, idx) => (
                  <button
                    key={tab.id}
                    style={{
                      ...s.tabBtn(abaEfetiva === tab.id),
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

          <div style={{ height: 1, background: t.border, marginBottom: 28 }} />

          <div style={s.statusControlsCard}>
            <div style={s.statusControlsTitle}>Controles de Status da Competição</div>
            <div style={s.statusControlsGrid}>
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
                  <div style={s.statusControlBox(encerradas, "#c0392b", "#3a0a0a")}>
                    <div style={{ fontWeight:700, fontSize:14, color: encerradas ? t.danger : t.success, marginBottom:8 }}>
                      {encerradas ? "Inscrições Encerradas" : "Inscrições Abertas"}
                    </div>
                    {(eventoAtual.dataAberturaInscricoes || eventoAtual.dataEncerramentoInscricoes) && (
                      <div style={{ fontSize:11, color: t.textDimmed, marginBottom:10 }}>
                        {IcoCalendar()}&nbsp;
                        {eventoAtual.dataAberturaInscricoes && `abertura ${new Date(eventoAtual.dataAberturaInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}`}
                        {eventoAtual.dataAberturaInscricoes && eventoAtual.dataEncerramentoInscricoes && " · "}
                        {eventoAtual.dataEncerramentoInscricoes && `encerramento ${new Date(eventoAtual.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}`}
                      </div>
                    )}
                    {!encerradas && (bloqEncerrar
                      ? <div style={{ fontSize:12, color: t.warning }}>{bloqEncerrar}</div>
                      : <button onClick={toggleInscricoes} style={{ background: t.accentBg, border:`1px solid ${t.danger}44`, color: t.danger, borderRadius:7, padding:"7px 16px", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily: t.fontBody }}>Encerrar Inscrições</button>
                    )}
                    {encerradas && (bloqReabrir
                      ? <div style={{ fontSize:12, color: t.warning }}>{bloqReabrir}</div>
                      : <button onClick={toggleInscricoes} style={{ background: t.accentBg, border:`1px solid ${t.success}44`, color: t.success, borderRadius:7, padding:"7px 16px", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily: t.fontBody }}>Reabrir Inscrições</button>
                    )}
                  </div>
                );
              })()}
              <div style={s.statusControlBox(eventoAtual.sumulaLiberada, "#27ae60", t.bgCardAlt, !eventoAtual.inscricoesEncerradas)}>
                <label style={{ ...s.statusControlLabel, opacity: eventoAtual.inscricoesEncerradas ? 1 : 0.45, cursor: eventoAtual.inscricoesEncerradas ? "pointer" : "not-allowed" }}>
                  <input type="checkbox" checked={!!eventoAtual.sumulaLiberada} disabled={!eventoAtual.inscricoesEncerradas} onChange={toggleSumula}
                    style={{ width:18, height:18, accentColor: t.accent, cursor: eventoAtual.inscricoesEncerradas ? "pointer" : "not-allowed", marginRight:10, flexShrink:0 }} />
                  <div>
                    <div style={{ fontWeight:700, color: eventoAtual.sumulaLiberada ? t.success : t.textTertiary }}>
                      {eventoAtual.sumulaLiberada ? "Súmulas Liberadas para Consulta" : "Súmulas Restritas (só Admin)"}
                    </div>
                    <div style={{ fontSize:12, color: t.textDimmed, marginTop:3 }}>
                      {eventoAtual.inscricoesEncerradas
                        ? eventoAtual.sumulaLiberada ? "Equipes e atletas podem visualizar as súmulas." : "Marque para liberar as súmulas a equipes e atletas."
                        : "Encerre as inscrições primeiro para liberar as súmulas."}
                    </div>
                  </div>
                </label>
              </div>
              <div style={s.statusControlBox(eventoAtual.competicaoEncerrada, "#8e44ad", "#1a0a2a")}>
                <label style={s.statusControlLabel}>
                  <input type="checkbox" checked={!!eventoAtual.competicaoEncerrada}
                    onChange={() => alterarStatusEvento(eventoAtual.id, { competicaoEncerrada: !eventoAtual.competicaoEncerrada })}
                    style={{ width:18, height:18, accentColor:"#8e44ad", cursor:"pointer", marginRight:10, flexShrink:0 }} />
                  <div>
                    <div style={{ fontWeight:700, color: eventoAtual.competicaoEncerrada ? "#c39bdf" : t.textTertiary }}>
                      {eventoAtual.competicaoEncerrada ? "Competição Encerrada" : "Competição em Andamento"}
                    </div>
                    <div style={{ fontSize:12, color: t.textDimmed, marginTop:3 }}>
                      {eventoAtual.competicaoEncerrada ? "O status mostra 'Encerrado'. Desmarque para reativar." : "Marque quando a competição terminar para mudar o status para Encerrado."}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: t.border, marginBottom: 28 }} />
        </>
      )}

      {/* ══ PROGRAMA HORÁRIO ════════════════════════════════════════════════ */}
      {!eventoAtual.competicaoFinalizada && (() => {
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
          if (fase === "Eliminatória") return t.warning;
          if (fase?.includes("Semifinal")) return t.accent;
          if (fase?.includes("Final")) return t.success;
          return t.textDimmed;
        };

        const linhas = [];
        provasBase.forEach(p => {
          // Tenta chave exata (modo detalhado); fallback: chave-grupo sem catId (modo agrupado)
          let entries = progFinal[p.id];
          if (!entries || !Array.isArray(entries)) {
            const cat = CATEGORIAS.find(c =>
              p.id.endsWith(`_${c.id}`) || p.id.includes(`_${c.id}_`)
            );
            if (cat) {
              const grupoKey = p.id.replace(`_${cat.id}`, "");
              if (grupoKey !== p.id) entries = progFinal[grupoKey];
            }
          }
          entries = entries || [{ fase: "", horario: "" }];
          entries.forEach((entry, ei) => {
            linhas.push({ ...p, _entryIdx: ei, _fase: entry.fase || "", _horario: entry.horario || "", _dia: entry.dia || 1 });
          });
        });

        // No modo agrupado, remove o implemento do nome para agrupamento e exibição
        // Ex: "Arremesso do Peso (3kg)" → "Arremesso do Peso"
        const modoAgrupado = (eventoAtual.modoHorario || "detalhado") === "agrupado";

        // Detectar se evento tem 2 dias
        const temDoisDias = !!(eventoAtual.dataFim && eventoAtual.dataFim !== eventoAtual.data);
        const diasDistintos = temDoisDias ? [...new Set(linhas.map(l => l._dia))].sort() : [1];
        const usarDivisaoDias = temDoisDias && diasDistintos.length > 1;

        const ordenarLinhas = (lista) => {
          const comH = lista.filter(l => l._horario).sort((a, b) => a._horario.localeCompare(b._horario));
          const semH = lista.filter(l => !l._horario).sort((a, b) => {
            if (a._isComp && b._isComp && a._parentId === b._parentId) return a.ordem - b.ordem;
            return (a.nome || "").localeCompare(b.nome || "");
          });
          return [...comH, ...semH];
        };

        const linhasOrdenadas = ordenarLinhas(linhas);

        const pausaRaw = eventoAtual.programaPausa || {};
        // Resolver pausa por dia — retrocompatível com formato antigo { horario, retorno, descricao }
        const getPausaDia = (dia) => {
          const porDia = pausaRaw[`dia${dia}`];
          if (porDia && porDia.horario) return porDia;
          // Fallback: formato legado (pausa única)
          if (pausaRaw.horario) return pausaRaw;
          return { horario: "", retorno: "", descricao: "" };
        };

        // Pausa global (para eventos de 1 dia)
        const pausaGlobal = getPausaDia(1);
        const pausaHorario = pausaGlobal.horario || "";
        const pausaRetorno = pausaGlobal.retorno || "";
        const pausaDesc    = pausaGlobal.descricao || "";
        const temPausa     = !!pausaHorario;

        // Helpers para dividir manhã/tarde dentro de uma lista (recebe pausa específica)
        const getManhaP = (lista, ph) => ph ? lista.filter(l => l._horario && l._horario < ph) : [];
        const getTardeP = (lista, ph, pr) => ph ? lista.filter(l => l._horario && l._horario >= (pr || ph)) : [];
        const getManha = (lista) => getManhaP(lista, pausaHorario);
        const getTarde = (lista) => getTardeP(lista, pausaHorario, pausaRetorno);
        const getSemHorario = (lista) => lista.filter(l => !l._horario);

        const manha        = getManha(linhasOrdenadas);
        const tarde        = getTarde(linhasOrdenadas);
        const semHorarioList = getSemHorario(linhasOrdenadas);
        const usarDivisao  = !usarDivisaoDias && temPausa && (manha.length > 0 || tarde.length > 0);

        const thStyle = { textAlign:"left", padding:"8px 10px", color: t.textMuted, fontWeight:600 };

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
            // No modo agrupado: remove o implemento do nome (ex: "(3kg)", "(500g)")
            // para agrupar "Arremesso do Peso (3kg)" e "Arremesso do Peso (4kg)" na mesma linha
            const nomeDisplay = modoAgrupado
              ? (p.nome || "").replace(/\s*\([^)]+\)\s*$/, "").trim()
              : p.nome;
            const chave = `${p._horario}||${nomeDisplay}||${sexoAbrev}||${p._fase}||${isComp ? p._parentId?.replace(/^[MF]_/,"") : ""}`;
            if (map.has(chave)) {
              const entry = map.get(chave);
              if (catNome && !entry.cats.includes(catNome)) entry.cats.push(catNome);
            } else {
              const grupo = { ...p, nome: nomeDisplay, cats: [catNome], _sexoAbrev: sexoAbrev, _sexoId: sexoId, _chave: chave };
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
          const sexoColor = p._sexoAbrev === "M" ? t.accent : "#ff88aa";
          return (
            <tr key={`${p._chave}_${idx}`} style={{ borderBottom:`1px solid ${t.border}`, background: idx % 2 === 0 ? "transparent" : t.bgCardAlt }}>
              <td style={{ padding:"8px 10px", fontFamily:"monospace", fontWeight:700, color: p._horario ? t.success : t.textDisabled, fontSize:14 }}>
                {p._horario || "—"}
              </td>
              <td style={{ padding:"8px 10px", color: t.textSecondary, fontWeight:600 }}>
                {isComp && <span style={{ color: t.accent, fontSize:10, marginRight:6 }}>{p._parentNome} {p.ordem}ª</span>}
                {p.nome}
                {isComp && p.dia && <span style={{ color: t.accent, fontSize:10, marginLeft:6 }}>(Dia {p.dia})</span>}
              </td>
              <td style={{ padding:"8px 10px", color: sexoColor, fontSize:12 }}>{sexoLabel}</td>
              <td style={{ padding:"8px 10px", color: t.textTertiary, fontSize:12 }}>{catsDisplay}</td>
              <td style={{ padding:"8px 10px", color: p._fase ? faseColor(p._fase) : t.textDimmed, fontSize:12, fontWeight: p._fase ? 700 : 400 }}>
                {p._fase || "—"}
              </td>
            </tr>
          );
        };

        const pausaRow = () => (
          <tr key="_pausa" style={{ background: t.bgCardAlt }}>
            <td colSpan={5} style={{ padding:"10px 14px", textAlign:"center" }}>
              <span style={{ color: t.accent, fontWeight:700, fontSize:13 }}>{pausaDesc || "Intervalo"}</span>
              <span style={{ color: t.textMuted, fontSize:12, marginLeft:10 }}>
                {pausaHorario}{pausaRetorno ? ` — ${pausaRetorno}` : ""}
              </span>
            </td>
          </tr>
        );

        const tHead = (
          <tr style={{ borderBottom:`2px solid ${t.border}` }}>
            <th style={{ ...thStyle, width:70 }}>Horário</th>
            <th style={thStyle}>Prova</th>
            <th style={{ ...thStyle, width:80 }}>Sexo</th>
            <th style={thStyle}>Categorias</th>
            <th style={thStyle}>Fase</th>
          </tr>
        );

        const sectionLabel = (label) => (
          <tr key={`_label_${label}`}>
            <td colSpan={5} style={{ padding:"10px 10px 6px", fontWeight:800, fontSize:13, color: t.accent, borderBottom:`1px solid ${t.border}`, letterSpacing:1 }}>
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
          <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:10, padding:"20px 24px", marginBottom:24 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ color: t.accent, fontWeight:700, fontSize:14 }}>Programa Horário</div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:12, color: t.textDimmed }}>{linhasOrdenadas.length} entrada(s)</span>
                {(tpU === "admin" || tpU === "organizador" || tpU === "funcionario") && (
                  <button onClick={async () => {
                    const _fmtData = (d) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
                    const dataEvt = eventoAtual.dataFim && eventoAtual.dataFim !== eventoAtual.data
                      ? `${_fmtData(eventoAtual.data)} a ${_fmtData(eventoAtual.dataFim)}`
                      : _fmtData(eventoAtual.data);
                    const logoComp = eventoAtual.logoCompeticao || "";
                    const logoCabEsq = eventoAtual.logoCabecalho || eventoAtual.logoCompeticao || "";
                    const logoCabDir = eventoAtual.logoCabecalhoDireito || "";
                    const logoRod  = eventoAtual.logoRodape || "";
                    const thPrint  = `<tr><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333;font-size:10px;color:#555;font-weight:700;width:55px">Horário</th><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333;font-size:10px;color:#555;font-weight:700">Prova</th><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333;font-size:10px;color:#555;font-weight:700;width:70px">Sexo</th><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333;font-size:10px;color:#555;font-weight:700">Categorias</th><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333;font-size:10px;color:#555;font-weight:700">Fase</th></tr>`;
                    const pausaPrint = temPausa ? `<tr><td colspan="5" style="padding:10px;text-align:center;background:#f0f0f0;border-bottom:1px solid #ddd"><strong style="color:#b88a00">${pausaDesc || "Intervalo"}</strong><span style="color:#666;margin-left:8px;font-size:11px">${pausaHorario}${pausaRetorno ? " — " + pausaRetorno : ""}</span></td></tr>` : "";
                    const secLabel = (label) => `<tr><td colspan="5" style="padding:8px 10px 4px;font-weight:800;font-size:12px;color:#b88a00;border-bottom:1px solid #ccc;letter-spacing:1px">${label}</td></tr>`;
                    const buildDayBody = (dayLinhas, dia) => {
                      const dp = getPausaDia(dia || 1);
                      const dpH = dp.horario || "";
                      const dpR = dp.retorno || "";
                      const dpD = dp.descricao || "";
                      const dpTemPausa = !!dpH;
                      const dayOrdenadas = ordenarLinhas(dayLinhas);
                      const dayManha = getManhaP(dayOrdenadas, dpH);
                      const dayTarde = getTardeP(dayOrdenadas, dpH, dpR);
                      const daySem   = getSemHorario(dayOrdenadas);
                      const dayDivisao = dpTemPausa && (dayManha.length > 0 || dayTarde.length > 0);
                      const dpPausaPrint = dpTemPausa ? `<tr><td colspan="5" style="padding:10px;text-align:center;background:#f0f0f0;border-bottom:1px solid #ddd"><strong style="color:#b88a00">${dpD || "Intervalo"}</strong><span style="color:#666;margin-left:8px;font-size:11px">${dpH}${dpR ? " — " + dpR : ""}</span></td></tr>` : "";
                      let body = "";
                      if (dayDivisao) {
                        body += secLabel("MANHÃ");
                        agruparLinhas(dayManha).forEach((p,i) => { body += printRow(p,i); });
                        body += dpPausaPrint;
                        body += secLabel("TARDE");
                        agruparLinhas(dayTarde).forEach((p,i) => { body += printRow(p,i); });
                        if (daySem.length > 0) {
                          body += secLabel("A DEFINIR");
                          agruparLinhas(daySem).forEach((p,i) => { body += printRow(p,i); });
                        }
                      } else {
                        agruparLinhas(dayOrdenadas).forEach((p,i) => { body += printRow(p,i); });
                      }
                      return body;
                    };

                    const _fmtDia = (dataStr) => {
                      if (!dataStr) return "";
                      return new Date(dataStr + "T12:00:00").toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long" });
                    };

                    let tableBody = "";
                    if (usarDivisaoDias) {
                      diasDistintos.forEach(dia => {
                        const diaLinhas = linhas.filter(l => l._dia === dia);
                        const dataLabel = dia === 1 ? _fmtDia(eventoAtual.data) : _fmtDia(eventoAtual.dataFim);
                        tableBody += `<tr><td colspan="5" style="padding:12px 10px 6px;font-weight:900;font-size:14px;color:#1976D2;border-bottom:2px solid #1976D2;letter-spacing:1px">DIA ${dia}${dataLabel ? ` — ${dataLabel}` : ""}</td></tr>`;
                        tableBody += buildDayBody(diaLinhas, dia);
                      });
                    } else {
                      tableBody = buildDayBody(linhas, 1);
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
                        ${logoCabEsq ? `<img loading="lazy" src="${logoCabEsq}" style="max-height:60px;max-width:120px;object-fit:contain;flex-shrink:0"/>` : ""}
                        <div style="flex:1;min-width:0">
                          <div style="font-size:18px;font-weight:800;color:#111">${eventoAtual.nome}</div>
                          <div style="font-size:11px;color:#666;margin-top:2px">${dataEvt} · ${_getLocalEventoDisplay(eventoAtual)}</div>
                        </div>
                        ${logoCabDir ? `<img loading="lazy" src="${logoCabDir}" style="max-height:60px;max-width:120px;object-fit:contain;flex-shrink:0"/>` : ""}
                      </div>
                      <div style="text-align:center;font-size:15px;font-weight:800;color:#333;margin:10px 0 14px;letter-spacing:1px">PROGRAMA HORÁRIO</div>
                      <table><thead>${thPrint}</thead><tbody>${tableBody}</tbody></table>
                      <div class="rod-wrap">
                        ${logoRod ? `<div style="margin-top:14px;padding-top:10px;border-top:1px solid #ddd;text-align:center;"><img loading="lazy" src="${logoRod}" alt="" style="max-width:100%;max-height:18mm;object-fit:contain;"/></div>` : ""}
                        <div style="padding-top:6px;text-align:center;">
                          <div style="font-size:9px;color:#aaa;line-height:1.9">Gerado em: ${new Date().toLocaleString("pt-BR")} · Plataforma de Competições - GERENTRACK</div>
                        </div>
                      </div>
                    </div></body></html>`;
                    const win = window.open("", "_blank", "width=900,height=700");
                    if (!win) { alert("Permita pop-ups para imprimir."); return; }
                    win.document.open(); win.document.write(html); win.document.close();
                  }}
                  style={{ background:"transparent", border:`1px solid ${t.border}`, borderRadius:6, color: t.accent, fontSize:12, padding:"5px 14px", cursor:"pointer", fontWeight:600 }}>
                    Imprimir
                  </button>
                )}
              </div>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>{tHead}</thead>
                <tbody>
                  {usarDivisaoDias ? (<>
                    {diasDistintos.map(dia => {
                      const dp = getPausaDia(dia);
                      const dpH = dp.horario || "";
                      const dpR = dp.retorno || "";
                      const dpD = dp.descricao || "";
                      const dpTemPausa = !!dpH;
                      const diaLinhas = ordenarLinhas(linhas.filter(l => l._dia === dia));
                      const diaM = getManhaP(diaLinhas, dpH);
                      const diaT = getTardeP(diaLinhas, dpH, dpR);
                      const diaS = getSemHorario(diaLinhas);
                      const diaDivisao = dpTemPausa && (diaM.length > 0 || diaT.length > 0);
                      const dataLabel = dia === 1
                        ? new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long" })
                        : eventoAtual.dataFim ? new Date(eventoAtual.dataFim + "T12:00:00").toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long" }) : "";
                      const diaPausaRow = () => (
                        <tr key={`_pausa_dia${dia}`} style={{ background: t.bgCardAlt }}>
                          <td colSpan={5} style={{ padding:"10px 14px", textAlign:"center" }}>
                            <span style={{ color: t.accent, fontWeight:700, fontSize:13 }}>{dpD || "Intervalo"}</span>
                            <span style={{ color: t.textMuted, fontSize:12, marginLeft:10 }}>
                              {dpH}{dpR ? ` — ${dpR}` : ""}
                            </span>
                          </td>
                        </tr>
                      );
                      return (
                        <React.Fragment key={`dia_${dia}`}>
                          <tr><td colSpan={5} style={{ padding:"12px 10px 6px", fontWeight:900, fontSize:14, color: t.accent, borderBottom:`2px solid ${t.accent}`, letterSpacing:1 }}>
                            DIA {dia}{dataLabel ? ` — ${dataLabel}` : ""}
                          </td></tr>
                          {diaDivisao ? (<>
                            {sectionLabel("MANHÃ")}
                            {agruparLinhas(diaM).map((p, i) => renderRow(p, i))}
                            {diaPausaRow()}
                            {sectionLabel("TARDE")}
                            {agruparLinhas(diaT).map((p, i) => renderRow(p, i))}
                            {diaS.length > 0 && (<>
                              {sectionLabel("A DEFINIR")}
                              {agruparLinhas(diaS).map((p, i) => renderRow(p, i))}
                            </>)}
                          </>) : (
                            agruparLinhas(diaLinhas).map((p, i) => renderRow(p, i))
                          )}
                        </React.Fragment>
                      );
                    })}
                  </>) : usarDivisao ? (<>
                    {sectionLabel("MANHÃ")}
                    {agruparLinhas(manha).map((p, i) => renderRow(p, i))}
                    {pausaRow()}
                    {sectionLabel("TARDE")}
                    {agruparLinhas(tarde).map((p, i) => renderRow(p, i))}
                    {semHorarioList.length > 0 && (<>
                      {sectionLabel("A DEFINIR")}
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

      {/* ══ REGULAMENTO ════════════════════════════════════════════════════ */}
      {eventoAtual.regulamentoUrl && (
        <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:10, padding:"20px 24px", marginBottom:24, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ color: t.accent, fontWeight:700, fontSize:14 }}>Regulamento</div>
          <a href={`/competicao/${eventoAtual.slug || eventoAtual.id}/regulamento`} target="_blank" rel="noopener noreferrer"
            style={{ background:`linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color:"#fff", padding:"6px 18px", borderRadius:6, fontSize:12, fontWeight:700, fontFamily: t.fontTitle, letterSpacing:1, textDecoration:"none", cursor:"pointer" }}>
            Clique aqui
          </a>
        </div>
      )}

      {/* ══ DESCRIÇÃO ═══════════════════════════════════════════════════════ */}
      {eventoAtual.descricao && (!eventoAtual.competicaoFinalizada || isDonoOuAdmin) && (
        <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:10, padding:"20px 24px", marginBottom:24 }}>
          <div style={{ color: t.accent, fontWeight:700, fontSize:14, marginBottom:12 }}>Informações</div>
          <div
            style={{ color: t.textSecondary, fontFamily:"'Inter', sans-serif", fontSize:14, lineHeight:1.7, wordBreak:"break-word", whiteSpace:"pre-wrap", maxHeight: 400, overflowY: "auto", textAlign:"justify" }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(eventoAtual.descricao) }}
          />
        </div>
      )}

      {/* ══ ABAS — perfis não-admin (inclui org visitante): ficam após programa horário */}
      {!isDonoOuAdmin && (
        <div style={s.tabsWrapper}>
          {tabs.length > 1 && (
            <div style={s.tabsBar}>
              {tabs.map((tab, idx) => (
                <button
                  key={tab.id}
                  style={{
                    ...s.tabBtn(abaEfetiva === tab.id),
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

      {/* ── Barra de status somente-leitura (não-admin/não-dono logado) ── */}
      {!isDonoOuAdmin && usuarioLogado && (
        <div style={s.statusBar}>
          <div style={s.statusBarItem}>
            <span style={s.statusDot(
              getStatusInscricoes(eventoAtual) === "abertas" ? t.success :
              getStatusInscricoes(eventoAtual) === "em_breve" ? t.accent : t.danger
            )} />
            <span style={{ color: t.textTertiary, fontSize:13 }}>
              {getStatusInscricoes(eventoAtual) === "em_breve"
                ? <>Inscrições em breve — <span style={{ color: t.accent }}>abre em {new Date(eventoAtual.dataAberturaInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}</span></>
                : getStatusInscricoes(eventoAtual) === "abertas"
                  ? <>Inscrições abertas{eventoAtual.dataEncerramentoInscricoes && (
                      <span style={{ color: t.textDimmed }}> — até {new Date(eventoAtual.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                    )}</>
                  : "Inscrições encerradas"
              }
            </span>
          </div>
          <div style={s.statusBarItem}>
            <span style={s.statusDot(eventoAtual.sumulaLiberada ? t.success : t.textDimmed)} />
            <span style={{ color: t.textTertiary, fontSize:13 }}>
              {eventoAtual.sumulaLiberada ? "Súmulas disponíveis" : "Súmulas não disponíveis"}
            </span>
          </div>
        </div>
      )}

      {/* ══ FINALIZAR COMPETIÇÃO — admin/org dono, sempre no fim da página ═══ */}
      {isDonoOuAdmin && !eventoAtual.competicaoFinalizada && (
        <div style={{ background: t.bgCardAlt, border:`1px solid #8e44ad44`, borderRadius:12, padding:"16px 20px", marginTop: 8 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:"#c39bdf", marginBottom:4 }}>Finalizar Competição</div>
              <div style={{ fontSize:12, color: t.textMuted, lineHeight:1.5 }}>
                Ao finalizar, <strong style={{ color: t.danger }}>todos os dados serão bloqueados para edição</strong> (inscrições, resultados, súmulas, programa de provas).
                Somente um <strong style={{ color: t.accent }}>administrador</strong> poderá desbloquear mediante solicitação.
              </div>
            </div>
            <button
              style={{ padding:"10px 24px", borderRadius:8, border:"2px solid #8e44ad", background: t.accentBg, color:"#c39bdf", fontWeight:800, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", letterSpacing:0.5 }}
              onClick={async () => { 
                if (await confirmar(
                  "FINALIZAR COMPETIÇÃO\n\n" +
                  "Após finalizar, NENHUM dado poderá ser editado:\n" +
                  "• Inscrições\n• Resultados\n• Súmulas\n• Programa de provas\n• Dados da competição\n\n" +
                  "Possíveis quebras de recorde serão detectadas e ficarão como PENDÊNCIAS para homologação pelo administrador.\n" +
                  "Para desbloquear será necessário solicitar autorização a um administrador.\n\n" +
                  "Deseja finalizar esta competição?"
                )) {
                  // Recordes — API com fallback local
                  try {
                    const resRecordes = await chamarApiComFallback(
                      "/api/recordes",
                      { method: "POST", body: { eventoId: eventoAtual.id } },
                      () => ({ pendencias: RecordDetectionEngine.detectarQuebras(eventoAtual, resultados, recordes, atletas, equipes, inscricoes) })
                    );
                    const novasPendencias = resRecordes.pendencias || [];
                    if (novasPendencias.length > 0)
                      setPendenciasRecorde(prev => RecordDetectionEngine.mesclarPendencias(prev, novasPendencias));
                  } catch (e) { console.error("Erro ao detectar quebras de recorde:", e); }
                  // ── Ranking: extrair entradas de atletas com CBAt ──
                  try {
                    const novasRanking = RankingExtractionEngine.extrairEntradas(eventoAtual, resultados, atletas, equipes, inscricoes);
                    if (novasRanking.length > 0)
                      setRanking(prev => RankingExtractionEngine.mesclarEntradas(prev, novasRanking));
                  } catch (e) { console.error("Erro ao extrair ranking:", e); }
                  // ── Snapshot de atletas para congelar dados históricos ──
                  const snapshotAtletas = {};
                  const atletaIdsEvento = new Set();
                  (inscricoes || []).filter(i => i.eventoId === eventoAtual.id).forEach(i => {
                    if (i.atletaId) atletaIdsEvento.add(i.atletaId);
                    if (Array.isArray(i.atletasIds)) i.atletasIds.forEach(aid => atletaIdsEvento.add(aid));
                  });
                  atletaIdsEvento.forEach(aId => {
                    const atl = atletas.find(a => a.id === aId);
                    if (!atl) return;
                    const eq = atl.equipeId ? (equipes || []).find(e => e.id === atl.equipeId) : null;
                    snapshotAtletas[aId] = {
                      nome: atl.nome || "",
                      clube: _getClubeAtletaUtil(atl, equipes) || "",
                      equipeId: atl.equipeId || null,
                      _siglaEquipe: eq?.sigla || "",
                      anoNasc: atl.anoNasc || "",
                      dataNasc: atl.dataNasc || "",
                      sexo: atl.sexo || "",
                      cbat: _getCbat(atl) || "",
                    };
                  });
                  // ── Snapshot de classificação por equipes ──
                  let snapshotClassifEquipes = null;
                  let snapshotClassifEquipesM = null;
                  let snapshotClassifEquipesF = null;
                  try {
                    if (eventoAtual.pontuacaoEquipes?.ativo) {
                      snapshotClassifEquipes = TeamScoringEngine.calcularClassificacaoEquipes(eventoAtual, inscricoes, resultados, atletas, equipes, recordes);
                      const cfgPont = eventoAtual.pontuacaoEquipes || {};
                      if (cfgPont.classificacaoPorSexo) {
                        snapshotClassifEquipesM = TeamScoringEngine.calcularClassificacaoEquipes(eventoAtual, inscricoes, resultados, atletas, equipes, recordes, "M");
                        snapshotClassifEquipesF = TeamScoringEngine.calcularClassificacaoEquipes(eventoAtual, inscricoes, resultados, atletas, equipes, recordes, "F");
                      }
                    }
                  } catch (e) { console.error("Erro ao gerar snapshot de classificação por equipes:", e); }
                  alterarStatusEvento(eventoAtual.id, {
                    competicaoFinalizada:    true,
                    competicaoFinalizadaEm:  Date.now(),
                    competicaoFinalizadaPor: usuarioLogado?.nome || "—",
                    competicaoEncerrada:     true,
                    snapshotAtletas,
                    snapshotClassifEquipes,
                    snapshotClassifEquipesM,
                    snapshotClassifEquipesF,
                  });
                  // Consolidar no PostgreSQL (background, sem bloquear)
                  chamarApiComFallback(
                    "/api/resultados/consolidar",
                    { method: "POST", body: { eventoId: eventoAtual.id } },
                    () => ({ ok: true, msg: "Consolidação offline ignorada" })
                  ).catch(err => console.warn("Consolidação PostgreSQL:", err.message));
                }
              }}>
              Finalizar Competição
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default TelaEventoDetalhe;
