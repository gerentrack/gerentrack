import React, { useState, useEffect, useRef } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { todasAsProvas, nPernasRevezamento } from "../../shared/athletics/provasDef";
import { CATEGORIAS } from "../../shared/constants/categorias";
import { getFasesProva, getFasesModo, temMultiFases, buscarSeriacao, serKey, resKey, FASE_NOME, FASE_ANTERIOR, getEntradasProva } from "../../shared/constants/fases";
import { calcularEtapa, getEtapaLabel, ETAPA_LABELS } from "../../shared/constants/etapas";
import { gerarHtmlImpressao } from "../impressao/gerarHtmlImpressao";
import { CombinedEventEngine } from "../../shared/engines/combinedEventEngine";
import { SeriacaoEngine } from "../../shared/engines/seriacaoEngine";
import { _getNascDisplay, NomeProvaComImplemento, formatarTempo, resolverAtleta, formatarPeito } from "../../shared/formatters/utils";
import { Th, Td } from "../ui/TableHelpers";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";
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
  if (atleta?._siglaEquipe) return atleta._siglaEquipe;
  const eq = (equipes||[]).find(e => e.id === atleta?.equipeId);
  if (eq) return (eq.sigla?.trim() || eq.nome || atleta?.clube || "—");
  return atleta?.clube || "—";
};

