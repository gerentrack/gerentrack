import { usePagination, PaginaControles } from "../../lib/hooks/usePagination.jsx";
import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { validarCPF, validarCNPJ, formatarCNPJ } from "../../shared/formatters/utils";

const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";
import { secondaryAuth, createUserWithEmailAndPassword, signOut as firebaseSignOut, functions, httpsCallable } from "../../firebase";
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
  btnIconSmDanger: { background: `${t.danger}11`, border: `1px solid ${t.danger}33`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
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
  erro: { background: `${t.danger}15`, border: `1px solid ${t.danger}`, color: t.danger, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
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
  savedBadge: { background: `${t.success}15`, border: `1px solid ${t.success}66`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  digitarDica: { color: t.textDimmed, fontSize: 12 },
  inputMarca: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", color: t.accent, fontSize: 16, fontFamily: t.fontTitle, fontWeight: 700, width: 120, outline: "none" },
  infoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: t.fontTitle, fontSize: 20, fontWeight: 700, color: t.accent, marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: `1px solid ${t.border}`, fontSize: 14, color: t.textSecondary, display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: t.accent, fontWeight: 700 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: "linear-gradient(180deg, #0D1018 0%, transparent 100%)", borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: t.accent, color: t.textPrimary, fontFamily: t.fontTitle, fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: t.fontTitle, fontSize: 56, fontWeight: 900, color: t.textPrimary, lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: t.fontTitle, fontSize: 22, fontWeight: 800, color: t.textPrimary, lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: t.textDimmed },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: t.textMuted, flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? `${t.danger}22` : status === "hoje_pre" ? `${t.accent}15` : status === "futuro" ? `${t.success}15` : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textDisabled,
    border: `1px solid ${status === "ao_vivo" ? `${t.danger}44` : status === "hoje_pre" ? `${t.accent}33` : status === "futuro" ? `${t.success}44` : t.border}`,
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
  permissividadeTag: (ativo) => ({ display: "inline-block", background: ativo ? `${t.success}15` : t.bgCard, border: `1px solid ${ativo ? `${t.success}55` : t.border}`, color: ativo ? t.success : t.textDisabled, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600 }),
  permissividadeAlert: { display: "flex", gap: 14, alignItems: "flex-start", background: `${t.success}08`, border: `1px solid ${t.success}55`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 },
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
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: t.fontTitle, letterSpacing: 1, background: ativo ? t.bgHover : "transparent", color: ativo ? t.accent : t.textDisabled, border: `1px solid ${ativo ? `${t.accent}44` : t.border}` }),
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

