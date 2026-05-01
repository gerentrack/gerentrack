import { useEffect } from "react";
import { useLocalStorage } from "../lib/storage/useLocalStorage";

/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * Gerencia notificações com limite de 200, expiração automática (48h lidas, 7d não lidas).
 */
export function useNotificacoes() {
  const [notificacoes, _setNotificacoes] = useLocalStorage("atl_notificacoes", []);

  // Wrapper com limite de 200 entradas por usuário
  const setNotificacoes = (fn) => _setNotificacoes(prev => {
    const novo = typeof fn === "function" ? fn(prev) : fn;
    return Array.isArray(novo) ? novo.slice(0, 200) : novo;
  });

  const adicionarNotificacao = (para, tipo, msg, extra = {}) =>
    setNotificacoes(p => [{
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      para, tipo, msg, data: new Date().toISOString(), lida: false, ...extra
    }, ...p]);

  const marcarNotifLida = (id) =>
    setNotificacoes(p => p.map(n => n.id === id ? { ...n, lida: true, lidaEm: new Date().toISOString() } : n));

  // Limpar notificações: lidas há +48h, não lidas há +168h (7 dias)
  useEffect(() => {
    const agora = Date.now();
    const _48h = 48 * 60 * 60 * 1000;
    const _168h = 168 * 60 * 60 * 1000;
    setNotificacoes(p => {
      const filtradas = p.filter(n => {
        if (n.lida && n.lidaEm) return agora - new Date(n.lidaEm).getTime() < _48h;
        return agora - new Date(n.data).getTime() < _168h;
      });
      return filtradas.length === p.length ? p : filtradas;
    });
  }, []);

  return { notificacoes, setNotificacoes, adicionarNotificacao, marcarNotifLida };
}
