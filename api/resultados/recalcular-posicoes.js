const { db } = require('../_lib/firestore');
const { verificarToken } = require('../_lib/auth');
const PROVAS_DEF = require('../../src/domain/provas/provasDef.json');

// Mapa provaId → { unidade, tipo, id }
const provasMap = {};
Object.values(PROVAS_DEF).forEach(cats => {
  Object.values(cats).forEach(provas => {
    provas.forEach(p => { provasMap[p.id] = p; });
  });
});

const STATUS_LIST = ["DNS", "DNF", "DQ", "NM", "NH"];

/**
 * Recalcula posições de um documento de resultados.
 * Mesma lógica do calcularPosicoes do frontend (useResultados.js).
 */
function calcularPosicoes(docResultados, provaId) {
  const prova = provasMap[provaId];
  if (!prova) return docResultados;

  const isPista = prova.unidade === "s";
  const isAltVara = prova.tipo === "salto" && (prova.id.includes("altura") || prova.id.includes("vara"));

  const entradas = Object.entries(docResultados).map(([id, raw]) => {
    const obj = (raw != null && typeof raw === "object") ? raw : { marca: raw };
    const status = obj.status || "";
    const marcaStr = String(obj.marca || "").toUpperCase();
    const isStatus = STATUS_LIST.includes(status) || STATUS_LIST.includes(marcaStr);
    const statusEfetivo = STATUS_LIST.includes(status) ? status : STATUS_LIST.includes(marcaStr) ? marcaStr : "";
    const marcaNum = (!isStatus && obj.marca != null) ? parseFloat(obj.marca) : null;
    const marca = (marcaNum != null && !isNaN(marcaNum)) ? marcaNum : null;
    return { id, raw: obj, marca, status: statusEfetivo, isStatus };
  });

  // Ordenar (mesma lógica do frontend)
  entradas.sort((a, b) => {
    if (a.isStatus && !b.isStatus) return 1;
    if (!a.isStatus && b.isStatus) return -1;
    if (a.isStatus && b.isStatus) {
      const ord = isPista ? { DNF: 0, DNS: 1, DQ: 2 } : { NM: 0, DNS: 1, DQ: 2 };
      return (ord[a.status] ?? 9) - (ord[b.status] ?? 9);
    }
    if (a.marca == null && b.marca == null) return 0;
    if (a.marca == null) return 1;
    if (b.marca == null) return -1;

    if (isPista) return a.marca - b.marca;
    if (b.marca !== a.marca) return b.marca - a.marca;

    // Desempate altura/vara: RT 26.9
    if (isAltVara) {
      const getSU = (r) => {
        if (!r || typeof r !== "object") return 0;
        const tObj = (r.tentativas && typeof r.tentativas === "object") ? r.tentativas : {};
        const melhor = parseFloat(r.marca);
        if (isNaN(melhor)) return 0;
        const alts = Array.isArray(r.alturas) ? r.alturas : [];
        const key = alts.find(h => Math.abs(parseFloat(h) - melhor) < 0.001);
        if (!key) return 0;
        const arr = Array.isArray(tObj[key]) ? tObj[key] : Array.isArray(tObj[parseFloat(key).toFixed(2)]) ? tObj[parseFloat(key).toFixed(2)] : [];
        return arr.filter(v => v === "X" || v === "O").length;
      };
      const getFP = (r) => {
        if (!r || typeof r !== "object") return 0;
        const tObj = (r.tentativas && typeof r.tentativas === "object") ? r.tentativas : {};
        const alts = Array.isArray(r.alturas) ? r.alturas : [];
        let total = 0;
        alts.forEach(h => {
          const kStr = parseFloat(h).toFixed(2);
          const arr = Array.isArray(tObj[h]) ? tObj[h] : Array.isArray(tObj[kStr]) ? tObj[kStr] : [];
          if (arr.includes("O")) total += arr.filter(v => v === "X").length;
        });
        return total;
      };
      const suA = getSU(a.raw), suB = getSU(b.raw);
      if (suA !== suB) return suA - suB;
      const fpA = getFP(a.raw), fpB = getFP(b.raw);
      if (fpA !== fpB) return fpA - fpB;
      return 0;
    }

    // Desempate campo: RT 25.22
    const seqDesc = (r) => {
      if (r == null) return [];
      const obj = typeof r === "object" ? r : { marca: r };
      return [obj.t1, obj.t2, obj.t3, obj.t4, obj.t5, obj.t6]
        .map(v => { const n = parseFloat(v); return isNaN(n) ? null : n; })
        .filter(n => n !== null).sort((x, y) => y - x);
    };
    const sa = seqDesc(a.raw), sb = seqDesc(b.raw);
    const len = Math.max(sa.length, sb.length);
    for (let i = 0; i < len; i++) {
      const va = sa[i] ?? -Infinity, vb = sb[i] ?? -Infinity;
      if (vb > va) return 1;
      if (va > vb) return -1;
    }
    return 0;
  });

  // Verificar se desempate resolveu
  const desempateResolveu = (a, b) => {
    if (!a || !b || a.marca == null || b.marca == null || a.marca !== b.marca) return false;
    if (isAltVara) {
      const getSU = (r) => {
        if (!r || typeof r !== "object") return 0;
        const tObj = (r.tentativas && typeof r.tentativas === "object") ? r.tentativas : {};
        const melhor = parseFloat(r.marca);
        if (isNaN(melhor)) return 0;
        const alts = Array.isArray(r.alturas) ? r.alturas : [];
        const key = alts.find(h => Math.abs(parseFloat(h) - melhor) < 0.001);
        if (!key) return 0;
        const arr = Array.isArray(tObj[key]) ? tObj[key] : Array.isArray(tObj[parseFloat(key).toFixed(2)]) ? tObj[parseFloat(key).toFixed(2)] : [];
        return arr.filter(v => v === "X" || v === "O").length;
      };
      const getFP = (r) => {
        if (!r || typeof r !== "object") return 0;
        const tObj = (r.tentativas && typeof r.tentativas === "object") ? r.tentativas : {};
        const alts = Array.isArray(r.alturas) ? r.alturas : [];
        let total = 0;
        alts.forEach(h => {
          const kStr = parseFloat(h).toFixed(2);
          const arr = Array.isArray(tObj[h]) ? tObj[h] : Array.isArray(tObj[kStr]) ? tObj[kStr] : [];
          if (arr.includes("O")) total += arr.filter(v => v === "X").length;
        });
        return total;
      };
      const suA = getSU(a.raw), suB = getSU(b.raw);
      if (suA !== suB) return true;
      const fpA = getFP(a.raw), fpB = getFP(b.raw);
      if (fpA !== fpB) return true;
      return false;
    }
    if (!isPista) {
      const seqDesc = (r) => {
        if (r == null) return [];
        const obj = typeof r === "object" ? r : { marca: r };
        return [obj.t1, obj.t2, obj.t3, obj.t4, obj.t5, obj.t6]
          .map(v => { const n = parseFloat(v); return isNaN(n) ? null : n; })
          .filter(n => n !== null).sort((x, y) => y - x);
      };
      const sa = seqDesc(a.raw), sb = seqDesc(b.raw);
      const len = Math.max(sa.length, sb.length);
      for (let i = 0; i < len; i++) {
        if ((sa[i] ?? -Infinity) !== (sb[i] ?? -Infinity)) return true;
      }
      return false;
    }
    return false;
  };

  // Atribuir posições
  const resultado = {};
  let posAtual = 1;
  let posContador = 0;
  entradas.forEach((e, idx) => {
    if (e.isStatus) {
      resultado[e.id] = { ...e.raw, posicao: null };
      return;
    }
    posContador++;
    const prev = idx > 0 ? entradas[idx - 1] : null;
    const mesmaMarca = prev && !prev.isStatus && e.marca != null && prev.marca != null && e.marca === prev.marca;

    if (mesmaMarca && !desempateResolveu(prev, e)) {
      resultado[e.id] = { ...e.raw, posicao: posAtual };
    } else {
      posAtual = posContador;
      resultado[e.id] = { ...e.raw, posicao: posAtual };
    }
  });
  return resultado;
}

