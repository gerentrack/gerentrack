/**
 * plans.js
 * Definições dos planos de licença da plataforma.
 * Fonte de verdade para IDs, nomes, limites e preços.
 */

export const PLANS = {
  avulso:     { id: "avulso",     nome: "Avulso",     precoMensal: 400,    maxCompeticoes: 1,        renovacao: false },
  trimestral: { id: "trimestral", nome: "Trimestral", precoMensal: 474.90, maxCompeticoes: 3,        renovacao: true  },
  anual:      { id: "anual",      nome: "Anual",      precoMensal: 449.90, maxCompeticoes: Infinity, renovacao: true  },
};

export function getPlanById(planId) {
  return PLANS[planId] || null;
}
