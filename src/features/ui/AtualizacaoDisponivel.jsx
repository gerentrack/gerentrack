import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useTema } from "../../shared/TemaContext";

export default function AtualizacaoDisponivel() {
  const t = useTema();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const disparou = useRef(false);

  // Auto-reload 3s após detectar nova versão
  useEffect(() => {
    if (!needRefresh || disparou.current) return;
    disparou.current = true;
    const timer = setTimeout(() => updateServiceWorker(true), 3000);
    return () => clearTimeout(timer);
  }, [needRefresh, updateServiceWorker]);

  if (!needRefresh) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10000,
      background: t.accent, padding: "12px 20px",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
      boxShadow: "0 -2px 12px rgba(0,0,0,0.3)",
    }}>
      <span style={{ color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'Barlow', sans-serif" }}>
        Atualizando para nova versão...
      </span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: "#fff", color: t.accent, border: "none", borderRadius: 6,
          padding: "6px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700,
          fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5,
        }}>
        Atualizar agora
      </button>
    </div>
  );
}
