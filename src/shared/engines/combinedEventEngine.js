/**
 * CombinedEventEngine
 *
 * Gera provas-filha de provas combinadas, inscreve/remove atletas em cascata.
 *
 * Extraído de App.jsx (linhas 710–777) — Etapa 3 da refatoração.
 */

import { getComposicaoCombinada } from '../../domain/combinadas/composicao';

const CombinedEventEngine = {

  // Gera os IDs das provas componentes para uma prova combinada dentro de um evento
  // Retorna array de { id, nome, tipo, unidade, dia, ordem, combinadaId }
  gerarProvasComponentes(combinadaProvaId, eventoId) {
    const comp = getComposicaoCombinada(combinadaProvaId);
    if (!comp) return [];
    return comp.provas.map((p, idx) => ({
      id: `${eventoId}_COMB_${combinadaProvaId}_${idx}_${p.sufixo}`,
      provaOriginalSufixo: p.sufixo,
      nome: p.nome,
      nomeCombinada: comp.nome,
      tipo: p.tipo,
      unidade: p.unidade,
      dia: p.dia,
      ordem: idx + 1,
      totalProvas: comp.totalProvas,
      combinadaId: combinadaProvaId,
      origemCombinada: true,
      grupo: `${comp.nome}`,
    }));
  },

  // Inscreve um atleta em todas as provas componentes de uma combinada
  // Retorna array de inscrições a serem adicionadas
  inscreverAtletaNasComponentes(atletaId, combinadaProvaId, eventoId, dadosBase, provasComponentes) {
    if (!provasComponentes || provasComponentes.length === 0) return [];
    const baseTs = Date.now();
    return provasComponentes.map((pc, idx) => ({
      id: `${eventoId}_${atletaId}_COMB_${pc.id}_${baseTs + idx}`,
      eventoId,
      atletaId,
      provaId: pc.id,
      combinadaId: combinadaProvaId,
      origemCombinada: true,
      categoria: dadosBase.categoria,
      categoriaId: dadosBase.categoriaId,
      categoriaOficial: dadosBase.categoriaOficial,
      categoriaOficialId: dadosBase.categoriaOficialId,
      sexo: dadosBase.sexo,
      data: new Date().toISOString(),
      inscritoPorId: dadosBase.inscritoPorId,
      inscritoPorNome: dadosBase.inscritoPorNome,
      inscritoPorTipo: dadosBase.inscritoPorTipo,
      equipeCadastro: dadosBase.equipeCadastro,
      equipeCadastroId: dadosBase.equipeCadastroId,
      // Metadados da componente
      ordemNaCombinada: pc.ordem,
      nomeCombinada: pc.nomeCombinada,
      provaComponenteNome: pc.nome,
    }));
  },

  // Verifica se uma inscrição é protegida (oriunda de combinada)
  isInscricaoProtegida(inscricao) {
    return inscricao && inscricao.origemCombinada === true;
  },

  // Remove todas as inscrições de componentes quando atleta é removido da combinada
  getInscricoesComponentesParaRemover(inscricoes, atletaId, combinadaProvaId, eventoId) {
    return inscricoes.filter(i =>
      i.eventoId === eventoId &&
      i.atletaId === atletaId &&
      i.combinadaId === combinadaProvaId &&
      i.origemCombinada === true
    ).map(i => i.id);
  },
};

export { CombinedEventEngine };
