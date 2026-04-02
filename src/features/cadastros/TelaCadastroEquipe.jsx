import React, { useState } from "react";
import { auth, db, doc, setDoc, createUserWithEmailAndPassword, sendEmailVerification, signOut as firebaseSignOut } from "../../firebase";
import { sanitizeForFirestore } from "../../lib/firestore/sanitize";
import { validarCNPJ, emailJaCadastrado } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import { criarInscricaoStyles } from "../inscricoes/inscricaoStyles";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";

import BlocoLGPD from "../ui/BlocoLGPD";

function TelaCadastroEquipe() {
  const { usuarioLogado, login } = useAuth();
  const { equipes, adicionarEquipe } = useEvento();
  const { setTela, organizadores, atletasUsuarios, funcionarios, treinadores, adicionarSolicitacaoEquipe } = useApp();
  const t = useTema();
  const s = useStylesResponsivos(criarInscricaoStyles(t));
  const [form, setForm] = useState({ nome: "", sigla: "", cidade: "", uf: "", email: "", senha: "", cnpj: "", fone: "", organizadorId: "" });
  const [ok, setOk] = useState(false);
  const [erros, setErros] = useState({});
  const [lgpdAceite, setLgpdAceite] = useState(false);

  // ── Fluxo doc existente: CNPJ encontrado → pedir login ──
  const [docExistente, setDocExistente] = useState(null); // registro encontrado
  const [docModo, setDocModo] = useState("novo"); // "novo" | "login" | "vincular"
  const [loginForm, setLoginForm] = useState({ email: "", senha: "" });
  const [loginErro, setLoginErro] = useState("");

  // Verificação CNPJ cross-organizador
  const verificarCnpjExistente = (cnpj) => {
    const limpo = cnpj.replace(/\D/g, '');
    if (limpo.length < 14 || !validarCNPJ(limpo)) { setDocExistente(null); setDocModo("novo"); return; }
    const encontrado = equipes.find(i => i.cnpj && i.cnpj.replace(/\D/g, '') === limpo);
    if (encontrado) {
      setDocExistente(encontrado);
      setDocModo("login");
    } else {
      setDocExistente(null);
      setDocModo("novo");
    }
  };

  const handleLoginExistente = () => {
    setLoginErro("");
    if (!loginForm.email || !loginForm.senha) { setLoginErro("Preencha e-mail e senha."); return; }
    const identNorm = loginForm.email.trim().toLowerCase();
    const match = equipes.find(eq => {
      const cnpjOk = eq.cnpj && eq.cnpj.replace(/\D/g, '') === docExistente.cnpj.replace(/\D/g, '');
      const emailOk = eq.email && eq.email.toLowerCase() === identNorm;
      return cnpjOk && emailOk && eq.senha === loginForm.senha;
    });
    if (!match) { setLoginErro("E-mail ou senha incorretos para este CNPJ."); return; }
    // Autenticou — preencher dados e ir para modo vincular
    setForm(prev => ({
      ...prev,
      nome: match.nome || prev.nome,
      email: match.email || prev.email,
      senha: match.senha || prev.senha,
      fone: match.fone || prev.fone,
      cnpj: match.cnpj || prev.cnpj,
    }));
    setDocModo("vincular");
  };

  const validar = () => {
    const e = {};
    const duplicados = [];

    if (!form.nome.trim()) e.nome = "Nome obrigatório";
    else if (equipes.some(eq => eq.nome?.trim().toLowerCase() === form.nome.trim().toLowerCase())) {
      e.nome = "Este nome já possui cadastro no sistema.";
      duplicados.push("Nome da Equipe");
    }

    if (!form.sigla.trim()) e.sigla = "Sigla obrigatória";
    else if (equipes.some(eq => eq.sigla?.trim().toLowerCase() === form.sigla.trim().toLowerCase())) {
      e.sigla = "Esta sigla já possui cadastro no sistema.";
      duplicados.push("Sigla");
    }

    if (!form.cidade.trim()) e.cidade = "Cidade é obrigatória";
    if (!form.uf.trim()) e.uf = "Estado é obrigatório";

    if (!form.email) e.email = "E-mail obrigatório";
    else if (docModo === "novo" && emailJaCadastrado(form.email, { organizadores, equipes, atletasUsuarios, funcionarios, treinadores })) {
      e.email = "Este e-mail já possui cadastro no sistema.";
      duplicados.push("E-mail");
    }

    if (docModo === "novo" && form.senha.length < 6) e.senha = "Mínimo 6 caracteres";

    if (!form.cnpj) e.cnpj = "CNPJ obrigatório";
    else if (!validarCNPJ(form.cnpj)) e.cnpj = "CNPJ inválido";

    if (duplicados.length > 0) {
      e._duplicados = duplicados.length === 1
        ? `O campo "${duplicados[0]}" já possui cadastro no sistema. Verifique os dados e tente novamente.`
        : `Os campos ${duplicados.map(d => `"${d}"`).join(", ")} já possuem cadastro no sistema. Verifique os dados e tente novamente.`;
    }

    return e;
  };

  const handleSubmit = async () => {
    
    const e = validar();
    const orgIdFinal = form.organizadorId || (usuarioLogado?.tipo === "organizador" ? usuarioLogado.id : null);
    if (usuarioLogado?.tipo === "admin" && !form.organizadorId) e.organizadorId = "Selecione o organizador responsável";
    if (!lgpdAceite) e.lgpd = "É necessário aceitar a Política de Privacidade para continuar.";

    // Verificação de unicidade: CNPJ + organizadorId no array equipes
    const cnpjLimpo = form.cnpj.replace(/\D/g, '');
    const duplicadoNoOrg = equipes.some(eq =>
      eq.organizadorId === orgIdFinal &&
      eq.cnpj && eq.cnpj.replace(/\D/g, '') === cnpjLimpo
    );
    if (duplicadoNoOrg) e.cnpj = "CNPJ já cadastrado como equipe neste organizador.";

    if (Object.keys(e).length) { setErros(e); return; }

    // Se veio do fluxo vincular, usa a senha do registro original
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

    const { senha: _senha, ...formSemSenha } = form;
    const equipeObj = {
      ...formSemSenha,
      sigla: form.sigla.trim().toUpperCase(),
      cidade: form.cidade.trim(),
      uf: form.uf.trim().toUpperCase(),
      organizadorId: orgIdFinal,
      status: "pendente",
      dataCadastro: new Date().toISOString(),
      lgpdConsentimento: true,
      lgpdConsentimentoData: new Date().toISOString(),
      lgpdVersao: "2.0",
      id: Date.now().toString()
    };
    await adicionarEquipe(equipeObj);

    // Cria solicitação de aprovação
    const org = organizadores?.find(o => o.id === orgIdFinal);
    adicionarSolicitacaoEquipe?.({
      id: Date.now().toString() + "_sol",
      equipeId: equipeObj.id,
      equipeNome: equipeObj.nome,
      equipeSigla: equipeObj.sigla,
      equipeEmail: equipeObj.email,
      equipeCnpj: equipeObj.cnpj,
      equipeCidade: equipeObj.cidade,
      equipeUf: equipeObj.uf,
      organizadorId: orgIdFinal || null,
      organizadorNome: org?.nome || null,
      status: "pendente",
      data: new Date().toISOString(),
    });

    // Flush solicitação no Firestore enquanto auth está ativo, depois signOut
    try {
      const key = "atl_sol_equipe";
      const docRef = doc(db, "state", key);
      const current = JSON.parse(window.localStorage.getItem(key) || "[]");
      await setDoc(docRef, { value: sanitizeForFirestore(current) });
    } catch (err) {
      console.error("[CadastroEquipe] Firestore flush error:", err);
    }
    await firebaseSignOut(auth).catch(() => {}); // Não deixar logado após cadastro

    setOk(true);
  };

  if (ok) return (
    <div style={s.formPage}>
      <div style={s.formCard}>
        <div style={{ fontSize: 64, textAlign: "center" }}>⏳</div>
        <h2 style={{ ...s.formTitle, textAlign: "center" }}>Cadastro enviado!</h2>
        <p style={{ textAlign: "center", color: t.textTertiary, marginBottom: 8 }}>
          Seu cadastro foi recebido e está aguardando aprovação.
        </p>
        <p style={{ textAlign: "center", color: t.textDimmed, fontSize: 13, marginBottom: 24 }}>
          {form.organizadorId
            ? "O organizador responsável e o administrador serão notificados para aprovar sua equipe."
            : "Como não foi selecionado um organizador, o administrador irá revisar e vincular sua equipe."}
        </p>
        <button style={s.btnPrimary} onClick={() => setTela("login")}>Voltar ao Login</button>
      </div>
    </div>
  );

  return (
    <div style={s.formPage}>
      <div style={s.formCard}>
        <div style={s.formIcon}>🎽</div>
        <h2 style={s.formTitle}>Cadastro de Equipe</h2>
        <p style={s.formSub}>Crie sua conta para gerenciar atletas e inscrições</p>

        {/* Banner de duplicidade */}
        {erros._duplicados && (
          <div style={{ background: `${t.danger}11`, border: `1px solid ${t.danger}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: t.danger, fontSize: 13, lineHeight: 1.5 }}>
            ⚠️ {erros._duplicados}
          </div>
        )}

        {/* Passo 1: CNPJ — sempre primeiro */}
        <div style={{ marginBottom: 16 }}>
          <FormField label="CNPJ *" value={form.cnpj} onChange={(v) => { setForm({ ...form, cnpj: v }); verificarCnpjExistente(v); }} placeholder="00.000.000/0001-00" error={erros.cnpj} />
        </div>

        {/* CNPJ existente → modo login */}
        {docModo === "login" && docExistente && (
          <div style={{ background: t.accentBg, border: `2px solid ${t.accentBorder}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ color: t.accent, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>🔄 CNPJ já cadastrado no sistema</div>
            <div style={{ color: t.textTertiary, fontSize: 12, marginBottom: 4 }}>
              Equipe: <strong style={{ color: t.textPrimary }}>{docExistente.nome}</strong>
            </div>
            <div style={{ color: t.textMuted, fontSize: 12, marginBottom: 12 }}>
              Para vincular esta equipe a outro organizador, confirme suas credenciais:
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

        {/* Modo vincular — autenticou, agora escolhe org */}
        {docModo === "vincular" && (
          <div style={{ background: `${t.success}11`, border: `2px solid ${t.success}66`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ color: t.success, fontSize: 13, fontWeight: 700 }}>✅ Identidade confirmada!</div>
            <div style={{ color: t.textTertiary, fontSize: 12, marginTop: 4 }}>Dados carregados. Selecione o organizador para criar o novo vínculo.</div>
          </div>
        )}

        {/* Formulário de dados (novo cadastro ou modo vincular) */}
        {(docModo === "novo" || docModo === "vincular") && (
          <>
            <div style={s.grid2form}>
              <FormField label="Nome da Equipe *" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} error={erros.nome} />
              <FormField label="Sigla *" value={form.sigla} onChange={(v) => setForm({ ...form, sigla: v.toUpperCase() })} placeholder="Ex: FMA" error={erros.sigla} />
              <FormField label="Cidade *" value={form.cidade} onChange={(v) => setForm({ ...form, cidade: v })} error={erros.cidade} />
              <FormField label="Estado *" value={form.uf} onChange={(v) => setForm({ ...form, uf: v.toUpperCase().slice(0,2) })} placeholder="Ex: MG" error={erros.uf} />
              <FormField label="E-mail *" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" error={erros.email} />
              <FormField label="Telefone" value={form.fone} onChange={(v) => setForm({ ...form, fone: v })} />
              {docModo === "novo" && (
                <FormField label="Senha *" value={form.senha} onChange={(v) => setForm({ ...form, senha: v })} type="password" error={erros.senha} />
              )}
            </div>

            {/* Vinculação ao Organizador e Equipe */}
            <div style={{ background: t.bgHeaderSolid, padding: 20, borderRadius: 8, border: `1px solid ${t.border}`, marginTop: 16 }}>
              <h4 style={{ color: t.accent, marginBottom: 16 }}>📍 Vinculação ao Organizador</h4>
              
              {/* Organizador — sempre visível para seleção */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                  Organizador Responsável *
                </label>
                <select
                  value={form.organizadorId}
                  onChange={(e) => setForm({ ...form, organizadorId: e.target.value })}
                  style={s.input}
                >
                  <option value="">Selecione o organizador...</option>
                  {organizadores?.filter(o => o.status === "aprovado").map(org => (
                    <option key={org.id} value={org.id}>{org.nome} - {org.entidade}</option>
                  ))}
                </select>
                {erros.organizadorId && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.organizadorId}</div>}
                <div style={{ color: t.textDimmed, fontSize: 11, marginTop: 4 }}>
                  {docModo === "vincular" ? "Selecione o novo organizador para vincular" : "Selecione o organizador responsável pela equipe"}
                </div>
              </div>
            </div>

            <BlocoLGPD aceite={lgpdAceite} onChange={setLgpdAceite} erro={erros.lgpd} />

            <button style={{ ...s.btnPrimary, marginTop: 16 }} onClick={handleSubmit}>
              {docModo === "vincular" ? "🔗 Criar Vínculo" : "Criar Conta"}
            </button>
          </>
        )}

        <div style={s.formLink}>
          Já tem conta?{" "}
          <button style={s.linkBtn} onClick={() => setTela("login")}>Entrar</button>
        </div>
      </div>
    </div>
  );
}


export default TelaCadastroEquipe;
