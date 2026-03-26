import React, { useState } from "react";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";

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

function TelaAuditoria() {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { usuarioLogado } = useAuth();
  const { setTela, historicoAcoes } = useApp();
  const { equipe } = usuarioLogado;
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');

  const auditoriaEquipe = (historicoAcoes || [])
    .filter(a => a.equipeId === equipe?.id)
    .sort((a, b) => new Date(b.data) - new Date(a.data));

  const agora = new Date();
  const auditoriaFiltrada = auditoriaEquipe.filter(registro => {
    const dataRegistro = new Date(registro.data);
    switch(filtro) {
      case 'hoje': return dataRegistro.toDateString() === agora.toDateString();
      case 'semana': { const d = new Date(agora); d.setDate(agora.getDate() - 7); return dataRegistro >= d; }
      case 'mes': { const d = new Date(agora); d.setMonth(agora.getMonth() - 1); return dataRegistro >= d; }
      default: return true;
    }
  }).filter(registro => {
    if (!busca) return true;
    const b = busca.toLowerCase();
    return (registro.nomeUsuario?.toLowerCase().includes(b) || registro.acao?.toLowerCase().includes(b) || registro.detalhe?.toLowerCase().includes(b) || registro.modulo?.toLowerCase().includes(b));
  });

  const formatarDataHora = (ts) => {
    const data = new Date(ts);
    const hoje = new Date();
    const horaStr = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (data.toDateString() === hoje.toDateString()) return `Hoje às ${horaStr}`;
    const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
    if (data.toDateString() === ontem.toDateString()) return `Ontem às ${horaStr}`;
    return `${data.toLocaleDateString("pt-BR")} às ${horaStr}`;
  };

  const getModuloIcon = (mod) => ({ equipes:"🏢", atletas:"🏃", competicoes:"🏟️", inscricoes:"📝", resultados:"📊", sumulas:"📋", recordes:"🏆", numeracao:"🔢", membros:"👥", treinadores:"👨‍🏫", funcionarios:"👷", auth:"🔐", sistema:"⚙️" }[mod] || "📋");

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>📊 Auditoria de Ações</h1>
          <p style={{ color: t.textDimmed, fontSize: 14 }}>Histórico de ações da equipe {equipe?.nome}</p>
        </div>
        <button style={s.btnGhost} onClick={() => setTela('painel-equipe')}>← Voltar</button>
      </div>
      <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:12, padding:24, marginBottom:24 }}>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ flex:"1 1 300px" }}>
            <label style={{ display:"block", color: t.textTertiary, fontSize:13, marginBottom:8 }}>Período:</label>
            <div style={{ display:"flex", gap:8 }}>
              {[{ id:"todos", label:"Todos" },{ id:"hoje", label:"Hoje" },{ id:"semana", label:"7 dias" },{ id:"mes", label:"30 dias" }].map(o => (
                <button key={o.id} onClick={() => setFiltro(o.id)} style={{ padding:"8px 16px", background: filtro===o.id ? t.accent : t.bgInput, color: filtro===o.id ? "#fff" : t.textTertiary, border:`1px solid ${filtro===o.id ? t.accent : t.border}`, borderRadius:6, cursor:"pointer", fontSize:13, fontWeight: filtro===o.id ? 600 : 400 }}>{o.label}</button>
              ))}
            </div>
          </div>
          <div style={{ flex:"1 1 300px" }}>
            <label style={{ display:"block", color: t.textTertiary, fontSize:13, marginBottom:8 }}>Buscar:</label>
            <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por usuário, ação ou detalhe..." style={s.input} />
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:16, marginTop:20, paddingTop:20, borderTop:`1px solid ${t.border}` }}>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:32, fontWeight:700, color: t.accent }}>{auditoriaFiltrada.length}</div><div style={{ color: t.textMuted, fontSize:12 }}>Registros</div></div>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:32, fontWeight:700, color: t.success }}>{new Set(auditoriaFiltrada.map(a => a.nomeUsuario)).size}</div><div style={{ color: t.textMuted, fontSize:12 }}>Usuários</div></div>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:32, fontWeight:700, color: t.accent }}>{new Set(auditoriaFiltrada.map(a => a.modulo).filter(Boolean)).size}</div><div style={{ color: t.textMuted, fontSize:12 }}>Módulos</div></div>
        </div>
      </div>
      <div style={{ display:"grid", gap:8 }}>
        {auditoriaFiltrada.length === 0 ? (
          <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:12, padding:60, textAlign:"center" }}>
            <div style={{ fontSize:64, marginBottom:16 }}>📊</div>
            <div style={{ color: t.textTertiary, fontSize:16 }}>Nenhum registro encontrado</div>
          </div>
        ) : auditoriaFiltrada.map(reg => (
          <div key={reg.id} style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:"12px 16px", display:"flex", gap:12, alignItems:"center" }}>
            <span style={{ fontSize:20, flexShrink:0 }}>{getModuloIcon(reg.modulo)}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color: t.textPrimary, fontSize:13, fontWeight:600 }}>{reg.acao}</div>
              {reg.detalhe && <div style={{ color: t.textMuted, fontSize:11, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{reg.detalhe}</div>}
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ color: t.accent, fontSize:11, fontWeight:600 }}>{reg.nomeUsuario || "—"}</div>
              <div style={{ color: t.textDimmed, fontSize:10 }}>{formatarDataHora(reg.data)}</div>
            </div>
            {reg.modulo && <span style={{ padding:"2px 8px", borderRadius:4, fontSize:9, background:t.bgInput, color: t.textDimmed, border:`1px solid ${t.border}`, flexShrink:0 }}>{reg.modulo}</span>}
          </div>
        ))}
      </div>
      {auditoriaFiltrada.length > 0 && (
        <div style={{ marginTop:24, padding:16, background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, textAlign:"center", color: t.textDimmed, fontSize:12 }}>
          Mostrando {auditoriaFiltrada.length} de {auditoriaEquipe.length} registro(s) · Máximo 500 registros mantidos
        </div>
      )}
    </div>
  );





}
export default TelaAuditoria;
