/**
 * lynxExportEngine.js
 * Geração de arquivo FinishLynx (.evt) a partir dos dados do GERENTRACK.
 *
 * Formato .evt:
 *   EVENTO_NUM,ROUND,HEAT,NOME_DA_PROVA
 *   ,NUM_PEITO,RAIA,SOBRENOME,NOME,EQUIPE
 *   (linha em branco entre blocos)
 */

import { todasAsProvas } from "../athletics/provasDef";
import { CATEGORIAS } from "../constants/categorias";
import { getFasesModo, buscarSeriacao } from "../constants/fases";
import { _getClubeAtleta } from "../formatters/utils";
import { getSufixoProva } from "../constants/gruposNorma12";

// ─── TIPOS DE PROVA EXPORTÁVEIS (pista) ─────────────────────────────────────

export const TIPOS_PISTA = new Set(["rasa", "barreiras", "obstaculos", "marcha", "revezamento"]);

// ─── MAPEAMENTO SUFIXO → NOME LYNX ─────────────────────────────────────────

const NOMES_LYNX = {
  "60m":      "60 METROS",
  "75m":      "75 METROS",
  "100m":     "100 METROS",
  "150m":     "150 METROS",
  "200m":     "200 METROS",
  "250m":     "250 METROS",
  "400m":     "400 METROS",
  "800m":     "800 METROS",
  "1000m":    "1.000 METROS",
  "1500m":    "1.500 METROS",
  "2000m":    "2.000 METROS",
  "3000m":    "3.000 METROS",
  "5000m":    "5.000 METROS",
  "10000m":   "10.000 METROS",
  "80mB":     "80 METROS COM BARREIRAS",
  "100mB":    "100 METROS COM BARREIRAS",
  "110mB":    "110 METROS COM BARREIRAS",
  "300mB":    "300 METROS COM BARREIRAS",
  "400mB":    "400 METROS COM BARREIRAS",
  "1500mObs": "1.500 METROS COM OBSTACULOS",
  "2000mObs": "2.000 METROS COM OBSTACULOS",
  "3000mObs": "3.000 METROS COM OBSTACULOS",
  "2kmM":     "2.000 METROS MARCHA",
  "5kmM":     "5.000 METROS MARCHA",
  "10kmM":    "10.000 METROS MARCHA",
  "20kmM":    "20.000 METROS MARCHA",
  "35kmM":    "35.000 METROS MARCHA",
  "revMisto": "REVEZAMENTO MISTO MARCHA",
  "5x60m":    "REVEZAMENTO 5X60 METROS",
  "4x75m":    "REVEZAMENTO 4X75 METROS",
  "4x100m":   "REVEZAMENTO 4X100 METROS",
  "4x400m":   "REVEZAMENTO 4X400 METROS",
  "4x400mix": "REVEZAMENTO 4X400 METROS MISTO",
};

// ─── NOMES DE FASE ──────────────────────────────────────────────────────────

