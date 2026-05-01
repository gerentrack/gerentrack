/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * CRUD de atletas: adicionar, editar, excluir, desvincular, em lote.
 */
export function useCrudAtletas({
  atletas, _adicionarAtleta, _adicionarAtletasEmLote, _atualizarAtleta,
  excluirAtletaPorId, excluirAtletasPorIds, excluirInscricoesPorAtletas,
  atletasRef, atletasUsuarios, setAtletasUsuarios,
  confirmar, registrarAcao, adicionarNotificacao, usuarioLogado,
}) {
  const adicionarAtleta = async (a) => {
    await _adicionarAtleta(a);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Cadastrou atleta", `${a.nome || ""}${a.clube ? " — " + a.clube : ""}${a.sexo ? " · " + (a.sexo === "M" ? "Masc" : "Fem") : ""}`, usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "atletas" });
  };

  const adicionarAtletasEmLote = async (lista) => {
    await _adicionarAtletasEmLote(lista);
    if (usuarioLogado) {
      const nomes = lista.slice(0, 10).map(a => a.nome || "?").join(", ");
      const extra = lista.length > 10 ? ` +${lista.length - 10} mais` : "";
      registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Importou atletas em lote", `${lista.length} atleta(s): ${nomes}${extra}`, usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "atletas" });
    }
  };

  const atualizarAtleta = async (a) => {
    await _atualizarAtleta(a);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Editou atleta", `${a.nome || ""}${a.clube ? " — " + a.clube : ""}`, usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "atletas" });
  };

  const _excluirAtletaInterno = (atletaId) => {
    const atleta = atletas.find(a => a.id === atletaId);
    const nomeAtleta = atleta?.nome || "atleta";
    excluirAtletaPorId(atletaId);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Excluiu atleta", `${nomeAtleta}${atleta?.clube ? " — " + atleta.clube : ""}`, usuarioLogado.organizadorId || null, { equipeId: usuarioLogado.equipeId, modulo: "atletas" });
    if (atleta) {
      setAtletasUsuarios(p => p.filter(u => {
        if (atleta.atletaUsuarioId && u.id === atleta.atletaUsuarioId) return false;
        if (atleta.email && u.email && u.email.toLowerCase() === atleta.email.toLowerCase()) return false;
        if (atleta.cpf && u.cpf && u.cpf.replace(/\D/g, "") === atleta.cpf.replace(/\D/g, "")) return false;
        return true;
      }));
    }
  };

  const excluirAtleta = async (atletaId) => {
    const atleta = atletas.find(a => a.id === atletaId);
    const nomeAtleta = atleta?.nome || "este atleta";
    if (!await confirmar(`ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nExcluir "${nomeAtleta}"?\n\nO cadastro será removido permanentemente.\nInscrições e resultados serão mantidos como snapshots.`)) return;
    _excluirAtletaInterno(atletaId);
  };

  const excluirAtletasEmMassa = (ids) => {
    const idsSet = ids instanceof Set ? ids : new Set(ids);
    const atletasRemovidos = atletas.filter(a => idsSet.has(a.id));
    excluirAtletasPorIds(idsSet);
    const emailsRem = new Set();
    const cpfsRem = new Set();
    const userIdsRem = new Set();
    atletasRemovidos.forEach(a => {
      if (a.atletaUsuarioId) userIdsRem.add(a.atletaUsuarioId);
      if (a.email) emailsRem.add(a.email.toLowerCase());
      if (a.cpf) cpfsRem.add(a.cpf.replace(/\D/g, ""));
    });
    setAtletasUsuarios(p => p.filter(u => {
      if (userIdsRem.has(u.id)) return false;
      if (u.email && emailsRem.has(u.email.toLowerCase())) return false;
      if (u.cpf && cpfsRem.has(u.cpf.replace(/\D/g, ""))) return false;
      return true;
    }));
    excluirInscricoesPorAtletas(idsSet);
    if (usuarioLogado) {
      const nomes = atletasRemovidos.slice(0, 10).map(a => a.nome || "?").join(", ");
      const extra = atletasRemovidos.length > 10 ? ` +${atletasRemovidos.length - 10} mais` : "";
      registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Excluiu atletas em massa", `${idsSet.size} atleta(s): ${nomes}${extra}`, usuarioLogado.organizadorId || null, { modulo: "atletas" });
    }
  };

  const desvincularAtleta = (atletaId) => {
    const atleta = atletas.find(a => a.id === atletaId);
    const equipeAnterior = atleta?.clube || "";
    const atletaDesv = atletasRef.current.find(a => a.id === atletaId);
    if (atletaDesv) _atualizarAtleta({ ...atletaDesv, equipeId: null, clube: "", equipeAnterior, desvinculadoEm: new Date().toISOString() });
    const contaAtleta = atletasUsuarios.find(u =>
      u.cpf && atleta?.cpf && u.cpf.replace(/\D/g, "") === atleta.cpf.replace(/\D/g, ""));
    if (contaAtleta) {
      adicionarNotificacao(contaAtleta.id, "desvinculacao",
        `Você foi desvinculado${equipeAnterior ? ` da equipe ${equipeAnterior}` : ""}.` +
        ` Seus resultados anteriores permanecem registrados em nome da equipe.`,
        { equipeAnterior }
      );
    }
  };

  return {
    adicionarAtleta, adicionarAtletasEmLote, atualizarAtleta,
    excluirAtleta, excluirAtletasEmMassa, desvincularAtleta,
  };
}
