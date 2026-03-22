import React, { useState, useEffect } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { todasAsProvas, getComposicaoCombinada, nPernasRevezamento } from "../../shared/athletics/provasDef";
import { CATEGORIAS } from "../../shared/constants/categorias";
import { NomeProvaComImplemento, abreviarProva, formatarMarca, normalizarMarca, exibirMarcaInput, formatarTempo, autoFormatTempo, parseTempoPista } from "../../shared/formatters/utils";
import { CombinedEventEngine } from "../../shared/engines/combinedEventEngine";
import { CombinedScoringEngine, temDuasCronometragens } from "../../shared/engines/combinedScoringEngine";
import { getFasesProva, buscarSeriacao, resKey, FASE_NOME } from "../../shared/constants/fases";
import { Th, Td } from "../ui/TableHelpers";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";

const styles = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 20, letterSpacing: 1 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  btnPrimary: { background: "linear-gradient(135deg, #1976D2, #1565C0)", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: "#1976D2", border: "2px solid #1976D2", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost: { background: "transparent", color: "#888", border: "1px solid #2a2d3a", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: "1px solid #1E2130" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#0D0E12", padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1E2130" },
  td: { padding: "12px 16px", fontSize: 14, color: "#bbb", borderBottom: "1px solid #12141a" },
  tr: { transition: "background 0.15s" },
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
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#1976D2", marginBottom: 16 },
  formCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 16, padding: 32, marginBottom: 20 },
  formTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 8 },
  formSub: { color: "#666", textAlign: "center", fontSize: 14, marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },
  fieldError: { color: "#ff6b6b", fontSize: 12, marginTop: 2 },
  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: "#888", transition: "all 0.2s" },
  radioLabelActive: { background: "#1c1f2e", border: "1px solid #1976D2", color: "#1976D2" },
  sumuCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  btnIconSm: { background: "#141720", border: "1px solid #252837", color: "#888", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: "#1a0a0a", border: "1px solid #3a1a1a", color: "#ff6b6b", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
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
  permissividadeBox: { background: "#0d1117", border: "1px solid #1976D233", borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 4 },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? "#1a1c22" : "transparent", color: ativo ? "#1976D2" : "#444", border: `1px solid ${ativo ? "#1976D244" : "#1E2130"}` }),
  stepDivider: { flex: 1, height: 1, background: "#1E2130", margin: "0 8px" },
  tagProva: { background: "#1976D222", color: "#1976D2", border: "1px solid #1976D244", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: "#fff", fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  statusControlsCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  modoSwitch: { display: "flex", gap: 0, background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: "#666", padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: "#141720", color: "#1976D2" },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: "#0E1016", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
  savedBadge: { background: "#0a2a0a", border: "1px solid #2a6a2a", color: "#4aaa4a", padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, overflow: "hidden", marginBottom: 20 },
  digitarHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  inputMarca: { background: "#141720", border: "1px solid #252837", borderRadius: 6, padding: "8px 12px", color: "#1976D2", fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
  digitarDica: { color: "#666", fontSize: 12, padding: "8px 20px" },
};

// Item 8: exibe sigla da equipe quando disponível, com fallback para nome/clube
const getExibicaoEquipe = (atleta, equipes) => {
  const eq = (equipes||[]).find(e => e.id === atleta?.equipeId);
  if (eq) return (eq.sigla?.trim() || eq.nome || atleta?.clube || "—");
  return atleta?.clube || "—";
};

// ── estilos locais extras (altura/vara) ─────────────────────────────────────
const sty = {
  alturaBox: {
    background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10,
    padding: "18px 20px", marginBottom: 16,
  },
  alturaRow: {
    display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10,
  },
  alturaInput: {
    background: "#1a1c22", border: "1px solid #2a2d3a", color: "#1976D2",
    borderRadius: 6, padding: "6px 10px", width: 80,
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700,
    textAlign: "center",
  },
  addBtn: {
    background: "#1E2130", border: "1px solid #2a2d3a", color: "#888",
    borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13,
  },
  removeBtn: {
    background: "transparent", border: "none", color: "#cc4444",
    cursor: "pointer", fontSize: 16, padding: "0 4px",
  },
  atletaCard: {
    background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 8,
    marginBottom: 12, overflow: "hidden",
  },
  atletaCardHead: {
    background: "#13151c", padding: "10px 16px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "1px solid #1E2130",
  },
  atletaCardBody: {
    padding: "12px 16px", overflowX: "auto",
  },
  alturaColHead: {
    minWidth: 80, textAlign: "center", padding: "0 4px",
  },
  tentBtn: (val, active) => ({
    width: 32, height: 32, border: "none", borderRadius: 5,
    cursor: "pointer", fontSize: 13, fontWeight: 800,
    background: active
      ? (val === "O" ? "#1a4a1a" : val === "X" ? "#4a1a1a" : "#2a2a2a")
      : "#1a1c22",
    color: active
      ? (val === "O" ? "#4cff4c" : val === "X" ? "#ff5555" : "#aaa")
      : "#444",
    outline: active ? `2px solid ${val === "O" ? "#2a8a2a" : val === "X" ? "#cc2222" : "#555"}` : "none",
  }),
  melhorBadge: (val) => ({
    background: val ? "#1a3a1a" : "#1a1c22",
    color: val ? "#4cff4c" : "#555",
    border: `1px solid ${val ? "#2a8a2a" : "#2a2d3a"}`,
    borderRadius: 6, padding: "4px 12px",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 15, fontWeight: 800,
  }),
  th: {
    padding: "7px 6px", fontSize: 10, fontWeight: 700,
    fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1,
    textAlign: "center", color: "#aaa",
    background: "#0D0E12", borderBottom: "1px solid #1E2130",
  },
};

/* ════════════════════════════════════════════════════════════════════════════
   BlocoDigitarCategoria — sub-componente que renderiza a seção de digitação
   para UMA categoria específica (catId). Possui estado próprio.
   ════════════════════════════════════════════════════════════════════════════ */
function BlocoDigitarCategoria({
  catId, filtroProva, filtroSexo, filtroFase,
  eid, eventoAtual, inscricoes, atletas, resultados, equipes,
  atualizarResultado, atualizarResultadosEmLote, limparResultado, limparTodosResultados,
  editarEvento, numeracaoPeito, getClubeAtleta, recordes,
  usuarioLogado, registrarAcao, setTela,
  todasProvasComCombinadas, inscDoEvento,
}) {
  const s = useStylesResponsivos(styles);
  const confirmar = useConfirm();

  // ── estado próprio por categoria ──────────────────────────────────────────
  const [marcas,        setMarcas]        = useState({});
  const [salvo,         setSalvo]         = useState(false);
  const [confirmLimpar, setConfirmLimpar] = useState(null);
  const [alturas,       setAlturas]       = useState([""]);
  const [tentativas,    setTentativas]    = useState({});
  const [cronometragem, setCronometragem] = useState("ELE");

  // ── derived values ────────────────────────────────────────────────────────
  const provaSel = todasProvasComCombinadas.find((p) => p.id === filtroProva);
  const isRevezamento = provaSel && provaSel.tipo === "revezamento";

  // Para provas individuais: atletas inscritos
  let atletasNaProva = isRevezamento ? [] : inscricoes
    .filter((i) => i.eventoId === eid && i.provaId === filtroProva && (i.categoriaOficialId || i.categoriaId) === catId && i.sexo === filtroSexo && i.tipo !== "revezamento")
    .map((i) => atletas.find((a) => a.id === i.atletaId))
    .filter(Boolean);

  // Para revezamentos: equipes inscritas
  const equipesRevezNaProva = isRevezamento
    ? inscricoes
        .filter(i => i.tipo === "revezamento" && i.eventoId === eid && i.provaId === filtroProva &&
          (i.categoriaOficialId || i.categoriaId) === catId && i.sexo === filtroSexo)
        .map(i => {
          const eq = equipes.find(e => e.id === i.equipeId);
          const nomeEq = eq ? (eq.clube || eq.nome || "—") : (i.equipeId?.startsWith("clube_") ? i.equipeId.substring(6) : "—");
          const atlsObj = (i.atletasIds || []).map(aid => atletas.find(a => a.id === aid)).filter(Boolean);
          return { equipeId: i.equipeId, nomeEquipe: nomeEq, sigla: eq?.sigla || "", atletasIds: i.atletasIds || [], atletas: atlsObj };
        })
    : [];

  // Detectar fases da prova selecionada
  const _provaFases = getFasesProva(filtroProva, eventoAtual?.programaHorario || {});
  const _temFases = _provaFases.length > 1;
  const faseEfetiva = _temFases ? (filtroFase || _provaFases[0] || "") : "";

  // ── Filtrar atletas pela seriação da fase selecionada ──
  const _serDigitar = faseEfetiva ? buscarSeriacao(eventoAtual.seriacao, filtroProva, catId, filtroSexo, faseEfetiva) : null;
  if (_serDigitar?.series && _serDigitar.series.length > 0 && !isRevezamento) {
    const idsNaSeriacao = _serDigitar.series.flatMap(serie => serie.atletas.map(a => a.id || a.atletaId));
    const filtrados = atletasNaProva.filter(a => idsNaSeriacao.includes(a.id));
    if (filtrados.length > 0) {
      atletasNaProva = filtrados.sort((a, b) => {
        let sA = 99, rA = 99, sB = 99, rB = 99;
        for (const serie of _serDigitar.series) {
          const fA = serie.atletas.find(x => (x.id || x.atletaId) === a.id);
          if (fA) { sA = serie.numero; rA = fA.raia || 99; }
          const fB = serie.atletas.find(x => (x.id || x.atletaId) === b.id);
          if (fB) { sB = serie.numero; rB = fB.raia || 99; }
        }
        return sA !== sB ? sA - sB : rA - rB;
      });
    }
  }
  // Helper: buscar série/raia de um atleta na seriação da fase
  const _getSerInfo = (atletaId) => {
    if (!_serDigitar?.series) return { serie: "", raia: "" };
    for (const serie of _serDigitar.series) {
      const found = serie.atletas.find(x => (x.id || x.atletaId) === atletaId);
      if (found) return { serie: String(serie.numero), raia: found.raia ? String(found.raia) : "" };
    }
    return { serie: "", raia: "" };
  };

  const chave       = resKey(eid, filtroProva, catId, filtroSexo, faseEfetiva);
  const resExistentes = resultados[chave] || {};

  const getExist = (a, campo, fallback = "") => {
    const r = resExistentes[a.id];
    if (r == null) return fallback;
    if (typeof r === "object") return r[campo] ?? fallback;
    return campo === "marca" ? r : fallback;
  };

  // Wrappers que incluem a fase automaticamente
  const _atualizar = (eventoId, provId, catIdArg, sexo, atletaId, marca, raia, vento, tent) =>
    atualizarResultado(eventoId, provId, catIdArg, sexo, atletaId, marca, raia, vento, tent, faseEfetiva);
  const _limpar = (eventoId, provId, catIdArg, sexo, atletaId) =>
    limparResultado(eventoId, provId, catIdArg, sexo, atletaId, faseEfetiva);
  const _limparTodos = (eventoId, provId, catIdArg, sexo) =>
    limparTodosResultados(eventoId, provId, catIdArg, sexo, faseEfetiva);

  const isAltura = provaSel &&
    provaSel.tipo === "salto" &&
    (provaSel.id.includes("altura") || provaSel.id.includes("vara"));

  // ── cronometragem: detectar se prova componente tem tabelas MAN+ELE ────────
  const provaPossuiDuasCrono = provaSel?.origemCombinada && provaSel?.combinadaId && provaSel?.provaOriginalSufixo
    ? temDuasCronometragens(provaSel.combinadaId, provaSel.provaOriginalSufixo) : false;

  // Sincronizar cronometragem ao trocar de prova (lê do eventoAtual)
  React.useEffect(() => {
    if (filtroProva && eventoAtual?.cronometragemProvas?.[filtroProva]) {
      setCronometragem(eventoAtual.cronometragemProvas[filtroProva]);
    } else {
      setCronometragem("ELE");
    }
  }, [filtroProva]);

  // Salvar cronometragem no eventoAtual quando alternar
  const alternarCronometragem = (valor) => {
    setCronometragem(valor);
    const prev = eventoAtual.cronometragemProvas || {};
    editarEvento({ ...eventoAtual, cronometragemProvas: { ...prev, [filtroProva]: valor } });
  };

  // ── helpers para Altura/Vara ────────────────────────────────────────────────
  const OPCOES = ["", "O", "X", "-"];
  const LABELS = { "O": "✓ Transpôs", "X": "✗ Falha", "-": "— Passou", "": "—" };
  const CORES  = { "O": "#2a8a2a", "X": "#cc2222", "-": "#888", "": "#333" };

  const setTentativa = (atletaId, altura, idx, val) => {
    setTentativas((prev) => {
      const cp  = { ...prev };
      const atl = { ...(cp[atletaId] || {}) };
      const arr = [...(atl[altura] || ["", "", ""])];
      arr[idx]  = val;
      atl[altura] = arr;
      cp[atletaId] = atl;
      return cp;
    });
  };

  const melhorAltura = (atletaId) => {
    const tent = tentativas[atletaId] || {};
    const alt = Array.isArray(alturas) ? alturas : [];
    const valid = alt
      .filter((h) => h && (tent[h] || []).includes("O"))
      .map((h) => parseFloat(h))
      .filter((n) => !isNaN(n));
    return valid.length > 0 ? Math.max(...valid) : null;
  };

  const calcSU = (atletaId) => {
    const tent = tentativas[atletaId] || {};
    const alt = Array.isArray(alturas) ? alturas : [];
    const melhor = melhorAltura(atletaId);
    if (melhor == null) return 0;
    const key = alt.find(h => parseFloat(h) === melhor);
    if (!key) return 0;
    const arr = Array.isArray(tent[key]) ? tent[key] : [];
    return arr.filter(t => t === "X" || t === "O").length;
  };

  const calcFP = (atletaId) => {
    const tent = tentativas[atletaId] || {};
    const alt = Array.isArray(alturas) ? alturas : [];
    let total = 0;
    alt.forEach(h => {
      if (!h) return;
      const arr = Array.isArray(tent[h]) ? tent[h] : [];
      if (arr.includes("O")) {
        total += arr.filter(t => t === "X").length;
      }
    });
    return total;
  };

  const calcPosAltura = (atletaId, todosAtletas) => {
    const meuMelhor = melhorAltura(atletaId);
    if (meuMelhor == null) return null;
    const meuSU = calcSU(atletaId);
    const meuFP = calcFP(atletaId);

    const rank = todosAtletas.filter(a => {
      if (a.id === atletaId) return false;
      const dele = melhorAltura(a.id);
      if (dele == null) return false;
      if (dele > meuMelhor) return true;
      if (dele < meuMelhor) return false;
      const deleSU = calcSU(a.id);
      if (deleSU < meuSU) return true;
      if (deleSU > meuSU) return false;
      const deleFP = calcFP(a.id);
      if (deleFP < meuFP) return true;
      if (deleFP > meuFP) return false;
      return false;
    }).length + 1;
    return rank;
  };

  const temDesempateAltura = (() => {
    const melhores = atletasNaProva
      .map(a => melhorAltura(a.id))
      .filter(m => m != null);
    const duplicatas = melhores.filter((m, i) => melhores.indexOf(m) !== i);
    if (duplicatas.length === 0) return false;
    for (const dup of [...new Set(duplicatas)]) {
      const empatados = atletasNaProva.filter(a => melhorAltura(a.id) === dup);
      const posicoes = empatados.map(a => calcPosAltura(a.id, atletasNaProva));
      if (new Set(posicoes).size > 1) return true;
    }
    return false;
  })();

  const eliminado = (atletaId, altura) => {
    const raw = tentativas[atletaId]?.[altura];
    const arr = Array.isArray(raw) ? raw : ["", "", ""];
    return arr.filter((t) => t === "X").length === 3;
  };

  const isEliminadoAntes = (atletaId, alturaIdx) => {
    const alturasValidas = (Array.isArray(alturas) ? alturas : []).filter(h => h !== "");
    for (let i = 0; i < alturaIdx; i++) {
      if (eliminado(atletaId, alturasValidas[i])) return true;
    }
    return false;
  };

  const getEstadoCelula = (atletaId, alturaIdx, tentativaIdx) => {
    const alturasValidas = (Array.isArray(alturas) ? alturas : []).filter(h => h !== "");
    const h = alturasValidas[alturaIdx];
    const rawTent = tentativas[atletaId]?.[h];
    const tent = Array.isArray(rawTent) ? rawTent : ["", "", ""];
    if (isEliminadoAntes(atletaId, alturaIdx)) return "eliminado";
    for (let t = 0; t < tentativaIdx; t++) {
      if (tent[t] === "O") return "bloq_sucesso";
    }
    if (tentativaIdx > 0 && tent[tentativaIdx - 1] === "") return "aguardando";
    return "habilitado";
  };

  const handleSalvarAltura = async () => {
    const _normAlt = (h) => { const n = parseFloat(h); return isNaN(n) ? null : n.toFixed(2); };
    const alturasNorm = (Array.isArray(alturas) ? alturas : []).filter(h => h).map(_normAlt).filter(h => h != null);
    const _normTent = (tentObj) => {
      if (!tentObj || typeof tentObj !== "object") return tentObj;
      const norm = {};
      Object.entries(tentObj).forEach(([k, v]) => {
        const nk = _normAlt(k);
        if (nk != null) norm[nk] = v;
      });
      return norm;
    };

    const entradas = [];
    atletasNaProva.forEach((a) => {
      const existObj = typeof resExistentes[a.id] === "object" ? resExistentes[a.id] : {};
      const statusVal = marcas[a.id]?.status || existObj.status || "";
      const dqRegraVal = marcas[a.id]?.dqRegra || existObj.dqRegra || "";
      if (statusVal) {
        entradas.push({ atletaId: a.id, marca: statusVal, tentData: {}, statusData: {
          status: statusVal, ...(statusVal === "DQ" && dqRegraVal ? { dqRegra: dqRegraVal } : {}),
          alturas: alturasNorm,
          tentativas: _normTent(tentativas[a.id] || {}),
        }});
        return;
      }
      const melhor = melhorAltura(a.id);
      if (melhor != null) {
        entradas.push({ atletaId: a.id, marca: _normAlt(melhor), tentData: {
          alturas: alturasNorm,
          tentativas: _normTent(tentativas[a.id] || {}),
        }});
      }
    });
    if (entradas.length > 0) {
      await atualizarResultadosEmLote(eid, filtroProva, catId, filtroSexo, faseEfetiva, entradas);
    }
    console.log("💾 handleSalvarAltura: salvou", atletasNaProva.length, "atletas com alturas:", alturas);
    if (usuarioLogado && registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Digitou resultados", `${provaSel?.nome || filtroProva} — ${atletasNaProva.length} atleta(s)`, usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "resultados" });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  };

  // ── salvar normal (provas não-altura) ───────────────────────────────────────
  const handleSalvar = async () => {
    const provaSel2 = todasProvasComCombinadas.find((p) => p.id === filtroProva);
    const isCampo2  = provaSel2 && provaSel2.unidade !== "s" &&
      !(provaSel2.tipo === "salto" && (provaSel2.id.includes("altura") || provaSel2.id.includes("vara")));

    const parseTent2 = (v) => {
      if (v === "" || v == null) return null;
      if (String(v).trim().toUpperCase() === "X") return null;
      const n = parseFloat(v); return isNaN(n) ? null : n;
    };
    const melhorDe2 = (vals) => {
      const ns = vals.map(parseTent2).filter(n => n !== null);
      return ns.length > 0 ? Math.max(...ns) : null;
    };

    const atletasSalvar = atletasNaProva.filter(a =>
      marcas[a.id] != null || resExistentes[a.id] != null
    );

    if (isCampo2) {
      const entradas = [];
      atletasSalvar.forEach(a => {
        const existente = typeof resExistentes[a.id] === "object" ? resExistentes[a.id] :
                          resExistentes[a.id] != null ? { marca: resExistentes[a.id] } : {};
        const editado = marcas[a.id] || {};
        const d = { ...existente, ...editado };
        const statusVal = d.status || "";
        if (statusVal) {
          entradas.push({ atletaId: a.id, marca: statusVal, tentData: {}, statusData: { status: statusVal, ...(statusVal === "DQ" && d.dqRegra ? { dqRegra: d.dqRegra } : {}) } });
          return;
        }
        const melhor = melhorDe2([d.t1,d.t2,d.t3,d.t4,d.t5,d.t6]);
        if (melhor !== null && !isNaN(melhor) && melhor > 0) {
          const { marca, raia, vento, alturas: _a, tentativas: _t, status: _s, dqRegra: _dq, ...tentData } = d;
          entradas.push({ atletaId: a.id, marca: melhor, tentData });
        } else {
          // Auto-NM: T1-T3 todos X → marcar como NM
          const t1 = String(d.t1 || "").trim().toUpperCase();
          const t2 = String(d.t2 || "").trim().toUpperCase();
          const t3 = String(d.t3 || "").trim().toUpperCase();
          if (t1 === "X" && t2 === "X" && t3 === "X") {
            const { marca, raia, vento, alturas: _a, tentativas: _t, status: _s, dqRegra: _dq, ...tentData } = d;
            entradas.push({ atletaId: a.id, marca: "NM", tentData, statusData: { status: "NM" } });
          }
        }
      });
      if (entradas.length > 0) {
        await atualizarResultadosEmLote(eid, filtroProva, catId, filtroSexo, faseEfetiva, entradas);
      }
    } else {
      for (const a of atletasSalvar) {
        const existente = typeof resExistentes[a.id] === "object" ? resExistentes[a.id] :
                          resExistentes[a.id] != null ? { marca: resExistentes[a.id] } : {};
        const editado = marcas[a.id] || {};
        const d = { ...existente, ...editado };
        const statusVal = d.status || "";
        if (statusVal) {
          const _raiaSer2 = _getSerInfo(a.id).raia;
          await _atualizar(eid, filtroProva, catId, filtroSexo, a.id,
            statusVal,
            d.raia !== "" ? d.raia : (_raiaSer2 || undefined),
            undefined,
            { status: statusVal, ...(statusVal === "DQ" && d.dqRegra ? { dqRegra: d.dqRegra } : {}) });
          continue;
        }
        const marcaMs = parseTempoPista(d.marca);
        const _raiaSer = _getSerInfo(a.id).raia;
        if (marcaMs !== null && marcaMs > 0)
          await _atualizar(eid, filtroProva, catId, filtroSexo, a.id,
            marcaMs,
            d.raia  !== "" ? d.raia  : (_raiaSer || undefined),
            d.vento !== "" ? d.vento : undefined);
      }
    }
    console.log("💾 handleSalvar: salvou", atletasSalvar.length, "atletas");
    if (usuarioLogado && registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Digitou resultados", `${provaSel?.nome || filtroProva} — ${atletasSalvar.length} atleta(s)`, usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "resultados" });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  };

  // ── handlers de limpeza ────────────────────────────────────────────────────
  const pedirLimparAtleta = (atletaId) => setConfirmLimpar(`individual:${atletaId}`);
  const pedirLimparTodos  = ()         => setConfirmLimpar("todos");
  const cancelarLimpar    = ()         => setConfirmLimpar(null);

  const confirmarLimpar = () => {
    if (confirmLimpar === "todos") {
      _limparTodos(eid, filtroProva, catId, filtroSexo);
      setMarcas({}); setTentativas({});
    } else if (confirmLimpar?.startsWith("individual:")) {
      const atletaId = confirmLimpar.split(":")[1];
      _limpar(eid, filtroProva, catId, filtroSexo, atletaId);
      setMarcas((p) => { const n={...p}; delete n[atletaId]; return n; });
      setTentativas((p) => { const n={...p}; delete n[atletaId]; return n; });
    }
    setConfirmLimpar(null);
  };

  // ── modal de confirmação de limpeza ─────────────────────────────────────────
  const modalLimpar = confirmLimpar ? (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.75)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999,
    }}>
      <div style={{
        background:"#13151c", border:"1px solid #cc4444",
        borderRadius:12, padding:"28px 32px", maxWidth:360, textAlign:"center",
      }}>
        <div style={{ fontSize:32, marginBottom:12 }}>🗑️</div>
        <div style={{ color:"#fff", fontWeight:700, fontSize:16, marginBottom:8 }}>
          {confirmLimpar === "todos"
            ? "Limpar todos os resultados desta prova?"
            : `Limpar resultado deste atleta?`}
        </div>
        <div style={{ color:"#ff6b6b", fontSize:13, marginBottom:4, fontWeight:600 }}>
          ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!
        </div>
        <div style={{ color:"#888", fontSize:12, marginBottom:24 }}>
          {confirmLimpar === "todos"
            ? "Todos os resultados desta categoria serão apagados permanentemente."
            : "O resultado deste atleta será apagado permanentemente."}
        </div>
        <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
          <button
            style={{ ...s.btnGhost, borderColor:"#555", minWidth:100 }}
            onClick={cancelarLimpar}
          >Cancelar</button>
          <button
            style={{ ...s.btnPrimary, background:"#7a1a1a", borderColor:"#cc4444", minWidth:100 }}
            onClick={confirmarLimpar}
          >🗑️ Confirmar</button>
        </div>
      </div>
    </div>
  ) : null;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={s.digitarSection}>
      {modalLimpar}
      {/* ── Category header banner ── */}
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 800, color: "#1976D2", padding: "12px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", letterSpacing: 1 }}>
        {CATEGORIAS.find(c => c.id === catId)?.nome || catId} — {filtroSexo === "M" ? "Masculino" : "Feminino"}
      </div>

      <div style={s.digitarHeader}>
        <div>
          <strong style={{ color: "#1976D2" }}><NomeProvaComImplemento nome={provaSel?.nome} style={{ color: "#1976D2" }} /></strong>
          {_temFases && faseEfetiva && (
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, marginLeft: 8, fontWeight: 700,
              background: faseEfetiva === "ELI" ? "#2a1a0a" : faseEfetiva === "SEM" ? "#0a1a2a" : "#0a2a0a",
              color: faseEfetiva === "ELI" ? "#ff8844" : faseEfetiva === "SEM" ? "#88aaff" : "#7cfc7c",
            }}>
              {FASE_NOME[faseEfetiva]}
            </span>
          )}
          {provaSel?.origemCombinada && (
            <span style={{ fontSize: 11, background: "#0a1a2a", color: "#1976D2", padding: "2px 8px", borderRadius: 4, marginLeft: 8, fontWeight: 600 }}>
              🏅 {provaSel.nomeCombinada} ({provaSel.ordem}/{provaSel.totalProvas})
            </span>
          )}
          {provaPossuiDuasCrono && (
            <span style={{ marginLeft: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#888" }}>⏱ Cronometragem:</span>
              <button
                onClick={() => alternarCronometragem("ELE")}
                style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 4, cursor: "pointer",
                  border: cronometragem === "ELE" ? "1px solid #1976D2" : "1px solid #333",
                  background: cronometragem === "ELE" ? "#0a1a3a" : "transparent",
                  color: cronometragem === "ELE" ? "#1976D2" : "#666",
                  fontWeight: cronometragem === "ELE" ? 700 : 400,
                }}>Eletrônica</button>
              <button
                onClick={() => alternarCronometragem("MAN")}
                style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 4, cursor: "pointer",
                  border: cronometragem === "MAN" ? "1px solid #ff8844" : "1px solid #333",
                  background: cronometragem === "MAN" ? "#2a1a0a" : "transparent",
                  color: cronometragem === "MAN" ? "#ff8844" : "#666",
                  fontWeight: cronometragem === "MAN" ? 700 : 400,
                }}>Manual</button>
            </span>
          )}
          {isAltura && <span style={{ color: "#888", marginLeft: 12, fontSize: 12 }}>
            Salto em Altura / Vara — configure as barras abaixo
          </span>}
        </div>
      </div>

      {/* ── Condições da Prova: Horário / Umidade / Temperatura ── */}
      {(() => {
        const condKey = `${eid}_${filtroProva}_${catId}_${filtroSexo}`;
        const condAll = eventoAtual.condicoesProva || {};
        const cond = condAll[condKey] || {};
        const setCond = (campo, val) => {
          const novas = { ...condAll, [condKey]: { ...cond, [campo]: val } };
          editarEvento({ ...eventoAtual, condicoesProva: novas });
        };
        const inputSt = { background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 6, padding: "6px 10px", color: "#fff", fontSize: 13, width: 100, textAlign: "center" };
        const lblSt = { color: "#888", fontSize: 11, marginBottom: 2 };
        const grpSt = { display: "flex", flexDirection: "column", alignItems: "center" };
        return (
          <div style={{ background: "#0a0b10", border: "1px solid #1E2130", borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
              {/* INÍCIO */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ color: "#7cfc7c", fontSize: 12, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>▶ INÍCIO DA PROVA</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={grpSt}>
                    <div style={lblSt}>Horário</div>
                    <input type="time" style={{ ...inputSt, width: 110 }} value={cond.inicioHorario || ""} onChange={e => setCond("inicioHorario", e.target.value)} />
                  </div>
                  <div style={grpSt}>
                    <div style={lblSt}>Umidade (%)</div>
                    <input type="number" min="0" max="100" step="1" placeholder="—" style={inputSt} value={cond.inicioUmidade || ""} onChange={e => setCond("inicioUmidade", e.target.value)} />
                  </div>
                  <div style={grpSt}>
                    <div style={lblSt}>Temp. (°C)</div>
                    <input type="number" step="0.1" placeholder="—" style={inputSt} value={cond.inicioTemp || ""} onChange={e => setCond("inicioTemp", e.target.value)} />
                  </div>
                </div>
              </div>
              {/* Separador */}
              <div style={{ width: 1, height: 60, background: "#1E2130", alignSelf: "center" }} />
              {/* TÉRMINO */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ color: "#ff6b6b", fontSize: 12, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>⏹ TÉRMINO DA PROVA</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={grpSt}>
                    <div style={lblSt}>Horário</div>
                    <input type="time" style={{ ...inputSt, width: 110 }} value={cond.terminoHorario || ""} onChange={e => setCond("terminoHorario", e.target.value)} />
                  </div>
                  <div style={grpSt}>
                    <div style={lblSt}>Umidade (%)</div>
                    <input type="number" min="0" max="100" step="1" placeholder="—" style={inputSt} value={cond.terminoUmidade || ""} onChange={e => setCond("terminoUmidade", e.target.value)} />
                  </div>
                  <div style={grpSt}>
                    <div style={lblSt}>Temp. (°C)</div>
                    <input type="number" step="0.1" placeholder="—" style={inputSt} value={cond.terminoTemp || ""} onChange={e => setCond("terminoTemp", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Banner de resultados existentes */}
      {atletasNaProva.some(a => resExistentes[a.id] != null) && Object.keys(marcas).length === 0 && (
        <div style={{ background:"#0a1420", border:"1px solid #1a4a8a", borderRadius:8, padding:"12px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <span style={{ color:"#88aaff", fontSize:13 }}>
            📝 Esta prova já possui resultados salvos.
          </span>
          <button
            style={{ ...s.btnSecondary, fontSize:12, padding:"5px 14px" }}
            onClick={async () => {
              const loaded = {};
              const isCorridaEdit = provaSel && provaSel.unidade === "s" &&
                !(provaSel.tipo === "salto" && (provaSel.id.includes("altura") || provaSel.id.includes("vara")));
              atletasNaProva.forEach(a => {
                const r = resExistentes[a.id];
                if (r != null) {
                  if (typeof r === "object") {
                    loaded[a.id] = { ...r };
                    if (isCorridaEdit && loaded[a.id].marca != null) {
                      loaded[a.id].marca = String(Math.round(parseFloat(loaded[a.id].marca)));
                    }
                  } else {
                    loaded[a.id] = { marca: isCorridaEdit ? String(Math.round(parseFloat(r))) : r };
                  }
                }
              });
              setMarcas(loaded);
              if (isAltura) {
                const firstRes = Object.values(resExistentes).find(r => r && typeof r === "object" && r.alturas);
                if (firstRes?.alturas) {
                  setAlturas(Array.isArray(firstRes.alturas) ? firstRes.alturas : [""]);
                }
                const loadedTent = {};
                atletasNaProva.forEach(a => {
                  const r = resExistentes[a.id];
                  if (r && typeof r === "object" && r.tentativas) {
                    loadedTent[a.id] = r.tentativas;
                  }
                });
                if (Object.keys(loadedTent).length > 0) setTentativas(loadedTent);
              }
            }}
          >
            ✏️ Editar Resultados
          </button>
          <span style={{ color:"#555", fontSize:11 }}>
            Clique para carregar os dados nos campos e editar
          </span>
        </div>
      )}
      {Object.keys(marcas).length > 0 && atletasNaProva.some(a => resExistentes[a.id] != null) && (
        <div style={{ background:"#141a10", border:"1px solid #4a8a2a", borderRadius:8, padding:"8px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#7acc44" }}>
          ✏️ <strong>Modo edição</strong> — altere os valores e clique em "Salvar e Publicar"
          <button
            style={{ ...s.linkBtn, marginLeft:"auto", color:"#888", fontSize:11 }}
            onClick={async () => { setMarcas({}); setTentativas({}); }}
          >Cancelar edição</button>
        </div>
      )}

      {isRevezamento ? (
        /* ════════════════════════════════════════════════════════════════
           INTERFACE REVEZAMENTO — resultado por equipe
        ════════════════════════════════════════════════════════════════ */
        equipesRevezNaProva.length === 0 ? (
          <div style={s.emptyState}>
            <span>Nenhuma equipe inscrita neste revezamento.</span>
            <button style={{ ...s.btnGhost, marginTop: 10 }} onClick={() => setTela("inscricao-revezamento")}>Ir para Inscrição de Revezamento</button>
          </div>
        ) : (() => {
          const metros = parseInt((provaSel?.nome || provaSel?.id || "").match(/(\d+)m/)?.[1]) || 0;
          const temRaia = metros <= 400;
          const temVento = metros <= 200;
          const nPernas = nPernasRevezamento(provaSel);

          const getExistEq = (eqId, campo, fallback = "") => {
            const r = resExistentes[eqId];
            if (r == null) return fallback;
            if (typeof r === "object") return r[campo] ?? fallback;
            return campo === "marca" ? r : fallback;
          };

          const getMerged = (eqId) => {
            const existObj = typeof resExistentes[eqId] === "object" ? resExistentes[eqId] :
                             resExistentes[eqId] != null ? { marca: resExistentes[eqId] } : {};
            const editado = marcas[eqId] || {};
            return { ...existObj, ...editado };
          };

          const autoFormat = (raw) => {
            const digits = raw.replace(/\D/g, "");
            if (!digits) return "";
            return digits;
          };

          const handleSalvarRevez = async () => {
            const entradas = [];
            equipesRevezNaProva.forEach(eq => {
              const d = getMerged(eq.equipeId);
              const statusVal = d.status || "";
              const extras = {
                atletasIds: eq.atletasIds,
                nomeEquipe: eq.nomeEquipe,
              };
              if (d.serie) extras.serie = parseInt(d.serie) || 1;

              if (statusVal) {
                extras.status = statusVal;
                if (statusVal === "DQ" && d.dqRegra) extras.dqRegra = d.dqRegra;
                entradas.push({ atletaId: eq.equipeId, marca: statusVal,
                  tentData: { raia: d.raia ? parseInt(d.raia) : undefined },
                  statusData: extras });
              } else {
                const marcaRaw = d.marca != null ? String(d.marca) : "";
                const marcaMs = parseTempoPista(marcaRaw);
                if (marcaMs !== null && marcaMs > 0) {
                  entradas.push({ atletaId: eq.equipeId, marca: marcaMs,
                    tentData: { raia: d.raia ? parseInt(d.raia) : undefined, vento: d.vento || undefined, ...extras } });
                }
              }
            });
            const nSalvos = entradas.length;
            if (nSalvos > 0) {
              await atualizarResultadosEmLote(eid, filtroProva, catId, filtroSexo, faseEfetiva, entradas);
            }
            if (usuarioLogado && registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Digitou resultados (revezamento)", `${provaSel?.nome || filtroProva} — ${nSalvos} equipe(s)`, usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "resultados" });
            setSalvo(true); setTimeout(() => setSalvo(false), 3000);
            setMarcas({});
          };

          const temResExistRevez = equipesRevezNaProva.some(eq => resExistentes[eq.equipeId] != null);

          return (
            <>
              {Object.keys(marcas).length > 0 && temResExistRevez && (
                <div style={{ background:"#141a10", border:"1px solid #4a8a2a", borderRadius:8, padding:"8px 16px", marginBottom:12, display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#7acc44" }}>
                  ✏️ <strong>Modo edição</strong> — altere os valores e clique em "Salvar e Publicar"
                  <button style={{ ...s.linkBtn, marginLeft:"auto", color:"#888", fontSize:11 }}
                    onClick={() => setMarcas({})}>Cancelar edição</button>
                </div>
              )}
              <table style={{ ...s.table, fontSize: 13 }}>
                <thead><tr>
                  <th style={s.th}>#</th>
                  <th style={{ ...s.th, textAlign: "left" }}>EQUIPE</th>
                  <th style={{ ...s.th, textAlign: "left" }}>ATLETAS ({nPernas})</th>
                  <th style={s.th}>SÉRIE</th>
                  {temRaia && <th style={s.th}>RAIA</th>}
                  {temVento && <th style={s.th}>VENTO</th>}
                  <th style={s.th}>TEMPO (ms)</th>
                  <th style={s.th}>STATUS</th>
                  <th style={s.th}>ATUAL</th>
                </tr></thead>
                <tbody>
                  {equipesRevezNaProva.map((eq, j) => {
                    const m = marcas[eq.equipeId] || {};
                    const existMarca = getExistEq(eq.equipeId, "marca", null);
                    const existStatus = getExistEq(eq.equipeId, "status", "");
                    const serChave = `${filtroProva}_${catId}_${filtroSexo}`;
                    const serSalva = eventoAtual.seriacao?.[serChave];
                    const serInfo = (() => {
                      if (!serSalva?.series) return { serie: "", raia: "" };
                      for (const ser of serSalva.series) {
                        const found = ser.atletas.find(a => (a.id || a.equipeId) === eq.equipeId);
                        if (found) return { serie: String(ser.numero), raia: found.raia ? String(found.raia) : "" };
                      }
                      return { serie: "", raia: "" };
                    })();
                    const existRaia = getExistEq(eq.equipeId, "raia", "") || serInfo.raia;
                    const existSerie = getExistEq(eq.equipeId, "serie", "") || serInfo.serie;
                    const existVento = getExistEq(eq.equipeId, "vento", "");
                    const valMarca = m.marca !== undefined ? m.marca : (existMarca != null && !["DNS","DNF","DQ"].includes(existStatus) ? String(existMarca) : "");
                    const valStatus = m.status !== undefined ? m.status : existStatus;
                    const valRaia = m.raia !== undefined ? m.raia : existRaia;
                    const valSerie = m.serie !== undefined ? m.serie : existSerie;
                    const valVento = m.vento !== undefined ? m.vento : existVento;
                    const isStatusAtivo = !!valStatus;
                    return (
                      <tr key={eq.equipeId} style={{ ...s.tr, ...(j < 3 ? { background: "#111210" } : {}) }}>
                        <Td><strong style={{ color: "#aaa" }}>{j + 1}</strong></Td>
                        <Td><strong style={{ color: "#1976D2" }}>{eq.nomeEquipe}{eq.sigla ? ` (${eq.sigla})` : ""}</strong></Td>
                        <Td>{eq.atletas.length > 0
                          ? <span style={{ fontSize: 11, color: "#aaa" }}>{eq.atletas.map(a => a.nome).join(" · ")}</span>
                          : <span style={{ fontSize: 11, color: "#ff6b6b" }}>⚠ Sem atletas</span>
                        }</Td>
                        <Td><input type="number" min="1" max="20" style={{ ...s.input, width: 45, textAlign: "center", fontSize: 12, padding: "6px 4px" }}
                          value={valSerie} onChange={e => setMarcas(prev => ({ ...prev, [eq.equipeId]: { ...prev[eq.equipeId], serie: e.target.value } }))} /></Td>
                        {temRaia && (
                          <Td><input type="number" min="1" max="10" style={{ ...s.input, width: 45, textAlign: "center", fontSize: 12, padding: "6px 4px" }}
                            value={valRaia} onChange={e => setMarcas(prev => ({ ...prev, [eq.equipeId]: { ...prev[eq.equipeId], raia: e.target.value } }))} /></Td>
                        )}
                        {temVento && (
                          <Td><input type="text" placeholder="±0.0" style={{ ...s.input, width: 55, textAlign: "center", fontSize: 11, padding: "6px 4px" }}
                            value={valVento} onChange={e => setMarcas(prev => ({ ...prev, [eq.equipeId]: { ...prev[eq.equipeId], vento: e.target.value } }))} /></Td>
                        )}
                        <Td>
                          <input
                            type="text" inputMode="numeric" placeholder="ex: 42350"
                            style={{ ...s.input, width: 100, textAlign: "center", fontWeight: 700, fontSize: 14, padding: "8px 6px",
                              color: isStatusAtivo ? "#666" : "#7cfc7c",
                              background: isStatusAtivo ? "#111" : "#0D0E12" }}
                            disabled={isStatusAtivo}
                            value={valMarca ? autoFormatTempo(String(valMarca)) : ""}
                            onChange={e => {
                              const v = autoFormat(e.target.value);
                              setMarcas(prev => ({ ...prev, [eq.equipeId]: { ...prev[eq.equipeId], marca: v, status: "" } }));
                            }}
                          />
                        </Td>
                        <Td>
                          <select style={{ ...s.input, width: 65, fontSize: 11, padding: "6px 4px" }}
                            value={valStatus} onChange={e => setMarcas(prev => ({ ...prev, [eq.equipeId]: { ...prev[eq.equipeId], status: e.target.value } }))}>
                            <option value="">—</option>
                            <option value="DNS">DNS</option>
                            <option value="DNF">DNF</option>
                            <option value="DQ">DQ</option>
                          </select>
                        </Td>
                        <Td>
                          {existMarca != null && !["DNS","DNF","DQ"].includes(existStatus) ? (
                            <span style={{ color: "#888", fontSize: 12 }}>{formatarTempo(existMarca, 2)}</span>
                          ) : existStatus ? (
                            <span style={{ color: "#ff8844", fontSize: 12 }}>{existStatus}</span>
                          ) : <span style={{ color: "#333" }}>—</span>}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
                <button style={s.btnPrimary} onClick={handleSalvarRevez}>
                  💾 Salvar e Publicar Revezamento
                </button>
                {Object.keys(marcas).length > 0 && (
                  <button style={s.btnGhost} onClick={() => setMarcas({})}>Limpar edições</button>
                )}
                {equipesRevezNaProva.some(eq => resExistentes[eq.equipeId] != null) && (
                  <button style={{ ...s.btnGhost, color: "#ff6b6b", borderColor: "#5a1a1a" }}
                    onClick={async () => {
                      if (!await confirmar(`⚠️ Limpar TODOS os resultados deste revezamento?\n\n${provaSel?.nome } — ${catId} — ${filtroSexo === "M" ? "Masc." : "Fem."}\n\nEsta ação é IRREVERSÍVEL.`)) return;
                      _limparTodos(eid, filtroProva, catId, filtroSexo);
                      setMarcas({});
                    }}>🗑 Limpar Todos</button>
                )}
                {salvo && <span style={{ color: "#7cfc7c", fontWeight: 700, fontSize: 14 }}>✅ Salvo!</span>}
              </div>
            </>
          );
        })()

      ) : atletasNaProva.length === 0 ? (
        <div style={s.emptyState}><span>Nenhum atleta inscrito nesta combinação.</span></div>
      ) : isAltura ? (

        /* ════════════════════════════════════════════════════════════════
           INTERFACE ALTURA / VARA
        ════════════════════════════════════════════════════════════════ */
        <>
          {/* ── Linha de configuração das barras ───────────────────── */}
          <div style={{ background:"#0D0E12", border:"1px solid #1E2130", borderRadius:8, padding:"14px 18px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
              <span style={{ color:"#1976D2", fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:800, letterSpacing:1, whiteSpace:"nowrap" }}>
                📏 ALTURAS
              </span>
              {(Array.isArray(alturas) ? alturas : [""]).map((h, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:3 }}>
                  <input
                    style={sty.alturaInput}
                    type="text" inputMode="decimal" placeholder="1,20"
                    value={exibirMarcaInput(h)}
                    onChange={(e) => { const arr=[...alturas]; arr[i]=normalizarMarca(e.target.value); setAlturas(arr); }}
                  />
                  {alturas.length > 1 && (
                    <button style={sty.removeBtn} onClick={() => setAlturas((Array.isArray(alturas) ? alturas : []).filter((_,j)=>j!==i))}>×</button>
                  )}
                </div>
              ))}
              <button style={sty.addBtn} onClick={() => setAlturas([...alturas,""])}>+ barra</button>
              <span style={{ fontSize:11, color:"#444" }}>metros (ex: 1,20)</span>
            </div>
          </div>

          {/* ── Tabela: linhas = atletas, colunas = alturas ─────────── */}
          {temDesempateAltura && (
            <div style={{ background:"#1a1a0a", border:"1px solid #4a4a2a", borderRadius:8, padding:"6px 14px", marginBottom:10, fontSize:11, color:"#1976D2" }}>
              ⚖️ <strong>RT 26.9 — Regra de Desempate Aplicada</strong>
              <span style={{ color:"#888", marginLeft:8 }}>1º menor nº de saltos na última altura transposta (SU) · 2º menor nº total de falhas na prova (FP)</span>
            </div>
          )}
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", background:"#0D0E12", minWidth:"100%" }}>
              <thead>
                {/* linha 1: altura em cada coluna */}
                <tr>
                  <th style={{ ...sty.th, textAlign:"left", minWidth:180 }}>ATLETA</th>
                  {(Array.isArray(alturas) ? alturas : []).filter(h=>h!=="").map(h => (
                    <th key={h} colSpan={3} style={{ ...sty.th, background:"#111", color:"#1976D2", minWidth:90, textAlign:"center", borderBottom:"2px solid #1976D2" }}>
                      {parseFloat(h).toFixed(2).replace(".",",")}m
                    </th>
                  ))}
                  <th style={{ ...sty.th, minWidth:36, color:"#ff8888", fontSize:9 }} title="Saltos na Última altura transposta (RT 26.9.1)">SU</th>
                  <th style={{ ...sty.th, minWidth:36, color:"#ff8888", fontSize:9 }} title="Falhas na Prova inteira (RT 26.9.2)">FP</th>
                  <th style={{ ...sty.th, minWidth:80, color:"#4cff4c" }}>MELHOR</th>
                  <th style={{ ...sty.th, minWidth:44, color:"#88aaff" }}>POS.</th>
                  <th style={{ ...sty.th, minWidth:62 }}>Status</th>
                </tr>
                {/* linha 2: numeração das tentativas */}
                <tr>
                  <th style={{ ...sty.th, background:"#0a0b0e" }}></th>
                  {(Array.isArray(alturas) ? alturas : []).filter(h=>h!=="").flatMap(h =>
                    [1,2,3].map(n => (
                      <th key={`${h}-${n}`} style={{ ...sty.th, background:"#0a0b0e", color:"#555", fontSize:9, minWidth:30 }}>{n}ª</th>
                    ))
                  )}
                  <th style={{ ...sty.th, background:"#0a0b0e" }}></th>
                  <th style={{ ...sty.th, background:"#0a0b0e" }}></th>
                  <th style={{ ...sty.th, background:"#0a0b0e" }}></th>
                  <th style={{ ...sty.th, background:"#0a0b0e" }}></th>
                  <th style={{ ...sty.th, background:"#0a0b0e" }}></th>
                </tr>
              </thead>
              <tbody>
                {atletasNaProva.map((a, ai) => {
                  const melhor = melhorAltura(a.id);
                  return (
                    <tr key={a.id} style={{ background: ai%2===0 ? "#0e0f14" : "#111318" }}>
                      {/* nome */}
                      <td style={{ padding:"8px 12px", borderBottom:"1px solid #1E2130", whiteSpace:"nowrap" }}>
                        <div style={{ fontWeight:700, color:"#fff", fontSize:13 }}>{a.nome}</div>
                        <div style={{ color:"#555", fontSize:11 }}>{getExibicaoEquipe(a, equipes)||"—"}</div>
                      </td>
                      {/* tentativas por altura */}
                      {(Array.isArray(alturas) ? alturas : []).filter(h=>h!=="").flatMap((h, hIdx) => {
                        const rawTent = tentativas[a.id]?.[h];
                        const tent    = Array.isArray(rawTent) ? rawTent : ["","",""];
                        const passou  = tent.includes("O");
                        const elim    = eliminado(a.id, h);
                        return [0,1,2].map(ti => {
                          const estado = getEstadoCelula(a.id, hIdx, ti);
                          const bloqueado = estado === "eliminado" || estado === "aguardando" || estado === "bloq_sucesso";
                          return (
                          <td key={`${h}-${ti}`} style={{
                            padding:"6px 4px", textAlign:"center",
                            borderBottom:"1px solid #1E2130",
                            borderLeft: ti===0 ? "2px solid #1E2130" : "1px solid #0d0e12",
                            background: estado === "eliminado" ? "#1a0808"
                                      : estado === "bloq_sucesso" ? "#081a08"
                                      : passou && tent[ti]==="O" ? "#0a1a0a"
                                      : elim  && tent[ti]==="X" ? "#1a0a0a"
                                      : estado === "aguardando" ? "#0a0a0e"
                                      : "transparent",
                            opacity: bloqueado && tent[ti] === "" ? 0.35 : 1,
                          }}>
                            {bloqueado && tent[ti] === "" ? (
                              estado === "eliminado" ? (
                                <div style={{ fontSize:9, color:"#ff4444", fontWeight:700 }}>
                                  {ti === 1 ? "✕" : ""}
                                </div>
                              ) : (
                                <div style={{ fontSize:9, color:"#444" }}>—</div>
                              )
                            ) : (
                            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                              {["O","X","-"].map(op => (
                                <button
                                  key={op}
                                  title={op==="O"?"Transpôs":op==="X"?"Falhou":"Passou"}
                                  disabled={bloqueado}
                                  onClick={() => setTentativa(a.id, h, ti, tent[ti]===op ? "" : op)}
                                  style={{
                                    width:28, height:24, border:"none", borderRadius:4,
                                    cursor: bloqueado ? "not-allowed" : "pointer",
                                    fontSize:11, fontWeight:800,
                                    background: tent[ti]===op
                                      ? (op==="O"?"#1a4a1a":op==="X"?"#4a1a1a":"#2a2a2a")
                                      : "#1a1c22",
                                    color: tent[ti]===op
                                      ? (op==="O"?"#4cff4c":op==="X"?"#ff5555":"#aaa")
                                      : "#333",
                                    outline: tent[ti]===op
                                      ? `1px solid ${op==="O"?"#2a8a2a":op==="X"?"#cc2222":"#555"}`
                                      : "none",
                                  }}
                                >{op}</button>
                              ))}
                            </div>
                            )}
                          </td>
                          );
                        });
                      })}
                      {/* SU - saltos na última altura */}
                      <td style={{ padding:"6px 4px", textAlign:"center", borderBottom:"1px solid #1E2130", borderLeft:"2px solid #1E2130" }}>
                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color: melhor ? "#ff8888" : "#333" }}>
                          {melhor != null ? calcSU(a.id) : "—"}
                        </span>
                      </td>
                      {/* FP - falhas na prova */}
                      <td style={{ padding:"6px 4px", textAlign:"center", borderBottom:"1px solid #1E2130" }}>
                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color: melhor ? "#ff8888" : "#333" }}>
                          {melhor != null ? calcFP(a.id) : "—"}
                        </span>
                      </td>
                      {/* melhor */}
                      <td style={{ padding:"8px 10px", textAlign:"center", borderBottom:"1px solid #1E2130", borderLeft:"2px solid #1E2130" }}>
                        <span style={{
                          fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:800,
                          color: melhor ? "#4cff4c" : "#444",
                        }}>
                          {melhor!=null ? `${melhor.toFixed(2).replace(".",",")}m` : "—"}
                        </span>
                      </td>
                      {/* POS */}
                      <td style={{ padding:"6px 4px", textAlign:"center", borderBottom:"1px solid #1E2130" }}>
                        {(() => {
                          const pos = calcPosAltura(a.id, atletasNaProva);
                          return (
                            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:800, color: pos ? "#88aaff" : "#444" }}>
                              {pos != null ? `${pos}º` : "—"}
                            </span>
                          );
                        })()}
                      </td>
                      {/* Status */}
                      <td style={{ padding:"4px", textAlign:"center", borderBottom:"1px solid #1E2130" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:2 }}>
                          <select style={{ fontSize:10, padding:"2px", background:"#12141c", color: (marcas[a.id]?.status || getExist(a,"status","")) ? "#ff8844" : "#666", border:"1px solid #2a2a3a", borderRadius:4, width:56 }}
                            value={marcas[a.id]?.status ?? getExist(a,"status","")}
                            onChange={e => {
                              const sv = e.target.value;
                              setMarcas(prev => ({ ...prev, [a.id]: { ...(prev[a.id]||{}), status: sv, ...(sv !== "DQ" ? { dqRegra: "" } : {}) } }));
                            }}>
                            <option value="">—</option>
                            <option value="DNS">DNS</option>
                            <option value="NM">NM</option>
                            <option value="DQ">DQ</option>
                          </select>
                          {(marcas[a.id]?.status ?? getExist(a,"status","")) === "DQ" && (
                            <input type="text" placeholder="Regra" style={{ width:44, fontSize:9, padding:"2px 3px", background:"#1a0a0a", color:"#ff4444", border:"1px solid #4a2a2a", borderRadius:3 }}
                              value={marcas[a.id]?.dqRegra ?? getExist(a,"dqRegra","")}
                              onChange={e => setMarcas(prev => ({ ...prev, [a.id]: { ...(prev[a.id]||{}), dqRegra: e.target.value } }))} />
                          )}
                        </div>
                      </td>
                      <td style={{ padding:"4px 8px", textAlign:"center", borderBottom:"1px solid #1E2130" }}>
                        {resExistentes[a.id] != null && (
                          <button
                            title="Limpar resultado deste atleta"
                            onClick={() => pedirLimparAtleta(a.id)}
                            style={{ background:"transparent", border:"1px solid #7a2a2a", borderRadius:6, cursor:"pointer", color:"#cc4444", fontSize:13, padding:"3px 8px" }}
                          >🗑️</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop:16, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <button style={s.btnPrimary} onClick={handleSalvarAltura}>
              💾 Salvar e Publicar
            </button>
            <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
              {atletasNaProva.some(a => resExistentes[a.id] != null) && (
                <button
                  style={{ ...s.btnGhost, borderColor:"#7a2a2a", color:"#ff8888", fontSize:12 }}
                  onClick={pedirLimparTodos}
                  title="Limpar todos os resultados desta prova"
                >🗑️ Limpar Todos</button>
              )}
            </div>
            {salvo && <span style={s.savedBadge} className="saved-pulse">✅ Resultados publicados!</span>}
          </div>

          {/* ── Painel Pontuação Acumulada da Combinada (Altura/Vara) ── */}
          {provaSel && provaSel.origemCombinada && (() => {
            const combinadaId = provaSel.combinadaId;
            const todasCompDaCombinada = CombinedEventEngine.gerarProvasComponentes(combinadaId, eid);
            const atletaIds = [...new Set(
              inscDoEvento.filter(i => i.combinadaId === combinadaId).map(i => i.atletaId)
            )];
            if (atletaIds.length === 0 || todasCompDaCombinada.length === 0) return null;

            const rows = atletaIds.map(aId => {
              const atl = atletas.find(a => a.id === aId);
              let total = 0;
              let provasRealizadas = 0;
              const porProva = todasCompDaCombinada.map(pc => {
                const chaveR = `${eid}_${pc.id}_${catId}_${filtroSexo}`;
                const res = resultados[chaveR]?.[aId];
                const marca = res ? (typeof res === "object" ? res.marca : res) : null;
                const ptsManuais = res ? (typeof res === "object" ? res.pontosTabela : null) : null;
                const marcaNum = marca != null ? parseFloat(String(marca).replace(",", ".")) : null;
                const ptsAuto = (marcaNum != null && !isNaN(marcaNum)) ? CombinedScoringEngine.calcularPontosProva(pc.provaOriginalSufixo, marcaNum, filtroSexo, combinadaId, (eventoAtual.cronometragemProvas || {})[pc.id]) : 0;
                const pts = ptsManuais != null ? Number(ptsManuais) : ptsAuto;
                const statusAtl2 = res ? (typeof res === "object" ? res.status : null) : null;
                if ((marca != null && marca !== "") || statusAtl2) provasRealizadas++;
                total += Number(pts) || 0;
                return { marca, pts: Number(pts) || 0, nome: pc.nome, ordem: pc.ordem, unidade: pc.unidade };
              });
              return { atletaId: aId, nome: atl?.nome || "—", porProva, total, provasRealizadas };
            }).sort((a, b) => b.total - a.total);

            const totalComp = todasCompDaCombinada.length;
            const provasComResultado = todasCompDaCombinada.filter(pc => {
              const chaveR = `${eid}_${pc.id}_${catId}_${filtroSexo}`;
              return resultados[chaveR] && Object.keys(resultados[chaveR]).length > 0;
            }).length;
            const todasCompletas = provasComResultado >= totalComp;
            const comp = getComposicaoCombinada(combinadaId);

            return (
              <div style={{
                marginTop: 24, background: "#0a0f1a", border: "1px solid #2a3050",
                borderRadius: 10, padding: 20, overflowX: "auto"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 20 }}>🏅</span>
                  <h3 style={{ color: "#1976D2", margin: 0, fontSize: 16 }}>
                    Classificação {comp?.nome || "Combinada"} — {todasCompletas ? "FINAL" : "PARCIAL"}
                  </h3>
                  <span style={{
                    fontSize: 11, padding: "2px 10px", borderRadius: 4, fontWeight: 600,
                    background: todasCompletas ? "#0a2a0a" : "#2a2a0a",
                    color: todasCompletas ? "#7cfc7c" : "#1976D2",
                  }}>
                    {provasComResultado || 0}/{totalComp} provas
                  </span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #2a3050" }}>
                      <th style={{ padding: "6px 8px", textAlign: "left", color: "#888" }}>#</th>
                      <th style={{ padding: "6px 8px", textAlign: "left", color: "#888" }}>Atleta</th>
                      {todasCompDaCombinada.map(pc => (
                        <th key={pc.id} style={{
                          padding: "6px 4px", textAlign: "center", color: pc.id === provaSel.id ? "#1976D2" : "#888",
                          fontSize: 10, fontWeight: pc.id === provaSel.id ? 700 : 400,
                          background: pc.id === provaSel.id ? "#0a1a2a" : "transparent",
                          borderRadius: 4, minWidth: 55
                        }}>
                          {abreviarProva(pc.nome)}
                        </th>
                      ))}
                      <th style={{ padding: "6px 8px", textAlign: "center", color: "#1976D2", fontWeight: 700 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={r.atletaId} style={{
                        borderBottom: "1px solid #1a1d2a",
                        background: idx < 3 ? "#0a0f0a" : "transparent"
                      }}>
                        <td style={{ padding: "6px 8px", color: idx < 3 ? "#1976D2" : "#888", fontWeight: 700 }}>
                          {idx + 1}º
                        </td>
                        <td style={{ padding: "6px 8px", color: "#fff", fontWeight: 500, whiteSpace: "nowrap" }}>
                          {r.nome}
                        </td>
                        {r.porProva.map((pp, ppIdx) => (
                          <td key={ppIdx} style={{
                            padding: "4px 4px", textAlign: "center",
                            color: pp.marca != null && pp.marca !== "" ? "#ccc" : "#333",
                            fontSize: 11,
                            background: todasCompDaCombinada[ppIdx]?.id === provaSel.id ? "#0a1a2a" : "transparent",
                          }}>
                            {pp.marca != null && pp.marca !== "" ? (
                              <div>
                                <div style={{ color: "#aaa", fontSize: 10 }}>{formatarMarca(pp.marca, pp.unidade, 2)}</div>
                                <div style={{ color: "#1976D2", fontWeight: 600 }}>{pp.pts} pts</div>
                              </div>
                            ) : "—"}
                          </td>
                        ))}
                        <td style={{
                          padding: "6px 8px", textAlign: "center",
                          color: "#1976D2", fontWeight: 700, fontSize: 14
                        }}>
                          {r.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!todasCompletas && (
                  <div style={{ marginTop: 10, fontSize: 11, color: "#666", textAlign: "center" }}>
                    ⚠️ Classificação parcial — faltam resultados em algumas provas. A tabela de pontuação será aplicada posteriormente.
                  </div>
                )}
              </div>
            );
          })()}
        </>

      ) : (
        /* ════════════════════════════════════════════════════════════════
           INTERFACE PADRÃO (corrida / lançamento / demais saltos)
        ════════════════════════════════════════════════════════════════ */
        (() => {
          const metros = (() => {
            const m = provaSel?.id?.match(/[_x]?(\d+)m/);
            return m ? parseInt(m[1]) : 0;
          })();
          const isCorrida = provaSel?.unidade === "s";
          const isCampo   = !isCorrida && !isAltura;
          const temRaia   = isCorrida && metros <= 400;
          const temVento  = isCorrida && metros <= 200;

          const setDado = (a, campo, val) =>
            setMarcas(prev => ({
              ...prev,
              [a.id]: { ...(prev[a.id] || {}), [campo]: val },
            }));

          const parseTent = (v) => {
            if (v === "" || v == null) return null;
            if (String(v).trim().toUpperCase() === "X") return -Infinity;
            const n = parseFloat(v);
            return isNaN(n) ? null : n;
          };

          const melhorDe = (vals) => {
            const ns = vals.map(parseTent).filter(n => n !== null && n !== -Infinity);
            return ns.length > 0 ? Math.max(...ns) : null;
          };

          const sequenciaDesc = (tentativas) => {
            return tentativas
              .map(parseTent)
              .filter(n => n !== null && n !== -Infinity)
              .sort((a, b) => b - a);
          };

          const comparaSeq = (seqA, seqB) => {
            const len = Math.max(seqA.length, seqB.length);
            for (let i = 0; i < len; i++) {
              const va = seqA[i] ?? -Infinity;
              const vb = seqB[i] ?? -Infinity;
              if (va > vb) return -1;
              if (va < vb) return  1;
            }
            return 0;
          };

          // Helper: status do atleta (DNS, NM, DQ, DNF, ou "")
          const getStatusAtleta = (a) => {
            const d = { ...(resExistentes[a.id] || {}), ...(marcas[a.id] || {}) };
            return d.status || "";
          };
          // DNS/DQ/DNF = atleta não competiu ou foi desqualificado → campos bloqueados
          // NM = atleta competiu mas falhou (todos X) → campos NÃO bloqueados (NM é derivado)
          const isStatusInativo = (a) => {
            const st = getStatusAtleta(a);
            return st === "DNS" || st === "DQ" || st === "DNF";
          };

          // Auto-detecta NM: T1-T3 todos X (sem marca válida nenhuma)
          const isAutoNM = (a) => {
            const d = { ...(resExistentes[a.id] || {}), ...(marcas[a.id] || {}) };
            const t1 = String(d.t1 || "").trim().toUpperCase();
            const t2 = String(d.t2 || "").trim().toUpperCase();
            const t3 = String(d.t3 || "").trim().toUpperCase();
            return t1 === "X" && t2 === "X" && t3 === "X";
          };

          const tentsParcial = (a) => {
            const d = { ...(marcas[a.id] || {}), ...(resExistentes[a.id] || {}) };
            return [d.t1, d.t2, d.t3];
          };

          const tentsFinal = (a) => {
            const d = { ...(marcas[a.id] || {}), ...(resExistentes[a.id] || {}) };
            return [d.t1, d.t2, d.t3, d.t4, d.t5, d.t6];
          };

          const calcCP = (atletaId, todosAtletas) => {
            // Atletas inativos (DNS/DQ/DNF) ou auto-NM (T1-T3 todos X) não têm CP
            if (isStatusInativo({ id: atletaId })) return null;
            if (isAutoNM({ id: atletaId })) return null;
            const seqMinha = sequenciaDesc(tentsParcial({ id: atletaId }));
            if (seqMinha.length === 0) return null;
            const rank = todosAtletas.filter(a => {
              if (a.id === atletaId) return false;
              if (isStatusInativo(a) || isAutoNM(a)) return false;
              const seqDele = sequenciaDesc(tentsParcial(a));
              if (seqDele.length === 0) return false;
              return comparaSeq(seqDele, seqMinha) < 0;
            }).length + 1;
            return rank;
          };

          const melhorFinal = (a) => {
            if (isStatusInativo(a) || isAutoNM(a)) return null;
            const d = { ...(resExistentes[a.id] || {}), ...(marcas[a.id] || {}) };
            return melhorDe([d.t1,d.t2,d.t3,d.t4,d.t5,d.t6]);
          };

          const calcPosicaoFinal = (atletaId, todosAtletas) => {
            if (isStatusInativo({ id: atletaId }) || isAutoNM({ id: atletaId })) return null;
            const seqMinha = sequenciaDesc(tentsFinal({ id: atletaId }));
            if (seqMinha.length === 0) return null;
            const rank = todosAtletas.filter(a => {
              if (a.id === atletaId) return false;
              if (isStatusInativo(a) || isAutoNM(a)) return false;
              const seqDele = sequenciaDesc(tentsFinal(a));
              if (seqDele.length === 0) return false;
              return comparaSeq(seqDele, seqMinha) < 0;
            }).length + 1;
            return rank;
          };

          const inputStyle = { ...s.inputMarca, width: 72 };
          const inputSmall = { ...s.inputMarca, width: 52 };
          const tdStyle    = { padding: "4px 3px", textAlign: "center", verticalAlign: "middle" };

          return (
            <>
              {/* ── CAMPO: T1-T3-CP-T4-T6-Melhor-Pos ─────────────── */}
              {isCampo ? (
                <>
                  <div style={s.digitarDica}>
                    Insira cada tentativa em metros (ex: 7.85) · X = nulo/falta · deixe em branco se não realizada
                  </div>
                  <div style={{ background:"#0a0b10", border:"1px solid #1a1d2a", borderRadius:8, padding:"8px 14px", marginBottom:10, fontSize:11, color:"#888", lineHeight:1.7 }}>
                    <strong style={{ color:"#1976D2" }}>Regras Técnicas:</strong>{" "}
                    T1-T3: ordem por sorteio (RT 25.5) · T4-T6: ordem inversa da CP (RT 25.6.1) · Empate na CP: mantém ordem do sorteio (RT 25.6.2) · Desempate: 2ª melhor marca, 3ª, etc (RT 25.22)
                  </div>
                  {(() => {
                    const atletasComCP = atletasNaProva.map((a, idxOriginal) => {
                      const cp = calcCP(a.id, atletasNaProva);
                      const mf = melhorFinal(a);
                      const pos = calcPosicaoFinal(a.id, atletasNaProva);
                      return { a, cp, mf, pos, idxOriginal };
                    });

                    const temDesempate = (() => {
                      const posFinais = atletasComCP.filter(x => x.pos != null).map(x => x.pos);
                      const melhorFinalMap = {};
                      atletasComCP.forEach(x => {
                        if (x.mf != null) {
                          const key = x.mf.toFixed(4);
                          melhorFinalMap[key] = (melhorFinalMap[key] || 0) + 1;
                        }
                      });
                      return Object.values(melhorFinalMap).some(c => c > 1) &&
                             posFinais.length > 0 && new Set(posFinais).size === posFinais.length;
                    })();

                    // Atletas com status inativo ou auto-NM contam como "completos" para não bloquear a inversão
                    const todosComT3 = atletasComCP.every(({ a }) => {
                      if (isStatusInativo(a) || isAutoNM(a)) return true;
                      const d = { ...(marcas[a.id] || {}), ...(resExistentes[a.id] || {}) };
                      const v3 = d.t3;
                      return v3 != null && String(v3).trim() !== "";
                    });

                    // Atletas inativos (DNS/DQ/DNF) e auto-NM ficam separados
                    const isForaDeProva = (a) => isStatusInativo(a) || isAutoNM(a);
                    const atletasAtivos = atletasComCP.filter(({ a }) => !isForaDeProva(a));
                    const atletasInativos = atletasComCP.filter(({ a }) => isForaDeProva(a));
                    const classificados = atletasAtivos.filter(x => x.cp !== null && x.cp <= 8);
                    const eliminados = atletasAtivos.filter(x => x.cp === null || x.cp > 8);

                    const todosTop8ComT6 = todosComT3 && classificados.length > 0 && classificados.every(({ a }) => {
                      const d = { ...(marcas[a.id] || {}), ...(resExistentes[a.id] || {}) };
                      const v6 = d.t6;
                      return v6 != null && String(v6).trim() !== "";
                    });

                    const estadoProva = !todosComT3 ? 1 : todosTop8ComT6 ? 3 : 2;

                    let ordemExibicao;
                    let separadorIdx = -1;

                    if (estadoProva === 1) {
                      // Ordem original, inativos e NM auto no final
                      const ativos = atletasComCP.filter(({ a }) => !isForaDeProva(a));
                      ordemExibicao = [...ativos, ...atletasInativos];
                    } else if (estadoProva === 2) {
                      const top8Inverso = [...classificados].sort((a2, b2) => {
                        const cpA = a2.cp ?? 999;
                        const cpB = b2.cp ?? 999;
                        if (cpA !== cpB) return cpB - cpA;
                        return a2.idxOriginal - b2.idxOriginal;
                      });
                      const elimOrdenados = [...eliminados].sort((a2, b2) => {
                        const cpA = a2.cp ?? 999;
                        const cpB = b2.cp ?? 999;
                        if (cpA !== cpB) return cpA - cpB;
                        return a2.idxOriginal - b2.idxOriginal;
                      });
                      separadorIdx = top8Inverso.length;
                      // Inativos (DNS/NM/DQ) vão no final, após eliminados
                      ordemExibicao = [...top8Inverso, ...elimOrdenados, ...atletasInativos];
                    } else {
                      const ativos = [...atletasComCP].filter(({ a }) => !isForaDeProva(a)).sort((a2, b2) => {
                        const mfA = a2.mf, mfB = b2.mf;
                        if (mfA == null && mfB == null) return 0;
                        if (mfA == null) return 1;
                        if (mfB == null) return -1;
                        if (mfB !== mfA) return mfB - mfA;
                        const seqA = sequenciaDesc(tentsFinal(a2.a));
                        const seqB = sequenciaDesc(tentsFinal(b2.a));
                        return comparaSeq(seqA, seqB);
                      });
                      ordemExibicao = [...ativos, ...atletasInativos];
                    }

                    return (
                      <>
                        {estadoProva === 2 && (
                          <div style={{ background:"#0a0a1a", border:"1px solid #2a3a6a", borderRadius:8, padding:"6px 14px", marginBottom:10, fontSize:11, color:"#88aaff" }}>
                            🔄 <strong>RT 25.6.1 — Ordem Inversa Aplicada</strong>
                            <span style={{ color:"#888", marginLeft:8 }}>Top 8 em ordem inversa do CP (pior primeiro) · Eliminados abaixo</span>
                          </div>
                        )}
                        {estadoProva === 3 && (
                          <div style={{ background:"#0a2a0a", border:"1px solid #2a6a2a", borderRadius:8, padding:"6px 14px", marginBottom:10, fontSize:11, color:"#7cfc7c" }}>
                            🏆 <strong>Classificação Final</strong>
                            <span style={{ color:"#888", marginLeft:8 }}>Todas as tentativas completas — ordenado pela melhor marca com desempate RT 25.22</span>
                          </div>
                        )}
                        {temDesempate && (
                          <div style={{ background:"#1a1a0a", border:"1px solid #4a4a2a", borderRadius:8, padding:"6px 14px", marginBottom:10, fontSize:11, color:"#1976D2" }}>
                            ⚖️ <strong>RT 25.22 — Regra de Desempate Aplicada</strong>
                            <span style={{ color:"#888", marginLeft:8 }}>Atletas com mesma melhor marca desempatados pela 2ª melhor, 3ª melhor, etc.</span>
                          </div>
                        )}
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ ...s.table, minWidth: 900 }}>
                            <thead>
                              <tr>
                                <Th>#</Th>
                                <Th>Nº</Th>
                                <Th style={{ minWidth:30, fontSize:9, color:"#666" }} title="Ordem do sorteio original">Sort.</Th>
                                <Th>Atleta</Th><Th>Clube/Equipe</Th>
                                <Th style={{ background:"#1a2a1a", color:"#7cfc7c" }}>T1</Th>
                                <Th style={{ background:"#1a2a1a", color:"#7cfc7c" }}>T2</Th>
                                <Th style={{ background:"#1a2a1a", color:"#7cfc7c" }}>T3</Th>
                                <Th style={{ background:"#0a1a2a", color:"#1976D2", minWidth:52 }}>CP</Th>
                                <Th style={{ background:"#2a1a0a", color:"#ffaa44" }}>T4</Th>
                                <Th style={{ background:"#2a1a0a", color:"#ffaa44" }}>T5</Th>
                                <Th style={{ background:"#2a1a0a", color:"#ffaa44" }}>T6</Th>
                                <Th style={{ background:"#1a1a2a", color:"#88aaff", minWidth:68 }}>MELHOR</Th>
                                <Th style={{ background:"#1a1a2a", color:"#88aaff", minWidth:44 }}>POS.</Th>
                                <Th style={{ minWidth:62 }}>Status</Th>
                                <Th></Th>
                              </tr>
                            </thead>
                            <tbody>
                              {ordemExibicao.map(({ a, cp, mf, pos, idxOriginal }, i) => {
                                const tGet = (t) => marcas[a.id]?.[t] ?? getExist(a, t, "");
                                const top8 = cp !== null && cp <= 8;
                                const atletaInativo = isStatusInativo(a);
                                const atletaNM = isAutoNM(a);
                                const isEliminado = (estadoProva >= 2 && !top8) || atletaInativo || atletaNM;
                                const showSeparador = estadoProva === 2 && i === separadorIdx && eliminados.length > 0;
                                // Separador para inativos (DNS/NM/DQ)
                                const idxInativos = ordemExibicao.length - atletasInativos.length;
                                const showSeparadorInativos = atletasInativos.length > 0 && i === idxInativos && !atletasInativos.some(x => x === ordemExibicao[0]);

                                return (
                                  <React.Fragment key={a.id}>
                                    {showSeparador && (
                                      <tr>
                                        <td colSpan={14} style={{
                                          padding: "6px 12px", background: "#1a0a0a",
                                          borderTop: "2px solid #4a2a2a", borderBottom: "1px solid #2a1a1a",
                                          fontSize: 11, color: "#ff6b6b", fontWeight: 700, textAlign: "center"
                                        }}>
                                          ❌ Eliminados — não avançam para T4-T6
                                        </td>
                                      </tr>
                                    )}
                                    {showSeparadorInativos && (
                                      <tr>
                                        <td colSpan={14} style={{
                                          padding: "6px 12px", background: "#0a0a10",
                                          borderTop: "2px solid #2a2a4a", borderBottom: "1px solid #1a1a2a",
                                          fontSize: 11, color: "#888", fontWeight: 700, textAlign: "center"
                                        }}>
                                          🚫 DNS / NM / DQ
                                        </td>
                                      </tr>
                                    )}
                                    <tr style={{
                                      ...s.tr,
                                      opacity: isEliminado ? 0.5 : 1,
                                      background: atletaInativo ? "#08080a" : atletaNM ? "#0a0808" : isEliminado ? "#0a0808" : undefined,
                                    }}>
                                    <Td>
                                      {estadoProva === 3 ? (
                                        <strong style={{ color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#888", fontSize: 14 }}>
                                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i+1) + "º"}
                                        </strong>
                                      ) : (i+1)}
                                    </Td>
                                    <Td><strong style={{ color:"#aaa", fontSize:12 }}>{(numeracaoPeito?.[eventoAtual?.id]||{})[a.id]||""}</strong></Td>
                                    <Td><span style={{ fontSize:10, color:"#555" }}>{idxOriginal+1}</span></Td>
                                    <Td><strong style={{ color:"#fff" }}>{a.nome}</strong></Td>
                                    <Td>{getExibicaoEquipe(a, equipes)||"—"}</Td>
                                    {["t1","t2","t3"].map(t => {
                                      const isSaltoHoriz = provaSel?.nome?.includes("Distância") || provaSel?.nome?.includes("Triplo");
                                      return (
                                      <td key={t} style={{ ...tdStyle, background: atletaInativo ? "#0a0a0e" : "#0d1a0d" }}>
                                        <input
                                          style={{ ...inputStyle, width:64, background: atletaInativo ? "#0a0a0e" : "#0a150a", color: atletaInativo ? "#555" : "#7cfc7c", cursor: atletaInativo ? "not-allowed" : "text" }}
                                          placeholder="—"
                                          disabled={atletaInativo}
                                          value={atletaInativo ? "" : exibirMarcaInput(tGet(t))}
                                          onChange={e => setDado(a, t, normalizarMarca(e.target.value))}
                                        />
                                        {isSaltoHoriz && !atletaInativo && (
                                          <input
                                            style={{ ...inputStyle, width:54, background:"#0a1020", color:"#6ab4ff", fontSize:9, marginTop:2, textAlign:"center", border:"1px solid #1a2a4a" }}
                                            placeholder="💨 m/s"
                                            value={(marcas[a.id]?.[t+"v"] ?? getExist(a, t+"v", ""))}
                                            onChange={e => setDado(a, t+"v", e.target.value)}
                                          />
                                        )}
                                      </td>
                                      );
                                    })}
                                    {/* CP automático */}
                                    <td style={{ ...tdStyle, background:"#0a120a" }}>
                                      {atletaInativo ? (
                                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, color:"#ff8844" }}>
                                          {getStatusAtleta(a)}
                                        </span>
                                      ) : atletaNM ? (
                                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, color:"#ff8844" }}>
                                          NM
                                        </span>
                                      ) : (
                                        <>
                                          <span style={{
                                            fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800,
                                            fontSize:15, color: top8 ? "#1976D2" : "#666",
                                          }}>
                                            {cp !== null ? `${cp}º` : "—"}
                                          </span>
                                          {top8 && <div style={{ fontSize:9, color:"#888" }}>→ fin.</div>}
                                        </>
                                      )}
                                    </td>
                                    {/* T4-T6 */}
                                    {["t4","t5","t6"].map(t => {
                                      const isSaltoHoriz = provaSel?.nome?.includes("Distância") || provaSel?.nome?.includes("Triplo");
                                      const podeEditar = top8 && !atletaInativo;
                                      return (
                                      <td key={t} style={{ ...tdStyle, background: podeEditar ? "#1a0f00" : "#111", opacity: podeEditar ? 1 : 0.4 }}>
                                        <input
                                          style={{ ...inputStyle, width:64,
                                            background: podeEditar ? "#150d00" : "#0e0e0e",
                                            color: podeEditar ? "#ffaa44" : "#555",
                                            cursor: podeEditar ? "text" : "not-allowed",
                                          }}
                                          placeholder="—"
                                          disabled={!podeEditar}
                                          value={atletaInativo ? "" : exibirMarcaInput(tGet(t))}
                                          onChange={e => setDado(a, t, normalizarMarca(e.target.value))}
                                        />
                                        {isSaltoHoriz && podeEditar && (
                                          <input
                                            style={{ ...inputStyle, width:54, background:"#0a1020", color:"#6ab4ff", fontSize:9, marginTop:2, textAlign:"center", border:"1px solid #1a2a4a" }}
                                            placeholder="💨 m/s"
                                            value={(marcas[a.id]?.[t+"v"] ?? getExist(a, t+"v", ""))}
                                            onChange={e => setDado(a, t+"v", e.target.value)}
                                          />
                                        )}
                                      </td>
                                      );
                                    })}
                                    {/* Melhor e Posição automáticos */}
                                    <td style={{ ...tdStyle }}>
                                      <span style={{
                                        fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800,
                                        fontSize:15, color: mf !== null ? "#88aaff" : "#444",
                                      }}>
                                        {mf !== null ? `${mf.toFixed(2).replace(".",",")}m` : "—"}
                                      </span>
                                    </td>
                                    <td style={{ ...tdStyle }}>
                                      <span style={{
                                        fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800,
                                        fontSize:15, color: pos !== null ? "#88aaff" : "#444",
                                      }}>
                                        {pos !== null ? `${pos}º` : "—"}
                                      </span>
                                    </td>
                                    <td style={{ ...tdStyle }}>
                                      <div style={{ display:"flex", alignItems:"center", gap:2 }}>
                                        <select style={{ fontSize:10, padding:"2px", background:"#12141c", color: (marcas[a.id]?.status || getExist(a,"status","")) ? "#ff8844" : "#666", border:"1px solid #2a2a3a", borderRadius:4, width:56 }}
                                          value={marcas[a.id]?.status ?? getExist(a,"status","")}
                                          onChange={e => {
                                            setDado(a, "status", e.target.value);
                                            if (e.target.value !== "DQ") setDado(a, "dqRegra", "");
                                          }}>
                                          <option value="">—</option>
                                          <option value="DNS">DNS</option>
                                          <option value="NM">NM</option>
                                          <option value="DQ">DQ</option>
                                        </select>
                                        {(marcas[a.id]?.status ?? getExist(a,"status","")) === "DQ" && (
                                          <input type="text" placeholder="Regra" style={{ width:44, fontSize:9, padding:"2px 3px", background:"#1a0a0a", color:"#ff4444", border:"1px solid #4a2a2a", borderRadius:3 }}
                                            value={marcas[a.id]?.dqRegra ?? getExist(a,"dqRegra","")}
                                            onChange={e => setDado(a, "dqRegra", e.target.value)} />
                                        )}
                                      </div>
                                    </td>
                                    <td style={{ ...tdStyle }}>
                                      {resExistentes[a.id] != null && (
                                        <button title="Limpar" onClick={() => pedirLimparAtleta(a.id)}
                                          style={{ background:"transparent", border:"1px solid #7a2a2a", borderRadius:5, cursor:"pointer", color:"#cc4444", fontSize:13, padding:"2px 6px" }}>🗑️</button>
                                      )}
                                    </td>
                                  </tr>
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
              /* ── CORRIDA: Raia · Vento · Marca ───────────────────── */
                <>
                  <div style={s.digitarDica}>
                    {`Digite apenas os números — o sistema formata automaticamente (ex: 10850 → 10,850 · 12345 → 1.23,450)${temRaia ? " · Raia: nº" : ""}${temVento ? " · Vento: ex +1,2" : ""}`}
                  </div>
                  {provaSel?.especBarreiras && (
                    <div style={{ background:"#0a0b14", border:"1px solid #1a1d3a", borderRadius:8, padding:"8px 14px", marginBottom:10, fontSize:11, color:"#aab", display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
                      <span style={{ fontWeight:700, color:"#1976D2" }}>🏃‍♂️ Barreiras:</span>
                      <span>Altura: <strong style={{ color:"#fff" }}>{provaSel.especBarreiras.altura}</strong></span>
                      <span>Saída→1ª: <strong style={{ color:"#fff" }}>{provaSel.especBarreiras.saida1a}</strong></span>
                      <span>Entre barr.: <strong style={{ color:"#fff" }}>{provaSel.especBarreiras.entre}</strong></span>
                      <span>Última→Cheg.: <strong style={{ color:"#fff" }}>{provaSel.especBarreiras.ultimaCheg}</strong></span>
                    </div>
                  )}
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <Th>#</Th><Th>Nº</Th><Th>Atleta</Th><Th>Clube/Equipe</Th>
                        {_serDigitar?.series?.length > 0 && <Th>Série</Th>}
                        {temRaia  && <Th>Raia</Th>}
                        {temVento && <Th>Vento</Th>}
                        <Th>Digitado</Th><Th>Tempo</Th><Th>Status</Th><Th>Atual</Th><Th></Th>
                      </tr>
                    </thead>
                    <tbody>
                      {atletasNaProva.map((a, i) => {
                        const _si = _getSerInfo(a.id);
                        const _prevSi = i > 0 ? _getSerInfo(atletasNaProva[i-1].id) : { serie: "" };
                        const showSerieHeader = _serDigitar?.series?.length > 1 && _si.serie && _si.serie !== _prevSi.serie;
                        const rawDigits = marcas[a.id]?.marca ?? "";
                        const existMs   = getExist(a,"marca","");
                        const existStatus = getExist(a,"status","");
                        const existDqRegra = getExist(a,"dqRegra","");
                        const statusVal = marcas[a.id]?.status ?? existStatus;
                        const dqRegraVal = marcas[a.id]?.dqRegra ?? existDqRegra;
                        const inputVal = rawDigits !== "" ? rawDigits
                          : existMs !== "" && !existStatus ? String(Math.round(parseFloat(existMs))) : "";
                        const raiaVal  = marcas[a.id]?.raia  ?? (getExist(a,"raia","") || _getSerInfo(a.id).raia);
                        const ventoVal = marcas[a.id]?.vento ?? getExist(a,"vento","");
                        const previewFormatado = inputVal && !statusVal ? autoFormatTempo(inputVal) : "";
                        const _nCols = 10 + (temRaia?1:0) + (temVento?1:0) + (_serDigitar?.series?.length>0?1:0);
                        return (
                          <React.Fragment key={a.id}>
                          {showSerieHeader && (
                            <tr><td colSpan={_nCols} style={{ padding:"8px 12px", background:"#0a1a2a", borderBottom:"2px solid #1a3a5a", color:"#88aaff", fontWeight:700, fontSize:12 }}>
                              Série {_si.serie}
                            </td></tr>
                          )}
                          <tr style={s.tr}>
                            <Td>{i+1}</Td>
                            <Td><strong style={{ color:"#aaa", fontSize:12 }}>{(numeracaoPeito?.[eventoAtual?.id]||{})[a.id]||""}</strong></Td>
                            <Td><strong style={{ color:"#fff" }}>{a.nome}</strong></Td>
                            <Td>{getExibicaoEquipe(a, equipes)||"—"}</Td>
                            {_serDigitar?.series?.length > 0 && <Td><span style={{ color:"#88aaff", fontWeight:700 }}>{_si.serie||"—"}</span></Td>}
                            {temRaia && (
                              <Td><input type="number" min="1" max="10" style={inputSmall} placeholder="4"
                                value={raiaVal} onChange={e => setDado(a,"raia",e.target.value)} /></Td>
                            )}
                            {temVento && (
                              <Td><input type="text" inputMode="decimal" style={inputSmall} placeholder="+1,2"
                                value={exibirMarcaInput(ventoVal)} onChange={e => setDado(a,"vento",normalizarMarca(e.target.value))} /></Td>
                            )}
                            <Td>
                              <input type="text" inputMode="numeric" style={{ ...inputStyle, opacity: statusVal ? 0.3 : 1 }} placeholder="10850"
                                disabled={!!statusVal}
                                value={statusVal ? "" : inputVal}
                                onChange={e => {
                                  const v = e.target.value.replace(/\D/g, "");
                                  setDado(a, "marca", v);
                                }} />
                            </Td>
                            <Td>
                              {previewFormatado ? (
                                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:"#7cfc7c" }}>
                                  {previewFormatado}
                                </span>
                              ) : statusVal ? (
                                <span style={{ fontWeight:700, fontSize:13, color: statusVal === "DQ" ? "#ff4444" : "#ff8844" }}>
                                  {statusVal}{statusVal === "DQ" && dqRegraVal ? ` R.${dqRegraVal}` : ""}
                                </span>
                              ) : <span style={{ color:"#555" }}>—</span>}
                            </Td>
                            <Td>
                              <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                                <select style={{ ...inputSmall, width:62, fontSize:10, padding:"2px", background:"#12141c", color: statusVal ? "#ff8844" : "#666", border:"1px solid #2a2a3a", borderRadius:4 }}
                                  value={statusVal || ""}
                                  onChange={e => {
                                    const sv = e.target.value;
                                    setDado(a, "status", sv);
                                    if (sv) setDado(a, "marca", "");
                                    if (sv !== "DQ") setDado(a, "dqRegra", "");
                                  }}>
                                  <option value="">—</option>
                                  <option value="DNS">DNS</option>
                                  <option value="DNF">DNF</option>
                                  <option value="DQ">DQ</option>
                                </select>
                                {statusVal === "DQ" && (
                                  <input type="text" placeholder="Regra" style={{ ...inputSmall, width:52, fontSize:10 }}
                                    value={dqRegraVal}
                                    onChange={e => setDado(a, "dqRegra", e.target.value)} />
                                )}
                              </div>
                            </Td>
                            <Td>
                              {getExist(a,"marca") || existStatus ? (
                                <span style={s.marca}>{existStatus ? (
                                  <span style={{ color: existStatus === "DQ" ? "#ff4444" : "#ff8844" }}>
                                    {existStatus}{existStatus === "DQ" && existDqRegra ? ` R.${existDqRegra}` : ""}
                                  </span>
                                ) : formatarMarca(getExist(a,"marca"), provaSel?.unidade, 2)}</span>
                              ) : <span style={{ color:"#555" }}>—</span>}
                            </Td>
                            <Td>
                              {resExistentes[a.id] != null && (
                                <button title="Limpar" onClick={() => pedirLimparAtleta(a.id)}
                                  style={{ background:"transparent", border:"none", cursor:"pointer", color:"#cc4444", fontSize:15, padding:"2px 6px" }}>🗑️</button>
                              )}
                            </Td>
                          </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
              <div style={{ marginTop:16, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                <button style={s.btnPrimary} onClick={handleSalvar}>
                  💾 Salvar e Publicar
                </button>
                <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                  {atletasNaProva.some(a => resExistentes[a.id] != null) && (
                    <button style={{ ...s.btnGhost, borderColor:"#7a2a2a", color:"#ff8888", fontSize:12 }}
                      onClick={pedirLimparTodos} title="Limpar todos os resultados desta prova">
                      🗑️ Limpar Todos
                    </button>
                  )}
                </div>
                {salvo && <span style={s.savedBadge} className="saved-pulse">✅ Resultados publicados!</span>}
              </div>

              {/* ── Painel Pontuação Acumulada da Combinada ── */}
              {provaSel && provaSel.origemCombinada && (() => {
                const combinadaId = provaSel.combinadaId;
                const todasCompDaCombinada = CombinedEventEngine.gerarProvasComponentes(combinadaId, eid);
                const atletaIds = [...new Set(
                  inscDoEvento.filter(i => i.combinadaId === combinadaId).map(i => i.atletaId)
                )];
                if (atletaIds.length === 0 || todasCompDaCombinada.length === 0) return null;

                const rows = atletaIds.map(aId => {
                  const atl = atletas.find(a => a.id === aId);
                  let total = 0;
                  let provasRealizadas = 0;
                  const porProva = todasCompDaCombinada.map(pc => {
                    const chaveR = `${eid}_${pc.id}_${catId}_${filtroSexo}`;
                    const res = resultados[chaveR]?.[aId];
                    const marca = res ? (typeof res === "object" ? res.marca : res) : null;
                    const ptsManuais = res ? (typeof res === "object" ? res.pontosTabela : null) : null;
                    const marcaNum = marca != null ? parseFloat(String(marca).replace(",", ".")) : null;
                    const ptsAuto = (marcaNum != null && !isNaN(marcaNum)) ? CombinedScoringEngine.calcularPontosProva(pc.provaOriginalSufixo, marcaNum, filtroSexo, combinadaId, (eventoAtual.cronometragemProvas || {})[pc.id]) : 0;
                    const pts = ptsManuais != null ? Number(ptsManuais) : ptsAuto;
                    const statusAtl2 = res ? (typeof res === "object" ? res.status : null) : null;
                    if ((marca != null && marca !== "") || statusAtl2) provasRealizadas++;
                    total += Number(pts) || 0;
                    return { marca, pts: Number(pts) || 0, nome: pc.nome, ordem: pc.ordem, unidade: pc.unidade };
                  });
                  return { atletaId: aId, nome: atl?.nome || "—", porProva, total, provasRealizadas };
                }).sort((a, b) => b.total - a.total);

                const totalComp = todasCompDaCombinada.length;
                const provasComResultado = todasCompDaCombinada.filter(pc => {
                  const chaveR = `${eid}_${pc.id}_${catId}_${filtroSexo}`;
                  return resultados[chaveR] && Object.keys(resultados[chaveR]).length > 0;
                }).length;
                const todasCompletas = provasComResultado >= totalComp;
                const comp = getComposicaoCombinada(combinadaId);

                return (
                  <div style={{
                    marginTop: 24, background: "#0a0f1a", border: "1px solid #2a3050",
                    borderRadius: 10, padding: 20, overflowX: "auto"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 20 }}>🏅</span>
                      <h3 style={{ color: "#1976D2", margin: 0, fontSize: 16 }}>
                        Classificação {comp?.nome || "Combinada"} — {todasCompletas ? "FINAL" : "PARCIAL"}
                      </h3>
                      <span style={{
                        fontSize: 11, padding: "2px 10px", borderRadius: 4, fontWeight: 600,
                        background: todasCompletas ? "#0a2a0a" : "#2a2a0a",
                        color: todasCompletas ? "#7cfc7c" : "#1976D2",
                      }}>
                        {provasComResultado || 0}/{totalComp} provas
                      </span>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #2a3050" }}>
                          <th style={{ padding: "6px 8px", textAlign: "left", color: "#888" }}>#</th>
                          <th style={{ padding: "6px 8px", textAlign: "left", color: "#888" }}>Atleta</th>
                          {todasCompDaCombinada.map(pc => (
                            <th key={pc.id} style={{
                              padding: "6px 4px", textAlign: "center", color: pc.id === provaSel.id ? "#1976D2" : "#888",
                              fontSize: 10, fontWeight: pc.id === provaSel.id ? 700 : 400,
                              background: pc.id === provaSel.id ? "#0a1a2a" : "transparent",
                              borderRadius: 4, minWidth: 55
                            }}>
                              {abreviarProva(pc.nome)}
                            </th>
                          ))}
                          <th style={{ padding: "6px 8px", textAlign: "center", color: "#1976D2", fontWeight: 700 }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, idx) => (
                          <tr key={r.atletaId} style={{
                            borderBottom: "1px solid #1a1d2a",
                            background: idx < 3 ? "#0a0f0a" : "transparent"
                          }}>
                            <td style={{ padding: "6px 8px", color: idx < 3 ? "#1976D2" : "#888", fontWeight: 700 }}>
                              {idx + 1}º
                            </td>
                            <td style={{ padding: "6px 8px", color: "#fff", fontWeight: 500, whiteSpace: "nowrap" }}>
                              {r.nome}
                            </td>
                            {r.porProva.map((pp, ppIdx) => (
                              <td key={ppIdx} style={{
                                padding: "4px 4px", textAlign: "center",
                                color: pp.marca != null && pp.marca !== "" ? "#ccc" : "#333",
                                fontSize: 11,
                                background: todasCompDaCombinada[ppIdx]?.id === provaSel.id ? "#0a1a2a" : "transparent",
                              }}>
                                {pp.marca != null && pp.marca !== "" ? (
                                  <div>
                                    <div style={{ color: "#aaa", fontSize: 10 }}>{formatarMarca(pp.marca, pp.unidade, 2)}</div>
                                    <div style={{ color: "#1976D2", fontWeight: 600 }}>{pp.pts} pts</div>
                                  </div>
                                ) : "—"}
                              </td>
                            ))}
                            <td style={{
                              padding: "6px 8px", textAlign: "center",
                              color: "#1976D2", fontWeight: 700, fontSize: 14
                            }}>
                              {r.total}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!todasCompletas && (
                      <div style={{ marginTop: 10, fontSize: 11, color: "#666", textAlign: "center" }}>
                        ⚠️ Classificação parcial — faltam resultados em algumas provas. A tabela de pontuação será aplicada posteriormente.
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          );
        })()
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TelaDigitarResultados — componente principal (orquestrador de filtros)
   ════════════════════════════════════════════════════════════════════════════ */
function TelaDigitarResultados({ inscricoes, atletas, resultados, atualizarResultado, atualizarResultadosEmLote, limparResultado, limparTodosResultados, setTela, eventoAtual, editarEvento, usuarioLogado, registrarAcao, numeracaoPeito, getClubeAtleta, equipes, recordes }) {
  const s = useStylesResponsivos(styles);
  // Guard: apenas admin, organizador ou funcionário com permissão
  const tipoUser = usuarioLogado?.tipo;
  const temAcessoDigitar = tipoUser === "admin" || tipoUser === "organizador" ||
    (tipoUser === "funcionario" && usuarioLogado?.permissoes?.includes("resultados"));

  const [filtroProva, setFiltroProva] = useState("");
  const [filtroCat,   setFiltroCat]   = useState("");
  const [filtroSexo,  setFiltroSexo]  = useState("M");
  const [filtroFase,  setFiltroFase]  = useState("");

  if (!eventoAtual) return (
    <div style={s.page}><div style={s.emptyState}><p>Selecione uma competição primeiro.</p>
      <button style={s.btnPrimary} onClick={() => setTela("home")}>Ver Competições</button></div></div>
  );

  const eid      = eventoAtual.id;
  const todasProvas = todasAsProvas();
  const inscDoEvento = inscricoes.filter(i => i.eventoId === eid);

  // Gerar provas componentes de combinadas
  const provasComponentesArr = [];
  (eventoAtual.provasPrograma || []).forEach(provaId => {
    const provaInfo = todasProvas.find(p => p.id === provaId);
    if (provaInfo && provaInfo.tipo === "combinada") {
      const componentes = CombinedEventEngine.gerarProvasComponentes(provaId, eid);
      provasComponentesArr.push(...componentes);
    }
  });
  const todasProvasComCombinadas = [...todasProvas, ...provasComponentesArr];

  // Categorias que têm inscrições nesta competição (incluindo revezamentos)
  const categoriasComInscricao = CATEGORIAS.filter(c =>
    inscDoEvento.some(i => (i.categoriaOficialId || i.categoriaId) === c.id)
  );

  // Provas com inscrições, filtradas pela categoria selecionada (incluindo revezamentos)
  const provasComInscFiltradas = todasProvasComCombinadas.filter(p =>
    inscDoEvento.some(i => i.provaId === p.id &&
      (!filtroCat || (i.categoriaOficialId || i.categoriaId) === filtroCat)
    )
  );
  const nomesProvasUnicos = [...new Set(provasComInscFiltradas.map(p => p.nome))].sort();

  // Resolver provaIds a partir do nome/label selecionado no filtro
  const provaIdsDaSelecao = filtroProva
    ? todasProvasComCombinadas.filter(p => {
        const label = p.origemCombinada ? `🏅 ${p.nome} (${p.nomeCombinada} ${p.ordem}/${p.totalProvas})` : p.nome;
        return label === filtroProva && p.tipo !== "combinada" && inscDoEvento.some(i => i.provaId === p.id);
      })
    : [];

  // Detectar fases da prova selecionada (usar o primeiro provaId para o seletor de fases)
  const _primeiroProvaId = provaIdsDaSelecao[0]?.id || "";
  const _provaFases = _primeiroProvaId ? getFasesProva(_primeiroProvaId, eventoAtual?.programaHorario || {}) : [];
  const _temFases = _provaFases.length > 1;
  const faseEfetiva = _temFases ? (filtroFase || _provaFases[0] || "") : "";

  if (!temAcessoDigitar) return (
    <div style={s.page}>
      <div style={s.emptyState}>
        <span style={{ fontSize: 48 }}>🚫</span>
        <p style={{ color: "#ff6b6b", fontWeight: 700 }}>Acesso não autorizado</p>
        <p style={{ color: "#666", fontSize: 14 }}>Você não tem permissão para digitar resultados.</p>
        <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>✏️ Digitar Resultados</h1>
          <div style={{ color: "#666", fontSize: 13 }}>{eventoAtual.nome}</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={s.btnGhost} onClick={() => setTela("resultados")}>Ver Publicados</button>
          <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Competição</button>
        </div>
      </div>

      <div style={s.formCard}>
        <div style={s.filtros}>
          <div>
            <label style={s.label}>Prova *</label>
            <select style={s.select} value={filtroProva} onChange={(e) => {
              setFiltroProva(e.target.value); setFiltroCat(""); setFiltroFase("");
            }}>
              <option value="">— Selecione —</option>
              {(() => {
                // Agrupar provas por nome — provasDef tem IDs por categoria (M_adulto_comp, M_sub16_comp, etc.)
                // Mostrar cada nome de prova uma única vez
                const provasFilt = todasProvasComCombinadas.filter(p =>
                  p.tipo !== "combinada" &&
                  inscDoEvento.some(i => i.provaId === p.id)
                );
                const nomesVistos = new Set();
                const provasUnicas = [];
                provasFilt.forEach(p => {
                  const label = p.origemCombinada ? `🏅 ${p.nome} (${p.nomeCombinada} ${p.ordem}/${p.totalProvas})` : p.nome;
                  if (!nomesVistos.has(label)) {
                    nomesVistos.add(label);
                    provasUnicas.push({ label, nome: p.nome, origemCombinada: p.origemCombinada, nomeCombinada: p.nomeCombinada, ordem: p.ordem, totalProvas: p.totalProvas });
                  }
                });
                return provasUnicas.map(p => (
                  <option key={p.label} value={p.label}>{p.label}</option>
                ));
              })()}
            </select>
          </div>
          <div>
            <label style={s.label}>Categoria</label>
            <select style={s.select} value={filtroCat} onChange={(e) => {
              setFiltroCat(e.target.value);
            }}>
              <option value="">— Todas —</option>
              {(() => {
                // Categorias que têm inscrição em provas com o nome selecionado
                const provaIdsSel = filtroProva
                  ? todasProvasComCombinadas.filter(p => {
                      const label = p.origemCombinada ? `🏅 ${p.nome} (${p.nomeCombinada} ${p.ordem}/${p.totalProvas})` : p.nome;
                      return label === filtroProva;
                    }).map(p => p.id)
                  : [];
                const cats = CATEGORIAS.filter(c =>
                  inscDoEvento.some(i =>
                    (i.categoriaOficialId || i.categoriaId) === c.id &&
                    i.sexo === filtroSexo &&
                    (provaIdsSel.length === 0 || provaIdsSel.includes(i.provaId))
                  )
                );
                return cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>);
              })()}
            </select>
          </div>
          <div>
            <label style={s.label}>Sexo *</label>
            <select style={s.select} value={filtroSexo} onChange={(e) => {
              setFiltroSexo(e.target.value);
            }}>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </div>
          {/* Seletor de Fase — aparece quando a prova tem multi-fases no programaHorario */}
          {_temFases && (
            <div>
              <label style={s.label}>Fase *</label>
              <select style={{ ...s.select, borderColor: faseEfetiva === "ELI" ? "#5a3a1a" : faseEfetiva === "SEM" ? "#2a4a6a" : "#2a4a2a",
                color: faseEfetiva === "ELI" ? "#ff8844" : faseEfetiva === "SEM" ? "#88aaff" : "#7cfc7c", fontWeight:700 }}
                value={filtroFase || _provaFases[0] || ""}
                onChange={(e) => { setFiltroFase(e.target.value); }}>
                {_provaFases.map(f => <option key={f} value={f}>{FASE_NOME[f] || f}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {filtroProva && (() => {
        // Cada provaId no provasDef embute a categoria (ex: M_adulto_comp, M_sub16_comp).
        // Montar pares (provaId, catId) com inscrições no sexo selecionado.
        let pares = provaIdsDaSelecao.flatMap(p => {
          // Encontrar categorias com inscrição neste provaId + sexo
          const cats = [...new Set(
            inscDoEvento
              .filter(i => i.provaId === p.id && i.sexo === filtroSexo)
              .map(i => i.categoriaOficialId || i.categoriaId)
          )];
          return cats.map(catId => ({ provaId: p.id, catId, catOrdem: CATEGORIAS.findIndex(c => c.id === catId) }));
        });
        // Filtrar por categoria se selecionada
        if (filtroCat) pares = pares.filter(p => p.catId === filtroCat);
        // Ordenar por categoria (ordem do CATEGORIAS)
        pares.sort((a, b) => a.catOrdem - b.catOrdem);
        // Deduplicar por catId (pode haver múltiplos provaIds para mesma categoria em combinadas)
        const vistos = new Set();
        pares = pares.filter(p => { if (vistos.has(p.catId)) return false; vistos.add(p.catId); return true; });

        if (pares.length === 0) return <div style={s.emptyState}><span>Nenhum atleta inscrito nesta prova.</span></div>;
        return pares.map(par => (
          <BlocoDigitarCategoria
            key={`${par.provaId}_${par.catId}_${filtroSexo}`}
            catId={par.catId}
            filtroProva={par.provaId}
            filtroSexo={filtroSexo}
            filtroFase={filtroFase}
            eid={eid}
            eventoAtual={eventoAtual}
            inscricoes={inscricoes}
            atletas={atletas}
            resultados={resultados}
            equipes={equipes}
            atualizarResultado={atualizarResultado}
            atualizarResultadosEmLote={atualizarResultadosEmLote}
            limparResultado={limparResultado}
            limparTodosResultados={limparTodosResultados}
            editarEvento={editarEvento}
            numeracaoPeito={numeracaoPeito}
            getClubeAtleta={getClubeAtleta}
            recordes={recordes}
            usuarioLogado={usuarioLogado}
            registrarAcao={registrarAcao}
            setTela={setTela}
            todasProvasComCombinadas={todasProvasComCombinadas}
            inscDoEvento={inscDoEvento}
          />
        ));
      })()}
    </div>
  );
}


// ─── TELA: CONFIGURAR PONTUAÇÃO POR EQUIPES ─────────────────────────────────

export default TelaDigitarResultados;
