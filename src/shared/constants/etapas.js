/**
 * Constantes e helpers de Etapa (sessão de competição)
 *
 * Etapa = sessão do dia (manhã/tarde), calculada automaticamente
 * a partir do horário da prova e do horário da pausa.
 *
 * 1 dia  → 1ª Etapa (Manhã), 2ª Etapa (Tarde)
 * 2 dias → 1ª Etapa (Manhã), 2ª Etapa (Tarde), 3ª Etapa (Manhã), 4ª Etapa (Tarde)
 */

const ETAPA_LABELS = {
  1: "1ª Etapa (Manhã)",
  2: "2ª Etapa (Tarde)",
  3: "3ª Etapa (Manhã)",
  4: "4ª Etapa (Tarde)",
};

/**
 * Calcula o número da etapa (1–4) com base no horário, dia e pausa.
 *
 * @param {string} horario   – "HH:MM" da prova
 * @param {number} dia       – 1 ou 2 (dia da competição)
 * @param {string} pausaHorario – "HH:MM" início da pausa (divisor manhã/tarde)
 * @returns {number|null} 1–4, ou null se dados insuficientes
 */
const calcularEtapa = (horario, dia, pausaHorario) => {
  if (!horario || !pausaHorario) return null;
  const d = (dia || 1);
  const isManha = horario < pausaHorario;
  if (d === 1) return isManha ? 1 : 2;
  return isManha ? 3 : 4;
};

/**
 * Retorna o label completo da etapa (ex: "2ª Etapa (Tarde)")
 * @param {number} etapaNum – 1–4
 * @returns {string} label ou ""
 */
const getEtapaLabel = (etapaNum) => ETAPA_LABELS[etapaNum] || "";

/**
 * Retorna quantidade de etapas do evento.
 * @param {object} evento
 * @param {string} evento.data    – data principal
 * @param {string} evento.dataFim – data fim (opcional)
 * @returns {number} 2 ou 4
 */
const getQtdEtapas = (evento) => {
  if (!evento) return 2;
  return (evento.dataFim && evento.dataFim !== evento.data) ? 4 : 2;
};

export {
  ETAPA_LABELS,
  calcularEtapa,
  getEtapaLabel,
  getQtdEtapas,
};
