import { describe, it, expect } from 'vitest';
import { RecordHelper } from '../recordHelper';

describe('RecordHelper.getDetentores', () => {
  it('retorna array de detentores no formato novo', () => {
    const reg = { detentores: [{ atleta: 'João', equipe: 'A' }] };
    expect(RecordHelper.getDetentores(reg)).toEqual([{ atleta: 'João', equipe: 'A' }]);
  });

  it('converte formato antigo para array', () => {
    const reg = { atleta: 'Maria', equipe: 'B', atletaId: 'a1', ano: '2025', local: 'SP' };
    const det = RecordHelper.getDetentores(reg);
    expect(det).toHaveLength(1);
    expect(det[0].atleta).toBe('Maria');
    expect(det[0].equipe).toBe('B');
    expect(det[0].atletaId).toBe('a1');
  });

  it('retorna vazio para null/undefined', () => {
    expect(RecordHelper.getDetentores(null)).toEqual([]);
    expect(RecordHelper.getDetentores(undefined)).toEqual([]);
  });

  it('retorna vazio para registro sem detentores e sem atleta', () => {
    expect(RecordHelper.getDetentores({})).toEqual([]);
  });
});

describe('RecordHelper.getPrimeiro', () => {
  it('retorna primeiro detentor', () => {
    const reg = { detentores: [{ atleta: 'A' }, { atleta: 'B' }] };
    expect(RecordHelper.getPrimeiro(reg).atleta).toBe('A');
  });

  it('retorna objeto padrão sem detentores', () => {
    const p = RecordHelper.getPrimeiro({});
    expect(p.atleta).toBe('');
    expect(p.equipe).toBe('');
  });
});

describe('RecordHelper.getAtletaTexto', () => {
  it('retorna nome do atleta', () => {
    const reg = { detentores: [{ atleta: 'João' }] };
    expect(RecordHelper.getAtletaTexto(reg)).toBe('João');
  });

  it('retorna nomes de revezamento separados por vírgula', () => {
    const reg = { detentores: [{ atletasRevezamento: ['A', 'B', 'C'] }] };
    expect(RecordHelper.getAtletaTexto(reg)).toBe('A, B, C');
  });

  it('múltiplos detentores separados por /', () => {
    const reg = { detentores: [{ atleta: 'João' }, { atleta: 'Maria' }] };
    expect(RecordHelper.getAtletaTexto(reg)).toBe('João / Maria');
  });

  it('retorna "—" sem detentores', () => {
    expect(RecordHelper.getAtletaTexto({})).toBe('—');
  });
});

describe('RecordHelper.getEquipeTexto', () => {
  it('retorna equipes únicas', () => {
    const reg = { detentores: [{ equipe: 'A' }, { equipe: 'A' }, { equipe: 'B' }] };
    expect(RecordHelper.getEquipeTexto(reg)).toBe('A / B');
  });

  it('retorna "—" sem detentores', () => {
    expect(RecordHelper.getEquipeTexto({})).toBe('—');
  });

  it('retorna "—" quando equipes são vazias/null', () => {
    const reg = { detentores: [{ equipe: '' }, { equipe: null }] };
    expect(RecordHelper.getEquipeTexto(reg)).toBe('—');
  });
});

describe('RecordHelper.getAnoTexto', () => {
  it('retorna anos únicos', () => {
    const reg = { detentores: [{ ano: '2024' }, { ano: '2025' }] };
    expect(RecordHelper.getAnoTexto(reg)).toBe('2024 / 2025');
  });

  it('retorna "—" sem detentores', () => {
    expect(RecordHelper.getAnoTexto({})).toBe('—');
  });

  it('retorna "—" quando anos são vazios', () => {
    const reg = { detentores: [{ ano: '' }] };
    expect(RecordHelper.getAnoTexto(reg)).toBe('—');
  });
});

describe('RecordHelper.getLocalTexto', () => {
  it('retorna locais únicos', () => {
    const reg = { detentores: [{ local: 'SP' }, { local: 'RJ' }] };
    expect(RecordHelper.getLocalTexto(reg)).toBe('SP / RJ');
  });

  it('retorna "—" sem detentores', () => {
    expect(RecordHelper.getLocalTexto({})).toBe('—');
  });

  it('retorna "—" quando locais são vazios', () => {
    const reg = { detentores: [{ local: '' }] };
    expect(RecordHelper.getLocalTexto(reg)).toBe('—');
  });
});

describe('RecordHelper.migrar', () => {
  it('migra formato antigo para novo', () => {
    const reg = { id: 'r1', provaId: 'p1', atleta: 'João', equipe: 'A', atletaId: 'a1', ano: '2024', local: 'SP' };
    const migrado = RecordHelper.migrar(reg);
    expect(migrado.detentores).toHaveLength(1);
    expect(migrado.detentores[0].atleta).toBe('João');
    expect(migrado.atleta).toBeUndefined(); // removeu campos antigos
  });

  it('migra formato antigo com competicao e revezamento', () => {
    const reg = {
      id: 'r2', provaId: 'p2',
      atleta: 'Equipe', equipe: 'CA', atletaId: 'eq1',
      ano: '2025', local: 'RJ',
      competicaoId: 'evt1', competicaoNome: 'Camp',
      atletasRevezamento: ['A', 'B', 'C', 'D'],
    };
    const migrado = RecordHelper.migrar(reg);
    expect(migrado.detentores[0].competicaoId).toBe('evt1');
    expect(migrado.detentores[0].atletasRevezamento).toEqual(['A', 'B', 'C', 'D']);
    expect(migrado.competicaoId).toBeUndefined();
  });

  it('não altera registro já migrado', () => {
    const reg = { detentores: [{ atleta: 'João' }] };
    expect(RecordHelper.migrar(reg)).toBe(reg);
  });

  it('retorna null/undefined intactos', () => {
    expect(RecordHelper.migrar(null)).toBeNull();
  });
});

describe('RecordHelper.criar', () => {
  it('cria registro no formato correto', () => {
    const reg = RecordHelper.criar({
      categoriaId: 'adulto', sexo: 'M', provaId: 'p1', provaNome: '100m',
      marca: '10.50', unidade: 's', detentor: { atleta: 'João', equipe: 'A' },
    });
    expect(reg.detentores).toHaveLength(1);
    expect(reg.marca).toBe('10.50');
    expect(reg.id).toMatch(/^r_/);
  });

  it('cria registro com id customizado', () => {
    const reg = RecordHelper.criar({
      id: 'custom_id',
      categoriaId: 'adulto', sexo: 'M', provaId: 'p1', provaNome: '100m',
      marca: 7.50, detentor: { atleta: 'Maria', equipe: 'B' },
    });
    expect(reg.id).toBe('custom_id');
    expect(reg.marca).toBe('7.5'); // convertido para string
    expect(reg.unidade).toBe('s'); // default
    expect(reg.fonte).toBe('manual'); // default
  });
});

describe('RecordHelper.temRevezamento', () => {
  it('true quando detentor tem atletasRevezamento', () => {
    const reg = { detentores: [{ atletasRevezamento: ['A', 'B'] }] };
    expect(RecordHelper.temRevezamento(reg)).toBe(true);
  });

  it('false sem atletasRevezamento', () => {
    const reg = { detentores: [{ atleta: 'João' }] };
    expect(RecordHelper.temRevezamento(reg)).toBe(false);
  });
});