function TelaGerenciarUsuarios() {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { gerarSenhaTemp } = useAuth();
  const { equipes, atletas, adicionarAtleta } = useEvento();
  const { setTela, organizadores, atletasUsuarios, funcionarios, adicionarOrganizador, editarOrganizadorAdmin, editarEquipeAdmin, adicionarAtletaUsuario, editarAtletaUsuarioAdmin, excluirOrganizador, excluirEquipeUsuario, excluirAtletaUsuario, excluirAtletaPorUsuario } = useApp();
  const adicionarEquipe = useEvento().adicionarEquipe;
  const confirmar = useConfirm();
  const [tipoUsuario, setTipoUsuario] = useState("organizadores"); // organizadores | equipes | atletas
  const [modo, setModo] = useState("lista"); // lista | novo | editar
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", tipo: "organizador", entidade: "", cnpj: "", fone: "", equipeId: "", cpf: "", dataNasc: "", sexo: "M", organizadorId: "", cidade: "", estado: "" });
  const [erros, setErros] = useState({});
  const [filtro, setFiltro] = useState("");
  const [filtroOrgUsuario, setFiltroOrgUsuario] = useState("");
  const [perfilExistente, setPerfilExistente] = useState(null); // perfil já cadastrado com mesmo CPF/CNPJ

  // Detectar perfil existente ao digitar CPF ou CNPJ
  const handleDocChange = (campo, valor) => {
    setForm(f => ({ ...f, [campo]: valor }));
    setPerfilExistente(null);
    const limpo = valor.replace(/\D/g, "");
    if (campo === "cpf" && limpo.length >= 11) {
      const found = [...(atletasUsuarios||[]), ...(funcionarios||[]), ...[]].find(u => u.cpf && u.cpf.replace(/\D/g,"") === limpo);
      if (found) setPerfilExistente({ ...found, _store: "atleta" });
    }
    if (campo === "cnpj" && limpo.length >= 14) {
      const found = [...(organizadores||[]), ...(equipes||[])].find(u => u.cnpj && u.cnpj.replace(/\D/g,"") === limpo);
      if (found) setPerfilExistente({ ...found, _store: found.entidade !== undefined ? "organizador" : "equipe" });
    }
  };

  const getTodosUsuarios = () => {
    if (tipoUsuario === "organizadores") return organizadores;
    if (tipoUsuario === "equipes") return equipes;
    if (tipoUsuario === "atletas") {
      // Apenas atletas com login (atletasUsuarios)
      return atletasUsuarios.map(au => ({ ...au, _temConta: true }));
    }
    return [];
  };

  const usuariosFiltrados = getTodosUsuarios().filter(u => {
    if (filtroOrgUsuario && (tipoUsuario === "equipes" || tipoUsuario === "atletas")) {
      if ((u.organizadorId || "") !== filtroOrgUsuario) return false;
    }
    if (filtro === "") return true;
    const filtroLow = filtro.toLowerCase();
    const filtroDigitos = filtro.replace(/\D/g, '');
    return u.nome?.toLowerCase().includes(filtroLow) ||
      u.email?.toLowerCase().includes(filtroLow) ||
      (filtroDigitos && u.cpf?.replace(/\D/g, '').includes(filtroDigitos)) ||
      (filtroDigitos && u.cnpj?.replace(/\D/g, '').includes(filtroDigitos)) ||
      u.sigla?.toLowerCase().includes(filtroLow);
  });

  const validar = () => {
    const e = {};
    if (!form.nome) e.nome = "Nome é obrigatório";
    // Email obrigatório apenas se não há perfil existente com email
    if (!form.email && !(perfilExistente?.email)) e.email = "E-mail é obrigatório";
    if (modo === "novo" && !form.senha && !perfilExistente) e.senha = "Senha é obrigatória";
    if (tipoUsuario === "organizadores" && !form.cnpj) e.cnpj = "CNPJ é obrigatório";
    else if (tipoUsuario === "organizadores" && form.cnpj && !validarCNPJ(form.cnpj)) e.cnpj = "CNPJ inválido";
    if (tipoUsuario === "equipes" && !form.cnpj) e.cnpj = "CNPJ é obrigatório";
    else if (tipoUsuario === "equipes" && form.cnpj && !validarCNPJ(form.cnpj)) e.cnpj = "CNPJ inválido";
    if (tipoUsuario === "atletas" && !form.dataNasc) e.dataNasc = "Data de nascimento é obrigatória";
    if (tipoUsuario === "atletas" && form.cpf && !validarCPF(form.cpf)) e.cpf = "CPF inválido";
    if ((tipoUsuario === "equipes" || tipoUsuario === "atletas") && !form.organizadorId) e.organizadorId = "Selecione o organizador responsável";
    
    // Email duplicado: ignorar se é o próprio perfil existente
    const emailVerificar = form.email || perfilExistente?.email || "";
    const jaExiste = emailVerificar && getTodosUsuarios().some(u =>
      u.email?.toLowerCase() === emailVerificar.toLowerCase() &&
      u.id !== usuarioSelecionado?.id &&
      u.id !== perfilExistente?.id
    );
    if (jaExiste) e.email = "E-mail já cadastrado em outra conta.";

    // Verificar duplicação de CPF (atletas)
    if (tipoUsuario === "atletas" && form.cpf && !e.cpf) {
      const cpfLimpo = form.cpf.replace(/\D/g, "");
      if (cpfLimpo.length === 11) {
        const cpfDup = [...(atletasUsuarios||[]), ...(atletas||[])].find(u =>
          u.cpf?.replace(/\D/g, "") === cpfLimpo &&
          u.id !== usuarioSelecionado?.id &&
          u.id !== perfilExistente?.id
        );
        if (cpfDup) e.cpf = "CPF já cadastrado no sistema.";
      }
    }

    // Verificar duplicação de CNPJ (organizadores/equipes)
    if ((tipoUsuario === "organizadores" || tipoUsuario === "equipes") && form.cnpj && !e.cnpj) {
      const cnpjLimpo = form.cnpj.replace(/\D/g, "");
      if (cnpjLimpo.length === 14) {
        const cnpjDup = [...(organizadores||[]), ...(equipes||[])].find(u =>
          u.cnpj?.replace(/\D/g, "") === cnpjLimpo &&
          u.id !== usuarioSelecionado?.id &&
          u.id !== perfilExistente?.id
        );
        if (cnpjDup) e.cnpj = "CNPJ já cadastrado no sistema.";
      }
    }

    return e;
  };

  const handleSalvar = async () => {
    const e = validar();
    if (Object.keys(e).length) { setErros(e); return; }

    if (modo === "novo") {
      // Criar conta Auth para novo usuário (se não reutilizando perfil existente)
      if (!perfilExistente && form.email && form.senha) {
        try {
          await createUserWithEmailAndPassword(secondaryAuth, form.email.trim(), form.senha);
          await firebaseSignOut(secondaryAuth).catch(() => {});
        } catch (authErr) {
          if (authErr.code !== "auth/email-already-in-use") {
            alert("Erro ao criar conta de login: " + authErr.message); return;
          }
        }
      }

      // Se há perfil existente: reutilizar ID, apenas adicionar novo vínculo/cargo. Sem campo senha.
      const baseUsuario = perfilExistente
        ? {
            ...perfilExistente,
            senha: undefined,
            nome: form.nome || perfilExistente.nome,
            email: form.email || perfilExistente.email,
            fone: form.fone || perfilExistente.fone || "",
          }
        : {
            nome: form.nome,
            email: form.email,
            id: genId(),
            status: "aprovado",
            dataCadastro: new Date().toISOString(),
          };

      if (tipoUsuario === "organizadores") {
        const payload = {
          ...baseUsuario,
          tipo: "organizador",
          entidade: form.entidade || baseUsuario.entidade || "",
          cnpj: formatarCNPJ(form.cnpj || baseUsuario.cnpj || ""),
          fone: form.fone || baseUsuario.fone || "",
          status: "aprovado",
        };
        // Se ID já existe como organizador: atualizar; senão: adicionar
        const jaOrg = (organizadores||[]).find(o => o.id === baseUsuario.id);
        jaOrg ? editarOrganizadorAdmin(payload) : adicionarOrganizador(payload);

      } else if (tipoUsuario === "equipes") {
        const payload = {
          ...baseUsuario,
          tipo: "equipe",
          status: "ativa",
          entidade: form.entidade || baseUsuario.entidade || "",
          cnpj: formatarCNPJ(form.cnpj || baseUsuario.cnpj || ""),
          organizadorId: form.organizadorId || "",
          equipeId: form.equipeId || null,
        };
        const jaEq = (equipes||[]).find(e => e.id === baseUsuario.id);
        jaEq ? editarEquipeAdmin(payload) : adicionarEquipe(payload);

      } else if (tipoUsuario === "atletas") {
        const atletaUserId = baseUsuario.id;
        const payload = {
          ...baseUsuario,
          tipo: "atleta",
          cpf: form.cpf || baseUsuario.cpf || "",
          fone: form.fone || baseUsuario.fone || "",
          dataNasc: form.dataNasc || baseUsuario.dataNasc || "",
          sexo: form.sexo || baseUsuario.sexo || "M",
          organizadorId: form.organizadorId || "",
          status: "aprovado",
        };
        const jaAtl = (atletasUsuarios||[]).find(a => a.id === baseUsuario.id);
        jaAtl ? atualizarAtletaUsuario(payload) : adicionarAtletaUsuario(payload);
        // Criar/atualizar registro base de atleta
        const atletaBase = atletas?.find(a =>
          a.atletaUsuarioId === atletaUserId ||
          (a.cpf && form.cpf && a.cpf.replace(/\D/g,"") === form.cpf.replace(/\D/g,""))
        );
        if (!atletaBase) {
          try {
            await adicionarAtleta({
              id: (Date.now() + 1).toString(),
              atletaUsuarioId: atletaUserId,
              nome: form.nome,
              email: form.email || baseUsuario.email || "",
              cpf: form.cpf || "",
              fone: form.fone || "",
              dataNasc: form.dataNasc || "",
              anoNasc: form.dataNasc ? form.dataNasc.split("-")[0] : "",
              sexo: form.sexo || "M",
              cbat: "",
              clube: "",
              equipeId: null,
              organizadorId: form.organizadorId || "",
              cadastradoPor: "admin",
              dataCadastro: new Date().toISOString(),
            });
          } catch (err) {
            alert(err.message);
          }
        }
      }

      alert(perfilExistente
        ? `Perfil existente vinculado com sucesso!\nAs credenciais de acesso foram mantidas.`
        : `Usuário criado com sucesso!`);
    } else if (modo === "editar" && usuarioSelecionado) {
      const { senha: _s, ...semSenha } = usuarioSelecionado;
      const dadosEditados = {
        ...semSenha,
        nome: form.nome,
        email: form.email,
        entidade: form.entidade || "",
        cnpj: formatarCNPJ(form.cnpj || ""),
        fone: form.fone || "",
        equipeId: form.equipeId || usuarioSelecionado.equipeId || null,
        cpf: form.cpf || "",
        dataNasc: form.dataNasc || "",
        sexo: form.sexo || "M",
        organizadorId: form.organizadorId || "",
        cidade: form.cidade || "",
        estado: form.estado || "",
      };

      // Se email mudou, criar nova conta Auth com o novo email
      const emailAntigo = (usuarioSelecionado.email || "").trim().toLowerCase();
      const emailNovo = (form.email || "").trim().toLowerCase();
      let authAviso = "";
      if (emailNovo && emailNovo !== emailAntigo) {
        try {
          const senhaTemp = gerarSenhaTemp ? gerarSenhaTemp() : Math.random().toString(36).slice(2, 10);
          await createUserWithEmailAndPassword(secondaryAuth, emailNovo, senhaTemp);
          await firebaseSignOut(secondaryAuth).catch(() => {});
          dadosEditados.senhaTemporaria = true;
          authAviso = `\n\nNovo email Auth criado. Senha temporária: ${senhaTemp}\nO usuário deve trocar no primeiro acesso.`;
        } catch (authErr) {
          if (authErr.code === "auth/email-already-in-use") {
            authAviso = "\n\nO novo email já possui conta Auth — o usuário deve usar a senha existente.";
          } else {
            authAviso = `\n\nAviso: não foi possível criar conta Auth para o novo email (${authErr.code}).`;
          }
        }
        // Deletar conta Auth antiga via Cloud Function
        if (emailAntigo) {
          try {
            const deleteAuthUser = httpsCallable(functions, "deleteAuthUser");
            await deleteAuthUser({ email: emailAntigo });
          } catch (err) {
            console.warn("[GerenciarUsuarios] Não foi possível deletar conta Auth antiga:", err.message);
            alert(`Atenção: a conta Auth antiga (${emailAntigo}) não foi excluída automaticamente.\nExclua manualmente em Gerenciar Usuários > Contas Órfãs.\n\nMotivo: ${err.message}`);
          }
        }
      }

      if (tipoUsuario === "organizadores") {
        editarOrganizadorAdmin(dadosEditados);
      } else if (tipoUsuario === "equipes") {
        editarEquipeAdmin(dadosEditados);
      } else if (tipoUsuario === "atletas") {
        editarAtletaUsuarioAdmin(dadosEditados);
      }
      alert(`Usuário "${dadosEditados.nome}" atualizado com sucesso!${authAviso}`);
    }

    setModo("lista");
    setForm({ nome: "", email: "", senha: "", tipo: "organizador", entidade: "", cnpj: "", fone: "", equipeId: "", cpf: "", dataNasc: "", sexo: "M", organizadorId: "", cidade: "", estado: "" });
    setUsuarioSelecionado(null);
    setErros({});
    setPerfilExistente(null);
  };

  const handleEditar = (usuario) => {
    setUsuarioSelecionado(usuario);
    setForm({
      nome: usuario.nome || "",
      email: usuario.email || "",
      senha: "",
      entidade: usuario.entidade || "",
      cnpj: usuario.cnpj || "",
      fone: usuario.fone || "",
      equipeId: usuario.equipeId || "",
      cpf: usuario.cpf || "",
      dataNasc: usuario.dataNasc || "",
      sexo: usuario.sexo || "M",
      organizadorId: usuario.organizadorId || "",
      cidade: usuario.cidade || "",
      estado: usuario.estado || "",
    });
    setModo("editar");
  };

  const handleExcluir = async (id) => { 
    const usuario = getTodosUsuarios().find(u => u.id === id);
    if (!await confirmar(`Excluir usuário "${usuario?.nome }"?\n\nEsta ação é IRREVERSÍVEL!`)) return;
    
    if (tipoUsuario === "organizadores") {
      alert("Organizadores devem ser excluídos pela aba Licenças no painel Admin.\n\nIsso garante backup dos dados e exclusão completa de todos os vínculos (eventos, equipes, atletas, etc.).");
      return;
    } else if (tipoUsuario === "equipes") {
      excluirEquipeUsuario(id);
    } else if (tipoUsuario === "atletas") {
      excluirAtletaUsuario(id);
      // Remove também o registro base vinculado em atletas
      if (usuario) {
        excluirAtletaPorUsuario(id, usuario);
      }
    }
    
    alert(`Usuário "${usuario?.nome}" excluído com sucesso!`);
  };

  // ── Paginação usuários ─────────────────────────────────────────────────────
  const { paginado: usuariosPag, infoPage: usuariosInfo } = usePagination(usuariosFiltrados, 10);


  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>Gerenciar Usuários</h1>
          <p style={{ color: t.textDimmed, fontSize: 14 }}>
            Criar, editar e excluir usuários do sistema
          </p>
        </div>
        <button style={s.btnGhost} onClick={() => setTela("admin")}>
          ← Voltar
        </button>
      </div>

      {/* Type selector */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button
          style={{
            ...s.btnSecondary,
            background: tipoUsuario === "organizadores" ? t.accentBorder : undefined,
            borderColor: tipoUsuario === "organizadores" ? t.accent : undefined
          }}
          onClick={async () => { setTipoUsuario("organizadores"); setModo("lista"); setFiltroOrgUsuario(""); }}
        >
          Organizadores ({organizadores.length})
        </button>
        <button
          style={{
            ...s.btnSecondary,
            background: tipoUsuario === "equipes" ? t.accentBorder : undefined,
            borderColor: tipoUsuario === "equipes" ? t.accent : undefined
          }}
          onClick={async () => { setTipoUsuario("equipes"); setModo("lista"); setFiltroOrgUsuario(""); }}
        >
          Equipes ({tipoUsuario === "equipes" ? getTodosUsuarios().length : equipes.length})
        </button>
        <button
          style={{
            ...s.btnSecondary,
            background: tipoUsuario === "atletas" ? t.accentBorder : undefined,
            borderColor: tipoUsuario === "atletas" ? t.accent : undefined
          }}
          onClick={async () => { setTipoUsuario("atletas"); setModo("lista"); setFiltroOrgUsuario(""); }}
        >
          Atletas ({tipoUsuario === "atletas" ? getTodosUsuarios().length : atletasUsuarios.length})
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button style={s.btnPrimary} onClick={() => setModo("novo")}>
          + {tipoUsuario === "organizadores" ? "Novo Organizador" : tipoUsuario === "equipes" ? "Nova Equipe" : "Novo Atleta"}
        </button>
        <input
          type="text"
          placeholder="Buscar usuário..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{ ...s.input, flex: 1 }}
        />
        {(tipoUsuario === "equipes" || tipoUsuario === "atletas") && (
          <select value={filtroOrgUsuario} onChange={e => setFiltroOrgUsuario(e.target.value)}
            style={{ ...s.input, width: "auto", minWidth: 200 }}>
            <option value="">Todos organizadores</option>
            {organizadores.filter(o => o.status === "aprovado").sort((a,b) => (a.entidade||a.nome||"").localeCompare(b.entidade||b.nome||"","pt-BR")).map(o => (
              <option key={o.id} value={o.id}>{o.entidade || o.nome}</option>
            ))}
          </select>
        )}
      </div>

      {/* Create/Edit form */}
      {modo !== "lista" && (
        <div style={{
          background: t.bgHeaderSolid,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: 32,
          marginBottom: 24,
          maxWidth: 600,
          margin: "0 auto 24px"
        }}>
          <h3 style={{ color: t.accent, marginBottom: 20 }}>
            {modo === "novo" 
              ? `${tipoUsuario === "organizadores" ? "Novo Organizador" : tipoUsuario === "equipes" ? "Nova Equipe" : "Novo Atleta"}` 
              : `Editar ${tipoUsuario === "organizadores" ? "Organizador" : tipoUsuario === "equipes" ? "Equipe" : "Atleta"}`}
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
              Nome Completo *
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Nome completo"
              style={{ ...s.input, borderColor: erros.nome ? t.danger : undefined }}
            />
            {erros.nome && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.nome}</div>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
              E-mail *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@exemplo.com"
              style={{ ...s.input, borderColor: erros.email ? t.danger : undefined }}
            />
            {erros.email && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.email}</div>}
          </div>

          {/* ── Banner: perfil já existente com mesmo CPF/CNPJ ── */}
          {perfilExistente && modo === "novo" && (
            <div style={{ background: `${t.success}08`, border: `2px solid ${t.success}66`, borderRadius: 10,
              padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>✓</span>
                <strong style={{ color: t.success, fontSize: 14 }}>Perfil encontrado — credenciais mantidas</strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px",
                fontSize: 13, color: t.textTertiary, marginBottom: 12 }}>
                <span><strong style={{ color: t.textPrimary }}>{perfilExistente.nome}</strong></span>
                <span>{perfilExistente.email || "—"}</span>
                {perfilExistente.entidade && <span>{perfilExistente.entidade}</span>}
                {perfilExistente.clube && <span>{perfilExistente.clube}</span>}
                {perfilExistente.cpf && <span>CPF: {perfilExistente.cpf}</span>}
                {perfilExistente.cnpj && <span>CNPJ: {perfilExistente.cnpj}</span>}
              </div>
              <div style={{ background: `${t.success}0a`, border: `1px solid ${t.success}44`, borderRadius: 6,
                padding: "8px 12px", fontSize: 12, color: t.success, lineHeight: 1.6 }}>
                Este documento já pertence a um usuário cadastrado.<br/>
                <strong>Não é necessário informar senha.</strong> Confirme os dados pessoais abaixo
                e preencha apenas o cargo/permissões para concluir.
              </div>
              <button style={{ marginTop: 10, background: `${t.success}15`, border: `1px solid ${t.success}66`,
                color: t.success, borderRadius: 6, padding: "7px 18px",
                cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                onClick={async () => {
                  setForm(f => ({
                    ...f,
                    nome: perfilExistente.nome || f.nome,
                    email: perfilExistente.email || f.email,
                    fone: perfilExistente.fone || f.fone,
                    dataNasc: perfilExistente.dataNasc || f.dataNasc,
                    sexo: perfilExistente.sexo || f.sexo,
                    cpf: perfilExistente.cpf || f.cpf,
                    cnpj: perfilExistente.cnpj || f.cnpj,
                  }));
                }}>
                Preencher com dados do perfil existente
              </button>
            </div>
          )}

          {/* Campo senha: ocultar quando há perfil existente no modo novo */}
          {!(perfilExistente && modo === "novo") && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
              Senha {modo === "editar" && "(deixe em branco para manter)"}
            </label>
            <input
              type="password"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              placeholder="Senha"
              style={{ ...s.input, borderColor: erros.senha ? t.danger : undefined }}
            />
            {erros.senha && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.senha}</div>}
          </div>
          )}

          {(tipoUsuario === "organizadores" || tipoUsuario === "equipes") && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                {tipoUsuario === "organizadores" ? "Entidade/Federação" : "Clube/Equipe"}
              </label>
              <input
                type="text"
                value={form.entidade}
                onChange={(e) => setForm({ ...form, entidade: e.target.value })}
                placeholder={tipoUsuario === "organizadores" ? "Nome da entidade" : "Nome do clube"}
                style={s.input}
              />
            </div>
          )}

          {tipoUsuario === "organizadores" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                CNPJ *
              </label>
              <input
                type="text"
                value={form.cnpj || ""}
                onChange={(e) => handleDocChange("cnpj", e.target.value)}
                placeholder="00.000.000/0001-00"
                style={{ ...s.input, borderColor: erros.cnpj ? t.danger : undefined }}
              />
              {erros.cnpj && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.cnpj}</div>}
            </div>
          )}

          {tipoUsuario === "organizadores" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>Cidade</label>
                <input type="text" value={form.cidade || ""} onChange={e => setForm({ ...form, cidade: e.target.value })} placeholder="Cidade" style={s.input} />
              </div>
              <div>
                <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>UF</label>
                <select style={s.input} value={form.estado || ""} onChange={e => setForm({ ...form, estado: e.target.value })}>
                  <option value="">—</option>
                  {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
          )}

          {tipoUsuario === "equipes" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                CNPJ *
              </label>
              <input
                type="text"
                value={form.cnpj || ""}
                onChange={(e) => handleDocChange("cnpj", e.target.value)}
                placeholder="00.000.000/0001-00"
                style={{ ...s.input, borderColor: erros.cnpj ? t.danger : undefined }}
              />
              {erros.cnpj && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.cnpj}</div>}
            </div>
          )}

          {tipoUsuario === "atletas" && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                  CPF
                </label>
                <input
                  type="text"
                  value={form.cpf || ""}
                  onChange={(e) => handleDocChange("cpf", e.target.value)}
                  placeholder="000.000.000-00"
                  style={s.input}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  value={form.dataNasc || ""}
                  onChange={(e) => setForm({ ...form, dataNasc: e.target.value })}
                  style={{ ...s.input, borderColor: erros.dataNasc ? t.danger : undefined }}
                />
                {erros.dataNasc && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.dataNasc}</div>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                  Sexo *
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  {[{ v: "M", l: "Masculino" }, { v: "F", l: "Feminino" }].map(opt => (
                    <button key={opt.v}
                      onClick={() => setForm({ ...form, sexo: opt.v })}
                      style={{
                        flex: 1, padding: "10px", borderRadius: 6, cursor: "pointer",
                        background: (form.sexo || "M") === opt.v ? `${t.success}11` : t.bgHeaderSolid,
                        border: `2px solid ${(form.sexo || "M") === opt.v ? t.accent : t.border}`,
                        color: (form.sexo || "M") === opt.v ? t.accent : t.textMuted,
                        fontWeight: 600, fontSize: 13,
                      }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                  Telefone
                </label>
                <input
                  type="text"
                  value={form.fone || ""}
                  onChange={(e) => setForm({ ...form, fone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  style={s.input}
                />
              </div>
            </>
          )}

          {(tipoUsuario === "equipes" || tipoUsuario === "atletas") && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                Organizador Responsável *
              </label>
              <select
                value={form.organizadorId || ""}
                onChange={(e) => setForm({ ...form, organizadorId: e.target.value })}
                style={{ ...s.input, borderColor: erros.organizadorId ? t.danger : undefined }}
              >
                <option value="">Selecione o organizador...</option>
                {organizadores?.filter(o => o.status === "aprovado").map(org => (
                  <option key={org.id} value={org.id}>{org.nome} - {org.entidade}</option>
                ))}
              </select>
              {erros.organizadorId && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.organizadorId}</div>}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button style={s.btnGhost} onClick={async () => {
              setModo("lista");
              setForm({ nome: "", email: "", senha: "", tipo: "organizador", entidade: "", cnpj: "", fone: "", equipeId: "", cpf: "", dataNasc: "", sexo: "M", organizadorId: "", cidade: "", estado: "" });
              setErros({});
            }}>
              Cancelar
            </button>
            <button style={s.btnPrimary} onClick={handleSalvar}>
              {modo === "novo" ? "✓ Criar Usuário" : "✓ Salvar Alterações"}
            </button>
          </div>
        </div>
      )}

      {/* Users list */}
      {modo === "lista" && (
        <div style={{ display: "grid", gap: 12, maxHeight:500, overflowY:"auto" }}>
        {usuariosPag.map((usuario) => (
          <div key={usuario.id} style={{
            background: t.bgHeaderSolid,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: 20,
            display: "flex",
            alignItems: "center",
            gap: 20
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: t.textPrimary, fontSize: 16, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                {usuario.nome}
                {usuario._atletaBase && (
                  <span style={{ fontSize: 10, background: `${t.accent}15`, color: t.accent, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                    Sem conta
                  </span>
                )}
                {usuario._temConta === true && tipoUsuario === "atletas" && (
                  <span style={{ fontSize: 10, background: `${t.success}15`, color: t.success, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                    Com login
                  </span>
                )}
              </div>
              <div style={{ color: t.textMuted, fontSize: 13 }}>
                {usuario.email || ""}
                {usuario.entidade && ` • ${usuario.entidade}`}
                {usuario.cpf && ` • ${usuario.cpf}`}
                {usuario.cnpj && ` • ${usuario.cnpj}`}
                {usuario.dataNasc && ` • ${(() => { const [y,m,d]=(usuario.dataNasc||"").split("-"); return d&&m&&y ? `${d}/${m}/${y}` : usuario.dataNasc; })()}`}
                {usuario.sexo && ` • ${usuario.sexo === "M" ? "Masc." : "Fem."}`}
              </div>
              <div style={{ color: t.textDimmed, fontSize: 12, marginTop: 4 }}>
                Status: <span style={{
                  color: usuario.status === "aprovado" || usuario.status === "ativa" ? t.success : t.accent
                }}>
                  {usuario.status || (usuario._atletaBase ? "cadastrado" : "—")}
                </span>
                {(() => {
                  const orgId = usuario.organizadorId;
                  if (!orgId) return null;
                  const org = organizadores.find(o => o.id === orgId);
                  return org ? (
                    <span style={{ marginLeft: 12 }}>
                      <span style={{ color: t.accent }}>{org.entidade || org.nome}</span>
                    </span>
                  ) : null;
                })()}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={s.btnSecondary}
                onClick={() => handleEditar(usuario)}
              >
                Editar
              </button>
              <button
                style={s.btnGhost}
                onClick={() => handleExcluir(usuario.id)}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}

        <PaginaControles {...usuariosInfo} />
        {usuariosFiltrados.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: t.textDimmed }}>
            <div style={{ marginBottom: 16 }}><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div>
            <div style={{ fontSize: 18 }}>Nenhum usuário encontrado</div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}



export default TelaGerenciarUsuarios;
