import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { getCategoria } from "../../shared/constants/categorias";
import { _getCbat } from "../../shared/formatters/utils";
import { Th, Td } from "../ui/TableHelpers";
import { SinoNotificacoes } from "../ui/SinoNotificacoes";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";
function getStyles(t) {
  return {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: t.textPrimary, marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: t.textPrimary, marginBottom: 20, letterSpacing: 1 },
  painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  painelBtns: { display: "flex", gap: 10 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: `1px solid ${t.border}` },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: t.bgHeaderSolid, padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` },
  td: { padding: "12px 16px", fontSize: 14, color: t.textSecondary, borderBottom: `1px solid ${t.border}` },
  tr: { transition: "background 0.15s" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  input: { width: "100%", background: t.bgInput, borderWidth: 1, borderStyle: "solid", borderColor: t.borderInput, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  select: { width: "100%", background: t.bgInput, borderWidth: 1, borderStyle: "solid", borderColor: t.borderInput, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  emptyState: { textAlign: "center", padding: "60px 20px", color: t.textDisabled, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },
  btnPrimary: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: t.accent, border: `2px solid ${t.accent}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost: { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  linkBtn: { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", padding: 0 },
  badgeGold: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  catBanner: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 14, color: t.textTertiary },
  marca: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: t.accent },
};
}

function VinculoSolicitarForm({ atletaId, atletaNome, clubeInicial, equipes, solicitarVinculo }) {
  const t = useTema();
  const [equipeId, setEquipeSel] = useState("");
  const [enviado,     setEnviado]     = useState(false);

  const handleEnviar = () => {
    if (!equipeId) return;
    const equipeSel = equipes.find(e => e.id === equipeId);
    solicitarVinculo(atletaId, atletaNome, equipeId, equipeSel?.clube || "", {
      origem: "atleta",
      aprovadorTipo: "equipe",
      equipeAtualId: null,
      equipeAtualNome: null,
      organizadorId: equipeSel?.organizadorId || null,
      solicitanteId: atletaId,
      solicitanteNome: atletaNome,
    });
    setEnviado(true);
  };

  if (enviado) return (
    <div style={{ color: t.success, fontSize:13, padding:"6px 0" }}>
      ✓ Solicitação enviada! Aguarde a aprovação da equipe.
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:6 }}>
      <div>
        <label style={{ color: t.textMuted, fontSize:12, display:"block", marginBottom:4 }}>
          Equipe <span style={{ color: t.danger }}>*</span>
        </label>
        <select
          style={{ background:t.bgHover, border:`1px solid ${t.borderLight}`, color: t.textPrimary,
            borderRadius:6, padding:"8px 12px", width:"100%", fontSize:13 }}
          value={equipeId}
          onChange={e => setEquipeSel(e.target.value)}>
          <option value="">— Selecione a equipe —</option>
          {equipes.map(eq => (
            <option key={eq.id} value={eq.id}>
              {eq.nome}{eq.clube ? ` — ${eq.clube}` : ""}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleEnviar}
        disabled={!equipeId}
        style={{ background: equipeId ? t.accentBg : t.bgHeaderSolid, border:"1px solid",
          borderColor: equipeId ? t.accentBorder : t.border,
          color: equipeId ? t.accent : t.textDisabled,
          borderRadius:6, padding:"8px 16px", cursor: equipeId ? "pointer" : "not-allowed",
          fontSize:13, fontWeight:700, fontFamily:"Inter,sans-serif" }}>
        🔗 Enviar Solicitação de Vínculo
      </button>
    </div>
  );
}



