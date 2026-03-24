import React, { useState } from "react";
import { auth, createUserWithEmailAndPassword, signOut as firebaseSignOut, sendEmailVerification } from "../../firebase";
import { validarCNPJ, emailJaCadastrado } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import { criarInscricaoStyles } from "../inscricoes/inscricaoStyles";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";

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

function TelaCadastroOrganizador({ setTela, adicionarOrganizador, login, organizadores }) {
  const t = useTema();
  const s = useStylesResponsivos(criarInscricaoStyles(t));
  const [form, setForm] = useState({ nome:"", email:"", senha:"", entidade:"", fone:"", cnpj:"", equipeId:"" });
  const [erros, setErros] = useState({});
  const [ok, setOk] = useState(false);
  const [lgpdAceite, setLgpdAceite] = useState(false);

  const validar = () => {
    const e = {};
    if (!form.nome)           e.nome    = "Nome obrigatório";
    if (!form.email)          e.email   = "E-mail obrigatório";
    if (form.senha.length < 6) e.senha  = "Mínimo 6 caracteres";
    if (!form.entidade)       e.entidade= "Entidade/Federação obrigatória";
    if (!form.cnpj)           e.cnpj    = "CNPJ obrigatório";
    else if (!validarCNPJ(form.cnpj)) e.cnpj = "CNPJ inválido";
    if (emailJaCadastrado(form.email, { organizadores })) e.email = "E-mail já cadastrado em outra conta.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validar();
    if (!lgpdAceite) e.lgpd = "É necessário aceitar a Política de Privacidade para continuar.";
    if (Object.keys(e).length) { setErros(e); return; }
    // Criar usuário no Firebase Auth
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.senha);
      try { await sendEmailVerification(cred.user); } catch {}
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        // Email já existe no Firebase Auth — ok, pode ser multi-perfil
      } else if (err.code === "auth/weak-password") {
        setErros({ senha: "Senha fraca. Use pelo menos 6 caracteres." }); return;
      } else {
        setErros({ email: "Erro ao criar conta. Tente novamente." }); return;
      }
    }
    await firebaseSignOut(auth).catch(() => {}); // Não logar automaticamente
    const { senha: _senha, ...formSemSenha } = form;
    const o = {
      ...formSemSenha,
      id: Date.now().toString(),
      status: "pendente",
      dataCadastro: new Date().toISOString(),
      lgpdConsentimento: true,
      lgpdConsentimentoData: new Date().toISOString(),
      lgpdVersao: "1.0",
    };
    adicionarOrganizador(o);
    setOk(true);
  };

  if (ok) return (
    <div style={s.formPage}><div style={s.formCard}>
      <div style={{ fontSize:64, textAlign:"center" }}>⏳</div>
      <h2 style={{ ...s.formTitle, textAlign:"center" }}>Cadastro enviado!</h2>
      <p style={{ textAlign:"center", color: t.textTertiary, lineHeight:1.6 }}>
        Seu cadastro como organizador foi recebido e está <strong style={{ color: t.accent }}>aguardando aprovação</strong> do administrador do sistema.<br/><br/>
        Você receberá acesso assim que for aprovado.
      </p>
      <button style={s.btnGhost} onClick={() => setTela("login")}>← Voltar ao Login</button>
    </div></div>
  );

  return (
    <div style={s.formPage}><div style={s.formCard}>
      <div style={s.formIcon}>🏟️</div>
      <h2 style={s.formTitle}>Cadastro de Organizador</h2>
      <p style={s.formSub}>Crie sua conta para gerenciar competições</p>
      <div style={s.grid2form}>
        <FormField label="Nome Completo *"      value={form.nome}      onChange={v=>setForm({...form,nome:v})}      error={erros.nome} />
        <FormField label="Entidade / Federação *" value={form.entidade} onChange={v=>setForm({...form,entidade:v})} error={erros.entidade} />
        <FormField label="E-mail *"             value={form.email}     onChange={v=>setForm({...form,email:v})}     type="email" error={erros.email} />
        <FormField label="Telefone"             value={form.fone}      onChange={v=>setForm({...form,fone:v})} />
        <FormField label="Senha *"              value={form.senha}     onChange={v=>setForm({...form,senha:v})}     type="password" error={erros.senha} />
        <FormField label="CNPJ *"                value={form.cnpj}      onChange={v=>setForm({...form,cnpj:v})} placeholder="00.000.000/0001-00" error={erros.cnpj} />
      </div>
      <BlocoLGPD aceite={lgpdAceite} onChange={setLgpdAceite} erro={erros.lgpd} />
      <button style={{ ...s.btnPrimary, marginTop: 16 }} onClick={handleSubmit}>Criar Conta</button>
      <div style={s.formLink}>
        Já tem conta? <button style={s.linkBtn} onClick={()=>setTela("login")}>Entrar</button>
      </div>
    </div></div>
  );
}


export default TelaCadastroOrganizador;
