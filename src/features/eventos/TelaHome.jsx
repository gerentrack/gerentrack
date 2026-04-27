import React from "react";
import { getStatusEvento, labelStatusEvento } from "./eventoHelpers";
import { _getLocalEventoDisplay } from "../../shared/formatters/utils";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useResponsivo } from "../../hooks/useResponsivo";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";

import { IcoCalendar, IcoClock, IcoPin, IcoList, IcoTarget, IcoUsers, IcoEdit, IcoPen, IcoTrash } from "../../shared/icons";

const SearchIcon = (size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// ── Animated counter hook ──
function useAnimatedCount(target, duration = 1200) {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
}

// ── Skeleton placeholder ──
function SkeletonCard({ t }) {
  const shimmer = {
    background: `linear-gradient(90deg, ${t.bgCardAlt} 25%, ${t.bgCard} 50%, ${t.bgCardAlt} 75%)`,
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    borderRadius: 8,
  };
  return (
    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ ...shimmer, width: "100%", aspectRatio: "1/1", borderRadius: 0 }} />
      <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ ...shimmer, height: 18, width: "80%" }} />
        <div style={{ ...shimmer, height: 14, width: "60%" }} />
        <div style={{ ...shimmer, height: 14, width: "40%" }} />
        <div style={{ ...shimmer, height: 34, width: 120, marginTop: 4 }} />
      </div>
    </div>
  );
}

const getStyles = (t) => ({
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
  provaBtnSel: { background: t.bgHover, borderColor: t.accent, color: t.accent },
  grupoProvasBox: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 16, overflow: "hidden" },
  grupoProvasHeader: { background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  provaCheckBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: t.fontBody, lineHeight: 1.4, userSelect: "none" },
  provaCheckBtnSel: { background: t.bgHover, borderColor: t.accent, color: t.accent },

  // ── Hero ──
  heroSection: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "60px 48px", gap: 48, background: `linear-gradient(135deg, ${t.bgCardAlt} 0%, ${t.bgCard} 50%, ${t.accent}15 100%)`, borderRadius: 16, marginBottom: 40, position: "relative", overflow: "hidden", border: `1px solid ${t.border}` },
  heroTitle: { fontFamily: t.fontTitle, fontSize: 42, fontWeight: 900, color: t.textPrimary, lineHeight: 1.1, marginBottom: 16, letterSpacing: 1, maxWidth: 560 },
  heroSubtitle: { fontSize: 16, color: t.textMuted, lineHeight: 1.6, marginBottom: 28, maxWidth: 480 },
  heroBtns: { display: "flex", justifyContent: "flex-start", gap: 12, flexWrap: "wrap" },

  // ── Search ──
  searchSection: { marginBottom: 40 },
  searchWrap: { position: "relative" },
  searchIcon: { position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: t.textDimmed, pointerEvents: "none", display: "flex" },
  searchInput: { width: "100%", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "14px 20px 14px 48px", color: t.textPrimary, fontSize: 16, fontFamily: t.fontBody, outline: "none", transition: "border-color 0.15s" },

  // ── Event cards ──
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12, transition: "border-color 0.15s, transform 0.15s, box-shadow 0.3s", cursor: "pointer" },
  eventoCardHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  eventoCardNome: { fontFamily: t.fontTitle, fontSize: 18, fontWeight: 800, color: t.textPrimary, lineHeight: 1.2, minHeight: "2.4em", maxHeight: "2.4em", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  eventoCardMeta: { display: "flex", gap: 16, fontSize: 13, color: t.textMuted, flexWrap: "wrap", alignItems: "center" },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: t.textMuted, flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? t.accentBg : status === "hoje_pre" ? t.accentBg : status === "futuro" ? t.accentBg : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textMuted,
    border: `1px solid ${status === "ao_vivo" ? t.danger+"44" : status === "hoje_pre" ? t.accentBorder : status === "futuro" ? t.success+"44" : t.border}`,
  }),

  // ── Dashboard mockup ──
  dashboardMockup: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: t.shadowLg, minWidth: 320, maxWidth: 420 },
  dashboardStat: { background: t.bgCardAlt, borderRadius: 10, padding: "14px 16px", border: `1px solid ${t.border}` },

  // ── Live status bar ──
  liveBar: { display: "flex", alignItems: "center", justifyContent: "center", gap: 32, flexWrap: "wrap", padding: "14px 24px", background: t.bgCard, border: `1px solid ${t.border}`, borderTop: "none", borderRadius: "0 0 16px 16px", marginBottom: 40, fontSize: 13, color: t.textMuted },

  // ── Platform numbers ──
  platformSection: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 48, padding: "32px 0" },
  platformCard: { textAlign: "center", padding: "24px 16px" },

  // ── Powered footer ──
  poweredBar: { textAlign: "center", padding: "24px 0 0", borderTop: `1px solid ${t.border}`, marginTop: 16, fontSize: 11, color: t.textDisabled, letterSpacing: 1 },
});

