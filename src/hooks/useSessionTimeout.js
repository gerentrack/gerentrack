/**
 * useSessionTimeout
 *
 * Monitora inatividade do usuário e expira a sessão automaticamente.
 * Admin: 30min. Demais: 24h. Aviso 5min antes para todos.
 * Não expira enquanto offline (preserva dados locais).
 *
 * Extraído de App.jsx — Etapa 2.3 da decomposição.
 */
import { useState, useEffect, useRef, useCallback } from "react";

export function useSessionTimeout(usuarioLogado, { onExpire }) {
  const INATIVIDADE_MS     = usuarioLogado?.tipo === "admin" ? 30 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const AVISO_ANTECEDENCIA = 5 * 60 * 1000;

  const [sessaoAvisoContagem, setSessaoAvisoContagem] = useState(null);
  const ultimaAtividadeRef = useRef(Date.now());

  // Rastrear atividade do usuário (clique, tecla, scroll, toque)
  useEffect(() => {
    if (!usuarioLogado) return;
    const atualizarAtividade = () => { ultimaAtividadeRef.current = Date.now(); };
    const eventos = ["mousedown", "keydown", "scroll", "touchstart"];
    eventos.forEach(ev => window.addEventListener(ev, atualizarAtividade, { passive: true }));
    return () => eventos.forEach(ev => window.removeEventListener(ev, atualizarAtividade));
  }, [!!usuarioLogado]);

  // Loop de verificação a cada segundo
  useEffect(() => {
    if (!usuarioLogado) return;
    const intervalo = setInterval(() => {
      // Não expira enquanto offline — dados locais precisam ser preservados
      if (!navigator.onLine) { ultimaAtividadeRef.current = Date.now(); setSessaoAvisoContagem(null); return; }
      const agora = Date.now();
      const inativo = agora - ultimaAtividadeRef.current;
      const restante = INATIVIDADE_MS - inativo;
      if (restante <= 0) {
        clearInterval(intervalo);
        setSessaoAvisoContagem(null);
        onExpire();
      } else if (restante <= AVISO_ANTECEDENCIA) {
        setSessaoAvisoContagem(Math.ceil(restante / 1000));
      } else {
        setSessaoAvisoContagem(null);
      }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [!!usuarioLogado, INATIVIDADE_MS]);

  const renovarSessao = useCallback(() => {
    if (!usuarioLogado) return;
    ultimaAtividadeRef.current = Date.now();
    setSessaoAvisoContagem(null);
  }, [!!usuarioLogado]);

  return { sessaoAvisoContagem, renovarSessao };
}
