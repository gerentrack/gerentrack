const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT não definida');
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err) {
    console.error('Erro ao inicializar firebase-admin:', err.message);
    // Inicializar sem credenciais — vai falhar nas operações mas não crashar o módulo
    admin.initializeApp();
  }
}

const db = admin.firestore();

module.exports = { admin, db };
