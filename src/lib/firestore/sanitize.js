/**
 * sanitizeForFirestore
 *
 * Firestore rejeita valores undefined, NaN e Infinity.
 * Esta função percorre recursivamente o valor e substitui
 * todos esses valores inválidos por null antes de persistir.
 *
 * Extraído de App.jsx (linha 12) — Etapa 1 da refatoração.
 */
export function sanitizeForFirestore(val) {
  if (val === undefined || val === null) return null;
  if (typeof val === "number") return (isNaN(val) || !isFinite(val)) ? null : val;
  if (typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map(sanitizeForFirestore);

  const out = {};
  for (const k in val) {
    if (Object.prototype.hasOwnProperty.call(val, k)) {
      out[k] = sanitizeForFirestore(val[k]);
    }
  }
  return out;
}
