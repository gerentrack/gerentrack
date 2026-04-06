import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { todasAsProvas, nPernasRevezamento, isRevezamentoMisto } from "../../shared/athletics/provasDef";
import { CATEGORIAS } from "../../shared/constants/categorias";
import { ProvaSelector } from "../ui/ProvaSelector";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";

// Verifica em tempo real se as inscrições estão encerradas,
// levando em conta data+hora de encerramento além do flag salvo.
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

function TelaInscricaoRevezamento() {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { usuarioLogado } = useAuth();
  const { eventoAtual, inscricoes, atletas, equipes, excluirInscricao, adicionarInscricao, atualizarInscricao, numeracaoPeito } = useEvento();
  const { setTela, registrarAcao } = useApp();
  const confirmar = useConfirm();
  if (!eventoAtual) return <div style={s.page}><div style={s.emptyState}><p>Nenhuma competição selecionada.</p></div></div>;

  const tipoUser = usuarioLogado?.tipo;
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
  const provasRevez = todasAsProvas().filter(p => p.tipo === "revezamento" && (eventoAtual.provasPrograma || []).includes(p.id));
  const inscsEvt = inscricoes.filter(i => i.eventoId === eid);
  const inscsRevez = inscsEvt.filter(i => i.tipo === "revezamento");
  const numPeito = numeracaoPeito?.[eid] || {};

  const [revezForm, setRevezForm] = useState(null);
  const [revezBusca, setRevezBusca] = useState(["","","","",""]);
  const [feedback, setFeedback] = useState("");
  const [focusIdx, setFocusIdx] = useState(-1);

  // Todas as equipes que possuem atletas cadastrados (não exige inscrição individual prévia)
  const equipesComInscritos = (() => {
    const eqSet = new Set();
    // Equipes com atletas inscritos no evento
    inscsEvt.filter(i => i.tipo !== "revezamento").forEach(i => {
      const a = atletas.find(at => at.id === i.atletaId);
      if (a) { const eqId = a.equipeId || (a.clube ? "clube_" + a.clube : ""); if (eqId) eqSet.add(eqId); }
    });
    // Todas as equipes cadastradas que tenham atletas
    for (const eq of (equipes || [])) {
      if (eq.id && atletas.some(a => a.equipeId === eq.id)) eqSet.add(eq.id);
    }
    return [...eqSet].map(eqId => {
      const eq = equipes.find(e => e.id === eqId);
      return { id: eqId, nome: eq ? (eq.clube || eq.nome) : (eqId.startsWith("clube_") ? eqId.substring(6) : eqId), sigla: eq?.sigla || "" };
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  })();

  // Para equipe/treinador, filtrar só sua equipe
  const equipeIdUser = tipoUser === "equipe" ? usuarioLogado.id : tipoUser === "treinador" ? usuarioLogado.equipeId : null;
  const equipesDisponiveis = equipeIdUser ? equipesComInscritos.filter(e => e.id === equipeIdUser) : equipesComInscritos;

  const provaSel = revezForm ? todasAsProvas().find(p => p.id === revezForm.provaId) : null;
  const nPernas = provaSel ? nPernasRevezamento(provaSel) : 4;
  const isMisto = provaSel ? isRevezamentoMisto(provaSel) : false;
  const catId = revezForm?.provaId ? revezForm.provaId.split("_")[1] : "";

  // Pool de atletas: todos os atletas da equipe selecionada (não exige inscrição individual prévia)
  // Inclui atletas de participação cruzada (orgsAutorizadas)
  const atletasPool = (() => {
    if (!revezForm?.equipeId) return [];
    const pool = [];
    const vistos = new Set();
    const orgsAutorizadas = new Set(eventoAtual?.orgsAutorizadas || []);
    for (const a of (atletas || [])) {
      if (vistos.has(a.id)) continue;
      const eqId = a.equipeId || (a.clube ? "clube_" + a.clube : "");
      const ehDaEquipe = eqId === revezForm.equipeId;
      const ehCruzado = orgsAutorizadas.size > 0 && a.organizadorId && orgsAutorizadas.has(a.organizadorId);
      if ((ehDaEquipe || ehCruzado) && (isMisto || a.sexo === revezForm.sexo)) {
        vistos.add(a.id);
        pool.push({ ...a, _cruzado: ehCruzado && !ehDaEquipe });
      }
    }
    return pool.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
  })();

  const buscarAtleta = (query) => {
    if (!query || query.trim().length === 0) return atletasPool.slice(0, 15); // mostra todos ao focar
    const q = query.trim().toLowerCase();
    return atletasPool.filter(a => {
      if (a.nome?.toLowerCase().includes(q)) return true;
      if (a.cbat && a.cbat.includes(q)) return true;
      if (numPeito[a.id] && String(numPeito[a.id]).includes(q)) return true;
      return false;
    }).slice(0, 15);
  };

  const handleSalvar = () => {
    if (!revezForm.provaId || !revezForm.equipeId) { setFeedback("❌ Selecione prova e equipe."); return; }
    const idsValidos = revezForm.atletasIds.filter(Boolean);
    if (idsValidos.length < nPernas) { setFeedback(`❌ Preencha todos os ${nPernas} atletas. Use a lista suspensa para selecionar.`); return; }
    // Validar que todos os IDs correspondem a atletas reais
    const idsInvalidos = idsValidos.filter(aid => !atletas.find(a => a.id === aid));
    if (idsInvalidos.length > 0) { setFeedback("❌ Atleta(s) inválido(s). Remova e selecione novamente da lista."); return; }
    // ── Validar limite de revezamentos por atleta ──
    const limRev = eventoAtual.limiteProvasRevezamento || 0;
    if (limRev > 0) {
      const revInscsEvento = inscricoes.filter(i => i.eventoId === eid && i.tipo === "revezamento" && i.id !== revezForm.editId);
      for (const aid of idsValidos) {
        const countAtleta = revInscsEvento.filter(i => (i.atletasIds || []).includes(aid)).length;
        if (countAtleta + 1 > limRev) {
          const aName = atletas.find(a => a.id === aid)?.nome || aid;
          setFeedback(`❌ Atleta "${aName}" já atingiu o limite de ${limRev} revezamento(s).`);
          return;
        }
      }
    }
    const catFinal = catId;
    // Validar que nenhum atleta já está em outra equipe de revezamento na mesma prova/cat/sexo
    if (!revezForm.editId) {
      const outrasInscs = inscsRevez.filter(i =>
        i.provaId === revezForm.provaId &&
        (i.categoriaId || i.categoriaOficialId) === catFinal && i.sexo === revezForm.sexo
      );
      for (const aid of idsValidos) {
        const jaEm = outrasInscs.find(i => (i.atletasIds || []).includes(aid));
        if (jaEm) {
          const aName = atletas.find(a => a.id === aid)?.nome || aid;
          const eqName = equipes.find(e => e.id === jaEm.equipeId)?.nome || jaEm.equipeId;
          setFeedback(`❌ Atleta "${aName}" já está inscrito em outra equipe de revezamento (${eqName}) nesta prova.`);
          return;
        }
      }
    }
    const inscObj = {
      id: revezForm.editId || `rev_${eid}_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
      tipo: "revezamento", eventoId: eid, equipeId: revezForm.equipeId,
      provaId: revezForm.provaId, categoriaId: catFinal, categoriaOficialId: catFinal,
      sexo: revezForm.sexo, atletasIds: idsValidos,
      data: new Date().toISOString(),
      inscritoPorId: usuarioLogado?.id, inscritoPorNome: usuarioLogado?.nome || "—", inscritoPorTipo: usuarioLogado?.tipo,
    };
    if (revezForm.editId) { atualizarInscricao(inscObj); setFeedback("✅ Revezamento atualizado!"); }
    else { adicionarInscricao(inscObj); setFeedback("✅ Equipe inscrita com sucesso!"); }
    if (registrarAcao) {
      const eq = equipes.find(e => e.id === revezForm.equipeId);
      registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, revezForm.editId ? "Editou inscrição revezamento" : "Inscreveu revezamento",
        `${provaSel?.nome || revezForm.provaId} — ${eq?.clube || eq?.nome || revezForm.equipeId}`,
        usuarioLogado?.organizadorId || usuarioLogado?.id, { modulo: "revezamento" });
    }
    setRevezForm(null); setRevezBusca(["","","","",""]);
    setTimeout(() => setFeedback(""), 4000);
  };

  const abrirEdicao = (insc) => {
    // Limpar IDs que não correspondem a atletas reais
    const idsLimpos = (insc.atletasIds || []).map(aid => {
      return atletas.find(a => a.id === aid) ? aid : "";
    });
    const nInvalidos = (insc.atletasIds || []).filter(aid => aid && !atletas.find(a => a.id === aid)).length;
    setRevezForm({
      editId: insc.id, provaId: insc.provaId,
      catId: insc.categoriaId || insc.categoriaOficialId,
      sexo: insc.sexo, equipeId: insc.equipeId,
      atletasIds: idsLimpos,
    });
    setRevezBusca(idsLimpos.map(() => ""));
    if (nInvalidos > 0) setFeedback(`⚠️ ${nInvalidos} atleta(s) com ID inválido foram removidos. Selecione novamente da lista.`);
    else setFeedback("");
  };

  const handleExcluir = async (insc) => { 
    const prv = todasAsProvas().find(p => p.id === insc.provaId);
    const eq = equipes.find(e => e.id === insc.equipeId);
    const nomeEq = eq ? (eq.clube || eq.nome || "—") : "—";
    if (!await confirmar(`Remover inscrição de ${nomeEq } em ${prv?.nome || insc.provaId}?`)) return;
    excluirInscricao(insc.id, { confirmado: true });
    if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, "Removeu inscrição revezamento",
      `${prv?.nome || insc.provaId} — ${nomeEq}`, usuarioLogado?.organizadorId || usuarioLogado?.id, { modulo: "revezamento" });
    setFeedback("✅ Inscrição removida."); setTimeout(() => setFeedback(""), 3000);
  };

  // Filtrar inscrições exibidas (equipe/treinador vê só as suas)
  const inscsVisiveis = equipeIdUser ? inscsRevez.filter(i => i.equipeId === equipeIdUser) : inscsRevez;

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>🏃‍♂️ Inscrição de Revezamento</h1>
          <div style={{ color: t.textDimmed, fontSize: 13 }}>
            {eventoAtual.nome} — {provasRevez.length} prova(s) · {inscsVisiveis.length} equipe(s) inscrita(s)
          </div>
        </div>
        <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar</button>
      </div>

      {feedback && (
        <div style={{ background: feedback.includes("❌") ? `${t.danger}15` : `${t.success}15`, border: `1px solid ${feedback.includes("❌") ? `${t.danger}66` : `${t.success}66`}`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: feedback.includes("❌") ? t.danger : t.success, fontSize: 13 }}>
          {feedback}
        </div>
      )}

      {/* ── INSCRIÇÕES EXISTENTES ── */}
      {inscsVisiveis.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: t.accent, fontSize: 16, marginBottom: 10, fontFamily: "'Barlow Condensed', sans-serif" }}>
            Equipes Inscritas
          </h2>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead><tr>
                <th style={s.th}>Prova</th>
                <th style={s.th}>Cat.</th>
                <th style={s.th}>Sexo</th>
                <th style={s.th}>Equipe</th>
                <th style={s.th}>Atletas</th>
                <th style={s.th}>Ações</th>
              </tr></thead>
              <tbody>
                {inscsVisiveis.map(insc => {
                  const prv = todasAsProvas().find(p => p.id === insc.provaId);
                  const eq = equipes.find(e => e.id === insc.equipeId);
                  const nomeEq = eq ? (eq.clube || eq.nome || "—") : (insc.equipeId?.startsWith("clube_") ? insc.equipeId.substring(6) : "—");
                  const siglaEq = eq?.sigla ? ` (${eq.sigla})` : "";
                  const nomes = (insc.atletasIds || []).map(aid => { const a = atletas.find(at => at.id === aid); return a?.nome || null; });
                  const temInvalidos = nomes.some(n => n === null);
                  const nomesStr = nomes.filter(Boolean).join(" · ");
                  return (
                    <tr key={insc.id} style={s.tr}>
                      <td style={s.td}>{prv?.nome || insc.provaId}</td>
                      <td style={s.td}>{CATEGORIAS.find(c => c.id === (insc.categoriaId || insc.categoriaOficialId))?.nome || "—"}</td>
                      <td style={{ ...s.td, textAlign: "center" }}>
                        <span style={{ color: insc.sexo === "M" ? "#1a6ef5" : "#e54f9b" }}>{insc.sexo === "M" ? "Masc" : "Fem"}</span>
                      </td>
                      <td style={{ ...s.td, fontWeight: 600, color: t.accent }}>{nomeEq}{siglaEq}</td>
                      <td style={{ ...s.td, fontSize: 11 }}>
                        {nomesStr ? <span style={{ color: t.textTertiary }}>{nomesStr}</span> : null}
                        {temInvalidos && <span style={{ color: t.danger, fontWeight: 600 }}> ⚠ {nomes.filter(n => n === null).length} ID(s) inválido(s) — edite para corrigir</span>}
                        {!nomesStr && !temInvalidos && <span style={{ color: t.textDimmed }}>Sem atletas</span>}
                      </td>
                      <td style={{ ...s.td, whiteSpace: "nowrap" }}>
                        <button onClick={() => abrirEdicao(insc)}
                          style={{ ...s.btnGhost, fontSize: 11, padding: "3px 8px", marginRight: 6 }} title="Editar">✏️ Editar</button>
                        <button onClick={() => handleExcluir(insc)}
                          style={{ ...s.btnGhost, fontSize: 11, padding: "3px 8px", color: t.danger, borderColor: `${t.danger}44` }} title="Remover">🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {inscsVisiveis.length === 0 && !revezForm && (
        <div style={{ ...s.emptyState, marginBottom: 24 }}>
          <span style={{ fontSize: 48 }}>🏃‍♂️</span>
          <p style={{ fontWeight: 700, color: t.textPrimary, fontSize: 16 }}>Nenhuma equipe inscrita em revezamentos</p>
          <p style={{ color: t.textMuted, fontSize: 13 }}>Clique no botão abaixo para inscrever a primeira equipe.</p>
        </div>
      )}

      {/* ── BOTÃO NOVA INSCRIÇÃO ── */}
      {!revezForm && (
        <button style={{ ...s.btnPrimary, marginBottom: 20 }}
          onClick={() => setRevezForm({ provaId: provasRevez[0]?.id || "", catId: "", sexo: provasRevez[0]?.id?.startsWith("F_") ? "F" : "M", equipeId: equipesDisponiveis.length === 1 ? equipesDisponiveis[0].id : "", atletasIds: [] })}>
          ＋ Inscrever Equipe em Revezamento
        </button>
      )}

      {/* ── FORMULÁRIO ── */}
      {revezForm && (
        <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.accentBorder}`, borderRadius: 12, padding: 20 }}>
          <div style={{ color: t.accent, fontWeight: 700, fontSize: 17, marginBottom: 16, fontFamily: "'Barlow Condensed', sans-serif" }}>
            {revezForm.editId ? "✏️ Editar Inscrição" : "➕ Nova Inscrição de Revezamento"}
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 4 }}>Prova</div>
              <select style={{ ...s.input, minWidth: 200 }} value={revezForm.provaId}
                onChange={e => {
                  const newId = e.target.value;
                  const sexo = newId.startsWith("F_") ? "F" : "M";
                  setRevezForm(f => ({ ...f, provaId: newId, sexo, atletasIds: [] }));
                }}>
                <option value="">Selecione a prova...</option>
                {provasRevez.map(p => {
                  const sexo = p.id.startsWith("F_") ? "Fem" : "Masc";
                  const cat = CATEGORIAS.find(c => p.id.includes(c.id))?.nome || "";
                  return <option key={p.id} value={p.id}>{p.nome} — {cat} ({sexo})</option>;
                })}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 4 }}>Sexo</div>
              <select style={{ ...s.input, minWidth: 120 }} value={revezForm.sexo}
                onChange={e => setRevezForm(f => ({ ...f, sexo: e.target.value, atletasIds: [] }))}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 4 }}>Equipe</div>
              <select style={{ ...s.input, minWidth: 220 }} value={revezForm.equipeId}
                onChange={e => setRevezForm(f => ({ ...f, equipeId: e.target.value, atletasIds: [] }))}>
                <option value="">Selecione a equipe...</option>
                {equipesDisponiveis.map(eq => <option key={eq.id} value={eq.id}>{eq.nome}{eq.sigla ? ` (${eq.sigla})` : ""}</option>)}
              </select>
            </div>
          </div>

          {/* Seleção de atletas */}
          {revezForm.equipeId && revezForm.provaId && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: t.accent, fontWeight: 700, marginBottom: 10 }}>
                🏃 Selecione {nPernas} Atletas {isMisto ? "(Misto)" : revezForm.sexo === "M" ? "(Masculino)" : "(Feminino)"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Array.from({ length: nPernas }).map((_, idx) => {
                  const atletaSel = revezForm.atletasIds[idx] ? atletas.find(a => a.id === revezForm.atletasIds[idx]) : null;
                  const resB = buscarAtleta(revezBusca[idx]);
                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: t.accent, fontWeight: 700, minWidth: 28, fontSize: 14 }}>{idx + 1}.</span>
                      {atletaSel ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: t.bgHover, padding: "6px 12px", borderRadius: 6, border: `1px solid ${t.borderLight}` }}>
                          <span style={{ color: t.textPrimary, fontWeight: 600, fontSize: 13 }}>{atletaSel.nome}</span>
                          <span style={{ color: atletaSel.sexo === "M" ? "#1a6ef5" : "#e54f9b", fontSize: 10 }}>{atletaSel.sexo}</span>
                          {atletaSel.cbat && <span style={{ color: t.textDimmed, fontSize: 10 }}>CBAt: {atletaSel.cbat}</span>}
                          {numPeito[atletaSel.id] && <span style={{ color: t.textMuted, fontSize: 10 }}>Nº {numPeito[atletaSel.id]}</span>}
                          <button onClick={async () => {
                            setRevezForm(f => { const ids = [...f.atletasIds]; ids[idx] = ""; return { ...f, atletasIds: ids }; });
                            setRevezBusca(prev => { const n = [...prev]; n[idx] = ""; return n; });
                          }} style={{ background: "none", border: "none", color: t.danger, cursor: "pointer", fontSize: 14, marginLeft: "auto" }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ flex: 1, position: "relative" }}>
                          <input placeholder="Clique para ver atletas ou digite para buscar..."
                            value={revezBusca[idx] || ""}
                            onFocus={() => setFocusIdx(idx)}
                            onBlur={() => setTimeout(() => setFocusIdx(-1), 200)}
                            onChange={e => { setRevezBusca(prev => { const n = [...prev]; n[idx] = e.target.value; return n; }); setFocusIdx(idx); }}
                            style={{ ...s.input, width: "100%", fontSize: 13 }} />
                          {focusIdx === idx && resB.length > 0 && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: t.bgHover, border: `1px solid ${t.border}`, borderRadius: 6, maxHeight: 220, overflowY: "auto" }}>
                              {resB.map(a => {
                                const jaEscolhido = revezForm.atletasIds.includes(a.id);
                                return (
                                  <div key={a.id} onClick={async () => {
                                    if (jaEscolhido) return;
                                    setRevezForm(f => { const ids = [...f.atletasIds]; while (ids.length <= idx) ids.push(""); ids[idx] = a.id; return { ...f, atletasIds: ids }; });
                                    setRevezBusca(prev => { const n = [...prev]; n[idx] = ""; return n; });
                                    setFocusIdx(-1);
                                  }} style={{ padding: "8px 12px", cursor: jaEscolhido ? "not-allowed" : "pointer", borderBottom: `1px solid ${t.border}`, opacity: jaEscolhido ? 0.4 : 1 }}
                                    onMouseEnter={e => { if (!jaEscolhido) e.currentTarget.style.background = t.bgCardAlt; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                                    <span style={{ color: t.textPrimary, fontSize: 13 }}>{a.nome}</span>
                                    <span style={{ color: a.sexo === "M" ? "#1a6ef5" : "#e54f9b", fontSize: 10, marginLeft: 8 }}>{a.sexo}</span>
                                    {a._cruzado && <span style={{ color: t.accent, fontSize: 10, marginLeft: 6, background: t.accentBg, border: `1px solid ${t.accentBorder}`, borderRadius: 4, padding: "0 5px" }}>🤝 cruzado</span>}
                                    {a.cbat && <span style={{ color: t.textDimmed, fontSize: 10, marginLeft: 8 }}>CBAt: {a.cbat}</span>}
                                    {numPeito[a.id] && <span style={{ color: t.textMuted, fontSize: 10, marginLeft: 8 }}>Nº {numPeito[a.id]}</span>}
                                    {jaEscolhido && <span style={{ color: t.accent, fontSize: 10, marginLeft: 8 }}>(já selecionado)</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {atletasPool.length === 0 && (
                <div style={{ color: t.danger, fontSize: 12, marginTop: 8, padding: 10, background: t.bgCardAlt, borderRadius: 6, border: `1px solid ${t.danger}33` }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>⚠️ Nenhum atleta encontrado</p>
                  <p style={{ margin: "4px 0 0", color: t.textMuted, fontSize: 11 }}>
                    Verifique se há atletas desta equipe inscritos <strong>individualmente</strong> em alguma prova {isMisto ? "" : `(${revezForm.sexo === "M" ? "masculino" : "feminino"})`} nesta competição.
                  </p>
                  {(() => {
                    // Debug: mostrar quantos atletas individuais a equipe tem inscritos
                    const todosAtletasEquipe = [];
                    inscsEvt.filter(i => i.tipo !== "revezamento").forEach(i => {
                      const a = atletas.find(at => at.id === i.atletaId);
                      if (!a) return;
                      const eqId = a.equipeId || (a.clube ? "clube_" + a.clube : "");
                      if (eqId === revezForm.equipeId && !todosAtletasEquipe.find(x => x.id === a.id)) todosAtletasEquipe.push(a);
                    });
                    const doSexo = todosAtletasEquipe.filter(a => isMisto || a.sexo === revezForm.sexo);
                    return (
                      <p style={{ margin: "6px 0 0", color: t.textMuted, fontSize: 10 }}>
                        Diagnóstico: {todosAtletasEquipe.length} atleta(s) da equipe inscrito(s) no evento
                        {todosAtletasEquipe.length > 0 && !isMisto && ` · ${doSexo.length} do sexo ${revezForm.sexo === "M" ? "masc." : "fem."}`}
                      </p>
                    );
                  })()}
                </div>
              )}
              {atletasPool.length > 0 && (
                <p style={{ color: t.success, fontSize: 11, marginTop: 4 }}>
                  ✅ {atletasPool.length} atleta(s) disponível(eis) — clique no campo para ver a lista
                </p>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button style={s.btnPrimary} onClick={handleSalvar}>
              💾 {revezForm.editId ? "Atualizar Inscrição" : "Inscrever Equipe"}
            </button>
            <button style={s.btnGhost} onClick={async () => { setRevezForm(null); setRevezBusca(["","","","",""]); setFeedback(""); }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── INFO ── */}
      <div style={{ marginTop: 24, padding: 14, background: t.bgHeaderSolid, borderRadius: 8, border: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 12, color: t.textMuted }}>
          💡 <strong>Dica:</strong> Os atletas devem estar inscritos individualmente em alguma prova para aparecerem na busca.
          A composição da equipe pode ser alterada até o início da prova.
        </div>
      </div>
    </div>
  );
}



export default TelaInscricaoRevezamento;
