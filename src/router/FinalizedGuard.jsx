/**
 * FinalizedGuard.jsx
 * Guard que bloqueia telas de edição quando a competição está finalizada.
 * Usado como layout route wrapper dentro de EventoLayout.
 */

import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useEvento } from "../contexts/EventoContext";
import styles from "../shared/styles/appStyles";

export default function FinalizedGuard() {
  const { eventoAtual } = useEvento();
  const navigate = useNavigate();

  if (eventoAtual?.competicaoFinalizada) {
    return (
      <div style={styles.page}><div style={styles.emptyState}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#ff6b6b" }}>BLOQUEADO</span>
        <p style={{ color: "#ff6b6b", fontWeight: 700, fontSize: 18 }}>Competição Finalizada</p>
        <p style={{ color: "#888", fontSize: 13, maxWidth: 400, textAlign: "center", lineHeight: 1.6 }}>
          Os dados desta competição estão bloqueados para edição.<br/>
          Para desbloquear, solicite autorização a um <strong style={{ color: "#1976D2" }}>administrador</strong>.
        </p>
        <button style={styles.btnGhost} onClick={() => navigate(-1)}>← Voltar</button>
      </div></div>
    );
  }

  return <Outlet />;
}
