import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { todasAsProvas, getComposicaoCombinada, nPernasRevezamento } from "../../shared/athletics/provasDef";
import { CATEGORIAS } from "../../shared/constants/categorias";
import { NomeProvaComImplemento, abreviarProva, formatarMarca, normalizarMarca, exibirMarcaInput, formatarTempo, autoFormatTempo, aplicarMascaraTempo, getMascaraTempo, parseTempoPista, msParaDigitos, resolverAtleta } from "../../shared/formatters/utils";
import { CombinedEventEngine } from "../../shared/engines/combinedEventEngine";
import { CombinedScoringEngine, temDuasCronometragens } from "../../shared/engines/combinedScoringEngine";
import { getFasesModo, buscarSeriacao, resKey, FASE_NOME, resolverCronometragem } from "../../shared/constants/fases";
import { Th, Td } from "../ui/TableHelpers";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { parsearLif } from "../../shared/engines/lynxImportEngine";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";
import { useMarchaJuizes } from "../../hooks/useMarchaJuizes";
import MarchaJuizesPanel from "./MarchaJuizesPanel";

// Badge de chamada (Conf./DNS) ao lado do nome do atleta
function ChamadaBadge({ atletaId, provaId, catId, sexo, getPresencaProva, t }) {
  if (!getPresencaProva) return null;
  const st = getPresencaProva(provaId, catId, sexo)[atletaId];
  if (!st || (st !== "confirmado" && st !== "dns")) return null;
  const cor = st === "confirmado" ? t.success : t.danger;
  return <span style={{ marginLeft:4, fontSize:9, padding:"1px 5px", borderRadius:3, fontWeight:700, background:cor+"18", color:cor, border:`1px solid ${cor}44` }}>{st === "confirmado" ? "Conf." : "DNS"}</span>;
}

function getStyles(t) {
  return {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: t.textPrimary, marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: t.textPrimary, marginBottom: 20, letterSpacing: 1 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  btnPrimary: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: t.accent, border: `2px solid ${t.accentBorder}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
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
  radioLabelActive: { background: t.bgHover, border: `1px solid ${t.accentBorder}`, color: t.accent },
  sumuCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  btnIconSm: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textMuted, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: t.bgCardAlt, border: `1px solid ${t.danger}44`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  infoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: t.accent, marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: `1px solid ${t.border}`, fontSize: 14, color: t.textSecondary, display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: t.accent, fontWeight: 700 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: `linear-gradient(180deg, ${t.bgCardAlt} 0%, transparent 100%)`, borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: t.accent, color: t.textPrimary, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, color: t.textPrimary, lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: t.textDimmed },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: t.textMuted, flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? `${t.danger}15` : status === "hoje_pre" ? t.accentBg : status === "futuro" ? `${t.success}15` : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textDisabled,
    border: `1px solid ${status === "ao_vivo" ? `${t.danger}44` : status === "hoje_pre" ? t.accentBorder : status === "futuro" ? `${t.success}44` : t.border}`,
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
  provaBtnSel: { background: t.bgHover, borderColor: t.accentBorder, color: t.accent },
  savedBadge: { background: `${t.success}15`, border: `1px solid ${t.success}44`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 },
  digitarHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  inputMarca: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", color: t.accent, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, maxWidth: 120, width: "100%", outline: "none" },
  digitarDica: { color: t.textDimmed, fontSize: 12, padding: "8px 20px" },
};
}

// Item 8: exibe sigla da equipe quando disponível, com fallback para nome/clube
const getExibicaoEquipe = (atleta, equipes) => {
  if (atleta?._siglaEquipe) return atleta._siglaEquipe;
  const eq = (equipes||[]).find(e => e.id === atleta?.equipeId);
  if (eq) return (eq.sigla?.trim() || eq.nome || atleta?.clube || "—");
  return atleta?.clube || "—";
};

// ── estilos locais extras (altura/vara) ─────────────────────────────────────
const getSty = (t) => ({
  alturaBox: {
    background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10,
    padding: "18px 20px", marginBottom: 16,
  },
  alturaRow: {
    display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10,
  },
  alturaInput: {
    background: t.bgHover, border: `1px solid ${t.borderLight}`, color: t.accent,
    borderRadius: 6, padding: "6px 10px", width: 80,
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700,
    textAlign: "center",
  },
  addBtn: {
    background: t.border, border: `1px solid ${t.borderLight}`, color: t.textMuted,
    borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13,
  },
  removeBtn: {
    background: "transparent", border: "none", color: t.danger,
    cursor: "pointer", fontSize: 16, padding: "0 4px",
  },
  atletaCard: {
    background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 8,
    marginBottom: 12, overflow: "hidden",
  },
  atletaCardHead: {
    background: t.bgHover, padding: "10px 16px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: `1px solid ${t.border}`,
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
      ? (val === "O" ? `${t.success}25` : val === "X" ? `${t.danger}25` : t.bgCardAlt)
      : t.bgHover,
    color: active
      ? (val === "O" ? t.success : val === "X" ? t.danger : t.textTertiary)
      : t.textDisabled,
    outline: active ? `2px solid ${val === "O" ? `${t.success}66` : val === "X" ? `${t.danger}66` : t.textDisabled}` : "none",
  }),
  melhorBadge: (val) => ({
    background: val ? `${t.success}20` : t.bgHover,
    color: val ? t.success : t.textDisabled,
    border: `1px solid ${val ? `${t.success}44` : t.borderLight}`,
    borderRadius: 6, padding: "4px 12px",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 15, fontWeight: 800,
  }),
  th: {
    padding: "7px 6px", fontSize: 10, fontWeight: 700,
    fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1,
    textAlign: "center", color: t.textTertiary,
    background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`,
  },
});

/* ════════════════════════════════════════════════════════════════════════════
   CondicoesProvaPanel — painel de condições (horário/umidade/temp) com estado
   local para evitar re-render a cada keystroke. Salva no blur.
   ════════════════════════════════════════════════════════════════════════════ */
