/**
 * Formatadores de Tempo e Marca
 *
 * formatarTempo, formatarTempoMs, autoFormatTempo,
 * parseTempoPista, _parseDigitsPuros, _parseMinSeg, _marcaParaMs,
 * formatarMarca, normalizarMarca, exibirMarcaInput,
 * abreviarProva, nomeProvaHtml, NomeProvaComImplemento,
 * _getNascDisplay, _getCbat, _getAnoNasc,
 * _getEquipeIdAtleta, _getClubeAtleta,
 * _getLocalRecorde, _getLocalEventoDisplay,
 * emailJaCadastrado, validarCPF, validarCNPJ
 *
 * Extraído de App.jsx (linhas 2407–2817) — Etapa 3 da refatoração.
 */
import React from 'react';

function formatarTempo(valor, casas) {
  if (!valor && valor !== 0) return "—";
  const ms = parseFloat(valor);
  if (isNaN(ms)) return "—";
  const millis = ms >= 1000 ? ms : Math.round(ms * 1000);
  return formatarTempoMs(millis, casas);
}

// Formata milissegundos → ss,mm(m) / mm.ss,mm(m) / hh:mm.ss,mm(m)
// casas: 2 = centésimos (padrão), 3 = milésimos
function formatarTempoMs(ms, casas) {
  if (ms == null || isNaN(ms)) return "—";
  const c = casas || 2;
  const totalMs = Math.round(ms);
  const h       = Math.floor(totalMs / 3600000);
  const m       = Math.floor((totalMs % 3600000) / 60000);
  const s       = Math.floor((totalMs % 60000) / 1000);
  const millis  = totalMs % 1000;
  const msStr   = c === 3 ? String(millis).padStart(3, "0") : String(millis).padStart(3, "0").slice(0, 2);

  if (h > 0) {
    return `${h}:${String(m).padStart(2,"0")}.${String(s).padStart(2,"0")}.${msStr}`;
  }
  if (m > 0) {
    return `${m}.${String(s).padStart(2,"0")}.${msStr}`;
  }
  return `${s}.${msStr}`;
}

// Auto-formata string de dígitos puros para o padrão de tempo
// O usuário digita só números e o sistema enquadra:
//  3 dígitos ou menos: 0.XXX (milésimos)
//  4 dígitos: s.mmm        ex: 1850  → 1.850
//  5 dígitos: ss.mmm       ex: 10850 → 10.850
//  6 dígitos: mss.mmm      ex: 12345 → 1.23.450 (com pad)  /  123450 → 1.23.450
//  7 dígitos: mmssmmm      ex: 1234567 → 12.34.567
//  8 dígitos: hmmssmmm     ex: 10230500 → 1:02.30.500
//  9 dígitos: hhmmssmmm    ex: 110230500 → 11:02.30.500
function autoFormatTempo(digits) {
  const d = digits.padStart(3, "0");
  const len = d.length;

  if (len <= 5) {
    // ss.mmm — últimos 3 são milésimos, resto são segundos
    const mmm = d.slice(-3);
    const ss  = d.slice(0, -3) || "0";
    return `${parseInt(ss)}.${mmm}`;
  }
  if (len <= 7) {
    // mmssmmm — últimos 3 milésimos, 2 antes segundos, resto minutos
    const mmm = d.slice(-3);
    const ss  = d.slice(-5, -3);
    const mm  = d.slice(0, -5) || "0";
    return `${parseInt(mm)}.${ss}.${mmm}`;
  }
  // hhmmssmmm — últimos 3 milésimos, 2 antes segundos, 2 antes minutos, resto horas
  const mmm = d.slice(-3);
  const ss  = d.slice(-5, -3);
  const min = d.slice(-7, -5);
  const hh  = d.slice(0, -7) || "0";
  return `${parseInt(hh)}:${min}.${ss}.${mmm}`;
}

