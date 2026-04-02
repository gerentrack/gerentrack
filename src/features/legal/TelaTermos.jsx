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
    p: { fontSize: 14, color: t.textSecondary, lineHeight: 1.8, marginBottom: 10 },
    ol: { paddingLeft: 22, marginBottom: 12 },
    li: { fontSize: 14, color: t.textSecondary, marginBottom: 4, lineHeight: 1.7 },
    contato: { background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: "20px 24px", marginTop: 28 },
    btnVoltar: { background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 16, padding: 0 },
    strong: { color: t.textPrimary },
    accent: { color: t.accent },
  };
}

function TelaTermos() {
  const t = useTema();
  const s = useStylesResponsivos(getStyles(t));
  const { setTela } = useApp();

  return (
    <div style={s.page}>
      <button style={s.btnVoltar} onClick={() => setTela("home")}>← Voltar</button>
      <h1 style={s.title}>Termos de Uso</h1>
      <p style={s.subtitle}>GERENTRACK LTDA - CNPJ: 65.454.409/0001-23 — Última atualização: abril de 2026</p>

      <div style={s.info}>
        Estes Termos de Uso regulam a utilização da plataforma <strong style={s.accent}>GERENTRACK</strong>, acessível em <strong style={s.accent}>gerentrack.com.br</strong>, desenvolvida e mantida pela GERENTRACK LTDA. Ao acessar ou utilizar a plataforma, o usuário concorda integralmente com estes termos.
      </div>

      <h2 style={s.h2}>1. Da Plataforma</h2>
      <p style={s.p}><strong style={s.strong}>1.1.</strong> O GERENTRACK é uma plataforma de gestão de competições de atletismo que opera como Software as a Service (SaaS), acessível via navegador web e instalável como aplicativo (PWA).</p>
      <p style={s.p}><strong style={s.strong}>1.2.</strong> A plataforma é destinada a federações, confederações, clubes, organizadores de eventos esportivos, treinadores, atletas e equipes de atletismo.</p>
      <p style={s.p}><strong style={s.strong}>1.3.</strong> O acesso a funcionalidades completas requer contrato de licença de uso vigente entre a entidade contratante e a GERENTRACK LTDA.</p>

      <h2 style={s.h2}>2. Do Cadastro e Acesso</h2>
      <p style={s.p}><strong style={s.strong}>2.1.</strong> O acesso à plataforma requer cadastro com e-mail e senha. A autenticação é gerenciada pelo Firebase Authentication (Google).</p>
      <p style={s.p}><strong style={s.strong}>2.2.</strong> O usuário é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas com sua conta.</p>
      <p style={s.p}><strong style={s.strong}>2.3.</strong> O usuário deve notificar imediatamente a GERENTRACK sobre qualquer uso não autorizado de sua conta.</p>
      <p style={s.p}><strong style={s.strong}>2.4.</strong> Perfis de acesso (organizador, funcionário, treinador, equipe, atleta) possuem permissões distintas, definidas pela entidade contratante.</p>

      <h2 style={s.h2}>3. Do Uso Permitido</h2>
      <p style={s.p}>O usuário compromete-se a utilizar a plataforma exclusivamente para:</p>
      <ol style={s.ol}>
        <li style={s.li}>Gestão de competições de atletismo e atividades esportivas correlatas;</li>
        <li style={s.li}>Cadastro e gerenciamento de atletas, equipes, inscrições e resultados;</li>
        <li style={s.li}>Consulta e publicação de resultados, ranking e recordes;</li>
        <li style={s.li}>Demais funcionalidades previstas nos módulos da plataforma.</li>
      </ol>

      <h2 style={s.h2}>4. Das Restrições de Uso</h2>
      <p style={s.p}>É expressamente vedado ao usuário:</p>
      <ol style={s.ol}>
        <li style={s.li}>Reproduzir, copiar, modificar, descompilar ou realizar engenharia reversa do software;</li>
        <li style={s.li}>Utilizar a plataforma para finalidades diversas das previstas, incluindo atividades ilegais;</li>
        <li style={s.li}>Tentar acessar dados de outras organizações ou usuários sem autorização;</li>
        <li style={s.li}>Compartilhar credenciais de acesso com terceiros não autorizados;</li>
        <li style={s.li}>Inserir conteúdo ofensivo, difamatório, ilegal ou que viole direitos de terceiros;</li>
        <li style={s.li}>Sobrecarregar intencionalmente a infraestrutura da plataforma;</li>
        <li style={s.li}>Utilizar a marca, logotipo ou nome GERENTRACK sem autorização expressa.</li>
      </ol>

      <h2 style={s.h2}>5. Da Propriedade Intelectual</h2>
      <p style={s.p}><strong style={s.strong}>5.1.</strong> A plataforma GERENTRACK, incluindo seu código-fonte, design, funcionalidades, marca e logotipo, é propriedade exclusiva da GERENTRACK LTDA, protegida pela Lei n. 9.609/98 (Lei do Software) e pela Lei n. 9.279/96 (Lei de Propriedade Industrial). A plataforma possui registro de programa de computador junto ao INPI (Instituto Nacional da Propriedade Industrial).</p>
      <p style={s.p}><strong style={s.strong}>5.2.</strong> O contrato de licença concede ao usuário apenas o direito de uso da plataforma, não implicando transferência de propriedade intelectual.</p>
      <p style={s.p}><strong style={s.strong}>5.3.</strong> Os dados inseridos pelo usuário são de sua propriedade e podem ser exportados conforme previsto no contrato de licença.</p>

      <h2 style={s.h2}>6. Da Disponibilidade</h2>
      <p style={s.p}><strong style={s.strong}>6.1.</strong> A GERENTRACK emprega seus melhores esforços para manter a plataforma disponível 24 horas por dia, 7 dias por semana, conforme os níveis de serviço (SLA) definidos no contrato.</p>
      <p style={s.p}><strong style={s.strong}>6.2.</strong> A plataforma poderá ficar temporariamente indisponível para manutenções programadas, que serão comunicadas com antecedência mínima de 48 horas.</p>
      <p style={s.p}><strong style={s.strong}>6.3.</strong> A GERENTRACK não se responsabiliza por indisponibilidade decorrente de força maior, falhas de provedores de internet do usuário, ou uso inadequado da plataforma.</p>
      <p style={s.p}><strong style={s.strong}>6.4.</strong> A plataforma possui funcionamento offline (PWA), permitindo operação contínua mesmo sem conexão com a internet, com sincronização automática ao retornar online.</p>

      <h2 style={s.h2}>7. Da Privacidade e Proteção de Dados</h2>
      <p style={s.p}><strong style={s.strong}>7.1.</strong> O tratamento de dados pessoais segue as disposições da <button style={{ background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 14, padding: 0, textDecoration: "underline" }} onClick={() => setTela("privacidade")}>Política de Privacidade</button> da GERENTRACK e da Lei n. 13.709/2018 (LGPD).</p>
      <p style={s.p}><strong style={s.strong}>7.2.</strong> A entidade contratante é controladora dos dados pessoais inseridos na plataforma. A GERENTRACK atua como operadora.</p>
      <p style={s.p}><strong style={s.strong}>7.3.</strong> A Política de Privacidade é parte integrante destes Termos de Uso.</p>

      <h2 style={s.h2}>8. Das Limitações de Responsabilidade</h2>
      <p style={s.p}><strong style={s.strong}>8.1.</strong> A GERENTRACK não se responsabiliza por:</p>
      <ol style={s.ol}>
        <li style={s.li}>Danos decorrentes do mau uso da plataforma;</li>
        <li style={s.li}>Conteúdo inserido pelos usuários;</li>
        <li style={s.li}>Decisões tomadas com base nos dados da plataforma;</li>
        <li style={s.li}>Perda de dados causada por ação do usuário.</li>
      </ol>
      <p style={s.p}><strong style={s.strong}>8.2.</strong> Em nenhuma hipótese a GERENTRACK será responsável por lucros cessantes, perdas de receita ou danos indiretos.</p>
      <p style={s.p}><strong style={s.strong}>8.3.</strong> A responsabilidade total da GERENTRACK está limitada ao valor pago pelo usuário nos últimos 12 meses de utilização da plataforma.</p>

      <h2 style={s.h2}>9. Da Suspensão e Cancelamento</h2>
      <p style={s.p}><strong style={s.strong}>9.1.</strong> A GERENTRACK poderá suspender ou cancelar o acesso do usuário em caso de:</p>
      <ol style={s.ol}>
        <li style={s.li}>Violação destes Termos de Uso;</li>
        <li style={s.li}>Inadimplência contratual;</li>
        <li style={s.li}>Uso indevido ou fraudulento da plataforma;</li>
        <li style={s.li}>Determinação judicial.</li>
      </ol>
      <p style={s.p}><strong style={s.strong}>9.2.</strong> Em caso de cancelamento, os dados do usuário serão preservados pelo prazo de 7 dias, durante o qual poderão ser exportados.</p>

      <h2 style={s.h2}>10. Das Alterações</h2>
      <p style={s.p}><strong style={s.strong}>10.1.</strong> A GERENTRACK reserva-se o direito de alterar estes Termos de Uso a qualquer tempo, mediante comunicação prévia aos usuários contratantes.</p>
      <p style={s.p}><strong style={s.strong}>10.2.</strong> O uso continuado da plataforma após a comunicação das alterações implica aceitação dos novos termos.</p>

      <h2 style={s.h2}>11. Do Foro</h2>
      <p style={s.p}>Fica eleito o foro da Comarca de Belo Horizonte/MG para dirimir quaisquer controvérsias oriundas destes Termos de Uso, com renúncia de qualquer outro, por mais privilegiado que seja.</p>

      <div style={s.contato}>
        <h2 style={{ ...s.h2, marginTop: 0 }}>12. Contato</h2>
        <p style={s.p}><strong style={s.accent}>GERENTRACK LTDA</strong></p>
        <p style={s.p}>E-mail: <strong style={s.accent}>atendimento@gerentrack.com.br</strong></p>
        <p style={s.p}>Site: <strong style={s.accent}>gerentrack.com.br</strong></p>
        <p style={s.p}>CNPJ: 65.454.409/0001-23</p>
      </div>
    </div>
  );
}

export default TelaTermos;
