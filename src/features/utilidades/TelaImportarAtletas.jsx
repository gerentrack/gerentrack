import React, { useState } from "react";
import { validarCPF } from "../../shared/formatters/utils";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";

const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

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
  btnIconSmDanger: { background: t.bgCardAlt, border: `1px solid ${t.danger}44`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
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
  catPreview: { background: t.bgInput, border: `1px solid ${t.accentBorder}`, borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: t.textTertiary },
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
  radioLabelActive: { background: t.bgHover, border: `1px solid ${t.accentBorder}`, color: t.accent },
  resumoInscricao: { background: t.bgCard, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: "16px 20px", marginTop: 16 },
  tagProva: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  sumuCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  savedBadge: { background: `${t.success}15`, border: `1px solid ${t.success}44`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
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
    background: status === "ao_vivo" ? `${t.danger}15` : status === "hoje_pre" ? t.accentBg : status === "futuro" ? `${t.success}15` : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textDisabled,
    border: `1px solid ${status === "ao_vivo" ? `${t.danger}44` : status === "hoje_pre" ? t.accentBorder : status === "futuro" ? `${t.success}44` : t.border}`,
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
  permissividadeTag: (ativo) => ({ display: "inline-block", background: ativo ? `${t.success}15` : t.bgCard, border: `1px solid ${ativo ? `${t.success}44` : t.border}`, color: ativo ? t.success : t.textDisabled, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600 }),
  permissividadeAlert: { display: "flex", gap: 14, alignItems: "flex-start", background: `${t.success}10`, border: `1px solid ${t.success}44`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 },
  permissividadeAlertIcon: { fontSize: 28, flexShrink: 0, marginTop: 2 },
  permissividadeAlertTitle: { fontWeight: 700, color: t.success, fontSize: 15, marginBottom: 4 },
  permissividadeAlertBody: { color: t.textTertiary, fontSize: 13, lineHeight: 1.6, marginBottom: 6 },
  permissividadeAlertRodape: { fontSize: 12, color: t.textDimmed, fontStyle: "italic" },
  filtroProvasBar: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 20 },
  filtroProvasBloco: { display: "flex", flexDirection: "column", gap: 8 },
  filtroProvasLabel: { fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 },
  filtroProvasPills: { display: "flex", flexWrap: "wrap", gap: 6 },
  filtroPill: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textDimmed, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5, transition: "all 0.15s" },
  filtroPillAtivo: { background: t.bgHover, border: `1px solid ${t.accentBorder}`, color: t.accent },
  filtroClearBtn: { background: "none", border: "none", color: `${t.accent}88`, cursor: "pointer", fontSize: 11, fontFamily: "'Barlow', sans-serif", padding: "0 4px", textDecoration: "underline" },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? t.bgHover : "transparent", color: ativo ? t.accent : t.textDisabled, border: `1px solid ${ativo ? t.accentBorder : t.border}` }),
  stepDivider: { flex: 1, height: 1, background: t.border, margin: "0 8px" },
  modoSwitch: { display: "flex", gap: 0, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: t.textDimmed, padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: t.bgInput, color: t.accent },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: t.bgHover, borderColor: t.accentBorder, color: t.accent },
  grupoProvasBox: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 16, overflow: "hidden" },
  grupoProvasHeader: { background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  provaCheckBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", lineHeight: 1.4, userSelect: "none" },
  provaCheckBtnSel: { background: t.bgHover, borderColor: t.accentBorder, color: t.accent },
};
}

const painelDestino = (u) =>
  (u?.tipo === "equipe" || u?.tipo === "treinador") ? "painel-equipe" : "painel";


