/**
 * AdminConfigContext.jsx
 * Context para adminConfig — usado apenas por TelaLogin, TelaConfiguracoes e TelaAdmin.
 *
 * Separado do AppContext por seguranca: adminConfig nao deve estar no spread global.
 * Uso: const { adminConfig, setAdminConfig } = useAdminConfig();
 */

import React, { createContext, useContext } from "react";

const AdminConfigContext = createContext(null);

export function AdminConfigProvider({ value, children }) {
  return <AdminConfigContext.Provider value={value}>{children}</AdminConfigContext.Provider>;
}

export function useAdminConfig() {
  const ctx = useContext(AdminConfigContext);
  if (!ctx) throw new Error("useAdminConfig deve ser usado dentro de <AdminConfigProvider>");
  return ctx;
}
