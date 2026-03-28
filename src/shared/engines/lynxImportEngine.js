/**
 * lynxImportEngine.js
 * Importação de resultados FinishLynx (.lif) para o GERENTRACK.
 *
 * Formato .lif real do FinishLynx:
 *   Cabeçalho: EVENTO_NUM,ROUND,HEAT,NOME_DA_PROVA,VENTO (info),TIPO_CRONO,...
 *   Atletas:   PLACE,LANE,BIB,LAST,FIRST,AFFIL,TIME,,TIME2,...
 *
 * PLACE pode ser numérico (1, 2, 3) ou código de status:
 *   NA = Did Not Start/Finish → DNS
 *   DC = Desclassificado → DQ
 *   SF = Saída Falsa → DQ
 *   NI = Não Identificado → ignorar com aviso
 *   DNF = Did Not Finish → DNF
 *
 * Vento vem no CABEÇALHO do bloco (campo 5), não por atleta.
 * Ex: "+2.0 (Manual)" → extrair valor numérico +2.0
 */

import { gerarMapeamentoEventos } from "./lynxExportEngine";

// ─── MAPEAMENTO PLACE → STATUS ──────────────────────────────────────────────

const PLACE_STATUS = {
  "NA":  "DNF",  // Não Acabou → DNF
  "NI":  "DNS",  // Não Iniciou → DNS
  "DNF": "DNF",
  "DC":  "DQ",   // Desclassificado
  "SF":  "DQ",   // Saída Falsa
  "DSQ": "DQ",
  "DQ":  "DQ",
  "DNS": "DNS",
};

// ─── CONVERSÃO DE TEMPO ─────────────────────────────────────────────────────

/**
 * Converte string de tempo do FinishLynx para segundos (number).
 * Aceita: "10.23", "10.01", "1:02.45", "1:21.12"
 * Retorna null para valores vazios ou inválidos.
 */
// Converte tempo do LIF para milissegundos
// Formatos: "10.22" (seg), "1:10.10" (min:seg), "1:30:10.10" (h:min:seg)
function converterTempo(str) {
  if (!str) return null;
  const s = str.trim();
  if (!s) return null;

  if (s.includes(":")) {
    const partes = s.split(":");
    if (partes.length === 2) {
      const min = parseFloat(partes[0]);
      const seg = parseFloat(partes[1]);
      if (isNaN(min) || isNaN(seg)) return null;
      return Math.round((min * 60 + seg) * 1000);
    }
    if (partes.length === 3) {
      const h = parseFloat(partes[0]);
      const min = parseFloat(partes[1]);
      const seg = parseFloat(partes[2]);
      if (isNaN(h) || isNaN(min) || isNaN(seg)) return null;
      return Math.round((h * 3600 + min * 60 + seg) * 1000);
    }
    return null;
  }

  // Segundos simples → converter para ms
  const num = parseFloat(s);
  return isNaN(num) ? null : Math.round(num * 1000);
}

/**
 * Extrai vento do campo de cabeçalho do .lif.
 * Ex: "+2.0 (Manual)" → 2.0, "-1.3" → -1.3, "" → null
 */
