import React, { useState } from "react";
import { useTema } from "../../shared/TemaContext";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useApp } from "../../contexts/AppContext";

function getStyles(t) {
  return {
    page: { maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" },
    title: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 800, color: t.textPrimary, marginBottom: 4, letterSpacing: 1, textAlign: "center" },
    subtitle: { fontSize: 14, color: t.textMuted, marginBottom: 40, textAlign: "center" },
    faqItem: { marginBottom: 8 },
    question: {
      width: "100%", textAlign: "left", cursor: "pointer", border: "none",
      background: t.bgCard, padding: "18px 20px", borderRadius: 10,
      fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700,
      color: t.textPrimary, display: "flex", justifyContent: "space-between", alignItems: "center",
      letterSpacing: 0.5, transition: "background 0.15s",
    },
    questionOpen: { background: t.accent, color: "#fff", borderRadius: "10px 10px 0 0" },
    answer: {
      background: t.bgHeaderSolid, padding: "16px 20px", borderRadius: "0 0 10px 10px",
      fontSize: 14, lineHeight: 1.7, color: t.textSecondary, border: `1px solid ${t.border}`, borderTop: "none",
    },
    arrow: { fontSize: 14, transition: "transform 0.2s", flexShrink: 0, marginLeft: 12 },
    btnVoltar: { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 16, padding: 0 },
  };
}

const FAQ_ITEMS = [
  {
    pergunta: "O Gerentrack funciona sem internet?",
    resposta: "Sim. O Gerentrack é um PWA (Progressive Web App) que funciona completamente offline. Os dados são armazenados no dispositivo via IndexedDB e sincronizados automaticamente quando a conexão retorna. Você pode digitar resultados, confirmar presença na câmara de chamada e entregar medalhas sem internet — ideal para pistas e estádios sem cobertura."
  },
  {
    pergunta: "Como funciona o suporte?",
    resposta: "O suporte é prestado em dias úteis, das 09:00 às 18:00 (horário de Brasília), por e-mail ou chat. O tempo de resposta varia conforme a severidade: chamados críticos (plataforma indisponível) são atendidos em até 2 horas úteis, urgentes em até 8 horas e normais em até 24 horas. Suporte presencial ou remoto durante competições pode ser contratado como serviço adicional."
  },
  {
    pergunta: "Meus dados estão seguros?",
    resposta: "Sim. Os dados são armazenados no Google Cloud (Firebase), que possui certificações ISO 27001, ISO 27017, ISO 27018, SOC 1/2/3. Todas as conexões são criptografadas via HTTPS/TLS, as senhas são protegidas com criptografia scrypt (Firebase Authentication), e toda entrada de usuário é sanitizada contra XSS. A plataforma mantém trilha de auditoria completa e está em conformidade com a LGPD (Lei 13.709/2018)."
  },
  {
    pergunta: "O sistema atende às regras da World Athletics?",
    resposta: "Sim. A seriação (distribuição em séries) segue as regras técnicas RT 20.3 a 20.8 da World Athletics, com distribuição automática por raias conforme a distância da prova. A plataforma também aplica a Norma 12 da CBAt para controle de limite de provas na categoria Sub-14 e utiliza as tabelas oficiais de pontuação da World Athletics para eventos combinados (Decatlo, Heptatlo, etc.)."
  },
  {
    pergunta: "Posso importar dados de planilhas?",
    resposta: "Sim. O Gerentrack suporta importação em massa via arquivos Excel (.xlsx) para atletas, equipes, inscrições, ranking e recordes. A importação inclui validação linha a linha com preview antes da confirmação, mapeamento flexível de colunas e detecção automática de formatos de data. Também é possível exportar todos os dados para Excel a qualquer momento."
  },
  {
    pergunta: "Como funciona a integração com FinishLynx?",
    resposta: "O Gerentrack importa resultados de arquivos .lif (FinishLynx Image Format) com tempos em milésimos de segundo, e exporta dados de competição para formato .evt compatível com o FinishLynx. A integração é bidirecional e está inclusa em todos os planos, sem custo adicional."
  },
  {
    pergunta: "Quantos usuários podem acessar simultaneamente?",
    resposta: "Não há limite de usuários simultâneos. A plataforma opera sobre Google Cloud Firestore (que suporta até 1 milhão de conexões simultâneas) e Vercel Edge Network (70+ pontos de presença globais). Cada usuário trabalha com dados processados localmente no navegador, reduzindo a carga no servidor. Organizadores, funcionários e equipes podem operar ao mesmo tempo sem degradação."
  },
  {
    pergunta: "O que acontece com meus dados se eu cancelar o contrato?",
    resposta: "Seus dados são de sua propriedade. Ao término do contrato, a Gerentrack fornece todos os dados em formato CSV (atletas, equipes, inscrições, resultados, recordes, ranking e histórico de auditoria) no prazo de 30 dias. Após confirmação de recebimento, os dados são eliminados dos servidores."
  },
  {
    pergunta: "Quais modalidades de atletismo são suportadas?",
    resposta: "Mais de 80 modalidades: corridas rasas (60m a 10000m), barreiras (60m a 400m), obstáculos (1500m a 3000m), marcha atlética (2000m a 35000m), revezamentos (4x75m a 4x400m misto), saltos (distância, altura, triplo, vara), arremessos e lançamentos (peso, disco, dardo, martelo) e eventos combinados (tetratlo, pentatlo, hexatlo, heptatlo, decatlo). Pesos de implementos variam automaticamente por categoria conforme regras da CBAt."
  },
];

export default function TelaFaq() {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { setTela } = useApp();
  const [aberto, setAberto] = useState(null);

  return (
    <div style={s.page}>
      <button style={s.btnVoltar} onClick={() => setTela("home")}>← Voltar</button>

      <h1 style={s.title}>Perguntas Frequentes</h1>
      <p style={s.subtitle}>Tire suas dúvidas sobre a plataforma Gerentrack</p>

      {FAQ_ITEMS.map((item, idx) => {
        const isAberto = aberto === idx;
        return (
          <div key={idx} style={s.faqItem}>
            <button
              style={{ ...s.question, ...(isAberto ? s.questionOpen : {}) }}
              onClick={() => setAberto(isAberto ? null : idx)}
            >
              <span>{item.pergunta}</span>
              <span style={{ ...s.arrow, transform: isAberto ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
            </button>
            {isAberto && (
              <div style={s.answer}>
                {item.resposta}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