// ── CSS keyframes (injected once) ──
const STYLE_ID = "gt-home-animations";
function injectAnimations() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes pulse-live { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
    @keyframes gradient-border { 0%{border-color:var(--gb-from)} 50%{border-color:var(--gb-to)} 100%{border-color:var(--gb-from)} }
  `;
  document.head.appendChild(style);
}

export default function TelaHome() {
  const { usuarioLogado } = useAuth();
  const { eventos, inscricoes, atletas, resultados, selecionarEvento, excluirEvento, equipes } = useEvento();
  const { setTela, organizadores, selecionarOrganizador } = useApp();
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { mobile } = useResponsivo();

  // Inject CSS animations on mount
  React.useEffect(() => { injectAnimations(); }, []);

  const totalResultados = resultados && typeof resultados === "object"
    ? Object.values(resultados).reduce((a, b) => a + (b && typeof b === "object" ? Object.keys(b).length : 0), 0)
    : 0;

  const isLoading = !eventos || eventos.length === undefined;

  const [maisEventosPag, setMaisEventosPag] = React.useState(0);
  const MAIS_POR_PAG = 9;
  const eventosRef = React.useRef(null);

  // ── Animated counters ──
  const animComp = useAnimatedCount(eventos?.length || 0);
  const animAtl = useAnimatedCount(atletas?.length || 0);
  const animEq = useAnimatedCount(equipes?.length || 0);
  const animRes = useAnimatedCount(totalResultados);

  // ── Busca ──
  const [busca, setBusca] = React.useState("");
  const [buscaDebounced, setBuscaDebounced] = React.useState("");
  React.useEffect(() => {
    const timer = setTimeout(() => setBuscaDebounced(busca), 250);
    return () => clearTimeout(timer);
  }, [busca]);

  const buscaAtiva = buscaDebounced.trim().length >= 2;
  const eventosFiltrados = buscaAtiva
    ? eventos.filter(ev => {
        const q = buscaDebounced.toLowerCase();
        if (ev.nome?.toLowerCase().includes(q)) return true;
        if (ev.cidade?.toLowerCase().includes(q)) return true;
        if (ev.local?.toLowerCase().includes(q)) return true;
        const org = organizadores?.find(o => o.id === ev.organizadorId);
        if (org?.entidade?.toLowerCase().includes(q)) return true;
        if (org?.nome?.toLowerCase().includes(q)) return true;
        return false;
      })
    : [];

  // ── Datas e categorização ──
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const aprovados = eventos || [];

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

  // Eventos ao vivo
  const eventosAoVivo = aprovados.filter(ev => getStatusEvento(ev, resultados) === "ao_vivo").length;

  // ── CTA dinâmico ──
  const getCtaEvento = (ev, status) => {
    if (status === "futuro") return { label: "Ver detalhes", action: () => selecionarEvento(ev.id) };
    if (status === "ao_vivo" || status === "hoje_pre") return { label: "Acompanhar", action: () => selecionarEvento(ev.id) };
    return { label: "Ver Resultados", action: () => selecionarEvento(ev.id, "resultados") };
  };

  // ── Agrupar finalizadas por mês ──
  const finalizadasPorMes = React.useMemo(() => {
    const grupos = {};
    eventosPassados.forEach(ev => {
      const d = ev.data ? new Date(ev.data + "T12:00:00") : null;
      const chave = d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}` : "sem-data";
      const label = d ? d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "Sem data";
      if (!grupos[chave]) grupos[chave] = { label, eventos: [] };
      grupos[chave].eventos.push(ev);
    });
    return Object.entries(grupos).sort((a, b) => b[0].localeCompare(a[0]));
  }, [eventosPassados]);

  // ── Dashboard Mockup ──
  function DashboardMockup() {
    if (mobile) return null;
    const stats = [
      { value: animComp, label: "Competições", color: t.accent },
      { value: animAtl, label: "Atletas", color: t.accent },
      { value: animEq, label: "Equipes", color: t.accent },
      { value: animRes, label: "Resultados", color: t.accent },
    ];
    return (
      <div style={s.dashboardMockup}>
        <div style={{ fontSize: 11, color: t.textDimmed, fontWeight: 700, letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase", fontFamily: t.fontTitle }}>Painel</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {stats.map((item, i) => (
            <div key={i} style={s.dashboardStat}>
              <div style={{ fontFamily: t.fontTitle, fontSize: 24, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.value.toLocaleString("pt-BR")}</div>
              <div style={{ fontSize: 11, color: t.textDimmed, marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
        {proximosEventos.length > 0 && (
          <div style={{ marginTop: 14, borderTop: `1px solid ${t.border}`, paddingTop: 12 }}>
            <div style={{ fontSize: 10, color: t.textDimmed, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, fontFamily: t.fontTitle }}>Próximos</div>
            {proximosEventos.slice(0, 3).map(ev => {
              const st = getStatusEvento(ev, resultados);
              const stColor = t.accent;
              const dataEv = ev.data ? new Date(ev.data + "T12:00:00") : null;
              const dataFmt = dataEv ? dataEv.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "") : "";
              return (
                <div key={ev.id} style={{ fontSize: 12, color: t.textMuted, padding: "5px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, borderBottom: `1px solid ${t.border}22` }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", flex: 1 }}>
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: stColor, flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, color: t.textSecondary }}>{ev.nome}</span>
                  </span>
                  <span style={{ fontSize: 11, color: t.textDimmed, flexShrink: 0 }}>{dataFmt}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Render card de evento ──
  const renderEvCard = (ev) => {
    const nAtletas = [...new Set(inscricoes.filter((i) => i.eventoId === ev.id).map((i) => i.atletaId))].length;
    const dataEv = new Date(ev.data + "T12:00:00");
    const status = getStatusEvento(ev, resultados);
    const cta = getCtaEvento(ev, status);
    const isLive = status === "ao_vivo";

    // Verificar se inscrições estão abertas
    const agora = new Date();
    const dtAb = ev.dataAberturaInscricoes ? new Date(ev.dataAberturaInscricoes + "T" + (ev.horaAberturaInscricoes || "00:00") + ":00") : null;
    const dtEnc = ev.dataEncerramentoInscricoes ? new Date(ev.dataEncerramentoInscricoes + "T" + (ev.horaEncerramentoInscricoes || "23:59") + ":00") : null;
    const inscricoesAbertas = !ev.inscricoesEncerradas && !ev.competicaoFinalizada
      && (!dtAb || agora >= dtAb)
      && (!dtEnc || agora <= dtEnc)
      && status === "futuro";

    return (
      <div key={ev.id} style={{ ...s.eventoCard, padding: 0, overflow: "hidden" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${t.accent}22`; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
        {/* Imagem da competição */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", minHeight: 200, background: t.bgCardAlt, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {ev.logoCompeticao ? (
            <img src={ev.logoCompeticao} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
          ) : (
            <span style={{ opacity: 0.15 }}>{IcoTarget(40)}</span>
          )}
          <div style={{ position: "absolute", top: 10, left: 10 }}>
            <div style={s.eventoStatusBadge(status)}>
              {isLive && <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: t.danger, animation: "pulse-live 1.5s ease-in-out infinite" }} />}
              {labelStatusEvento(status, ev)}
            </div>
          </div>
          {usuarioLogado?.tipo === "admin" && (
            <div style={{ position: "absolute", top: 8, right: 10, display: "flex", gap: 6 }}>
              <button style={{ ...s.btnIconSm, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", color: "#fff" }} onClick={(e) => { e.stopPropagation(); selecionarEvento(ev.id, "novo-evento"); }} title="Editar">{IcoEdit(14)}</button>
              <button style={{ ...s.btnIconSmDanger, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={(e) => { e.stopPropagation(); excluirEvento(ev.id); }} title="Excluir">{IcoTrash(14)}</button>
            </div>
          )}
        </div>
        <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={s.eventoCardNome}>{ev.nome}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: t.textMuted }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{IcoCalendar()} {dataEv.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}{ev.horaInicio && <> · {ev.horaInicio}h</>}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{IcoPin()} {ev.cidade || _getLocalEventoDisplay(ev)}{ev.uf ? ` - ${ev.uf}` : ""}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{IcoUsers()} {nAtletas} atleta{nAtletas !== 1 ? "s" : ""}</span>
            {(ev.dataAberturaInscricoes || ev.dataEncerramentoInscricoes) && status === "futuro" && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, flexWrap: "wrap" }}>
                {IcoCalendar()} Inscrições{ev.dataAberturaInscricoes && (
                  <>{" "}de <strong style={{ color: t.success, marginLeft: 2 }}>{new Date(ev.dataAberturaInscricoes + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}{ev.horaAberturaInscricoes ? ` ${ev.horaAberturaInscricoes}` : ""}</strong></>
                )}{ev.dataEncerramentoInscricoes && (
                  <>{" "}até <strong style={{ color: t.danger, marginLeft: 2 }}>{new Date(ev.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}{ev.horaEncerramentoInscricoes ? ` ${ev.horaEncerramentoInscricoes}` : ""}</strong></>
                )}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{ ...s.btnPrimary, padding: "9px 22px", fontSize: 13 }} onClick={() => cta.action()}>
              {cta.label}
            </button>
            {inscricoesAbertas && (
              <button style={{ ...s.btnPrimary, padding: "9px 22px", fontSize: 13, background: `linear-gradient(135deg, ${t.success}, ${t.successDark || t.success})` }} onClick={() => selecionarEvento(ev.id, "inscricao-avulsa")}>
                Realizar Inscrição
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Hero CTA ──
  const handleCriarCompetição = () => {
    const tp = usuarioLogado?.tipo;
    if (tp === "admin" || tp === "organizador") {
      selecionarEvento(null, "novo-evento");
    } else {
      setTela("planos");
    }
  };

  return (
    <div style={s.page}>
      {/* ── HERO ── */}
      <div style={{ ...s.heroSection, ...(mobile ? { flexDirection: "column", textAlign: "center", padding: "40px 20px 32px" } : {}) }}>
        <div style={{ flex: 1, maxWidth: mobile ? "100%" : 560 }}>
          <h1 style={{ ...s.heroTitle, ...(mobile ? { fontSize: 28, maxWidth: "100%" } : {}) }}>
            Gerencie competições do cadastro ao resultado final
          </h1>
          <p style={{ ...s.heroSubtitle, ...(mobile ? { maxWidth: "100%" } : {}) }}>
            Inscrições, arbitragem, súmulas e resultados em um único sistema.
          </p>
          <div style={{ ...s.heroBtns, ...(mobile ? { justifyContent: "center" } : {}) }}>
            <button style={s.btnPrimary} onClick={handleCriarCompetição}>
              Criar competição
            </button>
            <button style={s.btnSecondary} onClick={() => eventosRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Ver eventos
            </button>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", maxWidth: mobile ? "100%" : 420 }}>
          <DashboardMockup />
        </div>
      </div>

      {/* ── BUSCA ── */}
      <div style={s.searchSection}>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>{SearchIcon(18)}</span>
          <input
            style={s.searchInput}
            placeholder="Buscar eventos, cidades ou organizadores..."
            value={busca}
            onChange={e => { setBusca(e.target.value); setMaisEventosPag(0); }}
            onFocus={e => { e.target.style.borderColor = t.accent; e.target.style.boxShadow = `0 0 0 3px ${t.accent}22`; }}
            onBlur={e => { e.target.style.borderColor = t.border; e.target.style.boxShadow = "none"; }}
          />
        </div>
      </div>

      {/* ── CTA PLANOS (visitantes) ── */}
      {!usuarioLogado && (
        <div style={{ background: `linear-gradient(135deg, ${t.accent}15, ${t.accentDark}10)`, border: `1px solid ${t.accentBorder}`, borderRadius: 14, padding: "24px 28px", marginBottom: 40, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontFamily: t.fontTitle, fontSize: 20, fontWeight: 800, color: t.textPrimary, letterSpacing: 0.5 }}>
              Gerencie suas competições de atletismo
            </div>
            <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>
              Planos a partir de R$ 400,00 por competição. Todos os módulos inclusos.
            </div>
          </div>
          <button onClick={() => setTela("planos")} style={{ ...s.btnPrimary, whiteSpace: "nowrap" }}>
            Conheça os Nossos Planos
          </button>
        </div>
      )}

      {/* ── ORGANIZADORES ── */}
      {(() => {
        const orgsAtivos = (organizadores || []).filter(o => o.status === "aprovado");
        const orgsComEventos = orgsAtivos.filter(o =>
          eventos.some(ev => ev.organizadorId === o.id)
        );
        if (orgsComEventos.length === 0) return null;
        return (
          <div style={{ marginBottom: 40 }}>
            <h2 style={s.sectionTitle}>Organizadores</h2>
            <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
              {orgsComEventos.map(org => {
                const nComp = eventos.filter(ev => ev.organizadorId === org.id).length;
                const corPri = org.corPrimaria || t.accent;
                return (
                  <div key={org.id}
                    onClick={() => { if (selecionarOrganizador) selecionarOrganizador(org.id); }}
                    style={{
                      flex: "0 0 auto", width: 168, background: t.bgCard,
                      border: `1px solid ${t.border}`, borderRadius: 14,
                      padding: "18px 14px", textAlign: "center", cursor: "pointer",
                      transition: "border-color 0.2s, transform 0.15s, box-shadow 0.2s",
                      boxShadow: t.shadow,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = corPri; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = t.shadowLg; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = t.shadow; }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 14, margin: "0 auto 10px",
                      overflow: "hidden", background: t.bgCardAlt,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: `2px solid ${corPri}33`,
                    }}>
                      {org.logo ? (
                        <img src={org.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <span style={{ fontSize: 16, opacity: 0.4, fontFamily: t.fontTitle, fontWeight: 700, color: t.textDisabled }}>ORG</span>
                      )}
                    </div>
                    <div style={{ fontFamily: t.fontTitle, fontSize: 14, fontWeight: 700, color: t.textPrimary, lineHeight: 1.2, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {org.entidade || org.nome}
                    </div>
                    <div style={{ fontSize: 11, color: t.textDimmed }}>
                      {nComp} {nComp !== 1 ? "competições" : "competição"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── EVENTOS ── */}
      <div ref={eventosRef}>
        {isLoading ? (
          /* Skeleton loading */
          <div style={{ marginBottom: 48 }}>
            <div style={{ ...s.sectionTitle, background: t.bgCardAlt, width: 200, height: 26, borderRadius: 8, marginBottom: 20 }} />
            <div style={s.eventosGrid}>
              {[1,2,3].map(i => <SkeletonCard key={i} t={t} />)}
            </div>
          </div>
        ) : buscaAtiva ? (
          /* Resultados da busca */
          <div style={{ marginBottom: 48 }}>
            <h2 style={s.sectionTitle}>
              Resultados da busca
              <span style={{ color: t.textDimmed, fontSize: 16, fontWeight: 400, marginLeft: 10 }}>({eventosFiltrados.length})</span>
            </h2>
            {eventosFiltrados.length === 0 ? (
              <div style={s.emptyState}>
                <span style={{ fontSize: 18, color: t.textDisabled, fontFamily: t.fontTitle, fontWeight: 700 }}>Nenhum evento encontrado</span>
                <p>Tente buscar por outro nome, cidade ou organizador.</p>
              </div>
            ) : (
              <div style={s.eventosGrid}>
                {eventosFiltrados.map(ev => renderEvCard(ev))}
              </div>
            )}
          </div>
        ) : (
          /* Listagem normal */
          <>
            {aprovados.length === 0 ? (
              <div style={s.emptyState}>
                <span style={{ fontSize: 20, color: t.textDisabled, fontFamily: t.fontTitle, fontWeight: 700 }}>SEM COMPETIÇÕES</span>
                <p>Nenhuma competição cadastrada ainda.</p>
                {usuarioLogado?.tipo === "admin" && (
                  <button style={{ ...s.btnPrimary, width: "auto" }} onClick={() => selecionarEvento(null, "novo-evento")}>
                    Cadastrar primeira competição
                  </button>
                )}
              </div>
            ) : (
              <>
                {proximosEventos.length > 0 && (
                  <div style={{ marginBottom: 48 }}>
                    <h2 style={s.sectionTitle}>Próximos Eventos</h2>
                    <div style={s.eventosGrid}>
                      {proximosEventos.map(ev => renderEvCard(ev))}
                    </div>
                  </div>
                )}

                {maisEventos.length > 0 && (
                  <div style={{ marginBottom: 48 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                      <h2 style={{ ...s.sectionTitle, margin: 0 }}>
                        Mais Eventos
                        {totalPagsMais > 1 && <span style={{ color: t.textDimmed, fontSize: 16, fontWeight: 400, marginLeft: 10 }}>— Seção {maisEventosPag + 1} de {totalPagsMais}</span>}
                      </h2>
                      {totalPagsMais > 1 && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button disabled={maisEventosPag === 0}
                            onClick={() => setMaisEventosPag(p => p - 1)}
                            style={{ ...s.btnGhost, opacity: maisEventosPag === 0 ? 0.3 : 1, cursor: maisEventosPag === 0 ? "default" : "pointer" }}>
                            ‹ Anterior
                          </button>
                          <button disabled={maisEventosPag >= totalPagsMais - 1}
                            onClick={() => setMaisEventosPag(p => p + 1)}
                            style={{ ...s.btnGhost, opacity: maisEventosPag >= totalPagsMais - 1 ? 0.3 : 1, cursor: maisEventosPag >= totalPagsMais - 1 ? "default" : "pointer" }}>
                            Próximo ›
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={s.eventosGrid}>
                      {maisEventosPagAtual.map(ev => renderEvCard(ev))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── COMPETIÇÕES FINALIZADAS (agrupadas por mês) ── */}
      {!buscaAtiva && finalizadasPorMes.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <h2 style={s.sectionTitle}>Competições Finalizadas</h2>
          {finalizadasPorMes.map(([chave, grupo]) => (
            <div key={chave} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.textDimmed, fontFamily: t.fontTitle, letterSpacing: 0.5, textTransform: "capitalize", marginBottom: 8, paddingLeft: 4 }}>
                {grupo.label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {grupo.eventos.map(ev => {
                  const dataFmt = ev.data ? new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR") : "—";
                  const local = _getLocalEventoDisplay(ev);
                  return (
                    <div key={ev.id}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.boxShadow = `0 2px 12px ${t.accent}15`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}>
                      <div style={{ flex: 1 }} onClick={() => selecionarEvento(ev.id)}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary }}>
                          <span style={{ color: t.textDimmed, fontWeight: 600 }}>{dataFmt}</span>
                          <span style={{ margin: "0 8px", color: t.textDisabled }}>—</span>
                          {ev.nome}
                        </div>
                        {local && <div style={{ fontSize: 12, color: t.textMuted }}>{IcoPin()} {local}</div>}
                      </div>
                      <button style={{ ...s.btnSecondary, padding: "5px 12px", fontSize: 12, flexShrink: 0 }} onClick={() => selecionarEvento(ev.id, "resultados")}>
                        Ver Resultados
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── POWERED BY ── */}
      <div style={s.poweredBar}>
        <span style={{ fontFamily: t.fontTitle, fontWeight: 700 }}>GERENTRACK</span>
        <span style={{ margin: "0 6px" }}>·</span>
        Plataforma de gerenciamento de competições
      </div>
    </div>
  );
}
