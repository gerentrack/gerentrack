/**
 * useMigrations
 *
 * Migrações automáticas de dados legados:
 * 1. Gerar slugs para eventos sem slug
 * 2. Gerar slugs para organizadores sem slug
 * 3. Adicionar campos de plano a organizadores
 * 4. Remover campo "senha" de registros no Firestore (legado)
 *
 * Extraído de App.jsx — Etapa 2.3 da decomposição.
 */
import { useEffect, useRef } from "react";

export function useMigrations({
  eventos, _atualizarCamposEvento,
  organizadores, setOrganizadores,
  funcionarios, setFuncionarios,
  treinadores, setTreinadores,
  atletasUsuarios, setAtletasUsuarios,
  equipes, _atualizarEquipe,
  firebaseAuthed,
}) {

  // ── 1. Slugs para eventos legados ─────────────────────────────────
  const slugsMigrados = useRef(false);
  useEffect(() => {
    if (slugsMigrados.current) return;
    if (eventos.length === 0) return;
    const semSlug = eventos.filter(ev => !ev.slug);
    if (semSlug.length === 0) { slugsMigrados.current = true; return; }
    slugsMigrados.current = true;
    const gerarSlug = (nome, data) => {
      const base = (nome || "competicao")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 60);
      const ano = data ? data.slice(0, 4) : new Date().getFullYear();
      return `${base}-${ano}`;
    };
    const slugsUsados = new Set(eventos.filter(ev => ev.slug).map(ev => ev.slug));
    const atualizacoes = semSlug.map(ev => {
      let slug = gerarSlug(ev.nome, ev.data);
      if (slugsUsados.has(slug)) slug = `${slug}-${ev.id.slice(-4)}`;
      slugsUsados.add(slug);
      return { id: ev.id, slug };
    });
    atualizacoes.forEach(u => _atualizarCamposEvento(u.id, { slug: u.slug }));
    console.log(`[App] Slugs gerados para ${atualizacoes.length} evento(s) legado(s)`);
  }, [eventos.length]);

  // ── 2. Slugs para organizadores ───────────────────────────────────
  const orgsSemSlugIds = organizadores.filter(o => !o.slug).map(o => o.id).join(",");
  useEffect(() => {
    if (!orgsSemSlugIds) return;
    const semSlug = organizadores.filter(o => !o.slug);
    const slugsUsados = new Set(organizadores.filter(o => o.slug).map(o => o.slug));
    const atualizados = organizadores.map(o => {
      if (o.slug) return o;
      let base = (o.entidade || o.nome || "organizador")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 60);
      if (slugsUsados.has(base)) base = `${base}-${o.id.slice(-4)}`;
      slugsUsados.add(base);
      return { ...o, slug: base };
    });
    setOrganizadores(atualizados);
    console.log(`[App] Slugs gerados para ${semSlug.length} organizador(es)`);
  }, [orgsSemSlugIds]);

  // ── 3. Campos de plano em organizadores ───────────────────────────
  const orgsSemPlanoIds = organizadores.filter(o => o.plano === undefined).map(o => o.id).join(",");
  useEffect(() => {
    if (!orgsSemPlanoIds) return;
    const atualizados = organizadores.map(o => {
      if (o.plano !== undefined) return o;
      return { ...o, plano: null, planoInicio: null, planoFim: null, creditosAvulso: [], suspenso: false, suspensoMotivo: null, suspensoEm: null, contratoEncerradoEm: null };
    });
    setOrganizadores(atualizados);
  }, [orgsSemPlanoIds]);

  // ── 4. Remover campo "senha" de registros (legado) ────────────────
  useEffect(() => {
    if (!firebaseAuthed) return;
    const migKey = "atl_migr_senha_firestore_v1";
    if (localStorage.getItem(migKey)) return;
    const limpar = (arr, setter) => {
      if (!Array.isArray(arr) || !arr.some(u => u.senha !== undefined)) return;
      setter(arr.map(({ senha, ...resto }) => resto));
    };
    limpar(organizadores, setOrganizadores);
    limpar(funcionarios, setFuncionarios);
    limpar(treinadores, setTreinadores);
    limpar(atletasUsuarios, setAtletasUsuarios);
    equipes.forEach(eq => {
      if (eq.senha !== undefined) {
        const { senha: _s, ...eqSemSenha } = eq;
        _atualizarEquipe(eqSemSenha);
      }
    });
    localStorage.setItem(migKey, "1");
  }, [firebaseAuthed]);
}
