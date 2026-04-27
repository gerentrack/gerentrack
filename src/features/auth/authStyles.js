import { temaDark } from "../../shared/tema";

function criarAuthStyles(t) {
  return {
    page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
    pageTitle: { fontFamily: t.fontTitle, fontSize: 36, fontWeight: 800, color: t.textPrimary, marginBottom: 24, letterSpacing: 1 },
    painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
    btnPrimary: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: t.fontTitle, letterSpacing: 1, transition: "all 0.2s", width: "100%" },
    btnGhost: { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: t.fontBody },
    formPage: { maxWidth: 640, margin: "60px auto", padding: "0 24px 80px" },
    formCard: { background: t.bgCard, border: `1px solid ${t.border}`, boxShadow: t.shadow, borderRadius: 16, padding: 32, marginBottom: 20 },
    formIcon: { fontSize: 48, textAlign: "center", marginBottom: 16 },
    formTitle: { fontFamily: t.fontTitle, fontSize: 32, fontWeight: 800, color: t.textPrimary, textAlign: "center", marginBottom: 8 },
    formSub: { color: t.textMuted, textAlign: "center", fontSize: 14, marginBottom: 24 },
    label: { display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
    erro: { background: `${t.danger}15`, border: `1px solid ${t.danger}`, color: t.danger, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
    linkBtn: { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: t.fontBody, padding: 0 },
  };
}

const authStyles = criarAuthStyles(temaDark);
export default authStyles;
export { criarAuthStyles };
