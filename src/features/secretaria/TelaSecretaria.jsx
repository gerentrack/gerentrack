import React, { useState, useMemo } from "react";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { CATEGORIAS, getCategoria } from "../../shared/constants/categorias";
import { resKey, getFasesProva, FASE_ORDEM } from "../../shared/constants/fases";
import { abreviarProva } from "../../shared/formatters/utils";
import { useMedalhasChamada } from "../../hooks/useMedalhasChamada";

// ── Constantes ────────────────────────────────────────────────────────────────
const STATUS_CHAMADA = {
  ausente:    { label: "Ausente",    cor: "#444",    bg: "#141720", next: "presente"   },
  presente:   { label: "Presente",   cor: "#1976D2", bg: "#0a1220", next: "confirmado" },
  confirmado: { label: "Confirmado", cor: "#7acc44", bg: "#061206", next: "ausente"    },
};

const MEDALHA_CONFIG = {
  ouro:        { label: "Ouro",         emoji: "🥇", cor: "#FFD700", bg: "#1a170a" },
  prata:       { label: "Prata",        emoji: "🥈", cor: "#C0C0C0", bg: "#121518" },
  bronze:      { label: "Bronze",       emoji: "🥉", cor: "#CD7F32", bg: "#14100a" },
  participacao:{ label: "Participação", emoji: "🎖️", cor: "#888",    bg: "#111318" },
};

const STATUS_DNS = ["DNS", "DNF", "DQ", "NM"];

