/**
 * Constantes e helpers de Fase
 *
 * FASE_SUFIXOS, FASE_ORDEM, FASE_ANTERIOR, FASE_NOME,
 * faseToSufixo, serKey, resKey, getGrupoKey, getFasesProva, getEntradasProva,
 * temMultiFases, buscarSeriacao, buscarResultado
 *
 * Extraído de App.jsx (linhas 2283–2348) — Etapa 3 da refatoração.
 */

import { CATEGORIAS } from "./categorias";

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS DE FASE — Chaves com sufixo por fase
// ═══════════════════════════════════════════════════════════════════════════════

// Mapeamento de nome de fase → sufixo curto
const FASE_SUFIXOS = {
  "Eliminatória": "ELI",
  "Semifinal": "SEM",
  "Semifinal por Tempo": "SEM",
  "Final": "FIN",
  "Final por Tempo": "FIN",
};

// Ordem das fases (para saber qual é anterior)
// ─── GERENTRACK BRANDING DEFAULTS ──────────────────────────────────────────
const GT_DEFAULT_ICON = "data:image/jpeg;base64,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";
const GT_DEFAULT_LOGO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCADwAPADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD7LooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiig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Dn6pTprZP7/+ANwqveS+7/gmOfH3gNrMWhmlNsBtER0i42Y9Nvl4qp/wlfwx/wCfWH/wRTf/ABquo0fxToOrah9h0++86Yo7xny3VJlRgrtG5AWQBiASpOMj1raxTVSmtk/v/wCAJ06j3a+7/gnnk/jr4eW1lLBFaTSwuQzww6HMQ5HTjywCfrXEa18ZJ7Ey2/g34fXsCuebi4sWjB9/LQc/iwr3rFGK3o4mhTd5U+b1l/kkYVsNXqK0anL6R/zZ4H4Q8f8AijWtSW2v/DviHU5ZBgxiDyIVH04AHuxNd4PhnoOpzreappcNvu5a2hb9GYf0/OvQMUVtVzOXNfDx9n6NmNLKo2tiJe09UippWm2GlWSWem2cFpbp92OJAo/Tv71boorzJNyd3uepGKirJaBRRRSGFFFFABXNWvgnRINO1LSsXculahHLHLYSXDGBFlJMgReq5LMevGeMV0tFAHNweDNKWzuYLqbUL97owiae7uWkldIn3pHk/wAAOcjHO5s5zVO1+G3hW10vUdNt7SaO21GBLe6Xz2PmIsjyYJPPJkYH1GB0ArsKKAOY1fwL4fv/AOzRFbnT1055Ht0sgsSAyY3ErtIJOOuM9eea059BsJtZudXYSi8uLEWDOJCNsQZm+UdiS3J9h6VqUUAc5H4O0qCfTZ7Ka/snsLSKyX7PcsglgjOUjkH8QBzzweTzyabaeCNAtfEq+JI4bk6r9olna4a5di5kTYykE7doUIAMcBF9K6WigDm9A8F6Lot/Fd2oupPsyyJZRTztJHZrIcusSn7oOB6kAYGBxVjVvDFhqGvW+uCe+tL+KIQNJa3Bj86INvEbjuu7J7Hk88mtyigDm28FaI2vPqzC6Je7W+a1Nw32c3KqFE2z+8Ao9sgHGeap2nw28K22rJqqWkzXizJP5rzsxLrK8u4jpks/J6kKg6KK7CigDM8S6Hp3iLSjpeqwmezaWKWSLPyyeXIrhW9VJUZHccVl+IfAXhXXdOt9OvtJg+x2scyQQRKI0jMgwzqAOHHOGHIyfWunooA52Xwhpsnia08Qme7F5bW8duMOuxkQsVBBXjl2yVxn8KksfC1hZXOoS2l1qEMN8Znktlum8lJJTukkRf4WLEn0BJIAzW9RQBy+o+BdDvrTRrKf7X9j0dYltoFnIX90VKEnrkFRyCCehyDin2/gjQIPEy+JI4rn+1PNmkkma5c+b5qhWVlJ2lQqoAMDGxfSulooA5zwx4M0fw/cRTWTXsgtoDa2UdxctIlnASpMcQP3V+VOuThVGcDFdHRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQB//2Q==";

const FASE_ORDEM = ["ELI", "SEM", "FIN"];
const FASE_ANTERIOR = { "SEM": "ELI", "FIN": "SEM" };
const FASE_NOME = { "ELI": "Eliminatória", "SEM": "Semifinal", "FIN": "Final" };

// Converte nome de fase para sufixo
const faseToSufixo = (fase) => FASE_SUFIXOS[fase] || "";

// Constrói chave de seriação com ou sem sufixo de fase
// Se faseSufixo é vazio/undefined, retorna chave sem sufixo (backward compat)
const serKey = (provaId, catId, sexo, faseSufixo) =>
  faseSufixo ? `${provaId}_${catId}_${sexo}__${faseSufixo}` : `${provaId}_${catId}_${sexo}`;

