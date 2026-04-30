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
    .select('id, competicao_id, atleta_id, prova_id, prova_nome, categoria_id, sexo, fase, marca, marca_num, posicao, vento, status, equipe_id, equipe_nome, pontos_equipe, atletas(nome, sexo, ano_nasc, cbat, clube)', { count: 'exact' });

  if (compId) query = query.eq('competicao_id', compId);
  if (prova_id) query = query.eq('prova_id', prova_id);
  if (categoria_id) query = query.eq('categoria_id', categoria_id);
  if (sexo) query = query.eq('sexo', sexo.toUpperCase());
  if (atleta_id) query = query.eq('atleta_id', atleta_id);
  if (fase) query = query.eq('fase', fase);

  query = query
    .order('posicao', { ascending: true, nullsFirst: false })
    .range(pagination.offset, pagination.offset + pagination.perPage - 1);

  let { data, error, count } = await query;
  if (error) {
    // Fallback: se join falhar (sem FK), buscar sem join + enriquecer manualmente
    let q2 = supabase
      .from('resultados')
      .select('id, competicao_id, atleta_id, prova_id, prova_nome, categoria_id, sexo, fase, marca, marca_num, posicao, vento, status, equipe_id, equipe_nome, pontos_equipe', { count: 'exact' });
    if (compId) q2 = q2.eq('competicao_id', compId);
    if (prova_id) q2 = q2.eq('prova_id', prova_id);
    if (categoria_id) q2 = q2.eq('categoria_id', categoria_id);
    if (sexo) q2 = q2.eq('sexo', sexo.toUpperCase());
    if (atleta_id) q2 = q2.eq('atleta_id', atleta_id);
    if (fase) q2 = q2.eq('fase', fase);
    q2 = q2.order('posicao', { ascending: true, nullsFirst: false })
      .range(pagination.offset, pagination.offset + pagination.perPage - 1);
    const res2 = await q2;
    if (res2.error) throw res2.error;
    data = res2.data;
    count = res2.count;
  }

  // Enriquecer com nome do atleta
  const atletaIds = [...new Set((data || []).filter(r => r.atleta_id).map(r => r.atleta_id))];
  let atletasMap = {};
  if (atletaIds.length > 0) {
    const { data: atls } = await supabase
      .from('atletas')
      .select('id, nome, sexo, ano_nasc, cbat, clube')
      .in('id', atletaIds);
    (atls || []).forEach(a => { atletasMap[a.id] = a; });
  }

  const dados = (data || []).map(({ atletas: atl, ...r }) => {
    const atleta = atl || atletasMap[r.atleta_id] || {};
    return {
      ...r,
      atleta_nome: atleta.nome || null,
      atleta_sexo: atleta.sexo || r.sexo,
      atleta_ano_nasc: atleta.ano_nasc || null,
      atleta_cbat: atleta.cbat || null,
      atleta_clube: atleta.clube || r.equipe_nome || null,
    };
  });

  return res.status(200).json({
    fonte: 'GerenTrack — gerentrack.com.br',
    dados,
    paginacao: buildPaginacao(pagination.page, pagination.perPage, count || 0),
  });
});
