import React, { useState } from "react";
import { auth, signOut as firebaseSignOut, createUserWithEmailAndPassword, sendEmailVerification } from "../../firebase";
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

// ── Bloco de Consentimento LGPD ──────────────────────────────────────────────
function BlocoLGPD({ aceite, onChange, erro }) {
  const t = useTema();
  const [modalAberto, setModalAberto] = useState(false);
  return (
    <>
      {modalAberto && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:2000,
          display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={() => setModalAberto(false)}>
          <div style={{ background:t.bgCard, border:`1px solid ${t.accent}`, borderRadius:14,
            padding:28, maxWidth:560, width:"100%", maxHeight:"80vh", overflowY:"auto" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800,
              color: t.textPrimary, marginBottom:16 }}>📄 Política de Privacidade — GerenTrack</h3>
            <div style={{ fontSize:13, color: t.textTertiary, lineHeight:1.8 }}>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>1. Controlador dos dados</strong><br/>
              O GerenTrack é o responsável pelo tratamento dos seus dados pessoais, nos termos da Lei nº 13.709/2018 (LGPD).</p>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>2. Dados coletados</strong><br/>
              Coletamos: nome completo, e-mail, telefone, CNPJ, cidade, estado e dados de acesso (login). Para atletas: também CPF, data de nascimento e sexo.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>3. Finalidade do tratamento</strong><br/>
              Os dados são usados exclusivamente para: gestão de competições de atletismo, inscrições em provas, emissão de súmulas e resultados, e comunicação relacionada às competições.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>4. Base legal</strong><br/>
              O tratamento é realizado com base no consentimento do titular (Art. 7º, I), na execução de contrato (Art. 7º, V) e no legítimo interesse (Art. 7º, IX) da organização esportiva.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>5. Compartilhamento</strong><br/>
              Seus dados podem ser compartilhados com organizadores de competições nas quais você participa. Não vendemos dados a terceiros.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>6. Retenção</strong><br/>
              Resultados esportivos são mantidos permanentemente por integridade do histórico. Dados pessoais de contas excluídas são anonimizados.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>7. Seus direitos (Art. 18º LGPD)</strong><br/>
              Você tem direito a: confirmar a existência do tratamento, acessar, corrigir, anonimizar, bloquear, eliminar seus dados e revogar o consentimento a qualquer momento nas Configurações da conta.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>8. Segurança</strong><br/>
              Utilizamos autenticação via Firebase Auth e armazenamento seguro no Firestore. Dados sensíveis (senhas) nunca são armazenados localmente.</p>
              <p style={{ marginBottom:0 }}><strong style={{ color: t.textPrimary }}>9. Contato</strong><br/>
              Para exercer seus direitos ou tirar dúvidas: <span style={{ color: t.accent }}>gerentrack@gmail.com</span></p>
            </div>
            <button style={{ marginTop:20, background:t.accent, color:"#fff", border:"none",
              borderRadius:8, padding:"10px 24px", cursor:"pointer", fontSize:13, fontWeight:700,
              fontFamily:"'Barlow Condensed',sans-serif" }}
              onClick={() => setModalAberto(false)}>✓ Fechar</button>
          </div>
        </div>
      )}
      <div style={{ background:t.bgCardAlt, border:`1px solid ${erro ? t.danger : t.accentBorder}`,
        borderRadius:10, padding:"16px 18px", marginTop:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color: t.accent, letterSpacing:1,
          textTransform:"uppercase", marginBottom:10 }}>🔒 Consentimento LGPD (Lei 13.709/2018)</div>
        <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
          <input type="checkbox" checked={aceite} onChange={e => onChange(e.target.checked)}
            style={{ marginTop:2, width:16, height:16, cursor:"pointer", flexShrink:0 }} />
          <span style={{ fontSize:13, color: t.textSecondary, lineHeight:1.7 }}>
            Li e concordo com a{" "}
            <button type="button" onClick={() => setModalAberto(true)}
              style={{ background:"none", border:"none", color: t.accent, cursor:"pointer",
                fontSize:13, padding:0, textDecoration:"underline" }}>
              Política de Privacidade
            </button>
            {" "}e autorizo o tratamento dos meus dados pessoais pelo GerenTrack para fins de gestão de competições de atletismo, conforme descrito na política.
          </span>
        </label>
        {erro && <div style={{ color: t.danger, fontSize:12, marginTop:8 }}>⚠️ {erro}</div>}
      </div>
    </>
  );
}

