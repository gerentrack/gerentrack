const CRAWLER_UA = /bot|crawler|spider|facebookexternalhit|WhatsApp|Telegram|Twitterbot|LinkedInBot|Slackbot|Discordbot|Googlebot|bingbot|Applebot/i;

export const config = {
  matcher: '/competicao/:slug/resultados',
};

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (CRAWLER_UA.test(ua)) {
    const url = new URL(request.url);
    const slug = url.pathname.match(/\/competicao\/([^/]+)\/resultados/)?.[1];
    if (slug) {
      return Response.redirect(new URL(`/api/og/competicao/${slug}/resultados`, request.url), 307);
    }
  }
  // Browsers normais → continua para o SPA
}
