import React, { useState } from "react";

const styles = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 20, letterSpacing: 1 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  btnPrimary: { background: "linear-gradient(135deg, #1976D2, #1565C0)", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: "#1976D2", border: "2px solid #1976D2", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost: { background: "transparent", color: "#888", border: "1px solid #2a2d3a", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: "1px solid #1E2130" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#0D0E12", padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1E2130" },
  td: { padding: "12px 16px", fontSize: 14, color: "#bbb", borderBottom: "1px solid #12141a" },
  tr: { transition: "background 0.15s" },
  marca: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: "#1976D2" },
  emptyState: { textAlign: "center", padding: "60px 20px", color: "#444", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },
  painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  painelBtns: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { width: "100%", background: "#141720", borderWidth: 1, borderStyle: "solid", borderColor: "#252837", borderRadius: 8, padding: "10px 14px", color: "#E0E0E0", fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  select: { width: "100%", background: "#141720", borderWidth: 1, borderStyle: "solid", borderColor: "#252837", borderRadius: 8, padding: "10px 14px", color: "#E0E0E0", fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  erro: { background: "#2a1010", border: "1px solid #ff4444", color: "#ff6b6b", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn: { background: "none", border: "none", color: "#1976D2", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", padding: 0 },
  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  badgeGold: { background: "#1976D222", color: "#1976D2", border: "1px solid #1976D244", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  catBanner: { background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 14, color: "#aaa" },
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#1976D2", marginBottom: 16 },
  formCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 16, padding: 32, marginBottom: 20 },
  formTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 8 },
  formSub: { color: "#666", textAlign: "center", fontSize: 14, marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },
  fieldError: { color: "#ff6b6b", fontSize: 12, marginTop: 2 },
  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: "#888", transition: "all 0.2s" },
  radioLabelActive: { background: "#1c1f2e", border: "1px solid #1976D2", color: "#1976D2" },
  sumuCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  btnIconSm: { background: "#141720", border: "1px solid #252837", color: "#888", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: "#1a0a0a", border: "1px solid #3a1a1a", color: "#ff6b6b", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  infoCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: "#1976D2", marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: "1px solid #151820", fontSize: 14, color: "#bbb", display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: "#1976D2", fontWeight: 700 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: "linear-gradient(180deg, #0D1018 0%, transparent 100%)", borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: "#1976D2", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: "#666" },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: "#888", flexWrap: "wrap", borderTop: "1px solid #141820", paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? "#3a0a0a" : status === "hoje_pre" ? "#2a2a0a" : status === "futuro" ? "#0a2a0a" : "#1a1a1a",
    color: status === "ao_vivo" ? "#ff6b6b" : status === "hoje_pre" ? "#1976D2" : status === "futuro" ? "#7acc44" : "#555",
    border: `1px solid ${status === "ao_vivo" ? "#6a2a2a" : status === "hoje_pre" ? "#4a4a0a" : status === "futuro" ? "#2a5a2a" : "#333"}`,
  }),
  permissividadeBox: { background: "#0d1117", border: "1px solid #1976D233", borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 4 },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? "#1a1c22" : "transparent", color: ativo ? "#1976D2" : "#444", border: `1px solid ${ativo ? "#1976D244" : "#1E2130"}` }),
  stepDivider: { flex: 1, height: 1, background: "#1E2130", margin: "0 8px" },
  tagProva: { background: "#1976D222", color: "#1976D2", border: "1px solid #1976D244", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: "#fff", fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  statusControlsCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  modoSwitch: { display: "flex", gap: 0, background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: "#666", padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: "#141720", color: "#1976D2" },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: "#0E1016", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
  savedBadge: { background: "#0a2a0a", border: "1px solid #2a6a2a", color: "#4aaa4a", padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  inputMarca: { background: "#141720", border: "1px solid #252837", borderRadius: 6, padding: "8px 12px", color: "#1976D2", fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
};

function TelaGerenciarMembros({ usuarioLogado, setTela, equipes, atualizarEquipe, registrarAcao }) {
  const { equipe } = usuarioLogado;
  const [modo, setModo] = useState('lista'); // lista | novo | editar
  const [equipeSelecionada, setEquipeSelecionada] = useState(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    cpf: '',
    telefone: '',
    cargo: '',
    permissoes: []
  });
  const [erros, setErros] = useState({});

  const PERMISSOES_DISPONIVEIS = [
    { id: 'cadastrar_atleta', nome: 'Cadastrar Atletas', descricao: 'Adicionar novos atletas' },
    { id: 'editar_atleta', nome: 'Editar Atletas', descricao: 'Modificar dados dos atletas' },
    { id: 'excluir_atleta', nome: 'Excluir Atletas', descricao: 'Remover atletas' },
    { id: 'inscrever_competicao', nome: 'Inscrever em Competições', descricao: 'Inscrever atletas em eventos' },
    { id: 'cancelar_inscricao', nome: 'Cancelar Inscrições', descricao: 'Cancelar inscrições' },
    { id: 'ver_resultados', nome: 'Ver Resultados', descricao: 'Visualizar resultados' },
    { id: 'gerenciar_equipe', nome: 'Gerenciar Equipe', descricao: 'Adicionar/remover membros' },
    { id: 'ver_auditoria', nome: 'Ver Auditoria', descricao: 'Visualizar logs de ações' }
  ];

  const validar = () => {
    const e = {};
    if (!form.nome) e.nome = 'Nome obrigatório';
    if (!form.email) e.email = 'E-mail obrigatório';
    if (modo === 'novo' && !form.senha) e.senha = 'Senha obrigatória';
    if (!form.cpf) e.cpf = 'CPF obrigatório';
    if (form.permissoes.length === 0) e.permissoes = 'Selecione pelo menos uma permissão';
    
    // Verificar e-mail duplicado
    if (equipe.membros?.some(t => t.email === form.email && t.id !== equipeSelecionada?.id)) {
      e.email = 'E-mail já cadastrado nesta equipe';
    }
    
    return e;
  };

  const handleSalvar = async () => {
    const e = validar();
    if (Object.keys(e).length) {
      setErros(e);
      return;
    }

    const membrosAtualizados = [...(equipe.membros || [])];

    if (modo === 'novo') {
      const novoMembro = {
        ...form,
        id: `membro_${Date.now()}`,
        ativo: true,
        dataCadastro: new Date().toISOString(),
        ultimoAcesso: null
      };
      
      membrosAtualizados.push(novoMembro);
      
      if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, "Adicionou membro", novoMembro.nome, null, { equipeId: equipe.id, modulo: "membros" });
    } else {
      const index = membrosAtualizados.findIndex(t => t.id === equipeSelecionada.id);
      if (index >= 0) {
        membrosAtualizados[index] = {
          ...equipeSelecionada,
          ...form,
          senha: form.senha || equipeSelecionada.senha // Manter senha se não alterou
        };
        
        if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, "Editou membro", form.nome, null, { equipeId: equipe.id, modulo: "membros" });
      }
    }

    const equipeatualizada = {
      ...equipe,
      membros: membrosAtualizados
    };

    await atualizarEquipe(equipeatualizada);
    
    setModo('lista');
    setForm({ nome: '', email: '', senha: '', cpf: '', telefone: '', cargo: '', permissoes: [] });
    setEquipeSelecionada(null);
    setErros({});
  };

  const handleEditar = (membro) => {
    setEquipeSelecionada(membro);
    setForm({
      nome: membro.nome,
      email: membro.email,
      senha: '',
      cpf: membro.cpf || '',
      telefone: membro.telefone || '',
      cargo: membro.cargo || '',
      permissoes: membro.permissoes || []
    });
    setModo('editar');
  };

  const handleRemover = async (equipeId) => {
    const membro = equipe.equipes?.find(t => t.id === equipeId);
    
    if (!confirm(`⚠️ Excluir membro "${membro.nome}"?\n\nEsta ação é IRREVERSÍVEL!`)) {
      return;
    }

    const equipeatualizada = {
      ...equipe,
      membros: equipe.equipes?.filter(t => t.id !== equipeId)
    };

    await atualizarEquipe(equipeatualizada);
    
    if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, "Removeu membro", membro.nome, null, { equipeId: equipe.id, modulo: "membros" });
  };

  const togglePermissao = (permissaoId) => {
    setForm(prev => ({
      ...prev,
      permissoes: prev.permissoes.includes(permissaoId)
        ? prev.permissoes.filter(p => p !== permissaoId)
        : [...prev.permissoes, permissaoId]
    }));
  };

  return (
    <div style={styles.page}>
      <div style={styles.painelHeader}>
        <div>
          <h1 style={styles.pageTitle}>👥 Gerenciar Membros</h1>
          <p style={{ color: '#666', fontSize: 14 }}>
            Adicione e gerencie membros da equipe {equipe.nome}
          </p>
        </div>
        <button style={styles.btnGhost} onClick={() => setTela('painel-equipe')}>
          ← Voltar
        </button>
      </div>

      {/* Botão Adicionar */}
      {modo === 'lista' && (
        <button 
          style={styles.btnPrimary}
          onClick={() => setModo('novo')}
        >
          + Adicionar Membro
        </button>
      )}

      {/* Formulário */}
      {(modo === 'novo' || modo === 'editar') && (
        <div style={{
          background: '#0D0E12',
          border: '1px solid #1E2130',
          borderRadius: 12,
          padding: 32,
          marginTop: 24,
          maxWidth: 800
        }}>
          <h3 style={{ color: '#1976D2', marginBottom: 24 }}>
            {modo === 'novo' ? '➕ Novo Membro' : '✏️ Editar Membro'}
          </h3>

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 6 }}>
                Nome Completo *
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                style={{ ...styles.input, borderColor: erros.nome ? '#ff6b6b' : undefined }}
              />
              {erros.nome && <div style={{ color: '#ff6b6b', fontSize: 12, marginTop: 4 }}>{erros.nome}</div>}
            </div>

            <div>
              <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 6 }}>
                E-mail *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ ...styles.input, borderColor: erros.email ? '#ff6b6b' : undefined }}
              />
              {erros.email && <div style={{ color: '#ff6b6b', fontSize: 12, marginTop: 4 }}>{erros.email}</div>}
            </div>

            <div>
              <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 6 }}>
                Senha {modo === 'editar' && '(deixe em branco para manter)'}
              </label>
              <input
                type="password"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                style={{ ...styles.input, borderColor: erros.senha ? '#ff6b6b' : undefined }}
              />
              {erros.senha && <div style={{ color: '#ff6b6b', fontSize: 12, marginTop: 4 }}>{erros.senha}</div>}
            </div>

            <div>
              <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 6 }}>
                CPF *
              </label>
              <input
                type="text"
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                placeholder="000.000.000-00"
                style={{ ...styles.input, borderColor: erros.cpf ? '#ff6b6b' : undefined }}
              />
              {erros.cpf && <div style={{ color: '#ff6b6b', fontSize: 12, marginTop: 4 }}>{erros.cpf}</div>}
            </div>

            <div>
              <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 6 }}>
                Cargo/Função
              </label>
              <input
                type="text"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                placeholder="Ex: Técnico Principal, Assistente..."
                style={styles.input}
              />
            </div>

            {/* Permissões */}
            <div>
              <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 12 }}>
                Permissões *
              </label>
              <div style={{ display: 'grid', gap: 12 }}>
                {PERMISSOES_DISPONIVEIS.map(perm => (
                  <div key={perm.id} style={{
                    background: form.permissoes.includes(perm.id) ? '#1a2a1a' : '#141720',
                    border: `2px solid ${form.permissoes.includes(perm.id) ? '#7cfc7c' : '#1E2130'}`,
                    borderRadius: 8,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => togglePermissao(perm.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        border: '2px solid #7cfc7c',
                        background: form.permissoes.includes(perm.id) ? '#7cfc7c' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000',
                        fontWeight: 700
                      }}>
                        {form.permissoes.includes(perm.id) && '✓'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>
                          {perm.nome}
                        </div>
                        <div style={{ color: '#888', fontSize: 12 }}>
                          {perm.descricao}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {erros.permissoes && <div style={{ color: '#ff6b6b', fontSize: 12, marginTop: 8 }}>{erros.permissoes}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              style={styles.btnGhost}
              onClick={() => {
                setModo('lista');
                setForm({ nome: '', email: '', senha: '', cpf: '', telefone: '', cargo: '', permissoes: [] });
                setErros({});
              }}
            >
              Cancelar
            </button>
            <button style={styles.btnPrimary} onClick={handleSalvar}>
              {modo === 'novo' ? '✓ Adicionar' : '✓ Salvar Alterações'}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {modo === 'lista' && (
        <div style={{ marginTop: 24, display: 'grid', gap: 16 }}>
          {(equipe.membros || []).map(membro => (
            <div key={membro.id} style={{
              background: '#0D0E12',
              border: '1px solid #1E2130',
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 20
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                  {membro.nome}
                </div>
                <div style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>
                  📧 {membro.email} {membro.cargo && `• ${membro.cargo}`}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {membro.permissoes.map(permId => {
                    const perm = PERMISSOES_DISPONIVEIS.find(p => p.id === permId);
                    return perm ? (
                      <span key={permId} style={{
                        background: '#1a2a1a',
                        color: '#7cfc7c',
                        padding: '4px 12px',
                        borderRadius: 4,
                        fontSize: 12,
                        border: '1px solid #7cfc7c44'
                      }}>
                        {perm.nome}
                      </span>
                    ) : null;
                  })}
                </div>
                <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
                  Status: <span style={{ color: membro.ativo ? '#7cfc7c' : '#ff6b6b' }}>
                    {membro.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={styles.btnSecondary}
                  onClick={() => handleEditar(membro)}
                >
                  ✏️ Editar
                </button>
                <button
                  style={styles.btnGhost}
                  onClick={() => handleRemover(membro.id)}
                >
                  🗑️ Remover
                </button>
              </div>
            </div>
          ))}

          {(!equipe.membros || (equipe.membros || []).length === 0) && (
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>👨‍🏫</div>
              <div style={{ fontSize: 18 }}>Nenhum membro cadastrado</div>
              <div style={{ fontSize: 14, marginTop: 8 }}>
                Clique em "Adicionar Membro" para começar
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: AUDITORIA
// ═══════════════════════════════════════════════════════════════════════════


export default TelaGerenciarMembros;
