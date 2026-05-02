import { describe, it, expect } from 'vitest';
import {
  WA_SCORING_CONSTANTS,
  CBAT_TABLES,
  COMBINED_SCORING_MAP,
  resolverScoringMap,
  temDuasCronometragens,
  CombinedScoringEngine,
} from '../combinedScoringEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// WA_SCORING_CONSTANTS — constantes válidas
// ═══════════════════════════════════════════════════════════════════════════════
describe('WA_SCORING_CONSTANTS', () => {
  it('contém constantes para provas masculinas e femininas', () => {
    expect(WA_SCORING_CONSTANTS['men|100m']).toBeDefined();
    expect(WA_SCORING_CONSTANTS['women|100mH']).toBeDefined();
    expect(WA_SCORING_CONSTANTS['men|Long Jump']).toBeDefined();
    expect(WA_SCORING_CONSTANTS['women|High Jump']).toBeDefined();
  });

  it('cada constante tem a, b, c e tipo', () => {
    Object.entries(WA_SCORING_CONSTANTS).forEach(([key, val]) => {
      expect(val).toHaveProperty('a');
      expect(val).toHaveProperty('b');
      expect(val).toHaveProperty('c');
      expect(val.tipo).toMatch(/^(track|jump|throw)$/);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// calcularPontosProva — Fórmula WA
// ═══════════════════════════════════════════════════════════════════════════════
describe('CombinedScoringEngine.calcularPontosProva — fórmula WA', () => {
  it('100m masculino: 10.395s → 1000 pontos (referência WA)', () => {
    // Fórmula: floor(25.4347 × (18 - 10.395)^1.81) = ~1000
    const pts = CombinedScoringEngine.calcularPontosProva('100m', 10.395, 'M', 'M_adulto_decatlo');
    expect(pts).toBeGreaterThanOrEqual(995);
    expect(pts).toBeLessThanOrEqual(1005);
  });

  it('100m masculino: tempo pior que baseline → 0 pontos', () => {
    // baseline b=18 → tempo ≥18s dá 0
    const pts = CombinedScoringEngine.calcularPontosProva('100m', 19.0, 'M', 'M_adulto_decatlo');
    expect(pts).toBe(0);
  });

  it('salto em comprimento masculino: 7.76m → ~1000 pontos', () => {
    // WA: a=0.14354, b=220cm, c=1.4 → floor(0.14354 × (776 - 220)^1.4) ≈ 1000
    const pts = CombinedScoringEngine.calcularPontosProva('comp', 7.76, 'M', 'M_adulto_decatlo');
    expect(pts).toBeGreaterThanOrEqual(990);
    expect(pts).toBeLessThanOrEqual(1010);
  });

  it('arremesso de peso masculino: 18.4m → ~1000 pontos', () => {
    const pts = CombinedScoringEngine.calcularPontosProva('peso', 18.4, 'M', 'M_adulto_decatlo');
    expect(pts).toBeGreaterThanOrEqual(980);
    expect(pts).toBeLessThanOrEqual(1020);
  });

  it('valor null ou NaN → 0 pontos', () => {
    expect(CombinedScoringEngine.calcularPontosProva('100m', null, 'M', 'M_adulto_decatlo')).toBe(0);
    expect(CombinedScoringEngine.calcularPontosProva('100m', NaN, 'M', 'M_adulto_decatlo')).toBe(0);
  });

  it('heptatlo feminino 100mB: 13.85s → ~900 pontos', () => {
    const pts = CombinedScoringEngine.calcularPontosProva('100mB', 13.85, 'F', 'F_adulto_heptatlo');
    expect(pts).toBeGreaterThan(800);
    expect(pts).toBeLessThan(1100);
  });

  it('salto em altura feminino heptatlo: 1.82m → ~1000 pontos', () => {
    const pts = CombinedScoringEngine.calcularPontosProva('altura', 1.82, 'F', 'F_adulto_heptatlo');
    expect(pts).toBeGreaterThan(900);
    expect(pts).toBeLessThan(1100);
  });

  it('cronometragem manual adiciona 0.24s para pista', () => {
    const ptsEle = CombinedScoringEngine.calcularPontosProva('100m', 11.0, 'M', 'M_adulto_decatlo', 'ELE');
    const ptsMan = CombinedScoringEngine.calcularPontosProva('100m', 11.0, 'M', 'M_adulto_decatlo', 'MAN');
    // MAN adiciona 0.24s → tempo efetivo 11.24 → menos pontos
    expect(ptsMan).toBeLessThan(ptsEle);
  });

  it('milissegundos convertidos automaticamente (heurística >100)', () => {
    // 11000ms → 11.0s
    const ptsMs = CombinedScoringEngine.calcularPontosProva('100m', 11000, 'M', 'M_adulto_decatlo');
    const ptsSeg = CombinedScoringEngine.calcularPontosProva('100m', 11.0, 'M', 'M_adulto_decatlo');
    expect(ptsMs).toBe(ptsSeg);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CBAT_TABLES — lookup por tabela
// ═══════════════════════════════════════════════════════════════════════════════
describe('CombinedScoringEngine.calcularPontosProva — tabelas CBAt', () => {
  it('hexatlo masculino sub16 100mB (ELE): 12.6s → 1000 pontos', () => {
    const pts = CombinedScoringEngine.calcularPontosProva('100mB', 12.6, 'M', 'M_sub16_hexatlo', 'ELE');
    expect(pts).toBe(1000);
  });

  it('hexatlo masculino sub16 100mB (ELE): 20.24s → 1 ponto', () => {
    const pts = CombinedScoringEngine.calcularPontosProva('100mB', 20.24, 'M', 'M_sub16_hexatlo', 'ELE');
    expect(pts).toBe(1);
  });

  it('pentatlo feminino sub16 80mB (ELE): 10.5s → 719 pontos', () => {
    const pts = CombinedScoringEngine.calcularPontosProva('80mB', 10.5, 'F', 'F_sub16_pentatlo', 'ELE');
    expect(pts).toBe(719);
  });

  it('tabela CBAt: tempo entre dois valores → arredonda para o mais lento', () => {
    // 10.52 fica entre 10.51(718) e 10.52(717) na tabela 80mH_F_Sub16_ELE
    const pts = CombinedScoringEngine.calcularPontosProva('80mB', 10.515, 'F', 'F_sub16_pentatlo', 'ELE');
    // Deve retornar o ponto do valor mais lento (10.52 → 717)
    expect(pts).toBe(717);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// calcularPontosProva — fallback e edge cases
// ═══════════════════════════════════════════════════════════════════════════════
describe('CombinedScoringEngine.calcularPontosProva — fallback/edges', () => {
  it('regrasPontuacao override substitui mapeamento', () => {
    // Override decatlo 100m para usar women|100m em vez de men|100m
    const regrasPontuacao = { 'M_adulto_decatlo|100m': 'women|100m' };
    const ptsOverride = CombinedScoringEngine.calcularPontosProva('100m', 11.0, 'M', 'M_adulto_decatlo', null, regrasPontuacao);
    const ptsPadrao = CombinedScoringEngine.calcularPontosProva('100m', 11.0, 'M', 'M_adulto_decatlo');
    // Constantes diferentes → pontos diferentes
    expect(ptsOverride).not.toBe(ptsPadrao);
    expect(ptsOverride).toBeGreaterThan(0);
  });

  it('fallback WA por convenção quando combinadaProvaId é null', () => {
    // Sem combinadaProvaId → usa fallback por convenção de nomes
    const pts = CombinedScoringEngine.calcularPontosProva('100m', 11.0, 'M', null);
    expect(pts).toBeGreaterThan(0);
  });

  it('fallback WA para saltos (comp → Long Jump)', () => {
    const pts = CombinedScoringEngine.calcularPontosProva('comp', 7.0, 'M', null);
    expect(pts).toBeGreaterThan(0);
  });

  it('fallback WA para altura (altura → High Jump)', () => {
    const pts = CombinedScoringEngine.calcularPontosProva('altura', 2.0, 'M', null);
    expect(pts).toBeGreaterThan(0);
  });

  it('prova totalmente desconhecida retorna 0', () => {
    const pts = CombinedScoringEngine.calcularPontosProva('xyz_inexistente', 10.0, 'M', null);
    expect(pts).toBe(0);
  });

  it('cronometragem MAN no fallback WA adiciona 0.24s', () => {
    const ptsEle = CombinedScoringEngine.calcularPontosProva('100m', 11.0, 'M', null, 'ELE');
    const ptsMan = CombinedScoringEngine.calcularPontosProva('100m', 11.0, 'M', null, 'MAN');
    expect(ptsMan).toBeLessThan(ptsEle);
  });

  it('tabela CBAt com cronometragem MAN usa tabela _MAN', () => {
    // hexatlo sub16 100mB com MAN → usa CBAt_100mH_M_Sub16_MAN
    const ptsMan = CombinedScoringEngine.calcularPontosProva('100mB', 12.6, 'M', 'M_sub16_hexatlo', 'MAN');
    const ptsEle = CombinedScoringEngine.calcularPontosProva('100mB', 12.6, 'M', 'M_sub16_hexatlo', 'ELE');
    expect(ptsMan).toBe(977); // CBAt_100mH_M_Sub16_MAN[12.6]
    expect(ptsEle).toBe(1000); // CBAt_100mH_M_Sub16_ELE[12.6]
  });

  it('campo com marca <= baseline WA retorna 0', () => {
    // Shot: b=1.5 → marca <= 1.5m dá 0
    const pts = CombinedScoringEngine.calcularPontosProva('peso', 1.0, 'M', 'M_adulto_decatlo');
    expect(pts).toBe(0);
  });

  it('salto com marca <= baseline retorna 0', () => {
    // High Jump men: b=75cm → marca <= 0.75m dá 0
    const pts = CombinedScoringEngine.calcularPontosProva('altura', 0.5, 'M', 'M_adulto_decatlo');
    expect(pts).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// resolverScoringMap
// ═══════════════════════════════════════════════════════════════════════════════
describe('resolverScoringMap', () => {
  it('resolve decatlo masculino 100m com wildcard de categoria', () => {
    const map = resolverScoringMap('M_adulto_decatlo', '100m');
    expect(map).toEqual({ metodo: 'wa', chave: 'men|100m' });
  });

  it('resolve hexatlo sub16 com chave específica', () => {
    const map = resolverScoringMap('M_sub16_hexatlo', '100mB');
    expect(map).toEqual({ metodo: 'table', chave: 'CBAt_100mH_M_Sub16_ELE' });
  });

  it('retorna null para combinada inexistente', () => {
    const map = resolverScoringMap('M_adulto_inexistente', '100m');
    expect(map).toBeNull();
  });

  it('resolve heptatlo feminino com wildcard', () => {
    const map = resolverScoringMap('F_adulto_heptatlo', '200m');
    expect(map).toEqual({ metodo: 'wa', chave: 'women|200m' });
  });

  it('resolve tetratlo sub14 masculino', () => {
    const map = resolverScoringMap('M_sub14_tetratlo', '60mB');
    expect(map).toEqual({ metodo: 'wa', chave: 'men|60mH' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// temDuasCronometragens
// ═══════════════════════════════════════════════════════════════════════════════
describe('temDuasCronometragens', () => {
  it('true para hexatlo sub16 100mB (tem _ELE e _MAN)', () => {
    expect(temDuasCronometragens('M_sub16_hexatlo', '100mB')).toBe(true);
  });

  it('true para pentatlo sub16 80mB', () => {
    expect(temDuasCronometragens('F_sub16_pentatlo', '80mB')).toBe(true);
  });

  it('false para decatlo adulto 100m (usa WA, não tabela)', () => {
    expect(temDuasCronometragens('M_adulto_decatlo', '100m')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// calcularPontuacaoAtleta
// ═══════════════════════════════════════════════════════════════════════════════
describe('CombinedScoringEngine.calcularPontuacaoAtleta', () => {
  const provasComponentes = [
    { id: 'evt1_COMB_M_adulto_decatlo_0_100m', provaOriginalSufixo: '100m', nome: '100m', ordem: 1, combinadaId: 'M_adulto_decatlo', dia: 1, unidade: 's' },
    { id: 'evt1_COMB_M_adulto_decatlo_1_comp', provaOriginalSufixo: 'comp', nome: 'Salto em Comprimento', ordem: 2, combinadaId: 'M_adulto_decatlo', dia: 1, unidade: 'm' },
  ];

  it('calcula total parcial com resultados existentes', () => {
    const resultados = {
      'evt1_COMB_M_adulto_decatlo_0_100m': { atl1: { marca: 11.0 } },
    };
    const pontuacao = CombinedScoringEngine.calcularPontuacaoAtleta(
      'atl1', 'M_adulto_decatlo', 'evt1', provasComponentes, resultados, 'M'
    );
    expect(pontuacao.provasRealizadas).toBe(1);
    expect(pontuacao.totalProvas).toBe(2);
    expect(pontuacao.status).toBe('parcial');
    expect(pontuacao.totalPontos).toBeGreaterThan(0);
  });

  it('calcula total completo com todos os resultados', () => {
    const resultados = {
      'evt1_COMB_M_adulto_decatlo_0_100m': { atl1: { marca: 11.0 } },
      'evt1_COMB_M_adulto_decatlo_1_comp': { atl1: { marca: 7.0 } },
    };
    const pontuacao = CombinedScoringEngine.calcularPontuacaoAtleta(
      'atl1', 'M_adulto_decatlo', 'evt1', provasComponentes, resultados, 'M'
    );
    expect(pontuacao.provasRealizadas).toBe(2);
    expect(pontuacao.status).toBe('completo');
    expect(pontuacao.totalPontos).toBeGreaterThan(0);
  });

  it('ignora resultados com status DNS/DNF', () => {
    const resultados = {
      'evt1_COMB_M_adulto_decatlo_0_100m': { atl1: { marca: 'DNS', status: 'DNS' } },
      'evt1_COMB_M_adulto_decatlo_1_comp': { atl1: { marca: 7.0 } },
    };
    const pontuacao = CombinedScoringEngine.calcularPontuacaoAtleta(
      'atl1', 'M_adulto_decatlo', 'evt1', provasComponentes, resultados, 'M'
    );
    expect(pontuacao.provasRealizadas).toBe(1);
    expect(pontuacao.pontosPorProva['evt1_COMB_M_adulto_decatlo_0_100m'].pontos).toBe(0);
  });

  it('usa pontosTabela quando disponível (override manual)', () => {
    const resultados = {
      'evt1_COMB_M_adulto_decatlo_0_100m': { atl1: { marca: 11.0, pontosTabela: 999 } },
      'evt1_COMB_M_adulto_decatlo_1_comp': { atl1: { marca: 7.0 } },
    };
    const pontuacao = CombinedScoringEngine.calcularPontuacaoAtleta(
      'atl1', 'M_adulto_decatlo', 'evt1', provasComponentes, resultados, 'M'
    );
    expect(pontuacao.pontosPorProva['evt1_COMB_M_adulto_decatlo_0_100m'].pontos).toBe(999);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// gerarClassificacao
// ═══════════════════════════════════════════════════════════════════════════════
describe('CombinedScoringEngine.gerarClassificacao', () => {
  const provasComponentes = [
    { id: 'evt1_COMB_M_adulto_decatlo_0_100m', provaOriginalSufixo: '100m', nome: '100m', ordem: 1, combinadaId: 'M_adulto_decatlo', dia: 1, unidade: 's' },
  ];

  it('ordena por totalPontos decrescente e atribui posição', () => {
    const resultados = {
      'evt1_COMB_M_adulto_decatlo_0_100m': {
        atl1: { marca: 12.0 },
        atl2: { marca: 11.0 },
        atl3: { marca: 11.5 },
      },
    };
    const classificacao = CombinedScoringEngine.gerarClassificacao(
      ['atl1', 'atl2', 'atl3'], 'M_adulto_decatlo', 'evt1', provasComponentes, resultados, 'M'
    );
    expect(classificacao).toHaveLength(3);
    expect(classificacao[0].atletaId).toBe('atl2'); // 11.0 → mais pontos
    expect(classificacao[0].posicao).toBe(1);
    expect(classificacao[1].atletaId).toBe('atl3'); // 11.5
    expect(classificacao[1].posicao).toBe(2);
    expect(classificacao[2].atletaId).toBe('atl1'); // 12.0 → menos pontos
    expect(classificacao[2].posicao).toBe(3);
  });
});
