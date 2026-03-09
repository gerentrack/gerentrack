/**
 * inscricaoEngine.js
 * Motor centralizado para validação de limites de provas por categoria
 * e cálculo de preço de inscrição por categoria + situação de equipe.
 *
 * Etapa 2 — GerenTrack
 */

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
      const equipeIds    = Array.isArray(regra.equipeIds) ? regra.equipeIds : [];
      const atletaEqId   = atleta?.equipeId || null;
      const temEquipeSel = !!(atletaEqId && equipeIds.includes(atletaEqId));

      if (temEquipeSel) {
        return {
          preco: regra.precoComEquipe ?? null,
          tipo:  "comEquipe",
          regra,
          label: "Atleta com equipe selecionada",
        };
      } else {
        return {
          preco: regra.precoSemEquipe ?? null,
          tipo:  "semEquipe",
          regra,
          label: atletaEqId
            ? "Atleta de equipe não selecionada (tratado como sem equipe)"
            : "Atleta sem equipe",
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
