import { _getClubeAtleta, _getLocalEventoDisplay, _getNascDisplay, _getCbat, nomeProvaHtml } from "../../shared/formatters/utils";
import { GT_DEFAULT_LOGO } from "../../shared/branding";
import { getFasesProva } from "../../shared/constants/fases";

// ─── GERADOR DE HTML DE IMPRESSÃO ─────────────────────────────────────────────
function gerarHtmlImpressao(sumulas, evento, _atletas, _resultados, orientMap = {}, numPeito = {}, equipes = [], recordesAll = [], opts = {}) {
  const getClubeAtleta = (a) => _getClubeAtleta(a, equipes);
  // Ler branding personalizado (ou usar padrão)
  const _branding = (() => { try { return JSON.parse(localStorage.getItem("gt_branding")) || {}; } catch { return {}; } })();
  const _gtLogo = _branding.logo || GT_DEFAULT_LOGO;
  const dataGeracao = new Date().toLocaleString("pt-BR");
  const dataEvento  = new Date(evento.data + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
  const labelSexo = (s) => s === "M" ? "MASCULINO" : "FEMININO";
  const corSexo   = (s) => s === "M" ? "#1a56cc" : "#cc1a7a";

  const fmtNasc = (a) => _getNascDisplay(a) || "\u2014";
  const excTag = (insc) => insc && insc.permissividade
    ? `<sup style="color:#1976D2;font-size:9px;font-weight:800" title="${insc.permissividade}">*</sup>`
    : "";
  // compatibilidade: resultado pode ser número (legado) ou objeto {marca, raia, vento, t1..t6}
  const getMarca = (r) => {
    if (r == null) return null;
    if (typeof r === "object") return r.marca ?? null;
    return r;
  };
  const getRaia  = (r) => (r != null && typeof r === "object") ? (r.raia  ?? "") : "";
  const getVento = (r) => (r != null && typeof r === "object") ? (r.vento ?? "") : "";

  // Desempate em campo: compara sequências de melhores marcas posição a posição
  const seqCampo = (r) => {
    if (r == null) return [];
    const obj = typeof r === "object" ? r : { marca: r };
    return [obj.t1,obj.t2,obj.t3,obj.t4,obj.t5,obj.t6]
      .map(v => { const n = parseFloat(v); return isNaN(n) ? null : n; })
      .filter(n => n !== null)
      .sort((a, b) => b - a);
  };
  const cmpCampo = (ra, rb) => {
    const sa = seqCampo(ra), sb = seqCampo(rb);
    const len = Math.max(sa.length, sb.length);
    for (let i = 0; i < len; i++) {
      const va = sa[i] ?? -Infinity, vb = sb[i] ?? -Infinity;
      if (va > vb) return -1;
      if (va < vb) return  1;
    }
    return 0;
  };

  const fmtMarca = (v, unidade, casas) => {
    if (v == null || v === "") return "\u2014";
    if (unidade === "m") {
      const n = parseFloat(v);
      return n.toFixed(2).replace(".",",") + "m";
    }
    const raw = parseFloat(v);
    if (isNaN(raw)) return "\u2014";
    const c = casas || 2;
    const totalMs = Math.round(raw >= 1000 ? raw : raw * 1000);
    const h = Math.floor(totalMs / 3600000);
    const m = Math.floor((totalMs % 3600000) / 60000);
    const s = Math.floor((totalMs % 60000) / 1000);
    const millis = totalMs % 1000;
    const msPart = c === 3 ? String(millis).padStart(3, "0") : String(millis).padStart(3, "0").slice(0, 2);
    if (h > 0) return `${h}:${String(m).padStart(2,"0")}.${String(s).padStart(2,"0")},${msPart}`;
    if (m > 0) return `${m}.${String(s).padStart(2,"0")},${msPart}`;
    return `${s},${msPart}`;
  };

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Barlow',sans-serif;background:#ebebeb;color:#111;font-size:12px;}
    .barra{position:fixed;top:0;left:0;right:0;z-index:999;background:#0D0E12;
      border-bottom:2px solid #1976D2;padding:12px 24px;
      display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
    .barra-titulo{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;color:#1976D2;letter-spacing:1px;}
    .barra-sub{font-size:11px;color:#666;margin-top:2px;}
    .barra-acoes{display:flex;gap:10px;align-items:center;}
    .btn-imp{background:linear-gradient(135deg,#1976D2,#1565C0);color:#fff;border:none;
      padding:10px 28px;border-radius:8px;cursor:pointer;
      font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;letter-spacing:1px;}
    .btn-imp:hover{filter:brightness(1.1);}
    .btn-fch{background:transparent;color:#888;border:1px solid #333;
      padding:10px 20px;border-radius:8px;cursor:pointer;font-size:13px;}
    .badge-tot{background:#1976D222;color:#1976D2;border:1px solid #1976D244;
      border-radius:20px;padding:4px 14px;font-size:12px;font-weight:600;}
    .conteudo{padding-top:74px;}
    .pg{background:#fff;width:210mm;min-height:297mm;margin:16px auto;
      padding:12mm 15mm 10mm;display:flex;flex-direction:column;
      page-break-after:always;box-shadow:0 4px 24px rgba(0,0,0,.2);}
    .pg.landscape{width:297mm;min-height:210mm;padding:10mm 12mm 8mm;}
    .cab{display:flex;align-items:flex-start;justify-content:space-between;
      padding-bottom:7px;margin-bottom:7px;border-bottom:3px solid #111;gap:10px;}
    .cab-logo{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;
      color:#111;letter-spacing:2px;white-space:nowrap;display:flex;align-items:center;gap:6px;}
    .cab-logo img{max-height:28mm;max-width:45mm;object-fit:contain;}
    .cab-left{display:flex;align-items:center;min-width:45mm;}
    .cab-left img{max-height:28mm;max-width:45mm;object-fit:contain;}
    .cab-c{flex:1;text-align:center;}
    .cab-ev{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;
      color:#111;text-transform:uppercase;letter-spacing:.5px;line-height:1.2;}
    .cab-dt{font-size:10px;color:#555;margin-top:3px;}
    .cab-n{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;
      color:#888;text-align:right;white-space:nowrap;}
    .cab-nbig{font-size:20px;font-weight:900;color:#bbb;display:block;line-height:1.1;}
    .faixa{background:#111;padding:7px 13px;border-radius:3px 3px 0 0;
      display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
    .faixa-nome{font-family:'Barlow Condensed',sans-serif;font-size:22px;
      font-weight:900;letter-spacing:1px;color:#FFD700;}
    .faixa-meta{display:flex;gap:6px;align-items:center;flex-wrap:wrap;}
    .b-cat{background:rgba(255,215,0,.13);color:#FFD700;border:1px solid rgba(255,215,0,.4);
      border-radius:3px;padding:1px 8px;font-size:11px;font-weight:700;font-family:'Barlow Condensed',sans-serif;}
    .b-sx{border-radius:3px;padding:1px 8px;font-size:11px;font-weight:700;font-family:'Barlow Condensed',sans-serif;}
    .b-info{background:rgba(255,255,255,.09);color:#ccc;border:1px solid rgba(255,255,255,.13);
      border-radius:3px;padding:1px 8px;font-size:10px;}
    .blk{padding:5px 13px;font-family:'Barlow Condensed',sans-serif;font-size:12px;
      font-weight:800;letter-spacing:1px;text-transform:uppercase;
      display:flex;justify-content:space-between;align-items:center;}
    .blk-semi{background:#444;color:#ddd;}
    .blk-final{background:#111;color:#FFD700;}
    .blk-parc{background:#2a4a1a;color:#aad066;}
    .blk-cfin{background:#1a2a0a;color:#FFD700;border-top:2px solid #FFD70033;}
    .blk-exc{background:#1c1c1c;color:#666;font-size:10px;}
    .blk-s{font-size:10px;font-weight:400;}
    .gap{height:5px;}
    table{width:100%;border-collapse:collapse;border:1px solid #ccc;}
    thead tr{background:#222;color:#fff;}
    th{padding:5px 4px;font-size:9px;font-weight:700;font-family:'Barlow Condensed',sans-serif;
      letter-spacing:.6px;text-align:center;border:1px solid #444;text-transform:uppercase;}
    .thal{text-align:left!important;padding-left:7px!important;}
    td{padding:5px 4px;font-size:11px;border:1px solid #ddd;text-align:center;vertical-align:middle;}
    .tdal{text-align:left;padding-left:7px;}
    .tdn{font-weight:700;color:#888;font-size:10px;width:24px;}
    .tdcbat{width:52px;font-size:10px;color:#555;text-align:center;}
    .tdat{font-size:10px;color:#555;width:68px;white-space:nowrap;}
    .tdcl{text-align:left;padding-left:6px;font-size:10px;color:#444;}
    .tdm{width:46px;background:#fafafa;}
    .tdv{width:38px;background:#f5faff;font-size:10px;color:#668;}
    .tdmb{width:60px;background:#fffbec;font-weight:700;}
    .tdmbd{width:60px;background:#fff8d0;font-weight:700;border:2px solid #1976D2!important;}
    .tdpc{width:46px;background:#f0f7ea;font-size:10px;color:#446;}
    .tdp{width:34px;background:#f0f0f0;font-weight:700;font-size:13px;}
    .tdpf{width:34px;background:#fff8d0;font-weight:800;font-size:14px;color:#b8860b;border:1px solid #1976D244!important;}
    .anome{font-weight:600;font-size:12px;color:#111;}
    .par{background:#fff;} .imp{background:#f8f8f8;}
    .exc td{color:#bbb!important;} .exc .anome{color:#ccc!important;}
    .cond-prova{display:flex;justify-content:space-between;gap:6px;padding:4px 10px;
      background:#f9f9ff;border:1px solid #d0d0e0;border-top:none;font-size:8px;color:#444;}
    .cond-bloco{display:flex;align-items:center;gap:4px;flex-wrap:nowrap;}
    .cond-label{font-weight:700;color:#222;font-size:8.5px;white-space:nowrap;}
    .cond-campo{display:inline-block;border-bottom:1px solid #999;min-width:48px;
      height:13px;margin:0 2px;vertical-align:bottom;}
    .cond-campo-hr{min-width:40px;}
    .cond-unidade{font-size:7.5px;color:#666;}
    .cond-sep{width:1px;background:#ccc;align-self:stretch;margin:0 4px;}
    .rod-wrap{margin-top:auto;}
    .rod{padding-top:9px;border-top:1px solid #ddd;
      display:flex;justify-content:space-between;align-items:flex-end;gap:12px;}
    .rod-ass{flex:1;max-width:185px;}
    .rod-ln{border-bottom:1px solid #aaa;margin-bottom:5px;height:26px;}
    .rod-lb{font-size:9px;color:#888;text-align:center;font-style:italic;}
    .rod-info{font-size:9px;color:#aaa;text-align:center;line-height:1.9;}
    @media print{
      @page{size:A4 portrait;margin:0;}
      @page landscape-page{size:A4 landscape;margin:0;}
      body{background:#fff;}
      .barra{display:none!important;}
      .conteudo{padding-top:0;}
      .pg{margin:0;border:none;box-shadow:none;width:100%;min-height:100vh;padding:12mm 15mm 10mm;}
      .pg.landscape{page:landscape-page;padding:10mm 12mm 8mm;}
    }
  `;

  const rodape = (sumula) => {
    // Coleta exceções únicas desta súmula
    const excecoes = sumula
      ? [...new Set(
          sumula.inscs
            .filter(i => i.permissividade)
            .map(i => `* ${i.permissividade} (Cat. oficial: ${i.categoriaOficial})`)
        )]
      : [];
    // Observações da prova
    const chaveObs = sumula ? `${sumula.prova.id}_${sumula.categoria.id}_${sumula.sexo}` : "";
    const obsTexto = chaveObs ? (evento.observacoesProvas || {})[chaveObs] || "" : "";
    return `
    <div class="rod-wrap">
    ${excecoes.length ? `
      <div style="margin-top:6px;padding:5px 10px;background:#f8f8e0;border:1px solid #ddd;border-radius:3px;font-size:9px;color:#555;font-style:italic">
        ${excecoes.map(e => `<div>${e}</div>`).join("")}
      </div>` : ""}
    ${obsTexto ? `
      <div style="margin-top:6px;padding:6px 10px;background:#f0f4ff;border:1px solid #ccd;border-radius:3px;font-size:9px;color:#333;line-height:1.5">
        <strong>Observa\u00e7\u00f5es:</strong> ${obsTexto.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br/>")}
      </div>` : ""}
    <div class="rod">
      <div class="rod-ass"><div class="rod-ln"></div><div class="rod-lb">\u00c1rbitro Respons\u00e1vel</div></div>
      <div class="rod-info"><div>Gerado em: ${dataGeracao}</div><div>Plataforma de Competições - GERENTRACK</div></div>
      <div class="rod-ass"><div class="rod-ln"></div><div class="rod-lb">Anotador / Cronometrista</div></div>
    </div>
    ${evento.logoRodape ? `<div style="margin-top:10px;text-align:center;"><img src="${evento.logoRodape}" alt="" style="max-width:100%;max-height:28mm;object-fit:contain;"/></div>` : ""}
    <div style="margin-top:12px;text-align:center;padding-top:6px;border-top:1px solid #e0e0e0;">
      <div style="font-size:7px;color:#999;letter-spacing:1px;margin-bottom:3px;">Desenvolvido por:</div>
      <img src="${_gtLogo}" alt="GERENTRACK" style="max-height:10mm;object-fit:contain;opacity:0.7;" />
    </div>
    </div>`;
  };

  const cabPrv = (s, num, lblExtra) => `
    <div class="cab">
      <div class="cab-left">
        ${evento.logoCabecalho ? `<img src="${evento.logoCabecalho}" alt=""/>` : ""}
      </div>
      <div class="cab-c">
        <div class="cab-ev">${evento.nome}</div>
        <div class="cab-dt">\u{1F4C5} ${dataEvento} \u00a0\u00b7\u00a0 \u{1F4CD} ${_getLocalEventoDisplay(evento)}</div>
      </div>
      <div style="text-align:right;">
        ${evento.logoCabecalhoDireito ? `<div class="cab-logo"><img src="${evento.logoCabecalhoDireito}" alt="" style="max-height:24mm;max-width:45mm;object-fit:contain;" /></div>` : ""}
        <div class="cab-n">
          ${"`"}${lblExtra ? `<span style="font-size:10px;color:#1976D2;font-weight:800;letter-spacing:1px">${lblExtra}</span><br>` : ""}${"`"}
          S\u00fam. <span class="cab-nbig">#${"`"}${String(num).padStart(3,"0")}${"`"}</span>
        </div>
      </div>
    </div>
    <div class="faixa">
      <div class="faixa-nome">${"`"}${nomeProvaHtml(s.prova.nome.toUpperCase())}${"`"}${s.prova.origemCombinada ? ` <span style="font-size:10px;background:#0a1a2a;color:#1976D2;padding:2px 8px;border-radius:4px;margin-left:8px;font-weight:600">🏅 ${s.prova.nomeCombinada} (${s.prova.ordem}/${s.prova.totalProvas})</span>` : ""}${s.faseNome ? ` <span style="font-size:10px;padding:2px 8px;border-radius:4px;margin-left:8px;font-weight:700;background:${s.faseSufixo==="ELI"?"#fff3e0":s.faseSufixo==="SEM"?"#e0f0ff":"#e0ffe0"};color:${s.faseSufixo==="ELI"?"#c66a00":s.faseSufixo==="SEM"?"#1a5aaa":"#1a7a1a"};border:1px solid ${s.faseSufixo==="ELI"?"#e0a050":s.faseSufixo==="SEM"?"#5a8ace":"#5aaa5a"}">${s.faseNome}</span>` : ""}</div>
      <div class="faixa-meta">
        <span class="b-cat">${"`"}${s.categoria.nome}${"`"}</span>
        <span class="b-sx" style="${"`"}background:${corSexo(s.sexo)}22;color:${corSexo(s.sexo)};border:1px solid ${corSexo(s.sexo)}44${"`"}">${"`"}${labelSexo(s.sexo)}${"`"}</span>
      </div>
    </div>
    ${(() => {
      const recIds = evento.recordesSumulas || [];
      if (recIds.length === 0) return "";
      const linhas = [];
      recIds.forEach(recId => {
        const tipo = recordesAll.find(r => r.id === recId);
        if (!tipo) return;
        const reg = tipo.registros.find(r => r.provaId === s.prova.id && r.categoriaId === s.categoria.id && r.sexo === s.sexo);
        if (reg) {
          const atletasTxt = RecordHelper.getAtletaTexto(reg);
          const equipeTxt = RecordHelper.getEquipeTexto(reg);
          const anoTxt = RecordHelper.getAnoTexto(reg);
          const localTxt = RecordHelper.getLocalTexto(reg);
          linhas.push(`<span style="color:#1a6ef5;font-weight:700">${tipo.sigla}:</span> ${formatarMarca(reg.marca, reg.unidade, 3)} \u2014 ${atletasTxt} (${equipeTxt}) \u2014 ${anoTxt}${localTxt && localTxt !== "—" ? ", " + localTxt : ""}`);        }
      });
      if (linhas.length === 0) return "";
      return `<div style="padding:3px 10px;background:#f0f4ff;border:1px solid #dde;border-radius:3px;font-size:8.5px;color:#333;margin-bottom:4px;line-height:1.6">\u{1F3C6} ${linhas.join(" &nbsp;\u00b7&nbsp; ")}</div>`;
    })()}
    ${(() => {
      const condKey = evento.id + "_" + s.prova.id + "_" + s.categoria.id + "_" + s.sexo;
      const cond = (evento.condicoesProva || {})[condKey] || {};
      const val = (v, suf) => v ? '<span style="font-weight:700;color:#111">' + v + (suf||'') + '</span>' : '<span class="cond-campo' + (suf === 'h' ? ' cond-campo-hr' : '') + '"></span>';
      const fmtHr = (v) => v ? v.replace(':','h') : '';
      return `<div class="cond-prova">
      <div class="cond-bloco">
        <span class="cond-label">INÍCIO:</span>
        <span class="cond-unidade">Horário</span>${val(fmtHr(cond.inicioHorario),'h')}
        <span class="cond-sep"></span>
        <span class="cond-unidade">Umidade</span>${val(cond.inicioUmidade,'%')}
        <span class="cond-sep"></span>
        <span class="cond-unidade">Temp.</span>${val(cond.inicioTemp,'°C')}
      </div>
      <div class="cond-bloco">
        <span class="cond-label">TÉRMINO:</span>
        <span class="cond-unidade">Horário</span>${val(fmtHr(cond.terminoHorario),'h')}
        <span class="cond-sep"></span>
        <span class="cond-unidade">Umidade</span>${val(cond.terminoUmidade,'%')}
        <span class="cond-sep"></span>
        <span class="cond-unidade">Temp.</span>${val(cond.terminoTemp,'°C')}
      </div>
    </div>`;
    })()}`;

  // extrai metros do id da prova (ex: "M_sub14_60m" -> 60, "M_adulto_4x400m" -> 400)
  const metrosProva = (prova) => {
    const m = prova.id.match(/[_x]?(\d+)m/);
    return m ? parseInt(m[1]) : 0;
  };

  // th templates — PTS EQ. column is added dynamically per sumula via _thPtsEq
  const thCor200Base = `
    <th style="width:24px">#</th><th style="width:34px">Nº</th><th style="width:52px">CBAt</th><th class="thal">ATLETA</th>
    <th style="width:66px">NASCIMENTO</th><th class="thal">CLUBE / EQUIPE</th>
    <th style="width:40px">SÉR.</th><th style="width:34px">RAIA</th>
    <th style="width:38px">VENTO</th><th style="width:68px">MARCA</th><th style="width:32px">POS.</th>`;

  const thCor400Base = `
    <th style="width:24px">#</th><th style="width:34px">Nº</th><th style="width:52px">CBAt</th><th class="thal">ATLETA</th>
    <th style="width:66px">NASCIMENTO</th><th class="thal">CLUBE / EQUIPE</th>
    <th style="width:40px">SÉR.</th><th style="width:34px">RAIA</th>
    <th style="width:68px">MARCA</th><th style="width:32px">POS.</th>`;

  const thCorLongBase = `
    <th style="width:24px">#</th><th style="width:34px">Nº</th><th style="width:52px">CBAt</th><th class="thal">ATLETA</th>
    <th style="width:66px">NASCIMENTO</th><th class="thal">CLUBE / EQUIPE</th>
    <th style="width:68px">MARCA</th><th style="width:32px">POS.</th>`;

  const thCampoParBase = `
    <th style="width:24px">#</th><th style="width:34px">Nº</th><th style="width:52px">CBAt</th><th class="thal">ATLETA</th>
    <th style="width:68px">NASCIMENTO</th><th class="thal">CLUBE / EQUIPE</th>
    <th style="width:46px">T1</th><th style="width:46px">T2</th><th style="width:46px">T3</th>
    <th style="width:60px">MELHOR</th><th style="width:46px">CL.PARC.</th><th style="width:34px">\u2192FIN.</th>`;

  const thCampoFinBase = `
    <th style="width:24px">#</th><th style="width:34px">Nº</th><th style="width:52px">CBAt</th><th class="thal">ATLETA</th>
    <th style="width:68px">NASCIMENTO</th><th class="thal">CLUBE / EQUIPE</th>
    <th style="width:46px">T4</th><th style="width:46px">T5</th><th style="width:46px">T6</th>
    <th style="width:60px">MELHOR</th><th style="width:34px">POS.</th>`;

  const thExc = `<tr>
    <th style="width:24px">#</th><th style="width:34px">Nº</th><th style="width:52px">CBAt</th><th class="thal">ATLETA</th>
    <th style="width:68px">NASCIMENTO</th><th class="thal">CLUBE / EQUIPE</th>
    <th style="width:60px">MELHOR T1-T3</th><th style="width:34px">CLASS.</th>
  </tr>`;

  let numPag = 0;
  const pags = [];
  const MAX = 8;

  // Pontuação por equipes na impressão
  const pontEqAtivo = evento.pontuacaoEquipes?.ativo === true;
  const thPtsEq = pontEqAtivo ? `<th style="width:38px;background:#fffde0;color:#8a7000;font-weight:800">PTS EQ.</th>` : "";
  const tdPtsEqVazio = pontEqAtivo ? `<td style="background:#fffde0"></td>` : "";
  const tdPtsEqVal = (v) => pontEqAtivo ? `<td style="background:#fffde0;color:#8a7000;font-weight:800;text-align:center">${v || "—"}</td>` : "";

  // Helper: get orientation for a sumula
  const getOrient = (s) => {
    const key = `${s.prova.id}_${s.categoria.id}_${s.sexo}`;
    return orientMap[key] || (s.prova.unidade !== "s" ? "landscape" : "portrait");
  };
  const pgClass = (s) => getOrient(s) === "landscape" ? "pg landscape" : "pg";
  const pgStyle = (s) => getOrient(s) === "landscape" ? ' style="padding:10mm 12mm 8mm"' : "";

  sumulas.forEach((s) => {
    const isTempo = s.prova.unidade === "s";
    const atl = s.atletas;
    const res = s.resultados || {};
    const temRes = Object.keys(res).length > 0;

    // ── REVEZAMENTO: layout diferenciado por equipe ──
    if (s.isRevezamento) {
      const equipesR = s.equipesRevez || [];
      numPag++;
      const metros = metrosProva(s.prova);
      const nPernas = nPernasRevezamento(s.prova);
      const temVento = metros <= 200;

      // Seriação: buscar série/raia da seriação salva
      const serChave = `${s.prova.id}_${s.categoria.id}_${s.sexo}`;
      const serSalva = evento.seriacao?.[serChave];
      const getSerInfo = (eqId) => {
        if (!serSalva?.series) return { serie: "", raia: "" };
        for (const ser of serSalva.series) {
          const found = ser.atletas.find(a => (a.id || a.equipeId) === eqId);
          if (found) return { serie: String(ser.numero), raia: found.raia ? String(found.raia) : "" };
        }
        return { serie: "", raia: "" };
      };
      const temSeriacao = !!serSalva?.series;


      // Classificação por resultado
      const classif = equipesR.map(eq => {
        const raw = res[eq.equipeId];
        const marca = raw != null ? (typeof raw === "object" ? raw.marca : raw) : null;
        const status = raw != null && typeof raw === "object" ? (raw.status || "") : "";
        const raiaRes = raw != null && typeof raw === "object" ? (raw.raia || "") : "";
        const serieRes = raw != null && typeof raw === "object" ? (raw.serie || "") : "";
        const serInfo = getSerInfo(eq.equipeId);
        const raia = raiaRes || serInfo.raia;
        const serie = serieRes || serInfo.serie;
        const vento = raw != null && typeof raw === "object" ? (raw.vento || "") : "";
        const isStatus = ["DNS","DNF","DQ"].includes(status);
        return { ...eq, marca: !isStatus && marca != null ? parseFloat(marca) : null, status, isStatus, raia, serie, vento };
      }).sort((a, b) => {
        if (temRes) {
          if (a.isStatus && !b.isStatus) return 1;
          if (!a.isStatus && b.isStatus) return -1;
          if (a.marca != null && b.marca != null) return a.marca - b.marca;
          return 0;
        }
        // Sem resultado: ordenar por série → raia
        const sa = parseInt(a.serie) || 99, sb = parseInt(b.serie) || 99;
        if (sa !== sb) return sa - sb;
        const ra = parseInt(a.raia) || 99, rb = parseInt(b.raia) || 99;
        return ra - rb;
      });

      const _msEmpatadosRevez = (() => {
        const marcasMs = classif.filter(x => x.marca != null).map(x => Math.round(x.marca >= 1000 ? x.marca : x.marca * 1000));
        return _marcasComEmpateCentesimal(marcasMs);
      })();

      const linhas = classif.map((eq, j) => {
        const atlNomes = eq.atletas.map(a => a.nome).join(" · ");
        const marcaStr = eq.isStatus ? `<span style="color:#c33">${eq.status}</span>` : eq.marca != null ? formatarMarcaExibicaoHtml(eq.marca, "s", _msEmpatadosRevez, false) : "";
        return `<tr class="${j%2===0?"par":"imp"}">
          <td class="tdn">${j+1}</td>
          ${temSeriacao ? `<td class="tdn">${eq.serie || ""}</td><td class="tdn" style="font-weight:700;color:#000">${eq.raia || ""}</td>` : ""}
          <td class="tdal" style="font-weight:700">${eq.nomeEquipe}${eq.sigla ? ` <span style="color:#888;font-size:8px">(${eq.sigla})</span>` : ""}</td>
          <td class="tdal" style="font-size:8px;color:#444">${atlNomes}</td>
          ${temVento ? `<td class="tdv">${eq.vento || "\u2014"}</td>` : ""}
          <td class="${temRes?"tdmbd":"tdmb"}">${marcaStr || ""}</td>
          <td class="${temRes?"tdpf":"tdp"}">${eq.marca != null ? (j+1)+"\u00b0" : ""}</td>
        </tr>`;
      }).join("");

      const thRevez = `<th style="width:24px">#</th>
        ${temSeriacao ? `<th style="width:30px">SÉR.</th><th style="width:30px">RAIA</th>` : ""}
        <th class="thal" style="min-width:120px">EQUIPE</th>
        <th class="thal" style="min-width:180px">ATLETAS (${nPernas})</th>
        ${temVento ? `<th style="width:38px">VENTO</th>` : ""}
        <th style="width:68px">MARCA</th>
        <th style="width:32px">POS.</th>`;

      pags.push(`
        <div class="${pgClass(s)}">
          ${cabPrv(s, numPag, null)}
          <div class="blk blk-final">REVEZAMENTO<span class="blk-s">${equipesR.length} equipe${equipesR.length!==1?"s":""}</span></div>
          <table><thead><tr>${thRevez}</tr></thead><tbody>${linhas}</tbody></table>
          ${rodape(s)}
        </div>`);
      return; // skip normal rendering
    }

    // Casas decimais: sempre 2, com parênteses para empates no centésimo
    const _msEmpatadosSumula = (() => {
      if (!isTempo || !temRes) return new Set();
      const marcasMs = Object.values(res).map(r => {
        const m = getMarca(r);
        return m != null ? Math.round(parseFloat(m) >= 1000 ? parseFloat(m) : parseFloat(m) * 1000) : null;
      }).filter(v => v != null && !isNaN(v));
      return _marcasComEmpateCentesimal(marcasMs);
    })();
    // Não mostrar pts equipe para provas componentes de combinadas
    // Pontuação SÓ na final ou legado (sem fase). Eliminatória/semifinal NÃO pontuam.
    // Só mostra quando todos os inscritos têm qualquer resultado digitado
    const _isFaseFinalPrint = !s.faseSufixo || s.faseSufixo === "FIN";
    const _inscsBlkPrint = (s.inscs || atl || []).length;
    const _entradasBrutasPrint = Object.keys(res).length;
    const _provaCompletaPrint = _inscsBlkPrint === 0 || _entradasBrutasPrint >= _inscsBlkPrint;
    const mostrarPtsEq = pontEqAtivo && !s.prova.origemCombinada && _isFaseFinalPrint && _provaCompletaPrint;
    const _thPtsEq = mostrarPtsEq ? thPtsEq : "";
    const _tdPtsEqVazio = mostrarPtsEq ? tdPtsEqVazio : "";

    // Q/q classificação para ELI/SEM
    const _isFaseComSeriesPrint = (s.faseSufixo === "ELI" || s.faseSufixo === "SEM") && !s.isRevezamento;
    const _classifQqPrint = {};
    if (_isFaseComSeriesPrint) {
      const fasesConf = getFasesProva(s.prova.id, evento.programaHorario || {});
      const idxAtual = FASE_ORDEM.indexOf(s.faseSufixo);
      const proximaFase = FASE_ORDEM[idxAtual + 1];
      if (proximaFase && fasesConf.includes(proximaFase)) {
        const serProxima = buscarSeriacao(evento.seriacao, s.prova.id, s.categoria.id, s.sexo, proximaFase);
        if (serProxima?.series) {
          serProxima.series.forEach(ser => {
            ser.atletas.forEach(a => {
              const aid = a.id || a.atletaId;
              if (a.origemClassif === "posicao") _classifQqPrint[aid] = "Q";
              else if (a.origemClassif === "tempo") _classifQqPrint[aid] = "q";
              else _classifQqPrint[aid] = "Q";
            });
          });
        }
      }
    }
    const _thClassif = _isFaseComSeriesPrint ? '<th style="background:#1a3a1a;color:#7cfc7c;padding:4px 6px;font-size:9px;font-weight:700;text-align:center">CLASS.</th>' : "";
    const _tdClassifVazio = _isFaseComSeriesPrint ? '<td style="text-align:center;font-weight:700;font-size:10px"></td>' : "";
    const _tdClassifVal = (aId) => {
      if (!_isFaseComSeriesPrint) return "";
      const qq = _classifQqPrint[aId];
      if (!qq) return '<td style="text-align:center"></td>';
      const cor = qq === "Q" ? "#1976D2" : "#1976D2";
      return `<td style="text-align:center;font-weight:700;font-size:11px;color:${cor}">${qq}</td>`;
    };

    // Calcular pontos por equipe para esta súmula (quando tem resultados)
    const ptsEqMap = {};
    if (mostrarPtsEq && temRes) {
      // Montar classificados no formato esperado
      const classificados = [...atl]
        .map(a => {
          const raw = res[a.id];
          const marca = raw != null ? parseFloat(getMarca(raw)) : null;
          const status = (raw != null && typeof raw === "object") ? (raw.status || "") : "";
          const isStatus = ["DNS","DNF","NM","DQ"].indexOf(status) !== -1;
          return { atleta: a, marca: (!isStatus && marca != null && !isNaN(marca)) ? marca : null, raw, isStatus };
        })
        .filter(x => x.marca != null || x.isStatus)
        .sort((a, b) => {
          if (a.isStatus && !b.isStatus) return 1;
          if (!a.isStatus && b.isStatus) return -1;
          if (a.isStatus && b.isStatus) return 0;
          if (isTempo) return a.marca - b.marca;
          return b.marca - a.marca;
        });
      const pontosBlk = TeamScoringEngine.calcularPontosProva(classificados, evento.pontuacaoEquipes, _atletas, equipes);
      Object.keys(pontosBlk).forEach(eqId => {
        const info = pontosBlk[eqId];
        (info.atletas || []).forEach(atlInfo => {
          const atlPont = classificados.find((item, idx) => {
            if (!item.atleta || item.isStatus) return false;
            return item.atleta.id === atlInfo.atletaId && (idx + 1) === atlInfo.posicao;
          });
          if (atlPont) ptsEqMap[atlPont.atleta.id] = atlInfo.pontos;
        });
      });
    }
    const _tdPtsEqVal = (aId) => mostrarPtsEq ? tdPtsEqVal(ptsEqMap[aId] || "") : "";

    // Headers dinâmicos com coluna PTS EQ. e/ou CLASS. quando aplicável
    const thCor200 = `<tr>${thCor200Base}${_thClassif}${_thPtsEq}</tr>`;
    const thCor400 = `<tr>${thCor400Base}${_thClassif}${_thPtsEq}</tr>`;
    const thCorLong = `<tr>${thCorLongBase}${_thClassif}${_thPtsEq}</tr>`;
    const thCampoPar = `<tr>${thCampoParBase}</tr>`;
    const thCampoFin = `<tr>${thCampoFinBase}${_thClassif}${_thPtsEq}</tr>`;

    const getInsc = (a) => s.inscs.find((i) => i.atletaId === a.id);

    // Bloco informativo para provas de barreiras
    const especBarr = s.prova.especBarreiras;
    const infoBarreiras = especBarr ? `
      <div style="display:flex;gap:4px;flex-wrap:wrap;padding:3px 13px;font-size:8px;color:#555;background:#f5f5fa;border:1px solid #d0d0e0;border-top:none">
        <span style="font-weight:700;color:#333">Barreiras:</span>
        <span>Altura: <strong style="color:#111">${especBarr.altura}</strong></span>
        <span>\u00b7 Saída\u21921\u00aa: <strong>${especBarr.saida1a}</strong></span>
        <span>\u00b7 Entre barr.: <strong>${especBarr.entre}</strong></span>
        <span>\u00b7 \u00daltima\u2192Cheg.: <strong>${especBarr.ultimaCheg}</strong></span>
      </div>` : "";

    if (isTempo) {
      // escolhe th e monta tds de resultado de acordo com a distância
      const metros = metrosProva(s.prova);
      const thCor  = metros <= 200 ? thCor200 : metros <= 400 ? thCor400 : thCorLong;

      // células de raia e vento (condicionais)
      const tdRaiaVazio  = metros <= 400 ? `<td class="tdm"></td>` : "";
      const tdVentoVazio = metros <= 200 ? `<td class="tdv">______</td>` : "";
      const tdRaiaVal    = (v) => metros <= 400 ? `<td class="tdm">${v||""}</td>` : "";
      const tdVentoVal   = (v) => metros <= 200 ? `<td class="tdv">${v||"\u2014"}</td>` : "";

      // Provas >= 800m não seriam — todos correm juntos, sem coluna de série
      // Mas 800m em raias mantém coluna de série/raia (RT 20.4.5)
      let _serSalvaCheck = evento.seriacao?.[`${s.prova.id}_${s.categoria.id}_${s.sexo}`];
      if (!_serSalvaCheck) {
        const _fsC = getFasesProva(s.prova.id, evento.programaHorario || {});
        for (const _f of _fsC) { const _k = serKey(s.prova.id, s.categoria.id, s.sexo, _f); if (evento.seriacao?.[_k]?.series) { _serSalvaCheck = evento.seriacao[_k]; break; } }
      }
      const _tipoLarg = _serSalvaCheck?.tipoLargada || (metros > 800 ? "grupo" : "raias");
      const isProvaLonga = (metros > 800 || metros === 0) || (metros === 800 && _tipoLarg === "grupo");
      // Para provas longas (>400m): usar atlPorSerie da config; para curtas: usar nRaias da config
      const cfgProvaMax = evento.configSeriacao?.[s.prova.id];
      const cfgProvaObj = (!cfgProvaMax) ? {} : (typeof cfgProvaMax === "string") ? { modo: cfgProvaMax } : cfgProvaMax;
      const atlPorSerieConf = cfgProvaObj.atlPorSerie || 12;
      const nRaiasConf = cfgProvaObj.nRaias || 8;

      const tdSerie = (serieNum) => isProvaLonga ? "" : `<td class="tdm">${serieNum != null ? serieNum : ""}</td>`;
      const tdSerieRes = (serieNum) => isProvaLonga ? "" : `<td class="tdm">${serieNum != null ? serieNum : "\u2014"}</td>`;

      const linhaVazia = (a, j, serieNum) => `
        <tr class="${j%2===0?"par":"imp"}">
          <td class="tdn">${j+1}</td>
          <td class="tdn" style="font-weight:700;color:#333">${numPeito[a.id]||""}</td>
          <td class="tdcbat">${_getCbat(a)}</td>
          <td class="tdal"><span class="anome">${a.nome}</span>${excTag(getInsc(a))}</td>
          <td class="tdat">${fmtNasc(a)}</td><td class="tdcl">${getClubeAtleta(a)||"\u2014"}</td>
          ${tdSerie(serieNum)}${tdRaiaVazio}${tdVentoVazio}<td class="tdmb"></td><td class="tdp"></td>${_tdClassifVazio}${_tdPtsEqVazio}
        </tr>`;
      const linhaRes = (a, j, m, isFin, rawRes, serieNum) => {
        const raiaDisp  = tdRaiaVal(getRaia(rawRes));
        const ventoDisp = tdVentoVal(getVento(rawRes));
        return `
        <tr class="${j%2===0?"par":"imp"}">
          <td class="tdn">${j+1}</td>
          <td class="tdn" style="font-weight:700;color:#333">${numPeito[a.id]||""}</td>
          <td class="tdcbat">${_getCbat(a)}</td>
          <td class="tdal"><span class="anome">${a.nome}</span>${excTag(getInsc(a))}</td>
          <td class="tdat">${fmtNasc(a)}</td><td class="tdcl">${getClubeAtleta(a)||"\u2014"}</td>
          ${tdSerieRes(serieNum)}${raiaDisp}${ventoDisp}<td class="${isFin?"tdmbd":"tdmb"}">${formatarMarcaExibicaoHtml(m,"s",_msEmpatadosSumula,false)}</td>
          <td class="${isFin?"tdpf":"tdp"}">${j+1}\u00b0</td>${_tdClassifVal(a.id)}${_tdPtsEqVal(a.id)}
        </tr>`;
      };

      const MAX_EFETIVO = isProvaLonga ? atlPorSerieConf : nRaiasConf;
      const totalSeries = Math.ceil(atl.length / MAX_EFETIVO);
      const temSemi = totalSeries > 1;
      const isCombPista = s.prova.origemCombinada === true;

      // Mapear atletaId → nº da série (para provas de combinada)
      const serieDoAtleta = {};
      if (totalSeries > 1) {
        for (let si = 0; si < totalSeries; si++) {
          const serie = atl.slice(si*MAX_EFETIVO, (si+1)*MAX_EFETIVO);
          serie.forEach(a => { serieDoAtleta[a.id] = si + 1; });
        }
      }

      if (isCombPista) {
        // ── COMBINADA PISTA: sem semifinal, classificação geral unificada ──
        if (!temRes) {
          // Sem resultado — imprimir séries separadas (label "SÉRIE", sem "SEMIFINAL")
          for (let si = 0; si < totalSeries; si++) {
            numPag++;
            const serie = atl.slice(si*MAX_EFETIVO, (si+1)*MAX_EFETIVO);
            const lbl = totalSeries > 1 ? `S\u00c9RIE ${si+1} / ${totalSeries}` : "S\u00c9RIE \u00daNICA";
            pags.push(`
              <div class="${pgClass(s)}">
                ${cabPrv(s, numPag, null)}
                <div class="blk blk-parc">${lbl}<span class="blk-s">${serie.length} atleta${serie.length!==1?"s":""}</span></div>
                ${infoBarreiras}
                <table><thead>${thCor}</thead><tbody>${serie.map((a,j)=>linhaVazia(a,j,si+1)).join("")}</tbody></table>
                ${rodape(s)}
              </div>`);
          }
        } else {
          // Com resultado — classificação geral unificada por tempo
          const classGeral = [...atl]
            .map((a) => ({ a, m: res[a.id] != null ? parseFloat(getMarca(res[a.id])) : null, raw: res[a.id] }))
            .filter((x) => x.m != null)
            .sort((a2,b2) => a2.m - b2.m);
          
          if (classGeral.length > 0) {
            // Para combinada, permite até 20 atletas por página (sem semifinal)
            const MAX_COMB = 20;
            const totalPags = Math.ceil(classGeral.length / MAX_COMB);
            for (let pi = 0; pi < totalPags; pi++) {
              numPag++;
              const fatia = classGeral.slice(pi*MAX_COMB, (pi+1)*MAX_COMB);
              const lblPag = totalPags > 1 ? ` (${pi+1}/${totalPags})` : "";
              pags.push(`
                <div class="${pgClass(s)}">
                  ${cabPrv(s, numPag, null)}
                  <div class="blk blk-final">CLASSIFICA\u00c7\u00c3O GERAL${lblPag}<span class="blk-s">${classGeral.length} atleta${classGeral.length!==1?"s":""} \u00b7 resultado final</span></div>
                  ${infoBarreiras}
                  <table><thead>${thCor}</thead><tbody>${fatia.map(({a,m,raw},j)=>linhaRes(a, pi*MAX_COMB+j, m, true, raw, serieDoAtleta[a.id] || "")).join("")}</tbody></table>
                  ${rodape(s)}
                </div>`);
            }
          }
        }
      } else if (!temRes) {
        // Verificar se tem seriação salva
        const chaveSer = `${s.prova.id}_${s.categoria.id}_${s.sexo}`;
        let serSalva = s.faseSufixo
          ? buscarSeriacao(evento.seriacao, s.prova.id, s.categoria.id, s.sexo, s.faseSufixo)
          : evento.seriacao?.[chaveSer];
        if (!serSalva) {
          const _fasesP = getFasesProva(s.prova.id, evento.programaHorario || {});
          for (const _fs of _fasesP) {
            const _ck = serKey(s.prova.id, s.categoria.id, s.sexo, _fs);
            if (evento.seriacao?.[_ck]?.series) { serSalva = evento.seriacao[_ck]; break; }
          }
        }
        const cfgProva = evento.configSeriacao?.[s.prova.id];
        const configModo = (typeof cfgProva === "string") ? cfgProva : (cfgProva?.modo || "final_tempo");
        const nRaiasProva = isProvaLonga
          ? ((typeof cfgProva === "object" && cfgProva?.atlPorSerie) ? cfgProva.atlPorSerie : 12)
          : ((typeof cfgProva === "object" && cfgProva?.nRaias) ? cfgProva.nRaias : 8);
        const isFinalTempo = configModo === "final_tempo";

        if (serSalva && serSalva.series && serSalva.series.length > 0) {
          // ── SERIAÇÃO SALVA: usar séries e raias definidas ──
          const seriesOrdenadas = [...serSalva.series].sort((a, b) => {
            const oA = serSalva.ordemSeries ? serSalva.ordemSeries.indexOf(a.numero) : a.numero;
            const oB = serSalva.ordemSeries ? serSalva.ordemSeries.indexOf(b.numero) : b.numero;
            return oA - oB;
          });
          const nSer = seriesOrdenadas.length;
          const temMultiSeries = nSer > 1;
          const lblTipo = s.faseSufixo === "ELI" ? "ELIMINATÓRIA" : s.faseSufixo === "SEM" ? "SEMIFINAL" : s.faseSufixo === "FIN" ? "FINAL" : (isFinalTempo ? "FINAL POR TEMPO" : "SEMIFINAL");

          for (let si = 0; si < nSer; si++) {
            numPag++;
            const serie = seriesOrdenadas[si];
            // Mapear atletaId→atleta no array `atl`
            const atletasSerie = serie.atletas.map(sa => {
              const aReal = atl.find(a => a.id === sa.id || a.id === sa.atletaId);
              return aReal ? { atleta: aReal, raia: sa.raia, ranking: sa.ranking } : null;
            }).filter(Boolean).sort((a, b) => (a.raia || 99) - (b.raia || 99));

            const lbl = temMultiSeries
              ? `${lblTipo} \u2014 S\u00c9RIE ${serie.numero} / ${nSer}`
              : (s.faseSufixo ? lblTipo : (isFinalTempo ? "FINAL" : "S\u00c9RIE \u00daNICA"));

            pags.push(`
              <div class="${pgClass(s)}">
                ${cabPrv(s, numPag, null)}
                <div class="blk ${isFinalTempo ? "blk-final" : "blk-semi"}">${lbl}<span class="blk-s">${atletasSerie.length} atleta${atletasSerie.length!==1?"s":""} \u00b7 RT 20.3</span></div>
                ${infoBarreiras}
                <table><thead>${thCor}</thead><tbody>${atletasSerie.map(({atleta:a, raia}, j) => `
                  <tr class="${j%2===0?"par":"imp"}">
                    <td class="tdn">${j+1}</td>
                    <td class="tdn" style="font-weight:700;color:#333">${numPeito[a.id]||""}</td>
                    <td class="tdcbat">${_getCbat(a)}</td>
                    <td class="tdal"><span class="anome">${a.nome}</span>${excTag(getInsc(a))}</td>
                    <td class="tdat">${fmtNasc(a)}</td><td class="tdcl">${getClubeAtleta(a)||"\u2014"}</td>
                    <td class="tdm"></td>${metros <= 400 ? `<td class="tdm" style="font-weight:700;color:#1a6ef5">${raia||""}</td>` : ""}${tdVentoVazio}<td class="tdmb"></td><td class="tdp"></td>${_tdClassifVazio}${_tdPtsEqVazio}
                  </tr>`).join("")}</tbody></table>
                ${rodape(s)}
              </div>`);
          }

          // Se não é final por tempo E tem múltiplas séries E não é já uma fase FIN/ELI → adicionar página de final em branco
          if (!isFinalTempo && temMultiSeries && s.faseSufixo !== "FIN" && s.faseSufixo !== "ELI") {
            numPag++;
            const nRaias = nRaiasProva;
            pags.push(`
              <div class="${pgClass(s)}">
                ${cabPrv(s, numPag, "\u2b50 FINAL")}
                <div class="blk blk-final">FINAL \u2014 ${nRaias} MELHORES TEMPOS DAS SEMIFINAIS<span class="blk-s">preencher ap\u00f3s apura\u00e7\u00e3o</span></div>
                ${infoBarreiras}
                <table><thead>${thCor}</thead><tbody>${Array.from({length:nRaias}).map((_,j)=>`
                  <tr class="${j%2===0?"par":"imp"}">
                    <td class="tdn">${j+1}</td><td class="tdn"></td><td class="tdcbat"></td><td class="tdal"></td><td class="tdat"></td><td class="tdcl"></td>
                    <td class="tdm"></td>${tdRaiaVazio}${tdVentoVazio}<td class="tdmb"></td><td class="tdp"></td>${_tdClassifVazio}${_tdPtsEqVazio}
                  </tr>`).join("")}</tbody></table>
                ${rodape(s)}
              </div>`);
          }
        } else {
          // ── SEM SERIAÇÃO SALVA: fluxo padrão ──
          for (let si = 0; si < totalSeries; si++) {
            numPag++;
            const serie = atl.slice(si*MAX_EFETIVO, (si+1)*MAX_EFETIVO);
            const lbl = temSemi
              ? (isFinalTempo ? `FINAL POR TEMPO \u2014 S\u00c9RIE ${si+1} / ${totalSeries}` : `SEMIFINAL \u2014 S\u00c9RIE ${si+1} / ${totalSeries}`)
              : (isFinalTempo ? "FINAL" : "S\u00c9RIE \u00daNICA");
            pags.push(`
              <div class="${pgClass(s)}">
                ${cabPrv(s, numPag, null)}
                <div class="blk ${temSemi && !isFinalTempo?"blk-semi":"blk-final"}">${lbl}<span class="blk-s">${serie.length} atleta${serie.length!==1?"s":""}</span></div>
                ${infoBarreiras}
                <table><thead>${thCor}</thead><tbody>${serie.map((a,j)=>linhaVazia(a,j)).join("")}</tbody></table>
                ${rodape(s)}
              </div>`);
          }
          if (temSemi && !isFinalTempo) {
            numPag++;
            pags.push(`
              <div class="${pgClass(s)}">
                ${cabPrv(s, numPag, "\u2b50 FINAL")}
                <div class="blk blk-final">FINAL \u2014 8 MELHORES TEMPOS DAS SEMIFINAIS<span class="blk-s">preencher ap\u00f3s apura\u00e7\u00e3o</span></div>
                ${infoBarreiras}
                <table><thead>${thCor}</thead><tbody>${Array.from({length:8}).map((_,j)=>`
                  <tr class="${j%2===0?"par":"imp"}">
                    <td class="tdn">${j+1}</td><td class="tdn"></td><td class="tdcbat"></td><td class="tdal"></td><td class="tdat"></td><td class="tdcl"></td>
                    <td class="tdm"></td>${tdRaiaVazio}${tdVentoVazio}<td class="tdmb"></td><td class="tdp"></td>${_tdClassifVazio}${_tdPtsEqVazio}
                  </tr>`).join("")}</tbody></table>
                ${rodape(s)}
              </div>`);
          }
        }
      } else {
        const chaveSer2 = `${s.prova.id}_${s.categoria.id}_${s.sexo}`;
        const cfgProva2 = evento.configSeriacao?.[s.prova.id];
        const configModo2 = (typeof cfgProva2 === "string") ? cfgProva2 : (cfgProva2?.modo || "final_tempo");
        const nRaiasProva2 = isProvaLonga
          ? ((typeof cfgProva2 === "object" && cfgProva2?.atlPorSerie) ? cfgProva2.atlPorSerie : 12)
          : ((typeof cfgProva2 === "object" && cfgProva2?.nRaias) ? cfgProva2.nRaias : 8);
        const isFinalTempo2 = configModo2 === "final_tempo";
        let serSalva2 = s.faseSufixo
          ? buscarSeriacao(evento.seriacao, s.prova.id, s.categoria.id, s.sexo, s.faseSufixo)
          : evento.seriacao?.[chaveSer2];
        if (!serSalva2) {
          const _fasesP2 = getFasesProva(s.prova.id, evento.programaHorario || {});
          for (const _fs2 of _fasesP2) {
            const _ck2 = serKey(s.prova.id, s.categoria.id, s.sexo, _fs2);
            if (evento.seriacao?.[_ck2]?.series) { serSalva2 = evento.seriacao[_ck2]; break; }
          }
        }

        const classGeral = [...atl]
          .map((a) => ({ a, m: res[a.id] != null ? parseFloat(getMarca(res[a.id])) : null }))
          .filter((x) => x.m != null).sort((a,b) => a.m - b.m);

        // ── Fases ELI/SEM: agrupar por série com Q/q ──
        if (_isFaseComSeriesPrint && serSalva2?.series) {
          const seriesOrd = [...serSalva2.series].sort((a2, b2) => {
            if (serSalva2.ordemSeries) return serSalva2.ordemSeries.indexOf(a2.numero) - serSalva2.ordemSeries.indexOf(b2.numero);
            return a2.numero - b2.numero;
          });
          const nSer = seriesOrd.length;
          const faseLabel = s.faseSufixo === "ELI" ? "ELIMINAT\u00d3RIA" : "SEMIFINAL";
          for (let si = 0; si < nSer; si++) {
            numPag++;
            const serie = seriesOrd[si];
            const atletaIds = new Set(serie.atletas.map(a2 => a2.id || a2.atletaId));
            const serieOrd = classGeral.filter(x => atletaIds.has(x.a.id));
            // Incluir status (DNS/DNF/DQ) que não estão em classGeral
            const statusAtls = atl.filter(a2 => atletaIds.has(a2.id) && !serieOrd.some(x => x.a.id === a2.id) && res[a2.id]);
            const statusLinhas = statusAtls.map(a2 => {
              const raw = res[a2.id];
              const status = (typeof raw === "object") ? (raw.status || "") : "";
              return { a: a2, m: null, status };
            });
            const lbl = nSer > 1 ? `${faseLabel} \u2014 S\u00c9RIE ${serie.numero} / ${nSer}` : `${faseLabel} \u2014 S\u00c9RIE \u00daNICA`;
            pags.push(`
              <div class="${pgClass(s)}">
                ${cabPrv(s, numPag, null)}
                <div class="blk blk-semi">${lbl}<span class="blk-s">${serie.atletas.length} atleta${serie.atletas.length!==1?"s":""}</span></div>
                ${infoBarreiras}
                <table><thead>${thCor}</thead><tbody>${serieOrd.map(({a,m},j)=>linhaRes(a,j,m,false,res[a.id])).join("")}${statusLinhas.map(({a,status},j)=>{
                  const jj = serieOrd.length + j;
                  return `<tr class="${jj%2===0?"par":"imp"}">
                    <td class="tdn"></td>
                    <td class="tdn" style="font-weight:700;color:#333">${numPeito[a.id]||""}</td>
                    <td class="tdcbat">${_getCbat(a)}</td>
                    <td class="tdal"><span class="anome">${a.nome}</span></td>
                    <td class="tdat">${fmtNasc(a)}</td><td class="tdcl">${getClubeAtleta(a)||"\u2014"}</td>
                    ${tdSerieRes("")}${tdRaiaVazio}${tdVentoVazio}<td class="tdmb" style="color:#c44">${status}</td>
                    <td class="tdp"></td>${_tdClassifVazio}${_tdPtsEqVazio}
                  </tr>`;
                }).join("")}</tbody></table>
                ${rodape(s)}
              </div>`);
          }
        } else if (isFinalTempo2) {
          // Final por tempo com resultado → classificação geral unificada
          if (classGeral.length > 0) {
            // Mapear atletaId → série (da seriação salva ou sequencial)
            const serDoAtl = {};
            if (serSalva2 && serSalva2.series) {
              serSalva2.series.forEach(ser => {
                ser.atletas.forEach(sa => { serDoAtl[sa.id || sa.atletaId] = ser.numero; });
              });
            } else if (totalSeries > 1) {
              for (let si = 0; si < totalSeries; si++) {
                atl.slice(si*MAX_EFETIVO, (si+1)*MAX_EFETIVO).forEach(a => { serDoAtl[a.id] = si + 1; });
              }
            }
            const MAX_FT = 20;
            const totalPags = Math.ceil(classGeral.length / MAX_FT);
            for (let pi = 0; pi < totalPags; pi++) {
              numPag++;
              const fatia = classGeral.slice(pi*MAX_FT, (pi+1)*MAX_FT);
              const lblPag = totalPags > 1 ? ` (${pi+1}/${totalPags})` : "";
              pags.push(`
                <div class="${pgClass(s)}">
                  ${cabPrv(s, numPag, null)}
                  <div class="blk blk-final">CLASSIFICA\u00c7\u00c3O GERAL${lblPag}<span class="blk-s">${classGeral.length} atleta${classGeral.length!==1?"s":""} \u00b7 resultado final</span></div>
                  ${infoBarreiras}
                  <table><thead>${thCor}</thead><tbody>${fatia.map(({a,m},j) => linhaRes(a, pi*MAX_FT+j, m, true, res[a.id], serDoAtl[a.id] || "")).join("")}</tbody></table>
                  ${rodape(s)}
                </div>`);
            }
          }
        } else {
          // Semifinal + Final com resultado
          for (let si = 0; si < totalSeries; si++) {
            numPag++;
            const serie = atl.slice(si*MAX_EFETIVO, (si+1)*MAX_EFETIVO);
            const lbl = temSemi ? `SEMIFINAL \u2014 S\u00c9RIE ${si+1} / ${totalSeries} \u00b7 APURADA` : "S\u00c9RIE \u00daNICA \u00b7 APURADA";
            const serieOrd = [...serie].map((a)=>({a, m:res[a.id]!=null?parseFloat(getMarca(res[a.id])):null})).filter(x=>x.m!=null).sort((a,b)=>a.m-b.m);
            pags.push(`
              <div class="${pgClass(s)}">
                ${cabPrv(s, numPag, null)}
                <div class="blk blk-semi">${lbl}<span class="blk-s">${serie.length} atleta${serie.length!==1?"s":""}</span></div>
                ${infoBarreiras}
                <table><thead>${thCor}</thead><tbody>${serieOrd.map(({a,m},j)=>linhaRes(a,j,m,false,res[a.id])).join("")}</tbody></table>
                ${rodape(s)}
              </div>`);
          }
          if (classGeral.length > 0) {
            numPag++;
            const nRaiasFin = nRaiasProva2;
            const topN = classGeral.slice(0, nRaiasFin);
            pags.push(`
              <div class="${pgClass(s)}">
                ${cabPrv(s, numPag, "\u2b50 FINAL")}
                <div class="blk blk-final">FINAL \u2014 ${nRaiasFin} MELHORES TEMPOS<span class="blk-s">resultado final da prova</span></div>
                ${infoBarreiras}
                <table><thead>${thCor}</thead><tbody>${topN.map(({a,m},j)=>linhaRes(a,j,m,true,res[a.id])).join("")}</tbody></table>
                ${rodape(s)}
              </div>`);
          }
        }
      }
    } else {
      // ── CAMPO ──────────────────────────────────────────────────────────────────
      // Identifica se é Salto em Altura ou com Vara (layout de barras progressivas)
      const isAltura = s.prova.tipo === "salto" &&
        (s.prova.id.includes("altura") || s.prova.id.includes("vara"));

      if (isAltura) {
        // ════════════════════════════════════════════════════════════════════
        // SALTO EM ALTURA / COM VARA
        // Layout: cabeçalho com alturas progressivas (em branco) + linha/atleta
        // ════════════════════════════════════════════════════════════════════

        // Número padrão de colunas de altura — árbitro preenche os valores
        // Deixamos 15 colunas em branco para as barras (pode ser ajustado)
        const N_BARRAS = 15;
        const barras   = Array.from({length: N_BARRAS});

        // CSS extra para a tabela de altura (compact, células quadradas)
        const cssAltura = `
          .th-barra { width:28px; font-size:8px; text-align:center; padding:3px 1px; }
          .td-barra { width:28px; font-size:10px; text-align:center; padding:4px 1px; border:1px solid #ccc; }
          .td-barra-h { width:28px; font-size:9px; font-weight:700; text-align:center;
            padding:3px 1px; background:#1a1a1a; color:#FFD700; border:1px solid #333; }
        `;

        const thAltura = `<tr>
          <th style="width:22px">#</th>
          <th style="width:30px">Nº</th>
          <th style="width:50px">CBAt</th>
          <th style="width:110px" class="thal">ATLETA</th>
          <th style="width:64px">NASCIMENTO</th>
          <th style="width:90px" class="thal">CLUBE / EQUIPE</th>
          <th colspan="${N_BARRAS}" style="text-align:center;letter-spacing:1.5px;background:#222;color:#FFD700;border:1px solid #444;font-size:9px">ANOTAÇÕES DAS TENTATIVAS</th>
          <th style="width:28px;font-size:8px;background:#2a1a1a;color:#ff8888;text-align:center;border:1px solid #444" title="Saltos na Última">SU</th>
          <th style="width:28px;font-size:8px;background:#2a1a1a;color:#ff8888;text-align:center;border:1px solid #444" title="Falhas na Prova">FP</th>
          <th style="width:52px">MELHOR</th>
          <th style="width:30px">POS.</th>
        </tr>
        <tr style="background:#1a1a1a">
          <td style="border:1px solid #333"></td>
          <td style="border:1px solid #333"></td>
          <td style="border:1px solid #333"></td>
          <td style="border:1px solid #333"></td>
          <td style="border:1px solid #333"></td>
          <td style="border:1px solid #333"></td>
          ${barras.map(() => `<td class="td-barra-h"></td>`).join("")}
          <td style="border:1px solid #333"></td>
          <td style="border:1px solid #333"></td>
          <td style="border:1px solid #333"></td>
          <td style="border:1px solid #333"></td>
        </tr>`;

        const linhaAlturaVazia = (a, j) => `
          <tr class="${j%2===0?"par":"imp"}">
            <td class="tdn">${j+1}</td>
            <td class="tdn" style="font-weight:700;color:#333">${numPeito[a.id]||""}</td>
            <td class="tdcbat">${_getCbat(a)}</td>
            <td class="tdal"><span class="anome">${a.nome}</span>${excTag(getInsc(a))}</td>
            <td class="tdat">${fmtNasc(a)}</td>
            <td class="tdcl">${getClubeAtleta(a)||"\u2014"}</td>
            ${barras.map(() => `<td class="td-barra"></td>`).join("")}
            <td style="width:28px;text-align:center;border:1px solid #ddd"></td>
            <td style="width:28px;text-align:center;border:1px solid #ddd"></td>
            <td class="tdmb"></td>
            <td class="tdp"></td>
          </tr>`;

        const totalGrupos = Math.ceil(atl.length / MAX);
        
        if (!temRes) {
          // Sem resultados — súmula em branco para preenchimento manual
          for (let gi = 0; gi < totalGrupos; gi++) {
            numPag++;
            const grp  = atl.slice(gi*MAX, (gi+1)*MAX);
            const lblG = totalGrupos > 1 ? `GRUPO ${gi+1} / ${totalGrupos}` : null;
            pags.push(`
              <div class="${pgClass(s)}">
                <style>${cssAltura}</style>
                ${cabPrv(s, numPag, lblG)}
                <div class="blk blk-parc">S\u00daMULA<span class="blk-s">${grp.length} atleta${grp.length!==1?"s":""} \u00b7 preencher alturas no cabe\u00e7alho</span></div>
                <div style="padding:3px 13px;font-size:8px;color:#999;background:#fafafa;border:1px solid #e0e0e0;border-top:none">
                  SU = Saltos na \u00daltima altura transposta \u00b7 FP = Falhas na Prova \u00b7 Desempate: RT 26.9 (1\u00ba menor SU \u00b7 2\u00ba menor FP)
                </div>
                <table style="table-layout:fixed">
                  <thead>${thAltura}</thead>
                  <tbody>${grp.map((a,j) => linhaAlturaVazia(a,j)).join("")}</tbody>
                </table>
                ${rodape(s)}
              </div>`);
          }
        } else {
          // Com resultados — preenche barras e tentativas dos dados salvos
          // Coletar todas as alturas únicas dos resultados
          const alturasSet = new Set();
          Object.values(res).forEach(r => {
            if (r && typeof r === "object" && Array.isArray(r.alturas)) {
              r.alturas.forEach(h => { if (h) alturasSet.add(parseFloat(h)); });
            }
          });
          const alturasRes = [...alturasSet].filter(n => !isNaN(n)).sort((a,b) => a-b);
          const nBarras = Math.max(alturasRes.length, 1);

          // Helper: calcular SU e FP para impressão
          const calcSUPrint = (r, alts) => {
            if (!r || typeof r !== "object") return 0;
            const tObj = (r.tentativas && typeof r.tentativas === "object") ? r.tentativas : {};
            const melhor = parseFloat(getMarca(r));
            if (isNaN(melhor)) return 0;
            const key = alts.find(h => Math.abs(h - melhor) < 0.001);
            if (key == null) return 0;
            const kStr = key.toFixed(2);
            const arr = Array.isArray(tObj[kStr]) ? tObj[kStr] : Array.isArray(tObj[String(key)]) ? tObj[String(key)] : [];
            return arr.filter(t => t === "X" || t === "O").length;
          };
          const calcFPPrint = (r, alts) => {
            if (!r || typeof r !== "object") return 0;
            const tObj = (r.tentativas && typeof r.tentativas === "object") ? r.tentativas : {};
            let total = 0;
            alts.forEach(h => {
              const kStr = h.toFixed(2);
              const arr = Array.isArray(tObj[kStr]) ? tObj[kStr] : Array.isArray(tObj[String(h)]) ? tObj[String(h)] : [];
              // Só conta X das alturas que o atleta transpôs (tem pelo menos 1 "O")
              if (arr.includes("O")) {
                total += arr.filter(t => t === "X").length;
              }
            });
            return total;
          };

          // Classificar atletas com desempate RT 26.9
          const classAltura = [...atl]
            .map(a => {
              const r = res[a.id];
              const m = r != null ? parseFloat(getMarca(r)) : null;
              const su = calcSUPrint(r, alturasRes);
              const fp = calcFPPrint(r, alturasRes);
              return { a, m: (m != null && !isNaN(m)) ? m : null, su, fp, r };
            })
            .filter(x => x.m !== null)
            .sort((a2, b2) => {
              if (b2.m !== a2.m) return b2.m - a2.m;   // 1º melhor altura
              if (a2.su !== b2.su) return a2.su - b2.su; // RT 26.9.1: menor SU
              if (a2.fp !== b2.fp) return a2.fp - b2.fp; // RT 26.9.2: menor FP
              return 0;
            });

          // Detectar desempate
          const marcasIguaisAlt = classAltura.some((c, idx) => idx > 0 && c.m === classAltura[idx-1].m);
          const avisoDesempateAlt = marcasIguaisAlt
            ? `<div style="padding:3px 13px;font-size:9px;color:#666;background:#f9f9f0;border:1px solid #e0d880;border-top:none">
                \u2696\ufe0f RT 26.9 \u2014 Regra de Desempate Aplicada (1\u00ba menor SU \u00b7 2\u00ba menor FP)
               </div>`
            : "";

          const semRes = atl.filter(a => !classAltura.some(c => c.a.id === a.id));

          const thAlturaRes = `<tr>
            <th style="width:22px">#</th>
            <th style="width:30px">Nº</th>
            <th style="width:50px">CBAt</th>
            <th style="width:110px" class="thal">ATLETA</th>
            <th style="width:64px">NASCIMENTO</th>
            <th style="width:90px" class="thal">CLUBE / EQUIPE</th>
            ${alturasRes.map(h => `<th colspan="3" class="td-barra-h" style="font-size:9px;min-width:60px">${h.toFixed(2).replace(".",",")}</th>`).join("")}
            <th style="width:28px;font-size:8px;background:#2a1a1a;color:#ff8888;text-align:center;border:1px solid #444">SU</th>
            <th style="width:28px;font-size:8px;background:#2a1a1a;color:#ff8888;text-align:center;border:1px solid #444">FP</th>
            <th style="width:52px">MELHOR</th>
            <th style="width:30px">POS.</th>
          </tr>`;

          const fmtTent = (t) => t === "O" ? "\u25CF" : t === "X" ? "\u2717" : t === "-" ? "\u2013" : "";

          const linhaAlturaRes = (a, pos, j, su, fp) => {
            const r = res[a.id];
            const tentsObj = (r && typeof r === "object" && r.tentativas && typeof r.tentativas === "object") ? r.tentativas : {};
            const melhor = r != null ? parseFloat(getMarca(r)) : null;
            return `
            <tr class="${j%2===0?"par":"imp"}">
              <td class="tdn">${j+1}</td>
              <td class="tdn" style="font-weight:700;color:#333">${numPeito[a.id]||""}</td>
              <td class="tdcbat">${_getCbat(a)}</td>
              <td class="tdal"><span class="anome">${a.nome}</span>${excTag(getInsc(a))}</td>
              <td class="tdat">${fmtNasc(a)}</td>
              <td class="tdcl">${getClubeAtleta(a)||"\u2014"}</td>
              ${alturasRes.map(h => {
                const key = h.toFixed(2);
                const tent = Array.isArray(tentsObj[key]) ? tentsObj[key] : 
                             Array.isArray(tentsObj[String(h)]) ? tentsObj[String(h)] : ["","",""];
                return [0,1,2].map(i => {
                  const v = tent[i] || "";
                  const cor = v === "O" ? "color:#2a8a2a;font-weight:700" : v === "X" ? "color:#cc2222;font-weight:700" : "color:#888";
                  return `<td class="td-barra" style="${cor}">${fmtTent(v)}</td>`;
                }).join("");
              }).join("")}
              <td style="width:28px;text-align:center;font-size:10px;font-weight:700;color:#cc4444;border:1px solid #ddd">${melhor != null ? su : "\u2014"}</td>
              <td style="width:28px;text-align:center;font-size:10px;font-weight:700;color:#cc4444;border:1px solid #ddd">${melhor != null ? fp : "\u2014"}</td>
              <td class="tdmbd">${melhor != null ? melhor.toFixed(2).replace(".",",") + "m" : "\u2014"}</td>
              <td class="tdpf">${pos != null ? pos + "\u00b0" : "\u2014"}</td>
            </tr>`;
          };

          const todosOrdenados = [
            ...classAltura.map((c,i) => ({ a: c.a, pos: i+1, su: c.su, fp: c.fp })),
            ...semRes.map(a => ({ a, pos: null, su: 0, fp: 0 }))
          ];
          const totalGruposR = Math.ceil(todosOrdenados.length / MAX);

          for (let gi = 0; gi < totalGruposR; gi++) {
            numPag++;
            const grp  = todosOrdenados.slice(gi*MAX, (gi+1)*MAX);
            const lblG = totalGruposR > 1 ? `GRUPO ${gi+1} / ${totalGruposR}` : null;
            pags.push(`
              <div class="${pgClass(s)}">
                <style>${cssAltura}</style>
                ${cabPrv(s, numPag, lblG)}
                <div class="blk blk-cfin">RESULTADO<span class="blk-s">${classAltura.length} classificado${classAltura.length!==1?"s":""}</span></div>
                ${avisoDesempateAlt}
                <table style="table-layout:fixed">
                  <thead>${thAlturaRes}</thead>
                  <tbody>${grp.map(({a, pos, su, fp}, j) => linhaAlturaRes(a, pos, j, su, fp)).join("")}</tbody>
                </table>
                ${rodape(s)}
              </div>`);
          }
        }

      } else {
        // ════════════════════════════════════════════════════════════════════
        // DEMAIS SALTOS E LANÇAMENTOS
        // Layout: # CBAt Atleta Nasc Clube T1 T2 T3 Marca CP T4 T5 T6 Marca Pos
        // ════════════════════════════════════════════════════════════════════

        const isSaltoHorizPrint = s.prova.nome?.includes("Distância") || s.prova.nome?.includes("Triplo");
        const ventoHint = isSaltoHorizPrint ? '<div style="font-size:7px;color:#4a80cc;font-weight:400">vento</div>' : '';
        const thCampoUnico = `<tr>
          <th style="width:22px">#</th>
          <th style="width:30px">Nº</th>
          <th style="width:52px">CBAt</th>
          <th class="thal">ATLETA</th>
          <th style="width:66px">NASCIMENTO</th>
          <th class="thal">CLUBE / EQUIPE</th>
          <th style="width:48px">T1${ventoHint}</th>
          <th style="width:48px">T2${ventoHint}</th>
          <th style="width:48px">T3${ventoHint}</th>
          <th style="width:58px">MARCA</th>
          <th style="width:36px">CP</th>
          <th style="width:48px">T4${ventoHint}</th>
          <th style="width:48px">T5${ventoHint}</th>
          <th style="width:48px">T6${ventoHint}</th>
          <th style="width:58px">MARCA</th>
          <th style="width:32px">POS.</th>
          ${_thPtsEq}
        </tr>`;

        const linhaCampoVazia = (a, j) => {
          const vSpace = isSaltoHorizPrint ? '<div style="font-size:7px;color:#bbb;margin-top:2px">___m/s</div>' : '';
          return `
          <tr class="${j%2===0?"par":"imp"}">
            <td class="tdn">${j+1}</td>
            <td class="tdn" style="font-weight:700;color:#333">${numPeito[a.id]||""}</td>
            <td class="tdcbat">${_getCbat(a)}</td>
            <td class="tdal"><span class="anome">${a.nome}</span>${excTag(getInsc(a))}</td>
            <td class="tdat">${fmtNasc(a)}</td>
            <td class="tdcl">${getClubeAtleta(a)||"\u2014"}</td>
            <td class="tdm">${vSpace}</td><td class="tdm">${vSpace}</td><td class="tdm">${vSpace}</td>
            <td class="tdmb"></td>
            <td class="tdpc"></td>
            <td class="tdm">${vSpace}</td><td class="tdm">${vSpace}</td><td class="tdm">${vSpace}</td>
            <td class="tdmbd"></td>
            <td class="tdpf"></td>
            ${_tdClassifVazio}${_tdPtsEqVazio}
          </tr>`;
        };

        const linhaCampoRes = (a, m, j, posG, resData) => {
          const vaiFin = posG <= 8;
          const estilo = vaiFin ? "" : "opacity:.45";
          const d = resData && typeof resData === "object" ? resData : {};
          const isSaltoH = s.prova.nome?.includes("Distância") || s.prova.nome?.includes("Triplo");
          const fmtT = (key) => {
            const v = d[key];
            if (!v && v !== 0) return "\u2014";
            const sv = String(v).trim().toUpperCase();
            if (sv === "X") return '<span style="color:#cc2222;font-weight:800">X</span>';
            const n = parseFloat(v);
            if (isNaN(n)) return sv;
            return n.toFixed(2).replace(".",",");
          };
          const ventoT = (key) => {
            if (!isSaltoH) return "";
            const vv = d[key+"v"];
            if (!vv) return "";
            return `<div style="font-size:7px;color:#4a80cc;margin-top:1px">${vv}</div>`;
          };
          const hasTent = d.t1 != null || d.t2 != null || d.t3 != null;
          return `
          <tr class="${j%2===0?"par":"imp"}" style="${estilo}">
            <td class="tdn">${j+1}</td>
            <td class="tdn" style="font-weight:700;color:#333">${numPeito[a.id]||""}</td>
            <td class="tdcbat">${_getCbat(a)}</td>
            <td class="tdal"><span class="anome">${a.nome}</span>${excTag(getInsc(a))}</td>
            <td class="tdat">${fmtNasc(a)}</td>
            <td class="tdcl">${getClubeAtleta(a)||"\u2014"}</td>
            <td class="tdm">${hasTent ? fmtT("t1") + ventoT("t1") : "\u2014"}</td>
            <td class="tdm">${hasTent ? fmtT("t2") + ventoT("t2") : "\u2014"}</td>
            <td class="tdm">${hasTent ? fmtT("t3") + ventoT("t3") : "\u2014"}</td>
            <td class="tdmb">${fmtMarca(m,"m")}</td>
            <td class="tdpc" style="${vaiFin?"color:#2a8a2a;font-weight:800":"color:#aaa"}">${posG}\u00b0${vaiFin?" \u2192":""}</td>
            <td class="tdm" style="${vaiFin?"":"background:#f0f0f0;color:#ccc"}">${hasTent && vaiFin ? fmtT("t4") + ventoT("t4") : "\u2014"}</td>
            <td class="tdm" style="${vaiFin?"":"background:#f0f0f0;color:#ccc"}">${hasTent && vaiFin ? fmtT("t5") + ventoT("t5") : "\u2014"}</td>
            <td class="tdm" style="${vaiFin?"":"background:#f0f0f0;color:#ccc"}">${hasTent && vaiFin ? fmtT("t6") + ventoT("t6") : "\u2014"}</td>
            <td class="${vaiFin?"tdmbd":"tdmb"}" style="${vaiFin?"":"color:#aaa"}">${fmtMarca(m,"m")}</td>
            <td class="${vaiFin?"tdpf":"tdp"}" style="${vaiFin?"":"color:#aaa"}">${posG}\u00b0</td>
            ${_tdClassifVal(a.id)}${_tdPtsEqVal(a.id)}
          </tr>`;
        };

        const totalGrupos = Math.ceil(atl.length / MAX);

        if (!temRes) {
          for (let gi = 0; gi < totalGrupos; gi++) {
            numPag++;
            const grp  = atl.slice(gi*MAX, (gi+1)*MAX);
            const lblG = totalGrupos > 1 ? `GRUPO ${gi+1} / ${totalGrupos}` : null;
            pags.push(`
              <div class="${pgClass(s)}">
                ${cabPrv(s, numPag, lblG)}
                <div class="blk blk-parc">S\u00daMULA<span class="blk-s">${grp.length} atleta${grp.length!==1?"s":""} \u00b7 T1\u2013T3 parcial \u00b7 top 8 fazem T4\u2013T6</span></div>
                <div style="padding:3px 13px;font-size:8px;color:#999;background:#fafafa;border:1px solid #e0e0e0;border-top:none">
                  T1\u2013T3: ordem por sorteio (RT 25.5) \u00b7 T4\u2013T6: ordem inversa da CP (RT 25.6.1) \u00b7 Empate na CP: mesma ordem do sorteio (RT 25.6.2) \u00b7 Desempate: RT 25.22
                </div>
                <table><thead>${thCampoUnico}</thead><tbody>
                  ${grp.map((a,j) => linhaCampoVazia(a,j)).join("")}
                </tbody></table>
                ${rodape(s)}
              </div>`);
          }
        } else {
          const classGeral = [...atl]
            .map((a) => ({ a, m: res[a.id] != null ? parseFloat(getMarca(res[a.id])) : null, raw: res[a.id] }))
            .filter((x) => x.m != null)
            .sort((a, b) => {
              if (b.m !== a.m) return b.m - a.m;          // 1º critério: melhor marca
              return cmpCampo(res[a.a.id], res[b.a.id]);  // desempate: sequência completa
            });

          // Detectar se houve desempate por RT 25.22
          const marcasIguais = classGeral.some((c, idx) => idx > 0 && c.m === classGeral[idx-1].m);
          const avisoDesempate = marcasIguais
            ? `<div style="padding:3px 13px;font-size:9px;color:#666;background:#f9f9f0;border:1px solid #e0d880;border-top:none">
                \u2696\ufe0f RT 25.22 \u2014 Regra de Desempate Aplicada (2\u00aa melhor marca, 3\u00aa, etc.)
               </div>`
            : "";
          const avisoOrdem = `<div style="padding:3px 13px;font-size:8px;color:#999;background:#fafafa;border:1px solid #e0e0e0;border-top:none">
            T1\u2013T3: ordem por sorteio (RT 25.5) \u00b7 T4\u2013T6: ordem inversa da CP (RT 25.6.1) \u00b7 Empate na CP: mesma ordem do sorteio (RT 25.6.2)
          </div>`;

          for (let gi = 0; gi < totalGrupos; gi++) {
            numPag++;
            const grp      = atl.slice(gi*MAX, (gi+1)*MAX);
            const lblG     = totalGrupos > 1 ? `GRUPO ${gi+1} / ${totalGrupos}` : null;
            const grpClass = classGeral.filter((c) => grp.some((a) => a.id === c.a.id));
            pags.push(`
              <div class="${pgClass(s)}">
                ${cabPrv(s, numPag, lblG)}
                <div class="blk blk-parc">RESULTADO<span class="blk-s">${grp.length} atleta${grp.length!==1?"s":""} \u00b7 top 8 fizeram T4\u2013T6</span></div>
                ${avisoDesempate}${avisoOrdem}
                <table><thead>${thCampoUnico}</thead><tbody>
                  ${grpClass.map(({a,m,raw}, j) => {
                    const posG = classGeral.findIndex((c) => c.a.id === a.id) + 1;
                    return linhaCampoRes(a, m, j, posG, raw);
                  }).join("")}
                </tbody></table>
                ${rodape(s)}
              </div>`);
          }
        }
      }
    }
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${opts.modo === "resultados" ? "Resultados" : "S\u00famulas"} \u2014 ${evento.nome}</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="barra">
    <div>
      <div class="barra-titulo">\u{1F5A8} ${opts.modo === "resultados" ? "RESULTADOS PARA IMPRESS\u00c3O" : "S\u00daMULAS PARA IMPRESS\u00c3O"}</div>
      <div class="barra-sub">${evento.nome}</div>
    </div>
    <div class="barra-acoes">
      <span class="badge-tot">${pags.length} p\u00e1gina${pags.length!==1?"s":""}</span>
      <button class="btn-imp" onclick="window.print()">\u{1F5A8} IMPRIMIR / SALVAR PDF</button>
      <button class="btn-fch" onclick="window.close()">✕ Fechar</button>
    </div>
  </div>
  <div class="conteudo">${pags.join("")}</div>
  <script>window.focus();<\/script>
</body>
</html>`;
}

export { gerarHtmlImpressao };
