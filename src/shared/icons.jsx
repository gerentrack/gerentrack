/**
 * icons.jsx
 * Ícones SVG inline compartilhados — feather-style.
 * Substituem emojis para interface formal e profissional.
 *
 * Uso: import { IcoCalendar, IcoPin } from "../../shared/icons";
 *      {IcoCalendar(14)}  ou  {IcoPin()}
 */
import React from "react";

const svgI = (d, size = 12) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ verticalAlign: "middle", marginRight: 3 }}>{d}</svg>
);

// ── Tempo / Data ──────────────────────────────────────────────────────────
export const IcoCalendar = (s = 12) => svgI(<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>, s);
export const IcoClock = (s = 12) => svgI(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, s);

// ── Localização ───────────────────────────────────────────────────────────
export const IcoPin = (s = 12) => svgI(<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>, s);

// ── Pessoas / Usuários ────────────────────────────────────────────────────
export const IcoUsers = (s = 12) => svgI(<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>, s);
export const IcoSignup = (s = 12) => svgI(<><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></>, s);

// ── Ações ─────────────────────────────────────────────────────────────────
export const IcoEdit = (s = 12) => svgI(<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>, s);
export const IcoPen = (s = 12) => svgI(<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></>, s);
export const IcoTrash = (s = 12) => svgI(<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>, s);
export const IcoRefresh = (s = 12) => svgI(<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>, s);
export const IcoPrinter = (s = 12) => svgI(<><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>, s);

// ── Segurança ─────────────────────────────────────────────────────────────
export const IcoLock = (s = 12) => svgI(<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>, s);
export const IcoUnlock = (s = 12) => svgI(<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/></>, s);
export const IcoShield = (s = 12) => svgI(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>, s);

// ── Conteúdo / Documentos ─────────────────────────────────────────────────
export const IcoList = (s = 12) => svgI(<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>, s);
export const IcoClipboard = (s = 12) => svgI(<><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></>, s);
export const IcoFile = (s = 12) => svgI(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>, s);
export const IcoHash = (s = 12) => svgI(<><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></>, s);

// ── Esporte / Competição ──────────────────────────────────────────────────
export const IcoTarget = (s = 12) => svgI(<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>, s);
export const IcoTrophy = (s = 12) => svgI(<><rect x="4" y="14" width="4" height="8" rx="1"/><rect x="10" y="6" width="4" height="16" rx="1"/><rect x="16" y="10" width="4" height="12" rx="1"/></>, s);
export const IcoMedal = (s = 12) => svgI(<><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>, s);
export const IcoRun = (s = 12) => svgI(<><path d="M13 4v3m0 0l3 3m-3-3l-3 3"/><circle cx="13" cy="3" r="1"/><path d="M7 21l3-7 4 2 3-8"/></>, s);
export const IcoFlag = (s = 12) => svgI(<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>, s);

// ── Sistema / UI ──────────────────────────────────────────────────────────
export const IcoSettings = (s = 12) => svgI(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>, s);
export const IcoWifi = (s = 12) => svgI(<><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>, s);
export const IcoInfo = (s = 12) => svgI(<><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/><circle cx="12" cy="12" r="10"/></>, s);