function TelaPainelAtleta() {
  const { usuarioLogado, perfisDisponiveis } = useAuth();
  const { atletas, inscricoes, eventos, equipes, eventoAtual, adicionarInscricao, excluirInscricao, atualizarInscricao, resultados, solicitarVinculo, responderVinculo, desvincularAtleta: solicitarDesvinculo } = useEvento();
  const { setTela, atletasUsuarios, atualizarAtletaUsuario, solicitacoesVinculo, notificacoes, marcarNotifLida, organizadores, solicitacoesRelatorio, solicitarRelatorio, setAtletaEditandoId } = useApp();
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const confirmar = useConfirm();
  if (usuarioLogado?.tipo !== "atleta") return (
    <div style={s.page}><div style={s.emptyState}>
      <span style={{ fontSize: 48 }}>🚫</span>
      <p style={{ color: t.danger, fontWeight: 700 }}>Acesso restrito a atletas</p>
      <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
    </div></div>
  );

  // Encontra o registro de atleta vinculado a este usuário
  const meuAtleta = atletas.find(a => {
    if (a.atletaUsuarioId === usuarioLogado?.id) return true;
    if (a.email && usuarioLogado?.email && a.email.toLowerCase() === usuarioLogado.email.toLowerCase()) return true;
    if (a.cpf && usuarioLogado?.cpf) {
      return a.cpf.replace(/\D/g,"") === usuarioLogado.cpf.replace(/\D/g,"");
    }
    return false;
  });
  const minhasInscricoes = meuAtleta
    ? inscricoes.filter(i => i.atletaId === meuAtleta.id)
    : [];

  // Equipe vinculada
  const minhaEquipe = meuAtleta?.equipeId
    ? equipes.find(eq => eq.id === meuAtleta.equipeId)
    : null;
  
  const anoBase = new Date().getFullYear();
  const [buscaInsc, setBuscaInsc] = useState("");
  const [relatorioEvId, setRelatorioEvId] = useState("");
  const [relatorioEnviado, setRelatorioEnviado] = useState(false);

  // Eventos onde o atleta tem inscrições (para seletor de relatório)
  const eventosComInsc = meuAtleta
    ? [...new Set(minhasInscricoes.map(i => i.eventoId))].map(evId => eventos.find(e => e.id === evId)).filter(Boolean)
    : [];

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>🏃 Meu Painel</h1>
          <p style={{ color: t.textTertiary, margin:"4px 0 0" }}>
            {usuarioLogado?.nome}
          </p>
          {(() => {
            const orgId = usuarioLogado?.organizadorId || meuAtleta?.organizadorId;
            const org = orgId ? (organizadores||[]).find(o => o.id === orgId) : null;
            if (!org) return null;
            return (
              <p style={{ color: t.textDimmed, fontSize:12, margin:"2px 0 0" }}>
                Federação / Organizador: <strong style={{ color: t.accent }}>{org.entidade || org.nome}</strong>
              </p>
            );
          })()}
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          {meuAtleta && (
            <div style={s.painelBtns}>
              <button style={s.btnSecondary} onClick={async () => { if (setAtletaEditandoId) setAtletaEditandoId(meuAtleta?.id); setTela("editar-atleta"); }}>✏️ Meus Dados</button>
              <button style={s.btnSecondary} onClick={() => setTela("gerenciar-inscricoes")}>📋 Minhas Inscrições</button>
              <button style={s.btnPrimary} onClick={() => setTela("inscricao-avulsa")}>✍️ Me Inscrever</button>
            </div>
          )}
          <SinoNotificacoes
            notificacoes={notificacoes}
            usuarioId={usuarioLogado?.id}
            marcarNotifLida={marcarNotifLida}
            tiposExcluidos={["medals_ready", "relatorio_solicitado"]}
          />
        </div>
      </div>

      {/* Dados do atleta */}
      {meuAtleta ? (
        <div style={{ ...s.catBanner, marginBottom:16 }}>
          <strong>Categoria:</strong> {getCategoria(meuAtleta.anoNasc, anoBase)?.nome || "—"} &nbsp;·&nbsp;
          <strong>Nº CBAt:</strong> {_getCbat(meuAtleta) || "—"} &nbsp;·&nbsp;
          <strong>Sexo:</strong> {meuAtleta.sexo === "M" ? "Masculino" : "Feminino"}
          {minhaEquipe && <> &nbsp;·&nbsp; <strong>Equipe:</strong> {minhaEquipe.nome}</>}
        </div>
      ) : (
        <div style={{ ...s.catBanner, border:"1px solid #cc444444", marginBottom:16 }}>
          ⚠️ Seu perfil de atleta não foi localizado no sistema. Peça à sua equipe para cadastrá-lo ou complete seu cadastro.
        </div>
      )}

      {/* ── Competições abertas para participação cruzada ──────────────── */}
      {meuAtleta?.organizadorId && (() => {
        const meuOrgId = meuAtleta.organizadorId;
        const disponiveis = eventos.filter(e =>
          Array.isArray(e.orgsAutorizadas) &&
          e.orgsAutorizadas.includes(meuOrgId) &&
          e.organizadorId !== meuOrgId &&
          e.statusAprovacao === "aprovado" &&
          !e.inscricoesEncerradas
        );
        if (disponiveis.length === 0) return null;
        return (
          <div style={{ marginBottom:24 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <h2 style={{ ...s.sectionTitle, margin:0 }}>🤝 Competições Abertas para Você</h2>
              <span style={{ background: t.accentBg, color: t.accent, border:`1px solid ${t.accentBorder}`,
                borderRadius:20, padding:"2px 10px", fontSize:12, fontWeight:700 }}>
                {disponiveis.length}
              </span>
            </div>
            <div style={{ background: t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:8,
              padding:"10px 16px", marginBottom:12, fontSize:12, color: t.accent, lineHeight:1.5 }}>
              ℹ️ Sua federação foi autorizada a participar nestas competições de outros organizadores.
              Selecione uma delas para se inscrever.
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
              {disponiveis.map(ev => {
                const orgEv = (organizadores||[]).find(o => o.id === ev.organizadorId);
                const jaInscrito = meuAtleta ? inscricoes.some(i => i.atletaId === meuAtleta.id && i.eventoId === ev.id) : false;
                return (
                  <div key={ev.id} style={{ background:t.bgHeaderSolid, border:`1px solid ${t.accentBorder}`,
                    borderRadius:12, padding:"16px 18px", display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:18,
                      fontWeight:800, color: t.textPrimary, lineHeight:1.2 }}>{ev.nome}</div>
                    <div style={{ fontSize:12, color: t.accent }}>
                      {orgEv?.entidade || orgEv?.nome || "—"}
                    </div>
                    <div style={{ fontSize:12, color: t.textDimmed }}>
                      📅 {new Date(ev.data+"T12:00:00").toLocaleDateString("pt-BR")}
                      {ev.local ? ` · 📍 ${ev.local}` : ""}
                    </div>
                    {jaInscrito ? (
                      <span style={{ background: t.accentBg, color: t.success, border:`1px solid ${t.success}44`,
                        borderRadius:6, padding:"6px 12px", fontSize:12, fontWeight:700, textAlign:"center" }}>
                        ✓ Já inscrito
                      </span>
                    ) : (
                      <button style={{ ...s.btnPrimary, fontSize:13, padding:"8px 16px" }}
                        onClick={async () => { window.__eventoParaInscricao = ev.id; setTela("inscricao-avulsa"); }}>
                        ✍️ Me Inscrever
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {!eventoAtual && !meuAtleta?.organizadorId && (
        <div style={{ ...s.catBanner, border:`1px solid ${t.accentBorder}`, marginBottom:16 }}>
          💡 Selecione uma competição em <button style={s.linkBtn} onClick={()=>setTela("home")}>Competições</button> para se inscrever.
        </div>
      )}
      {eventoAtual?.inscricoesEncerradas && (
        <div style={{ ...s.catBanner, border:"1px solid #ff6b6b44", marginBottom:16 }}>
          ⛔ As inscrições para <strong>{eventoAtual.nome}</strong> estão encerradas.
        </div>
      )}

      {/* ── Solicitar/Ver Vínculo ──────────────────────────── */}
      {(() => {
        const minhasSol = (solicitacoesVinculo||[]).filter(sol => sol.atletaId === meuAtleta?.id);
        // Separa: solicitações de vínculo vs desvinculação
        const solPendente     = minhasSol.find(sol => sol.status === "pendente" && sol.tipo !== "desvinculacao");
        const solDesvinc      = minhasSol.find(sol => sol.status === "pendente" && sol.tipo === "desvinculacao");
        const solAceita       = minhasSol.find(sol => sol.status === "aceito"   && sol.tipo !== "desvinculacao");
        const semVinculo      = !meuAtleta?.equipeId;
        const equipeVinculada = meuAtleta?.equipeId ? equipes.find(eq => eq.id === meuAtleta.equipeId) : null;

        if (!meuAtleta) return null;

        return (
          <div style={{ marginBottom:20 }}>

            {/* ── COM VÍNCULO: painel do vínculo atual ─────────────── */}
            {!semVinculo && equipeVinculada && (
              <div style={{ background: t.bgCardAlt, border:`1px solid ${t.success}44`, borderRadius:10,
                padding:"16px 18px", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  flexWrap:"wrap", gap:12 }}>
                  <div>
                    <div style={{ color: t.success, fontWeight:700, fontSize:14, marginBottom:4 }}>
                      ✓ Vinculado à equipe
                    </div>
                    <div style={{ color: t.textPrimary, fontSize:15, fontWeight:700 }}>
                      {equipeVinculada.nome}
                      {meuAtleta.clube && meuAtleta.clube !== equipeVinculada.nome &&
                        <span style={{ color: t.textMuted, fontWeight:400, fontSize:13 }}> — {meuAtleta.clube}</span>}
                    </div>
                  </div>
                  {/* Botão de solicitar desvinculação */}
                  {!solDesvinc && solicitarDesvinculo && (
                    <details>
                      <summary style={{ cursor:"pointer", color: t.danger, fontSize:12,
                        background: t.bgCardAlt, border:`1px solid ${t.danger}44`,
                        borderRadius:6, padding:"5px 12px", listStyle:"none",
                        fontFamily:"'Barlow', sans-serif", userSelect:"none" }}>
                        ✗ Solicitar saída...
                      </summary>
                      <div style={{ marginTop:10, background: t.bgCardAlt, border:`1px solid ${t.danger}44`,
                        borderRadius:8, padding:"14px 16px" }}>
                        <div style={{ color: t.danger, fontWeight:700, fontSize:13, marginBottom:6 }}>
                          Solicitar saída da equipe {equipeVinculada.nome}
                        </div>
                        <div style={{ color: t.textMuted, fontSize:12, lineHeight:1.7, marginBottom:12 }}>
                          A equipe precisará aprovar sua saída.<br/>
                          <strong style={{ color: t.textTertiary }}>Seus resultados e inscrições históricas serão
                          totalmente preservados</strong> — nenhum dado esportivo é apagado.
                        </div>
                        <button
                          onClick={async () => { 
                            if (!await confirmar(
                              `⚠️ Solicitar saída da equipe "${equipeVinculada.nome }"?

` +
                              `A equipe precisará aprovar sua solicitação.

` +
                              `✅ Seus resultados e inscrições históricas serão PRESERVADOS.
` +
                              `✅ Você continuará aparecendo nos resultados de competições já realizadas.

` +
                              `Deseja enviar a solicitação?`
                            )) return;
                            solicitarDesvinculo(
                              meuAtleta.id, meuAtleta.nome,
                              equipeVinculada.id, equipeVinculada.nome
                            );
                          }}
                          style={{ background: t.bgCardAlt, border:`1px solid ${t.danger}`, color: t.danger,
                            borderRadius:6, padding:"8px 18px", cursor:"pointer", fontSize:13,
                            fontWeight:700, fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:0.5 }}>
                          Confirmar Solicitação de Saída
                        </button>
                      </div>
                    </details>
                  )}
                </div>

                {/* Desvinculação pendente */}
                {solDesvinc && (
                  <div style={{ marginTop:12, background: t.bgCardAlt, border:`1px solid ${t.warning}44`,
                    borderRadius:7, padding:"10px 14px", display:"flex", alignItems:"center",
                    gap:10 }}>
                    <span style={{ fontSize:18 }}>⏳</span>
                    <div>
                      <div style={{ color: t.warning, fontWeight:700, fontSize:13 }}>
                        Solicitação de saída pendente
                      </div>
                      <div style={{ color: t.textMuted, fontSize:12, marginTop:2 }}>
                        Aguardando aprovação da equipe. Enquanto não for aprovada,
                        você permanece vinculado.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Atleta sem vínculo e com clube solicitado salvo */}
            {semVinculo && meuAtleta.clubeSolicitado && !solPendente && (
              <div style={{ background: t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:8,
                padding:"14px 18px", marginBottom:12 }}>
                <strong style={{ color: t.accent }}>🔗 Vincular-se a uma equipe</strong>
                <p style={{ color: t.textTertiary, fontSize:13, margin:"6px 0 10px", lineHeight:1.6 }}>
                  Você se inscreveu informando a equipe <strong style={{ color: t.accent }}>{meuAtleta.clubeSolicitado}</strong>,
                  mas ela ainda não está vinculada ao seu perfil.
                  Selecione uma equipe para enviar uma solicitação de vínculo:
                </p>
                <VinculoSolicitarForm
                  atletaId={meuAtleta.id} atletaNome={meuAtleta.nome}
                  clubeInicial={meuAtleta.clubeSolicitado}
                  equipes={equipes} solicitarVinculo={solicitarVinculo} />
              </div>
            )}

            {/* Sem vínculo, sem clube solicitado */}
            {semVinculo && !meuAtleta.clubeSolicitado && !solPendente && (
              <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.borderLight}`, borderRadius:8,
                padding:"12px 16px", marginBottom:12 }}>
                <details>
                  <summary style={{ color: t.textTertiary, fontSize:13, cursor:"pointer" }}>
                    🔗 Vincular-se a uma equipe
                  </summary>
                  <div style={{ marginTop:10 }}>
                    <VinculoSolicitarForm
                      atletaId={meuAtleta.id} atletaNome={meuAtleta.nome}
                      clubeInicial=""
                      equipes={equipes} solicitarVinculo={solicitarVinculo} />
                  </div>
                </details>
              </div>
            )}

            {/* Solicitação de vínculo pendente — enviada PELO atleta para entrar */}
            {solPendente && solPendente.origem !== "equipe" && (
              <div style={{ background: t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:8,
                padding:"12px 16px", marginBottom:12 }}>
                <strong style={{ color: t.accent }}>⏳ Solicitação de vínculo enviada</strong>
                <p style={{ color: t.textTertiary, fontSize:13, margin:"4px 0 0" }}>
                  Aguardando aprovação da equipe <strong>{equipes.find(eq=>eq.id===solPendente.equipeId)?.nome||"—"}</strong>
                  {solPendente.clube ? ` — equipe ${solPendente.clube}` : ""}.
                </p>
              </div>
            )}

            {/* Solicitação recebida — EQUIPE pediu ao atleta */}
            {solPendente && solPendente.origem === "equipe" && solPendente.aprovadorTipo === "atleta" && (
              <div style={{ background: t.accentBg, border:`2px solid ${t.accent}`, borderRadius:8,
                padding:"14px 16px", marginBottom:12 }}>
                <strong style={{ color: t.accent, fontSize:14 }}>🔔 Solicitação de vínculo recebida</strong>
                <p style={{ color: t.textTertiary, fontSize:13, margin:"8px 0 12px", lineHeight:1.6 }}>
                  A equipe <strong style={{ color: t.textPrimary }}>{equipes.find(eq=>eq.id===solPendente.equipeId)?.nome||"—"}</strong>
                  {solPendente.clube ? ` da equipe ${solPendente.clube}` : ""} está solicitando seu vínculo.
                  Deseja aceitar?
                </p>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => responderVinculo(solPendente.id, true)}
                    style={{ background: t.bgCardAlt, border:`1px solid ${t.success}44`, color: t.success,
                      borderRadius:6, padding:"8px 20px", cursor:"pointer", fontSize:13,
                      fontWeight:700, fontFamily:"'Barlow', sans-serif" }}>
                    ✓ Aceitar
                  </button>
                  <button onClick={() => responderVinculo(solPendente.id, false)}
                    style={{ background: t.bgCardAlt, border:`1px solid ${t.danger}44`, color: t.danger,
                      borderRadius:6, padding:"8px 16px", cursor:"pointer", fontSize:13,
                      fontFamily:"'Barlow', sans-serif" }}>
                    ✗ Recusar
                  </button>
                </div>
              </div>
            )}

            {/* Vínculo aceito recente (sem equipe atual — acabou de entrar) */}
            {solAceita && meuAtleta?.equipeId && !equipeVinculada && (
              <div style={{ background: t.bgCardAlt, border:`1px solid ${t.success}44`, borderRadius:8,
                padding:"10px 16px", marginBottom:12 }}>
                <strong style={{ color: t.success }}>✓ Vinculado</strong>
                <span style={{ color: t.textTertiary, fontSize:13, marginLeft:8 }}>
                  {equipes.find(eq=>eq.id===meuAtleta.equipeId)?.nome||"—"}
                  {meuAtleta.clube ? ` — ${meuAtleta.clube}` : ""}
                </span>
              </div>
            )}
          </div>
        );
      })()}

      <h2 style={s.sectionTitle}>Minhas Inscrições</h2>
      {minhasInscricoes.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize:48 }}>✍️</span>
          <p>Nenhuma inscrição ainda.</p>
        </div>
      ) : (
        <div style={s.tableWrap}>
          <input type="text" value={buscaInsc} onChange={e => setBuscaInsc(e.target.value)} placeholder="🔍 Buscar inscrição..." style={{ ...s.input, padding:"6px 12px", fontSize:12, marginBottom:8, maxWidth:350 }} />
          <div style={{ maxHeight:320, overflowY:"auto" }}>
          <table style={s.table}>
            <thead><tr><Th>Competição</Th><Th>Prova</Th><Th>Categoria</Th><Th>Sexo</Th><Th>Origem</Th><Th>Ações</Th></tr></thead>
            <tbody>
              {minhasInscricoes.filter(i => {
                if (!buscaInsc) return true;
                const b = buscaInsc.toLowerCase();
                const ev = eventos.find(e=>e.id===i.eventoId);
                const prova = todasAsProvas().find(p=>p.id===i.provaId);
                return (ev?.nome||"").toLowerCase().includes(b) || (prova?.nome||"").toLowerCase().includes(b);
              }).map((i,idx) => {
                const ev = eventos.find(e=>e.id===i.eventoId);
                const prova = todasAsProvas().find(p=>p.id===i.provaId);
                return (
                  <tr key={idx} style={s.tr}>
                    <Td>{ev?.nome||"—"}</Td>
                    <Td>{prova?.nome || i.provaId}</Td>
                    <Td>{i.categoriaOficial || i.categoria || i.categoriaId}</Td>
                    <Td>{i.sexo==="M"?"Masculino":"Feminino"}</Td>
                    <Td>
                      <span style={{
                        fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:4,
                        background: t.accentBg,
                        color: i.origemAtleta ? t.success : t.accent,
                      }}>
                        {i.origemAtleta ? "🏃 Própria" : "🎽 Equipe"}
                      </span>
                    </Td>
                    <Td>
                      {(() => {
                        const ev = eventos.find(e => e.id === i.eventoId);
                        const inscAberta = ev && !ev.inscricoesEncerradas;
                        if (!inscAberta) return <span style={{color: t.textDisabled,fontSize:11}}>—</span>;
                        return (
                          <button onClick={async () => { if (await confirmar("⚠️ Excluir esta inscrição?\n\nEsta ação é IRREVERSÍVEL e removerá todos os resultados associados.")) excluirInscricao(i.id, { confirmado: true }); }}
                            style={{...s.btnGhost,fontSize:11,padding:"3px 10px",color: t.danger,borderColor: t.danger+"44"}}
                            title="Excluir inscrição">
                            🗑 Excluir
                          </button>
                        );
                      })()}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}


      {/* ── Item 3: Meus Resultados por Competição ── */}
      {meuAtleta && resultados && (() => {
        const FASE_PRIO = ["FIN", "SEM", "ELI", ""];
        const FASE_LABEL = { FIN:"Final", SEM:"Semifinal", ELI:"Eliminatória", "":"—" };
        const eventoIds = [...new Set(minhasInscricoes.map(i => i.eventoId))];
        const cards = eventoIds.map(evId => {
          const ev = eventos.find(e => e.id === evId);
          if (!ev) return null;
          const inscsEv = minhasInscricoes.filter(i => i.eventoId === evId);
          const linhas = inscsEv.map(i => {
            const prova = todasAsProvas().find(p => p.id === i.provaId);
            let marcaEncontrada = null;
            let posicaoEncontrada = null;
            let faseEncontrada = "";
            for (const fase of FASE_PRIO) {
              const chave = fase
                ? `${evId}_${i.provaId}_${i.categoriaOficialId||i.categoriaId}_${i.sexo}__${fase}`
                : `${evId}_${i.provaId}_${i.categoriaOficialId||i.categoriaId}_${i.sexo}`;
              const docRes = resultados[chave];
              if (docRes && docRes[meuAtleta.id] != null) {
                const entrada = docRes[meuAtleta.id];
                marcaEncontrada = typeof entrada === "object"
                  ? (entrada.status && entrada.status !== "" ? entrada.status : (entrada.marca ?? "—"))
                  : entrada;
                posicaoEncontrada = typeof entrada === "object" ? (entrada.posicao ?? null) : null;
                faseEncontrada = fase;
                break;
              }
            }
            if (!marcaEncontrada) return null;
            return { prova, fase: faseEncontrada, marca: marcaEncontrada, posicao: posicaoEncontrada, cat: i.categoriaOficial || i.categoria || "" };
          }).filter(Boolean);
          if (linhas.length === 0) return null;
          return { ev, linhas };
        }).filter(Boolean).sort((a, b) => (b.ev.data || "").localeCompare(a.ev.data || ""));

        if (cards.length === 0) return null;
        return (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginTop:32, marginBottom:20 }}>
              <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:800, color: t.textPrimary, letterSpacing:1, margin:0 }}>
                Meus Resultados
              </h2>
              {solicitarRelatorio && eventosComInsc.length > 0 && (
                <details style={{ position:"relative" }}>
                  <summary style={{ cursor:"pointer", background:"transparent", color: t.accent, border:`1px solid ${t.accentBorder}`, borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:700, fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:0.5, listStyle:"none" }}>
                    📄 Solicitar Relatório Oficial
                  </summary>
                  <div style={{ marginTop:8, background:t.bgHeaderSolid, border:`1px solid ${t.accentBorder}`, borderRadius:8, padding:"14px 16px", minWidth:280 }}>
                    {relatorioEnviado ? (
                      <div style={{ color: t.success, fontSize:13 }}>✓ Solicitação enviada! O organizador será notificado.</div>
                    ) : (
                      <>
                        <label style={{ fontSize:11, color: t.textMuted, display:"block", marginBottom:4 }}>Competição</label>
                        <select value={relatorioEvId} onChange={e => setRelatorioEvId(e.target.value)}
                          style={{ width:"100%", background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:6, padding:"8px 10px", color: t.textPrimary, fontSize:13, marginBottom:10 }}>
                          <option value="">— Selecione —</option>
                          {eventosComInsc.map(ev => <option key={ev.id} value={ev.id}>{ev.nome}</option>)}
                        </select>
                        <button disabled={!relatorioEvId} onClick={() => {
                          const ev = eventos.find(e => e.id === relatorioEvId);
                          if (ev && meuAtleta) { solicitarRelatorio(meuAtleta.id, meuAtleta.nome, "atleta", ev.id, ev.nome, [meuAtleta.id]); setRelatorioEnviado(true); setTimeout(() => setRelatorioEnviado(false), 4000); }
                        }} style={{ background: relatorioEvId ? t.accentBg : t.bgHeaderSolid, border:"1px solid", borderColor: relatorioEvId ? t.accentBorder : t.border, color: relatorioEvId ? t.accent : t.textDisabled, borderRadius:6, padding:"8px 16px", cursor: relatorioEvId ? "pointer" : "not-allowed", fontSize:13, fontWeight:700 }}>
                          Enviar Solicitação
                        </button>
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>
            {cards.map(({ ev, linhas }) => (
              <div key={ev.id} style={{
                background:t.bgCard, border:`1px solid ${t.border}`,
                borderRadius:12, marginBottom:20, overflow:"hidden",
              }}>
                {/* Header da competição */}
                <div style={{
                  padding:"14px 20px", background:t.bgHeaderSolid,
                  borderBottom:`1px solid ${t.border}`,
                  display:"flex", justifyContent:"space-between",
                  alignItems:"center", flexWrap:"wrap", gap:8,
                }}>
                  <div>
                    <div style={{
                      fontFamily:"'Barlow Condensed',sans-serif",
                      fontSize:20, fontWeight:800, color: t.textPrimary, marginBottom:5,
                    }}>
                      🏟 {ev.nome}
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                      {ev.data && (
                        <span style={{ fontSize:12, color: t.textDimmed }}>
                          📅 {new Date(ev.data+"T12:00:00").toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      {ev.local && (
                        <span style={{ fontSize:12, color: t.textDimmed }}>· 📍 {ev.local}</span>
                      )}
                      <span style={{
                        background: t.accentBg, color: t.accent,
                        border:`1px solid ${t.accentBorder}`, borderRadius:4,
                        padding:"2px 8px", fontSize:11, fontWeight:600,
                      }}>
                        {linhas.length} prova{linhas.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid de quadrantes — 1 por prova */}
                <div style={{
                  display:"grid",
                  gridTemplateColumns:"repeat(auto-fill, minmax(175px, 1fr))",
                  gap:"1px",
                  background:t.border,
                }}>
                  {linhas.map((l, idx) => {
                    const isDNS = ["DNS","DNF","DQ","NM","NH"].includes(String(l.marca).toUpperCase());
                    return (
                      <div key={idx} style={{
                        background:t.bgCard,
                        padding:"16px 18px",
                        display:"flex", flexDirection:"column", gap:6,
                        minHeight:100,
                      }}>
                        {/* Nome da prova */}
                        <div style={{
                          fontFamily:"'Barlow Condensed',sans-serif",
                          fontSize:14, fontWeight:700, color: t.textTertiary,
                          lineHeight:1.2, textTransform:"uppercase", letterSpacing:0.5,
                        }}>
                          {l.prova?.nome || "—"}
                        </div>

                        {/* Marca em destaque */}
                        <div style={{
                          fontFamily:"'Barlow Condensed',sans-serif",
                          fontSize:30, fontWeight:900, lineHeight:1,
                          color: isDNS ? "#555" : t.accent,
                          marginTop:2, marginBottom:2,
                        }}>
                          {l.marca}
                        </div>

                        {/* Posição */}
                        {l.posicao != null && (
                          <div style={{
                            fontSize:12, fontWeight:700, color: l.posicao <= 3 ? "#FFD700" : "#888",
                          }}>
                            {l.posicao === 1 ? "🥇" : l.posicao === 2 ? "🥈" : l.posicao === 3 ? "🥉" : `${l.posicao}º`} lugar
                          </div>
                        )}

                        {/* Fase + Categoria */}
                        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:"auto" }}>
                          {l.fase && (
                            <span style={{
                              fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:3,
                              background:t.bgInput, border:`1px solid ${t.borderInput}`, color: t.textDimmed,
                            }}>
                              {FASE_LABEL[l.fase] || l.fase}
                            </span>
                          )}
                          {l.cat && (
                            <span style={{
                              fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:3,
                              background: t.accentBg, border:`1px solid ${t.accentBorder}`, color: t.accent,
                            }}>
                              {l.cat}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        );
      })()}
    </div>
  );
}



export default TelaPainelAtleta;
