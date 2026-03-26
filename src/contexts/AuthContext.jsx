/**
 * AuthContext.jsx
 * Context de autenticação — substitui props de auth no spread global.
 *
 * Provê: usuarioLogado, login, logout, perfisDisponiveis, etc.
 * Uso: const { usuarioLogado, login, logout } = useAuth();
 */

import React, { createContext, useContext } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ value, children }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}

/**
 * Extrai as props de auth do objeto props do App.jsx.
 * Usado durante a migração para construir o value do AuthProvider.
 *
 * Props incluídas:
 * - usuarioLogado, setUsuarioLogado
 * - login, loginComSelecao, logout
 * - perfisDisponiveis, setPerfisDisponiveis
 * - gerarSenhaTemp, aplicarSenhaTemp, atualizarSenha
 * - solicitacoesRecuperacao, adicionarSolicitacaoRecuperacao, resolverSolicitacaoRecuperacao
 */
export function buildAuthValue(props) {
  return {
    usuarioLogado: props.usuarioLogado,
    setUsuarioLogado: props.setUsuarioLogado,
    login: props.login,
    loginComSelecao: props.loginComSelecao,
    logout: props.logout,
    perfisDisponiveis: props.perfisDisponiveis,
    setPerfisDisponiveis: props.setPerfisDisponiveis,
    gerarSenhaTemp: props.gerarSenhaTemp,
    aplicarSenhaTemp: props.aplicarSenhaTemp,
    atualizarSenha: props.atualizarSenha,
    solicitacoesRecuperacao: props.solicitacoesRecuperacao,
    adicionarSolicitacaoRecuperacao: props.adicionarSolicitacaoRecuperacao,
    resolverSolicitacaoRecuperacao: props.resolverSolicitacaoRecuperacao,
  };
}
