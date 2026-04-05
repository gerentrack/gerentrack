import React from "react";
import { useTema } from "../../shared/TemaContext";
import { useStylesResponsivos } from "../../hooks/useStylesResponsivos";
import { useApp } from "../../contexts/AppContext";

function getStyles(t) {
  return {
    page: { maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" },
    title: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 800, color: t.textPrimary, marginBottom: 4, letterSpacing: 1, textAlign: "center" },
    subtitle: { fontSize: 13, color: t.textDimmed, marginBottom: 32, textAlign: "center" },
    info: { background: t.bgCardAlt, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: "20px 24px", marginBottom: 24, textAlign: "center", fontSize: 14, color: t.textSecondary, lineHeight: 1.7 },
    h2: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: t.accent, marginTop: 28, marginBottom: 12, letterSpacing: 0.5, borderBottom: `1px solid ${t.border}`, paddingBottom: 6 },
    h3: { fontSize: 15, fontWeight: 700, color: t.textPrimary, marginTop: 18, marginBottom: 8 },
    p: { fontSize: 14, color: t.textSecondary, lineHeight: 1.8, marginBottom: 10 },
    ul: { paddingLeft: 22, marginBottom: 12 },
    li: { fontSize: 14, color: t.textSecondary, marginBottom: 4, lineHeight: 1.7 },
    table: { width: "100%", borderCollapse: "collapse", margin: "12px 0 16px" },
    th: { background: t.bgHeaderSolid, color: t.accent, padding: "8px 14px", textAlign: "left", fontSize: 12, fontWeight: 700 },
    td: { padding: "7px 14px", borderBottom: `1px solid ${t.border}`, fontSize: 13, color: t.textSecondary },
    contato: { background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: "20px 24px", marginTop: 28 },
    btnVoltar: { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 16, padding: 0 },
    strong: { color: t.textPrimary },
    accent: { color: t.accent },
  };
}

