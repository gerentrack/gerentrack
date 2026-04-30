/**
 * Sanitização LGPD para API pública.
 * Mascara dados sensíveis antes de retornar ao consumidor.
 */

function mascaraCpf(cpf) {
  if (!cpf) return null;
  const digits = cpf.replace(/\D/g, '');
  if (digits.length < 4) return null;
  return `***.***.**${digits.slice(-2)}`;
}

function sanitizeAtleta(atleta) {
  if (!atleta) return null;
  const { cpf, data_nasc, ...rest } = atleta;
  return {
    ...rest,
    cpf_masked: mascaraCpf(cpf),
  };
}

module.exports = { mascaraCpf, sanitizeAtleta };
