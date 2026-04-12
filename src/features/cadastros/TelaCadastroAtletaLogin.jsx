import React, { useState } from "react";
import { auth, db, doc, setDoc, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, googleProvider, signInWithPopup, signInWithRedirect } from "../../firebase";
import { sanitizeForFirestore } from "../../lib/firestore/sanitize";
import { validarCPF, emailJaCadastrado } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";
function getStyles(t) {
  return {
  formPage:    { maxWidth: 640, margin: "60px auto", padding: "0 24px 80px" },
  formCard:    { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32, marginBottom: 20 },
  formIcon:    { fontSize: 48, textAlign: "center", marginBottom: 16 },
  formTitle:   { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: t.textPrimary, textAlign: "center", marginBottom: 8 },
  formSub:     { color: t.textDimmed, textAlign: "center", fontSize: 14, marginBottom: 24 },
  formLink:    { textAlign: "center", marginTop: 16, color: t.textDimmed, fontSize: 13 },
  grid2form:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },
  label:       { display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  select:      { width: "100%", background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  btnPrimary:  { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, width: "100%", transition: "all 0.2s" },
  erro:        { background: `${t.danger}11`, border: `1px solid ${t.danger}`, color: t.danger, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn:     { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", padding: 0 },
  input:       { width: "100%", background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
};
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const calcularIdade = (dataNasc) => {
  if (!dataNasc) return null;
  const hoje = new Date();
  const nasc = new Date(dataNasc + "T12:00:00");
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
};

import BlocoLGPD from "../ui/BlocoLGPD";

// ── Bloco de Consentimento Parental (Art. 14 LGPD) ───────────────────────────
function BlocoConsentimentoParental({ responsavel, onResponsavel, cpfResp, onCpfResp, emailResp, onEmailResp, aceite, onChange, erroResponsavel, erroCpfResp, erroEmailResp, erroAceite }) {
  const t = useTema();
  const styles = getStyles(t);
  return (
    <div style={{ background:`${t.success}11`, border:`1px solid ${t.success}44`, borderRadius:10,
      padding:"16px 18px", marginTop:16 }}>
      <div style={{ fontSize:12, fontWeight:700, color: t.success, letterSpacing:1,
        textTransform:"uppercase", marginBottom:4 }}>Consentimento Parental (Art. 14 LGPD)</div>
      <p style={{ fontSize:12, color: t.textMuted, marginBottom:12, lineHeight:1.6 }}>
        O atleta é <strong style={{ color: t.textPrimary }}>menor de 18 anos</strong>. Conforme o Art. 14 da LGPD,
        é obrigatório o consentimento específico de um dos pais ou responsável legal para o tratamento
        dos dados pessoais de crianças e adolescentes.
      </p>
      <div style={{ marginBottom:12 }}>
        <label style={styles.label}>Nome do Responsável Legal *</label>
        <input
          style={{ ...styles.input, border:`1px solid ${erroResponsavel ? t.danger : t.borderInput}` }}
          value={responsavel}
          onChange={e => onResponsavel(e.target.value)}
          placeholder="Nome completo do pai, mãe ou responsável legal"
        />
        {erroResponsavel && <div style={{ color: t.danger, fontSize:12, marginTop:2 }}>{erroResponsavel}</div>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, marginBottom:12 }}>
        <div>
          <label style={styles.label}>CPF do Responsável *</label>
          <input
            style={{ ...styles.input, border:`1px solid ${erroCpfResp ? t.danger : t.borderInput}` }}
            value={cpfResp}
            onChange={e => onCpfResp(e.target.value)}
            placeholder="000.000.000-00"
          />
          {erroCpfResp && <div style={{ color: t.danger, fontSize:12, marginTop:2 }}>{erroCpfResp}</div>}
        </div>
        <div>
          <label style={styles.label}>E-mail do Responsável *</label>
          <input
            style={{ ...styles.input, border:`1px solid ${erroEmailResp ? t.danger : t.borderInput}` }}
            value={emailResp}
            onChange={e => onEmailResp(e.target.value)}
            type="email"
            placeholder="responsavel@email.com"
          />
          {erroEmailResp && <div style={{ color: t.danger, fontSize:12, marginTop:2 }}>{erroEmailResp}</div>}
        </div>
      </div>
      <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
        <input type="checkbox" checked={aceite} onChange={e => onChange(e.target.checked)}
          style={{ marginTop:2, width:16, height:16, cursor:"pointer", flexShrink:0 }} />
        <span style={{ fontSize:13, color: t.textSecondary, lineHeight:1.7 }}>
          Declaro ser responsável legal pelo atleta acima e autorizo, de forma específica e destacada,
          o tratamento dos dados pessoais deste menor pelo GerenTrack para fins de gestão de competições
          de atletismo, conforme a <strong style={{ color: t.success }}>Lei nº 13.709/2018 (LGPD), Art. 14</strong>.
        </span>
      </label>
      {erroAceite && <div style={{ color: t.danger, fontSize:12, marginTop:8 }}>{erroAceite}</div>}
    </div>
  );
}

function TelaCadastroAtletaLogin() {
  const { login, gerarSenhaTemp, adicionarSolicitacaoRecuperacao } = useAuth();
  const { atletas, equipes, adicionarAtleta, atualizarAtleta, solicitarVinculo } = useEvento();
  const { setTela, atletasUsuarios, adicionarAtletaUsuario, organizadores, funcionarios, treinadores } = useApp();
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const [form, setForm] = useState({
    nome:"", email:"", senha:"", dataNasc:"", anoNasc:"", sexo:"M", clube:"", cpf:"", cbat:"", equipeId:"", organizadorId:""
  });
  const [erros, setErros] = useState({});
  const [ok, setOk] = useState(false);
  const [lgpdAceite, setLgpdAceite] = useState(false);
  const [consentimentoParentalAceite, setConsentimentoParentalAceite] = useState(false);
  const [responsavelLegal, setResponsavelLegal] = useState("");
  const [responsavelCpf, setResponsavelCpf] = useState("");
  const [responsavelEmail, setResponsavelEmail] = useState("");

  // ── Fluxo doc existente: CPF encontrado → pedir login ──
  const [docExistente, setDocExistente] = useState(null);
  const [docModo, setDocModo] = useState("novo"); // "novo" | "login" | "vincular"
  const [loginForm, setLoginForm] = useState({ email: "", senha: "" });
  const [loginErro, setLoginErro] = useState("");

  const validar = () => {
    const e = {};
    if (!form.nome)            e.nome    = "Nome obrigatório";
    if (!form.organizadorId)   e.organizadorId = "Selecione o organizador";
    if (!form.email)           e.email   = "E-mail obrigatório";
    else if (docModo === "novo" && emailJaCadastrado(form.email, { organizadores, equipes, atletasUsuarios, funcionarios, treinadores }))
      e.email = "E-mail já cadastrado em outra conta.";
    if (docModo === "novo" && form.senha.length < 6) e.senha   = "Mínimo 6 caracteres";
    if (!form.dataNasc)        e.dataNasc = "Data de nascimento obrigatória";
    return e;
  };

  const [cpfStatus, setCpfStatus] = useState(null);
  const [atletaCpfEncontrado, setAtletaCpfEncontrado] = useState(null);
  const [pedidoSenhaEnviado, setPedidoSenhaEnviado] = useState(false);
  // Etapa 4: conta de atleta já existente no mesmo organizador
  const [atletaDuplicadoOrg, setAtletaDuplicadoOrg] = useState(null);

  const verificarCpf = (cpf, equipeIdParam) => {
    const limpo = cpf.replace(/\D/g,"");
    const eqId = equipeIdParam !== undefined ? equipeIdParam : form.equipeId;
    if (limpo.length < 11) { setCpfStatus(null); setAtletaCpfEncontrado(null); setDocExistente(null); setDocModo("novo"); setAtletaDuplicadoOrg(null); return; }
    if (!validarCPF(limpo)) { setCpfStatus("invalido"); setAtletaCpfEncontrado(null); setDocExistente(null); setDocModo("novo"); setAtletaDuplicadoOrg(null); return; }

    // ── Etapa 4: duplicata de perfil de atleta no mesmo organizador ──
    const orgIdCheck = form.organizadorId || (eqId ? equipes.find(e => e.id === eqId)?.organizadorId : null);
    if (orgIdCheck) {
      const dupOrg = atletasUsuarios.find(a =>
        a.cpf && a.cpf.replace(/\D/g,"") === limpo && a.organizadorId === orgIdCheck
      );
      if (dupOrg) {
        setCpfStatus("duplicado_org");
        setAtletaDuplicadoOrg(dupOrg);
        setAtletaCpfEncontrado(null);
        setDocExistente(null);
        setDocModo("novo");
        return;
      }
    }
    setAtletaDuplicadoOrg(null);

    // Buscar em TODOS os arrays (cross-tipo)
    const buscarEm = (arr) => arr.find(i => i.cpf && i.cpf.replace(/\D/g,"") === limpo);
    const emAtletasUsr = buscarEm(atletasUsuarios);
    const emEquipes = buscarEm(equipes);
    const emTreinadores = buscarEm(treinadores);
    const emFuncionarios = buscarEm(funcionarios);
    const qualquerExistente = emAtletasUsr || emEquipes || emTreinadores || emFuncionarios;

    if (qualquerExistente) {
      setDocExistente(qualquerExistente);
      setDocModo("login");
      setCpfStatus("existente_sistema");
      return;
    }

    // Tem cadastro base (por equipe)?
    const base = atletas.find(a => a.cpf && a.cpf.replace(/\D/g,"") === limpo);
    if (base) {
      setAtletaCpfEncontrado(base);
      setCpfStatus(base.desvinculadoEm ? "desvinculado" : "cadastrado");
      setDocExistente(null); setDocModo("novo");
    } else {
      setCpfStatus("limpo");
      setAtletaCpfEncontrado(null);
      setDocExistente(null); setDocModo("novo");
    }
  };

  const confirmarIdentidade = (match) => {
    setForm(prev => ({
      ...prev,
      nome: match.nome || prev.nome,
      email: match.email || prev.email,
      fone: match.fone || prev.fone,
      dataNasc: match.dataNasc || prev.dataNasc,
      anoNasc: match.dataNasc ? match.dataNasc.split("-")[0] : prev.anoNasc,
      sexo: match.sexo || prev.sexo,
    }));
    setDocModo("vincular");
    setCpfStatus(null);
  };

  const handleLoginExistente = async () => {
    setLoginErro("");
    if (!loginForm.email || !loginForm.senha) { setLoginErro("Preencha e-mail e senha."); return; }
    const identNorm = loginForm.email.trim().toLowerCase();
    const cpfLimpo = form.cpf.replace(/\D/g, '');
    // Buscar perfil com CPF + email
    const buscar = (arr) => arr.find(i =>
      i.cpf && i.cpf.replace(/\D/g, '') === cpfLimpo &&
      i.email && i.email.toLowerCase() === identNorm
    );
    const match = buscar(atletasUsuarios) || buscar(equipes) || buscar(treinadores) || buscar(funcionarios);
    if (!match) { setLoginErro("E-mail não encontrado para este CPF."); return; }
    // Validar senha via Firebase Auth
    try {
      await signInWithEmailAndPassword(auth, identNorm, loginForm.senha);
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setLoginErro("Senha incorreta. Use 'Esqueci minha senha' para redefinir.");
      } else if (err.code === "auth/user-not-found") {
        setLoginErro("Este e-mail não possui conta. Solicite ao administrador.");
      } else if (err.code === "auth/too-many-requests") {
        setLoginErro("Muitas tentativas. Aguarde alguns minutos.");
      } else {
        setLoginErro("Erro ao autenticar. Tente novamente.");
      }
      return;
    }
    confirmarIdentidade(match);
  };

  const handleGoogleConfirmar = async () => {
    setLoginErro("");
    const cpfLimpo = form.cpf.replace(/\D/g, '');
    try {
      const isPWA = window.matchMedia("(display-mode: standalone)").matches || window.navigator?.standalone;
      let result;
      if (isPWA) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      result = await signInWithPopup(auth, googleProvider);
      const googleEmail = result.user.email?.toLowerCase();
      // Buscar perfil com CPF + email (principal ou googleEmail)
      const buscar = (arr) => arr.find(i =>
        i.cpf && i.cpf.replace(/\D/g, '') === cpfLimpo &&
        ((i.email && i.email.toLowerCase() === googleEmail) ||
         (i.googleEmail && i.googleEmail.toLowerCase() === googleEmail))
      );
      const match = buscar(atletasUsuarios) || buscar(equipes) || buscar(treinadores) || buscar(funcionarios);
      if (!match) {
        await firebaseSignOut(auth).catch(() => {});
        setLoginErro("Nenhum perfil encontrado com este CPF vinculado a " + googleEmail);
        return;
      }
      confirmarIdentidade(match);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setLoginErro("Erro ao confirmar com Google. Tente novamente.");
      }
    }
  };

  const handlePedirSenha = () => {
    const senhaTemp = gerarSenhaTemp();
    adicionarSolicitacaoRecuperacao({
      id: Date.now().toString(),
      tipo: "atleta_cpf",
      userId: atletaCpfEncontrado?.id || "pendente",
      nome: atletaCpfEncontrado?.nome || form.nome,
      email: form.email,
      senhaTemp,
      cpf: form.cpf,
      status: "pendente",
      data: new Date().toISOString(),
    });
    setPedidoSenhaEnviado(true);
  };

  const handleSubmit = async () => {
    const e = validar();
    const idade = calcularIdade(form.dataNasc);
    const ehMenor = idade !== null && idade < 18;

    // Validações LGPD
    if (!lgpdAceite) e.lgpd = "É necessário aceitar a Política de Privacidade para continuar.";
    if (ehMenor) {
      if (!responsavelLegal.trim()) e.responsavelLegal = "Informe o nome do responsável legal.";
      if (!responsavelCpf.trim() || (responsavelCpf.replace(/\D/g,"").length >= 11 && !validarCPF(responsavelCpf))) e.cpfResp = !responsavelCpf.trim() ? "Informe o CPF do responsável." : "CPF do responsável inválido.";
      if (!responsavelEmail.trim() || !responsavelEmail.includes("@")) e.emailResp = !responsavelEmail.trim() ? "Informe o e-mail do responsável." : "E-mail do responsável inválido.";
      if (!consentimentoParentalAceite) e.consentimentoParental = "O responsável legal deve autorizar o cadastro do menor.";
    }

    if (Object.keys(e).length) { setErros(e); return; }
    if (cpfStatus === "invalido" || (form.cpf && !validarCPF(form.cpf))) {
      setErros({ cpf: "CPF inválido" }); return;
    }

    // ── Etapa 4: bloquear duplicata de perfil no mesmo organizador ──
    if (form.organizadorId && form.cpf) {
      const cpfLimpo = form.cpf.replace(/\D/g,"");
      const dupOrg = atletasUsuarios.find(a =>
        a.cpf && a.cpf.replace(/\D/g,"") === cpfLimpo && a.organizadorId === form.organizadorId
      );
      if (dupOrg) {
        setAtletaDuplicadoOrg(dupOrg);
        setCpfStatus("duplicado_org");
        setErros({ cpf: "Já existe um perfil de atleta seu neste organizador." });
        return;
      }
    }
    const senhaFinal = docModo === "vincular" ? (docExistente?.senha || form.senha) : form.senha;
    // Criar usuário no Firebase Auth
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), senhaFinal);
      try { await sendEmailVerification(cred.user); } catch {}
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        try {
          await signInWithEmailAndPassword(auth, form.email.trim(), senhaFinal);
        } catch (loginErr) {
          setErros({ email: "E-mail já cadastrado. Se é sua conta, use a tela de login." }); return;
        }
      } else if (err.code === "auth/weak-password") {
        setErros({ senha: "Senha fraca. Use pelo menos 6 caracteres." }); return;
      } else {
        setErros({ email: "Erro ao criar conta. Tente novamente." }); return;
      }
    }
    // NÃO fazer signOut aqui — precisa de auth.currentUser para Firestore writes
    // Verificar duplicata de Nº CBAt
    if (form.cbat && form.cbat.trim()) {
      const cbatLimpo = form.cbat.trim();
      const cbatDup = atletas.find(a => a.cbat && a.cbat.trim() === cbatLimpo);
      if (cbatDup) { setErros({ cbat: `Nº CBAt já cadastrado para ${cbatDup.nome}` }); return; }
    }
    const id = Date.now().toString();
    const { senha: _senha, ...formSemSenha } = form;
    const usuario = {
      ...formSemSenha, id, tipo:"atleta",
      lgpdConsentimento: true,
      lgpdConsentimentoData: new Date().toISOString(),
      lgpdVersao: "2.0",
      ...(ehMenor ? {
        responsavelLegal: responsavelLegal.trim(),
        responsavelCpf: responsavelCpf.trim(),
        responsavelEmail: responsavelEmail.trim(),
        consentimentoParental: true,
        consentimentoParentalData: new Date().toISOString(),
      } : {}),
    };
    adicionarAtletaUsuario(usuario);
    if (atletaCpfEncontrado) {
      atualizarAtleta({ ...atletaCpfEncontrado, atletaUsuarioId: id, email: form.email });
    } else {
      await adicionarAtleta({
        id, nome:form.nome, email:form.email,
        dataNasc:form.dataNasc, anoNasc:form.dataNasc ? form.dataNasc.split("-")[0] : "",
        sexo:form.sexo, clube:form.clube, cpf:form.cpf, cbat:form.cbat,
        equipeId:null, atletaUsuarioId:id, organizadorId:form.organizadorId,
        dataCadastro: new Date().toISOString(),
        cadastradoPor: "atleta",
        lgpdConsentimento: true,
        lgpdConsentimentoData: new Date().toISOString(),
        lgpdVersao: "2.0",
        ...(ehMenor ? {
          responsavelLegal: responsavelLegal.trim(),
          responsavelCpf: responsavelCpf.trim(),
          responsavelEmail: responsavelEmail.trim(),
          consentimentoParental: true,
          consentimentoParentalData: new Date().toISOString(),
        } : {}),
      });
    }
    // Flush atl_atletas_usuarios no Firestore enquanto auth ainda está ativo
    try {
      const key = "atl_atletas_usuarios";
      const docRef = doc(db, "state", key);
      const current = JSON.parse(window.localStorage.getItem(key) || "[]");
      await setDoc(docRef, { value: sanitizeForFirestore(current) });
    } catch (err) {
      console.error("[CadastroAtleta] Firestore flush error:", err);
    }
    // SignOut antes do login para garantir sessão limpa
    await firebaseSignOut(auth).catch(() => {});
    // Se selecionou equipe, enviar solicitação de vínculo (aguarda aprovação)
    if (form.equipeId) {
      const atletaIdVinc = atletaCpfEncontrado ? atletaCpfEncontrado.id : id;
      const eqSel = equipes.find(function(e) { return e.id === form.equipeId; });
      const atletaBase = atletaCpfEncontrado || {};
      const equipeAtualObj = atletaBase.equipeId ? equipes.find(function(e2) { return e2.id === atletaBase.equipeId; }) : null;
      solicitarVinculo(atletaIdVinc, form.nome, form.equipeId, eqSel?.clube || eqSel?.nome || form.clube || "", {
        origem: "atleta",
        aprovadorTipo: atletaBase.equipeId ? "equipe_atual" : "equipe",
        equipeAtualId: atletaBase.equipeId || null,
        equipeAtualNome: equipeAtualObj?.nome || atletaBase.clube || null,
        organizadorId: eqSel?.organizadorId || null,
        solicitanteId: atletaIdVinc,
        solicitanteNome: form.nome,
      });
    }
    login({ tipo:"atleta", ...usuario });
    setOk(true);
  };

  if (ok) return (
    <div style={s.formPage}><div style={s.formCard}>
      <div style={{ fontSize:64, textAlign:"center" }}>✓</div>
      <h2 style={{ ...s.formTitle, textAlign:"center" }}>
        {docModo === "vincular" ? "Vínculo criado!" : "Conta criada!"}
      </h2>
      <p style={{ textAlign:"center", color: t.textTertiary }}>Bem-vindo, {form.nome}!</p>
      {form.equipeId && (
        <div style={{ textAlign:"center", color: t.accent, fontSize:13, margin:"10px 0", padding:"8px 16px", background:t.accentBg, borderRadius:8, border:`1px solid ${t.accentBorder}` }}>
          Sua solicitação de vínculo com a equipe foi enviada e aguarda aprovação.
        </div>
      )}
      <button style={s.btnPrimary} onClick={() => setTela("painel-atleta")}>Ir para Meu Painel</button>
    </div></div>
  );

  return (
    <div style={s.formPage}><div style={s.formCard}>
      <div style={s.formIcon}></div>
      <h2 style={s.formTitle}>Cadastro de Atleta</h2>
      <p style={s.formSub}>Crie sua conta para se inscrever em competições</p>

      {/* CPF — sempre primeiro */}
      <div style={{ marginBottom: 16 }}>
        <FormField label="CPF *" value={form.cpf}
          onChange={v => { setForm({...form,cpf:v}); verificarCpf(v); }}
          placeholder="000.000.000-00" error={erros.cpf} />

        {cpfStatus === "invalido" && (
          <div style={{ background:`${t.danger}11`, border:`1px solid ${t.danger}44`, borderRadius:6,
            padding:"8px 12px", marginTop:6, color: t.danger, fontSize:12 }}>
            CPF inválido — verifique os dígitos digitados.
          </div>
        )}

        {/* ── Etapa 4: Duplicata de perfil de atleta no mesmo organizador ── */}
        {cpfStatus === "duplicado_org" && atletaDuplicadoOrg && (
          <div style={{ background:`${t.warning}11`, border:`2px solid ${t.warning}`,
            borderRadius:10, padding:"16px 18px", marginTop:8, marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:14, fontWeight:700 }}>!</span>
              <strong style={{ color:t.warning, fontSize:15 }}>Perfil já existente neste organizador</strong>
            </div>
            <div style={{ fontSize:13, color: t.textSecondary, lineHeight:1.7, marginBottom:10 }}>
              O CPF informado já possui uma conta de atleta ativa vinculada à federação/organizador desta equipe:<br/>
              <strong style={{ color: t.textPrimary }}>{atletaDuplicadoOrg.nome}</strong>
              {atletaDuplicadoOrg.email && (
                <span style={{ color: t.textMuted, marginLeft:8 }}>({atletaDuplicadoOrg.email})</span>
              )}
            </div>
            <div style={{ background:t.bgCardAlt, border:`1px solid ${t.warning}33`, borderRadius:6,
              padding:"10px 14px", fontSize:12, color: t.textTertiary, lineHeight:1.7, marginBottom:12 }}>
              Uma pessoa não pode ter dois perfis de atleta no mesmo organizador.<br/>
              Se este é seu CPF, <strong style={{ color:t.warning }}>faça login com sua conta já existente</strong>.
            </div>
            <button style={{ background:t.accentBg, border:`1px solid ${t.accentBorder}`, color:t.accent,
              borderRadius:6, padding:"8px 18px", cursor:"pointer", fontSize:13, fontWeight:700,
              fontFamily:"'Barlow',sans-serif" }}
              onClick={() => setTela("login")}>
              Ir para o Login
            </button>
          </div>
        )}
      </div>

      {/* CPF existente no sistema → modo login */}
      {docModo === "login" && docExistente && (
        <div style={{ background: t.accentBg, border: `2px solid ${t.accentBorder}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ color: t.accent, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>CPF já cadastrado no sistema</div>
          <div style={{ color: t.textTertiary, fontSize: 12, marginBottom: 4 }}>
            Nome: <strong style={{ color: t.textPrimary }}>{docExistente.nome}</strong>
          </div>
          <div style={{ color: t.textMuted, fontSize: 12, marginBottom: 12 }}>
            Para criar um novo vínculo como atleta, confirme suas credenciais:
          </div>
          {loginErro && <div style={{ ...s.erro, marginBottom: 12 }}>{loginErro}</div>}
          <FormField label="E-mail da conta" value={loginForm.email} onChange={v => setLoginForm({ ...loginForm, email: v })} type="email" placeholder="E-mail cadastrado" />
          <FormField label="Senha" value={loginForm.senha} onChange={v => setLoginForm({ ...loginForm, senha: v })} type="password" placeholder="Senha da conta" />
          <button style={{ ...s.btnPrimary, marginTop: 8 }} onClick={handleLoginExistente}>Confirmar Identidade</button>
          <div style={{ display:"flex", alignItems:"center", gap:12, margin:"12px 0" }}>
            <div style={{ flex:1, height:1, background:t.border }} />
            <span style={{ color:t.textDimmed, fontSize:12 }}>ou</span>
            <div style={{ flex:1, height:1, background:t.border }} />
          </div>
          <button
            style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 20px", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'Barlow', sans-serif", color:t.textSecondary, display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%" }}
            onClick={handleGoogleConfirmar}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Confirmar com Google
          </button>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button style={s.linkBtn} onClick={() => setTela("recuperar-senha")}>Esqueci minha senha</button>
          </div>
        </div>
      )}

      {/* Modo vincular confirmado */}
      {docModo === "vincular" && (
        <div style={{ background: `${t.success}11`, border: `2px solid ${t.success}66`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ color: t.success, fontSize: 13, fontWeight: 700 }}>✓ Identidade confirmada!</div>
          <div style={{ color: t.textTertiary, fontSize: 12, marginTop: 4 }}>Dados carregados. Complete o cadastro abaixo.</div>
        </div>
      )}

      {/* Formulário (só mostra se modo novo ou vincular, e CPF não está em modo login) */}
      {(docModo === "novo" || docModo === "vincular") && (
        <>
          {/* CPF encontrado como atleta base (cadastrado por equipe, sem conta) */}
          {cpfStatus === "cadastrado" && atletaCpfEncontrado && !pedidoSenhaEnviado && docModo === "novo" && (
            <div style={{ background: t.accentBg, border:`2px solid ${t.accentBorder}`,
              borderRadius:8, padding:"12px 14px", marginBottom: 12 }}>
              <strong style={{ color: t.accent, fontSize:13 }}>
                CPF já possui cadastro no sistema
              </strong>
              <p style={{ color: t.textTertiary, fontSize:12, margin:"6px 0 10px", lineHeight:1.6 }}>
                Para receber uma senha temporária, informe seu e-mail abaixo.
              </p>
              <FormField
                label="E-mail *"
                value={form.email}
                onChange={v => setForm({...form, email: v})}
                type="email"
                placeholder="seu@email.com"
                error={erros.emailSolic}
              />
              <button onClick={() => {
                  if (!form.email || !form.email.includes("@")) {
                    setErros(prev => ({...prev, emailSolic: "Informe um e-mail válido para receber a senha."}));
                    return;
                  }
                  setErros(prev => ({...prev, emailSolic: undefined}));
                  handlePedirSenha();
                }}
                style={{ background:t.accentBg, border:`1px solid ${t.accentBorder}`, color:t.accent,
                  borderRadius:6, padding:"8px 18px", cursor:"pointer", fontSize:13,
                  fontWeight:700, fontFamily:"Inter,sans-serif", marginTop: 8 }}>
                Solicitar Senha Temporária ao Administrador
              </button>
            </div>
          )}
          {pedidoSenhaEnviado && (
            <div style={{ background:`${t.success}11`, border:`1px solid ${t.success}44`, borderRadius:8,
              padding:"12px 14px", marginBottom: 12, color:t.success, fontSize:13 }}>
              ✓ Solicitação enviada! Entre em contato com o organizador ou administrador.
            </div>
          )}

          <div style={s.grid2form}>
            <FormField label="Nome Completo *"  value={form.nome}    onChange={v=>setForm({...form,nome:v})}    error={erros.nome} />
            <FormField label="Data de Nascimento *" value={form.dataNasc} onChange={v=>setForm({...form,dataNasc:v,anoNasc:v?v.split("-")[0]:""})} type="date" error={erros.dataNasc} />
            <FormField label="E-mail *"         value={form.email}   onChange={v=>setForm({...form,email:v})}   type="email" error={erros.email} />
            <div>
              <label style={s.label}>Sexo</label>
              <select style={s.select} value={form.sexo} onChange={e=>setForm({...form,sexo:e.target.value})}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            {docModo === "novo" && (
              <FormField label="Senha *"          value={form.senha}   onChange={v=>setForm({...form,senha:v})}   type="password" error={erros.senha} />
            )}
            <FormField label="Nº CBAt"          value={form.cbat}    onChange={v=>setForm({...form,cbat:v})} />
            <div style={{ gridColumn:"1/-1" }}>
              <label style={s.label}>Organizador *</label>
              <select style={{ ...s.select, borderColor: erros.organizadorId ? t.danger : undefined }}
                value={form.organizadorId} onChange={e=>{
                setForm({...form, organizadorId: e.target.value, equipeId:"", clube:""});
              }}>
                <option value="">— Selecione o organizador —</option>
                {(organizadores || []).filter(o => o.status === "aprovado").map(o=>(
                  <option key={o.id} value={o.id}>{o.entidade || o.nome}</option>
                ))}
              </select>
              {erros.organizadorId && <div style={{ color: t.danger, fontSize:12, marginTop:4 }}>{erros.organizadorId}</div>}
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={s.label}>Vinculado a uma Equipe? (opcional)</label>
              <select style={s.select} value={form.equipeId}
                disabled={!form.organizadorId}
                onChange={e=>{
                const novoEqId = e.target.value;
                const eqSel = equipes.find(eq => eq.id === novoEqId);
                setForm({...form, equipeId: novoEqId, clube: eqSel?.nome || ""});
                // Etapa 4: re-verificar CPF com nova equipe para detectar duplicata no org
                if (form.cpf && form.cpf.replace(/\D/g,"").length >= 11) {
                  verificarCpf(form.cpf, novoEqId);
                }
              }}>
                <option value="">— Sem equipe —</option>
                {equipes.filter(eq => (eq.status === "ativa" || eq.status === "aprovado") && eq.organizadorId === form.organizadorId).map(eq=>(
                  <option key={eq.id} value={eq.id}>{eq.nome} {eq.sigla ? `(${eq.sigla})` : ""}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── LGPD: Consentimento Parental (menores) ── */}
          {(() => {
            const idade = calcularIdade(form.dataNasc);
            const ehMenor = idade !== null && idade < 18;
            if (!ehMenor) return null;
            return (
              <BlocoConsentimentoParental
                responsavel={responsavelLegal}
                onResponsavel={setResponsavelLegal}
                cpfResp={responsavelCpf}
                onCpfResp={setResponsavelCpf}
                emailResp={responsavelEmail}
                onEmailResp={setResponsavelEmail}
                aceite={consentimentoParentalAceite}
                onChange={setConsentimentoParentalAceite}
                erroResponsavel={erros.responsavelLegal}
                erroCpfResp={erros.cpfResp}
                erroEmailResp={erros.emailResp}
                erroAceite={erros.consentimentoParental}
              />
            );
          })()}

          {/* ── LGPD: Consentimento geral ── */}
          <BlocoLGPD aceite={lgpdAceite} onChange={setLgpdAceite} erro={erros.lgpd} />

          <button style={{ ...s.btnPrimary, marginTop: 16 }} onClick={handleSubmit}>
            {docModo === "vincular" ? "Realizar Cadastro" : "Criar Conta"}
          </button>
        </>
      )}

      <div style={s.formLink}>
        Já tem conta? <button style={s.linkBtn} onClick={() => setTela("login")}>Entrar</button>
      </div>
    </div></div>
  );
}


export default TelaCadastroAtletaLogin;