// ── Bloco de Consentimento Parental (Art. 14 LGPD) ───────────────────────────
function BlocoConsentimentoParental({ responsavel, onResponsavel, aceite, onChange, erroResponsavel, erroAceite }) {
  const t = useTema();
  const styles = getStyles(t);
  return (
    <div style={{ background:`${t.success}11`, border:`1px solid ${t.success}44`, borderRadius:10,
      padding:"16px 18px", marginTop:16 }}>
      <div style={{ fontSize:12, fontWeight:700, color: t.success, letterSpacing:1,
        textTransform:"uppercase", marginBottom:4 }}>👨‍👩‍👧 Consentimento Parental (Art. 14 LGPD)</div>
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
        {erroResponsavel && <div style={{ color: t.danger, fontSize:12, marginTop:2 }}>⚠️ {erroResponsavel}</div>}
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
      {erroAceite && <div style={{ color: t.danger, fontSize:12, marginTop:8 }}>⚠️ {erroAceite}</div>}
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
    nome:"", email:"", senha:"", dataNasc:"", anoNasc:"", sexo:"M", clube:"", cpf:"", cbat:"", equipeId:""
  });
  const [erros, setErros] = useState({});
  const [ok, setOk] = useState(false);
  const [lgpdAceite, setLgpdAceite] = useState(false);
  const [consentimentoParentalAceite, setConsentimentoParentalAceite] = useState(false);
  const [responsavelLegal, setResponsavelLegal] = useState("");

  // ── Fluxo doc existente: CPF encontrado → pedir login ──
  const [docExistente, setDocExistente] = useState(null);
  const [docModo, setDocModo] = useState("novo"); // "novo" | "login" | "vincular"
  const [loginForm, setLoginForm] = useState({ email: "", senha: "" });
  const [loginErro, setLoginErro] = useState("");

  const validar = () => {
    const e = {};
    if (!form.nome)            e.nome    = "Nome obrigatório";
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
    if (eqId) {
      const orgIdEq = equipes.find(e => e.id === eqId)?.organizadorId;
      if (orgIdEq) {
        const dupOrg = atletasUsuarios.find(a =>
          a.cpf && a.cpf.replace(/\D/g,"") === limpo && a.organizadorId === orgIdEq
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

  const handleLoginExistente = () => {
    setLoginErro("");
    if (!loginForm.email || !loginForm.senha) { setLoginErro("Preencha e-mail e senha."); return; }
    const identNorm = loginForm.email.trim().toLowerCase();
    const cpfLimpo = form.cpf.replace(/\D/g, '');
    // Busca em todos os arrays
    const buscar = (arr) => arr.find(i =>
      i.cpf && i.cpf.replace(/\D/g, '') === cpfLimpo &&
      i.email && i.email.toLowerCase() === identNorm &&
      i.senha === loginForm.senha
    );
    const match = buscar(atletasUsuarios) || buscar(equipes) || buscar(treinadores) || buscar(funcionarios);
    if (!match) { setLoginErro("E-mail ou senha incorretos para este CPF."); return; }
    // Autenticou — preencher dados
    setForm(prev => ({
      ...prev,
      nome: match.nome || prev.nome,
      email: match.email || prev.email,
      senha: match.senha || prev.senha,
      fone: match.fone || prev.fone,
      dataNasc: match.dataNasc || prev.dataNasc,
      anoNasc: match.dataNasc ? match.dataNasc.split("-")[0] : prev.anoNasc,
      sexo: match.sexo || prev.sexo,
    }));
    setDocModo("vincular");
    setCpfStatus(null);
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
      if (!consentimentoParentalAceite) e.consentimentoParental = "O responsável legal deve autorizar o cadastro do menor.";
    }

    if (Object.keys(e).length) { setErros(e); return; }
    if (cpfStatus === "invalido" || (form.cpf && !validarCPF(form.cpf))) {
      setErros({ cpf: "CPF inválido" }); return;
    }

    // ── Etapa 4: bloquear duplicata de perfil no mesmo organizador ──
    if (form.equipeId && form.cpf) {
      const orgIdEq = equipes.find(e => e.id === form.equipeId)?.organizadorId;
      if (orgIdEq) {
        const cpfLimpo = form.cpf.replace(/\D/g,"");
        const dupOrg = atletasUsuarios.find(a =>
          a.cpf && a.cpf.replace(/\D/g,"") === cpfLimpo && a.organizadorId === orgIdEq
        );
        if (dupOrg) {
          setAtletaDuplicadoOrg(dupOrg);
          setCpfStatus("duplicado_org");
          setErros({ cpf: "Já existe um perfil de atleta seu neste organizador." });
          return;
        }
      }
    }
    const senhaFinal = docModo === "vincular" ? (docExistente?.senha || form.senha) : form.senha;
    // Criar usuário no Firebase Auth
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), senhaFinal);
      try { await sendEmailVerification(cred.user); } catch {}
    } catch (err) {
      if (err.code !== "auth/email-already-in-use") {
        if (err.code === "auth/weak-password") { setErros({ senha: "Senha fraca. Use pelo menos 6 caracteres." }); return; }
      }
    }
    await firebaseSignOut(auth).catch(() => {}); // Não logar automaticamente
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
      lgpdVersao: "1.0",
      ...(ehMenor ? {
        responsavelLegal: responsavelLegal.trim(),
        consentimentoParental: true,
        consentimentoParentalData: new Date().toISOString(),
      } : {}),
    };
    adicionarAtletaUsuario(usuario);
    if (atletaCpfEncontrado) {
      atualizarAtleta({ ...atletaCpfEncontrado, atletaUsuarioId: id, email: form.email });
    } else {
      adicionarAtleta({
        id, nome:form.nome, email:form.email,
        dataNasc:form.dataNasc, anoNasc:form.dataNasc ? form.dataNasc.split("-")[0] : "",
        sexo:form.sexo, clube:form.clube, cpf:form.cpf, cbat:form.cbat,
        equipeId:null, atletaUsuarioId:id,
        dataCadastro: new Date().toISOString(),
        cadastradoPor: "atleta",
        lgpdConsentimento: true,
        lgpdConsentimentoData: new Date().toISOString(),
        lgpdVersao: "1.0",
        ...(ehMenor ? {
          responsavelLegal: responsavelLegal.trim(),
          consentimentoParental: true,
          consentimentoParentalData: new Date().toISOString(),
        } : {}),
      });
    }
    // Se selecionou equipe, enviar solicitação de vínculo (aguarda aprovação)
    if (form.equipeId) {
      const atletaIdVinc = atletaCpfEncontrado ? atletaCpfEncontrado.id : id;
      const eqSel = equipes.find(function(e) { return e.id === form.equipeId; });
      solicitarVinculo(atletaIdVinc, form.nome, form.equipeId, eqSel?.clube || eqSel?.nome || form.clube || "");
    }
    login({ tipo:"atleta", ...usuario });
    setOk(true);
  };

  if (ok) return (
    <div style={s.formPage}><div style={s.formCard}>
      <div style={{ fontSize:64, textAlign:"center" }}>✅</div>
      <h2 style={{ ...s.formTitle, textAlign:"center" }}>
        {docModo === "vincular" ? "Vínculo criado!" : "Conta criada!"}
      </h2>
      <p style={{ textAlign:"center", color: t.textTertiary }}>Bem-vindo, {form.nome}!</p>
      {form.equipeId && (
        <div style={{ textAlign:"center", color: t.accent, fontSize:13, margin:"10px 0", padding:"8px 16px", background:t.accentBg, borderRadius:8, border:`1px solid ${t.accentBorder}` }}>
          ⏳ Sua solicitação de vínculo com a equipe foi enviada e aguarda aprovação.
        </div>
      )}
      <button style={s.btnPrimary} onClick={() => setTela("painel-atleta")}>Ir para Meu Painel</button>
    </div></div>
  );

  return (
    <div style={s.formPage}><div style={s.formCard}>
      <div style={s.formIcon}>🏃</div>
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
            ⛔ CPF inválido — verifique os dígitos digitados.
          </div>
        )}

        {/* ── Etapa 4: Duplicata de perfil de atleta no mesmo organizador ── */}
        {cpfStatus === "duplicado_org" && atletaDuplicadoOrg && (
          <div style={{ background:`${t.warning}11`, border:`2px solid ${t.warning}`,
            borderRadius:10, padding:"16px 18px", marginTop:8, marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:22 }}>🚫</span>
              <strong style={{ color:t.warning, fontSize:15 }}>Perfil já existente neste organizador</strong>
            </div>
            <div style={{ fontSize:13, color: t.textSecondary, lineHeight:1.7, marginBottom:10 }}>
              O CPF informado já possui uma conta de atleta ativa vinculada à federação/organizador desta equipe:<br/>
              <strong style={{ color: t.textPrimary }}>👤 {atletaDuplicadoOrg.nome}</strong>
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
              🔐 Ir para o Login
            </button>
          </div>
        )}
      </div>

      {/* CPF existente no sistema → modo login */}
      {docModo === "login" && docExistente && (
        <div style={{ background: t.accentBg, border: `2px solid ${t.accentBorder}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ color: t.accent, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>🔄 CPF já cadastrado no sistema</div>
          <div style={{ color: t.textTertiary, fontSize: 12, marginBottom: 4 }}>
            Nome: <strong style={{ color: t.textPrimary }}>{docExistente.nome}</strong>
          </div>
          <div style={{ color: t.textMuted, fontSize: 12, marginBottom: 12 }}>
            Para criar um novo vínculo como atleta, confirme suas credenciais:
          </div>
          {loginErro && <div style={{ ...s.erro, marginBottom: 12 }}>{loginErro}</div>}
          <FormField label="E-mail da conta" value={loginForm.email} onChange={v => setLoginForm({ ...loginForm, email: v })} type="email" placeholder="E-mail cadastrado" />
          <FormField label="Senha" value={loginForm.senha} onChange={v => setLoginForm({ ...loginForm, senha: v })} type="password" placeholder="Senha da conta" />
          <button style={{ ...s.btnPrimary, marginTop: 8 }} onClick={handleLoginExistente}>🔐 Confirmar Identidade</button>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button style={s.linkBtn} onClick={() => setTela("recuperar-senha")}>Esqueci minha senha</button>
          </div>
        </div>
      )}

      {/* Modo vincular confirmado */}
      {docModo === "vincular" && (
        <div style={{ background: `${t.success}11`, border: `2px solid ${t.success}66`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ color: t.success, fontSize: 13, fontWeight: 700 }}>✅ Identidade confirmada!</div>
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
                ℹ️ CPF já possui cadastro no sistema
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
                📨 Solicitar Senha Temporária ao Administrador
              </button>
            </div>
          )}
          {pedidoSenhaEnviado && (
            <div style={{ background:`${t.success}11`, border:`1px solid ${t.success}44`, borderRadius:8,
              padding:"12px 14px", marginBottom: 12, color:t.success, fontSize:13 }}>
              ✅ Solicitação enviada! Entre em contato com o organizador ou administrador.
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
              <label style={s.label}>Vinculado a uma Equipe? (opcional)</label>
              <select style={s.select} value={form.equipeId} onChange={e=>{
                const novoEqId = e.target.value;
                const eqSel = equipes.find(eq => eq.id === novoEqId);
                setForm({...form, equipeId: novoEqId, clube: eqSel?.nome || ""});
                // Etapa 4: re-verificar CPF com nova equipe para detectar duplicata no org
                if (form.cpf && form.cpf.replace(/\D/g,"").length >= 11) {
                  verificarCpf(form.cpf, novoEqId);
                }
              }}>
                <option value="">— Sem equipe —</option>
                {equipes.filter(eq => eq.status === "ativa" || eq.status === "aprovado").map(eq=>(
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
                aceite={consentimentoParentalAceite}
                onChange={setConsentimentoParentalAceite}
                erroResponsavel={erros.responsavelLegal}
                erroAceite={erros.consentimentoParental}
              />
            );
          })()}

          {/* ── LGPD: Consentimento geral ── */}
          <BlocoLGPD aceite={lgpdAceite} onChange={setLgpdAceite} erro={erros.lgpd} />

          <button style={{ ...s.btnPrimary, marginTop: 16 }} onClick={handleSubmit}>
            {docModo === "vincular" ? "✅ Realizar Cadastro" : "Criar Conta"}
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
