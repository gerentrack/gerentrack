import React, { useState, useMemo, useCallback } from "react";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { CATEGORIAS, getCategoria } from "../../shared/constants/categorias";
import { resKey, getFasesProva, FASE_ORDEM } from "../../shared/constants/fases";
import { abreviarProva } from "../../shared/formatters/utils";
import { useMedalhasChamada } from "../../hooks/useMedalhasChamada";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import QrScanner from "../../shared/qrcode/QrScanner";
import { parsearQrSecretaria } from "../../shared/qrcode/gerarQrCode";
import { beepOk, beepErro, beepAviso, beepDuplicado, beepInvalido, vibrarOk, vibrarErro, vibrarAviso, vibrarInvalido } from "../../shared/qrcode/scannerSons";

// ── Constantes ────────────────────────────────────────────────────────────────
// Removido: getStatusChamada — substituído por dois botões independentes (Confirmado / DNS)

function getMedalhaConfig(t) {
  return {
    ouro:        { label: "Ouro",         emoji: "🥇", cor: t.gold,         bg: t.trOuro },
    prata:       { label: "Prata",        emoji: "🥈", cor: "#C0C0C0",      bg: t.trPrata },
    bronze:      { label: "Bronze",       emoji: "🥉", cor: "#CD7F32",      bg: t.trBronze },
    participacao:{ label: "Participação", emoji: "🎖️", cor: t.textMuted,    bg: t.bgCardAlt },
  };
}

const STATUS_DNS = ["DNS", "DNF", "DQ", "NM"];

const fmtDataHora = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

