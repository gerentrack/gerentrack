import React from "react";
import { getStatusEvento, labelStatusEvento } from "./eventoHelpers";
import { _getLocalEventoDisplay } from "../../shared/formatters/utils";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";

import { IcoCalendar, IcoClock, IcoPin, IcoList, IcoTarget, IcoUsers, IcoEdit, IcoPen, IcoTrash } from "../../shared/icons";

const getStyles = (t) => ({
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
  btnIconSmDanger: { background: t.accentBg, border: `1px solid ${t.danger}44`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
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
  erro: { background: t.accentBg, border: `1px solid ${t.danger}`, color: t.danger, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn: { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", padding: 0 },
  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  badgeGold: { background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
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
  resumoInscricao: { background: t.bgCard, border: `1px solid ${t.accent}33`, borderRadius: 10, padding: "16px 20px", marginTop: 16 },
  tagProva: { background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44`, borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  sumuCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  savedBadge: { background: t.accentBg, border: `1px solid ${t.success}44`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  digitarDica: { color: t.textDimmed, fontSize: 12 },
  inputMarca: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", color: t.accent, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
  infoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: t.accent, marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: `1px solid ${t.border}`, fontSize: 14, color: t.textSecondary, display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: t.accent, fontWeight: 700 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: t.bgHeader, borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroOverlay: { position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 100%)", zIndex: 0, borderRadius: 16, pointerEvents: "none" },
  heroContent: { position: "relative", zIndex: 1 },
  heroBadge: { display: "inline-block", background: t.accent, color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, color: t.textPrimary, lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: 20, marginBottom: 48, overflowX: "auto" },
  eventoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, lineHeight: 1.2, minHeight: "2.4em", maxHeight: "2.4em", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  eventoCardMeta: { fontSize: 13, color: t.textDimmed },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: t.textMuted, flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? t.accentBg : status === "hoje_pre" ? t.accentBg : status === "futuro" ? t.accentBg : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textMuted,
    border: `1px solid ${status === "ao_vivo" ? t.danger+"44" : status === "hoje_pre" ? t.accentBorder : status === "futuro" ? t.success+"44" : t.border}`,
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
  filtroPill: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textDimmed, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5, transition: "all 0.15s" },
  filtroPillAtivo: { background: t.bgHover, border: `1px solid ${t.accent}`, color: t.accent },
  filtroClearBtn: { background: "none", border: "none", color: t.accent + "88", cursor: "pointer", fontSize: 11, fontFamily: "'Barlow', sans-serif", padding: "0 4px", textDecoration: "underline" },
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
});

function StatCard({ value, label, escala = 1 }) {
  const t = useTema();
  return (
    <div style={{ background:t.bgCard+"cc", border:`1px solid ${t.border}`, borderRadius:10, padding:`${Math.round(12*escala)}px ${Math.round(20*escala)}px`, textAlign:"center" }}>
      <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:Math.round(28*escala), fontWeight:900, color: t.accent, lineHeight:1 }}>{value}</div>
      <div style={{ color: t.textDimmed, fontSize:Math.round(11*escala), letterSpacing:1, textTransform:"uppercase", marginTop:4 }}>{label}</div>
    </div>
  );
}

function InfoCard({ icon, title, items }) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  return (
    <div style={s.infoCard}>
      <div style={s.infoCardTitle}>{icon ? `${icon} ` : ""}{title}</div>
      <ul style={s.infoList}>
        {items.map((item, i) => (
          <li key={i} style={s.infoItem}>
            <span style={s.infoItemDot}>›</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TelaHome() {
  const { usuarioLogado } = useAuth();
  const { eventos, inscricoes, atletas, resultados, selecionarEvento, excluirEvento, equipes } = useEvento();
  const { setTela, organizadores, selecionarOrganizador, siteBranding } = useApp();
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const totalResultados = resultados && typeof resultados === "object"
    ? Object.values(resultados).reduce((a, b) => a + (b && typeof b === "object" ? Object.keys(b).length : 0), 0)
    : 0;

  const [maisEventosPag, setMaisEventosPag] = React.useState(0);
  const MAIS_POR_PAG = 9;

  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const aprovados = eventos;

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
    return (
      <div key={ev.id} style={{ ...s.eventoCard, padding:0, overflow:"hidden" }}>
        <div style={{ position:"relative", width:"100%", aspectRatio:"1/1", minHeight:200, background: t.bgCard, borderBottom:`1px solid ${t.border}`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {ev.logoCompeticao && !ev.competicaoFinalizada ? (
            <img src={ev.logoCompeticao} alt="" style={{ maxWidth:"100%", maxHeight:"100%", display:"block", objectFit:"contain" }} />
          ) : (
            <span style={{ opacity:0.3 }}>{IcoTarget(28)}</span>
          )}
          <div style={{ position:"absolute", top:10, left:12, display:"flex", flexDirection:"column", gap:4 }}>
            <div style={s.eventoStatusBadge(status)}>{labelStatusEvento(status, ev)}</div>
          </div>
          {usuarioLogado?.tipo === "admin" && (
            <div style={{ position:"absolute", top:8, right:10, display:"flex", gap:6 }}>
              <button style={{ ...s.btnIconSm, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }} onClick={() => selecionarEvento(ev.id, "novo-evento")} title="Editar">{IcoEdit(14)}</button>
              <button style={{ ...s.btnIconSmDanger, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }} onClick={() => excluirEvento(ev.id)} title="Excluir">{IcoTrash(14)}</button>
            </div>
          )}
        </div>
        <div style={{ padding:"14px 20px 20px" }}>
          <div style={s.eventoCardNome}>{ev.nome}</div>
          <div style={s.eventoCardMeta}>
            <span>{IcoCalendar()} {dataEv.toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" })}
              {ev.horaInicio && <> · {IcoClock()} {ev.horaInicio}h</>}
            </span>
          </div>
          <div style={s.eventoCardMeta}><span>{IcoPin()} {_getLocalEventoDisplay(ev)}</span></div>
          {(ev.dataAberturaInscricoes || ev.dataEncerramentoInscricoes) && (
            <div style={s.eventoCardMeta}>
              <span>{IcoList()} Inscrições:&nbsp;
                {ev.dataAberturaInscricoes && <>{new Date(ev.dataAberturaInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}</>}
                {ev.dataAberturaInscricoes && ev.dataEncerramentoInscricoes && " a "}
                {ev.dataEncerramentoInscricoes && <>{new Date(ev.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}</>}
              </span>
            </div>
          )}
          <div style={s.eventoCardStats}>
            <span>{IcoTarget()} {nProvas} prova{nProvas !== 1 ? "s" : ""}</span>
            <span>{IcoUsers()} {nAtletas} atleta{nAtletas !== 1 ? "s" : ""}</span>
            <span>{IcoPen()} {nInscs} {nInscs !== 1 ? "inscrições" : "inscrição"}</span>
          </div>
          <div style={{ display:"flex", gap:6, marginBottom:10 }}>
            {(() => {
              const tpU = usuarioLogado?.tipo;
              const temAcessoSumula = tpU === "admin" || tpU === "organizador" ||
                (tpU === "funcionario" && (usuarioLogado?.permissoes?.includes("sumulas") || usuarioLogado?.permissoes?.includes("resultados"))) ||
                (ev.sumulaLiberada && usuarioLogado);
              return temAcessoSumula && (
                <button style={{...s.btnSecondary, flex:1}} onClick={() => selecionarEvento(ev.id, "sumulas")}>
                  Súmulas
                </button>
              );
            })()}
            {(status === "ao_vivo" || status === "encerrado" || status === "hoje_pre") && (
              <button style={{...s.btnSecondary, flex:1}} onClick={() => selecionarEvento(ev.id, "resultados")}>
                Resultados
              </button>
            )}
          </div>
          <button style={s.btnPrimary} onClick={() => selecionarEvento(ev.id)}>
            Acessar Competição →
          </button>
        </div>
      </div>
    );
  };


  return (
    <div style={s.page}>
      <div style={{
        ...s.heroSection,
        height: siteBranding?.heroAltura || 400,
        minHeight: siteBranding?.heroAltura || 400,
        padding: 0,
        ...(siteBranding?.heroBg ? {
          backgroundImage: `url(${siteBranding.heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          background: undefined,
        } : {}),
      }}>
        {siteBranding?.heroBg && <div style={s.heroOverlay} />}
        <div style={{ position:"relative", zIndex:1, width:"100%", height:"100%" }}>
        {(() => {
          const tam = siteBranding?.heroTamanhos || { badge: 1, titulo: 1, subtitulo: 1, stats: 1 };
          const pos = siteBranding?.heroPosicoes || { badge:{x:50,y:8}, titulo:{x:50,y:28}, subtitulo:{x:50,y:48}, stats:{x:50,y:72} };
          const hs = siteBranding?.heroStats || { competicoes: true, organizadores: true, equipes: true, atletas: true };

          const wrap = (key, child) => child ? (
            <div key={key} style={{
              position:"absolute",
              left: `${pos[key]?.x ?? 50}%`,
              top: `${pos[key]?.y ?? 50}%`,
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              whiteSpace: key === "stats" ? "normal" : "nowrap",
              maxWidth: key === "stats" ? "90%" : undefined,
            }}>
              {child}
            </div>
          ) : null;

          return [
            wrap("badge", (siteBranding?.heroBadge ?? "PLATAFORMA DE COMPETIÇÕES") ? (
              <div style={{ ...s.heroBadge, fontSize: 12 * (tam.badge || 1), padding: `${6*(tam.badge||1)}px ${16*(tam.badge||1)}px` }}>
                {siteBranding?.heroBadge || "PLATAFORMA DE COMPETIÇÕES"}
              </div>
            ) : null),

            wrap("titulo", (siteBranding?.heroMostrarTitulo !== false) ? (
              <h1 style={{ ...s.heroTitle, fontSize: 56 * (tam.titulo || 1), margin: 0 }}>
                {siteBranding?.nome || "GERENTRACK"}
              </h1>
            ) : null),

            wrap("subtitulo", (siteBranding?.heroSubtitulo ?? "Gerencie competições, inscrições, súmulas e resultados em um só lugar.") ? (
              <p style={{ color: t.textMuted, fontSize: 16 * (tam.subtitulo || 1), margin: 0 }}>
                {siteBranding?.heroSubtitulo || "Gerencie competições, inscrições, súmulas e resultados em um só lugar."}
              </p>
            ) : null),

            wrap("stats", (() => {
              const cards = [];
              if (hs.competicoes) cards.push(<StatCard key="comp" value={eventos.length} label="Competições" escala={tam.stats || 1} />);
              if (hs.organizadores) cards.push(<StatCard key="org" value={organizadores?.filter(o => !o.status || o.status === "aprovado").length || 0} label="Organizadores" escala={tam.stats || 1} />);
              if (hs.equipes) cards.push(<StatCard key="eq" value={equipes?.length || 0} label="Equipes" escala={tam.stats || 1} />);
              if (hs.atletas) cards.push(<StatCard key="atl" value={atletas.length} label="Atletas" escala={tam.stats || 1} />);
              if (cards.length === 0) return null;
              return (
                <div style={{ display:"flex", justifyContent:"center", gap:14, flexWrap:"wrap" }}>
                  {cards}
                </div>
              );
            })()),
          ].filter(Boolean);
        })()}
        </div>
      </div>

      {/* ── CTA PLANOS (visitantes) ── */}
      {!usuarioLogado && (
        <div style={{ background: `linear-gradient(135deg, ${t.accent}15, ${t.accentDark}10)`, border: `1px solid ${t.accentBorder}`, borderRadius: 14, padding: "24px 28px", marginBottom: 40, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: t.textPrimary, letterSpacing: 0.5 }}>
              Gerencie suas competições de atletismo
            </div>
            <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>
              Planos a partir de R$ 400,00 por competição. Todos os módulos inclusos.
            </div>
          </div>
          <button onClick={() => setTela("planos")} style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, whiteSpace: "nowrap" }}>
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
                    onClick={() => {
                      if (selecionarOrganizador) selecionarOrganizador(org.id);
                    }}
                    style={{
                      flex: "0 0 auto", width: 160, background: t.bgCard,
                      border: `1px solid ${t.border}`, borderRadius: 14,
                      padding: "18px 14px", textAlign: "center", cursor: "pointer",
                      transition: "border-color 0.2s, transform 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = corPri; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = "translateY(0)"; }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 12, margin: "0 auto 10px",
                      overflow: "hidden", background: t.bgCardAlt,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: `2px solid ${corPri}33`,
                    }}>
                      {org.logo ? (
                        <img src={org.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <span style={{ fontSize: 16, opacity: 0.4, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: t.textDisabled }}>ORG</span>
                      )}
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: t.textPrimary, lineHeight: 1.2, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
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

      {/* ── PRÓXIMOS EVENTOS (mês atual) ── */}
      {aprovados.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize:20, color: t.textDisabled, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>SEM COMPETIÇÕES</span>
          <p>Nenhuma competição cadastrada ainda.</p>
          {usuarioLogado?.tipo === "admin" && (
            <button style={{ ...s.btnPrimary, width:"auto" }} onClick={() => selecionarEvento(null, "novo-evento")}>
              Cadastrar primeira competição
            </button>
          )}
        </div>
      ) : (
        <>
          {proximosEventos.length > 0 && (
            <div style={{ marginBottom:48 }}>
              <h2 style={s.sectionTitle}>Próximos Eventos</h2>
              <div style={s.eventosGrid}>
                {proximosEventos.map(ev => renderEvCard(ev))}
              </div>
            </div>
          )}

          {maisEventos.length > 0 && (
            <div style={{ marginBottom:48 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:24 }}>
                <h2 style={{ ...s.sectionTitle, margin:0 }}>
                  Mais Eventos
                  {totalPagsMais > 1 && <span style={{ color: t.textDimmed, fontSize:16, fontWeight:400, marginLeft:10 }}>— Seção {maisEventosPag + 1} de {totalPagsMais}</span>}
                </h2>
                {totalPagsMais > 1 && (
                  <div style={{ display:"flex", gap:8 }}>
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

      {eventosPassados.length > 0 && (
        <div style={{ marginBottom:48 }}>
          <h2 style={s.sectionTitle}>Competições Finalizadas</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {eventosPassados.map(ev => {
              const dataFmt = ev.data ? new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR") : "—";
              const local = _getLocalEventoDisplay(ev);
              const tpU = usuarioLogado?.tipo;
              const temSumula = tpU === "admin" || tpU === "organizador" ||
                (tpU === "funcionario" && (usuarioLogado?.permissoes?.includes("sumulas") || usuarioLogado?.permissoes?.includes("resultados"))) ||
                (ev.sumulaLiberada && usuarioLogado);
              return (
                <div key={ev.id}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, cursor:"pointer", transition:"border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = t.accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
                  <div style={{ flex:1 }}
                    onClick={() => selecionarEvento(ev.id)}>
                    <div style={{ fontSize:14, fontWeight:700, color:t.textPrimary }}>
                      <span style={{ color:t.textDimmed, fontWeight:600 }}>{dataFmt}</span>
                      <span style={{ margin:"0 8px", color:t.textDisabled }}>—</span>
                      {ev.nome}
                    </div>
                    {local && <div style={{ fontSize:12, color:t.textMuted }}>{IcoPin()} {local}</div>}
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    {temSumula && (
                      <button style={{...s.btnSecondary, padding:"5px 12px", fontSize:12}} onClick={() => selecionarEvento(ev.id, "sumulas")}>
                        Súmulas
                      </button>
                    )}
                    <button style={{...s.btnSecondary, padding:"5px 12px", fontSize:12}} onClick={() => selecionarEvento(ev.id, "resultados")}>
                      Resultados
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:24, marginTop:48 }}>
        <InfoCard title="Provas de Pista" items={["Corridas Rasas","Corridas c/ Barreiras","Corrida c/ Obstáculos","Marcha Atlética","Revezamentos"]} />
        <InfoCard title="Provas de Campo" items={["Salto em Distância","Salto em Altura","Salto Triplo","Salto com Vara","Arremesso do Peso","Lançamento do Disco","Lançamento do Dardo","Lançamento do Martelo"]} />
        <InfoCard title="Provas Combinadas" items={["Decatlo (10 provas)","Heptatlo (7 provas)","Hexatlo Masc. (6 provas)","Pentatlo Fem. (5 provas)","Tetratlo (4 provas)"]} />
      </div>
    </div>
  );
}
