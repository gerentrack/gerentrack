import { auth, signOut as firebaseSignOut } from "../firebase";
import { useSessionTimeout } from "./useSessionTimeout";
import { useReloginGuard } from "./useReloginGuard";

/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * Login, loginComSelecao, logout, relogin guard, expiração de sessão.
 */
export function useLoginLogout({
  usuarioLogado, setUsuarioLogado, firebaseAuthed,
  setPerfisDisponiveis, setEventoAtualId,
  registrarAcao, navigate,
}) {
  const login = (dados) => {
    const dadosComSessao = { ...dados, _loginEm: Date.now() };
    setUsuarioLogado(dadosComSessao);
    registrarAcao(dados.id, dados.nome, "Login", `${dados.tipo}`, dados.organizadorId || null, {
      equipeId: dados.equipeId, modulo: "auth",
      ...(dados.tipo === "admin" ? { userAgent: navigator.userAgent, plataforma: navigator.platform, tela: `${screen.width}x${screen.height}` } : {}),
    });
    const destinos = { admin: "/admin", atleta: "/painel/atleta", organizador: "/painel/organizador", funcionario: "/painel/organizador", equipe: "/painel/equipe", treinador: "/painel/equipe" };
    if (dados.tipo === "atleta") setEventoAtualId(null);
    navigate(destinos[dados.tipo] || "/painel/equipe");
  };

  const loginComSelecao = (dados, perfis) => {
    const dadosComSessao = { ...dados, _loginEm: Date.now(), _temOutrosPerfis: perfis.length > 1 };
    setPerfisDisponiveis(perfis);
    setUsuarioLogado(dadosComSessao);
    if (dados.senhaTemporaria && !dados._googleAuth) { navigate("/trocar-senha"); return; }
    const destinos = { admin: "/admin", atleta: "/painel/atleta", organizador: "/painel/organizador", funcionario: "/painel/organizador", equipe: "/painel/equipe", treinador: "/painel/equipe" };
    if (dados.tipo === "atleta") setEventoAtualId(null);
    navigate(destinos[dados.tipo] || "/painel/equipe");
  };

  const logout = () => {
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Logout", usuarioLogado.tipo || "", usuarioLogado.organizadorId || null, { equipeId: usuarioLogado.equipeId, modulo: "auth" });
    setTimeout(() => firebaseSignOut(auth).catch(() => {}), 300);
    setUsuarioLogado(null);
    setPerfisDisponiveis([]);
    navigate("/");
  };

  // ── Relogin guard ──
  const _reloginDesistir = () => { setUsuarioLogado(null); setPerfisDisponiveis([]); navigate("/entrar"); };
  const {
    reloginNecessario, reloginSenha, setReloginSenha,
    reloginErro, setReloginErro, reloginLoading, setReloginLoading,
    handleRelogin, handleReloginDesistir,
  } = useReloginGuard(usuarioLogado, firebaseAuthed, { onDesistir: _reloginDesistir });

  // ── Expiração de sessão por inatividade ──
  const _sessaoExpirou = () => {
    if (usuarioLogado) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Sessão expirada", "Logout automático por inatividade", usuarioLogado.organizadorId || null, { modulo: "auth" });
    setTimeout(() => firebaseSignOut(auth).catch(() => {}), 300);
    setUsuarioLogado(null);
    setPerfisDisponiveis([]);
    navigate("/");
  };
  const { sessaoAvisoContagem, renovarSessao } = useSessionTimeout(usuarioLogado, { onExpire: _sessaoExpirou });

  return {
    login, loginComSelecao, logout,
    reloginNecessario, reloginSenha, setReloginSenha,
    reloginErro, setReloginErro, reloginLoading, setReloginLoading,
    handleRelogin, handleReloginDesistir,
    sessaoAvisoContagem, renovarSessao,
  };
}
