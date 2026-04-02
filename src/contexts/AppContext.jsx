/**
 * AppContext.jsx
 * Context geral da aplicação — tudo que não é auth nem evento.
 *
 * Provê: navegação, notificações, auditoria, branding, organizadores, etc.
 * Uso: const { notificacoes, registrarAcao, organizadores } = useApp();
 */

import React, { createContext, useContext } from "react";

const AppContext = createContext(null);

export function AppProvider({ value, children }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de <AppProvider>");
  return ctx;
}

/**
 * Extrai as props gerais do objeto props do App.jsx.
 *
 * Props incluídas:
 * - tela, setTela (temporário — será removido quando React Router assumir)
 * - temaClaro, setTemaClaro
 * - notificacoes, adicionarNotificacao, marcarNotifLida
 * - historicoAcoes, registrarAcao
 * - organizadores, organizadorPerfilId, setOrganizadorPerfilId, selecionarOrganizador
 * - atletasUsuarios, adicionarAtletaUsuario, atualizarAtletaUsuario
 * - funcionarios, adicionarFuncionario, atualizarFuncionario, removerFuncionario
 * - treinadores, adicionarTreinador, atualizarTreinador, removerTreinador
 * - solicitacoesEquipe, adicionarSolicitacaoEquipe, aprovarEquipe, recusarEquipe
 * - solicitacoesVinculo
 * - solicitacoesPortabilidade, etc.
 * - solicitacoesRelatorio, etc.
 * - branding: siteBranding, setSiteBranding, gtIcon, gtLogo, gtNome, gtSlogan
 * - online, pendentesOffline
 * - exportarDados, importarDados, limparTodosDados
 */
export function buildAppValue(props) {
  return {
    // Navegação (temporário)
    tela: props.tela,
    setTela: props.setTela,

    // Tema
    temaClaro: props.temaClaro,
    setTemaClaro: props.setTemaClaro,

    // Notificações
    notificacoes: props.notificacoes,
    adicionarNotificacao: props.adicionarNotificacao,
    marcarNotifLida: props.marcarNotifLida,

    // Auditoria
    historicoAcoes: props.historicoAcoes,
    registrarAcao: props.registrarAcao,

    // Organizadores
    organizadores: props.organizadores,
    organizadorPerfilId: props.organizadorPerfilId,
    setOrganizadorPerfilId: props.setOrganizadorPerfilId,
    selecionarOrganizador: props.selecionarOrganizador,
    adicionarOrganizador: props.adicionarOrganizador,
    editarOrganizadorAdmin: props.editarOrganizadorAdmin,
    excluirOrganizador: props.excluirOrganizador,
    excluirDadosOrganizador: props.excluirDadosOrganizador,
    aprovarOrganizador: props.aprovarOrganizador,
    recusarOrganizador: props.recusarOrganizador,
    aprovarEvento: props.aprovarEvento,
    recusarEvento: props.recusarEvento,

    // Atletas usuários
    atletasUsuarios: props.atletasUsuarios,
    adicionarAtletaUsuario: props.adicionarAtletaUsuario,
    atualizarAtletaUsuario: props.atualizarAtletaUsuario,
    excluirAtletaUsuario: props.excluirAtletaUsuario,
    excluirAtletaPorUsuario: props.excluirAtletaPorUsuario,

    // Equipes admin
    editarEquipeAdmin: props.editarEquipeAdmin,
    editarAtletaUsuarioAdmin: props.editarAtletaUsuarioAdmin,
    excluirEquipeUsuario: props.excluirEquipeUsuario,

    // Funcionários
    funcionarios: props.funcionarios,
    adicionarFuncionario: props.adicionarFuncionario,
    atualizarFuncionario: props.atualizarFuncionario,
    removerFuncionario: props.removerFuncionario,

    // Treinadores
    treinadores: props.treinadores,
    adicionarTreinador: props.adicionarTreinador,
    atualizarTreinador: props.atualizarTreinador,
    removerTreinador: props.removerTreinador,

    // Solicitações
    solicitacoesEquipe: props.solicitacoesEquipe,
    adicionarSolicitacaoEquipe: props.adicionarSolicitacaoEquipe,
    aprovarEquipe: props.aprovarEquipe,
    recusarEquipe: props.recusarEquipe,
    solicitacoesVinculo: props.solicitacoesVinculo,
    solicitacoesPortabilidade: props.solicitacoesPortabilidade,
    adicionarSolicitacaoPortabilidade: props.adicionarSolicitacaoPortabilidade,
    resolverSolicitacaoPortabilidade: props.resolverSolicitacaoPortabilidade,
    excluirSolicitacaoPortabilidade: props.excluirSolicitacaoPortabilidade,
    solicitacoesRelatorio: props.solicitacoesRelatorio,
    solicitarRelatorio: props.solicitarRelatorio,
    resolverRelatorio: props.resolverRelatorio,
    cancelarRelatorio: props.cancelarRelatorio,
    excluirRelatorio: props.excluirRelatorio,

    // Editor de atleta/evento (state de navegação)
    atletaEditandoId: props.atletaEditandoId,
    setAtletaEditandoId: props.setAtletaEditandoId,
    cadEventoGoStep: props.cadEventoGoStep,
    setCadEventoGoStep: props.setCadEventoGoStep,

    // Branding
    siteBranding: props.siteBranding,
    setSiteBranding: props.setSiteBranding,
    gtIcon: props.gtIcon,
    gtLogo: props.gtLogo,
    gtNome: props.gtNome,
    gtSlogan: props.gtSlogan,

    // Sistema
    online: props.online,
    pendentesOffline: props.pendentesOffline,
    exportarDados: props.exportarDados,
    importarDados: props.importarDados,
    limparTodosDados: props.limparTodosDados,
  };
}