// Constrói chave de resultado com ou sem sufixo de fase
const resKey = (eventoId, provaId, catId, sexo, faseSufixo) =>
  faseSufixo ? `${eventoId}_${provaId}_${catId}_${sexo}__${faseSufixo}` : `${eventoId}_${provaId}_${catId}_${sexo}`;

// Extrai fases configuradas para uma prova no programaHorario.
// Suporta dois modos de chave:
//   • Modo detalhado (atual): "M_peso_sub14" → chave inclui catId
//   • Modo agrupado (novo):   "M_peso"       → chave sem catId
// Tenta primeiro a chave exata; se não encontrar, tenta a chave-grupo.
// Retorna array de sufixos: ex. ["ELI","SEM","FIN"] ou ["FIN"] ou []

// Deriva a chave-grupo removendo o catId da provaId (onde quer que ele apareça).
// Usa a mesma lógica de detecção do detalhado: endsWith(_catId) ou includes(_catId_).
// Ex: "M_peso_3kg_sub14" → "M_peso_3kg" | "M_arremessopeso_sub14_3kg" → "M_arremessopeso_3kg"
const getGrupoKey = (provaId) => {
  const cat = CATEGORIAS.find(c =>
    provaId.endsWith(`_${c.id}`) || provaId.includes(`_${c.id}_`)
  );
  if (!cat) return provaId;
  // Remove a primeira ocorrência de _catId (handles tanto fim quanto meio)
  return provaId.replace(`_${cat.id}`, "");
};

const getFasesProva = (provaId, programaHorario) => {
  // Tentativa 1: chave exata (modo detalhado)
  let entries = programaHorario?.[provaId];
  // Tentativa 2: chave agrupada (modo agrupado, sem catId)
  if (!entries || !Array.isArray(entries)) {
    const grupoKey = getGrupoKey(provaId);
    if (grupoKey !== provaId) entries = programaHorario?.[grupoKey];
  }
  if (!entries || !Array.isArray(entries)) return [];
  return entries.map(e => faseToSufixo(e.fase)).filter(Boolean);
};

// Retorna as entradas brutas (array de {fase, horario}) de uma prova,
// resolvendo tanto modo detalhado quanto agrupado.
const getEntradasProva = (provaId, programaHorario) => {
  let entries = programaHorario?.[provaId];
  if (!entries || !Array.isArray(entries)) {
    const grupoKey = getGrupoKey(provaId);
    if (grupoKey !== provaId) entries = programaHorario?.[grupoKey];
  }
  return entries || [];
};

// Verifica se a prova tem múltiplas fases configuradas
const temMultiFases = (provaId, programaHorario) => getFasesProva(provaId, programaHorario).length > 1;

// ── Fases derivadas de configSeriacao.modo (fonte de verdade) ──────────────
// Retrocompat: "final_tempo" → "final", "semifinal_final" → "semi_final"
const _MODO_FASES = {
  "final": [],
  "semi_final": ["SEM", "FIN"],
  "eli_semi_final": ["ELI", "SEM", "FIN"],
  // Legados:
  "final_tempo": [],
  "semifinal_final": ["SEM", "FIN"],
};

/**
 * Retorna fases de uma prova baseado em configSeriacao[provaId].modo.
 * @param {string} provaId
 * @param {object} configSeriacao — eventoAtual.configSeriacao
 * @returns {string[]} ex: ["ELI","SEM","FIN"] ou ["SEM","FIN"] ou []
 */
const getFasesModo = (provaId, configSeriacao) => {
  if (!configSeriacao) return [];
  const cfg = configSeriacao[provaId];
  const modo = !cfg ? "final" : (typeof cfg === "string") ? cfg : (cfg.modo || "final");
  return _MODO_FASES[modo] || [];
};

// Busca seriação com fallback: primeiro tenta com sufixo, depois sem (migração)
const buscarSeriacao = (seriacaoObj, provaId, catId, sexo, faseSufixo) => {
  if (!seriacaoObj) return null;
  // Tenta com sufixo
  if (faseSufixo) {
    const comSufixo = seriacaoObj[serKey(provaId, catId, sexo, faseSufixo)];
    if (comSufixo) return comSufixo;
  }
  // Fallback: sem sufixo (dados legados)
  return seriacaoObj[serKey(provaId, catId, sexo, "")] || null;
};

// Busca resultado com fallback
const buscarResultado = (resultadosObj, eventoId, provaId, catId, sexo, faseSufixo) => {
  if (!resultadosObj) return null;
  if (faseSufixo) {
    const comSufixo = resultadosObj[resKey(eventoId, provaId, catId, sexo, faseSufixo)];
    if (comSufixo) return comSufixo;
  }
  return resultadosObj[resKey(eventoId, provaId, catId, sexo, "")] || null;
};

export { FASE_SUFIXOS, FASE_ORDEM, FASE_ANTERIOR, FASE_NOME, faseToSufixo, serKey, resKey, getGrupoKey, getFasesProva, getFasesModo, getEntradasProva, temMultiFases, buscarSeriacao, buscarResultado };