function getStyles(t) {
  return {
  page:       { maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" },
  header:     { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 },
  title:      { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: t.textPrimary, letterSpacing: 1 },
  sub:        { color: t.textDimmed, fontSize: 14, marginTop: 4 },
  tabs:       { display: "flex", gap: 0, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 28, width: "fit-content" },
  tab:        { padding: "10px 24px", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, cursor: "pointer", border: "none", background: "transparent", color: t.textDimmed },
  tabActive:  { background: t.accent, color: t.textPrimary },
  card:       { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 16, overflow: "hidden" },
  cardHead:   { padding: "14px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  cardTitle:  { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 800, color: t.textPrimary, letterSpacing: 1 },
  cardMeta:   { display: "flex", gap: 8, alignItems: "center" },
  badge:      (cor) => ({ background: cor + "22", color: cor, border: `1px solid ${cor}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }),
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { background: t.bgHeaderSolid, padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` },
  td:         { padding: "10px 14px", fontSize: 13, color: t.textSecondary, borderBottom: `1px solid ${t.border}` },
  btn:        (cor, bg) => ({ background: bg, border: `1px solid ${cor}44`, color: cor, borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5, whiteSpace: "nowrap" }),
  btnDisabled:{ background: t.bgCardAlt, border: `1px solid ${t.border}`, color: t.textDisabled, borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5, whiteSpace: "nowrap", cursor: "not-allowed" },
  btnGhost:   { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  selectEvento: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, outline: "none", marginBottom: 0 },
  empty:      { textAlign: "center", padding: "48px 20px", color: t.textDisabled, fontSize: 14 },
  pill:       (cor, bg) => ({ display: "inline-block", background: bg, color: cor, border: `1px solid ${cor}33`, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 700 }),
  horario:    { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 800, color: t.accent },
  nomeAtleta: { fontWeight: 600, color: t.textPrimary, fontSize: 13 },
  entregue:   { color: t.success, fontSize: 11, fontStyle: "italic" },
  entregueInfo:{ color: t.textDimmed, fontSize: 10, fontStyle: "italic", lineHeight: 1.5 },
};
}

// ── Componente principal ──────────────────────────────────────────────────────
function TelaSecretaria({ setTela, eventoAtual, inscricoes, atletas, resultados, usuarioLogado, numeracaoPeito }) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const MEDALHA_CONFIG = getMedalhaConfig(t);
  // Modo de medalhas: retrocompatível com campo boolean antigo
  const modoMedalhas = eventoAtual?.modoMedalhas || (eventoAtual?.medalhasApenasParticipacao ? "apenas_participacao" : "classificacao_participacao");
  const apenasParticipacao = modoMedalhas === "apenas_participacao";
  const apenasClassificacao = modoMedalhas === "apenas_classificacao";
  const [aba, setAba] = useState("chamada");
  const [filtroProva, setFiltroProva] = useState("");
  const [buscaChamada, setBuscaChamada] = useState("");
  const [scannerAberto, setScannerAberto] = useState(false);
  const [scannerMedalhaAberto, setScannerMedalhaAberto] = useState(false);
  const [medalhaAtletaInfo, setMedalhaAtletaInfo] = useState(null); // { atl, provas: [{ prova, cat, sexo, tipo, conf, medalha, bloqueio }] }
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

    // Ordenar por horário → categoria crescente (sub14→adulto) → nome da prova
    const catOrdem = CATEGORIAS.reduce((acc, c, i) => { acc[c.id] = i; return acc; }, {});
    return Object.values(grupos).sort((a, b) => {
      // 1. Horário
      if (a.horario && b.horario && a.horario !== b.horario) return a.horario.localeCompare(b.horario);
      if (a.horario && !b.horario) return -1;
      if (!a.horario && b.horario) return 1;
      // 2. Categoria crescente
      const catA = catOrdem[a.cat.id] ?? 99;
      const catB = catOrdem[b.cat.id] ?? 99;
      if (catA !== catB) return catA - catB;
      // 3. Nome da prova
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
    const fasesOrdenadas = fases.length > 1
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

  const getTipoMedalha = (posicao) => {
    if (apenasParticipacao) return "participacao";
    if (posicao === 1) return "ouro";
    if (posicao === 2) return "prata";
    if (posicao === 3) return "bronze";
    if (apenasClassificacao) return null; // sem medalha para demais
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
      const fasesCheck = fases.length > 1 ? fases : [null];
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

  // Verifica se atleta tem DNS em TODAS as provas (não recebe medalha de participação)
  // DQ, NM, DNF contam como participação efetiva
  const atletaSomenteDns = (atletaId) => {
    if (!inscricoes || !resultados) return false;
    const todas = todasAsProvas();
    const inscsAtleta = inscricoes.filter(i =>
      i.atletaId === atletaId && i.eventoId === eid &&
      i.tipo !== "revezamento" && !i.combinadaId
    );
    if (inscsAtleta.length === 0) return false;
    let temAlgumaParticipacao = false;
    for (const insc of inscsAtleta) {
      const prova = todas.find(p => p.id === insc.provaId);
      if (!prova) continue;
      const atl = atletas.find(a => a.id === atletaId);
      if (!atl) continue;
      const cat = getCategoria(atl.anoNasc, anoComp);
      if (!cat) continue;
      const fases = getFasesProva(prova.id, eventoAtual?.programaHorario || {});
      const fasesCheck = fases.length > 1 ? fases : [null];
      for (const fase of fasesCheck) {
        const key = resKey(eid, prova.id, cat.id, insc.sexo || atl.sexo, fase);
        const res = resultados?.[key]?.[atletaId];
        if (!res) continue;
        const marca = typeof res === "object" ? res.marca : res;
        const status = typeof res === "object" ? (res.status || "") : "";
        const marcaStr = String(marca || "").toUpperCase();
        // DNS = não participou. DQ/NM/DNF = participou
        if (marcaStr === "DNS" || status.toUpperCase() === "DNS") continue;
        // Qualquer outro resultado (incluindo DQ, NM, DNF, ou marca válida) = participou
        if (marca != null || status) { temAlgumaParticipacao = true; break; }
      }
      if (temAlgumaParticipacao) break;
    }
    return !temAlgumaParticipacao;
  };

  // ── Scanner QR — callback de scan ──────────────────────────────────────────
  const peitos = numeracaoPeito?.[eid] || {};
  const peitoParaAtleta = useMemo(() => {
    const map = {};
    Object.entries(peitos).forEach(([aId, num]) => { map[String(num)] = aId; });
    return map;
  }, [peitos]);

  const handleScanChamada = useCallback((raw) => {
    // Tentar parsear QR da secretaria
    const qr = parsearQrSecretaria(raw);
    let atletaId;

    if (qr) {
      if (qr.eventoId !== eid) { beepInvalido(); vibrarInvalido(); return { status: "erro", msg: "⚠️ QR de outro evento", cor: "vermelho" }; }
      atletaId = qr.atletaId;
    } else {
      // Fallback: input manual (nº peito)
      atletaId = peitoParaAtleta[raw.trim()];
      if (!atletaId) { beepInvalido(); vibrarInvalido(); return { status: "erro", msg: `❌ Nº ${raw} não encontrado`, cor: "vermelho" }; }
    }

    const atl = atletas.find(a => a.id === atletaId);
    if (!atl) { beepInvalido(); vibrarInvalido(); return { status: "erro", msg: "⚠️ Atleta não encontrado", cor: "vermelho" }; }

    const peito = peitos[atletaId] || "";
    const nomeDisplay = `${peito ? "#" + peito + " " : ""}${atl.nome}`;

    // Se tem prova selecionada, confirmar nessa prova
    if (filtroProva) {
      const cat = getCategoria(atl.anoNasc, anoComp);
      if (!cat) { beepAviso(); vibrarAviso(); return { status: "aviso", msg: `⚠️ ${nomeDisplay} — categoria indefinida`, cor: "amarelo" }; }
      // Verificar se atleta está inscrito nesta prova
      const inscrito = provasComAtletas.some(g => g.prova.id === filtroProva && g.cat.id === cat.id && g.atletas.some(a => a.id === atletaId));
      if (!inscrito) { beepAviso(); vibrarAviso(); return { status: "aviso", msg: `⚠️ ${nomeDisplay} não inscrito nesta prova`, cor: "amarelo" }; }
      // Verificar se já confirmado
      const estado = getPresenca(filtroProva, cat.id, atl.sexo, atletaId);
      if (estado === "confirmado") { beepDuplicado(); return { status: "duplicado", msg: `🔁 ${nomeDisplay} já confirmado`, cor: "azul" }; }
      // Confirmar
      atualizarPresenca(filtroProva, cat.id, atl.sexo, atletaId, "confirmado");
      beepOk(); vibrarOk();
      return { status: "ok", msg: `✓ ${nomeDisplay} confirmado`, cor: "verde" };
    }

    // Sem prova selecionada: avisar para selecionar
    beepAviso(); vibrarAviso();
    return { status: "aviso", msg: `⚠️ Selecione uma prova no seletor acima`, cor: "amarelo" };
  }, [eid, atletas, filtroProva, provasComAtletas, getPresenca, atualizarPresenca, peitoParaAtleta, peitos, anoComp]);

  const handleDesfazerChamada = useCallback((raw) => {
    const qr = parsearQrSecretaria(raw);
    const atletaId = qr ? qr.atletaId : peitoParaAtleta[raw.trim()];
    if (!atletaId || !filtroProva) return;
    const atl = atletas.find(a => a.id === atletaId);
    if (!atl) return;
    const cat = getCategoria(atl.anoNasc, anoComp);
    if (!cat) return;
    atualizarPresenca(filtroProva, cat.id, atl.sexo, atletaId, null);
  }, [atletas, filtroProva, atualizarPresenca, peitoParaAtleta, anoComp]);

  // ── Scanner QR — medalhas ──────────────────────────────────────────────────
  const handleScanMedalha = useCallback((raw) => {
    const qr = parsearQrSecretaria(raw);
    let atletaId;

    if (qr) {
      if (qr.eventoId !== eid) { beepInvalido(); vibrarInvalido(); return { status: "erro", msg: "⚠️ QR de outro evento", cor: "vermelho" }; }
      atletaId = qr.atletaId;
    } else {
      atletaId = peitoParaAtleta[raw.trim()];
      if (!atletaId) { beepInvalido(); vibrarInvalido(); return { status: "erro", msg: `❌ Nº ${raw} não encontrado`, cor: "vermelho" }; }
    }

    const atl = atletas.find(a => a.id === atletaId);
    if (!atl) { beepInvalido(); vibrarInvalido(); return { status: "erro", msg: "⚠️ Atleta não encontrado", cor: "vermelho" }; }

    const peito = peitos[atletaId] || "";
    const nomeDisplay = `${peito ? "#" + peito + " " : ""}${atl.nome}`;

    // Buscar todas as provas do atleta com info de medalha
    const provasDoAtleta = provasFiltradasMedalhas
      .filter(g => g.atletas.some(a => a.id === atletaId))
      .map(g => {
        const classificados = getClassificados(g.prova, g.cat, g.sexo);
        const idx = classificados.findIndex(c => c.aId === atletaId);
        const posicao = idx >= 0 ? idx + 1 : null;
        const tipoCalculado = posicao ? getTipoMedalha(posicao) : (apenasClassificacao ? null : "participacao");
        const medalha = getMedalha(g.prova.id, g.cat.id, g.sexo, atletaId);
        const tipo = apenasParticipacao ? "participacao" : (medalha.tipo || tipoCalculado);
        const conf = tipo ? MEDALHA_CONFIG[tipo] : null;

        // Bloqueios
        const isParticipacao = tipo === "participacao";
        const dnsTodas = isParticipacao && !medalha.entregue && atletaSomenteDns(atletaId);
        const jaLimite = isParticipacao && !medalha.entregue && !dnsTodas && contarParticipacoes(atletaId).length >= limiteParticipacao;
        const classBloq = isParticipacao && !medalha.entregue && !dnsTodas && classificacaoBloqueiaParticipacao && temClassificacaoEntregue(atletaId);
        const pend = isParticipacao && !medalha.entregue && !dnsTodas && !classBloq && !jaLimite
          ? provasPendentes(atletaId).filter(nome => nome !== g.prova.nome) : [];

        let bloqueio = null;
        if (dnsTodas) bloqueio = "🚫 DNS em todas as provas";
        else if (classBloq) bloqueio = "🏅 Tem classificação";
        else if (pend.length > 0) bloqueio = `⏳ Provas pendentes: ${pend.slice(0,2).join(", ")}`;
        else if (jaLimite) bloqueio = "🚫 Limite atingido";

        return { prova: g.prova, cat: g.cat, sexo: g.sexo, posicao, tipo, conf, medalha, bloqueio };
      });

    if (provasDoAtleta.length === 0) {
      beepAviso(); vibrarAviso();
      return { status: "aviso", msg: `⚠️ ${nomeDisplay} sem provas para medalha`, cor: "amarelo" };
    }

    // Mostrar modal com cards
    setMedalhaAtletaInfo({ atl, peito, provas: provasDoAtleta });
    beepOk(); vibrarOk();
    return { status: "ok", msg: `🏅 ${nomeDisplay} — ${provasDoAtleta.length} prova(s)`, cor: "verde" };
  }, [eid, atletas, provasFiltradasMedalhas, getClassificados, getTipoMedalha, getMedalha, MEDALHA_CONFIG,
      apenasParticipacao, apenasClassificacao, atletaSomenteDns, contarParticipacoes,
      classificacaoBloqueiaParticipacao, temClassificacaoEntregue, provasPendentes,
      limiteParticipacao, peitoParaAtleta, peitos]);

  // Contador para o scanner
  const contadorScanLabel = useMemo(() => {
    if (!filtroProva) return null;
    const grupo = provasComAtletas.find(g => g.prova.id === filtroProva);
    if (!grupo) return null;
    const presenca = getPresencaProva(grupo.prova.id, grupo.cat.id, grupo.sexo);
    const confirmados = Object.values(presenca).filter(v => v === "confirmado").length;
    return `✓ ${confirmados}/${grupo.atletas.length} confirmados — ${grupo.prova.nome} ${grupo.cat.nome} ${grupo.sexo === "M" ? "Masc" : "Fem"}`;
  }, [filtroProva, provasComAtletas, getPresencaProva]);

  // ── Estatísticas rápidas ──────────────────────────────────────────────────
  const statsPresenca = useMemo(() => {
    let confirmado = 0, dns = 0, total = 0;
    provasComAtletas.forEach(({ prova, cat, sexo, atletas: atls }) => {
      atls.forEach(atl => {
        total++;
        const estado = getPresenca(prova.id, cat.id, sexo, atl.id);
        if (estado === "confirmado") confirmado++;
        else if (estado === "dns") dns++;
      });
    });
    return { confirmado, dns, total };
  }, [provasComAtletas, getPresenca]);

  if (!eventoAtual) return (
    <div style={s.page}>
      <div style={s.empty}>Nenhum evento selecionado.</div>
    </div>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>📋 SECRETARIA</h1>
          <div style={s.sub}>{eventoAtual.nome}</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={filtroProva}
            onChange={e => setFiltroProva(e.target.value)}
            style={s.selectEvento}
          >
            <option value="">Todas as provas</option>
            {provasUnicas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button
          style={{ ...s.tab, ...(aba === "chamada" ? s.tabActive : {}) }}
          onClick={() => setAba("chamada")}
        >
          📋 CÂMARA DE CHAMADA
        </button>
        <button
          style={{ ...s.tab, ...(aba === "medalhas" ? s.tabActive : {}) }}
          onClick={() => setAba("medalhas")}
        >
          🏅 MEDALHAS
        </button>
        <button
          style={{ ...s.tab, ...(aba === "relatorio" ? s.tabActive : {}) }}
          onClick={() => setAba("relatorio")}
        >
          📊 RELATÓRIO
        </button>
      </div>

      {/* ── Scanner QR (compartilhado entre abas) ── */}
      <QrScanner
        aberto={scannerAberto}
        onScan={handleScanChamada}
        onDesfazer={handleDesfazerChamada}
        contadorLabel={contadorScanLabel}
        onFechar={() => setScannerAberto(false)}
        provas={provasUnicas.map(p => ({ id: p.id, label: p.nome }))}
        provaSelecionada={filtroProva}
        onTrocarProva={setFiltroProva}
      />

      {/* ── ABA: CÂMARA DE CHAMADA ─────────────────────────────────────────── */}
      {aba === "chamada" && (
        <>
          {/* Botão Scanner */}
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setScannerAberto(true)}
              style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, display: "flex", alignItems: "center", gap: 8 }}>
              📷 Escanear QR Code
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { label: "Total", valor: statsPresenca.total, cor: t.textMuted },
              { label: "Confirmados", valor: statsPresenca.confirmado, cor: t.success },
              { label: "DNS", valor: statsPresenca.dns, cor: t.danger },
            ].map(stat => (
              <div key={stat.label} style={{ background: t.bgCard, border: `1px solid ${stat.cor}33`, borderRadius: 10, padding: "12px 20px", textAlign: "center", minWidth: 90 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: stat.cor }}>{stat.valor}</div>
                <div style={{ fontSize: 11, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Busca por nº peito ou nome */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="🔍 Buscar por nº peito ou nome..."
              value={buscaChamada}
              onChange={e => setBuscaChamada(e.target.value)}
              style={{ background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 14px", color: t.textPrimary, fontSize: 13, width: "100%", maxWidth: 400, outline: "none", fontFamily: "'Barlow', sans-serif" }}
            />
          </div>

          {provasFiltradas.length === 0 && (
            <div style={s.empty}>Nenhuma prova com atletas inscritos.</div>
          )}

          {provasFiltradas.map(({ prova, cat, sexo, atletas: atls, horario }) => {
            const peitos = numeracaoPeito?.[eid] || {};
            const buscaLower = buscaChamada.toLowerCase().trim();
            const atlsFiltrados = buscaLower
              ? atls.filter(atl => {
                  const peito = peitos[atl.id] ? String(peitos[atl.id]) : "";
                  return atl.nome.toLowerCase().includes(buscaLower) || peito.includes(buscaLower);
                })
              : atls;
            if (buscaLower && atlsFiltrados.length === 0) return null;
            const presencaProva = getPresencaProva(prova.id, cat.id, sexo);
            const nConfirmados = Object.values(presencaProva).filter(v => v === "confirmado").length;
            const nDns         = Object.values(presencaProva).filter(v => v === "dns").length;

            return (
              <div key={`${prova.id}_${cat.id}_${sexo}`} style={s.card}>
                <div style={s.cardHead}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {horario && <span style={s.horario}>{horario}</span>}
                    <span style={s.cardTitle}>{prova.nome}</span>
                    <span style={s.badge(t.accent)}>{cat.nome}</span>
                    <span style={s.badge(sexo === "M" ? "#1a6ef5" : "#e54f9b")}>{sexo === "M" ? "Masc" : "Fem"}</span>
                  </div>
                  <div style={s.cardMeta}>
                    {nConfirmados > 0 && <span style={s.pill(t.success, t.bgCardAlt)}>{nConfirmados} confirmado(s)</span>}
                    {nDns > 0 && <span style={s.pill(t.danger, t.bgCardAlt)}>{nDns} DNS</span>}
                    <span style={{ color: t.textDimmed, fontSize: 12 }}>{buscaLower && atlsFiltrados.length !== atls.length ? `${atlsFiltrados.length}/` : ""}{atls.length} atleta(s)</span>
                  </div>
                </div>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={{ ...s.th, width: 50, textAlign: "center" }}>Nº</th>
                      <th style={s.th}>Atleta</th>
                      <th style={s.th}>Clube / Equipe</th>
                      <th style={{ ...s.th, textAlign: "center", width: 200 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...atlsFiltrados].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map(atl => {
                      const estado = getPresenca(prova.id, cat.id, sexo, atl.id);
                      const rowBg = estado === "confirmado" ? `${t.success}08` : estado === "dns" ? `${t.danger}08` : undefined;
                      const peito = peitos[atl.id] || "";
                      return (
                        <tr key={`${prova.id}_${cat.id}_${sexo}_${atl.id}`} style={{ background: rowBg }}>
                          <td style={{ ...s.td, textAlign: "center", fontWeight: 700, color: t.warning, fontSize: 14, fontFamily: "'Barlow Condensed', sans-serif" }}>{peito || "—"}</td>
                          <td style={s.td}>
                            <span style={s.nomeAtleta}>{atl.nome}</span>
                          </td>
                          <td style={{ ...s.td, color: t.textDimmed, fontSize: 12 }}>{atl.clube || "—"}</td>
                          <td style={{ ...s.td, textAlign: "center" }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                              <button
                                style={s.btn(
                                  estado === "confirmado" ? t.success : t.textDisabled,
                                  estado === "confirmado" ? `${t.success}18` : t.bgCardAlt
                                )}
                                onClick={() => atualizarPresenca(prova.id, cat.id, sexo, atl.id,
                                  estado === "confirmado" ? null : "confirmado")}
                              >
                                ✓ Conf.
                              </button>
                              <button
                                style={s.btn(
                                  estado === "dns" ? t.danger : t.textDisabled,
                                  estado === "dns" ? `${t.danger}18` : t.bgCardAlt
                                )}
                                onClick={() => atualizarPresenca(prova.id, cat.id, sexo, atl.id,
                                  estado === "dns" ? null : "dns")}
                              >
                                DNS
                              </button>
                            </div>
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

      {/* ── Scanner QR medalhas ── */}
      <QrScanner
        aberto={scannerMedalhaAberto}
        onScan={handleScanMedalha}
        onFechar={() => { setScannerMedalhaAberto(false); setMedalhaAtletaInfo(null); }}
      />

      {/* ── Modal de medalhas do atleta escaneado ── */}
      {medalhaAtletaInfo && !scannerMedalhaAberto && (
        <div style={{ position: "fixed", inset: 0, background: t.bgOverlay, zIndex: 8000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "24px 28px", maxWidth: 420, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 20, color: t.textPrimary }}>
                  {medalhaAtletaInfo.peito ? `#${medalhaAtletaInfo.peito} ` : ""}{medalhaAtletaInfo.atl.nome}
                </div>
                <div style={{ fontSize: 12, color: t.textMuted }}>{medalhaAtletaInfo.atl.clube || "Sem equipe"}</div>
              </div>
              <button onClick={() => setMedalhaAtletaInfo(null)}
                style={{ background: "transparent", border: "none", color: t.textMuted, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            {/* Cards por prova */}
            {medalhaAtletaInfo.provas.map((p, i) => {
              const corCard = p.bloqueio ? t.danger : p.medalha.entregue ? t.success : p.conf ? p.conf.cor : t.textMuted;
              return (
                <div key={i} style={{
                  background: `${corCard}08`, border: `1px solid ${corCard}33`,
                  borderRadius: 10, padding: "12px 16px", marginBottom: 8,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 14 }}>{p.prova.nome}</div>
                      <div style={{ fontSize: 11, color: t.textMuted }}>{p.cat.nome} · {p.sexo === "M" ? "Masc" : "Fem"}{p.posicao ? ` · ${p.posicao}º lugar` : ""}</div>
                    </div>
                    {p.conf && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: p.conf.cor }}>
                        {p.conf.emoji} {p.conf.label}
                      </span>
                    )}
                  </div>
                  {p.bloqueio ? (
                    <div style={{ marginTop: 8, fontSize: 12, color: t.danger, fontWeight: 600 }}>{p.bloqueio}</div>
                  ) : (
                    <div style={{ marginTop: 8 }}>
                      <button
                        onClick={() => {
                          marcarEntrega(p.prova.id, p.cat.id, p.sexo, medalhaAtletaInfo.atl.id, p.tipo, usuarioLogado?.id, usuarioLogado?.nome);
                          // Atualizar info local
                          setMedalhaAtletaInfo(prev => ({
                            ...prev,
                            provas: prev.provas.map((pp, j) => j === i ? { ...pp, medalha: { ...pp.medalha, entregue: !pp.medalha.entregue } } : pp),
                          }));
                          if (!p.medalha.entregue) { beepOk(); vibrarOk(); }
                        }}
                        style={{
                          ...s.btn(p.medalha.entregue ? t.success : t.textMuted, p.medalha.entregue ? t.bgCardAlt : t.bgInput),
                          width: "100%", padding: "8px 16px",
                        }}>
                        {p.medalha.entregue ? "✅ Entregue — desfazer?" : "⬜ Entregar"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Botão "Entregar todas" */}
            {(() => {
              const elegibles = medalhaAtletaInfo.provas.filter(p => !p.bloqueio && !p.medalha.entregue && p.tipo);
              if (elegibles.length <= 1) return null;
              return (
                <button
                  onClick={() => {
                    elegibles.forEach(p => {
                      marcarEntrega(p.prova.id, p.cat.id, p.sexo, medalhaAtletaInfo.atl.id, p.tipo, usuarioLogado?.id, usuarioLogado?.nome);
                    });
                    setMedalhaAtletaInfo(prev => ({
                      ...prev,
                      provas: prev.provas.map(pp => !pp.bloqueio && !pp.medalha.entregue && pp.tipo ? { ...pp, medalha: { ...pp.medalha, entregue: true } } : pp),
                    }));
                    beepOk(); vibrarOk();
                  }}
                  style={{ ...s.btn(t.success, `${t.success}15`), width: "100%", padding: "10px 16px", marginTop: 4, fontSize: 14 }}>
                  🏅 Entregar todas ({elegibles.length})
                </button>
              );
            })()}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => { setMedalhaAtletaInfo(null); setScannerMedalhaAberto(true); }}
                style={{ ...s.btn(t.accent, t.accentBg), flex: 1, padding: "10px 16px" }}>
                📷 Próximo atleta
              </button>
              <button onClick={() => setMedalhaAtletaInfo(null)}
                style={{ ...s.btn(t.textMuted, t.bgCardAlt), flex: 1, padding: "10px 16px" }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA: MEDALHAS ────────────────────────────────────────────────────── */}
      {aba === "medalhas" && (
        <>
          {/* Botão Scanner Medalhas */}
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setScannerMedalhaAberto(true)}
              style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, display: "flex", alignItems: "center", gap: 8 }}>
              📷 Escanear QR — Medalhas
            </button>
          </div>

          {/* Configuração de limite de participação (oculto no modo apenas classificação) */}
          {modoMedalhas === "classificacao_participacao" && <>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 20px", flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: t.textTertiary }}>
              🎖️ <strong style={{ color: t.textPrimary }}>Limite de medalhas de participação por atleta:</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setLimiteParticipacao(l => Math.max(1, l - 1))}
                style={{ background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textMuted, borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22, color: t.textPrimary, minWidth: 28, textAlign: "center" }}>{limiteParticipacao}</span>
              <button onClick={() => setLimiteParticipacao(l => l + 1)}
                style={{ background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textMuted, borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
            <div style={{ fontSize: 11, color: t.textDisabled }}>Atleta bloqueado ao atingir o limite em outras provas</div>
          </div>

          {/* Toggle: classificação bloqueia participação */}
          <label style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, background: t.bgCard, border: `1px solid ${classificacaoBloqueiaParticipacao ? `${t.success}44` : t.border}`, borderRadius: 10, padding: "14px 20px", cursor: "pointer", flexWrap: "wrap" }}>
            <input
              type="checkbox"
              checked={classificacaoBloqueiaParticipacao}
              onChange={e => setClassificacaoBloqueiaParticipacao(e.target.checked)}
              style={{ width: 16, height: 16, cursor: "pointer" }}
            />
            <div>
              <div style={{ fontSize: 13, color: classificacaoBloqueiaParticipacao ? t.success : t.textTertiary, fontWeight: 600 }}>
                🏅 Classificação bloqueia participação
              </div>
              <div style={{ fontSize: 11, color: t.textDisabled, marginTop: 2 }}>
                {classificacaoBloqueiaParticipacao
                  ? "Atleta com ouro/prata/bronze entregue não recebe participação"
                  : "Atleta pode receber participação mesmo tendo classificação"}
              </div>
            </div>
          </label>
          </>}

          {modoMedalhas !== "classificacao_participacao" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, background: `${apenasParticipacao ? t.warning : t.gold}12`, border: `1px solid ${apenasParticipacao ? t.warning : t.gold}44`, borderRadius: 10, padding: "12px 18px" }}>
              <span style={{ fontSize: 22 }}>{apenasParticipacao ? "🎖️" : "🥇"}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: apenasParticipacao ? t.warning : t.gold }}>
                  {apenasParticipacao ? "Modo: Somente Medalhas de Participação" : "Modo: Somente Medalhas de Classificação"}
                </div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
                  {apenasParticipacao
                    ? "Todos os atletas recebem medalha de participação, sem ouro/prata/bronze."
                    : "Apenas 1º/2º/3º recebem medalha (ouro/prata/bronze). Sem medalha de participação."}
                </div>
              </div>
            </div>
          )}

          <div style={{ color: t.textDimmed, fontSize: 13, marginBottom: 20 }}>
            {apenasParticipacao
              ? "Clique em \"Entregar\" para confirmar a entrega física da medalha de participação."
              : "Posições calculadas automaticamente a partir dos resultados. Clique em \"Entregar\" para confirmar a entrega física."}
          </div>

          {/* Busca por nº peito ou nome */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="🔍 Buscar por nº peito ou nome..."
              value={buscaChamada}
              onChange={e => setBuscaChamada(e.target.value)}
              style={{ background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 14px", color: t.textPrimary, fontSize: 13, width: "100%", maxWidth: 400, outline: "none", fontFamily: "'Barlow', sans-serif" }}
            />
          </div>

          {provasFiltradasMedalhas.length === 0 && (
            <div style={s.empty}>Nenhuma prova com atletas inscritos.</div>
          )}

          {provasFiltradasMedalhas.map(({ prova, cat, sexo, atletas: atls, horario }) => {
            const peitos = numeracaoPeito?.[eid] || {};
            const buscaLower = buscaChamada.toLowerCase().trim();
            const atlsFiltradosMed = buscaLower
              ? atls.filter(atl => {
                  const peito = peitos[atl.id] ? String(peitos[atl.id]) : "";
                  return atl.nome.toLowerCase().includes(buscaLower) || peito.includes(buscaLower);
                })
              : atls;
            const classificados = getClassificados(prova, cat, sexo);
            const temResultados = classificados.length > 0;

            const filtradosIds = new Set(atlsFiltradosMed.map(a => a.id));
            if (buscaLower && atlsFiltradosMed.length === 0) return null;

            const atletasOrdenados = (temResultados
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
              : atls.map(a => ({ atl: a, posicao: null, tipoCalculado: null, temResultado: false }))
            ).filter(({ atl }) => !buscaLower || (atl && filtradosIds.has(atl.id)));

            const entregues = atletasOrdenados.filter(({ atl }) =>
              atl && getMedalha(prova.id, cat.id, sexo, atl.id).entregue
            ).length;

            return (
              <div key={`${prova.id}_${cat.id}_${sexo}`} style={s.card}>
                <div style={s.cardHead}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {horario && <span style={s.horario}>{horario}</span>}
                    <span style={s.cardTitle}>{prova.nome}</span>
                    <span style={s.badge(t.accent)}>{cat.nome}</span>
                    <span style={s.badge(sexo === "M" ? "#1a6ef5" : "#e54f9b")}>{sexo === "M" ? "Masc" : "Fem"}</span>
                  </div>
                  <div style={s.cardMeta}>
                    {!temResultados && (
                      <span style={s.pill(t.textMuted, t.bgCard)}>⏳ Aguardando resultados</span>
                    )}
                    <span style={s.pill(t.success, t.bgCardAlt)}>{entregues}/{atls.length} entregues</span>
                  </div>
                </div>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={{ ...s.th, width: 44, textAlign: "center" }}>Pos.</th>
                      <th style={{ ...s.th, width: 50, textAlign: "center" }}>Nº</th>
                      <th style={s.th}>Atleta</th>
                      <th style={s.th}>Clube / Equipe</th>
                      <th style={{ ...s.th, textAlign: "center", width: 120 }}>Medalha</th>
                      <th style={{ ...s.th, textAlign: "center", width: 180 }}>Entrega</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atletasOrdenados.map(({ atl, posicao, tipoCalculado }) => {
                      if (!atl) return null;
                      const medalha = getMedalha(prova.id, cat.id, sexo, atl.id);
                      const tipo = apenasParticipacao
                        ? "participacao"
                        : (medalha.tipo || tipoCalculado);
                      const conf = tipo ? MEDALHA_CONFIG[tipo] : null;

                      // Verificar bloqueios de participação
                      const isParticipacao = tipo === "participacao";
                      const dnsTodas = isParticipacao && !medalha.entregue && atletaSomenteDns(atl.id);
                      const participacoesEntregues = contarParticipacoes(atl.id);
                      const jaAtigindoLimite = isParticipacao && !medalha.entregue && !dnsTodas
                        && participacoesEntregues.length >= limiteParticipacao;
                      const classificacaoBloqueio = isParticipacao && !medalha.entregue && !dnsTodas
                        && classificacaoBloqueiaParticipacao
                        && temClassificacaoEntregue(atl.id);
                      const pendentes = isParticipacao && !medalha.entregue && !dnsTodas && !classificacaoBloqueio && !jaAtigindoLimite
                        ? provasPendentes(atl.id).filter(nome => nome !== prova.nome)
                        : [];
                      const bloqueadoPorPendentes = pendentes.length > 0;

                      return (
                        <tr key={`${prova.id}_${cat.id}_${sexo}_${atl.id}`} style={{ background: conf ? conf.bg : undefined }}>
                          <td style={{ ...s.td, textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 18, color: conf ? conf.cor : t.textDisabled }}>
                            {posicao ? `${posicao}º` : "—"}
                          </td>
                          <td style={{ ...s.td, textAlign: "center", fontWeight: 700, color: t.warning, fontSize: 14, fontFamily: "'Barlow Condensed', sans-serif" }}>{peitos[atl.id] || "—"}</td>
                          <td style={s.td}>
                            <span style={s.nomeAtleta}>{atl.nome}</span>
                          </td>
                          <td style={{ ...s.td, color: t.textDimmed, fontSize: 12 }}>{atl.clube || "—"}</td>
                          <td style={{ ...s.td, textAlign: "center" }}>
                            {conf ? (
                              <span style={s.pill(conf.cor, conf.bg)}>
                                {conf.emoji} {conf.label}
                              </span>
                            ) : (
                              <span style={{ color: t.textDisabled, fontSize: 12 }}>—</span>
                            )}
                          </td>
                          <td style={{ ...s.td, textAlign: "center" }}>
                            {tipo ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
                                {dnsTodas ? (
                                  <button style={s.btnDisabled} disabled>
                                    🚫 DNS em todas as provas
                                  </button>
                                ) : classificacaoBloqueio ? (
                                  <button style={s.btnDisabled} disabled>
                                    🏅 Tem classificação
                                  </button>
                                ) : bloqueadoPorPendentes ? (
                                  <>
                                    <button style={s.btnDisabled} disabled>
                                      ⏳ Provas pendentes
                                    </button>
                                    <span style={s.entregueInfo}>
                                      {pendentes.slice(0, 2).join(", ")}{pendentes.length > 2 ? ` +${pendentes.length - 2}` : ""}
                                    </span>
                                  </>
                                ) : jaAtigindoLimite ? (
                                  <>
                                    <button style={s.btnDisabled} disabled>
                                      🚫 Limite atingido
                                    </button>
                                    <span style={s.entregueInfo}>
                                      {participacoesEntregues.length} de {limiteParticipacao} entregues
                                    </span>
                                  </>
                                ) : (
                                  <button
                                    style={{
                                      ...s.btn(
                                        medalha.entregue ? t.success : t.textMuted,
                                        medalha.entregue ? t.bgCardAlt : t.bgInput
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
                                      <span style={s.entregue}>por {medalha.entregueByNome}</span>
                                    )}
                                    {medalha.entregueEm && (
                                      <span style={s.entregueInfo}>{fmtDataHora(medalha.entregueEm)}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: t.textDisabled, fontSize: 12 }}>—</span>
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

        if (apenasParticipacao) {
          // Modo participação: contar por ATLETA (não por inscrição)
          // Cada atleta recebe no máximo 1 medalha de participação
          const atletasUnicos = new Set();
          provasFiltradasMedalhas.forEach(({ atletas: atls }) => {
            atls.forEach(a => atletasUnicos.add(a.id));
          });

          atletasUnicos.forEach(aId => {
            // Atleta com DNS em todas as provas não recebe medalha
            if (atletaSomenteDns(aId)) return;
            const atl = atletas.find(a => a.id === aId);
            const equipe = atl?.clube || "Sem equipe";
            // Verificar se TEM entrega em qualquer prova do evento
            const entregue = Object.entries(medalhas).some(([key, val]) =>
              key.startsWith(eid + "_") && key.endsWith("_" + aId) && val.entregue
            );
            if (entregue) {
              totais.participacao++;
              if (!porEquipe[equipe]) porEquipe[equipe] = { ouro: 0, prata: 0, bronze: 0, participacao: 0 };
              porEquipe[equipe].participacao++;
            } else {
              totais.pendentes++;
            }
          });
        } else {
          // Modo normal: contar por inscrição/prova
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
        }

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
                <div key={tipo} style={{ background: t.bgCard, border: `1px solid ${cor}33`, borderRadius: 12, padding: "16px 24px", textAlign: "center", minWidth: 110 }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{emoji}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: cor, lineHeight: 1 }}>{totais[tipo]}</div>
                  <div style={{ fontSize: 11, color: t.textDimmed, marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                </div>
              ))}
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px 24px", textAlign: "center", minWidth: 110 }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>⏳</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: t.danger, lineHeight: 1 }}>{totais.pendentes}</div>
                <div style={{ fontSize: 11, color: t.textDimmed, marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>Pendentes</div>
              </div>
              <div style={{ background: t.bgCard, border: "1px solid #2a6a2a", borderRadius: 12, padding: "16px 24px", textAlign: "center", minWidth: 110, alignSelf: "center" }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: t.success, letterSpacing: 1, marginBottom: 6 }}>TOTAL ENTREGUES</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: t.success, lineHeight: 1 }}>{totalEntregues}<span style={{ fontSize: 16, color: t.textDisabled }}>/{totalGeral}</span></div>
                <div style={{ fontSize: 11, color: t.textDimmed, marginTop: 4 }}>{totalGeral > 0 ? Math.round(totalEntregues / totalGeral * 100) : 0}% concluído</div>
              </div>
            </div>

            {/* Tabela por equipe */}
            {Object.keys(porEquipe).length > 0 && (
              <div style={s.card}>
                <div style={s.cardHead}>
                  <span style={s.cardTitle}>Medalhas por Equipe / Clube</span>
                </div>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Equipe / Clube</th>
                      <th style={{ ...s.th, textAlign: "center", width: 80 }}>🥇</th>
                      <th style={{ ...s.th, textAlign: "center", width: 80 }}>🥈</th>
                      <th style={{ ...s.th, textAlign: "center", width: 80 }}>🥉</th>
                      <th style={{ ...s.th, textAlign: "center", width: 100 }}>🎖️</th>
                      <th style={{ ...s.th, textAlign: "center", width: 80 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(porEquipe)
                      .sort((a, b) => (b[1].ouro - a[1].ouro) || (b[1].prata - a[1].prata) || (b[1].bronze - a[1].bronze))
                      .map(([equipe, dados]) => {
                        const total = dados.ouro + dados.prata + dados.bronze + dados.participacao;
                        return (
                          <tr key={equipe} style={{ background: dados.ouro > 0 ? t.trOuro : undefined }}>
                            <td style={{ ...s.td, fontWeight: 600, color: t.textPrimary }}>{equipe}</td>
                            <td style={{ ...s.td, textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: "#FFD700" }}>{dados.ouro || "—"}</td>
                            <td style={{ ...s.td, textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: "#C0C0C0" }}>{dados.prata || "—"}</td>
                            <td style={{ ...s.td, textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: "#CD7F32" }}>{dados.bronze || "—"}</td>
                            <td style={{ ...s.td, textAlign: "center", color: t.textMuted }}>{dados.participacao || "—"}</td>
                            <td style={{ ...s.td, textAlign: "center", fontWeight: 700, color: t.textTertiary }}>{total}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {totalGeral === 0 && (
              <div style={s.empty}>Nenhuma medalha registrada ainda.</div>
            )}
          </>
        );
      })()}
    </div>
  );
}

export default TelaSecretaria;
