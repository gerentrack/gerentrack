/**
 * SinoNotificacoes.jsx
 * Componente reutilizável de sino 🔔 com dropdown de notificações.
 * Usado nos painéis de equipe, organizador e atleta.
 */
import React, { useState, useRef, useEffect } from "react";

const ICONES = {
  aprovacao_equipe:   "✅",
  portabilidade:      "📦",
  vinculo_solicitado: "🔗",
  sumulas_liberadas:  "📋",
  desvinculacao:      "🔔",
  medals_ready:       "🏅",
  info:               "ℹ️",
};

const CORES = {
  aprovacao_equipe:   { bg: "#0a1a0a", border: "#2a6a2a", txt: "#7acc44" },
  portabilidade:      { bg: "#0a0f1a", border: "#1a3a6a", txt: "#88aaff" },
  vinculo_solicitado: { bg: "#0a1020", border: "#1a4a7a", txt: "#1976D2" },
  sumulas_liberadas:  { bg: "#0a1a10", border: "#2a5a3a", txt: "#4acc84" },
  desvinculacao:      { bg: "#1a0a0a", border: "#5a1a1a", txt: "#ff6b6b" },
  medals_ready:       { bg: "#1a1500", border: "#5a4a00", txt: "#FFD700" },
  info:               { bg: "#0a0f1a", border: "#2a3a5a", txt: "#aaa" },
};

export function SinoNotificacoes({ notificacoes = [], usuarioId, marcarNotifLida }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  const minhas = notificacoes.filter(n => n.para === usuarioId);
  const naoLidas = minhas.filter(n => !n.lida);

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const marcarTodas = () => {
    naoLidas.forEach(n => marcarNotifLida(n.id));
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Botão sino */}
      <button
        onClick={() => setAberto(a => !a)}
        style={{
          position: "relative", background: aberto ? "#141720" : "transparent",
          border: `1px solid ${aberto ? "#1976D2" : "#252837"}`,
          borderRadius: 8, padding: "7px 10px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          transition: "all 0.15s",
        }}
        title="Notificações"
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>🔔</span>
        {naoLidas.length > 0 && (
          <span style={{
            position: "absolute", top: 3, right: 3,
            background: "#ff4444", color: "#fff",
            fontSize: 10, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif",
            borderRadius: 10, minWidth: 16, height: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px", lineHeight: 1,
          }}>
            {naoLidas.length > 9 ? "9+" : naoLidas.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {aberto && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 340, maxHeight: 420, overflowY: "auto",
          background: "#0E1016", border: "1px solid #1E2130",
          borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          zIndex: 1000,
        }}>
          {/* Header do dropdown */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderBottom: "1px solid #1E2130",
          }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
              fontSize: 14, color: "#fff", letterSpacing: 1 }}>
              🔔 NOTIFICAÇÕES
              {naoLidas.length > 0 && (
                <span style={{ marginLeft: 8, background: "#ff4444", color: "#fff",
                  fontSize: 10, fontWeight: 800, borderRadius: 10, padding: "1px 6px" }}>
                  {naoLidas.length} nova{naoLidas.length !== 1 ? "s" : ""}
                </span>
              )}
            </span>
            {naoLidas.length > 0 && (
              <button onClick={marcarTodas}
                style={{ background: "none", border: "none", color: "#1976D2",
                  cursor: "pointer", fontSize: 11, fontFamily: "'Barlow', sans-serif" }}>
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista de notificações */}
          {minhas.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "#444", fontSize: 13 }}>
              Nenhuma notificação ainda.
            </div>
          ) : (
            <div>
              {minhas.slice(0, 20).map(n => {
                const cor = CORES[n.tipo] || CORES.info;
                const ico = ICONES[n.tipo] || "ℹ️";
                return (
                  <div key={n.id} style={{
                    display: "flex", gap: 10, padding: "12px 16px",
                    borderBottom: "1px solid #111318",
                    background: n.lida ? "transparent" : cor.bg,
                    opacity: n.lida ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}>
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{ico}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: n.lida ? "#666" : "#ddd",
                        lineHeight: 1.5, marginBottom: 4 }}>
                        {n.msg}
                      </div>
                      <div style={{ fontSize: 11, color: "#444" }}>
                        {new Date(n.data).toLocaleString("pt-BR", {
                          day: "2-digit", month: "2-digit", year: "2-digit",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </div>
                    </div>
                    {!n.lida && (
                      <button onClick={() => marcarNotifLida(n.id)}
                        style={{ background: "none", border: "none", color: "#444",
                          cursor: "pointer", fontSize: 14, padding: "0 2px",
                          flexShrink: 0, alignSelf: "flex-start" }}
                        title="Marcar como lida">
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
