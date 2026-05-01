/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * Gerencia exportar, importar e limpar todos os dados do sistema.
 */
export function useBackupRestore({
  confirmar, usuarioLogado, registrarAcao,
  // Dados (leitura para export)
  equipes, organizadores, atletasUsuarios, funcionarios, treinadores,
  atletas, eventos, inscricoes, resultados, numeracaoPeito,
  solicitacoesRecuperacao, solicitacoesEquipe, solicitacoesRelatorio, historicoAcoes,
  recordes, pendenciasRecorde, historicoRecordes,
  ranking, historicoRanking,
  solicitacoesVinculo, notificacoes,
  solicitacoesPortabilidade,
  siteBranding, perfisDisponiveis, adminConfig,
  // Resets (limpar)
  resetOrganizadores, resetAtletasUsuarios, resetFuncionarios, resetTreinadores,
  resetEquipes, resetAtletas, resetEventos, resetInscricoes, resetResultados,
  resetNumeracao, resetRecordes, resetRanking,
  // Setters (limpar + importar)
  setSolicitacoesRecuperacao, setSolicitacoesVinculo, setNotificacoes,
  setHistoricoAcoes, setPendenciasRecorde, setHistoricoRecordes,
  setHistoricoRanking, setPerfisDisponiveis, setAdminConfig, setEventoAtualId,
  setSolicitacoesEquipe, setSolicitacoesRelatorio, setSolicitacoesPortabilidade,
  setSiteBranding,
  // Importers
  importarEquipes, importarOrganizadores, importarAtletasUsuarios,
  importarFuncionarios, importarTreinadores, importarAtletas,
  importarEventos, importarInscricoes, importarResultados,
  importarNumeracao, importarRecordes, importarRanking,
}) {
  const limparTodosDados = async () => {
    if (!await confirmar("ATENÇÃO: Esta ação é IRREVERSÍVEL e EXTREMAMENTE DESTRUTIVA!\n\nVocê está prestes a APAGAR TODOS OS DADOS do sistema:\n\n• Todas as competições\n• Todos os atletas\n• Todas as equipes\n• Todos os organizadores\n• Todas as inscrições\n• Todos os resultados\n• Todos os recordes\n• Todas as pendências de recorde\n• Todo o histórico\n\nAS CONTAS DE LOGIN (Firebase Auth) NÃO SERÃO APAGADAS.\nOs usuários ainda conseguirão fazer login, mas sem perfil no sistema.\nPara apagar as contas de login, acesse o Console do Firebase manualmente.\n\nEsta ação NÃO PODE SER DESFEITA.\n\nDeseja realmente continuar?")) return;
    resetOrganizadores();
    resetAtletasUsuarios();
    setSolicitacoesRecuperacao([]);
    resetFuncionarios();
    resetTreinadores();
    setHistoricoAcoes([]);
    setSolicitacoesVinculo([]);
    setNotificacoes([]);
    resetEquipes();
    resetAtletas();
    await resetEventos();
    setEventoAtualId(null);
    resetInscricoes();
    resetResultados();
    await resetNumeracao();
    resetRecordes();
    setPendenciasRecorde([]);
    setHistoricoRecordes([]);
    resetRanking();
    setHistoricoRanking([]);
    setPerfisDisponiveis([]);
    setAdminConfig(prev => ({ ...prev, configurado: true }));
    registrarAcao(usuarioLogado?.id || "system", usuarioLogado?.nome || "Sistema", "Limpou todos os dados", "Reset completo do sistema", null, { modulo: "sistema" });
  };

  const exportarDados = () => {
    const dados = {
      versao: "1.2",
      exportadoEm: new Date().toISOString(),
      equipes, organizadores, atletasUsuarios, funcionarios, treinadores,
      atletas, eventos, inscricoes, resultados, numeracaoPeito,
      solicitacoesRecuperacao, solicitacoesEquipe, solicitacoesRelatorio, historicoAcoes,
      recordes, pendenciasRecorde, historicoRecordes,
      ranking, historicoRanking,
      solicitacoesVinculo, notificacoes,
      solicitacoesPortabilidade,
      siteBranding, perfisDisponiveis,
      adminConfig,
    };
    const json = JSON.stringify(dados, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gerentrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Exportou backup", `${eventos.length} eventos, ${atletas.length} atletas, ${recordes.length} tipos recorde`, null, { modulo: "sistema" });
    alert("Backup exportado com sucesso!\n\nATENÇÃO: O backup NÃO inclui as contas de login (Firebase Auth).\nAs senhas e e-mails de acesso dos usuários ficam no Firebase Authentication e não podem ser exportados pelo sistema.\nSe necessário, exporte-os manualmente pelo Console do Firebase.");
  };

  const importarDados = async (arquivo) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dados = JSON.parse(e.target.result);
        if (!dados.versao) throw new Error("Arquivo inválido — não é um backup do sistema.");
        if (!await confirmar(
          `Importar backup de ${new Date(dados.exportadoEm).toLocaleString("pt-BR")}?\n\n` +
          `Isso SUBSTITUIRÁ todos os dados atuais:\n` +
          `• ${dados.eventos?.length || 0} evento(s)\n` +
          `• ${dados.atletas?.length || 0} atleta(s)\n` +
          `• ${dados.inscricoes?.length || 0} inscrição(ões)\n` +
          `• ${dados.equipes?.length || 0} equipe(s)\n` +
          `• ${dados.organizadores?.length || 0} organizador(es)\n` +
          `• ${dados.recordes?.length || 0} tipo(s) de recorde\n` +
          `• ${dados.pendenciasRecorde?.length || 0} pendência(s) de recorde\n\n` +
          `Esta ação não pode ser desfeita.`
        )) return;
        if (dados.equipes)                   await importarEquipes(dados.equipes);
        if (dados.organizadores)             await importarOrganizadores(dados.organizadores);
        if (dados.atletasUsuarios)           await importarAtletasUsuarios(dados.atletasUsuarios);
        if (dados.funcionarios)              await importarFuncionarios(dados.funcionarios);
        if (dados.treinadores)              await importarTreinadores(dados.treinadores);
        if (dados.atletas)                   await importarAtletas(dados.atletas);
        if (dados.eventos)                   await importarEventos(dados.eventos);
        if (dados.inscricoes)                await importarInscricoes(dados.inscricoes);
        if (dados.resultados)                await importarResultados(dados.resultados);
        if (dados.numeracaoPeito)            await importarNumeracao(dados.numeracaoPeito);
        if (dados.solicitacoesRecuperacao)   setSolicitacoesRecuperacao(dados.solicitacoesRecuperacao);
        if (dados.solicitacoesEquipe)        setSolicitacoesEquipe(dados.solicitacoesEquipe);
        if (dados.solicitacoesRelatorio)     setSolicitacoesRelatorio(dados.solicitacoesRelatorio);
        if (dados.historicoAcoes)            setHistoricoAcoes(dados.historicoAcoes);
        if (dados.recordes)                  await importarRecordes(dados.recordes);
        if (dados.pendenciasRecorde)         setPendenciasRecorde(dados.pendenciasRecorde);
        if (dados.historicoRecordes)         setHistoricoRecordes(dados.historicoRecordes);
        if (dados.ranking)                   await importarRanking(dados.ranking);
        if (dados.historicoRanking)          setHistoricoRanking(dados.historicoRanking);
        if (dados.solicitacoesVinculo)       setSolicitacoesVinculo(dados.solicitacoesVinculo);
        if (dados.notificacoes)              setNotificacoes(dados.notificacoes);
        if (dados.solicitacoesPortabilidade) setSolicitacoesPortabilidade(dados.solicitacoesPortabilidade);
        if (dados.siteBranding)              setSiteBranding(dados.siteBranding);
        if (dados.perfisDisponiveis)         setPerfisDisponiveis(dados.perfisDisponiveis);
        if (dados.adminConfig) {
          setAdminConfig(dados.adminConfig);
        }
        setEventoAtualId(null);
        alert("Backup importado com sucesso!");
        registrarAcao(usuarioLogado?.id || "system", usuarioLogado?.nome || "Sistema", "Importou backup", `v${dados.versao} de ${new Date(dados.exportadoEm).toLocaleString("pt-BR")}`, null, { modulo: "sistema" });
      } catch (err) {
        alert("Erro ao importar: " + err.message);
      }
    };
    reader.readAsText(arquivo);
  };

  return { limparTodosDados, exportarDados, importarDados };
}