function TelaSumulas({ chamada, getPresencaProva }) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const confirmar = useConfirm();
  const { usuarioLogado } = useAuth();
  const { inscricoes, atletas, eventoAtual, resultados, numeracaoPeito, getClubeAtleta, equipes, atualizarCamposEvento, alterarStatusEvento, recordes, adicionarInscricao } = useEvento();
  const { setTela, registrarAcao } = useApp();
  const isFinalizado = !!eventoAtual?.competicaoFinalizada;
  const [filtroProva, setFiltroProva] = useState("todas");
  const [filtroCat, setFiltroCat] = useState("todas");
  const [filtroSexo, setFiltroSexo] = useState("todos");
  const [filtroEtapa, setFiltroEtapa] = useState("todas");
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

  // ── Reparo: criar inscrições componentes faltantes de combinadas ──────────
  const inscDoEventoAll = inscricoes.filter((i) => i.eventoId === eventoAtual?.id);
  const reparoIds = useRef(new Set()); // atletaIds já reparados — evita duplicação
  useEffect(() => {
    if (!eventoAtual?.id || !adicionarInscricao || isFinalizado) return;
    if (inscDoEventoAll.length === 0) return; // inscrições ainda não carregaram
    const eid = eventoAtual.id;
    const allProvas = todasAsProvas();
    const provasCombi = (eventoAtual.provasPrograma || []).filter(pid => {
      const pInfo = allProvas.find(p => p.id === pid);
      return pInfo && pInfo.tipo === "combinada";
    });
    if (provasCombi.length === 0) return;
    const faltantes = [];
    provasCombi.forEach(combinadaId => {
      const inscsPai = inscDoEventoAll.filter(i => i.provaId === combinadaId && !i.origemCombinada);
      const componentes = CombinedEventEngine.gerarProvasComponentes(combinadaId, eid);
      if (inscsPai.length === 0 || componentes.length === 0) return;
      inscsPai.forEach(pai => {
        const chave = `${pai.atletaId}_${combinadaId}`;
        if (reparoIds.current.has(chave)) return;
        const temComponentes = inscDoEventoAll.some(i =>
          i.atletaId === pai.atletaId && i.combinadaId === combinadaId && i.origemCombinada
        );
        if (temComponentes) return;
        reparoIds.current.add(chave);
        faltantes.push(...CombinedEventEngine.inscreverAtletaNasComponentes(
          pai.atletaId, combinadaId, eid,
          {
            categoria: pai.categoria, categoriaId: pai.categoriaId,
            categoriaOficial: pai.categoriaOficial, categoriaOficialId: pai.categoriaOficialId,
            sexo: pai.sexo,
            inscritoPorId: pai.inscritoPorId, inscritoPorNome: pai.inscritoPorNome,
            inscritoPorTipo: pai.inscritoPorTipo,
            equipeCadastro: pai.equipeCadastro || "", equipeCadastroId: pai.equipeCadastroId || null,
          },
          componentes
        ));
      });
    });
    if (faltantes.length > 0) {
      console.log(`[Súmulas] Reparo: criando ${faltantes.length} inscrições componentes para ${reparoIds.current.size} atleta(s)`);
      faltantes.forEach(ic => adicionarInscricao(ic));
    }
  }, [eventoAtual?.id, inscDoEventoAll.length, isFinalizado]);

  if (!eventoAtual) return (
    <div style={s.page}><div style={s.emptyState}><p>Selecione uma competição primeiro.</p>
      <button style={s.btnPrimary} onClick={() => setTela("home")}>Ver Competições</button></div></div>
  );

  // Controle de acesso: não-admins só acessam se sumulaLiberada = true
  const isAdmin  = usuarioLogado?.tipo === "admin";
  const isOrg    = usuarioLogado?.tipo === "organizador";
  const isDono   = isAdmin
    || (isOrg && eventoAtual.organizadorId === usuarioLogado?.id)
    || (usuarioLogado?.tipo === "funcionario" && eventoAtual.organizadorId === usuarioLogado?.organizadorId);
  const isFuncS  = usuarioLogado?.tipo === "funcionario" &&
    (usuarioLogado?.permissoes?.includes("sumulas") || usuarioLogado?.permissoes?.includes("resultados"));
  const isAmplo  = isDono || isFuncS;
  if (!isAmplo && !eventoAtual.sumulaLiberada) return (
    <div style={s.page}>
      <div style={s.emptyState}>
        <span style={{ fontSize: 56 }}>—</span>
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
  const inscDoEvento = inscDoEventoAll;

  const pausaHorario = (eventoAtual.programaPausa || {}).horario || "";
  const temEtapas = !!pausaHorario;
  const qtdEtapas = (eventoAtual.dataFim && eventoAtual.dataFim !== eventoAtual.data) ? 4 : 2;

  const getEtapaProva = (provaId) => {
    const entries = getEntradasProva(provaId, eventoAtual.programaHorario || {});
    const entry = entries[0];
    if (!entry?.horario || !pausaHorario) return null;
    return calcularEtapa(entry.horario, entry.dia || 1, pausaHorario);
  };

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
              (i.categoriaId || i.categoriaOficialId) === cat.id &&
              i.sexo === sexo
          );
          if (inscsRevez.length === 0) return [];
          const equipesRevez = inscsRevez.map(i => {
            const eq = equipes.find(e => e.id === i.equipeId);
            const nomeEquipe = eq ? (eq.clube || eq.nome || "—") : (i.equipeId?.startsWith("clube_") ? i.equipeId.substring(6) : "—");
            const atlsObj = (i.atletasIds || []).map(aid => resolverAtleta(aid, atletas, eventoAtual)).filter(Boolean);
            return { equipeId: i.equipeId, nomeEquipe, sigla: eq?.sigla || "", atletasIds: i.atletasIds || [], atletas: atlsObj, inscId: i.id };
          });
          const chavRes = `${eventoAtual.id}_${prova.id}_${cat.id}_${sexo}`;
          const resProva = (resultados && resultados[chavRes]) ? resultados[chavRes] : {};
          return [{ prova, sexo, categoria: cat, isRevezamento: true, equipesRevez, inscs: inscsRevez, resultados: resProva }];
        }

        // Componente de combinada: incluir atletas da inscrição pai (combinadaId)
        // pois podem não ter inscrições componentes individuais
        const inscs = inscDoEvento.filter((i) => {
          if ((i.categoriaId || i.categoriaOficialId) !== cat.id || i.sexo !== sexo || i.tipo === "revezamento") return false;
          if (i.provaId === prova.id) return true;
          if (prova.origemCombinada && (i.provaId === prova.combinadaId || i.combinadaId === prova.combinadaId)) return true;
          if (prova.tipo === "combinada" && i.combinadaId === prova.id) return true;
          return false;
        });
        if (inscs.length === 0) return [];
        // Deduplicar por atletaId — atleta com inscrição pai + componente não duplica
        const atletasInsc = inscs
          .map((i) => resolverAtleta(i.atletaId, atletas, eventoAtual))
          .filter(Boolean)
          .filter((a, idx, arr) => arr.findIndex(x => x.id === a.id) === idx);

        // Multi-fase: gerar uma entrada de súmula por fase que tenha seriação
        const _fasesS = getFasesModo(prova.id, eventoAtual.configSeriacao || {});
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
      if (filtroProva !== "todas" && sum.prova.nome !== filtroProva) {
        // Se filtro é uma combinada, aceitar componentes dessa combinada
        if (!(sum.prova.origemCombinada && sum.prova.nomeCombinada === filtroProva)) return false;
      }
      if (filtroCat !== "todas" && sum.categoria.id !== filtroCat) return false;
      if (filtroSexo !== "todos" && sum.sexo !== filtroSexo) return false;
      if (filtroEtapa !== "todas") {
        const etNum = getEtapaProva(sum.prova.id);
        if (String(etNum) !== filtroEtapa) return false;
      }
      return true;
    });
    // Deduplicar por chave única — protege contra provas geradas em duplicata
    const vistas = new Set();
    const dedup = filtered.filter(sum => {
      const k = `${sum.prova.id}_${sum.categoria.id}_${sum.sexo}${sum.faseSufixo ? "__" + sum.faseSufixo : ""}`;
      if (vistas.has(k)) return false;
      vistas.add(k);
      return true;
    });
    // Ordenar pelo programa horário (dia + horário)
    return dedup.sort((a, b) => {
      const ea = getEntradasProva(a.prova.id, eventoAtual.programaHorario || {})[0];
      const eb = getEntradasProva(b.prova.id, eventoAtual.programaHorario || {})[0];
      const da = (ea?.dia || 1), db = (eb?.dia || 1);
      if (da !== db) return da - db;
      const ha = ea?.horario || "99:99", hb = eb?.horario || "99:99";
      return ha.localeCompare(hb);
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
          <h1 style={s.pageTitle}>Súmulas</h1>
          <div style={{ color: t.textDimmed, fontSize: 13 }}>{eventoAtual.nome}</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {isAmplo && sumuFiltradas.length > 0 && (
            <button style={{ ...s.btnPrimary, display: "flex", alignItems: "center", gap: 8 }} onClick={handleImprimir}>
              Imprimir Súmulas
              <span style={{ background: "#00000033", borderRadius: 10, padding: "1px 8px", fontSize: 11 }}>
                {sumuFiltradas.length}
              </span>
            </button>
          )}
          {isAmplo && (
            <button style={{ ...s.btnSecondary, background: t.accentBg, borderColor: t.accentBorder, color: t.accent }}
              onClick={() => setShowSeriar(!showSeriar)}>
              Seriar Provas
            </button>
          )}
          {isAmplo && (
            <button style={{ ...s.btnSecondary, background: `${t.success}12`, borderColor: `${t.success}44`, color: t.success }}
              onClick={() => setTela("export-lynx")}>
              Exportar .evt
            </button>
          )}
          {(isDono || (usuarioLogado?.tipo === "funcionario" && eventoAtual.organizadorId === usuarioLogado?.organizadorId && usuarioLogado?.permissoes?.includes("resultados"))) && (
            <button style={s.btnSecondary} onClick={() => setTela("digitar-resultados")}>Digitar Resultados</button>
          )}
          <button style={s.btnSecondary} onClick={() => setTela("resultados")}>Ver Resultados</button>
          <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Competição</button>
        </div>
      </div>

      {/* Aviso de impressão filtrada */}
      {isAmplo && sumuFiltradas.length > 0 && (filtroProva !== "todas" || filtroCat !== "todas" || filtroSexo !== "todos") && (
        <div style={{ background: `${t.success}12`, border: `1px solid ${t.success}44`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: t.success, display: "flex", alignItems: "center", gap: 8 }}>
          O botão de impressão irá gerar apenas as <strong>{sumuFiltradas.length} súmula(s)</strong> filtradas atualmente.
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
        // Retrocompat: "final_tempo" → "final", "semifinal_final" → "semi_final"
        const normalizarModo = (m) => {
          if (m === "final_tempo") return "final";
          if (m === "semifinal_final") return "semi_final";
          return m || "final";
        };
        const getConfigProva = (provaId) => {
          const cfg = configSeriacao[provaId];
          if (!cfg) return { modo: "final", nRaias: 8, atlPorSerie: 12, porPosicaoEliSem: 3, porTempoEliSem: 2, porPosicaoSemFin: 3, porTempoSemFin: 2 };
          if (typeof cfg === "string") return { modo: normalizarModo(cfg), nRaias: 8, atlPorSerie: 12, porPosicaoEliSem: 3, porTempoEliSem: 2, porPosicaoSemFin: 3, porTempoSemFin: 2 };
          // Retrocompat: porPosicao/porTempo antigos → usados como fallback para ambas transições
          const pFallback = cfg.porPosicao ?? 3;
          const tFallback = cfg.porTempo ?? 2;
          return {
            modo: normalizarModo(cfg.modo),
            nRaias: cfg.nRaias || 8,
            atlPorSerie: cfg.atlPorSerie || 12,
            porPosicaoEliSem: cfg.porPosicaoEliSem ?? pFallback,
            porTempoEliSem: cfg.porTempoEliSem ?? tFallback,
            porPosicaoSemFin: cfg.porPosicaoSemFin ?? pFallback,
            porTempoSemFin: cfg.porTempoSemFin ?? tFallback,
          };
        };

        // Salvar config de uma prova no evento
        const salvarConfigProva = (provaId, campo, valor) => {
          if (isFinalizado) return;
          const cfgAtual = { ...configSeriacao };
          const base = todasP.find(p => p.id === provaId);
          const mesmoNome = todasP.filter(p => p.nome === base?.nome && (eventoAtual.provasPrograma || []).includes(p.id));
          mesmoNome.forEach(p => {
            const prev = cfgAtual[p.id];
            const prevObj = (!prev) ? {} : (typeof prev === "string") ? { modo: prev } : { ...prev };
            cfgAtual[p.id] = { ...prevObj, [campo]: valor };
          });
          atualizarCamposEvento(eventoAtual.id, { configSeriacao: cfgAtual });
        };

        // Provas de pista com inscritos — expandidas por fase baseado no modo da seriação
        const MODO_FASES = {
          "final": [],
          "semi_final": ["SEM", "FIN"],
          "eli_semi_final": ["ELI", "SEM", "FIN"],
        };
        const provasPista = [];
        (eventoAtual.provasPrograma || []).forEach(provaId => {
          const p = todasP.find(pp => pp.id === provaId);
          if (!p || p.unidade !== "s" || p.tipo === "combinada" || p.tipo === "revezamento") return;
          const metros = _metrosFromId(provaId);
          if (metros === 0) return;
          const cfgP = getConfigProva(provaId);
          const isLonga = metros > 800;
          const fasesConf = MODO_FASES[cfgP.modo] || [];
          const multiFases = fasesConf.length > 1;

          CATEGORIAS.forEach(cat => {
            ["M","F"].forEach(sexo => {
              const inscs = inscDoEvento.filter(i =>
                i.provaId === provaId && (i.categoriaId || i.categoriaOficialId) === cat.id && i.sexo === sexo && !i.origemCombinada
              );
              if (inscs.length <= 0) return;

              if (multiFases) {
                fasesConf.forEach((faseSuf, faseIdx) => {
                  const chave = serKey(provaId, cat.id, sexo, faseSuf);
                  const jaSeriada = !!seriacaoSalva[chave];
                  const capacidade = isLonga ? cfgP.atlPorSerie : cfgP.nRaias;
                  const faseAnterior = FASE_ANTERIOR[faseSuf] || null;
                  provasPista.push({
                    provaId, prova: p, cat, sexo, inscs, chave,
                    modo: cfgP.modo, nRaias: cfgP.nRaias, atlPorSerie: cfgP.atlPorSerie,
                    isLonga, metros, jaSeriada, nInscritos: inscs.length, capacidade,
                    faseSufixo: faseSuf, faseNome: FASE_NOME[faseSuf] || faseSuf,
                    faseIdx, multiFases: true, faseAnterior,
                    fasesConf,
                  });
                });
              } else {
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
                (i.categoriaId || i.categoriaOficialId) === cat.id && i.sexo === sexo
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
            const a = resolverAtleta(i.atletaId, atletas, eventoAtual);
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

          // Fase derivada automaticamente do item ativo
          const faseAutoEngine = item.faseSufixo === "ELI" ? "eliminatoria" : item.faseSufixo === "SEM" ? "semifinal" : "final";
          const configEngine = {
            nRaias: item.nRaias,
            fase: faseAutoEngine,
            atlPorSerie: item.atlPorSerie,
            modo800: item.metros === 800 ? seriacao800m : "raias",
          };

          if (seriacaoModo === "manual") {
            // Manual: agrupar por série conforme o organizador definiu
            const seriesMap = {};
            Object.entries(manualSeries).forEach(([atletaId, cfg]) => {
              const serNum = parseInt(cfg.serie) || 1;
              if (!seriesMap[serNum]) seriesMap[serNum] = [];
              const a = resolverAtleta(atletaId, atletas, eventoAtual);
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
              const a = resolverAtleta(i.atletaId, atletas, eventoAtual);
              return { ...a, atletaId: a?.id, marcaRef: "" };
            }).filter(x => x.atletaId)
              .filter((x, idx, arr) => arr.findIndex(y => y.atletaId === x.atletaId) === idx);
            // Embaralhar
            for (let i = atletasList.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [atletasList[i], atletasList[j]] = [atletasList[j], atletasList[i]];
            }
            const result = SeriacaoEngine.seriarProva(atletasList, item.prova, { ...configEngine, fase: "eliminatoria", aleatorio: true });
            setSeriacaoPreview({ ...result, modo: item.modo, chave: item.chave });
          } else {
            // Por marca (padrão) — usa a fase selecionada
            const atletasComMarca = item.inscs.map(i => {
              const a = resolverAtleta(i.atletaId, atletas, eventoAtual);
              return { ...a, atletaId: a?.id, marcaRef: marcasRef[a?.id] || "" };
            }).filter(x => x.atletaId)
              .filter((x, idx, arr) => arr.findIndex(y => y.atletaId === x.atletaId) === idx);
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
          // Determinar qual par P+T usar baseado na transição de fase
          const isEliParaSem = item.faseAnterior === "ELI" && item.faseSufixo === "SEM";
          const progressao = isEliParaSem
            ? { porPosicao: cfgP.porPosicaoEliSem, porTempo: cfgP.porTempoEliSem }
            : { porPosicao: cfgP.porPosicaoSemFin, porTempo: cfgP.porTempoSemFin };

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
            const a = resolverAtleta(c.atletaId, atletas, eventoAtual);
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
          if (isFinalizado || !seriacaoPreview) return;
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
          atualizarCamposEvento(eventoAtual.id, { seriacao: novasSer });
          setSeriacaoPreview(null);
          setSeriacaoChaveAtiva(null);
          setSeriacaoProvaId(null);
        };

        const limparSeriacao = (chave) => {
          if (isFinalizado) return;
          const novasSer = { ...seriacaoSalva };
          delete novasSer[chave];
          atualizarCamposEvento(eventoAtual.id, { seriacao: novasSer });
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
          <div style={{ background: t.bgCardAlt, border:`1px solid ${t.border}`, borderRadius:12, padding:"16px 20px", marginBottom:20 }}>
            {isFinalizado && (
              <div style={{ background:`${t.danger}10`, border:`1px solid ${t.danger}44`, borderRadius:8, padding:"8px 14px", marginBottom:12, fontSize:12, color: t.danger, fontWeight:600 }}>
                Competição finalizada — seriação em modo somente leitura
              </div>
            )}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div>
                <div style={{ color: t.accent, fontWeight:800, fontSize:16, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1 }}>
                  SERIAÇÃO — RT 20.3 a 20.8
                </div>
                <div style={{ color: t.textDimmed, fontSize:11, marginTop:2 }}>
                  {isFinalizado ? "Visualização da seriação configurada" : "Configure modo e capacidade por prova, depois serie cada prova individualmente"}
                </div>
              </div>
              <button style={s.btnGhost} onClick={() => setShowSeriar(false)}>✕ Fechar</button>
            </div>

            {/* \u2500\u2500 CONFIGURAÇÃO POR PROVA \u2500\u2500 */}
            <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:"12px 14px", marginBottom:14 }}>
              <div style={{ color: t.textTertiary, fontWeight:700, fontSize:12, marginBottom:8 }}>Configuração por Prova</div>
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
                            {[3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        )}
                      </div>
                      <div style={{ display:"flex", gap:3 }}>
                        {[["final","Final"],["semi_final","Semi + Final"],["eli_semi_final","Eli + Semi + Final"]].map(([val,lbl]) => {
                          const corAtivo = val === "final" ? t.accent : val === "semi_final" ? t.success : t.warning;
                          return (
                          <button key={val}
                            style={{
                              padding:"3px 9px", borderRadius:4, border:"1px solid",
                              fontSize:10, fontWeight:600, cursor:"pointer",
                              background: cfgP.modo === val ? `${corAtivo}22` : t.bgHeaderSolid,
                              color: cfgP.modo === val ? corAtivo : t.textDimmed,
                              borderColor: cfgP.modo === val ? `${corAtivo}44` : t.border,
                            }}
                            onClick={() => {
                              if (isFinalizado) return;
                              const nR = cfgP.nRaias || 8;
                              const maxInsc = Math.max(...provas.map(pv => inscDoEvento.filter(i => i.provaId === pv.id && !i.origemCombinada && i.tipo !== "revezamento").length), 0);
                              // Auto-preencher P+T via RT 20.8
                              const updates = { modo: val };
                              if (val === "semi_final") {
                                const nSerSem = Math.ceil(maxInsc / nR) || 1;
                                const pSemFin = Math.floor(nR / nSerSem);
                                const tSemFin = Math.max(0, nR - pSemFin * nSerSem);
                                updates.porPosicaoSemFin = pSemFin;
                                updates.porTempoSemFin = tSemFin;
                              } else if (val === "eli_semi_final") {
                                const nSerEli = Math.ceil(maxInsc / nR) || 1;
                                // Eli→Semi: preencher 2 séries semi = 2×nR atletas
                                const targetSem = nR * 2;
                                const pEliSem = Math.min(Math.floor(targetSem / nSerEli), nR);
                                const tEliSem = Math.max(0, targetSem - pEliSem * nSerEli);
                                updates.porPosicaoEliSem = pEliSem;
                                updates.porTempoEliSem = tEliSem;
                                // Semi→Fin: 2 séries semi → 1 final = nR atletas
                                const nSerSem2 = 2;
                                const pSemFin2 = Math.floor(nR / nSerSem2);
                                const tSemFin2 = Math.max(0, nR - pSemFin2 * nSerSem2);
                                updates.porPosicaoSemFin = pSemFin2;
                                updates.porTempoSemFin = tSemFin2;
                              }
                              // Salvar tudo numa única operação
                              const cfgAtual = { ...configSeriacao };
                              const base = todasP.find(pv => pv.id === provas[0].id);
                              const mesmoNome = todasP.filter(pv => pv.nome === base?.nome && (eventoAtual.provasPrograma || []).includes(pv.id));
                              mesmoNome.forEach(pv => {
                                const prev = cfgAtual[pv.id];
                                const prevObj = (!prev) ? {} : (typeof prev === "string") ? { modo: prev } : { ...prev };
                                cfgAtual[pv.id] = { ...prevObj, ...updates };
                              });
                              atualizarCamposEvento(eventoAtual.id, { configSeriacao: cfgAtual });
                            }}
                          >{lbl}</button>
                          );
                        })}
                      </div>
                      {/* Progressão P+T: aparece quando modo tem multi-fases */}
                      {(() => {
                        if (cfgP.modo !== "semi_final" && cfgP.modo !== "eli_semi_final") return null;
                        const nRaias = cfgP.nRaias || 8;
                        // Contar máximo de inscritos nesta prova (para calcular séries)
                        const maxInscritos = Math.max(...provas.map(pv => inscDoEvento.filter(i => i.provaId === pv.id && !i.origemCombinada && i.tipo !== "revezamento").length), 0);
                        const nSeriesEli = Math.ceil(maxInscritos / nRaias) || 1;

                        const autoCalcT = (p, nSeries) => Math.max(0, nRaias - (p * nSeries));

                        const handlePChange = (campo, tCampo, nSeries, val) => {
                          if (isFinalizado) return;
                          const p = Math.max(0, Math.min(8, parseInt(val) || 0));
                          const tAuto = autoCalcT(p, nSeries);
                          // Salvar P e T numa única operação para evitar race condition
                          const cfgAtual = { ...configSeriacao };
                          const base = todasP.find(pv => pv.id === provas[0].id);
                          const mesmoNome = todasP.filter(pv => pv.nome === base?.nome && (eventoAtual.provasPrograma || []).includes(pv.id));
                          mesmoNome.forEach(pv => {
                            const prev = cfgAtual[pv.id];
                            const prevObj = (!prev) ? {} : (typeof prev === "string") ? { modo: prev } : { ...prev };
                            cfgAtual[pv.id] = { ...prevObj, [campo]: p, [tCampo]: tAuto };
                          });
                          atualizarCamposEvento(eventoAtual.id, { configSeriacao: cfgAtual });
                        };

                        const renderProgressao = (label, cor, pCampo, tCampo, pVal, tVal, nSeries, totalAtlFase, nSeriesProx) => (
                          <div style={{ display:"flex", alignItems:"center", gap:6, borderLeft:`2px solid ${t.border}`, paddingLeft:8, flexWrap:"wrap" }}>
                            <span style={{ fontSize:10, color: cor, fontWeight:600 }}>{label}:</span>
                            <span style={{ fontSize:11, color: t.success, fontWeight:700 }}>P</span>
                            <input type="number" min="0" max="8"
                              style={{ width:46, padding:"4px 6px", background:t.bgHover, border:`1px solid ${t.success}44`, borderRadius:4, color: t.success, textAlign:"center", fontSize:13, fontWeight:700 }}
                              value={pVal}
                              onChange={(e) => handlePChange(pCampo, tCampo, nSeries, e.target.value)}
                              title={`Classificados por posição (${label})`}
                            />
                            <span style={{ fontSize:11, color: t.accent, fontWeight:700 }}>+T</span>
                            <input type="number" min="0" max="16"
                              style={{ width:46, padding:"4px 6px", background:t.bgHover, border:`1px solid ${t.accent}44`, borderRadius:4, color: t.accent, textAlign:"center", fontSize:13, fontWeight:700 }}
                              value={tVal}
                              onChange={(e) => salvarConfigProva(provas[0].id, tCampo, Math.max(0, Math.min(16, parseInt(e.target.value) || 0)))}
                              title={`Classificados por tempo (${label})`}
                            />
                            <span style={{ fontSize:11, color: t.textDimmed, fontWeight:600 }}>
                              {nSeries} sér × P{pVal} + T{tVal} = {pVal * nSeries + tVal} atl
                              {nSeriesProx != null && <> → {nSeriesProx === 1 ? "Final" : `${nSeriesProx} sér`}</>}
                            </span>
                          </div>
                        );

                        if (cfgP.modo === "semi_final") {
                          const nSeriesSem = Math.ceil(maxInscritos / nRaias) || 1;
                          const totalSemFin = cfgP.porPosicaoSemFin * nSeriesSem + cfgP.porTempoSemFin;
                          return (
                            <>
                              <span style={{ fontSize:11, color: t.textDimmed, fontWeight:600, borderLeft:`2px solid ${t.border}`, paddingLeft:8 }}>
                                {maxInscritos} inscritos · {nSeriesSem} séries
                              </span>
                              {renderProgressao("Semi→Fin", t.textMuted, "porPosicaoSemFin", "porTempoSemFin", cfgP.porPosicaoSemFin, cfgP.porTempoSemFin, nSeriesSem, maxInscritos, 1)}
                            </>
                          );
                        }

                        // eli_semi_final
                        const totalEliSem = cfgP.porPosicaoEliSem * nSeriesEli + cfgP.porTempoEliSem;
                        const nSeriesSemCalc = Math.ceil(totalEliSem / nRaias) || 1;
                        const totalSemFin = cfgP.porPosicaoSemFin * nSeriesSemCalc + cfgP.porTempoSemFin;
                        return (
                          <>
                            <span style={{ fontSize:11, color: t.textDimmed, fontWeight:600, borderLeft:`2px solid ${t.border}`, paddingLeft:8 }}>
                              {maxInscritos} inscritos · {nSeriesEli} séries eli
                            </span>
                            {renderProgressao("Eli→Semi", t.warning, "porPosicaoEliSem", "porTempoEliSem", cfgP.porPosicaoEliSem, cfgP.porTempoEliSem, nSeriesEli, maxInscritos, nSeriesSemCalc)}
                            {renderProgressao("Semi→Fin", t.accent, "porPosicaoSemFin", "porTempoSemFin", cfgP.porPosicaoSemFin, cfgP.porTempoSemFin, nSeriesSemCalc, totalEliSem, 1)}
                          </>
                        );
                      })()}
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
                const faseColor = item.faseSufixo === "ELI" ? t.warning : item.faseSufixo === "SEM" ? t.accent : item.faseSufixo === "FIN" ? t.success : t.textMuted;
                const proximaFaseSuf = item.faseSufixo === "ELI" ? "SEM" : item.faseSufixo === "SEM" ? "FIN" : null;
                const chaveProxFase = proximaFaseSuf ? serKey(item.provaId, item.cat.id, item.sexo, proximaFaseSuf) : null;
                const proxFaseAutoGerada = chaveProxFase && seriacaoSalva[chaveProxFase]?.autoGerada;
                return (
                  <button key={item.chave}
                    style={{
                      padding:"6px 12px", borderRadius:6, fontSize:11, cursor:"pointer",
                      border: item.jaSeriada ? `1px solid ${t.success}44` : `1px solid ${t.accent}44`,
                      background: ativo ? t.accentBg : item.jaSeriada ? t.bgCardAlt : t.bgHeaderSolid,
                      color: ativo ? "#fff" : item.jaSeriada ? t.success : t.textMuted,
                      fontWeight: ativo ? 700 : 500,
                      outline: ativo ? `2px solid ${t.accent}` : "none",
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
                    <span style={{ fontSize:9, marginLeft:4, color: item.jaSeriada ? t.success : t.textDimmed }}>
                      ({item.faseIdx === 0 ? `${item.nInscritos}atl` : "?"}/{nSeries}sér)
                      {item.jaSeriada && " ✓"}
                    </span>
                    {proxFaseAutoGerada && (
                      <span style={{ fontSize:8, marginLeft:3, padding:"1px 4px", borderRadius:3, background:`${t.success}15`, color: t.success, border:`1px solid ${t.success}33` }}>
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
                  Revezamentos
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {provasRevezPista.map(item => {
                    const ativo = item.chave === `${seriacaoProvaId}_${seriacaoCat}_${seriacaoSexo}`;
                    return (
                      <button key={item.chave}
                        style={{
                          padding:"6px 12px", borderRadius:6, fontSize:11, cursor:"pointer",
                          border: item.jaSeriada ? `1px solid ${t.success}44` : `1px solid ${t.accent}44`,
                          background: ativo ? t.accentBg : item.jaSeriada ? t.bgCardAlt : t.bgHeaderSolid,
                          color: ativo ? "#fff" : item.jaSeriada ? t.success : t.accent,
                          fontWeight: ativo ? 700 : 500,
                          outline: ativo ? `2px solid ${t.accent}` : "none",
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
                        <span style={{ fontSize:9, marginLeft:4, color: item.jaSeriada ? t.success : t.textDimmed }}>
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
                      background: itemAtivo.modo === "eli_semi_final" ? `${t.warning}22` : itemAtivo.modo === "semi_final" ? `${t.success}15` : `${t.accent}15`,
                      color: itemAtivo.modo === "eli_semi_final" ? t.warning : itemAtivo.modo === "semi_final" ? t.success : t.accent,
                    }}>
                      {itemAtivo.modo === "eli_semi_final" ? "Eli + Semi + Final" : itemAtivo.modo === "semi_final" ? "Semi + Final" : "Final"}
                    </span>
                    <span style={{ marginLeft:6, fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:600, background: t.accentBg, color: t.accent }}>
                      {itemAtivo.isLonga ? `${itemAtivo.atlPorSerie} atl/série` : `${itemAtivo.nRaias} raias`}
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {itemAtivo.jaSeriada && (
                      <button style={{ ...s.btnGhost, fontSize:11, color: t.danger, borderColor:`${t.danger}44` }}
                        onClick={() => limparSeriacao(itemAtivo.chave)}>Limpar</button>
                    )}
                  </div>
                </div>

                {/* Seletor de modo de seriação */}
                <div style={{ display:"flex", gap:4, marginBottom:10 }}>
                  {[["marca","Por Marca"],["aleatorio","Aleatório"],["manual","Manual"]].map(([val,lbl]) => (
                    <button key={val}
                      style={{
                        padding:"5px 14px", borderRadius:5, border:"1px solid",
                        fontSize:11, fontWeight:600, cursor:"pointer",
                        background: seriacaoModo === val ? t.accentBg : t.bgHeaderSolid,
                        color: seriacaoModo === val ? "#fff" : t.textDimmed,
                        borderColor: seriacaoModo === val ? t.accent : t.border,
                      }}
                      onClick={() => { setSeriacaoModo(val); setSeriacaoPreview(null); }}
                    >{lbl}</button>
                  ))}
                </div>

                {/* RT 20.4.x — Regra de raias (derivada automaticamente da fase do item) */}
                {seriacaoModo !== "manual" && (() => {
                  const faseDerivada = itemAtivo.faseSufixo === "ELI" ? "eliminatoria" : itemAtivo.faseSufixo === "SEM" ? "semifinal" : "final";
                  const faseLabel = faseDerivada === "eliminatoria" ? "Eliminatória" : faseDerivada === "semifinal" ? "Semifinal" : "Final";
                  const faseCorBg = faseDerivada === "eliminatoria" ? `${t.warning}15` : faseDerivada === "semifinal" ? t.accentBg : `${t.success}15`;
                  const faseCor = faseDerivada === "eliminatoria" ? t.warning : faseDerivada === "semifinal" ? t.accent : t.success;
                  const regraTexto = faseDerivada === "eliminatoria"
                    ? "RT 20.4.1 — Raias por sorteio livre"
                    : itemAtivo.isLonga || (itemAtivo.metros === 800 && seriacao800m === "grupo")
                      ? "RT 20.4.6 — Posições por sorteio"
                      : itemAtivo.metros <= 110
                        ? "RT 20.4.3 — Grupos: A(3-6) B(2,7) C(1,8)"
                        : itemAtivo.metros === 200
                          ? "RT 20.4.4 — Grupos: A(5-7) B(3,4,8) C(1,2)"
                          : "RT 20.4.5 — Grupos: A(4-7) B(3,8) C(1,2)";
                  return (
                    <div style={{ display:"flex", gap:6, marginBottom:10, alignItems:"center" }}>
                      <span style={{ fontSize:10, padding:"3px 10px", borderRadius:4, fontWeight:600, background: faseCorBg, color: faseCor, border:`1px solid ${faseCor}44` }}>
                        {faseLabel}
                      </span>
                      <span style={{ fontSize:9, color: t.textDimmed, fontStyle:"italic" }}>{regraTexto}</span>
                    </div>
                  );
                })()}

                {/* RT 20.4.5/20.4.6 — Modo 800m (raias ou largada em grupo) */}
                {itemAtivo.metros === 800 && seriacaoModo !== "manual" && (
                  <div style={{ display:"flex", gap:4, marginBottom:10, alignItems:"center" }}>
                    <span style={{ fontSize:10, color: t.textMuted, marginRight:4 }}>800m:</span>
                    {[["raias","Em Raias (RT 20.4.5)"],["grupo","Largada em Grupo (RT 20.4.6)"]].map(([val,lbl]) => (
                      <button key={val}
                        style={{
                          padding:"4px 10px", borderRadius:4, border:"1px solid", fontSize:10, fontWeight:600, cursor:"pointer",
                          background: seriacao800m === val ? t.accentBg : t.bgHeaderSolid,
                          color: seriacao800m === val ? "#fff" : t.textDimmed,
                          borderColor: seriacao800m === val ? t.accent : t.border,
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
                          <tr style={{ borderBottom:`2px solid ${t.border}` }}>
                            <th style={{ padding:"4px 8px", textAlign:"left", color: t.textMuted, fontSize:10 }}>#</th>
                            <th style={{ padding:"4px 8px", textAlign:"left", color: t.textMuted, fontSize:10 }}>Atleta</th>
                            <th style={{ padding:"4px 8px", textAlign:"left", color: t.textMuted, fontSize:10 }}>Clube/Equipe</th>
                            <th style={{ padding:"4px 8px", textAlign:"center", color: t.accent, fontSize:10, width:120 }}>Marca Ref. (s)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemAtivo.inscs.map((insc, idx) => {
                            const a = resolverAtleta(insc.atletaId, atletas, eventoAtual);
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
                    As séries e raias serão sorteadas aleatoriamente. Clique em "Gerar" para sortear. Gere novamente se quiser outro resultado.
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
                          <tr style={{ borderBottom:`2px solid ${t.border}` }}>
                            <th style={{ padding:"4px 8px", textAlign:"left", color: t.textMuted, fontSize:10 }}>#</th>
                            <th style={{ padding:"4px 8px", textAlign:"left", color: t.textMuted, fontSize:10 }}>Atleta</th>
                            <th style={{ padding:"4px 8px", textAlign:"left", color: t.textMuted, fontSize:10 }}>Clube/Equipe</th>
                            <th style={{ padding:"4px 8px", textAlign:"center", color: t.accent, fontSize:10, width:60 }}>Série</th>
                            {!isGrupoManual && <th style={{ padding:"4px 8px", textAlign:"center", color: t.accent, fontSize:10, width:60 }}>Raia</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {itemAtivo.inscs.map((insc, idx) => {
                            const a = resolverAtleta(insc.atletaId, atletas, eventoAtual);
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
                    Gerar Seriação
                  </button>
                  {/* Botão "Gerar a partir da fase anterior" — só aparece para SEM e FIN com multi-fases */}
                  {itemAtivo?.faseAnterior && itemAtivo?.multiFases && (
                    <button
                      style={{ ...s.btnPrimary, fontSize:12, background:`${t.success}22`, borderColor:`${t.success}44` }}
                      onClick={gerarFromFaseAnterior}
                    >
                      Gerar a partir da {FASE_NOME[itemAtivo.faseAnterior]}
                    </button>
                  )}
                  <button style={{ ...s.btnGhost, fontSize:12 }}
                    onClick={() => { setSeriacaoProvaId(null); setSeriacaoChaveAtiva(null); setSeriacaoPreview(null); }}>
                    Cancelar
                  </button>
                </div>

                {seriacaoPreview && (
                  <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.success}44`, borderRadius:8, padding:"12px 14px" }}>
                    <div style={{ color: t.success, fontWeight:700, fontSize:13, marginBottom:4 }}>
                      Seriação gerada — {seriacaoPreview.series.length} série(s)
                    </div>
                    {seriacaoPreview.regraAplicada && (
                      <div style={{ fontSize:10, color: t.accent, marginBottom:4, padding:"3px 8px", background: t.accentBg, borderRadius:4, display:"inline-block" }}>
                        {seriacaoPreview.regraAplicada}
                      </div>
                    )}
                    {seriacaoPreview.classificadosInfo && (
                      <div style={{ fontSize:10, color: t.success, marginBottom:8, padding:"3px 8px", background:`${t.success}15`, borderRadius:4, display:"inline-block", marginLeft:4 }}>
                        {seriacaoPreview.classificadosInfo.porPosicao}P + {seriacaoPreview.classificadosInfo.porTempo}T = {seriacaoPreview.classificadosInfo.total} classificados da {seriacaoPreview.classificadosInfo.faseOrigem}
                      </div>
                    )}
                    {(() => {
                      const isGrupoPreview = seriacaoPreview.tipoLargada === "grupo";
                      const temOrigem = !!seriacaoPreview.classificadosInfo;
                      return seriacaoPreview.series.map((serie, si) => (
                      <div key={si} style={{ marginBottom:8 }}>
                        <div style={{ color: t.accent, fontWeight:700, fontSize:12, marginBottom:4 }}>
                          Série {serie.numero}
                          <span style={{ color: t.textDimmed, fontWeight:400, marginLeft:6 }}>({serie.atletas.length} atletas)</span>
                        </div>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, marginBottom:4 }}>
                          <thead>
                            <tr style={{ borderBottom:`1px solid ${t.border}` }}>
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
                              <tr key={`prev-${serie.numero}-${atl.id || atl.atletaId}-${ai}`} style={{ borderBottom:`1px solid ${t.border}` }}>
                                {!isGrupoPreview && <td style={{ padding:"3px 6px", textAlign:"center", color: t.accent, fontWeight:700 }}>{atl.raia || "\u2014"}</td>}
                                {isGrupoPreview && <td style={{ padding:"3px 6px", textAlign:"center", color: t.accent, fontWeight:700 }}>{atl.posicao || (ai+1)}</td>}
                                <td style={{ padding:"3px 6px", textAlign:"center", color: t.textMuted }}>{atl.ranking ? `${atl.ranking}º` : "\u2014"}</td>
                                <td style={{ padding:"3px 6px", color: t.textPrimary }}>{atl.nome}</td>
                                <td style={{ padding:"3px 6px", color: t.textDimmed, fontSize:10 }}>{getExibicaoEquipe(atl, equipes)||"—"}</td>
                                <td style={{ padding:"3px 6px", textAlign:"center", color: t.accent }}>{atl.marcaRef ? formatarTempo(atl.marcaRef, 2) : "\u2014"}</td>
                                {temOrigem && (
                                  <td style={{ padding:"3px 6px", textAlign:"center", fontSize:9, fontWeight:700,
                                    color: atl.origemClassif === "posicao" ? t.success : t.accent
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
                        Salvar Seriação
                      </button>
                      <span style={{ fontSize:9, color: t.textDimmed }}>RT 20.4.8 — Atleta não pode competir em série/raia diferente da designada</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── PAINEL DE EDIÇÃO — REVEZAMENTO ── */}
            {itemAtivoRevez && !itemAtivo && (
              <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.accent}44`, borderRadius:8, padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div>
                    <strong style={{ color: t.textPrimary, fontSize:14 }}>{itemAtivoRevez.prova.nome}</strong>
                    <span style={{ color: t.textMuted, fontSize:12, marginLeft:8 }}>
                      {itemAtivoRevez.cat.nome} · {itemAtivoRevez.sexo === "M" ? "Masculino" : "Feminino"} · {itemAtivoRevez.nInscritos} equipes
                    </span>
                    <span style={{ marginLeft:6, fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:600, background: t.accentBg, color: t.accent }}>
                      {itemAtivoRevez.nRaias} raias
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {itemAtivoRevez.jaSeriada && (
                      <button style={{ ...s.btnGhost, fontSize:11, color: t.danger, borderColor:`${t.danger}44` }}
                        onClick={() => limparSeriacao(itemAtivoRevez.chave)}>Limpar</button>
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
                      <tr style={{ borderBottom:`2px solid ${t.border}` }}>
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
                    Gerar Seriação
                  </button>
                  <button style={{ ...s.btnGhost, fontSize:12 }}
                    onClick={() => { setSeriacaoProvaId(null); setSeriacaoPreview(null); }}>
                    Cancelar
                  </button>
                </div>

                {seriacaoPreview && seriacaoPreview.isRevez && (
                  <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.success}44`, borderRadius:8, padding:"12px 14px" }}>
                    <div style={{ color: t.success, fontWeight:700, fontSize:13, marginBottom:8 }}>
                      Seriação gerada — {seriacaoPreview.series.length} série(s)
                    </div>
                    {seriacaoPreview.series.map((serie, si) => (
                      <div key={si} style={{ marginBottom:8 }}>
                        <div style={{ color: t.accent, fontWeight:700, fontSize:12, marginBottom:4 }}>
                          Série {serie.numero}
                          <span style={{ color: t.textDimmed, fontWeight:400, marginLeft:6 }}>({serie.atletas.length} equipes)</span>
                        </div>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, marginBottom:4 }}>
                          <thead>
                            <tr style={{ borderBottom:`1px solid ${t.border}` }}>
                              <th style={{ padding:"3px 6px", textAlign:"center", color: t.textMuted, fontSize:9 }}>Raia</th>
                              <th style={{ padding:"3px 6px", textAlign:"left", color: t.textMuted, fontSize:9 }}>Equipe</th>
                            </tr>
                          </thead>
                          <tbody>
                            {serie.atletas.map((eq, ai) => (
                              <tr key={`${si}-${eq.id || eq.equipeId || ai}`} style={{ borderBottom:`1px solid ${t.border}` }}>
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
                      Salvar Seriação
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
        {temEtapas && (
          <div>
            <label style={s.label}>Etapa</label>
            <select style={s.select} value={filtroEtapa} onChange={(e) => setFiltroEtapa(e.target.value)}>
              <option value="todas">Todas</option>
              {Array.from({ length: qtdEtapas }, (_, idx) => idx + 1).map(n => (
                <option key={n} value={String(n)}>{getEtapaLabel(n)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Configuração de orientação para impressão */}
      {isAmplo && sumuFiltradas.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button
            style={{ ...s.btnGhost, fontSize: 12, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => setShowOrientConfig(!showOrientConfig)}
          >
            Orientação das folhas {showOrientConfig ? "▲" : "▼"}
          </button>
          {showOrientConfig && (
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 18px", marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ color: t.textMuted, fontSize: 12 }}>Ações em lote:</span>
                <button style={{ ...s.btnGhost, fontSize: 11, padding: "3px 10px" }} onClick={() => setTodas("portrait")}>
                  Todas Retrato
                </button>
                <button style={{ ...s.btnGhost, fontSize: 11, padding: "3px 10px" }} onClick={() => setTodas("landscape")}>
                  Todas Paisagem
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
                          Categoria: {sum.categoria.nome} · {sum.sexo === "M" ? "Masc" : "Fem"}
                        </span>
                      </span>
                      <button
                        onClick={() => toggleOrient(sum)}
                        style={{
                          background: isLand ? `${t.success}22` : t.accentBg,
                          border: `1px solid ${isLand ? `${t.success}44` : `${t.accent}44`}`,
                          borderRadius: 6, padding: "3px 12px", cursor: "pointer",
                          fontSize: 11, fontWeight: 600,
                          color: isLand ? t.success : t.accent,
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
          <span style={{ fontSize: 48 }}>—</span>
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
                        {sum.prova.nomeCombinada} ({sum.prova.ordem}/{sum.prova.totalProvas})
                      </span>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginTop:6 }}>
                    <span style={s.badgeGold}>Categoria: {sum.categoria.nome}</span>
                    <span style={s.badge(sum.sexo === "M" ? "#1a6ef5" : "#e54f9b")}>
                      {sum.sexo === "M" ? "Masculino" : "Feminino"}
                    </span>
                    <span style={{ color: t.textTertiary, fontSize: 13 }}>
                      {sum.isRevezamento
                        ? `${(sum.equipesRevez||[]).length} equipe(s)`
                        : `${sum.atletas.length} atleta(s)`}
                    </span>
                    {(() => {
                      const etNum = getEtapaProva(sum.prova.id);
                      if (!etNum) return null;
                      return (
                        <span style={{ fontSize: 11, background: `${t.accent}18`, color: t.accent, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                          {getEtapaLabel(etNum)}
                        </span>
                      );
                    })()}
                    {/* Badge câmara de chamada */}
                    {!sum.isRevezamento && getPresencaProva && (() => {
                      const presenca = getPresencaProva(sum.prova.id, sum.categoria.id, sum.sexo);
                      const confirmados = Object.values(presenca).filter(v => v === "confirmado").length;
                      const dns         = Object.values(presenca).filter(v => v === "dns").length;
                      if (confirmados === 0 && dns === 0) return null;
                      return (
                        <>
                          {confirmados > 0 && (
                            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:700,
                              background: `${t.success}18`, color: t.success, border: `1px solid ${t.success}44` }}>
                              ✓ {confirmados} conf.
                            </span>
                          )}
                          {dns > 0 && (
                            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:700,
                              background: `${t.danger}18`, color: t.danger, border: `1px solid ${t.danger}44` }}>
                              {dns} DNS
                            </span>
                          )}
                        </>
                      );
                    })()}
                    {sum.isRevezamento && (
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:600, background:t.accentBg, color: t.accent, border:`1px solid ${t.accent}44` }}>
                        Revezamento ({nPernasRevezamento(sum.prova)} pernas)
                      </span>
                    )}
                    {sum.faseNome && (
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:700,
                        background: sum.faseSufixo === "ELI" ? `${t.warning}15` : sum.faseSufixo === "SEM" ? t.accentBg : `${t.success}15`,
                        color: sum.faseSufixo === "ELI" ? t.warning : sum.faseSufixo === "SEM" ? t.accent : t.success,
                        border: `1px solid ${sum.faseSufixo === "ELI" ? `${t.warning}66` : sum.faseSufixo === "SEM" ? `${t.accent}66` : `${t.success}44`}` }}>
                        {sum.faseNome}
                      </span>
                    )}
                    {(() => {
                      const chaveSer = sum.faseSufixo ? serKey(sum.prova.id, sum.categoria.id, sum.sexo, sum.faseSufixo) : `${sum.prova.id}_${sum.categoria.id}_${sum.sexo}`;
                      let serSalva = eventoAtual.seriacao?.[chaveSer];
                      if (!serSalva) {
                        const _fsBdg = getFasesModo(sum.prova.id, eventoAtual.configSeriacao || {});
                        for (const _fb of _fsBdg) { const _kb = serKey(sum.prova.id, sum.categoria.id, sum.sexo, _fb); if (eventoAtual.seriacao?.[_kb]?.series) { serSalva = eventoAtual.seriacao[_kb]; break; } }
                      }
                      const cfgBadge = eventoAtual.configSeriacao?.[sum.prova.id];
                      const modoRaw = (typeof cfgBadge === "string") ? cfgBadge : (cfgBadge?.modo || "final");
                      const modoBdg = modoRaw === "final_tempo" ? "final" : modoRaw === "semifinal_final" ? "semi_final" : modoRaw;
                      const modoLabel = modoBdg === "eli_semi_final" ? "Eli+Semi+Final" : modoBdg === "semi_final" ? "Semi+Final" : "Final";
                      if (serSalva) return (
                        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:600, background:`${t.success}15`, color: t.success, border:`1px solid ${t.success}44` }}>
                          ✓ Seriada ({serSalva.series?.length || 0} sér.) · {modoLabel}
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
                              Sem seriação
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
                        border: `1px solid ${getOrient(sum) === "landscape" ? `${t.success}44` : `${t.accent}44`}`,
                        borderRadius: 6, padding: "4px 8px", cursor: "pointer",
                        fontSize: 11, color: getOrient(sum) === "landscape" ? t.success : t.accent,
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
                    Impr.
                  </button>
                  </div>
                )}
              </div>
              {sum.isRevezamento ? (
                /* ── REVEZAMENTO: tabela por equipe ── */
                <div style={{ overflowX: "auto" }}>
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
                            : <span style={{ fontSize: 11, color: t.danger }}>Atletas não definidos — <button style={{ ...s.linkBtn, fontSize: 11, color: t.accent }} onClick={() => setTela("inscricao-revezamento")}>editar inscrição</button></span>
                          }
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              ) : (
              <>
              {/* Sorteio RT 25.5 — provas de campo (exceto altura/vara) */}
              {(() => {
                const _isCampoSum = sum.prova.unidade !== "s" && !(sum.prova.tipo === "salto" && (sum.prova.id.includes("altura") || sum.prova.id.includes("vara")));
                if (!_isCampoSum || !isDono) return null;
                const _chS = `${sum.prova.id}_${sum.categoria.id}_${sum.sexo}`;
                const _srt = eventoAtual?.sorteioCampo?.[_chS];
                const executarSorteio = () => {
                  const atlUn = sum.atletas.filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i);
                  const ids = atlUn.map(a => a.id);
                  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
                  atualizarCamposEvento(eventoAtual.id, { sorteioCampo: { ...(eventoAtual.sorteioCampo || {}), [_chS]: { ordem: ids, timestamp: Date.now() } } });
                };
                return (
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
                    {_srt?.ordem ? (
                      <>
                        <span style={{ fontSize:12, color:t.success, fontWeight:600 }}>
                          Sorteio realizado em {new Date(_srt.timestamp).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                        </span>
                        <button
                          style={{ background:"transparent", color:t.textMuted, border:`1px solid ${t.borderLight}`, padding:"5px 14px", borderRadius:6, cursor:"pointer", fontSize:12, fontFamily:"'Barlow',sans-serif" }}
                          disabled={eventoAtual.competicaoFinalizada}
                          onClick={async () => {
                            const ok = await confirmar("Refazer o sorteio de ordem? A ordem atual será substituída.");
                            if (!ok) return;
                            executarSorteio();
                          }}>
                          Refazer Sorteio
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize:12, color:t.accent, fontWeight:600 }}>Sorteio não realizado (RT 25.5)</span>
                        <button
                          style={{ background:`linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color:"#fff", border:"none", padding:"6px 16px", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1 }}
                          disabled={eventoAtual.competicaoFinalizada}
                          onClick={executarSorteio}>
                          Sortear Ordem
                        </button>
                      </>
                    )}
                  </div>
                );
              })()}
              <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <Th>#</Th><Th>Nº</Th><Th>Atleta</Th><Th>Nascimento</Th><Th>Clube/Equipe</Th>
                    {(() => {
                      const _serH = sum.faseSufixo
                        ? buscarSeriacao(eventoAtual.seriacao, sum.prova.id, sum.categoria.id, sum.sexo, sum.faseSufixo)
                        : (() => { let r = eventoAtual.seriacao?.[`${sum.prova.id}_${sum.categoria.id}_${sum.sexo}`]; if (!r) { const _fsH = getFasesModo(sum.prova.id, eventoAtual.configSeriacao || {}); for (const _fh of _fsH) { const _kh = serKey(sum.prova.id, sum.categoria.id, sum.sexo, _fh); if (eventoAtual.seriacao?.[_kh]?.series) { r = eventoAtual.seriacao[_kh]; break; } } } return r; })();
                      return _serH ? <><Th>Série</Th><Th>Raia</Th></> : null;
                    })()}
                    <Th>Cat. Oficial</Th><Th>Obs.</Th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let serSalva = sum.faseSufixo
                      ? buscarSeriacao(eventoAtual.seriacao, sum.prova.id, sum.categoria.id, sum.sexo, sum.faseSufixo)
                      : (() => { let r = eventoAtual.seriacao?.[`${sum.prova.id}_${sum.categoria.id}_${sum.sexo}`]; if (!r) { const _fsB = getFasesModo(sum.prova.id, eventoAtual.configSeriacao || {}); for (const _fb of _fsB) { const _kb = serKey(sum.prova.id, sum.categoria.id, sum.sexo, _fb); if (eventoAtual.seriacao?.[_kb]?.series) { r = eventoAtual.seriacao[_kb]; break; } } } return r; })();

                    // Se tem seriação, renderizar agrupado por série
                    if (serSalva && serSalva.series) {
                      const seriesOrdenadas = [...serSalva.series].sort((a, b) => a.numero - b.numero);
                      let idx = 0;
                      return seriesOrdenadas.flatMap((serie, si) => {
                        const headerRow = seriesOrdenadas.length > 1 ? (
                          <tr key={`sh-${si}`} style={{ background: t.accentBg }}>
                            <td colSpan={9} style={{ padding:"6px 12px", fontWeight:700, color: t.accent, fontSize:12, borderBottom:`2px solid ${t.border}` }}>
                              Série {serie.numero}
                            </td>
                          </tr>
                        ) : null;

                        const rows = serie.atletas.map((sa, sai) => {
                          const a = sum.atletas.find(aa => aa.id === sa.id || aa.id === sa.atletaId) || resolverAtleta(sa.id || sa.atletaId, atletas, eventoAtual);
                          if (!a) return null;
                          const insc = sum.inscs.find((ii) => ii.atletaId === a.id);
                          idx++;
                          return (
                            <tr key={`${si}-${a.id}-${sai}`} style={s.tr}>
                              <Td>{idx}</Td>
                              <Td><strong style={{ color: t.textTertiary, fontSize:12 }}>{formatarPeito((numeracaoPeito?.[eventoAtual?.id]||{})[a.id])}</strong></Td>
                              <Td>
                                <strong style={{ color: t.textPrimary }}>{a.nome}</strong>
                                {getPresencaProva && (() => {
                                  const st = getPresencaProva(sum.prova.id, sum.categoria.id, sum.sexo)[a.id];
                                  if (!st || (st !== "confirmado" && st !== "dns")) return null;
                                  const cor = st === "confirmado" ? t.success : t.danger;
                                  return <span style={{ marginLeft:6, fontSize:9, padding:"1px 6px", borderRadius:3, fontWeight:700, background:cor+"18", color:cor, border:`1px solid ${cor}44` }}>{st === "confirmado" ? "Conf." : "DNS"}</span>;
                                })()}
                              </Td>
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
                                  ? <span style={s.badgeNorma} title={insc.permissividade}>Exceção CBAt</span>
                                  : <span style={{ color: t.textDimmed, fontSize: 12 }}>—</span>}
                              </Td>
                            </tr>
                          );
                        }).filter(Boolean);

                        return headerRow ? [headerRow, ...rows] : rows;
                      });
                    }

                    // Sem seriação: renderização padrão (com sorteio de campo se disponível)
                    let atletasUnicos = sum.atletas.filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i);
                    const _chSorteio = `${sum.prova.id}_${sum.categoria.id}_${sum.sexo}`;
                    const _sorteio = eventoAtual?.sorteioCampo?.[_chSorteio];
                    if (_sorteio?.ordem) {
                      const mapa = new Map(atletasUnicos.map(a => [a.id, a]));
                      const ordenados = _sorteio.ordem.map(id => mapa.get(id)).filter(Boolean);
                      const idsNoSorteio = new Set(_sorteio.ordem);
                      const novos = atletasUnicos.filter(a => !idsNoSorteio.has(a.id));
                      atletasUnicos = [...ordenados, ...novos];
                    }
                    return atletasUnicos.map((a, j) => {
                      const insc = sum.inscs.find((ii) => ii.atletaId === a.id);
                      return (
                        <tr key={`std-${a.id}-${j}`} style={s.tr}>
                          <Td>{j + 1}</Td>
                          <Td><strong style={{ color: t.textTertiary, fontSize:12 }}>{formatarPeito((numeracaoPeito?.[eventoAtual?.id]||{})[a.id])}</strong></Td>
                          <Td>
                            <strong style={{ color: t.textPrimary }}>{a.nome}</strong>
                            {getPresencaProva && (() => {
                              const st = getPresencaProva(sum.prova.id, sum.categoria.id, sum.sexo)[a.id];
                              if (!st || (st !== "confirmado" && st !== "dns")) return null;
                              const cor = st === "confirmado" ? t.success : t.danger;
                              return <span style={{ marginLeft:6, fontSize:9, padding:"1px 6px", borderRadius:3, fontWeight:700, background:cor+"18", color:cor, border:`1px solid ${cor}44` }}>{st === "confirmado" ? "Conf." : "DNS"}</span>;
                            })()}
                          </Td>
                          <Td>{_getNascDisplay(a) || "—"}</Td>
                          <Td>{getExibicaoEquipe(a, equipes) || "—"}</Td>
                          <Td>
                            {insc?.permissividade
                              ? <span style={s.badgeOficial}>{insc.categoriaOficial}</span>
                              : <span style={{ color: t.textDimmed, fontSize: 12 }}>—</span>}
                          </Td>
                          <Td>
                            {insc?.permissividade
                              ? <span style={s.badgeNorma} title={insc.permissividade}>Exceção CBAt</span>
                              : <span style={{ color: t.textDimmed, fontSize: 12 }}>—</span>}
                          </Td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
              </div>
              </>
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
