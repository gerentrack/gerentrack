/**
 * GET /api/health
 *
 * Verifica conectividade com Firebase Firestore.
 * Usado pelo UptimeRobot para monitoramento real dos serviços.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const checks = { firestore: 'ok' };
  let status = 'ok';

  try {
    const { db } = require('./_lib/firestore');
    const snap = await db.collection('state').doc('atl_adminConfig').get();
    if (!snap.exists) {
      checks.firestore = 'empty';
    }
  } catch (err) {
    checks.firestore = 'error';
    checks.detail = err.message;
    status = 'degraded';
  }

  const code = status === 'ok' ? 200 : 503;
  res.setHeader('Cache-Control', 'no-cache, no-store');
  return res.status(code).json({
    status,
    ...checks,
    timestamp: new Date().toISOString(),
  });
};
