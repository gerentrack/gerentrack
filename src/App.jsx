import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
// ── Hooks extraídos (Etapa 2.3 — decomposição App.jsx) ──────────
import { useLoginLogout } from "./hooks/useLoginLogout";
import { useGuards } from "./hooks/useGuards";
import { useMigrations } from "./hooks/useMigrations";
import { useAuditoria } from "./hooks/useAuditoria";
import { useNotificacoes } from "./hooks/useNotificacoes";
import { useBranding } from "./hooks/useBranding";
import { useSolicitacoes } from "./hooks/useSolicitacoes";
import { useSenhas } from "./hooks/useSenhas";
import { useBackupRestore } from "./hooks/useBackupRestore";
import { useCrudOrganizadores } from "./hooks/useCrudOrganizadores";
import { useCrudPessoal } from "./hooks/useCrudPessoal";
import { useAprovacaoEquipes } from "./hooks/useAprovacaoEquipes";
import { useVinculos } from "./hooks/useVinculos";
import { useCrudAtletas } from "./hooks/useCrudAtletas";
import { useCrudEventos } from "./hooks/useCrudEventos";
import { useExcluirDadosOrganizador } from "./hooks/useExcluirDadosOrganizador";
import { useCrudEquipes } from "./hooks/useCrudEquipes";
import { useNotificacaoProvaConcluida } from "./hooks/useNotificacaoProvaConcluida";
// ── Contexts (Etapa 2 — migração React Router) ──────────────────
import { AuthProvider, buildAuthValue } from "./contexts/AuthContext";
import { EventoProvider, buildEventoValue } from "./contexts/EventoContext";
import { AppProvider, buildAppValue } from "./contexts/AppContext";
// ── Router Bridge (Etapa 4 — sincroniza tela ↔ URL) ─────────────
import { Routes, Route, useNavigate } from "react-router-dom";
import EventoLayout from "./layouts/EventoLayout";
import FinalizedGuard from "./router/FinalizedGuard";
// ── Shared — Engines (apenas os que ainda são passados via context) ──
import { RecordDetectionEngine }           from "./shared/engines/recordDetectionEngine";
import RankingExtractionEngine             from "./shared/engines/rankingExtractionEngine";

import { _getClubeAtleta } from "./shared/formatters/utils";

import { Header }                  from "./features/layout/Header";

// ── Lazy-loaded: telas carregadas sob demanda (pré-cacheadas pelo SW) ──
const TelaHome                    = React.lazy(() => import("./features/eventos/TelaHome"));
const TelaLogin                   = React.lazy(() => import("./features/auth/TelaLogin"));
const TelaEventoDetalhe           = React.lazy(() => import("./features/eventos/TelaEventoDetalhe"));
const TelaCadastroEvento          = React.lazy(() => import("./features/eventos/TelaCadastroEvento").then(m => ({ default: m.TelaCadastroEvento })));
const TelaSelecaoPerfil           = React.lazy(() => import("./features/auth/TelaSelecaoPerfil"));
const TelaRecuperacaoSenha        = React.lazy(() => import("./features/auth/TelaRecuperacaoSenha"));
const TelaTrocarSenha             = React.lazy(() => import("./features/auth/TelaTrocarSenha"));
const TelaConfiguracoes           = React.lazy(() => import("./features/auth/TelaConfiguracoes"));
const PrepararOffline             = React.lazy(() => import("./features/eventos/PrepararOffline"));
const TelaGerenciarInscricoes     = React.lazy(() => import("./features/inscricoes/TelaGerenciarInscricoes"));
const TelaInscricaoAvulsa         = React.lazy(() => import("./features/inscricoes/TelaInscricaoAvulsa"));
const TelaInscricaoRevezamento    = React.lazy(() => import("./features/inscricoes/TelaInscricaoRevezamento"));
const TelaSumulas                 = React.lazy(() => import("./features/sumulas/TelaSumulas"));
const TelaResultados              = React.lazy(() => import("./features/resultados/TelaResultados"));
const TelaRecordes                = React.lazy(() => import("./features/recordes/TelaRecordes"));
const TelaRanking                 = React.lazy(() => import("./features/ranking/TelaRanking"));
const TelaFaq                     = React.lazy(() => import("./features/utilidades/TelaFaq"));
const TelaPlanos                  = React.lazy(() => import("./features/comercial/TelaPlanos"));
const TelaPrivacidade             = React.lazy(() => import("./features/legal/TelaPrivacidade"));
const TelaTermos                  = React.lazy(() => import("./features/legal/TelaTermos"));
const TelaDigitarResultados       = React.lazy(() => import("./features/digitar/TelaDigitarResultados"));
const TelaConfigPontuacaoEquipes  = React.lazy(() => import("./features/configuracoes/TelaConfigPontuacaoEquipes"));
const TelaSecretaria              = React.lazy(() => import("./features/secretaria/TelaSecretaria"));
const TelaGerenciarUsuarios       = React.lazy(() => import("./features/admin/TelaGerenciarUsuarios"));
const TelaGerenciarEquipes        = React.lazy(() => import("./features/admin/TelaGerenciarEquipes"));
const TelaAdmin                   = React.lazy(() => import("./features/admin/TelaAdmin"));
const TelaPainel                  = React.lazy(() => import("./features/paineis/TelaPainel"));
const TelaPainelOrganizador       = React.lazy(() => import("./features/paineis/TelaPainelOrganizador"));
const TelaPainelAtleta            = React.lazy(() => import("./features/paineis/TelaPainelAtleta"));
const TelaPainelEquipe            = React.lazy(() => import("./features/paineis/TelaPainelEquipe"));
const TelaCadastroEquipe          = React.lazy(() => import("./features/cadastros/TelaCadastroEquipe"));
const TelaCadastroOrganizador     = React.lazy(() => import("./features/cadastros/TelaCadastroOrganizador"));
const TelaCadastroAtletaLogin     = React.lazy(() => import("./features/cadastros/TelaCadastroAtletaLogin"));
const TelaFuncionarios            = React.lazy(() => import("./features/gestao/TelaFuncionarios"));
const TelaTreinadores             = React.lazy(() => import("./features/gestao/TelaTreinadores"));
const TelaCadastrarAtleta         = React.lazy(() => import("./features/gestao/TelaCadastrarAtleta"));
const TelaEditarAtleta            = React.lazy(() => import("./features/gestao/TelaEditarAtleta"));
const TelaImportarAtletas         = React.lazy(() => import("./features/utilidades/TelaImportarAtletas"));
const TelaNumericaPeito           = React.lazy(() => import("./features/utilidades/TelaNumericaPeito"));
const TelaFinishLynx              = React.lazy(() => import("./features/utilidades/TelaFinishLynx"));
const TelaGestaoInscricoes        = React.lazy(() => import("./features/utilidades/TelaGestaoInscricoes"));
const TelaGerenciarMembros        = React.lazy(() => import("./features/utilidades/TelaGerenciarMembros"));
const TelaAuditoria               = React.lazy(() => import("./features/utilidades/TelaAuditoria"));
const TelaPerfilOrganizador       = React.lazy(() => import("./features/organizadores/TelaPerfilOrganizador"));
const RegulamentoViewer           = React.lazy(() => import("./features/eventos/RegulamentoViewer"));

