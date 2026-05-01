/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * CRUD de organizadores: slug, adicionar, editar, aprovar, recusar, excluir.
 */
export function useCrudOrganizadores({
  organizadores, setOrganizadores, confirmar,
  adicionarNotificacao, registrarAcao, usuarioLogado,
}) {
  const gerarSlugOrganizador = (nome, id) => {
    const base = (nome || "organizador")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60);
    const jaExiste = organizadores.some(o => o.slug === base && o.id !== id);
    return jaExiste ? `${base}-${id.slice(-4)}` : base;
  };

  const adicionarOrganizador = (o) => {
    const comSlug = { ...o, slug: o.slug || gerarSlugOrganizador(o.entidade || o.nome, o.id) };
    setOrganizadores((p) => [...p, comSlug]);
  };

  const editarOrganizadorAdmin = (o) => setOrganizadores((p) => p.map(x => x.id === o.id ? { ...x, ...o } : x));

  const excluirOrganizador = async (id) => {
    if (!await confirmar("Excluir este organizador?\n\nEsta ação é IRREVERSÍVEL!")) return;
    setOrganizadores((p) => p.filter(o => o.id !== id));
  };

  const aprovarOrganizador = (id) => {
    setOrganizadores((p) => p.map(o => o.id === id ? { ...o, status: "aprovado" } : o));
    const org = organizadores.find(o => o.id === id);
    adicionarNotificacao(id, "organizador_aprovado",
      `Sua conta de organizador (${org?.entidade || ""}) foi aprovada! Você já pode acessar o sistema.`);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Aprovou organizador", org?.nome || id, null, { modulo: "sistema" });
  };

  const recusarOrganizador = (id) => {
    setOrganizadores((p) => p.map(o => o.id === id ? { ...o, status: "recusado" } : o));
    const org = organizadores.find(o => o.id === id);
    adicionarNotificacao(id, "organizador_recusado",
      `Sua solicitação de conta de organizador (${org?.entidade || ""}) foi recusada.`);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Recusou organizador", org?.nome || id, null, { modulo: "sistema" });
  };

  return {
    gerarSlugOrganizador,
    adicionarOrganizador, editarOrganizadorAdmin,
    excluirOrganizador, aprovarOrganizador, recusarOrganizador,
  };
}
