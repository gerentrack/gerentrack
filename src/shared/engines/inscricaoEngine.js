/**
 * inscricaoEngine.js
 * Motor centralizado para validação de limites de provas por categoria
 * e cálculo de preço de inscrição por categoria + situação de equipe.
 *
 * Etapa 2 — GerenTrack
 */

import { getGrupoNorma12, isCombinada, NOMES_GRUPOS_NORMA12 } from "../constants/gruposNorma12";

// ─── RESTRIÇÃO: SOMENTE FEDERADOS ───────────────────────────────────────────

/**
 * Valida se o atleta possui registro CBAt quando o evento exige apenas federados.
 * @param {object} evento  — objeto do evento
 * @param {object} atleta  — objeto do atleta
 * @returns {{ ok: boolean, msg?: string }}
 */
export function validarFederacao(evento, atleta) {
  if (!evento?.apenasAtletasFederados) return { ok: true };
  const cbat = atleta?.cbat || atleta?.numeroCbat || atleta?.nCbat || atleta?.registro || atleta?.numCbat || "";
  if (String(cbat).trim()) return { ok: true };
  return { ok: false, msg: "Esta competição aceita apenas atletas federados (com registro CBAt). Este atleta não possui registro CBAt." };
}

// ─── LIMITE DE PROVAS ────────────────────────────────────────────────────────

/**
 * Retorna o limite de provas individuais para uma categoria num evento.
 *
 * Prioridade de resolução:
 *   1. evento.limitesProvasCat[catId]   → configuração por categoria (nova)
 *   2. evento.limiteProvasIndividual    → limite global (legado)
 *   3. 0                               → sem limite
 *
 * @param {object}      evento  — objeto do evento
 * @param {string|null} catId   — id da categoria (ex: "sub14", "adulto")
 * @returns {number} — 0 significa sem limite
 */
export function getLimiteCat(evento, catId) {
  if (!evento) return 0;
  if (catId) {
    const limCat = evento.limitesProvasCat;
    if (limCat && typeof limCat === "object") {
      const v = limCat[catId];
      if (v != null && v !== "") {
        const n = parseInt(v);
        if (!isNaN(n) && n >= 0) return n;
      }
    }
  }
  return parseInt(evento.limiteProvasIndividual) || 0;
}

/**
 * Valida se inscrever `novasProvas` para `atletaId` viola o limite da categoria.
 *
 * @param {object}   evento      — objeto do evento
 * @param {Array}    inscricoes  — todas as inscrições do sistema
 * @param {string}   atletaId    — id do atleta (null para atleta novo sem id)
 * @param {string}   catId       — id da categoria do atleta
 * @param {string[]} novasProvas — ids das provas que serão inscritas agora
 * @returns {{ ok: boolean, msg?: string, lim: number, inscAtual: number, novasContam: number, restantes: number }}
 */
export function validarLimiteProvas(evento, inscricoes, atletaId, catId, novasProvas) {
  const lim = getLimiteCat(evento, catId);
  const excecoes = new Set(evento?.provasExcetoLimite || []);

  const inscAtual = (atletaId && inscricoes)
    ? inscricoes.filter(
        (i) =>
          i.eventoId === evento.id &&
          i.atletaId === atletaId &&
          !excecoes.has(i.provaId)
      ).length
    : 0;

  const novasContam = (novasProvas || []).filter((pId) => !excecoes.has(pId)).length;
  const restantes   = lim > 0 ? lim - inscAtual - novasContam : Infinity;

  if (lim > 0 && inscAtual + novasContam > lim) {
    return {
      ok: false,
      msg:
        `Limite de ${lim} prova(s) individual(is) por atleta na categoria ${catId || "selecionada"}. ` +
        `Já inscrito: ${inscAtual}` +
        (novasContam > 0 ? `, novas que contam no limite: ${novasContam}` : "") +
        `.`,
      lim,
      inscAtual,
      novasContam,
      restantes: 0,
    };
  }

  return { ok: true, lim, inscAtual, novasContam, restantes };
}

// ─── NORMA 12 CBAt — RESTRIÇÕES SUB-14 ──────────────────────────────────────

/**
 * Valida as restrições da Norma 12, Art. 1ª, § 4º da CBAt para Sub-14.
 *
 * Regras:
 *   1. Máximo 2 provas individuais
 *   2. As 2 devem ser de grupos DIFERENTES (Vel/Barr, Fundo/Marcha, Saltos, Lanç)
 *   3. Se inscrito na combinada (Tetratlo), NÃO pode ter provas individuais (e vice-versa)
 *   4. Revezamento e provas origemCombinada NÃO contam
 *
 * @param {object}   evento      — objeto do evento (precisa de evento.aplicarNorma12Sub14)
 * @param {Array}    inscricoes  — todas as inscrições do sistema
 * @param {string}   atletaId    — id do atleta (null para atleta novo)
 * @param {string}   catId       — id da categoria do atleta
 * @param {string[]} novasProvas — ids das provas sendo inscritas agora
 * @param {Array}    provasRef   — lista de provas disponíveis (para checar tipo)
 * @returns {{ ok: boolean, msg?: string }}
 */
