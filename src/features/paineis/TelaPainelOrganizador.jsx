import React, { useState } from "react";
import { _getLocalEventoDisplay } from "../../shared/formatters/utils";
import { StatCard } from "../ui/StatCard";
import { getUsage, getEncerramento } from "../../shared/engines/planEngine";
import { Th, Td } from "../ui/TableHelpers";
import { SinoNotificacoes } from "../ui/SinoNotificacoes";
import { gerarHtmlRelatorioParticipacao } from "../impressao/gerarHtmlRelatorioParticipacao";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";

const PERMISSOES = [
  { id:"ver_competições",    grupo:"Competições",  label:"Visualizar competições" },
  { id:"editar_competições", grupo:"Competições",  label:"Criar / editar competições" },
  { id:"inscricoes",         grupo:"Competições",  label:"Gerenciar inscrições" },
  { id:"resultados",         grupo:"Resultados",   label:"Digitar resultados" },
  { id:"sumulas",            grupo:"Resultados",   label:"Gerenciar súmulas" },
  { id:"camara_chamada",     grupo:"Secretaria",   label:"Câmara de chamada / Medalhas" },
  { id:"atletas",            grupo:"Atletas",      label:"Gerenciar atletas" },
  { id:"funcionarios_ver",   grupo:"Funcionários", label:"Visualizar funcionários" },
];

function getStyles(t) {
  return {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: t.textPrimary, marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: t.textPrimary, marginBottom: 20, letterSpacing: 1 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  statCard: { background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 12, padding: "18px 24px", textAlign: "center", minWidth: 100 },
  statValue: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: t.accent, lineHeight: 1, marginBottom: 6 },
  statLabel: { fontSize: 13, color: t.textMuted, letterSpacing: 1 },
  btnPrimary: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: t.accent, border: `2px solid ${t.accentBorder}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost: { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  btnIconSm: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textMuted, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: `${t.danger}12`, border: `1px solid ${t.danger}44`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: `1px solid ${t.border}` },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: t.bgHeaderSolid, padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` },
  td: { padding: "12px 16px", fontSize: 14, color: t.textSecondary, borderBottom: `1px solid ${t.border}` },
  tr: { transition: "background 0.15s" },
  trOuro: { background: t.trOuro },
  trPrata: { background: t.trPrata },
  trBronze: { background: t.trBronze },
  marca: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: t.accent },
  emptyState: { textAlign: "center", padding: "60px 20px", color: t.textDisabled, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },
  painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  painelBtns: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { width: "100%", background: t.bgInput, borderWidth: 1, borderStyle: "solid", borderColor: t.borderInput, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  select: { width: "100%", background: t.bgInput, borderWidth: 1, borderStyle: "solid", borderColor: t.borderInput, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  erro: { background: t.bgCardAlt, border: `1px solid ${t.danger}`, color: t.danger, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn: { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", padding: 0 },
  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  badgeGold: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  catBanner: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 14, color: t.textTertiary },
  catPreview: { background: t.bgInput, border: `1px solid ${t.accent}`, borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: t.textTertiary },
  atletaInfo: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12, padding: "10px 14px", background: t.bgInput, borderRadius: 8, fontSize: 13 },
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.accent, marginBottom: 16 },
  formPage: { maxWidth: 640, margin: "60px auto", padding: "0 24px 80px" },
  formCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32, marginBottom: 20 },
  formTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: t.textPrimary, textAlign: "center", marginBottom: 8 },
  formSub: { color: t.textDimmed, textAlign: "center", fontSize: 14, marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },
  fieldError: { color: t.danger, fontSize: 12, marginTop: 2 },
  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: t.textMuted, transition: "all 0.2s" },
  radioLabelActive: { background: t.bgHover, border: `1px solid ${t.accent}`, color: t.accent },
  resumoInscricao: { background: t.bgCard, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: "16px 20px", marginTop: 16 },
  tagProva: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  sumuCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  savedBadge: { background: t.bgCardAlt, border: `1px solid ${t.success}44`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  digitarDica: { color: t.textDimmed, fontSize: 12 },
  inputMarca: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", color: t.accent, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
  infoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: t.accent, marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: `1px solid ${t.border}`, fontSize: 14, color: t.textSecondary, display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: t.accent, fontWeight: 700 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: `linear-gradient(180deg, ${t.bgCardAlt} 0%, transparent 100%)`, borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: t.accent, color: t.textPrimary, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, color: t.textPrimary, lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: t.textDimmed },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: t.textMuted, flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? `${t.danger}18` : status === "hoje_pre" ? `${t.accent}18` : status === "futuro" ? `${t.success}18` : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textDisabled,
    border: `1px solid ${status === "ao_vivo" ? `${t.danger}44` : status === "hoje_pre" ? `${t.accent}44` : status === "futuro" ? `${t.success}44` : t.border}`,
  }),
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: t.textPrimary, fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  statusBarItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  statusDot: (cor) => ({ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }),
  statusDotInline: (cor) => ({ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: cor, background: cor + "22", border: `1px solid ${cor}44`, borderRadius: 10, padding: "2px 8px", whiteSpace: "nowrap" }),
  statusControlsCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusControlsTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: t.accent, letterSpacing: 1, marginBottom: 14 },
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
  permissividadeTag: (ativo) => ({ display: "inline-block", background: ativo ? `${t.success}18` : t.bgCard, border: `1px solid ${ativo ? `${t.success}66` : t.border}`, color: ativo ? t.success : t.textDisabled, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600 }),
  permissividadeAlert: { display: "flex", gap: 14, alignItems: "flex-start", background: `${t.success}10`, border: `1px solid ${t.success}66`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 },
  permissividadeAlertIcon: { fontSize: 28, flexShrink: 0, marginTop: 2 },
  permissividadeAlertTitle: { fontWeight: 700, color: t.success, fontSize: 15, marginBottom: 4 },
  permissividadeAlertBody: { color: t.textTertiary, fontSize: 13, lineHeight: 1.6, marginBottom: 6 },
  permissividadeAlertRodape: { fontSize: 12, color: t.textDimmed, fontStyle: "italic" },
  filtroProvasBar: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 20 },
  filtroProvasBloco: { display: "flex", flexDirection: "column", gap: 8 },
  filtroProvasLabel: { fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 },
  filtroProvasPills: { display: "flex", flexWrap: "wrap", gap: 6 },
  filtroPill: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textDimmed, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5, transition: "all 0.15s" },
  filtroPillAtivo: { background: t.bgHover, border: `1px solid ${t.accent}`, color: t.accent },
  filtroClearBtn: { background: "none", border: "none", color: `${t.accent}88`, cursor: "pointer", fontSize: 11, fontFamily: "'Barlow', sans-serif", padding: "0 4px", textDecoration: "underline" },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? t.bgHover : "transparent", color: ativo ? t.accent : t.textDisabled, border: `1px solid ${ativo ? t.accentBorder : t.border}` }),
  stepDivider: { flex: 1, height: 1, background: t.border, margin: "0 8px" },
  modoSwitch: { display: "flex", gap: 0, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: t.textDimmed, padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: t.bgInput, color: t.accent },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: t.bgHover, borderColor: t.accent, color: t.accent },
  grupoProvasBox: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 16, overflow: "hidden" },
  grupoProvasHeader: { background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  provaCheckBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", lineHeight: 1.4, userSelect: "none" },
  provaCheckBtnSel: { background: t.bgHover, borderColor: t.accent, color: t.accent },
};
}

