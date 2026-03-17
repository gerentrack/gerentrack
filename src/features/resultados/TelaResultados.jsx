import React, { useState } from "react";
import { todasAsProvas, getComposicaoCombinada } from "../../shared/athletics/provasDef";
import { CATEGORIAS } from "../../shared/constants/categorias";
import { _getLocalEventoDisplay, NomeProvaComImplemento, abreviarProva, formatarMarca, formatarMarcaExibicao, _marcasComEmpateCentesimal, _marcaParaMs } from "../../shared/formatters/utils";
import { RecordHelper } from "../../shared/engines/recordHelper";
import { TeamScoringEngine } from "../../shared/engines/teamScoringEngine";
import { CombinedEventEngine } from "../../shared/engines/combinedEventEngine";
import { CombinedScoringEngine } from "../../shared/engines/combinedScoringEngine";
import { getFasesProva, buscarSeriacao, resKey, FASE_NOME, FASE_ORDEM } from "../../shared/constants/fases";
import { gerarHtmlImpressao } from "../impressao/gerarHtmlImpressao";
import { Th, Td } from "../ui/TableHelpers";

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

// Item 8: exibe sigla da equipe quando disponível, com fallback para nome/clube
const getExibicaoEquipe = (atleta, equipes) => {
  const eq = (equipes||[]).find(e => e.id === atleta?.equipeId);
  if (eq) return (eq.sigla?.trim() || eq.nome || atleta?.clube || "—");
  return atleta?.clube || "—";
};

