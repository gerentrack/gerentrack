import React, { useState, useCallback } from "react";
import DOMPurify from "dompurify";
import { validarCPF, validarCNPJ } from "../../shared/formatters/utils";
import FormField from "../ui/FormField";
import { storage, storageRef, uploadBytes, getDownloadURL, deleteObject, db, doc, deleteDoc, auth, functions, httpsCallable } from "../../firebase";
import CortarImagem from "../../shared/CortarImagem";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";

function getS(t) {
  return {
    page: { maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" },
    pageTitle: { fontFamily: t.fontTitle, fontSize: 36, fontWeight: 800, color: t.textPrimary, marginBottom: 6, letterSpacing: 1 },
    painelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 32 },
    card: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "24px 28px", marginBottom: 20 },
    sectionTitle: { fontFamily: t.fontTitle, fontSize: 18, fontWeight: 800, color: t.textPrimary, letterSpacing: 1, marginBottom: 16 },
    label: { display: "block", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, marginBottom: 5, textTransform: "uppercase" },
    input: { width: "100%", background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 7, padding: "9px 12px", color: t.textSecondary, fontSize: 13, fontFamily: t.fontBody, outline: "none", marginBottom: 4 },
    btnPrimary: { background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: t.fontTitle, letterSpacing: 1 },
    btnSecondary: { background: "transparent", color: t.accent, border: `2px solid ${t.accent}`, padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: t.fontTitle },
    btnGhost: { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: t.fontBody },
    tabBar: { display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" },
    row: { display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${t.border}` },
    okBox: { background: `${t.success}08`, border: `1px solid ${t.success}66`, borderRadius: 8, padding: "10px 16px", marginBottom: 12, color: t.success, fontSize: 13 },
    errBox: { background: `${t.danger}11`, border: `1px solid ${t.danger}66`, borderRadius: 8, padding: "10px 16px", marginBottom: 12, color: t.danger, fontSize: 13 },
  };
}

// ── Info badge ────────────────────────────────────────────────────────────────
function InfoBadge({ children, color }) {
  const tFallback = useTema();
  if (!color) color = tFallback.accent;
  return (
    <div style={{ background: color + "11", border: `1px solid ${color}33`, borderRadius: 8,
      padding: "10px 14px", fontSize: 12, color: color, lineHeight: 1.6, marginBottom: 12 }}>
      {children}
    </div>
  );
}

// ── Bloco de exclusão com confirmação em 2 etapas ─────────────────────────────
function ExclusaoConfirmada({ titulo, descricao, corAccent, btnLabel, onConfirmar, confirmWord }) {
  const t = useTema();
  const S = getS(t);
  const [fase, setFase] = useState(0); // 0=idle 1=confirma 2=digita
  const [palavra, setPalavra] = useState("");
  const errada = palavra.trim().toUpperCase() !== confirmWord.toUpperCase();

  if (fase === 0) return (
    <button onClick={() => setFase(1)}
      style={{ background: "transparent", border: `1px solid ${corAccent}55`,
        color: corAccent, padding: "9px 18px", borderRadius: 7, cursor: "pointer",
        fontSize: 13, fontFamily: t.fontBody }}>
      {btnLabel}
    </button>
  );

  if (fase === 1) return (
    <div style={{ background: corAccent + "08", border: `1px solid ${corAccent}33`,
      borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontWeight: 700, color: corAccent, marginBottom: 8, fontSize: 14 }}>
        {titulo}
      </div>
      <div style={{ color: t.textTertiary, fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(descricao) }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setFase(2)}
          style={{ background: corAccent + "22", border: `1px solid ${corAccent}55`,
            color: corAccent, padding: "8px 16px", borderRadius: 6, cursor: "pointer",
            fontSize: 13, fontWeight: 700, fontFamily: t.fontTitle }}>
          Continuar →
        </button>
        <button onClick={() => { setFase(0); setPalavra(""); }}
          style={S.btnGhost}>Cancelar</button>
      </div>
    </div>
  );

  // fase 2: digitar palavra de confirmação
  return (
    <div style={{ background: corAccent + "08", border: `2px solid ${corAccent}55`,
      borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontWeight: 700, color: corAccent, marginBottom: 8, fontSize: 14 }}>
        Confirmação final
      </div>
      <div style={{ color: t.textMuted, fontSize: 12, marginBottom: 10, lineHeight: 1.6 }}>
        Para confirmar, digite <strong style={{ color: t.textPrimary, fontFamily: "monospace",
          letterSpacing: 2 }}>{confirmWord}</strong> no campo abaixo:
      </div>
      <input
        value={palavra} onChange={e => setPalavra(e.target.value)}
        placeholder={`Digite ${confirmWord}`}
        style={{ ...S.input, border: `1px solid ${errada && palavra ? corAccent + "88" : t.borderInput}`,
          letterSpacing: 2, fontFamily: "monospace", marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { if (!errada) { onConfirmar(); setFase(0); setPalavra(""); } }}
          disabled={errada}
          style={{ background: errada ? t.bgHover : corAccent, color: errada ? t.textDisabled : "#fff",
            border: "none", padding: "9px 18px", borderRadius: 7,
            cursor: errada ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700,
            fontFamily: t.fontTitle, transition: "all 0.2s" }}>
          Confirmar
        </button>
        <button onClick={() => { setFase(0); setPalavra(""); }} style={S.btnGhost}>Cancelar</button>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
function TelaConfiguracoes({ adminConfig, setAdminConfig, setOrganizadores, setAtletasUsuarios, setFuncionarios, setTreinadores }) {
  const t = useTema();
  const s = useStylesResponsivos(getS(t));
  const { usuarioLogado, setUsuarioLogado, logout, atualizarSenha, perfisDisponiveis, gerarSenhaTemp } = useAuth();
  const { equipes, atualizarEquipePerfil, atletas, inscricoes, resultados, atualizarAtleta, eventos, atualizarCamposEvento, excluirInscricao } = useEvento();
  const { setTela, registrarAcao, organizadores, atletasUsuarios, funcionarios, treinadores, siteBranding, setSiteBranding, exportarDados, importarDados, solicitacoesPortabilidade, adicionarSolicitacaoPortabilidade, editarOrganizadorAdmin, selecionarOrganizador } = useApp();
  const [aba, setAba]           = useState("dados");
  const [feedback, setFeedback] = useState("");
  const [erro, setErro]         = useState("");

  // Redes sociais form
  const [formRede, setFormRede] = useState({ rede: "instagram", label: "", url: "", emoji: "", ordem: 1, ativo: true });
  const [editandoRedeIdx, setEditandoRedeIdx] = useState(null);
  const [erroRede, setErroRede] = useState("");

  const stores = {
    equipe:      { data: equipes,         set: atualizarEquipePerfil },
    organizador: { data: organizadores,   set: setOrganizadores },
    atleta:      { data: atletasUsuarios, set: setAtletasUsuarios },
    funcionario: { data: funcionarios,    set: setFuncionarios },
    treinador:   { data: treinadores,     set: setTreinadores },
  };
  const store = stores[usuarioLogado?.tipo];
  const isAdmin = usuarioLogado?.tipo === "admin";

  const meuRegistro = isAdmin
    ? { ...usuarioLogado } // admin: senha gerenciada pelo Firebase Auth, não existe localmente
    : (store?.data?.find(u => u.id === usuarioLogado?.id) || usuarioLogado);

  const isOrg    = usuarioLogado?.tipo === "organizador";
  const isEquipe = usuarioLogado?.tipo === "equipe";
  const isAtleta = usuarioLogado?.tipo === "atleta";
  const usaCnpj  = isOrg || isEquipe;

  const [formDados, setFormDados] = useState({
    nome: meuRegistro?.nome || "", email: meuRegistro?.email || "",
    cpf: meuRegistro?.cpf || "", cnpj: meuRegistro?.cnpj || "", fone: meuRegistro?.fone || "",
  });
  const [formSenha, setFormSenha] = useState({ atual: "", nova: "", confirmar: "" });

  // ── Perfil Público do Organizador ──────────────────────────────────────────
  const meuOrgPerfil = isOrg ? organizadores?.find(o => o.id === usuarioLogado?.id) : null;
  const [perfilForm, setPerfilForm] = useState({
    descricao: meuOrgPerfil?.descricao || "",
    site: meuOrgPerfil?.site || "",
    cidade: meuOrgPerfil?.cidade || "",
    estado: meuOrgPerfil?.estado || "",
    corPrimaria: meuOrgPerfil?.corPrimaria || "#1976D2",
    corSecundaria: meuOrgPerfil?.corSecundaria || "#0D47A1",
    instagram: meuOrgPerfil?.redesSociais?.instagram || "",
    facebook: meuOrgPerfil?.redesSociais?.facebook || "",
    twitter: meuOrgPerfil?.redesSociais?.twitter || "",
  });
  const [perfilUploading, setPerfilUploading] = useState(false);
  const [perfilSalvo, setPerfilSalvo] = useState(false);
  const [bannerParaCortar, setBannerParaCortar] = useState(null);
  const [logoFooterParaCortar, setLogoFooterParaCortar] = useState(null);

  // ── Diagnóstico Firebase ────────────────────────────────────────────────────
  const [diagAba, setDiagAba] = useState("storage");
  const [diagRodando, setDiagRodando] = useState(false);
  const [diagStorage, setDiagStorage] = useState(null);
  const [diagFirestore, setDiagFirestore] = useState(null);
  const [diagAuth, setDiagAuth] = useState(null);
  const [diagOrfaos, setDiagOrfaos] = useState(null);
  const [deletandoOrfao, setDeletandoOrfao] = useState(null);

  const extrairStoragePath = (url) => {
    if (!url || typeof url !== "string") return null;
    const match = url.match(/\/o\/(.+?)(\?|$)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  const testarUrl = async (url) => {
    try {
      const path = extrairStoragePath(url);
      if (!path) return { ok: false, motivo: "URL inválida" };
      await getDownloadURL(storageRef(storage, path));
      return { ok: true };
    } catch (err) {
      if (err?.code === "storage/object-not-found") return { ok: false, motivo: "Arquivo não encontrado" };
      if (err?.code === "storage/unauthorized") return { ok: true };
      return { ok: false, motivo: err?.message || "Erro desconhecido" };
    }
  };

  const diagnosticarStorage = useCallback(async () => {
    setDiagRodando(true);
    setDiagStorage(null);
    const itens = [];
    for (const ev of (eventos || [])) {
      for (const campo of ["logoCompeticao", "logoCabecalho", "logoCabecalhoDireito", "logoRodape", "logoPortalSecao", "regulamentoUrl"]) {
        if (ev[campo] && typeof ev[campo] === "string" && ev[campo].startsWith("http")) {
          const res = await testarUrl(ev[campo]);
          itens.push({ tipo: "Evento", nome: ev.nome || ev.id, campo, url: ev[campo], ...res });
        }
      }
    }
    for (const org of (organizadores || [])) {
      for (const campo of ["logo", "banner", "favicon"]) {
        if (org[campo] && typeof org[campo] === "string" && org[campo].startsWith("http")) {
          const res = await testarUrl(org[campo]);
          itens.push({ tipo: "Organizador", nome: org.nome || org.id, campo, url: org[campo], ...res });
        }
      }
    }
    if (siteBranding) {
      for (const campo of ["logoFooter"]) {
        if (siteBranding[campo] && typeof siteBranding[campo] === "string" && siteBranding[campo].startsWith("http")) {
          const res = await testarUrl(siteBranding[campo]);
          itens.push({ tipo: "Branding", nome: "Site", campo, url: siteBranding[campo], ...res });
        }
      }
      if (Array.isArray(siteBranding.redesSociais)) {
        for (const rede of siteBranding.redesSociais) {
          if (rede.iconeUrl && typeof rede.iconeUrl === "string" && rede.iconeUrl.startsWith("http")) {
            const res = await testarUrl(rede.iconeUrl);
            itens.push({ tipo: "Branding", nome: `Rede: ${rede.nome || "?"}`, campo: "iconeUrl", url: rede.iconeUrl, ...res });
          }
        }
      }
      if (siteBranding.assinaturasFederacao && typeof siteBranding.assinaturasFederacao === "object") {
        for (const [uf, url] of Object.entries(siteBranding.assinaturasFederacao)) {
          if (url && typeof url === "string" && url.startsWith("http")) {
            const res = await testarUrl(url);
            itens.push({ tipo: "Branding", nome: `Assinatura ${uf}`, campo: "assinaturaFederacao", url, ...res });
          }
        }
      }
    }
    for (const eq of (equipes || [])) {
      for (const campo of ["logo", "escudo"]) {
        if (eq[campo] && typeof eq[campo] === "string" && eq[campo].startsWith("http")) {
          const res = await testarUrl(eq[campo]);
          itens.push({ tipo: "Equipe", nome: eq.nome || eq.id, campo, url: eq[campo], ...res });
        }
      }
    }
    setDiagStorage(itens);
    setDiagRodando(false);
  }, [eventos, organizadores, siteBranding, equipes]);

  const diagnosticarFirestore = useCallback(async () => {
    setDiagRodando(true);
    setDiagFirestore(null);
    const problemas = [];
    const atletaIds = new Set((atletas || []).map(a => a.id));
    const equipeIds = new Set((equipes || []).map(eq => eq.id));
    const eventoIds = new Set((eventos || []).map(ev => ev.id));
    for (const ins of (inscricoes || [])) {
      if (ins.atletaId && !atletaIds.has(ins.atletaId)) problemas.push({ colecao: "inscricoes", docId: ins.id, campo: "atletaId", valor: ins.atletaId, problema: "Atleta inexistente" });
      if (ins.eventoId && !eventoIds.has(ins.eventoId)) problemas.push({ colecao: "inscricoes", docId: ins.id, campo: "eventoId", valor: ins.eventoId, problema: "Evento inexistente" });
      if (ins.equipeId && !equipeIds.has(ins.equipeId)) problemas.push({ colecao: "inscricoes", docId: ins.id, campo: "equipeId", valor: ins.equipeId, problema: "Equipe inexistente" });
    }
    for (const atl of (atletas || [])) {
      if (atl.equipeId && !equipeIds.has(atl.equipeId)) problemas.push({ colecao: "atletas", docId: atl.id, campo: "equipeId", valor: atl.equipeId, problema: "Equipe inexistente", extra: atl.nome });
    }
    for (const [docId, doc] of Object.entries(resultados || {})) {
      const partes = docId.split("_");
      const evId = partes[0];
      if (evId && !eventoIds.has(evId)) problemas.push({ colecao: "resultados", docId, campo: "eventoId", valor: evId, problema: "Evento inexistente" });
    }
    const chaves = new Map();
    for (const ins of (inscricoes || [])) {
      if (ins.tipo === "revezamento") continue;
      const chave = `${ins.atletaId}_${ins.provaId}_${ins.eventoId}_${ins.categoriaId}_${ins.sexo}`;
      if (chaves.has(chave)) problemas.push({ colecao: "inscricoes", docId: ins.id, campo: "duplicata", valor: chave, problema: `Duplicata de ${chaves.get(chave)}` });
      else chaves.set(chave, ins.id);
    }
    setDiagFirestore(problemas);
    setDiagRodando(false);
  }, [atletas, equipes, eventos, inscricoes, resultados]);

  const diagnosticarAuth = useCallback(async () => {
    setDiagRodando(true);
    setDiagAuth(null);
    const problemas = [];
    for (const org of (organizadores || [])) {
      if (!org.email) problemas.push({ tipo: "Organizador", nome: org.nome || org.id, problema: "Sem email cadastrado" });
      if (org.dadosExcluidosEm) problemas.push({ tipo: "Organizador", nome: org.nome || org.id, problema: `Dados excluídos em ${new Date(org.dadosExcluidosEm).toLocaleDateString("pt-BR")} — conta Auth pode estar ativa` });
    }
    const emailsOrg = {};
    for (const org of (organizadores || [])) {
      if (!org.email) continue;
      const email = org.email.toLowerCase().trim();
      if (emailsOrg[email]) problemas.push({ tipo: "Organizador", nome: org.nome, problema: `Email duplicado: ${email} (também usado por ${emailsOrg[email]})` });
      else emailsOrg[email] = org.nome || org.id;
    }
    const emailsAtl = {};
    for (const atl of (atletas || [])) {
      if (!atl.email) continue;
      const email = atl.email.toLowerCase().trim();
      if (emailsAtl[email]) problemas.push({ tipo: "Atleta", nome: atl.nome, problema: `Email duplicado: ${email} (também usado por ${emailsAtl[email]})` });
      else emailsAtl[email] = atl.nome || atl.id;
    }
    for (const eq of (equipes || [])) {
      if (!eq.email && !eq.representanteEmail) problemas.push({ tipo: "Equipe", nome: eq.nome || eq.id, problema: "Sem email — possível conta Auth órfã se importada" });
    }
    // Buscar contas órfãs no Auth via Cloud Function
    try {
      const listOrphans = httpsCallable(functions, "listOrphanAuthUsers");
      const result = await listOrphans();
      setDiagOrfaos(result.data);
    } catch (err) {
      console.warn("[DiagAuth] Erro ao listar contas órfãs:", err.message);
      setDiagOrfaos({ orphans: [], erro: err.message });
    }
    setDiagAuth(problemas);
    setDiagRodando(false);
  }, [organizadores, atletas, equipes]);



  const uploadImagemOrg = async (file, tipo) => {
    if (!meuOrgPerfil || !editarOrganizadorAdmin) return;
    setPerfilUploading(true);
    try {
      const urlAntiga = meuOrgPerfil[tipo] || null;
      const ext = file.name ? file.name.split(".").pop() : "png";
      const newPath = `organizadores/${meuOrgPerfil.id}/${tipo}.${ext}`;
      const ref = storageRef(storage, newPath);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      editarOrganizadorAdmin({ ...meuOrgPerfil, [tipo]: url });
      // Deletar anterior SOMENTE após upload bem-sucedido
      if (urlAntiga) {
        try {
          const pathAntigo = decodeURIComponent(urlAntiga.split("/o/")[1]?.split("?")[0] || "");
          if (pathAntigo && pathAntigo !== newPath) await deleteObject(storageRef(storage, pathAntigo));
        } catch {}
      }
      setPerfilUploading(false);
    } catch (err) {
      console.error("Erro upload:", err);
      setPerfilUploading(false);
      alert("Erro ao enviar imagem. Tente novamente.");
    }
  };

  const salvarPerfilOrg = () => {
    if (!meuOrgPerfil || !editarOrganizadorAdmin) return;
    editarOrganizadorAdmin({
      ...meuOrgPerfil,
      descricao: perfilForm.descricao.trim(),
      site: perfilForm.site.trim(),
      cidade: perfilForm.cidade.trim(),
      estado: perfilForm.estado.trim().toUpperCase().slice(0, 2),
      corPrimaria: perfilForm.corPrimaria,
      corSecundaria: perfilForm.corSecundaria,
      redesSociais: {
        instagram: perfilForm.instagram.trim(),
        facebook: perfilForm.facebook.trim(),
        twitter: perfilForm.twitter.trim(),
      },
    });
    setPerfilSalvo(true);
    setTimeout(() => setPerfilSalvo(false), 3000);
  };

  // ── State da aba Incidente LGPD ──────────────────────────────────────────
  const [incTipos, setIncTipos] = useState({
    acesso_nao_autorizado: false,
    vazamento_dados: false,
    perda_dados: false,
    alteracao_indevida: false,
    outro: false,
  });
  const [incDescricao, setIncDescricao] = useState("");
  const [incDataDesc,  setIncDataDesc]  = useState("");
  const [incAfetados,  setIncAfetados]  = useState("todos");
  const [incCopiado,   setIncCopiado]   = useState("");

  const ok = (msg) => { setFeedback(msg); setTimeout(() => setFeedback(""), 4000); };

  const salvarDados = () => {
    setErro("");
    if (!formDados.nome.trim())  { setErro("Nome é obrigatório."); return; }
    if (!formDados.email.trim()) { setErro("E-mail é obrigatório."); return; }
    if (usaCnpj && !formDados.cnpj.trim()) { setErro("CNPJ é obrigatório."); return; }
    if (usaCnpj && formDados.cnpj.trim() && !validarCNPJ(formDados.cnpj)) { setErro("CNPJ inválido."); return; }
    if (!usaCnpj && !isAdmin && formDados.cpf.trim() && !validarCPF(formDados.cpf)) { setErro("CPF inválido."); return; }
    if (isAdmin) {
      setAdminConfig(prev => ({ ...prev, nome: formDados.nome.trim(), email: formDados.email.trim() }));
    } else if (store) {
      if (isEquipe) {
        atualizarEquipePerfil({ ...meuRegistro, nome: formDados.nome.trim(), email: formDados.email.trim(), cnpj: formDados.cnpj.trim(), fone: formDados.fone.trim() });
      } else {
        store.set(arr => arr.map(u => u.id === usuarioLogado.id
          ? { ...u, nome: formDados.nome.trim(), email: formDados.email.trim(), cpf: formDados.cpf.trim(), cnpj: formDados.cnpj.trim(), fone: formDados.fone.trim() }
          : u));
      }
    }
    // Atualizar sessão para refletir o novo nome em toda a aplicação (auditoria, header, etc.)
    setUsuarioLogado(u => u ? { ...u, nome: formDados.nome.trim(), email: formDados.email.trim() } : u);
    if (registrarAcao) registrarAcao(usuarioLogado.id, formDados.nome.trim(), "Editou dados pessoais",
      `Nome: ${formDados.nome}`,
      usuarioLogado.organizadorId || (isOrg ? usuarioLogado.id : null),
      { equipeId: usuarioLogado.equipeId });
    ok("Dados atualizados com sucesso!");
  };

  const salvarSenha = async () => {
    setErro("");
    if (!formSenha.atual)                          { setErro("Informe a senha atual."); return; }
    if (isAdmin) {
      if (formSenha.nova.length < 12) { setErro("A senha do administrador deve ter pelo menos 12 caracteres."); return; }
      if (!/[A-Z]/.test(formSenha.nova)) { setErro("A senha deve conter pelo menos uma letra maiúscula."); return; }
      if (!/[a-z]/.test(formSenha.nova)) { setErro("A senha deve conter pelo menos uma letra minúscula."); return; }
      if (!/[0-9]/.test(formSenha.nova)) { setErro("A senha deve conter pelo menos um número."); return; }
    } else if (formSenha.nova.length < 6) { setErro("A nova senha deve ter pelo menos 6 caracteres."); return; }
    if (formSenha.nova !== formSenha.confirmar)     { setErro("As senhas não coincidem."); return; }
    if (formSenha.nova === formSenha.atual)         { setErro("A nova senha deve ser diferente da atual."); return; }

    // Validar senha atual via Firebase Auth para todos os perfis
    try {
      const { signInWithEmailAndPassword, auth } = await import("../../firebase");
      await signInWithEmailAndPassword(auth, usuarioLogado.email, formSenha.atual);
    } catch (_) {
      setErro("Senha atual incorreta."); return;
    }
    const resultado = await atualizarSenha(usuarioLogado.tipo, usuarioLogado.id, formSenha.nova, formSenha.atual);
    if (!resultado?.ok) { setErro(resultado?.erro || "Erro ao atualizar senha."); return; }
    if (registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome, "Alterou senha", "",
      usuarioLogado.organizadorId || (isOrg ? usuarioLogado.id : null), { equipeId: usuarioLogado.equipeId });
    setFormSenha({ atual: "", nova: "", confirmar: "" });
    ok("Senha alterada com sucesso!");
  };

  // ── Revogação de Consentimento LGPD (Art. 8º §5º) ──────────────────────────
  const revogarConsentimento = async () => {
    const agora = new Date().toISOString();
    const idAnon = usuarioLogado.id.slice(-6).toUpperCase();

    // 1. Anonimizar registro no store do tipo do usuário
    const anonimizarRegistro = (arr) => arr.map(u => {
      if (u.id !== usuarioLogado.id) return u;
      return {
        ...u,
        nome:  `Atleta Anônimo ${idAnon}`,
        email: "",
        cpf:   "",
        fone:  "",
        dataNasc: "",
        lgpdConsentimentoRevogado: true,
        lgpdRevogadoEm: agora,
      };
    });

    if (store) {
      if (isEquipe) {
        atualizarEquipePerfil({
          ...meuRegistro,
          nome:  `Usuário Anônimo ${idAnon}`,
          email: "",
          fone:  "",
          lgpdConsentimentoRevogado: true,
          lgpdRevogadoEm: agora,
        });
      } else {
        store.set(anonimizarRegistro);
      }
    }

    // 2. Anonimizar registro base de atleta (mantém sexo e anoNasc para integridade histórica)
    if (atletaBase && atualizarAtleta) {
      try {
        await atualizarAtleta({
          ...atletaBase,
          nome:     `Atleta Anônimo ${idAnon}`,
          email:    "",
          cpf:      "",
          fone:     "",
          dataNasc: "",
          // anoNasc e sexo preservados — necessários para validar resultados históricos
          lgpdConsentimentoRevogado: true,
          lgpdRevogadoEm: agora,
        });
      } catch {}
    }

    // 3. Registrar a ação no histórico
    if (registrarAcao) registrarAcao(
      usuarioLogado.id,
      usuarioLogado.nome,
      "Revogou consentimento LGPD",
      `Dados anonimizados — Art. 8º §5º LGPD`,
      usuarioLogado.organizadorId || null,
      { modulo: "lgpd" }
    );

    // 4. Logout imediato
    logout();
  };

  const tipoLabel = { admin: "Administrador", organizador: "Organizador", equipe: "Equipe", funcionario: "Funcionário", treinador: "Treinador", atleta: "Atleta" };
  const orgVinculado    = usuarioLogado?.tipo === "funcionario" ? organizadores?.find(o => o.id === usuarioLogado.organizadorId)?.nome : null;
  const equipeVinculada = usuarioLogado?.tipo === "treinador"  ? equipes?.find(e => e.id === usuarioLogado.equipeId)?.nome : usuarioLogado?.tipo === "equipe" ? meuRegistro?.nome : null;

  const tabStyle = (tab) => ({
    padding: "8px 18px", border: "none", cursor: "pointer", fontSize: 13,
    fontFamily: t.fontBody, fontWeight: aba === tab ? 700 : 400,
    background: aba === tab ? t.accent : t.bgHover,
    color: aba === tab ? "#fff" : t.textMuted, borderRadius: 6,
  });

  const voltar = () => {
    const mapa = { admin: "admin", atleta: "painel-atleta", organizador: "painel-organizador", funcionario: "painel-organizador", equipe: "painel-equipe", treinador: "painel-equipe" };
    setTela(mapa[usuarioLogado?.tipo] || "home");
  };

  // ── Dados para aba "conta" ───────────────────────────────────────────────
  // Perfis disponíveis para esse usuário (do login)
  const outrosPerfis = (perfisDisponiveis || []).filter(p => p.dados?.id !== usuarioLogado?.id || p.tipo !== usuarioLogado?.tipo);
  const temOutrosPerfis = usuarioLogado?._temOutrosPerfis || outrosPerfis.length > 0;

  // Dados históricos do atleta
  const atletaBase = isAtleta ? (atletas || []).find(a =>
    a.atletaUsuarioId === usuarioLogado?.id ||
    (a.cpf && usuarioLogado?.cpf && a.cpf.replace(/\D/g,"") === usuarioLogado.cpf.replace(/\D/g,"")) ||
    (a.email && usuarioLogado?.email && a.email.toLowerCase() === usuarioLogado.email.toLowerCase())
  ) : null;
  const nInscricoes = atletaBase ? (inscricoes || []).filter(i => i.atletaId === atletaBase.id).length : 0;

  // Org atual
  const orgAtual = usuarioLogado?.organizadorId
    ? organizadores?.find(o => o.id === usuarioLogado.organizadorId)
    : null;

  return (
    <div style={s.page}>
      <div style={s.painelHeader}>
        <div>
          <h1 style={s.pageTitle}>Configurações da Conta</h1>
          <div style={{ color: t.textDimmed, fontSize: 13 }}>
            {tipoLabel[usuarioLogado?.tipo] || "Usuário"} · {meuRegistro?.nome || "—"}
          </div>
        </div>
        <button style={s.btnGhost} onClick={voltar}>← Voltar</button>
      </div>

      {feedback && <div style={s.okBox}>{feedback}</div>}
      {erro     && <div style={s.errBox}>{erro}</div>}

      <div style={s.tabBar}>
        <button style={tabStyle("dados")} onClick={() => { setAba("dados"); setErro(""); }}>Dados Pessoais</button>
        <button style={tabStyle("senha")} onClick={() => { setAba("senha"); setErro(""); }}>Alterar Senha</button>
        {!isAdmin && <button style={tabStyle("conta")} onClick={() => { setAba("conta"); setErro(""); }}>Minha Conta</button>}
        {isOrg    && <button style={tabStyle("perfil")} onClick={() => { setAba("perfil"); setErro(""); }}>Perfil Público</button>}
        {isAdmin  && <button style={tabStyle("aparencia")} onClick={() => { setAba("aparencia"); setErro(""); }}>Configurações Avançadas</button>}
        {isAdmin  && <button style={tabStyle("ropa")} onClick={() => { setAba("ropa"); setErro(""); }}>ROPA</button>}
        {isAdmin  && <button style={tabStyle("incidente")} onClick={() => { setAba("incidente"); setErro(""); }}>Incidente LGPD</button>}
        {isAdmin  && <button style={tabStyle("diagnostico")} onClick={() => { setAba("diagnostico"); setErro(""); }}>Diagnóstico Firebase</button>}
      </div>

      {/* ── ABA: DADOS PESSOAIS ─────────────────────────────────────────── */}
      {aba === "dados" && (
        <div style={{ ...s.card, maxWidth: 520 }}>
          <h3 style={s.sectionTitle}>Editar Dados Pessoais</h3>
          <FormField label="Nome *"    value={formDados.nome}  onChange={v => setFormDados({ ...formDados, nome: v })} placeholder="Seu nome completo" />
          <FormField label="E-mail *"  value={formDados.email} onChange={v => setFormDados({ ...formDados, email: v })} type="email" placeholder="seu@email.com" />
          {!isAdmin && (usaCnpj
            ? <FormField label="CNPJ *" value={formDados.cnpj} onChange={v => setFormDados({ ...formDados, cnpj: v })} placeholder="00.000.000/0001-00" />
            : <FormField label="CPF"    value={formDados.cpf}  onChange={v => setFormDados({ ...formDados, cpf: v })}  placeholder="000.000.000-00" />
          )}
          {!isAdmin && <FormField label="Telefone" value={formDados.fone} onChange={v => setFormDados({ ...formDados, fone: v })} placeholder="(00) 00000-0000" />}
          <button style={{ ...s.btnPrimary, marginTop: 12 }} onClick={salvarDados}>Salvar Dados</button>
        </div>
      )}

      {/* ── ABA: SENHA ──────────────────────────────────────────────────── */}
      {aba === "senha" && (
        <div style={{ ...s.card, maxWidth: 520 }}>
          <h3 style={s.sectionTitle}>Alterar Senha</h3>
          <FormField label="Senha Atual *"          value={formSenha.atual}     onChange={v => setFormSenha({ ...formSenha, atual: v })}     type="password" placeholder="Digite sua senha atual" />
          <FormField label="Nova Senha *"           value={formSenha.nova}      onChange={v => setFormSenha({ ...formSenha, nova: v })}      type="password" placeholder={isAdmin ? "Mínimo 12 caracteres (maiúscula, minúscula e número)" : "Mínimo 6 caracteres"} />
          <FormField label="Confirmar Nova Senha *" value={formSenha.confirmar} onChange={v => setFormSenha({ ...formSenha, confirmar: v })} type="password" placeholder="Repita a nova senha" />
          <button style={{ ...s.btnPrimary, marginTop: 12 }} onClick={salvarSenha}>Alterar Senha</button>
        </div>
      )}

      {/* ── ABA: MINHA CONTA ────────────────────────────────────────────── */}
      {aba === "conta" && (
        <div style={{ maxWidth: 600 }}>
          {/* Info da conta */}
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Informações da Conta</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { label: "Tipo de conta", value: tipoLabel[usuarioLogado?.tipo] || "—", color: t.accent },
                { label: "Nome",          value: meuRegistro?.nome  || "—" },
                { label: "E-mail",        value: meuRegistro?.email || "—" },
                orgVinculado    ? { label: "Organização",    value: orgVinculado }    : null,
                orgAtual        ? { label: "Org. atual",     value: orgAtual.entidade || orgAtual.nome } : null,
                equipeVinculada ? { label: "Equipe",         value: equipeVinculada } : null,
                meuRegistro?.dataCadastro ? { label: "Membro desde", value: new Date(meuRegistro.dataCadastro).toLocaleDateString("pt-BR") } : null,
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={s.row}>
                  <span style={{ color: t.textMuted, fontSize: 13 }}>{row.label}</span>
                  <span style={{ color: row.color || t.textPrimary, fontWeight: row.color ? 700 : 400, fontSize: 13 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Perfis disponíveis */}
            {temOutrosPerfis && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                  Outros Perfis Vinculados
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(perfisDisponiveis || []).map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10,
                      background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 7, padding: "8px 12px" }}>
                      <span style={{ fontSize: 18 }}>{p.icon}</span>
                      <div>
                        <div style={{ color: p.dados?.id === usuarioLogado?.id && p.tipo === usuarioLogado?.tipo ? t.accent : t.textPrimary, fontSize: 13, fontWeight: 600 }}>
                          {p.label}
                          {p.dados?.id === usuarioLogado?.id && p.tipo === usuarioLogado?.tipo &&
                            <span style={{ marginLeft: 8, fontSize: 10, color: t.accent }}>(atual)</span>}
                        </div>
                        <div style={{ color: t.textDimmed, fontSize: 11 }}>{p.sublabel}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dados históricos */}
            {isAtleta && atletaBase && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                  Histórico Esportivo
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.accentBorder}`, borderRadius: 7, padding: "10px 16px", textAlign: "center" }}>
                    <div style={{ fontFamily: t.fontTitle, fontSize: 28, fontWeight: 900, color: t.accent, lineHeight: 1 }}>{nInscricoes}</div>
                    <div style={{ fontSize: 11, color: t.textDimmed, marginTop: 3 }}>Inscrição(ões)</div>
                  </div>
                  <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.border}`, borderRadius: 7, padding: "10px 16px", fontSize: 12, color: t.textMuted, display: "flex", flexDirection: "column", gap: 3, justifyContent: "center" }}>
                    <div>Sexo: <strong style={{ color: t.textPrimary }}>{atletaBase.sexo === "M" ? "Masc." : "Fem."}</strong></div>
                    <div>Ano nasc.: <strong style={{ color: t.textPrimary }}>{atletaBase.anoNasc || "—"}</strong></div>
                    {atletaBase.clube && <div>Equipe: <strong style={{ color: t.accent }}>{atletaBase.clube}</strong></div>}
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: t.textDimmed, lineHeight: 1.6 }}>
                  Inscrições e resultados oficiais são registros permanentes das competições e não são afetados pelas opções de exclusão de conta abaixo.
                </div>
              </div>
            )}
          </div>

          {/* ── CONTA GOOGLE ──────────────────────────────────────────────── */}
          {!isAdmin && (() => {
            const googleLinked = auth.currentUser?.providerData?.some(p => p.providerId === "google.com");
            const googleEmail = auth.currentUser?.providerData?.find(p => p.providerId === "google.com")?.email;
            return (
              <div style={s.card}>
                <h3 style={s.sectionTitle}>Conta Google</h3>
                {googleLinked ? (
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      <span style={{ color:t.textSecondary, fontSize:13 }}>Vinculada: <strong style={{ color:t.textPrimary }}>{googleEmail}</strong></span>
                    </div>
                    <button style={{ ...s.btnGhost, fontSize:12 }} onClick={async () => {
                      try {
                        const { unlink } = await import("../../firebase");
                        await unlink(auth.currentUser, "google.com");
                        ok("Conta Google desvinculada.");
                      } catch (err) { setErro("Erro ao desvincular: " + err.message); }
                    }}>Desvincular Google</button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize:13, color:t.textMuted, marginBottom:12, lineHeight:1.6 }}>
                      Vincule sua conta Google para fazer login mais rapidamente.
                      {meuRegistro?.email && <><br/>Pode ser qualquer conta Google — não precisa ser o mesmo e-mail do cadastro.</>}
                    </p>
                    <button style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 20px", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily: t.fontBody, color:t.textSecondary, display:"flex", alignItems:"center", gap:10 }}
                      onClick={async () => {
                        try {
                          const { linkWithPopup, googleProvider } = await import("../../firebase");
                          const result = await linkWithPopup(auth.currentUser, googleProvider);
                          const gEmail = result.user.providerData.find(p => p.providerId === "google.com")?.email;
                          // Salvar googleEmail no perfil para login futuro com email diferente
                          if (gEmail && store) {
                            store.set(arr => Array.isArray(arr) ? arr.map(u => u.id === usuarioLogado.id ? { ...u, googleEmail: gEmail } : u) : arr);
                          }
                          ok("Conta Google vinculada com sucesso!");
                        } catch (err) {
                          if (err.code === "auth/credential-already-in-use") setErro("Esta conta Google já está vinculada a outro usuário.");
                          else if (err.code === "auth/popup-closed-by-user") { /* fechou popup */ }
                          else setErro("Erro ao vincular: " + err.message);
                        }
                      }}>
                      <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Vincular conta Google
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── STATUS DO CONSENTIMENTO LGPD ───────────────────────────────── */}
          {!isAdmin && (
            <div style={{ ...s.card, borderColor: meuRegistro?.lgpdConsentimentoRevogado ? `${t.danger}55` : `${t.accent}33`,
              background: meuRegistro?.lgpdConsentimentoRevogado ? `${t.danger}08` : t.accentBg }}>
              <h3 style={{ ...s.sectionTitle, color: meuRegistro?.lgpdConsentimentoRevogado ? t.danger : t.accent }}>
                Consentimento LGPD
              </h3>

              {/* Status atual */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 16 }}>
                {[
                  {
                    label: "Status",
                    value: meuRegistro?.lgpdConsentimentoRevogado ? "Revogado" : "Ativo",
                    color: meuRegistro?.lgpdConsentimentoRevogado ? t.danger : t.success,
                  },
                  meuRegistro?.lgpdConsentimentoData ? {
                    label: "Consentimento dado em",
                    value: new Date(meuRegistro.lgpdConsentimentoData).toLocaleString("pt-BR"),
                  } : null,
                  meuRegistro?.lgpdVersao ? {
                    label: "Versão da política",
                    value: `v${meuRegistro.lgpdVersao}`,
                  } : null,
                  meuRegistro?.lgpdRevogadoEm ? {
                    label: "Revogado em",
                    value: new Date(meuRegistro.lgpdRevogadoEm).toLocaleString("pt-BR"),
                    color: t.danger,
                  } : null,
                ].filter(Boolean).map((row, i) => (
                  <div key={i} style={s.row}>
                    <span style={{ color: t.textMuted, fontSize: 13 }}>{row.label}</span>
                    <span style={{ color: row.color || t.textPrimary, fontWeight: row.color ? 700 : 400, fontSize: 13 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Explicação dos direitos */}
              <div style={{ background: t.bgHeaderSolid, border: `1px solid ${t.accentBg}`, borderRadius: 8,
                padding: "12px 14px", marginBottom: 16, fontSize: 12, color: t.textMuted, lineHeight: 1.7 }}>
                <strong style={{ color: t.accent }}>Seus direitos (Art. 18º LGPD):</strong> Você pode revogar
                este consentimento a qualquer momento. Ao revogar, seus dados pessoais (nome, CPF, e-mail, telefone)
                serão <strong style={{ color: t.textPrimary }}>anonimizados</strong> e seu acesso será encerrado.
                <br/>
                <strong style={{ color: t.success }}>Seus resultados e inscrições em competições anteriores
                são preservados</strong> como registros históricos anônimos — conforme Art. 8º §5º e Art. 16 da LGPD
                e obrigações dos regulamentos esportivos.
              </div>

              {/* Botão de revogação — só mostra se consentimento ainda ativo */}
              {!meuRegistro?.lgpdConsentimentoRevogado && (
                <ExclusaoConfirmada
                  titulo="Revogar Consentimento LGPD"
                  descricao={`Ao revogar, as seguintes ações serão executadas imediatamente:<br/><br/>
                    <strong style="color:#fff">Será anonimizado:</strong><br/>
                    • Seu nome → "Atleta Anônimo"<br/>
                    • CPF, e-mail e telefone → removidos<br/>
                    • Seu acesso ao sistema será encerrado<br/><br/>
                    <strong style="color:#7acc44">Será preservado (Art. 8º §5º LGPD):</strong><br/>
                    • Todos os seus resultados em competições anteriores<br/>
                    • Todas as suas inscrições históricas (como registro anônimo)<br/>
                    • Ano de nascimento e sexo (para integridade das categorias)<br/><br/>
                    <strong style="color:#ffaa44">Esta ação não pode ser desfeita.</strong>`}
                  corAccent="#ffaa44"
                  btnLabel="Revogar Consentimento LGPD..."
                  confirmWord="REVOGAR"
                  onConfirmar={revogarConsentimento}
                />
              )}

              {/* Já revogado */}
              {meuRegistro?.lgpdConsentimentoRevogado && (
                <div style={{ background: `${t.warning}11`, border: `1px solid ${t.warning}55`, borderRadius: 8,
                  padding: "10px 14px", fontSize: 12, color: t.warning, lineHeight: 1.6 }}>
                  Seu consentimento já foi revogado. Seus dados estão anonimizados.
                  Para reativar o uso do sistema, será necessário realizar um novo cadastro.
                </div>
              )}
            </div>
          )}

          {/* ── PORTABILIDADE DE DADOS (Art. 18º, V LGPD) ──────────────────── */}
          {!isAdmin && (
            <div style={{ ...s.card, borderColor: t.accentBorder }}>
              <h3 style={s.sectionTitle}>Portabilidade dos Meus Dados</h3>
              <p style={{ color:t.textDimmed, fontSize:13, marginBottom:14, lineHeight:1.6 }}>
                Conforme o <strong style={{ color:t.textPrimary }}>Art. 18º, V da LGPD</strong>, você tem direito a receber
                uma cópia dos seus dados pessoais em formato estruturado. A solicitação será analisada pelo
                administrador em até <strong style={{ color:t.textPrimary }}>15 dias</strong>.
              </p>

              {(() => {
                const minhasSol = (solicitacoesPortabilidade || [])
                  .filter(sol => sol.usuarioId === usuarioLogado?.id)
                  .sort((a, b) => new Date(b.data) - new Date(a.data));
                const solPendente = minhasSol.find(sol => sol.status === "pendente");
                const solPronta   = minhasSol.find(sol => sol.status === "pronto");

                if (solPronta) return (
                  <div>
                    <div style={{ background:`${t.success}15`, border:`1px solid ${t.success}66`, borderRadius:8,
                      padding:"12px 16px", marginBottom:12, fontSize:13, color:t.success }}>
                      Seu arquivo está pronto! Solicitação aprovada em{" "}
                      {new Date(solPronta.dataResolucao).toLocaleString("pt-BR")}.
                    </div>
                    <button style={s.btnPrimary} onClick={() => {
                      const blob = new Blob([solPronta.dadosJson], { type: "application/json" });
                      const url  = URL.createObjectURL(blob);
                      const a    = document.createElement("a");
                      a.href     = url;
                      a.download = `meus-dados-gerentrack-${new Date().toISOString().slice(0,10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      if (registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome,
                        "Baixou portabilidade de dados", "", null, { modulo: "lgpd" });
                    }}>
                      Baixar Meus Dados (JSON)
                    </button>
                  </div>
                );

                if (solPendente) return (
                  <div style={{ background:t.accentBg, border:`1px solid ${t.accent}44`, borderRadius:8,
                    padding:"12px 16px", fontSize:13, color:t.accent }}>
                    Solicitação enviada em {new Date(solPendente.data).toLocaleString("pt-BR")}.
                    O administrador irá processar em até 15 dias.
                  </div>
                );

                return (
                  <button style={s.btnSecondary} onClick={() => {
                    if (!adicionarSolicitacaoPortabilidade) return;
                    adicionarSolicitacaoPortabilidade({
                      usuarioId:   usuarioLogado.id,
                      usuarioNome: usuarioLogado.nome || meuRegistro?.nome || "",
                      usuarioTipo: usuarioLogado.tipo,
                      email:       meuRegistro?.email || usuarioLogado.email || "",
                    });
                    if (registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome,
                      "Solicitou portabilidade de dados", "", null, { modulo: "lgpd" });
                    ok("Solicitação enviada! O administrador irá processar em até 15 dias.");
                  }}>
                    Solicitar Exportação dos Meus Dados
                  </button>
                );
              })()}
            </div>
          )}

          {/* ── ZONA DE PERIGO ─────────────────────────────────────────────── */}
          <div style={{ background: `${t.danger}08`, border: `2px solid ${t.danger}33`, borderRadius: 12, padding: "20px 24px" }}>
            <h3 style={{ color: t.danger, fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Zona de Perigo</h3>
            <p style={{ color: t.textDimmed, fontSize: 12, marginBottom: 20, lineHeight: 1.6 }}>
              Ações irreversíveis relacionadas ao seu acesso ao sistema.
              Leia cada opção com atenção antes de prosseguir.
            </p>

            {/* OPÇÃO 1: Excluir perfil atual */}
            <div style={{ background: `${t.danger}08`, border: `1px solid ${t.danger}33`, borderRadius: 10,
              padding: "16px 18px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 24, flexShrink: 0, color: t.danger }}>&#x2716;</span>
                <div>
                  <div style={{ color: t.danger, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    Excluir este Perfil
                    {orgAtual && <span style={{ marginLeft: 8, fontSize: 11, color: t.danger,
                      background: `${t.danger}15`, border: `1px solid ${t.danger}33`, borderRadius: 4, padding: "1px 8px" }}>
                      {orgAtual.entidade || orgAtual.nome}
                    </span>}
                  </div>
                  <div style={{ color: t.textMuted, fontSize: 13, lineHeight: 1.7 }}>
                    Remove <strong style={{ color: t.textPrimary }}>apenas o seu acesso</strong> vinculado a{" "}
                    <strong style={{ color: t.danger }}>
                      {orgAtual ? `"${orgAtual.entidade || orgAtual.nome}"` : "esta organização"}
                    </strong>.
                  </div>
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {[
                      { ico: "\u2022", txt: "Seu acesso de login nesta organização será removido", color: t.success },
                      temOutrosPerfis
                        ? { ico: "\u2022", txt: "Seus outros perfis continuarão funcionando normalmente", color: t.success }
                        : null,
                      { ico: "\u2022", txt: "Inscrições e resultados históricos são preservados integralmente", color: t.success },
                      { ico: "\u2022", txt: "Seu registro de atleta não é alterado", color: t.success },
                    ].filter(Boolean).map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 6, fontSize: 12, color: t.textMuted }}>
                        <span style={{ color: item.color || t.textMuted }}>{item.ico}</span><span>{item.txt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <ExclusaoConfirmada
                titulo={`Excluir perfil em "${orgAtual?.entidade || orgAtual?.nome || "esta organização"}"`}
                descricao={`Você perderá o acesso a esta organização.<br/><br/>
                  <strong style="color:#fff">O que será removido:</strong><br/>
                  • Seu login nesta organização específica<br/><br/>
                  <strong style="color:#fff">O que NÃO será afetado:</strong><br/>
                  ${temOutrosPerfis ? "• Seus outros perfis em outras organizações<br/>" : ""}
                  • Todas as suas inscrições em competições<br/>
                  • Todos os seus resultados oficiais<br/>
                  • Seu cadastro de atleta`}
                corAccent="#ff6b6b"
                btnLabel="Excluir este Perfil..."
                confirmWord="EXCLUIR"
                onConfirmar={() => {
                  if (store) store.set(arr => arr.filter(u => u.id !== usuarioLogado.id));
                  logout();
                }}
              />
            </div>

            {/* OPÇÃO 2: Excluir todos os perfis (só mostra se atleta ou se tem múltiplos perfis) */}
            {(isAtleta || temOutrosPerfis) && (
              <div style={{ background: `${t.danger}08`, border: `1px solid ${t.danger}55`, borderRadius: 10,
                padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 24, flexShrink: 0, color: t.danger }}>&#x2716;</span>
                  <div>
                    <div style={{ color: t.danger, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                      Excluir Todos os Perfis e Sair do Sistema
                    </div>
                    <div style={{ color: t.textMuted, fontSize: 13, lineHeight: 1.7 }}>
                      Remove <strong style={{ color: t.textPrimary }}>todos os seus acessos</strong> em todas as organizações
                      e <strong style={{ color: t.textPrimary }}>anonimiza seus dados pessoais</strong>.
                    </div>
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                      {[
                        { ico: "\u2022", txt: "Todos os seus perfis de login serão excluídos", color: t.danger },
                        { ico: "\u2022", txt: "Seus dados pessoais (nome, CPF, e-mail, telefone) serão anonimizados", color: t.danger },
                        { ico: "\u2022", txt: "Inscrições e resultados históricos são preservados como registros anônimos — obrigação dos regulamentos esportivos", color: t.success },
                        { ico: "\u2022", txt: "Nenhum resultado oficial de competição é apagado", color: t.success },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, fontSize: 12, color: t.textMuted }}>
                          <span style={{ color: item.color || t.textMuted }}>{item.ico}</span><span>{item.txt}</span>
                        </div>
                      ))}
                    </div>
                    {nInscricoes > 0 && (
                      <div style={{ marginTop: 10, background: `${t.warning}11`, border: `1px solid ${t.warning}55`,
                        borderRadius: 7, padding: "8px 12px", fontSize: 12, color: t.warning }}>
                        Você tem <strong>{nInscricoes} inscrição(ões) oficial(is)</strong>.
                        Elas serão preservadas como "Atleta Excluído" para integridade do histórico da competição.
                      </div>
                    )}
                  </div>
                </div>
                <ExclusaoConfirmada
                  titulo="Excluir TODOS os perfis e anonimizar dados"
                  descricao={`Esta ação removerá <strong>permanentemente</strong> todos os seus acessos ao sistema.<br/><br/>
                    <strong style="color:#fff">Será removido:</strong><br/>
                    • Todos os perfis (atleta, organizador, funcionário, treinador)<br/>
                    • Nome, CPF, e-mail e telefone do seu cadastro de atleta<br/><br/>
                    <strong style="color:#fff">Será preservado:</strong><br/>
                    • ${nInscricoes} inscrição(ões) oficial(is) em competições (anonimizadas)<br/>
                    • Todos os resultados de competições (anonimizados)<br/><br/>
                    <strong style="color:#ff8888">Esta ação não pode ser desfeita.</strong>`}
                  corAccent="#ff4444"
                  btnLabel="Excluir Todos os Perfis e Sair do Sistema..."
                  confirmWord="EXCLUIR TUDO"
                  onConfirmar={async () => {
                    const agora = new Date().toISOString();
                    const idAnon = usuarioLogado.id.slice(-6).toUpperCase();
                    const email = usuarioLogado?.email?.toLowerCase();
                    const cpf = usuarioLogado?.cpf?.replace(/\D/g, "");

                    // Remover de todos os stores por id, email ou cpf
                    const match = (u) =>
                      u.id === usuarioLogado.id ||
                      (email && u.email && u.email.toLowerCase() === email) ||
                      (cpf && u.cpf && u.cpf.replace(/\D/g, "") === cpf);

                    Object.values(stores).forEach(st => {
                      if (st?.set) {
                        try { st.set(arr => Array.isArray(arr) ? arr.filter(u => !match(u)) : arr); } catch {}
                      }
                    });

                    // Anonimizar atleta base se existir
                    if (atletaBase && atualizarAtleta) {
                      try {
                        await atualizarAtleta({
                          ...atletaBase,
                          nome: `Atleta Anônimo ${idAnon}`,
                          email: "", cpf: "", fone: "", dataNasc: "",
                          lgpdConsentimentoRevogado: true,
                          lgpdRevogadoEm: agora,
                        });
                      } catch {}
                    }

                    if (registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome,
                      "Excluiu todos os perfis", "Todos os perfis removidos",
                      usuarioLogado.organizadorId || null, { modulo: "lgpd" });

                    logout();
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── ABA: PERFIL PÚBLICO (organizador only) ──────────────────────────── */}
      {aba === "perfil" && isOrg && meuOrgPerfil && (
        <div style={{ maxWidth: 700 }}>
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Perfil Público</h3>
            <div style={{ fontSize: 13, color: t.textDimmed, marginBottom: 16, lineHeight: 1.6 }}>
              Configure as informações que aparecem na sua página pública.
              {meuOrgPerfil.slug && (
                <span style={{ display: "block", marginTop: 4 }}>
                  Sua URL: <strong style={{ color: t.accent }}>gerentrack.com.br/{meuOrgPerfil.slug}</strong>
                </span>
              )}
            </div>

            {perfilSalvo && <div style={s.okBox}>✓ Perfil salvo com sucesso!</div>}

            {/* Logo + Banner */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Logo</div>
                <div style={{ width: 90, height: 90, borderRadius: 14, overflow: "hidden", border: `2px solid ${(meuOrgPerfil.corPrimaria || t.accent)}33`, background: t.bgCardAlt, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                  {meuOrgPerfil.logo ? <img loading="lazy" src={meuOrgPerfil.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: 14, opacity: 0.3, color: t.textDisabled }}>Sem logo</span>}
                </div>
                <label style={{ background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontSize: 12, color: t.textTertiary }}>
                  {perfilUploading ? "Enviando..." : "Alterar logo"}
                  <input type="file" accept="image/*" style={{ display: "none" }} disabled={perfilUploading} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImagemOrg(f, "logo"); }} />
                </label>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Banner / Capa</div>
                <div style={{ width: "100%", height: 120, borderRadius: 12, overflow: "hidden", border: `1px solid ${t.border}`, background: meuOrgPerfil.banner ? "transparent" : `linear-gradient(135deg, ${perfilForm.corPrimaria}, ${perfilForm.corSecundaria})`, marginBottom: 8 }}>
                  {meuOrgPerfil.banner && <img loading="lazy" src={meuOrgPerfil.banner} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <label style={{ background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontSize: 12, color: t.textTertiary }}>
                  {perfilUploading ? "Enviando..." : "Alterar banner"}
                  <input type="file" accept="image/*" style={{ display: "none" }} disabled={perfilUploading} onChange={e => { const f = e.target.files?.[0]; if (f) { const url = URL.createObjectURL(f); setBannerParaCortar(url); } e.target.value = ""; }} />
                </label>
                <div style={{ fontSize: 10, color: t.textDimmed, marginTop: 4 }}>Recomendado: 1600×500px (proporção 16:5)</div>
              </div>
            </div>

            {/* Cores */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Cor Primária</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="color" value={perfilForm.corPrimaria} onChange={e => setPerfilForm(p => ({ ...p, corPrimaria: e.target.value }))}
                    style={{ width: 44, height: 38, border: "none", cursor: "pointer", background: "transparent" }} />
                  <input type="text" value={perfilForm.corPrimaria} onChange={e => setPerfilForm(p => ({ ...p, corPrimaria: e.target.value }))}
                    style={{ ...s.input, width: 100, marginBottom: 0 }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Cor Secundária</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="color" value={perfilForm.corSecundaria} onChange={e => setPerfilForm(p => ({ ...p, corSecundaria: e.target.value }))}
                    style={{ width: 44, height: 38, border: "none", cursor: "pointer", background: "transparent" }} />
                  <input type="text" value={perfilForm.corSecundaria} onChange={e => setPerfilForm(p => ({ ...p, corSecundaria: e.target.value }))}
                    style={{ ...s.input, width: 100, marginBottom: 0 }} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, paddingBottom: 4 }}>
                <div style={{ width: 80, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${perfilForm.corPrimaria}, ${perfilForm.corSecundaria})` }} />
                <span style={{ fontSize: 10, color: t.textDimmed }}>Preview</span>
              </div>
            </div>

            {/* Localização */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Cidade</div>
                <input type="text" value={perfilForm.cidade} onChange={e => setPerfilForm(p => ({ ...p, cidade: e.target.value }))} style={{ ...s.input, marginBottom: 0 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>UF</div>
                <input type="text" value={perfilForm.estado} maxLength={2} onChange={e => setPerfilForm(p => ({ ...p, estado: e.target.value }))} style={{ ...s.input, marginBottom: 0, textTransform: "uppercase" }} />
              </div>
            </div>

            {/* Descrição */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Descrição / Sobre</div>
              <textarea value={perfilForm.descricao} onChange={e => setPerfilForm(p => ({ ...p, descricao: e.target.value }))}
                rows={4} placeholder="Fale sobre sua organização..."
                style={{ ...s.input, resize: "vertical", minHeight: 80, marginBottom: 0 }} />
            </div>

            {/* Site e Redes Sociais */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <FormField label="Site" value={perfilForm.site} onChange={v => setPerfilForm(p => ({ ...p, site: v }))} placeholder="www.exemplo.com.br" />
              <FormField label="Instagram" value={perfilForm.instagram} onChange={v => setPerfilForm(p => ({ ...p, instagram: v }))} placeholder="@perfil" />
              <FormField label="Facebook" value={perfilForm.facebook} onChange={v => setPerfilForm(p => ({ ...p, facebook: v }))} placeholder="pagina ou URL" />
              <FormField label="X / Twitter" value={perfilForm.twitter} onChange={v => setPerfilForm(p => ({ ...p, twitter: v }))} placeholder="@perfil" />
            </div>

            {/* Botões */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button style={s.btnPrimary} onClick={salvarPerfilOrg}>Salvar Perfil</button>
              {meuOrgPerfil.slug && (
                <button style={s.btnSecondary} onClick={() => {
                  if (selecionarOrganizador) selecionarOrganizador(meuOrgPerfil.id);
                }}>
                  Ver Página Pública
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ABA: CONFIGURAÇÕES AVANÇADAS (admin only) ───────────────────────── */}
      {aba === "aparencia" && isAdmin && (
        <div style={{ maxWidth: 700 }}>

          {/* ── Manutenção Programada ──────────────────────────────────────── */}
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Manutenção Programada</h3>
            <p style={{ color:t.textDimmed, fontSize:13, marginBottom:12, lineHeight:1.6 }}>
              Agende uma manutenção para exibir um aviso a todos os usuários (aparece 48h antes).
            </p>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }}>
              <div>
                <label style={{ display:"block", fontSize:11, color: t.textMuted, marginBottom:4 }}>Data e Hora</label>
                <input type="datetime-local" value={siteBranding.manutencao?.dataHora || ""}
                  onChange={ev => setSiteBranding(prev => ({ ...prev, manutencao: { ...prev.manutencao, dataHora: ev.target.value } }))}
                  style={{ ...s.input, width:220, marginBottom:0 }} />
              </div>
              <div style={{ flex:1, minWidth:200 }}>
                <label style={{ display:"block", fontSize:11, color: t.textMuted, marginBottom:4 }}>Mensagem (opcional)</label>
                <input type="text" value={siteBranding.manutencao?.mensagem || ""}
                  onChange={ev => setSiteBranding(prev => ({ ...prev, manutencao: { ...prev.manutencao, mensagem: ev.target.value } }))}
                  placeholder="Ex: Atualização do sistema, duração estimada 30min"
                  style={{ ...s.input, marginBottom:0 }} />
              </div>
              {siteBranding.manutencao?.dataHora && (
                <button onClick={() => setSiteBranding(prev => ({ ...prev, manutencao: null }))}
                  style={{ ...s.btnGhost, fontSize:12, padding:"8px 14px", color: t.danger }}>Cancelar</button>
              )}
            </div>
          </div>

          {/* ── Identidade Visual ────────────────────────────────────────────── */}
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Identidade Visual</h3>
            <p style={{ color:t.textDimmed, fontSize:13, marginBottom:16, lineHeight:1.6 }}>
              Personalize o ícone, logo, nome e slogan exibidos no sistema.
            </p>

            {/* Ícone + Logo */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              {/* Ícone */}
              <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <img loading="lazy" src={siteBranding?.icon || ""} alt="" style={{ width:36, height:36, objectFit:"contain", borderRadius:5, background:t.bgHover }} />
                  <div>
                    <div style={{ fontWeight:700, fontSize:12, color:t.textPrimary }}>Ícone</div>
                    <div style={{ fontSize:10, color:t.textDisabled }}>48×48px · máx. 300KB</div>
                  </div>
                </div>
                <label style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 10px",
                  background:t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:5, cursor:"pointer", fontSize:11, color:t.accent }}>
                  Trocar
                  <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }}
                    onChange={e => {
                      const f = e.target.files?.[0]; if (!f) return;
                      if (f.size > 300*1024) { setErro("Máx. 300KB para o ícone."); return; }
                      const r = new FileReader();
                      r.onload = ev => setSiteBranding(prev => ({ ...prev, icon: ev.target.result }));
                      r.readAsDataURL(f);
                      e.target.value = "";
                    }} />
                </label>
                {siteBranding?.icon && (
                  <button style={{ fontSize:10, color:t.textMuted, background:"transparent", border:"none", cursor:"pointer", marginLeft:6 }}
                    onClick={() => setSiteBranding(prev => ({ ...prev, icon: "" }))}>↩ Padrão</button>
                )}
              </div>

              {/* Logo */}
              <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <img loading="lazy" src={siteBranding?.logo || ""} alt="" style={{ height:28, objectFit:"contain", background:"#fff", padding:2, borderRadius:3 }} />
                  <div>
                    <div style={{ fontWeight:700, fontSize:12, color:t.textPrimary }}>Logo</div>
                    <div style={{ fontSize:10, color:t.textDisabled }}>300×120px · máx. 300KB</div>
                  </div>
                </div>
                <label style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 10px",
                  background:t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:5, cursor:"pointer", fontSize:11, color:t.accent }}>
                  Trocar
                  <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }}
                    onChange={e => {
                      const f = e.target.files?.[0]; if (!f) return;
                      if (f.size > 300*1024) { setErro("Máx. 300KB para o logo."); return; }
                      const r = new FileReader();
                      r.onload = ev => setSiteBranding(prev => ({ ...prev, logo: ev.target.result }));
                      r.readAsDataURL(f);
                      e.target.value = "";
                    }} />
                </label>
                {siteBranding?.logo && (
                  <button style={{ fontSize:10, color:t.textMuted, background:"transparent", border:"none", cursor:"pointer", marginLeft:6 }}
                    onClick={() => setSiteBranding(prev => ({ ...prev, logo: "" }))}>↩ Padrão</button>
                )}
              </div>
            </div>

            {/* Logo do Rodapé */}
            <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:12, marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                {siteBranding?.logoFooter
                  ? <img loading="lazy" src={siteBranding.logoFooter} alt="" style={{ height:36, objectFit:"contain", borderRadius:5, background:t.bgHover }} />
                  : <div style={{ width:36, height:36, background:t.bgHover, borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:t.textDisabled }}>—</div>}
                <div>
                  <div style={{ fontWeight:700, fontSize:12, color:t.textPrimary }}>Logo do Rodapé</div>
                  <div style={{ fontSize:10, color:t.textDisabled }}>Exibida no footer do site · com corte</div>
                </div>
              </div>
              <label style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 10px",
                background:t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:5, cursor:"pointer", fontSize:11, color:t.accent }}>
                {siteBranding?.logoFooter ? "Trocar" : "Enviar"}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display:"none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    if (f.size > 5*1024*1024) { setErro("Máx. 5MB para imagem de entrada."); return; }
                    const reader = new FileReader();
                    reader.onload = (ev) => setLogoFooterParaCortar(ev.target.result);
                    reader.readAsDataURL(f);
                    e.target.value = "";
                  }} />
              </label>
              {siteBranding?.logoFooter && (
                <button style={{ fontSize:10, color:t.textMuted, background:"transparent", border:"none", cursor:"pointer", marginLeft:6 }}
                  onClick={async () => {
                    try { await deleteObject(storageRef(storage, siteBranding.logoFooter)); } catch {}
                    setSiteBranding(prev => ({ ...prev, logoFooter: "" }));
                  }}>Remover</button>
              )}
            </div>

            {/* Logo da Plataforma (rodapé dos documentos impressos) */}
            <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, padding:12, marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                {siteBranding?.logoPlataforma
                  ? <img loading="lazy" src={siteBranding.logoPlataforma} alt="" style={{ height:28, objectFit:"contain", borderRadius:3, background:"#fff", padding:2 }} />
                  : <div style={{ width:36, height:36, background:t.bgHover, borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:t.textDisabled }}>—</div>}
                <div>
                  <div style={{ fontWeight:700, fontSize:12, color:t.textPrimary }}>Logo da Plataforma (Impressão)</div>
                  <div style={{ fontSize:10, color:t.textDisabled }}>Exibida ao lado de "Plataforma de Competições" no rodapé dos documentos · 400×100px · máx. 300KB</div>
                </div>
              </div>
              <label style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 10px",
                background:t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:5, cursor:"pointer", fontSize:11, color:t.accent }}>
                {siteBranding?.logoPlataforma ? "Trocar" : "Enviar"}
                <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }}
                  onChange={e => {
                    const f = e.target.files?.[0]; if (!f) return;
                    if (f.size > 300*1024) { setErro("Máx. 300KB para a logo."); return; }
                    const r = new FileReader();
                    r.onload = ev => setSiteBranding(prev => ({ ...prev, logoPlataforma: ev.target.result }));
                    r.readAsDataURL(f);
                    e.target.value = "";
                  }} />
              </label>
              {siteBranding?.logoPlataforma && (
                <button style={{ fontSize:10, color:t.textMuted, background:"transparent", border:"none", cursor:"pointer", marginLeft:6 }}
                  onClick={() => setSiteBranding(prev => ({ ...prev, logoPlataforma: "" }))}>↩ Padrão</button>
              )}
            </div>

            {/* Nome + Slogan */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div>
                <label style={s.label}>Nome do Site</label>
                <input style={s.input} value={siteBranding?.nome || ""} placeholder="GERENTRACK"
                  onChange={e => setSiteBranding(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <label style={s.label}>Slogan</label>
                <input style={s.input} value={siteBranding?.slogan || ""} placeholder="COMPETIÇÃO COM PRECISÃO"
                  onChange={e => setSiteBranding(prev => ({ ...prev, slogan: e.target.value.toUpperCase() }))} />
              </div>
            </div>

            {/* Preview header */}
            <div style={{ padding:"10px 14px", background:t.bgHeader, borderRadius:8, border:`1px solid ${t.border}` }}>
              <div style={{ fontSize:10, color:t.textDisabled, marginBottom:5 }}>Preview do header:</div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {siteBranding?.logo ? (
                  <img loading="lazy" src={siteBranding.logo} alt={siteBranding?.nome || "GERENTRACK"} style={{ height: 32, maxWidth: 200, objectFit: "contain" }} />
                ) : (
                  <>
                    {siteBranding?.icon && <img loading="lazy" src={siteBranding.icon} alt="" style={{ width:28, height:28, objectFit:"contain", borderRadius:4 }} />}
                    <div>
                      <div style={{ fontFamily: t.fontTitle, fontSize:16, fontWeight:900, color: t.accent, letterSpacing:2 }}>
                        {siteBranding?.nome || "GERENTRACK"}
                      </div>
                      <div style={{ fontSize:10, color:t.textDimmed }}>{siteBranding?.slogan || "COMPETIÇÃO COM PRECISÃO"}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Seção "Imagem de Fundo do Hero" removida (hero agora é fixo) ── */}
          {null}

          {/* ── Assinaturas de Federações (Ranking) ─────────────────────────── */}
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Assinaturas de Federações (Ranking)</h3>
            <p style={{ color:t.textDimmed, fontSize:13, marginBottom:14, lineHeight:1.6 }}>
              Logo/assinatura de cada federação estadual que aparecerá na impressão do ranking oficial ao filtrar pela UF correspondente.
            </p>
            {Object.entries(siteBranding?.assinaturasFederacao || {}).map(([uf, fed]) => (
              <div key={uf} style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", padding:"10px 14px", background:t.bgHeaderSolid, border:`1px solid ${t.border}`, borderRadius:8, marginBottom:8 }}>
                <span style={{ fontFamily: t.fontTitle, fontWeight:800, fontSize:16, color:t.accent, width:30 }}>{uf}</span>
                <input style={{ ...s.input, flex:1, minWidth:180, marginBottom:0 }} value={fed.nome || ""} placeholder="Nome da federação"
                  onChange={ev => setSiteBranding(prev => ({ ...prev, assinaturasFederacao: { ...prev.assinaturasFederacao, [uf]: { ...prev.assinaturasFederacao[uf], nome: ev.target.value } } }))} />
                {fed.logo ? (
                  <img loading="lazy" src={fed.logo} alt={uf} style={{ maxHeight:40, maxWidth:160, objectFit:"contain", background:"#fff", padding:2, borderRadius:4, border:`1px solid ${t.border}` }} />
                ) : (
                  <span style={{ fontSize:10, color:t.textDisabled }}>Sem logo</span>
                )}
                <label style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px",
                  background:t.accentBg, border:`1px solid ${t.accentBorder}`, borderRadius:5, cursor:"pointer", fontSize:11, color:t.accent }}>
                  {fed.logo ? "Trocar" : "Enviar"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display:"none" }}
                    onChange={async ev => {
                      const f = ev.target.files?.[0]; if (!f) return;
                      if (f.size > 2*1024*1024) { setErro("Máx. 2MB."); return; }
                      try {
                        const ref = storageRef(storage, `branding/assinatura-federacao-${uf}`);
                        await uploadBytes(ref, f);
                        const url = await getDownloadURL(ref);
                        setSiteBranding(prev => ({ ...prev, assinaturasFederacao: { ...prev.assinaturasFederacao, [uf]: { ...prev.assinaturasFederacao[uf], logo: url } } }));
                      } catch (err) { setErro("Erro ao enviar: " + err.message); }
                      ev.target.value = "";
                    }} />
                </label>
                {fed.logo && (
                  <button style={{ fontSize:10, color:t.danger, background:"transparent", border:`1px solid ${t.danger}44`, borderRadius:4, padding:"3px 8px", cursor:"pointer" }}
                    onClick={() => setSiteBranding(prev => ({ ...prev, assinaturasFederacao: { ...prev.assinaturasFederacao, [uf]: { ...prev.assinaturasFederacao[uf], logo: "" } } }))}>Remover</button>
                )}
                <button style={{ fontSize:10, color:t.danger, background:"transparent", border:"none", cursor:"pointer" }}
                  onClick={() => setSiteBranding(prev => {
                    const novo = { ...prev.assinaturasFederacao };
                    delete novo[uf];
                    return { ...prev, assinaturasFederacao: novo };
                  })}>✕</button>
              </div>
            ))}
            <button style={{ marginTop:6, padding:"6px 14px", borderRadius:6, border:`1px dashed ${t.accentBorder}`, background:"transparent", color:t.accent, fontSize:12, fontWeight:600, cursor:"pointer" }}
              onClick={() => {
                const uf = prompt("Sigla do estado (ex: SP, RJ, BA):");
                if (!uf || uf.length !== 2) return;
                const ufUp = uf.toUpperCase();
                if (siteBranding?.assinaturasFederacao?.[ufUp]) { setErro(`${ufUp} já cadastrado.`); return; }
                setSiteBranding(prev => ({ ...prev, assinaturasFederacao: { ...prev.assinaturasFederacao, [ufUp]: { nome: "", logo: "" } } }));
              }}>
              + Adicionar Federação
            </button>
          </div>

          {/* ── PostgreSQL — Consolidação ────────────────────────────────────── */}
          <div style={s.card}>
            <h3 style={s.sectionTitle}>PostgreSQL — Consolidação</h3>
            <p style={{ color: t.textDimmed, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              Migra todas as competições finalizadas para o banco relacional (Supabase). Execute uma vez para popular o histórico, ou após correções em massa.
            </p>
            <button
              style={{ background: t.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: t.fontTitle, letterSpacing: 0.5 }}
              onClick={async () => {
                if (!window.confirm("Consolidar TODAS as competições finalizadas no PostgreSQL?\n\nIsso pode levar alguns segundos.")) return;
                try {
                  const token = await auth.currentUser.getIdToken();
                  const resp = await fetch("/api/resultados/migrar-historico", {
                    method: "POST",
                    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
                  });
                  const data = await resp.json();
                  if (data.ok) {
                    const resumo = (data.migracoes || []).map(m => `${m.nome}: ${m.resultados || 0} resultados`).join("\n");
                    alert(`Migração concluída!\n\n${data.totalEventos} competição(ões) consolidada(s).\n\n${resumo}`);
                  } else {
                    alert("Erro: " + (data.error || "desconhecido"));
                  }
                } catch (err) {
                  alert("Erro ao migrar: " + err.message);
                }
              }}
            >
              Migrar Histórico para PostgreSQL
            </button>
          </div>

          {/* ── Backup e Restauração ─────────────────────────────────────────── */}
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Backup e Restauração</h3>
            <p style={{ color:t.textDimmed, fontSize:13, marginBottom:16, lineHeight:1.6 }}>
              Exporte os dados para proteger suas informações ou transferir para outro ambiente.
            </p>
            <div style={{ background:`${t.success}08`, border:`1px solid ${t.success}44`, borderRadius:8, padding:14, marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <span style={{ fontSize:14, color:t.success, fontWeight:700 }}>&#x2191;</span>
                <div>
                  <div style={{ color:t.success, fontWeight:700, fontSize:13 }}>Exportar Backup</div>
                  <div style={{ color:t.textDisabled, fontSize:11 }}>Baixa um arquivo .json com todos os dados</div>
                </div>
              </div>
              <button style={{ ...s.btnGhost, color:t.success, borderColor:`${t.success}66`, width:"100%", fontSize:12 }}
                onClick={exportarDados}>Baixar Backup Agora</button>
            </div>
            <div style={{ background:t.bgHeaderSolid, border:`1px solid ${t.accentBorder}`, borderRadius:8, padding:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <span style={{ fontSize:14, color:t.accent, fontWeight:700 }}>&#x2193;</span>
                <div>
                  <div style={{ color:t.accent, fontWeight:700, fontSize:13 }}>Restaurar Backup</div>
                  <div style={{ color:t.textDisabled, fontSize:11 }}>Carrega um arquivo .json deste sistema</div>
                </div>
              </div>
              <label style={{ display:"block", cursor:"pointer" }}>
                <div style={{ border:`1px solid ${t.accentBorder}`, color:t.accent, fontSize:12, textAlign:"center", padding:"8px 12px", borderRadius:6 }}>
                  Selecionar Arquivo de Backup
                </div>
                <input type="file" accept=".json" style={{ display:"none" }}
                  onChange={e => { if (e.target.files[0]) importarDados(e.target.files[0]); e.target.value = ""; }} />
              </label>
              <div style={{ marginTop:8, fontSize:11, color:t.textMuted }}>Importar substitui todos os dados atuais.</div>
            </div>
          </div>

          {/* ── Zona de Perigo ───────────────────────────────────────────────── */}
          <div style={{ ...s.card, borderColor:`${t.danger}33`, background:`${t.danger}08` }}>
          </div>

          {/* ── Redes Sociais ───────────────────────────────────────────── */}
          {(() => {
            const REDES_OPCOES = [
              { id: "instagram", label: "Instagram", placeholder: "https://instagram.com/seu_perfil" },
              { id: "facebook", label: "Facebook", placeholder: "https://facebook.com/sua_pagina" },
              { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@seu_canal" },
              { id: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/sua_empresa" },
              { id: "x", label: "X (Twitter)", placeholder: "https://x.com/seu_perfil" },
              { id: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@seu_perfil" },
              { id: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/5531999999999" },
              { id: "email", label: "E-mail", placeholder: "mailto:contato@exemplo.com.br" },
              { id: "site", label: "Site", placeholder: "https://seu-site.com.br" },
              { id: "outro", label: "Outro", placeholder: "https://..." },
            ];
            const redesSociais = siteBranding.redesSociais || [];
            const formVazio = { rede: "instagram", label: "", url: "", emoji: "", ordem: redesSociais.length + 1, ativo: true };
            const redeOpcao = REDES_OPCOES.find(r => r.id === formRede.rede) || REDES_OPCOES[0];

            const salvarRede = () => {
              if (!formRede.url.trim()) { setErroRede("URL obrigatória"); return; }
              const label = formRede.label.trim() || redeOpcao.label;
              const novaRede = { ...formRede, label };
              let novaLista;
              if (editandoRedeIdx !== null) {
                novaLista = redesSociais.map((r, i) => i === editandoRedeIdx ? novaRede : r);
              } else {
                novaLista = [...redesSociais, novaRede];
              }
              novaLista.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
              setSiteBranding(prev => ({ ...prev, redesSociais: novaLista }));
              setFormRede(formVazio);
              setEditandoRedeIdx(null);
              setErroRede("");
            };

            const editarRede = (idx) => { setFormRede(redesSociais[idx]); setEditandoRedeIdx(idx); setErroRede(""); };
            const excluirRede = async (idx) => {
              const rede = redesSociais[idx];
              if (rede?.iconeUrl) {
                try { await deleteObject(storageRef(storage, rede.iconeUrl)); } catch {}
              }
              setSiteBranding(prev => ({ ...prev, redesSociais: redesSociais.filter((_, i) => i !== idx) }));
              if (editandoRedeIdx === idx) { setFormRede(formVazio); setEditandoRedeIdx(null); }
            };
            const toggleAtivo = (idx) => {
              setSiteBranding(prev => ({ ...prev, redesSociais: redesSociais.map((r, i) => i === idx ? { ...r, ativo: !r.ativo } : r) }));
            };

            return (
              <div style={s.card}>
                <h3 style={s.sectionTitle}>Redes Sociais e Contato</h3>
                <p style={{ color: t.textDimmed, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                  Configure os links que aparecem no rodapé do site.
                </p>

                {redesSociais.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    {redesSociais.map((rede, idx) => (
                      <div key={idx} style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                        background: editandoRedeIdx === idx ? `${t.accent}15` : t.bgHeaderSolid,
                        border: `1px solid ${editandoRedeIdx === idx ? t.accent : t.border}`,
                        borderRadius: 8, marginBottom: 6, opacity: rede.ativo ? 1 : 0.5,
                      }}>
                        {rede.iconeUrl
                          ? <img loading="lazy" src={rede.iconeUrl} alt={rede.label} style={{ width: 24, height: 24, objectFit: "contain", borderRadius: 4 }} />
                          : <span style={{ fontSize: 20 }}>{rede.emoji}</span>}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}>{rede.label}</div>
                          <div style={{ fontSize: 12, color: t.textMuted, wordBreak: "break-all" }}>{rede.url}</div>
                        </div>
                        <span style={{ fontSize: 11, color: t.textDimmed, fontFamily: t.fontTitle }}>#{rede.ordem}</span>
                        <button onClick={() => toggleAtivo(idx)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: rede.ativo ? t.success : t.textDisabled }} title={rede.ativo ? "Desativar" : "Ativar"}>
                          {rede.ativo ? "\u2713" : "\u2014"}
                        </button>
                        <button onClick={() => editarRede(idx)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: t.accent }} title="Editar">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                        </button>
                        <button onClick={() => excluirRede(idx)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: t.danger }} title="Excluir">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20 }}>
                  <h4 style={{ fontFamily: t.fontTitle, fontSize: 16, fontWeight: 700, color: t.textPrimary, marginBottom: 16 }}>
                    {editandoRedeIdx !== null ? "Editar Rede Social" : "Nova Rede Social"}
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={s.label}>Rede Social</label>
                      <select style={{ ...s.input, padding: "8px 12px" }} value={formRede.rede} onChange={ev => setFormRede(prev => ({ ...prev, rede: ev.target.value }))}>
                        {REDES_OPCOES.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={s.label}>Label (nome de exibição)</label>
                      <input style={{ ...s.input, padding: "8px 12px" }} value={formRede.label} onChange={ev => setFormRede(prev => ({ ...prev, label: ev.target.value }))} placeholder={redeOpcao.label} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={s.label}>URL *</label>
                    <input style={{ ...s.input, padding: "8px 12px" }} value={formRede.url} onChange={ev => { setFormRede(prev => ({ ...prev, url: ev.target.value })); setErroRede(""); }} placeholder={redeOpcao.placeholder} />
                    {erroRede && <span style={{ color: t.danger, fontSize: 12 }}>{erroRede}</span>}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={s.label}>Icone / Imagem</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {formRede.iconeUrl && (
                          <img loading="lazy" src={formRede.iconeUrl} alt="" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 4, background: t.bgHover }} />
                        )}
                        <label style={{ ...s.btnGhost, fontSize: 12, padding: "6px 12px", cursor: "pointer", display: "inline-block" }}>
                          Upload
                          <input type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" style={{ display: "none" }} onChange={async (ev) => {
                            const file = ev.target.files?.[0];
                            if (!file) return;
                            if (file.size > 300 * 1024) { setErroRede("Imagem deve ter no maximo 300KB"); return; }
                            try {
                              // Excluir ícone anterior do Storage se existir
                              if (formRede.iconeUrl) {
                                try { await deleteObject(storageRef(storage, formRede.iconeUrl)); } catch {}
                              }
                              const ext = file.name.split(".").pop();
                              const buffer = await file.arrayBuffer();
                              const blob = new Blob([buffer], { type: file.type });
                              const ref = storageRef(storage, `branding/redes-sociais/${formRede.rede}-${Date.now()}.${ext}`);
                              await uploadBytes(ref, blob);
                              const url = await getDownloadURL(ref);
                              setFormRede(prev => ({ ...prev, iconeUrl: url }));
                            } catch (err) {
                              setErroRede("Erro ao enviar imagem");
                              console.error("[RedesSociais] Upload error:", err);
                            }
                          }} />
                        </label>
                        {formRede.iconeUrl && (
                          <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: t.danger }} onClick={async () => {
                            try { await deleteObject(storageRef(storage, formRede.iconeUrl)); } catch {}
                            setFormRede(prev => ({ ...prev, iconeUrl: "" }));
                          }}>
                            Remover
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: t.textDimmed, marginTop: 4 }}>PNG, SVG ou WebP. Max 300KB.</div>
                    </div>
                    <div>
                      <label style={s.label}>Ou usar emoji como icone</label>
                      <input style={{ ...s.input, padding: "8px 12px" }} value={formRede.emoji} onChange={ev => setFormRede(prev => ({ ...prev, emoji: ev.target.value }))} placeholder="Ex: @" />
                      <div style={{ fontSize: 11, color: t.textDimmed, marginTop: 4 }}>Se nao enviar imagem, o texto sera usado como icone.</div>
                    </div>
                    <div>
                      <label style={s.label}>Ordem</label>
                      <input style={{ ...s.input, padding: "8px 12px", width: 60, textAlign: "center" }} type="number" min="1" value={formRede.ordem} onChange={ev => setFormRede(prev => ({ ...prev, ordem: parseInt(ev.target.value) || 1 }))} />
                    </div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: t.textSecondary, marginBottom: 16, cursor: "pointer" }}>
                    <input type="checkbox" checked={formRede.ativo} onChange={ev => setFormRede(prev => ({ ...prev, ativo: ev.target.checked }))} />
                    Ativo (exibir no site e rodapé)
                  </label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button style={{ ...s.btnPrimary, fontSize: 13, padding: "8px 20px" }} onClick={salvarRede}>
                      {editandoRedeIdx !== null ? "Salvar" : "Criar"}
                    </button>
                    {editandoRedeIdx !== null && (
                      <button style={{ ...s.btnGhost, fontSize: 13, padding: "8px 20px" }} onClick={() => { setFormRede(formVazio); setEditandoRedeIdx(null); setErroRede(""); }}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* ── ABA: ROPA — Registro de Operações de Tratamento (Art. 37 LGPD) ── */}
      {aba === "ropa" && isAdmin && (() => {
        const ropaData = [
          { dado: "Nome completo", titular: "Todos os perfis", finalidade: "Identificação do usuário na plataforma", base: "Execução de contrato (Art. 7, V)", retencao: "Duração do contrato + 30 dias", compartilhado: "Controlador (organização contratante)" },
          { dado: "E-mail", titular: "Todos os perfis", finalidade: "Autenticação, comunicação e recuperação de conta", base: "Execução de contrato (Art. 7, V)", retencao: "Duração do contrato + 30 dias", compartilhado: "Controlador; Firebase Auth (Google)" },
          { dado: "CPF", titular: "Atletas, treinadores, equipes", finalidade: "Identificação única, prevenção de duplicatas", base: "Execução de contrato (Art. 7, V)", retencao: "Duração do contrato + 30 dias", compartilhado: "Controlador" },
          { dado: "CNPJ", titular: "Organizadores, equipes", finalidade: "Identificação da pessoa jurídica contratante", base: "Execução de contrato (Art. 7, V)", retencao: "Duração do contrato + 30 dias", compartilhado: "Controlador" },
          { dado: "Telefone", titular: "Todos (opcional)", finalidade: "Contato para suporte", base: "Consentimento (Art. 7, I)", retencao: "Duração do contrato + 30 dias", compartilhado: "Controlador" },
          { dado: "Data de nascimento", titular: "Atletas", finalidade: "Classificação por categoria etária", base: "Execução de contrato (Art. 7, V)", retencao: "Duração do contrato + 30 dias", compartilhado: "Controlador" },
          { dado: "Sexo", titular: "Atletas", finalidade: "Classificação em provas por sexo", base: "Execução de contrato (Art. 7, V)", retencao: "Duração do contrato + 30 dias; preservado após anonimização para integridade histórica", compartilhado: "Controlador; exibido em resultados públicos" },
          { dado: "Senha (hash)", titular: "Todos os perfis", finalidade: "Autenticação segura", base: "Execução de contrato (Art. 7, V)", retencao: "Duração do contrato", compartilhado: "Firebase Auth (Google) — nunca armazenada em texto puro" },
          { dado: "Resultados esportivos", titular: "Atletas", finalidade: "Registro de tempos, distâncias, classificações, recordes", base: "Execução de contrato (Art. 7, V)", retencao: "Duração do contrato + 30 dias", compartilhado: "Controlador; exibidos em páginas públicas (sem dados sensíveis)" },
          { dado: "Histórico de ações (auditoria)", titular: "Todos os perfis", finalidade: "Rastreabilidade, segurança, conformidade", base: "Interesse legítimo (Art. 7, IX)", retencao: "500 registros mais recentes (rotação automática)", compartilhado: "Somente admin" },
          { dado: "Logos e imagens", titular: "Organizadores", finalidade: "Personalização visual de competições", base: "Execução de contrato (Art. 7, V)", retencao: "Duração do contrato + 30 dias", compartilhado: "Firebase Storage (Google); exibidos publicamente" },
          { dado: "Dados de navegação (analytics)", titular: "Todos os visitantes", finalidade: "Métricas de uso da plataforma", base: "Consentimento (Art. 7, I)", retencao: "Conforme política Vercel", compartilhado: "Vercel Inc. (EUA) — somente com consentimento do cookie" },
          { dado: "Dados do responsável legal", titular: "Responsável por atleta menor", finalidade: "Consentimento parental (Art. 14 LGPD)", base: "Obrigação legal (Art. 7, II)", retencao: "Duração do contrato + 30 dias", compartilhado: "Controlador" },
        ];
        const rowStyle = (i) => ({ background: i % 2 === 0 ? "transparent" : t.bgCardAlt });
        return (
          <div style={{ maxWidth: 1100 }}>
            <div style={s.card}>
              <div style={{ fontFamily: t.fontTitle, fontSize:18, fontWeight:800, color:t.accent, marginBottom:4, letterSpacing:1 }}>
                Registro de Operações de Tratamento de Dados Pessoais (ROPA)
              </div>
              <p style={{ color: t.textDimmed, fontSize:13, marginBottom:4, lineHeight:1.6 }}>
                Art. 37 da Lei nº 13.709/2018 (LGPD) — O controlador e o operador devem manter registro das operações de tratamento de dados pessoais.
              </p>
              <p style={{ color: t.textMuted, fontSize:12, marginBottom:16, lineHeight:1.6 }}>
                <strong style={{ color: t.textSecondary }}>Controlador:</strong> Entidade contratante (federação, confederação, clube ou organizador) &nbsp;|&nbsp;
                <strong style={{ color: t.textSecondary }}>Operador:</strong> GERENTRACK LTDA — CNPJ: 65.454.409/0001-23 &nbsp;|&nbsp;
                <strong style={{ color: t.textSecondary }}>Encarregado (DPO):</strong> Pedro Henrique Oliveira Campos — dpo@gerentrack.com.br
              </p>

              <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${t.border}` }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ background: t.bgHeaderSolid }}>
                      {["Dado Pessoal", "Categoria de Titular", "Finalidade", "Base Legal", "Retenção", "Compartilhamento"].map(col => (
                        <th key={col} style={{ color:t.accent, padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ropaData.map((row, i) => (
                      <tr key={i} style={rowStyle(i)}>
                        <td style={{ padding:"7px 10px", borderBottom:`1px solid ${t.border}`, color:t.textPrimary, fontWeight:600, whiteSpace:"nowrap" }}>{row.dado}</td>
                        <td style={{ padding:"7px 10px", borderBottom:`1px solid ${t.border}`, color:t.textSecondary }}>{row.titular}</td>
                        <td style={{ padding:"7px 10px", borderBottom:`1px solid ${t.border}`, color:t.textSecondary }}>{row.finalidade}</td>
                        <td style={{ padding:"7px 10px", borderBottom:`1px solid ${t.border}`, color:t.textSecondary, fontSize:11 }}>{row.base}</td>
                        <td style={{ padding:"7px 10px", borderBottom:`1px solid ${t.border}`, color:t.textMuted, fontSize:11 }}>{row.retencao}</td>
                        <td style={{ padding:"7px 10px", borderBottom:`1px solid ${t.border}`, color:t.textMuted, fontSize:11 }}>{row.compartilhado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop:16, padding:"12px 16px", background:t.bgCardAlt, borderRadius:8, border:`1px solid ${t.border}` }}>
                <div style={{ fontSize:13, fontWeight:700, color:t.textPrimary, marginBottom:6 }}>Transferência Internacional de Dados (Art. 33 LGPD)</div>
                <ul style={{ paddingLeft:18, margin:0 }}>
                  <li style={{ fontSize:12, color:t.textSecondary, lineHeight:1.8 }}><strong style={{ color:t.textPrimary }}>Google LLC</strong> (Firebase Auth, Firestore, Storage) — EUA — Certificações ISO 27001, 27017, 27018 e SOC 1/2/3. Cláusulas contratuais padrão (SCCs).</li>
                  <li style={{ fontSize:12, color:t.textSecondary, lineHeight:1.8 }}><strong style={{ color:t.textPrimary }}>Vercel Inc.</strong> (Hospedagem frontend, Analytics) — EUA — Somente dados de navegação, com consentimento do titular.</li>
                </ul>
              </div>

              <div style={{ marginTop:12, fontSize:11, color: t.textDimmed, lineHeight:1.6 }}>
                Última atualização deste registro: abril de 2026
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── ABA: INCIDENTE LGPD (admin only) ───────────────────────────────── */}
      {aba === "incidente" && isAdmin && (() => {
        const emailsAtletas = (atletasUsuarios || []).map(u => u.email).filter(Boolean);
        const emailsEquipes = equipes.map(e => e.email).filter(Boolean);
        const emailsOrgs    = organizadores.map(o => o.email).filter(Boolean);
        const emailsFuncs   = (funcionarios || []).map(f => f.email).filter(Boolean);
        const emailsTrein   = (treinadores  || []).map(tr => tr.email).filter(Boolean);

        const mapaAfetados = {
          todos:         [...new Set([...emailsAtletas, ...emailsEquipes, ...emailsOrgs, ...emailsFuncs, ...emailsTrein])],
          atletas:       [...new Set(emailsAtletas)],
          equipes:       [...new Set(emailsEquipes)],
          organizadores: [...new Set([...emailsOrgs, ...emailsFuncs, ...emailsTrein])],
        };
        const emailsAfetados = mapaAfetados[incAfetados] || [];

        const tiposLabel = {
          acesso_nao_autorizado: "Acesso não autorizado ao sistema",
          vazamento_dados:       "Vazamento de dados pessoais",
          perda_dados:           "Perda ou destruição de dados",
          alteracao_indevida:    "Alteração indevida de dados",
          outro:                 "Outro",
        };
        const tiposSelecionados = Object.entries(incTipos).filter(([,v]) => v).map(([k]) => tiposLabel[k]);
        const hoje = new Date().toLocaleDateString("pt-BR");

        const templateEmail = `Assunto: Comunicado de Incidente de Segurança — GerenTrack

Prezado(a) titular,

Informamos que identificamos um incidente de segurança${incDataDesc ? ` em ${incDataDesc}` : ""} que pode ter afetado dados pessoais armazenados na plataforma GerenTrack.

NATUREZA DO INCIDENTE:
${tiposSelecionados.length > 0 ? tiposSelecionados.map(ts => `• ${ts}`).join("\n") : "• A ser detalhado"}
${incDescricao ? `\nDESCRIÇÃO:\n${incDescricao}` : ""}

DADOS POSSIVELMENTE AFETADOS:
• Nome, e-mail, telefone e documento (CPF/CNPJ) de titulares cadastrados na plataforma.

MEDIDAS ADOTADAS:
• O incidente foi identificado e contido.
• As autoridades competentes (ANPD) foram notificadas conforme exigido pela Lei nº 13.709/2018 (LGPD).
• Medidas de segurança adicionais foram implementadas para prevenir novos incidentes.

O QUE VOCÊ PODE FAZER:
• Fique atento a e-mails ou contatos suspeitos usando seu nome ou dados.
• Caso identifique uso indevido dos seus dados, entre em contato conosco.
• Você pode exercer seus direitos de titular previstos no Art. 18 da LGPD.

CONTATO DO ENCARREGADO (DPO):
E-mail: atendimento@gerentrack.com.br

Lamentamos o ocorrido e reafirmamos nosso compromisso com a proteção dos seus dados.

Atenciosamente,
GerenTrack — Administração
Data: ${hoje}`;

        const templateANPD = `COMUNICAÇÃO DE INCIDENTE DE SEGURANÇA À ANPD
(Art. 48, Lei nº 13.709/2018 — LGPD)

DATA DA COMUNICAÇÃO: ${hoje}
DATA DO INCIDENTE: ${incDataDesc || "A confirmar"}

1. IDENTIFICAÇÃO DO CONTROLADOR
   Nome/Razão Social: GerenTrack
   E-mail: atendimento@gerentrack.com.br

2. NATUREZA DO INCIDENTE
${tiposSelecionados.length > 0 ? tiposSelecionados.map(ts => `   • ${ts}`).join("\n") : "   • A ser detalhado"}

3. DESCRIÇÃO DO INCIDENTE
   ${incDescricao || "Descreva o que ocorreu, como foi descoberto e qual o impacto."}

4. DADOS E TITULARES AFETADOS
   • Categorias de dados: nome, e-mail, CPF/CNPJ, telefone, data de nascimento
   • Número estimado de titulares afetados: ${emailsAfetados.length}
   • Perfis afetados: ${incAfetados === "todos" ? "Atletas, equipes, organizadores, funcionários e treinadores" : incAfetados}

5. MEDIDAS TÉCNICAS E ORGANIZACIONAIS ADOTADAS
   • Contenção do incidente
   • Revisão das regras de acesso ao Firestore
   • Comunicação aos titulares afetados
   • Monitoramento reforçado

6. RISCOS RELACIONADOS AO INCIDENTE
   Possível exposição de dados pessoais que pode resultar em:
   • Uso indevido de identidade
   • Contato não solicitado (spam/phishing)

7. OBSERVAÇÕES ADICIONAIS
   A plataforma GerenTrack é utilizada para gestão de competições de atletismo no Brasil.`;

        const copiar = (texto, id) => {
          navigator.clipboard.writeText(texto).then(() => {
            setIncCopiado(id);
            setTimeout(() => setIncCopiado(""), 3000);
          });
        };

        return (
          <div style={{ maxWidth: 760 }}>

            {/* Alerta */}
            <div style={{ background:"#1a0800", border:"2px solid #cc4400", borderRadius:12,
              padding:"16px 20px", marginBottom:20, display:"flex", gap:14, alignItems:"flex-start" }}>
              <span style={{ fontSize:20, flexShrink:0, color:"#ff7744", fontWeight:900 }}>!</span>
              <div>
                <div style={{ color:"#ff7744", fontWeight:800, fontSize:15, marginBottom:4 }}>
                  Comunicação de Incidente — Art. 48º LGPD
                </div>
                <div style={{ color:t.textTertiary, fontSize:13, lineHeight:1.7 }}>
                  Notifique a <strong style={{ color:t.textPrimary }}>ANPD em até 72h</strong> após ciência do incidente
                  e comunique os <strong style={{ color:t.textPrimary }}>titulares afetados</strong>.
                </div>
                <a href="https://peticionamento.anpd.gov.br" target="_blank" rel="noopener noreferrer"
                  style={{ display:"inline-block", marginTop:10, background:"#cc4400", color:"#fff",
                    borderRadius:6, padding:"6px 14px", fontSize:12, fontWeight:700,
                    fontFamily: t.fontTitle, textDecoration:"none", letterSpacing:1 }}>
                  Abrir Portal da ANPD →
                </a>
              </div>
            </div>

            {/* 1. Descrever */}
            <div style={s.card}>
              <h3 style={s.sectionTitle}>1. Descreva o Incidente</h3>
              <div style={{ marginBottom:16 }}>
                <label style={s.label}>Natureza (marque todas que se aplicam)</label>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:6 }}>
                  {Object.entries(tiposLabel).map(([key, label]) => (
                    <label key={key} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                      <input type="checkbox" checked={incTipos[key]}
                        onChange={e => setIncTipos(prev => ({ ...prev, [key]: e.target.checked }))}
                        style={{ width:15, height:15, cursor:"pointer" }} />
                      <span style={{ fontSize:13, color:t.textSecondary }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={s.label}>Data do incidente (se conhecida)</label>
                <input type="date" value={incDataDesc} onChange={e => setIncDataDesc(e.target.value)}
                  style={{ ...s.input, maxWidth:220 }} />
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={s.label}>Descrição do ocorrido</label>
                <textarea value={incDescricao} onChange={e => setIncDescricao(e.target.value)}
                  placeholder="Descreva o que ocorreu, como foi descoberto e qual o impacto estimado..."
                  style={{ ...s.input, minHeight:90, resize:"vertical", fontFamily: t.fontBody, lineHeight:1.6 }} />
              </div>
              <div>
                <label style={s.label}>Titulares afetados</label>
                <select value={incAfetados} onChange={e => setIncAfetados(e.target.value)}
                  style={{ ...s.input, maxWidth:380 }}>
                  <option value="todos">Todos os titulares ({mapaAfetados.todos.length} e-mails)</option>
                  <option value="atletas">Apenas atletas ({emailsAtletas.length} e-mails)</option>
                  <option value="equipes">Apenas equipes ({emailsEquipes.length} e-mails)</option>
                  <option value="organizadores">Apenas organizadores/funcionários/treinadores ({mapaAfetados.organizadores.length} e-mails)</option>
                </select>
              </div>
            </div>

            {/* 2. Template titulares */}
            <div style={s.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <h3 style={{ ...s.sectionTitle, margin:0 }}>2. Template — Comunicação aos Titulares</h3>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => copiar(emailsAfetados.join("; "), "emails")}
                    style={{ ...s.btnGhost, fontSize:11, padding:"4px 12px", color:t.accent, borderColor:`${t.accent}44` }}>
                    {incCopiado === "emails" ? "Copiado!" : `Copiar ${emailsAfetados.length} e-mails`}
                  </button>
                  <button onClick={() => copiar(templateEmail, "template_titular")}
                    style={{ ...s.btnGhost, fontSize:11, padding:"4px 12px" }}>
                    {incCopiado === "template_titular" ? "Copiado!" : "Copiar Template"}
                  </button>
                </div>
              </div>
              <div style={{ fontSize:11, color:t.textDisabled, marginBottom:10 }}>
                Envie pelo seu cliente de e-mail. Use "Copiar e-mails" para obter a lista de destinatários.
              </div>
              <pre style={{ background:t.bgCardAlt, border:`1px solid ${t.border}`, borderRadius:8,
                padding:"14px 16px", fontSize:11, color:t.textTertiary, lineHeight:1.8,
                whiteSpace:"pre-wrap", fontFamily:"monospace", overflowX:"auto" }}>
                {templateEmail}
              </pre>
            </div>

            {/* 3. Template ANPD */}
            <div style={s.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <h3 style={{ ...s.sectionTitle, margin:0 }}>3. Template — Notificação à ANPD</h3>
                <button onClick={() => copiar(templateANPD, "template_anpd")}
                  style={{ ...s.btnGhost, fontSize:11, padding:"4px 12px" }}>
                  {incCopiado === "template_anpd" ? "Copiado!" : "Copiar Template"}
                </button>
              </div>
              <div style={{ fontSize:11, color:t.textDisabled, marginBottom:10 }}>
                Use no portal:{" "}
                <a href="https://peticionamento.anpd.gov.br" target="_blank" rel="noopener noreferrer"
                  style={{ color: t.accent }}>peticionamento.anpd.gov.br →</a>
              </div>
              <pre style={{ background:t.bgCardAlt, border:`1px solid ${t.border}`, borderRadius:8,
                padding:"14px 16px", fontSize:11, color:t.textTertiary, lineHeight:1.8,
                whiteSpace:"pre-wrap", fontFamily:"monospace", overflowX:"auto" }}>
                {templateANPD}
              </pre>
            </div>

            {/* 4. Registrar */}
            <div style={{ ...s.card, borderColor:`${t.danger}33`, background:`${t.danger}08` }}>
              <h3 style={{ ...s.sectionTitle, color:t.danger }}>4. Registrar no Histórico</h3>
              <p style={{ color:t.textDimmed, fontSize:13, marginBottom:14, lineHeight:1.6 }}>
                Registre este incidente no histórico de ações para fins de conformidade e auditoria.
              </p>
              <button onClick={() => {
                if (!incDescricao.trim() && tiposSelecionados.length === 0) {
                  alert("Preencha ao menos a natureza ou a descrição do incidente antes de registrar.");
                  return;
                }
                if (registrarAcao) registrarAcao(
                  usuarioLogado.id, usuarioLogado.nome,
                  "Registrou incidente de segurança LGPD",
                  `${tiposSelecionados.join(", ") || "Tipo não especificado"} — ${incDescricao.slice(0,100) || "Sem descrição"}`,
                  null, { modulo: "lgpd" }
                );
                alert("Incidente registrado no histórico de ações.");
              }} style={{ ...s.btnGhost, color:t.danger, borderColor:`${t.danger}55` }}>
                Registrar Incidente no Histórico
              </button>
            </div>

          </div>
        );
      })()}

      {/* ── ABA: DIAGNÓSTICO FIREBASE (admin only) ─────────────────────── */}
      {aba === "diagnostico" && isAdmin && (() => {
        const diagTabStyle = (tab) => ({
          padding:"8px 16px", cursor:"pointer", fontSize:12, fontWeight: diagAba === tab ? 700 : 400,
          background: diagAba === tab ? t.accent : t.bgHover, color: diagAba === tab ? "#fff" : t.textMuted,
          borderRadius:6, border:"none", fontFamily: t.fontBody, transition:"all 0.15s",
        });
        const statItem = (color) => ({ background:`${color}10`, border:`1px solid ${color}30`, borderRadius:10, padding:"14px 20px", flex:"1 1 140px", textAlign:"center" });
        const statNum = (color) => ({ fontSize:28, fontWeight:800, color, fontFamily: t.fontTitle });
        const statLabel = { fontSize:11, color:t.textMuted, marginTop:4, textTransform:"uppercase", letterSpacing:1, fontFamily: t.fontTitle };
        const badge = (color) => ({ display:"inline-block", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, color, background:`${color}15` });
        const th = { textAlign:"left", padding:"10px 14px", fontSize:11, fontWeight:700, color:t.textDimmed, textTransform:"uppercase", letterSpacing:1, borderBottom:`1px solid ${t.border}`, fontFamily: t.fontTitle };
        const td = { padding:"10px 14px", fontSize:13, color:t.textSecondary, borderBottom:`1px solid ${t.borderLight}`, fontFamily: t.fontBody };

        const executarDiag = () => {
          if (diagAba === "storage") diagnosticarStorage();
          else if (diagAba === "firestore") diagnosticarFirestore();
          else if (diagAba === "auth") diagnosticarAuth();
        };

        return (
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Diagnóstico Firebase</h3>
            <p style={{ fontSize:13, color:t.textMuted, marginBottom:16 }}>Identificar arquivos órfãos, referências quebradas e inconsistências.</p>

            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
              <button style={diagTabStyle("storage")} onClick={() => setDiagAba("storage")}>Storage</button>
              <button style={diagTabStyle("firestore")} onClick={() => setDiagAba("firestore")}>Firestore</button>
              <button style={diagTabStyle("auth")} onClick={() => setDiagAba("auth")}>Auth</button>
            </div>

            <div style={{ marginBottom:16 }}>
              <button style={s.btnPrimary} onClick={executarDiag} disabled={diagRodando}>
                {diagRodando ? "Analisando..." : "Executar Diagnóstico"}
              </button>
            </div>

            {diagRodando && <div style={{ textAlign:"center", padding:20, color:t.textMuted, fontSize:14 }}>Analisando... isso pode levar alguns segundos.</div>}

            {/* Storage */}
            {!diagRodando && diagAba === "storage" && (() => {
              if (!diagStorage) return <div style={{ textAlign:"center", padding:20, color:t.textDisabled, fontSize:13 }}>Clique em "Executar Diagnóstico" para verificar arquivos no Storage.</div>;
              const ok = diagStorage.filter(r => r.ok);
              const falhas = diagStorage.filter(r => !r.ok);
              return (
                <>
                  <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:16 }}>
                    <div style={statItem(t.success)}><div style={statNum(t.success)}>{ok.length}</div><div style={statLabel}>Arquivos OK</div></div>
                    <div style={statItem(t.danger)}><div style={statNum(t.danger)}>{falhas.length}</div><div style={statLabel}>Com problema</div></div>
                    <div style={statItem(t.accent)}><div style={statNum(t.accent)}>{diagStorage.length}</div><div style={statLabel}>Total</div></div>
                  </div>
                  {falhas.length > 0 && (
                    <div style={{ overflowX:"auto", borderRadius:10, border:`1px solid ${t.border}` }}>
                      <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead><tr><th style={th}>Tipo</th><th style={th}>Nome</th><th style={th}>Campo</th><th style={th}>Motivo</th><th style={th}>Path</th></tr></thead>
                        <tbody>
                          {falhas.map((item, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : t.bgHover }}>
                              <td style={td}>{item.tipo}</td>
                              <td style={td}>{item.nome}</td>
                              <td style={td}><code style={{ fontSize:11 }}>{item.campo}</code></td>
                              <td style={td}><span style={badge(t.danger)}>{item.motivo}</span></td>
                              <td style={{ ...td, maxWidth:250, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:11 }}>{extrairStoragePath(item.url) || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {falhas.length > 0 && (
                    <button
                      style={{ ...s.btnPrimary, fontSize:12, marginTop:12 }}
                      onClick={async () => {
                        let corrigidos = 0;
                        for (const item of falhas) {
                          if (item.tipo === "Evento") {
                            const ev = (eventos || []).find(e => (e.nome || e.id) === item.nome);
                            if (ev) { atualizarCamposEvento(ev.id, { [item.campo]: "" }); corrigidos++; }
                          } else if (item.tipo === "Organizador") {
                            const org = (organizadores || []).find(o => (o.nome || o.id) === item.nome);
                            if (org && editarOrganizadorAdmin) { editarOrganizadorAdmin({ ...org, [item.campo]: "" }); corrigidos++; }
                          }
                        }
                        alert(`${corrigidos} referência(s) quebrada(s) removida(s).`);
                        diagnosticarStorage();
                      }}>
                      Corrigir referências quebradas
                    </button>
                  )}
                  {falhas.length === 0 && <div style={{ textAlign:"center", padding:20, color:t.success, fontSize:13 }}>Todos os arquivos referenciados estão acessíveis.</div>}
                </>
              );
            })()}


            {/* Firestore */}
            {!diagRodando && diagAba === "firestore" && (() => {
              if (!diagFirestore) return <div style={{ textAlign:"center", padding:20, color:t.textDisabled, fontSize:13 }}>Clique em "Executar Diagnóstico" para verificar referências cruzadas.</div>;
              return (
                <>
                  <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:16 }}>
                    <div style={statItem(diagFirestore.length > 0 ? t.danger : t.success)}>
                      <div style={statNum(diagFirestore.length > 0 ? t.danger : t.success)}>{diagFirestore.length}</div><div style={statLabel}>Problemas</div>
                    </div>
                    <div style={statItem(t.accent)}><div style={statNum(t.accent)}>{(inscricoes || []).length}</div><div style={statLabel}>Inscrições</div></div>
                    <div style={statItem(t.accent)}><div style={statNum(t.accent)}>{(atletas || []).length}</div><div style={statLabel}>Atletas</div></div>
                  </div>
                  {diagFirestore.length > 0 && (
                    <div style={{ overflowX:"auto", borderRadius:10, border:`1px solid ${t.border}` }}>
                      <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead><tr><th style={th}>Coleção</th><th style={th}>Doc ID</th><th style={th}>Campo</th><th style={th}>Valor</th><th style={th}>Problema</th></tr></thead>
                        <tbody>
                          {diagFirestore.map((item, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : t.bgHover }}>
                              <td style={td}><code style={{ fontSize:11 }}>{item.colecao}</code></td>
                              <td style={{ ...td, fontSize:11, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis" }}>{item.docId}</td>
                              <td style={td}><code style={{ fontSize:11 }}>{item.campo}</code></td>
                              <td style={{ ...td, fontSize:11, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis" }}>{item.valor}</td>
                              <td style={td}>
                                <span style={badge(t.danger)}>{item.problema}</span>
                                {item.extra && <span style={{ marginLeft:8, fontSize:11, color:t.textMuted }}>{item.extra}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {diagFirestore.length > 0 && (
                    <button
                      style={{ ...s.btnPrimary, fontSize:12, marginTop:12 }}
                      onClick={async () => {
                        const ok = window.confirm(`Corrigir ${diagFirestore.length} problema(s)? Inscrições e resultados órfãos serão excluídos.`);
                        if (!ok) return;
                        let corrigidos = 0;
                        for (const item of diagFirestore) {
                          try {
                            if (item.colecao === "inscricoes" && excluirInscricao) {
                              excluirInscricao(item.docId); corrigidos++;
                            } else if (item.colecao === "resultados") {
                              await deleteDoc(doc(db, "resultados", item.docId)); corrigidos++;
                            }
                          } catch {}
                        }
                        alert(`${corrigidos} documento(s) órfão(s) removido(s).`);
                        diagnosticarFirestore();
                      }}>
                      Corrigir referências órfãs
                    </button>
                  )}
                  {diagFirestore.length === 0 && <div style={{ textAlign:"center", padding:20, color:t.success, fontSize:13 }}>Nenhuma referência órfã encontrada.</div>}
                </>
              );
            })()}

            {/* Auth */}
            {!diagRodando && diagAba === "auth" && (() => {
              if (!diagAuth) return <div style={{ textAlign:"center", padding:20, color:t.textDisabled, fontSize:13 }}>Clique em "Executar Diagnóstico" para verificar consistência de contas.</div>;
              return (
                <>
                  <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:16 }}>
                    <div style={statItem(diagAuth.length > 0 ? t.accent : t.success)}>
                      <div style={statNum(diagAuth.length > 0 ? t.accent : t.success)}>{diagAuth.length}</div><div style={statLabel}>Alertas</div>
                    </div>
                    {diagOrfaos && !diagOrfaos.erro && (
                      <div style={statItem(diagOrfaos.orphans.length > 0 ? t.danger : t.success)}>
                        <div style={statNum(diagOrfaos.orphans.length > 0 ? t.danger : t.success)}>{diagOrfaos.orphans.length}</div><div style={statLabel}>Órfãs Auth</div>
                      </div>
                    )}
                    {diagOrfaos && !diagOrfaos.erro && (
                      <div style={statItem(t.accent)}><div style={statNum(t.accent)}>{diagOrfaos.totalAuth || "—"}</div><div style={statLabel}>Contas Auth</div></div>
                    )}
                    <div style={statItem(t.accent)}><div style={statNum(t.accent)}>{(organizadores || []).length}</div><div style={statLabel}>Organizadores</div></div>
                    <div style={statItem(t.accent)}><div style={statNum(t.accent)}>{(equipes || []).length}</div><div style={statLabel}>Equipes</div></div>
                  </div>
                  {/* Contas Auth órfãs */}
                  {diagOrfaos && !diagOrfaos.erro && diagOrfaos.orphans.length > 0 && (
                    <div style={{ ...s.card, border:`1px solid ${t.danger}33`, marginBottom:16 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:t.danger, marginBottom:10 }}>
                        Contas Auth Órfãs ({diagOrfaos.orphans.length})
                      </div>
                      <div style={{ fontSize:12, color:t.textMuted, marginBottom:12, lineHeight:1.6 }}>
                        Contas que existem no Firebase Auth mas não estão vinculadas a nenhum registro no Firestore
                        (organizadores, equipes, funcionários, treinadores, atletas).
                      </div>
                      <div style={{ overflowX:"auto", borderRadius:10, border:`1px solid ${t.border}`, marginBottom:12 }}>
                        <table style={{ width:"100%", borderCollapse:"collapse" }}>
                          <thead><tr><th style={th}>Email</th><th style={th}>Criado em</th><th style={th}>Último login</th><th style={th}>Ação</th></tr></thead>
                          <tbody>
                            {diagOrfaos.orphans.map((orfao, i) => (
                              <tr key={orfao.uid} style={{ background: i % 2 === 0 ? "transparent" : t.bgHover }}>
                                <td style={td}>{orfao.email}</td>
                                <td style={td}>{orfao.criadoEm ? new Date(orfao.criadoEm).toLocaleDateString("pt-BR") : "—"}</td>
                                <td style={td}>{orfao.ultimoLogin ? new Date(orfao.ultimoLogin).toLocaleDateString("pt-BR") : "Nunca"}</td>
                                <td style={td}>
                                  <button
                                    style={{ ...s.btnPrimary, fontSize:11, padding:"4px 10px", background:t.danger }}
                                    disabled={deletandoOrfao === orfao.uid}
                                    onClick={async () => {
                                      if (!window.confirm(`Excluir conta Auth de "${orfao.email}"?`)) return;
                                      setDeletandoOrfao(orfao.uid);
                                      try {
                                        const deleteAuthUser = httpsCallable(functions, "deleteAuthUser");
                                        await deleteAuthUser({ email: orfao.email });
                                        setDiagOrfaos(prev => ({ ...prev, orphans: prev.orphans.filter(o => o.uid !== orfao.uid) }));
                                      } catch (err) {
                                        alert("Erro ao excluir: " + err.message);
                                      }
                                      setDeletandoOrfao(null);
                                    }}>
                                    {deletandoOrfao === orfao.uid ? "..." : "Excluir"}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {diagOrfaos.orphans.length > 1 && (
                        <button
                          style={{ ...s.btnPrimary, fontSize:12, background:t.danger }}
                          disabled={deletandoOrfao === "all"}
                          onClick={async () => {
                            if (!window.confirm(`Excluir TODAS as ${diagOrfaos.orphans.length} contas Auth órfãs?`)) return;
                            setDeletandoOrfao("all");
                            const deleteAuthUser = httpsCallable(functions, "deleteAuthUser");
                            let removidos = 0;
                            for (const orfao of diagOrfaos.orphans) {
                              try {
                                await deleteAuthUser({ email: orfao.email });
                                removidos++;
                              } catch (err) {
                                console.warn(`Erro ao excluir ${orfao.email}:`, err.message);
                              }
                            }
                            setDiagOrfaos(prev => ({ ...prev, orphans: [] }));
                            setDeletandoOrfao(null);
                            alert(`${removidos} conta(s) órfã(s) excluída(s).`);
                          }}>
                          {deletandoOrfao === "all" ? "Excluindo..." : `Excluir todas (${diagOrfaos.orphans.length})`}
                        </button>
                      )}
                    </div>
                  )}
                  {diagOrfaos && !diagOrfaos.erro && diagOrfaos.orphans.length === 0 && (
                    <div style={{ ...s.card, background:t.bgHover, marginBottom:16 }}>
                      <div style={{ fontSize:12, color:t.success, lineHeight:1.6 }}>
                        Nenhuma conta Auth órfã encontrada. Todas as contas estão vinculadas a registros no Firestore.
                      </div>
                    </div>
                  )}
                  {diagOrfaos?.erro && (
                    <div style={{ ...s.card, background:t.bgHover, marginBottom:16 }}>
                      <div style={{ fontSize:12, color:t.danger, lineHeight:1.6 }}>
                        Erro ao consultar contas Auth: {diagOrfaos.erro}
                      </div>
                    </div>
                  )}
                  {diagAuth.length > 0 && (
                    <>
                      <div style={{ overflowX:"auto", borderRadius:10, border:`1px solid ${t.border}`, marginBottom:12 }}>
                        <table style={{ width:"100%", borderCollapse:"collapse" }}>
                          <thead><tr><th style={th}>Tipo</th><th style={th}>Nome</th><th style={th}>Problema</th></tr></thead>
                          <tbody>
                            {diagAuth.map((item, i) => (
                              <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : t.bgHover }}>
                                <td style={td}>{item.tipo}</td>
                                <td style={td}>{item.nome}</td>
                                <td style={td}><span style={badge(t.danger)}>{item.problema}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {diagAuth.some(item => item.tipo === "Atleta" && item.problema.startsWith("Email duplicado")) && (
                        <button
                          style={{ ...s.btnPrimary, fontSize:12 }}
                          onClick={async () => {
                            const emailsVistos = {};
                            let corrigidos = 0;
                            for (const atl of (atletas || [])) {
                              if (!atl.email) continue;
                              const email = atl.email.toLowerCase().trim();
                              if (emailsVistos[email]) {
                                try { await atualizarAtleta({ ...atl, email: "" }); } catch {}
                                corrigidos++;
                              } else {
                                emailsVistos[email] = true;
                              }
                            }
                            if (corrigidos > 0) {
                              alert(`${corrigidos} email(s) duplicado(s) removido(s) de atletas.`);
                              diagnosticarAuth();
                            } else {
                              alert("Nenhum email duplicado encontrado.");
                            }
                          }}>
                          Corrigir emails duplicados de atletas
                        </button>
                      )}
                    </>
                  )}
                  {diagAuth.length === 0 && <div style={{ textAlign:"center", padding:20, color:t.success, fontSize:13 }}>Nenhum alerta de consistência encontrado.</div>}

                  {/* ── Migração em massa: criar contas Auth para perfis legados ── */}
                  <div style={{ ...s.card, background:t.bgHover, marginTop:20 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:t.textPrimary, marginBottom:8 }}>Migração em Massa — Contas Auth</div>
                    <div style={{ fontSize:12, color:t.textMuted, lineHeight:1.6, marginBottom:12 }}>
                      Cria contas no Firebase Auth para todos os perfis que possuem email mas ainda não têm conta Auth.
                      Uma senha temporária será gerada para cada um. O usuário será obrigado a trocar no primeiro acesso.
                    </div>
                    <button
                      style={{ ...s.btnPrimary, fontSize:12 }}
                      disabled={diagRodando}
                      onClick={async () => {
                        if (!gerarSenhaTemp) { alert("Função gerarSenhaTemp não disponível."); return; }
                        const { secondaryAuth, createUserWithEmailAndPassword, signOut: fbSignOut } = await import("../../firebase");

                        const perfis = [
                          ...(organizadores || []).filter(o => o.email && o.status === "aprovado").map(o => ({ tipo: "organizador", id: o.id, email: o.email, nome: o.nome })),
                          ...(equipes || []).filter(e => e.email).map(e => ({ tipo: "equipe", id: e.id, email: e.email, nome: e.nome })),
                          ...(funcionarios || []).filter(f => f.email && f.ativo !== false).map(f => ({ tipo: "funcionario", id: f.id, email: f.email, nome: f.nome })),
                          ...(treinadores || []).filter(tr => tr.email && tr.ativo !== false).map(tr => ({ tipo: "treinador", id: tr.id, email: tr.email, nome: tr.nome })),
                          ...(atletasUsuarios || []).filter(a => a.email).map(a => ({ tipo: "atleta", id: a.id, email: a.email, nome: a.nome })),
                        ];

                        // Deduplicar por email
                        const vistos = new Set();
                        const unicos = perfis.filter(p => {
                          const e = p.email.toLowerCase().trim();
                          if (vistos.has(e)) return false;
                          vistos.add(e);
                          return true;
                        });

                        let criados = 0, jaExistiam = 0, erros = 0;
                        setDiagRodando(true);

                        for (const perfil of unicos) {
                          const senhaTemp = gerarSenhaTemp();
                          try {
                            await createUserWithEmailAndPassword(secondaryAuth, perfil.email.trim(), senhaTemp);
                            await fbSignOut(secondaryAuth).catch(() => {});
                            criados++;
                            // Marcar senhaTemporaria no registro
                            const updFlag = arr => arr.map(u => u.id === perfil.id ? { ...u, senhaTemporaria: true } : u);
                            if (perfil.tipo === "organizador") setOrganizadores(updFlag);
                            else if (perfil.tipo === "funcionario") setFuncionarios(updFlag);
                            else if (perfil.tipo === "treinador") setTreinadores(updFlag);
                            else if (perfil.tipo === "atleta") setAtletasUsuarios(updFlag);
                            else if (perfil.tipo === "equipe") {
                              try { const { atualizarCamposEquipe } = await import("../../hooks/useEquipes"); } catch {}
                            }
                          } catch (err) {
                            if (err.code === "auth/email-already-in-use") jaExistiam++;
                            else erros++;
                          }
                        }

                        setDiagRodando(false);
                        alert(
                          `Migração concluída!\n\n` +
                          `${criados} conta(s) criada(s) com senha temporária\n` +
                          `${jaExistiam} já possuíam conta Auth\n` +
                          `${erros} erro(s)\n` +
                          `${unicos.length} email(s) verificado(s) no total`
                        );
                        if (registrarAcao) registrarAcao(usuarioLogado.id, usuarioLogado.nome,
                          "Migração Auth em massa", `${criados} criadas, ${jaExistiam} existentes, ${erros} erros`,
                          null, { modulo: "admin" });
                      }}>
                      Migrar Contas Legadas para Firebase Auth
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        );
      })()}

      {bannerParaCortar && (
        <CortarImagem
          imageSrc={bannerParaCortar}
          onConfirmar={(blob) => { setBannerParaCortar(null); uploadImagemOrg(blob, "banner"); }}
          onCancelar={() => setBannerParaCortar(null)}
        />
      )}

      {logoFooterParaCortar && (
        <CortarImagem
          imageSrc={logoFooterParaCortar}
          onConfirmar={async (blob) => {
            setLogoFooterParaCortar(null);
            try {
              if (siteBranding?.logoFooter) {
                try { await deleteObject(storageRef(storage, siteBranding.logoFooter)); } catch {}
              }
              const ref = storageRef(storage, `branding/logo-footer-${Date.now()}.webp`);
              await uploadBytes(ref, blob);
              const url = await getDownloadURL(ref);
              setSiteBranding(prev => ({ ...prev, logoFooter: url }));
            } catch (err) {
              setErro("Erro ao enviar logo do rodapé.");
              console.error("[LogoFooter] Upload error:", err);
            }
          }}
          onCancelar={() => setLogoFooterParaCortar(null)}
        />
      )}
    </div>
  );
}

export default TelaConfiguracoes;
