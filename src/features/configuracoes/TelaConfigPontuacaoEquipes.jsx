import React, { useState } from "react";
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";

function getStyles(t) {
  return {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: t.textPrimary, marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: t.textPrimary, marginBottom: 20, letterSpacing: 1 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  btnPrimary: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: t.accent, border: `2px solid ${t.accentBorder}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost: { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: `1px solid ${t.border}` },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: t.bgHeaderSolid, padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` },
  td: { padding: "12px 16px", fontSize: 14, color: t.textSecondary, borderBottom: `1px solid ${t.border}` },
  tr: { transition: "background 0.15s" },
  marca: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: t.accent },
  emptyState: { textAlign: "center", padding: "60px 20px", color: t.textDisabled, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },
  painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  painelBtns: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { width: "100%", background: t.bgInput, borderWidth: 1, borderStyle: "solid", borderColor: t.borderInput, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  select: { width: "100%", background: t.bgInput, borderWidth: 1, borderStyle: "solid", borderColor: t.borderInput, borderRadius: 8, padding: "10px 14px", color: t.textSecondary, fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  erro: { background: t.bgCardAlt, border: `1px solid ${t.danger}`, color: t.danger, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn: { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", padding: 0 },
  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  badgeGold: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  catBanner: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 14, color: t.textTertiary },
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.accent, marginBottom: 16 },
  formCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32, marginBottom: 20 },
  formTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: t.textPrimary, textAlign: "center", marginBottom: 8 },
  formSub: { color: t.textDimmed, textAlign: "center", fontSize: 14, marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },
  fieldError: { color: t.danger, fontSize: 12, marginTop: 2 },
  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: t.textMuted, transition: "all 0.2s" },
  radioLabelActive: { background: t.bgHover, border: `1px solid ${t.accentBorder}`, color: t.accent },
  sumuCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  btnIconSm: { background: t.bgInput, border: `1px solid ${t.borderInput}`, color: t.textMuted, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: t.bgCardAlt, border: `1px solid ${t.danger}44`, color: t.danger, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  infoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: t.accent, marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: `1px solid ${t.border}`, fontSize: 14, color: t.textSecondary, display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: t.accent, fontWeight: 700 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: `linear-gradient(180deg, ${t.bgCardAlt} 0%, transparent 100%)`, borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: t.accent, color: t.textPrimary, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, color: t.textPrimary, lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: t.textDimmed },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: t.textMuted, flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? `${t.danger}15` : status === "hoje_pre" ? t.accentBg : status === "futuro" ? `${t.success}15` : t.bgCardAlt,
    color: status === "ao_vivo" ? t.danger : status === "hoje_pre" ? t.accent : status === "futuro" ? t.success : t.textDisabled,
    border: `1px solid ${status === "ao_vivo" ? `${t.danger}44` : status === "hoje_pre" ? t.accentBorder : status === "futuro" ? `${t.success}44` : t.border}`,
  }),
  permissividadeBox: { background: t.bgHeaderSolid, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 4 },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? t.bgHover : "transparent", color: ativo ? t.accent : t.textDisabled, border: `1px solid ${ativo ? t.accentBorder : t.border}` }),
  stepDivider: { flex: 1, height: 1, background: t.border, margin: "0 8px" },
  tagProva: { background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: t.textPrimary, fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  statusControlsCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  modoSwitch: { display: "flex", gap: 0, background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: t.textDimmed, padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: t.bgInput, color: t.accent },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: t.bgHover, borderColor: t.accentBorder, color: t.accent },
  savedBadge: { background: `${t.success}15`, border: `1px solid ${t.success}44`, color: t.success, padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: t.bgHeaderSolid, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  inputMarca: { background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 12px", color: t.accent, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
};
}

