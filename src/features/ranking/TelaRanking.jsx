import React, { useState, useMemo } from "react";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { CATEGORIAS } from "../../shared/constants/categorias";
import { formatarMarca } from "../../shared/formatters/utils";
import { _getCbat } from "../../shared/formatters/utils";
import { criarInscricaoStyles } from "../inscricoes/inscricaoStyles";
import { useTema } from "../../shared/TemaContext";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";

export default function TelaRanking({ ranking, setRanking, historicoRanking, setHistoricoRanking, atletas, usuarioLogado, registrarAcao, setTela }) {
  const t = useTema();
  const base = criarInscricaoStyles(t);
  const s = useStylesResponsivos({
    ...base,
    tableWrap: { overflowX: "auto", borderRadius: 12, border: `1px solid ${t.border}` },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { background: t.bgHeaderSolid, padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` },
    td: { padding: "12px 16px", fontSize: 14, color: t.textSecondary, borderBottom: `1px solid ${t.border}` },
    tr: { transition: "background 0.15s" },
  });
  const isAdmin = usuarioLogado?.tipo === "admin";

  const [aba, setAba] = useState("ranking"); // "ranking" | "pendencias" | "manual"
  const [filtroProva, setFiltroProva] = useState("todas");
  const [filtroAno, setFiltroAno] = useState("todos");
  const [filtroCat, setFiltroCat] = useState("todas");
  const [filtroSexo, setFiltroSexo] = useState("todos");
  const [pagina, setPagina] = useState(0);
  const POR_PAG = 20;

  // ── Manual insertion state ──
  const [manualForm, setManualForm] = useState({
    provaId: "", marca: "", atletaId: "", atletaNome: "", atletaCbat: "", atletaNasc: "", atletaUf: "", atletaClube: "",
    eventoNome: "", eventoData: "", eventoLocal: "", eventoUf: "", categoriaId: "", sexo: "M", vento: "",
  });

  // ── Listas para filtros ──
  const provasDisponiveis = useMemo(() => {
    const ids = new Set((ranking || []).filter(r => r.status === "homologado").map(r => r.provaId));
    return todasAsProvas().filter(p => ids.has(p.id));
  }, [ranking]);

  const anosDisponiveis = useMemo(() => {
    const anos = new Set((ranking || []).filter(r => r.status === "homologado" && r.eventoData).map(r => r.eventoData.substring(0, 4)));
    return [...anos].sort((a, b) => b - a);
  }, [ranking]);

  // ── Ranking filtrado e ordenado ──
  const rankingFiltrado = useMemo(() => {
    let lista = (ranking || []).filter(r => r.status === "homologado");

    if (filtroProva !== "todas") lista = lista.filter(r => r.provaId === filtroProva);
    if (filtroAno !== "todos") lista = lista.filter(r => r.eventoData?.startsWith(filtroAno));
    if (filtroCat !== "todas") lista = lista.filter(r => r.categoriaId === filtroCat);
    if (filtroSexo !== "todos") lista = lista.filter(r => r.sexo === filtroSexo);

    // Melhor marca por atleta (por prova)
    const melhor = {};
    lista.forEach(r => {
      const chave = `${r.atletaId}_${r.provaId}`;
      if (!melhor[chave]) { melhor[chave] = r; return; }
      const isTempo = r.unidade === "s";
      if (isTempo ? r.marcaNum < melhor[chave].marcaNum : r.marcaNum > melhor[chave].marcaNum) {
        melhor[chave] = r;
      }
    });
    lista = Object.values(melhor);

    // Ordenar
    lista.sort((a, b) => {
      if (a.provaId !== b.provaId) return a.provaNome.localeCompare(b.provaNome);
      const isTempo = a.unidade === "s";
      return isTempo ? a.marcaNum - b.marcaNum : b.marcaNum - a.marcaNum;
    });

    return lista;
  }, [ranking, filtroProva, filtroAno, filtroCat, filtroSexo]);

  const totalPags = Math.ceil(rankingFiltrado.length / POR_PAG) || 1;
  const paginaAtual = rankingFiltrado.slice(pagina * POR_PAG, (pagina + 1) * POR_PAG);

  // ── Pendências ──
  const pendentes = useMemo(() => (ranking || []).filter(r => r.status === "pendente"), [ranking]);
  const pendentesAgrupados = useMemo(() => {
    const grupos = {};
    pendentes.forEach(r => {
      const key = r.eventoId || "manual";
      if (!grupos[key]) grupos[key] = { eventoNome: r.eventoNome || "Manual", entradas: [] };
      grupos[key].entradas.push(r);
    });
    return Object.values(grupos);
  }, [pendentes]);

  // ── Ações de homologação ──
  const homologar = (entrada) => {
    setRanking(prev => prev.map(r => r.id === entrada.id ? { ...r, status: "homologado", resolvidoPor: usuarioLogado?.nome, resolvidoEm: Date.now() } : r));
    setHistoricoRanking(prev => [...prev, { tipo: "homologado", entradaId: entrada.id, atletaNome: entrada.atletaNome, provaNome: entrada.provaNome, marca: entrada.marca, adminNome: usuarioLogado?.nome, data: Date.now() }]);
    if (registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Homologou ranking", `${entrada.atletaNome} · ${entrada.provaNome} · ${entrada.marca}`, null, { modulo: "ranking" });
  };

  const rejeitar = (entrada) => {
    setRanking(prev => prev.map(r => r.id === entrada.id ? { ...r, status: "rejeitado", resolvidoPor: usuarioLogado?.nome, resolvidoEm: Date.now() } : r));
    setHistoricoRanking(prev => [...prev, { tipo: "rejeitado", entradaId: entrada.id, atletaNome: entrada.atletaNome, provaNome: entrada.provaNome, marca: entrada.marca, adminNome: usuarioLogado?.nome, data: Date.now() }]);
    if (registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Rejeitou ranking", `${entrada.atletaNome} · ${entrada.provaNome} · ${entrada.marca}`, null, { modulo: "ranking" });
  };

  const homologarTodos = (entradas) => {
    const ids = new Set(entradas.map(r => r.id));
    setRanking(prev => prev.map(r => ids.has(r.id) ? { ...r, status: "homologado", resolvidoPor: usuarioLogado?.nome, resolvidoEm: Date.now() } : r));
    setHistoricoRanking(prev => [...prev, ...entradas.map(r => ({ tipo: "homologado", entradaId: r.id, atletaNome: r.atletaNome, provaNome: r.provaNome, marca: r.marca, adminNome: usuarioLogado?.nome, data: Date.now() }))]);
    if (registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Homologou ranking (lote)", `${entradas.length} entradas`, null, { modulo: "ranking" });
  };

  // ── Inserção manual ──
  const inserirManual = () => {
    const prova = todasAsProvas().find(p => p.id === manualForm.provaId);
    if (!prova) { alert("Selecione uma prova."); return; }
    if (!manualForm.marca) { alert("Informe a marca."); return; }
    const marcaNum = parseFloat(String(manualForm.marca).replace(",", "."));
    if (isNaN(marcaNum)) { alert("Marca inválida."); return; }

    let atl = null;
    if (manualForm.atletaId) {
      atl = atletas.find(a => a.id === manualForm.atletaId);
    }
    const cbat = atl ? _getCbat(atl) : manualForm.atletaCbat || "";
    if (!cbat) { alert("Atleta sem CBAt. Informe o CBAt."); return; }

    const ventoStr = manualForm.vento?.trim() || "";
    const ventoNum = parseFloat(ventoStr.replace(",", "."));
    const provaTemVento = prova.unidade === "s" || /dist[aâ]ncia|triplo/i.test(prova.nome || "");
    const ventoAssistido = provaTemVento && !isNaN(ventoNum) && ventoNum > 2.0;

    const entrada = {
      id: "rnk_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
      eventoId: "",
      eventoNome: manualForm.eventoNome || "Inserção manual",
      eventoData: manualForm.eventoData || "",
      eventoLocal: manualForm.eventoLocal || "",
      eventoUf: manualForm.eventoUf || "",
      provaId: prova.id,
      provaNome: prova.nome,
      unidade: prova.unidade || "s",
      atletaId: atl?.id || "",
      atletaNome: atl?.nome || manualForm.atletaNome || "",
      atletaCbat: cbat,
      atletaNasc: atl?.dataNasc || atl?.anoNasc || manualForm.atletaNasc || "",
      atletaUf: atl?.uf || atl?.estado || manualForm.atletaUf || "",
      atletaClube: atl?.clube || manualForm.atletaClube || "",
      marca: String(manualForm.marca),
      marcaNum,
      categoriaId: manualForm.categoriaId || "",
      sexo: manualForm.sexo || "M",
      vento: ventoStr,
      ventoAssistido,
      status: "homologado",
      fonte: "manual",
      resolvidoPor: usuarioLogado?.nome,
      resolvidoEm: Date.now(),
      observacao: "",
      criadoEm: Date.now(),
      _chave: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };

    setRanking(prev => [...prev, entrada]);
    if (registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Inseriu ranking manual", `${entrada.atletaNome} · ${entrada.provaNome} · ${entrada.marca}`, null, { modulo: "ranking" });
    setManualForm({ provaId: "", marca: "", atletaId: "", atletaNome: "", atletaCbat: "", atletaNasc: "", atletaUf: "", atletaClube: "", eventoNome: "", eventoData: "", eventoLocal: "", eventoUf: "", categoriaId: "", sexo: "M", vento: "" });
    setBuscaAtleta("");
    alert("Entrada adicionada ao ranking.");
  };

  // ── Busca de atleta para manual ──
  const [buscaAtleta, setBuscaAtleta] = useState("");
  const atletasFiltrados = useMemo(() => {
    if (!buscaAtleta || buscaAtleta.length < 2) return [];
    const f = buscaAtleta.toLowerCase();
    return atletas.filter(a => {
      const cbat = _getCbat(a);
      return cbat && (a.nome?.toLowerCase().includes(f) || cbat.includes(buscaAtleta));
    }).slice(0, 8);
  }, [buscaAtleta, atletas]);

  // ── Abas ──
  const abas = [
    { id: "ranking", label: "Ranking", badge: null },
    ...(isAdmin ? [
      { id: "pendencias", label: "Pendências", badge: pendentes.length || null },
      { id: "manual", label: "Inserção Manual", badge: null },
    ] : []),
  ];

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>Ranking</h1>
          <p style={{ color: t.textDimmed, fontSize: 13 }}>Ranking de atletismo — somente atletas com CBAt</p>
        </div>
        <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar</button>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {abas.map(ab => (
          <button key={ab.id} onClick={() => { setAba(ab.id); setPagina(0); }}
            style={{
              padding: "8px 18px", borderRadius: 8, cursor: "pointer",
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: 1,
              background: aba === ab.id ? t.accent : "transparent",
              color: aba === ab.id ? "#fff" : t.textMuted,
              border: `1px solid ${aba === ab.id ? t.accent : t.borderInput}`,
            }}
          >
            {ab.label}
            {ab.badge ? <span style={{ marginLeft: 6, background: t.danger, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>{ab.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* ═══ ABA RANKING ═══ */}
      {aba === "ranking" && (
        <>
          {/* Filtros */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <div>
              <label style={s.label}>Prova</label>
              <select style={{ ...s.select, width: 200 }} value={filtroProva} onChange={ev => { setFiltroProva(ev.target.value); setPagina(0); }}>
                <option value="todas">Todas as provas</option>
                {provasDisponiveis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Ano</label>
              <select style={{ ...s.select, width: 100 }} value={filtroAno} onChange={ev => { setFiltroAno(ev.target.value); setPagina(0); }}>
                <option value="todos">Todos</option>
                {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Categoria</label>
              <select style={{ ...s.select, width: 130 }} value={filtroCat} onChange={ev => { setFiltroCat(ev.target.value); setPagina(0); }}>
                <option value="todas">Todas</option>
                {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Sexo</label>
              <select style={{ ...s.select, width: 100 }} value={filtroSexo} onChange={ev => { setFiltroSexo(ev.target.value); setPagina(0); }}>
                <option value="todos">Todos</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
          </div>

          {/* Tabela */}
          {rankingFiltrado.length === 0 ? (
            <div style={s.emptyState}>
              <span style={{ fontSize: 48 }}>📊</span>
              <p>Nenhuma entrada no ranking{filtroProva !== "todas" || filtroAno !== "todos" || filtroCat !== "todas" || filtroSexo !== "todos" ? " com os filtros selecionados" : ""}.</p>
            </div>
          ) : (
            <>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={{ ...s.th, width: 45 }}>POS</th>
                      <th style={{ ...s.th, width: 90 }}>MARCA</th>
                      <th style={{ ...s.th, width: 80 }}>CBAt</th>
                      <th style={s.th}>NOME</th>
                      <th style={{ ...s.th, width: 80 }}>NASC.</th>
                      <th style={{ ...s.th, width: 40 }}>UF</th>
                      <th style={s.th}>CLUBE</th>
                      <th style={s.th}>PROVA</th>
                      <th style={s.th}>LOCAL</th>
                      <th style={{ ...s.th, width: 90 }}>DATA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginaAtual.map((r, idx) => (
                      <tr key={r.id} style={{ ...s.tr, background: idx % 2 === 0 ? "transparent" : t.bgHeaderSolid }}>
                        <td style={{ ...s.td, textAlign: "center", fontWeight: 700, color: t.accent }}>{pagina * POR_PAG + idx + 1}</td>
                        <td style={{ ...s.td, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, color: t.textPrimary }}>
                          {formatarMarca(r.marcaNum, r.unidade)}
                          {r.ventoAssistido && <span style={{ fontSize: 10, color: t.warning, marginLeft: 3 }}>w</span>}
                          {r.vento && !r.ventoAssistido && <span style={{ fontSize: 9, color: t.textDisabled, marginLeft: 3 }}>({r.vento})</span>}
                        </td>
                        <td style={{ ...s.td, fontSize: 12, color: t.textMuted }}>{r.atletaCbat}</td>
                        <td style={{ ...s.td, fontWeight: 600 }}>{r.atletaNome}</td>
                        <td style={{ ...s.td, fontSize: 12, color: t.textMuted }}>{r.atletaNasc?.substring(0, 4) || "—"}</td>
                        <td style={{ ...s.td, fontSize: 12, textAlign: "center" }}>{r.atletaUf || "—"}</td>
                        <td style={{ ...s.td, fontSize: 12 }}>{r.atletaClube || "—"}</td>
                        <td style={{ ...s.td, fontSize: 12 }}>{r.provaNome}</td>
                        <td style={{ ...s.td, fontSize: 12, color: t.textMuted }}>{r.eventoLocal || "—"}</td>
                        <td style={{ ...s.td, fontSize: 12, color: t.textMuted }}>{r.eventoData ? new Date(r.eventoData + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPags > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                  <button disabled={pagina === 0} onClick={() => setPagina(p => p - 1)} style={{ ...s.btnGhost, opacity: pagina === 0 ? 0.3 : 1 }}>‹ Anterior</button>
                  <span style={{ color: t.textDimmed, fontSize: 13, padding: "8px 12px" }}>Página {pagina + 1} de {totalPags}</span>
                  <button disabled={pagina >= totalPags - 1} onClick={() => setPagina(p => p + 1)} style={{ ...s.btnGhost, opacity: pagina >= totalPags - 1 ? 0.3 : 1 }}>Próximo ›</button>
                </div>
              )}

              <div style={{ color: t.textDisabled, fontSize: 11, marginTop: 12 }}>{rankingFiltrado.length} entrada(s) · melhor marca por atleta</div>
            </>
          )}
        </>
      )}

      {/* ═══ ABA PENDÊNCIAS ═══ */}
      {aba === "pendencias" && isAdmin && (
        <>
          {pendentesAgrupados.length === 0 ? (
            <div style={s.emptyState}>
              <span style={{ fontSize: 48 }}>✅</span>
              <p>Nenhuma pendência de ranking.</p>
            </div>
          ) : (
            pendentesAgrupados.map((grupo, gi) => (
              <div key={gi} style={{ ...s.formCard, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ ...s.sectionTitle, margin: 0 }}>{grupo.eventoNome}</h3>
                  <button style={{ ...s.btnPrimary, fontSize: 12, padding: "6px 14px" }} onClick={() => homologarTodos(grupo.entradas)}>
                    ✅ Homologar Todos ({grupo.entradas.length})
                  </button>
                </div>
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>ATLETA</th>
                        <th style={s.th}>CBAt</th>
                        <th style={s.th}>PROVA</th>
                        <th style={s.th}>MARCA</th>
                        <th style={s.th}>CAT.</th>
                        <th style={{ ...s.th, width: 40 }}>SX</th>
                        <th style={{ ...s.th, width: 150 }}>AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.entradas.map((r, ri) => (
                        <tr key={r.id} style={{ ...s.tr, background: ri % 2 === 0 ? "transparent" : t.bgHeaderSolid }}>
                          <td style={{ ...s.td, fontWeight: 600 }}>{r.atletaNome}</td>
                          <td style={{ ...s.td, fontSize: 12 }}>{r.atletaCbat}</td>
                          <td style={{ ...s.td, fontSize: 12 }}>{r.provaNome}</td>
                          <td style={{ ...s.td, fontWeight: 700, color: t.accent }}>
                            {formatarMarca(r.marcaNum, r.unidade)}
                            {r.ventoAssistido && <span style={{ fontSize: 10, color: t.warning, marginLeft: 3 }}>w</span>}
                          </td>
                          <td style={{ ...s.td, fontSize: 12 }}>{CATEGORIAS.find(c => c.id === r.categoriaId)?.nome || r.categoriaId}</td>
                          <td style={{ ...s.td, fontSize: 12, textAlign: "center" }}>{r.sexo}</td>
                          <td style={s.td}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button style={{ ...s.btnIconSm, color: t.success, borderColor: t.success + "44" }} onClick={() => homologar(r)}>✅</button>
                              <button style={{ ...s.btnIconSmDanger }} onClick={() => rejeitar(r)}>❌</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ═══ ABA INSERÇÃO MANUAL ═══ */}
      {aba === "manual" && isAdmin && (
        <div style={{ ...s.formCard, maxWidth: 640 }}>
          <h3 style={{ ...s.sectionTitle, marginBottom: 16 }}>Inserção Manual</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={s.label}>Prova *</label>
              <select style={s.select} value={manualForm.provaId} onChange={ev => setManualForm(prev => ({ ...prev, provaId: ev.target.value }))}>
                <option value="">Selecione...</option>
                {todasAsProvas().filter(p => p.tipo !== "revezamento").map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Marca *</label>
              <input style={s.input} value={manualForm.marca} onChange={ev => setManualForm(prev => ({ ...prev, marca: ev.target.value }))} placeholder="Ex: 10.45 ou 7.30" />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Atleta (buscar por nome ou CBAt) *</label>
            <input style={s.input} value={buscaAtleta} onChange={ev => { setBuscaAtleta(ev.target.value); setManualForm(prev => ({ ...prev, atletaId: "" })); }} placeholder="Digite nome ou CBAt..." />
            {manualForm.atletaId && (
              <div style={{ fontSize: 12, color: t.success, marginTop: 4 }}>✓ {atletas.find(a => a.id === manualForm.atletaId)?.nome} — CBAt: {_getCbat(atletas.find(a => a.id === manualForm.atletaId))}</div>
            )}
            {!manualForm.atletaId && atletasFiltrados.length > 0 && (
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, marginTop: 4, maxHeight: 200, overflow: "auto" }}>
                {atletasFiltrados.map(a => (
                  <button key={a.id} type="button" onClick={() => { setManualForm(prev => ({ ...prev, atletaId: a.id })); setBuscaAtleta(a.nome); }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "transparent", border: "none", borderBottom: `1px solid ${t.border}`, color: t.textPrimary, cursor: "pointer", fontSize: 13 }}>
                    <strong>{a.nome}</strong> <span style={{ color: t.textMuted }}>— CBAt: {_getCbat(a)}</span>
                  </button>
                ))}
              </div>
            )}
            {!manualForm.atletaId && buscaAtleta.length >= 2 && atletasFiltrados.length === 0 && (
              <div style={{ background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: t.warning, marginBottom: 8 }}>Atleta não encontrado no sistema. Preencha manualmente:</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ ...s.label, fontSize: 10 }}>Nome *</label>
                    <input style={s.input} value={manualForm.atletaNome} onChange={ev => setManualForm(prev => ({ ...prev, atletaNome: ev.target.value }))} placeholder="Nome completo" />
                  </div>
                  <div>
                    <label style={{ ...s.label, fontSize: 10 }}>CBAt *</label>
                    <input style={s.input} value={manualForm.atletaCbat} onChange={ev => setManualForm(prev => ({ ...prev, atletaCbat: ev.target.value }))} placeholder="Nº CBAt" />
                  </div>
                  <div>
                    <label style={{ ...s.label, fontSize: 10 }}>Clube</label>
                    <input style={s.input} value={manualForm.atletaClube} onChange={ev => setManualForm(prev => ({ ...prev, atletaClube: ev.target.value }))} placeholder="Clube/Equipe" />
                  </div>
                  <div>
                    <label style={{ ...s.label, fontSize: 10 }}>UF</label>
                    <input style={s.input} value={manualForm.atletaUf} onChange={ev => setManualForm(prev => ({ ...prev, atletaUf: ev.target.value }))} placeholder="SP" maxLength={2} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={s.label}>Categoria</label>
              <select style={s.select} value={manualForm.categoriaId} onChange={ev => setManualForm(prev => ({ ...prev, categoriaId: ev.target.value }))}>
                <option value="">—</option>
                {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Sexo</label>
              <select style={s.select} value={manualForm.sexo} onChange={ev => setManualForm(prev => ({ ...prev, sexo: ev.target.value }))}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Vento</label>
              <input style={s.input} value={manualForm.vento} onChange={ev => setManualForm(prev => ({ ...prev, vento: ev.target.value }))} placeholder="+1.2" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={s.label}>Competição</label>
              <input style={s.input} value={manualForm.eventoNome} onChange={ev => setManualForm(prev => ({ ...prev, eventoNome: ev.target.value }))} placeholder="Nome da competição" />
            </div>
            <div>
              <label style={s.label}>Data</label>
              <input style={s.input} type="date" value={manualForm.eventoData} onChange={ev => setManualForm(prev => ({ ...prev, eventoData: ev.target.value }))} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={s.label}>Local</label>
              <input style={s.input} value={manualForm.eventoLocal} onChange={ev => setManualForm(prev => ({ ...prev, eventoLocal: ev.target.value }))} placeholder="Cidade - UF" />
            </div>
            <div>
              <label style={s.label}>UF</label>
              <input style={s.input} value={manualForm.eventoUf} onChange={ev => setManualForm(prev => ({ ...prev, eventoUf: ev.target.value }))} placeholder="SP" maxLength={2} />
            </div>
          </div>

          <button style={s.btnPrimary} onClick={inserirManual}>+ Inserir no Ranking</button>
        </div>
      )}
    </div>
  );
}
