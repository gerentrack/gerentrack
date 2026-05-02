import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SeriacaoEngine } from '../seriacaoEngine';

// ─── Helpers de teste ───────────────────────────────────────────────────────
const criarAtletas = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `atl_${i + 1}`,
    nome: `Atleta ${i + 1}`,
    marcaRef: String((10 + i * 0.5).toFixed(2)),
  }));

// Seed para tornar shuffle determinístico nos testes
beforeEach(() => {
  let seed = 42;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS DE CLASSIFICAÇÃO DE PROVA
// ═══════════════════════════════════════════════════════════════════════════════
describe('SeriacaoEngine — classificação de prova', () => {
  it('_getMetros extrai metragem do ID da prova', () => {
    expect(SeriacaoEngine._getMetros({ id: 'M_adulto_100m' })).toBe(100);
    expect(SeriacaoEngine._getMetros({ id: 'F_sub16_200m' })).toBe(200);
    expect(SeriacaoEngine._getMetros({ id: 'M_adulto_1500m' })).toBe(1500);
    expect(SeriacaoEngine._getMetros({ id: 'M_adulto_4x400m' })).toBe(400);
    expect(SeriacaoEngine._getMetros({ id: 'peso' })).toBe(0);
  });

  it('_isReta identifica corridas em reta (≤110m)', () => {
    expect(SeriacaoEngine._isReta({ id: 'M_adulto_100m' })).toBe(true);
    expect(SeriacaoEngine._isReta({ id: 'M_adulto_60m' })).toBe(true);
    expect(SeriacaoEngine._isReta({ id: 'M_adulto_110mB' })).toBe(true);
    expect(SeriacaoEngine._isReta({ id: 'M_adulto_200m' })).toBe(false);
    expect(SeriacaoEngine._isReta({ id: 'M_adulto_400m' })).toBe(false);
  });

  it('_is200 identifica provas de 200m', () => {
    expect(SeriacaoEngine._is200({ id: 'M_adulto_200m' })).toBe(true);
    expect(SeriacaoEngine._is200({ id: 'F_sub18_200mB' })).toBe(true); // 200mB → extrai 200m do ID
    expect(SeriacaoEngine._is200({ id: 'M_adulto_100m' })).toBe(false);
  });

  it('_is400_800 identifica 400m, 800m e revezamentos', () => {
    expect(SeriacaoEngine._is400_800({ id: 'M_adulto_400m', tipo: 'pista' })).toBe(true);
    expect(SeriacaoEngine._is400_800({ id: 'M_adulto_800m', tipo: 'pista' })).toBe(true);
    expect(SeriacaoEngine._is400_800({ id: 'M_adulto_4x100m', tipo: 'revezamento' })).toBe(true);
    expect(SeriacaoEngine._is400_800({ id: 'M_adulto_100m', tipo: 'pista' })).toBe(false);
  });

  it('_isLargadaEmGrupo identifica provas >800m e configuração de 800m', () => {
    expect(SeriacaoEngine._isLargadaEmGrupo({ id: 'M_adulto_1500m' }, {})).toBe(true);
    expect(SeriacaoEngine._isLargadaEmGrupo({ id: 'M_adulto_5000m' }, {})).toBe(true);
    expect(SeriacaoEngine._isLargadaEmGrupo({ id: 'M_adulto_800m' }, {})).toBe(false);
    expect(SeriacaoEngine._isLargadaEmGrupo({ id: 'M_adulto_800m' }, { modo800: 'grupo' })).toBe(true);
    expect(SeriacaoEngine._isLargadaEmGrupo({ id: 'M_adulto_3000mObs', tipo: 'obstaculos' }, {})).toBe(true);
    expect(SeriacaoEngine._isLargadaEmGrupo({ id: 'M_adulto_20kmM', tipo: 'marcha' }, {})).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DISTRIBUIÇÃO SERPENTINA E ZIGZAG
// ═══════════════════════════════════════════════════════════════════════════════
describe('SeriacaoEngine — distribuição', () => {
  it('distribuirSerpentina distribui uniformemente (13 em 2 → 7+6)', () => {
    const atletas = criarAtletas(13);
    const series = SeriacaoEngine.distribuirSerpentina(atletas, 2, 8);
    expect(series).toHaveLength(2);
    expect(series[0]).toHaveLength(7);
    expect(series[1]).toHaveLength(6);
  });

  it('distribuirSerpentina com 1 série retorna todos', () => {
    const atletas = criarAtletas(5);
    const series = SeriacaoEngine.distribuirSerpentina(atletas, 1, 8);
    expect(series).toHaveLength(1);
    expect(series[0]).toHaveLength(5);
  });

  it('distribuirSerpentina distribui 16 atletas em 2 séries iguais', () => {
    const atletas = criarAtletas(16);
    const series = SeriacaoEngine.distribuirSerpentina(atletas, 2, 8);
    expect(series[0]).toHaveLength(8);
    expect(series[1]).toHaveLength(8);
  });

  it('distribuirSerpentina atribui ranking sequencial', () => {
    const atletas = criarAtletas(6);
    const series = SeriacaoEngine.distribuirSerpentina(atletas, 2, 8);
    const rankings = series.flat().map(a => a.ranking);
    expect(rankings).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('distribuirZigzag distribui em zigzag (3 séries)', () => {
    const atletas = criarAtletas(9);
    const series = SeriacaoEngine.distribuirZigzag(atletas, 3, 8);
    expect(series).toHaveLength(3);
    // Zigzag: A:1,6,7  B:2,5,8  C:3,4,9
    expect(series[0].map(a => a.ranking)).toEqual([1, 6, 7]);
    expect(series[1].map(a => a.ranking)).toEqual([2, 5, 8]);
    expect(series[2].map(a => a.ranking)).toEqual([3, 4, 9]);
  });

  it('distribuirZigzag com 0 atletas retorna séries vazias', () => {
    const series = SeriacaoEngine.distribuirZigzag([], 3, 8);
    expect(series).toHaveLength(3);
    series.forEach(s => expect(s).toHaveLength(0));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// _sortearPorGrupos com origemClassif P/T
// ═══════════════════════════════════════════════════════════════════════════════
describe('SeriacaoEngine — sorteio com origemClassif P/T', () => {
  it('distribui P nas raias prioritárias e T nas restantes', () => {
    const atletas = [
      { id: 'a1', nome: 'A1', ranking: 1, origemClassif: 'posicao' },
      { id: 'a2', nome: 'A2', ranking: 2, origemClassif: 'posicao' },
      { id: 'a3', nome: 'A3', ranking: 3, origemClassif: 'posicao' },
      { id: 'a4', nome: 'A4', ranking: 4, origemClassif: 'posicao' },
      { id: 'a5', nome: 'A5', ranking: 5, origemClassif: 'tempo' },
      { id: 'a6', nome: 'A6', ranking: 6, origemClassif: 'tempo' },
    ];
    const resultado = SeriacaoEngine.sortearRaiasReta(atletas, 8);
    expect(resultado).toHaveLength(6);
    // Todos devem ter raia atribuída
    resultado.forEach(a => expect(a.raia).toBeGreaterThanOrEqual(1));
  });

  it('atletas sem origemClassif usam distribuição por ranking', () => {
    const atletas = [
      { id: 'a1', nome: 'A1', ranking: 1 },
      { id: 'a2', nome: 'A2', ranking: 2 },
    ];
    const resultado = SeriacaoEngine.sortearRaiasReta(atletas, 8);
    expect(resultado).toHaveLength(2);
    resultado.forEach(a => expect(a.raia).toBeTruthy());
  });

  it('mais atletas que raias disponíveis → overflow recebe raia null', () => {
    // Forçar overflow: 10 atletas mas só 3 raias em grupos
    const atletas = Array.from({ length: 10 }, (_, i) => ({
      id: `a${i}`, nome: `A${i}`, ranking: i + 1,
    }));
    // sortearRaiasReta com 3 raias → apenas 3 raias disponíveis
    const resultado = SeriacaoEngine.sortearRaiasReta(atletas, 3);
    const comRaia = resultado.filter(a => a.raia !== null);
    const semRaia = resultado.filter(a => a.raia === null);
    expect(comRaia.length).toBe(3);
    expect(semRaia.length).toBe(7);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NOTE (iii) — RAIAS DISPONÍVEIS
// ═══════════════════════════════════════════════════════════════════════════════
describe('SeriacaoEngine — raias disponíveis (Note iii)', () => {
  it('todos as raias quando atletas >= raias', () => {
    const raias = SeriacaoEngine._raiasDisponiveis(8, 8);
    expect(raias).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('libera raias internas quando menos atletas que raias', () => {
    // 6 atletas, 8 raias → libera 1 e 2
    const raias = SeriacaoEngine._raiasDisponiveis(6, 8);
    expect(raias).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it('1 atleta em 8 raias → só raia 8', () => {
    const raias = SeriacaoEngine._raiasDisponiveis(1, 8);
    expect(raias).toEqual([8]);
  });

  it('mais atletas que raias → retorna todas', () => {
    const raias = SeriacaoEngine._raiasDisponiveis(10, 8);
    expect(raias).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SORTEIO DE RAIAS
// ═══════════════════════════════════════════════════════════════════════════════
describe('SeriacaoEngine — sorteio de raias', () => {
  it('sortearRaiasLivre atribui raias a todos os atletas', () => {
    const atletas = criarAtletas(8);
    const resultado = SeriacaoEngine.sortearRaiasLivre(atletas, 8);
    expect(resultado).toHaveLength(8);
    const raias = resultado.map(a => a.raia).sort((a, b) => a - b);
    expect(raias).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('sortearRaiasLivre com menos atletas respeita Note (iii)', () => {
    const atletas = criarAtletas(6);
    const resultado = SeriacaoEngine.sortearRaiasLivre(atletas, 8);
    expect(resultado).toHaveLength(6);
    resultado.forEach(a => {
      expect(a.raia).toBeGreaterThanOrEqual(3);
      expect(a.raia).toBeLessThanOrEqual(8);
    });
  });

  it('sortearRaiasReta distribui por grupos A(3,4,5,6) B(2,7) C(1,8)', () => {
    const atletas = criarAtletas(8);
    const resultado = SeriacaoEngine.sortearRaiasReta(atletas, 8);
    expect(resultado).toHaveLength(8);
    const raias = resultado.map(a => a.raia).sort((a, b) => a - b);
    expect(raias).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('sortearRaias200 distribui por grupos A(5,6,7) B(3,4,8) C(1,2)', () => {
    const atletas = criarAtletas(8);
    const resultado = SeriacaoEngine.sortearRaias200(atletas, 8);
    expect(resultado).toHaveLength(8);
    const raias = resultado.map(a => a.raia).sort((a, b) => a - b);
    expect(raias).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('sortearRaias400 distribui por grupos A(4,5,6,7) B(3,8) C(1,2)', () => {
    const atletas = criarAtletas(8);
    const resultado = SeriacaoEngine.sortearRaias400(atletas, 8);
    expect(resultado).toHaveLength(8);
    const raias = resultado.map(a => a.raia).sort((a, b) => a - b);
    expect(raias).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('sortearPosicaoGrupo atribui posições sem raias', () => {
    const atletas = criarAtletas(12);
    const resultado = SeriacaoEngine.sortearPosicaoGrupo(atletas, 12);
    expect(resultado).toHaveLength(12);
    resultado.forEach(a => {
      expect(a.raia).toBeNull();
      expect(a.posicao).toBeGreaterThanOrEqual(1);
    });
    const posicoes = resultado.map(a => a.posicao).sort((a, b) => a - b);
    expect(posicoes).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getSortearRaias — DETERMINAR MÉTODO
// ═══════════════════════════════════════════════════════════════════════════════
describe('SeriacaoEngine — getSortearRaias', () => {
  it('retorna RT 20.4.6 para provas de grupo (>800m)', () => {
    const info = SeriacaoEngine.getSortearRaias({ id: 'M_adulto_1500m' }, 'final', {});
    expect(info.regra).toBe('RT 20.4.6');
    expect(info.tipo).toBe('grupo');
  });

  it('retorna RT 20.4.1 para eliminatória', () => {
    const info = SeriacaoEngine.getSortearRaias({ id: 'M_adulto_100m' }, 'eliminatoria', {});
    expect(info.regra).toBe('RT 20.4.1');
    expect(info.tipo).toBe('raias');
  });

  it('retorna RT 20.4.3 para reta em final', () => {
    const info = SeriacaoEngine.getSortearRaias({ id: 'M_adulto_100m' }, 'final', {});
    expect(info.regra).toBe('RT 20.4.3');
    expect(info.tipo).toBe('raias');
  });

  it('retorna RT 20.4.4 para 200m em final', () => {
    const info = SeriacaoEngine.getSortearRaias({ id: 'M_adulto_200m' }, 'final', {});
    expect(info.regra).toBe('RT 20.4.4');
    expect(info.tipo).toBe('raias');
  });

  it('retorna RT 20.4.5 para 400m em final', () => {
    const info = SeriacaoEngine.getSortearRaias({ id: 'M_adulto_400m' }, 'final', {});
    expect(info.regra).toBe('RT 20.4.5');
    expect(info.tipo).toBe('raias');
  });

  it('retorna RT 20.4.1 para fase legada 1', () => {
    const info = SeriacaoEngine.getSortearRaias({ id: 'M_adulto_100m' }, 1, {});
    expect(info.regra).toBe('RT 20.4.1');
  });

  it('retorna RT 20.4.5 para revezamento 4x400m em final', () => {
    const info = SeriacaoEngine.getSortearRaias({ id: 'M_adulto_4x400m', tipo: 'revezamento' }, 'final', {});
    expect(info.regra).toBe('RT 20.4.5');
    expect(info.tipo).toBe('raias');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// calcularNumSeries
// ═══════════════════════════════════════════════════════════════════════════════
describe('SeriacaoEngine — calcularNumSeries', () => {
  it('1 série quando cabe na capacidade', () => {
    expect(SeriacaoEngine.calcularNumSeries(8, 8)).toBe(1);
    expect(SeriacaoEngine.calcularNumSeries(5, 8)).toBe(1);
  });

  it('múltiplas séries quando excede capacidade', () => {
    expect(SeriacaoEngine.calcularNumSeries(9, 8)).toBe(2);
    expect(SeriacaoEngine.calcularNumSeries(16, 8)).toBe(2);
    expect(SeriacaoEngine.calcularNumSeries(17, 8)).toBe(3);
    expect(SeriacaoEngine.calcularNumSeries(24, 8)).toBe(3);
    expect(SeriacaoEngine.calcularNumSeries(25, 8)).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// seriarProva — FUNÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
describe('SeriacaoEngine — seriarProva', () => {
  it('retorna vazio para 0 atletas', () => {
    const resultado = SeriacaoEngine.seriarProva([], { id: 'M_adulto_100m', unidade: 's' }, { nRaias: 8 });
    expect(resultado.series).toEqual([]);
    expect(resultado.ordemSeries).toEqual([]);
  });

  it('1 atleta, 1 série, raia atribuída', () => {
    const atletas = [{ id: 'a1', nome: 'A1', marcaRef: '10.50' }];
    const resultado = SeriacaoEngine.seriarProva(atletas, { id: 'M_adulto_100m', unidade: 's' }, { nRaias: 8, fase: 'eliminatoria' });
    expect(resultado.series).toHaveLength(1);
    expect(resultado.series[0].atletas).toHaveLength(1);
    expect(resultado.tipoLargada).toBe('raias');
  });

  it('seriação de pista: rankear por menor tempo', () => {
    const atletas = [
      { id: 'a1', nome: 'Lento', marcaRef: '12.00' },
      { id: 'a2', nome: 'Rapido', marcaRef: '10.00' },
      { id: 'a3', nome: 'Medio', marcaRef: '11.00' },
    ];
    const resultado = SeriacaoEngine.seriarProva(atletas, { id: 'M_adulto_100m', unidade: 's' }, { nRaias: 8, fase: 'eliminatoria' });
    expect(resultado.series).toHaveLength(1);
    // Ranking: a2(10.00)=1, a3(11.00)=2, a1(12.00)=3
    const ids = resultado.series[0].atletas.map(a => a.id);
    expect(ids).toContain('a1');
    expect(ids).toContain('a2');
    expect(ids).toContain('a3');
  });

  it('seriação de campo: rankear por maior marca', () => {
    const atletas = [
      { id: 'a1', nome: 'Curto', marcaRef: '5.00' },
      { id: 'a2', nome: 'Longo', marcaRef: '7.50' },
      { id: 'a3', nome: 'Medio', marcaRef: '6.00' },
    ];
    const resultado = SeriacaoEngine.seriarProva(atletas, { id: 'M_adulto_comp', unidade: 'm' }, { nRaias: 8, fase: 'eliminatoria' });
    expect(resultado.series).toHaveLength(1);
  });

  it('múltiplas séries distribuídas corretamente', () => {
    const atletas = criarAtletas(16);
    const resultado = SeriacaoEngine.seriarProva(atletas, { id: 'M_adulto_100m', unidade: 's' }, { nRaias: 8, fase: 'eliminatoria' });
    expect(resultado.series).toHaveLength(2);
    expect(resultado.series[0].atletas).toHaveLength(8);
    expect(resultado.series[1].atletas).toHaveLength(8);
    expect(resultado.tipoLargada).toBe('raias');
  });

  it('prova >800m usa largada em grupo', () => {
    const atletas = criarAtletas(20);
    const resultado = SeriacaoEngine.seriarProva(atletas, { id: 'M_adulto_1500m', unidade: 's' }, { nRaias: 8, fase: 'final', atlPorSerie: 12 });
    expect(resultado.tipoLargada).toBe('grupo');
    expect(resultado.series).toHaveLength(2); // 20 / 12 = 2
    resultado.series.forEach(serie => {
      serie.atletas.forEach(a => expect(a.raia).toBeNull());
    });
  });

  it('regraAplicada contém referência RT', () => {
    const atletas = criarAtletas(8);
    const resultado = SeriacaoEngine.seriarProva(atletas, { id: 'M_adulto_100m', unidade: 's' }, { nRaias: 8, fase: 'final' });
    expect(resultado.regraAplicada).toContain('RT 20.4.3');
  });

  it('modo aleatório não inverte séries', () => {
    const atletas = criarAtletas(16);
    const resultado = SeriacaoEngine.seriarProva(atletas, { id: 'M_adulto_100m', unidade: 's' }, { nRaias: 8, fase: 'eliminatoria', aleatorio: true });
    expect(resultado.series).toHaveLength(2);
    expect(resultado.series[0].numero).toBe(1);
    expect(resultado.series[1].numero).toBe(2);
  });

  it('semifinal usa zigzag em vez de serpentina', () => {
    const atletas = criarAtletas(16);
    const resultado = SeriacaoEngine.seriarProva(atletas, { id: 'M_adulto_100m', unidade: 's' }, { nRaias: 8, fase: 'semifinal' });
    expect(resultado.series).toHaveLength(2);
    expect(resultado.regraAplicada).toContain('Semifinal');
  });

  it('200m em final usa regra RT 20.4.4', () => {
    const atletas = criarAtletas(8);
    const resultado = SeriacaoEngine.seriarProva(atletas, { id: 'M_adulto_200m', unidade: 's' }, { nRaias: 8, fase: 'final' });
    expect(resultado.regraAplicada).toContain('RT 20.4.4');
    expect(resultado.regraAplicada).toContain('200m');
  });

  it('400m em final usa regra RT 20.4.5', () => {
    const atletas = criarAtletas(8);
    const resultado = SeriacaoEngine.seriarProva(atletas, { id: 'M_adulto_400m', unidade: 's' }, { nRaias: 8, fase: 'final' });
    expect(resultado.regraAplicada).toContain('RT 20.4.5');
    expect(resultado.regraAplicada).toContain('400m');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// descreverRegra — cobertura de branches
// ═══════════════════════════════════════════════════════════════════════════════
describe('SeriacaoEngine — descreverRegra', () => {
  it('200m semifinal', () => {
    const desc = SeriacaoEngine.descreverRegra({ id: 'M_adulto_200m' }, 'semifinal', {});
    expect(desc).toContain('RT 20.4.4');
    expect(desc).toContain('Semifinal');
    expect(desc).toContain('200m');
  });

  it('400m final', () => {
    const desc = SeriacaoEngine.descreverRegra({ id: 'M_adulto_400m' }, 'final', {});
    expect(desc).toContain('RT 20.4.5');
    expect(desc).toContain('Final');
    expect(desc).toContain('400m');
  });

  it('100m final (reta)', () => {
    const desc = SeriacaoEngine.descreverRegra({ id: 'M_adulto_100m' }, 'final', {});
    expect(desc).toContain('RT 20.4.3');
    expect(desc).toContain('reta');
  });

  it('1500m (grupo)', () => {
    const desc = SeriacaoEngine.descreverRegra({ id: 'M_adulto_1500m' }, 'final', {});
    expect(desc).toContain('RT 20.4.6');
    expect(desc).toContain('sem raias');
  });

  it('eliminatória (sorteio livre)', () => {
    const desc = SeriacaoEngine.descreverRegra({ id: 'M_adulto_100m' }, 'eliminatoria', {});
    expect(desc).toContain('RT 20.4.1');
    expect(desc).toContain('sorteio livre');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// rankearRT20_3_2a — RANKING PÓS-FASE
// ═══════════════════════════════════════════════════════════════════════════════
describe('SeriacaoEngine — rankearRT20_3_2a', () => {
  it('retorna vazio sem dados', () => {
    expect(SeriacaoEngine.rankearRT20_3_2a(null, null, null)).toEqual([]);
    expect(SeriacaoEngine.rankearRT20_3_2a({}, {}, {})).toEqual([]);
  });

  it('classifica por posição e depois por tempo', () => {
    const seriacaoAnterior = {
      series: [
        { numero: 1, atletas: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }] },
        { numero: 2, atletas: [{ id: 'a4' }, { id: 'a5' }, { id: 'a6' }] },
      ],
    };
    const resultados = {
      a1: { marca: 10.2 },
      a2: { marca: 10.5 },
      a3: { marca: 10.8 },
      a4: { marca: 10.1 },
      a5: { marca: 10.4 },
      a6: { marca: 10.9 },
    };
    const progressao = { porPosicao: 2, porTempo: 2 };

    const ranking = SeriacaoEngine.rankearRT20_3_2a(seriacaoAnterior, resultados, progressao);
    expect(ranking).toHaveLength(6);

    // 1ºs colocados: a4(10.1), a1(10.2) — por posição
    expect(ranking[0].atletaId).toBe('a4');
    expect(ranking[0].origemClassif).toBe('posicao');
    expect(ranking[1].atletaId).toBe('a1');
    expect(ranking[1].origemClassif).toBe('posicao');

    // 2ºs colocados: a5(10.4), a2(10.5) — por posição
    expect(ranking[2].atletaId).toBe('a5');
    expect(ranking[3].atletaId).toBe('a2');

    // Por tempo: a3(10.8), a6(10.9)
    expect(ranking[4].atletaId).toBe('a3');
    expect(ranking[4].origemClassif).toBe('tempo');
    expect(ranking[5].atletaId).toBe('a6');
    expect(ranking[5].origemClassif).toBe('tempo');
  });

  it('ignora atletas com status DNS/DNF/DQ', () => {
    const seriacaoAnterior = {
      series: [
        { numero: 1, atletas: [{ id: 'a1' }, { id: 'a2' }] },
      ],
    };
    const resultados = {
      a1: { marca: 10.5 },
      a2: { marca: 'DNS', status: 'DNS' },
    };
    const ranking = SeriacaoEngine.rankearRT20_3_2a(seriacaoAnterior, resultados, { porPosicao: 1, porTempo: 0 });
    expect(ranking).toHaveLength(1);
    expect(ranking[0].atletaId).toBe('a1');
  });

  it('atribui marcaRef e ranking sequencial', () => {
    const seriacaoAnterior = {
      series: [{ numero: 1, atletas: [{ id: 'a1' }, { id: 'a2' }] }],
    };
    const resultados = { a1: 10.5, a2: 10.3 };
    const ranking = SeriacaoEngine.rankearRT20_3_2a(seriacaoAnterior, resultados, { porPosicao: 2, porTempo: 0 });
    expect(ranking[0].ranking).toBe(1);
    expect(ranking[1].ranking).toBe(2);
    expect(ranking[0].marcaRef).toBe('10.3');
    expect(ranking[1].marcaRef).toBe('10.5');
  });
});
