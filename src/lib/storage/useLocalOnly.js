/**
 * useLocalOnly
 *
 * Hook de persistência apenas em localStorage — SEM sincronização com Firestore.
 *
 * Usado para dados que são individuais por navegador/sessão:
 *  - usuário logado  (atl_usuario)
 *  - evento selecionado (atl_eventoAtualId)
 *  - perfis disponíveis (atl_perfis_disponiveis)
 *
 * Não faz round-trip de rede, então é ideal para estado de UI local.
 *
 * Extraído de App.jsx (linha 79) — Etapa 1 da refatoração.
 */
import { useState, useRef, useCallback } from "react";

export function useLocalOnly(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const ref = useRef(storedValue);
  ref.current = storedValue;

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(ref.current) : value;
        ref.current = valueToStore;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.log(error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
