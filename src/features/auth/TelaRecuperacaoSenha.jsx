import authStyles from "./authStyles";
const styles = authStyles;
import React, { useState } from "react";
import { auth, sendPasswordResetEmail } from "../../firebase";

function TelaRecuperacaoSenha({ setTela, equipes, organizadores, atletasUsuarios, funcionarios, treinadores, gerarSenhaTemp, aplicarSenhaTemp, adicionarSolicitacaoRecuperacao }) {
  const [perfil, setPerfil]   = useState("");
  const [email, setEmail]     = useState("");
  const [docVal, setDocVal]   = useState("");
  const [passo, setPasso]     = useState(1);
  const [metodo, setMetodo]   = useState("");
  const [usuario, setUsuario] = useState(null);
  const [senhaGerada, setSenhaGerada] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro]       = useState("");

  const PERFIS_REC = [
    { id:"organizador", icon:"🏟️", label:"Organizador", usaCnpj:true },
    { id:"funcionario", icon:"👥",  label:"Funcionário", usaCnpj:false },
    { id:"equipe",      icon:"🎽",  label:"Equipe",      usaCnpj:true },
    { id:"treinador",   icon:"👨‍🏫", label:"Treinador",   usaCnpj:false },
    { id:"atleta",      icon:"🏃",  label:"Atleta",      usaCnpj:false },
  ];

  const stores = { equipe:equipes, organizador:organizadores, atleta:atletasUsuarios, funcionario:funcionarios, treinador:treinadores };
  const perfilInfo = PERFIS_REC.find(p => p.id === perfil);
  const usaCnpj = perfilInfo?.usaCnpj || false;

  const handleBuscar = () => {
    setErro("");
    if (!perfil)        { setErro("Selecione seu perfil."); return; }
    if (!email)         { setErro("Digite seu e-mail."); return; }
    if (!docVal.trim()) { setErro(usaCnpj ? "Digite seu CNPJ." : "Digite seu CPF."); return; }
    const docLimpo = docVal.replace(/\D/g, "");
    const campoDoc = usaCnpj ? "cnpj" : "cpf";
    const u = (stores[perfil] || []).find(u => u.email && u.email.toLowerCase() === email.toLowerCase() && u[campoDoc] && u[campoDoc].replace(/\D/g,"") === docLimpo);
    if (!u) { setErro("Nenhuma conta encontrada com esse e-mail e documento para este perfil."); return; }
    setUsuario(u); setPasso(2);
  };

  const handleSolicitarAdmin = () => {
    const senha = gerarSenhaTemp();
    setSenhaGerada(senha);
    adicionarSolicitacaoRecuperacao({ id:Date.now().toString(), tipo:perfil, userId:usuario.id, nome:usuario.nome, email:usuario.email, senhaTemp:senha, status:"pendente", data:new Date().toISOString() });
    setMetodo("admin"); setPasso(3);
  };

  const inputStyle = { background:"#1a1c22", border:"1px solid #2a2d3a", color:"#fff", borderRadius:6, padding:"10px 14px", width:"100%", fontSize:14, boxSizing:"border-box" };

  return (
    <div style={styles.formPage}>
      <div style={{ ...styles.formCard, maxWidth:480 }}>
        <div style={styles.formIcon}>🔑</div>
        <h2 style={styles.formTitle}>Recuperar Senha</h2>

        {passo === 1 && (<>
          <p style={styles.formSub}>Selecione seu perfil e confirme sua identidade</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:18 }}>
            {PERFIS_REC.map(p => (
              <button key={p.id} onClick={() => { setPerfil(p.id); setErro(""); setDocVal(""); }}
                style={{ background:perfil===p.id?"#1a2a1a":"#0D0E12", border:`2px solid ${perfil===p.id?"#1976D2":"#1E2130"}`, borderRadius:8, padding:"10px 6px", cursor:"pointer", textAlign:"center" }}>
                <div style={{ fontSize:20, marginBottom:3 }}>{p.icon}</div>
                <div style={{ color:perfil===p.id?"#1976D2":"#aaa", fontWeight:700, fontSize:12 }}>{p.label}</div>
              </button>
            ))}
          </div>
          {erro && <div style={styles.erro}>{erro}</div>}
          <div style={{ marginBottom:14 }}>
            <label style={styles.label}>E-mail cadastrado</label>
            <input style={inputStyle} type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {perfil && (
            <div style={{ marginBottom:14 }}>
              <label style={styles.label}>{usaCnpj ? "CNPJ" : "CPF"}</label>
              <input style={inputStyle} placeholder={usaCnpj ? "00.000.000/0001-00" : "000.000.000-00"} value={docVal} onChange={e => setDocVal(e.target.value)} onKeyDown={e => e.key === "Enter" && handleBuscar()} />
            </div>
          )}
          <button style={styles.btnPrimary} onClick={handleBuscar}>Continuar →</button>
          <div style={{ textAlign:"center", marginTop:12 }}>
            <button style={styles.linkBtn} onClick={() => setTela("login")}>← Voltar ao Login</button>
          </div>
        </>)}

        {passo === 2 && (<>
          <p style={styles.formSub}>Conta encontrada: <strong style={{ color:"#1976D2" }}>{usuario?.nome}</strong></p>
          <div style={{ background:"#0a1a2a", border:"1px solid #1976D2", borderRadius:10, padding:"18px 20px", marginBottom:16 }}>
            <div style={{ color:"#1976D2", fontWeight:700, fontSize:14, marginBottom:8 }}>📧 Recuperar por E-mail</div>
            <div style={{ color:"#aaa", fontSize:12, marginBottom:12, lineHeight:1.5 }}>Enviaremos um link para <strong style={{ color:"#fff" }}>{usuario?.email}</strong> para redefinir sua senha.</div>
            {erro && <div style={{ ...styles.erro, marginBottom:10 }}>{erro}</div>}
            <button style={styles.btnPrimary} onClick={async () => {
              setErro("");
              try { await sendPasswordResetEmail(auth, usuario.email); setMetodo("email"); setPasso(3); }
              catch (err) { setErro(err.code === "auth/user-not-found" ? "Conta ainda não migrada. Solicite ao administrador abaixo." : "Erro ao enviar e-mail. Tente novamente."); }
            }}>Enviar Link de Recuperação</button>
          </div>
          <div style={{ textAlign:"center", color:"#555", fontSize:12, marginBottom:12 }}>— ou —</div>
          <button onClick={handleSolicitarAdmin} style={{ background:"#0a0b0e", border:"1px solid #1E2130", borderRadius:8, padding:"14px 18px", cursor:"pointer", width:"100%", textAlign:"left" }}>
            <div style={{ color:"#888", fontWeight:600, fontSize:13 }}>🛡️ Solicitar ao Administrador</div>
            <div style={{ color:"#555", fontSize:11, marginTop:3 }}>O administrador poderá redefinir sua senha manualmente.</div>
          </button>
          <div style={{ textAlign:"center", marginTop:16 }}>
            <button style={styles.linkBtn} onClick={() => { setPasso(1); setErro(""); }}>← Voltar</button>
          </div>
        </>)}

        {passo === 3 && metodo === "email" && (<>
          <div style={{ textAlign:"center", marginBottom:16 }}>
            <div style={{ fontSize:48 }}>📧</div>
            <h3 style={{ color:"#1976D2", marginBottom:8 }}>E-mail Enviado!</h3>
            <p style={{ color:"#aaa", fontSize:13, lineHeight:1.6 }}>Enviamos um link de recuperação para<br/><strong style={{ color:"#fff" }}>{usuario?.email}</strong></p>
            <p style={{ color:"#888", fontSize:12, lineHeight:1.6, marginTop:12 }}>Verifique sua caixa de entrada e a pasta de spam.<br/>O link expira em 1 hora.</p>
          </div>
          <button style={styles.btnPrimary} onClick={() => setTela("login")}>← Voltar ao Login</button>
        </>)}

        {passo === 3 && metodo === "admin" && (<>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:56, marginBottom:12 }}>🛡️</div>
            <h3 style={{ color:"#88aaff", marginBottom:8 }}>Solicitação enviada!</h3>
            <p style={{ color:"#aaa", fontSize:13, lineHeight:1.7 }}>O administrador foi notificado e enviará uma senha temporária para<br/><strong style={{ color:"#1976D2" }}>{usuario?.email}</strong></p>
          </div>
          <button style={{ ...styles.btnGhost, marginTop:20, width:"100%" }} onClick={() => setTela("login")}>← Voltar ao Login</button>
        </>)}
      </div>
    </div>
  );
}

export default TelaRecuperacaoSenha;
