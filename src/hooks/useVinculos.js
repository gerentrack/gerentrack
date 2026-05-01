/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * Solicitação e resposta de vínculos atleta-equipe.
 */
export function useVinculos({
  equipes, setSolicitacoesVinculo, adicionarNotificacao, registrarAcao,
  usuarioLogado, atletasUsuarios, atletasRef, solicitacoesVinculoRef, _atualizarAtleta,
}) {
  // origem: "atleta" (atleta pede para equipe) | "equipe" (equipe pede ao atleta ou à equipe atual)
  // aprovadorTipo: "atleta" | "equipe_atual"
  // equipeAtualId: equipe atual do atleta (se houver) — precisa aprovar a transferência
  const solicitarVinculo = (atletaId, atletaNome, equipeId, clube, opts = {}) => {
    setSolicitacoesVinculo(p => [
      ...p.filter(s => !(s.atletaId === atletaId && s.status === "pendente")),
      { id: Date.now().toString(), atletaId, atletaNome, equipeId, clube,
        origem: opts.origem || "atleta",
        aprovadorTipo: opts.aprovadorTipo || "equipe",
        equipeAtualId: opts.equipeAtualId || null,
        equipeAtualNome: opts.equipeAtualNome || null,
        solicitanteId: opts.solicitanteId || null,
        solicitanteNome: opts.solicitanteNome || null,
        organizadorId: opts.organizadorId || null,
        ...(opts.tipo ? { tipo: opts.tipo } : {}),
        status: "pendente", data: new Date().toISOString() }
    ]);
    const _orgId = opts.organizadorId || equipes.find(e => e.id === equipeId)?.organizadorId;
    const _equipeNome = clube || equipes.find(e => e.id === equipeId)?.nome || "";
    if (opts.tipo === "desvinculacao") {
      if (_orgId) adicionarNotificacao(_orgId, "vinculo_solicitado",
        `Solicitação de desvinculação: "${atletaNome}" da equipe "${_equipeNome}". Acesse o painel para aprovar ou recusar.`);
    } else {
      if (_orgId) adicionarNotificacao(_orgId, "vinculo_solicitado",
        `O atleta "${atletaNome}" solicitou vínculo com a equipe "${_equipeNome}". Acesse o painel para aprovar ou recusar.`);
      adicionarNotificacao(equipeId, "vinculo_solicitado",
        `O atleta "${atletaNome}" solicitou vínculo com sua equipe. Aguardando aprovação do organizador.`);
    }
  };

  const responderVinculo = (solId, aceitar) => {
    const sol = solicitacoesVinculoRef.current.find(s => s.id === solId);
    if (!sol) return;
    const resolvidoPorNome = usuarioLogado?.nome || usuarioLogado?.id || "—";
    const resolvidoPorTipo = usuarioLogado?.tipo || "";
    const _equipeNome = sol.clube || equipes.find(e => e.id === sol.equipeId)?.nome || "";
    const _statusTxt = aceitar ? "aceito" : "recusado";
    const _isDesvinc = sol.tipo === "desvinculacao";
    const _tipoTxt = _isDesvinc ? "Desvinculação" : sol.aprovadorTipo === "equipe_atual" ? "Transferência" : "Vínculo";

    setSolicitacoesVinculo(p => p.map(s => s.id === solId
      ? { ...s, status: _statusTxt, resolvidoPorNome, resolvidoPorTipo, resolvidoEm: new Date().toISOString() } : s));

    const atv = atletasRef.current.find(a => a.id === sol.atletaId);
    const contaAtleta = atletasUsuarios.find(u =>
      u.cpf && atv?.cpf && u.cpf.replace(/\D/g, "") === atv.cpf.replace(/\D/g, ""));

    if (aceitar) {
      if (atv) {
        if (_isDesvinc) {
          const equipeAnterior = atv.clube || "";
          _atualizarAtleta({ ...atv, equipeId: null, clube: "", equipeAnterior, desvinculadoEm: new Date().toISOString() });
          if (contaAtleta) adicionarNotificacao(contaAtleta.id, "desvinculacao",
            `Você foi desvinculado${equipeAnterior ? ` da equipe ${equipeAnterior}` : ""}. Seus resultados anteriores permanecem registrados.`,
            { equipeAnterior });
          adicionarNotificacao(sol.equipeId, "vinculo_resolvido",
            `Desvinculação de "${sol.atletaNome}" foi aprovada pelo organizador.`);
        } else {
          _atualizarAtleta({ ...atv, equipeId: sol.equipeId, clube: sol.clube });
          if (contaAtleta) adicionarNotificacao(contaAtleta.id, "vinculo_resolvido",
            `Seu vínculo com a equipe "${_equipeNome}" foi aprovado.`);
          adicionarNotificacao(sol.equipeId, "vinculo_resolvido",
            `Vínculo de "${sol.atletaNome}" com sua equipe foi aprovado pelo organizador.`);
        }
      }
    } else {
      if (contaAtleta) adicionarNotificacao(contaAtleta.id, "vinculo_resolvido",
        _isDesvinc
          ? `Sua solicitação de saída da equipe "${_equipeNome}" foi recusada pelo organizador.`
          : `Sua solicitação de vínculo com a equipe "${_equipeNome}" foi recusada pelo organizador.`);
      adicionarNotificacao(sol.equipeId, "vinculo_resolvido",
        _isDesvinc
          ? `Desvinculação de "${sol.atletaNome}" foi recusada pelo organizador.`
          : `Solicitação de vínculo de "${sol.atletaNome}" foi recusada pelo organizador.`);
    }

    registrarAcao(
      usuarioLogado?.id, resolvidoPorNome,
      `${_tipoTxt} ${_statusTxt}`,
      `${sol.atletaNome} — equipe ${_equipeNome}`,
      usuarioLogado?.organizadorId || (usuarioLogado?.tipo === "organizador" ? usuarioLogado?.id : null),
      { modulo: "vinculos", atletaId: sol.atletaId, equipeId: sol.equipeId }
    );
  };

  return { solicitarVinculo, responderVinculo };
}
