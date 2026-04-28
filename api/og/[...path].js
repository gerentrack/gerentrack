const { db } = require('../_lib/firestore');

/**
 * Open Graph meta tags para páginas públicas de resultados.
 *
 * Crawlers (WhatsApp, Telegram, Google, Facebook, Twitter) recebem
 * HTML com meta tags preenchidas. Browsers normais são redirecionados
 * para o SPA.
 */

const CRAWLER_UA = /bot|crawler|spider|crawling|facebookexternalhit|WhatsApp|Telegram|Twitterbot|LinkedInBot|Slackbot|Discordbot|GoogleOther|Googlebot|bingbot|yandex|baidu|duckduckbot|embedly|quora|outbrain|pinterest|vkShare|Applebot/i;

const DEFAULT_OG_IMAGE = 'https://gerentrack.com.br/pwa-512x512.png';

module.exports = async function handler(req, res) {
  const ua = req.headers['user-agent'] || '';

  // Browsers normais → redireciona para o SPA
  if (!CRAWLER_UA.test(ua)) {
    const path = req.url.replace('/api/og', '') || '/';
    return res.redirect(307, path);
  }

  // Extrair slug da URL: /api/og/competicao/:slug/resultados
  const match = req.url.match(/\/competicao\/([^/]+)/);
  if (!match) {
    return res.redirect(307, req.url.replace('/api/og', '') || '/');
  }

  const slug = match[1];

  try {
    // Buscar evento pelo slug
    const snapshot = await db.collection('eventos').where('slug', '==', slug).limit(1).get();

    let title = 'GERENTRACK — Competição com Precisão';
    let description = 'Sistema de gerenciamento de competições de atletismo';
    let ogImage = DEFAULT_OG_IMAGE;
    let url = `https://gerentrack.com.br/competicao/${slug}/resultados`;

    if (!snapshot.empty) {
      const evento = snapshot.docs[0].data();
      const nome = evento.nome || 'Competição';
      const data = evento.data || '';
      const cidade = evento.cidade || '';
      const estado = evento.uf || evento.estado || '';
      const local = [cidade, estado].filter(Boolean).join(' - ');

      // Contar atletas inscritos
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

      // Logo da competição ou do organizador
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
    return res.redirect(307, `/competicao/${slug}/resultados`);
  }
};

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