function CondicoesProvaPanel({ eid, filtroProva, catId, filtroSexo, eventoAtual, editarEvento }) {
  const t = useTema();
  const condKey = `${eid}_${filtroProva}_${catId}_${filtroSexo}`;
  const condAll = eventoAtual.condicoesProva || {};
  const condSalva = condAll[condKey] || {};

  const [local, setLocal] = React.useState(condSalva);
  const prevKeyRef = React.useRef(condKey);

  // Resetar estado local quando a chave muda (troca de prova/cat/sexo)
  React.useEffect(() => {
    if (prevKeyRef.current !== condKey) {
      prevKeyRef.current = condKey;
      setLocal(condAll[condKey] || {});
    }
  }, [condKey, condAll]);

  const salvar = (campo, val) => {
    const novoLocal = { ...local, [campo]: val };
    setLocal(novoLocal);
    const novas = { ...(eventoAtual.condicoesProva || {}), [condKey]: novoLocal };
    editarEvento({ ...eventoAtual, condicoesProva: novas });
  };

  const handleChange = (campo, val) => {
    setLocal(prev => ({ ...prev, [campo]: val }));
  };

  const handleBlur = (campo) => {
    salvar(campo, local[campo] || "");
  };

  const inputSt = { background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 6, padding: "6px 10px", color: t.textPrimary, fontSize: 13, width: 100, textAlign: "center", outline: "none" };
  const lblSt = { color: t.textMuted, fontSize: 11, marginBottom: 2 };
  const grpSt = { display: "flex", flexDirection: "column", alignItems: "center" };

  return (
    <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ color: t.success, fontSize: 12, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>▶ INÍCIO DA PROVA</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={grpSt}>
              <div style={lblSt}>Horário</div>
              <input type="time" style={{ ...inputSt, width: 110 }} value={local.inicioHorario || ""} onChange={e => handleChange("inicioHorario", e.target.value)} onBlur={() => handleBlur("inicioHorario")} />
            </div>
            <div style={grpSt}>
              <div style={lblSt}>Umidade (%)</div>
              <input type="number" min="0" max="100" step="1" placeholder="—" style={inputSt} value={local.inicioUmidade || ""} onChange={e => handleChange("inicioUmidade", e.target.value)} onBlur={() => handleBlur("inicioUmidade")} />
            </div>
            <div style={grpSt}>
              <div style={lblSt}>Temp. (°C)</div>
              <input type="number" step="0.1" placeholder="—" style={inputSt} value={local.inicioTemp || ""} onChange={e => handleChange("inicioTemp", e.target.value)} onBlur={() => handleBlur("inicioTemp")} />
            </div>
          </div>
        </div>
        <div style={{ width: 1, height: 60, background: t.border, alignSelf: "center" }} />
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ color: t.danger, fontSize: 12, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>⏹ TÉRMINO DA PROVA</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={grpSt}>
              <div style={lblSt}>Horário</div>
              <input type="time" style={{ ...inputSt, width: 110 }} value={local.terminoHorario || ""} onChange={e => handleChange("terminoHorario", e.target.value)} onBlur={() => handleBlur("terminoHorario")} />
            </div>
            <div style={grpSt}>
              <div style={lblSt}>Umidade (%)</div>
              <input type="number" min="0" max="100" step="1" placeholder="—" style={inputSt} value={local.terminoUmidade || ""} onChange={e => handleChange("terminoUmidade", e.target.value)} onBlur={() => handleBlur("terminoUmidade")} />
            </div>
            <div style={grpSt}>
              <div style={lblSt}>Temp. (°C)</div>
              <input type="number" step="0.1" placeholder="—" style={inputSt} value={local.terminoTemp || ""} onChange={e => handleChange("terminoTemp", e.target.value)} onBlur={() => handleBlur("terminoTemp")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  todasProvasComCombinadas, inscDoEvento, getPresencaProva,
  marchaHook,
}) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const sty = getSty(t);
  const confirmar = useConfirm();

  // ── estado próprio por categoria ──────────────────────────────────────────
  const [marcas,        setMarcas]        = useState({});
  const [salvo,         setSalvo]         = useState(false);
  const [confirmLimpar, setConfirmLimpar] = useState(null);
  const [alturas,       setAlturas]       = useState([""]);
  const [tentativas,    setTentativas]    = useState({});
  const [cronometragem, setCronometragem] = useState("ELE");
  const [cronoSeries, setCronoSeries] = useState({}); // { [serieNum]: "ELE"|"MAN" }

  // ── derived values ────────────────────────────────────────────────────────
  const provaSel = todasProvasComCombinadas.find((p) => p.id === filtroProva);
  const isRevezamento = provaSel && provaSel.tipo === "revezamento";

  // Para provas individuais: atletas inscritos
  let atletasNaProva = isRevezamento ? [] : inscricoes
    .filter((i) => i.eventoId === eid && i.provaId === filtroProva && (i.categoriaId || i.categoriaOficialId) === catId && i.sexo === filtroSexo && i.tipo !== "revezamento")
    .map((i) => resolverAtleta(i.atletaId, atletas, eventoAtual))
    .filter(Boolean)
    .filter((a, idx, arr) => arr.findIndex(x => x.id === a.id) === idx); // deduplicar por atletaId

  // Para revezamentos: equipes inscritas
  const equipesRevezNaProva = isRevezamento
    ? inscricoes
        .filter(i => i.tipo === "revezamento" && i.eventoId === eid && i.provaId === filtroProva &&
          (i.categoriaId || i.categoriaOficialId) === catId && i.sexo === filtroSexo)
        .map(i => {
          const eq = equipes.find(e => e.id === i.equipeId);
          const nomeEq = eq ? (eq.clube || eq.nome || "—") : (i.equipeId?.startsWith("clube_") ? i.equipeId.substring(6) : "—");
          const atlsObj = (i.atletasIds || []).map(aid => resolverAtleta(aid, atletas, eventoAtual)).filter(Boolean);
          return { equipeId: i.equipeId, nomeEquipe: nomeEq, sigla: eq?.sigla || "", atletasIds: i.atletasIds || [], atletas: atlsObj };
        })
    : [];

  // Detectar fases da prova selecionada
  const _provaFases = getFasesModo(filtroProva, eventoAtual?.configSeriacao || {});
  const _temFases = _provaFases.length > 1;
  const faseEfetiva = _temFases ? (filtroFase || _provaFases[0] || "") : "";

  // ── Filtrar e ordenar atletas pela seriação da fase selecionada (ou fase única) ──
  const _serDigitar = buscarSeriacao(eventoAtual.seriacao, filtroProva, catId, filtroSexo, faseEfetiva);
  // Mapa posicional: índice no atletasNaProva → { serie, raia } (preserva ordem da seriação)
  const _serInfoByIndex = new Map();
  if (_serDigitar?.series && _serDigitar.series.length > 0 && !isRevezamento) {
    const atletasMap = new Map(atletasNaProva.map(a => [a.id, a]));
    const atletasDaSeriacao = [];
    for (const serie of [..._serDigitar.series].sort((a, b) => a.numero - b.numero)) {
      for (const sa of serie.atletas) {
        const aId = sa.id || sa.atletaId;
        const atleta = atletasMap.get(aId) || resolverAtleta(aId, atletas, eventoAtual);
        if (atleta) {
          _serInfoByIndex.set(atletasDaSeriacao.length, { serie: String(serie.numero), raia: sa.raia ? String(sa.raia) : "" });
          atletasDaSeriacao.push(atleta);
        }
      }
    }
    if (atletasDaSeriacao.length > 0) {
      atletasNaProva = atletasDaSeriacao;
    }
  }
  // ── Sorteio de campo (RT 25.5): aplicar ordem sorteada para provas de campo ──
  const _isCampoProva = provaSel && provaSel.unidade !== "s" &&
    !(provaSel.tipo === "salto" && (provaSel.id.includes("altura") || provaSel.id.includes("vara")));
  const _chaveSorteio = `${filtroProva}_${catId}_${filtroSexo}`;
  const _sorteioCampo = eventoAtual?.sorteioCampo?.[_chaveSorteio];

  if (_isCampoProva && _sorteioCampo?.ordem && !_serDigitar?.series?.length) {
    const ordemIds = _sorteioCampo.ordem;
    const atletasMap = new Map(atletasNaProva.map(a => [a.id, a]));
    const ordenados = ordemIds.map(id => atletasMap.get(id)).filter(Boolean);
    const idsNoSorteio = new Set(ordemIds);
    const novos = atletasNaProva.filter(a => !idsNoSorteio.has(a.id));
    atletasNaProva = [...ordenados, ...novos];
  }

  // Helper: buscar série/raia pelo índice na lista (posicional) ou por atletaId (fallback)
  const _getSerInfo = (atletaId, index) => {
    if (_serInfoByIndex.has(index)) return _serInfoByIndex.get(index);
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

  // Helper: status do atleta (DNS, NM, DQ, DNF, ou "")
  const getStatusAtleta = (a) => {
    const d = { ...(resExistentes[a.id] || {}), ...(marcas[a.id] || {}) };
    return d.status || "";
  };
  // DNS/DQ/DNF = atleta não competiu ou foi desqualificado → campos bloqueados
  // NM = atleta competiu mas falhou (todos X) → campos NÃO bloqueados
  const isStatusInativo = (a) => {
    const st = getStatusAtleta(a);
    return st === "DNS" || st === "DQ" || st === "DNF";
  };

  // ── cronometragem: provas de pista avulsas ou componentes de combinada ──────
  const provaPossuiDuasCronoCombinada = provaSel?.origemCombinada && provaSel?.combinadaId && provaSel?.provaOriginalSufixo
    ? temDuasCronometragens(provaSel.combinadaId, provaSel.provaOriginalSufixo) : false;
  const isProvaDePista = provaSel && provaSel.unidade === "s";
  const mostrarToggleCrono = isProvaDePista;

  // ── Regras de pontuação alternativas para provas de combinada ──
  const REGRAS_PONTUACAO_OPCOES = {
    "60mB": [
      { chave: "women|100mH", label: "100m c/ Barreiras (WA)" },
      { chave: "women|60mH", label: "60m c/ Barreiras Indoor (WA)" },
    ],
  };
  const provaTemRegraAlternativa = provaSel?.origemCombinada && provaSel?.provaOriginalSufixo
    && filtroSexo === "F" && REGRAS_PONTUACAO_OPCOES[provaSel.provaOriginalSufixo];
  const regrasPontuacaoEvento = eventoAtual?.regrasPontuacao || {};
  const regraKeyAtual = provaSel?.combinadaId && provaSel?.provaOriginalSufixo
    ? provaSel.combinadaId + "|" + provaSel.provaOriginalSufixo : null;
  const regraAtual = regraKeyAtual ? (regrasPontuacaoEvento[regraKeyAtual] || null) : null;
  const alternarRegraPontuacao = (chave) => {
    const prev = eventoAtual.regrasPontuacao || {};
    editarEvento({ ...eventoAtual, regrasPontuacao: { ...prev, [regraKeyAtual]: chave } });
  };
  const temSeriesParaCrono = _serDigitar?.series?.length > 1;

  // Sincronizar cronometragem ao trocar de prova (lê do eventoAtual)
  React.useEffect(() => {
    const cronoProvas = eventoAtual?.cronometragemProvas || {};
    if (temSeriesParaCrono) {
      const map = {};
      for (const serie of _serDigitar.series) {
        const chS = `${filtroProva}__S${serie.numero}`;
        map[serie.numero] = cronoProvas[chS] || cronoProvas[filtroProva] || "ELE";
      }
      setCronoSeries(map);
      setCronometragem("ELE");
    } else {
      setCronoSeries({});
      setCronometragem(cronoProvas[filtroProva] || "ELE");
    }
  }, [filtroProva, temSeriesParaCrono, _serDigitar?.series?.length, eventoAtual?.cronometragemProvas]);

  // Salvar cronometragem no eventoAtual quando alternar (sem série)
  const alternarCronometragem = (valor) => {
    setCronometragem(valor);
    const prev = eventoAtual.cronometragemProvas || {};
    editarEvento({ ...eventoAtual, cronometragemProvas: { ...prev, [filtroProva]: valor } });
  };

  // Salvar cronometragem por série
  const alternarCronoSerie = (serieNum, valor) => {
    setCronoSeries(prev => ({ ...prev, [serieNum]: valor }));
    const prev = eventoAtual.cronometragemProvas || {};
    const chS = `${filtroProva}__S${serieNum}`;
    editarEvento({ ...eventoAtual, cronometragemProvas: { ...prev, [chS]: valor } });
  };


  // ── helpers para Altura/Vara ────────────────────────────────────────────────
  const OPCOES = ["", "O", "X", "-"];
  const LABELS = { "O": "✓ Transpôs", "X": "✗ Falha", "-": "— Passou", "": "—" };
  const CORES  = { "O": t.success, "X": t.danger, "-": t.textMuted, "": t.textDisabled };

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

  // Auto-NM para altura: atleta tem tentativas mas nenhum "O"
  const isAutoNMAltura = (a) => {
    const tent = tentativas[a.id] || {};
    const alt = Array.isArray(alturas) ? alturas.filter(h => h) : [];
    if (alt.length === 0) return false;
    const temTentativa = alt.some(h => {
      const arr = tent[h] || [];
      return Array.isArray(arr) && arr.some(v => v === "X" || v === "O");
    });
    if (!temTentativa) return false;
    // Tem tentativas mas nenhum O → NM
    return !alt.some(h => (tent[h] || []).includes("O"));
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
    return arr.filter(v => v === "X" || v === "O").length;
  };

  const calcFP = (atletaId) => {
    const tent = tentativas[atletaId] || {};
    const alt = Array.isArray(alturas) ? alturas : [];
    let total = 0;
    alt.forEach(h => {
      if (!h) return;
      const arr = Array.isArray(tent[h]) ? tent[h] : [];
      if (arr.includes("O")) {
        total += arr.filter(v => v === "X").length;
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
      } else {
        // Auto-NM: atleta tem tentativas mas nenhum "O" (não transpôs nenhuma altura)
        const tent = tentativas[a.id] || {};
        const temTentativa = alturasNorm.some(h => {
          const arr = tent[h] || tent[parseFloat(h)?.toFixed(2)] || [];
          return Array.isArray(arr) && arr.some(v => v === "X" || v === "O");
        });
        if (temTentativa) {
          entradas.push({ atletaId: a.id, marca: "NM", tentData: {
            alturas: alturasNorm,
            tentativas: _normTent(tent),
          }, statusData: { status: "NM" } });
        }
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
        background:t.bgHover, border:"1px solid #cc4444",
        borderRadius:12, padding:"28px 32px", maxWidth:360, textAlign:"center",
      }}>
        <div style={{ fontSize:32, marginBottom:12 }}>🗑️</div>
        <div style={{ color: t.textPrimary, fontWeight:700, fontSize:16, marginBottom:8 }}>
          {confirmLimpar === "todos"
            ? "Limpar todos os resultados desta prova?"
            : `Limpar resultado deste atleta?`}
        </div>
        <div style={{ color: t.danger, fontSize:13, marginBottom:4, fontWeight:600 }}>
          ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!
        </div>
        <div style={{ color: t.textMuted, fontSize:12, marginBottom:24 }}>
          {confirmLimpar === "todos"
            ? "Todos os resultados desta categoria serão apagados permanentemente."
            : "O resultado deste atleta será apagado permanentemente."}
        </div>
        <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
          <button
            style={{ ...s.btnGhost, borderColor: t.textDisabled, minWidth:100 }}
            onClick={cancelarLimpar}
          >Cancelar</button>
          <button
            style={{ ...s.btnPrimary, background: t.danger, borderColor: t.danger, minWidth:100 }}
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
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 800, color: t.accent, padding: "12px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, letterSpacing: 1 }}>
        {CATEGORIAS.find(c => c.id === catId)?.nome || catId} — {filtroSexo === "M" ? "Masculino" : "Feminino"}
      </div>

      <div style={s.digitarHeader}>
        <div>
          <strong style={{ color: t.accent }}><NomeProvaComImplemento nome={provaSel?.nome} style={{ color: t.accent }} /></strong>
          {_temFases && faseEfetiva && (
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, marginLeft: 8, fontWeight: 700,
              background: faseEfetiva === "ELI" ? `${t.warning}15` : faseEfetiva === "SEM" ? `${t.accent}15` : `${t.success}15`,
              color: faseEfetiva === "ELI" ? t.warning : faseEfetiva === "SEM" ? t.accent : t.success,
            }}>
              {FASE_NOME[faseEfetiva]}
            </span>
          )}
          {provaSel?.origemCombinada && (
            <span style={{ fontSize: 11, background: t.accentBg, color: t.accent, padding: "2px 8px", borderRadius: 4, marginLeft: 8, fontWeight: 600 }}>
              🏅 {provaSel.nomeCombinada} ({provaSel.ordem}/{provaSel.totalProvas})
            </span>
          )}
          {mostrarToggleCrono && !temSeriesParaCrono && (
            <span style={{ marginLeft: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: t.textMuted }}>⏱ Cronometragem:</span>
              <button
                onClick={() => alternarCronometragem("ELE")}
                style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 4, cursor: "pointer",
                  border: cronometragem === "ELE" ? `1px solid ${t.accentBorder}` : `1px solid ${t.border}`,
                  background: cronometragem === "ELE" ? t.accentBg : "transparent",
                  color: cronometragem === "ELE" ? t.accent : t.textDimmed,
                  fontWeight: cronometragem === "ELE" ? 700 : 400,
                }}>Eletrônica</button>
              <button
                onClick={() => alternarCronometragem("MAN")}
                style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 4, cursor: "pointer",
                  border: cronometragem === "MAN" ? `1px solid ${t.warning}` : `1px solid ${t.border}`,
                  background: cronometragem === "MAN" ? `${t.warning}15` : "transparent",
                  color: cronometragem === "MAN" ? t.warning : t.textDimmed,
                  fontWeight: cronometragem === "MAN" ? 700 : 400,
                }}>Manual</button>
            </span>
          )}
          {isAltura && <span style={{ color: t.textMuted, marginLeft: 12, fontSize: 12 }}>
            Salto em Altura / Vara — configure as barras abaixo
          </span>}
        </div>
        {provaTemRegraAlternativa && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: t.textMuted }}>📐 Regras de pontuação:</span>
            {REGRAS_PONTUACAO_OPCOES[provaSel.provaOriginalSufixo].map(op => {
              const ativa = regraAtual === op.chave || (!regraAtual && op === REGRAS_PONTUACAO_OPCOES[provaSel.provaOriginalSufixo][0]);
              return (
                <button key={op.chave}
                  onClick={() => alternarRegraPontuacao(op.chave)}
                  style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 4, cursor: "pointer",
                    border: ativa ? `1px solid ${t.accent}` : `1px solid ${t.border}`,
                    background: ativa ? t.accentBg : "transparent",
                    color: ativa ? t.accent : t.textDimmed,
                    fontWeight: ativa ? 700 : 400,
                  }}>{op.label}</button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Condições da Prova: Horário / Umidade / Temperatura ── */}
      <CondicoesProvaPanel eid={eid} filtroProva={filtroProva} catId={catId} filtroSexo={filtroSexo} eventoAtual={eventoAtual} editarEvento={editarEvento} />

      {/* Banner de resultados existentes */}
      {atletasNaProva.some(a => resExistentes[a.id] != null) && Object.keys(marcas).length === 0 && (
        <div style={{ background: t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:8, padding:"12px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <span style={{ color: t.accent, fontSize:13 }}>
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
                      loaded[a.id].marca = msParaDigitos(parseFloat(loaded[a.id].marca));
                    }
                  } else {
                    loaded[a.id] = { marca: isCorridaEdit ? msParaDigitos(parseFloat(r)) : r };
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
          <span style={{ color: t.textDimmed, fontSize:11 }}>
            Clique para carregar os dados nos campos e editar
          </span>
        </div>
      )}
      {Object.keys(marcas).length > 0 && atletasNaProva.some(a => resExistentes[a.id] != null) && (
        <div style={{ background:`${t.success}12`, border:`1px solid ${t.success}44`, borderRadius:8, padding:"8px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:8, fontSize:12, color: t.success }}>
          ✏️ <strong>Modo edição</strong> — altere os valores e clique em "Salvar e Publicar"
          <button
            style={{ ...s.linkBtn, marginLeft:"auto", color: t.textMuted, fontSize:11 }}
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
          const metros = (() => {
            const nome = provaSel?.nome || "";
            const mNome = nome.match(/^([\d.]+)m/);
            if (mNome) return parseInt(mNome[1].replace(/\./g, ""));
            const id = provaSel?.id || "";
            const mKm = id.match(/(\d+)km/i);
            if (mKm) return parseInt(mKm[1]) * 1000;
            const mId = id.match(/[_x]?(\d+)m/);
            return mId ? parseInt(mId[1]) : 0;
          })();
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
                <div style={{ background:`${t.success}12`, border:`1px solid ${t.success}44`, borderRadius:8, padding:"8px 16px", marginBottom:12, display:"flex", alignItems:"center", gap:8, fontSize:12, color: t.success }}>
                  ✏️ <strong>Modo edição</strong> — altere os valores e clique em "Salvar e Publicar"
                  <button style={{ ...s.linkBtn, marginLeft:"auto", color: t.textMuted, fontSize:11 }}
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
                      <tr key={eq.equipeId} style={{ ...s.tr, ...(j < 3 ? { background: t.bgCardAlt } : {}) }}>
                        <Td><strong style={{ color: t.textTertiary }}>{j + 1}</strong></Td>
                        <Td><strong style={{ color: t.accent }}>{eq.nomeEquipe}{eq.sigla ? ` (${eq.sigla})` : ""}</strong></Td>
                        <Td>{eq.atletas.length > 0
                          ? <span style={{ fontSize: 11, color: t.textTertiary }}>{eq.atletas.map(a => a.nome).join(" · ")}</span>
                          : <span style={{ fontSize: 11, color: t.danger }}>⚠ Sem atletas</span>
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
                            type="text" inputMode="numeric" placeholder={getMascaraTempo(metros).template.replace(/_/g, "0")}
                            style={{ ...s.input, width: 100, textAlign: "center", fontWeight: 700, fontSize: 14, padding: "8px 6px",
                              color: isStatusAtivo ? t.textDimmed : t.success,
                              background: isStatusAtivo ? t.bgCardAlt : t.bgHeaderSolid }}
                            disabled={isStatusAtivo}
                            value={valMarca || ""}
                            onChange={e => {
                              const v = e.target.value.replace(/\D/g, "");
                              const maxSlots = getMascaraTempo(metros).slots;
                              setMarcas(prev => ({ ...prev, [eq.equipeId]: { ...prev[eq.equipeId], marca: v.slice(0, maxSlots), status: "" } }));
                            }}
                          />
                          {valMarca && !isStatusAtivo && (
                            <div style={{ fontSize: 11, color: t.success, fontWeight: 700, fontFamily: "'Barlow Condensed', monospace", marginTop: 2, textAlign: "center", letterSpacing: 1 }}>
                              {aplicarMascaraTempo(String(valMarca), metros)}
                            </div>
                          )}
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
                            <span style={{ color: t.textMuted, fontSize: 12 }}>{formatarTempo(existMarca, 2)}</span>
                          ) : existStatus ? (
                            <span style={{ color: t.warning, fontSize: 12 }}>{existStatus}</span>
                          ) : <span style={{ color: t.textDisabled }}>—</span>}
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
                  <button style={{ ...s.btnGhost, color: t.danger, borderColor: `${t.danger}44` }}
                    onClick={async () => {
                      if (!await confirmar(`⚠️ Limpar TODOS os resultados deste revezamento?\n\n${provaSel?.nome } — ${catId} — ${filtroSexo === "M" ? "Masc." : "Fem."}\n\nEsta ação é IRREVERSÍVEL.`)) return;
                      _limparTodos(eid, filtroProva, catId, filtroSexo);
                      setMarcas({});
                    }}>🗑 Limpar Todos</button>
                )}
                {salvo && <span style={{ color: t.success, fontWeight: 700, fontSize: 14 }}>✅ Salvo!</span>}
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
          {/* Banner de prova concluída */}
          {atletasNaProva.length > 0 && atletasNaProva.every(a => {
            if (isStatusInativo(a)) return true;
            if (isAutoNMAltura(a)) return true;
            const st = getStatusAtleta(a);
            if (st) return true;
            const r = resExistentes[a.id];
            const marca = r ? (typeof r === "object" ? r.marca : r) : null;
            return marca != null && marca !== "";
          }) && (
            <div style={{ background:`${t.success}15`, border:`1px solid ${t.success}44`, borderRadius:8, padding:"6px 14px", marginBottom:10, fontSize:11, color: t.success }}>
              🏆 <strong>Prova Concluída</strong>
              <span style={{ color: t.textMuted, marginLeft:8 }}>Todos os atletas possuem resultado</span>
            </div>
          )}
          {/* ── Linha de configuração das barras ───────────────────── */}
          <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:"14px 18px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
              <span style={{ color: t.accent, fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:800, letterSpacing:1, whiteSpace:"nowrap" }}>
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
              <span style={{ fontSize:11, color: t.textDisabled }}>metros (ex: 1,20)</span>
            </div>
          </div>

          {/* ── Tabela: linhas = atletas, colunas = alturas ─────────── */}
          {temDesempateAltura && (
            <div style={{ background: t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:8, padding:"6px 14px", marginBottom:10, fontSize:11, color: t.accent }}>
              ⚖️ <strong>RT 26.9 — Regra de Desempate Aplicada</strong>
              <span style={{ color: t.textMuted, marginLeft:8 }}>1º menor nº de saltos na última altura transposta (SU) · 2º menor nº total de falhas na prova (FP)</span>
            </div>
          )}
          <div style={{ overflowX:"auto", maxHeight:"80vh", overflowY:"auto" }}>
            <table style={{ borderCollapse:"collapse", background:t.bgHeaderSolid, minWidth:"100%" }}>
              <thead style={{ position:"sticky", top:0, zIndex:2 }}>
                {/* linha 1: altura em cada coluna */}
                <tr>
                  <th style={{ ...sty.th, textAlign:"left", minWidth:200, position:"sticky", left:0, zIndex:3, background:t.bgHeaderSolid }}>ATLETA</th>
                  {(Array.isArray(alturas) ? alturas : []).filter(h=>h!=="").map(h => (
                    <th key={h} colSpan={3} style={{ ...sty.th, background:t.bgHeaderSolid, color: t.accent, minWidth:90, textAlign:"center", borderBottom:`2px solid ${t.accent}` }}>
                      {parseFloat(h).toFixed(2).replace(".",",")}m
                    </th>
                  ))}
                  <th style={{ ...sty.th, minWidth:36, color: t.danger, fontSize:9 }} title="Saltos na Última altura transposta (RT 26.9.1)">SU</th>
                  <th style={{ ...sty.th, minWidth:36, color: t.danger, fontSize:9 }} title="Falhas na Prova inteira (RT 26.9.2)">FP</th>
                  <th style={{ ...sty.th, minWidth:80, color: t.success }}>MELHOR</th>
                  <th style={{ ...sty.th, minWidth:44, color: t.accent }}>POS.</th>
                  <th style={{ ...sty.th, minWidth:62 }}>Status</th>
                </tr>
                {/* linha 2: numeração das tentativas */}
                <tr>
                  <th style={{ ...sty.th, background: t.bgCardAlt, position:"sticky", left:0, zIndex:3 }}></th>
                  {(Array.isArray(alturas) ? alturas : []).filter(h=>h!=="").flatMap(h =>
                    [1,2,3].map(n => (
                      <th key={`${h}-${n}`} style={{ ...sty.th, background: t.bgCardAlt, color: t.textDimmed, fontSize:9, minWidth:30 }}>{n}ª</th>
                    ))
                  )}
                  <th style={{ ...sty.th, background: t.bgCardAlt }}></th>
                  <th style={{ ...sty.th, background: t.bgCardAlt }}></th>
                  <th style={{ ...sty.th, background: t.bgCardAlt }}></th>
                  <th style={{ ...sty.th, background: t.bgCardAlt }}></th>
                  <th style={{ ...sty.th, background: t.bgCardAlt }}></th>
                </tr>
              </thead>
              <tbody>
                {/* Ordenar: ativos primeiro, inativos (DNS/DQ/DNF) e NM no final */}
                {[...atletasNaProva].sort((a, b) => {
                  const aInativo = (isStatusInativo(a) || (melhorAltura(a.id) == null && isAutoNMAltura(a))) ? 1 : 0;
                  const bInativo = (isStatusInativo(b) || (melhorAltura(b.id) == null && isAutoNMAltura(b))) ? 1 : 0;
                  return aInativo - bInativo;
                }).map((a, ai) => {
                  const atletaInativo = isStatusInativo(a);
                  const atletaNMAltura = !atletaInativo && melhorAltura(a.id) == null && isAutoNMAltura(a);
                  const foraDeProva = atletaInativo || atletaNMAltura;
                  const melhor = foraDeProva ? null : melhorAltura(a.id);
                  return (
                    <tr key={a.id} style={{ background: ai%2===0 ? t.bgCard : t.bgCardAlt, opacity: foraDeProva ? 0.4 : 1 }}>
                      {/* nome + nº peito — sticky */}
                      <td style={{ padding:"8px 12px", borderBottom:`1px solid ${t.border}`, whiteSpace:"nowrap", position:"sticky", left:0, zIndex:1, background: ai%2===0 ? t.bgCard : t.bgCardAlt }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          {(numeracaoPeito?.[eventoAtual?.id]||{})[a.id] && (
                            <span style={{ fontWeight:700, color: t.textTertiary, fontSize:12, minWidth:24 }}>{(numeracaoPeito[eventoAtual.id])[a.id]}</span>
                          )}
                          <div>
                            <div style={{ fontWeight:700, color: t.textPrimary, fontSize:13 }}>{a.nome}<ChamadaBadge atletaId={a.id} provaId={filtroProva} catId={catId} sexo={filtroSexo} getPresencaProva={getPresencaProva} t={t} /></div>
                            <div style={{ color: t.textDimmed, fontSize:11 }}>{getExibicaoEquipe(a, equipes)||"—"}{atletaInativo ? ` — ${getStatusAtleta(a)}` : atletaNMAltura ? " — NM" : ""}</div>
                          </div>
                        </div>
                      </td>
                      {/* tentativas por altura */}
                      {(Array.isArray(alturas) ? alturas : []).filter(h=>h!=="").flatMap((h, hIdx) => {
                        if (atletaInativo) return [0,1,2].map(ti => (
                          <td key={`${h}-${ti}`} style={{ padding:"6px 4px", textAlign:"center", borderBottom:`1px solid ${t.border}`, borderLeft: ti===0 ? `2px solid ${t.border}` : `1px solid ${t.border}`, background:t.bgHeaderSolid }}>
                            <div style={{ fontSize:9, color: t.textDisabled }}>—</div>
                          </td>
                        ));
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
                            borderBottom:`1px solid ${t.border}`,
                            borderLeft: ti===0 ? `2px solid ${t.border}` : `1px solid ${t.border}`,
                            background: estado === "eliminado" ? `${t.danger}12`
                                      : estado === "bloq_sucesso" ? `${t.success}10`
                                      : passou && tent[ti]==="O" ? `${t.success}10`
                                      : elim  && tent[ti]==="X" ? `${t.danger}12`
                                      : estado === "aguardando" ? t.bgHeaderSolid
                                      : "transparent",
                            opacity: bloqueado && tent[ti] === "" ? 0.35 : 1,
                          }}>
                            {bloqueado && tent[ti] === "" ? (
                              estado === "eliminado" ? (
                                <div style={{ fontSize:9, color: t.danger, fontWeight:700 }}>
                                  {ti === 1 ? "✕" : ""}
                                </div>
                              ) : (
                                <div style={{ fontSize:9, color: t.textDisabled }}>—</div>
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
                                      ? (op==="O"?`${t.success}25`:op==="X"?`${t.danger}25`:t.bgCardAlt)
                                      : t.bgHover,
                                    color: tent[ti]===op
                                      ? (op==="O"?t.success:op==="X"?t.danger:t.textTertiary)
                                      : t.textDisabled,
                                    outline: tent[ti]===op
                                      ? `1px solid ${op==="O"?`${t.success}66`:op==="X"?`${t.danger}66`:t.textDisabled}`
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
                      <td style={{ padding:"6px 4px", textAlign:"center", borderBottom:`1px solid ${t.border}`, borderLeft:`2px solid ${t.border}` }}>
                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color: melhor ? t.danger : t.textDisabled }}>
                          {melhor != null ? calcSU(a.id) : "—"}
                        </span>
                      </td>
                      {/* FP - falhas na prova */}
                      <td style={{ padding:"6px 4px", textAlign:"center", borderBottom:`1px solid ${t.border}` }}>
                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color: melhor ? t.danger : t.textDisabled }}>
                          {melhor != null ? calcFP(a.id) : "—"}
                        </span>
                      </td>
                      {/* melhor */}
                      <td style={{ padding:"8px 10px", textAlign:"center", borderBottom:`1px solid ${t.border}`, borderLeft:`2px solid ${t.border}` }}>
                        <span style={{
                          fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:800,
                          color: melhor ? t.success : t.textDisabled,
                        }}>
                          {melhor!=null ? `${melhor.toFixed(2).replace(".",",")}m` : "—"}
                        </span>
                      </td>
                      {/* POS */}
                      <td style={{ padding:"6px 4px", textAlign:"center", borderBottom:`1px solid ${t.border}` }}>
                        {(() => {
                          const pos = calcPosAltura(a.id, atletasNaProva);
                          return (
                            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:800, color: pos ? t.accent : t.textDisabled }}>
                              {pos != null ? `${pos}º` : "—"}
                            </span>
                          );
                        })()}
                      </td>
                      {/* Status */}
                      <td style={{ padding:"4px", textAlign:"center", borderBottom:`1px solid ${t.border}` }}>
                        <div style={{ display:"flex", alignItems:"center", gap:2 }}>
                          <select style={{ fontSize:10, padding:"2px", background: t.bgInput, color: (marcas[a.id]?.status || getExist(a,"status","")) ? t.warning : t.textDimmed, border:`1px solid ${t.border}`, borderRadius:4, width:56 }}
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
                            <input type="text" placeholder="Regra" style={{ width:44, fontSize:9, padding:"2px 3px", background: t.bgCardAlt, color: t.danger, border:`1px solid ${t.danger}44`, borderRadius:3 }}
                              value={marcas[a.id]?.dqRegra ?? getExist(a,"dqRegra","")}
                              onChange={e => setMarcas(prev => ({ ...prev, [a.id]: { ...(prev[a.id]||{}), dqRegra: e.target.value } }))} />
                          )}
                        </div>
                      </td>
                      <td style={{ padding:"4px 8px", textAlign:"center", borderBottom:`1px solid ${t.border}` }}>
                        {resExistentes[a.id] != null && (
                          <button
                            title="Limpar resultado deste atleta"
                            onClick={() => pedirLimparAtleta(a.id)}
                            style={{ background:"transparent", border:`1px solid ${t.danger}44`, borderRadius:6, cursor:"pointer", color: t.danger, fontSize:13, padding:"3px 8px" }}
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
                  style={{ ...s.btnGhost, borderColor: `${t.danger}44`, color: t.danger, fontSize:12 }}
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
              const atl = resolverAtleta(aId, atletas, eventoAtual);
              let total = 0;
              let provasRealizadas = 0;
              const porProva = todasCompDaCombinada.map(pc => {
                const chaveR = `${eid}_${pc.id}_${catId}_${filtroSexo}`;
                const res = resultados[chaveR]?.[aId];
                const marca = res ? (typeof res === "object" ? res.marca : res) : null;
                const ptsManuais = res ? (typeof res === "object" ? res.pontosTabela : null) : null;
                const marcaNum = marca != null ? parseFloat(String(marca).replace(",", ".")) : null;
                const cronoAtl = resolverCronometragem(eventoAtual.cronometragemProvas, pc.id, eventoAtual.seriacao, catId, filtroSexo, aId);
                const ptsAuto = (marcaNum != null && !isNaN(marcaNum)) ? CombinedScoringEngine.calcularPontosProva(pc.provaOriginalSufixo, marcaNum, filtroSexo, combinadaId, cronoAtl, regrasPontuacaoEvento) : 0;
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
                marginTop: 24, background: t.accentBg, border: `1px solid ${t.accentBorder}`,
                borderRadius: 10, padding: 20, overflowX: "auto"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 20 }}>🏅</span>
                  <h3 style={{ color: t.accent, margin: 0, fontSize: 16 }}>
                    Classificação {comp?.nome || "Combinada"} — {todasCompletas ? "FINAL" : "PARCIAL"}
                  </h3>
                  <span style={{
                    fontSize: 11, padding: "2px 10px", borderRadius: 4, fontWeight: 600,
                    background: todasCompletas ? `${t.success}15` : t.accentBg,
                    color: todasCompletas ? t.success : t.accent,
                  }}>
                    {provasComResultado || 0}/{totalComp} provas
                  </span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${t.border}` }}>
                      <th style={{ padding: "6px 8px", textAlign: "left", color: t.textMuted }}>#</th>
                      <th style={{ padding: "6px 8px", textAlign: "left", color: t.textMuted }}>Atleta</th>
                      {todasCompDaCombinada.map(pc => (
                        <th key={pc.id} style={{
                          padding: "6px 4px", textAlign: "center", color: pc.id === provaSel.id ? t.accent : t.textMuted,
                          fontSize: 10, fontWeight: pc.id === provaSel.id ? 700 : 400,
                          background: pc.id === provaSel.id ? t.accentBg : "transparent",
                          borderRadius: 4, minWidth: 55
                        }}>
                          {abreviarProva(pc.nome)}
                        </th>
                      ))}
                      <th style={{ padding: "6px 8px", textAlign: "center", color: t.accent, fontWeight: 700 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={r.atletaId} style={{
                        borderBottom: `1px solid ${t.border}`,
                        background: idx < 3 ? t.bgCardAlt : "transparent"
                      }}>
                        <td style={{ padding: "6px 8px", color: idx < 3 ? t.accent : t.textMuted, fontWeight: 700 }}>
                          {idx + 1}º
                        </td>
                        <td style={{ padding: "6px 8px", color: t.textPrimary, fontWeight: 500, whiteSpace: "nowrap" }}>
                          {r.nome}
                        </td>
                        {r.porProva.map((pp, ppIdx) => (
                          <td key={ppIdx} style={{
                            padding: "4px 4px", textAlign: "center",
                            color: pp.marca != null && pp.marca !== "" ? t.textSecondary : t.textDisabled,
                            fontSize: 11,
                            background: todasCompDaCombinada[ppIdx]?.id === provaSel.id ? t.accentBg : "transparent",
                          }}>
                            {pp.marca != null && pp.marca !== "" ? (
                              <div>
                                <div style={{ color: t.textTertiary, fontSize: 10 }}>{formatarMarca(pp.marca, pp.unidade, 2)}</div>
                                <div style={{ color: t.accent, fontWeight: 600 }}>{pp.pts} pts</div>
                              </div>
                            ) : "—"}
                          </td>
                        ))}
                        <td style={{
                          padding: "6px 8px", textAlign: "center",
                          color: t.accent, fontWeight: 700, fontSize: 14
                        }}>
                          {r.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!todasCompletas && (
                  <div style={{ marginTop: 10, fontSize: 11, color: t.textDimmed, textAlign: "center" }}>
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
            // Extrair metros do nome (ex: "800m", "1.500m", "20.000m Marcha") ou do ID
            const nome = provaSel?.nome || "";
            const mNome = nome.match(/^([\d.]+)m/);
            if (mNome) return parseInt(mNome[1].replace(/\./g, ""));
            // ID: "M_adulto_800m", "M_adulto_20kmM", "M_adulto_4x100m"
            const id = provaSel?.id || "";
            const mKm = id.match(/(\d+)km/i);
            if (mKm) return parseInt(mKm[1]) * 1000;
            const mId = id.match(/[_x]?(\d+)m/);
            return mId ? parseInt(mId[1]) : 0;
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

          const inputStyle = { ...s.inputMarca, width: 90 };
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
                  <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:"8px 14px", marginBottom:10, fontSize:11, color: t.textMuted, lineHeight:1.7 }}>
                    <strong style={{ color: t.accent }}>Regras Técnicas:</strong>{" "}
                    T1-T3: ordem por sorteio (RT 25.5) · T4-T6: ordem inversa da CP (RT 25.6.1) · Empate na CP: mantém ordem do sorteio (RT 25.6.2) · Desempate: 2ª melhor marca, 3ª, etc (RT 25.22)
                  </div>
                  {/* Info sorteio RT 25.5 */}
                  {_sorteioCampo?.ordem && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                      <span style={{ fontSize:12, color:t.success, fontWeight:600 }}>
                        Sorteio realizado em {new Date(_sorteioCampo.timestamp).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                      </span>
                    </div>
                  )}
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
                          <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.accentBorder}`, borderRadius:8, padding:"6px 14px", marginBottom:10, fontSize:11, color: t.accent }}>
                            🔄 <strong>RT 25.6.1 — Ordem Inversa Aplicada</strong>
                            <span style={{ color: t.textMuted, marginLeft:8 }}>Top 8 em ordem inversa do CP (pior primeiro) · Eliminados abaixo</span>
                          </div>
                        )}
                        {estadoProva === 3 && (
                          <div style={{ background:`${t.success}15`, border:`1px solid ${t.success}44`, borderRadius:8, padding:"6px 14px", marginBottom:10, fontSize:11, color: t.success }}>
                            🏆 <strong>Classificação Final</strong>
                            <span style={{ color: t.textMuted, marginLeft:8 }}>Todas as tentativas completas — ordenado pela melhor marca com desempate RT 25.22</span>
                          </div>
                        )}
                        {temDesempate && (
                          <div style={{ background: t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:8, padding:"6px 14px", marginBottom:10, fontSize:11, color: t.accent }}>
                            ⚖️ <strong>RT 25.22 — Regra de Desempate Aplicada</strong>
                            <span style={{ color: t.textMuted, marginLeft:8 }}>Atletas com mesma melhor marca desempatados pela 2ª melhor, 3ª melhor, etc.</span>
                          </div>
                        )}
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ ...s.table, minWidth: 900 }}>
                            <thead>
                              <tr>
                                <Th>Nº</Th>
                                <Th>Atleta</Th><Th>Clube/Equipe</Th>
                                <Th style={{ background:`${t.success}15`, color: t.success }}>T1</Th>
                                <Th style={{ background:`${t.success}15`, color: t.success }}>T2</Th>
                                <Th style={{ background:`${t.success}15`, color: t.success }}>T3</Th>
                                <Th style={{ background: t.accentBg, color: t.accent, minWidth:52 }}>CP</Th>
                                <Th style={{ background:`${t.warning}15`, color: t.warning }}>T4</Th>
                                <Th style={{ background:`${t.warning}15`, color: t.warning }}>T5</Th>
                                <Th style={{ background:`${t.warning}15`, color: t.warning }}>T6</Th>
                                <Th style={{ background: t.accentBg, color: t.accent, minWidth:68 }}>MELHOR</Th>
                                <Th style={{ background: t.accentBg, color: t.accent, minWidth:44 }}>POS.</Th>
                                <Th style={{ minWidth:62 }}>Status</Th>
                                <Th></Th>
                              </tr>
                            </thead>
                            <tbody>
                              {ordemExibicao.map(({ a, cp, mf, pos, idxOriginal }, i) => {
                                const tGet = (tk) => marcas[a.id]?.[tk] ?? getExist(a, tk, "");
                                const top8 = cp !== null && cp <= 8;
                                const atletaInativo = isStatusInativo(a);
                                const atletaNM = isAutoNM(a);
                                const isEliminado = (estadoProva >= 2 && !top8) || atletaInativo || atletaNM;
                                const showSeparador = estadoProva === 2 && i === separadorIdx && eliminados.length > 0;
                                // Separador para inativos (DNS/NM/DQ)
                                const idxInativos = ordemExibicao.length - atletasInativos.length;
                                const showSeparadorInativos = atletasInativos.length > 0 && i === idxInativos && !atletasInativos.some(x => x === ordemExibicao[0]);

                                return (
                                  <React.Fragment key={`${a.id}-${i}`}>
                                    {showSeparador && (
                                      <tr>
                                        <td colSpan={12} style={{
                                          padding: "6px 12px", background: `${t.danger}12`,
                                          borderTop: `2px solid ${t.danger}44`, borderBottom: `1px solid ${t.danger}22`,
                                          fontSize: 11, color: t.danger, fontWeight: 700, textAlign: "center"
                                        }}>
                                          ❌ Eliminados — não avançam para T4-T6
                                        </td>
                                      </tr>
                                    )}
                                    {showSeparadorInativos && (
                                      <tr>
                                        <td colSpan={12} style={{
                                          padding: "6px 12px", background: t.bgHeaderSolid,
                                          borderTop: `2px solid ${t.border}`, borderBottom: `1px solid ${t.border}`,
                                          fontSize: 11, color: t.textMuted, fontWeight: 700, textAlign: "center"
                                        }}>
                                          🚫 DNS / NM / DQ
                                        </td>
                                      </tr>
                                    )}
                                    <tr style={{
                                      ...s.tr,
                                      opacity: isEliminado ? 0.5 : 1,
                                      background: atletaInativo ? t.bgHeaderSolid : atletaNM ? t.bgHeaderSolid : isEliminado ? t.bgHeaderSolid : undefined,
                                    }}>
                                    <Td><strong style={{ color: t.textTertiary, fontSize:12 }}>{(numeracaoPeito?.[eventoAtual?.id]||{})[a.id]||""}</strong></Td>
                                    <Td><strong style={{ color: t.textPrimary }}>{a.nome}</strong><ChamadaBadge atletaId={a.id} provaId={filtroProva} catId={catId} sexo={filtroSexo} getPresencaProva={getPresencaProva} t={t} /></Td>
                                    <Td>{getExibicaoEquipe(a, equipes)||"—"}</Td>
                                    {["t1","t2","t3"].map(tk => {
                                      const isSaltoHoriz = provaSel?.nome?.includes("Distância") || provaSel?.nome?.includes("Triplo");
                                      return (
                                      <td key={tk} style={{ ...tdStyle, background: atletaInativo ? t.bgCardAlt : `${t.success}08` }}>
                                        <input
                                          style={{ ...inputStyle, width:64, background: atletaInativo ? t.bgCardAlt : `${t.success}08`, color: atletaInativo ? t.textDisabled : t.success, cursor: atletaInativo ? "not-allowed" : "text" }}
                                          placeholder="—"
                                          disabled={atletaInativo}
                                          value={atletaInativo ? "" : exibirMarcaInput(tGet(tk))}
                                          onChange={e => setDado(a, tk, normalizarMarca(e.target.value))}
                                        />
                                        {isSaltoHoriz && !atletaInativo && (
                                          <input
                                            style={{ ...inputStyle, width:54, background: t.accentBg, color: t.accent, fontSize:9, marginTop:2, textAlign:"center", border:`1px solid ${t.accentBorder}` }}
                                            placeholder="💨 m/s"
                                            value={(marcas[a.id]?.[tk+"v"] ?? getExist(a, tk+"v", ""))}
                                            onChange={e => setDado(a, tk+"v", e.target.value)}
                                          />
                                        )}
                                      </td>
                                      );
                                    })}
                                    {/* CP automático */}
                                    <td style={{ ...tdStyle, background:`${t.success}08` }}>
                                      {atletaInativo ? (
                                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, color: t.warning }}>
                                          {getStatusAtleta(a)}
                                        </span>
                                      ) : atletaNM ? (
                                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, color: t.warning }}>
                                          NM
                                        </span>
                                      ) : (
                                        <>
                                          <span style={{
                                            fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800,
                                            fontSize:15, color: top8 ? t.accent : t.textDimmed,
                                          }}>
                                            {cp !== null ? `${cp}º` : "—"}
                                          </span>
                                          {top8 && <div style={{ fontSize:9, color: t.textMuted }}>→ fin.</div>}
                                        </>
                                      )}
                                    </td>
                                    {/* T4-T6 */}
                                    {["t4","t5","t6"].map(tk => {
                                      const isSaltoHoriz = provaSel?.nome?.includes("Distância") || provaSel?.nome?.includes("Triplo");
                                      const podeEditar = top8 && !atletaInativo;
                                      return (
                                      <td key={tk} style={{ ...tdStyle, background: podeEditar ? `${t.warning}12` : t.bgHeaderSolid, opacity: podeEditar ? 1 : 0.4 }}>
                                        <input
                                          style={{ ...inputStyle, width:64,
                                            background: podeEditar ? `${t.warning}10` : t.bgCardAlt,
                                            color: podeEditar ? t.warning : t.textDisabled,
                                            cursor: podeEditar ? "text" : "not-allowed",
                                          }}
                                          placeholder="—"
                                          disabled={!podeEditar}
                                          value={atletaInativo ? "" : exibirMarcaInput(tGet(tk))}
                                          onChange={e => setDado(a, tk, normalizarMarca(e.target.value))}
                                        />
                                        {isSaltoHoriz && podeEditar && (
                                          <input
                                            style={{ ...inputStyle, width:54, background: t.accentBg, color: t.accent, fontSize:9, marginTop:2, textAlign:"center", border:`1px solid ${t.accentBorder}` }}
                                            placeholder="💨 m/s"
                                            value={(marcas[a.id]?.[tk+"v"] ?? getExist(a, tk+"v", ""))}
                                            onChange={e => setDado(a, tk+"v", e.target.value)}
                                          />
                                        )}
                                      </td>
                                      );
                                    })}
                                    {/* Melhor e Posição automáticos */}
                                    <td style={{ ...tdStyle }}>
                                      <span style={{
                                        fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800,
                                        fontSize:15, color: mf !== null ? t.accent : t.textDisabled,
                                      }}>
                                        {mf !== null ? `${mf.toFixed(2).replace(".",",")}m` : "—"}
                                      </span>
                                    </td>
                                    <td style={{ ...tdStyle }}>
                                      <span style={{
                                        fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800,
                                        fontSize:15, color: pos !== null ? t.accent : t.textDisabled,
                                      }}>
                                        {pos !== null ? `${pos}º` : "—"}
                                      </span>
                                    </td>
                                    <td style={{ ...tdStyle }}>
                                      <div style={{ display:"flex", alignItems:"center", gap:2 }}>
                                        <select style={{ fontSize:10, padding:"2px", background: t.bgInput, color: (marcas[a.id]?.status || getExist(a,"status","")) ? t.warning : t.textDimmed, border:`1px solid ${t.border}`, borderRadius:4, width:56 }}
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
                                          <input type="text" placeholder="Regra" style={{ width:44, fontSize:9, padding:"2px 3px", background: t.bgCardAlt, color: t.danger, border:`1px solid ${t.danger}44`, borderRadius:3 }}
                                            value={marcas[a.id]?.dqRegra ?? getExist(a,"dqRegra","")}
                                            onChange={e => setDado(a, "dqRegra", e.target.value)} />
                                        )}
                                      </div>
                                    </td>
                                    <td style={{ ...tdStyle }}>
                                      {resExistentes[a.id] != null && (
                                        <button title="Limpar" onClick={() => pedirLimparAtleta(a.id)}
                                          style={{ background:"transparent", border:`1px solid ${t.danger}44`, borderRadius:5, cursor:"pointer", color: t.danger, fontSize:13, padding:"2px 6px" }}>🗑️</button>
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
                  {/* Banner de prova concluída */}
                  {atletasNaProva.length > 0 && atletasNaProva.every(a => {
                    const st = getStatusAtleta(a);
                    if (st) return true;
                    const r = resExistentes[a.id];
                    const marca = r ? (typeof r === "object" ? r.marca : r) : null;
                    return marca != null && marca !== "";
                  }) && (
                    <div style={{ background:`${t.success}15`, border:`1px solid ${t.success}44`, borderRadius:8, padding:"6px 14px", marginBottom:10, fontSize:11, color: t.success }}>
                      🏆 <strong>Prova Concluída</strong>
                      <span style={{ color: t.textMuted, marginLeft:8 }}>Todos os atletas possuem resultado</span>
                    </div>
                  )}
                  <div style={s.digitarDica}>
                    {`Digite apenas os números — o sistema formata automaticamente (ex: 10850 → 10,850 · 12345 → 1.23,450)${temRaia ? " · Raia: nº" : ""}${temVento ? " · Vento: ex +1,2" : ""}`}
                  </div>
                  {provaSel?.especBarreiras && (
                    <div style={{ background: t.bgCardAlt, border:`1px solid ${t.border}`, borderRadius:8, padding:"8px 14px", marginBottom:10, fontSize:11, color: t.textTertiary, display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
                      <span style={{ fontWeight:700, color: t.accent }}>🏃‍♂️ Barreiras:</span>
                      <span>Altura: <strong style={{ color: t.textPrimary }}>{provaSel.especBarreiras.altura}</strong></span>
                      <span>Saída→1ª: <strong style={{ color: t.textPrimary }}>{provaSel.especBarreiras.saida1a}</strong></span>
                      <span>Entre barr.: <strong style={{ color: t.textPrimary }}>{provaSel.especBarreiras.entre}</strong></span>
                      <span>Última→Cheg.: <strong style={{ color: t.textPrimary }}>{provaSel.especBarreiras.ultimaCheg}</strong></span>
                    </div>
                  )}
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <Th>Nº</Th><Th>Atleta</Th><Th>Clube/Equipe</Th>
                        {_serDigitar?.series?.length > 0 && <Th>Série</Th>}
                        {temRaia  && <Th>Raia</Th>}
                        {temVento && <Th>Vento</Th>}
                        <Th>Digitado</Th><Th>Tempo</Th><Th>Status</Th><Th>Atual</Th><Th></Th>
                      </tr>
                    </thead>
                    <tbody>
                      {atletasNaProva.map((a, i) => {
                        const _si = _getSerInfo(a.id, i);
                        const _prevSi = i > 0 ? _getSerInfo(atletasNaProva[i-1].id, i-1) : { serie: "" };
                        const showSerieHeader = _serDigitar?.series?.length > 1 && _si.serie && _si.serie !== _prevSi.serie;
                        const rawDigits = marcas[a.id]?.marca ?? "";
                        const existMs   = getExist(a,"marca","");
                        const existStatus = getExist(a,"status","");
                        const existDqRegra = getExist(a,"dqRegra","");
                        const statusVal = marcas[a.id]?.status ?? existStatus;
                        const dqRegraVal = marcas[a.id]?.dqRegra ?? existDqRegra;
                        const inputVal = rawDigits !== "" ? rawDigits
                          : existMs !== "" && !existStatus ? msParaDigitos(parseFloat(existMs)) : "";
                        const raiaVal  = marcas[a.id]?.raia  ?? (getExist(a,"raia","") || _getSerInfo(a.id, i).raia);
                        const ventoVal = marcas[a.id]?.vento ?? getExist(a,"vento","");
                        const mascaraDisplay = inputVal && !statusVal ? aplicarMascaraTempo(inputVal, metros) : "";
                        const previewFormatado = inputVal && !statusVal ? autoFormatTempo(inputVal) : "";
                        const _nCols = 9 + (temRaia?1:0) + (temVento?1:0) + (_serDigitar?.series?.length>0?1:0);
                        return (
                          <React.Fragment key={`${a.id}-${i}`}>
                          {showSerieHeader && (
                            <tr><td colSpan={_nCols} style={{ padding:"8px 12px", background: t.accentBg, borderBottom:`2px solid ${t.accentBorder}`, color: t.accent, fontWeight:700, fontSize:12, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                              <span>Série {_si.serie}</span>
                              {mostrarToggleCrono && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <span style={{ fontSize: 11, color: t.textMuted, fontWeight: 400 }}>⏱ Cronometragem:</span>
                                  <button
                                    onClick={() => alternarCronoSerie(_si.serie, "ELE")}
                                    style={{
                                      fontSize: 11, padding: "2px 8px", borderRadius: 4, cursor: "pointer",
                                      border: (cronoSeries[_si.serie] || "ELE") === "ELE" ? `1px solid ${t.accentBorder}` : `1px solid ${t.border}`,
                                      background: (cronoSeries[_si.serie] || "ELE") === "ELE" ? t.accentBg : "transparent",
                                      color: (cronoSeries[_si.serie] || "ELE") === "ELE" ? t.accent : t.textDimmed,
                                      fontWeight: (cronoSeries[_si.serie] || "ELE") === "ELE" ? 700 : 400,
                                    }}>Eletrônica</button>
                                  <button
                                    onClick={() => alternarCronoSerie(_si.serie, "MAN")}
                                    style={{
                                      fontSize: 11, padding: "2px 8px", borderRadius: 4, cursor: "pointer",
                                      border: (cronoSeries[_si.serie] || "ELE") === "MAN" ? `1px solid ${t.warning}` : `1px solid ${t.border}`,
                                      background: (cronoSeries[_si.serie] || "ELE") === "MAN" ? `${t.warning}15` : "transparent",
                                      color: (cronoSeries[_si.serie] || "ELE") === "MAN" ? t.warning : t.textDimmed,
                                      fontWeight: (cronoSeries[_si.serie] || "ELE") === "MAN" ? 700 : 400,
                                    }}>Manual</button>
                                </span>
                              )}
                            </td></tr>
                          )}
                          <tr style={{ ...s.tr, opacity: isStatusInativo(a) ? 0.4 : 1 }}>
                            <Td><strong style={{ color: t.textTertiary, fontSize:12 }}>{(numeracaoPeito?.[eventoAtual?.id]||{})[a.id]||""}</strong></Td>
                            <Td><strong style={{ color: t.textPrimary }}>{a.nome}</strong><ChamadaBadge atletaId={a.id} provaId={filtroProva} catId={catId} sexo={filtroSexo} getPresencaProva={getPresencaProva} t={t} /></Td>
                            <Td>{getExibicaoEquipe(a, equipes)||"—"}</Td>
                            {_serDigitar?.series?.length > 0 && <Td><span style={{ color: t.accent, fontWeight:700 }}>{_si.serie||"—"}</span></Td>}
                            {temRaia && (
                              <Td><input type="number" min="1" max="10" style={inputSmall} placeholder="4"
                                disabled={isStatusInativo(a)}
                                value={raiaVal} onChange={e => setDado(a,"raia",e.target.value)} /></Td>
                            )}
                            {temVento && (
                              <Td><input type="text" inputMode="decimal" style={inputSmall} placeholder="+1,2"
                                disabled={isStatusInativo(a)}
                                value={exibirMarcaInput(ventoVal)} onChange={e => setDado(a,"vento",normalizarMarca(e.target.value))} /></Td>
                            )}
                            <Td>
                              <input type="text" inputMode="numeric"
                                style={{ ...inputStyle, opacity: statusVal ? 0.3 : 1 }}
                                placeholder={getMascaraTempo(metros).template.replace(/_/g, "0")}
                                disabled={!!statusVal}
                                value={statusVal ? "" : inputVal}
                                onChange={e => {
                                  const v = e.target.value.replace(/\D/g, "");
                                  const maxSlots = getMascaraTempo(metros).slots;
                                  setDado(a, "marca", v.slice(0, maxSlots));
                                }} />
                            </Td>
                            <Td>
                              {mascaraDisplay && !statusVal ? (
                                <span style={{ fontFamily:"'Barlow Condensed', monospace", fontWeight:700, fontSize:15, color: t.success, letterSpacing: 1 }}>
                                  {mascaraDisplay}
                                </span>
                              ) : statusVal ? (
                                <span style={{ fontWeight:700, fontSize:13, color: statusVal === "DQ" ? t.danger : t.warning }}>
                                  {statusVal}{statusVal === "DQ" && dqRegraVal ? ` R.${dqRegraVal}` : ""}
                                </span>
                              ) : <span style={{ color: t.textDimmed }}>—</span>}
                            </Td>
                            <Td>
                              <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                                <select style={{ ...inputSmall, width:62, fontSize:10, padding:"2px", background: t.bgInput, color: statusVal ? t.warning : t.textDimmed, border:`1px solid ${t.border}`, borderRadius:4 }}
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
                                  <span style={{ color: existStatus === "DQ" ? t.danger : t.warning }}>
                                    {existStatus}{existStatus === "DQ" && existDqRegra ? ` R.${existDqRegra}` : ""}
                                  </span>
                                ) : formatarMarca(getExist(a,"marca"), provaSel?.unidade, 2)}</span>
                              ) : <span style={{ color: t.textDimmed }}>—</span>}
                            </Td>
                            <Td>
                              {resExistentes[a.id] != null && (
                                <button title="Limpar" onClick={() => pedirLimparAtleta(a.id)}
                                  style={{ background:"transparent", border:"none", cursor:"pointer", color: t.danger, fontSize:15, padding:"2px 6px" }}>🗑️</button>
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
                    <button style={{ ...s.btnGhost, borderColor: `${t.danger}44`, color: t.danger, fontSize:12 }}
                      onClick={pedirLimparTodos} title="Limpar todos os resultados desta prova">
                      🗑️ Limpar Todos
                    </button>
                  )}
                </div>
                {salvo && <span style={s.savedBadge} className="saved-pulse">✅ Resultados publicados!</span>}
              </div>

              {/* ── Painel Súmula de Juízes de Marcha ── */}
              {provaSel && provaSel.tipo === "marcha" && !provaSel.origemCombinada && marchaHook && (
                <MarchaJuizesPanel
                  eid={eid}
                  filtroProva={filtroProva}
                  catId={catId}
                  filtroSexo={filtroSexo}
                  atletasNaProva={atletasNaProva}
                  numeracaoPeito={numeracaoPeito}
                  equipes={equipes}
                  getMarchaProva={marchaHook.getMarchaProva}
                  salvarDocCompleto={marchaHook.salvarDocCompleto}
                  salvarCampoAtleta={marchaHook.salvarCampoAtleta}
                  salvarJuizes={marchaHook.salvarJuizes}
                  uploadAnexo={marchaHook.uploadAnexo}
                  removerAnexo={marchaHook.removerAnexo}
                  atualizarResultadosEmLote={atualizarResultadosEmLote}
                  resultados={resultados}
                  faseEfetiva={faseEfetiva}
                />
              )}

              {/* ── Painel Pontuação Acumulada da Combinada ── */}
              {provaSel && provaSel.origemCombinada && (() => {
                const combinadaId = provaSel.combinadaId;
                const todasCompDaCombinada = CombinedEventEngine.gerarProvasComponentes(combinadaId, eid);
                const atletaIds = [...new Set(
                  inscDoEvento.filter(i => i.combinadaId === combinadaId).map(i => i.atletaId)
                )];
                if (atletaIds.length === 0 || todasCompDaCombinada.length === 0) return null;

                const rows = atletaIds.map(aId => {
                  const atl = resolverAtleta(aId, atletas, eventoAtual);
                  let total = 0;
                  let provasRealizadas = 0;
                  const porProva = todasCompDaCombinada.map(pc => {
                    const chaveR = `${eid}_${pc.id}_${catId}_${filtroSexo}`;
                    const res = resultados[chaveR]?.[aId];
                    const marca = res ? (typeof res === "object" ? res.marca : res) : null;
                    const ptsManuais = res ? (typeof res === "object" ? res.pontosTabela : null) : null;
                    const marcaNum = marca != null ? parseFloat(String(marca).replace(",", ".")) : null;
                    const cronoAtl2 = resolverCronometragem(eventoAtual.cronometragemProvas, pc.id, eventoAtual.seriacao, catId, filtroSexo, aId);
                    const ptsAuto = (marcaNum != null && !isNaN(marcaNum)) ? CombinedScoringEngine.calcularPontosProva(pc.provaOriginalSufixo, marcaNum, filtroSexo, combinadaId, cronoAtl2, regrasPontuacaoEvento) : 0;
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
                    marginTop: 24, background: t.accentBg, border: `1px solid ${t.accentBorder}`,
                    borderRadius: 10, padding: 20, overflowX: "auto"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 20 }}>🏅</span>
                      <h3 style={{ color: t.accent, margin: 0, fontSize: 16 }}>
                        Classificação {comp?.nome || "Combinada"} — {todasCompletas ? "FINAL" : "PARCIAL"}
                      </h3>
                      <span style={{
                        fontSize: 11, padding: "2px 10px", borderRadius: 4, fontWeight: 600,
                        background: todasCompletas ? `${t.success}15` : t.accentBg,
                        color: todasCompletas ? t.success : t.accent,
                      }}>
                        {provasComResultado || 0}/{totalComp} provas
                      </span>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${t.border}` }}>
                          <th style={{ padding: "6px 8px", textAlign: "left", color: t.textMuted }}>#</th>
                          <th style={{ padding: "6px 8px", textAlign: "left", color: t.textMuted }}>Atleta</th>
                          {todasCompDaCombinada.map(pc => (
                            <th key={pc.id} style={{
                              padding: "6px 4px", textAlign: "center", color: pc.id === provaSel.id ? t.accent : t.textMuted,
                              fontSize: 10, fontWeight: pc.id === provaSel.id ? 700 : 400,
                              background: pc.id === provaSel.id ? t.accentBg : "transparent",
                              borderRadius: 4, minWidth: 55
                            }}>
                              {abreviarProva(pc.nome)}
                            </th>
                          ))}
                          <th style={{ padding: "6px 8px", textAlign: "center", color: t.accent, fontWeight: 700 }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, idx) => (
                          <tr key={r.atletaId} style={{
                            borderBottom: `1px solid ${t.border}`,
                            background: idx < 3 ? t.bgCardAlt : "transparent"
                          }}>
                            <td style={{ padding: "6px 8px", color: idx < 3 ? t.accent : t.textMuted, fontWeight: 700 }}>
                              {idx + 1}º
                            </td>
                            <td style={{ padding: "6px 8px", color: t.textPrimary, fontWeight: 500, whiteSpace: "nowrap" }}>
                              {r.nome}
                            </td>
                            {r.porProva.map((pp, ppIdx) => (
                              <td key={ppIdx} style={{
                                padding: "4px 4px", textAlign: "center",
                                color: pp.marca != null && pp.marca !== "" ? t.textSecondary : t.textDisabled,
                                fontSize: 11,
                                background: todasCompDaCombinada[ppIdx]?.id === provaSel.id ? t.accentBg : "transparent",
                              }}>
                                {pp.marca != null && pp.marca !== "" ? (
                                  <div>
                                    <div style={{ color: t.textTertiary, fontSize: 10 }}>{formatarMarca(pp.marca, pp.unidade, 2)}</div>
                                    <div style={{ color: t.accent, fontWeight: 600 }}>{pp.pts} pts</div>
                                  </div>
                                ) : "—"}
                              </td>
                            ))}
                            <td style={{
                              padding: "6px 8px", textAlign: "center",
                              color: t.accent, fontWeight: 700, fontSize: 14
                            }}>
                              {r.total}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!todasCompletas && (
                      <div style={{ marginTop: 10, fontSize: 11, color: t.textDimmed, textAlign: "center" }}>
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
   ModalImportLif — modal de importação de resultados do FinishLynx (.lif)
   ════════════════════════════════════════════════════════════════════════════ */
function ModalImportLif({ eventoAtual, inscricoes, atletas, equipes, numeracaoPeito, atualizarResultadosEmLote, onClose, t }) {
  const [conteudoLif, setConteudoLif] = useState("");
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [dragging, setDragging] = useState(false);
  const [importando, setImportando] = useState(false);
  const [importado, setImportado] = useState(false);
  const [erroImport, setErroImport] = useState("");
  const [edicoes, setEdicoes] = useState({});
  const [grupoSelecionado, setGrupoSelecionado] = useState(null);
  const fileRef = useRef(null);

  const parseado = useMemo(() => {
    if (!conteudoLif || !eventoAtual) return null;
    return parsearLif(conteudoLif, eventoAtual, inscricoes, atletas, equipes, numeracaoPeito);
  }, [conteudoLif, eventoAtual, inscricoes, atletas, equipes, numeracaoPeito]);

  // Auto-selecionar se houver apenas 1 grupo
  useEffect(() => {
    if (parseado && parseado.resultados.length === 1 && !grupoSelecionado) {
      setGrupoSelecionado(0);
    }
  }, [parseado, grupoSelecionado]);

  const lerArquivo = useCallback((file) => {
    if (!file) return;
    setNomeArquivo(file.name);
    setImportado(false);
    setErroImport("");
    setEdicoes({});
    setGrupoSelecionado(null);
    const reader = new FileReader();
    reader.onload = (ev) => setConteudoLif(ev.target.result || "");
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((ev) => {
    ev.preventDefault();
    setDragging(false);
    const file = ev.dataTransfer?.files?.[0];
    if (file) lerArquivo(file);
  }, [lerArquivo]);

  const editarEntrada = (gIdx, eIdx, campo, valor) => {
    const key = `${gIdx}_${eIdx}_${campo}`;
    setEdicoes(prev => ({ ...prev, [key]: valor }));
  };

  const getValor = (gIdx, eIdx, campo, original) => {
    const key = `${gIdx}_${eIdx}_${campo}`;
    return key in edicoes ? edicoes[key] : original;
  };

  const handleImportar = useCallback(async () => {
    if (!parseado || !atualizarResultadosEmLote) return;

    const gruposAImportar = grupoSelecionado != null
      ? [parseado.resultados[grupoSelecionado]]
      : parseado.resultados;

    if (gruposAImportar.length === 0) return;

    setImportando(true);
    setErroImport("");
    try {
      const eid = eventoAtual.id;
      for (let gIdx = 0; gIdx < gruposAImportar.length; gIdx++) {
        const grupo = gruposAImportar[gIdx];
        const realGIdx = grupoSelecionado != null ? grupoSelecionado : gIdx;
        const entradas = grupo.entradas.map((ent, eIdx) => {
          const marcaEdit = getValor(realGIdx, eIdx, "marca", ent.marca);
          const statusEdit = getValor(realGIdx, eIdx, "status", ent.status);
          const raiaEdit = getValor(realGIdx, eIdx, "raia", ent.raia);
          const ventoEdit = getValor(realGIdx, eIdx, "vento", ent.vento);

          const marcaFinal = statusEdit || marcaEdit;
          return {
            atletaId: ent.atletaId,
            marca: marcaFinal,
            tentData: {},
            statusData: statusEdit ? { status: statusEdit } : {},
            ...(raiaEdit != null ? { raia: parseInt(raiaEdit, 10) || null } : {}),
            ...(ventoEdit != null ? { vento: parseFloat(ventoEdit) || null } : {}),
          };
        });
        await atualizarResultadosEmLote(eid, grupo.provaId, grupo.catId, grupo.sexo, grupo.faseSufixo, entradas);
      }
      setImportado(true);
    } catch (err) {
      console.error("Erro ao importar resultados Lynx:", err);
      setErroImport("Erro ao salvar: " + (err.message || "erro desconhecido"));
    } finally {
      setImportando(false);
    }
  }, [parseado, eventoAtual, atualizarResultadosEmLote, grupoSelecionado, edicoes]);

  const fmtTempo = (ms) => formatarTempo(ms, 2);

  const STATUS_OPCOES = ["", "DNS", "DNF", "DQ"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={(ev) => { if (ev.target === ev.currentTarget && !importando) onClose(); }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, width: "min(95vw, 860px)", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: t.textPrimary }}>Importar Resultados FinishLynx</div>
            <div style={{ fontSize: 12, color: t.textDimmed }}>Arquivo .lif</div>
          </div>
          <button onClick={onClose} disabled={importando} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: t.textMuted, padding: "4px 8px" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Dropzone */}
          {!conteudoLif ? (
            <div
              style={{ border: `2px dashed ${dragging ? t.accent : t.border}`, borderRadius: 12, padding: "40px 20px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: dragging ? `${t.accent}08` : "transparent" }}
              onDragOver={(ev) => { ev.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: t.textPrimary, marginBottom: 6 }}>
                Arraste o arquivo .lif aqui
              </div>
              <div style={{ fontSize: 12, color: t.textDimmed }}>ou clique para selecionar</div>
              <input ref={fileRef} type="file" accept=".lif,.csv,.txt" style={{ display: "none" }} onChange={(ev) => lerArquivo(ev.target.files?.[0])} />
            </div>
          ) : (
            <>
              {/* Arquivo info + diagnóstico */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: `${t.accent}15`, color: t.accent, border: `1px solid ${t.accent}44` }}>{nomeArquivo}</span>
                {parseado && <span style={{ fontSize: 12, color: t.textDimmed }}>{parseado.totalResultados} resultado(s) em {parseado.totalEventos} prova(s)</span>}
                {parseado?.diagnostico && (
                  <span style={{ fontSize: 10, color: t.textDimmed }}>
                    · {parseado.diagnostico.bibsDisponiveis} peitos · {parseado.diagnostico.provasMapeadas} provas mapeadas · {parseado.diagnostico.blocosNoArquivo} bloco(s) no .lif
                  </span>
                )}
                <button onClick={() => { setConteudoLif(""); setNomeArquivo(""); setImportado(false); setErroImport(""); setEdicoes({}); setGrupoSelecionado(null); }}
                  style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted, cursor: "pointer" }}>
                  Trocar
                </button>
              </div>

              {/* Avisos */}
              {parseado && parseado.avisos.length > 0 && (
                <div style={{ marginBottom: 12, maxHeight: 120, overflowY: "auto" }}>
                  {parseado.avisos.map((av, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 6, padding: "4px 8px", borderRadius: 6, fontSize: 11, background: `${t.warning}10`, border: `1px solid ${t.warning}22`, color: t.warning, marginBottom: 4 }}>
                      <span>⚠</span><span>{av}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Erros */}
              {parseado && parseado.erros.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {parseado.erros.map((er, idx) => (
                    <div key={idx} style={{ padding: "6px 10px", borderRadius: 6, fontSize: 12, background: `${t.danger}10`, border: `1px solid ${t.danger}33`, color: t.danger, marginBottom: 4 }}>
                      ✕ {er}
                    </div>
                  ))}
                </div>
              )}

              {/* Seletor de prova (se múltiplas) */}
              {parseado && parseado.resultados.length > 1 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Selecionar prova para importar</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      onClick={() => setGrupoSelecionado(null)}
                      style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${grupoSelecionado == null ? t.accent : t.border}`, background: grupoSelecionado == null ? `${t.accent}15` : "transparent", color: grupoSelecionado == null ? t.accent : t.textMuted }}>
                      Todas ({parseado.totalResultados})
                    </button>
                    {parseado.resultados.map((grupo, gIdx) => (
                      <button key={gIdx}
                        onClick={() => setGrupoSelecionado(gIdx)}
                        style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${grupoSelecionado === gIdx ? t.accent : t.border}`, background: grupoSelecionado === gIdx ? `${t.accent}15` : "transparent", color: grupoSelecionado === gIdx ? t.accent : t.textMuted }}>
                        {grupo.provaNome} {grupo.sexo === "M" ? "M" : "F"} {grupo.catId} ({grupo.entradas.length})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabela de resultados editável */}
              {parseado && parseado.resultados.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  {parseado.resultados.map((grupo, gIdx) => {
                    if (grupoSelecionado != null && grupoSelecionado !== gIdx) return null;
                    return (
                      <div key={gIdx} style={{ marginBottom: 16 }}>
                        <div style={{ padding: "8px 12px", background: `${t.accent}08`, borderRadius: 8, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, color: t.textPrimary }}>
                            {grupo.provaNome}
                            <span style={{ fontSize: 12, color: t.textDimmed, fontWeight: 400, marginLeft: 8 }}>
                              {grupo.sexo === "M" ? "Masc" : "Fem"} · {grupo.catId} · {grupo.faseSufixo || "FIN"}
                              {grupo.vento != null && <> · Vento: {grupo.vento >= 0 ? "+" : ""}{grupo.vento.toFixed(1)}</>}
                            </span>
                          </span>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: `2px solid ${t.border}`, color: t.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Pos</th>
                              <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: `2px solid ${t.border}`, color: t.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Raia</th>
                              <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: `2px solid ${t.border}`, color: t.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Peito</th>
                              <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: `2px solid ${t.border}`, color: t.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Atleta</th>
                              <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: `2px solid ${t.border}`, color: t.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Tempo</th>
                              <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: `2px solid ${t.border}`, color: t.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Status</th>
                              <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: `2px solid ${t.border}`, color: t.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Vento</th>
                            </tr>
                          </thead>
                          <tbody>
                            {grupo.entradas.map((ent, eIdx) => {
                              const statusVal = getValor(gIdx, eIdx, "status", ent.status || "");
                              return (
                                <tr key={eIdx} style={{ background: eIdx % 2 === 0 ? "transparent" : `${t.bgHeaderSolid}` }}>
                                  <td style={{ padding: "5px 8px", borderBottom: `1px solid ${t.border}`, color: t.textDimmed }}>{ent.posicaoLynx || "—"}</td>
                                  <td style={{ padding: "5px 8px", borderBottom: `1px solid ${t.border}` }}>
                                    <input type="text" value={getValor(gIdx, eIdx, "raia", ent.raia || "")} onChange={(ev) => editarEntrada(gIdx, eIdx, "raia", ev.target.value)}
                                      style={{ width: 40, background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 4, padding: "3px 6px", fontSize: 12, color: t.textSecondary, textAlign: "center" }} />
                                  </td>
                                  <td style={{ padding: "5px 8px", borderBottom: `1px solid ${t.border}`, fontWeight: 600, color: t.textSecondary }}>{ent.bib}</td>
                                  <td style={{ padding: "5px 8px", borderBottom: `1px solid ${t.border}`, fontWeight: 600, color: ent.nomeConflito ? t.danger : t.textPrimary }}>
                                    {ent.nomeAtleta}
                                    {ent.nomeConflito && (
                                      <div style={{ fontSize: 10, fontWeight: 400, color: t.warning, marginTop: 2 }}>
                                        .lif: {ent.nomeLif}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: "5px 8px", borderBottom: `1px solid ${t.border}` }}>
                                    {statusVal ? (
                                      <span style={{ fontWeight: 700, color: statusVal === "DNS" ? t.textDimmed : t.danger }}>{statusVal}</span>
                                    ) : (
                                      <input type="text" value={getValor(gIdx, eIdx, "marca", ent.marca != null ? fmtTempo(ent.marca) : "")}
                                        onChange={(ev) => editarEntrada(gIdx, eIdx, "marca", ev.target.value)}
                                        style={{ width: 80, background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 4, padding: "3px 6px", fontSize: 12, color: t.textSecondary, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }} />
                                    )}
                                  </td>
                                  <td style={{ padding: "5px 8px", borderBottom: `1px solid ${t.border}` }}>
                                    <select value={statusVal} onChange={(ev) => editarEntrada(gIdx, eIdx, "status", ev.target.value)}
                                      style={{ background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 4, padding: "3px 6px", fontSize: 11, color: statusVal ? t.danger : t.textMuted }}>
                                      {STATUS_OPCOES.map(op => <option key={op} value={op}>{op || "—"}</option>)}
                                    </select>
                                  </td>
                                  <td style={{ padding: "5px 8px", borderBottom: `1px solid ${t.border}` }}>
                                    <input type="text" value={getValor(gIdx, eIdx, "vento", ent.vento != null ? ent.vento : "")}
                                      onChange={(ev) => editarEntrada(gIdx, eIdx, "vento", ev.target.value)}
                                      style={{ width: 50, background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 4, padding: "3px 6px", fontSize: 12, color: t.textSecondary, textAlign: "center" }} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Feedback */}
              {importado && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: `${t.success}10`, border: `1px solid ${t.success}33`, color: t.success, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>✓</span>
                  Resultados importados com sucesso!
                </div>
              )}
              {erroImport && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: `${t.danger}10`, border: `1px solid ${t.danger}33`, color: t.danger, marginBottom: 12 }}>
                  ✕ {erroImport}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${t.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} disabled={importando}
            style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${t.border}`, background: "transparent", color: t.textSecondary, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
            {importado ? "Fechar" : "Cancelar"}
          </button>
          {conteudoLif && parseado && parseado.resultados.length > 0 && !importado && (
            <button onClick={handleImportar} disabled={importando}
              style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: t.success, color: "#fff", cursor: importando ? "wait" : "pointer", fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, opacity: importando ? 0.6 : 1 }}>
              {importando ? "Importando..." : `Confirmar Importação`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TelaDigitarResultados — componente principal (orquestrador de filtros)
   ════════════════════════════════════════════════════════════════════════════ */
function TelaDigitarResultados({ getPresencaProva }) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { usuarioLogado } = useAuth();
  const { inscricoes, atletas, resultados, atualizarResultado, atualizarResultadosEmLote, limparResultado, limparTodosResultados, eventoAtual, editarEvento, numeracaoPeito, getClubeAtleta, equipes, recordes } = useEvento();
  const { setTela, registrarAcao } = useApp();
  const marchaHook = useMarchaJuizes(eventoAtual?.id);
  // Guard: apenas admin, organizador dono ou funcionário com permissão
  const tipoUser = usuarioLogado?.tipo;
  const temAcessoDigitar = tipoUser === "admin"
    || (tipoUser === "organizador" && eventoAtual?.organizadorId === usuarioLogado?.id)
    || (tipoUser === "funcionario" && eventoAtual?.organizadorId === usuarioLogado?.organizadorId && usuarioLogado?.permissoes?.includes("resultados"));

  const [filtroProva, setFiltroProva] = useState("");
  const [filtroCat,   setFiltroCat]   = useState("");
  const [filtroSexo,  setFiltroSexo]  = useState("M");
  const [filtroFase,  setFiltroFase]  = useState("");
  const [mostrarImportLif, setMostrarImportLif] = useState(false);

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
    inscDoEvento.some(i => (i.categoriaId || i.categoriaOficialId) === c.id)
  );

  // Provas com inscrições, filtradas pela categoria selecionada (incluindo revezamentos)
  const provasComInscFiltradas = todasProvasComCombinadas.filter(p =>
    inscDoEvento.some(i => i.provaId === p.id &&
      (!filtroCat || (i.categoriaId || i.categoriaOficialId) === filtroCat)
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
  const _provaFases = _primeiroProvaId ? getFasesModo(_primeiroProvaId, eventoAtual?.configSeriacao || {}) : [];
  const _temFases = _provaFases.length > 1;
  const faseEfetiva = _temFases ? (filtroFase || _provaFases[0] || "") : "";

  if (!temAcessoDigitar) return (
    <div style={s.page}>
      <div style={s.emptyState}>
        <span style={{ fontSize: 48 }}>🚫</span>
        <p style={{ color: t.danger, fontWeight: 700 }}>Acesso não autorizado</p>
        <p style={{ color: t.textDimmed, fontSize: 14 }}>Você não tem permissão para digitar resultados.</p>
        <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>✏️ Digitar Resultados</h1>
          <div style={{ color: t.textDimmed, fontSize: 13 }}>{eventoAtual.nome}</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={s.btnSecondary} onClick={() => setMostrarImportLif(true)}>Importar .lif</button>
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
                    (i.categoriaId || i.categoriaOficialId) === c.id &&
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
          {/* Seletor de Fase — aparece quando o modo da seriação tem multi-fases */}
          {_temFases && (
            <div>
              <label style={s.label}>Fase *</label>
              <select style={{ ...s.select, borderColor: faseEfetiva === "ELI" ? `${t.warning}44` : faseEfetiva === "SEM" ? `${t.accent}44` : `${t.success}44`,
                color: faseEfetiva === "ELI" ? t.warning : faseEfetiva === "SEM" ? t.accent : t.success, fontWeight:700 }}
                value={filtroFase || _provaFases[0] || ""}
                onChange={(e) => { setFiltroFase(e.target.value); }}>
                {_provaFases.map(f => <option key={f} value={f}>{FASE_NOME[f] || f}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Modal Import .lif */}
      {mostrarImportLif && (
        <ModalImportLif
          eventoAtual={eventoAtual}
          inscricoes={inscricoes}
          atletas={atletas}
          equipes={equipes}
          numeracaoPeito={numeracaoPeito}
          atualizarResultadosEmLote={atualizarResultadosEmLote}
          onClose={() => setMostrarImportLif(false)}
          t={t}
        />
      )}

      {filtroProva && (() => {
        // Cada provaId no provasDef embute a categoria (ex: M_adulto_comp, M_sub16_comp).
        // Montar pares (provaId, catId) com inscrições no sexo selecionado.
        let pares = provaIdsDaSelecao.flatMap(p => {
          // Encontrar categorias com inscrição neste provaId + sexo
          const cats = [...new Set(
            inscDoEvento
              .filter(i => i.provaId === p.id && i.sexo === filtroSexo)
              .map(i => i.categoriaId || i.categoriaOficialId)
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
            getPresencaProva={getPresencaProva}
            marchaHook={marchaHook}
          />
        ));
      })()}
    </div>
  );
}


// ─── TELA: CONFIGURAR PONTUAÇÃO POR EQUIPES ─────────────────────────────────

export default TelaDigitarResultados;
