/**
 * planEngine.js
 * Engine de regras de licenciamento — funções puras.
 * Determina status do plano, permissões de criação e métricas de uso.
 */

import { getPlanById } from "../constants/plans.js";

/**
 * Calcula o status do plano do organizador.
 * @returns {"sem_plano" | "ativo" | "expirado"}
 */
export function getStatus(org, now = new Date()) {
  if (!org?.plano) return "sem_plano";
  if (!org.planoFim) return "ativo";
  const fim = new Date(org.planoFim + "T23:59:59");
  return now <= fim ? "ativo" : "expirado";
}

/**
 * Conta competições criadas pelo org dentro do período do plano.
 */
export function getEventosNoPeriodo(eventos, orgId, planoInicio, planoFim) {
  if (!orgId || !planoInicio) return 0;
  return eventos.filter(ev => {
    if (ev.organizadorId !== orgId) return false;
    if (!ev.dataCadastro && !ev.id) return false;
    const dataCriacao = ev.dataCadastro || new Date(parseInt(ev.id)).toISOString();
    return dataCriacao >= planoInicio && (!planoFim || dataCriacao <= planoFim + "T23:59:59");
  }).length;
}

/**
 * Retorna créditos avulso disponíveis (não consumidos).
 * creditosAvulso é um array: [{ id, descricao, eventoId, consumidoEm, criadoEm, criadoPor }, ...]
 */
export function getCreditosDisponiveis(org) {
  return (org?.creditosAvulso || []).filter(c => !c.eventoId);
}

/**
 * Verifica se o org pode criar um novo evento.
 * @returns {{ allowed: boolean, reason: string, source: "plano" | "avulso" | null }}
 */
export function canCreateEvent(org, eventos = []) {
  if (org?.suspenso) return { allowed: false, reason: "Conta suspensa. Entre em contato com o administrador.", source: null };
  const enc = getEncerramento(org);
  if (enc.faseEncerramento === 2) return { allowed: false, reason: "Contrato encerrado. Dados indisponíveis. Entre em contato para reestabelecer.", source: null };
  if (enc.faseEncerramento === 3) return { allowed: false, reason: "Contrato encerrado e dados excluídos.", source: null };

  const status = getStatus(org);
  const plan = getPlanById(org?.plano);
  const creditosLivres = getCreditosDisponiveis(org).length;

  if (status === "expirado") {
    if (creditosLivres > 0) return { allowed: true, reason: "", source: "avulso" };
    return { allowed: false, reason: "Plano expirado. Renove seu plano para criar competições.", source: null };
  }

  if (status === "sem_plano") {
    if (creditosLivres > 0) return { allowed: true, reason: "", source: "avulso" };
    return { allowed: false, reason: "Nenhum plano ativo. Contrate um plano para criar competições.", source: null };
  }

  // Plano ativo — verificar limite
  if (plan && plan.maxCompeticoes !== Infinity) {
    const usados = getEventosNoPeriodo(eventos, org.id, org.planoInicio, org.planoFim);
    if (usados >= plan.maxCompeticoes) {
      if (creditosLivres > 0) return { allowed: true, reason: "", source: "avulso" };
      return {
        allowed: false,
        reason: `Limite de ${plan.maxCompeticoes} competição(ões) atingido para o plano ${plan.nome}. Contrate competições adicionais.`,
        source: null,
      };
    }
  }

  return { allowed: true, reason: "", source: "plano" };
}

/**
 * Consome o primeiro crédito avulso disponível, vinculando ao evento.
 * Retorna o array atualizado de créditos.
 */
export function consumirCredito(creditosAvulso, eventoId) {
  let consumido = false;
  return (creditosAvulso || []).map(c => {
    if (!consumido && !c.eventoId) {
      consumido = true;
      return { ...c, eventoId, consumidoEm: new Date().toISOString() };
    }
    return c;
  });
}

/**
 * Retorna métricas de uso do plano.
 */
export function getUsage(org, eventos = [], now = new Date()) {
  const plan = getPlanById(org?.plano);
  const status = getStatus(org, now);
  const eventosNoPeriodo = org?.planoInicio
    ? getEventosNoPeriodo(eventos, org?.id, org.planoInicio, org.planoFim)
    : 0;

  const planoFimDate = org?.planoFim ? new Date(org.planoFim + "T23:59:59") : null;
  const diasRestantes = planoFimDate ? Math.max(0, Math.ceil((planoFimDate - now) / (1000 * 60 * 60 * 24))) : null;

  const creditos = org?.creditosAvulso || [];
  const creditosTotal = creditos.length;
  const creditosUsados = creditos.filter(c => c.eventoId).length;
  const creditosDisponiveis = creditosTotal - creditosUsados;

  return {
    planoId: org?.plano || null,
    planoNome: plan?.nome || "Sem plano",
    status,
    eventosNoPeriodo,
    maxCompeticoes: plan?.maxCompeticoes ?? 0,
    creditosTotal,
    creditosUsados,
    creditosDisponiveis,
    creditos,
    diasRestantes,
    planoInicio: org?.planoInicio || null,
    planoFim: org?.planoFim || null,
    renovacao: plan?.renovacao ?? false,
    suspenso: org?.suspenso || false,
    ...getEncerramento(org, now),
  };
}

/**
 * Calcula a fase de encerramento do contrato.
 * @returns { encerrado, faseEncerramento, diasDesdeEncerramento, diasParaExclusao }
 */
export function getEncerramento(org, now = new Date()) {
  if (!org?.contratoEncerradoEm) return { encerrado: false, faseEncerramento: null, diasDesdeEncerramento: null, diasParaExclusao: null };
  const encerradoEm = new Date(org.contratoEncerradoEm + "T00:00:00");
  const dias = Math.floor((now - encerradoEm) / (1000 * 60 * 60 * 24));

  if (dias < 0) return { encerrado: false, faseEncerramento: null, diasDesdeEncerramento: 0, diasParaExclusao: null };
  if (dias <= 7) return { encerrado: true, faseEncerramento: 1, diasDesdeEncerramento: dias, diasParaExclusao: 30 - dias };
  if (dias <= 30) return { encerrado: true, faseEncerramento: 2, diasDesdeEncerramento: dias, diasParaExclusao: 30 - dias };
  return { encerrado: true, faseEncerramento: 3, diasDesdeEncerramento: dias, diasParaExclusao: 0 };
}