// Firebase — apenas auth (Firestore é usado internamente pelos hooks de storage)
import {
  db,
  doc,
  setDoc,
  auth,
  onAuthStateChanged,
  sendEmailVerification,
} from "./firebase";

// Hooks de domínio (já existiam)
import { useResultados } from "./hooks/useResultados";
import { useInscricoes } from "./hooks/useInscricoes";
import { useAtletas }    from "./hooks/useAtletas";
import { useAtletasUsuarios } from "./hooks/useAtletasUsuarios";
import { useOrganizadores }   from "./hooks/useOrganizadores";
import { useFuncionarios }    from "./hooks/useFuncionarios";
import { useTreinadores }    from "./hooks/useTreinadores";
import { useRanking }        from "./hooks/useRanking";
import { useRecordes }       from "./hooks/useRecordes";
import { useNumeracaoPeito } from "./hooks/useNumeracaoPeito";
import { useEquipes }    from "./hooks/useEquipes";
import { useEventos }    from "./hooks/useEventos";
import { useMedalhasChamada } from "./hooks/useMedalhasChamada";
import { useOfflineStatus } from "./hooks/useOfflineStatus";

// ── Infraestrutura extraída — Etapa 1 ──────────────────────────────
import { useLocalStorage } from "./lib/storage/useLocalStorage";
import { useLocalOnly }    from "./lib/storage/useLocalOnly";

// Migração de dados legados (executa imediatamente ao importar)
import "./lib/migration/migrarDadosLegacy";
import { ConfirmProvider, useConfirm } from "./features/ui/ConfirmContext";
import { TemaProvider } from "./shared/TemaContext";
import { temaDark, temaLight } from "./shared/tema";
import cssGlobal from "./shared/styles/globalCss";
import styles from "./shared/styles/appStyles";
import Footer from "./features/layout/Footer";
import { AdminConfigProvider } from "./contexts/AdminConfigContext";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import BannerCookies, { useCookieConsent } from "./features/ui/BannerCookies";
import AtualizacaoDisponivel from "./features/ui/AtualizacaoDisponivel";
import RelatorioSync from "./features/ui/RelatorioSync";
import BannerInstalar from "./features/ui/BannerInstalar";

// SheetJS for Excel file handling - will be loaded via script tag in HTML

// Conecta o hook useConfirm ao ref global (App não pode usar o hook diretamente)
function ConfirmBridge() {
  const c = useConfirm();
  React.useEffect(() => { _confirmarRef.current = c; return () => { _confirmarRef.current = null; }; }, [c]);
  return null;
}


// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────────
// Ref global para confirmar — setado por ConfirmBridge dentro do ConfirmProvider
const _confirmarRef = { current: null };
const confirmar = (...args) => _confirmarRef.current ? _confirmarRef.current(...args) : Promise.resolve(window.confirm(...args.map(a => typeof a === "string" ? a : "")));

