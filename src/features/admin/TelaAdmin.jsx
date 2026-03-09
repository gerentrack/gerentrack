import React, { useState } from "react";
import { _getLocalEventoDisplay, _getNascDisplay, validarCNPJ, emailJaCadastrado } from "../../shared/formatters/utils";
import { StatCard } from "../ui/StatCard";
import FormField from "../ui/FormField";
import { Th, Td } from "../ui/TableHelpers";
import { auth, createUserWithEmailAndPassword, signOut as firebaseSignOut } from "../../firebase";

const styles = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: 1, margin: 0 },
  painelHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  card: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 24px", marginBottom: 20 },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 8 },
  tableWrap: { overflowX: "auto", borderRadius: 10, border: "1px solid #1E2130" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#0D0E12", padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1E2130" },
  td: { padding: "10px 14px", fontSize: 13, color: "#bbb", borderBottom: "1px solid #12141a" },
  tr: { transition: "background 0.15s" },
  scrollBox: { maxHeight: 320, overflowY: "auto" },
  btnPrimary: { background: "linear-gradient(135deg, #1976D2, #1565C0)", color: "#fff", border: "none", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s", whiteSpace: "nowrap" },
  btnSecondary: { background: "transparent", color: "#1976D2", border: "2px solid #1976D2", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, whiteSpace: "nowrap" },
  btnGhost: { background: "transparent", color: "#888", border: "1px solid #2a2d3a", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", whiteSpace: "nowrap" },
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, marginBottom: 5, textTransform: "uppercase" },
  input: { width: "100%", background: "#141720", border: "1px solid #252837", borderRadius: 7, padding: "9px 12px", color: "#E0E0E0", fontSize: 13, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  select: { width: "100%", background: "#141720", border: "1px solid #252837", borderRadius: 7, padding: "9px 12px", color: "#E0E0E0", fontSize: 13, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  erro: { background: "#2a1010", border: "1px solid #ff4444", color: "#ff6b6b", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 },
  fieldError: { color: "#ff6b6b", fontSize: 12, marginTop: 2 },
  emptyState: { textAlign: "center", padding: "40px 20px", color: "#444", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 14 },
  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  marca: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 800, color: "#1976D2" },
  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: "#888" },
  radioLabelActive: { background: "#1c1f2e", border: "1px solid #1976D2", color: "#1976D2" },
  adminCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#1976D2", marginBottom: 16 },
  painelBtns: { display: "flex", gap: 10, flexWrap: "wrap" },
};

const badgeStatus = (s) => ({
  pendente: { bg:"#0a1a2a", color:"#1976D2", label:"⏳ Pendente" },
  aprovado: { bg:"#0a2a0a", color:"#7cfc7c", label:"✓ Aprovado" },
  recusado: { bg:"#2a0a0a", color:"#ff6b6b", label:"✗ Recusado" },
}[s] || { bg:"#1a1c22", color:"#888", label: s || "—" });

function SectionCard({ title, action, children, accentColor }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h2 style={{ ...styles.sectionTitle, color: accentColor || "#fff" }}>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function TelaAdmin({
  equipes, atletas, inscricoes, setTela, eventos, selecionarEvento,
  excluirEvento, limparTodosDados, organizadores, adicionarOrganizador,
  aprovarOrganizador, recusarOrganizador, aprovarEvento, recusarEvento,
  solicitacoesRecuperacao, resolverSolicitacaoRecuperacao, aplicarSenhaTemp,
  exportarDados, importarDados, usuarioLogado, excluirAtleta,
  siteBranding, setSiteBranding, gtIcon, gtLogo, historicoAcoes,
  atletasUsuarios=[], funcionarios=[], treinadores=[],
}) {
  const pendOrg = organizadores.filter(o => o.status === "pendente");
  const pendEv  = eventos.filter(e => e.statusAprovacao === "pendente");
  const pendRec = (solicitacoesRecuperacao || []).filter(s => s.status === "pendente");

  if (usuarioLogado?.tipo !== "admin") return (
    <div style={styles.page}><div style={styles.emptyState}>
      <span style={{ fontSize: 48 }}>🚫</span>
      <p style={{ color: "#ff6b6b", fontWeight: 700 }}>Acesso restrito ao administrador</p>
      <button style={styles.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
    </div></div>
  );

  const [buscaOrg,  setBuscaOrg]  = useState("");
  const [buscaComp, setBuscaComp] = useState("");
  const [buscaEq,   setBuscaEq]   = useState("");
  const [buscaAtl,  setBuscaAtl]  = useState("");
  const [buscaHist, setBuscaHist] = useState("");
  const searchInput = { ...styles.input, padding:"6px 12px", fontSize:12, marginBottom:10, maxWidth:360 };

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.painelHeader}>
        <h1 style={styles.pageTitle}>⚙️ Administração</h1>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button style={styles.btnSecondary} onClick={() => setTela("gerenciar-usuarios")}>👥 Usuários</button>
          <button style={styles.btnSecondary} onClick={() => setTela("gerenciar-equipes")}>🏅 Equipes</button>
          <button style={styles.btnSecondary} onClick={() => setTela("gerenciar-inscricoes")}>📋 Inscrições</button>
          <button style={styles.btnSecondary} onClick={() => setTela("auditoria")}>🔍 Auditoria</button>
        </div>
      </div>

      {/* Alerta pendências */}
      {(pendOrg.length > 0 || pendEv.length > 0 || pendRec.length > 0) && (
        <div style={{ background:"#1a1500", border:"1px solid #1976D266", borderRadius:10,
          padding:"12px 18px", marginBottom:20, display:"flex", gap:20, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ color:"#1976D2", fontWeight:800, fontSize:13 }}>⚠️ PENDÊNCIAS</span>
          {pendOrg.length > 0 && <span style={{ color:"#aaa", fontSize:13 }}>🏟️ <strong style={{ color:"#1976D2" }}>{pendOrg.length}</strong> organizador(es)</span>}
          {pendEv.length  > 0 && <span style={{ color:"#aaa", fontSize:13 }}>📋 <strong style={{ color:"#1976D2" }}>{pendEv.length}</strong> competição(ões)</span>}
          {pendRec.length > 0 && <span style={{ color:"#aaa", fontSize:13 }}>🔑 <strong style={{ color:"#1976D2" }}>{pendRec.length}</strong> senha(s)</span>}
        </div>
      )}

      {/* Stats */}
      <div style={styles.statsRow}>
        <StatCard value={eventos.length}       label="Competições" />
        <StatCard value={organizadores.length} label="Organizadores" />
        <StatCard value={equipes.length}       label="Equipes" />
        <StatCard value={atletas.length}       label="Atletas" />
        <StatCard value={inscricoes.length}    label="Inscrições" />
      </div>

      {/* Recuperação de Senha */}
      {pendRec.length > 0 && (
        <SectionCard title="🔑 Solicitações de Recuperação de Senha" accentColor="#7cfc7c">
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead><tr>
                <Th>Usuário</Th><Th>Perfil</Th><Th>E-mail</Th><Th>CPF</Th><Th>Data</Th><Th>Senha Temp.</Th><Th>Ação</Th>
              </tr></thead>
              <tbody>
                {pendRec.map(sol => {
                  const LABEL = { equipe:"🎽 Equipe", organizador:"🏟️ Org.", atleta:"🏃 Atleta" };
                  return (
                    <tr key={sol.id} style={styles.tr}>
                      <Td><strong style={{ color:"#fff" }}>{sol.nome}</strong></Td>
                      <Td style={{ fontSize:12 }}>{LABEL[sol.tipo]||sol.tipo}</Td>
                      <Td style={{ fontSize:12 }}>{sol.email}</Td>
                      <Td style={{ fontSize:11, color:"#aaa" }}>{sol.cpf||"—"}</Td>
                      <Td style={{ fontSize:11, color:"#666" }}>{new Date(sol.data).toLocaleString("pt-BR")}</Td>
                      <Td>
                        <span style={{ fontFamily:"monospace", background:"#0a0b0e", border:"1px solid #1976D266",
                          color:"#1976D2", padding:"2px 10px", borderRadius:4, fontWeight:700, letterSpacing:2, fontSize:13 }}>
                          {sol.senhaTemp}
                        </span>
                      </Td>
                      <Td>
                        <button onClick={async () => {
                          await aplicarSenhaTemp(sol.tipo, sol.userId, sol.senhaTemp, sol);
                          resolverSolicitacaoRecuperacao(sol.id);
                        }} style={{ ...styles.btnGhost, fontSize:12, padding:"4px 14px", color:"#7cfc7c", borderColor:"#2a5a2a" }}>
                          ✓ Enviar Senha
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize:11, color:"#555", marginTop:8 }}>
            Ao clicar em "Enviar Senha", a senha temporária é aplicada. O usuário deverá criar uma nova senha no próximo login.
          </div>
        </SectionCard>
      )}

      {/* Organizadores */}
      {(() => {
        const [showForm, setShowForm] = React.useState(false);
        const [form, setForm] = React.useState({ nome:"", email:"", senha:"", entidade:"", fone:"", cnpj:"" });
        const [erros, setErros] = React.useState({});
        const [salvo, setSalvo] = React.useState(false);

        const handleCriar = async () => {
          const e = {};
          if (!form.nome)     e.nome = "Nome obrigatório";
          if (!form.email)    e.email = "E-mail obrigatório";
          if (form.senha.length < 6) e.senha = "Mínimo 6 caracteres";
          if (!form.entidade) e.entidade = "Entidade obrigatória";
          if (!form.cnpj)     e.cnpj = "CNPJ obrigatório";
          else if (!validarCNPJ(form.cnpj)) e.cnpj = "CNPJ inválido";
          if (emailJaCadastrado(form.email, { organizadores, equipes, atletasUsuarios, funcionarios, treinadores })) e.email = "E-mail já cadastrado";
          if (organizadores.some(o => o.cnpj && form.cnpj && o.cnpj.replace(/\D/g,"") === form.cnpj.replace(/\D/g,""))) e.cnpj = "CNPJ já cadastrado";
          if (Object.keys(e).length) { setErros(e); return; }
          try { await createUserWithEmailAndPassword(auth, form.email.trim(), form.senha); } catch(err) {}
          await firebaseSignOut(auth).catch(() => {});
          adicionarOrganizador({ ...form, id: Date.now().toString(), status:"aprovado", dataCadastro: new Date().toISOString(), tipo:"organizador" });
          setForm({ nome:"", email:"", senha:"", entidade:"", fone:"", cnpj:"" });
          setErros({}); setSalvo(true); setTimeout(() => setSalvo(false), 3000); setShowForm(false);
        };

        return (
          <SectionCard
            title={`🏟️ Organizadores (${organizadores.length})`}
            action={
              <button onClick={() => { setShowForm(!showForm); setErros({}); }}
                style={{ ...styles.btnPrimary, fontSize:12, padding:"6px 16px" }}>
                {showForm ? "✕ Cancelar" : "+ Novo Organizador"}
              </button>
            }>

            {salvo && <div style={{ background:"#0a2a0a", border:"1px solid #2a5a2a", borderRadius:8,
              padding:"8px 14px", marginBottom:12, color:"#7cfc7c", fontSize:13 }}>
              ✅ Organizador criado com sucesso!
            </div>}

            {showForm && (
              <div style={{ background:"#0a0c14", border:"1px solid #252837", borderRadius:10,
                padding:"16px 18px", marginBottom:16 }}>
                <div style={styles.grid2form}>
                  <FormField label="Nome Completo *"        value={form.nome}     onChange={v=>setForm({...form,nome:v})}     error={erros.nome} />
                  <FormField label="Entidade / Federação *" value={form.entidade} onChange={v=>setForm({...form,entidade:v})} error={erros.entidade} />
                  <FormField label="E-mail *"               value={form.email}    onChange={v=>setForm({...form,email:v})}    type="email" error={erros.email} />
                  <FormField label="Telefone"               value={form.fone}     onChange={v=>setForm({...form,fone:v})} />
                  <FormField label="Senha *"                value={form.senha}    onChange={v=>setForm({...form,senha:v})}    type="password" error={erros.senha} />
                  <FormField label="CNPJ *"                 value={form.cnpj}     onChange={v=>setForm({...form,cnpj:v})}     placeholder="00.000.000/0001-00" error={erros.cnpj} />
                </div>
                <div style={{ display:"flex", gap:8, marginTop:8 }}>
                  <button onClick={handleCriar} style={styles.btnPrimary}>✅ Criar Organizador (aprovado)</button>
                  <button onClick={() => setShowForm(false)} style={styles.btnGhost}>Cancelar</button>
                </div>
              </div>
            )}

            <input type="text" value={buscaOrg} onChange={e=>setBuscaOrg(e.target.value)}
              placeholder="🔍 Buscar organizador..." style={searchInput} />
            <div style={styles.tableWrap}>
              <div style={styles.scrollBox}>
                <table style={styles.table}>
                  <thead><tr>
                    <Th>Nome</Th><Th>Entidade</Th><Th>E-mail</Th><Th>CNPJ</Th><Th>Cadastro</Th><Th>Status</Th><Th>Ações</Th>
                  </tr></thead>
                  <tbody>
                    {organizadores.filter(o => {
                      if (!buscaOrg) return true;
                      const b = buscaOrg.toLowerCase();
                      return (o.nome||"").toLowerCase().includes(b)||(o.entidade||"").toLowerCase().includes(b)||(o.email||"").toLowerCase().includes(b);
                    }).map((o, i) => {
                      const bs = badgeStatus(o.status || "pendente");
                      return (
                        <tr key={`org_${o.id}_${i}`} style={{ ...styles.tr, opacity: o.status==="recusado" ? 0.5 : 1 }}>
                          <Td><strong style={{ color:"#fff" }}>{o.nome}</strong></Td>
                          <Td style={{ fontSize:12 }}>{o.entidade}</Td>
                          <Td style={{ fontSize:12 }}>{o.email}</Td>
                          <Td style={{ fontSize:11 }}>{o.cnpj||"—"}</Td>
                          <Td style={{ fontSize:11, color:"#666" }}>{o.dataCadastro ? new Date(o.dataCadastro).toLocaleDateString("pt-BR") : "—"}</Td>
                          <Td>
                            <span style={{ background:bs.bg, color:bs.color, padding:"3px 10px", borderRadius:4, fontSize:11, fontWeight:700 }}>
                              {bs.label}
                            </span>
                          </Td>
                          <Td>
                            <div style={{ display:"flex", gap:6 }}>
                              {o.status !== "aprovado" && (
                                <button onClick={() => aprovarOrganizador(o.id)}
                                  style={{ ...styles.btnGhost, fontSize:11, padding:"3px 12px", color:"#7cfc7c", borderColor:"#2a5a2a" }}>✓ Aprovar</button>
                              )}
                              {o.status !== "recusado" && (
                                <button onClick={() => recusarOrganizador(o.id)}
                                  style={{ ...styles.btnGhost, fontSize:11, padding:"3px 12px", color:"#ff6b6b", borderColor:"#5a1a1a" }}>✗ Recusar</button>
                              )}
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        );
      })()}

      {/* Competições Pendentes */}
      {pendEv.length > 0 && (
        <SectionCard title={`📋 Competições Aguardando Aprovação (${pendEv.length})`} accentColor="#1976D2">
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead><tr>
                <Th>Competição</Th><Th>Organizador</Th><Th>Data</Th><Th>Local</Th><Th>Provas</Th><Th>Ações</Th>
              </tr></thead>
              <tbody>
                {pendEv.map(ev => {
                  const org = organizadores.find(o => o.id === ev.organizadorId);
                  return (
                    <tr key={`pend_${ev.id}`} style={styles.tr}>
                      <Td><strong style={{ color:"#1976D2" }}>{ev.nome}</strong></Td>
                      <Td style={{ fontSize:12 }}>{org ? `${org.nome} — ${org.entidade}` : "—"}</Td>
                      <Td style={{ fontSize:12 }}>{new Date(ev.data+"T12:00:00").toLocaleDateString("pt-BR")}</Td>
                      <Td style={{ fontSize:12 }}>{_getLocalEventoDisplay(ev)}</Td>
                      <Td>{ev.provasPrograma?.length||0}</Td>
                      <Td>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          <button onClick={() => {selecionarEvento(ev.id);setTela("evento-detalhe");}}
                            style={{ ...styles.btnGhost, fontSize:11, padding:"3px 10px" }}>Ver</button>
                          <button onClick={() => {selecionarEvento(ev.id);setTela("novo-evento");}}
                            style={{ ...styles.btnGhost, fontSize:11, padding:"3px 10px", color:"#88aaff", borderColor:"#88aaff66" }}>⚙️ Editar</button>
                          <button onClick={() => aprovarEvento(ev.id)}
                            style={{ ...styles.btnGhost, fontSize:11, padding:"3px 12px", color:"#7cfc7c", borderColor:"#2a5a2a" }}>✓ Aprovar</button>
                          <button onClick={() => recusarEvento(ev.id)}
                            style={{ ...styles.btnGhost, fontSize:11, padding:"3px 12px", color:"#ff6b6b", borderColor:"#5a1a1a" }}>✗ Recusar</button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Grid 2 colunas */}
      <div style={styles.adminGrid}>

        {/* Todas as Competições */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.sectionTitle}>🏟 Todas as Competições</h2>
            <button style={{ ...styles.btnPrimary, fontSize:12, padding:"6px 14px" }}
              onClick={() => { selecionarEvento(null); setTela("novo-evento"); }}>+ Nova</button>
          </div>
          <input type="text" value={buscaComp} onChange={e=>setBuscaComp(e.target.value)}
            placeholder="🔍 Buscar..." style={searchInput} />
          {eventos.length === 0 ? (
            <div style={styles.emptyState}>Nenhuma competição.</div>
          ) : (
            <div style={{ maxHeight:340, overflowY:"auto", display:"flex", flexDirection:"column", gap:8 }}>
              {eventos.filter(ev => {
                if (!buscaComp) return true;
                const b = buscaComp.toLowerCase();
                return (ev.nome||"").toLowerCase().includes(b)||(_getLocalEventoDisplay(ev)||"").toLowerCase().includes(b);
              }).map(ev => {
                const nInscs = inscricoes.filter(i => i.eventoId===ev.id).length;
                const bs = badgeStatus(ev.statusAprovacao || "aprovado");
                return (
                  <div key={`all_${ev.id}`} style={{ background:"#0a0c14", border:"1px solid #1a1d2a", borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                      {ev.logoCompeticao && <img src={ev.logoCompeticao} alt="" style={{ width:22, height:22, objectFit:"contain", borderRadius:3 }} />}
                      <strong style={{ color:"#fff", fontSize:13, flex:1 }}>{ev.nome}</strong>
                      <span style={{ background:bs.bg, color:bs.color, fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:3 }}>{bs.label}</span>
                    </div>
                    <div style={{ color:"#555", fontSize:11, marginBottom:6 }}>
                      {new Date(ev.data+"T12:00:00").toLocaleDateString("pt-BR")} · {_getLocalEventoDisplay(ev)} · {nInscs} insc.
                    </div>
                    <div style={{ display:"flex", gap:5 }}>
                      <button style={{ ...styles.btnSecondary, fontSize:11, padding:"3px 10px" }}
                        onClick={() => { selecionarEvento(ev.id); setTela("evento-detalhe"); }}>Acessar</button>
                      <button style={{ ...styles.btnGhost, fontSize:11, padding:"3px 10px" }}
                        onClick={() => { selecionarEvento(ev.id); setTela("novo-evento"); }}>✏️</button>
                      <button style={{ ...styles.btnGhost, fontSize:11, padding:"3px 9px", color:"#ff6b6b", borderColor:"#3a1a1a" }}
                        onClick={() => excluirEvento(ev.id)}>🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ações Rápidas */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.sectionTitle}>🚀 Ações Rápidas</h2>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-start" }}>
            <button style={styles.btnPrimary} onClick={() => { selecionarEvento(null); setTela("novo-evento"); }}>🏟 Criar Competição</button>
            <button style={styles.btnSecondary} onClick={() => setTela("cadastrar-atleta")}>🏃 Atletas</button>
            <button style={styles.btnSecondary} onClick={() => setTela("importar-atletas")}>📊 Importar Planilha</button>
            <button style={styles.btnSecondary} onClick={() => setTela("gerenciar-equipes")}>🏅 Equipes</button>
            <button style={styles.btnSecondary} onClick={() => setTela("gerenciar-usuarios")}>👥 Gerenciar Usuários</button>
            <button style={styles.btnGhost} onClick={() => setTela("home")}>🗓 Ver Competições</button>
            <div style={{ borderTop:"1px solid #1E2130", width:"100%", marginTop:4, paddingTop:10 }}>
              <button style={{ ...styles.btnGhost, color:"#ff6b6b", borderColor:"#3a1a1a" }}
                onClick={limparTodosDados}>🗑 Limpar Todos os Dados</button>
            </div>
          </div>
        </div>

        {/* Backup */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.sectionTitle}>💾 Backup e Restauração</h2>
          </div>
          <p style={{ color:"#666", fontSize:12, marginBottom:14, lineHeight:1.6 }}>
            Exporte os dados para proteger suas informações ou transferir para outro ambiente.
          </p>
          <div style={{ background:"#0a0f0a", border:"1px solid #2a3a2a", borderRadius:8, padding:"12px 14px", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ fontSize:18 }}>📤</span>
              <div>
                <div style={{ color:"#7cfc7c", fontWeight:700, fontSize:12 }}>Exportar Backup</div>
                <div style={{ color:"#555", fontSize:11 }}>Baixa um arquivo .json com todos os dados</div>
              </div>
            </div>
            <button style={{ ...styles.btnGhost, color:"#7cfc7c", borderColor:"#2a5a2a", width:"100%", fontSize:12 }}
              onClick={exportarDados}>⬇️ Baixar Backup Agora</button>
          </div>
          <div style={{ background:"#0a0a1a", border:"1px solid #2a2a4a", borderRadius:8, padding:"12px 14px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ fontSize:18 }}>📥</span>
              <div>
                <div style={{ color:"#88aaff", fontWeight:700, fontSize:12 }}>Restaurar Backup</div>
                <div style={{ color:"#555", fontSize:11 }}>Carrega um arquivo .json deste sistema</div>
              </div>
            </div>
            <label style={{ display:"block", cursor:"pointer" }}>
              <div style={{ border:"1px solid #3a3a6a", color:"#88aaff", fontSize:12,
                textAlign:"center", padding:"7px 12px", borderRadius:6, cursor:"pointer" }}>
                📂 Selecionar Arquivo de Backup
              </div>
              <input type="file" accept=".json" style={{ display:"none" }}
                onChange={e => { if (e.target.files[0]) importarDados(e.target.files[0]); e.target.value=""; }} />
            </label>
            <div style={{ marginTop:8, fontSize:11, color:"#888" }}>
              ⚠️ Importar substitui todos os dados atuais.
            </div>
          </div>
        </div>

        {/* Identidade Visual */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.sectionTitle}>🎨 Identidade Visual</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            <div style={{ background:"#0a0b10", border:"1px solid #1a1d2a", borderRadius:8, padding:"10px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <img src={gtIcon} alt="" style={{ width:36, height:36, objectFit:"contain", borderRadius:5 }} />
                <div>
                  <div style={{ fontWeight:700, fontSize:12, color:"#fff" }}>Ícone</div>
                  <div style={{ fontSize:10, color:"#555" }}>48×48px</div>
                </div>
              </div>
              <label style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px",
                background:"#1a2a3a", border:"1px solid #2a4a6a", borderRadius:5, cursor:"pointer", fontSize:11, color:"#88aaff" }}>
                📁 Trocar
                <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }}
                  onChange={e => {
                    const f = e.target.files?.[0]; if (!f) return;
                    if (f.size > 300*1024) { alert("Máx. 300KB"); return; }
                    const r = new FileReader(); r.onload = ev => setSiteBranding({...siteBranding, icon: ev.target.result}); r.readAsDataURL(f);
                  }} />
              </label>
              {siteBranding.icon && <button style={{ fontSize:10, color:"#888", background:"transparent", border:"none", cursor:"pointer", marginLeft:4 }} onClick={() => setSiteBranding({...siteBranding,icon:""})}>↩ Padrão</button>}
            </div>
            <div style={{ background:"#0a0b10", border:"1px solid #1a1d2a", borderRadius:8, padding:"10px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <img src={gtLogo} alt="" style={{ height:28, objectFit:"contain", background:"#fff", padding:2, borderRadius:3 }} />
                <div>
                  <div style={{ fontWeight:700, fontSize:12, color:"#fff" }}>Logo</div>
                  <div style={{ fontSize:10, color:"#555" }}>300×120px</div>
                </div>
              </div>
              <label style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px",
                background:"#1a2a3a", border:"1px solid #2a4a6a", borderRadius:5, cursor:"pointer", fontSize:11, color:"#88aaff" }}>
                📁 Trocar
                <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }}
                  onChange={e => {
                    const f = e.target.files?.[0]; if (!f) return;
                    if (f.size > 300*1024) { alert("Máx. 300KB"); return; }
                    const r = new FileReader(); r.onload = ev => setSiteBranding({...siteBranding, logo: ev.target.result}); r.readAsDataURL(f);
                  }} />
              </label>
              {siteBranding.logo && <button style={{ fontSize:10, color:"#888", background:"transparent", border:"none", cursor:"pointer", marginLeft:4 }} onClick={() => setSiteBranding({...siteBranding,logo:""})}>↩ Padrão</button>}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:10 }}>
            <div>
              <label style={styles.label}>Nome do Site</label>
              <input style={styles.input} value={siteBranding.nome||""} placeholder="GERENTRACK"
                onChange={e => setSiteBranding({...siteBranding, nome: e.target.value.toUpperCase()})} />
            </div>
            <div>
              <label style={styles.label}>Slogan</label>
              <input style={styles.input} value={siteBranding.slogan||""} placeholder="COMPETIÇÃO COM PRECISÃO"
                onChange={e => setSiteBranding({...siteBranding, slogan: e.target.value.toUpperCase()})} />
            </div>
          </div>
          <div style={{ padding:"10px 14px", background:"linear-gradient(90deg,#0D0E12,#141720)", borderRadius:8, border:"1px solid #1E2130" }}>
            <div style={{ fontSize:10, color:"#555", marginBottom:5 }}>Preview:</div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <img src={gtIcon} alt="" style={{ width:28, height:28, objectFit:"contain", borderRadius:4 }} />
              <div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:900, color:"#1976D2", letterSpacing:2 }}>{siteBranding.nome||"GERENTRACK"}</div>
                <div style={{ fontSize:10, color:"#666" }}>{siteBranding.slogan||"COMPETIÇÃO COM PRECISÃO"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Equipes */}
      <SectionCard title={`🏅 Equipes Cadastradas (${equipes.length})`}>
        {equipes.length === 0 ? (
          <div style={styles.emptyState}>Nenhuma equipe cadastrada.</div>
        ) : (
          <>
            <input type="text" value={buscaEq} onChange={e=>setBuscaEq(e.target.value)}
              placeholder="🔍 Buscar equipe..." style={searchInput} />
            <div style={styles.tableWrap}>
              <div style={styles.scrollBox}>
                <table style={styles.table}>
                  <thead><tr><Th>Nome</Th><Th>Sigla</Th><Th>E-mail</Th><Th>CNPJ</Th><Th>Cidade</Th><Th>Organizador</Th><Th>Atletas</Th></tr></thead>
                  <tbody>
                    {equipes.filter(t => {
                      if (!buscaEq) return true;
                      const b = buscaEq.toLowerCase();
                      return (t.nome||"").toLowerCase().includes(b)||(t.sigla||"").toLowerCase().includes(b)||(t.cidade||"").toLowerCase().includes(b);
                    }).map(t => {
                      const org = organizadores.find(o => o.id === t.organizadorId);
                      return (
                        <tr key={`eq_${t.id}`} style={styles.tr}>
                          <Td><strong style={{ color:"#fff" }}>{t.nome}</strong></Td>
                          <Td style={{ fontSize:12 }}>{t.sigla||"—"}</Td>
                          <Td style={{ fontSize:12 }}>{t.email||"—"}</Td>
                          <Td style={{ fontSize:11 }}>{t.cnpj||"—"}</Td>
                          <Td style={{ fontSize:12 }}>{t.cidade ? `${t.cidade}/${t.estado||""}` : "—"}</Td>
                          <Td>{org ? <span style={{ color:"#1976D2", fontSize:12 }}>{org.entidade||org.nome}</span> : <span style={{ color:"#555", fontSize:12 }}>Sem vínculo</span>}</Td>
                          <Td><span style={styles.marca}>{atletas.filter(a => a.equipeId===t.id).length}</span></Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      {/* Atletas */}
      <SectionCard title={`🏃 Todos os Atletas (${atletas.length})`}>
        {atletas.length === 0 ? (
          <div style={styles.emptyState}>Nenhum atleta cadastrado.</div>
        ) : (
          <>
            <input type="text" value={buscaAtl} onChange={e=>setBuscaAtl(e.target.value)}
              placeholder="🔍 Buscar atleta..." style={searchInput} />
            <div style={styles.tableWrap}>
              <div style={styles.scrollBox}>
                <table style={styles.table}>
                  <thead><tr><Th>Nome</Th><Th>Sexo</Th><Th>Nasc.</Th><Th>Equipe</Th><Th>Inscrições</Th><Th>Ações</Th></tr></thead>
                  <tbody>
                    {atletas.filter(a => {
                      if (!buscaAtl) return true;
                      const b = buscaAtl.toLowerCase();
                      const eq = equipes.find(t => t.id === a.equipeId);
                      return (a.nome||"").toLowerCase().includes(b)||(eq?.nome||"").toLowerCase().includes(b);
                    }).map(a => {
                      const eq = equipes.find(t => t.id === a.equipeId);
                      const ninsc = inscricoes.filter(i => i.atletaId===a.id).length;
                      return (
                        <tr key={`atl_${a.id}`} style={styles.tr}>
                          <Td><strong style={{ color:"#fff" }}>{a.nome}</strong></Td>
                          <Td><span style={styles.badge(a.sexo==="M"?"#1a6ef5":"#e54f9b")}>{a.sexo==="M"?"Masc":"Fem"}</span></Td>
                          <Td style={{ fontSize:12 }}>{_getNascDisplay(a)||"—"}</Td>
                          <Td style={{ fontSize:12 }}>{eq?.nome||<span style={{ color:"#555" }}>Avulso</span>}</Td>
                          <Td><span style={styles.marca}>{ninsc}</span></Td>
                          <Td>
                            <div style={{ display:"flex", gap:5 }}>
                              <button onClick={() => { window.__atletaEditId = a.id; setTela("editar-atleta"); }}
                                style={{ ...styles.btnGhost, fontSize:11, padding:"3px 12px" }}>✏️ Editar</button>
                              <button onClick={() => { if (window.confirm(`Excluir ${a.nome}?`)) excluirAtleta(a.id); }}
                                style={{ ...styles.btnGhost, fontSize:11, padding:"3px 10px", color:"#ff6b6b", borderColor:"#5a1a1a" }}>🗑</button>
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      {/* Histórico */}
      <SectionCard title="📊 Histórico de Ações">
        {(() => {
          const todas = historicoAcoes || [];
          const filtradas = todas.filter(h => {
            if (!buscaHist) return true;
            const b = buscaHist.toLowerCase();
            return (h.nomeUsuario||"").toLowerCase().includes(b)||(h.acao||"").toLowerCase().includes(b)||(h.detalhe||"").toLowerCase().includes(b);
          });
          return filtradas.length === 0 && todas.length === 0 ? (
            <div style={styles.emptyState}>Nenhuma ação registrada.</div>
          ) : (
            <>
              <input type="text" value={buscaHist} onChange={e=>setBuscaHist(e.target.value)}
                placeholder="🔍 Buscar ação, usuário, módulo..." style={searchInput} />
              <div style={styles.tableWrap}>
                <div style={styles.scrollBox}>
                  <table style={styles.table}>
                    <thead><tr><Th>Data/Hora</Th><Th>Usuário</Th><Th>Ação</Th><Th>Detalhe</Th><Th>Módulo</Th></tr></thead>
                    <tbody>
                      {filtradas.map((h, idx) => (
                        <tr key={`h_${h.id}_${idx}`} style={styles.tr}>
                          <Td style={{ fontSize:11, color:"#666", whiteSpace:"nowrap" }}>
                            {new Date(h.data).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"})}
                          </Td>
                          <Td><span style={{ color:"#1976D2", fontSize:12 }}>{h.nomeUsuario||"—"}</span></Td>
                          <Td><strong style={{ color:"#fff", fontSize:12 }}>{h.acao}</strong></Td>
                          <Td style={{ fontSize:12, color:"#888" }}>{h.detalhe||"—"}</Td>
                          <Td><span style={{ color:"#555", fontSize:10 }}>{h.modulo||"—"}</span></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{ color:"#555", fontSize:11, textAlign:"center", marginTop:8 }}>
                {filtradas.length} de {todas.length} ações · Máx. 2000 registros
              </div>
            </>
          );
        })()}
      </SectionCard>

    </div>
  );
}

export default TelaAdmin;
