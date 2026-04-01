import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { _getCbat } from "../../shared/formatters/utils";
import { getCategoria } from "../../shared/constants/categorias";
import { Th, Td } from "../ui/TableHelpers";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { gerarQrPublico, gerarQrSecretaria, parsearQrSecretaria } from "../../shared/qrcode/gerarQrCode";
import QrScanner from "../../shared/qrcode/QrScanner";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";
import { beepOk, beepInvalido, vibrarOk, vibrarInvalido } from "../../shared/qrcode/scannerSons";
import ExcelJS from "exceljs";

function getStyles(t) {
  return {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: t.textPrimary, marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: t.textPrimary, marginBottom: 20, letterSpacing: 1 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  btnPrimary: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: t.accent, border: `2px solid ${t.accentBorder}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost: { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: `1px solid ${t.border}` },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: t.bgHeaderSolid, padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` },
  td: { padding: "12px 16px", fontSize: 14, color: t.textSecondary, borderBottom: `1px solid ${t.border}` },
  tr: { transition: "background 0.15s" },
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
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.accent, marginBottom: 16 },
  formCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32, marginBottom: 20 },
  formTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: t.textPrimary, textAlign: "center", marginBottom: 8 },
  formSub: { color: t.textDimmed, textAlign: "center", fontSize: 14, marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },
  fieldError: { color: t.danger, fontSize: 12, marginTop: 2 },
  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: t.textMuted, transition: "all 0.2s" },
  radioLabelActive: { background: t.bgHover, border: `1px solid ${t.accentBorder}`, color: t.accent },
  sumuCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  btnIconSm: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textMuted, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: t.bgCardAlt, border: `1px solid ${t.danger}44`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
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
    background: status === "ao_vivo" ? `${t.danger}15` : status === "hoje_pre" ? t.accentBg : status === "futuro" ? `${t.success}15` : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textDisabled,
    border: `1px solid ${status === "ao_vivo" ? `${t.danger}44` : status === "hoje_pre" ? t.accentBorder : status === "futuro" ? `${t.success}44` : t.border}`,
  }),
  permissividadeBox: { background: t.bgHeaderSolid, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 4 },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? t.bgHover : "transparent", color: ativo ? t.accent : t.textDisabled, border: `1px solid ${ativo ? t.accentBorder : t.border}` }),
  stepDivider: { flex: 1, height: 1, background: t.border, margin: "0 8px" },
  tagProva: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: t.textPrimary, fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  statusControlsCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  modoSwitch: { display: "flex", gap: 0, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: t.textDimmed, padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: t.bgInput, color: t.accent },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: t.bgHover, borderColor: t.accentBorder, color: t.accent },
  savedBadge: { background: `${t.success}15`, border: `1px solid ${t.success}44`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  inputMarca: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", color: t.accent, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
};
}

