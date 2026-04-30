const { supabase } = require('../_lib/supabase');
const { wrapHandler } = require('./_lib/wrapHandler');
const { buildPaginacao } = require('./_lib/pagination');

/**
 * GET /api/v1/ranking
 *
 * Consulta ranking por prova, categoria e sexo.
 *
 * Parâmetros (obrigatórios):
 *   prova_id     — ex: "100m", "salto_distancia"
 *   categoria_id — ex: "Sub-16", "Adulto"
 *   sexo         — M ou F
 *
 * Parâmetros (opcionais):
 *   temporada — ano (ex: 2026), filtra por evento_data
 *   uf        — estado (ex: "MG"), filtra por evento_uf
 *   page, per_page — paginação (default: 1, 20)
 */
module.exports = wrapHandler(async (req, res, { pagination }) => {
  const { prova_id, categoria_id, sexo, temporada, uf } = req.query;

  if (!prova_id || !categoria_id || !sexo) {
    return res.status(400).json({
      erro: 'Parâmetros obrigatórios: prova_id, categoria_id, sexo',
    });
  }

  let query = supabase
    .from('ranking')
    .select('id, competicao_id, evento_nome, evento_data, evento_uf, prova_id, prova_nome, unidade, atleta_id, atleta_nome, atleta_cbat, atleta_uf, atleta_clube, equipe_id, categoria_id, sexo, marca, marca_num, vento, vento_assistido, status', { count: 'exact' })
    .eq('prova_id', prova_id)
    .eq('categoria_id', categoria_id)
    .eq('sexo', sexo.toUpperCase());

  if (temporada) query = query.ilike('evento_data', `${temporada}%`);
  if (uf) query = query.ilike('evento_uf', uf.toUpperCase());

  // Ordenar por marca — menor é melhor para tempo, maior para distância
  query = query
    .order('marca_num', { ascending: true, nullsFirst: false })
    .range(pagination.offset, pagination.offset + pagination.perPage - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  // Adicionar posição calculada
  const dados = (data || []).map((r, i) => ({
    ...r,
    posicao: pagination.offset + i + 1,
  }));

  return res.status(200).json({
    fonte: 'GerenTrack — gerentrack.com.br',
    dados,
    paginacao: buildPaginacao(pagination.page, pagination.perPage, count || 0),
  });
});
