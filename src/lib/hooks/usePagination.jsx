/**
 * usePagination.js
 * Hook reutilizável de paginação.
 *
 * Uso:
 *   const { pagina, setPagina, totalPaginas, paginado, infoPage } = usePagination(lista, 10);
 *   <PaginaControles {...infoPage} />
 */

import { useState, useMemo } from "react";
import React from "react";
import { useTema } from "../../shared/TemaContext";

export function usePagination(lista = [], itensPorPagina = 10) {
  const [pagina, setPaginaRaw] = useState(1);

  const totalPaginas = Math.max(1, Math.ceil(lista.length / itensPorPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);

  // Reset para página 1 quando a lista muda de tamanho (ex: filtro aplicado)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => { setPaginaRaw(1); }, [lista.length]);

  const paginado = useMemo(() => {
    const ini = (paginaAtual - 1) * itensPorPagina;
    return lista.slice(ini, ini + itensPorPagina);
  }, [lista, paginaAtual, itensPorPagina]);

  const setPagina = (n) => setPaginaRaw(Math.max(1, Math.min(n, totalPaginas)));

  const infoPage = {
    pagina: paginaAtual,
    totalPaginas,
    total: lista.length,
    itensPorPagina,
    setPagina,
  };

  return { pagina: paginaAtual, setPagina, totalPaginas, paginado, infoPage };
}

// ── Componente separado (não dentro do hook) ──────────────────────────────────
export function PaginaControles({ pagina, totalPaginas, total, itensPorPagina, setPagina, style }) {
  const t = useTema();
  if (!total || total <= itensPorPagina) return null;
  const ini = (pagina - 1) * itensPorPagina + 1;
  const fim = Math.min(pagina * itensPorPagina, total);
  const btnStyle = (dis) => ({
    background: dis ? t.bgHeaderSolid : t.bgInput,
    border:`1px solid ${t.borderInput}`, color: dis ? t.textDisabled : t.textTertiary,
    borderRadius:6, padding:"6px 12px", cursor: dis ? "default" : "pointer",
    fontSize:13, fontFamily:"'Barlow', sans-serif",
  });
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"12px 16px", borderTop:`1px solid ${t.border}`, background:t.bgHeaderSolid,
      flexWrap:"wrap", gap:8, ...style }}>
      <span style={{ fontSize:13, color:t.textDimmed }}>
        {ini}–{fim} de <strong style={{ color:t.textTertiary }}>{total}</strong>
      </span>
      <div style={{ display:"flex", gap:6 }}>
        <button onClick={() => setPagina(1)} disabled={pagina===1} style={btnStyle(pagina===1)}>«</button>
        <button onClick={() => setPagina(pagina-1)} disabled={pagina===1} style={btnStyle(pagina===1)}>‹ Anterior</button>
        <span style={{ padding:"6px 12px", fontSize:13, color:t.accent, fontWeight:700,
          background:t.bgHover, borderRadius:6, border:`1px solid ${t.accentBorder}` }}>
          {pagina} / {totalPaginas}
        </span>
        <button onClick={() => setPagina(pagina+1)} disabled={pagina===totalPaginas} style={btnStyle(pagina===totalPaginas)}>Próximo ›</button>
        <button onClick={() => setPagina(totalPaginas)} disabled={pagina===totalPaginas} style={btnStyle(pagina===totalPaginas)}>»</button>
      </div>
    </div>
  );
}
