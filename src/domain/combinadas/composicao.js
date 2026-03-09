/**
 * Composição das Provas Combinadas
 *
 * Mapeia cada tipo de prova combinada para suas provas componentes
 * na ordem oficial de competição.
 *
 * Chaves: sufixo do id da prova combinada (ex: "decatlo", "heptatlo")
 * Valores: { nome, sexo?, totalProvas, provas: [{ sufixo, nome, tipo, unidade, dia }] }
 *
 * Tetratlo é especial: tem composição diferente por sexo (provasM / provasF).
 *
 * Extraído de App.jsx (linhas 525–615) — Etapa 2 da refatoração.
 */

export const COMPOSICAO_COMBINADAS = {
  decatlo: {
    nome: "Decatlo",
    sexo: "M",
    totalProvas: 10,
    provas: [
      { sufixo: "100m",   nome: "100m Rasos",              tipo: "rasa",       unidade: "s", dia: 1 },
      { sufixo: "comp",   nome: "Salto em Distância",      tipo: "salto",      unidade: "m", dia: 1 },
      { sufixo: "peso",   nome: "Arremesso do Peso",       tipo: "lancamento", unidade: "m", dia: 1 },
      { sufixo: "altura", nome: "Salto em Altura",         tipo: "salto",      unidade: "m", dia: 1 },
      { sufixo: "400m",   nome: "400m Rasos",              tipo: "rasa",       unidade: "s", dia: 1 },
      { sufixo: "110mB",  nome: "110m c/ Barreiras",       tipo: "barreiras",  unidade: "s", dia: 2 },
      { sufixo: "disco",  nome: "Lançamento do Disco",     tipo: "lancamento", unidade: "m", dia: 2 },
      { sufixo: "vara",   nome: "Salto com Vara",          tipo: "salto",      unidade: "m", dia: 2 },
      { sufixo: "dardo",  nome: "Lançamento do Dardo",     tipo: "lancamento", unidade: "m", dia: 2 },
      { sufixo: "1500m",  nome: "1.500m",                  tipo: "rasa",       unidade: "s", dia: 2 },
    ],
  },

  heptatlo: {
    nome: "Heptatlo",
    sexo: "F",
    totalProvas: 7,
    provas: [
      { sufixo: "100mB",  nome: "100m c/ Barreiras",       tipo: "barreiras",  unidade: "s", dia: 1 },
      { sufixo: "altura", nome: "Salto em Altura",         tipo: "salto",      unidade: "m", dia: 1 },
      { sufixo: "peso",   nome: "Arremesso do Peso",       tipo: "lancamento", unidade: "m", dia: 1 },
      { sufixo: "200m",   nome: "200m Rasos",              tipo: "rasa",       unidade: "s", dia: 1 },
      { sufixo: "comp",   nome: "Salto em Distância",      tipo: "salto",      unidade: "m", dia: 2 },
      { sufixo: "dardo",  nome: "Lançamento do Dardo",     tipo: "lancamento", unidade: "m", dia: 2 },
      { sufixo: "800m",   nome: "800m",                    tipo: "rasa",       unidade: "s", dia: 2 },
    ],
  },

  pentatlo: {
    nome: "Pentatlo",
    sexo: "F",
    totalProvas: 5,
    provas: [
      { sufixo: "80mB",   nome: "80m c/ Barreiras",        tipo: "barreiras",  unidade: "s", dia: 1 },
      { sufixo: "altura", nome: "Salto em Altura",         tipo: "salto",      unidade: "m", dia: 1 },
      { sufixo: "peso",   nome: "Arremesso do Peso",       tipo: "lancamento", unidade: "m", dia: 1 },
      { sufixo: "comp",   nome: "Salto em Distância",      tipo: "salto",      unidade: "m", dia: 1 },
      { sufixo: "800m",   nome: "800m",                    tipo: "rasa",       unidade: "s", dia: 1 },
    ],
  },

  hexatlo: {
    nome: "Hexatlo",
    sexo: "M",
    totalProvas: 6,
    provas: [
      { sufixo: "100mB",  nome: "100m c/ Barreiras",       tipo: "barreiras",  unidade: "s", dia: 1 },
      { sufixo: "altura", nome: "Salto em Altura",         tipo: "salto",      unidade: "m", dia: 1 },
      { sufixo: "peso",   nome: "Arremesso do Peso",       tipo: "lancamento", unidade: "m", dia: 1 },
      { sufixo: "comp",   nome: "Salto em Distância",      tipo: "salto",      unidade: "m", dia: 2 },
      { sufixo: "dardo",  nome: "Lançamento do Dardo",     tipo: "lancamento", unidade: "m", dia: 2 },
      { sufixo: "800m",   nome: "800m",                    tipo: "rasa",       unidade: "s", dia: 2 },
    ],
  },

  tetratlo: {
    nome: "Tetratlo",
    totalProvas: 4,
    // Tetratlo tem composição diferente por sexo
    provasM: [
      { sufixo: "60mB",   nome: "60m c/ Barreiras",        tipo: "barreiras",  unidade: "s", dia: 1 },
      { sufixo: "peso",   nome: "Arremesso do Peso",       tipo: "lancamento", unidade: "m", dia: 1 },
      { sufixo: "comp",   nome: "Salto em Distância",      tipo: "salto",      unidade: "m", dia: 1 },
      { sufixo: "800m",   nome: "800m",                    tipo: "rasa",       unidade: "s", dia: 1 },
    ],
    provasF: [
      { sufixo: "60mB",   nome: "60m c/ Barreiras",        tipo: "barreiras",  unidade: "s", dia: 1 },
      { sufixo: "peso",   nome: "Arremesso do Peso",       tipo: "lancamento", unidade: "m", dia: 1 },
      { sufixo: "comp",   nome: "Salto em Distância",      tipo: "salto",      unidade: "m", dia: 1 },
      { sufixo: "800m",   nome: "800m",                    tipo: "rasa",       unidade: "s", dia: 1 },
    ],
  },
};

/**
 * getComposicaoCombinada
 *
 * Retorna a composição (provas componentes) de uma prova combinada
 * a partir do seu provaId completo.
 *
 * Exemplos:
 *   "M_adulto_decatlo"  → { nome: "Decatlo",  totalProvas: 10, provas: [...] }
 *   "F_sub16_pentatlo"  → { nome: "Pentatlo", totalProvas: 5,  provas: [...] }
 *
 * Retorna null se o sufixo não corresponder a nenhuma combinada conhecida.
 */
export function getComposicaoCombinada(provaId) {
  const partes = provaId.split("_");
  const sexo   = partes[0];                    // "M" ou "F"
  const sufixo = partes[partes.length - 1];    // "decatlo", "heptatlo", etc.

  const comp = COMPOSICAO_COMBINADAS[sufixo];
  if (!comp) return null;

  // Tetratlo usa provasM / provasF dependendo do sexo
  const provas = comp.provas || (sexo === "M" ? comp.provasM : comp.provasF) || [];

  return {
    nome:        comp.nome,
    totalProvas: provas.length,
    provas,
  };
}
