import React, { useState, useMemo, useRef } from "react";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { CATEGORIAS, ESTADOS_BR } from "../../shared/constants/categorias";
import { formatarMarca } from "../../shared/formatters/utils";
import { _getCbat } from "../../shared/formatters/utils";
import { criarInscricaoStyles } from "../inscricoes/inscricaoStyles";
import { useTema } from "../../shared/TemaContext";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { GT_DEFAULT_LOGO } from "../../shared/branding";
import QRCode from "qrcode";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";

export default function TelaRanking() {
  const { usuarioLogado } = useAuth();
  const { ranking, setRanking, historicoRanking, setHistoricoRanking, atletas, equipes } = useEvento();
  const { setTela, registrarAcao } = useApp();
  const t = useTema();
  const base = criarInscricaoStyles(t);
  const s = useStylesResponsivos({
    ...base,
    tableWrap: { overflowX: "auto", borderRadius: 12, border: `1px solid ${t.border}` },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { background: t.bgHeaderSolid, padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` },
    td: { padding: "12px 16px", fontSize: 14, color: t.textSecondary, borderBottom: `1px solid ${t.border}` },
    tr: { transition: "background 0.15s" },
  });
  const isAdmin = usuarioLogado?.tipo === "admin";

  const [aba, setAba] = useState("ranking"); // "ranking" | "pendencias" | "manual"
  const [filtroProva, setFiltroProva] = useState("todas");
  const [filtroAno, setFiltroAno] = useState("todos");
  const [filtroCat, setFiltroCat] = useState("todas");
  const [filtroSexo, setFiltroSexo] = useState("todos");
  const [filtroUfAtleta, setFiltroUfAtleta] = useState("todos");
  const [filtroUfEvento, setFiltroUfEvento] = useState("todos");
  const [filtroClube, setFiltroClube] = useState("todos");
  const [pagina, setPagina] = useState(0);
  const POR_PAG = 20;

  // ── Manual insertion state ──
  const [manualForm, setManualForm] = useState({
    provaId: "", marca: "", atletaId: "", atletaNome: "", atletaCbat: "", atletaNasc: "", atletaUf: "", atletaClube: "",
    eventoNome: "", eventoData: "", eventoLocal: "", eventoUf: "", categoriaId: "", sexo: "M", vento: "",
  });

  // ── Listas para filtros ──
  const provasDisponiveis = useMemo(() => {
    const nomes = new Set((ranking || []).filter(r => r.status === "homologado" && r.provaNome).map(r => r.provaNome));
    return [...nomes].sort((a, b) => a.localeCompare(b));
  }, [ranking]);

  const anosDisponiveis = useMemo(() => {
    const anos = new Set((ranking || []).filter(r => r.status === "homologado" && r.eventoData).map(r => r.eventoData.substring(0, 4)));
    return [...anos].sort((a, b) => b - a);
  }, [ranking]);

  const ufsAtletaDisponiveis = useMemo(() => {
    const ufs = new Set((ranking || []).filter(r => r.status === "homologado" && r.atletaUf).map(r => r.atletaUf.toUpperCase()));
    return ESTADOS_BR.filter(uf => ufs.has(uf));
  }, [ranking]);

  const ufsEventoDisponiveis = useMemo(() => {
    const ufs = new Set((ranking || []).filter(r => r.status === "homologado" && r.eventoUf).map(r => r.eventoUf.toUpperCase()));
    return ESTADOS_BR.filter(uf => ufs.has(uf));
  }, [ranking]);

  const clubesDisponiveis = useMemo(() => {
    const clubes = new Set((ranking || []).filter(r => r.status === "homologado" && r.atletaClube).map(r => r.atletaClube));
    return [...clubes].sort((a, b) => a.localeCompare(b));
  }, [ranking]);

  // ── Ranking filtrado e ordenado ──
  const rankingFiltrado = useMemo(() => {
    let lista = (ranking || []).filter(r => r.status === "homologado");

    if (filtroAno !== "todos") lista = lista.filter(r => r.eventoData?.startsWith(filtroAno));
    if (filtroCat !== "todas") lista = lista.filter(r => r.categoriaId === filtroCat);
    if (filtroSexo !== "todos") lista = lista.filter(r => r.sexo === filtroSexo);
    if (filtroProva !== "todas") lista = lista.filter(r => r.provaNome === filtroProva);
    if (filtroUfAtleta !== "todos") lista = lista.filter(r => r.atletaUf?.toUpperCase() === filtroUfAtleta);
    if (filtroUfEvento !== "todos") lista = lista.filter(r => r.eventoUf?.toUpperCase() === filtroUfEvento);

    // Melhor marca por atleta (por prova — agrupa por provaNome)
    const melhor = {};
    lista.forEach(r => {
      const chave = `${r.atletaId}_${r.provaNome}`;
      if (!melhor[chave]) { melhor[chave] = r; return; }
      const isTempo = r.unidade === "s";
      if (isTempo ? r.marcaNum < melhor[chave].marcaNum : r.marcaNum > melhor[chave].marcaNum) {
        melhor[chave] = r;
      }
    });
    lista = Object.values(melhor);

    // Ordenar
    lista.sort((a, b) => {
      if (a.provaNome !== b.provaNome) return a.provaNome.localeCompare(b.provaNome);
      const isTempo = a.unidade === "s";
      return isTempo ? a.marcaNum - b.marcaNum : b.marcaNum - a.marcaNum;
    });

    // Atribuir posição real (por prova) antes de filtrar por clube
    let provaAtual = null;
    let posAtual = 0;
    lista = lista.map(r => {
      if (r.provaNome !== provaAtual) { provaAtual = r.provaNome; posAtual = 0; }
      posAtual++;
      return { ...r, posReal: posAtual };
    });

    // Clube é filtro visual — preserva posição real do ranking
    if (filtroClube !== "todos") lista = lista.filter(r => r.atletaClube === filtroClube);

    return lista;
  }, [ranking, filtroProva, filtroAno, filtroCat, filtroSexo, filtroUfAtleta, filtroUfEvento, filtroClube]);

  const totalPags = Math.ceil(rankingFiltrado.length / POR_PAG) || 1;
  const paginaAtual = rankingFiltrado.slice(pagina * POR_PAG, (pagina + 1) * POR_PAG);

  // ── Pendências ──
  const pendentes = useMemo(() => (ranking || []).filter(r => r.status === "pendente"), [ranking]);
  const pendentesAgrupados = useMemo(() => {
    const grupos = {};
    pendentes.forEach(r => {
      const key = r.eventoId || "manual";
      if (!grupos[key]) grupos[key] = { eventoNome: r.eventoNome || "Manual", entradas: [] };
      grupos[key].entradas.push(r);
    });
    return Object.values(grupos);
  }, [pendentes]);

  // ── Ações de homologação ──
  const homologar = (entrada) => {
    setRanking(prev => prev.map(r => r.id === entrada.id ? { ...r, status: "homologado", resolvidoPor: usuarioLogado?.nome, resolvidoEm: Date.now() } : r));
    setHistoricoRanking(prev => [...prev, { tipo: "homologado", entradaId: entrada.id, atletaNome: entrada.atletaNome, provaNome: entrada.provaNome, marca: entrada.marca, adminNome: usuarioLogado?.nome, data: Date.now() }].slice(-500));
    if (registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Homologou ranking", `${entrada.atletaNome} · ${entrada.provaNome} · ${entrada.marca}`, null, { modulo: "ranking" });
  };

  const rejeitar = (entrada) => {
    setRanking(prev => prev.map(r => r.id === entrada.id ? { ...r, status: "rejeitado", resolvidoPor: usuarioLogado?.nome, resolvidoEm: Date.now() } : r));
    setHistoricoRanking(prev => [...prev, { tipo: "rejeitado", entradaId: entrada.id, atletaNome: entrada.atletaNome, provaNome: entrada.provaNome, marca: entrada.marca, adminNome: usuarioLogado?.nome, data: Date.now() }].slice(-500));
    if (registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Rejeitou ranking", `${entrada.atletaNome} · ${entrada.provaNome} · ${entrada.marca}`, null, { modulo: "ranking" });
  };

  const homologarTodos = (entradas) => {
    const ids = new Set(entradas.map(r => r.id));
    setRanking(prev => prev.map(r => ids.has(r.id) ? { ...r, status: "homologado", resolvidoPor: usuarioLogado?.nome, resolvidoEm: Date.now() } : r));
    setHistoricoRanking(prev => [...prev, ...entradas.map(r => ({ tipo: "homologado", entradaId: r.id, atletaNome: r.atletaNome, provaNome: r.provaNome, marca: r.marca, adminNome: usuarioLogado?.nome, data: Date.now() }))].slice(-500));
    if (registrarAcao) {
      const det = entradas.slice(0, 5).map(r => `${r.atletaNome}: ${r.provaNome} ${r.marca}`).join(", ");
      const extra = entradas.length > 5 ? ` +${entradas.length - 5} mais` : "";
      registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Homologou ranking (lote)", `${entradas.length} entradas: ${det}${extra}`, null, { modulo: "ranking" });
    }
  };

  // ── Inserção manual ──
  const inserirManual = () => {
    const prova = todasAsProvas().find(p => p.id === manualForm.provaId);
    if (!prova) { alert("Selecione uma prova."); return; }
    if (!manualForm.marca) { alert("Informe a marca."); return; }
    const marcaNum = parseFloat(String(manualForm.marca).replace(",", "."));
    if (isNaN(marcaNum)) { alert("Marca inválida."); return; }

    let atl = null;
    if (manualForm.atletaId) {
      atl = atletas.find(a => a.id === manualForm.atletaId);
    }
    const cbat = atl ? _getCbat(atl) : manualForm.atletaCbat || "";
    if (!cbat) { alert("Atleta sem CBAt. Informe o CBAt."); return; }

    const ventoStr = manualForm.vento?.trim() || "";
    const ventoNum = parseFloat(ventoStr.replace(",", "."));
    const provaTemVento = prova.unidade === "s" || /dist[aâ]ncia|triplo/i.test(prova.nome || "");
    const ventoAssistido = provaTemVento && !isNaN(ventoNum) && ventoNum > 2.0;

    const entrada = {
      id: "rnk_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
      eventoId: "",
      eventoNome: manualForm.eventoNome || "Inserção manual",
      eventoData: manualForm.eventoData || "",
      eventoLocal: manualForm.eventoLocal || "",
      eventoUf: manualForm.eventoUf || "",
      provaId: prova.id,
      provaNome: prova.nome,
      unidade: prova.unidade || "s",
      atletaId: atl?.id || "",
      atletaNome: manualForm.atletaNome || atl?.nome || "",
      atletaCbat: manualForm.atletaCbat || cbat,
      atletaNasc: manualForm.atletaNasc || "",
      atletaUf: manualForm.atletaUf || "",
      atletaClube: manualForm.atletaClube || "",
      marca: String(manualForm.marca),
      marcaNum,
      categoriaId: manualForm.categoriaId || "",
      sexo: manualForm.sexo || "M",
      vento: ventoStr,
      ventoAssistido,
      status: "homologado",
      fonte: "manual",
      resolvidoPor: usuarioLogado?.nome,
      resolvidoEm: Date.now(),
      observacao: "",
      criadoEm: Date.now(),
      _chave: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };

    setRanking(prev => [...prev, entrada]);
    if (registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Inseriu ranking manual", `${entrada.atletaNome} · ${entrada.provaNome} · ${entrada.marca}`, null, { modulo: "ranking" });
    setManualForm({ provaId: "", marca: "", atletaId: "", atletaNome: "", atletaCbat: "", atletaNasc: "", atletaUf: "", atletaClube: "", eventoNome: "", eventoData: "", eventoLocal: "", eventoUf: "", categoriaId: "", sexo: "M", vento: "" });
    setBuscaAtleta("");
    alert("Entrada adicionada ao ranking.");
  };

  // ── Busca de atleta para manual ──
  const [buscaAtleta, setBuscaAtleta] = useState("");
  const atletasFiltrados = useMemo(() => {
    if (!buscaAtleta || buscaAtleta.length < 2) return [];
    const f = buscaAtleta.toLowerCase();
    return atletas.filter(a => {
      const cbat = _getCbat(a);
      return cbat && (a.nome?.toLowerCase().includes(f) || cbat.includes(buscaAtleta));
    }).slice(0, 8);
  }, [buscaAtleta, atletas]);

  // ── Importação por planilha ──
  const [importPreview, setImportPreview] = useState(null); // array de entradas parseadas
  const [importErros, setImportErros] = useState([]);
  const [importStatus, setImportStatus] = useState(""); // "" | "carregando" | "pronto" | "importado"
  const fileInputRef = useRef(null);

  const carregarXLSX = async () => {
    let XL = typeof window !== "undefined" && window.XLSX ? window.XLSX : null;
    if (!XL) {
      try { XL = await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs"); } catch {
        try {
          await new Promise((res, rej) => {
            const sc = document.createElement("script");
            sc.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
            sc.onload = res; sc.onerror = rej;
            document.head.appendChild(sc);
          });
          XL = window.XLSX;
        } catch { return null; }
      }
    }
    return XL;
  };

  const normalizarNomeProva = (nome) => {
    if (!nome) return "";
    return String(nome).trim()
      .replace(/\s+/g, " ")
      .replace(/metros/gi, "m")
      .replace(/^(\d+)m\s+rasos$/i, "$1m Rasos")
      .replace(/c\/\s*/g, "c/ ")
      .replace(/c\.\s*/g, "c/ ");
  };

  const encontrarProva = (nomeRaw, sexo) => {
    const nome = normalizarNomeProva(nomeRaw);
    if (!nome) return null;
    const todas = todasAsProvas();
    const nomeLower = nome.toLowerCase();
    // Match exato por nome
    let match = todas.find(p => p.nome.toLowerCase() === nomeLower && p.id.startsWith(sexo === "F" ? "F_" : "M_"));
    if (match) return match;
    // Match sem sexo
    match = todas.find(p => p.nome.toLowerCase() === nomeLower);
    if (match) return match;
    // Match parcial
    match = todas.find(p => nomeLower.includes(p.nome.toLowerCase()) && p.id.startsWith(sexo === "F" ? "F_" : "M_"));
    if (!match) match = todas.find(p => nomeLower.includes(p.nome.toLowerCase()));
    return match || null;
  };

  const encontrarCategoria = (nomeRaw) => {
    if (!nomeRaw) return null;
    const nome = String(nomeRaw).trim().toLowerCase().replace(/[-\s]/g, "");
    return CATEGORIAS.find(c => c.id.toLowerCase().replace(/[-\s]/g, "") === nome
      || c.nome.toLowerCase().replace(/[-\s]/g, "") === nome) || null;
  };

  const handleImportFile = async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    setImportStatus("carregando");
    setImportPreview(null);
    setImportErros([]);

    const XL = await carregarXLSX();
    if (!XL) { setImportErros(["Erro ao carregar biblioteca XLSX."]); setImportStatus(""); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XL.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XL.utils.sheet_to_json(ws, { defval: "" });
        if (!rows.length) { setImportErros(["Planilha vazia."]); setImportStatus(""); return; }

        // Mapear colunas (aceitar variações)
        const colMap = (header) => {
          const h = String(header).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (/^prova$/.test(h)) return "prova";
          if (/^marca$|^resultado$|^tempo$|^performance$/.test(h)) return "marca";
          if (/^nome$|^atleta$/.test(h)) return "atletaNome";
          if (/^cbat$|^cba$|^registro$/.test(h)) return "cbat";
          if (/^nasc|^ano.*nasc|^data.*nasc/.test(h)) return "nasc";
          if (/^uf$|^estado$/.test(h)) return "uf";
          if (/^clube$|^equipe$/.test(h)) return "clube";
          if (/^categ/.test(h)) return "categoria";
          if (/^sexo$|^genero$/.test(h)) return "sexo";
          if (/^vento$|^wind$/.test(h)) return "vento";
          if (/^compet|^evento$/.test(h)) return "eventoNome";
          if (/^data$/.test(h)) return "eventoData";
          if (/^local$|^cidade$/.test(h)) return "eventoLocal";
          if (/^uf.*evento$|^uf.*comp/.test(h)) return "eventoUf";
          return null;
        };

        const headers = Object.keys(rows[0]);
        const mapa = {};
        headers.forEach(h => { const k = colMap(h); if (k) mapa[k] = h; });

        if (!mapa.prova) { setImportErros(["Coluna 'Prova' não encontrada na planilha."]); setImportStatus(""); return; }
        if (!mapa.marca) { setImportErros(["Coluna 'Marca' (ou 'Resultado'/'Tempo') não encontrada."]); setImportStatus(""); return; }
        if (!mapa.atletaNome && !mapa.cbat) { setImportErros(["Coluna 'Nome'/'Atleta' ou 'CBAt' não encontrada."]); setImportStatus(""); return; }

        const entradas = [];
        const erros = [];

        rows.forEach((row, idx) => {
          const linha = idx + 2; // +2 = header + 0-index
          const provaNome = String(row[mapa.prova] || "").trim();
          const marcaRaw = String(row[mapa.marca] || "").trim();
          const nome = mapa.atletaNome ? String(row[mapa.atletaNome] || "").trim() : "";
          const cbatRaw = mapa.cbat ? String(row[mapa.cbat] || "").trim() : "";
          const sexoRaw = mapa.sexo ? String(row[mapa.sexo] || "").trim().toUpperCase() : "";
          const sexo = sexoRaw === "F" || sexoRaw === "FEM" || sexoRaw === "FEMININO" ? "F" : "M";
          const catRaw = mapa.categoria ? String(row[mapa.categoria] || "").trim() : "";
          const ventoRaw = mapa.vento ? String(row[mapa.vento] || "").trim() : "";
          const nascRaw = mapa.nasc ? String(row[mapa.nasc] || "").trim() : "";
          const ufRaw = mapa.uf ? String(row[mapa.uf] || "").trim() : "";
          const clubeRaw = mapa.clube ? String(row[mapa.clube] || "").trim() : "";
          const evNome = mapa.eventoNome ? String(row[mapa.eventoNome] || "").trim() : "";
          const evDataRaw = mapa.eventoData ? row[mapa.eventoData] : "";
          const evLocal = mapa.eventoLocal ? String(row[mapa.eventoLocal] || "").trim() : "";
          const evUf = mapa.eventoUf ? String(row[mapa.eventoUf] || "").trim() : "";

          if (!provaNome && !marcaRaw && !nome) return; // linha vazia

          const prova = encontrarProva(provaNome, sexo);
          if (!prova) { erros.push(`Linha ${linha}: prova "${provaNome}" não encontrada.`); return; }

          const marcaNum = parseFloat(String(marcaRaw).replace(",", "."));
          if (isNaN(marcaNum) || marcaNum <= 0) { erros.push(`Linha ${linha}: marca "${marcaRaw}" inválida.`); return; }

          // Tentar encontrar atleta pelo CBAt
          const cbat = cbatRaw.replace(/\D/g, "");
          let atl = null;
          if (cbat) atl = atletas.find(a => _getCbat(a) === cbat);
          if (!atl && nome) atl = atletas.find(a => a.nome?.toLowerCase() === nome.toLowerCase() && _getCbat(a));

          const atletaCbat = atl ? _getCbat(atl) : cbat;
          if (!atletaCbat && !nome) { erros.push(`Linha ${linha}: sem nome nem CBAt.`); return; }

          const cat = encontrarCategoria(catRaw);
          const ventoNum = parseFloat(ventoRaw.replace(",", "."));
          const ventoAssistido = !isNaN(ventoNum) && ventoNum > 2.0;

          // Normalizar data do evento
          let eventoData = "";
          if (evDataRaw) {
            if (typeof evDataRaw === "number") {
              // Serial date do Excel
              const d = new Date((evDataRaw - 25569) * 86400 * 1000);
              eventoData = d.toISOString().substring(0, 10);
            } else {
              const ds = String(evDataRaw).trim();
              // dd/mm/yyyy
              const m = ds.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
              if (m) eventoData = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
              // yyyy-mm-dd
              else if (/^\d{4}-\d{2}-\d{2}/.test(ds)) eventoData = ds.substring(0, 10);
            }
          }

          entradas.push({
            id: "rnk_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6) + "_" + idx,
            eventoId: "",
            eventoNome: evNome || "Importação planilha",
            eventoData,
            eventoLocal: evLocal,
            eventoUf: evUf,
            provaId: prova.id,
            provaNome: prova.nome,
            unidade: prova.unidade || "s",
            atletaId: atl?.id || "",
            atletaNome: nome || atl?.nome || "",
            atletaCbat: atletaCbat,
            atletaNasc: nascRaw || "",
            atletaUf: ufRaw,
            atletaClube: clubeRaw,
            marca: marcaRaw,
            marcaNum,
            categoriaId: cat?.id || "",
            sexo,
            vento: ventoRaw,
            ventoAssistido,
            status: "homologado",
            fonte: "importacao",
            resolvidoPor: usuarioLogado?.nome,
            resolvidoEm: Date.now(),
            observacao: "",
            criadoEm: Date.now(),
            _chave: `import_${Date.now()}_${idx}`,
            _linha: linha,
          });
        });

        setImportPreview(entradas);
        setImportErros(erros);
        setImportStatus(entradas.length > 0 ? "pronto" : "");
      } catch (err) {
        setImportErros(["Erro ao processar planilha: " + err.message]);
        setImportStatus("");
      }
    };
    reader.readAsArrayBuffer(file);
    ev.target.value = "";
  };

  const confirmarImportacao = () => {
    if (!importPreview?.length) return;
    // Remover campo auxiliar _linha
    const entradas = importPreview.map(({ _linha, ...rest }) => rest);
    setRanking(prev => [...prev, ...entradas]);
    if (registrarAcao) {
      const det = entradas.slice(0, 5).map(r => `${r.atletaNome}: ${r.provaNome} ${r.marca}`).join(", ");
      const extra = entradas.length > 5 ? ` +${entradas.length - 5} mais` : "";
      registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Importou ranking (planilha)", `${entradas.length} entradas: ${det}${extra}`, null, { modulo: "ranking" });
    }
    setImportStatus("importado");
    setImportPreview(null);
  };

  // ── Abas ──
  const abas = [
    { id: "ranking", label: "Ranking", badge: null },
    ...(isAdmin ? [
      { id: "pendencias", label: "Pendências", badge: pendentes.length || null },
      { id: "manual", label: "Inserção Manual", badge: null },
      { id: "importar", label: "Importar Planilha", badge: null },
    ] : []),
  ];

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>Ranking</h1>
          <p style={{ color: t.textDimmed, fontSize: 13 }}>Ranking de Atletismo - Oficial</p>
        </div>
        <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {abas.map(ab => (
          <button key={ab.id} onClick={() => { setAba(ab.id); setPagina(0); }}
            style={{
              padding: "8px 18px", borderRadius: 8, cursor: "pointer",
              fontFamily: t.fontTitle, fontSize: 14, fontWeight: 700, letterSpacing: 1,
              background: aba === ab.id ? t.accent : "transparent",
              color: aba === ab.id ? "#fff" : t.textMuted,
              border: `1px solid ${aba === ab.id ? t.accent : t.borderInput}`,
            }}
          >
            {ab.label}
            {ab.badge ? <span style={{ marginLeft: 6, background: t.danger, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>{ab.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* ═══ ABA RANKING ═══ */}
      {aba === "ranking" && (
        <>
          {/* Filtros */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <div>
              <label style={s.label}>Ano</label>
              <select style={{ ...s.select, width: 100 }} value={filtroAno} onChange={ev => { setFiltroAno(ev.target.value); setPagina(0); }}>
                <option value="todos">Todos</option>
                {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Categoria</label>
              <select style={{ ...s.select, width: 130 }} value={filtroCat} onChange={ev => { setFiltroCat(ev.target.value); setPagina(0); }}>
                <option value="todas">Todas</option>
                {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Sexo</label>
              <select style={{ ...s.select, width: 100 }} value={filtroSexo} onChange={ev => { setFiltroSexo(ev.target.value); setPagina(0); }}>
                <option value="todos">Todos</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Prova</label>
              <select style={{ ...s.select, width: 200 }} value={filtroProva} onChange={ev => { setFiltroProva(ev.target.value); setPagina(0); }}>
                <option value="todas">Todas as provas</option>
                {provasDisponiveis.map(nome => <option key={nome} value={nome}>{nome}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>UF Atleta</label>
              <select style={{ ...s.select, width: 90 }} value={filtroUfAtleta} onChange={ev => { setFiltroUfAtleta(ev.target.value); setPagina(0); }}>
                <option value="todos">Todos</option>
                {ufsAtletaDisponiveis.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Clube</label>
              <select style={{ ...s.select, width: 180 }} value={filtroClube} onChange={ev => { setFiltroClube(ev.target.value); setPagina(0); }}>
                <option value="todos">Todos</option>
                {clubesDisponiveis.map(cl => <option key={cl} value={cl}>{cl}</option>)}
              </select>
            </div>
          </div>

          {/* Tabela */}
          {filtroAno === "todos" || filtroCat === "todas" || filtroSexo === "todos" || filtroProva === "todas" ? (
            <div style={s.emptyState}>
              <p>Selecione <strong>Ano</strong>, <strong>Categoria</strong>, <strong>Sexo</strong> e <strong>Prova</strong> para exibir o ranking.</p>
            </div>
          ) : rankingFiltrado.length === 0 ? (
            <div style={s.emptyState}>
              <p>Nenhuma entrada no ranking com os filtros selecionados.</p>
            </div>
          ) : (
            <>
              {(() => {
                const branding = (() => { try { return JSON.parse(localStorage.getItem("gt_branding")) || {}; } catch { return {}; } })();
                const fed = branding.assinaturasFederacao?.[filtroUfAtleta];
                if (!fed?.nome) return null;
                return (
                  <div style={{ textAlign:"center", padding:"14px 20px", marginBottom:16, background:`${t.accent}08`, border:`1px solid ${t.accentBorder}`, borderRadius:10 }}>
                    <div style={{ fontFamily: t.fontTitle, fontWeight:800, fontSize:16, color:t.accent, letterSpacing:1 }}>
                      Ranking Oficial - Homologado pela {fed.nome}
                    </div>
                  </div>
                );
              })()}
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={{ ...s.th, width: 45 }}>POS</th>
                      <th style={{ ...s.th, width: 90 }}>MARCA</th>
                      <th style={{ ...s.th, width: 80 }}>CBAt</th>
                      <th style={s.th}>NOME</th>
                      <th style={{ ...s.th, width: 80 }}>NASC.</th>
                      <th style={{ ...s.th, width: 40 }}>UF</th>
                      <th style={s.th}>CLUBE</th>
                      <th style={s.th}>PROVA</th>
                      <th style={s.th}>LOCAL</th>
                      <th style={{ ...s.th, width: 90 }}>DATA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginaAtual.map((r, idx) => {
                      const pos = r.posReal;
                      const bgPodio = pos === 1 ? "#FFD70018" : pos === 2 ? "#C0C0C018" : pos === 3 ? "#CD7F3218" : null;
                      const corPos = pos === 1 ? "#FFD700" : pos === 2 ? "#C0C0C0" : pos === 3 ? "#CD7F32" : t.accent;
                      const medalha = null;
                      return (
                      <tr key={r.id} style={{ ...s.tr, background: bgPodio || (idx % 2 === 0 ? "transparent" : t.bgHeaderSolid) }}>
                        <td style={{ ...s.td, textAlign: "center", fontWeight: 700, color: corPos }}>{medalha ? <>{medalha} {pos}º</> : `${pos}º`}</td>
                        <td style={{ ...s.td, fontFamily: t.fontTitle, fontWeight: 700, fontSize: 15, color: t.textPrimary }}>
                          {formatarMarca(r.marcaNum, r.unidade)}
                          {r.ventoAssistido && <span style={{ fontSize: 10, color: t.warning, marginLeft: 3 }}>w</span>}
                          {r.vento && !r.ventoAssistido && <span style={{ fontSize: 9, color: t.textDisabled, marginLeft: 3 }}>({r.vento})</span>}
                        </td>
                        <td style={{ ...s.td, fontSize: 12, color: t.textMuted }}>{r.atletaCbat}</td>
                        <td style={{ ...s.td, fontWeight: 600 }}>{r.atletaNome}</td>
                        <td style={{ ...s.td, fontSize: 12, color: t.textMuted }}>{r.atletaNasc?.substring(0, 4) || "—"}</td>
                        <td style={{ ...s.td, fontSize: 12, textAlign: "center" }}>{r.atletaUf || "—"}</td>
                        <td style={{ ...s.td, fontSize: 12 }}>{r.atletaClube || "—"}</td>
                        <td style={{ ...s.td, fontSize: 12 }}>{r.provaNome}</td>
                        <td style={{ ...s.td, fontSize: 12, color: t.textMuted }}>{r.eventoLocal || "—"}</td>
                        <td style={{ ...s.td, fontSize: 12, color: t.textMuted }}>{r.eventoData ? new Date(r.eventoData + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPags > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                  <button disabled={pagina === 0} onClick={() => setPagina(p => p - 1)} style={{ ...s.btnGhost, opacity: pagina === 0 ? 0.3 : 1 }}>‹ Anterior</button>
                  <span style={{ color: t.textDimmed, fontSize: 13, padding: "8px 12px" }}>Página {pagina + 1} de {totalPags}</span>
                  <button disabled={pagina >= totalPags - 1} onClick={() => setPagina(p => p + 1)} style={{ ...s.btnGhost, opacity: pagina >= totalPags - 1 ? 0.3 : 1 }}>Próximo ›</button>
                </div>
              )}

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop: 12, flexWrap:"wrap", gap:8 }}>
                <div style={{ color: t.textDisabled, fontSize: 11 }}>{rankingFiltrado.length} entrada(s) · melhor marca por atleta</div>
                {(() => {
                  const branding = (() => { try { return JSON.parse(localStorage.getItem("gt_branding")) || {}; } catch { return {}; } })();
                  const fed = branding.assinaturasFederacao?.[filtroUfAtleta];
                  if (!fed?.nome) return null;
                  const nomeUfCompleto = { AC:"Acre",AL:"Alagoas",AP:"Amapá",AM:"Amazonas",BA:"Bahia",CE:"Ceará",DF:"Distrito Federal",ES:"Espírito Santo",GO:"Goiás",MA:"Maranhão",MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",PA:"Pará",PB:"Paraíba",PR:"Paraná",PE:"Pernambuco",PI:"Piauí",RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",RS:"Rio Grande do Sul",RO:"Rondônia",RR:"Roraima",SC:"Santa Catarina",SP:"São Paulo",SE:"Sergipe",TO:"Tocantins" }[filtroUfAtleta] || filtroUfAtleta;
                  return (
                    <button style={{ padding:"6px 14px", borderRadius:6, border:`1px solid ${t.accentBorder}`, background:t.accentBg, color:t.accent, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily: t.fontTitle, letterSpacing:1 }}
                      onClick={async () => {
                        const gtLogo = branding.logo || GT_DEFAULT_LOGO;
                        const logoFed = fed.logo || "";
                        const qrUrl = "https://gerentrack.com.br/ranking";
                        let qrDataUrl = "";
                        try { qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 200, margin: 1, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } }); } catch {};
                        const catNome = CATEGORIAS.find(c => c.id === filtroCat)?.nome || filtroCat;
                        const sexoLabel = filtroSexo === "M" ? "Masculino" : "Feminino";
                        const linhas = rankingFiltrado.map((r, idx) => {
                          const pos = r.posReal;
                          const medal = "";
                          return `<tr style="border-bottom:1px solid #ddd;${pos <= 3 ? "background:#fffbe6" : idx % 2 === 0 ? "" : "background:#f8f8f8"}">
                            <td style="padding:5px 8px;text-align:center;font-weight:700;font-size:12px">${medal} ${pos}º</td>
                            <td style="padding:5px 8px;font-weight:700;font-size:13px;font-family:'Montserrat',sans-serif">${formatarMarca(r.marcaNum, r.unidade)}${r.ventoAssistido ? ' <span style="color:#c66;font-size:9px">w</span>' : ""}</td>
                            <td style="padding:5px 8px;font-size:11px;color:#666">${r.atletaCbat || "—"}</td>
                            <td style="padding:5px 8px;font-weight:600;font-size:12px">${r.atletaNome || "—"}</td>
                            <td style="padding:5px 8px;font-size:11px;color:#666">${r.atletaNasc?.substring(0,4) || "—"}</td>
                            <td style="padding:5px 8px;font-size:11px">${r.atletaClube || "—"}</td>
                          </tr>`;
                        }).join("");
                        const cabHtml = `<div style="text-align:center;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #333">
                          <div style="font-family:'Montserrat',sans-serif;font-size:22px;font-weight:900;letter-spacing:2px;color:#111">RANKING ESTADUAL - ${nomeUfCompleto.toUpperCase()}</div>
                          <div style="font-size:12px;color:#555;margin-top:4px">
                            Ano: <strong>${filtroAno}</strong> · Categoria: <strong>${catNome}</strong> · Sexo: <strong>${sexoLabel}</strong> · Prova: <strong>${filtroProva}</strong>
                          </div>
                        </div>`;
                        const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
                          <title>Ranking Estadual - ${nomeUfCompleto}</title>
                          <style>
                            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
                            @page { size: A4 portrait; margin: 12mm 15mm 25mm;
                              @bottom-center { content: "Página " counter(page) " de " counter(pages); font-size:9px; color:#999; font-family:'Inter',sans-serif; }
                            }
                            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                            body { font-family:'Inter',sans-serif; margin:0; padding:20px; color:#111; }
                            table { width:100%; border-collapse:collapse; }
                            thead { display:table-header-group; }
                            thead tr.cab-row td { padding:0; border:none; }
                            th { background:#eee; padding:6px 8px; font-size:10px; font-weight:700; text-align:left; border-bottom:2px solid #999; text-transform:uppercase; letter-spacing:0.5px; }
                            .assinatura { page-break-inside:avoid; margin-top:40px; text-align:center; }
                            .rodape-gt { margin-top:20px; text-align:center; font-size:9px; color:#999; border-top:1px solid #ddd; padding-top:8px; }
                          </style>
                        </head><body>
                          <table>
                            <thead>
                              <tr class="cab-row"><td colspan="6">${cabHtml}</td></tr>
                              <tr>
                                <th style="width:50px;text-align:center">POS</th>
                                <th style="width:80px">MARCA</th>
                                <th style="width:70px">CBAt</th>
                                <th>NOME</th>
                                <th style="width:50px">NASC</th>
                                <th>CLUBE</th>
                              </tr>
                            </thead>
                            <tbody>${linhas}</tbody>
                          </table>
                          <div class="assinatura">
                            ${logoFed ? `<img src="${logoFed}" alt="Federação" style="max-height:120px;max-width:400px;object-fit:contain;margin-bottom:-20px;display:block;margin-left:auto;margin-right:auto"/>` : ""}
                            <div style="width:280px;border-top:1px solid #333;margin:0 auto;padding-top:6px;font-size:12px;font-weight:700">${fed.nome}</div>
                          </div>
                          <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-top:20px;padding:12px 16px;background:#f8f8f8;border:1px solid #ddd;border-radius:6px">
                            ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR" style="width:70px;height:70px;flex-shrink:0"/>` : ""}
                            <div style="text-align:left;font-size:11px;color:#444;line-height:1.6">
                              <div style="font-weight:700;font-size:12px;color:#111">Consulte o ranking atualizado</div>
                              <div>gerentrack.com.br/ranking</div>
                            </div>
                          </div>
                          <div class="rodape-gt">
                            <div>Gerado em: ${new Date().toLocaleString("pt-BR")}</div>
                            <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:4px">
                              <span>Plataforma de Competições -</span>
                              <img src="${gtLogo}" alt="GERENTRACK" style="max-height:8mm;object-fit:contain;opacity:0.7"/>
                            </div>
                          </div>
                        </body></html>`;
                        const win = window.open("", "_blank", "width=900,height=700");
                        if (!win) { alert("Permita pop-ups para imprimir."); return; }
                        win.document.open(); win.document.write(html); win.document.close();
                      }}>
                      Imprimir Ranking Oficial
                    </button>
                  );
                })()}
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ ABA PENDÊNCIAS ═══ */}
      {aba === "pendencias" && isAdmin && (
        <>
          {pendentesAgrupados.length === 0 ? (
            <div style={s.emptyState}>
              <span style={{ fontSize: 48 }}>✓</span>
              <p>Nenhuma pendência de ranking.</p>
            </div>
          ) : (
            pendentesAgrupados.map((grupo, gi) => (
              <div key={gi} style={{ ...s.formCard, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ ...s.sectionTitle, margin: 0 }}>{grupo.eventoNome}</h3>
                  <button style={{ ...s.btnPrimary, fontSize: 12, padding: "6px 14px" }} onClick={() => homologarTodos(grupo.entradas)}>
                    ✓ Homologar Todos ({grupo.entradas.length})
                  </button>
                </div>
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>ATLETA</th>
                        <th style={s.th}>CBAt</th>
                        <th style={s.th}>PROVA</th>
                        <th style={s.th}>MARCA</th>
                        <th style={s.th}>CAT.</th>
                        <th style={{ ...s.th, width: 40 }}>SX</th>
                        <th style={{ ...s.th, width: 150 }}>AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.entradas.map((r, ri) => (
                        <tr key={r.id} style={{ ...s.tr, background: ri % 2 === 0 ? "transparent" : t.bgHeaderSolid }}>
                          <td style={{ ...s.td, fontWeight: 600 }}>{r.atletaNome}</td>
                          <td style={{ ...s.td, fontSize: 12 }}>{r.atletaCbat}</td>
                          <td style={{ ...s.td, fontSize: 12 }}>{r.provaNome}</td>
                          <td style={{ ...s.td, fontWeight: 700, color: t.accent }}>
                            {formatarMarca(r.marcaNum, r.unidade)}
                            {r.ventoAssistido && <span style={{ fontSize: 10, color: t.warning, marginLeft: 3 }}>w</span>}
                          </td>
                          <td style={{ ...s.td, fontSize: 12 }}>{CATEGORIAS.find(c => c.id === r.categoriaId)?.nome || r.categoriaId}</td>
                          <td style={{ ...s.td, fontSize: 12, textAlign: "center" }}>{r.sexo}</td>
                          <td style={s.td}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button style={{ ...s.btnIconSm, color: t.success, borderColor: t.success + "44" }} onClick={() => homologar(r)}>✓</button>
                              <button style={{ ...s.btnIconSmDanger }} onClick={() => rejeitar(r)}></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ═══ ABA INSERÇÃO MANUAL ═══ */}
      {aba === "manual" && isAdmin && (
        <div style={{ ...s.formCard, maxWidth: 640 }}>
          <h3 style={{ ...s.sectionTitle, marginBottom: 16 }}>Inserção Manual</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={s.label}>Prova *</label>
              <select style={s.select} value={manualForm.provaId} onChange={ev => setManualForm(prev => ({ ...prev, provaId: ev.target.value }))}>
                <option value="">Selecione...</option>
                {todasAsProvas().filter(p => p.tipo !== "revezamento").map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Marca *</label>
              <input style={s.input} value={manualForm.marca} onChange={ev => setManualForm(prev => ({ ...prev, marca: ev.target.value }))} placeholder="Ex: 10.45 ou 7.30" />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Atleta (buscar por nome ou CBAt) *</label>
            <input style={s.input} value={buscaAtleta} onChange={ev => { setBuscaAtleta(ev.target.value); setManualForm(prev => ({ ...prev, atletaId: "" })); }} placeholder="Digite nome ou CBAt..." />
            {manualForm.atletaId && (
              <div style={{ fontSize: 12, color: t.success, marginTop: 4 }}>✓ {atletas.find(a => a.id === manualForm.atletaId)?.nome} — CBAt: {_getCbat(atletas.find(a => a.id === manualForm.atletaId))}</div>
            )}
            {!manualForm.atletaId && atletasFiltrados.length > 0 && (
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, marginTop: 4, maxHeight: 200, overflow: "auto" }}>
                {atletasFiltrados.map(a => (
                  <button key={a.id} type="button" onClick={() => { setManualForm(prev => ({ ...prev, atletaId: a.id })); setBuscaAtleta(a.nome); }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "transparent", border: "none", borderBottom: `1px solid ${t.border}`, color: t.textPrimary, cursor: "pointer", fontSize: 13 }}>
                    <strong>{a.nome}</strong> <span style={{ color: t.textMuted }}>— CBAt: {_getCbat(a)}</span>
                  </button>
                ))}
              </div>
            )}
            {!manualForm.atletaId && buscaAtleta.length >= 2 && atletasFiltrados.length === 0 && (
              <div style={{ background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: t.warning, marginBottom: 8 }}>Atleta não encontrado no sistema. Preencha manualmente:</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ ...s.label, fontSize: 10 }}>Nome *</label>
                    <input style={s.input} value={manualForm.atletaNome} onChange={ev => setManualForm(prev => ({ ...prev, atletaNome: ev.target.value }))} placeholder="Nome completo" />
                  </div>
                  <div>
                    <label style={{ ...s.label, fontSize: 10 }}>CBAt *</label>
                    <input style={s.input} value={manualForm.atletaCbat} onChange={ev => setManualForm(prev => ({ ...prev, atletaCbat: ev.target.value }))} placeholder="Nº CBAt" />
                  </div>
                  <div>
                    <label style={{ ...s.label, fontSize: 10 }}>Clube</label>
                    <input style={s.input} value={manualForm.atletaClube} onChange={ev => setManualForm(prev => ({ ...prev, atletaClube: ev.target.value }))} placeholder="Clube/Equipe" />
                  </div>
                  <div>
                    <label style={{ ...s.label, fontSize: 10 }}>UF</label>
                    <input style={s.input} value={manualForm.atletaUf} onChange={ev => setManualForm(prev => ({ ...prev, atletaUf: ev.target.value }))} placeholder="SP" maxLength={2} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={s.label}>Categoria</label>
              <select style={s.select} value={manualForm.categoriaId} onChange={ev => setManualForm(prev => ({ ...prev, categoriaId: ev.target.value }))}>
                <option value="">—</option>
                {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Sexo</label>
              <select style={s.select} value={manualForm.sexo} onChange={ev => setManualForm(prev => ({ ...prev, sexo: ev.target.value }))}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Vento</label>
              <input style={s.input} value={manualForm.vento} onChange={ev => setManualForm(prev => ({ ...prev, vento: ev.target.value }))} placeholder="+1.2" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={s.label}>Competição</label>
              <input style={s.input} value={manualForm.eventoNome} onChange={ev => setManualForm(prev => ({ ...prev, eventoNome: ev.target.value }))} placeholder="Nome da competição" />
            </div>
            <div>
              <label style={s.label}>Data</label>
              <input style={s.input} type="date" value={manualForm.eventoData} onChange={ev => setManualForm(prev => ({ ...prev, eventoData: ev.target.value }))} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={s.label}>Local</label>
              <input style={s.input} value={manualForm.eventoLocal} onChange={ev => setManualForm(prev => ({ ...prev, eventoLocal: ev.target.value }))} placeholder="Cidade - UF" />
            </div>
            <div>
              <label style={s.label}>UF</label>
              <input style={s.input} value={manualForm.eventoUf} onChange={ev => setManualForm(prev => ({ ...prev, eventoUf: ev.target.value }))} placeholder="SP" maxLength={2} />
            </div>
          </div>

          <button style={s.btnPrimary} onClick={inserirManual}>+ Inserir no Ranking</button>
        </div>
      )}

      {/* ═══ ABA IMPORTAR PLANILHA ═══ */}
      {aba === "importar" && isAdmin && (
        <div style={{ ...s.formCard, maxWidth: 900 }}>
          <h3 style={{ ...s.sectionTitle, marginBottom: 8 }}>Importar Ranking via Planilha</h3>
          <p style={{ color: t.textDimmed, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
            Envie um arquivo <strong>.xlsx</strong> com as colunas abaixo. As entradas serão importadas como <strong>homologadas</strong>.
          </p>

          {/* Colunas esperadas */}
          <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, letterSpacing: 1, marginBottom: 8 }}>COLUNAS DA PLANILHA</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                { nome: "Prova", req: true }, { nome: "Marca", req: true }, { nome: "Nome", req: true },
                { nome: "CBAt", req: false }, { nome: "Sexo", req: false }, { nome: "Categoria", req: false },
                { nome: "Nascimento", req: false }, { nome: "UF", req: false }, { nome: "Clube", req: false },
                { nome: "Vento", req: false }, { nome: "Competição", req: false }, { nome: "Data", req: false },
                { nome: "Local", req: false }, { nome: "Local", req: false },
              ].map(col => (
                <span key={col.nome} style={{
                  background: col.req ? `${t.accent}18` : t.bgInput,
                  border: `1px solid ${col.req ? t.accent + "44" : t.borderInput}`,
                  color: col.req ? t.accent : t.textMuted,
                  borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600,
                }}>
                  {col.nome}{col.req ? " *" : ""}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 11, color: t.textDisabled, marginTop: 8 }}>
              * Obrigatórias. Sexo padrão = M se não informado. Nomes de prova devem corresponder ao cadastro do sistema (ex: "100m Rasos", "Salto em Distância").
            </div>
          </div>

          {/* Upload */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportFile} style={{ display: "none" }} />
            <button style={s.btnPrimary} onClick={() => { fileInputRef.current?.click(); setImportStatus(""); setImportPreview(null); setImportErros([]); }}>
              Selecionar Planilha
            </button>
            {importStatus === "carregando" && <span style={{ color: t.textMuted, fontSize: 13 }}>Processando...</span>}
            {importStatus === "importado" && <span style={{ color: t.success, fontSize: 13, fontWeight: 700 }}>✓ Importação concluída!</span>}
          </div>

          {/* Erros */}
          {importErros.length > 0 && (
            <div style={{ background: `${t.danger}10`, border: `1px solid ${t.danger}44`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, maxHeight: 200, overflowY: "auto" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.danger, marginBottom: 6 }}>
                {importPreview?.length ? `${importErros.length} linha(s) com erro (ignoradas):` : "Erros:"}
              </div>
              {importErros.map((err, i) => (
                <div key={i} style={{ fontSize: 12, color: t.danger, padding: "2px 0" }}>{err}</div>
              ))}
            </div>
          )}

          {/* Preview */}
          {importPreview && importPreview.length > 0 && importStatus === "pronto" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary }}>
                  {importPreview.length} entrada(s) prontas para importar
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={s.btnGhost} onClick={() => { setImportPreview(null); setImportStatus(""); setImportErros([]); }}>
                    Cancelar
                  </button>
                  <button style={s.btnPrimary} onClick={confirmarImportacao}>
                    ✓ Confirmar Importação ({importPreview.length})
                  </button>
                </div>
              </div>

              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={{ ...s.th, width: 45 }}>LN</th>
                      <th style={s.th}>ATLETA</th>
                      <th style={{ ...s.th, width: 70 }}>CBAt</th>
                      <th style={s.th}>PROVA</th>
                      <th style={{ ...s.th, width: 90 }}>MARCA</th>
                      <th style={{ ...s.th, width: 40 }}>SX</th>
                      <th style={{ ...s.th, width: 90 }}>CAT.</th>
                      <th style={s.th}>COMPETIÇÃO</th>
                      <th style={{ ...s.th, width: 90 }}>DATA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.slice(0, 50).map((r, idx) => (
                      <tr key={idx} style={{ ...s.tr, background: idx % 2 === 0 ? "transparent" : t.bgHeaderSolid }}>
                        <td style={{ ...s.td, fontSize: 11, color: t.textDisabled, textAlign: "center" }}>{r._linha}</td>
                        <td style={{ ...s.td, fontWeight: 600, fontSize: 13 }}>
                          {r.atletaNome}
                          {r.atletaId && <span style={{ fontSize: 10, color: t.success, marginLeft: 4 }}>✓</span>}
                        </td>
                        <td style={{ ...s.td, fontSize: 12, color: t.textMuted }}>{r.atletaCbat || "—"}</td>
                        <td style={{ ...s.td, fontSize: 12 }}>{r.provaNome}</td>
                        <td style={{ ...s.td, fontWeight: 700, color: t.accent, fontFamily: t.fontTitle }}>
                          {formatarMarca(r.marcaNum, r.unidade)}
                          {r.ventoAssistido && <span style={{ fontSize: 10, color: t.warning, marginLeft: 3 }}>w</span>}
                        </td>
                        <td style={{ ...s.td, fontSize: 12, textAlign: "center" }}>{r.sexo}</td>
                        <td style={{ ...s.td, fontSize: 12 }}>{CATEGORIAS.find(c => c.id === r.categoriaId)?.nome || "—"}</td>
                        <td style={{ ...s.td, fontSize: 12, color: t.textMuted }}>{r.eventoNome || "—"}</td>
                        <td style={{ ...s.td, fontSize: 12, color: t.textMuted }}>{r.eventoData ? new Date(r.eventoData + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importPreview.length > 50 && (
                <div style={{ color: t.textDisabled, fontSize: 11, marginTop: 8, textAlign: "center" }}>
                  Mostrando 50 de {importPreview.length} entradas
                </div>
              )}
            </>
          )}

          {importPreview && importPreview.length === 0 && importStatus === "" && (
            <div style={s.emptyState}>
              <span style={{ fontSize: 16, fontWeight: 700, color: t.warning }}>Atenção</span>
              <p>Nenhuma entrada válida encontrada na planilha.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
