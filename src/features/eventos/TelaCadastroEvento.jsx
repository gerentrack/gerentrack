import React, { useState, useEffect, useRef } from "react";
import { todasAsProvas, getComposicaoCombinada } from "../../shared/athletics/provasDef";
import { CATEGORIAS, ESTADOS_BR, getCategoria } from "../../shared/constants/categorias";
import { calcularEtapa, getEtapaLabel } from "../../shared/constants/etapas";
import FormField from "../ui/FormField";
import { storage, storageRef, uploadBytes, getDownloadURL, deleteObject } from "../../firebase";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import CortarImagem from "../../shared/CortarImagem";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";
import RichTextEditor from "../ui/RichTextEditor";
import { canCreateEvent } from "../../shared/engines/planEngine";

// Extrai o path do Storage a partir de uma download URL do Firebase
function extrairPathDoUrl(url) {
  if (!url) return null;
  try {
    const match = url.match(/\/o\/(.+?)(\?|$)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
}

/** Gera slug seguro para path do Storage */
function slugifyPath(str) {
  return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "sem-nome";
}

// Faz upload da imagem para Firebase Storage e retorna a URL pública
// IMPORTANTE: deleta o arquivo anterior SOMENTE após upload bem-sucedido,
// para não perder a imagem se o upload falhar.
async function uploadLogo(file, pastaEvento, campo, urlAnterior) {
  const ext = file.name?.split(".")?.pop() || "png";
  const path = `logos/${pastaEvento}/${campo}.${ext}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  const url = await getDownloadURL(ref);
  // Só deleta o anterior após upload confirmado
  if (urlAnterior) {
    const pathAnt = extrairPathDoUrl(urlAnterior);
    // Não deletar se é o mesmo path (mesma extensão → mesmo arquivo sobrescrito)
    if (pathAnt && pathAnt !== path) { try { await deleteObject(storageRef(storage, pathAnt)); } catch {} }
  }
  return url;
}

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
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textDimmed,
    border: `1px solid ${status === "ao_vivo" ? t.danger+"44" : status === "hoje_pre" ? t.accentBorder : status === "futuro" ? t.success+"44" : t.border}`,
  }),
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: t.textPrimary, fontFamily: t.fontBody, fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
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
  modoSwitch: { display: "flex", gap: 0, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: t.textDimmed, padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: t.fontBody, transition: "all 0.2s" },
  modoBtnActive: { background: t.bgInput, color: t.accent },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: t.fontBody, transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: t.bgHover, border: `1px solid ${t.accent}`, color: t.accent },
  grupoProvasBox: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 16, overflow: "hidden" },
  grupoProvasHeader: { background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  provaCheckBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: t.fontBody, lineHeight: 1.4, userSelect: "none" },
  provaCheckBtnSel: { background: t.bgHover, border: `1px solid ${t.accent}`, color: t.accent },
};
}

// ─── CADASTRO / EDIÇÃO DE EVENTO ─────────────────────────────────────────────
// ── Acordeão extraído fora do componente para evitar re-render/perda de foco ──
function Acordeao({ keyName, titulo, icone, resumo, children, aberto, onToggle }) {
  const t = useTema();
  return (
    <div style={{ background:t.bgHeaderSolid, border:`1px solid ${aberto ? t.accentBorder : t.border}`, borderRadius:10, marginBottom:12, overflow:"hidden", transition:"border-color 0.2s" }}>
      <button type="button" onClick={() => onToggle(keyName)}
        style={{ width:"100%", background:"transparent", border:"none", padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", textAlign:"left", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
          <span style={{ fontSize:18 }}>{icone}</span>
          <span style={{ color: t.accent, fontWeight:700, fontSize:14 }}>{titulo}</span>
          {!aberto && <span style={{ color: t.textDimmed, fontSize:12, marginLeft:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{resumo}</span>}
        </div>
        <span style={{ color: t.textDimmed, fontSize:14, flexShrink:0, transform: aberto ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 0.2s", display:"inline-block" }}>▾</span>
      </button>
      {aberto && (
        <div style={{ padding:"0 18px 18px" }}>
          {children}
        </div>
      )}
    </div>
  );
}


function TelaCadastroEvento() {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { usuarioLogado } = useAuth();
  const { adicionarEvento, editarEvento, atualizarCamposEvento, eventoAtual, eventoAtualId, selecionarEvento, recordes, equipes, inscricoes, atletas, eventos } = useEvento();
  const { setTela, organizadores, cadEventoGoStep, setCadEventoGoStep, registrarAcao } = useApp();
  const editando = eventoAtual && eventoAtualId && true;
  const tipoEvt = usuarioLogado?.tipo;
  if (tipoEvt !== "admin" && tipoEvt !== "organizador" && tipoEvt !== "funcionario") return (
    <div style={s.page}><div style={s.emptyState}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={t.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
      <p style={{ color: t.danger, fontWeight: 700 }}>Acesso não autorizado</p>
      <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
    </div></div>
  );

  // Bloqueio de criação se sem plano/créditos (admin bypassa)
  if (!editando && tipoEvt !== "admin") {
    const orgId = tipoEvt === "organizador" ? usuarioLogado?.id : usuarioLogado?.organizadorId;
    const org = organizadores?.find(o => o.id === orgId);
    if (org) {
      const check = canCreateEvent(org, eventos);
      if (!check.allowed) return (
        <div style={s.page}>
          <div style={{ background: `${t.danger}10`, border: `2px solid ${t.danger}`, borderRadius: 12, padding: "28px 24px", maxWidth: 500, margin: "60px auto", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: t.danger, fontFamily: t.fontTitle, marginBottom: 8 }}>Limite de competições</div>
            <div style={{ fontSize: 14, color: t.textSecondary, lineHeight: 1.7, marginBottom: 16 }}>{check.reason}</div>
            <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>Entre em contato: <span style={{ color: t.accent }}>atendimento@gerentrack.com.br</span></div>
            <button style={s.btnGhost} onClick={() => setTela("painel-organizador")}>← Voltar ao Painel</button>
          </div>
        </div>
      );
    }
  }

  // Bloqueio de edição se competição pertence a outro organizador
  if (editando && tipoEvt === "organizador" && eventoAtual.organizadorId !== usuarioLogado?.id) return (
    <div style={s.page}><div style={s.emptyState}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={t.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
      <p style={{ color: t.danger, fontWeight: 700, fontSize: 18 }}>Acesso não autorizado</p>
      <p style={{ color: t.textMuted, fontSize: 14, maxWidth: 400, textAlign: "center", lineHeight: 1.6 }}>
        Esta competição pertence a outro organizador. Você não tem permissão para editá-la.
      </p>
      <button style={s.btnGhost} onClick={() => setTela("painel-organizador")}>← Voltar ao Painel</button>
    </div></div>
  );

  // Bloqueio de edição se funcionário e competição pertence a outro organizador
  if (editando && tipoEvt === "funcionario" && eventoAtual.organizadorId !== usuarioLogado?.organizadorId) return (
    <div style={s.page}><div style={s.emptyState}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={t.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
      <p style={{ color: t.danger, fontWeight: 700, fontSize: 18 }}>Acesso não autorizado</p>
      <p style={{ color: t.textMuted, fontSize: 14, maxWidth: 400, textAlign: "center", lineHeight: 1.6 }}>
        Esta competição pertence a outro organizador. Você não tem permissão para editá-la.
      </p>
      <button style={s.btnGhost} onClick={() => setTela("painel-organizador")}>← Voltar ao Painel</button>
    </div></div>
  );

  // Bloqueio de edição se competição finalizada
  if (editando && eventoAtual.competicaoFinalizada) return (
    <div style={s.page}><div style={s.emptyState}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={t.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      <p style={{ color: t.danger, fontWeight: 700, fontSize: 18 }}>Competição Finalizada</p>
      <p style={{ color: t.textMuted, fontSize: 14, maxWidth: 400, textAlign: "center", lineHeight: 1.6 }}>
        Esta competição foi finalizada{eventoAtual.competicaoFinalizadaEm ? ` em ${new Date(eventoAtual.competicaoFinalizadaEm).toLocaleString("pt-BR")}` : ""}
        {eventoAtual.competicaoFinalizadaPor ? ` por ${eventoAtual.competicaoFinalizadaPor}` : ""}.
        <br/><br/>
        Os dados estão <strong style={{ color: t.danger }}>bloqueados para edição</strong>.
        Para desbloquear, solicite autorização a um <strong style={{ color: t.accent }}>administrador</strong>.
      </p>
      <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar à Competição</button>
    </div></div>
  );

  const [form, setForm] = useState(() => {
    const base = editando ? { ...eventoAtual } : {
      nome: "", data: "", dataFim: "", local: "", cidade: "", uf: "", descricao: "", permissividadeNorma: false,
      permiteSub16CategoriasSup: false, revezamentoInscAntecipada: true,
      inscricoesEncerradas: false, sumulaLiberada: false,
      dataAberturaInscricoes: "", horaAberturaInscricoes: "", dataEncerramentoInscricoes: "", horaEncerramentoInscricoes: "",
      provasPrograma: [],
      programaHorario: {},
      modoHorario: "detalhado",
      programaOrdem: [],
      programaPausa: { horario: "", retorno: "", descricao: "" },
      organizadorId: usuarioLogado?.tipo === "organizador" ? usuarioLogado.id : "",
      orgsAutorizadas: [],
    };
    if (!("dataAberturaInscricoes" in base)) base.dataAberturaInscricoes = "";
    if (!("horaAberturaInscricoes" in base)) base.horaAberturaInscricoes = "";
    if (!("dataEncerramentoInscricoes" in base)) base.dataEncerramentoInscricoes = "";
    if (!("horaEncerramentoInscricoes" in base)) base.horaEncerramentoInscricoes = "";
    if (!("descricao" in base)) base.descricao = "";
    if (!("orgsAutorizadas" in base)) base.orgsAutorizadas = [];
    if (!("programaHorario" in base)) {
      const prog = {};
      const oldH = base.horariosProvas || {};
      const oldF = base.fasesProvas || {};
      const allKeys = new Set([...Object.keys(oldH), ...Object.keys(oldF)]);
      allKeys.forEach(id => {
        prog[id] = [{ fase: oldF[id] || "", horario: oldH[id] || "" }];
      });
      base.programaHorario = prog;
    }
    if (!("programaPausa" in base)) base.programaPausa = { horario: "", retorno: "", descricao: "" };
    // Migrar formato legado para per-day quando evento tem 2 dias
    if (base.programaPausa && base.programaPausa.horario && !base.programaPausa.dia1 && base.dataFim && base.dataFim !== base.data) {
      const legado = { horario: base.programaPausa.horario, retorno: base.programaPausa.retorno || "", descricao: base.programaPausa.descricao || "" };
      base.programaPausa = { ...base.programaPausa, dia1: { ...legado }, dia2: { ...legado } };
    }
    if (!("modoHorario" in base)) base.modoHorario = "detalhado";
    if (!("programaOrdem" in base)) base.programaOrdem = [];
    if (!("limitesProvasCat"    in base)) base.limitesProvasCat    = {};
    if (!("usarLimiteCat"       in base)) base.usarLimiteCat       = false;
    if (!("regrasPreco"         in base)) base.regrasPreco         = [];
    if (!("equipeIdsFederados" in base)) {
      // Pré-preencher do organizador (config global) — apenas se campo nunca foi definido
      const _orgId = base.organizadorId || (usuarioLogado?.tipo === "organizador" ? usuarioLogado?.id : usuarioLogado?.organizadorId);
      const _org = _orgId ? organizadores?.find(o => o.id === _orgId) : null;
      base.equipeIdsFederados = _org?.equipeIdsFederados || [];
    }
    if (!("valorInscricao"      in base)) base.valorInscricao      = "";
    if (!("formaPagamento"      in base)) base.formaPagamento      = "";
    if (!("orientacaoPagamento" in base)) base.orientacaoPagamento = "";
    if (!("modoMedalhas" in base)) base.modoMedalhas = base.medalhasApenasParticipacao ? "apenas_participacao" : "classificacao_participacao";
    return base;
  });
  // Snapshot inicial para diff — ao editar, salva apenas campos alterados
  const [formOriginal] = useState(() => editando ? { ...eventoAtual } : null);
  const [erros, setErros] = useState({});
  // Steps: 1=Dados | 2=Configurações | 3=Provas | 4=Horários (editing only)
  const [step, setStep] = useState(1);
  // Acordeões do step 2
  const [acordeoes, setAcordeoes] = useState({ limites: false, precos: false, logos: false, regulamento: false, medalhas: false });
  const [uploadandoRegulamento, setUploadandoRegulamento] = useState(false);
  // Estado do modal de corte: { src, campo, aspecto } ou null
  const [cropModal, setCropModal] = useState(null);
  const toggleAcordeo = (key) => setAcordeoes(a => ({ ...a, [key]: !a[key] }));

  // Número total de steps
  const totalSteps = editando ? 4 : 3;

  // Callback para navegação direta ao step de Horários (step 4 ao editar)
  // Antes: window.__gerenTrackGoStep3 — agora via prop cadEventoGoStep/setCadEventoGoStep
  useEffect(() => {
    if (cadEventoGoStep === "step3" && editando) {
      setStep(4);
      setCadEventoGoStep(null);
    }
  }, [cadEventoGoStep, editando]);

  const todasProvas = todasAsProvas();
  const grupos = [...new Set(todasProvas.map((p) => p.grupo))];

  const toggleProva = (id) => {
    setForm((f) => ({
      ...f,
      provasPrograma: f.provasPrograma.includes(id)
        ? f.provasPrograma.filter((x) => x !== id)
        : [...f.provasPrograma, id],
    }));
  };

  const toggleGrupo = (grupo, provasGrupoFiltradas) => {
    const provasGrupo = provasGrupoFiltradas || todasProvas.filter((p) => p.grupo === grupo);
    const todasSel = provasGrupo.every((p) => form.provasPrograma.includes(p.id));
    setForm((f) => ({
      ...f,
      provasPrograma: todasSel
        ? f.provasPrograma.filter((id) => !provasGrupo.map((p) => p.id).includes(id))
        : [...new Set([...f.provasPrograma, ...provasGrupo.map((p) => p.id)])],
    }));
  };

  const validarStep1 = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = "Nome obrigatório";
    if (!form.data) e.data = "Data obrigatória";
    if (!form.local.trim()) e.local = "Local obrigatório";
    if (!(form.cidade || "").trim()) e.cidade = "Cidade obrigatória";
    if (!(form.uf || "").trim()) e.uf = "UF obrigatória";
    if ((tipoEvt === "admin" || tipoEvt === "funcionario") && !form.organizadorId) e.organizadorId = "Selecione um organizador";
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSalvar = async () => {
    const dadosParaSalvar = { ...form };
    if (!dadosParaSalvar.dataAberturaInscricoes) delete dadosParaSalvar.dataAberturaInscricoes;
    if (!dadosParaSalvar.horaAberturaInscricoes) delete dadosParaSalvar.horaAberturaInscricoes;
    if (!dadosParaSalvar.dataEncerramentoInscricoes) delete dadosParaSalvar.dataEncerramentoInscricoes;
    if (!dadosParaSalvar.horaEncerramentoInscricoes) delete dadosParaSalvar.horaEncerramentoInscricoes;
    try {
      if (editando) {
        // Merge parcial: envia apenas campos que realmente mudaram,
        // evitando sobrescrever alterações feitas por outro organizador.
        if (formOriginal) {
          const camposAlterados = {};
          const chaves = new Set([...Object.keys(dadosParaSalvar), ...Object.keys(formOriginal)]);
          chaves.forEach(k => {
            if (k === "id") return;
            const valorAtual = dadosParaSalvar[k];
            const valorOriginal = formOriginal[k];
            if (valorAtual === valorOriginal) return;
            // Comparação profunda para objetos/arrays
            if (typeof valorAtual === "object" && typeof valorOriginal === "object"
                && valorAtual !== null && valorOriginal !== null) {
              if (JSON.stringify(valorAtual) === JSON.stringify(valorOriginal)) return;
            }
            camposAlterados[k] = valorAtual;
          });
          if (Object.keys(camposAlterados).length > 0) {
            await atualizarCamposEvento(eventoAtualId, camposAlterados);
            if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Editou competição", form.nome || "", usuarioLogado.organizadorId || usuarioLogado.id, { equipeId: usuarioLogado.equipeId, modulo: "competicoes" });
          }
        } else {
          await editarEvento(dadosParaSalvar);
        }
        selecionarEvento(dadosParaSalvar.id);
      } else {
        const novo = adicionarEvento(dadosParaSalvar, usuarioLogado);
        if (novo?.blocked) {
          setErros({ _plano: novo.reason });
          return;
        }
        selecionarEvento(novo.id);
      }
    } catch (err) {
      console.error("[TelaCadastroEvento] Erro ao salvar:", err);
      alert(`Erro ao salvar competição: ${err.code || err.message || "verifique a conexão e tente novamente."}`);
    }
  };

  // ── Resumos para acordeões ──────────────────────────────────────────────────
  const resumoLimites = (() => {
    const ind = form.limiteProvasIndividual || 0;
    const rev = form.limiteProvasRevezamento || 0;
    if (!ind && !rev) return "Sem limite definido";
    const partes = [];
    if (ind) partes.push(`Máx. ${ind} individual`);
    if (rev) partes.push(`${rev} revezamento`);
    return partes.join(" · ");
  })();

  const resumoPrecos = (() => {
    const n = (form.regrasPreco || []).filter(r => r.catId).length;
    const tem = form.valorInscricao || form.formaPagamento;
    if (!n && !tem) return "Não configurado";
    const partes = [];
    if (n) partes.push(`${n} regra(s) por categoria`);
    if (form.valorInscricao) partes.push(`R$ ${Number(form.valorInscricao).toFixed(2)} global`);
    if (form.formaPagamento) partes.push(form.formaPagamento);
    return partes.join(" · ");
  })();

  const resumoLogos = (() => {
    const n = [form.logoCompeticao, form.logoCabecalho, form.logoCabecalhoDireito, form.logoRodape].filter(Boolean).length;
    return n === 0 ? "Nenhuma imagem carregada" : `${n} imagem(ns) carregada(s) ✓`;
  })();

  const resumoMedalhas = (() => {
    const m = form.modoMedalhas || "classificacao_participacao";
    if (m === "apenas_participacao") return "Somente participação";
    if (m === "apenas_classificacao") return "Somente classificação";
    return "Classificação + participação";
  })();

  return (
    <div style={s.page}>
      {erros._plano && (
        <div style={{ background: `${t.danger}10`, border: `2px solid ${t.danger}`, borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: t.danger, fontSize: 14, marginBottom: 4 }}>Limite de competições atingido</div>
          <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.6 }}>{erros._plano}</div>
          <div style={{ fontSize: 12, color: t.textMuted, marginTop: 8 }}>Entre em contato: <span style={{ color: t.accent }}>atendimento@gerentrack.com.br</span></div>
        </div>
      )}
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>{editando ? "Editar Competição" : "Nova Competição"}</h1>
          <p style={{ color: t.textDimmed, fontSize: 14 }}>
            {step === 1 ? `Passo 1 de ${totalSteps} — Dados da competição`
              : step === 2 ? `Passo 2 de ${totalSteps} — Configurações`
              : step === 3 ? `Passo 3 de ${totalSteps} — Programa de provas`
              : `Passo 4 de ${totalSteps} — Programa horário`}
          </p>
        </div>
        <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
      </div>

      {/* ── Barra de steps ── */}
      <div style={s.stepBar}>
        <div style={s.stepItem(step >= 1)}>① Dados</div>
        <div style={s.stepDivider} />
        <div style={s.stepItem(step >= 2)}>② Config</div>
        <div style={s.stepDivider} />
        <div style={s.stepItem(step >= 3)}>③ Provas</div>
        {editando && <>
          <div style={s.stepDivider} />
          <div style={s.stepItem(step >= 4)}>④ Horários</div>
        </>}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          STEP 1 — DADOS ESSENCIAIS
      ══════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <>
          <div style={s.formCard}>
            {/* Nome */}
            <div style={{ gridColumn: "1 / -1" }}>
              <FormField label="Nome da Competição *" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} placeholder="Ex: Competição Estadual de Atletismo 2025" error={erros.nome} />
            </div>

            {/* Data + DataFim + Hora */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <FormField label="Data *" value={form.data} onChange={(v) => setForm({ ...form, data: v })} type="date" error={erros.data} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <FormField label="Data Fim (2º dia)" value={form.dataFim || ""} onChange={(v) => setForm({ ...form, dataFim: v })} type="date" />
              </div>
              <div style={{ width: 130 }}>
                <label style={s.label}>Hora de Início</label>
                <input type="time" style={s.input} value={form.horaInicio || ""}
                  onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} />
              </div>
            </div>

            {/* Local + Cidade + UF */}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <div style={{ flex:2, minWidth:200 }}>
                <FormField label="Local / Instalação *" value={form.local} onChange={(v) => setForm({ ...form, local: v })} placeholder="Ex: Estádio Olímpico Municipal" error={erros.local} />
              </div>
              <div style={{ flex:1, minWidth:150 }}>
                <FormField label="Cidade *" value={form.cidade || ""} onChange={(v) => setForm({ ...form, cidade: v })} placeholder="Ex: Belo Horizonte" error={erros.cidade} />
              </div>
              <div style={{ width:100 }}>
                <label style={s.label}>UF *</label>
                <select style={{ ...s.select, ...(erros.uf ? { border:"1px solid #e57373" } : {}) }}
                  value={form.uf || ""} onChange={(e) => setForm({ ...form, uf: e.target.value })}>
                  <option value="">—</option>
                  {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
                {erros.uf && <span style={{ color: t.danger, fontSize:11 }}>{erros.uf}</span>}
              </div>
            </div>

            {/* Organizador vinculado */}
            {(tipoEvt === "admin" || tipoEvt === "funcionario") && (
              <div style={{ marginTop: 8 }}>
                <label style={s.label}>Organizador Responsável *</label>
                <select style={s.select} value={form.organizadorId || ""}
                  onChange={(e) => setForm({ ...form, organizadorId: e.target.value })}>
                  <option value="">— Selecione o organizador —</option>
                  {(organizadores || []).map(function(org) {
                    return <option key={org.id} value={org.id}>{org.nome}{org.entidade ? " — " + org.entidade : ""}</option>;
                  })}
                </select>
                {erros.organizadorId && <span style={{ color: t.danger, fontSize: 12 }}>{erros.organizadorId}</span>}
                <p style={{ color: t.textDimmed, fontSize: 12, marginTop: 6 }}>
                  Selecione a qual organizador esta competição será vinculada.
                </p>
              </div>
            )}
          </div>

          {/* ── Competição Interna (restringir inscrições) — apenas organizador/admin/funcionário ── */}
          {(tipoEvt === "admin" || tipoEvt === "organizador" || tipoEvt === "funcionario") && (
          <div style={{ background: form.inscricaoRestrita ? `${t.warning}10` : t.bgHeaderSolid, border:`1px solid ${form.inscricaoRestrita ? `${t.warning}44` : t.border}`, borderRadius:10, padding:"16px 20px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: form.inscricaoRestrita ? 12 : 0 }}>
              <input type="checkbox" checked={!!form.inscricaoRestrita}
                onChange={() => setForm(f => ({ ...f, inscricaoRestrita: !f.inscricaoRestrita }))}
                style={{ width:18, height:18, accentColor: t.warning, cursor:"pointer" }} />
              <div>
                <div style={{ fontWeight:700, fontSize:14, color: form.inscricaoRestrita ? t.warning : t.textMuted }}>
                  Competição interna
                </div>
                <div style={{ fontSize:12, color: t.textDimmed }}>
                  {form.inscricaoRestrita
                    ? "Apenas a sua federação (e as selecionadas abaixo) poderá inscrever atletas."
                    : "Todas as federações podem ver e inscrever atletas nesta competição."}
                </div>
              </div>
            </div>
            {form.inscricaoRestrita && (organizadores || []).filter(o => o.id !== form.organizadorId && o.status === "aprovado").length > 0 && (
              <>
                <div style={{ fontSize:12, color: t.textDimmed, marginBottom:8 }}>
                  Selecione as federações que também poderão participar:
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {(organizadores || [])
                    .filter(o => o.id !== form.organizadorId && o.status === "aprovado")
                    .map(o => {
                      const sel = (form.orgsAutorizadas || []).includes(o.id);
                      return (
                        <button key={o.id} type="button"
                          onClick={() => setForm(f => ({
                            ...f,
                            orgsAutorizadas: sel
                              ? (f.orgsAutorizadas || []).filter(id => id !== o.id)
                              : [...(f.orgsAutorizadas || []), o.id]
                          }))}
                          style={{
                            background: sel ? t.accentBg : t.bgHeaderSolid,
                            border: `1px solid ${sel ? t.accentBorder : t.borderInput}`,
                            color: sel ? t.accent : t.textDimmed,
                            borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                            fontSize: 13, fontFamily: t.fontBody,
                            display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
                          }}>
                          {sel ? "✓" : "—"} {o.entidade || o.nome}
                        </button>
                      );
                    })}
                </div>
                {(form.orgsAutorizadas || []).length > 0 && (
                  <div style={{ marginTop:10, fontSize:12, color: t.accent }}>
                    {(form.orgsAutorizadas || []).length} federação(ões) autorizada(s).
                  </div>
                )}
              </>
            )}
          </div>
          )}

          {/* ── Período de Inscrições ── */}
          <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:10, padding:"16px 20px", marginBottom:16 }}>
            <div style={{ color: t.accent, fontWeight:700, fontSize:14, marginBottom:12 }}>Período de Inscrições</div>
            <div style={s.grid2form}>
              <div>
                <FormField label="Abertura das Inscrições" value={form.dataAberturaInscricoes || ""} onChange={(v) => setForm({ ...form, dataAberturaInscricoes: v })} type="date" />
                <FormField label="Hora de Abertura" value={form.horaAberturaInscricoes || ""} onChange={(v) => setForm({ ...form, horaAberturaInscricoes: v })} type="time" placeholder="HH:MM (opcional)" />
              </div>
              <div>
                <FormField label="Encerramento das Inscrições" value={form.dataEncerramentoInscricoes || ""} onChange={(v) => setForm({ ...form, dataEncerramentoInscricoes: v })} type="date" />
                <FormField label="Hora de Encerramento" value={form.horaEncerramentoInscricoes || ""} onChange={(v) => setForm({ ...form, horaEncerramentoInscricoes: v })} type="time" placeholder="HH:MM (opcional)" />
              </div>
            </div>
            <p style={{ color: t.textDimmed, fontSize:12, marginTop:8, lineHeight:1.5 }}>
              Opcional. Se definidas, as inscrições abrirão e encerrarão automaticamente nas datas e horários escolhidos.
              O organizador ainda pode abrir/encerrar manualmente a qualquer momento.
            </p>
          </div>

          {/* ── Descrição ── */}
          <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:10, padding:"16px 20px", marginBottom:16 }}>
            <div style={{ color: t.accent, fontWeight:700, fontSize:14, marginBottom:12 }}>Informações da Competição</div>
            <RichTextEditor
              value={form.descricao || ""}
              onChange={(v) => setForm({ ...form, descricao: v })}
              placeholder="Regulamento, informações gerais, observações..."
            />
            <p style={{ color: t.textDimmed, fontSize:12, marginTop:8, lineHeight:1.5 }}>
              Opcional. Este texto será exibido na página da competição para todos os usuários.
            </p>
            <div style={{ marginTop:10, padding:"10px 14px", background:t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:8, display:"flex", alignItems:"center", gap:8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:t.accent,flexShrink:0}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <span style={{ fontSize:12, color:t.accent, fontWeight:600 }}>Upload do regulamento em PDF disponível na próxima tela (Configurações).</span>
            </div>
          </div>

          <button style={{ ...s.btnPrimary, marginTop: 8 }} onClick={() => { if (validarStep1()) setStep(2); }}>
            Próximo: Configurações →
          </button>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP 2 — CONFIGURAÇÕES
      ══════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <>
          {/* ── Regras de Participação (3 checkboxes agrupados) ── */}
          <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"20px 24px", marginBottom:16 }}>
            <div style={{ fontFamily: t.fontTitle, fontSize:18, fontWeight:700, color: t.accent, marginBottom:4 }}>
              Regras de Participação
            </div>
            <p style={{ fontSize:12, color: t.textDimmed, marginBottom:18 }}>
              Defina as permissões especiais de inscrição para esta competição.
            </p>

            {/* Checkbox 1 — Exceção de norma CBAt */}
            <div style={{ borderBottom:`1px solid ${t.border}`, paddingBottom:14, marginBottom:14 }}>
              <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
                <input type="checkbox" checked={form.permissividadeNorma}
                  onChange={(e) => setForm({ ...form, permissividadeNorma: e.target.checked })}
                  style={{ width:18, height:18, accentColor: t.accent, cursor:"pointer", flexShrink:0, marginTop:2 }} />
                <div>
                  <div style={{ fontWeight:700, color: t.textSecondary, fontSize:14 }}>Exceção de norma CBAt</div>
                  <div style={{ color: t.textDimmed, fontSize:12, marginTop:3, lineHeight:1.5 }}>
                    Atletas nestas idades poderão se inscrever na categoria superior:&nbsp;
                    <strong style={{ color: t.accent }}>13 anos</strong> → Sub-16 &nbsp;·&nbsp;
                    <strong style={{ color: t.accent }}>15 anos</strong> → Sub-18
                    <span style={{ display:"block", marginTop:4, fontStyle:"italic", color: t.textDimmed }}>
                      A categoria oficial do atleta não é alterada. A inscrição será marcada como participação excepcional.
                    </span>
                  </div>
                </div>
              </label>
            </div>

            {/* Checkbox 2 — Atletas 16+ em categorias superiores */}
            <div style={{ borderBottom:`1px solid ${t.border}`, paddingBottom:14, marginBottom:14 }}>
              <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
                <input type="checkbox" checked={form.permiteSub16CategoriasSup || false}
                  onChange={(e) => setForm({ ...form, permiteSub16CategoriasSup: e.target.checked })}
                  style={{ width:18, height:18, accentColor: t.success, cursor:"pointer", flexShrink:0, marginTop:2 }} />
                <div>
                  <div style={{ fontWeight:700, color: t.textSecondary, fontSize:14 }}>Atletas 16+ em categorias superiores</div>
                  <div style={{ color: t.textDimmed, fontSize:12, marginTop:3, lineHeight:1.5 }}>
                    Permite que atletas com 16 anos ou mais se inscrevam em categorias superiores à sua categoria de origem.
                    {form.permiteSub16CategoriasSup && (
                      <span style={{ display:"block", marginTop:4, color: t.textTertiary }}>
                        <strong style={{ color: t.success }}>16-17 anos</strong> → Sub-20, Sub-23 ou Adulto &nbsp;·&nbsp;
                        <strong style={{ color: t.success }}>18-19 anos</strong> → Sub-23 ou Adulto &nbsp;·&nbsp;
                        <strong style={{ color: t.success }}>20-22 anos</strong> → Adulto
                      </span>
                    )}
                    <span style={{ display:"block", marginTop:4, fontStyle:"italic", color: t.textDimmed }}>
                      A categoria oficial registrada no sistema permanece como a categoria de origem do atleta.
                    </span>
                  </div>
                </div>
              </label>
            </div>

            {/* Checkbox 3 — Inscrição antecipada de revezamentos */}
            <div>
              <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
                <input type="checkbox" checked={form.revezamentoInscAntecipada ?? true}
                  onChange={(e) => setForm({ ...form, revezamentoInscAntecipada: e.target.checked })}
                  style={{ width:18, height:18, accentColor: t.accent, cursor:"pointer", flexShrink:0, marginTop:2 }} />
                <div>
                  <div style={{ fontWeight:700, color: t.textSecondary, fontSize:14 }}>Inscrição antecipada de revezamentos</div>
                  <div style={{ color: t.textDimmed, fontSize:12, marginTop:3, lineHeight:1.5 }}>
                    Quando ativado, <strong>equipes e treinadores</strong> podem inscrever equipes de revezamento junto com as inscrições individuais (antes da competição).
                    <span style={{ display:"block", marginTop:4, fontStyle:"italic", color: t.textDimmed }}>
                      Se desativado, revezamentos só poderão ser inscritos por <strong>organizadores, funcionários ou admins</strong> — normalmente no dia do evento.
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* ── Limite de Provas por Atleta (acordeão) ── */}
          <Acordeao keyName="limites" aberto={acordeoes["limites"]} onToggle={toggleAcordeo} titulo="Limite de Provas por Atleta" icone="" resumo={resumoLimites}>
            <p style={{ color: t.textDimmed, fontSize:12, marginBottom:14, lineHeight:1.5 }}>
              Opcional. Define o máximo de provas em que cada atleta pode se inscrever. Deixe <strong>0</strong> para ilimitado.
            </p>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:180 }}>
                <label style={s.label}>Máx. provas individuais por atleta</label>
                <input type="number" min="0" max="30" style={{ ...s.input, width:"100%" }}
                  value={form.limiteProvasIndividual || 0}
                  onChange={(e) => setForm({ ...form, limiteProvasIndividual: parseInt(e.target.value) || 0 })} />
                <p style={{ fontSize:11, color: t.textDimmed, marginTop:4 }}>0 = sem limite</p>
              </div>
              <div style={{ flex:1, minWidth:180 }}>
                <label style={s.label}>Máx. revezamentos por atleta</label>
                <input type="number" min="0" max="10" style={{ ...s.input, width:"100%" }}
                  value={form.limiteProvasRevezamento || 0}
                  onChange={(e) => setForm({ ...form, limiteProvasRevezamento: parseInt(e.target.value) || 0 })} />
                <p style={{ fontSize:11, color: t.textDimmed, marginTop:4 }}>0 = sem limite</p>
              </div>
            </div>
            {(form.limiteProvasIndividual > 0 || form.limiteProvasRevezamento > 0) && (
              <div style={{ marginTop:14, padding:"10px 14px", background:t.bgHeaderSolid, borderRadius:8, border:`1px solid ${t.border}` }}>
                <div style={{ fontWeight:700, fontSize:12, color: t.accent, marginBottom:8 }}>Exceções — Provas que NÃO contam no limite</div>
                <p style={{ fontSize:11, color: t.textDimmed, marginBottom:10, lineHeight:1.5 }}>
                  Marque as provas que não devem contar no limite (ex: provas combinadas, provas extras).
                  Atletas poderão se inscrever nessas provas mesmo tendo atingido o limite.
                </p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {(form.provasPrograma || []).map(pId => {
                    const prova = todasProvas.find(p => p.id === pId);
                    if (!prova) return null;
                    const isExcecao = (form.provasExcetoLimite || []).includes(pId);
                    return (
                      <button key={pId}
                        style={{
                          padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer",
                          background: isExcecao ? t.accentBg : t.bgCardAlt,
                          color: isExcecao ? t.success : t.textDimmed,
                          border: `1px solid ${isExcecao ? t.success+"44" : t.border}`,
                        }}
                        onClick={() => {
                          setForm(f => ({
                            ...f,
                            provasExcetoLimite: isExcecao
                              ? (f.provasExcetoLimite || []).filter(x => x !== pId)
                              : [...(f.provasExcetoLimite || []), pId]
                          }));
                        }}>
                        {isExcecao ? "✓ " : ""}{prova.nome}
                      </button>
                    );
                  })}
                </div>
                {(form.provasExcetoLimite || []).length > 0 && (
                  <p style={{ fontSize:11, color: t.success, marginTop:8 }}>
                    ✓ {(form.provasExcetoLimite || []).length} prova(s) excluída(s) do limite
                  </p>
                )}
              </div>
            )}
            {form.limiteProvasIndividual > 0 && (
              <div style={{ marginTop:14, padding:"12px 14px", background:t.bgHeaderSolid, borderRadius:8, border:`1px solid ${t.border}` }}>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", marginBottom:8 }}>
                  <input type="checkbox"
                    checked={form.usarLimiteCat || false}
                    onChange={e => setForm(f => ({ ...f, usarLimiteCat: e.target.checked }))}
                    style={{ width:15, height:15, accentColor: t.accent }} />
                  <span style={{ fontSize:12, color: t.accent, fontWeight:700 }}>
                    Configurar limites diferentes por categoria
                  </span>
                </label>
                {form.usarLimiteCat && (
                  <>
                    <p style={{ fontSize:11, color: t.textDimmed, marginBottom:10, lineHeight:1.5 }}>
                      Deixe em branco para usar o limite global (<strong style={{ color: t.textSecondary }}>{form.limiteProvasIndividual}</strong>) nessa categoria.
                    </p>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))", gap:8 }}>
                      {CATEGORIAS.map(cat => (
                        <div key={cat.id}>
                          <label style={{ fontSize:11, color: t.textMuted, display:"block", marginBottom:3 }}>{cat.nome}</label>
                          <input type="number" min="0" max="30"
                            style={{ ...s.input, width:"100%", padding:"6px 10px", marginBottom:0 }}
                            value={(form.limitesProvasCat || {})[cat.id] ?? ""}
                            placeholder={String(form.limiteProvasIndividual)}
                            onChange={e => {
                              const val = e.target.value === "" ? undefined : parseInt(e.target.value) || 0;
                              setForm(f => {
                                const cur = { ...(f.limitesProvasCat || {}) };
                                if (val === undefined) delete cur[cat.id];
                                else cur[cat.id] = val;
                                return { ...f, limitesProvasCat: cur };
                              });
                            }} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <div style={{ marginTop:14, padding:"12px 14px", background:t.bgHeaderSolid, borderRadius:8, border:`1px solid ${t.border}` }}>
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                <input type="checkbox"
                  checked={form.aplicarNorma12Sub14 || false}
                  onChange={e => setForm(f => ({ ...f, aplicarNorma12Sub14: e.target.checked }))}
                  style={{ width:15, height:15, accentColor: t.accent }} />
                <span style={{ fontSize:12, color: t.accent, fontWeight:700 }}>
                  Aplicar Norma 12 CBAt para Sub-14
                </span>
              </label>
              <p style={{ fontSize:11, color: t.textDimmed, marginTop:6, lineHeight:1.5 }}>
                Limita atletas Sub-14 a 2 provas individuais de grupos diferentes
                (Velocidade/Barreiras, Fundo/Marcha, Saltos, Lançamentos) ou somente a prova combinada (Tetratlo).
                Revezamento sempre permitido.
              </p>
            </div>
          </Acordeao>

          {/* ── Preços e Pagamento (acordeão) ── */}
          <Acordeao keyName="precos" aberto={acordeoes["precos"]} onToggle={toggleAcordeo} titulo="Preços e Pagamento" icone="" resumo={resumoPrecos}>
            <p style={{ color: t.textDimmed, fontSize:12, marginBottom:14, lineHeight:1.5 }}>
              Opcional. Defina preços diferentes por categoria. Atletas das <strong style={{ color: t.textSecondary }}>equipes federadas selecionadas</strong> com Nº CBAt pagarão o <em>Preço de atleta federado</em>. Os demais pagarão o <em>Preço de atleta não federado</em>.
            </p>

            {/* Equipes federadas */}
            <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:"12px 16px", marginBottom:14 }}>
              <div style={{ fontSize:11, color: t.accent, fontWeight:700, marginBottom:8 }}>
                Equipes federadas — {(form.equipeIdsFederados || []).length} selecionada(s)
              </div>
              {(() => {
                const _evOrg = form.organizadorId || usuarioLogado?.id;
                return equipes.filter(eq => {
                  if (!_evOrg || usuarioLogado?.tipo === "admin") return true;
                  if (eq.organizadorId === _evOrg) return true;
                  return (form.orgsAutorizadas || []).includes(eq.organizadorId);
                });
              })().length === 0 ? (
                <div style={{ fontSize:11, color: t.textDimmed, fontStyle:"italic" }}>Nenhuma equipe cadastrada no sistema ainda.</div>
              ) : (
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {equipes.filter(eq => {
                    const _evOrg = form.organizadorId || usuarioLogado?.id;
                    if (!_evOrg || usuarioLogado?.tipo === "admin") return true;
                    if (eq.organizadorId === _evOrg) return true;
                    return (form.orgsAutorizadas || []).includes(eq.organizadorId);
                  }).map(eq => {
                    const sel = (form.equipeIdsFederados || []).includes(eq.id);
                    return (
                      <button key={eq.id}
                        style={{ padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer",
                          background: sel ? t.accentBg : t.bgCardAlt,
                          color:      sel ? t.success : t.textDimmed,
                          border:     `1px solid ${sel ? t.success+"44" : t.border}`,
                        }}
                        onClick={() => {
                          const cur  = form.equipeIdsFederados || [];
                          const novo = sel ? cur.filter(id => id !== eq.id) : [...cur, eq.id];
                          setForm(f => ({ ...f, equipeIdsFederados: novo }));
                        }}>
                        {sel ? "✓ " : ""}{eq.sigla || eq.nome}
                      </button>
                    );
                  })}
                </div>
              )}
              <p style={{ fontSize:10, color: t.textDimmed, marginTop:6, lineHeight:1.5 }}>
                Atletas dessas equipes <strong>com Nº CBAt</strong> cadastrado pagarão o preço "atleta federado".
              </p>
            </div>

            {/* Regras de preço */}
            {(form.regrasPreco || []).map((regra, idx) => (
              <div key={idx} style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:"14px 16px", marginBottom:10 }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap" }}>
                  <div style={{ minWidth:140 }}>
                    <label style={s.label}>Categoria</label>
                    <select style={{ ...s.select, marginBottom:0 }}
                      value={regra.catId}
                      onChange={e => setForm(f => ({
                        ...f,
                        regrasPreco: f.regrasPreco.map((r, i) => i === idx ? { ...r, catId: e.target.value } : r)
                      }))}>
                      <option value="">— Selecione —</option>
                      {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={s.label}>Atleta federado (R$)</label>
                    <input type="number" min="0" step="0.01"
                      style={{ ...s.input, marginBottom:0 }}
                      placeholder="Ex: 45.00"
                      value={regra.precoComEquipe ?? ""}
                      onChange={e => setForm(f => ({
                        ...f,
                        regrasPreco: f.regrasPreco.map((r, i) =>
                          i === idx ? { ...r, precoComEquipe: e.target.value === "" ? null : parseFloat(e.target.value) } : r
                        )
                      }))} />
                  </div>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={s.label}>Atleta não federado (R$)</label>
                    <input type="number" min="0" step="0.01"
                      style={{ ...s.input, marginBottom:0 }}
                      placeholder="Ex: 65.00"
                      value={regra.precoSemEquipe ?? ""}
                      onChange={e => setForm(f => ({
                        ...f,
                        regrasPreco: f.regrasPreco.map((r, i) =>
                          i === idx ? { ...r, precoSemEquipe: e.target.value === "" ? null : parseFloat(e.target.value) } : r
                        )
                      }))} />
                  </div>
                  <button
                    onClick={() => setForm(f => ({ ...f, regrasPreco: f.regrasPreco.filter((_, i) => i !== idx) }))}
                    style={{ background: t.accentBg, border:`1px solid ${t.danger}44`, color: t.danger, borderRadius:6, padding:"8px 14px", cursor:"pointer", fontSize:13, whiteSpace:"nowrap", flexShrink:0 }}>
                    ✕ Remover
                  </button>
                </div>
              </div>
            ))}
            <button
              style={{ ...s.btnGhost, fontSize:12, marginTop:4 }}
              onClick={() => setForm(f => ({
                ...f,
                regrasPreco: [...(f.regrasPreco || []), { catId: "", precoComEquipe: null, precoSemEquipe: null }]
              }))}>
              + Adicionar regra de preço
            </button>
            {(form.regrasPreco || []).length === 0 && (
              <p style={{ fontSize:11, color: t.textDimmed, marginTop:8, lineHeight:1.5 }}>
                Sem regras por categoria — se houver um <em>Valor de Inscrição</em> global definido, ele será exibido ao atleta.
              </p>
            )}
            {(form.regrasPreco || []).some(r => r.catId) && (
              <div style={{ marginTop:14, padding:"10px 14px", background: t.accentBg, border:`1px solid ${t.success}44`, borderRadius:8 }}>
                <div style={{ fontSize:11, color: t.success, fontWeight:700, marginBottom:6 }}>✓ Resumo das regras configuradas:</div>
                {(form.regrasPreco || []).filter(r => r.catId).map((r, i) => {
                  const catNome = CATEGORIAS.find(c => c.id === r.catId)?.nome || r.catId;
                  const nEq = (r.equipeIds || []).length;
                  return (
                    <div key={i} style={{ fontSize:11, color: t.textTertiary, padding:"3px 0", borderBottom:"1px solid #1a2a1a" }}>
                      <strong style={{ color: t.textPrimary }}>{catNome}</strong>
                      {" · "}
                      <span style={{ color: t.success }}>c/ equipe ({nEq} eq.): {r.precoComEquipe != null ? `R$ ${Number(r.precoComEquipe).toFixed(2)}` : "—"}</span>
                      {" · "}
                      <span style={{ color: t.accent }}>s/ equipe: {r.precoSemEquipe != null ? `R$ ${Number(r.precoSemEquipe).toFixed(2)}` : "—"}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Forma de pagamento */}
            <div style={{ marginTop:20, paddingTop:16, borderTop:`1px solid ${t.border}` }}>
              <div style={{ fontFamily: t.fontTitle, fontSize:16, fontWeight:700, color: t.accent, marginBottom:12 }}>
                Forma de Pagamento
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                <div>
                  <label style={s.label}>Valor Global por Atleta (R$)</label>
                  <input type="number" min="0" step="0.01" style={s.input}
                    placeholder="Ex: 50.00 — deixe em branco se usar regras por categoria"
                    value={form.valorInscricao ?? ""}
                    onChange={e => setForm(f => ({ ...f, valorInscricao: e.target.value === "" ? "" : parseFloat(e.target.value) }))}
                  />
                  <div style={{ fontSize:11, color: t.textDimmed, marginTop:2 }}>
                    Usado como fallback quando não há regra de preço para a categoria do atleta.
                  </div>
                </div>
                <div>
                  <label style={s.label}>Forma de Pagamento</label>
                  <select style={s.select} value={form.formaPagamento || ""} onChange={e => setForm(f => ({ ...f, formaPagamento: e.target.value }))}>
                    <option value="">— Não informar —</option>
                    <option value="Pix">Pix</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                    <option value="Pix / Dinheiro">Pix / Dinheiro</option>
                    <option value="Pix / Cartão">Pix / Cartão</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={s.label}>Orientações de Pagamento</label>
                <textarea
                  style={{ ...s.input, minHeight:90, resize:"vertical" }}
                  placeholder={"Ex: Pix: 11999999999 (João Silva)\nEnvie o comprovante para atletismo@email.com\nPrazo: até 3 dias antes da competição"}
                  value={form.orientacaoPagamento || ""}
                  onChange={e => setForm(f => ({ ...f, orientacaoPagamento: e.target.value }))}
                />
                <div style={{ fontSize:11, color: t.textDimmed, marginTop:2 }}>
                  Chave Pix, conta bancária, prazo, contato para envio de comprovante, etc.
                </div>
              </div>
              {(form.valorInscricao || form.formaPagamento || form.orientacaoPagamento) && (
                <div style={{ marginTop:14, background: t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:8, padding:"12px 16px" }}>
                  <div style={{ fontSize:11, color: t.accent, fontWeight:700, marginBottom:8 }}>Preview — como o atleta verá após a inscrição:</div>
                  {form.valorInscricao !== "" && form.valorInscricao != null && (
                    <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${t.border}` }}>
                      <span style={{ color: t.textMuted, fontSize:12 }}>Valor por atleta</span>
                      <strong style={{ color: t.success, fontSize:15, fontFamily: t.fontTitle }}>
                        R$ {Number(form.valorInscricao).toFixed(2)}
                      </strong>
                    </div>
                  )}
                  {form.formaPagamento && (
                    <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${t.border}` }}>
                      <span style={{ color: t.textMuted, fontSize:12 }}>Forma de pagamento</span>
                      <span style={{ color: t.textPrimary, fontSize:12 }}>{form.formaPagamento}</span>
                    </div>
                  )}
                  {form.orientacaoPagamento && (
                    <div style={{ marginTop:8, fontSize:12, color: t.textTertiary, whiteSpace:"pre-wrap", lineHeight:1.6 }}>
                      {form.orientacaoPagamento}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Acordeao>

          {/* ── Logos da Competição (acordeão) ── */}
          <Acordeao keyName="logos" aberto={acordeoes["logos"]} onToggle={toggleAcordeo} titulo="Logos da Competição" icone="" resumo={resumoLogos}>
            <p style={{ color: t.textDimmed, fontSize:12, marginBottom:14, lineHeight:1.5 }}>
              Opcional. As imagens são armazenadas na nuvem e ficam visíveis para todos. Use PNG ou JPG com fundo transparente quando possível. Máximo 2MB por imagem.
            </p>

            {/* Logo da Competição */}
            <div style={{ marginBottom:14, padding:"12px 14px", background:t.bgHeaderSolid, borderRadius:8, border:`1px solid ${t.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color: t.textPrimary, marginBottom:4 }}>Logo da Competição</div>
                  <p style={{ fontSize:11, color: t.textMuted, margin:0, lineHeight:1.5 }}>
                    Aparece na lista de competições e na tela de detalhe.<br/>
                    <strong style={{ color: t.accent }}>Tamanho recomendado: 500×500px</strong> (quadrada). PNG/JPG.
                  </p>
                  <div style={{ marginTop:8, display:"flex", gap:8, alignItems:"center" }}>
                    <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }} id="crop_logoCompeticao"
                      onChange={(e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        if (file.size > 2 * 1024 * 1024) { alert("Imagem muito grande (máx. 2MB)."); e.target.value = ""; return; }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setCropModal({ src: ev.target.result, campo: "logoCompeticao", aspecto: 1 });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <button type="button" onClick={() => document.getElementById("crop_logoCompeticao").click()}
                      style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", background: t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:6, cursor:"pointer", fontSize:12, color: t.accent, fontWeight:600 }}>
                      Escolher imagem
                    </button>
                    {form.logoCompeticao && (
                      <button type="button" style={{ fontSize:11, color: t.danger, background:"transparent", border:`1px solid ${t.danger}44`, borderRadius:4, padding:"4px 10px", cursor:"pointer" }}
                        onClick={() => setForm({ ...form, logoCompeticao: "" })}>✕ Remover</button>
                    )}
                  </div>
                </div>
                {form.logoCompeticao && (
                  <div style={{ width:80, height:80, borderRadius:8, border:`2px solid ${t.border}`, overflow:"hidden", background:"#fff", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <img loading="lazy" src={form.logoCompeticao} alt="Logo" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
                  </div>
                )}
              </div>
            </div>

            {/* Logo Cabeçalho Súmula */}
            <div style={{ marginBottom:14, padding:"12px 14px", background:t.bgHeaderSolid, borderRadius:8, border:`1px solid ${t.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color: t.textPrimary, marginBottom:4 }}>Logo Cabeçalho da Súmula</div>
                  <p style={{ fontSize:11, color: t.textMuted, margin:0, lineHeight:1.5 }}>
                    Aparece no <strong>canto esquerdo</strong> do cabeçalho da súmula impressa.<br/>
                    <strong style={{ color: t.accent }}>Tamanho recomendado: 300×120px</strong> (retangular horizontal). PNG com fundo transparente.
                  </p>
                  <div style={{ marginTop:8, display:"flex", gap:8, alignItems:"center" }}>
                    <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }} id="crop_logoCabecalho"
                      onChange={(e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        if (file.size > 2 * 1024 * 1024) { alert("Imagem muito grande (máx. 2MB)."); e.target.value = ""; return; }
                        const reader = new FileReader();
                        reader.onload = (ev) => { setCropModal({ src: ev.target.result, campo: "logoCabecalho", aspecto: 2.5 }); };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <button type="button" onClick={() => document.getElementById("crop_logoCabecalho").click()}
                      style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", background: t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:6, cursor:"pointer", fontSize:12, color: t.accent, fontWeight:600 }}>
                      Escolher imagem
                    </button>
                    {form.logoCabecalho && (
                      <button type="button" style={{ fontSize:11, color: t.danger, background:"transparent", border:`1px solid ${t.danger}44`, borderRadius:4, padding:"4px 10px", cursor:"pointer" }}
                        onClick={() => setForm({ ...form, logoCabecalho: "" })}>✕ Remover</button>
                    )}
                  </div>
                </div>
                {form.logoCabecalho && (
                  <div style={{ width:120, height:48, borderRadius:6, border:`2px solid ${t.border}`, overflow:"hidden", background:"#fff", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <img loading="lazy" src={form.logoCabecalho} alt="Cabeçalho" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
                  </div>
                )}
              </div>
            </div>

            {/* Logo Cabeçalho Direito */}
            <div style={{ marginBottom:14, padding:"12px 14px", background:t.bgHeaderSolid, borderRadius:8, border:`1px solid ${t.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color: t.textPrimary, marginBottom:4 }}>Logo Cabeçalho Direito da Súmula</div>
                  <p style={{ fontSize:11, color: t.textMuted, margin:0, lineHeight:1.5 }}>
                    Aparece no <strong>canto direito</strong> do cabeçalho da súmula impressa.<br/>
                    <strong style={{ color: t.accent }}>Tamanho recomendado: 300×120px</strong> (retangular horizontal). PNG com fundo transparente.
                  </p>
                  <div style={{ marginTop:8, display:"flex", gap:8, alignItems:"center" }}>
                    <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }} id="crop_logoCabecalhoDireito"
                      onChange={(e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        if (file.size > 2 * 1024 * 1024) { alert("Imagem muito grande (máx. 2MB)."); e.target.value = ""; return; }
                        const reader = new FileReader();
                        reader.onload = (ev) => { setCropModal({ src: ev.target.result, campo: "logoCabecalhoDireito", aspecto: 2.5 }); };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <button type="button" onClick={() => document.getElementById("crop_logoCabecalhoDireito").click()}
                      style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", background: t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:6, cursor:"pointer", fontSize:12, color: t.accent, fontWeight:600 }}>
                      Escolher imagem
                    </button>
                    {form.logoCabecalhoDireito && (
                      <button type="button" style={{ fontSize:11, color: t.danger, background:"transparent", border:`1px solid ${t.danger}44`, borderRadius:4, padding:"4px 10px", cursor:"pointer" }}
                        onClick={() => setForm({ ...form, logoCabecalhoDireito: "" })}>✕ Remover</button>
                    )}
                  </div>
                </div>
                {form.logoCabecalhoDireito && (
                  <div style={{ width:120, height:50, borderRadius:4, border:`2px solid ${t.border}`, overflow:"hidden", background:"#fff", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <img loading="lazy" src={form.logoCabecalhoDireito} alt="Cabeçalho Dir." style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
                  </div>
                )}
              </div>
            </div>

            {/* Logo Rodapé */}
            <div style={{ padding:"12px 14px", background:t.bgHeaderSolid, borderRadius:8, border:`1px solid ${t.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color: t.textPrimary, marginBottom:4 }}>Logo / Banner Rodapé da Súmula</div>
                  <p style={{ fontSize:11, color: t.textMuted, margin:0, lineHeight:1.5 }}>
                    Banner de largura total no rodapé da súmula impressa (patrocinadores, federação, etc.).<br/>
                    <strong style={{ color: t.accent }}>Tamanho recomendado: 1200×200px</strong> (retangular largo). PNG/JPG.
                  </p>
                  <div style={{ marginTop:8, display:"flex", gap:8, alignItems:"center" }}>
                    <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }} id="crop_logoRodape"
                      onChange={(e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        if (file.size > 2 * 1024 * 1024) { alert("Imagem muito grande (máx. 2MB)."); e.target.value = ""; return; }
                        const reader = new FileReader();
                        reader.onload = (ev) => { setCropModal({ src: ev.target.result, campo: "logoRodape", aspecto: 6 }); };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <button type="button" onClick={() => document.getElementById("crop_logoRodape").click()}
                      style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", background: t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:6, cursor:"pointer", fontSize:12, color: t.accent, fontWeight:600 }}>
                      Escolher imagem
                    </button>
                    {form.logoRodape && (
                      <button style={{ fontSize:11, color: t.danger, background:"transparent", border:`1px solid ${t.danger}44`, borderRadius:4, padding:"4px 10px", cursor:"pointer" }}
                        onClick={() => setForm({ ...form, logoRodape: "" })}>✕ Remover</button>
                    )}
                  </div>
                </div>
                {form.logoRodape && (
                  <div style={{ width:260, height:50, borderRadius:4, border:`2px solid ${t.border}`, overflow:"hidden", background:"#fff", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <img loading="lazy" src={form.logoRodape} alt="Rodapé" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
                  </div>
                )}
              </div>
            </div>
          </Acordeao>

          {/* ── Regulamento (PDF) ── */}
          <Acordeao keyName="regulamento" aberto={acordeoes["regulamento"]} onToggle={toggleAcordeo} titulo="Regulamento da Competição" icone="" resumo={form.regulamentoUrl ? "PDF enviado" : "Nenhum"}>
            <p style={{ color: t.textDimmed, fontSize:12, marginBottom:14, lineHeight:1.5 }}>
              Opcional. Faça upload do regulamento em PDF. O arquivo ficará disponível para download pelos participantes. Máximo 10MB.
            </p>
            <div style={{ padding:"12px 14px", background:t.bgHeaderSolid, borderRadius:8, border:`1px solid ${t.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color: t.textPrimary, marginBottom:4 }}>Regulamento (PDF)</div>
                  <p style={{ fontSize:11, color: t.textMuted, margin:0, lineHeight:1.5 }}>
                    Arquivo PDF com as regras e regulamento da competição.<br/>
                    <strong style={{ color: t.accent }}>Formato: PDF · Máximo: 10MB</strong>
                  </p>
                  <div style={{ marginTop:8, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                    <label style={{
                      display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px",
                      background: uploadandoRegulamento ? t.bgInput : t.accentBg,
                      border:`1px solid ${uploadandoRegulamento ? t.borderInput : t.accentBorder}`,
                      borderRadius:6, cursor: uploadandoRegulamento ? "not-allowed" : "pointer",
                      fontSize:12, color: uploadandoRegulamento ? t.textDisabled : t.accent, fontWeight:600,
                    }}>
                      {uploadandoRegulamento ? "Enviando..." : "Escolher PDF"}
                      <input type="file" accept="application/pdf" style={{ display:"none" }} disabled={uploadandoRegulamento}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 10 * 1024 * 1024) { alert("Arquivo muito grande (máx. 10MB)."); e.target.value = ""; return; }
                          if (file.type !== "application/pdf") { alert("Apenas arquivos PDF são aceitos."); e.target.value = ""; return; }
                          setUploadandoRegulamento(true);
                          try {
                            const pathAnterior = form.regulamentoPath || extrairPathDoUrl(form.regulamentoUrl);
                            const orgId = form.organizadorId || (tipoEvt === "organizador" ? usuarioLogado?.id : usuarioLogado?.organizadorId);
                            const orgNome = organizadores?.find(o => o.id === orgId)?.nome;
                            const pasta = `${slugifyPath(orgNome)}/${slugifyPath(form.nome)}`;
                            const path = `regulamentos/${pasta}/regulamento.pdf`;
                            const ref = storageRef(storage, path);
                            await uploadBytes(ref, file);
                            const url = await getDownloadURL(ref);
                            setForm(prev => ({ ...prev, regulamentoUrl: url, regulamentoNome: file.name, regulamentoPath: path }));
                            // Deletar anterior SOMENTE após upload bem-sucedido
                            if (pathAnterior && pathAnterior !== path) {
                              try { await deleteObject(storageRef(storage, pathAnterior)); } catch {}
                            }
                          } catch (err) { alert(`Erro ao enviar PDF: ${err.code || err.message || "tente novamente"}`); }
                          finally { setUploadandoRegulamento(false); e.target.value = ""; }
                        }}
                      />
                    </label>
                    {form.regulamentoUrl && (
                      <>
                        <a href={form.regulamentoUrl} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize:11, color: t.accent, textDecoration:"underline", cursor:"pointer" }}>
                          {form.regulamentoNome || "regulamento.pdf"}
                        </a>
                        <button style={{ fontSize:11, color: t.danger, background:"transparent", border:`1px solid ${t.danger}44`, borderRadius:4, padding:"4px 10px", cursor:"pointer" }}
                          onClick={async () => {
                            const pathDel = form.regulamentoPath || extrairPathDoUrl(form.regulamentoUrl);
                            if (pathDel) {
                              try { await deleteObject(storageRef(storage, pathDel)); } catch {}
                            }
                            setForm(prev => ({ ...prev, regulamentoUrl: "", regulamentoNome: "", regulamentoPath: "" }));
                          }}>✕ Remover</button>
                      </>
                    )}
                  </div>
                </div>
                {form.regulamentoUrl && (
                  <div style={{ width:60, height:60, borderRadius:8, border:`2px solid ${t.border}`, overflow:"hidden", background:t.bgInput, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:t.textDimmed}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                )}
              </div>
            </div>
          </Acordeao>

          {/* ── Modo de Medalhas ── */}
          <Acordeao keyName="medalhas" aberto={acordeoes["medalhas"]} onToggle={toggleAcordeo} titulo="Modo de Medalhas" icone="" resumo={resumoMedalhas}>
            <div style={{ fontSize:12, color: t.textMuted, marginBottom:12 }}>
              Define como as medalhas serão atribuídas na Secretaria da competição.
            </div>
            {[
              { value: "classificacao_participacao", icon: "", label: "Classificação + Participação", desc: "1º/2º/3º recebem ouro/prata/bronze. Demais recebem participação.", cor: t.accent },
              { value: "apenas_participacao", icon: "", label: "Somente Participação", desc: "Todos os atletas recebem medalha de participação, sem ouro/prata/bronze.", cor: t.warning },
              { value: "apenas_classificacao", icon: "", label: "Somente Classificação", desc: "Apenas 1º/2º/3º recebem medalha (ouro/prata/bronze). Sem medalha de participação.", cor: t.gold },
            ].map(opt => {
              const ativo = (form.modoMedalhas || "classificacao_participacao") === opt.value;
              return (
                <label key={opt.value} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", marginBottom: 6,
                  background: ativo ? `${opt.cor}12` : "transparent", border: `1px solid ${ativo ? opt.cor+"44" : t.border}`,
                  borderRadius: 8, cursor: "pointer",
                }}>
                  <input type="radio" name="modoMedalhasCad" checked={ativo}
                    onChange={() => setForm(f => ({ ...f, modoMedalhas: opt.value, medalhasApenasParticipacao: opt.value === "apenas_participacao" }))}
                    style={{ width:16, height:16, accentColor: opt.cor, cursor:"pointer", marginTop:2, flexShrink:0 }} />
                  <div>
                    <div style={{ fontWeight:700, color: ativo ? opt.cor : t.textTertiary, fontSize:13 }}>
                      {opt.icon} {opt.label}
                    </div>
                    <div style={{ fontSize:11, color: t.textDimmed, marginTop:2 }}>{opt.desc}</div>
                  </div>
                </label>
              );
            })}
          </Acordeao>

          {/* ── Navegação Step 2 ── */}
          <div style={{ display:"flex", gap:12, marginTop:8 }}>
            <button style={s.btnGhost} onClick={() => setStep(1)}>← Voltar</button>
            <button style={s.btnPrimary} onClick={() => setStep(3)}>
              Próximo: Programa de Provas →
            </button>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP 3 — PROGRAMA DE PROVAS
      ══════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <FiltroProvasStep
          todasProvas={todasProvas}
          form={form}
          setForm={setForm}
          toggleProva={toggleProva}
          toggleGrupo={toggleGrupo}
          editando={editando}
          handleSalvar={handleSalvar}
          setStep={setStep}
          recordes={recordes}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP 4 — PROGRAMA HORÁRIO (apenas ao editar)
      ══════════════════════════════════════════════════════════════════ */}
      {step === 4 && editando && (
        <ProgramaHorarioStep
          todasProvas={todasProvas}
          form={form}
          setForm={setForm}
          editando={editando}
          handleSalvar={handleSalvar}
          setStep={setStep}
          inscricoes={inscricoes}
          atletas={atletas}
          eventoAtualId={eventoAtualId}
        />
      )}

      {/* Modal de corte de imagem */}
      {cropModal && (
        <CortarImagem
          imageSrc={cropModal.src}
          aspecto={cropModal.aspecto}
          onCancelar={() => setCropModal(null)}
          onConfirmar={async (blob) => {
            const campo = cropModal.campo;
            setCropModal(null);
            try {
              const urlAnt = form[campo];
              const orgId = form.organizadorId || (tipoEvt === "organizador" ? usuarioLogado?.id : usuarioLogado?.organizadorId);
              const orgNome = organizadores?.find(o => o.id === orgId)?.nome;
              const pasta = `${slugifyPath(orgNome)}/${slugifyPath(form.nome)}`;
              const ext = blob.type === "image/webp" ? "webp" : "png";
              const path = `logos/${pasta}/${campo}.${ext}`;
              const ref = storageRef(storage, path);
              await uploadBytes(ref, blob);
              const url = await getDownloadURL(ref);
              setForm(prev => ({ ...prev, [campo]: url }));
              // Deletar arquivo anterior SOMENTE após upload bem-sucedido
              if (urlAnt) {
                const pathAnt = extrairPathDoUrl(urlAnt);
                if (pathAnt && pathAnt !== path) { try { await deleteObject(storageRef(storage, pathAnt)); } catch {} }
              }
            } catch (err) { alert(`Erro ao enviar imagem: ${err.code || err.message || "tente novamente"}`); }
          }}
        />
      )}
    </div>
  );
}

// ─── SELETOR DE PROVAS (STEP 2) ──────────────────────────────────────────────
function FiltroProvasStep({ todasProvas, form, setForm, toggleProva, toggleGrupo, editando, handleSalvar, setStep, recordes }) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const [filtroSexo, setFiltroSexo] = useState("todos");   // "todos" | "M" | "F"
  const [filtroCats, setFiltroCats] = useState([]);        // [] = todas; senão array de catIds ativos
  const [mostrarOpcionais, setMostrarOpcionais] = useState(false);

  const toggleFiltroCat = (catId) =>
    setFiltroCats((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );

  // Provas visíveis conforme filtros ativos
  const provasFiltradas = todasProvas.filter((p) => {
    if (p.opcional && !mostrarOpcionais && !form.provasPrograma.includes(p.id)) return false;
    const sexoOk = filtroSexo === "todos" || (filtroSexo === "M" ? p.id.startsWith("M_") : p.id.startsWith("F_"));
    const catOk = filtroCats.length === 0 || filtroCats.some((cId) => p.id.includes(`_${cId}_`) || p.id.endsWith(`_${cId}`));
    return sexoOk && catOk;
  });

  const grupos = [...new Set(provasFiltradas.map((p) => p.grupo))];

  // Selecionar/limpar só as provas visíveis
  const selecionarVisiveis = () => {
    const ids = provasFiltradas.map((p) => p.id);
    setForm((f) => ({ ...f, provasPrograma: [...new Set([...f.provasPrograma, ...ids])] }));
  };
  const limparVisiveis = () => {
    const ids = new Set(provasFiltradas.map((p) => p.id));
    setForm((f) => ({ ...f, provasPrograma: f.provasPrograma.filter((id) => !ids.has(id)) }));
  };

  const totalSelecionadas = form.provasPrograma.length;
  const visivelSelecionadas = provasFiltradas.filter((p) => form.provasPrograma.includes(p.id)).length;

  return (
    <div>
      {/* ── Barra de filtros ── */}
      <div style={s.filtroProvasBar}>
        {/* Sexo */}
        <div style={s.filtroProvasBloco}>
          <div style={s.filtroProvasLabel}>Sexo</div>
          <div style={s.filtroProvasPills}>
            {[["todos", "Ambos"], ["M", "Masculino"], ["F", "Feminino"]].map(([v, l]) => (
              <button key={v}
                style={{ ...s.filtroPill, ...(filtroSexo === v ? s.filtroPillAtivo : {}) }}
                onClick={() => setFiltroSexo(v)}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Categorias */}
        <div style={s.filtroProvasBloco}>
          <div style={s.filtroProvasLabel}>
            Categoria
            {filtroCats.length > 0 && (
              <button style={s.filtroClearBtn} onClick={() => setFiltroCats([])}>limpar</button>
            )}
          </div>
          <div style={s.filtroProvasPills}>
            {CATEGORIAS.map((c) => (
              <button key={c.id}
                style={{ ...s.filtroPill, ...(filtroCats.includes(c.id) ? s.filtroPillAtivo : {}) }}
                onClick={() => toggleFiltroCat(c.id)}>
                {c.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Provas opcionais */}
        <div style={s.filtroProvasBloco}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={mostrarOpcionais} onChange={(e) => setMostrarOpcionais(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: t.accent, cursor: "pointer" }} />
            <span style={{ color: mostrarOpcionais ? t.accent : t.textMuted, fontWeight: 600, fontSize: 13 }}>
              Mostrar provas opcionais
            </span>
            <span style={{ color: t.textDimmed, fontSize: 11 }}>(ex: 5.000m Marcha em categorias alternativas)</span>
          </label>
        </div>
      </div>

      {/* ── Cabeçalho contagem + ações ── */}
      <div style={s.formCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, color: t.textPrimary, marginBottom: 2 }}>Provas do programa</div>
            <div style={{ color: t.textDimmed, fontSize: 13 }}>
              <span style={{ color: t.accent, fontWeight: 700 }}>{totalSelecionadas}</span> selecionada(s) no total
              {provasFiltradas.length < todasProvas.length && (
                <span style={{ marginLeft: 10, color: t.textDimmed }}>
                  · mostrando {provasFiltradas.length} ({visivelSelecionadas} marcadas na visão atual)
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={s.btnGhost} onClick={selecionarVisiveis} title="Seleciona as provas visíveis com os filtros atuais">
              ✓ Todas visíveis
            </button>
            <button style={s.btnGhost} onClick={limparVisiveis} title="Desmarca as provas visíveis com os filtros atuais">
              ✗ Limpar visíveis
            </button>
            <button style={{ ...s.btnGhost, color: t.accent, borderColor: t.accentBorder }}
              onClick={() => setForm((f) => ({ ...f, provasPrograma: todasProvas.map((p) => p.id) }))}>
              Todas
            </button>
            <button style={s.btnGhost}
              onClick={() => setForm((f) => ({ ...f, provasPrograma: [] }))}>
              Nenhuma
            </button>
          </div>
        </div>

        {provasFiltradas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: t.textDisabled }}>
            Nenhuma prova encontrada para os filtros selecionados.
          </div>
        ) : (
          grupos.map((grupo) => {
            const provasGrupo = provasFiltradas.filter((p) => p.grupo === grupo);
            const todasSel = provasGrupo.every((p) => form.provasPrograma.includes(p.id));
            const algumaSel = provasGrupo.some((p) => form.provasPrograma.includes(p.id));
            return (
              <div key={grupo} style={s.grupoProvasBox}>
                <div style={s.grupoProvasHeader}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={todasSel}
                      ref={(el) => { if (el) el.indeterminate = algumaSel && !todasSel; }}
                      onChange={() => toggleGrupo(grupo, provasGrupo)}
                      style={{ width: 16, height: 16, accentColor: t.accent, cursor: "pointer" }} />
                    <span style={{ fontFamily: t.fontTitle, fontSize: 16, fontWeight: 700, color: t.accent, letterSpacing: 1 }}>
                      {grupo}
                    </span>
                  </label>
                  <span style={{ color: t.textDimmed, fontSize: 12 }}>
                    {provasGrupo.filter((p) => form.provasPrograma.includes(p.id)).length}/{provasGrupo.length}
                  </span>
                </div>
                <div style={s.provaGrid}>
                  {provasGrupo.map((p) => {
                    const sel = form.provasPrograma.includes(p.id);
                    const catNome = CATEGORIAS.find((c) => p.id.includes(`_${c.id}_`) || p.id.endsWith(`_${c.id}`))?.nome || "";
                    return (
                      <label key={p.id} style={{ ...s.provaCheckBtn, ...(sel ? s.provaCheckBtnSel : {}) }}>
                        <input type="checkbox" checked={sel} onChange={() => toggleProva(p.id)} style={{ display: "none" }} />
                        {sel ? "✓ " : ""}{p.nome}
                        <span style={{ fontSize: 10, color: sel ? t.accent + "88" : t.textDisabled, display: "block" }}>
                          {p.misto ? "Misto" : p.id.startsWith("M_") ? "Masc" : "Fem"} · {catNome}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Recordes nas Súmulas ── */}
      {recordes && recordes.length > 0 && (
        <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:10, padding:"16px 20px", marginTop:16, marginBottom:16 }}>
          <div style={{ color: t.accent, fontWeight:700, fontSize:14, marginBottom:4 }}>Recordes nas Súmulas</div>
          <p style={{ color: t.textDimmed, fontSize:12, marginBottom:10, lineHeight:1.5 }}>
            Selecione quais recordes exibir no cabeçalho de cada prova nas súmulas impressas.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {recordes.map(tipo => {
              const selecionados = form.recordesSumulas || [];
              const ativo = selecionados.includes(tipo.id);
              return (
                <label key={tipo.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", background:t.bgHeaderSolid, borderRadius:6, border:`1px solid ${ativo ? t.success+"44" : t.border}`, cursor:"pointer" }}>
                  <input type="checkbox" checked={ativo}
                    onChange={(e) => {
                      const novos = e.target.checked ? [...selecionados, tipo.id] : selecionados.filter(id => id !== tipo.id);
                      setForm({ ...form, recordesSumulas: novos });
                    }}
                  />
                  <span style={{ color: ativo ? t.success : t.textMuted, fontWeight:600, fontSize:12 }}>{tipo.nome}</span>
                  <span style={{ color: t.textDimmed, fontSize:10 }}>({tipo.sigla}) · {tipo.registros?.length || 0} registros</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button style={s.btnGhost} onClick={() => setStep(2)}>← Voltar</button>
        {editando ? (
          <button style={s.btnPrimary} onClick={() => setStep(4)} disabled={form.provasPrograma.length === 0}>
            Próximo: Programa Horário →
          </button>
        ) : (
          <button style={s.btnPrimary} onClick={handleSalvar} disabled={form.provasPrograma.length === 0}>
            Criar Competição
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PROGRAMA HORÁRIO (STEP 3) ───────────────────────────────────────────────
function ProgramaHorarioStep({ todasProvas, form, setForm, editando, handleSalvar, setStep,
  inscricoes = [], atletas = [], eventoAtualId }) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));

  const provasSel = (form.provasPrograma || [])
    .map(id => todasProvas.find(p => p.id === id))
    .filter(Boolean);

  const prog = form.programaHorario || {};

  // ── Modo ──────────────────────────────────────────────────────────────────
  const modoHorario = form.modoHorario || "detalhado";
  const [confirmModo, setConfirmModo] = useState(null); // "agrupado" | "detalhado" | null

  const temHorariosPreenchidos = Object.values(prog).some(entries =>
    entries.some(e => e.horario)
  );

  const pedirTrocaModo = (modo) => {
    if (modo === modoHorario) return; // já está nesse modo
    if (!temHorariosPreenchidos) {
      executarTrocaModo(modo);
    } else {
      setConfirmModo(modo);
    }
  };

  const executarTrocaModo = (modo) => {
    setForm(f => {
      const progAtual = f.programaHorario || {};
      const provasIds = f.provasPrograma || [];
      let novoProg = {};

      if (modo === "agrupado") {
        // detalhado → agrupado: para cada grupoKey, herda horário/fase da primeira prova
        const grupoMap = new Map();
        provasIds.forEach(id => {
          const gk = getGrupoKeyLocal(id);
          if (!grupoMap.has(gk) && progAtual[id]) {
            grupoMap.set(gk, progAtual[id].map(e => ({ ...e })));
          }
        });
        grupoMap.forEach((entries, gk) => { novoProg[gk] = entries; });
      } else {
        // agrupado → detalhado: para cada provaId, herda horário/fase do grupoKey
        provasIds.forEach(id => {
          const gk = getGrupoKeyLocal(id);
          if (progAtual[gk]) {
            novoProg[id] = progAtual[gk].map(e => ({ ...e }));
          }
        });
      }

      return { ...f, modoHorario: modo, programaHorario: novoProg, programaOrdem: [] };
    });
    setConfirmModo(null);
  };

  // ── Drag state ────────────────────────────────────────────────────────────
  const dragKeyRef = useRef(null);
  const [dragOverKey, setDragOverKey] = useState(null);
  const [confirmLimpar, setConfirmLimpar] = useState(false);

  // ── Cadeia de fases ───────────────────────────────────────────────────────
  const FASE_CHAINS = {
    "": [{ fase: "" }],
    "Final": [{ fase: "Final" }],
    "Final por Tempo": [{ fase: "Final por Tempo" }],
    "Semifinal": [{ fase: "Semifinal" }, { fase: "Final" }],
    "Semifinal por Tempo": [{ fase: "Semifinal por Tempo" }, { fase: "Final por Tempo" }],
    "Eliminatória": [{ fase: "Eliminatória" }, { fase: "Semifinal" }, { fase: "Final" }],
  };
  const FASE_INICIAIS = ["", "Final", "Final por Tempo", "Semifinal", "Semifinal por Tempo", "Eliminatória"];

  // ── Helpers de entrada ────────────────────────────────────────────────────
  const getEntries = (chave) => prog[chave] || [{ fase: "", horario: "" }];
  const getFaseInicial = (chave) => getEntries(chave)[0]?.fase || "";

  const setFaseInicial = (chave, faseInicial) => {
    const chain = (FASE_CHAINS[faseInicial] || [{ fase: "" }]).map(c => ({ ...c }));
    const existing = getEntries(chave);
    const newEntries = chain.map((c, i) => ({ fase: c.fase, horario: existing[i]?.horario || "" }));
    setForm(f => ({ ...f, programaHorario: { ...(f.programaHorario || {}), [chave]: newEntries } }));
  };

  const setEntryHorario = (chave, index, horario) => {
    const entries = getEntries(chave).map(e => ({ ...e }));
    if (entries[index]) entries[index].horario = horario;
    setForm(f => ({ ...f, programaHorario: { ...(f.programaHorario || {}), [chave]: entries } }));
  };

  const setEntryDia = (chave, index, dia) => {
    const entries = getEntries(chave).map(e => ({ ...e }));
    if (entries[index]) entries[index].dia = dia;
    setForm(f => ({ ...f, programaHorario: { ...(f.programaHorario || {}), [chave]: entries } }));
  };

  const temDoisDias = !!(form.dataFim && form.dataFim !== form.data);

  const toggleVariant = (chave, index) => {
    const entries = getEntries(chave).map(e => ({ ...e }));
    const fase = entries[index]?.fase;
    if (fase === "Semifinal") entries[index].fase = "Semifinal por Tempo";
    else if (fase === "Semifinal por Tempo") entries[index].fase = "Semifinal";
    else if (fase === "Final") entries[index].fase = "Final por Tempo";
    else if (fase === "Final por Tempo") entries[index].fase = "Final";
    setForm(f => ({ ...f, programaHorario: { ...(f.programaHorario || {}), [chave]: entries } }));
  };

  const faseColor = (fase) => {
    if (fase === "Eliminatória") return t.warning;
    if (fase?.includes("Semifinal")) return t.accent;
    if (fase?.includes("Final")) return t.success;
    return t.textMuted;
  };

  const renderSubEntries = (chave) => {
    const entries = getEntries(chave);
    if (entries.length <= 1) return null;
    return entries.slice(1).map((entry, i) => {
      const idx = i + 1;
      const canToggle = entry.fase.includes("Semifinal") || entry.fase.includes("Final");
      return (
        <div key={`${chave}_${idx}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 10px 5px 52px", background: t.bgHeaderSolid, borderRadius: 4, border: `1px dashed ${t.border}` }}>
          <input type="time" value={entry.horario || ""}
            onChange={(e) => setEntryHorario(chave, idx, e.target.value)}
            style={{ background: t.bgHeaderSolid, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 13, width: 100, fontFamily: "monospace" }}
          />
          <span style={{ color: faseColor(entry.fase), fontWeight: 700, fontSize: 12 }}>{entry.fase}</span>
          {canToggle && (
            <button onClick={() => toggleVariant(chave, idx)}
              style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: 4, color: t.textMuted, fontSize: 10, padding: "2px 8px", cursor: "pointer" }}>
              ↔ por Tempo
            </button>
          )}
        </div>
      );
    });
  };

  // ── Helper grupoKey ───────────────────────────────────────────────────────
  const getGrupoKeyLocal = (provaId) => {
    const cat = CATEGORIAS.find(c =>
      provaId.endsWith(`_${c.id}`) || provaId.includes(`_${c.id}_`)
    );
    if (!cat) return provaId;
    return provaId.replace(`_${cat.id}`, "");
  };

  // ── Mapa de inscrições: "provaId_catId_sexo" → contagem ──────────────────
  const inscricoesMap = React.useMemo(() => {
    const eid = eventoAtualId;
    if (!eid || !inscricoes?.length) return new Map();
    const anoComp = form.data ? new Date(form.data + "T12:00:00").getFullYear() : new Date().getFullYear();
    const map = new Map();
    inscricoes
      .filter(i => i.eventoId === eid && i.tipo !== "revezamento" && !i.combinadaId)
      .forEach(i => {
        const atl = atletas.find(a => a.id === i.atletaId);
        if (!atl) return;
        const cat = getCategoria(atl.anoNasc, anoComp);
        if (!cat) return;
        const chave = `${i.provaId}_${cat.id}_${i.sexo || atl.sexo}`;
        map.set(chave, (map.get(chave) || 0) + 1);
      });
    // Revezamentos: já têm provaId, categoriaId e sexo diretamente na inscrição
    inscricoes
      .filter(i => i.eventoId === eid && i.tipo === "revezamento")
      .forEach(i => {
        if (!i.categoriaId || !i.sexo) return;
        const chave = `${i.provaId}_${i.categoriaId}_${i.sexo}`;
        map.set(chave, (map.get(chave) || 0) + 1);
      });
    return map;
  }, [eventoAtualId, inscricoes, atletas, form.data]);

  const temInscricoes = inscricoes?.length > 0 && !!eventoAtualId;

  // Contagem por provaId completo (ex: "M_100m_sub14")
  const getContagem = (provaId) => {
    const cat = CATEGORIAS.find(c =>
      provaId.endsWith(`_${c.id}`) || provaId.includes(`_${c.id}_`)
    );
    if (!cat) return null;
    const sexo = provaId.startsWith("M_") ? "M" : "F";
    return inscricoesMap.get(`${provaId}_${cat.id}_${sexo}`) || 0;
  };

  // Para o modo agrupado: retorna array { catNome, provaId, n } ordenado por catNome
  // — uma entrada por cada provaId do grupo (cada implemento × categoria)
  // — agrupa implementos com mesmo catId numa única entrada somada
  const getCatsComContagem = (grupoKey) => {
    const map = new Map(); // catNome → { n, provaIds[] }
    (form.provasPrograma || []).forEach(id => {
      if (getGrupoKeyLocal(id) !== grupoKey) return;
      const cat = CATEGORIAS.find(c => id.endsWith(`_${c.id}`) || id.includes(`_${c.id}_`));
      if (!cat) return;
      const n = getContagem(id) || 0;
      if (!map.has(cat.nome)) map.set(cat.nome, { n: 0, catId: cat.id });
      map.get(cat.nome).n += n;
    });
    return [...map.entries()]
      .map(([catNome, { n }]) => ({ catNome, n }))
      .sort((a, b) => a.catNome.localeCompare(b.catNome, "pt-BR"));
  };

  // Chip de categoria inline (Opção A)
  const chipCat = ({ catNome, n }) => {
    const cor    = n === 0 ? t.danger : n < 3 ? t.gold : t.success;
    const bg     = cor + "22";
    return (
      <span key={catNome} style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
        color: cor, background: bg, flexShrink: 0,
      }}>
        {catNome} · {n}
      </span>
    );
  };

  // Badge simples para modo detalhado
  const badgeInscricao = (n, semInscricao = false) => {
    if (!temInscricoes) return null;
    const cor = semInscricao ? t.danger : n >= 5 ? t.success : n >= 1 ? t.gold : t.danger;
    const bg  = cor + "22";
    return (
      <span style={{ fontSize: 11, fontWeight: 700, color: cor, background: bg,
        padding: "2px 7px", borderRadius: 10, flexShrink: 0 }}>
        {n} insc.
      </span>
    );
  };

  // ── Limpeza: remove provas sem inscrição ──────────────────────────────────
  // provaTemInscricao: conservador — null (catId não reconhecível) = manter
  const provaTemInscricao = (provaId) => { const n = getContagem(provaId); return n === null || n > 0; };
  const calcRemovidos = () => (form.provasPrograma || []).filter(id => !provaTemInscricao(id));

  // Lista congelada no momento em que o modal abre — execução usa essa mesma lista,
  // evitando divergência se inscricoesMap reprocessar entre render e clique.
  const [removidosConfirmados, setRemovidosConfirmados] = useState([]);
  const [selecionadosRemover, setSelecionadosRemover] = useState(new Set());

  const abrirConfirmLimpar = () => {
    const lista = calcRemovidos();
    setRemovidosConfirmados(lista);
    setSelecionadosRemover(new Set(lista));
    setConfirmLimpar(true);
  };

  const toggleSelecionado = (id) => {
    setSelecionadosRemover(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const executarLimpeza = () => {
    // Só remove as provas selecionadas pelo usuário que ainda não têm inscrição
    const aRemover = new Set(
      [...selecionadosRemover].filter(id => !provaTemInscricao(id))
    );
    // Guard: se algum id selecionado agora tem inscrição, aborta com aviso
    const comInscricaoAgora = [...selecionadosRemover].filter(id => provaTemInscricao(id));
    if (comInscricaoAgora.length > 0) {
      setConfirmLimpar(false);
      setRemovidosConfirmados([]);
      setSelecionadosRemover(new Set());
      alert(`Dados de inscrição foram atualizados desde que o painel foi aberto.\n\n${comInscricaoAgora.length} prova(s) passaram a ter inscrições e foram mantidas.\n\nReabra o painel para ver a lista atualizada.`);
      return;
    }
    if (aRemover.size === 0) { setConfirmLimpar(false); return; }
    setForm(f => {
      const novasProvas = (f.provasPrograma || []).filter(id => !aRemover.has(id));
      const novoProg = { ...(f.programaHorario || {}) };
      if (modoHorario === "agrupado") {
        // Só remove chaves cujo grupo NÃO tem mais nenhuma prova restante
        Object.keys(novoProg).forEach(chave => {
          if (!novasProvas.some(id => getGrupoKeyLocal(id) === chave)) delete novoProg[chave];
        });
      } else {
        aRemover.forEach(id => { delete novoProg[id]; });
      }
      return {
        ...f,
        provasPrograma: novasProvas,
        programaHorario: novoProg,
        programaOrdem: (f.programaOrdem || []).filter(k =>
          novasProvas.some(id => getGrupoKeyLocal(id) === k)
        ),
      };
    });
    setConfirmLimpar(false);
    setRemovidosConfirmados([]);
    setSelecionadosRemover(new Set());
  };

  const podeVerificar = form.inscricoesEncerradas && temInscricoes;

  // ── Lista flat MODO DETALHADO ─────────────────────────────────────────────
  const listaCompleta = [];
  provasSel.forEach(p => {
    if (p.tipo === "combinada") {
      listaCompleta.push({ ...p, _isCombMae: true });
      const comp = getComposicaoCombinada(p.id);
      if (comp) {
        comp.provas.forEach((cp, idx) => {
          const chave = `COMP_${p.id}_${idx}_${cp.sufixo}`;
          listaCompleta.push({
            id: chave, nome: cp.nome, grupo: p.nome, tipo: cp.tipo, unidade: cp.unidade,
            dia: cp.dia, ordem: idx + 1, _isComp: true, _combinadaNome: comp.nome, _parentId: p.id,
          });
        });
      }
    } else {
      listaCompleta.push(p);
    }
  });
  const grupos = [...new Set(listaCompleta.filter(p => !p._isComp && !p._isCombMae).map(p => p.grupo))];

  // ── Lista agrupada MODO AGRUPADO ──────────────────────────────────────────
  const listaAgrupadaBase = (() => {
    const map = new Map();
    provasSel.filter(p => p.tipo !== "combinada").forEach(p => {
      const grupoKey = getGrupoKeyLocal(p.id);
      const sexoLabel = p.misto ? "Misto" : p.id.startsWith("M_") ? "Masc" : "Fem";
      const nomeBase = p.nome.replace(/\s*\([^)]+\)\s*$/, "").trim();
      if (!map.has(grupoKey)) {
        map.set(grupoKey, { grupoKey, nome: nomeBase, grupo: p.grupo, sexoLabel, cats: [], misto: p.misto });
      }
      const catNome = CATEGORIAS.find(c =>
        p.id.endsWith(`_${c.id}`) || p.id.includes(`_${c.id}_`)
      )?.nome || "";
      const entry = map.get(grupoKey);
      if (catNome && !entry.cats.includes(catNome)) entry.cats.push(catNome);
    });
    return [...map.values()];
  })();

  const ordemSalva = form.programaOrdem || [];
  const listaAgrupada = (() => {
    if (ordemSalva.length === 0) return listaAgrupadaBase;
    const ordenados = ordemSalva.map(k => listaAgrupadaBase.find(p => p.grupoKey === k)).filter(Boolean);
    const novos = listaAgrupadaBase.filter(p => !ordemSalva.includes(p.grupoKey));
    return [...ordenados, ...novos];
  })();

  const gruposAgrupados = (() => {
    const seen = new Set();
    return listaAgrupada.map(p => p.grupo).filter(g => { if (seen.has(g)) return false; seen.add(g); return true; });
  })();

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = (e, key) => { dragKeyRef.current = key; e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e, key) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverKey(key); };
  const handleDrop = (e, targetKey) => {
    e.preventDefault();
    const fromKey = dragKeyRef.current;
    if (!fromKey || fromKey === targetKey) { setDragOverKey(null); return; }
    const currentOrder = listaAgrupada.map(p => p.grupoKey);
    const fromIdx = currentOrder.indexOf(fromKey);
    const toIdx = currentOrder.indexOf(targetKey);
    if (fromIdx === -1 || toIdx === -1) { setDragOverKey(null); return; }
    const newOrder = [...currentOrder];
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, fromKey);
    setForm(f => ({ ...f, programaOrdem: newOrder }));
    setDragOverKey(null);
    dragKeyRef.current = null;
  };
  const handleDragEnd = () => { setDragOverKey(null); dragKeyRef.current = null; };

  // ── Contagem de horários ──────────────────────────────────────────────────
  let totalEntries = 0, totalComHorario = 0;
  if (modoHorario === "detalhado") {
    totalEntries = listaCompleta.filter(p => !p._isCombMae).reduce((acc, p) => acc + getEntries(p.id).length, 0);
    totalComHorario = listaCompleta.filter(p => !p._isCombMae).reduce((acc, p) => acc + getEntries(p.id).filter(e => e.horario).length, 0);
  } else {
    listaAgrupada.forEach(({ grupoKey }) => {
      const ents = getEntries(grupoKey);
      totalEntries += ents.length;
      totalComHorario += ents.filter(e => e.horario).length;
    });
  }

  const dragHandleStyle = {
    cursor: "grab", fontSize: 16, color: t.textDisabled, padding: "0 6px",
    userSelect: "none", display: "flex", alignItems: "center", flexShrink: 0,
  };

  return (
    <div style={s.formCard}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ color: t.accent, fontWeight: 700, fontSize: 15 }}>Programa Horário</div>
          <span style={{ fontSize: 12, color: t.textMuted }}>{totalComHorario}/{totalEntries} horários preenchidos</span>
        </div>

        {/* Toggle + limpeza */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => pedirTrocaModo("agrupado")} style={{
            padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: modoHorario === "agrupado" ? "default" : "pointer", border: "none",
            background: modoHorario === "agrupado" ? t.accent : t.bgInput,
            color: modoHorario === "agrupado" ? "#fff" : t.textDimmed,
          }}>Por modalidade/sexo</button>
          <button onClick={() => pedirTrocaModo("detalhado")} style={{
            padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: modoHorario === "detalhado" ? "default" : "pointer", border: "none",
            background: modoHorario === "detalhado" ? t.accent : t.bgInput,
            color: modoHorario === "detalhado" ? "#fff" : t.textDimmed,
          }}>Detalhado por categoria</button>
          {podeVerificar && (
            <button onClick={abrirConfirmLimpar} style={{
              marginLeft: "auto", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
              cursor: "pointer", border: "1px solid #3a2a1a",
              background: calcRemovidos().length > 0 ? t.warning + "22" : t.bgCardAlt,
              color: calcRemovidos().length > 0 ? t.warning : t.textDimmed,
            }}>
              Remover sem inscrições {calcRemovidos().length > 0 ? `(${calcRemovidos().length})` : ""}
            </button>
          )}
        </div>

        {/* Modal confirmação limpeza */}
        {confirmLimpar && (
          <div style={{ background: t.warning + "11", border: `1px solid ${t.warning}44`, borderRadius: 8, padding: "16px 18px", marginBottom: 14 }}>
            {removidosConfirmados.length === 0 ? (
              <>
                <div style={{ color: t.success, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Todas as provas têm inscrições</div>
                <p style={{ color: t.textMuted, fontSize: 12, margin: "0 0 12px" }}>Nenhuma prova precisa ser removida.</p>
                <button onClick={() => { setConfirmLimpar(false); setRemovidosConfirmados([]); }} style={{ background: t.bgInput, color: t.textMuted, border: `1px solid ${t.borderLight}`, borderRadius: 6, padding: "6px 16px", cursor: "pointer", fontSize: 12 }}>Fechar</button>
              </>
            ) : (
              <>
                <div style={{ color: t.warning, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{removidosConfirmados.length} prova(s) sem inscrição</div>
                <p style={{ color: t.textMuted, fontSize: 12, margin: "0 0 10px" }}>
                  Selecione as provas que deseja remover. Provas desmarcadas serão mantidas na competição.
                </p>
                <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <button onClick={() => setSelecionadosRemover(new Set(removidosConfirmados))} style={{
                    background: "transparent", border: "none", color: t.accent, fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0,
                  }}>Marcar todas</button>
                  <button onClick={() => setSelecionadosRemover(new Set())} style={{
                    background: "transparent", border: "none", color: t.textDimmed, fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0,
                  }}>Desmarcar todas</button>
                </div>
                <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 3 }}>
                  {removidosConfirmados.map(id => {
                    const p = todasProvas.find(x => x.id === id);
                    const catNome = CATEGORIAS.find(c => id.endsWith(`_${c.id}`) || id.includes(`_${c.id}_`))?.nome || "";
                    const sexoLabel = id.startsWith("M_") ? "Masc" : "Fem";
                    const checked = selecionadosRemover.has(id);
                    return (
                      <label key={id} style={{
                        fontSize: 12, padding: "4px 8px", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                        background: checked ? t.warning + "11" : t.bgCardAlt, color: checked ? t.warning : t.textDimmed,
                      }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleSelecionado(id)}
                          style={{ accentColor: t.warning, cursor: "pointer" }} />
                        <span>{p?.nome || id} <span style={{ color: t.textDimmed }}>— {sexoLabel} · {catNome}</span></span>
                      </label>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={executarLimpeza} disabled={selecionadosRemover.size === 0} style={{
                    background: selecionadosRemover.size > 0 ? t.warning : t.bgInput, color: selecionadosRemover.size > 0 ? "#fff" : t.textDimmed,
                    border: "none", borderRadius: 6, padding: "7px 18px", cursor: selecionadosRemover.size > 0 ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700,
                  }}>
                    Remover {selecionadosRemover.size > 0 ? `${selecionadosRemover.size} prova(s)` : ""}
                  </button>
                  <button onClick={() => { setConfirmLimpar(false); setRemovidosConfirmados([]); setSelecionadosRemover(new Set()); }} style={{ background: t.bgInput, color: t.textMuted, border: `1px solid ${t.borderLight}`, borderRadius: 6, padding: "7px 16px", cursor: "pointer", fontSize: 12 }}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Modal confirmação troca de modo */}
        {confirmModo && (
          <div style={{ background: t.accent + "11", border: `1px solid ${t.accent}44`, borderRadius: 8, padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ color: t.accent, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Trocar modo do programa horário?</div>
            <p style={{ color: t.textMuted, fontSize: 12, margin: "0 0 12px", lineHeight: 1.6 }}>
              Os horários preenchidos serão <strong style={{ color: t.accent }}>convertidos</strong> para o modo {confirmModo === "agrupado" ? "agrupado (por modalidade/sexo)" : "detalhado (por categoria)"}. Verifique os horários após a conversão.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => executarTrocaModo(confirmModo)} style={{ background: t.accent, color: "#fff", border: "none", borderRadius: 6, padding: "7px 18px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                Converter e trocar
              </button>
              <button onClick={() => setConfirmModo(null)} style={{ background: t.bgInput, color: t.textMuted, border: `1px solid ${t.borderLight}`, borderRadius: 6, padding: "7px 16px", cursor: "pointer", fontSize: 12 }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {modoHorario === "agrupado" ? (
          <p style={{ color: t.textMuted, fontSize: 13, lineHeight: 1.6 }}>
            Um único horário por modalidade e sexo. Exibição: <span style={{ color: t.textSecondary }}>09:00 — Arremesso do Peso — Masculino · Sub-14 · Sub-16</span>
          </p>
        ) : (
          <p style={{ color: t.textMuted, fontSize: 13, lineHeight: 1.6 }}>
            Defina o horário e fase de cada prova individualmente. Ao selecionar <strong style={{ color: t.warning }}>Eliminatória</strong> ou <strong style={{ color: t.accent }}>Semifinal</strong>, as fases subsequentes são geradas automaticamente com horários independentes.
          </p>
        )}
      </div>

      {/* ═══ MODO AGRUPADO ═════════════════════════════════════════════════════ */}
      {modoHorario === "agrupado" && (
        <>
          {gruposAgrupados.map(grupo => {
            const provasGrupo = listaAgrupada.filter(p => p.grupo === grupo);
            if (provasGrupo.length === 0) return null;
            return (
              <div key={grupo} style={{ marginBottom: 18, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, color: t.textSecondary, fontSize: 13 }}>{grupo}</span>
                  <span style={{ fontSize: 11, color: t.textDimmed }}>{provasGrupo.length} modalidade(s)</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {provasGrupo.map(p => {
                    const chave = p.grupoKey;
                    const entries = getEntries(chave);
                    const faseInicial = getFaseInicial(chave);
                    const isDragOver = dragOverKey === chave;
                    const catsComN = temInscricoes ? getCatsComContagem(chave) : null;
                    return (
                      <div key={chave}
                        draggable
                        onDragStart={(e) => handleDragStart(e, chave)}
                        onDragOver={(e) => handleDragOver(e, chave)}
                        onDrop={(e) => handleDrop(e, chave)}
                        onDragEnd={handleDragEnd}
                        style={{ display: "flex", flexDirection: "column", gap: 4,
                          outline: isDragOver ? `2px solid ${t.accent}` : "none",
                          borderRadius: 6, transition: "outline 0.1s" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: t.bgHeaderSolid, borderRadius: 6, border: `1px solid ${t.border}` }}>
                          <span style={dragHandleStyle} title="Arrastar para reordenar">⠿</span>
                          <input type="time" value={entries[0]?.horario || ""}
                            onChange={(e) => setEntryHorario(chave, 0, e.target.value)}
                            style={{ background: t.bgHeaderSolid, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 13, width: 100, fontFamily: "monospace" }}
                          />
                          {temDoisDias && (
                            <select value={entries[0]?.dia || 1}
                              onChange={(e) => setEntryDia(chave, 0, Number(e.target.value))}
                              style={{ background: t.bgHeaderSolid, color: t.accent, border: `1px solid ${t.border}`, borderRadius: 4, padding: "4px 6px", fontSize: 11, fontWeight: 700, width: 62, flexShrink: 0 }}>
                              <option value={1}>Dia 1</option>
                              <option value={2}>Dia 2</option>
                            </select>
                          )}
                          <span style={{ color: t.textSecondary, fontSize: 13, flexShrink: 0 }}>{p.nome}</span>
                          <span style={{ color: t.textDimmed, fontSize: 11, flexShrink: 0 }}>{p.sexoLabel}</span>
                          {/* Chips de categoria com contagem — Opção A */}
                          {catsComN ? (
                            <span style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
                              {catsComN.map(item => chipCat(item))}
                            </span>
                          ) : (
                            <span style={{ flex: 1, color: t.textDimmed, fontSize: 11 }}>
                              {p.cats.join(" · ")}
                            </span>
                          )}
                          <select value={faseInicial}
                            onChange={(e) => setFaseInicial(chave, e.target.value)}
                            style={{ background: t.bgHeaderSolid, color: faseInicial ? faseColor(faseInicial) : t.textDimmed, border: `1px solid ${t.border}`, borderRadius: 4, padding: "4px 6px", fontSize: 11, fontWeight: 700, width: 150, flexShrink: 0 }}>
                            {FASE_INICIAIS.map(f => <option key={f} value={f}>{f || "Fase..."}</option>)}
                          </select>
                        </div>
                        {renderSubEntries(chave)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ═══ MODO DETALHADO ═══════════════════════════════════════════════════ */}
      {modoHorario === "detalhado" && (
        <>
          {grupos.map(grupo => {
            const provasGrupo = listaCompleta.filter(p => p.grupo === grupo && !p._isComp && !p._isCombMae)
              .sort((a, b) => a.nome.localeCompare(b.nome));
            if (provasGrupo.length === 0) return null;
            return (
              <div key={grupo} style={{ marginBottom: 18, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, color: t.textSecondary, fontSize: 13 }}>{grupo}</span>
                  <span style={{ fontSize: 11, color: t.textDimmed }}>{provasGrupo.length} prova(s)</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {provasGrupo.map(p => {
                    const catNome = CATEGORIAS.find(c => p.id.includes(`_${c.id}_`) || p.id.endsWith(`_${c.id}`))?.nome || "";
                    const sexoLabel = p.misto ? "Misto" : p.id.startsWith("M_") ? "Masc" : "Fem";
                    const entries = getEntries(p.id);
                    const faseInicial = getFaseInicial(p.id);
                    const nInsc = getContagem(p.id);
                    const semInscricao = podeVerificar && nInsc === 0;
                    return (
                      <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px",
                          background: semInscricao ? t.warning + "11" : t.bgCardAlt, borderRadius: 6,
                          border: `1px solid ${semInscricao ? t.warning+"44" : t.border}` }}>
                          <input type="time" value={entries[0]?.horario || ""}
                            onChange={(e) => setEntryHorario(p.id, 0, e.target.value)}
                            style={{ background: t.bgHeaderSolid, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 13, width: 100, fontFamily: "monospace" }}
                          />
                          {temDoisDias && (
                            <select value={entries[0]?.dia || 1}
                              onChange={(e) => setEntryDia(p.id, 0, Number(e.target.value))}
                              style={{ background: t.bgHeaderSolid, color: t.accent, border: `1px solid ${t.border}`, borderRadius: 4, padding: "4px 6px", fontSize: 11, fontWeight: 700, width: 62, flexShrink: 0 }}>
                              <option value={1}>Dia 1</option>
                              <option value={2}>Dia 2</option>
                            </select>
                          )}
                          <span style={{ flex: 1, color: t.textSecondary, fontSize: 13 }}>{p.nome}</span>
                          <span style={{ color: t.textDimmed, fontSize: 11 }}>{sexoLabel} · {catNome}</span>
                          {badgeInscricao(nInsc ?? 0, semInscricao)}
                          <select value={faseInicial}
                            onChange={(e) => setFaseInicial(p.id, e.target.value)}
                            style={{ background: t.bgHeaderSolid, color: faseInicial ? faseColor(faseInicial) : t.textDimmed, border: `1px solid ${t.border}`, borderRadius: 4, padding: "4px 6px", fontSize: 11, fontWeight: 700, width: 150 }}>
                            {FASE_INICIAIS.map(f => <option key={f} value={f}>{f || "Fase..."}</option>)}
                          </select>
                        </div>
                        {renderSubEntries(p.id)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {listaCompleta.filter(p => p._isCombMae).map(mae => {
            const componentes = listaCompleta.filter(p => p._isComp && p._parentId === mae.id);
            const catNome = CATEGORIAS.find(c => mae.id.includes(`_${c.id}_`) || mae.id.endsWith(`_${c.id}`))?.nome || "";
            const sexoLabel = mae.misto ? "Misto" : mae.id.startsWith("M_") ? "Masc" : "Fem";
            return (
              <div key={mae.id} style={{ marginBottom: 18, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, color: t.accent, fontSize: 13 }}>{mae.nome} — {sexoLabel} · {catNome}</span>
                  <span style={{ fontSize: 11, color: t.textDimmed }}>{componentes.length} prova(s)</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {componentes.map(cp => {
                    const entries = getEntries(cp.id);
                    const faseInicial = getFaseInicial(cp.id);
                    return (
                      <div key={cp.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: t.bgHeaderSolid, borderRadius: 6, border: `1px solid ${t.border}` }}>
                          <input type="time" value={entries[0]?.horario || ""}
                            onChange={(e) => setEntryHorario(cp.id, 0, e.target.value)}
                            style={{ background: t.bgHeaderSolid, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 13, width: 100, fontFamily: "monospace" }}
                          />
                          <span style={{ color: t.accent, fontSize: 11, fontWeight: 700, width: 22, textAlign: "center" }}>{cp.ordem}ª</span>
                          <span style={{ flex: 1, color: t.textSecondary, fontSize: 13 }}>{cp.nome}</span>
                          {cp.dia && <span style={{ color: t.accent, fontSize: 10, background: t.accentBg, padding: "2px 6px", borderRadius: 3 }}>Dia {cp.dia}</span>}
                          <select value={faseInicial}
                            onChange={(e) => setFaseInicial(cp.id, e.target.value)}
                            style={{ background: t.bgHeaderSolid, color: faseInicial ? faseColor(faseInicial) : t.textDimmed, border: `1px solid ${t.border}`, borderRadius: 4, padding: "4px 6px", fontSize: 11, fontWeight: 700, width: 150 }}>
                            {FASE_INICIAIS.map(f => <option key={f} value={f}>{f || "Fase..."}</option>)}
                          </select>
                        </div>
                        {renderSubEntries(cp.id)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ── Pausa / Intervalo ── */}
      <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8 }}>
        <div style={{ color: t.accent, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Intervalo / Pausa</div>
        <p style={{ color: t.textMuted, fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
          Defina um intervalo entre os períodos da manhã e da tarde. As provas serão automaticamente divididas pelo horário da pausa em etapas{temDoisDias ? " (configuração independente por dia)" : " (1ª Etapa — Manhã, 2ª Etapa — Tarde)"}.
        </p>
        {temDoisDias ? [1, 2].map(dia => {
          const key = `dia${dia}`;
          const pausaDia = (form.programaPausa || {})[key] || {};
          const setPausaDia = (campo, valor) => setForm(f => ({
            ...f,
            programaPausa: {
              ...(f.programaPausa || {}),
              [key]: { ...((f.programaPausa || {})[key] || {}), [campo]: valor }
            }
          }));
          const dataLabel = dia === 1 && form.data
            ? new Date(form.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
            : dia === 2 && form.dataFim
            ? new Date(form.dataFim + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
            : "";
          return (
            <div key={key} style={{ marginBottom: dia === 1 ? 12 : 0 }}>
              <div style={{ color: t.textSecondary, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Dia {dia}{dataLabel ? ` — ${dataLabel}` : ""}
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div>
                  <label style={{ color: t.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Início da pausa</label>
                  <input type="time" value={pausaDia.horario || ""}
                    onChange={(e) => setPausaDia("horario", e.target.value)}
                    style={{ background: t.bgHeaderSolid, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: 4, padding: "6px 10px", fontSize: 13, width: 110, fontFamily: "monospace" }}
                  />
                </div>
                <div>
                  <label style={{ color: t.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Retorno</label>
                  <input type="time" value={pausaDia.retorno || ""}
                    onChange={(e) => setPausaDia("retorno", e.target.value)}
                    style={{ background: t.bgHeaderSolid, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: 4, padding: "6px 10px", fontSize: 13, width: 110, fontFamily: "monospace" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ color: t.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Descrição</label>
                  <input type="text" value={pausaDia.descricao || ""}
                    onChange={(e) => setPausaDia("descricao", e.target.value)}
                    placeholder="Ex: Horário de Almoço"
                    style={{ background: t.bgHeaderSolid, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: 4, padding: "6px 10px", fontSize: 13, width: "100%" }}
                  />
                </div>
              </div>
            </div>
          );
        }) : (
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label style={{ color: t.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Início da pausa</label>
              <input type="time" value={(form.programaPausa || {}).horario || ""}
                onChange={(e) => setForm(f => ({ ...f, programaPausa: { ...(f.programaPausa || {}), horario: e.target.value } }))}
                style={{ background: t.bgHeaderSolid, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: 4, padding: "6px 10px", fontSize: 13, width: 110, fontFamily: "monospace" }}
              />
            </div>
            <div>
              <label style={{ color: t.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Retorno</label>
              <input type="time" value={(form.programaPausa || {}).retorno || ""}
                onChange={(e) => setForm(f => ({ ...f, programaPausa: { ...(f.programaPausa || {}), retorno: e.target.value } }))}
                style={{ background: t.bgHeaderSolid, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: 4, padding: "6px 10px", fontSize: 13, width: 110, fontFamily: "monospace" }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ color: t.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Descrição</label>
              <input type="text" value={(form.programaPausa || {}).descricao || ""}
                onChange={(e) => setForm(f => ({ ...f, programaPausa: { ...(f.programaPausa || {}), descricao: e.target.value } }))}
                placeholder="Ex: Horário de Almoço"
                style={{ background: t.bgHeaderSolid, color: t.textPrimary, border: `1px solid ${t.border}`, borderRadius: 4, padding: "6px 10px", fontSize: 13, width: "100%" }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button style={s.btnGhost} onClick={() => setStep(3)}>← Voltar</button>
        <button style={s.btnPrimary} onClick={handleSalvar}>
          {editando ? "Salvar Alterações" : "Criar Competição"}
        </button>
      </div>
    </div>

  );
}


export { TelaCadastroEvento, FiltroProvasStep, ProgramaHorarioStep };