export function validarNorma12Sub14(evento, inscricoes, atletaId, catId, novasProvas, provasRef) {
  if (!evento?.aplicarNorma12Sub14 || catId !== "sub14") return { ok: true };

  const provasMap = new Map((provasRef || []).map(p => [p.id, p]));

  // Inscrições existentes do atleta neste evento (excluir origemCombinada e revezamento)
  const inscExistentes = (atletaId && inscricoes)
    ? inscricoes.filter(i =>
        i.eventoId === evento.id &&
        i.atletaId === atletaId &&
        !i.origemCombinada &&
        i.tipo !== "revezamento" &&
        provasMap.get(i.provaId)?.tipo !== "revezamento"
      )
    : [];

  // Novas provas (excluir revezamento)
  const novasFiltradas = (novasProvas || []).filter(pId => {
    const p = provasMap.get(pId);
    return p && p.tipo !== "revezamento";
  });

  // Juntar existentes + novas
  const todasProvasIds = [
    ...inscExistentes.map(i => i.provaId),
    ...novasFiltradas,
  ];

  // Separar combinada vs individual
  const temCombinada = todasProvasIds.some(pId => isCombinada(pId));
  const individuais  = todasProvasIds.filter(pId => !isCombinada(pId));

  // Regra 3: combinada + individual = erro
  if (temCombinada && individuais.length > 0) {
    return {
      ok: false,
      msg: "Norma 12 CBAt: atleta Sub-14 inscrito na prova combinada (Tetratlo) não pode participar de provas individuais.",
    };
  }

  // Se só tem combinada, ok
  if (temCombinada) return { ok: true };

  // Regra 1: máximo 2 individuais
  if (individuais.length > 2) {
    return {
      ok: false,
      msg: `Norma 12 CBAt: atleta Sub-14 pode participar de no máximo 2 provas individuais (tentando inscrever ${individuais.length}).`,
    };
  }

  // Regra 2: grupos diferentes
  const gruposUsados = new Map();
  for (const pId of individuais) {
    const grupo = getGrupoNorma12(pId);
    if (grupo && gruposUsados.has(grupo)) {
      const nomeGrupo = NOMES_GRUPOS_NORMA12[grupo] || grupo;
      return {
        ok: false,
        msg: `Norma 12 CBAt: atleta Sub-14 não pode ter 2 provas do mesmo grupo "${nomeGrupo}". As provas devem ser de grupos diferentes.`,
      };
    }
    if (grupo) gruposUsados.set(grupo, pId);
  }

  return { ok: true };
}

/**
 * Calcula restrições da Norma 12 para a UI (quais provas bloquear em tempo real).
 *
 * @param {object}   evento            — objeto do evento
 * @param {Array}    inscricoes        — todas as inscrições
 * @param {string}   atletaId          — id do atleta
 * @param {string}   catId             — categoria do atleta
 * @param {string[]} provasSelecionadas — provas selecionadas no formulário (ainda não salvas)
 * @param {Array}    provasDisponiveis — provas disponíveis para seleção
 * @returns {{ desabilitadas: Map<string, string>, temCombinada: boolean, totalIndividuais: number }}
 */
