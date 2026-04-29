const { supabase } = require('../_lib/supabase');
const { verificarToken } = require('../_lib/auth');

/**
 * POST /api/resultados/desfinalizar
 * Body: { eventoId }
 *
 * Marca competição como "revisao" no PostgreSQL ao desfinalizar.
 * Dados não são apagados — ficam excluídos de consultas públicas
 * até a próxima finalização (re-consolidação).
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const decoded = await verificarToken(req);
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido ou ausente' });
  }

  const { eventoId } = req.body || {};
  if (!eventoId) {
    return res.status(400).json({ error: 'eventoId é obrigatório' });
  }

  try {
    const { error } = await supabase
      .from('competicoes')
      .update({ status: 'revisao' })
      .eq('id', eventoId);

    if (error) {
      // Se não existe no PostgreSQL, tudo bem — nunca foi consolidada
      if (error.code === 'PGRST116') {
        return res.status(200).json({ ok: true, msg: 'Competição não encontrada no PostgreSQL (nunca consolidada)' });
      }
      throw error;
    }

    return res.status(200).json({ ok: true, eventoId, status: 'revisao' });
  } catch (err) {
    console.error('Erro ao desfinalizar no PostgreSQL:', err);
    return res.status(500).json({ error: 'Erro interno ao desfinalizar' });
  }
};
