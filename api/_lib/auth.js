const { admin } = require('./firestore');

/**
 * Verifica token Firebase do header Authorization: Bearer <token>
 * Retorna o decoded token ou null se inválido.
 */
async function verificarToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split('Bearer ')[1];
  if (!token) return null;

  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
}

/**
 * Verifica se o caller é o admin do sistema (email no adminConfig do Firestore).
 */
async function verificarAdmin(decodedToken) {
  if (!decodedToken?.email) return false;
  const { db } = require('./firestore');
  const snap = await db.doc('state/atl_adminConfig').get();
  const adminEmail = (snap.exists && snap.data()?.value?.email || '').toLowerCase();
  return adminEmail && decodedToken.email.toLowerCase() === adminEmail;
}

module.exports = { verificarToken, verificarAdmin };
