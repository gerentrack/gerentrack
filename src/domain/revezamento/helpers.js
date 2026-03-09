/**
 * Helpers de Revezamento
 *
 * Utilitários para inspecionar provas do tipo revezamento:
 *  - nPernasRevezamento: extrai o nº de pernas (4x100m → 4)
 *  - isRevezamentoMisto: detecta se a prova é mista (M+F)
 *
 * Extraído de App.jsx (linhas 510–519) — Etapa 2 da refatoração.
 */

/**
 * Extrai o número de pernas de um revezamento a partir do nome ou id.
 * Exemplos: "4x100m" → 4 | "5x60m" → 5
 * Retorna 4 como padrão caso não encontre o padrão NxDistância.
 */
export function nPernasRevezamento(prova) {
  if (!prova) return 4;
  const m = (prova.nome || prova.id || "").match(/(\d+)x/i);
  return m ? parseInt(m[1]) : 4;
}

/**
 * Verifica se a prova de revezamento é mista (aceita atletas M e F
 * na mesma equipe). Detecta pela presença de "mist" no nome ou id.
 */
export function isRevezamentoMisto(prova) {
  return (prova?.nome || prova?.id || "").toLowerCase().includes("mist");
}