function TelaPainelOrganizador() {
  const { usuarioLogado } = useAuth();
  const { eventos, inscricoes, atletas, selecionarEvento, adicionarEvento, editarEvento, excluirEvento, alterarStatusEvento, equipes, atualizarAtleta, responderVinculo, resultados, sincronizarNomesEquipes, numeracaoPeito } = useEvento();
  const { setTela, organizadores, funcionarios, solicitacoesVinculo, solicitacoesEquipe, aprovarEquipe, recusarEquipe, registrarAcao, setAtletaEditandoId, notificacoes, marcarNotifLida, solicitacoesRelatorio, resolverRelatorio, excluirRelatorio, historicoAcoes } = useApp();
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const tipoOrg = usuarioLogado?.tipo;
  if (tipoOrg !== "organizador" && tipoOrg !== "funcionario" && tipoOrg !== "admin") return (
    <div style={s.page}><div style={s.emptyState}>
      <span style={{ fontSize: 48 }}>🚫</span>
      <p style={{ color: t.danger, fontWeight: 700 }}>Acesso não autorizado</p>
      <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
    </div></div>
  );

  const isFuncionario = usuarioLogado?.tipo === "funcionario";
  const orgId         = isFuncionario ? usuarioLogado?.organizadorId : usuarioLogado?.id;
  const meuOrg        = organizadores?.find(o => o.id === orgId);
  const _todosEventosOrg = eventos.filter(e => e.organizadorId === orgId);
  const meusEventos = isFuncionario && !(usuarioLogado?.permissoes || []).includes("editar_competições")
    ? _todosEventosOrg.filter(e => {
        const vis = e.funcionariosVisiveis;
        if (!vis || vis.length === 0) return false; // sem liberação explícita → não vê
        return vis.includes(usuarioLogado?.id);
      })
    : _todosEventosOrg;
  const isPendente    = meuOrg?.status === "pendente";
  const [vinculoFeedback, setVinculoFeedback] = useState(null);

  const handleResponderVinculo = (solId, aceitar) => {
    const sol = (solicitacoesVinculo || []).find(sv => sv.id === solId);
    responderVinculo(solId, aceitar);
    const nome = sol?.atletaNome || "Atleta";
    const msg = aceitar
      ? `✅ Vínculo de ${nome} aceito com sucesso!`
      : `❌ Vínculo de ${nome} recusado.`;
    setVinculoFeedback(msg);
    setTimeout(() => setVinculoFeedback(null), 4000);
  };

  const perms = isFuncionario ? (usuarioLogado?.permissoes || []) : null;
  const temPerm = (p) => perms === null || perms.includes(p);
  const [buscaComp, setBuscaComp] = useState("");
  const [relEvento, setRelEvento] = useState("");
  const [relFiltro, setRelFiltro] = useState("todos"); // todos | equipe | atleta
  const [relEquipeId, setRelEquipeId] = useState("");
  const [relBuscaAtl, setRelBuscaAtl] = useState("");
  const [relAtletasSel, setRelAtletasSel] = useState([]);
  const [relAssinatura, setRelAssinatura] = useState("");
  const [auditPagina, setAuditPagina] = useState(1);

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>
            {isFuncionario ? "Painel do Funcionário" : "Painel do Organizador"}
          </h1>
          <p style={{ color: t.textTertiary, margin:"4px 0 0" }}>
            {usuarioLogado?.nome}
            {isFuncionario && usuarioLogado?.cargo ? ` — ${usuarioLogado.cargo}` : ""}
            {" "}·{" "}
            <span style={{ color: t.textDimmed }}>{meuOrg?.entidade || usuarioLogado?.entidade || ""}</span>
          </p>
          {isFuncionario && (
            <div style={{ marginTop:6, display:"flex", flexWrap:"wrap", gap:4 }}>
              {(usuarioLogado.permissoes||[]).length === 0
                ? <span style={{ fontSize:11, color: t.danger }}>Nenhuma permissão concedida</span>
                : (usuarioLogado.permissoes||[]).map(pid => {
                    const p = PERMISSOES.find(x => x.id === pid);
                    return p ? (
                      <span key={pid} style={{ fontSize:10, background:`${t.success}18`, color:t.success,
                        padding:"2px 7px", borderRadius:3, fontWeight:600 }}>{p.label}</span>
                    ) : null;
                  })
              }
            </div>
          )}
        </div>
        <div style={s.painelBtns}>
          <SinoNotificacoes
            notificacoes={notificacoes}
            usuarioId={usuarioLogado?.id}
            marcarNotifLida={marcarNotifLida}
          />
          {(!isFuncionario || temPerm("funcionarios_ver")) &&
            <button style={s.btnSecondary} onClick={() => setTela("funcionarios")}>Funcionários</button>}
          {(!isFuncionario || temPerm("inscricoes")) &&
            <button style={s.btnSecondary} onClick={() => setTela("gerenciar-equipes")}>Equipes</button>}
          {(!isFuncionario || temPerm("atletas")) &&
            <button style={s.btnSecondary} onClick={() => setTela("cadastrar-atleta")}>Atletas</button>}
          {temPerm("editar_competições") &&
            <button style={s.btnPrimary} onClick={() => { selecionarEvento(null); setTela("novo-evento"); }}>+ Nova Competição</button>}
        </div>
      </div>

      {/* Banner de conta pendente (não deveria acontecer — login bloqueia — mas por segurança) */}
      {isPendente && (
        <div style={{ background:`${t.accent}12`, border:`1px solid ${t.accent}`, borderRadius:8, padding:"14px 20px", marginBottom:20 }}>
          <strong style={{ color: t.accent }}>Conta aguardando aprovação</strong>
          <p style={{ color: t.textTertiary, fontSize:13, margin:"6px 0 0" }}>
            Seu cadastro está sendo analisado pelo administrador. Você pode configurar seus competições, mas eles só ficarão visíveis ao público após aprovação.
          </p>
        </div>
      )}

      {/* ── Banner de encerramento (Fase 1) ── */}
      {meuOrg && (() => {
        const enc = getEncerramento(meuOrg);
        if (!enc.encerrado || enc.faseEncerramento !== 1) return null;
        const diasRestantes = 7 - enc.diasDesdeEncerramento;
        return (
          <div style={{ background: `${t.danger}10`, border: `2px solid ${t.danger}`, borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
            <div style={{ fontWeight: 800, color: t.danger, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", marginBottom: 6 }}>
              Contrato encerrado
            </div>
            <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.7 }}>
              Seu contrato foi encerrado. Você tem <strong style={{ color: t.danger }}>{diasRestantes} dia(s)</strong> para exportar seus dados.
              Após esse prazo, o acesso será bloqueado e os dados ficarão indisponíveis.
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 8 }}>
              Para renovar: <span style={{ color: t.accent }}>atendimento@gerentrack.com.br</span>
            </div>
          </div>
        );
      })()}

      {/* ── Card de Plano ── */}
      {meuOrg && (() => {
        const usage = getUsage(meuOrg, _todosEventosOrg);
        const ativo = usage.status === "ativo";
        const expirado = usage.status === "expirado";
        const semPlano = usage.status === "sem_plano";
        return (
          <div style={{ background: t.bgCardAlt, border: `1px solid ${ativo ? t.accentBorder : expirado ? `${t.danger}44` : t.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Plano</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", color: ativo ? t.accent : expirado ? t.danger : t.textDisabled }}>
                  {usage.planoNome}
                  <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 8, padding: "2px 8px", borderRadius: 4,
                    background: ativo ? `${t.success}15` : expirado ? `${t.danger}15` : t.bgInput,
                    color: ativo ? t.success : expirado ? t.danger : t.textDimmed,
                    border: `1px solid ${ativo ? `${t.success}33` : expirado ? `${t.danger}33` : t.border}` }}>
                    {ativo ? "Ativo" : expirado ? "Expirado" : "Sem plano"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {usage.maxCompeticoes !== Infinity && usage.maxCompeticoes > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: t.accent }}>{usage.eventosNoPeriodo} / {usage.maxCompeticoes}</div>
                    <div style={{ fontSize: 10, color: t.textMuted }}>Competições</div>
                  </div>
                )}
                {usage.maxCompeticoes === Infinity && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: t.accent }}>{usage.eventosNoPeriodo}</div>
                    <div style={{ fontSize: 10, color: t.textMuted }}>Competições (ilimitado)</div>
                  </div>
                )}
                {usage.creditosDisponiveis > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: t.accent }}>{usage.creditosDisponiveis}</div>
                    <div style={{ fontSize: 10, color: t.textMuted }}>Crédito(s) avulso</div>
                  </div>
                )}
                {usage.diasRestantes !== null && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: usage.diasRestantes <= 7 ? t.danger : t.textPrimary }}>{usage.diasRestantes}</div>
                    <div style={{ fontSize: 10, color: t.textMuted }}>Dia(s) restante(s)</div>
                  </div>
                )}
              </div>
            </div>
            {(semPlano || expirado) && (
              <div style={{ marginTop: 12, fontSize: 12, color: expirado ? t.danger : t.textMuted, lineHeight: 1.6 }}>
                {expirado ? "Seu plano expirou. Renove para criar novas competições." : "Nenhum plano ativo. Entre em contato para contratar."}
                {" "}<span style={{ color: t.accent }}>atendimento@gerentrack.com.br</span>
              </div>
            )}
          </div>
        );
      })()}

      <div style={s.statsRow}>
        <StatCard value={meusEventos.length}  label="Competições" />
        <StatCard value={meusEventos.filter(e=>!e.inscricoesEncerradas).length} label="Com Inscrições Abertas" />
        <StatCard value={inscricoes.filter(i=>meusEventos.some(e=>e.id===i.eventoId)).length} label="Total Inscrições" />
        {(!isFuncionario || temPerm("funcionarios_ver")) && <StatCard value={funcionarios?.filter(f=>f.organizadorId===orgId).length||0} label="Funcionários" />}
      </div>

      {isFuncionario && (usuarioLogado?.permissoes||[]).length === 0 && (
        <div style={{ background:"#1a0a0a", border:`1px solid ${t.danger}66`, borderRadius:8,
          padding:"16px 20px", marginBottom:20, textAlign:"center" }}>
          <div style={{ fontSize:14, marginBottom:8, color: t.danger, fontWeight: 800 }}>ACESSO RESTRITO</div>
          <strong style={{ color: t.danger }}>Nenhuma permissão concedida</strong>
          <p style={{ color: t.textDimmed, fontSize:13, margin:"6px 0 0" }}>
            Solicite ao organizador que configure suas permissões de acesso.
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SEÇÃO 1: ALERTAS — Pendências que requerem ação
         ═══════════════════════════════════════════════════════════════ */}

      {/* ── Solicitações de Relatório Pendentes ── */}
      {(() => {
        const relPendentes = (solicitacoesRelatorio || []).filter(sol => {
          if (sol.status !== "pendente") return false;
          const evt = eventos.find(e => e.id === sol.eventoId);
          return evt?.organizadorId === orgId;
        });
        if (relPendentes.length === 0) return null;
        return (
          <div style={{ background: `${t.accent}10`, border: `1px solid ${t.accent}44`, borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: t.accent }}>REL</span>
              <div style={{ fontWeight: 700, color: t.accent, fontSize: 14 }}>
                {relPendentes.length} solicitação(ões) de relatório pendente(s)
              </div>
            </div>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr><Th>Solicitante</Th><Th>Tipo</Th><Th>Competição</Th><Th>Data</Th><Th>Ações</Th></tr></thead>
                <tbody>
                  {relPendentes.map(sol => (
                    <tr key={sol.id} style={s.tr}>
                      <Td><strong style={{ color: t.textPrimary }}>{sol.solicitanteNome}</strong></Td>
                      <Td><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: sol.solicitanteTipo === "atleta" ? `${t.accent}18` : `${t.success}18`, color: sol.solicitanteTipo === "atleta" ? t.accent : t.success }}>
                        {sol.solicitanteTipo === "atleta" ? "Atleta" : "Equipe"}
                      </span></Td>
                      <Td>{sol.eventoNome}</Td>
                      <Td style={{ fontSize: 11, color: t.textDimmed }}>
                        {new Date(sol.data).toLocaleString("pt-BR")}
                        {sol.assinaturaEquipe && (
                          <div style={{ marginTop:4 }}>
                            <span style={{ fontSize:9, color: t.textMuted }}>Assinatura anexada:</span>
                            <img src={sol.assinaturaEquipe} alt="" style={{ display:"block", maxHeight:28, maxWidth:80, objectFit:"contain", marginTop:2, borderRadius:3, border:"1px solid #333" }} />
                          </div>
                        )}
                      </Td>
                      <Td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => {
                            const evt = eventos.find(e => e.id === sol.eventoId);
                            if (!evt) return;
                            const atletasFiltrados = (sol.atletaIds || []).map(aid => atletas.find(a => a.id === aid)).filter(Boolean);
                            if (atletasFiltrados.length === 0) return;
                            const org = organizadores?.find(o => o.id === evt.organizadorId);
                            gerarHtmlRelatorioParticipacao(evt, atletasFiltrados, inscricoes, resultados || {}, equipes, org, relAssinatura || sol.assinaturaEquipe, numeracaoPeito);
                            resolverRelatorio(sol.id, "gerado");
                          }} style={{ background: `${t.accent}18`, border: "1px solid #2a6a6a", color: t.accent, borderRadius: 6, padding: "4px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Barlow', sans-serif" }}>
                            Gerar e Enviar
                          </button>
                          <button onClick={() => resolverRelatorio(sol.id, "recusado")}
                            style={{ background: `${t.danger}12`, border: `1px solid ${t.danger}66`, color: t.danger, borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12 }}>
                            ✗ Recusar
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ── Equipes Aguardando Aprovação ── */}
      {(() => {
        const meuOrgId = usuarioLogado?.tipo === "organizador" ? usuarioLogado?.id : usuarioLogado?.organizadorId;
        const pendentes = (solicitacoesEquipe||[]).filter(sol => sol.status === "pendente" && sol.organizadorId === meuOrgId);
        if (pendentes.length === 0) return null;
        return (
          <div style={{ background:`${t.accent}08`, border:`1px solid ${t.accent}33`, borderRadius:12, padding:"16px 20px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:800, color: t.textPrimary }}>{pendentes.length} equipe(s) aguardando aprovação</span>
            </div>
            {pendentes.map(sol => (
              <div key={sol.id} style={{ background:t.bgCardAlt, border:`1px solid ${t.borderInput}`, borderRadius:8, padding:14, marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                  <div>
                    <div style={{ color: t.textPrimary, fontWeight:700 }}>{sol.equipeNome} <span style={{ color: t.accent, fontSize:13 }}>({sol.equipeSigla})</span></div>
                    <div style={{ color: t.textMuted, fontSize:12 }}>{sol.equipeEmail} · CNPJ: {sol.equipeCnpj}</div>
                    <div style={{ color: t.textMuted, fontSize:12 }}>{sol.equipeCidade}/{sol.equipeUf}</div>
                  </div>
                  <div style={{ color: t.textDimmed, fontSize:11 }}>{new Date(sol.data).toLocaleDateString("pt-BR")}</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button style={{ background:`linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: t.textPrimary, border:"none", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:700, padding:"6px 16px" }}
                    onClick={() => aprovarEquipe?.(sol.equipeId, meuOrgId)}>✅ Aprovar</button>
                  <button style={{ background:`${t.danger}18`, color: t.danger, border:`1px solid ${t.danger}66`, borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:700, padding:"6px 16px" }}
                    onClick={() => recusarEquipe?.(sol.equipeId)}>❌ Recusar</button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Vínculos Pendentes ── */}
      {(() => {
        const meuOrgId = usuarioLogado?.tipo === "organizador" ? usuarioLogado?.id : usuarioLogado?.organizadorId;
        const minhasEquipesIds = new Set((equipes||[]).filter(e => e.organizadorId === meuOrgId).map(e => e.id));
        const pertenceAoOrg = (sol) =>
          sol.organizadorId === meuOrgId ||
          minhasEquipesIds.has(sol.equipeId) ||
          minhasEquipesIds.has(sol.equipeAtualId);
        const pendentes = (solicitacoesVinculo||[]).filter(sol =>
          sol.status === "pendente" && pertenceAoOrg(sol)
        );
        if (pendentes.length === 0 && !vinculoFeedback) return null;
        return (
          <div style={{ background:`${t.accent}10`, border:`1px solid ${t.accent}44`, borderRadius:12, padding:"16px 20px", marginBottom:16 }}>
            {vinculoFeedback && (
              <div style={{ background: vinculoFeedback.startsWith("✅") ? `${t.success}15` : `${t.danger}15`, border: `1px solid ${vinculoFeedback.startsWith("✅") ? t.success : t.danger}44`, borderRadius: 8, padding: "10px 16px", marginBottom: 12, fontSize: 13, fontWeight: 700, color: vinculoFeedback.startsWith("✅") ? t.success : t.danger }}>
                {vinculoFeedback}
              </div>
            )}
            {pendentes.length === 0 ? null : <>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <span style={{ fontWeight:700, color:t.accent, fontSize:14 }}>{pendentes.length} vínculo(s) pendente(s)</span>
            </div>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>
                  <Th>Atleta</Th><Th>Solicitante</Th><Th>Equipe de Origem</Th><Th>Equipe de Destino</Th><Th>Tipo</Th><Th>Data</Th><Th>Ação</Th>
                </tr></thead>
                <tbody>
                  {pendentes.map(sol => {
                    const equipeNova = equipes?.find(e => e.id === sol.equipeId);
                    return (
                      <tr key={sol.id} style={s.tr}>
                        <Td><strong style={{ color: t.textPrimary }}>{sol.atletaNome}</strong></Td>
                        <Td style={{ fontSize:12, color: t.textTertiary }}>{sol.solicitanteNome || equipeNova?.nome || sol.clube || "—"}</Td>
                        <Td style={{ fontSize:12, color:t.warning }}>{sol.equipeAtualNome || (sol.equipeAtualId ? (equipes?.find(eq => eq.id === sol.equipeAtualId)?.nome || "—") : "Sem equipe")}</Td>
                        <Td style={{ color:t.accent, fontSize:13 }}>{equipeNova?.nome || sol.clube || "—"}</Td>
                        <Td style={{ fontSize:11, color: t.textMuted }}>
                          {sol.aprovadorTipo === "equipe_atual" ? "Transferência" : "Vínculo novo"}
                        </Td>
                        <Td style={{ fontSize:11, color: t.textDimmed }}>{new Date(sol.data).toLocaleString("pt-BR")}</Td>
                        <Td>
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={() => handleResponderVinculo(sol.id, true)}
                              style={{ ...s.btnGhost, fontSize:12, padding:"4px 14px",
                                color:t.success, borderColor:`${t.success}66` }}>✓ Aceitar</button>
                            <button onClick={() => handleResponderVinculo(sol.id, false)}
                              style={{ ...s.btnGhost, fontSize:12, padding:"4px 12px",
                                color: t.danger, borderColor:`${t.danger}66` }}>✗ Recusar</button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>}
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════
          SEÇÃO 2: COMPETIÇÕES — Core operacional
         ═══════════════════════════════════════════════════════════════ */}

      <h2 style={s.sectionTitle}>Competições</h2>
      {meusEventos.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize:16, fontWeight:800, color: t.textDimmed }}>SEM COMPETIÇÕES</span>
          <p>Nenhum competição criado ainda.</p>
          {temPerm("editar_competições") &&
            <button style={s.btnPrimary} onClick={() => { selecionarEvento(null); setTela("novo-evento"); }}>Criar Competição</button>}
        </div>
      ) : (
        <div style={s.tableWrap}>
          <input type="text" value={buscaComp} onChange={e => setBuscaComp(e.target.value)} placeholder="Buscar competição..." style={{ ...s.input, padding:"6px 12px", fontSize:12, marginBottom:8, maxWidth:350 }} />
          <div style={{ maxHeight:320, overflowY:"auto" }}>
          <table style={s.table}>
            <thead><tr><Th>Competição</Th><Th>Data</Th><Th>Local</Th><Th>Inscrições</Th><Th>Status</Th><Th>Ações</Th></tr></thead>
            <tbody>
              {meusEventos.filter(ev => {
                if (!buscaComp) return true;
                const b = buscaComp.toLowerCase();
                return (ev.nome||"").toLowerCase().includes(b) || (_getLocalEventoDisplay(ev)||"").toLowerCase().includes(b);
              }).map(ev => {
                const nInsc = inscricoes.filter(i=>i.eventoId===ev.id).length;
                return (
                  <tr key={ev.id} style={s.tr}>
                    <Td><strong style={{ color: t.accent }}>{ev.nome}</strong></Td>
                    <Td>{new Date(ev.data+"T12:00:00").toLocaleDateString("pt-BR")}</Td>
                    <Td>{_getLocalEventoDisplay(ev)}</Td>
                    <Td><span style={s.marca}>{nInsc}</span></Td>
                    <Td>
                      {(() => {
                        const hoje = new Date().toISOString().slice(0,10);
                        const aindaNaoAbriu = ev.dataAberturaInscricoes && hoje < ev.dataAberturaInscricoes;
                        if (ev.inscricoesEncerradas && aindaNaoAbriu) return (
                          <span style={{ color: t.accent, fontSize:12, fontWeight:700 }}>
                            Em Breve
                          </span>
                        );
                        return (
                          <span style={{ color: ev.inscricoesEncerradas?t.danger:t.success, fontSize:12, fontWeight:700 }}>
                            {ev.inscricoesEncerradas ? "Encerradas" : "Abertas"}
                          </span>
                        );
                      })()}
                    </Td>
                    <Td>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {(temPerm("sumulas") || (ev.sumulaLiberada && usuarioLogado)) && (
                          <button style={{ ...s.btnSecondary, fontSize:12, padding:"4px 10px" }} onClick={()=>{ selecionarEvento(ev.id); setTela("sumulas"); }} title="Ver súmulas">
                            📋
                          </button>
                        )}
                        <button style={{ ...s.btnSecondary, fontSize:12, padding:"4px 10px" }} onClick={()=>{ selecionarEvento(ev.id); setTela("resultados"); }} title="Ver resultados">
                          🏆
                        </button>
                        <button style={{ ...s.btnGhost, fontSize:12, padding:"4px 10px" }} onClick={()=>{ selecionarEvento(ev.id); setTela("evento-detalhe"); }}>Abrir</button>
                        {temPerm("editar_competições") && (
                          <button style={{ ...s.btnGhost, fontSize:12, padding:"4px 10px", color:t.accent, borderColor:`${t.accent}66` }}
                            onClick={()=>{ selecionarEvento(ev.id); setTela("novo-evento"); }}>
                            Editar
                          </button>
                        )}
                        {temPerm("inscrições") && (() => {
                          const agora = new Date();
                          const hoje = agora.toISOString().slice(0,10);
                          const aindaNaoAbriu = ev.dataAberturaInscricoes && hoje < ev.dataAberturaInscricoes;
                          if (aindaNaoAbriu) return null;
                          const dtEnc = ev.dataEncerramentoInscricoes
                            ? new Date(ev.dataEncerramentoInscricoes + "T23:59:59")
                            : null;
                          if (!ev.inscricoesEncerradas) {
                            // Só mostrar Encerrar quando abertas
                            if (dtEnc && agora < dtEnc) return null; // encerramento programado, não precisa do botão
                            return (
                              <button style={{ ...s.btnGhost, fontSize:12, padding:"4px 10px", color: t.danger, borderColor:`${t.danger}66` }}
                                onClick={()=>alterarStatusEvento(ev.id,{inscricoesEncerradas:true,inscricoesForceEncerradas:true,inscricoesForceAbertas:false})}>
                                🔴 Encerrar
                              </button>
                            );
                          } else {
                            // Só mostrar Reabrir quando fechadas
                            if (dtEnc && agora >= dtEnc) return null; // prazo vencido, não pode reabrir manualmente
                            return (
                              <button style={{ ...s.btnGhost, fontSize:12, padding:"4px 10px", color: t.success, borderColor:`${t.success}66` }}
                                onClick={()=>alterarStatusEvento(ev.id,{inscricoesEncerradas:false,inscricoesForceAbertas:true,inscricoesForceEncerradas:false,sumulaLiberada:false})}>
                                🟢 Reabrir
                              </button>
                            );
                          }
                        })()}
                        {temPerm("sumulas") && (
                          <button style={{ ...s.btnGhost, fontSize:12, padding:"4px 10px", color: t.accent, borderColor:`${t.accent}66` }}
                            onClick={()=>alterarStatusEvento(ev.id,{sumulaLiberada:!ev.sumulaLiberada})}>
                            {ev.sumulaLiberada ? "Restringir" : "Liberar Súmula"}
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ── Competições Cruzadas: eventos de outros orgs onde somos autorizados ── */}
      {!isFuncionario && (() => {
        const eventosCruzados = eventos.filter(e =>
          Array.isArray(e.orgsAutorizadas) &&
          e.orgsAutorizadas.includes(orgId) &&
          e.organizadorId !== orgId
        );
        return (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ ...s.sectionTitle, marginBottom: 16, display:"flex", alignItems:"center", gap:10 }}>
              Competições Cruzadas
              {eventosCruzados.length > 0 && (
                <span style={{ background:`${t.accent}22`, color:t.accent, border:`1px solid ${t.accent}44`,
                  borderRadius:20, padding:"2px 10px", fontSize:12, fontWeight:700 }}>
                  {eventosCruzados.length}
                </span>
              )}
            </h2>
            <div style={{ background:`${t.accent}08`, border:`1px solid ${t.accent}33`, borderRadius:10,
              padding:"12px 18px", marginBottom:16, fontSize:13, color:t.accent, lineHeight:1.6 }}>
              Competições de <strong>outros organizadores</strong> que autorizaram a participação dos seus atletas.
              Você pode visualizar resultados e inscrever atletas nessas competições.
            </div>
            {eventosCruzados.length === 0 ? (
              <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:10,
                padding:"36px 20px", textAlign:"center" }}>
                <div style={{ fontSize:14, fontWeight:800, color:t.textDimmed, marginBottom:10 }}>NENHUMA</div>
                <div style={{ color: t.textDimmed, fontSize:14, marginBottom:6 }}>Nenhuma competição cruzada disponível no momento.</div>
                <div style={{ fontSize:12, color:t.textDisabled, lineHeight:1.7 }}>
                  Quando um administrador autorizar sua organização a participar de outra competição, ela aparecerá aqui.
                </div>
              </div>
            ) : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead><tr>
                    <Th>Competição</Th><Th>Organizador</Th><Th>Data</Th><Th>Local</Th>
                    <Th>Seus Atletas</Th><Th>Inscrições</Th><Th>Ações</Th>
                  </tr></thead>
                  <tbody>
                    {eventosCruzados.map(ev => {
                      const orgDoEvento = (organizadores||[]).find(o => o.id === ev.organizadorId);
                      const inscsEvento = inscricoes.filter(i => i.eventoId === ev.id);
                      const seusAtletas = inscsEvento.filter(i =>
                        i.organizadorOrigem === orgId ||
                        (i.participacaoCruzada && atletas.find(a => a.id === i.atletaId)?.organizadorId === orgId)
                      );
                      return (
                        <tr key={ev.id} style={s.tr}>
                          <Td><strong style={{ color: t.accent }}>{ev.nome}</strong></Td>
                          <Td><span style={{ color:t.accent, fontSize:12 }}>
                            {orgDoEvento?.entidade || orgDoEvento?.nome || "—"}
                          </span></Td>
                          <Td>{new Date(ev.data+"T12:00:00").toLocaleDateString("pt-BR")}</Td>
                          <Td>{_getLocalEventoDisplay(ev)}</Td>
                          <Td>
                            <span style={{ fontFamily:"'Barlow Condensed', sans-serif",
                              fontSize:18, fontWeight:800, color: seusAtletas.length > 0 ? t.accent : t.textDisabled }}>
                              {seusAtletas.length}
                            </span>
                          </Td>
                          <Td>
                            <span style={{ color: ev.inscricoesEncerradas ? t.danger : t.success,
                              fontSize:12, fontWeight:700 }}>
                              {ev.inscricoesEncerradas ? "Encerradas" : "Abertas"}
                            </span>
                          </Td>
                          <Td>
                            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                              {!ev.inscricoesEncerradas && (
                                <button style={{ ...s.btnPrimary, fontSize:12, padding:"4px 10px" }}
                                  onClick={() => { selecionarEvento(ev.id); setTela("inscricao-avulsa"); }}>
                                  + Inscrever
                                </button>
                              )}
                              <button style={{ ...s.btnSecondary, fontSize:12, padding:"4px 10px" }}
                                onClick={() => { selecionarEvento(ev.id); setTela("resultados"); }}>
                                🏆 Resultados
                              </button>
                              <button style={{ ...s.btnGhost, fontSize:12, padding:"4px 10px" }}
                                onClick={() => { selecionarEvento(ev.id); setTela("evento-detalhe"); }}>
                                Abrir
                              </button>
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════
          SEÇÃO 3: FERRAMENTAS — Colapsáveis, uso menos frequente
         ═══════════════════════════════════════════════════════════════ */}

      {/* ── Gerar Relatório de Participação ── */}
      {temPerm("inscricoes") && meusEventos.length > 0 && (
        <details style={{ background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
          <summary style={{ cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 800, color: t.accent, letterSpacing: 1 }}>
            Relatório Oficial de Participação
          </summary>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14, alignItems: "flex-end" }}>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:600, color: t.textMuted, letterSpacing:1, marginBottom:4, textTransform:"uppercase" }}>Competição</label>
                <select value={relEvento} onChange={e => { setRelEvento(e.target.value); setRelAtletasSel([]); setRelEquipeId(""); }}
                  style={s.select}>
                  <option value="">— Selecione —</option>
                  {meusEventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nome}</option>)}
                </select>
              </div>
              {relEvento && (
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:600, color: t.textMuted, letterSpacing:1, marginBottom:4, textTransform:"uppercase" }}>Filtrar por</label>
                  <select value={relFiltro} onChange={e => { setRelFiltro(e.target.value); setRelAtletasSel([]); setRelEquipeId(""); }}
                    style={s.select}>
                    <option value="todos">Todos os atletas</option>
                    <option value="equipe">Por equipe</option>
                    <option value="atleta">Por atleta</option>
                  </select>
                </div>
              )}
              {relEvento && relFiltro === "equipe" && (() => {
                const inscsEv = (inscricoes || []).filter(i => i.eventoId === relEvento);
                const eqIds = [...new Set(inscsEv.map(i => {
                  const at = atletas.find(a => a.id === i.atletaId);
                  return at?.equipeId;
                }).filter(Boolean))];
                const eqsComInsc = eqIds.map(eid => equipes.find(e => e.id === eid)).filter(Boolean);
                return (
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, color: t.textMuted, letterSpacing:1, marginBottom:4, textTransform:"uppercase" }}>Equipe</label>
                    <select value={relEquipeId} onChange={e => setRelEquipeId(e.target.value)} style={s.select}>
                      <option value="">— Selecione —</option>
                      {eqsComInsc.map(eq => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}
                    </select>
                  </div>
                );
              })()}
              {relEvento && relFiltro === "atleta" && (
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:600, color: t.textMuted, letterSpacing:1, marginBottom:4, textTransform:"uppercase" }}>Buscar atleta</label>
                  <input type="text" value={relBuscaAtl} onChange={e => setRelBuscaAtl(e.target.value)}
                    placeholder="Nome do atleta..." style={{ ...s.select, minWidth: 200 }} />
                </div>
              )}
            </div>
            {relEvento && relFiltro === "atleta" && relBuscaAtl.length >= 2 && (() => {
              const inscsEv = (inscricoes || []).filter(i => i.eventoId === relEvento);
              const atletaIdsEv = [...new Set(inscsEv.map(i => i.atletaId))];
              const encontrados = atletaIdsEv
                .map(aid => atletas.find(a => a.id === aid))
                .filter(a => a && a.nome.toLowerCase().includes(relBuscaAtl.toLowerCase()))
                .slice(0, 20);
              return encontrados.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {encontrados.map(a => {
                    const sel = relAtletasSel.includes(a.id);
                    return (
                      <button key={a.id} onClick={() => setRelAtletasSel(p => sel ? p.filter(x => x !== a.id) : [...p, a.id])}
                        style={{ background: sel ? `${t.accent}18` : t.bgHeaderSolid, border: `1px solid ${sel ? `${t.accent}66` : t.borderInput}`, color: sel ? t.accent : t.textMuted, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontFamily: "'Barlow', sans-serif" }}>
                        {sel ? "✓ " : ""}{a.nome}
                      </button>
                    );
                  })}
                </div>
              ) : null;
            })()}
            {relAtletasSel.length > 0 && relFiltro === "atleta" && (
              <div style={{ fontSize: 11, color: t.accent, marginBottom: 10 }}>{relAtletasSel.length} atleta(s) selecionado(s)</div>
            )}
            {/* Upload de assinatura */}
            <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "12px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, marginBottom: 8 }}>ASSINATURA DO ORGANIZADOR (opcional)</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <label style={{ background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, color: t.textTertiary }}>
                  📁 Selecionar imagem
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setRelAssinatura(ev.target.result);
                    reader.readAsDataURL(file);
                  }} />
                </label>
                {relAssinatura && (
                  <>
                    <img src={relAssinatura} alt="Assinatura" style={{ maxHeight: 48, maxWidth: 160, objectFit: "contain" }} />
                    <button onClick={() => setRelAssinatura("")} style={{ background: "none", border: "none", color: t.danger, cursor: "pointer", fontSize: 11 }}>✕ Remover</button>
                  </>
                )}
                {!relAssinatura && <span style={{ fontSize: 11, color: t.textDimmed }}>PNG com fundo transparente recomendado</span>}
              </div>
            </div>
            <button disabled={!relEvento} onClick={() => {
              const evt = eventos.find(e => e.id === relEvento);
              if (!evt) return;
              const inscsEv = (inscricoes || []).filter(i => i.eventoId === relEvento);
              let atletaIds;
              if (relFiltro === "equipe" && relEquipeId) {
                atletaIds = [...new Set(inscsEv.map(i => i.atletaId).filter(aid => {
                  const at = atletas.find(a => a.id === aid);
                  return at?.equipeId === relEquipeId;
                }))];
              } else if (relFiltro === "atleta" && relAtletasSel.length > 0) {
                atletaIds = relAtletasSel;
              } else {
                atletaIds = [...new Set(inscsEv.map(i => i.atletaId))];
              }
              const atletasFiltrados = atletaIds.map(aid => atletas.find(a => a.id === aid)).filter(Boolean);
              if (atletasFiltrados.length === 0) { alert("Nenhum atleta encontrado para os filtros selecionados."); return; }
              const org = organizadores?.find(o => o.id === evt.organizadorId);
              gerarHtmlRelatorioParticipacao(evt, atletasFiltrados, inscricoes, resultados || {}, equipes, org, relAssinatura, numeracaoPeito);
            }} style={{ background: relEvento ? `linear-gradient(135deg, ${t.accent}, ${t.accentDark})` : "#222", color: relEvento ? "#fff" : "#555", border: "none", padding: "10px 24px", borderRadius: 8, cursor: relEvento ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>
              Gerar Relatório
            </button>
          </div>
        </details>
      )}

      {/* ── Histórico de Relatórios ── */}
      {temPerm("inscricoes") && (() => {
        const relHistorico = (solicitacoesRelatorio || []).filter(sol => {
          if (sol.status === "pendente") return false;
          const evt = eventos.find(e => e.id === sol.eventoId);
          return evt?.organizadorId === orgId;
        }).sort((a, b) => new Date(b.resolvidoEm || b.data) - new Date(a.resolvidoEm || a.data)).slice(0, 20);
        if (relHistorico.length === 0) return null;
        return (
          <details style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 18px", marginBottom: 16 }}>
            <summary style={{ cursor: "pointer", color: t.textDimmed, fontSize: 13, fontWeight: 600 }}>
              Histórico de relatórios ({relHistorico.length})
            </summary>
            <div style={{ marginTop: 12, overflowX: "auto" }}>
              <table style={s.table}>
                <thead><tr><Th>Solicitante</Th><Th>Competição</Th><Th>Status</Th><Th>Data</Th><Th>Ações</Th></tr></thead>
                <tbody>
                  {relHistorico.map(sol => {
                    const cor = sol.status === "gerado" ? t.success : sol.status === "cancelado" ? t.textMuted : t.danger;
                    const label = { gerado: "Gerado", recusado: "Recusado", cancelado: "Cancelado" }[sol.status] || sol.status;
                    return (
                      <tr key={sol.id} style={s.tr}>
                        <Td><strong style={{ color: t.textPrimary }}>{sol.solicitanteNome}</strong></Td>
                        <Td>{sol.eventoNome}</Td>
                        <Td><span style={{ background: cor + "22", color: cor, border: `1px solid ${cor}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                          {label}
                        </span></Td>
                        <Td style={{ fontSize: 11, color: t.textDimmed }}>{sol.resolvidoEm ? new Date(sol.resolvidoEm).toLocaleString("pt-BR") : "—"}</Td>
                        <Td>
                          {excluirRelatorio && (
                            <button onClick={() => excluirRelatorio(sol.id)}
                              style={{ background:"transparent", border:`1px solid ${t.danger}66`, borderRadius:4, color:t.danger, fontSize:10, padding:"3px 10px", cursor:"pointer" }}>
                              Excluir
                            </button>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        );
      })()}

      {/* ── Auditoria de Ações ── */}
      {!isFuncionario && (() => {
        const POR_PAG = 10;
        const auditoriaOrg = (historicoAcoes || [])
          .filter(a => a.organizadorId === orgId)
          .sort((a, b) => new Date(b.data) - new Date(a.data));
        if (auditoriaOrg.length === 0) return null;
        const totalPags = Math.ceil(auditoriaOrg.length / POR_PAG);
        const pag = Math.min(auditPagina, totalPags);
        const pagina = auditoriaOrg.slice((pag - 1) * POR_PAG, pag * POR_PAG);
        const getModuloIcon = (mod) => ({ equipes:"EQ", atletas:"AT", competicoes:"CP", inscricoes:"IN", resultados:"RS", sumulas:"SM", recordes:"RC", numeracao:"NR", membros:"MB", treinadores:"TR", funcionarios:"FN", auth:"AU", sistema:"SI", secretaria:"SC" }[mod] || mod?.toUpperCase()?.slice(0,2) || "—");
        const formatarDt = (ts) => {
          const d = new Date(ts);
          const hoje = new Date();
          const hora = d.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" });
          if (d.toDateString() === hoje.toDateString()) return `Hoje ${hora}`;
          const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
          if (d.toDateString() === ontem.toDateString()) return `Ontem ${hora}`;
          return `${d.toLocaleDateString("pt-BR")} ${hora}`;
        };
        return (
          <details style={{ marginTop: 32 }}>
            <summary style={{ ...s.sectionTitle, cursor: "pointer", userSelect: "none" }}>
              Auditoria de Ações ({auditoriaOrg.length})
            </summary>
            <p style={{ color: t.textDimmed, fontSize: 13, marginBottom: 16 }}>
              Ações realizadas por você e seus funcionários
            </p>
            <div style={{ display: "grid", gap: 6 }}>
              {pagina.map(reg => (
                <div key={reg.id} style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 14px", display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{getModuloIcon(reg.modulo)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: t.textPrimary, fontSize: 13, fontWeight: 600 }}>{reg.acao}</div>
                    {reg.detalhe && <div style={{ color: t.textMuted, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{reg.detalhe}</div>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ color: t.accent, fontSize: 11, fontWeight: 600 }}>{reg.nomeUsuario || "—"}</div>
                    <div style={{ color: t.textDimmed, fontSize: 10 }}>{formatarDt(reg.data)}</div>
                  </div>
                  {reg.metodo === "qr" && <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, background: t.accent + "18", color: t.accent, border: `1px solid ${t.accent}44`, flexShrink: 0 }}>QR</span>}
                  {reg.modulo && <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, background: t.bgInput, color: t.textDimmed, border: `1px solid ${t.border}`, flexShrink: 0 }}>{reg.modulo}</span>}
                </div>
              ))}
            </div>
            {totalPags > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 14 }}>
                <button disabled={pag <= 1} onClick={() => setAuditPagina(pag - 1)} style={{ background: t.bgInput, border: `1px solid ${t.borderInput}`, color: pag <= 1 ? t.textDisabled : t.textSecondary, borderRadius: 6, padding: "6px 14px", cursor: pag <= 1 ? "default" : "pointer", fontSize: 13 }}>Anterior</button>
                <span style={{ color: t.textMuted, fontSize: 12 }}>{pag} / {totalPags}</span>
                <button disabled={pag >= totalPags} onClick={() => setAuditPagina(pag + 1)} style={{ background: t.bgInput, border: `1px solid ${t.borderInput}`, color: pag >= totalPags ? t.textDisabled : t.textSecondary, borderRadius: 6, padding: "6px 14px", cursor: pag >= totalPags ? "default" : "pointer", fontSize: 13 }}>Próxima</button>
              </div>
            )}
            <div style={{ marginTop: 12, padding: 12, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 8, textAlign: "center", color: t.textDimmed, fontSize: 11 }}>
              {auditoriaOrg.length} registro(s) · Página {pag} de {totalPags}
            </div>
          </details>
        );
      })()}

      {/* ── Histórico de Vínculos ── */}
      {temPerm("inscricoes") && (() => {
        const meuOrgId = usuarioLogado?.tipo === "organizador" ? usuarioLogado?.id : usuarioLogado?.organizadorId;
        const minhasEquipesIds = new Set((equipes||[]).filter(e => e.organizadorId === meuOrgId).map(e => e.id));
        const pertenceAoOrg = (sol) =>
          sol.organizadorId === meuOrgId ||
          minhasEquipesIds.has(sol.equipeId) ||
          minhasEquipesIds.has(sol.equipeAtualId);
        const historico = (solicitacoesVinculo||[]).filter(sol =>
          sol.status !== "pendente" && pertenceAoOrg(sol)
        ).sort((a,b) => new Date(b.resolvidoEm||b.data) - new Date(a.resolvidoEm||a.data)).slice(0,30);
        if (historico.length === 0) return null;
        return (
          <details style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:10, padding:"12px 18px", marginBottom:16 }}>
            <summary style={{ cursor:"pointer", color: t.textDimmed, fontSize:13, fontWeight:600 }}>
              Histórico de vínculos ({historico.length})
            </summary>
            <div style={{ marginTop:12, overflowX:"auto" }}>
              <table style={s.table}>
                <thead><tr>
                  <Th>Atleta</Th><Th>Solicitante</Th><Th>Equipe de Origem</Th><Th>Equipe de Destino</Th><Th>Status</Th><Th>Resolvido por</Th><Th>Data</Th>
                </tr></thead>
                <tbody>
                  {historico.map(sol => {
                    const statusColor = sol.status === "aceito" ? t.success : t.danger;
                    const equipeNova = equipes?.find(e => e.id === sol.equipeId);
                    return (
                      <tr key={sol.id} style={s.tr}>
                        <Td><strong style={{ color: t.textPrimary }}>{sol.atletaNome}</strong></Td>
                        <Td style={{ fontSize:12, color: t.textTertiary }}>{sol.solicitanteNome || equipeNova?.nome || sol.clube || "—"}</Td>
                        <Td style={{ fontSize:12, color:t.warning }}>{sol.equipeAtualNome || (sol.equipeAtualId ? (equipes?.find(eq => eq.id === sol.equipeAtualId)?.nome || "—") : "Sem equipe")}</Td>
                        <Td style={{ fontSize:12, color:t.accent }}>{equipeNova?.nome || sol.clube || "—"}</Td>
                        <Td>
                          <span style={{ background:statusColor+"22", color:statusColor,
                            border:`1px solid ${statusColor}44`, borderRadius:4,
                            padding:"2px 8px", fontSize:11, fontWeight:700 }}>
                            {sol.status === "aceito" ? "✓ Aceito" : "✗ Recusado"}
                          </span>
                        </Td>
                        <Td style={{ fontSize:11, color: t.textMuted }}>
                          {sol.resolvidoPorNome || "—"} {sol.resolvidoPorTipo ? `(${sol.resolvidoPorTipo})` : ""}
                        </Td>
                        <Td style={{ fontSize:10, color: t.textDimmed, lineHeight: 1.6 }}>
                          <div>Solicitado: {new Date(sol.data).toLocaleString("pt-BR")}</div>
                          {sol.resolvidoEm && <div>Resolvido: {new Date(sol.resolvidoEm).toLocaleString("pt-BR")}</div>}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        );
      })()}

    </div>
  );
}

export default TelaPainelOrganizador;
