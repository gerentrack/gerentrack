import { _getClubeAtleta, _getCbat, _getNascDisplay, _getLocalEventoDisplay } from "../../shared/formatters/utils";
import { GT_DEFAULT_LOGO } from "../../shared/branding";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { CATEGORIAS } from "../../shared/constants/categorias";
import { resKey } from "../../shared/constants/fases";

/**
 * Gera HTML de Relatório Oficial de Participação.
 * Agrupado por Equipe → Categoria+Sexo → Atletas (uma linha por atleta).
 * DNS desconsiderado. Layout retrato com fonte adaptável.
 *
 * @param {object}   evento           - objeto do evento
 * @param {object[]} atletasFiltrados - atletas a incluir
 * @param {object[]} inscricoes       - todas inscrições
 * @param {object}   resultados       - mapa de resKey → { atletaId: ... }
 * @param {object[]} equipes          - lista de equipes
 * @param {object}   organizador      - { nome, entidade }
 * @param {string}   assinatura       - base64 da imagem de assinatura
 * @param {object}   numeracaoPeito   - { eventoId: { atletaId: nº } }
 */
export function gerarHtmlRelatorioParticipacao(evento, atletasFiltrados, inscricoes, resultados, equipes, organizador, assinatura, numeracaoPeito) {
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
  const numPeito = numeracaoPeito?.[evento.id] || {};
  const orgNome = organizador?.entidade || organizador?.nome || "";
  const localEvento = _getLocalEventoDisplay(evento) || evento.local || "";

  const fmtMarca = (v, unidade) => {
    if (v == null || v === "") return "\u2014";
    const st = String(v).toUpperCase();
    if (["DNS", "DNF", "DQ", "NM", "NH"].includes(st)) return st;
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

  // Montar dados por atleta (excluir provas com DNS)
  const dadosAtletas = atletasFiltrados.map(atleta => {
    const inscsAtleta = inscricoes.filter(i => i.atletaId === atleta.id && i.eventoId === evento.id);
    const provasResultados = [];

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
          const marcaFinal = obj.status || obj.marca;
          // Desconsiderar DNS
          if (String(marcaFinal).toUpperCase() === "DNS") break;
          provasResultados.push({
            provaNome: prova?.nome || provaId,
            unidade: prova?.unidade || "",
            marca: marcaFinal,
            posicao: obj.posicao ?? null,
          });
          break;
        }
      }
    });

    // Se o atleta só tinha DNS em todas as provas, ignorar
    const catId = inscsAtleta[0]?.categoriaOficialId || inscsAtleta[0]?.categoriaId || "";
    const sexo = inscsAtleta[0]?.sexo || "M";

    return {
      atleta,
      catId,
      sexo,
      equipeId: atleta.equipeId || "",
      provasResultados,
    };
  }).filter(d => d.provasResultados.length > 0); // Excluir atletas sem participação real

  // Agrupar por equipe
  const porEquipe = {};
  dadosAtletas.forEach(d => {
    const eq = equipes.find(e => e.id === d.equipeId);
    const eqNome = eq ? (eq.clube || eq.nome || "Sem equipe") : (d.atleta.clube || "Sem equipe");
    const eqKey = d.equipeId || "_sem_equipe";
    if (!porEquipe[eqKey]) porEquipe[eqKey] = { nome: eqNome, sigla: eq?.sigla || "", atletas: [] };
    porEquipe[eqKey].atletas.push(d);
  });

  // Ordenar equipes alfabeticamente
  const equipesOrdenadas = Object.values(porEquipe).sort((a, b) => a.nome.localeCompare(b.nome));

  // CSS
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Barlow',sans-serif;background:#ebebeb;color:#111;font-size:11px;}
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
      padding:10mm 12mm 8mm;display:flex;flex-direction:column;
      box-shadow:0 4px 24px rgba(0,0,0,.2);}
    .cab{display:flex;align-items:flex-start;justify-content:space-between;
      padding-bottom:7px;margin-bottom:7px;border-bottom:3px solid #111;gap:10px;font-size:initial;}
    .cab-left{display:flex;align-items:center;min-width:32mm;}
    .cab-left img{max-height:18mm;max-width:32mm;object-fit:contain;}
    .cab-c{flex:1;text-align:center;}
    .cab-ev{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;
      color:#111;text-transform:uppercase;letter-spacing:.5px;line-height:1.2;}
    .cab-dt{font-size:10px;color:#555;margin-top:3px;}
    .cab-right{display:flex;align-items:center;min-width:32mm;justify-content:flex-end;}
    .cab-right img{max-height:18mm;max-width:32mm;object-fit:contain;}
    .titulo-rel{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:900;
      text-align:center;text-transform:uppercase;letter-spacing:2px;margin:8px 0 10px;
      padding:5px 0;border-top:2px solid #111;border-bottom:2px solid #111;}
    .equipe-header{background:#111;color:#fff;padding:6px 12px;border-radius:3px;margin-bottom:8px;
      font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;letter-spacing:1px;text-transform:uppercase;}
    .cat-header{background:#e8e8e8;padding:4px 10px;margin-bottom:4px;border-left:4px solid #1976D2;
      font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;color:#333;letter-spacing:.5px;}
    table{width:100%;border-collapse:collapse;margin-bottom:10px;}
    th{padding:3px 6px;font-size:8px;font-weight:700;font-family:'Barlow Condensed',sans-serif;
      letter-spacing:.5px;text-align:center;border:1px solid #ccc;text-transform:uppercase;background:#f0f0f0;color:#333;}
    td{padding:3px 6px;font-size:10px;border:1px solid #ddd;vertical-align:top;}
    table{table-layout:fixed;}
    col.c-num{width:28px;} col.c-cbat{width:48px;} col.c-nome{width:200px;} col.c-nasc{width:68px;}
    .td-num{text-align:center;font-weight:700;}
    .td-cbat{text-align:center;font-size:9px;}
    .td-nome{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .td-nasc{text-align:center;font-size:9px;white-space:nowrap;}
    .td-provas{font-size:9px;line-height:1.8;}
    .prova-badge{display:inline-block;margin-right:6px;margin-bottom:2px;white-space:nowrap;
      background:#f5f5f5;border:1px solid #ddd;border-radius:3px;padding:1px 6px;}
    .prova-nome{color:#333;font-size:8px;}
    .prova-marca{font-weight:800;color:#111;font-family:'Barlow Condensed',sans-serif;font-size:10px;margin-left:3px;}
    .prova-pos{color:#fff;background:#1976D2;border-radius:2px;padding:0 4px;font-weight:700;font-size:7px;margin-left:3px;}
    .par{background:#fff;} .imp{background:#fafafa;}
    .rod-wrap{margin-top:auto;padding-bottom:2mm;}
    .rod-ass-center{text-align:center;margin-bottom:4px;}
    .rod-ln{border-bottom:1px solid #aaa;margin-bottom:4px;display:inline-flex;align-items:flex-end;justify-content:center;min-width:200px;}
    .rod-lb{font-size:8px;color:#888;text-align:center;font-style:italic;}
    .rod-info{font-size:8px;color:#aaa;text-align:center;line-height:1.4;margin-top:6px;}
    @media print{
      @page{size:A4 portrait;margin:0;}
      body{background:#fff;}
      .barra{display:none!important;}
      .conteudo{padding-top:0;}
      .pg{margin:0;border:none;box-shadow:none;width:100%;min-height:100vh;padding:10mm 12mm 8mm;}
      .pg:not(:last-child){page-break-after:always;}
    }
  `;

  const cabecalho = `
    <div class="cab">
      <div class="cab-left">
        ${evento.logoCabecalho ? `<img src="${evento.logoCabecalho}" alt=""/>` : ""}
      </div>
      <div class="cab-c">
        <div class="cab-ev">${evento.nome || ""}</div>
        <div class="cab-dt">\u{1F4C5} ${dataEvento}${localEvento ? ` \u00a0\u00b7\u00a0 \u{1F4CD} ${localEvento}` : ""}</div>
      </div>
      <div class="cab-right">
        ${evento.logoCabecalhoDireito ? `<img src="${evento.logoCabecalhoDireito}" alt=""/>` : ""}
      </div>
    </div>
    <div class="titulo-rel">Relat\u00f3rio Oficial de Participa\u00e7\u00e3o</div>
  `;

  const gerarRodape = () => `
    <div class="rod-wrap">
      <div class="rod-ass-center">
        <div class="rod-ln">
          ${assinatura ? `<img src="${assinatura}" alt="Assinatura" style="max-height:96px;max-width:200px;object-fit:contain;display:block;margin:0 auto;" />` : ""}
        </div>
        <div class="rod-lb">${orgNome || "Organizador"}</div>
      </div>
      <div class="rod-info">
        <div>Emitido em: ${dataGeracao}</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:5px;margin-top:2px;">
          <span>Plataforma de Competi\u00e7\u00f5es \u2014</span>
          <img src="${_gtLogo}" alt="GERENTRACK" style="max-height:8mm;object-fit:contain;opacity:0.7;vertical-align:middle;" />
        </div>
      </div>
      ${evento.logoRodape ? `<div style="margin-top:6px;text-align:center;"><img src="${evento.logoRodape}" alt="" style="max-width:100%;max-height:20mm;object-fit:contain;"/></div>` : ""}
    </div>
  `;

  const fmtNasc = (atleta) => {
    const nasc = _getNascDisplay(atleta);
    if (nasc) return nasc;
    if (atleta.dataNascimento) {
      try { return new Date(atleta.dataNascimento + "T12:00:00").toLocaleDateString("pt-BR"); } catch { /* */ }
    }
    if (atleta.anoNasc) return String(atleta.anoNasc);
    return "\u2014";
  };

  // Gerar páginas — uma por equipe
  const pagesHtml = equipesOrdenadas.map(eq => {
    // Agrupar atletas desta equipe por categoria+sexo
    const porCatSexo = {};
    eq.atletas.forEach(d => {
      const catObj = CATEGORIAS.find(c => c.id === d.catId);
      const catNome = catObj?.nome || d.catId || "Sem categoria";
      const sexoLabel = d.sexo === "F" ? "Feminino" : "Masculino";
      const key = `${d.catId}_${d.sexo}`;
      if (!porCatSexo[key]) porCatSexo[key] = { catNome, sexoLabel, catOrdem: catObj ? CATEGORIAS.indexOf(catObj) : 99, sexoOrdem: d.sexo === "M" ? 0 : 1, atletas: [] };
      porCatSexo[key].atletas.push(d);
    });

    // Ordenar por categoria + sexo
    const grupos = Object.values(porCatSexo).sort((a, b) => a.catOrdem - b.catOrdem || a.sexoOrdem - b.sexoOrdem);

    const gruposHtml = grupos.map(g => {
      const rows = g.atletas.map((d, idx) => {
        const a = d.atleta;
        const nPeito = numPeito[a.id] || "";
        const cbat = _getCbat(a) || "";
        const nasc = fmtNasc(a);

        const provasHtml = d.provasResultados.map(p => {
          const marca = fmtMarca(p.marca, p.unidade);
          const pos = p.posicao != null ? `${p.posicao}\u00ba` : "";
          return `<span class="prova-badge"><span class="prova-nome">${p.provaNome}</span><span class="prova-marca">${marca}</span>${pos ? `<span class="prova-pos">${pos}</span>` : ""}</span>`;
        }).join("");

        return `<tr class="${idx % 2 === 0 ? "par" : "imp"}">
          <td class="td-num">${nPeito}</td>
          <td class="td-cbat">${cbat}</td>
          <td class="td-nome">${a.nome || "\u2014"}</td>
          <td class="td-nasc">${nasc}</td>
          <td class="td-provas">${provasHtml || "\u2014"}</td>
        </tr>`;
      }).join("");

      return `
        <div class="cat-header">${g.catNome} \u2014 ${g.sexoLabel}</div>
        <table>
          <colgroup><col class="c-num"/><col class="c-cbat"/><col class="c-nome"/><col class="c-nasc"/><col/></colgroup>
          <thead><tr>
            <th>N\u00ba</th><th>CBAt</th><th style="text-align:left">Nome Completo</th><th>Nasc.</th><th style="text-align:left">Provas e Resultados</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }).join("");

    return `
      <div class="pg">
        ${cabecalho}
        <div class="equipe-header">${eq.nome}${eq.sigla ? ` (${eq.sigla})` : ""} \u2014 ${eq.atletas.length} atleta(s)</div>
        ${gruposHtml}
        ${gerarRodape()}
      </div>
    `;
  }).join("");

  const totalAtletas = dadosAtletas.length;
  const totalEquipes = equipesOrdenadas.length;

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Relat\u00f3rio de Participa\u00e7\u00e3o \u2014 ${evento.nome || ""}</title>
<style>${CSS}</style>
</head><body>
<div class="barra">
  <div>
    <div class="barra-titulo">RELAT\u00d3RIO DE PARTICIPA\u00c7\u00c3O</div>
    <div class="barra-sub">${evento.nome || ""} \u2014 ${totalAtletas} atleta(s) \u2014 ${totalEquipes} equipe(s)</div>
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
