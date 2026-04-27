import React, { useState } from "react";
import { todasAsProvas, getComposicaoCombinada } from "../../shared/athletics/provasDef";
import { CATEGORIAS } from "../../shared/constants/categorias";
import { _getLocalEventoDisplay, NomeProvaComImplemento, abreviarProva, formatarMarca, formatarMarcaExibicao, _marcasComEmpateCentesimal, _marcaParaMs, resolverAtleta, formatarPeito } from "../../shared/formatters/utils";
import { RecordHelper } from "../../shared/engines/recordHelper";
import { TeamScoringEngine } from "../../shared/engines/teamScoringEngine";
import { CombinedEventEngine } from "../../shared/engines/combinedEventEngine";
import { CombinedScoringEngine } from "../../shared/engines/combinedScoringEngine";
import { getFasesModo, buscarSeriacao, resKey, FASE_NOME, FASE_ORDEM, getEntradasProva, resolverCronometragem } from "../../shared/constants/fases";
import { calcularEtapa, getEtapaLabel } from "../../shared/constants/etapas";
import { gerarHtmlImpressao } from "../impressao/gerarHtmlImpressao";
import { GT_DEFAULT_LOGO } from "../../shared/branding";
import { Th, Td } from "../ui/TableHelpers";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";
import { useMarchaJuizes } from "../../hooks/useMarchaJuizes";

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
  btnIconSmDanger: { background: t.bgCardAlt, border: `1px solid ${t.danger}33`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
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
  erro: { background: t.bgCardAlt, border: `1px solid ${t.danger}`, color: t.danger, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn: { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: t.fontBody, padding: 0 },
  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  badgeGold: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
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
  resumoInscricao: { background: t.bgCard, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: "16px 20px", marginTop: 16 },
  tagProva: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  sumuCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: t.fontTitle, fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  savedBadge: { background: t.bgCardAlt, border: `1px solid ${t.success}66`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
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
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: t.fontTitle, fontSize: 22, fontWeight: 800, color: t.textPrimary, lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: t.textDimmed },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: t.textMuted, flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? `${t.danger}15` : status === "hoje_pre" ? `${t.accent}15` : status === "futuro" ? `${t.success}15` : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textDimmed,
    border: `1px solid ${status === "ao_vivo" ? `${t.danger}44` : status === "hoje_pre" ? `${t.accent}44` : status === "futuro" ? `${t.success}44` : t.border}`,
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
  filtroPill: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textDimmed, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: t.fontTitle, letterSpacing: 0.5, transition: "all 0.15s" },
  filtroPillAtivo: { background: t.bgHover, border: `1px solid ${t.accent}`, color: t.accent },
  filtroClearBtn: { background: "none", border: "none", color: `${t.accent}88`, cursor: "pointer", fontSize: 11, fontFamily: t.fontBody, padding: "0 4px", textDecoration: "underline" },
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
};
}

// Item 8: exibe sigla da equipe quando disponível, com fallback para nome/clube
const getExibicaoEquipe = (atleta, equipes) => {
  if (atleta?._siglaEquipe) return atleta._siglaEquipe;
  const eq = (equipes||[]).find(e => e.id === atleta?.equipeId);
  if (eq) return (eq.sigla?.trim() || eq.nome || atleta?.clube || "—");
  return atleta?.clube || "—";
};

// Match de nome de prova ignorando parênteses (specs de implemento diferem por categoria)
const _nomeProvaMatch = (a, b) => {
  if (!a || !b) return false;
  if (a === b) return true;
  const strip = (s) => s.replace(/\s*\(.*?\)/g, "").trim().toLowerCase();
  return strip(a) === strip(b);
};

