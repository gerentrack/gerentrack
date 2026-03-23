import React, { useState } from "react";
import { todasAsProvas, nPernasRevezamento } from "../../shared/athletics/provasDef";
import { CATEGORIAS } from "../../shared/constants/categorias";
import { getFasesProva, temMultiFases, buscarSeriacao, serKey, resKey, FASE_NOME } from "../../shared/constants/fases";
import { gerarHtmlImpressao } from "../impressao/gerarHtmlImpressao";
import { CombinedEventEngine } from "../../shared/engines/combinedEventEngine";
import { SeriacaoEngine } from "../../shared/engines/seriacaoEngine";
import { _getNascDisplay, NomeProvaComImplemento, formatarTempo } from "../../shared/formatters/utils";
import { Th, Td } from "../ui/TableHelpers";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
function getStyles(t) {
  return {
  page:        { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle:   { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: t.textPrimary, marginBottom: 24, letterSpacing: 1 },
  painelHeader:{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  filtros:     { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  label:       { display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  select:      { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none" },
  table:       { width: "100%", borderCollapse: "collapse" },
  tr:          { transition: "background 0.15s" },
  btnPrimary:  { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary:{ background: "transparent", color: t.accent, border: `2px solid ${t.accentBorder}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost:    { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  linkBtn:     { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", padding: 0 },
  emptyState:  { textAlign: "center", padding: "60px 20px", color: t.textDisabled, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },
  badge:       (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  badgeGold:   { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  badgeOficial:{ background: t.bgCardAlt, color: t.textTertiary, border: `1px solid ${t.border}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  badgeNorma:  { background: `${t.success}15`, color: t.success, border: `1px solid ${t.success}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, cursor: "help" },
};
}

// Item 8: exibe sigla da equipe quando disponível, com fallback para nome/clube
const getExibicaoEquipe = (atleta, equipes) => {
  const eq = (equipes||[]).find(e => e.id === atleta?.equipeId);
  if (eq) return (eq.sigla?.trim() || eq.nome || atleta?.clube || "—");
  return atleta?.clube || "—";
};

function TelaSumulas({ inscricoes, atletas, setTela, usuarioLogado, eventoAtual, resultados, registrarAcao, numeracaoPeito, getClubeAtleta, equipes, editarEvento, alterarStatusEvento, recordes, chamada, getPresencaProva }) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const [filtroProva, setFiltroProva] = useState("todas");
  const [filtroCat, setFiltroCat] = useState("todas");
  const [filtroSexo, setFiltroSexo] = useState("todos");
  const [orientacoes, setOrientacoes] = useState({}); // { "sumulaKey": "portrait"|"landscape" }
  const [showOrientConfig, setShowOrientConfig] = useState(false);
  const [showSeriar, setShowSeriar] = useState(false);
  const [seriacaoProvaId, setSeriacaoProvaId] = useState(null);
  const [seriacaoCat, setSeriacaoCat] = useState(null);
  const [seriacaoSexo, setSeriacaoSexo] = useState(null);
  const [marcasRef, setMarcasRef] = useState({}); // { atletaId: "marca" }
  const [seriacaoPreview, setSeriacaoPreview] = useState(null);
  const [seriacaoModo, setSeriacaoModo] = useState("marca"); // "marca" | "aleatorio" | "manual"
  const [manualSeries, setManualSeries] = useState({}); // { atletaId: { serie: num, raia: num } }
  const [seriacaoFase, setSeriacaoFase] = useState("eliminatoria"); // "eliminatoria" | "semifinal" | "final"
  const [seriacao800m, setSeriacao800m] = useState("raias"); // "raias" | "grupo"
  const [seriacaoChaveAtiva, setSeriacaoChaveAtiva] = useState(null); // chave completa do item ativo (com sufixo de fase)

  if (!eventoAtual) return (
    <div style={s.page}><div style={s.emptyState}><p>Selecione uma competição primeiro.</p>
      <button style={s.btnPrimary} onClick={() => setTela("home")}>Ver Competições</button></div></div>
  );

  // Controle de acesso: não-admins só acessam se sumulaLiberada = true
  const isAdmin  = usuarioLogado?.tipo === "admin";
  const isOrg    = usuarioLogado?.tipo === "organizador";
  const isFuncS  = usuarioLogado?.tipo === "funcionario" &&
    (usuarioLogado?.permissoes?.includes("sumulas") || usuarioLogado?.permissoes?.includes("resultados"));
  const isAmplo  = isAdmin || isOrg || isFuncS;
  if (!isAmplo && !eventoAtual.sumulaLiberada) return (
    <div style={s.page}>
      <div style={s.emptyState}>
        <span style={{ fontSize: 56 }}>🔐</span>
        <p style={{ fontWeight: 700, color: t.textPrimary, fontSize: 18 }}>Súmulas não disponíveis</p>
        <p style={{ color: t.textDimmed, fontSize: 14, maxWidth: 380, textAlign: "center" }}>
          As súmulas desta competição ainda não foram liberadas para consulta.
          Aguarde o encerramento das inscrições e a liberação pelo administrador.
        </p>
        <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar à Competição</button>
      </div>
    </div>
  );

  const todasProvas = todasAsProvas();
  const inscDoEvento = inscricoes.filter((i) => i.eventoId === eventoAtual.id);

  // Gerar provas componentes de combinadas a partir das provas do programa
  const provasComponentesArr = [];
  (eventoAtual.provasPrograma || []).forEach(provaId => {
    const provaInfo = todasProvas.find(p => p.id === provaId);
    if (provaInfo && provaInfo.tipo === "combinada") {
      const componentes = CombinedEventEngine.gerarProvasComponentes(provaId, eventoAtual.id);
      provasComponentesArr.push(...componentes);
    }
  });
  const provasComComponentes = (() => {
    const vistas = new Set();
    // Componentes primeiro (têm metadados origemCombinada), depois provas regulares
    const combinados = [...provasComponentesArr, ...todasProvas];
    return combinados.filter(p => {
      if (vistas.has(p.id)) return false;
      vistas.add(p.id);
      return true;
    });
  })();

  const sumulas = provasComComponentes.map((prova) => {
    return ["M", "F"].map((sexo) => {
      return CATEGORIAS.flatMap((cat) => {
        const isRevez = prova.tipo === "revezamento";

        if (isRevez) {
          // Revezamento: inscrições tipo "revezamento" agrupadas por equipe
          const inscsRevez = inscDoEvento.filter(
            (i) => i.tipo === "revezamento" && i.provaId === prova.id &&
              (i.categoriaOficialId || i.categoriaId) === cat.id &&
              i.sexo === sexo
          );
          if (inscsRevez.length === 0) return [];
          const equipesRevez = inscsRevez.map(i => {
            const eq = equipes.find(e => e.id === i.equipeId);
            const nomeEquipe = eq ? (eq.clube || eq.nome || "—") : (i.equipeId?.startsWith("clube_") ? i.equipeId.substring(6) : "—");
            const atlsObj = (i.atletasIds || []).map(aid => atletas.find(a => a.id === aid)).filter(Boolean);
            return { equipeId: i.equipeId, nomeEquipe, sigla: eq?.sigla || "", atletasIds: i.atletasIds || [], atletas: atlsObj, inscId: i.id };
          });
          const chavRes = `${eventoAtual.id}_${prova.id}_${cat.id}_${sexo}`;
          const resProva = (resultados && resultados[chavRes]) ? resultados[chavRes] : {};
          return [{ prova, sexo, categoria: cat, isRevezamento: true, equipesRevez, inscs: inscsRevez, resultados: resProva }];
        }

        const inscs = inscDoEvento.filter(
          (i) => i.provaId === prova.id &&
            (i.categoriaOficialId || i.categoriaId) === cat.id &&
            i.sexo === sexo && i.tipo !== "revezamento"
        );
        if (inscs.length === 0) return [];
        // Deduplicar por atletaId — atleta inscrito 2x na mesma prova não duplica na súmula
        const atletasInsc = inscs
          .map((i) => atletas.find((a) => a.id === i.atletaId))
          .filter(Boolean)
          .filter((a, idx, arr) => arr.findIndex(x => x.id === a.id) === idx);

        // Multi-fase: gerar uma entrada de súmula por fase que tenha seriação
        const _fasesS = getFasesProva(prova.id, eventoAtual.programaHorario || {});
        if (_fasesS.length > 1) {
          const entries = [];
          _fasesS.forEach(fase => {
            const serFase = buscarSeriacao(eventoAtual.seriacao, prova.id, cat.id, sexo, fase);
            const rKey = resKey(eventoAtual.id, prova.id, cat.id, sexo, fase);
            const resProva = (resultados && resultados[rKey]) ? resultados[rKey] : {};
            // Filtrar atletas pela seriação da fase se disponível
            let atletasFase = atletasInsc;
            if (serFase?.series) {
              const ids = serFase.series.flatMap(serie => serie.atletas.map(a => a.id || a.atletaId));
              const filtrados = atletasInsc.filter(a => ids.includes(a.id));
              if (filtrados.length > 0) atletasFase = filtrados;
            }
            entries.push({ prova, sexo, categoria: cat, atletas: atletasFase, inscs, resultados: resProva, faseSufixo: fase, faseNome: FASE_NOME[fase] || fase });
          });
          return entries;
        }

        // Sem multi-fase: comportamento legado
        const chavRes = `${eventoAtual.id}_${prova.id}_${cat.id}_${sexo}`;
        const resProva = (resultados && resultados[chavRes]) ? resultados[chavRes] : {};
        return [{ prova, sexo, categoria: cat, atletas: atletasInsc, inscs, resultados: resProva }];
      }).filter(Boolean);
    }).flat();
  }).flat().filter(Boolean);

  const provasDoPrograma = todasProvas.filter((p) =>
    (eventoAtual.provasPrograma || []).includes(p.id)
  );
  // Incluir componentes de combinadas no programa
  const provasDoProgramaCompleto = [...provasDoPrograma, ...provasComponentesArr];

  // Categorias que existem no programa da competição
  const categoriasDoPrograma = CATEGORIAS.filter(c =>
    provasDoProgramaCompleto.some(p => p.id.split("_")[1] === c.id || p.combinadaId)
  );

  // Provas filtradas pela categoria selecionada (nomes únicos)
  const provasFiltradas = filtroCat !== "todas"
    ? provasDoProgramaCompleto.filter(p => p.id.split("_")[1] === filtroCat || p.combinadaId)
    : provasDoProgramaCompleto;
  const nomesProvasUnicos = [...new Set(provasFiltradas.map(p => p.nome))].sort();

  const sumuFiltradas = (() => {
    const filtered = sumulas.filter((sum) => {
      if (sum.prova.tipo === "combinada") return false;
      if (filtroProva !== "todas" && sum.prova.nome !== filtroProva) return false;
      if (filtroCat !== "todas" && sum.categoria.id !== filtroCat) return false;
      if (filtroSexo !== "todos" && sum.sexo !== filtroSexo) return false;
      return true;
    });
    // Deduplicar por chave única — protege contra provas geradas em duplicata
    const vistas = new Set();
    return filtered.filter(sum => {
      const k = `${sum.prova.id}_${sum.categoria.id}_${sum.sexo}${sum.faseSufixo ? "__" + sum.faseSufixo : ""}`;
      if (vistas.has(k)) return false;
      vistas.add(k);
      return true;
    });
  })();

  // Chave única por súmula
  const sumuKey = (sum) => `${sum.prova.id}_${sum.categoria.id}_${sum.sexo}${sum.faseSufixo ? "__" + sum.faseSufixo : ""}`;

  // Orientação padrão: campo/altura = landscape, pista = portrait
  const orientPadrao = (sum) => {
    if (sum.prova.unidade !== "s") return "landscape";
    return "portrait";
  };

  // Orientação efetiva (configurada ou padrão)
  const getOrient = (sum) => orientacoes[sumuKey(sum)] || orientPadrao(sum);

  const toggleOrient = (sum) => {
    const key = sumuKey(sum);
    const atual = orientacoes[key] || orientPadrao(sum);
    setOrientacoes(prev => ({ ...prev, [key]: atual === "portrait" ? "landscape" : "portrait" }));
  };

  // Aplicar orientação em lote
  const setTodas = (orient) => {
    const novo = {};
    sumuFiltradas.forEach(sum => { novo[sumuKey(sum)] = orient; });
    setOrientacoes(prev => ({ ...prev, ...novo }));
  };

  // Resetar para padrão
  const resetOrient = () => {
    const novo = {};
    sumuFiltradas.forEach(sum => { novo[sumuKey(sum)] = orientPadrao(sum); });
    setOrientacoes(prev => ({ ...prev, ...novo }));
  };

  // Abre janela de impressão com as súmulas filtradas atualmente
  const handleImprimir = () => {
    if (sumuFiltradas.length === 0) return;
    // Monta mapa de orientações para passar ao gerador
    const orientMap = {};
    sumuFiltradas.forEach(sum => { orientMap[sumuKey(sum)] = getOrient(sum); });
    // Imprimir sempre em branco (sem resultados) — para preenchimento manual
    const sumuEmBranco = sumuFiltradas.map(sum => ({ ...sum, resultados: {} }));
    const html = gerarHtmlImpressao(sumuEmBranco, eventoAtual, atletas, {}, orientMap, numeracaoPeito[eventoAtual?.id] || {}, equipes, recordes);
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { alert("Permita pop-ups para gerar a impressão."); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
    if (usuarioLogado && registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Gerou súmulas", `${sumuFiltradas.length} súmula(s) — ${eventoAtual.nome}`, usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "sumulas" });
  };

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>📋 Súmulas</h1>
          <div style={{ color: t.textDimmed, fontSize: 13 }}>{eventoAtual.nome}</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {isAmplo && sumuFiltradas.length > 0 && (
            <button style={{ ...s.btnPrimary, display: "flex", alignItems: "center", gap: 8 }} onClick={handleImprimir}>
              🖨 Imprimir Súmulas
              <span style={{ background: "#00000033", borderRadius: 10, padding: "1px 8px", fontSize: 11 }}>
                {sumuFiltradas.length}
              </span>
            </button>
          )}
          {isAmplo && (
            <button style={{ ...s.btnSecondary, background: t.accentBg, borderColor: t.accentBorder, color: t.accent }}
              onClick={() => setShowSeriar(!showSeriar)}>
              🔀 Seriar Provas
            </button>
          )}
          {(isAdmin || isOrg || (usuarioLogado?.tipo === "funcionario" && usuarioLogado?.permissoes?.includes("resultados"))) && (
            <button style={s.btnSecondary} onClick={() => setTela("digitar-resultados")}>✏️ Digitar Resultados</button>
          )}
          <button style={s.btnSecondary} onClick={() => setTela("resultados")}>📊 Ver Resultados</button>
          <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Competição</button>
        </div>
      </div>

      {/* Aviso de impressão filtrada */}
      {isAmplo && sumuFiltradas.length > 0 && (filtroProva !== "todas" || filtroCat !== "todas" || filtroSexo !== "todos") && (
        <div style={{ background: `${t.success}12`, border: `1px solid ${t.success}44`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: t.success, display: "flex", alignItems: "center", gap: 8 }}>
          🖨 O botão de impressão irá gerar apenas as <strong>{sumuFiltradas.length} súmula(s)</strong> filtradas atualmente.
          <button style={{ ...s.linkBtn, marginLeft: 8 }} onClick={() => { setFiltroProva("todas"); setFiltroCat("todas"); setFiltroSexo("todos"); }}>
            Limpar filtros para imprimir tudo
          </button>
        </div>
      )}

      {/* ── PAINEL DE SERIAÇÃO ── */}
      {showSeriar && isAmplo && (() => {
        const eid = eventoAtual.id;
        const configSeriacao = eventoAtual.configSeriacao || {};
        const seriacaoSalva = eventoAtual.seriacao || {};
        const todasP = todasAsProvas();
        const inscDoEvento = inscricoes.filter(i => i.eventoId === eid);

        const _metrosFromId = (id) => { const m = id.match(/[_x]?(\d+)m/); return m ? parseInt(m[1]) : 0; };

        // Helper para extrair config por prova (suporta formato antigo string e novo objeto)
        const getConfigProva = (provaId) => {
          const cfg = configSeriacao[provaId];
          if (!cfg) return { modo: "final_tempo", nRaias: 8, atlPorSerie: 12, porPosicao: 3, porTempo: 2 };
          if (typeof cfg === "string") return { modo: cfg, nRaias: 8, atlPorSerie: 12, porPosicao: 3, porTempo: 2 };
          return { modo: cfg.modo || "final_tempo", nRaias: cfg.nRaias || 8, atlPorSerie: cfg.atlPorSerie || 12, porPosicao: cfg.porPosicao ?? 3, porTempo: cfg.porTempo ?? 2 };
        };

        // Salvar config de uma prova no evento
        const salvarConfigProva = (provaId, campo, valor) => {
          const cfgAtual = { ...configSeriacao };
          const base = todasP.find(p => p.id === provaId);
          const mesmoNome = todasP.filter(p => p.nome === base?.nome && (eventoAtual.provasPrograma || []).includes(p.id));
          mesmoNome.forEach(p => {
            const prev = cfgAtual[p.id];
            const prevObj = (!prev) ? {} : (typeof prev === "string") ? { modo: prev } : { ...prev };
            cfgAtual[p.id] = { ...prevObj, [campo]: valor };
          });
          editarEvento({ ...eventoAtual, configSeriacao: cfgAtual });
        };

        // Provas de pista com inscritos — expandidas por fase quando há multi-fases
        const progHorario = eventoAtual.programaHorario || {};
        const provasPista = [];
        (eventoAtual.provasPrograma || []).forEach(provaId => {
          const p = todasP.find(pp => pp.id === provaId);
          if (!p || p.unidade !== "s" || p.tipo === "combinada" || p.tipo === "revezamento") return;
          const metros = _metrosFromId(provaId);
          if (metros === 0) return;
          const cfgP = getConfigProva(provaId);
          const isLonga = metros > 800;
          const fasesConf = getFasesProva(provaId, progHorario); // ex: ["ELI","SEM","FIN"]
          const multiFases = fasesConf.length > 1;

          CATEGORIAS.forEach(cat => {
            ["M","F"].forEach(sexo => {
              const inscs = inscDoEvento.filter(i =>
                i.provaId === provaId && (i.categoriaOficialId || i.categoriaId) === cat.id && i.sexo === sexo && !i.origemCombinada
              );
              if (inscs.length <= 0) return;

              if (multiFases) {
                // Multi-fase: uma entrada por fase
                fasesConf.forEach((faseSuf, faseIdx) => {
                  const chave = serKey(provaId, cat.id, sexo, faseSuf);
                  const jaSeriada = !!seriacaoSalva[chave];
                  const capacidade = isLonga ? cfgP.atlPorSerie : cfgP.nRaias;
                  const faseAnterior = FASE_ANTERIOR[faseSuf] || null;
                  provasPista.push({
                    provaId, prova: p, cat, sexo, inscs, chave,
                    modo: cfgP.modo, nRaias: cfgP.nRaias, atlPorSerie: cfgP.atlPorSerie,
                    isLonga, metros, jaSeriada, nInscritos: inscs.length, capacidade,
                    // Campos de fase:
                    faseSufixo: faseSuf, faseNome: FASE_NOME[faseSuf] || faseSuf,
                    faseIdx, multiFases: true, faseAnterior,
                    fasesConf, // todas as fases da prova
                  });
                });
              } else {
                // Fase única ou sem fase — compatibilidade
                const chave = serKey(provaId, cat.id, sexo, "");
                const jaSeriada = !!seriacaoSalva[chave];
                const capacidade = isLonga ? cfgP.atlPorSerie : cfgP.nRaias;
                provasPista.push({
                  provaId, prova: p, cat, sexo, inscs, chave,
                  modo: cfgP.modo, nRaias: cfgP.nRaias, atlPorSerie: cfgP.atlPorSerie,
                  isLonga, metros, jaSeriada, nInscritos: inscs.length, capacidade,
                  faseSufixo: "", faseNome: "", faseIdx: 0, multiFases: false,
                  faseAnterior: null, fasesConf: [],
                });
              }
            });
          });
        });

        // Provas de REVEZAMENTO com inscrições
        const provasRevezPista = [];
        (eventoAtual.provasPrograma || []).forEach(provaId => {
          const p = todasP.find(pp => pp.id === provaId);
          if (!p || p.tipo !== "revezamento") return;
          const metros = _metrosFromId(provaId);
          const cfgP = getConfigProva(provaId);
          CATEGORIAS.forEach(cat => {
            ["M","F"].forEach(sexo => {
              const inscs = inscDoEvento.filter(i =>
                i.tipo === "revezamento" && i.provaId === provaId &&
                (i.categoriaOficialId || i.categoriaId) === cat.id && i.sexo === sexo
              );
              if (inscs.length <= 0) return;
              const chave = `${provaId}_${cat.id}_${sexo}`;
              const jaSeriada = !!seriacaoSalva[chave];
              // Revezamentos: mapear equipes
              const equipesRevez = inscs.map(i => {
                const eq = equipes.find(e => e.id === i.equipeId);
                return {
                  id: i.equipeId, equipeId: i.equipeId,
                  nomeEquipe: eq ? (eq.clube || eq.nome || "—") : (i.equipeId?.startsWith("clube_") ? i.equipeId.substring(6) : "—"),
                  sigla: eq?.sigla || "",
                  atletaId: i.equipeId, // alias para compatibilidade com seriação
                  nome: eq ? (eq.clube || eq.nome || "—") : "—", // alias para preview
                };
              });
              provasRevezPista.push({
                provaId, prova: p, cat, sexo, inscs, chave, nRaias: cfgP.nRaias || 8,
                metros, jaSeriada, nInscritos: inscs.length, capacidade: cfgP.nRaias || 8,
                isRevez: true, equipesRevez,
              });
            });
          });
        });

        const executarSeriacao = (item) => {
          setSeriacaoProvaId(item.provaId);
          setSeriacaoCat(item.cat.id);
          setSeriacaoSexo(item.sexo);
          setSeriacaoChaveAtiva(item.chave);
          const salva = seriacaoSalva[item.chave];
          const mRef = {};
          const mSer = {};
          item.inscs.forEach(i => {
            const a = atletas.find(aa => aa.id === i.atletaId);
            if (a) {
              mRef[a.id] = salva?.marcasRef?.[a.id] || "";
              mSer[a.id] = { serie: 1, raia: "" };
            }
          });
          // Se já tem seriação salva, carregar no manual
          if (salva && salva.series) {
            salva.series.forEach(ser => {
              ser.atletas.forEach(sa => {
                const aid = sa.id || sa.atletaId;
                if (aid) mSer[aid] = { serie: ser.numero, raia: sa.raia || "" };
              });
            });
          }
          setMarcasRef(mRef);
          setManualSeries(mSer);
          setSeriacaoPreview(null);
          setSeriacaoModo("marca");
          // Fase: usar a fase do item (se multi-fases) ou a fase salva
          const faseSuf = item.faseSufixo || "";
          if (faseSuf === "ELI") setSeriacaoFase("eliminatoria");
          else if (faseSuf === "SEM") setSeriacaoFase("semifinal");
          else if (faseSuf === "FIN") setSeriacaoFase("final");
          else setSeriacaoFase(salva?.fase || "eliminatoria");
          // 800m: restaurar modo salvo
          if (item.metros === 800) {
            setSeriacao800m(salva?.tipoLargada === "grupo" ? "grupo" : "raias");
          }
        };

        const gerarPreview = () => {
          const item = provasPista.find(pp => pp.chave === seriacaoChaveAtiva);
          if (!item) return;

          // Determinar se prova é largada em grupo (usa o engine para decidir)
          const isGrupo = SeriacaoEngine._isLargadaEmGrupo(item.prova, { modo800: item.metros === 800 ? seriacao800m : "raias" });
          const capacidade = isGrupo ? item.atlPorSerie : item.nRaias;

          const configEngine = {
            nRaias: item.nRaias,
            fase: seriacaoFase,
            atlPorSerie: item.atlPorSerie,
            modo800: item.metros === 800 ? seriacao800m : "raias",
          };

          if (seriacaoModo === "manual") {
            // Manual: agrupar por série conforme o organizador definiu
            const seriesMap = {};
            Object.entries(manualSeries).forEach(([atletaId, cfg]) => {
              const serNum = parseInt(cfg.serie) || 1;
              if (!seriesMap[serNum]) seriesMap[serNum] = [];
              const a = atletas.find(aa => aa.id === atletaId);
              if (a) seriesMap[serNum].push({ ...a, atletaId, raia: parseInt(cfg.raia) || null, posicao: parseInt(cfg.raia) || null, ranking: null });
            });
            const seriesArr = Object.keys(seriesMap).sort((a,b) => a-b).map(num => ({
              numero: parseInt(num),
              atletas: seriesMap[num].sort((a,b) => (a.raia || 99) - (b.raia || 99)),
            }));
            const ordemSeries = seriesArr.map(ser => ser.numero);
            const regraAplicada = "Manual — sem regra automática";
            setSeriacaoPreview({ series: seriesArr, ordemSeries, modo: item.modo, chave: item.chave, regraAplicada, tipoLargada: isGrupo ? "grupo" : "raias" });
          } else if (seriacaoModo === "aleatorio") {
            // Aleatório: sorteio livre (RT 20.4.1)
            const atletasList = item.inscs.map(i => {
              const a = atletas.find(aa => aa.id === i.atletaId);
              return { ...a, atletaId: a?.id, marcaRef: "" };
            }).filter(x => x.atletaId);
            // Embaralhar
            for (let i = atletasList.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [atletasList[i], atletasList[j]] = [atletasList[j], atletasList[i]];
            }
            const result = SeriacaoEngine.seriarProva(atletasList, item.prova, { ...configEngine, fase: "eliminatoria" });
            setSeriacaoPreview({ ...result, modo: item.modo, chave: item.chave });
          } else {
            // Por marca (padrão) — usa a fase selecionada
            const atletasComMarca = item.inscs.map(i => {
              const a = atletas.find(aa => aa.id === i.atletaId);
              return { ...a, atletaId: a?.id, marcaRef: marcasRef[a?.id] || "" };
            }).filter(x => x.atletaId);
            const result = SeriacaoEngine.seriarProva(atletasComMarca, item.prova, configEngine);
            setSeriacaoPreview({ ...result, modo: item.modo, chave: item.chave });
          }
        };

        // ═══ GERAR SERIAÇÃO A PARTIR DA FASE ANTERIOR ═══
        // Usa RT 20.3.2(a) para rankear classificados e RT 20.4.x para raias
        const gerarFromFaseAnterior = () => {
          const item = provasPista.find(pp => pp.chave === seriacaoChaveAtiva);
          if (!item || !item.faseAnterior) return;

          const cfgP = getConfigProva(item.provaId);
          const progressao = { porPosicao: cfgP.porPosicao ?? 3, porTempo: cfgP.porTempo ?? 2 };

          // Buscar seriação da fase anterior
          const chaveSerAnterior = serKey(item.provaId, item.cat.id, item.sexo, item.faseAnterior);
          const serAnterior = seriacaoSalva[chaveSerAnterior];
          if (!serAnterior?.series) {
            alert(`Sem seriação da ${FASE_NOME[item.faseAnterior]} encontrada. Gere primeiro a seriação da fase anterior.`);
            return;
          }

          // Buscar resultados da fase anterior
          const chaveResAnterior = resKey(eventoAtual.id, item.provaId, item.cat.id, item.sexo, item.faseAnterior);
          const resAnterior = resultados[chaveResAnterior] || {};
          if (Object.keys(resAnterior).length === 0) {
            alert(`Sem resultados da ${FASE_NOME[item.faseAnterior]} encontrados. Insira os resultados da fase anterior primeiro.`);
            return;
          }

          // Aplicar RT 20.3.2(a) — ranking dos classificados
          const classificados = SeriacaoEngine.rankearRT20_3_2a(serAnterior, resAnterior, progressao);

          if (classificados.length === 0) {
            alert(`Nenhum atleta classificado encontrado. Verifique se os resultados da ${FASE_NOME[item.faseAnterior]} estão corretos.`);
            return;
          }

          // Mapear atletas completos
          const atletasClassif = classificados.map(c => {
            const a = atletas.find(aa => aa.id === c.atletaId);
            return a ? { ...a, atletaId: a.id, marcaRef: c.marcaRef, origemClassif: c.origemClassif, ranking: c.ranking } : null;
          }).filter(Boolean);

          // Preencher marcasRef para exibição
          const mRef = {};
          atletasClassif.forEach(a => { mRef[a.id] = a.marcaRef || ""; });
          setMarcasRef(mRef);

          // Determinar fase de seriação para regra de raias
          const faseParaEngine = item.faseSufixo === "FIN" ? "final" : item.faseSufixo === "SEM" ? "semifinal" : "eliminatoria";

          const isGrupo = SeriacaoEngine._isLargadaEmGrupo(item.prova, { modo800: item.metros === 800 ? seriacao800m : "raias" });
          const configEngine = {
            nRaias: item.nRaias,
            fase: faseParaEngine,
            atlPorSerie: item.atlPorSerie,
            modo800: item.metros === 800 ? seriacao800m : "raias",
          };

          const result = SeriacaoEngine.seriarProva(atletasClassif, item.prova, configEngine);
          const nClassP = classificados.filter(c => c.origemClassif === "posicao").length;
          const nClassT = classificados.filter(c => c.origemClassif === "tempo").length;
          const regraExtra = `Classificados: ${nClassP}P + ${nClassT}T = ${classificados.length} atletas (da ${FASE_NOME[item.faseAnterior]})`;

          setSeriacaoPreview({
            ...result,
            modo: item.modo,
            chave: item.chave,
            regraAplicada: `${result.regraAplicada} · RT 20.3.2(a) · ${regraExtra}`,
            classificadosInfo: { porPosicao: nClassP, porTempo: nClassT, total: classificados.length, faseOrigem: FASE_NOME[item.faseAnterior] },
          });
        };

        const salvarSeriacao = () => {
          if (!seriacaoPreview) return;
          const item = provasPista.find(pp => pp.chave === seriacaoChaveAtiva);
          const novasSer = { ...seriacaoSalva };
          novasSer[seriacaoChaveAtiva] = {
            series: seriacaoPreview.series,
            ordemSeries: seriacaoPreview.ordemSeries,
            modo: seriacaoPreview.modo,
            marcasRef: { ...marcasRef },
            timestamp: Date.now(),
            fase: seriacaoFase,
            faseSufixo: item?.faseSufixo || "",
            tipoLargada: seriacaoPreview.tipoLargada || "raias",
            regraAplicada: seriacaoPreview.regraAplicada || "",
          };
          editarEvento({ ...eventoAtual, seriacao: novasSer });
          setSeriacaoPreview(null);
          setSeriacaoChaveAtiva(null);
          setSeriacaoProvaId(null);
        };

        const limparSeriacao = (chave) => {
          const novasSer = { ...seriacaoSalva };
          delete novasSer[chave];
          editarEvento({ ...eventoAtual, seriacao: novasSer });
        };

        const itemAtivo = provasPista.find(pp => pp.chave === seriacaoChaveAtiva);
        const itemAtivoRevez = provasRevezPista.find(pp => pp.chave === `${seriacaoProvaId}_${seriacaoCat}_${seriacaoSexo}`);

        // Agrupar provas por nome para config (inclui revezamentos)
        const nomesConfig = {};
        (eventoAtual.provasPrograma || []).forEach(provaId => {
          const p = todasP.find(pp => pp.id === provaId);
          if (!p || p.unidade !== "s" || p.tipo === "combinada") return;
          if (p.tipo === "revezamento") {
            // Revezamentos: config simplificada (só raias)
            if (!nomesConfig[p.nome]) nomesConfig[p.nome] = { provas: [], metros: _metrosFromId(provaId), isLonga: false, isRevez: true };
            nomesConfig[p.nome].provas.push(p);
            return;
          }
          const m = _metrosFromId(provaId);
          if (m === 0) return;
          if (!nomesConfig[p.nome]) nomesConfig[p.nome] = { provas: [], metros: m, isLonga: m > 800 };
          nomesConfig[p.nome].provas.push(p);
        });

        return (
          <div style={{ background: t.bgCardAlt, border:"1px solid #2a2a0a", borderRadius:12, padding:"16px 20px", marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div>
                <div style={{ color: t.accent, fontWeight:800, fontSize:16, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1 }}>
                  🔀 SERIAÇÃO — RT 20.3 a 20.8
                </div>
                <div style={{ color: t.textDimmed, fontSize:11, marginTop:2 }}>
                  Configure modo e capacidade por prova, depois serie cada prova individualmente
                </div>
              </div>
              <button style={s.btnGhost} onClick={() => setShowSeriar(false)}>✕ Fechar</button>
            </div>

            {/* \u2500\u2500 CONFIGURAÇÃO POR PROVA \u2500\u2500 */}
            <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:"12px 14px", marginBottom:14 }}>
              <div style={{ color: t.textTertiary, fontWeight:700, fontSize:12, marginBottom:8 }}>⚙️ Configuração por Prova</div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {Object.keys(nomesConfig).map(nome => {
                  const { provas, metros: mt, isLonga } = nomesConfig[nome];
                  const cfgP = getConfigProva(provas[0].id);
                  return (
                    <div key={nome} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 10px", background:t.bgHeaderSolid, borderRadius:6, border:`1px solid ${t.border}`, flexWrap:"wrap" }}>
                      <span style={{ color: t.textPrimary, fontWeight:600, fontSize:12, minWidth:130 }}>{nome}</span>
                      <span style={{ fontSize:9, color: t.textDimmed, minWidth:40 }}>{mt}m</span>
                      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <span style={{ color: t.textMuted, fontSize:10 }}>{isLonga ? "Atl/série:" : "Raias:"}</span>
                        {isLonga ? (
                          <input
                            type="number" min="1" max="99"
                            style={{ background:t.bgHover, border:`1px solid ${t.border}`, borderRadius:4, color: t.accent, fontSize:12, fontWeight:700, padding:"3px 6px", width:48, textAlign:"center" }}
                            value={cfgP.atlPorSerie || 12}
                            onChange={(e) => { const v = parseInt(e.target.value) || 1; salvarConfigProva(provas[0].id, "atlPorSerie", Math.max(1, Math.min(99, v))); }}
                          />
                        ) : (
                          <select
                            style={{ background:t.bgHover, border:`1px solid ${t.border}`, borderRadius:4, color: t.accent, fontSize:12, fontWeight:700, padding:"3px 6px", cursor:"pointer", width:52 }}
                            value={cfgP.nRaias || 8}
                            onChange={(e) => salvarConfigProva(provas[0].id, "nRaias", parseInt(e.target.value))}
                          >
                            {[4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        )}
                      </div>
                      <div style={{ display:"flex", gap:3 }}>
                        {[["semifinal_final","Semi + Final"],["final_tempo","Final/Tempo"]].map(([val,lbl]) => (
                          <button key={val}
                            style={{
                              padding:"3px 9px", borderRadius:4, border:"1px solid",
                              fontSize:10, fontWeight:600, cursor:"pointer",
                              background: cfgP.modo === val ? (val === "semifinal_final" ? "#1a2a1a" : `${t.warning}22`) : t.bgHeaderSolid,
                              color: cfgP.modo === val ? (val === "semifinal_final" ? "#7cfc7c" : "#1976D2") : "#555",
                              borderColor: cfgP.modo === val ? (val === "semifinal_final" ? "#2a6a2a" : "#6a6a0a") : t.border,
                            }}
                            onClick={() => salvarConfigProva(provas[0].id, "modo", val)}
                          >{lbl}</button>
                        ))}
                      </div>
                      {/* Progressão P+T: aparece quando prova tem multi-fases */}
                      {temMultiFases(provas[0].id, progHorario) && (
                        <div style={{ display:"flex", alignItems:"center", gap:4, borderLeft:"2px solid #2a3050", paddingLeft:6 }}>
                          <span style={{ fontSize:9, color: t.textMuted }}>Progressão:</span>
                          <span style={{ fontSize:9, color: t.success }}>P</span>
                          <input type="number" min="0" max="8"
                            style={{ width:32, padding:"2px 3px", background:t.bgHover, border:"1px solid #2a4a2a", borderRadius:3, color: t.success, textAlign:"center", fontSize:11, fontWeight:700 }}
                            value={cfgP.porPosicao ?? 3}
                            onChange={(e) => salvarConfigProva(provas[0].id, "porPosicao", Math.max(0, Math.min(8, parseInt(e.target.value) || 0)))}
                            title="Classificados por posição (primeiros de cada série)"
                          />
                          <span style={{ fontSize:9, color: t.accent }}>+T</span>
                          <input type="number" min="0" max="16"
                            style={{ width:32, padding:"2px 3px", background:t.bgHover, border:"1px solid #4a4a0a", borderRadius:3, color: t.accent, textAlign:"center", fontSize:11, fontWeight:700 }}
                            value={cfgP.porTempo ?? 2}
                            onChange={(e) => salvarConfigProva(provas[0].id, "porTempo", Math.max(0, Math.min(16, parseInt(e.target.value) || 0)))}
                            title="Classificados por tempo (melhores tempos entre os restantes)"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* \u2500\u2500 LISTA DE PROVAS PARA SERIAR \u2500\u2500 */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
              {provasPista.filter(item => !(item.multiFases && item.faseSufixo === "FIN")).map(item => {
                const ativo = item.chave === seriacaoChaveAtiva;
                const nSeries = SeriacaoEngine.calcularNumSeries(item.nInscritos, item.capacidade);
                const precisaSeriacao = item.nInscritos > item.capacidade;
                const faseColor = item.faseSufixo === "ELI" ? "#ff8844" : item.faseSufixo === "SEM" ? "#88aaff" : item.faseSufixo === "FIN" ? "#7cfc7c" : "#aaa";
                const proximaFaseSuf = item.faseSufixo === "ELI" ? "SEM" : item.faseSufixo === "SEM" ? "FIN" : null;
                const chaveProxFase = proximaFaseSuf ? serKey(item.provaId, item.cat.id, item.sexo, proximaFaseSuf) : null;
                const proxFaseAutoGerada = chaveProxFase && seriacaoSalva[chaveProxFase]?.autoGerada;
                return (
                  <button key={item.chave}
                    style={{
                      padding:"6px 12px", borderRadius:6, fontSize:11, cursor:"pointer",
                      border: item.jaSeriada ? "1px solid #2a6a2a" : "1px solid #2a2a3a",
                      background: ativo ? t.accentBg : item.jaSeriada ? t.bgCardAlt : t.bgHeaderSolid,
                      color: ativo ? "#fff" : item.jaSeriada ? "#7cfc7c" : "#aaa",
                      fontWeight: ativo ? 700 : 500,
                      outline: ativo ? "2px solid #1976D2" : "none",
                      opacity: precisaSeriacao || item.jaSeriada || item.faseIdx > 0 ? 1 : 0.5,
                    }}
                    onClick={() => executarSeriacao(item)}
                    title={`${item.nInscritos} atletas · ${nSeries} série(s) · ${item.isLonga ? item.atlPorSerie + " atl/sér" : item.nRaias + " raias"} · ${item.faseNome || "Final"}`}
                  >
                    {item.prova.nome} · {item.cat.nome} · {item.sexo === "M" ? "M" : "F"}
                    {item.multiFases && (
                      <span style={{ fontSize:8, marginLeft:3, padding:"1px 5px", borderRadius:3, fontWeight:700, background: item.faseSufixo === "ELI" ? `${t.warning}15` : item.faseSufixo === "SEM" ? t.accentBg : `${t.success}15`, color: faseColor, border:`1px solid ${faseColor}33` }}>
                        {item.faseNome}
                      </span>
                    )}
                    <span style={{ fontSize:9, marginLeft:4, color: item.jaSeriada ? "#4cff4c" : "#555" }}>
                      ({item.faseIdx === 0 ? `${item.nInscritos}atl` : "?"}/{nSeries}sér)
                      {item.jaSeriada && " ✓"}
                    </span>
                    {proxFaseAutoGerada && (
                      <span style={{ fontSize:8, marginLeft:3, padding:"1px 4px", borderRadius:3, background:`${t.success}15`, color: t.success, border:"1px solid #2a6a2a33" }}>
                        → Final ✓
                      </span>
                    )}
                  </button>
                );
              })}
              {provasPista.length === 0 && <span style={{ color: t.textDimmed, fontSize:12 }}>Nenhuma prova de pista com inscritos encontrada.</span>}
            </div>

            {/* ── REVEZAMENTOS ── */}
            {provasRevezPista.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ color: t.accent, fontWeight:700, fontSize:12, marginBottom:6, borderTop:`1px solid ${t.border}`, paddingTop:10 }}>
                  🏃‍♂️ Revezamentos
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {provasRevezPista.map(item => {
                    const ativo = item.chave === `${seriacaoProvaId}_${seriacaoCat}_${seriacaoSexo}`;
                    return (
                      <button key={item.chave}
                        style={{
                          padding:"6px 12px", borderRadius:6, fontSize:11, cursor:"pointer",
                          border: item.jaSeriada ? "1px solid #2a6a2a" : "1px solid #2a2a6a",
                          background: ativo ? t.accentBg : item.jaSeriada ? t.bgCardAlt : t.bgHeaderSolid,
                          color: ativo ? "#fff" : item.jaSeriada ? "#7cfc7c" : "#88aaff",
                          fontWeight: ativo ? 700 : 500,
                          outline: ativo ? "2px solid #1976D2" : "none",
                        }}
                        onClick={() => {
                          setSeriacaoProvaId(item.provaId);
                          setSeriacaoCat(item.cat.id);
                          setSeriacaoSexo(item.sexo);
                          const salva = seriacaoSalva[item.chave];
                          const mSer = {};
                          item.equipesRevez.forEach(eq => {
                            mSer[eq.equipeId] = { serie: 1, raia: "" };
                          });
                          if (salva && salva.series) {
                            salva.series.forEach(ser => {
                              ser.atletas.forEach(sa => {
                                const eqId = sa.id || sa.equipeId;
                                if (eqId) mSer[eqId] = { serie: ser.numero, raia: sa.raia || "" };
                              });
                            });
                          }
                          setManualSeries(mSer);
                          setSeriacaoModo("manual");
                          setSeriacaoPreview(null);
                        }}
                      >
                        {item.prova.nome} · {item.cat.nome} · {item.sexo === "M" ? "M" : "F"}
                        <span style={{ fontSize:9, marginLeft:4, color: item.jaSeriada ? "#4cff4c" : "#555" }}>
                          ({item.nInscritos}eq/{item.nRaias}raias)
                          {item.jaSeriada && " ✓"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}


            {/* \u2500\u2500 PAINEL DE EDIÇÃO \u2500\u2500 */}
            {itemAtivo && (
              <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div>
                    <strong style={{ color: t.textPrimary, fontSize:14 }}>{itemAtivo.prova.nome}</strong>
                    <span style={{ color: t.textMuted, fontSize:12, marginLeft:8 }}>
                      {itemAtivo.cat.nome} · {itemAtivo.sexo === "M" ? "Masculino" : "Feminino"} · {itemAtivo.nInscritos} atletas
                    </span>
                    <span style={{
                      marginLeft:8, fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:600,
                      background: itemAtivo.modo === "final_tempo" ? `${t.warning}22` : `${t.success}15`,
                      color: itemAtivo.modo === "final_tempo" ? "#1976D2" : "#7cfc7c",
                    }}>
                      {itemAtivo.modo === "final_tempo" ? "Final por Tempo" : "Semifinal + Final"}
                    </span>
                    <span style={{ marginLeft:6, fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:600, background: t.accentBg, color: t.accent }}>
                      {itemAtivo.isLonga ? `${itemAtivo.atlPorSerie} atl/série` : `${itemAtivo.nRaias} raias`}
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {itemAtivo.jaSeriada && (
                      <button style={{ ...s.btnGhost, fontSize:11, color: t.danger, borderColor:"#4a1a1a" }}
                        onClick={() => limparSeriacao(itemAtivo.chave)}>🗑 Limpar</button>
                    )}
                  </div>
                </div>

                {/* Seletor de modo de seriação */}
                <div style={{ display:"flex", gap:4, marginBottom:10 }}>
                  {[["marca","📊 Por Marca"],["aleatorio","🎲 Aleatório"],["manual","✏️ Manual"]].map(([val,lbl]) => (
                    <button key={val}
                      style={{
                        padding:"5px 14px", borderRadius:5, border:"1px solid",
                        fontSize:11, fontWeight:600, cursor:"pointer",
                        background: seriacaoModo === val ? t.accentBg : t.bgHeaderSolid,
                        color: seriacaoModo === val ? "#fff" : "#666",
                        borderColor: seriacaoModo === val ? "#4a8aff" : t.border,
                      }}
                      onClick={() => { setSeriacaoModo(val); setSeriacaoPreview(null); }}
                    >{lbl}</button>
                  ))}
                </div>

                {/* RT 20.4.1/20.4.2 — Seletor de Fase (afeta regra de raias) */}
                {seriacaoModo !== "manual" && (
                  <div style={{ display:"flex", gap:4, marginBottom:10, alignItems:"center" }}>
                    <span style={{ fontSize:10, color: t.textMuted, marginRight:4 }}>Fase:</span>
                    {[["eliminatoria","Eliminatória"],["semifinal","Semifinal"],["final","Final"]].map(([val,lbl]) => (
                      <button key={val}
                        style={{
                          padding:"4px 10px", borderRadius:4, border:"1px solid", fontSize:10, fontWeight:600, cursor:"pointer",
                          background: seriacaoFase === val ? (val === "eliminatoria" ? `${t.warning}15` : val === "semifinal" ? t.accentBg : `${t.success}15`) : t.bgHeaderSolid,
                          color: seriacaoFase === val ? (val === "eliminatoria" ? "#ff9d3a" : val === "semifinal" ? "#6ab4ff" : "#7cfc7c") : "#555",
                          borderColor: seriacaoFase === val ? (val === "eliminatoria" ? "#5a3a1a" : val === "semifinal" ? "#2a4a6a" : "#2a4a2a") : t.border,
                        }}
                        onClick={() => { setSeriacaoFase(val); setSeriacaoPreview(null); }}
                      >{lbl}</button>
                    ))}
                    <span style={{ fontSize:9, color: t.textDimmed, marginLeft:8, fontStyle:"italic" }}>
                      {seriacaoFase === "eliminatoria"
                        ? "RT 20.4.1 — Raias por sorteio livre"
                        : itemAtivo.isLonga || (itemAtivo.metros === 800 && seriacao800m === "grupo")
                          ? "RT 20.4.6 — Posições por sorteio"
                          : itemAtivo.metros <= 110
                            ? "RT 20.4.3 — Grupos: A(3-6) B(2,7) C(1,8)"
                            : itemAtivo.metros === 200
                              ? "RT 20.4.4 — Grupos: A(5-7) B(3,4,8) C(1,2)"
                              : "RT 20.4.5 — Grupos: A(4-7) B(3,8) C(1,2)"
                      }
                    </span>
                  </div>
                )}

                {/* RT 20.4.5/20.4.6 — Modo 800m (raias ou largada em grupo) */}
                {itemAtivo.metros === 800 && seriacaoModo !== "manual" && (
                  <div style={{ display:"flex", gap:4, marginBottom:10, alignItems:"center" }}>
                    <span style={{ fontSize:10, color: t.textMuted, marginRight:4 }}>800m:</span>
                    {[["raias","Em Raias (RT 20.4.5)"],["grupo","Largada em Grupo (RT 20.4.6)"]].map(([val,lbl]) => (
                      <button key={val}
                        style={{
                          padding:"4px 10px", borderRadius:4, border:"1px solid", fontSize:10, fontWeight:600, cursor:"pointer",
                          background: seriacao800m === val ? t.accentBg : t.bgHeaderSolid,
                          color: seriacao800m === val ? "#fff" : "#555",
                          borderColor: seriacao800m === val ? "#4a8aff" : t.border,
                        }}
                        onClick={() => { setSeriacao800m(val); setSeriacaoPreview(null); }}
                      >{lbl}</button>
                    ))}
                  </div>
                )}

                {/* Modo POR MARCA */}
                {seriacaoModo === "marca" && (
                  <div>
                    <div style={{ fontSize:11, color: t.textMuted, marginBottom:8 }}>
                      Informe a marca de referência (SB/PB) para rankeamento. Distribuição por séries (RT 20.3.3) com raias/posições conforme regra da fase selecionada (RT 20.4).
                    </div>
                    <div style={{ maxHeight:300, overflowY:"auto", marginBottom:10 }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                        <thead>
                          <tr style={{ borderBottom:"2px solid #2a3050" }}>
                            <th style={{ padding:"4px 8px", textAlign:"left", color: t.textMuted, fontSize:10 }}>#</th>
                            <th style={{ padding:"4px 8px", textAlign:"left", color: t.textMuted, fontSize:10 }}>Atleta</th>
                            <th style={{ padding:"4px 8px", textAlign:"left", color: t.textMuted, fontSize:10 }}>Clube/Equipe</th>
                            <th style={{ padding:"4px 8px", textAlign:"center", color: t.accent, fontSize:10, width:120 }}>Marca Ref. (s)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemAtivo.inscs.map((insc, idx) => {
                            const a = atletas.find(aa => aa.id === insc.atletaId);
                            if (!a) return null;
                            return (
                              <tr key={insc.id || `ref-${idx}`} style={{ borderBottom:`1px solid ${t.border}` }}>
                                <td style={{ padding:"4px 8px", color: t.textDimmed }}>{idx+1}</td>
                                <td style={{ padding:"4px 8px", color: t.textPrimary, fontWeight:500 }}>{a.nome}</td>
                                <td style={{ padding:"4px 8px", color: t.textDimmed, fontSize:11 }}>{getExibicaoEquipe(a, equipes)||"—"}</td>
                                <td style={{ padding:"4px 8px", textAlign:"center" }}>
                                  <input
                                    style={{ width:100, padding:"4px 8px", background:t.bgHover, border:`1px solid ${t.border}`, borderRadius:4, color: t.accent, textAlign:"center", fontSize:12, fontWeight:600 }}
                                    type="text" inputMode="decimal" placeholder="ex: 11.50"
                                    value={marcasRef[a.id] || ""}
                                    onChange={(e) => setMarcasRef(prev => ({ ...prev, [a.id]: e.target.value }))}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Modo ALEATÓRIO */}
                {seriacaoModo === "aleatorio" && (
                  <div style={{ fontSize:12, color: t.textMuted, marginBottom:10, padding:"10px 14px", background:t.bgHeaderSolid, borderRadius:6, border:`1px solid ${t.border}` }}>
                    🎲 As séries e raias serão sorteadas aleatoriamente. Clique em "Gerar" para sortear. Gere novamente se quiser outro resultado.
                  </div>
                )}

                {/* Modo MANUAL */}
                {seriacaoModo === "manual" && (() => {
                  const isGrupoManual = itemAtivo.isLonga || (itemAtivo.metros === 800 && seriacao800m === "grupo");
                  return (
                  <div>
                    <div style={{ fontSize:11, color: t.textMuted, marginBottom:8 }}>
                      Defina manualmente a série{!isGrupoManual ? " e raia" : " e posição"} de cada atleta.
                    </div>
                    <div style={{ maxHeight:350, overflowY:"auto", marginBottom:10 }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                        <thead>
                          <tr style={{ borderBottom:"2px solid #2a3050" }}>
                            <th style={{ padding:"4px 8px", textAlign:"left", color: t.textMuted, fontSize:10 }}>#</th>
                            <th style={{ padding:"4px 8px", textAlign:"left", color: t.textMuted, fontSize:10 }}>Atleta</th>
                            <th style={{ padding:"4px 8px", textAlign:"left", color: t.textMuted, fontSize:10 }}>Clube/Equipe</th>
                            <th style={{ padding:"4px 8px", textAlign:"center", color: t.accent, fontSize:10, width:60 }}>Série</th>
                            {!isGrupoManual && <th style={{ padding:"4px 8px", textAlign:"center", color: t.accent, fontSize:10, width:60 }}>Raia</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {itemAtivo.inscs.map((insc, idx) => {
                            const a = atletas.find(aa => aa.id === insc.atletaId);
                            if (!a) return null;
                            const ms = manualSeries[a.id] || { serie: 1, raia: "" };
                            return (
                              <tr key={insc.id || `manual-${idx}`} style={{ borderBottom:`1px solid ${t.border}` }}>
                                <td style={{ padding:"4px 8px", color: t.textDimmed }}>{idx+1}</td>
                                <td style={{ padding:"4px 8px", color: t.textPrimary, fontWeight:500 }}>{a.nome}</td>
                                <td style={{ padding:"4px 8px", color: t.textDimmed, fontSize:11 }}>{getExibicaoEquipe(a, equipes)||"—"}</td>
                                <td style={{ padding:"4px 4px", textAlign:"center" }}>
                                  <input type="number" min="1" max="20"
                                    style={{ width:44, padding:"3px 4px", background:t.bgHover, border:`1px solid ${t.border}`, borderRadius:4, color: t.accent, textAlign:"center", fontSize:12, fontWeight:700 }}
                                    value={ms.serie}
                                    onChange={(e) => setManualSeries(prev => ({ ...prev, [a.id]: { ...prev[a.id], serie: parseInt(e.target.value) || 1 } }))}
                                  />
                                </td>
                                {!isGrupoManual && (
                                  <td style={{ padding:"4px 4px", textAlign:"center" }}>
                                    <input type="number" min="1" max="10"
                                      style={{ width:44, padding:"3px 4px", background:t.bgHover, border:`1px solid ${t.border}`, borderRadius:4, color: t.accent, textAlign:"center", fontSize:12, fontWeight:700 }}
                                      value={ms.raia}
                                      onChange={(e) => setManualSeries(prev => ({ ...prev, [a.id]: { ...prev[a.id], raia: e.target.value } }))}
                                    />
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  );
                })()}

                <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                  <button style={{ ...s.btnPrimary, fontSize:12 }} onClick={gerarPreview}>
                    🔀 Gerar Seriação
                  </button>
                  {/* Botão "Gerar a partir da fase anterior" — só aparece para SEM e FIN com multi-fases */}
                  {itemAtivo?.faseAnterior && itemAtivo?.multiFases && (
                    <button
                      style={{ ...s.btnPrimary, fontSize:12, background:"#1a3a1a", borderColor:"#2a6a2a" }}
                      onClick={gerarFromFaseAnterior}
                    >
                      ⬆️ Gerar a partir da {FASE_NOME[itemAtivo.faseAnterior]}
                    </button>
                  )}
                  <button style={{ ...s.btnGhost, fontSize:12 }}
                    onClick={() => { setSeriacaoProvaId(null); setSeriacaoChaveAtiva(null); setSeriacaoPreview(null); }}>
                    Cancelar
                  </button>
                </div>

                {seriacaoPreview && (
                  <div style={{ background:t.bgHeaderSolid, border:"1px solid #2a4a2a", borderRadius:8, padding:"12px 14px" }}>
                    <div style={{ color: t.success, fontWeight:700, fontSize:13, marginBottom:4 }}>
                      ✅ Seriação gerada — {seriacaoPreview.series.length} série(s)
                      <span style={{ color: t.textMuted, fontWeight:400, fontSize:11, marginLeft:8 }}>
                        Ordem de realização: {seriacaoPreview.ordemSeries.join(" → ")}
                      </span>
                    </div>
                    {seriacaoPreview.regraAplicada && (
                      <div style={{ fontSize:10, color: t.accent, marginBottom:4, padding:"3px 8px", background: t.accentBg, borderRadius:4, display:"inline-block" }}>
                        📐 {seriacaoPreview.regraAplicada}
                      </div>
                    )}
                    {seriacaoPreview.classificadosInfo && (
                      <div style={{ fontSize:10, color: t.success, marginBottom:8, padding:"3px 8px", background:`${t.success}15`, borderRadius:4, display:"inline-block", marginLeft:4 }}>
                        ✅ {seriacaoPreview.classificadosInfo.porPosicao}P + {seriacaoPreview.classificadosInfo.porTempo}T = {seriacaoPreview.classificadosInfo.total} classificados da {seriacaoPreview.classificadosInfo.faseOrigem}
                      </div>
                    )}
                    {(() => {
                      const isGrupoPreview = seriacaoPreview.tipoLargada === "grupo";
                      const temOrigem = !!seriacaoPreview.classificadosInfo;
                      return seriacaoPreview.series.map((serie, si) => (
                      <div key={si} style={{ marginBottom:8 }}>
                        <div style={{ color: t.accent, fontWeight:700, fontSize:12, marginBottom:4 }}>
                          Série {serie.numero} ({seriacaoPreview.ordemSeries.indexOf(serie.numero)+1}ª a correr)
                          <span style={{ color: t.textDimmed, fontWeight:400, marginLeft:6 }}>({serie.atletas.length} atletas)</span>
                        </div>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, marginBottom:4 }}>
                          <thead>
                            <tr style={{ borderBottom:"1px solid #2a3050" }}>
                              {!isGrupoPreview && <th style={{ padding:"3px 6px", textAlign:"center", color: t.textMuted, fontSize:9 }}>Raia</th>}
                              {isGrupoPreview && <th style={{ padding:"3px 6px", textAlign:"center", color: t.textMuted, fontSize:9 }}>Pos.</th>}
                              <th style={{ padding:"3px 6px", textAlign:"center", color: t.textMuted, fontSize:9 }}>Rank</th>
                              <th style={{ padding:"3px 6px", textAlign:"left", color: t.textMuted, fontSize:9 }}>Atleta</th>
                              <th style={{ padding:"3px 6px", textAlign:"left", color: t.textMuted, fontSize:9 }}>Clube/Equipe</th>
                              <th style={{ padding:"3px 6px", textAlign:"center", color: t.textMuted, fontSize:9 }}>Marca Ref.</th>
                              {temOrigem && <th style={{ padding:"3px 6px", textAlign:"center", color: t.textMuted, fontSize:9 }}>Classif.</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {serie.atletas.map((atl, ai) => (
                              <tr key={`${si}-${atl.id || atl.atletaId || ai}`} style={{ borderBottom:"1px solid #111" }}>
                                {!isGrupoPreview && <td style={{ padding:"3px 6px", textAlign:"center", color: t.accent, fontWeight:700 }}>{atl.raia || "\u2014"}</td>}
                                {isGrupoPreview && <td style={{ padding:"3px 6px", textAlign:"center", color: t.accent, fontWeight:700 }}>{atl.posicao || (ai+1)}</td>}
                                <td style={{ padding:"3px 6px", textAlign:"center", color: t.textMuted }}>{atl.ranking ? `${atl.ranking}º` : "\u2014"}</td>
                                <td style={{ padding:"3px 6px", color: t.textPrimary }}>{atl.nome}</td>
                                <td style={{ padding:"3px 6px", color: t.textDimmed, fontSize:10 }}>{getExibicaoEquipe(atl, equipes)||"—"}</td>
                                <td style={{ padding:"3px 6px", textAlign:"center", color: t.accent }}>{atl.marcaRef ? formatarTempo(atl.marcaRef, 2) : "\u2014"}</td>
                                {temOrigem && (
                                  <td style={{ padding:"3px 6px", textAlign:"center", fontSize:9, fontWeight:700,
                                    color: atl.origemClassif === "posicao" ? "#7cfc7c" : "#1976D2"
                                  }}>
                                    {atl.origemClassif === "posicao" ? "P" : atl.origemClassif === "tempo" ? "T" : "\u2014"}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      ));
                    })()}
                    <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:6 }}>
                      <button style={{ ...s.btnPrimary, fontSize:12 }} onClick={salvarSeriacao}>
                        💾 Salvar Seriação
                      </button>
                      <span style={{ fontSize:9, color: t.textDimmed }}>RT 20.4.8 — Atleta não pode competir em série/raia diferente da designada</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── PAINEL DE EDIÇÃO — REVEZAMENTO ── */}
            {itemAtivoRevez && !itemAtivo && (
              <div style={{ background:t.bgHeaderSolid, border:"1px solid #1a2a6a", borderRadius:8, padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div>
                    <strong style={{ color: t.textPrimary, fontSize:14 }}>🏃‍♂️ {itemAtivoRevez.prova.nome}</strong>
                    <span style={{ color: t.textMuted, fontSize:12, marginLeft:8 }}>
                      {itemAtivoRevez.cat.nome} · {itemAtivoRevez.sexo === "M" ? "Masculino" : "Feminino"} · {itemAtivoRevez.nInscritos} equipes
                    </span>
                    <span style={{ marginLeft:6, fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:600, background: t.accentBg, color: t.accent }}>
                      {itemAtivoRevez.nRaias} raias
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {itemAtivoRevez.jaSeriada && (
                      <button style={{ ...s.btnGhost, fontSize:11, color: t.danger, borderColor:"#4a1a1a" }}
                        onClick={() => limparSeriacao(itemAtivoRevez.chave)}>🗑 Limpar</button>
                    )}
                    <button style={{ ...s.btnGhost, fontSize:11 }}
                      onClick={() => { setSeriacaoProvaId(null); setSeriacaoPreview(null); }}>✕</button>
                  </div>
                </div>

                <div style={{ fontSize:11, color: t.textMuted, marginBottom:10 }}>
                  Defina série e raia para cada equipe do revezamento.
                </div>

                <div style={{ maxHeight:350, overflowY:"auto", marginBottom:10 }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead>
                      <tr style={{ borderBottom:"2px solid #2a3050" }}>
                        <th style={{ padding:"4px 8px", textAlign:"left", color: t.textMuted, fontSize:10 }}>#</th>
                        <th style={{ padding:"4px 8px", textAlign:"left", color: t.textMuted, fontSize:10 }}>Equipe</th>
                        <th style={{ padding:"4px 8px", textAlign:"center", color: t.accent, fontSize:10, width:60 }}>Série</th>
                        <th style={{ padding:"4px 8px", textAlign:"center", color: t.accent, fontSize:10, width:60 }}>Raia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemAtivoRevez.equipesRevez.map((eq, idx) => {
                        const ms = manualSeries[eq.equipeId] || { serie: 1, raia: "" };
                        return (
                          <tr key={`mrev-${eq.equipeId || idx}-${idx}`} style={{ borderBottom:`1px solid ${t.border}` }}>
                            <td style={{ padding:"4px 8px", color: t.textDimmed }}>{idx+1}</td>
                            <td style={{ padding:"4px 8px", color: t.accent, fontWeight:600 }}>
                              {eq.nomeEquipe}{eq.sigla ? ` (${eq.sigla})` : ""}
                            </td>
                            <td style={{ padding:"4px 4px", textAlign:"center" }}>
                              <input type="number" min="1" max="20"
                                style={{ width:44, padding:"3px 4px", background:t.bgHover, border:`1px solid ${t.border}`, borderRadius:4, color: t.accent, textAlign:"center", fontSize:12, fontWeight:700 }}
                                value={ms.serie}
                                onChange={(e) => setManualSeries(prev => ({ ...prev, [eq.equipeId]: { ...prev[eq.equipeId], serie: parseInt(e.target.value) || 1 } }))}
                              />
                            </td>
                            <td style={{ padding:"4px 4px", textAlign:"center" }}>
                              <input type="number" min="1" max="10"
                                style={{ width:44, padding:"3px 4px", background:t.bgHover, border:`1px solid ${t.border}`, borderRadius:4, color: t.accent, textAlign:"center", fontSize:12, fontWeight:700 }}
                                value={ms.raia}
                                onChange={(e) => setManualSeries(prev => ({ ...prev, [eq.equipeId]: { ...prev[eq.equipeId], raia: e.target.value } }))}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                  <button style={{ ...s.btnPrimary, fontSize:12 }} onClick={() => {
                    // Gerar preview de seriação para revezamento
                    const seriesMap = {};
                    Object.entries(manualSeries).forEach(([eqId, cfg]) => {
                      const serNum = parseInt(cfg.serie) || 1;
                      if (!seriesMap[serNum]) seriesMap[serNum] = [];
                      const eqObj = itemAtivoRevez.equipesRevez.find(e => e.equipeId === eqId);
                      if (eqObj) seriesMap[serNum].push({ ...eqObj, id: eqId, raia: parseInt(cfg.raia) || null, ranking: null });
                    });
                    const seriesArr = Object.keys(seriesMap).sort((a,b) => a-b).map(num => ({
                      numero: parseInt(num),
                      atletas: seriesMap[num].sort((a,b) => (a.raia || 99) - (b.raia || 99)),
                    }));
                    const ordemSeries = seriesArr.map(ser => ser.numero);
                    setSeriacaoPreview({ series: seriesArr, ordemSeries, modo: "manual", chave: itemAtivoRevez.chave, isRevez: true });
                  }}>
                    🔀 Gerar Seriação
                  </button>
                  <button style={{ ...s.btnGhost, fontSize:12 }}
                    onClick={() => { setSeriacaoProvaId(null); setSeriacaoPreview(null); }}>
                    Cancelar
                  </button>
                </div>

                {seriacaoPreview && seriacaoPreview.isRevez && (
                  <div style={{ background:t.bgHeaderSolid, border:"1px solid #2a4a2a", borderRadius:8, padding:"12px 14px" }}>
                    <div style={{ color: t.success, fontWeight:700, fontSize:13, marginBottom:8 }}>
                      ✅ Seriação gerada — {seriacaoPreview.series.length} série(s)
                      <span style={{ color: t.textMuted, fontWeight:400, fontSize:11, marginLeft:8 }}>
                        Ordem: {seriacaoPreview.ordemSeries.join(" → ")}
                      </span>
                    </div>
                    {seriacaoPreview.series.map((serie, si) => (
                      <div key={si} style={{ marginBottom:8 }}>
                        <div style={{ color: t.accent, fontWeight:700, fontSize:12, marginBottom:4 }}>
                          Série {serie.numero} ({seriacaoPreview.ordemSeries.indexOf(serie.numero)+1}ª a correr)
                          <span style={{ color: t.textDimmed, fontWeight:400, marginLeft:6 }}>({serie.atletas.length} equipes)</span>
                        </div>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, marginBottom:4 }}>
                          <thead>
                            <tr style={{ borderBottom:"1px solid #2a3050" }}>
                              <th style={{ padding:"3px 6px", textAlign:"center", color: t.textMuted, fontSize:9 }}>Raia</th>
                              <th style={{ padding:"3px 6px", textAlign:"left", color: t.textMuted, fontSize:9 }}>Equipe</th>
                            </tr>
                          </thead>
                          <tbody>
                            {serie.atletas.map((eq, ai) => (
                              <tr key={`${si}-${eq.id || eq.equipeId || ai}`} style={{ borderBottom:"1px solid #111" }}>
                                <td style={{ padding:"3px 6px", textAlign:"center", color: t.accent, fontWeight:700 }}>{eq.raia || "\u2014"}</td>
                                <td style={{ padding:"3px 6px", color: t.textPrimary, fontWeight:600 }}>
                                  {eq.nomeEquipe || eq.nome}{eq.sigla ? ` (${eq.sigla})` : ""}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                    <button style={{ ...s.btnPrimary, fontSize:12, marginTop:6 }} onClick={salvarSeriacao}>
                      💾 Salvar Seriação
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Filtros */}
      <div style={{ ...s.filtros, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
        <div>
          <label style={s.label}>Categoria</label>
          <select style={s.select} value={filtroCat} onChange={(e) => { setFiltroCat(e.target.value); setFiltroProva("todas"); }}>
            <option value="todas">Todas</option>
            {categoriasDoPrograma.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label style={s.label}>Prova</label>
          <select style={s.select} value={filtroProva} onChange={(e) => setFiltroProva(e.target.value)}>
            <option value="todas">Todas as provas</option>
            {nomesProvasUnicos.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
          </select>
        </div>
        <div>
          <label style={s.label}>Sexo</label>
          <select style={s.select} value={filtroSexo} onChange={(e) => setFiltroSexo(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
        </div>
      </div>

      {/* Configuração de orientação para impressão */}
      {isAmplo && sumuFiltradas.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button
            style={{ ...s.btnGhost, fontSize: 12, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => setShowOrientConfig(!showOrientConfig)}
          >
            📐 Orientação das folhas {showOrientConfig ? "▲" : "▼"}
          </button>
          {showOrientConfig && (
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 18px", marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ color: t.textMuted, fontSize: 12 }}>Ações em lote:</span>
                <button style={{ ...s.btnGhost, fontSize: 11, padding: "3px 10px" }} onClick={() => setTodas("portrait")}>
                  📄 Todas Retrato
                </button>
                <button style={{ ...s.btnGhost, fontSize: 11, padding: "3px 10px" }} onClick={() => setTodas("landscape")}>
                  📄 Todas Paisagem
                </button>
                <button style={{ ...s.linkBtn, fontSize: 11, color: t.textMuted }} onClick={resetOrient}>
                  ↺ Restaurar padrão
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {sumuFiltradas.map(sum => {
                  const orient = getOrient(sum);
                  const isLand = orient === "landscape";
                  return (
                    <div key={sumuKey(sum)} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "6px 10px",
                      background: t.bgHeaderSolid, borderRadius: 6, border: `1px solid ${t.border}`
                    }}>
                      <span style={{ flex: 1, fontSize: 12, color: t.textSecondary }}>
                        <NomeProvaComImplemento nome={sum.prova.nome} style={{ color: t.textSecondary }} />
                        <span style={{ color: t.textDimmed, marginLeft: 6, fontSize: 11 }}>
                          {sum.categoria.nome} · {sum.sexo === "M" ? "Masc" : "Fem"}
                        </span>
                      </span>
                      <button
                        onClick={() => toggleOrient(sum)}
                        style={{
                          background: isLand ? "#1a2a1a" : "#1a1a2a",
                          border: `1px solid ${isLand ? "#4a8a2a" : "#4a4a8a"}`,
                          borderRadius: 6, padding: "3px 12px", cursor: "pointer",
                          fontSize: 11, fontWeight: 600,
                          color: isLand ? "#7acc44" : "#88aaff",
                          minWidth: 90, textAlign: "center",
                        }}
                      >
                        {isLand ? "↔ Paisagem" : "↕ Retrato"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {sumuFiltradas.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize: 48 }}>📋</span>
          <p>Nenhuma súmula encontrada. As inscrições vão gerar as súmulas automaticamente.</p>
        </div>
      ) : (
        <>
          {/* Contador de súmulas visíveis */}
          <div style={{ fontSize: 13, color: t.textDimmed, marginBottom: 16 }}>
            Exibindo <strong style={{ color: t.accent }}>{sumuFiltradas.length}</strong> súmula(s)
            {isAmplo && <span style={{ marginLeft: 8 }}>— use os filtros para imprimir provas específicas</span>}
          </div>

          {sumuFiltradas.map((sum, i) => (
            <div key={sumuKey(sum)} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, marginBottom:20, overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", background:t.bgHeaderSolid, borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:22, fontWeight:800, color: t.textPrimary, marginBottom:4 }}>
                    <NomeProvaComImplemento nome={sum.prova.nome} />
                    {sum.prova.origemCombinada && (
                      <span style={{ fontSize: 11, background: t.accentBg, color: t.accent, padding: "2px 8px", borderRadius: 4, marginLeft: 8, fontWeight: 600 }}>
                        🏅 {sum.prova.nomeCombinada} ({sum.prova.ordem}/{sum.prova.totalProvas})
                      </span>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginTop:6 }}>
                    <span style={s.badgeGold}>{sum.categoria.nome}</span>
                    <span style={s.badge(sum.sexo === "M" ? "#1a6ef5" : "#e54f9b")}>
                      {sum.sexo === "M" ? "Masculino" : "Feminino"}
                    </span>
                    <span style={{ color: t.textTertiary, fontSize: 13 }}>
                      {sum.isRevezamento
                        ? `${(sum.equipesRevez||[]).length} equipe(s)`
                        : `${sum.atletas.length} atleta(s)`}
                    </span>
                    {/* Badge câmara de chamada */}
                    {!sum.isRevezamento && getPresencaProva && (() => {
                      const presenca = getPresencaProva(sum.prova.id, sum.categoria.id, sum.sexo);
                      const confirmados = Object.values(presenca).filter(v => v === "confirmado").length;
                      const presentes   = Object.values(presenca).filter(v => v === "presente").length;
                      const total = sum.atletas.length;
                      if (confirmados === 0 && presentes === 0) return null;
                      const cor = confirmados === total ? "#7acc44" : "#1976D2";
                      return (
                        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:700,
                          background: cor + "18", color: cor, border: `1px solid ${cor}44` }}>
                          📋 {confirmados > 0 ? `${confirmados} conf.` : ""}{presentes > 0 ? `${confirmados > 0 ? " · " : ""}${presentes} pres.` : ""}
                        </span>
                      );
                    })()}
                    {sum.isRevezamento && (
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:600, background:"#1a1a2a", color: t.accent, border:"1px solid #2a2a6a" }}>
                        🏃‍♂️ Revezamento ({nPernasRevezamento(sum.prova)} pernas)
                      </span>
                    )}
                    {sum.faseNome && (
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:700,
                        background: sum.faseSufixo === "ELI" ? `${t.warning}15` : sum.faseSufixo === "SEM" ? t.accentBg : `${t.success}15`,
                        color: sum.faseSufixo === "ELI" ? "#ff8844" : sum.faseSufixo === "SEM" ? "#88aaff" : "#7cfc7c",
                        border: `1px solid ${sum.faseSufixo === "ELI" ? "#5a3a1a" : sum.faseSufixo === "SEM" ? "#2a4a6a" : "#2a4a2a"}` }}>
                        {sum.faseNome}
                      </span>
                    )}
                    {(() => {
                      const chaveSer = sum.faseSufixo ? serKey(sum.prova.id, sum.categoria.id, sum.sexo, sum.faseSufixo) : `${sum.prova.id}_${sum.categoria.id}_${sum.sexo}`;
                      let serSalva = eventoAtual.seriacao?.[chaveSer];
                      if (!serSalva) {
                        const _fsBdg = getFasesProva(sum.prova.id, eventoAtual.programaHorario || {});
                        for (const _fb of _fsBdg) { const _kb = serKey(sum.prova.id, sum.categoria.id, sum.sexo, _fb); if (eventoAtual.seriacao?.[_kb]?.series) { serSalva = eventoAtual.seriacao[_kb]; break; } }
                      }
                      const cfgBadge = eventoAtual.configSeriacao?.[sum.prova.id];
                      const modo = (typeof cfgBadge === "string") ? cfgBadge : (cfgBadge?.modo || "semifinal_final");
                      if (serSalva) return (
                        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:600, background:`${t.success}15`, color: t.success, border:`1px solid ${t.success}44` }}>
                          ✓ Seriada ({serSalva.series?.length || 0} sér.) · {modo === "final_tempo" ? "Final/Tempo" : "Semi+Final"}
                        </span>
                      );
                      if (sum.prova.unidade === "s" && !sum.prova.origemCombinada && !sum.isRevezamento) {
                        const _mBdg = sum.prova.id.match(/[_x]?(\d+)m/);
                        const metrosBdg = _mBdg ? parseInt(_mBdg[1]) : 0;
                        if (metrosBdg > 0 && metrosBdg <= 400) {
                          const cfgS = eventoAtual.configSeriacao?.[sum.prova.id];
                          const nRaiasS = (typeof cfgS === "object" && cfgS?.nRaias) ? cfgS.nRaias : 8;
                          if (sum.atletas.length > nRaiasS) return (
                            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:500, background:`${t.warning}15`, color: t.accent, border:"1px solid #4a3a0a" }}>
                              ⚠ Sem seriação
                            </span>
                          );
                        }
                      }
                      return null;
                    })()}
                  </div>
                </div>
                {/* Botão imprimir individual e orientação */}
                {isAmplo && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                      onClick={() => toggleOrient(sum)}
                      title={getOrient(sum) === "landscape" ? "Paisagem → Retrato" : "Retrato → Paisagem"}
                      style={{
                        background: "transparent",
                        border: `1px solid ${getOrient(sum) === "landscape" ? "#4a8a2a" : "#4a4a8a"}`,
                        borderRadius: 6, padding: "4px 8px", cursor: "pointer",
                        fontSize: 11, color: getOrient(sum) === "landscape" ? "#7acc44" : "#88aaff",
                      }}
                    >
                      {getOrient(sum) === "landscape" ? "↔" : "↕"}
                    </button>
                    <button
                      style={{ ...s.btnGhost, fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }}
                      onClick={() => {
                      const orientMap = { [sumuKey(sum)]: getOrient(sum) };
                      const html = gerarHtmlImpressao([{ ...sum, resultados: {} }], eventoAtual, atletas, {}, orientMap, numeracaoPeito[eventoAtual?.id] || {}, equipes, recordes);
                      const win = window.open("", "_blank", "width=900,height=700");
                      if (!win) { alert("Permita pop-ups para gerar a impressão."); return; }
                      win.document.open(); win.document.write(html); win.document.close();
                    }}
                    title="Imprimir só esta súmula"
                  >
                    🖨️
                  </button>
                  </div>
                )}
              </div>
              {sum.isRevezamento ? (
                /* ── REVEZAMENTO: tabela por equipe ── */
                <table style={s.table}>
                  <thead>
                    <tr>
                      <Th>#</Th><Th>Equipe</Th><Th>Atletas ({nPernasRevezamento(sum.prova)})</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sum.equipesRevez || []).map((eq, j) => (
                      <tr key={`rev-${eq.equipeId || j}-${j}`} style={s.tr}>
                        <Td>{j + 1}</Td>
                        <Td><strong style={{ color: t.accent }}>{eq.nomeEquipe}{eq.sigla ? ` (${eq.sigla})` : ""}</strong></Td>
                        <Td>
                          {eq.atletas.length > 0
                            ? <span style={{ fontSize: 11, color: t.textTertiary }}>{eq.atletas.map(a => a.nome).join(" · ")}</span>
                            : <span style={{ fontSize: 11, color: t.danger }}>⚠ Atletas não definidos — <button style={{ ...s.linkBtn, fontSize: 11, color: t.accent }} onClick={() => setTela("inscricao-revezamento")}>editar inscrição</button></span>
                          }
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <Th>#</Th><Th>Nº</Th><Th>Atleta</Th><Th>Nascimento</Th><Th>Clube/Equipe</Th>
                    {(() => {
                      const _serH = sum.faseSufixo
                        ? buscarSeriacao(eventoAtual.seriacao, sum.prova.id, sum.categoria.id, sum.sexo, sum.faseSufixo)
                        : (() => { let r = eventoAtual.seriacao?.[`${sum.prova.id}_${sum.categoria.id}_${sum.sexo}`]; if (!r) { const _fsH = getFasesProva(sum.prova.id, eventoAtual.programaHorario || {}); for (const _fh of _fsH) { const _kh = serKey(sum.prova.id, sum.categoria.id, sum.sexo, _fh); if (eventoAtual.seriacao?.[_kh]?.series) { r = eventoAtual.seriacao[_kh]; break; } } } return r; })();
                      return _serH ? <><Th>Série</Th><Th>Raia</Th></> : null;
                    })()}
                    <Th>Cat. Oficial</Th><Th>Obs.</Th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let serSalva = sum.faseSufixo
                      ? buscarSeriacao(eventoAtual.seriacao, sum.prova.id, sum.categoria.id, sum.sexo, sum.faseSufixo)
                      : (() => { let r = eventoAtual.seriacao?.[`${sum.prova.id}_${sum.categoria.id}_${sum.sexo}`]; if (!r) { const _fsB = getFasesProva(sum.prova.id, eventoAtual.programaHorario || {}); for (const _fb of _fsB) { const _kb = serKey(sum.prova.id, sum.categoria.id, sum.sexo, _fb); if (eventoAtual.seriacao?.[_kb]?.series) { r = eventoAtual.seriacao[_kb]; break; } } } return r; })();

                    // Se tem seriação, renderizar agrupado por série
                    if (serSalva && serSalva.series) {
                      const seriesOrdenadas = [...serSalva.series].sort((a, b) => {
                        const oA = serSalva.ordemSeries ? serSalva.ordemSeries.indexOf(a.numero) : a.numero;
                        const oB = serSalva.ordemSeries ? serSalva.ordemSeries.indexOf(b.numero) : b.numero;
                        return oA - oB;
                      });
                      let idx = 0;
                      return seriesOrdenadas.flatMap((serie, si) => {
                        const headerRow = seriesOrdenadas.length > 1 ? (
                          <tr key={`sh-${si}`} style={{ background: t.accentBg }}>
                            <td colSpan={9} style={{ padding:"6px 12px", fontWeight:700, color: t.accent, fontSize:12, borderBottom:"2px solid #2a2a0a" }}>
                              Série {serie.numero} {serSalva.ordemSeries ? `(${serSalva.ordemSeries.indexOf(serie.numero)+1}ª a correr)` : ""}
                            </td>
                          </tr>
                        ) : null;

                        const rows = serie.atletas.map((sa, sai) => {
                          const a = sum.atletas.find(aa => aa.id === sa.id || aa.id === sa.atletaId);
                          if (!a) return null;
                          const insc = sum.inscs.find((ii) => ii.atletaId === a.id);
                          idx++;
                          return (
                            <tr key={`${si}-${a.id}-${sai}`} style={s.tr}>
                              <Td>{idx}</Td>
                              <Td><strong style={{ color: t.textTertiary, fontSize:12 }}>{(numeracaoPeito?.[eventoAtual?.id]||{})[a.id]||""}</strong></Td>
                              <Td><strong style={{ color: t.textPrimary }}>{a.nome}</strong></Td>
                              <Td>{_getNascDisplay(a) || "—"}</Td>
                              <Td>{getExibicaoEquipe(a, equipes) || "—"}</Td>
                              <Td><strong style={{ color: t.accent }}>{serie.numero}</strong></Td>
                              <Td><strong style={{ color: t.accent }}>{sa.raia || "—"}</strong></Td>
                              <Td>
                                {insc?.permissividade
                                  ? <span style={s.badgeOficial}>{insc.categoriaOficial}</span>
                                  : <span style={{ color: t.textDimmed, fontSize: 12 }}>—</span>}
                              </Td>
                              <Td>
                                {insc?.permissividade
                                  ? <span style={s.badgeNorma} title={insc.permissividade}>⚖️ Exceção CBAt</span>
                                  : <span style={{ color: t.textDimmed, fontSize: 12 }}>—</span>}
                              </Td>
                            </tr>
                          );
                        }).filter(Boolean);

                        return headerRow ? [headerRow, ...rows] : rows;
                      });
                    }

                    // Sem seriação: renderização padrão
                    const atletasUnicos = sum.atletas.filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i);
                    return atletasUnicos.map((a, j) => {
                      const insc = sum.inscs.find((ii) => ii.atletaId === a.id);
                      return (
                        <tr key={`std-${a.id}-${j}`} style={s.tr}>
                          <Td>{j + 1}</Td>
                          <Td><strong style={{ color: t.textTertiary, fontSize:12 }}>{(numeracaoPeito?.[eventoAtual?.id]||{})[a.id]||""}</strong></Td>
                          <Td><strong style={{ color: t.textPrimary }}>{a.nome}</strong></Td>
                          <Td>{_getNascDisplay(a) || "—"}</Td>
                          <Td>{getExibicaoEquipe(a, equipes) || "—"}</Td>
                          <Td>
                            {insc?.permissividade
                              ? <span style={s.badgeOficial}>{insc.categoriaOficial}</span>
                              : <span style={{ color: t.textDimmed, fontSize: 12 }}>—</span>}
                          </Td>
                          <Td>
                            {insc?.permissividade
                              ? <span style={s.badgeNorma} title={insc.permissividade}>⚖️ Exceção CBAt</span>
                              : <span style={{ color: t.textDimmed, fontSize: 12 }}>—</span>}
                          </Td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── RESULTADOS PÚBLICOS ───────────────────────────────────────────────────────
export default TelaSumulas;
