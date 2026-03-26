import React, { useMemo } from "react";
import { getStatusEvento, labelStatusEvento } from "../eventos/eventoHelpers";
import { _getLocalEventoDisplay } from "../../shared/formatters/utils";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useTema } from "../../shared/TemaContext";
import { useEvento } from "../../contexts/EventoContext";
import { useApp } from "../../contexts/AppContext";

function getStyles(t) {
  return {
    page: { maxWidth: 1200, margin: "0 auto", padding: "0 0 80px" },
    bannerWrap: { position: "relative", width: "100%", minHeight: 220, borderRadius: "0 0 20px 20px", overflow: "hidden", marginBottom: -50 },
    bannerImg: { width: "100%", height: 280, objectFit: "cover", display: "block" },
    bannerFallback: { width: "100%", height: 280, display: "flex", alignItems: "center", justifyContent: "center" },
    bannerOverlay: { position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7) 100%)", pointerEvents: "none" },
    profileArea: { position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 24px", marginTop: -40 },
    logoWrap: { width: 100, height: 100, borderRadius: 16, overflow: "hidden", border: `4px solid ${t.bgCard}`, background: t.bgCard, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" },
    logoImg: { width: "100%", height: "100%", objectFit: "contain" },
    logoFallback: { fontSize: 48, color: t.textDisabled },
    orgName: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: t.textPrimary, textAlign: "center", marginTop: 14, letterSpacing: 1, lineHeight: 1.1 },
    orgEntidade: { fontSize: 15, color: t.textMuted, textAlign: "center", marginTop: 4 },
    orgLocal: { fontSize: 13, color: t.textDimmed, textAlign: "center", marginTop: 4 },
    socialRow: { display: "flex", gap: 10, justifyContent: "center", marginTop: 12, flexWrap: "wrap" },
    socialLink: { fontSize: 13, color: t.accent, background: `${t.accent}12`, border: `1px solid ${t.accent}33`, borderRadius: 20, padding: "5px 14px", textDecoration: "none", fontWeight: 600, cursor: "pointer" },
    descBox: { maxWidth: 700, margin: "24px auto 0", padding: "0 24px", textAlign: "center", color: t.textTertiary, fontSize: 14, lineHeight: 1.7 },
    statsRow: { display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", margin: "28px 24px 0" },
    statCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px 24px", textAlign: "center", minWidth: 100 },
    statValue: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, lineHeight: 1 },
    statLabel: { fontSize: 12, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 },
    sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 800, color: t.textPrimary, marginBottom: 16, letterSpacing: 1, padding: "0 24px" },
    eventosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: 16, padding: "0 24px" },
    eventoCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s" },
    eventoCardBody: { padding: "14px 18px" },
    eventoCardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: t.textPrimary, lineHeight: 1.2 },
    eventoCardMeta: { fontSize: 12, color: t.textDimmed, marginTop: 4 },
    eventoCardStats: { display: "flex", gap: 12, fontSize: 12, color: t.textMuted, marginTop: 8, borderTop: `1px solid ${t.border}`, paddingTop: 8 },
    eventoStatusBadge: (status) => ({
      display: "inline-block", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700,
      background: status === "ao_vivo" ? `${t.danger}18` : status === "futuro" ? `${t.success}18` : t.bgCardAlt,
      color: status === "ao_vivo" ? t.danger : status === "futuro" ? t.success : t.textDisabled,
      border: `1px solid ${status === "ao_vivo" ? `${t.danger}44` : status === "futuro" ? `${t.success}44` : t.border}`,
    }),
    emptyState: { textAlign: "center", padding: "60px 20px", color: t.textDisabled },
    backBtn: { background: "transparent", color: t.textMuted, border: `1px solid ${t.borderLight}`, padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Barlow', sans-serif", margin: "20px 24px 0" },
    finalizadoRow: { display: "flex", flexDirection: "column", gap: 6, padding: "0 24px" },
    finalizadoItem: { display: "flex", flexDirection: "column", gap: 2, padding: "10px 14px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, cursor: "pointer", transition: "border-color 0.15s" },
  };
}