/**
 * POST /api/resultados/recalcular-posicoes
 *
 * Recalcula posições de TODOS os documentos de resultados no Firestore.
 * Aplica desempate RT 26.9 (altura/vara) e RT 25.22 (campo).
 * Requer autenticação.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const decoded = await verificarToken(req);
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido ou ausente' });
  }

  try {
    const snap = await db.collection('resultados').get();
    let atualizados = 0;
    let erros = 0;
    const LOTE = 500;
    const updates = [];

    snap.forEach(docSnap => {
      const chave = docSnap.id;
      const dados = docSnap.data();

      // Extrair provaId da chave: eventoId_provaId_catId_sexo[__fase]
      // Remover eventoId (tudo até o primeiro _) — mas eventoId pode conter _
      // Formato: eventoId é timestamp (ex: 1745010218628)
      // Chave: 1745010218628_F_sub14_altura_sub14_F ou 1745010218628_F_sub14_altura_sub14_F__FIN
      let chaveBase = chave;
      if (chaveBase.includes('__')) {
        chaveBase = chaveBase.split('__')[0];
      }

      // eventoId é o primeiro segmento (timestamp numérico)
      const firstUnd = chaveBase.indexOf('_');
      if (firstUnd < 0) return;
      const rest = chaveBase.substring(firstUnd + 1);

      // rest = provaId_catId_sexo — extrair provaId (tudo menos os últimos 2 segmentos)
      const lastUnd = rest.lastIndexOf('_');
      if (lastUnd < 0) return;
      const rest2 = rest.substring(0, lastUnd);
      const lastUnd2 = rest2.lastIndexOf('_');
      if (lastUnd2 < 0) return;
      const provId = rest2.substring(0, lastUnd2);

      if (!provasMap[provId]) return; // prova desconhecida

      const recalculado = calcularPosicoes(dados, provId);
      updates.push({ id: chave, data: recalculado });
    });

    // Gravar em lotes
    for (let i = 0; i < updates.length; i += LOTE) {
      const batch = db.batch();
      updates.slice(i, i + LOTE).forEach(u => {
        batch.set(db.collection('resultados').doc(u.id), u.data);
      });
      try {
        await batch.commit();
        atualizados += Math.min(LOTE, updates.length - i);
      } catch (err) {
        console.error(`Erro batch ${i}:`, err.message);
        erros += Math.min(LOTE, updates.length - i);
      }
    }

    return res.status(200).json({
      ok: true,
      totalDocs: snap.size,
      atualizados,
      erros,
    });
  } catch (err) {
    console.error('Erro ao recalcular posições:', err);
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
};
