import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { todasAsProvas, nPernasRevezamento, isRevezamentoMisto } from "../../shared/athletics/provasDef";
import { CATEGORIAS } from "../../shared/constants/categorias";
import { ProvaSelector } from "../ui/ProvaSelector";

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

function TelaInscricaoRevezamento({ setTela, eventoAtual, inscricoes, atletas, equipes, excluirInscricao, adicionarInscricao, atualizarInscricao, usuarioLogado, registrarAcao, numeracaoPeito }) {
  const confirmar = useConfirm();
  if (!eventoAtual) return <div style={styles.page}><div style={styles.emptyState}><p>Nenhuma competição selecionada.</p></div></div>;

  const tipoUser = usuarioLogado?.tipo;
  const isPrivileg = tipoUser === "admin" || tipoUser === "organizador" || tipoUser === "funcionario";
  if (!isPrivileg && isInscricaoEncerradaAgora(eventoAtual)) return (
    <div style={styles.page}>
      <div style={styles.emptyState}>
        <span style={{ fontSize: 48 }}>🔒</span>
        <p style={{ fontWeight: 700, color: "#fff", fontSize: 18 }}>Inscrições Encerradas</p>
        <p style={{ color: "#666", fontSize: 14 }}>
          As inscrições para <strong>{eventoAtual.nome}</strong> estão encerradas.
        </p>
        <button style={styles.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar</button>
      </div>
    </div>
  );

  if (!isPrivileg && usuarioLogado?.lgpdConsentimentoRevogado) return (
    <div style={styles.page}>
      <div style={styles.emptyState}>
        <span style={{ fontSize: 48 }}>🔓</span>
        <p style={{ fontWeight: 700, color: "#ff6b6b", fontSize: 18 }}>Consentimento Revogado</p>
        <p style={{ color: "#888", fontSize: 14, maxWidth: 420, textAlign: "center", lineHeight: 1.6 }}>
          Você revogou seu consentimento LGPD. Novas inscrições não são permitidas.<br/>
          Para voltar a se inscrever em competições, realize um novo cadastro.
        </p>
        <button style={styles.btnGhost} onClick={() => setTela("home")}>← Voltar ao Início</button>
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

  // Equipes com atletas inscritos neste evento
  const equipesComInscritos = (() => {
    const eqSet = new Set();
    inscsEvt.filter(i => i.tipo !== "revezamento").forEach(i => {
      const a = atletas.find(at => at.id === i.atletaId);
      if (a) { const eqId = a.equipeId || (a.clube ? "clube_" + a.clube : ""); if (eqId) eqSet.add(eqId); }
    });
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

  // Pool de atletas: parte das INSCRIÇÕES INDIVIDUAIS do evento para a equipe selecionada
  // Inclui atletas de participação cruzada (orgsAutorizadas) inscritos no mesmo evento
  const atletasPool = (() => {
    if (!revezForm?.equipeId) return [];
    const atletasInscritos = [];
    const vistos = new Set();
    // Organizadores autorizados para participação cruzada neste evento
    const orgsAutorizadas = new Set(eventoAtual?.orgsAutorizadas || []);
    inscsEvt.filter(i => i.tipo !== "revezamento").forEach(i => {
      if (!i.atletaId || vistos.has(i.atletaId)) return;
      vistos.add(i.atletaId);
      const a = atletas.find(at => at.id === i.atletaId);
      if (!a) return;
      const eqId = a.equipeId || (a.clube ? "clube_" + a.clube : "");
      const ehDaEquipe = eqId === revezForm.equipeId;
      // Atleta cruzado: pertence a org autorizada E está inscrito neste evento
      const ehCruzado = orgsAutorizadas.size > 0 && a.organizadorId && orgsAutorizadas.has(a.organizadorId);
      if ((ehDaEquipe || ehCruzado) && (isMisto || a.sexo === revezForm.sexo)) {
        atletasInscritos.push({ ...a, _cruzado: ehCruzado && !ehDaEquipe });
      }
    });
    return atletasInscritos;
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
    if (!revezForm.editId && inscsRevez.some(i =>
      i.provaId === revezForm.provaId && i.equipeId === revezForm.equipeId &&
      (i.categoriaOficialId || i.categoriaId) === catFinal && i.sexo === revezForm.sexo
    )) { setFeedback("❌ Equipe já inscrita nesta prova/categoria/sexo."); return; }
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
      catId: insc.categoriaOficialId || insc.categoriaId,
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
    <div style={styles.page}>
      <div style={styles.painelHeader}>
        <div>
          <h1 style={styles.pageTitle}>🏃‍♂️ Inscrição de Revezamento</h1>
          <div style={{ color: "#666", fontSize: 13 }}>
            {eventoAtual.nome} — {provasRevez.length} prova(s) · {inscsVisiveis.length} equipe(s) inscrita(s)
          </div>
        </div>
        <button style={styles.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar</button>
      </div>

      {feedback && (
        <div style={{ background: feedback.includes("❌") ? "#1a0a0a" : "#0a1a0a", border: `1px solid ${feedback.includes("❌") ? "#8a2a2a" : "#2a8a2a"}`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: feedback.includes("❌") ? "#ff6b6b" : "#4cff4c", fontSize: 13 }}>
          {feedback}
        </div>
      )}

      {/* ── INSCRIÇÕES EXISTENTES ── */}
      {inscsVisiveis.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: "#1976D2", fontSize: 16, marginBottom: 10, fontFamily: "'Barlow Condensed', sans-serif" }}>
            Equipes Inscritas
          </h2>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead><tr>
                <th style={styles.th}>Prova</th>
                <th style={styles.th}>Cat.</th>
                <th style={styles.th}>Sexo</th>
                <th style={styles.th}>Equipe</th>
                <th style={styles.th}>Atletas</th>
                <th style={styles.th}>Ações</th>
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
                    <tr key={insc.id} style={styles.tr}>
                      <td style={styles.td}>{prv?.nome || insc.provaId}</td>
                      <td style={styles.td}>{CATEGORIAS.find(c => c.id === (insc.categoriaOficialId || insc.categoriaId))?.nome || "—"}</td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <span style={{ color: insc.sexo === "M" ? "#1a6ef5" : "#e54f9b" }}>{insc.sexo === "M" ? "Masc" : "Fem"}</span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: 600, color: "#1976D2" }}>{nomeEq}{siglaEq}</td>
                      <td style={{ ...styles.td, fontSize: 11 }}>
                        {nomesStr ? <span style={{ color: "#aaa" }}>{nomesStr}</span> : null}
                        {temInvalidos && <span style={{ color: "#ff6b6b", fontWeight: 600 }}> ⚠ {nomes.filter(n => n === null).length} ID(s) inválido(s) — edite para corrigir</span>}
                        {!nomesStr && !temInvalidos && <span style={{ color: "#666" }}>Sem atletas</span>}
                      </td>
                      <td style={{ ...styles.td, whiteSpace: "nowrap" }}>
                        <button onClick={() => abrirEdicao(insc)}
                          style={{ ...styles.btnGhost, fontSize: 11, padding: "3px 8px", marginRight: 6 }} title="Editar">✏️ Editar</button>
                        <button onClick={() => handleExcluir(insc)}
                          style={{ ...styles.btnGhost, fontSize: 11, padding: "3px 8px", color: "#ff6b6b", borderColor: "#5a1a1a" }} title="Remover">🗑️</button>
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
        <div style={{ ...styles.emptyState, marginBottom: 24 }}>
          <span style={{ fontSize: 48 }}>🏃‍♂️</span>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: 16 }}>Nenhuma equipe inscrita em revezamentos</p>
          <p style={{ color: "#888", fontSize: 13 }}>Clique no botão abaixo para inscrever a primeira equipe.</p>
        </div>
      )}

      {/* ── BOTÃO NOVA INSCRIÇÃO ── */}
      {!revezForm && (
        <button style={{ ...styles.btnPrimary, marginBottom: 20 }}
          onClick={() => setRevezForm({ provaId: provasRevez[0]?.id || "", catId: "", sexo: provasRevez[0]?.id?.startsWith("F_") ? "F" : "M", equipeId: equipesDisponiveis.length === 1 ? equipesDisponiveis[0].id : "", atletasIds: [] })}>
          ＋ Inscrever Equipe em Revezamento
        </button>
      )}

      {/* ── FORMULÁRIO ── */}
      {revezForm && (
        <div style={{ background: "#0d0e14", border: "1px solid #1976D244", borderRadius: 12, padding: 20 }}>
          <div style={{ color: "#1976D2", fontWeight: 700, fontSize: 17, marginBottom: 16, fontFamily: "'Barlow Condensed', sans-serif" }}>
            {revezForm.editId ? "✏️ Editar Inscrição" : "➕ Nova Inscrição de Revezamento"}
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Prova</div>
              <select style={{ ...styles.input, minWidth: 200 }} value={revezForm.provaId}
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
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Sexo</div>
              <select style={{ ...styles.input, minWidth: 120 }} value={revezForm.sexo}
                onChange={e => setRevezForm(f => ({ ...f, sexo: e.target.value, atletasIds: [] }))}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Equipe</div>
              <select style={{ ...styles.input, minWidth: 220 }} value={revezForm.equipeId}
                onChange={e => setRevezForm(f => ({ ...f, equipeId: e.target.value, atletasIds: [] }))}>
                <option value="">Selecione a equipe...</option>
                {equipesDisponiveis.map(eq => <option key={eq.id} value={eq.id}>{eq.nome}{eq.sigla ? ` (${eq.sigla})` : ""}</option>)}
              </select>
            </div>
          </div>

          {/* Seleção de atletas */}
          {revezForm.equipeId && revezForm.provaId && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: "#1976D2", fontWeight: 700, marginBottom: 10 }}>
                🏃 Selecione {nPernas} Atletas {isMisto ? "(Misto)" : revezForm.sexo === "M" ? "(Masculino)" : "(Feminino)"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Array.from({ length: nPernas }).map((_, idx) => {
                  const atletaSel = revezForm.atletasIds[idx] ? atletas.find(a => a.id === revezForm.atletasIds[idx]) : null;
                  const resB = buscarAtleta(revezBusca[idx]);
                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#1976D2", fontWeight: 700, minWidth: 28, fontSize: 14 }}>{idx + 1}.</span>
                      {atletaSel ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: "#111420", padding: "6px 12px", borderRadius: 6, border: "1px solid #2a2d3a" }}>
                          <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{atletaSel.nome}</span>
                          <span style={{ color: atletaSel.sexo === "M" ? "#1a6ef5" : "#e54f9b", fontSize: 10 }}>{atletaSel.sexo}</span>
                          {atletaSel.cbat && <span style={{ color: "#666", fontSize: 10 }}>CBAt: {atletaSel.cbat}</span>}
                          {numPeito[atletaSel.id] && <span style={{ color: "#888", fontSize: 10 }}>Nº {numPeito[atletaSel.id]}</span>}
                          <button onClick={async () => {
                            setRevezForm(f => { const ids = [...f.atletasIds]; ids[idx] = ""; return { ...f, atletasIds: ids }; });
                            setRevezBusca(prev => { const n = [...prev]; n[idx] = ""; return n; });
                          }} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: 14, marginLeft: "auto" }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ flex: 1, position: "relative" }}>
                          <input placeholder="Clique para ver atletas ou digite para buscar..."
                            value={revezBusca[idx] || ""}
                            onFocus={() => setFocusIdx(idx)}
                            onBlur={() => setTimeout(() => setFocusIdx(-1), 200)}
                            onChange={e => { setRevezBusca(prev => { const n = [...prev]; n[idx] = e.target.value; return n; }); setFocusIdx(idx); }}
                            style={{ ...styles.input, width: "100%", fontSize: 13 }} />
                          {focusIdx === idx && resB.length > 0 && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "#1a1c22", border: "1px solid #333", borderRadius: 6, maxHeight: 220, overflowY: "auto" }}>
                              {resB.map(a => {
                                const jaEscolhido = revezForm.atletasIds.includes(a.id);
                                return (
                                  <div key={a.id} onClick={async () => {
                                    if (jaEscolhido) return;
                                    setRevezForm(f => { const ids = [...f.atletasIds]; while (ids.length <= idx) ids.push(""); ids[idx] = a.id; return { ...f, atletasIds: ids }; });
                                    setRevezBusca(prev => { const n = [...prev]; n[idx] = ""; return n; });
                                    setFocusIdx(-1);
                                  }} style={{ padding: "8px 12px", cursor: jaEscolhido ? "not-allowed" : "pointer", borderBottom: "1px solid #222", opacity: jaEscolhido ? 0.4 : 1 }}
                                    onMouseEnter={e => { if (!jaEscolhido) e.currentTarget.style.background = "#252830"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                                    <span style={{ color: "#fff", fontSize: 13 }}>{a.nome}</span>
                                    <span style={{ color: a.sexo === "M" ? "#1a6ef5" : "#e54f9b", fontSize: 10, marginLeft: 8 }}>{a.sexo}</span>
                                    {a._cruzado && <span style={{ color: "#5599ff", fontSize: 10, marginLeft: 6, background: "#0a1a2a", border: "1px solid #1a3a5a", borderRadius: 4, padding: "0 5px" }}>🤝 cruzado</span>}
                                    {a.cbat && <span style={{ color: "#666", fontSize: 10, marginLeft: 8 }}>CBAt: {a.cbat}</span>}
                                    {numPeito[a.id] && <span style={{ color: "#888", fontSize: 10, marginLeft: 8 }}>Nº {numPeito[a.id]}</span>}
                                    {jaEscolhido && <span style={{ color: "#1976D2", fontSize: 10, marginLeft: 8 }}>(já selecionado)</span>}
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
                <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 8, padding: 10, background: "#1a0a0a", borderRadius: 6, border: "1px solid #3a1a1a" }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>⚠️ Nenhum atleta encontrado</p>
                  <p style={{ margin: "4px 0 0", color: "#cc8888", fontSize: 11 }}>
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
                      <p style={{ margin: "6px 0 0", color: "#888", fontSize: 10 }}>
                        Diagnóstico: {todosAtletasEquipe.length} atleta(s) da equipe inscrito(s) no evento
                        {todosAtletasEquipe.length > 0 && !isMisto && ` · ${doSexo.length} do sexo ${revezForm.sexo === "M" ? "masc." : "fem."}`}
                      </p>
                    );
                  })()}
                </div>
              )}
              {atletasPool.length > 0 && (
                <p style={{ color: "#4caf50", fontSize: 11, marginTop: 4 }}>
                  ✅ {atletasPool.length} atleta(s) disponível(eis) — clique no campo para ver a lista
                </p>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button style={styles.btnPrimary} onClick={handleSalvar}>
              💾 {revezForm.editId ? "Atualizar Inscrição" : "Inscrever Equipe"}
            </button>
            <button style={styles.btnGhost} onClick={async () => { setRevezForm(null); setRevezBusca(["","","","",""]); setFeedback(""); }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── INFO ── */}
      <div style={{ marginTop: 24, padding: 14, background: "#0a0d14", borderRadius: 8, border: "1px solid #1a2a3a" }}>
        <div style={{ fontSize: 12, color: "#888" }}>
          💡 <strong>Dica:</strong> Os atletas devem estar inscritos individualmente em alguma prova para aparecerem na busca.
          A composição da equipe pode ser alterada até o início da prova.
        </div>
      </div>
    </div>
  );
}



export default TelaInscricaoRevezamento;
