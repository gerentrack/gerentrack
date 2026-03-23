import React, { createContext, useContext, useMemo } from "react";
import { temaDark, temaLight } from "./tema";

const TemaContext = createContext(temaDark);

export function TemaProvider({ temaClaro, children }) {
  const tema = useMemo(() => temaClaro ? temaLight : temaDark, [temaClaro]);
  return <TemaContext.Provider value={tema}>{children}</TemaContext.Provider>;
}

export function useTema() {
  return useContext(TemaContext);
}
