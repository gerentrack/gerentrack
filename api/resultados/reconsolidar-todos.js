const { db } = require('../_lib/firestore');
const { supabase } = require('../_lib/supabase');
const { verificarToken, verificarAdmin } = require('../_lib/auth');

/**
 * POST /api/resultados/reconsolidar-todos
 *
 * Re-consolida todas as competições finalizadas.
 * Atualiza prova_nome e dados de atletas nos resultados do PostgreSQL.
 * Requer autenticação + admin.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const decoded = await verificarToken(req);
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido ou ausente' });
  }

  const isAdmin = await verificarAdmin(decoded);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Apenas o administrador pode executar esta ação' });
  }

  try {
    // Buscar todas as competições consolidadas no Supabase
    const { data: competicoes, error: compErr } = await supabase
      .from('competicoes')
      .select('id, nome');
    if (compErr) throw compErr;
    if (!competicoes || competicoes.length === 0) {
      return res.status(200).json({ ok: true, message: 'Nenhuma competição consolidada encontrada', total: 0 });
    }

    // Buscar todos os atletas e equipes do Firestore (uma vez só)
    const [atletasSnap, equipesSnap] = await Promise.all([
      db.collection('atletas').get(),
      db.collection('equipes').get(),
    ]);

    const atletas = {};
    atletasSnap.forEach(doc => { atletas[doc.id] = { id: doc.id, ...doc.data() }; });

    const equipes = {};
    equipesSnap.forEach(doc => { equipes[doc.id] = { id: doc.id, ...doc.data() }; });

    const resultados = [];
    let erros = [];

    for (const comp of competicoes) {
      const eventoId = comp.id;
      try {
        // Buscar inscrições e resultados do Firestore
        const [inscricoesSnap, resultadosSnap] = await Promise.all([
          db.collection('inscricoes').where('eventoId', '==', eventoId).get(),
          db.collection('resultados')
            .where('__name__', '>=', eventoId + '_')
            .where('__name__', '<=', eventoId + '_\uf8ff')
            .get(),
        ]);

        // Mapa provaId → provaNome
        const provaNomes = {};
        inscricoesSnap.forEach(doc => {
          const d = doc.data();
          if (d.provaId && d.provaNome) provaNomes[d.provaId] = d.provaNome;
        });

        // Deletar resultados antigos desta competição
        await supabase.from('resultados').delete().eq('competicao_id', eventoId);

        const resultadosArr = [];
        resultadosSnap.forEach(doc => {
          const chave = doc.id;
          const dados = doc.data();

          let chaveBase = chave.substring(eventoId.length + 1);
          let fase = 'Final';
          if (chaveBase.includes('__')) {
            const partes = chaveBase.split('__');
            chaveBase = partes[0];
            const faseSuf = partes[1] || '';
            if (faseSuf === 'ELI') fase = 'Eliminatória';
            else if (faseSuf === 'SEM') fase = 'Semifinal';
            else if (faseSuf === 'FIN') fase = 'Final';
          }

          const lastUnd = chaveBase.lastIndexOf('_');
          if (lastUnd < 0) return;
          const sexo = chaveBase.substring(lastUnd + 1);
          const rest = chaveBase.substring(0, lastUnd);
          const lastUnd2 = rest.lastIndexOf('_');
          if (lastUnd2 < 0) return;
          const catId = rest.substring(lastUnd2 + 1);
          const provId = rest.substring(0, lastUnd2);

          Object.entries(dados).forEach(([atletaId, raw]) => {
            if (!atletaId || atletaId.startsWith('_')) return;
            const m = typeof raw === 'object' ? raw.marca : raw;
            const status = (raw && typeof raw === 'object') ? (raw.status || null) : null;
            const vento = (raw && typeof raw === 'object') ? (raw.vento || null) : null;
            const posicao = (raw && typeof raw === 'object') ? (raw.posicao || null) : null;
            const marcaNum = m ? parseFloat(String(m).replace(',', '.')) : null;

            const atl = atletas[atletaId];
            const eqId = atl?.equipeId || null;
            const eqNome = eqId && equipes[eqId] ? equipes[eqId].nome : (atl?.clube || null);

            resultadosArr.push({
              competicao_id: eventoId,
              atleta_id: atletaId,
              prova_id: provId,
              prova_nome: provaNomes[provId] || provId,
              categoria_id: catId,
              sexo,
              fase,
              marca: m ? String(m) : null,
              marca_num: isNaN(marcaNum) ? null : marcaNum,
              posicao: posicao ? parseInt(posicao) : null,
              vento: vento ? String(vento) : null,
              status,
              equipe_id: eqId,
              equipe_nome: eqNome,
            });
          });
        });

        if (resultadosArr.length > 0) {
          for (let i = 0; i < resultadosArr.length; i += 500) {
            const lote = resultadosArr.slice(i, i + 500);
            const { error: resErr } = await supabase.from('resultados').insert(lote);
            if (resErr) console.error(`Erro insert resultados ${comp.nome} (lote ${i})`, resErr.message);
          }
        }

        resultados.push({ id: eventoId, nome: comp.nome, total: resultadosArr.length });
      } catch (err) {
        console.error(`Erro ao reconsolidar ${comp.nome}:`, err.message);
        erros.push({ id: eventoId, nome: comp.nome, erro: err.message });
      }
    }

    return res.status(200).json({
      ok: true,
      reconsolidadas: resultados.length,
      erros: erros.length,
      detalhes: resultados,
      falhas: erros,
    });
  } catch (err) {
    console.error('Erro ao reconsolidar:', err);
    return res.status(500).json({ error: 'Erro interno ao reconsolidar' });
  }
};
