/**
 * useReloginGuard
 *
 * Detecta quando a sessão Firebase Auth é perdida (ex: token expirado)
 * enquanto o usuário ainda está logado localmente. Oferece relogin
 * in-place sem perder dados.
 *
 * Extraído de App.jsx — Etapa 2.3 da decomposição.
 */
import { useState, useEffect } from "react";
import { auth, signInWithEmailAndPassword } from "../firebase";

export function useReloginGuard(usuarioLogado, firebaseAuthed, { onDesistir }) {
  const [reloginNecessario, setReloginNecessario] = useState(false);
  const [reloginSenha, setReloginSenha] = useState("");
  const [reloginErro, setReloginErro] = useState("");
  const [reloginLoading, setReloginLoading] = useState(false);

  // Guard: se Firebase Auth sumiu mas usuário está logado localmente
  useEffect(() => {
    if (!usuarioLogado) return;
    const timeout = setTimeout(() => {
      if (!auth.currentUser) {
        console.warn("[App] Sessão Firebase Auth ausente — solicitando relogin in-place");
        setReloginNecessario(true);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [usuarioLogado, firebaseAuthed]);

  // Quando a sessão Firebase Auth é restaurada, fechar o modal
  useEffect(() => {
    if (firebaseAuthed && reloginNecessario) {
      setReloginNecessario(false);
      setReloginSenha("");
      setReloginErro("");
    }
  }, [firebaseAuthed, reloginNecessario]);

  const handleRelogin = async () => {
    const email = usuarioLogado?.email;
    if (!email) {
      onDesistir();
      return;
    }
    setReloginLoading(true);
    setReloginErro("");
    try {
      await signInWithEmailAndPassword(auth, email, reloginSenha);
      // onAuthStateChanged vai setar firebaseAuthed=true → useEffect fecha o modal
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setReloginErro("Senha incorreta.");
      } else if (err.code === "auth/too-many-requests") {
        setReloginErro("Muitas tentativas. Aguarde alguns minutos.");
      } else {
        setReloginErro("Erro ao reconectar. Tente novamente.");
      }
    } finally {
      setReloginLoading(false);
    }
  };

  const handleReloginDesistir = () => {
    setReloginNecessario(false);
    setReloginSenha("");
    setReloginErro("");
    onDesistir();
  };

  return {
    reloginNecessario,
    reloginSenha, setReloginSenha,
    reloginErro, setReloginErro,
    reloginLoading, setReloginLoading,
    handleRelogin,
    handleReloginDesistir,
  };
}
