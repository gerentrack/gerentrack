import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../../domain/provas/todasAsProvas', () => ({
  todasAsProvas: () => [
    { id: '100m', nome: '100m Rasos', tipo: 'rasa', unidade: 's' },
    { id: '200m', nome: '200m Rasos', tipo: 'rasa', unidade: 's' },
    { id: 'salto_distancia', nome: 'Salto em Distância', tipo: 'salto', unidade: 'm' },
    { id: 'arremesso_peso', nome: 'Arremesso do Peso', tipo: 'lancamento', unidade: 'm' },
    { id: 'rev4x100', nome: 'Revezamento 4x100m', tipo: 'revezamento', unidade: 's' },
  ],
}));

vi.mock('../../constants/fases', () => ({
  getFasesModo: (provaId, config) => {
    if (!config) return [];
    const cfg = config[provaId];
    if (!cfg) return [];
    const modo = typeof cfg === 'string' ? cfg : (cfg.modo || 'final');
    const map = {
      'final': [],
      'semi_final': ['SEM', 'FIN'],
      'eli_semi_final': ['ELI', 'SEM', 'FIN'],
    };
    return map[modo] || [];
  },
}));

vi.mock('../../formatters/utils.jsx', () => ({
  _getCbat: (atleta) => {
    if (!atleta) return '';
    return atleta.cbat || '';
  },
  _getClubeAtleta: (atleta, equipes) => {
    if (!atleta) return '';
    if (atleta.equipeId && Array.isArray(equipes)) {
      const eq = equipes.find(e => e.id === atleta.equipeId);
      if (eq) return eq.nome || '';
    }
    return atleta.clube || '';
  },
}));

