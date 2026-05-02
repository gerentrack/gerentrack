import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, doc, setDoc, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, sendEmailVerification } from "../../firebase";
import { sanitizeForFirestore } from "../../lib/firestore/sanitize";
import { validarCNPJ, formatarCNPJ, emailJaCadastrado } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import { criarInscricaoStyles } from "../inscricoes/inscricaoStyles";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";

import BlocoLGPD from "../ui/BlocoLGPD";

function TelaCadastroOrganizador() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { organizadores, adicionarOrganizador, editarOrganizadorAdmin, adicionarNotificacao } = useApp();
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
    else {
      const cnpjLimpo = form.cnpj.replace(/\D/g, "");
      const orgExistente = organizadores.find(o => o.cnpj && o.cnpj.replace(/\D/g, "") === cnpjLimpo);
      if (orgExistente && orgExistente.status !== "placeholder") {
        e.cnpj = "CNPJ já cadastrado no sistema. Entre em contato com o administrador.";
      }
    }
    if (emailJaCadastrado(form.email, { organizadores })) e.email = "E-mail já cadastrado em outra conta.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validar();
    if (!lgpdAceite) e.lgpd = "É necessário aceitar a Política de Privacidade para continuar.";
    if (Object.keys(e).length) { setErros(e); return; }

    // Verificar se existe placeholder com mesmo CNPJ para assumir
    const cnpjLimpo = form.cnpj.replace(/\D/g, "");
    const placeholder = organizadores.find(o => o.cnpj && o.cnpj.replace(/\D/g, "") === cnpjLimpo && o.status === "placeholder");

    // Criar usuário no Firebase Auth
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.senha);
      try { await sendEmailVerification(cred.user); } catch {}
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        // Email já existe no Firebase Auth — fazer login para ter auth ativo no flush
        try {
          await signInWithEmailAndPassword(auth, form.email.trim(), form.senha);
        } catch (loginErr) {
          setErros({ email: "E-mail já cadastrado. Se é sua conta, use a tela de login." }); return;
        }
      } else if (err.code === "auth/weak-password") {
        setErros({ senha: "Senha fraca. Use pelo menos 6 caracteres." }); return;
      } else {
        setErros({ email: "Erro ao criar conta. Tente novamente." }); return;
      }
    }

    const { senha: _senha, ...formSemSenha } = form;

    if (placeholder) {
      // Assumir registro placeholder existente — mantém id, equipes e atletas vinculados
      const orgAtualizado = {
        ...placeholder,
        ...formSemSenha,
        cnpj: formatarCNPJ(formSemSenha.cnpj),
        status: "pendente",
        lgpdConsentimento: true,
        lgpdConsentimentoData: new Date().toISOString(),
        lgpdVersao: "2.0",
      };
      editarOrganizadorAdmin(orgAtualizado);
      adicionarNotificacao("admin", "organizador_pendente",
        `Federação "${orgAtualizado.entidade}" (placeholder) solicitou ativação. Aguardando aprovação.`);
    } else {
      // Criar organizador novo
      const o = {
        ...formSemSenha,
        cnpj: formatarCNPJ(formSemSenha.cnpj),
        id: Date.now().toString(),
        status: "pendente",
        dataCadastro: new Date().toISOString(),
        lgpdConsentimento: true,
        lgpdConsentimentoData: new Date().toISOString(),
        lgpdVersao: "2.0",
      };
      adicionarOrganizador(o);
      adicionarNotificacao("admin", "organizador_pendente",
        `Novo organizador cadastrado: ${o.nome} (${o.entidade}). Aguardando aprovação.`);
    }

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
      <div style={{ fontSize:32, textAlign:"center", color:"inherit" }}>...</div>
      <h2 style={{ ...s.formTitle, textAlign:"center" }}>Cadastro enviado!</h2>
      <p style={{ textAlign:"center", color: t.textTertiary, lineHeight:1.6 }}>
        Seu cadastro como organizador foi recebido e está <strong style={{ color: t.accent }}>aguardando aprovação</strong> do administrador do sistema.<br/><br/>
        Você receberá acesso assim que for aprovado.
      </p>
      <button style={s.btnGhost} onClick={() => navigate("/entrar")}>← Voltar ao Login</button>
    </div></div>
  );

  return (
    <div style={s.formPage}><div style={s.formCard}>
      <div style={s.formIcon}></div>
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
        <div>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:t.textMuted, letterSpacing:1, marginBottom:6, textTransform:"uppercase" }}>Estado (UF)</label>
          <select style={{ width:"100%", background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:8, padding:"10px 14px", color:t.textSecondary, fontSize:14, fontFamily: t.fontBody }}
            value={form.estado || ""} onChange={e => setForm({...form, estado:e.target.value})}>
            <option value="">Selecione...</option>
            {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>
      </div>
      <BlocoLGPD aceite={lgpdAceite} onChange={setLgpdAceite} erro={erros.lgpd} />
      <button style={{ ...s.btnPrimary, marginTop: 16 }} onClick={handleSubmit}>Criar Conta</button>
      <div style={s.formLink}>
        Já tem conta? <button style={s.linkBtn} onClick={()=>navigate("/entrar")}>Entrar</button>
      </div>
    </div></div>
  );
}


export default TelaCadastroOrganizador;
