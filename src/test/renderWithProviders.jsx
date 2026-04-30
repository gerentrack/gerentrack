/**
 * renderWithProviders — utilitário para testes de componentes.
 *
 * Wrappa o componente nos 4 providers do GERENTRACK com valores
 * mock configuráveis. Testes só precisam passar os campos relevantes.
 *
 * Uso:
 *   renderWithProviders(<TelaLogin />, {
 *     authValue: { usuarioLogado: mockUsuario },
 *   });
 */
import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { EventoProvider } from '../contexts/EventoContext';
import { AppProvider } from '../contexts/AppContext';
import { AdminConfigProvider } from '../contexts/AdminConfigContext';
import { TemaProvider } from '../shared/TemaContext';

export const defaultAuthValue = {
  usuarioLogado: null,
  setUsuarioLogado: vi.fn(),
  login: vi.fn(),
  loginComSelecao: vi.fn(),
  logout: vi.fn(),
  perfisDisponiveis: [],
  setPerfisDisponiveis: vi.fn(),
  gerarSenhaTemp: vi.fn(),
  aplicarSenhaTemp: vi.fn(),
  atualizarSenha: vi.fn(),
  solicitacoesRecuperacao: [],
  adicionarSolicitacaoRecuperacao: vi.fn(),
  resolverSolicitacaoRecuperacao: vi.fn(),
};

export const defaultEventoValue = {
  eventos: [],
  eventoAtual: null,
  eventoAtualId: null,
  setEventoAtualId: vi.fn(),
  selecionarEvento: vi.fn(),
  inscricoes: [],
  adicionarInscricao: vi.fn(),
  excluirInscricao: vi.fn(),
  atualizarInscricao: vi.fn(),
  resultados: {},
  atualizarResultado: vi.fn(),
  atualizarResultadosEmLote: vi.fn(),
  limparResultado: vi.fn(),
  limparTodosResultados: vi.fn(),
  atletas: [],
  adicionarAtleta: vi.fn(),
  adicionarAtletasEmLote: vi.fn(),
  atualizarAtleta: vi.fn(),
  excluirAtleta: vi.fn(),
  excluirAtletasEmMassa: vi.fn(),
  solicitarVinculo: vi.fn(),
  responderVinculo: vi.fn(),
  desvincularAtleta: vi.fn(),
  equipes: [],
  adicionarEquipe: vi.fn(),
  atualizarEquipe: vi.fn(),
  atualizarEquipePerfil: vi.fn(),
  adicionarEquipeFiliada: vi.fn(),
  editarEquipeFiliada: vi.fn(),
  excluirEquipeFiliada: vi.fn(),
  sincronizarNomesEquipes: vi.fn(),
  adicionarEvento: vi.fn(),
  editarEvento: vi.fn(),
  atualizarCamposEvento: vi.fn(),
  excluirEvento: vi.fn(),
  alterarStatusEvento: vi.fn(),
  numeracaoPeito: {},
  setNumeracaoEvento: vi.fn(),
  recordes: [],
  setRecordes: vi.fn(),
  pendenciasRecorde: [],
  setPendenciasRecorde: vi.fn(),
  historicoRecordes: [],
  setHistoricoRecordes: vi.fn(),
  ranking: [],
  setRanking: vi.fn(),
  historicoRanking: [],
  setHistoricoRanking: vi.fn(),
  getClubeAtleta: vi.fn(() => ''),
  RecordDetectionEngine: {},
  RankingExtractionEngine: {},
};

export const defaultAppValue = {
  temaClaro: false,
  setTemaClaro: vi.fn(),
  notificacoes: [],
  adicionarNotificacao: vi.fn(),
  marcarNotifLida: vi.fn(),
  historicoAcoes: [],
  registrarAcao: vi.fn(),
  organizadores: [],
  organizadorPerfilId: null,
  setOrganizadorPerfilId: vi.fn(),
  selecionarOrganizador: vi.fn(),
  adicionarOrganizador: vi.fn(),
  editarOrganizadorAdmin: vi.fn(),
  excluirOrganizador: vi.fn(),
  excluirDadosOrganizador: vi.fn(),
  aprovarOrganizador: vi.fn(),
  recusarOrganizador: vi.fn(),
  atletasUsuarios: [],
  adicionarAtletaUsuario: vi.fn(),
  atualizarAtletaUsuario: vi.fn(),
  excluirAtletaUsuario: vi.fn(),
  excluirAtletaPorUsuario: vi.fn(),
  editarEquipeAdmin: vi.fn(),
  editarAtletaUsuarioAdmin: vi.fn(),
  excluirEquipeUsuario: vi.fn(),
  funcionarios: [],
  adicionarFuncionario: vi.fn(),
  atualizarFuncionario: vi.fn(),
  removerFuncionario: vi.fn(),
  treinadores: [],
  adicionarTreinador: vi.fn(),
  atualizarTreinador: vi.fn(),
  removerTreinador: vi.fn(),
  solicitacoesEquipe: [],
  adicionarSolicitacaoEquipe: vi.fn(),
  aprovarEquipe: vi.fn(),
  recusarEquipe: vi.fn(),
  solicitacoesVinculo: [],
  solicitacoesPortabilidade: [],
  adicionarSolicitacaoPortabilidade: vi.fn(),
  resolverSolicitacaoPortabilidade: vi.fn(),
  excluirSolicitacaoPortabilidade: vi.fn(),
  solicitacoesRelatorio: [],
  solicitarRelatorio: vi.fn(),
  resolverRelatorio: vi.fn(),
  cancelarRelatorio: vi.fn(),
  excluirRelatorio: vi.fn(),
  atletaEditandoId: null,
  setAtletaEditandoId: vi.fn(),
  cadEventoGoStep: null,
  setCadEventoGoStep: vi.fn(),
  siteBranding: {},
  setSiteBranding: vi.fn(),
  gtIcon: '',
  gtLogo: '',
  gtNome: 'GERENTRACK',
  gtSlogan: '',
  online: true,
  pendentesOffline: 0,
  exportarDados: vi.fn(),
  importarDados: vi.fn(),
  limparTodosDados: vi.fn(),
};

export const defaultAdminConfigValue = {
  adminConfig: {},
  setAdminConfig: vi.fn(),
};

export function renderWithProviders(ui, {
  authValue = {},
  eventoValue = {},
  appValue = {},
  adminConfigValue = {},
  temaClaro = false,
  initialRoute = "/",
} = {}) {
  const mergedAuth = { ...defaultAuthValue, ...authValue };
  const mergedEvento = { ...defaultEventoValue, ...eventoValue };
  const mergedApp = { ...defaultAppValue, ...appValue };
  const mergedAdminConfig = { ...defaultAdminConfigValue, ...adminConfigValue };

  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[initialRoute]}>
        <TemaProvider temaClaro={temaClaro}>
          <AuthProvider value={mergedAuth}>
            <EventoProvider value={mergedEvento}>
              <AppProvider value={mergedApp}>
                <AdminConfigProvider value={mergedAdminConfig}>
                  {children}
                </AdminConfigProvider>
              </AppProvider>
            </EventoProvider>
          </AuthProvider>
        </TemaProvider>
      </MemoryRouter>
    );
  }

  return { ...render(ui, { wrapper: Wrapper }), authValue: mergedAuth, eventoValue: mergedEvento, appValue: mergedApp };
}
