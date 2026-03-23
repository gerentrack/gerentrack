import { usePagination, PaginaControles } from "../../lib/hooks/usePagination.jsx";
import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { CATEGORIAS, getCategoria } from "../../shared/constants/categorias";
import { _getClubeAtleta, validarCPF } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";

import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const calcularIdade = (dataNasc) => {
  if (!dataNasc) return null;
  const hoje = new Date();
  const nasc = new Date(dataNasc + "T12:00:00");
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
};

// ── Bloco de Consentimento LGPD ──────────────────────────────────────────────
function BlocoLGPD({ aceite, onChange, erro }) {
  const t = useTema();
  const [modalAberto, setModalAberto] = React.useState(false);
  return (
    <>
      {modalAberto && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:2000,
          display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={() => setModalAberto(false)}>
          <div style={{ background:t.bgCard, border:"1px solid #1976D2", borderRadius:14,
            padding:28, maxWidth:560, width:"100%", maxHeight:"80vh", overflowY:"auto" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800,
              color: t.textPrimary, marginBottom:16 }}>📄 Política de Privacidade — GerenTrack</h3>
            <div style={{ fontSize:13, color: t.textTertiary, lineHeight:1.8 }}>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>1. Controlador dos dados</strong><br/>
              O GerenTrack é o responsável pelo tratamento dos seus dados pessoais, nos termos da Lei nº 13.709/2018 (LGPD).</p>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>2. Dados coletados</strong><br/>
              Coletamos: nome completo, e-mail, telefone, CNPJ, cidade, estado e dados de acesso (login). Para atletas: também CPF, data de nascimento e sexo.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>3. Finalidade do tratamento</strong><br/>
              Os dados são usados exclusivamente para: gestão de competições de atletismo, inscrições em provas, emissão de súmulas e resultados, e comunicação relacionada às competições.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>4. Base legal</strong><br/>
              O tratamento é realizado com base no consentimento do titular (Art. 7º, I), na execução de contrato (Art. 7º, V) e no legítimo interesse (Art. 7º, IX) da organização esportiva.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>5. Compartilhamento</strong><br/>
              Seus dados podem ser compartilhados com organizadores de competições nas quais você participa. Não vendemos dados a terceiros.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>6. Retenção</strong><br/>
              Resultados esportivos são mantidos permanentemente por integridade do histórico. Dados pessoais de contas excluídas são anonimizados.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>7. Seus direitos (Art. 18º LGPD)</strong><br/>
              Você tem direito a: confirmar a existência do tratamento, acessar, corrigir, anonimizar, bloquear, eliminar seus dados e revogar o consentimento a qualquer momento nas Configurações da conta.</p>
              <p style={{ marginBottom:10 }}><strong style={{ color: t.textPrimary }}>8. Segurança</strong><br/>
              Utilizamos autenticação via Firebase Auth e armazenamento seguro no Firestore. Dados sensíveis (senhas) nunca são armazenados localmente.</p>
              <p style={{ marginBottom:0 }}><strong style={{ color: t.textPrimary }}>9. Contato</strong><br/>
              Para exercer seus direitos ou tirar dúvidas: <span style={{ color: t.accent }}>gerentrack@gmail.com</span></p>
            </div>
            <button style={{ marginTop:20, background:"#1976D2", color: t.textPrimary, border:"none",
              borderRadius:8, padding:"10px 24px", cursor:"pointer", fontSize:13, fontWeight:700,
              fontFamily:"'Barlow Condensed',sans-serif" }}
              onClick={() => setModalAberto(false)}>✓ Fechar</button>
          </div>
        </div>
      )}
      <div style={{ background:t.bgCardAlt, border:`1px solid ${erro ? t.danger : t.accentBorder}`,
        borderRadius:10, padding:"16px 18px", marginTop:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color: t.accent, letterSpacing:1,
          textTransform:"uppercase", marginBottom:10 }}>🔒 Consentimento LGPD (Lei 13.709/2018)</div>
        <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
          <input type="checkbox" checked={aceite} onChange={e => onChange(e.target.checked)}
            style={{ marginTop:2, width:16, height:16, cursor:"pointer", flexShrink:0 }} />
          <span style={{ fontSize:13, color: t.textSecondary, lineHeight:1.7 }}>
            Li e concordo com a{" "}
            <button type="button" onClick={() => setModalAberto(true)}
              style={{ background:"none", border:"none", color: t.accent, cursor:"pointer",
                fontSize:13, padding:0, textDecoration:"underline" }}>
              Política de Privacidade
            </button>
            {" "}e autorizo o tratamento dos meus dados pessoais pelo GerenTrack para fins de gestão de competições de atletismo, conforme descrito na política.
          </span>
        </label>
        {erro && <div style={{ color: t.danger, fontSize:12, marginTop:8 }}>⚠️ {erro}</div>}
      </div>
    </>
  );
}

// ── Bloco de Consentimento Parental (Art. 14 LGPD) ───────────────────────────
function BlocoConsentimentoParental({ responsavel, onResponsavel, aceite, onChange, erroResponsavel, erroAceite, modoSimplificado }) {
  const t = useTema();
  return (
    <div style={{ background:`${t.success}08`, border:`1px solid ${t.success}44`, borderRadius:10,
      padding:"16px 18px", marginTop:16 }}>
      <div style={{ fontSize:12, fontWeight:700, color: t.success, letterSpacing:1,
        textTransform:"uppercase", marginBottom:4 }}>👨‍👩‍👧 Consentimento Parental (Art. 14 LGPD)</div>
      <p style={{ fontSize:12, color: t.textMuted, marginBottom:12, lineHeight:1.6 }}>
        O atleta é <strong style={{ color: t.textPrimary }}>menor de 18 anos</strong>. Conforme o Art. 14 da LGPD,
        é obrigatório o consentimento de um responsável legal para o tratamento dos dados pessoais de menores.
      </p>

      {modoSimplificado ? (
        // Modo equipe/treinador: declaração de responsabilidade
        <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
          <input type="checkbox" checked={aceite} onChange={e => onChange(e.target.checked)}
            style={{ marginTop:2, width:16, height:16, cursor:"pointer", flexShrink:0 }} />
          <span style={{ fontSize:13, color: t.textSecondary, lineHeight:1.7 }}>
            Declaro que sou o responsável legal por este atleta <strong style={{ color: t.textPrimary }}>ou</strong> que
            possuo autorização expressa do responsável legal para representá-lo nos assuntos relacionados
            a competições de atletismo gerenciados pelo GerenTrack, assumindo total responsabilidade
            por esta declaração, conforme a <strong style={{ color: t.success }}>Lei nº 13.709/2018 (LGPD), Art. 14</strong>.
          </span>
        </label>
      ) : (
        // Modo admin/org: campo de nome do responsável
        <>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color: t.textDimmed, letterSpacing:1,
              marginBottom:5, textTransform:"uppercase" }}>Nome do Responsável Legal *</label>
            <input
              style={{ width:"100%", background:t.bgInput, border:`1px solid ${erroResponsavel ? t.danger : t.borderInput}`,
                borderRadius:8, padding:"10px 14px", color: t.textSecondary, fontSize:14,
                fontFamily:"'Barlow',sans-serif", outline:"none", marginBottom:4 }}
              value={responsavel}
              onChange={e => onResponsavel(e.target.value)}
              placeholder="Nome completo do pai, mãe ou responsável legal"
            />
            {erroResponsavel && <div style={{ color: t.danger, fontSize:12, marginTop:2 }}>⚠️ {erroResponsavel}</div>}
          </div>
          <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
            <input type="checkbox" checked={aceite} onChange={e => onChange(e.target.checked)}
              style={{ marginTop:2, width:16, height:16, cursor:"pointer", flexShrink:0 }} />
            <span style={{ fontSize:13, color: t.textSecondary, lineHeight:1.7 }}>
              Declaro ser responsável legal pelo atleta acima e autorizo, de forma específica e destacada,
              o tratamento dos dados pessoais deste menor pelo GerenTrack para fins de gestão de competições
              de atletismo, conforme a <strong style={{ color: t.success }}>Lei nº 13.709/2018 (LGPD), Art. 14</strong>.
            </span>
          </label>
        </>
      )}

      {erroAceite && <div style={{ color: t.danger, fontSize:12, marginTop:8 }}>⚠️ {erroAceite}</div>}
    </div>
  );
}

