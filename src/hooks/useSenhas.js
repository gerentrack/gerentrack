import {
  auth,
  secondaryAuth,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "../firebase";

/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * Gerencia geração de senhas temporárias, aplicação e atualização de senhas.
 */
export function useSenhas({
  setUsuarioLogado, atualizarCamposEquipe,
  setOrganizadores, setFuncionarios, setTreinadores, setAtletasUsuarios,
  atletasUsuarios, atletas, organizadores, funcionarios, treinadores,
  _atualizarAtleta,
}) {
  // Gera senha aleatória 8 chars: letras maiúsculas + dígitos
  const gerarSenhaTemp = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  // Aplica senha temporária num usuário de qualquer store.
  // ⚠️ SEGURANÇA: senha NÃO é salva localmente — apenas o flag senhaTemporaria.
  // A credencial real fica exclusivamente no Firebase Auth.
  const aplicarSenhaTemp = async (tipo, userId, senhaTemp, solicitacao) => {
    const updFlag = arr => arr.map(u => u.id === userId ? { ...u, senhaTemporaria: true } : u);
    if (tipo === "equipe")      atualizarCamposEquipe(userId, { senhaTemporaria: true });
    if (tipo === "organizador") setOrganizadores(updFlag);
    if (tipo === "funcionario") setFuncionarios(updFlag);
    if (tipo === "treinador")   setTreinadores(updFlag);

    if (tipo === "atleta" || tipo === "atleta_cpf") {
      const existente = atletasUsuarios.find(u => u.id === userId);
      if (existente) {
        setAtletasUsuarios(updFlag);
      } else {
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
            senhaTemporaria: true,
            status: "ativo",
            dataCadastro: new Date().toISOString(),
            criadoPorSenhaTemp: true,
          };
          setAtletasUsuarios(prev => {
            if (prev.some(u => u.id === userId)) return prev.map(u => u.id === userId ? { ...u, senhaTemporaria: true } : u);
            return [...prev, novoUsuario];
          });
          const emailAuth = (solicitacao?.email || atletaBase.email || "").trim().toLowerCase();
          if (emailAuth) {
            try {
              await createUserWithEmailAndPassword(secondaryAuth, emailAuth, senhaTemp);
              await firebaseSignOut(secondaryAuth).catch(() => {});
            } catch (authErr) {
              // auth/email-already-in-use: conta já existe — flag senhaTemporaria forçará troca no login
            }
          }
          if (solicitacao?.email && atletaBase && !atletaBase.email) {
            try { await _atualizarAtleta({ ...atletaBase, email: solicitacao.email }); } catch {}
          }
        } else {
          setAtletasUsuarios(updFlag);
        }
      }
    }

    // Criar conta Firebase Auth para não-atletas que ainda não têm
    if (tipo !== "atleta" && tipo !== "atleta_cpf" && tipo !== "equipe") {
      const stores = { organizador: organizadores, funcionario: funcionarios, treinador: treinadores };
      const registro = (stores[tipo] || []).find(u => u.id === userId);
      const emailAuth = registro?.email?.trim().toLowerCase();
      if (emailAuth) {
        try {
          await createUserWithEmailAndPassword(secondaryAuth, emailAuth, senhaTemp);
          await firebaseSignOut(secondaryAuth).catch(() => {});
        } catch (authErr) {
          // auth/email-already-in-use: conta já existe — flag senhaTemporaria forçará troca no login
        }
      }
    }
  };

  const atualizarSenha = async (tipo, userId, novaSenha, senhaAtual) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !novaSenha) return { ok: false, erro: "Sessão expirada. Faça login novamente." };

    try {
      await updatePassword(currentUser, novaSenha);
    } catch (e) {
      if (e.code === "auth/requires-recent-login") {
        if (!senhaAtual) return { ok: false, erro: "requires-recent-login" };
        try {
          const credential = EmailAuthProvider.credential(currentUser.email, senhaAtual);
          await reauthenticateWithCredential(currentUser, credential);
          await updatePassword(currentUser, novaSenha);
        } catch (reErr) {
          console.error("Erro ao reautenticar para trocar senha:", reErr);
          return { ok: false, erro: reErr.code === "auth/invalid-credential" ? "Senha atual incorreta." : "Erro ao atualizar senha. Tente fazer login novamente." };
        }
      } else {
        console.error("Erro ao atualizar senha no Firebase Auth:", e);
        return { ok: false, erro: "Erro ao atualizar senha. Tente novamente." };
      }
    }

    // Auth atualizado com sucesso — limpar flag senhaTemporaria
    if (tipo === "admin") {
      setUsuarioLogado(u => u ? { ...u, senhaTemporaria: false } : u);
      return { ok: true };
    }
    const updFlag = arr => arr.map(u => u.id === userId ? { ...u, senhaTemporaria: false } : u);
    if (tipo === "equipe")      atualizarCamposEquipe(userId, { senhaTemporaria: false });
    if (tipo === "organizador") setOrganizadores(updFlag);
    if (tipo === "atleta")      setAtletasUsuarios(updFlag);
    if (tipo === "funcionario") setFuncionarios(updFlag);
    if (tipo === "treinador")   setTreinadores(updFlag);
    setUsuarioLogado(u => u ? { ...u, senhaTemporaria: false } : u);
    return { ok: true };
  };

  return { gerarSenhaTemp, aplicarSenhaTemp, atualizarSenha };
}
