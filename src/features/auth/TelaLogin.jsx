import React, { useState } from "react";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, db, getDoc, doc } from "../../firebase";
import { _getClubeAtleta } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";

function getStyles(t) {
  return {
    page:       { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
    formPage:   { maxWidth: 640, margin: "60px auto", padding: "0 24px 80px" },
    formCard:   { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32, marginBottom: 20 },
    formIcon:   { fontSize: 48, textAlign: "center", marginBottom: 16 },
    formTitle:  { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: t.textPrimary, textAlign: "center", marginBottom: 8 },
    formSub:    { color: t.textDimmed, textAlign: "center", fontSize: 14, marginBottom: 24 },
    formLink:   { textAlign: "center", marginTop: 16, color: t.textDimmed, fontSize: 13 },
    label:      { display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
    input:      { width: "100%", background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
    select:     { width: "100%", background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
    btnPrimary: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, width: "100%", transition: "all 0.2s" },
    btnSecondary:{ background: "transparent", color: t.accent, border: `2px solid ${t.accent}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
    btnGhost:   { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
    erro:       { background: `${t.danger}15`, border: `1px solid ${t.danger}`, color: t.danger, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
    linkBtn:    { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", padding: 0 },
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
  const [modalPolitica, setModalPolitica] = useState(false);

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
    treinadores.filter(tr => matchIdent(tr) && tr.ativo !== false).forEach(tr => {
      const equipeVinc = equipes.find(eq => eq.id === tr.equipeId);
      const org = organizadores.find(o => o.id === (tr.organizadorId || equipeVinc?.organizadorId));
      perfisEncontrados.push({ tipo:"treinador", dados:{ tipo:"treinador", ...tr, clube:equipeVinc?.clube, equipeNome:equipeVinc?.nome }, label:`Treinador — ${equipeVinc?.nome || "Equipe"}`, icon:"👨‍🏫", sublabel:org ? org.entidade : "", organizadorId:tr.organizadorId || equipeVinc?.organizadorId, organizadorNome:org?.entidade || "" });
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

  // ── Grava consentimento retroativo em todos os perfis encontrados ─────────
  const gravarConsentimento = (perfis) => {
    const agora = new Date().toISOString();
    const campos = { lgpdConsentimento: true, lgpdConsentimentoData: agora, lgpdVersao: "1.0" };

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
      registrarAcao(p.dados?.id, p.dados?.nome || p.sublabel, "Consentimento LGPD — primeiro login",
        "Política de Privacidade v1.0 aceita retroativamente", p.organizadorId || null, { modulo: "lgpd" });
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

    let precisaConsentimento = false;

    for (const p of perfis) {
      // Equipes ficam na coleção própria "equipes/"
      if (p.tipo === "equipe") {
        if (!p.dados?.lgpdConsentimento) {
          try {
            const snap = await getDoc(doc(db, "equipes", p.dados?.id));
            if (snap.exists() && snap.data()?.lgpdConsentimento) continue;
          } catch (_) {}
          precisaConsentimento = true;
          break;
        }
        continue;
      }
      // Demais tipos ficam em state/{chave} via useLocalStorage
      if (!p.dados?.lgpdConsentimento) {
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
      setFeedbackRecuperar("✅ E-mail de recuperação enviado! Verifique sua caixa de entrada e spam.");
    } catch (err) {
      setErro(err.code === "auth/user-not-found" ? "E-mail não encontrado." : "Erro ao enviar e-mail. Tente novamente.");
    } finally { setLoading(false); setLoadingMsg(""); }
  };

  // ── Tela de Consentimento Retroativo ─────────────────────────────────────
  if (modoConsentimento) return (
    <div style={s.formPage}>
      <LoginStyle />

      {/* Modal Política de Privacidade */}
      {modalPolitica && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:2000,
          display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={() => setModalPolitica(false)}>
          <div style={{ background:t.bgCard, border:`1px solid ${t.accent}`, borderRadius:14,
            padding:28, maxWidth:560, width:"100%", maxHeight:"80vh", overflowY:"auto" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800,
              color:t.textPrimary, marginBottom:16 }}>📄 Política de Privacidade — GerenTrack</h3>
            <div style={{ fontSize:13, color:t.textTertiary, lineHeight:1.8 }}>
              <p style={{ marginBottom:10 }}><strong style={{ color:t.textPrimary }}>1. Controlador dos dados</strong><br/>
              O GerenTrack é o responsável pelo tratamento dos seus dados pessoais, nos termos da Lei nº 13.709/2018 (LGPD).</p>
              <p style={{ marginBottom:10 }}><strong style={{ color:t.textPrimary }}>2. Dados coletados</strong><br/>
              Coletamos: nome completo, e-mail, telefone, CNPJ, cidade, estado e dados de acesso (login). Para atletas: também CPF, data de nascimento e sexo.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color:t.textPrimary }}>3. Finalidade do tratamento</strong><br/>
              Os dados são usados exclusivamente para: gestão de competições de atletismo, inscrições em provas, emissão de súmulas e resultados, e comunicação relacionada às competições.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color:t.textPrimary }}>4. Base legal</strong><br/>
              O tratamento é realizado com base no consentimento do titular (Art. 7º, I), na execução de contrato (Art. 7º, V) e no legítimo interesse (Art. 7º, IX) da organização esportiva.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color:t.textPrimary }}>5. Compartilhamento</strong><br/>
              Seus dados podem ser compartilhados com organizadores de competições nas quais você participa. Não vendemos dados a terceiros.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color:t.textPrimary }}>6. Retenção</strong><br/>
              Resultados esportivos são mantidos permanentemente por integridade do histórico. Dados pessoais de contas excluídas são anonimizados.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color:t.textPrimary }}>7. Seus direitos (Art. 18º LGPD)</strong><br/>
              Você tem direito a: confirmar a existência do tratamento, acessar, corrigir, anonimizar, bloquear, eliminar seus dados e revogar o consentimento a qualquer momento nas Configurações da conta.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color:t.textPrimary }}>8. Segurança</strong><br/>
              Utilizamos autenticação via Firebase Auth e armazenamento seguro no Firestore. Dados sensíveis (senhas) nunca são armazenados localmente.</p>
              <p style={{ marginBottom:0 }}><strong style={{ color:t.textPrimary }}>9. Contato</strong><br/>
              Para exercer seus direitos ou tirar dúvidas: <span style={{ color:t.accent }}>gerentrack@gmail.com</span></p>
            </div>
            <button style={{ marginTop:20, background:t.accent, color:"#fff", border:"none",
              borderRadius:8, padding:"10px 24px", cursor:"pointer", fontSize:13, fontWeight:700,
              fontFamily:"'Barlow Condensed',sans-serif" }}
              onClick={() => setModalPolitica(false)}>✓ Fechar</button>
          </div>
        </div>
      )}

      <div style={{ ...s.formCard, maxWidth:500 }}>
        <div style={{ fontSize:48, textAlign:"center", marginBottom:12 }}>🔒</div>
        <h2 style={s.formTitle}>Atualização da Política de Privacidade</h2>
        <p style={{ ...s.formSub, marginBottom:20 }}>
          Para continuar usando o GerenTrack, precisamos do seu consentimento conforme a
          <strong style={{ color:t.accent }}> Lei Geral de Proteção de Dados (LGPD)</strong>.
        </p>

        {/* Resumo do que será tratado */}
        <div style={{ background:t.bgCardAlt, border:`1px solid ${t.accentBorder}`, borderRadius:10,
          padding:"14px 16px", marginBottom:20, fontSize:13, color:t.textTertiary, lineHeight:1.7 }}>
          <strong style={{ color:t.textPrimary, display:"block", marginBottom:8 }}>📋 Resumo do tratamento:</strong>
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
              <button type="button" onClick={() => setModalPolitica(true)}
                style={{ background:"none", border:"none", color:t.accent, cursor:"pointer",
                  fontSize:13, padding:0, textDecoration:"underline" }}>
                Política de Privacidade
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
        <div style={s.formIcon}>🔑</div>
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
        <div style={s.formIcon}>🔐</div>
        <h2 style={s.formTitle}>Entrar no Sistema</h2>
        <p style={s.formSub}>Use seu e-mail, CPF ou CNPJ para acessar</p>
        {erro && <div style={s.erro}>{erro}</div>}
        <FormField label="E-mail / CPF / CNPJ" value={ident} onChange={setIdent} placeholder="Digite seu e-mail, CPF ou CNPJ" />
        <div style={{ fontSize:11, color:t.textDimmed, marginTop:3, marginBottom:8 }}>O sistema buscará automaticamente seus perfis cadastrados</div>
        <FormField label="Senha" value={senha} onChange={setSenha} type="password" placeholder="••••••••" />
        <button style={s.btnPrimary} onClick={handleLogin} disabled={loading}>{loading ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{width:16,height:16,borderRadius:"50%",border:"2px solid #ffffff44",borderTopColor:"#fff",display:"inline-block",animation:"spin 0.7s linear infinite"}} />{loadingMsg || "Entrando..."}</span> : "Entrar"}</button>
        <div style={{ textAlign:"center", marginTop:12 }}>
          <button style={s.linkBtn} onClick={() => { setModoRecuperar(true); setErro(""); setEmailRecuperar(ident.includes("@") ? ident : ""); }}>🔑 Esqueci minha senha</button>
        </div>
        <div style={{ textAlign:"center", marginTop:16 }}>
          <p style={{ color:t.textMuted, fontSize:13 }}>
            Não tem conta?{" "}
            <button
              onClick={() => setCadastroAberto(prev => !prev)}
              style={{ background:"none", border:"none", color:t.accent, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'Barlow', sans-serif", textDecoration:"underline" }}>
              Cadastre-se
            </button>
          </p>
          {cadastroAberto && (
            <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginTop:10 }}>
              <button style={{ ...s.linkBtn, padding:"6px 12px", border:`1px solid ${t.border}`, borderRadius:6, background:t.bgHeaderSolid }} onClick={() => setTela("cadastro-equipe")}>🎽 Equipe</button>
              <button style={{ ...s.linkBtn, padding:"6px 12px", border:`1px solid ${t.border}`, borderRadius:6, background:t.bgHeaderSolid }} onClick={() => setTela("cadastro-organizador")}>🏟️ Organizador</button>
              <button style={{ ...s.linkBtn, padding:"6px 12px", border:`1px solid ${t.border}`, borderRadius:6, background:t.bgHeaderSolid }} onClick={() => setTela("cadastro-atleta-login")}>🏃 Atleta</button>
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
