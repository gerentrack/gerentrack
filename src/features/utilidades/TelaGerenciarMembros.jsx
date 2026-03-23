import React, { useState } from "react";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";

function getStyles(t) {
  return {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: t.textPrimary, marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: t.textPrimary, marginBottom: 20, letterSpacing: 1 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  btnPrimary: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: t.accent, border: `2px solid ${t.accentBorder}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost: { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: `1px solid ${t.border}` },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: t.bgHeaderSolid, padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` },
  td: { padding: "12px 16px", fontSize: 14, color: t.textSecondary, borderBottom: `1px solid ${t.border}` },
  tr: { transition: "background 0.15s" },
  marca: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: t.accent },
  emptyState: { textAlign: "center", padding: "60px 20px", color: t.textDisabled, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },
  painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  painelBtns: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { width: "100%", background: t.bgInput, borderWidth: 1, borderStyle: "solid", borderColor: t.borderInput, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  select: { width: "100%", background: t.bgInput, borderWidth: 1, borderStyle: "solid", borderColor: t.borderInput, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  erro: { background: t.bgCardAlt, border: `1px solid ${t.danger}`, color: t.danger, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn: { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", padding: 0 },
  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  badgeGold: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  catBanner: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 14, color: t.textTertiary },
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.accent, marginBottom: 16 },
  formCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32, marginBottom: 20 },
  formTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: t.textPrimary, textAlign: "center", marginBottom: 8 },
  formSub: { color: t.textDimmed, textAlign: "center", fontSize: 14, marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },
  fieldError: { color: t.danger, fontSize: 12, marginTop: 2 },
  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: t.textMuted, transition: "all 0.2s" },
  radioLabelActive: { background: t.bgHover, border: `1px solid ${t.accentBorder}`, color: t.accent },
  sumuCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  btnIconSm: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textMuted, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: t.bgCardAlt, border: `1px solid ${t.danger}44`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  infoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: t.accent, marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: `1px solid ${t.border}`, fontSize: 14, color: t.textSecondary, display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: t.accent, fontWeight: 700 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: `linear-gradient(180deg, ${t.bgCardAlt} 0%, transparent 100%)`, borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: t.accent, color: t.textPrimary, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, color: t.textPrimary, lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: t.textDimmed },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: t.textMuted, flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? `${t.danger}15` : status === "hoje_pre" ? t.accentBg : status === "futuro" ? `${t.success}15` : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textDisabled,
    border: `1px solid ${status === "ao_vivo" ? `${t.danger}44` : status === "hoje_pre" ? t.accentBorder : status === "futuro" ? `${t.success}44` : t.border}`,
  }),
  permissividadeBox: { background: t.bgHeaderSolid, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 4 },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? t.bgHover : "transparent", color: ativo ? t.accent : t.textDisabled, border: `1px solid ${ativo ? t.accentBorder : t.border}` }),
  stepDivider: { flex: 1, height: 1, background: t.border, margin: "0 8px" },
  tagProva: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: t.textPrimary, fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  statusControlsCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  modoSwitch: { display: "flex", gap: 0, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: t.textDimmed, padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: t.bgInput, color: t.accent },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: t.bgHover, borderColor: t.accentBorder, color: t.accent },
  savedBadge: { background: `${t.success}15`, border: `1px solid ${t.success}44`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  inputMarca: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", color: t.accent, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
};
}

