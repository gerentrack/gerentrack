import React, { useState } from "react";
import { auth, db, doc, setDoc, createUserWithEmailAndPassword, signOut as firebaseSignOut, sendEmailVerification } from "../../firebase";
import { sanitizeForFirestore } from "../../lib/firestore/sanitize";
import { validarCNPJ, emailJaCadastrado } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import { criarInscricaoStyles } from "../inscricoes/inscricaoStyles";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";

import BlocoLGPD from "../ui/BlocoLGPD";

function TelaCadastroOrganizador() {
  const { login } = useAuth();
  const { setTela, organizadores, adicionarOrganizador } = useApp();
  const t = useTema();
  const s = useStylesResponsivos(criarInscricaoStyles(t));
  const [form, setForm] = useState({ nome:"", email:"", senha:"", entidade:"", fone:"", cnpj:"", equipeId:"", cidade:"", estado:"" });
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
    // Montar objeto ANTES do signOut — Firestore exige auth.currentUser para escrita
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
    // Flush direto no Firestore enquanto auth ainda está ativo (bypass debounce de 2s)
    try {
      const key = "atl_organizadores";
      const docRef = doc(db, "state", key);
      const current = JSON.parse(window.localStorage.getItem(key) || "[]");
      await setDoc(docRef, { value: sanitizeForFirestore(current) });
    } catch (err) {
      console.error("[CadastroOrganizador] Firestore flush error:", err);
    }
    await firebaseSignOut(auth).catch(() => {}); // Só desloga após persistir
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
        <FormField label="Cidade"               value={form.cidade}    onChange={v=>setForm({...form,cidade:v})} />
        <FormField label="Estado (UF)"          value={form.estado}    onChange={v=>setForm({...form,estado:v})} placeholder="SP" />
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
