/**
 * gruposNorma12.js
 * Mapeamento de provas para grupos da Norma 12, Art. 1ª, § 4º — CBAt
 *
 * Aplica-se à categoria Sub-14:
 *   - Máximo 2 provas individuais de grupos DIFERENTES
 *   - OU somente a prova combinada (Tetratlo)
 *   - Revezamento sempre permitido (não conta)
 *
 * Grupos da norma:
 *   1. Velocidade/Barreiras
 *   2. Fundo e Marcha
 *   3. Saltos
 *   4. Lançamentos/Arremesso
 */

// ─── MAPEAMENTO SUFIXO → GRUPO ─────────────────────────────────────────────

/**
 * Mapa de sufixo de provaId → grupo da Norma 12.
 * Cobre sufixos de Sub-14 e Sub-16 (permissividade permite Sub-14 competir em Sub-16).
 */
export const MAPA_GRUPO_NORMA12 = {
  // ── Velocidade/Barreiras ──
  "60m":      "velocidade_barreiras",
  "150m":     "velocidade_barreiras",
  "80mB":     "velocidade_barreiras",
  // Sub-16 (permissividade)
  "75m":      "velocidade_barreiras",
  "250m":     "velocidade_barreiras",
  "100mB":    "velocidade_barreiras",
  "300mB":    "velocidade_barreiras",
  "1500mObs": "velocidade_barreiras",

  // ── Fundo e Marcha ──
  "800m":     "fundo_marcha",
  "1500m":    "fundo_marcha",
  "2kmM":     "fundo_marcha",
  // Sub-16 (permissividade)
  "1000m":    "fundo_marcha",
  "2000m":    "fundo_marcha",
  "5kmM":     "fundo_marcha",

  // ── Saltos ──
  "comp":     "saltos",
  "altura":   "saltos",
  "vara":     "saltos",
  // Sub-16 (permissividade)
  "triplo":   "saltos",

  // ── Lançamentos/Arremesso ──
  "peso":     "lancamentos",
  "disco":    "lancamentos",
  "dardo":    "lancamentos",
  "martelo":  "lancamentos",
};

// ─── NOMES DOS GRUPOS ───────────────────────────────────────────────────────

export const NOMES_GRUPOS_NORMA12 = {
  velocidade_barreiras: "Velocidade/Barreiras",
  fundo_marcha:         "Fundo e Marcha",
  saltos:               "Saltos",
  lancamentos:          "Lançamentos/Arremesso",
};

// ─── FUNÇÕES AUXILIARES ─────────────────────────────────────────────────────

/**
 * Extrai o sufixo de um provaId (parte após sexo_categoria_).
 * Ex: "M_sub14_60m" → "60m", "F_sub16_100mB" → "100mB"
 */
export function getSufixoProva(provaId) {
  if (!provaId) return "";
  const partes = provaId.split("_");
  // formato: SEXO_CATEGORIA_SUFIXO (ex: M_sub14_60m)
  return partes.length >= 3 ? partes.slice(2).join("_") : "";
}

/**
 * Retorna o grupo da Norma 12 para um provaId.
 * Retorna null se não mapeado (revezamento, combinada, ou prova fora do escopo).
 */
export function getGrupoNorma12(provaId) {
  const sufixo = getSufixoProva(provaId);
  return MAPA_GRUPO_NORMA12[sufixo] || null;
}

/**
 * Verifica se um provaId é de prova combinada (Tetratlo para Sub-14).
 */
export function isCombinada(provaId) {
  const sufixo = getSufixoProva(provaId);
  return sufixo === "tetratlo" || sufixo === "hexatlo" || sufixo === "decatlo" || sufixo === "heptatlo" || sufixo === "pentatlo";
}
