import React, { useState } from "react";
import { validarCNPJ, emailJaCadastrado } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import inscricaoStyles from "../inscricoes/inscricaoStyles";

const styles = inscricaoStyles;

function TelaCadastroEquipe({ setTela, adicionarEquipe, login, organizadores, usuarioLogado, equipes, atletasUsuarios, funcionarios, treinadores }) {
  const [form, setForm] = useState({ nome: "", email: "", senha: "", entidade: "", cnpj: "", fone: "" , organizadorId:"", equipeAvulsa:false, equipeId: "" });
  const [ok, setOk] = useState(false);
  const [erros, setErros] = useState({});

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
    if (!form.nome) e.nome = "Nome obrigatório";
    if (!form.email) e.email = "E-mail obrigatório";
    else if (docModo === "novo" && emailJaCadastrado(form.email, { organizadores, equipes, atletasUsuarios, funcionarios, treinadores }))
      e.email = "E-mail já cadastrado em outra conta.";
    if (docModo === "novo" && form.senha.length < 6) e.senha = "Mínimo 6 caracteres";
    if (!form.cnpj) e.cnpj = "CNPJ obrigatório";
    else if (!validarCNPJ(form.cnpj)) e.cnpj = "CNPJ inválido";
    return e;
  };

  const handleSubmit = async () => {
    
    const e = validar();
    const orgIdFinal = form.organizadorId || (usuarioLogado?.tipo === "organizador" ? usuarioLogado.id : null);
    if (usuarioLogado?.tipo === "admin" && !form.organizadorId) e.organizadorId = "Selecione o organizador responsável";

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
      await createUserWithEmailAndPassword(auth, form.email.trim(), senhaFinal);
    } catch (err) {
      if (err.code !== "auth/email-already-in-use") {
        if (err.code === "auth/weak-password") { setErros({ senha: "Senha fraca. Use pelo menos 6 caracteres." }); return; }
      }
    }

    const t = { 
      ...form,
      senha: senhaFinal,
      organizadorId: orgIdFinal,
      equipeId: form.equipeId || null,
      equipeAvulsa: form.equipeAvulsa || false,
      status: "ativa",
      dataCadastro: new Date().toISOString(),
      id: Date.now().toString() 
    };
    adicionarEquipe(t);
    login({ tipo: "equipe", ...t });
    setOk(true);
  };

  if (ok) return (
    <div style={styles.formPage}>
      <div style={styles.formCard}>
        <div style={{ fontSize: 64, textAlign: "center" }}>✅</div>
        <h2 style={{ ...styles.formTitle, textAlign: "center" }}>
          {docModo === "vincular" ? "Vínculo criado!" : "Cadastro realizado!"}
        </h2>
        <p style={{ textAlign: "center", color: "#aaa" }}>Bem-vindo ao sistema, {form.nome}!</p>
        <button style={styles.btnPrimary} onClick={() => setTela("painel")}>Ir para o Painel</button>
      </div>
    </div>
  );

  return (
    <div style={styles.formPage}>
      <div style={styles.formCard}>
        <div style={styles.formIcon}>🎽</div>
        <h2 style={styles.formTitle}>Cadastro de Equipe</h2>
        <p style={styles.formSub}>Crie sua conta para gerenciar atletas e inscrições</p>

        {/* Passo 1: CNPJ — sempre primeiro */}
        <div style={{ marginBottom: 16 }}>
          <FormField label="CNPJ *" value={form.cnpj} onChange={(v) => { setForm({ ...form, cnpj: v }); verificarCnpjExistente(v); }} placeholder="00.000.000/0001-00" error={erros.cnpj} />
        </div>

        {/* CNPJ existente → modo login */}
        {docModo === "login" && docExistente && (
          <div style={{ background: "#0a0f1a", border: "2px solid #3a6abf", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ color: "#88aaff", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>🔄 CNPJ já cadastrado no sistema</div>
            <div style={{ color: "#aaa", fontSize: 12, marginBottom: 4 }}>
              Equipe: <strong style={{ color: "#fff" }}>{docExistente.nome}</strong>
            </div>
            <div style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>
              Para vincular esta equipe a outro organizador, confirme suas credenciais:
            </div>
            {loginErro && <div style={{ ...styles.erro, marginBottom: 12 }}>{loginErro}</div>}
            <FormField label="E-mail da conta" value={loginForm.email} onChange={v => setLoginForm({ ...loginForm, email: v })} type="email" placeholder="E-mail cadastrado" />
            <FormField label="Senha" value={loginForm.senha} onChange={v => setLoginForm({ ...loginForm, senha: v })} type="password" placeholder="Senha da conta" />
            <button style={{ ...styles.btnPrimary, marginTop: 8 }} onClick={handleLoginExistente}>🔐 Confirmar Identidade</button>
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <button style={styles.linkBtn} onClick={() => setTela("recuperar-senha")}>Esqueci minha senha</button>
            </div>
          </div>
        )}

        {/* Modo vincular — autenticou, agora escolhe org */}
        {docModo === "vincular" && (
          <div style={{ background: "#0a1a0a", border: "2px solid #2a8a2a", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ color: "#7cfc7c", fontSize: 13, fontWeight: 700 }}>✅ Identidade confirmada!</div>
            <div style={{ color: "#aaa", fontSize: 12, marginTop: 4 }}>Dados carregados. Selecione o organizador para criar o novo vínculo.</div>
          </div>
        )}

        {/* Formulário de dados (novo cadastro ou modo vincular) */}
        {(docModo === "novo" || docModo === "vincular") && (
          <>
            <div style={styles.grid2form}>
              <FormField label="Nome Completo *" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} error={erros.nome} />
              <FormField label="E-mail *" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" error={erros.email} />
              <FormField label="Telefone" value={form.fone} onChange={(v) => setForm({ ...form, fone: v })} />
              {docModo === "novo" && (
                <FormField label="Senha *" value={form.senha} onChange={(v) => setForm({ ...form, senha: v })} type="password" error={erros.senha} />
              )}
            </div>

            {/* Vinculação ao Organizador e Equipe */}
            <div style={{ background: "#0a0a1a", padding: 20, borderRadius: 8, border: "1px solid #1E2130", marginTop: 16 }}>
              <h4 style={{ color: "#1976D2", marginBottom: 16 }}>📍 Vinculação ao Organizador</h4>
              
              {/* Organizador — sempre visível para seleção */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>
                  Organizador Responsável *
                </label>
                <select
                  value={form.organizadorId}
                  onChange={(e) => setForm({ ...form, organizadorId: e.target.value })}
                  style={styles.input}
                >
                  <option value="">Selecione o organizador...</option>
                  {organizadores?.filter(o => o.status === "aprovado").map(org => (
                    <option key={org.id} value={org.id}>{org.nome} - {org.entidade}</option>
                  ))}
                </select>
                {erros.organizadorId && <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 4 }}>{erros.organizadorId}</div>}
                <div style={{ color: "#666", fontSize: 11, marginTop: 4 }}>
                  {docModo === "vincular" ? "Selecione o novo organizador para vincular" : "Selecione o organizador responsável pela equipe"}
                </div>
              </div>

              {/* Equipe/Clube */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>
                  Equipe/Clube
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <input type="checkbox" id="equipe-avulsa-flag" checked={form.equipeAvulsa}
                    onChange={(e) => setForm({ ...form, equipeAvulsa: e.target.checked, entidade: "" })}
                    style={{ cursor: "pointer" }} />
                  <label htmlFor="equipe-avulsa-flag" style={{ color: "#aaa", fontSize: 13, cursor: "pointer" }}>
                    ✓ Digitar manualmente
                  </label>
                </div>
                {form.equipeAvulsa ? (
                  <input type="text" value={form.entidade}
                    onChange={(e) => setForm({ ...form, entidade: e.target.value })}
                    placeholder="Digite o nome da equipe/clube" style={styles.input} />
                ) : (
                  <select value={form.equipeId || ""}
                    onChange={(e) => {
                      const equipeSel = equipes?.find(eq => eq.id === e.target.value);
                      setForm({ ...form, equipeId: e.target.value, entidade: equipeSel?.nome || "" });
                    }}
                    style={styles.input}>
                    <option value="">Selecione...</option>
                    {equipes?.filter(eq => eq.status === "ativa" || eq.status === "aprovado").map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.nome} ({eq.sigla})</option>
                    ))}
                  </select>
                )}
                <div style={{ color: "#666", fontSize: 11, marginTop: 4 }}>
                  {form.equipeAvulsa ? "Digite o nome da equipe manualmente" : "Selecione uma equipe ou marque a caixa acima para digitar"}
                </div>
              </div>
            </div>

            <button style={{ ...styles.btnPrimary, marginTop: 16 }} onClick={handleSubmit}>
              {docModo === "vincular" ? "🔗 Criar Vínculo" : "Criar Conta"}
            </button>
          </>
        )}

        <div style={styles.formLink}>
          Já tem conta?{" "}
          <button style={styles.linkBtn} onClick={() => setTela("login")}>Entrar</button>
        </div>
      </div>
    </div>
  );
}


export default TelaCadastroEquipe;
