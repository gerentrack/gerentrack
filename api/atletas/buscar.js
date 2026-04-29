const { supabase } = require('../_lib/supabase');
const { verificarToken } = require('../_lib/auth');

/**
 * GET /api/atletas/buscar?q=joao&limit=20
 *
 * Busca atletas no PostgreSQL por nome, CBAt ou CPF.
 * Retorna dados consolidados cross-competição.
 *
 * Requer autenticação via token Firebase.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const decoded = await verificarToken(req);
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido ou ausente' });
  }

  const { q, limit = 20 } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Parâmetro "q" deve ter pelo menos 2 caracteres' });
  }

  const termo = q.trim();
  const lim = Math.min(parseInt(limit) || 20, 100);

  try {
    // Detectar tipo de busca
    const somenteDigitos = /^\d+$/.test(termo.replace(/[.\-/]/g, ''));

    let query;
    if (somenteDigitos) {
      // Busca por CPF ou CBAt (numérico)
      const digitos = termo.replace(/\D/g, '');
      query = supabase
        .from('atletas')
        .select('id, nome, sexo, ano_nasc, cpf, cbat, equipe_id, clube')
        .or(`cpf.ilike.%${digitos}%,cbat.ilike.%${digitos}%`)
        .limit(lim);
    } else {
      // Busca por nome (case-insensitive)
      query = supabase
        .from('atletas')
        .select('id, nome, sexo, ano_nasc, cpf, cbat, equipe_id, clube')
        .ilike('nome', `%${termo}%`)
        .limit(lim);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Enriquecer com nome da equipe
    const equipeIds = [...new Set((data || []).filter(a => a.equipe_id).map(a => a.equipe_id))];
    let equipesMap = {};
    if (equipeIds.length > 0) {
      const { data: eqs } = await supabase
        .from('equipes')
        .select('id, nome, sigla')
        .in('id', equipeIds);
      (eqs || []).forEach(eq => { equipesMap[eq.id] = eq; });
    }

    const resultados = (data || []).map(a => ({
      ...a,
      equipe_nome: a.equipe_id && equipesMap[a.equipe_id] ? equipesMap[a.equipe_id].nome : a.clube || null,
      equipe_sigla: a.equipe_id && equipesMap[a.equipe_id] ? equipesMap[a.equipe_id].sigla : null,
    }));

    return res.status(200).json({
      q: termo,
      total: resultados.length,
      atletas: resultados,
    });
  } catch (err) {
    console.error('Erro ao buscar atletas:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar atletas' });
  }
};
