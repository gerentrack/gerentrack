import { useEffect } from "react";
import { canCreateEvent, consumirCredito } from "../shared/engines/planEngine";
import { _dtInscricoes } from "../features/eventos/eventoHelpers";

/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * CRUD de eventos: adicionar, editar, atualizarCampos, alterarStatus, excluir, auto-inscrições.
 */
export function useCrudEventos({
  eventos, eventosRef, _adicionarEvento, _editarEvento, _atualizarCamposEvento,
  excluirEventoPorId, excluirInscricoesPorEvento, limparNumeracaoEvento,
  inscricoes, atletas, organizadores, setOrganizadores,
  eventoAtualId, setEventoAtualId,
  confirmar, registrarAcao, adicionarNotificacao, usuarioLogado, firebaseAuthed,
}) {
  const adicionarEvento = (ev, usuarioLogadoParam) => {
    const hoje = new Date().toISOString().slice(0, 10);
    const temAberturaFutura = ev.dataAberturaInscricoes && ev.dataAberturaInscricoes > hoje;
    const orgPendente = usuarioLogadoParam?.tipo === "organizador";

    const _usr = usuarioLogadoParam || usuarioLogado;
    let _planCheck = null;
    if (_usr?.tipo !== "admin") {
      const orgId = ev.organizadorId || (_usr?.tipo === "organizador" ? _usr?.id : _usr?.organizadorId);
      const org = organizadores.find(o => o.id === orgId);
      if (org) {
        _planCheck = canCreateEvent(org, eventos);
        if (!_planCheck.allowed) return { blocked: true, reason: _planCheck.reason };
      }
    }

    const gerarSlug = (nome, id) => {
      const base = (nome || "competicao")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 60);
      const ano = new Date().getFullYear();
      const slug = `${base}-${ano}`;
      const jaExiste = eventos.some(e => e.slug === slug && e.id !== id);
      return jaExiste ? `${slug}-${id.slice(-4)}` : slug;
    };

    const id = Date.now().toString();
    const novo = {
      ...ev,
      id,
      slug: gerarSlug(ev.nome, id),
      organizadorId: orgPendente ? usuarioLogadoParam.id : (ev.organizadorId || null),
      statusAprovacao: "aprovado",
      inscricoesEncerradas: temAberturaFutura ? true : (ev.inscricoesEncerradas ?? false),
    };
    _adicionarEvento(novo);

    if (_planCheck?.source === "avulso") {
      const orgId = novo.organizadorId;
      const org = organizadores.find(o => o.id === orgId);
      if (org) {
        const novosCreditos = consumirCredito(org.creditosAvulso, novo.id);
        setOrganizadores(prev => prev.map(o => o.id === orgId ? { ...o, creditosAvulso: novosCreditos } : o));
      }
    }

    const usr = usuarioLogadoParam || usuarioLogado;
    if (usr) registrarAcao(usr.id, usr.nome, "Criou competição", ev.nome || "", orgPendente ? usr.id : null, { equipeId: usr.equipeId, modulo: "competicoes" });
    return novo;
  };

  const editarEvento = async (ev) => {
    if (!ev.slug) {
      const base = (ev.nome || "competicao")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 60);
      const ano = ev.data ? ev.data.slice(0, 4) : new Date().getFullYear();
      const slugBase = `${base}-${ano}`;
      const jaExiste = eventosRef.current.some(e => e.slug === slugBase && e.id !== ev.id);
      ev = { ...ev, slug: jaExiste ? `${slugBase}-${ev.id.slice(-4)}` : slugBase };
    }
    await _editarEvento(ev);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Editou competição", ev.nome || "", usuarioLogado.organizadorId || usuarioLogado.id, { equipeId: usuarioLogado.equipeId, modulo: "competicoes" });
  };

  const atualizarCamposEvento = async (eventoId, campos) => {
    const evt = eventosRef.current.find(e => e.id === eventoId);
    if (evt && !evt.slug && (campos.nome || evt.nome)) {
      const nomeFonte = campos.nome || evt.nome;
      const base = (nomeFonte || "competicao")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 60);
      const ano = (campos.data || evt.data || "").slice(0, 4) || new Date().getFullYear();
      const slugBase = `${base}-${ano}`;
      const jaExiste = eventosRef.current.some(e => e.slug === slugBase && e.id !== eventoId);
      campos = { ...campos, slug: jaExiste ? `${slugBase}-${eventoId.slice(-4)}` : slugBase };
    }
    await _atualizarCamposEvento(eventoId, campos);
  };

  const alterarStatusEvento = (id, campos) => {
    _atualizarCamposEvento(id, campos);
    const nomeEv = eventosRef.current.find(e => e.id === id)?.nome || "";
    const detalhe = campos.competicaoFinalizada === true
      ? `${nomeEv} — Finalizou competição`
      : campos.competicaoFinalizada === false
        ? `${nomeEv} — Desbloqueou competição`
        : campos.inscricoesEncerradas != null
          ? `${nomeEv} — ${campos.inscricoesEncerradas ? "Encerrou inscrições" : "Abriu inscrições"}`
          : campos.sumulaLiberada != null
            ? `${nomeEv} — ${campos.sumulaLiberada ? "Liberou súmulas" : "Bloqueou súmulas"}`
            : nomeEv;
    if (campos.sumulaLiberada === true) {
      const equipeIds = [...new Set(
        (inscricoes || []).filter(i => i.eventoId === id).map(i => i.equipeId).filter(Boolean)
      )];
      equipeIds.forEach(eqId => adicionarNotificacao(eqId, "sumulas_liberadas",
        `As súmulas da competição "${nomeEv}" foram liberadas. Acesse o evento para visualizar.`));
    }
    if (campos.inscricoesEncerradas === true) {
      const ev = eventosRef.current.find(e => e.id === id);
      const evOrgId = ev?.organizadorId;
      if (evOrgId) {
        const inscsEv = (inscricoes || []).filter(i => i.eventoId === id);
        const orgContagem = {};
        inscsEv.forEach(i => {
          const atl = atletas.find(a => a.id === i.atletaId);
          const oId = i.organizadorOrigem || atl?.organizadorId;
          if (oId && oId !== evOrgId) orgContagem[oId] = (orgContagem[oId] || 0) + 1;
        });
        Object.entries(orgContagem).forEach(([oId, count]) => {
          adicionarNotificacao(oId, "inscricoes_externas",
            `${count} inscrição(ões) de seus atletas na competição "${nomeEv}". Inscrições encerradas.`);
        });
      }
    }
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Alterou status competição", detalhe, usuarioLogado.organizadorId || usuarioLogado.id, { equipeId: usuarioLogado.equipeId, modulo: "competicoes" });
  };

  // Auto-gestão de inscrições por data
  useEffect(() => {
    if (!usuarioLogado || !firebaseAuthed) return;
    const agora = new Date();
    const updates = [];
    eventosRef.current.forEach(ev => {
      const dtAbEv = _dtInscricoes(ev.dataAberturaInscricoes, ev.horaAberturaInscricoes);
      const dtEncEv = _dtInscricoes(ev.dataEncerramentoInscricoes, ev.horaEncerramentoInscricoes);
      const campos = {};
      if (dtAbEv && agora >= dtAbEv && ev.inscricoesEncerradas && !ev.inscricoesForceEncerradas)
        campos.inscricoesEncerradas = false;
      const encerradoApos = "inscricoesEncerradas" in campos ? campos.inscricoesEncerradas : ev.inscricoesEncerradas;
      if (dtEncEv && agora > dtEncEv && !encerradoApos)
        campos.inscricoesEncerradas = true;
      if (dtAbEv && agora < dtAbEv && !encerradoApos && !ev.inscricoesForceAbertas)
        campos.inscricoesEncerradas = true;
      if (Object.keys(campos).length > 0) updates.push({ id: ev.id, campos });
    });
    if (updates.length > 0) {
      updates.forEach(({ id, campos }) => _atualizarCamposEvento(id, campos));
    }
  }, [eventos.length]);

  const excluirEvento = async (id) => {
    const evento = eventosRef.current.find(e => e.id === id);
    const nomeEvento = evento?.nome || "esta competição";
    const nInscs = inscricoes.filter(i => i.eventoId === id).length;
    const msg = `ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\n` +
      `Você está prestes a excluir "${nomeEvento}".\n\n` +
      `Isso também excluirá:\n` +
      `• ${nInscs} inscrição(ões)\n` +
      `• Todos os resultados desta competição\n` +
      `• Todas as súmulas\n\n` +
      `Deseja realmente continuar?`;
    if (!await confirmar(msg)) return;
    excluirEventoPorId(id);
    excluirInscricoesPorEvento(id);
    limparNumeracaoEvento(id);
    if (eventoAtualId === id) setEventoAtualId(null);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Excluiu competição", `${nomeEvento} (${nInscs} inscrições removidas)`, usuarioLogado.organizadorId || usuarioLogado.id, { equipeId: usuarioLogado.equipeId, modulo: "competicoes" });
  };

  return { adicionarEvento, editarEvento, atualizarCamposEvento, alterarStatusEvento, excluirEvento };
}
