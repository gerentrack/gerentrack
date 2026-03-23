import React, { useState, useMemo } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { getCategoria } from "../../shared/constants/categorias";
import { getStatusEvento, labelStatusEvento } from "../eventos/eventoHelpers";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { getFasesProva, resKey } from "../../shared/constants/fases";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";

const S = {
  page:       { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  title:      { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: 1 },
  secTitle:   { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 14, letterSpacing: 1 },
  card:       { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: 24, marginBottom: 24 },
  statCard:   { background: "#111318", border: "1px solid #1E2130", borderRadius: 12, padding: "18px 24px", textAlign: "center", minWidth: 100 },
  statVal:    { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: "#1976D2", lineHeight: 1, marginBottom: 6 },
  statLabel:  { fontSize: 12, color: "#888", letterSpacing: 1, textTransform: "uppercase" },
  statsRow:   { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 },
  tableWrap:  { overflowX: "auto", borderRadius: 10, border: "1px solid #1E2130" },
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { background: "#0D0E12", padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1E2130" },
  td:         { padding: "10px 14px", fontSize: 13, color: "#bbb", borderBottom: "1px solid #12141a" },
  tr:         { transition: "background 0.15s" },
  btn:        { background: "linear-gradient(135deg, #1976D2, #1565C0)", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnSec:     { background: "transparent", color: "#1976D2", border: "2px solid #1976D2", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost:   { background: "transparent", color: "#888", border: "1px solid #2a2d3a", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  input:      { width: "100%", background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "8px 12px", color: "#E0E0E0", fontSize: 13, outline: "none", marginBottom: 8 },
  badge:      (c) => ({ background: c+"22", color: c, border: `1px solid ${c}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  emptyState: { textAlign: "center", padding: "40px 20px", color: "#444", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontSize: 14 },
  eventoStatusBadge: (s) => ({
    display: "inline-block", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
    background: s === "ao_vivo" ? "#3a0a0a" : s === "hoje_pre" ? "#2a2a0a" : s === "futuro" ? "#0a2a0a" : "#1a1a1a",
    color:      s === "ao_vivo" ? "#ff6b6b" : s === "hoje_pre" ? "#1976D2"  : s === "futuro" ? "#7acc44"  : "#555",
    border: `1px solid ${s === "ao_vivo" ? "#6a2a2a" : s === "hoje_pre" ? "#4a4a0a" : s === "futuro" ? "#2a5a2a" : "#333"}`,
  }),
};

function Th({ children, style }) {
  const s = useStylesResponsivos(S);
  return <th style={{ ...s.th, ...style }}>{children}</th>;
}
function Td({ children, style }) {
  const s = useStylesResponsivos(S);
  return <td style={{ ...s.td, ...style }}>{children}</td>;
}
function StatCard({ value, label, color = "#1976D2" }) {
  const s = useStylesResponsivos(S);
  return (
    <div style={{ ...s.statCard }}>
      <div style={{ ...s.statVal, color }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

import { SinoNotificacoes } from "../ui/SinoNotificacoes";

export default function TelaPainelEquipe({
  usuarioLogado, setTela, logout,
  atletas, inscricoes, eventos, equipes, treinadores,
  resultados,
  solicitarRelatorio, solicitacoesRelatorio, cancelarRelatorio, excluirRelatorio,
  solicitacoesVinculo, responderVinculo,
  selecionarEvento,
  desvincularAtleta, setAtletaEditandoId,
  notificacoes, marcarNotifLida,
}) {
  const s = useStylesResponsivos(S);
  const confirmar = useConfirm();
  const isTreinador = usuarioLogado?.tipo === "treinador";
  const equipeId    = isTreinador ? usuarioLogado?.equipeId : usuarioLogado?.id;
  const equipe      = equipes?.find(e => e.id === equipeId) || usuarioLogado;

  const [abaAtiva, setAbaAtiva] = useState("visao-geral");
  const [buscaAtl, setBuscaAtl] = useState("");
  const [buscaRes, setBuscaRes] = useState("");
  const [relEvId, setRelEvId] = useState("");
  const [relEnviado, setRelEnviado] = useState(false);
  const [relAssinatura, setRelAssinatura] = useState("");
  const [relPreview, setRelPreview] = useState(false);
  const [relHistAberto, setRelHistAberto] = useState(false);

  const anoBase = new Date().getFullYear();
  const meusAtletas   = (atletas  || []).filter(a => a.equipeId === equipeId);
  const meusTrein     = (treinadores || []).filter(t => t.equipeId === equipeId);
  const minhasInscs   = (inscricoes || []).filter(i => meusAtletas.some(a => a.id === i.atletaId));

  // Vínculos pendentes para esta equipe responder
  const vincPendentes      = (solicitacoesVinculo||[]).filter(sol => sol.equipeId === equipeId && sol.status === "pendente" && sol.aprovadorTipo !== "equipe_atual" && sol.tipo !== "desvinculacao");
  const desvinculacaoPend  = (solicitacoesVinculo||[]).filter(sol => sol.equipeId === equipeId && sol.status === "pendente" && sol.tipo === "desvinculacao");
  const transferenciasPend = (solicitacoesVinculo||[]).filter(sol => sol.equipeAtualId === equipeId && sol.status === "pendente" && sol.tipo !== "desvinculacao");
  const totalPendentes     = vincPendentes.length + transferenciasPend.length + desvinculacaoPend.length;

  // Eventos com inscrições da equipe
  const eventosComInsc = useMemo(() => (eventos||[]).filter(ev => minhasInscs.some(i => i.eventoId === ev.id)), [eventos, minhasInscs]);

  // Eventos abertos para inscrição
  const eventosAbertos = useMemo(() =>
    (eventos||[]).filter(ev =>
      !ev.inscricoesEncerradas &&
      (!ev.statusAprovacao || ev.statusAprovacao === "aprovado")
    ).sort((a,b) => (a.data||"").localeCompare(b.data||"")),
    [eventos]
  );

  // ── Resultados dos atletas da equipe ──
  const FASE_PRIO = ["FIN", "SEM", "ELI", ""];
  const FASE_LABEL_MAP = { FIN:"Final", SEM:"Semifinal", ELI:"Eliminatória", "":"" };
  const resultadosEquipe = useMemo(() => {
    if (!resultados || meusAtletas.length === 0) return [];
    const atletaIdSet = new Set(meusAtletas.map(a => a.id));
    const provas = todasAsProvas();
    const linhas = [];

    minhasInscs.forEach(insc => {
      const atletaId = insc.atletaId;
      if (!atletaIdSet.has(atletaId)) return;
      const evId = insc.eventoId;
      const provaId = insc.provaId;
      const catId = insc.categoriaOficialId || insc.categoriaId;
      const sexo = insc.sexo;

      for (const fase of FASE_PRIO) {
        const chave = resKey(evId, provaId, catId, sexo, fase || undefined);
        const docRes = resultados[chave];
        if (docRes && docRes[atletaId] != null) {
          const entrada = docRes[atletaId];
          const obj = typeof entrada === "object" ? entrada : { marca: entrada };
          const status = obj.status || "";
          const isStatus = ["DNS","DNF","DQ","NM","NH"].includes(status);
          const marca = isStatus ? status : (obj.marca ?? "—");
          const posicao = obj.posicao ?? null;
          const prova = provas.find(p => p.id === provaId);
          linhas.push({
            atletaId, evId, provaId, fase,
            atletaNome: meusAtletas.find(a => a.id === atletaId)?.nome || "—",
            provaNome: prova?.nome || provaId,
            marca, posicao, isStatus,
            cat: insc.categoriaOficial || insc.categoria || "",
          });
          break;
        }
      }
    });

    // Agrupar por evento, ordenar por data desc
    const porEvento = {};
    linhas.forEach(l => {
      if (!porEvento[l.evId]) porEvento[l.evId] = [];
      porEvento[l.evId].push(l);
    });
    return Object.entries(porEvento)
      .map(([evId, items]) => ({ ev: (eventos||[]).find(e => e.id === evId), items }))
      .filter(g => g.ev)
      .sort((a, b) => (b.ev.data || "").localeCompare(a.ev.data || ""));
  }, [resultados, meusAtletas, minhasInscs, eventos]);

  const medalhas = useMemo(() => {
    let ouro = 0, prata = 0, bronze = 0, total = 0;
    resultadosEquipe.forEach(g => g.items.forEach(l => {
      if (l.isStatus) return;
      total++;
      if (l.posicao === 1) ouro++;
      else if (l.posicao === 2) prata++;
      else if (l.posicao === 3) bronze++;
    }));
    return { ouro, prata, bronze, total };
  }, [resultadosEquipe]);

  const exibirPosicao = (pos) => {
    if (pos == null) return "—";
    if (pos === 1) return "🥇";
    if (pos === 2) return "🥈";
    if (pos === 3) return "🥉";
    return `${pos}º`;
  };

  const abas = [
    { id: "visao-geral",  label: "🏠 Visão Geral" },
    { id: "atletas",      label: `👥 Atletas (${meusAtletas.length})` },
    { id: "inscricoes",   label: `📋 Inscrições (${minhasInscs.length})` },
    { id: "eventos",      label: `🏟️ Competições (${eventosAbertos.length} abertas)` },
    { id: "resultados",   label: `🏆 Resultados (${medalhas.total})` },
    { id: "treinadores",  label: `👨‍🏫 Treinadores (${meusTrein.length})` },
    ...(totalPendentes > 0 ? [{ id: "vinculos", label: `🔗 Vínculos (${totalPendentes})`, badge: true }] : []),
  ];

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={s.title}>🎽 {equipe?.nome || "Painel da Equipe"}</h1>
          <div style={{ color: "#666", fontSize: 13 }}>
            {equipe?.sigla && <span>{equipe.sigla} · </span>}
            {equipe?.cidade && <span>{equipe.cidade}{equipe.estado ? `, ${equipe.estado}` : ""} · </span>}
            Logado como <strong style={{ color: "#aaa" }}>{usuarioLogado?.nome}</strong>
          </div>
        </div>
        <SinoNotificacoes
          notificacoes={notificacoes}
          usuarioId={usuarioLogado?.id}
          marcarNotifLida={marcarNotifLida}
        />
      </div>

      {/* Stats gerais */}
      <div style={s.statsRow}>
        <StatCard value={meusAtletas.length} label="Atletas" />
        <StatCard value={minhasInscs.length} label="Inscrições" color="#7acc44" />
        <StatCard value={meusTrein.length} label="Treinadores" color="#88aaff" />
        <StatCard value={eventosAbertos.length} label="Eventos abertos" color="#ff6b6b" />
        {totalPendentes > 0 && <StatCard value={totalPendentes} label="Vínculos pendentes" color="#ffaa44" />}
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 0, background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, overflow: "hidden", marginBottom: 24, flexWrap: "wrap" }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAbaAtiva(a.id)}
            style={{ background: abaAtiva === a.id ? "#141720" : "transparent", border: "none", color: abaAtiva === a.id ? "#1976D2" : "#666", padding: "11px 20px", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", position: "relative", fontWeight: a.badge ? 700 : 400 }}>
            {a.label}
            {a.badge && <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: "#ffaa44" }} />}
          </button>
        ))}
      </div>

      {/* ── ABA: VISÃO GERAL ── */}
      {abaAtiva === "visao-geral" && (
        <div>
          {/* Alertas de vínculos pendentes */}
          {totalPendentes > 0 && (
            <div style={{ background: "#1a1200", border: "1px solid #ffaa4466", borderRadius: 10, padding: "14px 18px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <span style={{ color: "#ffaa44", fontWeight: 700 }}>🔔 {totalPendentes} solicitação(ões) de vínculo aguardando sua resposta</span>
              </div>
              <button onClick={() => setAbaAtiva("vinculos")} style={{ ...s.btn, background: "#ffaa44", padding: "6px 16px", fontSize: 12 }}>
                Ver agora →
              </button>
            </div>
          )}

          {/* Últimas inscrições */}
          {eventosComInsc.length > 0 && (
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={s.secTitle}>📋 Competições com inscrições</div>
                <button onClick={() => setAbaAtiva("inscricoes")} style={{ ...s.btnGhost, fontSize: 12, padding: "5px 14px" }}>Ver tudo →</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {eventosComInsc.slice(0, 6).map(ev => {
                  const nInscs = minhasInscs.filter(i => i.eventoId === ev.id).length;
                  const status = getStatusEvento(ev);
                  return (
                    <div key={ev.id} onClick={async () => { selecionarEvento(ev.id); setTela("gestao-inscricoes"); }}
                      style={{ background: "#0a0b14", border: "1px solid #1E2130", borderRadius: 8, padding: "12px 16px", cursor: "pointer", minWidth: 200 }}>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{ev.nome}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={s.eventoStatusBadge(status)}>{labelStatusEvento(status)}</span>
                        <span style={{ color: "#7acc44", fontSize: 11 }}>{nInscs} inscrição(ões)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Eventos abertos */}
          {eventosAbertos.length > 0 && (
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={s.secTitle}>🏟️ Competições com inscrições abertas</div>
                <button onClick={() => setAbaAtiva("eventos")} style={{ ...s.btnGhost, fontSize: 12, padding: "5px 14px" }}>Ver todas →</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {eventosAbertos.slice(0, 4).map(ev => (
                  <div key={ev.id} style={{ background: "#0a140a", border: "1px solid #2a4a2a", borderRadius: 8, padding: "12px 16px", flex: 1, minWidth: 180 }}>
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{ev.nome}</div>
                    <div style={{ color: "#888", fontSize: 11, marginBottom: 8 }}>
                      {ev.data ? new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR") : ""}
                      {ev.dataEncerramentoInscricoes ? ` · até ${new Date(ev.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}
                    </div>
                    <button onClick={async () => { selecionarEvento(ev.id); setTela("gestao-inscricoes"); }}
                      style={{ ...s.btn, padding: "5px 14px", fontSize: 11 }}>
                      📝 Inscrever atletas
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ABA: ATLETAS ── */}
      {abaAtiva === "atletas" && (
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={s.secTitle}>👥 Atletas da Equipe</div>
            <button style={s.btn} onClick={() => setTela("cadastrar-atleta")}>+ Cadastrar</button>
          </div>
          <input type="text" value={buscaAtl} onChange={e => setBuscaAtl(e.target.value)}
            placeholder="🔍 Buscar nome, CPF..." style={s.input} />
          {meusAtletas.length === 0 ? (
            <div style={s.emptyState}>
              <span style={{ fontSize: 40 }}>👤</span>
              <p>Nenhum atleta cadastrado</p>
              <button style={s.btn} onClick={() => setTela("cadastrar-atleta")}>+ Cadastrar primeiro atleta</button>
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr><Th>Nome</Th><Th>Sexo</Th><Th>Categoria</Th><Th>CPF</Th><Th></Th></tr></thead>
                <tbody>
                  {meusAtletas.filter(a => {
                    if (!buscaAtl) return true;
                    const b = buscaAtl.toLowerCase();
                    return (a.nome||"").toLowerCase().includes(b) || (a.cpf||"").includes(buscaAtl.replace(/\D/g,""));
                  }).map(a => {
                    const cat = getCategoria(a.anoNasc, anoBase);
                    return (
                      <tr key={a.id} style={s.tr}>
                        <Td><strong style={{ color: "#fff" }}>{a.nome}</strong></Td>
                        <Td><span style={s.badge(a.sexo === "M" ? "#88aaff" : "#ff88cc")}>{a.sexo === "M" ? "Masc." : "Fem."}</span></Td>
                        <Td><span style={s.badge("#1976D2")}>{cat?.nome || "—"}</span></Td>
                        <Td style={{ fontSize: 11, color: "#555" }}>{a.cpf || "—"}</Td>
                        <Td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={{ background: "#141720", border: "1px solid #252837", color: "#aaa", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}
                              onClick={async () => { setAtletaEditandoId(a.id); setTela("editar-atleta"); }}>
                              ✏️ Editar
                            </button>
                            <button style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", color: "#ff6b6b", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}
                              onClick={() => desvincularAtleta(a.id)}>
                              🔓 Desvincular
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
        </div>
      )}

      {/* ── ABA: INSCRIÇÕES ── */}
      {abaAtiva === "inscricoes" && (
        <div>
          {eventosComInsc.length === 0 ? (
            <div style={{ ...s.card, ...s.emptyState }}>
              <span style={{ fontSize: 40 }}>📋</span>
              <p>Nenhuma inscrição registrada ainda.</p>
              <button style={s.btn} onClick={() => setAbaAtiva("eventos")}>Ver competições abertas</button>
            </div>
          ) : (
            eventosComInsc.map(ev => {
              const inscsEvento = minhasInscs.filter(i => i.eventoId === ev.id);
              const atletaIds = [...new Set(inscsEvento.map(i => i.atletaId))];
              return (
                <details key={ev.id} open style={{ background: "#0a0b14", border: "1px solid #1a2a3a", borderRadius: 10, marginBottom: 12, overflow: "hidden" }}>
                  <summary style={{ padding: "12px 18px", cursor: "pointer", color: "#1976D2", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span>{ev.nome}</span>
                    <span style={s.badge("#7acc44")}>{inscsEvento.length} inscrição(ões)</span>
                    <span style={{ color: "#555", fontSize: 11, fontWeight: 400 }}>
                      📅 {ev.data ? new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR") : ""}
                    </span>
                    <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); selecionarEvento(ev.id); setTela("gestao-inscricoes"); }}
                      style={{ ...s.btnSec, fontSize: 11, padding: "3px 12px", marginLeft: "auto" }}>
                      Gerenciar →
                    </button>
                  </summary>
                  <div style={{ padding: "0 18px 16px" }}>
                    {atletaIds.map(aId => {
                      const atleta = atletas.find(a => a.id === aId);
                      const inscAtleta = inscsEvento.filter(i => i.atletaId === aId);
                      return (
                        <div key={aId} style={{ background: "#0D0E14", border: "1px solid #1E2130", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{atleta?.nome || "—"}</span>
                            <span style={s.badge(atleta?.sexo === "M" ? "#88aaff" : "#ff88cc")}>{atleta?.sexo === "M" ? "M" : "F"}</span>
                            <span style={s.badge("#1976D2")}>{inscAtleta[0]?.categoriaOficial || inscAtleta[0]?.categoria || "—"}</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {inscAtleta.map(i => (
                              <span key={i.id} style={{ background: "#0a1a0a", border: "1px solid #1a4a1a", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#7acc44" }}>
                                {i.provaNome || i.provaId}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })
          )}
        </div>
      )}

      {/* ── ABA: COMPETIÇÕES ── */}
      {abaAtiva === "eventos" && (
        <div style={s.card}>
          <div style={s.secTitle}>🏟️ Competições com inscrições abertas</div>
          {eventosAbertos.length === 0 ? (
            <div style={s.emptyState}>
              <span style={{ fontSize: 40 }}>🏟️</span>
              <p>Nenhuma competição com inscrições abertas no momento.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {eventosAbertos.map(ev => {
                const nInscsNosso = minhasInscs.filter(i => i.eventoId === ev.id).length;
                const status = getStatusEvento(ev);
                return (
                  <div key={ev.id} style={{ background: "#0a0b14", border: "1px solid #1E2130", borderRadius: 10, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, flex: 1, marginRight: 8 }}>{ev.nome}</div>
                      <span style={s.eventoStatusBadge(status)}>{labelStatusEvento(status)}</span>
                    </div>
                    <div style={{ color: "#666", fontSize: 12, marginBottom: 8 }}>
                      {ev.data ? `📅 ${new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}
                      {ev.local ? ` · 📍 ${ev.local}` : ""}
                    </div>
                    {ev.dataEncerramentoInscricoes && (
                      <div style={{ color: "#ffaa44", fontSize: 11, marginBottom: 10 }}>
                        ⚠️ Inscrições até {new Date(ev.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}
                      </div>
                    )}
                    {nInscsNosso > 0 && (
                      <div style={{ color: "#7acc44", fontSize: 11, marginBottom: 10 }}>
                        ✓ {nInscsNosso} inscrição(ões) da equipe
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={async () => { selecionarEvento(ev.id); setTela("gestao-inscricoes"); }}
                        style={{ ...s.btn, padding: "7px 16px", fontSize: 12 }}>
                        📝 Inscrever atletas
                      </button>
                      <button onClick={async () => { selecionarEvento(ev.id); setTela("evento-detalhe"); }}
                        style={{ ...s.btnGhost, padding: "7px 14px", fontSize: 12 }}>
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ABA: TREINADORES ── */}
      {abaAtiva === "treinadores" && (
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={s.secTitle}>👨‍🏫 Treinadores</div>
            <button style={s.btn} onClick={() => setTela("treinadores")}>Gerenciar →</button>
          </div>
          {meusTrein.length === 0 ? (
            <div style={s.emptyState}>
              <span style={{ fontSize: 40 }}>👨‍🏫</span>
              <p>Nenhum treinador cadastrado</p>
              <button style={s.btn} onClick={() => setTela("treinadores")}>+ Adicionar treinador</button>
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr><Th>Nome</Th><Th>E-mail</Th><Th>Fone</Th></tr></thead>
                <tbody>
                  {meusTrein.map(t => (
                    <tr key={t.id} style={s.tr}>
                      <Td><strong style={{ color: "#fff" }}>{t.nome}</strong></Td>
                      <Td style={{ fontSize: 12 }}>{t.email || "—"}</Td>
                      <Td style={{ fontSize: 12 }}>{t.fone || "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ABA: RESULTADOS ── */}
      {abaAtiva === "resultados" && (
        <div>
          {/* Nota informativa */}
          <div style={{ background: "#0d0e12", border: "1px solid #252837", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 12, color: "#666", lineHeight: 1.6 }}>
            ℹ️ Esta exibição é meramente informativa e não constitui relatório oficial de participação. O relatório oficial é de responsabilidade do organizador da competição.
          </div>

          {/* Solicitar relatório */}
          {solicitarRelatorio && eventosComInsc.length > 0 && (
            <div style={{ background:"#0f1118", border:"1px solid #252837", borderRadius:10, padding:16, marginBottom:20 }}>
              <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:14, fontWeight:700, color:"#88cccc", marginBottom:12, letterSpacing:1 }}>
                SOLICITAR RELATÓRIO OFICIAL
              </div>

              {/* Seleção de competição */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, flexWrap:"wrap" }}>
                <select value={relEvId} onChange={e => { setRelEvId(e.target.value); setRelPreview(false); setRelEnviado(false); }}
                  style={{ background:"#141720", border:"1px solid #252837", borderRadius:6, padding:"8px 12px", color:"#fff", fontSize:12, flex:1, minWidth:200 }}>
                  <option value="">— Selecione competição —</option>
                  {eventosComInsc.map(ev => <option key={ev.id} value={ev.id}>{ev.nome}</option>)}
                </select>
              </div>

              {/* Aviso se já existe solicitação ativa */}
              {relEvId && (() => {
                const solExistente = (solicitacoesRelatorio||[]).find(s => s.equipeId === equipeId && s.eventoId === relEvId && (s.status === "pendente" || s.status === "gerado"));
                if (!solExistente) return null;
                return (
                  <div style={{ fontSize:11, color: solExistente.status === "pendente" ? "#ff8844" : "#7cfc7c", background: solExistente.status === "pendente" ? "#1a1200" : "#0a1a0a", border:"1px solid", borderColor: solExistente.status === "pendente" ? "#3a2a00" : "#1a3a1a", borderRadius:6, padding:"8px 12px", marginBottom:12 }}>
                    {solExistente.status === "pendente"
                      ? "Já existe uma solicitação pendente para esta competição. Aguarde o organizador processar ou cancele a solicitação no histórico abaixo."
                      : "O relatório para esta competição já foi gerado. Consulte o histórico abaixo."}
                  </div>
                );
              })()}

              {/* Upload de assinatura/logo */}
              {relEvId && !relEnviado && !(solicitacoesRelatorio||[]).some(s => s.equipeId === equipeId && s.eventoId === relEvId && (s.status === "pendente" || s.status === "gerado")) && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:"#888", marginBottom:6 }}>Assinatura / Logo da equipe (opcional):</div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    <label style={{ background:"#1a1a2e", border:"1px solid #333", borderRadius:6, padding:"6px 14px", cursor:"pointer", fontSize:11, color:"#aaa" }}>
                      Escolher imagem...
                      <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 500_000) { alert("Imagem muito grande (máx. 500KB)"); return; }
                        const reader = new FileReader();
                        reader.onload = (ev) => setRelAssinatura(ev.target.result);
                        reader.readAsDataURL(f);
                      }} />
                    </label>
                    {relAssinatura && (
                      <>
                        <img src={relAssinatura} alt="Assinatura" style={{ maxHeight:40, maxWidth:120, objectFit:"contain", borderRadius:4, border:"1px solid #333" }} />
                        <button onClick={() => setRelAssinatura("")} style={{ background:"transparent", border:"1px solid #7a2a2a", borderRadius:4, color:"#cc4444", fontSize:10, padding:"3px 8px", cursor:"pointer" }}>
                          Remover
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Preview / Confirmação */}
              {relEvId && !relEnviado && !relPreview && !(solicitacoesRelatorio||[]).some(s => s.equipeId === equipeId && s.eventoId === relEvId && (s.status === "pendente" || s.status === "gerado")) && (
                <button onClick={() => setRelPreview(true)}
                  style={{ background:"#1a3a3a", border:"1px solid #3a7a7a", color:"#88cccc", borderRadius:6, padding:"8px 16px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Barlow Condensed', sans-serif" }}>
                  Visualizar antes de enviar
                </button>
              )}

              {relPreview && !relEnviado && (() => {
                const ev = (eventos||[]).find(e => e.id === relEvId);
                if (!ev) return null;
                const atlEvt = meusAtletas.filter(a => (inscricoes||[]).some(i => i.atletaId === a.id && i.eventoId === ev.id));
                return (
                  <div style={{ background:"#141720", border:"1px solid #252837", borderRadius:8, padding:14, marginTop:8 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:8 }}>Confirmar solicitação</div>
                    <div style={{ fontSize:11, color:"#aaa", marginBottom:4 }}>Competição: <span style={{ color:"#fff" }}>{ev.nome}</span></div>
                    <div style={{ fontSize:11, color:"#aaa", marginBottom:4 }}>Equipe: <span style={{ color:"#fff" }}>{equipe?.nome || "—"}</span></div>
                    <div style={{ fontSize:11, color:"#aaa", marginBottom:4 }}>Atletas: <span style={{ color:"#fff" }}>{atlEvt.length}</span></div>
                    {relAssinatura && (
                      <div style={{ fontSize:11, color:"#aaa", marginBottom:4 }}>
                        Assinatura: <img src={relAssinatura} alt="" style={{ maxHeight:30, maxWidth:100, objectFit:"contain", verticalAlign:"middle", marginLeft:6, borderRadius:3, border:"1px solid #333" }} />
                      </div>
                    )}
                    <div style={{ display:"flex", gap:8, marginTop:10 }}>
                      <button onClick={() => {
                        solicitarRelatorio(equipeId, equipe?.nome || "", "equipe", ev.id, ev.nome, meusAtletas.map(a => a.id), equipeId, relAssinatura || null);
                        setRelEnviado(true); setRelPreview(false);
                        setTimeout(() => setRelEnviado(false), 5000);
                      }} style={{ background:"#1a3a1a", border:"1px solid #3a7a3a", color:"#7cfc7c", borderRadius:6, padding:"8px 18px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Barlow Condensed', sans-serif" }}>
                        Confirmar e enviar
                      </button>
                      <button onClick={() => setRelPreview(false)}
                        style={{ background:"transparent", border:"1px solid #333", color:"#888", borderRadius:6, padding:"8px 14px", cursor:"pointer", fontSize:11 }}>
                        Voltar
                      </button>
                    </div>
                  </div>
                );
              })()}

              {relEnviado && (
                <div style={{ color:"#7cfc7c", fontSize:12, fontWeight:700, marginTop:8 }}>
                  Solicitação enviada com sucesso! O organizador será notificado.
                </div>
              )}
            </div>
          )}

          {/* Histórico de relatórios */}
          {(solicitacoesRelatorio || []).filter(s => s.equipeId === equipeId).length > 0 && (
            <div style={{ marginBottom:20 }}>
              <button onClick={() => setRelHistAberto(!relHistAberto)}
                style={{ background:"transparent", border:"none", color:"#888", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:1, padding:0, marginBottom:8 }}>
                {relHistAberto ? "▾" : "▸"} HISTÓRICO DE RELATÓRIOS ({(solicitacoesRelatorio||[]).filter(s => s.equipeId === equipeId).length})
              </button>
              {relHistAberto && (
                <div style={{ background:"#0f1118", border:"1px solid #252837", borderRadius:8, overflow:"hidden" }}>
                  {(solicitacoesRelatorio||[])
                    .filter(s => s.equipeId === equipeId)
                    .sort((a,b) => new Date(b.data) - new Date(a.data))
                    .map(sol => {
                      const statusCor = { pendente:"#ff8844", gerado:"#7cfc7c", recusado:"#ff4444", cancelado:"#888" }[sol.status] || "#666";
                      const statusLabel = { pendente:"Pendente", gerado:"Gerado", recusado:"Recusado", cancelado:"Cancelado" }[sol.status] || sol.status;
                      return (
                        <div key={sol.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderBottom:"1px solid #1a1d2a", gap:10, flexWrap:"wrap" }}>
                          <div style={{ flex:1, minWidth:150 }}>
                            <div style={{ fontSize:12, color:"#ddd", fontWeight:600 }}>{sol.eventoNome}</div>
                            <div style={{ fontSize:10, color:"#666", marginTop:2 }}>
                              {new Date(sol.data).toLocaleDateString("pt-BR")} {new Date(sol.data).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })}
                              {sol.resolvidoEm && ` — resolvido em ${new Date(sol.resolvidoEm).toLocaleDateString("pt-BR")}`}
                            </div>
                          </div>
                          <span style={{ fontSize:10, fontWeight:700, color:statusCor, border:`1px solid ${statusCor}44`, borderRadius:4, padding:"2px 8px", whiteSpace:"nowrap" }}>
                            {statusLabel}
                          </span>
                          <div style={{ display:"flex", gap:6 }}>
                            {sol.status === "pendente" && cancelarRelatorio && (
                              <button onClick={() => cancelarRelatorio(sol.id)}
                                style={{ background:"transparent", border:"1px solid #7a5a00", borderRadius:4, color:"#cc9900", fontSize:10, padding:"3px 10px", cursor:"pointer" }}>
                                Cancelar
                              </button>
                            )}
                            {(sol.status !== "pendente") && excluirRelatorio && (
                              <button onClick={() => excluirRelatorio(sol.id)}
                                style={{ background:"transparent", border:"1px solid #7a2a2a", borderRadius:4, color:"#cc4444", fontSize:10, padding:"3px 10px", cursor:"pointer" }}>
                                Excluir
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Stats medalhas */}
          <div style={s.statsRow}>
            <StatCard value={medalhas.total} label="Resultados" />
            <StatCard value={medalhas.ouro} label="🥇 Ouro" color="#FFD700" />
            <StatCard value={medalhas.prata} label="🥈 Prata" color="#C0C0C0" />
            <StatCard value={medalhas.bronze} label="🥉 Bronze" color="#CD7F32" />
          </div>

          {/* Busca */}
          <input type="text" value={buscaRes} onChange={e => setBuscaRes(e.target.value)}
            placeholder="🔍 Buscar atleta..." style={s.input} />

          {resultadosEquipe.length === 0 ? (
            <div style={s.emptyState}>
              <span style={{ fontSize: 40 }}>🏆</span>
              <p>Nenhum resultado registrado para atletas da equipe.</p>
            </div>
          ) : (
            resultadosEquipe.map(({ ev, items }) => {
              const filtrados = buscaRes
                ? items.filter(l => l.atletaNome.toLowerCase().includes(buscaRes.toLowerCase()))
                : items;
              if (filtrados.length === 0) return null;
              return (
                <details key={ev.id} open style={{ background: "#0a0b14", border: "1px solid #1E2130", borderRadius: 10, marginBottom: 12, overflow: "hidden" }}>
                  <summary style={{ padding: "12px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ color: "#1976D2", fontWeight: 700, fontSize: 14 }}>🏟 {ev.nome}</span>
                    {ev.data && <span style={{ color: "#555", fontSize: 11 }}>📅 {new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>}
                    {ev.local && <span style={{ color: "#444", fontSize: 11 }}>· 📍 {ev.local}</span>}
                    <span style={s.badge("#1976D2")}>{filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}</span>
                  </summary>
                  <div style={{ padding: "0 12px 14px" }}>
                    <div style={s.tableWrap}>
                      <table style={s.table}>
                        <thead>
                          <tr><Th>Atleta</Th><Th>Prova</Th><Th>Marca</Th><Th>Posição</Th><Th>Categoria</Th></tr>
                        </thead>
                        <tbody>
                          {filtrados.map((l, idx) => (
                            <tr key={idx} style={s.tr}>
                              <Td><strong style={{ color: "#fff" }}>{l.atletaNome}</strong></Td>
                              <Td>{l.provaNome}</Td>
                              <Td>
                                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 800, color: l.isStatus ? "#555" : "#1976D2" }}>
                                  {l.marca}
                                </span>
                              </Td>
                              <Td>
                                <span style={{ fontWeight: 700, color: l.posicao != null && l.posicao <= 3 ? "#FFD700" : "#888" }}>
                                  {exibirPosicao(l.posicao)}
                                </span>
                              </Td>
                              <Td><span style={s.badge("#1976D2")}>{l.cat}</span></Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              );
            })
          )}
        </div>
      )}

      {/* ── ABA: VÍNCULOS ── */}
      {abaAtiva === "vinculos" && (
        <div>
          {vincPendentes.length > 0 && (
            <div style={{ background: "#0a1220", border: "1px solid #3a5a8a", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: "#88aaff", fontSize: 14, marginBottom: 12 }}>
                🔗 Solicitações de Vínculo — atletas pedindo para entrar
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead><tr><Th>Atleta</Th><Th>Data</Th><Th>Ação</Th></tr></thead>
                  <tbody>
                    {vincPendentes.map(sol => (
                      <tr key={sol.id} style={s.tr}>
                        <Td><strong style={{ color: "#fff" }}>{sol.atletaNome}</strong></Td>
                        <Td style={{ fontSize: 11, color: "#555" }}>{new Date(sol.data).toLocaleString("pt-BR")}</Td>
                        <Td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => responderVinculo(sol.id, true)}
                              style={{ ...s.btnGhost, fontSize: 12, padding: "4px 14px", color: "#7cfc7c", borderColor: "#2a5a2a" }}>✓ Aceitar</button>
                            <button onClick={() => responderVinculo(sol.id, false)}
                              style={{ ...s.btnGhost, fontSize: 12, padding: "4px 12px", color: "#ff6b6b", borderColor: "#5a1a1a" }}>✗ Recusar</button>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Solicitações de DESVINCULAÇÃO — atletas pedindo para sair ── */}
          {desvinculacaoPend.length > 0 && (
            <div style={{ background: "#120808", border: "1px solid #6a1a1a", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🚪</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#ff8888", fontSize: 14 }}>
                    Solicitações de Saída — atletas pedindo para sair da equipe
                  </div>
                  <div style={{ color: "#666", fontSize: 12, marginTop: 2 }}>
                    Aprovar libera o atleta. Os resultados históricos são sempre preservados.
                  </div>
                </div>
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead><tr><Th>Atleta</Th><Th>Inscrições</Th><Th>Data</Th><Th>Ação</Th></tr></thead>
                  <tbody>
                    {desvinculacaoPend.map(sol => {
                      const atletaObj = (atletas||[]).find(a => a.id === sol.atletaId);
                      const nInscricoes = inscricoes ? inscricoes.filter(i => i.atletaId === sol.atletaId).length : 0;
                      return (
                        <tr key={sol.id} style={s.tr}>
                          <Td>
                            <div>
                              <strong style={{ color: "#fff" }}>{sol.atletaNome}</strong>
                              {atletaObj?.clube && <div style={{ fontSize: 11, color: "#666" }}>{atletaObj.clube}</div>}
                            </div>
                          </Td>
                          <Td>
                            <span style={{ fontSize: 12, color: "#888" }}>
                              {nInscricoes > 0
                                ? <><span style={{ color: "#1976D2", fontWeight: 700 }}>{nInscricoes}</span> inscr. — serão preservadas</>
                                : "Nenhuma inscrição"}
                            </span>
                          </Td>
                          <Td style={{ fontSize: 11, color: "#555" }}>{new Date(sol.data).toLocaleString("pt-BR")}</Td>
                          <Td>
                            <div style={{ display: "flex", gap: 6, flexDirection: "column", maxWidth: 220 }}>
                              <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5, marginBottom: 4 }}>
                                ✅ Resultados e inscrições históricas são preservados ao aprovar.
                              </div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  onClick={async () => {
                                    if (!await confirmar(
                                      `Aprovar saída de "${sol.atletaNome }" da equipe?

` +
                                      `✅ O atleta será desvinculado.
` +
                                      (nInscricoes > 0 ? `✅ ${nInscricoes} inscrição(ões) histórica(s) serão preservadas.
` : "") +
                                      `✅ Resultados em competições não são alterados.

` +
                                      `Deseja aprovar?`
                                    )) return;
                                    responderVinculo(sol.id, true);
                                  }}
                                  style={{ ...s.btnGhost, fontSize: 12, padding: "4px 14px", color: "#7cfc7c", borderColor: "#2a5a2a" }}>
                                  ✓ Aprovar saída
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!await confirmar(
                                      `Recusar o pedido de saída de "${sol.atletaNome }"?

` +
                                      `O atleta continuará vinculado à equipe.

` +
                                      `Deseja recusar?`
                                    )) return;
                                    responderVinculo(sol.id, false);
                                  }}
                                  style={{ ...s.btnGhost, fontSize: 12, padding: "4px 12px", color: "#ff6b6b", borderColor: "#5a1a1a" }}>
                                  ✗ Recusar
                                </button>
                              </div>
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

                    {transferenciasPend.length > 0 && (
            <div style={{ background: "#1a0a1a", border: "1px solid #6a3a8a", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: "#cc88ff", fontSize: 14, marginBottom: 8 }}>
                🔄 Transferências — outra equipe quer um atleta seu
              </div>
              <p style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>
                Aprovar libera o atleta para a nova equipe.
              </p>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead><tr><Th>Atleta</Th><Th>Solicitante</Th><Th>Nova Equipe</Th><Th>Data</Th><Th>Ação</Th></tr></thead>
                  <tbody>
                    {transferenciasPend.map(sol => {
                      const novaEquipe = equipes?.find(e => e.id === sol.equipeId);
                      return (
                        <tr key={sol.id} style={s.tr}>
                          <Td><strong style={{ color: "#fff" }}>{sol.atletaNome}</strong></Td>
                          <Td style={{ fontSize: 12, color: "#aaa" }}>{sol.solicitanteNome || "—"}</Td>
                          <Td style={{ color: "#cc88ff", fontSize: 13 }}>{novaEquipe?.nome || sol.clube || "—"}</Td>
                          <Td style={{ fontSize: 11, color: "#555" }}>{new Date(sol.data).toLocaleString("pt-BR")}</Td>
                          <Td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => responderVinculo(sol.id, true)}
                                style={{ ...s.btnGhost, fontSize: 12, padding: "4px 14px", color: "#7cfc7c", borderColor: "#2a5a2a" }}>✓ Aprovar</button>
                              <button onClick={() => responderVinculo(sol.id, false)}
                                style={{ ...s.btnGhost, fontSize: 12, padding: "4px 12px", color: "#ff6b6b", borderColor: "#5a1a1a" }}>✗ Recusar</button>
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

          {/* Histórico */}
          {(() => {
            const hist = (solicitacoesVinculo||[]).filter(sol =>
              (sol.equipeId === equipeId || sol.equipeAtualId === equipeId) && sol.status !== "pendente"
            ).sort((a,b) => new Date(b.resolvidoEm||b.data) - new Date(a.resolvidoEm||a.data)).slice(0,30);
            if (hist.length === 0) return null;
            return (
              <details style={{ background: "#0a0a10", border: "1px solid #1E2130", borderRadius: 10, padding: "12px 18px" }}>
                <summary style={{ cursor: "pointer", color: "#666", fontSize: 13, fontWeight: 600 }}>
                  📂 Histórico ({hist.length})
                </summary>
                <div style={{ marginTop: 12, overflowX: "auto" }}>
                  <table style={s.table}>
                    <thead><tr><Th>Atleta</Th><Th>Tipo</Th><Th>Status</Th><Th>Resolvido por</Th><Th>Data</Th></tr></thead>
                    <tbody>
                      {hist.map(sol => {
                        const cor = sol.status === "aceito" ? "#7cfc7c" : "#ff6b6b";
                        return (
                          <tr key={sol.id} style={s.tr}>
                            <Td><strong style={{ color: "#fff" }}>{sol.atletaNome}</strong></Td>
                            <Td style={{ fontSize: 11 }}>{sol.tipo === "desvinculacao" ? "🚪 Saída" : sol.aprovadorTipo === "equipe_atual" ? "🔄 Transferência" : "🔗 Vínculo"}</Td>
                            <Td><span style={{ background: cor+"22", color: cor, border: `1px solid ${cor}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{sol.status === "aceito" ? "✓ Aceito" : "✗ Recusado"}</span></Td>
                            <Td style={{ fontSize: 11, color: "#888" }}>{sol.resolvidoPorNome || "—"} {sol.resolvidoPorTipo ? `(${sol.resolvidoPorTipo})` : ""}</Td>
                            <Td style={{ fontSize: 11, color: "#555" }}>{sol.resolvidoEm ? new Date(sol.resolvidoEm).toLocaleString("pt-BR") : new Date(sol.data).toLocaleString("pt-BR")}</Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })()}
        </div>
      )}
    </div>
  );
}
