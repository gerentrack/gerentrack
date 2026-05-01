import { useLocalStorage } from "../lib/storage/useLocalStorage";

/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * Gerencia solicitações: recuperação de senha, portabilidade, equipe, relatório, vínculo.
 */
export function useSolicitacoes({ adicionarNotificacao, registrarAcao, usuarioLogado, eventos }) {
  const [solicitacoesVinculo, setSolicitacoesVinculo] = useLocalStorage("atl_vinculo_sol", []);
  const [solicitacoesRecuperacao, setSolicitacoesRecuperacao] = useLocalStorage("atl_recuperacao", []);
  const [solicitacoesEquipe, setSolicitacoesEquipe] = useLocalStorage("atl_sol_equipe", []);
  const [solicitacoesPortabilidade, setSolicitacoesPortabilidade] = useLocalStorage("atl_portabilidade", []);
  const [solicitacoesRelatorio, setSolicitacoesRelatorio] = useLocalStorage("atl_sol_relatorio", []);

  // ── Recuperação de senha ──
  const adicionarSolicitacaoRecuperacao = (sol) =>
    setSolicitacoesRecuperacao(p => [...p, { ...sol, id: Date.now().toString(), data: new Date().toISOString() }]);
  const resolverSolicitacaoRecuperacao = (id) =>
    setSolicitacoesRecuperacao(p => p.map(s => s.id === id ? { ...s, status: "resolvido" } : s));

  // ── Portabilidade de dados (Art. 18º, V LGPD) ──
  const adicionarSolicitacaoPortabilidade = (sol) =>
    setSolicitacoesPortabilidade(p => [...p, {
      ...sol, id: Date.now().toString(), status: "pendente", data: new Date().toISOString()
    }]);
  const resolverSolicitacaoPortabilidade = (id, dadosJson) => {
    const sol = solicitacoesPortabilidade.find(s => s.id === id);
    setSolicitacoesPortabilidade(p => p.map(s => s.id === id
      ? { ...s, status: "pronto", dadosJson, dataResolucao: new Date().toISOString() }
      : s
    ));
    if (sol) adicionarNotificacao(sol.usuarioId, "portabilidade",
      "Sua solicitação de portabilidade de dados foi processada. Acesse Configurações → Minha Conta para baixar o arquivo.");
  };
  const excluirSolicitacaoPortabilidade = (id) =>
    setSolicitacoesPortabilidade(p => p.filter(s => s.id !== id));

  // ── Solicitações de equipe ──
  const adicionarSolicitacaoEquipe = (sol) => {
    setSolicitacoesEquipe(p => [sol, ...p]);
  };

  // ── Solicitações de relatório de participação ──
  const solicitarRelatorio = (solicitanteId, solicitanteNome, solicitanteTipo, eventoId, eventoNome, atletaIds = [], equipeId = null, assinaturaEquipe = null) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setSolicitacoesRelatorio(p => [...p, {
      id, solicitanteId, solicitanteNome, solicitanteTipo,
      eventoId, eventoNome, atletaIds, equipeId,
      ...(assinaturaEquipe ? { assinaturaEquipe } : {}),
      status: "pendente", data: new Date().toISOString()
    }]);
    const evt = eventos.find(e => e.id === eventoId);
    if (evt?.organizadorId) {
      adicionarNotificacao(evt.organizadorId, "relatorio_solicitado",
        `${solicitanteNome} solicitou relatório oficial de participação para "${eventoNome}".`);
    }
    registrarAcao(solicitanteId, solicitanteNome, "Solicitou relatório", `${eventoNome}${assinaturaEquipe ? " (com assinatura)" : ""}`, evt?.organizadorId || null, { equipeId, modulo: "relatorios" });
  };
  const resolverRelatorio = (solId, status) => {
    const sol = solicitacoesRelatorio.find(s => s.id === solId);
    setSolicitacoesRelatorio(p => p.map(s =>
      s.id === solId ? { ...s, status, resolvidoEm: new Date().toISOString() } : s
    ));
    if (sol) {
      adicionarNotificacao(sol.solicitanteId, "relatorio_gerado",
        status === "gerado"
          ? `Seu relatório oficial de participação para "${sol.eventoNome}" foi gerado pelo organizador.`
          : `Sua solicitação de relatório para "${sol.eventoNome}" foi recusada.`);
    }
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, status === "gerado" ? "Gerou relatório" : "Recusou relatório", `${sol?.eventoNome || ""} — solicitado por ${sol?.solicitanteNome || ""}`, usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: sol?.equipeId, modulo: "relatorios" });
  };
  const cancelarRelatorio = (solId) => {
    const sol = solicitacoesRelatorio.find(s => s.id === solId);
    setSolicitacoesRelatorio(p => p.map(s =>
      s.id === solId ? { ...s, status: "cancelado", resolvidoEm: new Date().toISOString() } : s
    ));
    if (sol) {
      const evt = eventos.find(e => e.id === sol.eventoId);
      if (evt?.organizadorId) {
        adicionarNotificacao(evt.organizadorId, "relatorio_cancelado",
          `${sol.solicitanteNome} cancelou a solicitação de relatório para "${sol.eventoNome}".`);
      }
    }
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Cancelou solicitação de relatório", sol?.eventoNome || "", usuarioLogado.organizadorId || null, { equipeId: sol?.equipeId || usuarioLogado.equipeId, modulo: "relatorios" });
  };
  const excluirRelatorio = (solId) => {
    const sol = solicitacoesRelatorio.find(s => s.id === solId);
    setSolicitacoesRelatorio(p => p.filter(s => s.id !== solId));
    if (sol) {
      adicionarNotificacao(sol.solicitanteId, "relatorio_excluido",
        `O relatório de participação para "${sol.eventoNome}" foi excluído. Solicite novamente se necessário.`);
    }
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Excluiu relatório", sol?.eventoNome || "", usuarioLogado.organizadorId || null, { equipeId: sol?.equipeId || usuarioLogado.equipeId, modulo: "relatorios" });
  };

  return {
    // Estado
    solicitacoesVinculo, setSolicitacoesVinculo,
    solicitacoesRecuperacao, setSolicitacoesRecuperacao,
    solicitacoesEquipe, setSolicitacoesEquipe,
    solicitacoesPortabilidade, setSolicitacoesPortabilidade,
    solicitacoesRelatorio, setSolicitacoesRelatorio,
    // Handlers — recuperação
    adicionarSolicitacaoRecuperacao, resolverSolicitacaoRecuperacao,
    // Handlers — portabilidade
    adicionarSolicitacaoPortabilidade, resolverSolicitacaoPortabilidade, excluirSolicitacaoPortabilidade,
    // Handlers — equipe
    adicionarSolicitacaoEquipe,
    // Handlers — relatório
    solicitarRelatorio, resolverRelatorio, cancelarRelatorio, excluirRelatorio,
  };
}
