const { setContext, info, warn, error } = require('./logger');
const { checkRateLimit } = require('./rateLimiter');

/**
 * Middleware wrapper para API routes internas.
 * Adiciona: request ID, rate limiting, timing, log de entrada/saída, catch de erros.
 *
 * Uso:
 *   module.exports = withLogger(async (req, res) => { ... });
 */
function withLogger(handler) {
  return async function (req, res) {
    const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const endpoint = req.url?.split('?')[0] || req.url;
    const start = Date.now();

    // Injetar requestId no response header
    res.setHeader('X-Request-Id', requestId);

    // Definir contexto para o logger
    setContext(requestId, endpoint);

    // Rate limiting por IP + endpoint
    const ip = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const rl = checkRateLimit(ip, endpoint);
    res.setHeader('X-RateLimit-Limit', rl.limit);
    res.setHeader('X-RateLimit-Remaining', rl.remaining);
    res.setHeader('X-RateLimit-Reset', rl.resetAt);
    if (!rl.allowed) {
      res.setHeader('Retry-After', '60');
      warn('rate_limited', { ip, limit: rl.limit });
      return res.status(429).json({ error: 'Limite de requisições excedido. Tente novamente em 1 minuto.' });
    }

    info('request', {
      method: req.method,
      query: req.query,
      userAgent: req.headers?.['user-agent']?.slice(0, 120),
    });

    // Interceptar res.status().json() para logar resposta automaticamente
    const originalJson = res.json.bind(res);
    let logged = false;
    res.json = function (body) {
      if (!logged) {
        logged = true;
        const duration = Date.now() - start;
        const status = res.statusCode || 200;
        const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
        const logFn = level === 'error' ? error : level === 'warn' ? require('./logger').warn : info;
        logFn('response', { status, duration, ...(status >= 400 ? { errorBody: body?.error || body?.erro } : {}) });
      }
      return originalJson(body);
    };

    try {
      return await handler(req, res);
    } catch (err) {
      const duration = Date.now() - start;
      error('unhandled_error', {
        status: 500,
        duration,
        error: err.message,
        stack: err.stack?.split('\n').slice(0, 3).join(' | '),
      });
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
    } finally {
      setContext(null, null);
    }
  };
}

module.exports = { withLogger };
