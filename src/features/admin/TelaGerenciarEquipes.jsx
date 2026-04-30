import React, { useState, useMemo, useEffect } from "react";
import { usePagination, PaginaControles } from "../../lib/hooks/usePagination.jsx";
import { validarCNPJ, formatarCNPJ } from "../../shared/formatters/utils";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";
import { secondaryAuth, createUserWithEmailAndPassword, signOut as firebaseSignOut, functions, httpsCallable } from "../../firebase";

const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

function getStyles(t) {
  return {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: t.fontTitle, fontSize: 36, fontWeight: 800, color: t.textPrimary, marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: t.fontTitle, fontSize: 26, fontWeight: 800, color: t.textPrimary, marginBottom: 20, letterSpacing: 1 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  statCard: { background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 12, padding: "18px 24px", textAlign: "center", minWidth: 100 },
  statValue: { fontFamily: t.fontTitle, fontSize: 36, fontWeight: 900, color: t.accent, lineHeight: 1, marginBottom: 6 },
  statLabel: { fontSize: 13, color: t.textMuted, letterSpacing: 1 },
  btnPrimary: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: t.fontTitle, letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: t.accent, border: `2px solid ${t.accent}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: t.fontTitle, letterSpacing: 1 },
  btnGhost: { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: t.fontBody },
  btnIconSm: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textMuted, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: `${t.danger}11`, border: `1px solid ${t.danger}33`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: `1px solid ${t.border}` },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: t.bgHeaderSolid, padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` },
  td: { padding: "12px 16px", fontSize: 14, color: t.textSecondary, borderBottom: `1px solid ${t.border}` },
  tr: { transition: "background 0.15s" },
  trOuro: { background: t.trOuro },
  trPrata: { background: t.trPrata },
  trBronze: { background: t.trBronze },
  marca: { fontFamily: t.fontTitle, fontSize: 20, fontWeight: 800, color: t.accent },
  emptyState: { textAlign: "center", padding: "60px 20px", color: t.textDisabled, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },
  painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  painelBtns: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { width: "100%", background: t.bgInput, borderWidth: 1, borderStyle: "solid", borderColor: t.borderInput, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: t.fontBody, outline: "none", marginBottom: 4 },
  select: { width: "100%", background: t.bgInput, borderWidth: 1, borderStyle: "solid", borderColor: t.borderInput, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: t.fontBody, outline: "none", marginBottom: 4 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  erro: { background: `${t.danger}15`, border: `1px solid ${t.danger}`, color: t.danger, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn: { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: t.fontBody, padding: 0 },
  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  badgeGold: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  catBanner: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 14, color: t.textTertiary },
  catPreview: { background: t.bgInput, border: `1px solid ${t.accent}`, borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: t.textTertiary },
  atletaInfo: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12, padding: "10px 14px", background: t.bgInput, borderRadius: 8, fontSize: 13 },
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: t.fontTitle, fontSize: 22, fontWeight: 800, color: t.accent, marginBottom: 16 },
  formPage: { maxWidth: 640, margin: "60px auto", padding: "0 24px 80px" },
  formCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32, marginBottom: 20 },
  formTitle: { fontFamily: t.fontTitle, fontSize: 32, fontWeight: 800, color: t.textPrimary, textAlign: "center", marginBottom: 8 },
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
  sumuProva: { fontFamily: t.fontTitle, fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  savedBadge: { background: `${t.success}15`, border: `1px solid ${t.success}66`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  digitarDica: { color: t.textDimmed, fontSize: 12 },
  inputMarca: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", color: t.accent, fontSize: 16, fontFamily: t.fontTitle, fontWeight: 700, width: 120, outline: "none" },
  infoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: t.fontTitle, fontSize: 20, fontWeight: 700, color: t.accent, marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: `1px solid ${t.border}`, fontSize: 14, color: t.textSecondary, display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: t.accent, fontWeight: 700 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: "linear-gradient(180deg, #0D1018 0%, transparent 100%)", borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: t.accent, color: t.textPrimary, fontFamily: t.fontTitle, fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: t.fontTitle, fontSize: 56, fontWeight: 900, color: t.textPrimary, lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: t.fontTitle, fontSize: 22, fontWeight: 800, color: t.textPrimary, lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: t.textDimmed },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: t.textMuted, flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? `${t.danger}22` : status === "hoje_pre" ? `${t.accent}15` : status === "futuro" ? `${t.success}15` : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textDisabled,
    border: `1px solid ${status === "ao_vivo" ? `${t.danger}44` : status === "hoje_pre" ? `${t.accent}33` : status === "futuro" ? `${t.success}44` : t.border}`,
  }),
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: t.textPrimary, fontFamily: t.fontBody, fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  statusBarItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  statusDot: (cor) => ({ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }),
  statusDotInline: (cor) => ({ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: cor, background: cor + "22", border: `1px solid ${cor}44`, borderRadius: 10, padding: "2px 8px", whiteSpace: "nowrap" }),
  statusControlsCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusControlsTitle: { fontFamily: t.fontTitle, fontSize: 16, fontWeight: 700, color: t.accent, letterSpacing: 1, marginBottom: 14 },
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
  permissividadeTag: (ativo) => ({ display: "inline-block", background: ativo ? `${t.success}15` : t.bgCard, border: `1px solid ${ativo ? `${t.success}55` : t.border}`, color: ativo ? t.success : t.textDisabled, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600 }),
  permissividadeAlert: { display: "flex", gap: 14, alignItems: "flex-start", background: `${t.success}08`, border: `1px solid ${t.success}55`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 },
  permissividadeAlertIcon: { fontSize: 28, flexShrink: 0, marginTop: 2 },
  permissividadeAlertTitle: { fontWeight: 700, color: t.success, fontSize: 15, marginBottom: 4 },
  permissividadeAlertBody: { color: t.textTertiary, fontSize: 13, lineHeight: 1.6, marginBottom: 6 },
  permissividadeAlertRodape: { fontSize: 12, color: t.textDimmed, fontStyle: "italic" },
  filtroProvasBar: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 20 },
  filtroProvasBloco: { display: "flex", flexDirection: "column", gap: 8 },
  filtroProvasLabel: { fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 },
  filtroProvasPills: { display: "flex", flexWrap: "wrap", gap: 6 },
  filtroPill: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textDimmed, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: t.fontTitle, letterSpacing: 0.5, transition: "all 0.15s" },
  filtroPillAtivo: { background: t.bgHover, border: `1px solid ${t.accent}`, color: t.accent },
  filtroClearBtn: { background: "none", border: "none", color: `${t.accent}88`, cursor: "pointer", fontSize: 11, fontFamily: t.fontBody, padding: "0 4px", textDecoration: "underline" },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: t.fontTitle, letterSpacing: 1, background: ativo ? t.bgHover : "transparent", color: ativo ? t.accent : t.textDisabled, border: `1px solid ${ativo ? `${t.accent}44` : t.border}` }),
  stepDivider: { flex: 1, height: 1, background: t.border, margin: "0 8px" },
  modoSwitch: { display: "flex", gap: 0, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: t.textDimmed, padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: t.fontBody, transition: "all 0.2s" },
  modoBtnActive: { background: t.bgInput, color: t.accent },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: t.fontBody, transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: t.bgHover, borderColor: t.accent, color: t.accent },
  grupoProvasBox: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 16, overflow: "hidden" },
  grupoProvasHeader: { background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  provaCheckBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: t.fontBody, lineHeight: 1.4, userSelect: "none" },
  provaCheckBtnSel: { background: t.bgHover, borderColor: t.accent, color: t.accent },
};
}