function TelaResultados({ inscricoes, atletas, resultados, setTela, usuarioLogado, eventoAtual, numeracaoPeito, equipes, getClubeAtleta, editarEvento, recordes }) {
  const [filtroProva, setFiltroProva] = useState("todas");
  const [filtroCat, setFiltroCat] = useState("todas");
  const [filtroSexo, setFiltroSexo] = useState("todos");

  if (!eventoAtual) return (
    <div style={styles.page}><div style={styles.emptyState}><p>Selecione uma competição primeiro.</p>
      <button style={styles.btnPrimary} onClick={() => setTela("home")}>Ver Competições</button></div></div>
  );

  const eid = eventoAtual.id;
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

  // Categorias que têm inscrições nesta competição
  const categoriasComInscricao = CATEGORIAS.filter(c =>
    inscDoEvento.some(i => (i.categoriaOficialId || i.categoriaId) === c.id)
  );

  // Nomes de provas que têm inscrições, filtradas pela categoria selecionada
  const provasComInscFiltradas = todasProvasComCombinadas.filter(p =>
    inscDoEvento.some(i => i.provaId === p.id &&
      (filtroCat === "todas" || (i.categoriaOficialId || i.categoriaId) === filtroCat)
    )
  );
  const nomesProvasUnicos = [...new Set(provasComInscFiltradas.map(p => p.nome))].sort();

  const blocos = todasProvasComCombinadas.map((prova) => {
    const isRevez = prova.tipo === "revezamento";
    return ["M", "F"].map((sexo) => {
      return CATEGORIAS.flatMap((cat) => {
        // Determinar chaves de resultados a verificar (com fases ou legado)
        const _fases = getFasesProva(prova.id, eventoAtual.programaHorario || {});
        const _keysToCheck = _fases.length > 0
          ? _fases.map(f => ({ key: resKey(eid, prova.id, cat.id, sexo, f), fase: f }))
          : [{ key: `${eid}_${prova.id}_${cat.id}_${sexo}`, fase: "" }];

        return _keysToCheck.map(({ key, fase }) => {
        const res = resultados[key];
        if (!res || Object.keys(res).length === 0) return null;

        if (isRevez) {
          // Revezamento: entradas são por equipeId
          const inscsRevez = inscDoEvento.filter(i =>
            i.tipo === "revezamento" && i.provaId === prova.id &&
            (i.categoriaOficialId || i.categoriaId) === cat.id && i.sexo === sexo
          );
          const classificados = Object.entries(res)
            .map(([eqId, raw]) => {
              const marca = (raw != null && typeof raw === "object") ? (raw.marca ?? null) : raw;
              const status = (raw != null && typeof raw === "object") ? (raw.status || "") : "";
              const isStatus = ["DNS","DNF","DQ"].includes(status);
              const insc = inscsRevez.find(i => i.equipeId === eqId);
              const eq = equipes.find(e => e.id === eqId);
              const nomeEquipe = eq ? (eq.clube || eq.nome || "—") : (eqId.startsWith("clube_") ? eqId.substring(6) : "—");
              const atletasIds = insc?.atletasIds || (raw?.atletasIds) || [];
              const atlsObj = atletasIds.map(aid => atletas.find(a => a.id === aid)).filter(Boolean);
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
          return { prova, sexo, categoria: cat, classificados, isRevezamento: true, faseSufixo: fase, faseNome: fase ? (FASE_NOME[fase] || fase) : "" };
        }

        const classificados = Object.entries(res)
          .map(([atletaId, raw]) => {
            const marca = (raw != null && typeof raw === "object") ? (raw.marca ?? null) : raw;
            const status = (raw != null && typeof raw === "object") ? (raw.status || "") : "";
            const dqRegra = (raw != null && typeof raw === "object") ? (raw.dqRegra || "") : "";
            const isStatus = ["DNS","DNF","NM","DQ"].indexOf(status) !== -1;
            // Tenta achar pelo ID; se não achar (atleta excluído e reimportado),
            // recupera via inscrição pelo nome
            let atleta = atletas.find((a) => a.id === atletaId);
            if (!atleta) {
              const inscAtleta = inscDoEvento.find(i => i.atletaId === atletaId);
              if (inscAtleta) {
                const porNome = atletas.find(a => a.nome && inscAtleta.atletaNome &&
                  a.nome.trim().toLowerCase() === inscAtleta.atletaNome.trim().toLowerCase());
                atleta = porNome || { id: atletaId, nome: inscAtleta.atletaNome || "Atleta removido", anoNasc: inscAtleta.anoNasc || "", sexo: inscAtleta.sexo || "", clube: inscAtleta.clube || "" };
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
                return arr.filter(t => t === "X" || t === "O").length;
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
                    total += arr.filter(t => t === "X").length;
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
        return { prova, sexo, categoria: cat, classificados, faseSufixo: fase, faseNome: fase ? (FASE_NOME[fase] || fase) : "" };
        }).filter(Boolean);
      }).filter(Boolean);
    }).flat();
  }).flat().filter(Boolean);

  const blocosFiltrados = blocos.filter((b) => {
    if (filtroProva !== "todas" && b.prova.nome !== filtroProva) return false;
    if (filtroCat !== "todas" && b.categoria.id !== filtroCat) return false;
    if (filtroSexo !== "todos" && b.sexo !== filtroSexo) return false;
    return true;
  });

  // Gerar blocos de classificação de combinadas
  const blocosCombinadas = [];
  (eventoAtual.provasPrograma || []).forEach(provaId => {
    const provaInfo = todasProvas.find(p => p.id === provaId);
    if (!provaInfo || provaInfo.tipo !== "combinada") return;
    const sexoProva = provaId.startsWith("F_") ? "F" : "M";
    const catId = provaId.split("_")[1] || "";
    const cat = CATEGORIAS.find(c => c.id === catId);
    if (!cat) return;
    if (filtroSexo !== "todos" && sexoProva !== filtroSexo) return;
    if (filtroCat !== "todas" && catId !== filtroCat) return;

    const comp = getComposicaoCombinada(provaId);
    if (!comp) return;
    const todasCompDaCombinada = CombinedEventEngine.gerarProvasComponentes(provaId, eid);
    const atletaIds = [...new Set(
      inscDoEvento.filter(i => i.combinadaId === provaId || i.provaId === provaId).map(i => i.atletaId)
    )];
    if (atletaIds.length === 0) return;

    // Verificar se tem ao menos 1 resultado em qualquer componente
    let temAlgumResultado = false;
    todasCompDaCombinada.forEach(pc => {
      const chaveR = `${eid}_${pc.id}_${catId}_${sexoProva}`;
      if (resultados[chaveR] && Object.keys(resultados[chaveR]).length > 0) temAlgumResultado = true;
    });
    if (!temAlgumResultado) return;

    // Calcular pontuação de cada atleta
    const rows = atletaIds.map(aId => {
      const atl = atletas.find(a => a.id === aId);
      let total = 0;
      let provasRealizadas = 0;
      const porProva = todasCompDaCombinada.map(pc => {
        const chaveR = `${eid}_${pc.id}_${catId}_${sexoProva}`;
        const res = resultados[chaveR]?.[aId];
        const marca = res ? (typeof res === "object" ? res.marca : res) : null;
        const ptsManuais = res ? (typeof res === "object" ? res.pontosTabela : null) : null;
        const marcaNum = marca != null ? parseFloat(String(marca).replace(",", ".")) : null;
        const ptsAuto = (marcaNum != null && !isNaN(marcaNum)) ? CombinedScoringEngine.calcularPontosProva(pc.provaOriginalSufixo, marcaNum, sexoProva, provaId, (eventoAtual.cronometragemProvas || {})[pc.id]) : 0;
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
      const chaveR = `${eid}_${pc.id}_${catId}_${sexoProva}`;
      return resultados[chaveR] && Object.keys(resultados[chaveR]).length > 0;
    }).length;
    const todasCompletas = provasComResultado >= totalComp;

    // Calcular pontos por equipe para a classificação final da combinada
    const ptsEqCombMap = {};
    if (eventoAtual.pontuacaoEquipes?.ativo && todasCompletas) {
      const classificadosComb = rows
        .filter(r => r.total > 0 && r.atleta)
        .map(r => ({ atleta: r.atleta, marca: r.total }));
      const pontosComb = TeamScoringEngine.calcularPontosProva(classificadosComb, eventoAtual.pontuacaoEquipes, atletas, equipes);
      Object.keys(pontosComb).forEach(eqId => {
        const info = pontosComb[eqId];
        (info.atletas || []).forEach(atlInfo => {
          const atlPont = classificadosComb.find((item, idx) => {
            return item.atleta && item.atleta.id === atlInfo.atletaId && (idx + 1) === atlInfo.posicao;
          });
          if (atlPont) ptsEqCombMap[atlPont.atleta.id] = atlInfo.pontos;
        });
      });
    }

    blocosCombinadas.push({
      provaId, provaInfo, comp, sexo: sexoProva, categoria: cat,
      todasCompDaCombinada, rows, totalComp, todasCompletas, provasComResultado, ptsEqCombMap
    });
  });

  // Classificação por equipes
  const classifEquipes = TeamScoringEngine.calcularClassificacaoEquipes(eventoAtual, inscricoes, resultados, atletas, equipes, recordes);

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
          i.provaId === b.prova.id && (i.categoriaOficialId || i.categoriaId) === b.categoria.id && i.sexo === b.sexo
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
            const a = atletas.find(at => at.id === i.atletaId);
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
    const html = gerarHtmlImpressao(sumuFiltradas, eventoAtual, atletas, resultados, {}, numeracaoPeito[eventoAtual?.id] || {}, equipes, recordes, { modo: "resultados" });

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
      <div class="rod-wrap">
        <div style="text-align:center;font-size:8px;color:#888;margin-top:10px;padding-top:8px;border-top:1px solid #ccc;">
          <div>Gerado em: ${dataGeracao2}</div>
          <div>Plataforma de Competi\u00e7\u00f5es - GERENTRACK</div>
        </div>
        ${eventoAtual.logoRodape ? `<div style="margin-top:10px;text-align:center;"><img src="${eventoAtual.logoRodape}" alt="" style="max-width:100%;max-height:28mm;object-fit:contain;"/></div>` : ""}
        <div style="margin-top:12px;text-align:center;padding-top:6px;border-top:1px solid #e0e0e0;">
          <div style="font-size:7px;color:#999;letter-spacing:1px;margin-bottom:3px;">Desenvolvido por:</div>
          <img src="${_gtLogo2}" alt="GERENTRACK" style="max-height:10mm;object-fit:contain;opacity:0.7;" />
        </div>
      </div>`;

    // ── Classificação final das Combinadas ──
    blocosCombinadas.forEach(bc => {
      if (!bc.todasCompletas && bc.rows.length === 0) return;
      const labelStatus = bc.todasCompletas ? "CLASSIFICAÇÃO FINAL" : "CLASSIFICAÇÃO PARCIAL";
      const corStatus = bc.todasCompletas ? "#2a8a2a" : "#8a7a00";
      const pontEqAtivo = eventoAtual.pontuacaoEquipes?.ativo && bc.todasCompletas;
      htmlExtra += `
        <div class="pg" style="padding:12mm 14mm 10mm">
          ${cabExtra}
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;margin-top:10px">
            <span style="font-size:16px;font-weight:800;color:#111">🏅 ${bc.comp.nome}</span>
            <span style="font-size:10px;padding:2px 8px;border-radius:4px;font-weight:700;background:${bc.todasCompletas ? "#e8ffe8" : "#fff8e0"};color:${corStatus};border:1px solid ${corStatus}">${labelStatus}</span>
          </div>
          <div style="font-size:10px;color:#666;margin-bottom:8px">
            ${bc.categoria.nome} — ${bc.sexo === "M" ? "Masculino" : "Feminino"} — ${bc.provasComResultado || 0}/${bc.totalComp} provas
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr style="border-bottom:2px solid #333">
                <th style="padding:4px 6px;text-align:left;width:30px">Pos</th>
                <th style="padding:4px 6px;text-align:left">Atleta</th>
                <th style="padding:4px 6px;text-align:left">Clube/Equipe</th>
                ${bc.todasCompDaCombinada.map(pc => `<th style="padding:4px 3px;text-align:center;font-size:8px">${abreviarProva(pc.nome)}</th>`).join("")}
                <th style="padding:4px 6px;text-align:center;font-weight:800;color:#8a7000">Total</th>
                ${pontEqAtivo ? `<th style="padding:4px 6px;text-align:center;font-weight:800;background:#fffde0;color:#8a7000">Pts Eq.</th>` : ""}
              </tr>
            </thead>
            <tbody>
              ${bc.rows.map((r, idx) => {
                const pos = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : (idx+1)+"º";
                const atl = r.atleta || atletas.find(a => a.id === r.atletaId);
                const clube = atl ? (getExibicaoEquipe(atl, equipes) || "—") : "—";
                return `<tr style="border-bottom:1px solid #ddd;${idx < 3 ? "background:#f9f9f0" : ""}">
                  <td style="padding:4px 6px;font-weight:700">${pos}</td>
                  <td style="padding:4px 6px;font-weight:500">${r.nome}</td>
                  <td style="padding:4px 6px;color:#666;font-size:9px">${clube}</td>
                  ${r.porProva.map(pp => `<td style="padding:3px 2px;text-align:center;font-size:9px">${pp.marca != null && pp.marca !== "" ? `<div>${formatarMarca(pp.marca, pp.unidade, 2)}</div><div style="font-weight:700;color:#8a7000">${pp.pts}</div>` : "—"}</td>`).join("")}
                  <td style="padding:4px 6px;text-align:center;font-weight:800;font-size:13px;color:#8a7000">${r.total}</td>
                  ${pontEqAtivo ? `<td style="padding:4px 6px;text-align:center;background:#fffde0;font-weight:800;color:#8a7000">${bc.ptsEqCombMap[r.atletaId] || "—"}</td>` : ""}
                </tr>`;
              }).join("")}
            </tbody>
          </table>
          ${!bc.todasCompletas ? `<div style="margin-top:6px;font-size:9px;color:#888;text-align:center">Classificação parcial — faltam resultados de algumas provas</div>` : ""}
          ${rodExtra}
        </div>`;
    });

    // ── Classificação por Equipes ──
    if (classifEquipes.classificacao.length > 0) {
      const labelEq = classifEquipes.totalProvasComResultado >= classifEquipes.totalProvas ? "CLASSIFICAÇÃO FINAL" : "CLASSIFICAÇÃO PARCIAL";
      const corEq = classifEquipes.totalProvasComResultado >= classifEquipes.totalProvas ? "#2a8a2a" : "#8a7a00";
      htmlExtra += `
        <div class="pg" style="padding:12mm 14mm 10mm">
          ${cabExtra}
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;margin-top:10px">
            <span style="font-size:16px;font-weight:800;color:#111">🏅 Classificação por Equipes</span>
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
                const pos = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : (idx+1)+"º";
                const nProvas = Object.keys(eq.pontosPorProva).length;
                const totalBonus = (eq.bonusRecordes || []).reduce((s, b) => s + b.pontos, 0);
                const bonusDetail = (eq.bonusRecordes || []).map(b => `${b.tipoSigla} ${b.provaNome} (+${b.pontos})`).join(", ");
                return `<tr style="border-bottom:1px solid #ddd;${idx < 3 ? "background:#f9f9f0" : ""}">
                  <td style="padding:6px 8px;font-weight:700">${pos}</td>
                  <td style="padding:6px 8px;font-weight:600">${eq.nome}${bonusDetail ? `<div style="font-size:8px;color:#996600;margin-top:1px">🏆 ${bonusDetail}</div>` : ""}</td>
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
    <div style={styles.page}>
      <div style={styles.painelHeader}>
        <div>
          <h1 style={styles.pageTitle}>🏆 Resultados</h1>
          <div style={{ color: "#666", fontSize: 13 }}>{eventoAtual.nome}</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {isAmplo && (blocosFiltrados.length > 0 || blocosCombinadas.length > 0 || classifEquipes.classificacao.length > 0) && (
            <button style={{ ...styles.btnPrimary, display: "flex", alignItems: "center", gap: 8 }} onClick={handleImprimirResultados}>
              🖨 Imprimir Resultados
              <span style={{ background: "#00000033", borderRadius: 10, padding: "1px 8px", fontSize: 11 }}>
                {blocosFiltrados.length}
              </span>
            </button>
          )}
          {isAmplo && (
            <button style={styles.btnSecondary} onClick={() => setTela("digitar-resultados")}>✏️ Inserir Resultados</button>
          )}
          <button style={styles.btnGhost} onClick={() => setTela("evento-detalhe")}>← Competição</button>
        </div>
      </div>

      <div style={styles.filtros}>
        <div>
          <label style={styles.label}>Categoria</label>
          <select style={styles.select} value={filtroCat} onChange={(e) => { setFiltroCat(e.target.value); setFiltroProva("todas"); }}>
            <option value="todas">Todas</option>
            {categoriasComInscricao.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label style={styles.label}>Prova</label>
          <select style={styles.select} value={filtroProva} onChange={(e) => setFiltroProva(e.target.value)}>
            <option value="todas">Todas</option>
            {nomesProvasUnicos.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
          </select>
        </div>
        <div>
          <label style={styles.label}>Sexo</label>
          <select style={styles.select} value={filtroSexo} onChange={(e) => setFiltroSexo(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
        </div>
      </div>

      {/* Classificação por Equipes */}
      {classifEquipes.classificacao.length > 0 && (
        <div style={{
          background:"#060d14", border:"1px solid #00334d",
          borderRadius:12, marginBottom:24, overflow:"hidden",
        }}>
          <div style={{ padding:"14px 20px", background:"#0D0E12", borderBottom:"1px solid #1E2130", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:22, fontWeight:800, color:"#fff", marginBottom:4, display: "flex", alignItems: "center", gap: 10 }}>
                <span>{"🏅 Classificação por Equipes"}</span>
                <span style={{
                  fontSize: 11, padding: "2px 10px", borderRadius: 4, fontWeight: 600,
                  background: classifEquipes.totalProvasComResultado >= classifEquipes.totalProvas ? "#0a2a0a" : "#2a2a0a",
                  color: classifEquipes.totalProvasComResultado >= classifEquipes.totalProvas ? "#7cfc7c" : "#1976D2",
                }}>
                  {classifEquipes.totalProvasComResultado >= classifEquipes.totalProvas ? "CLASSIFICAÇÃO FINAL" : "CLASSIFICAÇÃO PARCIAL"}
                </span>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginTop:6 }}>
                <span style={{ color: "#aaa", fontSize: 13 }}>
                  {classifEquipes.totalProvasComResultado}/{classifEquipes.totalProvas} provas com resultado
                </span>
              </div>
            </div>
            {isAmplo && (
              <button
                style={{ ...styles.btnGhost, fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }}
                onClick={() => {
                  const isFinal = classifEquipes.totalProvasComResultado >= classifEquipes.totalProvas;
                  const _br = (() => { try { return JSON.parse(localStorage.getItem("gt_branding")) || {}; } catch { return {}; } })();
                  const _gl = _br.logo || GT_DEFAULT_LOGO;
                  const _dg = new Date().toLocaleString("pt-BR");
                  const _de = new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
                  const htmlEq = `<html><head><meta charset="utf-8"><title>Classificação por Equipes</title>
                    <style>body{font-family:Arial,sans-serif;margin:0;padding:12mm 14mm 10mm;font-size:11px;min-height:297mm;display:flex;flex-direction:column}
                    table{width:100%;border-collapse:collapse}th,td{padding:6px 8px;border-bottom:1px solid #ddd}
                    th{text-align:left;border-bottom:2px solid #333}
                    .top3{background:#f9f9f0}
                    .cab{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:7px;margin-bottom:7px;border-bottom:3px solid #111;gap:10px;}
                    .cab-left{display:flex;align-items:center;min-width:45mm;}.cab-left img{max-height:28mm;max-width:45mm;object-fit:contain;}
                    .cab-c{flex:1;text-align:center;}.cab-ev{font-size:14px;font-weight:800;color:#111;text-transform:uppercase;letter-spacing:.5px;line-height:1.2;}
                    .cab-dt{font-size:10px;color:#555;margin-top:3px;}
                    .rod-wrap{margin-top:auto;padding-top:10px;}
                    .rod{display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px;padding-top:8px;border-top:1px solid #ccc;gap:10px;}
                    .rod-ass{flex:1;text-align:center;}.rod-ln{border-bottom:1px solid #333;margin-bottom:3px;height:30px;}.rod-lb{font-size:9px;color:#555;}
                    .rod-info{text-align:center;font-size:8px;color:#888;min-width:100px;}
                    @media print{@page{margin:10mm}}</style></head><body>
                    <div class="cab">
                      <div class="cab-left">${eventoAtual.logoCabecalho ? `<img src="${eventoAtual.logoCabecalho}" alt=""/>` : ""}</div>
                      <div class="cab-c"><div class="cab-ev">${eventoAtual.nome}</div><div class="cab-dt">\u{1F4C5} ${_de} \u00a0\u00b7\u00a0 \u{1F4CD} ${_getLocalEventoDisplay(eventoAtual)}</div></div>
                      <div style="text-align:right;">${eventoAtual.logoCabecalhoDireito ? `<img src="${eventoAtual.logoCabecalhoDireito}" alt="" style="max-height:24mm;max-width:45mm;object-fit:contain;" />` : ""}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;margin-top:10px">
                      <span style="font-size:16px;font-weight:800">🏅 Classificação por Equipes</span>
                      <span style="font-size:10px;padding:2px 8px;border-radius:4px;font-weight:700;border:1px solid ${isFinal ? "#2a8a2a" : "#8a7a00"};color:${isFinal ? "#2a8a2a" : "#8a7a00"}">${isFinal ? "CLASSIFICAÇÃO FINAL" : "CLASSIFICAÇÃO PARCIAL"}</span>
                    </div>
                    <div style="font-size:10px;color:#666;margin-bottom:8px">${eventoAtual.nome} — ${classifEquipes.totalProvasComResultado}/${classifEquipes.totalProvas} provas com resultado</div>
                    <table><thead><tr>
                      <th style="width:40px">Pos</th><th>Equipe</th><th style="width:60px">Sigla</th>
                      <th style="text-align:center;width:80px">Provas</th>
                      ${classifEquipes.totalBonusRecordes > 0 ? `<th style="text-align:center;width:70px">Bônus Rec.</th>` : ""}
                      <th style="text-align:center;width:70px;font-weight:800">Total</th>
                    </tr></thead><tbody>
                    ${classifEquipes.classificacao.map((eq, idx) => {
                      const nProvas = Object.keys(eq.pontosPorProva).length;
                      const totalBonus = (eq.bonusRecordes || []).reduce((s, b) => s + b.pontos, 0);
                      const bonusDetail = (eq.bonusRecordes || []).map(b => `${b.tipoSigla} ${b.provaNome} (+${b.pontos})`).join(", ");
                      return `<tr${idx < 3 ? ` class="top3"` : ""}>
                        <td style="font-weight:700">${idx < 3 ? ["🥇","🥈","🥉"][idx] : (idx+1)+"º"}</td>
                        <td style="font-weight:600">${eq.nome}${bonusDetail ? `<div style="font-size:8px;color:#996600;margin-top:2px">🏆 ${bonusDetail}</div>` : ""}</td>
                        <td style="font-weight:600">${eq.sigla}</td>
                        <td style="text-align:center;color:#666">${nProvas}</td>
                        ${classifEquipes.totalBonusRecordes > 0 ? `<td style="text-align:center;color:#996600;font-weight:700">${totalBonus > 0 ? "+" + totalBonus : "—"}</td>` : ""}
                        <td style="text-align:center;font-weight:800;font-size:16px">${eq.totalPontos}</td>
                      </tr>`;
                    }).join("")}
                    </tbody></table>
                    <div class="rod-wrap">
                      <div style="text-align:center;font-size:8px;color:#888;margin-top:10px;padding-top:8px;border-top:1px solid #ccc;">
                        <div>Gerado em: ${_dg}</div>
                        <div>Plataforma de Competi\u00e7\u00f5es - GERENTRACK</div>
                      </div>
                      ${eventoAtual.logoRodape ? `<div style="margin-top:10px;text-align:center;"><img src="${eventoAtual.logoRodape}" alt="" style="max-width:100%;max-height:28mm;object-fit:contain;"/></div>` : ""}
                      <div style="margin-top:12px;text-align:center;padding-top:6px;border-top:1px solid #e0e0e0;">
                        <div style="font-size:7px;color:#999;letter-spacing:1px;margin-bottom:3px;">Desenvolvido por:</div>
                        <img src="${_gl}" alt="GERENTRACK" style="max-height:10mm;object-fit:contain;opacity:0.7;" />
                      </div>
                    </div>
                    </body></html>`;
                  const win = window.open("", "_blank", "width=900,height=700");
                  if (!win) { alert("Permita pop-ups."); return; }
                  win.document.open(); win.document.write(htmlEq); win.document.close();
                }}
                title="Imprimir classificação por equipes"
              >
                🖨 Imprimir
              </button>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #2a3050" }}>
                  <th style={{ padding: "8px", textAlign: "left", color: "#888", fontSize: 11 }}>Pos</th>
                  <th style={{ padding: "8px", textAlign: "left", color: "#888", fontSize: 11 }}>Equipe</th>
                  <th style={{ padding: "8px", textAlign: "left", color: "#888", fontSize: 11 }}>Sigla</th>
                  <th style={{ padding: "8px", textAlign: "center", color: "#888", fontSize: 11 }}>Provas Pontuadas</th>
                  {classifEquipes.totalBonusRecordes > 0 && (
                    <th style={{ padding: "8px", textAlign: "center", color: "#ff9800", fontSize: 11 }}>🏆 Bônus Rec.</th>
                  )}
                  <th style={{ padding: "8px", textAlign: "center", color: "#1976D2", fontWeight: 700, fontSize: 13 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {classifEquipes.classificacao.map(function(eq, idx) {
                  var nProvasPontuadas = Object.keys(eq.pontosPorProva).length;
                  var totalBonus = (eq.bonusRecordes || []).reduce(function(s, b) { return s + b.pontos; }, 0);
                  return (
                    <React.Fragment key={eq.equipeId}>
                    <tr style={{
                      borderBottom: (eq.bonusRecordes && eq.bonusRecordes.length > 0) ? "none" : "1px solid #1a1d2a",
                      background: idx === 0 ? "#1a1a0a" : idx < 3 ? "#0f1008" : "transparent"
                    }}>
                      <td style={{
                        padding: "10px 8px", fontWeight: 700, fontSize: 15,
                        color: idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : idx === 2 ? "#CD7F32" : "#888"
                      }}>
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : (idx + 1) + "º"}
                      </td>
                      <td style={{ padding: "10px 8px", color: "#fff", fontWeight: 600 }}>{eq.nome}</td>
                      <td style={{ padding: "10px 8px", color: "#1976D2", fontWeight: 600 }}>{eq.sigla}</td>
                      <td style={{ padding: "10px 8px", textAlign: "center", color: "#aaa" }}>{nProvasPontuadas}</td>
                      {classifEquipes.totalBonusRecordes > 0 && (
                        <td style={{ padding: "10px 8px", textAlign: "center", color: totalBonus > 0 ? "#ff9800" : "#444", fontWeight: 700 }}>
                          {totalBonus > 0 ? "+" + totalBonus : "—"}
                        </td>
                      )}
                      <td style={{ padding: "10px 8px", textAlign: "center", color: "#1976D2", fontWeight: 700, fontSize: 18 }}>{eq.totalPontos}</td>
                    </tr>
                    {eq.bonusRecordes && eq.bonusRecordes.length > 0 && (
                      <tr style={{ borderBottom: "1px solid #1a1d2a", background: idx === 0 ? "#1a1a0a" : idx < 3 ? "#0f1008" : "transparent" }}>
                        <td colSpan={classifEquipes.totalBonusRecordes > 0 ? 6 : 5} style={{ padding: "0 8px 8px 44px" }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {eq.bonusRecordes.map(function(b, bi) {
                              return (
                                <span key={bi} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#0a1a2a", color: "#ff9800", border: "1px solid #4a3000" }}>
                                  🏆 {b.tipoSigla} {b.provaNome} — {b.atletaNome} (+{b.pontos}pts)
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

          {classifEquipes.totalProvasComResultado < classifEquipes.totalProvas && (
            <div style={{ padding: "10px 16px", fontSize: 11, color: "#888", borderTop: "1px solid #1a1d2a" }}>
              Classificação parcial — faltam resultados em {classifEquipes.totalProvas - classifEquipes.totalProvasComResultado} prova(s)
            </div>
          )}
        </div>
      )}

      {blocosFiltrados.length === 0 && blocosCombinadas.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={{ fontSize: 48 }}>🏆</span>
          <p>Nenhum resultado publicado ainda.</p>
        </div>
      ) : (
        <div>
          {/* Classificação das Combinadas */}
          {blocosCombinadas.map((bc, bcIdx) => (
            <div key={"comb" + bcIdx} style={{
              background:"#0a0d14", border:"1px solid #0a1a2a",
              borderRadius:12, marginBottom:20, overflow:"hidden",
            }}>
              <div style={{ padding:"14px 20px", background:"#0D0E12", borderBottom:"1px solid #1E2130", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:22, fontWeight:800, color:"#fff", marginBottom:4, display: "flex", alignItems: "center", gap: 10 }}>
                    <span>{"🏅 " + bc.comp.nome}</span>
                    <span style={{
                      fontSize: 11, padding: "2px 10px", borderRadius: 4, fontWeight: 600,
                      background: bc.todasCompletas ? "#0a2a0a" : "#2a2a0a",
                      color: bc.todasCompletas ? "#7cfc7c" : "#1976D2",
                    }}>
                      {bc.todasCompletas ? "CLASSIFICAÇÃO FINAL" : "CLASSIFICAÇÃO PARCIAL"}
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginTop:6 }}>
                    <span style={styles.badgeGold}>{bc.categoria.nome}</span>
                    <span style={styles.badge(bc.sexo === "M" ? "#1a6ef5" : "#e54f9b")}>
                      {bc.sexo === "M" ? "Masculino" : "Feminino"}
                    </span>
                    <span style={{ color: "#aaa", fontSize: 13 }}>
                      {bc.provasComResultado || 0}/{bc.totalComp} provas
                    </span>
                  </div>
                </div>
                {isAmplo && (
                  <button
                    style={{ ...styles.btnGhost, fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }}
                    onClick={() => {
                      const pontEqAtivo = eventoAtual.pontuacaoEquipes?.ativo && bc.todasCompletas;
                      const _br3 = (() => { try { return JSON.parse(localStorage.getItem("gt_branding")) || {}; } catch { return {}; } })();
                      const _gl3 = _br3.logo || GT_DEFAULT_LOGO;
                      const _dg3 = new Date().toLocaleString("pt-BR");
                      const _de3 = new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
                      const htmlComb = `<html><head><meta charset="utf-8"><title>Classificação ${bc.comp.nome}</title>
                        <style>body{font-family:Arial,sans-serif;margin:0;padding:12mm 14mm 10mm;font-size:11px;min-height:297mm;display:flex;flex-direction:column}
                        table{width:100%;border-collapse:collapse}th,td{padding:5px 6px;border-bottom:1px solid #ddd}
                        th{text-align:left;border-bottom:2px solid #333;font-size:10px}
                        .top3{background:#f9f9f0}
                        .cab{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:7px;margin-bottom:7px;border-bottom:3px solid #111;gap:10px;}
                        .cab-left{display:flex;align-items:center;min-width:45mm;}.cab-left img{max-height:28mm;max-width:45mm;object-fit:contain;}
                        .cab-c{flex:1;text-align:center;}.cab-ev{font-size:14px;font-weight:800;color:#111;text-transform:uppercase;letter-spacing:.5px;line-height:1.2;}
                        .cab-dt{font-size:10px;color:#555;margin-top:3px;}
                        .rod-wrap{margin-top:auto;padding-top:10px;}
                        .rod{display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px;padding-top:8px;border-top:1px solid #ccc;gap:10px;}
                        .rod-ass{flex:1;text-align:center;}.rod-ln{border-bottom:1px solid #333;margin-bottom:3px;height:30px;}.rod-lb{font-size:9px;color:#555;}
                        .rod-info{text-align:center;font-size:8px;color:#888;min-width:100px;}
                        @media print{@page{margin:10mm}}</style></head><body>
                        <div class="cab">
                          <div class="cab-left">${eventoAtual.logoCabecalho ? `<img src="${eventoAtual.logoCabecalho}" alt=""/>` : ""}</div>
                          <div class="cab-c"><div class="cab-ev">${eventoAtual.nome}</div><div class="cab-dt">\u{1F4C5} ${_de3} \u00a0\u00b7\u00a0 \u{1F4CD} ${_getLocalEventoDisplay(eventoAtual)}</div></div>
                          <div style="text-align:right;">${eventoAtual.logoCabecalhoDireito ? `<img src="${eventoAtual.logoCabecalhoDireito}" alt="" style="max-height:24mm;max-width:45mm;object-fit:contain;" />` : ""}</div>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;margin-top:10px">
                          <span style="font-size:16px;font-weight:800">🏅 ${bc.comp.nome}</span>
                          <span style="font-size:10px;padding:2px 8px;border-radius:4px;font-weight:700;border:1px solid ${bc.todasCompletas ? "#2a8a2a" : "#8a7a00"};color:${bc.todasCompletas ? "#2a8a2a" : "#8a7a00"}">${bc.todasCompletas ? "CLASSIFICAÇÃO FINAL" : "CLASSIFICAÇÃO PARCIAL"}</span>
                        </div>
                        <div style="font-size:10px;color:#666;margin-bottom:4px">${eventoAtual.nome} — ${bc.categoria.nome} — ${bc.sexo === "M" ? "Masculino" : "Feminino"}</div>
                        <table><thead><tr>
                          <th style="width:30px">Pos</th><th>Atleta</th><th>Clube/Equipe</th>
                          ${bc.todasCompDaCombinada.map(pc => `<th style="text-align:center;font-size:8px">${abreviarProva(pc.nome)}</th>`).join("")}
                          <th style="text-align:center;font-weight:800">Total</th>
                          ${pontEqAtivo ? `<th style="text-align:center;font-weight:800;background:#fffde0">Pts Eq.</th>` : ""}
                        </tr></thead><tbody>
                        ${bc.rows.map((r, idx) => {
                          const atl = r.atleta || atletas.find(a => a.id === r.atletaId);
                          const clube = atl ? (getExibicaoEquipe(atl, equipes) || "") : "";
                          return `<tr${idx < 3 ? ` class="top3"` : ""}>
                            <td style="font-weight:700">${idx < 3 ? ["🥇","🥈","🥉"][idx] : (idx+1)+"º"}</td>
                            <td>${r.nome}</td><td style="color:#666;font-size:9px">${clube}</td>
                            ${r.porProva.map(pp => `<td style="text-align:center;font-size:9px">${pp.marca != null && pp.marca !== "" ? formatarMarca(pp.marca, pp.unidade, 2) + "<br/><b>" + pp.pts + "</b>" : "—"}</td>`).join("")}
                            <td style="text-align:center;font-weight:800;font-size:14px">${r.total}</td>
                            ${pontEqAtivo ? `<td style="text-align:center;font-weight:800;background:#fffde0">${bc.ptsEqCombMap[r.atletaId] || "—"}</td>` : ""}
                          </tr>`;
                        }).join("")}
                        </tbody></table>
                        <div class="rod-wrap">
                          <div style="text-align:center;font-size:8px;color:#888;margin-top:10px;padding-top:8px;border-top:1px solid #ccc;">
                            <div>Gerado em: ${_dg3}</div>
                            <div>Plataforma de Competi\u00e7\u00f5es - GERENTRACK</div>
                          </div>
                          ${eventoAtual.logoRodape ? `<div style="margin-top:10px;text-align:center;"><img src="${eventoAtual.logoRodape}" alt="" style="max-width:100%;max-height:28mm;object-fit:contain;"/></div>` : ""}
                          <div style="margin-top:12px;text-align:center;padding-top:6px;border-top:1px solid #e0e0e0;">
                            <div style="font-size:7px;color:#999;letter-spacing:1px;margin-bottom:3px;">Desenvolvido por:</div>
                            <img src="${_gl3}" alt="GERENTRACK" style="max-height:10mm;object-fit:contain;opacity:0.7;" />
                          </div>
                        </div>
                        </body></html>`;
                      const win = window.open("", "_blank", "width=900,height=700");
                      if (!win) { alert("Permita pop-ups."); return; }
                      win.document.open(); win.document.write(htmlComb); win.document.close();
                    }}
                    title="Imprimir classificação desta combinada"
                  >
                    🖨 Imprimir
                  </button>
                )}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #2a3050" }}>
                      <th style={{ padding: "8px", textAlign: "left", color: "#888", fontSize: 11 }}>Pos</th>
                      <th style={{ padding: "8px", textAlign: "left", color: "#888", fontSize: 11 }}>Atleta</th>
                      {bc.todasCompDaCombinada.map(function(pc) {
                        return (
                          <th key={pc.id} style={{
                            padding: "6px 4px", textAlign: "center", color: "#888",
                            fontSize: 10, minWidth: 60
                          }}>
                            {abreviarProva(pc.nome)}
                          </th>
                        );
                      })}
                      <th style={{ padding: "8px", textAlign: "center", color: "#1976D2", fontWeight: 700, fontSize: 13 }}>
                        Total
                      </th>
                      {eventoAtual.pontuacaoEquipes?.ativo && bc.todasCompletas && (
                        <th style={{ padding: "8px", textAlign: "center", background: "#0a1a2a", color: "#1976D2", fontWeight: 700, fontSize: 11 }}>
                          Pts Eq.
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {bc.rows.map(function(r, idx) {
                      return (
                        <tr key={r.atletaId} style={{
                          borderBottom: "1px solid #1a1d2a",
                          background: idx === 0 ? "#1a1a0a" : idx < 3 ? "#0f1008" : "transparent"
                        }}>
                          <td style={{
                            padding: "8px", fontWeight: 700, fontSize: 14,
                            color: idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : idx === 2 ? "#CD7F32" : "#888"
                          }}>
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : (idx + 1) + "º"}
                          </td>
                          <td style={{ padding: "8px", color: "#fff", fontWeight: 500, whiteSpace: "nowrap" }}>
                            {r.nome}
                          </td>
                          {r.porProva.map(function(pp, ppIdx) {
                            return (
                              <td key={ppIdx} style={{
                                padding: "4px", textAlign: "center",
                                color: pp.marca != null && pp.marca !== "" ? "#ccc" : "#333",
                              }}>
                                {pp.marca != null && pp.marca !== "" ? (
                                  <div>
                                    <div style={{ fontSize: 10, color: "#aaa" }}>{formatarMarca(pp.marca, pp.unidade, 2)}</div>
                                    <div style={{ fontSize: 11, color: "#1976D2", fontWeight: 600 }}>{pp.pts}</div>
                                  </div>
                                ) : "—"}
                              </td>
                            );
                          })}
                          <td style={{
                            padding: "8px", textAlign: "center",
                            color: "#1976D2", fontWeight: 700, fontSize: 16
                          }}>
                            {r.total}
                          </td>
                          {eventoAtual.pontuacaoEquipes?.ativo && bc.todasCompletas && (
                            <td style={{ padding: "8px", textAlign: "center", background: "#0a1a2a" }}>
                              {bc.ptsEqCombMap[r.atletaId] ? (
                                <span style={{ color: "#1976D2", fontWeight: 700, fontSize: 14 }}>{bc.ptsEqCombMap[r.atletaId]}</span>
                              ) : <span style={{ color: "#333" }}>—</span>}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!bc.todasCompletas && (
                <div style={{ padding: "10px 16px", fontSize: 11, color: "#888", borderTop: "1px solid #1a1d2a" }}>
                  Classificação parcial — faltam resultados de algumas provas
                </div>
              )}
            </div>
          ))}

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
          <div key={i} style={{ background:"#0E1016", border:"1px solid #1E2130", borderRadius:12, marginBottom:20, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", background:"#0D0E12", borderBottom:"1px solid #1E2130", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
              <div>
                <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:22, fontWeight:800, color:"#fff", marginBottom:4 }}>
                  <NomeProvaComImplemento nome={b.prova.nome} />
                  {b.prova.origemCombinada && (
                    <span style={{ fontSize: 11, background: "#0a1a2a", color: "#1976D2", padding: "2px 8px", borderRadius: 4, marginLeft: 8, fontWeight: 600 }}>
                      🏅 {b.prova.nomeCombinada} ({b.prova.ordem}/{b.prova.totalProvas})
                    </span>
                  )}
                  {b.faseNome && (
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, marginLeft: 8, fontWeight: 700,
                      background: b.faseSufixo === "ELI" ? "#2a1a0a" : b.faseSufixo === "SEM" ? "#0a1a2a" : "#0a2a0a",
                      color: b.faseSufixo === "ELI" ? "#ff8844" : b.faseSufixo === "SEM" ? "#88aaff" : "#7cfc7c" }}>
                      {b.faseNome}
                    </span>
                  )}
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginTop:6 }}>
                  <span style={styles.badgeGold}>{b.categoria.nome}</span>
                  <span style={styles.badge(b.sexo === "M" ? "#1a6ef5" : "#e54f9b")}>{b.sexo === "M" ? "Masculino" : "Feminino"}</span>
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
                    <div style={{ padding:"3px 10px", background:"#0a1020", border:"1px solid #1a2a4a", borderRadius:4, fontSize:10, color:"#aaa", marginTop:4 }}>
                      🏆 {linhas.map((l, i) => (
                        <span key={i}>
                          {i > 0 && " · "}
                          <strong style={{ color:"#6ab4ff" }}>{l.sigla}:</strong>{" "}
                          <span style={{ color:"#1976D2", fontWeight:700 }}>{l.marca}</span>{" "}
                          — {l.atleta} ({l.equipe}) — {l.ano}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
              {isAmplo && (
                <button
                  style={{ ...styles.btnGhost, fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }}
                  onClick={() => {
                    const inscs = inscDoEvento.filter(ii =>
                      ii.provaId === b.prova.id && (ii.categoriaOficialId || ii.categoriaId) === b.categoria.id && ii.sexo === b.sexo
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
                          const a = atletas.find(at => at.id === i.atletaId);
                          if (a) atletasInsc.push(a);
                        }
                      });
                      const resProva = {};
                      (b.classificados || []).forEach(c => { if (c.raw != null && c.atleta) resProva[c.atleta.id] = c.raw; });
                      sumu = { prova: b.prova, sexo: b.sexo, categoria: b.categoria, atletas: atletasInsc, inscs, resultados: resProva, faseSufixo: b.faseSufixo || "", faseNome: b.faseNome || "" };
                    }
                    const htmlInd = gerarHtmlImpressao([sumu], eventoAtual, atletas, resultados, {}, numeracaoPeito[eventoAtual?.id] || {}, equipes, recordes, { modo: "resultados" });
                    const win = window.open("", "_blank", "width=900,height=700");
                    if (!win) { alert("Permita pop-ups para gerar a impressão."); return; }
                    win.document.open(); win.document.write(htmlInd); win.document.close();
                  }}
                  title="Imprimir resultado desta prova"
                >
                  🖨 Imprimir
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

              // Calcular série de cada atleta (para combinadas de pista ≤400m)
              const serieDoAtletaBlk = {};
              if (isCombPistaSeriavel) {
                const MAX_SERIE = 8;
                const inscBlk = inscDoEvento.filter(ii =>
                  ii.provaId === b.prova.id && (ii.categoriaOficialId || ii.categoriaId) === b.categoria.id && ii.sexo === b.sexo
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

              // Pontuação por equipes — SÓ na final ou sem fase (legado). Eliminatória/semifinal NÃO pontuam.
              const isFaseFinal = !b.faseSufixo || b.faseSufixo === "FIN";
              // Só mostra pontuação quando o ÚLTIMO resultado da prova for digitado
              const isRevezBlk = b.prova.tipo === "revezamento" || b.isRevezamento;
              const inscsBlkPont = inscDoEvento.filter(i =>
                i.provaId === b.prova.id &&
                (i.categoriaOficialId || i.categoriaId) === b.categoria.id &&
                i.sexo === b.sexo &&
                (isRevezBlk ? i.tipo === "revezamento" : i.tipo !== "revezamento")
              );
              const chaveBlkPont = resKey(eid, b.prova.id, b.categoria.id, b.sexo, b.faseSufixo || "");
              const resBlkObj = resultados[chaveBlkPont] || {};
              const entradasBrutas = Object.keys(resBlkObj).length;
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
              const pontosEquipeBlk = pontuacaoAtiva
                ? TeamScoringEngine.calcularPontosProva(b.classificados, eventoAtual.pontuacaoEquipes, atletas, equipes)
                : {};
              // Mapear atletaId → pontos (respeita limite de atletas por equipe)
              const ptsEqPorAtleta = {};
              if (pontuacaoAtiva) {
                Object.keys(pontosEquipeBlk).forEach(eqId => {
                  const info = pontosEquipeBlk[eqId];
                  (info.atletas || []).forEach(atlInfo => {
                    const atletaPontuante = b.classificados.find((item, idx) => {
                      if (!item.atleta || item.isStatus) return false;
                      return item.atleta.id === atlInfo.atletaId && (idx + 1) === atlInfo.posicao;
                    });
                    if (atletaPontuante) ptsEqPorAtleta[atletaPontuante.atleta.id] = atlInfo.pontos;
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
                  seriacaoFaseBlk.series.forEach(s => {
                    s.atletas.forEach(a => {
                      seriesPorAtleta[a.id || a.atletaId] = s.numero;
                    });
                  });
                }

                // Buscar seriação da PRÓXIMA fase para determinar Q/q
                const fasesConf = getFasesProva(b.prova.id, eventoAtual.programaHorario || {});
                const idxAtual = FASE_ORDEM.indexOf(b.faseSufixo);
                const proximaFase = FASE_ORDEM[idxAtual + 1];
                if (proximaFase && fasesConf.includes(proximaFase)) {
                  const serProxima = buscarSeriacao(eventoAtual.seriacao, b.prova.id, b.categoria.id, b.sexo, proximaFase);
                  if (serProxima?.series) {
                    // Atletas na próxima fase — verificar origemClassif
                    serProxima.series.forEach(s => {
                      s.atletas.forEach(a => {
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
                    if (seriacaoFaseBlk.ordemSeries) {
                      return seriacaoFaseBlk.ordemSeries.indexOf(a2.numero) - seriacaoFaseBlk.ordemSeries.indexOf(b2.numero);
                    }
                    return a2.numero - b2.numero;
                  })
                : null;

              // Detectar desempate por RT 25.22 em provas de campo
              const temDesempateBlk = isCampoBlk && (() => {
                if (b.classificados.length < 2) return false;
                const marcas2 = b.classificados.map(x => x.marca);
                for (let ii = 0; ii < marcas2.length - 1; ii++) {
                  if (marcas2[ii] === marcas2[ii+1]) return true;
                }
                return false;
              })();

              // Detectar desempate por RT 26.9 em saltos verticais
              const temDesempateAltBlk = isAlturaVara && (() => {
                if (b.classificados.length < 2) return false;
                const marcas2 = b.classificados.map(x => x.marca);
                for (let ii = 0; ii < marcas2.length - 1; ii++) {
                  if (marcas2[ii] === marcas2[ii+1]) return true;
                }
                return false;
              })();

              // helper: formata tentativa (número, X ou vazio)
              const fmtTent = (v, isBest = false) => {
                if (v === "" || v == null) return <span style={{ color:"#333" }}>—</span>;
                const s2 = String(v).trim().toUpperCase();
                if (s2 === "X") return <span style={{ color:"#cc4444", fontWeight:800 }}>X</span>;
                const n = parseFloat(v);
                if (isNaN(n)) return <span style={{ color:"#555" }}>{v}</span>;
                
                // Highlight best attempt
                return <span style={{ 
                  color: isBest ? "#7cfc7c" : "#aaa",
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
                    <table style={{ ...styles.table, fontSize: 13 }}>
                      <thead><tr>
                        <Th>Pos.</Th>
                        <Th>Equipe</Th>
                        <Th>Atletas</Th>
                        {temVentoBlk && <Th>Vento</Th>}
                        <Th>Marca</Th>
                        {pontuacaoAtiva && <Th style={{ background:"#0a1a2a", color:"#1976D2" }}>Pts Eq.</Th>}
                      </tr></thead>
                      <tbody>
                        {b.classificados.map((item, j) => {
                          const raw = item.raw;
                          const getTent = (r, k) => r && typeof r === "object" ? (r[k] ?? "") : "";
                          const atlNomes = item.atletasRevez ? item.atletasRevez.map(a => a.nome).join(" · ") : "";
                          // Pontuação de revezamento
                          const ptsRevez = pontuacaoAtiva ? (() => {
                            const ptsR = TeamScoringEngine.calcularPontosRevezamento(
                              b.classificados.filter(x => !x.isStatus),
                              eventoAtual.pontuacaoEquipes, atletas, equipes
                            );
                            return ptsR[item.equipeId]?.pontos || 0;
                          })() : 0;
                          return (
                            <tr key={item.equipeId} style={{ ...styles.tr, ...(item.isStatus ? {} : j===0?styles.trOuro:j===1?styles.trPrata:j===2?styles.trBronze:{}) }}>
                              <Td><strong style={{ color: item.isStatus ? "#666" : j<3?"#1976D2":"#fff", fontSize:15 }}>
                                {item.isStatus ? "" : j===0?"🥇":j===1?"🥈":j===2?"🥉":`${j+1}º`}
                              </strong></Td>
                              <Td><strong style={{ color: j<3?"#1976D2":"#fff" }}>{item.nomeEquipe}</strong></Td>
                              <Td><span style={{ fontSize: 11, color: "#aaa" }}>{atlNomes}</span></Td>
                              {temVentoBlk && <Td>{getTent(raw,"vento")||"—"}</Td>}
                              <Td>
                                {item.isStatus
                                  ? <span style={{ color:"#ff6b6b", fontWeight:700 }}>{item.status}</span>
                                  : <strong style={{ color: j<3?"#7cfc7c":"#ccc", fontSize:15 }}>
                                      {formatarMarcaExibicao(item.marca, "s", _msEmpatadosBloco, false)}
                                    </strong>
                                }
                              </Td>
                              {pontuacaoAtiva && <Td><span style={{ color:"#1976D2", fontWeight:700 }}>{ptsRevez || ""}</span></Td>}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                  <>
                  {temDesempateBlk && (
                    <div style={{ background:"#1a1a0a", border:"1px solid #4a4a2a", borderRadius:6, padding:"5px 12px", marginBottom:8, fontSize:11, color:"#1976D2" }}>
                      ⚖️ <strong>RT 25.22 — Regra de Desempate Aplicada</strong>
                      <span style={{ color:"#888", marginLeft:6 }}>Atletas com mesma melhor marca desempatados pela 2ª melhor, 3ª, etc.</span>
                    </div>
                  )}
                  {temDesempateAltBlk && (
                    <div style={{ background:"#1a1a0a", border:"1px solid #4a4a2a", borderRadius:6, padding:"5px 12px", marginBottom:8, fontSize:11, color:"#1976D2" }}>
                      ⚖️ <strong>RT 26.9 — Regra de Desempate Aplicada</strong>
                      <span style={{ color:"#888", marginLeft:6 }}>1º menor nº de saltos na última altura transposta (SU) · 2º menor nº total de falhas na prova (FP)</span>
                    </div>
                  )}
                  <table style={{ ...styles.table, fontSize: isCampoBlk ? 12 : 13 }}>
                  <thead>
                    <tr>
                      <Th>Pos.</Th>
                      <Th>Nº</Th>
                      <Th>Atleta</Th>
                      <Th>Clube/Equipe</Th>
                      {isCombPistaSeriavel && Object.keys(serieDoAtletaBlk).length > 0 && <Th>Sér.</Th>}
                      {temRaiaBlk  && <Th>Raia</Th>}
                      {temVentoBlk && <Th>Vento</Th>}
                      {isCampoBlk && <>
                        <Th style={{ background:"#0d1a0d", color:"#7cfc7c" }}>T1</Th>
                        <Th style={{ background:"#0d1a0d", color:"#7cfc7c" }}>T2</Th>
                        <Th style={{ background:"#0d1a0d", color:"#7cfc7c" }}>T3</Th>
                        <Th style={{ background:"#0a120a", color:"#1976D2" }}>CP</Th>
                        <Th style={{ background:"#1a0f00", color:"#ffaa44" }}>T4</Th>
                        <Th style={{ background:"#1a0f00", color:"#ffaa44" }}>T5</Th>
                        <Th style={{ background:"#1a0f00", color:"#ffaa44" }}>T6</Th>
                      </>}
                      {isAlturaVara && <Th style={{ background:"#0a0a1a", color:"#88aaff" }}>Barras</Th>}
                      <Th>Melhor</Th>
                      {isFaseComSeries && <Th style={{ background:"#0a1a0a", color:"#7cfc7c" }}>Class.</Th>}
                      {pontuacaoAtiva && <Th style={{ background:"#0a1a2a", color:"#1976D2" }}>Pts Eq.</Th>}
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
                        <tr key={item.atleta.id} style={{ ...styles.tr, ...(isSerieFinal && !item.isStatus ? (j===0?styles.trOuro:j===1?styles.trPrata:j===2?styles.trBronze:{}) : {}) }}>
                          <Td><strong style={{ color: item.isStatus ? "#666" : (isSerieFinal && j<3?"#1976D2":"#fff"), fontSize:15 }}>
                            {item.isStatus ? "" : (isSerieFinal ? (j===0?"🥇":j===1?"🥈":j===2?"🥉":posLabel) : posLabel)}
                          </strong></Td>
                          <Td><strong style={{ color:"#aaa", fontSize:13 }}>{(numeracaoPeito?.[eventoAtual?.id]||{})[item.atleta.id]||""}</strong></Td>
                          <Td><strong style={{ color: isSerieFinal && j<3?"#1976D2":"#fff" }}>{item.atleta.contaExcluida ? <span style={{ color: "#555", fontStyle: "italic", fontWeight: 400 }} title="Conta excluída — histórico preservado de forma anônima">Atleta Excluído</span> : item.atleta.nome}</strong></Td>
                          <Td>{getExibicaoEquipe(item.atleta, equipes)||"—"}</Td>
                          {isCombPistaSeriavel && Object.keys(serieDoAtletaBlk).length > 0 && <Td>{serieDoAtletaBlk[item.atleta.id] || "—"}</Td>}
                          {temRaiaBlk  && <Td>{getTent(raw,"raia")||"—"}</Td>}
                          {temVentoBlk && <Td>{getTent(raw,"vento")||"—"}</Td>}
                          {isCampoBlk && (() => {
                          const bestT = getBestTentIndex(raw);
                          const isSaltoHoriz = b.prova.nome?.includes("Distância") || b.prova.nome?.includes("Triplo");
                          const fmtTentV = (key, best) => (
                            <div>
                              {fmtTent(getTent(raw, key), best)}
                              {isSaltoHoriz && getTent(raw, key+"v") && (
                                <div style={{ fontSize:8, color:"#6ab4ff", marginTop:1 }}>💨 {getTent(raw, key+"v")}</div>
                              )}
                            </div>
                          );
                          return <>
                            <Td style={{ background:"#080f08" }}>{fmtTentV("t1", bestT==="t1")}</Td>
                            <Td style={{ background:"#080f08" }}>{fmtTentV("t2", bestT==="t2")}</Td>
                            <Td style={{ background:"#080f08" }}>{fmtTentV("t3", bestT==="t3")}</Td>
                            <Td style={{ background:"#060a06" }}>
                              <span style={{ color:"#1976D2", fontWeight:800 }}>
                                {cpPos !== null ? `${cpPos}º` : "—"}
                              </span>
                            </Td>
                            <Td style={{ background:"#0f0800", opacity: cpPos !== null && cpPos <= 8 ? 1 : 0.35 }}>{fmtTentV("t4", bestT==="t4")}</Td>
                            <Td style={{ background:"#0f0800", opacity: cpPos !== null && cpPos <= 8 ? 1 : 0.35 }}>{fmtTentV("t5", bestT==="t5")}</Td>
                            <Td style={{ background:"#0f0800", opacity: cpPos !== null && cpPos <= 8 ? 1 : 0.35 }}>{fmtTentV("t6", bestT==="t6")}</Td>
                          </>;
                        })()}
                          {isAlturaVara && <Td style={{ background:"#05050f", fontSize:11, lineHeight:"1.6" }}>
                            {(() => {
                              // Display altura/vara attempts
                              // Check if raw has the altura/vara details
                              const hasDetalhes = raw && typeof raw === "object" && 
                                (raw.alturas || raw.tentativas);
                              
                              if (!hasDetalhes) {
                                // Old format or no attempts - show debug info
                                return (
                                  <div style={{fontSize:9,color:"#666"}}>
                                    <div>—</div>
                                    <div style={{opacity:0.5}}>
                                      {typeof raw === "object" ? "obj sem tent." : "número"}
                                    </div>
                                    <div style={{fontSize:8,color:"#1976D2"}}>(re-digite)</div>
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
                                const formatT = (t) => {
                                  if (t === "O") return <span style={{color:"#7cfc7c"}}>●</span>;
                                  if (t === "X") return <span style={{color:"#ff6b6b"}}>✗</span>;
                                  if (t === "-") return <span style={{color:"#666"}}>–</span>;
                                  return <span style={{color:"#444"}}>○</span>;
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
                                      color: passed ? "#1976D2" : "#666", 
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
                          <Td><strong style={styles.marca}>{item.isStatus ? (
                            <span style={{ color: item.status === "DQ" ? "#ff4444" : "#ff8844" }}>
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
                                  const tipo = (recordes || []).find(t => t.id === recId);
                                  if (!tipo) return;
                                  const regsRef = hasSnap ? (snap[tipo.id] || []) : (tipo.registros || []);
                                  const sr = regsRef.find(r => r.provaId === b.prova.id && r.categoriaId === b.categoria.id && r.sexo === b.sexo);
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
                              const tipo = (recordes || []).find(t => t.id === recId);
                              if (!tipo) return;
                              const regsRef = hasSnap ? (snapshot[tipo.id] || []) : (tipo.registros || []);
                              const snapRec = regsRef.find(r => r.provaId === b.prova.id && r.categoriaId === b.categoria.id && r.sexo === b.sexo);
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
                                    background: bg.ehMelhor ? "#4a2a00" : "#2a2a0a",
                                    color: bg.ehMelhor ? "#ffd700" : "#1976D2",
                                  }}>
                                    {bg.ehMelhor ? "🏆 NOVO REC" : "⚡ Superou REC"} {bg.sigla}
                                  </span>
                                ))}
                              </div>
                            ) : null;
                          })()}
                          </Td>
                          {isFaseComSeries && <Td style={{ background:"#0a1a0a", textAlign:"center" }}>
                            {(() => {
                              const qq = classifQq[item.atleta?.id];
                              if (!qq) return "";
                              return <strong style={{ color: qq === "Q" ? "#1976D2" : "#1976D2", fontSize:14 }}>{qq}</strong>;
                            })()}
                          </Td>}
                          {pontuacaoAtiva && <Td style={{ background:"#0a1a2a", textAlign:"center" }}>
                            {ptsEqPorAtleta[item.atleta?.id] ? (
                              <span style={{ color:"#1976D2", fontWeight:700, fontSize:14 }}>{ptsEqPorAtleta[item.atleta.id]}</span>
                            ) : <span style={{ color:"#333" }}>—</span>}
                          </Td>}
                        </tr>
                      );
                      }; // end renderRow

                      // ── Renderizar: agrupado por série (ELI/SEM) ou unificado (FIN/legado) ──
                      if (seriesParaRender) {
                        const nCols = 4 + (isCombPistaSeriavel && Object.keys(serieDoAtletaBlk).length > 0 ? 1 : 0)
                          + (temRaiaBlk ? 1 : 0) + (temVentoBlk ? 1 : 0)
                          + (isCampoBlk ? 7 : 0) + (isAlturaVara ? 1 : 0) + 1
                          + (isFaseComSeries ? 1 : 0) + (pontuacaoAtiva ? 1 : 0);
                        return seriesParaRender.flatMap((serie, si) => {
                          // Atletas desta série com resultado
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
                              <td colSpan={nCols} style={{ padding:"8px 12px", background:"#0a1a2a", borderBottom:"2px solid #1a3a5a", color:"#88aaff", fontWeight:700, fontSize:12 }}>
                                Série {serie.numero}
                              </td>
                            </tr>,
                            ...classifSerie.map((item, j) =>
                              renderRow(item, j, item.isStatus ? "" : `${j+1}º`, false)
                            )
                          ];
                        });
                      } else {
                        // Renderização unificada (FIN ou legado)
                        return b.classificados.map((item, j) =>
                          renderRow(item, j, item.isStatus ? "" : (j===0?"🥇":j===1?"🥈":j===2?"🥉":`${j+1}º`), true)
                        );
                      }
                    })()}
                  </tbody>
                </table>
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
                <div style={{ padding:"8px 12px", borderTop:"1px solid #1a1d2a", marginTop:6 }}>
                  {isAmplo ? (
                    <div>
                      <label style={{ fontSize:11, color:"#888", fontWeight:600, display:"block", marginBottom:4 }}>📝 Observações</label>
                      <textarea
                        style={{ width:"100%", minHeight:48, padding:"8px 10px", background:"#0a0b10", border:"1px solid #1a2a3a", borderRadius:6, color:"#ccc", fontSize:12, resize:"vertical", fontFamily:"inherit", lineHeight:1.5 }}
                        placeholder="Observações sobre esta prova (ex: vento, condições, protestos, desclassificações...)"
                        value={obsTexto}
                        onChange={(e) => {
                          const novasObs = { ...(eventoAtual.observacoesProvas || {}), [chaveObs]: e.target.value };
                          editarEvento({ ...eventoAtual, observacoesProvas: novasObs });
                        }}
                      />
                    </div>
                  ) : (
                    obsTexto && <div style={{ fontSize:12, color:"#aaa", whiteSpace:"pre-wrap", lineHeight:1.5 }}>
                      <span style={{ color:"#888", fontWeight:600 }}>📝 Obs:</span> {obsTexto}
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
