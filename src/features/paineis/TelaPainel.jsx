import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { _getClubeAtleta } from "../../shared/formatters/utils";
import { StatCard } from "../ui/StatCard";
import { Th, Td } from "../ui/TableHelpers";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";

function getStyles(t) {
  return {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: t.textPrimary, marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: t.textPrimary, marginBottom: 20, letterSpacing: 1 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  statCard: { background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 12, padding: "18px 24px", textAlign: "center", minWidth: 100 },
  statValue: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: t.accent, lineHeight: 1, marginBottom: 6 },
  statLabel: { fontSize: 13, color: t.textMuted, letterSpacing: 1 },
  btnPrimary: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: t.accent, border: `2px solid ${t.accentBorder}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost: { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  btnIconSm: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textMuted, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: t.bgCardAlt, border: `1px solid ${t.border}`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: `1px solid ${t.border}` },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: t.bgHeaderSolid, padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` },
  td: { padding: "12px 16px", fontSize: 14, color: t.textSecondary, borderBottom: `1px solid ${t.border}` },
  tr: { transition: "background 0.15s" },
  trOuro: { background: t.trOuro },
  trPrata: { background: t.trPrata },
  trBronze: { background: t.trBronze },
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
  catPreview: { background: t.bgInput, border: `1px solid ${t.accent}`, borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: t.textTertiary },
  atletaInfo: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12, padding: "10px 14px", background: t.bgInput, borderRadius: 8, fontSize: 13 },
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.accent, marginBottom: 16 },
  formPage: { maxWidth: 640, margin: "60px auto", padding: "0 24px 80px" },
  formCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32, marginBottom: 20 },
  formTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: t.textPrimary, textAlign: "center", marginBottom: 8 },
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
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  savedBadge: { background: t.bgCardAlt, border: `1px solid ${t.success}44`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  digitarDica: { color: t.textDimmed, fontSize: 12 },
  inputMarca: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", color: t.accent, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
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
    background: status === "ao_vivo" ? `${t.danger}18` : status === "hoje_pre" ? `${t.accent}18` : status === "futuro" ? `${t.success}18` : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textDisabled,
    border: `1px solid ${status === "ao_vivo" ? `${t.danger}44` : status === "hoje_pre" ? `${t.accent}44` : status === "futuro" ? `${t.success}44` : t.border}`,
  }),
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: t.textPrimary, fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  statusBarItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  statusDot: (cor) => ({ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }),
  statusDotInline: (cor) => ({ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: cor, background: cor + "22", border: `1px solid ${cor}44`, borderRadius: 10, padding: "2px 8px", whiteSpace: "nowrap" }),
  statusControlsCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusControlsTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: t.accent, letterSpacing: 1, marginBottom: 14 },
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
  permissividadeTag: (ativo) => ({ display: "inline-block", background: ativo ? `${t.success}18` : t.bgCard, border: `1px solid ${ativo ? `${t.success}66` : t.border}`, color: ativo ? t.success : t.textDisabled, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600 }),
  permissividadeAlert: { display: "flex", gap: 14, alignItems: "flex-start", background: `${t.success}10`, border: `1px solid ${t.success}66`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 },
  permissividadeAlertIcon: { fontSize: 28, flexShrink: 0, marginTop: 2 },
  permissividadeAlertTitle: { fontWeight: 700, color: t.success, fontSize: 15, marginBottom: 4 },
  permissividadeAlertBody: { color: t.textTertiary, fontSize: 13, lineHeight: 1.6, marginBottom: 6 },
  permissividadeAlertRodape: { fontSize: 12, color: t.textDimmed, fontStyle: "italic" },
  filtroProvasBar: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 20 },
  filtroProvasBloco: { display: "flex", flexDirection: "column", gap: 8 },
  filtroProvasLabel: { fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 },
  filtroProvasPills: { display: "flex", flexWrap: "wrap", gap: 6 },
  filtroPill: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textDimmed, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5, transition: "all 0.15s" },
  filtroPillAtivo: { background: t.bgHover, border: `1px solid ${t.accent}`, color: t.accent },
  filtroClearBtn: { background: "none", border: "none", color: `${t.accent}88`, cursor: "pointer", fontSize: 11, fontFamily: "'Barlow', sans-serif", padding: "0 4px", textDecoration: "underline" },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? t.bgHover : "transparent", color: ativo ? t.accent : t.textDisabled, border: `1px solid ${ativo ? t.accentBorder : t.border}` }),
  stepDivider: { flex: 1, height: 1, background: t.border, margin: "0 8px" },
  modoSwitch: { display: "flex", gap: 0, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: t.textDimmed, padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: t.bgInput, color: t.accent },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: t.bgHover, borderColor: t.accent, color: t.accent },
  grupoProvasBox: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 16, overflow: "hidden" },
  grupoProvasHeader: { background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  provaCheckBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", lineHeight: 1.4, userSelect: "none" },
  provaCheckBtnSel: { background: t.bgHover, borderColor: t.accent, color: t.accent },
};
}