function App() {
  const navigate = useNavigate();
  const cookieConsent = useCookieConsent();

  // Rastreia se Firebase Auth tem sessão ativa (necessário para listeners que exigem auth)
  const [firebaseAuthed, setFirebaseAuthed] = useState(!!auth.currentUser);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => { setFirebaseAuthed(!!user); });
    return unsub;
  }, []);

  const [usuarioLogado, setUsuarioLogado] = useLocalOnly("atl_usuario", null);
  const [temaClaro, setTemaClaro] = useLocalOnly("gt_tema_claro", false);

  // PWA: atualizar theme-color da barra do navegador/sistema
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", temaClaro ? "#FFFFFF" : "#0D0E12");
  }, [temaClaro]);

  // auditoria removida — redundante com historicoAcoes
  // const [auditoria, _setAuditoria] = useLocalStorage("atl_auditoria", []);
  // Wrapper com limite de 500 entradas — protege o documento Firestore de ultrapassar 1MB
  // ── Coleções individuais Firestore (migradas de state/) ──────────────────
  const { organizadores, setOrganizadores, resetOrganizadores, importarOrganizadores } = useOrganizadores();
  const { atletasUsuarios, setAtletasUsuarios, resetAtletasUsuarios, importarAtletasUsuarios, adicionarAtletaUsuario: _adicionarAtletaUsuario, atualizarAtletaUsuario: _atualizarAtletaUsuario } = useAtletasUsuarios();
  const { funcionarios, setFuncionarios, resetFuncionarios, importarFuncionarios } = useFuncionarios();
  const { treinadores, setTreinadores, resetTreinadores, importarTreinadores } = useTreinadores();
  const { ranking, setRanking, resetRanking, importarRanking } = useRanking();
  const { recordes, setRecordes, resetRecordes, importarRecordes } = useRecordes();


  const { notificacoes, setNotificacoes, adicionarNotificacao, marcarNotifLida } = useNotificacoes();
  const { historicoAcoes, setHistoricoAcoes, registrarAcao } = useAuditoria();

  // Multi-evento: cada evento tem { id, nome, data, local, permissividadeNorma, provasPrograma: Set de provaIds }
  // atl_eventos migrado para coleção Firestore própria via useEventos (ver abaixo)
  // recordes migrado para coleção Firestore individual (useRecordes)
  // const [recordes, setRecordes] = useLocalStorage("atl_recordes", []);
  const [pendenciasRecorde, setPendenciasRecorde] = useLocalStorage("atl_pendencias_recorde", []);
  const [historicoRecordes, setHistoricoRecordes] = useLocalStorage("atl_historico_recordes", []);
  // ranking migrado para coleção Firestore por UF (useRanking)
  // const [ranking, setRanking] = useLocalStorage("atl_ranking", []);
  const [historicoRanking, setHistoricoRanking] = useLocalStorage("atl_historico_ranking", []);
  const [eventoAtualId, setEventoAtualId] = useLocalOnly("atl_eventoAtualId", null);
  const [organizadorPerfilId, setOrganizadorPerfilId] = React.useState(null);
  // Substitutos para window.__ globals
  const [atletaEditandoId, setAtletaEditandoId] = React.useState(null);
  const [cadEventoGoStep, setCadEventoGoStep]   = React.useState(null);

  // Inscrições e resultados vinculados ao eventoId
  // atl_numeracao_peito migrado para coleção Firestore própria via useNumeracaoPeito (ver abaixo)

  // ── GERENTRACK Branding (extraído para useBranding) ──
  const { siteBranding, setSiteBranding, gtIcon, gtLogo, gtLogoFull, gtNome, gtSlogan } = useBranding();

  // ── Multi-Organizador: perfis disponíveis após login ──
  const [perfisDisponiveis, setPerfisDisponiveis] = useLocalOnly("atl_perfis_disponiveis", []);

  // ⚠️ SEGURANÇA: senha do admin gerenciada pelo Firebase Auth.
  // adminConfig guarda apenas email/nome — sem senha local.
  const [adminConfig, setAdminConfig] = useLocalOnly("gt_admin_config", {
    email: "gerentrack@gmail.com",
    nome: "Administrador",
    configurado: true, // Firebase Auth é a fonte de verdade
  });
  // Migrar chaves antigas individuais (se existirem)
  useEffect(() => {
    const oldE = localStorage.getItem("gerentrack_admin_email");
    const oldN = localStorage.getItem("gerentrack_admin_nome");
    const oldS = localStorage.getItem("gerentrack_admin_senha");
    if (oldE || oldN || oldS) {
      setAdminConfig(prev => ({
        email: oldE || prev.email,
        nome: oldN || prev.nome,
        configurado: true,
      }));
      localStorage.removeItem("gerentrack_admin_email");
      localStorage.removeItem("gerentrack_admin_nome");
      localStorage.removeItem("gerentrack_admin_senha");
    }
  }, []);

  // ── Sincronizar email do admin para Firestore (Cloud Functions leem daqui) ──
  useEffect(() => {
    if (adminConfig?.email) {
      setDoc(doc(db, "config", "admin"), { email: adminConfig.email.toLowerCase().trim() }).catch(() => {});
    }
  }, [adminConfig?.email]);

  // ── Eventos via Firestore ─────────────────────────────────────────────────
  // Instanciado antes dos useCallback/useEffect que dependem de `eventos`
  const {
    eventos,
    eventosRef,
    _adicionarEvento,
    _editarEvento,
    _atualizarCamposEvento,
    _atualizarEventosEmLote,
    excluirEventoPorId,
    resetEventos,
    importarEventos,
  } = useEventos();

  const eventoAtual = eventos.find((e) => e.id === eventoAtualId) || null;

  // ── Solicitações (extraído para useSolicitacoes) ──
  const {
    solicitacoesVinculo, setSolicitacoesVinculo,
    solicitacoesRecuperacao, setSolicitacoesRecuperacao,
    solicitacoesEquipe, setSolicitacoesEquipe,
    solicitacoesPortabilidade, setSolicitacoesPortabilidade,
    solicitacoesRelatorio, setSolicitacoesRelatorio,
    adicionarSolicitacaoRecuperacao, resolverSolicitacaoRecuperacao,
    adicionarSolicitacaoPortabilidade, resolverSolicitacaoPortabilidade, excluirSolicitacaoPortabilidade,
    adicionarSolicitacaoEquipe,
    solicitarRelatorio, resolverRelatorio, cancelarRelatorio, excluirRelatorio,
  } = useSolicitacoes({ adicionarNotificacao, registrarAcao, usuarioLogado, eventos });

  // Controle de acesso a competições é feito nas telas individuais:
  // - TelaCadastroEvento bloqueia edição de eventos de outro organizador
  // - Demais telas de gestão verificam permissões conforme necessário
  // selecionarEvento permite visualizar qualquer competição (resultados, detalhes, súmulas)

  // ── Routing via React Router Bridge (substitui pushState/popstate manual) ──
  const eventoAtualIdRef = useRef(eventoAtualId);
  eventoAtualIdRef.current = eventoAtualId;
  const organizadorPerfilIdRef = useRef(organizadorPerfilId);
  organizadorPerfilIdRef.current = organizadorPerfilId;
  const organizadoresRef = useRef(organizadores);
  organizadoresRef.current = organizadores;

  // ── Login/Logout/Session (extraído para useLoginLogout) ──
  const {
    login, loginComSelecao, logout,
    reloginNecessario, reloginSenha, setReloginSenha,
    reloginErro, setReloginErro, reloginLoading, setReloginLoading,
    handleRelogin, handleReloginDesistir,
    sessaoAvisoContagem, renovarSessao,
  } = useLoginLogout({
    usuarioLogado, setUsuarioLogado, firebaseAuthed,
    setPerfisDisponiveis, setEventoAtualId,
    registrarAcao, navigate,
  });

  const adicionarAtletaUsuario = (u) => _adicionarAtletaUsuario(u);
  const atualizarAtletaUsuario = (u) => _atualizarAtletaUsuario(u);


  // ── Equipes via Firestore ─────────────────────────────────────────────────
  const {
    equipes,
    adicionarEquipe: _adicionarEquipe,
    atualizarEquipe: _atualizarEquipe,
    mergeEquipe,
    excluirEquipePorId,
    atualizarSenhaEquipes,
    atualizarCamposEquipe,
    resetEquipes,
    importarEquipes,
    equipesRef,
  } = useEquipes();

  // ── Migrações legadas (extraído para useHook) ──────────────────────
  useMigrations({
    eventos, _atualizarCamposEvento,
    organizadores, setOrganizadores,
    funcionarios, setFuncionarios,
    treinadores, setTreinadores,
    atletasUsuarios, setAtletasUsuarios,
    equipes, _atualizarEquipe,
    firebaseAuthed,
  });

  // ── Guards reativos (extraído para useGuards) ──
  useGuards({
    usuarioLogado, setUsuarioLogado, firebaseAuthed, setPerfisDisponiveis, navigate,
    equipes, organizadores, funcionarios, treinadores, setTreinadores,
  });

  // ── Câmara de Chamada / Medalhas via Firestore (tempo real) ──────────────
  // Só ativa listeners de chamada/medalhas quando Firebase Auth tem sessão ativa
  // (essas coleções exigem request.auth != null para leitura)
  const eventoAtualIdForChamada = (firebaseAuthed && usuarioLogado) ? (eventoAtual?.id || null) : null;
  const { chamada, getPresencaProva } = useMedalhasChamada(eventoAtualIdForChamada);
  const { online, pendentes: pendentesOffline, acabouDeReconectar, pendentesAntesSync, fecharRelatorio } = useOfflineStatus();

  // ── Atletas via Firestore ─────────────────────────────────────────────────
  const {
    atletas,
    adicionarAtleta: _adicionarAtleta,
    adicionarAtletasEmLote: _adicionarAtletasEmLote,
    atualizarAtleta: _atualizarAtleta,
    excluirAtletaPorId,
    excluirAtletasPorIds,
    resetAtletas,
    importarAtletas,
  } = useAtletas();

  // ── Senhas (extraído para useSenhas) ──
  const { gerarSenhaTemp, aplicarSenhaTemp, atualizarSenha } = useSenhas({
    setUsuarioLogado, atualizarCamposEquipe,
    setOrganizadores, setFuncionarios, setTreinadores, setAtletasUsuarios,
    atletasUsuarios, atletas, organizadores, funcionarios, treinadores,
    _atualizarAtleta,
  });

  // ── CRUD Organizadores (extraído para useCrudOrganizadores) ──
  const {
    adicionarOrganizador, editarOrganizadorAdmin,
    excluirOrganizador, aprovarOrganizador, recusarOrganizador,
  } = useCrudOrganizadores({
    organizadores, setOrganizadores, confirmar,
    adicionarNotificacao, registrarAcao, usuarioLogado,
  });

  // ── CRUD Funcionários/Treinadores (extraído para useCrudPessoal) ──
  const {
    adicionarFuncionario, atualizarFuncionario, removerFuncionario,
    adicionarTreinador, atualizarTreinador, removerTreinador,
  } = useCrudPessoal({
    funcionarios, setFuncionarios, treinadores, setTreinadores, confirmar,
  });

  // ── Aprovação de Equipes (extraído para useAprovacaoEquipes) ──
  const { aprovarEquipe, recusarEquipe } = useAprovacaoEquipes({
    equipes, _atualizarEquipe, solicitacoesEquipe, setSolicitacoesEquipe,
    organizadores, adicionarNotificacao, registrarAcao, usuarioLogado,
  });

  const {
    numeracaoPeito,
    setNumeracaoEvento,
    limparNumeracaoEvento,
    resetNumeracao,
    importarNumeracao,
  } = useNumeracaoPeito();


  const atletasRef_app = React.useRef(atletas);
  React.useEffect(() => { atletasRef_app.current = atletas; }, [atletas]);

  const eventoAtualRef_app = React.useRef(eventoAtual);
  React.useEffect(() => { eventoAtualRef_app.current = eventoAtual; }, [eventoAtual]);

  const solicitacoesVinculoRef = React.useRef(solicitacoesVinculo);
  React.useEffect(() => { solicitacoesVinculoRef.current = solicitacoesVinculo; }, [solicitacoesVinculo]);

  // ── Vínculos atleta-equipe (extraído para useVinculos) ──
  const { solicitarVinculo, responderVinculo } = useVinculos({
    equipes, setSolicitacoesVinculo, adicionarNotificacao, registrarAcao,
    usuarioLogado, atletasUsuarios, atletasRef: atletasRef_app,
    solicitacoesVinculoRef, _atualizarAtleta,
  });


  // ── Resultados via Firestore ──────────────────────────────────────────────
  const {
    resultados,
    atualizarResultado,
    atualizarResultadosEmLote,
    limparResultado,
    limparTodosResultados,
    excluirResultadosPorEvento,
    resetResultados,
    importarResultados,
  } = useResultados({ eventos, recordes, _atualizarCamposEvento });

  // ── Inscrições via Firestore ──────────────────────────────────────────────
  const {
    inscricoes,
    adicionarInscricao,
    excluirInscricao,
    atualizarInscricao,
    excluirInscricoesPorAtletas,
    excluirInscricoesPorEvento,
    resetInscricoes,
    importarInscricoes,
    sincronizarNomesEquipes,
  } = useInscricoes({ atletas, registrarAcao, usuarioLogado });

  // ── CRUD Equipes (extraído para useCrudEquipes) ──
  const {
    adicionarEquipe, adicionarEquipeFiliada, editarEquipeFiliada,
    atualizarEquipe, excluirEquipeUsuario, excluirAtletaUsuario, excluirEquipeFiliada,
    editarEquipeAdmin, editarAtletaUsuarioAdmin,
  } = useCrudEquipes({
    equipes, _adicionarEquipe, _atualizarEquipe, mergeEquipe, excluirEquipePorId,
    atletas, excluirAtletasPorIds, excluirInscricoesPorAtletas,
    atletasUsuarios, setAtletasUsuarios, atletasRef: atletasRef_app,
    confirmar, registrarAcao, usuarioLogado, _atualizarAtleta,
  });

  // ── CRUD Atletas (extraído para useCrudAtletas) ──
  const {
    adicionarAtleta, adicionarAtletasEmLote, atualizarAtleta,
    excluirAtleta, excluirAtletasEmMassa, desvincularAtleta, excluirAtletaPorUsuario,
  } = useCrudAtletas({
    atletas, _adicionarAtleta, _adicionarAtletasEmLote, _atualizarAtleta,
    excluirAtletaPorId, excluirAtletasPorIds, excluirInscricoesPorAtletas,
    atletasRef: atletasRef_app, atletasUsuarios, setAtletasUsuarios,
    confirmar, registrarAcao, adicionarNotificacao, usuarioLogado,
  });

  // ── CRUD Eventos (extraído para useCrudEventos) ──
  const { adicionarEvento, editarEvento, atualizarCamposEvento, alterarStatusEvento, excluirEvento } = useCrudEventos({
    eventos, eventosRef, _adicionarEvento, _editarEvento, _atualizarCamposEvento,
    excluirEventoPorId, excluirInscricoesPorEvento, limparNumeracaoEvento,
    inscricoes, atletas, organizadores, setOrganizadores,
    eventoAtualId, setEventoAtualId,
    confirmar, registrarAcao, adicionarNotificacao, usuarioLogado, firebaseAuthed,
  });

  // ── Notificação à secretaria quando prova é concluída (extraído) ──
  useNotificacaoProvaConcluida({
    eventoAtual, resultados, inscricoes, atletas,
    organizadores, funcionarios, adicionarNotificacao,
  });


  // ── Backup/Restore (extraído para useBackupRestore) ──
  const { limparTodosDados, exportarDados, importarDados } = useBackupRestore({
    confirmar, usuarioLogado, registrarAcao,
    equipes, organizadores, atletasUsuarios, funcionarios, treinadores,
    atletas, eventos, inscricoes, resultados, numeracaoPeito,
    solicitacoesRecuperacao, solicitacoesEquipe, solicitacoesRelatorio, historicoAcoes,
    recordes, pendenciasRecorde, historicoRecordes,
    ranking, historicoRanking,
    solicitacoesVinculo, notificacoes,
    solicitacoesPortabilidade,
    siteBranding, perfisDisponiveis, adminConfig,
    resetOrganizadores, resetAtletasUsuarios, resetFuncionarios, resetTreinadores,
    resetEquipes, resetAtletas, resetEventos, resetInscricoes, resetResultados,
    resetNumeracao, resetRecordes, resetRanking,
    setSolicitacoesRecuperacao, setSolicitacoesVinculo, setNotificacoes,
    setHistoricoAcoes, setPendenciasRecorde, setHistoricoRecordes,
    setHistoricoRanking, setPerfisDisponiveis, setAdminConfig, setEventoAtualId,
    setSolicitacoesEquipe, setSolicitacoesRelatorio, setSolicitacoesPortabilidade,
    setSiteBranding,
    importarEquipes, importarOrganizadores, importarAtletasUsuarios,
    importarFuncionarios, importarTreinadores, importarAtletas,
    importarEventos, importarInscricoes, importarResultados,
    importarNumeracao, importarRecordes, importarRanking,
  });



  // ── Exclusão de dados do organizador (extraído para useExcluirDadosOrganizador) ──
  const { excluirDadosOrganizador } = useExcluirDadosOrganizador({
    organizadores, atletas, equipes, inscricoes, resultados, eventos, historicoAcoes,
    atletasUsuarios, funcionarios, treinadores,
    setAtletasUsuarios, setFuncionarios, setTreinadores,
    excluirEventoPorId, excluirInscricoesPorEvento, excluirResultadosPorEvento,
    limparNumeracaoEvento, excluirEquipePorId, excluirAtletasPorIds,
    editarOrganizadorAdmin, registrarAcao, usuarioLogado,
  });


  const _telaSubpath = { "evento-detalhe": "", "novo-evento": "/editar", resultados: "/resultados", sumulas: "/sumulas", "digitar-resultados": "/digitar", "inscricao-avulsa": "/inscricao", "inscricao-revezamento": "/inscricao/revezamento", "gestao-inscricoes": "/gestao-inscricoes", "gerenciar-inscricoes": "/gerenciar-inscricoes", "numeracao-peito": "/numeracao", "config-pontuacao-equipes": "/pontuacao", secretaria: "/secretaria", "export-lynx": "/finishlynx", "gerenciar-membros": "/membros", "preparar-offline": "/offline", regulamento: "/regulamento" };

  const selecionarEvento = useCallback((id, targetTela = "evento-detalhe") => {
    setEventoAtualId(id);
    eventoAtualIdRef.current = id;
    if (id === null) { navigate("/competicao/novo"); return; }
    const ev = eventos.find(ev2 => ev2.id === id);
    const slug = ev?.slug || id;
    navigate(`/competicao/${slug}${_telaSubpath[targetTela] || ""}`);
  }, [eventos, navigate]);

  const selecionarOrganizador = useCallback((orgId) => {
    setOrganizadorPerfilId(orgId);
    organizadorPerfilIdRef.current = orgId;
    const org = organizadores.find(o => o.id === orgId);
    navigate(`/${org?.slug || orgId}`);
  }, [navigate, organizadores]);

  // Helper: resolve nome da equipe/clube para exibição (closure sobre equipes do componente)
  const getClubeAtleta = (atleta) => _getClubeAtleta(atleta, equipes);

  const props = {
    usuarioLogado, setUsuarioLogado, login, loginComSelecao, logout,
    temaClaro, setTemaClaro,
    perfisDisponiveis, setPerfisDisponiveis,
    equipes, atletas, inscricoes, resultados, excluirAtletaPorUsuario,
    eventos, eventoAtual, eventoAtualId, setEventoAtualId, selecionarEvento,
    atletaEditandoId, setAtletaEditandoId,
    cadEventoGoStep, setCadEventoGoStep,
    gerarSenhaTemp, aplicarSenhaTemp, atualizarSenha,
    solicitacoesRecuperacao, adicionarSolicitacaoRecuperacao, resolverSolicitacaoRecuperacao,
    solicitacoesPortabilidade, adicionarSolicitacaoPortabilidade, resolverSolicitacaoPortabilidade, excluirSolicitacaoPortabilidade,
    solicitacoesRelatorio, solicitarRelatorio, resolverRelatorio, cancelarRelatorio, excluirRelatorio,
    sincronizarNomesEquipes,
    funcionarios, adicionarFuncionario, atualizarFuncionario, removerFuncionario,
    treinadores, adicionarTreinador, atualizarTreinador, removerTreinador,
    historicoAcoes, registrarAcao,
    exportarDados, importarDados,
    adicionarEquipeFiliada, editarEquipeFiliada, excluirEquipeFiliada,
    excluirOrganizador, excluirEquipeUsuario, excluirAtletaUsuario, excluirDadosOrganizador,
    editarOrganizadorAdmin, editarEquipeAdmin, editarAtletaUsuarioAdmin,
    adicionarEquipe, adicionarOrganizador, aprovarOrganizador, recusarOrganizador,
    aprovarEquipe, recusarEquipe, adicionarSolicitacaoEquipe,
    solicitacoesEquipe,
    adicionarAtletaUsuario, atualizarAtletaUsuario,
    organizadores, atletasUsuarios, organizadorPerfilId, setOrganizadorPerfilId, selecionarOrganizador,
    atualizarEquipePerfil: _atualizarEquipe,
    atualizarEquipe: _atualizarEquipe,
    // ⚠️ SEGURANÇA: setOrganizadores, setAtletasUsuarios, setFuncionarios, setTreinadores
    // removidos do spread global — injetados explicitamente em TelaConfiguracoes.
    adicionarAtleta, adicionarAtletasEmLote, atualizarAtleta, excluirAtleta, excluirAtletasEmMassa, solicitarVinculo, responderVinculo, desvincularAtleta,
    notificacoes, adicionarNotificacao, marcarNotifLida,
    solicitacoesVinculo,
    adicionarInscricao, excluirInscricao, atualizarInscricao,
    atualizarResultado, atualizarResultadosEmLote, limparResultado, limparTodosResultados,
    numeracaoPeito, setNumeracaoEvento,
    adicionarEvento, editarEvento, atualizarCamposEvento, excluirEvento, alterarStatusEvento, limparTodosDados,
    getClubeAtleta,
    recordes, setRecordes,
    pendenciasRecorde, setPendenciasRecorde, historicoRecordes, setHistoricoRecordes,
    siteBranding, setSiteBranding, gtIcon, gtLogo, gtNome, gtSlogan,
    RecordDetectionEngine,
    RankingExtractionEngine,
    ranking, setRanking, historicoRanking, setHistoricoRanking,
    online, pendentesOffline,
    // ⚠️ SEGURANÇA: adminConfig removido do spread global.
    // Injetado explicitamente apenas em TelaLogin, TelaConfiguracoes e TelaAdmin.
  };

  // ── Context values (coexistem com props durante migração) ─────────
  // Nota: useMemo removido intencionalmente — cada build*Value acessa dezenas
  // de handlers (closures) que são recriados a cada render, tornando deps
  // parciais causa de stale closures sem benefício real de memoização.
  // Para otimizar no futuro: envolver handlers em useCallback individualmente.
  const authValue = buildAuthValue(props);
  const eventoValue = buildEventoValue({ ...props, chamada, getPresencaProva });
  const appValue = buildAppValue(props);
  const adminConfigValue = { adminConfig, setAdminConfig };

  return (
    <AuthProvider value={authValue}>
    <EventoProvider value={eventoValue}>
    <AppProvider value={appValue}>
    <AdminConfigProvider value={adminConfigValue}>
    <TemaProvider temaClaro={temaClaro}>
    <ConfirmProvider>
    <ConfirmBridge />
    <AtualizacaoDisponivel />
    <BannerInstalar />
    <RelatorioSync acabouDeReconectar={acabouDeReconectar} pendentesAntesSync={pendentesAntesSync} pendentesAtual={pendentesOffline} fecharRelatorio={fecharRelatorio} />
    <div style={{ ...styles.root, background: temaClaro ? temaLight.bgPage : temaDark.bgPage, color: temaClaro ? temaLight.textPrimary : temaDark.textPrimary }} className={temaClaro ? "tema-claro" : ""}>
      <style>{cssGlobal}</style>

      {/* ── Banner de manutenção programada (J.5) ── */}
      {siteBranding.manutencao?.dataHora && (() => {
        const dt = new Date(siteBranding.manutencao.dataHora);
        const agora = new Date();
        const diffH = (dt - agora) / (1000 * 60 * 60);
        if (diffH < 0 || diffH > 48) return null;
        return (
          <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:8000, background:"#e67e22", padding:"10px 20px", textAlign:"center", fontSize:13, color:"#fff", fontWeight:600 }}>
            Manutenção programada para {dt.toLocaleDateString("pt-BR")} às {dt.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })}h
            {siteBranding.manutencao.mensagem && ` — ${siteBranding.manutencao.mensagem}`}
          </div>
        );
      })()}

      {/* ── Modal aviso de expiração de sessão ── */}
      {sessaoAvisoContagem !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#181B25", border: "1px solid #1976D244", borderRadius: 16, padding: "36px 40px", maxWidth: 380, width: "90%", textAlign: "center" }}>
            <div style={{ fontFamily: temaDark.fontTitle, fontSize: 28, marginBottom: 12, color: "#ffaa44" }}>AVISO</div>
            <div style={{ fontFamily: temaDark.fontTitle, fontWeight: 800, fontSize: 20, color: "#fff", marginBottom: 8, letterSpacing: 1 }}>
              SESSÃO PRESTES A EXPIRAR
            </div>
            <div style={{ color: "#888", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Sua sessão expira em
            </div>
            <div style={{ fontFamily: temaDark.fontTitle, fontWeight: 900, fontSize: 52, color: sessaoAvisoContagem <= 30 ? "#ff6b6b" : "#ffaa44", lineHeight: 1, marginBottom: 24 }}>
              {Math.floor(sessaoAvisoContagem / 60)}:{String(sessaoAvisoContagem % 60).padStart(2, "0")}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={renovarSessao}
                style={{ background: "linear-gradient(135deg, #1976D2, #1565C0)", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: temaDark.fontTitle, letterSpacing: 1 }}>
                Continuar conectado
              </button>
              <button
                onClick={logout}
                style={{ background: "transparent", color: "#888", border: "1px solid #2a2d3a", padding: "12px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: temaDark.fontBody }}>
                Sair agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal relogin in-place (sessão Firebase Auth expirada) ── */}
      {reloginNecessario && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#181B25", border: "1px solid #1976D244", borderRadius: 16, padding: "36px 40px", maxWidth: 380, width: "90%", textAlign: "center" }}>
            <div style={{ fontFamily: temaDark.fontTitle, fontSize: 28, marginBottom: 12, color: "#ff6b6b" }}>BLOQUEADO</div>
            <div style={{ fontFamily: temaDark.fontTitle, fontWeight: 800, fontSize: 20, color: "#fff", marginBottom: 8, letterSpacing: 1 }}>
              SESSÃO EXPIRADA
            </div>
            <div style={{ color: "#888", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Sua sessão de autenticação expirou.<br />
              Digite sua senha para reconectar sem perder os dados em tela.
            </div>
            <div style={{ color: "#aaa", fontSize: 12, marginBottom: 12 }}>
              {usuarioLogado?.email}
            </div>
            <input
              type="password"
              placeholder="Senha"
              value={reloginSenha}
              onChange={e => setReloginSenha(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !reloginLoading && handleRelogin()}
              autoFocus
              style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #2a2d3a", background: "#181a20", color: "#fff", fontSize: 14, fontFamily: temaDark.fontBody, marginBottom: 10, boxSizing: "border-box", outline: "none" }}
            />
            {reloginErro && (
              <div style={{ color: "#ff6b6b", fontSize: 12, marginBottom: 10 }}>{reloginErro}</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  onClick={handleRelogin}
                  disabled={reloginLoading || !reloginSenha}
                  style={{ background: reloginLoading || !reloginSenha ? "#333" : "linear-gradient(135deg, #1976D2, #1565C0)", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: reloginLoading || !reloginSenha ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, fontFamily: temaDark.fontTitle, letterSpacing: 1, opacity: reloginLoading ? 0.6 : 1 }}>
                  {reloginLoading ? "Reconectando..." : "Reconectar"}
                </button>
                <button
                  onClick={handleReloginDesistir}
                  style={{ background: "transparent", color: "#888", border: "1px solid #2a2d3a", padding: "12px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: temaDark.fontBody }}>
                  Sair
                </button>
              </div>
              <button
                onClick={async () => {
                  setReloginErro("");
                  setReloginLoading(true);
                  try {
                    const { signInWithPopup, signInWithRedirect, googleProvider } = await import("./firebase");
                    const isPWA = window.matchMedia("(display-mode: standalone)").matches || window.navigator?.standalone;
                    if (isPWA) { await signInWithRedirect(auth, googleProvider); return; }
                    await signInWithPopup(auth, googleProvider);
                  } catch (err) {
                    if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
                      setReloginErro("Erro ao reconectar com Google.");
                    }
                  } finally { setReloginLoading(false); }
                }}
                disabled={reloginLoading}
                style={{ background: "#181a20", border: "1px solid #2a2d3a", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: temaDark.fontBody, color: "#aaa", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%" }}>
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Reconectar com Google
              </button>
            </div>
          </div>
        </div>
      )}

      <Header />
      {/* Banner de verificação de e-mail */}
      {usuarioLogado && firebaseAuthed && auth.currentUser && !auth.currentUser.emailVerified && (
        <div style={{ background:"#fff3e0", borderBottom:"1px solid #f0c040", padding:"8px 20px", display:"flex", alignItems:"center", justifyContent:"center", gap:10, flexWrap:"wrap", fontSize:13, color:"#8a6d00" }}>
          <span>Seu e-mail ainda não foi verificado.</span>
          <button onClick={async () => {
            try {
              await sendEmailVerification(auth.currentUser);
              alert("E-mail de verificação enviado! Verifique sua caixa de entrada e spam.");
            } catch (err) {
              if (err.code === "auth/too-many-requests") alert("Aguarde alguns minutos antes de solicitar novamente.");
              else alert("Erro ao enviar: " + err.message);
            }
          }} style={{ background:"#f0a000", color:"#fff", border:"none", borderRadius:6, padding:"4px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
            Enviar verificação
          </button>
        </div>
      )}
      <main style={styles.main}>
      <Routes>
      {/* ── Rotas migradas (Etapa 2+) ── */}
      <Route path="/faq" element={<React.Suspense fallback={null}><TelaFaq /></React.Suspense>} />
      <Route path="/planos" element={<React.Suspense fallback={null}><TelaPlanos /></React.Suspense>} />
      <Route path="/privacidade" element={<React.Suspense fallback={null}><TelaPrivacidade /></React.Suspense>} />
      <Route path="/termos" element={<React.Suspense fallback={null}><TelaTermos /></React.Suspense>} />
      <Route path="/recordes" element={<React.Suspense fallback={null}><TelaRecordes /></React.Suspense>} />
      <Route path="/ranking" element={<React.Suspense fallback={null}><TelaRanking /></React.Suspense>} />
      <Route path="/recuperar-senha" element={<React.Suspense fallback={null}><TelaRecuperacaoSenha /></React.Suspense>} />
      <Route path="/trocar-senha" element={<React.Suspense fallback={null}><TelaTrocarSenha /></React.Suspense>} />
      <Route path="/entrar" element={<React.Suspense fallback={null}><TelaLogin setOrganizadores={setOrganizadores} setAtletasUsuarios={setAtletasUsuarios} setFuncionarios={setFuncionarios} setTreinadores={setTreinadores} /></React.Suspense>} />
      <Route path="/cadastro/equipe" element={<React.Suspense fallback={null}><TelaCadastroEquipe /></React.Suspense>} />
      <Route path="/cadastro/organizador" element={<React.Suspense fallback={null}><TelaCadastroOrganizador /></React.Suspense>} />
      <Route path="/cadastro/atleta" element={<React.Suspense fallback={null}><TelaCadastroAtletaLogin /></React.Suspense>} />
      <Route path="/selecionar-perfil" element={<React.Suspense fallback={null}><TelaSelecaoPerfil /></React.Suspense>} />
      <Route path="/painel" element={<React.Suspense fallback={null}><TelaPainel /></React.Suspense>} />
      <Route path="/painel/organizador" element={<React.Suspense fallback={null}><TelaPainelOrganizador /></React.Suspense>} />
      <Route path="/painel/atleta" element={<React.Suspense fallback={null}><TelaPainelAtleta /></React.Suspense>} />
      <Route path="/painel/equipe" element={<React.Suspense fallback={null}><TelaPainelEquipe /></React.Suspense>} />
      <Route path="/configuracoes" element={<React.Suspense fallback={null}><TelaConfiguracoes setOrganizadores={setOrganizadores} setAtletasUsuarios={setAtletasUsuarios} setFuncionarios={setFuncionarios} setTreinadores={setTreinadores} /></React.Suspense>} />
      <Route path="/admin" element={<React.Suspense fallback={null}><TelaAdmin setHistoricoAcoes={setHistoricoAcoes} /></React.Suspense>} />
      <Route path="/admin/usuarios" element={<React.Suspense fallback={null}><TelaGerenciarUsuarios /></React.Suspense>} />
      <Route path="/admin/equipes" element={<React.Suspense fallback={null}><TelaGerenciarEquipes /></React.Suspense>} />
      <Route path="/admin/funcionarios" element={<React.Suspense fallback={null}><TelaFuncionarios /></React.Suspense>} />
      <Route path="/admin/treinadores" element={<React.Suspense fallback={null}><TelaTreinadores /></React.Suspense>} />
      <Route path="/admin/treinadores/novo" element={<React.Suspense fallback={null}><TelaTreinadores abaInicial="novo" /></React.Suspense>} />
      <Route path="/admin/atleta/novo" element={<React.Suspense fallback={null}><TelaCadastrarAtleta /></React.Suspense>} />
      <Route path="/admin/atleta/cadastrar" element={<React.Suspense fallback={null}><TelaCadastrarAtleta modoInicial="novo" /></React.Suspense>} />
      <Route path="/admin/atleta/:id/editar" element={<React.Suspense fallback={null}><TelaEditarAtleta /></React.Suspense>} />
      <Route path="/admin/importar-atletas" element={<React.Suspense fallback={null}><TelaImportarAtletas /></React.Suspense>} />
      <Route path="/admin/auditoria" element={<React.Suspense fallback={null}><TelaAuditoria /></React.Suspense>} />

      {/* ── Rotas de competição (com EventoLayout) ── */}
      <Route path="/competicao/novo" element={<React.Suspense fallback={null}><TelaCadastroEvento /></React.Suspense>} />
      <Route path="/competicao/:slug" element={<React.Suspense fallback={null}><EventoLayout /></React.Suspense>}>
        <Route index element={<React.Suspense fallback={null}><TelaEventoDetalhe /></React.Suspense>} />
        <Route path="editar" element={<React.Suspense fallback={null}><TelaCadastroEvento /></React.Suspense>} />
        <Route path="resultados" element={<React.Suspense fallback={null}><TelaResultados /></React.Suspense>} />
        <Route path="sumulas" element={<React.Suspense fallback={null}><TelaSumulas /></React.Suspense>} />
        <Route path="gestao-inscricoes" element={<React.Suspense fallback={null}><TelaGestaoInscricoes /></React.Suspense>} />
        <Route path="gerenciar-inscricoes" element={<React.Suspense fallback={null}><TelaGerenciarInscricoes /></React.Suspense>} />
        <Route path="membros" element={<React.Suspense fallback={null}><TelaGerenciarMembros /></React.Suspense>} />
        <Route path="offline" element={<React.Suspense fallback={null}><PrepararOffline /></React.Suspense>} />
        <Route path="regulamento" element={<React.Suspense fallback={null}><RegulamentoViewer eventoAtual={eventoAtual} tema={temaClaro ? temaLight : temaDark} /></React.Suspense>} />
        <Route path="finishlynx" element={<React.Suspense fallback={null}><TelaFinishLynx /></React.Suspense>} />
        {/* Telas bloqueadas se competição finalizada */}
        <Route element={<FinalizedGuard />}>
          <Route path="inscricao" element={<React.Suspense fallback={null}><TelaInscricaoAvulsa /></React.Suspense>} />
          <Route path="inscricao/revezamento" element={<React.Suspense fallback={null}><TelaInscricaoRevezamento /></React.Suspense>} />
          <Route path="digitar" element={<React.Suspense fallback={null}><TelaDigitarResultados /></React.Suspense>} />
          <Route path="numeracao" element={<React.Suspense fallback={null}><TelaNumericaPeito /></React.Suspense>} />
          <Route path="pontuacao" element={<React.Suspense fallback={null}><TelaConfigPontuacaoEquipes /></React.Suspense>} />
          <Route path="secretaria" element={<React.Suspense fallback={null}><TelaSecretaria /></React.Suspense>} />
        </Route>
      </Route>

      {/* ── Home + perfil organizador ── */}
      <Route path="/" element={<React.Suspense fallback={null}><TelaHome /></React.Suspense>} />
      <Route path="/:slug" element={<React.Suspense fallback={null}><TelaPerfilOrganizador /></React.Suspense>} />
      </Routes>
      </main>
      <Footer />
    </div>
    {cookieConsent.aceito && <Analytics />}
    {cookieConsent.aceito && <SpeedInsights />}
    <BannerCookies onAceitar={cookieConsent.aceitar} onRecusar={cookieConsent.recusar} />
    </ConfirmProvider>
    </TemaProvider>
    </AdminConfigProvider>
    </AppProvider>
    </EventoProvider>
    </AuthProvider>
  );
}



export default App;
