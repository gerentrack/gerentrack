const { validarApiKey } = require('./apiKeyAuth');
const { checkRateLimit } = require('./rateLimiter');
const { parsePagination } = require('./pagination');

/**
 * Wrapper para endpoints da API pública v1.
 * Aplica: CORS → método → auth → rate limit → handler.
 */
function wrapHandler(handler) {
  return async function (req, res) {
    // CORS + Identificação
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-API-Key, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('X-Powered-By', 'GerenTrack');
    res.setHeader('X-Data-Source', 'gerentrack.com.br');
    if (req.method === 'OPTIONS') return res.status(204).end();

    // Apenas GET
    if (req.method !== 'GET') {
      return res.status(405).json({ erro: 'Método não permitido' });
    }

    // Autenticação
    const apiKey = await validarApiKey(req);
    if (!apiKey) {
      return res.status(401).json({
        erro: 'API key inválida ou ausente',
        detalhe: 'Envie sua chave no header X-API-Key',
      });
    }

    // Rate limiting
    const rl = checkRateLimit(apiKey.id, apiKey.rate_limit_per_min || 100);
    res.setHeader('X-RateLimit-Limit', rl.limit);
    res.setHeader('X-RateLimit-Remaining', rl.remaining);
    res.setHeader('X-RateLimit-Reset', rl.resetAt);
    if (!rl.allowed) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({
        erro: 'Limite de requisições excedido',
        detalhe: `Máximo ${rl.limit} requisições por minuto`,
      });
    }

    // Paginação
    const pagination = parsePagination(req.query);

    try {
      return await handler(req, res, { apiKey, pagination });
    } catch (err) {
      console.error('[API v1] Erro:', err);
      return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  };
}

module.exports = { wrapHandler };