function TelaNumericaPeito() {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { usuarioLogado } = useAuth();
  const { eventoAtual, inscricoes, atletas, equipes, numeracaoPeito, setNumeracaoEvento } = useEvento();
  const { setTela, registrarAcao } = useApp();
  const confirmar = useConfirm();
  if (!eventoAtual) return <div style={s.page}><div style={s.emptyState}><p>Nenhuma competição selecionada.</p></div></div>;

  const eid = eventoAtual.id;
  const anoComp = eventoAtual.data ? parseInt(eventoAtual.data.slice(0, 4)) : new Date().getFullYear();
  const numMap = numeracaoPeito[eid] || {};
  const inscsEvt = inscricoes.filter(i => i.eventoId === eid);
  const atletaIds = [...new Set(inscsEvt.map(i => i.atletaId))];
  const atletasEvt = atletaIds.map(id => atletas.find(a => a.id === id)).filter(Boolean);

  const [editNum, setEditNum] = useState({ ...numMap });
  const [filtro, setFiltro] = useState("");
  const [feedback, setFeedback] = useState("");
  const [erroNum, setErroNum] = useState({});

  const getEquipeNome = (a) => {
    if (a.equipeId) {
      const eq = equipes.find(e => e.id === a.equipeId);
      return eq?.nome || a.clube || "ZZZ_SEM_EQUIPE";
    }
    return a.clube || "ZZZ_SEM_EQUIPE";
  };
  const atletasOrdenados = [...atletasEvt].sort((a, b) => {
    const eqA = getEquipeNome(a).toLowerCase(), eqB = getEquipeNome(b).toLowerCase();
    if (eqA !== eqB) return eqA.localeCompare(eqB);
    return (a.nome || "").toLowerCase().localeCompare((b.nome || "").toLowerCase());
  });

  const atletasFiltrados = filtro
    ? atletasOrdenados.filter(a => a.nome?.toLowerCase().includes(filtro.toLowerCase()) || getEquipeNome(a).toLowerCase().includes(filtro.toLowerCase()))
    : atletasOrdenados;

  const numerarAuto = () => {
    const input = prompt("A partir de qual número deseja iniciar a numeração?", "1");
    if (input === null) return; // cancelou
    const inicio = parseInt(input);
    if (isNaN(inicio) || inicio < 0) {
      setFeedback("❌ Número inválido.");
      setTimeout(() => setFeedback(""), 3000);
      return;
    }
    const novo = {};
    atletasOrdenados.forEach((a, i) => { novo[a.id] = inicio + i; });
    setEditNum(novo);
    setErroNum({});
    setFeedback(`✅ Numeração automática gerada a partir do nº ${inicio} — salve para aplicar.`);
    setTimeout(() => setFeedback(""), 3000);
  };

  const validarDuplicatas = (novoMap) => {
    const errs = {};
    const usados = {};
    Object.entries(novoMap).forEach(([aid, num]) => {
      if (num == null || num === "") return;
      const n = Number(num);
      if (usados[n]) {
        errs[aid] = `Nº ${n} já usado`;
        errs[usados[n]] = `Nº ${n} já usado`;
      } else {
        usados[n] = aid;
      }
    });
    return errs;
  };

  const handleChangeNum = (atletaId, val) => {
    const novo = { ...editNum, [atletaId]: val === "" ? "" : parseInt(val) || "" };
    setEditNum(novo);
    setErroNum(validarDuplicatas(novo));
  };

  const salvar = () => {
    const errs = validarDuplicatas(editNum);
    if (Object.keys(errs).length) {
      setErroNum(errs);
      setFeedback("❌ Há números duplicados — corrija antes de salvar.");
      setTimeout(() => setFeedback(""), 3000);
      return;
    }
    const limpo = {};
    Object.entries(editNum).forEach(([k, v]) => { if (v !== "" && v != null) limpo[k] = Number(v); });
    setNumeracaoEvento(eid, limpo);
    if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, "Numeração de peito", `${Object.keys(limpo).length} atletas — ${eventoAtual.nome}`, usuarioLogado?.organizadorId || usuarioLogado?.id, { modulo: "numeracao" });
    setFeedback("✅ Numeração salva com sucesso!");
    setTimeout(() => setFeedback(""), 3000);
  };

  const limparTudo = async () => { 
    if (!await confirmar("Limpar toda a numeração desta competição?")) return;
    setEditNum({ });
    setErroNum({});
  };

  // ── Exportação com QR Codes ────────────────────────────────────────────────
  const [gerandoQr, setGerandoQr] = useState(false);
  const [qrProgresso, setQrProgresso] = useState("");

  const exportarComQr = async () => {
    if (!eventoAtual?.slug) {
      alert("⚠️ Defina um slug para a competição antes de exportar com QR.\n\nO slug é necessário para o QR público funcionar corretamente.\n\nVá em: Cadastrar/Editar Competição → Dados da competição → Slug.");
      return;
    }

    setGerandoQr(true);
    setQrProgresso("Gerando QR público...");

    try {
      // QR público — um só para todo o evento
      const qrPubDataUrl = await gerarQrPublico(eventoAtual.slug);

      // QR secretaria — um por atleta
      const qrSecs = {};
      const total = atletasOrdenados.length;
      for (let i = 0; i < total; i++) {
        const a = atletasOrdenados[i];
        const peito = editNum[a.id] ?? numMap[a.id] ?? "";
        if (peito) {
          qrSecs[a.id] = await gerarQrSecretaria(eventoAtual.id, a.id, peito);
        }
        if (i % 10 === 0) {
          setQrProgresso(`Gerando QR codes... ${i + 1}/${total}`);
          await new Promise(r => setTimeout(r, 0));
        }
      }
      setQrProgresso("Montando planilha XLSX...");

      // Extrair base64 puro de data URL
      const dataUrlToBase64 = (dataUrl) => dataUrl.split(",")[1];

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Numeração de Peito");

      // Colunas (mesmos dados do CSV + QR codes)
      ws.columns = [
        { header: "Nº Peito", key: "peito", width: 10 },
        { header: "CBAt", key: "cbat", width: 12 },
        { header: "Atleta", key: "nome", width: 30 },
        { header: "Categoria", key: "cat", width: 12 },
        { header: "Equipe", key: "equipe", width: 25 },
        { header: "CPF", key: "cpf", width: 16 },
        { header: "Data Nasc.", key: "dataNasc", width: 12 },
        { header: "Sexo", key: "sexo", width: 6 },
        { header: "Provas", key: "provas", width: 35 },
        { header: "QR Público", key: "qrPub", width: 16 },
        { header: "QR Staff", key: "qrSec", width: 16 },
      ];

      // Estilo do header
      ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B5E20" } };
      ws.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      // Adicionar QR público como imagem reutilizável
      const qrPubImageId = wb.addImage({ base64: dataUrlToBase64(qrPubDataUrl), extension: "png" });

      // Linhas de dados
      const qrSize = 90; // pixels na célula
      const rowHeightPt = 72; // ~96px

      atletasOrdenados.forEach((a, idx) => {
        const eqNome = getEquipeNome(a) === "ZZZ_SEM_EQUIPE" ? "" : getEquipeNome(a);
        const cat = getCategoria(a.anoNasc, anoComp);
        const peito = editNum[a.id] ?? numMap[a.id] ?? "";
        const provas = inscsEvt.filter(i => i.atletaId === a.id && !i.combinadaId).map(i => {
          const p = todasAsProvas().find(pp => pp.id === i.provaId);
          return p?.nome || i.provaId;
        }).join(", ");

        const rowNum = idx + 2;
        const row = ws.addRow({
          peito: peito || "",
          cbat: _getCbat(a) || "",
          nome: a.nome || "",
          cat: cat?.nome || "",
          equipe: eqNome,
          cpf: a.cpf || "",
          dataNasc: a.dataNasc || "",
          sexo: a.sexo || "",
          provas,
          qrPub: "",
          qrSec: "",
        });

        row.height = rowHeightPt;
        row.alignment = { vertical: "middle", wrapText: true };
        row.getCell("peito").font = { bold: true, size: 14 };
        row.getCell("peito").alignment = { vertical: "middle", horizontal: "center" };

        // QR público (mesmo para todos) — coluna 10 (índice 9)
        ws.addImage(qrPubImageId, {
          tl: { col: 9, row: rowNum - 1 },
          ext: { width: qrSize, height: qrSize },
        });

        // QR secretaria (individual) — coluna 11 (índice 10)
        if (qrSecs[a.id]) {
          const qrSecImageId = wb.addImage({ base64: dataUrlToBase64(qrSecs[a.id]), extension: "png" });
          ws.addImage(qrSecImageId, {
            tl: { col: 10, row: rowNum - 1 },
            ext: { width: qrSize, height: qrSize },
          });
        }
      });

      // Gerar e baixar
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `numeracao-peito-qr-${eventoAtual.nome.replace(/\s+/g, "_")}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erro ao gerar planilha com QR: " + err.message);
    } finally {
      setGerandoQr(false);
      setQrProgresso("");
    }
  };

  // ── Preview / Teste de QR ──────────────────────────────────────────────────
  const [testeQrAberto, setTesteQrAberto] = useState(false);
  const [testeQrPreview, setTesteQrPreview] = useState(null); // { qrPub, qrSec, atleta, peito }

  const gerarPreviewQr = async () => {
    if (!eventoAtual?.slug) {
      alert("⚠️ Defina um slug para a competição antes de testar QR.");
      return;
    }
    // Pegar o primeiro atleta com nº de peito
    const primeiro = atletasOrdenados.find(a => editNum[a.id] ?? numMap[a.id]);
    if (!primeiro) {
      alert("⚠️ Numere pelo menos um atleta antes de testar.");
      return;
    }
    const peito = editNum[primeiro.id] ?? numMap[primeiro.id];
    setQrProgresso("Gerando QR de teste...");
    setGerandoQr(true);
    try {
      const qrPub = await gerarQrPublico(eventoAtual.slug);
      const qrSec = await gerarQrSecretaria(eventoAtual.id, primeiro.id, peito);
      setTesteQrPreview({ qrPub, qrSec, atleta: primeiro.nome, peito });
    } catch (err) {
      alert("Erro: " + err.message);
    } finally {
      setGerandoQr(false);
      setQrProgresso("");
    }
  };

  const handleTesteQrScan = (raw) => {
    const qr = parsearQrSecretaria(raw);
    if (qr) {
      if (qr.eventoId !== eventoAtual?.id) {
        beepInvalido(); vibrarInvalido();
        return { status: "erro", msg: "⚠️ QR de outro evento", cor: "vermelho" };
      }
      const atl = atletas.find(a => a.id === qr.atletaId);
      beepOk(); vibrarOk();
      return { status: "ok", msg: `✅ QR Staff válido — #${qr.numPeito} ${atl?.nome || qr.atletaId}`, cor: "verde" };
    }
    // Tentar como URL pública
    if (raw.includes("/competicao/") && raw.includes("/resultados")) {
      beepOk(); vibrarOk();
      return { status: "ok", msg: `✅ QR Público válido — ${raw}`, cor: "verde" };
    }
    beepInvalido(); vibrarInvalido();
    return { status: "erro", msg: `❌ QR não reconhecido: ${raw.slice(0, 50)}`, cor: "vermelho" };
  };

  const exportarCsv = () => {
    const linhas = atletasOrdenados.map(a => ({
      "Nº Peito": editNum[a.id] ?? numMap[a.id] ?? "",
      "CBAt": _getCbat(a),
      "Atleta": a.nome || "",
      "Categoria": getCategoria(a.anoNasc, anoComp)?.nome || "",
      "Equipe": getEquipeNome(a) === "ZZZ_SEM_EQUIPE" ? "" : getEquipeNome(a),
      "CPF": a.cpf || "",
      "Data Nasc.": a.dataNasc || "",
      "Sexo": a.sexo || "",
      "Provas": inscsEvt.filter(i => i.atletaId === a.id && !i.combinadaId).map(i => {
        const p = todasAsProvas().find(pp => pp.id === i.provaId);
        return p?.nome || i.provaId;
      }).join(", "),
    }));
    const headers = Object.keys(linhas[0] || {});
    const csv = [headers.join(";"), ...linhas.map(r => headers.map(h => `"${r[h]}"`).join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `numeracao-peito-${eventoAtual.nome.replace(/\s+/g, "_")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportarPDF = () => {
    const dataEmissao = new Date().toLocaleString("pt-BR");
    let equipeAtualPdf = "";
    const linhas = atletasOrdenados.map(a => {
      const eqNome = getEquipeNome(a) === "ZZZ_SEM_EQUIPE" ? "—" : getEquipeNome(a);
      const cat = getCategoria(a.anoNasc, anoComp);
      const peito = editNum[a.id] ?? numMap[a.id] ?? "";
      const provas = inscsEvt.filter(i => i.atletaId === a.id && !i.combinadaId).map(i => {
        const p = todasAsProvas().find(pp => pp.id === i.provaId);
        return p?.nome || i.provaId;
      }).join(", ");
      const novaEquipe = eqNome !== equipeAtualPdf;
      equipeAtualPdf = eqNome;
      const separador = novaEquipe ? `
        <tr><td colspan="7" style="background:#1b5e20;color:#fff;padding:6px 12px;font-weight:700;font-size:11px;letter-spacing:1px;">🏟️ ${eqNome}</td></tr>` : "";
      return `${separador}
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;font-weight:900;font-size:15px;color:#e67e00;">${peito || "—"}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:11px;color:#555;">${_getCbat(a) || "—"}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:600;">${a.nome || "—"}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;"><span style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:3px;padding:1px 6px;font-size:10px;">${cat?.nome || "—"}</span></td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:11px;">${eqNome}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;font-size:11px;">${a.sexo === "M" ? "M" : "F"}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:10px;color:#777;">${provas}</td>
        </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Numeração de Peito — ${eventoAtual.nome}</title>
  <style>
    @media print { .no-print{display:none!important;} body{margin:0;} }
    body{font-family:Arial,sans-serif;color:#111;background:#fff;margin:0;padding:24px;font-size:13px;}
    table{width:100%;border-collapse:collapse;}
    thead th{background:#1b5e20;color:#fff;padding:8px 10px;text-align:left;font-size:10px;letter-spacing:1px;text-transform:uppercase;}
    tr:nth-child(even){background:#fafafa;}
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:20px;">
    <button onclick="window.print()" style="background:#1b5e20;color:#fff;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-size:14px;margin-right:10px;">🖨️ Imprimir / Salvar PDF</button>
    <button onclick="window.close()" style="background:#eee;border:1px solid #ccc;padding:10px 18px;border-radius:6px;cursor:pointer;">✕ Fechar</button>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;padding-bottom:12px;border-bottom:2px solid #1b5e20;flex-wrap:wrap;gap:10px;">
    <div>
      <div style="font-size:9px;font-weight:700;color:#1b5e20;letter-spacing:2px;text-transform:uppercase;margin-bottom:3px;">NUMERAÇÃO DE PEITO</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:2px;">${eventoAtual.nome}</div>
      <div style="font-size:11px;color:#555;">
        ${eventoAtual.data ? new Date(eventoAtual.data + "T12:00:00").toLocaleDateString("pt-BR", {weekday:"long",day:"2-digit",month:"long",year:"numeric"}) : ""}
        ${eventoAtual.cidade ? ` · ${eventoAtual.cidade}${eventoAtual.estado ? `/${eventoAtual.estado}` : ""}` : ""}
      </div>
    </div>
    <div style="text-align:right;font-size:10px;color:#888;">
      <div>${atletasOrdenados.length} atleta(s)</div>
      <div>Emitido em ${dataEmissao}</div>
    </div>
  </div>
  <table>
    <thead><tr>
      <th style="width:60px;text-align:center;">Nº Peito</th>
      <th style="width:80px;">CBAt</th>
      <th>Atleta</th>
      <th style="width:100px;">Categoria</th>
      <th>Equipe</th>
      <th style="width:40px;text-align:center;">Sexo</th>
      <th>Provas</th>
    </tr></thead>
    <tbody>${linhas}</tbody>
  </table>
  <div style="margin-top:22px;padding-top:10px;border-top:1px solid #ddd;font-size:10px;color:#aaa;text-align:center;">
    GerenTrack · Sistema de Gestão de Competições de Atletismo · ${dataEmissao}
  </div>
</body>
</html>`;
    const w = window.open("", "_blank", "width=1000,height=780");
    if (w) { w.document.write(html); w.document.close(); }
  };

  let equipeAtual = "";

  return (
    <div style={s.page}>
      {/* Scanner de teste QR */}
      <QrScanner
        aberto={testeQrAberto}
        onScan={handleTesteQrScan}
        onFechar={() => setTesteQrAberto(false)}
      />

      {/* Modal preview QR */}
      {testeQrPreview && !testeQrAberto && (
        <div style={{ position: "fixed", inset: 0, background: t.bgOverlay, zIndex: 8000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "28px 32px", maxWidth: 420, width: "100%", textAlign: "center" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 20, color: t.textPrimary, marginBottom: 4 }}>
              🔍 Preview QR Code
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 20 }}>
              Atleta: #{testeQrPreview.peito} {testeQrPreview.atleta}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 20 }}>
              <div>
                <img src={testeQrPreview.qrPub} alt="QR Público" style={{ width: 140, height: 140, borderRadius: 8, border: `1px solid ${t.border}` }} />
                <div style={{ fontSize: 11, color: t.textDimmed, marginTop: 6 }}>QR Público</div>
                <div style={{ fontSize: 9, color: t.textDisabled }}>Resultados</div>
              </div>
              <div>
                <img src={testeQrPreview.qrSec} alt="QR Staff" style={{ width: 140, height: 140, borderRadius: 8, border: `1px solid ${t.border}` }} />
                <div style={{ fontSize: 11, color: t.textDimmed, marginTop: 6 }}>QR Staff</div>
                <div style={{ fontSize: 9, color: t.textDisabled }}>Secretaria</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16, lineHeight: 1.6 }}>
              Escaneie os QR codes acima com a câmera para verificar se são legíveis antes de imprimir.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={() => { setTesteQrPreview(null); setTesteQrAberto(true); }}
                style={{ background: t.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                📷 Abrir Scanner para Testar
              </button>
              <button onClick={() => setTesteQrPreview(null)}
                style={{ background: "transparent", color: t.textMuted, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 14 }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>🔢 Numeração de Peito</h1>
          <div style={{ color: t.textDimmed, fontSize: 13 }}>{eventoAtual.nome} — {atletasEvt.length} atletas</div>
        </div>
        <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar</button>
      </div>

      {feedback && (
        <div style={{ background: t.bgCardAlt, border: `1px solid ${feedback.includes("❌") ? `${t.danger}44` : `${t.success}44`}`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: feedback.includes("❌") ? t.danger : t.success, fontSize: 13 }}>
          {feedback}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <button style={s.btnPrimary} onClick={numerarAuto}>🔢 Numerar Automaticamente</button>
        <button style={s.btnSecondary} onClick={salvar}>💾 Salvar Numeração</button>
        <button style={s.btnSecondary} onClick={exportarCsv}>📥 Exportar CSV</button>
        <button style={s.btnSecondary} onClick={exportarPDF}>📄 Exportar PDF</button>
        <button style={s.btnSecondary} onClick={exportarComQr} disabled={gerandoQr}>
          {gerandoQr ? `⏳ ${qrProgresso || "Gerando..."}` : "📱 Exportar com QR"}
        </button>
        <button style={s.btnSecondary} onClick={gerarPreviewQr} disabled={gerandoQr}>🔍 Testar QR</button>
        <button style={s.btnGhost} onClick={limparTudo}>🗑️ Limpar</button>
        <div style={{ flex: 1 }} />
        <input style={{ ...s.input, maxWidth: 250 }} placeholder="🔍 Filtrar atleta ou equipe..." value={filtro} onChange={e => setFiltro(e.target.value)} />
      </div>

      <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 12 }}>
        💡 Numeração automática: agrupa por equipe e ordena por nome alfabeticamente.
      </div>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead><tr><Th>Nº Peito</Th><Th>CBAt</Th><Th>Atleta</Th><Th>Categoria</Th><Th>Equipe</Th><Th>Sexo</Th><Th>Provas</Th></tr></thead>
          <tbody>
            {atletasFiltrados.map(a => {
              const eqNome = getEquipeNome(a) === "ZZZ_SEM_EQUIPE" ? "—" : getEquipeNome(a);
              const novaEquipe = eqNome !== equipeAtual;
              equipeAtual = eqNome;
              const cat = getCategoria(a.anoNasc, anoComp);
              const provas = inscsEvt.filter(i => i.atletaId === a.id && !i.combinadaId).map(i => {
                const p = todasAsProvas().find(pp => pp.id === i.provaId);
                return p?.nome || i.provaId;
              }).join(", ");
              return [
                  novaEquipe && <tr key={"eq_"+a.id}><td colSpan={7} style={{ background: t.bgCardAlt, padding: "6px 12px", fontWeight: 700, color: t.accent, fontSize: 12, borderTop: `2px solid ${t.accentBorder}` }}>🏟️ {eqNome}</td></tr>,
                  <tr key={`num_${a.id}`} style={{ ...s.tr, background: erroNum[a.id] ? t.bgCardAlt : undefined }}>
                    <td style={{ ...s.td, width: 80 }}>
                      <input type="number" min={1} value={editNum[a.id] ?? ""} onChange={e => handleChangeNum(a.id, e.target.value)}
                        style={{ ...s.input, width: 65, textAlign: "center", padding: "4px 6px", fontSize: 14, fontWeight: 700, borderColor: erroNum[a.id] ? t.danger : undefined }} />
                      {erroNum[a.id] && <div style={{ color: t.danger, fontSize: 9, marginTop: 2 }}>{erroNum[a.id]}</div>}
                    </td>
                    <td style={{ ...s.td, fontSize: 12, color: t.textMuted, fontFamily: "'Barlow Condensed', sans-serif" }}>{_getCbat(a) || "—"}</td>
                    <td style={{ ...s.td, fontWeight: 600, color: t.textPrimary }}>{a.nome}</td>
                    <td style={{ ...s.td, fontSize: 12 }}><span style={{ background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{cat?.nome || "—"}</span></td>
                    <td style={s.td}>{eqNome}</td>
                    <td style={{ ...s.td, textAlign: "center" }}>{a.sexo === "M" ? "M" : "F"}</td>
                    <td style={{ ...s.td, fontSize: 11, color: t.textMuted, maxWidth: 300 }}>{provas}</td>
                  </tr>
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export default TelaNumericaPeito;