// Parseia entrada do usuário para milissegundos
// Aceita dígitos puros (10850) ou formatado (10.850 / 1.23.450 / 1:02.30.500)
// Retrocompatível com vírgula: 10,850 / 1.23,450 / 1:02.30,500
// Aceita também h:mm:ss.mmm (ex: 1:26:00.510)
function parseTempoPista(str) {
  if (str == null || str === "") return null;
  const s = String(str).trim();

  // Se é só dígitos puros → interpreta pela quantidade
  if (/^\d+$/.test(s)) {
    return _parseDigitsPuros(s);
  }

  // Formato h:mm:ss.mmm ou h:mm:ss,mmm (dois pontos duplos)
  const hmsMatch = s.match(/^(\d+):(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/);
  if (hmsMatch) {
    const h = parseInt(hmsMatch[1]) || 0;
    const m = parseInt(hmsMatch[2]) || 0;
    const sec = parseInt(hmsMatch[3]) || 0;
    const frac = hmsMatch[4] ? parseInt(hmsMatch[4].padEnd(3, "0").slice(0, 3)) : 0;
    return (h * 3600000) + (m * 60000) + (sec * 1000) + frac;
  }

  // Se tem ":" → h:mm.ss.mmm ou h:mm.ss,mmm
  if (s.includes(":")) {
    const [horaStr, resto] = s.split(":");
    const horas = parseInt(horaStr) || 0;
    const msResto = _parseMinSeg(resto);
    return msResto !== null ? (horas * 3600000) + msResto : null;
  }

  return _parseMinSeg(s);
}

// Parseia dígitos puros pela quantidade
function _parseDigitsPuros(digits) {
  const d = digits.padStart(3, "0");
  const len = d.length;

  if (len <= 5) {
    const mmm = parseInt(d.slice(-3)) || 0;
    const ss  = parseInt(d.slice(0, -3)) || 0;
    return (ss * 1000) + mmm;
  }
  if (len <= 7) {
    const mmm = parseInt(d.slice(-3)) || 0;
    const ss  = parseInt(d.slice(-5, -3)) || 0;
    const mm  = parseInt(d.slice(0, -5)) || 0;
    return (mm * 60000) + (ss * 1000) + mmm;
  }
  const mmm = parseInt(d.slice(-3)) || 0;
  const ss  = parseInt(d.slice(-5, -3)) || 0;
  const min = parseInt(d.slice(-7, -5)) || 0;
  const hh  = parseInt(d.slice(0, -7)) || 0;
  return (hh * 3600000) + (min * 60000) + (ss * 1000) + mmm;
}

// Converte milissegundos → string de dígitos puros (inverso de _parseDigitsPuros)
// Ex: 4812350 ms → "12012350" (1h 20m 12s 350ms)
function msParaDigitos(ms) {
  if (ms == null || isNaN(ms)) return "";
  const totalMs = Math.round(ms);
  const h   = Math.floor(totalMs / 3600000);
  const m   = Math.floor((totalMs % 3600000) / 60000);
  const s   = Math.floor((totalMs % 60000) / 1000);
  const mil = totalMs % 1000;
  const milStr = String(mil).padStart(3, "0");
  if (h > 0) {
    return `${h}${String(m).padStart(2,"0")}${String(s).padStart(2,"0")}${milStr}`;
  }
  if (m > 0) {
    return `${m}${String(s).padStart(2,"0")}${milStr}`;
  }
  return `${s}${milStr}`;
}

// Parseia "mm.ss.mmm" ou "ss.mmm" → milissegundos
// Retrocompatível: aceita vírgula como separador decimal legado (mm.ss,mmm / ss,mmm)
function _parseMinSeg(str) {
  if (str == null || str === "") return null;
  let s = String(str).trim();

  // Formato legado com vírgula: mm.ss,mmm ou ss,mmm
  if (s.includes(",")) {
    let milliStr = "0";
    const idx = s.indexOf(",");
    milliStr = s.slice(idx + 1);
    s = s.slice(0, idx);
    const millis = parseInt(milliStr.padEnd(3, "0").slice(0, 3)) || 0;
    if (s.includes(".")) {
      const [minPart, secPart] = s.split(".");
      return (parseInt(minPart) || 0) * 60000 + (parseInt(secPart) || 0) * 1000 + millis;
    }
    return (parseInt(s) || 0) * 1000 + millis;
  }

  // Formato novo: mm.ss.mmm ou ss.mmm (tudo com ponto)
  const parts = s.split(".");
  if (parts.length === 3) {
    // mm.ss.mmm
    const minutos  = parseInt(parts[0]) || 0;
    const segundos = parseInt(parts[1]) || 0;
    const millis   = parseInt(parts[2].padEnd(3, "0").slice(0, 3)) || 0;
    return (minutos * 60000) + (segundos * 1000) + millis;
  }
  if (parts.length === 2) {
    // ss.mmm
    const segundos = parseInt(parts[0]) || 0;
    const millis   = parseInt(parts[1].padEnd(3, "0").slice(0, 3)) || 0;
    return (segundos * 1000) + millis;
  }

  const segundos = parseInt(s) || 0;
  return (segundos * 1000);
}

// Normaliza qualquer marca de tempo para milissegundos (para comparações)
// Aceita: ms (10001), segundos (10.100), formato com vírgula (10,100)
function _marcaParaMs(marca) {
  if (marca == null) return null;
  const s = String(marca).trim();
  if (!s) return null;
  // Dígitos puros → usa parseTempoPista (interpreta ex: "10100" como 10s100ms = 10100ms)
  if (/^\d+$/.test(s)) {
    const via = parseTempoPista(s);
    if (via != null && via > 0) return via;
  }
  // Com separadores → parseFloat (ex: "10.100" = 10.1 seg, "10,100" = 10.1 seg)
  const n = parseFloat(s.replace(",", "."));
  if (isNaN(n)) return null;
  return n >= 1000 ? Math.round(n) : Math.round(n * 1000);
}

function formatarMarca(valor, unidade, casas) {
  if (!valor && valor !== 0) return "—";
  // Status especiais: DNS, DNF, NM, DQ
  var vs = String(valor).trim().toUpperCase();
  if (vs === "DNS" || vs === "DNF" || vs === "NM" || vs.startsWith("DQ")) return vs;
  if (unidade === "m") return parseFloat(valor).toFixed(2).replace(".", ",") + "m";
  return formatarTempo(valor, casas);
}

// Detecta se há empates no centésimo entre marcas de tempo
// marcas: array de números (ms) — retorna true se algum par tem mesmo centésimo
function _temEmpateCentesimal(marcas) {
  if (!marcas || marcas.length < 2) return false;
  const cents = new Set();
  for (let i = 0; i < marcas.length; i++) {
    if (marcas[i] == null || isNaN(marcas[i])) continue;
    const c = Math.floor(Math.round(parseFloat(marcas[i])) / 10); // centésimos
    if (cents.has(c)) return true;
    cents.add(c);
  }
  return false;
}

// Retorna Set de marcas (em ms) que precisam de milésimos para diferenciar de outra marca
function _marcasComEmpateCentesimal(marcas) {
  const empatados = new Set();
  if (!marcas || marcas.length < 2) return empatados;
  const byCent = {};
  marcas.forEach((m, i) => {
    if (m == null || isNaN(m)) return;
    const raw = Math.round(parseFloat(m));
    const c = Math.floor(raw / 10);
    if (!byCent[c]) byCent[c] = [];
    byCent[c].push(raw);
  });
  Object.values(byCent).forEach(arr => {
    if (arr.length >= 2) arr.forEach(v => empatados.add(v));
  });
  return empatados;
}

// Formata marca para exibição: sempre 2 casas, com (3 casas) entre parênteses para empates ou recordes
// marcaRaw: valor numérico ou string da marca
// unidade: "s", "m", "pts"
// msEmpatados: Set de valores em ms que estão empatados no centésimo
// superouRecorde: boolean — se esta marca superou um recorde
function formatarMarcaExibicao(marcaRaw, unidade, msEmpatados, superouRecorde) {
  if (marcaRaw == null || marcaRaw === "") return "—";
  const str = String(marcaRaw);
  if (["DNS","DNF","DQ","NM"].includes(str)) return str;
  if (unidade !== "s") return formatarMarca(marcaRaw, unidade, 2);
  const marca2 = formatarMarca(marcaRaw, "s", 2);
  const marca3 = formatarMarca(marcaRaw, "s", 3);
  const num = parseFloat(marcaRaw);
  if (isNaN(num)) return marca2;
  const ms = Math.round(num >= 1000 ? num : num * 1000);
  const mostrar3 = (msEmpatados && msEmpatados.has(ms)) || superouRecorde;
  if (mostrar3 && marca2 !== marca3) return `${marca2} (${marca3})`;
  return marca2;
}

// Versão HTML para impressão
function formatarMarcaExibicaoHtml(marcaRaw, unidade, msEmpatados, superouRecorde) {
  if (marcaRaw == null || marcaRaw === "") return "\u2014";
  const str = String(marcaRaw);
  if (["DNS","DNF","DQ","NM"].includes(str)) return `<span style="color:#c33">${str}</span>`;
  if (unidade !== "s") return formatarMarca(marcaRaw, unidade, 2);
  const marca2 = formatarMarca(marcaRaw, "s", 2);
  const marca3 = formatarMarca(marcaRaw, "s", 3);
  const num = parseFloat(marcaRaw);
  if (isNaN(num)) return marca2;
  const ms = Math.round(num >= 1000 ? num : num * 1000);
  const mostrar3 = (msEmpatados && msEmpatados.has(ms)) || superouRecorde;
  if (mostrar3 && marca2 !== marca3) return `${marca2} <span style="font-size:7px;color:#555">(${marca3})</span>`;
  return marca2;
}

// Abrevia nome de prova para headers compactos (combinadas)
function abreviarProva(nome) {
  if (!nome) return "—";
  const n = nome.trim();
  // Barreiras: "60m c/ Barreiras" → "60m c/B", "110m c/ Barreiras" → "110m c/B"
  const barr = n.match(/^(\d+)m\s+c\/\s*Barreira/i);
  if (barr) return barr[1] + "m c/B";
  // Rasos: "100m Rasos" → "100m"
  const rasos = n.match(/^(\d+)m\s+Rasos/i);
  if (rasos) return rasos[1] + "m";
  // Metragem simples: "400m", "800m", "1.500m"
  const metros = n.match(/^([\d.]+)m$/i);
  if (metros) return metros[1].replace(/\./g, "") + "m";
  // Saltos
  if (/Dist[aâ]ncia/i.test(n)) return "Dist";
  if (/Altura/i.test(n)) return "Alt";
  if (/Vara/i.test(n)) return "Vara";
  if (/Triplo/i.test(n)) return "Trip";
  // Arremesso/Lançamentos
  if (/Peso/i.test(n)) return "Peso";
  if (/Disco/i.test(n)) return "Disco";
  if (/Dardo/i.test(n)) return "Dardo";
  if (/Martelo/i.test(n)) return "Mart";
  // Fallback: primeira palavra
  return n.split(" ")[0];
}

// Resolve nascimento para exibição (data completa formatada ou ano)
function _getNascDisplay(atleta) {
  if (!atleta) return "";
  // Tenta todos os nomes de campo possíveis
  var dn = atleta.dataNasc || atleta.dataNascimento || atleta.data_nasc || atleta.nascimento || "";
  if (dn) {
    var s = String(dn);
    // Formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      var parts = s.split("-");
      return parts[2].substring(0,2) + "/" + parts[1] + "/" + parts[0];
    }
    // Formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) return s;
    // Formato ISO com T
    if (s.includes("T")) {
      var d = s.split("T")[0].split("-");
      if (d.length === 3) return d[2] + "/" + d[1] + "/" + d[0];
    }
    return s;
  }
  var an = atleta.anoNasc || atleta.ano_nasc || "";
  if (an) return String(an);
  return "";
}

