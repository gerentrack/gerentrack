/**
 * useOfflineStatus.js
 * Hook centralizado de status offline para toda a aplicação.
 *
 * Expõe:
 *   - online        : boolean (navigator.onLine em tempo real)
 *   - pendentes     : number  (ações na fila mc_pendentes)
 *   - acabouDeReconectar : boolean (true por 5s após offline→online, trigger do relatório)
 *   - pendentesAntesSync : number (quantas pendências havia antes de reconectar)
 */

import { useEffect, useState, useRef, useCallback } from "react";

const LS_PENDENTES = "mc_pendentes";

function lerPendentes() {
  try {
    const v = localStorage.getItem(LS_PENDENTES);
    return v ? JSON.parse(v).length : 0;
  } catch {
    return 0;
  }
}

export function useOfflineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pendentes, setPendentes] = useState(lerPendentes);
  const [acabouDeReconectar, setAcabouDeReconectar] = useState(false);
  const [pendentesAntesSync, setPendentesAntesSync] = useState(0);
  const estavOfflineRef = useRef(!navigator.onLine);
  const timerRef = useRef(null);

  // ── Online/Offline events ──────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      if (estavOfflineRef.current) {
        const count = lerPendentes();
        setPendentesAntesSync(count);
        if (count > 0) {
          setAcabouDeReconectar(true);
          timerRef.current = setTimeout(() => setAcabouDeReconectar(false), 8000);
        }
      }
      estavOfflineRef.current = false;
    };
    const handleOffline = () => {
      setOnline(false);
      estavOfflineRef.current = true;
      setAcabouDeReconectar(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ── Polling de pendentes (a cada 2s quando offline, 5s quando online) ──────
  useEffect(() => {
    const interval = setInterval(() => {
      setPendentes(lerPendentes());
    }, online ? 5000 : 2000);
    return () => clearInterval(interval);
  }, [online]);

  const fecharRelatorio = useCallback(() => {
    setAcabouDeReconectar(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { online, pendentes, acabouDeReconectar, pendentesAntesSync, fecharRelatorio };
}
