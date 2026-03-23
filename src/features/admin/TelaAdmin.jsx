import { usePagination, PaginaControles } from "../../lib/hooks/usePagination.jsx";
import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { _getLocalEventoDisplay, _getNascDisplay, validarCNPJ, emailJaCadastrado } from "../../shared/formatters/utils";
import { StatCard } from "../ui/StatCard";
import FormField from "../ui/FormField";
import { Th, Td } from "../ui/TableHelpers";
import { auth, createUserWithEmailAndPassword, signOut as firebaseSignOut, sendPasswordResetEmail } from "../../firebase";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";

// ── Helpers ─────────────────────────────────────────────────────────────────
const badgeStatus = (s, t) => ({
  pendente: { bg:t.accentBg, color: t.accent, label:"⏳ Pendente" },
  aprovado: { bg:`${t.success}15`, color:t.success, label:"✓ Aprovado" },
  recusado: { bg:`${t.danger}15`, color: t.danger, label:"✗ Recusado" },
}[s] || { bg:t.bgHover, color: t.textMuted, label: s || "—" });

// ── Styles ───────────────────────────────────────────────────────────────────
function getStyles(t) {
  return {
  page:       { maxWidth:1200, margin:"0 auto", padding:"36px 24px 80px" },
  title:      { fontFamily:"'Barlow Condensed',sans-serif", fontSize:34, fontWeight:800, color: t.textPrimary, letterSpacing:1, margin:0 },
  card:       { background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"20px 24px", marginBottom:20 },
  tableWrap:  { overflowX:"auto", borderRadius:10, border:`1px solid ${t.border}` },
  table:      { width:"100%", borderCollapse:"collapse" },
  tr:         { transition:"background 0.15s" },
  empty:      { textAlign:"center", padding:"40px 20px", color: t.textDisabled, display:"flex", flexDirection:"column", alignItems:"center", gap:12, fontSize:14 },
  btnPrimary: { background:"linear-gradient(135deg,#1976D2,#1565C0)", color: "#fff", border:"none", padding:"9px 20px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1, transition:"all 0.2s", whiteSpace:"nowrap" },
  btnSecondary:{ background:"transparent", color: t.accent, border:"2px solid #1976D2", padding:"8px 18px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1, whiteSpace:"nowrap" },
  btnGhost:   { background:"transparent", color: t.textMuted, border:`1px solid ${t.borderLight}`, padding:"8px 18px", borderRadius:8, cursor:"pointer", fontSize:13, fontFamily:"'Barlow',sans-serif", whiteSpace:"nowrap" },
  input:      { width:"100%", background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:7, padding:"9px 12px", color: t.textSecondary, fontSize:13, fontFamily:"'Barlow',sans-serif", outline:"none", marginBottom:4 },
  label:      { display:"block", fontSize:11, fontWeight:700, color: t.textDimmed, letterSpacing:1, marginBottom:5, textTransform:"uppercase" },
  sectionHd:  { fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color: t.textPrimary, marginBottom:14 },

  // pendência card clicável
  pendCard: (color, bg, border) => ({
    display:"flex", alignItems:"center", gap:14, textAlign:"left",
    background:bg, border:`1px solid ${border}`, borderRadius:10,
    padding:"14px 18px", cursor:"pointer", transition:"all 0.15s",
    fontFamily:"'Barlow',sans-serif",
  }),

  // aba botão
  tab: (active) => ({
    flex:"1 1 auto",
    background: active ? t.bgInput : "transparent",
    borderWidth:0,
    borderBottomWidth: active ? 2 : 0,
    borderBottomStyle:"solid",
    borderBottomColor: active ? t.accent : "transparent",
    color: active ? t.accent : t.textDisabled,
    padding:"13px 10px",
    cursor:"pointer",
    fontSize:12,
    fontWeight: active ? 700 : 500,
    fontFamily:"'Barlow Condensed',sans-serif",
    letterSpacing:0.5,
    transition:"all 0.15s",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    gap:5,
    whiteSpace:"nowrap",
  }),
};
}

// ── Component ────────────────────────────────────────────────────────────────
function TelaAdmin({
  equipes, atletas, inscricoes, setTela, eventos, selecionarEvento,
  excluirEvento, limparTodosDados, organizadores, adicionarOrganizador,
  aprovarOrganizador, recusarOrganizador, aprovarEvento, recusarEvento,
  solicitacoesRecuperacao, resolverSolicitacaoRecuperacao, aplicarSenhaTemp,
  exportarDados, importarDados, usuarioLogado, excluirAtleta,
  siteBranding, setSiteBranding, gtIcon, gtLogo, historicoAcoes,
  atletasUsuarios=[], funcionarios=[], treinadores=[],
  setAtletaEditandoId,
  solicitacoesEquipe=[], aprovarEquipe, recusarEquipe, atualizarAtleta,
  solicitacoesPortabilidade=[], resolverSolicitacaoPortabilidade, excluirSolicitacaoPortabilidade,
  resultados,
  setHistoricoAcoes, setAuditoria, auditoria=[],
  registrarAcao,
}) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const confirmar = useConfirm();
  const pendOrg = organizadores.filter(o => o.status === "pendente");
  const pendEv  = eventos.filter(e => e.statusAprovacao === "pendente");
  const pendRec = (solicitacoesRecuperacao || []).filter(sol => sol.status === "pendente");
  const pendEq  = (solicitacoesEquipe || []).filter(sol => sol.status === "pendente");
  const pendPort = (solicitacoesPortabilidade || []).filter(sol => sol.status === "pendente");
  const totalPend = pendOrg.length + pendEv.length + pendRec.length + pendEq.length + pendPort.length;

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (usuarioLogado?.tipo !== "admin") return (
    <div style={s.page}><div style={s.empty}>
      <span style={{ fontSize:48 }}>🚫</span>
      <p style={{ color: t.danger, fontWeight:700 }}>Acesso restrito ao administrador</p>
      <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
    </div></div>
  );

  // ── State ──────────────────────────────────────────────────────────────────
  const [aba,       setAba]       = useState("visao-geral");
  const [buscaOrg,  setBuscaOrg]  = useState("");
  const [buscaComp, setBuscaComp] = useState("");
  const [buscaEq,   setBuscaEq]   = useState("");
  const [buscaAtl,  setBuscaAtl]  = useState("");
  const [orgSel,    setOrgSel]    = useState({});
  const [buscaHist, setBuscaHist] = useState("");
  const [modalTransf, setModalTransf] = useState(null); // { atleta }
  const [transfEquipeId, setTransfEquipeId] = useState("");

  // Org form (hoisted — não pode ser useState dentro de IIFE)
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [senhasVisiveis, setSenhasVisiveis] = useState(new Set());
  const [resetFeedback, setResetFeedback] = useState({}); // { [solId]: "ok" | "erro" | "enviando" } // IDs de senhas reveladas
  const [formOrg,  setFormOrg]  = useState({ nome:"", email:"", senha:"", entidade:"", fone:"", cnpj:"" });
  const [errosOrg, setErrosOrg] = useState({});
  const [salvoOrg, setSalvoOrg] = useState(false);

  const handleCriarOrg = async () => {
    const e = {};
    if (!formOrg.nome)     e.nome = "Nome obrigatório";
    if (!formOrg.email)    e.email = "E-mail obrigatório";
    if (formOrg.senha.length < 6) e.senha = "Mínimo 6 caracteres";
    if (!formOrg.entidade) e.entidade = "Entidade obrigatória";
    if (!formOrg.cnpj)     e.cnpj = "CNPJ obrigatório";
    else if (!validarCNPJ(formOrg.cnpj)) e.cnpj = "CNPJ inválido";
    if (emailJaCadastrado(formOrg.email, { organizadores, equipes, atletasUsuarios, funcionarios, treinadores })) e.email = "E-mail já cadastrado";
    if (organizadores.some(o => o.cnpj && formOrg.cnpj && o.cnpj.replace(/\D/g,"") === formOrg.cnpj.replace(/\D/g,""))) e.cnpj = "CNPJ já cadastrado";
    if (Object.keys(e).length) { setErrosOrg(e); return; }
    try { await createUserWithEmailAndPassword(auth, formOrg.email.trim(), formOrg.senha); } catch (_) {}
    await firebaseSignOut(auth).catch(() => {});
    adicionarOrganizador({ ...formOrg, id:Date.now().toString(), status:"aprovado", dataCadastro:new Date().toISOString(), tipo:"organizador" });
    setFormOrg({ nome:"", email:"", senha:"", entidade:"", fone:"", cnpj:"" });
    setErrosOrg({}); setSalvoOrg(true); setTimeout(() => setSalvoOrg(false), 3000); setShowOrgForm(false);
  };

  // ── Tabs definition ────────────────────────────────────────────────────────
  const TABS = [
    { id:"visao-geral",   label:"📊 Visão Geral",   badge: totalPend },
    { id:"organizadores", label:"🏟️ Organizadores",  badge: pendOrg.length + pendRec.length, sub: organizadores.length },
    { id:"competicoes",   label:"📋 Competições",    badge: pendEv.length, sub: eventos.length },
    { id:"equipes",       label:"🏅 Equipes",        badge: pendEq.length, sub: equipes.length },
    { id:"atletas",       label:"🏃 Atletas",        sub: atletas.length },
    { id:"historico",     label:"📊 Histórico" },
    { id:"portabilidade", label:"📦 Portabilidade", badge: pendPort.length },
  ];

  const si = { ...s.input, padding:"6px 12px", fontSize:12, marginBottom:10, maxWidth:400 };

  // ── Render ─────────────────────────────────────────────────────────────────
  // ── Paginação ──────────────────────────────────────────────────────────────
  const _atletasFiltrados = atletas.filter(a => {
    if (!buscaAtl) return true;
    const b = buscaAtl.toLowerCase();
    const eq = equipes.find(eq2 => eq2.id === a.equipeId);
    return (a.nome||"").toLowerCase().includes(b)||(eq?.nome||"").toLowerCase().includes(b);
  });
  const { paginado: atletasPag, infoPage: atletasInfo } = usePagination(_atletasFiltrados, 10);

  const _equipesFiltradas = [...equipes]
    .filter(eq => {
      if (!buscaEq) return true;
      const b = buscaEq.toLowerCase();
      return (eq.nome||"").toLowerCase().includes(b)||(eq.sigla||"").toLowerCase().includes(b)||(eq.cidade||"").toLowerCase().includes(b);
    })
    .sort((a, b) => (a.nome||"").localeCompare(b.nome||"", "pt-BR"));
  const { paginado: equipesPag, infoPage: equipesInfo } = usePagination(_equipesFiltradas, 10);

  const _orgFiltrados = [...organizadores]
    .filter(o => {
      if (!buscaOrg) return true;
      const b = buscaOrg.toLowerCase();
      return (o.nome||"").toLowerCase().includes(b)||(o.entidade||"").toLowerCase().includes(b);
    })
    .sort((a, b) => (a.nome||"").localeCompare(b.nome||"", "pt-BR"));
  const { paginado: orgPag, infoPage: orgInfo } = usePagination(_orgFiltrados, 10);

  const _compFiltradas = [...eventos]
    .filter(e => {
      if (!buscaComp) return true;
      const b = buscaComp.toLowerCase();
      return (e.nome||"").toLowerCase().includes(b)||(e.local||"").toLowerCase().includes(b);
    })
    .sort((a, b) => (a.nome||"").localeCompare(b.nome||"", "pt-BR"));
  const { paginado: compPag, infoPage: compInfo } = usePagination(_compFiltradas, 10);

  return (
    <div style={s.page}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:24 }}>
        <h1 style={s.title}>⚙️ Administração</h1>
      </div>

      {/* ── TAB BAR ────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:12, overflow:"hidden", marginBottom:28, flexWrap:"wrap" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setAba(tab.id)} style={s.tab(aba === tab.id)}>
            {tab.label}
            {tab.sub != null && (
              <span style={{ fontSize:10, color: aba === tab.id ? `${t.accent}88` : t.textDisabled }}>({tab.sub})</span>
            )}
            {tab.badge > 0 && (
              <span style={{ background:"#c0392b", color: t.textPrimary, borderRadius:10, padding:"1px 6px", fontSize:10, fontWeight:800, minWidth:18, textAlign:"center" }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: VISÃO GERAL
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "visao-geral" && (
        <>
          {/* Stats */}
          <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:24 }}>
            <StatCard value={eventos.length}       label="Competições" />
            <StatCard value={organizadores.length} label="Organizadores" />
            <StatCard value={equipes.length}       label="Equipes" />
            <StatCard value={atletas.length}       label="Atletas" />
            <StatCard value={inscricoes.length}    label="Inscrições" />
          </div>

          {/* Pendências urgentes */}
          {totalPend > 0 && (
            <div style={{ ...s.card, borderColor:"#c0392b44", marginBottom:20 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:800, color:"#c0392b", marginBottom:14, letterSpacing:1 }}>
                ⚠️ PENDÊNCIAS QUE REQUEREM ATENÇÃO
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:10 }}>
                {pendRec.length > 0 && (
                  <button onClick={() => setAba("organizadores")} style={s.pendCard(t.success,`${t.success}15`,`${t.success}44`)}>
                    <span style={{ fontSize:26 }}>🔑</span>
                    <div>
                      <div style={{ fontWeight:700, color:t.success, fontSize:13 }}>{pendRec.length} recuperação(ões) de senha</div>
                      <div style={{ color: t.textDimmed, fontSize:11, marginTop:2 }}>Aguardando envio de senha temporária</div>
                    </div>
                    <span style={{ marginLeft:"auto", color:"#2a5a2a", fontSize:16 }}>→</span>
                  </button>
                )}
                {pendOrg.length > 0 && (
                  <button onClick={() => setAba("organizadores")} style={s.pendCard(t.accent,t.accentBg,`${t.accent}44`)}>
                    <span style={{ fontSize:26 }}>🏟️</span>
                    <div>
                      <div style={{ fontWeight:700, color: t.accent, fontSize:13 }}>{pendOrg.length} organizador(es) pendente(s)</div>
                      <div style={{ color: t.textDimmed, fontSize:11, marginTop:2 }}>Aguardando aprovação</div>
                    </div>
                    <span style={{ marginLeft:"auto", color:"#1a3a5a", fontSize:16 }}>→</span>
                  </button>
                )}
                {pendEv.length > 0 && (
                  <button onClick={() => setAba("competicoes")} style={s.pendCard("#e67e22",`${t.warning}11`,"#e67e2244")}>
                    <span style={{ fontSize:26 }}>📋</span>
                    <div>
                      <div style={{ fontWeight:700, color:"#e67e22", fontSize:13 }}>{pendEv.length} competição(ões) pendente(s)</div>
                      <div style={{ color: t.textDimmed, fontSize:11, marginTop:2 }}>Aguardando aprovação</div>
                    </div>
                    <span style={{ marginLeft:"auto", color:"#4a2a00", fontSize:16 }}>→</span>
                  </button>
                )}
                {pendPort.length > 0 && (
                  <button onClick={() => setAba("portabilidade")} style={s.pendCard("#a855f7","#a855f711","#a855f744")}>
                    <span style={{ fontSize:26 }}>📦</span>
                    <div>
                      <div style={{ fontWeight:700, color:"#a855f7", fontSize:13 }}>{pendPort.length} solicitação(ões) de portabilidade</div>
                      <div style={{ color: t.textDimmed, fontSize:11, marginTop:2 }}>Aguardando geração e liberação</div>
                    </div>
                    <span style={{ marginLeft:"auto", color:"#4a1a6a", fontSize:16 }}>→</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Ações rápidas */}
          <div style={s.card}>
            <div style={s.sectionHd}>🚀 Ações Rápidas</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
              {[
                { icon:"🏟",  label:"Criar Competição",   action:() => { selecionarEvento(null); setTela("novo-evento"); }, primary:true },
                { icon:"🏃",  label:"Cadastrar Atleta",   action:() => setTela("cadastrar-atleta") },
                { icon:"🏅",  label:"Gerenciar Equipes",  action:() => setTela("gerenciar-equipes") },
                { icon:"👥",  label:"Gerenciar Usuários", action:() => setTela("gerenciar-usuarios") },
                { icon:"📋",  label:"Ver Inscrições",     action:() => setTela("gerenciar-inscricoes") },
              ].map(a => (
                <button key={a.label} onClick={a.action} style={{
                  background: a.primary ? "linear-gradient(135deg,#1976D2,#1565C0)" : t.bgHeaderSolid,
                  border: a.primary ? "none" : `1px solid ${t.border}`,
                  borderRadius:10, padding:"16px 10px",
                  cursor:"pointer", color: a.primary ? "#fff" : t.textTertiary,
                  fontFamily:"'Barlow',sans-serif", fontSize:12,
                  display:"flex", flexDirection:"column", alignItems:"center", gap:7, textAlign:"center",
                  transition:"all 0.15s",
                }}>
                  <span style={{ fontSize:22 }}>{a.icon}</span>
                  <span style={{ fontWeight:600, lineHeight:1.3 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Últimas ações */}
          {(historicoAcoes||[]).length > 0 && (
            <div style={s.card}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={s.sectionHd}>🕐 Últimas Ações</div>
                <button style={{ ...s.btnGhost, fontSize:11, padding:"4px 12px" }} onClick={() => setAba("historico")}>
                  Ver tudo →
                </button>
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead><tr><Th>Data/Hora</Th><Th>Usuário</Th><Th>Ação</Th><Th>Detalhe</Th></tr></thead>
                  <tbody>
                    {(historicoAcoes||[]).slice(0,5).map((h, i) => (
                      <tr key={`rh_${h.id}_${i}`} style={s.tr}>
                        <Td style={{ fontSize:11, color: t.textDimmed, whiteSpace:"nowrap" }}>
                          {new Date(h.data).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"})}
                        </Td>
                        <Td><span style={{ color: t.accent, fontSize:12 }}>{h.nomeUsuario||"—"}</span></Td>
                        <Td><strong style={{ color: t.textPrimary, fontSize:12 }}>{h.acao}</strong></Td>
                        <Td style={{ fontSize:12, color: t.textMuted }}>{h.detalhe||"—"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: ORGANIZADORES
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "organizadores" && (
        <>
          {/* Recuperação de Senha */}
          {pendRec.length > 0 && (
            <div style={{ ...s.card, borderColor:"#2a5a2a", marginBottom:16 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800, color:t.success, marginBottom:14, letterSpacing:1 }}>
                🔑 Recuperação de Senha ({pendRec.length})
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead><tr>
                    <Th>Usuário</Th><Th>Perfil</Th><Th>E-mail</Th><Th>CPF</Th><Th>Data</Th><Th>Senha Temp.</Th><Th>Ação</Th>
                  </tr></thead>
                  <tbody>
                    {pendRec.map(sol => {
                      const LABEL = { equipe:"🎽 Equipe", organizador:"🏟️ Org.", atleta:"🏃 Atleta" };
                      return (
                        <tr key={sol.id} style={s.tr}>
                          <Td><strong style={{ color: t.textPrimary }}>{sol.nome}</strong></Td>
                          <Td style={{ fontSize:12 }}>{LABEL[sol.tipo]||sol.tipo}</Td>
                          <Td style={{ fontSize:12 }}>{sol.email}</Td>
                          <Td style={{ fontSize:11, color: t.textTertiary }}>{sol.cpf||"—"}</Td>
                          <Td style={{ fontSize:11, color: t.textDimmed }}>{new Date(sol.data).toLocaleString("pt-BR")}</Td>
                          <Td>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <span style={{ fontFamily:"monospace", background:t.bgCardAlt, border:`1px solid ${t.accent}66`,
                                color: t.accent, padding:"2px 10px", borderRadius:4, fontWeight:700, letterSpacing:2, fontSize:13 }}>
                                {senhasVisiveis.has(sol.id) ? sol.senhaTemp : "••••••••"}
                              </span>
                              <button
                                onClick={() => setSenhasVisiveis(prev => {
                                  const next = new Set(prev);
                                  next.has(sol.id) ? next.delete(sol.id) : next.add(sol.id);
                                  return next;
                                })}
                                style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color: t.textDimmed, padding:"0 2px" }}
                                title={senhasVisiveis.has(sol.id) ? "Ocultar senha" : "Revelar senha"}
                              >
                                {senhasVisiveis.has(sol.id) ? "🙈" : "👁️"}
                              </button>
                            </div>
                          </Td>
                          <Td>
                            {resetFeedback[sol.id] === "ok" ? (
                              <span style={{ color:t.success, fontSize:12 }}>✅ E-mail enviado!</span>
                            ) : resetFeedback[sol.id] === "erro" ? (
                              <span style={{ color: t.danger, fontSize:12 }}>❌ Falhou — tente de novo</span>
                            ) : (
                              <button onClick={async () => {
                                setResetFeedback(prev => ({ ...prev, [sol.id]: "enviando" }));
                                try {
                                  // 1. Garantir que existe conta Firebase Auth para este e-mail
                                  await aplicarSenhaTemp(sol.tipo, sol.userId, sol.senhaTemp, sol);
                                  // 2. Enviar e-mail oficial de redefinição de senha pelo Firebase
                                  await sendPasswordResetEmail(auth, sol.email);
                                  // 3. Marcar solicitação como resolvida
                                  resolverSolicitacaoRecuperacao(sol.id);
                                  setResetFeedback(prev => ({ ...prev, [sol.id]: "ok" }));
                                } catch (err) {
                                  console.error("Erro ao enviar reset:", err);
                                  setResetFeedback(prev => ({ ...prev, [sol.id]: "erro" }));
                                }
                              }}
                              disabled={resetFeedback[sol.id] === "enviando"}
                              style={{ ...s.btnGhost, fontSize:12, padding:"4px 14px", color:t.success, borderColor:`${t.success}66`,
                                opacity: resetFeedback[sol.id] === "enviando" ? 0.5 : 1,
                                cursor: resetFeedback[sol.id] === "enviando" ? "not-allowed" : "pointer" }}>
                                {resetFeedback[sol.id] === "enviando" ? "⏳ Enviando..." : "📧 Enviar Link de Redefinição"}
                              </button>
                            )}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize:11, color: t.textDimmed, marginTop:8 }}>
                Ao clicar em "Enviar Link de Redefinição", o Firebase envia um e-mail oficial para o usuário com link para criar uma nova senha. O link expira em 1 hora.
              </div>
            </div>
          )}

          {/* Lista de Organizadores */}
          <div style={s.card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:16 }}>
              <div style={s.sectionHd}>🏟️ Organizadores ({organizadores.length})</div>
              <button onClick={async () => { setShowOrgForm(!showOrgForm); setErrosOrg({}); }}
                style={{ ...s.btnPrimary, fontSize:12, padding:"6px 16px" }}>
                {showOrgForm ? "✕ Cancelar" : "+ Novo Organizador"}
              </button>
            </div>

            {salvoOrg && (
              <div style={{ background:`${t.success}15`, border:`1px solid ${t.success}66`, borderRadius:8, padding:"8px 14px", marginBottom:12, color:t.success, fontSize:13 }}>
                ✅ Organizador criado com sucesso!
              </div>
            )}

            {showOrgForm && (
              <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.borderInput}`, borderRadius:10, padding:"16px 18px", marginBottom:16 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:8 }}>
                  <FormField label="Nome Completo *"        value={formOrg.nome}     onChange={v=>setFormOrg({...formOrg,nome:v})}     error={errosOrg.nome} />
                  <FormField label="Entidade / Federação *" value={formOrg.entidade} onChange={v=>setFormOrg({...formOrg,entidade:v})} error={errosOrg.entidade} />
                  <FormField label="E-mail *"               value={formOrg.email}    onChange={v=>setFormOrg({...formOrg,email:v})}    type="email" error={errosOrg.email} />
                  <FormField label="Telefone"               value={formOrg.fone}     onChange={v=>setFormOrg({...formOrg,fone:v})} />
                  <FormField label="Senha *"                value={formOrg.senha}    onChange={v=>setFormOrg({...formOrg,senha:v})}    type="password" error={errosOrg.senha} />
                  <FormField label="CNPJ *"                 value={formOrg.cnpj}     onChange={v=>setFormOrg({...formOrg,cnpj:v})}     placeholder="00.000.000/0001-00" error={errosOrg.cnpj} />
                </div>
                <div style={{ display:"flex", gap:8, marginTop:8 }}>
                  <button onClick={handleCriarOrg} style={s.btnPrimary}>✅ Criar Organizador (aprovado)</button>
                  <button onClick={() => setShowOrgForm(false)} style={s.btnGhost}>Cancelar</button>
                </div>
              </div>
            )}

            <input type="text" value={buscaOrg} onChange={e=>setBuscaOrg(e.target.value)}
              placeholder="🔍 Buscar organizador..." style={si} />
            <div style={s.tableWrap}>
              <div style={{ maxHeight:400, overflowY:"auto" }}>
                <table style={s.table}>
                  <thead><tr>
                    <Th>Nome</Th><Th>Entidade</Th><Th>E-mail</Th><Th>CNPJ</Th><Th>Cadastro</Th><Th>Status</Th><Th>Ações</Th>
                  </tr></thead>
                  <tbody>
                    {orgPag.map((o, i) => {
                      const bs = badgeStatus(o.status || "pendente", t);
                      return (
                        <tr key={`org_${o.id}_${i}`} style={{ ...s.tr, opacity: o.status==="recusado" ? 0.5 : 1 }}>
                          <Td><strong style={{ color: t.textPrimary }}>{o.nome}</strong></Td>
                          <Td style={{ fontSize:12 }}>{o.entidade}</Td>
                          <Td style={{ fontSize:12 }}>{o.email}</Td>
                          <Td style={{ fontSize:11 }}>{o.cnpj||"—"}</Td>
                          <Td style={{ fontSize:11, color: t.textDimmed }}>{o.dataCadastro ? new Date(o.dataCadastro).toLocaleDateString("pt-BR") : "—"}</Td>
                          <Td>
                            <span style={{ background:bs.bg, color:bs.color, padding:"3px 10px", borderRadius:4, fontSize:11, fontWeight:700 }}>
                              {bs.label}
                            </span>
                          </Td>
                          <Td>
                            <div style={{ display:"flex", gap:6 }}>
                              {o.status !== "aprovado" && (
                                <button onClick={() => aprovarOrganizador(o.id)}
                                  style={{ ...s.btnGhost, fontSize:11, padding:"3px 12px", color:t.success, borderColor:`${t.success}66` }}>✓ Aprovar</button>
                              )}
                              {o.status !== "recusado" && (
                                <button onClick={() => recusarOrganizador(o.id)}
                                  style={{ ...s.btnGhost, fontSize:11, padding:"3px 12px", color: t.danger, borderColor:`${t.danger}66` }}>✗ Recusar</button>
                              )}
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <PaginaControles {...orgInfo} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: COMPETIÇÕES
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "competicoes" && (
        <>
          {/* Pendentes */}
          {pendEv.length > 0 && (
            <div style={{ ...s.card, borderColor:"#e67e2244", marginBottom:16 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800, color:"#e67e22", marginBottom:14, letterSpacing:1 }}>
                📋 Aguardando Aprovação ({pendEv.length})
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead><tr><Th>Competição</Th><Th>Organizador</Th><Th>Data</Th><Th>Local</Th><Th>Provas</Th><Th>Ações</Th></tr></thead>
                  <tbody>
                    {pendEv.map(ev => {
                      const org = organizadores.find(o => o.id === ev.organizadorId);
                      return (
                        <tr key={`pend_${ev.id}`} style={s.tr}>
                          <Td><strong style={{ color:"#e67e22" }}>{ev.nome}</strong></Td>
                          <Td style={{ fontSize:12 }}>{org ? `${org.nome} — ${org.entidade}` : "—"}</Td>
                          <Td style={{ fontSize:12 }}>{new Date(ev.data+"T12:00:00").toLocaleDateString("pt-BR")}</Td>
                          <Td style={{ fontSize:12 }}>{_getLocalEventoDisplay(ev)}</Td>
                          <Td>{ev.provasPrograma?.length||0}</Td>
                          <Td>
                            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                              <button onClick={async () => {selecionarEvento(ev.id);setTela("evento-detalhe");}}
                                style={{ ...s.btnGhost, fontSize:11, padding:"3px 10px" }}>Ver</button>
                              <button onClick={async () => {selecionarEvento(ev.id);setTela("novo-evento");}}
                                style={{ ...s.btnGhost, fontSize:11, padding:"3px 10px", color:t.accent, borderColor:`${t.accent}66` }}>⚙️ Editar</button>
                              <button onClick={() => aprovarEvento(ev.id)}
                                style={{ ...s.btnGhost, fontSize:11, padding:"3px 12px", color:t.success, borderColor:`${t.success}66` }}>✓ Aprovar</button>
                              <button onClick={() => recusarEvento(ev.id)}
                                style={{ ...s.btnGhost, fontSize:11, padding:"3px 12px", color: t.danger, borderColor:`${t.danger}66` }}>✗ Recusar</button>
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Todas as competições */}
          <div style={s.card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:14 }}>
              <div style={s.sectionHd}>🏟 Todas as Competições ({eventos.length})</div>
              <button style={s.btnPrimary} onClick={async () => { selecionarEvento(null); setTela("novo-evento"); }}>+ Nova Competição</button>
            </div>
            <input type="text" value={buscaComp} onChange={e=>setBuscaComp(e.target.value)}
              placeholder="🔍 Buscar competição..." style={si} />
            {eventos.length === 0 ? (
              <div style={s.empty}>Nenhuma competição cadastrada.</div>
            ) : (
              <>
                <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:480, overflowY:"auto" }}>
                  {compPag.map(ev => {
                    const nInscs = inscricoes.filter(i => i.eventoId===ev.id).length;
                    const bs = badgeStatus(ev.statusAprovacao || "aprovado", t);
                    return (
                      <div key={`all_${ev.id}`} style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          {ev.logoCompeticao && <img src={ev.logoCompeticao} alt="" style={{ width:22, height:22, objectFit:"contain", borderRadius:3 }} />}
                          <strong style={{ color: t.textPrimary, fontSize:13, flex:1 }}>{ev.nome}</strong>
                          <span style={{ background:bs.bg, color:bs.color, fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:3 }}>{bs.label}</span>
                        </div>
                        <div style={{ color: t.textDimmed, fontSize:11, marginBottom:8 }}>
                          {new Date(ev.data+"T12:00:00").toLocaleDateString("pt-BR")} · {_getLocalEventoDisplay(ev)} · {nInscs} insc.
                        </div>
                        <div style={{ display:"flex", gap:5 }}>
                          <button style={{ ...s.btnSecondary, fontSize:11, padding:"3px 10px" }}
                            onClick={async () => { selecionarEvento(ev.id); setTela("evento-detalhe"); }}>Acessar</button>
                          <button style={{ ...s.btnGhost, fontSize:11, padding:"3px 10px" }}
                            onClick={async () => { selecionarEvento(ev.id); setTela("novo-evento"); }}>✏️ Editar</button>
                          <button style={{ ...s.btnGhost, fontSize:11, padding:"3px 9px", color: t.danger, borderColor:`${t.danger}44` }}
                            onClick={() => excluirEvento(ev.id)}>🗑</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <PaginaControles {...compInfo} />
              </>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: EQUIPES
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "equipes" && (
        <div style={s.card}>
          {/* ── Fila de aprovação ── */}
          {pendEq.length > 0 && (() => {
            return (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <div style={s.sectionHd}>⏳ Equipes Aguardando Aprovação</div>
                  <span style={{ background:`${t.success}15`, color:t.success, border:`1px solid ${t.success}66`, borderRadius:20, padding:"2px 10px", fontSize:12, fontWeight:700 }}>
                    {pendEq.length}
                  </span>
                </div>
                {pendEq.map(sol => (
                  <div key={sol.id} style={{ background:t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:10, padding:16, marginBottom:12 }}>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:16, marginBottom:12 }}>
                      <div>
                        <div style={{ color: t.textPrimary, fontWeight:700, fontSize:15 }}>{sol.equipeNome} <span style={{ color: t.accent, fontSize:13 }}>({sol.equipeSigla})</span></div>
                        <div style={{ color: t.textMuted, fontSize:12, marginTop:2 }}>{sol.equipeEmail} · CNPJ: {sol.equipeCnpj}</div>
                        <div style={{ color: t.textMuted, fontSize:12 }}>{sol.equipeCidade}/{sol.equipeUf}</div>
                      </div>
                      <div style={{ marginLeft:"auto", textAlign:"right" }}>
                        {sol.organizadorId
                          ? <div style={{ color:t.accent, fontSize:12 }}>Org.: {sol.organizadorNome || sol.organizadorId}</div>
                          : <div style={{ color:"#e67e22", fontSize:12 }}>⚠️ Sem organizador vinculado</div>
                        }
                        <div style={{ color: t.textDimmed, fontSize:11 }}>{new Date(sol.data).toLocaleDateString("pt-BR")}</div>
                      </div>
                    </div>
                    {!sol.organizadorId && (
                      <div style={{ marginBottom:10 }}>
                        <label style={{ color: t.textTertiary, fontSize:12, display:"block", marginBottom:4 }}>Vincular a organizador:</label>
                        <select value={orgSel[sol.id] || ""} onChange={e => setOrgSel(p => ({...p, [sol.id]: e.target.value}))}
                          style={{ background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:6, color: t.textPrimary, padding:"6px 10px", fontSize:13, width:"100%" }}>
                          <option value="">Selecione o organizador...</option>
                          {organizadores.filter(o => o.status === "aprovado").map(o => (
                            <option key={o.id} value={o.id}>{o.nome} — {o.entidade}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div style={{ display:"flex", gap:8 }}>
                      <button style={{ ...s.btnPrimary, fontSize:13, padding:"6px 18px" }}
                        onClick={() => {
                          const orgId = sol.organizadorId || orgSel[sol.id];
                          if (!sol.organizadorId && !orgId) { alert("Selecione um organizador antes de aprovar."); return; }
                          aprovarEquipe(sol.equipeId, orgId || null);
                        }}>✅ Aprovar</button>
                      <button style={{ background:`${t.danger}15`, color: t.danger, border:`1px solid ${t.danger}66`, borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700, padding:"6px 18px" }}
                        onClick={() => recusarEquipe(sol.equipeId)}>❌ Recusar</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:14 }}>
            <div style={s.sectionHd}>🏅 Equipes ({equipes.length})</div>
            <button style={s.btnSecondary} onClick={() => setTela("gerenciar-equipes")}>🏅 Gestão Completa →</button>
          </div>
          {equipes.length === 0 ? (
            <div style={s.empty}>Nenhuma equipe cadastrada.</div>
          ) : (
            <>
              <input type="text" value={buscaEq} onChange={e=>setBuscaEq(e.target.value)}
                placeholder="🔍 Buscar equipe..." style={si} />
              <div style={s.tableWrap}>
                <div style={{ maxHeight:480, overflowY:"auto" }}>
                  <table style={s.table}>
                    <thead><tr><Th>Nome</Th><Th>Sigla</Th><Th>E-mail</Th><Th>CNPJ</Th><Th>Cidade</Th><Th>Organizador</Th><Th>Atletas</Th></tr></thead>
                    <tbody>
                      {equipesPag.map(eq => {
                        const org = organizadores.find(o => o.id === eq.organizadorId);
                        return (
                          <tr key={`eq_${eq.id}`} style={s.tr}>
                            <Td><strong style={{ color: t.textPrimary }}>{eq.nome}</strong></Td>
                            <Td style={{ fontSize:12 }}>{eq.sigla||"—"}</Td>
                            <Td style={{ fontSize:12 }}>{eq.email||"—"}</Td>
                            <Td style={{ fontSize:11 }}>{eq.cnpj||"—"}</Td>
                            <Td style={{ fontSize:12 }}>{eq.cidade ? `${eq.cidade}/${eq.estado||""}` : "—"}</Td>
                            <Td>{org ? <span style={{ color: t.accent, fontSize:12 }}>{org.entidade||org.nome}</span> : <span style={{ color: t.textDimmed, fontSize:12 }}>Sem vínculo</span>}</Td>
                            <Td><span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800, color: t.accent }}>{atletas.filter(a => a.equipeId===eq.id).length}</span></Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <PaginaControles {...equipesInfo} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: ATLETAS
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "atletas" && (
        <div style={s.card}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:14 }}>
            <div style={s.sectionHd}>🏃 Atletas ({atletas.length})</div>
            <div style={{ display:"flex", gap:8 }}>
              <button style={s.btnPrimary} onClick={() => setTela("cadastrar-atleta")}>+ Cadastrar</button>
              <button style={s.btnSecondary} onClick={() => setTela("importar-atletas")}>📊 Importar</button>
            </div>
          </div>
          {atletas.length === 0 ? (
            <div style={s.empty}>Nenhum atleta cadastrado.</div>
          ) : (
            <>
              <input type="text" value={buscaAtl} onChange={e=>setBuscaAtl(e.target.value)}
                placeholder="🔍 Buscar atleta..." style={si} />
              <div style={s.tableWrap}>
                <div style={{ maxHeight:480, overflowY:"auto" }}>
                  <table style={s.table}>
                    <thead><tr><Th>Nome</Th><Th>Sexo</Th><Th>Nasc.</Th><Th>Equipe</Th><Th>Inscrições</Th><Th>Ações</Th></tr></thead>
                    <tbody>
                      {atletasPag.map(a => {
                        const eq = equipes.find(eq2 => eq2.id === a.equipeId);
                        const ninsc = inscricoes.filter(i => i.atletaId===a.id).length;
                        return (
                          <tr key={`atl_${a.id}`} style={s.tr}>
                            <Td><strong style={{ color: t.textPrimary }}>{a.nome}</strong></Td>
                            <Td>
                              <span style={{ background: a.sexo==="M"?"#1a6ef522":"#e54f9b22", color: a.sexo==="M"?"#1a6ef5":"#e54f9b",
                                border:`1px solid ${a.sexo==="M"?"#1a6ef544":"#e54f9b44"}`, borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:600 }}>
                                {a.sexo==="M"?"Masc":"Fem"}
                              </span>
                            </Td>
                            <Td style={{ fontSize:12 }}>{_getNascDisplay(a)||"—"}</Td>
                            <Td style={{ fontSize:12 }}>{eq?.nome||<span style={{ color: t.textDimmed }}>Avulso</span>}</Td>
                            <Td><span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800, color: t.accent }}>{ninsc}</span></Td>
                            <Td>
                              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                                <button onClick={async () => { setAtletaEditandoId(a.id); setTela("editar-atleta"); }}
                                  style={{ ...s.btnGhost, fontSize:11, padding:"3px 12px" }}>✏️ Editar</button>
                                <button onClick={() => { setModalTransf({ atleta: a }); setTransfEquipeId(a.equipeId || ""); }}
                                  style={{ ...s.btnGhost, fontSize:11, padding:"3px 12px", color:"#e6c430", borderColor:"#5a4a00" }}>🔀 Transferir</button>
                                <button onClick={async () => {  if (await confirmar(`Excluir ${a.nome }?`)) excluirAtleta(a.id); }}
                                  style={{ ...s.btnGhost, fontSize:11, padding:"3px 10px", color: t.danger, borderColor:"#5a1a1a" }}>🗑</button>
                              </div>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <PaginaControles {...atletasInfo} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: HISTÓRICO
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "historico" && (() => {
        const todas = historicoAcoes || [];
        const filtradas = todas.filter(h => {
          if (!buscaHist) return true;
          const b = buscaHist.toLowerCase();
          return (h.nomeUsuario||"").toLowerCase().includes(b)||(h.acao||"").toLowerCase().includes(b)||(h.detalhe||"").toLowerCase().includes(b);
        });
        return (
          <div style={s.card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:14 }}>
              <div style={s.sectionHd}>📊 Histórico de Ações</div>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <span style={{ fontSize:12, color: t.textDimmed }}>{filtradas.length} de {todas.length} · máx. 500</span>
                {todas.length > 0 && setHistoricoAcoes && (
                  <>
                    <button
                      onClick={() => {
                        if (!window.confirm(`⚠️ Apagar as entradas mais antigas?\n\nSerão mantidas apenas as 100 mais recentes das ${todas.length} existentes.`)) return;
                        setHistoricoAcoes(p => p.slice(0, 100));
                        registrarAcao?.(usuarioLogado.id, usuarioLogado.nome, "Limpou histórico de ações (manteve 100)", "", null, { modulo: "sistema" });
                      }}
                      style={{ ...s.btnGhost, fontSize:11, padding:"4px 12px", color:"#e67e22", borderColor:`${t.warning}44` }}>
                      🧹 Manter últimas 100
                    </button>
                    <button
                      onClick={() => {
                        if (!window.confirm(`⚠️ Apagar TODO o histórico de ações?\n\nEsta ação é IRREVERSÍVEL e não pode ser desfeita.`)) return;
                        setHistoricoAcoes([]);
                        registrarAcao?.(usuarioLogado.id, usuarioLogado.nome, "Apagou todo o histórico de ações", "", null, { modulo: "sistema" });
                      }}
                      style={{ ...s.btnGhost, fontSize:11, padding:"4px 12px", color: t.danger, borderColor:`${t.danger}44` }}>
                      🗑️ Apagar tudo
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Auditoria de equipes/organizadores */}
            {auditoria.length > 0 && (
              <div style={{ background:`${t.success}08`, border:`1px solid ${t.success}33`, borderRadius:8, padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                <span style={{ fontSize:12, color: t.success }}>
                  📋 Auditoria de equipes/organizadores: <strong>{auditoria.length}</strong> entrada(s)
                </span>
                {setAuditoria && (
                  <div style={{ display:"flex", gap:8 }}>
                    <button
                      onClick={() => {
                        if (!window.confirm(`⚠️ Manter apenas as 100 entradas mais recentes da auditoria?`)) return;
                        setAuditoria(p => p.slice(0, 100));
                      }}
                      style={{ ...s.btnGhost, fontSize:11, padding:"3px 10px", color:"#e67e22", borderColor:`${t.warning}44` }}>
                      🧹 Manter 100
                    </button>
                    <button
                      onClick={() => {
                        if (!window.confirm(`⚠️ Apagar TODA a auditoria de equipes/organizadores?`)) return;
                        setAuditoria([]);
                      }}
                      style={{ ...s.btnGhost, fontSize:11, padding:"3px 10px", color: t.danger, borderColor:`${t.danger}44` }}>
                      🗑️ Apagar tudo
                    </button>
                  </div>
                )}
              </div>
            )}

            {todas.length === 0 ? (
              <div style={s.empty}>Nenhuma ação registrada.</div>
            ) : (
              <>
                <input type="text" value={buscaHist} onChange={e=>setBuscaHist(e.target.value)}
                  placeholder="🔍 Buscar ação, usuário, módulo..." style={si} />
                <div style={s.tableWrap}>
                  <div style={{ maxHeight:540, overflowY:"auto" }}>
                    <table style={s.table}>
                      <thead><tr><Th>Data/Hora</Th><Th>Usuário</Th><Th>Ação</Th><Th>Detalhe</Th><Th>Módulo</Th></tr></thead>
                      <tbody>
                        {filtradas.map((h, idx) => (
                          <tr key={`h_${h.id}_${idx}`} style={s.tr}>
                            <Td style={{ fontSize:11, color: t.textDimmed, whiteSpace:"nowrap" }}>
                              {new Date(h.data).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"})}
                            </Td>
                            <Td><span style={{ color: t.accent, fontSize:12 }}>{h.nomeUsuario||"—"}</span></Td>
                            <Td><strong style={{ color: t.textPrimary, fontSize:12 }}>{h.acao}</strong></Td>
                            <Td style={{ fontSize:12, color: t.textMuted }}>{h.detalhe||"—"}</Td>
                            <Td><span style={{ color: t.textDimmed, fontSize:10 }}>{h.modulo||"—"}</span></Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA: PORTABILIDADE DE DADOS (Art. 18º, V LGPD)
      ══════════════════════════════════════════════════════════════════════ */}
      {aba === "portabilidade" && (() => {
        // Função que monta o JSON de dados do titular
        const gerarDadosTitular = (sol) => {
          const hoje = new Date().toISOString();
          const dados = {
            gerentrack_portabilidade: true,
            versao: "1.0",
            geradoEm: hoje,
            titular: {
              id:   sol.usuarioId,
              nome: sol.usuarioNome,
              tipo: sol.usuarioTipo,
              email: sol.email,
            },
            aviso: "Este arquivo contém seus dados pessoais conforme Art. 18º, V da Lei nº 13.709/2018 (LGPD).",
          };

          // Dados do perfil do usuário
          const stores = {
            atleta:      atletasUsuarios,
            equipe:      equipes,
            organizador: organizadores,
            funcionario: funcionarios,
            treinador:   treinadores,
          };
          const perfil = (stores[sol.usuarioTipo] || []).find(u => u.id === sol.usuarioId);
          if (perfil) {
            const { senha, senhaTemporaria, ...perfilSemSenha } = perfil;
            dados.perfil = perfilSemSenha;
          }

          // Atleta base (para atletas)
          if (sol.usuarioTipo === "atleta") {
            const atletaBase = atletas.find(a =>
              a.atletaUsuarioId === sol.usuarioId ||
              (perfil?.cpf && a.cpf && a.cpf.replace(/\D/g,"") === perfil.cpf.replace(/\D/g,""))
            );
            if (atletaBase) {
              dados.atletaBase = atletaBase;
              // Inscrições
              dados.inscricoes = inscricoes
                .filter(i => i.atletaId === atletaBase.id)
                .map(i => ({
                  eventoId:   i.eventoId,
                  eventoNome: eventos.find(e => e.id === i.eventoId)?.nome || i.eventoId,
                  provaId:    i.provaId,
                  provaNome:  i.provaNome || i.provaId,
                  categoria:  i.categoria,
                  data:       i.dataCadastro || null,
                }));
              // Resultados
              const meusResultados = [];
              Object.entries(resultados || {}).forEach(([chave, docRes]) => {
                if (docRes && docRes[atletaBase.id] != null) {
                  meusResultados.push({ chave, resultado: docRes[atletaBase.id] });
                }
              });
              dados.resultados = meusResultados;
            }
          }

          // Atletas vinculados (para equipes)
          if (sol.usuarioTipo === "equipe") {
            dados.atletasVinculados = atletas
              .filter(a => a.equipeId === sol.usuarioId)
              .map(a => ({ id: a.id, nome: a.nome, categoria: a.categoria, sexo: a.sexo }));
          }

          return JSON.stringify(dados, null, 2);
        };

        const todasSols = [...(solicitacoesPortabilidade || [])]
          .sort((a, b) => new Date(b.data) - new Date(a.data));

        return (
          <div style={{ maxWidth: 860 }}>
            <div style={{ ...s.card, borderColor:"#a855f733" }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800,
                color:"#a855f7", marginBottom:8, letterSpacing:1 }}>
                📦 Solicitações de Portabilidade de Dados
              </div>
              <p style={{ color: t.textDimmed, fontSize:13, marginBottom:16, lineHeight:1.6 }}>
                Art. 18º, V da LGPD — O titular tem direito a receber cópia dos seus dados em formato estruturado.
                Clique em <strong style={{ color: t.textPrimary }}>Gerar e Liberar</strong> para aprovar e disponibilizar o arquivo ao titular.
              </p>

              {todasSols.length === 0 ? (
                <div style={s.empty}>
                  <span style={{ fontSize:36 }}>📭</span>
                  <p>Nenhuma solicitação de portabilidade ainda.</p>
                </div>
              ) : (
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead><tr>
                      <Th>Titular</Th>
                      <Th>Perfil</Th>
                      <Th>E-mail</Th>
                      <Th>Solicitado em</Th>
                      <Th>Status</Th>
                      <Th>Ação</Th>
                    </tr></thead>
                    <tbody>
                      {todasSols.map(sol => {
                        const isPendente = sol.status === "pendente";
                        const isPronto   = sol.status === "pronto";
                        const tipoLabel  = { atleta:"🏃 Atleta", equipe:"🎽 Equipe", organizador:"🏟️ Org.", funcionario:"👥 Func.", treinador:"👨‍🏫 Trein." };
                        return (
                          <tr key={sol.id} style={s.tr}>
                            <Td><strong style={{ color: t.textPrimary }}>{sol.usuarioNome || "—"}</strong></Td>
                            <Td style={{ fontSize:12 }}>{tipoLabel[sol.usuarioTipo] || sol.usuarioTipo}</Td>
                            <Td style={{ fontSize:12 }}>{sol.email || "—"}</Td>
                            <Td style={{ fontSize:11, color: t.textDimmed }}>{new Date(sol.data).toLocaleString("pt-BR")}</Td>
                            <Td>
                              <span style={{
                                background: isPendente ? "#a855f715" : isPronto ? `${t.success}15` : t.bgCardAlt,
                                color:      isPendente ? "#a855f7" : isPronto ? t.success : t.textMuted,
                                border:     `1px solid ${isPendente ? "#a855f744" : isPronto ? `${t.success}66` : t.border}`,
                                borderRadius:10, padding:"2px 10px", fontSize:11, fontWeight:700,
                              }}>
                                {isPendente ? "⏳ Pendente" : isPronto ? "✅ Pronto" : sol.status}
                              </span>
                            </Td>
                            <Td>
                              <div style={{ display:"flex", gap:6 }}>
                                {isPendente && (
                                  <button onClick={() => {
                                    const json = gerarDadosTitular(sol);
                                    resolverSolicitacaoPortabilidade(sol.id, json);
                                  }}
                                    style={{ ...s.btnGhost, fontSize:11, padding:"4px 12px", color:"#a855f7", borderColor:"#a855f744" }}>
                                    ⚙️ Gerar e Liberar
                                  </button>
                                )}
                                {isPronto && (
                                  <button onClick={() => {
                                    const blob = new Blob([sol.dadosJson], { type:"application/json" });
                                    const url  = URL.createObjectURL(blob);
                                    const a    = document.createElement("a");
                                    a.href     = url;
                                    a.download = `portabilidade-${sol.usuarioNome?.replace(/\s/g,"-") || sol.usuarioId}-${sol.data.slice(0,10)}.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }}
                                    style={{ ...s.btnGhost, fontSize:11, padding:"4px 12px", color:t.success, borderColor:`${t.success}66` }}>
                                    ⬇️ Baixar Cópia
                                  </button>
                                )}
                                <button onClick={() => excluirSolicitacaoPortabilidade(sol.id)}
                                  style={{ ...s.btnGhost, fontSize:11, padding:"4px 10px", color: t.danger, borderColor:`${t.danger}44` }}
                                  title="Excluir solicitação">
                                  🗑
                                </button>
                              </div>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ fontSize:11, color: t.textDimmed, marginTop:10, lineHeight:1.6 }}>
                ⚖️ A LGPD exige atendimento em prazo razoável — recomendado até <strong style={{ color: t.textMuted }}>15 dias</strong> da solicitação (Art. 19º).
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal de Transferência ── */}
      {modalTransf && (
        <div style={{ position:"fixed", inset:0, background:"#000a", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={() => setModalTransf(null)}>
          <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:14, padding:28, width:420, maxWidth:"95vw" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800, color: t.textPrimary, marginBottom:4 }}>
              🔀 Transferir Atleta
            </h3>
            <p style={{ color: t.textMuted, fontSize:13, marginBottom:20 }}>{modalTransf.atleta.nome}</p>

            <div style={{ marginBottom:12 }}>
              <label style={{ color: t.textTertiary, fontSize:12, display:"block", marginBottom:4 }}>Equipe atual</label>
              <div style={{ color: t.textPrimary, fontSize:14, padding:"8px 12px", background:t.bgInput, borderRadius:6, border:`1px solid ${t.borderInput}` }}>
                {equipes.find(e => e.id === modalTransf.atleta.equipeId)?.nome || <span style={{ color: t.textDimmed }}>Sem equipe</span>}
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ color: t.textTertiary, fontSize:12, display:"block", marginBottom:4 }}>Nova equipe *</label>
              <select value={transfEquipeId} onChange={e => setTransfEquipeId(e.target.value)}
                style={{ width:"100%", background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:6, color: t.textPrimary, padding:"8px 12px", fontSize:13 }}>
                <option value="">Selecione a equipe de destino...</option>
                {[...equipes]
                  .filter(e => e.id !== modalTransf.atleta.equipeId && (e.status === "ativa" || e.status === "aprovado"))
                  .sort((a,b) => (a.nome||"").localeCompare(b.nome||"", "pt-BR"))
                  .map(e => <option key={e.id} value={e.id}>{e.nome} ({e.sigla||"—"})</option>)
                }
              </select>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button style={{ ...s.btnPrimary, flex:1 }} onClick={async () => {
                if (!transfEquipeId) { alert("Selecione a equipe de destino."); return; }
                const novaEquipe = equipes.find(e => e.id === transfEquipeId);
                const atletaAtualizado = { ...modalTransf.atleta, equipeId: transfEquipeId, clube: novaEquipe?.nome || "" };
                await atualizarAtleta(atletaAtualizado);
                if (usuarioLogado) {
                  const equipeOrigem = equipes.find(e => e.id === modalTransf.atleta.equipeId)?.nome || "Sem equipe";
                  registrarAcao?.(usuarioLogado.id, usuarioLogado.nome, "Transferiu atleta",
                    `${modalTransf.atleta.nome}: ${equipeOrigem} → ${novaEquipe?.nome}`, null, { modulo: "atletas" });
                }
                setModalTransf(null);
                setTransfEquipeId("");
              }}>✅ Confirmar Transferência</button>
              <button style={{ ...s.btnGhost }} onClick={() => setModalTransf(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default TelaAdmin;
