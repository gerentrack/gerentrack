import { useEffect } from "react";

/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * Guards reativos: perfil deletado + migração treinadores legados.
 */
export function useGuards({
  usuarioLogado, setUsuarioLogado, firebaseAuthed, setPerfisDisponiveis, navigate,
  equipes, organizadores, funcionarios, treinadores, setTreinadores,
}) {
  // Guard: perfil deletado — força logout se equipe/treinador/org/func não existe mais
  useEffect(() => {
    if (!usuarioLogado || !firebaseAuthed) return;
    const tipo = usuarioLogado.tipo;
    if (tipo === "admin" || tipo === "atleta") return;
    const listas = { organizador: organizadores, equipe: equipes, funcionario: funcionarios, treinador: treinadores };
    const lista = listas[tipo];
    if (!lista || lista.length === 0) return;
    if (!lista.some(u => u.id === usuarioLogado.id)) {
      console.warn(`[App] Perfil ${tipo} id=${usuarioLogado.id} deletado — logout`);
      setUsuarioLogado(null);
      setPerfisDisponiveis([]);
      navigate("/entrar");
    }
  }, [equipes, organizadores, funcionarios, treinadores]);

  // Migração: garantir tipo e organizadorId em treinadores legados
  const treinSemTipoIds = treinadores.filter(tr => !tr.tipo || !tr.organizadorId).map(tr => tr.id).join(",");
  useEffect(() => {
    if (!treinSemTipoIds) return;
    const atualizados = treinadores.map(tr => {
      if (tr.tipo && tr.organizadorId) return tr;
      const orgId = tr.organizadorId || equipes.find(eq => eq.id === tr.equipeId)?.organizadorId || null;
      return { ...tr, tipo: tr.tipo || "treinador", organizadorId: orgId };
    });
    console.info(`[Migração] Corrigindo ${treinSemTipoIds.split(",").length} treinador(es) sem tipo/organizadorId`);
    setTreinadores(atualizados);
  }, [treinSemTipoIds]);
}
