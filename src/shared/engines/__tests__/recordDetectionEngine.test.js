import { describe, it, expect, vi } from 'vitest';
import { RecordDetectionEngine } from '../recordDetectionEngine';
import { RecordHelper } from '../recordHelper';

// ═══════════════════════════════════════════════════════════════════════════════
// _compararMarca
// ═══════════════════════════════════════════════════════════════════════════════
describe('RecordDetectionEngine._compararMarca', () => {
  it('"novo" quando não existe registro', () => {
    expect(RecordDetectionEngine._compararMarca(10.5, null, 's')).toBe('novo');
  });

  it('"superou" quando tempo é menor (pista)', () => {
    const reg = { marca: '10.50' };
    expect(RecordDetectionEngine._compararMarca(10.30, reg, 's')).toBe('superou');
  });

  it('"igualou" quando tempo é igual (pista)', () => {
    const reg = { marca: '10.50' };
    expect(RecordDetectionEngine._compararMarca(10.50, reg, 's')).toBe('igualou');
  });

  it('null quando tempo é pior (pista)', () => {
    const reg = { marca: '10.50' };
    expect(RecordDetectionEngine._compararMarca(10.80, reg, 's')).toBeNull();
  });

  it('"superou" quando marca é maior (campo)', () => {
    const reg = { marca: '7.50' };
    expect(RecordDetectionEngine._compararMarca(7.80, reg, 'm')).toBe('superou');
  });

  it('"igualou" quando marca é igual (campo)', () => {
    const reg = { marca: '7.50' };
    expect(RecordDetectionEngine._compararMarca(7.50, reg, 'm')).toBe('igualou');
  });

  it('null quando marca é pior (campo)', () => {
    const reg = { marca: '7.50' };
    expect(RecordDetectionEngine._compararMarca(7.20, reg, 'm')).toBeNull();
  });

  it('null para marca inválida (NaN)', () => {
    const reg = { marca: '10.50' };
    expect(RecordDetectionEngine._compararMarca(NaN, reg, 's')).toBeNull();
  });

  it('"novo" quando registro tem marca inválida', () => {
    const reg = { marca: 'abc' };
    expect(RecordDetectionEngine._compararMarca(10.50, reg, 's')).toBe('novo');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// _getPool — expansão de tipos de recorde
// ═══════════════════════════════════════════════════════════════════════════════
describe('RecordDetectionEngine._getPool', () => {
  const recordes = [
    { id: 'rec1', nome: 'RE-SP', escopo: 'estado', estado: 'SP', pais: 'Brasil', registros: [] },
    { id: 'rec2', nome: 'RE-RJ', escopo: 'estado', estado: 'RJ', pais: 'Brasil', registros: [] },
    { id: 'rec3', nome: 'RB', escopo: 'pais', pais: 'Brasil', registros: [] },
    { id: 'rec4', nome: 'RM', escopo: 'mundial', registros: [] },
  ];

  it('expande para todos os estados do país quando selecionou um estadual', () => {
    const evento = { recordesSumulas: ['rec1'] };
    const pool = RecordDetectionEngine._getPool(evento, recordes);
    const ids = pool.map(p => p.id);
    // Deve incluir rec1 (selecionado) e rec2 (mesmo país, mesmo escopo estado)
    expect(ids).toContain('rec1');
    expect(ids).toContain('rec2');
  });

  it('expande para estados quando selecionou recorde nacional', () => {
    const evento = { recordesSumulas: ['rec3'] };
    const pool = RecordDetectionEngine._getPool(evento, recordes);
    const ids = pool.map(p => p.id);
    expect(ids).toContain('rec3');
    expect(ids).toContain('rec1');
    expect(ids).toContain('rec2');
  });

  it('retorna vazio sem recordesSumulas', () => {
    const evento = { recordesSumulas: [] };
    const pool = RecordDetectionEngine._getPool(evento, recordes);
    expect(pool).toHaveLength(0);
  });

  it('inclui recordes vinculados por competicoesVinculadas', () => {
    const recComVinculo = [
      { id: 'rec5', nome: 'Especial', escopo: 'estado', estado: 'MG', pais: 'Brasil', registros: [], competicoesVinculadas: ['evt1'] },
      ...recordes,
    ];
    const evento = { id: 'evt1', recordesSumulas: [] };
    const pool = RecordDetectionEngine._getPool(evento, recComVinculo);
    const ids = pool.map(p => p.id);
    expect(ids).toContain('rec5');
    // Expandiu para outros estados do mesmo país
    expect(ids).toContain('rec1');
    expect(ids).toContain('rec2');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// detectarQuebras — cenários básicos
// ═══════════════════════════════════════════════════════════════════════════════
describe('RecordDetectionEngine.detectarQuebras', () => {
  const atletas = [
    { id: 'atl1', nome: 'João', equipeId: 'eq1', cbat: '12345' },
    { id: 'atl2', nome: 'Maria', equipeId: 'eq1', cbat: '67890' },
  ];
  const equipes = [
    { id: 'eq1', nome: 'Clube A', clube: 'Clube A', estado: 'SP' },
  ];

  it('detecta quebra de recorde em prova de pista', () => {
    const evento = {
      id: 'evt1', nome: 'Campeonato', uf: 'SP',
      recordesSumulas: ['rec1'],
      provasPrograma: ['M_adulto_100m'],
    };
    const recordes = [{
      id: 'rec1', nome: 'RE-SP', escopo: 'estado', estado: 'SP', pais: 'Brasil',
      registros: [{
        provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M',
        marca: '10.50', provaNome: '100m',
        detentores: [{ atleta: 'Antigo', equipe: 'X', atletaId: 'old1' }],
      }],
    }];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': {
        atl1: { marca: 10.30 },
      },
    };

    const pendencias = RecordDetectionEngine.detectarQuebras(
      evento, resultados, recordes, atletas, equipes, []
    );
    expect(pendencias.length).toBeGreaterThanOrEqual(1);
    const p = pendencias.find(pp => pp.atletaId === 'atl1');
    expect(p).toBeDefined();
    expect(p.tipoQuebra).toBe('superou');
    expect(p.marca).toBe('10.3');
    expect(p.relevancia).toBe('local'); // evento e recorde são do mesmo estado
  });

  it('detecta marca igualada', () => {
    const evento = {
      id: 'evt1', nome: 'Campeonato', uf: 'SP',
      recordesSumulas: ['rec1'],
    };
    const recordes = [{
      id: 'rec1', nome: 'RE-SP', escopo: 'estado', estado: 'SP', pais: 'Brasil',
      registros: [{
        provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M',
        marca: '10.50', provaNome: '100m',
        detentores: [{ atleta: 'Antigo', equipe: 'X', atletaId: 'old1' }],
      }],
    }];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': {
        atl1: { marca: 10.50 },
      },
    };
    const pendencias = RecordDetectionEngine.detectarQuebras(
      evento, resultados, recordes, atletas, equipes, []
    );
    const p = pendencias.find(pp => pp.atletaId === 'atl1');
    expect(p).toBeDefined();
    expect(p.tipoQuebra).toBe('igualou');
  });

  it('detecta novo recorde (sem registro existente)', () => {
    const evento = {
      id: 'evt1', nome: 'Campeonato', uf: 'SP',
      recordesSumulas: ['rec1'],
    };
    const recordes = [{
      id: 'rec1', nome: 'RE-SP', escopo: 'estado', estado: 'SP', pais: 'Brasil',
      registros: [], // nenhum registro
    }];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': {
        atl1: { marca: 10.50 },
      },
    };
    const pendencias = RecordDetectionEngine.detectarQuebras(
      evento, resultados, recordes, atletas, equipes, []
    );
    const p = pendencias.find(pp => pp.atletaId === 'atl1');
    expect(p).toBeDefined();
    expect(p.tipoQuebra).toBe('novo');
  });

  it('ignora atletas com DNS/DNF/DQ', () => {
    const evento = {
      id: 'evt1', nome: 'Camp', uf: 'SP',
      recordesSumulas: ['rec1'],
    };
    const recordes = [{
      id: 'rec1', nome: 'RE-SP', escopo: 'estado', estado: 'SP', pais: 'Brasil',
      registros: [{
        provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M',
        marca: '10.50', provaNome: '100m',
        detentores: [{ atleta: 'X' }],
      }],
    }];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': {
        atl1: { marca: 'DNS', status: 'DNS' },
      },
    };
    const pendencias = RecordDetectionEngine.detectarQuebras(
      evento, resultados, recordes, atletas, equipes, []
    );
    expect(pendencias).toHaveLength(0);
  });

  it('ignora atleta sem CBAt', () => {
    const atletasSemCbat = [{ id: 'atl1', nome: 'Sem CBAt', equipeId: 'eq1' }];
    const evento = {
      id: 'evt1', nome: 'Camp', uf: 'SP',
      recordesSumulas: ['rec1'],
    };
    const recordes = [{
      id: 'rec1', nome: 'RE-SP', escopo: 'estado', estado: 'SP', pais: 'Brasil',
      registros: [{
        provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M',
        marca: '10.50', provaNome: '100m', detentores: [],
      }],
    }];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': { atl1: { marca: 10.00 } },
    };
    const pendencias = RecordDetectionEngine.detectarQuebras(
      evento, resultados, recordes, atletasSemCbat, equipes, []
    );
    expect(pendencias).toHaveLength(0);
  });

  it('ignora prova com vento > 2.0 m/s', () => {
    const evento = {
      id: 'evt1', nome: 'Camp', uf: 'SP',
      recordesSumulas: ['rec1'],
    };
    const recordes = [{
      id: 'rec1', nome: 'RE-SP', escopo: 'estado', estado: 'SP', pais: 'Brasil',
      registros: [{
        provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M',
        marca: '10.50', provaNome: '100m', detentores: [],
      }],
    }];
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': {
        atl1: { marca: 10.00, vento: '2.1' },
      },
    };
    const pendencias = RecordDetectionEngine.detectarQuebras(
      evento, resultados, recordes, atletas, equipes, []
    );
    expect(pendencias).toHaveLength(0);
  });

  it('retorna vazio sem dados', () => {
    expect(RecordDetectionEngine.detectarQuebras(null, {}, [], [], [], [])).toEqual([]);
    expect(RecordDetectionEngine.detectarQuebras({}, null, [], [], [], [])).toEqual([]);
  });

  it('usa snapshot quando disponível', () => {
    const evento = {
      id: 'evt1', nome: 'Camp', uf: 'SP',
      recordesSumulas: ['rec1'],
      recordesSnapshot: {
        rec1: [{
          provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M',
          marca: '10.80', provaNome: '100m', detentores: [],
        }],
      },
    };
    const recordes = [{
      id: 'rec1', nome: 'RE-SP', escopo: 'estado', estado: 'SP', pais: 'Brasil',
      registros: [{
        provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M',
        marca: '10.50', provaNome: '100m', detentores: [],
      }],
    }];
    // Marca 10.60: melhor que snapshot (10.80) mas pior que current (10.50)
    // Deve comparar contra snapshot → detectar quebra
    const resultados = {
      'evt1_M_adulto_100m_adulto_M': { atl1: { marca: 10.60 } },
    };
    const pendencias = RecordDetectionEngine.detectarQuebras(
      evento, resultados, recordes, atletas, equipes, []
    );
    const p = pendencias.find(pp => pp.atletaId === 'atl1');
    expect(p).toBeDefined();
    expect(p.tipoQuebra).toBe('superou');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// mesclarPendencias — idempotência
// ═══════════════════════════════════════════════════════════════════════════════
describe('RecordDetectionEngine.mesclarPendencias', () => {
  it('adiciona pendências novas sem duplicar', () => {
    const existentes = [{ _chave: 'a_b_c', id: 'p1' }];
    const novas = [
      { _chave: 'a_b_c', id: 'p2' }, // duplicada
      { _chave: 'd_e_f', id: 'p3' }, // nova
    ];
    const resultado = RecordDetectionEngine.mesclarPendencias(existentes, novas);
    expect(resultado).toHaveLength(2);
    expect(resultado.map(p => p._chave)).toEqual(['a_b_c', 'd_e_f']);
  });

  it('funciona com existentes vazio', () => {
    const novas = [{ _chave: 'a', id: 'p1' }];
    const resultado = RecordDetectionEngine.mesclarPendencias([], novas);
    expect(resultado).toHaveLength(1);
  });

  it('funciona com existentes null', () => {
    const novas = [{ _chave: 'a', id: 'p1' }];
    const resultado = RecordDetectionEngine.mesclarPendencias(null, novas);
    expect(resultado).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// aplicarHomologacao
// ═══════════════════════════════════════════════════════════════════════════════
describe('RecordDetectionEngine.aplicarHomologacao', () => {
  const baseRecordes = [{
    id: 'rec1', nome: 'RE-SP',
    registros: [{
      id: 'r1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M',
      marca: '10.50', unidade: 's',
      detentores: [{ atleta: 'Antigo', equipe: 'X', atletaId: 'old1' }],
    }],
  }];

  it('homologação "superou" substitui detentores', () => {
    const pendencia = {
      id: 'pend1', recordeTipoId: 'rec1', provaId: 'M_adulto_100m',
      categoriaId: 'adulto', sexo: 'M', marca: '10.30',
      atletaNome: 'João', equipeNome: 'Clube A', atletaId: 'atl1',
      tipoQuebra: 'superou', eventoId: 'evt1', eventoNome: 'Camp',
      provaNome: '100m', unidade: 's',
      recordeAtual: { marca: '10.50', detentores: [{ atleta: 'Antigo' }] },
    };
    const { recordesAtualizados, novoHistorico } = RecordDetectionEngine.aplicarHomologacao(
      pendencia, baseRecordes, 'admin1'
    );
    const reg = recordesAtualizados[0].registros.find(
      r => r.provaId === 'M_adulto_100m' && r.categoriaId === 'adulto' && r.sexo === 'M'
    );
    expect(reg.marca).toBe('10.30');
    expect(reg.detentores).toHaveLength(1);
    expect(reg.detentores[0].atleta).toBe('João');
    expect(novoHistorico.tipoAcao).toBe('superou');
    expect(novoHistorico.adminId).toBe('admin1');
  });

  it('homologação "igualou" adiciona co-detentor', () => {
    const pendencia = {
      id: 'pend2', recordeTipoId: 'rec1', provaId: 'M_adulto_100m',
      categoriaId: 'adulto', sexo: 'M', marca: '10.50',
      atletaNome: 'Maria', equipeNome: 'Clube B', atletaId: 'atl2',
      tipoQuebra: 'igualou', eventoId: 'evt1', eventoNome: 'Camp',
      provaNome: '100m', unidade: 's',
      recordeAtual: { marca: '10.50', detentores: [{ atleta: 'Antigo', atletaId: 'old1' }] },
    };
    const { recordesAtualizados } = RecordDetectionEngine.aplicarHomologacao(
      pendencia, baseRecordes, 'admin1'
    );
    const reg = recordesAtualizados[0].registros.find(
      r => r.provaId === 'M_adulto_100m' && r.categoriaId === 'adulto' && r.sexo === 'M'
    );
    expect(reg.detentores).toHaveLength(2);
    expect(reg.detentores[1].atleta).toBe('Maria');
  });

  it('homologação "novo" cria registro', () => {
    const recordesSemRegistro = [{ id: 'rec1', nome: 'RE-SP', registros: [] }];
    const pendencia = {
      id: 'pend3', recordeTipoId: 'rec1', provaId: 'M_adulto_200m',
      categoriaId: 'adulto', sexo: 'M', marca: '21.50',
      atletaNome: 'Carlos', equipeNome: 'Clube C', atletaId: 'atl3',
      tipoQuebra: 'novo', eventoId: 'evt1', eventoNome: 'Camp',
      provaNome: '200m', unidade: 's',
      recordeAtual: null,
    };
    const { recordesAtualizados } = RecordDetectionEngine.aplicarHomologacao(
      pendencia, recordesSemRegistro, 'admin1'
    );
    expect(recordesAtualizados[0].registros).toHaveLength(1);
    expect(recordesAtualizados[0].registros[0].marca).toBe('21.50');
    expect(recordesAtualizados[0].registros[0].detentores[0].atleta).toBe('Carlos');
  });

  it('não duplica co-detentor se já existe', () => {
    const recComDetentor = [{
      id: 'rec1', nome: 'RE-SP',
      registros: [{
        id: 'r1', provaId: 'M_adulto_100m', categoriaId: 'adulto', sexo: 'M',
        marca: '10.50', unidade: 's',
        detentores: [{ atleta: 'João', equipe: 'A', atletaId: 'atl1', competicaoId: 'evt1' }],
      }],
    }];
    const pendencia = {
      id: 'pend4', recordeTipoId: 'rec1', provaId: 'M_adulto_100m',
      categoriaId: 'adulto', sexo: 'M', marca: '10.50',
      atletaNome: 'João', equipeNome: 'A', atletaId: 'atl1',
      tipoQuebra: 'igualou', eventoId: 'evt1', eventoNome: 'Camp',
      provaNome: '100m', unidade: 's',
      recordeAtual: { marca: '10.50', detentores: [{ atleta: 'João', atletaId: 'atl1', competicaoId: 'evt1' }] },
    };
    const { recordesAtualizados } = RecordDetectionEngine.aplicarHomologacao(
      pendencia, recComDetentor, 'admin1'
    );
    const reg = recordesAtualizados[0].registros[0];
    expect(reg.detentores).toHaveLength(1); // não duplicou
  });
});