export default function TelaPerfilOrganizador() {
  const { eventos, inscricoes, atletas, equipes, resultados, selecionarEvento } = useEvento();
  const { setTela, organizadorPerfilId, organizadores } = useApp();
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));

  const org = organizadores?.find(o => o.id === organizadorPerfilId);
  if (!org) return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
      <span style={{ fontSize: 56 }}>🔍</span>
      <p style={{ color: t.textDisabled, marginTop: 12 }}>Organizador não encontrado.</p>
      <button style={s.backBtn} onClick={() => setTela("home")}>← Voltar</button>
    </div>
  );

  // Cores customizadas do organizador
  const corPri = org.corPrimaria || t.accent;
  const corSec = org.corSecundaria || t.accentDark;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const eventosOrg = useMemo(() =>
    eventos
      .filter(ev => ev.organizadorId === org.id && (!ev.statusAprovacao || ev.statusAprovacao === "aprovado"))
      .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0)),
    [eventos, org.id]
  );

  const eventosFuturos = eventosOrg.filter(ev => {
    if (ev.competicaoFinalizada) return false;
    if (!ev.data) return true;
    return new Date(ev.data + "T12:00:00") >= hoje;
  });
  const eventosPassados = eventosOrg.filter(ev => {
    if (ev.competicaoFinalizada) return true;
    if (!ev.data) return false;
    return new Date(ev.data + "T12:00:00") < hoje;
  });

  const eventosOrgIds = new Set(eventosOrg.map(ev => ev.id));
  const totalInscricoes = inscricoes.filter(i => eventosOrgIds.has(i.eventoId)).length;
  const equipesVinculadas = (equipes || []).filter(eq => eq.organizadorId === org.id).length;
  const totalAtletas = (atletas || []).filter(a => a.organizadorId === org.id).length;

  const renderEventoCard = (ev) => {
    const nInscs = inscricoes.filter(i => i.eventoId === ev.id).length;
    const nAtletas = new Set(inscricoes.filter(i => i.eventoId === ev.id).map(i => i.atletaId)).size;
    const nProvas = (ev.provasPrograma || []).length;
    const status = getStatusEvento(ev, resultados);
    const dataEv = ev.data ? new Date(ev.data + "T12:00:00") : null;
    return (
      <div key={ev.id} style={{ ...s.eventoCard, padding: 0 }}>
        <div style={{ position: "relative", width: "100%", minHeight: (ev.logoCompeticao && !ev.competicaoFinalizada) ? 0 : 60, background: (ev.logoCompeticao && !ev.competicaoFinalizada) ? "transparent" : `linear-gradient(135deg, ${corPri}22, ${corSec}22)`, borderBottom: `1px solid ${t.border}`, overflow: "hidden" }}>
          {ev.logoCompeticao && !ev.competicaoFinalizada ? (
            <img src={ev.logoCompeticao} alt="" style={{ width: "100%", display: "block", objectFit: "contain" }} />
          ) : null}
          <div style={{ position: "absolute", top: 10, left: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={s.eventoStatusBadge(status)}>{labelStatusEvento(status, ev)}</span>
          </div>
        </div>
        <div style={{ padding: "14px 20px 20px" }}>
          <div style={s.eventoCardNome}>{ev.nome}</div>
          {dataEv && (
            <div style={s.eventoCardMeta}>
              <span>📅 {dataEv.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                {ev.horaInicio && <> · ⏰ {ev.horaInicio}h</>}
              </span>
            </div>
          )}
          <div style={s.eventoCardMeta}><span>📍 {_getLocalEventoDisplay(ev)}</span></div>
          {(ev.dataAberturaInscricoes || ev.dataEncerramentoInscricoes) && (
            <div style={s.eventoCardMeta}>
              <span>📋 Inscrições:&nbsp;
                {ev.dataAberturaInscricoes && <>{new Date(ev.dataAberturaInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}</>}
                {ev.dataAberturaInscricoes && ev.dataEncerramentoInscricoes && " a "}
                {ev.dataEncerramentoInscricoes && <>{new Date(ev.dataEncerramentoInscricoes + "T12:00:00").toLocaleDateString("pt-BR")}</>}
              </span>
            </div>
          )}
          <div style={s.eventoCardStats}>
            <span>🎯 {nProvas} prova{nProvas !== 1 ? "s" : ""}</span>
            <span>🏃 {nAtletas} atleta{nAtletas !== 1 ? "s" : ""}</span>
            <span>✍️ {nInscs} {nInscs !== 1 ? "inscrições" : "inscrição"}</span>
          </div>
          <button style={{ background: `linear-gradient(135deg, ${corPri}, ${corSec})`, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, width: "100%", marginTop: 8, transition: "opacity 0.2s" }}
            onClick={() => selecionarEvento(ev.id)}>
            Acessar Competição →
          </button>
        </div>
      </div>
    );
  };

  const socialLinks = [];
  if (org.site) socialLinks.push({ label: "Site", url: org.site.startsWith("http") ? org.site : "https://" + org.site });
  if (org.redesSociais?.instagram) socialLinks.push({ label: "Instagram", url: "https://instagram.com/" + org.redesSociais.instagram.replace(/^@/, "") });
  if (org.redesSociais?.facebook) socialLinks.push({ label: "Facebook", url: org.redesSociais.facebook.startsWith("http") ? org.redesSociais.facebook : "https://facebook.com/" + org.redesSociais.facebook });
  if (org.redesSociais?.twitter) socialLinks.push({ label: "X / Twitter", url: "https://x.com/" + org.redesSociais.twitter.replace(/^@/, "") });

  return (
    <div style={s.page}>
      {/* Banner */}
      <div style={s.bannerWrap}>
        {org.banner ? (
          <img src={org.banner} alt="" style={s.bannerImg} />
        ) : (
          <div style={{ ...s.bannerFallback, background: `linear-gradient(135deg, ${corPri}, ${corSec})` }}>
            <span style={{ fontSize: 18, opacity: 0.15, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, letterSpacing: 4, color: "#fff" }}>GERENTRACK</span>
          </div>
        )}
        <div style={s.bannerOverlay} />
      </div>

      {/* Profile area */}
      <div style={s.profileArea}>
        <div style={s.logoWrap}>
          {org.logo ? (
            <img src={org.logo} alt={org.entidade} style={s.logoImg} />
          ) : (
            <span style={{ fontSize: 14, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: t.textDisabled }}>ORG</span>
          )}
        </div>
        <h1 style={{ ...s.orgName, color: corPri }}>{org.entidade || org.nome}</h1>
        {org.entidade && org.nome && org.entidade !== org.nome && (
          <div style={s.orgEntidade}>{org.nome}</div>
        )}
        {(org.cidade || org.estado) && (
          <div style={s.orgLocal}>
            📍 {[org.cidade, org.estado].filter(Boolean).join(", ")}
          </div>
        )}

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div style={s.socialRow}>
            {socialLinks.map(link => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{ ...s.socialLink, color: corPri, background: `${corPri}12`, borderColor: `${corPri}33` }}>
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Descrição */}
      {org.descricao && (
        <div style={s.descBox}>{org.descricao}</div>
      )}

      {/* Stats */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={{ ...s.statValue, color: corPri }}>{eventosOrg.length}</div>
          <div style={s.statLabel}>Competições</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statValue, color: corPri }}>{equipesVinculadas}</div>
          <div style={s.statLabel}>Equipes</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statValue, color: corPri }}>{totalAtletas}</div>
          <div style={s.statLabel}>Atletas</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statValue, color: corPri }}>{totalInscricoes}</div>
          <div style={s.statLabel}>Inscrições</div>
        </div>
      </div>

      {/* Eventos futuros */}
      {eventosFuturos.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={s.sectionTitle}>Próximas Competições</h2>
          <div style={s.eventosGrid}>
            {eventosFuturos.map(renderEventoCard)}
          </div>
        </div>
      )}

      {/* Eventos passados */}
      {eventosPassados.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={s.sectionTitle}>Competições Finalizadas</h2>
          <div style={s.finalizadoRow}>
            {eventosPassados.map(ev => {
              const dataFmt = ev.data ? new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR") : "—";
              const local = _getLocalEventoDisplay(ev);
              return (
                <div key={ev.id} style={s.finalizadoItem}
                  onClick={() => selecionarEvento(ev.id)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = corPri}
                  onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary }}>
                    <span style={{ color: t.textDimmed, fontWeight: 600 }}>{dataFmt}</span>
                    <span style={{ margin: "0 8px", color: t.textDisabled }}>—</span>
                    {ev.nome}
                  </div>
                  {local && <div style={{ fontSize: 12, color: t.textMuted }}>📍 {local}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {eventosOrg.length === 0 && (
        <div style={s.emptyState}>
          <p>Este organizador ainda não possui competições.</p>
        </div>
      )}

      <button style={s.backBtn} onClick={() => setTela("home")}>← Voltar à página inicial</button>
    </div>
  );
}