function TelaResultados() {
  const { usuarioLogado } = useAuth();
  const { inscricoes, atletas, resultados, eventoAtual, numeracaoPeito, equipes, getClubeAtleta, atualizarCamposEvento, recordes } = useEvento();
  const { setTela, organizadores } = useApp();
  const { marchaData } = useMarchaJuizes(eventoAtual?.id);
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const [filtroProva, setFiltroProva] = useState("todas");
  const [filtroCat, setFiltroCat] = useState("todas");
  const [filtroSexo, setFiltroSexo] = useState("todos");
  const [filtroEtapa, setFiltroEtapa] = useState("todas");
  const [abaClassifEquipe, setAbaClassifEquipe] = useState("geral");

  if (!eventoAtual) return (
    <div style={s.page}><div style={s.emptyState}><p>Selecione uma competição primeiro.</p>
      <button style={s.btnPrimary} onClick={() => setTela("home")}>Ver Competições</button></div></div>
  );

  const eid = eventoAtual.id;
  const todasProvas = todasAsProvas();
  const inscDoEvento = inscricoes.filter(i => i.eventoId === eid);

  const pausaHorario = (eventoAtual.programaPausa || {}).horario || "";
  const temEtapas = !!pausaHorario;
  const qtdEtapas = (eventoAtual.dataFim && eventoAtual.dataFim !== eventoAtual.data) ? 4 : 2;

  const getEtapaProva = (provaId) => {
    const entries = getEntradasProva(provaId, eventoAtual.programaHorario || {});
    const entry = entries[0];
    if (!entry?.horario || !pausaHorario) return null;
    return calcularEtapa(entry.horario, entry.dia || 1, pausaHorario);
  };

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

  // Categorias que têm inscrições nesta competição
  const categoriasComInscricao = CATEGORIAS.filter(c =>
    inscDoEvento.some(i => (i.categoriaId || i.categoriaOficialId) === c.id)
  );

  // Nomes de provas que têm inscrições, filtradas pela categoria selecionada
  const provasComInscFiltradas = todasProvasComCombinadas.filter(p =>
    inscDoEvento.some(i => i.provaId === p.id &&
      (filtroCat === "todas" || (i.categoriaId || i.categoriaOficialId) === filtroCat)
    )
  );
  const nomesProvasUnicos = [...new Set(provasComInscFiltradas.map(p => p.nome))].sort();

  // Categorias extras das inscrições de combinadas (ex: "COMB" de dados legados)
  const _catIdsExtras = [...new Set(
    inscDoEvento.filter(i => i.origemCombinada).map(i => i.categoriaId || i.categoriaOficialId).filter(Boolean)
  )].filter(cid => !CATEGORIAS.some(c => c.id === cid));
  // Pseudo-categorias para iterar (permitem encontrar resultados salvos com catId não-padrão)
  const categoriasParaBlocos = [...CATEGORIAS, ..._catIdsExtras.map(cid => ({ id: cid, nome: cid }))];

  const blocos = todasProvasComCombinadas.map((prova) => {
    const isRevez = prova.tipo === "revezamento";
    return ["M", "F"].map((sexo) => {
      // Para componentes de combinadas, usar lista expandida (inclui "COMB" etc.)
      const catsIterar = prova.origemCombinada ? categoriasParaBlocos : CATEGORIAS;
      return catsIterar.flatMap((cat) => {
        // Determinar chaves de resultados a verificar
        const _fases = getFasesModo(prova.id, eventoAtual.configSeriacao || {});
        const _semFase = { key: `${eid}_${prova.id}_${cat.id}_${sexo}`, fase: "" };
        const _keysToCheck = _fases.length > 0
          ? _fases.map(f => ({ key: resKey(eid, prova.id, cat.id, sexo, f), fase: f }))
          : [_semFase];


        return _keysToCheck.map(({ key, fase }) => {
        const res = resultados[key];
        if (!res || Object.keys(res).length === 0) return null;

        if (isRevez) {
          // Revezamento: entradas são por equipeId
          const inscsRevez = inscDoEvento.filter(i =>
            i.tipo === "revezamento" && i.provaId === prova.id &&
            (i.categoriaId || i.categoriaOficialId) === cat.id && i.sexo === sexo
          );
          const classificados = Object.entries(res)
            .map(([eqId, raw]) => {
              const marca = (raw != null && typeof raw === "object") ? (raw.marca ?? null) : raw;
              let status = (raw != null && typeof raw === "object") ? (raw.status || "") : "";
              if (!status && marca != null && ["DNS","DNF","NM","NH","DQ"].includes(String(marca).toUpperCase())) {
                status = String(marca).toUpperCase();
              }
              const isStatus = ["DNS","DNF","DQ","NM","NH"].includes(status);
              const insc = inscsRevez.find(i => i.equipeId === eqId);
              const eq = equipes.find(e => e.id === eqId);
              const nomeEquipe = eq ? (eq.clube || eq.nome || "—") : (eqId.startsWith("clube_") ? eqId.substring(6) : "—");
              const atletasIds = insc?.atletasIds || (raw?.atletasIds) || [];
              const atlsObj = atletasIds.map(aid => resolverAtleta(aid, atletas, eventoAtual)).filter(Boolean);
              return {
                atleta: { id: eqId, nome: nomeEquipe }, // "atleta" é na verdade a equipe (compatibilidade)
                equipeId: eqId, nomeEquipe, atletasRevez: atlsObj,
                marca: (!isStatus && marca != null) ? parseFloat(marca) : null, raw, status, isStatus,
                isRevezamento: true,
              };
            })
            .filter(x => x.marca != null && !isNaN(x.marca) || x.isStatus)
            .sort((a, b) => {
              if (a.isStatus && !b.isStatus) return 1;
              if (!a.isStatus && b.isStatus) return -1;
              if (a.marca != null && b.marca != null) return a.marca - b.marca;
              return 0;
            });
          if (classificados.length === 0) return null;
          // Para componentes de combinada com pseudo-categoria, mapear para a categoria real
          const catReal = (prova.origemCombinada && !CATEGORIAS.some(c => c.id === cat.id))
            ? (CATEGORIAS.find(c => c.id === prova.combinadaId?.split("_")[1]) || cat)
            : cat;
          return { prova, sexo, categoria: catReal, classificados, isRevezamento: true, faseSufixo: fase, faseNome: fase ? (FASE_NOME[fase] || fase) : "" };
        }

        const classificados = Object.entries(res)
          .map(([atletaId, raw]) => {
            const marca = (raw != null && typeof raw === "object") ? (raw.marca ?? null) : raw;
            let status = (raw != null && typeof raw === "object") ? (raw.status || "") : "";
            const dqRegra = (raw != null && typeof raw === "object") ? (raw.dqRegra || "") : "";
            // Fallback: detectar status pela marca quando campo status está vazio
            if (!status && marca != null && ["DNS","DNF","NM","NH","DQ"].includes(String(marca).toUpperCase())) {
              status = String(marca).toUpperCase();
            }
            const isStatus = ["DNS","DNF","NM","NH","DQ"].indexOf(status) !== -1;
            // Tenta achar pelo ID; se não achar (atleta excluído e reimportado),
            // recupera via inscrição pelo nome
            let atleta = resolverAtleta(atletaId, atletas, eventoAtual);
            if (!atleta) {
              const inscAtleta = inscDoEvento.find(i => i.atletaId === atletaId);
              if (inscAtleta) {
                const porNome = atletas.find(a => a.nome && inscAtleta.atletaNome &&
                  a.nome.trim().toLowerCase() === inscAtleta.atletaNome.trim().toLowerCase());
                atleta = porNome ? resolverAtleta(porNome.id, atletas, eventoAtual) || porNome : { id: atletaId, nome: inscAtleta.atletaNome || "Atleta removido", anoNasc: inscAtleta.anoNasc || "", sexo: inscAtleta.sexo || "", clube: inscAtleta.clube || "" };
              }
            }
            return { atleta, marca: (!isStatus && marca != null) ? parseFloat(marca) : null, raw, status, dqRegra, isStatus };
          })
          .filter((x) => x.atleta && (x.marca != null && !isNaN(x.marca) || x.isStatus))
          .sort((a, b) => {
            // Status entries always go to the end
            if (a.isStatus && !b.isStatus) return 1;
            if (!a.isStatus && b.isStatus) return -1;
            if (a.isStatus && b.isStatus) {
              // Pista: DNF, DNS, DQ / Campo: NM, DNS, DQ
              const isPista = prova.unidade === "s";
              const statusOrder = isPista
                ? { DNF: 0, DNS: 1, DQ: 2 }
                : { NM: 0, DNS: 1, DQ: 2 };
              return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
            }
            if (prova.unidade === "s") return a.marca - b.marca;
            if (b.marca !== a.marca)   return b.marca - a.marca;
            
            // Altura/Vara → RT 26.9: menor SU, depois menor FP
            const isAltVara = prova.tipo === "salto" && (prova.id.includes("altura") || prova.id.includes("vara"));
            if (isAltVara) {
              const getSU = (raw) => {
                if (!raw || typeof raw !== "object") return 0;
                const tObj = (raw.tentativas && typeof raw.tentativas === "object") ? raw.tentativas : {};
                const melhor = parseFloat(raw.marca);
                if (isNaN(melhor)) return 0;
                const alts = Array.isArray(raw.alturas) ? raw.alturas : [];
                const key = alts.find(h => Math.abs(parseFloat(h) - melhor) < 0.001);
                if (!key) return 0;
                const arr = Array.isArray(tObj[key]) ? tObj[key] : Array.isArray(tObj[parseFloat(key).toFixed(2)]) ? tObj[parseFloat(key).toFixed(2)] : [];
                return arr.filter(v => v === "X" || v === "O").length;
              };
              const getFP = (raw) => {
                if (!raw || typeof raw !== "object") return 0;
                const tObj = (raw.tentativas && typeof raw.tentativas === "object") ? raw.tentativas : {};
                const alts = Array.isArray(raw.alturas) ? raw.alturas : [];
                let total = 0;
                alts.forEach(h => {
                  const kStr = parseFloat(h).toFixed(2);
                  const arr = Array.isArray(tObj[h]) ? tObj[h] : Array.isArray(tObj[kStr]) ? tObj[kStr] : [];
                  // Só conta X das alturas que o atleta transpôs
                  if (arr.includes("O")) {
                    total += arr.filter(v => v === "X").length;
                  }
                });
                return total;
              };
              const suA = getSU(a.raw), suB = getSU(b.raw);
              if (suA !== suB) return suA - suB;
              const fpA = getFP(a.raw), fpB = getFP(b.raw);
              if (fpA !== fpB) return fpA - fpB;
              return 0;
            }
            
            // Demais campo → RT 25.22: sequência de melhores marcas
            const seqDesc = (raw) => {
              if (raw == null) return [];
              const obj = typeof raw === "object" ? raw : { marca: raw };
              return [obj.t1,obj.t2,obj.t3,obj.t4,obj.t5,obj.t6]
                .map(v => { const n = parseFloat(v); return isNaN(n) ? null : n; })
                .filter(n => n !== null).sort((x,y) => y - x);
            };
            const sa = seqDesc(a.raw), sb = seqDesc(b.raw);
            const len = Math.max(sa.length, sb.length);
            for (let i = 0; i < len; i++) {
              const va = sa[i] ?? -Infinity, vb = sb[i] ?? -Infinity;
              if (vb > va) return  1;
              if (va > vb) return -1;
            }
            return 0;
          });
        // Para componentes de combinada com pseudo-categoria, mapear para a categoria real
        const catReal = (prova.origemCombinada && !CATEGORIAS.some(c => c.id === cat.id))
          ? (CATEGORIAS.find(c => c.id === prova.combinadaId?.split("_")[1]) || cat)
          : cat;
        return { prova, sexo, categoria: catReal, classificados, faseSufixo: fase, faseNome: fase ? (FASE_NOME[fase] || fase) : "" };
        }).filter(Boolean);
      }).filter(Boolean);
    }).flat();
  }).flat().filter(Boolean);

  const blocosFiltrados = blocos.filter((b) => {
    if (filtroProva !== "todas" && b.prova.nome !== filtroProva) {
      // Se filtro é uma combinada, aceitar componentes dessa combinada
      if (!(b.prova.origemCombinada && b.prova.nomeCombinada === filtroProva)) return false;
    }
    if (filtroCat !== "todas" && b.categoria.id !== filtroCat) return false;
    if (filtroSexo !== "todos" && b.sexo !== filtroSexo) return false;
    if (filtroEtapa !== "todas") {
      const etNum = getEtapaProva(b.prova.id);
      if (String(etNum) !== filtroEtapa) return false;
    }
    return true;
  }).sort((a, b) => {
    const ea = getEntradasProva(a.prova.id, eventoAtual.programaHorario || {})[0];
    const eb = getEntradasProva(b.prova.id, eventoAtual.programaHorario || {})[0];
    const da = (ea?.dia || 1), db = (eb?.dia || 1);
    if (da !== db) return da - db;
    const ha = ea?.horario || "99:99", hb = eb?.horario || "99:99";
    return ha.localeCompare(hb);
  });

  // Gerar blocos de classificação de combinadas
  const blocosCombinadas = [];
  (eventoAtual.provasPrograma || []).forEach(provaId => {
    const provaInfo = todasProvas.find(p => p.id === provaId);
    if (!provaInfo || provaInfo.tipo !== "combinada") return;
    const sexoProva = provaId.startsWith("F_") ? "F" : "M";
    const catIdProva = provaId.split("_")[1] || "";
    // Coletar categorias reais das inscrições (podem incluir "COMB" por bug legado)
    const inscsCombi = inscDoEvento.filter(i => i.combinadaId === provaId);
    const catIdsInscs = [...new Set(inscsCombi.map(i => i.categoriaId || i.categoriaOficialId).filter(Boolean))];
    // Categoria para exibição: usar a do provaId (sempre válida em CATEGORIAS)
    const catId = catIdProva;
    const cat = CATEGORIAS.find(c => c.id === catId);
    if (!cat) return;
    if (filtroSexo !== "todos" && sexoProva !== filtroSexo) return;
    if (filtroCat !== "todas" && catId !== filtroCat) return;

    const comp = getComposicaoCombinada(provaId);
    if (!comp) return;
    const todasCompDaCombinada = CombinedEventEngine.gerarProvasComponentes(provaId, eid);
    const atletaIds = [...new Set(
      inscsCombi.map(i => i.atletaId)
    )];
    if (atletaIds.length === 0) return;

    // Verificar se tem ao menos 1 resultado em qualquer componente
    // Tentar com catId do provaId E categorias das inscrições (inclui "COMB" de dados legados)
    let temAlgumResultado = false;
    const catIdsTentar = [...new Set([catId, ...catIdsInscs])];
    todasCompDaCombinada.forEach(pc => {
      for (const cid of catIdsTentar) {
        const chaveR = `${eid}_${pc.id}_${cid}_${sexoProva}`;
        if (resultados[chaveR] && Object.keys(resultados[chaveR]).length > 0) temAlgumResultado = true;
      }
    });
    if (!temAlgumResultado) return;

    // Calcular pontuação de cada atleta
    const rows = atletaIds.map(aId => {
      const atl = resolverAtleta(aId, atletas, eventoAtual);
      let total = 0;
      let provasRealizadas = 0;
      const porProva = todasCompDaCombinada.map(pc => {
        // Procurar resultado em ambas as chaves de categoria
        let res = null;
        for (const cid of catIdsTentar) {
          const chaveR = `${eid}_${pc.id}_${cid}_${sexoProva}`;
          const r = resultados[chaveR]?.[aId];
          if (r != null) { res = r; break; }
        }
        const marca = res ? (typeof res === "object" ? res.marca : res) : null;
        const ptsManuais = res ? (typeof res === "object" ? res.pontosTabela : null) : null;
        const marcaNum = marca != null ? parseFloat(String(marca).replace(",", ".")) : null;
        const cronoAtl = resolverCronometragem(eventoAtual.cronometragemProvas, pc.id, eventoAtual.seriacao, catId, sexoProva, aId);
        const ptsAuto = (marcaNum != null && !isNaN(marcaNum)) ? CombinedScoringEngine.calcularPontosProva(pc.provaOriginalSufixo, marcaNum, sexoProva, provaId, cronoAtl, eventoAtual.regrasPontuacao) : 0;
        const pts = ptsManuais != null ? Number(ptsManuais) : ptsAuto;
        const statusAtl = res ? (typeof res === "object" ? res.status : null) : null;
        if ((marca != null && marca !== "") || statusAtl) provasRealizadas++;
        total += Number(pts) || 0;
        return { marca, pts: Number(pts) || 0, nome: pc.nome, ordem: pc.ordem, unidade: pc.unidade };
      });
      return { atletaId: aId, atleta: atl, nome: atl?.nome || "—", porProva, total, provasRealizadas };
    }).sort((a, b) => b.total - a.total);

    const totalComp = todasCompDaCombinada.length;
    // Conta quantas provas componentes já têm resultados salvos (ao menos 1 atleta)
    const provasComResultado = todasCompDaCombinada.filter(pc => {
      return catIdsTentar.some(cid => {
        const chaveR = `${eid}_${pc.id}_${cid}_${sexoProva}`;
        return resultados[chaveR] && Object.keys(resultados[chaveR]).length > 0;
      });
    }).length;
    const todasCompletas = provasComResultado >= totalComp;

    // Calcular pontos por equipe para a classificação final da combinada
    const ptsEqCombMap = {};
    if (eventoAtual.pontuacaoEquipes?.ativo && todasCompletas) {
      const classificadosComb = rows
        .filter(r => r.total > 0 && r.atleta)
        .map(r => ({ atleta: r.atleta, marca: r.total }));
      const _cfgPontComb = { ...(eventoAtual.pontuacaoEquipes || {}), equipeIdsFederados: eventoAtual.equipeIdsFederados || [] };
      const pontosComb = TeamScoringEngine.calcularPontosProva(classificadosComb, _cfgPontComb, atletas, equipes);
      Object.keys(pontosComb).forEach(eqId => {
        const info = pontosComb[eqId];
        (info.atletas || []).forEach(atlInfo => {
          if (atlInfo.atletaId) ptsEqCombMap[atlInfo.atletaId] = atlInfo.pontos;
        });
      });
    }

    blocosCombinadas.push({
      provaId, provaInfo, comp, sexo: sexoProva, categoria: cat,
      todasCompDaCombinada, rows, totalComp, todasCompletas, provasComResultado, ptsEqCombMap
    });
  });

  // Classificação por equipes — usar snapshot se competição finalizada
  const _usarSnapshotEquipes = eventoAtual?.competicaoFinalizada && eventoAtual?.snapshotClassifEquipes;
  const classifEquipes = _usarSnapshotEquipes
    ? eventoAtual.snapshotClassifEquipes
    : TeamScoringEngine.calcularClassificacaoEquipes(eventoAtual, inscricoes, resultados, atletas, equipes, recordes);
  const _cfgPontEq = eventoAtual.pontuacaoEquipes || {};
  const classifPorSexoAtivo = !!_cfgPontEq.classificacaoPorSexo && !!_cfgPontEq.ativo;
  const classifEquipesM = _usarSnapshotEquipes && eventoAtual.snapshotClassifEquipesM
    ? eventoAtual.snapshotClassifEquipesM
    : classifPorSexoAtivo ? TeamScoringEngine.calcularClassificacaoEquipes(eventoAtual, inscricoes, resultados, atletas, equipes, recordes, "M") : null;
  const classifEquipesF = _usarSnapshotEquipes && eventoAtual.snapshotClassifEquipesF
    ? eventoAtual.snapshotClassifEquipesF
    : classifPorSexoAtivo ? TeamScoringEngine.calcularClassificacaoEquipes(eventoAtual, inscricoes, resultados, atletas, equipes, recordes, "F") : null;

  const isAdmin = usuarioLogado?.tipo === "admin";
  const isOrg = usuarioLogado?.tipo === "organizador";
  const isFunc = usuarioLogado?.tipo === "funcionario";
  const isAmplo = isAdmin || isOrg || (isFunc && usuarioLogado?.permissoes?.includes("resultados"));

  // Gerar súmulas para impressão de resultados
  const handleImprimirResultados = () => {
    // Construir súmulas de impressão a partir dos blocosFiltrados (mesma fonte de dados exibida na tela)
    const sumuFiltradas = blocosFiltrados
      .filter(b => b.prova.tipo !== "combinada")
      .map(b => {
        const inscs = inscDoEvento.filter(i =>
          i.provaId === b.prova.id && (i.categoriaId || i.categoriaOficialId) === b.categoria.id && i.sexo === b.sexo
        );

        if (b.isRevezamento) {
          const equipesRevez = (b.classificados || []).map(c => {
            const eq = equipes.find(e => e.id === c.equipeId);
            return {
              equipeId: c.equipeId,
              nomeEquipe: c.nomeEquipe || (eq ? (eq.clube || eq.nome || "—") : "—"),
              sigla: eq?.sigla || "",
              atletasIds: (c.atletasRevez || []).map(a => a.id),
              atletas: c.atletasRevez || [],
            };
          });
          // Reconstruir resultados dict a partir dos classificados
          const resProva = {};
          (b.classificados || []).forEach(c => { if (c.raw != null) resProva[c.equipeId] = c.raw; });
          return { prova: b.prova, sexo: b.sexo, categoria: b.categoria, isRevezamento: true, equipesRevez, inscs, resultados: resProva, faseSufixo: b.faseSufixo || "", faseNome: b.faseNome || "" };
        }

        // Prova normal: reconstruir atletas e resultados a partir dos classificados
        const atletasInsc = (b.classificados || []).map(c => c.atleta).filter(Boolean);
        // Adicionar atletas inscritos que não estão nos classificados (caso gerarHtmlImpressao precise)
        const idsNosClass = new Set(atletasInsc.map(a => a.id));
        inscs.forEach(i => {
          if (!idsNosClass.has(i.atletaId)) {
            const a = resolverAtleta(i.atletaId, atletas, eventoAtual);
            if (a) atletasInsc.push(a);
          }
        });
        const resProva = {};
        (b.classificados || []).forEach(c => { if (c.raw != null && c.atleta) resProva[c.atleta.id] = c.raw; });
        return { prova: b.prova, sexo: b.sexo, categoria: b.categoria, atletas: atletasInsc, inscs, resultados: resProva, faseSufixo: b.faseSufixo || "", faseNome: b.faseNome || "" };
      });

    if (sumuFiltradas.length === 0 && blocosCombinadas.length === 0 && classifEquipes.classificacao.length === 0) {
      alert("Nenhum resultado para imprimir."); return;
    }
    const html = gerarHtmlImpressao(sumuFiltradas, eventoAtual, atletas, resultados, {}, numeracaoPeito[eventoAtual?.id] || {}, equipes, recordes, { modo: "resultados", marchaData });

    // Gerar HTML extra para classificação final das combinadas e pontuação por equipes
    let htmlExtra = "";

    // Cabeçalho e rodapé reutilizáveis para páginas extras
    const _branding2 = (() => { try { return JSON.parse(localStorage.getItem("gt_branding")) || {}; } catch { return {}; } })();
    const _gtLogo2 = _branding2.logo || GT_DEFAULT_LOGO;
    const dataGeracao2 = new Date().toLocaleString("pt-BR");
    const dataEvento2 = new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });
    const cabExtra = `
      <div class="cab">
        <div class="cab-left">
          ${eventoAtual.logoCabecalho ? `<img src="${eventoAtual.logoCabecalho}" alt=""/>` : ""}
        </div>
        <div class="cab-c">
          <div class="cab-ev">${eventoAtual.nome}</div>
          <div class="cab-dt">\u{1F4C5} ${dataEvento2} \u00a0\u00b7\u00a0 \u{1F4CD} ${_getLocalEventoDisplay(eventoAtual)}</div>
        </div>
        <div style="text-align:right;">
          ${eventoAtual.logoCabecalhoDireito ? `<div class="cab-logo"><img src="${eventoAtual.logoCabecalhoDireito}" alt="" style="max-height:24mm;max-width:45mm;object-fit:contain;" /></div>` : ""}
        </div>
      </div>`;
    const rodExtra = `
      <div class="rod" style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px;padding-top:8px;border-top:1px solid #ccc;gap:10px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:6px;">
          <div style="flex:1;max-width:185px;text-align:center;"><div style="border-bottom:1px solid #aaa;margin-bottom:4px;height:22px;"></div><div style="font-size:9px;color:#555;">\u00c1rbitro Respons\u00e1vel</div></div>
        </div>
        <div style="text-align:center;font-size:8px;color:#888;min-width:100px;">
          <div>Gerado em: ${dataGeracao2}</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:0;">
            <span>Plataforma de Competi\u00e7\u00f5es -</span>
            <img src="${_gtLogo2}" alt="GERENTRACK" style="max-height:8mm;object-fit:contain;opacity:0.7;vertical-align:middle;" />
          </div>
        </div>
      </div>
      ${eventoAtual.logoRodape ? `<div style="margin-top:1px;text-align:center;"><img src="${eventoAtual.logoRodape}" alt="" style="max-width:100%;max-height:15mm;object-fit:contain;"/></div>` : ""}`;

    // ── Classificação final das Combinadas — mostra quando filtro é "todas" ou é a combinada filtrada ──
    blocosCombinadas.filter(bc => filtroProva === "todas" || bc.comp.nome === filtroProva || bc.provaInfo.nome === filtroProva).forEach(bc => {
      if (!bc.todasCompletas && bc.rows.length === 0) return;
      const labelStatus = bc.todasCompletas ? "CLASSIFICAÇÃO FINAL" : "CLASSIFICAÇÃO PARCIAL";
      const corStatus = bc.todasCompletas ? "#2a8a2a" : "#8a7a00";
      const pontEqAtivo = eventoAtual.pontuacaoEquipes?.ativo && bc.todasCompletas;
      htmlExtra += `
        <div class="pg" style="padding:12mm 14mm 10mm">
          ${cabExtra}
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;margin-top:10px">
            <span style="font-size:16px;font-weight:800;color:#111">${bc.comp.nome}</span>
            <span style="font-size:10px;padding:2px 8px;border-radius:4px;font-weight:700;background:${bc.todasCompletas ? "#e8ffe8" : "#fff8e0"};color:${corStatus};border:1px solid ${corStatus}">${labelStatus}</span>
          </div>
          <div style="font-size:10px;color:#666;margin-bottom:8px">
            ${bc.categoria.nome} — ${bc.sexo === "M" ? "Masculino" : "Feminino"} — ${bc.provasComResultado || 0}/${bc.totalComp} provas
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead>
              <tr style="border-bottom:2px solid #333">
                <th style="padding:6px 8px;text-align:left;width:40px">Pos.</th>
                <th style="padding:6px 8px;text-align:center;width:35px">Nº</th>
                <th style="padding:6px 8px;text-align:left">Atleta</th>
                <th style="padding:6px 8px;text-align:left">Clube/Equipe</th>
                ${bc.todasCompDaCombinada.map(pc => `<th style="padding:4px 3px;text-align:center;font-size:8px">${abreviarProva(pc.nome)}</th>`).join("")}
                <th style="padding:6px 8px;text-align:center;font-weight:800;color:#8a7000">Total</th>
                ${pontEqAtivo ? `<th style="padding:6px 8px;text-align:center;font-weight:800;background:#fffde0;color:#8a7000">Pts Eq.</th>` : ""}
              </tr>
            </thead>
            <tbody>
              ${bc.rows.map((r, idx) => {
                const pos = (idx+1)+"º";
                const atl = r.atleta || resolverAtleta(r.atletaId, atletas, eventoAtual);
                const clube = atl ? (getExibicaoEquipe(atl, equipes) || "—") : "—";
                const numP = formatarPeito((numeracaoPeito?.[eid]||{})[r.atletaId]);
                return `<tr style="border-bottom:1px solid #ddd;${idx < 3 ? "background:#f9f9f0" : ""}">
                  <td style="padding:6px 8px;font-weight:700">${pos}</td>
                  <td style="padding:6px 8px;text-align:center;color:#888;font-size:10px">${numP}</td>
                  <td style="padding:6px 8px;font-weight:600">${r.nome}</td>
                  <td style="padding:6px 8px;color:#666;font-size:9px">${clube}</td>
                  ${r.porProva.map(pp => `<td style="padding:3px 2px;text-align:center;font-size:9px">${pp.marca != null && pp.marca !== "" ? `<div>${formatarMarca(pp.marca, pp.unidade, 2)}</div><div style="font-weight:700;color:#8a7000">${pp.pts}</div>` : "—"}</td>`).join("")}
                  <td style="padding:6px 8px;text-align:center;font-weight:800;font-size:13px;color:#8a7000">${r.total}</td>
                  ${pontEqAtivo ? `<td style="padding:6px 8px;text-align:center;background:#fffde0;font-weight:800;color:#8a7000">${bc.ptsEqCombMap[r.atletaId] || "—"}</td>` : ""}
                </tr>`;
              }).join("")}
            </tbody>
          </table>
          ${!bc.todasCompletas ? `<div style="margin-top:6px;font-size:9px;color:#888;text-align:center">Classificação parcial — faltam resultados de algumas provas</div>` : ""}
          ${rodExtra}
        </div>`;
    });

    // ── Classificação por Equipes — só quando sem filtro de prova ──
    if (filtroProva === "todas" && classifEquipes.classificacao.length > 0) {
      const labelEq = classifEquipes.totalProvasComResultado >= classifEquipes.totalProvas ? "CLASSIFICAÇÃO FINAL" : "CLASSIFICAÇÃO PARCIAL";
      const corEq = classifEquipes.totalProvasComResultado >= classifEquipes.totalProvas ? "#2a8a2a" : "#8a7a00";
      htmlExtra += `
        <div class="pg" style="padding:12mm 14mm 10mm">
          ${cabExtra}
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;margin-top:10px">
            <span style="font-size:16px;font-weight:800;color:#111">Classificação por Equipes</span>
            <span style="font-size:10px;padding:2px 8px;border-radius:4px;font-weight:700;background:${classifEquipes.totalProvasComResultado >= classifEquipes.totalProvas ? "#e8ffe8" : "#fff8e0"};color:${corEq};border:1px solid ${corEq}">${labelEq}</span>
          </div>
          <div style="font-size:10px;color:#666;margin-bottom:8px">
            ${classifEquipes.totalProvasComResultado}/${classifEquipes.totalProvas} provas com resultado — ${eventoAtual.nome}
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead>
              <tr style="border-bottom:2px solid #333">
                <th style="padding:6px 8px;text-align:left;width:40px">Pos</th>
                <th style="padding:6px 8px;text-align:left">Equipe</th>
                <th style="padding:6px 8px;text-align:left;width:60px">Sigla</th>
                <th style="padding:6px 8px;text-align:center;width:80px">Provas</th>
                ${classifEquipes.totalBonusRecordes > 0 ? `<th style="padding:6px 8px;text-align:center;width:70px;color:#996600">Bônus Rec.</th>` : ""}
                <th style="padding:6px 8px;text-align:center;width:70px;font-weight:800;color:#8a7000">Total</th>
              </tr>
            </thead>
            <tbody>
              ${classifEquipes.classificacao.map((eq, idx) => {
                const pos = (idx+1)+"º";
                const nProvas = Object.keys(eq.pontosPorProva).length;
                const totalBonus = (eq.bonusRecordes || []).reduce((acc, b) => acc + b.pontos, 0);
                const bonusDetail = (eq.bonusRecordes || []).map(b => `${b.tipoSigla} ${b.provaNome} (+${b.pontos})`).join(", ");
                return `<tr style="border-bottom:1px solid #ddd;${idx < 3 ? "background:#f9f9f0" : ""}">
                  <td style="padding:6px 8px;font-weight:700">${pos}</td>
                  <td style="padding:6px 8px;font-weight:600">${eq.nome}${bonusDetail ? `<div style="font-size:8px;color:#996600;margin-top:1px">${bonusDetail}</div>` : ""}</td>
                  <td style="padding:6px 8px;color:#8a7000;font-weight:600">${eq.sigla}</td>
                  <td style="padding:6px 8px;text-align:center;color:#666">${nProvas}</td>
                  ${classifEquipes.totalBonusRecordes > 0 ? `<td style="padding:6px 8px;text-align:center;color:#996600;font-weight:700">${totalBonus > 0 ? "+" + totalBonus : "—"}</td>` : ""}
                  <td style="padding:6px 8px;text-align:center;font-weight:800;font-size:16px;color:#8a7000">${eq.totalPontos}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
          ${rodExtra}
        </div>`;
    }

    // Injetar htmlExtra antes do </body>
    const htmlFinal = htmlExtra ? html.replace("</body>", htmlExtra + "</body>") : html;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { alert("Permita pop-ups para gerar a impressão."); return; }
    win.document.open(); win.document.write(htmlFinal); win.document.close();
  };

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>Resultados</h1>
          <div style={{ color: t.textDimmed, fontSize: 13 }}>{eventoAtual.nome}</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {isAmplo && (blocosFiltrados.length > 0 || blocosCombinadas.length > 0 || classifEquipes.classificacao.length > 0) && (
            <button style={{ ...s.btnPrimary, display: "flex", alignItems: "center", gap: 8 }} onClick={handleImprimirResultados}>
              Imprimir Resultados
              <span style={{ background: "#00000033", borderRadius: 10, padding: "1px 8px", fontSize: 11 }}>
                {blocosFiltrados.length}
              </span>
            </button>
          )}
          {isAmplo && (
            <button style={s.btnSecondary} onClick={() => setTela("digitar-resultados")}>Inserir Resultados</button>
          )}
          <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Competição</button>
        </div>
      </div>

      <div style={s.filtros}>
        <div>
          <label style={s.label}>Categoria</label>
          <select style={s.select} value={filtroCat} onChange={(e) => { setFiltroCat(e.target.value); setFiltroProva("todas"); }}>
            <option value="todas">Todas</option>
            {categoriasComInscricao.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label style={s.label}>Prova</label>
          <select style={s.select} value={filtroProva} onChange={(e) => setFiltroProva(e.target.value)}>
            <option value="todas">Todas</option>
            {nomesProvasUnicos.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
          </select>
        </div>
        <div>
          <label style={s.label}>Sexo</label>
          <select style={s.select} value={filtroSexo} onChange={(e) => setFiltroSexo(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
        </div>
        {temEtapas && (
          <div>
            <label style={s.label}>Etapa</label>
            <select style={s.select} value={filtroEtapa} onChange={(e) => setFiltroEtapa(e.target.value)}>
              <option value="todas">Todas</option>
              {Array.from({ length: qtdEtapas }, (_, idx) => idx + 1).map(n => (
                <option key={n} value={String(n)}>{getEtapaLabel(n)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Classificação por Equipes — oculta quando filtro de prova ativo */}
      {filtroProva === "todas" && classifEquipes.classificacao.length > 0 && (() => {
        const _classifAtiva = abaClassifEquipe === "masc" && classifEquipesM ? classifEquipesM
          : abaClassifEquipe === "fem" && classifEquipesF ? classifEquipesF
          : classifEquipes;
        const _tituloAba = abaClassifEquipe === "masc" ? "Classificação por Equipes — Masculino"
          : abaClassifEquipe === "fem" ? "Classificação por Equipes — Feminino"
          : "Classificação por Equipes" + (classifPorSexoAtivo ? " — Geral" : "");
        return (
        <div style={{
          background: t.bgCard, border:`1px solid ${t.accentBorder}`,
          borderRadius:12, marginBottom:24, overflow:"hidden",
        }}>
          <div style={{ padding:"14px 20px", background:t.bgHeaderSolid, borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontFamily: t.fontTitle, fontSize:22, fontWeight:800, color: t.textPrimary, marginBottom:4, display: "flex", alignItems: "center", gap: 10 }}>
                <span>{_tituloAba}</span>
                <span style={{
                  fontSize: 11, padding: "2px 10px", borderRadius: 4, fontWeight: 600,
                  background: _classifAtiva.totalProvasComResultado >= _classifAtiva.totalProvas ? `${t.success}15` : `${t.accent}15`,
                  color: _classifAtiva.totalProvasComResultado >= _classifAtiva.totalProvas ? t.success : t.accent,
                }}>
                  {_classifAtiva.totalProvasComResultado >= _classifAtiva.totalProvas ? "CLASSIFICAÇÃO FINAL" : "CLASSIFICAÇÃO PARCIAL"}
                </span>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginTop:6 }}>
                <span style={{ color: t.textTertiary, fontSize: 13 }}>
                  {_classifAtiva.totalProvasComResultado}/{_classifAtiva.totalProvas} provas com resultado
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {isAmplo && (
              <button
                style={{ ...s.btnGhost, fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }}
                onClick={() => {
                  const _br = (() => { try { return JSON.parse(localStorage.getItem("gt_branding")) || {}; } catch { return {}; } })();
                  const _gl = _br.logo || GT_DEFAULT_LOGO;
                  const _dg = new Date().toLocaleString("pt-BR");
                  const _de = new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

                  const _gerarPagina = (dados, titulo, isLast) => {
                    if (!dados || dados.classificacao.length === 0) return "";
                    const isFin = dados.totalProvasComResultado >= dados.totalProvas;
                    return `<div class="pg"${!isLast ? ` style="page-break-after:always;"` : ""}>
                    <div class="pg-content">
                    <div class="cab">
                      <div class="cab-left">${eventoAtual.logoCabecalho ? `<img src="${eventoAtual.logoCabecalho}" alt=""/>` : ""}</div>
                      <div class="cab-c"><div class="cab-ev">${eventoAtual.nome}</div><div class="cab-dt">\u{1F4C5} ${_de} \u00a0\u00b7\u00a0 \u{1F4CD} ${_getLocalEventoDisplay(eventoAtual)}</div></div>
                      <div style="text-align:right;">${eventoAtual.logoCabecalhoDireito ? `<img src="${eventoAtual.logoCabecalhoDireito}" alt="" style="max-height:24mm;max-width:45mm;object-fit:contain;" />` : ""}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;margin-top:10px">
                      <span style="font-size:13px;font-weight:800">${titulo}</span>
                      <span style="font-size:8px;padding:2px 6px;border-radius:4px;font-weight:700;border:1px solid ${isFin ? "#2a8a2a" : "#8a7a00"};color:${isFin ? "#2a8a2a" : "#8a7a00"}">${isFin ? "CLASSIFICAÇÃO FINAL" : "CLASSIFICAÇÃO PARCIAL"}</span>
                    </div>
                    <div style="font-size:8px;color:#666;margin-bottom:6px">${eventoAtual.nome} — ${dados.totalProvasComResultado}/${dados.totalProvas} provas com resultado</div>
                    <table><thead><tr>
                      <th style="width:40px">Pos</th><th>Equipe</th><th style="width:60px">Sigla</th>
                      <th style="text-align:center;width:80px">Provas</th>
                      ${dados.totalBonusRecordes > 0 ? `<th style="text-align:center;width:70px">Bônus Rec.</th>` : ""}
                      ${dados.totalPenalidades > 0 ? `<th style="text-align:center;width:70px">Penal.</th>` : ""}
                      <th style="text-align:center;width:70px;font-weight:800">Total</th>
                    </tr></thead><tbody>
                    ${dados.classificacao.map((eq, idx) => {
                      const nProvas = Object.keys(eq.pontosPorProva).length;
                      const totalBonus = (eq.bonusRecordes || []).reduce((acc, b) => acc + b.pontos, 0);
                      const bonusDetail = (eq.bonusRecordes || []).map(b => `${b.tipoSigla} ${b.provaNome} (+${b.pontos})`).join(", ");
                      const totalPenPrint = (eq.penalidades || []).reduce((acc, p) => acc + p.pontos, 0);
                      const penDetail = (eq.penalidades || []).map(p => `${p.motivo}${p.obs ? " — " + p.obs : ""} (-${p.pontos})`).join(", ");
                      return `<tr${idx < 3 ? ` class="top3"` : ""}>
                        <td style="font-weight:700">${(idx+1)+"º"}</td>
                        <td style="font-weight:600">${eq.nome}${bonusDetail ? `<div style="font-size:7px;color:#996600;margin-top:1px">${bonusDetail}</div>` : ""}${penDetail ? `<div style="font-size:7px;color:#cc0000;margin-top:1px">${penDetail}</div>` : ""}</td>
                        <td style="font-weight:600">${eq.sigla}</td>
                        <td style="text-align:center;color:#666">${nProvas}</td>
                        ${dados.totalBonusRecordes > 0 ? `<td style="text-align:center;color:#996600;font-weight:700">${totalBonus > 0 ? "+" + totalBonus : "—"}</td>` : ""}
                        ${dados.totalPenalidades > 0 ? `<td style="text-align:center;color:#cc0000;font-weight:700">${totalPenPrint > 0 ? "-" + totalPenPrint : "—"}</td>` : ""}
                        <td style="text-align:center;font-weight:800;font-size:13px">${eq.totalPontos}</td>
                      </tr>`;
                    }).join("")}
                    </tbody></table>
                    </div>
                    <div class="rod-wrap">
                      <div style="text-align:center;font-size:8px;color:#888;padding-top:8px;border-top:1px solid #ccc;">
                        <div>Gerado em: ${_dg}</div>
                        <div>Plataforma de Competi\u00e7\u00f5es - GERENTRACK</div>
                      </div>
                      ${eventoAtual.logoRodape ? `<div style="margin-top:8px;text-align:center;"><img src="${eventoAtual.logoRodape}" alt="" style="max-width:100%;max-height:15mm;object-fit:contain;"/></div>` : ""}
                      <div style="margin-top:8px;text-align:center;padding-top:6px;border-top:1px solid #e0e0e0;">
                        <div style="font-size:7px;color:#999;letter-spacing:1px;margin-bottom:3px;">Desenvolvido por:</div>
                        <img src="${_gl}" alt="GERENTRACK" style="max-height:8mm;object-fit:contain;opacity:0.7;" />
                      </div>
                    </div>
                    </div>`;
                  };

                  let paginasHtml;
                  if (classifPorSexoAtivo) {
                    paginasHtml = _gerarPagina(classifEquipes, "Classificação por Equipes — Geral", false)
                      + _gerarPagina(classifEquipesM, "Classificação por Equipes — Masculino", false)
                      + _gerarPagina(classifEquipesF, "Classificação por Equipes — Feminino", true);
                  } else {
                    paginasHtml = _gerarPagina(classifEquipes, "Classificação por Equipes", true);
                  }

                  const htmlEq = `<html><head><meta charset="utf-8"><title>Classificação por Equipes</title>
                    <style>body{font-family:Arial,sans-serif;margin:0;padding:0;font-size:9px}
                    .pg{display:flex;flex-direction:column;min-height:297mm;padding:12mm 14mm 10mm;box-sizing:border-box}
                    .pg-content{flex:1}
                    .rod-wrap{flex-shrink:0;margin-top:auto;padding-top:10px}
                    table{width:100%;border-collapse:collapse}th,td{padding:4px 6px;border-bottom:1px solid #ddd}
                    th{text-align:left;border-bottom:2px solid #333}
                    .top3{background:#f9f9f0}
                    .cab{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:7px;margin-bottom:7px;border-bottom:3px solid #111;gap:10px;}
                    .cab-left{display:flex;align-items:center;min-width:45mm;}.cab-left img{max-height:28mm;max-width:45mm;object-fit:contain;}
                    .cab-c{flex:1;text-align:center;}.cab-ev{font-size:12px;font-weight:800;color:#111;text-transform:uppercase;letter-spacing:.5px;line-height:1.2;}
                    .cab-dt{font-size:8px;color:#555;margin-top:2px;}
                    @media print{@page{margin:0}.pg{min-height:100vh;padding:10mm 12mm 8mm}}</style></head><body>
                    ${paginasHtml}
                    </body></html>`;
                  const win = window.open("", "_blank", "width=900,height=700");
                  if (!win) { alert("Permita pop-ups."); return; }
                  win.document.open(); win.document.write(htmlEq); win.document.close();
                }}
                title="Imprimir classificação por equipes"
              >
                Imprimir
              </button>
            )}
            </div>
          </div>

          {/* Abas Geral / Masculino / Feminino */}
          {classifPorSexoAtivo && (
            <div style={{ display: "flex", gap: 0, background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}` }}>
              {[{ key: "geral", label: "Geral" }, { key: "masc", label: "Masculino" }, { key: "fem", label: "Feminino" }].map(function(aba) {
                var sel = abaClassifEquipe === aba.key;
                return (
                  <button key={aba.key} onClick={function() { setAbaClassifEquipe(aba.key); }}
                    style={{
                      background: sel ? t.bgCard : "transparent", border: "none", borderBottom: sel ? `2px solid ${t.accent}` : "2px solid transparent",
                      color: sel ? t.accent : t.textMuted, padding: "10px 20px", cursor: "pointer",
                      fontSize: 13, fontWeight: sel ? 700 : 400, fontFamily: t.fontTitle, letterSpacing: 0.5,
                      transition: "all 0.2s",
                    }}>
                    {aba.label}
                  </button>
                );
              })}
            </div>
          )}

          {_classifAtiva.classificacao.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: t.textDisabled, fontSize: 13 }}>
              Nenhuma equipe pontuou nesta classificação.
            </div>
          ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${t.border}` }}>
                  <th style={{ padding: "8px", textAlign: "left", color: t.textMuted, fontSize: 11 }}>Pos</th>
                  <th style={{ padding: "8px", textAlign: "left", color: t.textMuted, fontSize: 11 }}>Equipe</th>
                  <th style={{ padding: "8px", textAlign: "left", color: t.textMuted, fontSize: 11 }}>Sigla</th>
                  <th style={{ padding: "8px", textAlign: "center", color: t.textMuted, fontSize: 11 }}>Provas Pontuadas</th>
                  {_classifAtiva.totalBonusRecordes > 0 && (
                    <th style={{ padding: "8px", textAlign: "center", color: t.warning, fontSize: 11 }}>Bônus Rec.</th>
                  )}
                  {_classifAtiva.totalPenalidades > 0 && (
                    <th style={{ padding: "8px", textAlign: "center", color: t.danger, fontSize: 11 }}>Penal.</th>
                  )}
                  <th style={{ padding: "8px", textAlign: "center", color: t.accent, fontWeight: 700, fontSize: 13 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {_classifAtiva.classificacao.map(function(eq, idx) {
                  var nProvasPontuadas = Object.keys(eq.pontosPorProva).length;
                  var totalBonus = (eq.bonusRecordes || []).reduce(function(acc, b) { return acc + b.pontos; }, 0);
                  return (
                    <React.Fragment key={eq.equipeId}>
                    <tr style={{
                      borderBottom: ((eq.bonusRecordes && eq.bonusRecordes.length > 0) || (eq.penalidades && eq.penalidades.length > 0)) ? "none" : `1px solid ${t.border}`,
                      background: idx === 0 ? t.bgMarca : idx < 3 ? t.trTop : "transparent"
                    }}>
                      <td style={{
                        padding: "10px 8px", fontWeight: 700, fontSize: 15,
                        color: idx === 0 ? t.gold : idx === 1 ? "#C0C0C0" : idx === 2 ? "#CD7F32" : t.textMuted
                      }}>
                        {(idx + 1) + "º"}
                      </td>
                      <td style={{ padding: "10px 8px", color: t.textPrimary, fontWeight: 600 }}>{eq.nome}</td>
                      <td style={{ padding: "10px 8px", color: t.accent, fontWeight: 600 }}>{eq.sigla}</td>
                      <td style={{ padding: "10px 8px", textAlign: "center", color: t.textTertiary }}>{nProvasPontuadas}</td>
                      {_classifAtiva.totalBonusRecordes > 0 && (
                        <td style={{ padding: "10px 8px", textAlign: "center", color: totalBonus > 0 ? t.warning : t.textDisabled, fontWeight: 700 }}>
                          {totalBonus > 0 ? "+" + totalBonus : "—"}
                        </td>
                      )}
                      {_classifAtiva.totalPenalidades > 0 && (() => {
                        var totalPen = (eq.penalidades || []).reduce(function(acc, p) { return acc + p.pontos; }, 0);
                        return (
                          <td style={{ padding: "10px 8px", textAlign: "center", color: totalPen > 0 ? t.danger : t.textDisabled, fontWeight: 700 }}>
                            {totalPen > 0 ? "-" + totalPen : "—"}
                          </td>
                        );
                      })()}
                      <td style={{ padding: "10px 8px", textAlign: "center", color: t.accent, fontWeight: 700, fontSize: 18 }}>{eq.totalPontos}</td>
                    </tr>
                    {eq.bonusRecordes && eq.bonusRecordes.length > 0 && (
                      <tr style={{ borderBottom: (eq.penalidades && eq.penalidades.length > 0) ? "none" : `1px solid ${t.border}`, background: idx === 0 ? t.bgMarca : idx < 3 ? t.trTop : "transparent" }}>
                        <td colSpan={5 + (_classifAtiva.totalBonusRecordes > 0 ? 1 : 0) + (_classifAtiva.totalPenalidades > 0 ? 1 : 0)} style={{ padding: "0 8px 8px 44px" }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {eq.bonusRecordes.map(function(b, bi) {
                              return (
                                <span key={bi} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: t.bgCardAlt, color: t.warning, border: `1px solid ${t.warning}44` }}>
                                  {b.tipoSigla} {b.provaNome} — {b.atletaNome} (+{b.pontos}pts)
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                    {eq.penalidades && eq.penalidades.length > 0 && (
                      <tr style={{ borderBottom: `1px solid ${t.border}`, background: idx === 0 ? t.bgMarca : idx < 3 ? t.trTop : "transparent" }}>
                        <td colSpan={5 + (_classifAtiva.totalBonusRecordes > 0 ? 1 : 0) + (_classifAtiva.totalPenalidades > 0 ? 1 : 0)} style={{ padding: "0 8px 8px 44px" }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {eq.penalidades.map(function(pen, pi) {
                              return (
                                <span key={pi} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: `${t.danger}10`, color: t.danger, border: `1px solid ${t.danger}33` }}>
                                  {pen.motivo}{pen.obs ? " — " + pen.obs : ""} (-{pen.pontos}pts)
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}

          {_classifAtiva.provasPendentes && _classifAtiva.provasPendentes.length > 0 && (
            <details style={{ padding: "10px 16px", borderTop: `1px solid ${t.border}` }}>
              <summary style={{ fontSize: 11, color: t.textMuted, cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 9 }}>▸</span>
                <span>Classificação parcial — faltam resultados em {_classifAtiva.provasPendentes.length} prova(s) · clique para ver</span>
              </summary>
              <ul style={{ margin: "8px 0 0 18px", padding: 0, fontSize: 11, color: t.textMuted, lineHeight: 1.6 }}>
                {_classifAtiva.provasPendentes.map(function(p, i) { return <li key={i}>{p.label}</li>; })}
              </ul>
            </details>
          )}
        </div>
        );
      })()}

      {blocosFiltrados.length === 0 && blocosCombinadas.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize: 48 }}>—</span>
          <p>Nenhum resultado publicado ainda.</p>
        </div>
      ) : (
        <div>
          {/* Classificação das Combinadas — mostra quando filtro é "todas" ou é a combinada filtrada */}
          {blocosCombinadas.filter(bc => filtroProva === "todas" || bc.comp.nome === filtroProva || bc.provaInfo.nome === filtroProva).map((bc, bcIdx) => {
            // Classificação apenas federados para combinadas
            const _cfgFedComb = { ...(eventoAtual.pontuacaoEquipes || {}), equipeIdsFederados: eventoAtual.equipeIdsFederados || [] };
            const _fedAtivoComb = _cfgFedComb.classificacaoApenasFederados
              && Array.isArray(_cfgFedComb.equipeIdsFederados) && _cfgFedComb.equipeIdsFederados.length > 0;
            const _fedSetComb = _fedAtivoComb ? new Set(_cfgFedComb.equipeIdsFederados) : null;
            const _ehFedComb = (atl) => {
              if (!_fedAtivoComb) return true;
              const eqId = atl?.equipeId || equipes.find(eq => eq.nome === atl?.clube)?.id;
              return eqId && _fedSetComb.has(eqId) && atl?.cbat && String(atl.cbat).trim() !== "";
            };
            const _posLabelsComb = (() => {
              if (!_fedAtivoComb) return bc.rows.map((r, j) => `${j+1}º`);
              let pf = 0;
              return bc.rows.map(r => {
                const atl = r.atleta || atletas.find(a => a.id === r.atletaId);
                if (_ehFedComb(atl)) { pf++; return `${pf}º`; }
                return "";
              });
            })();
            return (
            <div key={"comb" + bcIdx} style={{
              background: t.bgCard, border:`1px solid ${t.border}`,
              borderRadius:12, marginBottom:20, overflow:"hidden",
            }}>
              <div style={{ padding:"14px 20px", background:t.bgHeaderSolid, borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontFamily: t.fontTitle, fontSize:22, fontWeight:800, color: t.textPrimary, marginBottom:4, display: "flex", alignItems: "center", gap: 10 }}>
                    <span>{bc.comp.nome}</span>
                    <span style={{
                      fontSize: 11, padding: "2px 10px", borderRadius: 4, fontWeight: 600,
                      background: bc.todasCompletas ? `${t.success}15` : `${t.accent}15`,
                      color: bc.todasCompletas ? t.success : t.accent,
                    }}>
                      {bc.todasCompletas ? "CLASSIFICAÇÃO FINAL" : "CLASSIFICAÇÃO PARCIAL"}
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginTop:6 }}>
                    <span style={s.badgeGold}>Categoria: {bc.categoria.nome}</span>
                    <span style={s.badge(bc.sexo === "M" ? "#1a6ef5" : "#e54f9b")}>
                      {bc.sexo === "M" ? "Masculino" : "Feminino"}
                    </span>
                    <span style={{ color: t.textTertiary, fontSize: 13 }}>
                      {bc.provasComResultado || 0}/{bc.totalComp} provas
                    </span>
                  </div>
                </div>
                {isAmplo && (
                  <button
                    style={{ ...s.btnGhost, fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }}
                    onClick={() => {
                      const pontEqAtivo = eventoAtual.pontuacaoEquipes?.ativo && bc.todasCompletas;
                      const _br3 = (() => { try { return JSON.parse(localStorage.getItem("gt_branding")) || {}; } catch { return {}; } })();
                      const _gl3 = _br3.logo || GT_DEFAULT_LOGO;
                      const _dg3 = new Date().toLocaleString("pt-BR");
                      const _de3 = new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
                      const htmlComb = `<html><head><meta charset="utf-8"><title>Classificação ${bc.comp.nome}</title>
                        <style>body{font-family:Arial,sans-serif;margin:0;padding:12mm 14mm 30mm;font-size:11px;min-height:297mm;display:flex;flex-direction:column;position:relative}
                        table{width:100%;border-collapse:collapse}th,td{padding:5px 6px;border-bottom:1px solid #ddd}
                        th{text-align:left;border-bottom:2px solid #333;font-size:10px}
                        .top3{background:#f9f9f0}
                        .cab{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:7px;margin-bottom:7px;border-bottom:3px solid #111;gap:10px;}
                        .cab-left{display:flex;align-items:center;min-width:45mm;}.cab-left img{max-height:28mm;max-width:45mm;object-fit:contain;}
                        .cab-c{flex:1;text-align:center;}.cab-ev{font-size:14px;font-weight:800;color:#111;text-transform:uppercase;letter-spacing:.5px;line-height:1.2;}
                        .cab-dt{font-size:10px;color:#555;margin-top:3px;}
                        .rod-wrap{position:absolute;bottom:0;left:0;right:0;padding:0 14mm 10mm;}
                        .rod{display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px;padding-top:8px;border-top:1px solid #ccc;gap:10px;}
                        .rod-ass{flex:1;text-align:center;}.rod-ln{border-bottom:1px solid #333;margin-bottom:3px;height:30px;}.rod-lb{font-size:9px;color:#555;}
                        .rod-info{text-align:center;font-size:8px;color:#888;min-width:100px;}
                        @media print{@page{margin:10mm}body{height:100vh}}</style></head><body>
                        <div class="cab">
                          <div class="cab-left">${eventoAtual.logoCabecalho ? `<img src="${eventoAtual.logoCabecalho}" alt=""/>` : ""}</div>
                          <div class="cab-c"><div class="cab-ev">${eventoAtual.nome}</div><div class="cab-dt">\u{1F4C5} ${_de3} \u00a0\u00b7\u00a0 \u{1F4CD} ${_getLocalEventoDisplay(eventoAtual)}</div></div>
                          <div style="text-align:right;">${eventoAtual.logoCabecalhoDireito ? `<img src="${eventoAtual.logoCabecalhoDireito}" alt="" style="max-height:24mm;max-width:45mm;object-fit:contain;" />` : ""}</div>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;margin-top:10px">
                          <span style="font-size:16px;font-weight:800">${bc.comp.nome}</span>
                          <span style="font-size:10px;padding:2px 8px;border-radius:4px;font-weight:700;border:1px solid ${bc.todasCompletas ? "#2a8a2a" : "#8a7a00"};color:${bc.todasCompletas ? "#2a8a2a" : "#8a7a00"}">${bc.todasCompletas ? "CLASSIFICAÇÃO FINAL" : "CLASSIFICAÇÃO PARCIAL"}</span>
                        </div>
                        <div style="font-size:10px;color:#666;margin-bottom:4px">${eventoAtual.nome} — ${bc.categoria.nome} — ${bc.sexo === "M" ? "Masculino" : "Feminino"}</div>
                        <table><thead><tr>
                          <th style="width:30px">Pos.</th><th style="width:30px;text-align:center">Nº</th><th style="width:52px;text-align:center">CBAt</th><th>Atleta</th><th>Clube/Equipe</th>
                          ${bc.todasCompDaCombinada.map(pc => `<th style="text-align:center;font-size:8px">${abreviarProva(pc.nome)}</th>`).join("")}
                          <th style="text-align:center;font-weight:800">Total</th>
                          ${pontEqAtivo ? `<th style="text-align:center;font-weight:800;background:#fffde0">Pts Eq.</th>` : ""}
                        </tr></thead><tbody>
                        ${bc.rows.map((r, idx) => {
                          const atl = r.atleta || resolverAtleta(r.atletaId, atletas, eventoAtual);
                          const clube = atl ? (getExibicaoEquipe(atl, equipes) || "") : "";
                          return `<tr${idx < 3 ? ` class="top3"` : ""}>
                            <td style="font-weight:700">${_posLabelsComb[idx]}</td>
                            <td style="text-align:center;color:#888;font-size:10px">${formatarPeito((numeracaoPeito?.[eid]||{})[r.atletaId])}</td>
                            <td style="text-align:center;color:#888;font-size:9px">${atl?.cbat || ""}</td>
                            <td>${r.nome}</td><td style="color:#666;font-size:9px">${clube}</td>
                            ${r.porProva.map(pp => `<td style="text-align:center;font-size:9px">${pp.marca != null && pp.marca !== "" ? `<div>${formatarMarca(pp.marca, pp.unidade, 2)}</div><div style="font-weight:700;color:#8a7000">${pp.pts}</div>` : "—"}</td>`).join("")}
                            <td style="text-align:center;font-weight:800;font-size:13px;color:#8a7000">${r.total}</td>
                            ${pontEqAtivo ? `<td style="text-align:center;font-weight:800;background:#fffde0;color:#8a7000">${bc.ptsEqCombMap[r.atletaId] || "—"}</td>` : ""}
                          </tr>`;
                        }).join("")}
                        </tbody></table>
                        <div class="rod" style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px;padding-top:8px;border-top:1px solid #ccc;gap:10px;">
                          <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:6px;">
                            <div style="flex:1;max-width:185px;text-align:center;"><div style="border-bottom:1px solid #aaa;margin-bottom:4px;height:22px;"></div><div style="font-size:9px;color:#555;">\u00c1rbitro Respons\u00e1vel</div></div>
                          </div>
                          <div style="text-align:center;font-size:8px;color:#888;min-width:100px;">
                            <div>Gerado em: ${_dg3}</div>
                            <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:0;">
                              <span>Plataforma de Competi\u00e7\u00f5es -</span>
                              <img src="${_gl3}" alt="GERENTRACK" style="max-height:8mm;object-fit:contain;opacity:0.7;vertical-align:middle;" />
                            </div>
                          </div>
                        </div>
                        ${eventoAtual.logoRodape ? `<div style="margin-top:1px;text-align:center;"><img src="${eventoAtual.logoRodape}" alt="" style="max-width:100%;max-height:15mm;object-fit:contain;"/></div>` : ""}
                        <script>window.addEventListener('load',function(){document.querySelectorAll('.pg').forEach(function(pg){var rod=pg.querySelector('.rod-wrap');if(!rod)return;var pgH=pg.offsetHeight;var rodH=rod.offsetHeight;var dH=pgH-rodH;var cH=0;for(var i=0;i<pg.children.length;i++){var c=pg.children[i];if(c===rod)continue;cH+=c.offsetHeight+(parseFloat(getComputedStyle(c).marginTop)||0)+(parseFloat(getComputedStyle(c).marginBottom)||0);}if(cH>dH){var s=Math.max(0.55,dH/cH);for(var j=0;j<pg.children.length;j++){if(pg.children[j]===rod)continue;pg.children[j].style.fontSize=(s*100)+'%';pg.children[j].querySelectorAll('table').forEach(function(t){t.style.fontSize=(s*100)+'%';});}}});});<\/script>
                        </body></html>`;
                      const win = window.open("", "_blank", "width=900,height=700");
                      if (!win) { alert("Permita pop-ups."); return; }
                      win.document.open(); win.document.write(htmlComb); win.document.close();
                    }}
                    title="Imprimir classificação desta combinada"
                  >
                    Imprimir
                  </button>
                )}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${t.border}` }}>
                      <th style={{ padding: "8px", textAlign: "left", color: t.textMuted, fontSize: 11 }}>Pos.</th>
                      <th style={{ padding: "8px", textAlign: "center", color: t.textMuted, fontSize: 11 }}>Nº</th>
                      <th style={{ padding: "8px", textAlign: "center", color: t.textMuted, fontSize: 11 }}>CBAt</th>
                      <th style={{ padding: "8px", textAlign: "left", color: t.textMuted, fontSize: 11 }}>Atleta</th>
                      <th style={{ padding: "8px", textAlign: "left", color: t.textMuted, fontSize: 11 }}>Clube/Equipe</th>
                      {bc.todasCompDaCombinada.map(function(pc) {
                        return (
                          <th key={pc.id} style={{
                            padding: "6px 4px", textAlign: "center", color: t.textMuted,
                            fontSize: 10, minWidth: 60
                          }}>
                            {abreviarProva(pc.nome)}
                          </th>
                        );
                      })}
                      <th style={{ padding: "8px", textAlign: "center", color: t.accent, fontWeight: 700, fontSize: 13 }}>
                        Total
                      </th>
                      {eventoAtual.pontuacaoEquipes?.ativo && bc.todasCompletas && (
                        <th style={{ padding: "8px", textAlign: "center", background: t.accentBg, color: t.accent, fontWeight: 700, fontSize: 11 }}>
                          Pts Eq.
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {bc.rows.map(function(r, idx) {
                      return (
                        <tr key={r.atletaId} style={{
                          borderBottom: `1px solid ${t.border}`,
                          background: idx === 0 ? t.bgMarca : idx < 3 ? t.trTop : "transparent"
                        }}>
                          <td style={{
                            padding: "8px", fontWeight: 700, fontSize: 14,
                            color: idx === 0 ? t.gold : idx === 1 ? "#C0C0C0" : idx === 2 ? "#CD7F32" : t.textMuted
                          }}>
                            {_posLabelsComb[idx]}
                          </td>
                          <td style={{ padding: "8px", textAlign: "center", color: t.textDimmed, fontSize: 12, fontWeight: 600 }}>
                            {formatarPeito((numeracaoPeito?.[eid]||{})[r.atletaId])}
                          </td>
                          <td style={{ padding: "8px", textAlign: "center", color: t.textDimmed, fontSize: 11 }}>
                            {r.atleta?.cbat || ""}
                          </td>
                          <td style={{ padding: "8px", color: t.textPrimary, fontWeight: 500, whiteSpace: "nowrap" }}>
                            {r.nome}
                          </td>
                          <td style={{ padding: "8px", color: t.textMuted, fontSize: 11, whiteSpace: "nowrap" }}>
                            {r.atleta ? (getExibicaoEquipe(r.atleta, equipes) || "") : ""}
                          </td>
                          {r.porProva.map(function(pp, ppIdx) {
                            return (
                              <td key={ppIdx} style={{
                                padding: "4px", textAlign: "center",
                                color: pp.marca != null && pp.marca !== "" ? t.textSecondary : t.textDisabled,
                              }}>
                                {pp.marca != null && pp.marca !== "" ? (
                                  <div>
                                    <div style={{ fontSize: 10, color: t.textTertiary }}>{formatarMarca(pp.marca, pp.unidade, 2)}</div>
                                    <div style={{ fontSize: 11, color: t.accent, fontWeight: 600 }}>{pp.pts}</div>
                                  </div>
                                ) : "—"}
                              </td>
                            );
                          })}
                          <td style={{
                            padding: "8px", textAlign: "center",
                            color: t.accent, fontWeight: 700, fontSize: 16
                          }}>
                            {r.total}
                          </td>
                          {eventoAtual.pontuacaoEquipes?.ativo && bc.todasCompletas && (
                            <td style={{ padding: "8px", textAlign: "center", background: t.accentBg }}>
                              {bc.ptsEqCombMap[r.atletaId] ? (
                                <span style={{ color: t.accent, fontWeight: 700, fontSize: 14 }}>{bc.ptsEqCombMap[r.atletaId]}</span>
                              ) : <span style={{ color: t.textDisabled }}>—</span>}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!bc.todasCompletas && (
                <div style={{ padding: "10px 16px", fontSize: 11, color: t.textMuted, borderTop: `1px solid ${t.border}` }}>
                  Classificação parcial — faltam resultados de algumas provas
                </div>
              )}
            </div>
          ); })}

          {/* Resultados normais das provas individuais */}
          {blocosFiltrados.map((b, i) => {
          // Set de marcas empatadas no centésimo para exibição com 3ª casa entre parênteses
          const _msEmpatadosBloco = (() => {
            if (b.prova.unidade !== "s") return new Set();
            const marcasMs = b.classificados.filter(x => !x.isStatus && x.marca != null).map(x => {
              const v = parseFloat(x.marca);
              return !isNaN(v) ? Math.round(v >= 1000 ? v : v * 1000) : null;
            }).filter(v => v != null);
            return _marcasComEmpateCentesimal(marcasMs);
          })();
          return (
          <div key={i} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, marginBottom:20, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", background:t.bgHeaderSolid, borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
              <div>
                <div style={{ fontFamily: t.fontTitle, fontSize:22, fontWeight:800, color: t.textPrimary, marginBottom:4 }}>
                  <NomeProvaComImplemento nome={b.prova.nome} />
                  {b.prova.origemCombinada && (
                    <span style={{ fontSize: 11, background: t.accentBg, color: t.accent, padding: "2px 8px", borderRadius: 4, marginLeft: 8, fontWeight: 600 }}>
                      {b.prova.nomeCombinada} ({b.prova.ordem}/{b.prova.totalProvas})
                    </span>
                  )}
                  {b.faseNome && (
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, marginLeft: 8, fontWeight: 700,
                      background: b.faseSufixo === "ELI" ? `${t.warning}15` : b.faseSufixo === "SEM" ? t.accentBg : `${t.success}15`,
                      color: b.faseSufixo === "ELI" ? t.warning : b.faseSufixo === "SEM" ? t.accent : t.success }}>
                      {b.faseNome}
                    </span>
                  )}
                  {b.prova.unidade === "s" && (() => {
                    const cp = eventoAtual.cronometragemProvas || {};
                    const temPorSerie = Object.keys(cp).some(k => k.startsWith(`${b.prova.id}__S`));
                    if (temPorSerie) return null;
                    if (cp[b.prova.id] !== "MAN") return null;
                    return (
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, marginLeft: 8, fontWeight: 700,
                        background: `${t.warning}15`, color: t.warning }}>
                        Cronometragem Manual
                      </span>
                    );
                  })()}
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginTop:6 }}>
                  <span style={s.badgeGold}>Categoria: {b.categoria.nome}</span>
                  <span style={s.badge(b.sexo === "M" ? "#1a6ef5" : "#e54f9b")}>{b.sexo === "M" ? "Masculino" : "Feminino"}</span>
                  {(() => {
                    const etNum = getEtapaProva(b.prova.id);
                    if (!etNum) return null;
                    return (
                      <span style={{ fontSize: 11, background: `${t.accent}18`, color: t.accent, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                        {getEtapaLabel(etNum)}
                      </span>
                    );
                  })()}
                </div>
                {/* Recordes vinculados ao evento (recordesSumulas - independente de competicoesVinculadas) */}
                {(() => {
                  const recIds = eventoAtual?.recordesSumulas || [];
                  if (recIds.length === 0) return null;
                  const linhas = [];
                  recIds.forEach(recId => {
                    const tipo = (recordes || []).find(r => r.id === recId);
                    if (!tipo) return;
                    const reg = tipo.registros.find(r => r.provaId === b.prova.id && r.categoriaId === b.categoria.id && r.sexo === b.sexo);
                    if (reg) {
                      const atletasTxt = RecordHelper.getAtletaTexto(reg);
                      const equipeTxt = RecordHelper.getEquipeTexto(reg);
                      const anoTxt = RecordHelper.getAnoTexto(reg);
                      linhas.push({ sigla: tipo.sigla, marca: formatarMarca(reg.marca, reg.unidade, 3), atleta: atletasTxt, equipe: equipeTxt, ano: anoTxt });
                    }
                  });
                  if (linhas.length === 0) return null;
                  return (
                    <div style={{ padding:"3px 10px", background: t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:4, fontSize:10, color: t.textSecondary, marginTop:4 }}>
                      {linhas.map((l, i) => (
                        <span key={i}>
                          {i > 0 && " · "}
                          <strong style={{ color: t.accent }}>{l.sigla}:</strong>{" "}
                          <span style={{ color: t.accent, fontWeight:700 }}>{l.marca}</span>{" "}
                          — {l.atleta} ({l.equipe}) — {l.ano}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
              {isAmplo && (
                <button
                  style={{ ...s.btnGhost, fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }}
                  onClick={() => {
                    const inscs = inscDoEvento.filter(ii =>
                      ii.provaId === b.prova.id && (ii.categoriaId || ii.categoriaOficialId) === b.categoria.id && ii.sexo === b.sexo
                    );
                    let sumu;
                    if (b.isRevezamento) {
                      const equipesRevez = (b.classificados || []).map(c => {
                        const eq = equipes.find(e => e.id === c.equipeId);
                        return {
                          equipeId: c.equipeId,
                          nomeEquipe: c.nomeEquipe || (eq ? (eq.clube || eq.nome || "—") : "—"),
                          sigla: eq?.sigla || "",
                          atletasIds: (c.atletasRevez || []).map(a => a.id),
                          atletas: c.atletasRevez || [],
                        };
                      });
                      const resProva = {};
                      (b.classificados || []).forEach(c => { if (c.raw != null) resProva[c.equipeId] = c.raw; });
                      sumu = { prova: b.prova, sexo: b.sexo, categoria: b.categoria, isRevezamento: true, equipesRevez, inscs, resultados: resProva, faseSufixo: b.faseSufixo || "", faseNome: b.faseNome || "" };
                    } else {
                      const atletasInsc = (b.classificados || []).map(c => c.atleta).filter(Boolean);
                      const idsNosClass = new Set(atletasInsc.map(a => a.id));
                      inscs.forEach(i => {
                        if (!idsNosClass.has(i.atletaId)) {
                          const a = resolverAtleta(i.atletaId, atletas, eventoAtual);
                          if (a) atletasInsc.push(a);
                        }
                      });
                      const resProva = {};
                      (b.classificados || []).forEach(c => { if (c.raw != null && c.atleta) resProva[c.atleta.id] = c.raw; });
                      sumu = { prova: b.prova, sexo: b.sexo, categoria: b.categoria, atletas: atletasInsc, inscs, resultados: resProva, faseSufixo: b.faseSufixo || "", faseNome: b.faseNome || "" };
                    }
                    const htmlInd = gerarHtmlImpressao([sumu], eventoAtual, atletas, resultados, {}, numeracaoPeito[eventoAtual?.id] || {}, equipes, recordes, { modo: "resultados", marchaData });
                    const win = window.open("", "_blank", "width=900,height=700");
                    if (!win) { alert("Permita pop-ups para gerar a impressão."); return; }
                    win.document.open(); win.document.write(htmlInd); win.document.close();
                  }}
                  title="Imprimir resultado desta prova"
                >
                  Imprimir
                </button>
              )}
            </div>
            {(() => {
              const isCampoBlk = b.prova.unidade !== "s" &&
                !(b.prova.tipo === "salto" && (b.prova.id.includes("altura") || b.prova.id.includes("vara")));
              const isCorridaBlk = b.prova.unidade === "s";
              const isAlturaVara = b.prova.tipo === "salto" && (b.prova.id.includes("altura") || b.prova.id.includes("vara"));
              const metros = (() => { const m = b.prova.id.match(/[_x]?(\d+)m/); return m ? parseInt(m[1]) : 0; })();
              const temRaiaBlk  = isCorridaBlk && metros <= 400;
              const temVentoBlk = isCorridaBlk && metros <= 200;
              const isCombPistaBlk = isCorridaBlk && b.prova.origemCombinada === true;
              const isCombPistaSeriavel = isCombPistaBlk && metros > 0 && metros <= 400;

              // Calcular série de cada atleta a partir da seriação salva
              const serieDoAtletaBlk = {};
              const raiaDoAtletaBlk = {};
              const _serBlk = buscarSeriacao(eventoAtual.seriacao, b.prova.id, b.categoria.id, b.sexo, b.faseSufixo || "");
              if (_serBlk?.series && _serBlk.series.length > 0) {
                _serBlk.series.forEach(ser => {
                  ser.atletas.forEach(a => {
                    const aid = a.id || a.atletaId;
                    serieDoAtletaBlk[aid] = ser.numero;
                    if (a.raia) raiaDoAtletaBlk[aid] = a.raia;
                  });
                });
              } else if (isCombPistaSeriavel) {
                // Fallback para combinadas: divisão simples se não tem seriação
                const MAX_SERIE = 8;
                const inscBlk = inscDoEvento.filter(ii =>
                  ii.provaId === b.prova.id && (ii.categoriaId || ii.categoriaOficialId) === b.categoria.id && ii.sexo === b.sexo
                );
                const atletasInscritos = inscBlk.map(ii => ii.atletaId);
                const totalSer = Math.ceil(atletasInscritos.length / MAX_SERIE);
                if (totalSer > 1) {
                  for (let si = 0; si < totalSer; si++) {
                    atletasInscritos.slice(si*MAX_SERIE, (si+1)*MAX_SERIE).forEach(aId => {
                      serieDoAtletaBlk[aId] = si + 1;
                    });
                  }
                }
              }
              const temSerieBlk = Object.keys(serieDoAtletaBlk).length > 0;

              // Pontuação por equipes — SÓ na final ou sem fase (legado). Eliminatória/semifinal NÃO pontuam.
              const isFaseFinal = !b.faseSufixo || b.faseSufixo === "FIN";
              // Só mostra pontuação quando o ÚLTIMO resultado da prova for digitado
              const isRevezBlk = b.prova.tipo === "revezamento" || b.isRevezamento;
              const chaveBlkPont = resKey(eid, b.prova.id, b.categoria.id, b.sexo, b.faseSufixo || "");
              const resBlkObj = resultados[chaveBlkPont] || {};
              const entradasBrutas = Object.keys(resBlkObj).length;
              // Para fases com seriação (SEM/FIN), contar apenas atletas na seriação (classificados)
              const _serBlkPont = b.faseSufixo ? buscarSeriacao(eventoAtual.seriacao, b.prova.id, b.categoria.id, b.sexo, b.faseSufixo) : null;
              const _inscsBase = inscDoEvento.filter(i =>
                i.provaId === b.prova.id &&
                (i.categoriaId || i.categoriaOficialId) === b.categoria.id &&
                i.sexo === b.sexo &&
                (isRevezBlk ? i.tipo === "revezamento" : i.tipo !== "revezamento")
              );
              const inscsBlkPont = (_serBlkPont?.series && _serBlkPont.series.length > 0)
                ? _serBlkPont.series.flatMap(ser => ser.atletas.map(a => ({ atletaId: a.id || a.atletaId })))
                : _inscsBase;
              // Para provas de campo com tentativas (salto/lançamento, exceto altura/vara):
              // só pontuam quando TODOS os atletas têm T3 preenchido ou têm status (DNS/NM/DQ)
              const isAltVaraBlk = b.prova.tipo === "salto" && (b.prova.id.includes("altura") || b.prova.id.includes("vara"));
              const isCampoTentBlk = b.prova.unidade !== "s" && !isAltVaraBlk && !isRevezBlk;
              let provaCompletaBlk;
              if (inscsBlkPont.length === 0) {
                provaCompletaBlk = true;
              } else if (isCampoTentBlk) {
                // Completa quando todos têm T3 (eliminados não têm T4-T6, mas já pontuam)
                provaCompletaBlk = entradasBrutas >= inscsBlkPont.length &&
                  inscsBlkPont.every(i => {
                    const raw = resBlkObj[i.atletaId];
                    if (!raw) return false;
                    const status = typeof raw === "object" ? (raw.status || "") : "";
                    if (["DNS","NM","DQ"].includes(status)) return true;
                    const t3 = typeof raw === "object" ? raw.t3 : null;
                    const t6 = typeof raw === "object" ? raw.t6 : null;
                    if (t6 != null && t6 !== "") return true; // top8 completo
                    if (t3 != null && t3 !== "") return true; // eliminado, basta T3
                    return false;
                  });
              } else {
                provaCompletaBlk = entradasBrutas >= inscsBlkPont.length;
              }
              const pontuacaoAtiva = eventoAtual.pontuacaoEquipes?.ativo === true && !b.prova.origemCombinada && isFaseFinal && provaCompletaBlk;
              const _cfgPontBlk = { ...(eventoAtual.pontuacaoEquipes || {}), equipeIdsFederados: eventoAtual.equipeIdsFederados || [] };
              const pontosEquipeBlk = pontuacaoAtiva
                ? TeamScoringEngine.calcularPontosProva(b.classificados.filter(item => !item.isStatus && item.marca != null), _cfgPontBlk, atletas, equipes)
                : {};
              // Mapear atletaId → pontos (respeita limite de atletas por equipe)
              const ptsEqPorAtleta = {};
              // Quando classificacaoApenasFederados: posição vazia para não-federados
              const _fedAtivo = _cfgPontBlk.classificacaoApenasFederados
                && Array.isArray(_cfgPontBlk.equipeIdsFederados) && _cfgPontBlk.equipeIdsFederados.length > 0;
              const _fedSet = _fedAtivo ? new Set(_cfgPontBlk.equipeIdsFederados) : null;
              const _ehFederado = (atl) => {
                if (!_fedAtivo) return true;
                const eqId = atl?.equipeId || equipes.find(eq => eq.nome === atl?.clube)?.id;
                return eqId && _fedSet.has(eqId) && atl?.cbat && String(atl.cbat).trim() !== "";
              };
              // Gerar posLabel: quando federados ativo, não-federados ficam sem posição
              const _gerarPosLabels = (classificadosList) => {
                if (!_fedAtivo) return classificadosList.map((item, j) => item.isStatus ? "" : `${j+1}º`);
                let posFed = 0;
                return classificadosList.map(item => {
                  if (item.isStatus) return "";
                  if (_ehFederado(item.atleta)) { posFed++; return `${posFed}º`; }
                  return "";
                });
              };
              if (pontuacaoAtiva) {
                Object.keys(pontosEquipeBlk).forEach(eqId => {
                  const info = pontosEquipeBlk[eqId];
                  (info.atletas || []).forEach(atlInfo => {
                    // Buscar por atletaId (posição pode diferir quando classificacaoApenasFederados ativo)
                    if (atlInfo.atletaId) ptsEqPorAtleta[atlInfo.atletaId] = atlInfo.pontos;
                  });
                });
              }

              // ── Agrupamento por série e Q/q para fases ELI/SEM ──
              const isFaseComSeries = (b.faseSufixo === "ELI" || b.faseSufixo === "SEM") && !b.isRevezamento;
              let seriesPorAtleta = {}; // atletaId → numero da série
              let classifQq = {}; // atletaId → "Q"|"q"|""
              let seriacaoFaseBlk = null;

              if (isFaseComSeries) {
                // Buscar seriação desta fase para agrupar por série
                seriacaoFaseBlk = buscarSeriacao(eventoAtual.seriacao, b.prova.id, b.categoria.id, b.sexo, b.faseSufixo);
                if (seriacaoFaseBlk?.series) {
                  seriacaoFaseBlk.series.forEach(ser => {
                    ser.atletas.forEach(a => {
                      seriesPorAtleta[a.id || a.atletaId] = ser.numero;
                    });
                  });
                }

                // Buscar seriação da PRÓXIMA fase para determinar Q/q
                const fasesConf = getFasesModo(b.prova.id, eventoAtual.configSeriacao || {});
                const idxAtual = FASE_ORDEM.indexOf(b.faseSufixo);
                const proximaFase = FASE_ORDEM[idxAtual + 1];
                if (proximaFase && fasesConf.includes(proximaFase)) {
                  const serProxima = buscarSeriacao(eventoAtual.seriacao, b.prova.id, b.categoria.id, b.sexo, proximaFase);
                  if (serProxima?.series) {
                    // Atletas na próxima fase — verificar origemClassif
                    serProxima.series.forEach(ser => {
                      ser.atletas.forEach(a => {
                        const aid = a.id || a.atletaId;
                        if (a.origemClassif === "posicao") classifQq[aid] = "Q";
                        else if (a.origemClassif === "tempo") classifQq[aid] = "q";
                        else classifQq[aid] = "Q"; // fallback se não tem info
                      });
                    });
                  }
                }
              }

              // Montar lista de séries para iteração (se agrupado) ou null (se unificado)
              const seriesParaRender = isFaseComSeries && seriacaoFaseBlk?.series
                ? [...seriacaoFaseBlk.series].sort((a2, b2) => {
                    return a2.numero - b2.numero;
                  })
                : null;

              // Detectar desempate por RT 25.22 em provas de campo
              const temDesempateBlk = isCampoBlk && (() => {
                const comMarca = b.classificados.filter(x => !x.isStatus && x.marca != null);
                if (comMarca.length < 2) return false;
                for (let ii = 0; ii < comMarca.length - 1; ii++) {
                  if (comMarca[ii].marca === comMarca[ii+1].marca) return true;
                }
                return false;
              })();

              // Detectar desempate por RT 26.9 em saltos verticais
              const temDesempateAltBlk = isAlturaVara && (() => {
                const comMarca = b.classificados.filter(x => !x.isStatus && x.marca != null);
                if (comMarca.length < 2) return false;
                for (let ii = 0; ii < comMarca.length - 1; ii++) {
                  if (comMarca[ii].marca === comMarca[ii+1].marca) return true;
                }
                return false;
              })();

              // helper: formata tentativa (número, X ou vazio)
              const fmtTent = (v, isBest = false) => {
                if (v === "" || v == null) return <span style={{ color: t.textDisabled }}>—</span>;
                const s2 = String(v).trim().toUpperCase();
                if (s2 === "X") return <span style={{ color: t.danger, fontWeight:800 }}>X</span>;
                const n = parseFloat(v);
                if (isNaN(n)) return <span style={{ color: t.textDimmed }}>{v}</span>;

                // Highlight best attempt
                return <span style={{
                  color: isBest ? t.success : t.textTertiary,
                  fontWeight: isBest ? 800 : 400,
                  fontSize: isBest ? 14 : 13
                }}>{n.toFixed(2).replace(".",",")}</span>;
              };

              // Para cada item, pega as tentativas do raw
              const getTent = (raw, key) => {
                if (raw == null) return "";
                if (typeof raw === "object") return raw[key] ?? "";
                return "";
              };
              
              // Encontra qual tentativa é a melhor (para destacar)
              const getBestTentIndex = (raw) => {
                if (!raw || typeof raw !== "object") return null;
                let bestVal = -Infinity;
                let bestIdx = null;
                ["t1","t2","t3","t4","t5","t6"].forEach((key, idx) => {
                  const v = raw[key];
                  if (v && v !== "X") {
                    const n = parseFloat(v);
                    if (!isNaN(n) && n > bestVal) {
                      bestVal = n;
                      bestIdx = key;
                    }
                  }
                });
                return bestIdx;
              };

              return (
                <>
                  {/* ── REVEZAMENTO: tabela por equipe ── */}
                  {b.isRevezamento ? (
                    <div style={{ overflowX: "auto" }}>
                    <table style={{ ...s.table, fontSize: 13, minWidth: 500 }}>
                      <thead><tr>
                        <Th>Pos.</Th>
                        <Th>Equipe</Th>
                        <Th>Atletas</Th>
                        {temSerieBlk && <Th>Sér.</Th>}
                        {temRaiaBlk && <Th>Raia</Th>}
                        {temVentoBlk && <Th>Vento</Th>}
                        <Th>Marca</Th>
                        {pontuacaoAtiva && <Th style={{ background: t.bgCardAlt, color: t.accent }}>Pts Eq.</Th>}
                      </tr></thead>
                      <tbody>
                        {(() => {
                          // Gerar posLabels para revezamento com filtro de federados
                          const _cfgRevez = { ...(eventoAtual.pontuacaoEquipes || {}), equipeIdsFederados: eventoAtual.equipeIdsFederados || [] };
                          const _fedAtivoRevez = _cfgRevez.classificacaoApenasFederados
                            && Array.isArray(_cfgRevez.equipeIdsFederados) && _cfgRevez.equipeIdsFederados.length > 0;
                          const _fedSetRevez = _fedAtivoRevez ? new Set(_cfgRevez.equipeIdsFederados) : null;
                          let _posFedRevez = 0;
                          const _posLabelsRevez = b.classificados.map(item => {
                            if (item.isStatus) return "";
                            if (!_fedAtivoRevez) { _posFedRevez++; return `${_posFedRevez}º`; }
                            // Equipe federada + TODOS os atletas do revezamento com CBAt
                            const eqFed = item.equipeId && _fedSetRevez.has(item.equipeId);
                            const todosComCbat = (item.atletasRevez || []).length > 0
                              && (item.atletasRevez || []).every(a => a.cbat && String(a.cbat).trim() !== "");
                            if (eqFed && todosComCbat) { _posFedRevez++; return `${_posFedRevez}º`; }
                            return "";
                          });
                          return b.classificados.map((item, j) => {
                          const raw = item.raw;
                          const getTent = (r, k) => r && typeof r === "object" ? (r[k] ?? "") : "";
                          const atlNomes = item.atletasRevez ? item.atletasRevez.map(a => a.nome).join(" · ") : "";
                          // Pontuação de revezamento
                          const ptsRevez = pontuacaoAtiva ? (() => {
                            const _cfgPontRevez = { ...(eventoAtual.pontuacaoEquipes || {}), equipeIdsFederados: eventoAtual.equipeIdsFederados || [] };
                            const ptsR = TeamScoringEngine.calcularPontosRevezamento(
                              b.classificados.filter(x => !x.isStatus),
                              _cfgPontRevez, atletas, equipes
                            );
                            return ptsR[item.equipeId]?.pontos || 0;
                          })() : 0;
                          return (
                            <tr key={item.equipeId} style={{ ...s.tr, ...(item.isStatus ? {} : j===0?s.trOuro:j===1?s.trPrata:j===2?s.trBronze:{}) }}>
                              <Td><strong style={{ color: item.isStatus ? t.textDimmed : j<3?t.accent:t.textPrimary, fontSize:15 }}>
                                {_posLabelsRevez[j]}
                              </strong></Td>
                              <Td><strong style={{ color: j<3?t.accent:t.textPrimary }}>{item.nomeEquipe}</strong></Td>
                              <Td><span style={{ fontSize: 11, color: t.textTertiary }}>{atlNomes}</span></Td>
                              {temSerieBlk && <Td>{serieDoAtletaBlk[item.equipeId] || "—"}</Td>}
                              {temRaiaBlk && <Td>{getTent(raw,"raia") || raiaDoAtletaBlk[item.equipeId] || "—"}</Td>}
                              {temVentoBlk && <Td>{getTent(raw,"vento")||"—"}</Td>}
                              <Td>
                                {item.isStatus
                                  ? <span style={{ color: t.danger, fontWeight:700 }}>{item.status}</span>
                                  : <strong style={{ color: j<3?t.success:t.textSecondary, fontSize:15 }}>
                                      {formatarMarcaExibicao(item.marca, "s", _msEmpatadosBloco, false)}
                                    </strong>
                                }
                              </Td>
                              {pontuacaoAtiva && <Td><span style={{ color: t.accent, fontWeight:700 }}>{ptsRevez || ""}</span></Td>}
                            </tr>
                          );
                        });
                        })()}
                      </tbody>
                    </table>
                    </div>
                  ) : (
                  <>
                  {temDesempateBlk && (
                    <div style={{ background:t.bgMarca, border:`1px solid ${t.accentBorder}`, borderRadius:6, padding:"5px 12px", marginBottom:8, fontSize:11, color: t.accent }}>
                      <strong>RT 25.22 — Regra de Desempate Aplicada</strong>
                      <span style={{ color: t.textMuted, marginLeft:6 }}>Atletas com mesma melhor marca desempatados pela 2ª melhor, 3ª, etc.</span>
                    </div>
                  )}
                  {temDesempateAltBlk && (
                    <div style={{ background:t.bgMarca, border:`1px solid ${t.accentBorder}`, borderRadius:6, padding:"5px 12px", marginBottom:8, fontSize:11, color: t.accent }}>
                      <strong>RT 26.9 — Regra de Desempate Aplicada</strong>
                      <span style={{ color: t.textMuted, marginLeft:6 }}>1º menor nº de saltos na última altura transposta (SU) · 2º menor nº total de falhas na prova (FP)</span>
                    </div>
                  )}
                  <div style={{ overflowX: "auto" }}>
                  <table style={{ ...s.table, fontSize: isCampoBlk ? 12 : 13, minWidth: 600 }}>
                  <thead>
                    <tr>
                      <Th>Pos.</Th>
                      <Th>Nº</Th>
                      <Th>CBAt</Th>
                      <Th>Atleta</Th>
                      <Th>Clube/Equipe</Th>
                      {temSerieBlk && <Th>Sér.</Th>}
                      {temRaiaBlk  && <Th>Raia</Th>}
                      {temVentoBlk && <Th>Vento</Th>}
                      {isCampoBlk && <>
                        <Th style={{ background: t.bgCardAlt, color: t.success }}>T1</Th>
                        <Th style={{ background: t.bgCardAlt, color: t.success }}>T2</Th>
                        <Th style={{ background: t.bgCardAlt, color: t.success }}>T3</Th>
                        <Th style={{ background: t.bgCardAlt, color: t.accent }}>CP</Th>
                        <Th style={{ background: t.bgCardAlt, color: t.warning }}>T4</Th>
                        <Th style={{ background: t.bgCardAlt, color: t.warning }}>T5</Th>
                        <Th style={{ background: t.bgCardAlt, color: t.warning }}>T6</Th>
                      </>}
                      {isAlturaVara && <Th style={{ background:t.bgHeaderSolid, color: t.accent }}>Barras</Th>}
                      <Th>Melhor</Th>
                      {isFaseComSeries && <Th style={{ background: t.bgCardAlt, color: t.success }}>Class.</Th>}
                      {pontuacaoAtiva && <Th style={{ background: t.bgCardAlt, color: t.accent }}>Pts Eq.</Th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Helper: renderizar uma linha de atleta
                      const renderRow = (item, j, posLabel, isSerieFinal) => {
                      const raw = item.raw;
                      // calcular CP para este bloco (posição após T1-T3)
                      const cpPos = isCampoBlk ? (() => {
                        const seqDesc = (r) => {
                          if (r == null) return [];
                          const obj = typeof r === "object" ? r : { marca: r };
                          return [obj.t1,obj.t2,obj.t3]
                            .map(v => { const n = parseFloat(v); return isNaN(n) ? null : n; })
                            .filter(n => n !== null).sort((a,b2) => b2 - a);
                        };
                        const cmp = (sa, sb) => {
                          const len = Math.max(sa.length, sb.length);
                          for (let i = 0; i < len; i++) {
                            const va = sa[i] ?? -Infinity, vb = sb[i] ?? -Infinity;
                            if (va > vb) return -1; if (va < vb) return 1;
                          }
                          return 0;
                        };
                        const minha = seqDesc(raw);
                        if (minha.length === 0) return null;
                        return b.classificados.filter(x => {
                          if (x.atleta.id === item.atleta.id) return false;
                          return cmp(seqDesc(x.raw), minha) < 0;
                        }).length + 1;
                      })() : null;

                      return (
                        <tr key={`${isSerieFinal ? "g" : "s"}_${item.atleta.id}`} style={{ ...s.tr, ...(isSerieFinal && !item.isStatus ? (j===0?s.trOuro:j===1?s.trPrata:j===2?s.trBronze:{}) : {}) }}>
                          <Td><strong style={{ color: item.isStatus ? t.textDimmed : (isSerieFinal && j<3?t.accent:t.textPrimary), fontSize:15 }}>
                            {item.isStatus ? "" : posLabel}
                          </strong></Td>
                          <Td><strong style={{ color: t.textTertiary, fontSize:13 }}>{formatarPeito((numeracaoPeito?.[eventoAtual?.id]||{})[item.atleta.id])}</strong></Td>
                          <Td style={{ fontSize: 11, color: t.textDimmed }}>{item.atleta.cbat || ""}</Td>
                          <Td><strong style={{ color: isSerieFinal && j<3?t.accent:t.textPrimary }}>{item.atleta.contaExcluida ? <span style={{ color: t.textDimmed, fontStyle: "italic", fontWeight: 400 }} title="Conta excluída — histórico preservado de forma anônima">Atleta Excluído</span> : item.atleta.nome}</strong></Td>
                          <Td>{getExibicaoEquipe(item.atleta, equipes)||"—"}{(() => {
                            const aOrgId = item.atleta.organizadorId;
                            if (!aOrgId || aOrgId === eventoAtual.organizadorId) return null;
                            const orgA = organizadores.find(o => o.id === aOrgId);
                            return <span style={{ fontSize: 10, color: t.textDimmed, marginLeft: 4 }} title={orgA?.entidade || orgA?.nome || ""}>{orgA?.siglaFederacao || orgA?.entidade?.slice(0,3)?.toUpperCase() || ""}</span>;
                          })()}</Td>
                          {temSerieBlk && <Td>{serieDoAtletaBlk[item.atleta.id] || "—"}</Td>}
                          {temRaiaBlk  && <Td>{getTent(raw,"raia") || raiaDoAtletaBlk[item.atleta.id] || "—"}</Td>}
                          {temVentoBlk && <Td>{getTent(raw,"vento")||"—"}</Td>}
                          {isCampoBlk && (() => {
                          const bestT = getBestTentIndex(raw);
                          const isSaltoHoriz = b.prova.nome?.includes("Distância") || b.prova.nome?.includes("Triplo");
                          const fmtTentV = (key, best) => (
                            <div>
                              {fmtTent(getTent(raw, key), best)}
                              {isSaltoHoriz && getTent(raw, key+"v") && (
                                <div style={{ fontSize:8, color: t.accent, marginTop:1 }}>{getTent(raw, key+"v")}</div>
                              )}
                            </div>
                          );
                          return <>
                            <Td style={{ background: t.bgCardAlt }}>{fmtTentV("t1", bestT==="t1")}</Td>
                            <Td style={{ background: t.bgCardAlt }}>{fmtTentV("t2", bestT==="t2")}</Td>
                            <Td style={{ background: t.bgCardAlt }}>{fmtTentV("t3", bestT==="t3")}</Td>
                            <Td style={{ background: t.bgCardAlt }}>
                              <span style={{ color: t.accent, fontWeight:800 }}>
                                {cpPos !== null ? `${cpPos}º` : "—"}
                              </span>
                            </Td>
                            <Td style={{ background: t.bgInput, opacity: cpPos !== null && cpPos <= 8 ? 1 : 0.35 }}>{fmtTentV("t4", bestT==="t4")}</Td>
                            <Td style={{ background: t.bgInput, opacity: cpPos !== null && cpPos <= 8 ? 1 : 0.35 }}>{fmtTentV("t5", bestT==="t5")}</Td>
                            <Td style={{ background: t.bgInput, opacity: cpPos !== null && cpPos <= 8 ? 1 : 0.35 }}>{fmtTentV("t6", bestT==="t6")}</Td>
                          </>;
                        })()}
                          {isAlturaVara && <Td style={{ background: t.bgCardAlt, fontSize:11, lineHeight:"1.6" }}>
                            {(() => {
                              // Display altura/vara attempts
                              // Check if raw has the altura/vara details
                              const hasDetalhes = raw && typeof raw === "object" && 
                                (raw.alturas || raw.tentativas);
                              
                              if (!hasDetalhes) {
                                // Old format or no attempts - show debug info
                                return (
                                  <div style={{fontSize:9,color: t.textDimmed}}>
                                    <div>—</div>
                                    <div style={{opacity:0.5}}>
                                      {typeof raw === "object" ? "obj sem tent." : "número"}
                                    </div>
                                    <div style={{fontSize:8,color: t.accent}}>(re-digite)</div>
                                  </div>
                                );
                              }
                              
                              const dados = raw;
                              
                              const alturasArr = Array.isArray(dados.alturas) ? dados.alturas : [];
                              const alturasOrdenadas = alturasArr
                                .map(h => parseFloat(h))
                                .filter(n => !isNaN(n))
                                .sort((a,b) => a-b);
                              const tentsObj = (dados.tentativas && typeof dados.tentativas === "object") ? dados.tentativas : {};
                              
                              return alturasOrdenadas.map((altura, idx) => {
                                const altStr = altura.toFixed(2);
                                const tents = tentsObj[altStr] || tentsObj[altura.toString()] || ["","",""];
                                const formatT = (ch) => {
                                  if (ch === "O") return <span style={{color: t.success}}>●</span>;
                                  if (ch === "X") return <span style={{color: t.danger}}>✗</span>;
                                  if (ch === "-") return <span style={{color: t.textDimmed}}>–</span>;
                                  return <span style={{color: t.textDisabled}}>○</span>;
                                };
                                const passed = tents.includes("O");
                                return (
                                  <div key={idx} style={{ 
                                    display:"flex", 
                                    alignItems:"center", 
                                    gap:4, 
                                    marginBottom:2,
                                    opacity: passed ? 1 : 0.5 
                                  }}>
                                    <span style={{ 
                                      color: passed ? t.accent : t.textDimmed,
                                      fontWeight:700, 
                                      minWidth:35 
                                    }}>{altStr.replace(".",",")}</span>
                                    <span style={{display:"flex",gap:2}}>
                                      {formatT(tents[0])}
                                      {formatT(tents[1])}
                                      {formatT(tents[2])}
                                    </span>
                                  </div>
                                );
                              });
                            })()}
                          </Td>}
                          <Td><strong style={s.marca}>{item.isStatus ? (
                            <span style={{ color: item.status === "DQ" ? t.danger : t.warning }}>
                              {item.status}{item.status === "DQ" && item.dqRegra ? ` R.${item.dqRegra}` : ""}
                            </span>
                          ) : (() => {
                            // Verificar se superou recorde do snapshot ou recordes atuais
                            let _superouRec = false;
                            if (item.marca != null) {
                              const isMenor = b.prova.unidade === "s";
                              const mnRaw = parseFloat(item.marca);
                              const mn = isMenor ? _marcaParaMs(item.marca) : mnRaw;
                              if (mn != null && !isNaN(mn)) {
                                const snap = eventoAtual.recordesSnapshot || {};
                                const hasSnap = Object.keys(snap).length > 0;
                                const recIds = eventoAtual?.recordesSumulas || [];
                                recIds.forEach(recId => {
                                  const tipo = (recordes || []).find(rt => rt.id === recId);
                                  if (!tipo) return;
                                  const regsRef = hasSnap ? (snap[tipo.id] || []) : (tipo.registros || []);
                                  const sr = regsRef.find(r =>
                                    (r.provaId === b.prova.id || _nomeProvaMatch(r.provaNome, b.prova.nome))
                                    && r.categoriaId === b.categoria.id && r.sexo === b.sexo
                                  );
                                  if (!sr) return;
                                  const recVal = isMenor ? _marcaParaMs(sr.marca) : parseFloat(sr.marca);
                                  if (recVal != null && (isMenor ? mn < recVal : mn > recVal)) _superouRec = true;
                                });
                              }
                            }
                            return formatarMarcaExibicao(item.marca, b.prova.unidade, _msEmpatadosBloco, _superouRec);
                          })()}</strong>
                          {/* Badge de recorde (compara com snapshot ou recordes atuais) */}
                          {!item.isStatus && item.atleta && (() => {
                            const snapshot = eventoAtual.recordesSnapshot || {};
                            const hasSnap = Object.keys(snapshot).length > 0;
                            const isMenor = b.prova.unidade === "s";
                            const marcaNum = isMenor ? _marcaParaMs(item.marca) : parseFloat(item.marca);
                            if (marcaNum == null || isNaN(marcaNum)) return null;
                            const badges = [];
                            const recIds = eventoAtual?.recordesSumulas || [];

                            recIds.forEach(recId => {
                              const tipo = (recordes || []).find(rt => rt.id === recId);
                              if (!tipo) return;
                              const regsRef = hasSnap ? (snapshot[tipo.id] || []) : (tipo.registros || []);
                              // Match por provaId exato, ou por nome da prova + categoria + sexo
                              const snapRec = regsRef.find(r =>
                                (r.provaId === b.prova.id || _nomeProvaMatch(r.provaNome, b.prova.nome))
                                && r.categoriaId === b.categoria.id && r.sexo === b.sexo
                              );
                              if (!snapRec) return;
                              const recMarca = isMenor ? _marcaParaMs(snapRec.marca) : parseFloat(snapRec.marca);
                              if (recMarca == null || isNaN(recMarca)) return;
                              const superou = isMenor ? marcaNum < recMarca : marcaNum > recMarca;

                              if (!superou) return;

                              // Verificar se é o MELHOR da competição (novo recorde)
                              const chave = b.faseSufixo ? resKey(eid, b.prova.id, b.categoria.id, b.sexo, b.faseSufixo) : `${eid}_${b.prova.id}_${b.categoria.id}_${b.sexo}`;
                              const todosRes = resultados[chave] || {};
                              let melhorComp = null;
                              Object.values(todosRes).forEach(raw => {
                                const m = typeof raw === "object" ? raw.marca : raw;
                                if (!m || ["DNS","DNF","DQ","NM"].includes(String(m))) return;
                                const n = isMenor ? _marcaParaMs(m) : parseFloat(String(m).replace(",","."));
                                if (n == null || isNaN(n)) return;
                                if (melhorComp === null || (isMenor ? n < melhorComp : n > melhorComp)) melhorComp = n;
                              });

                              const ehMelhor = melhorComp !== null && Math.abs(marcaNum - melhorComp) < 1;
                              badges.push({ sigla: tipo.sigla, ehMelhor, recAnterior: recMarca !== null ? formatarMarca(snapRec.marca, b.prova.unidade, 3) : null });
                            });

                            return badges.length > 0 ? (
                              <div>
                                {badges.map((bg, bi) => (
                                  <span key={bi} style={{
                                    display:"inline-block", fontSize:9, padding:"1px 5px", borderRadius:3, marginLeft:4, fontWeight:700,
                                    background: bg.ehMelhor ? t.accentBg : t.bgCardAlt,
                                    color: bg.ehMelhor ? t.gold : t.accent,
                                  }}>
                                    {bg.ehMelhor ? "NOVO REC" : "Superou REC"} {bg.sigla}
                                  </span>
                                ))}
                              </div>
                            ) : null;
                          })()}
                          </Td>
                          {isFaseComSeries && <Td style={{ background: t.bgCardAlt, textAlign:"center" }}>
                            {(() => {
                              const qq = classifQq[item.atleta?.id];
                              if (!qq) return "";
                              return <strong style={{ color: t.accent, fontSize:14 }}>{qq}</strong>;
                            })()}
                          </Td>}
                          {pontuacaoAtiva && (isSerieFinal ? <Td style={{ background: t.bgCardAlt, textAlign:"center" }}>
                            {ptsEqPorAtleta[item.atleta?.id] ? (
                              <span style={{ color: t.accent, fontWeight:700, fontSize:14 }}>{ptsEqPorAtleta[item.atleta.id]}</span>
                            ) : <span style={{ color: t.textDisabled }}>—</span>}
                          </Td> : <Td />)}
                        </tr>
                      );
                      }; // end renderRow

                      // ── Renderizar: agrupado por série (ELI/SEM) ou unificado (FIN/legado) ──
                      if (seriesParaRender) {
                        const nCols = 4 + (temSerieBlk ? 1 : 0)
                          + (temRaiaBlk ? 1 : 0) + (temVentoBlk ? 1 : 0)
                          + (isCampoBlk ? 7 : 0) + (isAlturaVara ? 1 : 0) + 1
                          + (isFaseComSeries ? 1 : 0) + (pontuacaoAtiva ? 1 : 0);
                        return seriesParaRender.flatMap((serie, si) => {
                          const atletaIdsSerie = new Set(serie.atletas.map(a => a.id || a.atletaId));
                          const classifSerie = b.classificados
                            .filter(item => atletaIdsSerie.has(item.atleta?.id))
                            .sort((a2, b2) => {
                              if (a2.isStatus && !b2.isStatus) return 1;
                              if (!a2.isStatus && b2.isStatus) return -1;
                              if (a2.marca != null && b2.marca != null) {
                                return b.prova.unidade === "s" ? a2.marca - b2.marca : b2.marca - a2.marca;
                              }
                              return 0;
                            });
                          return [
                            <tr key={`sh-${serie.numero}`}>
                              <td colSpan={nCols} style={{ padding:"8px 12px", background: t.bgCardAlt, borderBottom:`2px solid ${t.accentBorder}`, color: t.accent, fontWeight:700, fontSize:12 }}>
                                Série {serie.numero}
                                {b.prova.unidade === "s" && (eventoAtual.cronometragemProvas || {})[`${b.prova.id}__S${serie.numero}`] === "MAN" && (
                                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, marginLeft: 8, fontWeight: 700,
                                    background: `${t.warning}15`, color: t.warning }}>Manual</span>
                                )}
                              </td>
                            </tr>,
                            ...classifSerie.map((item, j) =>
                              renderRow(item, j, item.isStatus ? "" : `${j+1}º`, false)
                            )
                          ];
                        });
                      } else if (temSerieBlk && _serBlk?.series?.length > 1) {
                        // Final por Tempo: séries + classificação geral
                        const nColsFt = 4 + (temSerieBlk ? 1 : 0)
                          + (temRaiaBlk ? 1 : 0) + (temVentoBlk ? 1 : 0)
                          + (isCampoBlk ? 7 : 0) + (isAlturaVara ? 1 : 0) + 1
                          + (pontuacaoAtiva ? 1 : 0);
                        const seriesOrdFt = [..._serBlk.series].sort((a2, b2) => a2.numero - b2.numero);
                        const rows = [];
                        for (const serie of seriesOrdFt) {
                          const ids = new Set(serie.atletas.map(a => a.id || a.atletaId));
                          const cs = b.classificados.filter(item => ids.has(item.atleta?.id)).sort((a2, b2) => {
                            if (a2.isStatus && !b2.isStatus) return 1;
                            if (!a2.isStatus && b2.isStatus) return -1;
                            if (a2.marca != null && b2.marca != null) return b.prova.unidade === "s" ? a2.marca - b2.marca : b2.marca - a2.marca;
                            return 0;
                          });
                          rows.push(
                            <tr key={`fts-${b.prova.id}-${b.faseSufixo}-${serie.numero}`}>
                              <td colSpan={nColsFt} style={{ padding:"8px 12px", background: t.bgCardAlt, borderBottom:`2px solid ${t.accentBorder}`, color: t.accent, fontWeight:700, fontSize:12 }}>
                                Série {serie.numero}
                                {b.prova.unidade === "s" && (eventoAtual.cronometragemProvas || {})[`${b.prova.id}__S${serie.numero}`] === "MAN" && (
                                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, marginLeft: 8, fontWeight: 700,
                                    background: `${t.warning}15`, color: t.warning }}>Manual</span>
                                )}
                              </td>
                            </tr>
                          );
                          cs.forEach((item, j) => rows.push(renderRow(item, j, item.isStatus ? "" : `${j+1}º`, false)));
                        }
                        rows.push(
                          <tr key={`cg-${b.prova.id}-${b.faseSufixo}`}>
                            <td colSpan={nColsFt} style={{ padding:"10px 12px", background: `${t.success}12`, borderBottom:`2px solid ${t.success}44`, color: t.success, fontWeight:800, fontSize:13 }}>
                              Classificação Geral
                            </td>
                          </tr>
                        );
                        const _posLabelsCg = _gerarPosLabels(b.classificados);
                        b.classificados.forEach((item, j) => rows.push(renderRow(item, j, _posLabelsCg[j], true)));
                        return rows;
                      } else {
                        // Renderização unificada (série única ou legado)
                        const _posLabels = _gerarPosLabels(b.classificados);
                        return b.classificados.map((item, j) =>
                          renderRow(item, j, _posLabels[j], true)
                        );
                      }
                    })()}
                  </tbody>
                </table>
                </div>
                </>
                )}
                </>
              );
            })()}

            {/* Observações da prova */}
            {(() => {
              const chaveObs = `${b.prova.id}_${b.categoria.id}_${b.sexo}`;
              const obsTexto = (eventoAtual.observacoesProvas || {})[chaveObs] || "";
              if (!isAmplo && !obsTexto) return null;
              return (
                <div style={{ padding:"8px 12px", borderTop:`1px solid ${t.border}`, marginTop:6 }}>
                  {isAmplo ? (
                    <div>
                      <label style={{ fontSize:11, color: t.textMuted, fontWeight:600, display:"block", marginBottom:4 }}>Observações</label>
                      <textarea
                        style={{ width:"100%", minHeight:48, padding:"8px 10px", background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:6, color: t.textSecondary, fontSize:12, resize:"vertical", fontFamily:"inherit", lineHeight:1.5 }}
                        placeholder="Observações sobre esta prova (ex: vento, condições, protestos, desclassificações...)"
                        value={obsTexto}
                        onChange={(e) => {
                          const novasObs = { ...(eventoAtual.observacoesProvas || {}), [chaveObs]: e.target.value };
                          atualizarCamposEvento(eventoAtual.id, { observacoesProvas: novasObs });
                        }}
                      />
                    </div>
                  ) : (
                    obsTexto && <div style={{ fontSize:12, color: t.textTertiary, whiteSpace:"pre-wrap", lineHeight:1.5 }}>
                      <span style={{ color: t.textMuted, fontWeight:600 }}>Obs:</span> {obsTexto}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ); })}
        </div>
      )}
    </div>
  );
}

// ─── RECORDES ─────────────────────────────────────────────────────────────────
export default TelaResultados;
