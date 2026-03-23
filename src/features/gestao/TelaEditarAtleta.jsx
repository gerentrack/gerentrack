import React, { useEffect, useState } from "react";
import { CATEGORIAS, getCategoria } from "../../shared/constants/categorias";
import { _getClubeAtleta, _getNascDisplay, _getCbat, validarCPF } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import { Th, Td } from "../ui/TableHelpers";
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
  radioLabelActive: { background: t.bgHover, border: `1px solid ${t.accent}`, color: t.accent },
  sumuCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  btnIconSm: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textMuted, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: `${t.danger}12`, border: `1px solid ${t.danger}44`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
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
    background: status === "ao_vivo" ? `${t.danger}18` : status === "hoje_pre" ? `${t.accent}18` : status === "futuro" ? `${t.success}18` : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textDisabled,
    border: `1px solid ${status === "ao_vivo" ? `${t.danger}44` : status === "hoje_pre" ? `${t.accent}44` : status === "futuro" ? `${t.success}44` : t.border}`,
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
  provaBtnSel: { background: t.bgHover, borderColor: t.accent, color: t.accent },
  savedBadge: { background: t.bgCardAlt, border: `1px solid ${t.success}44`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  inputMarca: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", color: t.accent, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
};
}

function TelaEditarAtleta({ usuarioLogado, atletas, atualizarAtleta, excluirAtleta,
  inscricoes, eventos, equipes, setTela, notificacoes, marcarNotifLida,
  atletaEditandoId, setAtletaEditandoId }) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));

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
  const isOrg = usuarioLogado?.tipo === "organizador";
  const podeEditar = isAdmin || isEquipe || isOrg ||
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

  const equipeVinculada = atleta ? equipes.find(eq => eq.id === atleta.equipeId) : null;
  const minhasInscricoes = selId
    ? inscricoes.filter(i => i.atletaId === selId).slice(0,5)
    : [];

  // ── LISTA ──────────────────────────────────────────────────────────────────
  if (modo === "lista") return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <h1 style={s.pageTitle}>🏃 Atletas</h1>
        <button style={s.btnGhost} onClick={() => setTela(
          isAtleta ? "painel-atleta" : isEquipe ? "painel-equipe" : "admin")}>← Voltar</button>
      </div>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead><tr>
            <Th>Nome</Th><Th>Sexo</Th><Th>Nasc.</Th><Th>Categoria</Th>
            <Th>Equipe</Th><Th>Equipe (usuário)</Th><Th>CPF</Th><Th>CBAt</Th><Th>Ações</Th>
          </tr></thead>
          <tbody>
            {atletasVisiveis.map(a => {
              const cat = getCategoria(a.anoNasc, anoBase);
              const tren = equipes.find(eq => eq.id === a.equipeId);
              return (
                <tr key={a.id} style={s.tr}>
                  <Td><strong style={{ color: t.textPrimary }}>{a.nome}</strong>
                    {a.desvinculadoEm && (
                      <span style={{ fontSize:10, color: t.textMuted, display:"block" }}>
                        sem equipe desde {new Date(a.desvinculadoEm).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </Td>
                  <Td><span style={s.badge(a.sexo==="M"?"#1a6ef5":"#e54f9b")}>
                    {a.sexo==="M"?"Masc":"Fem"}</span></Td>
                  <Td>{_getNascDisplay(a) || "—"}</Td>
                  <Td><span style={s.badgeGold}>{cat.nome}</span></Td>
                  <Td>{_getClubeAtleta(a, equipes)||<span style={{color: t.textDisabled}}>—</span>}</Td>
                  <Td>{tren?.nome||<span style={{color: t.textDisabled}}>—</span>}</Td>
                  <Td style={{fontSize:11,color: t.textDimmed}}>{a.cpf||"—"}</Td>
                  <Td style={{fontSize:11,color: t.textDimmed}}>{_getCbat(a)||"—"}</Td>
                  <Td>
                    <button onClick={() => abrirAtleta(a.id)}
                      style={{ ...s.btnGhost, fontSize:12, padding:"3px 12px" }}>
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
    <div style={s.page}>
      <button style={s.btnGhost} onClick={() => setModo("lista")}>← Lista</button>
    </div>
  );

  const cat = getCategoria(form.anoNasc, anoBase);

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>
            {modo === "editar" ? "✏️ Editar Atleta" : "👁 Dados do Atleta"}
          </h1>
          <p style={{ color: t.textTertiary, margin:"4px 0 0" }}>{atleta.nome}</p>
        </div>
        <div style={s.painelBtns}>
          {modo === "ver" && podeEditar && (
            <button style={s.btnPrimary} onClick={() => setModo("editar")}>✏️ Editar</button>
          )}
          {modo === "editar" && (
            <>
              <button style={s.btnPrimary} onClick={handleSalvar}>💾 Salvar</button>
              <button style={s.btnGhost}   onClick={() => { setForm({...atleta}); setModo("ver"); }}>Cancelar</button>
            </>
          )}
          {podeExcluir && modo === "ver" && !confirmExcluir && (
            <button onClick={() => setConfirmExcluir(true)}
              style={{ ...s.btnGhost, color: t.danger, borderColor:`${t.danger}66`, fontSize:13 }}>
              🗑 Excluir
            </button>
          )}
          {confirmExcluir && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color: t.danger, fontSize:12 }}>Confirmar exclusão?</span>
              <button onClick={handleExcluir}
                style={{ ...s.btnGhost, color: t.danger, borderColor:`${t.danger}66`, fontSize:12, padding:"4px 12px" }}>
                Sim, excluir
              </button>
              <button onClick={() => setConfirmExcluir(false)}
                style={{ ...s.btnGhost, fontSize:12, padding:"4px 12px" }}>Não</button>
            </div>
          )}
          <button style={s.btnGhost} onClick={() => {
            if (isAtleta) setTela("painel-atleta");
            else if (isOrg || (usuarioLogado?.tipo === "funcionario")) setTela("cadastrar-atleta");
            else setModo("lista");
          }}>← Voltar</button>
        </div>
      </div>

      {salvou && (
        <div style={{ background:`${t.success}10`, border:`1px solid ${t.success}44`, borderRadius:6,
          padding:"10px 16px", marginBottom:16, color:t.success, fontSize:13 }}>
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
              <div key={label} style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`,
                borderRadius:8, padding:"10px 14px" }}>
                <div style={{ color: t.textDimmed, fontSize:11, marginBottom:2 }}>{label}</div>
                <div style={{ color: t.textPrimary, fontSize:14, fontWeight:600 }}>{val}</div>
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
              <label style={s.label}>Sexo</label>
              <div style={s.radioGroup}>
                {[["M","Masculino"],["F","Feminino"]].map(([v,l]) => (
                  <label key={v} style={{...s.radioLabel,...(form.sexo===v?s.radioLabelActive:{})}}>
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
          <h2 style={s.sectionTitle}>Últimas Inscrições</h2>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead><tr>
                <Th>Evento</Th><Th>Prova</Th><Th>Categoria</Th>
                <Th>Equipe (cadastro)</Th><Th>Data</Th>
              </tr></thead>
              <tbody>
                {minhasInscricoes.map(insc => {
                  const ev = eventos.find(e => e.id === insc.eventoId);
                  return (
                    <tr key={insc.id} style={s.tr}>
                      <Td>{ev?.nome||"—"}</Td>
                      <Td style={{fontSize:12}}>{insc.provaId}</Td>
                      <Td><span style={s.badgeGold}>{insc.categoria}</span></Td>
                      <Td style={{fontSize:12, color: t.textMuted}}>
                        {insc.equipeCadastro||"—"}
                      </Td>
                      <Td style={{fontSize:11,color: t.textDimmed}}>
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
