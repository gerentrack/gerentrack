import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { _getCbat } from "../../shared/formatters/utils";
import { getCategoria } from "../../shared/constants/categorias";
import { Th, Td } from "../ui/TableHelpers";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";

const styles = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 20, letterSpacing: 1 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  btnPrimary: { background: "linear-gradient(135deg, #1976D2, #1565C0)", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: "#1976D2", border: "2px solid #1976D2", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost: { background: "transparent", color: "#888", border: "1px solid #2a2d3a", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: "1px solid #1E2130" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#0D0E12", padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1E2130" },
  td: { padding: "12px 16px", fontSize: 14, color: "#bbb", borderBottom: "1px solid #12141a" },
  tr: { transition: "background 0.15s" },
  marca: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: "#1976D2" },
  emptyState: { textAlign: "center", padding: "60px 20px", color: "#444", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },
  painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  painelBtns: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { width: "100%", background: "#141720", borderWidth: 1, borderStyle: "solid", borderColor: "#252837", borderRadius: 8, padding: "10px 14px", color: "#E0E0E0", fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  select: { width: "100%", background: "#141720", borderWidth: 1, borderStyle: "solid", borderColor: "#252837", borderRadius: 8, padding: "10px 14px", color: "#E0E0E0", fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  erro: { background: "#2a1010", border: "1px solid #ff4444", color: "#ff6b6b", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn: { background: "none", border: "none", color: "#1976D2", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", padding: 0 },
  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  badgeGold: { background: "#1976D222", color: "#1976D2", border: "1px solid #1976D244", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  catBanner: { background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 14, color: "#aaa" },
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#1976D2", marginBottom: 16 },
  formCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 16, padding: 32, marginBottom: 20 },
  formTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 8 },
  formSub: { color: "#666", textAlign: "center", fontSize: 14, marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },
  fieldError: { color: "#ff6b6b", fontSize: 12, marginTop: 2 },
  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: "#888", transition: "all 0.2s" },
  radioLabelActive: { background: "#1c1f2e", border: "1px solid #1976D2", color: "#1976D2" },
  sumuCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  btnIconSm: { background: "#141720", border: "1px solid #252837", color: "#888", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: "#1a0a0a", border: "1px solid #3a1a1a", color: "#ff6b6b", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  infoCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: "#1976D2", marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: "1px solid #151820", fontSize: 14, color: "#bbb", display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: "#1976D2", fontWeight: 700 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: "linear-gradient(180deg, #0D1018 0%, transparent 100%)", borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: "#1976D2", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: "#666" },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: "#888", flexWrap: "wrap", borderTop: "1px solid #141820", paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? "#3a0a0a" : status === "hoje_pre" ? "#2a2a0a" : status === "futuro" ? "#0a2a0a" : "#1a1a1a",
    color: status === "ao_vivo" ? "#ff6b6b" : status === "hoje_pre" ? "#1976D2" : status === "futuro" ? "#7acc44" : "#555",
    border: `1px solid ${status === "ao_vivo" ? "#6a2a2a" : status === "hoje_pre" ? "#4a4a0a" : status === "futuro" ? "#2a5a2a" : "#333"}`,
  }),
  permissividadeBox: { background: "#0d1117", border: "1px solid #1976D233", borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 4 },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? "#1a1c22" : "transparent", color: ativo ? "#1976D2" : "#444", border: `1px solid ${ativo ? "#1976D244" : "#1E2130"}` }),
  stepDivider: { flex: 1, height: 1, background: "#1E2130", margin: "0 8px" },
  tagProva: { background: "#1976D222", color: "#1976D2", border: "1px solid #1976D244", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: "#fff", fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  statusControlsCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  modoSwitch: { display: "flex", gap: 0, background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: "#666", padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: "#141720", color: "#1976D2" },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: "#0E1016", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
  savedBadge: { background: "#0a2a0a", border: "1px solid #2a6a2a", color: "#4aaa4a", padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  inputMarca: { background: "#141720", border: "1px solid #252837", borderRadius: 6, padding: "8px 12px", color: "#1976D2", fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
};

function TelaNumericaPeito({ setTela, eventoAtual, inscricoes, atletas, equipes, numeracaoPeito, setNumeracaoPeito, usuarioLogado, registrarAcao }) {
  const s = useStylesResponsivos(styles);
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
    setNumeracaoPeito(prev => ({ ...prev, [eid]: limpo }));
    if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, "Numeração de peito", `${Object.keys(limpo).length} atletas — ${eventoAtual.nome}`, usuarioLogado?.organizadorId || usuarioLogado?.id, { modulo: "numeracao" });
    setFeedback("✅ Numeração salva com sucesso!");
    setTimeout(() => setFeedback(""), 3000);
  };

  const limparTudo = async () => { 
    if (!await confirmar("Limpar toda a numeração desta competição?")) return;
    setEditNum({ });
    setErroNum({});
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
      "Provas": inscsEvt.filter(i => i.atletaId === a.id && !i.origemCombinada).map(i => {
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
      const provas = inscsEvt.filter(i => i.atletaId === a.id && !i.origemCombinada).map(i => {
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
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>🔢 Numeração de Peito</h1>
          <div style={{ color: "#666", fontSize: 13 }}>{eventoAtual.nome} — {atletasEvt.length} atletas</div>
        </div>
        <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar</button>
      </div>

      {feedback && (
        <div style={{ background: feedback.includes("❌") ? "#1a0a0a" : "#0a1a0a", border: `1px solid ${feedback.includes("❌") ? "#8a2a2a" : "#2a8a2a"}`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: feedback.includes("❌") ? "#ff6b6b" : "#4cff4c", fontSize: 13 }}>
          {feedback}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <button style={s.btnPrimary} onClick={numerarAuto}>🔢 Numerar Automaticamente</button>
        <button style={s.btnSecondary} onClick={salvar}>💾 Salvar Numeração</button>
        <button style={s.btnSecondary} onClick={exportarCsv}>📥 Exportar CSV</button>
        <button style={s.btnSecondary} onClick={exportarPDF}>📄 Exportar PDF</button>
        <button style={s.btnGhost} onClick={limparTudo}>🗑️ Limpar</button>
        <div style={{ flex: 1 }} />
        <input style={{ ...s.input, maxWidth: 250 }} placeholder="🔍 Filtrar atleta ou equipe..." value={filtro} onChange={e => setFiltro(e.target.value)} />
      </div>

      <div style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>
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
              const provas = inscsEvt.filter(i => i.atletaId === a.id && !i.origemCombinada).map(i => {
                const p = todasAsProvas().find(pp => pp.id === i.provaId);
                return p?.nome || i.provaId;
              }).join(", ");
              return [
                  novaEquipe && <tr key={"eq_"+a.id}><td colSpan={7} style={{ background: "#0a0b14", padding: "6px 12px", fontWeight: 700, color: "#1976D2", fontSize: 12, borderTop: "2px solid #1976D233" }}>🏟️ {eqNome}</td></tr>,
                  <tr key={`num_${a.id}`} style={{ ...s.tr, background: erroNum[a.id] ? "#1a0a0a" : undefined }}>
                    <td style={{ ...s.td, width: 80 }}>
                      <input type="number" min={1} value={editNum[a.id] ?? ""} onChange={e => handleChangeNum(a.id, e.target.value)}
                        style={{ ...s.input, width: 65, textAlign: "center", padding: "4px 6px", fontSize: 14, fontWeight: 700, borderColor: erroNum[a.id] ? "#ff6b6b" : undefined }} />
                      {erroNum[a.id] && <div style={{ color: "#ff6b6b", fontSize: 9, marginTop: 2 }}>{erroNum[a.id]}</div>}
                    </td>
                    <td style={{ ...s.td, fontSize: 12, color: "#888", fontFamily: "'Barlow Condensed', sans-serif" }}>{_getCbat(a) || "—"}</td>
                    <td style={{ ...s.td, fontWeight: 600, color: "#fff" }}>{a.nome}</td>
                    <td style={{ ...s.td, fontSize: 12 }}><span style={{ background: "#1976D222", color: "#1976D2", border: "1px solid #1976D244", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{cat?.nome || "—"}</span></td>
                    <td style={s.td}>{eqNome}</td>
                    <td style={{ ...s.td, textAlign: "center" }}>{a.sexo === "M" ? "M" : "F"}</td>
                    <td style={{ ...s.td, fontSize: 11, color: "#888", maxWidth: 300 }}>{provas}</td>
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
