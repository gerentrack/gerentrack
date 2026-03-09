/**
 * RecordDetectionEngine
 *
 * Detecta quebras de recorde pós-competição e gera pendências
 * para homologação pelo admin.
 *
 * Extraído de App.jsx (linhas 1984–2281) — Etapa 3 da refatoração.
 */

import { todasAsProvas }      from '../../domain/provas/todasAsProvas';
import { getFasesProva }      from '../constants/fases';
import { RecordHelper }       from './recordHelper';
import { _marcaParaMs }       from '../formatters/utils.jsx';
import { _getClubeAtleta }    from '../formatters/utils.jsx';
import { _getLocalRecorde }   from '../formatters/utils.jsx';

const RecordDetectionEngine = {

  // Compara marca do atleta contra o recorde existente
  // Retorna: "superou" | "igualou" | "novo" | null
  _compararMarca(marcaAtleta, regExistente, unidade) {
    if (!regExistente) return "novo";
    const isMenor = unidade === "s";
    const nova = isMenor ? _marcaParaMs(marcaAtleta) : parseFloat(String(marcaAtleta).replace(",", "."));
    const atual = isMenor ? _marcaParaMs(regExistente.marca) : parseFloat(String(regExistente.marca).replace(",", "."));
    if (nova == null || isNaN(nova)) return null;
    if (atual == null || isNaN(atual)) return "novo";
    if (isMenor) {
      if (nova < atual) return "superou";
      if (Math.abs(nova - atual) < 0.0005) return "igualou";
    } else {
      if (nova > atual) return "superou";
      if (Math.abs(nova - atual) < 0.005) return "igualou";
    }
    return null; // pior
  },

  // Expande pool de tipos de recorde a verificar
  // Regra: se qualquer recorde na súmula tem escopo "estado" ou "pais" → busca TODOS os tipos com escopo "estado" do mesmo país
  // Especiais: só se explicitamente selecionados
  _getPool(evento, recordes) {
    const recSumulaIds = evento.recordesSumulas || [];
    const vinculados = recordes.filter(t => recSumulaIds.includes(t.id) || t.competicoesVinculadas?.includes(evento.id));
    
    const pool = new Set();
    const paisesExpandir = new Set();

    vinculados.forEach(tipo => {
      pool.add(tipo.id);
      const esc = tipo.escopo || "estado";
      // Escopo estado ou pais → expandir para todos os estados do país
      if (esc === "estado" || esc === "pais") {
        paisesExpandir.add(tipo.pais || "Brasil");
      }
      // Escopo mundial → expandir para todos estados de todos países? Não, só ele mesmo
      // Especiais (sem escopo geográfico claro) → já está no pool
    });

    // Expandir: buscar TODOS os tipos com escopo "estado" dos países identificados
    if (paisesExpandir.size > 0) {
      recordes.forEach(tipo => {
        if ((tipo.escopo || "estado") === "estado" && paisesExpandir.has(tipo.pais || "Brasil")) {
          pool.add(tipo.id);
        }
      });
    }

    return [...pool].map(id => recordes.find(t => t.id === id)).filter(Boolean);
  },

  // Função principal: detectar potenciais quebras de recorde
  // Retorna array de pendências { ...dados, _chave }
  detectarQuebras(evento, resultados, recordes, atletas, equipes, inscricoes) {
    if (!evento || !resultados || !recordes) return [];
    const eid = evento.id;
    const allProvas = todasAsProvas();
    const pool = this._getPool(evento, recordes);
    if (pool.length === 0) return [];

    const snapshot = evento.recordesSnapshot || {};
    const progHorario = evento.programaHorario || {};
    const pendencias = [];
    const chavesVistas = new Set();

    // Percorrer todas as chaves de resultado desta competição
    Object.keys(resultados).forEach(chave => {
      if (!chave.startsWith(eid + "_")) return;

      // Separar fase (__ELI, __SEM, __FIN) se presente
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

      // Só considerar FINAL: se a prova tem múltiplas fases, ignorar não-FIN
      const fasesConf = getFasesProva(provId, progHorario);
      if (fasesConf.length > 1) {
        if (faseSufixo !== "FIN") return; // Ignorar ELI, SEM
      } else {
        if (faseSufixo) return; // Se não tem fases mas veio com sufixo, dados obsoletos
      }

      const isMenorMelhor = prova.unidade === "s";
      const resByAtleta = resultados[chave] || {};

      // Para CADA atleta com marca válida
      Object.entries(resByAtleta).forEach(([aId, raw]) => {
        const status = (raw != null && typeof raw === "object") ? (raw.status || "") : "";
        if (["DNS", "DNF", "DQ", "NM"].includes(status)) return;
        const m = typeof raw === "object" ? raw.marca : raw;
        if (m == null || m === "") return;
        const marcaNum = parseFloat(String(m).replace(",", "."));
        if (isNaN(marcaNum)) return;

        const isRevez = prova.tipo === "revezamento";
        const atletaObj = isRevez ? null : atletas.find(a => a.id === aId);
        const equipeObj = isRevez ? equipes.find(e => e.id === aId) : null;
        const nomeAtl = isRevez ? (equipeObj?.clube || equipeObj?.nome || "—") : (atletaObj?.nome || "—");
        const nomeEq = isRevez ? nomeAtl : (atletaObj ? (_getClubeAtleta(atletaObj, equipes) || "—") : "—");

        let atletasRevez = null;
        if (isRevez) {
          try {
            const inscRevez = inscricoes.find(i =>
              i.tipo === "revezamento" && i.eventoId === eid && i.provaId === provId &&
              (i.categoriaOficialId || i.categoriaId) === catId && i.sexo === sexo && i.equipeId === aId
            );
            if (inscRevez?.atletasIds) atletasRevez = inscRevez.atletasIds.map(aid => atletas.find(a => a.id === aid)?.nome || "—");
          } catch (e) {}
        }

        // Comparar contra CADA tipo de recorde no pool
        pool.forEach(tipo => {
          const hasSnap = Object.keys(snapshot).length > 0;
          const regsRef = hasSnap ? (snapshot[tipo.id] || []) : (tipo.registros || []);
          const regExistente = regsRef.find(r => r.provaId === provId && r.categoriaId === catId && r.sexo === sexo);

          const resultado = this._compararMarca(marcaNum, regExistente, prova.unidade);
          if (!resultado) return; // pior ou inválido

          // Chave idempotente
          const _chave = `${eid}_${provId}_${catId}_${sexo}_${tipo.id}_${aId}`;
          if (chavesVistas.has(_chave)) return;
          chavesVistas.add(_chave);

          const detentoresAtuais = regExistente ? RecordHelper.getDetentores(regExistente) : [];

          // Determinar UF do atleta/equipe
          let atletaUf = "";
          if (isRevez && equipeObj) {
            atletaUf = equipeObj.estado || "";
          } else if (atletaObj) {
            const eqAtl = atletaObj.equipeId ? equipes.find(e => e.id === atletaObj.equipeId) : null;
            atletaUf = eqAtl?.estado || "";
          }

          // Classificar relevância da pendência
          const tipoEscopo = tipo.escopo || "estado";
          const eventoUf = evento.uf || "";
          let relevancia = "especial";
          if (tipoEscopo === "mundial") relevancia = "mundial";
          else if (tipoEscopo === "pais") relevancia = "nacional";
          else if (tipoEscopo === "estado") {
            if (tipo.estado && eventoUf && tipo.estado === eventoUf) {
              relevancia = "local";
            } else if (tipo.estado && atletaUf && tipo.estado === atletaUf) {
              relevancia = "atleta"; // RE do estado do atleta (não do evento)
            } else {
              relevancia = "outro_estado";
            }
          }

          pendencias.push({
            id: `pend_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            eventoId: eid,
            eventoNome: evento.nome || "—",
            eventoLocal: _getLocalRecorde(evento),
            eventoUf: eventoUf,
            provaId: provId,
            provaNome: prova.nome,
            categoriaId: catId,
            sexo,
            atletaId: aId,
            atletaNome: nomeAtl,
            equipeNome: nomeEq,
            marca: String(marcaNum),
            unidade: prova.unidade || "s",
            atletasRevezamento: atletasRevez,
            recordeTipoId: tipo.id,
            recordeTipoNome: tipo.nome,
            recordeTipoSigla: tipo.sigla,
            recordeEstado: tipo.estado || "",
            tipoQuebra: resultado, // "superou" | "igualou" | "novo"
            relevancia, // "local" | "atleta" | "outro_estado" | "nacional" | "mundial" | "especial"
            atletaUf: atletaUf || "",
            recordeAtual: regExistente ? { marca: regExistente.marca, detentores: detentoresAtuais } : null,
            status: "pendente",
            resolvidoPor: null,
            resolvidoEm: null,
            observacao: "",
            _chave,
          });
        });
      });
    });

    return pendencias;
  },

  // Mescla novas pendências com existentes (idempotência)
  mesclarPendencias(existentes, novas) {
    const chavesExistentes = new Set((existentes || []).map(p => p._chave));
    const realmente_novas = novas.filter(p => !chavesExistentes.has(p._chave));
    return [...(existentes || []), ...realmente_novas];
  },

  // Aplica homologação: atualiza o recorde e grava histórico
  // Retorna: { recordesAtualizados, novoHistorico }
  aplicarHomologacao(pendencia, recordes, adminId) {
    const { recordeTipoId, provaId, categoriaId, sexo, marca, atletaNome, equipeNome, atletaId,
      tipoQuebra, atletasRevezamento, eventoId, eventoNome, recordeAtual } = pendencia;

    let recordesAtualizados = recordes;
    const historicoEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      recordeTipoId,
      provaId,
      categoriaId,
      sexo,
      tipoAcao: tipoQuebra,
      detentoresAnteriores: recordeAtual?.detentores || [],
      marcaAnterior: recordeAtual?.marca || null,
      marcaNova: marca,
      eventoId,
      eventoNome,
      pendenciaId: pendencia.id,
      adminId,
      dataEfetivacao: Date.now(),
      observacao: pendencia.observacao || "",
    };

    const novoDetentor = {
      atleta: atletaNome, equipe: equipeNome, atletaId,
      ano: new Date().getFullYear().toString(),
      local: pendencia.eventoLocal || "",
      competicaoId: eventoId, competicaoNome: eventoNome,
      atletasRevezamento: atletasRevezamento || null,
    };

    recordesAtualizados = recordes.map(tipo => {
      if (tipo.id !== recordeTipoId) return tipo;
      const novosRegistros = [...tipo.registros];
      const regIdx = novosRegistros.findIndex(r => r.provaId === provaId && r.categoriaId === categoriaId && r.sexo === sexo);

      if (tipoQuebra === "superou" || tipoQuebra === "novo") {
        // Substitui todos os detentores
        const novoReg = {
          id: regIdx >= 0 ? novosRegistros[regIdx].id : `r_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          categoriaId, sexo, provaId, provaNome: pendencia.provaNome,
          marca, unidade: pendencia.unidade || "s",
          fonte: "auto", marcasComponentes: null,
          detentores: [novoDetentor],
        };
        if (regIdx >= 0) novosRegistros[regIdx] = novoReg;
        else novosRegistros.push(novoReg);
      } else if (tipoQuebra === "igualou") {
        // Adiciona co-detentor ao registro existente
        if (regIdx >= 0) {
          const existente = novosRegistros[regIdx];
          const detentoresAtuais = RecordHelper.getDetentores(existente);
          // Não duplicar se já existe
          const jaTem = detentoresAtuais.some(d => d.atletaId === atletaId && d.competicaoId === eventoId);
          if (!jaTem) {
            novosRegistros[regIdx] = { ...existente, detentores: [...detentoresAtuais, novoDetentor] };
          }
        } else {
          // Não tinha registro (edge case) → cria como novo
          novosRegistros.push({
            id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            categoriaId, sexo, provaId, provaNome: pendencia.provaNome,
            marca, unidade: pendencia.unidade || "s",
            fonte: "auto", marcasComponentes: null,
            detentores: [novoDetentor],
          });
        }
      }

      return { ...tipo, registros: novosRegistros };
    });

    // Detentores novos para o histórico
    const tipoAtualizado = recordesAtualizados.find(t => t.id === recordeTipoId);
    const regAtualizado = tipoAtualizado?.registros.find(r => r.provaId === provaId && r.categoriaId === categoriaId && r.sexo === sexo);
    historicoEntry.detentoresNovos = regAtualizado ? RecordHelper.getDetentores(regAtualizado) : [novoDetentor];

    return { recordesAtualizados, novoHistorico: historicoEntry };
  },
};

export { RecordDetectionEngine };
