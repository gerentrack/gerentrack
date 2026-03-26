/**
 * MainLayout.jsx
 * Layout principal com Header + main + footer.
 *
 * Usado para todas as telas que mostram o header de navegação.
 * O conteúdo da rota é renderizado via children (ou futuramente <Outlet />).
 *
 * NOTA: Durante a migração, este layout coexiste com a renderização
 * direta no App.jsx. Será ativado na Etapa 4.
 */

import React from "react";
import Header from "../features/layout/Header";
import { useTema } from "../shared/TemaContext";

export default function MainLayout({ children, headerProps, footerStyle }) {
  const t = useTema();

  return (
    <>
      <Header {...headerProps} />
      <main style={{ flex: 1, width: "100%", maxWidth: 1400, margin: "0 auto", padding: 0 }}>
        {children}
      </main>
      <footer style={footerStyle || { textAlign: "center", padding: "20px 16px", fontSize: 12, color: t.textDisabled }}>
        <span style={{ opacity: 0.4 }}>Desenvolvido por: GERENTRACK</span>
      </footer>
    </>
  );
}