// Resolve nº CBAt para exibição
function _getCbat(atleta) {
  if (!atleta) return "";
  return atleta.cbat || atleta.numeroCbat || atleta.nCbat || atleta.registro || atleta.numCbat || "";
}

// Resolve ano de nascimento (para cálculos de categoria)
function _getAnoNasc(atleta) {
  if (!atleta) return "";
  if (atleta.anoNasc) return atleta.anoNasc;
  if (atleta.dataNasc) return atleta.dataNasc.split("-")[0];
  return "";
}

// Resolve equipeId do atleta (por equipeId direto ou pelo nome do clube)
function _getEquipeIdAtleta(atleta, equipes) {
  if (!atleta) return null;
  if (atleta.equipeId) return atleta.equipeId;
  if (atleta.clube && Array.isArray(equipes)) {
    var clubeLow = atleta.clube.toLowerCase();
    var eq = equipes.find(function(e) {
      return e.nome === atleta.clube || e.sigla === atleta.clube ||
             (e.nome && e.nome.toLowerCase() === clubeLow);
    });
    if (eq) return eq.id;
    // Retorna id virtual para clubes sem equipe cadastrada
    return "clube_" + atleta.clube;
  }
  return null;
}

// Resolve nome da equipe/clube para exibição
// Prioridade: equipes[atleta.equipeId].nome → atleta.clube → ""
// Retorna "Cidade - UF" do evento para usar nos registros de recordes
// Fallback: usa o campo local se cidade/uf não existirem (eventos antigos)
// ─── Validação de email único cross-tipo ─────────────────────────────────────
function emailJaCadastrado(email, { organizadores=[], equipes=[], atletasUsuarios=[], funcionarios=[], treinadores=[] }, excluirId=null) {
  if (!email) return false;
  const norm = email.trim().toLowerCase();
  const todos = [...organizadores, ...equipes, ...atletasUsuarios, ...funcionarios, ...treinadores];
  return todos.some(u => u.email && u.email.trim().toLowerCase() === norm && u.id !== excluirId);
}


