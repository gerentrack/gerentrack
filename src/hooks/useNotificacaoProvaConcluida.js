import { useRef, useEffect } from "react";
import { getCategoria, CATEGORIAS } from "../shared/constants/categorias";
import { resKey, getFasesModo } from "../shared/constants/fases";
import { todasAsProvas } from "../domain/provas/todasAsProvas";

/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * Notifica secretaria/organizador quando uma prova é concluída (todos resultados digitados).
 */
export function useNotificacaoProvaConcluida({
  eventoAtual, resultados, inscricoes, atletas,
  organizadores, funcionarios, adicionarNotificacao,
}) {
  const provasNotificadasRef = useRef(new Set());

  useEffect(() => {
    if (!eventoAtual || !inscricoes || !atletas || !resultados) return;
    const eid = eventoAtual.id;
    const STATUS_FINAL = ["DNS", "DNF", "DQ", "NM"];
    const inscsEvt = inscricoes.filter(i => i.eventoId === eid && i.tipo !== "revezamento" && !i.combinadaId);
    const grupos = {};
    inscsEvt.forEach(i => {
      const atl = atletas.find(a => a.id === i.atletaId);
      if (!atl) return;
      const cat = getCategoria(atl.anoNasc, eventoAtual.data ? new Date(eventoAtual.data + "T12:00:00").getFullYear() : new Date().getFullYear());
      if (!cat) return;
      const key = `${i.provaId}_${cat.id}_${i.sexo || atl.sexo}`;
      if (!grupos[key]) grupos[key] = { provaId: i.provaId, catId: cat.id, sexo: i.sexo || atl.sexo, atletaIds: new Set() };
      grupos[key].atletaIds.add(i.atletaId);
    });
    Object.entries(grupos).forEach(([key, { provaId, catId, sexo, atletaIds }]) => {
      if (provasNotificadasRef.current.has(`${eid}_${key}`)) return;
      const fases = getFasesModo(provaId, eventoAtual.configSeriacao || {});
      const fasesCheck = fases.length > 1 ? fases : [null];
      const faseFinal = fasesCheck[fasesCheck.length - 1];
      const rKey = resKey(eid, provaId, catId, sexo, faseFinal);
      const res = resultados[rKey];
      if (!res) return;
      const completa = [...atletaIds].every(aId => {
        const r = res[aId];
        if (!r) return false;
        const marca = typeof r === "object" ? r.marca : r;
        const status = typeof r === "object" ? (r.status || "") : "";
        if (STATUS_FINAL.includes(String(status).toUpperCase())) return true;
        if (marca == null || marca === "") return false;
        const num = parseFloat(String(marca).replace(",", "."));
        return !isNaN(num) && num > 0;
      });
      if (!completa) return;
      provasNotificadasRef.current.add(`${eid}_${key}`);
      const todasP = todasAsProvas();
      const provaInfo = todasP.find(p => p.id === provaId);
      const provaNome = provaInfo?.nome || provaId;
      const catInfo = CATEGORIAS.find(c => c.id === catId);
      const catNome = catInfo?.nome || catId;
      const msg = `Prova concluída: ${provaNome} — ${catNome} ${sexo === "M" ? "Masc" : "Fem"} — ${eventoAtual.nome}. Medalhas disponíveis para entrega.`;
      const orgEvento = (organizadores || []).find(o => o.id === eventoAtual.organizadorId);
      if (orgEvento) adicionarNotificacao(orgEvento.id, "medals_ready", msg);
      (funcionarios || []).forEach(f => {
        if (!(f.permissoes || []).includes("camara_chamada")) return;
        if (f.organizadorId === eventoAtual.organizadorId || !f.organizadorId)
          adicionarNotificacao(f.id, "medals_ready", msg);
      });
    });
  }, [resultados, eventoAtual, inscricoes, atletas, organizadores, funcionarios]);
}
