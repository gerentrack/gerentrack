import { usePagination, PaginaControles } from "../../lib/hooks/usePagination.jsx";
import React, { useState, useMemo } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { getCategoria, getPermissividade, podeCategoriaSuperior } from "../../shared/constants/categorias";
import { _getClubeAtleta, _getCbat } from "../../shared/formatters/utils";
import { CombinedEventEngine } from "../../shared/engines/combinedEventEngine";
import { calcularPrecoInscricao, formatarPreco, validarLimiteProvas, validarNorma12Sub14, getRestricoesNorma12, getLimiteCat } from "../../shared/engines/inscricaoEngine";
import { Th, Td } from "../ui/TableHelpers";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";

// Verifica em tempo real se as inscrições estão encerradas,
// levando em conta data+hora além do flag salvo.
function isInscricaoEncerradaAgora(ev) {
  if (!ev) return true;
  if (ev.competicaoFinalizada || ev.competicaoEncerrada) return true;
  if (ev.inscricoesEncerradas && !ev.inscricoesForceAbertas) return true;
  if (ev.dataEncerramentoInscricoes) {
    try {
      const dtEnc = new Date(ev.dataEncerramentoInscricoes + "T" + (ev.horaEncerramentoInscricoes || "23:59") + ":00");
      if (new Date() > dtEnc) return true;
    } catch { /* ignora */ }
  }
  if (ev.dataAberturaInscricoes) {
    try {
      const dtAb = new Date(ev.dataAberturaInscricoes + "T" + (ev.horaAberturaInscricoes || "00:00") + ":00");
      if (new Date() < dtAb) return true;
    } catch { /* ignora */ }
  }
  return false;
}

const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

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
  btnIconSmDanger: { background: t.bgCardAlt, border: `1px solid ${t.danger}44`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
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
  catPreview: { background: t.bgInput, border: `1px solid ${t.accentBorder}`, borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: t.textTertiary },
  atletaInfo: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12, padding: "10px 14px", background: t.bgInput, borderRadius: 8, fontSize: 13 },
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  resumoInscricao: { background: t.bgCard, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: "16px 20px", marginTop: 16 },
  tagProva: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  statusBarItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  statusDot: (cor) => ({ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }),
  statusDotInline: (cor) => ({ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: cor, background: cor + "22", border: `1px solid ${cor}44`, borderRadius: 10, padding: "2px 8px", whiteSpace: "nowrap" }),
  statusControlsCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusControlsTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: t.accent, letterSpacing: 1, marginBottom: 14 },
  statusControlsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  statusControlBox: (ativo, corAtiva, bgAtiva, disabled) => ({ background: ativo ? bgAtiva : t.bgInput, border: `1px solid ${ativo ? corAtiva + "66" : t.borderInput}`, borderRadius: 10, padding: "14px 16px", opacity: disabled ? 0.5 : 1, transition: "all 0.2s" }),
  statusControlLabel: { display: "flex", alignItems: "flex-start", cursor: "pointer", gap: 0 },
  modoSwitch: { display: "flex", gap: 0, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: t.textDimmed, padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: t.bgInput, color: t.accent },
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: t.textPrimary, fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  permissividadeTag: (ativo) => ({ display: "inline-block", background: ativo ? `${t.success}15` : t.bgCard, border: `1px solid ${ativo ? `${t.success}44` : t.border}`, color: ativo ? t.success : t.textDisabled, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600 }),
  filtroProvasBar: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 20 },
  filtroProvasBloco: { display: "flex", flexDirection: "column", gap: 8 },
  filtroProvasLabel: { fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 },
  filtroProvasPills: { display: "flex", flexWrap: "wrap", gap: 6 },
  filtroPill: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textDimmed, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5, transition: "all 0.15s" },
  filtroPillAtivo: { background: t.bgHover, border: `1px solid ${t.accentBorder}`, color: t.accent },
  filtroClearBtn: { background: "none", border: "none", color: `${t.accent}88`, cursor: "pointer", fontSize: 11, fontFamily: "'Barlow', sans-serif", padding: "0 4px", textDecoration: "underline" },
  savedBadge: { background: `${t.success}15`, border: `1px solid ${t.success}44`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarDica: { color: t.textDimmed, fontSize: 12 },
  formPage: { maxWidth: 640, margin: "60px auto", padding: "0 24px 80px" },
  formCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32, marginBottom: 20 },
  formTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: t.textPrimary, textAlign: "center", marginBottom: 8 },
  formSub: { color: t.textDimmed, textAlign: "center", fontSize: 14, marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },
  fieldError: { color: t.danger, fontSize: 12, marginTop: 2 },
  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: t.textMuted, transition: "all 0.2s" },
  radioLabelActive: { background: t.bgHover, border: `1px solid ${t.accentBorder}`, color: t.accent },
  infoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: t.accent, marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: `1px solid ${t.border}`, fontSize: 14, color: t.textSecondary, display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: t.accent, fontWeight: 700 },
  sumuCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  digitarSection: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  inputMarca: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", color: t.accent, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.accent, marginBottom: 16 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: `linear-gradient(180deg, ${t.bgCardAlt} 0%, transparent 100%)`, borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: t.accent, color: t.textPrimary, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, color: t.textPrimary, lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: t.textDimmed },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: t.textMuted, flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({ display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, background: status === "ao_vivo" ? `${t.danger}15` : status === "hoje_pre" ? t.accentBg : status === "futuro" ? `${t.success}15` : t.bgCardAlt, color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textDisabled, border: `1px solid ${status === "ao_vivo" ? `${t.danger}44` : status === "hoje_pre" ? t.accentBorder : status === "futuro" ? `${t.success}44` : t.border}` }),
  grupoProvasBox: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 16, overflow: "hidden" },
  grupoProvasHeader: { background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  provaCheckBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", lineHeight: 1.4, userSelect: "none" },
  provaCheckBtnSel: { background: t.bgHover, borderColor: t.accentBorder, color: t.accent },
  provaChip: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", fontSize: 13, color: t.textSecondary, lineHeight: 1.4 },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? t.bgHover : "transparent", color: ativo ? t.accent : t.textDisabled, border: `1px solid ${ativo ? t.accentBorder : t.border}` }),
  stepDivider: { flex: 1, height: 1, background: t.border, margin: "0 8px" },
  permissividadeBox: { background: t.bgHeaderSolid, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 4 },
  permissividadeHeader: { marginBottom: 10 },
  permissividadeLabel: { display: "flex", alignItems: "center", cursor: "pointer", fontSize: 14, color: t.textSecondary, fontWeight: 600 },
  permissividadeInfo: { background: t.bgHover, borderRadius: 8, padding: "12px 16px", borderLeft: `3px solid ${t.accent}` },
  permissividadeAlert: { display: "flex", gap: 14, alignItems: "flex-start", background: `${t.success}10`, border: `1px solid ${t.success}44`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 },
  permissividadeAlertIcon: { fontSize: 28, flexShrink: 0, marginTop: 2 },
  permissividadeAlertTitle: { fontWeight: 700, color: t.success, fontSize: 15, marginBottom: 4 },
  permissividadeAlertBody: { color: t.textTertiary, fontSize: 13, lineHeight: 1.6, marginBottom: 6 },
  permissividadeAlertRodape: { fontSize: 12, color: t.textDimmed, fontStyle: "italic" },
  badgeOficial: { background: t.bgCardAlt, color: t.textTertiary, border: `1px solid ${t.border}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  badgeNorma: { background: `${t.success}15`, color: t.success, border: `1px solid ${t.success}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, cursor: "help" },
  eventoBar: { background: t.bgHeaderSolid, borderTop: `1px solid ${t.border}`, padding: "6px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  eventoBarLabel: { fontSize: 11, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase" },
  eventoBarNome: { fontSize: 13, fontWeight: 700, color: t.accent, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  eventoBarMeta: { fontSize: 12, color: t.textDimmed, marginLeft: "auto" },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: t.bgHover, borderColor: t.accentBorder, color: t.accent },
};
}

