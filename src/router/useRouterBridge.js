/**
 * useRouterBridge.js
 * Hook ponte entre o sistema `tela` (legado) e React Router.
 *
 * Funciona em duas direções:
 * 1. tela → URL: quando setTela é chamado, atualiza a URL via navigate()
 * 2. URL → tela: na inicialização e no back/forward, resolve a URL para o tela correspondente
 *
 * Isso permite migração incremental — todas as telas ganham URL sem mudança de código.
 */

import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TELA_TO_PATH, ROUTES } from "./routes";

// ── Resolver URL → tela ─────────────────────────────────────────────────────

/**
 * Converte um pathname para { tela, params }.
 * @param {string} pathname — ex: "/competicao/torneio-2026/resultados"
 * @param {Array} eventos — lista de eventos (para resolver slugs)
 * @param {Array} organizadores — lista de organizadores (para resolver slugs)
 * @returns {{ tela: string, eventoId?: string, organizadorPerfilId?: string } | null}
 */
export function resolverPathParaTela(pathname, eventos = [], organizadores = []) {
  const path = pathname.replace(/\/+$/, "") || "/";

  // Rotas estáticas
  if (path === "/") return { tela: "home" };
  if (path === "/entrar") return { tela: "login" };
  if (path === "/cadastro/equipe") return { tela: "cadastro-equipe" };
  if (path === "/cadastro/organizador") return { tela: "cadastro-organizador" };
  if (path === "/cadastro/atleta") return { tela: "cadastro-atleta-login" };
  if (path === "/recuperar-senha") return { tela: "recuperar-senha" };
  if (path === "/trocar-senha") return { tela: "trocar-senha" };
  if (path === "/selecionar-perfil") return { tela: "selecionar-perfil" };
  if (path === "/recordes") return { tela: "recordes" };
  if (path === "/ranking") return { tela: "ranking" };
  if (path === "/configuracoes") return { tela: "configuracoes" };
  if (path === "/faq") return { tela: "faq" };
  if (path === "/planos") return { tela: "planos" };
  if (path === "/privacidade") return { tela: "privacidade" };
  if (path === "/termos") return { tela: "termos" };

  // Admin
  if (path === "/admin") return { tela: "admin" };
  if (path === "/admin/usuarios") return { tela: "gerenciar-usuarios" };
  if (path === "/admin/equipes") return { tela: "gerenciar-equipes" };
  if (path === "/admin/funcionarios") return { tela: "funcionarios" };
  if (path === "/admin/treinadores") return { tela: "treinadores" };
  if (path === "/admin/atleta/novo") return { tela: "cadastrar-atleta" };
  if (path === "/admin/atleta/cadastrar") return { tela: "cadastrar-atleta-novo" };
  if (path === "/admin/treinadores/novo") return { tela: "treinadores-novo" };
  if (path === "/admin/importar-atletas") return { tela: "importar-atletas" };
  if (path === "/admin/auditoria") return { tela: "auditoria" };

  // Admin editar atleta: /admin/atleta/:id/editar
  const editAtlMatch = path.match(/^\/admin\/atleta\/([^/]+)\/editar$/);
  if (editAtlMatch) return { tela: "editar-atleta", atletaEditandoId: editAtlMatch[1] };

  // Painéis
  if (path === "/painel") return { tela: "painel" };
  if (path === "/painel/organizador") return { tela: "painel-organizador" };
  if (path === "/painel/atleta") return { tela: "painel-atleta" };
  if (path === "/painel/equipe") return { tela: "painel-equipe" };

  // Competição: /competicao/novo
  if (path === "/competicao/novo") return { tela: "novo-evento" };

  // Competição com slug: /competicao/:slug[/sub]
  const compMatch = path.match(/^\/competicao\/([^/]+)(\/(.+))?$/);
  if (compMatch) {
    const slug = compMatch[1];
    const sub = compMatch[3] || "";
    const evento = eventos.find(ev => ev.slug === slug || ev.id === slug);
    const eventoId = evento?.id || slug;

    if (sub === "") return { tela: "evento-detalhe", eventoId };
    if (sub === "editar") return { tela: "novo-evento", eventoId };
    if (sub === "resultados") return { tela: "resultados", eventoId };
    if (sub === "sumulas") return { tela: "sumulas", eventoId };
    if (sub === "digitar") return { tela: "digitar-resultados", eventoId };
    if (sub === "inscricao") return { tela: "inscricao-avulsa", eventoId };
    if (sub === "inscricao/revezamento") return { tela: "inscricao-revezamento", eventoId };
    if (sub === "gestao-inscricoes") return { tela: "gestao-inscricoes", eventoId };
    if (sub === "gerenciar-inscricoes") return { tela: "gerenciar-inscricoes", eventoId };
    if (sub === "numeracao") return { tela: "numeracao-peito", eventoId };
    if (sub === "pontuacao") return { tela: "config-pontuacao-equipes", eventoId };
    if (sub === "secretaria") return { tela: "secretaria", eventoId };
    if (sub === "finishlynx") return { tela: "export-lynx", eventoId };
    if (sub === "membros") return { tela: "gerenciar-membros", eventoId };
    if (sub === "offline") return { tela: "preparar-offline", eventoId };
    if (sub === "regulamento") return { tela: "regulamento", eventoId };

    // Sub-rota desconhecida → detalhe do evento
    return { tela: "evento-detalhe", eventoId };
  }

  // Organizador: /:slug (catch-all — última verificação)
  const orgSlug = path.replace(/^\//, "");
  if (orgSlug && !orgSlug.includes("/")) {
    const org = organizadores.find(o => o.slug === orgSlug);
    if (org) return { tela: "organizador-perfil", organizadorPerfilId: org.id };
  }

  return null;
}

// ── Construir URL a partir de tela + contexto ───────────────────────────────

function buildUrlForTela(tela, context = {}) {
  const { slug, eventoSlug, id } = context;

  // Rotas de competição que precisam de slug
  const telaCompRoutes = {
    "evento-detalhe": "",
    "novo-evento": context.eventoId ? "/editar" : null, // editar vs novo
    "resultados": "/resultados",
    "sumulas": "/sumulas",
    "digitar-resultados": "/digitar",
    "inscricao-avulsa": "/inscricao",
    "inscricao-revezamento": "/inscricao/revezamento",
    "gestao-inscricoes": "/gestao-inscricoes",
    "gerenciar-inscricoes": "/gerenciar-inscricoes",
    "numeracao-peito": "/numeracao",
    "config-pontuacao-equipes": "/pontuacao",
    "secretaria": "/secretaria",
    "export-lynx": "/finishlynx",
    "gerenciar-membros": "/membros",
    "preparar-offline": "/offline",
    "regulamento": "/regulamento",
  };

  if (tela in telaCompRoutes && eventoSlug) {
    const sub = telaCompRoutes[tela];
    if (sub === null) return "/competicao/novo"; // novo-evento sem eventoId
    return `/competicao/${eventoSlug}${sub}`;
  }
  if (tela === "novo-evento" && !context.eventoId) return "/competicao/novo";

  // Editar atleta
  if (tela === "editar-atleta" && id) return `/admin/atleta/${id}/editar`;

  // Organizador perfil
  if (tela === "organizador-perfil" && slug) return `/${slug}`;

  // Rotas estáticas
  const staticMap = {
    "home": "/",
    "login": "/entrar",
    "cadastro-equipe": "/cadastro/equipe",
    "cadastro-organizador": "/cadastro/organizador",
    "cadastro-atleta-login": "/cadastro/atleta",
    "recuperar-senha": "/recuperar-senha",
    "trocar-senha": "/trocar-senha",
    "selecionar-perfil": "/selecionar-perfil",
    "recordes": "/recordes",
    "ranking": "/ranking",
    "configuracoes": "/configuracoes",
    "admin": "/admin",
    "gerenciar-usuarios": "/admin/usuarios",
    "gerenciar-equipes": "/admin/equipes",
    "funcionarios": "/admin/funcionarios",
    "treinadores": "/admin/treinadores",
    "cadastrar-atleta": "/admin/atleta/novo",
    "cadastrar-atleta-novo": "/admin/atleta/cadastrar",
    "treinadores-novo": "/admin/treinadores/novo",
    "importar-atletas": "/admin/importar-atletas",
    "auditoria": "/admin/auditoria",
    "faq": "/faq",
    "planos": "/planos",
    "privacidade": "/privacidade",
    "termos": "/termos",
    "painel": "/painel",
    "painel-organizador": "/painel/organizador",
    "painel-atleta": "/painel/atleta",
    "painel-equipe": "/painel/equipe",
  };

  return staticMap[tela] || null;
}

// ── Hook principal ──────────────────────────────────────────────────────────

/**
 * Hook que sincroniza tela ↔ URL.
 *
 * @param {object} params
 * @param {string} params.tela — tela atual
 * @param {Function} params._setTela — setter direto do state (sem side-effects)
 * @param {Array} params.eventos — lista de eventos
 * @param {Array} params.organizadores — lista de organizadores
 * @param {string|null} params.eventoAtualId — ID do evento selecionado
 * @param {Function} params.setEventoAtualId
 * @param {string|null} params.organizadorPerfilId
 * @param {Function} params.setOrganizadorPerfilId
 * @param {Function} params.setAtletaEditandoId
 */
export function useRouterBridge({
  tela, _setTela,
  eventos, organizadores,
  eventoAtualId, setEventoAtualId,
  organizadorPerfilId, setOrganizadorPerfilId,
  setAtletaEditandoId,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const inicializado = useRef(false);
  const navegandoPorTela = useRef(false);

  // ── URL → tela (inicialização + back/forward) ──
  useEffect(() => {
    if (navegandoPorTela.current) {
      navegandoPorTela.current = false;
      return;
    }

    const resultado = resolverPathParaTela(location.pathname, eventos, organizadores);
    if (!resultado) return;

    if (resultado.eventoId && resultado.eventoId !== eventoAtualId) {
      setEventoAtualId(resultado.eventoId);
    }
    if (resultado.organizadorPerfilId && resultado.organizadorPerfilId !== organizadorPerfilId) {
      setOrganizadorPerfilId(resultado.organizadorPerfilId);
    }
    if (resultado.atletaEditandoId && setAtletaEditandoId) {
      setAtletaEditandoId(resultado.atletaEditandoId);
    }

    if (resultado.tela !== tela) {
      _setTela(resultado.tela);
    }

    inicializado.current = true;
  }, [location.pathname, eventos.length, organizadores.length]);

  // ── setTela wrapper: tela → URL ──
  const setTela = useCallback((novaTela, { replace = false } = {}) => {
    _setTela(novaTela);
    navegandoPorTela.current = true;

    // Construir contexto para URL
    const eventoAtual = eventos.find(ev => ev.id === eventoAtualId);
    const orgItem = organizadores.find(o => o.id === organizadorPerfilId);

    const url = buildUrlForTela(novaTela, {
      eventoSlug: eventoAtual?.slug || eventoAtualId,
      eventoId: eventoAtualId,
      slug: orgItem?.slug,
      id: novaTela === "editar-atleta" ? undefined : undefined, // atletaEditandoId não está acessível aqui diretamente
    });

    if (url) {
      if (replace) {
        navigate(url, { replace: true });
      } else {
        navigate(url);
      }
    }
  }, [_setTela, navigate, eventos, eventoAtualId, organizadores, organizadorPerfilId]);

  return { setTela };
}
