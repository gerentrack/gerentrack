const { db } = require('./_lib/firestore');

/**
 * GET /api/og?slug=copa-minas-2026
 *
 * Retorna HTML com meta tags Open Graph para crawlers.
 * Browsers normais nunca chegam aqui (filtrados pelo rewrite no vercel.json).
 */

const DEFAULT_OG_IMAGE = 'https://gerentrack.com.br/pwa-512x512.png';

module.exports = async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.redirect(307, '/');
  }

  const url = `https://gerentrack.com.br/competicao/${slug}/resultados`;

  try {
    const snapshot = await db.collection('eventos').where('slug', '==', slug).limit(1).get();

    let title = 'GERENTRACK — Competição com Precisão';
    let description = 'Sistema de gerenciamento de competições de atletismo';
    let ogImage = DEFAULT_OG_IMAGE;

    if (!snapshot.empty) {
      const evento = snapshot.docs[0].data();
      const nome = evento.nome || 'Competição';
      const data = evento.data || '';
      const cidade = evento.cidade || '';
      const estado = evento.uf || evento.estado || '';
      const local = [cidade, estado].filter(Boolean).join(' - ');

      let qtdAtletas = '';
      try {
        const inscSnap = await db.collection('inscricoes')
          .where('eventoId', '==', snapshot.docs[0].id)
          .get();
        const atletasUnicos = new Set();
        inscSnap.forEach(doc => {
          const d = doc.data();
          if (d.atletaId) atletasUnicos.add(d.atletaId);
        });
        if (atletasUnicos.size > 0) qtdAtletas = ` · ${atletasUnicos.size} atletas`;
      } catch {}

      title = `Resultados — ${nome}`;
      description = [data, local].filter(Boolean).join(' · ') + qtdAtletas;

      if (evento.logoCompeticao) {
        ogImage = evento.logoCompeticao;
      }
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:site_name" content="GERENTRACK">
  <meta property="og:locale" content="pt_BR">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(ogImage)}">
</head>
<body></body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Erro OG:', err);
    return res.redirect(307, url);
  }
};

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
