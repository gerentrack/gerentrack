const admin = require('firebase-admin');

let initError = null;

if (!admin.apps.length) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT não definida');
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err) {
    initError = err.message;
    console.error('Erro ao inicializar firebase-admin:', err.message);
    try {
      admin.initializeApp({ projectId: 'gerentrack-b88b5' });
    } catch (e) {
      console.error('Fallback também falhou:', e.message);
    }
  }
}

const db = admin.firestore();

module.exports = { admin, db, initError };