function extrairVentoCabecalho(str) {
  if (!str) return null;
  const match = str.trim().match(/^([+-]?\d+\.?\d*)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
}

// ─── PARSER .lif ────────────────────────────────────────────────────────────

/**
 * Parseia o conteúdo de um arquivo .lif e retorna resultados estruturados.
 */
export function parsearLif(conteudoLif, eventoAtual, inscricoes, atletas, equipes, numeracaoPeito) {
  const avisos = [];
  const erros = [];

  if (!conteudoLif || !conteudoLif.trim()) {
    return { resultados: [], avisos: [], erros: ["Arquivo .lif vazio."], totalEventos: 0, totalResultados: 0 };
  }

  if (!eventoAtual) {
    return { resultados: [], avisos: [], erros: ["Nenhum evento selecionado."], totalEventos: 0, totalResultados: 0 };
  }

  // Passo 1: Gerar mapeamento eventoNum → prova
  const { mapeamento } = gerarMapeamentoEventos(eventoAtual, inscricoes);

  if (mapeamento.size === 0) {
    return { resultados: [], avisos: [], erros: ["Nenhuma prova de pista mapeada para este evento."], totalEventos: 0, totalResultados: 0 };
  }

  // Passo 2: Inverter numeracaoPeito → bib → atletaId/equipeId
  const eid = eventoAtual.id;
  const numPeitoEvento = (numeracaoPeito || {})[eid] || {};
  const bibParaId = new Map();
  for (const [id, bib] of Object.entries(numPeitoEvento)) {
    bibParaId.set(String(bib), id);
  }

  if (bibParaId.size === 0) {
    erros.push("Nenhuma numeração de peito configurada para este evento. Configure em 'Numeração de Peito' antes de importar.");
    return { resultados: [], avisos: [], erros, totalEventos: 0, totalResultados: 0 };
  }

  const atletasMap = new Map(atletas.map(a => [a.id, a]));

  // Passo 3: Parsear blocos do .lif (separados por linha em branco)
  const linhas = conteudoLif.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const blocos = [];
  let blocoAtual = [];

  for (const linha of linhas) {
    const trimmed = linha.trim();
    if (trimmed === "") {
      if (blocoAtual.length > 0) {
        blocos.push(blocoAtual);
        blocoAtual = [];
      }
    } else {
      blocoAtual.push(trimmed);
    }
  }
  if (blocoAtual.length > 0) blocos.push(blocoAtual);

  // Passo 4: Processar cada bloco
  const grupoMap = new Map();
  let totalResultados = 0;
  const eventosProcessados = new Set();

  for (const bloco of blocos) {
    if (bloco.length < 2) continue;

    // Cabeçalho: EVENTO_NUM,ROUND,HEAT,NOME,VENTO_INFO,TIPO_CRONO,...
    const cabCampos = bloco[0].split(",");
    const eventoNum = parseInt(cabCampos[0], 10);
    const heat = parseInt(cabCampos[2], 10) || 0;

    if (isNaN(eventoNum)) {
      avisos.push(`Linha ignorada (número de evento inválido): "${bloco[0]}"`);
      continue;
    }

    const chaveMap = `${eventoNum}_${heat}`;
    const info = mapeamento.get(chaveMap);
    if (!info) {
      avisos.push(`Evento #${eventoNum} heat ${heat} não encontrado no mapeamento. Ignorado.`);
      continue;
    }

    // Vento da corrida (campo 5, index 4)
    const ventoCorrida = cabCampos.length > 4 ? extrairVentoCabecalho(cabCampos[4]) : null;

    eventosProcessados.add(eventoNum);
    const { provaId, provaNome, catId, sexo, faseSufixo, isRevezamento, label } = info;
    const grupoKey = `${provaId}_${catId}_${sexo}_${faseSufixo || ""}`;

    if (!grupoMap.has(grupoKey)) {
      grupoMap.set(grupoKey, {
        provaId,
        provaNome,
        catId,
        sexo,
        faseSufixo,
        isRevezamento,
        nomeEvento: label,
        vento: ventoCorrida,
        entradas: [],
      });
    }

    const grupo = grupoMap.get(grupoKey);
    // Se o grupo já existe (merge de séries), usar vento da primeira série com vento
    if (grupo.vento == null && ventoCorrida != null) grupo.vento = ventoCorrida;

    // Linhas de atleta: PLACE,LANE,BIB,LAST,FIRST,AFFIL,TIME,...
    for (let i = 1; i < bloco.length; i++) {
      const campos = bloco[i].split(",");
      if (campos.length < 6) {
        avisos.push(`Linha com campos insuficientes ignorada: "${bloco[i]}"`);
        continue;
      }

      const place = (campos[0] || "").trim().toUpperCase();
      const bib = (campos[1] || "").trim();
      const lane = (campos[2] || "").trim();
      const sobrenome = (campos[3] || "").trim();
      const nome = (campos[4] || "").trim();
      const afil = (campos[5] || "").trim();
      const tempoStr = (campos[6] || "").trim();

      const bibStr = String(bib);
      const idEncontrado = bibParaId.get(bibStr);

      if (!idEncontrado) {
        avisos.push(`Peito #${bib} (${sobrenome}, ${nome}) não encontrado no mapeamento de numeração. Ignorado.`);
        continue;
      }

      // Determinar status a partir do PLACE (não do tempo)
      const statusFromPlace = PLACE_STATUS[place] || null;

      const marca = statusFromPlace ? null : converterTempo(tempoStr);
      const raiaNum = parseInt(lane, 10) || null;

      // Se não tem status e não tem marca válida, reportar
      if (!statusFromPlace && marca == null && tempoStr) {
        avisos.push(`Tempo inválido para peito #${bib}: "${tempoStr}". Ignorado.`);
        continue;
      }

      const atletaGt = atletasMap.get(idEncontrado);
      const nomeAtleta = isRevezamento
        ? (equipes.find(eq => eq.id === idEncontrado)?.nome || afil || bibStr)
        : (atletaGt?.nome || `${nome} ${sobrenome}`);

      // Validação cruzada: comparar sobrenome do .lif com nome no GERENTRACK
      let nomeConflito = false;
      const nomeLif = `${nome} ${sobrenome}`.trim().toUpperCase();
      if (!isRevezamento && atletaGt && sobrenome) {
        const nomeGt = (atletaGt.nome || "").toUpperCase();
        const sobrenomeLif = sobrenome.toUpperCase();
        // Checar se o sobrenome do .lif aparece em algum lugar do nome completo do GERENTRACK
        if (!nomeGt.includes(sobrenomeLif) && !sobrenomeLif.includes(nomeGt.split(" ").pop())) {
          nomeConflito = true;
          avisos.push(`Peito #${bib}: nome no .lif "${sobrenome}, ${nome}" ≠ GERENTRACK "${atletaGt.nome}". Verifique a numeração.`);
        }
      }

      grupo.entradas.push({
        atletaId: idEncontrado,
        marca,
        raia: raiaNum,
        vento: ventoCorrida,
        status: statusFromPlace,
        nomeAtleta,
        nomeLif,
        nomeConflito,
        bib: bibStr,
        posicaoLynx: parseInt(place, 10) || null,
        statusLynx: statusFromPlace ? place : null,
      });

      totalResultados++;
    }
  }

  const resultados = [...grupoMap.values()].filter(g => g.entradas.length > 0);

  // Diagnóstico
  const diagnostico = {
    bibsDisponiveis: bibParaId.size,
    provasMapeadas: mapeamento.size,
    blocosNoArquivo: blocos.length,
    mapeamentoChaves: [...mapeamento.keys()],
  };

  return {
    resultados,
    avisos: [...new Set(avisos)],
    erros,
    totalEventos: eventosProcessados.size,
    totalResultados,
    diagnostico,
  };
}
