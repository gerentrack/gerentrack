import React, { useState, useEffect, useRef } from "react";
import { todasAsProvas, getComposicaoCombinada } from "../../shared/athletics/provasDef";
import { CATEGORIAS, ESTADOS_BR, getCategoria } from "../../shared/constants/categorias";
import FormField from "../ui/FormField";
import { storage, storageRef, uploadBytes, getDownloadURL } from "../../firebase";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";

// Faz upload da imagem para Firebase Storage e retorna a URL pública
async function uploadLogo(file, eventoId, campo) {
  const ext = file.name.split(".").pop();
  const path = `logos/${eventoId}/${campo}.${ext}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  return await getDownloadURL(ref);
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

// ─── EDITOR DE TEXTO RICO (SIMPLES) ──────────────────────────────────────────
function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const [iniciado, setIniciado] = useState(false);

  useEffect(() => {
    if (editorRef.current && !iniciado) {
      editorRef.current.innerHTML = value || "";
      setIniciado(true);
    }
  }, [value, iniciado]);

  const execCmd = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    // Atualiza o state com o conteúdo atual
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const isActive = (cmd) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  const [, forceUpdate] = useState(0);
  const handleSelect = () => forceUpdate(n => n + 1);

  const btnStyle = (active) => ({
    padding: "4px 10px", border: "1px solid", cursor: "pointer",
    borderRadius: 4, fontSize: 13, fontFamily: "Inter, sans-serif", minWidth: 32,
    background: active ? "#1976D2" : "#0D0E12",
    color: active ? "#000" : "#aaa",
    borderColor: active ? "#1976D2" : "#2a2d3a",
    fontWeight: active ? 700 : 400,
  });

  const highlightColors = [
    { label: "🟡", color: "#ffe066", title: "Amarelo" },
    { label: "🟢", color: "#7cfc7c", title: "Verde" },
    { label: "🔵", color: "#66b3ff", title: "Azul" },
    { label: "🔴", color: "#ff6b6b", title: "Vermelho" },
    { label: "✖", color: "transparent", title: "Remover grifo" },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8, padding:"6px 8px",
        background:"#0D0E12", border:"1px solid #2a2d3a", borderRadius:"6px 6px 0 0" }}>
        <button type="button" onClick={() => execCmd("bold")} style={btnStyle(isActive("bold"))} title="Negrito (Ctrl+B)">
          <strong>N</strong>
        </button>
        <button type="button" onClick={() => execCmd("underline")} style={btnStyle(isActive("underline"))} title="Sublinhado (Ctrl+U)">
          <span style={{ textDecoration:"underline" }}>S</span>
        </button>
        <button type="button" onClick={() => execCmd("italic")} style={btnStyle(isActive("italic"))} title="Itálico (Ctrl+I)">
          <em>I</em>
        </button>
        <div style={{ width:1, background:"#2a2d3a", margin:"0 4px" }} />
        <button type="button" onClick={() => execCmd("insertUnorderedList")} style={btnStyle(isActive("insertUnorderedList"))} title="Lista">
          ☰
        </button>
        <button type="button" onClick={() => execCmd("removeFormat")} style={btnStyle(false)} title="Limpar formatação">
          🧹
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onSelect={handleSelect}
        onMouseUp={handleSelect}
        onKeyUp={handleSelect}
        data-placeholder={placeholder}
        style={{
          minHeight: 140, maxHeight: 400, overflowY: "auto",
          padding: "12px 16px",
          background: "#13141a", border: "1px solid #2a2d3a", borderTop: "none",
          borderRadius: "0 0 6px 6px", color: "#ddd",
          fontFamily: "'Inter', sans-serif", fontSize: 14, lineHeight: 1.7,
          outline: "none", whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}
      />

      <style>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #444;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}


// ─── CADASTRO / EDIÇÃO DE EVENTO ─────────────────────────────────────────────
// ── Acordeão extraído fora do componente para evitar re-render/perda de foco ──
function Acordeao({ keyName, titulo, icone, resumo, children, aberto, onToggle }) {
  return (
    <div style={{ background:"#0a0a1a", border:`1px solid ${aberto ? "#1976D244" : "#1a2a3a"}`, borderRadius:10, marginBottom:12, overflow:"hidden", transition:"border-color 0.2s" }}>
      <button type="button" onClick={() => onToggle(keyName)}
        style={{ width:"100%", background:"transparent", border:"none", padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", textAlign:"left", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
          <span style={{ fontSize:18 }}>{icone}</span>
          <span style={{ color:"#1976D2", fontWeight:700, fontSize:14 }}>{titulo}</span>
          {!aberto && <span style={{ color:"#555", fontSize:12, marginLeft:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{resumo}</span>}
        </div>
        <span style={{ color:"#555", fontSize:14, flexShrink:0, transform: aberto ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 0.2s", display:"inline-block" }}>▾</span>
      </button>
      {aberto && (
        <div style={{ padding:"0 18px 18px" }}>
          {children}
        </div>
      )}
    </div>
  );
}


function TelaCadastroEvento({ setTela, adicionarEvento, editarEvento, eventoAtual, eventoAtualId, selecionarEvento, usuarioLogado, organizadores, recordes, equipes = [],
  cadEventoGoStep, setCadEventoGoStep, inscricoes = [], atletas = [] }) {
  const s = useStylesResponsivos(styles);
  const editando = eventoAtual && eventoAtualId && true;
  const tipoEvt = usuarioLogado?.tipo;
  if (tipoEvt !== "admin" && tipoEvt !== "organizador" && tipoEvt !== "funcionario") return (
    <div style={s.page}><div style={s.emptyState}>
      <span style={{ fontSize: 48 }}>🚫</span>
      <p style={{ color: "#ff6b6b", fontWeight: 700 }}>Acesso não autorizado</p>
      <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
    </div></div>
  );

  // Bloqueio de edição se competição finalizada
  if (editando && eventoAtual.competicaoFinalizada) return (
    <div style={s.page}><div style={s.emptyState}>
      <span style={{ fontSize: 48 }}>🔒</span>
      <p style={{ color: "#ff6b6b", fontWeight: 700, fontSize: 18 }}>Competição Finalizada</p>
      <p style={{ color: "#888", fontSize: 14, maxWidth: 400, textAlign: "center", lineHeight: 1.6 }}>
        Esta competição foi finalizada{eventoAtual.competicaoFinalizadaEm ? ` em ${new Date(eventoAtual.competicaoFinalizadaEm).toLocaleString("pt-BR")}` : ""}
        {eventoAtual.competicaoFinalizadaPor ? ` por ${eventoAtual.competicaoFinalizadaPor}` : ""}.
        <br/><br/>
        Os dados estão <strong style={{ color: "#ff6b6b" }}>bloqueados para edição</strong>.
        Para desbloquear, solicite autorização a um <strong style={{ color: "#1976D2" }}>administrador</strong>.
      </p>
      <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar à Competição</button>
    </div></div>
  );

  const [form, setForm] = useState(() => {
    const base = editando ? { ...eventoAtual } : {
      nome: "", data: "", local: "", cidade: "", uf: "", descricao: "", permissividadeNorma: false,
      permiteSub16CategoriasSup: false, revezamentoInscAntecipada: true,
      inscricoesEncerradas: false, sumulaLiberada: false,
      dataAberturaInscricoes: "", horaAberturaInscricoes: "", dataEncerramentoInscricoes: "", horaEncerramentoInscricoes: "",
      provasPrograma: [],
      programaHorario: {},
      modoHorario: "detalhado",
      programaOrdem: [],
      programaPausa: { horario: "", retorno: "", descricao: "" },
      organizadorId: usuarioLogado?.tipo === "organizador" ? usuarioLogado.id : "",
      orgsAutorizadas: [],
    };
    if (!("dataAberturaInscricoes" in base)) base.dataAberturaInscricoes = "";
    if (!("horaAberturaInscricoes" in base)) base.horaAberturaInscricoes = "";
    if (!("dataEncerramentoInscricoes" in base)) base.dataEncerramentoInscricoes = "";
    if (!("horaEncerramentoInscricoes" in base)) base.horaEncerramentoInscricoes = "";
    if (!("descricao" in base)) base.descricao = "";
    if (!("orgsAutorizadas" in base)) base.orgsAutorizadas = [];
    if (!("programaHorario" in base)) {
      const prog = {};
      const oldH = base.horariosProvas || {};
      const oldF = base.fasesProvas || {};
      const allKeys = new Set([...Object.keys(oldH), ...Object.keys(oldF)]);
      allKeys.forEach(id => {
        prog[id] = [{ fase: oldF[id] || "", horario: oldH[id] || "" }];
      });
      base.programaHorario = prog;
    }
    if (!("programaPausa" in base)) base.programaPausa = { horario: "", retorno: "", descricao: "" };
    if (!("modoHorario" in base)) base.modoHorario = "detalhado";
    if (!("programaOrdem" in base)) base.programaOrdem = [];
    if (!("limitesProvasCat"    in base)) base.limitesProvasCat    = {};
    if (!("usarLimiteCat"       in base)) base.usarLimiteCat       = false;
    if (!("regrasPreco"         in base)) base.regrasPreco         = [];
    if (!("equipeIdsFederados"  in base)) base.equipeIdsFederados  = [];
    if (!("valorInscricao"      in base)) base.valorInscricao      = "";
    if (!("formaPagamento"      in base)) base.formaPagamento      = "";
    if (!("orientacaoPagamento" in base)) base.orientacaoPagamento = "";
    return base;
  });
  const [erros, setErros] = useState({});
  // Steps: 1=Dados | 2=Configurações | 3=Provas | 4=Horários (editing only)
  const [step, setStep] = useState(1);
  // Acordeões do step 2
  const [acordeoes, setAcordeoes] = useState({ limites: false, precos: false, logos: false });
  const toggleAcordeo = (key) => setAcordeoes(a => ({ ...a, [key]: !a[key] }));

  // Número total de steps
  const totalSteps = editando ? 4 : 3;

  // Callback para navegação direta ao step de Horários (step 4 ao editar)
  // Antes: window.__gerenTrackGoStep3 — agora via prop cadEventoGoStep/setCadEventoGoStep
  useEffect(() => {
    if (cadEventoGoStep === "step3" && editando) {
      setStep(4);
      setCadEventoGoStep(null);
    }
  }, [cadEventoGoStep, editando]);

  const todasProvas = todasAsProvas();
  const grupos = [...new Set(todasProvas.map((p) => p.grupo))];

  const toggleProva = (id) => {
    setForm((f) => ({
      ...f,
      provasPrograma: f.provasPrograma.includes(id)
        ? f.provasPrograma.filter((x) => x !== id)
        : [...f.provasPrograma, id],
    }));
  };

  const toggleGrupo = (grupo, provasGrupoFiltradas) => {
    const provasGrupo = provasGrupoFiltradas || todasProvas.filter((p) => p.grupo === grupo);
    const todasSel = provasGrupo.every((p) => form.provasPrograma.includes(p.id));
    setForm((f) => ({
      ...f,
      provasPrograma: todasSel
        ? f.provasPrograma.filter((id) => !provasGrupo.map((p) => p.id).includes(id))
        : [...new Set([...f.provasPrograma, ...provasGrupo.map((p) => p.id)])],
    }));
  };

  const validarStep1 = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = "Nome obrigatório";
    if (!form.data) e.data = "Data obrigatória";
    if (!form.local.trim()) e.local = "Local obrigatório";
    if (!(form.cidade || "").trim()) e.cidade = "Cidade obrigatória";
    if (!(form.uf || "").trim()) e.uf = "UF obrigatória";
    if ((tipoEvt === "admin" || tipoEvt === "funcionario") && !form.organizadorId) e.organizadorId = "Selecione um organizador";
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSalvar = async () => {
    const dadosParaSalvar = { ...form };
    if (!dadosParaSalvar.dataAberturaInscricoes) delete dadosParaSalvar.dataAberturaInscricoes;
    if (!dadosParaSalvar.horaAberturaInscricoes) delete dadosParaSalvar.horaAberturaInscricoes;
    if (!dadosParaSalvar.dataEncerramentoInscricoes) delete dadosParaSalvar.dataEncerramentoInscricoes;
    if (!dadosParaSalvar.horaEncerramentoInscricoes) delete dadosParaSalvar.horaEncerramentoInscricoes;
    if (editando) {
      editarEvento(dadosParaSalvar);
      selecionarEvento(dadosParaSalvar.id);
    } else {
      const novo = adicionarEvento(dadosParaSalvar, usuarioLogado);
      selecionarEvento(novo.id);
    }
  };

  // ── Resumos para acordeões ──────────────────────────────────────────────────
  const resumoLimites = (() => {
    const ind = form.limiteProvasIndividual || 0;
    const rev = form.limiteProvasRevezamento || 0;
    if (!ind && !rev) return "Sem limite definido";
    const partes = [];
    if (ind) partes.push(`Máx. ${ind} individual`);
    if (rev) partes.push(`${rev} revezamento`);
    return partes.join(" · ");
  })();

  const resumoPrecos = (() => {
    const n = (form.regrasPreco || []).filter(r => r.catId).length;
    const tem = form.valorInscricao || form.formaPagamento;
    if (!n && !tem) return "Não configurado";
    const partes = [];
    if (n) partes.push(`${n} regra(s) por categoria`);
    if (form.valorInscricao) partes.push(`R$ ${Number(form.valorInscricao).toFixed(2)} global`);
    if (form.formaPagamento) partes.push(form.formaPagamento);
    return partes.join(" · ");
  })();

  const resumoLogos = (() => {
    const n = [form.logoCompeticao, form.logoCabecalho, form.logoCabecalhoDireito, form.logoRodape].filter(Boolean).length;
    return n === 0 ? "Nenhuma imagem carregada" : `${n} imagem(ns) carregada(s) ✓`;
  })();

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>{editando ? "✏️ Editar Competição" : "🏟 Nova Competição"}</h1>
          <p style={{ color: "#666", fontSize: 14 }}>
            {step === 1 ? `Passo 1 de ${totalSteps} — Dados da competição`
              : step === 2 ? `Passo 2 de ${totalSteps} — Configurações`
              : step === 3 ? `Passo 3 de ${totalSteps} — Programa de provas`
              : `Passo 4 de ${totalSteps} — Programa horário`}
          </p>
        </div>
        <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
      </div>

      {/* ── Barra de steps ── */}
      <div style={s.stepBar}>
        <div style={s.stepItem(step >= 1)}>① Dados</div>
        <div style={s.stepDivider} />
        <div style={s.stepItem(step >= 2)}>② Config</div>
        <div style={s.stepDivider} />
        <div style={s.stepItem(step >= 3)}>③ Provas</div>
        {editando && <>
          <div style={s.stepDivider} />
          <div style={s.stepItem(step >= 4)}>④ Horários</div>
        </>}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          STEP 1 — DADOS ESSENCIAIS
      ══════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <>
          <div style={s.formCard}>
            {/* Nome */}
            <div style={{ gridColumn: "1 / -1" }}>
              <FormField label="Nome da Competição *" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} placeholder="Ex: Competição Estadual de Atletismo 2025" error={erros.nome} />
            </div>

            {/* Data + Hora */}
            <div style={s.grid2form}>
              <FormField label="Data *" value={form.data} onChange={(v) => setForm({ ...form, data: v })} type="date" error={erros.data} />
              <div style={{ width:130 }}>
                <label style={s.label}>Hora de Início</label>
                <input type="time" style={s.input} value={form.horaInicio || ""}
                  onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} />
              </div>
            </div>

            {/* Local + Cidade + UF */}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <div style={{ flex:2, minWidth:200 }}>
                <FormField label="Local / Instalação *" value={form.local} onChange={(v) => setForm({ ...form, local: v })} placeholder="Ex: Estádio Olímpico Municipal" error={erros.local} />
              </div>
              <div style={{ flex:1, minWidth:150 }}>
                <FormField label="Cidade *" value={form.cidade || ""} onChange={(v) => setForm({ ...form, cidade: v })} placeholder="Ex: Belo Horizonte" error={erros.cidade} />
              </div>
              <div style={{ width:100 }}>
                <label style={s.label}>UF *</label>
                <select style={{ ...s.select, ...(erros.uf ? { border:"1px solid #e57373" } : {}) }}
                  value={form.uf || ""} onChange={(e) => setForm({ ...form, uf: e.target.value })}>
                  <option value="">—</option>
                  {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
                {erros.uf && <span style={{ color:"#e57373", fontSize:11 }}>{erros.uf}</span>}
              </div>
            </div>

            {/* Organizador vinculado */}
            {(tipoEvt === "admin" || tipoEvt === "funcionario") && (
              <div style={{ marginTop: 8 }}>
                <label style={s.label}>Organizador Responsável *</label>
                <select style={s.select} value={form.organizadorId || ""}
                  onChange={(e) => setForm({ ...form, organizadorId: e.target.value })}>
                  <option value="">— Selecione o organizador —</option>
                  {(organizadores || []).map(function(org) {
                    return <option key={org.id} value={org.id}>{org.nome}{org.entidade ? " — " + org.entidade : ""}</option>;
                  })}
                </select>
                {erros.organizadorId && <span style={{ color: "#ff6b6b", fontSize: 12 }}>{erros.organizadorId}</span>}
                <p style={{ color: "#666", fontSize: 12, marginTop: 6 }}>
                  💡 Selecione a qual organizador esta competição será vinculada.
                </p>
              </div>
            )}
          </div>

          {/* ── Participação Cruzada (admin only) ── */}
          {tipoEvt === "admin" && (organizadores || []).filter(o => o.id !== form.organizadorId && o.status === "aprovado").length > 0 && (
            <div style={{ background:"#0a0f1a", border:"1px solid #1a3a5a", borderRadius:10, padding:"16px 20px", marginBottom:16 }}>
              <div style={{ color:"#5599ff", fontWeight:700, fontSize:14, marginBottom:8 }}>🤝 Participação Cruzada entre Organizadores</div>
              <p style={{ color:"#666", fontSize:12, marginBottom:12, lineHeight:1.6 }}>
                Selecione os organizadores cujos atletas poderão se inscrever nesta competição.<br/>
                Os atletas participarão com seu perfil e vínculo de origem — nenhum novo vínculo será criado.
              </p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {(organizadores || [])
                  .filter(o => o.id !== form.organizadorId && o.status === "aprovado")
                  .map(o => {
                    const sel = (form.orgsAutorizadas || []).includes(o.id);
                    return (
                      <button key={o.id} type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          orgsAutorizadas: sel
                            ? (f.orgsAutorizadas || []).filter(id => id !== o.id)
                            : [...(f.orgsAutorizadas || []), o.id]
                        }))}
                        style={{
                          background: sel ? "#0a2a4a" : "#0d1117",
                          border: `1px solid ${sel ? "#3a7abf" : "#252837"}`,
                          color: sel ? "#88bbff" : "#666",
                          borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                          fontSize: 13, fontFamily: "'Barlow', sans-serif",
                          display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
                        }}>
                        {sel ? "✅" : "⬜"} {o.entidade || o.nome}
                      </button>
                    );
                  })}
              </div>
              {(form.orgsAutorizadas || []).length > 0 && (
                <div style={{ marginTop:10, fontSize:12, color:"#5599ff" }}>
                  🤝 {(form.orgsAutorizadas || []).length} organizador(es) autorizado(s) para participação cruzada.
                </div>
              )}
            </div>
          )}

          {/* ── Período de Inscrições ── */}
          <div style={{ background:"#0a0a1a", border:"1px solid #1a2a3a", borderRadius:10, padding:"16px 20px", marginBottom:16 }}>
            <div style={{ color:"#1976D2", fontWeight:700, fontSize:14, marginBottom:12 }}>📅 Período de Inscrições</div>
            <div style={s.grid2form}>
              <div>
                <FormField label="Abertura das Inscrições" value={form.dataAberturaInscricoes || ""} onChange={(v) => setForm({ ...form, dataAberturaInscricoes: v })} type="date" />
                <FormField label="Hora de Abertura" value={form.horaAberturaInscricoes || ""} onChange={(v) => setForm({ ...form, horaAberturaInscricoes: v })} type="time" placeholder="HH:MM (opcional)" />
              </div>
              <div>
                <FormField label="Encerramento das Inscrições" value={form.dataEncerramentoInscricoes || ""} onChange={(v) => setForm({ ...form, dataEncerramentoInscricoes: v })} type="date" />
                <FormField label="Hora de Encerramento" value={form.horaEncerramentoInscricoes || ""} onChange={(v) => setForm({ ...form, horaEncerramentoInscricoes: v })} type="time" placeholder="HH:MM (opcional)" />
              </div>
            </div>
            <p style={{ color:"#666", fontSize:12, marginTop:8, lineHeight:1.5 }}>
              💡 Opcional. Se definidas, as inscrições abrirão e encerrarão automaticamente nas datas e horários escolhidos.
              O organizador ainda pode abrir/encerrar manualmente a qualquer momento.
            </p>
          </div>

          {/* ── Descrição ── */}
          <div style={{ background:"#0a0a1a", border:"1px solid #1a2a3a", borderRadius:10, padding:"16px 20px", marginBottom:16 }}>
            <div style={{ color:"#1976D2", fontWeight:700, fontSize:14, marginBottom:12 }}>📝 Informações da Competição</div>
            <RichTextEditor
              value={form.descricao || ""}
              onChange={(v) => setForm({ ...form, descricao: v })}
              placeholder="Regulamento, informações gerais, observações..."
            />
            <p style={{ color:"#666", fontSize:12, marginTop:8, lineHeight:1.5 }}>
              💡 Opcional. Este texto será exibido na página da competição para todos os usuários.
            </p>
          </div>

          <button style={{ ...s.btnPrimary, marginTop: 8 }} onClick={() => { if (validarStep1()) setStep(2); }}>
            Próximo: Configurações →
          </button>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP 2 — CONFIGURAÇÕES
      ══════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <>
          {/* ── Regras de Participação (3 checkboxes agrupados) ── */}
          <div style={{ background:"#0E1016", border:"1px solid #1E2130", borderRadius:12, padding:"20px 24px", marginBottom:16 }}>
            <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:18, fontWeight:700, color:"#1976D2", marginBottom:4 }}>
              📋 Regras de Participação
            </div>
            <p style={{ fontSize:12, color:"#666", marginBottom:18 }}>
              Defina as permissões especiais de inscrição para esta competição.
            </p>

            {/* Checkbox 1 — Exceção de norma CBAt */}
            <div style={{ borderBottom:"1px solid #1a1d2a", paddingBottom:14, marginBottom:14 }}>
              <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
                <input type="checkbox" checked={form.permissividadeNorma}
                  onChange={(e) => setForm({ ...form, permissividadeNorma: e.target.checked })}
                  style={{ width:18, height:18, accentColor:"#1976D2", cursor:"pointer", flexShrink:0, marginTop:2 }} />
                <div>
                  <div style={{ fontWeight:700, color:"#ddd", fontSize:14 }}>Exceção de norma CBAt</div>
                  <div style={{ color:"#666", fontSize:12, marginTop:3, lineHeight:1.5 }}>
                    Atletas nestas idades poderão se inscrever na categoria superior:&nbsp;
                    <strong style={{ color:"#1976D2" }}>13 anos</strong> → Sub-16 &nbsp;·&nbsp;
                    <strong style={{ color:"#1976D2" }}>15 anos</strong> → Sub-18
                    <span style={{ display:"block", marginTop:4, fontStyle:"italic", color:"#555" }}>
                      ⚠️ A categoria oficial do atleta não é alterada. A inscrição será marcada como participação excepcional.
                    </span>
                  </div>
                </div>
              </label>
            </div>

            {/* Checkbox 2 — Atletas 16+ em categorias superiores */}
            <div style={{ borderBottom:"1px solid #1a1d2a", paddingBottom:14, marginBottom:14 }}>
              <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
                <input type="checkbox" checked={form.permiteSub16CategoriasSup || false}
                  onChange={(e) => setForm({ ...form, permiteSub16CategoriasSup: e.target.checked })}
                  style={{ width:18, height:18, accentColor:"#7cfc7c", cursor:"pointer", flexShrink:0, marginTop:2 }} />
                <div>
                  <div style={{ fontWeight:700, color:"#ddd", fontSize:14 }}>Atletas 16+ em categorias superiores</div>
                  <div style={{ color:"#666", fontSize:12, marginTop:3, lineHeight:1.5 }}>
                    Permite que atletas com 16 anos ou mais se inscrevam em categorias superiores à sua categoria de origem.
                    {form.permiteSub16CategoriasSup && (
                      <span style={{ display:"block", marginTop:4, color:"#aaa" }}>
                        <strong style={{ color:"#7cfc7c" }}>16-17 anos</strong> → Sub-20, Sub-23 ou Adulto &nbsp;·&nbsp;
                        <strong style={{ color:"#7cfc7c" }}>18-19 anos</strong> → Sub-23 ou Adulto &nbsp;·&nbsp;
                        <strong style={{ color:"#7cfc7c" }}>20-22 anos</strong> → Adulto
                      </span>
                    )}
                    <span style={{ display:"block", marginTop:4, fontStyle:"italic", color:"#555" }}>
                      ⚠️ A categoria oficial registrada no sistema permanece como a categoria de origem do atleta.
                    </span>
                  </div>
                </div>
              </label>
            </div>

            {/* Checkbox 3 — Inscrição antecipada de revezamentos */}
            <div>
              <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
                <input type="checkbox" checked={form.revezamentoInscAntecipada ?? true}
                  onChange={(e) => setForm({ ...form, revezamentoInscAntecipada: e.target.checked })}
                  style={{ width:18, height:18, accentColor:"#5dade2", cursor:"pointer", flexShrink:0, marginTop:2 }} />
                <div>
                  <div style={{ fontWeight:700, color:"#ddd", fontSize:14 }}>Inscrição antecipada de revezamentos</div>
                  <div style={{ color:"#666", fontSize:12, marginTop:3, lineHeight:1.5 }}>
                    Quando ativado, <strong>equipes e treinadores</strong> podem inscrever equipes de revezamento junto com as inscrições individuais (antes da competição).
                    <span style={{ display:"block", marginTop:4, fontStyle:"italic", color:"#555" }}>
                      ⚠️ Se desativado, revezamentos só poderão ser inscritos por <strong>organizadores, funcionários ou admins</strong> — normalmente no dia do evento.
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* ── Limite de Provas por Atleta (acordeão) ── */}
          <Acordeao keyName="limites" aberto={acordeoes["limites"]} onToggle={toggleAcordeo} titulo="Limite de Provas por Atleta" icone="🎯" resumo={resumoLimites}>
            <p style={{ color:"#666", fontSize:12, marginBottom:14, lineHeight:1.5 }}>
              Opcional. Define o máximo de provas em que cada atleta pode se inscrever. Deixe <strong>0</strong> para ilimitado.
            </p>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:180 }}>
                <label style={s.label}>Máx. provas individuais por atleta</label>
                <input type="number" min="0" max="30" style={{ ...s.input, width:"100%" }}
                  value={form.limiteProvasIndividual || 0}
                  onChange={(e) => setForm({ ...form, limiteProvasIndividual: parseInt(e.target.value) || 0 })} />
                <p style={{ fontSize:11, color:"#555", marginTop:4 }}>0 = sem limite</p>
              </div>
              <div style={{ flex:1, minWidth:180 }}>
                <label style={s.label}>Máx. revezamentos por atleta</label>
                <input type="number" min="0" max="10" style={{ ...s.input, width:"100%" }}
                  value={form.limiteProvasRevezamento || 0}
                  onChange={(e) => setForm({ ...form, limiteProvasRevezamento: parseInt(e.target.value) || 0 })} />
                <p style={{ fontSize:11, color:"#555", marginTop:4 }}>0 = sem limite</p>
              </div>
            </div>
            {(form.limiteProvasIndividual > 0 || form.limiteProvasRevezamento > 0) && (
              <div style={{ marginTop:14, padding:"10px 14px", background:"#0d0e16", borderRadius:8, border:"1px solid #1a1d2a" }}>
                <div style={{ fontWeight:700, fontSize:12, color:"#88aaff", marginBottom:8 }}>🔓 Exceções — Provas que NÃO contam no limite</div>
                <p style={{ fontSize:11, color:"#666", marginBottom:10, lineHeight:1.5 }}>
                  Marque as provas que não devem contar no limite (ex: provas combinadas, provas extras).
                  Atletas poderão se inscrever nessas provas mesmo tendo atingido o limite.
                </p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {(form.provasPrograma || []).map(pId => {
                    const prova = todasProvas.find(p => p.id === pId);
                    if (!prova) return null;
                    const isExcecao = (form.provasExcetoLimite || []).includes(pId);
                    return (
                      <button key={pId}
                        style={{
                          padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer",
                          background: isExcecao ? "#1a2a1a" : "#111318",
                          color: isExcecao ? "#7acc44" : "#666",
                          border: `1px solid ${isExcecao ? "#2a5a2a" : "#222"}`,
                        }}
                        onClick={() => {
                          setForm(f => ({
                            ...f,
                            provasExcetoLimite: isExcecao
                              ? (f.provasExcetoLimite || []).filter(x => x !== pId)
                              : [...(f.provasExcetoLimite || []), pId]
                          }));
                        }}>
                        {isExcecao ? "✓ " : ""}{prova.nome}
                      </button>
                    );
                  })}
                </div>
                {(form.provasExcetoLimite || []).length > 0 && (
                  <p style={{ fontSize:11, color:"#7acc44", marginTop:8 }}>
                    ✓ {(form.provasExcetoLimite || []).length} prova(s) excluída(s) do limite
                  </p>
                )}
              </div>
            )}
            {form.limiteProvasIndividual > 0 && (
              <div style={{ marginTop:14, padding:"12px 14px", background:"#0d0e16", borderRadius:8, border:"1px solid #1a1d2a" }}>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", marginBottom:8 }}>
                  <input type="checkbox"
                    checked={form.usarLimiteCat || false}
                    onChange={e => setForm(f => ({ ...f, usarLimiteCat: e.target.checked }))}
                    style={{ width:15, height:15, accentColor:"#88aaff" }} />
                  <span style={{ fontSize:12, color:"#88aaff", fontWeight:700 }}>
                    Configurar limites diferentes por categoria
                  </span>
                </label>
                {form.usarLimiteCat && (
                  <>
                    <p style={{ fontSize:11, color:"#666", marginBottom:10, lineHeight:1.5 }}>
                      Deixe em branco para usar o limite global (<strong style={{ color:"#ccc" }}>{form.limiteProvasIndividual}</strong>) nessa categoria.
                    </p>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))", gap:8 }}>
                      {CATEGORIAS.map(cat => (
                        <div key={cat.id}>
                          <label style={{ fontSize:11, color:"#888", display:"block", marginBottom:3 }}>{cat.nome}</label>
                          <input type="number" min="0" max="30"
                            style={{ ...s.input, width:"100%", padding:"6px 10px", marginBottom:0 }}
                            value={(form.limitesProvasCat || {})[cat.id] ?? ""}
                            placeholder={String(form.limiteProvasIndividual)}
                            onChange={e => {
                              const val = e.target.value === "" ? undefined : parseInt(e.target.value) || 0;
                              setForm(f => {
                                const cur = { ...(f.limitesProvasCat || {}) };
                                if (val === undefined) delete cur[cat.id];
                                else cur[cat.id] = val;
                                return { ...f, limitesProvasCat: cur };
                              });
                            }} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </Acordeao>

          {/* ── Preços e Pagamento (acordeão) ── */}
          <Acordeao keyName="precos" aberto={acordeoes["precos"]} onToggle={toggleAcordeo} titulo="Preços e Pagamento" icone="💰" resumo={resumoPrecos}>
            <p style={{ color:"#666", fontSize:12, marginBottom:14, lineHeight:1.5 }}>
              Opcional. Defina preços diferentes por categoria. Atletas das <strong style={{ color:"#ccc" }}>equipes federadas selecionadas</strong> com Nº CBAt pagarão o <em>Preço de atleta federado</em>. Os demais pagarão o <em>Preço de atleta não federado</em>.
            </p>

            {/* Equipes federadas */}
            <div style={{ background:"#0d0e16", border:"1px solid #1e2a3a", borderRadius:8, padding:"12px 16px", marginBottom:14 }}>
              <div style={{ fontSize:11, color:"#88aaff", fontWeight:700, marginBottom:8 }}>
                🏢 Equipes federadas — {(form.equipeIdsFederados || []).length} selecionada(s)
              </div>
              {equipes.length === 0 ? (
                <div style={{ fontSize:11, color:"#555", fontStyle:"italic" }}>Nenhuma equipe cadastrada no sistema ainda.</div>
              ) : (
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {equipes.map(eq => {
                    const sel = (form.equipeIdsFederados || []).includes(eq.id);
                    return (
                      <button key={eq.id}
                        style={{ padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer",
                          background: sel ? "#1a2a1a" : "#111318",
                          color:      sel ? "#7acc44" : "#666",
                          border:     `1px solid ${sel ? "#2a5a2a" : "#222"}`,
                        }}
                        onClick={() => {
                          const cur  = form.equipeIdsFederados || [];
                          const novo = sel ? cur.filter(id => id !== eq.id) : [...cur, eq.id];
                          setForm(f => ({ ...f, equipeIdsFederados: novo }));
                        }}>
                        {sel ? "✓ " : ""}{eq.sigla || eq.nome}
                      </button>
                    );
                  })}
                </div>
              )}
              <p style={{ fontSize:10, color:"#555", marginTop:6, lineHeight:1.5 }}>
                💡 Atletas dessas equipes <strong>com Nº CBAt</strong> cadastrado pagarão o preço "atleta federado".
              </p>
            </div>

            {/* Regras de preço */}
            {(form.regrasPreco || []).map((regra, idx) => (
              <div key={idx} style={{ background:"#0d0e16", border:"1px solid #1e2a3a", borderRadius:8, padding:"14px 16px", marginBottom:10 }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap" }}>
                  <div style={{ minWidth:140 }}>
                    <label style={s.label}>Categoria</label>
                    <select style={{ ...s.select, marginBottom:0 }}
                      value={regra.catId}
                      onChange={e => setForm(f => ({
                        ...f,
                        regrasPreco: f.regrasPreco.map((r, i) => i === idx ? { ...r, catId: e.target.value } : r)
                      }))}>
                      <option value="">— Selecione —</option>
                      {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={s.label}>Atleta federado (R$)</label>
                    <input type="number" min="0" step="0.01"
                      style={{ ...s.input, marginBottom:0 }}
                      placeholder="Ex: 45.00"
                      value={regra.precoComEquipe ?? ""}
                      onChange={e => setForm(f => ({
                        ...f,
                        regrasPreco: f.regrasPreco.map((r, i) =>
                          i === idx ? { ...r, precoComEquipe: e.target.value === "" ? null : parseFloat(e.target.value) } : r
                        )
                      }))} />
                  </div>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={s.label}>Atleta não federado (R$)</label>
                    <input type="number" min="0" step="0.01"
                      style={{ ...s.input, marginBottom:0 }}
                      placeholder="Ex: 65.00"
                      value={regra.precoSemEquipe ?? ""}
                      onChange={e => setForm(f => ({
                        ...f,
                        regrasPreco: f.regrasPreco.map((r, i) =>
                          i === idx ? { ...r, precoSemEquipe: e.target.value === "" ? null : parseFloat(e.target.value) } : r
                        )
                      }))} />
                  </div>
                  <button
                    onClick={() => setForm(f => ({ ...f, regrasPreco: f.regrasPreco.filter((_, i) => i !== idx) }))}
                    style={{ background:"#1a0a0a", border:"1px solid #4a1a1a", color:"#ff6b6b", borderRadius:6, padding:"8px 14px", cursor:"pointer", fontSize:13, whiteSpace:"nowrap", flexShrink:0 }}>
                    ✕ Remover
                  </button>
                </div>
              </div>
            ))}
            <button
              style={{ ...s.btnGhost, fontSize:12, marginTop:4 }}
              onClick={() => setForm(f => ({
                ...f,
                regrasPreco: [...(f.regrasPreco || []), { catId: "", precoComEquipe: null, precoSemEquipe: null }]
              }))}>
              + Adicionar regra de preço
            </button>
            {(form.regrasPreco || []).length === 0 && (
              <p style={{ fontSize:11, color:"#555", marginTop:8, lineHeight:1.5 }}>
                Sem regras por categoria — se houver um <em>Valor de Inscrição</em> global definido, ele será exibido ao atleta.
              </p>
            )}
            {(form.regrasPreco || []).some(r => r.catId) && (
              <div style={{ marginTop:14, padding:"10px 14px", background:"#0a1a0a", border:"1px solid #1a3a1a", borderRadius:8 }}>
                <div style={{ fontSize:11, color:"#7acc44", fontWeight:700, marginBottom:6 }}>✓ Resumo das regras configuradas:</div>
                {(form.regrasPreco || []).filter(r => r.catId).map((r, i) => {
                  const catNome = CATEGORIAS.find(c => c.id === r.catId)?.nome || r.catId;
                  const nEq = (r.equipeIds || []).length;
                  return (
                    <div key={i} style={{ fontSize:11, color:"#aaa", padding:"3px 0", borderBottom:"1px solid #1a2a1a" }}>
                      <strong style={{ color:"#fff" }}>{catNome}</strong>
                      {" · "}
                      <span style={{ color:"#7acc44" }}>c/ equipe ({nEq} eq.): {r.precoComEquipe != null ? `R$ ${Number(r.precoComEquipe).toFixed(2)}` : "—"}</span>
                      {" · "}
                      <span style={{ color:"#88aaff" }}>s/ equipe: {r.precoSemEquipe != null ? `R$ ${Number(r.precoSemEquipe).toFixed(2)}` : "—"}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Forma de pagamento */}
            <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid #1a1d2a" }}>
              <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:16, fontWeight:700, color:"#1976D2", marginBottom:12 }}>
                💳 Forma de Pagamento
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                <div>
                  <label style={s.label}>Valor Global por Atleta (R$)</label>
                  <input type="number" min="0" step="0.01" style={s.input}
                    placeholder="Ex: 50.00 — deixe em branco se usar regras por categoria"
                    value={form.valorInscricao ?? ""}
                    onChange={e => setForm(f => ({ ...f, valorInscricao: e.target.value === "" ? "" : parseFloat(e.target.value) }))}
                  />
                  <div style={{ fontSize:11, color:"#555", marginTop:2 }}>
                    Usado como fallback quando não há regra de preço para a categoria do atleta.
                  </div>
                </div>
                <div>
                  <label style={s.label}>Forma de Pagamento</label>
                  <select style={s.select} value={form.formaPagamento || ""} onChange={e => setForm(f => ({ ...f, formaPagamento: e.target.value }))}>
                    <option value="">— Não informar —</option>
                    <option value="Pix">Pix</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                    <option value="Pix / Dinheiro">Pix / Dinheiro</option>
                    <option value="Pix / Cartão">Pix / Cartão</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={s.label}>Orientações de Pagamento</label>
                <textarea
                  style={{ ...s.input, minHeight:90, resize:"vertical" }}
                  placeholder={"Ex: Pix: 11999999999 (João Silva)\nEnvie o comprovante para atletismo@email.com\nPrazo: até 3 dias antes da competição"}
                  value={form.orientacaoPagamento || ""}
                  onChange={e => setForm(f => ({ ...f, orientacaoPagamento: e.target.value }))}
                />
                <div style={{ fontSize:11, color:"#555", marginTop:2 }}>
                  Chave Pix, conta bancária, prazo, contato para envio de comprovante, etc.
                </div>
              </div>
              {(form.valorInscricao || form.formaPagamento || form.orientacaoPagamento) && (
                <div style={{ marginTop:14, background:"#0a1220", border:"1px solid #1976D244", borderRadius:8, padding:"12px 16px" }}>
                  <div style={{ fontSize:11, color:"#1976D2", fontWeight:700, marginBottom:8 }}>👁 Preview — como o atleta verá após a inscrição:</div>
                  {form.valorInscricao !== "" && form.valorInscricao != null && (
                    <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #1E2130" }}>
                      <span style={{ color:"#888", fontSize:12 }}>Valor por atleta</span>
                      <strong style={{ color:"#7acc44", fontSize:15, fontFamily:"'Barlow Condensed', sans-serif" }}>
                        R$ {Number(form.valorInscricao).toFixed(2)}
                      </strong>
                    </div>
                  )}
                  {form.formaPagamento && (
                    <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #1E2130" }}>
                      <span style={{ color:"#888", fontSize:12 }}>Forma de pagamento</span>
                      <span style={{ color:"#fff", fontSize:12 }}>{form.formaPagamento}</span>
                    </div>
                  )}
                  {form.orientacaoPagamento && (
                    <div style={{ marginTop:8, fontSize:12, color:"#aaa", whiteSpace:"pre-wrap", lineHeight:1.6 }}>
                      {form.orientacaoPagamento}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Acordeao>

          {/* ── Logos da Competição (acordeão) ── */}
          <Acordeao keyName="logos" aberto={acordeoes["logos"]} onToggle={toggleAcordeo} titulo="Logos da Competição" icone="🖼️" resumo={resumoLogos}>
            <p style={{ color:"#666", fontSize:12, marginBottom:14, lineHeight:1.5 }}>
              Opcional. As imagens são armazenadas na nuvem e ficam visíveis para todos. Use PNG ou JPG com fundo transparente quando possível. Máximo 2MB por imagem.
            </p>

            {/* Logo da Competição */}
            <div style={{ marginBottom:14, padding:"12px 14px", background:"#0d0e16", borderRadius:8, border:"1px solid #1a1d2a" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"#fff", marginBottom:4 }}>🏟️ Logo da Competição</div>
                  <p style={{ fontSize:11, color:"#888", margin:0, lineHeight:1.5 }}>
                    Aparece na lista de competições e na tela de detalhe.<br/>
                    <strong style={{ color:"#1976D2" }}>Tamanho recomendado: 500×500px</strong> (quadrada). PNG/JPG.
                  </p>
                  <div style={{ marginTop:8, display:"flex", gap:8, alignItems:"center" }}>
                    <label style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", background:"#1a2a3a", border:"1px solid #2a4a6a", borderRadius:6, cursor:"pointer", fontSize:12, color:"#88aaff", fontWeight:600 }}>
                      📁 Escolher imagem
                      <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) { alert("Imagem muito grande (máx. 2MB)."); return; }
                          try {
                            const id = eventoAtualId || form._uploadId || (form._uploadId = Date.now().toString());
                            const url = await uploadLogo(file, id, "logoCompeticao");
                            setForm({ ...form, logoCompeticao: url });
                          } catch { alert("Erro ao enviar imagem. Tente novamente."); }
                        }}
                      />
                    </label>
                    {form.logoCompeticao && (
                      <button style={{ fontSize:11, color:"#ff6b6b", background:"transparent", border:"1px solid #4a1a1a", borderRadius:4, padding:"4px 10px", cursor:"pointer" }}
                        onClick={() => setForm({ ...form, logoCompeticao: "" })}>✕ Remover</button>
                    )}
                  </div>
                </div>
                {form.logoCompeticao && (
                  <div style={{ width:80, height:80, borderRadius:8, border:"2px solid #2a3050", overflow:"hidden", background:"#fff", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <img src={form.logoCompeticao} alt="Logo" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
                  </div>
                )}
              </div>
            </div>

            {/* Logo Cabeçalho Súmula */}
            <div style={{ marginBottom:14, padding:"12px 14px", background:"#0d0e16", borderRadius:8, border:"1px solid #1a1d2a" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"#fff", marginBottom:4 }}>📄 Logo Cabeçalho da Súmula</div>
                  <p style={{ fontSize:11, color:"#888", margin:0, lineHeight:1.5 }}>
                    Aparece no <strong>canto esquerdo</strong> do cabeçalho da súmula impressa.<br/>
                    <strong style={{ color:"#1976D2" }}>Tamanho recomendado: 300×120px</strong> (retangular horizontal). PNG com fundo transparente.
                  </p>
                  <div style={{ marginTop:8, display:"flex", gap:8, alignItems:"center" }}>
                    <label style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", background:"#1a2a3a", border:"1px solid #2a4a6a", borderRadius:6, cursor:"pointer", fontSize:12, color:"#88aaff", fontWeight:600 }}>
                      📁 Escolher imagem
                      <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) { alert("Imagem muito grande (máx. 2MB)."); return; }
                          try {
                            const id = eventoAtualId || form._uploadId || (form._uploadId = Date.now().toString());
                            const url = await uploadLogo(file, id, "logoCabecalho");
                            setForm({ ...form, logoCabecalho: url });
                          } catch { alert("Erro ao enviar imagem. Tente novamente."); }
                        }}
                      />
                    </label>
                    {form.logoCabecalho && (
                      <button style={{ fontSize:11, color:"#ff6b6b", background:"transparent", border:"1px solid #4a1a1a", borderRadius:4, padding:"4px 10px", cursor:"pointer" }}
                        onClick={() => setForm({ ...form, logoCabecalho: "" })}>✕ Remover</button>
                    )}
                  </div>
                </div>
                {form.logoCabecalho && (
                  <div style={{ width:120, height:48, borderRadius:6, border:"2px solid #2a3050", overflow:"hidden", background:"#fff", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <img src={form.logoCabecalho} alt="Cabeçalho" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
                  </div>
                )}
              </div>
            </div>

            {/* Logo Cabeçalho Direito */}
            <div style={{ marginBottom:14, padding:"12px 14px", background:"#0d0e16", borderRadius:8, border:"1px solid #1a1d2a" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"#fff", marginBottom:4 }}>📄 Logo Cabeçalho Direito da Súmula</div>
                  <p style={{ fontSize:11, color:"#888", margin:0, lineHeight:1.5 }}>
                    Aparece no <strong>canto direito</strong> do cabeçalho da súmula impressa.<br/>
                    <strong style={{ color:"#1976D2" }}>Tamanho recomendado: 300×120px</strong> (retangular horizontal). PNG com fundo transparente.
                  </p>
                  <div style={{ marginTop:8, display:"flex", gap:8, alignItems:"center" }}>
                    <label style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", background:"#1a2a3a", border:"1px solid #2a4a6a", borderRadius:6, cursor:"pointer", fontSize:12, color:"#88aaff", fontWeight:600 }}>
                      📁 Escolher imagem
                      <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) { alert("Imagem muito grande (máx. 2MB)."); return; }
                          try {
                            const id = eventoAtualId || form._uploadId || (form._uploadId = Date.now().toString());
                            const url = await uploadLogo(file, id, "logoCabecalhoDireito");
                            setForm({ ...form, logoCabecalhoDireito: url });
                          } catch { alert("Erro ao enviar imagem. Tente novamente."); }
                        }}
                      />
                    </label>
                    {form.logoCabecalhoDireito && (
                      <button style={{ fontSize:11, color:"#ff6b6b", background:"transparent", border:"1px solid #4a1a1a", borderRadius:4, padding:"4px 10px", cursor:"pointer" }}
                        onClick={() => setForm({ ...form, logoCabecalhoDireito: "" })}>✕ Remover</button>
                    )}
                  </div>
                </div>
                {form.logoCabecalhoDireito && (
                  <div style={{ width:120, height:50, borderRadius:4, border:"2px solid #2a3050", overflow:"hidden", background:"#fff", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <img src={form.logoCabecalhoDireito} alt="Cabeçalho Dir." style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
                  </div>
                )}
              </div>
            </div>

            {/* Logo Rodapé */}
            <div style={{ padding:"12px 14px", background:"#0d0e16", borderRadius:8, border:"1px solid #1a1d2a" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"#fff", marginBottom:4 }}>📃 Logo / Banner Rodapé da Súmula</div>
                  <p style={{ fontSize:11, color:"#888", margin:0, lineHeight:1.5 }}>
                    Banner de largura total no rodapé da súmula impressa (patrocinadores, federação, etc.).<br/>
                    <strong style={{ color:"#1976D2" }}>Tamanho recomendado: 1200×200px</strong> (retangular largo). PNG/JPG.
                  </p>
                  <div style={{ marginTop:8, display:"flex", gap:8, alignItems:"center" }}>
                    <label style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", background:"#1a2a3a", border:"1px solid #2a4a6a", borderRadius:6, cursor:"pointer", fontSize:12, color:"#88aaff", fontWeight:600 }}>
                      📁 Escolher imagem
                      <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) { alert("Imagem muito grande (máx. 2MB)."); return; }
                          try {
                            const id = eventoAtualId || form._uploadId || (form._uploadId = Date.now().toString());
                            const url = await uploadLogo(file, id, "logoRodape");
                            setForm({ ...form, logoRodape: url });
                          } catch { alert("Erro ao enviar imagem. Tente novamente."); }
                        }}
                      />
                    </label>
                    {form.logoRodape && (
                      <button style={{ fontSize:11, color:"#ff6b6b", background:"transparent", border:"1px solid #4a1a1a", borderRadius:4, padding:"4px 10px", cursor:"pointer" }}
                        onClick={() => setForm({ ...form, logoRodape: "" })}>✕ Remover</button>
                    )}
                  </div>
                </div>
                {form.logoRodape && (
                  <div style={{ width:260, height:50, borderRadius:4, border:"2px solid #2a3050", overflow:"hidden", background:"#fff", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <img src={form.logoRodape} alt="Rodapé" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
                  </div>
                )}
              </div>
            </div>
          </Acordeao>

          {/* ── Navegação Step 2 ── */}
          <div style={{ display:"flex", gap:12, marginTop:8 }}>
            <button style={s.btnGhost} onClick={() => setStep(1)}>← Voltar</button>
            <button style={s.btnPrimary} onClick={() => setStep(3)}>
              Próximo: Programa de Provas →
            </button>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP 3 — PROGRAMA DE PROVAS
      ══════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <FiltroProvasStep
          todasProvas={todasProvas}
          form={form}
          setForm={setForm}
          toggleProva={toggleProva}
          toggleGrupo={toggleGrupo}
          editando={editando}
          handleSalvar={handleSalvar}
          setStep={setStep}
          recordes={recordes}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP 4 — PROGRAMA HORÁRIO (apenas ao editar)
      ══════════════════════════════════════════════════════════════════ */}
      {step === 4 && editando && (
        <ProgramaHorarioStep
          todasProvas={todasProvas}
          form={form}
          setForm={setForm}
          editando={editando}
          handleSalvar={handleSalvar}
          setStep={setStep}
          inscricoes={inscricoes}
          atletas={atletas}
          eventoAtualId={eventoAtualId}
        />
      )}
    </div>
  );
}

// ─── SELETOR DE PROVAS (STEP 2) ──────────────────────────────────────────────
function FiltroProvasStep({ todasProvas, form, setForm, toggleProva, toggleGrupo, editando, handleSalvar, setStep, recordes }) {
  const s = useStylesResponsivos(styles);
  const [filtroSexo, setFiltroSexo] = useState("todos");   // "todos" | "M" | "F"
  const [filtroCats, setFiltroCats] = useState([]);        // [] = todas; senão array de catIds ativos

  const toggleFiltroCat = (catId) =>
    setFiltroCats((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );

  // Provas visíveis conforme filtros ativos
  const provasFiltradas = todasProvas.filter((p) => {
    const sexoOk = filtroSexo === "todos" || (filtroSexo === "M" ? p.id.startsWith("M_") : p.id.startsWith("F_"));
    const catOk = filtroCats.length === 0 || filtroCats.some((cId) => p.id.includes(`_${cId}_`) || p.id.endsWith(`_${cId}`));
    return sexoOk && catOk;
  });

  const grupos = [...new Set(provasFiltradas.map((p) => p.grupo))];

  // Selecionar/limpar só as provas visíveis
  const selecionarVisiveis = () => {
    const ids = provasFiltradas.map((p) => p.id);
    setForm((f) => ({ ...f, provasPrograma: [...new Set([...f.provasPrograma, ...ids])] }));
  };
  const limparVisiveis = () => {
    const ids = new Set(provasFiltradas.map((p) => p.id));
    setForm((f) => ({ ...f, provasPrograma: f.provasPrograma.filter((id) => !ids.has(id)) }));
  };

  const totalSelecionadas = form.provasPrograma.length;
  const visivelSelecionadas = provasFiltradas.filter((p) => form.provasPrograma.includes(p.id)).length;

  return (
    <div>
      {/* ── Barra de filtros ── */}
      <div style={s.filtroProvasBar}>
        {/* Sexo */}
        <div style={s.filtroProvasBloco}>
          <div style={s.filtroProvasLabel}>Sexo</div>
          <div style={s.filtroProvasPills}>
            {[["todos", "Ambos"], ["M", "Masculino"], ["F", "Feminino"]].map(([v, l]) => (
              <button key={v}
                style={{ ...s.filtroPill, ...(filtroSexo === v ? s.filtroPillAtivo : {}) }}
                onClick={() => setFiltroSexo(v)}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Categorias */}
        <div style={s.filtroProvasBloco}>
          <div style={s.filtroProvasLabel}>
            Categoria
            {filtroCats.length > 0 && (
              <button style={s.filtroClearBtn} onClick={() => setFiltroCats([])}>limpar</button>
            )}
          </div>
          <div style={s.filtroProvasPills}>
            {CATEGORIAS.map((c) => (
              <button key={c.id}
                style={{ ...s.filtroPill, ...(filtroCats.includes(c.id) ? s.filtroPillAtivo : {}) }}
                onClick={() => toggleFiltroCat(c.id)}>
                {c.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cabeçalho contagem + ações ── */}
      <div style={s.formCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, color: "#fff", marginBottom: 2 }}>Provas do programa</div>
            <div style={{ color: "#666", fontSize: 13 }}>
              <span style={{ color: "#1976D2", fontWeight: 700 }}>{totalSelecionadas}</span> selecionada(s) no total
              {provasFiltradas.length < todasProvas.length && (
                <span style={{ marginLeft: 10, color: "#555" }}>
                  · mostrando {provasFiltradas.length} ({visivelSelecionadas} marcadas na visão atual)
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={s.btnGhost} onClick={selecionarVisiveis} title="Seleciona as provas visíveis com os filtros atuais">
              ✓ Todas visíveis
            </button>
            <button style={s.btnGhost} onClick={limparVisiveis} title="Desmarca as provas visíveis com os filtros atuais">
              ✗ Limpar visíveis
            </button>
            <button style={{ ...s.btnGhost, color: "#1976D2", borderColor: "#1976D233" }}
              onClick={() => setForm((f) => ({ ...f, provasPrograma: todasProvas.map((p) => p.id) }))}>
              Todas
            </button>
            <button style={s.btnGhost}
              onClick={() => setForm((f) => ({ ...f, provasPrograma: [] }))}>
              Nenhuma
            </button>
          </div>
        </div>

        {provasFiltradas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#444" }}>
            Nenhuma prova encontrada para os filtros selecionados.
          </div>
        ) : (
          grupos.map((grupo) => {
            const provasGrupo = provasFiltradas.filter((p) => p.grupo === grupo);
            const todasSel = provasGrupo.every((p) => form.provasPrograma.includes(p.id));
            const algumaSel = provasGrupo.some((p) => form.provasPrograma.includes(p.id));
            return (
              <div key={grupo} style={s.grupoProvasBox}>
                <div style={s.grupoProvasHeader}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={todasSel}
                      ref={(el) => { if (el) el.indeterminate = algumaSel && !todasSel; }}
                      onChange={() => toggleGrupo(grupo, provasGrupo)}
                      style={{ width: 16, height: 16, accentColor: "#1976D2", cursor: "pointer" }} />
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: "#1976D2", letterSpacing: 1 }}>
                      {grupo}
                    </span>
                  </label>
                  <span style={{ color: "#555", fontSize: 12 }}>
                    {provasGrupo.filter((p) => form.provasPrograma.includes(p.id)).length}/{provasGrupo.length}
                  </span>
                </div>
                <div style={s.provaGrid}>
                  {provasGrupo.map((p) => {
                    const sel = form.provasPrograma.includes(p.id);
                    const catNome = CATEGORIAS.find((c) => p.id.includes(`_${c.id}_`) || p.id.endsWith(`_${c.id}`))?.nome || "";
                    return (
                      <label key={p.id} style={{ ...s.provaCheckBtn, ...(sel ? s.provaCheckBtnSel : {}) }}>
                        <input type="checkbox" checked={sel} onChange={() => toggleProva(p.id)} style={{ display: "none" }} />
                        {sel ? "✓ " : ""}{p.nome}
                        <span style={{ fontSize: 10, color: sel ? "#1976D288" : "#444", display: "block" }}>
                          {p.misto ? "Misto" : p.id.startsWith("M_") ? "Masc" : "Fem"} · {catNome}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Recordes nas Súmulas ── */}
      {recordes && recordes.length > 0 && (
        <div style={{ background:"#0a0a1a", border:"1px solid #1a2a3a", borderRadius:10, padding:"16px 20px", marginTop:16, marginBottom:16 }}>
          <div style={{ color:"#1976D2", fontWeight:700, fontSize:14, marginBottom:4 }}>🏆 Recordes nas Súmulas</div>
          <p style={{ color:"#666", fontSize:12, marginBottom:10, lineHeight:1.5 }}>
            Selecione quais recordes exibir no cabeçalho de cada prova nas súmulas impressas.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {recordes.map(tipo => {
              const selecionados = form.recordesSumulas || [];
              const ativo = selecionados.includes(tipo.id);
              return (
                <label key={tipo.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", background:"#0d0e14", borderRadius:6, border:`1px solid ${ativo ? "#2a6a2a" : "#1a1d2a"}`, cursor:"pointer" }}>
                  <input type="checkbox" checked={ativo}
                    onChange={(e) => {
                      const novos = e.target.checked ? [...selecionados, tipo.id] : selecionados.filter(id => id !== tipo.id);
                      setForm({ ...form, recordesSumulas: novos });
                    }}
                  />
                  <span style={{ color: ativo ? "#7cfc7c" : "#888", fontWeight:600, fontSize:12 }}>{tipo.nome}</span>
                  <span style={{ color:"#555", fontSize:10 }}>({tipo.sigla}) · {tipo.registros?.length || 0} registros</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button style={s.btnGhost} onClick={() => setStep(2)}>← Voltar</button>
        {editando ? (
          <button style={s.btnPrimary} onClick={() => setStep(4)} disabled={form.provasPrograma.length === 0}>
            Próximo: Programa Horário →
          </button>
        ) : (
          <button style={s.btnPrimary} onClick={handleSalvar} disabled={form.provasPrograma.length === 0}>
            ✅ Criar Competição
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PROGRAMA HORÁRIO (STEP 3) ───────────────────────────────────────────────
function ProgramaHorarioStep({ todasProvas, form, setForm, editando, handleSalvar, setStep,
  inscricoes = [], atletas = [], eventoAtualId }) {
  const s = useStylesResponsivos(styles);

  const provasSel = (form.provasPrograma || [])
    .map(id => todasProvas.find(p => p.id === id))
    .filter(Boolean);

  const prog = form.programaHorario || {};

  // ── Modo ──────────────────────────────────────────────────────────────────
  const modoHorario = form.modoHorario || "detalhado";
  const setModoHorario = (modo) => {
    setForm(f => ({ ...f, modoHorario: modo, programaHorario: {}, programaOrdem: [] }));
  };

  // ── Drag state ────────────────────────────────────────────────────────────
  const dragKeyRef = useRef(null);
  const [dragOverKey, setDragOverKey] = useState(null);
  const [confirmLimpar, setConfirmLimpar] = useState(false);

  // ── Cadeia de fases ───────────────────────────────────────────────────────
  const FASE_CHAINS = {
    "": [{ fase: "" }],
    "Final": [{ fase: "Final" }],
    "Final por Tempo": [{ fase: "Final por Tempo" }],
    "Semifinal": [{ fase: "Semifinal" }, { fase: "Final" }],
    "Semifinal por Tempo": [{ fase: "Semifinal por Tempo" }, { fase: "Final por Tempo" }],
    "Eliminatória": [{ fase: "Eliminatória" }, { fase: "Semifinal" }, { fase: "Final" }],
  };
  const FASE_INICIAIS = ["", "Final", "Final por Tempo", "Semifinal", "Semifinal por Tempo", "Eliminatória"];

  // ── Helpers de entrada ────────────────────────────────────────────────────
  const getEntries = (chave) => prog[chave] || [{ fase: "", horario: "" }];
  const getFaseInicial = (chave) => getEntries(chave)[0]?.fase || "";

  const setFaseInicial = (chave, faseInicial) => {
    const chain = (FASE_CHAINS[faseInicial] || [{ fase: "" }]).map(c => ({ ...c }));
    const existing = getEntries(chave);
    const newEntries = chain.map((c, i) => ({ fase: c.fase, horario: existing[i]?.horario || "" }));
    setForm(f => ({ ...f, programaHorario: { ...(f.programaHorario || {}), [chave]: newEntries } }));
  };

  const setEntryHorario = (chave, index, horario) => {
    const entries = getEntries(chave).map(e => ({ ...e }));
    if (entries[index]) entries[index].horario = horario;
    setForm(f => ({ ...f, programaHorario: { ...(f.programaHorario || {}), [chave]: entries } }));
  };

  const toggleVariant = (chave, index) => {
    const entries = getEntries(chave).map(e => ({ ...e }));
    const fase = entries[index]?.fase;
    if (fase === "Semifinal") entries[index].fase = "Semifinal por Tempo";
    else if (fase === "Semifinal por Tempo") entries[index].fase = "Semifinal";
    else if (fase === "Final") entries[index].fase = "Final por Tempo";
    else if (fase === "Final por Tempo") entries[index].fase = "Final";
    setForm(f => ({ ...f, programaHorario: { ...(f.programaHorario || {}), [chave]: entries } }));
  };

  const faseColor = (fase) => {
    if (fase === "Eliminatória") return "#ff8844";
    if (fase?.includes("Semifinal")) return "#88aaff";
    if (fase?.includes("Final")) return "#7acc44";
    return "#888";
  };

  const renderSubEntries = (chave) => {
    const entries = getEntries(chave);
    if (entries.length <= 1) return null;
    return entries.slice(1).map((entry, i) => {
      const idx = i + 1;
      const canToggle = entry.fase.includes("Semifinal") || entry.fase.includes("Final");
      return (
        <div key={`${chave}_${idx}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 10px 5px 52px", background: "#080812", borderRadius: 4, border: "1px dashed #1a1d2a" }}>
          <input type="time" value={entry.horario || ""}
            onChange={(e) => setEntryHorario(chave, idx, e.target.value)}
            style={{ background: "#111", color: "#fff", border: "1px solid #2a3050", borderRadius: 4, padding: "4px 8px", fontSize: 13, width: 100, fontFamily: "monospace" }}
          />
          <span style={{ color: faseColor(entry.fase), fontWeight: 700, fontSize: 12 }}>{entry.fase}</span>
          {canToggle && (
            <button onClick={() => toggleVariant(chave, idx)}
              style={{ background: "transparent", border: "1px solid #2a3050", borderRadius: 4, color: "#888", fontSize: 10, padding: "2px 8px", cursor: "pointer" }}>
              ↔ por Tempo
            </button>
          )}
        </div>
      );
    });
  };

  // ── Helper grupoKey ───────────────────────────────────────────────────────
  const getGrupoKeyLocal = (provaId) => {
    const cat = CATEGORIAS.find(c =>
      provaId.endsWith(`_${c.id}`) || provaId.includes(`_${c.id}_`)
    );
    if (!cat) return provaId;
    return provaId.replace(`_${cat.id}`, "");
  };

  // ── Mapa de inscrições: "provaId_catId_sexo" → contagem ──────────────────
  const inscricoesMap = React.useMemo(() => {
    const eid = eventoAtualId;
    if (!eid || !inscricoes?.length || !atletas?.length) return new Map();
    const anoComp = form.data ? new Date(form.data + "T12:00:00").getFullYear() : new Date().getFullYear();
    const map = new Map();
    inscricoes
      .filter(i => i.eventoId === eid && i.tipo !== "revezamento" && !i.combinadaId)
      .forEach(i => {
        const atl = atletas.find(a => a.id === i.atletaId);
        if (!atl) return;
        const cat = getCategoria(atl.anoNasc, anoComp);
        if (!cat) return;
        const chave = `${i.provaId}_${cat.id}_${i.sexo || atl.sexo}`;
        map.set(chave, (map.get(chave) || 0) + 1);
      });
    return map;
  }, [eventoAtualId, inscricoes, atletas, form.data]);

  const temInscricoes = inscricoes?.length > 0 && !!eventoAtualId;

  // Contagem por provaId completo (ex: "M_100m_sub14")
  const getContagem = (provaId) => {
    const cat = CATEGORIAS.find(c =>
      provaId.endsWith(`_${c.id}`) || provaId.includes(`_${c.id}_`)
    );
    if (!cat) return null;
    const sexo = provaId.startsWith("M_") ? "M" : "F";
    return inscricoesMap.get(`${provaId}_${cat.id}_${sexo}`) || 0;
  };

  // Para o modo agrupado: retorna array { catNome, provaId, n } ordenado por catNome
  // — uma entrada por cada provaId do grupo (cada implemento × categoria)
  // — agrupa implementos com mesmo catId numa única entrada somada
  const getCatsComContagem = (grupoKey) => {
    const map = new Map(); // catNome → { n, provaIds[] }
    (form.provasPrograma || []).forEach(id => {
      if (getGrupoKeyLocal(id) !== grupoKey) return;
      const cat = CATEGORIAS.find(c => id.endsWith(`_${c.id}`) || id.includes(`_${c.id}_`));
      if (!cat) return;
      const n = getContagem(id) || 0;
      if (!map.has(cat.nome)) map.set(cat.nome, { n: 0, catId: cat.id });
      map.get(cat.nome).n += n;
    });
    return [...map.entries()]
      .map(([catNome, { n }]) => ({ catNome, n }))
      .sort((a, b) => a.catNome.localeCompare(b.catNome, "pt-BR"));
  };

  // Chip de categoria inline (Opção A)
  const chipCat = ({ catNome, n }) => {
    const cor    = n === 0 ? "#ff6b6b" : n < 3 ? "#ffcc44" : "#7acc44";
    const bg     = n === 0 ? "#2a0a0a" : n < 3 ? "#1a1400" : "#0a1a08";
    return (
      <span key={catNome} style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
        color: cor, background: bg, flexShrink: 0,
      }}>
        {catNome} · {n}
      </span>
    );
  };

  // Badge simples para modo detalhado
  const badgeInscricao = (n, semInscricao = false) => {
    if (!temInscricoes) return null;
    const cor = semInscricao ? "#ff6b6b" : n >= 5 ? "#7acc44" : n >= 1 ? "#ffcc44" : "#ff6b6b";
    const bg  = semInscricao ? "#2a0a0a" : n >= 5 ? "#0a1a08" : n >= 1 ? "#1a1400" : "#2a0a0a";
    return (
      <span style={{ fontSize: 11, fontWeight: 700, color: cor, background: bg,
        padding: "2px 7px", borderRadius: 10, flexShrink: 0 }}>
        {n} insc.
      </span>
    );
  };

  // ── Limpeza: remove provas sem inscrição ──────────────────────────────────
  // provaTemInscricao: conservador — null (catId não reconhecível) = manter
  const provaTemInscricao = (provaId) => { const n = getContagem(provaId); return n === null || n > 0; };
  const calcRemovidos = () => (form.provasPrograma || []).filter(id => !provaTemInscricao(id));

  // Lista congelada no momento em que o modal abre — execução usa essa mesma lista,
  // evitando divergência se inscricoesMap reprocessar entre render e clique.
  const [removidosConfirmados, setRemovidosConfirmados] = useState([]);

  const abrirConfirmLimpar = () => {
    setRemovidosConfirmados(calcRemovidos());
    setConfirmLimpar(true);
  };

  const executarLimpeza = () => {
    // Segurança dupla: refiltra a lista congelada mantendo apenas ids que ainda
    // não têm inscrição NO MOMENTO da execução — nunca remove prova com inscrição.
    const aRemover = new Set(
      removidosConfirmados.filter(id => !provaTemInscricao(id))
    );
    // Guard: se algum id da lista congelada agora tem inscrição, aborta com aviso
    const comInscricaoAgora = removidosConfirmados.filter(id => provaTemInscricao(id));
    if (comInscricaoAgora.length > 0) {
      setConfirmLimpar(false);
      setRemovidosConfirmados([]);
      alert(`⚠️ Dados de inscrição foram atualizados desde que o painel foi aberto.\n\n${comInscricaoAgora.length} prova(s) passaram a ter inscrições e foram mantidas.\n\nReabra o painel para ver a lista atualizada.`);
      return;
    }
    if (aRemover.size === 0) { setConfirmLimpar(false); return; }
    const novasProvas = (form.provasPrograma || []).filter(id => !aRemover.has(id));
    const novoProg = { ...(form.programaHorario || {}) };
    if (modoHorario === "agrupado") {
      Object.keys(novoProg).forEach(chave => {
        if (!novasProvas.some(id => getGrupoKeyLocal(id) === chave)) delete novoProg[chave];
      });
    } else {
      aRemover.forEach(id => { delete novoProg[id]; });
    }
    setForm(f => ({
      ...f,
      provasPrograma: novasProvas,
      programaHorario: novoProg,
      programaOrdem: (f.programaOrdem || []).filter(k =>
        novasProvas.some(id => getGrupoKeyLocal(id) === k)
      ),
    }));
    setConfirmLimpar(false);
    setRemovidosConfirmados([]);
  };

  const podeVerificar = form.inscricoesEncerradas && temInscricoes;

  // ── Lista flat MODO DETALHADO ─────────────────────────────────────────────
  const listaCompleta = [];
  provasSel.forEach(p => {
    if (p.tipo === "combinada") {
      listaCompleta.push({ ...p, _isCombMae: true });
      const comp = getComposicaoCombinada(p.id);
      if (comp) {
        comp.provas.forEach((cp, idx) => {
          const chave = `COMP_${p.id}_${idx}_${cp.sufixo}`;
          listaCompleta.push({
            id: chave, nome: cp.nome, grupo: p.nome, tipo: cp.tipo, unidade: cp.unidade,
            dia: cp.dia, ordem: idx + 1, _isComp: true, _combinadaNome: comp.nome, _parentId: p.id,
          });
        });
      }
    } else {
      listaCompleta.push(p);
    }
  });
  const grupos = [...new Set(listaCompleta.filter(p => !p._isComp && !p._isCombMae).map(p => p.grupo))];

  // ── Lista agrupada MODO AGRUPADO ──────────────────────────────────────────
  const listaAgrupadaBase = (() => {
    const map = new Map();
    provasSel.filter(p => p.tipo !== "combinada").forEach(p => {
      const grupoKey = getGrupoKeyLocal(p.id);
      const sexoLabel = p.misto ? "Misto" : p.id.startsWith("M_") ? "Masc" : "Fem";
      const nomeBase = p.nome.replace(/\s*\([^)]+\)\s*$/, "").trim();
      if (!map.has(grupoKey)) {
        map.set(grupoKey, { grupoKey, nome: nomeBase, grupo: p.grupo, sexoLabel, cats: [], misto: p.misto });
      }
      const catNome = CATEGORIAS.find(c =>
        p.id.endsWith(`_${c.id}`) || p.id.includes(`_${c.id}_`)
      )?.nome || "";
      const entry = map.get(grupoKey);
      if (catNome && !entry.cats.includes(catNome)) entry.cats.push(catNome);
    });
    return [...map.values()];
  })();

  const ordemSalva = form.programaOrdem || [];
  const listaAgrupada = (() => {
    if (ordemSalva.length === 0) return listaAgrupadaBase;
    const ordenados = ordemSalva.map(k => listaAgrupadaBase.find(p => p.grupoKey === k)).filter(Boolean);
    const novos = listaAgrupadaBase.filter(p => !ordemSalva.includes(p.grupoKey));
    return [...ordenados, ...novos];
  })();

  const gruposAgrupados = (() => {
    const seen = new Set();
    return listaAgrupada.map(p => p.grupo).filter(g => { if (seen.has(g)) return false; seen.add(g); return true; });
  })();

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = (e, key) => { dragKeyRef.current = key; e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e, key) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverKey(key); };
  const handleDrop = (e, targetKey) => {
    e.preventDefault();
    const fromKey = dragKeyRef.current;
    if (!fromKey || fromKey === targetKey) { setDragOverKey(null); return; }
    const currentOrder = listaAgrupada.map(p => p.grupoKey);
    const fromIdx = currentOrder.indexOf(fromKey);
    const toIdx = currentOrder.indexOf(targetKey);
    if (fromIdx === -1 || toIdx === -1) { setDragOverKey(null); return; }
    const newOrder = [...currentOrder];
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, fromKey);
    setForm(f => ({ ...f, programaOrdem: newOrder }));
    setDragOverKey(null);
    dragKeyRef.current = null;
  };
  const handleDragEnd = () => { setDragOverKey(null); dragKeyRef.current = null; };

  // ── Contagem de horários ──────────────────────────────────────────────────
  let totalEntries = 0, totalComHorario = 0;
  if (modoHorario === "detalhado") {
    totalEntries = listaCompleta.filter(p => !p._isCombMae).reduce((acc, p) => acc + getEntries(p.id).length, 0);
    totalComHorario = listaCompleta.filter(p => !p._isCombMae).reduce((acc, p) => acc + getEntries(p.id).filter(e => e.horario).length, 0);
  } else {
    listaAgrupada.forEach(({ grupoKey }) => {
      const ents = getEntries(grupoKey);
      totalEntries += ents.length;
      totalComHorario += ents.filter(e => e.horario).length;
    });
  }

  const dragHandleStyle = {
    cursor: "grab", fontSize: 16, color: "#444", padding: "0 6px",
    userSelect: "none", display: "flex", alignItems: "center", flexShrink: 0,
  };

  return (
    <div style={s.formCard}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ color: "#1976D2", fontWeight: 700, fontSize: 15 }}>🕐 Programa Horário</div>
          <span style={{ fontSize: 12, color: "#888" }}>{totalComHorario}/{totalEntries} horários preenchidos</span>
        </div>

        {/* Toggle + limpeza */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setModoHorario("agrupado")} style={{
            padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
            background: modoHorario === "agrupado" ? "#1976D2" : "#141720",
            color: modoHorario === "agrupado" ? "#fff" : "#666",
          }}>📋 Por modalidade/sexo</button>
          <button onClick={() => setModoHorario("detalhado")} style={{
            padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
            background: modoHorario === "detalhado" ? "#1976D2" : "#141720",
            color: modoHorario === "detalhado" ? "#fff" : "#666",
          }}>🔍 Detalhado por categoria</button>
          {podeVerificar && (
            <button onClick={abrirConfirmLimpar} style={{
              marginLeft: "auto", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
              cursor: "pointer", border: "1px solid #3a2a1a",
              background: calcRemovidos().length > 0 ? "#1a0e05" : "#0d0e14",
              color: calcRemovidos().length > 0 ? "#ff9944" : "#555",
            }}>
              🧹 Remover sem inscrições {calcRemovidos().length > 0 ? `(${calcRemovidos().length})` : ""}
            </button>
          )}
        </div>

        {/* Modal confirmação limpeza */}
        {confirmLimpar && (
          <div style={{ background: "#100a04", border: "1px solid #3a2a1a", borderRadius: 8, padding: "16px 18px", marginBottom: 14 }}>
            {removidosConfirmados.length === 0 ? (
              <>
                <div style={{ color: "#7acc44", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>✅ Todas as provas têm inscrições</div>
                <p style={{ color: "#888", fontSize: 12, margin: "0 0 12px" }}>Nenhuma prova precisa ser removida.</p>
                <button onClick={() => { setConfirmLimpar(false); setRemovidosConfirmados([]); }} style={{ background: "#141720", color: "#888", border: "1px solid #2a2d3a", borderRadius: 6, padding: "6px 16px", cursor: "pointer", fontSize: 12 }}>Fechar</button>
              </>
            ) : (
              <>
                <div style={{ color: "#ff9944", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>⚠️ {removidosConfirmados.length} prova(s) sem inscrição</div>
                <p style={{ color: "#888", fontSize: 12, margin: "0 0 10px" }}>
                  Serão <strong style={{ color: "#ff6b6b" }}>removidas da competição</strong>, propagando para súmulas, resultados e secretaria. Provas com inscrições <strong style={{ color: "#7acc44" }}>nunca serão removidas</strong>.
                </p>
                <div style={{ maxHeight: 160, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 3 }}>
                  {removidosConfirmados.map(id => {
                    const p = todasProvas.find(x => x.id === id);
                    const catNome = CATEGORIAS.find(c => id.endsWith(`_${c.id}`) || id.includes(`_${c.id}_`))?.nome || "";
                    const sexoLabel = id.startsWith("M_") ? "Masc" : "Fem";
                    return (
                      <div key={id} style={{ fontSize: 12, color: "#cc8844", padding: "3px 8px", background: "#1a0e05", borderRadius: 4 }}>
                        {p?.nome || id} <span style={{ color: "#666" }}>— {sexoLabel} · {catNome}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={executarLimpeza} style={{ background: "#cc4400", color: "#fff", border: "none", borderRadius: 6, padding: "7px 18px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                    Remover {removidosConfirmados.length} prova(s)
                  </button>
                  <button onClick={() => { setConfirmLimpar(false); setRemovidosConfirmados([]); }} style={{ background: "#141720", color: "#888", border: "1px solid #2a2d3a", borderRadius: 6, padding: "7px 16px", cursor: "pointer", fontSize: 12 }}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {modoHorario === "agrupado" ? (
          <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6 }}>
            Um único horário por modalidade e sexo. Exibição: <span style={{ color: "#ccc" }}>09:00 — Arremesso do Peso — Masculino · Sub-14 · Sub-16</span>
          </p>
        ) : (
          <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6 }}>
            Defina o horário e fase de cada prova individualmente. Ao selecionar <strong style={{ color: "#ff8844" }}>Eliminatória</strong> ou <strong style={{ color: "#88aaff" }}>Semifinal</strong>, as fases subsequentes são geradas automaticamente com horários independentes.
          </p>
        )}
      </div>

      {/* ═══ MODO AGRUPADO ═════════════════════════════════════════════════════ */}
      {modoHorario === "agrupado" && (
        <>
          {gruposAgrupados.map(grupo => {
            const provasGrupo = listaAgrupada.filter(p => p.grupo === grupo);
            if (provasGrupo.length === 0) return null;
            return (
              <div key={grupo} style={{ marginBottom: 18, background: "#0a0a1a", border: "1px solid #1a2a3a", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, color: "#ccc", fontSize: 13 }}>{grupo}</span>
                  <span style={{ fontSize: 11, color: "#555" }}>{provasGrupo.length} modalidade(s)</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {provasGrupo.map(p => {
                    const chave = p.grupoKey;
                    const entries = getEntries(chave);
                    const faseInicial = getFaseInicial(chave);
                    const isDragOver = dragOverKey === chave;
                    const catsComN = temInscricoes ? getCatsComContagem(chave) : null;
                    return (
                      <div key={chave}
                        draggable
                        onDragStart={(e) => handleDragStart(e, chave)}
                        onDragOver={(e) => handleDragOver(e, chave)}
                        onDrop={(e) => handleDrop(e, chave)}
                        onDragEnd={handleDragEnd}
                        style={{ display: "flex", flexDirection: "column", gap: 4,
                          outline: isDragOver ? "2px solid #1976D2" : "none",
                          borderRadius: 6, transition: "outline 0.1s" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#0d0e14", borderRadius: 6, border: "1px solid #1a1d2a" }}>
                          <span style={dragHandleStyle} title="Arrastar para reordenar">⠿</span>
                          <input type="time" value={entries[0]?.horario || ""}
                            onChange={(e) => setEntryHorario(chave, 0, e.target.value)}
                            style={{ background: "#111", color: "#fff", border: "1px solid #2a3050", borderRadius: 4, padding: "4px 8px", fontSize: 13, width: 100, fontFamily: "monospace" }}
                          />
                          <span style={{ color: "#ddd", fontSize: 13, flexShrink: 0 }}>{p.nome}</span>
                          <span style={{ color: "#555", fontSize: 11, flexShrink: 0 }}>{p.sexoLabel}</span>
                          {/* Chips de categoria com contagem — Opção A */}
                          {catsComN ? (
                            <span style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
                              {catsComN.map(item => chipCat(item))}
                            </span>
                          ) : (
                            <span style={{ flex: 1, color: "#555", fontSize: 11 }}>
                              {p.cats.join(" · ")}
                            </span>
                          )}
                          <select value={faseInicial}
                            onChange={(e) => setFaseInicial(chave, e.target.value)}
                            style={{ background: "#111", color: faseInicial ? faseColor(faseInicial) : "#555", border: "1px solid #2a3050", borderRadius: 4, padding: "4px 6px", fontSize: 11, fontWeight: 700, width: 150, flexShrink: 0 }}>
                            {FASE_INICIAIS.map(f => <option key={f} value={f}>{f || "Fase..."}</option>)}
                          </select>
                        </div>
                        {renderSubEntries(chave)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ═══ MODO DETALHADO ═══════════════════════════════════════════════════ */}
      {modoHorario === "detalhado" && (
        <>
          {grupos.map(grupo => {
            const provasGrupo = listaCompleta.filter(p => p.grupo === grupo && !p._isComp && !p._isCombMae)
              .sort((a, b) => a.nome.localeCompare(b.nome));
            if (provasGrupo.length === 0) return null;
            return (
              <div key={grupo} style={{ marginBottom: 18, background: "#0a0a1a", border: "1px solid #1a2a3a", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, color: "#ccc", fontSize: 13 }}>{grupo}</span>
                  <span style={{ fontSize: 11, color: "#555" }}>{provasGrupo.length} prova(s)</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {provasGrupo.map(p => {
                    const catNome = CATEGORIAS.find(c => p.id.includes(`_${c.id}_`) || p.id.endsWith(`_${c.id}`))?.nome || "";
                    const sexoLabel = p.misto ? "Misto" : p.id.startsWith("M_") ? "Masc" : "Fem";
                    const entries = getEntries(p.id);
                    const faseInicial = getFaseInicial(p.id);
                    const nInsc = getContagem(p.id);
                    const semInscricao = podeVerificar && nInsc === 0;
                    return (
                      <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px",
                          background: semInscricao ? "#160a04" : "#0d0e14", borderRadius: 6,
                          border: `1px solid ${semInscricao ? "#3a2010" : "#1a1d2a"}` }}>
                          <input type="time" value={entries[0]?.horario || ""}
                            onChange={(e) => setEntryHorario(p.id, 0, e.target.value)}
                            style={{ background: "#111", color: "#fff", border: "1px solid #2a3050", borderRadius: 4, padding: "4px 8px", fontSize: 13, width: 100, fontFamily: "monospace" }}
                          />
                          <span style={{ flex: 1, color: "#ddd", fontSize: 13 }}>{p.nome}</span>
                          <span style={{ color: "#666", fontSize: 11 }}>{sexoLabel} · {catNome}</span>
                          {badgeInscricao(nInsc ?? 0, semInscricao)}
                          <select value={faseInicial}
                            onChange={(e) => setFaseInicial(p.id, e.target.value)}
                            style={{ background: "#111", color: faseInicial ? faseColor(faseInicial) : "#555", border: "1px solid #2a3050", borderRadius: 4, padding: "4px 6px", fontSize: 11, fontWeight: 700, width: 150 }}>
                            {FASE_INICIAIS.map(f => <option key={f} value={f}>{f || "Fase..."}</option>)}
                          </select>
                        </div>
                        {renderSubEntries(p.id)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {listaCompleta.filter(p => p._isCombMae).map(mae => {
            const componentes = listaCompleta.filter(p => p._isComp && p._parentId === mae.id);
            const catNome = CATEGORIAS.find(c => mae.id.includes(`_${c.id}_`) || mae.id.endsWith(`_${c.id}`))?.nome || "";
            const sexoLabel = mae.misto ? "Misto" : mae.id.startsWith("M_") ? "Masc" : "Fem";
            return (
              <div key={mae.id} style={{ marginBottom: 18, background: "#0a0a1a", border: "1px solid #1a2a3a", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, color: "#1976D2", fontSize: 13 }}>🏅 {mae.nome} — {sexoLabel} · {catNome}</span>
                  <span style={{ fontSize: 11, color: "#555" }}>{componentes.length} prova(s)</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {componentes.map(cp => {
                    const entries = getEntries(cp.id);
                    const faseInicial = getFaseInicial(cp.id);
                    return (
                      <div key={cp.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "#0d0e14", borderRadius: 6, border: "1px solid #1a1d2a" }}>
                          <input type="time" value={entries[0]?.horario || ""}
                            onChange={(e) => setEntryHorario(cp.id, 0, e.target.value)}
                            style={{ background: "#111", color: "#fff", border: "1px solid #2a3050", borderRadius: 4, padding: "4px 8px", fontSize: 13, width: 100, fontFamily: "monospace" }}
                          />
                          <span style={{ color: "#1976D2", fontSize: 11, fontWeight: 700, width: 22, textAlign: "center" }}>{cp.ordem}ª</span>
                          <span style={{ flex: 1, color: "#ddd", fontSize: 13 }}>{cp.nome}</span>
                          {cp.dia && <span style={{ color: "#88aaff", fontSize: 10, background: "#0a1a2a", padding: "2px 6px", borderRadius: 3 }}>Dia {cp.dia}</span>}
                          <select value={faseInicial}
                            onChange={(e) => setFaseInicial(cp.id, e.target.value)}
                            style={{ background: "#111", color: faseInicial ? faseColor(faseInicial) : "#555", border: "1px solid #2a3050", borderRadius: 4, padding: "4px 6px", fontSize: 11, fontWeight: 700, width: 150 }}>
                            {FASE_INICIAIS.map(f => <option key={f} value={f}>{f || "Fase..."}</option>)}
                          </select>
                        </div>
                        {renderSubEntries(cp.id)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ── Pausa / Intervalo ── */}
      <div style={{ background: "#0a0a1a", border: "1px solid #1a2a3a", borderRadius: 10, padding: "14px 16px", marginBottom: 8 }}>
        <div style={{ color: "#1976D2", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>⏸️ Intervalo / Pausa</div>
        <p style={{ color: "#888", fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
          Defina um intervalo entre os períodos da manhã e da tarde. As provas serão automaticamente divididas pelo horário da pausa.
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={{ color: "#888", fontSize: 11, display: "block", marginBottom: 4 }}>Início da pausa</label>
            <input type="time" value={(form.programaPausa || {}).horario || ""}
              onChange={(e) => setForm(f => ({ ...f, programaPausa: { ...(f.programaPausa || {}), horario: e.target.value } }))}
              style={{ background: "#111", color: "#fff", border: "1px solid #2a3050", borderRadius: 4, padding: "6px 10px", fontSize: 13, width: 110, fontFamily: "monospace" }}
            />
          </div>
          <div>
            <label style={{ color: "#888", fontSize: 11, display: "block", marginBottom: 4 }}>Retorno</label>
            <input type="time" value={(form.programaPausa || {}).retorno || ""}
              onChange={(e) => setForm(f => ({ ...f, programaPausa: { ...(f.programaPausa || {}), retorno: e.target.value } }))}
              style={{ background: "#111", color: "#fff", border: "1px solid #2a3050", borderRadius: 4, padding: "6px 10px", fontSize: 13, width: 110, fontFamily: "monospace" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ color: "#888", fontSize: 11, display: "block", marginBottom: 4 }}>Descrição</label>
            <input type="text" value={(form.programaPausa || {}).descricao || ""}
              onChange={(e) => setForm(f => ({ ...f, programaPausa: { ...(f.programaPausa || {}), descricao: e.target.value } }))}
              placeholder="Ex: Horário de Almoço"
              style={{ background: "#111", color: "#fff", border: "1px solid #2a3050", borderRadius: 4, padding: "6px 10px", fontSize: 13, width: "100%" }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button style={s.btnGhost} onClick={() => setStep(3)}>← Voltar</button>
        <button style={s.btnPrimary} onClick={handleSalvar}>
          {editando ? "💾 Salvar Alterações" : "✅ Criar Competição"}
        </button>
      </div>
    </div>
  );
}


export { TelaCadastroEvento, FiltroProvasStep, ProgramaHorarioStep, RichTextEditor };
