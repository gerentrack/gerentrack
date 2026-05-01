/**
 * Rate limiter in-memory para API routes internas.
 * Sliding window de 1 minuto, por IP + endpoint.
 *
 * Limites default por endpoint (override via RATE_LIMITS):
 *   /api/resultados/consolidar    → 10/min (operação pesada)
 *   /api/resultados/desfinalizar  → 10/min
 *   /api/resultados/migrar-*      → 5/min
 *   /api/resultados/recalcular-*  → 10/min
 *   /api/ranking                  → 30/min
 *   /api/recordes                 → 30/min
 *   /api/validar-inscricao        → 60/min
 *   /api/atletas/*                → 30/min
 *   /api/og                       → 60/min (crawlers)
 *   /api/health                   → sem limite
 *   default                       → 60/min
 */

const RATE_LIMITS = {
  '/api/resultados/consolidar':         10,
  '/api/resultados/desfinalizar':       10,
  '/api/resultados/migrar-historico':    5,
  '/api/resultados/recalcular-posicoes': 10,
  '/api/ranking':                       30,
  '/api/recordes':                      30,
  '/api/validar-inscricao':             60,
  '/api/atletas/buscar':                30,
  '/api/atletas/historico':             30,
  '/api/og':                            60,
};

const DEFAULT_LIMIT = 60;
const EXEMPT = new Set(['/api/health', '/api/ping']);

const windows = new Map();

/**
 * @param {string} ip — IP do cliente
 * @param {string} endpoint — path sem query string (ex: /api/ranking)
 * @returns {{ allowed: boolean, remaining: number, limit: number, resetAt: number }}
 */
function checkRateLimit(ip, endpoint) {
  if (EXEMPT.has(endpoint)) {
    return { allowed: true, remaining: 999, limit: 999, resetAt: 0 };
  }

  const limit = RATE_LIMITS[endpoint] || DEFAULT_LIMIT;
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const cutoff = now - windowMs;

  if (!windows.has(key)) windows.set(key, []);

  const timestamps = windows.get(key).filter(ts => ts > cutoff);
  timestamps.push(now);
  windows.set(key, timestamps);

  const remaining = Math.max(0, limit - timestamps.length);
  const resetAt = Math.ceil((cutoff + windowMs) / 1000);

  return {
    allowed: timestamps.length <= limit,
    remaining,
    limit,
    resetAt,
  };
}

// Limpar entradas expiradas a cada 5 min (evita memory leak em cold starts longos)
setInterval(() => {
  const cutoff = Date.now() - 60 * 1000;
  for (const [key, timestamps] of windows) {
    const filtered = timestamps.filter(ts => ts > cutoff);
    if (filtered.length === 0) windows.delete(key);
    else windows.set(key, filtered);
  }
}, 5 * 60 * 1000);

module.exports = { checkRateLimit, RATE_LIMITS, EXEMPT };