function TelaGestaoInscricoes({ setTela, eventoAtual, inscricoes, atletas, equipes, excluirInscricao, adicionarInscricao, atualizarInscricao, usuarioLogado, registrarAcao, numeracaoPeito, organizadores, gtLogo }) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const confirmar = useConfirm();
  if (!eventoAtual) return <div style={s.page}><div style={s.emptyState}><p>Nenhuma competição selecionada.</p></div></div>;

  const tipoUser   = usuarioLogado?.tipo;
  const isPrivileg = tipoUser === "admin" || tipoUser === "organizador" || tipoUser === "funcionario";
  if (!isPrivileg && isInscricaoEncerradaAgora(eventoAtual)) return (
    <div style={s.page}>
      <div style={s.emptyState}>
        <span style={{ fontSize: 48 }}>🔒</span>
        <p style={{ fontWeight: 700, color: t.textPrimary, fontSize: 18 }}>Inscrições Encerradas</p>
        <p style={{ color: t.textDimmed, fontSize: 14 }}>
          As inscrições para <strong>{eventoAtual.nome}</strong> estão encerradas.
        </p>
        <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar</button>
      </div>
    </div>
  );

  if (!isPrivileg && usuarioLogado?.lgpdConsentimentoRevogado) return (
    <div style={s.page}>
      <div style={s.emptyState}>
        <span style={{ fontSize: 48 }}>🔓</span>
        <p style={{ fontWeight: 700, color: t.danger, fontSize: 18 }}>Consentimento Revogado</p>
        <p style={{ color: t.textMuted, fontSize: 14, maxWidth: 420, textAlign: "center", lineHeight: 1.6 }}>
          Você revogou seu consentimento LGPD. Novas inscrições não são permitidas.<br/>
          Para voltar a se inscrever em competições, realize um novo cadastro.
        </p>
        <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar ao Início</button>
      </div>
    </div>
  );

  const eid = eventoAtual.id;

  // Se for equipe/treinador, filtra apenas atletas e inscrições da própria equipe
  const isEquipeUsuario = usuarioLogado?.tipo === "equipe" || usuarioLogado?.tipo === "treinador";
  const inscricoesAbertas = !isInscricaoEncerradaAgora(eventoAtual);
  const minhaEquipeId   = usuarioLogado?.equipeId || (usuarioLogado?.tipo === "equipe" ? usuarioLogado?.id : null);
  const minhaEquipe     = minhaEquipeId ? equipes?.find(e => e.id === minhaEquipeId) : null;
  const meuClube        = minhaEquipe?.nome || "";

  const inscsEvtTodas = inscricoes.filter(i => i.eventoId === eid);
  const inscsEvt = isEquipeUsuario && minhaEquipeId
    ? inscsEvtTodas.filter(i => {
        if (i.equipeCadastroId === minhaEquipeId) return true;
        const atl = atletas.find(a => a.id === i.atletaId);
        return atl?.equipeId === minhaEquipeId || (meuClube && atl?.clube === meuClube);
      })
    : inscsEvtTodas;

  const provasProg = todasAsProvas().filter(p => (eventoAtual.provasPrograma || []).includes(p.id));
  const anoComp = eventoAtual.data ? parseInt(eventoAtual.data.slice(0, 4)) : new Date().getFullYear();

  // ── Filtros da tabela ────────────────────────────────────────────────────
  const [filtroProva, setFiltroProva] = useState("");
  const [filtroCat, setFiltroCat]     = useState("");
  const [filtroSexo, setFiltroSexo]   = useState("");
  const [filtroNome, setFiltroNome]   = useState("");
  const [filtroPago, setFiltroPago]   = useState(""); // "" | "pago" | "pendente"
  const [filtroEquipe, setFiltroEquipe] = useState("");
  const [feedback, setFeedback]       = useState("");

  // Um atleta é considerado "pago" se TODAS as suas inscrições visíveis têm pago=true
  const isPago = (inscs) => inscs.filter(i => !i.combinadaId).every(i => i.pago === true);

  const togglePago = (inscs, atl) => {
    const novoStatus = !isPago(inscs);
    inscs.forEach(i => atualizarInscricao({ ...i, pago: novoStatus }));
    setFeedback(`${novoStatus ? "✅ Pago" : "↩️ Pendente"}: ${atl?.nome || "atleta"}`);
    setTimeout(() => setFeedback(""), 3000);
  };

  // ── Carrinho ─────────────────────────────────────────────────────────────
  const [carrinho, setCarrinho]           = useState([]);
  const [confirmando, setConfirmando]     = useState(false);
  const [modoCarrinho, setModoCarrinho]   = useState(false);
  const [inserirAtletaId, setInserirAtletaId] = useState("");
  const [inserirProvasIds, setInserirProvasIds] = useState(new Set()); // multi-seleção
  const [etapa, setEtapa]                 = useState("montagem"); // montagem | confirmacao | concluido

  const todosAtletas = useMemo(() => {
    // Equipe/treinador: mostrar apenas atletas da própria equipe no carrinho
    const base = isEquipeUsuario && minhaEquipeId
      ? atletas.filter(a => a.equipeId === minhaEquipeId || (meuClube && a.clube === meuClube))
      : atletas;
    const sorted = [...base].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    const seen = new Map();
    return sorted.filter(a => {
      const key = `${(a.nome || "").toLowerCase().trim()}_${a.sexo}_${a.dataNasc || a.anoNasc || ""}`;
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
  }, [atletas, isEquipeUsuario, minhaEquipeId, meuClube]);

  // ── Inscrições filtradas ─────────────────────────────────────────────────
  let inscsFiltradas = inscsEvt.filter(i => i.tipo !== "revezamento" && !i.combinadaId);
  if (filtroProva) inscsFiltradas = inscsFiltradas.filter(i => i.provaId === filtroProva);
  if (filtroCat)   inscsFiltradas = inscsFiltradas.filter(i => i.categoriaId === filtroCat || i.categoria === filtroCat);
  if (filtroSexo)  inscsFiltradas = inscsFiltradas.filter(i => i.sexo === filtroSexo);
  if (filtroNome) {
    const q = filtroNome.toLowerCase();
    inscsFiltradas = inscsFiltradas.filter(i => atletas.find(a => a.id === i.atletaId)?.nome?.toLowerCase().includes(q));
  }
  if (filtroPago) {
    const idsPagos = new Set(
      Object.entries(
        inscsFiltradas.reduce((acc, i) => { if (!acc[i.atletaId]) acc[i.atletaId] = []; acc[i.atletaId].push(i); return acc; }, {})
      ).filter(([, inscs]) => filtroPago === "pago" ? isPago(inscs) : !isPago(inscs)).map(([id]) => id)
    );
    inscsFiltradas = inscsFiltradas.filter(i => idsPagos.has(i.atletaId));
  }
  if (filtroEquipe) {
    const idsEquipe = new Set(
      inscsEvt.filter(i => {
        const atl = atletas.find(a => a.id === i.atletaId);
        const eq = i.equipeCadastro || atl?.clube || "";
        return eq === filtroEquipe;
      }).map(i => i.atletaId)
    );
    inscsFiltradas = inscsFiltradas.filter(i => idsEquipe.has(i.atletaId));
  }

  const inscsRevez   = inscsEvt.filter(i => i.tipo === "revezamento");
  const provasRevez  = provasProg.filter(p => p.tipo === "revezamento");
  const equipesUnicas = [...new Set(
    inscsEvt.map(i => {
      const atl = atletas.find(a => a.id === i.atletaId);
      return i.equipeCadastro || atl?.clube || "";
    }).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const provasUnicas = [...new Set(inscsEvt.map(i => i.provaId))].map(pid => {
    const p = todasAsProvas().find(pp => pp.id === pid);
    return { id: pid, nome: p?.nome || pid };
  });
  const catsUnicas = [...new Set(inscsEvt.map(i => i.categoriaId || i.categoria))].filter(Boolean);

  // ── Ações tabela existente ───────────────────────────────────────────────
  const handleExcluir = async (insc) => { 
    const atl = atletas.find(a => a.id === insc.atletaId);
    const prv = todasAsProvas().find(p => p.id === insc.provaId);
    if (!await confirmar(`Remover ${atl?.nome || "atleta" } da prova ${prv?.nome || insc.provaId}?`)) return;
    excluirInscricao(insc.id, { confirmado: true });
    setFeedback(`✅ ${atl?.nome} removido de ${prv?.nome}`);
    setTimeout(() => setFeedback(""), 3000);
  };

  const handleTrocarProva = (insc) => {
    const atl = atletas.find(a => a.id === insc.atletaId);
    const provaAtual = todasAsProvas().find(p => p.id === insc.provaId);
    const novaProvaId = window.prompt(`Trocar ${atl?.nome} de "${provaAtual?.nome}" para qual prova?\n\nDigite parte do nome:`);
    if (!novaProvaId) return;
    const novaProva = provasProg.find(p => p.nome.toLowerCase().includes(novaProvaId.toLowerCase()));
    if (!novaProva) { alert("Prova não encontrada no programa."); return; }
    if (novaProva.id === insc.provaId) return;
    if (inscsEvt.some(i => i.atletaId === insc.atletaId && i.provaId === novaProva.id)) {
      alert(`${atl?.nome} já está inscrito em ${novaProva.nome}.`); return;
    }
    atualizarInscricao({ ...insc, provaId: novaProva.id, provaNome: novaProva.nome });
    if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, "Trocou prova", `${atl?.nome}: ${provaAtual?.nome} → ${novaProva.nome}`, usuarioLogado?.organizadorId || usuarioLogado?.id, { modulo: "inscricoes" });
    setFeedback(`✅ ${atl?.nome} transferido para ${novaProva.nome}`);
    setTimeout(() => setFeedback(""), 3000);
  };

  // ── Carrinho: adicionar ──────────────────────────────────────────────────
  const handleAdicionarAoCarrinho = () => {
    if (!inserirAtletaId || inserirProvasIds.size === 0) { alert("Selecione atleta e pelo menos uma prova."); return; }
    const atl = atletas.find(a => a.id === inserirAtletaId);
    if (!atl) return;

    // Validar limite: inscrições salvas + carrinho existente + novas selecionadas
    const cat = getCategoria(atl.anoNasc, anoComp);
    const novasProvasNoCarrinho = carrinho.filter(c => c.atletaId === inserirAtletaId).map(c => c.provaId);
    const todasNovas = [...novasProvasNoCarrinho, ...[...inserirProvasIds]];
    const validacao = validarLimiteProvas(eventoAtual, inscsEvt, inserirAtletaId, cat?.id || null, todasNovas);
    if (!validacao.ok) {
      alert(`⚠️ Limite atingido: ${validacao.motivo}`); return;
    }

    // Validar Norma 12 CBAt — Sub-14
    // Considerar inscrições salvas + carrinho + novas seleções
    const inscsComCarrinho = [
      ...inscsEvt,
      ...carrinho.filter(c => c.atletaId === inserirAtletaId).map(c => ({
        eventoId: eventoAtual.id, atletaId: inserirAtletaId, provaId: c.provaId,
      })),
    ];
    const validacaoNorma12 = validarNorma12Sub14(
      eventoAtual, inscsComCarrinho, inserirAtletaId, cat?.id || null, [...inserirProvasIds], todasAsProvas()
    );
    if (!validacaoNorma12.ok) {
      alert(`⚠️ ${validacaoNorma12.msg}`); return;
    }

    const novas = [];
    for (const provaId of inserirProvasIds) {
      if (carrinho.some(c => c.atletaId === inserirAtletaId && c.provaId === provaId)) continue;
      if (inscsEvt.some(i => i.atletaId === inserirAtletaId && i.provaId === provaId)) continue;
      const prv = todasAsProvas().find(p => p.id === provaId);
      if (!prv) continue;
      novas.push({ atletaId: inserirAtletaId, provaId, atletaNome: atl.nome, provaNome: prv.nome });
    }
    if (novas.length === 0) { alert("Todas as provas selecionadas já estão inscritas ou no lote."); return; }
    setCarrinho(c => [...c, ...novas]);
    setInserirAtletaId("");
    setInserirProvasIds(new Set());
  };

  const removerDoCarrinho = (atletaId, provaId) =>
    setCarrinho(c => c.filter(x => !(x.atletaId === atletaId && x.provaId === provaId)));

  // ── Resumo financeiro do carrinho ────────────────────────────────────────
  // Regra: atleta que já tem inscrição no evento → sem cobrança adicional.
  // Revezamento: nunca cobra (já tratado separadamente — aqui nem aparece no carrinho).
  const resumoCarrinho = useMemo(() => {
    const porAtleta = {};
    carrinho.forEach(item => {
      if (!porAtleta[item.atletaId]) porAtleta[item.atletaId] = [];
      porAtleta[item.atletaId].push(item);
    });
    return Object.entries(porAtleta).map(([atletaId, itens]) => {
      const atl = atletas.find(a => a.id === atletaId);
      const cat = atl ? getCategoria(atl.anoNasc, anoComp) : null;
      const precoInfo = calcularPrecoInscricao(atl, cat?.id || null, eventoAtual);
      // Já tem inscrição prévia neste evento (prova avulsa, não revezamento)?
      const jaTemInscricao = inscsEvt.some(i =>
        i.atletaId === atletaId && i.tipo !== "revezamento" && !i.combinadaId
      );
      return {
        atletaId,
        atletaNome: atl?.nome || "—",
        catNome: cat?.nome || "—",
        provas: itens,
        precoInfo,
        jaTemInscricao,
        // Só cobra se é a primeira inscrição no evento
        valorCobrar: jaTemInscricao ? 0 : (precoInfo.preco || 0),
      };
    });
  }, [carrinho, atletas, anoComp, eventoAtual, inscsEvt]);

  const totalGeral = resumoCarrinho.reduce((acc, r) => acc + r.valorCobrar, 0);
  const temPreco   = true; // sempre mostrar coluna valor (exibe "Gratuito" quando sem preço)
  const temPrecoConfig = !!(eventoAtual.regrasPreco?.length > 0 || eventoAtual.valorInscricao);

  // ── Impressão do lote de inscrições ────────────────────────────────────────
  const imprimirLote = () => {
    const equipeNome = equipes.find(e => e.id === usuarioLogado?.equipeId || e.id === usuarioLogado?.id)?.nome
      || usuarioLogado?.nome || "—";
    const dataImpressao = new Date().toLocaleString("pt-BR");
    const temTotal = temPrecoConfig && totalGeral > 0;

    const linhas = resumoCarrinho.map(r => {
      const provasHtml = r.provas.map(p =>
        `<span style="display:inline-block;background:#e8f5e9;border:1px solid #a5d6a7;border-radius:4px;padding:2px 8px;font-size:11px;margin:2px 3px 2px 0;color:#1b5e20;">${p.provaNome}</span>`
      ).join("");

      const tipoLabel = r.precoInfo?.tipo === "comEquipe" ? "com equipe"
        : r.precoInfo?.tipo === "semEquipe" ? "sem equipe"
        : r.precoInfo?.tipo === "global" ? "valor geral" : "";

      const valorHtml = r.jaTemInscricao
        ? `<span style="color:#999;font-size:12px;">Já inscrito</span>`
        : r.precoInfo?.preco != null
          ? `<strong style="font-size:17px;color:#1a6b1a;">${formatarPreco(r.precoInfo?.preco)}</strong>${tipoLabel ? `<br><span style="font-size:10px;color:#888;">(${tipoLabel})</span>` : ""}`
          : `<span style="color:#999;font-size:12px;font-style:italic;">Gratuito</span>`;

      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;font-weight:600;color:#111;">${r.atletaNome}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;color:#555;white-space:nowrap;">${r.catNome}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;">${provasHtml}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;text-align:right;vertical-align:middle;">${valorHtml}</td>
        </tr>`;
    }).join("");

    const totalRow = temTotal ? `
        <tr style="background:#f1f8e9;">
          <td colspan="3" style="padding:12px;font-weight:700;font-size:13px;color:#333;text-align:right;border-top:2px solid #a5d6a7;">
            TOTAL DO LOTE (${resumoCarrinho.filter(r => r.valorCobrar > 0).length} atleta${resumoCarrinho.filter(r => r.valorCobrar > 0).length !== 1 ? "s" : ""} a cobrar)
          </td>
          <td style="padding:12px;font-size:22px;font-weight:900;color:#1a6b1a;text-align:right;border-top:2px solid #a5d6a7;">
            ${formatarPreco(totalGeral)}
          </td>
        </tr>` : "";

    const pagamentoSection = (temTotal && (eventoAtual.formaPagamento || eventoAtual.orientacaoPagamento)) ? `
      <div style="margin-top:20px;background:#e8f5e9;border-left:4px solid #4caf50;border-radius:4px;padding:14px 18px;">
        <div style="font-weight:700;font-size:13px;color:#1b5e20;margin-bottom:6px;">💳 Instruções de Pagamento</div>
        ${eventoAtual.formaPagamento ? `<div style="font-size:13px;color:#333;margin-bottom:4px;">Via: <strong>${eventoAtual.formaPagamento}</strong></div>` : ""}
        ${eventoAtual.orientacaoPagamento ? `<div style="font-size:12px;color:#555;white-space:pre-wrap;line-height:1.6;">${eventoAtual.orientacaoPagamento}</div>` : ""}
      </div>` : "";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Lote de Inscrições — ${eventoAtual.nome}</title>
  <style>
    @media print { body { margin: 0; } .no-print { display: none !important; } }
    body { font-family: Arial, sans-serif; color: #111; background: #fff; margin: 0; padding: 24px; }
    h1 { font-size: 22px; margin: 0 0 2px; color: #111; }
    .sub { font-size: 13px; color: #555; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { background: #1b5e20; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
    thead th:last-child { text-align: right; }
    tr:hover { background: #f5f5f5; }
    .footer { margin-top: 28px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
    .btn-print { background: #1b5e20; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; cursor: pointer; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:16px;">
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
    <button onclick="window.close()" style="margin-left:10px;background:#eee;border:1px solid #ccc;padding:10px 20px;border-radius:6px;cursor:pointer;">✕ Fechar</button>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
    <div>
      <h1>Lote de Inscrições</h1>
      <div class="sub">${eventoAtual.nome} · ${eventoAtual.data ? new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR") : ""}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-weight:700;font-size:14px;">${equipeNome}</div>
      <div style="font-size:11px;color:#888;">Emitido em ${dataImpressao}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Atleta</th>
        <th>Categoria</th>
        <th>Provas</th>
        <th style="text-align:right;">Valor</th>
      </tr>
    </thead>
    <tbody>${linhas}</tbody>
    <tfoot>${totalRow}</tfoot>
  </table>
  ${pagamentoSection}
  <div class="footer">GerenTrack · ${equipeNome} · ${dataImpressao}</div>
</body>
</html>`;

    const w = window.open("", "_blank", "width=900,height=700");
    if (w) { w.document.write(html); w.document.close(); }
  };

  // ── Confirmar e gravar lote ──────────────────────────────────────────────
  const handleConfirmar = async () => {
    if (confirmando) return;
    setConfirmando(true);
    for (const item of carrinho) {
      const atl = atletas.find(a => a.id === item.atletaId);
      const prv = todasAsProvas().find(p => p.id === item.provaId);
      if (!atl || !prv) continue;
      const cat = getCategoria(atl.anoNasc, anoComp);
      const precoInfoInsc = calcularPrecoInscricao(atl, cat?.id || null, eventoAtual);
      const inscBase = {
        id: genId(),
        eventoId: eid,
        atletaId: item.atletaId,
        provaId: item.provaId,
        provaNome: prv.nome,
        categoria: cat?.nome || "—",
        categoriaId: cat?.id || "",
        categoriaOficial: cat?.nome || "—",
        categoriaOficialId: cat?.id || "",
        sexo: atl.sexo,
        data: new Date().toISOString(),
        inscritoPorId: usuarioLogado?.id,
        inscritoPorNome: usuarioLogado?.nome || "Admin",
        inscritoPorTipo: usuarioLogado?.tipo,
        equipeCadastro: atl.clube || _getClubeAtleta(atl, equipes) || "",
        equipeCadastroId: atl.equipeId || null,
        precoInfo: precoInfoInsc,
      };
      await adicionarInscricao(inscBase);
      if (prv.tipo === "combinada") {
        const provasComp = CombinedEventEngine.gerarProvasComponentes(item.provaId, eid);
        const inscricoesComp = CombinedEventEngine.inscreverAtletaNasComponentes(
          item.atletaId, item.provaId, eid,
          { categoria: cat?.nome || "—", categoriaId: cat?.id || "", categoriaOficial: cat?.nome || "—", categoriaOficialId: cat?.id || "", sexo: atl.sexo, inscritoPorId: usuarioLogado?.id, inscritoPorNome: usuarioLogado?.nome, inscritoPorTipo: usuarioLogado?.tipo, equipeCadastro: atl.clube || "", equipeCadastroId: atl.equipeId || null },
          provasComp
        );
        for (const ic of inscricoesComp) await adicionarInscricao(ic);
      }
    }
    if (registrarAcao) registrarAcao(
      usuarioLogado?.id, usuarioLogado?.nome,
      "Inscreveu atletas em lote", `${carrinho.length} inscrição(ões)`,
      usuarioLogado?.organizadorId || usuarioLogado?.id, { modulo: "inscricoes" }
    );
    setConfirmando(false);
    setEtapa("concluido");
  };

  const resetCarrinho = () => {
    setCarrinho([]);
    setEtapa("montagem");
    setModoCarrinho(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Agrupamento por atleta, ordenado por equipe → nome alfabético ──────────
  const _porAtletaMap = {};
  inscsFiltradas.forEach(insc => {
    if (!_porAtletaMap[insc.atletaId]) _porAtletaMap[insc.atletaId] = [];
    _porAtletaMap[insc.atletaId].push(insc);
  });
  const _porAtletaArr = Object.entries(_porAtletaMap).sort(([idA, inscsA], [idB, inscsB]) => {
    const atlA = atletas.find(a => a.id === idA);
    const atlB = atletas.find(a => a.id === idB);
    const equipeA = (inscsA[0]?.equipeCadastro || atlA?.clube || "").toLowerCase();
    const equipeB = (inscsB[0]?.equipeCadastro || atlB?.clube || "").toLowerCase();
    if (equipeA !== equipeB) return equipeA.localeCompare(equipeB, "pt-BR");
    return (atlA?.nome || "").localeCompare(atlB?.nome || "", "pt-BR");
  });
  const { paginado: porAtletaPag, infoPage: inscsInfo } = usePagination(_porAtletaArr, 10);

  // ── Resumo financeiro das inscrições salvas ────────────────────────────────
  const resumoFinanceiro = useMemo(() => {
    const porEquipe = {};
    let totalGlobalSalvo = 0;
    _porAtletaArr.forEach(([atletaId, inscs]) => {
      const atl = atletas.find(a => a.id === atletaId);
      const cat = atl ? getCategoria(atl.anoNasc, anoComp) : null;
      const precoInfo = calcularPrecoInscricao(atl, cat?.id || null, eventoAtual);
      const valor = precoInfo?.preco || 0;
      const equipeNome = inscs[0]?.equipeCadastro || atl?.clube || "Sem equipe";
      const pago = isPago(inscs);
      if (!porEquipe[equipeNome]) porEquipe[equipeNome] = { atletas: 0, valor: 0, pago: 0 };
      porEquipe[equipeNome].atletas++;
      porEquipe[equipeNome].valor += valor;
      if (pago) porEquipe[equipeNome].pago += valor;
      totalGlobalSalvo += valor;
    });
    const totalPago = _porAtletaArr.reduce((acc, [atletaId, inscs]) => {
      const atl = atletas.find(a => a.id === atletaId);
      const cat = atl ? getCategoria(atl.anoNasc, anoComp) : null;
      const precoInfo = calcularPrecoInscricao(atl, cat?.id || null, eventoAtual);
      return acc + (isPago(inscs) ? (precoInfo?.preco || 0) : 0);
    }, 0);
    return { porEquipe, totalGlobalSalvo, totalPago };
  }, [_porAtletaArr, atletas, anoComp, eventoAtual]);

  // ── Exportar CSV ───────────────────────────────────────────────────────────
  const exportarCSV = () => {
    const linhas = _porAtletaArr.map(([atletaId, inscs]) => {
      const atl = atletas.find(a => a.id === atletaId);
      const cat = atl ? getCategoria(atl.anoNasc, anoComp) : null;
      const precoInfo = calcularPrecoInscricao(atl, cat?.id || null, eventoAtual);
      const peito = numeracaoPeito?.[eid]?.[atletaId] ?? "";
      const equipe = inscs[0]?.equipeCadastro || atl?.clube || "";
      const provas = inscs.filter(i => !i.combinadaId)
        .map(i => todasAsProvas().find(p => p.id === i.provaId)?.nome || i.provaId).join(", ");
      return {
        "Nº Peito":   peito,
        "CBAt":       _getCbat(atl),
        "Atleta":     atl?.nome || "",
        "Equipe":     equipe,
        "CPF":        atl?.cpf || "",
        "Data Nasc.": atl?.dataNasc || "",
        "Sexo":       atl?.sexo || "",
        "Categoria":  cat?.nome || "",
        "Provas":     provas,
        "Valor":      precoInfo?.preco != null ? formatarPreco(precoInfo.preco) : "Gratuito",
        "Pago":       isPago(inscs) ? "Sim" : "Não",
      };
    });
    if (linhas.length === 0) { alert("Nenhuma inscrição para exportar."); return; }
    const headers = Object.keys(linhas[0]);
    const csv = [headers.join(";"), ...linhas.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inscricoes-${eventoAtual.nome.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Exportar PDF — cabeçalho e rodapé iguais ao recibo ───────────────────
  const exportarPDF = () => {
    const org = (organizadores || []).find(o => o.id === eventoAtual.organizadorId);
    const dataEmissao = new Date().toLocaleString("pt-BR");
    const logoEsq   = eventoAtual.logoCabecalho       || "";
    const logoDir   = eventoAtual.logoCabecalhoDireito || "";
    const logoRodap = eventoAtual.logoRodape           || "";

    // Colunas e dados dependem do perfil
    const mostrarEquipe  = isPrivileg;
    const mostrarPago    = isPrivileg;
    const mostrarValor   = true; // todos veem valor

    let equipeAtualPdf = null;
    const linhas = _porAtletaArr.map(([atletaId, inscs]) => {
      const atl = atletas.find(a => a.id === atletaId);
      const cat = atl ? getCategoria(atl.anoNasc, anoComp) : null;
      const precoInfo = calcularPrecoInscricao(atl, cat?.id || null, eventoAtual);
      const peito = numeracaoPeito?.[eid]?.[atletaId] ?? "";
      const equipeNome = inscs[0]?.equipeCadastro || atl?.clube || "Sem equipe";
      const provas = inscs.filter(i => !i.combinadaId)
        .map(i => `<span style="display:inline-block;background:#e8f5e9;border:1px solid #a5d6a7;border-radius:3px;padding:1px 5px;font-size:9px;margin:1px 2px;">${todasAsProvas().find(p => p.id === i.provaId)?.nome || i.provaId}</span>`).join("");
      const valor = precoInfo?.preco != null ? formatarPreco(precoInfo.preco) : "Gratuito";
      const pagoCell = isPago(inscs)
        ? `<span style="color:#1a6b1a;font-weight:700;">✅ Pago</span>`
        : `<span style="color:#888;">⏳ Pendente</span>`;

      const novaEquipe = mostrarEquipe && equipeNome !== equipeAtualPdf;
      if (mostrarEquipe) equipeAtualPdf = equipeNome;

      const separador = novaEquipe ? `
        <tr><td colspan="${mostrarEquipe ? (mostrarPago ? 8 : 7) : (mostrarPago ? 7 : 6)}" style="background:#1b5e20;color:#fff;padding:5px 10px;font-weight:700;font-size:10px;letter-spacing:1px;">🏃 ${equipeNome}</td></tr>` : "";

      return `${separador}<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-weight:900;color:#e67e00;font-size:14px;">${peito || "—"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:10px;color:#888;">${_getCbat(atl) || "—"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:600;">${atl?.nome || "—"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:10px;"><span style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:3px;padding:1px 5px;">${cat?.nome || "—"}</span></td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:10px;color:#888;">${atl?.sexo === "M" ? "M" : "F"}</td>
        ${mostrarEquipe ? `<td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:10px;">${equipeNome}</td>` : ""}
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${provas}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-size:11px;font-weight:700;">${valor}</td>
        ${mostrarPago ? `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-size:10px;">${pagoCell}</td>` : ""}
      </tr>`;
    }).join("");

    const nCols = 7 + (mostrarEquipe ? 1 : 0) + (mostrarPago ? 1 : 0);
    const totalGeral = _porAtletaArr.reduce((acc, [, inscs]) => {
      const atl = atletas.find(a => a.id === inscs[0]?.atletaId || a.id === _porAtletaArr[0]?.[0]);
      const cat = atl ? getCategoria(atl.anoNasc, anoComp) : null;
      return acc + (calcularPrecoInscricao(atl, cat?.id || null, eventoAtual)?.preco || 0);
    }, 0);

    // Paginar: máximo 14 atletas por página
    const POR_PAG = 16;
    const linhasArr = _porAtletaArr.map(([atletaId, inscs]) => {
      const atl = atletas.find(a => a.id === atletaId);
      const cat = atl ? getCategoria(atl.anoNasc, anoComp) : null;
      const precoInfo = calcularPrecoInscricao(atl, cat?.id || null, eventoAtual);
      const peito = numeracaoPeito?.[eid]?.[atletaId] ?? "";
      const equipeNome = inscs[0]?.equipeCadastro || atl?.clube || "Sem equipe";
      const provas = inscs.filter(i => !i.combinadaId)
        .map(i => `<span style="display:inline-block;background:#e8f5e9;border:1px solid #a5d6a7;border-radius:3px;padding:1px 5px;font-size:9px;margin:1px 2px;">${todasAsProvas().find(p => p.id === i.provaId)?.nome || i.provaId}</span>`).join("");
      const valor = precoInfo?.preco != null ? formatarPreco(precoInfo.preco) : "Gratuito";
      const pagoCell = isPago(inscs)
        ? `<span style="color:#1a6b1a;font-weight:700;">✅ Pago</span>`
        : `<span style="color:#888;">⏳ Pendente</span>`;
      return `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-weight:900;color:#e67e00;font-size:14px;">${peito || "—"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:10px;color:#888;">${_getCbat(atl) || "—"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:600;">${atl?.nome || "—"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:10px;"><span style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:3px;padding:1px 5px;">${cat?.nome || "—"}</span></td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:10px;color:#888;">${atl?.sexo === "M" ? "M" : "F"}</td>
        ${mostrarEquipe ? `<td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:10px;">${equipeNome}</td>` : ""}
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${provas}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-size:11px;font-weight:700;">${valor}</td>
        ${mostrarPago ? `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-size:10px;">${pagoCell}</td>` : ""}
      </tr>`;
    });

    const totalPags = Math.ceil(linhasArr.length / POR_PAG) || 1;

    const thRow = `<tr>
      <th style="width:55px;text-align:center;">Nº Peito</th>
      <th style="width:70px;">CBAt</th>
      <th>Atleta</th>
      <th style="width:90px;">Categoria</th>
      <th style="width:35px;text-align:center;">Sexo</th>
      ${mostrarEquipe ? `<th>Equipe</th>` : ""}
      <th>Provas</th>
      <th style="width:70px;text-align:right;">Valor</th>
      ${mostrarPago ? `<th style="width:70px;text-align:center;">Pagamento</th>` : ""}
    </tr>`;

    const mkCabecalho = (pagNum) => `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding-bottom:12px;border-bottom:2px solid #1b5e20;gap:12px;">
        <div style="display:flex;align-items:center;gap:14px;">
          ${logoEsq ? `<img src="${logoEsq}" alt="" style="max-height:56px;max-width:120px;object-fit:contain;" />` : ""}
          <div>
            <div style="font-size:9px;font-weight:700;color:#1b5e20;letter-spacing:2px;text-transform:uppercase;margin-bottom:3px;">LISTA DE INSCRIÇÕES</div>
            <div style="font-size:17px;font-weight:700;color:#111;margin-bottom:2px;">${eventoAtual.nome}</div>
            <div style="font-size:11px;color:#555;">
              ${eventoAtual.data ? new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR", {weekday:"long",day:"2-digit",month:"long",year:"numeric"}) : ""}
              ${eventoAtual.cidade ? " · " + eventoAtual.cidade + (eventoAtual.estado ? "/" + eventoAtual.estado : "") : ""}
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="text-align:right;font-size:10px;color:#666;">
            ${org ? `<div style="font-weight:700;font-size:12px;color:#111;">${org.entidade || org.nome || ""}</div>
            ${org.cnpj ? `<div>CNPJ: ${org.cnpj}</div>` : ""}` : ""}
            <div style="margin-top:3px;color:#aaa;">${_porAtletaArr.length} atleta(s) · Emitido em ${dataEmissao}</div>
            <div style="font-weight:700;color:#1b5e20;font-size:11px;">Página ${pagNum} de ${totalPags}</div>
          </div>
          ${logoDir ? `<img src="${logoDir}" alt="" style="max-height:56px;max-width:100px;object-fit:contain;" />` : ""}
        </div>
      </div>`;

    const mkRodape = (isUltima) => `
      <div class="rod-wrap">
        ${isUltima ? `<div style="text-align:right;padding:6px 0;font-size:12px;font-weight:700;border-top:2px solid #1b5e20;">TOTAL&nbsp;&nbsp;${formatarPreco(totalGeral)}</div>` : ""}
        <div style="padding-top:9px;border-top:1px solid #ddd;display:flex;justify-content:flex-end;align-items:center;gap:8px;font-size:9px;color:#aaa;">
          <span>Emitido em: ${dataEmissao}</span>
          <span>·</span>
          <span>Plataforma de Competições - GERENTRACK</span>
        </div>
        ${logoRodap ? `<div style="margin-top:6px;text-align:center;"><img src="${logoRodap}" alt="" style="max-height:18mm;max-width:100%;object-fit:contain;" /></div>` : ""}
      </div>`;

    const paginas = [];
    for (let p = 0; p < totalPags; p++) {
      const fatia = linhasArr.slice(p * POR_PAG, (p + 1) * POR_PAG);
      const isUltima = p === totalPags - 1;
      paginas.push(`
        <div class="pg">
          <div class="conteudo">
            ${mkCabecalho(p + 1)}
            <table><thead>${thRow}</thead><tbody>${fatia.join("")}</tbody></table>
          </div>
          ${mkRodape(isUltima)}
        </div>`);
    }

    const css = `
      @media print{.no-print{display:none!important;}body{margin:0;}@page{size:A4 landscape;margin:0;}
        .pg{margin:0;border:none;box-shadow:none;width:100%;height:100vh;}
        .pg:not(:last-child){page-break-after:always;}}
      body{font-family:Arial,sans-serif;color:#111;background:#fff;margin:0;padding:0;font-size:12px;}
      .pg{background:#fff;width:297mm;min-height:210mm;margin:16px auto;padding:10mm 12mm 10mm;
        display:flex;flex-direction:column;box-shadow:0 4px 24px rgba(0,0,0,.2);box-sizing:border-box;}
      .conteudo{flex:1;}
      .rod-wrap{margin-top:12px;padding-top:8px;flex-shrink:0;}
      table{width:100%;border-collapse:collapse;}
      thead th{background:#1b5e20;color:#fff;padding:7px 8px;text-align:left;font-size:9px;letter-spacing:1px;text-transform:uppercase;}
      tr:nth-child(even){background:#f9f9f9;}`;

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Inscrições — ${eventoAtual.nome}</title><style>${css}</style></head>
    <body>
      <div class="no-print" style="padding:14px 20px;background:#f5f5f5;border-bottom:1px solid #ddd;display:flex;align-items:center;gap:12px;">
        <button onclick="window.print()" style="background:#1b5e20;color:#fff;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-size:14px;">🖨️ Imprimir / Salvar PDF</button>
        <button onclick="window.close()" style="background:#eee;border:1px solid #ccc;padding:10px 18px;border-radius:6px;cursor:pointer;">✕ Fechar</button>
        <span style="font-size:12px;color:#666;">${_porAtletaArr.length} atleta(s) · ${totalPags} página(s)</span>
      </div>
      ${paginas.join("")}
    </body></html>`;

    const w = window.open("", "_blank", "width=1100,height=780");
    if (w) { w.document.write(html); w.document.close(); }
  };

  // ── Estado modal seleção tipo de recibo ──────────────────────────────────
  const [modoRecibo, setModoRecibo] = useState(null); // null | "escolha"
  const [selecionadosRecibo, setSelecionadosRecibo] = useState(new Set()); // Set de atletaIds
  const [assinaturaUrl, setAssinaturaUrl] = useState(""); // base64 da imagem de assinatura
  const [marcarComoPago, setMarcarComoPago] = useState(false);

  // ── Bloco HTML base de 1 recibo ───────────────────────────────────────────
  const _blocoRecibo = ({ titulo, pagador, atletasLista, org, dataEmissao, assinatura, isEquipe = false, totalOverride }) => {
    const temPrecoConfig = !!(eventoAtual.regrasPreco?.length > 0 || eventoAtual.valorInscricao);
    const total = totalOverride != null ? totalOverride : atletasLista.reduce((acc, { precoInfo }) => acc + (precoInfo?.preco || 0), 0);
    const logoEsq   = eventoAtual.logoCabecalho       || "";
    const logoDir   = eventoAtual.logoCabecalhoDireito || "";
    const logoRodap = eventoAtual.logoRodape           || "";

    const linhas = atletasLista.map(({ atl, inscs, peito, cat, precoInfo }) => {
      const provas = inscs.filter(i => !i.combinadaId).map(i =>
        `<span style="display:inline-block;background:#e8f5e9;border:1px solid #a5d6a7;border-radius:3px;padding:1px 6px;font-size:${isEquipe ? "8px" : "10px"};margin:1px 2px;white-space:nowrap;">${todasAsProvas().find(p => p.id === i.provaId)?.nome || i.provaId}</span>`
      ).join("");
      const valor = precoInfo?.preco != null
        ? `<strong style="color:#1a6b1a;">${formatarPreco(precoInfo.preco)}</strong>`
        : `<span style="color:#999;font-style:italic;">Gratuito</span>`;
      const nomeStyle = isEquipe
        ? "padding:5px 8px;border-bottom:1px solid #eee;font-weight:600;font-size:10px;"
        : "padding:7px 10px;border-bottom:1px solid #eee;font-weight:600;";
      const provasStyle = isEquipe
        ? "padding:5px 8px;border-bottom:1px solid #eee;white-space:nowrap;overflow:hidden;max-width:200px;"
        : "padding:7px 10px;border-bottom:1px solid #eee;";
      return `<tr>
        <td style="padding:${isEquipe?"5px 6px":"6px 6px"};border-bottom:1px solid #eee;text-align:center;font-weight:700;color:#555;white-space:nowrap;">${peito || "—"}</td>
        <td style="padding:${isEquipe?"5px 6px":"6px 6px"};border-bottom:1px solid #eee;color:#888;font-size:${isEquipe?"9px":"10px"};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_getCbat(atl) || "—"}</td>
        <td style="padding:${isEquipe?"5px 6px":"6px 6px"};border-bottom:1px solid #eee;font-weight:600;font-size:${isEquipe?"10px":"11px"};overflow:hidden;">${atl?.nome || "—"}</td>
        <td style="padding:${isEquipe?"5px 6px":"6px 6px"};border-bottom:1px solid #eee;color:#555;font-size:${isEquipe?"9px":"10px"};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${cat?.nome || "—"}</td>
        <td style="padding:${isEquipe?"5px 4px":"6px 4px"};border-bottom:1px solid #eee;text-align:center;font-size:${isEquipe?"9px":"10px"};color:#555;white-space:nowrap;">${atl?.sexo === "M" ? "M" : atl?.sexo === "F" ? "F" : "—"}</td>
        <td style="padding:${isEquipe?"5px 6px":"6px 6px"};border-bottom:1px solid #eee;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${provas}</td>
        <td style="padding:${isEquipe?"5px 6px":"6px 6px"};border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">${valor}</td>
      </tr>`;
    }).join("");

    const totalRow = temPrecoConfig && total > 0 ? `<tr style="background:#f1f8e9;">
      <td colspan="6" style="padding:8px 6px;font-weight:700;text-align:right;border-top:2px solid #a5d6a7;font-size:11px;">TOTAL</td>
      <td style="padding:8px 6px;font-size:12px;font-weight:900;color:#1a6b1a;text-align:right;border-top:2px solid #a5d6a7;white-space:nowrap;">${formatarPreco(total)}</td>
    </tr>` : "";

    const pagSection = temPrecoConfig && (eventoAtual.formaPagamento || eventoAtual.orientacaoPagamento) ? `
      <div style="margin-top:14px;background:#e8f5e9;border-left:4px solid #4caf50;padding:10px 14px;border-radius:4px;">
        <div style="font-weight:700;font-size:11px;color:#1b5e20;margin-bottom:3px;">💳 Pagamento</div>
        ${eventoAtual.formaPagamento ? `<div style="font-size:11px;margin-bottom:2px;">Via: <strong>${eventoAtual.formaPagamento}</strong></div>` : ""}
        ${eventoAtual.orientacaoPagamento ? `<div style="font-size:10px;color:#555;white-space:pre-wrap;line-height:1.5;">${eventoAtual.orientacaoPagamento}</div>` : ""}
      </div>` : "";

    const recebiBloco = temPrecoConfig && total > 0 ? `
      <div style="margin-top:20px;border:1.5px solid #333;border-radius:6px;padding:16px 20px;">
        <div style="font-size:11px;font-weight:700;color:#111;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">RECIBO</div>
        <div style="font-size:13px;color:#111;line-height:1.9;">
          Recebemos de <strong>${pagador}</strong> a importância de
          <strong style="font-size:16px;color:#1a6b1a;margin:0 5px;">${formatarPreco(total)}</strong>
          referente à(s) inscrição(ões) na competição
          <strong>${eventoAtual.nome}</strong>${eventoAtual.data ? `, realizada em ${new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}${eventoAtual.cidade ? `, em ${eventoAtual.cidade}${eventoAtual.estado ? "/" + eventoAtual.estado : ""}` : ""}.
        </div>
        ${org ? `<div style="margin-top:12px;padding-top:10px;border-top:1px solid #eee;font-size:10px;color:#555;line-height:1.7;">
          <strong style="color:#333;">${org.entidade || org.nome || ""}</strong>
          ${org.cnpj ? ` &nbsp;·&nbsp; CNPJ: ${org.cnpj}` : ""}
          ${org.email ? ` &nbsp;·&nbsp; ${org.email}` : ""}
          ${org.fone ? ` &nbsp;·&nbsp; ${org.fone}` : ""}
        </div>` : ""}
        <div style="margin-top:14px;font-size:10px;color:#777;">${eventoAtual.cidade || ""}${eventoAtual.estado ? "/" + eventoAtual.estado : ""}, ${dataEmissao}</div>
      </div>` : "";

    // ── Cabeçalho com logos ──
    const cabecalho = `
      <div class="cab-recibo" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding-bottom:12px;border-bottom:2px solid #1b5e20;gap:12px;">
        <div style="display:flex;align-items:center;gap:14px;">
          ${logoEsq ? `<img src="${logoEsq}" alt="Logo" />` : ""}
          <div>
            <div style="font-size:9px;font-weight:700;color:#1b5e20;letter-spacing:2px;text-transform:uppercase;margin-bottom:3px;">${titulo}</div>
            <div style="font-size:17px;font-weight:700;color:#111;margin-bottom:2px;">${eventoAtual.nome}</div>
            <div style="font-size:11px;color:#555;">
              ${eventoAtual.data ? new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR", {weekday:"long",day:"2-digit",month:"long",year:"numeric"}) : ""}
              ${eventoAtual.cidade ? " · " + eventoAtual.cidade + (eventoAtual.estado ? "/" + eventoAtual.estado : "") : ""}
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="text-align:right;font-size:10px;color:#aaa;">
            <div>Emitido em ${dataEmissao}</div>
          </div>
          ${logoDir ? `<img src="${logoDir}" alt="Logo Org" />` : ""}
        </div>
      </div>`;

    // ── Rodapé — mesmo padrão das súmulas (margin-top:auto empurra para baixo) ──
    const rodape = `
      <div class="rod-wrap">
        <div class="rod">
          <div class="rod-ass">
            <div class="rod-ln">
              ${assinatura ? `<img src="${assinatura}" alt="Assinatura" style="max-height:64px;max-width:200px;object-fit:contain;object-position:bottom;" />` : ""}
            </div>
            <div class="rod-lb">${org?.entidade || org?.nome || "Organizador"}</div>
          </div>
          <div class="rod-info">
            <div>Emitido em: ${dataEmissao}</div>
            <div style="display:flex;align-items:center;justify-content:center;gap:5px;margin-top:2px;">
              ${gtLogo
                ? `<span>Plataforma de Competições -</span><img src="${gtLogo}" alt="GERENTRACK" style="max-height:8mm;object-fit:contain;opacity:0.7;vertical-align:middle;" />`
                : `<span>Plataforma de Competições - GERENTRACK</span>`}
            </div>
          </div>
          <div class="rod-ass" style="visibility:hidden;">
            <div class="rod-ln"></div><div class="rod-lb">.</div>
          </div>
        </div>
        ${logoRodap ? `<div style="margin-top:10px;text-align:center;"><img src="${logoRodap}" alt="" style="max-width:100%;max-height:18mm;object-fit:contain;" /></div>` : ""}
      </div>`;

    return `
      <div class="recibo-conteudo">
        ${cabecalho}
        <table style="width:100%;border-collapse:collapse;font-size:${isEquipe?"11px":"12px"};margin-bottom:0;table-layout:fixed;">
          <colgroup>
            <col style="width:44px"/>
            <col style="width:60px"/>
            <col style="width:${isEquipe?"170px":"200px"}"/>
            <col style="width:54px"/>
            <col style="width:28px"/>
            <col/>
            <col style="width:70px"/>
          </colgroup>
          <thead><tr style="background:#1b5e20;">
            <th style="padding:6px 6px;text-align:center;color:#fff;font-size:9px;letter-spacing:1px;text-transform:uppercase;">Nº Peito</th>
            <th style="padding:6px 6px;text-align:left;color:#fff;font-size:9px;letter-spacing:1px;text-transform:uppercase;">CBAt</th>
            <th style="padding:6px 6px;text-align:left;color:#fff;font-size:9px;letter-spacing:1px;text-transform:uppercase;">Atleta</th>
            <th style="padding:6px 6px;text-align:left;color:#fff;font-size:9px;letter-spacing:1px;text-transform:uppercase;">Cat.</th>
            <th style="padding:6px 4px;text-align:center;color:#fff;font-size:9px;letter-spacing:1px;text-transform:uppercase;">Sx</th>
            <th style="padding:6px 6px;text-align:left;color:#fff;font-size:9px;letter-spacing:1px;text-transform:uppercase;">Provas</th>
            <th style="padding:6px 6px;text-align:right;color:#fff;font-size:9px;letter-spacing:1px;text-transform:uppercase;">Valor</th>
          </tr></thead>
          <tbody>${linhas}${totalRow}</tbody>
        </table>
        ${pagSection}
        ${recebiBloco}
      </div>
      ${rodape}`;
  };

  const gerarRecibos = (modo) => {
    const org = (organizadores || []).find(o => o.id === eventoAtual.organizadorId);
    const dataEmissao = new Date().toLocaleString("pt-BR");

    // Filtra apenas os selecionados
    const atletasSelecionados = _porAtletaArr.filter(([atletaId]) => selecionadosRecibo.has(atletaId));
    if (atletasSelecionados.length === 0) { alert("Selecione ao menos um atleta."); return; }

    // Marcar como pago se opção ativada
    if (marcarComoPago) {
      atletasSelecionados.forEach(([, inscs]) => inscs.forEach(i => atualizarInscricao({ ...i, pago: true })));
    }

    const _scriptAutoScale = `<script>function autoScale(){document.querySelectorAll('.recibo,.pg').forEach(function(pg){var rod=pg.querySelector('.rod-wrap');if(!rod)return;for(var r=0;r<pg.children.length;r++){if(pg.children[r]===rod)continue;pg.children[r].style.fontSize='';pg.children[r].querySelectorAll('table').forEach(function(t){t.style.fontSize='';});}var pgH=pg.offsetHeight;var rodH=rod.offsetHeight;var dH=pgH-rodH;var cH=0;for(var i=0;i<pg.children.length;i++){var c=pg.children[i];if(c===rod)continue;cH+=c.offsetHeight+(parseFloat(getComputedStyle(c).marginTop)||0)+(parseFloat(getComputedStyle(c).marginBottom)||0);}if(cH>dH){var s=Math.max(0.55,dH/cH);for(var j=0;j<pg.children.length;j++){if(pg.children[j]===rod)continue;pg.children[j].style.fontSize=(s*100)+'%';pg.children[j].querySelectorAll('table').forEach(function(t){t.style.fontSize=(s*100)+'%';});}}});}window.addEventListener('load',autoScale);window.addEventListener('beforeprint',autoScale);</scrip` + `t>`;

    const cssBase = `
      @media print{
        .no-print{display:none!important;}
        body{margin:0;padding:0;background:#fff;}
        @page{size:A4 portrait;margin:0;}
        .print-wrap{display:contents;}
        .recibo{width:100%;height:297mm;padding:12mm 15mm 10mm;margin:0;
          box-shadow:none;border:none;box-sizing:border-box;
          display:flex;flex-direction:column;overflow:hidden;
          zoom:0.9;}
        .recibo:not(:last-child){page-break-after:always;}
      }
      body{font-family:Arial,sans-serif;color:#111;background:#fff;margin:0;padding:0;font-size:13px;}
      .print-wrap{display:block;}
      .recibo{background:#fff;width:210mm;min-height:297mm;margin:16px auto;padding:12mm 15mm 10mm;
        display:flex;flex-direction:column;box-shadow:0 4px 24px rgba(0,0,0,.2);box-sizing:border-box;}
      .recibo-conteudo{flex:1;}
      .cab-recibo{font-size:initial;}
      .cab-recibo img{max-height:18mm;max-width:32mm;object-fit:contain;}
      .rod-wrap{margin-top:auto;padding-bottom:3mm;flex-shrink:0;}
      .rod{padding-top:4px;display:flex;justify-content:space-between;align-items:flex-end;gap:12px;}
      .rod-ass{flex:1;max-width:220px;}
      .rod-ln{border-bottom:1px solid #aaa;margin-bottom:5px;height:64px;display:flex;align-items:flex-end;justify-content:center;}
      .rod-lb{font-size:9px;color:#888;text-align:center;font-style:italic;}
      .rod-info{font-size:9px;color:#aaa;text-align:center;line-height:1.4;}
      .rod-logo{margin-top:10px;text-align:center;}
    `;


    const btnBar = (extra) => `<div class="no-print" style="padding:14px 20px;background:#f5f5f5;border-bottom:1px solid #ddd;display:flex;align-items:center;gap:12px;">
      <button onclick="window.print()" style="background:#1b5e20;color:#fff;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-size:14px;">🖨️ Imprimir / Salvar PDF</button>
      <button onclick="window.close()" style="background:#eee;border:1px solid #ccc;padding:10px 18px;border-radius:6px;cursor:pointer;">✕ Fechar</button>
      <span style="font-size:12px;color:#666;">${extra}</span>
    </div>`;

    if (modo === "individual") {
      // Um recibo por atleta selecionado — nunca agrupa
      const atletasLista = atletasSelecionados.map(([atletaId, inscs]) => {
        const atl = atletas.find(a => a.id === atletaId);
        const cat = atl ? getCategoria(atl.anoNasc, anoComp) : null;
        const precoInfo = calcularPrecoInscricao(atl, cat?.id || null, eventoAtual);
        const peito = numeracaoPeito?.[eid]?.[atletaId];
        return { atl, inscs, peito, cat, precoInfo };
      });
      const blocos = atletasLista.map((item, idx) =>
        `<div class="recibo">
          ${_blocoRecibo({ titulo: "RECIBO DE INSCRIÇÃO", pagador: item.atl?.nome || "—", atletasLista: [item], org, dataEmissao, assinatura: assinaturaUrl })}
        </div>`
      ).join("");
      const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Recibos Individuais — ${eventoAtual.nome}</title><style>${cssBase}</style></head><body>${btnBar(atletasLista.length + " recibo(s) individual(is)")}<div class="print-wrap">${blocos}</div>${_scriptAutoScale}<\/body><\/html>`;
      const w = window.open("", "_blank", "width=960,height=780");
      if (w) { w.document.write(html); w.document.close(); }

    } else {
      // Por equipe: agrupa atletas da mesma equipe num recibo só.
      // "Sem equipe" (equipeCadastro vazio) NUNCA agrupa — recibo individual.
      const porEquipe = {};
      const semEquipe = [];

      atletasSelecionados.forEach(([atletaId, inscs]) => {
        const atl = atletas.find(a => a.id === atletaId);
        const cat = atl ? getCategoria(atl.anoNasc, anoComp) : null;
        const precoInfo = calcularPrecoInscricao(atl, cat?.id || null, eventoAtual);
        const peito = numeracaoPeito?.[eid]?.[atletaId];
        const equipeNome = inscs[0]?.equipeCadastro || atl?.clube || "";
        const item = { atl, inscs, peito, cat, precoInfo };

        if (!equipeNome) {
          semEquipe.push(item); // sem equipe → sempre individual
        } else {
          if (!porEquipe[equipeNome]) porEquipe[equipeNome] = [];
          porEquipe[equipeNome].push(item);
        }
      });

      const todosGrupos = [
        ...Object.entries(porEquipe).map(([nome, lista]) => ({ pagador: nome, lista, titulo: "RECIBO DE INSCRIÇÃO — " + nome.toUpperCase() })),
        ...semEquipe.map(item => ({ pagador: item.atl?.nome || "—", lista: [item], titulo: "RECIBO DE INSCRIÇÃO" })),
      ];

      const MAX_POR_PAG = 16;
      const blocos = todosGrupos.flatMap(({ pagador, lista, titulo }) => {
        const totalPagsGrupo = Math.ceil(lista.length / MAX_POR_PAG) || 1;
        const totalGrupo = lista.reduce((acc, { precoInfo }) => acc + (precoInfo?.preco || 0), 0);
        const pags = [];
        for (let p = 0; p < totalPagsGrupo; p++) {
          const fatia = lista.slice(p * MAX_POR_PAG, (p + 1) * MAX_POR_PAG);
          const isUltima = p === totalPagsGrupo - 1;
          const tituloP = totalPagsGrupo > 1 ? `${titulo} — ${p + 1}/${totalPagsGrupo}` : titulo;
          pags.push(`<div class="recibo">
            ${_blocoRecibo({ titulo: tituloP, pagador, atletasLista: fatia, org, dataEmissao, assinatura: isUltima ? assinaturaUrl : "", isEquipe: lista.length > 1, totalOverride: isUltima ? totalGrupo : 0 })}
          </div>`);
        }
        return pags;
      }).join("");

      const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Recibos — ${eventoAtual.nome}</title><style>${cssBase}</style></head><body>${btnBar(Object.keys(porEquipe).length + " equipe(s) · " + semEquipe.length + " sem equipe")}<div class="print-wrap">${blocos}</div>${_scriptAutoScale}<\/body><\/html>`;
      const w = window.open("", "_blank", "width=960,height=780");
      if (w) { w.document.write(html); w.document.close(); }
    }
    setModoRecibo(null);
  };


  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>🔄 Gestão de Inscrições</h1>
          <div style={{ color: t.textDimmed, fontSize: 13 }}>
            {eventoAtual.nome} — {[...new Set(inscsEvt.filter(i => i.tipo !== "revezamento" && !i.combinadaId).map(i => i.atletaId))].length} atleta(s), {inscsEvt.filter(i => i.tipo !== "revezamento" && !i.combinadaId).length} inscrições
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {inscsEvt.length > 0 && (
            <>
              {/* CSV — só admin e organizador (não funcionário, não equipe) */}
              {(tipoUser === "admin" || tipoUser === "organizador") && (
                <button style={{ ...s.btnGhost, fontSize: 12, padding: "7px 14px" }} onClick={exportarCSV} title="Exportar planilha Excel/CSV">
                  📊 Exportar CSV
                </button>
              )}
              {/* PDF — admin, org, funcionário e equipe (cada um vê seus dados) */}
              <button style={{ ...s.btnGhost, fontSize: 12, padding: "7px 14px" }} onClick={exportarPDF} title="Exportar lista em PDF">
                📄 Exportar PDF
              </button>
              {/* Recibo — só admin e org */}
              {isPrivileg && (
                <button style={{ ...s.btnGhost, fontSize: 12, padding: "7px 14px" }} onClick={() => {
                  if (selecionadosRecibo.size === 0) { alert("Selecione ao menos um atleta para gerar o recibo."); return; }
                  setModoRecibo("escolha");
                }} title="Gerar recibo dos selecionados">
                  🧾 Recibo PDF{selecionadosRecibo.size > 0 ? ` (${selecionadosRecibo.size})` : ""}
                </button>
              )}
            </>
          )}
          <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar</button>
        </div>
      </div>

      {feedback && (
        <div style={{ background: t.bgCardAlt, border: `1px solid ${t.success}44`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: t.success, fontSize: 13 }}>
          {feedback}
        </div>
      )}

      {/* Modal seleção tipo de recibo */}
      {modoRecibo === "escolha" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "32px 36px", maxWidth: 440, width: "90%" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 20, color: t.textPrimary, marginBottom: 8, letterSpacing: 1 }}>
              🧾 GERAR RECIBO
            </div>
            <div style={{ color: t.textDimmed, fontSize: 13, marginBottom: 20 }}>
              {selecionadosRecibo.size} atleta(s) selecionado(s)
            </div>

            {/* Upload de assinatura */}
            <div style={{ background: t.bgCardAlt, border: `1px solid ${t.borderInput}`, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: t.textTertiary, marginBottom: 8, fontWeight: 600 }}>✍️ ASSINATURA (opcional)</div>
              {assinaturaUrl ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src={assinaturaUrl} alt="Assinatura" style={{ maxHeight: 48, maxWidth: 160, objectFit: "contain", background: "#fff", borderRadius: 4, padding: 4 }} />
                  <button onClick={() => setAssinaturaUrl("")} style={{ background: "none", border: "none", color: t.danger, cursor: "pointer", fontSize: 12 }}>✕ Remover</button>
                </div>
              ) : (
                <label style={{ cursor: "pointer", display: "inline-block" }}>
                  <span style={{ background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "6px 14px", fontSize: 12, color: t.textMuted, cursor: "pointer" }}>
                    📁 Selecionar imagem
                  </span>
                  <input type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => setAssinaturaUrl(ev.target.result);
                      reader.readAsDataURL(file);
                    }} />
                </label>
              )}
              <div style={{ fontSize: 10, color: t.textDisabled, marginTop: 6 }}>PNG com fundo transparente recomendado</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Opção marcar como pago */}
              <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: t.bgCardAlt, border: `1px solid ${marcarComoPago ? `${t.success}44` : t.borderInput}`, borderRadius: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={marcarComoPago} onChange={e => setMarcarComoPago(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: marcarComoPago ? t.success : t.textMuted }}>✅ Marcar selecionados como pagos</div>
                  <div style={{ fontSize: 11, color: t.textDimmed, marginTop: 2 }}>Atualiza o status de pagamento ao gerar o recibo</div>
                </div>
              </label>
              <button
                onClick={() => gerarRecibos("individual")}
                style={{ background: t.accentBg, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: "16px 20px", cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: t.accent, marginBottom: 4 }}>👤 Individual</div>
                <div style={{ fontSize: 12, color: t.textDimmed }}>Um recibo por atleta — nunca agrupa</div>
              </button>
              <button
                onClick={() => gerarRecibos("equipe")}
                style={{ background: t.bgCardAlt, border: `1px solid ${t.success}44`, borderRadius: 10, padding: "16px 20px", cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: t.success, marginBottom: 4 }}>🏃 Por Equipe</div>
                <div style={{ fontSize: 12, color: t.textDimmed }}>Agrupa da mesma equipe · sem equipe fica individual</div>
              </button>
            </div>
            <button onClick={() => setModoRecibo(null)} style={{ marginTop: 20, background: "none", border: "none", color: t.textDimmed, cursor: "pointer", fontSize: 13, width: "100%", textAlign: "center" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={s.modoSwitch}>
        <button
          style={{ ...s.modoBtn, ...(!modoCarrinho ? s.modoBtnActive : {}) }}
          onClick={() => setModoCarrinho(false)}>
          📋 Inscrições Salvas
        </button>
        <button
          style={{ ...s.modoBtn, ...(modoCarrinho ? s.modoBtnActive : {}) }}
          onClick={async () => { setModoCarrinho(true); setEtapa("montagem"); }}>
          🛒 Realizar Inscrições
          {carrinho.length > 0 && (
            <span style={{ background: t.accent, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, marginLeft: 6 }}>
              {carrinho.length}
            </span>
          )}
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ABA 1 — INSCRIÇÕES SALVAS                               */}
      {/* ════════════════════════════════════════════════════════ */}
      {!modoCarrinho && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <select value={filtroProva} onChange={e => setFiltroProva(e.target.value)} style={{ ...s.input, maxWidth: 220 }}>
              <option value="">Todas as provas</option>
              {provasUnicas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)} style={{ ...s.input, maxWidth: 160 }}>
              <option value="">Categorias</option>
              {catsUnicas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filtroSexo} onChange={e => setFiltroSexo(e.target.value)} style={{ ...s.input, maxWidth: 120 }}>
              <option value="">Ambos</option>
              <option value="M">Masc</option>
              <option value="F">Fem</option>
            </select>
            <input style={{ ...s.input, maxWidth: 200 }} placeholder="🔍 Nome..." value={filtroNome} onChange={e => setFiltroNome(e.target.value)} />
            {isPrivileg && equipesUnicas.length > 0 && (
              <select value={filtroEquipe} onChange={e => setFiltroEquipe(e.target.value)} style={{ ...s.input, maxWidth: 200 }}>
                <option value="">Todas as equipes</option>
                {equipesUnicas.map(eq => <option key={eq} value={eq}>{eq}</option>)}
              </select>
            )}
            {isPrivileg && (
              <select value={filtroPago} onChange={e => setFiltroPago(e.target.value)} style={{ ...s.input, maxWidth: 140 }}>
                <option value="">Todos</option>
                <option value="pago">✅ Pagos</option>
                <option value="pendente">⏳ Pendentes</option>
              </select>
            )}
          </div>

          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {isPrivileg && (
                    <Th>
                      <input type="checkbox"
                        checked={_porAtletaArr.length > 0 && _porAtletaArr.every(([id]) => selecionadosRecibo.has(id))}
                        onChange={e => setSelecionadosRecibo(e.target.checked ? new Set(_porAtletaArr.map(([id]) => id)) : new Set())}
                        title="Selecionar todos"
                        style={{ cursor: "pointer", width: 14, height: 14 }} />
                    </Th>
                  )}
                  <Th>Nº Peito</Th><Th>CBAt</Th><Th>Atleta</Th><Th>Provas Inscritas</Th><Th>Categoria</Th><Th>Sexo</Th>
                  {isPrivileg && <Th>Equipe</Th>}
                  <Th>Valor</Th><Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {inscsFiltradas.length === 0 ? (
                  <tr><td colSpan={isPrivileg ? 10 : 8} style={{ ...s.td, textAlign: "center", color: t.textDimmed }}>Nenhuma inscrição encontrada.</td></tr>
                ) : (() => {
                  let equipeAtual = null;
                  return porAtletaPag.map(([atletaId, inscs], rowIdx) => {
                    const atl = atletas.find(a => a.id === atletaId);
                    const primeiraInsc = inscs[0];
                    const inscsVisiveis = inscs.filter(i => !i.combinadaId);
                    const equipeNome = primeiraInsc?.equipeCadastro || atl?.clube || "Sem equipe";
                    const peito = numeracaoPeito?.[eid]?.[atletaId];
                    const cat = atl ? getCategoria(atl.anoNasc, anoComp) : null;
                    const precoInfo = calcularPrecoInscricao(atl, cat?.id || null, eventoAtual);
                    const mostrarSeparador = equipeNome !== equipeAtual;
                    if (mostrarSeparador) equipeAtual = equipeNome;
                    return (
                      <React.Fragment key={`saved_${atletaId}_${rowIdx}`}>
                        {mostrarSeparador && isPrivileg && (
                          <tr>
                            <td colSpan={10} style={{ background: t.bgCardAlt, borderBottom: `1px solid ${t.border}`, borderTop: rowIdx > 0 ? `2px solid ${t.accentBorder}` : "none", padding: "6px 16px" }}>
                              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, color: t.accent, letterSpacing: 1, textTransform: "uppercase" }}>
                                🏃 {equipeNome}
                              </span>
                            </td>
                          </tr>
                        )}
                        <tr style={{ ...s.tr, background: selecionadosRecibo.has(atletaId) ? t.accentBg : isPago(inscs) ? t.bgCardAlt : undefined }}>
                          {isPrivileg && (
                            <td style={{ ...s.td, textAlign: "center", verticalAlign: "top" }}>
                              <input type="checkbox"
                                checked={selecionadosRecibo.has(atletaId)}
                                onChange={e => setSelecionadosRecibo(prev => {
                                  const next = new Set(prev);
                                  e.target.checked ? next.add(atletaId) : next.delete(atletaId);
                                  return next;
                                })}
                                style={{ cursor: "pointer", width: 14, height: 14 }} />
                            </td>
                          )}
                          <td style={{ ...s.td, textAlign: "center", verticalAlign: "top" }}>
                            {peito
                              ? <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 18, color: t.warning }}>{peito}</span>
                              : <span style={{ color: t.textDisabled, fontSize: 11 }}>—</span>}
                          </td>
                          <td style={{ ...s.td, verticalAlign: "top", fontSize: 12, color: t.textMuted, fontFamily: "'Barlow Condensed', sans-serif" }}>
                            {_getCbat(atl) || <span style={{ color: t.textDisabled }}>—</span>}
                          </td>
                          <td style={{ ...s.td, fontWeight: 600, color: t.textPrimary, verticalAlign: "top" }}>{atl?.nome || "—"}</td>
                          <td style={{ ...s.td, verticalAlign: "top" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {inscsVisiveis.map(insc => {
                                const prv = todasAsProvas().find(p => p.id === insc.provaId);
                                return (
                                  <span key={insc.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: t.bgCardAlt, border: `1px solid ${t.border}`, color: t.textSecondary }}>
                                    {prv?.nome || insc.provaId}
                                    {(isPrivileg || (isEquipeUsuario && inscricoesAbertas)) && (
                                      <button onClick={() => handleExcluir(insc)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: t.danger, fontSize: 10, padding: "0 2px" }}
                                        title="Remover">✕</button>
                                    )}
                                    {isPrivileg && (
                                      <button onClick={() => handleTrocarProva(insc)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, fontSize: 10, padding: "0 2px" }}
                                        title="Trocar prova">⇄</button>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                            <div style={{ fontSize: 11, color: t.textDimmed, marginTop: 4 }}>{inscsVisiveis.length} prova(s)</div>
                          </td>
                          <td style={{ ...s.td, verticalAlign: "top" }}>
                            <span style={s.badgeGold}>{primeiraInsc.categoria || "—"}</span>
                          </td>
                          <td style={{ ...s.td, textAlign: "center", verticalAlign: "top" }}>
                            <span style={s.badge(primeiraInsc.sexo === "M" ? "#1a6ef5" : "#e54f9b")}>
                              {primeiraInsc.sexo === "M" ? "Masc" : "Fem"}
                            </span>
                          </td>
                          {isPrivileg && (
                            <td style={{ ...s.td, verticalAlign: "top" }}>{equipeNome}</td>
                          )}
                          <td style={{ ...s.td, verticalAlign: "top", textAlign: "right" }}>
                            {precoInfo?.preco != null
                              ? <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 15, color: t.success }}>{formatarPreco(precoInfo.preco)}</span>
                              : <span style={{ color: t.textDimmed, fontSize: 11 }}>Gratuito</span>}
                          </td>
                          <td style={{ ...s.td, whiteSpace: "nowrap", verticalAlign: "top" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              {/* Toggle pago — só admin/org */}
                              {isPrivileg && (
                                <button
                                  onClick={() => togglePago(inscs, atl)}
                                  style={{ ...s.btnGhost, fontSize: 11, padding: "3px 10px",
                                    color: isPago(inscs) ? t.success : t.textMuted,
                                    borderColor: isPago(inscs) ? `${t.success}44` : t.borderLight,
                                    background: isPago(inscs) ? t.bgCardAlt : "transparent" }}>
                                  {isPago(inscs) ? "✅ Pago" : "⏳ Pendente"}
                                </button>
                              )}
                              {/* Excluir — admin/org sempre; equipe só com inscrições abertas */}
                              {(isPrivileg || (isEquipeUsuario && inscricoesAbertas)) && (
                                <button onClick={async () => {
                                  if (await confirmar(`Remover TODAS as ${inscsVisiveis.length} inscrições de ${atl?.nome || "atleta"}?`)) {
                                    inscs.forEach(i => excluirInscricao(i.id, { confirmado: true }));
                                    setFeedback(`✅ Todas as inscrições de ${atl?.nome} removidas`);
                                    setTimeout(() => setFeedback(""), 3000);
                                  }
                                }} style={{ ...s.btnGhost, fontSize: 11, padding: "3px 8px", color: t.danger, borderColor: `${t.danger}44` }}>
                                  🗑️ Remover
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
            <PaginaControles {...inscsInfo} />
          </div>

          {/* ── Resumo financeiro por equipe ──────────────────────────────── */}
          {Object.keys(resumoFinanceiro.porEquipe).length > 0 && (
            <div style={{ marginTop: 24, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: t.textPrimary, letterSpacing: 1, marginBottom: 16 }}>
                💰 RESUMO FINANCEIRO
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {Object.entries(resumoFinanceiro.porEquipe).map(([equipe, dados]) => (
                  <div key={equipe} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: t.bgCardAlt, borderRadius: 8, border: `1px solid ${t.border}` }}>
                    <div>
                      <span style={{ fontWeight: 600, color: t.textPrimary, fontSize: 13 }}>{equipe}</span>
                      <span style={{ color: t.textDimmed, fontSize: 12, marginLeft: 10 }}>{dados.atletas} atleta(s)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {isPrivileg && dados.pago > 0 && <span style={{ fontSize: 11, color: t.success }}>✅ {formatarPreco(dados.pago)}</span>}
                      {isPrivileg && dados.valor - dados.pago > 0 && <span style={{ fontSize: 11, color: t.warning }}>⏳ {formatarPreco(dados.valor - dados.pago)}</span>}
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: dados.valor > 0 ? t.success : t.textDisabled }}>
                        {dados.valor > 0 ? formatarPreco(dados.valor) : "Gratuito"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {resumoFinanceiro.totalGlobalSalvo > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: t.bgCardAlt, borderRadius: 8, border: `1px solid ${t.success}44` }}>
                  <div>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14, color: t.success, letterSpacing: 1 }}>TOTAL</span>
                    <span style={{ color: t.textDimmed, fontSize: 12, marginLeft: 10 }}>{_porAtletaArr.length} atleta(s)</span>
                    {isPrivileg && (
                      <div style={{ marginTop: 4, display: "flex", gap: 12 }}>
                        <span style={{ fontSize: 11, color: t.success }}>✅ Pago: {formatarPreco(resumoFinanceiro.totalPago)}</span>
                        <span style={{ fontSize: 11, color: t.warning }}>⏳ Pendente: {formatarPreco(resumoFinanceiro.totalGlobalSalvo - resumoFinanceiro.totalPago)}</span>
                      </div>
                    )}
                  </div>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 24, color: t.success }}>
                    {formatarPreco(resumoFinanceiro.totalGlobalSalvo)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Revezamento — sem custo */}
          {provasRevez.length > 0 && (
            <div style={{ marginTop: 28, padding: 16, background: t.bgHeaderSolid, border: `1px solid ${t.accentBorder}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ color: t.accent, fontSize: 17, margin: 0, fontFamily: "'Barlow Condensed', sans-serif" }}>🏃‍♂️ Revezamentos</h2>
                <p style={{ color: t.textMuted, fontSize: 13, marginTop: 4 }}>
                  {inscsRevez.length > 0 ? `${inscsRevez.length} equipe(s) inscrita(s)` : "Nenhuma equipe inscrita ainda"}
                  <span style={{ color: t.success, marginLeft: 8, fontSize: 12, fontWeight: 600 }}>· Sem custo adicional</span>
                </p>
                <p style={{ color: t.textDimmed, fontSize: 12, marginTop: 2 }}>
                  O revezamento é composto por atletas já inscritos no evento — nenhum valor extra é cobrado.
                </p>
              </div>
              <button style={s.btnSecondary} onClick={() => setTela("inscricao-revezamento")}>
                Gerenciar Revezamentos →
              </button>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ABA 2 — NOVO LOTE                                        */}
      {/* ════════════════════════════════════════════════════════ */}
      {modoCarrinho && (
        <>
          {/* ── ETAPA: MONTAGEM ── */}
          {etapa === "montagem" && (
            <>
              {/* ── Painel interativo de seleção ── */}
              <div style={{ background: t.accentBg, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, color: t.accent, marginBottom: 14 }}>
                  ➕ Selecionar atleta e provas
                </div>

                {/* Seletor de atleta */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", color: t.textTertiary, fontSize: 12, marginBottom: 6 }}>ATLETA</label>
                  <select
                    value={inserirAtletaId}
                    onChange={e => { setInserirAtletaId(e.target.value); setInserirProvasIds(new Set()); }}
                    style={{ ...s.input, marginBottom: 0, maxWidth: 400 }}>
                    <option value="">Selecione o atleta...</option>
                    {todosAtletas.map(a => {
                      const eq = equipes?.find(e => e.id === a.equipeId);
                      const cat = getCategoria(a.anoNasc, anoComp);
                      return (
                        <option key={a.id} value={a.id}>
                          {a.nome} · {a.sexo === "M" ? "Masc" : "Fem"} · {cat?.nome || "—"}{eq ? ` · ${eq.sigla || eq.nome}` : a.clube ? ` · ${a.clube}` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Chips de provas — só aparecem após selecionar atleta */}
                {inserirAtletaId && (() => {
                  const atl = atletas.find(a => a.id === inserirAtletaId);
                  if (!atl) return null;
                  const cat = getCategoria(atl.anoNasc, anoComp);
                  const idadeAtleta = anoComp - parseInt(atl.anoNasc);

                  // Provas disponíveis: mesmo sexo, não revezamento
                  const provasDoAtleta = provasProg.filter(p => {
                    if (p.tipo === "revezamento") return false;
                    if (!p.id.startsWith(atl.sexo + "_")) return false;
                    // Verificar categoria da prova
                    const catProvaId = p.id.split("_")[1] || "";
                    if (!cat) return true;
                    const mesmaCat = catProvaId === cat.id;
                    const permissividade = eventoAtual.permissividadeNorma
                      ? getPermissividade(atl.anoNasc, anoComp, catProvaId)
                      : null;
                    const superiorOk = podeCategoriaSuperior(eventoAtual, idadeAtleta, cat.id, catProvaId);
                    return mesmaCat || permissividade || superiorOk;
                  });

                  if (provasDoAtleta.length === 0) return (
                    <div style={{ color: t.textDimmed, fontSize: 13, padding: "10px 0" }}>
                      Nenhuma prova disponível para a categoria deste atleta.
                    </div>
                  );

                  // Agrupar por grupo
                  const grupos = {};
                  provasDoAtleta.forEach(p => {
                    const g = p.grupo || "Outras";
                    if (!grupos[g]) grupos[g] = [];
                    grupos[g].push(p);
                  });

                  // Calcular limite e quanto já foi usado
                  const limite = getLimiteCat(eventoAtual, cat?.id || null);
                  const jaInscritas = inscsEvt.filter(i => i.atletaId === inserirAtletaId && !i.combinadaId && i.tipo !== "revezamento").length;
                  const jaNoLoteAtleta = carrinho.filter(c => c.atletaId === inserirAtletaId).length;
                  const selecionadas = inserirProvasIds.size;
                  const usadas = jaInscritas + jaNoLoteAtleta + selecionadas;
                  const restam = limite > 0 ? limite - jaInscritas - jaNoLoteAtleta : Infinity;
                  const limiteAtingido = limite > 0 && (jaInscritas + jaNoLoteAtleta + selecionadas) >= limite;

                  // Norma 12 CBAt — restrições Sub-14
                  const inscsComCarrinhoUI = [
                    ...inscsEvt,
                    ...carrinho.filter(c => c.atletaId === inserirAtletaId).map(c => ({
                      eventoId: eventoAtual.id, atletaId: inserirAtletaId, provaId: c.provaId,
                    })),
                  ];
                  const norma12 = getRestricoesNorma12(eventoAtual, inscsComCarrinhoUI, inserirAtletaId, cat?.id || null, [...inserirProvasIds], provasDoAtleta);
                  const norma12Ativa = eventoAtual.aplicarNorma12Sub14 && cat?.id === "sub14";

                  return (
                    <div>
                      {/* Banner Norma 12 */}
                      {norma12Ativa && (
                        <div style={{
                          display:"flex", alignItems:"center", gap:10, padding:"8px 14px", borderRadius:8, marginBottom:10,
                          background: `${t.warning}12`, border: `1px solid ${t.warning}33`,
                          fontSize:11, color: t.warning, lineHeight:1.5,
                        }}>
                          <span style={{ fontSize:14, flexShrink:0 }}>⚖</span>
                          <span><strong>Norma 12 CBAt</strong> — Máximo 2 provas individuais de grupos diferentes, ou somente Tetratlo.</span>
                        </div>
                      )}
                      {/* Cabeçalho com categoria e limite */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: t.textTertiary, textTransform: "uppercase", letterSpacing: 1 }}>PROVAS DISPONÍVEIS</span>
                        <span style={{ fontSize: 12, color: t.accent, fontWeight: 700 }}>{cat?.nome || "—"}</span>
                        {limite > 0 && (
                          <span style={{
                            fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "3px 12px",
                            background: limiteAtingido ? `${t.danger}15` : t.accentBg,
                            border: `1px solid ${limiteAtingido ? `${t.danger}44` : t.accentBorder}`,
                            color: limiteAtingido ? t.danger : t.accent,
                          }}>
                            {limiteAtingido
                              ? `🔒 Limite atingido (${limite} prova${limite !== 1 ? "s" : ""})`
                              : `📋 Limite: ${usadas}/${limite} — restam ${restam}`}
                          </span>
                        )}
                        {selecionadas > 0 && (
                          <button
                            style={{ ...s.btnPrimary, padding: "7px 20px", fontSize: 13, marginLeft: "auto" }}
                            onClick={handleAdicionarAoCarrinho}>
                            + Adicionar {selecionadas} prova{selecionadas !== 1 ? "s" : ""} ao lote
                          </button>
                        )}
                      </div>

                      {/* Chips agrupados */}
                      {Object.entries(grupos).map(([grupo, provas]) => (
                        <div key={grupo} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, color: t.textDimmed, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                            {grupo}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {provas.map(p => {
                              const jaInscrito  = inscsEvt.some(i => i.atletaId === inserirAtletaId && i.provaId === p.id && !i.combinadaId);
                              const jaNoLote    = carrinho.some(c => c.atletaId === inserirAtletaId && c.provaId === p.id);
                              const selecionada = inserirProvasIds.has(p.id);
                              const norma12Bloq = norma12.desabilitadas.get(p.id);
                              const bloqueada   = jaInscrito || jaNoLote || (limiteAtingido && !selecionada) || (!!norma12Bloq && !selecionada);

                              let chipStyle = {
                                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                                cursor: bloqueada ? "not-allowed" : "pointer",
                                fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5,
                                transition: "all 0.15s", border: "1px solid",
                                opacity: bloqueada ? 0.45 : 1,
                              };

                              if (jaInscrito) {
                                chipStyle = { ...chipStyle, background: `${t.success}15`, borderColor: `${t.success}44`, color: t.success };
                              } else if (jaNoLote) {
                                chipStyle = { ...chipStyle, background: `${t.warning}15`, borderColor: `${t.warning}44`, color: t.warning };
                              } else if (selecionada) {
                                chipStyle = { ...chipStyle, background: t.accentBg, borderColor: t.accent, color: t.accent, boxShadow: `0 0 0 2px ${t.accentBorder}` };
                              } else {
                                chipStyle = { ...chipStyle, background: t.bgCardAlt, borderColor: t.border, color: t.textMuted };
                              }

                              const toggle = () => {
                                if (bloqueada) return;
                                setInserirProvasIds(prev => {
                                  const next = new Set(prev);
                                  if (next.has(p.id)) next.delete(p.id);
                                  else next.add(p.id);
                                  return next;
                                });
                              };

                              return (
                                <button key={p.id} style={chipStyle} onClick={toggle}
                                  title={jaInscrito ? "Já inscrito" : jaNoLote ? "Já no lote" : norma12Bloq ? norma12Bloq : bloqueada ? "Limite atingido" : "Clique para selecionar"}>
                                  {jaInscrito ? "✓ " : jaNoLote ? "🛒 " : selecionada ? "✔ " : ""}{p.nome}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      <div style={{ marginTop: 8, fontSize: 11, color: t.textDisabled, display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <span><span style={{ color: t.success }}>✓</span> já inscrito</span>
                        <span><span style={{ color: t.warning }}>🛒</span> já no lote</span>
                        <span><span style={{ color: t.accent }}>✔</span> selecionado agora</span>
                      </div>
                    </div>
                  );
                })()}

                {!inserirAtletaId && (
                  <div style={{ color: t.textDimmed, fontSize: 13, padding: "8px 0" }}>
                    👆 Selecione um atleta para ver as provas disponíveis para a categoria dele.
                  </div>
                )}
                <div style={{ marginTop: 12, fontSize: 12, color: t.textDisabled }}>
                  💡 Revezamentos não aparecem — são compostos por atletas já inscritos, sem custo adicional.
                </div>
              </div>

              {carrinho.length === 0 ? (
                <div style={s.emptyState}>
                  <span style={{ fontSize: 36 }}>🛒</span>
                  <p>Nenhum atleta adicionado ao lote.</p>
                  <p style={{ fontSize: 13 }}>Selecione atleta e prova acima.</p>
                </div>
              ) : (
                <>
                  <div style={s.tableWrap}>
                    <table style={s.table}>
                      <thead>
                        <tr>
                          <Th>Atleta</Th>
                          <Th>Categoria</Th>
                          <Th>Provas no Lote</Th>
                          {temPreco && <Th style={{ textAlign: "right" }}>Valor</Th>}
                          <Th></Th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumoCarrinho.map((r, rowIdx) => (
                          <tr key={`cart_${r.atletaId}_${rowIdx}`} style={s.tr}>
                            <td style={{ ...s.td, fontWeight: 600, color: t.textPrimary }}>{r.atletaNome}</td>
                            <td style={s.td}><span style={s.badgeGold}>{r.catNome}</span></td>
                            <td style={s.td}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {r.provas.map((item, iIdx) => (
                                  <span key={`${item.provaId}_${iIdx}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${t.success}15`, border: `1px solid ${t.success}44`, color: t.success }}>
                                    {item.provaNome}
                                    <button onClick={() => removerDoCarrinho(item.atletaId, item.provaId)}
                                      style={{ background: "none", border: "none", cursor: "pointer", color: t.danger, fontSize: 10, padding: "0 2px" }}>✕</button>
                                  </span>
                                ))}
                              </div>
                            </td>
                            {temPreco && (
                              <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                                {r.jaTemInscricao ? (
                                  <span style={{ fontSize: 11, color: t.textDimmed, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 6, padding: "3px 8px" }}>
                                    Já inscrito
                                  </span>
                                ) : r.precoInfo?.preco != null ? (
                                  <div>
                                    <strong style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, color: t.success }}>
                                      {formatarPreco(r.precoInfo?.preco)}
                                    </strong>
                                    <div style={{ fontSize: 10, color: t.textDimmed, marginTop: 1 }}>
                                      {r.precoInfo?.tipo === "comEquipe" ? "🏛️ com equipe" :
                                       r.precoInfo?.tipo === "semEquipe" ? "👤 sem equipe" :
                                       r.precoInfo?.tipo === "global"    ? "🌐 valor geral" : ""}
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: 11, color: t.textDimmed, fontStyle: "italic" }}>Gratuito</span>
                                )}
                              </td>
                            )}
                            <td style={s.td}>
                              <button onClick={() => setCarrinho(c => c.filter(x => x.atletaId !== r.atletaId))}
                                style={{ ...s.btnGhost, fontSize: 11, padding: "3px 8px", color: t.danger, borderColor: `${t.danger}44` }}>
                                🗑️ Remover
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {temPrecoConfig && totalGeral > 0 && (
                        <tfoot>
                          <tr>
                            <td colSpan={3} style={{ padding: "10px 16px", borderTop: `1px solid ${t.accentBorder}`, color: t.textMuted, fontSize: 12, fontWeight: 600 }}>
                              SUBTOTAL DO LOTE ({resumoCarrinho.filter(r => r.valorCobrar > 0).length} atleta{resumoCarrinho.filter(r => r.valorCobrar > 0).length !== 1 ? "s" : ""} a cobrar)
                            </td>
                            <td style={{ padding: "10px 16px", borderTop: `1px solid ${t.accentBorder}`, textAlign: "right" }}>
                              <strong style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, color: t.success }}>
                                {formatarPreco(totalGeral)}
                              </strong>
                            </td>
                            <td style={{ borderTop: `1px solid ${t.accentBorder}` }}></td>
                          </tr>
                          {eventoAtual.formaPagamento && (
                            <tr>
                              <td colSpan={5} style={{ padding: "6px 16px 10px", fontSize: 11, color: t.textDimmed }}>
                                Pagamento via <strong style={{ color: t.textTertiary }}>{eventoAtual.formaPagamento}</strong>
                                {eventoAtual.orientacaoPagamento && (
                                  <span style={{ marginLeft: 8, color: t.textDisabled }}>· {eventoAtual.orientacaoPagamento.slice(0, 80)}{eventoAtual.orientacaoPagamento.length > 80 ? "…" : ""}</span>
                                )}
                              </td>
                            </tr>
                          )}
                        </tfoot>
                      )}
                    </table>
                  </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
                    <button style={s.btnGhost} onClick={() => setCarrinho([])}>🗑 Limpar lote</button>
                    <button style={s.btnPrimary} onClick={() => setEtapa("confirmacao")}>
                      Revisar e Confirmar ({carrinho.length}) →
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── ETAPA: CONFIRMAÇÃO ── */}
          {etapa === "confirmacao" && (
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: t.textPrimary, marginBottom: 4 }}>
                  📋 Revisão do Lote
                </div>
                <div style={{ color: t.textDimmed, fontSize: 13, marginBottom: 24 }}>
                  {eventoAtual.nome} · {carrinho.length} inscrição(ões) para {resumoCarrinho.length} atleta(s)
                </div>

                {resumoCarrinho.map((r, rIdx) => (
                  <div key={`rev_${r.atletaId}_${rIdx}`} style={{ background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 15 }}>{r.atletaNome}</div>
                        <div style={{ fontSize: 12, color: t.textDimmed, marginTop: 2 }}>{r.catNome}</div>
                      </div>
                      {temPreco && (
                        <div style={{ textAlign: "right" }}>
                          {r.jaTemInscricao ? (
                            <div>
                              <span style={{ fontSize: 12, color: t.textMuted, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 6, padding: "3px 10px" }}>
                                Já inscrito
                              </span>
                              <div style={{ fontSize: 10, color: t.textDisabled, marginTop: 3 }}>sem cobrança adicional</div>
                            </div>
                          ) : r.precoInfo?.preco != null ? (
                            <div>
                              <strong style={{ color: t.success, fontSize: 22, fontFamily: "'Barlow Condensed', sans-serif" }}>
                                {formatarPreco(r.precoInfo?.preco)}
                              </strong>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                                {r.precoInfo?.tipo === "comEquipe" && (
                                  <span style={{ fontSize: 10, background: `${t.success}15`, border: `1px solid ${t.success}44`, color: t.success, borderRadius: 4, padding: "1px 6px" }}>
                                    🏛️ atleta federado
                                  </span>
                                )}
                                {r.precoInfo?.tipo === "semEquipe" && (
                                  <span style={{ fontSize: 10, background: `${t.warning}15`, border: `1px solid ${t.warning}44`, color: t.warning, borderRadius: 4, padding: "1px 6px" }}>
                                    👤 atleta não federado
                                  </span>
                                )}
                                {r.precoInfo?.tipo === "global" && (
                                  <span style={{ fontSize: 10, background: t.accentBg, border: `1px solid ${t.accentBorder}`, color: t.accent, borderRadius: 4, padding: "1px 6px" }}>
                                    🌐 valor geral
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: t.textDimmed, fontStyle: "italic" }}>Gratuito</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
                      {r.provas.map((p, pIdx) => (
                        <span key={`${p.provaId}_${pIdx}`} style={{ background: `${t.success}15`, border: `1px solid ${t.success}44`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: t.success }}>
                          ✓ {p.provaNome}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Total */}
                {temPrecoConfig && (
                  <div style={{ background: t.accentBg, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: "16px 20px", marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: t.textPrimary, fontSize: 15 }}>💰 Total do lote</span>
                      <strong style={{ color: t.success, fontSize: 26, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {totalGeral > 0 ? formatarPreco(totalGeral) : "—"}
                      </strong>
                    </div>
                    {totalGeral > 0 && eventoAtual.formaPagamento && (
                      <div style={{ fontSize: 13, color: t.textTertiary, borderTop: `1px solid ${t.border}`, paddingTop: 8 }}>
                        <span style={{ color: t.textMuted }}>Pagamento via </span>
                        <strong style={{ color: t.textPrimary }}>{eventoAtual.formaPagamento}</strong>
                      </div>
                    )}
                    {totalGeral > 0 && eventoAtual.orientacaoPagamento && (
                      <div style={{ marginTop: 8, fontSize: 12, color: t.textTertiary, whiteSpace: "pre-wrap", lineHeight: 1.6, background: t.bgCardAlt, borderRadius: 8, padding: "8px 12px" }}>
                        {eventoAtual.orientacaoPagamento}
                      </div>
                    )}
                    {totalGeral === 0 && (
                      <div style={{ fontSize: 12, color: t.textDimmed }}>
                        Todos os atletas já têm inscrição neste evento — nenhum valor a cobrar.
                      </div>
                    )}
                    {/* Aviso revezamento */}
                    {provasRevez.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: t.success, borderTop: `1px solid ${t.border}`, paddingTop: 8 }}>
                        ✔ Revezamentos não entram neste cálculo — sem custo adicional para atletas já inscritos.
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "space-between", flexWrap: "wrap" }}>
                  <button style={s.btnGhost} onClick={() => setEtapa("montagem")}>← Voltar e editar</button>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button style={{ ...s.btnGhost, borderColor: t.accentBorder, color: t.accent }} onClick={imprimirLote}>
                      🖨️ Imprimir detalhamento
                    </button>
                    <button
                      style={{ ...s.btnPrimary, background: `linear-gradient(135deg, ${t.success}, ${t.success}cc)`, fontSize: 16, padding: "14px 32px", opacity: confirmando ? 0.5 : 1 }}
                      onClick={handleConfirmar} disabled={confirmando}>
                      {confirmando ? "Inscrevendo..." : `✅ Confirmar ${carrinho.length} inscrição${carrinho.length !== 1 ? "ões" : ""}`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ETAPA: CONCLUÍDO ── */}
          {etapa === "concluido" && (
            <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 40 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, color: t.success, marginBottom: 8 }}>
                  Lote confirmado!
                </div>
                <div style={{ color: t.textMuted, fontSize: 14, marginBottom: 24 }}>
                  {carrinho.length} inscrição{carrinho.length !== 1 ? "ões" : ""} registrada{carrinho.length !== 1 ? "s" : ""} com sucesso.
                </div>

                {/* Resumo financeiro final */}
                {temPreco && totalGeral > 0 && (
                  <div style={{ background: t.accentBg, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: "16px 18px", marginBottom: 24, textAlign: "left" }}>
                    <div style={{ fontWeight: 700, color: t.accent, fontSize: 13, marginBottom: 10 }}>💳 Resumo de Pagamento</div>
                    {resumoCarrinho.filter(r => r.valorCobrar > 0).map((r, rIdx) => (
                      <div key={`fin_${r.atletaId}_${rIdx}`} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${t.border}`, fontSize: 13 }}>
                        <span style={{ color: t.textSecondary }}>{r.atletaNome}</span>
                        <strong style={{ color: t.success }}>{formatarPreco(r.valorCobrar)}</strong>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 15 }}>
                      <strong style={{ color: t.textPrimary }}>Total</strong>
                      <strong style={{ color: t.success, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22 }}>
                        {formatarPreco(totalGeral)}
                      </strong>
                    </div>
                    {eventoAtual.formaPagamento && (
                      <div style={{ fontSize: 12, color: t.textDimmed, marginTop: 6 }}>
                        Pagamento via {eventoAtual.formaPagamento}
                      </div>
                    )}
                    {eventoAtual.orientacaoPagamento && (
                      <div style={{ marginTop: 8, fontSize: 12, color: t.textTertiary, whiteSpace: "pre-wrap", lineHeight: 1.6, background: t.bgCardAlt, borderRadius: 6, padding: "6px 10px" }}>
                        {eventoAtual.orientacaoPagamento}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
                  <button style={{ ...s.btnGhost, borderColor: t.accentBorder, color: t.accent }} onClick={imprimirLote}>
                    🖨️ Imprimir detalhamento
                  </button>
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button style={s.btnPrimary} onClick={resetCarrinho}>+ Realizar Inscrições</button>
                  <button style={s.btnGhost} onClick={async () => { resetCarrinho(); setModoCarrinho(false); }}>
                    Ver Inscrições Salvas
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TelaGestaoInscricoes;
