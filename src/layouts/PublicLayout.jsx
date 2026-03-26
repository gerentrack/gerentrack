/**
 * PublicLayout.jsx
 * Layout limpo para telas públicas de autenticação (login, cadastro, etc.).
 *
 * Sem header de navegação — apenas o conteúdo centralizado.
 * Será usado na Etapa 4 quando as rotas públicas migrarem para React Router.
 */

import React from "react";
import { useTema } from "../shared/TemaContext";

export default function PublicLayout({ children }) {
  const t = useTema();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}>
      {children}
    </div>
  );
}
