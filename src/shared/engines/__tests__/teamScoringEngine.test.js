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
});
