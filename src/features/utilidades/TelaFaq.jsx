import React, { useState, useMemo } from "react";
import { useTema } from "../../shared/TemaContext";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useApp } from "../../contexts/AppContext";

const ITENS_POR_PAGINA = 8;

function getStyles(t) {
  return {
    page: { maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" },
    title: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 800, color: t.textPrimary, marginBottom: 4, letterSpacing: 1, textAlign: "center" },
    subtitle: { fontSize: 14, color: t.textMuted, marginBottom: 24, textAlign: "center" },
    searchWrap: { marginBottom: 24, position: "relative" },
    searchInput: {
      width: "100%", padding: "12px 16px 12px 40px", fontSize: 14, borderRadius: 10,
      border: `1px solid ${t.border}`, background: t.bgCard, color: t.textPrimary,
      outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
    },
    searchIcon: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: t.textMuted, pointerEvents: "none" },
    searchClear: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: 16, padding: "2px 6px" },
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
    paginacao: { display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 24 },
    paginacaoBtn: {
      background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8,
      padding: "6px 14px", fontSize: 13, fontWeight: 600, color: t.textSecondary,
      cursor: "pointer", transition: "all 0.15s",
    },
    paginacaoBtnAtivo: { background: t.accent, color: "#fff", border: `1px solid ${t.accent}` },
    paginacaoBtnDisabled: { opacity: 0.4, cursor: "default" },
    semResultado: { textAlign: "center", color: t.textMuted, fontSize: 14, padding: "32px 0" },
    contagem: { textAlign: "center", fontSize: 12, color: t.textMuted, marginBottom: 16 },
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
  {
    pergunta: "E se eu quiser manter súmulas manuais e a digitação de resultados pela secretaria?",
    resposta: "O Gerentrack é flexível e se adapta ao seu fluxo de trabalho. O próprio sistema gera as súmulas em branco — já formatadas com nome da prova, categoria, séries, raias e lista de atletas — prontas para impressão e preenchimento manual na pista. Depois, basta digitar os resultados pela secretaria na tela Digitar Resultados. É possível indicar se a cronometragem de cada prova (ou de cada série individualmente) foi eletrônica ou manual, e o sistema ajusta automaticamente as tabelas de pontuação de eventos combinados. A súmula em papel serve como documento oficial de pista, enquanto o sistema centraliza a publicação, o ranking e a entrega de medalhas."
  },
  {
    pergunta: "Em quanto tempo após o encerramento das inscrições eu consigo disponibilizar as súmulas para as equipes?",
    resposta: "Em poucos minutos. Assim que as inscrições são encerradas, o sistema já possui todos os dados necessários — atletas, provas, categorias e equipes. Basta gerar a seriação automática (distribuição em séries e raias conforme as regras da World Athletics) e imprimir as súmulas. Todo o processo é feito com poucos cliques, sem necessidade de digitar ou organizar nada manualmente. Em competições com centenas de atletas, o que antes levava horas com planilhas pode ser concluído em minutos."
  },
];

function normalizar(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function TelaFaq() {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { setTela } = useApp();
  const [aberto, setAberto] = useState(null);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    if (!busca.trim()) return FAQ_ITEMS;
    const termo = normalizar(busca.trim());
    return FAQ_ITEMS.filter(item =>
      normalizar(item.pergunta).includes(termo) || normalizar(item.resposta).includes(termo)
    );
  }, [busca]);

  const totalPaginas = Math.ceil(filtrados.length / ITENS_POR_PAGINA);
  const paginaAtual = Math.min(pagina, totalPaginas || 1);
  const itensPagina = filtrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  const handleBusca = (valor) => {
    setBusca(valor);
    setPagina(1);
    setAberto(null);
  };

  return (
    <div style={s.page}>
      <button style={s.btnVoltar} onClick={() => setTela("home")}>← Voltar</button>

      <h1 style={s.title}>Perguntas Frequentes</h1>
      <p style={s.subtitle}>Tire suas dúvidas sobre a plataforma Gerentrack</p>

      <div style={s.searchWrap}>
        <span style={s.searchIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
        <input
          type="text"
          placeholder="Buscar pergunta ou palavra-chave..."
          value={busca}
          onChange={ev => handleBusca(ev.target.value)}
          style={s.searchInput}
        />
        {busca && (
          <button style={s.searchClear} onClick={() => handleBusca("")} title="Limpar busca">✕</button>
        )}
      </div>

      {busca.trim() && (
        <div style={s.contagem}>
          {filtrados.length === 0 ? "Nenhum resultado encontrado" : `${filtrados.length} pergunta${filtrados.length !== 1 ? "s" : ""} encontrada${filtrados.length !== 1 ? "s" : ""}`}
        </div>
      )}

      {itensPagina.length === 0 && (
        <div style={s.semResultado}>Nenhuma pergunta corresponde à sua busca.</div>
      )}

      {itensPagina.map((item, idx) => {
        const idxGlobal = (paginaAtual - 1) * ITENS_POR_PAGINA + idx;
        const isAberto = aberto === idxGlobal;
        return (
          <div key={idxGlobal} style={s.faqItem}>
            <button
              style={{ ...s.question, ...(isAberto ? s.questionOpen : {}) }}
              onClick={() => setAberto(isAberto ? null : idxGlobal)}
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

      {totalPaginas > 1 && (
        <div style={s.paginacao}>
          <button
            style={{ ...s.paginacaoBtn, ...(paginaAtual <= 1 ? s.paginacaoBtnDisabled : {}) }}
            onClick={() => paginaAtual > 1 && setPagina(paginaAtual - 1)}
            disabled={paginaAtual <= 1}
          >← Anterior</button>
          {Array.from({ length: totalPaginas }, (_, idx) => (
            <button
              key={idx + 1}
              style={{ ...s.paginacaoBtn, ...(paginaAtual === idx + 1 ? s.paginacaoBtnAtivo : {}) }}
              onClick={() => { setPagina(idx + 1); setAberto(null); }}
            >{idx + 1}</button>
          ))}
          <button
            style={{ ...s.paginacaoBtn, ...(paginaAtual >= totalPaginas ? s.paginacaoBtnDisabled : {}) }}
            onClick={() => paginaAtual < totalPaginas && setPagina(paginaAtual + 1)}
            disabled={paginaAtual >= totalPaginas}
          >Próxima →</button>
        </div>
      )}
    </div>
  );
}