function TelaConfigPontuacaoEquipes() {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { usuarioLogado } = useAuth();
  const { eventoAtual, editarEvento, equipes, inscricoes, atletas, recordes } = useEvento();
  const { setTela } = useApp();
  if (!eventoAtual) return (
    <div style={s.page}><div style={s.emptyState}><p>Selecione uma competição.</p>
      <button style={s.btnPrimary} onClick={() => setTela("home")}>Voltar</button></div></div>
  );

  const config = eventoAtual.pontuacaoEquipes || {};
  const [ativo, setAtivo] = useState(!!config.ativo);
  const [equipeSel, setEquipeSel] = useState(config.equipesParticipantes || []);
  const [tabela, setTabela] = useState(() => {
    if (config.tabelaPontuacao) return Object.entries(config.tabelaPontuacao).map(function(e) { return { pos: Number(e[0]), pts: Number(e[1]) }; }).sort(function(a, b) { return a.pos - b.pos; });
    return [{ pos: 1, pts: 10 }, { pos: 2, pts: 8 }, { pos: 3, pts: 6 }, { pos: 4, pts: 5 }, { pos: 5, pts: 4 }, { pos: 6, pts: 3 }, { pos: 7, pts: 2 }, { pos: 8, pts: 1 }];
  });
  const [tabelaRevez, setTabelaRevez] = useState(() => {
    if (config.tabelaPontuacaoRevezamentos) return Object.entries(config.tabelaPontuacaoRevezamentos).map(function(e) { return { pos: Number(e[0]), pts: Number(e[1]) }; }).sort(function(a, b) { return a.pos - b.pos; });
    return [{ pos: 1, pts: 15 }, { pos: 2, pts: 12 }, { pos: 3, pts: 10 }, { pos: 4, pts: 8 }, { pos: 5, pts: 6 }, { pos: 6, pts: 4 }, { pos: 7, pts: 2 }, { pos: 8, pts: 1 }];
  });
  const [salvo, setSalvo] = useState(false);
  const [atletasPorEquipe, setAtletasPorEquipe] = useState(config.atletasPorEquipePorProva || 1);
  const [bonusRecordes, setBonusRecordes] = useState(config.bonusRecordes || {});
  const [penalidades, setPenalidades] = useState(config.penalidades || []);
  const [novaPen, setNovaPen] = useState({ equipeId: "", pontos: "", motivo: "atraso", obs: "" });

  // Equipes com atletas inscritos neste evento
  const eid = eventoAtual.id;
  const inscDoEvento = inscricoes.filter(function(i) { return i.eventoId === eid; });
  // Coletar equipeIds e clubes únicos dos atletas inscritos
  const _eqIdsSet = new Set();
  const _clubesSemEquipe = new Set();
  inscDoEvento.forEach(function(i) {
    var atl = atletas.find(function(a) { return a.id === i.atletaId; });
    if (!atl) return;
    if (atl.equipeId) {
      _eqIdsSet.add(atl.equipeId);
    } else if (atl.clube) {
      // Tenta achar equipe pelo nome do clube
      var eqPorClube = equipes.find(function(eq) {
        return eq.nome === atl.clube || eq.sigla === atl.clube ||
               eq.nome?.toLowerCase() === atl.clube?.toLowerCase();
      });
      if (eqPorClube) {
        _eqIdsSet.add(eqPorClube.id);
      } else {
        _clubesSemEquipe.add(atl.clube);
      }
    }
  });
  const equipeIdsComAtletas = [..._eqIdsSet];

  // Equipes cadastradas que possuem atletas inscritos
  const equipesReais = equipes.filter(function(eq) {
    return equipeIdsComAtletas.includes(eq.id);
  });

  // Clubes sem equipe cadastrada — cria entradas virtuais para seleção
  const equipesVirtuais = [..._clubesSemEquipe].map(function(clube) {
    return { id: "clube_" + clube, nome: clube, sigla: "", virtual: true };
  });

  const equipesDisponiveis = equipesReais.concat(equipesVirtuais);

  var temRevezamentos = (eventoAtual.provasPrograma || []).some(function(pId) {
    var p = todasAsProvas().find(function(pr) { return pr.id === pId; });
    return p && p.tipo === "revezamento";
  });

  var toggleEquipe = function(eqId) {
    setEquipeSel(function(prev) {
      return prev.includes(eqId) ? prev.filter(function(id) { return id !== eqId; }) : [].concat(prev, [eqId]);
    });
  };

  var addLinha = function(isRevez) {
    var setter = isRevez ? setTabelaRevez : setTabela;
    var tbl = isRevez ? tabelaRevez : tabela;
    var nextPos = tbl.length > 0 ? tbl[tbl.length - 1].pos + 1 : 1;
    setter([].concat(tbl, [{ pos: nextPos, pts: 0 }]));
  };

  var removeLinha = function(isRevez, idx) {
    var setter = isRevez ? setTabelaRevez : setTabela;
    setter(function(prev) { return prev.filter(function(_, i) { return i !== idx; }); });
  };

  var updateLinha = function(isRevez, idx, field, val) {
    var setter = isRevez ? setTabelaRevez : setTabela;
    setter(function(prev) { return prev.map(function(item, i) {
      if (i !== idx) return item;
      var novo = Object.assign({}, item);
      novo[field] = Number(val) || 0;
      return novo;
    }); });
  };

  var handleSalvar = function() {
    var tabelaObj = {};
    tabela.forEach(function(r) { if (r.pts > 0) tabelaObj[r.pos] = r.pts; });
    var tabelaRevezObj = {};
    tabelaRevez.forEach(function(r) { if (r.pts > 0) tabelaRevezObj[r.pos] = r.pts; });
    // Limpar bonus com valor 0
    var bonusLimpo = {};
    Object.keys(bonusRecordes).forEach(function(k) { if (parseInt(bonusRecordes[k]) > 0) bonusLimpo[k] = parseInt(bonusRecordes[k]); });
    editarEvento({
      ...eventoAtual,
      pontuacaoEquipes: {
        ativo: ativo,
        equipesParticipantes: equipeSel,
        tabelaPontuacao: tabelaObj,
        tabelaPontuacaoRevezamentos: temRevezamentos ? tabelaRevezObj : {},
        atletasPorEquipePorProva: Math.max(1, parseInt(atletasPorEquipe) || 1),
        bonusRecordes: bonusLimpo,
        penalidades: penalidades,
      }
    });
    setSalvo(true);
    setTimeout(function() { setSalvo(false); }, 3000);
  };

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>🏅 Pontuação por Equipes</h1>
          <div style={{ color: t.textDimmed, fontSize: 13 }}>{eventoAtual.nome}</div>
        </div>
        <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar</button>
      </div>

      <div style={s.formCard}>
        {/* Toggle ativo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, padding: "12px 16px", background: ativo ? `${t.success}15` : `${t.danger}15`, border: `1px solid ${ativo ? `${t.success}44` : `${t.danger}44`}`, borderRadius: 8 }}>
          <input type="checkbox" checked={ativo} onChange={function() { setAtivo(!ativo); }}
            style={{ width: 20, height: 20, accentColor: t.accent, cursor: "pointer" }} />
          <div>
            <div style={{ fontWeight: 700, color: ativo ? t.success : t.danger, fontSize: 15 }}>
              {ativo ? "✅ Pontuação por Equipes ATIVA" : "❌ Pontuação por Equipes DESATIVADA"}
            </div>
            <div style={{ fontSize: 12, color: t.textMuted }}>Os pontos das colocações individuais serão somados por equipe</div>
          </div>
        </div>

        {ativo && (
          <>
            {/* Seleção de equipes */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: t.accent, fontSize: 15, marginBottom: 10 }}>📋 Equipes Participantes</h3>
              <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 10 }}>Selecione as equipes que disputarão a classificação por equipes. Apenas equipes com atletas inscritos são listadas.</div>
              {equipesDisponiveis.length === 0 ? (
                <div style={{ color: t.textDimmed, padding: 16, textAlign: "center", background: t.bgCardAlt, borderRadius: 8 }}>
                  Nenhuma equipe com atletas inscritos nesta competição.
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {equipesDisponiveis.map(function(eq) {
                    var sel = equipeSel.includes(eq.id);
                    return (
                      <label key={eq.id} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                        background: sel ? `${t.success}15` : t.bgHeaderSolid, border: `1px solid ${sel ? `${t.success}44` : t.border}`,
                        borderRadius: 8, cursor: "pointer", fontSize: 13
                      }}>
                        <input type="checkbox" checked={sel} onChange={function() { toggleEquipe(eq.id); }}
                          style={{ accentColor: t.accent, cursor: "pointer" }} />
                        <span style={{ color: sel ? t.success : t.textMuted, fontWeight: sel ? 600 : 400 }}>
                          {eq.clube || eq.nome} {eq.sigla ? "(" + eq.sigla + ")" : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button style={{ ...s.btnGhost, fontSize: 11, padding: "4px 10px" }}
                  onClick={function() { setEquipeSel(equipesDisponiveis.map(function(e) { return e.id; })); }}>
                  Selecionar todas
                </button>
                <button style={{ ...s.btnGhost, fontSize: 11, padding: "4px 10px" }}
                  onClick={function() { setEquipeSel([]); }}>
                  Limpar
                </button>
              </div>
            </div>

            {/* Tabela de pontuação — provas normais */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: t.accent, fontSize: 15, marginBottom: 10 }}>🏆 Tabela de Pontuação — Provas Individuais e Combinadas</h3>
              <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 10 }}>Defina quantos pontos cada colocação recebe. Inclui provas individuais e a classificação final das combinadas (Decatlo, Heptatlo, etc.). As combinadas só pontuam quando todas as provas componentes tiverem resultado.</div>
              <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "6px 12px", color: t.textMuted, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>Colocação</th>
                    <th style={{ padding: "6px 12px", color: t.textMuted, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>Pontos</th>
                    <th style={{ padding: "6px 12px", borderBottom: `1px solid ${t.border}` }}></th>
                  </tr>
                </thead>
                <tbody>
                  {tabela.map(function(r, idx) {
                    return (
                      <tr key={idx}>
                        <td style={{ padding: "4px 12px" }}>
                          <input type="number" min="1" value={r.pos} onChange={function(e) { updateLinha(false, idx, "pos", e.target.value); }}
                            style={{ ...s.input, width: 60, textAlign: "center" }} />
                          <span style={{ color: t.textDimmed, marginLeft: 4 }}>º</span>
                        </td>
                        <td style={{ padding: "4px 12px" }}>
                          <input type="number" min="0" value={r.pts} onChange={function(e) { updateLinha(false, idx, "pts", e.target.value); }}
                            style={{ ...s.input, width: 70, textAlign: "center" }} />
                        </td>
                        <td style={{ padding: "4px 6px" }}>
                          <button onClick={function() { removeLinha(false, idx); }} style={{ background: "transparent", border: "none", color: t.danger, cursor: "pointer", fontSize: 14 }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button onClick={function() { addLinha(false); }} style={{ ...s.btnGhost, fontSize: 11, marginTop: 8, padding: "4px 12px" }}>+ Adicionar colocação</button>
            </div>

            {/* Tabela de pontuação — revezamentos */}
            {temRevezamentos && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ color: t.accent, fontSize: 15, marginBottom: 10 }}>🏅 Tabela de Pontuação — Provas de Revezamento</h3>
                <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 10 }}>Pontuação diferenciada para as provas de revezamento (4x100m, 4x400m, etc.). Aplicada a todos os revezamentos do programa.</div>
                <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "6px 12px", color: t.textMuted, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>Colocação</th>
                      <th style={{ padding: "6px 12px", color: t.textMuted, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>Pontos</th>
                      <th style={{ padding: "6px 12px", borderBottom: `1px solid ${t.border}` }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabelaRevez.map(function(r, idx) {
                      return (
                        <tr key={idx}>
                          <td style={{ padding: "4px 12px" }}>
                            <input type="number" min="1" value={r.pos} onChange={function(e) { updateLinha(true, idx, "pos", e.target.value); }}
                              style={{ ...s.input, width: 60, textAlign: "center" }} />
                            <span style={{ color: t.textDimmed, marginLeft: 4 }}>º</span>
                          </td>
                          <td style={{ padding: "4px 12px" }}>
                            <input type="number" min="0" value={r.pts} onChange={function(e) { updateLinha(true, idx, "pts", e.target.value); }}
                              style={{ ...s.input, width: 70, textAlign: "center" }} />
                          </td>
                          <td style={{ padding: "4px 6px" }}>
                            <button onClick={function() { removeLinha(true, idx); }} style={{ background: "transparent", border: "none", color: t.danger, cursor: "pointer", fontSize: 14 }}>✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button onClick={function() { addLinha(true); }} style={{ ...s.btnGhost, fontSize: 11, marginTop: 8, padding: "4px 12px" }}>+ Adicionar colocação</button>
              </div>
            )}

            {/* Atletas pontuantes por equipe por prova */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: t.accent, fontSize: 15, marginBottom: 10 }}>👥 Atletas Pontuantes por Equipe</h3>
              <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 10, lineHeight: 1.5 }}>
                Quantos atletas da mesma equipe podem pontuar em cada prova, desde que estejam dentro das colocações definidas na tabela acima.
                <br/>Exemplo: se configurar <strong style={{ color: t.textSecondary }}>2</strong> e a tabela pontua até o 8º lugar, até 2 atletas da mesma equipe que ficarem entre os 8 primeiros somarão pontos.
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input type="number" min="1" max="20" value={atletasPorEquipe}
                  onChange={function(e) { setAtletasPorEquipe(Math.max(1, parseInt(e.target.value) || 1)); }}
                  style={{ ...s.input, width: 70, textAlign: "center", fontSize: 18, fontWeight: 700 }} />
                <span style={{ color: t.textMuted, fontSize: 13 }}>atleta(s) por equipe por prova</span>
              </div>
            </div>

            {/* Bônus por Quebra de Recorde */}
            {(() => {
              const recSumulaIds = eventoAtual.recordesSumulas || [];
              const recTipos = (recordes || []).filter(rt => recSumulaIds.includes(rt.id));
              if (recTipos.length === 0) return (
                <div style={{ marginBottom: 24, padding: "14px 18px", background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 10 }}>
                  <h3 style={{ color: t.accent, fontSize: 15, marginBottom: 6 }}>🏆 Bônus por Quebra de Recorde</h3>
                  <div style={{ fontSize: 12, color: t.textDimmed, lineHeight: 1.5 }}>
                    Nenhum tipo de recorde habilitado nas súmulas desta competição.
                    <br/>Para usar esta funcionalidade, vá em <strong style={{ color: t.textMuted }}>Editar Competição → Recordes nas Súmulas</strong> e selecione pelo menos um tipo de recorde.
                  </div>
                </div>
              );
              return (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ color: t.accent, fontSize: 15, marginBottom: 6 }}>🏆 Bônus por Quebra de Recorde</h3>
                  <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
                    Defina quantos pontos bônus a equipe recebe quando um de seus atletas quebra um recorde nesta competição.
                    <br/>Cada quebra de recorde em cada prova pontua independentemente. Deixe <strong style={{ color: t.textSecondary }}>0</strong> para não bonificar.
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {recTipos.map(tipo => {
                      const val = bonusRecordes[tipo.id] || 0;
                      return (
                        <div key={tipo.id} style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                          background: val > 0 ? `${t.success}15` : t.bgHeaderSolid,
                          border: `1px solid ${val > 0 ? `${t.success}44` : t.border}`,
                          borderRadius: 8
                        }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ color: val > 0 ? t.success : t.textMuted, fontWeight: 700, fontSize: 14 }}>{tipo.nome}</span>
                            <span style={{ color: t.textDimmed, fontSize: 11, marginLeft: 8 }}>({tipo.sigla})</span>
                            <span style={{ color: t.textDisabled, fontSize: 11, marginLeft: 8 }}>· {tipo.registros?.length || 0} registros</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input type="number" min="0" value={val}
                              onChange={function(e) { setBonusRecordes(function(prev) { return { ...prev, [tipo.id]: parseInt(e.target.value) || 0 }; }); }}
                              style={{ ...s.input, width: 70, textAlign: "center", fontSize: 16, fontWeight: 700 }} />
                            <span style={{ color: t.textMuted, fontSize: 12 }}>pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ── Penalidades ── */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: t.danger, fontSize: 15, marginBottom: 6 }}>⚠ Penalidades</h3>
              <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
                Retire pontos de equipes por infrações. O valor será subtraído do total de pontos na classificação.
              </div>

              {/* Formulário para adicionar */}
              <div style={{
                display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end",
                padding: "12px 14px", background: t.bgHeaderSolid, border: `1px solid ${t.border}`,
                borderRadius: 8, marginBottom: 12,
              }}>
                <div style={{ flex: "1 1 180px" }}>
                  <label style={{ fontSize: 11, color: t.textDimmed, display: "block", marginBottom: 3 }}>Equipe</label>
                  <select style={{ ...s.input, width: "100%", marginBottom: 0 }}
                    value={novaPen.equipeId}
                    onChange={function(ev) { setNovaPen(function(p) { return { ...p, equipeId: ev.target.value }; }); }}>
                    <option value="">Selecione...</option>
                    {equipesDisponiveis.map(function(eq) {
                      return <option key={eq.id} value={eq.id}>{eq.nome}{eq.sigla ? " (" + eq.sigla + ")" : ""}</option>;
                    })}
                  </select>
                </div>
                <div style={{ flex: "0 0 80px" }}>
                  <label style={{ fontSize: 11, color: t.textDimmed, display: "block", marginBottom: 3 }}>Pontos</label>
                  <input type="number" min="1" style={{ ...s.input, width: "100%", textAlign: "center", marginBottom: 0 }}
                    value={novaPen.pontos}
                    onChange={function(ev) { setNovaPen(function(p) { return { ...p, pontos: ev.target.value }; }); }}
                    placeholder="0" />
                </div>
                <div style={{ flex: "1 1 180px" }}>
                  <label style={{ fontSize: 11, color: t.textDimmed, display: "block", marginBottom: 3 }}>Motivo</label>
                  <select style={{ ...s.input, width: "100%", marginBottom: 0 }}
                    value={novaPen.motivo}
                    onChange={function(ev) { setNovaPen(function(p) { return { ...p, motivo: ev.target.value }; }); }}>
                    <option value="atraso">Atraso de entrada em prova</option>
                    <option value="outro">Outro (campo livre)</option>
                  </select>
                </div>
                <div style={{ flex: "1 1 180px" }}>
                  <label style={{ fontSize: 11, color: t.textDimmed, display: "block", marginBottom: 3 }}>
                    {novaPen.motivo === "outro" ? "Descrição *" : "Observação (opcional)"}
                  </label>
                  <input type="text" style={{ ...s.input, width: "100%", marginBottom: 0 }}
                    value={novaPen.obs}
                    onChange={function(ev) { setNovaPen(function(p) { return { ...p, obs: ev.target.value }; }); }}
                    placeholder={novaPen.motivo === "outro" ? "Descreva o motivo..." : "Ex: 100m rasos masculino"} />
                </div>
                <button
                  style={{ ...s.btnPrimary, padding: "8px 18px", fontSize: 13, whiteSpace: "nowrap", flexShrink: 0 }}
                  disabled={!novaPen.equipeId || !novaPen.pontos || (parseInt(novaPen.pontos) || 0) <= 0 || (novaPen.motivo === "outro" && !novaPen.obs.trim())}
                  onClick={function() {
                    var pts = parseInt(novaPen.pontos) || 0;
                    if (!novaPen.equipeId || pts <= 0) return;
                    if (novaPen.motivo === "outro" && !novaPen.obs.trim()) return;
                    var nova = {
                      id: Date.now().toString(),
                      equipeId: novaPen.equipeId,
                      pontos: pts,
                      motivo: novaPen.motivo,
                      obs: novaPen.obs.trim(),
                      aplicadoPor: usuarioLogado?.nome || "—",
                      data: new Date().toISOString(),
                    };
                    setPenalidades(function(prev) { return [].concat(prev, [nova]); });
                    setNovaPen({ equipeId: "", pontos: "", motivo: "atraso", obs: "" });
                  }}>
                  + Aplicar
                </button>
              </div>

              {/* Lista de penalidades */}
              {penalidades.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {penalidades.map(function(pen) {
                    var eq = equipesDisponiveis.find(function(e) { return e.id === pen.equipeId; });
                    var motivoLabel = pen.motivo === "atraso" ? "Atraso de entrada em prova" : (pen.obs || "Outro");
                    return (
                      <div key={pen.id} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
                        background: `${t.danger}10`, border: `1px solid ${t.danger}33`,
                        borderRadius: 8, fontSize: 12,
                      }}>
                        <span style={{ color: t.danger, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>-{pen.pontos}pts</span>
                        <span style={{ color: t.textPrimary, fontWeight: 600 }}>{eq?.nome || pen.equipeId}</span>
                        <span style={{ color: t.textMuted }}>·</span>
                        <span style={{ color: t.textSecondary, flex: 1 }}>
                          {motivoLabel}
                          {pen.motivo === "atraso" && pen.obs ? ` — ${pen.obs}` : ""}
                        </span>
                        <span style={{ color: t.textDimmed, fontSize: 10 }}>por {pen.aplicadoPor}</span>
                        <button
                          style={{ background: "none", border: "none", color: t.danger, cursor: "pointer", fontSize: 14, padding: "2px 6px", flexShrink: 0 }}
                          title="Remover penalidade"
                          onClick={function() { setPenalidades(function(prev) { return prev.filter(function(p) { return p.id !== pen.id; }); }); }}>
                          ✕
                        </button>
                      </div>
                    );
                  })}
                  <div style={{ fontSize: 11, color: t.danger, fontWeight: 700, marginTop: 4 }}>
                    Total de penalidades: -{penalidades.reduce(function(acc, p) { return acc + (parseInt(p.pontos) || 0); }, 0)} pts
                  </div>
                </div>
              )}
            </div>

            {/* Salvar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button style={s.btnPrimary} onClick={handleSalvar}>💾 Salvar Configuração</button>
              {salvo && <span style={s.savedBadge}>✅ Salvo!</span>}
            </div>
          </>
        )}

        {!ativo && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={s.btnPrimary} onClick={handleSalvar}>💾 Salvar (Desativado)</button>
            {salvo && <span style={s.savedBadge}>✅ Salvo!</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN ─────────────────────────────────────────────────────────────────────

// ─── TELA: GERENCIAR EQUIPES ─────────────────────────────────────────

// ─── TELA: GERENCIAR USUÁRIOS (ADMIN) ────────────────────────────────────────

export default TelaConfigPontuacaoEquipes;
