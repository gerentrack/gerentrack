import React, { useState } from "react";
import { useConfirm } from "../../features/ui/ConfirmContext";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { CATEGORIAS } from "../../shared/athletics/constants";
import { RecordHelper } from "../../shared/engines/recordHelper";
import { RecordDetectionEngine } from "../../shared/engines/recordDetectionEngine";
import { formatarMarca } from "../../shared/formatters/utils";
import inscricaoStyles from "../inscricoes/inscricaoStyles";

const styles = inscricaoStyles;
function TelaRecordes({ recordes, setRecordes, eventos, atletas, equipes, getClubeAtleta, usuarioLogado, setTela, pendenciasRecorde, setPendenciasRecorde, historicoRecordes, setHistoricoRecordes }) {
  const confirmar = useConfirm();
  const isAdmin = usuarioLogado?.tipo === "admin";
  const [tipoSel, setTipoSel] = useState(null); // id do tipo selecionado
  const [editReg, setEditReg] = useState(null); // registro em edição
  const [importPreview, setImportPreview] = useState(null); // preview de importação
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroSexo, setFiltroSexo] = useState("todos");
  const [novoTipo, setNovoTipo] = useState({ nome: "", sigla: "", escopo: "estado", pais: "Brasil", estado: "", municipio: "" });
  const [showNovoTipo, setShowNovoTipo] = useState(false);
  const [editTipoId, setEditTipoId] = useState(null);
  const [abaRecordes, setAbaRecordes] = useState("registros"); // "registros" | "pendencias" | "historico"

  // Escopos geográficos
  const ESCOPOS = [
    { id: "mundial",   label: "🌍 Mundial",   desc: "Sem restrição geográfica" },
    { id: "pais",      label: "🏳️ País",       desc: "Vinculado a um país" },
    { id: "estado",    label: "📍 Estado",     desc: "Vinculado a um estado" },
    // { id: "municipio", label: "🏙️ Município", desc: "Vinculado a um município" },  // ← Descomente para ativar
  ];

  const tipoAtivo = recordes.find(t => t.id === tipoSel);

  // ── CRUD tipos de recorde ──
  const criarTipo = () => {
    if (!novoTipo.nome.trim() || !novoTipo.sigla.trim()) return;
    if (novoTipo.escopo === "pais" && !novoTipo.pais.trim()) return;
    if (novoTipo.escopo === "estado" && (!novoTipo.pais.trim() || !novoTipo.estado.trim())) return;
    if (novoTipo.escopo === "municipio" && (!novoTipo.pais.trim() || !novoTipo.estado.trim() || !novoTipo.municipio.trim())) return;
    const novo = {
      id: `rec_${Date.now()}`, nome: novoTipo.nome.trim(), sigla: novoTipo.sigla.trim().toUpperCase(),
      escopo: novoTipo.escopo,
      pais: ["pais","estado","municipio"].includes(novoTipo.escopo) ? novoTipo.pais.trim() : null,
      estado: ["estado","municipio"].includes(novoTipo.escopo) ? novoTipo.estado.trim() : null,
      municipio: novoTipo.escopo === "municipio" ? novoTipo.municipio.trim() : null,
      registros: [], competicoesVinculadas: []
    };
    setRecordes([...recordes, novo]);
    setTipoSel(novo.id);
    setNovoTipo({ nome: "", sigla: "", escopo: "estado", pais: "Brasil", estado: "", municipio: "" });
    setShowNovoTipo(false);
    if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, "Criou tipo de recorde", `${novo.sigla} — ${novo.nome} (${novo.escopo})`, null, { modulo: "recordes" });
  };

  const editarTipo = (id, campo, valor) => {
    setRecordes(recordes.map(t => t.id === id ? { ...t, [campo]: valor } : t));
  };

  const excluirTipo = (id) => {
    if (!confirm("Excluir este tipo de recorde e todos os registros?")) return;
    const tipo = recordes.find(t => t.id === id);
    setRecordes(recordes.filter(t => t.id !== id));
    if (tipoSel === id) setTipoSel(null);
    if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, "Excluiu tipo de recorde", `${tipo?.sigla || ""} — ${tipo?.nome || id}`, null, { modulo: "recordes" });
  };

  // ── CRUD registros ──
  const salvarRegistro = (reg) => {
    // Converter form flat fields → detentores[]
    const { atleta, equipe, atletaId, ano, local, competicaoId, competicaoNome, atletasRevezamento, _coDetentores, ...base } = reg;
    const detentorPrincipal = { atleta: atleta || "", equipe: equipe || "", atletaId: atletaId || null,
      ano: ano || "", local: local || "", competicaoId: competicaoId || null, competicaoNome: competicaoNome || "",
      atletasRevezamento: atletasRevezamento || null };
    const detentores = _coDetentores ? [detentorPrincipal, ..._coDetentores] : [detentorPrincipal];
    const regFinal = { ...base, detentores };

    setRecordes(recordes.map(t => {
      if (t.id !== tipoSel) return t;
      const idx = t.registros.findIndex(r => r.id === regFinal.id);
      const novos = [...t.registros];
      if (idx >= 0) novos[idx] = regFinal;
      else novos.push({ ...regFinal, id: `r_${Date.now()}_${Math.random().toString(36).slice(2,6)}` });
      return { ...t, registros: novos };
    }));
    setEditReg(null);
    if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, reg.id ? "Editou registro de recorde" : "Adicionou registro de recorde", `${reg.provaId || "?"} — ${detentorPrincipal.atleta || "?"}`, null, { modulo: "recordes" });
  };

  const excluirRegistro = (regId) => {
    setRecordes(recordes.map(t => t.id !== tipoSel ? t : { ...t, registros: t.registros.filter(r => r.id !== regId) }));
    if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, "Excluiu registro de recorde", regId, null, { modulo: "recordes" });
  };

  // ── Importação de planilha com inteligência ──
  const _allProvas = todasAsProvas();

  // Match de prova: 1º exato, 2º sem parênteses/pontos, 3º aliases comuns
  const _matchProva = (nomeInput) => {
    if (!nomeInput) return null;
    const ni = nomeInput.trim();
    const niLow = ni.toLowerCase();
    
    // 1) Match exato (case-insensitive)
    let match = _allProvas.find(p => p.nome.toLowerCase() === niLow);
    if (match) return match;
    
    // 2) Sem pontos separadores de milhar e sem parênteses de peso/altura
    const strip = (s) => s.toLowerCase().replace(/\./g, "").replace(/\s*\(.*?\)/g, "").replace(/\s+/g, " ").trim();
    match = _allProvas.find(p => strip(p.nome) === strip(ni));
    if (match) return match;

    // 3) Aliases comuns → nome do sistema
    const aliases = {
      "100m": "100m Rasos", "200m": "200m Rasos", "400m": "400m Rasos",
      "100 metros": "100m Rasos", "200 metros": "200m Rasos", "400 metros": "400m Rasos",
      "60m": "60m Rasos", "75m": "75m Rasos", "150m": "150m Rasos", "250m": "250m Rasos",
      "800": "800m", "600": "600m",
      "1000m": "1.000m", "1000": "1.000m", "1.000": "1.000m",
      "1500m": "1.500m", "1500": "1.500m", "1.500": "1.500m",
      "2000m": "2.000m", "2000": "2.000m", "2.000": "2.000m",
      "3000m": "3.000m", "3000": "3.000m", "3.000": "3.000m",
      "5000m": "5.000m", "5000": "5.000m", "5.000": "5.000m",
      "10000m": "10.000m", "10000": "10.000m", "10.000": "10.000m",
      "1500m obstaculos": "1.500m Obstáculos", "1500m obst": "1.500m Obstáculos",
      "2000m obstaculos": "2.000m Obstáculos", "2000m obst": "2.000m Obstáculos",
      "3000m obstaculos": "3.000m Obstáculos", "3000m obst": "3.000m Obstáculos",
      "steeplechase": "3.000m Obstáculos", "steeple": "3.000m Obstáculos",
      "110m barreiras": "110m c/ Barreiras", "110mb": "110m c/ Barreiras", "110m c/ barreira": "110m c/ Barreiras",
      "100m barreiras": "100m c/ Barreiras", "100mb": "100m c/ Barreiras",
      "400m barreiras": "400m c/ Barreiras", "400mb": "400m c/ Barreiras",
      "300m barreiras": "300m c/ Barreiras", "80m barreiras": "80m c/ Barreiras", "60m barreiras": "60m c/ Barreiras",
      "salto em distancia": "Salto em Distância", "salto distancia": "Salto em Distância", "distancia": "Salto em Distância", "long jump": "Salto em Distância",
      "salto em altura": "Salto em Altura", "salto altura": "Salto em Altura", "high jump": "Salto em Altura",
      "salto triplo": "Salto Triplo", "triplo": "Salto Triplo", "triple jump": "Salto Triplo",
      "salto com vara": "Salto com Vara", "salto vara": "Salto com Vara", "pole vault": "Salto com Vara",
      "arremesso do peso": "Arremesso do Peso", "arremesso peso": "Arremesso do Peso", "peso": "Arremesso do Peso", "shot put": "Arremesso do Peso",
      "lancamento do disco": "Lançamento do Disco", "lançamento disco": "Lançamento do Disco", "disco": "Lançamento do Disco", "discus": "Lançamento do Disco",
      "lancamento do dardo": "Lançamento do Dardo", "lançamento dardo": "Lançamento do Dardo", "dardo": "Lançamento do Dardo", "javelin": "Lançamento do Dardo",
      "lancamento do martelo": "Lançamento do Martelo", "lançamento martelo": "Lançamento do Martelo", "martelo": "Lançamento do Martelo", "hammer": "Lançamento do Martelo",
      "4x100": "4x100m", "revezamento 4x100": "4x100m",
      "4x400": "4x400m", "revezamento 4x400": "4x400m",
      "4x400 misto": "4x400m Misto", "4x400m misto": "4x400m Misto",
      "4x75": "4x75m", "5x60": "5x60m",
      "decatlo": "Decatlo", "decathlon": "Decatlo",
      "heptatlo": "Heptatlo", "heptathlon": "Heptatlo",
      "pentatlo": "Pentatlo", "pentathlon": "Pentatlo",
      "hexatlo": "Hexatlo", "tetratlo": "Tetratlo",
      "20km marcha": "20.000m Marcha", "20000m marcha": "20.000m Marcha",
      "35km marcha": "35.000m Marcha", "35000m marcha": "35.000m Marcha",
      "10km marcha": "10.000m Marcha", "10000m marcha": "10.000m Marcha",
      "5km marcha": "5.000m Marcha", "5000m marcha": "5.000m Marcha",
      "3km marcha": "3.000m Marcha", "3000m marcha": "3.000m Marcha",
      "2km marcha": "2.000m Marcha", "2000m marcha": "2.000m Marcha",
    };
    const niNorm = niLow.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\./g, "").replace(/\s+/g, " ");
    const aliasNome = aliases[niNorm] || aliases[niLow];
    if (aliasNome) {
      match = _allProvas.find(p => p.nome === aliasNome || strip(p.nome) === strip(aliasNome));
      if (match) return match;
    }

    // 4) Busca parcial — contém o nome do sistema
    match = _allProvas.find(p => strip(ni).includes(strip(p.nome)) || strip(p.nome).includes(strip(ni)));
    if (match) return match;

    return null;
  };

  // Normalizar categoria
  const _matchCategoria = (txt) => {
    if (!txt) return "";
    const n = txt.toLowerCase().replace(/[-_ ]/g, "").trim();
    const aliases = {
      sub14: ["sub14","s14","mirim","infantil"],
      sub16: ["sub16","s16","menores","infantojuvenil"],
      sub18: ["sub18","s18","juvenil","menor"],
      sub20: ["sub20","s20","junior","júnior"],
      sub23: ["sub23","s23","promessa","espoir"],
      adulto: ["adulto","adult","senior","sênior","principal","livre","aberto","open","master","veterano","masters"],
    };
    for (const [id, keys] of Object.entries(aliases)) {
      if (keys.some(k => n.includes(k))) return id;
    }
    // Tentar match direto com CATEGORIAS
    const cat = CATEGORIAS.find(c => c.id === n || c.nome.toLowerCase().replace(/[-_ ]/g, "") === n);
    return cat ? cat.id : txt.trim();
  };

  // Normalizar sexo
  const _matchSexo = (txt) => {
    if (!txt) return "";
    const n = txt.toLowerCase().trim();
    if (["f","fem","feminino","female","w","women","mulher","meninas","girls"].some(s => n === s || n.includes(s))) return "F";
    if (["m","masc","masculino","male","men","homem","h","meninos","boys"].some(s => n === s || n.includes(s))) return "M";
    return "";
  };

  // Normalizar marca para o formato interno do sistema
  // Tempo: armazena em segundos (ex: 10.45, 112.30)
  // Distância: armazena em metros (ex: 7.30, 15.22)
  const _normMarca = (marca, unidade) => {
    if (!marca) return "";
    let raw = String(marca).trim();
    
    // Remover sufixos textuais (m, s, pts, pontos, etc)
    raw = raw.replace(/\s*(metros?|m|seg\.?|s|pts|pontos?|p)\s*$/i, "");
    
    // Substituir vírgula por ponto (padrão brasileiro → decimal)
    // Cuidado: "1.52,30" é minuto.segundo,centésimos — tratar separado
    // Se tem formato m.ss,cc ou m:ss,cc → é tempo brasileiro
    const brTempo = raw.match(/^(\d+)[.:](\d{2}),(\d{1,3})$/);
    if (brTempo && unidade === "s") {
      const min = parseInt(brTempo[1]);
      const sec = parseInt(brTempo[2]);
      const frac = brTempo[3];
      const total = min * 60 + sec + parseFloat("0." + frac);
      return total.toFixed(frac.length);
    }
    
    // Formato ss,cc ou ss,ccc (tempo curto brasileiro, ex: "10,45" ou "10,450")
    const brCurto = raw.match(/^(\d{1,3}),(\d{1,3})$/);
    if (brCurto) {
      if (unidade === "m") {
        // Distância: "7,30" → "7.30"
        return brCurto[1] + "." + brCurto[2];
      }
      // Tempo: "10,45" → "10.45" (segundos)
      return brCurto[1] + "." + brCurto[2];
    }
    
    // Substituir vírgula restante por ponto
    let m = raw.replace(/,/g, ".").replace(/[^\d:.]/g, "");
    
    // Formato h:mm:ss.cc (ex: "1:23:45.67")
    const hms = m.match(/^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/);
    if (hms && unidade === "s") {
      const h = parseInt(hms[1]);
      const mi = parseInt(hms[2]);
      const se = parseInt(hms[3]);
      const frac = hms[4] || "0";
      const total = h * 3600 + mi * 60 + se + parseFloat("0." + frac);
      return total.toFixed(frac.length > 0 ? frac.length : 0);
    }
    
    // Formato m:ss.cc (ex: "1:52.30" ou "4:05.20")
    const minSec = m.match(/^(\d+):(\d{1,2})(?:\.(\d+))?$/);
    if (minSec && unidade === "s") {
      const min = parseInt(minSec[1]);
      const sec = parseInt(minSec[2]);
      const frac = minSec[3] || "0";
      const total = min * 60 + sec + parseFloat("0." + frac);
      return total.toFixed(frac.length > 0 ? frac.length : 0);
    }
    
    // Número simples
    const num = parseFloat(m);
    if (!isNaN(num)) return m;
    return raw;
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (rows.length === 0) { alert("Planilha vazia."); return; }

      const colMap = (row) => {
        // Match flexível de colunas: ignora case, acentos, espaços extras
        const normalizeCol = (s) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
        const get = (...keys) => {
          for (const k of keys) {
            const nk = normalizeCol(k);
            const found = Object.keys(row).find(c => normalizeCol(c) === nk);
            if (found && row[found] !== "" && row[found] != null) return String(row[found]).trim();
          }
          // Fallback: busca parcial
          for (const k of keys) {
            const nk = normalizeCol(k);
            const found = Object.keys(row).find(c => normalizeCol(c).includes(nk) || nk.includes(normalizeCol(c)));
            if (found && row[found] !== "" && row[found] != null) return String(row[found]).trim();
          }
          return "";
        };
        const rawProva = get("prova", "evento", "event", "discipline", "prova/evento");
        const rawCat = get("categoria", "cat", "category");
        const rawSexo = get("sexo", "sex", "gênero", "genero", "gender");
        const rawMarca = get("marca", "mark", "result", "resultado", "tempo", "time", "record");
        const rawTipoRec = get("tipo recorde", "tipo recorde (sigla)", "tipo", "sigla", "recorde", "record type");

        const provaMatch = _matchProva(rawProva);
        const catId = _matchCategoria(rawCat);
        let sexo = _matchSexo(rawSexo);
        
        // Fallback: tentar extrair sexo do ID da prova ou da categoria
        if (!sexo && provaMatch) {
          if (provaMatch.id.startsWith("F_")) sexo = "F";
          else if (provaMatch.id.startsWith("M_")) sexo = "M";
        }
        if (!sexo) sexo = "M"; // default final

        const unidade = provaMatch ? (provaMatch.unidade || "s") : (rawMarca.includes(":") ? "s" : "");
        const marca = _normMarca(rawMarca, unidade);

        // Atletas do revezamento
        const rawAtletas = get("atletas", "athletes", "componentes", "integrantes", "corredores");
        let atletasRevezamento = null;
        if (rawAtletas) {
          atletasRevezamento = rawAtletas.split(/[,;\/|]/).map(s => s.trim()).filter(Boolean).slice(0, 4);
        }
        const isRevez = provaMatch?.tipo === "revezamento" || (rawProva || "").match(/^[45]x\d/i);

        // Match tipo de recorde pela sigla
        let tipoRecordeId = "";
        let tipoRecordeNome = "";
        if (rawTipoRec) {
          const trNorm = rawTipoRec.toLowerCase().trim();
          const tipoMatch = recordes.find(t => t.sigla.toLowerCase().trim() === trNorm || t.nome.toLowerCase().trim() === trNorm);
          if (tipoMatch) { tipoRecordeId = tipoMatch.id; tipoRecordeNome = tipoMatch.sigla; }
        }

        return {
          categoriaId: catId,
          sexo,
          provaId: provaMatch ? provaMatch.id : "",
          provaNome: provaMatch ? provaMatch.nome : rawProva,
          marca,
          unidade,
          atleta: get("atleta", "athlete", "nome", "name"),
          equipe: get("equipe", "clube", "club", "team"),
          ano: get("ano", "year", "data"),
          local: get("local", "cidade", "city", "location"),
          tipoRecordeId,
          tipoRecordeNome,
          ...(atletasRevezamento && atletasRevezamento.length > 0 ? { atletasRevezamento } : {}),
          _raw: { prova: rawProva, cat: rawCat, sexo: rawSexo, marca: rawMarca, tipoRecorde: rawTipoRec },
          _matched: !!provaMatch,
          _isRevez: !!isRevez,
          _tipoMatched: !!tipoRecordeId,
        };
      };
      const registros = rows.map(r => colMap(r)).filter(r => r.atleta && r.marca);
      setImportPreview(registros);
    } catch (err) { alert("Erro ao ler planilha: " + err.message); }
    e.target.value = "";
  };

  // Helper: comparar marcas (retorna true se novaMarca é melhor que existente)
  const _isMelhor = (novaMarca, existente, unidade) => {
    const nova = parseFloat(novaMarca);
    const atual = parseFloat(existente);
    if (isNaN(nova)) return false;
    if (isNaN(atual)) return true; // não tinha recorde
    if (unidade === "s") return nova < atual; // tempo: menor melhor
    return nova > atual; // campo/pontos: maior melhor
  };

  // Classificar cada registro do preview
  // _status: "incluir" | "atualizar" | "inferior" | "nao_encontrada" | "outro_tipo" | "tipo_desconhecido"
  const _classificarImport = (registros) => {
    return registros.map(r => {
      // 0) Tipo de recorde especificado na planilha mas não encontrado no sistema
      if (r._raw?.tipoRecorde && !r._tipoMatched) {
        return { ...r, _status: "tipo_desconhecido", _existente: null };
      }
      // Determinar tipo alvo: da planilha ou do selecionado
      const tipoAlvoId = r.tipoRecordeId || tipoSel;
      const tipoAlvo = recordes.find(t => t.id === tipoAlvoId);

      // 1) Prova não reconhecida no sistema
      if (!r._matched) {
        // Verificar se existe como provaNome em outro tipo de recorde
        for (const tipo of recordes) {
          if (tipo.id === tipoAlvoId) continue;
          const found = tipo.registros.find(e =>
            e.provaNome?.toLowerCase() === (r.provaNome || r._raw?.prova || "").toLowerCase()
          );
          if (found) {
            return { ...r, _status: "outro_tipo", _outroTipo: tipo.nome, _outroSigla: tipo.sigla, _existente: null, _tipoAlvoId: tipoAlvoId };
          }
        }
        return { ...r, _status: "nao_encontrada", _existente: null, _tipoAlvoId: tipoAlvoId };
      }
      // 2) Prova reconhecida — comparar com recorde existente neste tipo
      if (tipoAlvo) {
        const existente = tipoAlvo.registros.find(e =>
          (r.provaId && e.provaId === r.provaId && e.categoriaId === r.categoriaId && e.sexo === r.sexo) ||
          (!r.provaId && e.provaNome?.toLowerCase() === r.provaNome?.toLowerCase() && e.categoriaId === r.categoriaId && e.sexo === r.sexo)
        );
        if (existente) {
          const unid = r.unidade || existente.unidade || "s";
          const melhor = _isMelhor(r.marca, existente.marca, unid);
          return { ...r, _status: melhor ? "atualizar" : "inferior", _existente: existente, _tipoAlvoId: tipoAlvoId };
        }
      }
      return { ...r, _status: "incluir", _existente: null, _tipoAlvoId: tipoAlvoId };
    });
  };

  const confirmarImport = () => {
    if (!importPreview) return;
    const classificados = _classificarImport(importPreview);
    // Só importar incluir e atualizar (não inferiores, não encontradas, tipo desconhecido)
    const paraImportar = classificados.filter(r => r._status === "incluir" || r._status === "atualizar");
    // Agrupar por tipo alvo
    const porTipo = {};
    paraImportar.forEach(r => {
      const tid = r._tipoAlvoId || tipoSel;
      if (!porTipo[tid]) porTipo[tid] = [];
      porTipo[tid].push(r);
    });
    setRecordes(recordes.map(t => {
      const regsParaTipo = porTipo[t.id];
      if (!regsParaTipo) return t;
      const novosRegistros = [...t.registros];
      regsParaTipo.forEach((r, i) => {
        const novoReg = {
          id: `r_imp_${Date.now()}_${t.id}_${i}`,
          categoriaId: r.categoriaId, sexo: r.sexo,
          provaId: r.provaId, provaNome: r.provaNome,
          marca: r.marca, unidade: r.unidade,
          marcasComponentes: r.marcasComponentes || null,
          fonte: "manual",
          detentores: [{ atleta: r.atleta || "", equipe: r.equipe || "", atletaId: null,
            ano: r.ano || "", local: r.local || "", competicaoId: null, competicaoNome: "",
            atletasRevezamento: r.atletasRevezamento || null }],
        };
        if (r._existente) {
          const idx = novosRegistros.findIndex(e => e.id === r._existente.id);
          if (idx >= 0) novosRegistros[idx] = { ...novoReg, id: r._existente.id };
          else novosRegistros.push(novoReg);
        } else {
          novosRegistros.push(novoReg);
        }
      });
      return { ...t, registros: novosRegistros };
    }));
    // Resumo por tipo
    const tiposAfetados = Object.keys(porTipo).map(tid => {
      const t = recordes.find(r => r.id === tid);
      return `${t?.sigla || tid}: ${porTipo[tid].length}`;
    });
    if (tiposAfetados.length > 1) {
      alert(`Importação distribuída por ${tiposAfetados.length} tipos:\n${tiposAfetados.join("\n")}`);
    }
    if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, "Importou recordes (planilha)", tiposAfetados.join(", "), null, { modulo: "recordes" });
    setImportPreview(null);
  };

  // Corrigir prova de um registro do preview (admin selecionou manualmente)
  const fixPreviewProva = (idx, provaId) => {
    if (!importPreview) return;
    const prova = _allProvas.find(p => p.id === provaId);
    if (!prova) return;
    const updated = [...importPreview];
    updated[idx] = {
      ...updated[idx],
      provaId: prova.id,
      provaNome: prova.nome,
      unidade: prova.unidade || "s",
      _matched: true,
      _fixedManually: true,
    };
    setImportPreview(updated);
  };

  // Filtrar registros
  const registrosFiltrados = tipoAtivo ? tipoAtivo.registros.filter(r => {
    if (filtroCategoria !== "todas" && r.categoriaId !== filtroCategoria) return false;
    if (filtroSexo !== "todos" && r.sexo !== filtroSexo) return false;
    return true;
  }).sort((a,b) => (a.provaNome || "").localeCompare(b.provaNome || "")) : [];

  const categoriasUnicas = tipoAtivo ? [...new Set(tipoAtivo.registros.map(r => r.categoriaId || r.categoriaNome || "").filter(Boolean))] : [];

  const S = {
    page: { ...styles.page, maxWidth: 1100 },
    card: { background:"#12141C", borderRadius:12, border:"1px solid #1E2130", padding:"16px 20px", marginBottom:14 },
    inputSm: { background:"#1a1c22", border:"1px solid #2a3050", borderRadius:4, color:"#1976D2", fontSize:12, padding:"5px 8px", fontWeight:600 },
  };

  return (
    <div style={S.page}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={styles.pageTitle}>🏆 Recordes</h2>
          <p style={{ color:"#666", fontSize:13 }}>Acervo de recordes por tipo de competição</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {isAdmin && (
            <button style={styles.btnPrimary} onClick={() => setShowNovoTipo(true)}>+ Novo Tipo de Recorde</button>
          )}
        </div>
      </div>

      {/* Abas principais */}
      {isAdmin && (
        <div style={{ display:"flex", gap:6, marginBottom:16, borderBottom:"1px solid #2a2a3a", paddingBottom:8 }}>
          {[
            { id: "registros", label: "📋 Registros", count: null },
            { id: "pendencias", label: "⏳ Pendências", count: (pendenciasRecorde || []).filter(p => p.status === "pendente").length },
            { id: "historico", label: "📜 Histórico", count: (historicoRecordes || []).length },
          ].map(aba => (
            <button key={aba.id} onClick={() => setAbaRecordes(aba.id)}
              style={{
                padding:"8px 16px", borderRadius:8, fontSize:13, cursor:"pointer", fontWeight:600,
                border: abaRecordes === aba.id ? "2px solid #1976D2" : "1px solid transparent",
                background: abaRecordes === aba.id ? "#0a1a2a" : "transparent",
                color: abaRecordes === aba.id ? "#1976D2" : "#888",
              }}>
              {aba.label}
              {aba.count > 0 && (
                <span style={{ marginLeft:6, background: aba.id === "pendencias" ? "#ff4444" : "#333",
                  color:"#fff", fontSize:10, fontWeight:800, borderRadius:10, padding:"1px 6px" }}>{aba.count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ═══ ABA: REGISTROS ═══ */}
      {(abaRecordes === "registros" || !isAdmin) && (<>
      {/* Modal novo tipo */}
      {showNovoTipo && isAdmin && (
        <div style={{ ...S.card, border:"2px solid #1976D2" }}>
          <div style={{ color:"#1976D2", fontWeight:700, fontSize:14, marginBottom:12 }}>Criar Tipo de Recorde</div>

          {/* Escopo geográfico */}
          <div style={{ marginBottom:12 }}>
            <label style={{ ...styles.label, marginBottom:6 }}>Abrangência geográfica</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {ESCOPOS.map(esc => (
                <button key={esc.id} onClick={() => setNovoTipo({ ...novoTipo, escopo: esc.id })}
                  style={{
                    padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600,
                    border: novoTipo.escopo === esc.id ? "2px solid #1976D2" : "1px solid #2a2a3a",
                    background: novoTipo.escopo === esc.id ? "#0a1a2a" : "#111",
                    color: novoTipo.escopo === esc.id ? "#1976D2" : "#888",
                  }}>
                  {esc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Campos condicionais por escopo */}
          {novoTipo.escopo !== "mundial" && (
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:12 }}>
              <div>
                <label style={styles.label}>País</label>
                <input style={{ ...styles.input, width:160 }} placeholder="Brasil" value={novoTipo.pais}
                  onChange={e => setNovoTipo({ ...novoTipo, pais: e.target.value })} />
              </div>
              {["estado","municipio"].includes(novoTipo.escopo) && (
                <div>
                  <label style={styles.label}>Estado (UF)</label>
                  {novoTipo.pais === "Brasil" ? (
                    <select style={{ ...styles.input, width:80 }} value={novoTipo.estado}
                      onChange={e => setNovoTipo({ ...novoTipo, estado: e.target.value })}>
                      <option value="">UF</option>
                      {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  ) : (
                    <input style={{ ...styles.input, width:120 }} placeholder="Sigla" value={novoTipo.estado}
                      onChange={e => setNovoTipo({ ...novoTipo, estado: e.target.value })} />
                  )}
                </div>
              )}
              {novoTipo.escopo === "municipio" && (
                <div>
                  <label style={styles.label}>Município</label>
                  <input style={{ ...styles.input, width:200 }} placeholder="Nome do município" value={novoTipo.municipio}
                    onChange={e => setNovoTipo({ ...novoTipo, municipio: e.target.value })} />
                </div>
              )}
            </div>
          )}

          {/* Nome e sigla */}
          <div style={{ display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap" }}>
            <div>
              <label style={styles.label}>Nome</label>
              <input style={{ ...styles.input, width:280 }} placeholder="Ex: Recordes do Campeonato Mineiro"
                value={novoTipo.nome} onChange={e => setNovoTipo({ ...novoTipo, nome: e.target.value })} />
            </div>
            <div>
              <label style={styles.label}>Sigla</label>
              <input style={{ ...styles.input, width:80 }} placeholder="CM" maxLength={6}
                value={novoTipo.sigla} onChange={e => setNovoTipo({ ...novoTipo, sigla: e.target.value })} />
            </div>
            <button style={styles.btnPrimary} onClick={criarTipo}>✅ Criar</button>
            <button style={styles.btnGhost} onClick={() => setShowNovoTipo(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Tabs de tipos — agrupados por escopo geográfico */}
      <div style={{ marginBottom:16 }}>
        {(() => {
          const escopoIcons = { mundial: "🌍", pais: "🏳️", estado: "📍", municipio: "🏙️" };
          const escopoOrdem = ["mundial", "pais", "estado", "municipio"];
          // Gerar chave de grupo: escopo + localidade
          const getGrupoKey = (tipo) => {
            const esc = tipo.escopo || "estado";
            if (esc === "mundial") return "mundial";
            if (esc === "pais") return `pais_${tipo.pais || ""}`;
            if (esc === "estado") return `estado_${tipo.pais || ""}_${tipo.estado || ""}`;
            return `municipio_${tipo.pais || ""}_${tipo.estado || ""}_${tipo.municipio || ""}`;
          };
          const getGrupoLabel = (tipo) => {
            const esc = tipo.escopo || "estado";
            if (esc === "mundial") return "Mundial";
            if (esc === "pais") return tipo.pais || "País";
            if (esc === "estado") return `${tipo.estado || "Estado"}${tipo.pais && tipo.pais !== "Brasil" ? " · " + tipo.pais : ""}`;
            return `${tipo.municipio || "Município"}, ${tipo.estado || ""}`;
          };
          const grupos = {};
          const grupoMeta = {};
          recordes.forEach(tipo => {
            const key = getGrupoKey(tipo);
            if (!grupos[key]) { grupos[key] = []; grupoMeta[key] = { escopo: tipo.escopo || "estado", label: getGrupoLabel(tipo) }; }
            grupos[key].push(tipo);
          });
          // Ordenar grupos por escopo
          const chaves = Object.keys(grupos).sort((a, b) => {
            const ea = escopoOrdem.indexOf(grupoMeta[a].escopo);
            const eb = escopoOrdem.indexOf(grupoMeta[b].escopo);
            return ea - eb || a.localeCompare(b);
          });
          if (chaves.length === 0) return <p style={{ color:"#555", fontSize:13 }}>Nenhum tipo de recorde cadastrado.{isAdmin ? " Clique em '+ Novo Tipo' para começar." : ""}</p>;
          return chaves.map(key => (
            <div key={key} style={{ marginBottom:10 }}>
              <div style={{ color:"#555", fontSize:11, fontWeight:700, marginBottom:5, textTransform:"uppercase", letterSpacing:1 }}>
                {escopoIcons[grupoMeta[key].escopo] || "📋"} {grupoMeta[key].label}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {grupos[key].map(tipo => (
                  <button key={tipo.id}
                    style={{
                      padding:"8px 16px", borderRadius:8, fontSize:13, cursor:"pointer", fontWeight:600,
                      border: tipoSel === tipo.id ? "2px solid #1976D2" : "1px solid #2a2a3a",
                      background: tipoSel === tipo.id ? "#0a1a2a" : "#111",
                      color: tipoSel === tipo.id ? "#1976D2" : "#888",
                    }}
                    onClick={async () => { setTipoSel(tipo.id); setEditReg(null); setImportPreview(null); }}
                  >
                    {tipo.nome} <span style={{ fontSize:10, color:"#555", marginLeft:4 }}>({tipo.sigla} · {tipo.registros.length})</span>
                  </button>
                ))}
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Conteúdo do tipo selecionado */}
      {tipoAtivo && (
        <div>
          {/* Header do tipo */}
          <div style={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
            <div>
              {editTipoId === tipoAtivo.id && isAdmin ? (
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  <input style={{ ...S.inputSm, width:250 }} value={tipoAtivo.nome}
                    onChange={e => editarTipo(tipoAtivo.id, "nome", e.target.value)} />
                  <input style={{ ...S.inputSm, width:60 }} value={tipoAtivo.sigla} maxLength={6}
                    onChange={e => editarTipo(tipoAtivo.id, "sigla", e.target.value.toUpperCase())} />
                  <select style={{ ...S.inputSm, width:110 }} value={tipoAtivo.escopo || "estado"}
                    onChange={e => editarTipo(tipoAtivo.id, "escopo", e.target.value)}>
                    {ESCOPOS.map(esc => <option key={esc.id} value={esc.id}>{esc.label}</option>)}
                    <option value="municipio">🏙️ Município</option>
                  </select>
                  {(tipoAtivo.escopo || "estado") !== "mundial" && (
                    <input style={{ ...S.inputSm, width:100 }} placeholder="País" value={tipoAtivo.pais || ""}
                      onChange={e => editarTipo(tipoAtivo.id, "pais", e.target.value)} />
                  )}
                  {["estado","municipio"].includes(tipoAtivo.escopo || "estado") && (
                    <input style={{ ...S.inputSm, width:50 }} placeholder="UF" value={tipoAtivo.estado || ""}
                      onChange={e => editarTipo(tipoAtivo.id, "estado", e.target.value.toUpperCase())} />
                  )}
                  {(tipoAtivo.escopo) === "municipio" && (
                    <input style={{ ...S.inputSm, width:140 }} placeholder="Município" value={tipoAtivo.municipio || ""}
                      onChange={e => editarTipo(tipoAtivo.id, "municipio", e.target.value)} />
                  )}
                  <button style={{ ...styles.btnGhost, fontSize:11 }} onClick={() => setEditTipoId(null)}>OK</button>
                </div>
              ) : (
                <div>
                  <span style={{ color:"#1976D2", fontWeight:800, fontSize:18 }}>{tipoAtivo.nome}</span>
                  <span style={{ color:"#555", fontSize:12, marginLeft:8 }}>({tipoAtivo.sigla})</span>
                  <span style={{ fontSize:10, marginLeft:10, padding:"2px 8px", borderRadius:10,
                    background: (tipoAtivo.escopo||"estado") === "mundial" ? "#1a1a2a" : (tipoAtivo.escopo||"estado") === "pais" ? "#1a2a1a" : "#2a1a0a",
                    color: (tipoAtivo.escopo||"estado") === "mundial" ? "#6ab4ff" : (tipoAtivo.escopo||"estado") === "pais" ? "#7cfc7c" : "#ffaa44",
                    border: "1px solid #333"
                  }}>
                    {(tipoAtivo.escopo||"estado") === "mundial" ? "🌍 Mundial"
                      : (tipoAtivo.escopo||"estado") === "pais" ? `🏳️ ${tipoAtivo.pais || "País"}`
                      : (tipoAtivo.escopo||"estado") === "municipio" ? `🏙️ ${tipoAtivo.municipio || ""}, ${tipoAtivo.estado || ""}`
                      : `📍 ${tipoAtivo.estado || "Estado"}`}
                  </span>
                  {isAdmin && <button style={{ background:"none", border:"none", color:"#555", cursor:"pointer", marginLeft:8, fontSize:12 }}
                    onClick={() => setEditTipoId(tipoAtivo.id)}>✏️</button>}
                </div>
              )}
              <div style={{ color:"#666", fontSize:12, marginTop:2 }}>{tipoAtivo.registros.length} registros</div>
            </div>
            {isAdmin && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <button style={{ ...styles.btnPrimary, fontSize:11 }}
                  onClick={() => setEditReg({ categoriaId:"", sexo:"M", provaNome:"", marca:"", atleta:"", equipe:"", ano:"", local:"", provaId:"", unidade:"", atletaId:null, fonte:"manual", atletasRevezamento:null })}>
                  + Adicionar
                </button>
                <label style={{ ...styles.btnGhost, fontSize:11, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4 }}>
                  📥 Importar Planilha
                  <input type="file" accept=".xlsx,.xls,.csv" style={{ display:"none" }} onChange={handleImport} />
                </label>
                <button style={{ ...styles.btnGhost, fontSize:11, color:"#6ab4ff", borderColor:"#1a2a4a" }}
                  onClick={async () => {
                    try {
                      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
                      const catAtivo = tipoAtivo ? [...new Set(tipoAtivo.registros.map(r => r.categoriaId))].filter(Boolean) : [];
                      const categorias = catAtivo.length > 0 ? catAtivo : ["adulto","sub20","sub18","sub16"];
                      const sexos = ["M","F"];
                      // Coletar nomes únicos de provas do sistema
                      const provasUnicas = [...new Set(_allProvas.map(p => p.nome))].sort((a,b) => {
                        const ord = ["Rasos","Barreiras","Obstáculos","Marcha","Salto","Arremesso","Lançamento","4x","5x","Revez","Decatlo","Heptatlo","Pentatlo"];
                        const ia = ord.findIndex(o => a.includes(o));
                        const ib = ord.findIndex(o => b.includes(o));
                        return (ia===-1?99:ia) - (ib===-1?99:ib) || a.localeCompare(b);
                      });
                      // Coletar tipos de recorde cadastrados
                      const tiposCadastrados = recordes.map(t => ({
                        sigla: t.sigla, nome: t.nome,
                        escopo: t.escopo || "estado",
                        geo: t.escopo === "mundial" ? "Mundial" : t.escopo === "pais" ? (t.pais || "Brasil") : t.escopo === "municipio" ? `${t.municipio}, ${t.estado}` : (t.estado || "?"),
                      }));
                      // Aba 1: Modelo para preenchimento
                      const header = ["Tipo Recorde (sigla)","Prova","Categoria","Sexo","Marca","Atleta","Equipe","Ano","Local","Atletas (revezamento)"];
                      const siglaPadrao = tipoAtivo ? tipoAtivo.sigla : (tiposCadastrados[0]?.sigla || "RE");
                      const exemploRows = [
                        [siglaPadrao,"100m Rasos","adulto","M","10.45","João Silva","Clube ABC","2024","Belo Horizonte - MG",""],
                        [siglaPadrao,"Salto em Distância","adulto","M","7.30","Pedro Santos","Equipe XYZ","2023","Rio de Janeiro - RJ",""],
                        [siglaPadrao,"3.000m Obstáculos","adulto","F","9:45.20","Maria Lima","Time 123","2024","São Paulo - SP",""],
                        [siglaPadrao,"4x100m","sub20","M","42.50","Equipe A","Clube DEF","2024","Curitiba - PR","João, Pedro, Lucas, André"],
                        [siglaPadrao,"Arremesso do Peso (4kg)","sub18","F","12.45","Ana Costa","Clube GHI","2023","Salvador - BA",""],
                        [siglaPadrao,"1.500m","adulto","M","3:52.30","Carlos Souza","Equipe JKL","2024","Porto Alegre - RS",""],
                      ];
                      const wsData = [header, ...exemploRows];
                      // Linhas vazias para preenchimento
                      for (let i = 0; i < 50; i++) wsData.push(["","","","","","","","","",""]);
                      const ws1 = XLSX.utils.aoa_to_sheet(wsData);
                      ws1["!cols"] = [{wch:22},{wch:30},{wch:14},{wch:6},{wch:14},{wch:25},{wch:20},{wch:8},{wch:22},{wch:40}];
                      // Aba 2: Lista de provas do sistema
                      const provasData = [["Nome Exato da Prova","Tipo","Unidade"]];
                      provasUnicas.forEach(nome => {
                        const p = _allProvas.find(pr => pr.nome === nome);
                        provasData.push([nome, p?.tipo || "", p?.unidade === "s" ? "Tempo (s)" : p?.unidade === "m" ? "Distância (m)" : p?.unidade === "pts" ? "Pontos" : ""]);
                      });
                      const ws2 = XLSX.utils.aoa_to_sheet(provasData);
                      ws2["!cols"] = [{wch:35},{wch:16},{wch:16}];
                      // Aba 3: Tipos de recorde cadastrados
                      const tiposData = [["Sigla (usar na coluna 'Tipo Recorde')","Nome Completo","Escopo","Abrangência"]];
                      tiposCadastrados.forEach(t => { tiposData.push([t.sigla, t.nome, t.escopo, t.geo]); });
                      if (tiposCadastrados.length === 0) tiposData.push(["(nenhum tipo cadastrado)","","",""]);
                      const ws3t = XLSX.utils.aoa_to_sheet(tiposData);
                      ws3t["!cols"] = [{wch:35},{wch:30},{wch:14},{wch:20}];
                      // Aba 4: Categorias e sexos aceitos
                      const catData = [["Categoria (valor aceito)","Aliases aceitos"],
                        ["adulto","adulto, adult, senior, sênior, principal, livre, aberto, open, master, veterano, masters"],
                        ["sub23","sub23, s23, promessa, espoir"],
                        ["sub20","sub20, s20, junior, júnior"],
                        ["sub18","sub18, s18, juvenil, menor"],
                        ["sub16","sub16, s16, menores, infantojuvenil"],
                        ["sub14","sub14, s14, mirim, infantil"],
                        ["",""],
                        ["Sexo (valor aceito)","Aliases aceitos"],
                        ["M","M, Masc, Masculino, Male, Men, Homem, Meninos, Boys"],
                        ["F","F, Fem, Feminino, Female, Women, Mulher, Meninas, Girls"],
                        ["",""],
                        ["Formato de Marca","Exemplos"],
                        ["Tempo curto","10.45  ou  10,45  ou  10,450"],
                        ["Tempo médio (min:seg)","1:52.30  ou  1.52,30  ou  1:52,300"],
                        ["Tempo longo (h:min:seg)","1:23:45.67"],
                        ["Distância","7.30  ou  7,30  ou  7.30m"],
                        ["Pontos combinada","8000  ou  8000 pts"],
                        ["",""],
                        ["Local (formato recomendado)","Exemplos"],
                        ["Cidade - UF","Belo Horizonte - MG, São Paulo - SP, Rio de Janeiro - RJ"],
                      ];
                      const ws4 = XLSX.utils.aoa_to_sheet(catData);
                      ws4["!cols"] = [{wch:28},{wch:55}];
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws1, "Recordes");
                      XLSX.utils.book_append_sheet(wb, ws2, "Provas do Sistema");
                      XLSX.utils.book_append_sheet(wb, ws3t, "Tipos de Recorde");
                      XLSX.utils.book_append_sheet(wb, ws4, "Referência");
                      XLSX.writeFile(wb, "modelo_recordes.xlsx");
                    } catch(err) { alert("Erro ao gerar modelo: " + err.message); }
                  }}>
                  📋 Baixar Modelo
                </button>
                <button style={{ ...styles.btnGhost, fontSize:11, color:"#ff6b6b", borderColor:"#4a1a1a" }}
                  onClick={() => excluirTipo(tipoAtivo.id)}>🗑 Excluir Tipo</button>
              </div>
            )}
          </div>

          {/* Import preview */}
          {importPreview && (() => {
            const classificados = _classificarImport(importPreview);
            const incluir = classificados.filter(r => r._status === "incluir").length;
            const atualizar = classificados.filter(r => r._status === "atualizar").length;
            const inferiores = classificados.filter(r => r._status === "inferior").length;
            const naoEncontradas = classificados.filter(r => r._status === "nao_encontrada").length;
            const outroTipo = classificados.filter(r => r._status === "outro_tipo").length;
            const tipoDesconhecido = classificados.filter(r => r._status === "tipo_desconhecido").length;
            const paraImportar = incluir + atualizar;
            return (
            <div style={{ ...S.card, border:"2px solid #1976D2" }}>
              <div style={{ color:"#1976D2", fontWeight:700, fontSize:14, marginBottom:4 }}>📥 Preview da importação — {importPreview.length} registros</div>
              <div style={{ fontSize:10, color:"#888", marginBottom:8, lineHeight:1.6 }}>
                Somente provas com nome <strong style={{color:"#aaa"}}>exato</strong> do site serão reconhecidas. Marcas normalizadas (vírgulas → pontos, min:seg → segundos).
              </div>
              <div style={{ display:"flex", gap:10, marginBottom:10, flexWrap:"wrap" }}>
                {incluir > 0 && <span style={{ fontSize:11, padding:"3px 8px", borderRadius:4, background:"#0a1a2a", color:"#6ab4ff", fontWeight:600 }}>🆕 {incluir} novos</span>}
                {atualizar > 0 && <span style={{ fontSize:11, padding:"3px 8px", borderRadius:4, background:"#0a1a2a", color:"#ffd700", fontWeight:600 }}>⬆️ {atualizar} atualizados</span>}
                {inferiores > 0 && <span style={{ fontSize:11, padding:"3px 8px", borderRadius:4, background:"#1a0a0a", color:"#ff6b6b", fontWeight:600 }}>⬇️ {inferiores} inferiores</span>}
                {naoEncontradas > 0 && <span style={{ fontSize:11, padding:"3px 8px", borderRadius:4, background:"#1a0a1a", color:"#ff44ff", fontWeight:600 }}>❌ {naoEncontradas} não encontradas</span>}
                {outroTipo > 0 && <span style={{ fontSize:11, padding:"3px 8px", borderRadius:4, background:"#0a1a1a", color:"#44dddd", fontWeight:600 }}>🔄 {outroTipo} em outro tipo</span>}
                {tipoDesconhecido > 0 && <span style={{ fontSize:11, padding:"3px 8px", borderRadius:4, background:"#1a1a0a", color:"#ff8844", fontWeight:600 }}>⚠️ {tipoDesconhecido} tipo não encontrado</span>}
              </div>
              <div style={{ maxHeight:400, overflowY:"auto", marginBottom:10 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                  <thead>
                    <tr style={{ borderBottom:"2px solid #2a3050" }}>
                      <th style={{ padding:"4px 4px", color:"#888", fontSize:9, width:24 }}></th>
                      <th style={{ padding:"4px 6px", color:"#888", textAlign:"left", fontSize:10 }}>Tipo</th>
                      <th style={{ padding:"4px 6px", color:"#888", textAlign:"left", fontSize:10 }}>Prova (planilha)</th>
                      <th style={{ padding:"4px 6px", color:"#888", fontSize:10 }}>Cat.</th>
                      <th style={{ padding:"4px 6px", color:"#888", fontSize:10 }}>Sexo</th>
                      <th style={{ padding:"4px 6px", color:"#1976D2", fontSize:10 }}>Marca</th>
                      <th style={{ padding:"4px 6px", color:"#888", fontSize:10 }}>Rec. Atual</th>
                      <th style={{ padding:"4px 6px", color:"#888", textAlign:"left", fontSize:10 }}>Atleta</th>
                      <th style={{ padding:"4px 6px", color:"#888", textAlign:"left", fontSize:10 }}>Equipe</th>
                      <th style={{ padding:"4px 6px", color:"#888", fontSize:10 }}>Ano</th>
                      <th style={{ padding:"4px 6px", color:"#888", textAlign:"left", fontSize:10 }}>Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classificados.map((r, idx) => {
                      const catObj = CATEGORIAS.find(c => c.id === r.categoriaId);
                      const sc = {
                        incluir:          { icon: "🆕", color: "#6ab4ff", bg: "#0a1020" },
                        atualizar:        { icon: "⬆️", color: "#ffd700", bg: "#0a1a2a" },
                        inferior:         { icon: "⬇️", color: "#ff6b6b", bg: "#1a0a0a" },
                        nao_encontrada:   { icon: "❌", color: "#ff44ff", bg: "#1a0a1a" },
                        outro_tipo:       { icon: "🔄", color: "#44dddd", bg: "#0a1a1a" },
                        tipo_desconhecido:{ icon: "⚠️", color: "#ff8844", bg: "#1a1a0a" },
                      }[r._status] || { icon: "?", color: "#888", bg: "transparent" };
                      const isExcluido = r._status === "inferior" || r._status === "nao_encontrada" || r._status === "outro_tipo" || r._status === "tipo_desconhecido";
                      const tipoAlvo = r.tipoRecordeId ? recordes.find(t => t.id === r.tipoRecordeId) : null;
                      return (
                        <tr key={idx} style={{ borderBottom:"1px solid #1a1d2a", background: sc.bg, opacity: isExcluido ? 0.5 : 1 }}>
                          <td style={{ padding:"3px 4px", textAlign:"center" }}>
                            <span style={{ fontSize:11 }}>{sc.icon}</span>
                          </td>
                          <td style={{ padding:"3px 6px", fontSize:10 }}>
                            {tipoAlvo ? (
                              <span style={{ color:"#6ab4ff", fontWeight:600 }}>{tipoAlvo.sigla}</span>
                            ) : r._raw?.tipoRecorde ? (
                              <span style={{ color:"#ff8844" }}>⚠ {r._raw.tipoRecorde}</span>
                            ) : (
                              <span style={{ color:"#555" }}>{tipoAtivo?.sigla || "—"}</span>
                            )}
                          </td>
                          <td style={{ padding:"3px 6px" }}>
                            <span style={{ color: r._matched ? "#fff" : sc.color, fontWeight: r._matched ? 500 : 400 }}>
                              {r._raw?.prova || r.provaNome}
                            </span>
                            {r._matched && r.provaNome !== r._raw?.prova && (
                              <span style={{ color:"#7cfc7c", fontSize:9, marginLeft:4 }}>→ {r.provaNome}</span>
                            )}
                          </td>
                          <td style={{ padding:"3px 6px", textAlign:"center", color:"#aaa", fontSize:10 }}>{catObj ? catObj.nome : r.categoriaId}</td>
                          <td style={{ padding:"3px 6px", textAlign:"center", color: r.sexo === "M" ? "#1a6ef5" : "#e54f9b", fontWeight:600 }}>{r.sexo}</td>
                          <td style={{ padding:"3px 6px", fontWeight:700, textAlign:"center", color: r._status === "inferior" ? "#ff6b6b" : "#1976D2" }}>
                            {formatarMarca(r.marca, r.unidade, 3)}
                            {r._raw?.marca && <div style={{ color:"#555", fontSize:8, fontWeight:400 }}>← {r._raw.marca}</div>}
                          </td>
                          <td style={{ padding:"3px 6px", textAlign:"center", fontSize:10 }}>
                            {r._existente ? (
                              <span>
                                <span style={{ fontWeight:700, color: r._status === "inferior" ? "#7cfc7c" : "#ff8844" }}>{formatarMarca(r._existente.marca, r._existente.unidade || r.unidade, 3)}</span>
                                <div style={{ fontSize:8, color:"#555" }}>{RecordHelper.getAtletaTexto(r._existente)} ({RecordHelper.getAnoTexto(r._existente)})</div>
                              </span>
                            ) : <span style={{ color:"#333" }}>—</span>}
                          </td>
                          <td style={{ padding:"3px 6px", color:"#fff", fontSize:10 }}>{r.atleta}</td>
                          <td style={{ padding:"3px 6px", color:"#888", fontSize:10 }}>{r.equipe}</td>
                          <td style={{ padding:"3px 6px", color:"#888", textAlign:"center", fontSize:10 }}>{r.ano}</td>
                          <td style={{ padding:"3px 6px", fontSize:9, minWidth:140 }}>
                            {r._status === "incluir" && <span style={{ color:"#6ab4ff" }}>{r._fixedManually ? "✅ Corrigido" : "Será incluído"}</span>}
                            {r._status === "atualizar" && <span style={{ color:"#ffd700" }}>Supera recorde atual</span>}
                            {r._status === "inferior" && <span style={{ color:"#ff6b6b" }}>Recorde atual é melhor</span>}
                            {r._status === "tipo_desconhecido" && <span style={{ color:"#ff8844" }}>Tipo "{r._raw?.tipoRecorde}" não cadastrado</span>}
                            {(r._status === "nao_encontrada" || r._status === "outro_tipo") && (
                              <div>
                                <div style={{ color: r._status === "nao_encontrada" ? "#ff44ff" : "#44dddd", marginBottom:3 }}>
                                  {r._status === "nao_encontrada" ? "Prova não encontrada" : `Existe em "${r._outroSigla}"`}
                                </div>
                                <select
                                  style={{ fontSize:9, padding:"2px 4px", background:"#1a1c22", color:"#1976D2", border:"1px solid #3a3a5a", borderRadius:3, width:"100%", cursor:"pointer" }}
                                  value=""
                                  onChange={(e) => { if (e.target.value) fixPreviewProva(idx, e.target.value); }}
                                >
                                  <option value="">Selecionar prova...</option>
                                  {(() => {
                                    const nomes = [...new Set(_allProvas.map(p => p.nome))].sort();
                                    return nomes.map(nome => {
                                      const p = _allProvas.find(pr => pr.nome === nome);
                                      return <option key={p.id} value={p.id}>{nome}</option>;
                                    });
                                  })()}
                                </select>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {naoEncontradas > 0 && (
                <div style={{ fontSize:10, color:"#ff44ff", marginBottom:8, padding:"6px 10px", background:"#1a0a1a", borderRadius:4, lineHeight:1.5 }}>
                  ❌ <strong>{naoEncontradas} registro(s)</strong> com nome de prova não reconhecido. Use o nome exato do site (ex: "100m Rasos", "3.000m Obstáculos", "Salto em Distância").
                </div>
              )}
              {outroTipo > 0 && (
                <div style={{ fontSize:10, color:"#44dddd", marginBottom:8, padding:"6px 10px", background:"#0a1a1a", borderRadius:4, lineHeight:1.5 }}>
                  🔄 <strong>{outroTipo} registro(s)</strong> não reconhecidos aqui, mas existem em outro tipo de recorde. Considere importar nesse outro tipo.
                </div>
              )}
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <button style={{ ...styles.btnPrimary, opacity: paraImportar > 0 ? 1 : 0.5 }} onClick={confirmarImport} disabled={paraImportar === 0}>
                  ✅ Importar {paraImportar} registro(s)
                </button>
                <button style={styles.btnGhost} onClick={() => setImportPreview(null)}>Cancelar</button>
                {(inferiores + naoEncontradas + outroTipo) > 0 && (
                  <span style={{ fontSize:10, color:"#888" }}>
                    ({inferiores + naoEncontradas + outroTipo} não serão importados)
                  </span>
                )}
              </div>
            </div>
            );
          })()}

          {/* Formulário de edição de registro */}
          {editReg && isAdmin && (
            <div style={{ ...S.card, border:"2px solid #4a8aff" }}>
              <div style={{ color:"#6ab4ff", fontWeight:700, fontSize:13, marginBottom:10 }}>{editReg.id ? "Editar Registro" : "Novo Registro"}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {[
                  ["categoriaId", "Categoria", 120], ["sexo", "Sexo", 50], ["provaNome", "Prova", 150],
                  ["marca", "Marca", 80], ["atleta", "Atleta/Equipe", 180], ["equipe", "Equipe", 160],
                  ["ano", "Ano", 60], ["local", "Local", 160],
                ].map(([campo, label, w]) => (
                  <div key={campo}>
                    <label style={{ fontSize:10, color:"#888", display:"block" }}>{label}</label>
                    {campo === "sexo" ? (
                      <select style={{ ...S.inputSm, width: w }} value={editReg.sexo} onChange={e => setEditReg({ ...editReg, sexo: e.target.value })}>
                        <option value="M">M</option><option value="F">F</option>
                      </select>
                    ) : (
                      <input style={{ ...S.inputSm, width: w, color: campo === "marca" ? "#1976D2" : "#ccc" }}
                        value={editReg[campo] || ""} placeholder={label}
                        onChange={e => setEditReg({ ...editReg, [campo]: e.target.value })} />
                    )}
                  </div>
                ))}
              </div>
              {/* Atletas do revezamento */}
              {(() => {
                const provaObj = _allProvas.find(p => p.nome === editReg.provaNome || p.id === editReg.provaId);
                const isRevez = provaObj?.tipo === "revezamento" || (editReg.provaNome || "").match(/^[45]x\d/i);
                if (!isRevez) return null;
                const atlRevez = editReg.atletasRevezamento || ["", "", "", ""];
                return (
                  <div style={{ marginTop:8, padding:"8px 10px", background:"#0d0e14", borderRadius:6, border:"1px solid #1a2a3a" }}>
                    <label style={{ fontSize:10, color:"#1976D2", display:"block", marginBottom:4, fontWeight:700 }}>🏃 Atletas do Revezamento</label>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {[0,1,2,3].map(i => (
                        <input key={i} style={{ ...S.inputSm, width:160, color:"#ccc" }}
                          placeholder={`${i+1}º Atleta`}
                          value={atlRevez[i] || ""}
                          onChange={e => {
                            const novo = [...atlRevez];
                            novo[i] = e.target.value;
                            setEditReg({ ...editReg, atletasRevezamento: novo });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <button style={styles.btnPrimary} onClick={() => salvarRegistro(editReg)}>💾 Salvar</button>
                <button style={styles.btnGhost} onClick={() => setEditReg(null)}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div style={{ display:"flex", gap:10, marginBottom:12, alignItems:"center" }}>
            <div>
              <label style={{ fontSize:10, color:"#888" }}>Categoria:</label>
              <select style={{ ...S.inputSm, marginLeft:4, width:120 }} value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
                <option value="todas">Todas</option>
                {categoriasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:10, color:"#888" }}>Sexo:</label>
              <select style={{ ...S.inputSm, marginLeft:4, width:80 }} value={filtroSexo} onChange={e => setFiltroSexo(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
            </div>
            <span style={{ color:"#555", fontSize:11 }}>{registrosFiltrados.length} registros</span>
          </div>

          {/* Tabela de registros */}
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:"2px solid #2a3050", background:"#0a0b10" }}>
                  <th style={{ padding:"8px 10px", textAlign:"left", color:"#888", fontSize:10 }}>Prova</th>
                  <th style={{ padding:"8px 6px", color:"#888", fontSize:10 }}>Cat.</th>
                  <th style={{ padding:"8px 6px", color:"#888", fontSize:10 }}>Sexo</th>
                  <th style={{ padding:"8px 10px", color:"#1976D2", fontSize:10 }}>Marca</th>
                  <th style={{ padding:"8px 10px", textAlign:"left", color:"#888", fontSize:10 }}>Atleta</th>
                  <th style={{ padding:"8px 10px", textAlign:"left", color:"#888", fontSize:10 }}>Equipe</th>
                  <th style={{ padding:"8px 6px", color:"#888", fontSize:10 }}>Ano</th>
                  <th style={{ padding:"8px 10px", textAlign:"left", color:"#888", fontSize:10 }}>Local</th>
                  <th style={{ padding:"8px 6px", color:"#888", fontSize:10 }}>Fonte</th>
                  {isAdmin && <th style={{ padding:"8px 6px", color:"#888", fontSize:10 }}>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((r, idx) => {
                  const catObj = CATEGORIAS.find(c => c.id === r.categoriaId);
                  return (
                  <React.Fragment key={r.id || idx}>
                  <tr style={{ borderBottom: r.marcasComponentes ? "none" : "1px solid #1a1d2a", background: idx % 2 === 0 ? "transparent" : "#0a0b1099" }}>
                    <td style={{ padding:"6px 10px", color:"#fff", fontWeight:500 }}>
                      {r.provaNome}
                      {r.unidade === "pts" && <span style={{ fontSize:9, color:"#1976D2", marginLeft:4 }}>(pts)</span>}
                    </td>
                    <td style={{ padding:"6px 6px", color:"#aaa", textAlign:"center" }}>{catObj ? catObj.nome : r.categoriaId}</td>
                    <td style={{ padding:"6px 6px", textAlign:"center" }}>
                      <span style={{ color: r.sexo === "M" ? "#1a6ef5" : "#e54f9b", fontWeight:600 }}>{r.sexo}</span>
                    </td>
                    <td style={{ padding:"6px 10px", color:"#1976D2", fontWeight:700, textAlign:"center", fontSize:14 }}>{r.unidade === "pts" ? r.marca + " pts" : formatarMarca(r.marca, r.unidade, 3)}</td>
                    <td style={{ padding:"6px 10px", color:"#fff" }}>
                      {(() => {
                        const dets = RecordHelper.getDetentores(r);
                        if (dets.length === 0) return "—";
                        return dets.map((d, di) => (
                          <div key={di} style={di > 0 ? { borderTop:"1px dashed #2a2a3a", paddingTop:3, marginTop:3 } : {}}>
                            {d.atletasRevezamento && d.atletasRevezamento.filter(Boolean).length > 0 ? (
                              <><span>{d.atleta || d.equipe || "—"}</span>
                              <div style={{ fontSize:9, color:"#aaa", marginTop:1 }}>{d.atletasRevezamento.filter(Boolean).join(" · ")}</div></>
                            ) : (d.atleta || "—")}
                          </div>
                        ));
                      })()}
                      {RecordHelper.getDetentores(r).length > 1 && (
                        <span style={{ fontSize:9, color:"#ffaa44", marginLeft:4 }}>({RecordHelper.getDetentores(r).length} co-detentores)</span>
                      )}
                    </td>
                    <td style={{ padding:"6px 10px", color:"#888" }}>{RecordHelper.getEquipeTexto(r)}</td>
                    <td style={{ padding:"6px 6px", color:"#888", textAlign:"center" }}>{RecordHelper.getAnoTexto(r)}</td>
                    <td style={{ padding:"6px 10px", color:"#888" }}>{RecordHelper.getLocalTexto(r)}</td>
                    <td style={{ padding:"6px 6px", textAlign:"center" }}>
                      <span style={{ fontSize:9, padding:"2px 6px", borderRadius:3, fontWeight:600,
                        background: r.fonte === "auto" ? "#0a1a0a" : "#1a1a0a",
                        color: r.fonte === "auto" ? "#7cfc7c" : "#888",
                      }}>{r.fonte === "auto" ? "Auto" : "Manual"}</span>
                    </td>
                    {isAdmin && (
                      <td style={{ padding:"6px 6px", textAlign:"center" }}>
                        <button style={{ background:"none", border:"none", color:"#6ab4ff", cursor:"pointer", fontSize:11, marginRight:4 }}
                          onClick={async () => {
                            const d = RecordHelper.getPrimeiro(r);
                            setEditReg({ ...r, atleta: d.atleta, equipe: d.equipe, atletaId: d.atletaId, ano: d.ano, local: d.local,
                              competicaoId: d.competicaoId, competicaoNome: d.competicaoNome, atletasRevezamento: d.atletasRevezamento,
                              _coDetentores: (RecordHelper.getDetentores(r).length > 1) ? RecordHelper.getDetentores(r).slice(1) : null });
                          }}>✏️</button>
                        <button style={{ background:"none", border:"none", color:"#ff6b6b", cursor:"pointer", fontSize:11 }}
                          onClick={() => excluirRegistro(r.id)}>🗑</button>
                      </td>
                    )}
                  </tr>
                  {r.marcasComponentes && Object.keys(r.marcasComponentes).length > 0 && (
                    <tr style={{ borderBottom:"1px solid #1a1d2a", background: idx % 2 === 0 ? "#0a0d14" : "#0a0b1099" }}>
                      <td colSpan={isAdmin ? 10 : 9} style={{ padding:"2px 10px 6px 30px" }}>
                        <span style={{ fontSize:9, color:"#888" }}>
                          {Object.entries(r.marcasComponentes).map(([nome, m], ci) => {
                            const compProva = _allProvas.find(p => p.nome === nome);
                            const compUnid = compProva?.unidade || (parseFloat(m) > 30 ? "s" : "m");
                            return (
                            <span key={ci}>
                              {ci > 0 && " · "}
                              <span style={{ color:"#aaa" }}>{nome}:</span> <span style={{ color:"#1976D2", fontWeight:600 }}>{formatarMarca(m, compUnid, 3)}</span>
                            </span>
                            );
                          })}
                        </span>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                  );
                })}
                {registrosFiltrados.length === 0 && (
                  <tr><td colSpan={isAdmin ? 10 : 9} style={{ padding:20, textAlign:"center", color:"#555" }}>
                    Nenhum registro encontrado.{isAdmin ? " Adicione manualmente ou importe uma planilha." : ""}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>)}

      {/* ═══ ABA: PENDÊNCIAS (admin only) ═══ */}
      {abaRecordes === "pendencias" && isAdmin && (() => {
        const pendentes = (pendenciasRecorde || []).filter(p => p.status === "pendente");
        const resolvidas = (pendenciasRecorde || []).filter(p => p.status !== "pendente");
        const eventosComPend = [...new Set(pendentes.map(p => p.eventoId))];

        // Ordem de relevância para sort
        const ordemRel = { local: 0, atleta: 1, nacional: 2, mundial: 3, especial: 4, outro_estado: 5 };
        const sortPend = (a, b) => (ordemRel[a.relevancia] ?? 9) - (ordemRel[b.relevancia] ?? 9);

        const relBadge = (rel, uf) => {
          const cfg = {
            local:        { bg: "#0a2a0a", color: "#7cfc7c", border: "#2a5a2a", label: `📍 Local (${uf || "?"})` },
            atleta:       { bg: "#0a1a2a", color: "#44bbff", border: "#2a4a6a", label: `🏃 Atleta (${uf || "?"})` },
            nacional:     { bg: "#0a0a2a", color: "#6ab4ff", border: "#2a2a5a", label: "🏳️ Nacional" },
            mundial:      { bg: "#1a0a2a", color: "#c39bdf", border: "#4a2a5a", label: "🌍 Mundial" },
            especial:     { bg: "#1a1a0a", color: "#ffaa44", border: "#4a4a2a", label: "⭐ Especial" },
            outro_estado: { bg: "#1a1a1a", color: "#888",    border: "#3a3a3a", label: `🔄 Outro UF (${uf || "?"})` },
          }[rel] || { bg: "#1a1a1a", color: "#888", border: "#3a3a3a", label: rel };
          return <span style={{ fontSize:8, padding:"1px 5px", borderRadius:3, fontWeight:600,
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>;
        };

        const resolver = (pend, status, obs) => {
          setPendenciasRecorde(prev => prev.map(p => p.id !== pend.id ? p : {
            ...p, status, resolvidoPor: usuarioLogado?.nome || "admin", resolvidoEm: Date.now(), observacao: obs || p.observacao
          }));
          if (status === "homologado") {
            const { recordesAtualizados, novoHistorico } = RecordDetectionEngine.aplicarHomologacao(
              { ...pend, observacao: obs || pend.observacao }, recordes, usuarioLogado?.nome || "admin"
            );
            setRecordes(recordesAtualizados);
            setHistoricoRecordes(prev => [...prev, novoHistorico]);
          }
          const acaoNome = status === "homologado" ? "Homologou recorde" : status === "nao_homologado" ? "Rejeitou recorde" : "Resolveu recorde";
          if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, acaoNome, `${pend.atletaNome} — ${pend.provaNome} (${pend.recordeTipoSigla})`, null, { modulo: "recordes" });
        };

        const homologarLote = (lista, obs) => {
          let recsAtual = recordes;
          const novosHist = [];
          const ids = lista.map(p => p.id);
          lista.forEach(pend => {
            const { recordesAtualizados, novoHistorico } = RecordDetectionEngine.aplicarHomologacao(
              { ...pend, observacao: obs }, recsAtual, usuarioLogado?.nome || "admin"
            );
            recsAtual = recordesAtualizados;
            novosHist.push(novoHistorico);
          });
          setRecordes(recsAtual);
          setHistoricoRecordes(prev => [...prev, ...novosHist]);
          setPendenciasRecorde(prev => prev.map(p => ids.includes(p.id) ? {
            ...p, status: "homologado", resolvidoPor: usuarioLogado?.nome || "admin", resolvidoEm: Date.now(), observacao: obs
          } : p));
          if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, "Homologou recordes (lote)", `${lista.length} pendência(s) — ${lista[0]?.recordeTipoSigla || ""}`, null, { modulo: "recordes" });
        };

        return (
          <div>
            {pendentes.length === 0 ? (
              <div style={{ ...S.card, textAlign:"center", color:"#555" }}>
                <span style={{ fontSize:48 }}>✅</span>
                <p style={{ marginTop:8 }}>Nenhuma pendência de recorde para analisar.</p>
              </div>
            ) : (
              <>
                <div style={{ color:"#ffaa44", fontWeight:700, fontSize:14, marginBottom:12 }}>
                  ⏳ {pendentes.length} pendência(s) aguardando homologação
                </div>

                {/* Legenda de relevância */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14, padding:"8px 12px", background:"#0a0b10", borderRadius:6, border:"1px solid #1a1d2a" }}>
                  <span style={{ fontSize:10, color:"#666", lineHeight:"22px" }}>Relevância:</span>
                  {relBadge("local", "UF")}
                  {relBadge("atleta", "UF")}
                  {relBadge("nacional", "")}
                  {relBadge("mundial", "")}
                  {relBadge("especial", "")}
                  {relBadge("outro_estado", "UF")}
                </div>

                {eventosComPend.map(evtId => {
                  const pendsEvt = pendentes.filter(p => p.eventoId === evtId).sort(sortPend);
                  const locais = pendsEvt.filter(p => p.relevancia === "local");
                  const atletaRelevantes = pendsEvt.filter(p => p.relevancia === "atleta");
                  const nacionais = pendsEvt.filter(p => p.relevancia === "nacional");
                  const outroEstado = pendsEvt.filter(p => p.relevancia === "outro_estado");
                  const evtUf = pendsEvt[0]?.eventoUf || "";
                  return (
                    <div key={evtId} style={{ ...S.card, marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                        <div style={{ color:"#6ab4ff", fontWeight:700, fontSize:13 }}>
                          🏟️ {pendsEvt[0]?.eventoNome || evtId}
                          {evtUf && <span style={{ fontSize:10, color:"#888", marginLeft:8 }}>📍 {pendsEvt[0]?.eventoLocal || evtUf}</span>}
                        </div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {locais.length > 0 && (
                            <button onClick={async () => { 
                              if (!await confirmar(`Homologar ${locais.length } pendência(s) do estado local (${evtUf}) de uma vez?`)) return;
                              const obs = prompt("Observação para todas (opcional):", "") || "";
                              homologarLote(locais, obs);
                            }} style={{ padding:"4px 10px", borderRadius:4, border:"1px solid #2a5a2a", background:"#0a1a0a",
                              color:"#7cfc7c", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                              ✅ Homologar {locais.length} local ({evtUf})
                            </button>
                          )}
                          {atletaRelevantes.length > 0 && (() => { 
                            const ufsAtl = [...new Set(atletaRelevantes.map(p => p.recordeEstado).filter(Boolean))];
                            return (
                              <button onClick={async () => {
                                if (!await confirmar(`Homologar ${atletaRelevantes.length } pendência(s) de RE do estado do atleta (${ufsAtl.join(", ")}) de uma vez?`)) return;
                                const obs = prompt("Observação para todas (opcional):", "") || "";
                                homologarLote(atletaRelevantes, obs);
                              }} style={{ padding:"4px 10px", borderRadius:4, border:"1px solid #2a4a6a", background:"#0a1020",
                                color:"#44bbff", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                                ✅ Homologar {atletaRelevantes.length} atleta ({ufsAtl.join(", ")})
                              </button>
                            );
                          })()}
                          {nacionais.length > 0 && (
                            <button onClick={async () => { 
                              if (!await confirmar(`Homologar ${nacionais.length } pendência(s) nacionais de uma vez?`)) return;
                              const obs = prompt("Observação para todas (opcional):", "") || "";
                              homologarLote(nacionais, obs);
                            }} style={{ padding:"4px 10px", borderRadius:4, border:"1px solid #2a2a5a", background:"#0a0a1a",
                              color:"#6ab4ff", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                              ✅ Homologar {nacionais.length} nacionais
                            </button>
                          )}
                          {outroEstado.length > 0 && (
                            <button onClick={async () => { 
                              if (!await confirmar(`Rejeitar ${outroEstado.length } pendência(s) de outros estados? (competição ocorreu em ${evtUf})`)) return;
                              const obs = prompt("Motivo (opcional):", `Competição em ${evtUf}, não se aplica a este RE`) || `Competição em ${evtUf}`;
                              setPendenciasRecorde(prev => prev.map(p =>
                                outroEstado.some(o => o.id === p.id) ? { ...p, status: "nao_homologado", resolvidoPor: usuarioLogado?.nome || "admin", resolvidoEm: Date.now(), observacao: obs } : p
                              ));
                              if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, "Rejeitou recordes (lote)", `${outroEstado.length} pendência(s) outros UFs`, null, { modulo: "recordes" });
                            }} style={{ padding:"4px 10px", borderRadius:4, border:"1px solid #5a3a2a", background:"#1a0a0a",
                              color:"#ff8844", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                              ❌ Rejeitar {outroEstado.length} outros UFs
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ overflowX:"auto" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                        <thead>
                          <tr style={{ borderBottom:"2px solid #2a3050" }}>
                            <th style={{ padding:"6px 6px", color:"#888", fontSize:10 }}>Relev.</th>
                            <th style={{ padding:"6px 8px", textAlign:"left", color:"#888", fontSize:10 }}>Prova</th>
                            <th style={{ padding:"6px 4px", color:"#888", fontSize:10 }}>Cat.</th>
                            <th style={{ padding:"6px 4px", color:"#888", fontSize:10 }}>Sexo</th>
                            <th style={{ padding:"6px 8px", color:"#1976D2", fontSize:10 }}>Marca</th>
                            <th style={{ padding:"6px 8px", textAlign:"left", color:"#888", fontSize:10 }}>Atleta</th>
                            <th style={{ padding:"6px 8px", textAlign:"left", color:"#888", fontSize:10 }}>Recorde</th>
                            <th style={{ padding:"6px 8px", color:"#888", fontSize:10 }}>Atual</th>
                            <th style={{ padding:"6px 8px", color:"#888", fontSize:10 }}>Tipo</th>
                            <th style={{ padding:"6px 8px", color:"#888", fontSize:10 }}>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendsEvt.map(pend => {
                            const catObj = CATEGORIAS.find(c => c.id === pend.categoriaId);
                            return (
                              <tr key={pend.id} style={{ borderBottom:"1px solid #1a1d2a",
                                background: pend.relevancia === "local" ? "#0a120a" : pend.relevancia === "atleta" ? "#0a0f1a" : pend.relevancia === "outro_estado" ? "#0a0a0a" : "transparent" }}>
                                <td style={{ padding:"6px 6px", textAlign:"center" }}>
                                  {relBadge(pend.relevancia, pend.recordeEstado || pend.eventoUf)}
                                </td>
                                <td style={{ padding:"6px 8px", color:"#fff", fontWeight:500 }}>{pend.provaNome}</td>
                                <td style={{ padding:"6px 4px", color:"#aaa", textAlign:"center" }}>{catObj?.nome || pend.categoriaId}</td>
                                <td style={{ padding:"6px 4px", textAlign:"center" }}>
                                  <span style={{ color: pend.sexo === "M" ? "#1a6ef5" : "#e54f9b", fontWeight:600 }}>{pend.sexo}</span>
                                </td>
                                <td style={{ padding:"6px 8px", color:"#1976D2", fontWeight:700, textAlign:"center" }}>
                                  {formatarMarca(pend.marca, pend.unidade, 3)}
                                </td>
                                <td style={{ padding:"6px 8px", color:"#fff" }}>
                                  {pend.atletaNome}
                                  <div style={{ fontSize:9, color:"#888" }}>{pend.equipeNome}</div>
                                </td>
                                <td style={{ padding:"6px 8px", color:"#6ab4ff", fontWeight:600 }}>
                                  {pend.recordeTipoSigla}
                                  <div style={{ fontSize:9, color:"#555" }}>{pend.recordeTipoNome}</div>
                                </td>
                                <td style={{ padding:"6px 8px", textAlign:"center", color:"#888" }}>
                                  {pend.recordeAtual ? formatarMarca(pend.recordeAtual.marca, pend.unidade, 3) : "—"}
                                </td>
                                <td style={{ padding:"6px 8px", textAlign:"center" }}>
                                  <span style={{ fontSize:9, padding:"2px 6px", borderRadius:3, fontWeight:700,
                                    background: pend.tipoQuebra === "superou" ? "#1a2a0a" : pend.tipoQuebra === "igualou" ? "#1a1a2a" : "#0a1a0a",
                                    color: pend.tipoQuebra === "superou" ? "#7cfc7c" : pend.tipoQuebra === "igualou" ? "#6ab4ff" : "#ffaa44"
                                  }}>
                                    {pend.tipoQuebra === "superou" ? "⬆️ Superou" : pend.tipoQuebra === "igualou" ? "🤝 Igualou" : "🆕 Novo"}
                                  </span>
                                </td>
                                <td style={{ padding:"6px 8px", textAlign:"center" }}>
                                  <div style={{ display:"flex", gap:4, justifyContent:"center", flexWrap:"wrap" }}>
                                    <button onClick={async () => {
                                      const obs = prompt("Observação (opcional):", "");
                                      if (obs === null) return;
                                      resolver(pend, "homologado", obs);
                                    }} style={{ padding:"3px 8px", borderRadius:4, border:"1px solid #2a5a2a", background:"#0a1a0a",
                                      color:"#7cfc7c", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                                      ✅
                                    </button>
                                    <button onClick={async () => {
                                      const obs = prompt("Observação (opcional):", "");
                                      if (obs === null) return;
                                      setPendenciasRecorde(prev => prev.map(p => p.id !== pend.id ? p : {
                                        ...p, status: "homologado_nao_aplicado", resolvidoPor: usuarioLogado?.nome || "admin",
                                        resolvidoEm: Date.now(), observacao: obs }));
                                      if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, "Resolveu recorde (sem atualizar)", `${pend.atletaNome} — ${pend.provaNome} (${pend.recordeTipoSigla})`, null, { modulo: "recordes" });
                                    }} style={{ padding:"3px 8px", borderRadius:4, border:"1px solid #2a2a5a", background:"#0a0a1a",
                                      color:"#6ab4ff", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                                      ☑️
                                    </button>
                                    <button onClick={async () => {
                                      const obs = prompt("Motivo da rejeição:", "");
                                      if (obs === null) return;
                                      setPendenciasRecorde(prev => prev.map(p => p.id !== pend.id ? p : {
                                        ...p, status: "nao_homologado", resolvidoPor: usuarioLogado?.nome || "admin",
                                        resolvidoEm: Date.now(), observacao: obs }));
                                      if (registrarAcao) registrarAcao(usuarioLogado?.id, usuarioLogado?.nome, "Rejeitou recorde", `${pend.atletaNome} — ${pend.provaNome} (${pend.recordeTipoSigla})`, null, { modulo: "recordes" });
                                    }} style={{ padding:"3px 8px", borderRadius:4, border:"1px solid #5a2a2a", background:"#1a0a0a",
                                      color:"#ff6b6b", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                                      ❌
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Resolvidas */}
            {resolvidas.length > 0 && (
              <div style={{ marginTop:20 }}>
                <div style={{ color:"#555", fontWeight:700, fontSize:12, marginBottom:8 }}>
                  Resolvidas ({resolvidas.length})
                </div>
                <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10 }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid #2a3050" }}>
                      <th style={{ padding:"4px 6px", textAlign:"left", color:"#555" }}>Evento</th>
                      <th style={{ padding:"4px 6px", textAlign:"left", color:"#555" }}>Prova</th>
                      <th style={{ padding:"4px 6px", color:"#555" }}>Marca</th>
                      <th style={{ padding:"4px 6px", textAlign:"left", color:"#555" }}>Atleta</th>
                      <th style={{ padding:"4px 6px", color:"#555" }}>Recorde</th>
                      <th style={{ padding:"4px 6px", color:"#555" }}>Relev.</th>
                      <th style={{ padding:"4px 6px", color:"#555" }}>Status</th>
                      <th style={{ padding:"4px 6px", color:"#555" }}>Admin</th>
                      <th style={{ padding:"4px 6px", color:"#555" }}>Obs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolvidas.slice().reverse().map(p => (
                      <tr key={p.id} style={{ borderBottom:"1px solid #1a1d2a", opacity:0.7 }}>
                        <td style={{ padding:"4px 6px", color:"#888" }}>{p.eventoNome}</td>
                        <td style={{ padding:"4px 6px", color:"#aaa" }}>{p.provaNome}</td>
                        <td style={{ padding:"4px 6px", color:"#1976D2", textAlign:"center", fontWeight:600 }}>{formatarMarca(p.marca, p.unidade, 3)}</td>
                        <td style={{ padding:"4px 6px", color:"#aaa" }}>{p.atletaNome}</td>
                        <td style={{ padding:"4px 6px", color:"#6ab4ff", textAlign:"center" }}>{p.recordeTipoSigla}</td>
                        <td style={{ padding:"4px 6px", textAlign:"center" }}>{relBadge(p.relevancia, p.recordeEstado || p.eventoUf)}</td>
                        <td style={{ padding:"4px 6px", textAlign:"center" }}>
                          <span style={{ fontSize:9, padding:"1px 5px", borderRadius:3, fontWeight:600,
                            background: p.status === "homologado" ? "#0a1a0a" : p.status === "homologado_nao_aplicado" ? "#0a0a1a" : "#1a0a0a",
                            color: p.status === "homologado" ? "#7cfc7c" : p.status === "homologado_nao_aplicado" ? "#6ab4ff" : "#ff6b6b"
                          }}>
                            {p.status === "homologado" ? "✅" : p.status === "homologado_nao_aplicado" ? "☑️" : "❌"}
                          </span>
                        </td>
                        <td style={{ padding:"4px 6px", color:"#888" }}>{p.resolvidoPor}</td>
                        <td style={{ padding:"4px 6px", color:"#666", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis" }}>{p.observacao || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══ ABA: HISTÓRICO (admin only) ═══ */}
      {abaRecordes === "historico" && isAdmin && (() => {
        const hist = (historicoRecordes || []).slice().reverse();
        const _allProvasH = todasAsProvas();
        return (
          <div>
            {hist.length === 0 ? (
              <div style={{ ...S.card, textAlign:"center", color:"#555" }}>
                <span style={{ fontSize:48 }}>📜</span>
                <p style={{ marginTop:8 }}>Nenhuma alteração de recorde registrada.</p>
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid #2a3050" }}>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:"#888", fontSize:10 }}>Data</th>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:"#888", fontSize:10 }}>Recorde</th>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:"#888", fontSize:10 }}>Prova</th>
                    <th style={{ padding:"6px 4px", color:"#888", fontSize:10 }}>Ação</th>
                    <th style={{ padding:"6px 8px", color:"#888", fontSize:10 }}>Marca Ant.</th>
                    <th style={{ padding:"6px 8px", color:"#888", fontSize:10 }}>→</th>
                    <th style={{ padding:"6px 8px", color:"#888", fontSize:10 }}>Marca Nova</th>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:"#888", fontSize:10 }}>Anteriores</th>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:"#888", fontSize:10 }}>Novos</th>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:"#888", fontSize:10 }}>Evento</th>
                    <th style={{ padding:"6px 8px", color:"#888", fontSize:10 }}>Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {hist.map((h, idx) => {
                    const tipoRec = recordes.find(t => t.id === h.recordeTipoId);
                    const prova = _allProvasH.find(p => p.id === h.provaId);
                    const catObj = CATEGORIAS.find(c => c.id === h.categoriaId);
                    return (
                      <tr key={h.id || idx} style={{ borderBottom:"1px solid #1a1d2a", background: idx % 2 === 0 ? "transparent" : "#0a0b1099" }}>
                        <td style={{ padding:"6px 8px", color:"#888", fontSize:10 }}>
                          {h.dataEfetivacao ? new Date(h.dataEfetivacao).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td style={{ padding:"6px 8px", color:"#6ab4ff", fontWeight:600 }}>{tipoRec?.sigla || "—"}</td>
                        <td style={{ padding:"6px 8px", color:"#fff" }}>
                          {prova?.nome || h.provaId} <span style={{ color:"#555", fontSize:9 }}>{catObj?.nome} {h.sexo}</span>
                        </td>
                        <td style={{ padding:"6px 4px", textAlign:"center" }}>
                          <span style={{ fontSize:9, padding:"2px 5px", borderRadius:3, fontWeight:700,
                            background: h.tipoAcao === "superou" ? "#1a2a0a" : h.tipoAcao === "igualou" ? "#1a1a2a" : "#0a1a0a",
                            color: h.tipoAcao === "superou" ? "#7cfc7c" : h.tipoAcao === "igualou" ? "#6ab4ff" : "#ffaa44"
                          }}>
                            {h.tipoAcao === "superou" ? "⬆️" : h.tipoAcao === "igualou" ? "🤝" : "🆕"}
                          </span>
                        </td>
                        <td style={{ padding:"6px 8px", color:"#ff8844", textAlign:"center", fontWeight:600 }}>
                          {h.marcaAnterior ? formatarMarca(h.marcaAnterior, prova?.unidade || "s", 3) : "—"}
                        </td>
                        <td style={{ padding:"6px 8px", textAlign:"center", color:"#555" }}>→</td>
                        <td style={{ padding:"6px 8px", color:"#7cfc7c", textAlign:"center", fontWeight:700 }}>
                          {formatarMarca(h.marcaNova, prova?.unidade || "s", 3)}
                        </td>
                        <td style={{ padding:"6px 8px", color:"#888", fontSize:10 }}>
                          {(h.detentoresAnteriores || []).map(d => d.atleta).join(", ") || "—"}
                        </td>
                        <td style={{ padding:"6px 8px", color:"#fff", fontSize:10 }}>
                          {(h.detentoresNovos || []).map(d => d.atleta).join(", ") || "—"}
                        </td>
                        <td style={{ padding:"6px 8px", color:"#888", fontSize:10 }}>{h.eventoNome || "—"}</td>
                        <td style={{ padding:"6px 8px", color:"#888", fontSize:10 }}>{h.adminId || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        );
      })()}

    </div>
  );
}

export default TelaRecordes;
