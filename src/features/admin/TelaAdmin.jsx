import { usePagination, PaginaControles } from "../../lib/hooks/usePagination.jsx";
import { getStatus, getUsage, getCreditosDisponiveis, getEncerramento } from "../../shared/engines/planEngine";
import { PLANS } from "../../shared/constants/plans";
import { exportarDadosOrg, downloadCSVs } from "../../shared/engines/exportEngine";
import React, { useState, useMemo } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { _getLocalEventoDisplay, _getNascDisplay, validarCNPJ, validarCPF, emailJaCadastrado } from "../../shared/formatters/utils";
import { capitalizarNome } from "../../lib/utils/sanitize";
import { StatCard } from "../ui/StatCard";
import FormField from "../ui/FormField";
import { Th, Td } from "../ui/TableHelpers";
import { SinoNotificacoes } from "../ui/SinoNotificacoes";
import { auth, secondaryAuth, createUserWithEmailAndPassword, signOut as firebaseSignOut, sendPasswordResetEmail } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";
import { useAdminConfig } from "../../contexts/AdminConfigContext";

// ── Helpers ─────────────────────────────────────────────────────────────────
const badgeStatus = (s, t) => ({
  pendente: { bg:t.accentBg, color: t.accent, label:"Pendente" },
  aprovado: { bg:`${t.success}15`, color:t.success, label:"✓ Aprovado" },
  recusado: { bg:`${t.danger}15`, color: t.danger, label:"✗ Recusado" },
}[s] || { bg:t.bgHover, color: t.textMuted, label: s || "—" });

