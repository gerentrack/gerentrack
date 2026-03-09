/**
 * todasAsProvas
 *
 * Retorna um array com todas as provas únicas do sistema,
 * deduplificadas por id. Usado em súmulas e resultados para
 * montar índices de busca rápida (provaId → provaObj).
 *
 * O objeto resultante é estático — criado uma única vez fora
 * do ciclo de render para evitar recriação desnecessária.
 *
 * Extraído de App.jsx (linha 498) — Etapa 2 da refatoração.
 */
import PROVAS_DEF from "./provasDef.json";

function _buildTodasAsProvas() {
  const map = {};
  Object.values(PROVAS_DEF).forEach((cats) => {
    Object.values(cats).forEach((provas) => {
      provas.forEach((p) => { map[p.id] = p; });
    });
  });
  return Object.values(map);
}

// Singleton — calculado uma única vez no import
const _cache = _buildTodasAsProvas();

export function todasAsProvas() {
  return _cache;
}
