import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { validarCPF, emailJaCadastrado } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import { Th, Td } from "../ui/TableHelpers";
import { secondaryAuth, createUserWithEmailAndPassword, signOut as firebaseSignOut, sendEmailVerification } from "../../firebase";
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
  btnIconSmDanger: { background: `${t.danger}12`, border: `1px solid ${t.danger}44`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
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

const PERMISSOES_TREINADOR = [
  { id:"ver_atletas",          grupo:"Atletas",      label:"Visualizar atletas" },
  { id:"cadastrar_atletas",    grupo:"Atletas",      label:"Cadastrar / editar atletas" },
  { id:"inscrever_atletas",    grupo:"Inscrições",   label:"Inscrever atletas" },
  { id:"gerenciar_inscricoes", grupo:"Inscrições",   label:"Gerenciar inscrições" },
  { id:"importar_atletas",     grupo:"Atletas",      label:"Importar atletas em lote" },
];

// Helper: destino do botão "Voltar" conforme tipo de usuário
const painelDestino = (u) =>
  (u?.tipo === "equipe" || u?.tipo === "treinador") ? "painel-equipe" : "painel";


function TelaTreinadores({ abaInicial } = {}) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { usuarioLogado, gerarSenhaTemp } = useAuth();
  const { equipes } = useEvento();
  const { setTela, treinadores, adicionarTreinador, atualizarTreinador, removerTreinador, registrarAcao, historicoAcoes, atletasUsuarios, funcionarios, organizadores } = useApp();
  const confirmar = useConfirm();

  const tipoUsr = usuarioLogado?.tipo;
  const isTreinador = tipoUsr === "treinador";
  const equipeId = isTreinador ? usuarioLogado.equipeId : usuarioLogado?.id;
  
  if (tipoUsr !== "equipe" && !isTreinador) return (
    <div style={s.page}><div style={s.emptyState}>
      <span style={{ fontSize: 48 }}>🚫</span>
      <p style={{ color: t.danger, fontWeight: 700 }}>Acesso restrito a equipes</p>
      <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
    </div></div>
  );

  const meusTreinadores = treinadores.filter(tr => tr.equipeId === equipeId);
  const meuHistorico = historicoAcoes.filter(h => h.equipeId === equipeId);
  const [buscaTrein, setBuscaTrein] = useState("");
  const [buscaHistT, setBuscaHistT] = useState("");

  const [aba, setAba]           = useState(abaInicial || "lista");
  const [editando, setEditando] = useState(null);
  const [senhaVis, setSenhaVis] = useState(null);
  const [form, setForm]         = useState(() => {
    if (gerarSenhaTemp) return { nome:"", email:"", cpf:"", cargo:"", permissoes:[], senha: gerarSenhaTemp() };
    return { nome:"", email:"", cpf:"", cargo:"", permissoes:[], senha:"" };
  });
  const [erros, setErros]       = useState({});
  const [feedback, setFeedback] = useState("");

  // Fluxo CPF existente → login → vincular
  const [docExistente, setDocExistente] = useState(null);
  const [docModo, setDocModo] = useState("novo");
  const [loginForm, setLoginForm] = useState({ email: "", senha: "" });
  const [loginErro, setLoginErro] = useState("");
  // Etapa 4: treinador duplicado no mesmo organizador
  const [treinDuplicadoOrg, setTreinDuplicadoOrg] = useState(null);

  const verificarCpfExistente = (cpf) => {
    if (editando) return;
    const limpo = cpf.replace(/\D/g, '');
    if (limpo.length < 11 || !validarCPF(limpo)) { setDocExistente(null); setDocModo("novo"); setTreinDuplicadoOrg(null); return; }

    // ── Etapa 4: treinador com mesmo CPF em outra equipe do mesmo organizador ──
    const minhaEquipe = equipes.find(e => e.id === equipeId);
    const meuOrgId = minhaEquipe?.organizadorId;
    if (meuOrgId) {
      const dupOrg = treinadores.find(tr =>
        tr.cpf && tr.cpf.replace(/\D/g, '') === limpo &&
        tr.equipeId !== equipeId && // diferente equipe
        equipes.find(e => e.id === tr.equipeId)?.organizadorId === meuOrgId // mesmo org
      );
      if (dupOrg) {
        const equipeAtual = equipes.find(e => e.id === dupOrg.equipeId);
        setTreinDuplicadoOrg({ treinador: dupOrg, equipeNome: equipeAtual?.nome || "outra equipe" });
        setDocExistente(null);
        setDocModo("novo");
        return;
      }
    }
    setTreinDuplicadoOrg(null);

    const buscar = (arr) => arr.find(i => i.cpf && i.cpf.replace(/\D/g, '') === limpo);
    const encontrado = buscar(treinadores) || buscar(equipes) || buscar(atletasUsuarios) || buscar(funcionarios);
    if (encontrado) {
      setDocExistente(encontrado);
      setDocModo("vincular");
    } else {
      setDocExistente(null);
      setDocModo("novo");
    }
  };

  const handleLoginExistente = () => {
    setLoginErro("");
    if (!loginForm.email || !loginForm.senha) { setLoginErro("Preencha e-mail e senha."); return; }
    const identNorm = loginForm.email.trim().toLowerCase();
    const cpfLimpo = form.cpf.replace(/\D/g, '');
    const buscar = (arr) => arr.find(i =>
      i.cpf && i.cpf.replace(/\D/g, '') === cpfLimpo &&
      i.email && i.email.toLowerCase() === identNorm &&
      i.senha === loginForm.senha
    );
    const match = buscar(treinadores) || buscar(equipes) || buscar(atletasUsuarios) || buscar(funcionarios);
    if (!match) { setLoginErro("E-mail ou senha incorretos para este CPF."); return; }
    setForm(prev => ({
      ...prev,
      nome: match.nome || prev.nome,
      email: match.email || prev.email,
      senha: match.senha || prev.senha,
    }));
    setDocModo("vincular");
  };

  const podeGerenciar = tipoUsr === "equipe" || 
    (isTreinador && usuarioLogado?.permissoes?.includes("cadastrar_atletas"));

  const abrirNovo = () => {
    setEditando(null);
    const senhaTemp = gerarSenhaTemp();
    setForm({ nome:"", email:"", cpf:"", cargo:"", permissoes:[], senha: senhaTemp });
    setErros({});
    setAba("novo");
  };

  const abrirEditar = (tr) => {
    setEditando(tr);
    setForm({ nome:tr.nome, email:tr.email, cpf:tr.cpf||"", cargo:tr.cargo||"", permissoes:tr.permissoes||[], senha:tr.senha });
    setErros({});
    setAba("novo");
  };

  const validar = () => {
    const e = {};
    if (!form.nome)  e.nome  = "Nome obrigatório";
    if (!form.email) e.email = "E-mail obrigatório";
    if (!editando && emailJaCadastrado(form.email, { atletasUsuarios, funcionarios, treinadores }))
      e.email = "E-mail já cadastrado em outra conta.";
    return e;
  };

  const handleSalvar = async () => {
    const e = validar();
    if (Object.keys(e).length) { setErros(e); return; }

    if (editando) {
      const { senha: _s, ...editandoSemSenha } = editando;
      const { senha: _s2, ...formSemSenha } = form;
      const atualizado = { ...editandoSemSenha, ...formSemSenha };
      atualizarTreinador(atualizado);
      registrarAcao(usuarioLogado.id, usuarioLogado.nome,
        "Editou treinador", `${form.nome} — permissões: ${form.permissoes.join(", ") || "nenhuma"}`,
        null, { equipeId, modulo: "treinadores" });
      setFeedback("✅ Treinador atualizado!");
    } else {
      // ── Etapa 4: dupla verificação de treinador no mesmo org ──
      if (form.cpf) {
        const cpfLimpo = form.cpf.replace(/\D/g, '');
        if (cpfLimpo.length >= 11) {
          const minhaEquipe = equipes.find(eq => eq.id === equipeId);
          const meuOrgId = minhaEquipe?.organizadorId;
          if (meuOrgId) {
            const dupOrg = treinadores.find(tr =>
              tr.cpf && tr.cpf.replace(/\D/g, '') === cpfLimpo &&
              tr.equipeId !== equipeId &&
              equipes.find(eq => eq.id === tr.equipeId)?.organizadorId === meuOrgId
            );
            if (dupOrg) {
              const eqNome = equipes.find(eq => eq.id === dupOrg.equipeId)?.nome || "outra equipe";
              setErros({ cpf: `Este CPF já é treinador da equipe "${eqNome}" no mesmo organizador.` });
              return;
            }
          }
        }
      }

      const novo = docExistente
        ? { ...docExistente, senha: undefined, tipo: "treinador", equipeId, organizadorId: equipes.find(eq => eq.id === equipeId)?.organizadorId || null,
            cargo: form.cargo || "", permissoes: form.permissoes || [], nome: form.nome || docExistente.nome,
            ativo: true, senhaTemporaria: docExistente.senhaTemporaria || false }
        : (() => { const { senha: _s, ...formSemSenha } = form; return { ...formSemSenha, id: genId(), equipeId, ativo: true, dataCadastro: new Date().toISOString(), senhaTemporaria: true }; })();
      // Criar no Firebase Auth apenas se for perfil novo
      if (!docExistente) {
        try {
          const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email.trim(), form.senha);
          try { await sendEmailVerification(cred.user); } catch {}
          await firebaseSignOut(secondaryAuth).catch(() => {});
        } catch (err) {
          if (err.code !== "auth/email-already-in-use") {
            setFeedback(`❌ Erro ao criar conta: ${err.message}`);
            setTimeout(() => setFeedback(""), 5000);
            return;
          }
        }
      }
      adicionarTreinador(novo);
      registrarAcao(usuarioLogado.id, usuarioLogado.nome,
        "Adicionou treinador", `${form.nome} (${form.email}) — cargo: ${form.cargo||"—"}`,
        null, { equipeId, modulo: "treinadores" });
      setFeedback(docExistente
        ? "✅ Treinador vinculado! Credenciais anteriores mantidas."
        : "✅ Treinador cadastrado! Senha temporária definida.");
    }
    setTimeout(() => { setFeedback(""); setTela(painelDestino(usuarioLogado)); }, 2000);
  };

  const handleToggleAtivo = (tr) => {
    atualizarTreinador({ ...tr, ativo: !tr.ativo });
    registrarAcao(usuarioLogado.id, usuarioLogado.nome,
      tr.ativo ? "Desativou treinador" : "Reativou treinador", tr.nome, null, { equipeId, modulo: "treinadores" });
  };

  const handleRemover = async (tr) => {
    if (!await confirmar(`Remover ${tr.nome } permanentemente?`)) return;
    removerTreinador(tr.id);
    registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Removeu treinador", tr.nome, null, { equipeId, modulo: "treinadores" });
  };

  const togglePerm = (pid) => {
    const perms = form.permissoes.includes(pid)
      ? form.permissoes.filter(p => p !== pid)
      : [...form.permissoes, pid];
    setForm({ ...form, permissoes: perms });
  };

  const grupos = [...new Set(PERMISSOES_TREINADOR.map(p => p.grupo))];

  const tabStyle = (id) => ({
    padding:"8px 20px", background: aba===id ? t.accent : t.bgHeaderSolid,
    color: aba===id ? "#000" : t.textTertiary, border:"1px solid",
    borderColor: aba===id ? t.accent : t.borderLight,
    borderRadius:6, cursor:"pointer", fontWeight: aba===id ? 700 : 400,
    fontSize:13, fontFamily:"Inter,sans-serif",
  });

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>👨‍🏫 {editando ? "Editar Treinador" : "Novo Treinador"}</h1>
        </div>
        <button style={s.btnGhost} onClick={() => setTela(painelDestino(usuarioLogado))}>← Voltar</button>
      </div>

      {feedback && (
        <div style={{ background:`${t.success}10`, border:`1px solid ${t.success}44`, borderRadius:6,
          padding:"10px 16px", marginBottom:16, color:t.success, fontSize:13 }}>
          {feedback}
        </div>
      )}

      {/* ── LISTA ─────────────────────────────────────────────────── */}
      {/* ── FORMULÁRIO NOVO / EDITAR ──────────────────────────────── */}
      {(aba === "novo" || aba === "lista") && (
        <div style={{ maxWidth:620 }}>

          {/* CPF primeiro — para verificar se já existe */}
          {!editando && (
            <div style={{ marginBottom: 16 }}>
              <FormField label="CPF" value={form.cpf} onChange={v => { setForm({...form,cpf:v}); verificarCpfExistente(v); }} placeholder="000.000.000-00" />

              {/* ── Etapa 4: Treinador duplicado no mesmo organizador ── */}
              {treinDuplicadoOrg && (
                <div style={{ background:`${t.danger}10`, border:`2px solid ${t.danger}`,
                  borderRadius:8, padding:"14px 16px", marginTop:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:18 }}>🚫</span>
                    <strong style={{ color:t.danger, fontSize:13 }}>Treinador já vinculado a outra equipe deste organizador</strong>
                  </div>
                  <div style={{ fontSize:13, color: t.textSecondary, marginBottom:8, lineHeight:1.6 }}>
                    <strong style={{ color: t.textPrimary }}>👤 {treinDuplicadoOrg.treinador.nome}</strong> já é treinador da equipe{" "}
                    <strong style={{ color:t.warning }}>"{treinDuplicadoOrg.equipeNome}"</strong> no mesmo organizador.
                  </div>
                  <div style={{ fontSize:12, color: t.textMuted, lineHeight:1.6 }}>
                    Um treinador não pode atuar em duas equipes do mesmo organizador simultaneamente.
                  </div>
                </div>
              )}

              {docModo === "vincular" && !treinDuplicadoOrg && (
                <div style={{ background: `${t.success}10`, border: `1px solid ${t.success}66`, borderRadius: 8, padding: "8px 12px", marginTop: 8, color: t.success, fontSize: 12 }}>
                  ✅ Perfil existente encontrado — credenciais mantidas. Complete cargo e permissões.
                </div>
              )}
            </div>
          )}

          {(docModo !== "login" || editando) && (
            <>
          <div style={s.grid2form}>
            <FormField label="Nome Completo *" value={form.nome} onChange={v=>setForm({...form,nome:v})} error={erros.nome} />
            <FormField label="Cargo / Função"  value={form.cargo} onChange={v=>setForm({...form,cargo:v})} placeholder="Ex: Treinador, Assistente, Preparador" />
            <FormField label="E-mail *"        value={form.email} onChange={v=>setForm({...form,email:v})} type="email" error={erros.email} />
            {editando && <FormField label="CPF" value={form.cpf} onChange={v=>setForm({...form,cpf:v})} placeholder="000.000.000-00" />}
            {docModo !== "vincular" && (
            <div>
              <label style={s.label}>Senha {editando ? "(deixe em branco para manter)" : "(gerada automaticamente)"}</label>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <input style={{ ...s.inputMarca, flex:1, fontFamily:"monospace", letterSpacing:2 }}
                  type={senhaVis === "form" ? "text" : "password"}
                  value={form.senha}
                  onChange={e => setForm({...form, senha:e.target.value})} />
                <button onClick={() => setSenhaVis(senhaVis==="form" ? null : "form")}
                  style={{ ...s.btnGhost, fontSize:12, padding:"6px 10px" }}>
                  {senhaVis==="form" ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            )}
          </div>

          {/* Permissões por grupo */}
          <div style={{ marginTop:20 }}>
            <label style={{ ...s.label, fontSize:13, marginBottom:10, display:"block" }}>
              🔐 Permissões de Acesso
            </label>
            {grupos.map(grupo => (
              <div key={grupo} style={{ marginBottom:14 }}>
                <div style={{ color: t.textDimmed, fontSize:11, fontWeight:700, textTransform:"uppercase",
                  letterSpacing:1, marginBottom:6 }}>{grupo}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {PERMISSOES_TREINADOR.filter(p => p.grupo === grupo).map(p => {
                    const ativo = form.permissoes.includes(p.id);
                    return (
                      <button key={p.id} onClick={() => togglePerm(p.id)}
                        style={{ padding:"6px 14px", borderRadius:6, cursor:"pointer",
                          fontSize:12, fontFamily:"Inter,sans-serif",
                          background: ativo ? `${t.success}18` : t.bgHeaderSolid,
                          border: `1px solid ${ativo ? t.success : t.borderLight}`,
                          color: ativo ? t.success : t.textDimmed,
                          fontWeight: ativo ? 700 : 400 }}>
                        {ativo ? "✓ " : ""}{p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:10, marginTop:24 }}>
            <button style={{ ...s.btnPrimary, opacity: treinDuplicadoOrg ? 0.4 : 1 }}
              onClick={handleSalvar} disabled={!!treinDuplicadoOrg}>
              {editando ? "💾 Salvar Alterações" : docModo === "vincular" ? "🔗 Vincular Treinador" : "✅ Cadastrar Treinador"}
            </button>
            <button style={s.btnGhost} onClick={() => setTela(painelDestino(usuarioLogado))}>Cancelar</button>
          </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}



export default TelaTreinadores;
