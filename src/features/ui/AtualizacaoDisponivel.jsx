import { useRegisterSW } from "virtual:pwa-register/react";
import { useTema } from "../../shared/TemaContext";

export default function AtualizacaoDisponivel() {
  const t = useTema();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10000,
      background: t.accent, padding: "12px 20px",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
      boxShadow: "0 -2px 12px rgba(0,0,0,0.3)",
    }}>
      <span style={{ color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'Barlow', sans-serif" }}>
        🔄 Nova versão disponível
      </span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: "#fff", color: t.accent, border: "none", borderRadius: 6,
          padding: "6px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700,
          fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5,
        }}>
        Atualizar
      </button>
    </div>
  );
}
