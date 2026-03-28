/**
 * SeriacaoEngine
 *
 * Motor de seriação RT 20.3–20.8 (World Athletics Technical Rules).
 * Distribui atletas em séries e raias por sorteio e/ou ranking.
 *
 * Extraído de App.jsx (linhas 1534–1978) — Etapa 3 da refatoração.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// MOTOR DE SERIAÇÃO — RT 20.3 a 20.8 (World Athletics Technical Rules)
// Regras implementadas:
//   20.4.1 — 1ª fase: raias por sorteio livre
//   20.4.2 — Fases seguintes: rankeamento por resultado + grupos de raias
//   20.4.3 — Corridas em reta (100m, 60m, barreiras curtas): A(3,4,5,6) B(2,7) C(1,8)
//   20.4.4 — 200m: A(5,6,7) B(3,4,8) C(1,2)
//   20.4.5 — 400m, revez ≤4×400m, 800m em raias: A(4,5,6,7) B(3,8) C(1,2)
//   20.4.6 — Provas >800m, revez >4×400m, final única: posições por sorteio livre
//   20.4.7 — Séries por tempo: regulamento define critérios
//   20.4.8 — Atleta não pode competir em série/raia diferente da designada
//   Note (iii) — Menos atletas que raias: raia(s) interna(s) ficam livres
// ═══════════════════════════════════════════════════════════════════════════════
const SeriacaoEngine = {

  // ─── HELPERS DE CLASSIFICAÇÃO DE PROVA ───────────────────────────────────────

  // Extrai metragem do ID da prova (ex: "M_adulto_100m" → 100)
  _getMetros(prova) {
    const m = (prova.id || "").match(/[_x]?(\d+)m/);
    return m ? parseInt(m[1]) : 0;
  },

  // RT 20.4.3 — Corrida em reta: 60m, 100m, 60mB, 100mB, 110mB
  _isReta(prova) {
    const m = this._getMetros(prova);
    return m > 0 && m <= 110;
  },

  // RT 20.4.4 — 200m (incluindo 200mB)
  _is200(prova) {
    return this._getMetros(prova) === 200;
  },

  // RT 20.4.5 — 400m, revez ≤4×400m, 800m em raias
  _is400_800(prova) {
    const m = this._getMetros(prova);
    return m === 400 || m === 800 || prova.tipo === "revezamento";
  },

  // RT 20.4.6 — Provas >800m (1500m, 3000m, 5000m, 10000m, obstáculos, marcha)
  // e provas de final única: posições sorteadas, sem raias/grupos
  _isLargadaEmGrupo(prova, config) {
    const m = this._getMetros(prova);
    // 800m pode ser em raias ou grupo — depende de config
    if (m === 800 && config.modo800 === "grupo") return true;
    if (m === 800) return false; // padrão: em raias
    // >800m = sempre largada em grupo
    if (m > 800) return true;
    // Obstáculos e marcha = grupo
    if (prova.tipo === "obstaculos" || prova.tipo === "marcha") return true;
    return false;
  },

  // ─── RT 20.3.3 — DISTRIBUIÇÃO BALANCEADA ─────────────────────────────────────
  // Distribui atletas uniformemente entre séries (ex: 13 atletas em 2 séries → 7+6, não 8+5)
  // Séries com mais atletas ficam primeiro (série 1 pode ter 1 a mais que série 2)
  distribuirSerpentina(atletasRankeados, nSeries, nRaias) {
    const series = Array.from({ length: nSeries }, () => []);
    const nAtletas = atletasRankeados.length;
    const base = Math.floor(nAtletas / nSeries);
    const extras = nAtletas % nSeries; // primeiras N séries recebem 1 atleta extra

    let idx = 0;
    for (let si = 0; si < nSeries; si++) {
      const count = base + (si < extras ? 1 : 0);
      for (let ai = 0; ai < count && idx < nAtletas; ai++) {
        series[si].push({ ...atletasRankeados[idx], ranking: idx + 1 });
        idx++;
      }
    }
    return series;
  },

  // RT 20.3.3 — Distribuição zigzag (serpentina real) para séries equilibradas
  // Ex: 3 séries → A:1,6,7,12  B:2,5,8,11  C:3,4,9,10
  distribuirZigzag(atletasRankeados, nSeries, nRaias) {
    const series = Array.from({ length: nSeries }, () => []);
    let forward = true;
    let serieIdx = 0;
    atletasRankeados.forEach((atl, idx) => {
      series[serieIdx].push({ ...atl, ranking: idx + 1 });
      if (forward) {
        if (serieIdx >= nSeries - 1) { forward = false; }
        else { serieIdx++; }
      } else {
        if (serieIdx <= 0) { forward = true; }
        else { serieIdx--; }
      }
    });
    return series;
  },

  // ─── NOTE (iii) — RAIAS DISPONÍVEIS ─────────────────────────────────────────
  // "When there are more lanes than athletes, the inside lane(s) should always remain free"
  // Ex: 8 raias, 6 atletas → raias 1 e 2 ficam livres, usa 3-8
  // Ex: 8 raias, 7 atletas → raia 1 fica livre, usa 2-8
  _raiasDisponiveis(nAtletas, nRaiasPista) {
    if (nAtletas >= nRaiasPista) {
      return Array.from({ length: nRaiasPista }, (_, i) => i + 1); // todas: 1..N
    }
    // Libera raias internas (menores números)
    const nRaiasLivres = nRaiasPista - nAtletas;
    return Array.from({ length: nAtletas }, (_, i) => i + 1 + nRaiasLivres); // ex: [3,4,5,6,7,8]
  },

  // ─── RT 20.4.1 — PRIMEIRA FASE: SORTEIO LIVRE ──────────────────────────────
  // Raias atribuídas por sorteio aleatório (Note iii aplicado)
  sortearRaiasLivre(atletasOrdenados, nRaiasPista) {
    const nAtletas = atletasOrdenados.length;
    const raiasDisp = this._raiasDisponiveis(nAtletas, nRaiasPista);
    const embaralhadas = this._embaralhar([...raiasDisp]);
    return atletasOrdenados.map((atl, idx) => ({
      ...atl,
      raia: idx < embaralhadas.length ? embaralhadas[idx] : null,
    }));
  },

  // ─── RT 20.4.3 — CORRIDAS EM RETA ──────────────────────────────────────────
  // Prioridade de raias: 3,4,5,6 → 2,7 → 1,8
  // Classificados por Posição (P) são sorteados primeiro nas raias prioritárias,
  // depois Classificados por Tempo (T) preenchem as restantes na mesma prioridade.
  sortearRaiasReta(atletasOrdenados, nRaiasPista) {
    const nAtl = atletasOrdenados.length;
    const disp = this._raiasDisponiveis(nAtl, nRaiasPista);
    // Adaptar grupos ao número real de raias disponíveis
    const grpA = [3, 4, 5, 6].filter(r => disp.includes(r));
    const grpB = [2, 7].filter(r => disp.includes(r));
    const grpC = [1, 8].filter(r => disp.includes(r));
    // Se raias extras (9+), adicionar ao grupo C
    const extras = disp.filter(r => r > 8);
    return this._sortearPorGrupos(atletasOrdenados, [grpA, grpB, [...grpC, ...extras]]);
  },

  // ─── RT 20.4.4 — 200m ──────────────────────────────────────────────────────
  // Prioridade de raias: 5,6,7 → 3,4,8 → 1,2
  // P sorteados nas raias prioritárias, T nas restantes.
  sortearRaias200(atletasOrdenados, nRaiasPista) {
    const nAtl = atletasOrdenados.length;
    const disp = this._raiasDisponiveis(nAtl, nRaiasPista);
    const grpA = [5, 6, 7].filter(r => disp.includes(r));
    const grpB = [3, 4, 8].filter(r => disp.includes(r));
    const grpC = [1, 2].filter(r => disp.includes(r));
    const extras = disp.filter(r => r > 8);
    return this._sortearPorGrupos(atletasOrdenados, [grpA, grpB, [...grpC, ...extras]]);
  },

  // ─── RT 20.4.5 — 400m / REVEZ ≤4×400m / 800m EM RAIAS ─────────────────────
  // Prioridade de raias: 4,5,6,7 → 3,8 → 1,2
  // P sorteados nas raias prioritárias, T nas restantes.
  sortearRaias400(atletasOrdenados, nRaiasPista) {
    const nAtl = atletasOrdenados.length;
    const disp = this._raiasDisponiveis(nAtl, nRaiasPista);
    const grpA = [4, 5, 6, 7].filter(r => disp.includes(r));
    const grpB = [3, 8].filter(r => disp.includes(r));
    const grpC = [1, 2].filter(r => disp.includes(r));
    const extras = disp.filter(r => r > 8);
    return this._sortearPorGrupos(atletasOrdenados, [grpA, grpB, [...grpC, ...extras]]);
  },

  // ─── RT 20.4.6 — POSIÇÃO POR SORTEIO (>800m, OBSTÁCULOS, MARCHA) ───────────
  // Sem raias — apenas posição de largada (número de ordem)
  sortearPosicaoGrupo(atletasOrdenados, nAtletasPorSerie) {
    const embaralhados = this._embaralhar([...atletasOrdenados]);
    return embaralhados.map((atl, idx) => ({
      ...atl,
      posicao: idx + 1,
      raia: null, // sem raia — largada em grupo
    }));
  },

  // ─── HELPER: DISTRIBUIR POR GRUPOS COM SORTEIO (RT 20.4.3/4/5) ─────────────
  // Regra: Classificados por Posição (P) preenchem raias na ordem de prioridade
  // (A→B→C), respeitando ranking interno — melhores P vão para raias A, seguintes
  // para B, etc. Depois, Classificados por Tempo (T) preenchem as raias restantes
  // na mesma ordem de prioridade, também respeitando ranking interno.
  // Dentro de cada faixa de raias, a atribuição é por sorteio.
  _sortearPorGrupos(atletasOrdenados, grupos) {
    // Verificar se os atletas têm info de origemClassif (vêm de classificação P+T)
    const temOrigem = atletasOrdenados.some(a => a.origemClassif === "posicao" || a.origemClassif === "tempo");

    if (!temOrigem) {
      // Sem info de classificação (1ª fase, manual, etc.) — comportamento por ranking
      return this._distribuirPorRanking(atletasOrdenados, grupos);
    }

    // Separar por origem mantendo ranking interno
    const atletasP = atletasOrdenados.filter(a => a.origemClassif === "posicao");
    const atletasT = atletasOrdenados.filter(a => a.origemClassif === "tempo");
    const atletasOutros = atletasOrdenados.filter(a => a.origemClassif !== "posicao" && a.origemClassif !== "tempo");

    // Copiar grupos como raias disponíveis (mutável)
    const gruposDisp = grupos.map(g => [...g]);

    const resultado = [];

    // P: distribuir por sub-grupos respeitando ranking
    this._distribuirComPrioridade(atletasP, gruposDisp, resultado);
    // T: distribuir nas raias restantes por sub-grupos respeitando ranking
    this._distribuirComPrioridade(atletasT, gruposDisp, resultado);
    // Outros: raias sobrantes
    this._distribuirComPrioridade(atletasOutros, gruposDisp, resultado);

    return resultado;
  },

  // Distribui atletas (já ordenados por ranking) nos grupos de raias disponíveis,
  // preenchendo cada grupo com sorteio antes de passar ao próximo.
  _distribuirComPrioridade(atletas, gruposDisp, resultado) {
    let atletaIdx = 0;
    for (const grupoRaias of gruposDisp) {
      if (grupoRaias.length === 0 || atletaIdx >= atletas.length) continue;
      // Quantos atletas cabem neste grupo de raias
      const nVagas = grupoRaias.length;
      const nAtribuir = Math.min(nVagas, atletas.length - atletaIdx);
      // Pegar as raias deste grupo e embaralhar
      const raiasParaSortear = grupoRaias.splice(0, nAtribuir);
      const raiasEmbaralhadas = this._embaralhar([...raiasParaSortear]);
      for (let i = 0; i < nAtribuir; i++) {
        resultado.push({ ...atletas[atletaIdx], raia: raiasEmbaralhadas[i] });
        atletaIdx++;
      }
    }
    // Atletas sem raia disponível
    while (atletaIdx < atletas.length) {
      resultado.push({ ...atletas[atletaIdx], raia: null });
      atletaIdx++;
    }
  },

  // Distribuição padrão por ranking (sem P/T) — usado em 1ª fase e seriação manual
  _distribuirPorRanking(atletasOrdenados, grupos) {
    const resultado = [];
    let atletaIdx = 0;
    for (const grupoRaias of grupos) {
      if (grupoRaias.length === 0) continue;
      const raiasEmbaralhadas = this._embaralhar([...grupoRaias]);
      for (let ri = 0; ri < raiasEmbaralhadas.length && atletaIdx < atletasOrdenados.length; ri++) {
        resultado.push({ ...atletasOrdenados[atletaIdx], raia: raiasEmbaralhadas[ri] });
        atletaIdx++;
      }
    }
    while (atletaIdx < atletasOrdenados.length) {
      resultado.push({ ...atletasOrdenados[atletaIdx], raia: null });
      atletaIdx++;
    }
    return resultado;
  },

  // Fisher-Yates shuffle
  _embaralhar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  // ─── DETERMINAR MÉTODO DE SORTEIO ──────────────────────────────────────────
  // Retorna { fn, regra } onde fn é a função de sorteio e regra é a referência RT
  getSortearRaias(prova, fase, config = {}) {
    // RT 20.4.6 — Provas com largada em grupo (>800m, obstáculos, marcha)
    if (this._isLargadaEmGrupo(prova, config)) {
      return { fn: this.sortearPosicaoGrupo.bind(this), regra: "RT 20.4.6", tipo: "grupo" };
    }
    // RT 20.4.1 — Primeira fase: sorteio livre
    if (fase === "eliminatoria" || fase === 1) {
      return { fn: this.sortearRaiasLivre.bind(this), regra: "RT 20.4.1", tipo: "raias" };
    }
    // RT 20.4.2 — Fases seguintes: por grupo conforme distância
    if (this._isReta(prova)) {
      return { fn: this.sortearRaiasReta.bind(this), regra: "RT 20.4.3", tipo: "raias" };
    }
    if (this._is200(prova)) {
      return { fn: this.sortearRaias200.bind(this), regra: "RT 20.4.4", tipo: "raias" };
    }
    // 400m, 800m em raias, revezamentos
    return { fn: this.sortearRaias400.bind(this), regra: "RT 20.4.5", tipo: "raias" };
  },

  // Calcula nº de séries necessárias
  calcularNumSeries(nAtletas, capacidade) {
    if (nAtletas <= capacidade) return 1;
    return Math.ceil(nAtletas / capacidade);
  },

  // ─── DESCREVER REGRA APLICADA (para UI) ─────────────────────────────────────
  descreverRegra(prova, fase, config = {}) {
    const info = this.getSortearRaias(prova, fase, config);
    const faseNome = fase === "eliminatoria" || fase === 1 ? "Eliminatória (1ª fase)"
      : fase === "semifinal" ? "Semifinal" : "Final";
    if (info.tipo === "grupo") {
      return `${info.regra} — ${faseNome}: posições de largada por sorteio livre (sem raias)`;
    }
    if (info.regra === "RT 20.4.1") {
      return `${info.regra} — ${faseNome}: raias atribuídas por sorteio livre`;
    }
    const m = this._getMetros(prova);
    if (info.regra === "RT 20.4.3") {
      return `${info.regra} — ${faseNome}: reta — P→(3,4,5,6→2,7→1,8) T→restantes`;
    }
    if (info.regra === "RT 20.4.4") {
      return `${info.regra} — ${faseNome}: 200m — P→(5,6,7→3,4,8→1,2) T→restantes`;
    }
    return `${info.regra} — ${faseNome}: ${m}m — P→(4,5,6,7→3,8→1,2) T→restantes`;
  },

  // ═══ FUNÇÃO PRINCIPAL: seriar uma prova ═══
  // config: { nRaias, fase, modo800, atlPorSerie }
  //   fase: "eliminatoria"|"semifinal"|"final" ou 1|2|3 (legado)
  //   modo800: "raias"|"grupo" (apenas para 800m)
  //   atlPorSerie: número de atletas por série para provas >800m
  // Saída: { series, ordemSeries, regraAplicada, tipoLargada }
  seriarProva(atletasComMarca, prova, config) {
    const { nRaias = 8, fase = "eliminatoria", atlPorSerie = 12, modo800 = "raias", aleatorio = false } = config;
    const nAtletas = atletasComMarca.length;

    if (nAtletas === 0) return { series: [], ordemSeries: [], regraAplicada: "", tipoLargada: "raias" };

    // Rankear por marca de referência (menor tempo = melhor para pista)
    const isPista = prova.unidade === "s";
    const rankeados = [...atletasComMarca].sort((a, b) => {
      const mA = parseFloat(a.marcaRef) || Infinity;
      const mB = parseFloat(b.marcaRef) || Infinity;
      if (isPista) return mA - mB;
      return mB - mA;
    });

    // Determinar tipo de prova e regra aplicável
    const sortInfo = this.getSortearRaias(prova, fase, { modo800 });
    const isGrupo = sortInfo.tipo === "grupo";

    // Capacidade por série: raias (curtas) ou atlPorSerie (longas/grupo)
    const capacidade = isGrupo ? atlPorSerie : nRaias;
    const nSeries = this.calcularNumSeries(nAtletas, capacidade);

    // RT 20.3.3 — Distribuição:
    // Primeira fase → sequencial (preenche série ao máximo)
    // Fases seguintes → zigzag (equilibra séries)
    const isPrimeiraFase = fase === "eliminatoria" || fase === 1;
    const seriesDistribuidas = isPrimeiraFase
      ? this.distribuirSerpentina(rankeados, nSeries, capacidade)
      : this.distribuirZigzag(rankeados, nSeries, capacidade);

    // Sorteio de raias/posições por série
    const seriesComRaias = seriesDistribuidas.map((serie, idx) => {
      const atletasOrdenados = [...serie].sort((a, b) => a.ranking - b.ranking);
      let atletasComRaia;
      if (isGrupo) {
        // RT 20.4.6: posições por sorteio
        atletasComRaia = sortInfo.fn(atletasOrdenados, capacidade);
      } else {
        // RT 20.4.1/3/4/5: raias por sorteio (com Note iii)
        atletasComRaia = sortInfo.fn(atletasOrdenados, nRaias);
      }
      return {
        numero: idx + 1,
        atletas: isGrupo
          ? atletasComRaia.sort((a, b) => (a.posicao || 99) - (b.posicao || 99))
          : atletasComRaia.sort((a, b) => (a.raia || 99) - (b.raia || 99)),
      };
    });

    // Modo aleatório: numera sequencialmente (sem inversão, pois não há ranking)
    // Modo por marca: Série 1 = mais fraca (1ª a correr), última série = mais forte
    const seriesFinal = aleatorio
      ? seriesComRaias
      : [...seriesComRaias].reverse().map((serie, idx) => ({ ...serie, numero: idx + 1 }));
    const ordemSeries = seriesFinal.map((_, i) => i + 1);

    return {
      series: seriesFinal,
      ordemSeries,
      regraAplicada: this.descreverRegra(prova, fase, { modo800 }),
      tipoLargada: isGrupo ? "grupo" : "raias",
    };
  },

  // ═══ RT 20.3.2(a) — RANKING PÓS-FASE ANTERIOR ═══
  // Após eliminatórias/semifinais, o ranking para alocação de raias na próxima fase segue:
  //   1) Vencedor de série mais rápido, 2º vencedor mais rápido, etc.
  //   2) 2º lugar mais rápido, 2º 2º lugar mais rápido, etc.
  //   3) Classificados por tempo mais rápido, etc.
  // Entrada:
  //   seriacaoAnterior: { series: [...], ordemSeries, progressao: { porPosicao, porTempo } }
  //   resultadosAnterior: { atletaId: { marca, status, ... } }
  //   progressao: { porPosicao: N, porTempo: N }
  // Saída: array de { atletaId, nome, ..., marcaRef, origemClassif: "posicao"|"tempo" } ordenados por ranking
  rankearRT20_3_2a(seriacaoAnterior, resultadosAnterior, progressao) {
    const { porPosicao = 3, porTempo = 2 } = progressao || {};
    if (!seriacaoAnterior?.series || !resultadosAnterior) return [];

    // 1) Classificar atletas dentro de cada série por resultado
    const seriesClassif = seriacaoAnterior.series.map(serie => {
      const atlComRes = serie.atletas.map(sa => {
        const aid = sa.id || sa.atletaId;
        const raw = resultadosAnterior[aid];
        const marcaRaw = raw != null ? (typeof raw === "object" ? raw.marca : raw) : null;
        const marcaUp = String(marcaRaw || "").toUpperCase();
        const status = raw != null && typeof raw === "object" ? (raw.status || "") : "";
        const isStatus = ["DNS","DNF","DQ","NM","NH"].includes(status) || ["DNS","DNF","DQ","NM","NH"].includes(marcaUp);
        const marcaNum = !isStatus && marcaRaw != null ? parseFloat(marcaRaw) : null;
        return { ...sa, atletaId: aid, marca: (marcaNum != null && !isNaN(marcaNum)) ? marcaNum : null, status, isStatus };
      });
      // Ordenar por marca (menor = melhor para pista)
      return atlComRes
        .filter(a => !a.isStatus && a.marca != null)
        .sort((a, b) => a.marca - b.marca);
    });

    // 2) Classificados por posição: top-N de cada série
    const classificadosPorPosicao = [];
    const jaClassificados = new Set();
    for (let pos = 0; pos < porPosicao; pos++) {
      // Coleta o (pos+1)º colocado de cada série, depois ordena por tempo
      const destaPos = seriesClassif
        .map(serie => serie[pos] || null)
        .filter(Boolean)
        .sort((a, b) => a.marca - b.marca);
      destaPos.forEach(a => {
        if (!jaClassificados.has(a.atletaId)) {
          classificadosPorPosicao.push({ ...a, origemClassif: "posicao", posNaSerie: pos + 1 });
          jaClassificados.add(a.atletaId);
        }
      });
    }

    // 3) Classificados por tempo: os N melhores tempos entre os NÃO classificados por posição
    const restantes = seriesClassif.flatMap(serie => serie)
      .filter(a => !jaClassificados.has(a.atletaId) && a.marca != null)
      .sort((a, b) => a.marca - b.marca);
    const classificadosPorTempo = restantes.slice(0, porTempo).map(a => ({
      ...a, origemClassif: "tempo",
    }));

    // 4) Ranking RT 20.3.2(a):
    // Posição 1 de cada série (do mais rápido ao mais lento),
    // depois posição 2, posição 3, etc.,
    // depois os por tempo
    const rankFinal = [];

    // Agrupar por posição na série, dentro de cada posição ordenar por marca
    for (let pos = 0; pos < porPosicao; pos++) {
      const destaPosOrdenados = classificadosPorPosicao
        .filter(a => a.posNaSerie === pos + 1)
        .sort((a, b) => a.marca - b.marca);
      rankFinal.push(...destaPosOrdenados);
    }

    // Depois os por tempo (já ordenados)
    rankFinal.push(...classificadosPorTempo);

    // Atribuir marcaRef para a próxima fase
    return rankFinal.map((a, idx) => ({
      ...a,
      marcaRef: a.marca != null ? String(a.marca) : "",
      ranking: idx + 1,
    }));
  },
};

export { SeriacaoEngine };
