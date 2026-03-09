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
import { db, doc, setDoc, onSnapshot } from "../../firebase";
import { sanitizeForFirestore } from "../firestore/sanitize";

export function useLocalStorage(key, initialValue) {
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
          } catch (_e) {
            // quota exceeded — ignorar silenciosamente
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
      try {
        const valueToStore =
          value instanceof Function ? value(ref.current) : value;
        ref.current = valueToStore;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        // Só grava no Firestore após o carregamento inicial para não
        // sobrescrever dados remotos com estado desatualizado.
        if (firestoreLoaded.current) {
          const docRef = doc(db, "state", key);
          setDoc(docRef, { value: sanitizeForFirestore(valueToStore) }).catch(
            (err) => console.error("Firestore write error:", key, err)
          );
        }
      } catch (error) {
        console.log(error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
