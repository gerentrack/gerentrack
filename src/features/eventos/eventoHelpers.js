// ─── STATUS DO EVENTO ────────────────────────────────────────────────────────
export function getStatusEvento(ev, resultados) {
  if (!ev) return "encerrado";
  if (ev.competicaoEncerrada) return "encerrado";
  const agora = new Date();
  const dataEv = new Date(ev.data + "T12:00:00");
  const ehHoje = dataEv.toDateString() === agora.toDateString();
  const passado = dataEv < agora && !ehHoje;
  if (passado) return "encerrado";
  if (!ehHoje) return "futuro";
  if (ev.horaInicio) {
    const [h, m] = ev.horaInicio.split(":").map(Number);
    const inicioHoje = new Date(agora);
    inicioHoje.setHours(h, m, 0, 0);
    if (agora < inicioHoje) return "hoje_pre";
  }
  return "ao_vivo";
}

export function _dtInscricoes(data, hora) {
  if (!data) return null;
  return new Date(data + "T" + (hora || "00:00") + ":00");
}

export function getStatusInscricoes(ev) {
  if (!ev) return "encerradas";
  const agora = new Date();
  const dtAbertura = _dtInscricoes(ev.dataAberturaInscricoes, ev.horaAberturaInscricoes);
  if (dtAbertura && agora < dtAbertura) return "em_breve";
  const dtEncerramento = _dtInscricoes(ev.dataEncerramentoInscricoes, ev.horaEncerramentoInscricoes);
  if (dtEncerramento && agora > dtEncerramento) return "encerradas";
  if (ev.inscricoesEncerradas) return "encerradas";
  return "abertas";
}

export function labelStatusEvento(status, ev) {
  if (status === "futuro") {
    if (ev && ev.dataAberturaInscricoes) {
      const dtAb = _dtInscricoes(ev.dataAberturaInscricoes, ev.horaAberturaInscricoes);
      if (dtAb && new Date() < dtAb) return "📅 Em Breve";
    }
    if (ev && ev.dataEncerramentoInscricoes) {
      const dtEnc = _dtInscricoes(ev.dataEncerramentoInscricoes, ev.horaEncerramentoInscricoes);
      if (dtEnc && new Date() > dtEnc) return "🔒 Inscrições Encerradas";
    }
    if (ev && ev.inscricoesEncerradas) return "🔒 Inscrições Encerradas";
    return "🟢 Inscrições Abertas";
  }
  if (status === "hoje_pre") return "🟡 Hoje";
  if (status === "ao_vivo") return "🔴 Ao Vivo";
  return "⚫ Encerrado";
}
