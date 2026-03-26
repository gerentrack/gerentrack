/**
 * routes.jsx
 * Definição centralizada de todas as rotas do GERENTRACK.
 *
 * Cada rota mapeia um path para o valor de `tela` correspondente,
 * facilitando a migração incremental do sistema de routing baseado em estado
 * para React Router.
 */

// ── Mapeamento path → tela (fonte de verdade para URLs) ─────────────────────

export const ROUTES = {
  // Públicas
  home:                    "/",
  login:                   "/entrar",
  cadastroEquipe:          "/cadastro/equipe",
  cadastroOrganizador:     "/cadastro/organizador",
  cadastroAtletaLogin:     "/cadastro/atleta",
  recuperarSenha:          "/recuperar-senha",
  trocarSenha:             "/trocar-senha",
  selecionarPerfil:        "/selecionar-perfil",
  recordes:                "/recordes",
  ranking:                 "/ranking",

  // Configurações (auth)
  configuracoes:           "/configuracoes",

  // Admin
  admin:                   "/admin",
  gerenciarUsuarios:       "/admin/usuarios",
  gerenciarEquipes:        "/admin/equipes",
  funcionarios:            "/admin/funcionarios",
  treinadores:             "/admin/treinadores",
  cadastrarAtleta:         "/admin/atleta/novo",
  editarAtleta:            "/admin/atleta/:id/editar",
  importarAtletas:         "/admin/importar-atletas",
  auditoria:               "/admin/auditoria",

  // Painéis
  painel:                  "/painel",
  painelOrganizador:       "/painel/organizador",
  painelAtleta:            "/painel/atleta",
  painelEquipe:            "/painel/equipe",

  // Competição (com slug dinâmico)
  novoEvento:              "/competicao/novo",
  editarEvento:            "/competicao/:slug/editar",
  eventoDetalhe:           "/competicao/:slug",
  resultados:              "/competicao/:slug/resultados",
  sumulas:                 "/competicao/:slug/sumulas",
  digitarResultados:       "/competicao/:slug/digitar",
  inscricaoAvulsa:         "/competicao/:slug/inscricao",
  inscricaoRevezamento:    "/competicao/:slug/inscricao/revezamento",
  gestaoInscricoes:        "/competicao/:slug/gestao-inscricoes",
  gerenciarInscricoes:     "/competicao/:slug/gerenciar-inscricoes",
  numeracaoPeito:          "/competicao/:slug/numeracao",
  configPontuacao:         "/competicao/:slug/pontuacao",
  secretaria:              "/competicao/:slug/secretaria",
  exportLynx:              "/competicao/:slug/finishlynx",
  gerenciarMembros:        "/competicao/:slug/membros",
  prepararOffline:         "/competicao/:slug/offline",

  // Organizador (catch-all — deve ser a última rota)
  organizadorPerfil:       "/:slug",
};

// ── Mapeamento tela → path (para migração incremental) ──────────────────────

export const TELA_TO_PATH = {
  "home":                       ROUTES.home,
  "login":                      ROUTES.login,
  "cadastro-equipe":            ROUTES.cadastroEquipe,
  "cadastro-organizador":       ROUTES.cadastroOrganizador,
  "cadastro-atleta-login":      ROUTES.cadastroAtletaLogin,
  "recuperar-senha":            ROUTES.recuperarSenha,
  "trocar-senha":               ROUTES.trocarSenha,
  "selecionar-perfil":          ROUTES.selecionarPerfil,
  "recordes":                   ROUTES.recordes,
  "ranking":                    ROUTES.ranking,
  "configuracoes":              ROUTES.configuracoes,
  "admin":                      ROUTES.admin,
  "gerenciar-usuarios":         ROUTES.gerenciarUsuarios,
  "gerenciar-equipes":          ROUTES.gerenciarEquipes,
  "funcionarios":               ROUTES.funcionarios,
  "treinadores":                ROUTES.treinadores,
  "cadastrar-atleta":           ROUTES.cadastrarAtleta,
  "editar-atleta":              ROUTES.editarAtleta,
  "importar-atletas":           ROUTES.importarAtletas,
  "auditoria":                  ROUTES.auditoria,
  "painel":                     ROUTES.painel,
  "painel-organizador":         ROUTES.painelOrganizador,
  "painel-atleta":              ROUTES.painelAtleta,
  "painel-equipe":              ROUTES.painelEquipe,
  "novo-evento":                ROUTES.novoEvento,
  "evento-detalhe":             ROUTES.eventoDetalhe,
  "resultados":                 ROUTES.resultados,
  "sumulas":                    ROUTES.sumulas,
  "digitar-resultados":         ROUTES.digitarResultados,
  "inscricao-avulsa":           ROUTES.inscricaoAvulsa,
  "inscricao-revezamento":      ROUTES.inscricaoRevezamento,
  "gestao-inscricoes":          ROUTES.gestaoInscricoes,
  "gerenciar-inscricoes":       ROUTES.gerenciarInscricoes,
  "numeracao-peito":            ROUTES.numeracaoPeito,
  "config-pontuacao-equipes":   ROUTES.configPontuacao,
  "secretaria":                 ROUTES.secretaria,
  "export-lynx":                ROUTES.exportLynx,
  "gerenciar-membros":          ROUTES.gerenciarMembros,
  "preparar-offline":           ROUTES.prepararOffline,
  "organizador-perfil":         ROUTES.organizadorPerfil,
};

/**
 * Gera um path concreto substituindo parâmetros dinâmicos.
 * Ex: buildPath(ROUTES.eventoDetalhe, { slug: "torneio-2026" }) → "/competicao/torneio-2026"
 */
export function buildPath(template, params = {}) {
  let path = template;
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, encodeURIComponent(value));
  });
  return path;
}

/**
 * Converte um valor de `tela` para um path navegável.
 * Usado durante a migração incremental para que setTela possa opcionalmente atualizar a URL.
 */
export function telaToPath(tela, context = {}) {
  const template = TELA_TO_PATH[tela];
  if (!template) return null;

  // Substituir :slug para rotas de competição
  if (template.includes(":slug") && context.slug) {
    return buildPath(template, { slug: context.slug });
  }
  // Substituir :id para rotas com ID
  if (template.includes(":id") && context.id) {
    return buildPath(template, { id: context.id });
  }
  return template;
}
