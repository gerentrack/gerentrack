/**
 * Helper de paginação para API pública.
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(query.per_page) || 20));
  const offset = (page - 1) * perPage;
  return { page, perPage, offset };
}

function buildPaginacao(page, perPage, total) {
  return {
    pagina: page,
    por_pagina: perPage,
    total,
    total_paginas: Math.ceil(total / perPage),
  };
}

module.exports = { parsePagination, buildPaginacao };
