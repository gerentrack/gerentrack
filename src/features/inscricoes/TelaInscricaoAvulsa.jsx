import React, { useState, useEffect, useRef } from "react";
import { todasAsProvas, nPernasRevezamento, isRevezamentoMisto } from "../../shared/athletics/provasDef";
import { CATEGORIAS, getCategoria, getPermissividade, podeCategoriaSuperior } from "../../shared/constants/categorias";
import { _getClubeAtleta, _getLocalEventoDisplay, validarCPF } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import { ProvaSelector } from "../ui/ProvaSelector";
import { CombinedEventEngine } from "../../shared/engines/combinedEventEngine";
import { getLimiteCat, validarLimiteProvas, calcularPrecoInscricao, formatarPreco } from "../../shared/engines/inscricaoEngine";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";

// Verifica em tempo real se as inscrições estão encerradas,
// levando em conta data+hora de encerramento além do flag salvo.
function isInscricaoEncerradaAgora(ev) {
  if (!ev) return true;
  if (ev.competicaoFinalizada || ev.competicaoEncerrada) return true;
  // Flag manual sobrepõe tudo (exceto se force-aberta)
  if (ev.inscricoesEncerradas && !ev.inscricoesForceAbertas) return true;
  // Checa data+hora de encerramento em tempo real
  if (ev.dataEncerramentoInscricoes) {
    try {
      const dtEnc = new Date(ev.dataEncerramentoInscricoes + "T" + (ev.horaEncerramentoInscricoes || "23:59") + ":00");
      if (new Date() > dtEnc) return true;
    } catch { /* ignora datas inválidas */ }
  }
  // Checa data+hora de abertura em tempo real
  if (ev.dataAberturaInscricoes) {
    try {
      const dtAb = new Date(ev.dataAberturaInscricoes + "T" + (ev.horaAberturaInscricoes || "00:00") + ":00");
      if (new Date() < dtAb) return true;
    } catch { /* ignora datas inválidas */ }
  }
  return false;
}

const styles = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 20, letterSpacing: 1 },
  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  btnPrimary: { background: "linear-gradient(135deg, #1976D2, #1565C0)", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: "#1976D2", border: "2px solid #1976D2", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost: { background: "transparent", color: "#888", border: "1px solid #2a2d3a", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: "1px solid #1E2130" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#0D0E12", padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1E2130" },
  td: { padding: "12px 16px", fontSize: 14, color: "#bbb", borderBottom: "1px solid #12141a" },
  tr: { transition: "background 0.15s" },
  marca: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: "#1976D2" },
  emptyState: { textAlign: "center", padding: "60px 20px", color: "#444", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },
  painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  painelBtns: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { width: "100%", background: "#141720", borderWidth: 1, borderStyle: "solid", borderColor: "#252837", borderRadius: 8, padding: "10px 14px", color: "#E0E0E0", fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  select: { width: "100%", background: "#141720", borderWidth: 1, borderStyle: "solid", borderColor: "#252837", borderRadius: 8, padding: "10px 14px", color: "#E0E0E0", fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  erro: { background: "#2a1010", border: "1px solid #ff4444", color: "#ff6b6b", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn: { background: "none", border: "none", color: "#1976D2", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", padding: 0 },
  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  badgeGold: { background: "#1976D222", color: "#1976D2", border: "1px solid #1976D244", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  catBanner: { background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 14, color: "#aaa" },
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#1976D2", marginBottom: 16 },
  formCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 16, padding: 32, marginBottom: 20 },
  formTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 8 },
  formSub: { color: "#666", textAlign: "center", fontSize: 14, marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },
  fieldError: { color: "#ff6b6b", fontSize: 12, marginTop: 2 },
  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: "#888", transition: "all 0.2s" },
  radioLabelActive: { background: "#1c1f2e", border: "1px solid #1976D2", color: "#1976D2" },
  sumuCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },
  btnIconSm: { background: "#141720", border: "1px solid #252837", color: "#888", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: "#1a0a0a", border: "1px solid #3a1a1a", color: "#ff6b6b", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  infoCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: "#1976D2", marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: "1px solid #151820", fontSize: 14, color: "#bbb", display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: "#1976D2", fontWeight: 700 },
  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: "linear-gradient(180deg, #0D1018 0%, transparent 100%)", borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: "#1976D2", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },
  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: "#666" },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: "#888", flexWrap: "wrap", borderTop: "1px solid #141820", paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? "#3a0a0a" : status === "hoje_pre" ? "#2a2a0a" : status === "futuro" ? "#0a2a0a" : "#1a1a1a",
    color: status === "ao_vivo" ? "#ff6b6b" : status === "hoje_pre" ? "#1976D2" : status === "futuro" ? "#7acc44" : "#555",
    border: `1px solid ${status === "ao_vivo" ? "#6a2a2a" : status === "hoje_pre" ? "#4a4a0a" : status === "futuro" ? "#2a5a2a" : "#333"}`,
  }),
  permissividadeBox: { background: "#0d1117", border: "1px solid #1976D233", borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 4 },
  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? "#1a1c22" : "transparent", color: ativo ? "#1976D2" : "#444", border: `1px solid ${ativo ? "#1976D244" : "#1E2130"}` }),
  stepDivider: { flex: 1, height: 1, background: "#1E2130", margin: "0 8px" },
  tagProva: { background: "#1976D222", color: "#1976D2", border: "1px solid #1976D244", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: "#fff", fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },
  statusControlsCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 24px", marginBottom: 28 },
  statusBar: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, padding: "12px 18px", marginBottom: 24 },
  modoSwitch: { display: "flex", gap: 0, background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: "#666", padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: "#141720", color: "#1976D2" },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: "#0E1016", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
  savedBadge: { background: "#0a2a0a", border: "1px solid #2a6a2a", color: "#4aaa4a", padding: "8px 16px", borderRadius: 8, fontSize: 13 },
  digitarSection: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  inputMarca: { background: "#141720", border: "1px solid #252837", borderRadius: 6, padding: "8px 12px", color: "#1976D2", fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
};