const fmtDataHora = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const styles = {
  page:       { maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" },
  header:     { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 },
  title:      { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: 1 },
  sub:        { color: "#555", fontSize: 14, marginTop: 4 },
  tabs:       { display: "flex", gap: 0, background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, overflow: "hidden", marginBottom: 28, width: "fit-content" },
  tab:        { padding: "10px 24px", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, cursor: "pointer", border: "none", background: "transparent", color: "#555" },
  tabActive:  { background: "#1976D2", color: "#fff" },
  card:       { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, marginBottom: 16, overflow: "hidden" },
  cardHead:   { padding: "14px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  cardTitle:  { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: 1 },
  cardMeta:   { display: "flex", gap: 8, alignItems: "center" },
  badge:      (cor) => ({ background: cor + "22", color: cor, border: `1px solid ${cor}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }),
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { background: "#0D0E12", padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1E2130" },
  td:         { padding: "10px 14px", fontSize: 13, color: "#bbb", borderBottom: "1px solid #12141a" },
  btn:        (cor, bg) => ({ background: bg, border: `1px solid ${cor}44`, color: cor, borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5, whiteSpace: "nowrap" }),
  btnDisabled:{ background: "#111318", border: "1px solid #1a1a2a", color: "#333", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5, whiteSpace: "nowrap", cursor: "not-allowed" },
  btnGhost:   { background: "transparent", color: "#888", border: "1px solid #2a2d3a", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  selectEvento: { background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px 14px", color: "#E0E0E0", fontSize: 14, outline: "none", marginBottom: 0 },
  empty:      { textAlign: "center", padding: "48px 20px", color: "#444", fontSize: 14 },
  pill:       (cor, bg) => ({ display: "inline-block", background: bg, color: cor, border: `1px solid ${cor}33`, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 700 }),
  horario:    { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 800, color: "#1976D2" },
  nomeAtleta: { fontWeight: 600, color: "#fff", fontSize: 13 },
  entregue:   { color: "#7acc44", fontSize: 11, fontStyle: "italic" },
  entregueInfo:{ color: "#555", fontSize: 10, fontStyle: "italic", lineHeight: 1.5 },
};

// ── Componente principal ──────────────────────────────────────────────────────
function TelaSecretaria({ setTela, eventoAtual, inscricoes, atletas, resultados, usuarioLogado }) {
  const [aba, setAba] = useState("chamada");
  const [filtroProva, setFiltroProva] = useState("");
  const [limiteParticipacao, setLimiteParticipacao] = useState(1);
  const [classificacaoBloqueiaParticipacao, setClassificacaoBloqueiaParticipacao] = useState(true);

  const eid = eventoAtual?.id;
  const anoComp = eventoAtual?.data ? new Date(eventoAtual.data + "T12:00:00").getFullYear() : new Date().getFullYear();

  const {
    loading,
    atualizarPresenca, getPresenca, getPresencaProva,
    marcarEntrega, getMedalha, medalhas,
  } = useMedalhasChamada(eid);

  // ── Derivar lista de provas com atletas inscritos ─────────────────────────
  const provasComAtletas = useMemo(() => {
    if (!eventoAtual || !inscricoes || !atletas) return [];

    const inscsEvt = inscricoes.filter(i =>
      i.eventoId === eid && i.tipo !== "revezamento" && !i.combinadaId
    );

    const todas = todasAsProvas();
    const progHorario = eventoAtual.programaHorario || {};

    // Agrupar por prova+cat+sexo
    const grupos = {};
    inscsEvt.forEach(insc => {
      const atl = atletas.find(a => a.id === insc.atletaId);
      if (!atl) return;
      const cat = getCategoria(atl.anoNasc, anoComp);
      if (!cat) return;
      const prova = todas.find(p => p.id === insc.provaId);
      if (!prova) return;
      const key = `${insc.provaId}_${cat.id}_${insc.sexo || atl.sexo}`;
      if (!grupos[key]) {
        grupos[key] = { prova, cat, sexo: insc.sexo || atl.sexo, atletas: [], horario: null };
        // Buscar horário: tenta chave exata (detalhado) e chave-grupo (agrupado)
        let entries = progHorario[insc.provaId];
        if (!entries || !Array.isArray(entries)) {
          const catFnd = CATEGORIAS.find(c =>
            insc.provaId.endsWith(`_${c.id}`) || insc.provaId.includes(`_${c.id}_`)
          );
          if (catFnd) {
            const grupoKey = insc.provaId.replace(`_${catFnd.id}`, "");
            if (grupoKey !== insc.provaId) entries = progHorario[grupoKey];
          }
        }
        if (Array.isArray(entries) && entries[0]?.horario) {
          grupos[key].horario = entries[0].horario;
        }
      }
      grupos[key].atletas.push(atl);
      // Deduplicar por atletaId
      grupos[key].atletas = [...new Map(grupos[key].atletas.map(a => [a.id, a])).values()];
    });

    // Ordenar por horário → nome da prova
    return Object.values(grupos).sort((a, b) => {
      if (a.horario && b.horario) return a.horario.localeCompare(b.horario);
      if (a.horario) return -1;
      if (b.horario) return 1;
      return a.prova.nome.localeCompare(b.prova.nome, "pt-BR");
    });
  }, [eventoAtual, inscricoes, atletas, eid, anoComp]);

  const provasFiltradas = useMemo(() => {
    if (!filtroProva) return provasComAtletas;
    return provasComAtletas.filter(g => g.prova.id === filtroProva);
  }, [provasComAtletas, filtroProva]);

  // Medalhas: excluir provas componentes de combinada (origemCombinada=true)
  // — a medalha é apenas da classificação final da combinada
  const provasFiltradasMedalhas = useMemo(() =>
    provasFiltradas.filter(g => !g.prova.origemCombinada)
  , [provasFiltradas]);

  const provasUnicas = useMemo(() =>
    [...new Map(provasComAtletas.map(g => [g.prova.id, g.prova])).values()]
    , [provasComAtletas]);

  // ── Calcular classificação por prova para medalhas ────────────────────────
  const getClassificados = (prova, cat, sexo) => {
    // Busca a fase final (FIN) ou fase única
    const fases = getFasesProva(prova.id, eventoAtual?.programaHorario || {});
    const fasesOrdenadas = fases.length > 0
      ? [...fases].sort((a, b) => (FASE_ORDEM[b] || 0) - (FASE_ORDEM[a] || 0))
      : [null];

    for (const fase of fasesOrdenadas) {
      const key = resKey(eid, prova.id, cat.id, sexo, fase);
      const res = resultados?.[key];
      if (!res || Object.keys(res).length === 0) continue;

      const isMenor = prova.unidade === "s";
      const items = Object.entries(res)
        .map(([aId, raw]) => {
          const marca = typeof raw === "object" ? raw.marca : raw;
          const status = typeof raw === "object" ? (raw.status || "") : "";
          return { aId, marca, status };
        })
        .filter(({ marca, status }) => marca != null && !STATUS_DNS.includes(String(marca).toUpperCase()) && !STATUS_DNS.includes(status));

      items.sort((a, b) => {
        const va = parseFloat(String(a.marca).replace(",", "."));
        const vb = parseFloat(String(b.marca).replace(",", "."));
        return isMenor ? va - vb : vb - va;
      });

      return items;
    }
    return [];
  };

  const getTipoMedalha = (posicao, totalClassificados) => {
    if (posicao === 1) return "ouro";
    if (posicao === 2) return "prata";
    if (posicao === 3) return "bronze";
    return "participacao";
  };

  // Conta quantas medalhas de participação um atleta já recebeu neste evento
  const contarParticipacoes = (atletaId) => {
    return Object.entries(medalhas).filter(([key, val]) =>
      key.startsWith(eid + "_") &&
      key.endsWith("_" + atletaId) &&
      val.tipo === "participacao" &&
      val.entregue === true
    );
  };

  // Regra 1: atleta tem medalha de classificação entregue em qualquer prova do evento
  const temClassificacaoEntregue = (atletaId) => {
    return Object.entries(medalhas).some(([key, val]) =>
      key.startsWith(eid + "_") &&
      key.endsWith("_" + atletaId) &&
      val.tipo !== "participacao" &&
      val.entregue === true
    );
  };

  // Regra 2: provas em que o atleta está inscrito mas ainda sem resultado (nem DNS)
  // — impede entrega de participação antes da última prova ser concluída
  const provasPendentes = (atletaId) => {
    if (!inscricoes || !resultados) return [];
    const todas = todasAsProvas();
    const inscsAtleta = inscricoes.filter(i =>
      i.atletaId === atletaId &&
      i.eventoId === eid &&
      i.tipo !== "revezamento" &&
      !i.combinadaId
    );
    return inscsAtleta.reduce((acc, insc) => {
      const prova = todas.find(p => p.id === insc.provaId);
      if (!prova) return acc;
      const atl = atletas.find(a => a.id === atletaId);
      if (!atl) return acc;
      const cat = getCategoria(atl.anoNasc, anoComp);
      if (!cat) return acc;
      // Verifica se tem resultado (qualquer fase)
      const fases = getFasesProva(prova.id, eventoAtual?.programaHorario || {});
      const fasesCheck = fases.length > 0 ? fases : [null];
      const temRes = fasesCheck.some(fase => {
        const key = resKey(eid, prova.id, cat.id, insc.sexo || atl.sexo, fase);
        const res = resultados?.[key]?.[atletaId];
        if (!res) return false;
        const marca = typeof res === "object" ? res.marca : res;
        const status = typeof res === "object" ? (res.status || "") : "";
        // DNS/DNF/DQ conta como "concluído"
        return marca != null || STATUS_DNS.includes(status.toUpperCase());
      });
      if (!temRes) acc.push(prova.nome);
      return acc;
    }, []);
  };

  // ── Estatísticas rápidas ──────────────────────────────────────────────────
  const statsPresenca = useMemo(() => {
    let ausente = 0, presente = 0, confirmado = 0;
    provasComAtletas.forEach(({ prova, cat, sexo, atletas: atls }) => {
      atls.forEach(atl => {
        const estado = getPresenca(prova.id, cat.id, sexo, atl.id);
        if (estado === "presente") presente++;
        else if (estado === "confirmado") confirmado++;
        else ausente++;
      });
    });
    return { ausente, presente, confirmado, total: ausente + presente + confirmado };
  }, [provasComAtletas, getPresenca]);

  if (!eventoAtual) return (
    <div style={styles.page}>
      <div style={styles.empty}>Nenhum evento selecionado.</div>
    </div>
  );

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📋 SECRETARIA</h1>
          <div style={styles.sub}>{eventoAtual.nome}</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={filtroProva}
            onChange={e => setFiltroProva(e.target.value)}
            style={styles.selectEvento}
          >
            <option value="">Todas as provas</option>
            {provasUnicas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <button style={styles.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(aba === "chamada" ? styles.tabActive : {}) }}
          onClick={() => setAba("chamada")}
        >
          📋 CÂMARA DE CHAMADA
        </button>
        <button
          style={{ ...styles.tab, ...(aba === "medalhas" ? styles.tabActive : {}) }}
          onClick={() => setAba("medalhas")}
        >
          🏅 MEDALHAS
        </button>
        <button
          style={{ ...styles.tab, ...(aba === "relatorio" ? styles.tabActive : {}) }}
          onClick={() => setAba("relatorio")}
        >
          📊 RELATÓRIO
        </button>
      </div>

      {/* ── ABA: CÂMARA DE CHAMADA ─────────────────────────────────────────── */}
      {aba === "chamada" && (
        <>
          {/* Stats */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { label: "Total", valor: statsPresenca.total, cor: "#888" },
              { label: "Ausente", valor: statsPresenca.ausente, cor: "#ff6b6b" },
              { label: "Presente", valor: statsPresenca.presente, cor: "#1976D2" },
              { label: "Confirmado", valor: statsPresenca.confirmado, cor: "#7acc44" },
            ].map(s => (
              <div key={s.label} style={{ background: "#0E1016", border: `1px solid ${s.cor}33`, borderRadius: 10, padding: "12px 20px", textAlign: "center", minWidth: 90 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: s.cor }}>{s.valor}</div>
                <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {provasFiltradas.length === 0 && (
            <div style={styles.empty}>Nenhuma prova com atletas inscritos.</div>
          )}

          {provasFiltradas.map(({ prova, cat, sexo, atletas: atls, horario }) => {
            const presencaProva = getPresencaProva(prova.id, cat.id, sexo);
            const nConfirmados = Object.values(presencaProva).filter(v => v === "confirmado").length;
            const nPresentes   = Object.values(presencaProva).filter(v => v === "presente").length;

            return (
              <div key={`${prova.id}_${cat.id}_${sexo}`} style={styles.card}>
                <div style={styles.cardHead}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {horario && <span style={styles.horario}>{horario}</span>}
                    <span style={styles.cardTitle}>{prova.nome}</span>
                    <span style={styles.badge("#1976D2")}>{cat.nome}</span>
                    <span style={styles.badge(sexo === "M" ? "#1976D2" : "#e54f9b")}>{sexo === "M" ? "Masc" : "Fem"}</span>
                  </div>
                  <div style={styles.cardMeta}>
                    <span style={styles.pill("#7acc44", "#061206")}>{nConfirmados} confirmado(s)</span>
                    <span style={styles.pill("#1976D2", "#0a1220")}>{nPresentes} presente(s)</span>
                    <span style={{ color: "#555", fontSize: 12 }}>{atls.length} atleta(s)</span>
                  </div>
                </div>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Atleta</th>
                      <th style={styles.th}>Clube / Equipe</th>
                      <th style={{ ...styles.th, textAlign: "center", width: 160 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...atls].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map(atl => {
                      const estado = getPresenca(prova.id, cat.id, sexo, atl.id);
                      const conf = STATUS_CHAMADA[estado] || STATUS_CHAMADA.ausente;
                      return (
                        <tr key={`${prova.id}_${cat.id}_${sexo}_${atl.id}`} style={{ background: conf.bg }}>
                          <td style={styles.td}>
                            <span style={styles.nomeAtleta}>{atl.nome}</span>
                          </td>
                          <td style={{ ...styles.td, color: "#555", fontSize: 12 }}>{atl.clube || "—"}</td>
                          <td style={{ ...styles.td, textAlign: "center" }}>
                            <button
                              style={styles.btn(conf.cor, conf.bg)}
                              onClick={() => atualizarPresenca(prova.id, cat.id, sexo, atl.id, conf.next)}
                            >
                              {conf.label} →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </>
      )}

      {/* ── ABA: MEDALHAS ────────────────────────────────────────────────────── */}
      {aba === "medalhas" && (
        <>
          {/* Configuração de limite de participação */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, background: "#0E1016", border: "1px solid #1E2130", borderRadius: 10, padding: "14px 20px", flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: "#aaa" }}>
              🎖️ <strong style={{ color: "#fff" }}>Limite de medalhas de participação por atleta:</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setLimiteParticipacao(l => Math.max(1, l - 1))}
                style={{ background: "#141720", border: "1px solid #252837", color: "#888", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22, color: "#fff", minWidth: 28, textAlign: "center" }}>{limiteParticipacao}</span>
              <button onClick={() => setLimiteParticipacao(l => l + 1)}
                style={{ background: "#141720", border: "1px solid #252837", color: "#888", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
            <div style={{ fontSize: 11, color: "#444" }}>Atleta bloqueado ao atingir o limite em outras provas</div>
          </div>

          {/* Toggle: classificação bloqueia participação */}
          <label style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, background: "#0E1016", border: `1px solid ${classificacaoBloqueiaParticipacao ? "#2a6a2a" : "#1E2130"}`, borderRadius: 10, padding: "14px 20px", cursor: "pointer", flexWrap: "wrap" }}>
            <input
              type="checkbox"
              checked={classificacaoBloqueiaParticipacao}
              onChange={e => setClassificacaoBloqueiaParticipacao(e.target.checked)}
              style={{ width: 16, height: 16, cursor: "pointer" }}
            />
            <div>
              <div style={{ fontSize: 13, color: classificacaoBloqueiaParticipacao ? "#7acc44" : "#aaa", fontWeight: 600 }}>
                🏅 Classificação bloqueia participação
              </div>
              <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>
                {classificacaoBloqueiaParticipacao
                  ? "Atleta com ouro/prata/bronze entregue não recebe participação"
                  : "Atleta pode receber participação mesmo tendo classificação"}
              </div>
            </div>
          </label>

          <div style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>
            Posições calculadas automaticamente a partir dos resultados. Clique em "Entregar" para confirmar a entrega física.
          </div>

          {provasFiltradasMedalhas.length === 0 && (
            <div style={styles.empty}>Nenhuma prova com atletas inscritos.</div>
          )}

          {provasFiltradasMedalhas.map(({ prova, cat, sexo, atletas: atls, horario }) => {
            const classificados = getClassificados(prova, cat, sexo);
            const temResultados = classificados.length > 0;

            const atletasOrdenados = temResultados
              ? [
                  ...classificados.map(({ aId }, idx) => ({
                    atl: atletas.find(a => a.id === aId),
                    posicao: idx + 1,
                    tipoCalculado: getTipoMedalha(idx + 1),
                    temResultado: true,
                  })),
                  ...atls
                    .filter(a => !classificados.some(c => c.aId === a.id))
                    .map(a => ({ atl: a, posicao: null, tipoCalculado: null, temResultado: false })),
                ]
              : atls.map(a => ({ atl: a, posicao: null, tipoCalculado: null, temResultado: false }));

            const entregues = atletasOrdenados.filter(({ atl }) =>
              atl && getMedalha(prova.id, cat.id, sexo, atl.id).entregue
            ).length;

            return (
              <div key={`${prova.id}_${cat.id}_${sexo}`} style={styles.card}>
                <div style={styles.cardHead}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {horario && <span style={styles.horario}>{horario}</span>}
                    <span style={styles.cardTitle}>{prova.nome}</span>
                    <span style={styles.badge("#1976D2")}>{cat.nome}</span>
                    <span style={styles.badge(sexo === "M" ? "#1976D2" : "#e54f9b")}>{sexo === "M" ? "Masc" : "Fem"}</span>
                  </div>
                  <div style={styles.cardMeta}>
                    {!temResultados && (
                      <span style={styles.pill("#888", "#1a1a1a")}>⏳ Aguardando resultados</span>
                    )}
                    <span style={styles.pill("#7acc44", "#061206")}>{entregues}/{atls.length} entregues</span>
                  </div>
                </div>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, width: 44, textAlign: "center" }}>Pos.</th>
                      <th style={styles.th}>Atleta</th>
                      <th style={styles.th}>Clube / Equipe</th>
                      <th style={{ ...styles.th, textAlign: "center", width: 120 }}>Medalha</th>
                      <th style={{ ...styles.th, textAlign: "center", width: 180 }}>Entrega</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atletasOrdenados.map(({ atl, posicao, tipoCalculado }) => {
                      if (!atl) return null;
                      const medalha = getMedalha(prova.id, cat.id, sexo, atl.id);
                      const tipo = medalha.tipo || tipoCalculado;
                      const conf = tipo ? MEDALHA_CONFIG[tipo] : null;

                      // Verificar bloqueios de participação
                      const isParticipacao = tipo === "participacao";
                      const participacoesEntregues = contarParticipacoes(atl.id);
                      const jaAtigindoLimite = isParticipacao && !medalha.entregue
                        && participacoesEntregues.length >= limiteParticipacao;
                      const classificacaoBloqueio = isParticipacao && !medalha.entregue
                        && classificacaoBloqueiaParticipacao
                        && temClassificacaoEntregue(atl.id);
                      const pendentes = isParticipacao && !medalha.entregue && !classificacaoBloqueio && !jaAtigindoLimite
                        ? provasPendentes(atl.id).filter(nome => nome !== prova.nome)
                        : [];
                      const bloqueadoPorPendentes = pendentes.length > 0;

                      return (
                        <tr key={`${prova.id}_${cat.id}_${sexo}_${atl.id}`} style={{ background: conf ? conf.bg : undefined }}>
                          <td style={{ ...styles.td, textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 18, color: conf ? conf.cor : "#444" }}>
                            {posicao ? `${posicao}º` : "—"}
                          </td>
                          <td style={styles.td}>
                            <span style={styles.nomeAtleta}>{atl.nome}</span>
                          </td>
                          <td style={{ ...styles.td, color: "#555", fontSize: 12 }}>{atl.clube || "—"}</td>
                          <td style={{ ...styles.td, textAlign: "center" }}>
                            {conf ? (
                              <span style={styles.pill(conf.cor, conf.bg)}>
                                {conf.emoji} {conf.label}
                              </span>
                            ) : (
                              <span style={{ color: "#333", fontSize: 12 }}>—</span>
                            )}
                          </td>
                          <td style={{ ...styles.td, textAlign: "center" }}>
                            {tipo ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
                                {classificacaoBloqueio ? (
                                  <button style={styles.btnDisabled} disabled>
                                    🏅 Tem classificação
                                  </button>
                                ) : bloqueadoPorPendentes ? (
                                  <>
                                    <button style={styles.btnDisabled} disabled>
                                      ⏳ Provas pendentes
                                    </button>
                                    <span style={styles.entregueInfo}>
                                      {pendentes.slice(0, 2).join(", ")}{pendentes.length > 2 ? ` +${pendentes.length - 2}` : ""}
                                    </span>
                                  </>
                                ) : jaAtigindoLimite ? (
                                  <>
                                    <button style={styles.btnDisabled} disabled>
                                      🚫 Limite atingido
                                    </button>
                                    <span style={styles.entregueInfo}>
                                      {participacoesEntregues.length} de {limiteParticipacao} entregues
                                    </span>
                                  </>
                                ) : (
                                  <button
                                    style={{
                                      ...styles.btn(
                                        medalha.entregue ? "#7acc44" : "#888",
                                        medalha.entregue ? "#061206" : "#141720"
                                      ),
                                      minWidth: 120,
                                    }}
                                    onClick={() => marcarEntrega(
                                      prova.id, cat.id, sexo, atl.id, tipo,
                                      usuarioLogado?.id, usuarioLogado?.nome
                                    )}
                                  >
                                    {medalha.entregue ? "✅ Entregue" : "⬜ Entregar"}
                                  </button>
                                )}
                                {medalha.entregue && (
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                                    {medalha.entregueByNome && (
                                      <span style={styles.entregue}>por {medalha.entregueByNome}</span>
                                    )}
                                    {medalha.entregueEm && (
                                      <span style={styles.entregueInfo}>{fmtDataHora(medalha.entregueEm)}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: "#333", fontSize: 12 }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </>
      )}

      {/* ── ABA: RELATÓRIO ───────────────────────────────────────────────────── */}
      {aba === "relatorio" && (() => {
        // Calcular totais de medalhas por tipo
        const totais = { ouro: 0, prata: 0, bronze: 0, participacao: 0, pendentes: 0 };
        const porEquipe = {};

        provasFiltradasMedalhas.forEach(({ prova, cat, sexo, atletas: atls }) => {
          const classificados = getClassificados(prova, cat, sexo);
          const temRes = classificados.length > 0;

          const atletasOrdenados = temRes
            ? [
                ...classificados.map(({ aId }, idx) => ({ aId, tipo: getTipoMedalha(idx + 1) })),
                ...atls.filter(a => !classificados.some(c => c.aId === a.id)).map(a => ({ aId: a.id, tipo: "participacao" })),
              ]
            : atls.map(a => ({ aId: a.id, tipo: "participacao" }));

          atletasOrdenados.forEach(({ aId, tipo }) => {
            if (!tipo) return;
            const medalha = getMedalha(prova.id, cat.id, sexo, aId);
            const atl = atletas.find(a => a.id === aId);
            const equipe = atl?.clube || "Sem equipe";

            if (medalha.entregue) {
              totais[tipo] = (totais[tipo] || 0) + 1;
              if (!porEquipe[equipe]) porEquipe[equipe] = { ouro: 0, prata: 0, bronze: 0, participacao: 0 };
              porEquipe[equipe][tipo] = (porEquipe[equipe][tipo] || 0) + 1;
            } else {
              totais.pendentes++;
            }
          });
        });

        const totalEntregues = totais.ouro + totais.prata + totais.bronze + totais.participacao;
        const totalGeral = totalEntregues + totais.pendentes;

        return (
          <>
            {/* Cards de totais */}
            <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
              {[
                { tipo: "ouro",         label: "Ouro",         emoji: "🥇", cor: "#FFD700" },
                { tipo: "prata",        label: "Prata",        emoji: "🥈", cor: "#C0C0C0" },
                { tipo: "bronze",       label: "Bronze",       emoji: "🥉", cor: "#CD7F32" },
                { tipo: "participacao", label: "Participação", emoji: "🎖️", cor: "#888"    },
              ].map(({ tipo, label, emoji, cor }) => (
                <div key={tipo} style={{ background: "#0E1016", border: `1px solid ${cor}33`, borderRadius: 12, padding: "16px 24px", textAlign: "center", minWidth: 110 }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{emoji}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: cor, lineHeight: 1 }}>{totais[tipo]}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                </div>
              ))}
              <div style={{ background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "16px 24px", textAlign: "center", minWidth: 110 }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>⏳</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: "#ff6b6b", lineHeight: 1 }}>{totais.pendentes}</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>Pendentes</div>
              </div>
              <div style={{ background: "#0E1016", border: "1px solid #2a6a2a", borderRadius: 12, padding: "16px 24px", textAlign: "center", minWidth: 110, alignSelf: "center" }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: "#7acc44", letterSpacing: 1, marginBottom: 6 }}>TOTAL ENTREGUES</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: "#7acc44", lineHeight: 1 }}>{totalEntregues}<span style={{ fontSize: 16, color: "#444" }}>/{totalGeral}</span></div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{totalGeral > 0 ? Math.round(totalEntregues / totalGeral * 100) : 0}% concluído</div>
              </div>
            </div>

            {/* Tabela por equipe */}
            {Object.keys(porEquipe).length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardHead}>
                  <span style={styles.cardTitle}>Medalhas por Equipe / Clube</span>
                </div>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Equipe / Clube</th>
                      <th style={{ ...styles.th, textAlign: "center", width: 80 }}>🥇</th>
                      <th style={{ ...styles.th, textAlign: "center", width: 80 }}>🥈</th>
                      <th style={{ ...styles.th, textAlign: "center", width: 80 }}>🥉</th>
                      <th style={{ ...styles.th, textAlign: "center", width: 100 }}>🎖️</th>
                      <th style={{ ...styles.th, textAlign: "center", width: 80 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(porEquipe)
                      .sort((a, b) => (b[1].ouro - a[1].ouro) || (b[1].prata - a[1].prata) || (b[1].bronze - a[1].bronze))
                      .map(([equipe, dados]) => {
                        const total = dados.ouro + dados.prata + dados.bronze + dados.participacao;
                        return (
                          <tr key={equipe} style={{ background: dados.ouro > 0 ? "#1a170a" : undefined }}>
                            <td style={{ ...styles.td, fontWeight: 600, color: "#fff" }}>{equipe}</td>
                            <td style={{ ...styles.td, textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: "#FFD700" }}>{dados.ouro || "—"}</td>
                            <td style={{ ...styles.td, textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: "#C0C0C0" }}>{dados.prata || "—"}</td>
                            <td style={{ ...styles.td, textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: "#CD7F32" }}>{dados.bronze || "—"}</td>
                            <td style={{ ...styles.td, textAlign: "center", color: "#888" }}>{dados.participacao || "—"}</td>
                            <td style={{ ...styles.td, textAlign: "center", fontWeight: 700, color: "#aaa" }}>{total}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {totalGeral === 0 && (
              <div style={styles.empty}>Nenhuma medalha registrada ainda.</div>
            )}
          </>
        );
      })()}
    </div>
  );
}

export default TelaSecretaria;
