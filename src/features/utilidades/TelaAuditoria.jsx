import React, { useState } from "react";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";

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

function TelaAuditoria({ usuarioLogado, setTela, historicoAcoes }) {
  const s = useStylesResponsivos(styles);
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
          <p style={{ color: '#666', fontSize: 14 }}>Histórico de ações da equipe {equipe?.nome}</p>
        </div>
        <button style={s.btnGhost} onClick={() => setTela('painel-equipe')}>← Voltar</button>
      </div>
      <div style={{ background:"#0D0E12", border:"1px solid #1E2130", borderRadius:12, padding:24, marginBottom:24 }}>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ flex:"1 1 300px" }}>
            <label style={{ display:"block", color:"#aaa", fontSize:13, marginBottom:8 }}>Período:</label>
            <div style={{ display:"flex", gap:8 }}>
              {[{ id:"todos", label:"Todos" },{ id:"hoje", label:"Hoje" },{ id:"semana", label:"7 dias" },{ id:"mes", label:"30 dias" }].map(o => (
                <button key={o.id} onClick={() => setFiltro(o.id)} style={{ padding:"8px 16px", background: filtro===o.id ? "#1976D2" : "#141720", color: filtro===o.id ? "#000" : "#aaa", border:`1px solid ${filtro===o.id ? "#1976D2" : "#1E2130"}`, borderRadius:6, cursor:"pointer", fontSize:13, fontWeight: filtro===o.id ? 600 : 400 }}>{o.label}</button>
              ))}
            </div>
          </div>
          <div style={{ flex:"1 1 300px" }}>
            <label style={{ display:"block", color:"#aaa", fontSize:13, marginBottom:8 }}>Buscar:</label>
            <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por usuário, ação ou detalhe..." style={s.input} />
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:16, marginTop:20, paddingTop:20, borderTop:"1px solid #1E2130" }}>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:32, fontWeight:700, color:"#1976D2" }}>{auditoriaFiltrada.length}</div><div style={{ color:"#888", fontSize:12 }}>Registros</div></div>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:32, fontWeight:700, color:"#7cfc7c" }}>{new Set(auditoriaFiltrada.map(a => a.nomeUsuario)).size}</div><div style={{ color:"#888", fontSize:12 }}>Usuários</div></div>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:32, fontWeight:700, color:"#88aaff" }}>{new Set(auditoriaFiltrada.map(a => a.modulo).filter(Boolean)).size}</div><div style={{ color:"#888", fontSize:12 }}>Módulos</div></div>
        </div>
      </div>
      <div style={{ display:"grid", gap:8 }}>
        {auditoriaFiltrada.length === 0 ? (
          <div style={{ background:"#0D0E12", border:"1px solid #1E2130", borderRadius:12, padding:60, textAlign:"center" }}>
            <div style={{ fontSize:64, marginBottom:16 }}>📊</div>
            <div style={{ color:"#aaa", fontSize:16 }}>Nenhum registro encontrado</div>
          </div>
        ) : auditoriaFiltrada.map(reg => (
          <div key={reg.id} style={{ background:"#0D0E12", border:"1px solid #1E2130", borderRadius:8, padding:"12px 16px", display:"flex", gap:12, alignItems:"center" }}>
            <span style={{ fontSize:20, flexShrink:0 }}>{getModuloIcon(reg.modulo)}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:"#fff", fontSize:13, fontWeight:600 }}>{reg.acao}</div>
              {reg.detalhe && <div style={{ color:"#888", fontSize:11, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{reg.detalhe}</div>}
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ color:"#1976D2", fontSize:11, fontWeight:600 }}>{reg.nomeUsuario || "—"}</div>
              <div style={{ color:"#555", fontSize:10 }}>{formatarDataHora(reg.data)}</div>
            </div>
            {reg.modulo && <span style={{ padding:"2px 8px", borderRadius:4, fontSize:9, background:"#141720", color:"#666", border:"1px solid #1E2130", flexShrink:0 }}>{reg.modulo}</span>}
          </div>
        ))}
      </div>
      {auditoriaFiltrada.length > 0 && (
        <div style={{ marginTop:24, padding:16, background:"#0D0E12", border:"1px solid #1E2130", borderRadius:8, textAlign:"center", color:"#666", fontSize:12 }}>
          Mostrando {auditoriaFiltrada.length} de {auditoriaEquipe.length} registro(s) · Máximo 2000 registros mantidos
        </div>
      )}
    </div>
  );





}
export default TelaAuditoria;
