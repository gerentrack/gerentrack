import { usePagination, PaginaControles } from "../../lib/hooks/usePagination.jsx";
import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { validarCPF, validarCNPJ } from "../../shared/formatters/utils";

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

function TelaGerenciarUsuarios({ setTela, organizadores, equipes, atletasUsuarios, funcionarios, atletas, adicionarOrganizador, editarOrganizadorAdmin, adicionarEquipe, editarEquipeAdmin, adicionarAtletaUsuario, editarAtletaUsuarioAdmin, adicionarAtleta, excluirOrganizador, excluirEquipeUsuario, excluirAtletaUsuario, excluirAtletaPorUsuario }) {
  const confirmar = useConfirm();
  const [tipoUsuario, setTipoUsuario] = useState("organizadores"); // organizadores | equipes | atletas
  const [modo, setModo] = useState("lista"); // lista | novo | editar
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", tipo: "organizador", entidade: "", cnpj: "", fone: "", equipeId: "", cpf: "", dataNasc: "", sexo: "M", organizadorId: "" });
  const [erros, setErros] = useState({});
  const [filtro, setFiltro] = useState("");
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

  const usuariosFiltrados = getTodosUsuarios().filter(u =>
    filtro === "" ||
    u.nome?.toLowerCase().includes(filtro.toLowerCase()) ||
    u.email?.toLowerCase().includes(filtro.toLowerCase()) ||
    u.cpf?.replace(/\D/g, '').includes(filtro.replace(/\D/g, '')) ||
    u.cnpj?.replace(/\D/g, '').includes(filtro.replace(/\D/g, '')) ||
    u.sigla?.toLowerCase().includes(filtro.toLowerCase())
  );

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
    
    return e;
  };

  const handleSalvar = () => {
    const e = validar();
    if (Object.keys(e).length) { setErros(e); return; }

    if (modo === "novo") {
      // Se há perfil existente: reutilizar ID e senha, apenas adicionar novo vínculo/cargo
      const baseUsuario = perfilExistente
        ? {
            ...perfilExistente,
            nome: form.nome || perfilExistente.nome,
            email: form.email || perfilExistente.email,
            fone: form.fone || perfilExistente.fone || "",
            // mantém senha existente — não pede nova
          }
        : {
            nome: form.nome,
            email: form.email,
            senha: form.senha,
            id: genId(),
            status: "aprovado",
            dataCadastro: new Date().toISOString(),
          };

      if (tipoUsuario === "organizadores") {
        const payload = {
          ...baseUsuario,
          tipo: "organizador",
          entidade: form.entidade || baseUsuario.entidade || "",
          cnpj: form.cnpj || baseUsuario.cnpj || "",
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
          cnpj: form.cnpj || baseUsuario.cnpj || "",
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
          adicionarAtleta({
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
        }
      }

      alert(perfilExistente
        ? `✅ Perfil existente vinculado com sucesso!\nAs credenciais de acesso foram mantidas.`
        : `✅ Usuário criado com sucesso!`);
    } else if (modo === "editar" && usuarioSelecionado) {
      const dadosEditados = {
        ...usuarioSelecionado,
        nome: form.nome,
        email: form.email,
        entidade: form.entidade || "",
        cnpj: form.cnpj || "",
        fone: form.fone || "",
        equipeId: form.equipeId || usuarioSelecionado.equipeId || null,
        cpf: form.cpf || "",
        dataNasc: form.dataNasc || "",
        sexo: form.sexo || "M",
        organizadorId: form.organizadorId || "",
        ...(form.senha ? { senha: form.senha } : {}),
      };
      if (tipoUsuario === "organizadores") {
        editarOrganizadorAdmin(dadosEditados);
      } else if (tipoUsuario === "equipes") {
        editarEquipeAdmin(dadosEditados);
      } else if (tipoUsuario === "atletas") {
        editarAtletaUsuarioAdmin(dadosEditados);
      }
      alert(`✅ Usuário "${dadosEditados.nome}" atualizado com sucesso!`);
    }

    setModo("lista");
    setForm({ nome: "", email: "", senha: "", tipo: "organizador", entidade: "", cnpj: "", fone: "", equipeId: "", cpf: "", dataNasc: "", sexo: "M", organizadorId: "" });
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
    });
    setModo("editar");
  };

  const handleExcluir = async (id) => { 
    const usuario = getTodosUsuarios().find(u => u.id === id);
    if (!await confirmar(`⚠️ Excluir usuário "${usuario?.nome }"?\n\nEsta ação é IRREVERSÍVEL!`)) return;
    
    if (tipoUsuario === "organizadores") {
      excluirOrganizador(id);
    } else if (tipoUsuario === "equipes") {
      excluirEquipeUsuario(id);
    } else if (tipoUsuario === "atletas") {
      excluirAtletaUsuario(id);
      // Remove também o registro base vinculado em atletas
      if (usuario) {
        excluirAtletaPorUsuario(id, usuario);
      }
    }
    
    alert(`✅ Usuário "${usuario?.nome}" excluído com sucesso!`);
  };

  // ── Paginação usuários ─────────────────────────────────────────────────────
  const { paginado: usuariosPag, infoPage: usuariosInfo } = usePagination(usuariosFiltrados, 10);


  return (
    <div style={styles.page}>
      <div style={styles.painelHeader}>
        <div>
          <h1 style={styles.pageTitle}>👥 Gerenciar Usuários</h1>
          <p style={{ color: "#666", fontSize: 14 }}>
            Criar, editar e excluir usuários do sistema
          </p>
        </div>
        <button style={styles.btnGhost} onClick={() => setTela("admin")}>
          ← Voltar
        </button>
      </div>

      {/* Type selector */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button
          style={{
            ...styles.btnSecondary,
            background: tipoUsuario === "organizadores" ? "#1976D233" : undefined,
            borderColor: tipoUsuario === "organizadores" ? "#1976D2" : undefined
          }}
          onClick={async () => { setTipoUsuario("organizadores"); setModo("lista"); }}
        >
          🏢 Organizadores ({organizadores.length})
        </button>
        <button
          style={{
            ...styles.btnSecondary,
            background: tipoUsuario === "equipes" ? "#1976D233" : undefined,
            borderColor: tipoUsuario === "equipes" ? "#1976D2" : undefined
          }}
          onClick={async () => { setTipoUsuario("equipes"); setModo("lista"); }}
        >
          🏅 Equipes ({tipoUsuario === "equipes" ? getTodosUsuarios().length : equipes.length})
        </button>
        <button
          style={{
            ...styles.btnSecondary,
            background: tipoUsuario === "atletas" ? "#1976D233" : undefined,
            borderColor: tipoUsuario === "atletas" ? "#1976D2" : undefined
          }}
          onClick={async () => { setTipoUsuario("atletas"); setModo("lista"); }}
        >
          🏃 Atletas ({tipoUsuario === "atletas" ? getTodosUsuarios().length : atletasUsuarios.length})
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button style={styles.btnPrimary} onClick={() => setModo("novo")}>
          + {tipoUsuario === "organizadores" ? "Novo Organizador" : tipoUsuario === "equipes" ? "Nova Equipe" : "Novo Atleta"}
        </button>
        <input
          type="text"
          placeholder="🔍 Buscar usuário..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{ ...styles.input, flex: 1 }}
        />
      </div>

      {/* Create/Edit form */}
      {modo !== "lista" && (
        <div style={{
          background: "#0D0E12",
          border: "1px solid #1E2130",
          borderRadius: 12,
          padding: 32,
          marginBottom: 24,
          maxWidth: 600,
          margin: "0 auto 24px"
        }}>
          <h3 style={{ color: "#1976D2", marginBottom: 20 }}>
            {modo === "novo" 
              ? `➕ ${tipoUsuario === "organizadores" ? "Novo Organizador" : tipoUsuario === "equipes" ? "Nova Equipe" : "Novo Atleta"}` 
              : `✏️ Editar ${tipoUsuario === "organizadores" ? "Organizador" : tipoUsuario === "equipes" ? "Equipe" : "Atleta"}`}
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>
              Nome Completo *
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Nome completo"
              style={{ ...styles.input, borderColor: erros.nome ? "#ff6b6b" : undefined }}
            />
            {erros.nome && <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 4 }}>{erros.nome}</div>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>
              E-mail *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@exemplo.com"
              style={{ ...styles.input, borderColor: erros.email ? "#ff6b6b" : undefined }}
            />
            {erros.email && <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 4 }}>{erros.email}</div>}
          </div>

          {/* ── Banner: perfil já existente com mesmo CPF/CNPJ ── */}
          {perfilExistente && modo === "novo" && (
            <div style={{ background: "#0a1a0a", border: "2px solid #4a8a2a", borderRadius: 10,
              padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <strong style={{ color: "#7acc44", fontSize: 14 }}>Perfil encontrado — credenciais mantidas</strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px",
                fontSize: 13, color: "#aaa", marginBottom: 12 }}>
                <span>👤 <strong style={{ color: "#fff" }}>{perfilExistente.nome}</strong></span>
                <span>📧 {perfilExistente.email || "—"}</span>
                {perfilExistente.entidade && <span>🏛️ {perfilExistente.entidade}</span>}
                {perfilExistente.clube && <span>🏟️ {perfilExistente.clube}</span>}
                {perfilExistente.cpf && <span>🪪 CPF: {perfilExistente.cpf}</span>}
                {perfilExistente.cnpj && <span>🪪 CNPJ: {perfilExistente.cnpj}</span>}
              </div>
              <div style={{ background: "#0d1a0d", border: "1px solid #4a8a2a44", borderRadius: 6,
                padding: "8px 12px", fontSize: 12, color: "#7acc44", lineHeight: 1.6 }}>
                ✅ Este documento já pertence a um usuário cadastrado.<br/>
                <strong>Não é necessário informar senha.</strong> Confirme os dados pessoais abaixo
                e preencha apenas o cargo/permissões para concluir.
              </div>
              <button style={{ marginTop: 10, background: "#1a2a1a", border: "1px solid #4a8a2a",
                color: "#7acc44", borderRadius: 6, padding: "7px 18px",
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
                📋 Preencher com dados do perfil existente
              </button>
            </div>
          )}

          {/* Campo senha: ocultar quando há perfil existente no modo novo */}
          {!(perfilExistente && modo === "novo") && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>
              Senha {modo === "editar" && "(deixe em branco para manter)"}
            </label>
            <input
              type="password"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              placeholder="Senha"
              style={{ ...styles.input, borderColor: erros.senha ? "#ff6b6b" : undefined }}
            />
            {erros.senha && <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 4 }}>{erros.senha}</div>}
          </div>
          )}

          {(tipoUsuario === "organizadores" || tipoUsuario === "equipes") && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>
                {tipoUsuario === "organizadores" ? "Entidade/Federação" : "Clube/Equipe"}
              </label>
              <input
                type="text"
                value={form.entidade}
                onChange={(e) => setForm({ ...form, entidade: e.target.value })}
                placeholder={tipoUsuario === "organizadores" ? "Nome da entidade" : "Nome do clube"}
                style={styles.input}
              />
            </div>
          )}

          {tipoUsuario === "organizadores" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>
                CNPJ *
              </label>
              <input
                type="text"
                value={form.cnpj || ""}
                onChange={(e) => handleDocChange("cnpj", e.target.value)}
                placeholder="00.000.000/0001-00"
                style={{ ...styles.input, borderColor: erros.cnpj ? "#ff6b6b" : undefined }}
              />
              {erros.cnpj && <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 4 }}>{erros.cnpj}</div>}
            </div>
          )}

          {tipoUsuario === "equipes" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>
                CNPJ *
              </label>
              <input
                type="text"
                value={form.cnpj || ""}
                onChange={(e) => handleDocChange("cnpj", e.target.value)}
                placeholder="00.000.000/0001-00"
                style={{ ...styles.input, borderColor: erros.cnpj ? "#ff6b6b" : undefined }}
              />
              {erros.cnpj && <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 4 }}>{erros.cnpj}</div>}
            </div>
          )}

          {tipoUsuario === "atletas" && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>
                  CPF
                </label>
                <input
                  type="text"
                  value={form.cpf || ""}
                  onChange={(e) => handleDocChange("cpf", e.target.value)}
                  placeholder="000.000.000-00"
                  style={styles.input}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  value={form.dataNasc || ""}
                  onChange={(e) => setForm({ ...form, dataNasc: e.target.value })}
                  style={{ ...styles.input, borderColor: erros.dataNasc ? "#ff6b6b" : undefined }}
                />
                {erros.dataNasc && <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 4 }}>{erros.dataNasc}</div>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>
                  Sexo *
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  {[{ v: "M", l: "Masculino" }, { v: "F", l: "Feminino" }].map(opt => (
                    <button key={opt.v}
                      onClick={() => setForm({ ...form, sexo: opt.v })}
                      style={{
                        flex: 1, padding: "10px", borderRadius: 6, cursor: "pointer",
                        background: (form.sexo || "M") === opt.v ? "#1a2a1a" : "#0D0E12",
                        border: `2px solid ${(form.sexo || "M") === opt.v ? "#1976D2" : "#1E2130"}`,
                        color: (form.sexo || "M") === opt.v ? "#1976D2" : "#888",
                        fontWeight: 600, fontSize: 13,
                      }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>
                  Telefone
                </label>
                <input
                  type="text"
                  value={form.fone || ""}
                  onChange={(e) => setForm({ ...form, fone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  style={styles.input}
                />
              </div>
            </>
          )}

          {(tipoUsuario === "equipes" || tipoUsuario === "atletas") && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>
                Organizador Responsável *
              </label>
              <select
                value={form.organizadorId || ""}
                onChange={(e) => setForm({ ...form, organizadorId: e.target.value })}
                style={{ ...styles.input, borderColor: erros.organizadorId ? "#ff6b6b" : undefined }}
              >
                <option value="">Selecione o organizador...</option>
                {organizadores?.filter(o => o.status === "aprovado").map(org => (
                  <option key={org.id} value={org.id}>{org.nome} - {org.entidade}</option>
                ))}
              </select>
              {erros.organizadorId && <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 4 }}>{erros.organizadorId}</div>}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button style={styles.btnGhost} onClick={async () => {
              setModo("lista");
              setForm({ nome: "", email: "", senha: "", tipo: "organizador", entidade: "", cnpj: "", fone: "", equipeId: "", cpf: "", dataNasc: "", sexo: "M", organizadorId: "" });
              setErros({});
            }}>
              Cancelar
            </button>
            <button style={styles.btnPrimary} onClick={handleSalvar}>
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
            background: "#0D0E12",
            border: "1px solid #1E2130",
            borderRadius: 8,
            padding: 20,
            display: "flex",
            alignItems: "center",
            gap: 20
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                {usuario.nome}
                {usuario._atletaBase && (
                  <span style={{ fontSize: 10, background: "#1a1500", color: "#1976D2", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                    Sem conta
                  </span>
                )}
                {usuario._temConta === true && tipoUsuario === "atletas" && (
                  <span style={{ fontSize: 10, background: "#0a2a0a", color: "#7cfc7c", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                    Com login
                  </span>
                )}
              </div>
              <div style={{ color: "#888", fontSize: 13 }}>
                {usuario.email ? `📧 ${usuario.email}` : ""}
                {usuario.entidade && ` • 🏢 ${usuario.entidade}`}
                {usuario.cpf && ` • 🪪 ${usuario.cpf}`}
                {usuario.cnpj && ` • 🏢 ${usuario.cnpj}`}
                {usuario.dataNasc && ` • 📅 ${(() => { const [y,m,d]=(usuario.dataNasc||"").split("-"); return d&&m&&y ? `${d}/${m}/${y}` : usuario.dataNasc; })()}`}
                {usuario.sexo && ` • ${usuario.sexo === "M" ? "Masc." : "Fem."}`}
              </div>
              <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                Status: <span style={{
                  color: usuario.status === "aprovado" || usuario.status === "ativa" ? "#7cfc7c" : "#1976D2"
                }}>
                  {usuario.status || (usuario._atletaBase ? "cadastrado" : "—")}
                </span>
                {(() => {
                  const orgId = usuario.organizadorId;
                  if (!orgId) return null;
                  const org = organizadores.find(o => o.id === orgId);
                  return org ? (
                    <span style={{ marginLeft: 12 }}>
                      📍 <span style={{ color: "#1976D2" }}>{org.entidade || org.nome}</span>
                    </span>
                  ) : null;
                })()}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={styles.btnSecondary}
                onClick={() => handleEditar(usuario)}
              >
                ✏️ Editar
              </button>
              <button
                style={styles.btnGhost}
                onClick={() => handleExcluir(usuario.id)}
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        ))}

        <PaginaControles {...usuariosInfo} />
        {usuariosFiltrados.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "#666" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>👥</div>
            <div style={{ fontSize: 18 }}>Nenhum usuário encontrado</div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}



export default TelaGerenciarUsuarios;
