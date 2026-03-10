import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { validarCPF, emailJaCadastrado } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import { Th, Td } from "../ui/TableHelpers";
import { auth, createUserWithEmailAndPassword, signOut as firebaseSignOut } from "../../firebase";
const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

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

const PERMISSOES = [
  { id:"ver_competições",    grupo:"Competições",  label:"Visualizar competições" },
  { id:"editar_competições", grupo:"Competições",  label:"Criar / editar competições" },
  { id:"inscricoes",         grupo:"Competições",  label:"Gerenciar inscrições" },
  { id:"resultados",         grupo:"Resultados",   label:"Digitar resultados" },
  { id:"sumulas",            grupo:"Resultados",   label:"Gerenciar súmulas" },
  { id:"atletas",            grupo:"Atletas",      label:"Gerenciar atletas" },
  { id:"funcionarios_ver",   grupo:"Funcionários", label:"Visualizar funcionários" },
];

function TelaFuncionarios({ usuarioLogado, setTela, funcionarios, adicionarFuncionario,
  atualizarFuncionario, removerFuncionario, registrarAcao, gerarSenhaTemp,
  historicoAcoes, organizadores, equipes, atletasUsuarios, treinadores }) {
  const confirmar = useConfirm();

  const tipoUsr = usuarioLogado?.tipo;
  if (tipoUsr !== "organizador" && tipoUsr !== "admin") return (
    <div style={styles.page}><div style={styles.emptyState}>
      <span style={{ fontSize: 48 }}>🚫</span>
      <p style={{ color: "#ff6b6b", fontWeight: 700 }}>Acesso não autorizado</p>
      <button style={styles.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
    </div></div>
  );

  const orgId = usuarioLogado?.tipo === "funcionario"
    ? usuarioLogado.organizadorId
    : usuarioLogado?.id;

  const meusFuncionarios = funcionarios.filter(f => f.organizadorId === orgId);
  const meuHistorico     = historicoAcoes.filter(h => h.organizadorId === orgId);
  const [buscaFunc, setBuscaFunc] = useState("");
  const [buscaHist, setBuscaHist] = useState("");

  const [aba, setAba]         = useState("lista"); // lista | novo | historico
  const [editando, setEditando] = useState(null);
  const [senhaVis, setSenhaVis] = useState(null); // id do func com senha visível
  const [form, setForm]        = useState({
    nome:"", email:"", cpf:"", cargo:"", permissoes:[], senha:""
  });
  const [erros, setErros]      = useState({});
  const [feedback, setFeedback] = useState("");

  // Fluxo CPF existente → login → vincular
  const [docExistente, setDocExistente] = useState(null);
  const [docModo, setDocModo] = useState("novo"); // "novo" | "login" | "vincular"

  const verificarCpfExistente = (cpf) => {
    if (editando) return;
    const limpo = cpf.replace(/\D/g, '');
    if (limpo.length < 11 || !validarCPF(limpo)) { setDocExistente(null); setDocModo("novo"); return; }
    const buscar = (arr) => arr.find(i => i.cpf && i.cpf.replace(/\D/g, '') === limpo);
    const encontrado = buscar(funcionarios) || buscar(equipes) || buscar(atletasUsuarios) || buscar(treinadores);
    if (encontrado) {
      setDocExistente(encontrado);
      setDocModo("vincular");
      // Preencher automaticamente os dados do perfil encontrado
      setForm(prev => ({
        ...prev,
        nome: encontrado.nome || prev.nome,
        email: encontrado.email || prev.email,
        cpf: cpf,
        // mantém senha existente sem expor
        senha: encontrado.senha || prev.senha,
      }));
    } else {
      setDocExistente(null);
      setDocModo("novo");
    }
  };

  const podeGerenciar = usuarioLogado?.tipo === "organizador" ||
    usuarioLogado?.permissoes?.includes("funcionarios_ver");

  const abrirNovo = () => {
    setEditando(null);
    const senhaTemp = gerarSenhaTemp();
    setForm({ nome:"", email:"", cpf:"", cargo:"", permissoes:[], senha: senhaTemp });
    setErros({});
    setDocModo("novo"); setDocExistente(null);
    setAba("novo");
  };

  const abrirEditar = (f) => {
    setEditando(f);
    setForm({ nome:f.nome, email:f.email, cpf:f.cpf||"", cargo:f.cargo||"", permissoes:f.permissoes||[], senha:f.senha });
    setErros({});
    setAba("novo");
  };

  const validar = () => {
    const e = {};
    if (!form.nome)  e.nome  = "Nome obrigatório";
    if (!form.email) e.email = "E-mail obrigatório";
    if (!editando && !docExistente && emailJaCadastrado(form.email, { organizadores, equipes, atletasUsuarios, funcionarios, treinadores }))
      e.email = "E-mail já cadastrado em outra conta.";
    return e;
  };

  const handleSalvar = async () => {
    const e = validar();
    if (Object.keys(e).length) { setErros(e); return; }

    if (editando) {
      const atualizado = { ...editando, ...form };
      atualizarFuncionario(atualizado);
      registrarAcao(usuarioLogado.id, usuarioLogado.nome,
        "Editou funcionário", `${form.nome} — permissões: ${form.permissoes.join(", ") || "nenhuma"}`,
        orgId);
      setFeedback("✅ Funcionário atualizado!");
    } else {
      const novo = docExistente
        ? {
            // Perfil existente: preservar id, senha, email — só atualizar cargo/permissões
            ...docExistente,
            tipo: "funcionario",
            organizadorId: orgId,
            cargo: form.cargo || "",
            permissoes: form.permissoes || [],
            nome: form.nome || docExistente.nome,
            ativo: true,
            senhaTemporaria: docExistente.senhaTemporaria || false,
          }
        : {
            ...form,
            id: genId(),
            tipo: "funcionario",
            organizadorId: orgId,
            ativo: true,
            dataCadastro: new Date().toISOString(),
            senhaTemporaria: true,
          };

      // Criar no Firebase Auth apenas se for perfil novo
      if (!docExistente) {
        try {
          await createUserWithEmailAndPassword(auth, form.email.trim(), form.senha);
        } catch (err) { if (err.code !== "auth/email-already-in-use") { /* ok */ } }
        await firebaseSignOut(auth).catch(() => {});
      }
      adicionarFuncionario(novo);
      registrarAcao(usuarioLogado.id, usuarioLogado.nome,
        "Adicionou funcionário", `${novo.nome} (${novo.email}) — cargo: ${novo.cargo||"—"}`,
        orgId);
      setFeedback(docExistente
        ? "✅ Funcionário vinculado! Credenciais anteriores mantidas."
        : "✅ Funcionário cadastrado! Senha temporária definida.");
    }
    setTimeout(() => setFeedback(""), 3000);
    setAba("lista");
  };

  const handleToggleAtivo = (f) => {
    atualizarFuncionario({ ...f, ativo: !f.ativo });
    registrarAcao(usuarioLogado.id, usuarioLogado.nome,
      f.ativo ? "Desativou funcionário" : "Reativou funcionário", f.nome, orgId);
  };

  const handleRemover = async (f) => { 
    if (!await confirmar(`Remover ${f.nome } permanentemente?`)) return;
    removerFuncionario(f.id);
    registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Removeu funcionário", f.nome, orgId);
  };

  const togglePerm = (pid) => {
    const perms = form.permissoes.includes(pid)
      ? form.permissoes.filter(p => p !== pid)
      : [...form.permissoes, pid];
    setForm({ ...form, permissoes: perms });
  };

  const grupos = [...new Set(PERMISSOES.map(p => p.grupo))];

  const tabStyle = (id) => ({
    padding:"8px 20px", background: aba===id ? "#1976D2" : "#0D0E12",
    color: aba===id ? "#000" : "#aaa", border:"1px solid",
    borderColor: aba===id ? "#1976D2" : "#2a2d3a",
    borderRadius:6, cursor:"pointer", fontWeight: aba===id ? 700 : 400,
    fontSize:13, fontFamily:"Inter,sans-serif",
  });

  return (
    <div style={styles.page}>
      <div style={styles.painelHeader}>
        <div>
          <h1 style={styles.pageTitle}>👥 Funcionários</h1>
          <p style={{ color:"#aaa", margin:"4px 0 0" }}>
            Gerencie os acessos da sua equipe
          </p>
        </div>
        <div style={styles.painelBtns}>
          {podeGerenciar && <button style={styles.btnPrimary} onClick={abrirNovo}>+ Novo Funcionário</button>}
          <button style={styles.btnGhost} onClick={() => setTela("painel-organizador")}>← Voltar</button>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        <button style={tabStyle("lista")}    onClick={() => setAba("lista")}>📋 Funcionários</button>
        <button style={tabStyle("historico")} onClick={() => setAba("historico")}>📜 Histórico</button>
        {aba === "novo" && <button style={tabStyle("novo")}>{editando ? "✏️ Editar" : "➕ Novo"}</button>}
      </div>

      {feedback && (
        <div style={{ background:"#0a2a0a", border:"1px solid #2a5a2a", borderRadius:6,
          padding:"10px 16px", marginBottom:16, color:"#7cfc7c", fontSize:13 }}>
          {feedback}
        </div>
      )}

      {/* ── LISTA ─────────────────────────────────────────────────── */}
      {aba === "lista" && (
        meusFuncionarios.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize:48 }}>👥</span>
            <p>Nenhum funcionário cadastrado ainda.</p>
            {podeGerenciar && <button style={styles.btnPrimary} onClick={abrirNovo}>+ Adicionar Primeiro</button>}
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <input type="text" value={buscaFunc} onChange={e => setBuscaFunc(e.target.value)} placeholder="🔍 Buscar funcionário..." style={{ ...styles.input, padding:"6px 12px", fontSize:12, marginBottom:8, maxWidth:350 }} />
            <div style={{ maxHeight:320, overflowY:"auto" }}>
            <table style={styles.table}>
              <thead><tr>
                <Th>Nome</Th><Th>E-mail</Th><Th>Cargo</Th><Th>Permissões</Th><Th>Status</Th><Th>Cadastro</Th>
                {podeGerenciar && <Th>Ações</Th>}
              </tr></thead>
              <tbody>
                {meusFuncionarios.filter(f => {
                  if (!buscaFunc) return true;
                  const b = buscaFunc.toLowerCase();
                  return (f.nome||"").toLowerCase().includes(b) || (f.email||"").toLowerCase().includes(b) || (f.cargo||"").toLowerCase().includes(b);
                }).map(f => (
                  <tr key={f.id} style={{ ...styles.tr, opacity: f.ativo===false ? 0.45 : 1 }}>
                    <Td><strong style={{ color:"#fff" }}>{f.nome}</strong></Td>
                    <Td>{f.email}</Td>
                    <Td><span style={{ color:"#aaa", fontSize:12 }}>{f.cargo||"—"}</span></Td>
                    <Td>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                        {(f.permissoes||[]).length === 0
                          ? <span style={{ color:"#444", fontSize:11 }}>Sem permissões</span>
                          : (f.permissoes||[]).map(pid => {
                            const p = PERMISSOES.find(x => x.id === pid);
                            return p ? (
                              <span key={pid} style={{ background:"#1a2a1a", color:"#7cfc7c",
                                fontSize:10, padding:"2px 7px", borderRadius:3, fontWeight:600 }}>
                                {p.label}
                              </span>
                            ) : null;
                          })
                        }
                      </div>
                    </Td>
                    <Td>
                      <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:4,
                        background: f.ativo===false ? "#2a0a0a" : "#0a2a0a",
                        color: f.ativo===false ? "#ff6b6b" : "#7cfc7c" }}>
                        {f.ativo===false ? "Inativo" : "Ativo"}
                      </span>
                      {f.senhaTemporaria && (
                        <span style={{ fontSize:10, color:"#1976D2", display:"block", marginTop:2 }}>⚠️ Senha temp.</span>
                      )}
                    </Td>
                    <Td style={{ fontSize:11, color:"#555" }}>
                      {f.dataCadastro ? new Date(f.dataCadastro).toLocaleDateString("pt-BR") : "—"}
                    </Td>
                    {podeGerenciar && (
                      <Td>
                        <div style={{ display:"flex", gap:5 }}>
                          <button onClick={() => abrirEditar(f)}
                            style={{ ...styles.btnGhost, fontSize:11, padding:"3px 10px" }}>✏️</button>
                          <button onClick={() => handleToggleAtivo(f)}
                            style={{ ...styles.btnGhost, fontSize:11, padding:"3px 10px",
                              color: f.ativo===false ? "#7cfc7c" : "#ffaa44",
                              borderColor: f.ativo===false ? "#2a5a2a" : "#5a3a0a" }}>
                            {f.ativo===false ? "Ativar" : "Desativar"}
                          </button>
                          <button onClick={() => handleRemover(f)}
                            style={{ ...styles.btnGhost, fontSize:11, padding:"3px 10px",
                              color:"#ff6b6b", borderColor:"#5a1a1a" }}>🗑️</button>
                        </div>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )
      )}

      {/* ── FORMULÁRIO NOVO / EDITAR ──────────────────────────────── */}
      {aba === "novo" && (
        <div style={{ maxWidth:620 }}>
          <h2 style={styles.sectionTitle}>{editando ? "Editar Funcionário" : "Novo Funcionário"}</h2>

          {/* CPF primeiro — para verificar se já existe */}
          {!editando && (
            <div style={{ marginBottom: 16 }}>
              <FormField label="CPF" value={form.cpf} onChange={v => { setForm({...form,cpf:v}); verificarCpfExistente(v); }} placeholder="000.000.000-00" />

              {docModo === "vincular" && docExistente && (
                <div style={{ background: "#0a1a0a", border: "2px solid #4a8a2a", borderRadius: 10, padding: 14, marginTop: 8 }}>
                  <div style={{ color: "#7acc44", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>✅ Perfil encontrado — credenciais mantidas</div>
                  <div style={{ color: "#aaa", fontSize: 12, marginBottom: 4 }}>
                    👤 <strong style={{ color: "#fff" }}>{docExistente.nome}</strong>
                    {docExistente.email && <span style={{ marginLeft: 12 }}>📧 {docExistente.email}</span>}
                  </div>
                  <div style={{ background: "#0d1a0d", border: "1px solid #4a8a2a44", borderRadius: 6,
                    padding: "6px 10px", fontSize: 11, color: "#7acc44", lineHeight: 1.6 }}>
                    ✅ Dados carregados automaticamente. <strong>Não é necessário informar senha.</strong><br/>
                    Preencha apenas o cargo e as permissões para concluir.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Formulário completo */}
          {true && (
            <>
          <div style={styles.grid2form}>
            <FormField label="Nome Completo *" value={form.nome} onChange={v=>setForm({...form,nome:v})} error={erros.nome} />
            <FormField label="Cargo / Função"  value={form.cargo} onChange={v=>setForm({...form,cargo:v})} placeholder="Ex: Secretário, Cronometrista" />
            <FormField label="E-mail *"         value={form.email} onChange={v=>setForm({...form,email:v})} type="email" error={erros.email} />
            {editando && <FormField label="CPF" value={form.cpf} onChange={v=>setForm({...form,cpf:v})} placeholder="000.000.000-00" />}
            {docModo !== "vincular" && (
            <div>
              <label style={styles.label}>Senha {editando ? "(deixe em branco para manter)" : "(gerada automaticamente)"}</label>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <input style={{ ...styles.inputMarca, flex:1, fontFamily:"monospace", letterSpacing:2 }}
                  type={senhaVis === "form" ? "text" : "password"}
                  value={form.senha}
                  onChange={e => setForm({...form, senha:e.target.value})} />
                <button onClick={() => setSenhaVis(senhaVis==="form" ? null : "form")}
                  style={{ ...styles.btnGhost, fontSize:12, padding:"6px 10px" }}>
                  {senhaVis==="form" ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            )}
          </div>

          {/* Permissões por grupo */}
          <div style={{ marginTop:20 }}>
            <label style={{ ...styles.label, fontSize:13, marginBottom:10, display:"block" }}>
              🔐 Permissões de Acesso
            </label>
            {grupos.map(grupo => (
              <div key={grupo} style={{ marginBottom:14 }}>
                <div style={{ color:"#666", fontSize:11, fontWeight:700, textTransform:"uppercase",
                  letterSpacing:1, marginBottom:6 }}>{grupo}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {PERMISSOES.filter(p => p.grupo === grupo).map(p => {
                    const ativo = form.permissoes.includes(p.id);
                    return (
                      <button key={p.id} onClick={() => togglePerm(p.id)}
                        style={{ padding:"6px 14px", borderRadius:6, cursor:"pointer",
                          fontSize:12, fontFamily:"Inter,sans-serif",
                          background: ativo ? "#1a2a1a" : "#0D0E12",
                          border: `1px solid ${ativo ? "#7cfc7c" : "#2a2d3a"}`,
                          color: ativo ? "#7cfc7c" : "#666",
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
            <button style={styles.btnPrimary} onClick={handleSalvar}>
              {editando ? "💾 Salvar Alterações" : docModo === "vincular" ? "🔗 Vincular Funcionário" : "✅ Cadastrar Funcionário"}
            </button>
            <button style={styles.btnGhost} onClick={async () => { setAba("lista"); setDocModo("novo"); setDocExistente(null); }}>Cancelar</button>
          </div>
            </>
          )}
        </div>
      )}

      {/* ── HISTÓRICO ─────────────────────────────────────────────── */}
      {aba === "historico" && (
        <>
          <h2 style={styles.sectionTitle}>📜 Histórico de Ações</h2>
          {meuHistorico.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize:40 }}>📜</span>
              <p>Nenhuma ação registrada ainda.</p>
            </div>
          ) : (
            <div style={styles.tableWrap}>
              <input type="text" value={buscaHist} onChange={e => setBuscaHist(e.target.value)} placeholder="🔍 Buscar ação..." style={{ ...styles.input, padding:"6px 12px", fontSize:12, marginBottom:8, maxWidth:350 }} />
              <div style={{ maxHeight:320, overflowY:"auto" }}>
              <table style={styles.table}>
                <thead><tr>
                  <Th>Data / Hora</Th><Th>Usuário</Th><Th>Ação</Th><Th>Detalhe</Th>
                </tr></thead>
                <tbody>
                  {meuHistorico.filter(h => {
                    if (!buscaHist) return true;
                    const b = buscaHist.toLowerCase();
                    return (h.nomeUsuario||"").toLowerCase().includes(b) || (h.acao||"").toLowerCase().includes(b) || (h.detalhe||"").toLowerCase().includes(b);
                  }).map(h => (
                    <tr key={h.id} style={styles.tr}>
                      <Td style={{ fontSize:11, color:"#666", whiteSpace:"nowrap" }}>
                        {new Date(h.data).toLocaleString("pt-BR")}
                      </Td>
                      <Td><span style={{ color:"#1976D2", fontSize:12, fontWeight:600 }}>{h.nomeUsuario}</span></Td>
                      <Td><strong style={{ color:"#fff", fontSize:13 }}>{h.acao}</strong></Td>
                      <Td style={{ color:"#888", fontSize:12 }}>{h.detalhe||"—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}



export default TelaFuncionarios;
