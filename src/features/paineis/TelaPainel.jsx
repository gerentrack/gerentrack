import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { _getClubeAtleta } from "../../shared/formatters/utils";
import { StatCard } from "../ui/StatCard";
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

function InscricaoProvaRow({ insc, prova, atleta, provasDisp, inscAberta, atualizarInscricao, excluirInscricao }) {
  const [editando, setEditando] = useState(false);
  const [novaProvaId, setNovaProvaId] = useState("");

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10,
      padding:"6px 0", borderBottom:"1px solid #111320" }}>
      {editando ? (
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:6 }}>
          <select value={novaProvaId} onChange={e => setNovaProvaId(e.target.value)}
            style={{ flex:1, background:"#0a0a14", color:"#fff", border:"1px solid #1976D2",
              borderRadius:4, padding:"4px 8px", fontSize:12 }}>
            <option value="">Selecione a nova prova...</option>
            {provasDisp.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <button onClick={async () => {
            if (!novaProvaId) return;
            atualizarInscricao({ ...insc, provaId: novaProvaId });
            setEditando(false); setNovaProvaId("");
          }}
            style={{ ...styles.btnGhost, fontSize:10, padding:"2px 8px", color:"#7cfc7c", borderColor:"#2a5a2a" }}>
            ✓
          </button>
          <button onClick={async () => { setEditando(false); setNovaProvaId(""); }}
            style={{ ...styles.btnGhost, fontSize:10, padding:"2px 8px" }}>
            ✕
          </button>
        </div>
      ) : (
        <>
          <span style={{ flex:1, fontSize:13, color:"#ccc" }}>
            {prova?.nome || insc.provaId}
          </span>
          <span style={{ fontSize:10, color:"#555" }}>
            {insc.data ? new Date(insc.data).toLocaleDateString("pt-BR") : ""}
          </span>
          {insc.inscritoPorNome && (
            <span style={{ fontSize:10, color: insc.inscritoPorTipo === "atleta" ? "#7cfc7c" : "#1976D2" }}>
              {insc.inscritoPorTipo === "atleta" ? "🏃" : insc.inscritoPorTipo === "treinador" ? "👨‍🏫" : "🎽"} {insc.inscritoPorNome}
            </span>
          )}
          {inscAberta && (
            <div style={{ display:"flex", gap:4 }}>
              <button onClick={() => setEditando(true)}
                style={{ ...styles.btnGhost, fontSize:10, padding:"2px 8px" }}
                title="Trocar prova">
                ✏️
              </button>
              <button onClick={async () => { 
                if (await confirmar(`Excluir inscrição de ${atleta?.nome } em ${prova?.nome}?`)) excluirInscricao(insc.id, { confirmado: true });
              }}
                style={{ ...styles.btnGhost, fontSize:10, padding:"2px 8px", color:"#ff6b6b", borderColor:"#3a1a1a" }}
                title="Excluir inscrição">
                🗑
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}


function TelaPainel({ usuarioLogado, setTela, atletas, inscricoes, eventos, solicitacoesVinculo, responderVinculo, equipes, excluirInscricao, atualizarInscricao, treinadores }) {
  const confirmar = useConfirm();
  const isTreinador = usuarioLogado?.tipo === "treinador";
  const equipeId = isTreinador ? usuarioLogado.equipeId : usuarioLogado?.id;
  
  if (usuarioLogado?.tipo !== "equipe" && !isTreinador) return (
    <div style={styles.page}><div style={styles.emptyState}>
      <span style={{ fontSize: 48 }}>🚫</span>
      <p style={{ color: "#ff6b6b", fontWeight: 700 }}>Acesso restrito a equipes</p>
      <button style={styles.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
    </div></div>
  );

  const meusAtletas    = atletas.filter((a) => a.equipeId === equipeId);
  // Solicitações de vínculo: atleta ou equipe pedindo para ser vinculado a mim
  const vincPendentes     = (solicitacoesVinculo||[]).filter(s =>
    s.equipeId === equipeId && s.status === "pendente"
    && s.aprovadorTipo !== "equipe_atual"); // atleta sem equipe pedindo p/ mim

  // Transferências: outra equipe quer levar meu atleta
  const transferenciasPend = (solicitacoesVinculo||[]).filter(s =>
    s.equipeAtualId === equipeId && s.status === "pendente"
    && s.aprovadorTipo === "equipe_atual");
  // Inscrições da equipe — em todos os eventos, ou filtrado pelo atual
  const minhasInscricoes = inscricoes.filter((i) => {
    const atleta = atletas.find((a) => a.id === i.atletaId);
    return atleta?.equipeId === equipeId;
  });
  // Ano base: evento selecionado ou ano atual
  const anoBase = new Date().getFullYear();
  // Contagem de treinadores da equipe
  const meusTreinadores = (treinadores||[]).filter(t => t.equipeId === equipeId);
  const [buscaInscEq, setBuscaInscEq] = useState("");

  return (
    <div style={styles.page}>
      <div style={styles.painelHeader}>
        <div>
          <h1 style={styles.pageTitle}>🎽 Painel da Equipe</h1>
          <p style={{ color: "#aaa", margin: "4px 0 0" }}>
            {usuarioLogado?.nome}{isTreinador ? ` (Treinador) — ${usuarioLogado?.equipeNome}` : (usuarioLogado?.entidade ? ` — ${usuarioLogado.entidade}` : "")}
          </p>
        </div>
        <div style={styles.painelBtns}>
          <button style={styles.btnPrimary} onClick={() => setTela("cadastrar-atleta")}>🏃 Atletas</button>
          <button style={styles.btnSecondary} onClick={() => setTela("treinadores")}>👨‍🏫 Treinadores</button>
        </div>
      </div>

      <div style={styles.statsRow}>
        <StatCard value={meusAtletas.length} label="Meus Atletas" />
        <StatCard value={minhasInscricoes.length} label="Inscrições" />
        <StatCard value={meusTreinadores.length} label="Treinadores" />
        <StatCard value={meusAtletas.filter((a) => a.sexo === "M").length} label="Masculino" />
        <StatCard value={meusAtletas.filter((a) => a.sexo === "F").length} label="Feminino" />
      </div>



      {/* ── Inscrições da Equipe — agrupado por competição → atleta ── */}
      {(() => {
        const todasProvas = todasAsProvas();
        const eventosComInsc = eventos.filter(ev => 
          minhasInscricoes.some(i => i.eventoId === ev.id)
        );
        if (eventosComInsc.length === 0) return null;
        return (
          <div style={{ marginBottom: 24 }}>
            <h2 style={styles.sectionTitle}>📋 Inscrições da Equipe</h2>
            <input type="text" value={buscaInscEq} onChange={e => setBuscaInscEq(e.target.value)} placeholder="🔍 Buscar competição ou atleta..." style={{ ...styles.input, padding:"6px 12px", fontSize:12, marginBottom:8, maxWidth:350 }} />
            <div style={{ maxHeight:400, overflowY:"auto" }}>
            {eventosComInsc.filter(ev => {
              if (!buscaInscEq) return true;
              const b = buscaInscEq.toLowerCase();
              if ((ev.nome||"").toLowerCase().includes(b)) return true;
              const inscsEv = minhasInscricoes.filter(i => i.eventoId === ev.id);
              return inscsEv.some(i => { const a = atletas.find(at => at.id === i.atletaId); return a && (a.nome||"").toLowerCase().includes(b); });
            }).map(ev => {
              const inscsEvento = minhasInscricoes.filter(i => i.eventoId === ev.id);
              const inscAberta = !ev.inscricoesEncerradas;
              // Agrupar por atleta
              const atletaIds = [...new Set(inscsEvento.map(i => i.atletaId))];
              const atletasAgrupados = atletaIds.map(aId => {
                const atleta = atletas.find(a => a.id === aId);
                const inscsAtleta = inscsEvento.filter(i => i.atletaId === aId);
                return { atleta, inscsAtleta };
              }).sort((a, b) => (a.atleta?.nome || "").localeCompare(b.atleta?.nome || ""));

              return (
                <details key={ev.id} open style={{ background:"#0a0a1a", border:"1px solid #1a2a3a", 
                  borderRadius:10, marginBottom:10, overflow:"hidden" }}>
                  <summary style={{ padding:"12px 18px", cursor:"pointer", color:"#1976D2", 
                    fontWeight:700, fontSize:14, display:"flex", alignItems:"center", gap:10 }}>
                    <span>{ev.nome}</span>
                    <span style={{ background:"#1a2a1a", color:"#7cfc7c", fontSize:11, 
                      padding:"2px 10px", borderRadius:10, fontWeight:600 }}>
                      {inscsEvento.length} inscrição(ões) · {atletaIds.length} atleta(s)
                    </span>
                    <span style={{ color:"#555", fontSize:11, fontWeight:400 }}>
                      📅 {new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR")}
                    </span>
                  </summary>
                  <div style={{ padding:"0 18px 14px" }}>
                    {atletasAgrupados.map(({ atleta, inscsAtleta }) => (
                      <div key={atleta?.id || "?"} style={{ background:"#0D0E14", border:"1px solid #1E2130",
                        borderRadius:8, marginBottom:8, overflow:"hidden" }}>
                        {/* Cabeçalho do atleta */}
                        <div style={{ padding:"10px 14px", display:"flex", alignItems:"center", gap:10,
                          borderBottom:"1px solid #1E2130", background:"#0a0b12" }}>
                          <div style={{
                            width:32, height:32, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:14, fontWeight:700,
                            background: atleta?.sexo === "M" ? "#88aaff18" : "#ff88cc18",
                            border: `1.5px solid ${atleta?.sexo === "M" ? "#88aaff" : "#ff88cc"}`,
                            color: atleta?.sexo === "M" ? "#88aaff" : "#ff88cc",
                          }}>
                            {atleta?.sexo === "M" ? "M" : "F"}
                          </div>
                          <div style={{ flex:1 }}>
                            <span style={{ color:"#fff", fontWeight:600, fontSize:13 }}>{atleta?.nome || "—"}</span>
                            <span style={{ ...styles.badgeGold, marginLeft:8, fontSize:10 }}>
                              {inscsAtleta[0]?.categoriaOficial || inscsAtleta[0]?.categoria || "—"}
                            </span>
                          </div>
                          <span style={{ color:"#666", fontSize:11 }}>{inscsAtleta.length} prova(s)</span>
                        </div>
                        {/* Provas do atleta */}
                        <div style={{ padding:"6px 14px" }}>
                          {inscsAtleta.map(i => {
                            const prova = todasProvas.find(p => p.id === i.provaId);
                            // Provas disponíveis para troca (mesmo sexo, no programa, não já inscrito)
                            const provasDisp = inscAberta ? todasProvas.filter(p =>
                              p.id.startsWith(atleta?.sexo + "_") &&
                              (ev.provasPrograma || []).includes(p.id) &&
                              p.id !== i.provaId &&
                              !inscsAtleta.some(x => x.provaId === p.id)
                            ) : [];
                            return (
                              <InscricaoProvaRow key={i.id} insc={i} prova={prova} atleta={atleta}
                                provasDisp={provasDisp} inscAberta={inscAberta}
                                atualizarInscricao={atualizarInscricao} excluirInscricao={excluirInscricao} />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
            </div>
          </div>
        );
      })()}

      {/* ── Solicitações de Vínculo Pendentes ──────────────── */}
      {vincPendentes.length > 0 && (
        <div style={{ background:"#0a1220", border:"1px solid #3a5a8a", borderRadius:10,
          padding:"16px 20px", marginBottom:24 }}>
          <h2 style={{ ...styles.sectionTitle, color:"#88aaff", marginTop:0 }}>
            🔗 Solicitações de Vínculo Pendentes
            <span style={{ background:"#1976D2", color:"#fff", borderRadius:12, fontSize:12,
              fontWeight:800, padding:"2px 9px", marginLeft:10 }}>{vincPendentes.length}</span>
          </h2>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead><tr>
                <Th>Atleta</Th><Th>Equipe Solicitada</Th><Th>Data</Th><Th>Ação</Th>
              </tr></thead>
              <tbody>
                {vincPendentes.map(sol => (
                  <tr key={sol.id} style={styles.tr}>
                    <Td><strong style={{ color:"#fff" }}>{sol.atletaNome}</strong></Td>
                    <Td><span style={{ color:"#88aaff" }}>{sol.clube||"—"}</span></Td>
                    <Td style={{ fontSize:11, color:"#555" }}>
                      {new Date(sol.data).toLocaleString("pt-BR")}
                    </Td>
                    <Td>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={() => responderVinculo(sol.id, true)}
                          style={{ ...styles.btnGhost, fontSize:12, padding:"4px 14px",
                            color:"#7cfc7c", borderColor:"#2a5a2a" }}>
                          ✓ Aceitar
                        </button>
                        <button onClick={() => responderVinculo(sol.id, false)}
                          style={{ ...styles.btnGhost, fontSize:12, padding:"4px 12px",
                            color:"#ff6b6b", borderColor:"#5a1a1a" }}>
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
      )}


      {/* ── Histórico de Solicitações de Vínculo ───────────── */}
      {(() => {
        const historico = (solicitacoesVinculo||[]).filter(s =>
          (s.equipeId === equipeId || s.equipeAtualId === equipeId) &&
          s.status !== "pendente"
        ).sort((a,b) => new Date(b.resolvidoEm || b.data) - new Date(a.resolvidoEm || a.data))
         .slice(0, 20);
        if (historico.length === 0) return null;
        return (
          <details style={{ background:"#0a0a10", border:"1px solid #1E2130", borderRadius:10,
            padding:"14px 18px", marginBottom:24 }}>
            <summary style={{ cursor:"pointer", color:"#666", fontSize:13, fontWeight:600,
              display:"flex", alignItems:"center", gap:8 }}>
              📂 Histórico de Vínculos
              <span style={{ background:"#1a1a1a", color:"#555", borderRadius:12, fontSize:11,
                fontWeight:700, padding:"1px 8px" }}>{historico.length}</span>
            </summary>
            <div style={{ marginTop:12, overflowX:"auto" }}>
              <table style={styles.table}>
                <thead><tr>
                  <Th>Atleta</Th><Th>Tipo</Th><Th>Status</Th><Th>Resolvido por</Th><Th>Data</Th>
                </tr></thead>
                <tbody>
                  {historico.map(s => {
                    const statusColor = s.status === "aceito" ? "#7cfc7c" : "#ff6b6b";
                    const foiTransf = s.equipeAtualId === equipeId;
                    return (
                      <tr key={s.id} style={styles.tr}>
                        <Td><strong style={{ color:"#fff" }}>{s.atletaNome}</strong></Td>
                        <Td style={{ fontSize:11, color:"#888" }}>
                          {foiTransf ? "🔄 Transferência saiu" : s.aprovadorTipo === "equipe_atual" ? "🔄 Transferência entrou" : "🔗 Vínculo"}
                        </Td>
                        <Td>
                          <span style={{ background: statusColor+"22", color: statusColor,
                            border: `1px solid ${statusColor}44`, borderRadius:4,
                            padding:"2px 8px", fontSize:11, fontWeight:700 }}>
                            {s.status === "aceito" ? "✓ Aceito" : "✗ Recusado"}
                          </span>
                        </Td>
                        <Td style={{ fontSize:11, color:"#888" }}>
                          {s.resolvidoPorNome || "—"}
                          {s.resolvidoPorTipo && <span style={{ color:"#555", marginLeft:4 }}>({s.resolvidoPorTipo})</span>}
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

      {/* ── Transferências solicitadas por outras equipes ───── */}
      {transferenciasPend.length > 0 && (
        <div style={{ background:"#1a0a1a", border:"1px solid #6a3a8a", borderRadius:10,
          padding:"16px 20px", marginBottom:24 }}>
          <h2 style={{ ...styles.sectionTitle, color:"#cc88ff", marginTop:0 }}>
            🔄 Solicitações de Transferência
            <span style={{ background:"#1976D2", color:"#fff", borderRadius:12, fontSize:12,
              fontWeight:800, padding:"2px 9px", marginLeft:10 }}>{transferenciasPend.length}</span>
          </h2>
          <p style={{ color:"#888", fontSize:12, marginBottom:12, lineHeight:1.6 }}>
            Outra equipe está solicitando a transferência de um atleta seu. Aprovar libera o atleta para o novo vínculo.
          </p>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead><tr>
                <Th>Atleta</Th><Th>Nova Equipe</Th><Th>Clube</Th><Th>Data</Th><Th>Ação</Th>
              </tr></thead>
              <tbody>
                {transferenciasPend.map(sol => {
                  const novaEquipe = equipes?.find(t => t.id === sol.equipeId);
                  return (
                    <tr key={sol.id} style={styles.tr}>
                      <Td><strong style={{ color:"#fff" }}>{sol.atletaNome}</strong></Td>
                      <Td><span style={{ color:"#cc88ff" }}>{novaEquipe?.nome || "—"}</span></Td>
                      <Td><span style={{ color:"#aaa", fontSize:12 }}>{sol.clube || "—"}</span></Td>
                      <Td style={{ fontSize:11, color:"#555" }}>
                        {new Date(sol.data).toLocaleString("pt-BR")}
                      </Td>
                      <Td>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => responderVinculo(sol.id, true)}
                            style={{ ...styles.btnGhost, fontSize:12, padding:"4px 14px",
                              color:"#7cfc7c", borderColor:"#2a5a2a" }}>
                            ✓ Aprovar
                          </button>
                          <button onClick={() => responderVinculo(sol.id, false)}
                            style={{ ...styles.btnGhost, fontSize:12, padding:"4px 12px",
                              color:"#ff6b6b", borderColor:"#5a1a1a" }}>
                            ✗ Recusar
                          </button>
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

    </div>
  );
}


export default TelaPainel;
