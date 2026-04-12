/**
 * EventoContext.jsx
 * Context de competição/evento — substitui props de evento no spread global.
 *
 * Provê: eventoAtual, eventos, inscricoes, resultados, atletas, equipes, etc.
 * Uso: const { eventoAtual, inscricoes, resultados } = useEvento();
 */

import React, { createContext, useContext } from "react";

const EventoContext = createContext(null);

export function EventoProvider({ value, children }) {
  return <EventoContext.Provider value={value}>{children}</EventoContext.Provider>;
}

export function useEvento() {
  const ctx = useContext(EventoContext);
  if (!ctx) throw new Error("useEvento deve ser usado dentro de <EventoProvider>");
  return ctx;
}

/**
 * Extrai as props de evento do objeto props do App.jsx.
 *
 * Props incluídas:
 * - eventos, eventoAtual, eventoAtualId, setEventoAtualId, selecionarEvento
 * - inscricoes, adicionarInscricao, excluirInscricao, atualizarInscricao
 * - resultados, atualizarResultado, atualizarResultadosEmLote, limparResultado, limparTodosResultados
 * - atletas, adicionarAtleta, adicionarAtletasEmLote, atualizarAtleta, excluirAtleta, excluirAtletasEmMassa
 * - equipes, adicionarEquipe, atualizarEquipe, atualizarEquipePerfil
 * - adicionarEvento, editarEvento, atualizarCamposEvento, excluirEvento, alterarStatusEvento
 * - numeracaoPeito, setNumeracaoEvento
 * - recordes, setRecordes, pendenciasRecorde, setPendenciasRecorde
 * - historicoRecordes, setHistoricoRecordes
 * - ranking, setRanking, historicoRanking, setHistoricoRanking
 * - getClubeAtleta
 * - RecordDetectionEngine, RankingExtractionEngine
 */
export function buildEventoValue(props) {
  return {
    eventos: props.eventos,
    eventoAtual: props.eventoAtual,
    eventoAtualId: props.eventoAtualId,
    setEventoAtualId: props.setEventoAtualId,
    selecionarEvento: props.selecionarEvento,

    inscricoes: props.inscricoes,
    adicionarInscricao: props.adicionarInscricao,
    excluirInscricao: props.excluirInscricao,
    atualizarInscricao: props.atualizarInscricao,

    resultados: props.resultados,
    atualizarResultado: props.atualizarResultado,
    atualizarResultadosEmLote: props.atualizarResultadosEmLote,
    limparResultado: props.limparResultado,
    limparTodosResultados: props.limparTodosResultados,

    atletas: props.atletas,
    adicionarAtleta: props.adicionarAtleta,
    adicionarAtletasEmLote: props.adicionarAtletasEmLote,
    atualizarAtleta: props.atualizarAtleta,
    excluirAtleta: props.excluirAtleta,
    excluirAtletasEmMassa: props.excluirAtletasEmMassa,
    solicitarVinculo: props.solicitarVinculo,
    responderVinculo: props.responderVinculo,
    desvincularAtleta: props.desvincularAtleta,

    equipes: props.equipes,
    adicionarEquipe: props.adicionarEquipe,
    atualizarEquipe: props.atualizarEquipe,
    atualizarEquipePerfil: props.atualizarEquipePerfil,
    adicionarEquipeFiliada: props.adicionarEquipeFiliada,
    editarEquipeFiliada: props.editarEquipeFiliada,
    excluirEquipeFiliada: props.excluirEquipeFiliada,
    sincronizarNomesEquipes: props.sincronizarNomesEquipes,

    adicionarEvento: props.adicionarEvento,
    editarEvento: props.editarEvento,
    atualizarCamposEvento: props.atualizarCamposEvento,
    excluirEvento: props.excluirEvento,
    alterarStatusEvento: props.alterarStatusEvento,

    numeracaoPeito: props.numeracaoPeito,
    setNumeracaoEvento: props.setNumeracaoEvento,

    recordes: props.recordes,
    setRecordes: props.setRecordes,
    pendenciasRecorde: props.pendenciasRecorde,
    setPendenciasRecorde: props.setPendenciasRecorde,
    historicoRecordes: props.historicoRecordes,
    setHistoricoRecordes: props.setHistoricoRecordes,

    ranking: props.ranking,
    setRanking: props.setRanking,
    historicoRanking: props.historicoRanking,
    setHistoricoRanking: props.setHistoricoRanking,

    getClubeAtleta: props.getClubeAtleta,
    RecordDetectionEngine: props.RecordDetectionEngine,
    RankingExtractionEngine: props.RankingExtractionEngine,
  };
}