function getStyles(t) {
  return {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: t.textPrimary, marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: t.textPrimary, marginBottom: 20, letterSpacing: 1 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  statCard: { background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 12, padding: "18px 24px", textAlign: "center", minWidth: 100 },
  statValue: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: t.accent, lineHeight: 1, marginBottom: 6 },
  statLabel: { fontSize: 13, color: t.textMuted, letterSpacing: 1 },
  btnPrimary: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: t.accent, border: `2px solid ${t.accentBorder}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost: { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  btnIconSm: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textMuted, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: `${t.danger}12`, border: `1px solid ${t.danger}44`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: `1px solid ${t.border}` },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: t.bgHeaderSolid, padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` },
  td: { padding: "12px 16px", fontSize: 14, color: t.textSecondary, borderBottom: `1px solid ${t.border}` },
  tr: { transition: "background 0.15s" },
  trOuro: { background: t.trOuro },
  trPrata: { background: t.trPrata },
  trBronze: { background: t.trBronze },
  marca: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: t.accent },
  emptyState: { textAlign: "center", padding: "60px 20px", color: t.textDisabled, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },
  painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  painelBtns: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { width: "100%", background: t.bgInput, borderWidth: 1, borderStyle: "solid", borderColor: t.borderInput, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  select: { width: "100%", background: t.bgInput, borderWidth: 1, borderStyle: "solid", borderColor: t.borderInput, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  erro: { background: t.bgCardAlt, border: `1px solid ${t.danger}`, color: t.danger, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn: { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", padding: 0 },
  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  badgeGold: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  catBanner: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 14, color: t.textTertiary },
  catPreview: { background: t.bgInput, border: `1px solid ${t.accent}`, borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: t.textTertiary },
  atletaInfo: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12, padding: "10px 14px", background: t.bgInput, borderRadius: 8, fontSize: 13 },
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.accent, marginBottom: 16 },
  formPage: { maxWidth: 640, margin: "60px auto", padding: "0 24px 80px" },
  formCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32, marginBottom: 20 },
  formTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: t.textPrimary, textAlign: "center", marginBottom: 8 },
  formSub: { color: t.textDimmed, textAlign: "center", fontSize: 14, marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },
  fieldError: { color: t.danger, fontSize: 12, marginTop: 2 },
  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: t.textMuted, transition: "all 0.2s" },
  radioLabelActive: { background: t.bgHover, border: `1px solid ${t.accent}`, color: t.accent },
  resumoInscricao: { background: t.bgCard, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: "16px 20px", marginTop: 16 },
  tagProva: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  sumuCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  savedBadge: { background: t.bgCardAlt, border: `1px solid ${t.success}44`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  digitarDica: { color: t.textDimmed, fontSize: 12 },
  inputMarca: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", color: t.accent, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
  infoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: t.accent, marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: `1px solid ${t.border}`, fontSize: 14, color: t.textSecondary, display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: t.accent, fontWeight: 700 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: `linear-gradient(180deg, ${t.bgCardAlt} 0%, transparent 100%)`, borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: t.accent, color: t.textPrimary, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, color: t.textPrimary, lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: t.textDimmed },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: t.textMuted, flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? `${t.danger}18` : status === "hoje_pre" ? `${t.accent}18` : status === "futuro" ? `${t.success}18` : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textDisabled,
    border: `1px solid ${status === "ao_vivo" ? `${t.danger}44` : status === "hoje_pre" ? `${t.accent}44` : status === "futuro" ? `${t.success}44` : t.border}`,
  }),
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: t.textPrimary, fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  statusBarItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  statusDot: (cor) => ({ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }),
  statusDotInline: (cor) => ({ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: cor, background: cor + "22", border: `1px solid ${cor}44`, borderRadius: 10, padding: "2px 8px", whiteSpace: "nowrap" }),
  statusControlsCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusControlsTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: t.accent, letterSpacing: 1, marginBottom: 14 },
  statusControlsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  statusControlBox: (ativo, corAtiva, bgAtiva, disabled) => ({
    background: ativo ? bgAtiva : t.bgInput,
    border: `1px solid ${ativo ? corAtiva + "66" : t.borderInput}`,
    borderRadius: 10, padding: "14px 16px",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s",
  }),
  statusControlLabel: { display: "flex", alignItems: "flex-start", cursor: "pointer", gap: 0 },
  permissividadeBox: { background: t.bgHeaderSolid, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 4 },
  permissividadeHeader: { marginBottom: 10 },
  permissividadeLabel: { display: "flex", alignItems: "center", cursor: "pointer", fontSize: 14, color: t.textSecondary, fontWeight: 600 },
  permissividadeInfo: { background: t.bgHover, borderRadius: 8, padding: "12px 16px", borderLeft: `3px solid ${t.accent}` },
  permissividadeTag: (ativo) => ({ display: "inline-block", background: ativo ? `${t.success}18` : t.bgCard, border: `1px solid ${ativo ? `${t.success}66` : t.border}`, color: ativo ? t.success : t.textDisabled, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600 }),
  permissividadeAlert: { display: "flex", gap: 14, alignItems: "flex-start", background: `${t.success}10`, border: `1px solid ${t.success}66`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 },
  permissividadeAlertIcon: { fontSize: 28, flexShrink: 0, marginTop: 2 },
  permissividadeAlertTitle: { fontWeight: 700, color: t.success, fontSize: 15, marginBottom: 4 },
  permissividadeAlertBody: { color: t.textTertiary, fontSize: 13, lineHeight: 1.6, marginBottom: 6 },
  permissividadeAlertRodape: { fontSize: 12, color: t.textDimmed, fontStyle: "italic" },
  filtroProvasBar: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 20 },
  filtroProvasBloco: { display: "flex", flexDirection: "column", gap: 8 },
  filtroProvasLabel: { fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 },
  filtroProvasPills: { display: "flex", flexWrap: "wrap", gap: 6 },
  filtroPill: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textDimmed, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5, transition: "all 0.15s" },
  filtroPillAtivo: { background: t.bgHover, border: `1px solid ${t.accent}`, color: t.accent },
  filtroClearBtn: { background: "none", border: "none", color: `${t.accent}88`, cursor: "pointer", fontSize: 11, fontFamily: "'Barlow', sans-serif", padding: "0 4px", textDecoration: "underline" },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? t.bgHover : "transparent", color: ativo ? t.accent : t.textDisabled, border: `1px solid ${ativo ? t.accentBorder : t.border}` }),
  stepDivider: { flex: 1, height: 1, background: t.border, margin: "0 8px" },
  modoSwitch: { display: "flex", gap: 0, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: t.textDimmed, padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: t.bgInput, color: t.accent },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: t.bgHover, borderColor: t.accent, color: t.accent },
  grupoProvasBox: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 16, overflow: "hidden" },
  grupoProvasHeader: { background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  provaCheckBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", lineHeight: 1.4, userSelect: "none" },
  provaCheckBtnSel: { background: t.bgHover, borderColor: t.accent, color: t.accent },
};
}

