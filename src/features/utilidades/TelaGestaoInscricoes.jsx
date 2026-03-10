import { usePagination, PaginaControles } from "../../lib/hooks/usePagination.jsx";
import React, { useState, useMemo } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { getCategoria, getPermissividade, podeCategoriaSuperior } from "../../shared/athletics/constants";
import { _getClubeAtleta } from "../../shared/formatters/utils";
import { CombinedEventEngine } from "../../shared/engines/combinedEventEngine";
import { calcularPrecoInscricao, formatarPreco, validarLimiteProvas, getLimiteCat } from "../../shared/engines/inscricaoEngine";
import { Th, Td } from "../ui/TableHelpers";

const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

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
  resumoInscricao: { background: "#0E1016", border: "1px solid #1976D233", borderRadius: 10, padding: "16px 20px", marginTop: 16 },
  tagProva: { background: "#1976D222", color: "#1976D2", border: "1px solid #1976D244", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  statusBarItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  statusDot: (cor) => ({ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }),
  statusDotInline: (cor) => ({ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: cor, background: cor + "22", border: `1px solid ${cor}44`, borderRadius: 10, padding: "2px 8px", whiteSpace: "nowrap" }),
  statusControlsCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusControlsTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: "#1976D2", letterSpacing: 1, marginBottom: 14 },
  statusControlsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  statusControlBox: (ativo, corAtiva, bgAtiva, disabled) => ({ background: ativo ? bgAtiva : "#141720", border: `1px solid ${ativo ? corAtiva + "66" : "#252837"}`, borderRadius: 10, padding: "14px 16px", opacity: disabled ? 0.5 : 1, transition: "all 0.2s" }),
  statusControlLabel: { display: "flex", alignItems: "flex-start", cursor: "pointer", gap: 0 },
  modoSwitch: { display: "flex", gap: 0, background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: "#666", padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: "#141720", color: "#1976D2" },
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: "#fff", fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  permissividadeTag: (ativo) => ({ display: "inline-block", background: ativo ? "#1a2a0a" : "#1a1a1a", border: `1px solid ${ativo ? "#4a8a2a" : "#333"}`, color: ativo ? "#7acc44" : "#555", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600 }),
  filtroProvasBar: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 20 },
  filtroProvasBloco: { display: "flex", flexDirection: "column", gap: 8 },
  filtroProvasLabel: { fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 },
  filtroProvasPills: { display: "flex", flexWrap: "wrap", gap: 6 },
  filtroPill: { background: "#141720", border: "1px solid #252837", color: "#666", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5, transition: "all 0.15s" },
  filtroPillAtivo: { background: "#1a1c22", border: "1px solid #1976D2", color: "#1976D2" },
  filtroClearBtn: { background: "none", border: "none", color: "#1976D288", cursor: "pointer", fontSize: 11, fontFamily: "'Barlow', sans-serif", padding: "0 4px", textDecoration: "underline" },
  savedBadge: { background: "#0a2a0a", border: "1px solid #2a6a2a", color: "#4aaa4a", padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarDica: { color: "#666", fontSize: 12 },
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
  infoCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: "#1976D2", marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: "1px solid #151820", fontSize: 14, color: "#bbb", display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: "#1976D2", fontWeight: 700 },
  sumuCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  digitarSection: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  inputMarca: { background: "#141720", border: "1px solid #252837", borderRadius: 6, padding: "8px 12px", color: "#1976D2", fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#1976D2", marginBottom: 16 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: "linear-gradient(180deg, #0D1018 0%, transparent 100%)", borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: "#1976D2", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: "#666" },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: "#888", flexWrap: "wrap", borderTop: "1px solid #141820", paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({ display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, background: status === "ao_vivo" ? "#3a0a0a" : status === "hoje_pre" ? "#2a2a0a" : status === "futuro" ? "#0a2a0a" : "#1a1a1a", color: status === "ao_vivo" ? "#ff6b6b" : status === "hoje_pre" ? "#1976D2" : status === "futuro" ? "#7acc44" : "#555", border: `1px solid ${status === "ao_vivo" ? "#6a2a2a" : status === "hoje_pre" ? "#4a4a0a" : status === "futuro" ? "#2a5a2a" : "#333"}` }),
  grupoProvasBox: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 10, marginBottom: 16, overflow: "hidden" },
  grupoProvasHeader: { background: "#0D0E12", borderBottom: "1px solid #1E2130", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  provaCheckBtn: { background: "#0E1016", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", lineHeight: 1.4, userSelect: "none" },
  provaCheckBtnSel: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
  provaChip: { background: "#141720", border: "1px solid #252837", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#bbb", lineHeight: 1.4 },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? "#1a1c22" : "transparent", color: ativo ? "#1976D2" : "#444", border: `1px solid ${ativo ? "#1976D244" : "#1E2130"}` }),
  stepDivider: { flex: 1, height: 1, background: "#1E2130", margin: "0 8px" },
  permissividadeBox: { background: "#0d1117", border: "1px solid #1976D233", borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 4 },
  permissividadeHeader: { marginBottom: 10 },
  permissividadeLabel: { display: "flex", alignItems: "center", cursor: "pointer", fontSize: 14, color: "#ddd", fontWeight: 600 },
  permissividadeInfo: { background: "#111620", borderRadius: 8, padding: "12px 16px", borderLeft: "3px solid #1976D2" },
  permissividadeAlert: { display: "flex", gap: 14, alignItems: "flex-start", background: "#12180a", border: "1px solid #4a8a2a", borderRadius: 10, padding: "14px 18px", marginBottom: 20 },
  permissividadeAlertIcon: { fontSize: 28, flexShrink: 0, marginTop: 2 },
  permissividadeAlertTitle: { fontWeight: 700, color: "#7acc44", fontSize: 15, marginBottom: 4 },
  permissividadeAlertBody: { color: "#aaa", fontSize: 13, lineHeight: 1.6, marginBottom: 6 },
  permissividadeAlertRodape: { fontSize: 12, color: "#666", fontStyle: "italic" },
  badgeOficial: { background: "#1a1a2a", color: "#8888cc", border: "1px solid #333366", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  badgeNorma: { background: "#1a2a0a", color: "#7acc44", border: "1px solid #3a6a1a", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, cursor: "help" },
  eventoBar: { background: "#0D0E12", borderTop: "1px solid #1a1c22", padding: "6px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  eventoBarLabel: { fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase" },
  eventoBarNome: { fontSize: 13, fontWeight: 700, color: "#1976D2", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  eventoBarMeta: { fontSize: 12, color: "#555", marginLeft: "auto" },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: "#0E1016", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
};

function TelaGestaoInscricoes({ setTela, eventoAtual, inscricoes, atletas, equipes, excluirInscricao, adicionarInscricao, atualizarInscricao, usuarioLogado, registrarAcao, numeracaoPeito }) {
  const confirmar = useConfirm();
  if (!eventoAtual) return <div style={styles.page}><div style={styles.emptyState}><p>Nenhuma competição selecionada.</p></div></div>;

  const eid = eventoAtual.id;

  // Se for equipe/treinador, filtra apenas atletas e inscrições da própria equipe
  const isEquipeUsuario = usuarioLogado?.tipo === "equipe" || usuarioLogado?.tipo === "treinador";
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
  const [feedback, setFeedback]       = useState("");

  // ── Carrinho ─────────────────────────────────────────────────────────────
  const [carrinho, setCarrinho]           = useState([]);
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

  const inscsRevez   = inscsEvt.filter(i => i.tipo === "revezamento");
  const provasRevez  = provasProg.filter(p => p.tipo === "revezamento");
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

  const totalGeral = resumoCarrinho.reduce((s, r) => s + r.valorCobrar, 0);
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
    setEtapa("concluido");
  };

  const resetCarrinho = () => {
    setCarrinho([]);
    setEtapa("montagem");
    setModoCarrinho(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Paginação inscrições agrupadas ─────────────────────────────────────────
  const _porAtletaMap = {};
  inscsFiltradas.forEach(insc => {
    if (!_porAtletaMap[insc.atletaId]) _porAtletaMap[insc.atletaId] = [];
    _porAtletaMap[insc.atletaId].push(insc);
  });
  const _porAtletaArr = Object.entries(_porAtletaMap);
  const { paginado: porAtletaPag, infoPage: inscsInfo } = usePagination(_porAtletaArr, 10);


  return (
    <div style={styles.page}>
      <div style={styles.painelHeader}>
        <div>
          <h1 style={styles.pageTitle}>🔄 Gestão de Inscrições</h1>
          <div style={{ color: "#666", fontSize: 13 }}>
            {eventoAtual.nome} — {[...new Set(inscsEvt.filter(i => i.tipo !== "revezamento" && !i.combinadaId).map(i => i.atletaId))].length} atleta(s), {inscsEvt.filter(i => i.tipo !== "revezamento" && !i.combinadaId).length} inscrições
          </div>
        </div>
        <button style={styles.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar</button>
      </div>

      {feedback && (
        <div style={{ background: "#0a1a0a", border: "1px solid #2a8a2a", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#4cff4c", fontSize: 13 }}>
          {feedback}
        </div>
      )}

      {/* Tabs */}
      <div style={styles.modoSwitch}>
        <button
          style={{ ...styles.modoBtn, ...(!modoCarrinho ? styles.modoBtnActive : {}) }}
          onClick={() => setModoCarrinho(false)}>
          📋 Inscrições Salvas
        </button>
        <button
          style={{ ...styles.modoBtn, ...(modoCarrinho ? styles.modoBtnActive : {}) }}
          onClick={async () => { setModoCarrinho(true); setEtapa("montagem"); }}>
          🛒 Novo Lote
          {carrinho.length > 0 && (
            <span style={{ background: "#1976D2", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, marginLeft: 6 }}>
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
            <select value={filtroProva} onChange={e => setFiltroProva(e.target.value)} style={{ ...styles.input, maxWidth: 220 }}>
              <option value="">Todas as provas</option>
              {provasUnicas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)} style={{ ...styles.input, maxWidth: 160 }}>
              <option value="">Categorias</option>
              {catsUnicas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filtroSexo} onChange={e => setFiltroSexo(e.target.value)} style={{ ...styles.input, maxWidth: 120 }}>
              <option value="">Ambos</option>
              <option value="M">Masc</option>
              <option value="F">Fem</option>
            </select>
            <input style={{ ...styles.input, maxWidth: 200 }} placeholder="🔍 Nome..." value={filtroNome} onChange={e => setFiltroNome(e.target.value)} />
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <Th>Atleta</Th><Th>Provas Inscritas</Th><Th>Categoria</Th><Th>Sexo</Th><Th>Equipe</Th><Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {inscsFiltradas.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...styles.td, textAlign: "center", color: "#666" }}>Nenhuma inscrição encontrada.</td></tr>
                ) : (
                  porAtletaPag.map(([atletaId, inscs], rowIdx) => {
                    const atl = atletas.find(a => a.id === atletaId);
                    const primeiraInsc = inscs[0];
                    const inscsVisiveis = inscs.filter(i => !i.combinadaId);
                    return (
                      <tr key={`saved_${atletaId}_${rowIdx}`} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: 600, color: "#fff", verticalAlign: "top" }}>{atl?.nome || "—"}</td>
                        <td style={{ ...styles.td, verticalAlign: "top" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {inscsVisiveis.map(insc => {
                              const prv = todasAsProvas().find(p => p.id === insc.provaId);
                              return (
                                <span key={insc.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#111318", border: "1px solid #1a1d2a", color: "#ccc" }}>
                                  {prv?.nome || insc.provaId}
                                  <button onClick={() => handleExcluir(insc)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ff6b6b", fontSize: 10, padding: "0 2px" }}
                                    title="Remover">✕</button>
                                </span>
                              );
                            })}
                          </div>
                          <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{inscsVisiveis.length} prova(s)</div>
                        </td>
                        <td style={{ ...styles.td, verticalAlign: "top" }}>
                          <span style={styles.badgeGold}>{primeiraInsc.categoria || "—"}</span>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center", verticalAlign: "top" }}>
                          <span style={styles.badge(primeiraInsc.sexo === "M" ? "#1a6ef5" : "#e54f9b")}>
                            {primeiraInsc.sexo === "M" ? "Masc" : "Fem"}
                          </span>
                        </td>
                        <td style={{ ...styles.td, verticalAlign: "top" }}>{primeiraInsc.equipeCadastro || atl?.clube || "—"}</td>
                        <td style={{ ...styles.td, whiteSpace: "nowrap", verticalAlign: "top" }}>
                          <button onClick={async () => { 
                            if (await confirmar(`Remover TODAS as ${inscsVisiveis.length } inscrições de ${atl?.nome || "atleta"}?`)) {
                              inscs.forEach(i => excluirInscricao(i.id, { confirmado: true }));
                              setFeedback(`✅ Todas as inscrições de ${atl?.nome} removidas`);
                              setTimeout(() => setFeedback(""), 3000);
                            }
                          }} style={{ ...styles.btnGhost, fontSize: 11, padding: "3px 8px", color: "#ff6b6b", borderColor: "#5a1a1a" }}>
                            🗑️ Todas
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <PaginaControles {...inscsInfo} />
          </div>

          {/* Revezamento — sem custo */}
          {provasRevez.length > 0 && (
            <div style={{ marginTop: 28, padding: 16, background: "#0d0e14", border: "1px solid #5dade233", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ color: "#1976D2", fontSize: 17, margin: 0, fontFamily: "'Barlow Condensed', sans-serif" }}>🏃‍♂️ Revezamentos</h2>
                <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
                  {inscsRevez.length > 0 ? `${inscsRevez.length} equipe(s) inscrita(s)` : "Nenhuma equipe inscrita ainda"}
                  <span style={{ color: "#4aaa4a", marginLeft: 8, fontSize: 12, fontWeight: 600 }}>· Sem custo adicional</span>
                </p>
                <p style={{ color: "#555", fontSize: 12, marginTop: 2 }}>
                  O revezamento é composto por atletas já inscritos no evento — nenhum valor extra é cobrado.
                </p>
              </div>
              <button style={styles.btnSecondary} onClick={() => setTela("inscricao-revezamento")}>
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
              <div style={{ background: "#0a1220", border: "1px solid #1976D244", borderRadius: 10, padding: 20, marginBottom: 20 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, color: "#1976D2", marginBottom: 14 }}>
                  ➕ Selecionar atleta e provas
                </div>

                {/* Seletor de atleta */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", color: "#aaa", fontSize: 12, marginBottom: 6 }}>ATLETA</label>
                  <select
                    value={inserirAtletaId}
                    onChange={e => { setInserirAtletaId(e.target.value); setInserirProvasIds(new Set()); }}
                    style={{ ...styles.input, marginBottom: 0, maxWidth: 400 }}>
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
                    <div style={{ color: "#666", fontSize: 13, padding: "10px 0" }}>
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

                  return (
                    <div>
                      {/* Cabeçalho com categoria e limite */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: "#aaa", textTransform: "uppercase", letterSpacing: 1 }}>PROVAS DISPONÍVEIS</span>
                        <span style={{ fontSize: 12, color: "#1976D2", fontWeight: 700 }}>{cat?.nome || "—"}</span>
                        {limite > 0 && (
                          <span style={{
                            fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "3px 12px",
                            background: limiteAtingido ? "#2a0a0a" : "#0a1a2a",
                            border: `1px solid ${limiteAtingido ? "#8a2a2a" : "#1976D244"}`,
                            color: limiteAtingido ? "#ff6b6b" : "#7aacff",
                          }}>
                            {limiteAtingido
                              ? `🔒 Limite atingido (${limite} prova${limite !== 1 ? "s" : ""})`
                              : `📋 Limite: ${usadas}/${limite} — restam ${restam}`}
                          </span>
                        )}
                        {selecionadas > 0 && (
                          <button
                            style={{ ...styles.btnPrimary, padding: "7px 20px", fontSize: 13, marginLeft: "auto" }}
                            onClick={handleAdicionarAoCarrinho}>
                            + Adicionar {selecionadas} prova{selecionadas !== 1 ? "s" : ""} ao lote
                          </button>
                        )}
                      </div>

                      {/* Chips agrupados */}
                      {Object.entries(grupos).map(([grupo, provas]) => (
                        <div key={grupo} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, color: "#555", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                            {grupo}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {provas.map(p => {
                              const jaInscrito  = inscsEvt.some(i => i.atletaId === inserirAtletaId && i.provaId === p.id && !i.combinadaId);
                              const jaNoLote    = carrinho.some(c => c.atletaId === inserirAtletaId && c.provaId === p.id);
                              const selecionada = inserirProvasIds.has(p.id);
                              const bloqueada   = jaInscrito || jaNoLote || (limiteAtingido && !selecionada);

                              let chipStyle = {
                                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                                cursor: bloqueada ? "not-allowed" : "pointer",
                                fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5,
                                transition: "all 0.15s", border: "1px solid",
                                opacity: bloqueada ? 0.45 : 1,
                              };

                              if (jaInscrito) {
                                chipStyle = { ...chipStyle, background: "#0a2a0a", borderColor: "#2a6a2a", color: "#4aaa4a" };
                              } else if (jaNoLote) {
                                chipStyle = { ...chipStyle, background: "#1a1a0a", borderColor: "#4a4a1a", color: "#aaaa44" };
                              } else if (selecionada) {
                                chipStyle = { ...chipStyle, background: "#0d1a2e", borderColor: "#1976D2", color: "#5aadff", boxShadow: "0 0 0 2px #1976D244" };
                              } else {
                                chipStyle = { ...chipStyle, background: "#111318", borderColor: "#1a1d2a", color: "#888" };
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
                                  title={jaInscrito ? "Já inscrito" : jaNoLote ? "Já no lote" : bloqueada ? "Limite atingido" : "Clique para selecionar"}>
                                  {jaInscrito ? "✓ " : jaNoLote ? "🛒 " : selecionada ? "✔ " : ""}{p.nome}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      <div style={{ marginTop: 8, fontSize: 11, color: "#444", display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <span><span style={{ color: "#4aaa4a" }}>✓</span> já inscrito</span>
                        <span><span style={{ color: "#aaaa44" }}>🛒</span> já no lote</span>
                        <span><span style={{ color: "#5aadff" }}>✔</span> selecionado agora</span>
                      </div>
                    </div>
                  );
                })()}

                {!inserirAtletaId && (
                  <div style={{ color: "#555", fontSize: 13, padding: "8px 0" }}>
                    👆 Selecione um atleta para ver as provas disponíveis para a categoria dele.
                  </div>
                )}
                <div style={{ marginTop: 12, fontSize: 12, color: "#444" }}>
                  💡 Revezamentos não aparecem — são compostos por atletas já inscritos, sem custo adicional.
                </div>
              </div>

              {carrinho.length === 0 ? (
                <div style={styles.emptyState}>
                  <span style={{ fontSize: 36 }}>🛒</span>
                  <p>Nenhum atleta adicionado ao lote.</p>
                  <p style={{ fontSize: 13 }}>Selecione atleta e prova acima.</p>
                </div>
              ) : (
                <>
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
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
                          <tr key={`cart_${r.atletaId}_${rowIdx}`} style={styles.tr}>
                            <td style={{ ...styles.td, fontWeight: 600, color: "#fff" }}>{r.atletaNome}</td>
                            <td style={styles.td}><span style={styles.badgeGold}>{r.catNome}</span></td>
                            <td style={styles.td}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {r.provas.map((item, iIdx) => (
                                  <span key={`${item.provaId}_${iIdx}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#0a1a0a", border: "1px solid #1a4a1a", color: "#7acc44" }}>
                                    {item.provaNome}
                                    <button onClick={() => removerDoCarrinho(item.atletaId, item.provaId)}
                                      style={{ background: "none", border: "none", cursor: "pointer", color: "#ff6b6b", fontSize: 10, padding: "0 2px" }}>✕</button>
                                  </span>
                                ))}
                              </div>
                            </td>
                            {temPreco && (
                              <td style={{ ...styles.td, textAlign: "right", whiteSpace: "nowrap" }}>
                                {r.jaTemInscricao ? (
                                  <span style={{ fontSize: 11, color: "#555", background: "#111", border: "1px solid #1e2130", borderRadius: 6, padding: "3px 8px" }}>
                                    Já inscrito
                                  </span>
                                ) : r.precoInfo?.preco != null ? (
                                  <div>
                                    <strong style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, color: "#7acc44" }}>
                                      {formatarPreco(r.precoInfo?.preco)}
                                    </strong>
                                    <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>
                                      {r.precoInfo?.tipo === "comEquipe" ? "🏛️ com equipe" :
                                       r.precoInfo?.tipo === "semEquipe" ? "👤 sem equipe" :
                                       r.precoInfo?.tipo === "global"    ? "🌐 valor geral" : ""}
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}>Gratuito</span>
                                )}
                              </td>
                            )}
                            <td style={styles.td}>
                              <button onClick={() => setCarrinho(c => c.filter(x => x.atletaId !== r.atletaId))}
                                style={{ ...styles.btnGhost, fontSize: 11, padding: "3px 8px", color: "#ff6b6b", borderColor: "#5a1a1a" }}>
                                🗑️ Remover
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {temPrecoConfig && totalGeral > 0 && (
                        <tfoot>
                          <tr>
                            <td colSpan={3} style={{ padding: "10px 16px", borderTop: "1px solid #1976D244", color: "#888", fontSize: 12, fontWeight: 600 }}>
                              SUBTOTAL DO LOTE ({resumoCarrinho.filter(r => r.valorCobrar > 0).length} atleta{resumoCarrinho.filter(r => r.valorCobrar > 0).length !== 1 ? "s" : ""} a cobrar)
                            </td>
                            <td style={{ padding: "10px 16px", borderTop: "1px solid #1976D244", textAlign: "right" }}>
                              <strong style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, color: "#7acc44" }}>
                                {formatarPreco(totalGeral)}
                              </strong>
                            </td>
                            <td style={{ borderTop: "1px solid #1976D244" }}></td>
                          </tr>
                          {eventoAtual.formaPagamento && (
                            <tr>
                              <td colSpan={5} style={{ padding: "6px 16px 10px", fontSize: 11, color: "#555" }}>
                                Pagamento via <strong style={{ color: "#aaa" }}>{eventoAtual.formaPagamento}</strong>
                                {eventoAtual.orientacaoPagamento && (
                                  <span style={{ marginLeft: 8, color: "#444" }}>· {eventoAtual.orientacaoPagamento.slice(0, 80)}{eventoAtual.orientacaoPagamento.length > 80 ? "…" : ""}</span>
                                )}
                              </td>
                            </tr>
                          )}
                        </tfoot>
                      )}
                    </table>
                  </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
                    <button style={styles.btnGhost} onClick={() => setCarrinho([])}>🗑 Limpar lote</button>
                    <button style={styles.btnPrimary} onClick={() => setEtapa("confirmacao")}>
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
              <div style={{ background: "#0E1016", border: "1px solid #1E2130", borderRadius: 16, padding: 28 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                  📋 Revisão do Lote
                </div>
                <div style={{ color: "#666", fontSize: 13, marginBottom: 24 }}>
                  {eventoAtual.nome} · {carrinho.length} inscrição(ões) para {resumoCarrinho.length} atleta(s)
                </div>

                {resumoCarrinho.map((r, rIdx) => (
                  <div key={`rev_${r.atletaId}_${rIdx}`} style={{ background: "#0a0c12", border: "1px solid #1a2030", borderRadius: 10, padding: "14px 18px", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{r.atletaNome}</div>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{r.catNome}</div>
                      </div>
                      {temPreco && (
                        <div style={{ textAlign: "right" }}>
                          {r.jaTemInscricao ? (
                            <div>
                              <span style={{ fontSize: 12, color: "#888", background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, padding: "3px 10px" }}>
                                Já inscrito
                              </span>
                              <div style={{ fontSize: 10, color: "#444", marginTop: 3 }}>sem cobrança adicional</div>
                            </div>
                          ) : r.precoInfo?.preco != null ? (
                            <div>
                              <strong style={{ color: "#7acc44", fontSize: 22, fontFamily: "'Barlow Condensed', sans-serif" }}>
                                {formatarPreco(r.precoInfo?.preco)}
                              </strong>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                                {r.precoInfo?.tipo === "comEquipe" && (
                                  <span style={{ fontSize: 10, background: "#0a200a", border: "1px solid #1a4a1a", color: "#4a9a4a", borderRadius: 4, padding: "1px 6px" }}>
                                    🏛️ atleta federado
                                  </span>
                                )}
                                {r.precoInfo?.tipo === "semEquipe" && (
                                  <span style={{ fontSize: 10, background: "#1a1a0a", border: "1px solid #4a4a1a", color: "#9a9a4a", borderRadius: 4, padding: "1px 6px" }}>
                                    👤 atleta não federado
                                  </span>
                                )}
                                {r.precoInfo?.tipo === "global" && (
                                  <span style={{ fontSize: 10, background: "#0a1a2a", border: "1px solid #1a3a5a", color: "#4a7aaa", borderRadius: 4, padding: "1px 6px" }}>
                                    🌐 valor geral
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: "#555", fontStyle: "italic" }}>Gratuito</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
                      {r.provas.map((p, pIdx) => (
                        <span key={`${p.provaId}_${pIdx}`} style={{ background: "#0a1a0a", border: "1px solid #1a4a1a", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#7acc44" }}>
                          ✓ {p.provaNome}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Total */}
                {temPrecoConfig && (
                  <div style={{ background: "#0a1220", border: "1px solid #1976D244", borderRadius: 10, padding: "16px 20px", marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>💰 Total do lote</span>
                      <strong style={{ color: "#7acc44", fontSize: 26, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {totalGeral > 0 ? formatarPreco(totalGeral) : "—"}
                      </strong>
                    </div>
                    {totalGeral > 0 && eventoAtual.formaPagamento && (
                      <div style={{ fontSize: 13, color: "#aaa", borderTop: "1px solid #1E2130", paddingTop: 8 }}>
                        <span style={{ color: "#888" }}>Pagamento via </span>
                        <strong style={{ color: "#fff" }}>{eventoAtual.formaPagamento}</strong>
                      </div>
                    )}
                    {totalGeral > 0 && eventoAtual.orientacaoPagamento && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#aaa", whiteSpace: "pre-wrap", lineHeight: 1.6, background: "#0d1520", borderRadius: 8, padding: "8px 12px" }}>
                        {eventoAtual.orientacaoPagamento}
                      </div>
                    )}
                    {totalGeral === 0 && (
                      <div style={{ fontSize: 12, color: "#555" }}>
                        Todos os atletas já têm inscrição neste evento — nenhum valor a cobrar.
                      </div>
                    )}
                    {/* Aviso revezamento */}
                    {provasRevez.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#4aaa4a", borderTop: "1px solid #1E2130", paddingTop: 8 }}>
                        ✔ Revezamentos não entram neste cálculo — sem custo adicional para atletas já inscritos.
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "space-between", flexWrap: "wrap" }}>
                  <button style={styles.btnGhost} onClick={() => setEtapa("montagem")}>← Voltar e editar</button>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button style={{ ...styles.btnGhost, borderColor: "#1976D244", color: "#7aacff" }} onClick={imprimirLote}>
                      🖨️ Imprimir detalhamento
                    </button>
                    <button
                      style={{ ...styles.btnPrimary, background: "linear-gradient(135deg, #2a7a2a, #1a5a1a)", fontSize: 16, padding: "14px 32px" }}
                      onClick={handleConfirmar}>
                      ✅ Confirmar {carrinho.length} inscrição{carrinho.length !== 1 ? "ões" : ""}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ETAPA: CONCLUÍDO ── */}
          {etapa === "concluido" && (
            <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
              <div style={{ background: "#0E1016", border: "1px solid #1E2130", borderRadius: 16, padding: 40 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, color: "#7acc44", marginBottom: 8 }}>
                  Lote confirmado!
                </div>
                <div style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>
                  {carrinho.length} inscrição{carrinho.length !== 1 ? "ões" : ""} registrada{carrinho.length !== 1 ? "s" : ""} com sucesso.
                </div>

                {/* Resumo financeiro final */}
                {temPreco && totalGeral > 0 && (
                  <div style={{ background: "#0a1220", border: "1px solid #1976D244", borderRadius: 10, padding: "16px 18px", marginBottom: 24, textAlign: "left" }}>
                    <div style={{ fontWeight: 700, color: "#1976D2", fontSize: 13, marginBottom: 10 }}>💳 Resumo de Pagamento</div>
                    {resumoCarrinho.filter(r => r.valorCobrar > 0).map((r, rIdx) => (
                      <div key={`fin_${r.atletaId}_${rIdx}`} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1E2130", fontSize: 13 }}>
                        <span style={{ color: "#bbb" }}>{r.atletaNome}</span>
                        <strong style={{ color: "#7acc44" }}>{formatarPreco(r.valorCobrar)}</strong>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 15 }}>
                      <strong style={{ color: "#fff" }}>Total</strong>
                      <strong style={{ color: "#7acc44", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22 }}>
                        {formatarPreco(totalGeral)}
                      </strong>
                    </div>
                    {eventoAtual.formaPagamento && (
                      <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                        Pagamento via {eventoAtual.formaPagamento}
                      </div>
                    )}
                    {eventoAtual.orientacaoPagamento && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#aaa", whiteSpace: "pre-wrap", lineHeight: 1.6, background: "#0d1520", borderRadius: 6, padding: "6px 10px" }}>
                        {eventoAtual.orientacaoPagamento}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
                  <button style={{ ...styles.btnGhost, borderColor: "#1976D244", color: "#7aacff" }} onClick={imprimirLote}>
                    🖨️ Imprimir detalhamento
                  </button>
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button style={styles.btnPrimary} onClick={resetCarrinho}>+ Novo Lote</button>
                  <button style={styles.btnGhost} onClick={async () => { resetCarrinho(); setModoCarrinho(false); }}>
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
