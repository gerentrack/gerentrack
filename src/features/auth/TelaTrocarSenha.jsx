import authStyles from "./authStyles";
const styles = authStyles;
import React, { useState } from "react";
import FormField from "../ui/FormField";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";

function TelaTrocarSenha({ usuarioLogado, setTela, atualizarSenha, equipes, organizadores, atletasUsuarios }) {
  const s = useStylesResponsivos(styles);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro]           = useState("");
  const [ok, setOk]               = useState(false);

  const handleTrocar = async () => {
    setErro("");
    if (novaSenha.length < 6)    { setErro("A senha deve ter pelo menos 6 caracteres."); return; }
    if (novaSenha !== confirmar) { setErro("As senhas não coincidem."); return; }
    await atualizarSenha(usuarioLogado?.tipo, usuarioLogado?.id, novaSenha);
    setOk(true);
  };

  const irParaPainel = () => {
    const mapa = { admin:"admin", atleta:"painel-atleta", organizador:"painel-organizador", funcionario:"painel-organizador", equipe:"painel", treinador:"painel" };
    setTela(mapa[usuarioLogado?.tipo] || "home");
  };

  if (ok) return (
    <div style={s.formPage}><div style={s.formCard}>
      <div style={{ fontSize:64, textAlign:"center" }}>✅</div>
      <h2 style={{ ...s.formTitle, textAlign:"center" }}>Senha atualizada!</h2>
      <p style={{ textAlign:"center", color:"#aaa" }}>Sua nova senha foi salva com sucesso.</p>
      <button style={s.btnPrimary} onClick={irParaPainel}>Ir para o Painel</button>
    </div></div>
  );

  return (
    <div style={s.formPage}><div style={s.formCard}>
      <div style={{ fontSize:48, textAlign:"center", marginBottom:8 }}>🔐</div>
      <h2 style={s.formTitle}>Criar Nova Senha</h2>
      <div style={{ background:"#1a1000", border:"1px solid #1976D266", borderRadius:6, padding:"10px 14px", fontSize:12, color:"#1976D2", marginBottom:20, textAlign:"center" }}>
        ⚠️ Você está usando uma <strong>senha temporária</strong>. Crie uma nova senha para continuar.
      </div>
      {erro && <div style={s.erro}>{erro}</div>}
      <FormField label="Nova Senha *"      value={novaSenha} onChange={setNovaSenha} type="password" placeholder="Mínimo 6 caracteres" />
      <FormField label="Confirmar Senha *" value={confirmar} onChange={setConfirmar} type="password" placeholder="Repita a nova senha" />
      <button style={{ ...s.btnPrimary, marginTop:16 }} onClick={handleTrocar}>Salvar Nova Senha</button>
    </div></div>
  );
}

export default TelaTrocarSenha;
