const { db } = require('./_lib/firestore');
const { verificarToken } = require('./_lib/auth');
const { withLogger } = require('./_lib/withLogger');

/**
 * GET /api/ranking?uf=SP
 * GET /api/ranking?uf=all (ranking nacional — merge de todas as UFs)
 *
 * Retorna entradas de ranking por UF ou nacional.
 * Requer autenticação via token Firebase.
 */
module.exports = withLogger(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const decoded = await verificarToken(req);
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido ou ausente' });
  }

  const { uf } = req.query;
  if (!uf) {
    return res.status(400).json({ error: 'Parâmetro "uf" é obrigatório (ex: SP, MG, all)' });
  }

  try {
    let entradas = [];

    if (uf === 'all') {
      // Ranking nacional — merge de todos os documentos por UF
      const snapshot = await db.collection('ranking').get();
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.entradas && Array.isArray(data.entradas)) {
          entradas.push(...data.entradas);
        }
      });
    } else {
      // Ranking por UF específica
      const doc = await db.collection('ranking').doc(uf.toUpperCase()).get();
      if (doc.exists) {
        const data = doc.data();
        entradas = data.entradas || [];
      }
    }

    return res.status(200).json({
      uf: uf.toUpperCase(),
      total: entradas.length,
      entradas,
    });
  } catch (err) {
    console.error('Erro ao buscar ranking:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar ranking' });
  }
});
