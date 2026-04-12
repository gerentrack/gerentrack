import React, { useState, useEffect, useRef, useMemo } from "react";
import { todasAsProvas, nPernasRevezamento, isRevezamentoMisto } from "../../shared/athletics/provasDef";
import { CATEGORIAS, getCategoria, getPermissividade, podeCategoriaSuperior } from "../../shared/constants/categorias";
import { _getClubeAtleta, _getLocalEventoDisplay, validarCPF } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import { ProvaSelector } from "../ui/ProvaSelector";
import { CombinedEventEngine } from "../../shared/engines/combinedEventEngine";
import { getLimiteCat, validarLimiteProvas, validarNorma12Sub14, getRestricoesNorma12, calcularPrecoInscricao, formatarPreco } from "../../shared/engines/inscricaoEngine";
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
  // Flag manual sobrepõe tudo (exceto se force-aberta)
  if (ev.inscricoesEncerradas && !ev.inscricoesForceAbertas) return true;
  // Checa data+hora de encerramento em tempo real
  if (ev.dataEncerramentoInscricoes) {
    try {
      const dtEnc = new Date(ev.dataEncerramentoInscricoes + "T" + (ev.horaEncerramentoInscricoes || "23:59") + ":00");
      if (new Date() > dtEnc) return true;
    } catch { /* ignora datas inválidas */ }
  }
  // Checa data+hora de abertura em tempo real
  if (ev.dataAberturaInscricoes) {
    try {
      const dtAb = new Date(ev.dataAberturaInscricoes + "T" + (ev.horaAberturaInscricoes || "00:00") + ":00");
      if (new Date() < dtAb) return true;
    } catch { /* ignora datas inválidas */ }
  }
  return false;
}

function getStyles(t) {
  return {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: t.textPrimary, marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: t.textPrimary, marginBottom: 20, letterSpacing: 1 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  btnPrimary: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: t.accent, border: `2px solid ${t.accent}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost: { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: `1px solid ${t.border}` },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: t.bgHeaderSolid, padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` },
  td: { padding: "12px 16px", fontSize: 14, color: t.textSecondary, borderBottom: `1px solid ${t.border}` },
  tr: { transition: "background 0.15s" },
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
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.accent, marginBottom: 16 },
  formCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32, marginBottom: 20 },
  formTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: t.textPrimary, textAlign: "center", marginBottom: 8 },
  formSub: { color: t.textDimmed, textAlign: "center", fontSize: 14, marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },
  fieldError: { color: t.danger, fontSize: 12, marginTop: 2 },
  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: t.textMuted, transition: "all 0.2s" },
  radioLabelActive: { background: t.bgHover, border: `1px solid ${t.accent}`, color: t.accent },
  sumuCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  btnIconSm: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textMuted, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: t.bgCardAlt, border: `1px solid ${t.danger}33`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  infoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: t.accent, marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: `1px solid ${t.border}`, fontSize: 14, color: t.textSecondary, display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: t.accent, fontWeight: 700 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: "linear-gradient(180deg, #0D1018 0%, transparent 100%)", borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: t.accent, color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, color: t.textPrimary, lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: 20, marginBottom: 48 },
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
  permissividadeBox: { background: t.bgHeaderSolid, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 4 },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? t.bgHover : "transparent", color: ativo ? t.accent : t.textDisabled, border: `1px solid ${ativo ? t.accentBorder : t.border}` }),
  stepDivider: { flex: 1, height: 1, background: t.border, margin: "0 8px" },
  tagProva: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: t.textPrimary, fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  statusControlsCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  modoSwitch: { display: "flex", gap: 0, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: t.textDimmed, padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: t.bgInput, color: t.accent },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: t.bgHover, borderColor: t.accent, color: t.accent },
  savedBadge: { background: t.bgCardAlt, border: `1px solid ${t.success}66`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  inputMarca: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", color: t.accent, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
};
}

