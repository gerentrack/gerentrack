import { criarAuthStyles } from "./authStyles";
import React, { useState } from "react";
import FormField from "../ui/FormField";
import { useTema } from "../../shared/TemaContext";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";

function TelaTrocarSenha() {
  const navigate = useNavigate();
  const { usuarioLogado, atualizarSenha } = useAuth();
  const { equipes } = useEvento();
  const { organizadores, atletasUsuarios } = useApp();
  const t = useTema();
  const s = useStylesResponsivos(criarAuthStyles(t));
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [pedirSenhaAtual, setPedirSenhaAtual] = useState(false);
  const [erro, setErro]           = useState("");
  const [ok, setOk]               = useState(false);

  const handleTrocar = async () => {
    setErro("");
    if (novaSenha.length < 6)    { setErro("A senha deve ter pelo menos 6 caracteres."); return; }
    if (novaSenha !== confirmar) { setErro("As senhas não coincidem."); return; }
    if (pedirSenhaAtual && !senhaAtual) { setErro("Informe a senha atual."); return; }
    const resultado = await atualizarSenha(usuarioLogado?.tipo, usuarioLogado?.id, novaSenha, senhaAtual || undefined);
    if (resultado?.ok) {
      setOk(true);
    } else if (resultado?.erro === "requires-recent-login") {
      setPedirSenhaAtual(true);
      setErro("Por segurança, informe sua senha atual para continuar.");
    } else {
      setErro(resultado?.erro || "Erro ao atualizar senha.");
    }
  };

  const irParaPainel = () => {
    const mapa = { admin:"/admin", atleta:"/painel/atleta", organizador:"/painel/organizador", funcionario:"/painel/organizador", equipe:"/painel", treinador:"/painel" };
    navigate(mapa[usuarioLogado?.tipo] || "/");
  };

  if (ok) return (
    <div style={s.formPage}><div style={s.formCard}>
      <h2 style={{ ...s.formTitle, textAlign:"center" }}>Senha atualizada!</h2>
      <p style={{ textAlign:"center", color:t.textTertiary }}>Sua nova senha foi salva com sucesso.</p>
      <button style={s.btnPrimary} onClick={irParaPainel}>Ir para o Painel</button>
    </div></div>
  );

  return (
    <div style={s.formPage}><div style={s.formCard}>
      <h2 style={s.formTitle}>Criar Nova Senha</h2>
      <div style={{ background:`${t.warning}15`, border:`1px solid ${t.accent}66`, borderRadius:6, padding:"10px 14px", fontSize:12, color:t.accent, marginBottom:20, textAlign:"center" }}>
        Você está usando uma <strong>senha temporária</strong>. Crie uma nova senha para continuar.
      </div>
      {erro && <div style={s.erro}>{erro}</div>}
      {pedirSenhaAtual && (
        <FormField label="Senha Atual *" value={senhaAtual} onChange={setSenhaAtual} type="password" placeholder="Informe sua senha atual" />
      )}
      <FormField label="Nova Senha *"      value={novaSenha} onChange={setNovaSenha} type="password" placeholder="Mínimo 6 caracteres" />
      <FormField label="Confirmar Senha *" value={confirmar} onChange={setConfirmar} type="password" placeholder="Repita a nova senha" />
      <button style={{ ...s.btnPrimary, marginTop:16 }} onClick={handleTrocar}>Salvar Nova Senha</button>
    </div></div>
  );
}

export default TelaTrocarSenha;
