import React, { useState } from "react";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, db, getDoc, doc, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut } from "../../firebase";
import { _getClubeAtleta } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";
import TelaPrivacidade from "../legal/TelaPrivacidade";
import TelaTermos from "../legal/TelaTermos";
import { getEncerramento } from "../../shared/engines/planEngine";

// SVG icons para substituir emojis
const SvgLock = ({ size = 48, color = "#f5c542" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
const SvgKey = ({ size = 36, color = "#f5c542" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);
const SvgShield = ({ size = 36, color = "#f5c542" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

function getStyles(t) {
  return {
    page:       { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
    formPage:   { maxWidth: 640, margin: "60px auto", padding: "0 24px 80px" },
    formCard:   { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32, marginBottom: 20 },
    formIcon:   { fontSize: 48, textAlign: "center", marginBottom: 16 },
    formTitle:  { fontFamily: t.fontTitle, fontSize: 32, fontWeight: 800, color: t.textPrimary, textAlign: "center", marginBottom: 8 },
    formSub:    { color: t.textDimmed, textAlign: "center", fontSize: 14, marginBottom: 24 },
    formLink:   { textAlign: "center", marginTop: 16, color: t.textDimmed, fontSize: 13 },
    label:      { display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
    input:      { width: "100%", background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: t.fontBody, outline: "none", marginBottom: 4 },
    select:     { width: "100%", background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: t.fontBody, outline: "none", marginBottom: 4 },
    btnPrimary: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: t.fontTitle, letterSpacing: 1, width: "100%", transition: "all 0.2s" },
    btnSecondary:{ background: "transparent", color: t.accent, border: `2px solid ${t.accent}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: t.fontTitle, letterSpacing: 1 },
    btnGhost:   { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: t.fontBody },
    erro:       { background: `${t.danger}15`, border: `1px solid ${t.danger}`, color: t.danger, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
    linkBtn:    { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: t.fontBody, padding: 0 },
    emptyState: { textAlign: "center", padding: "60px 20px", color: t.textDisabled, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },
    badge:      (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  };
}

function TelaLogin({ adminConfig, setOrganizadores, setAtletasUsuarios, setFuncionarios, setTreinadores }) {
  // Props extras de segurança (adminConfig, setters) injetadas explicitamente no App.jsx
  const { login, loginComSelecao, setPerfisDisponiveis } = useAuth();
  const { equipes, atletas: atletasBase, atualizarEquipePerfil } = useEvento();
  const { setTela, organizadores, atletasUsuarios, funcionarios, treinadores, registrarAcao } = useApp();
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const [ident,   setIdent]   = useState("");
  const [senha,   setSenha]   = useState("");
  const [erro,    setErro]    = useState("");
  const [loading, setLoading] = useState(false);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [feedbackRecuperar, setFeedbackRecuperar] = useState("");

  // ── Consentimento LGPD retroativo ────────────────────────────────────────
  const [modoConsentimento, setModoConsentimento] = useState(false);
  const [consentimentoPerfis, setConsentimentoPerfis] = useState([]); // perfis encontrados aguardando consentimento
  const [consentimentoAceite, setConsentimentoAceite] = useState(false);
  const [modalLegal, setModalLegal] = useState(null); // null | "privacidade" | "termos"

  const matchIdent = (u, googleEmail) => {
    if (!u) return false;
    // Google login: busca por email principal OU googleEmail vinculado
    if (googleEmail) {
      const ge = googleEmail.toLowerCase();
      return (u.email && u.email.toLowerCase() === ge) ||
             (u.googleEmail && u.googleEmail.toLowerCase() === ge);
    }
    const identTrimmed = ident.trim().toLowerCase();
    const identSemPont = ident.replace(/[\.\-\/]/g, "").trim().toLowerCase();
    const emailOk  = u.email && u.email.toLowerCase() === identTrimmed;
    const cpfOk    = u.cpf   && u.cpf.replace(/[\.\-\/]/g,"")  === identSemPont;
    const cnpjOk   = u.cnpj  && u.cnpj.replace(/[\.\-\/]/g,"") === identSemPont;
    return emailOk || cpfOk || cnpjOk;
  };

  const buscarPerfis = (googleEmail) => {
    const perfisEncontrados = [];
    organizadores.filter(o => matchIdent(o, googleEmail) && o.status === "aprovado").forEach(o => {
      perfisEncontrados.push({ tipo:"organizador", dados:{ tipo:"organizador", ...o }, label:`Organizador — ${o.entidade}`, icon:"", sublabel:o.nome, organizadorId:o.id, organizadorNome:o.entidade });
    });
    funcionarios.filter(f => matchIdent(f, googleEmail) && f.ativo !== false).forEach(f => {
      const org = organizadores.find(o => o.id === f.organizadorId);
      if (!org || org.status !== "aprovado") return;
      perfisEncontrados.push({ tipo:"funcionario", dados:{ tipo:"funcionario", ...f, entidade:org.entidade, orgNome:org.nome }, label:`Funcionário — ${org.entidade}`, icon:"", sublabel:f.nome, organizadorId:f.organizadorId, organizadorNome:org.entidade });
    });
    equipes.filter(eq => matchIdent(eq, googleEmail) && eq.status !== "pendente" && eq.status !== "recusado").forEach(eq => {
      const org = organizadores.find(o => o.id === eq.organizadorId);
      perfisEncontrados.push({ tipo:"equipe", dados:{ tipo:"equipe", ...eq }, label:`Equipe — ${eq.entidade || eq.nome}`, icon:"", sublabel:org ? org.entidade : "Sem organizador", organizadorId:eq.organizadorId, organizadorNome:org?.entidade || "" });
    });
    treinadores.filter(tr => matchIdent(tr, googleEmail) && tr.ativo !== false).forEach(tr => {
      const equipeVinc = equipes.find(eq => eq.id === tr.equipeId);
      const org = organizadores.find(o => o.id === (tr.organizadorId || equipeVinc?.organizadorId));
      perfisEncontrados.push({ tipo:"treinador", dados:{ tipo:"treinador", ...tr, clube:equipeVinc?.clube, equipeNome:equipeVinc?.nome }, label:`Treinador — ${equipeVinc?.nome || "Equipe"}`, icon:"", sublabel:org ? org.entidade : "", organizadorId:tr.organizadorId || equipeVinc?.organizadorId, organizadorNome:org?.entidade || "" });
    });
    atletasUsuarios.filter(a => matchIdent(a, googleEmail) && a.status !== "pendente" && a.status !== "recusado").forEach(a => {
      const org = organizadores.find(o => o.id === a.organizadorId);
      perfisEncontrados.push({ tipo:"atleta", dados:{ tipo:"atleta", ...a }, label:`Atleta${_getClubeAtleta(a, equipes) ? ` — ${_getClubeAtleta(a, equipes)}` : ""}`, icon:"", sublabel:org ? org.entidade : "Sem organizador", organizadorId:a.organizadorId, organizadorNome:org?.entidade || "" });
    });
    return perfisEncontrados;
  };

  const encontrarEmail = () => {
    const identTrimmed = ident.trim().toLowerCase();
    if (identTrimmed.includes("@")) return identTrimmed;
    const todos = [...organizadores, ...funcionarios, ...equipes, ...treinadores, ...atletasUsuarios];
    const match = todos.find(u => matchIdent(u));
    if (match?.email) return match.email.toLowerCase();
    if (atletasBase) {
      const atlMatch = atletasBase.find(a => matchIdent(a));
      if (atlMatch?.email) return atlMatch.email.toLowerCase();
    }
    return null;
  };

  // ── Grava consentimento retroativo em todos os perfis encontrados ─────────
  const gravarConsentimento = (perfis) => {
    const agora = new Date().toISOString();
    const LGPD_VERSAO_ATUAL = "2.0";
    const campos = { lgpdConsentimento: true, lgpdConsentimentoData: agora, lgpdVersao: LGPD_VERSAO_ATUAL };

    perfis.forEach(p => {
      const id = p.dados?.id;
      if (!id) return;
      switch (p.tipo) {
        case "equipe":
          if (atualizarEquipePerfil) {
            const eq = equipes.find(e => e.id === id);
            if (eq) atualizarEquipePerfil({ ...eq, ...campos });
          }
          break;
        case "organizador":
          if (setOrganizadores) setOrganizadores(arr => arr.map(u => u.id === id ? { ...u, ...campos } : u));
          break;
        case "atleta":
          if (setAtletasUsuarios) setAtletasUsuarios(arr => arr.map(u => u.id === id ? { ...u, ...campos } : u));
          break;
        case "funcionario":
          if (setFuncionarios) setFuncionarios(arr => arr.map(u => u.id === id ? { ...u, ...campos } : u));
          break;
        case "treinador":
          if (setTreinadores) setTreinadores(arr => arr.map(u => u.id === id ? { ...u, ...campos } : u));
          break;
        default: break;
      }
    });

    if (registrarAcao && perfis[0]) {
      const p = perfis[0];
      const jaAceitouAntes = p.dados?.lgpdConsentimento && p.dados?.lgpdVersao;
      registrarAcao(p.dados?.id, p.dados?.nome || p.sublabel,
        jaAceitouAntes ? "Consentimento LGPD — atualização" : "Consentimento LGPD — primeiro aceite",
        `Política de Privacidade v2.0 ${jaAceitouAntes ? "atualizada" : "aceita"}`, p.organizadorId || null, { modulo: "lgpd" });
    }
  };

  // ── Verifica se precisa de consentimento antes de prosseguir ──────────────
  // Consulta o Firestore diretamente para evitar falso positivo quando o
  // onSnapshot ainda não sincronizou no novo dispositivo.
  const finalizarLoginComConsentimento = async (perfis) => {
    const COLECOES = {
      atleta:      "atl_atletas_usuarios", // useLocalStorage → state/{key}
      organizador: "atl_organizadores",
      funcionario: "atl_funcionarios",
      treinador:   "atl_treinadores",
    };

    const LGPD_VERSAO_ATUAL = "2.0";
    let precisaConsentimento = false;

    for (const p of perfis) {
      // Equipes ficam na coleção própria "equipes/"
      if (p.tipo === "equipe") {
        if (!p.dados?.lgpdConsentimento || p.dados?.lgpdVersao !== LGPD_VERSAO_ATUAL) {
          try {
            const snap = await getDoc(doc(db, "equipes", p.dados?.id));
            if (snap.exists() && snap.data()?.lgpdConsentimento && snap.data()?.lgpdVersao === LGPD_VERSAO_ATUAL) continue;
          } catch (_) {}
          precisaConsentimento = true;
          break;
        }
        continue;
      }
      // Demais tipos ficam em state/{chave} via useLocalStorage
      if (!p.dados?.lgpdConsentimento || p.dados?.lgpdVersao !== LGPD_VERSAO_ATUAL) {
        precisaConsentimento = true;
        break;
      }
    }

    if (precisaConsentimento) {
      setConsentimentoPerfis(perfis);
      setModoConsentimento(true);
      return;
    }
    finalizarLogin(perfis);
  };

  const finalizarLogin = (perfisEncontrados) => {
    // Check de suspensão e encerramento: marcar perfis bloqueados
    const perfisComSuspensao = perfisEncontrados.map(p => {
      const orgId = p.organizadorId || (p.tipo === "organizador" ? p.dados?.id : null);
      if (!orgId) return p;
      const org = organizadores.find(o => o.id === orgId);
      if (org?.suspenso) return { ...p, _suspenso: true, _suspensoMotivo: org.suspensoMotivo };
      const enc = getEncerramento(org);
      if (enc.faseEncerramento && enc.faseEncerramento >= 2) return { ...p, _suspenso: true, _suspensoMotivo: "encerrado" };
      if (enc.faseEncerramento === 1) return { ...p, _encerrandoEm: 7 - enc.diasDesdeEncerramento };
      return p;
    });
    const perfisAtivos = perfisComSuspensao.filter(p => !p._suspenso);

    // Se todos suspensos, mostrar mensagem
    if (perfisComSuspensao.length > 0 && perfisAtivos.length === 0) {
      const perfilOrg = perfisComSuspensao.find(p => p.tipo === "organizador");
      if (perfilOrg) {
        const mot = perfilOrg._suspensoMotivo;
        const motivo = mot === "encerrado"
          ? "Contrato encerrado. Seus dados estão indisponíveis. Para reestabelecer, entre em contato com atendimento@gerentrack.com.br."
          : mot === "inadimplencia"
            ? "Conta suspensa por inadimplência. Entre em contato com atendimento@gerentrack.com.br."
            : mot === "mau_uso"
              ? "Conta suspensa por violação dos Termos de Uso. Entre em contato com atendimento@gerentrack.com.br."
              : "Conta suspensa. Entre em contato com atendimento@gerentrack.com.br.";
        setErro(motivo);
      } else {
        const temEncerrado = perfisComSuspensao.some(p => p._suspensoMotivo === "encerrado");
        setErro(temEncerrado
          ? "O acesso à plataforma está encerrado para sua organização. Entre em contato com o organizador responsável."
          : "O acesso à plataforma está temporariamente indisponível para sua organização. Entre em contato com o organizador responsável.");
      }
      return;
    }
    // Se tem mix de suspensos e ativos, passar todos (suspensos marcados) para seleção de perfil
    perfisEncontrados = perfisComSuspensao;
    if (perfisEncontrados.length === 0) {
      const pendentes = [...organizadores.filter(o => matchIdent(o) && o.status === "pendente"), ...equipes.filter(eq => matchIdent(eq) && eq.status === "pendente"), ...atletasUsuarios.filter(a => matchIdent(a) && a.status === "pendente")];
      const recusados = [...organizadores.filter(o => matchIdent(o) && o.status === "recusado"), ...equipes.filter(eq => matchIdent(eq) && eq.status === "recusado"), ...atletasUsuarios.filter(a => matchIdent(a) && a.status === "recusado")];
      if (pendentes.length > 0) { setErro("Seu cadastro ainda está aguardando aprovação do administrador."); return; }
      if (recusados.length > 0) { setErro("Seu cadastro foi recusado. Entre em contato com o administrador."); return; }
      if (atletasBase) {
        const atlBase = atletasBase.find(a => matchIdent(a));
        if (atlBase) {
          const dadosAtleta = { tipo:"atleta", ...atlBase, senhaTemporaria:true };
          loginComSelecao(dadosAtleta, [{ tipo:"atleta", dados:dadosAtleta, label:`Atleta`, icon:"", sublabel:"", organizadorId:atlBase.organizadorId }]);
          return;
        }
      }
      setErro("Credenciais válidas, mas nenhum perfil ativo encontrado. Entre em contato com o administrador.");
      return;
    }
    // Se só 1 perfil e não suspenso, login direto
    if (perfisAtivos.length === 1 && perfisEncontrados.length === 1) {
      const p = perfisEncontrados[0];
      loginComSelecao({ ...p.dados, _organizadorNome:p.organizadorNome, _temOutrosPerfis:false }, perfisEncontrados);
      return;
    }
    // Múltiplos perfis ou mix com suspensos → tela de seleção
    setPerfisDisponiveis(perfisEncontrados);
    setTela("selecionar-perfil");
  };

  const handleLogin = async () => {
    setErro("");
    if (!ident || !senha) { setErro("Preencha o identificador e a senha."); return; }
    const identTrimmed = ident.trim().toLowerCase();

    // ── Admin: autenticação 100% via Firebase Auth ───────────────────────────
    // Sem comparação local de senha — Firebase gerencia a credencial
    const adminIdents = [adminConfig.email.toLowerCase(), "admin"];
    if (adminIdents.includes(identTrimmed)) {
      setLoading(true); setLoadingMsg("Verificando credenciais...");
      try {
        await signInWithEmailAndPassword(auth, adminConfig.email, senha);
        setLoadingMsg("Bem-vindo!");
        login({ tipo:"admin", nome:adminConfig.nome, email:adminConfig.email });
      } catch (err) {
        if (err.code === "auth/too-many-requests") {
          setErro("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
        } else {
          setErro("Senha incorreta.");
        }
      } finally { setLoading(false); setLoadingMsg(""); }
      return;
    }

    // ── Demais usuários: Firebase Auth é a fonte de verdade ──────────────────
    const emailParaAuth = encontrarEmail();
    if (!emailParaAuth) { setErro("E-mail, CPF ou CNPJ não encontrado."); return; }
    setLoading(true); setLoadingMsg("Verificando credenciais...");
    try {
      await signInWithEmailAndPassword(auth, emailParaAuth, senha);
      setLoadingMsg("Carregando perfis...");
      const perfis = buscarPerfis();
      finalizarLoginComConsentimento(perfis);
    } catch (firebaseErr) {
      // ── Migração / recuperação de senhas divergidas ───────────────────────────
      // Entra aqui se o Auth não reconheceu a senha.
      const codigoFalhou = ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"];
      if (codigoFalhou.includes(firebaseErr.code)) {
        const todos = [...organizadores, ...funcionarios, ...equipes, ...treinadores, ...atletasUsuarios];
        const matchLocal = todos.find(u => matchIdent(u) && u.senha === senha);
        if (matchLocal) {
          try {
            // Tenta criar conta nova (usuário legado sem Auth)
            await createUserWithEmailAndPassword(auth, emailParaAuth, senha);
            await signInWithEmailAndPassword(auth, emailParaAuth, senha);
            const perfis = buscarPerfis();
            finalizarLoginComConsentimento(perfis);
            return;
          } catch (migrErr) {
            if (migrErr.code === "auth/email-already-in-use") {
              // Conta Auth existe mas senha divergiu — envia reset e avisa o usuário
              await sendPasswordResetEmail(auth, emailParaAuth).catch(() => {});
              setErro("Sua senha precisa ser redefinida. Enviamos um link de redefinição para " + emailParaAuth + ". Verifique sua caixa de entrada.");
              return;
            }
            // outro erro de migração — cai no erro genérico abaixo
          }
        }
      }
      if (firebaseErr.code === "auth/too-many-requests") {
        setErro("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
      } else {
        setErro("E-mail, CPF ou senha incorretos.");
      }
    } finally { setLoading(false); setLoadingMsg(""); }
  };

  const handleRecuperarSenha = async () => {
    setFeedbackRecuperar(""); setErro("");
    if (!emailRecuperar.trim() || !emailRecuperar.includes("@")) { setErro("Informe um e-mail válido."); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailRecuperar.trim());
      setFeedbackRecuperar("E-mail de recuperação enviado! Verifique sua caixa de entrada e spam.");
    } catch (err) {
      setErro(err.code === "auth/user-not-found" ? "E-mail não encontrado." : "Erro ao enviar e-mail. Tente novamente.");
    } finally { setLoading(false); setLoadingMsg(""); }
  };

  // ── Login com Google ──────────────────────────────────────────────────────
  const isPWA = () => window.matchMedia("(display-mode: standalone)").matches || window.navigator?.standalone === true;

  const processGoogleResult = async (result) => {
    if (!result?.user?.email) return;
    const googleEmail = result.user.email;
    const perfis = buscarPerfis(googleEmail);
    if (perfis.length === 0) {
      await firebaseSignOut(auth).catch(() => {});
      setErro("Nenhum perfil encontrado para " + googleEmail + ". Somente usuários já cadastrados podem usar o login com Google.");
      setLoading(false);
      return;
    }
    const perfisGoogle = perfis.map(p => ({
      ...p,
      dados: { ...p.dados, _googleAuth: true, senhaTemporaria: false },
    }));
    finalizarLoginComConsentimento(perfisGoogle);
  };

  const handleGoogleLogin = async () => {
    setErro("");
    setLoading(true);
    setLoadingMsg("Conectando com Google...");
    try {
      if (isPWA()) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      const result = await signInWithPopup(auth, googleProvider);
      await processGoogleResult(result);
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        // usuário fechou o popup, sem erro
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setErro("Este e-mail já está associado a outro método de login. Use e-mail e senha.");
      } else {
        setErro("Erro ao entrar com Google. Tente novamente.");
      }
    } finally { setLoading(false); setLoadingMsg(""); }
  };

  // Handle redirect result (PWA mode)
  React.useEffect(() => {
    getRedirectResult(auth).then(result => {
      if (result?.user) {
        setLoading(true);
        setLoadingMsg("Conectando com Google...");
        processGoogleResult(result);
      }
    }).catch(() => {});
  }, []);

  // ── Tela de Consentimento Retroativo ─────────────────────────────────────
  if (modoConsentimento) return (
    <div style={s.formPage}>
      <LoginStyle />

      {/* Modal Política / Termos inline */}
      {modalLegal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:2000,
          display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={() => setModalLegal(null)}>
          <div style={{ background:t.bgCard, border:`1px solid ${t.accent}`, borderRadius:14,
            padding:"24px 28px", maxWidth:640, width:"100%", maxHeight:"85vh", overflowY:"auto" }}
            onClick={ev => ev.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setModalLegal("privacidade")}
                  style={{ padding:"6px 14px", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer",
                    background: modalLegal === "privacidade" ? t.accent : t.bgInput,
                    color: modalLegal === "privacidade" ? "#fff" : t.textMuted,
                    border:`1px solid ${modalLegal === "privacidade" ? t.accent : t.border}` }}>
                  Política de Privacidade
                </button>
                <button onClick={() => setModalLegal("termos")}
                  style={{ padding:"6px 14px", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer",
                    background: modalLegal === "termos" ? t.accent : t.bgInput,
                    color: modalLegal === "termos" ? "#fff" : t.textMuted,
                    border:`1px solid ${modalLegal === "termos" ? t.accent : t.border}` }}>
                  Termos de Uso
                </button>
              </div>
              <button onClick={() => setModalLegal(null)} style={{ background:"none", border:"none",
                color:t.textMuted, cursor:"pointer", fontSize:20, padding:"4px 8px" }}>✕</button>
            </div>
            {modalLegal === "privacidade" ? <TelaPrivacidade embedded /> : <TelaTermos embedded />}
          </div>
        </div>
      )}

      <div style={{ ...s.formCard, maxWidth:500 }}>
        <div style={{ textAlign:"center", marginBottom:12 }}><SvgShield size={48} /></div>
        <h2 style={s.formTitle}>Atualização da Política de Privacidade</h2>
        <p style={{ ...s.formSub, marginBottom:20 }}>
          Para continuar usando o GerenTrack, precisamos do seu consentimento conforme a
          <strong style={{ color:t.accent }}> Lei Geral de Proteção de Dados (LGPD)</strong>.
        </p>

        {/* Resumo do que será tratado */}
        <div style={{ background:t.bgCardAlt, border:`1px solid ${t.accentBorder}`, borderRadius:10,
          padding:"14px 16px", marginBottom:20, fontSize:13, color:t.textTertiary, lineHeight:1.7 }}>
          <strong style={{ color:t.textPrimary, display:"block", marginBottom:8 }}>Resumo do tratamento:</strong>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {[
              "Seus dados são usados para gestão de competições de atletismo",
              "Não vendemos nem compartilhamos com terceiros externos",
              "Você pode revogar este consentimento a qualquer momento nas Configurações",
              "Resultados esportivos são preservados como registro histórico mesmo após revogação",
            ].map((item, i) => (
              <div key={i} style={{ display:"flex", gap:8 }}>
                <span style={{ color:t.accent, flexShrink:0 }}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Checkbox de aceite */}
        <div style={{ background:t.bgCardAlt, border:`1px solid ${consentimentoAceite ? t.accent : t.borderInput}`,
          borderRadius:10, padding:"14px 16px", marginBottom:20, transition:"border-color 0.2s" }}>
          <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
            <input type="checkbox" checked={consentimentoAceite}
              onChange={e => setConsentimentoAceite(e.target.checked)}
              style={{ marginTop:2, width:16, height:16, cursor:"pointer", flexShrink:0 }} />
            <span style={{ fontSize:13, color:t.textSecondary, lineHeight:1.7 }}>
              Li e concordo com a{" "}
              <button type="button" onClick={() => setModalLegal("privacidade")}
                style={{ background:"none", border:"none", color:t.accent, cursor:"pointer",
                  fontSize:13, padding:0, textDecoration:"underline" }}>
                Política de Privacidade
              </button>
              {" "}e os{" "}
              <button type="button" onClick={() => setModalLegal("termos")}
                style={{ background:"none", border:"none", color:t.accent, cursor:"pointer",
                  fontSize:13, padding:0, textDecoration:"underline" }}>
                Termos de Uso
              </button>
              {" "}e autorizo o tratamento dos meus dados pessoais pelo GerenTrack para fins de
              gestão de competições de atletismo.
            </span>
          </label>
        </div>

        {/* Botões */}
        <button
          style={{ ...s.btnPrimary, opacity: consentimentoAceite ? 1 : 0.4,
            cursor: consentimentoAceite ? "pointer" : "not-allowed", marginBottom:10 }}
          disabled={!consentimentoAceite}
          onClick={() => {
            if (!consentimentoAceite) return;
            gravarConsentimento(consentimentoPerfis);
            finalizarLogin(consentimentoPerfis);
          }}>
          ✓ Aceitar e Entrar no Sistema
        </button>

        <button style={{ ...s.btnGhost, width:"100%", fontSize:13 }}
          onClick={() => {
            // Recusa → logout Firebase e volta ao login
            import("../../firebase").then(({ auth, signOut }) => signOut(auth).catch(() => {}));
            setModoConsentimento(false);
            setConsentimentoAceite(false);
            setConsentimentoPerfis([]);
            setErro("Para usar o sistema é necessário aceitar a Política de Privacidade.");
          }}>
          Recusar e Voltar ao Login
        </button>

        <p style={{ fontSize:11, color:t.textDisabled, textAlign:"center", marginTop:16, lineHeight:1.6 }}>
          Ao recusar, você será desconectado. Seus dados já cadastrados permanecem no sistema
          conforme previsto na LGPD.
        </p>
      </div>
    </div>
  );

  if (modoRecuperar) return (
    <div style={s.formPage}>
      <LoginStyle />
      <div style={{ ...s.formCard, maxWidth:460 }}>
        <div style={s.formIcon}><SvgKey /></div>
        <h2 style={s.formTitle}>Recuperar Senha</h2>
        <p style={s.formSub}>Informe seu e-mail para receber o link de redefinição</p>
        {erro && <div style={s.erro}>{erro}</div>}
        {feedbackRecuperar && <div style={{ ...s.erro, background:`${t.success}15`, color:t.success, borderColor:`${t.success}66` }}>{feedbackRecuperar}</div>}
        <FormField label="E-mail cadastrado" value={emailRecuperar} onChange={setEmailRecuperar} placeholder="seuemail@exemplo.com" />
        <button style={s.btnPrimary} onClick={handleRecuperarSenha} disabled={loading}>{loading ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{width:16,height:16,borderRadius:"50%",border:"2px solid #ffffff44",borderTopColor:"#fff",display:"inline-block",animation:"spin 0.7s linear infinite"}} />Enviando...</span> : "Enviar Link de Recuperação"}</button>
        <div style={{ textAlign:"center", marginTop:16 }}>
          <button style={s.linkBtn} onClick={() => { setModoRecuperar(false); setErro(""); setFeedbackRecuperar(""); }}>← Voltar ao Login</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.formPage}>
      <LoginStyle />
      <div style={{ ...s.formCard, maxWidth:460, position:"relative", overflow:"hidden" }}>
        {loading && <div style={{position:"absolute",inset:0,background:"rgba(10,11,13,0.6)",zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,backdropFilter:"blur(2px)"}}><span style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${t.accentBorder}`,borderTopColor:t.accent,display:"inline-block",animation:"spin 0.7s linear infinite"}} /><span style={{color:t.accent,fontSize:14,fontWeight:600}}>{loadingMsg || "Aguarde..."}</span></div>}
        <h2 style={s.formTitle}>Entrar no Sistema</h2>
        <p style={s.formSub}>Use seu e-mail, CPF ou CNPJ para acessar</p>
        {erro && <div style={s.erro}>{erro}</div>}
        <FormField label="E-mail / CPF / CNPJ" value={ident} onChange={setIdent} placeholder="Digite seu e-mail, CPF ou CNPJ" />
        <div style={{ fontSize:11, color:t.textDimmed, marginTop:3, marginBottom:8 }}>O sistema buscará automaticamente seus perfis cadastrados</div>
        <FormField label="Senha" value={senha} onChange={setSenha} type="password" placeholder="••••••••" />
        <button style={s.btnPrimary} onClick={handleLogin} disabled={loading}>{loading ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{width:16,height:16,borderRadius:"50%",border:"2px solid #ffffff44",borderTopColor:"#fff",display:"inline-block",animation:"spin 0.7s linear infinite"}} />{loadingMsg || "Entrando..."}</span> : "Entrar"}</button>

        {/* Separador */}
        <div style={{ display:"flex", alignItems:"center", gap:12, margin:"16px 0" }}>
          <div style={{ flex:1, height:1, background:t.border }} />
          <span style={{ color:t.textDimmed, fontSize:12 }}>ou</span>
          <div style={{ flex:1, height:1, background:t.border }} />
        </div>

        {/* Google Sign-In */}
        <button
          style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 20px", cursor:"pointer", fontSize:14, fontWeight:600, fontFamily: t.fontBody, color:t.textSecondary, display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", transition:"all 0.2s" }}
          onClick={handleGoogleLogin}
          disabled={loading}
          onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.background = t.bgCard; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.bgHeaderSolid; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Entrar com Google
        </button>

        <div style={{ textAlign:"center", marginTop:12 }}>
          <button style={s.linkBtn} onClick={() => { setModoRecuperar(true); setErro(""); setEmailRecuperar(ident.includes("@") ? ident : ""); }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",marginRight:4}}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>Esqueci minha senha</button>
        </div>
        <div style={{ textAlign:"center", marginTop:16 }}>
          <p style={{ color:t.textMuted, fontSize:13 }}>
            Não tem conta?{" "}
            <button
              onClick={() => setCadastroAberto(prev => !prev)}
              style={{ background:"none", border:"none", color:t.accent, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily: t.fontBody, textDecoration:"underline" }}>
              Cadastre-se
            </button>
          </p>
          {cadastroAberto && (
            <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginTop:10 }}>
              <button style={{ ...s.linkBtn, padding:"6px 12px", border:`1px solid ${t.border}`, borderRadius:6, background:t.bgHeaderSolid }} onClick={() => setTela("cadastro-equipe")}>Equipe</button>
              <button style={{ ...s.linkBtn, padding:"6px 12px", border:`1px solid ${t.border}`, borderRadius:6, background:t.bgHeaderSolid }} onClick={() => setTela("cadastro-organizador")}>Organizador</button>
              <button style={{ ...s.linkBtn, padding:"6px 12px", border:`1px solid ${t.border}`, borderRadius:6, background:t.bgHeaderSolid }} onClick={() => setTela("cadastro-atleta-login")}>Atleta</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const cssLogin = `@keyframes spin { to { transform: rotate(360deg); } }`;

function LoginStyle() {
  return <style>{cssLogin}</style>;
}

export default TelaLogin;