function TelaInscricaoAvulsa() {
    const t = useTema();
    const s = useStylesResponsivos(getStyles(t));
    const { usuarioLogado, login, loginComSelecao } = useAuth();
    const { adicionarInscricao, adicionarAtleta, atletas, equipes, inscricoes, eventoAtual, eventoAtualId, eventos, selecionarEvento } = useEvento();
    const { setTela, adicionarAtletaUsuario, atualizarAtletaUsuario, atletasUsuarios, organizadores } = useApp();
    const [modo, setModo] = useState("existente");
  const [atletaId, setAtletaId] = useState("");
  const [buscaAtleta, setBuscaAtleta] = useState("");
  const [buscaAtletaDebounced, setBuscaAtletaDebounced] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [provasSel, setProvasSel] = useState([]);
  const _autoEqId = usuarioLogado?.tipo === "equipe" ? usuarioLogado.id : (usuarioLogado?.tipo === "treinador" ? usuarioLogado.equipeId || "" : "");
  const [novoAtleta, setNovoAtleta] = useState({ nome: "", dataNasc: "", anoNasc: "", sexo: "M", cbat: "", clube: "", equipeId: _autoEqId, cpf: "", email: "" });
  const [cpfNovoStatus, setCpfNovoStatus] = useState(null); // null | "invalido" | "existente" | "ok"
  const [atletaCpfExistente, setAtletaCpfExistente] = useState(null);
  const [ok, setOk] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const buscaRef = useRef(null);
  const [eventoSelecionadoAtleta, setEventoSelecionadoAtleta] = useState(null);

  const isAtleta = usuarioLogado?.tipo === "atleta";
  const [modalNovoOrg, setModalNovoOrg] = useState(null); // { eventoId, orgId, orgNome } aguardando confirmação

  // ── Debounce da busca de atleta (300ms) ──
  useEffect(() => {
    const timer = setTimeout(() => setBuscaAtletaDebounced(buscaAtleta), 300);
    return () => clearTimeout(timer);
  }, [buscaAtleta]);

  // ── Verificar CPF do novo atleta ──
  const verificarCpfNovo = (cpf) => {
    const limpo = cpf.replace(/\D/g, "");
    if (limpo.length < 11) { setCpfNovoStatus(null); setAtletaCpfExistente(null); return; }
    if (!validarCPF(limpo)) { setCpfNovoStatus("invalido"); setAtletaCpfExistente(null); return; }
    // Buscar em atletas existentes
    const existente = atletas.find(a => a.cpf && a.cpf.replace(/\D/g, "") === limpo);
    if (existente) {
      setCpfNovoStatus("existente");
      setAtletaCpfExistente(existente);
    } else {
      setCpfNovoStatus("ok");
      setAtletaCpfExistente(null);
    }
  };
  // Para atletas, usar evento escolhido no fluxo (não o eventoAtual global)
  const eventoParaInscricao = isAtleta ? (eventos || []).find(ev => ev.id === eventoSelecionadoAtleta) : eventoAtual;

  // Auto-selecionar o próprio atleta quando logado como atleta
  const meuAtletaInsc = isAtleta ? atletas.find(a => {
    if (a.atletaUsuarioId && a.atletaUsuarioId === usuarioLogado.id) return true;
    if (a.cpf && usuarioLogado.cpf) return a.cpf.replace(/\D/g,"") === usuarioLogado.cpf.replace(/\D/g,"");
    return false;
  }) : null;

  useEffect(() => {
    if (isAtleta && meuAtletaInsc && !atletaId) {
      setAtletaId(meuAtletaInsc.id);
    }
  }, [isAtleta, meuAtletaInsc]);

  // Competições com inscrições abertas
  // Eventos do próprio org do atleta + competições cruzadas autorizadas
  const atletaOrgId = isAtleta
    ? (usuarioLogado?.organizadorId || atletas.find(a => {
        if (a.atletaUsuarioId === usuarioLogado?.id) return true;
        if (a.cpf && usuarioLogado?.cpf) return a.cpf.replace(/\D/g,"") === usuarioLogado.cpf.replace(/\D/g,"");
        return false;
      })?.organizadorId || null)
    : null;

  const eventosAbertos = (eventos || []).filter(ev => {
    if (isInscricaoEncerradaAgora(ev)) return false;
    if (!isAtleta) return true;
    // Atleta: só vê evento do próprio org OU onde org foi autorizado
    if (!atletaOrgId) return ev.organizadorId === null || !ev.organizadorId; // sem org: só vê eventos sem org
    if (ev.organizadorId === atletaOrgId) return true;
    return Array.isArray(ev.orgsAutorizadas) && ev.orgsAutorizadas.includes(atletaOrgId);
  });

  // Pré-selecionar evento cruzado vindo do TelaPainelOrganizador via eventoAtualId
  useEffect(() => {
    if (eventoAtualId && isAtleta && !eventoSelecionadoAtleta) {
      setEventoSelecionadoAtleta(eventoAtualId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAtleta, eventoAtualId]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (buscaRef.current && !buscaRef.current.contains(e.target)) {
        setMostrarLista(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── useMemo: devem ficar ANTES de qualquer return condicional (regra de hooks) ──
  const orgsAutorizadas = eventoParaInscricao?.orgsAutorizadas || [];
  const atletasCruzados = useMemo(() => orgsAutorizadas.length > 0
    ? atletas.filter(a => a.organizadorId && orgsAutorizadas.includes(a.organizadorId))
    : [], [atletas, orgsAutorizadas.join(",")]);
  const atletasCruzadosIds = new Set(atletasCruzados.map(a => a.id));

  const atletasFiltrados = useMemo(() => {
    const tipo = usuarioLogado?.tipo;
    if (tipo === "equipe") return atletas.filter(a => a.equipeId === usuarioLogado.id);
    if (tipo === "treinador") return atletas.filter(a => a.equipeId === usuarioLogado.equipeId);
    if (tipo === "atleta") {
      return atletas.filter(a => {
        if (a.atletaUsuarioId && a.atletaUsuarioId === usuarioLogado.id) return true;
        if (a.cpf && usuarioLogado.cpf)
          return a.cpf.replace(/\D/g,"") === usuarioLogado.cpf.replace(/\D/g,"");
        return false;
      });
    }
    const meuOrgId = usuarioLogado?.organizadorId || (tipo === "organizador" ? usuarioLogado?.id : null);
    const base = meuOrgId
      ? atletas.filter(a => a.organizadorId === meuOrgId)
      : atletas.filter(a => !!a.organizadorId);
    const baseIds = new Set(base.map(a => a.id));
    const extras = atletasCruzados.filter(a => !baseIds.has(a.id));
    return [...base, ...extras];
  }, [atletas, usuarioLogado, atletasCruzados]);

  const atletasBusca = useMemo(() => {
    const termo = buscaAtletaDebounced.trim().toLowerCase();
    if (!termo) return atletasFiltrados;
    return atletasFiltrados.filter(a => (a.nome || "").toLowerCase().includes(termo));
  }, [buscaAtletaDebounced, atletasFiltrados]);

  if (!eventoParaInscricao && !isAtleta) return (
    <div style={s.page}>
      <div style={s.emptyState}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20"/><path d="M4 20V8l8-4 8 4v12"/><path d="M9 20v-6h6v6"/><path d="M3 8h18"/></svg>
        <p>Selecione uma competição antes de inscrever atletas.</p>
        <button style={s.btnPrimary} onClick={() => setTela("home")}>Ver Competições</button>
      </div>
    </div>
  );

  // Atleta: sempre mostrar lista de competições primeiro (antes de escolher evento)
  if (isAtleta && !eventoSelecionadoAtleta) {
    if (eventosAbertos.length === 0) return (
      <div style={s.page}>
        <div style={s.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3H10l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>
          <p style={{ fontWeight: 700, color: t.textPrimary, fontSize: 18 }}>Nenhuma competição com inscrições abertas</p>
          <p style={{ color: t.textDimmed, fontSize: 14 }}>Aguarde a abertura de inscrições de uma competição.</p>
          <button style={s.btnGhost} onClick={() => setTela("painel-atleta")}>← Meu Painel</button>
        </div>
      </div>
    );
    return (
      <div style={s.page}>
        <div style={s.painelHeader}>
          <h1 style={s.pageTitle}>Me Inscrever</h1>
          <button style={s.btnGhost} onClick={() => setTela("painel-atleta")}>← Meu Painel</button>
        </div>
        <p style={{ color: t.textTertiary, marginBottom: 16 }}>Selecione a competição em que deseja se inscrever:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 700 }}>
          {eventosAbertos.map(ev => {
            const dataEv = ev.data ? new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" }) : "";
            const nProvas = ev.provas ? ev.provas.length : 0;
            return (
              <div key={ev.id}
                onClick={() => {
                  const eCruzado = atletaOrgId && ev.organizadorId && ev.organizadorId !== atletaOrgId &&
                    Array.isArray(ev.orgsAutorizadas) && ev.orgsAutorizadas.includes(atletaOrgId);
                  if (eCruzado) {
                    // Participação cruzada autorizada → vai direto
                    setEventoSelecionadoAtleta(ev.id); setProvasSel([]);
                  } else if (isAtleta && usuarioLogado?.organizadorId && ev.organizadorId && ev.organizadorId !== usuarioLogado.organizadorId) {
                    const org = organizadores.find(o => o.id === ev.organizadorId);
                    setModalNovoOrg({ eventoId: ev.id, orgId: ev.organizadorId, orgNome: org?.entidade || org?.nome || "outro organizador" });
                  } else {
                    if (isAtleta && !usuarioLogado?.organizadorId && ev.organizadorId) {
                      atualizarAtletaUsuario && atualizarAtletaUsuario({ ...usuarioLogado, organizadorId: ev.organizadorId });
                    }
                    setEventoSelecionadoAtleta(ev.id); setProvasSel([]);
                  }
                }}
                style={{
                  background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10,
                  padding: "16px 20px", cursor: "pointer", transition: "border-color 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}
              >
                <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 16, marginBottom: 4 }}>{ev.nome}</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: t.textMuted }}>
                  {dataEv && <span>{dataEv}</span>}
                  {(ev.local || ev.cidade) && <span>{_getLocalEventoDisplay(ev)}</span>}
                  {nProvas > 0 && <span>{nProvas} provas no programa</span>}
                </div>
                {atletaOrgId && ev.organizadorId && ev.organizadorId !== atletaOrgId && (() => {
                  const orgEv = (organizadores||[]).find(o => o.id === ev.organizadorId);
                  return (
                    <div style={{ marginTop:6, fontSize:11, color: t.accent }}>
                      Participação cruzada · {orgEv?.entidade || orgEv?.nome || "outro organizador"}
                    </div>
                  );
                })()}
                <div style={{ marginTop: 8 }}>
                  <span style={{ background: t.bgCardAlt, color: t.success, border: `1px solid ${t.success}44`, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                    Inscrições Abertas
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Modal: criar perfil em novo organizador ──────────────────────────────
  if (modalNovoOrg) {
    const handleCriarNovoPerfilOrg = () => {
      // Cria novo registro atletaUsuario vinculado ao novo organizador
      const novoId = Date.now().toString();
      const novoPerfil = {
        ...usuarioLogado,
        id: novoId,
        organizadorId: modalNovoOrg.orgId,
        dataCadastro: new Date().toISOString(),
        criadoPorMultiOrg: true,
      };
      adicionarAtletaUsuario && adicionarAtletaUsuario(novoPerfil);
      // Faz login com o novo perfil e prossegue para a inscrição
      loginComSelecao && loginComSelecao({ ...novoPerfil, _organizadorNome: modalNovoOrg.orgNome }, []);
      setModalNovoOrg(null);
      setEventoSelecionadoAtleta(modalNovoOrg.eventoId);
      setProvasSel([]);
    };
    return (
      <div style={{ ...s.formPage }}>
        <div style={{ ...s.formCard, maxWidth: 480 }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20"/><path d="M4 20V8l8-4 8 4v12"/><path d="M9 20v-6h6v6"/><path d="M3 8h18"/></svg></div>
          <h2 style={{ ...s.formTitle, textAlign: "center" }}>Competição de outro organizador</h2>
          <p style={{ color: t.textTertiary, fontSize: 14, textAlign: "center", lineHeight: 1.6, margin: "12px 0 20px" }}>
            Esta competição pertence a <strong style={{ color: t.textPrimary }}>{modalNovoOrg.orgNome}</strong>.<br/>
            Para se inscrever, será criado um perfil seu neste organizador.<br/>
            Você poderá alternar entre perfis na hora do login.
          </p>
          <button style={{ ...s.btnPrimary, width: "100%", marginBottom: 12 }} onClick={handleCriarNovoPerfilOrg}>
            Criar perfil e continuar
          </button>
          <button style={{ ...s.btnGhost, width: "100%" }} onClick={() => setModalNovoOrg(null)}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // Guard: se evento selecionado não existe mais
  if (!eventoParaInscricao) return null;

  if (!usuarioLogado) return (
    <div style={s.page}>
      <div style={s.emptyState}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1"/></svg>
        <p style={{ fontWeight: 700, color: t.textPrimary, fontSize: 18 }}>Login Necessário</p>
        <p style={{ color: t.textDimmed, fontSize: 14 }}>Faça login para inscrever atletas nesta competição.</p>
        <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar</button>
      </div>
    </div>
  );

  const tipoInsc   = usuarioLogado?.tipo;
  const isPrivileg = tipoInsc === "admin" || tipoInsc === "organizador" || tipoInsc === "funcionario";
  if (!isPrivileg && isInscricaoEncerradaAgora(eventoParaInscricao)) return (
    <div style={s.page}>
      <div style={s.emptyState}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        <p style={{ fontWeight: 700, color: t.textPrimary, fontSize: 18 }}>Inscrições Encerradas</p>
        <p style={{ color: t.textDimmed, fontSize: 14 }}>
          As inscrições para <strong>{eventoParaInscricao.nome}</strong> estão encerradas.
        </p>
        <button style={s.btnGhost} onClick={() => isAtleta ? setEventoSelecionadoAtleta(null) : setTela("evento-detalhe")}>← Voltar</button>
      </div>
    </div>
  );

  if (!isPrivileg && usuarioLogado?.lgpdConsentimentoRevogado) return (
    <div style={s.page}>
      <div style={s.emptyState}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 018-3"/></svg>
        <p style={{ fontWeight: 700, color: t.danger, fontSize: 18 }}>Consentimento Revogado</p>
        <p style={{ color: t.textMuted, fontSize: 14, maxWidth: 420, textAlign: "center", lineHeight: 1.6 }}>
          Você revogou seu consentimento LGPD. Novas inscrições não são permitidas.<br/>
          Para voltar a se inscrever em competições, realize um novo cadastro.
        </p>
        <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar ao Início</button>
      </div>
    </div>
  );

  // (useMemo movidos para antes dos early returns — ver acima)

  const atletaSel = atletas.find((a) => a.id === atletaId);
  const anoComp = new Date(eventoParaInscricao.data).getFullYear();
  const categoria = atletaSel ? getCategoria(atletaSel.anoNasc, anoComp) : null;
  // Provas disponíveis nesta competição
  const provasDoEvento = new Set(eventoParaInscricao.provasPrograma || []);

  const toggleProva = (id) => setProvasSel((p) => {
    if (p.includes(id)) return p.filter((x) => x !== id); // deselect always allowed
    // Check limit before adding
    if (limInd > 0 && !excecoesLimite.has(id)) {
      const contamAtual = p.filter(pId => !excecoesLimite.has(pId)).length;
      if (inscAtletaAtual + contamAtual + 1 > limInd) return p; // blocked
    }
    return [...p, id];
  });
  const jaInscrito = (provaId) => atletaId
    ? inscricoes.some((i) => i.atletaId === atletaId && i.provaId === provaId && i.eventoId === eventoParaInscricao?.id)
    : false;

  // ── Contagem para limite de provas (Etapa 2: por categoria) ──
  const excecoesLimite = new Set(eventoParaInscricao?.provasExcetoLimite || []);
  const limInd = getLimiteCat(eventoParaInscricao, categoria?.id || null);
  const inscAtletaAtual = atletaId
    ? inscricoes.filter(i => i.eventoId === eventoParaInscricao?.id && i.atletaId === atletaId && !excecoesLimite.has(i.provaId)).length
    : 0;
  const novasContam = provasSel.filter(pId => !excecoesLimite.has(pId)).length;
  const restantes = limInd > 0 ? limInd - inscAtletaAtual - novasContam : Infinity;

  const handleSubmit = async () => {
    if (enviando) return;
    if (!isAtleta && modo === "existente" && !atletaId) { setErro("Selecione um atleta"); return; }
    if (isAtleta && !atletaId) { setErro("Dados do atleta não encontrados"); return; }
    if (!isAtleta && modo === "novo") {
      if (!novoAtleta.nome)    { setErro("Preencha o nome completo do atleta"); return; }
      if (!novoAtleta.dataNasc){ setErro("Preencha a data de nascimento"); return; }
      // CPF: se preenchido, validar e verificar duplicata
      if (novoAtleta.cpf) {
        const cpfLimpo = novoAtleta.cpf.replace(/\D/g, "");
        if (cpfLimpo.length > 0 && !validarCPF(cpfLimpo)) { setErro("CPF inválido — corrija ou deixe em branco"); return; }
        const duplicata = atletas.find(a => a.cpf && a.cpf.replace(/\D/g, "") === cpfLimpo);
        if (duplicata) {
          setErro(`CPF já cadastrado para ${duplicata.nome}. Use a aba "Atleta Cadastrado" para selecioná-lo.`);
          return;
        }
      }
      // Email: se preenchido, validar formato
      if (novoAtleta.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoAtleta.email)) {
        setErro("E-mail inválido"); return;
      }
      // CBAt: se preenchido, verificar duplicata
      if (novoAtleta.cbat && novoAtleta.cbat.trim()) {
        const cbatLimpo = novoAtleta.cbat.trim();
        const cbatDup = atletas.find(a => a.cbat && a.cbat.trim() === cbatLimpo);
        if (cbatDup) { setErro(`Nº CBAt "${cbatLimpo}" já cadastrado para ${cbatDup.nome}. Use a aba "Atleta Cadastrado" para selecioná-lo.`); return; }
      }
    }
    if (provasSel.length === 0) { setErro("Selecione ao menos uma prova"); return; }

    // ── Validar categoria e limite de provas ──
    const atletaParaValidar = modo === "novo" ? novoAtleta : atletaSel;
    const catParaValidar = atletaParaValidar ? getCategoria(atletaParaValidar.anoNasc, anoComp) : null;
    if (atletaParaValidar && !catParaValidar) {
      const idadeAtleta = anoComp - parseInt(atletaParaValidar.anoNasc);
      setErro(`Atleta com ${idadeAtleta} ano(s) não pode ser inscrito — idade mínima é 11 anos (Sub-14).`);
      return;
    }
    const aIdCheck = modo === "novo" ? null : atletaId;
    const validacaoLimite = validarLimiteProvas(
      eventoParaInscricao, inscricoes, aIdCheck, catParaValidar?.id || null, provasSel
    );
    if (!validacaoLimite.ok) {
      setErro(validacaoLimite.msg);
      return;
    }

    // ── Validar Norma 12 CBAt — Sub-14 ──
    const provasRefValidacao = todasAsProvas();
    const validacaoNorma12 = validarNorma12Sub14(
      eventoParaInscricao, inscricoes, aIdCheck, catParaValidar?.id || null, provasSel, provasRefValidacao
    );
    if (!validacaoNorma12.ok) {
      setErro(validacaoNorma12.msg);
      return;
    }

    let aId = atletaId;
    if (!isAtleta && modo === "novo") {
      aId = Date.now().toString();
      adicionarAtleta({ ...novoAtleta, id: aId, cbat: novoAtleta.cbat||"",
        dataCadastro: new Date().toISOString(),
        cadastradoPor: usuarioLogado?.tipo || null,
      });
    }

    const atleta = (isAtleta || modo !== "novo") ? atletaSel : { ...novoAtleta, id: aId };
    const catOficial  = getCategoria(atleta.anoNasc, anoComp);
    const idadeAtleta = anoComp - parseInt(atleta.anoNasc);

    setEnviando(true);
    const baseTs = Date.now();
    // ── Etapa 2: snapshot do preço no momento da inscrição ──
    const precoInfoInscricao = calcularPrecoInscricao(atleta, catOficial?.id || null, eventoParaInscricao);
    provasSel.forEach((provaId, idx) => {
      // Verificar duplicata: atleta já inscrito nesta prova/evento
      if (inscricoes.some(i => i.eventoId === eventoParaInscricao.id && i.atletaId === aId && i.provaId === provaId)) {
        return; // pular — já inscrito
      }
      // Extrai categoria da prova pelo ID (M_sub14_100m → sub14)
      const catProvaId = provaId.split("_")[1] || "";

      // Valida se atleta pode se inscrever nesta categoria
      const mesmaCat = catProvaId === catOficial.id;
      const permissividade = eventoParaInscricao.permissividadeNorma
        ? getPermissividade(atleta.anoNasc, anoComp, catProvaId)
        : null;
      const superiorPermitida = podeCategoriaSuperior(eventoParaInscricao, idadeAtleta, catOficial.id, catProvaId);
      
      if (!mesmaCat && !permissividade && !superiorPermitida) {
        // Categoria não permitida - pular esta prova silenciosamente
        return;
      }
      // Categoria da inscrição = categoria da prova (não a oficial do atleta)
      const catProva = CATEGORIAS.find(c => c.id === catProvaId) || catOficial;
      const provaObj = todasAsProvas().find(pp => pp.id === provaId);
      adicionarInscricao({
        id: `${eventoParaInscricao.id}_${aId}_${provaId}_${baseTs + idx}`,
        eventoId: eventoParaInscricao.id,
        atletaId: aId,
        provaId,
        provaNome: provaObj?.nome || provaId,
        categoria: catProva.nome,
        categoriaId: catProva.id,
        categoriaOficial: catOficial.nome,
        categoriaOficialId: catOficial.id,
        permissividade: permissividade ? permissividade.obs : null,
        sexo: atleta.sexo,
        data: new Date().toISOString(),
        origemAtleta: usuarioLogado?.tipo === "atleta",
        // Quem inscreveu
        inscritoPorId: usuarioLogado?.id || null,
        inscritoPorNome: usuarioLogado?.nome || "Desconhecido",
        inscritoPorTipo: usuarioLogado?.tipo || null,
        // Snapshot de equipe no momento da inscrição
        equipeCadastro:    atleta.clube || _getClubeAtleta(atleta, equipes) || "",
        equipeCadastroId: atleta.equipeId || null,
        // ── Etapa 2: snapshot do preço no momento da inscrição ──
        precoInfo: precoInfoInscricao,
        // ── Etapa 5: rastreabilidade de participação cruzada ──
        ...(atletasCruzadosIds.has(aId) ? {
          participacaoCruzada: true,
          organizadorOrigem: atleta.organizadorId || null,
        } : {}),
      });

      // ── PROVAS COMBINADAS: auto-inscrição nas componentes ──
      const provaInfo = todasAsProvas().find(p => p.id === provaId);
      if (provaInfo && provaInfo.tipo === "combinada") {
        const provasComp = CombinedEventEngine.gerarProvasComponentes(provaId, eventoParaInscricao.id);
        const dadosBase = {
          categoria: catProva.nome,
          categoriaId: catProva.id,
          categoriaOficial: catOficial.nome,
          categoriaOficialId: catOficial.id,
          sexo: atleta.sexo,
          inscritoPorId: usuarioLogado?.id || null,
          inscritoPorNome: usuarioLogado?.nome || "Desconhecido",
          inscritoPorTipo: usuarioLogado?.tipo || null,
          equipeCadastro: atleta.clube || _getClubeAtleta(atleta, equipes) || "",
          equipeCadastroId: atleta.equipeId || null,
        };
        const inscricoesComp = CombinedEventEngine.inscreverAtletaNasComponentes(
          aId, provaId, eventoParaInscricao.id, dadosBase, provasComp
        );
        inscricoesComp.forEach(ic => adicionarInscricao(ic));
      }
    });
    setEnviando(false);
    setOk(true);
  };

  if (ok) return (
    <div style={s.formPage}>
      <div style={s.formCard}>
        <div style={{ textAlign: "center" }}><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <h2 style={{ ...s.formTitle, textAlign: "center" }}>Inscrição realizada!</h2>
        <p style={{ textAlign: "center", color: t.textTertiary }}>{provasSel.length} prova(s) em <strong style={{ color: t.accent }}>{eventoParaInscricao.nome}</strong>.</p>

        {/* ── Informações de pagamento — Etapa 2: preço calculado por categoria + equipe ── */}
        {isAtleta && (() => {
          const atletaConfirm   = atletaSel || (modo === "novo" ? novoAtleta : null);
          const catConfirm      = atletaConfirm ? getCategoria(atletaConfirm.anoNasc, anoComp) : null;
          const precoInfo       = calcularPrecoInscricao(atletaConfirm, catConfirm?.id || null, eventoParaInscricao);
          const forma           = eventoParaInscricao.formaPagamento;
          const orientacao      = eventoParaInscricao.orientacaoPagamento;
          const orgId           = eventoParaInscricao.organizadorId;
          const org             = (organizadores || []).find(o => o.id === orgId);
          const contato         = org?.email || org?.fone || null;
          const temInfoPagto    = precoInfo.preco != null || forma || orientacao;
          if (!temInfoPagto) return null;
          return (
            <div style={{ background: t.bgCardAlt, border:`1px solid ${t.accentBorder}`, borderRadius:10, padding:"16px 18px", margin:"16px 0", textAlign:"left" }}>
              <div style={{ fontWeight:700, color: t.accent, fontSize:14, marginBottom:10 }}>Informações de Pagamento</div>
              {precoInfo.preco != null && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"8px 0", borderBottom:`1px solid ${t.border}`, gap:12 }}>
                  <div>
                    <span style={{ color: t.textMuted, fontSize:13 }}>Valor por atleta</span>
                    <div style={{ fontSize:10, color: t.textDimmed, marginTop:2 }}>Taxa única por atleta na competição — independente do nº de provas</div>
                    {precoInfo.tipo !== "global" && (
                      <div style={{ fontSize:10, color: t.textDimmed, marginTop:1 }}>{precoInfo.label}</div>
                    )}
                  </div>
                  <strong style={{ color: t.success, fontSize:20, fontFamily:"'Barlow Condensed', sans-serif", whiteSpace:"nowrap" }}>
                    {formatarPreco(precoInfo.preco)}
                  </strong>
                </div>
              )}
              {forma && (
                <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${t.border}` }}>
                  <span style={{ color: t.textMuted, fontSize:13 }}>Forma de pagamento</span>
                  <span style={{ color: t.textPrimary, fontSize:13 }}>{forma}</span>
                </div>
              )}
              {(orientacao || contato) && (
                <div style={{ marginTop:10, padding:"8px 12px", background: t.bgCardAlt, borderRadius:8, fontSize:12, color: t.textTertiary, lineHeight:1.6, whiteSpace:"pre-wrap" }}>
                  {orientacao || `Entre em contato com o organizador para efetuar o pagamento.${contato ? `\n${contato}` : ""}`}
                </div>
              )}
            </div>
          );
        })()}

        <div style={{ ...s.resumoInscricao, margin:"12px 0 16px" }}>
          <strong style={{ color: t.textTertiary, fontSize:12 }}>Provas inscritas:</strong>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
            {provasSel.map(pid => {
              const p = todasAsProvas().find(x => x.id === pid);
              return <span key={pid} style={{ ...s.tagProva, cursor:"default" }}>✓ {p?.nome || pid}</span>;
            })}
          </div>
        </div>

        <div style={s.heroBtns}>
          <button style={s.btnPrimary} onClick={() => setTela(isAtleta ? "painel-atleta" : "sumulas")}>{isAtleta ? "← Meu Painel" : "Ver Súmulas"}</button>
          <button style={s.btnGhost} onClick={() => { setOk(false); setProvasSel([]); if (isAtleta) { setEventoSelecionadoAtleta(null); } else { setAtletaId(""); setBuscaAtleta(""); } setNovoAtleta({ nome:"", dataNasc:"", anoNasc:"", sexo:"M", cbat:"", clube:"", equipeId:"" }); }}>
            {isAtleta ? "Inscrever em outra competição" : "Nova Inscrição"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <h1 style={s.pageTitle}>{isAtleta ? "Me Inscrever" : "Inscrição em Provas"}</h1>
        <button style={s.btnGhost} onClick={() => isAtleta ? setEventoSelecionadoAtleta(null) : setTela("evento-detalhe")}>← {isAtleta ? "Escolher Competição" : eventoParaInscricao.nome}</button>
      </div>

      {/* Info da competição para atletas */}
      {isAtleta && (
        <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 15, marginBottom: 4 }}>{eventoParaInscricao.nome}</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: t.textMuted }}>
            {eventoParaInscricao.data && <span>{new Date(eventoParaInscricao.data + "T12:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" })}</span>}
            {eventoParaInscricao.local && <span>{eventoParaInscricao.local}</span>}
          </div>
        </div>
      )}

      {!isAtleta && (
        <>
      <div style={s.modoSwitch}>
        <button style={{ ...s.modoBtn, ...(modo === "existente" ? s.modoBtnActive : {}) }} onClick={() => setModo("existente")}>
          Atleta Cadastrado
        </button>
          <button style={{ ...s.modoBtn, ...(modo === "novo" ? s.modoBtnActive : {}) }} onClick={() => setModo("novo")}>
            Novo Atleta
          </button>
      </div>
        </>
      )}

      {erro && <div style={s.erro}>{erro}</div>}

      {/* Para atletas: mostrar seus dados diretamente */}
      {isAtleta && meuAtletaInsc && (
        <div style={{ ...s.atletaInfo, marginBottom: 12 }}>
          <span>{meuAtletaInsc.nome}</span>
          <span style={s.badgeGold}>{getCategoria(meuAtletaInsc.anoNasc, anoComp)?.nome}</span>
          <span style={s.badge(meuAtletaInsc.sexo === "M" ? "#1a6ef5" : "#e54f9b")}>{meuAtletaInsc.sexo === "M" ? "Masculino" : "Feminino"}</span>
          {_getClubeAtleta(meuAtletaInsc, equipes) && (
            <span style={{ fontSize: 12, color: t.textMuted }}>{_getClubeAtleta(meuAtletaInsc, equipes)}</span>
          )}
        </div>
      )}

      {!isAtleta && (modo === "existente" ? (
        <div style={s.formCard}>
          <label style={s.label}>Selecionar Atleta</label>
          <input
            type="text"
            style={{ ...s.input, marginBottom:12 }}
            placeholder={`Filtrar por nome... (${atletasFiltrados.length} disponíveis)`}
            value={buscaAtleta}
            onChange={(e) => { setBuscaAtleta(e.target.value); }}
          />
          <div style={{ maxHeight:300, overflowY:"auto", border:`1px solid ${t.border}`, borderRadius:8 }}>
            {atletasBusca.length === 0 ? (
              <div style={{ padding:"16px", color: t.textDimmed, fontSize:13, textAlign:"center" }}>
                {buscaAtleta.trim() ? `Nenhum atleta encontrado para "${buscaAtleta}"` : "Nenhum atleta disponível"}
              </div>
            ) : (
              atletasBusca.slice(0, 100).map(a => {
                const cat = getCategoria(a.anoNasc, anoComp);
                const selecionado = atletaId === a.id;
                return (
                  <div key={a.id}
                    onClick={() => { setAtletaId(selecionado ? "" : a.id); }}
                    style={{ padding:"9px 14px", cursor:"pointer", display:"flex",
                      alignItems:"center", gap:10, borderBottom:`1px solid ${t.border}`,
                      background: selecionado ? `${t.success}15` : "transparent",
                      borderLeft: selecionado ? "3px solid #7cfc7c" : "3px solid transparent" }}
                    onMouseEnter={(e) => { if (!selecionado) e.currentTarget.style.background = t.bgHover; }}
                    onMouseLeave={(e) => { if (!selecionado) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ color: selecionado ? t.success : t.textPrimary, fontWeight: selecionado ? 700 : 500, fontSize:13, flex:1 }}>
                      {selecionado && "✓ "}{a.nome}
                    </span>
                    <span style={{ fontSize:11, color: t.accent, background: t.bgCardAlt, padding:"2px 8px", borderRadius:8 }}>
                      {cat?.nome}
                    </span>
                    <span style={{ fontSize:11, color: a.sexo === "M" ? "#1a6ef5" : "#e54f9b" }}>
                      {a.sexo === "M" ? "Masc" : "Fem"}
                    </span>
                    {_getClubeAtleta(a, equipes) && (
                      <span style={{ fontSize:10, color: t.textDimmed }}>{_getClubeAtleta(a, equipes)}</span>
                    )}
                    {/* ── Etapa 5: badge de participação cruzada ── */}
                    {atletasCruzadosIds.has(a.id) && (
                      <span style={{ fontSize:10, color: t.accent, background: t.accentBg,
                        border:`1px solid ${t.accentBorder}`, padding:"1px 6px", borderRadius:8 }}>
                        cruzado
                      </span>
                    )}
                  </div>
                );
              })
            )}
            {atletasBusca.length > 100 && (
              <div style={{ padding:"8px 16px", color: t.accent, fontSize:11, textAlign:"center" }}>
                Mostrando 100 de {atletasBusca.length} — use a busca para refinar
              </div>
            )}
          </div>
          {atletaSel && (
            <div style={{ ...s.atletaInfo, marginTop:12 }}>
              <span>{atletaSel.nome}</span>
              <span style={s.badgeGold}>{categoria?.nome}</span>
              <span style={s.badge(atletaSel.sexo === "M" ? "#1a6ef5" : "#e54f9b")}>{atletaSel.sexo === "M" ? "Masculino" : "Feminino"}</span>
              <button onClick={() => { setAtletaId(""); setBuscaAtleta(""); }}
                style={{ ...s.btnGhost, fontSize:11, padding:"2px 8px", color: t.danger, borderColor:`${t.danger}44`, marginLeft:8 }}>✕ Limpar</button>
            </div>
          )}
        </div>
      ) : (
        <div style={s.formCard}>
          <h3 style={{ color: t.accent, margin:"0 0 16px" }}>Dados do Atleta</h3>
          <div style={s.grid2form}>

            {/* CPF — recomendado para identificação futura */}
            <div>
              <FormField label="CPF (recomendado)" value={novoAtleta.cpf}
                onChange={(v) => { setNovoAtleta({ ...novoAtleta, cpf: v }); verificarCpfNovo(v); }}
                placeholder="000.000.000-00" />
              {cpfNovoStatus === "invalido" && (
                <div style={{ color: t.danger, fontSize:11, marginTop:4 }}>CPF inválido</div>
              )}
              {cpfNovoStatus === "ok" && (
                <div style={{ color: t.success, fontSize:11, marginTop:4 }}>CPF válido</div>
              )}
              {cpfNovoStatus === "existente" && atletaCpfExistente && (
                <div style={{ background: t.bgCardAlt, border:`1px solid ${t.warning}`, borderRadius:8, padding:"10px 14px", marginTop:6 }}>
                  <div style={{ color: t.warning, fontSize:13, fontWeight:700, marginBottom:6 }}>
                    CPF já cadastrado no sistema
                  </div>
                  <div style={{ color: t.textSecondary, fontSize:12, lineHeight:1.6 }}>
                    <strong>{atletaCpfExistente.nome}</strong>
                    {atletaCpfExistente.sexo && <span> · {atletaCpfExistente.sexo === "M" ? "Masc" : "Fem"}</span>}
                    {atletaCpfExistente.dataNasc && <span> · {atletaCpfExistente.dataNasc}</span>}
                    {atletaCpfExistente.clube && <span> · {atletaCpfExistente.clube}</span>}
                  </div>
                  <button onClick={() => {
                    setAtletaId(atletaCpfExistente.id);
                    setBuscaAtleta(atletaCpfExistente.nome || "");
                    setModo("existente");
                    setCpfNovoStatus(null);
                    setAtletaCpfExistente(null);
                  }} style={{ ...s.btnPrimary, fontSize:12, padding:"6px 14px", marginTop:8 }}>
                    Usar atleta existente
                  </button>
                </div>
              )}
            </div>

            {/* Email — opcional */}
            <FormField label="Email (opcional)" value={novoAtleta.email}
              onChange={(v) => setNovoAtleta({ ...novoAtleta, email: v })}
              placeholder="atleta@email.com" type="email" />

            {/* Nome Completo */}
            <div style={{ gridColumn:"1/-1" }}>
              <FormField label="Nome Completo *" value={novoAtleta.nome}
                onChange={(v) => setNovoAtleta({ ...novoAtleta, nome: v })}
                placeholder="Nome completo do atleta" />
            </div>

            {/* Data de Nascimento */}
            <FormField label="Data de Nascimento *" value={novoAtleta.dataNasc}
              onChange={(v) => setNovoAtleta({ ...novoAtleta, dataNasc: v, anoNasc: v ? v.split("-")[0] : "" })}
              type="date" />

            {/* Registro CBAt */}
            <FormField label="Registro CBAt (opcional)" value={novoAtleta.cbat||""}
              onChange={(v) => setNovoAtleta({ ...novoAtleta, cbat: v })}
              placeholder="Nº de registro" />

            {/* Sexo */}
            <div>
              <label style={s.label}>Sexo</label>
              <div style={s.radioGroup}>
                {[["M","Masculino"],["F","Feminino"]].map(([v,l]) => (
                  <label key={v} style={{ ...s.radioLabel, ...(novoAtleta.sexo===v ? s.radioLabelActive : {}) }}>
                    <input type="radio" value={v} checked={novoAtleta.sexo===v}
                      onChange={() => setNovoAtleta({ ...novoAtleta, sexo: v })}
                      style={{ display:"none" }} />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            {/* Espaço */}
            <div />

            {/* Equipe / Clube */}
            <div style={{ gridColumn:"1/-1" }}>
              <label style={s.label}>
                Equipe / Clube <span style={{ color: t.textDimmed, fontSize:11 }}>(opcional)</span>
              </label>
              <select
                style={s.select}
                value={novoAtleta.equipeId}
                onChange={e => {
                  const eqId = e.target.value;
                  const eq = equipes.find(eq2 => eq2.id === eqId);
                  setNovoAtleta({ ...novoAtleta, equipeId: eqId, clube: eq ? (eq.clube || eq.nome || "") : "" });
                }}>
                <option value="">— Sem equipe —</option>
                {equipes.filter(eq => {
                  const evOrg = eventoParaInscricao?.organizadorId;
                  if (!evOrg) return true;
                  if (eq.organizadorId === evOrg) return true;
                  const cruzadas = eventoParaInscricao?.orgsAutorizadas || [];
                  return cruzadas.includes(eq.organizadorId);
                }).map(eq => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nome}{eq.clube ? ` — ${eq.clube}` : ""}
                  </option>
                ))}
              </select>
              {novoAtleta.equipeId && (
                <div style={{ fontSize:11, color: t.success, marginTop:4 }}>
                  Equipe: <strong>{equipes.find(eq => eq.id === novoAtleta.equipeId)?.nome || "—"}</strong>
                  {novoAtleta.clube && <span> · Clube: {novoAtleta.clube}</span>}
                </div>
              )}
            </div>

          </div>

          {/* Aviso se CPF e email vazios */}
          {!novoAtleta.cpf && !novoAtleta.email && novoAtleta.nome && (
            <div style={{ background: t.bgCardAlt, border:`1px solid ${t.warning}55`, borderRadius:8, padding:"10px 14px", marginTop:12, display:"flex", alignItems:"flex-start", gap:8 }}>
              <span style={{ fontSize:16, fontWeight:700 }}>!</span>
              <div style={{ fontSize:12, color: t.warning, lineHeight:1.6 }}>
                <strong>Sem CPF e email</strong> — este atleta não poderá criar conta própria nem ser identificado automaticamente em futuras competições. Recomendamos preencher ao menos o CPF.
              </div>
            </div>
          )}

          {/* Preview categoria */}
          {novoAtleta.dataNasc && (() => {
            const catPreviewVal = getCategoria(novoAtleta.anoNasc, anoComp);
            const idadePreview = anoComp - parseInt(novoAtleta.anoNasc);
            return catPreviewVal
              ? <div style={s.catPreview}>Categoria: <strong>{catPreviewVal.display}</strong></div>
              : <div style={{ ...s.catPreview, color: t.danger }}>Atleta com {idadePreview} ano(s) — idade mínima é 11 anos (Sub-14)</div>;
          })()}
        </div>
      ))}

      {(atletaSel || (!isAtleta && modo === "novo" && novoAtleta.anoNasc && !isNaN(novoAtleta.anoNasc))) && (() => {
          const atletaAtivo = (!isAtleta && modo === "novo") ? novoAtleta : atletaSel;
          const catOficial = getCategoria(atletaAtivo.anoNasc, anoComp);
          if (!catOficial) return (
            <div style={{ padding:"12px 16px", borderRadius:8, background:`${t.danger}15`, border:`1px solid ${t.danger}44`, color:t.danger, fontSize:13, marginTop:16 }}>
              Atleta com {anoComp - parseInt(atletaAtivo.anoNasc)} ano(s) — idade mínima para inscrição é 11 anos (Sub-14).
            </div>
          );
          // catExibida = catOficial (não mais influenciada por permissividade)
          const catExibida = catOficial;
          // permissividade para exibição: verifica se atleta é exceção em alguma prova do evento
          // (usa a primeira categoria superior disponível no programa, se houver)
          const catSuperiorNoEvento = eventoParaInscricao.permissividadeNorma
            ? (["sub16","sub18"].find(cid => {
                const pfx = `${atletaAtivo.sexo}_${cid}_`;
                return todasAsProvas().some(p => p.id.startsWith(pfx) && provasDoEvento.has(p.id));
              }) || null)
            : null;
          const permissividade = catSuperiorNoEvento
            ? getPermissividade(atletaAtivo.anoNasc, anoComp, catSuperiorNoEvento)
            : null;
          // Mostra provas do evento compatíveis com a categoria OFICIAL do atleta
          // Se permissividadeNorma, inclui também provas da categoria superior permitida
          const catPrefixo = `${atletaAtivo.sexo}_${catOficial.id}_`;
          // Categorias superiores que aceitam este atleta por exceção
          const idade = (eventoParaInscricao.data ? new Date(eventoParaInscricao.data).getFullYear() : new Date().getFullYear()) - parseInt(atletaAtivo.anoNasc);
          const catsSuperior = (() => {
            const extras = [];
            // Permissividade norma (Sub-14↔Sub-16, Sub-16→Sub-18)
            if (eventoParaInscricao.permissividadeNorma) {
              if (catOficial.id === "sub14" || idade === 11) extras.push(`${atletaAtivo.sexo}_sub14_`);
              if (catOficial.id === "sub14") extras.push(`${atletaAtivo.sexo}_sub16_`);
              if (catOficial.id === "sub16") extras.push(`${atletaAtivo.sexo}_sub18_`);
            }
            // 16+ em categorias superiores
            if (eventoParaInscricao.permiteSub16CategoriasSup && idade >= 16) {
              const hierarquia = ['sub14', 'sub16', 'sub18', 'sub20', 'sub23', 'adulto'];
              const idxOficial = hierarquia.indexOf(catOficial.id);
              if (idxOficial >= 0) {
                for (let idx = idxOficial + 1; idx < hierarquia.length; idx++) {
                  extras.push(`${atletaAtivo.sexo}_${hierarquia[idx]}_`);
                }
              }
            }
            return extras;
          })();
          const provasDisp = todasAsProvas().filter((p) =>
            (p.id.startsWith(catPrefixo) || catsSuperior.some(pfx => p.id.startsWith(pfx)))
            && provasDoEvento.has(p.id)
            && p.tipo !== "revezamento");
          const grupos = [...new Set(provasDisp.map((p) => p.grupo))];
          const todasProvasMap = {};
          todasAsProvas().forEach((p) => { todasProvasMap[p.id] = p; });
          return (
            <div>
              <h2 style={s.sectionTitle}>Selecionar Provas</h2>
              {limInd > 0 && (
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:8, marginBottom:12,
                  background: restantes <= 0 ? `${t.danger}15` : restantes <= 2 ? `${t.accent}15` : `${t.success}15`,
                  border: `1px solid ${restantes <= 0 ? `${t.danger}44` : restantes <= 2 ? `${t.accent}44` : `${t.success}44`}`,
                  fontSize:12, fontWeight:600,
                  color: restantes <= 0 ? t.danger : restantes <= 2 ? t.accent : t.success,
                }}>
                  Limite: {inscAtletaAtual + novasContam}/{limInd} prova(s)
                  {restantes > 0
                    ? ` · ${restantes} vaga(s) restante(s)`
                    : " · Limite atingido"}
                  {(eventoParaInscricao.provasExcetoLimite || []).length > 0 && (
                    <span style={{ color: t.textMuted, fontWeight:400 }}> · Exceções não contam</span>
                  )}
                </div>
              )}
              <div style={s.catBanner}>
                Provas no programa para: <strong>{catOficial.nome}</strong> · <strong>{atletaAtivo.sexo === "M" ? "Masculino" : "Feminino"}</strong>
                {provasDisp.length === 0 && <span style={{ color: t.danger, marginLeft: 12 }}>Nenhuma prova desta categoria/sexo no programa desta competição</span>}
              </div>
              {permissividade && (
                <div style={s.permissividadeAlert}>
                  <div style={s.permissividadeAlertIcon}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="M3 7l9-4 9 4"/><path d="M3 7v2a9 9 0 006 0V7"/><path d="M15 7v2a9 9 0 006 0V7"/></svg></div>
                  <div>
                    <div style={s.permissividadeAlertTitle}>Participação por Exceção de Norma CBAt</div>
                    <div style={s.permissividadeAlertBody}>{permissividade.obs}</div>
                    <div style={s.permissividadeAlertRodape}>
                      Categoria oficial do atleta: <strong>{catOficial.nome}</strong> · A súmula conterá esta observação.
                    </div>
                  </div>
                </div>
              )}
              {eventoParaInscricao.aplicarNorma12Sub14 && catOficial.id === "sub14" && (
                <div style={{
                  display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:8, marginBottom:12,
                  background: `${t.warning}12`, border: `1px solid ${t.warning}33`,
                  fontSize:12, color: t.warning, lineHeight:1.5,
                }}>
                  <span style={{ flexShrink:0 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="M3 7l9-4 9 4"/><path d="M3 7v2a9 9 0 006 0V7"/><path d="M15 7v2a9 9 0 006 0V7"/></svg></span>
                  <span><strong>Norma 12 CBAt</strong> — Máximo 2 provas individuais de grupos diferentes, ou somente a prova combinada (Tetratlo). Revezamento sempre permitido.</span>
                </div>
              )}
              {(() => {
                const norma12 = getRestricoesNorma12(eventoParaInscricao, inscricoes, atletaId, catOficial.id, provasSel, provasDisp);
                return grupos.map((grupo) => (
                  <ProvaSelector key={grupo} provas={provasDisp.filter((p) => p.grupo === grupo)}
                    titulo={grupo} selecionadas={provasSel} onToggle={toggleProva} jaInscrito={jaInscrito}
                    desabilitadas={norma12.desabilitadas} />
                ));
              })()}
              {provasSel.length > 0 && (
                <div style={s.resumoInscricao}>
                  <strong>Provas selecionadas: {provasSel.length}</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    {provasSel.map((id) => {
                      const p = todasProvasMap[id];
                      return <span key={id} style={s.tagProva}>{p?.nome} ×</span>;
                    })}
                  </div>
                </div>
              )}
              {provasDisp.length > 0 && (
                <button style={{ ...s.btnPrimary, marginTop: 24, opacity: enviando ? 0.5 : 1 }} onClick={handleSubmit} disabled={enviando}>
                  {enviando ? "Inscrevendo..." : "Confirmar Inscrição"}
                </button>
              )}
            </div>
          );
        })()
      }

      {/* ── LINK PARA INSCRIÇÃO DE REVEZAMENTO (tela própria) ── */}
      {(() => {
        const provasRevezEvento = todasAsProvas().filter(p =>
          p.tipo === "revezamento" && (eventoParaInscricao.provasPrograma || []).includes(p.id)
        );
        if (provasRevezEvento.length === 0) return null;
        if (!eventoParaInscricao.revezamentoInscAntecipada) return null; // antecipada desativada: não mostrar aqui
        const isEquipeTreinador = tipoInsc === "equipe" || tipoInsc === "treinador";
        const podeInscRevez = isPrivileg || (isEquipeTreinador && eventoParaInscricao.revezamentoInscAntecipada);
        if (!podeInscRevez) return null;
        const inscsRevezEvt = inscricoes.filter(i => i.eventoId === eventoParaInscricao.id && i.tipo === "revezamento");
        const equipeIdUser = tipoInsc === "equipe" ? usuarioLogado.id : tipoInsc === "treinador" ? usuarioLogado.equipeId : null;
        const nMinhas = equipeIdUser ? inscsRevezEvt.filter(i => i.equipeId === equipeIdUser).length : inscsRevezEvt.length;
        return (
          <div style={{ marginTop: 32, padding: 20, background: t.bgHeaderSolid, border: `1px solid ${t.accentBorder}`, borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.accent, margin: 0 }}>
                  Inscrição de Revezamento
                </h2>
                <p style={{ color: t.textMuted, fontSize: 13, marginTop: 4 }}>
                  {nMinhas > 0 ? `${nMinhas} equipe(s) inscrita(s)` : "Nenhuma equipe inscrita ainda"}
                  {" · "}{provasRevezEvento.length} prova(s) disponível(eis)
                </p>
              </div>
              <button style={s.btnPrimary} onClick={() => setTela("inscricao-revezamento")}>
                Gerenciar Revezamentos →
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}


export default TelaInscricaoAvulsa;