function TelaImportarAtletas() {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { usuarioLogado } = useAuth();
  const { atletas, adicionarAtleta, adicionarAtletasEmLote, equipes } = useEvento();
  const { setTela, organizadores, atletasUsuarios, funcionarios, treinadores } = useApp();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [lgpdDeclarado, setLgpdDeclarado] = useState(false);
  
  // Filters for Admin/Organizador
  const [clubeSelecionado, setClubeSelecionado] = useState("");
  const [equipeSelecionada, setEquipeSelecionada] = useState("");
  
  const isEquipe = usuarioLogado?.tipo === "equipe";
  const isTreinador = usuarioLogado?.tipo === "treinador";
  const isAdminOuOrg = usuarioLogado?.tipo === "admin" || usuarioLogado?.tipo === "organizador" || usuarioLogado?.tipo === "funcionario";

  if (isTreinador && !(usuarioLogado?.permissoes || []).includes("importar_atletas")) {
    return (<div style={{ maxWidth:600, margin:"40px auto", padding:24, textAlign:"center" }}>
      <p style={{ fontSize:16, fontWeight:700 }}>Acesso restrito</p>
      <p style={{ fontSize:13, marginTop:8 }}>Você não tem permissão para importar atletas.</p>
      <button onClick={() => setTela("painel-equipe")} style={{ marginTop:16, padding:"8px 20px", cursor:"pointer" }}>← Voltar</button>
    </div>);
  }

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setErro("");
    setFile(selectedFile);
    setLoading(true);

    try {
      // Load XLSX dynamically via ES module import (same approach as results import)
      let XL = typeof window !== 'undefined' && window.XLSX ? window.XLSX : null;
      if (!XL) {
        try {
          XL = await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
        } catch(e) {
          // Fallback: try script tag
          try {
            await new Promise((resolve, reject) => {
              const scriptEl = document.createElement('script');
              scriptEl.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
              scriptEl.onload = resolve;
              scriptEl.onerror = reject;
              document.head.appendChild(scriptEl);
            });
            XL = window.XLSX;
          } catch(e2) {}
        }
      }
      if (!XL) {
        setErro(" Não foi possível carregar a biblioteca Excel. Recarregue a página (Ctrl+Shift+R).");
        setLoading(false);
        return;
      }
      
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XL.read(arrayBuffer, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XL.utils.sheet_to_json(worksheet, { defval: "" });
      
      if (data.length === 0) {
        setErro("A planilha está vazia. Adicione pelo menos um atleta.");
        setLoading(false);
        return;
      }

      const atletasParaImportar = [];
      const erros = [];

      data.forEach((row, idx) => {
        const linha = idx + 2;
        
        // Normalizar chaves: case-insensitive lookup
        const get = (chaves) => {
          for (const ch of chaves) {
            if (row[ch] !== undefined && row[ch] !== "") return String(row[ch]).trim();
            const found = Object.keys(row).find(k => k.toLowerCase() === ch.toLowerCase());
            if (found && row[found] !== undefined && row[found] !== "") return String(row[found]).trim();
          }
          return "";
        };
        const getRaw = (chaves) => {
          for (const ch of chaves) {
            if (row[ch] !== undefined && row[ch] !== "") return row[ch];
            const found = Object.keys(row).find(k => k.toLowerCase() === ch.toLowerCase());
            if (found && row[found] !== undefined && row[found] !== "") return row[found];
          }
          return "";
        };

        // Campos obrigatórios
        const nome = get(["Nome*", "Nome"]);
        const sexoRaw = get(["Sexo*", "Sexo"]).toUpperCase();
        const dataNascRaw = getRaw(["Data Nascimento*", "Data Nasc*", "DataNasc", "Nascimento"]);
        const cpfRaw = get(["CPF*", "CPF"]);
        const cpf = cpfRaw.replace(/[.\-\/]/g, "");
        
        // Campos contextuais (só para Admin/Org)
        let clube = "";
        let equipeNome = "";
        
        if (isAdminOuOrg) {
          // Ignorar campos Clube/Equipe da planilha - serão usados os filtros
          clube = "";
          equipeNome = "";
        }
        
        // Campo opcional
        const cbat = get(["CBAt", "CBAT", "Cbat", "Registro CBAt", "Registro"]);
        const email = get(["E-mail", "Email", "E-mail*", "Email*"]);
        const fone = get(["Telefone", "Fone", "Tel", "Celular"]);

        // Validações
        if (!nome) {
          erros.push(`Linha ${linha}: Nome é obrigatório`);
          return;
        }

        const sexo = sexoRaw === "M" || sexoRaw === "MASCULINO" ? "M" 
                   : sexoRaw === "F" || sexoRaw === "FEMININO" ? "F" 
                   : null;
        if (!sexo) {
          erros.push(`Linha ${linha}: Sexo inválido (use 'M' ou 'F')`);
          return;
        }

        if (!cpf) {
          erros.push(`Linha ${linha}: CPF é obrigatório`);
          return;
        }
        if (!validarCPF(cpf)) {
          erros.push(`Linha ${linha}: CPF inválido (${cpfRaw})`);
          return;
        }

        // Parse date
        let dataNasc = "";
        if (dataNascRaw instanceof Date) {
          dataNasc = dataNascRaw.toISOString().split('T')[0];
        } else {
          const dateStr = String(dataNascRaw).trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            dataNasc = dateStr;
          } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            const [day, month, year] = dateStr.split('/');
            dataNasc = `${year}-${month}-${day}`;
          }
        }

        if (!dataNasc) {
          erros.push(`Linha ${linha}: Data de nascimento inválida (use AAAA-MM-DD ou DD/MM/AAAA)`);
          return;
        }

        const anoNasc = dataNasc.split('-')[0];

        // Check duplicate CPF in system
        if (atletas.some(a => a.cpf === cpf)) {
          erros.push(`Linha ${linha}: CPF ${cpf} já cadastrado no sistema`);
          return;
        }

        // Check duplicate CPF in current import
        if (atletasParaImportar.some(a => a.cpf === cpf)) {
          erros.push(`Linha ${linha}: CPF ${cpf} duplicado na planilha`);
          return;
        }

        // Check duplicate CBAt in system
        if (cbat && atletas.some(a => a.cbat && a.cbat.trim() === cbat)) {
          erros.push(`Linha ${linha}: Nº CBAt ${cbat} já cadastrado no sistema`);
          return;
        }

        // Check duplicate CBAt in current import
        if (cbat && atletasParaImportar.some(a => a.cbat && a.cbat.trim() === cbat)) {
          erros.push(`Linha ${linha}: Nº CBAt ${cbat} duplicado na planilha`);
          return;
        }

        atletasParaImportar.push({
          nome,
          sexo,
          anoNasc,
          dataNasc,
          cpf,
          email: email || "",
          fone: fone || "",
          clube: clube || undefined,
          cbat: cbat || undefined,
          equipeNome: equipeNome || undefined,
          _linhaOrigem: linha
        });
      });

      if (erros.length > 0 && atletasParaImportar.length === 0) {
        setErro(`Nenhum atleta válido encontrado.\n\nErros encontrados:\n${erros.join('\n')}`);
        setPreview(null);
      } else {
        if (erros.length > 0) {
          setErro(`${erros.length} linha(s) com problema (serão ignoradas):\n${erros.join('\n')}\n\n${atletasParaImportar.length} atleta(s) válido(s) prontos para importar.`);
        }
        setPreview(atletasParaImportar);
      }
    } catch (err) {
      setErro(`Erro ao ler arquivo: ${err.message}`);
      setPreview(null);
    }

    setLoading(false);
  };

  const handleConfirmar = async () => {
    if (!preview || preview.length === 0) return;
    if (loading) return;
    setLoading(true);

    // Validar filtros para Admin/Org
    let clubeParaUsar = clubeSelecionado;
    let equipeParaUsar = equipeSelecionada;
    if (isAdminOuOrg) {
      if (!equipeParaUsar) {
        setErro("Selecione a Equipe para vincular aos atletas");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setLoading(false);
        return;
      }
      if (!clubeParaUsar) {
        // Resolve síncronamente sem depender do state atualizado
        const eq = equipesDisponiveis.find(eq => eq.id === equipeParaUsar);
        if (eq) {
          clubeParaUsar = eq.nome;
          setClubeSelecionado(eq.nome); // atualiza state p/ consistência visual
        }
      }
    }

    const novosAtletas = [];
    preview.forEach((atletaData, idx) => {
      const { _linhaOrigem, equipeNome, ...data } = atletaData;

      // Preservar ID existente: busca por CPF (prioritário) ou nome+anoNasc
      let idExistente = null;
      if (data.cpf) {
        const cpfLimpo = data.cpf.replace(/\D/g, "");
        const found = atletas.find(a => a.cpf && a.cpf.replace(/\D/g, "") === cpfLimpo);
        if (found) idExistente = found.id;
      }
      if (!idExistente && data.nome && data.anoNasc) {
        const found = atletas.find(a =>
          a.nome && a.nome.trim().toLowerCase() === data.nome.trim().toLowerCase() &&
          String(a.anoNasc) === String(data.anoNasc)
        );
        if (found) idExistente = found.id;
      }

      novosAtletas.push({
        ...data,
        id: idExistente || genId(),
        dataCadastro: new Date().toISOString(),
        clube: (isEquipe || isTreinador) ? (equipes.find(eq => eq.id === (isEquipe ? usuarioLogado.id : usuarioLogado?.equipeId))?.entidade || usuarioLogado.entidade || "") : clubeParaUsar,
        equipeId: isEquipe ? usuarioLogado.id : (isTreinador ? usuarioLogado?.equipeId || "" : equipeParaUsar),
        organizadorId: isAdminOuOrg ? (usuarioLogado?.tipo === "organizador" ? usuarioLogado.id : (usuarioLogado?.organizadorId || "")) : "",
        cadastradoPor: usuarioLogado?.tipo || null,
        // LGPD: consentimento não coletado diretamente — será solicitado no primeiro login do atleta
        lgpdConsentimento: false,
        lgpdConsentimentoPendente: true,
        lgpdResponsavelImportacao: usuarioLogado?.id || null,
        lgpdResponsavelImportacaoNome: usuarioLogado?.nome || null,
        lgpdImportadoEm: new Date().toISOString(),
      });
    });

    // Limpar emails duplicados silenciosamente na importação em lote
    const emailsExistentes = new Set();
    [...organizadores, ...equipes, ...atletasUsuarios, ...funcionarios, ...treinadores, ...atletas]
      .forEach(u => { if (u.email) emailsExistentes.add(u.email.trim().toLowerCase()); });
    const novosLimpos = novosAtletas.map(a => {
      if (!a.email) return a;
      const emailNorm = a.email.trim().toLowerCase();
      if (emailsExistentes.has(emailNorm)) return { ...a, email: "" };
      emailsExistentes.add(emailNorm); // evitar duplicata entre os próprios importados
      return a;
    });

    try {
      await adicionarAtletasEmLote(novosLimpos);
      setLoading(false);
      alert(`✓ ${novosAtletas.length} atleta(s) importado(s) com sucesso!`);
    } catch (err) {
      console.error("[importar atletas] erro:", err);
      setLoading(false);
      alert(" Erro ao salvar atletas. Tente novamente.");
      return;
    }
    const tp = usuarioLogado?.tipo;
    if (tp === "admin") {
      setTela("admin");
    } else if (tp === "organizador" || tp === "funcionario") {
      setTela("painel-organizador");
    } else {
      // equipe, treinador → painel da equipe
      setTela(painelDestino(usuarioLogado));
    }
  };

  // Get unique clubs and trainers for filters
  // Resolve o orgId efetivo (organizador ou funcionário)
  const _meuOrgId = usuarioLogado?.tipo === "organizador"
    ? usuarioLogado.id
    : usuarioLogado?.tipo === "funcionario"
      ? usuarioLogado.organizadorId
      : null;

  const equipesDisponiveis = equipes.filter(eq => {
    if (eq.status !== "aprovado" && eq.status !== "ativa") return false;
    if (usuarioLogado?.tipo === "admin") return true;
    if (!_meuOrgId) return false;
    return eq.organizadorId === _meuOrgId;
  });

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>Importar Atletas em Lote</h1>
          <p style={{ color: t.textDimmed, fontSize: 14 }}>
            {(isEquipe || isTreinador)
              ? "Upload de planilha Excel - atletas vinculados automaticamente à sua equipe"
              : "Upload de planilha Excel - selecione a Equipe após processar"}
          </p>
        </div>
        <button style={s.btnGhost} onClick={() => {
          const tp = usuarioLogado?.tipo;
          if (tp === "admin") setTela("admin");
          else if (tp === "organizador" || tp === "funcionario") setTela("painel-organizador");
          else setTela(painelDestino(usuarioLogado)); // equipe, treinador
        }}>
          ← Voltar
        </button>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Upload area */}
        <div style={{
          background: t.bgHeaderSolid,
          border: `2px dashed ${t.accent}`,
          borderRadius: 12,
          padding: 40,
          textAlign: "center",
          marginBottom: 24
        }}>
          <h3 style={{ color: t.accent, marginBottom: 12 }}>Faça upload da planilha Excel</h3>
          <p style={{ color: t.textMuted, marginBottom: 24, fontSize: 14 }}>
            Arraste o arquivo ou clique para selecionar
          </p>
          
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <div style={{ ...s.btnPrimary, display: "inline-block", cursor: "pointer" }}>
              Selecionar Arquivo Excel
            </div>
          </label>

          {file && (
            <div style={{ marginTop: 16, color: t.success, fontSize: 14 }}>
              ✓ Arquivo selecionado: {file.name}
            </div>
          )}

          {loading && (
            <div style={{ marginTop: 16, color: t.accent }}>
              Processando planilha...
            </div>
          )}
        </div>

        {/* Download template */}
        <div style={{
          background: t.bgCardAlt,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          padding: 20,
          marginBottom: 24
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ color: t.textPrimary, marginBottom: 4 }}>Modelo de Planilha</h4>
              <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 0 }}>
                {isEquipe 
                  ? "Baixe o modelo simplificado"
                  : "Baixe o modelo - você selecionará a Equipe após o upload"}
              </p>
            </div>
            <button
              onClick={async () => {
                let XL = typeof window !== 'undefined' && window.XLSX ? window.XLSX : null;
                if (!XL) {
                  try {
                    XL = await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
                  } catch(e) {
                    try {
                      await new Promise((resolve, reject) => {
                        const scriptEl = document.createElement('script');
                        scriptEl.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
                        scriptEl.onload = resolve;
                        scriptEl.onerror = reject;
                        document.head.appendChild(scriptEl);
                      });
                      XL = window.XLSX;
                    } catch(e2) {}
                  }
                }
                if (!XL) {
                  alert(" Não foi possível carregar a biblioteca Excel. Recarregue a página.");
                  return;
                }
                const modelo = [
                  { "Nome*": "Maria Silva", "Sexo*": "F", "Data Nascimento*": "15/03/2005", "CPF*": "000.000.000-00", "CBAt": "", "E-mail": "maria@email.com", "Telefone": "(11) 99999-0000" },
                  { "Nome*": "", "Sexo*": "", "Data Nascimento*": "", "CPF*": "", "CBAt": "", "E-mail": "", "Telefone": "" }
                ];
                const ws = XL.utils.json_to_sheet(modelo);
                ws["!cols"] = [{ wch: 25 }, { wch: 6 }, { wch: 18 }, { wch: 16 }, { wch: 10 }, { wch: 25 }, { wch: 18 }];
                const wb = XL.utils.book_new();
                XL.utils.book_append_sheet(wb, ws, "Atletas");
                XL.writeFile(wb, "modelo_importacao_atletas.xlsx");
              }}
              style={{ ...s.btnSecondary, border: "none", cursor: "pointer" }}
            >
              Baixar Modelo
            </button>
          </div>
        </div>

        {/* Errors */}
        {erro && (
          <div style={{
            background: preview && preview.length > 0 ? `${t.warning}12` : `${t.danger}12`,
            border: `1px solid ${preview && preview.length > 0 ? `${t.warning}66` : `${t.danger}66`}`,
            borderRadius: 8,
            padding: 20,
            marginBottom: 24,
            whiteSpace: "pre-line"
          }}>
            <div style={{ color: preview && preview.length > 0 ? t.warning : t.danger, fontWeight: 600, marginBottom: 8 }}>
              {preview && preview.length > 0 ? "Importação parcial:" : "Erros encontrados:"}
            </div>
            <div style={{ color: preview && preview.length > 0 ? t.warning : t.danger, fontSize: 13 }}>{erro}</div>
          </div>
        )}

        {/* Filters for Admin/Org AFTER file processed */}
        {isAdminOuOrg && preview && preview.length > 0 && (
          <div style={{
            background: t.bgHeaderSolid,
            border: `2px solid ${t.accent}`,
            borderRadius: 12,
            padding: 24,
            marginBottom: 24
          }}>
            <h3 style={{ color: t.accent, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              Vincular atletas a:
            </h3>
            <div>
              <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                Equipe *
              </label>
              <select
                value={equipeSelecionada}
                onChange={(e) => {
                  setEquipeSelecionada(e.target.value);
                  const eq = equipesDisponiveis.find(eq => eq.id === e.target.value);
                  setClubeSelecionado(eq ? eq.nome : "");
                }}
                style={{
                  ...s.input,
                  width: "100%", maxWidth: 400,
                  background: equipeSelecionada ? `${t.success}15` : t.bgCardAlt
                }}
              >
                <option value="">Selecione...</option>
                {equipesDisponiveis.map((eqOpt) => (
                  <option key={eqOpt.id} value={eqOpt.id}>{eqOpt.nome}</option>
                ))}
              </select>
            </div>
            <p style={{ color: t.textDimmed, fontSize: 12, marginTop: 12, fontStyle: "italic" }}>
              Todos os {preview.length} atleta(s) serão vinculados à equipe selecionada
            </p>
          </div>
        )}

        {/* Preview */}
        {preview && preview.length > 0 && (
          <div style={{
            background: t.bgHeaderSolid,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: 24,
            marginBottom: 24
          }}>
            <h3 style={{ color: t.success, marginBottom: 16 }}>
              ✓ {preview.length} atleta(s) pronto(s) para importação
            </h3>
            <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 20 }}>
              Revise os dados abaixo{isAdminOuOrg ? " e selecione a Equipe acima" : ""} antes de confirmar:
            </p>

            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Nome</th>
                    <th style={s.th}>Sexo</th>
                    <th style={s.th}>Nasc.</th>
                    <th style={s.th}>CPF</th>
                    {!isEquipe && !isTreinador && <th style={s.th}>Equipe</th>}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((a, idx) => (
                    <tr key={idx} style={s.tr}>
                      <td style={s.td}>{a.nome}</td>
                      <td style={s.td}>{a.sexo === "M" ? "Masculino" : "Feminino"}</td>
                      <td style={s.td}>{a.dataNasc}</td>
                      <td style={s.td}>{a.cpf}</td>
                      {!isEquipe && !isTreinador && (
                        <td style={s.td}>
                          {equipeSelecionada ? (
                            <span style={{ color: t.success }}>
                              ✓ {equipesDisponiveis.find(eq => eq.id === equipeSelecionada)?.nome}
                            </span>
                          ) : (
                            <span style={{ color: t.textMuted }}>Selecione acima</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Declaração LGPD obrigatória ───────────────────────────── */}
            {(() => {
              const hoje = new Date();
              const temMenor = preview.some(a => {
                if (!a.dataNasc) return false;
                const nasc = new Date(a.dataNasc + "T12:00:00");
                let idade = hoje.getFullYear() - nasc.getFullYear();
                const m = hoje.getMonth() - nasc.getMonth();
                if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
                return idade < 18;
              });
              return (
                <div style={{ background: t.bgCardAlt, border:`1px solid ${lgpdDeclarado ? t.accentBorder : t.borderInput}`,
                  borderRadius:10, padding:"16px 18px", marginTop:16, marginBottom:8, transition:"border-color 0.2s" }}>
                  <div style={{ fontSize:12, fontWeight:700, color: t.accent, letterSpacing:1,
                    textTransform:"uppercase", marginBottom:10 }}>Declaração LGPD — Art. 7º e {temMenor ? "Art. 14" : "Art. 8"} da Lei 13.709/2018</div>
                  {temMenor && (
                    <div style={{ background:`${t.success}10`, border:`1px solid ${t.success}44`, borderRadius:7,
                      padding:"8px 12px", marginBottom:12, fontSize:12, color: t.success, lineHeight:1.6 }}>
                       <strong>Atenção:</strong> Esta lista contém <strong>atletas menores de 18 anos</strong>.
                      A declaração abaixo inclui a confirmação do consentimento parental exigido pelo Art. 14 da LGPD.
                    </div>
                  )}
                  <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
                    <input type="checkbox" checked={lgpdDeclarado} onChange={e => setLgpdDeclarado(e.target.checked)}
                      style={{ marginTop:2, width:16, height:16, cursor:"pointer", flexShrink:0 }} />
                    <span style={{ fontSize:13, color: t.textSecondary, lineHeight:1.7 }}>
                      Declaro que possuo o consentimento dos titulares{temMenor ? " e dos responsáveis legais pelos atletas menores de 18 anos " : " "}
                      para o tratamento dos dados pessoais contidos nesta planilha pelo GerenTrack,
                      para fins de gestão de competições de atletismo, conforme a{" "}
                      <button type="button" onClick={() => setTela("privacidade")}
                        style={{ background:"none", border:"none", color: t.accent, cursor:"pointer", fontSize:"inherit", padding:0, textDecoration: "underline" }}>Política de Privacidade</button>
                      {" "}e os{" "}
                      <button type="button" onClick={() => setTela("termos")}
                        style={{ background:"none", border:"none", color: t.accent, cursor:"pointer", fontSize:"inherit", padding:0, textDecoration: "underline" }}>Termos de Uso</button>,
                      assumindo total responsabilidade por esta declaração conforme a <strong style={{ color: t.accent }}>LGPD (Art. 7º{temMenor ? " e Art. 14" : ""})</strong>.
                      Os atletas serão solicitados a confirmar individualmente no primeiro acesso ao sistema.
                    </span>
                  </label>
                  {!lgpdDeclarado && (
                    <div style={{ color: t.danger, fontSize:12, marginTop:8 }}>
                      É necessário fazer esta declaração antes de confirmar a importação.
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                style={s.btnGhost}
                onClick={() => { setPreview(null); setFile(null); setClubeSelecionado(""); setEquipeSelecionada(""); setLgpdDeclarado(false); }}
              >
                Cancelar
              </button>
              <button
                style={{ ...s.btnPrimary, opacity: (loading || !lgpdDeclarado) ? 0.4 : 1,
                  cursor: (loading || !lgpdDeclarado) ? "not-allowed" : "pointer" }}
                onClick={handleConfirmar}
                disabled={loading || !lgpdDeclarado}
              >
                {loading ? "Importando..." : `✓ Confirmar Importação (${preview.length} atletas)`}
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!preview && !erro && !loading && (
          <div style={{
            background: t.bgHeaderSolid,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: 20
          }}>
            <h4 style={{ color: t.accent, marginBottom: 12 }}>Como usar:</h4>
            <ol style={{ color: t.textTertiary, fontSize: 14, lineHeight: 1.8, paddingLeft: 20 }}>
              <li>Baixe o modelo de planilha Excel acima</li>
              <li>Preencha: Nome, Sexo, Data de Nascimento, CPF{isEquipe ? "" : ""}</li>
              <li>Salve o arquivo</li>
              <li>Faça o upload usando o botão acima</li>
              {isAdminOuOrg && <li>Selecione a Equipe para vincular todos os atletas</li>}
              <li>Revise os dados apresentados</li>
              <li>Confirme a importação</li>
            </ol>
            {isEquipe ? (
              <p style={{ color: t.success, fontSize: 12, marginTop: 16, fontStyle: "italic" }}>
                ✓ Os atletas serão automaticamente vinculados a você como equipe
              </p>
            ) : (
              <p style={{ color: t.accent, fontSize: 12, marginTop: 16, fontStyle: "italic" }}>
                Você deve selecionar a Equipe após processar o arquivo
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label }) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  return (
    <div style={s.statCard}>
      <div style={s.statValue}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

function InfoCard({ icon, title, items }) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  return (
    <div style={s.infoCard}>
      <div style={s.infoCardTitle}>{icon ? `${icon} ` : ""}{title}</div>
      <ul style={s.infoList}>
        {items.map((item, i) => (
          <li key={i} style={s.infoItem}>
            <span style={s.infoItemDot}>›</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}


export default TelaImportarAtletas;