export function getRestricoesNorma12(evento, inscricoes, atletaId, catId, provasSelecionadas, provasDisponiveis) {
  const desabilitadas = new Map();

  if (!evento?.aplicarNorma12Sub14 || catId !== "sub14") {
    return { desabilitadas, temCombinada: false, totalIndividuais: 0 };
  }

  const provasMap = new Map((provasDisponiveis || []).map(p => [p.id, p]));

  // Inscrições já salvas (excluir origemCombinada e revezamento)
  const inscExistentes = (atletaId && inscricoes)
    ? inscricoes.filter(i =>
        i.eventoId === evento.id &&
        i.atletaId === atletaId &&
        !i.origemCombinada &&
        i.tipo !== "revezamento" &&
        provasMap.get(i.provaId)?.tipo !== "revezamento"
      ).map(i => i.provaId)
    : [];

  // Selecionadas no formulário (excluir revezamento)
  const selFiltradas = (provasSelecionadas || []).filter(pId => {
    const p = provasMap.get(pId);
    return p && p.tipo !== "revezamento";
  });

  const todasAtivas = [...inscExistentes, ...selFiltradas];

  const temCombinada = todasAtivas.some(pId => isCombinada(pId));
  const individuais  = todasAtivas.filter(pId => !isCombinada(pId));

  // Grupos já ocupados
  const gruposOcupados = new Set();
  for (const pId of individuais) {
    const g = getGrupoNorma12(pId);
    if (g) gruposOcupados.add(g);
  }

  // Para cada prova disponível, determinar se deve ser bloqueada
  for (const p of (provasDisponiveis || [])) {
    if (p.tipo === "revezamento") continue; // revezamento nunca bloqueado
    const jaAtiva = todasAtivas.includes(p.id);
    if (jaAtiva) continue;

    if (temCombinada && !isCombinada(p.id)) {
      desabilitadas.set(p.id, "Inscrito na combinada (Tetratlo)");
      continue;
    }

    if (!temCombinada && individuais.length > 0 && isCombinada(p.id)) {
      desabilitadas.set(p.id, "Já possui prova(s) individual(is)");
      continue;
    }

    if (!isCombinada(p.id)) {
      if (individuais.length >= 2) {
        desabilitadas.set(p.id, "Limite de 2 provas individuais atingido");
        continue;
      }
      const grupo = getGrupoNorma12(p.id);
      if (grupo && gruposOcupados.has(grupo)) {
        const nomeGrupo = NOMES_GRUPOS_NORMA12[grupo] || grupo;
        desabilitadas.set(p.id, `Grupo "${nomeGrupo}" já selecionado`);
        continue;
      }
    }
  }

  return { desabilitadas, temCombinada, totalIndividuais: individuais.length };
}

// ─── PRECIFICAÇÃO ────────────────────────────────────────────────────────────

/**
 * Formata um valor numérico como moeda BRL.
 * @param {number|null} v
 * @returns {string}
 */
export function formatarPreco(v) {
  if (v == null || isNaN(Number(v))) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Calcula o preço de inscrição para um atleta num evento.
 * O valor retornado é uma TAXA ÚNICA por atleta na competição,
 * independente do número de provas em que ele se inscreveu.
 *
 * Regras (em ordem de prioridade):
 *   1. Se evento.regrasPreco tem uma entrada para catId:
 *      a. Se o equipeId do atleta consta em regra.equipeIds → precoComEquipe
 *      b. Caso contrário (sem equipe OU equipe não selecionada) → precoSemEquipe
 *   2. Fallback: evento.valorInscricao (campo legado, valor global)
 *   3. Sem preço configurado → { preco: null, tipo: "livre" }
 *
 * Importante: "atleta de equipe não selecionada" é tratado igual a "sem equipe".
 *
 * @param {object|null} atleta  — { equipeId, ... } — pode ser null para atleta novo
 * @param {string|null} catId   — categoria do atleta (ex: "sub14", "adulto")
 * @param {object}      evento  — objeto do evento
 * @returns {{
 *   preco: number|null,
 *   tipo: "comEquipe"|"semEquipe"|"global"|"livre",
 *   regra: object|null,
 *   label: string
 * }}
 */
export function calcularPrecoInscricao(atleta, catId, evento) {
  if (!evento) return { preco: null, tipo: "livre", regra: null, label: "Sem preço definido" };

  const regras = evento.regrasPreco;
  if (Array.isArray(regras) && regras.length > 0 && catId) {
    const regra = regras.find((r) => r.catId === catId);
    if (regra) {
      const equipeIds    = Array.isArray(evento.equipeIdsFederados) && evento.equipeIdsFederados.length > 0
        ? evento.equipeIdsFederados
        : (Array.isArray(regra.equipeIds) ? regra.equipeIds : []);
      const atletaEqId   = atleta?.equipeId || null;
      const temEquipeSel = !!(atletaEqId && equipeIds.includes(atletaEqId));
      const temCbat      = !!(atleta?.cbat && String(atleta.cbat).trim() !== "");
      const ehFederado   = temEquipeSel && temCbat;

      if (ehFederado) {
        return {
          preco: regra.precoComEquipe ?? null,
          tipo:  "comEquipe",
          regra,
          label: "Atleta federado",
        };
      } else {
        const motivo = !temEquipeSel && !temCbat ? "sem equipe selecionada e sem registro CBAt"
          : !temEquipeSel ? (atletaEqId ? "equipe não selecionada" : "sem equipe")
          : "sem registro CBAt";
        return {
          preco: regra.precoSemEquipe ?? null,
          tipo:  "semEquipe",
          regra,
          label: `Atleta não federado (${motivo})`,
        };
      }
    }
  }

  // Fallback legado
  const valorLegado = evento.valorInscricao;
  if (valorLegado != null && valorLegado !== "") {
    return {
      preco: typeof valorLegado === "number" ? valorLegado : parseFloat(String(valorLegado).replace(",", ".")) || null,
      tipo:  "global",
      regra: null,
      label: "Valor geral da competição",
    };
  }

  return { preco: null, tipo: "livre", regra: null, label: "Sem preço definido" };
}
