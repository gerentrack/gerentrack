import React from "react";
import { useTema } from "../../shared/TemaContext";

export function Th({ children, style = {} }) {
  const t = useTema();
  const s = { background: t.bgHeaderSolid, padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}`, ...style };
  return <th style={s}>{children}</th>;
}

export function Td({ children, style = {} }) {
  const t = useTema();
  const s = { padding: "12px 16px", fontSize: 14, color: t.textSecondary, borderBottom: `1px solid ${t.border}`, ...style };
  return <td style={s}>{children}</td>;
}
