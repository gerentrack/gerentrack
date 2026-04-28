const { db } = require('./_lib/firestore');
const { verificarToken } = require('./_lib/auth');

/**
 * POST /api/validar-inscricao
 * Body: { eventoId, atletaId, catId, novasProvas: ["100m", "200m"] }
 *
 * Valida se um atleta pode ser inscrito nas provas solicitadas.
 * Verifica: limite de provas por categoria.
 *
 * Requer autenticação via token Firebase.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const decoded = await verificarToken(req);
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido ou ausente' });
  }

  const { eventoId, atletaId, catId, novasProvas } = req.body || {};

  if (!eventoId) {
    return res.status(400).json({ error: 'eventoId é obrigatório' });
  }
  if (!novasProvas || !Array.isArray(novasProvas) || novasProvas.length === 0) {
    return res.status(400).json({ error: 'novasProvas deve ser um array não vazio de IDs de provas' });
  }

  try {
    // Buscar evento e inscrições em paralelo
    const [eventoDoc, inscricoesSnap] = await Promise.all([
      db.collection('eventos').doc(eventoId).get(),
      db.collection('inscricoes').where('eventoId', '==', eventoId).get(),
    ]);

    if (!eventoDoc.exists) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    const evento = { id: eventoDoc.id, ...eventoDoc.data() };
    const inscricoes = [];
    inscricoesSnap.forEach(doc => inscricoes.push({ id: doc.id, ...doc.data() }));

    // Validar limite de provas por categoria
    const resultado = validarLimiteProvas(evento, inscricoes, atletaId || null, catId || null, novasProvas);

    return res.status(200).json(resultado);
  } catch (err) {
    console.error('Erro ao validar inscrição:', err);
    return res.status(500).json({ error: 'Erro interno ao validar inscrição' });
  }
};

// ─── Lógica de validação (replicada do inscricaoEngine.js) ─────────────────

function getLimiteCat(evento, catId) {
  if (!evento) return 0;
  if (catId) {
    const limCat = evento.limitesProvasCat;
    if (limCat && typeof limCat === 'object') {
      const v = limCat[catId];
      if (v != null && v !== '') {
        const n = parseInt(v);
        if (!isNaN(n) && n >= 0) return n;
      }
    }
  }
  return parseInt(evento.limiteProvasIndividual) || 0;
}

function validarLimiteProvas(evento, inscricoes, atletaId, catId, novasProvas) {
  const lim = getLimiteCat(evento, catId);
  const excecoes = new Set(evento?.provasExcetoLimite || []);

  const inscAtual = (atletaId && inscricoes)
    ? inscricoes.filter(i =>
        i.eventoId === evento.id &&
        i.atletaId === atletaId &&
        !excecoes.has(i.provaId)
      ).length
    : 0;

  const novasContam = (novasProvas || []).filter(pId => !excecoes.has(pId)).length;
  const restantes = lim > 0 ? lim - inscAtual - novasContam : Infinity;

  if (lim > 0 && inscAtual + novasContam > lim) {
    return {
      ok: false,
      msg: `Limite de ${lim} prova(s) individual(is) por atleta na categoria ${catId || 'selecionada'}. Já inscrito: ${inscAtual}${novasContam > 0 ? `, novas que contam no limite: ${novasContam}` : ''}.`,
      lim,
      inscAtual,
      novasContam,
      restantes: 0,
    };
  }

  return { ok: true, lim, inscAtual, novasContam, restantes: restantes === Infinity ? -1 : restantes };
}
