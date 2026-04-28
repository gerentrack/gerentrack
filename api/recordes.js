const { db } = require('./_lib/firestore');
const { verificarToken } = require('./_lib/auth');

/**
 * POST /api/recordes
 * Body: { eventoId }
 *
 * Detecta potenciais quebras de recorde para uma competição.
 * Busca dados no Firestore server-side e aplica a mesma lógica
 * do RecordDetectionEngine client-side.
 *
 * Requer autenticação via token Firebase.
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
    const [resultadosSnap, atletasSnap, equipesSnap, inscricoesSnap, recordesSnap] = await Promise.all([
      db.collection('resultados').where('__name__', '>=', eventoId + '_').where('__name__', '<=', eventoId + '_\uf8ff').get(),
      db.collection('atletas').get(),
      db.collection('equipes').get(),
      db.collection('inscricoes').where('eventoId', '==', eventoId).get(),
      db.collection('recordes').get(),
    ]);

    // Montar resultados como objeto { chave: { atletaId: resultado } }
    const resultados = {};
    resultadosSnap.forEach(doc => {
      resultados[doc.id] = doc.data();
    });

    const atletas = [];
    atletasSnap.forEach(doc => atletas.push({ id: doc.id, ...doc.data() }));

    const equipes = [];
    equipesSnap.forEach(doc => equipes.push({ id: doc.id, ...doc.data() }));

    const inscricoes = [];
    inscricoesSnap.forEach(doc => inscricoes.push({ id: doc.id, ...doc.data() }));

    const recordes = [];
    recordesSnap.forEach(doc => recordes.push({ id: doc.id, ...doc.data() }));

    // Aplicar detecção de recordes server-side
    const pendencias = detectarQuebras(evento, resultados, recordes, atletas, equipes, inscricoes);

    return res.status(200).json({
      eventoId,
      total: pendencias.length,
      pendencias,
    });
  } catch (err) {
    console.error('Erro ao detectar recordes:', err);
    return res.status(500).json({ error: 'Erro interno ao detectar recordes' });
  }
};

// ─── Lógica de detecção (simplificada do RecordDetectionEngine) ────────────

function marcaParaMs(valor) {
  if (valor == null) return null;
  const s = String(valor).replace(',', '.').trim();
  if (!s || isNaN(parseFloat(s))) return null;
  const num = parseFloat(s);
  // Se já em ms (>= 100), retorna direto; senão converte segundos → ms
  return num >= 100 ? num : Math.round(num * 1000);
}

function compararMarca(marcaAtleta, regExistente, unidade) {
  if (!regExistente) return 'novo';
  const isMenor = unidade === 's';
  const nova = isMenor ? marcaParaMs(marcaAtleta) : parseFloat(String(marcaAtleta).replace(',', '.'));
  const atual = isMenor ? marcaParaMs(regExistente.marca) : parseFloat(String(regExistente.marca).replace(',', '.'));
  if (nova == null || isNaN(nova)) return null;
  if (atual == null || isNaN(atual)) return 'novo';
  if (isMenor) {
    if (nova < atual) return 'superou';
    if (Math.abs(nova - atual) < 0.0005) return 'igualou';
  } else {
    if (nova > atual) return 'superou';
    if (Math.abs(nova - atual) < 0.005) return 'igualou';
  }
  return null;
}

function nomeProvaMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const strip = s => s.replace(/\s*\(.*?\)/g, '').trim().toLowerCase();
  return strip(a) === strip(b);
}

function getPool(evento, recordes) {
  const recSumulaIds = evento.recordesSumulas || [];
  const vinculados = recordes.filter(t => recSumulaIds.includes(t.id) || t.competicoesVinculadas?.includes(evento.id));
  const pool = new Set();
  const paisesExpandir = new Set();

  vinculados.forEach(tipo => {
    pool.add(tipo.id);
    const esc = tipo.escopo || 'estado';
    if (esc === 'estado' || esc === 'pais') {
      paisesExpandir.add(tipo.pais || 'Brasil');
    }
  });

  if (paisesExpandir.size > 0) {
    recordes.forEach(tipo => {
      if ((tipo.escopo || 'estado') === 'estado' && paisesExpandir.has(tipo.pais || 'Brasil')) {
        pool.add(tipo.id);
      }
    });
  }

  return [...pool].map(id => recordes.find(t => t.id === id)).filter(Boolean);
}

function getCbat(atleta) {
  if (!atleta) return '';
  return atleta.cbat || atleta.numeroCbat || atleta.nCbat || atleta.registro || atleta.numCbat || '';
}

function getClubeAtleta(atleta, equipes) {
  if (!atleta) return '';
  if (atleta.equipeId && Array.isArray(equipes)) {
    const eq = equipes.find(e => e.id === atleta.equipeId);
    if (eq) return eq.nome || eq.clube || '';
  }
  return atleta.clube || '';
}

function getLocalRecorde(evento) {
  if (!evento) return '—';
  if (evento.cidade && evento.uf) return `${evento.cidade} - ${evento.uf}`;
  if (evento.cidade) return evento.cidade;
  return evento.local || '—';
}

function getDetentores(registro) {
  if (!registro) return [];
  if (Array.isArray(registro.detentores)) return registro.detentores;
  if (registro.atleta || registro.equipe) return [registro];
  return [];
}

function getFasesModo(provaId, configSeriacao) {
  if (!configSeriacao) return [];
  const cfg = configSeriacao[provaId];
  const modo = !cfg ? 'final' : (typeof cfg === 'string') ? cfg : (cfg.modo || 'final');
  const map = {
    'final': [],
    'semi_final': ['SEM', 'FIN'],
    'eli_semi_final': ['ELI', 'SEM', 'FIN'],
    'final_tempo': [],
    'semifinal_final': ['SEM', 'FIN'],
  };
  return map[modo] || [];
}

function detectarQuebras(evento, resultados, recordes, atletas, equipes, inscricoes) {
  if (!evento || !resultados || !recordes) return [];
  const eid = evento.id;
  const pool = getPool(evento, recordes);
  if (pool.length === 0) return [];

  const snapshot = evento.recordesSnapshot || {};
  const configSeriacaoEvt = evento.configSeriacao || {};
  const pendencias = [];
  const chavesVistas = new Set();

  // Precisamos de uma lista de provas — extraímos dos resultados + recordes
  // Não temos acesso ao provasDef.json no servidor, então inferimos dos dados
  const provasMap = {};
  // Extrair info de provas dos recordes existentes
  recordes.forEach(tipo => {
    (tipo.registros || []).forEach(reg => {
      if (reg.provaId && reg.provaNome) {
        provasMap[reg.provaId] = { id: reg.provaId, nome: reg.provaNome, unidade: reg.unidade || 's' };
      }
    });
  });
  // Extrair das provas do evento
  if (evento.provas && Array.isArray(evento.provas)) {
    evento.provas.forEach(p => {
      if (p.id) provasMap[p.id] = { id: p.id, nome: p.nome || p.id, unidade: p.unidade || 's', tipo: p.tipo || '' };
    });
  }

  Object.keys(resultados).forEach(chave => {
    if (!chave.startsWith(eid + '_')) return;

    let chaveBase = chave.substring(eid.length + 1);
    let faseSufixo = '';
    if (chaveBase.includes('__')) {
      const partes = chaveBase.split('__');
      chaveBase = partes[0];
      faseSufixo = partes[1] || '';
    }

    const lastUnd = chaveBase.lastIndexOf('_');
    if (lastUnd < 0) return;
    const sexo = chaveBase.substring(lastUnd + 1);
    const rest = chaveBase.substring(0, lastUnd);
    const lastUnd2 = rest.lastIndexOf('_');
    if (lastUnd2 < 0) return;
    const catId = rest.substring(lastUnd2 + 1);
    const provId = rest.substring(0, lastUnd2);

    const prova = provasMap[provId];
    if (!prova) return;

    const fasesConf = getFasesModo(provId, configSeriacaoEvt);
    if (fasesConf.length > 1) {
      if (faseSufixo !== 'FIN') return;
    } else {
      if (faseSufixo) return;
    }

    const resByAtleta = resultados[chave] || {};

    Object.entries(resByAtleta).forEach(([aId, raw]) => {
      const status = (raw != null && typeof raw === 'object') ? (raw.status || '') : '';
      if (['DNS', 'DNF', 'DQ', 'NM'].includes(status)) return;
      const m = typeof raw === 'object' ? raw.marca : raw;
      if (m == null || m === '') return;
      const marcaNum = parseFloat(String(m).replace(',', '.'));
      if (isNaN(marcaNum)) return;

      // Vento > +2.0 invalida recorde para provas de pista
      if (prova.unidade === 's') {
        const ventoVal = (raw != null && typeof raw === 'object') ? parseFloat(String(raw.vento || '').replace(',', '.')) : NaN;
        if (!isNaN(ventoVal) && ventoVal > 2.0) return;
      }

      const isRevez = prova.tipo === 'revezamento';
      const atletaObj = isRevez ? null : atletas.find(a => a.id === aId);
      if (!isRevez && (!atletaObj || !getCbat(atletaObj)?.trim())) return;
      const equipeObj = isRevez ? equipes.find(e => e.id === aId) : null;
      const nomeAtl = isRevez ? (equipeObj?.clube || equipeObj?.nome || '—') : (atletaObj?.nome || '—');
      const nomeEq = isRevez ? nomeAtl : (atletaObj ? (getClubeAtleta(atletaObj, equipes) || '—') : '—');

      pool.forEach(tipo => {
        const hasSnap = Object.keys(snapshot).length > 0;
        const regsRef = hasSnap ? (snapshot[tipo.id] || []) : (tipo.registros || []);
        const regExistente = regsRef.find(r =>
          (r.provaId === provId || nomeProvaMatch(r.provaNome, prova.nome))
          && r.categoriaId === catId && r.sexo === sexo
        );

        const resultado = compararMarca(marcaNum, regExistente, prova.unidade);
        if (!resultado) return;

        const _chave = `${eid}_${provId}_${catId}_${sexo}_${tipo.id}_${aId}`;
        if (chavesVistas.has(_chave)) return;
        chavesVistas.add(_chave);

        const detentoresAtuais = regExistente ? getDetentores(regExistente) : [];

        let atletaUf = '';
        if (isRevez && equipeObj) {
          atletaUf = equipeObj.estado || '';
        } else if (atletaObj) {
          const eqAtl = atletaObj.equipeId ? equipes.find(e => e.id === atletaObj.equipeId) : null;
          atletaUf = eqAtl?.estado || '';
        }

        const tipoEscopo = tipo.escopo || 'estado';
        const eventoUf = evento.uf || '';
        let relevancia = 'especial';
        if (tipoEscopo === 'mundial') relevancia = 'mundial';
        else if (tipoEscopo === 'pais') relevancia = 'nacional';
        else if (tipoEscopo === 'estado') {
          if (tipo.estado && eventoUf && tipo.estado === eventoUf) relevancia = 'local';
          else if (tipo.estado && atletaUf && tipo.estado === atletaUf) relevancia = 'atleta';
          else relevancia = 'outro_estado';
        }

        pendencias.push({
          id: `pend_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          eventoId: eid,
          eventoNome: evento.nome || '—',
          eventoLocal: getLocalRecorde(evento),
          eventoUf,
          provaId: provId,
          provaNome: prova.nome,
          categoriaId: catId,
          sexo,
          atletaId: aId,
          atletaNome: nomeAtl,
          equipeNome: nomeEq,
          marca: String(marcaNum),
          unidade: prova.unidade || 's',
          recordeTipoId: tipo.id,
          recordeTipoNome: tipo.nome,
          recordeTipoSigla: tipo.sigla,
          recordeEstado: tipo.estado || '',
          tipoQuebra: resultado,
          relevancia,
          atletaUf: atletaUf || '',
          recordeAtual: regExistente ? { marca: regExistente.marca, detentores: detentoresAtuais } : null,
          status: 'pendente',
          _chave,
        });
      });
    });
  });

  return pendencias;
}
