const styles = {
  page:       { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  formPage:   { maxWidth: 640, margin: "60px auto", padding: "0 24px 80px" },
  formCard:   { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 16, padding: 32, marginBottom: 20 },
  formIcon:   { fontSize: 48, textAlign: "center", marginBottom: 16 },
  formTitle:  { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 8 },
  formSub:    { color: "#666", textAlign: "center", fontSize: 14, marginBottom: 24 },
  formLink:   { textAlign: "center", marginTop: 16, color: "#666", fontSize: 13 },
  label:      { display: "block", fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  input:      { width: "100%", background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px 14px", color: "#E0E0E0", fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  select:     { width: "100%", background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px 14px", color: "#E0E0E0", fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  btnPrimary: { background: "linear-gradient(135deg, #1976D2, #1565C0)", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, width: "100%", transition: "all 0.2s" },
  btnSecondary:{ background: "transparent", color: "#1976D2", border: "2px solid #1976D2", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost:   { background: "transparent", color: "#888", border: "1px solid #2a2d3a", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  erro:       { background: "#2a1010", border: "1px solid #ff4444", color: "#ff6b6b", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn:    { background: "none", border: "none", color: "#1976D2", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", padding: 0 },
  emptyState: { textAlign: "center", padding: "60px 20px", color: "#444", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },
  badge:      (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
};
import React, { useState } from "react";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "../../firebase";
import { _getClubeAtleta } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";

function TelaLogin({ setTela, login, loginComSelecao, equipes, organizadores, atletasUsuarios, funcionarios, treinadores, setPerfisDisponiveis, adminConfig, atletas: atletasBase }) {
  const [ident,   setIdent]   = useState("");
  const [senha,   setSenha]   = useState("");
  const [erro,    setErro]    = useState("");
  const [loading, setLoading] = useState(false);
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [feedbackRecuperar, setFeedbackRecuperar] = useState("");

  const matchIdent = (u) => {
    if (!u) return false;
    const identTrimmed = ident.trim().toLowerCase();
    const identSemPont = ident.replace(/[\.\-\/]/g, "").trim().toLowerCase();
    const emailOk  = u.email && u.email.toLowerCase() === identTrimmed;
    const cpfOk    = u.cpf   && u.cpf.replace(/[\.\-\/]/g,"")  === identSemPont;
    const cnpjOk   = u.cnpj  && u.cnpj.replace(/[\.\-\/]/g,"") === identSemPont;
    return emailOk || cpfOk || cnpjOk;
  };

  const buscarPerfis = () => {
    const perfisEncontrados = [];
    organizadores.filter(o => matchIdent(o) && o.status === "aprovado").forEach(o => {
      perfisEncontrados.push({ tipo:"organizador", dados:{ tipo:"organizador", ...o }, label:`Organizador — ${o.entidade}`, icon:"🏟️", sublabel:o.nome, organizadorId:o.id, organizadorNome:o.entidade });
    });
    funcionarios.filter(f => matchIdent(f) && f.ativo !== false).forEach(f => {
      const org = organizadores.find(o => o.id === f.organizadorId);
      if (!org || org.status !== "aprovado") return;
      perfisEncontrados.push({ tipo:"funcionario", dados:{ tipo:"funcionario", ...f, entidade:org.entidade, orgNome:org.nome }, label:`Funcionário — ${org.entidade}`, icon:"👔", sublabel:f.nome, organizadorId:f.organizadorId, organizadorNome:org.entidade });
    });
    equipes.filter(eq => matchIdent(eq) && eq.status !== "pendente" && eq.status !== "recusado").forEach(eq => {
      const org = organizadores.find(o => o.id === eq.organizadorId);
      perfisEncontrados.push({ tipo:"equipe", dados:{ tipo:"equipe", ...eq }, label:`Equipe — ${eq.entidade || eq.nome}`, icon:"🎽", sublabel:org ? org.entidade : "Sem organizador", organizadorId:eq.organizadorId, organizadorNome:org?.entidade || "" });
    });
    treinadores.filter(t => matchIdent(t) && t.ativo !== false).forEach(t => {
      const equipeVinc = equipes.find(eq => eq.id === t.equipeId);
      const org = organizadores.find(o => o.id === (t.organizadorId || equipeVinc?.organizadorId));
      perfisEncontrados.push({ tipo:"treinador", dados:{ tipo:"treinador", ...t, clube:equipeVinc?.clube, equipeNome:equipeVinc?.nome }, label:`Treinador — ${equipeVinc?.nome || "Equipe"}`, icon:"👨‍🏫", sublabel:org ? org.entidade : "", organizadorId:t.organizadorId || equipeVinc?.organizadorId, organizadorNome:org?.entidade || "" });
    });
    atletasUsuarios.filter(a => matchIdent(a) && a.status !== "pendente" && a.status !== "recusado").forEach(a => {
      const org = organizadores.find(o => o.id === a.organizadorId);
      perfisEncontrados.push({ tipo:"atleta", dados:{ tipo:"atleta", ...a }, label:`Atleta${_getClubeAtleta(a, equipes) ? ` — ${_getClubeAtleta(a, equipes)}` : ""}`, icon:"🏃", sublabel:org ? org.entidade : "Sem organizador", organizadorId:a.organizadorId, organizadorNome:org?.entidade || "" });
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

  const finalizarLogin = (perfisEncontrados) => {
    if (perfisEncontrados.length === 0) {
      const pendentes = [...organizadores.filter(o => matchIdent(o) && o.status === "pendente"), ...equipes.filter(eq => matchIdent(eq) && eq.status === "pendente"), ...atletasUsuarios.filter(a => matchIdent(a) && a.status === "pendente")];
      const recusados = [...organizadores.filter(o => matchIdent(o) && o.status === "recusado"), ...equipes.filter(eq => matchIdent(eq) && eq.status === "recusado"), ...atletasUsuarios.filter(a => matchIdent(a) && a.status === "recusado")];
      if (pendentes.length > 0) { setErro("⏳ Seu cadastro ainda está aguardando aprovação do administrador."); return; }
      if (recusados.length > 0) { setErro("❌ Seu cadastro foi recusado. Entre em contato com o administrador."); return; }
      if (atletasBase) {
        const atlBase = atletasBase.find(a => matchIdent(a));
        if (atlBase) {
          const dadosAtleta = { tipo:"atleta", ...atlBase, senhaTemporaria:true };
          loginComSelecao(dadosAtleta, [{ tipo:"atleta", dados:dadosAtleta, label:`Atleta`, icon:"🏃", sublabel:"", organizadorId:atlBase.organizadorId }]);
          return;
        }
      }
      setErro("E-mail, CPF ou senha incorretos.");
      return;
    }
    if (perfisEncontrados.length === 1) {
      const p = perfisEncontrados[0];
      loginComSelecao({ ...p.dados, _organizadorNome:p.organizadorNome, _temOutrosPerfis:false }, perfisEncontrados);
      return;
    }
    setPerfisDisponiveis(perfisEncontrados);
    setTela("selecionar-perfil");
  };

  const handleLogin = async () => {
    setErro("");
    if (!ident || !senha) { setErro("Preencha o identificador e a senha."); return; }
    const identTrimmed = ident.trim().toLowerCase();
    const adminIdents = [adminConfig.email.toLowerCase(), "admin"];
    if (adminIdents.includes(identTrimmed) && senha === adminConfig.senha) {
      login({ tipo:"admin", nome:adminConfig.nome, email:adminConfig.email });
      return;
    }

    // 1. Verificar senha local primeiro (evita erros 400 no console para usuários sem conta Firebase)
    const todos = [...organizadores, ...funcionarios, ...equipes, ...treinadores, ...atletasUsuarios];
    const matchLocal = todos.find(u => matchIdent(u) && u.senha === senha);

    if (matchLocal) {
      // Login local válido → autenticar direto, sem chamar Firebase Auth
      const perfis = buscarPerfis();
      finalizarLogin(perfis);
      return;
    }

    // 2. Sem senha local → tentar Firebase Auth (usuários que criaram conta pelo app)
    const emailParaAuth = encontrarEmail();
    if (!emailParaAuth) { setErro("E-mail, CPF ou CNPJ não encontrado."); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, emailParaAuth, senha);
      const perfis = buscarPerfis();
      finalizarLogin(perfis);
    } catch (firebaseErr) {
      if (firebaseErr.code === "auth/too-many-requests") {
        setErro("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
      } else {
        setErro("E-mail, CPF ou senha incorretos.");
      }
    } finally { setLoading(false); }
  };

  const handleRecuperarSenha = async () => {
    setFeedbackRecuperar(""); setErro("");
    if (!emailRecuperar.trim() || !emailRecuperar.includes("@")) { setErro("Informe um e-mail válido."); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailRecuperar.trim());
      setFeedbackRecuperar("✅ E-mail de recuperação enviado! Verifique sua caixa de entrada e spam.");
    } catch (err) {
      setErro(err.code === "auth/user-not-found" ? "E-mail não encontrado." : "Erro ao enviar e-mail. Tente novamente.");
    } finally { setLoading(false); }
  };

  if (modoRecuperar) return (
    <div style={styles.formPage}>
      <div style={{ ...styles.formCard, maxWidth:460 }}>
        <div style={styles.formIcon}>🔑</div>
        <h2 style={styles.formTitle}>Recuperar Senha</h2>
        <p style={styles.formSub}>Informe seu e-mail para receber o link de redefinição</p>
        {erro && <div style={styles.erro}>{erro}</div>}
        {feedbackRecuperar && <div style={{ ...styles.erro, background:"#0a2a0a", color:"#7acc44", borderColor:"#2a5a2a" }}>{feedbackRecuperar}</div>}
        <FormField label="E-mail cadastrado" value={emailRecuperar} onChange={setEmailRecuperar} placeholder="seuemail@exemplo.com" />
        <button style={styles.btnPrimary} onClick={handleRecuperarSenha} disabled={loading}>{loading ? "Enviando..." : "Enviar Link de Recuperação"}</button>
        <div style={{ textAlign:"center", marginTop:16 }}>
          <button style={styles.linkBtn} onClick={() => { setModoRecuperar(false); setErro(""); setFeedbackRecuperar(""); }}>← Voltar ao Login</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.formPage}>
      <div style={{ ...styles.formCard, maxWidth:460 }}>
        <div style={styles.formIcon}>🔐</div>
        <h2 style={styles.formTitle}>Entrar no Sistema</h2>
        <p style={styles.formSub}>Use seu e-mail, CPF ou CNPJ para acessar</p>
        {erro && <div style={styles.erro}>{erro}</div>}
        <FormField label="E-mail / CPF / CNPJ" value={ident} onChange={setIdent} placeholder="Digite seu e-mail, CPF ou CNPJ" />
        <div style={{ fontSize:11, color:"#555", marginTop:3, marginBottom:8 }}>O sistema buscará automaticamente seus perfis cadastrados</div>
        <FormField label="Senha" value={senha} onChange={setSenha} type="password" placeholder="••••••••" />
        <button style={styles.btnPrimary} onClick={handleLogin} disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
        <div style={{ textAlign:"center", marginTop:12 }}>
          <button style={styles.linkBtn} onClick={() => { setModoRecuperar(true); setErro(""); setEmailRecuperar(ident.includes("@") ? ident : ""); }}>🔑 Esqueci minha senha</button>
        </div>
        <div style={{ textAlign:"center", marginTop:16 }}>
          <p style={{ color:"#888", fontSize:13, marginBottom:12 }}>Não tem conta? Cadastre-se como:</p>
          <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
            <button style={{ ...styles.linkBtn, padding:"6px 12px", border:"1px solid #1E2130", borderRadius:6, background:"#0D0E12" }} onClick={() => setTela("cadastro-equipe")}>🎽 Equipe</button>
            <button style={{ ...styles.linkBtn, padding:"6px 12px", border:"1px solid #1E2130", borderRadius:6, background:"#0D0E12" }} onClick={() => setTela("cadastro-organizador")}>🏟️ Organizador</button>
            <button style={{ ...styles.linkBtn, padding:"6px 12px", border:"1px solid #1E2130", borderRadius:6, background:"#0D0E12" }} onClick={() => setTela("cadastro-atleta-login")}>🏃 Atleta</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TelaLogin;
