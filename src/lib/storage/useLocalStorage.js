/**
 * useLocalStorage
 *
 * Hook de persistência com dupla camada:
 *  1. localStorage  → leitura imediata (sem flicker)
 *  2. Firestore     → sincronização em tempo real entre abas/dispositivos
 *
 * Comportamento:
 *  - Na montagem, assina o documento `state/{key}` no Firestore via onSnapshot.
 *  - Quando o snapshot chega, substitui o valor local pelo remoto.
 *  - Ao gravar (setValue), persiste em localStorage E Firestore simultaneamente.
 *  - O flag `firestoreLoaded` evita sobrescrever o Firestore com dado stale
 *    durante o carregamento inicial.
 *
 * Extraído de App.jsx (linha 26) — Etapa 1 da refatoração.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { db, doc, setDoc, onSnapshot, auth } from "../../firebase";
import { sanitizeForFirestore } from "../firestore/sanitize";

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (err) {
      console.error(`[useLocalStorage] Falha ao ler "${key}" do localStorage:`, err);
      return initialValue;
    }
  });

  const ref = useRef(storedValue);
  ref.current = storedValue;
  const firestoreLoaded = useRef(false);

  // ── Sincronização Firestore em tempo real ──────────────────────────────────
  useEffect(() => {
    const docRef = doc(db, "state", key);
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const remoteVal = snap.data().value;
          ref.current = remoteVal;
          setStoredValue(remoteVal);
          try {
            window.localStorage.setItem(key, JSON.stringify(remoteVal));
          } catch (quotaErr) {
            console.warn(`[useLocalStorage] localStorage cheio ao sincronizar "${key}":`, quotaErr);
          }
        }
        firestoreLoaded.current = true;
      },
      (error) => {
        console.error("Firestore sync error:", key, error);
        firestoreLoaded.current = true;
      }
    );
    return unsub;
  }, [key]);

  // ── Setter com persistência dupla ──────────────────────────────────────────
  const setValue = useCallback(
    (value) => {
      const valueToStore =
        value instanceof Function ? value(ref.current) : value;
      ref.current = valueToStore;
      setStoredValue(valueToStore);

      // localStorage: falha de quota não bloqueia o Firestore
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (quotaErr) {
        console.warn(`[useLocalStorage] localStorage cheio ao gravar "${key}":`, quotaErr);
      }

      // Firestore: só grava após carregamento inicial E com usuário autenticado
      // (regras exigem request.auth != null para escrita em state/{id})
      if (firestoreLoaded.current && auth.currentUser) {
        const docRef = doc(db, "state", key);
        setDoc(docRef, { value: sanitizeForFirestore(valueToStore) }).catch(
          (err) => console.error(`[useLocalStorage] Firestore write error "${key}":`, err)
        );
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
