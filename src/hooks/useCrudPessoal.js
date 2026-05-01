/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * CRUD de funcionários e treinadores.
 */
export function useCrudPessoal({
  funcionarios, setFuncionarios, treinadores, setTreinadores, confirmar,
}) {
  const adicionarFuncionario = (f) => setFuncionarios((p) => [...p, f]);
  const atualizarFuncionario = (f) => setFuncionarios((p) => p.map(x => x.id === f.id ? f : x));
  const removerFuncionario = async (id) => {
    const func = funcionarios.find(f => f.id === id);
    const nomeFuncionario = func?.nome || "este funcionário";
    if (!await confirmar(`Remover "${nomeFuncionario}"?\n\nEsta ação é IRREVERSÍVEL e o funcionário perderá acesso ao sistema.`)) return;
    setFuncionarios((p) => p.filter(x => x.id !== id));
  };

  const adicionarTreinador = (tr) => setTreinadores((p) => [...p, tr]);
  const atualizarTreinador = (tr) => setTreinadores((p) => p.map(x => x.id === tr.id ? tr : x));
  const removerTreinador = async (id) => {
    const trein = treinadores.find(tr => tr.id === id);
    if (!await confirmar(`Remover "${trein?.nome || "este treinador"}"?\n\nEsta ação é IRREVERSÍVEL.`)) return;
    setTreinadores((p) => p.filter(x => x.id !== id));
  };

  return {
    adicionarFuncionario, atualizarFuncionario, removerFuncionario,
    adicionarTreinador, atualizarTreinador, removerTreinador,
  };
}
