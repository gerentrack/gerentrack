/**
 * ConfirmContext.jsx
 * Provê o hook useConfirm() para substituir window.confirm em qualquer componente.
 *
 * Uso:
 *   const confirmar = useConfirm();
 *   const ok = await confirmar("Deseja excluir?");
 *   if (!ok) return;
 */
import React, { createContext, useContext, useRef, useState, useCallback } from "react";
import { ConfirmModal } from "./ConfirmModal";

const ConfirmCtx = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ mensagem: null });
  const resolveRef = useRef(null);

  const confirmar = useCallback((mensagem) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ mensagem });
    });
  }, []);

  const handleConfirm = () => {
    setState({ mensagem: null });
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setState({ mensagem: null });
    resolveRef.current?.(false);
  };

  return (
    <ConfirmCtx.Provider value={confirmar}>
      {children}
      <ConfirmModal
        mensagem={state.mensagem}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmCtx.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm deve ser usado dentro de <ConfirmProvider>");
  return ctx;
}