function InscricaoProvaRow({ insc, prova, atleta, provasDisp, inscAberta, atualizarInscricao, excluirInscricao }) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const confirmar = useConfirm();
  const [editando, setEditando] = useState(false);
  const [novaProvaId, setNovaProvaId] = useState("");

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10,
      padding:"6px 0", borderBottom:`1px solid ${t.border}` }}>
      {editando ? (
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:6 }}>
          <select value={novaProvaId} onChange={e => setNovaProvaId(e.target.value)}
            style={{ flex:1, background:t.bgInput, color: t.textPrimary, border:`1px solid ${t.accent}`,
              borderRadius:4, padding:"4px 8px", fontSize:12 }}>
            <option value="">Selecione a nova prova...</option>
            {provasDisp.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <button onClick={async () => {
            if (!novaProvaId) return;
            atualizarInscricao({ ...insc, provaId: novaProvaId });
            setEditando(false); setNovaProvaId("");
          }}
            style={{ ...s.btnGhost, fontSize:10, padding:"2px 8px", color:t.success, borderColor:`${t.success}66` }}>
            ✓
          </button>
          <button onClick={async () => { setEditando(false); setNovaProvaId(""); }}
            style={{ ...s.btnGhost, fontSize:10, padding:"2px 8px" }}>
            ✕
          </button>
        </div>
      ) : (
        <>
          <span style={{ flex:1, fontSize:13, color: t.textSecondary }}>
            {prova?.nome || insc.provaId}
          </span>
          <span style={{ fontSize:10, color: t.textDimmed }}>
            {insc.data ? new Date(insc.data).toLocaleDateString("pt-BR") : ""}
          </span>
          {insc.inscritoPorNome && (
            <span style={{ fontSize:10, color: insc.inscritoPorTipo === "atleta" ? t.success : t.accent }}>
              {insc.inscritoPorTipo === "atleta" ? "🏃" : insc.inscritoPorTipo === "treinador" ? "👨‍🏫" : "🎽"} {insc.inscritoPorNome}
            </span>
          )}
          {inscAberta && (
            <div style={{ display:"flex", gap:4 }}>
              <button onClick={() => setEditando(true)}
                style={{ ...s.btnGhost, fontSize:10, padding:"2px 8px" }}
                title="Trocar prova">
                ✏️
              </button>
              <button onClick={async () => { 
                if (await confirmar(`Excluir inscrição de ${atleta?.nome } em ${prova?.nome}?`)) excluirInscricao(insc.id, { confirmado: true });
              }}
                style={{ ...s.btnGhost, fontSize:10, padding:"2px 8px", color: t.danger, borderColor:"#3a1a1a" }}
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


function TelaPainel() {
  const { usuarioLogado } = useAuth();
  const { atletas, inscricoes, eventos, equipes, excluirInscricao, atualizarInscricao, responderVinculo } = useEvento();
  const { setTela, solicitacoesVinculo, treinadores } = useApp();
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const confirmar = useConfirm();
  const isTreinador = usuarioLogado?.tipo === "treinador";
  const equipeId = isTreinador ? usuarioLogado.equipeId : usuarioLogado?.id;
  
  if (usuarioLogado?.tipo !== "equipe" && !isTreinador) return (
    <div style={s.page}><div style={s.emptyState}>
      <span style={{ fontSize: 48 }}>🚫</span>
      <p style={{ color: t.danger, fontWeight: 700 }}>Acesso restrito a equipes</p>
      <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
    </div></div>
  );

  const meusAtletas    = atletas.filter((a) => a.equipeId === equipeId);
  // Solicitações de vínculo: atleta ou equipe pedindo para ser vinculado a mim
  const vincPendentes     = (solicitacoesVinculo||[]).filter(sol =>
    sol.equipeId === equipeId && sol.status === "pendente"
    && sol.aprovadorTipo !== "equipe_atual"); // atleta sem equipe pedindo p/ mim

  // Transferências: outra equipe quer levar meu atleta
  const transferenciasPend = (solicitacoesVinculo||[]).filter(sol =>
    sol.equipeAtualId === equipeId && sol.status === "pendente"
    && sol.aprovadorTipo === "equipe_atual");
  // Inscrições da equipe — em todos os eventos, ou filtrado pelo atual
  const minhasInscricoes = inscricoes.filter((i) => {
    const atleta = atletas.find((a) => a.id === i.atletaId);
    return atleta?.equipeId === equipeId;
  });
  // Ano base: evento selecionado ou ano atual
  const anoBase = new Date().getFullYear();
  // Contagem de treinadores da equipe
  const meusTreinadores = (treinadores||[]).filter(tr => tr.equipeId === equipeId);
  const [buscaInscEq, setBuscaInscEq] = useState("");

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>🎽 Painel da Equipe</h1>
          <p style={{ color: t.textTertiary, margin: "4px 0 0" }}>
            {usuarioLogado?.nome}{isTreinador ? ` (Treinador) — ${usuarioLogado?.equipeNome}` : (usuarioLogado?.entidade ? ` — ${usuarioLogado.entidade}` : "")}
          </p>
        </div>
        <div style={s.painelBtns}>
          <button style={s.btnPrimary} onClick={() => setTela("cadastrar-atleta")}>🏃 Atletas</button>
          <button style={s.btnSecondary} onClick={() => setTela("treinadores")}>👨‍🏫 Treinadores</button>
        </div>
      </div>

      <div style={s.statsRow}>
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
            <h2 style={s.sectionTitle}>📋 Inscrições da Equipe</h2>
            <input type="text" value={buscaInscEq} onChange={e => setBuscaInscEq(e.target.value)} placeholder="🔍 Buscar competição ou atleta..." style={{ ...s.input, padding:"6px 12px", fontSize:12, marginBottom:8, maxWidth:350 }} />
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
                <details key={ev.id} open style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, 
                  borderRadius:10, marginBottom:10, overflow:"hidden" }}>
                  <summary style={{ padding:"12px 18px", cursor:"pointer", color: t.accent, 
                    fontWeight:700, fontSize:14, display:"flex", alignItems:"center", gap:10 }}>
                    <span>{ev.nome}</span>
                    <span style={{ background:`${t.success}18`, color:t.success, fontSize:11,
                      padding:"2px 10px", borderRadius:10, fontWeight:600 }}>
                      {inscsEvento.length} inscrição(ões) · {atletaIds.length} atleta(s)
                    </span>
                    <span style={{ color: t.textDimmed, fontSize:11, fontWeight:400 }}>
                      📅 {new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR")}
                    </span>
                  </summary>
                  <div style={{ padding:"0 18px 14px" }}>
                    {atletasAgrupados.map(({ atleta, inscsAtleta }) => (
                      <div key={atleta?.id || "?"} style={{ background:t.bgCardAlt, border:`1px solid ${t.border}`,
                        borderRadius:8, marginBottom:8, overflow:"hidden" }}>
                        {/* Cabeçalho do atleta */}
                        <div style={{ padding:"10px 14px", display:"flex", alignItems:"center", gap:10,
                          borderBottom:`1px solid ${t.border}`, background:t.bgHeaderSolid }}>
                          <div style={{
                            width:32, height:32, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:14, fontWeight:700,
                            background: atleta?.sexo === "M" ? `${t.accent}18` : "#ff88cc18",
                            border: `1.5px solid ${atleta?.sexo === "M" ? t.accent : "#ff88cc"}`,
                            color: atleta?.sexo === "M" ? t.accent : "#ff88cc",
                          }}>
                            {atleta?.sexo === "M" ? "M" : "F"}
                          </div>
                          <div style={{ flex:1 }}>
                            <span style={{ color: t.textPrimary, fontWeight:600, fontSize:13 }}>{atleta?.nome || "—"}</span>
                            <span style={{ ...s.badgeGold, marginLeft:8, fontSize:10 }}>
                              {inscsAtleta[0]?.categoriaOficial || inscsAtleta[0]?.categoria || "—"}
                            </span>
                          </div>
                          <span style={{ color: t.textDimmed, fontSize:11 }}>{inscsAtleta.length} prova(s)</span>
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
        <div style={{ background:`${t.accent}10`, border:`1px solid ${t.accent}44`, borderRadius:10,
          padding:"16px 20px", marginBottom:24 }}>
          <h2 style={{ ...s.sectionTitle, color:t.accent, marginTop:0 }}>
            🔗 Solicitações de Vínculo Pendentes
            <span style={{ background: t.accent, color: t.textPrimary, borderRadius:12, fontSize:12,
              fontWeight:800, padding:"2px 9px", marginLeft:10 }}>{vincPendentes.length}</span>
          </h2>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead><tr>
                <Th>Atleta</Th><Th>Equipe Solicitada</Th><Th>Data</Th><Th>Ação</Th>
              </tr></thead>
              <tbody>
                {vincPendentes.map(sol => (
                  <tr key={sol.id} style={s.tr}>
                    <Td><strong style={{ color: t.textPrimary }}>{sol.atletaNome}</strong></Td>
                    <Td><span style={{ color:t.accent }}>{sol.clube||"—"}</span></Td>
                    <Td style={{ fontSize:11, color: t.textDimmed }}>
                      {new Date(sol.data).toLocaleString("pt-BR")}
                    </Td>
                    <Td>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={() => responderVinculo(sol.id, true)}
                          style={{ ...s.btnGhost, fontSize:12, padding:"4px 14px",
                            color:t.success, borderColor:`${t.success}66` }}>
                          ✓ Aceitar
                        </button>
                        <button onClick={() => responderVinculo(sol.id, false)}
                          style={{ ...s.btnGhost, fontSize:12, padding:"4px 12px",
                            color: t.danger, borderColor:`${t.danger}66` }}>
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
        const historico = (solicitacoesVinculo||[]).filter(sol =>
          (sol.equipeId === equipeId || sol.equipeAtualId === equipeId) &&
          sol.status !== "pendente"
        ).sort((a,b) => new Date(b.resolvidoEm || b.data) - new Date(a.resolvidoEm || a.data))
         .slice(0, 20);
        if (historico.length === 0) return null;
        return (
          <details style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:10,
            padding:"14px 18px", marginBottom:24 }}>
            <summary style={{ cursor:"pointer", color: t.textDimmed, fontSize:13, fontWeight:600,
              display:"flex", alignItems:"center", gap:8 }}>
              📂 Histórico de Vínculos
              <span style={{ background:t.bgCard, color: t.textDimmed, borderRadius:12, fontSize:11,
                fontWeight:700, padding:"1px 8px" }}>{historico.length}</span>
            </summary>
            <div style={{ marginTop:12, overflowX:"auto" }}>
              <table style={s.table}>
                <thead><tr>
                  <Th>Atleta</Th><Th>Tipo</Th><Th>Status</Th><Th>Resolvido por</Th><Th>Data</Th>
                </tr></thead>
                <tbody>
                  {historico.map(sol => {
                    const statusColor = sol.status === "aceito" ? t.success : t.danger;
                    const foiTransf = sol.equipeAtualId === equipeId;
                    return (
                      <tr key={sol.id} style={s.tr}>
                        <Td><strong style={{ color: t.textPrimary }}>{sol.atletaNome}</strong></Td>
                        <Td style={{ fontSize:11, color: t.textMuted }}>
                          {foiTransf ? "🔄 Transferência saiu" : sol.aprovadorTipo === "equipe_atual" ? "🔄 Transferência entrou" : "🔗 Vínculo"}
                        </Td>
                        <Td>
                          <span style={{ background: statusColor+"22", color: statusColor,
                            border: `1px solid ${statusColor}44`, borderRadius:4,
                            padding:"2px 8px", fontSize:11, fontWeight:700 }}>
                            {sol.status === "aceito" ? "✓ Aceito" : "✗ Recusado"}
                          </span>
                        </Td>
                        <Td style={{ fontSize:11, color: t.textMuted }}>
                          {sol.resolvidoPorNome || "—"}
                          {sol.resolvidoPorTipo && <span style={{ color: t.textDimmed, marginLeft:4 }}>({sol.resolvidoPorTipo})</span>}
                        </Td>
                        <Td style={{ fontSize:11, color: t.textDimmed }}>
                          {sol.resolvidoEm ? new Date(sol.resolvidoEm).toLocaleString("pt-BR") : new Date(sol.data).toLocaleString("pt-BR")}
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
        <div style={{ background:`${t.warning}10`, border:`1px solid ${t.warning}44`, borderRadius:10,
          padding:"16px 20px", marginBottom:24 }}>
          <h2 style={{ ...s.sectionTitle, color:t.warning, marginTop:0 }}>
            🔄 Solicitações de Transferência
            <span style={{ background: t.accent, color: t.textPrimary, borderRadius:12, fontSize:12,
              fontWeight:800, padding:"2px 9px", marginLeft:10 }}>{transferenciasPend.length}</span>
          </h2>
          <p style={{ color: t.textMuted, fontSize:12, marginBottom:12, lineHeight:1.6 }}>
            Outra equipe está solicitando a transferência de um atleta seu. Aprovar libera o atleta para o novo vínculo.
          </p>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead><tr>
                <Th>Atleta</Th><Th>Nova Equipe</Th><Th>Clube</Th><Th>Data</Th><Th>Ação</Th>
              </tr></thead>
              <tbody>
                {transferenciasPend.map(sol => {
                  const novaEquipe = equipes?.find(eq => eq.id === sol.equipeId);
                  return (
                    <tr key={sol.id} style={s.tr}>
                      <Td><strong style={{ color: t.textPrimary }}>{sol.atletaNome}</strong></Td>
                      <Td><span style={{ color:t.warning }}>{novaEquipe?.nome || "—"}</span></Td>
                      <Td><span style={{ color: t.textTertiary, fontSize:12 }}>{sol.clube || "—"}</span></Td>
                      <Td style={{ fontSize:11, color: t.textDimmed }}>
                        {new Date(sol.data).toLocaleString("pt-BR")}
                      </Td>
                      <Td>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => responderVinculo(sol.id, true)}
                            style={{ ...s.btnGhost, fontSize:12, padding:"4px 14px",
                              color:t.success, borderColor:`${t.success}66` }}>
                            ✓ Aprovar
                          </button>
                          <button onClick={() => responderVinculo(sol.id, false)}
                            style={{ ...s.btnGhost, fontSize:12, padding:"4px 12px",
                              color: t.danger, borderColor:`${t.danger}66` }}>
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
