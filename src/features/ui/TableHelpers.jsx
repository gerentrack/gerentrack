import React from "react";

export function Th({ children, style = {} }) {
  const s = { background: "#0D0E12", padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1E2130", ...style };
  return <th style={s}>{children}</th>;
}

export function Td({ children, style = {} }) {
  const s = { padding: "12px 16px", fontSize: 14, color: "#bbb", borderBottom: "1px solid #12141a", ...style };
  return <td style={s}>{children}</td>;
}
