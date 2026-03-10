/**
 * Categorias de Atletismo
 *
 * CATEGORIAS, getCategoria, getPermissividade, podeCategoriaSuperior
 *
 * Extraído de App.jsx (linhas 2356–2405) — Etapa 3 da refatoração.
 */

const ESTADOS_BR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const CATEGORIAS = [
  { id: "sub14", nome: "Sub-14", minIdade: 11, maxIdade: 13, display: "Sub-14 (11-13 anos)" },
  { id: "sub16", nome: "Sub-16", minIdade: 14, maxIdade: 15, display: "Sub-16 (14-15 anos)" },
  { id: "sub18", nome: "Sub-18", minIdade: 16, maxIdade: 17, display: "Sub-18 (16-17 anos)" },
  { id: "sub20", nome: "Sub-20", minIdade: 18, maxIdade: 19, display: "Sub-20 (18-19 anos)" },
  { id: "sub23", nome: "Sub-23", minIdade: 20, maxIdade: 22, display: "Sub-23 (20-22 anos)" },
  { id: "adulto", nome: "Adulto", minIdade: 23, maxIdade: 99, display: "Adulto (23+ anos)" },
];

function getCategoria(anoNasc, anoCompeticao) {
  const ano = anoCompeticao ? parseInt(anoCompeticao) : new Date().getFullYear();
  const idade = ano - parseInt(anoNasc);
  return CATEGORIAS.find((c) => idade >= c.minIdade && idade <= c.maxIdade) || CATEGORIAS[4];
}

// Verifica se atleta se enquadra na exceção da norma (CBAt) para participar em categoria superior
// Retorna null se não se aplica, ou { catOriginal, catPermitida, obs } se se aplica
// Verifica se atleta é uma EXCEÇÃO permitida para uma prova de categoria específica.
// Regras: a competição aceita atletas da categoria imediatamente inferior:
//   Sub-16 → aceita atletas com 13 anos (Sub-14, categoria abaixo)
//   Sub-18 → aceita atletas com 15 anos (Sub-16, categoria abaixo)
// Parâmetro catProvaId: id da categoria DA PROVA (extraído do provaId: M_sub14_*)
function getPermissividade(anoNasc, anoCompeticao, catProvaId) {
  const ano  = anoCompeticao ? parseInt(anoCompeticao) : new Date().getFullYear();
  const idade = ano - parseInt(anoNasc);
  const catAtleta = getCategoria(anoNasc, anoCompeticao);

  if (catProvaId === "sub16" && catAtleta.id === "sub14")
    return { obs: "* Exceção: atleta Sub-14 (13 anos ou menos) em competição Sub-16." };
  if (catProvaId === "sub18" && catAtleta.id === "sub16")
    return { obs: "* Exceção: atleta Sub-16 em competição Sub-18." };
  return null;
}

// Verifica se atleta 16+ pode competir em categoria superior
function podeCategoriaSuperior(eventoAtual, idadeAtleta, categoriaOficial, categoriaProva) {
  if (!eventoAtual?.permiteSub16CategoriasSup) return false;
  if (idadeAtleta < 16) return false;
  
  // Hierarquia de categorias (da menor para maior)
  const hierarquia = ['sub14', 'sub16', 'sub18', 'sub20', 'sub23', 'adulto'];
  const idxOficial = hierarquia.indexOf(categoriaOficial);
  const idxProva = hierarquia.indexOf(categoriaProva);
  
  // Pode competir se categoria da prova é superior à categoria oficial
  return idxOficial >= 0 && idxProva > idxOficial;
}

export { ESTADOS_BR, CATEGORIAS, getCategoria, getPermissividade, podeCategoriaSuperior };
