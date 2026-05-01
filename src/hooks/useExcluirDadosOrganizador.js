import {
  storage, storageRef, uploadBytes, getDownloadURL,
  functions, httpsCallable,
} from "../firebase";

/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * Exclusão completa de dados de um organizador (Fase 3 — D.3.3 LGPD).
 */
export function useExcluirDadosOrganizador({
  organizadores, atletas, equipes, inscricoes, resultados, eventos, historicoAcoes,
  atletasUsuarios, funcionarios, treinadores,
  setAtletasUsuarios, setFuncionarios, setTreinadores,
  excluirEventoPorId, excluirInscricoesPorEvento, excluirResultadosPorEvento,
  limparNumeracaoEvento, excluirEquipePorId, excluirAtletasPorIds,
  editarOrganizadorAdmin, registrarAcao, usuarioLogado,
}) {
  const excluirDadosOrganizador = async (orgId) => {
    const org = organizadores.find(o => o.id === orgId);
    if (!org) return { erro: "Organizador não encontrado." };

    // 1. Exportar dados (cópia de segurança para reimplantação — D.3.4)
    const { exportarDadosOrg } = await import("../shared/engines/exportEngine");
    const arqs = exportarDadosOrg(orgId, { atletas, equipes, inscricoes, resultados, eventos, historicoAcoes });

    // 2. Upload da cópia para Firebase Storage — OBRIGATÓRIO antes de excluir
    let backupUrl = null;
    let backupPath = null;
    try {
      const dados = {};
      arqs.forEach(a => { dados[a.nome] = a.conteudo; });
      const blob = new Blob([JSON.stringify(dados)], { type: "application/json" });
      const slug = (org.entidade || org.nome || "org").toLowerCase().replace(/\s+/g, "-").slice(0, 30);
      backupPath = `exports/${orgId}/${slug}_${new Date().toISOString().slice(0, 10)}.json`;
      const ref = storageRef(storage, backupPath);
      await uploadBytes(ref, blob);
      backupUrl = await getDownloadURL(ref);
    } catch (err) {
      console.error("[excluirDadosOrganizador] Erro ao salvar backup no Storage:", err);
      return { erro: "Falha ao salvar backup no servidor. Exclusão abortada para proteção dos dados." };
    }

    // 3. Verificar se o backup é acessível
    try {
      const resp = await fetch(backupUrl, { method: "HEAD" });
      if (!resp.ok) throw new Error("Backup inacessível");
    } catch (err) {
      console.error("[excluirDadosOrganizador] Backup não verificado:", err);
      return { erro: "Backup salvo mas não pôde ser verificado. Exclusão abortada por segurança." };
    }

    // 4. Backup confirmado — proceder com exclusão
    const eventosOrg = eventos.filter(ev => ev.organizadorId === orgId);
    for (const ev of eventosOrg) {
      excluirEventoPorId(ev.id);
      excluirInscricoesPorEvento(ev.id);
      excluirResultadosPorEvento(ev.id);
      limparNumeracaoEvento(ev.id);
    }

    const equipesOrg = equipes.filter(eq => eq.organizadorId === orgId);
    for (const eq of equipesOrg) excluirEquipePorId(eq.id);

    const atletasOrg = atletas.filter(a => a.organizadorId === orgId);
    if (atletasOrg.length > 0) {
      excluirAtletasPorIds(new Set(atletasOrg.map(a => a.id)));
    }

    const emailsParaExcluir = new Set();
    if (org.email) emailsParaExcluir.add(org.email.trim().toLowerCase());
    atletasUsuarios.filter(a => a.organizadorId === orgId && a.email).forEach(a => emailsParaExcluir.add(a.email.trim().toLowerCase()));
    funcionarios.filter(f => f.organizadorId === orgId && f.email).forEach(f => emailsParaExcluir.add(f.email.trim().toLowerCase()));
    treinadores.filter(tr => tr.organizadorId === orgId && tr.email).forEach(tr => emailsParaExcluir.add(tr.email.trim().toLowerCase()));
    equipesOrg.forEach(eq => { if (eq.email) emailsParaExcluir.add(eq.email.trim().toLowerCase()); });

    setAtletasUsuarios(prev => prev.filter(a => a.organizadorId !== orgId));
    setFuncionarios(prev => prev.filter(f => f.organizadorId !== orgId));
    setTreinadores(prev => prev.filter(tr => tr.organizadorId !== orgId));

    const deleteAuthUser = httpsCallable(functions, "deleteAuthUser");
    let authExcluidasCount = 0;
    for (const email of emailsParaExcluir) {
      try {
        await deleteAuthUser({ email });
        authExcluidasCount++;
      } catch (err) {
        console.warn(`[excluirDadosOrganizador] Não foi possível excluir conta Auth ${email}:`, err.message);
      }
    }

    editarOrganizadorAdmin({ ...org, dadosExcluidosEm: new Date().toISOString(), plano: null, creditosAvulso: [], exportacaoUrl: backupUrl, exportacaoPath: backupPath, exportacaoPosFim: new Date().toISOString() });

    registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Excluiu dados do organizador (Fase 3)",
      `${org.entidade}: ${eventosOrg.length} evento(s), ${equipesOrg.length} equipe(s), ${atletasOrg.length} atleta(s), ${authExcluidasCount} conta(s) Auth`,
      null, { modulo: "licencas" });

    return { arqs, backupUrl };
  };

  return { excluirDadosOrganizador };
}
