/**
 * RecordHelper
 *
 * Utilitários para o formato de registros de recordes com detentores[].
 * Suporta formato antigo (campos planos) e novo (array detentores).
 *
 * Extraído de App.jsx (linhas 624–708) — Etapa 3 da refatoração.
 */

const RecordHelper = {
  // Retorna array de detentores (compatível com formato antigo e novo)
  getDetentores(reg) {
    if (!reg) return [];
    if (Array.isArray(reg.detentores) && reg.detentores.length > 0) return reg.detentores;
    // Formato antigo → converte
    if (reg.atleta || reg.atletaId) {
      return [{ atleta: reg.atleta || "", equipe: reg.equipe || "", atletaId: reg.atletaId || null,
        ano: reg.ano || "", local: reg.local || "",
        competicaoId: reg.competicaoId || null, competicaoNome: reg.competicaoNome || "",
        atletasRevezamento: reg.atletasRevezamento || null }];
    }
    return [];
  },

  // Retorna o primeiro detentor (para leituras simples / backward compat)
  getPrimeiro(reg) {
    const d = this.getDetentores(reg);
    return d[0] || { atleta: "", equipe: "", atletaId: null, ano: "", local: "" };
  },

  // Texto do(s) atleta(s) para exibição
  getAtletaTexto(reg) {
    const dets = this.getDetentores(reg);
    if (dets.length === 0) return "—";
    return dets.map(d => {
      if (d.atletasRevezamento && d.atletasRevezamento.filter(Boolean).length > 0) {
        return d.atletasRevezamento.filter(Boolean).join(", ");
      }
      return d.atleta || "—";
    }).join(" / ");
  },

  // Texto da(s) equipe(s) para exibição
  getEquipeTexto(reg) {
    const dets = this.getDetentores(reg);
    if (dets.length === 0) return "—";
    const eqs = [...new Set(dets.map(d => d.equipe).filter(Boolean))];
    return eqs.join(" / ") || "—";
  },

  // Texto do(s) ano(s) para exibição
  getAnoTexto(reg) {
    const dets = this.getDetentores(reg);
    if (dets.length === 0) return "—";
    const anos = [...new Set(dets.map(d => d.ano).filter(Boolean))];
    return anos.join(" / ") || "—";
  },

  // Texto do(s) local(is) para exibição
  getLocalTexto(reg) {
    const dets = this.getDetentores(reg);
    if (dets.length === 0) return "—";
    const locs = [...new Set(dets.map(d => d.local).filter(Boolean))];
    return locs.join(" / ") || "—";
  },

  // Migra um registro do formato antigo para o novo
  migrar(reg) {
    if (!reg) return reg;
    if (Array.isArray(reg.detentores)) return reg; // já migrado
    const { atleta, equipe, atletaId, ano, local, competicaoId, competicaoNome, atletasRevezamento, ...base } = reg;
    const detentor = { atleta: atleta || "", equipe: equipe || "", atletaId: atletaId || null,
      ano: ano || "", local: local || "",
      competicaoId: competicaoId || null, competicaoNome: competicaoNome || "",
      atletasRevezamento: atletasRevezamento || null };
    return { ...base, detentores: [detentor] };
  },

  // Cria um novo registro no formato detentores[]
  criar({ id, categoriaId, sexo, provaId, provaNome, marca, unidade, fonte, marcasComponentes, detentor }) {
    return {
      id: id || `r_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      categoriaId, sexo, provaId, provaNome, marca: String(marca), unidade: unidade || "s",
      fonte: fonte || "manual", marcasComponentes: marcasComponentes || null,
      detentores: [detentor],
    };
  },

  // Verifica se tem detentores de revezamento
  temRevezamento(reg) {
    const dets = this.getDetentores(reg);
    return dets.some(d => d.atletasRevezamento && d.atletasRevezamento.filter(Boolean).length > 0);
  },
};

export { RecordHelper };
