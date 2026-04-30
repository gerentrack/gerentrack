import { criarAuthStyles } from "./authStyles";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";

function TelaSelecaoPerfil() {
  const navigate = useNavigate();
  const { perfisDisponiveis, loginComSelecao, logout } = useAuth();
  const t = useTema();
  const s = useStylesResponsivos(criarAuthStyles(t));
  if (!perfisDisponiveis || perfisDisponiveis.length === 0) return (
    <div style={s.formPage}><div style={s.formCard}>
      <h2 style={{ ...s.formTitle, textAlign:"center" }}>Nenhum perfil encontrado</h2>
      <p style={{ textAlign:"center", color:t.textTertiary }}>Não foram encontrados perfis ativos vinculados à sua conta.</p>
      <button style={s.btnGhost} onClick={() => navigate("/entrar")}>← Voltar ao Login</button>
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
          <h2 style={{ ...s.formTitle, margin:0 }}>Olá, {nome}!</h2>
          <p style={{ color:t.textTertiary, fontSize:14, marginTop:8 }}>
            Você possui <strong style={{ color:t.accent }}>{perfisDisponiveis.length} perfil(is)</strong> cadastrado(s). Selecione o contexto para esta sessão:
          </p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {Object.entries(perfisAgrupados).map(([orgNome, perfis]) => (
            <div key={orgNome}>
              <div style={{ color:t.textMuted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:8, paddingLeft:4 }}>{orgNome}</div>
              {perfis.map((perfil, idx) => {
                const suspenso = perfil._suspenso;
                return (
                  <button key={idx} onClick={() => !suspenso && handleSelecionar(perfil)}
                    disabled={suspenso}
                    style={{ width:"100%", background: suspenso ? `${t.danger}08` : t.bgHeaderSolid, border:`2px solid ${suspenso ? `${t.danger}33` : t.border}`, borderRadius:10, padding:"16px 20px", cursor: suspenso ? "not-allowed" : "pointer", display:"flex", alignItems:"center", gap:16, marginBottom:8, textAlign:"left", opacity: suspenso ? 0.6 : 1 }}
                    onMouseEnter={e => { if (!suspenso) { e.currentTarget.style.borderColor=t.accent; e.currentTarget.style.background=t.bgCard; } }}
                    onMouseLeave={e => { if (!suspenso) { e.currentTarget.style.borderColor=t.border; e.currentTarget.style.background=t.bgHeaderSolid; } }}
                  >
                    {perfil.icon ? <div style={{ width:48, height:48, borderRadius:10, background:t.bgInput, border:`2px solid ${t.borderInput}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{perfil.icon}</div> : null}
                    <div style={{ flex:1 }}>
                      <div style={{ color: suspenso ? t.textDisabled : t.textPrimary, fontSize:15, fontWeight:700 }}>
                        {perfil.label}
                        {suspenso && <span style={{ fontSize:10, color: t.danger, fontWeight:700, marginLeft:8, padding:"2px 6px", background:`${t.danger}15`, border:`1px solid ${t.danger}33`, borderRadius:4 }}>{perfil._suspensoMotivo === "encerrado" ? "ENCERRADO" : "SUSPENSO"}</span>}
                      </div>
                      <div style={{ color:t.textDimmed, fontSize:12, marginTop:2 }}>
                        {suspenso
                          ? (perfil._suspensoMotivo === "encerrado"
                            ? (perfil.tipo === "organizador"
                              ? "Contrato encerrado. Entre em contato com atendimento@gerentrack.com.br."
                              : "Acesso encerrado. Entre em contato com o organizador.")
                            : (perfil.tipo === "organizador"
                              ? "Conta suspensa. Entre em contato com atendimento@gerentrack.com.br."
                              : "Acesso indisponível. Entre em contato com o organizador."))
                          : perfil.sublabel}
                      </div>
                    </div>
                    {!suspenso && <div style={{ color:t.accent, fontSize:18 }}>→</div>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ borderTop:`1px solid ${t.border}`, marginTop:20, paddingTop:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <button style={s.linkBtn} onClick={() => navigate("/entrar")}>← Voltar ao Login</button>
          <button style={{ ...s.btnGhost, fontSize:12 }} onClick={logout}>Sair</button>
        </div>
      </div>
    </div>
  );
}

export default TelaSelecaoPerfil;
