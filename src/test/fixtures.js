/**
 * Fixtures de dados para testes de componentes.
 * Objetos mock reutilizáveis em múltiplos testes.
 */

export const mockUsuarioAdmin = {
  id: 'admin1',
  nome: 'Admin Teste',
  email: 'admin@gerentrack.com',
  tipo: 'admin',
  organizadorId: null,
  equipeId: null,
  _loginEm: Date.now(),
};

export const mockUsuarioOrganizador = {
  id: 'org1',
  nome: 'Organizador Teste',
  email: 'org@teste.com',
  tipo: 'organizador',
  organizadorId: 'org1',
  equipeId: null,
  entidade: 'Federação de Teste',
  _loginEm: Date.now(),
};

export const mockUsuarioAtleta = {
  id: 'atl1',
  nome: 'Atleta Teste',
  email: 'atleta@teste.com',
  tipo: 'atleta',
  organizadorId: null,
  equipeId: 'eq1',
  _loginEm: Date.now(),
};

export const mockEvento = {
  id: 'evt1',
  nome: 'GP Teste 2026',
  slug: 'gp-teste-2026',
  data: '2026-05-20',
  cidade: 'São Paulo',
  uf: 'SP',
  estado: 'SP',
  local: 'Estádio de Teste',
  status: 'ativo',
  organizadorId: 'org1',
  provas: [],
  configSeriacao: {},
};

export const mockAtleta = {
  id: 'atl1',
  nome: 'João Silva',
  cbat: 'CBAt12345',
  equipeId: 'eq1',
  anoNasc: 2000,
  dataNasc: '2000-03-15',
  genero: 'M',
};

export const mockEquipe = {
  id: 'eq1',
  nome: 'Clube Atlético Teste',
  sigla: 'CAT',
  organizadorId: 'org1',
  uf: 'SP',
  estado: 'SP',
};
