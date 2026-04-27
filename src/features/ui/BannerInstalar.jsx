import React from "react";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import { useTema } from "../../shared/TemaContext";

export default function BannerInstalar() {
  const t = useTema();
  const { canInstall, showIOSGuide, promptInstall, dismissInstall } = useInstallPrompt();

  if (!canInstall && !showIOSGuide) return null;

  return (
    <div style={{
      background: t.bgCard, border: `1px solid ${t.accentBorder}`,
      borderRadius: 12, padding: "14px 18px", margin: "0 12px 12px",
      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      boxShadow: t.shadow,
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary, fontFamily: t.fontTitle, letterSpacing: 0.5 }}>
          Instalar GERENTRACK
        </div>
        <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2, lineHeight: 1.4 }}>
          {showIOSGuide
            ? <>Toque em <strong style={{ color: t.textSecondary }}>Compartilhar</strong> (ícone ↑) e depois <strong style={{ color: t.textSecondary }}>"Adicionar à Tela de Início"</strong>.</>
            : "Acesse mais rápido direto da tela inicial do seu celular."
          }
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {canInstall && (
          <button onClick={promptInstall}
            style={{ background: t.accent, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: t.fontTitle }}>
            Instalar
          </button>
        )}
        <button onClick={dismissInstall}
          style={{ background: "transparent", color: t.textDimmed, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontSize: 12 }}>
          Depois
        </button>
      </div>
    </div>
  );
}
