const { db } = require('../_lib/firestore');
const { supabase } = require('../_lib/supabase');
const { verificarToken, verificarAdmin } = require('../_lib/auth');

/**
 * POST /api/resultados/migrar-historico
 *
 * Migra TODAS as competições finalizadas do Firestore para o PostgreSQL.
 * Executar uma única vez para popular o histórico.
 * Apenas admin pode executar. Timeout longo recomendado (Vercel Pro: 60s).
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
    return res.status(403).json({ error: 'Apenas o administrador pode executar esta migração' });
  }

  try {
    // Buscar todos os eventos finalizados
    const eventosSnap = await db.collection('eventos').get();
    const eventosFin = [];
    eventosSnap.forEach(doc => {
      const d = doc.data();
      if (d.competicaoFinalizada) eventosFin.push({ id: doc.id, ...d });
    });

    if (eventosFin.length === 0) {
      return res.status(200).json({ ok: true, msg: 'Nenhuma competição finalizada encontrada', migradas: 0 });
    }

    // Buscar atletas e equipes (uma vez, compartilhado entre todos os eventos)
    const [atletasSnap, equipesSnap, rankingSnap] = await Promise.all([
      db.collection('atletas').get(),
      db.collection('equipes').get(),
      db.collection('ranking').get(),
    ]);

    const atletas = {};
    atletasSnap.forEach(doc => { atletas[doc.id] = { id: doc.id, ...doc.data() }; });

    const equipes = {};
    equipesSnap.forEach(doc => { equipes[doc.id] = { id: doc.id, ...doc.data() }; });

    // Ranking por UF
    const rankingPorEvento = {};
    rankingSnap.forEach(doc => {
      const data = doc.data();
      (data.entradas || []).forEach(e => {
        if (!e.eventoId) return;
        if (!rankingPorEvento[e.eventoId]) rankingPorEvento[e.eventoId] = [];
        rankingPorEvento[e.eventoId].push(e);
      });
    });

    // Upsert equipes (todas de uma vez)
    const equipesArr = Object.values(equipes).map(eq => ({
      id: eq.id,
      nome: eq.nome || '',
      sigla: eq.sigla || null,
      estado: eq.uf || eq.estado || null,
      federada: eq.federada || false,
      organizador_id: eq.organizadorId || null,
    }));
    if (equipesArr.length > 0) {
      for (let i = 0; i < equipesArr.length; i += 500) {
        await supabase.from('equipes').upsert(equipesArr.slice(i, i + 500), { onConflict: 'id' });
      }
    }

    // Upsert atletas (todos de uma vez)
    const atletasArr = Object.values(atletas).map(a => ({
      id: a.id,
      nome: a.nome || '',
      sexo: a.genero || a.sexo || null,
      ano_nasc: a.anoNasc ? parseInt(a.anoNasc) : null,
      data_nasc: a.dataNasc || null,
      cpf: a.cpf || null,
      cbat: a.cbat || a.numeroCbat || a.nCbat || null,
      equipe_id: a.equipeId && equipes[a.equipeId] ? a.equipeId : null,
      clube: a.clube || (a.equipeId && equipes[a.equipeId] ? equipes[a.equipeId].nome : null),
    }));
    if (atletasArr.length > 0) {
      for (let i = 0; i < atletasArr.length; i += 500) {
        await supabase.from('atletas').upsert(atletasArr.slice(i, i + 500), { onConflict: 'id' });
      }
    }

    // Consolidar cada evento
    const resultadoMigracao = [];

    for (const evento of eventosFin) {
      const eventoId = evento.id;
      try {
        // Upsert competição
        await supabase.from('competicoes').upsert({
          id: eventoId,
          nome: evento.nome || '',
          slug: evento.slug || null,
          cidade: evento.cidade || null,
          estado: evento.uf || evento.estado || null,
          data: evento.data || null,
          data_fim: evento.dataFim || null,
          organizador_id: evento.organizadorId || null,
          status: 'finalizada',
          consolidado_em: new Date().toISOString(),
        }, { onConflict: 'id' });

        // Buscar resultados deste evento
        const resultadosSnap = await db.collection('resultados')
          .where('__name__', '>=', eventoId + '_')
          .where('__name__', '<=', eventoId + '_\uf8ff')
          .get();

        // Limpar resultados anteriores
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
              prova_nome: provId,
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
            await supabase.from('resultados').insert(resultadosArr.slice(i, i + 500));
          }
        }

        // Ranking
        await supabase.from('ranking').delete().eq('competicao_id', eventoId);
        const rnkEvento = rankingPorEvento[eventoId] || [];
        const rankingArr = rnkEvento.map(e => ({
          id: e.id || e._chave || `rnk_${eventoId}_${e.provaId}_${e.atletaId}`,
          competicao_id: eventoId,
          evento_nome: e.eventoNome || evento.nome,
          evento_data: e.eventoData || evento.data,
          evento_uf: e.eventoUf || evento.uf || '',
          prova_id: e.provaId,
          prova_nome: e.provaNome || e.provaId,
          unidade: e.unidade || 's',
          atleta_id: e.atletaId,
          atleta_nome: e.atletaNome || '',
          atleta_cbat: e.atletaCbat || '',
          atleta_uf: e.atletaUf || '',
          atleta_clube: e.atletaClube || '',
          equipe_id: e.equipeCadastroId || null,
          categoria_id: e.categoriaId,
          sexo: e.sexo,
          marca: e.marca || null,
          marca_num: e.marcaNum || null,
          vento: e.vento || null,
          vento_assistido: e.ventoAssistido || false,
          status: e.status || 'pendente',
        }));

        if (rankingArr.length > 0) {
          for (let i = 0; i < rankingArr.length; i += 500) {
            await supabase.from('ranking').upsert(rankingArr.slice(i, i + 500), { onConflict: 'id' });
          }
        }

        resultadoMigracao.push({ eventoId, nome: evento.nome, resultados: resultadosArr.length, ranking: rankingArr.length, ok: true });
      } catch (err) {
        resultadoMigracao.push({ eventoId, nome: evento.nome, ok: false, erro: err.message });
      }
    }

    return res.status(200).json({
      ok: true,
      totalEventos: eventosFin.length,
      migracoes: resultadoMigracao,
    });
  } catch (err) {
    console.error('Erro na migração histórica:', err);
    return res.status(500).json({ error: 'Erro interno na migração: ' + err.message });
  }
};