function TelaInscricaoAvulsa({ adicionarInscricao, adicionarAtleta, atletas, equipes, inscricoes, usuarioLogado, setTela, eventoAtual, eventoAtualId, eventos, selecionarEvento, adicionarAtletaUsuario, atualizarAtletaUsuario, login, loginComSelecao, atletasUsuarios=[], organizadores=[] }) {
    const s = useStylesResponsivos(styles);
    const [modo, setModo] = useState("existente");
  const [atletaId, setAtletaId] = useState("");
  const [buscaAtleta, setBuscaAtleta] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [provasSel, setProvasSel] = useState([]);
  const [novoAtleta, setNovoAtleta] = useState({ nome: "", dataNasc: "", anoNasc: "", sexo: "M", cbat: "", clube: "", equipeId: "", cpf: "", email: "" });
  const [cpfNovoStatus, setCpfNovoStatus] = useState(null); // null | "invalido" | "existente" | "ok"
  const [atletaCpfExistente, setAtletaCpfExistente] = useState(null);
  const [ok, setOk] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const buscaRef = useRef(null);
  const [eventoSelecionadoAtleta, setEventoSelecionadoAtleta] = useState(null);

  const isAtleta = usuarioLogado?.tipo === "atleta";
  const [modalNovoOrg, setModalNovoOrg] = useState(null); // { eventoId, orgId, orgNome } aguardando confirmação

  // ── Verificar CPF do novo atleta ──
  const verificarCpfNovo = (cpf) => {
    const limpo = cpf.replace(/\D/g, "");
    if (limpo.length < 11) { setCpfNovoStatus(null); setAtletaCpfExistente(null); return; }
    if (!validarCPF(limpo)) { setCpfNovoStatus("invalido"); setAtletaCpfExistente(null); return; }
    // Buscar em atletas existentes
    const existente = atletas.find(a => a.cpf && a.cpf.replace(/\D/g, "") === limpo);
    if (existente) {
      setCpfNovoStatus("existente");
      setAtletaCpfExistente(existente);
    } else {
      setCpfNovoStatus("ok");
      setAtletaCpfExistente(null);
    }
  };
  // Para atletas, usar evento escolhido no fluxo (não o eventoAtual global)
  const eventoParaInscricao = isAtleta ? (eventos || []).find(ev => ev.id === eventoSelecionadoAtleta) : eventoAtual;

  // Auto-selecionar o próprio atleta quando logado como atleta
  const meuAtletaInsc = isAtleta ? atletas.find(a => {
    if (a.atletaUsuarioId && a.atletaUsuarioId === usuarioLogado.id) return true;
    if (a.cpf && usuarioLogado.cpf) return a.cpf.replace(/\D/g,"") === usuarioLogado.cpf.replace(/\D/g,"");
    return false;
  }) : null;

  useEffect(() => {
    if (isAtleta && meuAtletaInsc && !atletaId) {
      setAtletaId(meuAtletaInsc.id);
    }
  }, [isAtleta, meuAtletaInsc]);

  // Competições com inscrições abertas
  // Eventos do próprio org do atleta + competições cruzadas autorizadas
  const atletaOrgId = isAtleta
    ? (usuarioLogado?.organizadorId || atletas.find(a => {
        if (a.atletaUsuarioId === usuarioLogado?.id) return true;
        if (a.cpf && usuarioLogado?.cpf) return a.cpf.replace(/\D/g,"") === usuarioLogado.cpf.replace(/\D/g,"");
        return false;
      })?.organizadorId || null)
    : null;

  const eventosAbertos = (eventos || []).filter(ev => {
    if (isInscricaoEncerradaAgora(ev)) return false;
    if (ev.statusAprovacao !== "aprovado" && ev.statusAprovacao) return false;
    if (!isAtleta) return true;
    // Atleta: só vê evento do próprio org OU onde org foi autorizado
    if (!atletaOrgId) return ev.organizadorId === null || !ev.organizadorId; // sem org: só vê eventos sem org
    if (ev.organizadorId === atletaOrgId) return true;
    return Array.isArray(ev.orgsAutorizadas) && ev.orgsAutorizadas.includes(atletaOrgId);
  });

  // Pré-selecionar evento cruzado vindo do TelaPainelOrganizador via eventoAtualId
  useEffect(() => {
    if (eventoAtualId && isAtleta && !eventoSelecionadoAtleta) {
      setEventoSelecionadoAtleta(eventoAtualId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAtleta]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (buscaRef.current && !buscaRef.current.contains(e.target)) {
        setMostrarLista(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!eventoParaInscricao && !isAtleta) return (
    <div style={s.page}>
      <div style={s.emptyState}>
        <span style={{ fontSize: 48 }}>🏟</span>
        <p>Selecione uma competição antes de inscrever atletas.</p>
        <button style={s.btnPrimary} onClick={() => setTela("home")}>Ver Competições</button>
      </div>
    </div>
  );

  // Atleta: sempre mostrar lista de competições primeiro (antes de escolher evento)
  if (isAtleta && !eventoSelecionadoAtleta) {
    if (eventosAbertos.length === 0) return (
      <div style={s.page}>
        <div style={s.emptyState}>
          <span style={{ fontSize: 48 }}>📭</span>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: 18 }}>Nenhuma competição com inscrições abertas</p>
          <p style={{ color: "#666", fontSize: 14 }}>Aguarde a abertura de inscrições de uma competição.</p>
          <button style={s.btnGhost} onClick={() => setTela("painel-atleta")}>← Meu Painel</button>
        </div>
      </div>
    );
    return (
      <div style={s.page}>
        <div style={s.painelHeader}>
          <h1 style={s.pageTitle}>✍️ Me Inscrever</h1>
          <button style={s.btnGhost} onClick={() => setTela("painel-atleta")}>← Meu Painel</button>
        </div>
        <p style={{ color: "#aaa", marginBottom: 16 }}>Selecione a competição em que deseja se inscrever:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 700 }}>
          {eventosAbertos.map(ev => {
            const dataEv = ev.data ? new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" }) : "";
            const nProvas = ev.provas ? ev.provas.length : 0;
            return (
              <div key={ev.id}
                onClick={() => {
                  const eCruzado = atletaOrgId && ev.organizadorId && ev.organizadorId !== atletaOrgId &&
                    Array.isArray(ev.orgsAutorizadas) && ev.orgsAutorizadas.includes(atletaOrgId);
                  if (eCruzado) {
                    // Participação cruzada autorizada → vai direto
                    setEventoSelecionadoAtleta(ev.id); setProvasSel([]);
                  } else if (isAtleta && usuarioLogado?.organizadorId && ev.organizadorId && ev.organizadorId !== usuarioLogado.organizadorId) {
                    const org = organizadores.find(o => o.id === ev.organizadorId);
                    setModalNovoOrg({ eventoId: ev.id, orgId: ev.organizadorId, orgNome: org?.entidade || org?.nome || "outro organizador" });
                  } else {
                    if (isAtleta && !usuarioLogado?.organizadorId && ev.organizadorId) {
                      atualizarAtletaUsuario && atualizarAtletaUsuario({ ...usuarioLogado, organizadorId: ev.organizadorId });
                    }
                    setEventoSelecionadoAtleta(ev.id); setProvasSel([]);
                  }
                }}
                style={{
                  background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10,
                  padding: "16px 20px", cursor: "pointer", transition: "border-color 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#1976D2"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E2130"; }}
              >
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 16, marginBottom: 4 }}>🏟 {ev.nome}</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#888" }}>
                  {dataEv && <span>📅 {dataEv}</span>}
                  {(ev.local || ev.cidade) && <span>📍 {_getLocalEventoDisplay(ev)}</span>}
                  {nProvas > 0 && <span>🏃 {nProvas} provas no programa</span>}
                </div>
                {atletaOrgId && ev.organizadorId && ev.organizadorId !== atletaOrgId && (() => {
                  const orgEv = (organizadores||[]).find(o => o.id === ev.organizadorId);
                  return (
                    <div style={{ marginTop:6, fontSize:11, color:"#5599ff" }}>
                      🤝 Participação cruzada · {orgEv?.entidade || orgEv?.nome || "outro organizador"}
                    </div>
                  );
                })()}
                <div style={{ marginTop: 8 }}>
                  <span style={{ background: "#0a2a0a", color: "#7acc44", border: "1px solid #1a3a1a", borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                    Inscrições Abertas
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Modal: criar perfil em novo organizador ──────────────────────────────
  if (modalNovoOrg) {
    const handleCriarNovoPerfilOrg = () => {
      // Cria novo registro atletaUsuario vinculado ao novo organizador
      const novoId = Date.now().toString();
      const novoPerfil = {
        ...usuarioLogado,
        id: novoId,
        organizadorId: modalNovoOrg.orgId,
        dataCadastro: new Date().toISOString(),
        criadoPorMultiOrg: true,
      };
      adicionarAtletaUsuario && adicionarAtletaUsuario(novoPerfil);
      // Faz login com o novo perfil e prossegue para a inscrição
      loginComSelecao && loginComSelecao({ ...novoPerfil, _organizadorNome: modalNovoOrg.orgNome }, []);
      setModalNovoOrg(null);
      setEventoSelecionadoAtleta(modalNovoOrg.eventoId);
      setProvasSel([]);
    };
    return (
      <div style={{ ...s.formPage }}>
        <div style={{ ...s.formCard, maxWidth: 480 }}>
          <div style={{ fontSize: 52, textAlign: "center", marginBottom: 12 }}>🏟️</div>
          <h2 style={{ ...s.formTitle, textAlign: "center" }}>Competição de outro organizador</h2>
          <p style={{ color: "#aaa", fontSize: 14, textAlign: "center", lineHeight: 1.6, margin: "12px 0 20px" }}>
            Esta competição pertence a <strong style={{ color: "#fff" }}>{modalNovoOrg.orgNome}</strong>.<br/>
            Para se inscrever, será criado um perfil seu neste organizador.<br/>
            Você poderá alternar entre perfis na hora do login.
          </p>
          <button style={{ ...s.btnPrimary, width: "100%", marginBottom: 12 }} onClick={handleCriarNovoPerfilOrg}>
            ✅ Criar perfil e continuar
          </button>
          <button style={{ ...s.btnGhost, width: "100%" }} onClick={() => setModalNovoOrg(null)}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // Guard: se evento selecionado não existe mais
  if (!eventoParaInscricao) return null;

  if (!usuarioLogado) return (
    <div style={s.page}>
      <div style={s.emptyState}>
        <span style={{ fontSize: 48 }}>🔐</span>
        <p style={{ fontWeight: 700, color: "#fff", fontSize: 18 }}>Login Necessário</p>
        <p style={{ color: "#666", fontSize: 14 }}>Faça login para inscrever atletas nesta competição.</p>
        <button style={s.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar</button>
      </div>
    </div>
  );

  const tipoInsc   = usuarioLogado?.tipo;
  const isPrivileg = tipoInsc === "admin" || tipoInsc === "organizador" || tipoInsc === "funcionario";
  if (!isPrivileg && isInscricaoEncerradaAgora(eventoParaInscricao)) return (
    <div style={s.page}>
      <div style={s.emptyState}>
        <span style={{ fontSize: 48 }}>🔒</span>
        <p style={{ fontWeight: 700, color: "#fff", fontSize: 18 }}>Inscrições Encerradas</p>
        <p style={{ color: "#666", fontSize: 14 }}>
          As inscrições para <strong>{eventoParaInscricao.nome}</strong> estão encerradas.
        </p>
        <button style={s.btnGhost} onClick={() => isAtleta ? setEventoSelecionadoAtleta(null) : setTela("evento-detalhe")}>← Voltar</button>
      </div>
    </div>
  );

  if (!isPrivileg && usuarioLogado?.lgpdConsentimentoRevogado) return (
    <div style={s.page}>
      <div style={s.emptyState}>
        <span style={{ fontSize: 48 }}>🔓</span>
        <p style={{ fontWeight: 700, color: "#ff6b6b", fontSize: 18 }}>Consentimento Revogado</p>
        <p style={{ color: "#888", fontSize: 14, maxWidth: 420, textAlign: "center", lineHeight: 1.6 }}>
          Você revogou seu consentimento LGPD. Novas inscrições não são permitidas.<br/>
          Para voltar a se inscrever em competições, realize um novo cadastro.
        </p>
        <button style={s.btnGhost} onClick={() => setTela("home")}>← Voltar ao Início</button>
      </div>
    </div>
  );

  // ── Etapa 5: atletas de organizadores autorizados para participação cruzada ──
  const orgsAutorizadas = eventoParaInscricao?.orgsAutorizadas || [];
  const atletasCruzados = orgsAutorizadas.length > 0
    ? atletas.filter(a => a.organizadorId && orgsAutorizadas.includes(a.organizadorId))
    : [];
  const atletasCruzadosIds = new Set(atletasCruzados.map(a => a.id));

  const atletasFiltrados =
    usuarioLogado?.tipo === "equipe"
      ? atletas.filter((a) => a.equipeId === usuarioLogado.id)
      : usuarioLogado?.tipo === "treinador"
      ? atletas.filter((a) => a.equipeId === usuarioLogado.equipeId)
      : usuarioLogado?.tipo === "atleta"
      ? atletas.filter((a) => {
          if (a.atletaUsuarioId && a.atletaUsuarioId === usuarioLogado.id) return true;
          if (a.cpf && usuarioLogado.cpf)
            return a.cpf.replace(/\D/g,"") === usuarioLogado.cpf.replace(/\D/g,"");
          return false;
        })
      : (() => {
          // admin, organizador, funcionário: seus atletas + cruzados autorizados
          const orgId = eventoParaInscricao?.organizadorId;
          const meuOrgId = usuarioLogado?.organizadorId || (usuarioLogado?.tipo === "organizador" ? usuarioLogado?.id : null);
          const base = meuOrgId
            ? atletas.filter(a => a.organizadorId === meuOrgId)
            : atletas.filter(a => !!a.organizadorId); // sem organizadorId = não participa
          // Unir com atletas cruzados (sem duplicar)
          const baseIds = new Set(base.map(a => a.id));
          const extras = atletasCruzados.filter(a => !baseIds.has(a.id));
          return [...base, ...extras];
        })();

  // Filtro de busca por nome
  const atletasBusca = buscaAtleta.trim()
    ? atletasFiltrados.filter(a => 
        a.nome.toLowerCase().includes(buscaAtleta.toLowerCase().trim())
      )
    : atletasFiltrados;

  const atletaSel = atletas.find((a) => a.id === atletaId);
  const anoComp = new Date(eventoParaInscricao.data).getFullYear();
  const categoria = atletaSel ? getCategoria(atletaSel.anoNasc, anoComp) : null;
  // Provas disponíveis nesta competição
  const provasDoEvento = new Set(eventoParaInscricao.provasPrograma || []);

  const toggleProva = (id) => setProvasSel((p) => {
    if (p.includes(id)) return p.filter((x) => x !== id); // deselect always allowed
    // Check limit before adding
    if (limInd > 0 && !excecoesLimite.has(id)) {
      const contamAtual = p.filter(pId => !excecoesLimite.has(pId)).length;
      if (inscAtletaAtual + contamAtual + 1 > limInd) return p; // blocked
    }
    return [...p, id];
  });
  const jaInscrito = (provaId) => atletaId
    ? inscricoes.some((i) => i.atletaId === atletaId && i.provaId === provaId && i.eventoId === eventoParaInscricao?.id)
    : false;

  // ── Contagem para limite de provas (Etapa 2: por categoria) ──
  const excecoesLimite = new Set(eventoParaInscricao?.provasExcetoLimite || []);
  const limInd = getLimiteCat(eventoParaInscricao, categoria?.id || null);
  const inscAtletaAtual = atletaId
    ? inscricoes.filter(i => i.eventoId === eventoParaInscricao?.id && i.atletaId === atletaId && !excecoesLimite.has(i.provaId)).length
    : 0;
  const novasContam = provasSel.filter(pId => !excecoesLimite.has(pId)).length;
  const restantes = limInd > 0 ? limInd - inscAtletaAtual - novasContam : Infinity;

  const handleSubmit = async () => {
    if (enviando) return;
    if (!isAtleta && modo === "existente" && !atletaId) { setErro("Selecione um atleta"); return; }
    if (isAtleta && !atletaId) { setErro("Dados do atleta não encontrados"); return; }
    if (!isAtleta && modo === "novo") {
      if (!novoAtleta.nome)    { setErro("Preencha o nome completo do atleta"); return; }
      if (!novoAtleta.dataNasc){ setErro("Preencha a data de nascimento"); return; }
      // CPF: se preenchido, validar e verificar duplicata
      if (novoAtleta.cpf) {
        const cpfLimpo = novoAtleta.cpf.replace(/\D/g, "");
        if (cpfLimpo.length > 0 && !validarCPF(cpfLimpo)) { setErro("CPF inválido — corrija ou deixe em branco"); return; }
        const duplicata = atletas.find(a => a.cpf && a.cpf.replace(/\D/g, "") === cpfLimpo);
        if (duplicata) {
          setErro(`CPF já cadastrado para ${duplicata.nome}. Use a aba "Atleta Cadastrado" para selecioná-lo.`);
          return;
        }
      }
      // Email: se preenchido, validar formato
      if (novoAtleta.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoAtleta.email)) {
        setErro("E-mail inválido"); return;
      }
      // CBAt: se preenchido, verificar duplicata
      if (novoAtleta.cbat && novoAtleta.cbat.trim()) {
        const cbatLimpo = novoAtleta.cbat.trim();
        const cbatDup = atletas.find(a => a.cbat && a.cbat.trim() === cbatLimpo);
        if (cbatDup) { setErro(`Nº CBAt "${cbatLimpo}" já cadastrado para ${cbatDup.nome}. Use a aba "Atleta Cadastrado" para selecioná-lo.`); return; }
      }
    }
    if (provasSel.length === 0) { setErro("Selecione ao menos uma prova"); return; }

    // ── Validar limite de provas por categoria (Etapa 2) ──
    const atletaParaValidar = modo === "novo" ? novoAtleta : atletaSel;
    const catParaValidar = atletaParaValidar ? getCategoria(atletaParaValidar.anoNasc, anoComp) : null;
    const aIdCheck = modo === "novo" ? null : atletaId;
    const validacaoLimite = validarLimiteProvas(
      eventoParaInscricao, inscricoes, aIdCheck, catParaValidar?.id || null, provasSel
    );
    if (!validacaoLimite.ok) {
      setErro(validacaoLimite.msg);
      return;
    }

    let aId = atletaId;
    if (!isAtleta && modo === "novo") {
      aId = Date.now().toString();
      adicionarAtleta({ ...novoAtleta, id: aId, cbat: novoAtleta.cbat||"",
        dataCadastro: new Date().toISOString(),
        cadastradoPor: usuarioLogado?.tipo || null,
      });
    }

    const atleta = (isAtleta || modo !== "novo") ? atletaSel : { ...novoAtleta, id: aId };
    const catOficial  = getCategoria(atleta.anoNasc, anoComp);
    const catInscricao = catOficial;
    const idadeAtleta = anoComp - parseInt(atleta.anoNasc);

    setEnviando(true);
    const baseTs = Date.now();
    // ── Etapa 2: snapshot do preço no momento da inscrição ──
    const precoInfoInscricao = calcularPrecoInscricao(atleta, catOficial?.id || null, eventoParaInscricao);
    provasSel.forEach((provaId, idx) => {
      // Extrai categoria da prova pelo ID (M_sub14_100m → sub14)
      const catProvaId = provaId.split("_")[1] || "";
      
      // Valida se atleta pode se inscrever nesta categoria
      const mesmaCat = catProvaId === catOficial.id;
      const permissividade = eventoParaInscricao.permissividadeNorma
        ? getPermissividade(atleta.anoNasc, anoComp, catProvaId)
        : null;
      const superiorPermitida = podeCategoriaSuperior(eventoParaInscricao, idadeAtleta, catOficial.id, catProvaId);
      
      if (!mesmaCat && !permissividade && !superiorPermitida) {
        // Categoria não permitida - pular esta prova silenciosamente
        return;
      }
      adicionarInscricao({
        id: `${eventoParaInscricao.id}_${aId}_${provaId}_${baseTs + idx}`,
        eventoId: eventoParaInscricao.id,
        atletaId: aId,
        provaId,
        categoria: catInscricao.nome,
        categoriaId: catInscricao.id,
        categoriaOficial: catOficial.nome,
        categoriaOficialId: catOficial.id,
        permissividade: permissividade ? permissividade.obs : null,
        sexo: atleta.sexo,
        data: new Date().toISOString(),
        origemAtleta: usuarioLogado?.tipo === "atleta",
        // Quem inscreveu
        inscritoPorId: usuarioLogado?.id || null,
        inscritoPorNome: usuarioLogado?.nome || "Desconhecido",
        inscritoPorTipo: usuarioLogado?.tipo || null,
        // Snapshot de equipe no momento da inscrição
        equipeCadastro:    atleta.clube || _getClubeAtleta(atleta, equipes) || "",
        equipeCadastroId: atleta.equipeId || null,
        // ── Etapa 2: snapshot do preço no momento da inscrição ──
        precoInfo: precoInfoInscricao,
        // ── Etapa 5: rastreabilidade de participação cruzada ──
        ...(atletasCruzadosIds.has(aId) ? {
          participacaoCruzada: true,
          organizadorOrigem: atleta.organizadorId || null,
        } : {}),
      });

      // ── PROVAS COMBINADAS: auto-inscrição nas componentes ──
      const provaInfo = todasAsProvas().find(p => p.id === provaId);
      if (provaInfo && provaInfo.tipo === "combinada") {
        const provasComp = CombinedEventEngine.gerarProvasComponentes(provaId, eventoParaInscricao.id);
        const dadosBase = {
          categoria: catInscricao.nome,
          categoriaId: catInscricao.id,
          categoriaOficial: catOficial.nome,
          categoriaOficialId: catOficial.id,
          sexo: atleta.sexo,
          inscritoPorId: usuarioLogado?.id || null,
          inscritoPorNome: usuarioLogado?.nome || "Desconhecido",
          inscritoPorTipo: usuarioLogado?.tipo || null,
          equipeCadastro: atleta.clube || _getClubeAtleta(atleta, equipes) || "",
          equipeCadastroId: atleta.equipeId || null,
        };
        const inscricoesComp = CombinedEventEngine.inscreverAtletaNasComponentes(
          aId, provaId, eventoParaInscricao.id, dadosBase, provasComp
        );
        inscricoesComp.forEach(ic => adicionarInscricao(ic));
      }
    });
    setEnviando(false);
    setOk(true);
  };

  if (ok) return (
    <div style={s.formPage}>
      <div style={s.formCard}>
        <div style={{ fontSize: 64, textAlign: "center" }}>🎉</div>
        <h2 style={{ ...s.formTitle, textAlign: "center" }}>Inscrição realizada!</h2>
        <p style={{ textAlign: "center", color: "#aaa" }}>{provasSel.length} prova(s) em <strong style={{ color: "#1976D2" }}>{eventoParaInscricao.nome}</strong>.</p>

        {/* ── Informações de pagamento — Etapa 2: preço calculado por categoria + equipe ── */}
        {isAtleta && (() => {
          const atletaConfirm   = atletaSel || (modo === "novo" ? novoAtleta : null);
          const catConfirm      = atletaConfirm ? getCategoria(atletaConfirm.anoNasc, anoComp) : null;
          const precoInfo       = calcularPrecoInscricao(atletaConfirm, catConfirm?.id || null, eventoParaInscricao);
          const forma           = eventoParaInscricao.formaPagamento;
          const orientacao      = eventoParaInscricao.orientacaoPagamento;
          const orgId           = eventoParaInscricao.organizadorId;
          const org             = (organizadores || []).find(o => o.id === orgId);
          const contato         = org?.email || org?.fone || null;
          const temInfoPagto    = precoInfo.preco != null || forma || orientacao;
          if (!temInfoPagto) return null;
          return (
            <div style={{ background:"#0a1220", border:"1px solid #1976D244", borderRadius:10, padding:"16px 18px", margin:"16px 0", textAlign:"left" }}>
              <div style={{ fontWeight:700, color:"#1976D2", fontSize:14, marginBottom:10 }}>💳 Informações de Pagamento</div>
              {precoInfo.preco != null && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"8px 0", borderBottom:"1px solid #1E2130", gap:12 }}>
                  <div>
                    <span style={{ color:"#888", fontSize:13 }}>Valor por atleta</span>
                    <div style={{ fontSize:10, color:"#555", marginTop:2 }}>Taxa única por atleta na competição — independente do nº de provas</div>
                    {precoInfo.tipo !== "global" && (
                      <div style={{ fontSize:10, color:"#666", marginTop:1 }}>{precoInfo.label}</div>
                    )}
                  </div>
                  <strong style={{ color:"#7acc44", fontSize:20, fontFamily:"'Barlow Condensed', sans-serif", whiteSpace:"nowrap" }}>
                    {formatarPreco(precoInfo.preco)}
                  </strong>
                </div>
              )}
              {forma && (
                <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #1E2130" }}>
                  <span style={{ color:"#888", fontSize:13 }}>Forma de pagamento</span>
                  <span style={{ color:"#fff", fontSize:13 }}>{forma}</span>
                </div>
              )}
              {(orientacao || contato) && (
                <div style={{ marginTop:10, padding:"8px 12px", background:"#0d1520", borderRadius:8, fontSize:12, color:"#aaa", lineHeight:1.6, whiteSpace:"pre-wrap" }}>
                  {orientacao || `Entre em contato com o organizador para efetuar o pagamento.${contato ? `\n${contato}` : ""}`}
                </div>
              )}
            </div>
          );
        })()}

        <div style={{ ...s.resumoInscricao, margin:"12px 0 16px" }}>
          <strong style={{ color:"#aaa", fontSize:12 }}>Provas inscritas:</strong>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
            {provasSel.map(pid => {
              const p = todasAsProvas().find(x => x.id === pid);
              return <span key={pid} style={{ ...s.tagProva, cursor:"default" }}>✓ {p?.nome || pid}</span>;
            })}
          </div>
        </div>

        <div style={s.heroBtns}>
          <button style={s.btnPrimary} onClick={() => setTela(isAtleta ? "painel-atleta" : "sumulas")}>{isAtleta ? "← Meu Painel" : "Ver Súmulas"}</button>
          <button style={s.btnGhost} onClick={() => { setOk(false); setProvasSel([]); if (isAtleta) { setEventoSelecionadoAtleta(null); } else { setAtletaId(""); setBuscaAtleta(""); } setNovoAtleta({ nome:"", dataNasc:"", anoNasc:"", sexo:"M", cbat:"", clube:"", equipeId:"" }); }}>
            {isAtleta ? "Inscrever em outra competição" : "Nova Inscrição"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <h1 style={s.pageTitle}>✍️ {isAtleta ? "Me Inscrever" : "Inscrição em Provas"}</h1>
        <button style={s.btnGhost} onClick={() => isAtleta ? setEventoSelecionadoAtleta(null) : setTela("evento-detalhe")}>← {isAtleta ? "Escolher Competição" : eventoParaInscricao.nome}</button>
      </div>

      {/* Info da competição para atletas */}
      {isAtleta && (
        <div style={{ background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: "#fff", fontSize: 15, marginBottom: 4 }}>🏟 {eventoParaInscricao.nome}</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#888" }}>
            {eventoParaInscricao.data && <span>📅 {new Date(eventoParaInscricao.data + "T12:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" })}</span>}
            {eventoParaInscricao.local && <span>📍 {eventoParaInscricao.local}</span>}
          </div>
        </div>
      )}

      {!isAtleta && (
        <>
      <div style={s.modoSwitch}>
        <button style={{ ...s.modoBtn, ...(modo === "existente" ? s.modoBtnActive : {}) }} onClick={() => setModo("existente")}>
          👤 Atleta Cadastrado
        </button>
          <button style={{ ...s.modoBtn, ...(modo === "novo" ? s.modoBtnActive : {}) }} onClick={() => setModo("novo")}>
            ➕ Novo Atleta
          </button>
      </div>
        </>
      )}

      {erro && <div style={s.erro}>{erro}</div>}

      {/* Para atletas: mostrar seus dados diretamente */}
      {isAtleta && meuAtletaInsc && (
        <div style={{ ...s.atletaInfo, marginBottom: 12 }}>
          <span>🏃 {meuAtletaInsc.nome}</span>
          <span style={s.badgeGold}>{getCategoria(meuAtletaInsc.anoNasc, anoComp)?.nome}</span>
          <span style={s.badge(meuAtletaInsc.sexo === "M" ? "#1a6ef5" : "#e54f9b")}>{meuAtletaInsc.sexo === "M" ? "Masculino" : "Feminino"}</span>
          {_getClubeAtleta(meuAtletaInsc, equipes) && (
            <span style={{ fontSize: 12, color: "#888" }}>{_getClubeAtleta(meuAtletaInsc, equipes)}</span>
          )}
        </div>
      )}

      {!isAtleta && (modo === "existente" ? (
        <div style={s.formCard}>
          <label style={s.label}>Selecionar Atleta</label>
          <input
            type="text"
            style={{ ...s.input, marginBottom:12 }}
            placeholder={`🔍 Filtrar por nome... (${atletasFiltrados.length} disponíveis)`}
            value={buscaAtleta}
            onChange={(e) => { setBuscaAtleta(e.target.value); }}
          />
          <div style={{ maxHeight:300, overflowY:"auto", border:"1px solid #1E2130", borderRadius:8 }}>
            {atletasBusca.length === 0 ? (
              <div style={{ padding:"16px", color:"#555", fontSize:13, textAlign:"center" }}>
                {buscaAtleta.trim() ? `Nenhum atleta encontrado para "${buscaAtleta}"` : "Nenhum atleta disponível"}
              </div>
            ) : (
              atletasBusca.slice(0, 100).map(a => {
                const cat = getCategoria(a.anoNasc, anoComp);
                const selecionado = atletaId === a.id;
                return (
                  <div key={a.id}
                    onClick={() => { setAtletaId(selecionado ? "" : a.id); }}
                    style={{ padding:"9px 14px", cursor:"pointer", display:"flex",
                      alignItems:"center", gap:10, borderBottom:"1px solid #1a1d2a",
                      background: selecionado ? "#1a2a1a" : "transparent",
                      borderLeft: selecionado ? "3px solid #7cfc7c" : "3px solid transparent" }}
                    onMouseEnter={(e) => { if (!selecionado) e.currentTarget.style.background = "#111420"; }}
                    onMouseLeave={(e) => { if (!selecionado) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ color: selecionado ? "#7cfc7c" : "#fff", fontWeight: selecionado ? 700 : 500, fontSize:13, flex:1 }}>
                      {selecionado && "✓ "}{a.nome}
                    </span>
                    <span style={{ fontSize:11, color:"#1976D2", background:"#1a1a0a", padding:"2px 8px", borderRadius:8 }}>
                      {cat?.nome}
                    </span>
                    <span style={{ fontSize:11, color: a.sexo === "M" ? "#1a6ef5" : "#e54f9b" }}>
                      {a.sexo === "M" ? "Masc" : "Fem"}
                    </span>
                    {_getClubeAtleta(a, equipes) && (
                      <span style={{ fontSize:10, color:"#555" }}>{_getClubeAtleta(a, equipes)}</span>
                    )}
                    {/* ── Etapa 5: badge de participação cruzada ── */}
                    {atletasCruzadosIds.has(a.id) && (
                      <span style={{ fontSize:10, color:"#5599ff", background:"#0a1a2a",
                        border:"1px solid #1a3a5a", padding:"1px 6px", borderRadius:8 }}>
                        🤝 cruzado
                      </span>
                    )}
                  </div>
                );
              })
            )}
            {atletasBusca.length > 100 && (
              <div style={{ padding:"8px 16px", color:"#1976D2", fontSize:11, textAlign:"center" }}>
                Mostrando 100 de {atletasBusca.length} — use a busca para refinar
              </div>
            )}
          </div>
          {atletaSel && (
            <div style={{ ...s.atletaInfo, marginTop:12 }}>
              <span>🏃 {atletaSel.nome}</span>
              <span style={s.badgeGold}>{categoria?.nome}</span>
              <span style={s.badge(atletaSel.sexo === "M" ? "#1a6ef5" : "#e54f9b")}>{atletaSel.sexo === "M" ? "Masculino" : "Feminino"}</span>
              <button onClick={() => { setAtletaId(""); setBuscaAtleta(""); }}
                style={{ ...s.btnGhost, fontSize:11, padding:"2px 8px", color:"#ff6b6b", borderColor:"#3a1a1a", marginLeft:8 }}>✕ Limpar</button>
            </div>
          )}
        </div>
      ) : (
        <div style={s.formCard}>
          <h3 style={{ color:"#1976D2", margin:"0 0 16px" }}>Dados do Atleta</h3>
          <div style={s.grid2form}>

            {/* CPF — recomendado para identificação futura */}
            <div>
              <FormField label="CPF (recomendado)" value={novoAtleta.cpf}
                onChange={(v) => { setNovoAtleta({ ...novoAtleta, cpf: v }); verificarCpfNovo(v); }}
                placeholder="000.000.000-00" />
              {cpfNovoStatus === "invalido" && (
                <div style={{ color:"#ff6b6b", fontSize:11, marginTop:4 }}>⛔ CPF inválido</div>
              )}
              {cpfNovoStatus === "ok" && (
                <div style={{ color:"#7cfc7c", fontSize:11, marginTop:4 }}>✅ CPF válido</div>
              )}
              {cpfNovoStatus === "existente" && atletaCpfExistente && (
                <div style={{ background:"#1a1500", border:"1px solid #ff9800", borderRadius:8, padding:"10px 14px", marginTop:6 }}>
                  <div style={{ color:"#ffb74d", fontSize:13, fontWeight:700, marginBottom:6 }}>
                    ⚠️ CPF já cadastrado no sistema
                  </div>
                  <div style={{ color:"#ccc", fontSize:12, lineHeight:1.6 }}>
                    <strong>{atletaCpfExistente.nome}</strong>
                    {atletaCpfExistente.sexo && <span> · {atletaCpfExistente.sexo === "M" ? "Masc" : "Fem"}</span>}
                    {atletaCpfExistente.dataNasc && <span> · {atletaCpfExistente.dataNasc}</span>}
                    {atletaCpfExistente.clube && <span> · {atletaCpfExistente.clube}</span>}
                  </div>
                  <button onClick={() => {
                    setAtletaId(atletaCpfExistente.id);
                    setBuscaAtleta(atletaCpfExistente.nome || "");
                    setModo("existente");
                    setCpfNovoStatus(null);
                    setAtletaCpfExistente(null);
                  }} style={{ ...s.btnPrimary, fontSize:12, padding:"6px 14px", marginTop:8 }}>
                    ✅ Usar atleta existente
                  </button>
                </div>
              )}
            </div>

            {/* Email — opcional */}
            <FormField label="Email (opcional)" value={novoAtleta.email}
              onChange={(v) => setNovoAtleta({ ...novoAtleta, email: v })}
              placeholder="atleta@email.com" type="email" />

            {/* Nome Completo */}
            <div style={{ gridColumn:"1/-1" }}>
              <FormField label="Nome Completo *" value={novoAtleta.nome}
                onChange={(v) => setNovoAtleta({ ...novoAtleta, nome: v })}
                placeholder="Nome completo do atleta" />
            </div>

            {/* Data de Nascimento */}
            <FormField label="Data de Nascimento *" value={novoAtleta.dataNasc}
              onChange={(v) => setNovoAtleta({ ...novoAtleta, dataNasc: v, anoNasc: v ? v.split("-")[0] : "" })}
              type="date" />

            {/* Registro CBAt */}
            <FormField label="Registro CBAt (opcional)" value={novoAtleta.cbat||""}
              onChange={(v) => setNovoAtleta({ ...novoAtleta, cbat: v })}
              placeholder="Nº de registro" />

            {/* Sexo */}
            <div>
              <label style={s.label}>Sexo</label>
              <div style={s.radioGroup}>
                {[["M","Masculino"],["F","Feminino"]].map(([v,l]) => (
                  <label key={v} style={{ ...s.radioLabel, ...(novoAtleta.sexo===v ? s.radioLabelActive : {}) }}>
                    <input type="radio" value={v} checked={novoAtleta.sexo===v}
                      onChange={() => setNovoAtleta({ ...novoAtleta, sexo: v })}
                      style={{ display:"none" }} />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            {/* Espaço */}
            <div />

            {/* Equipe / Clube */}
            <div style={{ gridColumn:"1/-1" }}>
              <label style={s.label}>
                Equipe / Clube <span style={{ color:"#555", fontSize:11 }}>(opcional)</span>
              </label>
              <select
                style={s.select}
                value={novoAtleta.equipeId}
                onChange={e => {
                  const eqId = e.target.value;
                  const eq = equipes.find(t => t.id === eqId);
                  setNovoAtleta({ ...novoAtleta, equipeId: eqId, clube: eq ? (eq.clube || eq.nome || "") : "" });
                }}>
                <option value="">— Sem equipe —</option>
                {equipes.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nome}{t.clube ? ` — ${t.clube}` : ""}
                  </option>
                ))}
              </select>
              {novoAtleta.equipeId && (
                <div style={{ fontSize:11, color:"#7cfc7c", marginTop:4 }}>
                  ✅ Equipe: <strong>{equipes.find(t => t.id === novoAtleta.equipeId)?.nome || "—"}</strong>
                  {novoAtleta.clube && <span> · Clube: {novoAtleta.clube}</span>}
                </div>
              )}
            </div>

          </div>

          {/* Aviso se CPF e email vazios */}
          {!novoAtleta.cpf && !novoAtleta.email && novoAtleta.nome && (
            <div style={{ background:"#1a1500", border:"1px solid #ff980055", borderRadius:8, padding:"10px 14px", marginTop:12, display:"flex", alignItems:"flex-start", gap:8 }}>
              <span style={{ fontSize:16 }}>⚠️</span>
              <div style={{ fontSize:12, color:"#ffb74d", lineHeight:1.6 }}>
                <strong>Sem CPF e email</strong> — este atleta não poderá criar conta própria nem ser identificado automaticamente em futuras competições. Recomendamos preencher ao menos o CPF.
              </div>
            </div>
          )}

          {/* Preview categoria */}
          {novoAtleta.dataNasc && (
            <div style={s.catPreview}>
              Categoria: <strong>{getCategoria(novoAtleta.anoNasc, anoComp).display}</strong>
            </div>
          )}
        </div>
      ))}

      {(atletaSel || (!isAtleta && modo === "novo" && novoAtleta.anoNasc && !isNaN(novoAtleta.anoNasc))) && (() => {
          const atletaAtivo = (!isAtleta && modo === "novo") ? novoAtleta : atletaSel;
          const catOficial = getCategoria(atletaAtivo.anoNasc, anoComp);
          // catExibida = catOficial (não mais influenciada por permissividade)
          const catExibida = catOficial;
          // permissividade para exibição: verifica se atleta é exceção em alguma prova do evento
          // (usa a primeira categoria superior disponível no programa, se houver)
          const catSuperiorNoEvento = eventoParaInscricao.permissividadeNorma
            ? (["sub16","sub18"].find(cid => {
                const pfx = `${atletaAtivo.sexo}_${cid}_`;
                return todasAsProvas().some(p => p.id.startsWith(pfx) && provasDoEvento.has(p.id));
              }) || null)
            : null;
          const permissividade = catSuperiorNoEvento
            ? getPermissividade(atletaAtivo.anoNasc, anoComp, catSuperiorNoEvento)
            : null;
          // Mostra provas do evento compatíveis com a categoria OFICIAL do atleta
          // Se permissividadeNorma, inclui também provas da categoria superior permitida
          const catPrefixo = `${atletaAtivo.sexo}_${catOficial.id}_`;
          // Categorias superiores que aceitam este atleta por exceção
          const catsSuperior = eventoParaInscricao.permissividadeNorma ? (() => {
            const extras = [];
            const idade = (eventoParaInscricao.data ? new Date(eventoParaInscricao.data).getFullYear() : new Date().getFullYear()) - parseInt(atletaAtivo.anoNasc);
            if (catOficial.id === "sub14" || idade === 11) extras.push(`${atletaAtivo.sexo}_sub14_`);
            if (catOficial.id === "sub14") extras.push(`${atletaAtivo.sexo}_sub16_`);
            if (catOficial.id === "sub16") extras.push(`${atletaAtivo.sexo}_sub18_`);
            return extras;
          })() : [];
          const provasDisp = todasAsProvas().filter((p) =>
            (p.id.startsWith(catPrefixo) || catsSuperior.some(pfx => p.id.startsWith(pfx)))
            && provasDoEvento.has(p.id)
            && p.tipo !== "revezamento");
          const grupos = [...new Set(provasDisp.map((p) => p.grupo))];
          const todasProvasMap = {};
          todasAsProvas().forEach((p) => { todasProvasMap[p.id] = p; });
          return (
            <div>
              <h2 style={s.sectionTitle}>Selecionar Provas</h2>
              {limInd > 0 && (
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:8, marginBottom:12,
                  background: restantes <= 0 ? "#3a0a0a" : restantes <= 2 ? "#0a1a2a" : "#0a1a0a",
                  border: `1px solid ${restantes <= 0 ? "#6a2a2a" : restantes <= 2 ? "#4a3a0a" : "#1a3a1a"}`,
                  fontSize:12, fontWeight:600,
                  color: restantes <= 0 ? "#ff6b6b" : restantes <= 2 ? "#1976D2" : "#7acc44",
                }}>
                  🎯 Limite: {inscAtletaAtual + novasContam}/{limInd} prova(s)
                  {restantes > 0
                    ? ` · ${restantes} vaga(s) restante(s)`
                    : " · Limite atingido"}
                  {(eventoParaInscricao.provasExcetoLimite || []).length > 0 && (
                    <span style={{ color:"#888", fontWeight:400 }}> · Exceções não contam</span>
                  )}
                </div>
              )}
              <div style={s.catBanner}>
                Provas no programa para: <strong>{catOficial.nome}</strong> · <strong>{atletaAtivo.sexo === "M" ? "Masculino" : "Feminino"}</strong>
                {provasDisp.length === 0 && <span style={{ color: "#ff6b6b", marginLeft: 12 }}>⚠ Nenhuma prova desta categoria/sexo no programa desta competição</span>}
              </div>
              {permissividade && (
                <div style={s.permissividadeAlert}>
                  <div style={s.permissividadeAlertIcon}>⚖️</div>
                  <div>
                    <div style={s.permissividadeAlertTitle}>Participação por Exceção de Norma CBAt</div>
                    <div style={s.permissividadeAlertBody}>{permissividade.obs}</div>
                    <div style={s.permissividadeAlertRodape}>
                      Categoria oficial do atleta: <strong>{catOficial.nome}</strong> · A súmula conterá esta observação.
                    </div>
                  </div>
                </div>
              )}
              {grupos.map((grupo) => (
                <ProvaSelector key={grupo} provas={provasDisp.filter((p) => p.grupo === grupo)}
                  titulo={grupo} selecionadas={provasSel} onToggle={toggleProva} jaInscrito={jaInscrito} />
              ))}
              {provasSel.length > 0 && (
                <div style={s.resumoInscricao}>
                  <strong>Provas selecionadas: {provasSel.length}</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    {provasSel.map((id) => {
                      const p = todasProvasMap[id];
                      return <span key={id} style={s.tagProva}>{p?.nome} ×</span>;
                    })}
                  </div>
                </div>
              )}
              {provasDisp.length > 0 && (
                <button style={{ ...s.btnPrimary, marginTop: 24, opacity: enviando ? 0.5 : 1 }} onClick={handleSubmit} disabled={enviando}>
                  {enviando ? "Inscrevendo..." : "Confirmar Inscrição"}
                </button>
              )}
            </div>
          );
        })()
      }

      {/* ── LINK PARA INSCRIÇÃO DE REVEZAMENTO (tela própria) ── */}
      {(() => {
        const provasRevezEvento = todasAsProvas().filter(p =>
          p.tipo === "revezamento" && (eventoParaInscricao.provasPrograma || []).includes(p.id)
        );
        if (provasRevezEvento.length === 0) return null;
        if (!eventoParaInscricao.revezamentoInscAntecipada) return null; // antecipada desativada: não mostrar aqui
        const isEquipeTreinador = tipoInsc === "equipe" || tipoInsc === "treinador";
        const podeInscRevez = isPrivileg || (isEquipeTreinador && eventoParaInscricao.revezamentoInscAntecipada);
        if (!podeInscRevez) return null;
        const inscsRevezEvt = inscricoes.filter(i => i.eventoId === eventoParaInscricao.id && i.tipo === "revezamento");
        const equipeIdUser = tipoInsc === "equipe" ? usuarioLogado.id : tipoInsc === "treinador" ? usuarioLogado.equipeId : null;
        const nMinhas = equipeIdUser ? inscsRevezEvt.filter(i => i.equipeId === equipeIdUser).length : inscsRevezEvt.length;
        return (
          <div style={{ marginTop: 32, padding: 20, background: "#0d0e14", border: "1px solid #1976D233", borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#1976D2", margin: 0 }}>
                  🏃‍♂️ Inscrição de Revezamento
                </h2>
                <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
                  {nMinhas > 0 ? `${nMinhas} equipe(s) inscrita(s)` : "Nenhuma equipe inscrita ainda"}
                  {" · "}{provasRevezEvento.length} prova(s) disponível(eis)
                </p>
              </div>
              <button style={s.btnPrimary} onClick={() => setTela("inscricao-revezamento")}>
                Gerenciar Revezamentos →
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}


export default TelaInscricaoAvulsa;
