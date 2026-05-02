import { describe, it, expect, vi } from 'vitest';

// Env vars dummy — necessários para que os módulos CJS (firestore, supabase)
// inicializem sem lançar erro fatal na importação do health.js
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'test-key';

// Importa a função pura que aceita dependências injetáveis
const mod = await import('../health.js');
const healthCheck = mod._healthCheck;

// ─── Helpers ────────────────────────────────────────────────────────────────

function createDeps({ initError = null, getResult, selectResult } = {}) {
  const mockGet = typeof getResult === 'function'
    ? getResult
    : vi.fn().mockResolvedValue(getResult ?? { exists: true });
  const mockSelect = typeof selectResult === 'function'
    ? selectResult
    : vi.fn().mockResolvedValue(selectResult ?? { error: null });

  return {
    initError,
    db: { collection: () => ({ doc: () => ({ get: mockGet }) }) },
    supabase: { from: vi.fn().mockReturnValue({ select: mockSelect }) },
  };
}

function createRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    setHeader(key, value) { this.headers[key] = value; },
  };
  return res;
}

// ─── Testes ─────────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('retorna 200 quando Firestore e Supabase estão ok', async () => {
    const deps = createDeps();
    const res = createRes();
    await healthCheck({ method: 'GET' }, res, deps);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.firestore).toBe('ok');
    expect(res.body.supabase).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('retorna 405 para métodos não permitidos', async () => {
    const res = createRes();
    await healthCheck({ method: 'POST' }, res, createDeps());

    expect(res.statusCode).toBe(405);
    expect(res.body.error).toBe('Método não permitido');
  });

  it('aceita método HEAD', async () => {
    const res = createRes();
    await healthCheck({ method: 'HEAD' }, res, createDeps());

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('retorna 503 com init_error quando Firestore falha na inicialização', async () => {
    const deps = createDeps({ initError: 'FIREBASE_SERVICE_ACCOUNT não definida' });
    const res = createRes();
    await healthCheck({ method: 'GET' }, res, deps);

    expect(res.statusCode).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.firestore).toBe('init_error');
    expect(res.body.detail).toBe('FIREBASE_SERVICE_ACCOUNT não definida');
  });

  it('retorna degraded quando Firestore get falha', async () => {
    const deps = createDeps({
      getResult: vi.fn().mockRejectedValue(new Error('Firestore timeout')),
    });
    const res = createRes();
    await healthCheck({ method: 'GET' }, res, deps);

    expect(res.statusCode).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.firestore).toBe('error');
    expect(res.body.detail).toBe('Firestore timeout');
    expect(res.body.supabase).toBe('ok');
  });

  it('retorna degraded quando Supabase retorna erro', async () => {
    const deps = createDeps({
      selectResult: vi.fn().mockResolvedValue({ error: { message: 'connection refused' } }),
    });
    const res = createRes();
    await healthCheck({ method: 'GET' }, res, deps);

    expect(res.statusCode).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.firestore).toBe('ok');
    expect(res.body.supabase).toBe('error');
    expect(res.body.supabaseDetail).toBe('connection refused');
  });

  it('retorna degraded quando Supabase lança exceção', async () => {
    const deps = createDeps({
      selectResult: vi.fn().mockRejectedValue(new Error('network error')),
    });
    const res = createRes();
    await healthCheck({ method: 'GET' }, res, deps);

    expect(res.statusCode).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.supabase).toBe('error');
    expect(res.body.supabaseDetail).toBe('network error');
  });

  it('retorna degraded quando ambos falham', async () => {
    const deps = createDeps({
      getResult: vi.fn().mockRejectedValue(new Error('Firestore down')),
      selectResult: vi.fn().mockResolvedValue({ error: { message: 'Supabase down' } }),
    });
    const res = createRes();
    await healthCheck({ method: 'GET' }, res, deps);

    expect(res.statusCode).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.firestore).toBe('error');
    expect(res.body.supabase).toBe('error');
  });

  it('retorna firestore empty quando doc não existe', async () => {
    const deps = createDeps({ getResult: { exists: false } });
    const res = createRes();
    await healthCheck({ method: 'GET' }, res, deps);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.firestore).toBe('empty');
  });

  it('inclui header Cache-Control no-cache', async () => {
    const res = createRes();
    await healthCheck({ method: 'GET' }, res, createDeps());

    expect(res.headers['Cache-Control']).toBe('no-cache, no-store');
  });

  it('pinga tabela competicoes no Supabase', async () => {
    const deps = createDeps();
    const res = createRes();
    await healthCheck({ method: 'GET' }, res, deps);

    expect(deps.supabase.from).toHaveBeenCalledWith('competicoes');
  });
});
