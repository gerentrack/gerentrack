/**
 * RankingExtractionEngine
 *
 * Extrai entradas de ranking a partir dos resultados de uma competição finalizada.
 * Somente atletas com CBAt cadastrado são incluídos.
 * Segue o mesmo padrão de iteração do RecordDetectionEngine.
 */

import { todasAsProvas } from '../../domain/provas/todasAsProvas';
import { getFasesProva } from '../constants/fases';
import { _getCbat, _getClubeAtleta } from '../formatters/utils.jsx';

const RankingExtractionEngine = {

  /**
   * Extrai entradas de ranking dos resultados de um evento finalizado.
   * @returns {Array} array de entradas com status "pendente"
   */
  extrairEntradas(evento, resultados, atletas, equipes, inscricoes) {
    if (!evento || !resultados || !atletas) return [];
    const eid = evento.id;
    const allProvas = todasAsProvas();
    const progHorario = evento.programaHorario || {};
    const entradas = [];
    const chavesVistas = new Set();

    const eventoLocal = [evento.cidade, evento.estado].filter(Boolean).join(" - ");
    const eventoUf = evento.estado || evento.uf || "";

    Object.keys(resultados).forEach(chave => {
      if (!chave.startsWith(eid + "_")) return;

      // Separar fase (__ELI, __SEM, __FIN)
      let chaveBase = chave.substring(eid.length + 1);
      let faseSufixo = "";
      if (chaveBase.includes("__")) {
        const partes = chaveBase.split("__");
        chaveBase = partes[0];
        faseSufixo = partes[1] || "";
      }

      // Extrair provaId, catId, sexo
      const lastUnd = chaveBase.lastIndexOf("_");
      if (lastUnd < 0) return;
      const sexo = chaveBase.substring(lastUnd + 1);
      const rest = chaveBase.substring(0, lastUnd);
      const lastUnd2 = rest.lastIndexOf("_");
      if (lastUnd2 < 0) return;
      const catId = rest.substring(lastUnd2 + 1);
      const provId = rest.substring(0, lastUnd2);

      const prova = allProvas.find(p => p.id === provId);
      if (!prova) return;

      // Excluir revezamento (sem CBAt individual)
      if (prova.tipo === "revezamento") return;

      // Só considerar FINAL
      const fasesConf = getFasesProva(provId, progHorario);
      if (fasesConf.length > 1) {
        if (faseSufixo !== "FIN") return;
      } else {
        if (faseSufixo) return;
      }

      const resByAtleta = resultados[chave] || {};

      Object.entries(resByAtleta).forEach(([aId, raw]) => {
        const status = (raw != null && typeof raw === "object") ? (raw.status || "") : "";
        if (["DNS", "DNF", "DQ", "NM", "NH"].includes(status)) return;

        const m = typeof raw === "object" ? raw.marca : raw;
        if (m == null || m === "") return;
        const marcaNum = parseFloat(String(m).replace(",", "."));
        if (isNaN(marcaNum)) return;

        // Buscar atleta
        const atl = atletas.find(a => a.id === aId);
        if (!atl) return;

        // Somente atletas com CBAt
        const cbat = _getCbat(atl);
        if (!cbat || !cbat.trim()) return;

        // Vento — só relevante para provas de pista (s) e saltos horizontais (distância, triplo)
        const ventoStr = (raw != null && typeof raw === "object") ? String(raw.vento || "").trim() : "";
        const ventoNum = parseFloat(ventoStr.replace(",", "."));
        const provaTemVento = prova.unidade === "s" || /dist[aâ]ncia|triplo/i.test(prova.nome || "");
        const ventoAssistido = provaTemVento && !isNaN(ventoNum) && ventoNum > 2.0;

        // Chave de idempotência
        const _chave = `${eid}_${provId}_${catId}_${sexo}_${aId}`;
        if (chavesVistas.has(_chave)) return;
        chavesVistas.add(_chave);

        const clube = _getClubeAtleta(atl, equipes) || atl.clube || "";
        const atletaUf = atl.uf || atl.estado || "";

        entradas.push({
          id: "rnk_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
          eventoId: eid,
          eventoNome: evento.nome || "",
          eventoData: evento.data || "",
          eventoLocal,
          eventoUf,
          provaId: provId,
          provaNome: prova.nome || provId,
          unidade: prova.unidade || "s",
          atletaId: aId,
          atletaNome: atl.nome || "",
          atletaCbat: cbat,
          atletaNasc: atl.dataNasc || atl.anoNasc || "",
          atletaUf,
          atletaClube: clube,
          marca: String(m),
          marcaNum,
          categoriaId: catId,
          sexo,
          vento: ventoStr,
          ventoAssistido,
          status: "pendente",
          fonte: "auto",
          resolvidoPor: null,
          resolvidoEm: null,
          observacao: "",
          criadoEm: Date.now(),
          _chave,
        });
      });
    });

    return entradas;
  },

  /**
   * Merge idempotente: adiciona novas entradas sem duplicar (por _chave).
   */
  mesclarEntradas(existentes, novas) {
    const chaves = new Set((existentes || []).map(e => e._chave));
    const merged = [...(existentes || [])];
    novas.forEach(n => {
      if (!chaves.has(n._chave)) {
        merged.push(n);
        chaves.add(n._chave);
      }
    });
    return merged;
  },
};

export default RankingExtractionEngine;
