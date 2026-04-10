import { usePagination, PaginaControles } from "../../lib/hooks/usePagination.jsx";
import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { CATEGORIAS } from "../../shared/constants/categorias";
import { Th, Td } from "../ui/TableHelpers";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";

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
  btnSecondary: { background: "transparent", color: t.accent, border: `2px solid ${t.accent}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost: { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  btnIconSm: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textMuted, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: t.bgCardAlt, border: `1px solid ${t.danger}33`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
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
  savedBadge: { background: t.bgCardAlt, border: `1px solid ${t.success}66`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  digitarDica: { color: t.textDimmed, fontSize: 12 },
  inputMarca: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", color: t.accent, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
  infoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: t.accent, marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: `1px solid ${t.border}`, fontSize: 14, color: t.textSecondary, display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: t.accent, fontWeight: 700 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: "linear-gradient(180deg, #0D1018 0%, transparent 100%)", borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: t.accent, color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, color: t.textPrimary, lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: t.textDimmed },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: t.textMuted, flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? `${t.danger}15` : status === "hoje_pre" ? `${t.accent}15` : status === "futuro" ? `${t.success}15` : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textDimmed,
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
  permissividadeTag: (ativo) => ({ display: "inline-block", background: ativo ? `${t.success}15` : t.bgCard, border: `1px solid ${ativo ? `${t.success}66` : t.border}`, color: ativo ? t.success : t.textDimmed, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600 }),
  permissividadeAlert: { display: "flex", gap: 14, alignItems: "flex-start", background: t.bgCardAlt, border: `1px solid ${t.success}66`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 },
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

function TelaGerenciarInscricoes() {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { usuarioLogado } = useAuth();
  const { atletas, inscricoes, eventos, eventoAtual, equipes, excluirInscricao, atualizarInscricao } = useEvento();
  const { setTela, organizadores } = useApp();
  const confirmar = useConfirm();

  const isAdmin   = usuarioLogado?.tipo === "admin";
  const isOrg     = usuarioLogado?.tipo === "organizador";
  const isFunc    = usuarioLogado?.tipo === "funcionario";
  const isTreinador = usuarioLogado?.tipo === "treinador";
  const treinPerms = usuarioLogado?.permissoes || [];
  const isTrein   = usuarioLogado?.tipo === "equipe" || (isTreinador && (treinPerms.includes("inscrever_atletas") || treinPerms.includes("gerenciar_inscricoes")));
  const isAtleta  = usuarioLogado?.tipo === "atleta";
  // isDono: admin ou org/func da competição selecionada
  const isDono    = isAdmin
    || (isOrg && eventoAtual?.organizadorId === usuarioLogado?.id)
    || (isFunc && eventoAtual?.organizadorId === usuarioLogado?.organizadorId);
  // Amplo = dono|func(permissão): pode editar/excluir sempre
  const funcPerm  = usuarioLogado?.permissoes || [];
  const isAmplo   = isDono || (isFunc && isDono && (funcPerm.includes("atletas") || funcPerm.includes("inscricoes")));

  const [filtroEvento, setFiltroEvento] = useState(eventoAtual?.id || "");
  const [filtroAtleta, setFiltroAtleta] = useState("");
  const [editandoId,   setEditandoId]   = useState(null);
  const [editForm,     setEditForm]     = useState(null);
  const [confirmId,    setConfirmId]    = useState(null);
  const todasProvas = todasAsProvas();

  // Inscrições visíveis conforme perfil
  const inscVisiveis = inscricoes.filter(i => {
    if (filtroEvento && i.eventoId !== filtroEvento) return false;
    if (filtroAtleta && i.atletaId !== filtroAtleta) return false;
    if (isAtleta) {
      const meuAtleta = atletas.find(a =>
        (a.atletaUsuarioId && a.atletaUsuarioId === usuarioLogado.id) ||
        (a.cpf && usuarioLogado.cpf &&
          a.cpf.replace(/\D/g,"") === usuarioLogado.cpf.replace(/\D/g,"")));
      return meuAtleta ? i.atletaId === meuAtleta.id : false;
    }
    if (isTrein) {
      const eqId = usuarioLogado?.tipo === "treinador" ? usuarioLogado.equipeId : usuarioLogado.id;
      const atl = atletas.find(a => a.id === i.atletaId);
      return atl?.equipeId === eqId;
    }
    return true; // admin, org, func veem tudo
  });

  // Atletas para filtro
  const equipeIdFiltro = isTrein ? (usuarioLogado?.tipo === "treinador" ? usuarioLogado.equipeId : usuarioLogado.id) : null;
  const atletasDisponiveis = isAtleta
    ? atletas.filter(a =>
        (a.atletaUsuarioId && a.atletaUsuarioId === usuarioLogado.id) ||
        (a.cpf && usuarioLogado.cpf &&
          a.cpf.replace(/\D/g,"") === usuarioLogado.cpf.replace(/\D/g,"")))
    : isTrein
    ? atletas.filter(a => a.equipeId === equipeIdFiltro)
    : atletas;

  const iniciarEdicao = (insc) => {
    setEditandoId(insc.id);
    setEditForm({ ...insc });
  };
  const salvarEdicao = () => {
    atualizarInscricao(editForm);
    setEditandoId(null);
    setEditForm(null);
  };
  const cancelarEdicao = () => { setEditandoId(null); setEditForm(null); };

  const voltarTela = () => setTela(
    isAtleta ? "painel-atleta" :
    isTrein  ? "painel" :
    isOrg    ? "painel-organizador" :
    isFunc   ? "painel-organizador" : "admin"
  );

  // Guard: funcionário sem permissão não pode gerenciar inscrições
  if (isFunc && !isAmplo) return (
    <div style={s.page}><div style={s.emptyState}>
      <span style={{ fontSize: 48 }}>🚫</span>
      <p style={{ color: t.danger, fontWeight: 700 }}>Permissão insuficiente</p>
      <p style={{ color: t.textDimmed, fontSize: 14 }}>Você não tem permissão para gerenciar inscrições.</p>
      <button style={s.btnGhost} onClick={() => setTela("painel-organizador")}>← Voltar</button>
    </div></div>
  );


  // ── Paginação inscrições ───────────────────────────────────────────────────
  const inscricoesFiltradas = inscVisiveis.filter(i => i.tipo !== "revezamento");


  // ── Paginação inscrições agrupadas por atleta ──────────────────────────────
  const _gruposChave = (i) => filtroEvento ? i.atletaId : `${i.atletaId}_${i.eventoId}`;
  const _gruposMap = {};
  inscricoesFiltradas.forEach(i => {
    const k = _gruposChave(i);
    if (!_gruposMap[k]) _gruposMap[k] = [];
    _gruposMap[k].push(i);
  });
  const _gruposArr = Object.values(_gruposMap);
  const { paginado: gruposPag, infoPage: inscsInfo } = usePagination(_gruposArr, 10);


  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>✍️ Gerenciar Inscrições</h1>
          <p style={{ color: t.textTertiary, margin:"4px 0 0", fontSize:13 }}>
            {isAmplo ? "Acesso amplo — todas as inscrições de todos os eventos" :
             isAtleta ? "Suas inscrições" : "Inscrições dos seus atletas"}
          </p>
        </div>
        <button style={s.btnGhost} onClick={voltarTela}>← Voltar</button>
      </div>

      {/* Filtros */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:16 }}>
        <div style={{ flex:1, minWidth:200 }}>
          <label style={s.label}>Competição</label>
          <select style={s.select} value={filtroEvento}
            onChange={e => setFiltroEvento(e.target.value)}>
            <option value="">Todas as competições</option>
            {eventos.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.nome}</option>
            ))}
          </select>
        </div>
        {!isAtleta && (
          <div style={{ flex:1, minWidth:200 }}>
            <label style={s.label}>Atleta</label>
            <select style={s.select} value={filtroAtleta}
              onChange={e => setFiltroAtleta(e.target.value)}>
              <option value="">Todos os atletas</option>
              {(() => {
                // Só atletas inscritos na competição selecionada (ou em qualquer competição)
                const inscsRef = filtroEvento ? inscricoes.filter(i => i.eventoId === filtroEvento && i.tipo !== "revezamento") : inscricoes.filter(i => i.tipo !== "revezamento");
                const idsInscritos = [...new Set(inscsRef.map(i => i.atletaId))];
                return idsInscritos
                  .map(id => atletasDisponiveis.find(a => a.id === id))
                  .filter(Boolean)
                  .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""))
                  .map(a => <option key={a.id} value={a.id}>{a.nome}</option>);
              })()}
            </select>
          </div>
        )}
      </div>

      {inscVisiveis.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize:48 }}>✍️</span>
          <p>Nenhuma inscrição encontrada.</p>
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr>
              <Th>Atleta</Th>
              {!filtroEvento && <Th>Competição</Th>}
              <Th>Provas Inscritas</Th>
              <Th>Categoria</Th>
              <Th>Sexo</Th>
              {!isAtleta && <Th>Inscrito por</Th>}
              <Th>Ações</Th>
            </tr></thead>
            <tbody>
              {(() => {
                // Usar grupos pré-calculados com paginação
                return gruposPag.map(inscs => {
                  const first = inscs[0];
                  const atleta = atletas.find(a => a.id === first.atletaId);
                  const ev = eventos.find(e => e.id === first.eventoId);
                  const inscAberta = ev && !ev.inscricoesEncerradas;
                  const podeAlt = isAmplo || inscAberta;

                  return (
                    <tr key={inscs.map(i=>i.id).join(",")} style={s.tr}>
                      <Td>
                        <strong style={{color: t.textPrimary}}>{atleta?.nome || "—"}</strong>
                        {/* ── Etapa 5: badge participação cruzada ── */}
                        {first.participacaoCruzada && (() => {
                          const orgNome = (() => {
                            const atl = atletas.find(a => a.id === first.atletaId);
                            const org = atl?.organizadorId ? organizadores.find(o => o.id === atl.organizadorId) : null;
                            return org?.entidade || org?.nome || null;
                          })();
                          return (
                            <span title={orgNome ? `Participação cruzada — org. de origem: ${orgNome}` : "Participação cruzada — org. de origem preservada"}
                              style={{ marginLeft:6, fontSize:10, color: t.accent,
                                background: t.accentBg, border:`1px solid ${t.accentBorder}`,
                                padding:"1px 6px", borderRadius:8, cursor: "help" }}>
                              🤝 cruzado{orgNome ? ` · ${orgNome}` : ""}
                            </span>
                          );
                        })()}
                      </Td>
                      {!filtroEvento && <Td style={{fontSize:12,color: t.accent}}>{ev?.nome || "—"}</Td>}
                      <Td>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                          {inscs.filter(i => !i.combinadaId).map(i => {
                            const prova = todasProvas.find(p => p.id === i.provaId);
                            return (
                              <span key={i.id} style={{
                                display:"inline-flex", alignItems:"center", gap:4,
                                padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:600,
                                background:t.bgCardAlt, border:`1px solid ${t.border}`, color: t.textSecondary,
                              }}>
                                {prova?.nome || i.provaId}
                                {podeAlt && (
                                  <button onClick={async () => { 
                                    if (await confirmar(`Remover ${atleta?.nome || "atleta" } de ${prova?.nome || i.provaId}?`)) {
                                      excluirInscricao(i.id, { confirmado: true });
                                    }
                                  }}
                                    style={{ background:"none", border:"none", cursor:"pointer", color: t.danger, fontSize:10, padding:"0 2px", lineHeight:1 }}
                                    title={`Remover de ${prova?.nome}`}>✕</button>
                                )}
                              </span>
                            );
                          })}
                        </div>
                        <div style={{ fontSize:11, color: t.textDimmed, marginTop:4 }}>{inscs.filter(i => !i.combinadaId).length} prova(s)</div>
                      </Td>
                      <Td>
                        <span style={s.badgeGold}>{first.categoriaOficial || first.categoria || "—"}</span>
                        {first.permissividade && (
                          <sup style={{color: t.accent,fontSize:9,marginLeft:2}} title={first.permissividade}>*</sup>
                        )}
                      </Td>
                      <Td>
                        <span style={s.badge(first.sexo==="M"?"#1a6ef5":"#e54f9b")}>
                          {first.sexo==="M"?"Masc":"Fem"}
                        </span>
                      </Td>
                      {!isAtleta && (
                        <Td>
                          <div style={{fontSize:11}}>
                            <span style={{color: first.inscritoPorTipo === "atleta" ? t.success : first.inscritoPorTipo === "treinador" ? t.accent : t.accent}}>
                              {first.inscritoPorTipo === "atleta" ? "🏃" : first.inscritoPorTipo === "treinador" ? "👨‍🏫" : first.inscritoPorTipo === "equipe" ? "🎽" : first.inscritoPorTipo === "admin" ? "⚙️" : first.inscritoPorTipo === "organizador" ? "🏟️" : "—"}
                              {" "}{first.inscritoPorNome || (first.origemAtleta ? "Atleta" : "Equipe")}
                            </span>
                          </div>
                        </Td>
                      )}
                      <Td>
                        {podeAlt ? (
                          <button onClick={async () => { 
                            if (await confirmar(`Remover TODAS as ${inscs.length } inscrições de ${atleta?.nome || "atleta"}?`)) {
                              inscs.forEach(i => excluirInscricao(i.id, { confirmado: true }));
                            }
                          }}
                            style={{...s.btnGhost,fontSize:11,padding:"3px 8px",color: t.danger,borderColor:`${t.danger}44`}}>
                            🗑️ Todas
                          </button>
                        ) : (
                          <span style={{color: t.textDisabled,fontSize:11}}>Encerrada</span>
                        )}
                      </Td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
          <PaginaControles {...inscsInfo} />
        </div>
      )}

      <div style={{marginTop:8,color: t.textDimmed,fontSize:12}}>
        {inscricoesFiltradas.length} inscrição(ões) de {[...new Set(inscVisiveis.filter(i => i.tipo !== "revezamento").map(i => i.atletaId))].length} atleta(s)
        {!isAmplo && " · Editar/excluir disponível apenas enquanto inscrições estiverem abertas"}
      </div>
    </div>
  );
}



export default TelaGerenciarInscricoes;