function _getLocalRecorde(evento) {
  if (!evento) return "—";
  if (evento.cidade && evento.uf) return `${evento.cidade} - ${evento.uf}`;
  if (evento.cidade) return evento.cidade;
  return evento.local || "—";
}

// Retorna local completo para exibição: "Local, Cidade - UF" ou "Local" (eventos antigos)
function _getLocalEventoDisplay(evento) {
  if (!evento) return "—";
  const inst = evento.local || "";
  const cidUf = (evento.cidade && evento.uf) ? `${evento.cidade} - ${evento.uf}`
    : evento.cidade ? evento.cidade : "";
  if (inst && cidUf) return `${inst}, ${cidUf}`;
  if (cidUf) return cidUf;
  return inst || "—";
}

function _getClubeAtleta(atleta, equipes) {
  if (!atleta) return "";
  if (atleta.equipeId && Array.isArray(equipes)) {
    var eq = equipes.find(function(e) { return e.id === atleta.equipeId; });
    if (eq) return eq.nome || eq.clube || "";
  }
  if (atleta.clube) return atleta.clube;
  return "";
}

// Normaliza entrada de marca (campo): aceita vírgula ou ponto, armazena com ponto
function normalizarMarca(val) {
  if (val == null) return "";
  return String(val).replace(",", ".");
}

