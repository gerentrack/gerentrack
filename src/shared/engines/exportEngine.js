/**
 * exportEngine.js
 * Exportação de dados filtrados por organizadorId em CSV.
 * Gera um ZIP com múltiplos CSVs via Blob.
 */

function csvEscape(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function arrayToCSV(headers, rows) {
  const lines = [headers.map(csvEscape).join(",")];
  rows.forEach(row => lines.push(headers.map(h => csvEscape(row[h])).join(",")));
  return "\uFEFF" + lines.join("\n"); // BOM for Excel UTF-8
}

/**
 * Exporta dados de um organizador em múltiplos CSVs empacotados em um ZIP.
 * Como não temos JSZip, gera CSVs individuais para download sequencial,
 * ou um único CSV consolidado.
 *
 * Para simplicidade, gera um único arquivo JSON ou múltiplos downloads.
 * Abordagem: gera um único CSV por tipo e dispara download de cada um.
 */
export function exportarDadosOrg(orgId, dados) {
  const { atletas, equipes, inscricoes, resultados, eventos, historicoAcoes } = dados;

  // Filtrar por org
  const meusEventos = (eventos || []).filter(ev => ev.organizadorId === orgId);
  const meusEventoIds = new Set(meusEventos.map(ev => ev.id));
  const minhasEquipes = (equipes || []).filter(eq => eq.organizadorId === orgId);
  const minhasEquipeIds = new Set(minhasEquipes.map(eq => eq.id));
  const meusAtletas = (atletas || []).filter(a => a.organizadorId === orgId || minhasEquipeIds.has(a.equipeId));
  const minhasInscricoes = (inscricoes || []).filter(i => meusEventoIds.has(i.eventoId));
  const meusResultados = (resultados || []).filter(r => meusEventoIds.has(r.eventoId));
  const meuHistorico = (historicoAcoes || []).filter(h => h.organizadorId === orgId);

  const arquivos = [];

  // Competições
  if (meusEventos.length > 0) {
    const headers = ["id", "nome", "data", "dataFim", "local", "cidade", "uf", "statusAprovacao", "dataCadastro"];
    arquivos.push({ nome: "competicoes.csv", conteudo: arrayToCSV(headers, meusEventos) });
  }

  // Equipes
  if (minhasEquipes.length > 0) {
    const headers = ["id", "nome", "sigla", "cidade", "uf", "cnpj", "email", "status"];
    arquivos.push({ nome: "equipes.csv", conteudo: arrayToCSV(headers, minhasEquipes) });
  }

  // Atletas
  if (meusAtletas.length > 0) {
    const headers = ["id", "nome", "dataNasc", "sexo", "clube", "cbat", "equipeId", "email"];
    arquivos.push({ nome: "atletas.csv", conteudo: arrayToCSV(headers, meusAtletas) });
  }

  // Inscrições
  if (minhasInscricoes.length > 0) {
    const headers = ["id", "eventoId", "atletaId", "provaId", "tipo", "equipeCadastro", "dataCadastro"];
    arquivos.push({ nome: "inscricoes.csv", conteudo: arrayToCSV(headers, minhasInscricoes) });
  }

  // Resultados
  if (meusResultados.length > 0) {
    const headers = ["id", "eventoId", "atletaId", "provaId", "marca", "posicao", "fase", "serie", "vento", "status"];
    arquivos.push({ nome: "resultados.csv", conteudo: arrayToCSV(headers, meusResultados) });
  }

  // Histórico
  if (meuHistorico.length > 0) {
    const headers = ["id", "data", "nomeUsuario", "acao", "detalhe", "modulo"];
    arquivos.push({ nome: "auditoria.csv", conteudo: arrayToCSV(headers, meuHistorico) });
  }

  return arquivos;
}

/**
 * Dispara download de múltiplos CSVs sequencialmente.
 */
export function downloadCSVs(arquivos, prefixo = "gerentrack") {
  arquivos.forEach((arq, idx) => {
    setTimeout(() => {
      const blob = new Blob([arq.conteudo], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${prefixo}_${arq.nome}`;
      a.click();
      URL.revokeObjectURL(url);
    }, idx * 500); // 500ms entre cada download para evitar bloqueio do browser
  });
}
