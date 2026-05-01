/**
 * Normaliza nome de pessoa/equipe para Título Case brasileiro.
 *
 * - JOÃO DA SILVA NETO → João da Silva Neto
 * - maria santos → Maria Santos
 * - ASSOCIAÇÃO DOS ATLETAS → Associação dos Atletas
 *
 * Só normaliza se o nome estiver INTEIRO em maiúsculas ou INTEIRO em minúsculas.
 * Se for misto (ex: "João SILVA"), preserva como está (pode ser intencional).
 *
 * Preposições brasileiras ficam em minúscula: de, da, do, dos, das, e.
 */

const PREPOSICOES = new Set(["de", "da", "do", "dos", "das", "e"]);

export function normalizarNome(nome) {
  if (!nome || typeof nome !== "string") return nome;

  const trimmed = nome.trim();
  if (!trimmed) return trimmed;

  // Remover tags HTML (sanitize leve)
  const limpo = trimmed.replace(/<[^>]*>/g, "").trim();

  // Detectar se é tudo maiúsculo ou tudo minúsculo (ignorando espaços e acentos)
  const letras = limpo.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (!letras) return limpo;

  const tudoMaiusculo = letras === letras.toUpperCase();
  const tudoMinusculo = letras === letras.toLowerCase();

  if (!tudoMaiusculo && !tudoMinusculo) return limpo; // misto → preservar

  return limpo
    .toLowerCase()
    .split(/\s+/)
    .map((palavra, idx) => {
      if (idx > 0 && PREPOSICOES.has(palavra)) return palavra;
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(" ");
}
