/**
 * MarchaJuizesPanel.jsx
 * Painel colapsável para preenchimento digital da súmula de juízes de marcha atlética.
 * Renderizado dentro de TelaDigitarResultados quando prova.tipo === "marcha".
 *
 * Salva manualmente via botão "Salvar" (documento completo de uma vez).
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTema } from "../../shared/TemaContext";
import { calcMarchaTotals } from "../../hooks/useMarchaJuizes";

export default function MarchaJuizesPanel({
  eid, filtroProva, catId, filtroSexo,
  atletasNaProva, numeracaoPeito, equipes,
  getMarchaProva, salvarDocCompleto, salvarCampoAtleta, salvarJuizes, uploadAnexo, removerAnexo,
  atualizarResultadosEmLote, resultados, faseEfetiva,
}) {
  const t = useTema();
  const [aberto, setAberto] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const marchaDoc = getMarchaProva(filtroProva, catId, filtroSexo);

  // ── Estado local (edição livre, salva só no botão) ──
  const [localJuizes, setLocalJuizes] = useState(marchaDoc.juizes || Array.from({ length: 8 }, () => ({ nome: "", registro: "" })));
  const [localChefe, setLocalChefe] = useState(marchaDoc.juizChefe?.nome || "");
  const [localSecretario, setLocalSecretario] = useState(marchaDoc.secretario?.nome || "");
  const [localDados, setLocalDados] = useState(marchaDoc.dados || {});
  const [dirty, setDirty] = useState(false);

  // Sincronizar estado local quando a prova/cat/sexo mudar ou dados do Firestore chegarem
  const chaveRef = useRef(`${filtroProva}_${catId}_${filtroSexo}`);
  useEffect(() => {
    const novaChave = `${filtroProva}_${catId}_${filtroSexo}`;
    if (novaChave !== chaveRef.current || !dirty) {
      chaveRef.current = novaChave;
      const doc = getMarchaProva(filtroProva, catId, filtroSexo);
      setLocalJuizes(doc.juizes || Array.from({ length: 8 }, () => ({ nome: "", registro: "" })));
      setLocalChefe(doc.juizChefe?.nome || "");
      setLocalSecretario(doc.secretario?.nome || "");
      setLocalDados(doc.dados || {});
      setDirty(false);
      setSalvo(false);
    }
  }, [filtroProva, catId, filtroSexo, getMarchaProva, dirty]);

  // ── Helpers de edição local ──
  const editarCampoAtleta = useCallback((atletaId, campo, valor) => {
    setLocalDados(prev => {
      const ad = { ...(prev[atletaId] || {}) };
      const parts = campo.split(".");
      if (parts.length === 2) {
        const jKey = parts[0];
        const fKey = parts[1];
        ad[jKey] = { ...(ad[jKey] || {}), [fKey]: valor };
      } else {
        ad[campo] = valor;
      }
      return { ...prev, [atletaId]: ad };
    });
    setDirty(true);
    setSalvo(false);
  }, []);

  const editarJuiz = useCallback((idx, campo, valor) => {
    setLocalJuizes(prev => {
      const novos = [...prev];
      while (novos.length < 8) novos.push({ nome: "", registro: "" });
      novos[idx] = { ...novos[idx], [campo]: valor };
      return novos;
    });
    setDirty(true);
    setSalvo(false);
  }, []);

  // ── Salvar tudo ──
  const handleSalvar = useCallback(async () => {
    setSalvando(true);
    const docCompleto = {
      juizes: localJuizes,
      juizChefe: { nome: localChefe },
      secretario: { nome: localSecretario },
      dados: localDados,
    };
    await salvarDocCompleto(filtroProva, catId, filtroSexo, docCompleto);
    setDirty(false);
    setSalvo(true);
    setSalvando(false);
    setTimeout(() => setSalvo(false), 4000);
  }, [localJuizes, localChefe, localSecretario, localDados, filtroProva, catId, filtroSexo, salvarDocCompleto]);

  // ── Estilos ──
  const panelSt = { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginTop: 16, overflow: "hidden" };
  const headerSt = { padding: "12px 18px", background: t.bgHeaderSolid, borderBottom: aberto ? `1px solid ${t.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" };
  const titleSt = { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: t.accent, letterSpacing: 0.5 };
  const inputSm = { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 4, padding: "3px 4px", color: t.textPrimary, fontSize: 10, width: 38, textAlign: "center", outline: "none" };
  const inputNome = { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "5px 8px", color: t.textPrimary, fontSize: 12, outline: "none", width: "100%" };
  const lblSm = { color: t.textMuted, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 };
  const thSt = { background: t.bgHeaderSolid, padding: "3px 2px", textAlign: "center", fontSize: 9, fontWeight: 700, color: t.textDimmed, letterSpacing: 0.5, borderBottom: `1px solid ${t.border}`, borderRight: `1px solid ${t.border}`, whiteSpace: "nowrap" };
  const tdSt = { padding: "2px 1px", textAlign: "center", fontSize: 10, color: t.textSecondary, borderBottom: `1px solid ${t.border}`, borderRight: `1px solid ${t.border}` };
  const tdDorsalSt = { ...tdSt, fontWeight: 800, fontSize: 12, color: t.textPrimary, background: t.bgHeaderSolid, width: 40, position: "sticky", left: 0, zIndex: 1 };

  // ── Contagem de atletas com alertas ──
  const alertCount = atletasNaProva.filter(a => {
    const totals = calcMarchaTotals(localDados[a.id]);
    return totals.dqs >= 3;
  }).length;

  // ── Handler para aplicar DQ no resultado ──
  const handleAplicarDq = useCallback(async (atletaId) => {
    await atualizarResultadosEmLote(eid, filtroProva, catId, filtroSexo, faseEfetiva, [{
      atletaId,
      marca: "DQ",
      tentData: {},
      statusData: { status: "DQ", dqRegra: "TR 54.7 (3 cartões vermelhos)" },
    }]);
  }, [eid, filtroProva, catId, filtroSexo, faseEfetiva, atualizarResultadosEmLote]);

  // ── Handler para upload ──
  const handleUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadAnexo(filtroProva, catId, filtroSexo, file);
    } catch (err) {
      console.error("Erro upload anexo marcha:", err);
    }
    setUploading(false);
  }, [filtroProva, catId, filtroSexo, uploadAnexo]);

  if (!aberto) {
    return (
      <div style={panelSt}>
        <div style={headerSt} onClick={() => setAberto(true)}>
          <span style={titleSt}>
            Súmula de Juízes de Marcha
            {alertCount > 0 && (
              <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 700, background: `${t.danger}15`, color: t.danger }}>
                {alertCount} DQ
              </span>
            )}
            {dirty && <span style={{ marginLeft: 8, fontSize: 11, color: t.warning, fontWeight: 700 }}>● não salvo</span>}
          </span>
          <span style={{ fontSize: 12, color: t.textMuted }}>▼ Expandir</span>
        </div>
      </div>
    );
  }

  const resKey = faseEfetiva
    ? `${eid}_${filtroProva}_${catId}_${filtroSexo}__${faseEfetiva}`
    : `${eid}_${filtroProva}_${catId}_${filtroSexo}`;
  const resProva = resultados[resKey] || {};

  return (
    <div style={panelSt}>
      <div style={headerSt} onClick={() => setAberto(false)}>
        <span style={titleSt}>
          Súmula de Juízes de Marcha
          {alertCount > 0 && (
            <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 700, background: `${t.danger}15`, color: t.danger }}>
              {alertCount} DQ
            </span>
          )}
          {dirty && <span style={{ marginLeft: 8, fontSize: 11, color: t.warning, fontWeight: 700 }}>● não salvo</span>}
        </span>
        <span style={{ fontSize: 12, color: t.textMuted }}>▲ Recolher</span>
      </div>

      <div style={{ padding: "14px 16px" }}>
        {/* ═══ BOTÃO SALVAR (topo) ═══ */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button
            onClick={handleSalvar}
            disabled={salvando || !dirty}
            style={{
              background: dirty ? `linear-gradient(135deg, ${t.accent}, ${t.accentDark || t.accent})` : t.bgHeaderSolid,
              color: dirty ? "#fff" : t.textDisabled,
              border: dirty ? "none" : `1px solid ${t.border}`,
              borderRadius: 8, padding: "10px 28px", fontSize: 14, fontWeight: 700,
              cursor: dirty ? "pointer" : "default", opacity: salvando ? 0.6 : 1,
              fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5,
            }}
          >
            {salvando ? "Salvando..." : "Salvar Súmula"}
          </button>
          {salvo && <span style={{ color: t.success, fontSize: 13, fontWeight: 700 }}>✓ Salvo com sucesso!</span>}
          {dirty && !salvo && <span style={{ color: t.warning, fontSize: 12 }}>Alterações não salvas</span>}
        </div>

        {/* ═══ SEÇÃO 1: Nomes dos Juízes ═══ */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...lblSm, marginBottom: 8, fontSize: 11 }}>Juízes de Marcha</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[0,1,2,3,4,5,6,7].map(idx => (
              <div key={idx} style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 6, padding: "6px 8px" }}>
                <div style={{ fontSize: 9, color: t.textMuted, fontWeight: 700, marginBottom: 3 }}>Juiz {idx + 1}</div>
                <input style={{ ...inputNome, marginBottom: 3 }} placeholder="Nome" value={localJuizes[idx]?.nome || ""} onChange={ev => editarJuiz(idx, "nome", ev.target.value)} />
                <input style={{ ...inputNome, fontSize: 10, color: t.textTertiary }} placeholder="Registro CBAt" value={localJuizes[idx]?.registro || ""} onChange={ev => editarJuiz(idx, "registro", ev.target.value)} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 6, padding: "6px 8px" }}>
              <div style={{ fontSize: 9, color: t.textMuted, fontWeight: 700, marginBottom: 3 }}>Juiz-Chefe</div>
              <input style={inputNome} placeholder="Nome e Registro" value={localChefe} onChange={ev => { setLocalChefe(ev.target.value); setDirty(true); setSalvo(false); }} />
            </div>
            <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 6, padding: "6px 8px" }}>
              <div style={{ fontSize: 9, color: t.textMuted, fontWeight: 700, marginBottom: 3 }}>Secretário(a)</div>
              <input style={inputNome} placeholder="Nome e Registro" value={localSecretario} onChange={ev => { setLocalSecretario(ev.target.value); setDirty(true); setSalvo(false); }} />
            </div>
          </div>
        </div>

        {/* ═══ SEÇÃO 2: Tabela da Súmula ═══ */}
        <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${t.border}`, marginBottom: 16 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
            <thead>
              {/* Header: Juízes 1-8 + PIT + Not.DQ + DQ Time + CHECK OF */}
              <tr>
                <th style={{ ...thSt, width: 40, position: "sticky", left: 0, zIndex: 2, background: t.bgHeaderSolid }} rowSpan={2}>N.°<br/>Peito</th>
                {[0,1,2,3,4,5,6,7].map(idx => (
                  <th key={idx} style={{ ...thSt, borderLeft: `2px solid ${t.accent}22` }} colSpan={3}>
                    {localJuizes[idx]?.nome ? localJuizes[idx].nome.split(" ")[0] : `Juiz ${idx+1}`}
                  </th>
                ))}
                <th style={{ ...thSt, borderLeft: `2px solid ${t.accent}22` }}>PIT</th>
                <th style={thSt}>Not.DQ</th>
                <th style={thSt}>DQ<br/>Time</th>
                <th style={{ ...thSt, borderLeft: `2px solid ${t.accent}22`, color: t.accent }} colSpan={3}>CHECK OF</th>
              </tr>
              <tr>
                {[0,1,2,3,4,5,6,7].map(idx => (
                  <React.Fragment key={idx}>
                    <th style={{ ...thSt, borderLeft: `2px solid ${t.accent}22`, fontSize: 11 }}>~</th>
                    <th style={{ ...thSt, fontSize: 11 }}>&lt;</th>
                    <th style={{ ...thSt, fontSize: 8, background: t.bgCardAlt }}>DQ</th>
                  </React.Fragment>
                ))}
                <th style={{ ...thSt, borderLeft: `2px solid ${t.accent}22`, fontSize: 8 }}>Time</th>
                <th style={{ ...thSt, fontSize: 8 }}>Hora</th>
                <th style={{ ...thSt, fontSize: 8 }}>Time</th>
                <th style={{ ...thSt, borderLeft: `2px solid ${t.accent}22`, fontSize: 11, color: t.accent }}>~</th>
                <th style={{ ...thSt, fontSize: 11, color: t.accent }}>&lt;</th>
                <th style={{ ...thSt, fontSize: 8, color: t.accent }}>DQ</th>
              </tr>
            </thead>
            <tbody>
              {atletasNaProva.map((a, aIdx) => {
                const dorsal = (numeracaoPeito?.[eid] || {})[a.id] || "";
                const ad = localDados[a.id] || {};
                const totals = calcMarchaTotals(ad);
                const isDq = totals.dqs >= 3;
                const jaTemDqResult = resProva[a.id] && (typeof resProva[a.id] === "object" ? resProva[a.id].status === "DQ" : String(resProva[a.id]).toUpperCase() === "DQ");
                const bg = aIdx % 2 === 0 ? t.bgCard : t.bgHeaderSolid;
                const bgDq = isDq ? `${t.danger}08` : bg;

                return (
                  <React.Fragment key={a.id}>
                    {/* Row 1 */}
                    <tr>
                      <td rowSpan={2} style={{ ...tdDorsalSt, background: isDq ? `${t.danger}15` : t.bgHeaderSolid }}>
                        {dorsal}
                        {isDq && !jaTemDqResult && (
                          <div style={{ marginTop: 2 }}>
                            <button onClick={() => handleAplicarDq(a.id)} title="Aplicar DQ no resultado" style={{ background: t.danger, color: "#fff", border: "none", borderRadius: 3, fontSize: 7, padding: "1px 4px", cursor: "pointer", fontWeight: 700 }}>DQ</button>
                          </div>
                        )}
                        {jaTemDqResult && (
                          <div style={{ fontSize: 7, color: t.danger, fontWeight: 700, marginTop: 1 }}>DQ</div>
                        )}
                      </td>
                      {[0,1,2,3,4,5,6,7].map(jIdx => {
                        const jd = ad[`j${jIdx}`] || {};
                        return (
                          <React.Fragment key={jIdx}>
                            <td rowSpan={2} style={{ ...tdSt, background: bgDq, borderLeft: `2px solid ${t.accent}22` }}>
                              <input type="text" inputMode="numeric" style={inputSm} placeholder="—"
                                value={jd.r1t || ""} onChange={ev => editarCampoAtleta(a.id, `j${jIdx}.r1t`, ev.target.value)} />
                            </td>
                            <td rowSpan={2} style={{ ...tdSt, background: bgDq }}>
                              <input type="text" inputMode="numeric" style={inputSm} placeholder="—"
                                value={jd.r1l || ""} onChange={ev => editarCampoAtleta(a.id, `j${jIdx}.r1l`, ev.target.value)} />
                            </td>
                            <td style={{ ...tdSt, background: jd.r1dq ? `${t.danger}12` : bgDq }}>
                              <input type="text" inputMode="numeric" placeholder="—"
                                style={{ ...inputSm, width: 34, background: jd.r1dq ? `${t.danger}15` : t.bgInput, color: jd.r1dq ? t.danger : t.textPrimary, fontWeight: jd.r1dq ? 700 : 400 }}
                                value={jd.r1dq || ""} onChange={ev => editarCampoAtleta(a.id, `j${jIdx}.r1dq`, ev.target.value)} />
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td style={{ ...tdSt, background: bgDq, borderLeft: `2px solid ${t.accent}22` }}>
                        <input type="text" inputMode="numeric" style={inputSm} placeholder="—"
                          value={ad.pitTime || ""} onChange={ev => editarCampoAtleta(a.id, "pitTime", ev.target.value)} />
                      </td>
                      <td style={{ ...tdSt, background: bgDq }}>
                        <input type="text" inputMode="numeric" style={inputSm} placeholder="—"
                          value={ad.notDqHora || ""} onChange={ev => editarCampoAtleta(a.id, "notDqHora", ev.target.value)} />
                      </td>
                      <td style={{ ...tdSt, background: bgDq }}>
                        <input type="text" inputMode="numeric" style={inputSm} placeholder="—"
                          value={ad.dqTime || ""} onChange={ev => editarCampoAtleta(a.id, "dqTime", ev.target.value)} />
                      </td>
                      {/* CHECK OF totals */}
                      <td rowSpan={2} style={{ ...tdSt, borderLeft: `2px solid ${t.accent}22`, fontWeight: 800, fontSize: 12, color: t.textPrimary, background: bgDq }}>{totals.tildes || ""}</td>
                      <td rowSpan={2} style={{ ...tdSt, fontWeight: 800, fontSize: 12, color: t.textPrimary, background: bgDq }}>{totals.angles || ""}</td>
                      <td rowSpan={2} style={{ ...tdSt, fontWeight: 800, fontSize: 12, color: isDq ? t.danger : t.textPrimary, background: isDq ? `${t.danger}15` : bgDq }}>{totals.dqs || ""}</td>
                    </tr>
                    {/* Row 2 */}
                    <tr>
                      {[0,1,2,3,4,5,6,7].map(jIdx => {
                        const jd = ad[`j${jIdx}`] || {};
                        return (
                          <React.Fragment key={jIdx}>
                            {/* ~ e < já cobertos pelo rowSpan=2 da Row 1 */}
                            <td style={{ ...tdSt, background: jd.r2dq ? `${t.danger}12` : bgDq }}>
                              <select
                                value={jd.r2dq || ""}
                                onChange={ev => editarCampoAtleta(a.id, `j${jIdx}.r2dq`, ev.target.value)}
                                style={{ ...inputSm, width: 34, fontSize: 9, fontWeight: 700, padding: "1px 2px", color: jd.r2dq ? t.danger : t.textDisabled, background: jd.r2dq ? `${t.danger}15` : t.bgInput }}
                              >
                                <option value="">—</option>
                                <option value="~">~</option>
                                <option value="<">&lt;</option>
                              </select>
                            </td>
                          </React.Fragment>
                        );
                      })}
                      {/* PIT/Not.DQ/DQ Time row 2 - empty cells for second line */}
                      <td style={{ ...tdSt, background: bgDq, borderLeft: `2px solid ${t.accent}22` }}></td>
                      <td style={{ ...tdSt, background: bgDq }}></td>
                      <td style={{ ...tdSt, background: bgDq }}></td>
                    </tr>
                    {/* Alerta DQ */}
                    {isDq && !jaTemDqResult && (
                      <tr>
                        <td colSpan={30} style={{ background: `${t.danger}10`, padding: "4px 12px", fontSize: 11, color: t.danger, fontWeight: 700, borderBottom: `2px solid ${t.danger}44` }}>
                          {a.nome} — {totals.dqs} cartões vermelhos de juízes diferentes (TR 54.7)
                          <button onClick={() => handleAplicarDq(a.id)} style={{ marginLeft: 12, background: t.danger, color: "#fff", border: "none", borderRadius: 4, fontSize: 11, padding: "2px 10px", cursor: "pointer", fontWeight: 700 }}>
                            Aplicar DQ no Resultado
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ═══ BOTÃO SALVAR (inferior) ═══ */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button
            onClick={handleSalvar}
            disabled={salvando || !dirty}
            style={{
              background: dirty ? `linear-gradient(135deg, ${t.accent}, ${t.accentDark || t.accent})` : t.bgHeaderSolid,
              color: dirty ? "#fff" : t.textDisabled,
              border: dirty ? "none" : `1px solid ${t.border}`,
              borderRadius: 8, padding: "10px 28px", fontSize: 14, fontWeight: 700,
              cursor: dirty ? "pointer" : "default", opacity: salvando ? 0.6 : 1,
              fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5,
            }}
          >
            {salvando ? "Salvando..." : "Salvar Súmula"}
          </button>
          {salvo && <span style={{ color: t.success, fontSize: 13, fontWeight: 700 }}>✓ Salvo com sucesso!</span>}
          {dirty && !salvo && <span style={{ color: t.warning, fontSize: 12 }}>Alterações não salvas</span>}
        </div>

        {/* ═══ SEÇÃO 3: Upload de Anexo ═══ */}
        <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 8, padding: "12px 16px" }}>
          <div style={{ ...lblSm, marginBottom: 8, fontSize: 11 }}>Anexar Súmula Manual (foto ou PDF)</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <label style={{ background: t.accent, color: "#fff", border: "none", padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: uploading ? 0.5 : 1 }}>
              {uploading ? "Enviando..." : (marchaDoc.anexoUrl ? "Substituir" : "Anexar arquivo")}
              <input type="file" accept="image/*,application/pdf" onChange={handleUpload} style={{ display: "none" }} disabled={uploading} />
            </label>
            {marchaDoc.anexoUrl && (
              <>
                <a href={marchaDoc.anexoUrl} target="_blank" rel="noopener noreferrer" style={{ color: t.accent, fontSize: 12, fontWeight: 600 }}>
                  {marchaDoc.anexoNome || "Anexo"}
                </a>
                <button onClick={() => removerAnexo(filtroProva, catId, filtroSexo)} style={{ background: "transparent", border: `1px solid ${t.danger}44`, color: t.danger, borderRadius: 4, fontSize: 11, padding: "2px 8px", cursor: "pointer" }}>
                  Remover
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
