import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
// ── Domínio do Atletismo — Etapa 2 ────────────────────────────────
import PROVAS_DEF                             from "./domain/provas/provasDef.json";
import { getProvasCat }                       from "./domain/provas/getProvasCat";
import { todasAsProvas }                      from "./domain/provas/todasAsProvas";
import { nPernasRevezamento, isRevezamentoMisto } from "./domain/revezamento/helpers";
import { COMPOSICAO_COMBINADAS, getComposicaoCombinada } from "./domain/combinadas/composicao";

// ── Shared — Engines — Etapa 3 ────────────────────────────────────
import { RecordHelper }                    from "./shared/engines/recordHelper";
import { CombinedEventEngine }             from "./shared/engines/combinedEventEngine";
import { CombinedScoringEngine }           from "./shared/engines/combinedScoringEngine";
import { TeamScoringEngine }               from "./shared/engines/teamScoringEngine";
import { SeriacaoEngine }                  from "./shared/engines/seriacaoEngine";
import { RecordDetectionEngine }           from "./shared/engines/recordDetectionEngine";
import { GT_DEFAULT_ICON, GT_DEFAULT_LOGO } from "./shared/branding";

// ── Shared — Constants — Etapa 3 ──────────────────────────────────
import { ESTADOS_BR, CATEGORIAS, getCategoria,
         getPermissividade, podeCategoriaSuperior } from "./shared/constants/categorias";
import { FASE_SUFIXOS, FASE_ORDEM, FASE_ANTERIOR, FASE_NOME,
         faseToSufixo, serKey, resKey, getFasesProva,
         temMultiFases, buscarSeriacao, buscarResultado } from "./shared/constants/fases";

// ── Shared — Formatters — Etapa 3 ─────────────────────────────────
import {
  formatarTempo, formatarTempoMs, autoFormatTempo,
  parseTempoPista, _parseDigitsPuros, _parseMinSeg, _marcaParaMs,
  formatarMarca, formatarMarcaExibicao, formatarMarcaExibicaoHtml,
  normalizarMarca, exibirMarcaInput,
  abreviarProva, nomeProvaHtml, NomeProvaComImplemento,
  _getNascDisplay, _getCbat, _getAnoNasc,
  _getEquipeIdAtleta, _getClubeAtleta,
  _getLocalRecorde, _getLocalEventoDisplay,
  emailJaCadastrado, validarCPF, validarCNPJ
} from "./shared/formatters/utils";

// ══════════════════════════════════════════════════════════════════
// IMPORTS ETAPA 4A — Cole no topo do App.jsx (após imports Etapa 3)
// ══════════════════════════════════════════════════════════════════

import { Header, NavBtn }          from "./features/layout/Header";
import TelaLogin                   from "./features/auth/TelaLogin";
import TelaSelecaoPerfil           from "./features/auth/TelaSelecaoPerfil";
import TelaRecuperacaoSenha        from "./features/auth/TelaRecuperacaoSenha";
import TelaTrocarSenha             from "./features/auth/TelaTrocarSenha";
import TelaConfiguracoes           from "./features/auth/TelaConfiguracoes";

// ── Etapa 4B — adicionar ao App.jsx (junto com os imports da 4A) ──
import TelaHome                    from "./features/eventos/TelaHome";
import { TelaCadastroEvento,
         FiltroProvasStep,
         ProgramaHorarioStep,
         RichTextEditor }          from "./features/eventos/TelaCadastroEvento";
import TelaEventoDetalhe           from "./features/eventos/TelaEventoDetalhe";
import { getStatusEvento,
         getStatusInscricoes,
         labelStatusEvento,
         _dtInscricoes }           from "./features/eventos/eventoHelpers";
import TelaGerenciarInscricoes     from "./features/inscricoes/TelaGerenciarInscricoes";
import TelaInscricaoAvulsa         from "./features/inscricoes/TelaInscricaoAvulsa";
import TelaInscricaoRevezamento    from "./features/inscricoes/TelaInscricaoRevezamento";
import TelaSumulas                 from "./features/sumulas/TelaSumulas";
import TelaResultados              from "./features/resultados/TelaResultados";
import TelaRecordes                from "./features/recordes/TelaRecordes";
import { gerarHtmlImpressao }      from "./features/impressao/gerarHtmlImpressao";
import TelaDigitarResultados       from "./features/digitar/TelaDigitarResultados";
import TelaConfigPontuacaoEquipes  from "./features/configuracoes/TelaConfigPontuacaoEquipes";
import TelaGerenciarUsuarios       from "./features/admin/TelaGerenciarUsuarios";
import TelaGerenciarEquipes        from "./features/admin/TelaGerenciarEquipes";
import TelaAdmin                   from "./features/admin/TelaAdmin";
// Painéis
import TelaPainel                  from "./features/paineis/TelaPainel";
import TelaPainelOrganizador       from "./features/paineis/TelaPainelOrganizador";
import TelaPainelAtleta            from "./features/paineis/TelaPainelAtleta";
import TelaPainelEquipe            from "./features/paineis/TelaPainelEquipe";
// Cadastros
import TelaCadastroEquipe          from "./features/cadastros/TelaCadastroEquipe";
import TelaCadastroOrganizador     from "./features/cadastros/TelaCadastroOrganizador";
import TelaCadastroAtletaLogin     from "./features/cadastros/TelaCadastroAtletaLogin";
// Gestão
import TelaFuncionarios            from "./features/gestao/TelaFuncionarios";
import TelaTreinadores             from "./features/gestao/TelaTreinadores";
import TelaCadastrarAtleta         from "./features/gestao/TelaCadastrarAtleta";
import TelaEditarAtleta            from "./features/gestao/TelaEditarAtleta";
// Utilitários
import TelaImportarAtletas         from "./features/utilidades/TelaImportarAtletas";
import TelaNumericaPeito           from "./features/utilidades/TelaNumericaPeito";
import TelaGestaoInscricoes        from "./features/utilidades/TelaGestaoInscricoes";
import TelaGerenciarMembros        from "./features/utilidades/TelaGerenciarMembros";
import TelaAuditoria               from "./features/utilidades/TelaAuditoria";

// Firebase — apenas auth (Firestore é usado internamente pelos hooks de storage)
import {
  db,
  doc,
  setDoc,
  onSnapshot,
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
} from "./firebase";

// Hooks de domínio (já existiam)
import { useResultados } from "./hooks/useResultados";
import { useInscricoes } from "./hooks/useInscricoes";
import { useAtletas }    from "./hooks/useAtletas";
import { useEquipes }    from "./hooks/useEquipes";

// ── Infraestrutura extraída — Etapa 1 ──────────────────────────────
import { useLocalStorage } from "./lib/storage/useLocalStorage";
import { useLocalOnly }    from "./lib/storage/useLocalOnly";
import { useStorageSync }  from "./lib/storage/useStorageSync";

// Migração de dados legados (executa imediatamente ao importar)
import "./lib/migration/migrarDadosLegacy";

