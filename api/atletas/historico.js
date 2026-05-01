const { supabase } = require('../_lib/supabase');
const { verificarToken } = require('../_lib/auth');
const { withLogger } = require('../_lib/withLogger');

/**
 * GET /api/atletas/historico?id=atletaId
 *
 * Retorna histórico cross-competição de um atleta:
 * - Todas as competições em que participou
 * - Resultados por prova/categoria
 * - Evolução de marcas ao longo do tempo
 *
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

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Parâmetro "id" é obrigatório' });
  }

  try {
    // Buscar atleta
    const { data: atleta, error: atlErr } = await supabase
      .from('atletas')
      .select('id, nome, sexo, ano_nasc, cpf, cbat, equipe_id, clube')
      .eq('id', id)
      .single();

    if (atlErr || !atleta) {
      return res.status(404).json({ error: 'Atleta não encontrado no histórico consolidado' });
    }

    // Buscar equipe
    let equipe = null;
    if (atleta.equipe_id) {
      const { data: eq } = await supabase
        .from('equipes')
        .select('id, nome, sigla, estado')
        .eq('id', atleta.equipe_id)
        .single();
      equipe = eq;
    }

    // Buscar todos os resultados do atleta
    const { data: resultados, error: resErr } = await supabase
      .from('resultados')
      .select('competicao_id, prova_id, prova_nome, categoria_id, sexo, fase, marca, marca_num, posicao, vento, status, equipe_nome')
      .eq('atleta_id', id)
      .order('competicao_id', { ascending: false });

    if (resErr) throw resErr;

    // Buscar competições relacionadas
    const competicaoIds = [...new Set((resultados || []).map(r => r.competicao_id))];
    let competicoesMap = {};
    if (competicaoIds.length > 0) {
      const { data: comps } = await supabase
        .from('competicoes')
        .select('id, nome, slug, cidade, estado, data')
        .in('id', competicaoIds);
      (comps || []).forEach(c => { competicoesMap[c.id] = c; });
    }

    // Agrupar resultados por competição
    const porCompeticao = {};
    (resultados || []).forEach(r => {
      if (!porCompeticao[r.competicao_id]) {
        const comp = competicoesMap[r.competicao_id] || {};
        porCompeticao[r.competicao_id] = {
          competicao: {
            id: r.competicao_id,
            nome: comp.nome || '—',
            cidade: comp.cidade || '',
            estado: comp.estado || '',
            data: comp.data || '',
          },
          resultados: [],
        };
      }
      porCompeticao[r.competicao_id].resultados.push({
        prova: r.prova_nome || r.prova_id,
        categoria: r.categoria_id,
        fase: r.fase,
        marca: r.marca,
        marca_num: r.marca_num,
        posicao: r.posicao,
        vento: r.vento,
        status: r.status,
      });
    });

    // Melhores marcas por prova
    const melhoresPorProva = {};
    (resultados || []).forEach(r => {
      if (!r.marca_num || r.status) return;
      const chave = `${r.prova_id}_${r.categoria_id}_${r.sexo}`;
      if (!melhoresPorProva[chave] || r.marca_num < melhoresPorProva[chave].marca_num) {
        melhoresPorProva[chave] = {
          prova: r.prova_nome || r.prova_id,
          categoria: r.categoria_id,
          marca: r.marca,
          marca_num: r.marca_num,
          competicao: competicoesMap[r.competicao_id]?.nome || '—',
          data: competicoesMap[r.competicao_id]?.data || '',
        };
      }
    });

    return res.status(200).json({
      atleta: {
        ...atleta,
        equipe: equipe ? { nome: equipe.nome, sigla: equipe.sigla, estado: equipe.estado } : null,
      },
      totalCompeticoes: competicaoIds.length,
      totalResultados: (resultados || []).length,
      competicoes: Object.values(porCompeticao),
      melhoresMarcas: Object.values(melhoresPorProva),
    });
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar histórico do atleta' });
  }
});
