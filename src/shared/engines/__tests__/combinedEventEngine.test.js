import { describe, it, expect } from 'vitest';
import { CombinedEventEngine } from '../combinedEventEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// gerarProvasComponentes
// ═══════════════════════════════════════════════════════════════════════════════
describe('CombinedEventEngine.gerarProvasComponentes', () => {
  it('gera componentes do decatlo masculino adulto', () => {
    const componentes = CombinedEventEngine.gerarProvasComponentes('M_adulto_decatlo', 'evt1');
    expect(componentes.length).toBe(10); // decatlo = 10 provas
    componentes.forEach((pc, idx) => {
      expect(pc.id).toContain('evt1_COMB_M_adulto_decatlo');
      expect(pc.combinadaId).toBe('M_adulto_decatlo');
      expect(pc.origemCombinada).toBe(true);
      expect(pc.ordem).toBe(idx + 1);
      expect(pc.totalProvas).toBe(10);
      expect(pc.provaOriginalSufixo).toBeTruthy();
      expect(pc.nome).toBeTruthy();
    });
  });

  it('gera componentes do heptatlo feminino adulto', () => {
    const componentes = CombinedEventEngine.gerarProvasComponentes('F_adulto_heptatlo', 'evt1');
    expect(componentes.length).toBe(7); // heptatlo = 7 provas
    expect(componentes[0].combinadaId).toBe('F_adulto_heptatlo');
  });

  it('gera componentes do hexatlo masculino sub16', () => {
    const componentes = CombinedEventEngine.gerarProvasComponentes('M_sub16_hexatlo', 'evt1');
    expect(componentes.length).toBe(6); // hexatlo = 6 provas
  });

  it('gera componentes do pentatlo feminino sub16', () => {
    const componentes = CombinedEventEngine.gerarProvasComponentes('F_sub16_pentatlo', 'evt1');
    expect(componentes.length).toBe(5); // pentatlo = 5 provas
  });

  it('gera componentes do tetratlo sub14', () => {
    const componentes = CombinedEventEngine.gerarProvasComponentes('M_sub14_tetratlo', 'evt1');
    expect(componentes.length).toBe(4); // tetratlo = 4 provas
  });

  it('retorna vazio para combinada inexistente', () => {
    const componentes = CombinedEventEngine.gerarProvasComponentes('M_adulto_inexistente', 'evt1');
    expect(componentes).toEqual([]);
  });

  it('IDs são únicos entre componentes', () => {
    const componentes = CombinedEventEngine.gerarProvasComponentes('M_adulto_decatlo', 'evt1');
    const ids = componentes.map(pc => pc.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada componente tem tipo e unidade definidos', () => {
    const componentes = CombinedEventEngine.gerarProvasComponentes('M_adulto_decatlo', 'evt1');
    componentes.forEach(pc => {
      expect(pc.tipo).toBeTruthy();
      expect(pc.unidade).toBeTruthy();
    });
  });

  it('componentes têm dia definido (dia 1 ou 2)', () => {
    const componentes = CombinedEventEngine.gerarProvasComponentes('M_adulto_decatlo', 'evt1');
    componentes.forEach(pc => {
      expect(pc.dia).toBeGreaterThanOrEqual(1);
    });
    // Decatlo tem provas nos dias 1 e 2
    const dias = [...new Set(componentes.map(pc => pc.dia))];
    expect(dias.length).toBeGreaterThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// inscreverAtletaNasComponentes
// ═══════════════════════════════════════════════════════════════════════════════
describe('CombinedEventEngine.inscreverAtletaNasComponentes', () => {
  const dadosBase = {
    categoria: 'Adulto',
    categoriaId: 'adulto',
    categoriaOficial: 'Adulto',
    categoriaOficialId: 'adulto',
    sexo: 'M',
    inscritoPorId: 'admin1',
    inscritoPorNome: 'Admin',
    inscritoPorTipo: 'admin',
    equipeCadastro: 'Clube A',
    equipeCadastroId: 'eq1',
  };

  it('gera inscrições para todas as componentes', () => {
    const componentes = CombinedEventEngine.gerarProvasComponentes('M_adulto_decatlo', 'evt1');
    const inscricoes = CombinedEventEngine.inscreverAtletaNasComponentes(
      'atl1', 'M_adulto_decatlo', 'evt1', dadosBase, componentes
    );
    expect(inscricoes).toHaveLength(10);
    inscricoes.forEach(i => {
      expect(i.eventoId).toBe('evt1');
      expect(i.atletaId).toBe('atl1');
      expect(i.combinadaId).toBe('M_adulto_decatlo');
      expect(i.origemCombinada).toBe(true);
      expect(i.sexo).toBe('M');
      expect(i.categoriaId).toBe('adulto');
    });
  });

  it('IDs de inscrição são únicos', () => {
    const componentes = CombinedEventEngine.gerarProvasComponentes('M_adulto_decatlo', 'evt1');
    const inscricoes = CombinedEventEngine.inscreverAtletaNasComponentes(
      'atl1', 'M_adulto_decatlo', 'evt1', dadosBase, componentes
    );
    const ids = inscricoes.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('retorna vazio quando sem componentes', () => {
    const inscricoes = CombinedEventEngine.inscreverAtletaNasComponentes(
      'atl1', 'M_adulto_decatlo', 'evt1', dadosBase, []
    );
    expect(inscricoes).toEqual([]);
  });

  it('retorna vazio quando componentes é null', () => {
    const inscricoes = CombinedEventEngine.inscreverAtletaNasComponentes(
      'atl1', 'M_adulto_decatlo', 'evt1', dadosBase, null
    );
    expect(inscricoes).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// isInscricaoProtegida
// ═══════════════════════════════════════════════════════════════════════════════
describe('CombinedEventEngine.isInscricaoProtegida', () => {
  it('true para inscrição oriunda de combinada', () => {
    expect(CombinedEventEngine.isInscricaoProtegida({ origemCombinada: true })).toBe(true);
  });

  it('false para inscrição normal', () => {
    expect(CombinedEventEngine.isInscricaoProtegida({ origemCombinada: false })).toBe(false);
    expect(CombinedEventEngine.isInscricaoProtegida({})).toBe(false);
  });

  it('falsy para null/undefined', () => {
    expect(CombinedEventEngine.isInscricaoProtegida(null)).toBeFalsy();
    expect(CombinedEventEngine.isInscricaoProtegida(undefined)).toBeFalsy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getInscricoesComponentesParaRemover
// ═══════════════════════════════════════════════════════════════════════════════
describe('CombinedEventEngine.getInscricoesComponentesParaRemover', () => {
  const inscricoes = [
    { id: 'i1', eventoId: 'evt1', atletaId: 'atl1', combinadaId: 'M_adulto_decatlo', origemCombinada: true },
    { id: 'i2', eventoId: 'evt1', atletaId: 'atl1', combinadaId: 'M_adulto_decatlo', origemCombinada: true },
    { id: 'i3', eventoId: 'evt1', atletaId: 'atl2', combinadaId: 'M_adulto_decatlo', origemCombinada: true },
    { id: 'i4', eventoId: 'evt1', atletaId: 'atl1', combinadaId: 'F_adulto_heptatlo', origemCombinada: true },
    { id: 'i5', eventoId: 'evt2', atletaId: 'atl1', combinadaId: 'M_adulto_decatlo', origemCombinada: true },
    { id: 'i6', eventoId: 'evt1', atletaId: 'atl1', provaId: 'M_adulto_100m' }, // inscrição normal
  ];

  it('retorna apenas IDs do atleta/combinada/evento corretos', () => {
    const ids = CombinedEventEngine.getInscricoesComponentesParaRemover(
      inscricoes, 'atl1', 'M_adulto_decatlo', 'evt1'
    );
    expect(ids).toEqual(['i1', 'i2']);
  });

  it('não inclui inscrições de outro atleta', () => {
    const ids = CombinedEventEngine.getInscricoesComponentesParaRemover(
      inscricoes, 'atl1', 'M_adulto_decatlo', 'evt1'
    );
    expect(ids).not.toContain('i3');
  });

  it('não inclui inscrições de outro evento', () => {
    const ids = CombinedEventEngine.getInscricoesComponentesParaRemover(
      inscricoes, 'atl1', 'M_adulto_decatlo', 'evt1'
    );
    expect(ids).not.toContain('i5');
  });

  it('retorna vazio quando não há match', () => {
    const ids = CombinedEventEngine.getInscricoesComponentesParaRemover(
      inscricoes, 'atl99', 'M_adulto_decatlo', 'evt1'
    );
    expect(ids).toEqual([]);
  });
});
