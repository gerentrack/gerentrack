import { _getClubeAtleta, _getCbat } from "../../shared/formatters/utils";
import { GT_DEFAULT_LOGO } from "../../shared/branding";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { resKey } from "../../shared/constants/fases";

/**
 * Gera HTML de Relatório Oficial de Participação.
 * Abre nova janela com botão "Imprimir / Salvar PDF".
 *
 * @param {object}   evento           - objeto do evento
 * @param {object[]} atletasFiltrados - atletas a incluir no relatório
 * @param {object[]} inscricoes       - todas inscrições
 * @param {object}   resultados       - mapa de resKey → { atletaId: { marca, posicao, ... } }
 * @param {object[]} equipes          - lista de equipes
 * @param {object}   organizador      - { nome, entidade } do organizador
 */
export function gerarHtmlRelatorioParticipacao(evento, atletasFiltrados, inscricoes, resultados, equipes, organizador) {
  if (!evento || !atletasFiltrados || atletasFiltrados.length === 0) return;

  const _branding = (() => { try { return JSON.parse(localStorage.getItem("gt_branding")) || {}; } catch { return {}; } })();
  const _gtLogo = _branding.logo || GT_DEFAULT_LOGO;
  const dataGeracao = new Date().toLocaleString("pt-BR");
  const dataEvento = evento.data
    ? new Date(evento.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    : "";
  const getClubeAtleta = (a) => _getClubeAtleta(a, equipes);
  const provas = todasAsProvas();
  const FASE_PRIO = ["FIN", "SEM", "ELI", ""];
  const FASE_LABEL = { FIN: "Final", SEM: "Semifinal", ELI: "Eliminat\u00f3ria", "": "" };

  const fmtMarca = (v, unidade) => {
    if (v == null || v === "") return "\u2014";
    const st = String(v).toUpperCase();
    if (["DNS","DNF","DQ","NM","NH"].includes(st)) return st;
    if (unidade === "m") {
      const n = parseFloat(v);
      return isNaN(n) ? "\u2014" : n.toFixed(2).replace(".", ",") + "m";
    }
    const raw = parseFloat(v);
    if (isNaN(raw)) return "\u2014";
    const totalMs = Math.round(raw >= 1000 ? raw : raw * 1000);
    const h = Math.floor(totalMs / 3600000);
    const m = Math.floor((totalMs % 3600000) / 60000);
    const s = Math.floor((totalMs % 60000) / 1000);
    const millis = totalMs % 1000;
    const msPart = String(millis).padStart(3, "0").slice(0, 2);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}.${String(s).padStart(2, "0")},${msPart}`;
    if (m > 0) return `${m}.${String(s).padStart(2, "0")},${msPart}`;
    return `${s},${msPart}`;
  };

  const exibirPosicao = (pos) => {
    if (pos == null) return "\u2014";
    return `${pos}\u00ba`;
  };

  // Monta dados por atleta
  const blocos = atletasFiltrados.map(atleta => {
    const inscsAtleta = inscricoes.filter(i => i.atletaId === atleta.id && i.eventoId === evento.id);
    const linhas = [];

    inscsAtleta.forEach(insc => {
      const provaId = insc.provaId;
      const catId = insc.categoriaOficialId || insc.categoriaId;
      const sexo = insc.sexo;
      const prova = provas.find(p => p.id === provaId);

      for (const fase of FASE_PRIO) {
        const chave = resKey(evento.id, provaId, catId, sexo, fase || undefined);
        const docRes = resultados[chave];
        if (docRes && docRes[atleta.id] != null) {
          const entrada = docRes[atleta.id];
          const obj = typeof entrada === "object" ? entrada : { marca: entrada };
          linhas.push({
            provaNome: prova?.nome || provaId,
            unidade: prova?.unidade || "",
            marca: obj.status || obj.marca,
            posicao: obj.posicao ?? null,
            fase: FASE_LABEL[fase] || fase,
            cat: insc.categoriaOficial || insc.categoria || "",
          });
          break;
        }
      }
    });

    return { atleta, linhas };
  }).filter(b => b.linhas.length > 0);

  const orgNome = organizador?.entidade || organizador?.nome || "";
  const localEvento = evento.local || "";

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
    .btn-fch{background:transparent;color:#888;border:1px solid #333;
      padding:10px 20px;border-radius:8px;cursor:pointer;font-size:13px;}
    .conteudo{padding-top:74px;}
    .pg{background:#fff;width:210mm;min-height:297mm;margin:16px auto;
      padding:12mm 15mm 10mm;display:flex;flex-direction:column;
      box-shadow:0 4px 24px rgba(0,0,0,.2);}
    .cab{display:flex;align-items:flex-start;justify-content:space-between;
      padding-bottom:7px;margin-bottom:10px;border-bottom:3px solid #111;gap:10px;}
    .cab-logo{display:flex;align-items:center;gap:6px;}
    .cab-logo img{max-height:18mm;max-width:32mm;object-fit:contain;}
    .cab-c{flex:1;text-align:center;}
    .cab-ev{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;
      color:#111;text-transform:uppercase;letter-spacing:.5px;line-height:1.3;}
    .cab-dt{font-size:10px;color:#555;margin-top:3px;}
    .cab-org{font-size:10px;color:#333;margin-top:2px;font-weight:600;}
    .titulo-rel{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;
      text-align:center;text-transform:uppercase;letter-spacing:2px;margin:10px 0 14px;
      padding:6px 0;border-top:2px solid #111;border-bottom:2px solid #111;}
    .atleta-header{background:#111;color:#fff;padding:7px 12px;border-radius:3px;margin-bottom:6px;
      display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;}
    .atleta-nome{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;letter-spacing:.5px;}
    .atleta-meta{font-size:10px;color:#bbb;display:flex;gap:10px;}
    table{width:100%;border-collapse:collapse;border:1px solid #ccc;margin-bottom:14px;}
    thead tr{background:#333;color:#fff;}
    th{padding:5px 8px;font-size:10px;font-weight:700;font-family:'Barlow Condensed',sans-serif;
      letter-spacing:.6px;text-align:center;border:1px solid #444;text-transform:uppercase;}
    td{padding:5px 8px;font-size:11px;border:1px solid #ddd;text-align:center;vertical-align:middle;}
    .td-prova{text-align:left;font-weight:600;}
    .td-marca{font-weight:700;font-family:'Barlow Condensed',sans-serif;font-size:13px;}
    .td-pos{font-weight:700;font-size:12px;}
    .par{background:#fff;} .imp{background:#f8f8f8;}
    .rod-wrap{margin-top:auto;padding-bottom:3mm;}
    .rod-assinaturas{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:6px;}
    .rod-ass{flex:1;max-width:200px;}
    .rod-ln{border-bottom:1px solid #aaa;margin-bottom:4px;height:28px;}
    .rod-lb{font-size:9px;color:#888;text-align:center;font-style:italic;}
    .rod-info{font-size:9px;color:#aaa;text-align:center;line-height:1.4;}
    @media print{
      @page{size:A4 portrait;margin:0;}
      body{background:#fff;}
      .barra{display:none!important;}
      .conteudo{padding-top:0;}
      .pg{margin:0;border:none;box-shadow:none;width:100%;height:100vh;padding:12mm 15mm 10mm;overflow:hidden;}
      .pg:not(:last-child){page-break-after:always;}
    }
  `;

  const cabecalho = `
    <div class="cab">
      <div class="cab-logo">
        ${evento.logoCompeticao ? `<img src="${evento.logoCompeticao}" alt="">` : ""}
      </div>
      <div class="cab-c">
        <div class="cab-ev">${evento.nome || ""}</div>
        <div class="cab-dt">${dataEvento}${localEvento ? ` \u2014 ${localEvento}` : ""}</div>
        ${orgNome ? `<div class="cab-org">${orgNome}</div>` : ""}
      </div>
      <div class="cab-logo">
        <img src="${_gtLogo}" alt="GERENTRACK" style="max-height:14mm;opacity:0.6;">
      </div>
    </div>
    <div class="titulo-rel">Relat\u00f3rio Oficial de Participa\u00e7\u00e3o</div>
  `;

  const rodape = `
    <div class="rod-wrap">
      <div class="rod-assinaturas">
        <div class="rod-ass"><div class="rod-ln"></div><div class="rod-lb">Organizador Respons\u00e1vel</div></div>
        <div style="flex:1"></div>
        <div class="rod-ass"><div class="rod-ln"></div><div class="rod-lb">Carimbo / Selo</div></div>
      </div>
      <div class="rod-info">
        <div>Gerado em: ${dataGeracao}</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:2px;">
          <span>Plataforma de Competi\u00e7\u00f5es \u2014</span>
          <img src="${_gtLogo}" alt="GERENTRACK" style="max-height:16mm;object-fit:contain;opacity:0.7;vertical-align:middle;" />
        </div>
      </div>
      ${evento.logoRodape ? `<div style="margin-top:10px;text-align:center;"><img src="${evento.logoRodape}" alt="" style="max-width:100%;max-height:24mm;object-fit:contain;"/></div>` : ""}
    </div>
  `;

  // Agrupa atletas por página (~4 atletas por página A4)
  const ATLETAS_POR_PAG = 4;
  const paginas = [];
  for (let i = 0; i < blocos.length; i += ATLETAS_POR_PAG) {
    paginas.push(blocos.slice(i, i + ATLETAS_POR_PAG));
  }

  const pagesHtml = paginas.map((grupo, pgIdx) => {
    const atletasHtml = grupo.map(({ atleta, linhas }) => {
      const clube = getClubeAtleta(atleta) || "";
      const cbat = _getCbat(atleta) || "";
      const sexoLabel = atleta.sexo === "M" ? "Masculino" : "Feminino";
      const cat = linhas[0]?.cat || "";

      const rows = linhas.map((l, idx) => `
        <tr class="${idx % 2 === 0 ? "par" : "imp"}">
          <td class="td-prova">${l.provaNome}</td>
          <td class="td-marca">${fmtMarca(l.marca, l.unidade)}</td>
          <td class="td-pos">${exibirPosicao(l.posicao)}</td>
          <td>${l.fase}</td>
        </tr>
      `).join("");

      return `
        <div class="atleta-header">
          <div class="atleta-nome">${atleta.nome || "\u2014"}</div>
          <div class="atleta-meta">
            <span>${sexoLabel}</span>
            <span>${cat}</span>
            ${clube ? `<span>${clube}</span>` : ""}
            ${cbat ? `<span>CBAt: ${cbat}</span>` : ""}
          </div>
        </div>
        <table>
          <thead><tr><th style="text-align:left">Prova</th><th>Marca</th><th>Posi\u00e7\u00e3o</th><th>Fase</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }).join("");

    return `
      <div class="pg">
        ${cabecalho}
        ${atletasHtml}
        ${pgIdx === paginas.length - 1 ? rodape : '<div class="rod-wrap"></div>'}
      </div>
    `;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Relat\u00f3rio de Participa\u00e7\u00e3o \u2014 ${evento.nome || ""}</title>
<style>${CSS}</style>
</head><body>
<div class="barra">
  <div>
    <div class="barra-titulo">RELAT\u00d3RIO DE PARTICIPA\u00c7\u00c3O</div>
    <div class="barra-sub">${evento.nome || ""} \u2014 ${atletasFiltrados.length} atleta(s)</div>
  </div>
  <div class="barra-acoes">
    <button class="btn-imp" onclick="window.print()">IMPRIMIR / SALVAR PDF</button>
    <button class="btn-fch" onclick="window.close()">Fechar</button>
  </div>
</div>
<div class="conteudo">
  ${pagesHtml}
</div>
</body></html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) { alert("Permita pop-ups para gerar o relat\u00f3rio."); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
