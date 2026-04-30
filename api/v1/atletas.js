const { supabase } = require('../_lib/supabase');
const { wrapHandler } = require('./_lib/wrapHandler');
const { buildPaginacao } = require('./_lib/pagination');
const { sanitizeAtleta } = require('./_lib/sanitize');

/**
 * GET /api/v1/atletas
 *
 * Busca atletas no banco consolidado.
 *
 * Parâmetros:
 *   q         — busca por nome (mínimo 3 caracteres)
 *   cbat      — busca por registro CBAt
 *   equipe_id — filtrar por equipe
 *   sexo      — M ou F
 *   page, per_page — paginação (default: 1, 20)
 */
module.exports = wrapHandler(async (req, res, { pagination }) => {
  const { q, cbat, equipe_id, sexo } = req.query;

  if (!q && !cbat && !equipe_id) {
    return res.status(400).json({
      erro: 'Informe ao menos um filtro: q (nome, min 3 chars), cbat, ou equipe_id',
    });
  }

  if (q && q.trim().length < 3) {
    return res.status(400).json({ erro: 'Parâmetro "q" deve ter pelo menos 3 caracteres' });
  }

  let query = supabase
    .from('atletas')
    .select('id, nome, sexo, ano_nasc, cpf, cbat, equipe_id, clube', { count: 'exact' });

  if (q) query = query.ilike('nome', `%${q.trim()}%`);
  if (cbat) query = query.eq('cbat', cbat.trim());
  if (equipe_id) query = query.eq('equipe_id', equipe_id);
  if (sexo) query = query.eq('sexo', sexo.toUpperCase());

  query = query
    .order('nome', { ascending: true })
    .range(pagination.offset, pagination.offset + pagination.perPage - 1);

  const { data, error, count } = await query;
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

  const atletas = (data || []).map(a => {
    const sanitized = sanitizeAtleta(a);
    return {
      ...sanitized,
      equipe_nome: a.equipe_id && equipesMap[a.equipe_id] ? equipesMap[a.equipe_id].nome : a.clube || null,
      equipe_sigla: a.equipe_id && equipesMap[a.equipe_id] ? equipesMap[a.equipe_id].sigla : null,
    };
  });

  return res.status(200).json({
    dados: atletas,
    paginacao: buildPaginacao(pagination.page, pagination.perPage, count || 0),
  });
});
