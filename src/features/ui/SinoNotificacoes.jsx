/**
 * SinoNotificacoes.jsx
 * Componente reutilizável de sino 🔔 com dropdown de notificações.
 * Usado nos painéis de equipe, organizador e atleta.
 */
import React, { useState, useRef, useEffect } from "react";
import { useTema } from "../../shared/TemaContext";

const ICONES = {
  aprovacao_equipe:   "✅",
  portabilidade:      "📦",
  vinculo_solicitado: "🔗",
  sumulas_liberadas:  "📋",
  desvinculacao:      "🔔",
  medals_ready:       "🏅",
  relatorio_solicitado: "📄",
  relatorio_gerado:    "📄",
  relatorio_cancelado: "❌",
  relatorio_excluido:  "🗑️",
  info:               "ℹ️",
};

function getCores(t) {
  return {
    aprovacao_equipe:     { txt: t.success },
    portabilidade:        { txt: t.accent },
    vinculo_solicitado:   { txt: t.accent },
    sumulas_liberadas:    { txt: t.success },
    desvinculacao:        { txt: t.danger },
    medals_ready:         { txt: t.gold },
    relatorio_solicitado: { txt: t.accent },
    relatorio_gerado:     { txt: t.success },
    relatorio_cancelado:  { txt: t.warning },
    relatorio_excluido:   { txt: t.danger },
    info:                 { txt: t.textMuted },
  };
}

export function SinoNotificacoes({ notificacoes = [], usuarioId, marcarNotifLida }) {
  const t = useTema();
  const CORES = getCores(t);
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
          position: "relative", background: aberto ? t.bgInput : "transparent",
          border: `1px solid ${aberto ? t.accent : t.borderInput}`,
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
            background: t.danger, color: "#fff",
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
          background: t.bgCard, border: `1px solid ${t.border}`,
          borderRadius: 12, boxShadow: t.shadowLg,
          zIndex: 1000,
        }}>
          {/* Header do dropdown */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderBottom: `1px solid ${t.border}`,
          }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
              fontSize: 14, color: t.textPrimary, letterSpacing: 1 }}>
              🔔 NOTIFICAÇÕES
              {naoLidas.length > 0 && (
                <span style={{ marginLeft: 8, background: t.danger, color: "#fff",
                  fontSize: 10, fontWeight: 800, borderRadius: 10, padding: "1px 6px" }}>
                  {naoLidas.length} nova{naoLidas.length !== 1 ? "s" : ""}
                </span>
              )}
            </span>
            {naoLidas.length > 0 && (
              <button onClick={marcarTodas}
                style={{ background: "none", border: "none", color: t.accent,
                  cursor: "pointer", fontSize: 11, fontFamily: "'Barlow', sans-serif" }}>
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista de notificações */}
          {minhas.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: t.textDisabled, fontSize: 13 }}>
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
                    borderBottom: `1px solid ${t.border}`,
                    background: n.lida ? "transparent" : t.bgCardAlt,
                    opacity: n.lida ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}>
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{ico}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: n.lida ? t.textDisabled : t.textSecondary,
                        lineHeight: 1.5, marginBottom: 4 }}>
                        {n.msg}
                      </div>
                      <div style={{ fontSize: 11, color: t.textDisabled }}>
                        {new Date(n.data).toLocaleString("pt-BR", {
                          day: "2-digit", month: "2-digit", year: "2-digit",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </div>
                    </div>
                    {!n.lida && (
                      <button onClick={() => marcarNotifLida(n.id)}
                        style={{ background: "none", border: "none", color: t.textDisabled,
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