function TelaPrivacidade({ embedded } = {}) {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { setTela } = useApp();

  return (
    <div style={embedded ? { padding: 0 } : s.page}>
      {!embedded && <button style={s.btnVoltar} onClick={() => setTela("home")}>← Voltar</button>}
      <h1 style={s.title}>Política de Privacidade</h1>
      <p style={s.subtitle}>GERENTRACK LTDA - CNPJ: 65.454.409/0001-23 — Última atualização: abril de 2026</p>

      <div style={s.info}>
        A <strong style={s.accent}>GERENTRACK LTDA</strong> ("GERENTRACK", "nós") se compromete a proteger a privacidade dos usuários de sua plataforma de gestão de competições de atletismo, acessível em <strong style={s.accent}>gerentrack.com.br</strong>. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei n. 13.709/2018 - LGPD).
      </div>

      <h2 style={s.h2}>1. Definições</h2>
      <ul style={s.ul}>
        <li style={s.li}><strong style={s.strong}>Plataforma:</strong> a aplicação web GERENTRACK, incluindo sua versão PWA (Progressive Web App).</li>
        <li style={s.li}><strong style={s.strong}>Usuário:</strong> qualquer pessoa que acesse ou utilize a plataforma, incluindo organizadores, funcionários, treinadores, atletas e equipes.</li>
        <li style={s.li}><strong style={s.strong}>Dados Pessoais:</strong> informação relacionada a pessoa natural identificada ou identificável.</li>
        <li style={s.li}><strong style={s.strong}>Controlador:</strong> a entidade contratante (federação, confederação, clube ou organizador) que determina as finalidades do tratamento dos dados.</li>
        <li style={s.li}><strong style={s.strong}>Operador:</strong> a GERENTRACK, que realiza o tratamento de dados pessoais em nome do controlador.</li>
        <li style={s.li}><strong style={s.strong}>Titular:</strong> a pessoa natural a quem se referem os dados pessoais.</li>
      </ul>

      <h2 style={s.h2}>2. Dados que Coletamos</h2>
      <h3 style={s.h3}>2.1. Dados de cadastro de usuários</h3>
      <p style={s.p}>Nome completo, e-mail, CPF (quando informado), senha (armazenada com criptografia), tipo de perfil (organizador, funcionário, treinador, equipe, atleta).</p>
      <h3 style={s.h3}>2.2. Dados de atletas</h3>
      <p style={s.p}>Nome, data de nascimento, sexo, número de registro CBAt, UF, clube/equipe, número de peito. No cadastro, o atleta seleciona obrigatoriamente o organizador ao qual deseja se vincular.</p>
      <h3 style={s.h3}>2.3. Dados de competições</h3>
      <p style={s.p}>Inscrições, resultados, tempos, distâncias, classificações, recordes, ranking, medalhas, presença (câmara de chamada).</p>
      <h3 style={s.h3}>2.4. Dados de uso</h3>
      <p style={s.p}>Histórico de ações (trilha de auditoria), com registro de usuário, data/hora, módulo e ação realizada.</p>
      <h3 style={s.h3}>2.5. Dados de branding</h3>
      <p style={s.p}>Logos e imagens enviadas para personalização de competições.</p>
      <h3 style={s.h3}>2.6. Dados que NÃO coletamos</h3>
      <p style={s.p}>Não coletamos dados financeiros (cartão de crédito, conta bancária). Não coletamos dados de localização. Não utilizamos cookies de rastreamento de terceiros.</p>

      <h2 style={s.h2}>3. Finalidades do Tratamento</h2>
      <p style={s.p}>Os dados pessoais são tratados exclusivamente para:</p>
      <ol style={s.ul}>
        <li style={s.li}>Viabilizar o funcionamento da plataforma de gestão de competições de atletismo;</li>
        <li style={s.li}>Gerenciar inscrições, resultados, seriação, classificações, recordes e ranking;</li>
        <li style={s.li}>Permitir a identificação de atletas via QR Code na secretaria e câmara de chamada;</li>
        <li style={s.li}>Gerar súmulas, relatórios, exportações e impressos com dados da competição;</li>
        <li style={s.li}>Publicar resultados, ranking e recordes em páginas públicas (sem dados sensíveis);</li>
        <li style={s.li}>Manter trilha de auditoria para rastreabilidade e segurança;</li>
        <li style={s.li}>Fornecer suporte técnico ao usuário.</li>
      </ol>

      <h2 style={s.h2}>4. Base Legal para o Tratamento</h2>
      <p style={s.p}>O tratamento de dados pessoais é realizado com base nas seguintes hipóteses legais da LGPD (art. 7):</p>
      <ul style={s.ul}>
        <li style={s.li}><strong style={s.strong}>Execução de contrato (art. 7, V):</strong> tratamento necessário para a prestação do serviço contratado;</li>
        <li style={s.li}><strong style={s.strong}>Consentimento (art. 7, I):</strong> quando aplicável, para finalidades específicas comunicadas ao titular;</li>
        <li style={s.li}><strong style={s.strong}>Interesse legítimo (art. 7, IX):</strong> para segurança da plataforma e prevenção a fraudes.</li>
      </ul>

      <h2 style={s.h2}>5. Compartilhamento de Dados</h2>
      <p style={s.p}><strong style={s.strong}>5.1.</strong> Os dados pessoais NÃO são vendidos, alugados ou compartilhados com terceiros para fins comerciais ou de marketing.</p>
      <p style={s.p}><strong style={s.strong}>5.2.</strong> Os dados podem ser compartilhados nas seguintes hipóteses:</p>
      <ol style={s.ul}>
        <li style={s.li}>Com a entidade contratante (controlador), que tem acesso aos dados de seus atletas, equipes e competições;</li>
        <li style={s.li}>Com provedores de infraestrutura em nuvem, estritamente para hospedagem e operação da plataforma;</li>
        <li style={s.li}>Por determinação legal ou ordem judicial.</li>
      </ol>
      <p style={s.p}><strong style={s.strong}>5.3.</strong> Páginas públicas (resultados, ranking, recordes) exibem apenas dados esportivos (nome, clube, marca, categoria). Dados sensíveis (data de nascimento completa, CPF, e-mail) não são exibidos publicamente.</p>

      <h2 style={s.h2}>6. Armazenamento e Segurança</h2>
      <p style={s.p}><strong style={s.strong}>6.1.</strong> Os dados são armazenados em infraestrutura de nuvem com as seguintes certificações:</p>
      <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${t.border}`, marginBottom: 16 }}>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Certificação</th><th style={s.th}>Descrição</th></tr></thead>
          <tbody>
            <tr><td style={s.td}>ISO 27001</td><td style={s.td}>Gestão de segurança da informação</td></tr>
            <tr><td style={s.td}>ISO 27017</td><td style={s.td}>Segurança em serviços de cloud computing</td></tr>
            <tr><td style={s.td}>ISO 27018</td><td style={s.td}>Proteção de dados pessoais em cloud</td></tr>
            <tr><td style={s.td}>SOC 1 / SOC 2 / SOC 3</td><td style={s.td}>Controles de segurança auditados por terceiro independente</td></tr>
          </tbody>
        </table>
      </div>
      <p style={s.p}><strong style={s.strong}>6.2.</strong> Medidas técnicas implementadas:</p>
      <ul style={s.ul}>
        <li style={s.li}>Autenticação segura com senhas criptografadas;</li>
        <li style={s.li}>Comunicação exclusivamente via HTTPS/TLS (criptografia em trânsito);</li>
        <li style={s.li}>Sanitização de todas as entradas de usuário contra XSS (DOMPurify);</li>
        <li style={s.li}>Trilha de auditoria com registro de todas as ações (limite de 500 registros com rotação);</li>
        <li style={s.li}>Backup automático com retenção de 30 dias;</li>
        <li style={s.li}>Isolamento de dados por organização (cada contratante acessa apenas seus dados);</li>
        <li style={s.li}>Sem armazenamento de senhas em texto puro;</li>
        <li style={s.li}>Formatação automática de dados cadastrais (capitalização de nomes, cidades e entidades) para padronização e qualidade dos dados.</li>
      </ul>

      <h2 style={s.h2}>7. Retenção de Dados</h2>
      <p style={s.p}><strong style={s.strong}>7.1.</strong> Os dados pessoais são mantidos enquanto durar a relação contratual com a entidade contratante.</p>
      <p style={s.p}><strong style={s.strong}>7.2.</strong> Notificações lidas expiram após 48 horas. Notificações não lidas expiram após 7 dias.</p>
      <p style={s.p}><strong style={s.strong}>7.3.</strong> Ao término do contrato, o contratante terá 7 (sete) dias com acesso integral para exportação dos dados em formato CSV. Após esse prazo, os dados ficarão retidos por mais 23 (vinte e três) dias (totalizando 30 dias), podendo ser recuperados mediante taxa. Decorridos 30 (trinta) dias, os dados serão permanentemente eliminados, salvo obrigação legal de conservação.</p>

      <h2 style={s.h2}>8. Direitos do Titular (Art. 18 da LGPD)</h2>
      <p style={s.p}>O titular dos dados pessoais tem direito a:</p>
      <ol style={s.ul}>
        <li style={s.li}>Confirmação da existência de tratamento;</li>
        <li style={s.li}>Acesso aos seus dados pessoais;</li>
        <li style={s.li}>Correção de dados incompletos, inexatos ou desatualizados;</li>
        <li style={s.li}>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
        <li style={s.li}>Portabilidade dos dados a outro fornecedor de serviço;</li>
        <li style={s.li}>Eliminação dos dados tratados com consentimento;</li>
        <li style={s.li}>Informação sobre com quem os dados foram compartilhados;</li>
        <li style={s.li}>Revogação do consentimento, quando aplicável.</li>
      </ol>
      <p style={s.p}><strong style={s.strong}>8.1.</strong> As solicitações devem ser encaminhadas à entidade contratante (controlador) ou diretamente à GERENTRACK pelo e-mail <strong style={s.accent}>atendimento@gerentrack.com.br</strong>. O prazo de resposta é de até 15 (quinze) dias úteis.</p>

      <h2 style={s.h2}>9. Transferência Internacional</h2>
      <p style={s.p}>Os dados são armazenados em servidores de provedores de nuvem com certificações internacionais de segurança, podendo estar localizados fora do Brasil. Os provedores utilizados atendem aos requisitos de transferência internacional da LGPD, incluindo cláusulas contratuais padrão e certificações internacionais de proteção de dados.</p>

      <h2 style={s.h2}>10. Alterações nesta Política</h2>
      <p style={s.p}>Esta Política de Privacidade poderá ser atualizada periodicamente. Alterações significativas serão comunicadas aos usuários contratantes. A versão mais recente estará sempre disponível na plataforma.</p>

      <h2 style={s.h2}>11. Encarregado pelo Tratamento de Dados Pessoais (DPO)</h2>
      <p style={s.p}>Nos termos do Art. 41 da LGPD, a GERENTRACK indica como encarregado pelo tratamento de dados pessoais:</p>
      <div style={{ ...s.contato, marginTop: 12 }}>
        <p style={s.p}><strong style={s.accent}>Pedro Henrique Oliveira Campos</strong></p>
        <p style={s.p}>E-mail: <strong style={s.accent}>dpo@gerentrack.com.br</strong></p>
        <p style={s.p}>O encarregado é responsável por aceitar reclamações e comunicações dos titulares, prestar esclarecimentos, receber comunicações da Autoridade Nacional de Proteção de Dados (ANPD) e orientar a equipe sobre as práticas de proteção de dados pessoais.</p>
      </div>

      <div style={s.contato}>
        <h2 style={{ ...s.h2, marginTop: 0 }}>12. Contato</h2>
        <p style={s.p}><strong style={s.accent}>GERENTRACK LTDA</strong></p>
        <p style={s.p}>E-mail geral: <strong style={s.accent}>atendimento@gerentrack.com.br</strong></p>
        <p style={s.p}>E-mail do encarregado (DPO): <strong style={s.accent}>dpo@gerentrack.com.br</strong></p>
        <p style={s.p}>Site: <strong style={s.accent}>gerentrack.com.br</strong></p>
        <p style={s.p}>CNPJ: 65.454.409/0001-23</p>
      </div>
    </div>
  );
}

export default TelaPrivacidade;