const FASE_LABEL = {
  "ELI": "ELIMINATORIA",
  "SEM": "SEMIFINAL",
  "FIN": "FINAL",
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

function removerAcentos(str) {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function separarNome(nomeCompleto) {
  const partes = removerAcentos(nomeCompleto || "").toUpperCase().trim().split(/\s+/);
  if (partes.length <= 1) return { sobrenome: partes[0] || "", nome: "" };
  const sobrenome = partes[partes.length - 1];
  const nome = partes.slice(0, -1).join(" ");
  return { sobrenome, nome };
}

function nomeLynx(provaId) {
  const sufixo = getSufixoProva(provaId);
  return NOMES_LYNX[sufixo] || removerAcentos(sufixo).toUpperCase();
}

function labelSexo(sexo) {
  return sexo === "M" ? "MASCULINO" : "FEMININO";
}

function labelCategoria(catId) {
  const cat = CATEGORIAS.find(c => c.id === catId);
  return cat ? removerAcentos(cat.nome).toUpperCase() : catId.toUpperCase();
}

/**
 * Monta o nome completo do evento para o .evt
 */
function labelEvento(provaId, sexo, catId, faseSufixo, serieNum, totalSeries) {
  const partes = [nomeLynx(provaId), labelSexo(sexo), labelCategoria(catId)];
  const faseNome = FASE_LABEL[faseSufixo] || "FINAL";

  if (totalSeries > 1) {
    partes.push("SERIE " + serieNum);
    if (faseNome === "FINAL") {
      partes.push("FINAL POR TEMPO");
    } else {
      partes.push(faseNome);
    }
  } else {
    partes.push(faseNome);
  }

  return partes.join(" ");
}

// ─── MAPEAMENTO COMPARTILHADO (export + import) ─────────────────────────────

/**
 * Gera o mapeamento (eventoNum, heat) → { provaId, catId, sexo, faseSufixo, ... }
 * Usado tanto na exportação (.evt) quanto na importação (.lif).
 *
 * Séries da mesma prova/fase compartilham o mesmo eventoNum — o HEAT diferencia.
 * Chave do Map: "eventoNum_heat" (string)
 *
 * @param {object} eventoAtual
 * @param {Array}  inscricoes
 * @returns {{ mapeamento: Map<string, object>, provasPista: Array }}
 */
export function gerarMapeamentoEventos(eventoAtual, inscricoes) {
  const eid = eventoAtual.id;
  const provasPrograma = eventoAtual.provasPrograma || [];
  const configSeriacaoEvt = eventoAtual.configSeriacao || {};
  const seriacaoObj = eventoAtual.seriacao || {};
  const inscEvento = inscricoes.filter(i => i.eventoId === eid);
  const todas = todasAsProvas();

  const provasPista = provasPrograma
    .map(pId => todas.find(p => p.id === pId))
    .filter(p => p && TIPOS_PISTA.has(p.tipo));

  const mapeamento = new Map();
  let eventoNum = 0;

  for (const prova of provasPista) {
    const sexo = prova.id[0];
    const catId = prova.id.split("_")[1];
    const isRevezamento = prova.tipo === "revezamento";

    const inscProva = inscEvento.filter(i =>
      i.provaId === prova.id &&
      !i.origemCombinada &&
      (isRevezamento ? i.tipo === "revezamento" : i.tipo !== "revezamento")
    );

    if (inscProva.length === 0) continue;

    let fases = getFasesModo(prova.id, configSeriacaoEvt);
    if (fases.length === 0) fases = [""]; // fase única: sem sufixo (label mostra "FINAL" via fallback)

    for (const faseSufixo of fases) {
      const seriacao = buscarSeriacao(seriacaoObj, prova.id, catId, sexo, faseSufixo);

      eventoNum++; // incrementa uma vez por prova/fase

      if (seriacao && seriacao.series && seriacao.series.length > 0) {
        const totalSeries = seriacao.series.length;
        for (const serie of seriacao.series) {
          const heat = totalSeries > 1 ? serie.numero : 0;
          mapeamento.set(`${eventoNum}_${heat}`, {
            eventoNum,
            heat,
            provaId: prova.id,
            provaNome: prova.nome,
            catId,
            sexo,
            faseSufixo,
            isRevezamento,
            serieNum: serie.numero,
            totalSeries,
            label: labelEvento(prova.id, sexo, catId, faseSufixo, serie.numero, totalSeries),
          });
        }
      } else {
        mapeamento.set(`${eventoNum}_0`, {
          eventoNum,
          heat: 0,
          provaId: prova.id,
          provaNome: prova.nome,
          catId,
          sexo,
          faseSufixo,
          isRevezamento,
          serieNum: 1,
          totalSeries: 1,
          label: labelEvento(prova.id, sexo, catId, faseSufixo, 1, 1),
        });
      }
    }
  }

  return { mapeamento, provasPista };
}

/**
 * Lista itens exportáveis (prova × fase) com contagem de séries.
 * Cada item tem chave única "provaId__faseSufixo" para o filtro multi-select.
 */
export function listarProvasExportaveis(eventoAtual, inscricoes) {
  if (!eventoAtual) return [];
  const { mapeamento } = gerarMapeamentoEventos(eventoAtual, inscricoes);
  const itensMap = new Map();
  for (const [, info] of mapeamento) {
    const chave = `${info.provaId}__${info.faseSufixo || ""}`;
    if (!itensMap.has(chave)) {
      itensMap.set(chave, {
        chave,
        provaId: info.provaId,
        provaNome: info.provaNome,
        catId: info.catId,
        sexo: info.sexo,
        faseSufixo: info.faseSufixo || "",
        series: 0,
      });
    }
    itensMap.get(chave).series++;
  }
  return [...itensMap.values()];
}

// ─── GERAÇÃO PRINCIPAL ──────────────────────────────────────────────────────

/**
 * Gera o conteúdo do arquivo FinishLynx .evt
 * @param {Set<string>|null} filtroChaves — Set de chaves "provaId__faseSufixo" para exportar, ou null para todas
 */
export function gerarEvt(eventoAtual, inscricoes, atletas, equipes, numeracaoPeito, filtroChaves) {
  if (!eventoAtual) return { conteudo: "", avisos: ["Nenhum evento selecionado."], totalEventos: 0, totalAtletas: 0 };

  const eid = eventoAtual.id;
  const seriacaoObj = eventoAtual.seriacao || {};
  const numPeitoEvento = (numeracaoPeito || {})[eid] || {};
  const inscEvento = inscricoes.filter(i => i.eventoId === eid);
  const atletasMap = new Map(atletas.map(a => [a.id, a]));
  const avisos = [];

  const { mapeamento, provasPista } = gerarMapeamentoEventos(eventoAtual, inscricoes);

  if (provasPista.length === 0) {
    return { conteudo: "", avisos: ["Nenhuma prova de pista no programa deste evento."], totalEventos: 0, totalAtletas: 0 };
  }

  const blocos = [];
  let totalAtletasExportados = 0;

  for (const [, info] of mapeamento) {
    const { eventoNum, heat, provaId, catId, sexo, faseSufixo, isRevezamento, serieNum, totalSeries, label } = info;
    if (filtroChaves && !filtroChaves.has(`${provaId}__${faseSufixo || ""}`)) continue;
    const linhas = [`${eventoNum},1,${heat},${label}`];

    const seriacao = buscarSeriacao(seriacaoObj, provaId, catId, sexo, faseSufixo);

    if (seriacao && seriacao.series && seriacao.series.length > 0) {
      const serie = seriacao.series.find(sr => sr.numero === serieNum);
      if (!serie) continue;

      for (const atlSer of (serie.atletas || [])) {
        const aId = atlSer.atletaId || atlSer.id;
        const raia = atlSer.raia || atlSer.posicao || 0;

        if (isRevezamento) {
          const eq = equipes.find(e => e.id === aId);
          const nomeEq = removerAcentos(eq?.nome || aId).toUpperCase();
          const siglaEq = removerAcentos(eq?.sigla || "").toUpperCase();
          linhas.push(`,${numPeitoEvento[aId] || ""},${raia},${siglaEq || nomeEq},${nomeEq},${nomeEq}`);
        } else {
          const atleta = atletasMap.get(aId);
          if (!atleta) continue;
          const numPeito = numPeitoEvento[aId] || "";
          if (!numPeito) avisos.push(`Atleta "${atleta.nome}" sem número de peito.`);
          const { sobrenome, nome } = separarNome(atleta.nome);
          const clube = removerAcentos(_getClubeAtleta(atleta, equipes) || "").toUpperCase();
          linhas.push(`,${numPeito},${raia},${sobrenome},${nome},${clube}`);
          totalAtletasExportados++;
        }
      }
    } else {
      const inscProva = inscEvento.filter(i =>
        i.provaId === provaId &&
        !i.origemCombinada &&
        (isRevezamento ? i.tipo === "revezamento" : i.tipo !== "revezamento")
      );

      if (!isRevezamento) {
        avisos.push(`Prova "${info.provaNome}" (${labelCategoria(catId)}) sem seriação — raias atribuídas sequencialmente.`);
      }

      let raia = 0;
      for (const insc of inscProva) {
        raia++;
        const aId = isRevezamento ? insc.equipeId : insc.atletaId;

        if (isRevezamento) {
          const eq = equipes.find(e => e.id === aId);
          const nomeEq = removerAcentos(eq?.nome || aId).toUpperCase();
          const siglaEq = removerAcentos(eq?.sigla || "").toUpperCase();
          linhas.push(`,${numPeitoEvento[aId] || ""},${raia},${siglaEq || nomeEq},${nomeEq},${nomeEq}`);
        } else {
          const atleta = atletasMap.get(aId);
          if (!atleta) continue;
          const numPeito = numPeitoEvento[aId] || "";
          if (!numPeito) avisos.push(`Atleta "${atleta.nome}" sem número de peito.`);
          const { sobrenome, nome } = separarNome(atleta.nome);
          const clube = removerAcentos(_getClubeAtleta(atleta, equipes) || "").toUpperCase();
          linhas.push(`,${numPeito},${raia},${sobrenome},${nome},${clube}`);
          totalAtletasExportados++;
        }
      }
    }

    blocos.push(linhas.join("\n"));
  }

  const avisosUnicos = [...new Set(avisos)];

  return {
    conteudo: blocos.join("\n\n") + "\n",
    avisos: avisosUnicos,
    totalEventos: new Set([...mapeamento.values()].map(v => v.eventoNum)).size,
    totalAtletas: totalAtletasExportados,
  };
}
