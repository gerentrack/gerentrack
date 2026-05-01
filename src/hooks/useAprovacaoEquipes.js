/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * Aprovação e recusa de equipes.
 */
export function useAprovacaoEquipes({
  equipes, _atualizarEquipe, solicitacoesEquipe, setSolicitacoesEquipe,
  organizadores, adicionarNotificacao, registrarAcao, usuarioLogado,
}) {
  const aprovarEquipe = async (equipeId, novoOrgId) => {
    let eq = equipes.find(e => e.id === equipeId);
    // Equipe pode não estar no Firestore (falha na criação antes da correção de rules)
    // Recria a partir dos dados da solicitação
    if (!eq) {
      const sol = solicitacoesEquipe.find(s => s.equipeId === equipeId);
      if (!sol) return;
      eq = {
        id: equipeId,
        nome: sol.equipeNome,
        sigla: sol.equipeSigla,
        email: sol.equipeEmail,
        cnpj: sol.equipeCnpj,
        cidade: sol.equipeCidade,
        uf: sol.equipeUf,
        organizadorId: novoOrgId || sol.organizadorId || null,
        status: "pendente",
        dataCadastro: sol.data || new Date().toISOString(),
      };
    }
    await _atualizarEquipe({ ...eq, status: "ativa", ...(novoOrgId ? { organizadorId: novoOrgId } : {}) });
    setSolicitacoesEquipe(p => p.map(s => s.equipeId === equipeId && s.status === "pendente"
      ? { ...s, status: "aprovada", dataResposta: new Date().toISOString() }
      : s
    ));
    adicionarNotificacao(equipeId, "aprovacao_equipe",
      `Sua equipe "${eq?.nome || ""}" foi aprovada! Você já pode gerenciar atletas e realizar inscrições.`);
    if (usuarioLogado) {
      const orgVinc = organizadores.find(o => o.id === (novoOrgId || eq?.organizadorId));
      registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Aprovou equipe", `${eq?.nome || equipeId}${eq?.sigla ? " (" + eq.sigla + ")" : ""}${orgVinc ? " — " + (orgVinc.entidade || orgVinc.nome) : ""}`, null, { modulo: "sistema" });
    }
  };

  const recusarEquipe = async (equipeId) => {
    const eq = equipes.find(e => e.id === equipeId);
    if (!eq) return;
    await _atualizarEquipe({ ...eq, status: "recusada" });
    setSolicitacoesEquipe(p => p.map(s => s.equipeId === equipeId && s.status === "pendente"
      ? { ...s, status: "recusada", dataResposta: new Date().toISOString() }
      : s
    ));
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Recusou equipe", `${eq?.nome || equipeId}${eq?.sigla ? " (" + eq.sigla + ")" : ""}${eq?.email ? " · " + eq.email : ""}`, null, { modulo: "sistema" });
  };

  return { aprovarEquipe, recusarEquipe };
}