function TelaCadastrarAtleta({ setTela, adicionarAtleta, atualizarAtleta, excluirAtleta, excluirAtletasEmMassa, usuarioLogado, equipes, eventoAtual, atletas, atletasUsuarios, solicitarVinculo, solicitacoesVinculo, organizadores, desvincularAtleta, setAtletaEditandoId }) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const confirmar = useConfirm();
  const _equipeDoUsuario = usuarioLogado?.tipo === "equipe" ? equipes?.find(e => e.id === usuarioLogado.id) : null;
  // equipeId e clube são auto-preenchidos para tipo "equipe" — não requerem input do usuário
  const _autoEquipeId  = usuarioLogado?.tipo === "equipe" ? usuarioLogado.id : "";
  const _autoClube     = _equipeDoUsuario?.nome || "";
  const _autoOrgId     = usuarioLogado?.organizadorId || (usuarioLogado?.tipo === "organizador" ? usuarioLogado.id : "");
  const FORM_VAZIO = { nome: "", dataNasc: "", anoNasc: "", sexo: "M", cpf: "", cbat: "", fone: "", email: "", equipeId: _autoEquipeId, clube: _autoClube, organizadorId: _autoOrgId, equipeAvulsa: false, cadastradoPor: null };
  const [form, setForm]           = useState(FORM_VAZIO);
  const [ok,   setOk]             = useState(false);
  const [erros, setErros]         = useState({});
  const [atletaExistente, setAtletaExistente] = useState(null);
  const [vinculoEnviado,  setVinculoEnviado]  = useState(false);
  // Etapa 4: atleta com conta ativa no MESMO organizador → bloqueio total
  const [atletaDuplicadoOrg, setAtletaDuplicadoOrg] = useState(null);
  const [modo, setModo] = useState("lista"); // lista | novo
  const [filtro, setFiltro] = useState("");
  const [filtroSexoAtl, setFiltroSexoAtl] = useState("todos");
  const [filtroCatAtl, setFiltroCatAtl] = useState("todas");
  const [filtroEquipeAtl, setFiltroEquipeAtl] = useState("todas");
  const [selecionados, setSelecionados] = useState(new Set());
  const [transfAtleta, setTransfAtleta] = useState(null);
  const [transfEquipeId, setTransfEquipeId] = useState("");
  const [lgpdAceite, setLgpdAceite] = useState(false);
  const [consentimentoParentalAceite, setConsentimentoParentalAceite] = useState(false);
  const [responsavelLegal, setResponsavelLegal] = useState("");
  const anoBase = eventoAtual ? new Date(eventoAtual.data).getFullYear() : new Date().getFullYear();

  const isOrg = usuarioLogado?.tipo === "organizador" || usuarioLogado?.tipo === "funcionario";
  const isEquipe = usuarioLogado?.tipo === "equipe";
  const isAdmin = usuarioLogado?.tipo === "admin";
  const voltarTela = isOrg ? "painel-organizador" : isAdmin ? "admin" : (usuarioLogado?.tipo === "equipe" || usuarioLogado?.tipo === "treinador") ? "painel-equipe" : "painel";

  // Atletas visíveis conforme tipo de usuário
  const _orgIds = new Set((organizadores || []).map(o => o.id));
  const meusAtletas = isEquipe
    ? atletas.filter(a => a.equipeId === usuarioLogado?.id)
    : isOrg
      ? atletas.filter(a => {
          const meuOrgId = usuarioLogado?.tipo === "funcionario" ? usuarioLogado?.organizadorId : usuarioLogado?.id;
          return a.organizadorId === meuOrgId || !a.organizadorId || !_orgIds.has(a.organizadorId);
        })
      : atletas;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Equipes visíveis para filtro
  const equipesVisiveis = (isOrg || isAdmin)
    ? [...new Set(meusAtletas.map(a => a.equipeId).filter(Boolean))].map(eid => equipes.find(e => e.id === eid)).filter(Boolean).sort((a,b) => (a.nome||"").localeCompare(b.nome||"","pt-BR"))
    : [];

  const atletasFiltrados = meusAtletas.filter(a => {
    if (filtroSexoAtl !== "todos" && a.sexo !== filtroSexoAtl) return false;
    if (filtroCatAtl !== "todas") {
      const cat = getCategoria(a.anoNasc, anoBase);
      if (cat.id !== filtroCatAtl) return false;
    }
    if (filtroEquipeAtl !== "todas") {
      if (filtroEquipeAtl === "_sem") { if (a.equipeId) return false; }
      else if (a.equipeId !== filtroEquipeAtl) return false;
    }
    if (filtro) {
      const f = filtro.toLowerCase();
      if (!a.nome?.toLowerCase().includes(f) && !a.cpf?.includes(filtro) && !_getClubeAtleta(a, equipes)?.toLowerCase().includes(f)) return false;
    }
    return true;
  });
  const { paginado: atletasPag, infoPage: atletasInfo } = usePagination(atletasFiltrados, 10);

  // ── Handlers do formulário ──
  const handleCpfChange = (v) => {
    const cpfLimpo = v.replace(/\D/g, "");
    setForm(f => ({ ...f, cpf: v }));
    setAtletaExistente(null);
    setAtletaDuplicadoOrg(null);
    setVinculoEnviado(false);
    if (cpfLimpo.length >= 11) {
      const meuOrgId = usuarioLogado?.organizadorId || (usuarioLogado?.tipo === "organizador" ? usuarioLogado?.id : null);

      // ── Etapa 4: verificar duplicata de perfil de atleta no mesmo organizador ──
      // Um atleta-usuário (conta ativa) com mesmo CPF + mesmo org = cadastro duplicado → bloquear
      if (meuOrgId) {
        const dupUsuario = (atletasUsuarios||[]).find(a =>
          a.cpf && a.cpf.replace(/\D/g,"") === cpfLimpo && a.organizadorId === meuOrgId
        );
        if (dupUsuario) {
          setAtletaDuplicadoOrg(dupUsuario);
          return; // Bloqueio total — não continuar verificações
        }
      }

      // ── Verificação normal: atleta base ou usuário no mesmo org ──
      const atletaBase = (atletas||[]).find(a => a.cpf && a.cpf.replace(/\D/g,"") === cpfLimpo);
      const atletaUser = (atletasUsuarios||[]).find(a => a.cpf && a.cpf.replace(/\D/g,"") === cpfLimpo);
      const found = atletaBase || atletaUser;
      if (found) {
        if (meuOrgId) {
          const pertenceMesmoOrg = found.organizadorId === meuOrgId || !found.organizadorId;
          if (pertenceMesmoOrg) setAtletaExistente(atletaBase || atletaUser);
        } else {
          setAtletaExistente(atletaBase || atletaUser);
        }
      }
    }
  };

  const handleDataNasc = (v) => {
    const ano = v ? v.split("-")[0] : "";
    setForm((f) => ({ ...f, dataNasc: v, anoNasc: ano }));
  };

  const handleVincular = () => {
    if (!atletaExistente) return;
    const jaEhMeu = atletaExistente.equipeId === usuarioLogado?.id;
    if (jaEhMeu) return;
    const temEquipeMesmoOrg = !!atletaExistente.equipeId;
    const equipeAtualObj = temEquipeMesmoOrg ? equipes?.find(e => e.id === atletaExistente.equipeId) : null;
    const meuOrgId = usuarioLogado?.organizadorId || (usuarioLogado?.tipo === "organizador" ? usuarioLogado?.id : null);
    solicitarVinculo(
      atletaExistente.id,
      atletaExistente.nome,
      usuarioLogado?.id,
      usuarioLogado?.clube || _autoClube,
      {
        origem: "equipe",
        aprovadorTipo: temEquipeMesmoOrg ? "equipe_atual" : "atleta",
        equipeAtualId: temEquipeMesmoOrg ? atletaExistente.equipeId : null,
        equipeAtualNome: equipeAtualObj?.nome || atletaExistente.clube || null,
        organizadorId: meuOrgId,
        solicitanteId: usuarioLogado?.id,
        solicitanteNome: usuarioLogado?.nome || _autoClube,
      }
    );
    setVinculoEnviado(true);
  };

  const handleVincularDireto = () => {
    if (!atletaExistente || !isEquipe) return;
    const atletaAtualizado = {
      ...atletaExistente,
      equipeId: usuarioLogado.id,
      clube: _autoClube || usuarioLogado?.nome || "",
    };
    atualizarAtleta(atletaAtualizado);
    setVinculoEnviado(true);
  };

  const handleSubmit = () => {
    const e = {};
    if (!form.nome)     e.nome    = "Nome obrigatório";
    if (!form.dataNasc) e.dataNasc = "Data de nascimento obrigatória";
    if (!form.cpf)      e.cpf     = "CPF obrigatório";
    else if (!validarCPF(form.cpf)) e.cpf = "CPF inválido";
    if (usuarioLogado?.tipo === "admin" && !form.organizadorId) e.organizadorId = "Selecione o organizador responsável";

    // Validações LGPD
    const idadeAtleta = calcularIdade(form.dataNasc);
    const ehMenor = idadeAtleta !== null && idadeAtleta < 18;
    const modoSimplificado = isEquipe || usuarioLogado?.tipo === "treinador";
    if (!lgpdAceite) e.lgpd = "É necessário aceitar a Política de Privacidade para continuar.";
    if (ehMenor) {
      if (!modoSimplificado && !responsavelLegal.trim()) e.responsavelLegal = "Informe o nome do responsável legal.";
      if (!consentimentoParentalAceite) e.consentimentoParental = "É necessário confirmar a autorização do responsável legal.";
    }

    if (Object.keys(e).length) { setErros(e); return; }
    const cpfLimpo = form.cpf.replace(/\D/g,"");

    // ── Etapa 4: bloquear duplicata no mesmo organizador ──
    const meuOrgIdFinal = form.organizadorId
      || (usuarioLogado?.tipo === "organizador" ? usuarioLogado.id : null)
      || (usuarioLogado?.tipo === "funcionario" ? usuarioLogado.organizadorId : null);

    const jaExisteMesmoOrg = [...(atletas||[]), ...(atletasUsuarios||[])]
      .find(a => a.cpf && a.cpf.replace(/\D/g,"") === cpfLimpo
        && (meuOrgIdFinal ? a.organizadorId === meuOrgIdFinal : true));
    if (jaExisteMesmoOrg) {
      setErros({ cpf: "CPF já cadastrado para este organizador. Use o botão de vínculo ou acesse pelo perfil existente." });
      return;
    }

    // Verificar duplicata de Nº CBAt
    if (form.cbat && form.cbat.trim()) {
      const cbatLimpo = form.cbat.trim();
      const cbatDup = atletas.find(a => a.cbat && a.cbat.trim() === cbatLimpo);
      if (cbatDup) { setErros({ cbat: `Nº CBAt já cadastrado para ${cbatDup.nome}` }); return; }
    }
    adicionarAtleta({ 
      ...form, 
      id: genId(),
      dataCadastro: new Date().toISOString(),
      organizadorId: meuOrgIdFinal,
      cadastradoPor: usuarioLogado?.tipo || null,
      equipeAvulsa: form.equipeAvulsa,
      lgpdConsentimento: true,
      lgpdConsentimentoData: new Date().toISOString(),
      lgpdVersao: "1.0",
      ...(ehMenor ? {
        consentimentoParental: true,
        consentimentoParentalData: new Date().toISOString(),
        consentimentoParentalPor: modoSimplificado ? "responsavel_equipe" : "responsavel_legal",
        ...(modoSimplificado
          ? { responsavelEquipeId: usuarioLogado?.id, responsavelEquipeNome: usuarioLogado?.nome }
          : { responsavelLegal: responsavelLegal.trim() }
        ),
      } : {}),
    });
    setOk(true);
  };

  const handleCancelar = () => {
    setModo("lista");
    setForm(FORM_VAZIO);
    setErros({});
    setAtletaExistente(null);
    setVinculoEnviado(false);
    setOk(false);
    setLgpdAceite(false);
    setConsentimentoParentalAceite(false);
    setResponsavelLegal("");
  };

  // ── Sucesso ao cadastrar ──
  if (ok) return (
    <div style={s.formPage}>
      <div style={s.formCard}>
        <div style={{ fontSize: 64, textAlign: "center" }}>✅</div>
        <h2 style={{ ...s.formTitle, textAlign: "center" }}>Atleta cadastrado!</h2>
        <div style={s.heroBtns}>
          <button style={s.btnPrimary} onClick={async () => { setOk(false); setForm(FORM_VAZIO); setAtletaExistente(null); setVinculoEnviado(false); }}>Cadastrar outro</button>
          <button style={s.btnSecondary} onClick={() => setTela("inscricao-avulsa")}>Inscrever atleta</button>
          <button style={s.btnGhost} onClick={handleCancelar}>← Voltar à lista</button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // MODO LISTA — semelhante a TelaGerenciarEquipes
  // ══════════════════════════════════════════════════════════════════════════════
  if (modo === "lista") {
    const totalM = meusAtletas.filter(a => a.sexo === "M").length;
    const totalF = meusAtletas.filter(a => a.sexo === "F").length;

    return (
      <div style={s.page}>
        <div style={s.painelHeader}>
          <div>
            <h1 style={s.pageTitle}>🏃 Atletas</h1>
            <p style={{ color: t.textDimmed, fontSize: 14 }}>Gerenciar atletas cadastrados</p>
          </div>
          <button style={s.btnGhost} onClick={() => setTela(voltarTela)}>← Voltar</button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ color: t.textDimmed, fontSize: 12, marginBottom: 4 }}>Total de Atletas</div>
            <div style={{ color: t.accent, fontSize: 32, fontWeight: 700 }}>{meusAtletas.length}</div>
          </div>
          <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ color: t.textDimmed, fontSize: 12, marginBottom: 4 }}>Masculino</div>
            <div style={{ color: t.accent, fontSize: 32, fontWeight: 700 }}>{totalM}</div>
          </div>
          <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ color: t.textDimmed, fontSize: 12, marginBottom: 4 }}>Feminino</div>
            <div style={{ color: "#ff88cc", fontSize: 32, fontWeight: 700 }}>{totalF}</div>
          </div>
        </div>

        {/* Ações */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button style={s.btnPrimary} onClick={() => setModo("novo")}>+ Novo Atleta</button>
          <button style={s.btnSecondary} onClick={() => setTela("importar-atletas")}>📊 Importar Planilha</button>
          <input
            type="text"
            placeholder="🔍 Buscar atleta, CPF ou equipe..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            style={{ ...s.input, flex: 1, minWidth: 200 }}
          />
        </div>

        {/* Filtros de categoria e sexo */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <select value={filtroSexoAtl} onChange={e => setFiltroSexoAtl(e.target.value)}
            style={{ ...s.input, width: "auto", minWidth: 130, padding: "6px 10px", fontSize: 13 }}>
            <option value="todos">Todos os sexos</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
          <select value={filtroCatAtl} onChange={e => setFiltroCatAtl(e.target.value)}
            style={{ ...s.input, width: "auto", minWidth: 160, padding: "6px 10px", fontSize: 13 }}>
            <option value="todas">Todas as categorias</option>
            {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          {equipesVisiveis.length > 0 && (
            <select value={filtroEquipeAtl} onChange={e => setFiltroEquipeAtl(e.target.value)}
              style={{ ...s.input, width: "auto", minWidth: 180, padding: "6px 10px", fontSize: 13 }}>
              <option value="todas">Todas as equipes</option>
              <option value="_sem">Sem equipe</option>
              {equipesVisiveis.map(eq => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}
            </select>
          )}
          {(filtroSexoAtl !== "todos" || filtroCatAtl !== "todas" || filtroEquipeAtl !== "todas" || filtro) && (
            <button style={{ ...s.btnGhost, fontSize: 11, padding: "4px 10px" }}
              onClick={async () => { setFiltroSexoAtl("todos"); setFiltroCatAtl("todas"); setFiltroEquipeAtl("todas"); setFiltro(""); }}>
              ✕ Limpar filtros
            </button>
          )}
          <span style={{ color: t.textDimmed, fontSize: 12, marginLeft: "auto" }}>
            {atletasFiltrados.length} de {meusAtletas.length} atleta{meusAtletas.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Barra de seleção em massa */}
        {(isAdmin || isOrg) && atletasFiltrados.length > 0 && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, padding: "8px 12px",
            background: selecionados.size > 0 ? t.bgCardAlt : t.bgHeaderSolid, border: `1px solid ${selecionados.size > 0 ? t.danger+"44" : t.border}`,
            borderRadius: 8, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: t.textTertiary, fontSize: 13 }}>
              <input type="checkbox"
                checked={selecionados.size > 0 && selecionados.size === atletasFiltrados.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelecionados(new Set(atletasFiltrados.map(a => a.id)));
                  } else {
                    setSelecionados(new Set());
                  }
                }}
                style={{ width: 16, height: 16, accentColor: "#1976D2", cursor: "pointer" }}
              />
              {selecionados.size > 0 ? `${selecionados.size} selecionado(s)` : "Selecionar todos"}
            </label>
            {selecionados.size > 0 && (
              <button
                style={{ ...s.btnGhost, fontSize: 12, padding: "5px 14px", color: t.danger, borderColor: `${t.danger}44` }}
                onClick={async () => { 
                  if (!await confirmar(`⚠️ ATENÇÃO: Excluir ${selecionados.size } atleta(s)?\n\nEsta ação é IRREVERSÍVEL!`)) return;
                  excluirAtletasEmMassa(selecionados);
                  setSelecionados(new Set());
                }}
              >
                🗑️ Excluir {selecionados.size} selecionado(s)
              </button>
            )}
            {selecionados.size > 0 && (
              <button
                style={{ ...s.btnGhost, fontSize: 11, padding: "4px 10px" }}
                onClick={() => setSelecionados(new Set())}
              >
                ✕ Limpar seleção
              </button>
            )}
          </div>
        )}

        {/* Lista */}
        <PaginaControles {...atletasInfo} />
        {atletasFiltrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: t.textDimmed }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏃</div>
            {filtro || filtroSexoAtl !== "todos" || filtroCatAtl !== "todas" ? (
              <>
                <div style={{ fontSize: 18, marginBottom: 8 }}>Nenhum atleta encontrado</div>
                <div style={{ fontSize: 14 }}>Tente outros filtros ou termos de busca</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 18, marginBottom: 8 }}>Nenhum atleta cadastrado</div>
                <div style={{ fontSize: 14, marginBottom: 16 }}>Cadastre o primeiro atleta manualmente ou importe uma planilha</div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button style={s.btnPrimary} onClick={() => setModo("novo")}>+ Novo Atleta</button>
                  <button style={s.btnSecondary} onClick={() => setTela("importar-atletas")}>📊 Importar Planilha</button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ maxHeight: 680, overflowY: "auto", border: `1px solid ${t.border}`, borderRadius: 8, padding: 4 }}>
            <div style={{ display: "grid", gap: 8 }}>
            {atletasPag.map(a => {
              const eq = _getClubeAtleta(a, equipes);
              const catAtl = getCategoria(a.anoNasc, anoBase);
              return (
                <div key={a.id} style={{
                  background: selecionados.has(a.id) ? `${t.accent}18` : t.bgHeaderSolid,
                  border: `1px solid ${selecionados.has(a.id) ? "#1976D2" : t.border}`,
                  borderRadius: 8,
                  padding: "12px 16px", display: "flex", alignItems: "center", gap: 14
                }}
                >
                  {(isAdmin || isOrg) && (
                    <input type="checkbox"
                      checked={selecionados.has(a.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSelecionados(prev => {
                          const next = new Set(prev);
                          if (next.has(a.id)) next.delete(a.id); else next.add(a.id);
                          return next;
                        });
                      }}
                      style={{ width: 16, height: 16, accentColor: "#1976D2", cursor: "pointer", flexShrink: 0 }}
                    />
                  )}
                  <div style={{
                    width: 40, height: 40, background: a.sexo === "M" ? `${t.accent}22` : "#ff88cc22",
                    border: `2px solid ${a.sexo === "M" ? t.accent : "#ff88cc"}`,
                    borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0
                  }}>
                    {a.sexo === "M" ? "M" : "F"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <h3 style={{ color: t.textPrimary, fontSize: 14, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</h3>
                      <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 4, background: `${t.gold}12`, color: t.gold, border: `1px solid ${t.gold}33`, flexShrink: 0 }}>{catAtl.nome}</span>
                      {a.cbat && <span style={{ fontSize: 10, color: t.textMuted, background: t.bgCardAlt, padding: "1px 6px", borderRadius: 3, flexShrink: 0 }}>CBAt {a.cbat}</span>}
                    </div>
                    <div style={{ color: t.textMuted, fontSize: 11 }}>
                      {a.dataNasc ? (() => { const [y,m,d] = a.dataNasc.split("-"); return `📅 ${d}/${m}/${y}`; })() : a.anoNasc ? `📅 ${a.anoNasc}` : ""}
                      {eq ? ` · 🏟️ ${eq}` : ""}
                      {a.cpf ? ` · CPF: ${a.cpf}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { if (setAtletaEditandoId) setAtletaEditandoId(a.id); else window.__atletaEditId = a.id; setTela("editar-atleta"); }}
                      style={{ background: `${t.accent}18`, color: t.accent, border: `1px solid ${t.accent}44`, borderRadius: 6, cursor: "pointer", fontSize: 11, padding: "4px 10px", fontFamily: "'Barlow', sans-serif" }}
                      title="Ver e editar dados do atleta"
                    >
                      👁 Ver/Editar
                    </button>
                    {(isOrg || isAdmin) && a.equipeId && (
                      <button
                        onClick={() => { setTransfAtleta(a); setTransfEquipeId(""); }}
                        style={{ background: `${t.gold}12`, color: t.gold, border: `1px solid ${t.gold}44`, borderRadius: 6, cursor: "pointer", fontSize: 11, padding: "4px 10px", fontFamily: "'Barlow', sans-serif" }}
                        title="Transferir para outra equipe"
                      >
                        🔀 Transferir
                      </button>
                    )}
                    {isEquipe && desvincularAtleta && (
                      <button
                        onClick={async () => { if (await confirmar(`Desvincular ${a.nome} da sua equipe?`)) desvincularAtleta(a.id); }}
                        style={{ ...s.btnGhost, fontSize: 11, padding: "4px 10px", color: t.danger, borderColor: `${t.danger}44` }}
                      >
                        ✂️ Desvincular
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {atletasFiltrados.length > 200 && (
              <div style={{ textAlign: "center", color: t.textDimmed, fontSize: 12, marginTop: 8 }}>
                Mostrando 200 de {atletasFiltrados.length} atletas. Use os filtros para refinar.
              </div>
            )}
            </div>
          </div>
        )}

        {/* ── Modal de Transferência ── */}
        {transfAtleta && (
          <div style={{ position:"fixed", inset:0, background:"#000a", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
            onClick={() => setTransfAtleta(null)}>
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:14, padding:28, width:420, maxWidth:"95vw" }}
              onClick={e => e.stopPropagation()}>
              <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800, color: t.textPrimary, marginBottom:4 }}>
                🔀 Transferir Atleta
              </h3>
              <p style={{ color: t.textMuted, fontSize:13, marginBottom:20 }}>{transfAtleta.nome}</p>
              <div style={{ marginBottom:12 }}>
                <label style={{ color: t.textTertiary, fontSize:12, display:"block", marginBottom:4 }}>Equipe atual</label>
                <div style={{ color: t.textPrimary, fontSize:14, padding:"8px 12px", background:t.bgInput, borderRadius:6, border:`1px solid ${t.borderInput}` }}>
                  {equipes.find(e => e.id === transfAtleta.equipeId)?.nome || <span style={{ color: t.textDimmed }}>Sem equipe</span>}
                </div>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ color: t.textTertiary, fontSize:12, display:"block", marginBottom:4 }}>Nova equipe *</label>
                <select value={transfEquipeId} onChange={e => setTransfEquipeId(e.target.value)}
                  style={{ width:"100%", background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:6, color: t.textPrimary, padding:"8px 12px", fontSize:13 }}>
                  <option value="">Selecione a equipe de destino...</option>
                  {(equipes||[])
                    .filter(e => e.id !== transfAtleta.equipeId && e.organizadorId === _autoOrgId && (e.status === "ativa" || e.status === "aprovado" || !e.status))
                    .sort((a,b) => (a.nome||"").localeCompare(b.nome||"","pt-BR"))
                    .map(e => <option key={e.id} value={e.id}>{e.nome}{e.sigla ? ` (${e.sigla})` : ""}</option>)
                  }
                </select>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button style={{ ...s.btnPrimary }} onClick={async () => {
                  if (!transfEquipeId) { alert("Selecione a equipe de destino."); return; }
                  const novaEquipe = equipes.find(e => e.id === transfEquipeId);
                  await atualizarAtleta({ ...transfAtleta, equipeId: transfEquipeId, clube: novaEquipe?.nome || "" });
                  setTransfAtleta(null);
                  setTransfEquipeId("");
                }}>✅ Confirmar Transferência</button>
                <button style={s.btnGhost} onClick={() => setTransfAtleta(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MODO NOVO (formulário de cadastro)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>➕ Novo Atleta</h1>
          <p style={{ color: t.textDimmed, fontSize: 14 }}>Cadastrar atleta manualmente</p>
        </div>
        <button style={s.btnGhost} onClick={handleCancelar}>← Cancelar</button>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 12, padding: "28px 32px" }}>
        <div style={s.grid2form}>
          <FormField label="Nome Completo *"      value={form.nome}    onChange={(v) => setForm({ ...form, nome: v })}    error={erros.nome} />
          <FormField label="Data de Nascimento *"  value={form.dataNasc} onChange={handleDataNasc} type="date"           error={erros.dataNasc} />
          <div style={{ gridColumn:"1/-1" }}>
            <FormField label="CPF *" value={form.cpf} onChange={handleCpfChange}
              error={erros.cpf} placeholder="000.000.000-00" />

            {/* ── Etapa 4: Duplicata de perfil no mesmo organizador — BLOQUEIO ── */}
            {atletaDuplicadoOrg && (
              <div style={{ background:`${t.danger}10`, border:`2px solid ${t.danger}`,
                borderRadius:8, padding:"14px 16px", marginTop:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:20 }}>🚫</span>
                  <strong style={{ color:t.danger, fontSize:14 }}>Perfil de atleta já existente neste organizador</strong>
                </div>
                <div style={{ fontSize:13, color: t.textSecondary, marginBottom:10, lineHeight:1.6 }}>
                  O CPF informado já possui uma conta de atleta ativa vinculada a este organizador:<br/>
                  <strong style={{ color: t.textPrimary }}>👤 {atletaDuplicadoOrg.nome}</strong>
                  {atletaDuplicadoOrg.email && <span style={{ color: t.textMuted, marginLeft:8 }}>— {atletaDuplicadoOrg.email}</span>}
                </div>
                {/* Se for equipe, oferecer solicitar vínculo */}
                {isEquipe && (() => {
                  const atletaBase = atletas.find(a => a.cpf && a.cpf.replace(/\D/g,"") === atletaDuplicadoOrg.cpf?.replace(/\D/g,""));
                  if (!atletaBase) return null;
                  const jaEhMeu = atletaBase.equipeId === usuarioLogado?.id;
                  const solPendente = (solicitacoesVinculo||[]).find(sol => sol.atletaId === atletaBase.id && sol.status === "pendente");
                  const temEquipe = !!atletaBase.equipeId && !jaEhMeu;
                  if (jaEhMeu) return (
                    <div style={{ background:`${t.success}10`, borderRadius:6, padding:"8px 12px", color:t.success, fontSize:13, marginBottom:10 }}>
                      ✓ Este atleta já está vinculado à sua equipe.
                    </div>
                  );
                  if (solPendente) return (
                    <div style={{ background:`${t.accent}12`, borderRadius:6, padding:"8px 12px", color: t.accent, fontSize:13, marginBottom:10 }}>
                      ⏳ Solicitação de vínculo já enviada — aguardando aprovação.
                    </div>
                  );
                  if (vinculoEnviado) return (
                    <div style={{ background:`${t.success}10`, borderRadius:6, padding:"8px 12px", color:t.success, fontSize:13, marginBottom:10 }}>
                      {temEquipe ? "✓ Solicitação enviada! A equipe atual receberá a notificação." : "✓ Solicitação enviada! O atleta receberá a notificação para aceitar o vínculo."}
                    </div>
                  );
                  return (
                    <div style={{ marginBottom:10 }}>
                      <p style={{ color: t.textTertiary, fontSize:12, margin:"0 0 8px", lineHeight:1.6 }}>
                        {temEquipe
                          ? `Este atleta está vinculado à equipe "${equipes?.find(e => e.id === atletaBase.equipeId)?.nome || atletaBase.clube || "outra equipe"}". A solicitação será enviada a essa equipe.`
                          : "Este atleta não possui equipe vinculada. A solicitação será enviada ao atleta para aceitar ou recusar."}
                      </p>
                      <button onClick={() => {
                        const equipeAtualObj = temEquipe ? equipes?.find(e => e.id === atletaBase.equipeId) : null;
                        const meuOrgId = usuarioLogado?.organizadorId || null;
                        solicitarVinculo(atletaBase.id, atletaBase.nome, usuarioLogado?.id, _autoClube, {
                          origem: "equipe",
                          aprovadorTipo: temEquipe ? "equipe_atual" : "atleta",
                          equipeAtualId: temEquipe ? atletaBase.equipeId : null,
                          equipeAtualNome: equipeAtualObj?.nome || atletaBase.clube || null,
                          organizadorId: meuOrgId,
                          solicitanteId: usuarioLogado?.id,
                          solicitanteNome: usuarioLogado?.nome || _autoClube,
                        });
                        setVinculoEnviado(true);
                      }}
                        style={{ background:`${t.accent}18`, border:`1px solid ${t.accent}66`,
                          color:t.accent, borderRadius:6, padding:"8px 18px",
                          cursor:"pointer", fontSize:13, fontWeight:700,
                          fontFamily:"Inter,sans-serif" }}>
                        🔗 Solicitar Vínculo com este Atleta
                      </button>
                    </div>
                  );
                })()}
                <div style={{ background:`${t.danger}08`, border:`1px solid ${t.danger}44`, borderRadius:6,
                  padding:"10px 14px", fontSize:12, color: t.textTertiary, lineHeight:1.7 }}>
                  ⚠️ <strong style={{ color:t.warning }}>Por que isso acontece?</strong><br/>
                  Uma pessoa não pode ter dois perfis de atleta no mesmo organizador.<br/>
                  Para gerenciar este atleta, utilize o perfil já existente ou solicite vínculo com a equipe através da tela de cadastro do atleta.
                </div>
              </div>
            )}

            {/* ── Atleta já cadastrado com este CPF ── */}
            {atletaExistente && (() => {
              const jaEhMeu     = atletaExistente.equipeId === usuarioLogado?.id;
              const temEquipe = !!atletaExistente.equipeId && !jaEhMeu;
              const solPendente  = (solicitacoesVinculo||[]).find(
                s => s.atletaId === atletaExistente.id && s.status === "pendente");

              return (
                <div style={{ background:`${t.accent}12`, border:"2px solid #1976D2",
                  borderRadius:8, padding:"14px 16px", marginTop:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:20 }}>⚠️</span>
                    <strong style={{ color: t.accent, fontSize:14 }}>Atleta já cadastrado no sistema</strong>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 16px",
                    fontSize:13, color: t.textTertiary, marginBottom:12 }}>
                    <span>👤 <strong style={{ color: t.textPrimary }}>{atletaExistente.nome}</strong></span>
                    <span>📅 {atletaExistente.dataNasc
                      ? (() => { const [y,m,d]=atletaExistente.dataNasc.split("-"); return `${d}/${m}/${y}`; })()
                      : atletaExistente.anoNasc || "—"}</span>
                    <span>🏆 {getCategoria(atletaExistente.anoNasc, anoBase).nome}</span>
                    <span>{atletaExistente.sexo === "M" ? "Masc." : "Fem."}</span>
                    {atletaExistente.equipeId && (() => {
                    const eq = equipes?.find(e => e.id === atletaExistente.equipeId);
                    return eq ? <span style={{ color:t.warning }}>🏛️ Equipe atual: <strong>{eq.nome}</strong></span> : atletaExistente.clube ? <span>🏟️ {atletaExistente.clube}</span> : null;
                  })()}
                  {!atletaExistente.equipeId && atletaExistente.clube && <span>🏟️ {atletaExistente.clube}</span>}
                    {atletaExistente.cbat  && <span>📋 CBAt: {atletaExistente.cbat}</span>}
                  </div>

                  {atletaExistente.desvinculadoEm && !jaEhMeu && (
                    <div style={{ background:`${t.accent}12`, border:"1px solid #1976D244",
                      borderRadius:6, padding:"8px 12px", marginBottom:8, fontSize:12, color: t.textTertiary }}>
                      ℹ️ Atleta foi desvinculado da equipe
                      <strong style={{ color: t.accent }}>{atletaExistente.equipeAnterior ? ` ${atletaExistente.equipeAnterior}` : ""}</strong> em{" "}
                      {new Date(atletaExistente.desvinculadoEm).toLocaleDateString("pt-BR")}.
                      Atualmente sem equipe vinculada.
                    </div>
                  )}

                  {jaEhMeu ? (
                    <div style={{ background:`${t.success}10`, borderRadius:6, padding:"8px 12px",
                      color:t.success, fontSize:13 }}>
                      ✓ Este atleta já está vinculado a você.
                    </div>
                  ) : solPendente ? (
                    <div style={{ background:`${t.accent}12`, borderRadius:6, padding:"8px 12px",
                      color: t.accent, fontSize:13 }}>
                      ⏳ Solicitação de vínculo já enviada — aguardando aprovação.
                    </div>
                  ) : vinculoEnviado ? (
                    <div style={{ background:`${t.success}10`, borderRadius:6, padding:"8px 12px",
                      color:t.success, fontSize:13 }}>
                      {temEquipe
                        ? "✓ Solicitação enviada! A equipe atual receberá a notificação para aprovar a transferência."
                        : "✓ Atleta vinculado com sucesso à sua equipe!"}
                    </div>
                  ) : temEquipe ? (
                    <div>
                      <p style={{ color: t.textTertiary, fontSize:12, margin:"0 0 10px", lineHeight:1.6 }}>
                        {(() => {
                          const eqAtual = equipes?.find(e => e.id === atletaExistente.equipeId);
                          return `Este atleta está vinculado à equipe "${eqAtual?.nome || atletaExistente.clube || "outra equipe"}". A solicitação será enviada a essa equipe para aprovar ou recusar a transferência.`;
                        })()}
                      </p>
                      <button onClick={handleVincular}
                        style={{ background:`${t.accent}18`, border:`1px solid ${t.accent}66`,
                          color:t.accent, borderRadius:6, padding:"8px 18px",
                          cursor:"pointer", fontSize:13, fontWeight:700,
                          fontFamily:"Inter,sans-serif" }}>
                        🔗 Solicitar Transferência para Minha Equipe
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p style={{ color: t.textTertiary, fontSize:12, margin:"0 0 10px", lineHeight:1.6 }}>
                        Este atleta não está vinculado a nenhuma equipe. A solicitação será enviada ao atleta para aceitar ou recusar o vínculo.
                      </p>
                      <button onClick={handleVincular}
                        style={{ background:`${t.accent}18`, border:`1px solid ${t.accent}66`,
                          color:t.accent, borderRadius:6, padding:"8px 18px",
                          cursor:"pointer", fontSize:13, fontWeight:700,
                          fontFamily:"Inter,sans-serif" }}>
                        🔗 Solicitar Vínculo com este Atleta
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          <FormField label="Nº CBAt (opcional)"    value={form.cbat}    onChange={(v) => setForm({ ...form, cbat: v })}   placeholder="Número de registro CBAt" />
          <FormField label="E-mail (opcional)"     value={form.email}   onChange={(v) => setForm({ ...form, email: v })}  type="email" placeholder="email@exemplo.com" />
          <div>
            <label style={s.label}>Sexo *</label>
            <div style={s.radioGroup}>
              {[["M", "Masculino"], ["F", "Feminino"]].map(([v, l]) => (
                <label key={v} style={{ ...s.radioLabel, ...(form.sexo === v ? s.radioLabelActive : {}) }}>
                  <input type="radio" value={v} checked={form.sexo === v} onChange={() => setForm({ ...form, sexo: v })} style={{ display: "none" }} />
                  {l}
                </label>
              ))}
            </div>
          </div>
          <FormField label="Telefone (opcional)"   value={form.fone}    onChange={(v) => setForm({ ...form, fone: v })}   placeholder="(00) 00000-0000" />
          
          {/* Vinculação ao Organizador e Equipe */}
          <div style={{ gridColumn: "1/-1", background: t.bgHeaderSolid, padding: 20, borderRadius: 8, border: `1px solid ${t.border}`, marginTop: 16 }}>
            <h4 style={{ color: t.accent, marginBottom: 16 }}>📍 Vinculação</h4>

            {/* Banner automático para equipe logada */}
            {isEquipe && !atletaExistente && !atletaDuplicadoOrg ? (
              <div style={{ background: t.bgCardAlt, border: `1px solid ${t.success}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: t.success }}>
                ✓ O atleta será automaticamente vinculado à sua equipe: <strong>{_autoClube || usuarioLogado?.nome}</strong>
              </div>
            ) : isEquipe && (atletaExistente || atletaDuplicadoOrg) ? null : (
              <>
                {/* Organizador (apenas para Admin) */}
                {usuarioLogado?.tipo === "admin" && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                      Organizador Responsável *
                    </label>
                    <select
                      value={form.organizadorId}
                      onChange={(e) => setForm({ ...form, organizadorId: e.target.value })}
                      style={s.input}
                    >
                      <option value="">Selecione o organizador...</option>
                      {organizadores?.filter(o => o.status === "aprovado").map(org => (
                        <option key={org.id} value={org.id}>{org.nome} - {org.entidade}</option>
                      ))}
                    </select>
                    <div style={{ color: t.textDimmed, fontSize: 11, marginTop: 4 }}>
                      Este organizador será responsável pelo atleta
                    </div>
                  </div>
                )}

                {/* Clube/Equipe */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                    Clube/Equipe
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <input
                      type="checkbox"
                      id="equipe-avulsa-atleta"
                      checked={form.equipeAvulsa}
                      onChange={(e) => setForm({ ...form, equipeAvulsa: e.target.checked, clube: "" })}
                      style={{ cursor: "pointer" }}
                    />
                    <label htmlFor="equipe-avulsa-atleta" style={{ color: t.textTertiary, fontSize: 13, cursor: "pointer" }}>
                      ✓ Digitar manualmente
                    </label>
                  </div>
                  {form.equipeAvulsa ? (
                    <input
                      type="text"
                      value={form.clube}
                      onChange={(e) => setForm({ ...form, clube: e.target.value, equipeId: "" })}
                      placeholder="Digite o nome da equipe"
                      style={s.input}
                    />
                  ) : (
                    <select
                      value={form.equipeId || ""}
                      onChange={(e) => {
                        const eqSel = equipes?.find(eq => eq.id === e.target.value);
                        setForm({ ...form, equipeId: e.target.value, clube: eqSel?.nome || "" });
                      }}
                      style={s.input}
                    >
                      <option value="">Selecione...</option>
                      {equipes?.filter(eq => {
                        if (eq.status !== "ativa" && eq.status !== "aprovado") return false;
                        if (isAdmin) return true;
                        const _meuOrgId = usuarioLogado?.tipo === "organizador" ? usuarioLogado.id : usuarioLogado?.organizadorId || null;
                        if (!_meuOrgId) return true;
                        const _orgIdsConhecidos = new Set((organizadores || []).map(o => o.id));
                        return eq.organizadorId === _meuOrgId || !eq.organizadorId || !_orgIdsConhecidos.has(eq.organizadorId);
                      }).map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.nome} ({eq.sigla})</option>
                      ))}
                    </select>
                  )}
                  <div style={{ color: t.textDimmed, fontSize: 11, marginTop: 4 }}>
                    {form.equipeAvulsa ? "Digite o nome da equipe manualmente" : "Selecione uma equipe ou marque a caixa acima para digitar"}
                  </div>
                </div>
              </>
            )}
          </div>

          {!usuarioLogado && (
            <div>
              <label style={s.label}>Equipe (opcional)</label>
              <select style={s.select} value={form.equipeId} onChange={(e) => setForm({ ...form, equipeId: e.target.value })}>
                <option value="">Sem equipe</option>
                {equipes.map((t) => <option key={t.id} value={t.id}>{t.nome} — {t.clube}</option>)}
              </select>
            </div>
          )}
        </div>
        {form.anoNasc && !isNaN(form.anoNasc) && (
          <div style={s.catPreview}>
            Categoria detectada: <strong>{getCategoria(form.anoNasc, anoBase).display}</strong>
          </div>
        )}

        {/* ── LGPD: Consentimento Parental (menores) ── */}
        {(() => {
          const idadeAtleta = calcularIdade(form.dataNasc);
          const ehMenor = idadeAtleta !== null && idadeAtleta < 18;
          if (!ehMenor) return null;
          const modoSimplificado = isEquipe || usuarioLogado?.tipo === "treinador";
          return (
            <BlocoConsentimentoParental
              responsavel={responsavelLegal}
              onResponsavel={setResponsavelLegal}
              aceite={consentimentoParentalAceite}
              onChange={setConsentimentoParentalAceite}
              erroResponsavel={erros.responsavelLegal}
              erroAceite={erros.consentimentoParental}
              modoSimplificado={modoSimplificado}
            />
          );
        })()}

        {/* ── LGPD: Consentimento geral ── */}
        <BlocoLGPD aceite={lgpdAceite} onChange={setLgpdAceite} erro={erros.lgpd} />

        <button style={{ ...s.btnPrimary, marginTop: 16 }} onClick={handleSubmit}>✓ Cadastrar Atleta</button>
        <button style={{ ...s.btnGhost, marginTop: 8, width: "100%" }} onClick={handleCancelar}>← Cancelar</button>
      </div>
    </div>
  );
}


export default TelaCadastrarAtleta;