// ── Styles ───────────────────────────────────────────────────────────────────
function getStyles(t) {
  return {
  page:       { maxWidth:1200, margin:"0 auto", padding:"36px 24px 80px" },
  title:      { fontFamily: t.fontTitle, fontSize:34, fontWeight:800, color: t.textPrimary, letterSpacing:1, margin:0 },
  card:       { background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"20px 24px", marginBottom:20 },
  tableWrap:  { overflowX:"auto", borderRadius:10, border:`1px solid ${t.border}` },
  table:      { width:"100%", borderCollapse:"collapse" },
  tr:         { transition:"background 0.15s" },
  empty:      { textAlign:"center", padding:"40px 20px", color: t.textDisabled, display:"flex", flexDirection:"column", alignItems:"center", gap:12, fontSize:14 },
  btnPrimary: { background:`linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border:"none", padding:"9px 20px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily: t.fontTitle, letterSpacing:1, transition:"all 0.2s", whiteSpace:"nowrap" },
  btnSecondary:{ background:"transparent", color: t.accent, border:`2px solid ${t.accent}`, padding:"8px 18px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily: t.fontTitle, letterSpacing:1, whiteSpace:"nowrap" },
  btnGhost:   { background:"transparent", color: t.textMuted, border:`1px solid ${t.borderLight}`, padding:"8px 18px", borderRadius:8, cursor:"pointer", fontSize:13, fontFamily: t.fontBody, whiteSpace:"nowrap" },
  input:      { width:"100%", background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:7, padding:"9px 12px", color: t.textSecondary, fontSize:13, fontFamily: t.fontBody, outline:"none", marginBottom:4 },
  label:      { display:"block", fontSize:11, fontWeight:700, color: t.textDimmed, letterSpacing:1, marginBottom:5, textTransform:"uppercase" },
  sectionHd:  { fontFamily: t.fontTitle, fontSize:20, fontWeight:800, color: t.textPrimary, marginBottom:14 },

  // pendência card clicável
  pendCard: (color, bg, border) => ({
    display:"flex", alignItems:"center", gap:14, textAlign:"left",
    background:bg, border:`1px solid ${border}`, borderRadius:10,
    padding:"14px 18px", cursor:"pointer", transition:"all 0.15s",
    fontFamily: t.fontBody,
  }),

  // aba botão
  tab: (active) => ({
    flex:"1 1 auto",
    background: active ? t.bgInput : "transparent",
    borderWidth:0,
    borderBottomWidth: active ? 2 : 0,
    borderBottomStyle:"solid",
    borderBottomColor: active ? t.accent : "transparent",
    color: active ? t.accent : t.textDisabled,
    padding:"13px 10px",
    cursor:"pointer",
    fontSize:12,
    fontWeight: active ? 700 : 500,
    fontFamily: t.fontTitle,
    letterSpacing:0.5,
    transition:"all 0.15s",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    gap:5,
    whiteSpace:"nowrap",
  }),
};
}

// ── Component ────────────────────────────────────────────────────────────────
function TelaAdmin({ setHistoricoAcoes }) {
  const navigate = useNavigate();
  const { adminConfig, setAdminConfig } = useAdminConfig();
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { usuarioLogado, solicitacoesRecuperacao, resolverSolicitacaoRecuperacao, aplicarSenhaTemp, gerarSenhaTemp } = useAuth();
  const { equipes, atletas, inscricoes, eventos, selecionarEvento, excluirEvento, resultados, atualizarAtleta, excluirAtleta, eventoAtual, eventoAtualId } = useEvento();
  const { organizadores, adicionarOrganizador, aprovarOrganizador, recusarOrganizador, editarOrganizadorAdmin, excluirDadosOrganizador, exportarDados, importarDados, siteBranding, setSiteBranding, gtIcon, gtLogo, historicoAcoes, atletasUsuarios, funcionarios, treinadores, adicionarTreinador, atualizarTreinador, removerTreinador, setAtletaEditandoId, solicitacoesEquipe, aprovarEquipe, recusarEquipe, solicitacoesPortabilidade, resolverSolicitacaoPortabilidade, excluirSolicitacaoPortabilidade, registrarAcao, notificacoes, marcarNotifLida } = useApp();
  const confirmar = useConfirm();
  const pendOrg = organizadores.filter(o => o.status === "pendente");
  const pendRec = (solicitacoesRecuperacao || []).filter(sol => sol.status === "pendente");
  const pendEq  = (solicitacoesEquipe || []).filter(sol => sol.status === "pendente");
  const pendPort = (solicitacoesPortabilidade || []).filter(sol => sol.status === "pendente");
  const totalPend = pendOrg.length + pendRec.length + pendEq.length + pendPort.length;

  // Mapa equipeId → quantidade de atletas (O(n) uma vez, O(1) por equipe)
  const atletasPorEquipeId = useMemo(() => {
    const mapa = {};
    (atletas || []).forEach(a => {
      if (a.equipeId) mapa[a.equipeId] = (mapa[a.equipeId] || 0) + 1;
    });
    return mapa;
  }, [atletas]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [aba,       setAba]       = useState("visao-geral");
  const [buscaOrg,  setBuscaOrg]  = useState("");
  const [buscaComp, setBuscaComp] = useState("");
  const [filtroOrgComp, setFiltroOrgComp] = useState("");
  const [buscaEq,   setBuscaEq]   = useState("");
  const [filtroOrgEq, setFiltroOrgEq] = useState("");
  const [buscaAtl,  setBuscaAtl]  = useState("");
  const [filtroAtl, setFiltroAtl] = useState("todos");
  const [filtroOrgAtl, setFiltroOrgAtl] = useState("");
  const [filtroEqAtl, setFiltroEqAtl] = useState("");
  const [orgSel,    setOrgSel]    = useState({});
  const [buscaHist, setBuscaHist] = useState("");
  const [licencaEditId, setLicencaEditId] = useState(null);
  const [licencaForm, setLicencaForm] = useState({ plano: "", planoInicio: "", planoFim: "" });
  const [creditoForm, setCreditoForm] = useState({ orgId: null, descricao: "", eventoId: "" });
  const [suspenderForm, setSuspenderForm] = useState({ orgId: null, motivo: "inadimplencia" });
  const [modalTransf, setModalTransf] = useState(null); // { atleta }
  const [transfEquipeId, setTransfEquipeId] = useState("");
  const [buscaTrein, setBuscaTrein] = useState("");
  const [filtroOrgTrein, setFiltroOrgTrein] = useState("");
  const [filtroEqTrein, setFiltroEqTrein] = useState("");
  const [showTreinForm, setShowTreinForm] = useState(false);
  const [formTrein, setFormTrein] = useState({ nome:"", email:"", cpf:"", cargo:"", equipeId:"", permissoes:[] });
  const [errosTrein, setErrosTrein] = useState({});
  const [salvoTrein, setSalvoTrein] = useState("");
  const [treinDocExistente, setTreinDocExistente] = useState(null);
  const [editandoTrein, setEditandoTrein] = useState(null);

  // ── Guard (DEVE ficar APÓS todos os hooks para evitar "fewer hooks" error) ──
  if (usuarioLogado?.tipo !== "admin") return (
    <div style={s.page}><div style={s.empty}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={t.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
      <p style={{ color: t.danger, fontWeight:700 }}>Acesso restrito ao administrador</p>
      <button style={s.btnGhost} onClick={() => navigate("/")}>← Voltar</button>
    </div></div>
  );

  const PERMISSOES_TREINADOR = [
    { id:"ver_atletas",          grupo:"Atletas",      label:"Visualizar atletas" },
    { id:"cadastrar_atletas",    grupo:"Atletas",      label:"Cadastrar / editar atletas" },
    { id:"inscrever_atletas",    grupo:"Inscrições",   label:"Inscrever atletas" },
    { id:"gerenciar_inscricoes", grupo:"Inscrições",   label:"Gerenciar inscrições" },
    { id:"importar_atletas",     grupo:"Atletas",      label:"Importar atletas em lote" },
  ];
  const gruposPerm = [...new Set(PERMISSOES_TREINADOR.map(p => p.grupo))];
  const togglePermTrein = (pid) => {
    const perms = formTrein.permissoes.includes(pid)
      ? formTrein.permissoes.filter(p => p !== pid)
      : [...formTrein.permissoes, pid];
    setFormTrein({...formTrein, permissoes: perms});
  };

  const verificarCpfTrein = (cpf) => {
    const limpo = cpf.replace(/\D/g, "");
    if (limpo.length < 11 || !validarCPF(limpo)) { setTreinDocExistente(null); return; }
    const buscar = (arr) => arr.find(item => item.cpf && item.cpf.replace(/\D/g, "") === limpo);
    const encontrado = buscar(treinadores) || buscar(equipes) || buscar(atletasUsuarios) || buscar(funcionarios) || buscar(atletas);
    if (encontrado) {
      setTreinDocExistente(encontrado);
      setFormTrein(prev => ({ ...prev, nome: encontrado.nome || prev.nome, email: encontrado.email || prev.email }));
    } else {
      setTreinDocExistente(null);
    }
  };

  // Org form (hoisted — não pode ser useState dentro de IIFE)
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [senhasVisiveis, setSenhasVisiveis] = useState(new Set());
  const [resetFeedback, setResetFeedback] = useState({}); // { [solId]: "ok" | "erro" | "enviando" } // IDs de senhas reveladas
  const [formOrg,  setFormOrg]  = useState({ nome:"", email:"", senha:"", entidade:"", fone:"", cnpj:"", cidade:"", estado:"" });
  const [errosOrg, setErrosOrg] = useState({});
  const [salvoOrg, setSalvoOrg] = useState(false);

  const handleCriarOrg = async () => {
    const e = {};
    if (!formOrg.nome)     e.nome = "Nome obrigatório";
    if (!formOrg.email)    e.email = "E-mail obrigatório";
    if (formOrg.senha.length < 6) e.senha = "Mínimo 6 caracteres";
    if (!formOrg.entidade) e.entidade = "Entidade obrigatória";
    if (!formOrg.cnpj)     e.cnpj = "CNPJ obrigatório";
    else if (!validarCNPJ(formOrg.cnpj)) e.cnpj = "CNPJ inválido";
    if (emailJaCadastrado(formOrg.email, { organizadores, equipes, atletasUsuarios, funcionarios, treinadores })) e.email = "E-mail já cadastrado";
    if (organizadores.some(o => o.cnpj && formOrg.cnpj && o.cnpj.replace(/\D/g,"") === formOrg.cnpj.replace(/\D/g,""))) e.cnpj = "CNPJ já cadastrado";
    if (Object.keys(e).length) { setErrosOrg(e); return; }
    try {
      await createUserWithEmailAndPassword(secondaryAuth, formOrg.email.trim().toLowerCase(), formOrg.senha);
      await firebaseSignOut(secondaryAuth).catch(() => {});
    } catch (_) {}
    adicionarOrganizador({ ...formOrg, id:Date.now().toString(), status:"aprovado", dataCadastro:new Date().toISOString(), tipo:"organizador" });
    setFormOrg({ nome:"", email:"", senha:"", entidade:"", fone:"", cnpj:"", cidade:"", estado:"" });
    setErrosOrg({}); setSalvoOrg(true); setTimeout(() => setSalvoOrg(false), 3000); setShowOrgForm(false);
  };

  const handleCriarTrein = async () => {
    const e = {};
    if (!formTrein.nome) e.nome = "Nome obrigatório";
    if (!formTrein.email) e.email = "E-mail obrigatório";
    if (!formTrein.equipeId) e.equipeId = "Selecione a equipe";
    if (!formTrein.cpf || formTrein.cpf.replace(/\D/g, "").length < 11) { e.cpf = "CPF obrigatório"; }
    else {
      const cpfLimpo = formTrein.cpf.replace(/\D/g, "");
      if (!validarCPF(cpfLimpo)) e.cpf = "CPF inválido";
      if (!e.cpf && cpfLimpo.length >= 11) {
        const eqSel = equipes.find(eq => eq.id === formTrein.equipeId);
        const orgId = eqSel?.organizadorId;
        if (orgId) {
          const dup = treinadores.find(tr =>
            tr.cpf && tr.cpf.replace(/\D/g, "") === cpfLimpo &&
            tr.equipeId !== formTrein.equipeId &&
            equipes.find(eq => eq.id === tr.equipeId)?.organizadorId === orgId
          );
          if (dup) {
            const eqDup = equipes.find(eq => eq.id === dup.equipeId);
            e.cpf = `CPF já é treinador da equipe "${eqDup?.nome || "outra"}" no mesmo organizador`;
          }
        }
      }
    }
    if (!treinDocExistente && emailJaCadastrado(formTrein.email, { organizadores, equipes, atletasUsuarios, funcionarios, treinadores }))
      e.email = "E-mail já cadastrado em outra conta";
    if (Object.keys(e).length) { setErrosTrein(e); return; }

    const eqSel = equipes.find(eq => eq.id === formTrein.equipeId);
    const senhaTemp = gerarSenhaTemp();
    let authAviso = "";
    try {
      await createUserWithEmailAndPassword(secondaryAuth, formTrein.email.trim().toLowerCase(), senhaTemp);
      await firebaseSignOut(secondaryAuth).catch(() => {});
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        authAviso = "E-mail já possui conta Auth — treinador deve usar senha existente ou redefinir.";
      } else {
        setSalvoTrein(`Erro ao criar conta: ${err.message}`);
        setTimeout(() => setSalvoTrein(""), 5000);
        return;
      }
    }
    const novo = {
      ...(treinDocExistente ? { ...treinDocExistente, senha: undefined } : {}),
      id: treinDocExistente?.id || `${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      nome: capitalizarNome(formTrein.nome), email: formTrein.email || treinDocExistente?.email || "",
      cpf: formTrein.cpf || "", cargo: capitalizarNome(formTrein.cargo) || "", tipo: "treinador",
      equipeId: formTrein.equipeId, organizadorId: eqSel?.organizadorId || null,
      permissoes: formTrein.permissoes || [], ativo: true, dataCadastro: treinDocExistente?.dataCadastro || new Date().toISOString(),
      senhaTemporaria: !authAviso,
    };
    adicionarTreinador(novo);
    registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Criou treinador (admin)",
      `${formTrein.nome} (${formTrein.email}) → ${eqSel?.nome || formTrein.equipeId}`, null, { modulo: "admin" });
    const msg = authAviso
      ? (treinDocExistente ? `Treinador vinculado! ${authAviso}` : `${authAviso}`)
      : `Treinador criado! Senha temporária: ${senhaTemp}`;
    setSalvoTrein(msg);
    setFormTrein({ nome:"", email:"", cpf:"", cargo:"", equipeId:"", permissoes:[] }); setEditandoTrein(null);
    setErrosTrein({}); setTreinDocExistente(null); setShowTreinForm(false);
    setTimeout(() => setSalvoTrein(""), 10000);
  };

  const handleSalvarTreinEdit = () => {
    if (!editandoTrein) return;
    const atualizado = {
      ...editandoTrein,
      nome: formTrein.nome || editandoTrein.nome,
      email: formTrein.email || editandoTrein.email,
      cpf: formTrein.cpf || editandoTrein.cpf || "",
      cargo: formTrein.cargo || "",
      equipeId: formTrein.equipeId || editandoTrein.equipeId,
      permissoes: formTrein.permissoes || [],
    };
    atualizarTreinador(atualizado);
    registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Editou treinador (admin)",
      `${atualizado.nome} — permissões: ${(atualizado.permissoes || []).join(", ") || "nenhuma"}`, null, { modulo: "admin" });
    setSalvoTrein("Treinador atualizado!");
    setFormTrein({ nome:"", email:"", cpf:"", cargo:"", equipeId:"", permissoes:[] }); setEditandoTrein(null);
    setShowTreinForm(false);
    setTimeout(() => setSalvoTrein(""), 5000);
  };

  const abrirEditarTrein = (tr) => {
    setEditandoTrein(tr);
    setFormTrein({ nome:tr.nome||"", email:tr.email||"", cpf:tr.cpf||"", cargo:tr.cargo||"", equipeId:tr.equipeId||"", permissoes:tr.permissoes||[] });
    setErrosTrein({});
    setTreinDocExistente(null);
    setShowTreinForm(true);
  };

  // ── Tabs definition ────────────────────────────────────────────────────────
  const TABS = [
    { id:"visao-geral",   label:"Visão Geral",   badge: totalPend },
    { id:"organizadores", label:"Organizadores",  badge: pendOrg.length + pendRec.length, sub: organizadores.length },
    { id:"competicoes",   label:"Competições",    sub: eventos.length },
    { id:"equipes",       label:"Equipes",        badge: pendEq.length, sub: equipes.length },
    { id:"atletas",       label:"Atletas",        sub: atletas.length },
    { id:"treinadores",   label:"Treinadores", sub: treinadores.length },
    { id:"licencas",      label:"Licenças", sub: organizadores.filter(o => o.plano).length },
    { id:"historico",     label:"Histórico" },
    { id:"portabilidade", label:"Portabilidade", badge: pendPort.length },
  ];

  const si = { ...s.input, padding:"6px 12px", fontSize:12, marginBottom:10, maxWidth:400 };

  // ── Render ─────────────────────────────────────────────────────────────────
  // ── Paginação ──────────────────────────────────────────────────────────────
  const _atletasFiltrados = atletas.filter(a => {
    if (filtroAtl === "sem_equipe_usuario") {
      const temEquipe = !!a.equipeId;
      const temUsuario = !!a.atletaUsuarioId || atletasUsuarios.some(u => u.atletaId === a.id);
      if (temEquipe || temUsuario) return false;
    } else if (filtroAtl === "sem_equipe") {
      if (a.equipeId) return false;
    }
    if (filtroOrgAtl) {
      const eq = equipes.find(eq2 => eq2.id === a.equipeId);
      if ((a.organizadorId || eq?.organizadorId || "") !== filtroOrgAtl) return false;
    }
    if (filtroEqAtl) {
      if (a.equipeId !== filtroEqAtl) return false;
    }
    if (!buscaAtl) return true;
    const b = buscaAtl.toLowerCase();
    const eq = equipes.find(eq2 => eq2.id === a.equipeId);
    return (a.nome||"").toLowerCase().includes(b)||(eq?.nome||"").toLowerCase().includes(b);
  });
  const { paginado: atletasPag, infoPage: atletasInfo } = usePagination(_atletasFiltrados, 10);

  const _equipesFiltradas = [...equipes]
    .filter(eq => {
      if (filtroOrgEq && (eq.organizadorId || "") !== filtroOrgEq) return false;
      if (!buscaEq) return true;
      const b = buscaEq.toLowerCase();
      return (eq.nome||"").toLowerCase().includes(b)||(eq.sigla||"").toLowerCase().includes(b)||(eq.cidade||"").toLowerCase().includes(b);
    })
    .sort((a, b) => (a.nome||"").localeCompare(b.nome||"", "pt-BR"));
  const { paginado: equipesPag, infoPage: equipesInfo } = usePagination(_equipesFiltradas, 10);

  const _treinFiltrados = [...treinadores]
    .filter(tr => {
      if (filtroOrgTrein) {
        const eq = equipes.find(e => e.id === tr.equipeId);
        if ((eq?.organizadorId || "") !== filtroOrgTrein) return false;
      }
      if (filtroEqTrein && (tr.equipeId || "") !== filtroEqTrein) return false;
      if (!buscaTrein) return true;
      const b = buscaTrein.toLowerCase();
      return (tr.nome||"").toLowerCase().includes(b)||(tr.email||"").toLowerCase().includes(b)||(tr.cpf||"").includes(b);
    })
    .sort((a, b) => (a.nome||"").localeCompare(b.nome||"", "pt-BR"));
  const { paginado: treinPag, infoPage: treinInfo } = usePagination(_treinFiltrados, 10);

  const _orgFiltrados = [...organizadores]
    .filter(o => {
      if (!buscaOrg) return true;
      const b = buscaOrg.toLowerCase();
      return (o.nome||"").toLowerCase().includes(b)||(o.entidade||"").toLowerCase().includes(b);
    })
    .sort((a, b) => (a.nome||"").localeCompare(b.nome||"", "pt-BR"));
  const { paginado: orgPag, infoPage: orgInfo } = usePagination(_orgFiltrados, 10);

  const _compFiltradas = [...eventos]
    .filter(e => {
      if (filtroOrgComp && (e.organizadorId || "") !== filtroOrgComp) return false;
      if (!buscaComp) return true;
      const b = buscaComp.toLowerCase();
      return (e.nome||"").toLowerCase().includes(b)||(e.local||"").toLowerCase().includes(b);
    })
    .sort((a, b) => (a.data||"").localeCompare(b.data||""));
  const { paginado: compPag, infoPage: compInfo } = usePagination(_compFiltradas, 10);

  const _histFiltradas = (historicoAcoes || []).filter(h => {
    if (!buscaHist) return true;
    const b = buscaHist.toLowerCase();
    return (h.nomeUsuario||"").toLowerCase().includes(b)||(h.acao||"").toLowerCase().includes(b)||(h.detalhe||"").toLowerCase().includes(b);
  });
  const { paginado: histPag, infoPage: histInfo } = usePagination(_histFiltradas, 20);

  return (
    <div style={s.page}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:24 }}>
        <h1 style={s.title}>Administração</h1>
        <SinoNotificacoes
          notificacoes={notificacoes}
          usuarioId="admin"
          marcarNotifLida={marcarNotifLida}
        />
      </div>

      {/* ── TAB BAR ────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:12, overflow:"hidden", marginBottom:28, flexWrap:"wrap" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setAba(tab.id)} style={s.tab(aba === tab.id)}>
            {tab.label}
            {tab.sub != null && (
              <span style={{ fontSize:10, color: aba === tab.id ? `${t.accent}88` : t.textDisabled }}>({tab.sub})</span>
            )}
            {tab.badge > 0 && (
              <span style={{ background:"#c0392b", color: t.textPrimary, borderRadius:10, padding:"1px 6px", fontSize:10, fontWeight:800, minWidth:18, textAlign:"center" }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: VISÃO GERAL
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "visao-geral" && (
        <>
          {/* Último login admin */}
          {(() => {
            const ultimoLogin = (historicoAcoes || []).find(h => h.acao === "Login" && h.detalhe === "admin");
            const penultimoLogin = (historicoAcoes || []).filter(h => h.acao === "Login" && h.detalhe === "admin")[1];
            return penultimoLogin ? (
              <div style={{ ...s.card, borderColor: `${t.accent}33`, marginBottom: 16, padding: "12px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, marginBottom: 6 }}>ÚLTIMO ACESSO ANTERIOR</div>
                <div style={{ fontSize: 13, color: t.textSecondary }}>
                  {new Date(penultimoLogin.data).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                  {penultimoLogin.userAgent && (
                    <span style={{ color: t.textDimmed, fontSize: 11, marginLeft: 12 }}>
                      {penultimoLogin.userAgent.includes("Mobile") ? "Dispositivo móvel" : "Desktop"}
                      {penultimoLogin.plataforma && ` · ${penultimoLogin.plataforma}`}
                      {penultimoLogin.tela && ` · ${penultimoLogin.tela}`}
                    </span>
                  )}
                </div>
              </div>
            ) : null;
          })()}

          {/* Stats */}
          <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:24 }}>
            <StatCard value={eventos.length}       label="Competições" />
            <StatCard value={organizadores.length} label="Organizadores" />
            <StatCard value={equipes.length}       label="Equipes" />
            <StatCard value={atletas.length}       label="Atletas" />
            <StatCard value={inscricoes.length}    label="Inscrições" />
          </div>

          {/* Pendências urgentes */}
          {totalPend > 0 && (
            <div style={{ ...s.card, borderColor:"#c0392b44", marginBottom:20 }}>
              <div style={{ fontFamily: t.fontTitle, fontSize:16, fontWeight:800, color:"#c0392b", marginBottom:14, letterSpacing:1 }}>
                PENDÊNCIAS QUE REQUEREM ATENÇÃO
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:10 }}>
                {pendRec.length > 0 && (
                  <button onClick={() => setAba("organizadores")} style={s.pendCard(t.success,`${t.success}15`,`${t.success}44`)}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:t.success,flexShrink:0}}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                    <div>
                      <div style={{ fontWeight:700, color:t.success, fontSize:13 }}>{pendRec.length} recuperação(ões) de senha</div>
                      <div style={{ color: t.textDimmed, fontSize:11, marginTop:2 }}>Aguardando envio de senha temporária</div>
                    </div>
                    <span style={{ marginLeft:"auto", color:"#2a5a2a", fontSize:16 }}>→</span>
                  </button>
                )}
                {pendOrg.length > 0 && (
                  <button onClick={() => setAba("organizadores")} style={s.pendCard(t.accent,t.accentBg,`${t.accent}44`)}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:t.accent,flexShrink:0}}><path d="M3 21h18M3 7v1a3 3 0 006 0V7m0 0v1a3 3 0 006 0V7m0 0v1a3 3 0 006 0V7M3 7l9-4 9 4"/><path d="M6 12v5h12v-5"/></svg>
                    <div>
                      <div style={{ fontWeight:700, color: t.accent, fontSize:13 }}>{pendOrg.length} organizador(es) pendente(s)</div>
                      <div style={{ color: t.textDimmed, fontSize:11, marginTop:2 }}>Aguardando aprovação</div>
                    </div>
                    <span style={{ marginLeft:"auto", color:"#1a3a5a", fontSize:16 }}>→</span>
                  </button>
                )}
                {pendPort.length > 0 && (
                  <button onClick={() => setAba("portabilidade")} style={s.pendCard("#a855f7","#a855f711","#a855f744")}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"#a855f7",flexShrink:0}}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    <div>
                      <div style={{ fontWeight:700, color:"#a855f7", fontSize:13 }}>{pendPort.length} solicitação(ões) de portabilidade</div>
                      <div style={{ color: t.textDimmed, fontSize:11, marginTop:2 }}>Aguardando geração e liberação</div>
                    </div>
                    <span style={{ marginLeft:"auto", color:"#4a1a6a", fontSize:16 }}>→</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Alertas de licença */}
          {(() => {
            const hoje = new Date();
            const vencendo = organizadores.filter(o => {
              if (!o.planoFim || !o.plano) return false;
              const fim = new Date(o.planoFim + "T23:59:59");
              const dias = Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
              return dias >= 0 && dias <= 30;
            });
            const encerradosFase3 = organizadores.filter(o => {
              const enc = getEncerramento(o);
              return enc.faseEncerramento === 3;
            });
            if (vencendo.length === 0 && encerradosFase3.length === 0) return null;
            return (
              <div style={{ ...s.card, borderColor: `${t.warning}44`, marginBottom: 20 }}>
                <div style={{ fontFamily: t.fontTitle, fontSize:14, fontWeight:800, color: t.warning, marginBottom:10 }}>ALERTAS DE LICENÇA</div>
                {vencendo.map(o => {
                  const dias = Math.ceil((new Date(o.planoFim + "T23:59:59") - hoje) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={o.id} style={{ fontSize:12, color: t.textSecondary, marginBottom:4 }}>
                      <strong style={{ color: dias <= 7 ? t.danger : t.warning }}>{o.entidade || o.nome}</strong> — plano {o.plano} vence em <strong>{dias} dia(s)</strong>
                    </div>
                  );
                })}
                {encerradosFase3.map(o => (
                  <div key={o.id} style={{ fontSize:12, color: t.danger, marginBottom:4 }}>
                    <strong>{o.entidade || o.nome}</strong> — dados pendentes de exclusão permanente
                  </div>
                ))}
                {(vencendo.length > 0 || encerradosFase3.length > 0) && (
                  <button onClick={() => setAba("licencas")} style={{ ...s.btnGhost, fontSize:11, padding:"4px 12px", marginTop:8 }}>Ver Licenças →</button>
                )}
              </div>
            );
          })()}

          {/* Ações rápidas */}
          <div style={s.card}>
            <div style={s.sectionHd}>Ações Rápidas</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
              {[
                { label:"Criar Competição",   action:() => { selecionarEvento(null, "novo-evento"); }, primary:true },
                { label:"Cadastrar Atleta",   action:() => navigate("/admin/atleta/novo") },
                { label:"Gerenciar Equipes",  action:() => navigate("/admin/equipes") },
                { label:"Gerenciar Usuários", action:() => navigate("/admin/usuarios") },
                ...(eventoAtual ? [{ label:"Ver Inscrições",     action:() => navigate(`/competicao/${eventoAtual?.slug || eventoAtualId}/gerenciar-inscricoes`) }] : []),
              ].map(a => (
                <button key={a.label} onClick={a.action} style={{
                  background: a.primary ? `linear-gradient(135deg, ${t.accent}, ${t.accentDark})` : t.bgHeaderSolid,
                  border: a.primary ? "none" : `1px solid ${t.border}`,
                  borderRadius:10, padding:"16px 10px",
                  cursor:"pointer", color: a.primary ? "#fff" : t.textTertiary,
                  fontFamily: t.fontBody, fontSize:13, fontWeight:600,
                  display:"flex", alignItems:"center", justifyContent:"center", textAlign:"center",
                  transition:"all 0.15s", minHeight:50,
                }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Últimas ações */}
          {(historicoAcoes||[]).length > 0 && (
            <div style={s.card}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={s.sectionHd}>Últimas Ações</div>
                <button style={{ ...s.btnGhost, fontSize:11, padding:"4px 12px" }} onClick={() => setAba("historico")}>
                  Ver tudo →
                </button>
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead><tr><Th>Data/Hora</Th><Th>Usuário</Th><Th>Ação</Th><Th>Detalhe</Th></tr></thead>
                  <tbody>
                    {(historicoAcoes||[]).slice(0,5).map((h, i) => (
                      <tr key={`rh_${h.id}_${i}`} style={s.tr}>
                        <Td style={{ fontSize:11, color: t.textDimmed, whiteSpace:"nowrap" }}>
                          {new Date(h.data).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"})}
                        </Td>
                        <Td><span style={{ color: t.accent, fontSize:12 }}>{typeof h.nomeUsuario === "object" ? JSON.stringify(h.nomeUsuario) : h.nomeUsuario||"—"}</span></Td>
                        <Td><strong style={{ color: t.textPrimary, fontSize:12 }}>{typeof h.acao === "object" ? JSON.stringify(h.acao) : h.acao}</strong></Td>
                        <Td style={{ fontSize:12, color: t.textMuted }}>{typeof h.detalhe === "object" ? JSON.stringify(h.detalhe) : h.detalhe||"—"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: ORGANIZADORES
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "organizadores" && (
        <>
          {/* Recuperação de Senha */}
          {pendRec.length > 0 && (
            <div style={{ ...s.card, borderColor:"#2a5a2a", marginBottom:16 }}>
              <div style={{ fontFamily: t.fontTitle, fontSize:18, fontWeight:800, color:t.success, marginBottom:14, letterSpacing:1 }}>
                Recuperação de Senha ({pendRec.length})
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead><tr>
                    <Th>Usuário</Th><Th>Perfil</Th><Th>E-mail</Th><Th>CPF</Th><Th>Data</Th><Th>Senha Temp.</Th><Th>Ação</Th>
                  </tr></thead>
                  <tbody>
                    {pendRec.map(sol => {
                      const LABEL = { equipe:"Equipe", organizador:"Org.", atleta:"Atleta" };
                      return (
                        <tr key={sol.id} style={s.tr}>
                          <Td><strong style={{ color: t.textPrimary }}>{sol.nome}</strong></Td>
                          <Td style={{ fontSize:12 }}>{LABEL[sol.tipo]||sol.tipo}</Td>
                          <Td style={{ fontSize:12 }}>{sol.email}</Td>
                          <Td style={{ fontSize:11, color: t.textTertiary }}>{sol.cpf||"—"}</Td>
                          <Td style={{ fontSize:11, color: t.textDimmed }}>{new Date(sol.data).toLocaleString("pt-BR")}</Td>
                          <Td>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <span style={{ fontFamily:"monospace", background:t.bgCardAlt, border:`1px solid ${t.accent}66`,
                                color: t.accent, padding:"2px 10px", borderRadius:4, fontWeight:700, letterSpacing:2, fontSize:13 }}>
                                {senhasVisiveis.has(sol.id) ? sol.senhaTemp : "••••••••"}
                              </span>
                              <button
                                onClick={() => setSenhasVisiveis(prev => {
                                  const next = new Set(prev);
                                  next.has(sol.id) ? next.delete(sol.id) : next.add(sol.id);
                                  return next;
                                })}
                                style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color: t.textDimmed, padding:"0 2px" }}
                                title={senhasVisiveis.has(sol.id) ? "Ocultar senha" : "Revelar senha"}
                              >
                                {senhasVisiveis.has(sol.id) ? "Ocultar" : "Revelar"}
                              </button>
                            </div>
                          </Td>
                          <Td>
                            {resetFeedback[sol.id] === "ok" ? (
                              <span style={{ color:t.success, fontSize:12 }}>E-mail enviado!</span>
                            ) : resetFeedback[sol.id] === "erro" ? (
                              <span style={{ color: t.danger, fontSize:12 }}>Falhou — tente de novo</span>
                            ) : (
                              <button onClick={async () => {
                                setResetFeedback(prev => ({ ...prev, [sol.id]: "enviando" }));
                                try {
                                  // 1. Garantir que existe conta Firebase Auth para este e-mail
                                  await aplicarSenhaTemp(sol.tipo, sol.userId, sol.senhaTemp, sol);
                                  // 2. Enviar e-mail oficial de redefinição de senha pelo Firebase
                                  await sendPasswordResetEmail(auth, sol.email);
                                  // 3. Marcar solicitação como resolvida
                                  resolverSolicitacaoRecuperacao(sol.id);
                                  setResetFeedback(prev => ({ ...prev, [sol.id]: "ok" }));
                                } catch (err) {
                                  console.error("Erro ao enviar reset:", err);
                                  setResetFeedback(prev => ({ ...prev, [sol.id]: "erro" }));
                                }
                              }}
                              disabled={resetFeedback[sol.id] === "enviando"}
                              style={{ ...s.btnGhost, fontSize:12, padding:"4px 14px", color:t.success, borderColor:`${t.success}66`,
                                opacity: resetFeedback[sol.id] === "enviando" ? 0.5 : 1,
                                cursor: resetFeedback[sol.id] === "enviando" ? "not-allowed" : "pointer" }}>
                                {resetFeedback[sol.id] === "enviando" ? "Enviando..." : "Enviar Link de Redefinição"}
                              </button>
                            )}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize:11, color: t.textDimmed, marginTop:8 }}>
                Ao clicar em "Enviar Link de Redefinição", o Firebase envia um e-mail oficial para o usuário com link para criar uma nova senha. O link expira em 1 hora.
              </div>
            </div>
          )}

          {/* Lista de Organizadores */}
          <div style={s.card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:16 }}>
              <div style={s.sectionHd}>Organizadores ({organizadores.length})</div>
              <button onClick={async () => { setShowOrgForm(!showOrgForm); setErrosOrg({}); }}
                style={{ ...s.btnPrimary, fontSize:12, padding:"6px 16px" }}>
                {showOrgForm ? "✕ Cancelar" : "+ Novo Organizador"}
              </button>
            </div>

            {salvoOrg && (
              <div style={{ background:`${t.success}15`, border:`1px solid ${t.success}66`, borderRadius:8, padding:"8px 14px", marginBottom:12, color:t.success, fontSize:13 }}>
                Organizador criado com sucesso!
              </div>
            )}

            {showOrgForm && (
              <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.borderInput}`, borderRadius:10, padding:"16px 18px", marginBottom:16 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:8 }}>
                  <FormField label="Nome Completo *"        value={formOrg.nome}     onChange={v=>setFormOrg({...formOrg,nome:v})}     error={errosOrg.nome} />
                  <FormField label="Entidade / Federação *" value={formOrg.entidade} onChange={v=>setFormOrg({...formOrg,entidade:v})} error={errosOrg.entidade} />
                  <FormField label="E-mail *"               value={formOrg.email}    onChange={v=>setFormOrg({...formOrg,email:v})}    type="email" error={errosOrg.email} />
                  <FormField label="Telefone"               value={formOrg.fone}     onChange={v=>setFormOrg({...formOrg,fone:v})} />
                  <FormField label="Senha *"                value={formOrg.senha}    onChange={v=>setFormOrg({...formOrg,senha:v})}    type="password" error={errosOrg.senha} />
                  <FormField label="CNPJ *"                 value={formOrg.cnpj}     onChange={v=>setFormOrg({...formOrg,cnpj:v})}     placeholder="00.000.000/0001-00" error={errosOrg.cnpj} />
                  <FormField label="Cidade"                  value={formOrg.cidade}   onChange={v=>setFormOrg({...formOrg,cidade:v})} />
                  <div>
                    <label style={{ display:"block", fontSize:12, fontWeight:600, color:t.textMuted, letterSpacing:1, marginBottom:6, textTransform:"uppercase" }}>UF</label>
                    <select style={{ width:"100%", background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:8, padding:"10px 14px", color:t.textSecondary, fontSize:14 }}
                      value={formOrg.estado || ""} onChange={e => setFormOrg({...formOrg, estado:e.target.value})}>
                      <option value="">—</option>
                      {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:8 }}>
                  <button onClick={handleCriarOrg} style={s.btnPrimary}>Criar Organizador (aprovado)</button>
                  <button onClick={() => setShowOrgForm(false)} style={s.btnGhost}>Cancelar</button>
                </div>
              </div>
            )}

            <input type="text" value={buscaOrg} onChange={e=>setBuscaOrg(e.target.value)}
              placeholder="Buscar organizador..." style={si} />
            <div style={s.tableWrap}>
              <div style={{ maxHeight:400, overflowY:"auto" }}>
                <table style={s.table}>
                  <thead><tr>
                    <Th>Nome</Th><Th>Entidade</Th><Th>E-mail</Th><Th>CNPJ</Th><Th>Cadastro</Th><Th>Status</Th><Th>Ações</Th>
                  </tr></thead>
                  <tbody>
                    {orgPag.map((o, i) => {
                      const bs = badgeStatus(o.status || "pendente", t);
                      return (
                        <tr key={`org_${o.id}_${i}`} style={{ ...s.tr, opacity: o.status==="recusado" ? 0.5 : 1 }}>
                          <Td><strong style={{ color: t.textPrimary }}>{o.nome}</strong></Td>
                          <Td style={{ fontSize:12 }}>{o.entidade}</Td>
                          <Td style={{ fontSize:12 }}>{o.email}</Td>
                          <Td style={{ fontSize:11 }}>{o.cnpj||"—"}</Td>
                          <Td style={{ fontSize:11, color: t.textDimmed }}>{o.dataCadastro ? new Date(o.dataCadastro).toLocaleDateString("pt-BR") : "—"}</Td>
                          <Td>
                            <span style={{ background:bs.bg, color:bs.color, padding:"3px 10px", borderRadius:4, fontSize:11, fontWeight:700 }}>
                              {bs.label}
                            </span>
                          </Td>
                          <Td>
                            <div style={{ display:"flex", gap:6 }}>
                              {o.status !== "aprovado" && (
                                <button onClick={() => aprovarOrganizador(o.id)}
                                  style={{ ...s.btnGhost, fontSize:11, padding:"3px 12px", color:t.success, borderColor:`${t.success}66` }}>✓ Aprovar</button>
                              )}
                              {o.status !== "recusado" && (
                                <button onClick={() => recusarOrganizador(o.id)}
                                  style={{ ...s.btnGhost, fontSize:11, padding:"3px 12px", color: t.danger, borderColor:`${t.danger}66` }}>✗ Recusar</button>
                              )}
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <PaginaControles {...orgInfo} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: COMPETIÇÕES
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "competicoes" && (
        <>
          {/* Todas as competições */}
          <div style={s.card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:14 }}>
              <div style={s.sectionHd}>Todas as Competições ({eventos.length})</div>
              <button style={s.btnPrimary} onClick={async () => { selecionarEvento(null, "novo-evento"); }}>+ Nova Competição</button>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
              <input type="text" value={buscaComp} onChange={e=>setBuscaComp(e.target.value)}
                placeholder="Buscar competição..." style={{ ...si, marginBottom: 0, flex: 1, minWidth: 200 }} />
              <select value={filtroOrgComp} onChange={e => setFiltroOrgComp(e.target.value)}
                style={{ ...si, marginBottom: 0, width: "auto", minWidth: 200 }}>
                <option value="">Todos organizadores</option>
                {organizadores.filter(o => o.status === "aprovado").sort((a,b) => (a.entidade||a.nome||"").localeCompare(b.entidade||b.nome||"","pt-BR")).map(o => (
                  <option key={o.id} value={o.id}>{o.entidade || o.nome}</option>
                ))}
              </select>
            </div>
            {eventos.length === 0 ? (
              <div style={s.empty}>Nenhuma competição cadastrada.</div>
            ) : (
              <>
                <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:480, overflowY:"auto" }}>
                  {compPag.map(ev => {
                    const nInscs = inscricoes.filter(i => i.eventoId===ev.id).length;
                    return (
                      <div key={`all_${ev.id}`} style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          {ev.logoCompeticao && <img loading="lazy" src={ev.logoCompeticao} alt="" style={{ width:22, height:22, objectFit:"contain", borderRadius:3 }} />}
                          <strong style={{ color: t.textPrimary, fontSize:13, flex:1 }}>{ev.nome}</strong>
                        </div>
                        <div style={{ color: t.textDimmed, fontSize:11, marginBottom:8 }}>
                          {new Date(ev.data+"T12:00:00").toLocaleDateString("pt-BR")} · {_getLocalEventoDisplay(ev)} · {nInscs} insc.
                        </div>
                        <div style={{ display:"flex", gap:5 }}>
                          <button style={{ ...s.btnSecondary, fontSize:11, padding:"3px 10px" }}
                            onClick={async () => { selecionarEvento(ev.id); }}>Acessar</button>
                          <button style={{ ...s.btnGhost, fontSize:11, padding:"3px 10px" }}
                            onClick={async () => { selecionarEvento(ev.id, "novo-evento"); }}>Editar</button>
                          <button style={{ ...s.btnGhost, fontSize:11, padding:"3px 9px", color: t.danger, borderColor:`${t.danger}44` }}
                            onClick={() => excluirEvento(ev.id)}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <PaginaControles {...compInfo} />
              </>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: EQUIPES
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "equipes" && (
        <div style={s.card}>
          {/* ── Fila de aprovação ── */}
          {pendEq.length > 0 && (() => {
            return (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <div style={s.sectionHd}>Equipes Aguardando Aprovação</div>
                  <span style={{ background:`${t.success}15`, color:t.success, border:`1px solid ${t.success}66`, borderRadius:20, padding:"2px 10px", fontSize:12, fontWeight:700 }}>
                    {pendEq.length}
                  </span>
                </div>
                {pendEq.map(sol => (
                  <div key={sol.id} style={{ background:t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:10, padding:16, marginBottom:12 }}>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:16, marginBottom:12 }}>
                      <div>
                        <div style={{ color: t.textPrimary, fontWeight:700, fontSize:15 }}>{sol.equipeNome} <span style={{ color: t.accent, fontSize:13 }}>({sol.equipeSigla})</span></div>
                        <div style={{ color: t.textMuted, fontSize:12, marginTop:2 }}>{sol.equipeEmail} · CNPJ: {sol.equipeCnpj}</div>
                        <div style={{ color: t.textMuted, fontSize:12 }}>{sol.equipeCidade}/{sol.equipeUf}</div>
                      </div>
                      <div style={{ marginLeft:"auto", textAlign:"right" }}>
                        {sol.organizadorId
                          ? <div style={{ color:t.accent, fontSize:12 }}>Org.: {sol.organizadorNome || sol.organizadorId}</div>
                          : <div style={{ color:"#e67e22", fontSize:12 }}>Sem organizador vinculado</div>
                        }
                        <div style={{ color: t.textDimmed, fontSize:11 }}>{new Date(sol.data).toLocaleDateString("pt-BR")}</div>
                      </div>
                    </div>
                    {!sol.organizadorId && (
                      <div style={{ marginBottom:10 }}>
                        <label style={{ color: t.textTertiary, fontSize:12, display:"block", marginBottom:4 }}>Vincular a organizador:</label>
                        <select value={orgSel[sol.id] || ""} onChange={e => setOrgSel(p => ({...p, [sol.id]: e.target.value}))}
                          style={{ background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:6, color: t.textPrimary, padding:"6px 10px", fontSize:13, width:"100%" }}>
                          <option value="">Selecione o organizador...</option>
                          {organizadores.filter(o => o.status === "aprovado").map(o => (
                            <option key={o.id} value={o.id}>{o.nome} — {o.entidade}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div style={{ display:"flex", gap:8 }}>
                      <button style={{ ...s.btnPrimary, fontSize:13, padding:"6px 18px" }}
                        onClick={() => {
                          const orgId = sol.organizadorId || orgSel[sol.id];
                          if (!sol.organizadorId && !orgId) { alert("Selecione um organizador antes de aprovar."); return; }
                          aprovarEquipe(sol.equipeId, orgId || null);
                        }}>Aprovar</button>
                      <button style={{ background:`${t.danger}15`, color: t.danger, border:`1px solid ${t.danger}66`, borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700, padding:"6px 18px" }}
                        onClick={() => recusarEquipe(sol.equipeId)}>Recusar</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:14 }}>
            <div style={s.sectionHd}>Equipes ({equipes.length})</div>
            <button style={s.btnSecondary} onClick={() => navigate("/admin/equipes")}>Gestão Completa →</button>
          </div>
          {equipes.length === 0 ? (
            <div style={s.empty}>Nenhuma equipe cadastrada.</div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
                <input type="text" value={buscaEq} onChange={e=>setBuscaEq(e.target.value)}
                  placeholder="Buscar equipe..." style={{ ...si, marginBottom: 0, flex: 1, minWidth: 200 }} />
                <select value={filtroOrgEq} onChange={e => setFiltroOrgEq(e.target.value)}
                  style={{ ...si, marginBottom: 0, width: "auto", minWidth: 200 }}>
                  <option value="">Todos organizadores</option>
                  {organizadores.filter(o => o.status === "aprovado").sort((a,b) => (a.entidade||a.nome||"").localeCompare(b.entidade||b.nome||"","pt-BR")).map(o => (
                    <option key={o.id} value={o.id}>{o.entidade || o.nome}</option>
                  ))}
                </select>
              </div>
              <div style={s.tableWrap}>
                <div style={{ maxHeight:480, overflowY:"auto" }}>
                  <table style={s.table}>
                    <thead><tr><Th>Nome</Th><Th>Sigla</Th><Th>E-mail</Th><Th>CNPJ</Th><Th>Cidade</Th><Th>Organizador</Th><Th>Atletas</Th></tr></thead>
                    <tbody>
                      {equipesPag.map(eq => {
                        const org = organizadores.find(o => o.id === eq.organizadorId);
                        return (
                          <tr key={`eq_${eq.id}`} style={s.tr}>
                            <Td><strong style={{ color: t.textPrimary }}>{eq.nome}</strong></Td>
                            <Td style={{ fontSize:12 }}>{eq.sigla||"—"}</Td>
                            <Td style={{ fontSize:12 }}>{eq.email||"—"}</Td>
                            <Td style={{ fontSize:11 }}>{eq.cnpj||"—"}</Td>
                            <Td style={{ fontSize:12 }}>{eq.cidade ? `${eq.cidade}/${eq.estado||""}` : "—"}</Td>
                            <Td>{org ? <span style={{ color: t.accent, fontSize:12 }}>{org.entidade||org.nome}</span> : <span style={{ color: t.textDimmed, fontSize:12 }}>Sem vínculo</span>}</Td>
                            <Td><span style={{ fontFamily: t.fontTitle, fontSize:18, fontWeight:800, color: t.accent }}>{atletasPorEquipeId[eq.id] || 0}</span></Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <PaginaControles {...equipesInfo} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: ATLETAS
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "atletas" && (
        <div style={s.card}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:14 }}>
            <div style={s.sectionHd}>Atletas ({atletas.length})</div>
            <div style={{ display:"flex", gap:8 }}>
              <button style={s.btnPrimary} onClick={() => navigate("/admin/atleta/novo")}>+ Cadastrar</button>
              <button style={s.btnSecondary} onClick={() => navigate("/admin/importar-atletas")}>Importar</button>
            </div>
          </div>
          {atletas.length === 0 ? (
            <div style={s.empty}>Nenhum atleta cadastrado.</div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
                <input type="text" value={buscaAtl} onChange={e=>setBuscaAtl(e.target.value)}
                  placeholder="Buscar atleta..." style={{ ...si, marginBottom: 0, flex: 1, minWidth: 200 }} />
                <select value={filtroAtl} onChange={e => setFiltroAtl(e.target.value)}
                  style={{ ...si, marginBottom: 0, width: "auto", minWidth: 180 }}>
                  <option value="todos">Todos os atletas</option>
                  <option value="sem_equipe">Sem equipe</option>
                  <option value="sem_equipe_usuario">Sem equipe e sem usuário</option>
                </select>
                <select value={filtroOrgAtl} onChange={e => { setFiltroOrgAtl(e.target.value); setFiltroEqAtl(""); }}
                  style={{ ...si, marginBottom: 0, width: "auto", minWidth: 180 }}>
                  <option value="">Todos organizadores</option>
                  {organizadores.filter(o => o.status === "aprovado").sort((a,b) => (a.entidade||a.nome||"").localeCompare(b.entidade||b.nome||"","pt-BR")).map(o => (
                    <option key={o.id} value={o.id}>{o.entidade || o.nome}</option>
                  ))}
                </select>
                <select value={filtroEqAtl} onChange={e => setFiltroEqAtl(e.target.value)}
                  style={{ ...si, marginBottom: 0, width: "auto", minWidth: 180 }}>
                  <option value="">Todas equipes</option>
                  {equipes.filter(eq => !filtroOrgAtl || eq.organizadorId === filtroOrgAtl).sort((a,b) => (a.nome||"").localeCompare(b.nome||"","pt-BR")).map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.nome}{eq.sigla ? ` (${eq.sigla})` : ""}</option>
                  ))}
                </select>
              </div>
              <div style={s.tableWrap}>
                <div style={{ maxHeight:480, overflowY:"auto" }}>
                  <table style={s.table}>
                    <thead><tr><Th>Nome</Th><Th>Sexo</Th><Th>Nasc.</Th><Th>Equipe</Th><Th>Inscrições</Th><Th>Ações</Th></tr></thead>
                    <tbody>
                      {atletasPag.map(a => {
                        const eq = equipes.find(eq2 => eq2.id === a.equipeId);
                        const ninsc = inscricoes.filter(i => i.atletaId===a.id).length;
                        return (
                          <tr key={`atl_${a.id}`} style={s.tr}>
                            <Td><strong style={{ color: t.textPrimary }}>{a.nome}</strong></Td>
                            <Td>
                              <span style={{ background: a.sexo==="M"?"#1a6ef522":"#e54f9b22", color: a.sexo==="M"?"#1a6ef5":"#e54f9b",
                                border:`1px solid ${a.sexo==="M"?"#1a6ef544":"#e54f9b44"}`, borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:600 }}>
                                {a.sexo==="M"?"Masc":"Fem"}
                              </span>
                            </Td>
                            <Td style={{ fontSize:12 }}>{_getNascDisplay(a)||"—"}</Td>
                            <Td style={{ fontSize:12 }}>{eq?.nome||<span style={{ color: t.textDimmed }}>Avulso</span>}</Td>
                            <Td><span style={{ fontFamily: t.fontTitle, fontSize:18, fontWeight:800, color: t.accent }}>{ninsc}</span></Td>
                            <Td>
                              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                                <button onClick={async () => { navigate(`/admin/atleta/${a.id}/editar`); }}
                                  style={{ ...s.btnGhost, fontSize:11, padding:"3px 12px" }}>Editar</button>
                                <button onClick={() => { setModalTransf({ atleta: a }); setTransfEquipeId(a.equipeId || ""); }}
                                  style={{ ...s.btnGhost, fontSize:11, padding:"3px 12px", color:"#e6c430", borderColor:"#5a4a00" }}>Transferir</button>
                                <button onClick={async () => {  if (await confirmar(`Excluir ${a.nome }?`)) excluirAtleta(a.id); }}
                                  style={{ ...s.btnGhost, fontSize:11, padding:"3px 10px", color: t.danger, borderColor:"#5a1a1a" }}>✕</button>
                              </div>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <PaginaControles {...atletasInfo} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: TREINADORES
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "treinadores" && (
        <div style={s.card}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:14 }}>
            <div style={s.sectionHd}>Treinadores ({treinadores.length})</div>
            <button style={s.btnPrimary} onClick={() => {
              setShowTreinForm(v => !v);
              if (showTreinForm) { setFormTrein({ nome:"", email:"", cpf:"", cargo:"", equipeId:"", permissoes:[] }); setEditandoTrein(null); setErrosTrein({}); setTreinDocExistente(null); }
            }}>
              {showTreinForm ? "Cancelar" : "+ Novo Treinador"}
            </button>
          </div>

          {salvoTrein && (
            <div style={{ background: salvoTrein.startsWith("Erro") ? `${t.danger}15` : salvoTrein.includes("já possui conta") ? `${t.accent}15` : `${t.success}15`,
              border: `1px solid ${salvoTrein.startsWith("Erro") ? t.danger : salvoTrein.includes("já possui conta") ? t.accent : t.success}66`,
              color: salvoTrein.startsWith("Erro") ? t.danger : salvoTrein.includes("já possui conta") ? t.accent : t.success,
              borderRadius:8, padding:"10px 16px", marginBottom:16, fontSize:13, fontWeight:600 }}>
              {salvoTrein}
            </div>
          )}

          {showTreinForm && (
            <div style={{ background:t.bgCardAlt, border:`1px solid ${t.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
              <div style={{ fontWeight:700, color:t.textPrimary, fontSize:15, marginBottom:14 }}>{editandoTrein ? "Editar Treinador" : "Cadastrar Treinador"}</div>
              <div style={{ marginBottom:12 }}>
                <FormField label="CPF *" value={formTrein.cpf}
                  onChange={v => { setFormTrein({...formTrein, cpf:v}); verificarCpfTrein(v); }}
                  placeholder="000.000.000-00" error={errosTrein.cpf} />
              </div>
              {treinDocExistente && (
                <div style={{ background:`${t.success}10`, border:`1px solid ${t.success}44`, borderRadius:8, padding:"10px 14px", marginBottom:12, fontSize:13, color:t.success }}>
                  Perfil existente encontrado: <strong>{treinDocExistente.nome}</strong>{treinDocExistente.email ? ` (${treinDocExistente.email})` : ""} — {treinDocExistente.tipo || "atleta"}
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <FormField label="Nome Completo *" value={formTrein.nome} onChange={v => setFormTrein({...formTrein, nome:v})} error={errosTrein.nome} disabled={treinDocExistente && !!treinDocExistente.nome} />
                <FormField label="E-mail *" value={formTrein.email} onChange={v => setFormTrein({...formTrein, email:v})} type="email" error={errosTrein.email} disabled={treinDocExistente && !!treinDocExistente.email} />
                <FormField label="Cargo / Função" value={formTrein.cargo} onChange={v => setFormTrein({...formTrein, cargo:v})} placeholder="Ex: Treinador, Assistente" />
              </div>
              <div style={{ marginTop:8, marginBottom:12 }}>
                <label style={{ display:"block", color:t.textTertiary, fontSize:12, marginBottom:5 }}>Equipe *</label>
                <select value={formTrein.equipeId} onChange={e => setFormTrein({...formTrein, equipeId:e.target.value})}
                  style={{ background:t.bgInput, border:`1px solid ${errosTrein.equipeId ? t.danger : t.borderInput}`, borderRadius:6, color:t.textPrimary, padding:"10px 14px", fontSize:14, width:"100%", boxSizing:"border-box" }}>
                  <option value="">Selecione a equipe...</option>
                  {equipes.sort((a,b) => (a.nome||"").localeCompare(b.nome||"","pt-BR")).map(eq => {
                    const org = organizadores.find(o => o.id === eq.organizadorId);
                    return <option key={eq.id} value={eq.id}>{eq.nome}{org ? ` — ${org.entidade||org.nome}` : ""}</option>;
                  })}
                </select>
                {errosTrein.equipeId && <div style={{ color:t.danger, fontSize:11, marginTop:4 }}>{errosTrein.equipeId}</div>}
              </div>
              {/* Permissões */}
              <div style={{ marginTop:12 }}>
                <label style={{ display:"block", color:t.textTertiary, fontSize:12, marginBottom:5 }}>Permissões de Acesso</label>
                {gruposPerm.map(grupo => (
                  <div key={grupo} style={{ marginBottom:8 }}>
                    <div style={{ color:t.textDimmed, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>{grupo}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {PERMISSOES_TREINADOR.filter(p => p.grupo === grupo).map(p => {
                        const ativo = formTrein.permissoes.includes(p.id);
                        return (
                          <button key={p.id} type="button" onClick={() => togglePermTrein(p.id)}
                            style={{ padding:"4px 12px", borderRadius:5, cursor:"pointer", fontSize:11,
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
              <button style={{ ...s.btnPrimary, marginTop:8 }} onClick={editandoTrein ? handleSalvarTreinEdit : handleCriarTrein}>
                {editandoTrein ? "Salvar Alterações" : treinDocExistente ? "Vincular Treinador" : "Criar Treinador"}
              </button>
              {editandoTrein && <button style={{ ...s.btnGhost, marginTop:8, marginLeft:8 }} onClick={() => {
                setEditandoTrein(null); setShowTreinForm(false);
                setFormTrein({ nome:"", email:"", cpf:"", cargo:"", equipeId:"", permissoes:[] }); setEditandoTrein(null);
              }}>Cancelar edição</button>}
            </div>
          )}

          {treinadores.length === 0 && !showTreinForm ? (
            <div style={s.empty}>Nenhum treinador cadastrado.</div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
                <input type="text" value={buscaTrein} onChange={e=>setBuscaTrein(e.target.value)}
                  placeholder="Buscar por nome, e-mail ou CPF..." style={{ ...si, marginBottom: 0, flex: 1, minWidth: 200 }} />
                <select value={filtroOrgTrein} onChange={e => { setFiltroOrgTrein(e.target.value); setFiltroEqTrein(""); }}
                  style={{ ...si, marginBottom: 0, width: "auto", minWidth: 200 }}>
                  <option value="">Todos organizadores</option>
                  {organizadores.filter(o => o.status === "aprovado").sort((a,b) => (a.entidade||a.nome||"").localeCompare(b.entidade||b.nome||"","pt-BR")).map(o => (
                    <option key={o.id} value={o.id}>{o.entidade || o.nome}</option>
                  ))}
                </select>
                <select value={filtroEqTrein} onChange={e => setFiltroEqTrein(e.target.value)}
                  style={{ ...si, marginBottom: 0, width: "auto", minWidth: 200 }}>
                  <option value="">Todas equipes</option>
                  {equipes
                    .filter(eq => !filtroOrgTrein || eq.organizadorId === filtroOrgTrein)
                    .sort((a,b) => (a.nome||"").localeCompare(b.nome||"","pt-BR"))
                    .map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.nome}</option>
                  ))}
                </select>
              </div>
              <div style={s.tableWrap}>
                <div style={{ maxHeight:520, overflowY:"auto" }}>
                  <table style={s.table}>
                    <thead><tr><Th>Nome</Th><Th>E-mail</Th><Th>CPF</Th><Th>Equipe</Th><Th>Organizador</Th><Th>Status</Th><Th>Ações</Th></tr></thead>
                    <tbody>
                      {treinPag.map(tr => {
                        const eq = equipes.find(e => e.id === tr.equipeId);
                        const org = organizadores.find(o => o.id === (tr.organizadorId || eq?.organizadorId));
                        return (
                          <tr key={`tr_${tr.id}`} style={s.tr}>
                            <Td><strong style={{ color: t.textPrimary }}>{tr.nome || "—"}</strong></Td>
                            <Td style={{ fontSize:12 }}>{tr.email || "—"}</Td>
                            <Td style={{ fontSize:11 }}>{tr.cpf || "—"}</Td>
                            <Td style={{ fontSize:12 }}>{eq ? <span style={{ color: t.accent }}>{eq.nome}</span> : <span style={{ color: t.textDimmed }}>Sem equipe</span>}</Td>
                            <Td style={{ fontSize:12 }}>{org ? <span style={{ color: t.accent }}>{org.entidade||org.nome}</span> : <span style={{ color: t.textDimmed }}>—</span>}</Td>
                            <Td>
                              {tr.ativo === false
                                ? <span style={{ background:`${t.danger}15`, color:t.danger, border:`1px solid ${t.danger}44`, borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:600 }}>Inativo</span>
                                : <span style={{ background:`${t.success}15`, color:t.success, border:`1px solid ${t.success}44`, borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:600 }}>Ativo</span>
                              }
                              {!tr.tipo && <span style={{ background:`${t.danger}15`, color:t.danger, border:`1px solid ${t.danger}44`, borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:600, marginLeft:4 }}>Sem tipo</span>}
                            </Td>
                            <Td>
                              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                                <button title="Editar" style={{ ...s.btnGhost, fontSize:12, padding:"4px 10px" }}
                                  onClick={() => abrirEditarTrein(tr)}>Editar</button>
                                <span style={{ width:1, height:16, background:t.border }} />
                                <button title={tr.ativo === false ? "Reativar" : "Desativar"} style={{ ...s.btnGhost, fontSize:12, padding:"4px 10px" }}
                                  onClick={() => {
                                    atualizarTreinador({ ...tr, ativo: !tr.ativo });
                                    registrarAcao(usuarioLogado.id, usuarioLogado.nome, tr.ativo ? "Desativou treinador (admin)" : "Reativou treinador (admin)", tr.nome, null, { modulo: "admin" });
                                  }}>{tr.ativo === false ? "Ativar" : "Desativar"}</button>
                                <span style={{ width:1, height:16, background:t.border }} />
                                <button title="Remover permanentemente" style={{ ...s.btnGhost, fontSize:11, padding:"3px 8px", color:t.danger, opacity:0.7 }}
                                  onClick={() => {
                                    removerTreinador(tr.id);
                                    registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Removeu treinador (admin)", `${tr.nome} (${tr.email})`, null, { modulo: "admin" });
                                  }}>Remover</button>
                              </div>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <PaginaControles {...treinInfo} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: LICENÇAS
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "licencas" && (
        <div style={s.card}>
          <div style={s.sectionHd}>Gestão de Licenças</div>

          {/* Resumo */}
          <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:20 }}>
            <StatCard value={organizadores.filter(o => o.plano).length} label="Planos ativos" />
            <StatCard value={organizadores.reduce((acc, o) => acc + getCreditosDisponiveis(o).length, 0)} label="Créditos disponíveis" />
            <StatCard value={organizadores.filter(o => o.suspenso).length} label="Suspensos" />
          </div>

          {/* Tabela de organizadores */}
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead><tr>
                <Th>Organizador</Th><Th>Plano</Th><Th>Status</Th><Th>Competições</Th><Th>Créditos</Th><Th>Validade</Th><Th>Ações</Th>
              </tr></thead>
              <tbody>
                {organizadores.filter(o => o.status === "aprovado").map(org => {
                  const usage = getUsage(org, eventos);
                  const editando = licencaEditId === org.id;
                  return (
                    <tr key={org.id} style={s.tr}>
                      <Td>
                        <strong style={{ color: t.textPrimary, fontSize:12 }}>{org.entidade || org.nome}</strong>
                        {org.suspenso && <span style={{ color: t.danger, fontSize:10, marginLeft:6 }}>SUSPENSO</span>}
                      </Td>
                      <Td>
                        {editando ? (
                          <select value={licencaForm.plano} onChange={ev => setLicencaForm(f => ({ ...f, plano: ev.target.value }))}
                            style={{ ...s.input, marginBottom:0, padding:"4px 8px", fontSize:11, width:120 }}>
                            <option value="">Sem plano</option>
                            {Object.values(PLANS).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                          </select>
                        ) : (
                          <span style={{ fontSize:12, color: usage.planoId ? t.accent : t.textDimmed }}>
                            {usage.planoNome}
                          </span>
                        )}
                      </Td>
                      <Td>
                        {usage.encerrado ? (
                          <span style={{ fontSize:11, fontWeight:600, color: t.danger }}>
                            {usage.faseEncerramento === 1 ? `Encerrando (${7 - usage.diasDesdeEncerramento}d)` : usage.faseEncerramento === 2 ? `Indisponível (${usage.diasParaExclusao}d)` : "Pendente exclusão"}
                          </span>
                        ) : (
                          <span style={{ fontSize:11, fontWeight:600,
                            color: usage.status === "ativo" ? t.success : usage.status === "expirado" ? t.danger : t.textDimmed }}>
                            {usage.status === "ativo" ? "Ativo" : usage.status === "expirado" ? "Expirado" : "Sem plano"}
                          </span>
                        )}
                      </Td>
                      <Td style={{ fontSize:11 }}>
                        {usage.maxCompeticoes === Infinity
                          ? `${usage.eventosNoPeriodo} (ilimitado)`
                          : usage.maxCompeticoes > 0
                            ? `${usage.eventosNoPeriodo} / ${usage.maxCompeticoes}`
                            : "—"}
                      </Td>
                      <Td style={{ fontSize:11 }}>
                        {usage.creditosDisponiveis > 0
                          ? <span style={{ color: t.accent }}>{usage.creditosDisponiveis} disponível(is)</span>
                          : <span style={{ color: t.textDimmed }}>0</span>}
                      </Td>
                      <Td style={{ fontSize:11 }}>
                        {editando ? (
                          <div style={{ display:"flex", gap:4 }}>
                            <input type="date" value={licencaForm.planoInicio} onChange={ev => setLicencaForm(f => ({ ...f, planoInicio: ev.target.value }))}
                              style={{ ...s.input, marginBottom:0, padding:"3px 6px", fontSize:10, width:110 }} />
                            <input type="date" value={licencaForm.planoFim} onChange={ev => setLicencaForm(f => ({ ...f, planoFim: ev.target.value }))}
                              style={{ ...s.input, marginBottom:0, padding:"3px 6px", fontSize:10, width:110 }} />
                          </div>
                        ) : (
                          usage.diasRestantes !== null
                            ? `${usage.diasRestantes} dia(s)`
                            : "—"
                        )}
                      </Td>
                      <Td>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          {editando ? (
                            <>
                              <button onClick={() => {
                                const campos = {
                                  plano: licencaForm.plano || null,
                                  planoInicio: licencaForm.planoInicio || null,
                                  planoFim: licencaForm.planoFim || null,
                                };
                                editarOrganizadorAdmin({ ...org, ...campos });
                                registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Atribuiu plano",
                                  `${org.entidade}: ${campos.plano || "removido"} (${campos.planoInicio || "—"} a ${campos.planoFim || "—"})`,
                                  null, { modulo: "licencas" });
                                setLicencaEditId(null);
                              }} style={{ ...s.btnGhost, fontSize:10, padding:"3px 8px", color: t.success, border:`1px solid ${t.success}44` }}>Salvar</button>
                              <button onClick={() => setLicencaEditId(null)}
                                style={{ ...s.btnGhost, fontSize:10, padding:"3px 8px" }}>Cancelar</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => {
                                setLicencaEditId(org.id);
                                setLicencaForm({ plano: org.plano || "", planoInicio: org.planoInicio || "", planoFim: org.planoFim || "" });
                              }} style={{ ...s.btnGhost, fontSize:10, padding:"3px 8px" }}>Plano</button>
                              <button onClick={() => setCreditoForm({ orgId: org.id, descricao: "", eventoId: "" })}
                                style={{ ...s.btnGhost, fontSize:10, padding:"3px 8px", color: t.accent, border:`1px solid ${t.accent}44` }}>+ Crédito</button>
                              {!org.suspenso ? (
                                <button onClick={() => setSuspenderForm({ orgId: org.id, motivo: "inadimplencia" })}
                                  style={{ ...s.btnGhost, fontSize:10, padding:"3px 8px", color: t.danger, border:`1px solid ${t.danger}44` }}>Suspender</button>
                              ) : (
                                <button onClick={() => {
                                  editarOrganizadorAdmin({ ...org, suspenso: false, suspensoMotivo: null, suspensoEm: null });
                                  registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Reativou conta", org.entidade || org.nome, null, { modulo: "licencas" });
                                }} style={{ ...s.btnGhost, fontSize:10, padding:"3px 8px", color: t.success, border:`1px solid ${t.success}44` }}>Reativar</button>
                              )}
                              <button onClick={() => {
                                const arqs = exportarDadosOrg(org.id, { atletas, equipes, inscricoes, resultados, eventos, historicoAcoes });
                                if (arqs.length === 0) { alert("Nenhum dado para exportar."); return; }
                                const slug = (org.entidade || org.nome || "org").toLowerCase().replace(/\s+/g, "-").slice(0, 30);
                                downloadCSVs(arqs, slug);
                                registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Exportou dados do org",
                                  `${org.entidade}: ${arqs.length} arquivo(s)`, null, { modulo: "licencas" });
                              }} style={{ ...s.btnGhost, fontSize:10, padding:"3px 8px" }}>Exportar</button>
                              {/* Subdomínio */}
                              <span style={{ display:"inline-flex", alignItems:"center", gap:4, marginLeft:4 }}>
                                <input
                                  style={{ width:60, fontSize:10, padding:"2px 5px", borderRadius:4, border:`1px solid ${t.border}`, background:t.bgCard, color:t.textPrimary }}
                                  placeholder="sigla"
                                  value={org.subdominio || ""}
                                  onChange={e => editarOrganizadorAdmin({ ...org, subdominio: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 20) })}
                                />
                                <span style={{ fontSize:9, color:t.textDimmed }}>.gerentrack.com.br</span>
                                <button
                                  onClick={() => {
                                    const novoAtivo = !org.subdominioAtivo;
                                    editarOrganizadorAdmin({ ...org, subdominioAtivo: novoAtivo });
                                    registrarAcao(usuarioLogado.id, usuarioLogado.nome,
                                      novoAtivo ? "Ativou subdomínio" : "Desativou subdomínio",
                                      `${org.entidade}: ${org.subdominio || "?"}.gerentrack.com.br`, null, { modulo: "licencas" });
                                  }}
                                  disabled={!org.subdominio}
                                  style={{ fontSize:9, padding:"2px 6px", borderRadius:4, cursor: org.subdominio ? "pointer" : "not-allowed",
                                    background: org.subdominioAtivo && org.subdominio ? t.success + "22" : "transparent",
                                    color: org.subdominioAtivo && org.subdominio ? t.success : t.textDimmed,
                                    border: `1px solid ${org.subdominioAtivo && org.subdominio ? t.success + "44" : t.border}`,
                                    fontWeight: 600,
                                  }}>
                                  {org.subdominioAtivo && org.subdominio ? "Ativo" : "Inativo"}
                                </button>
                              </span>
                              {(() => {
                                const enc = getEncerramento(org);
                                if (!enc.encerrado) return (
                                  <button onClick={async () => {
                                    if (!window.confirm(`Encerrar contrato de "${org.entidade}"?\n\nFase 1: 7 dias de acesso para exportação\nFase 2: dados indisponíveis (8-30 dias)\nFase 3: exclusão permanente após 30 dias`)) return;
                                    editarOrganizadorAdmin({ ...org, contratoEncerradoEm: new Date().toISOString().slice(0, 10), plano: null, planoInicio: null, planoFim: null });
                                    registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Encerrou contrato", org.entidade || org.nome, null, { modulo: "licencas" });
                                  }} style={{ ...s.btnGhost, fontSize:10, padding:"3px 8px", color: t.danger, border:`1px solid ${t.danger}44` }}>Encerrar</button>
                                );
                                if (enc.faseEncerramento <= 2) return (
                                  <button onClick={() => {
                                    if (!window.confirm(`Reestabelecer dados de "${org.entidade}"?\n\nIsso remove o encerramento e restaura o acesso.`)) return;
                                    editarOrganizadorAdmin({ ...org, contratoEncerradoEm: null });
                                    registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Reestabeleceu dados", org.entidade || org.nome, null, { modulo: "licencas" });
                                  }} style={{ ...s.btnGhost, fontSize:10, padding:"3px 8px", color: t.success, border:`1px solid ${t.success}44` }}>Reestabelecer</button>
                                );
                                return (
                                  <button onClick={async () => {
                                    if (!window.confirm(`EXCLUSÃO PERMANENTE de todos os dados de "${org.entidade}"?\n\nEsta ação é IRREVERSÍVEL!\n\nSerão excluídos: competições, equipes, atletas, inscrições, resultados.\nUm backup será salvo no servidor antes da exclusão.`)) return;
                                    const resultado = await excluirDadosOrganizador(org.id);
                                    if (resultado?.erro) { alert(`Exclusão abortada:\n\n${resultado.erro}`); return; }
                                    if (resultado?.arqs?.length > 0) downloadCSVs(resultado.arqs, `backup-${(org.entidade || "org").toLowerCase().replace(/\s+/g, "-")}`);
                                    alert(`Dados excluídos com sucesso.\n\nBackup salvo no servidor e disponível para download na seção "Backups para Reimplantação".`);
                                  }} style={{ ...s.btnGhost, fontSize:10, padding:"3px 8px", color: t.danger, border:`1px solid ${t.danger}44` }}>Excluir dados</button>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Modal: Adicionar Crédito */}
          {creditoForm.orgId && (() => {
            const org = organizadores.find(o => o.id === creditoForm.orgId);
            return (
              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center" }}
                onClick={() => setCreditoForm({ orgId: null, descricao: "" })}>
                <div style={{ background: t.bgCard, border:`1px solid ${t.accent}`, borderRadius:12, padding:24, maxWidth:400, width:"90%" }}
                  onClick={ev => ev.stopPropagation()}>
                  <div style={{ fontWeight:700, color: t.textPrimary, marginBottom:12 }}>Adicionar crédito avulso — {org?.entidade}</div>
                  <input type="text" value={creditoForm.descricao}
                    onChange={ev => setCreditoForm(f => ({ ...f, descricao: ev.target.value }))}
                    placeholder="Descrição (ex: Torneio Regional Sub-18)"
                    style={{ ...s.input, marginBottom:8 }} />
                  <div style={{ fontSize:11, color: t.textMuted, marginBottom:4 }}>Vincular a evento existente (opcional):</div>
                  <select value={creditoForm.eventoId}
                    onChange={ev => {
                      const evId = ev.target.value;
                      const evSel = eventos.find(e => e.id === evId);
                      setCreditoForm(f => ({ ...f, eventoId: evId, descricao: f.descricao || evSel?.nome || "" }));
                    }}
                    style={{ ...s.input, marginBottom:12 }}>
                    <option value="">— Crédito livre (sem evento) —</option>
                    {eventos.filter(ev => ev.organizadorId === org?.id).map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.nome} {ev.data ? `(${new Date(ev.data+"T12:00:00").toLocaleDateString("pt-BR")})` : ""}</option>
                    ))}
                  </select>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => {
                      const evVinculado = creditoForm.eventoId || null;
                      const novoCredito = {
                        id: Date.now().toString(),
                        descricao: creditoForm.descricao.trim(),
                        eventoId: evVinculado,
                        consumidoEm: evVinculado ? new Date().toISOString() : null,
                        criadoEm: new Date().toISOString(),
                        criadoPor: usuarioLogado?.nome || "admin",
                      };
                      const creditos = [...(org.creditosAvulso || []), novoCredito];
                      editarOrganizadorAdmin({ ...org, creditosAvulso: creditos });
                      const evNome = evVinculado ? eventos.find(e => e.id === evVinculado)?.nome : null;
                      registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Adicionou crédito avulso",
                        `${org.entidade}: ${creditoForm.descricao || "sem descrição"}${evNome ? ` → ${evNome}` : ""}`, null, { modulo: "licencas" });
                      setCreditoForm({ orgId: null, descricao: "", eventoId: "" });
                    }} style={{ ...s.btnPrimary, fontSize:12, padding:"8px 16px" }}>Adicionar</button>
                    <button onClick={() => setCreditoForm({ orgId: null, descricao: "", eventoId: "" })}
                      style={{ ...s.btnGhost, fontSize:12, padding:"8px 16px" }}>Cancelar</button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Modal: Suspender */}
          {suspenderForm.orgId && (() => {
            const org = organizadores.find(o => o.id === suspenderForm.orgId);
            return (
              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center" }}
                onClick={() => setSuspenderForm({ orgId: null, motivo: "inadimplencia" })}>
                <div style={{ background: t.bgCard, border:`1px solid ${t.danger}`, borderRadius:12, padding:24, maxWidth:400, width:"90%" }}
                  onClick={ev => ev.stopPropagation()}>
                  <div style={{ fontWeight:700, color: t.danger, marginBottom:12 }}>Suspender conta — {org?.entidade}</div>
                  <select value={suspenderForm.motivo}
                    onChange={ev => setSuspenderForm(f => ({ ...f, motivo: ev.target.value }))}
                    style={{ ...s.input, marginBottom:12 }}>
                    <option value="inadimplencia">Inadimplência</option>
                    <option value="mau_uso">Mau uso</option>
                    <option value="outro">Outro</option>
                  </select>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => {
                      editarOrganizadorAdmin({ ...org, suspenso: true, suspensoMotivo: suspenderForm.motivo, suspensoEm: new Date().toISOString() });
                      registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Suspendeu conta",
                        `${org.entidade}: ${suspenderForm.motivo}`, null, { modulo: "licencas" });
                      setSuspenderForm({ orgId: null, motivo: "inadimplencia" });
                    }} style={{ background: t.danger, color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", fontSize:12, fontWeight:700, cursor:"pointer" }}>Confirmar Suspensão</button>
                    <button onClick={() => setSuspenderForm({ orgId: null, motivo: "inadimplencia" })}
                      style={{ ...s.btnGhost, fontSize:12, padding:"8px 16px" }}>Cancelar</button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Detalhes dos créditos */}
          {organizadores.filter(o => (o.creditosAvulso || []).length > 0).length > 0 && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color: t.textPrimary, marginBottom:10 }}>Detalhes dos Créditos Avulso</div>
              {organizadores.filter(o => (o.creditosAvulso || []).length > 0).map(org => (
                <div key={org.id} style={{ marginBottom:12, background: t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 14px" }}>
                  <div style={{ fontSize:12, fontWeight:700, color: t.accent, marginBottom:6 }}>{org.entidade || org.nome}</div>
                  {(org.creditosAvulso || []).map(c => {
                    const ev = c.eventoId ? eventos.find(e => e.id === c.eventoId) : null;
                    return (
                      <div key={c.id} style={{ display:"flex", gap:8, alignItems:"center", fontSize:11, padding:"3px 0", borderBottom:`1px solid ${t.border}22` }}>
                        <span style={{ color: c.eventoId ? t.success : t.accent, fontWeight:600, width:60 }}>
                          {c.eventoId ? "Usado" : "Disponível"}
                        </span>
                        <span style={{ color: t.textSecondary, flex:1 }}>{c.descricao || "—"}</span>
                        {ev && <span style={{ color: t.textMuted }}>→ {ev.nome}</span>}
                        <span style={{ color: t.textDimmed, fontSize:10 }}>
                          {c.eventoId ? new Date(c.consumidoEm).toLocaleDateString("pt-BR") : new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Backups de orgs excluídos (D.3.4 — reimplantação) */}
          {organizadores.filter(o => o.exportacaoUrl).length > 0 && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color: t.textPrimary, marginBottom:10 }}>Backups para Reimplantação (D.3.4)</div>
              {organizadores.filter(o => o.exportacaoUrl).map(org => (
                <div key={org.id} style={{ display:"flex", alignItems:"center", gap:12, fontSize:12, padding:"8px 14px", background: t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, marginBottom:6 }}>
                  <strong style={{ color: t.textPrimary }}>{org.entidade || org.nome}</strong>
                  <span style={{ color: t.textDimmed }}>Excluído em {new Date(org.dadosExcluidosEm).toLocaleDateString("pt-BR")}</span>
                  <a href={org.exportacaoUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: t.accent, textDecoration:"underline", marginLeft:"auto" }}>Baixar backup</a>
                </div>
              ))}
              <div style={{ fontSize:10, color: t.textDimmed, marginTop:4 }}>Cópias mantidas por 6 meses após o encerramento.</div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: HISTÓRICO
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "historico" && (() => {
        const todas = historicoAcoes || [];
        return (
          <div style={s.card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:14 }}>
              <div style={s.sectionHd}>Histórico de Ações</div>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <span style={{ fontSize:12, color: t.textDimmed }}>{_histFiltradas.length} de {todas.length} · máx. 500</span>
                {todas.length > 0 && setHistoricoAcoes && (
                  <>
                    <button
                      onClick={() => {
                        if (!window.confirm(`Apagar as entradas mais antigas?\n\nSerão mantidas apenas as 100 mais recentes das ${todas.length} existentes.`)) return;
                        setHistoricoAcoes(p => p.slice(0, 100));
                        registrarAcao?.(usuarioLogado.id, usuarioLogado.nome, "Limpou histórico de ações (manteve 100)", "", null, { modulo: "sistema" });
                      }}
                      style={{ ...s.btnGhost, fontSize:11, padding:"4px 12px", color:"#e67e22", borderColor:`${t.warning}44` }}>
                      Manter últimas 100
                    </button>
                    <button
                      onClick={() => {
                        if (!window.confirm(`Apagar TODO o histórico de ações?\n\nEsta ação é IRREVERSÍVEL e não pode ser desfeita.`)) return;
                        setHistoricoAcoes([]);
                        registrarAcao?.(usuarioLogado.id, usuarioLogado.nome, "Apagou todo o histórico de ações", "", null, { modulo: "sistema" });
                      }}
                      style={{ ...s.btnGhost, fontSize:11, padding:"4px 12px", color: t.danger, borderColor:`${t.danger}44` }}>
                      Apagar tudo
                    </button>
                  </>
                )}
              </div>
            </div>


            {todas.length === 0 ? (
              <div style={s.empty}>Nenhuma ação registrada.</div>
            ) : (
              <>
                <input type="text" value={buscaHist} onChange={e=>setBuscaHist(e.target.value)}
                  placeholder="Buscar ação, usuário, módulo..." style={si} />
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead><tr><Th>Data/Hora</Th><Th>Usuário</Th><Th>Ação</Th><Th>Detalhe</Th><Th>Módulo</Th></tr></thead>
                    <tbody>
                      {histPag.map((h, idx) => (
                        <tr key={`h_${h.id}_${idx}`} style={s.tr}>
                          <Td style={{ fontSize:11, color: t.textDimmed, whiteSpace:"nowrap" }}>
                            {new Date(h.data).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"})}
                          </Td>
                          <Td><span style={{ color: t.accent, fontSize:12 }}>{typeof h.nomeUsuario === "object" ? JSON.stringify(h.nomeUsuario) : h.nomeUsuario||"—"}</span></Td>
                          <Td><strong style={{ color: t.textPrimary, fontSize:12 }}>{typeof h.acao === "object" ? JSON.stringify(h.acao) : h.acao}</strong></Td>
                          <Td style={{ fontSize:12, color: t.textMuted }}>{typeof h.detalhe === "object" ? JSON.stringify(h.detalhe) : h.detalhe||"—"}</Td>
                          <Td><span style={{ color: t.textDimmed, fontSize:10 }}>{h.modulo||"—"}</span></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <PaginaControles {...histInfo} />
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: PORTABILIDADE DE DADOS (Art. 18º, V LGPD)
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "portabilidade" && (() => {
        // Função que monta o JSON de dados do titular
        const gerarDadosTitular = (sol) => {
          const hoje = new Date().toISOString();
          const dados = {
            gerentrack_portabilidade: true,
            versao: "1.0",
            geradoEm: hoje,
            titular: {
              id:   sol.usuarioId,
              nome: sol.usuarioNome,
              tipo: sol.usuarioTipo,
              email: sol.email,
            },
            aviso: "Este arquivo contém seus dados pessoais conforme Art. 18º, V da Lei nº 13.709/2018 (LGPD).",
          };

          // Dados do perfil do usuário
          const stores = {
            atleta:      atletasUsuarios,
            equipe:      equipes,
            organizador: organizadores,
            funcionario: funcionarios,
            treinador:   treinadores,
          };
          const perfil = (stores[sol.usuarioTipo] || []).find(u => u.id === sol.usuarioId);
          if (perfil) {
            const { senha, senhaTemporaria, ...perfilSemSenha } = perfil;
            dados.perfil = perfilSemSenha;
          }

          // Atleta base (para atletas)
          if (sol.usuarioTipo === "atleta") {
            const atletaBase = atletas.find(a =>
              a.atletaUsuarioId === sol.usuarioId ||
              (perfil?.cpf && a.cpf && a.cpf.replace(/\D/g,"") === perfil.cpf.replace(/\D/g,""))
            );
            if (atletaBase) {
              dados.atletaBase = atletaBase;
              // Inscrições
              dados.inscricoes = inscricoes
                .filter(i => i.atletaId === atletaBase.id)
                .map(i => ({
                  eventoId:   i.eventoId,
                  eventoNome: eventos.find(e => e.id === i.eventoId)?.nome || i.eventoId,
                  provaId:    i.provaId,
                  provaNome:  i.provaNome || i.provaId,
                  categoria:  i.categoria,
                  data:       i.dataCadastro || null,
                }));
              // Resultados
              const meusResultados = [];
              Object.entries(resultados || {}).forEach(([chave, docRes]) => {
                if (docRes && docRes[atletaBase.id] != null) {
                  meusResultados.push({ chave, resultado: docRes[atletaBase.id] });
                }
              });
              dados.resultados = meusResultados;
            }
          }

          // Atletas vinculados (para equipes)
          if (sol.usuarioTipo === "equipe") {
            dados.atletasVinculados = atletas
              .filter(a => a.equipeId === sol.usuarioId)
              .map(a => ({ id: a.id, nome: a.nome, categoria: a.categoria, sexo: a.sexo }));
          }

          return JSON.stringify(dados, null, 2);
        };

        const todasSols = [...(solicitacoesPortabilidade || [])]
          .sort((a, b) => new Date(b.data) - new Date(a.data));

        return (
          <div style={{ maxWidth: 860 }}>
            <div style={{ ...s.card, borderColor:"#a855f733" }}>
              <div style={{ fontFamily: t.fontTitle, fontSize:18, fontWeight:800,
                color:"#a855f7", marginBottom:8, letterSpacing:1 }}>
                Solicitações de Portabilidade de Dados
              </div>
              <p style={{ color: t.textDimmed, fontSize:13, marginBottom:16, lineHeight:1.6 }}>
                Art. 18º, V da LGPD — O titular tem direito a receber cópia dos seus dados em formato estruturado.
                Clique em <strong style={{ color: t.textPrimary }}>Gerar e Liberar</strong> para aprovar e disponibilizar o arquivo ao titular.
              </p>

              {todasSols.length === 0 ? (
                <div style={s.empty}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:t.textDimmed}}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>
                  <p>Nenhuma solicitação de portabilidade ainda.</p>
                </div>
              ) : (
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead><tr>
                      <Th>Titular</Th>
                      <Th>Perfil</Th>
                      <Th>E-mail</Th>
                      <Th>Solicitado em</Th>
                      <Th>Status</Th>
                      <Th>Ação</Th>
                    </tr></thead>
                    <tbody>
                      {todasSols.map(sol => {
                        const isPendente = sol.status === "pendente";
                        const isPronto   = sol.status === "pronto";
                        const tipoLabel  = { atleta:"Atleta", equipe:"Equipe", organizador:"Org.", funcionario:"Func.", treinador:"Trein." };
                        const diasDesde = isPendente ? Math.floor((Date.now() - new Date(sol.data).getTime()) / 86400000) : 0;
                        const prazoVencido = diasDesde > 15;
                        const prazoUrgente = diasDesde > 12 && !prazoVencido;
                        return (
                          <tr key={sol.id} style={{ ...s.tr, ...(prazoVencido ? { background:"#ef444415" } : prazoUrgente ? { background:"#f59e0b12" } : {}) }}>
                            <Td><strong style={{ color: t.textPrimary }}>{sol.usuarioNome || "—"}</strong></Td>
                            <Td style={{ fontSize:12 }}>{tipoLabel[sol.usuarioTipo] || sol.usuarioTipo}</Td>
                            <Td style={{ fontSize:12 }}>{sol.email || "—"}</Td>
                            <Td>
                              <div style={{ fontSize:11, color: t.textDimmed }}>{new Date(sol.data).toLocaleString("pt-BR")}</div>
                              {isPendente && prazoVencido && <div style={{ fontSize:10, color:"#ef4444", fontWeight:700, marginTop:2 }}>Prazo expirado ({diasDesde} dias)</div>}
                              {isPendente && prazoUrgente && <div style={{ fontSize:10, color:"#f59e0b", fontWeight:700, marginTop:2 }}>Prazo expira em {15 - diasDesde} dia(s)</div>}
                            </Td>
                            <Td>
                              <span style={{
                                background: isPendente ? "#a855f715" : isPronto ? `${t.success}15` : t.bgCardAlt,
                                color:      isPendente ? "#a855f7" : isPronto ? t.success : t.textMuted,
                                border:     `1px solid ${isPendente ? "#a855f744" : isPronto ? `${t.success}66` : t.border}`,
                                borderRadius:10, padding:"2px 10px", fontSize:11, fontWeight:700,
                              }}>
                                {isPendente ? "Pendente" : isPronto ? "Pronto" : sol.status}
                              </span>
                            </Td>
                            <Td>
                              <div style={{ display:"flex", gap:6 }}>
                                {isPendente && (
                                  <button onClick={() => {
                                    const json = gerarDadosTitular(sol);
                                    resolverSolicitacaoPortabilidade(sol.id, json);
                                  }}
                                    style={{ ...s.btnGhost, fontSize:11, padding:"4px 12px", color:"#a855f7", borderColor:"#a855f744" }}>
                                    Gerar e Liberar
                                  </button>
                                )}
                                {isPronto && (
                                  <button onClick={() => {
                                    const blob = new Blob([sol.dadosJson], { type:"application/json" });
                                    const url  = URL.createObjectURL(blob);
                                    const a    = document.createElement("a");
                                    a.href     = url;
                                    a.download = `portabilidade-${sol.usuarioNome?.replace(/\s/g,"-") || sol.usuarioId}-${sol.data.slice(0,10)}.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }}
                                    style={{ ...s.btnGhost, fontSize:11, padding:"4px 12px", color:t.success, borderColor:`${t.success}66` }}>
                                    Baixar Cópia
                                  </button>
                                )}
                                <button onClick={() => excluirSolicitacaoPortabilidade(sol.id)}
                                  style={{ ...s.btnGhost, fontSize:11, padding:"4px 10px", color: t.danger, borderColor:`${t.danger}44` }}
                                  title="Excluir solicitação">
                                  ✕
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
              <div style={{ fontSize:11, color: t.textDimmed, marginTop:10, lineHeight:1.6 }}>
                A LGPD exige atendimento em prazo razoável — recomendado até <strong style={{ color: t.textMuted }}>15 dias</strong> da solicitação (Art. 19º).
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal de Transferência ── */}
      {modalTransf && (
        <div style={{ position:"fixed", inset:0, background:"#000a", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={() => setModalTransf(null)}>
          <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:14, padding:28, width:420, maxWidth:"95vw" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: t.fontTitle, fontSize:22, fontWeight:800, color: t.textPrimary, marginBottom:4 }}>
              Transferir Atleta
            </h3>
            <p style={{ color: t.textMuted, fontSize:13, marginBottom:20 }}>{modalTransf.atleta.nome}</p>

            <div style={{ marginBottom:12 }}>
              <label style={{ color: t.textTertiary, fontSize:12, display:"block", marginBottom:4 }}>Equipe atual</label>
              <div style={{ color: t.textPrimary, fontSize:14, padding:"8px 12px", background:t.bgInput, borderRadius:6, border:`1px solid ${t.borderInput}` }}>
                {equipes.find(e => e.id === modalTransf.atleta.equipeId)?.nome || <span style={{ color: t.textDimmed }}>Sem equipe</span>}
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ color: t.textTertiary, fontSize:12, display:"block", marginBottom:4 }}>Nova equipe *</label>
              <select value={transfEquipeId} onChange={e => setTransfEquipeId(e.target.value)}
                style={{ width:"100%", background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:6, color: t.textPrimary, padding:"8px 12px", fontSize:13 }}>
                <option value="">Selecione a equipe de destino...</option>
                {[...equipes]
                  .filter(e => e.id !== modalTransf.atleta.equipeId && (e.status === "ativa" || e.status === "aprovado"))
                  .sort((a,b) => (a.nome||"").localeCompare(b.nome||"", "pt-BR"))
                  .map(e => <option key={e.id} value={e.id}>{e.nome} ({e.sigla||"—"})</option>)
                }
              </select>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button style={{ ...s.btnPrimary, flex:1 }} onClick={async () => {
                if (!transfEquipeId) { alert("Selecione a equipe de destino."); return; }
                const novaEquipe = equipes.find(e => e.id === transfEquipeId);
                const atletaAtualizado = { ...modalTransf.atleta, equipeId: transfEquipeId, clube: novaEquipe?.nome || "" };
                await atualizarAtleta(atletaAtualizado);
                if (usuarioLogado) {
                  const equipeOrigem = equipes.find(e => e.id === modalTransf.atleta.equipeId)?.nome || "Sem equipe";
                  registrarAcao?.(usuarioLogado.id, usuarioLogado.nome, "Transferiu atleta",
                    `${modalTransf.atleta.nome}: ${equipeOrigem} → ${novaEquipe?.nome}`, null, { modulo: "atletas" });
                }
                setModalTransf(null);
                setTransfEquipeId("");
              }}>Confirmar Transferência</button>
              <button style={{ ...s.btnGhost }} onClick={() => setModalTransf(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default TelaAdmin;