// Formata marca de campo para exibição em inputs: ponto → vírgula
function exibirMarcaInput(val) {
  if (val == null || val === "") return "";
  return String(val).replace(".", ",");
}

// Destaca o implemento entre parênteses no nome da prova (React)
function NomeProvaComImplemento({ nome, style = {} }) {
  const match = nome ? nome.match(/^(.+?)(\s*\(.+\))$/) : null;
  if (!match) return <span style={style}>{nome}</span>;
  return (
    <span style={style}>
      {match[1]}
      <span style={{ color: "#1976D2", fontWeight: 700 }}>{match[2]}</span>
    </span>
  );
}

// ─── Validação de CPF e CNPJ ────────────────────────────────────────────────
function validarCPF(cpf) {
  const nums = (cpf || "").replace(/\D/g, "");
  if (nums.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(nums)) return false; // todos iguais
  const calc = (len) => {
    let soma = 0;
    for (let i = 0; i < len; i++) soma += parseInt(nums[i]) * (len + 1 - i);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return calc(9) === parseInt(nums[9]) && calc(10) === parseInt(nums[10]);
}

function formatarCNPJ(cnpj) {
  const nums = (cnpj || "").replace(/\D/g, "");
  if (nums.length !== 14) return cnpj || "";
  return `${nums.slice(0,2)}.${nums.slice(2,5)}.${nums.slice(5,8)}/${nums.slice(8,12)}-${nums.slice(12)}`;
}

function validarCNPJ(cnpj) {
  const nums = (cnpj || "").replace(/\D/g, "");
  if (nums.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(nums)) return false; // todos iguais
  const pesos1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  const pesos2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  const calc = (pesos) => {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) soma += parseInt(nums[i]) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return calc(pesos1) === parseInt(nums[12]) && calc(pesos2) === parseInt(nums[13]);
}

// Destaca o implemento entre parênteses no nome da prova (HTML string para impressão)
function nomeProvaHtml(nome) {
  if (!nome) return "";
  const m = nome.match(/^(.+?)(\s*\(.+\))$/);
  if (!m) return nome;
  return `${m[1]}<span style="color:#FFD700;font-weight:900">${m[2]}</span>`;
}

/**
 * resolverAtleta — retorna dados do atleta congelados (snapshot) para eventos finalizados,
 * ou dados vivos do cadastro para eventos ativos.
 * O objeto retornado tem a mesma forma de um atleta normal para compatibilidade downstream.
 */
function resolverAtleta(atletaId, atletas, evento) {
  var snap = evento && evento.competicaoFinalizada && evento.snapshotAtletas && evento.snapshotAtletas[atletaId];
  var atl = Array.isArray(atletas) ? atletas.find(function(a) { return a.id === atletaId; }) : null;
  if (snap) {
    // Retorna objeto com shape de atleta + campos extras do snapshot
    return Object.assign({}, atl || {}, {
      id: atletaId,
      nome: snap.nome || (atl && atl.nome) || "—",
      clube: snap.clube || (atl && atl.clube) || "",
      equipeId: snap.equipeId || (atl && atl.equipeId) || null,
      anoNasc: snap.anoNasc || (atl && atl.anoNasc) || "",
      dataNasc: snap.dataNasc || (atl && atl.dataNasc) || "",
      sexo: snap.sexo || (atl && atl.sexo) || "",
      cbat: snap.cbat || (atl && atl.cbat) || "",
      _siglaEquipe: snap._siglaEquipe || "",
      _snapshotAtivo: true,
    });
  }
  return atl || null;
}

// Máscara fixa de tempo para digitação de resultados de pista
// Formato único para todas as provas: h:mm.ss.mmm (8 slots)
// Permite ao organizador inserir até horas em qualquer prova
function getMascaraTempo(metros) {
  return { template: "_:__.__.___", slots: 8 };
}

function aplicarMascaraTempo(digits, metros) {
  const { template, slots } = getMascaraTempo(metros);
  const d = digits.slice(0, slots).padStart(slots, "_");
  let result = "";
  let di = 0;
  for (let ci = 0; ci < template.length; ci++) {
    if (template[ci] === "_") {
      result += d[di++];
    } else {
      result += template[ci];
    }
  }
  return result;
}

/** Formata número de peito com zero à esquerda (01–09, 10, 11…) */
function formatarPeito(n) {
  if (n === "" || n == null) return "";
  const v = Number(n);
  return isNaN(v) ? "" : String(v).padStart(2, "0");
}

export {
  formatarPeito,
  formatarTempo, formatarTempoMs, autoFormatTempo,
  getMascaraTempo, aplicarMascaraTempo,
  parseTempoPista, _parseDigitsPuros, _parseMinSeg, _marcaParaMs, msParaDigitos,
  formatarMarca, _temEmpateCentesimal, _marcasComEmpateCentesimal,
  formatarMarcaExibicao, formatarMarcaExibicaoHtml,
  normalizarMarca, exibirMarcaInput,
  abreviarProva, nomeProvaHtml, NomeProvaComImplemento,
  _getNascDisplay, _getCbat, _getAnoNasc,
  _getEquipeIdAtleta, _getClubeAtleta,
  _getLocalRecorde, _getLocalEventoDisplay,
  emailJaCadastrado, validarCPF, validarCNPJ, formatarCNPJ,
  resolverAtleta
};
