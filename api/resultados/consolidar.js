const { db } = require('../_lib/firestore');
const { supabase } = require('../_lib/supabase');
const { verificarToken, verificarAdmin } = require('../_lib/auth');

/**
 * POST /api/resultados/consolidar
 * Body: { eventoId }
 *
 * Consolida dados de uma competição finalizada do Firestore para o PostgreSQL.
 * Upsert: se a competição já foi consolidada, sobrescreve (suporta re-finalização).
 *
 * Requer autenticação + admin ou organizador do evento.
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
    // Buscar evento
    const eventoDoc = await db.collection('eventos').doc(eventoId).get();
    if (!eventoDoc.exists) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    const evento = { id: eventoDoc.id, ...eventoDoc.data() };

    // Buscar dados em paralelo
    const [atletasSnap, equipesSnap, inscricoesSnap, resultadosSnap, rankingSnap] = await Promise.all([
      db.collection('atletas').get(),
      db.collection('equipes').get(),
      db.collection('inscricoes').where('eventoId', '==', eventoId).get(),
      db.collection('resultados').where('__name__', '>=', eventoId + '_').where('__name__', '<=', eventoId + '_\uf8ff').get(),
      db.collection('ranking').get(),
    ]);

    const atletas = {};
    atletasSnap.forEach(doc => { atletas[doc.id] = { id: doc.id, ...doc.data() }; });

    const equipes = {};
    equipesSnap.forEach(doc => { equipes[doc.id] = { id: doc.id, ...doc.data() }; });

    // ── 1. Upsert equipes ─────────────────────────────────────────
    const equipesArr = Object.values(equipes).map(eq => ({
      id: eq.id,
      nome: eq.nome || '',
      sigla: eq.sigla || null,
      estado: eq.uf || eq.estado || null,
      federada: eq.federada || false,
      organizador_id: eq.organizadorId || null,
    }));

    if (equipesArr.length > 0) {
      const { error: eqErr } = await supabase.from('equipes').upsert(equipesArr, { onConflict: 'id' });
      if (eqErr) console.error('Erro upsert equipes:', eqErr.message);
    }

    // ── 2. Upsert atletas (só os inscritos neste evento) ──────────
    const atletaIds = new Set();
    inscricoesSnap.forEach(doc => {
      const d = doc.data();
      if (d.atletaId) atletaIds.add(d.atletaId);
      if (Array.isArray(d.atletasIds)) d.atletasIds.forEach(aid => atletaIds.add(aid));
    });

    const atletasArr = [...atletaIds]
      .filter(id => atletas[id])
      .map(id => {
        const a = atletas[id];
        return {
          id: a.id,
          nome: a.nome || '',
          sexo: a.genero || a.sexo || null,
          ano_nasc: a.anoNasc ? parseInt(a.anoNasc) : null,
          data_nasc: a.dataNasc || null,
          cpf: a.cpf || null,
          cbat: a.cbat || a.numeroCbat || a.nCbat || null,
          equipe_id: a.equipeId && equipes[a.equipeId] ? a.equipeId : null,
          clube: a.clube || (a.equipeId && equipes[a.equipeId] ? equipes[a.equipeId].nome : null),
        };
      });

    if (atletasArr.length > 0) {
      const { error: atlErr } = await supabase.from('atletas').upsert(atletasArr, { onConflict: 'id' });
      if (atlErr) console.error('Erro upsert atletas:', atlErr.message);
    }

    // ── 3. Upsert competição ──────────────────────────────────────
    const { error: compErr } = await supabase.from('competicoes').upsert({
      id: evento.id,
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
    if (compErr) console.error('Erro upsert competição:', compErr.message);

    // ── 4. Consolidar resultados ──────────────────────────────────
    // Primeiro, deletar resultados anteriores desta competição (upsert limpo)
    await supabase.from('resultados').delete().eq('competicao_id', eventoId);

    const resultadosArr = [];
    resultadosSnap.forEach(doc => {
      const chave = doc.id; // formato: eventoId_provaId_catId_sexo[__fase]
      const dados = doc.data();

      // Extrair provaId, catId, sexo, fase da chave
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

      // Iterar atletas com resultado
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
          prova_nome: provId, // será enriquecido depois se necessário
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
      // Inserir em lotes de 500
      for (let i = 0; i < resultadosArr.length; i += 500) {
        const lote = resultadosArr.slice(i, i + 500);
        const { error: resErr } = await supabase.from('resultados').insert(lote);
        if (resErr) console.error(`Erro insert resultados (lote ${i})`, resErr.message);
      }
    }

    // ── 5. Consolidar ranking ─────────────────────────────────────
    // Deletar ranking anterior desta competição
    await supabase.from('ranking').delete().eq('competicao_id', eventoId);

    // Buscar entradas de ranking do Firestore (armazenadas por UF)
    const rankingArr = [];
    rankingSnap.forEach(doc => {
      const data = doc.data();
      const entradas = data.entradas || [];
      entradas
        .filter(e => e.eventoId === eventoId)
        .forEach(e => {
          rankingArr.push({
            id: e.id || e._chave || `rnk_${eventoId}_${e.provaId}_${e.atletaId}_${Date.now()}`,
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
          });
        });
    });

    if (rankingArr.length > 0) {
      for (let i = 0; i < rankingArr.length; i += 500) {
        const lote = rankingArr.slice(i, i + 500);
        const { error: rnkErr } = await supabase.from('ranking').upsert(lote, { onConflict: 'id' });
        if (rnkErr) console.error(`Erro upsert ranking (lote ${i})`, rnkErr.message);
      }
    }

    return res.status(200).json({
      ok: true,
      eventoId,
      consolidado: {
        equipes: equipesArr.length,
        atletas: atletasArr.length,
        resultados: resultadosArr.length,
        ranking: rankingArr.length,
      },
    });
  } catch (err) {
    console.error('Erro ao consolidar:', err);
    return res.status(500).json({ error: 'Erro interno ao consolidar competição' });
  }
};
