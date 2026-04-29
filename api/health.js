const { db, admin } = require('./_lib/firestore');

/**
 * GET /api/health
 *
 * Verifica conectividade com Firebase (Firestore + Auth).
 * Usado pelo UptimeRobot para monitoramento real dos serviços.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const checks = { firestore: 'ok', auth: 'ok' };
  let status = 'ok';

  // Verificar Firestore — leitura leve
  try {
    await db.collection('state').doc('atl_adminConfig').get();
  } catch {
    checks.firestore = 'error';
    status = 'degraded';
  }

  // Verificar Auth — listar 1 usuário
  try {
    await admin.auth().listUsers(1);
  } catch {
    checks.auth = 'error';
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
