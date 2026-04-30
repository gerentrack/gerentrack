const { supabase } = require('../_lib/supabase');
const { wrapHandler } = require('./_lib/wrapHandler');
const { buildPaginacao } = require('./_lib/pagination');

/**
 * GET /api/v1/resultados
 *
 * Consulta resultados consolidados de competições.
 *
 * Parâmetros:
 *   competicao_id   — filtrar por ID da competição
 *   competicao_slug — filtrar por slug da competição
 *   prova_id        — filtrar por prova (ex: "100m")
 *   categoria_id    — filtrar por categoria (ex: "Sub-16")
 *   sexo            — M ou F
 *   atleta_id       — filtrar por atleta
 *   fase            — Eliminatória, Semifinal, Final (default: todos)
 *   page, per_page  — paginação (default: 1, 20)
 */
module.exports = wrapHandler(async (req, res, { pagination }) => {
  const { competicao_id, competicao_slug, prova_id, categoria_id, sexo, atleta_id, fase } = req.query;

  // Resolver slug → id se necessário
  let compId = competicao_id;
  if (!compId && competicao_slug) {
    const { data: comp } = await supabase
      .from('competicoes')
      .select('id')
      .eq('slug', competicao_slug)
      .single();
    if (!comp) {
      return res.status(404).json({ erro: 'Competição não encontrada para o slug informado' });
    }
    compId = comp.id;
  }

  let query = supabase
    .from('resultados')
    .select('id, competicao_id, atleta_id, prova_id, prova_nome, categoria_id, sexo, fase, marca, marca_num, posicao, vento, status, equipe_id, equipe_nome, pontos_equipe', { count: 'exact' });

  if (compId) query = query.eq('competicao_id', compId);
  if (prova_id) query = query.eq('prova_id', prova_id);
  if (categoria_id) query = query.eq('categoria_id', categoria_id);
  if (sexo) query = query.eq('sexo', sexo.toUpperCase());
  if (atleta_id) query = query.eq('atleta_id', atleta_id);
  if (fase) query = query.eq('fase', fase);

  query = query
    .order('posicao', { ascending: true, nullsFirst: false })
    .range(pagination.offset, pagination.offset + pagination.perPage - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return res.status(200).json({
    dados: data || [],
    paginacao: buildPaginacao(pagination.page, pagination.perPage, count || 0),
  });
});
