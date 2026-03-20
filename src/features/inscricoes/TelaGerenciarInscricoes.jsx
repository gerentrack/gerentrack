import { usePagination, PaginaControles } from "../../lib/hooks/usePagination.jsx";
import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { CATEGORIAS } from "../../shared/constants/categorias";
import { Th, Td } from "../ui/TableHelpers";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";

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
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: "#fff", fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
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
  modoSwitch: { display: "flex", gap: 0, background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: "#666", padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: "#141720", color: "#1976D2" },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: "#0E1016", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
  grupoProvasBox: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 10, marginBottom: 16, overflow: "hidden" },
  grupoProvasHeader: { background: "#0D0E12", borderBottom: "1px solid #1E2130", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  provaCheckBtn: { background: "#0E1016", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", lineHeight: 1.4, userSelect: "none" },
  provaCheckBtnSel: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
};

function TelaGerenciarInscricoes({ usuarioLogado, setTela, atletas, inscricoes,
  eventos, eventoAtual, equipes, excluirInscricao, atualizarInscricao, organizadores = [] }) {
  const s = useStylesResponsivos(styles);
  const confirmar = useConfirm();

  const isAdmin   = usuarioLogado?.tipo === "admin";
  const isOrg     = usuarioLogado?.tipo === "organizador";
  const isFunc    = usuarioLogado?.tipo === "funcionario";
  const isTrein   = usuarioLogado?.tipo === "equipe" || usuarioLogado?.tipo === "treinador";
  const isAtleta  = usuarioLogado?.tipo === "atleta";
  // Amplo = admin|org|func(permissão): pode editar/excluir sempre
  const funcPerm  = usuarioLogado?.permissoes || [];
  const isAmplo   = isAdmin || isOrg || (isFunc && (funcPerm.includes("atletas") || funcPerm.includes("inscricoes")));

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
      <p style={{ color: "#ff6b6b", fontWeight: 700 }}>Permissão insuficiente</p>
      <p style={{ color: "#666", fontSize: 14 }}>Você não tem permissão para gerenciar inscrições.</p>
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
          <p style={{ color:"#aaa", margin:"4px 0 0", fontSize:13 }}>
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
                        <strong style={{color:"#fff"}}>{atleta?.nome || "—"}</strong>
                        {/* ── Etapa 5: badge participação cruzada ── */}
                        {first.participacaoCruzada && (() => {
                          const orgNome = (() => {
                            const atl = atletas.find(a => a.id === first.atletaId);
                            const org = atl?.organizadorId ? organizadores.find(o => o.id === atl.organizadorId) : null;
                            return org?.entidade || org?.nome || null;
                          })();
                          return (
                            <span title={orgNome ? `Participação cruzada — org. de origem: ${orgNome}` : "Participação cruzada — org. de origem preservada"}
                              style={{ marginLeft:6, fontSize:10, color:"#5599ff",
                                background:"#0a1a2a", border:"1px solid #1a3a5a",
                                padding:"1px 6px", borderRadius:8, cursor: "help" }}>
                              🤝 cruzado{orgNome ? ` · ${orgNome}` : ""}
                            </span>
                          );
                        })()}
                      </Td>
                      {!filtroEvento && <Td style={{fontSize:12,color:"#1976D2"}}>{ev?.nome || "—"}</Td>}
                      <Td>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                          {inscs.filter(i => !i.combinadaId).map(i => {
                            const prova = todasProvas.find(p => p.id === i.provaId);
                            return (
                              <span key={i.id} style={{
                                display:"inline-flex", alignItems:"center", gap:4,
                                padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:600,
                                background:"#111318", border:"1px solid #1a1d2a", color:"#ccc",
                              }}>
                                {prova?.nome || i.provaId}
                                {podeAlt && (
                                  <button onClick={async () => { 
                                    if (await confirmar(`Remover ${atleta?.nome || "atleta" } de ${prova?.nome || i.provaId}?`)) {
                                      excluirInscricao(i.id, { confirmado: true });
                                    }
                                  }}
                                    style={{ background:"none", border:"none", cursor:"pointer", color:"#ff6b6b", fontSize:10, padding:"0 2px", lineHeight:1 }}
                                    title={`Remover de ${prova?.nome}`}>✕</button>
                                )}
                              </span>
                            );
                          })}
                        </div>
                        <div style={{ fontSize:11, color:"#555", marginTop:4 }}>{inscs.filter(i => !i.combinadaId).length} prova(s)</div>
                      </Td>
                      <Td>
                        <span style={s.badgeGold}>{first.categoriaOficial || first.categoria || "—"}</span>
                        {first.permissividade && (
                          <sup style={{color:"#1976D2",fontSize:9,marginLeft:2}} title={first.permissividade}>*</sup>
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
                            <span style={{color: first.inscritoPorTipo === "atleta" ? "#7cfc7c" : first.inscritoPorTipo === "treinador" ? "#88aaff" : "#1976D2"}}>
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
                              inscs.forEach(i => excluirInscricao(i.id));
                            }
                          }}
                            style={{...s.btnGhost,fontSize:11,padding:"3px 8px",color:"#ff6b6b",borderColor:"#5a1a1a"}}>
                            🗑️ Todas
                          </button>
                        ) : (
                          <span style={{color:"#444",fontSize:11}}>Encerrada</span>
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

      <div style={{marginTop:8,color:"#555",fontSize:12}}>
        {inscricoesFiltradas.length} inscrição(ões) de {[...new Set(inscVisiveis.filter(i => i.tipo !== "revezamento").map(i => i.atletaId))].length} atleta(s)
        {!isAmplo && " · Editar/excluir disponível apenas enquanto inscrições estiverem abertas"}
      </div>
    </div>
  );
}



export default TelaGerenciarInscricoes;
