/**
 * sanitize.js
 * Remove valores inválidos para o Firestore: undefined, NaN, Infinity.
 * Compartilhado por useAtletas, useEquipes, useInscricoes, useResultados.
 */

export function sanitize(val) {
  if (val === undefined || val === null) return null;
  if (typeof val === "number") return isNaN(val) || !isFinite(val) ? null : val;
  if (typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map(sanitize);
  const out = {};
  for (const k in val) {
    if (Object.prototype.hasOwnProperty.call(val, k)) {
      out[k] = sanitize(val[k]);
    }
  }
  return out;
}
