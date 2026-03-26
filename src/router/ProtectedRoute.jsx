/**
 * ProtectedRoute.jsx
 * Wrapper para rotas que requerem autenticação.
 *
 * - Redireciona para /entrar se não autenticado
 * - Suporta verificação de tipo de usuário (roles)
 * - Salva URL de retorno para redirect após login
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * @param {object} props
 * @param {object|null} props.usuarioLogado — usuário logado (null = não autenticado)
 * @param {string[]} [props.roles] — tipos permitidos (ex: ["admin", "organizador"]). Se omitido, qualquer autenticado.
 * @param {string[]} [props.permissoes] — permissões específicas do funcionário (ex: ["resultados", "camara_chamada"])
 * @param {React.ReactNode} props.children — conteúdo da rota
 */
export default function ProtectedRoute({ usuarioLogado, roles, permissoes, children }) {
  const location = useLocation();

  // Não autenticado → redireciona para login com return URL
  if (!usuarioLogado) {
    return <Navigate to="/entrar" state={{ from: location.pathname }} replace />;
  }

  // Verificação de role (tipo de usuário)
  if (roles && roles.length > 0 && !roles.includes(usuarioLogado.tipo)) {
    return <Navigate to="/" replace />;
  }

  // Verificação de permissões específicas (para funcionários)
  if (permissoes && permissoes.length > 0 && usuarioLogado.tipo === "funcionario") {
    const userPerms = usuarioLogado.permissoes || [];
    const temPermissao = permissoes.some(p => userPerms.includes(p));
    if (!temPermissao) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
