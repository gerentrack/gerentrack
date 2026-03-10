import React, { useEffect, useState } from "react";
import { CATEGORIAS, getCategoria } from "../../shared/athletics/constants";
import { _getClubeAtleta, _getNascDisplay, _getCbat, validarCPF } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import { Th, Td } from "../ui/TableHelpers";

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

function TelaEditarAtleta({ usuarioLogado, atletas, atualizarAtleta, excluirAtleta,
  inscricoes, eventos, equipes, setTela, notificacoes, marcarNotifLida,
  atletaEditandoId, setAtletaEditandoId }) {

  const atletaId = usuarioLogado?.tipo === "atleta"
    ? atletas.find(a => a.cpf && usuarioLogado.cpf &&
        a.cpf.replace(/\D/g,"") === usuarioLogado.cpf.replace(/\D/g,""))?.id
    : null;
  // Admin/equipe passam atletaEditandoId via prop (substituiu window.__atletaEditId)
  const [selId, setSelId] = useState(
    atletaEditandoId || atletaId || ""
  );
  useEffect(() => {
    if (atletaEditandoId) setAtletaEditandoId(null); // limpar após uso
  }, []);

  const atleta = atletas.find(a => a.id === selId);
  const [form, setForm] = useState(atleta ? { ...atleta } : null);
  const [modo, setModo] = useState(atleta ? "ver" : "lista"); // lista|ver|editar
  const [salvou, setSalvou] = useState(false);
  const [confirmExcluir, setConfirmExcluir] = useState(false);
  const anoBase = new Date().getFullYear();

  useEffect(() => {
    if (atleta && !form) setForm({ ...atleta });
    if (atleta && form?.id !== atleta.id) setForm({ ...atleta });
  }, [selId]);

  const isAdmin = usuarioLogado?.tipo === "admin";
  const isEquipe = usuarioLogado?.tipo === "equipe";
  const isAtleta = usuarioLogado?.tipo === "atleta";
  const podeEditar = isAdmin || isEquipe ||
    (usuarioLogado?.tipo === "funcionario" && usuarioLogado?.permissoes?.includes("atletas")) ||
    (isAtleta && selId === atletaId);
  const podeExcluir = isAdmin;

  // Atletas visíveis por perfil
  const atletasVisiveis = isAdmin
    ? atletas
    : isEquipe
    ? atletas.filter(a => a.equipeId === usuarioLogado?.id)
    : isAtleta
    ? atletas.filter(a => a.id === atletaId)
    : atletas;

  const handleSalvar = () => {
    if (form.cpf && !validarCPF(form.cpf)) {
      alert("CPF inválido — verifique os dígitos digitados.");
      return;
    }
    // Verificar duplicata de Nº CBAt (excluindo o próprio atleta)
    if (form.cbat && form.cbat.trim()) {
      const cbatLimpo = form.cbat.trim();
      const cbatDup = atletas.find(a => a.id !== form.id && a.cbat && a.cbat.trim() === cbatLimpo);
      if (cbatDup) { alert(`Nº CBAt "${cbatLimpo}" já cadastrado para ${cbatDup.nome}. Corrija antes de salvar.`); return; }
    }
    atualizarAtleta({ ...form });
    setSalvou(true);
    setModo("ver");
    setTimeout(() => setSalvou(false), 3000);
  };

  const handleExcluir = () => {
    excluirAtleta(selId);
    setSelId("");
    setForm(null);
    setModo("lista");
    setConfirmExcluir(false);
  };

  const abrirAtleta = (id) => {
    const a = atletas.find(x => x.id === id);
    setSelId(id);
    setForm({ ...a });
    setModo("ver");
    setSalvou(false);
  };

  const equipeVinculada = atleta ? equipes.find(t => t.id === atleta.equipeId) : null;
  const minhasInscricoes = selId
    ? inscricoes.filter(i => i.atletaId === selId).slice(0,5)
    : [];

  // ── LISTA ──────────────────────────────────────────────────────────────────
  if (modo === "lista") return (
    <div style={styles.page}>
      <div style={styles.painelHeader}>
        <h1 style={styles.pageTitle}>🏃 Atletas</h1>
        <button style={styles.btnGhost} onClick={() => setTela(
          isAtleta ? "painel-atleta" : isEquipe ? "painel-equipe" : "admin")}>← Voltar</button>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr>
            <Th>Nome</Th><Th>Sexo</Th><Th>Nasc.</Th><Th>Categoria</Th>
            <Th>Equipe</Th><Th>Equipe (usuário)</Th><Th>CPF</Th><Th>CBAt</Th><Th>Ações</Th>
          </tr></thead>
          <tbody>
            {atletasVisiveis.map(a => {
              const cat = getCategoria(a.anoNasc, anoBase);
              const tren = equipes.find(t => t.id === a.equipeId);
              return (
                <tr key={a.id} style={styles.tr}>
                  <Td><strong style={{ color:"#fff" }}>{a.nome}</strong>
                    {a.desvinculadoEm && (
                      <span style={{ fontSize:10, color:"#888", display:"block" }}>
                        sem equipe desde {new Date(a.desvinculadoEm).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </Td>
                  <Td><span style={styles.badge(a.sexo==="M"?"#1a6ef5":"#e54f9b")}>
                    {a.sexo==="M"?"Masc":"Fem"}</span></Td>
                  <Td>{_getNascDisplay(a) || "—"}</Td>
                  <Td><span style={styles.badgeGold}>{cat.nome}</span></Td>
                  <Td>{_getClubeAtleta(a, equipes)||<span style={{color:"#444"}}>—</span>}</Td>
                  <Td>{tren?.nome||<span style={{color:"#444"}}>—</span>}</Td>
                  <Td style={{fontSize:11,color:"#555"}}>{a.cpf||"—"}</Td>
                  <Td style={{fontSize:11,color:"#555"}}>{_getCbat(a)||"—"}</Td>
                  <Td>
                    <button onClick={() => abrirAtleta(a.id)}
                      style={{ ...styles.btnGhost, fontSize:12, padding:"3px 12px" }}>
                      {podeEditar ? "✏️ Ver/Editar" : "👁 Ver"}
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── VER / EDITAR ───────────────────────────────────────────────────────────
  if (!atleta || !form) return (
    <div style={styles.page}>
      <button style={styles.btnGhost} onClick={() => setModo("lista")}>← Lista</button>
    </div>
  );

  const cat = getCategoria(form.anoNasc, anoBase);

  return (
    <div style={styles.page}>
      <div style={styles.painelHeader}>
        <div>
          <h1 style={styles.pageTitle}>
            {modo === "editar" ? "✏️ Editar Atleta" : "👁 Dados do Atleta"}
          </h1>
          <p style={{ color:"#aaa", margin:"4px 0 0" }}>{atleta.nome}</p>
        </div>
        <div style={styles.painelBtns}>
          {modo === "ver" && podeEditar && (
            <button style={styles.btnPrimary} onClick={() => setModo("editar")}>✏️ Editar</button>
          )}
          {modo === "editar" && (
            <>
              <button style={styles.btnPrimary} onClick={handleSalvar}>💾 Salvar</button>
              <button style={styles.btnGhost}   onClick={() => { setForm({...atleta}); setModo("ver"); }}>Cancelar</button>
            </>
          )}
          {podeExcluir && modo === "ver" && !confirmExcluir && (
            <button onClick={() => setConfirmExcluir(true)}
              style={{ ...styles.btnGhost, color:"#ff6b6b", borderColor:"#5a1a1a", fontSize:13 }}>
              🗑 Excluir
            </button>
          )}
          {confirmExcluir && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:"#ff6b6b", fontSize:12 }}>Confirmar exclusão?</span>
              <button onClick={handleExcluir}
                style={{ ...styles.btnGhost, color:"#ff6b6b", borderColor:"#5a1a1a", fontSize:12, padding:"4px 12px" }}>
                Sim, excluir
              </button>
              <button onClick={() => setConfirmExcluir(false)}
                style={{ ...styles.btnGhost, fontSize:12, padding:"4px 12px" }}>Não</button>
            </div>
          )}
          <button style={styles.btnGhost} onClick={() => setModo("lista")}>← Lista</button>
        </div>
      </div>

      {salvou && (
        <div style={{ background:"#0a2a0a", border:"1px solid #2a5a2a", borderRadius:6,
          padding:"10px 16px", marginBottom:16, color:"#7cfc7c", fontSize:13 }}>
          ✅ Dados salvos com sucesso!
        </div>
      )}

      {/* Card de dados */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, maxWidth:700 }}>

        {modo === "ver" ? (
          <>
            {[
              ["Nome Completo", atleta.nome],
              ["Data de Nasc.", atleta.dataNasc
                ? (() => { const [y,m,d]=atleta.dataNasc.split("-"); return `${d}/${m}/${y}`; })()
                : atleta.anoNasc],
              ["Sexo", atleta.sexo==="M"?"Masculino":"Feminino"],
              ["Categoria", cat.nome],
              ["CPF", atleta.cpf||"—"],
              ["Nº CBAt", _getCbat(atleta)||"—"],
              ["Equipe/Clube", _getClubeAtleta(atleta, equipes)||"—"],
              ["Equipe", equipeVinculada?.nome||"—"],
              ["Telefone", atleta.fone||"—"],
            ].map(([label, val]) => (
              <div key={label} style={{ background:"#0d0e12", border:"1px solid #1a1c22",
                borderRadius:8, padding:"10px 14px" }}>
                <div style={{ color:"#555", fontSize:11, marginBottom:2 }}>{label}</div>
                <div style={{ color:"#fff", fontSize:14, fontWeight:600 }}>{val}</div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ gridColumn:"1/-1" }}>
              <FormField label="Nome Completo *" value={form.nome||""}
                onChange={v => setForm({...form, nome:v})} />
            </div>
            <FormField label="Data de Nascimento" value={form.dataNasc||""}
              onChange={v => setForm({...form, dataNasc:v, anoNasc: v?v.split("-")[0]:""})}
              type="date" />
            <div>
              <label style={styles.label}>Sexo</label>
              <div style={styles.radioGroup}>
                {[["M","Masculino"],["F","Feminino"]].map(([v,l]) => (
                  <label key={v} style={{...styles.radioLabel,...(form.sexo===v?styles.radioLabelActive:{})}}>
                    <input type="radio" value={v} checked={form.sexo===v}
                      onChange={() => setForm({...form,sexo:v})} style={{display:"none"}} />{l}
                  </label>
                ))}
              </div>
            </div>
            <FormField label="CPF" value={form.cpf||""} onChange={v => setForm({...form,cpf:v})}
              placeholder="000.000.000-00" />
            <FormField label="Nº CBAt" value={form.cbat||""} onChange={v => setForm({...form,cbat:v})} />
            <FormField label="Telefone" value={form.fone||""} onChange={v => setForm({...form,fone:v})}
              placeholder="(00) 00000-0000" />
          </>
        )}
      </div>

      {/* Últimas inscrições */}
      {minhasInscricoes.length > 0 && (
        <div style={{ marginTop:24 }}>
          <h2 style={styles.sectionTitle}>Últimas Inscrições</h2>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead><tr>
                <Th>Evento</Th><Th>Prova</Th><Th>Categoria</Th>
                <Th>Equipe (cadastro)</Th><Th>Data</Th>
              </tr></thead>
              <tbody>
                {minhasInscricoes.map(insc => {
                  const ev = eventos.find(e => e.id === insc.eventoId);
                  return (
                    <tr key={insc.id} style={styles.tr}>
                      <Td>{ev?.nome||"—"}</Td>
                      <Td style={{fontSize:12}}>{insc.provaId}</Td>
                      <Td><span style={styles.badgeGold}>{insc.categoria}</span></Td>
                      <Td style={{fontSize:12, color:"#888"}}>
                        {insc.equipeCadastro||"—"}
                      </Td>
                      <Td style={{fontSize:11,color:"#555"}}>
                        {new Date(insc.data).toLocaleDateString("pt-BR")}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}



export default TelaEditarAtleta;
