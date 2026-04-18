/**
 * TeamScoringEngine
 *
 * Cálculo de pontuação por equipes: provas individuais, revezamentos,
 * combinadas e bônus por quebra de recorde.
 *
 * Extraído de App.jsx (linhas 1089–1532) — Etapa 3 da refatoração.
 */

import { todasAsProvas }           from '../../domain/provas/todasAsProvas';
import { CATEGORIAS }              from '../constants/categorias';
import { getFasesModo, buscarSeriacao, resolverCronometragem } from '../constants/fases';
import { getComposicaoCombinada }  from '../../domain/combinadas/composicao';
import { CombinedEventEngine }     from './combinedEventEngine';
import { CombinedScoringEngine }   from './combinedScoringEngine';
import { _getEquipeIdAtleta }      from '../formatters/utils.jsx';
import { _marcaParaMs }            from '../formatters/utils.jsx';

const _nomeProvaMatch = (a, b) => {
  if (!a || !b) return false;
  if (a === b) return true;
  const strip = (s) => s.replace(/\s*\(.*?\)/g, "").trim().toLowerCase();
  return strip(a) === strip(b);
};

// ─── TEAM SCORING ENGINE ────────────────────────────────────────────────────
// Responsável pelo cálculo de pontuação por equipes
const TeamScoringEngine = {

  // Calcula pontos de uma prova individual para cada equipe
  // classificados: array ordenado de { atleta, marca, ... } (já vem da TelaResultados)
  // config: { equipesParticipantes, tabelaPontuacao, atletasPorEquipePorProva }
  // atletas: array completo de atletas
  // Retorna: { equipeId: { pontos, atletaNome, posicao, atletas: [{atletaNome, posicao, pontos}] } }
  calcularPontosProva(classificados, config, atletas, equipes) {
    const resultado = {};
    if (!config || !config.tabelaPontuacao) return resultado;
    const tabela = config.tabelaPontuacao;
    // Se equipesParticipantes vazio, aceita qualquer equipe com atletas classificados
    const participantes = config.equipesParticipantes || [];
    const equipesSet = participantes.length > 0
      ? new Set(participantes)
      : null; // null = aceita todos
    const maxPorEquipe = Math.max(1, parseInt(config.atletasPorEquipePorProva) || 1);

    // Classificação apenas federados: pular não-federados na atribuição de posição
    const apenasFed = config.classificacaoApenasFederados
      && Array.isArray(config.equipeIdsFederados) && config.equipeIdsFederados.length > 0;
    const fedSet = apenasFed ? new Set(config.equipeIdsFederados) : null;

    // Contador de quantos atletas de cada equipe já pontuaram
    const contadorEq = {};
    let posicaoFed = 0;

    classificados.forEach((item, idx) => {
      const atl = item.atleta;
      if (!atl) return;

      // Quando classificacaoApenasFederados: pular atletas não-federados
      if (apenasFed) {
        const eqIdFed = _getEquipeIdAtleta(atl, equipes);
        const temCbat = atl.cbat && String(atl.cbat).trim() !== "";
        if (!eqIdFed || !fedSet.has(eqIdFed) || !temCbat) return;
      }

      posicaoFed++;
      const posicao = apenasFed ? posicaoFed : (idx + 1);
      const pontos = tabela[posicao] || 0;
      if (pontos === 0) return;
      const eqId = _getEquipeIdAtleta(atl, equipes);
      if (!eqId || (equipesSet !== null && !equipesSet.has(eqId))) return;
      contadorEq[eqId] = contadorEq[eqId] || 0;
      if (contadorEq[eqId] >= maxPorEquipe) return;
      contadorEq[eqId]++;
      if (!resultado[eqId]) {
        resultado[eqId] = { pontos: 0, atletaNome: atl.nome, posicao, atletas: [] };
      }
      resultado[eqId].pontos += pontos;
      resultado[eqId].atletas.push({ atletaNome: atl.nome, atletaId: atl.id, posicao, pontos });
    });
    return resultado;
  },

  // Calcula pontos de uma prova de revezamento para cada equipe
  // classificados: array ordenado de { atleta, marca, ... }
  // config: { equipesParticipantes, tabelaPontuacaoRevezamentos }
  calcularPontosRevezamento(classificados, config, atletas, equipes) {
    const resultado = {};
    if (!config || !config.tabelaPontuacaoRevezamentos) return resultado;
    const tabela = config.tabelaPontuacaoRevezamentos;
    const participantesR = config.equipesParticipantes || [];
    const equipesSet = participantesR.length > 0 ? new Set(participantesR) : null;

    // Classificação apenas federados: pular equipes não-federadas
    const apenasFedR = config.classificacaoApenasFederados
      && Array.isArray(config.equipeIdsFederados) && config.equipeIdsFederados.length > 0;
    const fedSetR = apenasFedR ? new Set(config.equipeIdsFederados) : null;
    let posicaoFedR = 0;

    classificados.forEach((item, idx) => {
      // Para revezamentos, equipeId vem direto do item (não do "atleta")
      const eqId = item.equipeId || _getEquipeIdAtleta(item.atleta, equipes);
      if (!eqId || (equipesSet !== null && !equipesSet.has(eqId))) return;
      // Pular equipes não-federadas quando flag ativo
      // Revezamento: equipe federada + TODOS os atletas com CBAt
      if (apenasFedR) {
        if (!fedSetR.has(eqId)) return;
        const atletasRevezIds = item.atletasIds || (item.atletasRevez || []).map(a => a.id);
        if (atletasRevezIds.length > 0) {
          const todosComCbatR = atletasRevezIds.every(aId => { const a = atletas.find(aa => aa.id === aId); return a && a.cbat && String(a.cbat).trim() !== ""; });
          if (!todosComCbatR) return;
        }
      }
      posicaoFedR++;
      const posicao = apenasFedR ? posicaoFedR : (idx + 1);
      const pontos = tabela[posicao] || 0;
      if (pontos === 0) return;
      if (!resultado[eqId]) {
        resultado[eqId] = { pontos, atletaNome: item.nomeEquipe || item.atleta?.nome || "—", posicao, atletas: [{ atletaNome: item.nomeEquipe || item.atleta?.nome || "—", atletaId: eqId, posicao, pontos }] };
      }
    });
    return resultado;
  },

  // Calcula classificação geral das equipes agregando todos os pontos
  // eventoAtual, inscricoes, resultados, atletas, equipes — dados do sistema
  // Retorna: { classificacao: [{ equipeId, nome, sigla, totalPontos, pontosPorProva }], totalProvasComResultado, totalProvas }
  calcularClassificacaoEquipes(eventoAtual, inscricoes, resultados, atletas, equipes, recordes, filtroSexo) {
    const _configRaw = eventoAtual.pontuacaoEquipes;
    if (!_configRaw || !_configRaw.ativo) return { classificacao: [], totalProvasComResultado: 0, totalProvas: 0 };
    // Injetar equipeIdsFederados do evento no config para calcularPontosProva
    const config = { ..._configRaw, equipeIdsFederados: eventoAtual.equipeIdsFederados || [] };

    const eid = eventoAtual.id;
    const todasProvas = todasAsProvas();
    const inscDoEvento = inscricoes.filter(i => i.eventoId === eid);
    const equipesMap = {};
    const _addEqMap = (eqId) => {
      if (equipesMap[eqId]) return;
      const eq = equipes.find(e => e.id === eqId);
      const nomeEquipe = eq ? (eq.clube || eq.nome || "—") : (eqId.startsWith("clube_") ? eqId.substring(6) : "—");
      equipesMap[eqId] = { equipeId: eqId, nome: nomeEquipe, sigla: eq?.sigla || "", totalPontos: 0, pontosPorProva: {} };
    };
    if ((config.equipesParticipantes || []).length > 0) {
      config.equipesParticipantes.forEach(_addEqMap);
    } else {
      // equipesParticipantes vazio: pré-popular com equipes dos atletas inscritos
      inscDoEvento.forEach(i => {
        const atl = atletas.find(a => a.id === i.atletaId);
        if (!atl) return;
        const eqId = _getEquipeIdAtleta(atl, equipes);
        if (eqId) _addEqMap(eqId);
      });
    }

    let totalProvas = 0;
    let totalProvasComResultado = 0;
    const provasPrograma = eventoAtual.provasPrograma || [];

    // Provas componentes de combinadas
    const provasComponentes = [];
    const provasCombinadas = [];
    const provasRevezamentos = [];
    provasPrograma.forEach(provaId => {
      const prova = todasProvas.find(p => p.id === provaId);
      if (!prova) return;
      if (prova.tipo === "combinada") {
        provasCombinadas.push(prova);
      } else if (prova.tipo === "revezamento") {
        provasRevezamentos.push(prova);
      }
    });
    provasPrograma.forEach(provaId => {
      const prova = todasProvas.find(p => p.id === provaId);
      if (!prova) return;
      if (prova.tipo === "combinada") {
        const comps = CombinedEventEngine.gerarProvasComponentes(provaId, eid);
        provasComponentes.push(...comps);
      }
    });
    const todasProvasComComb = [...todasProvas, ...provasComponentes];

    // Calcular pontos de provas normais (não-combinadas, não-revezamentos e não-componentes)
    const _sexos = filtroSexo ? [filtroSexo] : ["M", "F"];
    const configSeriacaoEvt = eventoAtual.configSeriacao || {};
    provasPrograma.forEach(provaId => {
      const prova = todasProvas.find(p => p.id === provaId);
      if (!prova || prova.tipo === "combinada" || prova.tipo === "revezamento") return; // combinadas e revezamentos são tratados separadamente
      totalProvas++;

      // Verificar cada combinação sexo × categoria
      _sexos.forEach(sexo => {
        CATEGORIAS.forEach(cat => {
          // Buscar resultado: priorizar FIN de multi-fase, depois chave base (só se sem fases)
          const fasesConf = getFasesModo(provaId, configSeriacaoEvt);
          let res = null;
          if (fasesConf.length > 1) {
            // Prova com fases: usar só resultado da FIN
            if (fasesConf.includes("FIN")) {
              const keyFin = eid + "_" + prova.id + "_" + cat.id + "_" + sexo + "__FIN";
              res = resultados[keyFin];
            }
          } else {
            // Prova sem fases: usar chave base
            const keyBase = eid + "_" + prova.id + "_" + cat.id + "_" + sexo;
            res = resultados[keyBase];
          }
          if (!res || Object.keys(res).length === 0) return;

          // Só pontua quando o último resultado da prova for digitado
          // Para fases com seriação (FIN), contar apenas classificados
          const _faseSuf = fasesConf.length > 1 ? "FIN" : "";
          const _serPont = _faseSuf ? buscarSeriacao(eventoAtual.seriacao, prova.id, cat.id, sexo, _faseSuf) : null;
          var inscsProva = (_serPont?.series && _serPont.series.length > 0)
            ? _serPont.series.flatMap(ser => ser.atletas.map(a => ({ atletaId: a.id || a.atletaId })))
            : inscDoEvento.filter(function(i) {
                return i.provaId === prova.id &&
                  (i.categoriaId || i.categoriaOficialId) === cat.id &&
                  i.sexo === sexo &&
                  i.tipo !== "revezamento";
              });
          var isAltVaraEng = prova.tipo === "salto" && (prova.id.includes("altura") || prova.id.includes("vara"));
          var isCampoTentEng = prova.unidade !== "s" && !isAltVaraEng;
          var provaCompleta;
          if (inscsProva.length === 0) {
            provaCompleta = true;
          } else if (isCampoTentEng) {
            // Prova de campo completa quando:
            // - todos os inscritos têm resultado, E
            // - cada atleta ou tem status (DNS/NM/DQ) ou tem T3 preenchido
            //   (eliminados no CP não terão T4-T6, mas a prova está completa assim mesmo)
            provaCompleta = Object.keys(res).length >= inscsProva.length &&
              inscsProva.every(function(i) {
                var raw = res[i.atletaId];
                if (!raw) return false;
                var status = typeof raw === "object" ? (raw.status || "") : "";
                if (status === "DNS" || status === "NM" || status === "DQ") return true;
                // Top 8: precisa de T6. Eliminados (sem T4): basta T3
                var t3 = typeof raw === "object" ? raw.t3 : null;
                var t6 = typeof raw === "object" ? raw.t6 : null;
                if (t6 != null && t6 !== "") return true; // top8 completo
                if (t3 != null && t3 !== "") return true; // eliminado, basta T3
                return false;
              });
          } else {
            provaCompleta = Object.keys(res).length >= inscsProva.length;
          }

          const classificados = Object.entries(res)
            .map(function(entry) {
              var atletaId = entry[0], raw = entry[1];
              var marca = (raw != null && typeof raw === "object") ? (raw.marca != null ? raw.marca : null) : raw;
              var status = (raw != null && typeof raw === "object") ? (raw.status || "").toUpperCase() : "";
              var marcaUp = String(marca || "").toUpperCase();
              var isStatus = ["DNS","DNF","NM","DQ","NH"].indexOf(status) !== -1 || ["DNS","DNF","NM","DQ","NH"].indexOf(marcaUp) !== -1;
              var atletaFound = atletas.find(function(a) { return a.id === atletaId; });
              if (!atletaFound) {
                var inscA = inscDoEvento.find(function(i) { return i.atletaId === atletaId; });
                if (inscA) {
                  atletaFound = atletas.find(function(a) { return a.nome && inscA.atletaNome && a.nome.trim().toLowerCase() === inscA.atletaNome.trim().toLowerCase(); })
                    || { id: atletaId, nome: inscA.atletaNome || "?", equipeId: inscA.equipeCadastroId || null, clube: inscA.equipeCadastro || "" };
                }
              }
              var marcaNum = (!isStatus && marca != null) ? parseFloat(marca) : null;
              return { atleta: atletaFound, marca: (marcaNum != null && !isNaN(marcaNum)) ? marcaNum : null };
            })
            .filter(function(x) { return x.atleta && x.marca != null && !isNaN(x.marca); })
            .sort(function(a, b) {
              if (prova.unidade === "s") return a.marca - b.marca;
              return b.marca - a.marca;
            });

          if (classificados.length === 0) return;
          totalProvasComResultado++;
          if (!provaCompleta) return; // aguarda todos os resultados antes de pontuar
          var pontosProva = TeamScoringEngine.calcularPontosProva(classificados, config, atletas, equipes);
          var provaLabel = prova.nome + " " + cat.nome + " " + (sexo === "M" ? "M" : "F");
          Object.keys(pontosProva).forEach(function(eqId) {
            _addEqMap(eqId); // garante entrada mesmo se equipe não estava no mapa
            if (equipesMap[eqId]) {
              equipesMap[eqId].totalPontos += pontosProva[eqId].pontos;
              equipesMap[eqId].pontosPorProva[provaLabel] = pontosProva[eqId];
            }
          });
        });
      });
    });

    // ── Revezamento: agrupa variantes M_/F_ do mesmo nome para evitar duplicação ──
    // Helpers que mesclam resultados e inscrições de todas as variantes.
    var mergeResRevez = function(provaRef, catId, sexo, faseSufixo) {
      var vars = provasRevezamentos.filter(function(p) { return p.nome === provaRef.nome; });
      var merged = {};
      vars.forEach(function(v) {
        var k = faseSufixo
          ? eid + "_" + v.id + "_" + catId + "_" + sexo + "__" + faseSufixo
          : eid + "_" + v.id + "_" + catId + "_" + sexo;
        var r = resultados[k];
        if (r) Object.keys(r).forEach(function(eqId) { if (!(eqId in merged)) merged[eqId] = r[eqId]; });
      });
      return merged;
    };
    var mergeInscsRevez = function(provaRef, catId, sexo) {
      var varIds = provasRevezamentos.filter(function(p) { return p.nome === provaRef.nome; }).map(function(p) { return p.id; });
      var vistosEq = new Set();
      return inscDoEvento.filter(function(i) {
        if (i.tipo !== "revezamento") return false;
        if (varIds.indexOf(i.provaId) < 0) return false;
        if ((i.categoriaId || i.categoriaOficialId) !== catId) return false;
        if (i.sexo !== sexo) return false;
        if (vistosEq.has(i.equipeId)) return false;
        vistosEq.add(i.equipeId);
        return true;
      });
    };
    // Dedup provas revezamento por nome: se programa tem M_ e F_, iteramos 1 vez.
    var provasRevezUnicas = [];
    var _nomesRevezVistos = new Set();
    provasRevezamentos.forEach(function(p) {
      if (_nomesRevezVistos.has(p.nome)) return;
      _nomesRevezVistos.add(p.nome);
      provasRevezUnicas.push(p);
    });

    // Calcular pontos de revezamentos (tabela diferenciada)
    provasRevezUnicas.forEach(function(prova) {
      totalProvas++;

      _sexos.forEach(sexo => {
        CATEGORIAS.forEach(cat => {
          // Buscar resultado mesclado entre todas as variantes com mesmo nome
          const fasesConfR = getFasesModo(prova.id, configSeriacaoEvt);
          const _faseSufRLookup = fasesConfR.length > 1 ? (fasesConfR.indexOf("FIN") >= 0 ? "FIN" : "") : "";
          let res = mergeResRevez(prova, cat.id, sexo, _faseSufRLookup);
          if (!res || Object.keys(res).length === 0) return;

          // Só pontua quando todos os inscritos nesse revezamento/cat/sexo têm resultado
          const _faseSufR = fasesConfR.length > 1 ? "FIN" : "";
          const _serPontR = _faseSufR ? buscarSeriacao(eventoAtual.seriacao, prova.id, cat.id, sexo, _faseSufR) : null;
          var inscsRevezEng = (_serPontR?.series && _serPontR.series.length > 0)
            ? _serPontR.series.flatMap(ser => ser.atletas.map(a => ({ atletaId: a.id || a.atletaId })))
            : mergeInscsRevez(prova, cat.id, sexo);
          var revezCompleto = inscsRevezEng.length === 0 || Object.keys(res).length >= inscsRevezEng.length;

          // Revezamento: chaves são equipeId (não atletaId)
          const classificados = Object.entries(res)
            .map(function(entry) {
              var eqId = entry[0], raw = entry[1];
              var marca = (raw != null && typeof raw === "object") ? (raw.marca != null ? raw.marca : null) : raw;
              var status = (raw != null && typeof raw === "object") ? (raw.status || "").toUpperCase() : "";
              var marcaUpR = String(marca || "").toUpperCase();
              var isStatus = ["DNS","DNF","DQ","NM","NH"].indexOf(status) !== -1 || ["DNS","DNF","DQ","NM","NH"].indexOf(marcaUpR) !== -1;
              var marcaNumR = (!isStatus && marca != null) ? parseFloat(marca) : null;
              return { equipeId: eqId, marca: (marcaNumR != null && !isNaN(marcaNumR)) ? marcaNumR : null, isStatus: isStatus };
            })
            .filter(function(x) { return x.marca != null && !isNaN(x.marca); })
            .sort(function(a, b) { return a.marca - b.marca; });

          if (classificados.length === 0) return;
          totalProvasComResultado++;

          if (!revezCompleto) return; // aguarda todos os resultados antes de pontuar
          // Atribuir pontos diretamente por equipeId
          const tabela = config.tabelaPontuacaoRevezamentos || {};
          const equipesSet = new Set(config.equipesParticipantes || []);
          // Classificação apenas federados: pular equipes não-federadas no revezamento
          const apenasFedRevez = config.classificacaoApenasFederados
            && Array.isArray(config.equipeIdsFederados) && config.equipeIdsFederados.length > 0;
          const fedSetRevez = apenasFedRevez ? new Set(config.equipeIdsFederados) : null;
          var provaLabel = prova.nome + " " + cat.nome + " " + (sexo === "M" ? "M" : "F");
          let posicaoFedRevez = 0;
          classificados.forEach(function(item, idx) {
            var eqId = item.equipeId;
            if (!eqId || !equipesSet.has(eqId)) return;
            // Pular equipes não-federadas quando flag ativo
            // Revezamento: equipe federada + TODOS os atletas com CBAt
            if (apenasFedRevez) {
              if (!fedSetRevez.has(eqId)) return;
              // Busca em qualquer variante M_/F_ com mesmo nome da prova
              var _varIdsRev = provasRevezamentos.filter(function(pr) { return pr.nome === prova.nome; }).map(function(pr) { return pr.id; });
              var inscRevez = inscDoEvento.find(function(i) { return i.tipo === "revezamento" && i.equipeId === eqId && _varIdsRev.indexOf(i.provaId) >= 0 && (i.categoriaId || i.categoriaOficialId) === cat.id && i.sexo === sexo; });
              var atletasRevezIds = inscRevez?.atletasIds || [];
              var todosComCbat = atletasRevezIds.length > 0 && atletasRevezIds.every(function(aId) { var a = atletas.find(function(aa) { return aa.id === aId; }); return a && a.cbat && String(a.cbat).trim() !== ""; });
              if (!todosComCbat) return;
            }
            posicaoFedRevez++;
            var posicao = apenasFedRevez ? posicaoFedRevez : (idx + 1);
            var pontos = tabela[posicao] || 0;
            if (pontos === 0) return;
            if (equipesMap[eqId]) {
              equipesMap[eqId].totalPontos += pontos;
              equipesMap[eqId].pontosPorProva[provaLabel] = { pontos: pontos, posicao: posicao, atletas: [{ atletaNome: "Equipe", atletaId: eqId, posicao: posicao, pontos: pontos }] };
            }
          });
        });
      });
    });

    // Calcular pontos de combinadas (classificação final — usa tabela normal)
    provasCombinadas.forEach(function(prova) {
      totalProvas++;
      var sexoProva = prova.id.startsWith("F_") ? "F" : "M";
      if (filtroSexo && sexoProva !== filtroSexo) return;
      var catId = prova.id.split("_")[1] || "";
      var cat = CATEGORIAS.find(function(c) { return c.id === catId; });
      if (!cat) return;

      var todasCompDaCombinada = CombinedEventEngine.gerarProvasComponentes(prova.id, eid);
      var atletaIds = [];
      var seen = {};
      inscDoEvento.forEach(function(i) {
        if ((i.combinadaId === prova.id || i.provaId === prova.id) && !seen[i.atletaId]) {
          seen[i.atletaId] = true;
          atletaIds.push(i.atletaId);
        }
      });
      if (atletaIds.length === 0) return;

      // Calcular pontuação
      var rows = atletaIds.map(function(aId) {
        var atl = atletas.find(function(a) { return a.id === aId; });
        var total = 0, provasRealizadas = 0;
        todasCompDaCombinada.forEach(function(pc) {
          var chaveR = eid + "_" + pc.id + "_" + catId + "_" + sexoProva;
          var res = resultados[chaveR] ? resultados[chaveR][aId] : null;
          var marca = res ? (typeof res === "object" ? res.marca : res) : null;
          var ptsManuais = res ? (typeof res === "object" ? res.pontosTabela : null) : null;
          var marcaNum = marca != null ? parseFloat(String(marca).replace(",", ".")) : NaN;
          var cronoAtl = resolverCronometragem(eventoAtual.cronometragemProvas, pc.id, eventoAtual.seriacao, catId, sexoProva, aId);
          var ptsAuto = (!isNaN(marcaNum)) ? CombinedScoringEngine.calcularPontosProva(pc.provaOriginalSufixo, marcaNum, sexoProva, prova.id, cronoAtl) : 0;
          var pts = ptsManuais != null ? Number(ptsManuais) : ptsAuto;
          var statusAtl3 = res ? (typeof res === "object" ? res.status : null) : null;
          if ((marca != null && marca !== "") || statusAtl3) provasRealizadas++;
          total += Number(pts) || 0;
        });
        return { atletaId: aId, nome: atl ? atl.nome : "—", total: total, provasRealizadas: provasRealizadas };
      }).sort(function(a, b) { return b.total - a.total; });

      // Só pontua se classificação final (todas provas componentes têm resultado)
      var provasJulgadas = todasCompDaCombinada.filter(function(pc) {
        var chaveR = eventoAtual.id + "_" + pc.id + "_" + catId + "_" + sexoProva;
        return resultados[chaveR] && Object.keys(resultados[chaveR]).length > 0;
      }).length;
      var todasCompletas = provasJulgadas >= todasCompDaCombinada.length;
      if (!todasCompletas) return;
      totalProvasComResultado++;

      // Montar classificados no formato esperado por calcularPontosProva
      var classificados = rows.map(function(r) {
        var atl = atletas.find(function(a) { return a.id === r.atletaId; });
        return { atleta: atl, marca: r.total };
      }).filter(function(x) { return x.atleta; });

      var pontosProva = TeamScoringEngine.calcularPontosProva(classificados, config, atletas, equipes);
      var comp = getComposicaoCombinada(prova.id);
      var provaLabel = (comp ? comp.nome : prova.nome) + " " + cat.nome + " " + (sexoProva === "M" ? "M" : "F");
      Object.keys(pontosProva).forEach(function(eqId) {
        if (equipesMap[eqId]) {
          equipesMap[eqId].totalPontos += pontosProva[eqId].pontos;
          equipesMap[eqId].pontosPorProva[provaLabel] = pontosProva[eqId];
        }
      });
    });

    // ── Bônus por Quebra de Recorde (comparação em tempo real contra snapshot) ──
    const bonusRecordes = config.bonusRecordes || {}; // { tipoRecordeId: pontosBonus }
    const recSumulaIds = eventoAtual.recordesSumulas || [];
    let totalBonusRecordes = 0;
    if (recSumulaIds.length > 0 && Object.keys(bonusRecordes).some(k => bonusRecordes[k] > 0) && Array.isArray(recordes)) {
      const snapshot = eventoAtual.recordesSnapshot || {};
      const hasSnap = Object.keys(snapshot).length > 0;

      recSumulaIds.forEach(recTipoId => {
        const bonus = parseInt(bonusRecordes[recTipoId]) || 0;
        if (bonus <= 0) return;
        const tipo = recordes.find(r => r.id === recTipoId);
        if (!tipo) return;
        const regsRef = hasSnap ? (snapshot[tipo.id] || []) : (tipo.registros || []);

        // Percorrer todos os resultados desta competição (cada fase dá bônus separado)
        Object.keys(resultados).forEach(chave => {
          if (!chave.startsWith(eid + "_")) return;
          // Separar fase (__ELI, __SEM, __FIN) se presente
          let chaveBase = chave.substring(eid.length + 1); // remove "eid_"
          let temFaseSufixo = false;
          if (chaveBase.includes("__")) {
            const [base] = chaveBase.split("__");
            chaveBase = base;
            temFaseSufixo = true;
          }
          // chaveBase agora é "provaId_catId_sexo"
          const lastUnd = chaveBase.lastIndexOf("_");
          if (lastUnd < 0) return;
          const sexo = chaveBase.substring(lastUnd + 1);
          if (filtroSexo && sexo !== filtroSexo) return;
          const rest = chaveBase.substring(0, lastUnd);
          const lastUnd2 = rest.lastIndexOf("_");
          if (lastUnd2 < 0) return;
          const catId = rest.substring(lastUnd2 + 1);
          const provId = rest.substring(0, lastUnd2);
          const prova = todasProvasComComb.find(p => p.id === provId) || todasProvas.find(p => p.id === provId);
          if (!prova) return;

          // Se chave sem fase mas prova tem fases configuradas → dados obsoletos, ignorar
          if (!temFaseSufixo) {
            const fasesConf = getFasesModo(provId, configSeriacaoEvt);
            if (fasesConf.length > 1) return;
          }

          // Buscar recorde de referência para esta prova/cat/sexo (match por nome quando provaId difere por categoria)
          const snapRec = regsRef.find(r =>
            (r.provaId === provId || _nomeProvaMatch(r.provaNome, prova.nome))
            && r.categoriaId === catId && r.sexo === sexo
          );
          if (!snapRec) return;
          const isMenor = prova.unidade === "s";
          const recMs = isMenor ? _marcaParaMs(snapRec.marca) : parseFloat(snapRec.marca);
          if (recMs == null || isNaN(recMs)) return;

          // Verificar CADA atleta/equipe que superou o recorde nesta fase
          const resByAtleta = resultados[chave] || {};
          const isRevez = prova.tipo === "revezamento";

          Object.entries(resByAtleta).forEach(([aId, raw]) => {
            const status = (raw != null && typeof raw === "object") ? (raw.status || "").toUpperCase() : "";
            if (["DNS","DNF","DQ","NM"].includes(status)) return;
            const m = typeof raw === "object" ? raw.marca : raw;
            if (m == null || m === "") return;
            const n = isMenor ? _marcaParaMs(m) : parseFloat(String(m).replace(",","."));
            if (n == null || isNaN(n)) return;

            const superou = isMenor ? n < recMs : n > recMs;
            if (!superou) return;

            let eqId;
            if (isRevez) {
              eqId = aId;
            } else {
              const atletaRec = atletas.find(a => a.id === aId);
              if (!atletaRec) return;
              eqId = _getEquipeIdAtleta(atletaRec, equipes);
            }
            if (!eqId || !equipesMap[eqId]) return;

            equipesMap[eqId].totalPontos += bonus;
            totalBonusRecordes++;
            if (!equipesMap[eqId].bonusRecordes) equipesMap[eqId].bonusRecordes = [];
            equipesMap[eqId].bonusRecordes.push({
              tipoNome: tipo.nome, tipoSigla: tipo.sigla,
              provaNome: prova.nome || "—",
              atletaNome: isRevez ? (equipes.find(e => e.id === aId)?.nome || "—") : (atletas.find(a => a.id === aId)?.nome || "—"),
              pontos: bonus
            });
          });
        });
      });
    }

    // ── Aplicar penalidades ──────────────────────────────────────────────────
    var penalidades = (config.penalidades || []);
    var totalPenalidades = 0;
    penalidades.forEach(function(pen) {
      if (!pen.equipeId || !equipesMap[pen.equipeId]) return;
      var pts = parseInt(pen.pontos) || 0;
      if (pts <= 0) return;
      equipesMap[pen.equipeId].totalPontos -= pts;
      totalPenalidades += pts;
      if (!equipesMap[pen.equipeId].penalidades) equipesMap[pen.equipeId].penalidades = [];
      equipesMap[pen.equipeId].penalidades.push({
        pontos: pts,
        motivo: pen.motivo === "atraso" ? "Atraso de entrada em prova" : (pen.obs || "Outro"),
        obs: pen.obs || "",
        aplicadoPor: pen.aplicadoPor || "—",
        data: pen.data || "",
      });
    });

    // ── Provas pendentes: combinações prova×categoria×sexo que TÊM inscrições mas NÃO têm resultado ──
    // Usada para o organizador saber exatamente o que ainda precisa digitar.
    // Deduplica por nome+cat+sexo (provas com variantes M_/F_ de mesmo nome viram 1 entrada).
    var provasPendentesMap = new Map();
    var pushPendente = function(item) {
      var key = item.provaNome + "_" + item.categoriaId + "_" + item.sexo;
      if (!provasPendentesMap.has(key)) provasPendentesMap.set(key, item);
    };
    provasPrograma.forEach(function(provaId) {
      var prova = todasProvas.find(function(p) { return p.id === provaId; });
      if (!prova || prova.tipo === "combinada") return;
      var fasesPend = getFasesModo(provaId, configSeriacaoEvt);
      _sexos.forEach(function(sexo) {
        CATEGORIAS.forEach(function(cat) {
          var inscsNessa, resPend;
          if (prova.tipo === "revezamento") {
            // Revezamento: busca em qualquer variante M_/F_ de mesmo nome
            inscsNessa = mergeInscsRevez(prova, cat.id, sexo);
            if (inscsNessa.length === 0) return;
            resPend = mergeResRevez(prova, cat.id, sexo, fasesPend.length > 1 && fasesPend.indexOf("FIN") >= 0 ? "FIN" : "");
          } else {
            inscsNessa = inscDoEvento.filter(function(i) {
              if (i.tipo === "revezamento") return false;
              return i.provaId === prova.id
                && (i.categoriaId || i.categoriaOficialId) === cat.id
                && i.sexo === sexo;
            });
            if (inscsNessa.length === 0) return;
            if (fasesPend.length > 1) {
              resPend = fasesPend.indexOf("FIN") >= 0 ? resultados[eid + "_" + prova.id + "_" + cat.id + "_" + sexo + "__FIN"] : null;
            } else {
              resPend = resultados[eid + "_" + prova.id + "_" + cat.id + "_" + sexo];
            }
          }
          if (!resPend || Object.keys(resPend).length === 0) {
            pushPendente({
              provaId: prova.id,
              provaNome: prova.nome,
              categoriaId: cat.id,
              categoriaNome: cat.nome,
              sexo: sexo,
              label: prova.nome + " — " + cat.nome + " (" + (sexo === "M" ? "Masc" : "Fem") + ")",
            });
          }
        });
      });
    });
    // Combinadas: adicionar se faltam provas componentes (tenta múltiplos catIds — legados usam "COMB")
    provasCombinadas.forEach(function(prova) {
      var sexoProva = prova.id.startsWith("F_") ? "F" : "M";
      if (filtroSexo && sexoProva !== filtroSexo) return;
      var catIdC = prova.id.split("_")[1] || "";
      var catC = CATEGORIAS.find(function(c) { return c.id === catIdC; });
      if (!catC) return;
      var inscsDaComb = inscDoEvento.filter(function(i) {
        return (i.combinadaId === prova.id || i.provaId === prova.id);
      });
      if (inscsDaComb.length === 0) return;
      // Coleta catIds usadas nas inscrições (legados usam "COMB" em vez de "sub14")
      var catIdsInscs = [];
      inscsDaComb.forEach(function(i) {
        var c = i.categoriaId || i.categoriaOficialId;
        if (c && catIdsInscs.indexOf(c) === -1) catIdsInscs.push(c);
      });
      var catIdsTentar = [catIdC].concat(catIdsInscs.filter(function(c) { return c !== catIdC; }));
      var compsC = CombinedEventEngine.gerarProvasComponentes(prova.id, eid);
      var faltam = compsC.filter(function(pc) {
        // Prova componente está "OK" se QUALQUER catId candidato tem resultado
        return !catIdsTentar.some(function(cid) {
          var rk = eid + "_" + pc.id + "_" + cid + "_" + sexoProva;
          return resultados[rk] && Object.keys(resultados[rk]).length > 0;
        });
      });
      if (faltam.length > 0) {
        pushPendente({
          provaId: prova.id,
          provaNome: prova.nome,
          categoriaId: catIdC,
          categoriaNome: catC.nome,
          sexo: sexoProva,
          label: prova.nome + " — " + catC.nome + " (" + (sexoProva === "M" ? "Masc" : "Fem") + ") — "
            + faltam.length + " prova(s) componente(s) pendente(s)",
        });
      }
    });
    var provasPendentes = Array.from(provasPendentesMap.values());

    // Gerar classificação ordenada
    var classificacao = Object.values(equipesMap).sort(function(a, b) { return b.totalPontos - a.totalPontos; });
    classificacao.forEach(function(c, idx) { c.posicao = idx + 1; });
    return { classificacao: classificacao, totalProvasComResultado: totalProvasComResultado, totalProvas: totalProvas, totalBonusRecordes: totalBonusRecordes, totalPenalidades: totalPenalidades, provasPendentes: provasPendentes };
  },
};

export { TeamScoringEngine };
