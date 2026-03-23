import { criarEventoStyles } from "../eventos/eventoStyles";
import { criarAuthStyles } from "../auth/authStyles";
import { temaDark } from "../../shared/tema";

function criarInscricaoStyles(t) {
  return {
    ...criarEventoStyles(t),
    ...criarAuthStyles(t),
    radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
    radioLabel: { flex: 1, background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: t.textMuted, transition: "all 0.2s" },
    radioLabelActive: { background: t.bgHover, border: `1px solid ${t.accent}`, color: t.accent },
    catPreview: { background: t.bgInput, border: `1px solid ${t.accent}`, borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: t.textTertiary },
    atletaInfo: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12, padding: "10px 14px", background: t.bgInput, borderRadius: 8, fontSize: 13 },
    badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
    badgeGold: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
    modoSwitch: { display: "flex", gap: 0, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
    modoBtn: { background: "transparent", border: "none", color: t.textDimmed, padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
    modoBtnActive: { background: t.bgInput, color: t.accent },
    resumoInscricao: { background: t.bgCard, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: "16px 20px", marginTop: 16 },
    tagProva: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
    catBanner: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 14, color: t.textTertiary },
    permissividadeAlert: { display: "flex", gap: 14, alignItems: "flex-start", background: t.bgCardAlt, border: `1px solid ${t.success}66`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 },
    permissividadeAlertIcon: { fontSize: 28, flexShrink: 0, marginTop: 2 },
    permissividadeAlertTitle: { fontWeight: 700, color: t.success, fontSize: 15, marginBottom: 4 },
    permissividadeAlertBody: { color: t.textTertiary, fontSize: 13, lineHeight: 1.6, marginBottom: 6 },
    permissividadeAlertRodape: { fontSize: 12, color: t.textDimmed, fontStyle: "italic" },
    badgeOficial: { background: t.bgCardAlt, color: t.textMuted, border: `1px solid ${t.border}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
    badgeNorma: { background: t.bgCardAlt, color: t.success, border: `1px solid ${t.success}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, cursor: "help" },
  };
}

const inscricaoStyles = criarInscricaoStyles(temaDark);
export default inscricaoStyles;
export { criarInscricaoStyles };