// SheetJS for Excel file handling - will be loaded via script tag in HTML

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────────
function App() {
  const [tela, _setTela] = useState("home");

  const [usuarioLogado, setUsuarioLogado] = useLocalOnly("atl_usuario", null);
  const [auditoria, setAuditoria] = useLocalStorage("atl_auditoria", []);
  const [organizadores, setOrganizadores] = useLocalStorage("atl_organizadores", []);
  const [atletasUsuarios, setAtletasUsuarios] = useLocalStorage("atl_atletas_usuarios", []);
  const [funcionarios,       setFuncionarios]       = useLocalStorage("atl_funcionarios",    []);
  const [treinadores,        setTreinadores]        = useLocalStorage("atl_treinadores",    []); // treinadores vinculados a equipes
  const [solicitacoesVinculo, setSolicitacoesVinculo] = useLocalStorage("atl_vinculo_sol",   []);
  useStorageSync("atl_vinculo_sol", setSolicitacoesVinculo);
  const [notificacoes,        setNotificacoes]        = useLocalStorage("atl_notificacoes", []);
  const [historicoAcoes,  setHistoricoAcoes]  = useLocalOnly("atl_historico",       []);
  const [solicitacoesRecuperacao, setSolicitacoesRecuperacao] = useLocalStorage("atl_recuperacao", []);

  // Multi-evento: cada evento tem { id, nome, data, local, permissividadeNorma, provasPrograma: Set de provaIds }
  const [eventos, setEventos] = useLocalStorage("atl_eventos", []);
  const [recordes, setRecordes] = useLocalStorage("atl_recordes", []);
  const [pendenciasRecorde, setPendenciasRecorde] = useLocalStorage("atl_pendencias_recorde", []);
  const [historicoRecordes, setHistoricoRecordes] = useLocalOnly("atl_historico_recordes", []);
  const [eventoAtualId, setEventoAtualId] = useLocalOnly("atl_eventoAtualId", null);

  // Inscrições e resultados vinculados ao eventoId
  const [numeracaoPeito, setNumeracaoPeito] = useLocalStorage("atl_numeracao_peito", {}); // { eventoId: { atletaId: numero } }

  // ── GERENTRACK Branding ──
  const [siteBranding, setSiteBranding] = useLocalStorage("gt_branding", {
    icon: "", // empty = use default GT_DEFAULT_ICON
    logo: "", // empty = use default GT_DEFAULT_LOGO
    nome: "GERENTRACK",
    slogan: "COMPETIÇÃO COM PRECISÃO",
  });
  const gtIcon = siteBranding.icon || GT_DEFAULT_ICON;
  const gtLogo = siteBranding.logo || GT_DEFAULT_LOGO;
  const gtNome = siteBranding.nome || "GERENTRACK";
  const gtSlogan = siteBranding.slogan || "COMPETIÇÃO COM PRECISÃO";

  const eventoAtual = eventos.find((e) => e.id === eventoAtualId) || null;

  // ── Multi-Organizador: perfis disponíveis após login ──
  const [perfisDisponiveis, setPerfisDisponiveis] = useLocalOnly("atl_perfis_disponiveis", []);

  // ── Admin Config (synced via Firestore) ──
  const [adminConfig, setAdminConfig] = useLocalStorage("gt_admin_config", {
    email: "gerentrack@gmail.com",
    nome: "Administrador",
    senha: "admin123"
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
        senha: oldS || prev.senha,
      }));
      localStorage.removeItem("gerentrack_admin_email");
      localStorage.removeItem("gerentrack_admin_nome");
      localStorage.removeItem("gerentrack_admin_senha");
    }
  }, []);

  // ── Hash-based routing ──
  const eventoAtualIdRef = useRef(eventoAtualId);
  eventoAtualIdRef.current = eventoAtualId;

  const setTela = useCallback((novaTela) => {
    _setTela(novaTela);
    const evtId = eventoAtualIdRef.current;
    let hash = "";
    if (novaTela === "evento-detalhe" && evtId) hash = `#/competicao/${evtId}`;
    else if (novaTela === "resultados" && evtId) hash = `#/competicao/${evtId}/resultados`;
    else if (novaTela === "recordes") hash = "#/recordes";
    else if (novaTela === "login") hash = "#/entrar";
    else if (novaTela === "home") hash = "#/";
    if (hash) window.history.replaceState(null, "", hash);
  }, []);

  // Ler hash na inicialização (apenas uma vez quando eventos carregam)
  const hashProcessado = useRef(false);
  useEffect(() => {
    if (hashProcessado.current) return;
    if (eventos.length === 0) return; // esperar Firestore carregar
    hashProcessado.current = true;
    const hash = window.location.hash;
    if (!hash || hash === "#/") return;
    const matchResultados = hash.match(/^#\/competicao\/(.+)\/resultados$/);
    if (matchResultados) {
      const evtId = matchResultados[1];
      const existe = eventos.find(e => e.id === evtId);
      if (existe) {
        setEventoAtualId(evtId);
        _setTela("resultados");
      }
      return;
    }
    const match = hash.match(/^#\/competicao\/(.+)$/);
    if (match) {
      const evtId = match[1];
      const existe = eventos.find(e => e.id === evtId);
      if (existe) {
        setEventoAtualId(evtId);
        _setTela("evento-detalhe");
      }
      return;
    }
    if (hash === "#/recordes") { _setTela("recordes"); return; }
    if (hash === "#/entrar") { _setTela("login"); return; }
  }, [eventos.length]);

  const login = (dados) => {
    setUsuarioLogado(dados);
    registrarAcao(dados.id, dados.nome, "Login", `${dados.tipo}`, dados.organizadorId || null, { equipeId: dados.equipeId, modulo: "auth" });
    if (dados.tipo === "admin")             setTela("admin");
    else if (dados.tipo === "atleta")       setTela("painel-atleta");
    else if (dados.tipo === "organizador")  setTela("painel-organizador");
    else if (dados.tipo === "funcionario")  setTela("painel-organizador");
    else if (dados.tipo === "equipe")       { setEventoAtualId(null); setTela("painel-equipe"); }
    else if (dados.tipo === "treinador")    { setEventoAtualId(null); setTela("painel-equipe"); }
    else                                    { console.warn("[GerenTrack] tipo de usuário desconhecido:", dados.tipo); setTela("home"); }
  };

  const loginComSelecao = (dados, perfis) => {
    setPerfisDisponiveis(perfis);
    setUsuarioLogado({ ...dados, _temOutrosPerfis: perfis.length > 1 });
    if (dados.senhaTemporaria) { setTela("trocar-senha"); return; }
    if (dados.tipo === "admin")             setTela("admin");
    else if (dados.tipo === "atleta")       setTela("painel-atleta");
    else if (dados.tipo === "organizador")  setTela("painel-organizador");
    else if (dados.tipo === "funcionario")  setTela("painel-organizador");
    else if (dados.tipo === "equipe")       { setEventoAtualId(null); setTela("painel-equipe"); }
    else if (dados.tipo === "treinador")    { setEventoAtualId(null); setTela("painel-equipe"); }
    else                                    { console.warn("[GerenTrack] tipo de usuário desconhecido:", dados.tipo); setTela("home"); }
  };

  const logout = () => {
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Logout", usuarioLogado.tipo || "", usuarioLogado.organizadorId || null, { equipeId: usuarioLogado.equipeId, modulo: "auth" });
    firebaseSignOut(auth).catch(() => {});
    setUsuarioLogado(null);
    setPerfisDisponiveis([]);
    setTela("home");
  };

  const adicionarEquipe   = (t) => _adicionarEquipe(t);
  
  // ── CRUD Equipes ──────────────────────────────────────────────────
  const adicionarEquipeFiliada     = (eq) => {
    _adicionarEquipe(eq);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Cadastrou equipe", eq.nome || "", usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "equipes" });
  };
  const editarEquipeFiliada        = async (eq) => {
    await _atualizarEquipe(eq);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Editou equipe", eq.nome || "", usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "equipes" });
  };
  // ── Exclusão de Usuários (Admin) ──────────────────────────────────────────
  const excluirOrganizador = (id) => {
    if (!window.confirm("⚠️ Excluir este organizador?\n\nEsta ação é IRREVERSÍVEL!")) return;
    setOrganizadores((p) => p.filter(o => o.id !== id));
  };
  
    const atualizarEquipe = async (equipeatualizada) => {
    await _atualizarEquipe(equipeatualizada);
  };

  const excluirEquipeUsuario = (id) => {
    const equipe = equipes.find(e => e.id === id);
    const nomeEquipe = equipe?.nome || "esta equipe";
    const atletasVinculados = atletas.filter(a => a.clube === equipe?.nome || a.equipeId === id);
    const nAtletas = atletasVinculados.length;
    const msg = `⚠️ Excluir equipe "${nomeEquipe}"?\n\n` +
      (nAtletas > 0 ? `⚠️ ${nAtletas} atleta(s) vinculado(s) também serão excluídos!\n\n` : "") +
      `Esta ação é IRREVERSÍVEL!`;
    if (!window.confirm(msg)) return;
    excluirEquipePorId(id);
    if (nAtletas > 0) {
      const idsAtletas = new Set(atletasVinculados.map(a => a.id));
      excluirAtletasPorIds(idsAtletas);
      setAtletasUsuarios((p) => p.filter(a => !(a.equipeId === id)));
      excluirInscricoesPorAtletas(idsAtletas);
    }
  };

  
  
  
  const excluirAtletaUsuario = (id) => {
    if (!window.confirm("⚠️ Excluir este atleta usuário?\n\nEsta ação é IRREVERSÍVEL!")) return;
    setAtletasUsuarios((p) => p.filter(a => a.id !== id));
  };
  
  const excluirEquipeFiliada       = (id) => {
    const equipe = equipes.find(e => e.id === id);
    const nomeEquipe = equipe?.nome || "esta equipe";
    const atletasVinculados = atletas.filter(a => a.clube === equipe?.nome || a.equipeId === id);
    const nAtletas = atletasVinculados.length;
    
    const msg = `⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\n` +
      `Excluir equipe "${nomeEquipe}"?\n\n` +
      (nAtletas > 0 ? `⚠️ ${nAtletas} atleta(s) vinculado(s) também serão excluídos!\n\n` : "") +
      `Deseja realmente continuar?`;
    
    if (!window.confirm(msg)) return;
    excluirEquipePorId(id);
    // Remover atletas vinculados à equipe
    if (nAtletas > 0) {
      const idsAtletas = new Set(atletasVinculados.map(a => a.id));
      excluirAtletasPorIds(idsAtletas);
      // Remover contas de atletas-usuários vinculados
      setAtletasUsuarios((p) => p.filter(a => !(a.equipeId === id)));
      // Remover inscrições desses atletas
      excluirInscricoesPorAtletas(idsAtletas);
    }
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Excluiu equipe", `${nomeEquipe} (${nAtletas} atletas removidos)`, usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "equipes" });
  };
  
  // Gera senha aleatória 8 chars: letras maiúsculas + dígitos
  const gerarSenhaTemp = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  // Aplica senha temporária num usuário de qualquer store (com sync por CPF/CNPJ)
  const aplicarSenhaTemp = async (tipo, userId, senhaTemp, solicitacao) => {
    const upd = arr => arr.map(u => u.id === userId ? {...u, senha: senhaTemp, senhaTemporaria: true} : u);
    if (tipo === "equipe")      atualizarCamposEquipe(userId, { senha: senhaTemp, senhaTemporaria: true });
    if (tipo === "organizador") setOrganizadores(upd);
    if (tipo === "funcionario") setFuncionarios(upd);
    if (tipo === "treinador")   setTreinadores(upd);

    if (tipo === "atleta" || tipo === "atleta_cpf") {
      // Verificar se existe entrada em atletasUsuarios
      const existente = atletasUsuarios.find(u => u.id === userId);
      if (existente) {
        // Já existe — só atualizar senha
        setAtletasUsuarios(upd);
      } else {
        // Não existe: buscar dados do atleta base para criar entrada
        const atletaBase = atletas.find(a => a.id === userId);
        if (atletaBase) {
          const emailFinal = solicitacao?.email || atletaBase.email || "";
          const novoUsuario = {
            id: userId,
            tipo: "atleta",
            nome: atletaBase.nome || "",
            email: emailFinal,
            cpf: atletaBase.cpf || "",
            dataNasc: atletaBase.dataNasc || "",
            anoNasc: atletaBase.anoNasc || "",
            sexo: atletaBase.sexo || "",
            clube: atletaBase.clube || "",
            equipeId: atletaBase.equipeId || null,
            organizadorId: atletaBase.organizadorId || null,
            senha: senhaTemp,
            senhaTemporaria: true,
            status: "ativo",
            dataCadastro: new Date().toISOString(),
            criadoPorSenhaTemp: true,
          };
          setAtletasUsuarios(prev => {
            // Evitar duplicata
            if (prev.some(u => u.id === userId)) return prev.map(u => u.id === userId ? {...u, senha: senhaTemp, senhaTemporaria: true} : u);
            return [...prev, novoUsuario];
          });
          // Criar conta no Firebase Auth se o atleta tiver email
          // Email: prioriza o da solicitação (informado pelo atleta), fallback para o base
          const emailAuth = (solicitacao?.email || atletaBase.email || "").trim();
          if (emailAuth) {
            try {
              await createUserWithEmailAndPassword(auth, emailAuth, senhaTemp);
              await firebaseSignOut(auth).catch(() => {});
            } catch (authErr) {
              if (authErr.code === "auth/email-already-in-use") {
              }
            }
          } else {
          }
          // Persistir email no atleta base se ainda não tiver
          if (solicitacao?.email && atletaBase && !atletaBase.email) {
            _atualizarAtleta({ ...atletaBase, email: solicitacao.email });
          }
        } else {
          // Atleta base não encontrado — aplica normalmente (pode ser userId de outra solicitação)
          setAtletasUsuarios(upd);
        }
      }
    }

    const stores = { equipe: equipesRef.current, organizador: organizadores, atleta: atletasUsuarios, funcionario: funcionarios, treinador: treinadores };
    const registro = (stores[tipo] || []).find(u => u.id === userId);
    const usaCnpj = tipo === "equipe" || tipo === "organizador";
    const docId = usaCnpj ? registro?.cnpj?.replace(/\D/g, '') : registro?.cpf?.replace(/\D/g, '');
    const docMinLen = usaCnpj ? 14 : 11;
    if (docId && docId.length >= docMinLen) {
      if (usaCnpj) {
        atualizarSenhaEquipes(docId, senhaTemp, true);
      } else {
        const sincronizar = (arr, setter, tipoAtual) => {
          if (tipoAtual === tipo) return;
          const tipoUsaCnpj = tipoAtual === "equipe" || tipoAtual === "organizador";
          if (tipoUsaCnpj !== usaCnpj) return;
          const campo = "cpf";
          const temMatch = arr.some(i => i[campo] && i[campo].replace(/\D/g, '') === docId && i.id !== userId);
          if (temMatch) setter(prev => prev.map(i => i[campo] && i[campo].replace(/\D/g, '') === docId ? { ...i, senha: senhaTemp, senhaTemporaria: true } : i));
        };
        sincronizar(organizadores, setOrganizadores, "organizador");
        sincronizar(atletasUsuarios, setAtletasUsuarios, "atleta");
        sincronizar(funcionarios, setFuncionarios, "funcionario");
        sincronizar(treinadores, setTreinadores, "treinador");
      }
    }
  };

  const adicionarSolicitacaoRecuperacao = (sol) =>
    setSolicitacoesRecuperacao(p => [...p, {...sol, id: Date.now().toString(), data: new Date().toISOString()}]);
  const resolverSolicitacaoRecuperacao = (id) =>
    setSolicitacoesRecuperacao(p => p.map(s => s.id === id ? {...s, status:"resolvido"} : s));
  const atualizarSenha = async (tipo, userId, novaSenha) => {
    if (tipo === "admin") {
      setAdminConfig(prev => ({ ...prev, senha: novaSenha }));
      setUsuarioLogado(u => u ? {...u, senhaTemporaria: false} : u);
      return;
    }
    const upd = arr => arr.map(u => u.id === userId ? { ...u, senha: novaSenha, senhaTemporaria: false } : u);
    if (tipo === "equipe")      atualizarCamposEquipe(userId, { senha: novaSenha, senhaTemporaria: false });
    if (tipo === "organizador") setOrganizadores(upd);
    if (tipo === "atleta")      setAtletasUsuarios(upd);
    if (tipo === "funcionario") setFuncionarios(upd);
    if (tipo === "treinador")   setTreinadores(upd);

    const stores = { equipe: equipesRef.current, organizador: organizadores, atleta: atletasUsuarios, funcionario: funcionarios, treinador: treinadores };
    const registro = (stores[tipo] || []).find(u => u.id === userId);
    const usaCnpj = tipo === "equipe" || tipo === "organizador";
    const docId = usaCnpj ? registro?.cnpj?.replace(/\D/g, '') : registro?.cpf?.replace(/\D/g, '');
    const docMinLen = usaCnpj ? 14 : 11;
    if (docId && docId.length >= docMinLen) {
      if (usaCnpj) {
        atualizarSenhaEquipes(docId, novaSenha, false);
      } else {
        const sincronizar = (arr, setter, tipoAtual) => {
          if (tipoAtual === tipo) return;
          const tipoUsaCnpj = tipoAtual === "equipe" || tipoAtual === "organizador";
          if (tipoUsaCnpj !== usaCnpj) return;
          const campo = "cpf";
          const temMatch = arr.some(i => i[campo] && i[campo].replace(/\D/g, '') === docId && i.id !== userId);
          if (temMatch) setter(prev => prev.map(i => i[campo] && i[campo].replace(/\D/g, '') === docId ? { ...i, senha: novaSenha, senhaTemporaria: false } : i));
        };
        sincronizar(organizadores, setOrganizadores, "organizador");
        sincronizar(atletasUsuarios, setAtletasUsuarios, "atleta");
        sincronizar(funcionarios, setFuncionarios, "funcionario");
        sincronizar(treinadores, setTreinadores, "treinador");
      }
    }
    setUsuarioLogado(u => u ? {...u, senhaTemporaria: false} : u);
    try {
      const currentUser = auth.currentUser;
      if (currentUser && novaSenha) await updatePassword(currentUser, novaSenha);
    } catch(e) { /* senha Firebase Auth opcional */ }
  };

  const adicionarOrganizador  = (o) => setOrganizadores((p) => [...p, o]);
  const editarOrganizadorAdmin = (o) => setOrganizadores((p) => p.map(x => x.id === o.id ? { ...x, ...o } : x));
  const editarEquipeAdmin      = (eq) => mergeEquipe(eq);
  const editarAtletaUsuarioAdmin = (au) => {
    setAtletasUsuarios((p) => p.map(x => x.id === au.id ? { ...x, ...au } : x));
    // Sincroniza campos básicos no registro base de atleta vinculado
    atletasRef_app.current.forEach(a => {
      if (a.atletaUsuarioId !== au.id && !(a.email && au.email && a.email.toLowerCase() === au.email.toLowerCase())) return;
      _atualizarAtleta({ ...a, nome: au.nome || a.nome, email: au.email || a.email, cpf: au.cpf || a.cpf, fone: au.fone || a.fone, dataNasc: au.dataNasc || a.dataNasc, anoNasc: au.dataNasc ? au.dataNasc.split("-")[0] : a.anoNasc, sexo: au.sexo || a.sexo, organizadorId: au.organizadorId || a.organizadorId });
    });
  };
  const adicionarFuncionario  = (f) => setFuncionarios((p) => [...p, f]);
  const atualizarFuncionario  = (f) => setFuncionarios((p) => p.map(x => x.id === f.id ? f : x));
  const removerFuncionario    = (id) => {
    const func = funcionarios.find(f => f.id === id);
    const nomeFuncionario = func?.nome || "este funcionário";
    
    if (!window.confirm(`⚠️ Remover "${nomeFuncionario}"?\n\nEsta ação é IRREVERSÍVEL e o funcionário perderá acesso ao sistema.`)) return;
    
    setFuncionarios((p) => p.filter(x => x.id !== id));
  };

  // ── CRUD Treinadores (vinculados a equipes) ─────────────────────────────────
  const adicionarTreinador   = (t) => setTreinadores((p) => [...p, t]);
  const atualizarTreinador   = (t) => setTreinadores((p) => p.map(x => x.id === t.id ? t : x));
  const removerTreinador     = (id) => {
    const trein = treinadores.find(t => t.id === id);
    if (!window.confirm(`⚠️ Remover "${trein?.nome || "este treinador"}"?\n\nEsta ação é IRREVERSÍVEL.`)) return;
    setTreinadores((p) => p.filter(x => x.id !== id));
  };
  const registrarAcao = (usuarioId, nomeUsuario, acao, detalhe = "", organizadorId = null, extra = {}) =>
    setHistoricoAcoes(p => [{
      id: Date.now().toString(), usuarioId, nomeUsuario, acao, detalhe, organizadorId,
      data: new Date().toISOString(), ...extra
    }, ...p].slice(0, 2000)); // keep last 2000
  const aprovarOrganizador  = (id) => {
    setOrganizadores((p) => p.map(o => o.id===id ? {...o, status:"aprovado"} : o));
    const org = organizadores.find(o => o.id === id);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Aprovou organizador", org?.nome || id, null, { modulo: "sistema" });
  };
  const recusarOrganizador  = (id) => {
    setOrganizadores((p) => p.map(o => o.id===id ? {...o, status:"recusado"} : o));
    const org = organizadores.find(o => o.id === id);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Recusou organizador", org?.nome || id, null, { modulo: "sistema" });
  };
  const aprovarEvento       = (id) => {
    const hoje = new Date().toISOString().slice(0, 10);
    setEventos((p) => p.map(e => {
      if (e.id !== id) return e;
      const aindaNaoAbriu = e.dataAberturaInscricoes && hoje < e.dataAberturaInscricoes;
      return { ...e, statusAprovacao: "aprovado", inscricoesEncerradas: aindaNaoAbriu ? true : false };
    }));
    const ev = eventos.find(e => e.id === id);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Aprovou competição", ev?.nome || id, null, { modulo: "sistema" });
  };
  const recusarEvento       = (id) => {
    setEventos((p) => p.map(e => e.id===id ? {...e, statusAprovacao:"recusado"} : e));
    const ev = eventos.find(e => e.id === id);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Recusou competição", ev?.nome || id, null, { modulo: "sistema" });
  };
  const adicionarAtletaUsuario = (u) => setAtletasUsuarios((p) => [...p, u]);
  const atualizarAtletaUsuario = (u) => setAtletasUsuarios((p) => p.map(x => x.id === u.id ? u : x));
  const adicionarAtleta  = (a) => {
    _adicionarAtleta(a);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Cadastrou atleta", a.nome || "", usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "atletas" });
  };
  const adicionarAtletasEmLote = async (lista) => {
    await _adicionarAtletasEmLote(lista);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Importou atletas em lote", `${lista.length} atleta(s)`, usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "atletas" });
  };
  const atualizarAtleta  = (a) => {
    _atualizarAtleta(a);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Editou atleta", a.nome || "", usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId, modulo: "atletas" });
  };

  // origem: "atleta" (atleta pede para equipe) | "equipe" (equipe pede ao atleta ou à equipe atual)
  // aprovadorTipo: "atleta" | "equipe_atual"
  // equipeAtualId: equipe atual do atleta (se houver) — precisa aprovar a transferência
  const solicitarVinculo = (atletaId, atletaNome, equipeId, clube, opts = {}) =>
    setSolicitacoesVinculo(p => [
      ...p.filter(s => !(s.atletaId === atletaId && s.status === "pendente")),
      { id: Date.now().toString(), atletaId, atletaNome, equipeId, clube,
        origem: opts.origem || "atleta",
        aprovadorTipo: opts.aprovadorTipo || "equipe",
        equipeAtualId: opts.equipeAtualId || null,
        equipeAtualNome: opts.equipeAtualNome || null,
        organizadorId: opts.organizadorId || null,
        solicitanteId: opts.solicitanteId || null,
        solicitanteNome: opts.solicitanteNome || null,
        status: "pendente", data: new Date().toISOString() }
    ]);

  const responderVinculo = (solId, aceitar, atletas_arr) => {
    const sol = solicitacoesVinculo.find(s => s.id === solId);
    if (!sol) return;
    const agora = new Date().toISOString();
    setSolicitacoesVinculo(p => p.map(s => s.id === solId
      ? { ...s,
          status: aceitar ? "aceito" : "recusado",
          resolvidoEm: agora,
          resolvidoPorId: usuarioLogado?.id || null,
          resolvidoPorNome: usuarioLogado?.nome || null,
          resolvidoPorTipo: usuarioLogado?.tipo || null,
        } : s));

    const atv = atletasRef_app.current.find(a => a.id === sol.atletaId);

    if (sol.tipo === "desvinculacao") {
      // ── Desvinculação solicitada pelo atleta ────────────────────────────────────────────
      if (aceitar) {
        const equipeAnterior = atv?.clube || sol.clube || "";
        if (atv) _atualizarAtleta({ ...atv, equipeId: null, clube: "", equipeAnterior, desvinculadoEm: agora });
        const contaAtl = atletasUsuarios.find(u =>
          u.id === atv?.atletaUsuarioId ||
          (u.cpf && atv?.cpf && u.cpf.replace(/\D/g,"") === atv.cpf.replace(/\D/g,"")));
        if (contaAtl) adicionarNotificacao(contaAtl.id, "desvinculacao",
          `✅ Sua solicitação de saída da equipe "${equipeAnterior}" foi aceita. Seus resultados e inscrições históricas permanecem preservados.`,
          { equipeAnterior });
      } else {
        const contaAtl = atv && atletasUsuarios.find(u =>
          u.id === atv.atletaUsuarioId ||
          (u.cpf && atv.cpf && u.cpf.replace(/\D/g,"") === atv.cpf.replace(/\D/g,"")));
        if (contaAtl) adicionarNotificacao(contaAtl.id, "desvinculacao",
          `ℹ️ Sua solicitação de saída da equipe "${sol.clube || ""}" foi recusada. Entre em contato com a equipe se tiver dúvidas.`, {});
      }
      if (usuarioLogado) registrarAcao(
        usuarioLogado.id, usuarioLogado.nome,
        aceitar ? "Aprovou desvinculação" : "Recusou desvinculação",
        `${sol.atletaNome} ← ${sol.clube || "—"}`,
        usuarioLogado.organizadorId || null, { equipeId: usuarioLogado.equipeId, modulo: "vinculos" });
    } else {
      // ── Vínculo normal ────────────────────────────────────────────────────────────────────────────────────
      if (aceitar && atv) _atualizarAtleta({ ...atv, equipeId: sol.equipeId, clube: sol.clube });
      if (usuarioLogado) registrarAcao(
        usuarioLogado.id, usuarioLogado.nome,
        aceitar ? "Aceitou vínculo" : "Recusou vínculo",
        `${sol.atletaNome} → ${sol.clube || "—"}`,
        usuarioLogado.organizadorId || (usuarioLogado.tipo === "organizador" ? usuarioLogado.id : null),
        { equipeId: usuarioLogado.equipeId, modulo: "vinculos" });
    }
  };

  // ── ETAPA 6: Solicitar desvinculação (atleta pede para sair da equipe) ───
  const solicitarDesvinculo = (atletaId, atletaNome, equipeId, equipeNome) => {
    setSolicitacoesVinculo(p => [
      ...p.filter(s => !(s.atletaId === atletaId && s.tipo === "desvinculacao" && s.status === "pendente")),
      {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        atletaId, atletaNome, equipeId, clube: equipeNome,
        tipo: "desvinculacao", origem: "atleta", aprovadorTipo: "equipe",
        equipeAtualId: equipeId, status: "pendente", data: new Date().toISOString(),
      }
    ]);
  };

  // ── ETAPA 6: Anonimizar atleta base (preserva histórico, remove PII) ─────
  const anonimizarAtletaBase = (atletaId) => {
    const a = atletasRef_app.current.find(x => x.id === atletaId);
    if (!a || a.contaExcluida) return;
    _atualizarAtleta({
      id: a.id, sexo: a.sexo, anoNasc: a.anoNasc,
      equipeId: a.equipeId, equipeAnterior: a.equipeAnterior || a.clube,
      clube: a.clube, organizadorId: a.organizadorId,
      nome: "Atleta Excluído", email: null, cpf: null, fone: null,
      dataNasc: null, atletaUsuarioId: null,
      contaExcluida: true, excluidoEm: new Date().toISOString(),
    });
  };

  // ── ETAPA 6: Excluir apenas o perfil atual (preserva atleta base + outros perfis) ─
  const excluirPerfilAtual = () => {
    const u = usuarioLogado;
    if (!u) return;
    if (u.tipo === "atleta")      setAtletasUsuarios(p => p.filter(x => x.id !== u.id));
    if (u.tipo === "organizador") setOrganizadores(p => p.filter(x => x.id !== u.id));
    if (u.tipo === "funcionario") setFuncionarios(p => p.filter(x => x.id !== u.id));
    if (u.tipo === "treinador")   setTreinadores(p => p.filter(x => x.id !== u.id));
    if (u.tipo === "equipe")      excluirEquipePorId(u.id);
    registrarAcao(u.id, u.nome, "Excluiu perfil específico",
      `Tipo: ${u.tipo} | Org: ${u.organizadorId || u._organizadorNome || "—"}`,
      null, { modulo: "conta" });
    logout();
  };

  // ── ETAPA 6: Excluir TODOS os perfis + anonimizar atleta base ────────────
  const excluirTodosOsPerfis = () => {
    const u = usuarioLogado;
    if (!u) return;
    const cpf   = u.cpf?.replace(/\D/g, "");
    const email = u.email?.toLowerCase();
    const match = (x) =>
      x.id === u.id ||
      (cpf   && x.cpf?.replace(/\D/g, "")  === cpf)  ||
      (email && x.email?.toLowerCase()       === email);
    setAtletasUsuarios(p => p.filter(x => !match(x)));
    setOrganizadores  (p => p.filter(x => !match(x)));
    setFuncionarios   (p => p.filter(x => !match(x)));
    setTreinadores    (p => p.filter(x => !match(x)));
    // Se o perfil atual é uma equipe, remover o documento da equipe no Firestore
    if (u.tipo === "equipe") excluirEquipePorId(u.id);
    const atletaBase = atletasRef_app.current.find(a =>
      a.atletaUsuarioId === u.id ||
      (cpf   && a.cpf?.replace(/\D/g, "") === cpf) ||
      (email && a.email?.toLowerCase()     === email));
    if (atletaBase) anonimizarAtletaBase(atletaBase.id);
    registrarAcao(u.id, u.nome, "Excluiu todos os perfis e anonimizou dados",
      `CPF: ***${cpf?.slice(-3) || "?"}`, null, { modulo: "conta" });
    logout();
  };

  const adicionarNotificacao = (para, tipo, msg, extra = {}) =>
    setNotificacoes(p => [{
      id: Date.now().toString() + Math.random().toString(36).slice(2,6),
      para, tipo, msg, data: new Date().toISOString(), lida: false, ...extra
    }, ...p]);

  const marcarNotifLida = (id) =>
    setNotificacoes(p => p.map(n => n.id === id ? {...n, lida: true} : n));

  const excluirAtleta = (atletaId) => {
    const atleta = atletas.find(a => a.id === atletaId);
    const nomeAtleta = atleta?.nome || "este atleta";
    
    if (!window.confirm(`⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nExcluir "${nomeAtleta}"?\n\nO cadastro será removido permanentemente.\nInscrições e resultados serão mantidos como snapshots.`)) return;
    
    _excluirAtletaInterno(atletaId);
  };

  const _excluirAtletaInterno = (atletaId) => {
    const atleta = atletas.find(a => a.id === atletaId);
    const nomeAtleta = atleta?.nome || "atleta";
    excluirAtletaPorId(atletaId);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Excluiu atleta", nomeAtleta, usuarioLogado.organizadorId || null, { equipeId: usuarioLogado.equipeId, modulo: "atletas" });
    if (atleta) {
      setAtletasUsuarios(p => p.filter(u => {
        if (atleta.atletaUsuarioId && u.id === atleta.atletaUsuarioId) return false;
        if (atleta.email && u.email && u.email.toLowerCase() === atleta.email.toLowerCase()) return false;
        if (atleta.cpf && u.cpf && u.cpf.replace(/\D/g,"") === atleta.cpf.replace(/\D/g,"")) return false;
        return true;
      }));
    }
  };

  const excluirAtletasEmMassa = (ids) => {
    const idsSet = ids instanceof Set ? ids : new Set(ids);
    const atletasRemovidos = atletas.filter(a => idsSet.has(a.id));
    excluirAtletasPorIds(idsSet);
    // Remover contas de usuario vinculadas
    const emailsRem = new Set();
    const cpfsRem = new Set();
    const userIdsRem = new Set();
    atletasRemovidos.forEach(a => {
      if (a.atletaUsuarioId) userIdsRem.add(a.atletaUsuarioId);
      if (a.email) emailsRem.add(a.email.toLowerCase());
      if (a.cpf) cpfsRem.add(a.cpf.replace(/\D/g, ""));
    });
    setAtletasUsuarios(p => p.filter(u => {
      if (userIdsRem.has(u.id)) return false;
      if (u.email && emailsRem.has(u.email.toLowerCase())) return false;
      if (u.cpf && cpfsRem.has(u.cpf.replace(/\D/g, ""))) return false;
      return true;
    }));
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Excluiu atletas em massa", `${idsSet.size} atleta(s)`, usuarioLogado.organizadorId || null, { modulo: "atletas" });
  };

  const desvincularAtleta = (atletaId) => {
    const atleta = atletas.find(a => a.id === atletaId);
    const equipeAnterior = atleta?.clube || "";
    const atletaDesv = atletasRef_app.current.find(a => a.id === atletaId);
    if (atletaDesv) _atualizarAtleta({ ...atletaDesv, equipeId: null, clube: "", equipeAnterior, desvinculadoEm: new Date().toISOString() });
    // Notifica o atleta se tiver conta própria
    const contaAtleta = atletasUsuarios.find(u =>
      u.cpf && atleta?.cpf && u.cpf.replace(/\D/g,"") === atleta.cpf.replace(/\D/g,""));
    if (contaAtleta) {
      adicionarNotificacao(contaAtleta.id, "desvinculacao",
        `Você foi desvinculado${equipeAnterior ? ` da equipe ${equipeAnterior}` : ""}.` +
        ` Seus resultados anteriores permanecem registrados em nome da equipe.`,
        { equipeAnterior }
      );
    }
  };

  
  // ═══════════════════════════════════════════════════════════════════════════
  // MIGRAÇÃO: TREINADOR → EQUIPE
  // ═══════════════════════════════════════════════════════════════════════════
  
    

  const adicionarEvento = (ev, usuarioLogadoParam) => {
    const hoje = new Date().toISOString().slice(0, 10);
    // Determinar se inscrições devem começar encerradas
    const temAberturaFutura = ev.dataAberturaInscricoes && ev.dataAberturaInscricoes > hoje;
    const orgPendente = usuarioLogadoParam?.tipo === "organizador";
    
    const novo = {
      ...ev,
      id: Date.now().toString(),
      organizadorId: orgPendente ? usuarioLogadoParam.id : (ev.organizadorId || null),
      statusAprovacao: orgPendente ? "pendente" : "aprovado",
      // Inscrições fechadas se: org pendente, ou tem data de abertura futura
      inscricoesEncerradas: orgPendente || temAberturaFutura ? true : (ev.inscricoesEncerradas ?? false),
    };
    setEventos((p) => [...p, novo]);
    const usr = usuarioLogadoParam || usuarioLogado;
    if (usr) registrarAcao(usr.id, usr.nome, "Criou competição", ev.nome || "", orgPendente ? usr.id : null, { equipeId: usr.equipeId, modulo: "competicoes" });
    return novo;
  };

  const editarEvento = (ev) => {
    setEventos((p) => p.map((e) => e.id === ev.id ? ev : e));
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Editou competição", ev.nome || "", usuarioLogado.organizadorId || usuarioLogado.id, { equipeId: usuarioLogado.equipeId, modulo: "competicoes" });
  };

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

  const atletasRef_app = React.useRef(atletas);
  React.useEffect(() => { atletasRef_app.current = atletas; }, [atletas]);

  const excluirAtletaPorUsuario = (id, usuario) => {
    const paraRemover = atletasRef_app.current.filter(a => {
      if (a.atletaUsuarioId === id) return true;
      if (a.email && usuario?.email && a.email.toLowerCase() === usuario.email.toLowerCase()) return true;
      if (a.cpf && usuario?.cpf && a.cpf.replace(/\D/g,"") === usuario.cpf.replace(/\D/g,"")) return true;
      return false;
    });
    const idsSet = new Set(paraRemover.map(a => a.id));
    if (idsSet.size > 0) excluirAtletasPorIds(idsSet);
  };

  // ── Resultados via Firestore ──────────────────────────────────────────────
  const {
    resultados,
    atualizarResultado,
    atualizarResultadosEmLote,
    limparResultado,
    limparTodosResultados,
    resetResultados,
    importarResultados,
  } = useResultados({ eventos, recordes, editarEvento });

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
  } = useInscricoes({ atletas, registrarAcao, usuarioLogado });

  const limparTodosDados = () => {
    if (!window.confirm("⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL e EXTREMAMENTE DESTRUTIVA!\n\nVocê está prestes a APAGAR TODOS OS DADOS do sistema:\n\n• Todas as competições\n• Todos os atletas\n• Todas as equipes\n• Todos os organizadores\n• Todas as inscrições\n• Todos os resultados\n• Todos os recordes\n• Todas as pendências de recorde\n• Todo o histórico\n\n⚠️ AS CONTAS DE LOGIN (Firebase Auth) NÃO SERÃO APAGADAS.\nOs usuários ainda conseguirão fazer login, mas sem perfil no sistema.\nPara apagar as contas de login, acesse o Console do Firebase manualmente.\n\nEsta ação NÃO PODE SER DESFEITA.\n\nDeseja realmente continuar?")) return;
    resetEquipes();
    setOrganizadores([]);
    setAtletasUsuarios([]);
    setSolicitacoesRecuperacao([]);
    setFuncionarios([]);
    setTreinadores([]);
    setHistoricoAcoes([]);
    setSolicitacoesVinculo([]);
    setNotificacoes([]);
    setAuditoria([]);
    resetEquipes();
    resetAtletas();
    setEventos([]);
    setEventoAtualId(null);
    resetInscricoes();
    resetResultados();
    setNumeracaoPeito({});
    setRecordes([]);
    setPendenciasRecorde([]);
    setHistoricoRecordes([]);
    setPerfisDisponiveis([]);
    setAdminConfig({ email: "gerentrack@gmail.com", nome: "Administrador", senha: "admin123" });
    registrarAcao(usuarioLogado?.id || "system", usuarioLogado?.nome || "Sistema", "Limpou todos os dados", "Reset completo do sistema", null, { modulo: "sistema" });
  };

  const exportarDados = () => {
    const dados = {
      versao: "1.1",
      exportadoEm: new Date().toISOString(),
      equipes, organizadores, atletasUsuarios, funcionarios, treinadores,
      atletas, eventos, inscricoes, resultados, numeracaoPeito,
      solicitacoesRecuperacao, historicoAcoes,
      recordes, pendenciasRecorde, historicoRecordes,
      auditoria, solicitacoesVinculo, notificacoes,
      siteBranding, perfisDisponiveis,
      adminConfig,
    };
    const json = JSON.stringify(dados, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `gerentrack-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Exportou backup", `${eventos.length} eventos, ${atletas.length} atletas, ${recordes.length} tipos recorde`, null, { modulo: "sistema" });
    alert("✅ Backup exportado com sucesso!\n\n⚠️ ATENÇÃO: O backup NÃO inclui as contas de login (Firebase Auth).\nAs senhas e e-mails de acesso dos usuários ficam no Firebase Authentication e não podem ser exportados pelo sistema.\nSe necessário, exporte-os manualmente pelo Console do Firebase.");
  };

  const importarDados = (arquivo) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dados = JSON.parse(e.target.result);
        if (!dados.versao) throw new Error("Arquivo inválido — não é um backup do sistema.");
        if (!window.confirm(
          `Importar backup de ${new Date(dados.exportadoEm).toLocaleString("pt-BR")}?\n\n` +
          `Isso SUBSTITUIRÁ todos os dados atuais:\n` +
          `• ${dados.eventos?.length||0} evento(s)\n` +
          `• ${dados.atletas?.length||0} atleta(s)\n` +
          `• ${dados.inscricoes?.length||0} inscrição(ões)\n` +
          `• ${dados.equipes?.length||0} equipe(s)\n` +
          `• ${dados.organizadores?.length||0} organizador(es)\n` +
          `• ${dados.recordes?.length||0} tipo(s) de recorde\n` +
          `• ${dados.pendenciasRecorde?.length||0} pendência(s) de recorde\n\n` +
          `Esta ação não pode ser desfeita.`
        )) return;
        if (dados.equipes)                 await importarEquipes(dados.equipes);
        if (dados.organizadores)           setOrganizadores(dados.organizadores);
        if (dados.atletasUsuarios)         setAtletasUsuarios(dados.atletasUsuarios);
        if (dados.funcionarios)            setFuncionarios(dados.funcionarios);
        if (dados.treinadores)             setTreinadores(dados.treinadores);
        if (dados.atletas)                 await importarAtletas(dados.atletas);
        if (dados.eventos)                 setEventos(dados.eventos);
        if (dados.inscricoes)              await importarInscricoes(dados.inscricoes);
        if (dados.resultados)              await importarResultados(dados.resultados);
        if (dados.numeracaoPeito)          setNumeracaoPeito(dados.numeracaoPeito);
        if (dados.solicitacoesRecuperacao) setSolicitacoesRecuperacao(dados.solicitacoesRecuperacao);
        if (dados.historicoAcoes)          setHistoricoAcoes(dados.historicoAcoes);
        if (dados.recordes)                setRecordes(dados.recordes);
        if (dados.pendenciasRecorde)       setPendenciasRecorde(dados.pendenciasRecorde);
        if (dados.historicoRecordes)       setHistoricoRecordes(dados.historicoRecordes);
        if (dados.auditoria)               setAuditoria(dados.auditoria);
        if (dados.solicitacoesVinculo)     setSolicitacoesVinculo(dados.solicitacoesVinculo);
        if (dados.notificacoes)            setNotificacoes(dados.notificacoes);
        if (dados.siteBranding)            setSiteBranding(dados.siteBranding);
        if (dados.perfisDisponiveis)       setPerfisDisponiveis(dados.perfisDisponiveis);
        if (dados.adminConfig) {
          setAdminConfig(dados.adminConfig);
        }
        setEventoAtualId(null);
        alert("✅ Backup importado com sucesso!");
        registrarAcao(usuarioLogado?.id || "system", usuarioLogado?.nome || "Sistema", "Importou backup", `v${dados.versao} de ${new Date(dados.exportadoEm).toLocaleString("pt-BR")}`, null, { modulo: "sistema" });
      } catch (err) {
        alert("❌ Erro ao importar: " + err.message);
      }
    };
    reader.readAsText(arquivo);
  };


  const alterarStatusEvento = (id, campos) => {
    setEventos((p) => p.map((e) => e.id === id ? { ...e, ...campos } : e));
    const nomeEv = eventos.find(e => e.id === id)?.nome || "";
    const detalhe = campos.competicaoFinalizada === true
      ? `${nomeEv} — Finalizou competição`
      : campos.competicaoFinalizada === false
        ? `${nomeEv} — Desbloqueou competição`
        : campos.inscricoesEncerradas != null
          ? `${nomeEv} — ${campos.inscricoesEncerradas ? "Encerrou inscrições" : "Abriu inscrições"}`
          : campos.sumulaLiberada != null
            ? `${nomeEv} — ${campos.sumulaLiberada ? "Liberou súmulas" : "Bloqueou súmulas"}`
            : nomeEv;
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Alterou status competição", detalhe, usuarioLogado.organizadorId || usuarioLogado.id, { equipeId: usuarioLogado.equipeId, modulo: "competicoes" });
  };

  // ── Auto-gestão de inscrições por data ─────────────────────────────────────
  useEffect(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    setEventos(prev => {
      let mudou = false;
      const atualizados = prev.map(ev => {
        if (ev.statusAprovacao && ev.statusAprovacao !== "aprovado") return ev;
        let novo = ev;
        // Auto-abrir: chegou na data+hora de abertura, inscrições estavam encerradas (não manualmente)
        const dtAbEv = _dtInscricoes(ev.dataAberturaInscricoes, ev.horaAberturaInscricoes);
        const dtEncEv = _dtInscricoes(ev.dataEncerramentoInscricoes, ev.horaEncerramentoInscricoes);
        const agora = new Date();
        if (dtAbEv && agora >= dtAbEv
            && ev.inscricoesEncerradas && !ev.inscricoesForceEncerradas) {
          novo = { ...novo, inscricoesEncerradas: false };
          mudou = true;
        }
        // Auto-encerrar: passou da data+hora de encerramento
        if (dtEncEv && agora > dtEncEv
            && !ev.inscricoesEncerradas) {
          novo = { ...novo, inscricoesEncerradas: true };
          mudou = true;
        }
        // Antes da data+hora de abertura: manter encerradas (competição futura)
        if (dtAbEv && agora < dtAbEv
            && !ev.inscricoesEncerradas && !ev.inscricoesForceAbertas) {
          novo = { ...novo, inscricoesEncerradas: true };
          mudou = true;
        }
        return novo;
      });
      return mudou ? atualizados : prev;
    });
  }, [eventos.length]); // roda ao montar e quando nº de eventos muda
  const excluirEvento = (id) => {
    const evento = eventos.find(e => e.id === id);
    const nomeEvento = evento?.nome || "esta competição";
    const nInscs = inscricoes.filter(i => i.eventoId === id).length;
    
    const msg = `⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\n` +
      `Você está prestes a excluir "${nomeEvento}".\n\n` +
      `Isso também excluirá:\n` +
      `• ${nInscs} inscrição(ões)\n` +
      `• Todos os resultados desta competição\n` +
      `• Todas as súmulas\n\n` +
      `Deseja realmente continuar?`;
    
    if (!window.confirm(msg)) return;
    
    setEventos((p) => p.filter((e) => e.id !== id));
    excluirInscricoesPorEvento(id);
    if (eventoAtualId === id) setEventoAtualId(null);
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Excluiu competição", `${nomeEvento} (${nInscs} inscrições removidas)`, usuarioLogado.organizadorId || usuarioLogado.id, { equipeId: usuarioLogado.equipeId, modulo: "competicoes" });
  };



  // ── AUTO-GERAÇÃO DA SERIAÇÃO DA PRÓXIMA FASE ──────────────────────────────
  // Quando todos os resultados de uma fase (Eliminatória/Semifinal) são preenchidos,
  // gera automaticamente a seriação da próxima fase (Semifinal/Final) usando
  // RT 20.3.2(a) para classificação e RT 20.4.x para distribuição de raias.
  useEffect(() => {
    if (!eventoAtual) return;
    const todasP = todasAsProvas();
    const progHorario = eventoAtual.programaHorario || {};
    const seriacaoSalva = eventoAtual.seriacao || {};
    const configSeriacaoEvt = eventoAtual.configSeriacao || {};
    let novasSer = null;

    (eventoAtual.provasPrograma || []).forEach(provaId => {
      const p = todasP.find(pp => pp.id === provaId);
      if (!p || p.unidade !== "s" || p.tipo === "combinada" || p.tipo === "revezamento") return;

      const fasesConf = getFasesProva(provaId, progHorario);
      if (fasesConf.length <= 1) return;

      CATEGORIAS.forEach(cat => {
        ["M", "F"].forEach(sexo => {
          fasesConf.forEach(faseSuf => {
            if (faseSuf === "FIN") return; // Fase final não gera próxima
            const idxAtual = FASE_ORDEM.indexOf(faseSuf);
            const proximaFase = FASE_ORDEM[idxAtual + 1];
            if (!proximaFase || !fasesConf.includes(proximaFase)) return;

            // Verificar se a fase atual tem seriação salva
            const chaveSerAtual = serKey(provaId, cat.id, sexo, faseSuf);
            const baseSerObj = novasSer || seriacaoSalva;
            const serAtual = baseSerObj[chaveSerAtual];
            if (!serAtual?.series || serAtual.series.length === 0) return;

            // Se a próxima fase já tem seriação NÃO auto-gerada, não sobrescrever
            const chaveSerProxima = serKey(provaId, cat.id, sexo, proximaFase);
            const serProxima = baseSerObj[chaveSerProxima];
            if (serProxima?.series && !serProxima.autoGerada) return;

            // Verificar se TODOS os atletas da fase atual têm resultado
            const chaveRes = resKey(eventoAtual.id, provaId, cat.id, sexo, faseSuf);
            const resAtual = resultados[chaveRes] || {};
            const atletaIds = serAtual.series.flatMap(s => s.atletas.map(a => a.id || a.atletaId));
            if (atletaIds.length === 0) return;

            const todosTemResultado = atletaIds.every(aid => {
              const r = resAtual[aid];
              if (!r) return false;
              const marca = typeof r === "object" ? r.marca : r;
              const status = typeof r === "object" ? (r.status || "") : "";
              return (marca != null && String(marca).trim() !== "") || ["DNS", "DNF", "DQ"].includes(status);
            });

            if (!todosTemResultado) return;

            // ── Todos os resultados presentes → auto-gerar próxima fase ──
            const cfg = configSeriacaoEvt[provaId];
            const cfgP = !cfg ? { porPosicao: 3, porTempo: 2, nRaias: 8, atlPorSerie: 12 }
              : typeof cfg === "string" ? { porPosicao: 3, porTempo: 2, nRaias: 8, atlPorSerie: 12 }
              : { porPosicao: cfg.porPosicao ?? 3, porTempo: cfg.porTempo ?? 2, nRaias: cfg.nRaias || 8, atlPorSerie: cfg.atlPorSerie || 12 };

            const progressao = { porPosicao: cfgP.porPosicao, porTempo: cfgP.porTempo };
            const classificados = SeriacaoEngine.rankearRT20_3_2a(serAtual, resAtual, progressao);
            if (classificados.length === 0) return;

            const metros = ((provaId.match(/[_x]?(\d+)m/) || [])[1]);
            const m = metros ? parseInt(metros) : 0;

            // Mapear atletas classificados
            const atletasClassif = classificados.map(c => {
              const a = atletas.find(aa => aa.id === c.atletaId);
              return a ? { ...a, atletaId: a.id, marcaRef: c.marcaRef, origemClassif: c.origemClassif, ranking: c.ranking } : null;
            }).filter(Boolean);

            // Gerar seriação com regra RT 20.4.x adequada
            const result = SeriacaoEngine.seriarProva(atletasClassif, p, {
              nRaias: cfgP.nRaias,
              fase: proximaFase === "FIN" ? "final" : "semifinal",
              atlPorSerie: cfgP.atlPorSerie,
              modo800: "raias",
            });

            if (!novasSer) novasSer = { ...seriacaoSalva };
            const nClassP = classificados.filter(c => c.origemClassif === "posicao").length;
            const nClassT = classificados.filter(c => c.origemClassif === "tempo").length;
            novasSer[chaveSerProxima] = {
              series: result.series,
              ordemSeries: result.ordemSeries,
              modo: cfgP.modo || "semifinal_final",
              regraAplicada: `${result.regraAplicada} · RT 20.3.2(a) · Classificados: ${nClassP}P + ${nClassT}T = ${classificados.length}`,
              autoGerada: true,
            };
          });
        });
      });
    });

    if (novasSer) {
      editarEvento({ ...eventoAtual, seriacao: novasSer });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultados]);

  const selecionarEvento = (id) => {
    setEventoAtualId(id);
    eventoAtualIdRef.current = id;
    _setTela("evento-detalhe");
    if (id) window.history.replaceState(null, "", `#/competicao/${id}`);
  };

  // Helper: resolve nome da equipe/clube para exibição (closure sobre equipes do componente)
  const getClubeAtleta = (atleta) => _getClubeAtleta(atleta, equipes);

  const props = {
    tela, setTela, usuarioLogado, setUsuarioLogado, login, loginComSelecao, logout,
    perfisDisponiveis, setPerfisDisponiveis,
    equipes, atletas, inscricoes, resultados, excluirAtletaPorUsuario,
    eventos, eventoAtual, eventoAtualId, selecionarEvento,
    gerarSenhaTemp, aplicarSenhaTemp, atualizarSenha,
    solicitacoesRecuperacao, adicionarSolicitacaoRecuperacao, resolverSolicitacaoRecuperacao,
    funcionarios, adicionarFuncionario, atualizarFuncionario, removerFuncionario,
    treinadores, adicionarTreinador, atualizarTreinador, removerTreinador,
    historicoAcoes, registrarAcao,
    exportarDados, importarDados,
    adicionarEquipeFiliada, editarEquipeFiliada, excluirEquipeFiliada,
    excluirOrganizador, excluirEquipeUsuario, excluirAtletaUsuario,
    editarOrganizadorAdmin, editarEquipeAdmin, editarAtletaUsuarioAdmin,
    adicionarEquipe, adicionarOrganizador, aprovarOrganizador, recusarOrganizador,
    aprovarEvento, recusarEvento,
    adicionarAtletaUsuario, atualizarAtletaUsuario,
    organizadores, atletasUsuarios,
    atualizarEquipePerfil: _atualizarEquipe,
    atualizarEquipe: _atualizarEquipe,
    setOrganizadores, setAtletasUsuarios, setFuncionarios, setTreinadores,
    adicionarAtleta, adicionarAtletasEmLote, atualizarAtleta, excluirAtleta, excluirAtletasEmMassa, solicitarVinculo, responderVinculo, desvincularAtleta,
    solicitarDesvinculo, excluirPerfilAtual, excluirTodosOsPerfis, anonimizarAtletaBase,
    notificacoes, adicionarNotificacao, marcarNotifLida,
    solicitacoesVinculo,
    adicionarInscricao, excluirInscricao, atualizarInscricao,
    atualizarResultado, atualizarResultadosEmLote, limparResultado, limparTodosResultados,
    numeracaoPeito, setNumeracaoPeito,
    adicionarEvento, editarEvento, excluirEvento, alterarStatusEvento, limparTodosDados,
    getClubeAtleta,
    recordes, setRecordes,
    pendenciasRecorde, setPendenciasRecorde, historicoRecordes, setHistoricoRecordes,
    siteBranding, setSiteBranding, gtIcon, gtLogo, gtNome, gtSlogan,
    adminConfig, setAdminConfig,
  };

  
  return (
    <div style={styles.root}>
      <style>{cssGlobal}</style>
      <Header {...props} />
      <main style={styles.main}>
        {tela === "home"                  && <TelaHome {...props} />}
        {tela === "login"                 && <TelaLogin {...props} />}
        {tela === "cadastro-equipe"    && <TelaCadastroEquipe {...props} />}
        {tela === "cadastro-organizador"  && <TelaCadastroOrganizador {...props} />}
        {tela === "cadastro-atleta-login" && <TelaCadastroAtletaLogin {...props} />}
        {tela === "recuperar-senha"        && <TelaRecuperacaoSenha {...props} />}
        {tela === "trocar-senha"           && <TelaTrocarSenha {...props} />}
        {tela === "selecionar-perfil"      && <TelaSelecaoPerfil {...props} />}
        {tela === "configuracoes"          && <TelaConfiguracoes {...props} />}
        {tela === "painel"                && <TelaPainel {...props} />}
        {tela === "painel-organizador"    && <TelaPainelOrganizador {...props} />}
        {tela === "funcionarios"          && <TelaFuncionarios {...props} />}
        {tela === "treinadores"           && <TelaTreinadores {...props} />}
        {tela === "editar-atleta"         && <TelaEditarAtleta {...props} />}
        {tela === "gerenciar-inscricoes"   && <TelaGerenciarInscricoes {...props} />}
        {tela === "painel-atleta"         && <TelaPainelAtleta {...props} />}
        {tela === "cadastrar-atleta"  && <TelaCadastrarAtleta {...props} />}
        {tela === "novo-evento"       && <TelaCadastroEvento key={eventoAtualId || "novo"} {...props} />}
        {tela === "evento-detalhe"    && <TelaEventoDetalhe {...props} />}

        {/* Bloqueio global: telas de edição bloqueadas se competição finalizada */}
        {eventoAtual?.competicaoFinalizada && ["inscricao-avulsa","digitar-resultados","gestao-inscricoes","inscricao-revezamento","config-pontuacao-equipes","numeracao-peito"].includes(tela) ? (
          <div style={styles.page}><div style={styles.emptyState}>
            <span style={{ fontSize:48 }}>🔒</span>
            <p style={{ color:"#ff6b6b", fontWeight:700, fontSize:18 }}>Competição Finalizada</p>
            <p style={{ color:"#888", fontSize:13, maxWidth:400, textAlign:"center", lineHeight:1.6 }}>
              Os dados desta competição estão bloqueados para edição.<br/>
              Para desbloquear, solicite autorização a um <strong style={{ color:"#1976D2" }}>administrador</strong>.
            </p>
            <button style={styles.btnGhost} onClick={() => setTela("evento-detalhe")}>← Voltar à Competição</button>
          </div></div>
        ) : (
          <>
            {tela === "inscricao-avulsa"  && <TelaInscricaoAvulsa {...props} />}
            {tela === "digitar-resultados"&& <TelaDigitarResultados {...props} />}
            {tela === "numeracao-peito"  && <TelaNumericaPeito {...props} />}
            {tela === "gestao-inscricoes"&& <TelaGestaoInscricoes {...props} />}
            {tela === "inscricao-revezamento" && <TelaInscricaoRevezamento {...props} />}
            {tela === "config-pontuacao-equipes" && <TelaConfigPontuacaoEquipes {...props} />}
          </>
        )}

        {tela === "sumulas"           && usuarioLogado && <TelaSumulas {...props} />}
        {tela === "resultados"        && <TelaResultados {...props} />}
        {tela === "recordes"          && <TelaRecordes {...props} />}
        {tela === "admin"             && <TelaAdmin {...props} />}
        {tela === "gerenciar-equipes" && <TelaGerenciarEquipes {...props} />}
        {tela === "gerenciar-usuarios" && <TelaGerenciarUsuarios {...props} />}
        {tela === "importar-atletas"  && <TelaImportarAtletas {...props} />}
        {tela === "painel-equipe"     && <TelaPainelEquipe {...props} />}
        {tela === "gerenciar-membros" && <TelaGerenciarMembros {...props} />}
        {tela === "auditoria"         && <TelaAuditoria {...props} />}
      </main>
      <footer style={styles.footer}>
        <span style={{ opacity: 0.4 }}>Desenvolvido por: GERENTRACK</span>
      </footer>
    </div>
  );
}

// ─── TELA HOME — listagem de competições ──────────────────────────────────────
// ─── IMPORTAÇÃO EM LOTE DE ATLETAS ────────────────────────────────────────────
// ─── ESTILOS ───────────────────────────────────────────────────────────────────
const cssGlobal = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0A0B0D; color: #E0E0E0; font-family: 'Barlow', sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
  optgroup { background: #1a1c22; color: #1976D2; font-style: normal; }
  option { background: #1a1c22; color: #E0E0E0; }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  main > * { animation: fadeIn 0.25s ease; }

  button:not([disabled]):hover { filter: brightness(1.12); }
  button:not([disabled]):active { transform: scale(0.97); }

  input:focus, select:focus { border-color: #1976D2 !important; box-shadow: 0 0 0 2px #1976D222; }

  tr:hover td { background: #12141e !important; }

  .saved-pulse { animation: pulse 1s ease 2; }
`;


const styles = {
  root: { minHeight: "100vh", background: "#0A0B0D", display: "flex", flexDirection: "column" },
  main: { flex: 1 },

  header: { background: "linear-gradient(90deg, #0D0E12 0%, #141720 100%)", borderBottom: "1px solid #1E2130", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 20px rgba(0,0,0,0.5)" },
  headerInner: { maxWidth: 1200, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  logo: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 },
  logoIcon: { fontSize: 36 },
  logoTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, color: "#1976D2", letterSpacing: 3, lineHeight: 1 },
  logoSub: { fontSize: 11, color: "#666", letterSpacing: 1.5, marginTop: 3 },

  nav: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  btnNav: { background: "transparent", border: "1px solid #2a2d3a", color: "#ccc", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", whiteSpace: "nowrap" },
  btnNavActive: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
  btnSair: { background: "transparent", border: "1px solid #3a1a1a", color: "#ff6b6b", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow', sans-serif" },

  page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" },
  pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 24, letterSpacing: 1 },

  heroSection: { textAlign: "center", padding: "60px 20px 40px", background: "linear-gradient(180deg, #0D1018 0%, transparent 100%)", borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" },
  heroBadge: { display: "inline-block", background: "#1976D2", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 16, letterSpacing: 1 },
  heroMeta: { color: "#888", fontSize: 15, marginBottom: 32 },
  heroStats: { display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 36 },
  heroBtns: { display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" },

  statCard: { background: "#111318", border: "1px solid #1E2130", borderRadius: 12, padding: "18px 24px", textAlign: "center", minWidth: 100 },
  statValue: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: "#1976D2", lineHeight: 1, marginBottom: 6 },
  statLabel: { fontSize: 13, color: "#888", letterSpacing: 1 },

  statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },

  btnPrimary: { background: "linear-gradient(135deg, #1976D2, #1565C0)", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, transition: "all 0.2s" },
  btnSecondary: { background: "transparent", color: "#1976D2", border: "2px solid #1976D2", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  btnGhost: { background: "transparent", color: "#888", border: "1px solid #2a2d3a", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif" },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 },
  infoCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  infoCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: "#1976D2", marginBottom: 16, letterSpacing: 1 },
  infoList: { listStyle: "none" },
  infoItem: { padding: "6px 0", borderBottom: "1px solid #151820", fontSize: 14, color: "#bbb", display: "flex", alignItems: "center", gap: 8 },
  infoItemDot: { color: "#1976D2", fontWeight: 700 },

  catSection: { marginTop: 40 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 20, letterSpacing: 1 },
  catGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 },
  catCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 10, padding: "14px 18px" },
  catName: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: "#1976D2" },
  catRange: { fontSize: 12, color: "#666", marginTop: 4 },

  formPage: { maxWidth: 640, margin: "60px auto", padding: "0 24px 80px" },
  formCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 16, padding: 32, marginBottom: 20 },
  formIcon: { fontSize: 48, textAlign: "center", marginBottom: 16 },
  formTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 8 },
  formSub: { color: "#666", textAlign: "center", fontSize: 14, marginBottom: 24 },
  formLink: { textAlign: "center", marginTop: 16, color: "#666", fontSize: 13 },
  formHint: { textAlign: "center", marginTop: 12, color: "#444" },
  grid2form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },

  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  input: { width: "100%", background: "#141720", borderWidth: 1, borderStyle: "solid", borderColor: "#252837", borderRadius: 8, padding: "10px 14px", color: "#E0E0E0", fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  inputError: { borderColor: "#ff4444" },
  fieldError: { color: "#ff6b6b", fontSize: 12, marginTop: 2 },
  select: { width: "100%", background: "#141720", borderWidth: 1, borderStyle: "solid", borderColor: "#252837", borderRadius: 8, padding: "10px 14px", color: "#E0E0E0", fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", marginBottom: 4 },
  erro: { background: "#2a1010", border: "1px solid #ff4444", color: "#ff6b6b", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  linkBtn: { background: "none", border: "none", color: "#1976D2", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", padding: 0 },

  radioGroup: { display: "flex", gap: 8, marginBottom: 16 },
  radioLabel: { flex: 1, background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: 14, color: "#888", transition: "all 0.2s" },
  radioLabelActive: { background: "#1c1f2e", border: "1px solid #1976D2", color: "#1976D2" },

  catPreview: { background: "#141720", border: "1px solid #1976D2", borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: "#aaa" },
  atletaInfo: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12, padding: "10px 14px", background: "#141720", borderRadius: 8, fontSize: 13 },

  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  badgeGold: { background: "#1976D222", color: "#1976D2", border: "1px solid #1976D244", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },

  painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  painelBtns: { display: "flex", gap: 10 },

  tableWrap: { overflowX: "auto", borderRadius: 12, border: "1px solid #1E2130" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#0D0E12", padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1E2130" },
  td: { padding: "12px 16px", fontSize: 14, color: "#bbb", borderBottom: "1px solid #12141a" },
  tr: { transition: "background 0.15s" },
  trOuro: { background: "#1a170a" },
  trPrata: { background: "#12141a" },
  trBronze: { background: "#14100a" },
  marca: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: "#1976D2" },

  emptyState: { textAlign: "center", padding: "60px 20px", color: "#444", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontSize: 15 },

  modoSwitch: { display: "flex", gap: 0, background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10, overflow: "hidden", marginBottom: 24, width: "fit-content" },
  modoBtn: { background: "transparent", border: "none", color: "#666", padding: "12px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Barlow', sans-serif", transition: "all 0.2s" },
  modoBtnActive: { background: "#141720", color: "#1976D2" },

  filtros: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 },

  provaSection: { marginBottom: 28 },
  provaSecTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: "#aaa", marginBottom: 12, letterSpacing: 1 },
  provaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  provaBtn: { background: "#0E1016", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", transition: "all 0.2s", lineHeight: 1.4 },
  provaBtnSel: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
  provaBtnInscrito: { opacity: 0.5, cursor: "not-allowed", borderColor: "#2a4a2a", color: "#4a8a4a" },

  resumoInscricao: { background: "#0E1016", border: "1px solid #1976D233", borderRadius: 10, padding: "16px 20px", marginTop: 16 },
  tagProva: { background: "#1976D222", color: "#1976D2", border: "1px solid #1976D244", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },

  sumuCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  sumuHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumuProva: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 },
  sumuMeta: { display: "flex", gap: 8, alignItems: "center" },

  digitarSection: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, overflow: "hidden" },
  digitarHeader: { padding: "16px 20px", background: "#0D0E12", borderBottom: "1px solid #1E2130", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  digitarDica: { color: "#666", fontSize: 12 },
  inputMarca: { background: "#141720", border: "1px solid #252837", borderRadius: 6, padding: "8px 12px", color: "#1976D2", fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, width: 120, outline: "none" },
  savedBadge: { background: "#0a2a0a", border: "1px solid #2a6a2a", color: "#4aaa4a", padding: "8px 16px", borderRadius: 8, fontSize: 13 },

  adminGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 },
  adminCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: 24 },
  adminCardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#1976D2", marginBottom: 16 },

  catBanner: { background: "#141720", border: "1px solid #252837", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 14, color: "#aaa" },

  permissividadeTag: (ativo) => ({
    display: "inline-block",
    background: ativo ? "#1a2a0a" : "#1a1a1a",
    border: `1px solid ${ativo ? "#4a8a2a" : "#333"}`,
    color: ativo ? "#7acc44" : "#555",
    borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600,
  }),
  permissividadeBox: {
    background: "#0d1117", border: "1px solid #1976D233",
    borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 4,
  },
  permissividadeHeader: { marginBottom: 10 },
  permissividadeLabel: {
    display: "flex", alignItems: "center", cursor: "pointer",
    fontSize: 14, color: "#ddd", fontWeight: 600,
  },
  permissividadeInfo: {
    background: "#111620", borderRadius: 8, padding: "12px 16px",
    borderLeft: "3px solid #1976D2",
  },
  permissividadeAlert: {
    display: "flex", gap: 14, alignItems: "flex-start",
    background: "#12180a", border: "1px solid #4a8a2a",
    borderRadius: 10, padding: "14px 18px", marginBottom: 20,
  },
  permissividadeAlertIcon: { fontSize: 28, flexShrink: 0, marginTop: 2 },
  permissividadeAlertTitle: { fontWeight: 700, color: "#7acc44", fontSize: 15, marginBottom: 4 },
  permissividadeAlertBody: { color: "#aaa", fontSize: 13, lineHeight: 1.6, marginBottom: 6 },
  permissividadeAlertRodape: { fontSize: 12, color: "#666", fontStyle: "italic" },
  badgeOficial: {
    background: "#1a1a2a", color: "#8888cc", border: "1px solid #333366",
    borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600,
  },
  badgeNorma: {
    background: "#1a2a0a", color: "#7acc44", border: "1px solid #3a6a1a",
    borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, cursor: "help",
  },

  filtroProvasBar: {
    background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12,
    padding: "16px 20px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 20,
  },
  filtroProvasBloco: { display: "flex", flexDirection: "column", gap: 8 },
  filtroProvasLabel: { fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 },
  filtroProvasPills: { display: "flex", flexWrap: "wrap", gap: 6 },
  filtroPill: {
    background: "#141720", border: "1px solid #252837", color: "#666",
    borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600,
    cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5,
    transition: "all 0.15s",
  },
  filtroPillAtivo: {
    background: "#1a1c22", border: "1px solid #1976D2", color: "#1976D2",
  },
  filtroClearBtn: {
    background: "none", border: "none", color: "#1976D288", cursor: "pointer",
    fontSize: 11, fontFamily: "'Barlow', sans-serif", padding: "0 4px", textDecoration: "underline",
  },

  statusBar: {
    display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
    background: "#0D0E12", border: "1px solid #1E2130", borderRadius: 10,
    padding: "12px 18px", marginBottom: 24,
  },
  statusBarItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  statusDot: (cor) => ({
    display: "inline-block", width: 8, height: 8, borderRadius: "50%",
    background: cor, flexShrink: 0,
  }),
  statusDotInline: (cor) => ({
    display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11,
    color: cor, background: cor + "22", border: `1px solid ${cor}44`,
    borderRadius: 10, padding: "2px 8px", whiteSpace: "nowrap",
  }),
  statusControlsCard: {
    background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12,
    padding: "20px 24px", marginBottom: 28,
  },
  statusControlsTitle: {
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700,
    color: "#1976D2", letterSpacing: 1, marginBottom: 14,
  },
  statusControlsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  statusControlBox: (ativo, corAtiva, bgAtiva, disabled) => ({
    background: ativo ? bgAtiva : "#141720",
    border: `1px solid ${ativo ? corAtiva + "66" : "#252837"}`,
    borderRadius: 10, padding: "14px 16px",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s",
  }),
  statusControlLabel: {
    display: "flex", alignItems: "flex-start", cursor: "pointer", gap: 0,
  },

  eventoBar: { background: "#0D0E12", borderTop: "1px solid #1a1c22", padding: "6px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  eventoBarLabel: { fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase" },
  eventoBarNome: { fontSize: 13, fontWeight: 700, color: "#1976D2", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 },
  eventoBarMeta: { fontSize: 12, color: "#555", marginLeft: "auto" },

  eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 },
  eventoCard: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 },
  eventoCardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  eventoCardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.2 },
  eventoCardMeta: { fontSize: 13, color: "#666" },
  eventoCardStats: { display: "flex", gap: 16, fontSize: 13, color: "#888", flexWrap: "wrap", borderTop: "1px solid #141820", paddingTop: 10, marginTop: 4 },
  eventoStatusBadge: (status) => ({
    display: "inline-block", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    background: status === "ao_vivo" ? "#3a0a0a" : status === "hoje_pre" ? "#2a2a0a" : status === "futuro" ? "#0a2a0a" : "#1a1a1a",
    color: status === "ao_vivo" ? "#ff6b6b" : status === "hoje_pre" ? "#1976D2" : status === "futuro" ? "#7acc44" : "#555",
    border: `1px solid ${status === "ao_vivo" ? "#6a2a2a" : status === "hoje_pre" ? "#4a4a0a" : status === "futuro" ? "#2a5a2a" : "#333"}`,
  }),

  eventoAcoesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 },
  eventoAcaoBtn: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 12, padding: "20px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", color: "#fff", fontFamily: "'Barlow', sans-serif", fontSize: 15, fontWeight: 700, transition: "border-color 0.2s" },

  grupoProvasBox: { background: "#0E1016", border: "1px solid #1E2130", borderRadius: 10, marginBottom: 16, overflow: "hidden" },
  grupoProvasHeader: { background: "#0D0E12", borderBottom: "1px solid #1E2130", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  provaCheckBtn: { background: "#0E1016", border: "1px solid #1E2130", color: "#888", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Barlow', sans-serif", lineHeight: 1.4, userSelect: "none" },
  provaCheckBtnSel: { background: "#1a1c22", borderColor: "#1976D2", color: "#1976D2" },
  provaChip: { background: "#141720", border: "1px solid #252837", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#bbb", lineHeight: 1.4 },

  stepBar: { display: "flex", alignItems: "center", gap: 0, marginBottom: 32, maxWidth: 400 },
  stepItem: (ativo) => ({ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, background: ativo ? "#1a1c22" : "transparent", color: ativo ? "#1976D2" : "#444", border: `1px solid ${ativo ? "#1976D244" : "#1E2130"}` }),
  stepDivider: { flex: 1, height: 1, background: "#1E2130", margin: "0 8px" },

  btnIconSm: { background: "#141720", border: "1px solid #252837", color: "#888", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },
  btnIconSmDanger: { background: "#1a0a0a", border: "1px solid #3a1a1a", color: "#ff6b6b", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 },

  footer: { textAlign: "center", padding: "20px", borderTop: "1px solid #1E2130", fontSize: 12, color: "#333" },
};



// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: PAINEL DA EQUIPE
// ═══════════════════════════════════════════════════════════════════════════


export default App;
