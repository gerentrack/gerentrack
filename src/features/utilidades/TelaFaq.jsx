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
    resposta: "Sim. O Gerentrack e um PWA (Progressive Web App) que funciona completamente offline. Os dados sao armazenados no dispositivo via IndexedDB e sincronizados automaticamente quando a conexao retorna. Voce pode digitar resultados, confirmar presenca na camara de chamada e entregar medalhas sem internet — ideal para pistas e estadios sem cobertura."
  },
  {
    pergunta: "Quantas competicoes posso gerenciar?",
    resposta: "Depende do plano contratado: o plano Basico permite ate 1 competicao por mes, o Intermediario ate 3 por mes, e o Completo oferece competicoes ilimitadas. A plataforma opera sobre infraestrutura Google Cloud com escalabilidade automatica — nao ha limite tecnico de competicoes simultaneas, atletas ou equipes cadastradas."
  },
  {
    pergunta: "Como funciona o suporte?",
    resposta: "O suporte e prestado em dias uteis, das 09:00 as 18:00 (horario de Brasilia), por e-mail ou chat. O tempo de resposta varia conforme a severidade: chamados criticos (plataforma indisponivel) sao atendidos em ate 2 horas uteis, urgentes em ate 8 horas e normais em ate 24 horas. Suporte presencial ou remoto durante competicoes pode ser contratado como servico adicional."
  },
  {
    pergunta: "Meus dados estao seguros?",
    resposta: "Sim. Os dados sao armazenados no Google Cloud (Firebase), que possui certificacoes ISO 27001, ISO 27017, ISO 27018, SOC 1/2/3. Todas as conexoes sao criptografadas via HTTPS/TLS, as senhas sao protegidas com criptografia scrypt (Firebase Authentication), e toda entrada de usuario e sanitizada contra XSS. A plataforma mantem trilha de auditoria completa e esta em conformidade com a LGPD (Lei 13.709/2018)."
  },
  {
    pergunta: "O sistema atende as regras da World Athletics?",
    resposta: "Sim. A seriacao (distribuicao em series) segue as regras tecnicas RT 20.3 a 20.8 da World Athletics, com distribuicao automatica por raias conforme a distancia da prova. A plataforma tambem aplica a Norma 12 da CBAt para controle de limite de provas na categoria Sub-14 e utiliza as tabelas oficiais de pontuacao da World Athletics para eventos combinados (Decatlo, Heptatlo, etc.)."
  },
  {
    pergunta: "Posso importar dados de planilhas?",
    resposta: "Sim. O Gerentrack suporta importacao em massa via arquivos Excel (.xlsx) para atletas, equipes, inscricoes, ranking e recordes. A importacao inclui validacao linha a linha com preview antes da confirmacao, mapeamento flexivel de colunas e deteccao automatica de formatos de data. Tambem e possivel exportar todos os dados para Excel a qualquer momento."
  },
  {
    pergunta: "Como funciona a integracao com FinishLynx?",
    resposta: "O Gerentrack importa resultados de arquivos .lif (FinishLynx Image Format) com tempos em milesimos de segundo, e exporta dados de competicao para formato .evt compativel com o FinishLynx. A integracao e bidirecional e esta inclusa em todos os planos, sem custo adicional."
  },
  {
    pergunta: "Quantos usuarios podem acessar simultaneamente?",
    resposta: "Nao ha limite de usuarios simultaneos. A plataforma opera sobre Google Cloud Firestore (que suporta ate 1 milhao de conexoes simultaneas) e Vercel Edge Network (70+ pontos de presenca globais). Cada usuario trabalha com dados processados localmente no navegador, reduzindo a carga no servidor. Organizadores, funcionarios e equipes podem operar ao mesmo tempo sem degradacao."
  },
  {
    pergunta: "O que acontece com meus dados se eu cancelar o contrato?",
    resposta: "Seus dados sao de sua propriedade. Ao termino do contrato, a Gerentrack fornece todos os dados em formato CSV (atletas, equipes, inscricoes, resultados, recordes, ranking e historico de auditoria) no prazo de 30 dias. Apos confirmacao de recebimento, os dados sao eliminados dos servidores."
  },
  {
    pergunta: "Quais modalidades de atletismo sao suportadas?",
    resposta: "Mais de 80 modalidades: corridas rasas (60m a 10000m), barreiras (60m a 400m), obstaculos (1500m a 3000m), marcha atletica (2000m a 35000m), revezamentos (4x75m a 4x400m misto), saltos (distancia, altura, triplo, vara), arremessos e lancamentos (peso, disco, dardo, martelo) e eventos combinados (tetratlo, pentatlo, hexatlo, heptatlo, decatlo). Pesos de implementos variam automaticamente por categoria conforme regras da CBAt."
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
      <p style={s.subtitle}>Tire suas duvidas sobre a plataforma Gerentrack</p>

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
