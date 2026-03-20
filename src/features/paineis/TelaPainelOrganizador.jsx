import React, { useState } from "react";
import { _getLocalEventoDisplay } from "../../shared/formatters/utils";
import { StatCard } from "../ui/StatCard";
import { Th, Td } from "../ui/TableHelpers";
import { SinoNotificacoes } from "../ui/SinoNotificacoes";
import { gerarHtmlRelatorioParticipacao } from "../impressao/gerarHtmlRelatorioParticipacao";

const PERMISSOES = [
  { id:"ver_competições",    grupo:"Competições",  label:"Visualizar competições" },
  { id:"editar_competições", grupo:"Competições",  label:"Criar / editar competições" },
  { id:"inscricoes",         grupo:"Competições",  label:"Gerenciar inscrições" },
  { id:"resultados",         grupo:"Resultados",   label:"Digitar resultados" },
  { id:"sumulas",            grupo:"Resultados",   label:"Gerenciar súmulas" },
  { id:"camara_chamada",     grupo:"Secretaria",   label:"Câmara de chamada / Medalhas" },
  { id:"atletas",            grupo:"Atletas",      label:"Gerenciar atletas" },
  { id:"funcionarios_ver",   grupo:"Funcionários", label:"Visualizar funcionários" },
];

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

function TelaPainelOrganizador({ usuarioLogado, setTela, eventos, inscricoes, atletas, selecionarEvento, adicionarEvento, editarEvento, excluirEvento, alterarStatusEvento, organizadores, funcionarios, solicitacoesVinculo, responderVinculo, equipes, solicitacoesEquipe=[], aprovarEquipe, recusarEquipe, atualizarAtleta, registrarAcao, setAtletaEditandoId, notificacoes, marcarNotifLida, resultados, solicitacoesRelatorio, resolverRelatorio, sincronizarNomesEquipes }) {
  const tipoOrg = usuarioLogado?.tipo;
  if (tipoOrg !== "organizador" && tipoOrg !== "funcionario" && tipoOrg !== "admin") return (
    <div style={styles.page}><div style={styles.emptyState}>
      <span style={{ fontSize: 48 }}>🚫</span>
      <p style={{ color: "#ff6b6b", fontWeight: 700 }}>Acesso não autorizado</p>
      <button style={styles.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
    </div></div>
  );

  const isFuncionario = usuarioLogado?.tipo === "funcionario";
  const orgId         = isFuncionario ? usuarioLogado?.organizadorId : usuarioLogado?.id;
  const meuOrg        = organizadores?.find(o => o.id === orgId);
  const meusEventos   = eventos.filter(e => e.organizadorId === orgId);
  const isPendente    = meuOrg?.status === "pendente";

  const perms = isFuncionario ? (usuarioLogado?.permissoes || []) : null;
  const temPerm = (p) => perms === null || perms.includes(p);
  const [buscaComp, setBuscaComp] = useState("");
  const [relEvento, setRelEvento] = useState("");
  const [relFiltro, setRelFiltro] = useState("todos"); // todos | equipe | atleta
  const [relEquipeId, setRelEquipeId] = useState("");
  const [relBuscaAtl, setRelBuscaAtl] = useState("");
  const [relAtletasSel, setRelAtletasSel] = useState([]);
  const [relAssinatura, setRelAssinatura] = useState("");

  return (
    <div style={styles.page}>
      <div style={styles.painelHeader}>
        <div>
          <h1 style={styles.pageTitle}>
            {isFuncionario ? "👥 Painel do Funcionário" : "🏟️ Painel do Organizador"}
          </h1>
          <p style={{ color:"#aaa", margin:"4px 0 0" }}>
            {usuarioLogado?.nome}
            {isFuncionario && usuarioLogado?.cargo ? ` — ${usuarioLogado.cargo}` : ""}
            {" "}·{" "}
            <span style={{ color:"#666" }}>{meuOrg?.entidade || usuarioLogado?.entidade || ""}</span>
          </p>
          {isFuncionario && (
            <div style={{ marginTop:6, display:"flex", flexWrap:"wrap", gap:4 }}>
              {(usuarioLogado.permissoes||[]).length === 0
                ? <span style={{ fontSize:11, color:"#ff6b6b" }}>⚠️ Nenhuma permissão concedida</span>
                : (usuarioLogado.permissoes||[]).map(pid => {
                    const p = PERMISSOES.find(x => x.id === pid);
                    return p ? (
                      <span key={pid} style={{ fontSize:10, background:"#1a2a1a", color:"#7cfc7c",
                        padding:"2px 7px", borderRadius:3, fontWeight:600 }}>{p.label}</span>
                    ) : null;
                  })
              }
            </div>
          )}
        </div>
        <div style={styles.painelBtns}>
          <SinoNotificacoes
            notificacoes={notificacoes}
            usuarioId={usuarioLogado?.id}
            marcarNotifLida={marcarNotifLida}
          />
          {(!isFuncionario || temPerm("funcionarios_ver")) &&
            <button style={styles.btnSecondary} onClick={() => setTela("funcionarios")}>👥 Funcionários</button>}
          <button style={styles.btnSecondary} onClick={() => setTela("gerenciar-equipes")}>🏟️ Equipes</button>
          <button style={styles.btnSecondary} onClick={() => setTela("cadastrar-atleta")}>🏃 Atletas</button>
          {temPerm("editar_competições") &&
            <button style={styles.btnPrimary} onClick={() => { selecionarEvento(null); setTela("novo-evento"); }}>+ Nova Competição</button>}
        </div>
      </div>

      {/* Banner de conta pendente (não deveria acontecer — login bloqueia — mas por segurança) */}
      {isPendente && (
        <div style={{ background:"#1a1500", border:"1px solid #1976D2", borderRadius:8, padding:"14px 20px", marginBottom:20 }}>
          <strong style={{ color:"#1976D2" }}>⏳ Conta aguardando aprovação</strong>
          <p style={{ color:"#aaa", fontSize:13, margin:"6px 0 0" }}>
            Seu cadastro está sendo analisado pelo administrador. Você pode configurar seus competições, mas eles só ficarão visíveis ao público após aprovação.
          </p>
        </div>
      )}

      <div style={styles.statsRow}>
        <StatCard value={meusEventos.length}  label="Competições" />
        <StatCard value={meusEventos.filter(e=>!e.inscricoesEncerradas).length} label="Com Inscrições Abertas" />
        <StatCard value={inscricoes.filter(i=>meusEventos.some(e=>e.id===i.eventoId)).length} label="Total Inscrições" />
        {(!isFuncionario || temPerm("funcionarios_ver")) && <StatCard value={funcionarios?.filter(f=>f.organizadorId===orgId).length||0} label="Funcionários" />}
      </div>

      {isFuncionario && (usuarioLogado?.permissoes||[]).length === 0 && (
        <div style={{ background:"#1a0a0a", border:"1px solid #5a1a1a", borderRadius:8,
          padding:"16px 20px", marginBottom:20, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🔒</div>
          <strong style={{ color:"#ff6b6b" }}>Nenhuma permissão concedida</strong>
          <p style={{ color:"#555", fontSize:13, margin:"6px 0 0" }}>
            Solicite ao organizador que configure suas permissões de acesso.
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SEÇÃO 1: ALERTAS — Pendências que requerem ação
         ═══════════════════════════════════════════════════════════════ */}

      {/* ── Solicitações de Relatório Pendentes ── */}
      {(() => {
        const relPendentes = (solicitacoesRelatorio || []).filter(s => {
          if (s.status !== "pendente") return false;
          const evt = eventos.find(e => e.id === s.eventoId);
          return evt?.organizadorId === orgId;
        });
        if (relPendentes.length === 0) return null;
        return (
          <div style={{ background: "#0a1a1a", border: "1px solid #2a5a5a", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>📄</span>
              <div style={{ fontWeight: 700, color: "#88cccc", fontSize: 14 }}>
                {relPendentes.length} solicitação(ões) de relatório pendente(s)
              </div>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr><Th>Solicitante</Th><Th>Tipo</Th><Th>Competição</Th><Th>Data</Th><Th>Ações</Th></tr></thead>
                <tbody>
                  {relPendentes.map(sol => (
                    <tr key={sol.id} style={styles.tr}>
                      <Td><strong style={{ color: "#fff" }}>{sol.solicitanteNome}</strong></Td>
                      <Td><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: sol.solicitanteTipo === "atleta" ? "#0a1a2a" : "#0a2a1a", color: sol.solicitanteTipo === "atleta" ? "#88aaff" : "#7acc44" }}>
                        {sol.solicitanteTipo === "atleta" ? "🏃 Atleta" : "🎽 Equipe"}
                      </span></Td>
                      <Td>{sol.eventoNome}</Td>
                      <Td style={{ fontSize: 11, color: "#555" }}>{new Date(sol.data).toLocaleString("pt-BR")}</Td>
                      <Td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => {
                            const evt = eventos.find(e => e.id === sol.eventoId);
                            if (!evt) return;
                            const atletasFiltrados = (sol.atletaIds || []).map(aid => atletas.find(a => a.id === aid)).filter(Boolean);
                            if (atletasFiltrados.length === 0) return;
                            const org = organizadores?.find(o => o.id === evt.organizadorId);
                            gerarHtmlRelatorioParticipacao(evt, atletasFiltrados, inscricoes, resultados || {}, equipes, org, relAssinatura);
                            resolverRelatorio(sol.id, "gerado");
                          }} style={{ background: "#0d2a2a", border: "1px solid #2a6a6a", color: "#88cccc", borderRadius: 6, padding: "4px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Barlow', sans-serif" }}>
                            📄 Gerar e Enviar
                          </button>
                          <button onClick={() => resolverRelatorio(sol.id, "recusado")}
                            style={{ background: "#1a0a0a", border: "1px solid #5a1a1a", color: "#ff6b6b", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12 }}>
                            ✗ Recusar
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ── Equipes Aguardando Aprovação ── */}
      {(() => {
        const meuOrgId = usuarioLogado?.tipo === "organizador" ? usuarioLogado?.id : usuarioLogado?.organizadorId;
        const pendentes = (solicitacoesEquipe||[]).filter(s => s.status === "pendente" && s.organizadorId === meuOrgId);
        if (pendentes.length === 0) return null;
        return (
          <div style={{ background:"#0a0f1a", border:"1px solid #1a2a4a", borderRadius:12, padding:"16px 20px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:800, color:"#fff" }}>⏳ {pendentes.length} equipe(s) aguardando aprovação</span>
            </div>
            {pendentes.map(sol => (
              <div key={sol.id} style={{ background:"#0d1220", border:"1px solid #252837", borderRadius:8, padding:14, marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                  <div>
                    <div style={{ color:"#fff", fontWeight:700 }}>{sol.equipeNome} <span style={{ color:"#1976D2", fontSize:13 }}>({sol.equipeSigla})</span></div>
                    <div style={{ color:"#888", fontSize:12 }}>{sol.equipeEmail} · CNPJ: {sol.equipeCnpj}</div>
                    <div style={{ color:"#888", fontSize:12 }}>{sol.equipeCidade}/{sol.equipeUf}</div>
                  </div>
                  <div style={{ color:"#555", fontSize:11 }}>{new Date(sol.data).toLocaleDateString("pt-BR")}</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button style={{ background:"linear-gradient(135deg,#1976D2,#1565C0)", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:700, padding:"6px 16px" }}
                    onClick={() => aprovarEquipe?.(sol.equipeId, meuOrgId)}>✅ Aprovar</button>
                  <button style={{ background:"#2a0a0a", color:"#ff6b6b", border:"1px solid #5a1a1a", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:700, padding:"6px 16px" }}
                    onClick={() => recusarEquipe?.(sol.equipeId)}>❌ Recusar</button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Vínculos Pendentes ── */}
      {(() => {
        const meuOrgId = usuarioLogado?.tipo === "organizador" ? usuarioLogado?.id : usuarioLogado?.organizadorId;
        const minhasEquipesIds = new Set((equipes||[]).filter(e => e.organizadorId === meuOrgId).map(e => e.id));
        const pertenceAoOrg = (s) =>
          s.organizadorId === meuOrgId ||
          minhasEquipesIds.has(s.equipeId) ||
          minhasEquipesIds.has(s.equipeAtualId);
        const pendentes = (solicitacoesVinculo||[]).filter(s =>
          s.status === "pendente" && pertenceAoOrg(s)
        );
        if (pendentes.length === 0) return null;
        return (
          <div style={{ background:"#0a1220", border:"1px solid #3a5a8a", borderRadius:12, padding:"16px 20px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <span style={{ fontWeight:700, color:"#88aaff", fontSize:14 }}>🔗 {pendentes.length} vínculo(s) pendente(s)</span>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr>
                  <Th>Atleta</Th><Th>Solicitante</Th><Th>Equipe Atual</Th><Th>Nova Equipe</Th><Th>Tipo</Th><Th>Data</Th><Th>Ação</Th>
                </tr></thead>
                <tbody>
                  {pendentes.map(s => {
                    const equipeNova = equipes?.find(e => e.id === s.equipeId);
                    return (
                      <tr key={s.id} style={styles.tr}>
                        <Td><strong style={{ color:"#fff" }}>{s.atletaNome}</strong></Td>
                        <Td style={{ fontSize:12, color:"#aaa" }}>{s.solicitanteNome || "—"}</Td>
                        <Td style={{ fontSize:12, color:"#cc88ff" }}>{s.equipeAtualNome || (s.equipeAtualId ? "—" : "Sem equipe")}</Td>
                        <Td style={{ color:"#88aaff", fontSize:13 }}>{equipeNova?.nome || s.clube || "—"}</Td>
                        <Td style={{ fontSize:11, color:"#888" }}>
                          {s.aprovadorTipo === "equipe_atual" ? "🔄 Transferência" : "🔗 Vínculo novo"}
                        </Td>
                        <Td style={{ fontSize:11, color:"#555" }}>{new Date(s.data).toLocaleString("pt-BR")}</Td>
                        <Td>
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={() => responderVinculo(s.id, true)}
                              style={{ ...styles.btnGhost, fontSize:12, padding:"4px 14px",
                                color:"#7cfc7c", borderColor:"#2a5a2a" }}>✓ Aceitar</button>
                            <button onClick={() => responderVinculo(s.id, false)}
                              style={{ ...styles.btnGhost, fontSize:12, padding:"4px 12px",
                                color:"#ff6b6b", borderColor:"#5a1a1a" }}>✗ Recusar</button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════
          SEÇÃO 2: COMPETIÇÕES — Core operacional
         ═══════════════════════════════════════════════════════════════ */}

      <h2 style={styles.sectionTitle}>Competições</h2>
      {meusEventos.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={{ fontSize:48 }}>🏟️</span>
          <p>Nenhum competição criado ainda.</p>
          {temPerm("editar_competições") &&
            <button style={styles.btnPrimary} onClick={() => { selecionarEvento(null); setTela("novo-evento"); }}>Criar Competição</button>}
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <input type="text" value={buscaComp} onChange={e => setBuscaComp(e.target.value)} placeholder="🔍 Buscar competição..." style={{ ...styles.input, padding:"6px 12px", fontSize:12, marginBottom:8, maxWidth:350 }} />
          <div style={{ maxHeight:320, overflowY:"auto" }}>
          <table style={styles.table}>
            <thead><tr><Th>Competição</Th><Th>Data</Th><Th>Local</Th><Th>Inscrições</Th><Th>Status</Th><Th>Ações</Th></tr></thead>
            <tbody>
              {meusEventos.filter(ev => {
                if (!buscaComp) return true;
                const b = buscaComp.toLowerCase();
                return (ev.nome||"").toLowerCase().includes(b) || (_getLocalEventoDisplay(ev)||"").toLowerCase().includes(b);
              }).map(ev => {
                const nInsc = inscricoes.filter(i=>i.eventoId===ev.id).length;
                return (
                  <tr key={ev.id} style={styles.tr}>
                    <Td><strong style={{ color:"#1976D2" }}>{ev.nome}</strong></Td>
                    <Td>{new Date(ev.data+"T12:00:00").toLocaleDateString("pt-BR")}</Td>
                    <Td>{_getLocalEventoDisplay(ev)}</Td>
                    <Td><span style={styles.marca}>{nInsc}</span></Td>
                    <Td>
                      {ev.statusAprovacao === "pendente" && (
                        <span style={{ color:"#1976D2", fontSize:11, fontWeight:700, display:"block" }}>⏳ Aguard. aprovação</span>
                      )}
                      {ev.statusAprovacao === "recusado" && (
                        <span style={{ color:"#ff6b6b", fontSize:11, fontWeight:700, display:"block" }}>✗ Recusado pelo admin</span>
                      )}
                      {(!ev.statusAprovacao || ev.statusAprovacao === "aprovado") && (() => {
                        const hoje = new Date().toISOString().slice(0,10);
                        const aindaNaoAbriu = ev.dataAberturaInscricoes && hoje < ev.dataAberturaInscricoes;
                        if (ev.inscricoesEncerradas && aindaNaoAbriu) return (
                          <span style={{ color: "#1976D2", fontSize:12, fontWeight:700 }}>
                            Em Breve
                          </span>
                        );
                        return (
                          <span style={{ color: ev.inscricoesEncerradas?"#ff6b6b":"#7acc44", fontSize:12, fontWeight:700 }}>
                            {ev.inscricoesEncerradas ? "Encerradas" : "Abertas"}
                          </span>
                        );
                      })()}
                    </Td>
                    <Td>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {(temPerm("sumulas") || (ev.sumulaLiberada && usuarioLogado)) && (
                          <button style={{ ...styles.btnSecondary, fontSize:12, padding:"4px 10px" }} onClick={()=>{ selecionarEvento(ev.id); setTela("sumulas"); }} title="Ver súmulas">
                            📋
                          </button>
                        )}
                        <button style={{ ...styles.btnSecondary, fontSize:12, padding:"4px 10px" }} onClick={()=>{ selecionarEvento(ev.id); setTela("resultados"); }} title="Ver resultados">
                          🏆
                        </button>
                        <button style={{ ...styles.btnGhost, fontSize:12, padding:"4px 10px" }} onClick={()=>{ selecionarEvento(ev.id); setTela("evento-detalhe"); }}>Abrir</button>
                        {temPerm("editar_competições") && (
                          <button style={{ ...styles.btnGhost, fontSize:12, padding:"4px 10px", color:"#88aaff", borderColor:"#88aaff66" }}
                            onClick={()=>{ selecionarEvento(ev.id); setTela("novo-evento"); }}>
                            ⚙️ Editar
                          </button>
                        )}
                        {temPerm("inscrições") && (() => {
                          const agora = new Date();
                          const hoje = agora.toISOString().slice(0,10);
                          const aindaNaoAbriu = ev.dataAberturaInscricoes && hoje < ev.dataAberturaInscricoes;
                          if (aindaNaoAbriu) return null;
                          const dtEnc = ev.dataEncerramentoInscricoes
                            ? new Date(ev.dataEncerramentoInscricoes + "T23:59:59")
                            : null;
                          if (!ev.inscricoesEncerradas) {
                            // Só mostrar Encerrar quando abertas
                            if (dtEnc && agora < dtEnc) return null; // encerramento programado, não precisa do botão
                            return (
                              <button style={{ ...styles.btnGhost, fontSize:12, padding:"4px 10px", color:"#ff6b6b", borderColor:"#5a1a1a" }}
                                onClick={()=>alterarStatusEvento(ev.id,{inscricoesEncerradas:true,inscricoesForceEncerradas:true,inscricoesForceAbertas:false})}>
                                🔴 Encerrar
                              </button>
                            );
                          } else {
                            // Só mostrar Reabrir quando fechadas
                            if (dtEnc && agora >= dtEnc) return null; // prazo vencido, não pode reabrir manualmente
                            return (
                              <button style={{ ...styles.btnGhost, fontSize:12, padding:"4px 10px", color:"#7acc44", borderColor:"#2a5a2a" }}
                                onClick={()=>alterarStatusEvento(ev.id,{inscricoesEncerradas:false,inscricoesForceAbertas:true,inscricoesForceEncerradas:false,sumulaLiberada:false})}>
                                🟢 Reabrir
                              </button>
                            );
                          }
                        })()}
                        {temPerm("sumulas") && (
                          <button style={{ ...styles.btnGhost, fontSize:12, padding:"4px 10px", color:"#1976D2", borderColor:"#1976D266" }}
                            onClick={()=>alterarStatusEvento(ev.id,{sumulaLiberada:!ev.sumulaLiberada})}>
                            {ev.sumulaLiberada ? "🔒 Restringir" : "🔓 Súmula"}
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ── Competições Cruzadas: eventos de outros orgs onde somos autorizados ── */}
      {!isFuncionario && (() => {
        const eventosCruzados = eventos.filter(e =>
          Array.isArray(e.orgsAutorizadas) &&
          e.orgsAutorizadas.includes(orgId) &&
          e.organizadorId !== orgId &&
          e.statusAprovacao === "aprovado"
        );
        return (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ ...styles.sectionTitle, marginBottom: 16, display:"flex", alignItems:"center", gap:10 }}>
              🤝 Competições Cruzadas
              {eventosCruzados.length > 0 && (
                <span style={{ background:"#0a2a4a", color:"#5599ff", border:"1px solid #3a5a8a",
                  borderRadius:20, padding:"2px 10px", fontSize:12, fontWeight:700 }}>
                  {eventosCruzados.length}
                </span>
              )}
            </h2>
            <div style={{ background:"#0a0f1a", border:"1px solid #1a3a5a", borderRadius:10,
              padding:"12px 18px", marginBottom:16, fontSize:13, color:"#5599ff", lineHeight:1.6 }}>
              ℹ️ Competições de <strong>outros organizadores</strong> que autorizaram a participação dos seus atletas.
              Você pode visualizar resultados e inscrever atletas nessas competições.
            </div>
            {eventosCruzados.length === 0 ? (
              <div style={{ background:"#0a0c14", border:"1px solid #1a2a3a", borderRadius:10,
                padding:"36px 20px", textAlign:"center" }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🤝</div>
                <div style={{ color:"#555", fontSize:14, marginBottom:6 }}>Nenhuma competição cruzada disponível no momento.</div>
                <div style={{ fontSize:12, color:"#333", lineHeight:1.7 }}>
                  Quando um administrador autorizar sua organização a participar de outra competição, ela aparecerá aqui.
                </div>
              </div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead><tr>
                    <Th>Competição</Th><Th>Organizador</Th><Th>Data</Th><Th>Local</Th>
                    <Th>Seus Atletas</Th><Th>Inscrições</Th><Th>Ações</Th>
                  </tr></thead>
                  <tbody>
                    {eventosCruzados.map(ev => {
                      const orgDoEvento = (organizadores||[]).find(o => o.id === ev.organizadorId);
                      const inscsEvento = inscricoes.filter(i => i.eventoId === ev.id);
                      const seusAtletas = inscsEvento.filter(i =>
                        i.organizadorOrigem === orgId ||
                        (i.participacaoCruzada && atletas.find(a => a.id === i.atletaId)?.organizadorId === orgId)
                      );
                      return (
                        <tr key={ev.id} style={styles.tr}>
                          <Td><strong style={{ color:"#1976D2" }}>{ev.nome}</strong></Td>
                          <Td><span style={{ color:"#5599ff", fontSize:12 }}>
                            {orgDoEvento?.entidade || orgDoEvento?.nome || "—"}
                          </span></Td>
                          <Td>{new Date(ev.data+"T12:00:00").toLocaleDateString("pt-BR")}</Td>
                          <Td>{_getLocalEventoDisplay(ev)}</Td>
                          <Td>
                            <span style={{ fontFamily:"'Barlow Condensed', sans-serif",
                              fontSize:18, fontWeight:800, color: seusAtletas.length > 0 ? "#1976D2" : "#444" }}>
                              {seusAtletas.length}
                            </span>
                          </Td>
                          <Td>
                            <span style={{ color: ev.inscricoesEncerradas ? "#ff6b6b" : "#7acc44",
                              fontSize:12, fontWeight:700 }}>
                              {ev.inscricoesEncerradas ? "Encerradas" : "Abertas"}
                            </span>
                          </Td>
                          <Td>
                            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                              {!ev.inscricoesEncerradas && (
                                <button style={{ ...styles.btnPrimary, fontSize:12, padding:"4px 10px" }}
                                  onClick={() => { selecionarEvento(ev.id); setTela("inscricao-avulsa"); }}>
                                  + Inscrever
                                </button>
                              )}
                              <button style={{ ...styles.btnSecondary, fontSize:12, padding:"4px 10px" }}
                                onClick={() => { selecionarEvento(ev.id); setTela("resultados"); }}>
                                🏆 Resultados
                              </button>
                              <button style={{ ...styles.btnGhost, fontSize:12, padding:"4px 10px" }}
                                onClick={() => { selecionarEvento(ev.id); setTela("evento-detalhe"); }}>
                                Abrir
                              </button>
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════
          SEÇÃO 3: FERRAMENTAS — Colapsáveis, uso menos frequente
         ═══════════════════════════════════════════════════════════════ */}

      {/* ── Gerar Relatório de Participação ── */}
      {temPerm("resultados") && meusEventos.length > 0 && (
        <details style={{ background: "#0a0f14", border: "1px solid #1E2130", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
          <summary style={{ cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 800, color: "#88cccc", letterSpacing: 1 }}>
            📄 Relatório Oficial de Participação
          </summary>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14, alignItems: "flex-end" }}>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#888", letterSpacing:1, marginBottom:4, textTransform:"uppercase" }}>Competição</label>
                <select value={relEvento} onChange={e => { setRelEvento(e.target.value); setRelAtletasSel([]); setRelEquipeId(""); }}
                  style={styles.select}>
                  <option value="">— Selecione —</option>
                  {meusEventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nome}</option>)}
                </select>
              </div>
              {relEvento && (
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#888", letterSpacing:1, marginBottom:4, textTransform:"uppercase" }}>Filtrar por</label>
                  <select value={relFiltro} onChange={e => { setRelFiltro(e.target.value); setRelAtletasSel([]); setRelEquipeId(""); }}
                    style={styles.select}>
                    <option value="todos">Todos os atletas</option>
                    <option value="equipe">Por equipe</option>
                    <option value="atleta">Por atleta</option>
                  </select>
                </div>
              )}
              {relEvento && relFiltro === "equipe" && (() => {
                const inscsEv = (inscricoes || []).filter(i => i.eventoId === relEvento);
                const eqIds = [...new Set(inscsEv.map(i => {
                  const at = atletas.find(a => a.id === i.atletaId);
                  return at?.equipeId;
                }).filter(Boolean))];
                const eqsComInsc = eqIds.map(eid => equipes.find(e => e.id === eid)).filter(Boolean);
                return (
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#888", letterSpacing:1, marginBottom:4, textTransform:"uppercase" }}>Equipe</label>
                    <select value={relEquipeId} onChange={e => setRelEquipeId(e.target.value)} style={styles.select}>
                      <option value="">— Selecione —</option>
                      {eqsComInsc.map(eq => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}
                    </select>
                  </div>
                );
              })()}
              {relEvento && relFiltro === "atleta" && (
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#888", letterSpacing:1, marginBottom:4, textTransform:"uppercase" }}>Buscar atleta</label>
                  <input type="text" value={relBuscaAtl} onChange={e => setRelBuscaAtl(e.target.value)}
                    placeholder="Nome do atleta..." style={{ ...styles.select, minWidth: 200 }} />
                </div>
              )}
            </div>
            {relEvento && relFiltro === "atleta" && relBuscaAtl.length >= 2 && (() => {
              const inscsEv = (inscricoes || []).filter(i => i.eventoId === relEvento);
              const atletaIdsEv = [...new Set(inscsEv.map(i => i.atletaId))];
              const encontrados = atletaIdsEv
                .map(aid => atletas.find(a => a.id === aid))
                .filter(a => a && a.nome.toLowerCase().includes(relBuscaAtl.toLowerCase()))
                .slice(0, 20);
              return encontrados.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {encontrados.map(a => {
                    const sel = relAtletasSel.includes(a.id);
                    return (
                      <button key={a.id} onClick={() => setRelAtletasSel(p => sel ? p.filter(x => x !== a.id) : [...p, a.id])}
                        style={{ background: sel ? "#0d2a2a" : "#0d0e12", border: `1px solid ${sel ? "#3a7a7a" : "#252837"}`, color: sel ? "#88cccc" : "#888", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontFamily: "'Barlow', sans-serif" }}>
                        {sel ? "✓ " : ""}{a.nome}
                      </button>
                    );
                  })}
                </div>
              ) : null;
            })()}
            {relAtletasSel.length > 0 && relFiltro === "atleta" && (
              <div style={{ fontSize: 11, color: "#88cccc", marginBottom: 10 }}>{relAtletasSel.length} atleta(s) selecionado(s)</div>
            )}
            {/* Upload de assinatura */}
            <div style={{ background: "#0d0e12", border: "1px solid #252837", borderRadius: 8, padding: "12px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8 }}>✍️ ASSINATURA DO ORGANIZADOR (opcional)</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <label style={{ background: "#141720", border: "1px solid #252837", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, color: "#aaa" }}>
                  📁 Selecionar imagem
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setRelAssinatura(ev.target.result);
                    reader.readAsDataURL(file);
                  }} />
                </label>
                {relAssinatura && (
                  <>
                    <img src={relAssinatura} alt="Assinatura" style={{ maxHeight: 48, maxWidth: 160, objectFit: "contain" }} />
                    <button onClick={() => setRelAssinatura("")} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: 11 }}>✕ Remover</button>
                  </>
                )}
                {!relAssinatura && <span style={{ fontSize: 11, color: "#555" }}>PNG com fundo transparente recomendado</span>}
              </div>
            </div>
            <button disabled={!relEvento} onClick={() => {
              const evt = eventos.find(e => e.id === relEvento);
              if (!evt) return;
              const inscsEv = (inscricoes || []).filter(i => i.eventoId === relEvento);
              let atletaIds;
              if (relFiltro === "equipe" && relEquipeId) {
                atletaIds = [...new Set(inscsEv.map(i => i.atletaId).filter(aid => {
                  const at = atletas.find(a => a.id === aid);
                  return at?.equipeId === relEquipeId;
                }))];
              } else if (relFiltro === "atleta" && relAtletasSel.length > 0) {
                atletaIds = relAtletasSel;
              } else {
                atletaIds = [...new Set(inscsEv.map(i => i.atletaId))];
              }
              const atletasFiltrados = atletaIds.map(aid => atletas.find(a => a.id === aid)).filter(Boolean);
              if (atletasFiltrados.length === 0) { alert("Nenhum atleta encontrado para os filtros selecionados."); return; }
              const org = organizadores?.find(o => o.id === evt.organizadorId);
              gerarHtmlRelatorioParticipacao(evt, atletasFiltrados, inscricoes, resultados || {}, equipes, org, relAssinatura);
            }} style={{ background: relEvento ? "linear-gradient(135deg, #1976D2, #1565C0)" : "#222", color: relEvento ? "#fff" : "#555", border: "none", padding: "10px 24px", borderRadius: 8, cursor: relEvento ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>
              📄 Gerar Relatório
            </button>
          </div>
        </details>
      )}

      {/* ── Histórico de Relatórios ── */}
      {(() => {
        const relHistorico = (solicitacoesRelatorio || []).filter(s => {
          if (s.status === "pendente") return false;
          const evt = eventos.find(e => e.id === s.eventoId);
          return evt?.organizadorId === orgId;
        }).sort((a, b) => (b.resolvidoEm || b.data || "").localeCompare(a.resolvidoEm || a.data || "")).slice(0, 20);
        if (relHistorico.length === 0) return null;
        return (
          <details style={{ background: "#0a0a10", border: "1px solid #1E2130", borderRadius: 10, padding: "12px 18px", marginBottom: 16 }}>
            <summary style={{ cursor: "pointer", color: "#666", fontSize: 13, fontWeight: 600 }}>
              📂 Histórico de relatórios ({relHistorico.length})
            </summary>
            <div style={{ marginTop: 12, overflowX: "auto" }}>
              <table style={styles.table}>
                <thead><tr><Th>Solicitante</Th><Th>Competição</Th><Th>Status</Th><Th>Data</Th></tr></thead>
                <tbody>
                  {relHistorico.map(s => {
                    const cor = s.status === "gerado" ? "#7cfc7c" : "#ff6b6b";
                    return (
                      <tr key={s.id} style={styles.tr}>
                        <Td><strong style={{ color: "#fff" }}>{s.solicitanteNome}</strong></Td>
                        <Td>{s.eventoNome}</Td>
                        <Td><span style={{ background: cor + "22", color: cor, border: `1px solid ${cor}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                          {s.status === "gerado" ? "✓ Gerado" : "✗ Recusado"}
                        </span></Td>
                        <Td style={{ fontSize: 11, color: "#555" }}>{s.resolvidoEm ? new Date(s.resolvidoEm).toLocaleString("pt-BR") : "—"}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        );
      })()}

      {/* ── Histórico de Vínculos ── */}
      {(() => {
        const meuOrgId = usuarioLogado?.tipo === "organizador" ? usuarioLogado?.id : usuarioLogado?.organizadorId;
        const minhasEquipesIds = new Set((equipes||[]).filter(e => e.organizadorId === meuOrgId).map(e => e.id));
        const pertenceAoOrg = (s) =>
          s.organizadorId === meuOrgId ||
          minhasEquipesIds.has(s.equipeId) ||
          minhasEquipesIds.has(s.equipeAtualId);
        const historico = (solicitacoesVinculo||[]).filter(s =>
          s.status !== "pendente" && pertenceAoOrg(s)
        ).sort((a,b) => new Date(b.resolvidoEm||b.data) - new Date(a.resolvidoEm||a.data)).slice(0,30);
        if (historico.length === 0) return null;
        return (
          <details style={{ background:"#0a0a10", border:"1px solid #1E2130", borderRadius:10, padding:"12px 18px", marginBottom:16 }}>
            <summary style={{ cursor:"pointer", color:"#666", fontSize:13, fontWeight:600 }}>
              📂 Histórico de vínculos ({historico.length})
            </summary>
            <div style={{ marginTop:12, overflowX:"auto" }}>
              <table style={styles.table}>
                <thead><tr>
                  <Th>Atleta</Th><Th>Equipe Atual</Th><Th>Nova Equipe</Th><Th>Status</Th><Th>Resolvido por</Th><Th>Data</Th>
                </tr></thead>
                <tbody>
                  {historico.map(s => {
                    const statusColor = s.status === "aceito" ? "#7cfc7c" : "#ff6b6b";
                    const equipeNova = equipes?.find(e => e.id === s.equipeId);
                    return (
                      <tr key={s.id} style={styles.tr}>
                        <Td><strong style={{ color:"#fff" }}>{s.atletaNome}</strong></Td>
                        <Td style={{ fontSize:12, color:"#cc88ff" }}>{s.equipeAtualNome || (s.equipeAtualId ? "—" : "Sem equipe")}</Td>
                        <Td style={{ fontSize:12, color:"#88aaff" }}>{equipeNova?.nome || s.clube || "—"}</Td>
                        <Td>
                          <span style={{ background:statusColor+"22", color:statusColor,
                            border:`1px solid ${statusColor}44`, borderRadius:4,
                            padding:"2px 8px", fontSize:11, fontWeight:700 }}>
                            {s.status === "aceito" ? "✓ Aceito" : "✗ Recusado"}
                          </span>
                        </Td>
                        <Td style={{ fontSize:11, color:"#888" }}>
                          {s.resolvidoPorNome || "—"} {s.resolvidoPorTipo ? `(${s.resolvidoPorTipo})` : ""}
                        </Td>
                        <Td style={{ fontSize:11, color:"#555" }}>
                          {s.resolvidoEm ? new Date(s.resolvidoEm).toLocaleString("pt-BR") : new Date(s.data).toLocaleString("pt-BR")}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        );
      })()}

    </div>
  );
}

export default TelaPainelOrganizador;
