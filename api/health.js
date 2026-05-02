const { withLogger } = require('./_lib/withLogger');
const { db, initError } = require('./_lib/firestore');
const { supabase } = require('./_lib/supabase');

/**
 * GET /api/health
 *
 * Verifica conectividade com Firebase Firestore e Supabase (PostgreSQL).
 * Usado pelo UptimeRobot para monitoramento real dos serviços.
 * O ping ao Supabase também evita que o projeto pause por inatividade (free tier).
 */
async function healthCheck(req, res, deps = { db, initError, supabase }) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const checks = { firestore: 'ok', supabase: 'ok' };
  let status = 'ok';

  try {
    if (deps.initError) {
      checks.firestore = 'init_error';
      checks.detail = deps.initError;
      status = 'degraded';
      const code = 503;
      res.setHeader('Cache-Control', 'no-cache, no-store');
      return res.status(code).json({ status, ...checks, timestamp: new Date().toISOString() });
    }
    const snap = await deps.db.collection('state').doc('atl_adminConfig').get();
    if (!snap.exists) {
      checks.firestore = 'empty';
    }
  } catch (err) {
    checks.firestore = 'error';
    checks.detail = err.message;
    status = 'degraded';
  }

  try {
    const { error } = await deps.supabase.from('competicoes').select('id', { count: 'exact', head: true });
    if (error) {
      checks.supabase = 'error';
      checks.supabaseDetail = error.message;
      status = 'degraded';
    }
  } catch (err) {
    checks.supabase = 'error';
    checks.supabaseDetail = err.message;
    status = 'degraded';
  }

  const code = status === 'ok' ? 200 : 503;
  res.setHeader('Cache-Control', 'no-cache, no-store');
  return res.status(code).json({
    status,
    ...checks,
    timestamp: new Date().toISOString(),
  });
}

module.exports = withLogger(healthCheck);
module.exports._healthCheck = healthCheck;
