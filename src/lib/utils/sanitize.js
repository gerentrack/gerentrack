/**
 * sanitize.js
 * Remove valores inválidos para o Firestore: undefined, NaN, Infinity.
 * Aplica capitalização automática em campos de nome.
 * Compartilhado por useAtletas, useEquipes, useInscricoes, useResultados.
 */

// Campos que devem ter capitalização automática (primeira letra de cada palavra)
const CAMPOS_NOME = new Set([
  "nome", "nomeUsuario", "nomeEquipe", "atletaNome", "equipeNome",
  "organizadorNome", "responsavelLegal", "nomeAtleta", "nomeCombinada",
  "inscritoPorNome", "equipeSelecionadaNome", "clubeNome",
  "cidade", "local", "clube", "entidade",
]);

// Palavras que não devem ser capitalizadas (preposições/artigos comuns)
const MINUSCULAS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "a", "o", "as", "os",
  "no", "na", "nos", "nas", "ao", "à", "pelo", "pela", "pelos", "pelas",
  "um", "uma", "uns", "umas",
]);

function capitalizarNome(str) {
  if (!str || typeof str !== "string") return str;
  return str
    .trim()
    .toLowerCase()
    .split(" ")
    .map((palavra, idx) => {
      if (!palavra) return palavra;
      // Primeira palavra sempre capitaliza; demais respeitam lista de minúsculas
      if (idx > 0 && MINUSCULAS.has(palavra)) return palavra;
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(" ");
}

export function sanitize(val, key) {
  if (val === undefined || val === null) return null;
  if (typeof val === "number") return isNaN(val) || !isFinite(val) ? null : val;
  if (typeof val === "string") {
    // Aplica capitalização se o campo é um campo de nome
    return key && CAMPOS_NOME.has(key) ? capitalizarNome(val) : val;
  }
  if (typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map(v => sanitize(v));
  const out = {};
  for (const k in val) {
    if (Object.prototype.hasOwnProperty.call(val, k)) {
      out[k] = sanitize(val[k], k);
    }
  }
  return out;
}
