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
import { getFasesProva, buscarSeriacao } from "../constants/fases";
import { _getClubeAtleta } from "../formatters/utils";
import { getSufixoProva } from "../constants/gruposNorma12";

// ─── TIPOS DE PROVA EXPORTÁVEIS (pista) ─────────────────────────────────────

const TIPOS_PISTA = new Set(["rasa", "barreiras", "obstaculos", "marcha", "revezamento"]);

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
 * Exemplos:
 *   "200 METROS FEMININO SUB-18 FINAL"
 *   "100 METROS MASCULINO ADULTO SERIE 1 FINAL POR TEMPO"
 *   "100 METROS MASCULINO SUB-20 SERIE 1 ELIMINATORIA"
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

// ─── GERAÇÃO PRINCIPAL ──────────────────────────────────────────────────────

/**
 * Gera o conteúdo do arquivo FinishLynx .evt
 *
 * @param {object}   eventoAtual     — objeto do evento
 * @param {Array}    inscricoes      — todas as inscrições
 * @param {Array}    atletas         — todos os atletas
 * @param {Array}    equipes         — todas as equipes
 * @param {object}   numeracaoPeito  — { eventoId: { atletaId: numero } }
 * @returns {{ conteudo: string, avisos: string[], totalEventos: number, totalAtletas: number }}
 */
export function gerarEvt(eventoAtual, inscricoes, atletas, equipes, numeracaoPeito) {
  if (!eventoAtual) return { conteudo: "", avisos: ["Nenhum evento selecionado."], totalEventos: 0, totalAtletas: 0 };

  const eid = eventoAtual.id;
  const provasPrograma = eventoAtual.provasPrograma || [];
  const programaHorario = eventoAtual.programaHorario || {};
  const seriacaoObj = eventoAtual.seriacao || {};
  const numPeitoEvento = (numeracaoPeito || {})[eid] || {};
  const inscEvento = inscricoes.filter(i => i.eventoId === eid);
  const atletasMap = new Map(atletas.map(a => [a.id, a]));
  const todas = todasAsProvas();
  const avisos = [];

  // Filtrar provas de pista do programa
  const provasPista = provasPrograma
    .map(pId => todas.find(p => p.id === pId))
    .filter(p => p && TIPOS_PISTA.has(p.tipo));

  if (provasPista.length === 0) {
    return { conteudo: "", avisos: ["Nenhuma prova de pista no programa deste evento."], totalEventos: 0, totalAtletas: 0 };
  }

  const blocos = [];
  let eventoNum = 0;
  let totalAtletasExportados = 0;

  for (const prova of provasPista) {
    const sexo = prova.id[0]; // M ou F
    const catId = prova.id.split("_")[1]; // sub14, adulto, etc.
    const isRevezamento = prova.tipo === "revezamento";

    // Inscrições desta prova
    const inscProva = inscEvento.filter(i =>
      i.provaId === prova.id &&
      !i.origemCombinada &&
      (isRevezamento ? i.tipo === "revezamento" : i.tipo !== "revezamento")
    );

    if (inscProva.length === 0) continue;

    // Determinar fases
    let fases = getFasesProva(prova.id, programaHorario);
    if (fases.length === 0) fases = ["FIN"]; // default: final

    for (const faseSufixo of fases) {
      // Buscar seriação
      const seriacao = buscarSeriacao(seriacaoObj, prova.id, catId, sexo, faseSufixo);

      if (seriacao && seriacao.series && seriacao.series.length > 0) {
        // ── COM SERIAÇÃO ──
        const totalSeries = seriacao.series.length;

        for (const serie of seriacao.series) {
          eventoNum++;
          const label = labelEvento(prova.id, sexo, catId, faseSufixo, serie.numero, totalSeries);
          const heat = totalSeries > 1 ? serie.numero : 0;
          const linhas = [`${eventoNum},1,${heat},${label}`];

          for (const atlSer of (serie.atletas || [])) {
            const aId = atlSer.atletaId || atlSer.id;
            const raia = atlSer.raia || atlSer.posicao || 0;

            if (isRevezamento) {
              // Revezamento: usar equipe
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

          blocos.push(linhas.join("\n"));
        }
      } else {
        // ── SEM SERIAÇÃO ──
        eventoNum++;
        const label = labelEvento(prova.id, sexo, catId, faseSufixo, 1, 1);
        const linhas = [`${eventoNum},1,0,${label}`];

        if (!isRevezamento) {
          avisos.push(`Prova "${prova.nome}" (${labelCategoria(catId)}) sem seriação — raias atribuídas sequencialmente.`);
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

        blocos.push(linhas.join("\n"));
      }
    }
  }

  // Deduplica avisos
  const avisosUnicos = [...new Set(avisos)];

  return {
    conteudo: blocos.join("\n\n") + "\n",
    avisos: avisosUnicos,
    totalEventos: eventoNum,
    totalAtletas: totalAtletasExportados,
  };
}
