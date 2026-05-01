import { functions, httpsCallable } from "../firebase";

/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * CRUD de equipes: adicionar, editar, excluir (filiada + usuário), admin edits.
 */
export function useCrudEquipes({
  equipes, _adicionarEquipe, _atualizarEquipe, mergeEquipe, excluirEquipePorId,
  atletas, excluirAtletasPorIds, excluirInscricoesPorAtletas,
  atletasUsuarios, setAtletasUsuarios, atletasRef,
  confirmar, registrarAcao, usuarioLogado, _atualizarAtleta,
}) {
  const adicionarEquipe = (eq) => _adicionarEquipe(eq);

  const adicionarEquipeFiliada = (eq) => {
    _adicionarEquipe(eq);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Cadastrou equipe", `${eq.nome || ""}${eq.sigla ? " (" + eq.sigla + ")" : ""}${eq.cidade ? " — " + eq.cidade : ""}${eq.estado || eq.uf ? "/" + (eq.estado || eq.uf) : ""}`, usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "equipes" });
  };

  const editarEquipeFiliada = async (eq) => {
    await _atualizarEquipe(eq);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Editou equipe", `${eq.nome || ""}${eq.sigla ? " (" + eq.sigla + ")" : ""}`, usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "equipes" });
  };

  const atualizarEquipe = async (equipeatualizada) => {
    await _atualizarEquipe(equipeatualizada);
  };

  const excluirEquipeUsuario = async (id) => {
    const equipe = equipes.find(e => e.id === id);
    const nomeEquipe = equipe?.nome || "esta equipe";
    const atletasVinculados = atletas.filter(a => a.clube === equipe?.nome || a.equipeId === id);
    const nAtletas = atletasVinculados.length;
    const msg = `Excluir equipe "${nomeEquipe}"?\n\n` +
      (nAtletas > 0 ? `${nAtletas} atleta(s) vinculado(s) também serão excluídos!\n\n` : "") +
      `Esta ação é IRREVERSÍVEL!`;
    if (!await confirmar(msg)) return;
    excluirEquipePorId(id);
    if (nAtletas > 0) {
      const idsAtletas = new Set(atletasVinculados.map(a => a.id));
      const atletaUsuarioIds = new Set(atletasVinculados.filter(a => a.atletaUsuarioId).map(a => a.atletaUsuarioId));
      const orgIdEquipe = equipe?.organizadorId;
      excluirAtletasPorIds(idsAtletas);
      setAtletasUsuarios((p) => p.filter(a => {
        if (a.equipeId === id) return false;
        if (atletaUsuarioIds.has(a.id) && (!a.organizadorId || a.organizadorId === orgIdEquipe)) return false;
        return true;
      }));
      excluirInscricoesPorAtletas(idsAtletas);
    }
  };

  const excluirAtletaUsuario = async (id) => {
    if (!await confirmar("Excluir este atleta usuário?\n\nEsta ação é IRREVERSÍVEL!")) return;
    setAtletasUsuarios((p) => p.filter(a => a.id !== id));
  };

  const excluirEquipeFiliada = async (id) => {
    const equipe = equipes.find(e => e.id === id);
    const nomeEquipe = equipe?.nome || "esta equipe";
    const atletasVinculados = atletas.filter(a => a.clube === equipe?.nome || a.equipeId === id);
    const nAtletas = atletasVinculados.length;
    const msg = `ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\n` +
      `Excluir equipe "${nomeEquipe}"?\n\n` +
      (nAtletas > 0 ? `${nAtletas} atleta(s) vinculado(s) também serão excluídos!\n\n` : "") +
      `Deseja realmente continuar?`;
    if (!await confirmar(msg)) return;
    excluirEquipePorId(id);
    if (equipe?.email) {
      try {
        const deleteAuthUser = httpsCallable(functions, "deleteAuthUser");
        await deleteAuthUser({ email: equipe.email });
      } catch (err) {
        console.warn("[excluirEquipeFiliada] Não foi possível deletar conta Auth da equipe:", err.message);
        alert(`Atenção: a conta Auth da equipe (${equipe.email}) não foi excluída automaticamente.\nExclua manualmente em Gerenciar Usuários > Contas Órfãs.\n\nMotivo: ${err.message}`);
      }
    }
    if (nAtletas > 0) {
      const idsAtletas = new Set(atletasVinculados.map(a => a.id));
      const atletaUsuarioIds = new Set(atletasVinculados.filter(a => a.atletaUsuarioId).map(a => a.atletaUsuarioId));
      const orgIdEquipe = equipe?.organizadorId;
      excluirAtletasPorIds(idsAtletas);
      setAtletasUsuarios((p) => p.filter(a => {
        if (a.equipeId === id) return false;
        if (atletaUsuarioIds.has(a.id) && (!a.organizadorId || a.organizadorId === orgIdEquipe)) return false;
        return true;
      }));
      excluirInscricoesPorAtletas(idsAtletas);
    }
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Excluiu equipe", `${nomeEquipe} (${nAtletas} atletas removidos)`, usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "equipes" });
  };

  const editarEquipeAdmin = (eq) => mergeEquipe(eq);

  const editarAtletaUsuarioAdmin = async (au) => {
    setAtletasUsuarios((p) => p.map(x => x.id === au.id ? { ...x, ...au } : x));
    for (const a of atletasRef.current) {
      if (a.atletaUsuarioId !== au.id && !(a.email && au.email && a.email.toLowerCase() === au.email.toLowerCase())) continue;
      try {
        await _atualizarAtleta({ ...a, nome: au.nome || a.nome, email: au.email || a.email, cpf: au.cpf || a.cpf, fone: au.fone || a.fone, dataNasc: au.dataNasc || a.dataNasc, anoNasc: au.dataNasc ? au.dataNasc.split("-")[0] : a.anoNasc, sexo: au.sexo || a.sexo, organizadorId: au.organizadorId || a.organizadorId });
      } catch (err) {
        console.warn("[editarAtletaUsuarioAdmin] Erro ao sincronizar atleta:", err.message);
      }
    }
  };

  return {
    adicionarEquipe, adicionarEquipeFiliada, editarEquipeFiliada,
    atualizarEquipe, excluirEquipeUsuario, excluirAtletaUsuario, excluirEquipeFiliada,
    editarEquipeAdmin, editarAtletaUsuarioAdmin,
  };
}
