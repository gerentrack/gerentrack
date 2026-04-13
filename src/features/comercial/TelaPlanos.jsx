import React from "react";
import { useTema } from "../../shared/TemaContext";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useApp } from "../../contexts/AppContext";

function getStyles(t) {
  return {
    page: { maxWidth: 1000, margin: "0 auto", padding: "40px 24px 80px" },
    title: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 800, color: t.textPrimary, marginBottom: 4, letterSpacing: 1, textAlign: "center" },
    subtitle: { fontSize: 14, color: t.textMuted, marginBottom: 32, textAlign: "center", lineHeight: 1.6 },
    planosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 40 },
    planoCard: (destaque) => ({
      background: t.bgCard, border: `2px solid ${destaque ? t.accent : t.border}`, borderRadius: 14,
      padding: "28px 24px", display: "flex", flexDirection: "column", position: "relative",
      ...(destaque ? { boxShadow: `0 0 24px ${t.accent}22` } : {}),
    }),
    planoBadge: { position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: t.accent, color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: 1, padding: "4px 14px", borderRadius: 20, textTransform: "uppercase" },
    planoNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 800, color: t.textPrimary, marginBottom: 4 },
    planoPreco: { fontSize: 28, fontWeight: 800, color: t.accent, marginBottom: 2 },
    planoPrecoSub: { fontSize: 12, color: t.textMuted, marginBottom: 16 },
    planoLista: { listStyle: "none", padding: 0, margin: 0, flex: 1 },
    planoItem: { fontSize: 13, color: t.textSecondary, padding: "6px 0", borderBottom: `1px solid ${t.border}08`, lineHeight: 1.6 },
    planoItemIcon: { marginRight: 8 },
    sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 16, letterSpacing: 1 },
    taxaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 40 },
    taxaCard: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: "16px 18px", textAlign: "center" },
    taxaFaixa: { fontSize: 12, color: t.textMuted, marginBottom: 4 },
    taxaValor: { fontSize: 20, fontWeight: 800, color: t.accent },
    servicosTable: { width: "100%", borderCollapse: "collapse", marginBottom: 40 },
    stTh: { background: t.bgHeaderSolid, padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textDimmed, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` },
    stTd: { padding: "10px 14px", fontSize: 13, color: t.textSecondary, borderBottom: `1px solid ${t.border}` },
    stTdValor: { padding: "10px 14px", fontSize: 13, color: t.accent, fontWeight: 700, borderBottom: `1px solid ${t.border}`, whiteSpace: "nowrap" },
    nota: { fontSize: 12, color: t.textDimmed, lineHeight: 1.7, marginBottom: 24 },
    ctaWrap: { textAlign: "center", marginTop: 32 },
    ctaBtn: { display: "inline-block", background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", border: "none", padding: "14px 36px", borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, textDecoration: "none" },
    btnVoltar: { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 16, padding: 0 },
  };
}

const PLANOS = [
  {
    id: "avulso",
    nome: "Avulso",
    preco: "400,00",
    periodo: "competição",
    destaque: true,
    desconto: null,
    herda: null,
    recursos: [
      "Usuários e inscrições ilimitadas",
      "Página pública da entidade",
      "Inscrições e seriação automática",
      "Súmulas e resultados em tempo real",
      "Câmara de chamada e QR Code",
      "Integração FinishLynx",
      "Pontuação de equipes personalizada",
      "Pontuação automática de provas combinadas",
      "Controle de medalhas",
      "Exportação de resultados em PDF",
      "PWA (funciona offline no evento)",
      "Suporte por e-mail (até 48h úteis)",
    ],
  },
  {
    id: "trimestral",
    nome: "Trimestral",
    preco: null,
    periodo: null,
    destaque: true,
    desconto: null,
    herda: "Tudo do Avulso",
    recursos: [
      "Manutenção dos dados de atletas e equipes",
      "Manutenção da página pública da entidade",
      "Histórico de competições anteriores",
    ],
  },
  {
    id: "anual",
    nome: "Anual",
    preco: null,
    periodo: null,
    destaque: true,
    desconto: null,
    herda: "Tudo do Trimestral",
    recursos: [
      "Ranking e recordes com atualização automática",
      "Suporte prioritário (até 24h úteis)",
      "Atendimento por e-mail + WhatsApp",
      "Canal direto com equipe técnica",
      "Condições sob consulta",
    ],
  },
];

const SERVICOS = [
  { nome: "Treinamento online (2h)", valor: "R$ 500,00/sessão", desc: "Capacitação remota para equipe de secretaria e organização" },
  { nome: "Suporte a competição (remoto)", valor: "R$ 300,00/dia", desc: "Acompanhamento em tempo real durante o evento" },
];

function TelaPlanos() {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { setTela } = useApp();

  return (
    <div style={s.page}>
      <button style={s.btnVoltar} onClick={() => setTela("home")}>← Voltar</button>
      <h1 style={s.title}>Planos e Preços</h1>
      <p style={s.subtitle}>
        Escolha o período ideal para sua federação, liga ou entidade esportiva.<br />
        Todos os planos incluem acesso completo a todos os módulos da plataforma, usuários e inscrições ilimitadas.
      </p>

      {/* ── Planos ── */}
      <div style={s.planosGrid}>
        {PLANOS.map(plano => (
          <div key={plano.id} style={s.planoCard(plano.destaque)}>
            <div style={s.planoNome}>{plano.nome}</div>
            {plano.preco ? (
              <>
                <div style={s.planoPreco}>R$ {plano.preco}</div>
                <div style={s.planoPrecoSub}>
                  por {plano.periodo}
                  {plano.desconto && <span style={{ color: t.success, marginLeft: 8, fontWeight: 700 }}>-{plano.desconto}</span>}
                </div>
              </>
            ) : (
              <div style={{ ...s.planoPreco, fontSize: 20, marginBottom: 18 }}>Sob consulta</div>
            )}
            <ul style={s.planoLista}>
              {plano.herda && (
                <li style={{ ...s.planoItem, color: t.accent, fontWeight: 700, borderBottom: `1px solid ${t.border}22` }}>
                  <span style={s.planoItemIcon}>+</span>{plano.herda}
                </li>
              )}
              {plano.recursos.map((rec, i) => (
                <li key={i} style={s.planoItem}>
                  <span style={s.planoItemIcon}>✓</span>{rec}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Serviços adicionais ── */}
      <h2 style={s.sectionTitle}>Serviços Adicionais</h2>
      <p style={{ ...s.nota, marginBottom: 16 }}>
        Opcionais, contratados sob demanda.
      </p>
      <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${t.border}`, marginBottom: 40 }}>
        <table style={s.servicosTable}>
          <thead>
            <tr>
              <th style={s.stTh}>Serviço</th>
              <th style={s.stTh}>Valor</th>
              <th style={s.stTh}>Descrição</th>
            </tr>
          </thead>
          <tbody>
            {SERVICOS.map((srv, i) => (
              <tr key={i}>
                <td style={s.stTd}>{srv.nome}</td>
                <td style={s.stTdValor}>{srv.valor}</td>
                <td style={s.stTd}>{srv.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── CTA ── */}
      <div style={s.ctaWrap}>
        <p style={{ color: t.textMuted, fontSize: 14, marginBottom: 16 }}>
          Entre em contato para contratar ou tirar dúvidas
        </p>
        <a href="mailto:atendimento@gerentrack.com.br" style={s.ctaBtn}>
          atendimento@gerentrack.com.br
        </a>
      </div>
    </div>
  );
}

export default TelaPlanos;
