import authStyles from "./authStyles";
const styles = authStyles;
import React from "react";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";

function TelaSelecaoPerfil({ perfisDisponiveis, loginComSelecao, setTela, logout }) {
  const s = useStylesResponsivos(styles);
  if (!perfisDisponiveis || perfisDisponiveis.length === 0) return (
    <div style={s.formPage}><div style={s.formCard}>
      <div style={{ fontSize:64, textAlign:"center" }}>🔍</div>
      <h2 style={{ ...s.formTitle, textAlign:"center" }}>Nenhum perfil encontrado</h2>
      <p style={{ textAlign:"center", color:"#aaa" }}>Não foram encontrados perfis ativos vinculados à sua conta.</p>
      <button style={s.btnGhost} onClick={() => setTela("login")}>← Voltar ao Login</button>
    </div></div>
  );

  const nome = perfisDisponiveis[0]?.dados?.nome || "Usuário";
  const handleSelecionar = (perfil) => loginComSelecao({ ...perfil.dados, _organizadorNome:perfil.organizadorNome, _temOutrosPerfis:perfisDisponiveis.length > 1 }, perfisDisponiveis);

  const perfisAgrupados = {};
  perfisDisponiveis.forEach(p => {
    const orgKey = p.organizadorNome || "Sem organizador";
    if (!perfisAgrupados[orgKey]) perfisAgrupados[orgKey] = [];
    perfisAgrupados[orgKey].push(p);
  });

  return (
    <div style={s.formPage}>
      <div style={{ ...s.formCard, maxWidth:540 }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>👋</div>
          <h2 style={{ ...s.formTitle, margin:0 }}>Olá, {nome}!</h2>
          <p style={{ color:"#aaa", fontSize:14, marginTop:8 }}>
            Você possui <strong style={{ color:"#1976D2" }}>{perfisDisponiveis.length} perfil(is)</strong> cadastrado(s). Selecione o contexto para esta sessão:
          </p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {Object.entries(perfisAgrupados).map(([orgNome, perfis]) => (
            <div key={orgNome}>
              <div style={{ color:"#888", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:8, paddingLeft:4 }}>🏟️ {orgNome}</div>
              {perfis.map((perfil, idx) => (
                <button key={idx} onClick={() => handleSelecionar(perfil)}
                  style={{ width:"100%", background:"#0D0E12", border:"2px solid #1E2130", borderRadius:10, padding:"16px 20px", cursor:"pointer", display:"flex", alignItems:"center", gap:16, marginBottom:8, textAlign:"left" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="#1976D2"; e.currentTarget.style.background="#0f1118"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="#1E2130"; e.currentTarget.style.background="#0D0E12"; }}
                >
                  <div style={{ width:48, height:48, borderRadius:10, background:"#141720", border:"2px solid #252837", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{perfil.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>{perfil.label}</div>
                    <div style={{ color:"#666", fontSize:12, marginTop:2 }}>{perfil.sublabel}</div>
                  </div>
                  <div style={{ color:"#1976D2", fontSize:18 }}>→</div>
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop:"1px solid #1E2130", marginTop:20, paddingTop:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <button style={s.linkBtn} onClick={() => setTela("login")}>← Voltar ao Login</button>
          <button style={{ ...s.btnGhost, fontSize:12 }} onClick={logout}>Sair</button>
        </div>
      </div>
    </div>
  );
}

export default TelaSelecaoPerfil;
