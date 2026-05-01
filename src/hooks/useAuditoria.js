import { useLocalStorage } from "../lib/storage/useLocalStorage";

/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * Gerencia o histórico de ações (auditoria) com cap de 500 registros.
 */
export function useAuditoria() {
  const [historicoAcoes, setHistoricoAcoes] = useLocalStorage("atl_historico", []);

  const registrarAcao = (usuarioId, nomeUsuario, acao, detalhe = "", organizadorId = null, extra = {}) =>
    setHistoricoAcoes(p => [{
      id: Date.now().toString(), usuarioId, nomeUsuario, acao, detalhe, organizadorId,
      data: new Date().toISOString(), ...extra
    }, ...p].slice(0, 500));

  return { historicoAcoes, setHistoricoAcoes, registrarAcao };
}
