import React, { useState, useMemo } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { getCategoria, CATEGORIAS } from "../../shared/constants/categorias";
import { getStatusEvento, labelStatusEvento } from "../eventos/eventoHelpers";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { getFasesModo, resKey } from "../../shared/constants/fases";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";

function getS(t) {
  return {
  page:       { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  title:      { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: t.textPrimary, marginBottom: 6, letterSpacing: 1 },
  secTitle:   { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 14, letterSpacing: 1 },
  card:       { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24, marginBottom: 24 },
  statCard:   { background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 12, padding: "18px 24px", textAlign: "center", minWidth: 100 },
  statVal:    { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: t.accent, lineHeight: 1, marginBottom: 6 },
  statLabel:  { fontSize: 12, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase" },
  statsRow:   { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 },
  tableWrap:  { overflowX: "auto", borderRadius: 10, border: `1px solid ${t.border}` },
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { background: t.bgHeaderSolid, padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` },
  td:         { padding: "10px 14px", fontSize: 13, color: t.textSecondary, borderBottom: `1px solid ${t.border}` },
  tr:         { transition: "background 0.15s" },
  btn:        { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "10px 22px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnSec:     { background: "transparent", color: t.accent, border: `2px solid ${t.accentBorder}`, padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost:   { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  input:      { width: "100%", background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "8px 12px", color: t.textSecondary, fontSize: 13, outline: "none", marginBottom: 8 },
  badge:      (c) => ({ background: c+"22", color: c, border: `1px solid ${c}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  emptyState: { textAlign: "center", padding: "40px 20px", color: t.textDisabled, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontSize: 14 },
  eventoStatusBadge: (s) => ({
    display: "inline-block", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
    background: s === "ao_vivo" ? `${t.danger}18` : s === "hoje_pre" ? `${t.accent}18` : s === "futuro" ? `${t.success}18` : t.bgCardAlt,
    color:      s === "ao_vivo" ? t.danger : s === "hoje_pre" ? t.accent  : s === "futuro" ? t.success  : t.textDisabled,
    border: `1px solid ${s === "ao_vivo" ? `${t.danger}44` : s === "hoje_pre" ? `${t.accent}44` : s === "futuro" ? `${t.success}44` : t.border}`,
  }),
};
}

function Th({ children, style }) {
  const t = useTema();
  const s = useStylesResponsivos(getS(t));
  return <th style={{ ...s.th, ...style }}>{children}</th>;
}
function Td({ children, style }) {
  const t = useTema();
  const s = useStylesResponsivos(getS(t));
  return <td style={{ ...s.td, ...style }}>{children}</td>;
}
function StatCard({ value, label, color }) {
  const t = useTema();
  if (!color) color = t.accent;
  const s = useStylesResponsivos(getS(t));
  return (
    <div style={{ ...s.statCard }}>
      <div style={{ ...s.statVal, color }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

import { SinoNotificacoes } from "../ui/SinoNotificacoes";
import { useTema } from "../../shared/TemaContext";

export default function TelaPainelEquipe() {
  const { usuarioLogado, logout } = useAuth();
  const { atletas, inscricoes, eventos, equipes, resultados, selecionarEvento, solicitarVinculo } = useEvento();
  const { setTela, treinadores, solicitarRelatorio, solicitacoesRelatorio, cancelarRelatorio, excluirRelatorio, solicitacoesVinculo, setAtletaEditandoId, notificacoes, marcarNotifLida, historicoAcoes } = useApp();
  const t = useTema();
  const s = useStylesResponsivos(getS(t));
  const confirmar = useConfirm();
  const isTreinador = usuarioLogado?.tipo === "treinador";
  const equipeId    = isTreinador ? usuarioLogado?.equipeId : usuarioLogado?.id;
  const equipe      = equipes?.find(e => e.id === equipeId) || usuarioLogado;

  const [abaAtiva, setAbaAtiva] = useState("visao-geral");
  const [buscaAtl, setBuscaAtl] = useState("");
  const [paginaAtl, setPaginaAtl] = useState(1);
  const [filtroSexoAtl, setFiltroSexoAtl] = useState("todos");
  const [filtroCatAtl, setFiltroCatAtl] = useState("todas");
  const atlPorPagina = 20;
  const [pagVinc, setPagVinc] = useState(1);
  const [buscaAudit, setBuscaAudit] = useState("");
  const [filtroModulo, setFiltroModulo] = useState("todos");
  const [paginaAudit, setPaginaAudit] = useState(1);
  const auditPorPagina = 20;
  const [buscaRes, setBuscaRes] = useState("");
  const [relEvId, setRelEvId] = useState("");
  const [relEnviado, setRelEnviado] = useState(false);
  const [relAssinatura, setRelAssinatura] = useState("");
  const [relPreview, setRelPreview] = useState(false);
  const [relHistAberto, setRelHistAberto] = useState(false);

  const anoBase = new Date().getFullYear();
  const meusAtletas   = (atletas  || []).filter(a => a.equipeId === equipeId);
  const meusAtletaIds = useMemo(() => new Set(meusAtletas.map(a => a.id)), [meusAtletas]);
  const meusTrein     = (treinadores || []).filter(tr => tr.equipeId === equipeId);

  // Inscrições da equipe — respeita snapshot de equipe para eventos encerrados
  // Eventos encerrados: usa equipeCadastroId (equipe no momento da inscrição)
  // Eventos ativos: usa equipeId atual do atleta
  const eventoStatusCache = useMemo(() => {
    const cache = {};
    (eventos || []).forEach(ev => { cache[ev.id] = getStatusEvento(ev); });
    return cache;
  }, [eventos]);
  const minhasInscs = useMemo(() =>
    (inscricoes || []).filter(insc => {
      const status = eventoStatusCache[insc.eventoId];
      if (status === "encerrado") {
        // Evento encerrado: pertence à equipe que inscreveu
        if (insc.equipeCadastroId) return insc.equipeCadastroId === equipeId;
        // Fallback legado (sem equipeCadastroId): usa equipeId atual
        return meusAtletaIds.has(insc.atletaId);
      }
      // Evento ativo: pertence à equipe atual do atleta
      return meusAtletaIds.has(insc.atletaId);
    }),
    [inscricoes, eventoStatusCache, equipeId, meusAtletaIds]
  );

  // Vínculos pendentes para esta equipe responder
  const vincPendentes      = (solicitacoesVinculo||[]).filter(sol => sol.equipeId === equipeId && sol.status === "pendente" && sol.aprovadorTipo !== "equipe_atual" && sol.tipo !== "desvinculacao");
  const desvinculacaoPend  = (solicitacoesVinculo||[]).filter(sol => sol.equipeId === equipeId && sol.status === "pendente" && sol.tipo === "desvinculacao");
  const transferenciasPend = (solicitacoesVinculo||[]).filter(sol => sol.equipeAtualId === equipeId && sol.status === "pendente" && sol.tipo !== "desvinculacao");
  const totalPendentes     = vincPendentes.length + transferenciasPend.length + desvinculacaoPend.length;

  // Eventos com inscrições da equipe
  const eventosComInsc = useMemo(() => (eventos||[]).filter(ev => minhasInscs.some(i => i.eventoId === ev.id)), [eventos, minhasInscs]);

  // Eventos abertos para inscrição (apenas do meu organizador ou com participação cruzada)
  const meuOrgId = equipe?.organizadorId || null;
  const eventosAbertos = useMemo(() =>
    (eventos||[]).filter(ev => {
      if (ev.inscricoesEncerradas) return false;
      if (!meuOrgId) return true;
      if (ev.organizadorId === meuOrgId) return true;
      if ((ev.orgsAutorizadas || []).includes(meuOrgId)) return true;
      return false;
    }).sort((a,b) => (a.data||"").localeCompare(b.data||"")),
    [eventos, meuOrgId]
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
      const catId = insc.categoriaId || insc.categoriaOficialId;
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
    { id: "visao-geral",  label: "Visão Geral" },
    { id: "atletas",      label: `Atletas (${meusAtletas.length})` },
    { id: "inscricoes",   label: `Inscrições (${minhasInscs.length})` },
    { id: "eventos",      label: `Competições (${eventosAbertos.length} abertas)` },
    { id: "resultados",   label: `Resultados (${medalhas.total})` },
    { id: "treinadores",  label: `Treinadores (${meusTrein.length})` },
    { id: "vinculos", label: totalPendentes > 0 ? `Vínculos (${totalPendentes})` : "Vínculos", ...(totalPendentes > 0 ? { badge: true } : {}) },
    { id: "auditoria",   label: "Auditoria" },
  ];

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={s.title}>{equipe?.nome || "Painel da Equipe"}</h1>
          <div style={{ color: t.textDimmed, fontSize: 13 }}>
            {equipe?.sigla && <span>{equipe.sigla} · </span>}
            {equipe?.cidade && <span>{equipe.cidade}{equipe.estado ? `, ${equipe.estado}` : ""} · </span>}
            Logado como <strong style={{ color: t.textTertiary }}>{usuarioLogado?.nome}</strong>
          </div>
        </div>
        <SinoNotificacoes
          notificacoes={notificacoes}
          usuarioId={usuarioLogado?.id}
          marcarNotifLida={marcarNotifLida}
          tiposExcluidos={["medals_ready", "relatorio_solicitado"]}
        />
      </div>

      {/* Stats gerais */}
      <div style={s.statsRow}>
        <StatCard value={meusAtletas.length} label="Atletas" />
        <StatCard value={minhasInscs.length} label="Inscrições" color={t.success} />
        <StatCard value={meusTrein.length} label="Treinadores" color={t.accent} />
        <StatCard value={eventosAbertos.length} label="Eventos abertos" color={t.danger} />
        {totalPendentes > 0 && <StatCard value={totalPendentes} label="Vínculos pendentes" color="#ffaa44" />}
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 0, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24, flexWrap: "wrap" }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAbaAtiva(a.id)}
            style={{ background: abaAtiva === a.id ? t.bgInput : "transparent", border: "none", color: abaAtiva === a.id ? t.accent : t.textDimmed, padding: "11px 20px", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", position: "relative", fontWeight: a.badge ? 700 : 400 }}>
            {a.label}
            {a.badge && <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: t.warning }} />}
          </button>
        ))}
      </div>

      {/* ── ABA: VISÃO GERAL ── */}
      {abaAtiva === "visao-geral" && (
        <div>
          {/* Alertas de vínculos pendentes */}
          {totalPendentes > 0 && (
            <div style={{ background: `${t.warning}12`, border: `1px solid ${t.warning}66`, borderRadius: 10, padding: "14px 18px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <span style={{ color: t.warning, fontWeight: 700 }}>🔔 {totalPendentes} solicitação(ões) de vínculo aguardando aprovação do organizador</span>
              </div>
              <button onClick={() => setAbaAtiva("vinculos")} style={{ ...s.btn, background: t.warning, padding: "6px 16px", fontSize: 12 }}>
                Ver agora →
              </button>
            </div>
          )}

          {/* Últimas inscrições */}
          {eventosComInsc.length > 0 && (
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={s.secTitle}>Competições com inscrições</div>
                <button onClick={() => setAbaAtiva("inscricoes")} style={{ ...s.btnGhost, fontSize: 12, padding: "5px 14px" }}>Ver tudo →</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {eventosComInsc.slice(0, 6).map(ev => {
                  const nInscs = minhasInscs.filter(i => i.eventoId === ev.id).length;
                  const status = getStatusEvento(ev);
                  return (
                    <div key={ev.id} onClick={async () => { selecionarEvento(ev.id); setTela("gestao-inscricoes"); }}
                      style={{ background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 8, padding: "12px 16px", cursor: "pointer", minWidth: 200 }}>
                      <div style={{ color: t.textPrimary, fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{ev.nome}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={s.eventoStatusBadge(status)}>{labelStatusEvento(status)}</span>
                        <span style={{ color: t.success, fontSize: 11 }}>{nInscs} inscrição(ões)</span>
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
                <div style={s.secTitle}>Competições com inscrições abertas</div>
                <button onClick={() => setAbaAtiva("eventos")} style={{ ...s.btnGhost, fontSize: 12, padding: "5px 14px" }}>Ver todas →</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {eventosAbertos.slice(0, 4).map(ev => (
                  <div key={ev.id} style={{ background: `${t.success}10`, border: `1px solid ${t.success}44`, borderRadius: 8, padding: "12px 16px", flex: 1, minWidth: 180 }}>
                    <div style={{ color: t.textPrimary, fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{ev.nome}</div>
                    <div style={{ color: t.textMuted, fontSize: 11, marginBottom: 8 }}>
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
          {/* Header com título e botões */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={s.secTitle}>Atletas da Equipe</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={s.btn} onClick={() => setTela("cadastrar-atleta-novo")}>+ Cadastrar</button>
              <button style={s.btnSec} onClick={() => setTela("importar-atletas")}>Importar Planilha</button>
            </div>
          </div>

          {/* Contadores */}
          {meusAtletas.length > 0 && (
            <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: t.textMuted, padding: "4px 10px", background: t.bgCardAlt, borderRadius: 6, border: `1px solid ${t.border}` }}>
                Total: <strong style={{ color: t.textPrimary }}>{meusAtletas.length}</strong>
              </span>
              <span style={{ fontSize: 12, color: "#1a6ef5", padding: "4px 10px", background: "#1a6ef512", borderRadius: 6, border: "1px solid #1a6ef533" }}>
                Masc: <strong>{meusAtletas.filter(a => a.sexo === "M").length}</strong>
              </span>
              <span style={{ fontSize: 12, color: "#e54f9b", padding: "4px 10px", background: "#e54f9b12", borderRadius: 6, border: "1px solid #e54f9b33" }}>
                Fem: <strong>{meusAtletas.filter(a => a.sexo === "F").length}</strong>
              </span>
            </div>
          )}

          {/* Busca + Filtros */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            <input type="text" value={buscaAtl} onChange={e => { setBuscaAtl(e.target.value); setPaginaAtl(1); }}
              placeholder="🔍 Buscar nome, CPF..." style={{ ...s.input, flex: 1, minWidth: 180, marginBottom: 0 }} />
            <select value={filtroSexoAtl} onChange={e => { setFiltroSexoAtl(e.target.value); setPaginaAtl(1); }}
              style={{ ...s.input, width: "auto", minWidth: 100, marginBottom: 0 }}>
              <option value="todos">Todos</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
            <select value={filtroCatAtl} onChange={e => { setFiltroCatAtl(e.target.value); setPaginaAtl(1); }}
              style={{ ...s.input, width: "auto", minWidth: 110, marginBottom: 0 }}>
              <option value="todas">Todas categorias</option>
              {CATEGORIAS.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>

          {meusAtletas.length === 0 ? (
            <div style={s.emptyState}>
              <span style={{ fontSize: 40 }}>👤</span>
              <p>Nenhum atleta cadastrado</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                <button style={s.btn} onClick={() => setTela("cadastrar-atleta-novo")}>+ Cadastrar primeiro atleta</button>
                <button style={s.btnSec} onClick={() => setTela("importar-atletas")}>Importar Planilha</button>
              </div>
            </div>
          ) : (() => {
            const filtrados = meusAtletas.filter(a => {
              if (filtroSexoAtl !== "todos" && a.sexo !== filtroSexoAtl) return false;
              if (filtroCatAtl !== "todas") {
                const cat = getCategoria(a.anoNasc, anoBase);
                if (!cat || cat.id !== filtroCatAtl) return false;
              }
              if (!buscaAtl) return true;
              const b = buscaAtl.toLowerCase();
              return (a.nome||"").toLowerCase().includes(b) || (a.cpf||"").includes(buscaAtl.replace(/\D/g,""));
            });
            const totalPaginas = Math.ceil(filtrados.length / atlPorPagina);
            const paginados = filtrados.slice((paginaAtl - 1) * atlPorPagina, paginaAtl * atlPorPagina);
            return (
              <>
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead><tr><Th>Nome</Th><Th>Sexo</Th><Th>Categoria</Th><Th>CPF</Th><Th></Th></tr></thead>
                    <tbody>
                      {paginados.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: t.textDimmed, fontSize: 13 }}>Nenhum atleta encontrado com os filtros aplicados.</td></tr>
                      ) : paginados.map(a => {
                        const cat = getCategoria(a.anoNasc, anoBase);
                        return (
                          <tr key={a.id} style={s.tr}>
                            <Td><strong style={{ color: t.textPrimary }}>{a.nome}</strong></Td>
                            <Td><span style={s.badge(a.sexo === "M" ? t.accent : "#ff88cc")}>{a.sexo === "M" ? "Masc." : "Fem."}</span></Td>
                            <Td><span style={s.badge(t.accent)}>{cat?.nome || "—"}</span></Td>
                            <Td style={{ fontSize: 11, color: t.textDimmed }}>{a.cpf || "—"}</Td>
                            <Td>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button style={{ background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textTertiary, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}
                                  onClick={async () => { setAtletaEditandoId(a.id); setTela("editar-atleta"); }}>
                                  Editar
                                </button>
                                <button style={{ background: `${t.danger}12`, border: `1px solid ${t.danger}44`, color: t.danger, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}
                                  onClick={async () => {
                                    if (await confirmar(`Solicitar desvinculação de ${a.nome || "este atleta"}?\n\nA desvinculação será efetivada após aprovação do organizador.`)) {
                                      solicitarVinculo(a.id, a.nome, equipeId, equipe?.nome || "", {
                                        tipo: "desvinculacao",
                                        origem: "equipe",
                                        organizadorId: equipe?.organizadorId || null,
                                        solicitanteId: usuarioLogado?.id,
                                        solicitanteNome: usuarioLogado?.nome || equipe?.nome || "",
                                      });
                                    }
                                  }}>
                                  Solicitar Desvinculação
                                </button>
                              </div>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPaginas > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 12 }}>
                    <button disabled={paginaAtl <= 1} onClick={() => setPaginaAtl(paginaAtl - 1)}
                      style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.textSecondary, borderRadius: 6, padding: "4px 12px", cursor: paginaAtl <= 1 ? "default" : "pointer", fontSize: 12, opacity: paginaAtl <= 1 ? 0.4 : 1 }}>
                      Anterior
                    </button>
                    <span style={{ fontSize: 12, color: t.textMuted }}>
                      {paginaAtl} / {totalPaginas} ({filtrados.length} atletas)
                    </span>
                    <button disabled={paginaAtl >= totalPaginas} onClick={() => setPaginaAtl(paginaAtl + 1)}
                      style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.textSecondary, borderRadius: 6, padding: "4px 12px", cursor: paginaAtl >= totalPaginas ? "default" : "pointer", fontSize: 12, opacity: paginaAtl >= totalPaginas ? 0.4 : 1 }}>
                      Próxima
                    </button>
                  </div>
                )}
              </>
            );
          })()}
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
                <details key={ev.id} open style={{ background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 12, overflow: "hidden" }}>
                  <summary style={{ padding: "12px 18px", cursor: "pointer", color: t.accent, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span>{ev.nome}</span>
                    <span style={s.badge(t.success)}>{inscsEvento.length} inscrição(ões)</span>
                    <span style={{ color: t.textDimmed, fontSize: 11, fontWeight: 400 }}>
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
                        <div key={aId} style={{ background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ color: t.textPrimary, fontWeight: 600, fontSize: 13 }}>{atleta?.nome || "—"}</span>
                            <span style={s.badge(atleta?.sexo === "M" ? t.accent : "#ff88cc")}>{atleta?.sexo === "M" ? "M" : "F"}</span>
                            <span style={s.badge(t.accent)}>{inscAtleta[0]?.categoriaOficial || inscAtleta[0]?.categoria || "—"}</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {inscAtleta.map(i => (
                              <span key={i.id} style={{ background: `${t.success}10`, border: `1px solid ${t.success}33`, borderRadius: 6, padding: "2px 8px", fontSize: 11, color: t.success }}>
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
              <span style={{ fontSize: 16, color: t.textDisabled }}>—</span>
              <p>Nenhuma competição com inscrições abertas no momento.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {eventosAbertos.map(ev => {
                const nInscsNosso = minhasInscs.filter(i => i.eventoId === ev.id).length;
                const status = getStatusEvento(ev);
                return (
                  <div key={ev.id} style={{ background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ color: t.textPrimary, fontWeight: 700, fontSize: 15, flex: 1, marginRight: 8 }}>{ev.nome}</div>
                      <span style={s.eventoStatusBadge(status)}>{labelStatusEvento(status)}</span>
                    </div>
                    <div style={{ color: t.textDimmed, fontSize: 12, marginBottom: 8 }}>
                      {ev.data ? `📅 ${new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}
                      {ev.local ? ` · 📍 ${ev.local}` : ""}
                    </div>
                    {ev.dataEncerramentoInscricoes && (
                      <div style={{ color: t.warning, fontSize: 11, marginBottom: 10 }}>
                        Inscrições até {new Date(ev.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}
                      </div>
                    )}
                    {nInscsNosso > 0 && (
                      <div style={{ color: t.success, fontSize: 11, marginBottom: 10 }}>
                        {nInscsNosso} inscrição(ões) da equipe
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={s.secTitle}>Treinadores ({meusTrein.length})</div>
            {!isTreinador && (
              <div style={{ display: "flex", gap: 8 }}>
                <button style={s.btn} onClick={() => setTela("treinadores-novo")}>+ Adicionar</button>
                {meusTrein.length > 0 && <button style={s.btnGhost} onClick={() => setTela("treinadores")}>Gerenciar</button>}
              </div>
            )}
          </div>
          {meusTrein.length === 0 ? (
            <div style={s.emptyState}>
              <span style={{ fontSize: 16, color: t.textDisabled }}>—</span>
              <p>Nenhum treinador cadastrado</p>
              {!isTreinador && <button style={s.btn} onClick={() => setTela("treinadores-novo")}>+ Adicionar treinador</button>}
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr><Th>Nome</Th><Th>E-mail</Th><Th>Cargo</Th><Th>Permissões</Th><Th>Status</Th></tr></thead>
                <tbody>
                  {meusTrein.map(tr => (
                    <tr key={tr.id} style={{ ...s.tr, opacity: tr.ativo === false ? 0.45 : 1 }}>
                      <Td><strong style={{ color: t.textPrimary }}>{tr.nome}</strong></Td>
                      <Td style={{ fontSize: 12 }}>{tr.email || "—"}</Td>
                      <Td style={{ fontSize: 12, color: t.textTertiary }}>{tr.cargo || "—"}</Td>
                      <Td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {(tr.permissoes || []).length === 0
                            ? <span style={{ color: t.textDisabled, fontSize: 10 }}>Sem permissões</span>
                            : (tr.permissoes || []).map(pid => (
                              <span key={pid} style={{ background: `${t.success}18`, color: t.success, fontSize: 9, padding: "1px 6px", borderRadius: 3, fontWeight: 600 }}>
                                {pid.replace(/_/g, " ")}
                              </span>
                            ))
                          }
                        </div>
                      </Td>
                      <Td>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                          background: tr.ativo === false ? `${t.danger}18` : `${t.success}10`,
                          color: tr.ativo === false ? t.danger : t.success }}>
                          {tr.ativo === false ? "Inativo" : "Ativo"}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ABA: AUDITORIA ── */}
      {abaAtiva === "auditoria" && (() => {
        const meuHistorico = (historicoAcoes || []).filter(h => h.equipeId === equipeId);
        const modulosPresentes = [...new Set(meuHistorico.map(h => h.modulo).filter(Boolean))].sort();
        const MODULO_LABELS = {
          auth: "Acesso", atletas: "Atletas", equipes: "Equipe", treinadores: "Treinadores",
          inscricoes: "Inscrições", resultados: "Resultados", relatorios: "Relatórios",
          competicoes: "Competições", recordes: "Recordes", secretaria: "Secretaria", sistema: "Sistema",
        };
        const MODULO_ICONS = {};
        const filtrados = meuHistorico.filter(h => {
          if (filtroModulo !== "todos" && h.modulo !== filtroModulo) return false;
          if (!buscaAudit) return true;
          const b = buscaAudit.toLowerCase();
          return (h.nomeUsuario || "").toLowerCase().includes(b) || (h.acao || "").toLowerCase().includes(b) || (h.detalhe || "").toLowerCase().includes(b);
        });
        const totalPags = Math.ceil(filtrados.length / auditPorPagina);
        const paginados = filtrados.slice((paginaAudit - 1) * auditPorPagina, paginaAudit * auditPorPagina);

        return (
          <div style={s.card}>
            <div style={s.secTitle}>📜 Auditoria</div>
            <p style={{ color: t.textDimmed, fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>
              Registro de todas as ações realizadas na equipe — cadastros, edições, exclusões, inscrições, treinadores, relatórios e acessos.
            </p>

            {/* Contadores por módulo */}
            {meuHistorico.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: t.textMuted, padding: "3px 8px", background: t.bgCardAlt, borderRadius: 5, border: `1px solid ${t.border}` }}>
                  Total: <strong style={{ color: t.textPrimary }}>{meuHistorico.length}</strong>
                </span>
                {modulosPresentes.map(mod => (
                  <span key={mod} style={{ fontSize: 11, padding: "3px 8px", background: t.bgCardAlt, borderRadius: 5, border: `1px solid ${t.border}`, cursor: "pointer", fontWeight: filtroModulo === mod ? 700 : 400, borderColor: filtroModulo === mod ? t.accent : t.border, color: filtroModulo === mod ? t.accent : t.textTertiary }}
                    onClick={() => { setFiltroModulo(filtroModulo === mod ? "todos" : mod); setPaginaAudit(1); }}>
                    {MODULO_ICONS[mod] || "📌"} {MODULO_LABELS[mod] || mod}: <strong>{meuHistorico.filter(h => h.modulo === mod).length}</strong>
                  </span>
                ))}
              </div>
            )}

            {/* Busca */}
            <input type="text" value={buscaAudit} onChange={e => { setBuscaAudit(e.target.value); setPaginaAudit(1); }}
              placeholder="🔍 Buscar ação, usuário, detalhe..." style={{ ...s.input, marginBottom: 12 }} />

            {filtrados.length === 0 ? (
              <div style={s.emptyState}>
                <span style={{ fontSize: 40 }}>📜</span>
                <p>Nenhuma ação registrada{filtroModulo !== "todos" || buscaAudit ? " com os filtros aplicados" : ""}.</p>
              </div>
            ) : (
              <>
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead><tr><Th>Data / Hora</Th><Th>Usuário</Th><Th>Módulo</Th><Th>Ação</Th><Th>Detalhe</Th></tr></thead>
                    <tbody>
                      {paginados.map(h => (
                        <tr key={h.id} style={s.tr}>
                          <Td style={{ fontSize: 11, color: t.textDimmed, whiteSpace: "nowrap" }}>
                            {new Date(h.data).toLocaleString("pt-BR")}
                          </Td>
                          <Td><span style={{ color: t.accent, fontSize: 12, fontWeight: 600 }}>{h.nomeUsuario || "—"}</span></Td>
                          <Td>
                            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: t.bgCardAlt, border: `1px solid ${t.border}`, color: t.textTertiary, fontWeight: 600 }}>
                              {MODULO_ICONS[h.modulo] || "📌"} {MODULO_LABELS[h.modulo] || h.modulo || "—"}
                            </span>
                          </Td>
                          <Td><strong style={{ color: t.textPrimary, fontSize: 12 }}>{h.acao}</strong></Td>
                          <Td style={{ color: t.textMuted, fontSize: 12, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>{h.detalhe || "—"}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPags > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 12 }}>
                    <button disabled={paginaAudit <= 1} onClick={() => setPaginaAudit(paginaAudit - 1)}
                      style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.textSecondary, borderRadius: 6, padding: "4px 12px", cursor: paginaAudit <= 1 ? "default" : "pointer", fontSize: 12, opacity: paginaAudit <= 1 ? 0.4 : 1 }}>
                      Anterior
                    </button>
                    <span style={{ fontSize: 12, color: t.textMuted }}>
                      {paginaAudit} / {totalPags} ({filtrados.length} registros)
                    </span>
                    <button disabled={paginaAudit >= totalPags} onClick={() => setPaginaAudit(paginaAudit + 1)}
                      style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.textSecondary, borderRadius: 6, padding: "4px 12px", cursor: paginaAudit >= totalPags ? "default" : "pointer", fontSize: 12, opacity: paginaAudit >= totalPags ? 0.4 : 1 }}>
                      Próxima
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* ── ABA: RESULTADOS ── */}
      {abaAtiva === "resultados" && (
        <div>
          {/* Nota informativa */}
          <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 12, color: t.textDimmed, lineHeight: 1.6 }}>
            Esta exibição é meramente informativa e não constitui relatório oficial de participação. O relatório oficial é de responsabilidade do organizador da competição.
          </div>

          {/* Solicitar relatório */}
          {solicitarRelatorio && eventosComInsc.length > 0 && (
            <div style={{ background:t.bgCard, border:`1px solid ${t.borderInput}`, borderRadius:10, padding:16, marginBottom:20 }}>
              <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:14, fontWeight:700, color:t.accent, marginBottom:12, letterSpacing:1 }}>
                SOLICITAR RELATÓRIO OFICIAL
              </div>

              {/* Seleção de competição */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, flexWrap:"wrap" }}>
                <select value={relEvId} onChange={e => { setRelEvId(e.target.value); setRelPreview(false); setRelEnviado(false); }}
                  style={{ background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:6, padding:"8px 12px", color: t.textPrimary, fontSize:12, flex:1, minWidth:200 }}>
                  <option value="">— Selecione competição —</option>
                  {eventosComInsc.map(ev => <option key={ev.id} value={ev.id}>{ev.nome}</option>)}
                </select>
              </div>

              {/* Aviso se já existe solicitação ativa */}
              {relEvId && (() => {
                const solExistente = (solicitacoesRelatorio||[]).find(s => s.equipeId === equipeId && s.eventoId === relEvId && (s.status === "pendente" || s.status === "gerado"));
                if (!solExistente) return null;
                return (
                  <div style={{ fontSize:11, color: solExistente.status === "pendente" ? t.warning : t.success, background: solExistente.status === "pendente" ? `${t.warning}12` : `${t.success}10`, border:"1px solid", borderColor: solExistente.status === "pendente" ? `${t.warning}44` : `${t.success}33`, borderRadius:6, padding:"8px 12px", marginBottom:12 }}>
                    {solExistente.status === "pendente"
                      ? "Já existe uma solicitação pendente para esta competição. Aguarde o organizador processar ou cancele a solicitação no histórico abaixo."
                      : "O relatório para esta competição já foi gerado. Consulte o histórico abaixo."}
                  </div>
                );
              })()}

              {/* Upload de assinatura/logo */}
              {relEvId && !relEnviado && !(solicitacoesRelatorio||[]).some(s => s.equipeId === equipeId && s.eventoId === relEvId && (s.status === "pendente" || s.status === "gerado")) && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color: t.textMuted, marginBottom:6 }}>Assinatura / Logo da equipe (opcional):</div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    <label style={{ background:t.bgCardAlt, border:`1px solid ${t.border}`, borderRadius:6, padding:"6px 14px", cursor:"pointer", fontSize:11, color: t.textTertiary }}>
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
                        <img src={relAssinatura} alt="Assinatura" style={{ maxHeight:40, maxWidth:120, objectFit:"contain", borderRadius:4, border:`1px solid ${t.border}` }} />
                        <button onClick={() => setRelAssinatura("")} style={{ background:"transparent", border:`1px solid ${t.danger}66`, borderRadius:4, color:t.danger, fontSize:10, padding:"3px 8px", cursor:"pointer" }}>
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
                  style={{ background:`${t.accent}18`, border:`1px solid ${t.accent}44`, color:t.accent, borderRadius:6, padding:"8px 16px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Barlow Condensed', sans-serif" }}>
                  Visualizar antes de enviar
                </button>
              )}

              {relPreview && !relEnviado && (() => {
                const ev = (eventos||[]).find(e => e.id === relEvId);
                if (!ev) return null;
                const atlEvt = meusAtletas.filter(a => (inscricoes||[]).some(i => i.atletaId === a.id && i.eventoId === ev.id));
                return (
                  <div style={{ background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:8, padding:14, marginTop:8 }}>
                    <div style={{ fontSize:13, fontWeight:700, color: t.textPrimary, marginBottom:8 }}>Confirmar solicitação</div>
                    <div style={{ fontSize:11, color: t.textTertiary, marginBottom:4 }}>Competição: <span style={{ color: t.textPrimary }}>{ev.nome}</span></div>
                    <div style={{ fontSize:11, color: t.textTertiary, marginBottom:4 }}>Equipe: <span style={{ color: t.textPrimary }}>{equipe?.nome || "—"}</span></div>
                    <div style={{ fontSize:11, color: t.textTertiary, marginBottom:4 }}>Atletas: <span style={{ color: t.textPrimary }}>{atlEvt.length}</span></div>
                    {relAssinatura && (
                      <div style={{ fontSize:11, color: t.textTertiary, marginBottom:4 }}>
                        Assinatura: <img src={relAssinatura} alt="" style={{ maxHeight:30, maxWidth:100, objectFit:"contain", verticalAlign:"middle", marginLeft:6, borderRadius:3, border:`1px solid ${t.border}` }} />
                      </div>
                    )}
                    <div style={{ display:"flex", gap:8, marginTop:10 }}>
                      <button onClick={() => {
                        solicitarRelatorio(equipeId, equipe?.nome || "", "equipe", ev.id, ev.nome, meusAtletas.map(a => a.id), equipeId, relAssinatura || null);
                        setRelEnviado(true); setRelPreview(false);
                        setTimeout(() => setRelEnviado(false), 5000);
                      }} style={{ background:`${t.success}18`, border:`1px solid ${t.success}44`, color:t.success, borderRadius:6, padding:"8px 18px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Barlow Condensed', sans-serif" }}>
                        Confirmar e enviar
                      </button>
                      <button onClick={() => setRelPreview(false)}
                        style={{ background:"transparent", border:`1px solid ${t.border}`, color: t.textMuted, borderRadius:6, padding:"8px 14px", cursor:"pointer", fontSize:11 }}>
                        Voltar
                      </button>
                    </div>
                  </div>
                );
              })()}

              {relEnviado && (
                <div style={{ color:t.success, fontSize:12, fontWeight:700, marginTop:8 }}>
                  Solicitação enviada com sucesso! O organizador será notificado.
                </div>
              )}
            </div>
          )}

          {/* Histórico de relatórios */}
          {(solicitacoesRelatorio || []).filter(s => s.equipeId === equipeId).length > 0 && (
            <div style={{ marginBottom:20 }}>
              <button onClick={() => setRelHistAberto(!relHistAberto)}
                style={{ background:"transparent", border:"none", color: t.textMuted, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:1, padding:0, marginBottom:8 }}>
                {relHistAberto ? "▾" : "▸"} HISTÓRICO DE RELATÓRIOS ({(solicitacoesRelatorio||[]).filter(s => s.equipeId === equipeId).length})
              </button>
              {relHistAberto && (
                <div style={{ background:t.bgCard, border:`1px solid ${t.borderInput}`, borderRadius:8, overflow:"hidden" }}>
                  {(solicitacoesRelatorio||[])
                    .filter(s => s.equipeId === equipeId)
                    .sort((a,b) => new Date(b.data) - new Date(a.data))
                    .map(sol => {
                      const statusCor = { pendente:t.warning, gerado:t.success, recusado:t.danger, cancelado:t.textMuted }[sol.status] || t.textDimmed;
                      const statusLabel = { pendente:"Pendente", gerado:"Gerado", recusado:"Recusado", cancelado:"Cancelado" }[sol.status] || sol.status;
                      return (
                        <div key={sol.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderBottom:`1px solid ${t.border}`, gap:10, flexWrap:"wrap" }}>
                          <div style={{ flex:1, minWidth:150 }}>
                            <div style={{ fontSize:12, color:t.textSecondary, fontWeight:600 }}>{sol.eventoNome}</div>
                            <div style={{ fontSize:10, color: t.textDimmed, marginTop:2 }}>
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
                                style={{ background:"transparent", border:`1px solid ${t.warning}66`, borderRadius:4, color:t.warning, fontSize:10, padding:"3px 10px", cursor:"pointer" }}>
                                Cancelar
                              </button>
                            )}
                            {(sol.status !== "pendente") && excluirRelatorio && (
                              <button onClick={() => excluirRelatorio(sol.id)}
                                style={{ background:"transparent", border:`1px solid ${t.danger}66`, borderRadius:4, color:t.danger, fontSize:10, padding:"3px 10px", cursor:"pointer" }}>
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
            <StatCard value={medalhas.ouro} label="🥇 Ouro" color={t.gold} />
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
                <details key={ev.id} open style={{ background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 12, overflow: "hidden" }}>
                  <summary style={{ padding: "12px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ color: t.accent, fontWeight: 700, fontSize: 14 }}>🏟 {ev.nome}</span>
                    {ev.data && <span style={{ color: t.textDimmed, fontSize: 11 }}>📅 {new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>}
                    {ev.local && <span style={{ color: t.textDisabled, fontSize: 11 }}>· 📍 {ev.local}</span>}
                    <span style={s.badge(t.accent)}>{filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}</span>
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
                              <Td><strong style={{ color: t.textPrimary }}>{l.atletaNome}</strong></Td>
                              <Td>{l.provaNome}</Td>
                              <Td>
                                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 800, color: l.isStatus ? t.textDisabled : t.accent }}>
                                  {l.marca}
                                </span>
                              </Td>
                              <Td>
                                <span style={{ fontWeight: 700, color: l.posicao != null && l.posicao <= 3 ? t.gold : t.textMuted }}>
                                  {exibirPosicao(l.posicao)}
                                </span>
                              </Td>
                              <Td><span style={s.badge(t.accent)}>{l.cat}</span></Td>
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
            <div style={{ background: `${t.accent}10`, border: `1px solid ${t.accent}44`, borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: t.accent, fontSize: 14, marginBottom: 8 }}>
                Solicitações de Vínculo — atletas pedindo para entrar
              </div>
              <div style={{ color: t.textMuted, fontSize: 12, marginBottom: 12 }}>
                A aprovação é feita pelo organizador.
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead><tr><Th>Atleta</Th><Th>Data</Th><Th>Status</Th></tr></thead>
                  <tbody>
                    {vincPendentes.map(sol => (
                      <tr key={sol.id} style={s.tr}>
                        <Td><strong style={{ color: t.textPrimary }}>{sol.atletaNome}</strong></Td>
                        <Td style={{ fontSize: 11, color: t.textDimmed }}>{new Date(sol.data).toLocaleString("pt-BR")}</Td>
                        <Td><span style={{ fontSize: 11, color: t.warning, fontWeight: 600 }}>Aguardando organizador</span></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Solicitações de DESVINCULAÇÃO — atletas pedindo para sair ── */}
          {desvinculacaoPend.length > 0 && (
            <div style={{ background: `${t.danger}10`, border: `1px solid ${t.danger}44`, borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>🚪</span>
                <div>
                  <div style={{ fontWeight: 700, color: t.danger, fontSize: 14 }}>
                    Solicitações de Saída — atletas pedindo para sair da equipe
                  </div>
                  <div style={{ color: t.textDimmed, fontSize: 12, marginTop: 2 }}>
                    A aprovação é feita pelo organizador. Os resultados históricos são sempre preservados.
                  </div>
                </div>
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead><tr><Th>Atleta</Th><Th>Inscrições</Th><Th>Data</Th><Th>Status</Th></tr></thead>
                  <tbody>
                    {desvinculacaoPend.map(sol => {
                      const atletaObj = (atletas||[]).find(a => a.id === sol.atletaId);
                      const nInscricoes = inscricoes ? inscricoes.filter(i => i.atletaId === sol.atletaId).length : 0;
                      return (
                        <tr key={sol.id} style={s.tr}>
                          <Td>
                            <div>
                              <strong style={{ color: t.textPrimary }}>{sol.atletaNome}</strong>
                              {atletaObj?.clube && <div style={{ fontSize: 11, color: t.textDimmed }}>{atletaObj.clube}</div>}
                            </div>
                          </Td>
                          <Td>
                            <span style={{ fontSize: 12, color: t.textMuted }}>
                              {nInscricoes > 0
                                ? <><span style={{ color: t.accent, fontWeight: 700 }}>{nInscricoes}</span> inscr. — serão preservadas</>
                                : "Nenhuma inscrição"}
                            </span>
                          </Td>
                          <Td style={{ fontSize: 11, color: t.textDimmed }}>{new Date(sol.data).toLocaleString("pt-BR")}</Td>
                          <Td><span style={{ fontSize: 11, color: t.warning, fontWeight: 600 }}>Aguardando organizador</span></Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

                    {transferenciasPend.length > 0 && (
            <div style={{ background: `${t.warning}10`, border: `1px solid ${t.warning}44`, borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: t.warning, fontSize: 14, marginBottom: 8 }}>
                🔄 Transferências — outra equipe quer um atleta seu
              </div>
              <p style={{ color: t.textMuted, fontSize: 12, marginBottom: 12 }}>
                A aprovação é feita pelo organizador.
              </p>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead><tr><Th>Atleta</Th><Th>Solicitante</Th><Th>Nova Equipe</Th><Th>Data</Th><Th>Status</Th></tr></thead>
                  <tbody>
                    {transferenciasPend.map(sol => {
                      const novaEquipe = equipes?.find(e => e.id === sol.equipeId);
                      return (
                        <tr key={sol.id} style={s.tr}>
                          <Td><strong style={{ color: t.textPrimary }}>{sol.atletaNome}</strong></Td>
                          <Td style={{ fontSize: 12, color: t.textTertiary }}>{sol.solicitanteNome || "—"}</Td>
                          <Td style={{ color: t.warning, fontSize: 13 }}>{novaEquipe?.nome || sol.clube || "—"}</Td>
                          <Td style={{ fontSize: 11, color: t.textDimmed }}>{new Date(sol.data).toLocaleString("pt-BR")}</Td>
                          <Td><span style={{ fontSize: 11, color: t.warning, fontWeight: 600 }}>Aguardando organizador</span></Td>
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
            ).sort((a,b) => new Date(b.resolvidoEm||b.data) - new Date(a.resolvidoEm||a.data));
            if (hist.length === 0 && totalPendentes === 0) return (
              <div style={{ textAlign: "center", padding: "40px 20px", color: t.textDimmed }}>
                <span style={{ fontSize: 36 }}>🔗</span>
                <p style={{ fontSize: 13, marginTop: 12 }}>Nenhuma solicitação de vínculo registrada.</p>
              </div>
            );
            if (hist.length === 0) return null;
            const porPag = 10;
            const totalPags = Math.ceil(hist.length / porPag);
            const paginados = hist.slice((pagVinc - 1) * porPag, pagVinc * porPag);
            return (
              <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 18px" }}>
                <div style={{ color: t.textDimmed, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                  Histórico ({hist.length})
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={s.table}>
                    <thead><tr><Th>Atleta</Th><Th>Tipo</Th><Th>Status</Th><Th>Resolvido por</Th><Th>Data</Th></tr></thead>
                    <tbody>
                      {paginados.map(sol => {
                        const cor = sol.status === "aceito" ? t.success : t.danger;
                        return (
                          <tr key={sol.id} style={s.tr}>
                            <Td><strong style={{ color: t.textPrimary }}>{sol.atletaNome}</strong></Td>
                            <Td style={{ fontSize: 11 }}>{sol.tipo === "desvinculacao" ? "🚪 Saída" : sol.aprovadorTipo === "equipe_atual" ? "🔄 Transferência" : "🔗 Vínculo"}</Td>
                            <Td><span style={{ background: cor+"22", color: cor, border: `1px solid ${cor}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{sol.status === "aceito" ? "✓ Aceito" : "✗ Recusado"}</span></Td>
                            <Td style={{ fontSize: 11, color: t.textMuted }}>{sol.resolvidoPorNome || "—"} {sol.resolvidoPorTipo ? `(${sol.resolvidoPorTipo})` : ""}</Td>
                            <Td style={{ fontSize: 11, color: t.textDimmed }}>{sol.resolvidoEm ? new Date(sol.resolvidoEm).toLocaleString("pt-BR") : new Date(sol.data).toLocaleString("pt-BR")}</Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPags > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 12 }}>
                    <button disabled={pagVinc <= 1} onClick={() => setPagVinc(pagVinc - 1)}
                      style={{ ...s.btnGhost, fontSize: 11, padding: "4px 12px", opacity: pagVinc <= 1 ? 0.4 : 1 }}>← Anterior</button>
                    <span style={{ fontSize: 12, color: t.textDimmed }}>{pagVinc} / {totalPags}</span>
                    <button disabled={pagVinc >= totalPags} onClick={() => setPagVinc(pagVinc + 1)}
                      style={{ ...s.btnGhost, fontSize: 11, padding: "4px 12px", opacity: pagVinc >= totalPags ? 0.4 : 1 }}>Próxima →</button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
