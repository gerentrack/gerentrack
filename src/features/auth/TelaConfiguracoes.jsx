import React, { useState } from "react";
import { validarCPF, validarCNPJ } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";

const S = {
  page: { maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: 1 },
  painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 32 },
  card: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "24px 28px", marginBottom: 20 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: 1, marginBottom: 16 },
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, marginBottom: 5, textTransform: "uppercase" },
  input: { width: "100%", background: "#141720", border: "1px solid #252837", borderRadius: 7, padding: "9px 12px", color: "#E0E0E0", fontSize: 13, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  btnPrimary: { background: "linear-gradient(135deg, #1976D2, #1565C0)", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnSecondary: { background: "transparent", color: "#1976D2", border: "2px solid #1976D2", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif" },
  btnGhost: { background: "transparent", color: "#888", border: "1px solid #2a2d3a", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  tabBar: { display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" },
  row: { display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #1E2130" },
  okBox: { background: "#0a1a0a", border: "1px solid #2a8a2a", borderRadius: 8, padding: "10px 16px", marginBottom: 12, color: "#4cff4c", fontSize: 13 },
  errBox: { background: "#1a0a0a", border: "1px solid #8a2a2a", borderRadius: 8, padding: "10px 16px", marginBottom: 12, color: "#ff6b6b", fontSize: 13 },
};

// ── Info badge ────────────────────────────────────────────────────────────────
function InfoBadge({ children, color = "#1976D2" }) {
  return (
    <div style={{ background: color + "11", border: `1px solid ${color}33`, borderRadius: 8,
      padding: "10px 14px", fontSize: 12, color: color, lineHeight: 1.6, marginBottom: 12 }}>
      {children}
    </div>
  );
}

// ── Bloco de exclusão com confirmação em 2 etapas ─────────────────────────────
function ExclusaoConfirmada({ titulo, descricao, corAccent, btnLabel, onConfirmar, confirmWord }) {
  const [fase, setFase] = useState(0); // 0=idle 1=confirma 2=digita
  const [palavra, setPalavra] = useState("");
  const errada = palavra.trim().toUpperCase() !== confirmWord.toUpperCase();

  if (fase === 0) return (
    <button onClick={() => setFase(1)}
      style={{ background: "transparent", border: `1px solid ${corAccent}55`,
        color: corAccent, padding: "9px 18px", borderRadius: 7, cursor: "pointer",
        fontSize: 13, fontFamily: "'Barlow', sans-serif" }}>
      {btnLabel}
    </button>
  );

  if (fase === 1) return (
    <div style={{ background: corAccent + "08", border: `1px solid ${corAccent}33`,
      borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontWeight: 700, color: corAccent, marginBottom: 8, fontSize: 14 }}>
        ⚠️ {titulo}
      </div>
      <div style={{ color: "#aaa", fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}
        dangerouslySetInnerHTML={{ __html: descricao }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setFase(2)}
          style={{ background: corAccent + "22", border: `1px solid ${corAccent}55`,
            color: corAccent, padding: "8px 16px", borderRadius: 6, cursor: "pointer",
            fontSize: 13, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif" }}>
          Continuar →
        </button>
        <button onClick={() => { setFase(0); setPalavra(""); }}
          style={S.btnGhost}>Cancelar</button>
      </div>
    </div>
  );

  // fase 2: digitar palavra de confirmação
  return (
    <div style={{ background: corAccent + "08", border: `2px solid ${corAccent}55`,
      borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontWeight: 700, color: corAccent, marginBottom: 8, fontSize: 14 }}>
        🔐 Confirmação final
      </div>
      <div style={{ color: "#888", fontSize: 12, marginBottom: 10, lineHeight: 1.6 }}>
        Para confirmar, digite <strong style={{ color: "#fff", fontFamily: "monospace",
          letterSpacing: 2 }}>{confirmWord}</strong> no campo abaixo:
      </div>
      <input
        value={palavra} onChange={e => setPalavra(e.target.value)}
        placeholder={`Digite ${confirmWord}`}
        style={{ ...S.input, border: `1px solid ${errada && palavra ? corAccent + "88" : "#252837"}`,
          letterSpacing: 2, fontFamily: "monospace", marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { if (!errada) { onConfirmar(); setFase(0); setPalavra(""); } }}
          disabled={errada}
          style={{ background: errada ? "#1a1c22" : corAccent, color: errada ? "#444" : "#fff",
            border: "none", padding: "9px 18px", borderRadius: 7,
            cursor: errada ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700,
            fontFamily: "'Barlow Condensed', sans-serif", transition: "all 0.2s" }}>
          {errada ? "⬜ Confirmar" : "⚠️ Confirmar"}
        </button>
        <button onClick={() => { setFase(0); setPalavra(""); }} style={S.btnGhost}>Cancelar</button>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
function TelaConfiguracoes({
  usuarioLogado, setUsuarioLogado, setTela, logout, atualizarSenha,
  equipes, atualizarEquipePerfil, organizadores, setOrganizadores,
  atletasUsuarios, setAtletasUsuarios, funcionarios, setFuncionarios,
  treinadores, setTreinadores, registrarAcao, adminConfig, setAdminConfig,
  atletas, inscricoes, resultados, perfisDisponiveis,
  excluirPerfilAtual, excluirTodosOsPerfis,
}) {
  const [aba, setAba]           = useState("dados");
  const [feedback, setFeedback] = useState("");
  const [erro, setErro]         = useState("");

  const stores = {
    equipe:      { data: equipes,         set: atualizarEquipePerfil },
    organizador: { data: organizadores,   set: setOrganizadores },
    atleta:      { data: atletasUsuarios, set: setAtletasUsuarios },
    funcionario: { data: funcionarios,    set: setFuncionarios },
    treinador:   { data: treinadores,     set: setTreinadores },
  };
  const store = stores[usuarioLogado?.tipo];
  const isAdmin = usuarioLogado?.tipo === "admin";

  const meuRegistro = isAdmin
    ? { ...usuarioLogado, senha: adminConfig?.senha || "admin123" }
    : (store?.data?.find(u => u.id === usuarioLogado?.id) || usuarioLogado);

  const isOrg    = usuarioLogado?.tipo === "organizador";
  const isEquipe = usuarioLogado?.tipo === "equipe";
  const isAtleta = usuarioLogado?.tipo === "atleta";
  const usaCnpj  = isOrg || isEquipe;

  const [formDados, setFormDados] = useState({
    nome: meuRegistro?.nome || "", email: meuRegistro?.email || "",
    cpf: meuRegistro?.cpf || "", cnpj: meuRegistro?.cnpj || "", fone: meuRegistro?.fone || "",
  });
  const [formSenha, setFormSenha] = useState({ atual: "", nova: "", confirmar: "" });

  const ok = (msg) => { setFeedback(msg); setTimeout(() => setFeedback(""), 4000); };

  const salvarDados = () => {
    setErro("");
    if (!formDados.nome.trim())  { setErro("Nome é obrigatório."); return; }
    if (!formDados.email.trim()) { setErro("E-mail é obrigatório."); return; }
    if (usaCnpj && !formDados.cnpj.trim()) { setErro("CNPJ é obrigatório."); return; }
    if (usaCnpj && formDados.cnpj.trim() && !validarCNPJ(formDados.cnpj)) { setErro("CNPJ inválido."); return; }
    if (!usaCnpj && !isAdmin && formDados.cpf.trim() && !validarCPF(formDados.cpf)) { setErro("CPF inválido."); return; }
    if (isAdmin) {
      setAdminConfig(prev => ({ ...prev, nome: formDados.nome.trim(), email: formDados.email.trim() }));
      setUsuarioLogado(u => u ? { ...u, nome: formDados.nome.trim(), email: formDados.email.trim() } : u);
    } else if (store) {
      if (isEquipe) {
        atualizarEquipePerfil({ ...meuRegistro, nome: formDados.nome.trim(), email: formDados.email.trim(), cnpj: formDados.cnpj.trim(), fone: formDados.fone.trim() });
      } else {
        store.set(arr => arr.map(u => u.id === usuarioLogado.id
          ? { ...u, nome: formDados.nome.trim(), email: formDados.email.trim(), cpf: formDados.cpf.trim(), cnpj: formDados.cnpj.trim(), fone: formDados.fone.trim() }
          : u));
      }
    }
    if (registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Editou dados pessoais",
      `Nome: ${formDados.nome}`,
      usuarioLogado.organizadorId || (isOrg ? usuarioLogado.id : null),
      { equipeId: usuarioLogado.equipeId });
    ok("✅ Dados atualizados com sucesso!");
  };

  const salvarSenha = async () => {
    setErro("");
    if (!formSenha.atual)                          { setErro("Informe a senha atual."); return; }
    if (meuRegistro?.senha && formSenha.atual !== meuRegistro.senha) { setErro("Senha atual incorreta."); return; }
    if (formSenha.nova.length < 6)                 { setErro("A nova senha deve ter pelo menos 6 caracteres."); return; }
    if (formSenha.nova !== formSenha.confirmar)     { setErro("As senhas não coincidem."); return; }
    if (formSenha.nova === formSenha.atual)         { setErro("A nova senha deve ser diferente da atual."); return; }
    await atualizarSenha(usuarioLogado.tipo, usuarioLogado.id, formSenha.nova);
    if (registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Alterou senha", "",
      usuarioLogado.organizadorId || (isOrg ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId });
    setFormSenha({ atual: "", nova: "", confirmar: "" });
    ok("✅ Senha alterada com sucesso!");
  };

  const tipoLabel = { admin: "Administrador", organizador: "Organizador", equipe: "Equipe", funcionario: "Funcionário", treinador: "Treinador", atleta: "Atleta" };
  const orgVinculado    = usuarioLogado?.tipo === "funcionario" ? organizadores?.find(o => o.id === usuarioLogado.organizadorId)?.nome : null;
  const equipeVinculada = usuarioLogado?.tipo === "treinador"  ? equipes?.find(e => e.id === usuarioLogado.equipeId)?.nome : usuarioLogado?.tipo === "equipe" ? meuRegistro?.nome : null;

  const tabStyle = (t) => ({
    padding: "8px 18px", border: "none", cursor: "pointer", fontSize: 13,
    fontFamily: "'Barlow', sans-serif", fontWeight: aba === t ? 700 : 400,
    background: aba === t ? "#1976D2" : "#1a1c22",
    color: aba === t ? "#000" : "#888", borderRadius: 6,
  });

  const voltar = () => {
    const mapa = { admin: "admin", atleta: "painel-atleta", organizador: "painel-organizador", funcionario: "painel-organizador", equipe: "painel-equipe", treinador: "painel-equipe" };
    setTela(mapa[usuarioLogado?.tipo] || "home");
  };

  // ── Dados para aba "conta" ───────────────────────────────────────────────
  // Perfis disponíveis para esse usuário (do login)
  const outrosPerfis = (perfisDisponiveis || []).filter(p => p.dados?.id !== usuarioLogado?.id || p.tipo !== usuarioLogado?.tipo);
  const temOutrosPerfis = usuarioLogado?._temOutrosPerfis || outrosPerfis.length > 0;

  // Dados históricos do atleta
  const atletaBase = isAtleta ? (atletas || []).find(a =>
    a.atletaUsuarioId === usuarioLogado?.id ||
    (a.cpf && usuarioLogado?.cpf && a.cpf.replace(/\D/g,"") === usuarioLogado.cpf.replace(/\D/g,"")) ||
    (a.email && usuarioLogado?.email && a.email.toLowerCase() === usuarioLogado.email.toLowerCase())
  ) : null;
  const nInscricoes = atletaBase ? (inscricoes || []).filter(i => i.atletaId === atletaBase.id).length : 0;

  // Org atual
  const orgAtual = usuarioLogado?.organizadorId
    ? organizadores?.find(o => o.id === usuarioLogado.organizadorId)
    : null;

  return (
    <div style={S.page}>
      <div style={S.painelHeader}>
        <div>
          <h1 style={S.pageTitle}>⚙️ Configurações da Conta</h1>
          <div style={{ color: "#666", fontSize: 13 }}>
            {tipoLabel[usuarioLogado?.tipo] || "Usuário"} · {meuRegistro?.nome || "—"}
          </div>
        </div>
        <button style={S.btnGhost} onClick={voltar}>← Voltar</button>
      </div>

      {feedback && <div style={S.okBox}>{feedback}</div>}
      {erro     && <div style={S.errBox}>⚠️ {erro}</div>}

      <div style={S.tabBar}>
        <button style={tabStyle("dados")} onClick={() => { setAba("dados"); setErro(""); }}>📝 Dados Pessoais</button>
        <button style={tabStyle("senha")} onClick={() => { setAba("senha"); setErro(""); }}>🔒 Alterar Senha</button>
        {!isAdmin && <button style={tabStyle("conta")} onClick={() => { setAba("conta"); setErro(""); }}>ℹ️ Minha Conta</button>}
      </div>

      {/* ── ABA: DADOS PESSOAIS ─────────────────────────────────────────── */}
      {aba === "dados" && (
        <div style={{ ...S.card, maxWidth: 520 }}>
          <h3 style={S.sectionTitle}>Editar Dados Pessoais</h3>
          <FormField label="Nome *"    value={formDados.nome}  onChange={v => setFormDados({ ...formDados, nome: v })} placeholder="Seu nome completo" />
          <FormField label="E-mail *"  value={formDados.email} onChange={v => setFormDados({ ...formDados, email: v })} type="email" placeholder="seu@email.com" />
          {!isAdmin && (usaCnpj
            ? <FormField label="CNPJ *" value={formDados.cnpj} onChange={v => setFormDados({ ...formDados, cnpj: v })} placeholder="00.000.000/0001-00" />
            : <FormField label="CPF"    value={formDados.cpf}  onChange={v => setFormDados({ ...formDados, cpf: v })}  placeholder="000.000.000-00" />
          )}
          {!isAdmin && <FormField label="Telefone" value={formDados.fone} onChange={v => setFormDados({ ...formDados, fone: v })} placeholder="(00) 00000-0000" />}
          <button style={{ ...S.btnPrimary, marginTop: 12 }} onClick={salvarDados}>💾 Salvar Dados</button>
        </div>
      )}

      {/* ── ABA: SENHA ──────────────────────────────────────────────────── */}
      {aba === "senha" && (
        <div style={{ ...S.card, maxWidth: 520 }}>
          <h3 style={S.sectionTitle}>Alterar Senha</h3>
          <FormField label="Senha Atual *"          value={formSenha.atual}     onChange={v => setFormSenha({ ...formSenha, atual: v })}     type="password" placeholder="Digite sua senha atual" />
          <FormField label="Nova Senha *"           value={formSenha.nova}      onChange={v => setFormSenha({ ...formSenha, nova: v })}      type="password" placeholder="Mínimo 6 caracteres" />
          <FormField label="Confirmar Nova Senha *" value={formSenha.confirmar} onChange={v => setFormSenha({ ...formSenha, confirmar: v })} type="password" placeholder="Repita a nova senha" />
          <button style={{ ...S.btnPrimary, marginTop: 12 }} onClick={salvarSenha}>🔒 Alterar Senha</button>
        </div>
      )}

      {/* ── ABA: MINHA CONTA ────────────────────────────────────────────── */}
      {aba === "conta" && (
        <div style={{ maxWidth: 600 }}>
          {/* Info da conta */}
          <div style={S.card}>
            <h3 style={S.sectionTitle}>Informações da Conta</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { label: "Tipo de conta", value: tipoLabel[usuarioLogado?.tipo] || "—", color: "#1976D2" },
                { label: "Nome",          value: meuRegistro?.nome  || "—" },
                { label: "E-mail",        value: meuRegistro?.email || "—" },
                orgVinculado    ? { label: "Organização",    value: orgVinculado }    : null,
                orgAtual        ? { label: "Org. atual",     value: orgAtual.entidade || orgAtual.nome } : null,
                equipeVinculada ? { label: "Equipe",         value: equipeVinculada } : null,
                meuRegistro?.dataCadastro ? { label: "Membro desde", value: new Date(meuRegistro.dataCadastro).toLocaleDateString("pt-BR") } : null,
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={S.row}>
                  <span style={{ color: "#888", fontSize: 13 }}>{row.label}</span>
                  <span style={{ color: row.color || "#fff", fontWeight: row.color ? 700 : 400, fontSize: 13 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Perfis disponíveis */}
            {temOutrosPerfis && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                  Outros Perfis Vinculados
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(perfisDisponiveis || []).map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10,
                      background: "#111318", border: "1px solid #1E2130", borderRadius: 7, padding: "8px 12px" }}>
                      <span style={{ fontSize: 18 }}>{p.icon}</span>
                      <div>
                        <div style={{ color: p.dados?.id === usuarioLogado?.id && p.tipo === usuarioLogado?.tipo ? "#1976D2" : "#fff", fontSize: 13, fontWeight: 600 }}>
                          {p.label}
                          {p.dados?.id === usuarioLogado?.id && p.tipo === usuarioLogado?.tipo &&
                            <span style={{ marginLeft: 8, fontSize: 10, color: "#1976D2" }}>(atual)</span>}
                        </div>
                        <div style={{ color: "#555", fontSize: 11 }}>{p.sublabel}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dados históricos */}
            {isAtleta && atletaBase && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #1E2130" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                  Histórico Esportivo
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ background: "#0d1117", border: "1px solid #1976D233", borderRadius: 7, padding: "10px 16px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: "#1976D2", lineHeight: 1 }}>{nInscricoes}</div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>Inscrição(ões)</div>
                  </div>
                  <div style={{ background: "#0d1117", border: "1px solid #1E2130", borderRadius: 7, padding: "10px 16px", fontSize: 12, color: "#888", display: "flex", flexDirection: "column", gap: 3, justifyContent: "center" }}>
                    <div>Sexo: <strong style={{ color: "#fff" }}>{atletaBase.sexo === "M" ? "Masc." : "Fem."}</strong></div>
                    <div>Ano nasc.: <strong style={{ color: "#fff" }}>{atletaBase.anoNasc || "—"}</strong></div>
                    {atletaBase.clube && <div>Equipe: <strong style={{ color: "#1976D2" }}>{atletaBase.clube}</strong></div>}
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "#555", lineHeight: 1.6 }}>
                  ℹ️ Inscrições e resultados oficiais são registros permanentes das competições e não são afetados pelas opções de exclusão de conta abaixo.
                </div>
              </div>
            )}
          </div>

          {/* ── ZONA DE PERIGO ─────────────────────────────────────────────── */}
          <div style={{ background: "#0e0a0a", border: "2px solid #3a1a1a", borderRadius: 12, padding: "20px 24px" }}>
            <h3 style={{ color: "#ff6b6b", fontSize: 16, fontWeight: 800, marginBottom: 6 }}>⚠️ Zona de Perigo</h3>
            <p style={{ color: "#666", fontSize: 12, marginBottom: 20, lineHeight: 1.6 }}>
              Ações irreversíveis relacionadas ao seu acesso ao sistema.
              Leia cada opção com atenção antes de prosseguir.
            </p>

            {/* OPÇÃO 1: Excluir perfil atual */}
            <div style={{ background: "#120d0d", border: "1px solid #3a1a1a", borderRadius: 10,
              padding: "16px 18px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>🗑️</span>
                <div>
                  <div style={{ color: "#ff6b6b", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    Excluir este Perfil
                    {orgAtual && <span style={{ marginLeft: 8, fontSize: 11, color: "#cc5555",
                      background: "#2a1010", border: "1px solid #4a2020", borderRadius: 4, padding: "1px 8px" }}>
                      {orgAtual.entidade || orgAtual.nome}
                    </span>}
                  </div>
                  <div style={{ color: "#888", fontSize: 13, lineHeight: 1.7 }}>
                    Remove <strong style={{ color: "#fff" }}>apenas o seu acesso</strong> vinculado a{" "}
                    <strong style={{ color: "#ff8888" }}>
                      {orgAtual ? `"${orgAtual.entidade || orgAtual.nome}"` : "esta organização"}
                    </strong>.
                  </div>
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {[
                      { ico: "✅", txt: "Seu acesso de login nesta organização será removido" },
                      temOutrosPerfis
                        ? { ico: "✅", txt: "Seus outros perfis continuarão funcionando normalmente" }
                        : null,
                      { ico: "✅", txt: "Inscrições e resultados históricos são preservados integralmente" },
                      { ico: "✅", txt: "Seu registro de atleta não é alterado" },
                    ].filter(Boolean).map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 6, fontSize: 12, color: "#777" }}>
                        <span>{item.ico}</span><span>{item.txt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <ExclusaoConfirmada
                titulo={`Excluir perfil em "${orgAtual?.entidade || orgAtual?.nome || "esta organização"}"`}
                descricao={`Você perderá o acesso a esta organização.<br/><br/>
                  <strong style="color:#fff">O que será removido:</strong><br/>
                  • Seu login nesta organização específica<br/><br/>
                  <strong style="color:#fff">O que NÃO será afetado:</strong><br/>
                  ${temOutrosPerfis ? "• Seus outros perfis em outras organizações<br/>" : ""}
                  • Todas as suas inscrições em competições<br/>
                  • Todos os seus resultados oficiais<br/>
                  • Seu cadastro de atleta`}
                corAccent="#ff6b6b"
                btnLabel="🗑️ Excluir este Perfil..."
                confirmWord="EXCLUIR"
                onConfirmar={excluirPerfilAtual || (() => {
                  // fallback se prop não chegou
                  if (store) store.set(arr => arr.filter(u => u.id !== usuarioLogado.id));
                  logout();
                })}
              />
            </div>

            {/* OPÇÃO 2: Excluir todos os perfis (só mostra se atleta ou se tem múltiplos perfis) */}
            {(isAtleta || temOutrosPerfis) && (
              <div style={{ background: "#0e0a0a", border: "1px solid #5a1a1a", borderRadius: 10,
                padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>💣</span>
                  <div>
                    <div style={{ color: "#ff4444", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                      Excluir Todos os Perfis e Sair do Sistema
                    </div>
                    <div style={{ color: "#888", fontSize: 13, lineHeight: 1.7 }}>
                      Remove <strong style={{ color: "#fff" }}>todos os seus acessos</strong> em todas as organizações
                      e <strong style={{ color: "#fff" }}>anonimiza seus dados pessoais</strong>.
                    </div>
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                      {[
                        { ico: "❌", txt: "Todos os seus perfis de login serão excluídos" },
                        { ico: "❌", txt: "Seus dados pessoais (nome, CPF, e-mail, telefone) serão anonimizados" },
                        { ico: "✅", txt: "Inscrições e resultados históricos são preservados como registros anônimos — obrigação dos regulamentos esportivos" },
                        { ico: "✅", txt: "Nenhum resultado oficial de competição é apagado" },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, fontSize: 12, color: "#777" }}>
                          <span>{item.ico}</span><span>{item.txt}</span>
                        </div>
                      ))}
                    </div>
                    {nInscricoes > 0 && (
                      <div style={{ marginTop: 10, background: "#1a0f00", border: "1px solid #5a3a00",
                        borderRadius: 7, padding: "8px 12px", fontSize: 12, color: "#cc9944" }}>
                        ⚠️ Você tem <strong>{nInscricoes} inscrição(ões) oficial(is)</strong>.
                        Elas serão preservadas como "Atleta Excluído" para integridade do histórico da competição.
                      </div>
                    )}
                  </div>
                </div>
                <ExclusaoConfirmada
                  titulo="Excluir TODOS os perfis e anonimizar dados"
                  descricao={`Esta ação removerá <strong>permanentemente</strong> todos os seus acessos ao sistema.<br/><br/>
                    <strong style="color:#fff">Será removido:</strong><br/>
                    • Todos os perfis (atleta, organizador, funcionário, treinador)<br/>
                    • Nome, CPF, e-mail e telefone do seu cadastro de atleta<br/><br/>
                    <strong style="color:#fff">Será preservado:</strong><br/>
                    • ${nInscricoes} inscrição(ões) oficial(is) em competições (anonimizadas)<br/>
                    • Todos os resultados de competições (anonimizados)<br/><br/>
                    <strong style="color:#ff8888">Esta ação não pode ser desfeita.</strong>`}
                  corAccent="#ff4444"
                  btnLabel="💣 Excluir Todos os Perfis e Sair do Sistema..."
                  confirmWord="EXCLUIR TUDO"
                  onConfirmar={excluirTodosOsPerfis || (() => logout())}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TelaConfiguracoes;