function TelaGerenciarEquipes() {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { usuarioLogado, gerarSenhaTemp } = useAuth();
  const { equipes, atletas, atualizarAtleta, inscricoes, atualizarInscricao, adicionarEquipeFiliada, editarEquipeFiliada, excluirEquipeFiliada } = useEvento();
  const { setTela, organizadores } = useApp();
  const [modo, setModo] = useState("lista"); // lista | novo | editar | importar
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [organizadorSelecionado, setOrganizadorSelecionado] = useState("");
  const [equipeSelecionada, setEquipeSelecionada] = useState(null);
  const [form, setForm] = useState({ nome: "", sigla: "", cidade: "", estado: "", cnpj: "", contato: "", email: "", senha: "", organizadorId: "", status: "ativa" });
  const [erros, setErros] = useState({});
  const [filtro, setFiltro] = useState("");
  const [filtroDebounced, setFiltroDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setFiltroDebounced(filtro), 300);
    return () => clearTimeout(timer);
  }, [filtro]);

  const isAdmin = usuarioLogado?.tipo === "admin";
  const isOrganizador = usuarioLogado?.tipo === "organizador";
  const isFuncionario = usuarioLogado?.tipo === "funcionario";
  const meuOrgId = isOrganizador ? usuarioLogado.id : isFuncionario ? usuarioLogado.organizadorId : null;

  const validar = () => {
    const e = {};
    if (!form.nome) e.nome = "Nome da equipe é obrigatório";
    if (!form.sigla) e.sigla = "Sigla é obrigatória";
    if (!form.cidade) e.cidade = "Cidade é obrigatória";
    if (!form.estado) e.estado = "Estado é obrigatório";
    if (!form.email) e.email = "E-mail é obrigatório";
    if (modo === "novo" && !form.senha) e.senha = "Senha é obrigatória";
    if (!form.cnpj) e.cnpj = "CNPJ é obrigatório";
    else if (!validarCNPJ(form.cnpj)) e.cnpj = "CNPJ inválido";
    if (!form.organizadorId && isAdmin) e.organizadorId = "Selecione o organizador";
    
    // Verificar duplicação de nome (exceto se for edição da mesma equipe)
    const jaExisteNome = equipes.some(eq =>
      eq.nome.toLowerCase() === form.nome.toLowerCase() &&
      eq.id !== equipeSelecionada?.id
    );
    if (jaExisteNome) e.nome = "Já existe uma equipe com este nome";

    // Verificar duplicação de sigla
    if (form.sigla) {
      const jaExisteSigla = equipes.some(eq =>
        eq.sigla?.toLowerCase() === form.sigla.toLowerCase() &&
        eq.id !== equipeSelecionada?.id
      );
      if (jaExisteSigla) e.sigla = "Já existe uma equipe com esta sigla";
    }

    // Verificar duplicação de CNPJ
    if (form.cnpj && !e.cnpj) {
      const cnpjLimpo = form.cnpj.replace(/\D/g, "");
      const jaExisteCnpj = equipes.some(eq =>
        eq.cnpj?.replace(/\D/g, "") === cnpjLimpo &&
        eq.id !== equipeSelecionada?.id
      );
      if (jaExisteCnpj) e.cnpj = "Já existe uma equipe com este CNPJ";
    }

    return e;
  };

  const handleSalvar = async () => {
    const e = validar();
    if (Object.keys(e).length) { setErros(e); return; }

    // Auto-vincular ao organizador logado se não for admin
    const orgId = isAdmin ? form.organizadorId : meuOrgId;

    if (modo === "novo") {
      // Criar conta no Firebase Auth via secondaryAuth
      try {
        await createUserWithEmailAndPassword(secondaryAuth, form.email.trim(), form.senha);
        await firebaseSignOut(secondaryAuth).catch(() => {});
      } catch (authErr) {
        if (authErr.code !== "auth/email-already-in-use") {
          alert("Erro ao criar conta de login: " + authErr.message); return;
        }
      }
      const { senha: _s, ...formSemSenha } = form;
      const novaEquipe = {
        ...formSemSenha,
        cnpj: formatarCNPJ(formSemSenha.cnpj),
        organizadorId: orgId,
        id: genId(),
        status: "ativa",
        dataCadastro: new Date().toISOString(),
        cadastradoPor: usuarioLogado.id,
        senhaTemporaria: true,
      };
      adicionarEquipeFiliada(novaEquipe);
      alert(`Equipe "${form.nome}" cadastrada!\n\nLogin: ${form.email}\nSenha temporária definida.\n\nA equipe será obrigada a trocar a senha no primeiro acesso.`);
    } else if (modo === "editar") {
      const { senha: _s, ...dadosAtualizar } = form; // nunca persistir senha
      const equipeAtualizada = { ...equipeSelecionada, ...dadosAtualizar, cnpj: formatarCNPJ(dadosAtualizar.cnpj), organizadorId: orgId };

      // Se email mudou, criar nova conta Auth com o novo email
      const emailAntigo = (equipeSelecionada.email || "").trim().toLowerCase();
      const emailNovo = (form.email || "").trim().toLowerCase();
      if (emailNovo && emailNovo !== emailAntigo) {
        try {
          const senhaTemp = gerarSenhaTemp ? gerarSenhaTemp() : Math.random().toString(36).slice(2, 10);
          await createUserWithEmailAndPassword(secondaryAuth, emailNovo, senhaTemp);
          await firebaseSignOut(secondaryAuth).catch(() => {});
          equipeAtualizada.senhaTemporaria = true;
          alert(`Email atualizado! Nova conta Auth criada.\nSenha temporária: ${senhaTemp}\nA equipe deve trocar no primeiro acesso.`);
        } catch (authErr) {
          if (authErr.code === "auth/email-already-in-use") {
            // OK — novo email já tem conta Auth
          } else {
            alert(`Aviso: não foi possível criar conta Auth para ${emailNovo} (${authErr.code}).`);
          }
        }
        // Deletar conta Auth antiga via Cloud Function
        if (emailAntigo) {
          try {
            const deleteAuthUser = httpsCallable(functions, "deleteAuthUser");
            await deleteAuthUser({ email: emailAntigo });
          } catch (err) {
            console.warn("[GerenciarEquipes] Não foi possível deletar conta Auth antiga:", err.message);
            alert(`Atenção: a conta Auth antiga (${emailAntigo}) não foi excluída automaticamente.\nExclua manualmente em Gerenciar Usuários > Contas Órfãs.\n\nMotivo: ${err.message}`);
          }
        }
      }

      editarEquipeFiliada(equipeAtualizada);

      // Atualizar atletas vinculados se nome da equipe mudou
      const nomeAntigo = equipeSelecionada.nome;
      const nomeNovo = form.nome;
      if (nomeAntigo && nomeNovo && nomeAntigo !== nomeNovo) {
        const atletasVinculados = atletas.filter(a =>
          a.equipeId === equipeSelecionada.id || a.clube === nomeAntigo
        );
        atletasVinculados.forEach(a => {
          const updates = {};
          if (a.clube === nomeAntigo) updates.clube = nomeNovo;
          if (Object.keys(updates).length > 0) atualizarAtleta({ ...a, ...updates });
        });
        // Atualizar inscrições com equipeCadastro antigo
        if (inscricoes) {
          inscricoes.filter(i => i.equipeCadastro === nomeAntigo).forEach(i => {
            atualizarInscricao({ ...i, equipeCadastro: nomeNovo });
          });
        }
        if (atletasVinculados.length > 0) {
          alert(`Equipe "${nomeNovo}" atualizada!\n\n${atletasVinculados.length} atleta(s) e inscrições atualizados automaticamente.`);
        } else {
          alert(`Equipe "${nomeNovo}" atualizada!`);
        }
      } else {
        alert(`Equipe "${form.nome}" atualizada!`);
      }
    }

    setModo("lista");
    setForm({ nome: "", sigla: "", cidade: "", estado: "", cnpj: "", contato: "", email: "", senha: "", organizadorId: "", status: "ativa" });
    setEquipeSelecionada(null);
    setErros({});
  };

  const handleEditar = (equipe) => {
    setEquipeSelecionada(equipe);
    setForm({
      nome: equipe.nome || "",
      sigla: equipe.sigla || "",
      cidade: equipe.cidade || "",
      estado: equipe.estado || equipe.uf || "",
      cnpj: equipe.cnpj || "",
      contato: equipe.contato || "",
      email: equipe.email || "",
      senha: "", // nunca carregar senha existente — redefinir via Firebase Auth
      organizadorId: equipe.organizadorId || "",
      status: equipe.status || "ativa",
    });
    setModo("editar");
  };

  const handleCancelar = () => {
    setModo("lista");
    setForm({ nome: "", sigla: "", cidade: "", estado: "", cnpj: "", contato: "", email: "", senha: "", organizadorId: "" });
    setEquipeSelecionada(null);
    setErros({});
  };

  // Filtrar equipes do organizador (se não for admin)
  const minhasEquipes = isAdmin
    ? equipes
    : meuOrgId
      ? equipes.filter(eq => eq.organizadorId === meuOrgId)
      : equipes;

  const equipesFiltradas = useMemo(() => {
    const termo = filtroDebounced.trim().toLowerCase();
    if (!termo) return minhasEquipes;
    return minhasEquipes.filter(eq =>
      (eq.nome || "").toLowerCase().includes(termo) ||
      (eq.sigla || "").toLowerCase().includes(termo) ||
      (eq.cidade || "").toLowerCase().includes(termo)
    );
  }, [minhasEquipes, filtroDebounced]);

  const { paginado: equipesPag, infoPage: equipesInfo } = usePagination(equipesFiltradas, 20);

  // Mapa equipeId → quantidade de atletas (por equipeId ou fallback por clube/nome)
  const atletasPorEquipe = useMemo(() => {
    const mapa = {};
    const nomeParaId = {};
    (minhasEquipes || []).forEach(eq => { if (eq.nome) nomeParaId[eq.nome] = eq.id; });
    (atletas || []).forEach(a => {
      const eqId = a.equipeId || (a.clube && nomeParaId[a.clube]) || null;
      if (eqId) mapa[eqId] = (mapa[eqId] || 0) + 1;
    });
    return mapa;
  }, [atletas, minhasEquipes]);

  // Stats (baseado nas equipes do organizador)
  const equipesAtivas = minhasEquipes.filter(e => e.status === "ativa").length;
  const equipesInativas = minhasEquipes.filter(e => e.status === "inativa").length;


  // ── MODO: IMPORTAR ────────────────────────────────────────────────────────
  if (modo === "importar") {
    const handleFileChange = async (e) => {
      const selectedFile = e.target.files[0];
      if (!selectedFile) return;

      setErro("");
      setFile(selectedFile);
      setLoading(true);

      try {
        let XL = typeof window !== 'undefined' && window.XLSX ? window.XLSX : null;
        if (!XL) {
          try {
            XL = await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
          } catch(e) {
            try {
              await new Promise((resolve, reject) => {
                const scriptEl = document.createElement('script');
                scriptEl.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
                scriptEl.onload = resolve;
                scriptEl.onerror = reject;
                document.head.appendChild(scriptEl);
              });
              XL = window.XLSX;
            } catch(e2) {}
          }
        }
        if (!XL) {
          setErro("Não foi possível carregar a biblioteca Excel. Recarregue a página (Ctrl+Shift+R).");
          setLoading(false);
          return;
        }

        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XL.read(arrayBuffer, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XL.utils.sheet_to_json(worksheet, { defval: "" });

        if (data.length === 0) {
          setErro("A planilha está vazia. Adicione pelo menos uma equipe.");
          setLoading(false);
          return;
        }

        const equipesParaImportar = [];
        const erros = [];

        data.forEach((row, idx) => {
          const linha = idx + 2;
          
          // Normalizar chaves: case-insensitive lookup
          const get = (chaves) => {
            for (const ch of chaves) {
              if (row[ch] !== undefined && row[ch] !== "") return String(row[ch]).trim();
              // Busca case-insensitive
              const found = Object.keys(row).find(k => k.toLowerCase() === ch.toLowerCase());
              if (found && row[found] !== undefined && row[found] !== "") return String(row[found]).trim();
            }
            return "";
          };

          const nome = get(["Nome da Equipe*", "Nome da Equipe", "Nome"]);
          const sigla = get(["Sigla*", "Sigla"]).toUpperCase();
          const cidade = get(["Cidade*", "Cidade"]);
          const estado = get(["Estado*", "Estado"]).toUpperCase();
          const cnpj = get(["CNPJ*", "CNPJ"]);
          const email = get(["E-mail*", "E-mail", "Email*", "Email"]);
          const senha = get(["Senha"]);
          const contato = get(["Telefone", "Contato", "Fone"]);

          // Validations
          if (!nome) {
            erros.push(`Linha ${linha}: Nome da equipe é obrigatório`);
            return;
          }
          if (!sigla) {
            erros.push(`Linha ${linha}: Sigla é obrigatória`);
            return;
          }
          if (!cidade) {
            erros.push(`Linha ${linha}: Cidade é obrigatória`);
            return;
          }
          if (!estado) {
            erros.push(`Linha ${linha}: Estado é obrigatório`);
            return;
          }
          if (!cnpj) {
            erros.push(`Linha ${linha}: CNPJ é obrigatório`);
            return;
          }
          if (cnpj && !validarCNPJ(cnpj)) {
            erros.push(`Linha ${linha}: CNPJ inválido`);
            return;
          }
          if (!email) {
            erros.push(`Linha ${linha}: E-mail é obrigatório`);
            return;
          }

          // Check duplicates by name
          if (equipes.some(eq => eq.nome.toLowerCase() === nome.toLowerCase())) {
            erros.push(`Linha ${linha}: Equipe "${nome}" já cadastrada no sistema`);
            return;
          }

          // Check duplicates in file by name
          if (equipesParaImportar.some(eq => eq.nome.toLowerCase() === nome.toLowerCase())) {
            erros.push(`Linha ${linha}: Equipe "${nome}" duplicada na planilha`);
            return;
          }

          // Check duplicate CNPJ in system
          const cnpjLimpo = cnpj.replace(/\D/g, "");
          if (equipes.some(eq => eq.cnpj?.replace(/\D/g, "") === cnpjLimpo)) {
            erros.push(`Linha ${linha}: CNPJ ${cnpj} já cadastrado no sistema`);
            return;
          }

          // Check duplicate CNPJ in file
          if (equipesParaImportar.some(eq => eq.cnpj?.replace(/\D/g, "") === cnpjLimpo)) {
            erros.push(`Linha ${linha}: CNPJ ${cnpj} duplicado na planilha`);
            return;
          }

          // Check duplicate sigla in system
          if (equipes.some(eq => eq.sigla?.toLowerCase() === sigla.toLowerCase())) {
            erros.push(`Linha ${linha}: Sigla "${sigla}" já cadastrada no sistema`);
            return;
          }

          // Check duplicate sigla in file
          if (equipesParaImportar.some(eq => eq.sigla?.toLowerCase() === sigla.toLowerCase())) {
            erros.push(`Linha ${linha}: Sigla "${sigla}" duplicada na planilha`);
            return;
          }

          // Gerar senha se não fornecida
          const senhaFinal = senha || (() => {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let pwd = "";
            for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
            return pwd;
          })();

          equipesParaImportar.push({
            nome,
            sigla,
            cidade,
            estado,
            cnpj: formatarCNPJ(cnpj),
            email,
            senha: senhaFinal,
            contato: contato || undefined,
            _linhaOrigem: linha,
            _senhaGerada: !senha
          });
        });

        if (erros.length > 0 && equipesParaImportar.length === 0) {
          setErro(`Nenhuma equipe válida encontrada.\n\nErros encontrados:\n${erros.join('\n')}`);
          setPreview(null);
        } else {
          if (erros.length > 0) {
            setErro(`${erros.length} linha(s) com problema (serão ignoradas):\n${erros.join('\n')}\n\n${equipesParaImportar.length} equipe(s) válida(s) pronta(s) para importar.`);
          }
          setPreview(equipesParaImportar);
        }
      } catch (err) {
        setErro(`Erro ao ler arquivo: ${err.message}`);
        setPreview(null);
      }

      setLoading(false);
    };

    const handleConfirmar = async () => {
      if (!preview || preview.length === 0) return;

      // Validar organizador para admin
      if (isAdmin && !organizadorSelecionado) {
        setErro("Selecione o organizador responsável pelas equipes");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const orgId = isAdmin ? organizadorSelecionado : meuOrgId;

      let importados = 0;
      const credenciais = [];
      const authErros = [];
      const authExistentes = [];
      for (const equipeDados of preview) {
        const { _linhaOrigem, _senhaGerada, senha: _senhaImport, ...data } = equipeDados;
        // Criar conta Auth
        const senhaAuth = _senhaImport && String(_senhaImport).length >= 6
          ? String(_senhaImport)
          : (() => { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from({length:8}, () => c[Math.floor(Math.random()*c.length)]).join(""); })();
        try {
          await createUserWithEmailAndPassword(secondaryAuth, data.email, senhaAuth);
          await firebaseSignOut(secondaryAuth).catch(() => {});
        } catch (authErr) {
          if (authErr.code === "auth/email-already-in-use") {
            authExistentes.push(`${data.nome} (${data.email})`);
          } else {
            authErros.push(`${data.nome} (${data.email}): ${authErr.code}`);
          }
        }
        const novaEquipe = {
          ...data,
          id: genId(),
          organizadorId: orgId,
          status: "ativa",
          dataCadastro: new Date().toISOString(),
          cadastradoPor: usuarioLogado.id,
          senhaTemporaria: true,
        };
        adicionarEquipeFiliada(novaEquipe);
        credenciais.push({ nome: data.nome, email: data.email, senha: senhaAuth, gerada: _senhaGerada || senhaAuth !== String(_senhaImport) });
        importados++;
      }

      const resumo = credenciais.map(c =>
        `${c.nome}: ${c.email} / ${c.gerada ? c.senha + " (temporária)" : "(senha definida na planilha)"}`
      ).join("\n");
      const authAvisoExistentes = authExistentes.length > 0
        ? `\n\n${authExistentes.length} equipe(s) já possuíam conta Auth (usarão a senha existente):\n${authExistentes.join("\n")}`
        : "";
      const authAviso = (authErros.length > 0
        ? `\n\n⚠ ${authErros.length} conta(s) Auth não criada(s):\n${authErros.join("\n")}`
        : "") + authAvisoExistentes;
      alert(`${importados} equipe(s) importada(s)!\n\nCredenciais de acesso:\n${resumo}\n\nAnote as senhas temporárias — elas não serão exibidas novamente.\nTodas são temporárias — a equipe será obrigada a trocar no primeiro acesso.${authAviso}`);
      setModo("lista");
      setFile(null);
      setPreview(null);
      setOrganizadorSelecionado("");
    };

    return (
      <div style={s.page}>
        <div style={s.painelHeader}>
          <div>
            <h1 style={s.pageTitle}>Importar Equipes</h1>
            <p style={{ color: t.textDimmed, fontSize: 14 }}>
              Upload de planilha Excel com múltiplas equipes
            </p>
          </div>
          <button style={s.btnGhost} onClick={() => setModo("lista")}>
            ← Voltar
          </button>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {/* Upload area */}
          <div style={{
            background: t.bgHeaderSolid,
            border: `2px dashed ${t.accent}`,
            borderRadius: 12,
            padding: 40,
            textAlign: "center",
            marginBottom: 24
          }}>
            <div style={{ marginBottom: 16 }}><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
            <h3 style={{ color: t.accent, marginBottom: 12 }}>Faça upload da planilha Excel</h3>
            
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="file-upload-equipes"
            />
            <label htmlFor="file-upload-equipes">
              <div style={{ ...s.btnPrimary, display: "inline-block", cursor: "pointer" }}>
                Selecionar Arquivo Excel
              </div>
            </label>

            {file && (
              <div style={{ marginTop: 16, color: t.success, fontSize: 14 }}>
                ✓ Arquivo selecionado: {file.name}
              </div>
            )}

            {loading && (
              <div style={{ marginTop: 16, color: t.accent }}>
                Processando planilha...
              </div>
            )}
          </div>

          {/* Download template */}
          <div style={{
            background: t.bgCardAlt,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: 20,
            marginBottom: 24
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg></div>
              <div style={{ flex: 1 }}>
                <h4 style={{ color: t.textPrimary, marginBottom: 4 }}>Modelo de Planilha</h4>
                <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 0 }}>
                  Campos obrigatórios: Nome, Sigla, Cidade, Estado, CNPJ, E-mail. Senha é gerada automaticamente se deixada em branco.
                </p>
              </div>
              <button
                onClick={async () => {
                  let XL = typeof window !== 'undefined' && window.XLSX ? window.XLSX : null;
                  if (!XL) {
                    try {
                      XL = await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
                    } catch(e) {
                      try {
                        await new Promise((resolve, reject) => {
                          const scriptEl = document.createElement('script');
                          scriptEl.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
                          scriptEl.onload = resolve;
                          scriptEl.onerror = reject;
                          document.head.appendChild(scriptEl);
                        });
                        XL = window.XLSX;
                      } catch(e2) {}
                    }
                  }
                  if (!XL) {
                    alert("Não foi possível carregar a biblioteca Excel. Recarregue a página.");
                    return;
                  }
                  const modelo = [
                    { "Nome da Equipe*": "Clube Exemplo", "Sigla*": "CEX", "Cidade*": "São Paulo", "Estado*": "SP", "CNPJ*": "11.222.333/0001-81", "E-mail*": "contato@clubeexemplo.com", "Senha": "", "Telefone": "(11) 99999-0000" },
                    { "Nome da Equipe*": "", "Sigla*": "", "Cidade*": "", "Estado*": "", "CNPJ*": "", "E-mail*": "", "Senha": "", "Telefone": "" }
                  ];
                  const ws = XL.utils.json_to_sheet(modelo);
                  ws["!cols"] = [{ wch: 30 }, { wch: 8 }, { wch: 18 }, { wch: 6 }, { wch: 20 }, { wch: 28 }, { wch: 12 }, { wch: 18 }];
                  const wb = XL.utils.book_new();
                  XL.utils.book_append_sheet(wb, ws, "Equipes");
                  XL.writeFile(wb, "modelo_importacao_equipes.xlsx");
                }}
                style={{ ...s.btnSecondary, border: "none", cursor: "pointer" }}
              >
                Baixar Modelo
              </button>
            </div>
          </div>

          {/* Errors */}
          {erro && (
            <div style={{
              background: preview && preview.length > 0 ? `${t.warning}15` : `${t.danger}15`,
              border: `1px solid ${preview && preview.length > 0 ? t.warning : t.danger}`,
              borderRadius: 8,
              padding: 20,
              marginBottom: 24,
              whiteSpace: "pre-line"
            }}>
              <div style={{ color: preview && preview.length > 0 ? t.warning : t.danger, fontWeight: 600, marginBottom: 8 }}>
                {preview && preview.length > 0 ? "Importação parcial:" : "Erros encontrados:"}
              </div>
              <div style={{ color: preview && preview.length > 0 ? t.warning : `${t.danger}cc`, fontSize: 13 }}>{erro}</div>
            </div>
          )}

          {/* Organizador selector for admin */}
          {isAdmin && preview && preview.length > 0 && (
            <div style={{
              background: t.bgHeaderSolid,
              border: `2px solid ${t.accent}`,
              borderRadius: 12,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{ color: t.accent, marginBottom: 16 }}>
                Vincular equipes a:
              </h3>
              <div>
                <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                  Organizador Responsável *
                </label>
                <select
                  value={organizadorSelecionado}
                  onChange={(e) => setOrganizadorSelecionado(e.target.value)}
                  style={{
                    ...s.input,
                    width: "100%",
                    background: organizadorSelecionado ? `${t.success}11` : t.bgCardAlt
                  }}
                >
                  <option value="">Selecione...</option>
                  {organizadores.filter(o => o.status === "aprovado").map(org => (
                    <option key={org.id} value={org.id}>{org.nome} - {org.entidade}</option>
                  ))}
                </select>
                <p style={{ color: t.textDimmed, fontSize: 12, marginTop: 12 }}>
                  Todas as {preview.length} equipe(s) serão vinculadas a este organizador
                </p>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && preview.length > 0 && (
            <div style={{
              background: t.bgHeaderSolid,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{ color: t.success, marginBottom: 16 }}>
                ✓ {preview.length} equipe(s) pronta(s) para importação
              </h3>
              <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 20 }}>
                Revise os dados{isAdmin ? " e selecione o organizador acima" : ""} antes de confirmar:
              </p>

              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Nome</th>
                      <th style={s.th}>Sigla</th>
                      <th style={s.th}>Cidade/UF</th>
                      <th style={s.th}>CNPJ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((eq, idx) => (
                      <tr key={idx} style={s.tr}>
                        <td style={s.td}>{eq.nome}</td>
                        <td style={s.td}>{eq.sigla}</td>
                        <td style={s.td}>{eq.cidade}/{eq.estado}</td>
                        <td style={s.td}>{eq.cnpj}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  style={s.btnGhost}
                  onClick={() => { setPreview(null); setFile(null); setOrganizadorSelecionado(""); }}
                >
                  Cancelar
                </button>
                <button
                  style={s.btnPrimary}
                  onClick={handleConfirmar}
                >
                  ✓ Confirmar Importação ({preview.length} equipes)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }


  if (modo === "lista") {
    return (
      <div style={s.page}>
        <div style={s.painelHeader}>
          <div>
            <h1 style={s.pageTitle}>Equipes</h1>
            <p style={{ color: t.textDimmed, fontSize: 14 }}>
              Gerenciar clubes e equipes cadastradas no sistema
            </p>
          </div>
          <button style={s.btnGhost} onClick={() => setTela(isAdmin ? "admin" : "painel-organizador")}>
            ← Voltar
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ color: t.textDimmed, fontSize: 12, marginBottom: 4 }}>Total de Equipes</div>
            <div style={{ color: t.accent, fontSize: 32, fontWeight: 700 }}>{minhasEquipes.length}</div>
          </div>
          <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ color: t.textDimmed, fontSize: 12, marginBottom: 4 }}>Equipes Ativas</div>
            <div style={{ color: t.success, fontSize: 32, fontWeight: 700 }}>{equipesAtivas}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button style={s.btnPrimary} onClick={() => setModo("novo")}>
            + Nova Equipe
          </button>
          <button style={s.btnSecondary} onClick={() => setModo("importar")}>
            Importar Planilha
          </button>
          <input
            type="text"
            placeholder="Buscar equipe..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{ ...s.input, flex: 1 }}
          />
        </div>

        {/* Lista de Equipes */}
        {equipesFiltradas.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: t.textDimmed }}>
            <div style={{ marginBottom: 16 }}><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20"/><path d="M4 20V8l8-4 8 4v12"/><path d="M9 20v-6h6v6"/><path d="M3 8h18"/></svg></div>
            {filtro ? (
              <>
                <div style={{ fontSize: 18, marginBottom: 8 }}>Nenhuma equipe encontrada</div>
                <div style={{ fontSize: 14 }}>Tente outro termo de busca</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 18, marginBottom: 8 }}>Nenhuma equipe cadastrada</div>
                <div style={{ fontSize: 14, marginBottom: 20 }}>Cadastre a primeira equipe</div>
                <button style={s.btnPrimary} onClick={() => setModo("novo")}>
                  + Cadastrar Primeira Equipe
                </button>
              </>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gap: 12 }}>
            {equipesPag.map((equipe) => {
              const nAtletas = atletasPorEquipe[equipe.id] || 0;

              return (
                <div key={equipe.id} style={{
                  background: t.bgHeaderSolid,
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16
                }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    minWidth: 56,
                    background: `${t.accent}15`,
                    border: `1px solid ${t.accentBorder}`,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: equipe.sigla && equipe.sigla.length > 4 ? 10 : 16,
                    fontWeight: 800,
                    color: t.accent,
                    overflow: "hidden",
                    textAlign: "center",
                    lineHeight: 1.1,
                    padding: 4,
                    wordBreak: "break-all",
                    letterSpacing: equipe.sigla && equipe.sigla.length <= 4 ? 1 : 0,
                  }}>
                    {equipe.sigla || equipe.nome?.substring(0, 2)?.toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <h3 style={{ color: t.textPrimary, fontSize: 15, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{equipe.nome}</h3>
                      <span style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: equipe.status === "ativa" ? `${t.success}22` : `${t.textDimmed}22`,
                        color: equipe.status === "ativa" ? t.success : t.textDimmed,
                        fontWeight: 600
                      }}>
                        {equipe.status === "ativa" ? "ATIVA" : "INATIVA"}
                      </span>
                    </div>
                    <div style={{ color: t.textMuted, fontSize: 13 }}>
                      {equipe.cidade}, {equipe.estado}
                      {equipe.cnpj && ` • CNPJ: ${equipe.cnpj}`}
                    </div>
                    {isAdmin && (() => {
                      const org = organizadores.find(o => o.id === equipe.organizadorId);
                      return (
                        <div style={{ color: org ? t.accent : t.warning, fontSize: 11, marginTop: 3 }}>
                          {org ? `${org.nome} — ${org.entidade}` : (equipe.organizadorId ? `Org. não encontrado (${equipe.organizadorId.substring(0,8)}...)` : "Sem organizador vinculado")}
                        </div>
                      );
                    })()}
                    <div style={{ color: t.textDimmed, fontSize: 12, marginTop: 6 }}>
                      {nAtletas} atleta(s)
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={s.btnSecondary}
                      onClick={() => handleEditar(equipe)}
                    >
                      Editar
                    </button>
                    <button
                      style={s.btnGhost}
                      onClick={() => excluirEquipeFiliada(equipe.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
            <PaginaControles {...equipesInfo} />
          </div>
        )}
      </div>
    );
  }

  // Formulário (Novo/Editar)
  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>
            {modo === "novo" ? "Nova Equipe" : "Editar Equipe"}
          </h1>
          <p style={{ color: t.textDimmed, fontSize: 14 }}>
            {modo === "novo" ? "Cadastrar nova equipe" : `Editando: ${equipeSelecionada?.nome}`}
          </p>
        </div>
        <button style={s.btnGhost} onClick={handleCancelar}>
          ← Cancelar
        </button>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{
          background: t.bgHeaderSolid,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: 32
        }}>
          <div style={s.grid2form}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                Nome da Equipe *
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Clube Atlético Paranaense"
                style={{ ...s.input, borderColor: erros.nome ? t.danger : undefined }}
              />
              {erros.nome && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.nome}</div>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                Sigla *
              </label>
              <input
                type="text"
                value={form.sigla}
                onChange={(e) => setForm({ ...form, sigla: e.target.value.toUpperCase() })}
                placeholder="Ex: CAP"
                style={{ ...s.input, borderColor: erros.sigla ? t.danger : undefined }}
              />
              {erros.sigla && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.sigla}</div>}
            </div>
          </div>

          <div style={s.grid2form}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                Cidade *
              </label>
              <input
                type="text"
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                placeholder="Ex: Curitiba"
                style={{ ...s.input, borderColor: erros.cidade ? t.danger : undefined }}
              />
              {erros.cidade && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.cidade}</div>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                Estado *
              </label>
              <input
                type="text"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                placeholder="Ex: PR"
                maxLength={2}
                style={{ ...s.input, borderColor: erros.estado ? t.danger : undefined }}
              />
              {erros.estado && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.estado}</div>}
            </div>
          </div>

          {isAdmin && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                Organizador Responsável *
              </label>
              <select
                value={form.organizadorId}
                onChange={(e) => setForm({ ...form, organizadorId: e.target.value })}
                style={{ ...s.input, borderColor: erros.organizadorId ? t.danger : undefined }}
              >
                <option value="">Selecione o organizador...</option>
                {organizadores.filter(o => o.status === "aprovado").map(org => (
                  <option key={org.id} value={org.id}>
                    {org.nome} - {org.entidade}
                  </option>
                ))}
              </select>
              {erros.organizadorId && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.organizadorId}</div>}
              <div style={{ color: t.textDimmed, fontSize: 11, marginTop: 4 }}>
                Selecione o organizador que será responsável por esta equipe
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
              CNPJ *
            </label>
            <input
              type="text"
              value={form.cnpj}
              onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              style={{ ...s.input, borderColor: erros.cnpj ? t.danger : undefined }}
            />
            {erros.cnpj && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.cnpj}</div>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
              Telefone (opcional)
            </label>
            <input
              type="text"
              value={form.contato}
              onChange={(e) => setForm({ ...form, contato: e.target.value })}
              placeholder="(00) 00000-0000"
              style={s.input}
            />
          </div>

          <div style={s.grid2form}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                E-mail *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contato@equipe.com"
                style={{ ...s.input, borderColor: erros.email ? t.danger : undefined }}
              />
              {erros.email && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.email}</div>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>
                Senha {modo === "novo" ? "*" : "(deixe vazio para manter)"}
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  placeholder={modo === "editar" ? "••••••" : "Senha de acesso"}
                  style={{ ...s.input, flex: 1, borderColor: erros.senha ? t.danger : undefined }}
                />
                {modo === "novo" && (
                  <button type="button" style={{ ...s.btnGhost, fontSize: 11, padding: "8px 12px", whiteSpace: "nowrap" }}
                    onClick={() => {
                      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                      let pwd = "";
                      for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
                      setForm({ ...form, senha: pwd });
                    }}>
                    Gerar
                  </button>
                )}
              </div>
              {erros.senha && <div style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{erros.senha}</div>}
            </div>
          </div>

          {modo === "editar" && isAdmin && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: t.textTertiary, fontSize: 13, marginBottom: 6 }}>Status da Equipe</label>
              <select value={form.status || "ativa"} onChange={e => setForm({ ...form, status: e.target.value })}
                style={s.input}>
                <option value="ativa">Ativa</option>
                <option value="pendente">Pendente</option>
                <option value="inativa">Inativa</option>
                <option value="recusada">Recusada</option>
              </select>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button style={s.btnGhost} onClick={handleCancelar}>
              Cancelar
            </button>
            <button style={s.btnPrimary} onClick={handleSalvar}>
              {modo === "novo" ? "✓ Cadastrar Equipe" : "✓ Salvar Alterações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



export default TelaGerenciarEquipes;