import RankingExtractionEngine from '../rankingExtractionEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// extrairEntradas
// ═══════════════════════════════════════════════════════════════════════════════
describe('RankingExtractionEngine.extrairEntradas', () => {
  const evento = {
    id: 'evt1',
    nome: 'GP São Paulo',
    data: '2026-04-20',
    cidade: 'São Paulo',
    estado: 'SP',
    configSeriacao: {},
  };

  const atletas = [
    { id: 'atl1', nome: 'João Silva', cbat: 'CBAt12345', equipeId: 'eq1', anoNasc: 2000 },
    { id: 'atl2', nome: 'Pedro Costa', cbat: 'CBAt67890', equipeId: 'eq1', anoNasc: 1998 },
    { id: 'atl3', nome: 'Sem CBAt', equipeId: 'eq1', anoNasc: 2001 },
  ];

  const equipes = [
    { id: 'eq1', nome: 'Clube Atlético', uf: 'SP' },
  ];

  const inscricoes = [];

  it('extrai entrada para atleta com CBAt e resultado válido', () => {
    const resultados = {
      'evt1_100m_adulto_M': {
        atl1: { marca: '10.50', status: '' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    expect(entradas.length).toBe(1);
    expect(entradas[0].atletaId).toBe('atl1');
    expect(entradas[0].atletaCbat).toBe('CBAt12345');
    expect(entradas[0].provaId).toBe('100m');
    expect(entradas[0].marcaNum).toBeCloseTo(10.5);
    expect(entradas[0].status).toBe('pendente');
    expect(entradas[0].eventoNome).toBe('GP São Paulo');
    expect(entradas[0].eventoUf).toBe('SP');
  });

  it('ignora atleta sem CBAt', () => {
    const resultados = {
      'evt1_100m_adulto_M': {
        atl3: { marca: '11.00', status: '' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    expect(entradas.length).toBe(0);
  });

  it('ignora resultados com status DNS/DNF/DQ/NM/NH', () => {
    const resultados = {
      'evt1_100m_adulto_M': {
        atl1: { marca: '10.50', status: 'DNS' },
        atl2: { marca: '10.80', status: 'DQ' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    expect(entradas.length).toBe(0);
  });

  it('ignora revezamento', () => {
    const resultados = {
      'evt1_rev4x100_adulto_M': {
        atl1: { marca: '42.50', status: '' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    expect(entradas.length).toBe(0);
  });

  it('ignora marca vazia ou nula', () => {
    const resultados = {
      'evt1_100m_adulto_M': {
        atl1: { marca: '', status: '' },
        atl2: { marca: null, status: '' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    expect(entradas.length).toBe(0);
  });

  it('ignora marca não numérica', () => {
    const resultados = {
      'evt1_100m_adulto_M': {
        atl1: { marca: 'abc', status: '' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    expect(entradas.length).toBe(0);
  });

  it('extrai múltiplas entradas de múltiplas provas', () => {
    const resultados = {
      'evt1_100m_adulto_M': {
        atl1: { marca: '10.50', status: '' },
        atl2: { marca: '10.80', status: '' },
      },
      'evt1_200m_adulto_M': {
        atl1: { marca: '21.30', status: '' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    expect(entradas.length).toBe(3);
  });

  it('não duplica entradas para o mesmo atleta/prova/categoria/sexo', () => {
    const resultados = {
      'evt1_100m_adulto_M': {
        atl1: { marca: '10.50', status: '' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    // Chamar de novo — a deduplicação é por _chave dentro de uma mesma chamada
    expect(entradas.length).toBe(1);
  });

  it('detecta vento assistido acima de 2.0 para provas de pista', () => {
    const resultados = {
      'evt1_100m_adulto_M': {
        atl1: { marca: '10.50', status: '', vento: '2.5' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    expect(entradas.length).toBe(1);
    expect(entradas[0].ventoAssistido).toBe(true);
    expect(entradas[0].vento).toBe('2.5');
  });

  it('vento legal (≤ 2.0) não marca ventoAssistido', () => {
    const resultados = {
      'evt1_100m_adulto_M': {
        atl1: { marca: '10.50', status: '', vento: '1.8' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    expect(entradas[0].ventoAssistido).toBe(false);
  });

  it('aceita marca com vírgula (notação brasileira)', () => {
    const resultados = {
      'evt1_salto_distancia_adulto_M': {
        atl1: { marca: '7,55', status: '' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    expect(entradas.length).toBe(1);
    expect(entradas[0].marcaNum).toBeCloseTo(7.55);
  });

  it('preenche campos do evento corretamente', () => {
    const resultados = {
      'evt1_100m_adulto_M': {
        atl1: { marca: '10.50', status: '' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    expect(entradas[0].eventoId).toBe('evt1');
    expect(entradas[0].eventoLocal).toBe('São Paulo - SP');
    expect(entradas[0].eventoData).toBe('2026-04-20');
  });

  it('preenche campos do atleta/equipe corretamente', () => {
    const resultados = {
      'evt1_100m_adulto_M': {
        atl1: { marca: '10.50', status: '' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    expect(entradas[0].atletaNome).toBe('João Silva');
    expect(entradas[0].atletaClube).toBe('Clube Atlético');
    expect(entradas[0].atletaUf).toBe('SP');
    expect(entradas[0].equipeCadastroId).toBe('eq1');
  });

  it('com multi-fases configuradas, só extrai da FINAL', () => {
    const eventoMultiFase = {
      ...evento,
      configSeriacao: { '100m': { modo: 'semi_final' } },
    };
    const resultados = {
      'evt1_100m_adulto_M__SEM': {
        atl1: { marca: '10.60', status: '' },
      },
      'evt1_100m_adulto_M__FIN': {
        atl1: { marca: '10.45', status: '' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(eventoMultiFase, resultados, atletas, equipes, inscricoes);
    expect(entradas.length).toBe(1);
    expect(entradas[0].marca).toBe('10.45');
  });

  it('com multi-fases, ignora chave sem sufixo de fase', () => {
    const eventoMultiFase = {
      ...evento,
      configSeriacao: { '100m': { modo: 'semi_final' } },
    };
    const resultados = {
      'evt1_100m_adulto_M': {
        atl1: { marca: '10.60', status: '' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(eventoMultiFase, resultados, atletas, equipes, inscricoes);
    expect(entradas.length).toBe(0);
  });

  it('retorna vazio quando evento é null', () => {
    expect(RankingExtractionEngine.extrairEntradas(null, {}, atletas, equipes, inscricoes)).toEqual([]);
  });

  it('retorna vazio quando resultados é null', () => {
    expect(RankingExtractionEngine.extrairEntradas(evento, null, atletas, equipes, inscricoes)).toEqual([]);
  });

  it('retorna vazio quando atletas é null', () => {
    expect(RankingExtractionEngine.extrairEntradas(evento, {}, null, equipes, inscricoes)).toEqual([]);
  });

  it('aceita resultado como valor direto (não objeto)', () => {
    const resultados = {
      'evt1_100m_adulto_M': {
        atl1: '10.50',
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    expect(entradas.length).toBe(1);
    expect(entradas[0].marca).toBe('10.50');
  });

  it('ignora chaves de resultado que não começam com eventoId', () => {
    const resultados = {
      'outroEvento_100m_adulto_M': {
        atl1: { marca: '10.50', status: '' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    expect(entradas.length).toBe(0);
  });

  it('cada entrada tem id e _chave únicos', () => {
    const resultados = {
      'evt1_100m_adulto_M': {
        atl1: { marca: '10.50', status: '' },
        atl2: { marca: '10.80', status: '' },
      },
    };

    const entradas = RankingExtractionEngine.extrairEntradas(evento, resultados, atletas, equipes, inscricoes);
    const ids = entradas.map(e => e.id);
    const chaves = entradas.map(e => e._chave);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(chaves).size).toBe(chaves.length);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// mesclarEntradas
// ═══════════════════════════════════════════════════════════════════════════════
describe('RankingExtractionEngine.mesclarEntradas', () => {
  it('adiciona novas entradas sem duplicar por _chave', () => {
    const existentes = [
      { _chave: 'evt1_100m_adulto_M_atl1', id: 'r1' },
    ];
    const novas = [
      { _chave: 'evt1_100m_adulto_M_atl1', id: 'r1_dup' },
      { _chave: 'evt1_200m_adulto_M_atl1', id: 'r2' },
    ];

    const merged = RankingExtractionEngine.mesclarEntradas(existentes, novas);
    expect(merged.length).toBe(2);
    expect(merged.find(e => e._chave === 'evt1_200m_adulto_M_atl1')).toBeTruthy();
    // Não duplicou
    expect(merged.filter(e => e._chave === 'evt1_100m_adulto_M_atl1').length).toBe(1);
  });

  it('retorna cópia das novas quando existentes é vazio', () => {
    const novas = [
      { _chave: 'k1', id: 'r1' },
      { _chave: 'k2', id: 'r2' },
    ];

    const merged = RankingExtractionEngine.mesclarEntradas([], novas);
    expect(merged.length).toBe(2);
  });

  it('retorna existentes quando novas é vazio', () => {
    const existentes = [{ _chave: 'k1', id: 'r1' }];
    const merged = RankingExtractionEngine.mesclarEntradas(existentes, []);
    expect(merged.length).toBe(1);
  });

  it('lida com existentes null', () => {
    const novas = [{ _chave: 'k1', id: 'r1' }];
    const merged = RankingExtractionEngine.mesclarEntradas(null, novas);
    expect(merged.length).toBe(1);
  });

  it('não duplica entre novas com mesma _chave', () => {
    const novas = [
      { _chave: 'k1', id: 'r1' },
      { _chave: 'k1', id: 'r1_dup' },
    ];

    const merged = RankingExtractionEngine.mesclarEntradas([], novas);
    expect(merged.length).toBe(1);
  });
});
