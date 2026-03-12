import React, { useState } from "react";
import { validarCNPJ, emailJaCadastrado } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import inscricaoStyles from "../inscricoes/inscricaoStyles";

const styles = inscricaoStyles;

function TelaCadastroOrganizador({ setTela, adicionarOrganizador, login, organizadores }) {
  const [form, setForm] = useState({ nome:"", email:"", senha:"", entidade:"", fone:"", cnpj:"", equipeId:"" });
  const [erros, setErros] = useState({});
  const [ok, setOk] = useState(false);

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
    if (Object.keys(e).length) { setErros(e); return; }
    // Criar usuário no Firebase Auth
    try {
      await createUserWithEmailAndPassword(auth, form.email.trim(), form.senha);
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
    const o = { ...formSemSenha, id: Date.now().toString(), status: "pendente", dataCadastro: new Date().toISOString() };
    adicionarOrganizador(o);
    setOk(true);
  };

  if (ok) return (
    <div style={styles.formPage}><div style={styles.formCard}>
      <div style={{ fontSize:64, textAlign:"center" }}>⏳</div>
      <h2 style={{ ...styles.formTitle, textAlign:"center" }}>Cadastro enviado!</h2>
      <p style={{ textAlign:"center", color:"#aaa", lineHeight:1.6 }}>
        Seu cadastro como organizador foi recebido e está <strong style={{ color:"#1976D2" }}>aguardando aprovação</strong> do administrador do sistema.<br/><br/>
        Você receberá acesso assim que for aprovado.
      </p>
      <button style={styles.btnGhost} onClick={() => setTela("login")}>← Voltar ao Login</button>
    </div></div>
  );

  return (
    <div style={styles.formPage}><div style={styles.formCard}>
      <div style={styles.formIcon}>🏟️</div>
      <h2 style={styles.formTitle}>Cadastro de Organizador</h2>
      <p style={styles.formSub}>Crie sua conta para gerenciar competições</p>
      <div style={styles.grid2form}>
        <FormField label="Nome Completo *"      value={form.nome}      onChange={v=>setForm({...form,nome:v})}      error={erros.nome} />
        <FormField label="Entidade / Federação *" value={form.entidade} onChange={v=>setForm({...form,entidade:v})} error={erros.entidade} />
        <FormField label="E-mail *"             value={form.email}     onChange={v=>setForm({...form,email:v})}     type="email" error={erros.email} />
        <FormField label="Telefone"             value={form.fone}      onChange={v=>setForm({...form,fone:v})} />
        <FormField label="Senha *"              value={form.senha}     onChange={v=>setForm({...form,senha:v})}     type="password" error={erros.senha} />
        <FormField label="CNPJ *"                value={form.cnpj}      onChange={v=>setForm({...form,cnpj:v})} placeholder="00.000.000/0001-00" error={erros.cnpj} />
      </div>
      <button style={styles.btnPrimary} onClick={handleSubmit}>Criar Conta</button>
      <div style={styles.formLink}>
        Já tem conta? <button style={styles.linkBtn} onClick={()=>setTela("login")}>Entrar</button>
      </div>
    </div></div>
  );
}


export default TelaCadastroOrganizador;
