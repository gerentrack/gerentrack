import { describe, it, expect } from 'vitest';
import { TeamScoringEngine } from '../teamScoringEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers de teste
// ═══════════════════════════════════════════════════════════════════════════════
const criarAtleta = (id, nome, equipeId, cbat) => ({
  id, nome, equipeId, cbat: cbat || '',
});

const criarEquipe = (id, nome, sigla, estado) => ({
  id, nome, clube: nome, sigla: sigla || '', estado: estado || '',
});

// ═══════════════════════════════════════════════════════════════════════════════
// calcularPontosProva — pontuação individual
// ═══════════════════════════════════════════════════════════════════════════════
describe('TeamScoringEngine.calcularPontosProva', () => {
  const atletas = [
    criarAtleta('a1', 'João', 'eq1'),
    criarAtleta('a2', 'Maria', 'eq2'),
    criarAtleta('a3', 'Pedro', 'eq1'),
    criarAtleta('a4', 'Ana', 'eq3'),
  ];
  const equipes = [
    criarEquipe('eq1', 'Clube A', 'CA'),
    criarEquipe('eq2', 'Clube B', 'CB'),
    criarEquipe('eq3', 'Clube C', 'CC'),
  ];
  const tabelaPadrao = { 1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 };

  it('pontua conforme tabela padrão (8-7-6-5-4-3-2-1)', () => {
    const classificados = [
      { atleta: atletas[0], marca: 10.2 }, // 1º → 8pts
      { atleta: atletas[1], marca: 10.5 }, // 2º → 7pts
      { atleta: atletas[2], marca: 10.8 }, // 3º → 6pts
      { atleta: atletas[3], marca: 11.0 }, // 4º → 5pts
    ];
    const config = { tabelaPontuacao: tabelaPadrao, atletasPorEquipePorProva: 2 };
    const resultado = TeamScoringEngine.calcularPontosProva(classificados, config, atletas, equipes);
    expect(resultado['eq1'].pontos).toBe(8 + 6); // João(8) + Pedro(6)
    expect(resultado['eq2'].pontos).toBe(7);      // Maria(7)
    expect(resultado['eq3'].pontos).toBe(5);      // Ana(5)
  });

  it('respeita limite de atletas por equipe por prova', () => {
    const classificados = [
      { atleta: atletas[0], marca: 10.2 }, // eq1 → 8pts
      { atleta: atletas[2], marca: 10.5 }, // eq1 → deveria ser 7pts mas limite=1
      { atleta: atletas[1], marca: 10.8 }, // eq2 → 6pts
    ];
    const config = { tabelaPontuacao: tabelaPadrao, atletasPorEquipePorProva: 1 };
    const resultado = TeamScoringEngine.calcularPontosProva(classificados, config, atletas, equipes);
    expect(resultado['eq1'].pontos).toBe(8); // só o primeiro
    expect(resultado['eq1'].atletas).toHaveLength(1);
  });

  it('filtra por equipesParticipantes', () => {
    const classificados = [
      { atleta: atletas[0], marca: 10.2 }, // eq1
      { atleta: atletas[1], marca: 10.5 }, // eq2
    ];
    const config = { tabelaPontuacao: tabelaPadrao, equipesParticipantes: ['eq1'] };
    const resultado = TeamScoringEngine.calcularPontosProva(classificados, config, atletas, equipes);
    expect(resultado['eq1']).toBeDefined();
    expect(resultado['eq2']).toBeUndefined();
  });

  it('retorna vazio sem config ou tabela', () => {
    const classificados = [{ atleta: atletas[0], marca: 10.2 }];
    expect(TeamScoringEngine.calcularPontosProva(classificados, null, atletas, equipes)).toEqual({});
    expect(TeamScoringEngine.calcularPontosProva(classificados, {}, atletas, equipes)).toEqual({});
  });

  it('posição sem pontos na tabela → 0, não adiciona', () => {
    const classificados = [
      { atleta: atletas[0], marca: 10.2 }, // pos 1 → 8
      { atleta: atletas[1], marca: 10.5 }, // pos 2 → 7
    ];
    const tabelaCurta = { 1: 5 }; // só 1º recebe pontos
    const config = { tabelaPontuacao: tabelaCurta };
    const resultado = TeamScoringEngine.calcularPontosProva(classificados, config, atletas, equipes);
    expect(resultado['eq1'].pontos).toBe(5);
    expect(resultado['eq2']).toBeUndefined(); // 0 pontos = não adiciona
  });

  it('classificacaoApenasFederados filtra por CBAt e equipe federada', () => {
    const atletasFed = [
      criarAtleta('a1', 'João', 'eq1', '12345'),
      criarAtleta('a2', 'Maria', 'eq2', ''),     // sem CBAt
      criarAtleta('a3', 'Pedro', 'eq1', '67890'),
    ];
    const classificados = [
      { atleta: atletasFed[0], marca: 10.2 },
      { atleta: atletasFed[1], marca: 10.5 }, // sem CBAt → pula
      { atleta: atletasFed[2], marca: 10.8 },
    ];
    const config = {
      tabelaPontuacao: tabelaPadrao,
      atletasPorEquipePorProva: 2,
      classificacaoApenasFederados: true,
      equipeIdsFederados: ['eq1'],
    };
    const resultado = TeamScoringEngine.calcularPontosProva(classificados, config, atletasFed, equipes);
    // a1 → pos federada 1 → 8pts, a3 → pos federada 2 → 7pts
    expect(resultado['eq1'].pontos).toBe(8 + 7);
    expect(resultado['eq2']).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// calcularPontosRevezamento
// ═══════════════════════════════════════════════════════════════════════════════
describe('TeamScoringEngine.calcularPontosRevezamento', () => {
  const atletas = [criarAtleta('a1', 'João', 'eq1')];
  const equipes = [
    criarEquipe('eq1', 'Clube A', 'CA'),
    criarEquipe('eq2', 'Clube B', 'CB'),
  ];

  it('pontua revezamento pela tabela de revezamentos', () => {
    const classificados = [
      { equipeId: 'eq1', marca: 42.5, nomeEquipe: 'Clube A' },
      { equipeId: 'eq2', marca: 43.0, nomeEquipe: 'Clube B' },
    ];
    const config = {
      tabelaPontuacaoRevezamentos: { 1: 10, 2: 8 },
      equipesParticipantes: ['eq1', 'eq2'],
    };
    const resultado = TeamScoringEngine.calcularPontosRevezamento(classificados, config, atletas, equipes);
    expect(resultado['eq1'].pontos).toBe(10);
    expect(resultado['eq2'].pontos).toBe(8);
  });

  it('retorna vazio sem tabela de revezamentos', () => {
    const classificados = [{ equipeId: 'eq1', marca: 42.5 }];
    expect(TeamScoringEngine.calcularPontosRevezamento(classificados, {}, atletas, equipes)).toEqual({});
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// calcularClassificacaoEquipes — integração básica
// ═══════════════════════════════════════════════════════════════════════════════
describe('TeamScoringEngine.calcularClassificacaoEquipes', () => {
  it('retorna vazio quando pontuação não está ativa', () => {
    const evento = { id: 'evt1', pontuacaoEquipes: { ativo: false } };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, [], {}, [], [], [], null
    );
    expect(resultado.classificacao).toEqual([]);
  });

  it('retorna vazio sem config de pontuação', () => {
    const evento = { id: 'evt1' };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, [], {}, [], [], [], null
    );
    expect(resultado.classificacao).toEqual([]);
  });

  it('calcula classificação básica com uma prova simples', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq2'),
      criarAtleta('a3', 'Pedro', 'eq1'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8, 2: 7, 3: 6 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 2,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a3', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': {
        a1: { marca: 10.2 },  // 1º → 8
        a2: { marca: 10.5 },  // 2º → 7
        a3: { marca: 10.8 },  // 3º → 6
      },
    };

    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );

    expect(resultado.classificacao).toHaveLength(2);
    // eq1: João(8) + Pedro(6) = 14
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(14);
    expect(eq1.posicao).toBe(1);
    // eq2: Maria(7) = 7
    const eq2 = resultado.classificacao.find(c => c.equipeId === 'eq2');
    expect(eq2.totalPontos).toBe(7);
    expect(eq2.posicao).toBe(2);
  });

  it('aplica penalidades corretamente', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8, 2: 7 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
        penalidades: [
          { equipeId: 'eq1', pontos: 3, motivo: 'atraso' },
        ],
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': {
        a1: { marca: 10.2 }, // 1º → 8
        a2: { marca: 10.5 }, // 2º → 7
      },
    };

    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );

    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(8 - 3); // 8 pontos - 3 penalidade
    expect(eq1.penalidades).toHaveLength(1);
  });

  it('não pontua prova incompleta (nem todos têm resultado)', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8, 2: 7 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': {
        a1: { marca: 10.2 }, // só 1 de 2 inscritos tem resultado
      },
    };

    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );

    // Prova incompleta → 0 pontos para todos
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(0);
  });

  it('desempate estável: mesmo total → ordem por equipeId', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq_b'),
      criarAtleta('a2', 'Maria', 'eq_a'),
    ];
    const equipes = [
      criarEquipe('eq_a', 'Alfa', 'A'),
      criarEquipe('eq_b', 'Beta', 'B'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 5, 2: 5 }, // mesma pontuação para 1º e 2º
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq_a', 'eq_b'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': {
        a1: { marca: 10.2 },
        a2: { marca: 10.5 },
      },
    };

    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );

    // Ambas com 5 pontos → desempate por equipeId (eq_a < eq_b)
    expect(resultado.classificacao[0].equipeId).toBe('eq_a');
    expect(resultado.classificacao[1].equipeId).toBe('eq_b');
  });

  it('reporta provas pendentes', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA')];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m', 'M_adulto_200m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_200m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': { a1: { marca: 10.2 } },
      // 200m sem resultado → pendente
    };

    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );

    expect(resultado.provasPendentes.length).toBeGreaterThanOrEqual(1);
    const pendente200 = resultado.provasPendentes.find(p => p.provaId === 'M_adulto_200m');
    expect(pendente200).toBeDefined();
  });

  it('filtro por sexo limita provas processadas', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq1'),
    ];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA')];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'F' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': { a1: { marca: 10.2 } },
      'evt1_M_adulto_100m_adulto_F': { a2: { marca: 12.0 } },
    };

    // Filtro M: só conta masculino
    const resultadoM = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], 'M'
    );
    expect(resultadoM.classificacao[0].totalPontos).toBe(8);

    // Filtro F: só conta feminino
    const resultadoF = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], 'F'
    );
    expect(resultadoF.classificacao[0].totalPontos).toBe(8);
  });

  it('pontua revezamento na classificação geral', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_4x100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: { 1: 10, 2: 8 },
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M', tipo: 'revezamento', equipeId: 'eq1' },
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M', tipo: 'revezamento', equipeId: 'eq2' },
    ];
    const resultados = {
      'evt1_M_adulto_4x100m_adulto_M': {
        eq1: { marca: 42.5 },
        eq2: { marca: 43.0 },
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    const eq2 = resultado.classificacao.find(c => c.equipeId === 'eq2');
    expect(eq1.totalPontos).toBe(10);
    expect(eq2.totalPontos).toBe(8);
  });

  it('prova de campo completa com tentativas (t3/t6)', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_comp'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8, 2: 7 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_comp', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_comp', categoriaId: 'adulto', sexo: 'M' },
    ];
    // Prova de campo com tentativas: top8 tem t6, eliminados têm t3
    const resultados = {
      'evt1_M_adulto_comp_adulto_M': {
        a1: { marca: 7.50, t3: '7.20', t6: '7.50' }, // top8
        a2: { marca: 6.80, t3: '6.80' },              // eliminado, só t3
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(8); // 1º lugar
  });

  it('prova de campo incompleta quando falta t3 de um atleta', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_comp'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8, 2: 7 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_comp', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_comp', categoriaId: 'adulto', sexo: 'M' },
    ];
    // a1 tem resultado mas a2 não → prova incompleta
    const resultados = {
      'evt1_M_adulto_comp_adulto_M': {
        a1: { marca: 7.50, t3: '7.20', t6: '7.50' },
        // a2 sem resultado
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    // Prova incompleta → 0 pontos
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(0);
  });

  it('campo com DNS conta como resultado completo para o atleta', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_comp'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_comp', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_comp', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_comp_adulto_M': {
        a1: { marca: 7.50, t3: '7.20', t6: '7.50' },
        a2: { status: 'DNS' }, // DNS conta como completo
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(8);
  });

  it('atleta sem equipe não pontua', () => {
    const atletas = [
      { id: 'a1', nome: 'Sem Equipe' }, // sem equipeId
    ];
    const equipes = [];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: [],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': { a1: { marca: 10.2 } },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    expect(resultado.classificacao).toHaveLength(0);
  });

  it('bônus por quebra de recorde acrescenta pontos', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA', 'SP')];
    const evento = {
      id: 'evt1',
      nome: 'Camp',
      uf: 'SP',
      provasPrograma: ['M_adulto_100m'],
      recordesSumulas: ['rec1'],
      recordesSnapshot: {
        rec1: [{
          provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M',
          marca: '10.50', provaNome: '100 Metros',
        }],
      },
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
        bonusRecordes: { rec1: 5 },
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': { a1: { marca: 10.30 } }, // superou o recorde 10.50
    };
    const recordes = [{
      id: 'rec1', nome: 'RE-SP', sigla: 'RE', escopo: 'estado', estado: 'SP',
      registros: [],
    }];
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, recordes, null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    // 8 pontos da prova + 5 bônus de recorde
    expect(eq1.totalPontos).toBe(13);
    expect(eq1.bonusRecordes).toHaveLength(1);
    expect(resultado.totalBonusRecordes).toBe(1);
  });

  it('equipesParticipantes vazio pré-popula com equipes dos inscritos', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8, 2: 7 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: [], // vazio → detecta equipes automaticamente
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': {
        a1: { marca: 10.2 },
        a2: { marca: 10.5 },
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    expect(resultado.classificacao).toHaveLength(2);
    expect(resultado.classificacao[0].totalPontos).toBe(8);
    expect(resultado.classificacao[1].totalPontos).toBe(7);
  });

  it('resultados com status DNS/DNF/DQ são filtrados da classificação', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': {
        a1: { marca: 10.2 },
        a2: { marca: 'DNS', status: 'DNS' },
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(8); // só a1 pontua
    const eq2 = resultado.classificacao.find(c => c.equipeId === 'eq2');
    expect(eq2.totalPontos).toBe(0); // DNS não pontua
  });

  // ─── COMBINADAS NA CLASSIFICAÇÃO GERAL ───────────────────────────────────
  it('pontua combinada (tetratlo) na classificação geral', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Pedro', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    // Tetratlo sub14 = 4 provas: 60mB, peso, comp, 800m
    const combinadaId = 'M_sub14_tetratlo';
    const evento = {
      id: 'evt1',
      provasPrograma: [combinadaId],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8, 2: 7 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', combinadaId, provaId: combinadaId, categoriaId: 'sub14', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', combinadaId, provaId: combinadaId, categoriaId: 'sub14', sexo: 'M' },
    ];
    // Precisamos resultados em TODAS as 4 provas componentes
    // IDs componentes: evt1_COMB_M_sub14_tetratlo_0_60mB, _1_peso, _2_comp, _3_800m
    const compPrefix = 'evt1_COMB_M_sub14_tetratlo';
    const resultados = {
      [`evt1_${compPrefix}_0_60mB_sub14_M`]: {
        a1: { marca: 9.5 },
        a2: { marca: 10.0 },
      },
      [`evt1_${compPrefix}_1_peso_sub14_M`]: {
        a1: { marca: 10.0 },
        a2: { marca: 9.0 },
      },
      [`evt1_${compPrefix}_2_comp_sub14_M`]: {
        a1: { marca: 5.0 },
        a2: { marca: 4.5 },
      },
      [`evt1_${compPrefix}_3_800m_sub14_M`]: {
        a1: { marca: 140 },
        a2: { marca: 145 },
      },
    };

    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );

    // Ambas equipes devem ter pontuação (combinada completa)
    expect(resultado.classificacao.length).toBeGreaterThanOrEqual(2);
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    const eq2 = resultado.classificacao.find(c => c.equipeId === 'eq2');
    // a1 deve ter mais pontos totais que a2 (melhor em 3 de 4 provas) → eq1 em 1º
    expect(eq1.totalPontos).toBe(8);
    expect(eq2.totalPontos).toBe(7);
  });

  it('combinada incompleta (faltam provas componentes) não pontua', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA')];
    const combinadaId = 'M_sub14_tetratlo';
    const evento = {
      id: 'evt1',
      provasPrograma: [combinadaId],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', combinadaId, provaId: combinadaId, categoriaId: 'sub14', sexo: 'M' },
    ];
    // Só 2 de 4 provas componentes têm resultado → incompleta
    const compPrefix = 'evt1_COMB_M_sub14_tetratlo';
    const resultados = {
      [`evt1_${compPrefix}_0_60mB_sub14_M`]: { a1: { marca: 9.5 } },
      [`evt1_${compPrefix}_1_peso_sub14_M`]: { a1: { marca: 10.0 } },
      // _2_comp e _3_800m faltam
    };

    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );

    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(0); // combinada incompleta → 0
    // Combinada pendente deve aparecer
    expect(resultado.provasPendentes.length).toBeGreaterThanOrEqual(1);
  });

  // ─── REVEZAMENTO COM FEDERADOS NA CLASSIFICAÇÃO ──────────────────────────
  it('revez com classificacaoApenasFederados filtra equipes e verifica CBAt', () => {
    const atletas = [
      criarAtleta('ra1', 'A1', 'eq1', '111'),
      criarAtleta('ra2', 'A2', 'eq1', '222'),
      criarAtleta('ra3', 'A3', 'eq1', '333'),
      criarAtleta('ra4', 'A4', 'eq1', '444'),
      criarAtleta('rb1', 'B1', 'eq2', ''),    // sem CBAt
      criarAtleta('rb2', 'B2', 'eq2', '555'),
      criarAtleta('rb3', 'B3', 'eq2', '666'),
      criarAtleta('rb4', 'B4', 'eq2', '777'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_4x100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: { 1: 10, 2: 8 },
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
        classificacaoApenasFederados: true,
      },
      equipeIdsFederados: ['eq1', 'eq2'],
    };
    const inscricoes = [
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M',
        tipo: 'revezamento', equipeId: 'eq1', atletasIds: ['ra1', 'ra2', 'ra3', 'ra4'] },
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M',
        tipo: 'revezamento', equipeId: 'eq2', atletasIds: ['rb1', 'rb2', 'rb3', 'rb4'] }, // rb1 sem CBAt
    ];
    const resultados = {
      'evt1_M_adulto_4x100m_adulto_M': {
        eq1: { marca: 42.5 },
        eq2: { marca: 43.0 },
      },
    };

    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );

    // eq1: todos com CBAt → pontua (1º federado → 10pts)
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(10);
    // eq2: rb1 sem CBAt → bloqueada pelo filtro de federados → 0pts
    const eq2 = resultado.classificacao.find(c => c.equipeId === 'eq2');
    expect(eq2.totalPontos).toBe(0);
  });

  // ─── DEDUP DE VARIANTES M_/F_ NO REVEZAMENTO ─────────────────────────────
  it('dedup de variantes M_/F_ do revezamento (mesmo nome)', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA')];
    // Ambas variantes têm nome "4x100m" → contam como 1 prova lógica
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_4x100m', 'F_adulto_4x100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: { 1: 10 },
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M', tipo: 'revezamento', equipeId: 'eq1' },
    ];
    const resultados = {
      'evt1_M_adulto_4x100m_adulto_M': { eq1: { marca: 42.5 } },
    };

    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );

    // totalProvas deve contar 4x100m uma vez (dedup por nome)
    expect(resultado.totalProvasComResultado).toBeGreaterThanOrEqual(1);
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(10);
  });

  // ─── ATLETA NÃO ENCONTRADO — FALLBACK POR NOME ───────────────────────────
  it('atleta não encontrado no array busca por nome na inscrição', () => {
    // a1 não está no array de atletas, mas tem inscrição com atletaNome
    const atletas = [];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA')];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: [],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M',
        atletaNome: 'João Fallback', equipeCadastro: 'Clube A', equipeCadastroId: 'eq1' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': { a1: { marca: 10.2 } },
    };

    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );

    // Deve criar atleta temporário e atribuir pontos via equipeCadastroId
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1).toBeDefined();
    expect(eq1.totalPontos).toBe(8);
  });

  // ─── PROVA COM MULTI-FASE (FIN) ──────────────────────────────────────────
  it('prova com multi-fase usa resultado da FIN para pontuação', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      // configSeriacao com fases → ativa o caminho multi-fase
      configSeriacao: { 'M_adulto_100m': { modo: 'eli_semi_final' } },
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8, 2: 7 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      // Resultado da eliminatória (não deve ser usado para pontuação)
      'evt1_M_adulto_100m_adulto_M__ELI': {
        a1: { marca: 10.5 },
        a2: { marca: 10.8 },
      },
      // Resultado da FINAL (deve ser usado)
      'evt1_M_adulto_100m_adulto_M__FIN': {
        a1: { marca: 10.2 },
        a2: { marca: 10.4 },
      },
    };

    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );

    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    const eq2 = resultado.classificacao.find(c => c.equipeId === 'eq2');
    expect(eq1.totalPontos).toBe(8); // 1º na FIN
    expect(eq2.totalPontos).toBe(7); // 2º na FIN
  });

  // ─── REVEZAMENTO INCOMPLETO NÃO PONTUA ───────────────────────────────────
  it('revezamento incompleto (faltam resultados) não pontua', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_4x100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: { 1: 10, 2: 8 },
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M', tipo: 'revezamento', equipeId: 'eq1' },
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M', tipo: 'revezamento', equipeId: 'eq2' },
    ];
    const resultados = {
      'evt1_M_adulto_4x100m_adulto_M': {
        eq1: { marca: 42.5 },
        // eq2 sem resultado → prova incompleta
      },
    };

    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );

    // Prova incompleta → 0 pontos
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(0);
  });

  // ─── PROVA DE CAMPO SEM INSCRIÇÕES MAS COM RESULTADO ─────────────────────
  it('campo sem inscrições marca provaCompleta = true', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA')];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_comp'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
      },
    };
    // Nenhuma inscrição para esta prova/cat/sexo, mas resultado existe
    const inscricoes = [];
    const resultados = {
      'evt1_M_adulto_comp_adulto_M': {
        a1: { marca: 7.50 },
      },
    };

    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );

    // Sem inscrições → provaCompleta = true → pontua mesmo assim
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(8);
  });

  // ─── PENALIDADE MOTIVO DIFERENTE DE "ATRASO" ─────────────────────────────
  it('penalidade com motivo "outro" usa obs', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA')];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
        penalidades: [
          { equipeId: 'eq1', pontos: 2, motivo: 'outro', obs: 'Conduta irregular' },
        ],
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': { a1: { marca: 10.2 } },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(6); // 8 - 2
    expect(eq1.penalidades[0].motivo).toBe('Conduta irregular');
  });

  // ─── PROVA ALTURA/VARA COM TENTATIVAS ─────────────────────────────────────
  it('prova de salto em altura considera t3/t6 para completude', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_altura'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8, 2: 7 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_altura', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_altura', categoriaId: 'adulto', sexo: 'M' },
    ];
    // Altura: não é isCampoTentEng (é salto em altura/vara), usa contagem simples
    const resultados = {
      'evt1_M_adulto_altura_adulto_M': {
        a1: { marca: 2.10 },
        a2: { marca: 2.00 },
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(8);
  });

  // ─── RESULTADO COMO VALOR PRIMITIVO (NÃO OBJETO) ─────────────────────────
  it('resultado como valor primitivo (número direto)', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8, 2: 7 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    // Resultados como valores simples (não objetos)
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': {
        a1: 10.2,
        a2: 10.5,
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(8);
  });

  // ─── RESULTADO COM STATUS COMO STRING DIRETA ──────────────────────────────
  it('resultado com marca como string de status (DNF, NM, NH)', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': {
        a1: { marca: 10.2 },
        a2: { marca: 'DNF' }, // status como string na marca
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(8);
  });

  // ─── BÔNUS RECORDE EM REVEZAMENTO ─────────────────────────────────────────
  it('bônus por quebra de recorde em revezamento', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA', 'SP')];
    const evento = {
      id: 'evt1',
      nome: 'Camp',
      uf: 'SP',
      provasPrograma: ['M_adulto_4x100m'],
      recordesSumulas: ['rec1'],
      recordesSnapshot: {
        rec1: [{
          provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M',
          marca: '43.00', provaNome: '4x100m Revezamento',
        }],
      },
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: { 1: 10 },
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
        bonusRecordes: { rec1: 5 },
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M',
        tipo: 'revezamento', equipeId: 'eq1' },
    ];
    const resultados = {
      'evt1_M_adulto_4x100m_adulto_M': { eq1: { marca: 42.50 } },
    };
    const recordes = [{
      id: 'rec1', nome: 'RE-SP', sigla: 'RE', escopo: 'estado', estado: 'SP',
      registros: [],
    }];
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, recordes, null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    // 10 pontos revezamento + 5 bônus recorde
    expect(eq1.totalPontos).toBe(15);
  });

  // ─── BÔNUS RECORDE IGNORA RESULTADO NÃO-FIN EM MULTI-FASE ────────────────
  it('bônus recorde ignora chave base quando prova tem fases', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA', 'SP')];
    const evento = {
      id: 'evt1',
      nome: 'Camp',
      uf: 'SP',
      provasPrograma: ['M_adulto_100m'],
      configSeriacao: { 'M_adulto_100m': { modo: 'eli_semi_final' } },
      recordesSumulas: ['rec1'],
      recordesSnapshot: {
        rec1: [{
          provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M',
          marca: '10.50', provaNome: '100m Rasos',
        }],
      },
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
        bonusRecordes: { rec1: 5 },
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      // Chave base sem sufixo → dados obsoletos (prova tem fases)
      'evt1_M_adulto_100m_adulto_M': { a1: { marca: 10.00 } },
      // Resultado da FIN
      'evt1_M_adulto_100m_adulto_M__FIN': { a1: { marca: 10.30 } },
    };
    const recordes = [{
      id: 'rec1', nome: 'RE-SP', sigla: 'RE', escopo: 'estado', estado: 'SP',
      registros: [],
    }];
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, recordes, null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    // Bônus deve vir apenas do FIN (10.30 < 10.50 → superou), não da base
    expect(eq1.bonusRecordes).toHaveLength(1);
  });

  // ─── REVEZAMENTO COM RESULTADO INVÁLIDO (marca 0 ou negativa) ─────────────
  it('revezamento com marca 0 é filtrado', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA')];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_4x100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: { 1: 10 },
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M',
        tipo: 'revezamento', equipeId: 'eq1' },
    ];
    const resultados = {
      'evt1_M_adulto_4x100m_adulto_M': {
        eq1: { marca: 0 }, // marca inválida
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(0);
  });

  // ─── REVEZAMENTO COM STATUS DQ ────────────────────────────────────────────
  it('revezamento com status DQ é filtrado da classificação', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_4x100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: { 1: 10, 2: 8 },
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M',
        tipo: 'revezamento', equipeId: 'eq1' },
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M',
        tipo: 'revezamento', equipeId: 'eq2' },
    ];
    const resultados = {
      'evt1_M_adulto_4x100m_adulto_M': {
        eq1: { marca: 42.5 },
        eq2: { marca: 'DQ', status: 'DQ' },
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(10);
  });

  // ─── BÔNUS RECORDE: MARCA NÃO SUPEROU (sem bônus) ────────────────────────
  it('bônus recorde não atribuído quando marca não supera snapshot', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA', 'SP')];
    const evento = {
      id: 'evt1',
      nome: 'Camp',
      uf: 'SP',
      provasPrograma: ['M_adulto_100m'],
      recordesSumulas: ['rec1'],
      recordesSnapshot: {
        rec1: [{
          provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M',
          marca: '10.00', provaNome: '100m Rasos',
        }],
      },
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
        bonusRecordes: { rec1: 5 },
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': { a1: { marca: 10.50 } }, // pior que 10.00
    };
    const recordes = [{
      id: 'rec1', nome: 'RE-SP', sigla: 'RE', escopo: 'estado', estado: 'SP',
      registros: [],
    }];
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, recordes, null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(8); // só prova, sem bônus
    expect(eq1.bonusRecordes).toBeUndefined();
  });

  // ─── CALCULAR PONTOS REVEZAMENTO DIRETO COM FEDERADOS ─────────────────────
  it('calcularPontosRevezamento com classificacaoApenasFederados', () => {
    const atletas = [
      criarAtleta('ra1', 'A1', 'eq1', '111'),
      criarAtleta('ra2', 'A2', 'eq1', '222'),
      criarAtleta('rb1', 'B1', 'eq2', ''),
      criarAtleta('rb2', 'B2', 'eq2', '333'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const classificados = [
      { equipeId: 'eq1', marca: 42.5, nomeEquipe: 'Clube A', atletasIds: ['ra1', 'ra2'] },
      { equipeId: 'eq2', marca: 43.0, nomeEquipe: 'Clube B', atletasIds: ['rb1', 'rb2'] },
    ];
    const config = {
      tabelaPontuacaoRevezamentos: { 1: 10, 2: 8 },
      equipesParticipantes: ['eq1', 'eq2'],
      classificacaoApenasFederados: true,
      equipeIdsFederados: ['eq1', 'eq2'],
    };
    const resultado = TeamScoringEngine.calcularPontosRevezamento(classificados, config, atletas, equipes);
    // eq1: todos com CBAt → posição federada 1 → 10pts
    expect(resultado['eq1'].pontos).toBe(10);
    // eq2: rb1 sem CBAt → bloqueada
    expect(resultado['eq2']).toBeUndefined();
  });

  // ─── REVEZAMENTO COM MULTI-FASE (FIN) ────────────────────────────────────
  it('revezamento com multi-fase usa resultado da FIN', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_4x100m'],
      configSeriacao: { 'M_adulto_4x100m': { modo: 'eli_semi_final' } },
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: { 1: 10, 2: 8 },
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M',
        tipo: 'revezamento', equipeId: 'eq1' },
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M',
        tipo: 'revezamento', equipeId: 'eq2' },
    ];
    const resultados = {
      'evt1_M_adulto_4x100m_adulto_M__ELI': {
        eq1: { marca: 43.0 },
        eq2: { marca: 44.0 },
      },
      'evt1_M_adulto_4x100m_adulto_M__FIN': {
        eq1: { marca: 42.5 },
        eq2: { marca: 43.5 },
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    const eq2 = resultado.classificacao.find(c => c.equipeId === 'eq2');
    expect(eq1.totalPontos).toBe(10);
    expect(eq2.totalPontos).toBe(8);
  });

  // ─── PROVA DE CAMPO COM NM ────────────────────────────────────────────────
  it('prova de campo com status NM conta como resultado completo', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_comp'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_comp', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_comp', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_comp_adulto_M': {
        a1: { marca: 7.50, t3: '7.20', t6: '7.50' },
        a2: { status: 'NM' }, // NM conta como completo
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(8);
  });

  // ─── BÔNUS RECORDE COM DNS → SEM BÔNUS ───────────────────────────────────
  it('bônus recorde ignora atletas com status DNS', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA', 'SP')];
    const evento = {
      id: 'evt1',
      nome: 'Camp',
      uf: 'SP',
      provasPrograma: ['M_adulto_100m'],
      recordesSumulas: ['rec1'],
      recordesSnapshot: {
        rec1: [{
          provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M',
          marca: '10.50', provaNome: '100m Rasos',
        }],
      },
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
        bonusRecordes: { rec1: 5 },
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': { a1: { marca: 'DNS', status: 'DNS' } },
    };
    const recordes = [{
      id: 'rec1', nome: 'RE-SP', sigla: 'RE', escopo: 'estado', estado: 'SP',
      registros: [],
    }];
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, recordes, null
    );
    expect(resultado.totalBonusRecordes).toBe(0);
  });

  // ─── DESEMPATE REVEZAMENTO POR equipeId ───────────────────────────────────
  it('revezamento com marcas iguais desempata por equipeId', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [
      criarEquipe('eq_b', 'Beta', 'B'),
      criarEquipe('eq_a', 'Alfa', 'A'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_4x100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: { 1: 10, 2: 8 },
        equipesParticipantes: ['eq_a', 'eq_b'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M',
        tipo: 'revezamento', equipeId: 'eq_a' },
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M',
        tipo: 'revezamento', equipeId: 'eq_b' },
    ];
    const resultados = {
      'evt1_M_adulto_4x100m_adulto_M': {
        eq_a: { marca: 42.5 },
        eq_b: { marca: 42.5 }, // mesma marca
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    // eq_a < eq_b por localeCompare → eq_a fica em 1º
    const eq_a = resultado.classificacao.find(c => c.equipeId === 'eq_a');
    const eq_b = resultado.classificacao.find(c => c.equipeId === 'eq_b');
    expect(eq_a.totalPontos).toBe(10);
    expect(eq_b.totalPontos).toBe(8);
  });

  // ─── DESEMPATE COMBINADA POR atletaId ─────────────────────────────────────
  it('combinada com pontuação igual desempata por atletaId', () => {
    const atletas = [
      criarAtleta('atl_b', 'Beta', 'eq1'),
      criarAtleta('atl_a', 'Alfa', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube 1', 'C1'),
      criarEquipe('eq2', 'Clube 2', 'C2'),
    ];
    const combinadaId = 'M_sub14_tetratlo';
    const evento = {
      id: 'evt1',
      provasPrograma: [combinadaId],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8, 2: 7 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'atl_b', combinadaId, provaId: combinadaId, categoriaId: 'sub14', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'atl_a', combinadaId, provaId: combinadaId, categoriaId: 'sub14', sexo: 'M' },
    ];
    // Ambos com marcas idênticas → pontuação combinada igual → desempate por atletaId
    const compPrefix = 'evt1_COMB_M_sub14_tetratlo';
    const resultados = {
      [`evt1_${compPrefix}_0_60mB_sub14_M`]: { atl_a: { marca: 9.5 }, atl_b: { marca: 9.5 } },
      [`evt1_${compPrefix}_1_peso_sub14_M`]: { atl_a: { marca: 10.0 }, atl_b: { marca: 10.0 } },
      [`evt1_${compPrefix}_2_comp_sub14_M`]: { atl_a: { marca: 5.0 }, atl_b: { marca: 5.0 } },
      [`evt1_${compPrefix}_3_800m_sub14_M`]: { atl_a: { marca: 140 }, atl_b: { marca: 140 } },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    // atl_a < atl_b por localeCompare → atl_a fica 1º (eq2 = 8pts), atl_b 2º (eq1 = 7pts)
    const eq2 = resultado.classificacao.find(c => c.equipeId === 'eq2');
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq2.totalPontos).toBe(8);
    expect(eq1.totalPontos).toBe(7);
  });

  // ─── PROMOÇÃO DE COMBINAÇÃO (variante com resultado promove pendente) ─────
  it('variante M_/F_ com resultado promove combinação pendente para completa', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq1'),
    ];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA')];
    // Ambas variantes M_ e F_ do 100m no programa — mesmo nome de prova
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m', 'F_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'F_adulto_100m', categoriaId: 'adulto', sexo: 'F' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': { a1: { marca: 10.2 } },
      'evt1_F_adulto_100m_adulto_F': { a2: { marca: 12.5 } },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    // Ambas variantes completas → nenhuma pendente
    expect(resultado.provasPendentes).toHaveLength(0);
    // eq1 pontua em ambas
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(16); // 8 + 8
  });

  // ─── REVEZAMENTO COM SERIAÇÃO FIN ─────────────────────────────────────────
  it('revezamento multi-fase com seriação usa atletas da seriação para completude', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_4x100m'],
      configSeriacao: { 'M_adulto_4x100m': { modo: 'semi_final' } },
      seriacao: {
        'M_adulto_4x100m_adulto_M__FIN': {
          series: [{ numero: 1, atletas: [{ id: 'eq1' }, { id: 'eq2' }] }],
        },
      },
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: { 1: 10, 2: 8 },
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M',
        tipo: 'revezamento', equipeId: 'eq1' },
      { eventoId: 'evt1', provaId: 'M_adulto_4x100m', categoriaId: 'adulto', sexo: 'M',
        tipo: 'revezamento', equipeId: 'eq2' },
    ];
    const resultados = {
      'evt1_M_adulto_4x100m_adulto_M__FIN': {
        eq1: { marca: 42.5 },
        eq2: { marca: 43.0 },
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    const eq2 = resultado.classificacao.find(c => c.equipeId === 'eq2');
    expect(eq1.totalPontos).toBe(10);
    expect(eq2.totalPontos).toBe(8);
  });

  // ─── PENALIDADE COM equipeId INEXISTENTE ──────────────────────────────────
  it('penalidade com equipeId inexistente ou pontos 0 é ignorada', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA')];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
        penalidades: [
          { equipeId: 'eq_inexistente', pontos: 5, motivo: 'atraso' },
          { equipeId: 'eq1', pontos: 0, motivo: 'outro' },
          { equipeId: '', pontos: 3, motivo: 'atraso' },
        ],
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': { a1: { marca: 10.2 } },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    // Nenhuma penalidade aplicada (todas inválidas)
    expect(eq1.totalPontos).toBe(8);
    expect(eq1.penalidades).toBeUndefined();
  });

  // ─── PROVA INDIVIDUAL COM SERIAÇÃO FIN ─────────────────────────────────────
  it('prova individual com seriação FIN usa atletas da seriação para completude', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      configSeriacao: { 'M_adulto_100m': { modo: 'eli_semi_final' } },
      seriacao: {
        'M_adulto_100m_adulto_M__FIN': {
          series: [{ numero: 1, atletas: [{ id: 'a1' }, { id: 'a2' }] }],
        },
      },
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8, 2: 7 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M__FIN': {
        a1: { marca: 10.2 },
        a2: { marca: 10.5 },
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(8);
  });

  // ─── CAMPO INCOMPLETA: ATLETA SEM T3 NEM STATUS ──────────────────────────
  it('campo incompleto quando atleta não tem t3, t6, nem status', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube A', 'CA'),
      criarEquipe('eq2', 'Clube B', 'CB'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_comp'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8, 2: 7 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_comp', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_comp', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_comp_adulto_M': {
        a1: { marca: 7.50, t3: '7.20', t6: '7.50' },
        a2: { marca: 6.00 }, // sem t3, sem t6, sem status → incompleto
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    // Campo incompleto (a2 sem t3) → 0 pontos
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(0);
  });

  // ─── DESEMPATE INDIVIDUAL POR atletaId ────────────────────────────────────
  it('classificação individual com marcas iguais desempata por atletaId', () => {
    const atletas = [
      criarAtleta('atl_b', 'Beta', 'eq1'),
      criarAtleta('atl_a', 'Alfa', 'eq2'),
    ];
    const equipes = [
      criarEquipe('eq1', 'Clube 1', 'C1'),
      criarEquipe('eq2', 'Clube 2', 'C2'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8, 2: 7 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1', 'eq2'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'atl_a', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'atl_b', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': {
        atl_a: { marca: 10.50 },
        atl_b: { marca: 10.50 }, // mesma marca
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    // atl_a < atl_b por localeCompare → eq2 (atl_a) fica 1º com 8pts
    const eq2 = resultado.classificacao.find(c => c.equipeId === 'eq2');
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq2.totalPontos).toBe(8);
    expect(eq1.totalPontos).toBe(7);
  });

  // ─── PROMOÇÃO DE COMBO: variante sem resultado → variante com resultado ──
  it('combo pendente promovido quando segunda variante tem resultado', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq1'),
      criarAtleta('a2', 'Maria', 'eq1'),
    ];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA')];
    // M_ e F_ no programa: ambas com nome "100m Rasos"
    // Inscrevemos atletas em AMBOS com sexo=M, mas resultado só em F_
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m', 'F_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      // Inscrito em M_ com sexo M → não terá resultado
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      // Inscrito em F_ com sexo M (variante) → terá resultado
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'F_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      // Resultado só na variante F_ para sexo M
      'evt1_F_adulto_100m_adulto_M': { a2: { marca: 10.5 } },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    // M_ sem resultado registra combo como pendente.
    // F_ com resultado promove para completa.
    // O totalProvasComResultado deve refletir a promoção.
    expect(resultado.totalProvasComResultado).toBeGreaterThanOrEqual(1);
  });

  // ─── BÔNUS RECORDE: NOME COM PARÊNTESES (strip) ──────────────────────────
  it('bônus recorde matcha nome com parênteses via strip', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA', 'SP')];
    const evento = {
      id: 'evt1',
      nome: 'Camp',
      uf: 'SP',
      provasPrograma: ['M_adulto_100m'],
      recordesSumulas: ['rec1'],
      recordesSnapshot: {
        rec1: [{
          provaId: 'OUTRO_ID_QUE_NAO_MATCHA', // provaId diferente → força match por nome
          categoriaId: 'adulto', sexo: 'M',
          marca: '10.50', provaNome: '100m Rasos (Sub-16)', // nome com parênteses → strip remove "(Sub-16)"
        }],
      },
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
        bonusRecordes: { rec1: 5 },
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': { a1: { marca: 10.30 } },
    };
    const recordes = [{
      id: 'rec1', nome: 'RE-SP', sigla: 'RE', escopo: 'estado', estado: 'SP',
      registros: [],
    }];
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, recordes, null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    // provaId matcha exato, então o strip pode não ser necessário aqui,
    // mas o provaNome com parênteses deve ser stripped para match por nome
    expect(eq1.totalPontos).toBe(13); // 8 + 5 bônus
  });

  // ─── COMBINADA FEMININA PENDENTE ────────────────────────────────────────
  it('combinada feminina pendente aparece em provasPendentes', () => {
    const atletas = [criarAtleta('a1', 'Maria', 'eq1')];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA')];
    const combinadaId = 'F_sub16_pentatlo';
    const evento = {
      id: 'evt1',
      provasPrograma: [combinadaId],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', combinadaId, provaId: combinadaId, categoriaId: 'sub16', sexo: 'F' },
    ];
    // Só 1 de 5 provas componentes tem resultado → pendente
    const compPrefix = 'evt1_COMB_F_sub16_pentatlo';
    const resultados = {
      [`evt1_${compPrefix}_0_80mB_sub16_F`]: { a1: { marca: 12.0 } },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    expect(resultado.provasPendentes.length).toBeGreaterThanOrEqual(1);
    const pend = resultado.provasPendentes.find(p => p.provaId === combinadaId);
    expect(pend).toBeDefined();
    expect(pend.label).toContain('Fem');
    expect(pend.label).toContain('pendente');
  });

  // ─── CLASSIFICAÇÃO GERAL DESEMPATE POR equipeId ───────────────────────────
  it('classificação geral com 3+ equipes, 2 empatadas → desempate por equipeId', () => {
    const atletas = [
      criarAtleta('a1', 'João', 'eq_c'),
      criarAtleta('a2', 'Maria', 'eq_a'),
      criarAtleta('a3', 'Pedro', 'eq_b'),
    ];
    const equipes = [
      criarEquipe('eq_a', 'Alfa', 'A'),
      criarEquipe('eq_b', 'Beta', 'B'),
      criarEquipe('eq_c', 'Gama', 'G'),
    ];
    const evento = {
      id: 'evt1',
      provasPrograma: ['M_adulto_100m'],
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 10, 2: 5, 3: 5 }, // 2º e 3º empatados
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq_a', 'eq_b', 'eq_c'],
        atletasPorEquipePorProva: 1,
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a2', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
      { eventoId: 'evt1', atletaId: 'a3', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': {
        a1: { marca: 10.0 },
        a2: { marca: 10.5 },
        a3: { marca: 10.8 },
      },
    };
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, [], null
    );
    // eq_c = 10pts (1º), eq_a e eq_b empatam com 5pts → desempate por equipeId
    expect(resultado.classificacao[0].equipeId).toBe('eq_c');
    expect(resultado.classificacao[1].equipeId).toBe('eq_a'); // eq_a < eq_b
    expect(resultado.classificacao[2].equipeId).toBe('eq_b');
  });

  // ─── BÔNUS RECORDE: MATCH POR NOME DA PROVA ──────────────────────────────
  it('bônus recorde matcha por provaNome quando provaId difere', () => {
    const atletas = [criarAtleta('a1', 'João', 'eq1')];
    const equipes = [criarEquipe('eq1', 'Clube A', 'CA', 'SP')];
    const evento = {
      id: 'evt1',
      nome: 'Camp',
      uf: 'SP',
      provasPrograma: ['M_adulto_100m'],
      recordesSumulas: ['rec1'],
      recordesSnapshot: {
        rec1: [{
          provaId: 'F_sub16_100m', // provaId diferente
          categoriaId: 'adulto', sexo: 'M',
          marca: '10.50', provaNome: '100m Rasos', // match por nome
        }],
      },
      pontuacaoEquipes: {
        ativo: true,
        tabelaPontuacao: { 1: 8 },
        tabelaPontuacaoRevezamentos: {},
        equipesParticipantes: ['eq1'],
        atletasPorEquipePorProva: 1,
        bonusRecordes: { rec1: 5 },
      },
    };
    const inscricoes = [
      { eventoId: 'evt1', atletaId: 'a1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M' },
    ];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': { a1: { marca: 10.30 } },
    };
    const recordes = [{
      id: 'rec1', nome: 'RE-SP', sigla: 'RE', escopo: 'estado', estado: 'SP',
      registros: [],
    }];
    const resultado = TeamScoringEngine.calcularClassificacaoEquipes(
      evento, inscricoes, resultados, atletas, equipes, recordes, null
    );
    const eq1 = resultado.classificacao.find(c => c.equipeId === 'eq1');
    expect(eq1.totalPontos).toBe(13); // 8 + 5 bônus
    expect(eq1.bonusRecordes).toHaveLength(1);
  });
});