function TelaGerenciarMembros({ usuarioLogado, setTela, equipes, atualizarEquipe, registrarAcao }) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
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
    if (equipe.membros?.some(m => m.email === form.email && m.id !== equipeSelecionada?.id)) {
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
      const index = membrosAtualizados.findIndex(m => m.id === equipeSelecionada.id);
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
    const membro = equipe.equipes?.find(m => m.id === equipeId);
    
    if (!confirm(`⚠️ Excluir membro "${membro.nome}"?\n\nEsta ação é IRREVERSÍVEL!`)) {
      return;
    }

    const equipeatualizada = {
      ...equipe,
      membros: equipe.equipes?.filter(m => m.id !== equipeId)
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
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>👥 Gerenciar Membros</h1>
          <p style={{ color: t.textDimmed, fontSize: 14 }}>
            Adicione e gerencie membros da equipe {equipe.nome}
          </p>
        </div>
        <button style={s.btnGhost} onClick={() => setTela('painel-equipe')}>
          ← Voltar
        </button>
      </div>

      {/* Botão Adicionar */}
      {modo === 'lista' && (
        <button 
          style={s.btnPrimary}
          onClick={() => setModo('novo')}
        >
          + Adicionar Membro
        </button>
      )}

      {/* Formulário */}
      {(modo === 'novo' || modo === 'editar') && (
        <div style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: 32,
          marginTop: 24,
          maxWidth: 800
        }}>
          <h3 style={{ color: t.accent, marginBottom: 24 }}>
            {modo === 'novo' ? '➕ Novo Membro' : '✏️ Editar Membro'}
          </h3>

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                Nome Completo *
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                style={{ ...s.input, borderColor: erros.nome ? t.danger : undefined }}
              />
              {erros.nome && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.nome}</div>}
            </div>

            <div>
              <label style={{ display: 'block', color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                E-mail *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ ...s.input, borderColor: erros.email ? t.danger : undefined }}
              />
              {erros.email && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.email}</div>}
            </div>

            <div>
              <label style={{ display: 'block', color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                Senha {modo === 'editar' && '(deixe em branco para manter)'}
              </label>
              <input
                type="password"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                style={{ ...s.input, borderColor: erros.senha ? t.danger : undefined }}
              />
              {erros.senha && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.senha}</div>}
            </div>

            <div>
              <label style={{ display: 'block', color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                CPF *
              </label>
              <input
                type="text"
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                placeholder="000.000.000-00"
                style={{ ...s.input, borderColor: erros.cpf ? t.danger : undefined }}
              />
              {erros.cpf && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.cpf}</div>}
            </div>

            <div>
              <label style={{ display: 'block', color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                Cargo/Função
              </label>
              <input
                type="text"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                placeholder="Ex: Técnico Principal, Assistente..."
                style={s.input}
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
                    background: form.permissoes.includes(perm.id) ? `${t.success}15` : t.bgCardAlt,
                    border: `2px solid ${form.permissoes.includes(perm.id) ? t.success : t.border}`,
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
                        border: `2px solid ${t.success}`,
                        background: form.permissoes.includes(perm.id) ? t.success : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000',
                        fontWeight: 700
                      }}>
                        {form.permissoes.includes(perm.id) && '✓'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: t.textPrimary, fontWeight: 600, marginBottom: 4 }}>
                          {perm.nome}
                        </div>
                        <div style={{ color: t.textMuted, fontSize: 12 }}>
                          {perm.descricao}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {erros.permissoes && <div style={{ color: t.danger, fontSize: 12, marginTop: 8 }}>{erros.permissoes}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              style={s.btnGhost}
              onClick={() => {
                setModo('lista');
                setForm({ nome: '', email: '', senha: '', cpf: '', telefone: '', cargo: '', permissoes: [] });
                setErros({});
              }}
            >
              Cancelar
            </button>
            <button style={s.btnPrimary} onClick={handleSalvar}>
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
              background: t.bgCard,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 20
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: t.textPrimary, fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                  {membro.nome}
                </div>
                <div style={{ color: t.textMuted, fontSize: 14, marginBottom: 8 }}>
                  📧 {membro.email} {membro.cargo && `• ${membro.cargo}`}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {membro.permissoes.map(permId => {
                    const perm = PERMISSOES_DISPONIVEIS.find(p => p.id === permId);
                    return perm ? (
                      <span key={permId} style={{
                        background: `${t.success}15`,
                        color: t.success,
                        padding: '4px 12px',
                        borderRadius: 4,
                        fontSize: 12,
                        border: `1px solid ${t.success}44`
                      }}>
                        {perm.nome}
                      </span>
                    ) : null;
                  })}
                </div>
                <div style={{ color: t.textDimmed, fontSize: 12, marginTop: 8 }}>
                  Status: <span style={{ color: membro.ativo ? t.success : t.danger }}>
                    {membro.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={s.btnSecondary}
                  onClick={() => handleEditar(membro)}
                >
                  ✏️ Editar
                </button>
                <button
                  style={s.btnGhost}
                  onClick={() => handleRemover(membro.id)}
                >
                  🗑️ Remover
                </button>
              </div>
            </div>
          ))}

          {(!equipe.membros || (equipe.membros || []).length === 0) && (
            <div style={{ textAlign: 'center', padding: 60, color: t.textDimmed }}>
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
