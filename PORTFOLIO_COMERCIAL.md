# GERENTRACK — Plataforma de Gestao de Competicoes de Atletismo

## Portifolio Comercial e Proposta de Servicos

---

## 1. VISAO GERAL

O GERENTRACK e uma plataforma completa para gestao de competicoes de atletismo, desenvolvida para atender federacoes, confederacoes, clubes e organizadores de eventos esportivos em todo o territorio nacional.

A plataforma opera 100% na nuvem, com funcionamento offline (PWA), cobrindo todo o ciclo de vida de uma competicao: desde o cadastro e configuracao do evento ate a publicacao de resultados, gestao de recordes e ranking estadual/nacional.

**Endereco:** gerentrack.com.br

---

## 2. MODULOS E FUNCIONALIDADES

### 2.1 GESTAO DE COMPETICOES

| Funcionalidade | Descricao |
|---|---|
| Criacao de eventos | Cadastro completo com nome, data(s), local, cidade, UF e informacoes gerais |
| Competicoes multi-etapa | Suporte a eventos com varias etapas (circuitos, campeonatos em fases) |
| Regulamento em PDF | Upload, visualizacao embutida e download do regulamento da competicao |
| Status da competicao | Ciclo de vida: criada → em andamento → finalizada, com bloqueio de edicao |
| Programa horario | Criacao e impressao do programa de provas com horarios, categorias e fases |
| Divisao de sessoes | Programa com sessoes manha/tarde, intervalo configuravel |
| Inscricoes automaticas | Abertura e encerramento automatico por data/hora programada |
| Finalizacao com bloqueio | Ao finalizar, todos os dados sao bloqueados (inscricoes, resultados, sumulas) |

### 2.2 PROVAS SUPORTADAS (80+ modalidades)

**Corridas Rasas**
60m, 75m, 100m, 150m, 200m, 250m, 300m, 400m, 800m, 1000m, 1500m, 2000m, 3000m, 5000m, 10000m

**Corridas com Barreiras**
60m, 80m, 100m, 110m, 300m, 400m Barreiras (alturas variaveis por categoria)

**Corridas com Obstaculos**
1500m, 2000m, 3000m Obstaculos

**Marcha Atletica**
2000m, 5000m, 10000m, 20000m, 35000m Marcha + Revezamento Misto de Marcha

**Revezamentos**
4x75m, 5x60m, 4x100m, 4x400m, 4x400m Misto

**Saltos**
Distancia, Altura, Triplo, Vara

**Arremesso e Lancamentos**
Peso, Disco, Dardo, Martelo (pesos variaveis por categoria conforme regras da CBAt)

**Eventos Combinados**
Tetratlo, Pentatlo, Hexatlo, Heptatlo, Decatlo (geracao automatica das provas componentes)

### 2.3 CATEGORIAS

| Categoria | Faixa Etaria |
|---|---|
| Sub-14 | 11 a 13 anos |
| Sub-16 | 14 a 15 anos |
| Sub-18 | 16 a 17 anos |
| Sub-20 | 18 a 19 anos |
| Sub-23 | 20 a 22 anos |
| Adulto | 23+ anos |

Suporte a provas mistas (masculino + feminino) e flexibilidade de categoria (Sub-16+ competindo em categorias superiores, quando habilitado).

### 2.4 INSCRICOES

| Funcionalidade | Descricao |
|---|---|
| Inscricao individual | Atleta se inscreve em uma ou mais provas, com validacao automatica de categoria |
| Inscricao por revezamento | Composicao de equipe de revezamento com selecao de atletas por perna |
| Validacao Norma 12 CBAt | Controle automatico do limite de provas para Sub-14 (max. 2 individuais de grupos distintos) |
| Limite por categoria | Configuracao de maximo de provas por atleta por categoria |
| Gestao de inscricoes | Edicao, cancelamento e importacao em massa via Excel |
| Tabela de precos | Precificacao por categoria, individual vs. equipe, com calculo automatico |

### 2.5 SERIACAO (Distribuicao em Series)

Distribuicao automatica de atletas em series conforme as regras tecnicas RT 20.3 a 20.8 da World Athletics:

- **Corridas em reta (60m-110m):** raias 3,4,5,6 para melhores; 2,7 intermediarios; 1,8 piores
- **200m:** raias 5,6,7 para melhores; 3,4,8 intermediarios; 1,2 piores
- **400m, 800m, Revezamentos:** raias 4,5,6,7 para melhores; 3,8 intermediarios; 1,2 piores
- **Provas >800m (largada em grupo):** sorteio livre
- **Distribuicao serpentina:** equilibrio automatico entre series (ex: 13 atletas → 7+6)

### 2.6 DIGITACAO DE RESULTADOS

| Funcionalidade | Descricao |
|---|---|
| Entrada por tempo | Formatacao automatica (mm:ss.cc) |
| Entrada por distancia | Metros com casas decimais |
| Entrada por pontos | Para eventos combinados |
| Vento | Registro de velocidade do vento por prova |
| Multiplas tentativas | Suporte a t1-t6 para provas de campo |
| Fases | Eliminatoria → Semifinal → Final |
| Status especiais | DNS, DNF, DQ, NM, NH com regras de participacao |
| Leitor QR | Identificacao de atleta via camera do celular |
| Integracao FinishLynx | Importacao de resultados via arquivo .lif |

### 2.7 CAMARA DE CHAMADA (Roll Call)

| Funcionalidade | Descricao |
|---|---|
| Confirmacao de presenca | Botoes independentes: Confirmado / DNS |
| QR Code na secretaria | Scanner confirma atleta na prova selecionada |
| Badges nas sumulas | Indicacao visual "Conf." / "DNS" nas sumulas e tela de digitacao |
| Funcionamento offline | Dados armazenados localmente e sincronizados quando online |

### 2.8 SISTEMA DE MEDALHAS

| Funcionalidade | Descricao |
|---|---|
| 3 modos configuraveis | Classificacao + participacao / Apenas participacao / Apenas classificacao |
| Entrega individual | Controle de entrega por atleta, por prova, com registro de quem entregou |
| Revezamento expandido | 1 resultado da equipe gera N medalhas individuais |
| Scanner QR | Escaneia atleta, mostra cards por prova com "Entregar" / "Entregar todas" |
| Bloqueios automaticos | DNS total bloqueia medalha; DQ/NM/DNF conta como participacao |

### 2.9 RECORDES

| Funcionalidade | Descricao |
|---|---|
| Deteccao automatica | Comparacao em tempo real com recordes cadastrados |
| Escopos | Estadual, Nacional, Mundial, Especiais (campeonato, local) |
| Validacao de vento | Marcas com vento >2.0 m/s nao sao elegives para recorde |
| Homologacao | Recordes detectados geram solicitacao para aprovacao do admin |
| Gestao completa | Cadastro, edicao, importacao/exportacao via Excel |
| Pagina publica | Consulta de recordes sem necessidade de login |

### 2.10 RANKING

| Funcionalidade | Descricao |
|---|---|
| Extracao automatica | Resultados da fase final geram entradas de ranking automaticamente |
| Filtro por CBAt | Apenas atletas com numero de federacao entram no ranking |
| Filtros | Por categoria, prova, sexo, periodo |
| Importacao em massa | Upload de planilhas Excel com dados de ranking |
| Aprovacao de entradas | Fluxo de aprovacao/rejeicao pelo administrador |
| Pagina publica | Consulta de ranking sem necessidade de login |
| Exportacao | Download em Excel |

### 2.11 PONTUACAO DE EQUIPES

| Funcionalidade | Descricao |
|---|---|
| Tabela configuravel | Pontos por posicao para provas individuais e revezamentos |
| Limite por equipe | Maximo de atletas pontuadores por prova |
| Classificacao geral | Agregacao automatica de pontos por equipe |
| Bonus por recorde | Pontuacao extra para equipes que quebram recordes |

### 2.12 EVENTOS COMBINADOS

| Funcionalidade | Descricao |
|---|---|
| Geracao automatica | Inscricao no combinado gera inscricoes em todas as provas componentes |
| Tabela de pontos WA | Calculo via tabelas oficiais da World Athletics |
| Validacao de vento | Avalicao por prova componente |
| Totalizacao | Soma de pontos com ranking final |

### 2.13 IMPRESSAO E EXPORTACAO

| Funcionalidade | Descricao |
|---|---|
| Sumulas | Impressao individual por prova/categoria/sexo com logos personalizados |
| Programa horario | Impressao formatada com divisao manha/tarde |
| Resultados em Excel | Exportacao completa com formatacao |
| FinishLynx (.evt) | Exportacao para importacao no sistema FinishLynx |
| FinishLynx (.lif) | Importacao de resultados do sistema FinishLynx |
| Relatorios de auditoria | Exportacao do historico de acoes |

### 2.14 QR CODE

| Funcionalidade | Descricao |
|---|---|
| QR publico | URL dos resultados da competicao (unico para todos) |
| QR secretaria | Dados individuais do atleta para uso offline na secretaria |
| Nivel de correcao H | 30% de resistencia a danos (ideal para numeracao de peito) |
| Exportacao XLSX | Planilha com QR codes embutidos como imagem |
| Scanner via camera | Leitura em tempo real com feedback sonoro |

### 2.15 BRANDING PERSONALIZADO

| Funcionalidade | Descricao |
|---|---|
| 4 logos por evento | Competicao, cabecalho esquerdo, cabecalho direito, rodape |
| Compressao automatica | Redimensionamento para max 800px, formato WebP |
| Recorte de imagem | Ferramenta integrada de crop com proporcao configuravel |
| Remocao de fundo | IA para remocao de fundo de logos (processamento local) |
| Aplicacao em impressos | Todos os logos aparecem em sumulas, programa horario e relatorios |

### 2.16 PERFIS E PAINEIS

| Perfil | Funcionalidades do Painel |
|---|---|
| **Administrador** | Gestao completa do sistema, usuarios, equipes, atletas, auditoria |
| **Organizador** | Criar e gerir competicoes, inscricoes, resultados, sumulas |
| **Funcionario** | Digitacao de resultados, secretaria, camera de chamada |
| **Equipe** | Gestao de elenco, inscricao de atletas, visualizacao de resultados |
| **Treinador** | Gestao de atletas vinculados, acompanhamento de desempenho |
| **Atleta** | Inscricao em provas, visualizacao de resultados, solicitacao de vinculo |

### 2.17 PWA E FUNCIONAMENTO OFFLINE

| Funcionalidade | Descricao |
|---|---|
| Instalacao como app | Prompt nativo de instalacao em Android, iOS e desktop |
| Funcionamento offline | Todas as funcoes criticas operam sem internet |
| Sincronizacao automatica | Dados pendentes sao enviados ao retornar online |
| Cache inteligente | Dados de eventos, atletas, inscricoes e resultados armazenados localmente |
| Preparacao offline | Tela dedicada para verificar e preparar dados antes de ir a campo |

### 2.18 PAGINAS PUBLICAS (sem login)

| Pagina | Descricao |
|---|---|
| Resultados da competicao | Acesso via URL limpa: gerentrack.com.br/competicao/{slug}/resultados |
| Regulamento | Viewer PDF embutido: gerentrack.com.br/competicao/{slug}/regulamento |
| Recordes | Consulta publica de recordes com filtros |
| Ranking | Consulta publica de ranking com filtros |
| Cadastro de equipe | Formulario publico de cadastro |
| Cadastro de atleta | Formulario publico de cadastro |
| Cadastro de organizador | Formulario publico de cadastro |

### 2.19 SEGURANCA E CONFORMIDADE

| Item | Descricao |
|---|---|
| Firebase Authentication | Autenticacao segura com email/senha, criptografia de credenciais |
| Sanitizacao XSS | Toda entrada de usuario passa por DOMPurify antes de renderizar |
| LGPD (Art. 8, 18) | Consentimento, portabilidade de dados, revogacao e exclusao |
| Trilha de auditoria | Registro completo de todas as acoes com usuario, data/hora e modulo |
| Limite de historico | Cap de 500 registros com rotacao automatica |
| HTTPS | Comunicacao criptografada em todas as conexoes |

---

## 3. PLANOS E PRECIFICACAO

### 3.1 LICENCA DE USO DA PLATAFORMA

| Plano | Valor Mensal | Inclui |
|---|---|---|
| **Essencial** | R$ 490/mes | Ate 1 competicao por mes, 2 usuarios organizadores, suporte por email |
| **Profissional** | R$ 890/mes | Ate 3 competicoes por mes, 5 usuarios organizadores, suporte prioritario |
| **Federacao** | R$ 1.390/mes | Competicoes ilimitadas, usuarios ilimitados, suporte dedicado, SLA 99,5% |

*Valores com desconto de 15% para contratacao anual.*

### 3.2 TAXA POR INSCRICAO

Cobrada por atleta inscrito em cada competicao:

| Faixa de Inscritos | Valor por Inscricao |
|---|---|
| Ate 200 inscritos | R$ 2,50 / inscricao |
| De 201 a 500 inscritos | R$ 2,00 / inscricao |
| De 501 a 1.000 inscritos | R$ 1,50 / inscricao |
| Acima de 1.000 inscritos | R$ 1,00 / inscricao |

*Inscricao = 1 atleta cadastrado em 1 competicao (independente do numero de provas).*

### 3.3 SERVICOS ADICIONAIS

| Servico | Valor | Descricao |
|---|---|---|
| **Implantacao e onboarding** | R$ 2.500 (unico) | Configuracao inicial, importacao de dados, treinamento remoto (4h) |
| **Treinamento presencial** | R$ 3.500/dia + deslocamento | Capacitacao in loco para equipe de secretaria e organizacao |
| **Suporte a competicao (remoto)** | R$ 800/dia | Acompanhamento em tempo real durante o evento via chamada |
| **Suporte a competicao (presencial)** | R$ 1.500/dia + deslocamento | Tecnico presente no local do evento |
| **Manutencao de resultados** | R$ 15/prova | Digitacao e conferencia de resultados pela equipe GERENTRACK |
| **Importacao de historico** | R$ 1.200 (unico) | Importacao de recordes, rankings e dados historicos de planilhas |
| **Gestao de ranking anual** | R$ 350/mes | Manutencao e atualizacao continua do ranking estadual/nacional |
| **Gestao de recordes** | R$ 250/mes | Homologacao, atualizacao e publicacao de recordes |
| **Personalizacao de marca** | R$ 800 (unico) | Configuracao de logos, cores e identidade visual da federacao |
| **Integracao FinishLynx** | Incluso | Importacao e exportacao de dados para sistema de cronometragem |
| **Relatorio pos-competicao** | R$ 500/evento | Relatorio completo com estatisticas, medalhas e pontuacao |
| **Backup e recuperacao** | Incluso | Backup automatico na nuvem com recuperacao sob demanda |

---

## 4. SIMULACAO DE CENARIOS

### Cenario 1 — Federacao Estadual (porte medio)

**Perfil:** 12 competicoes/ano, media de 350 inscritos por evento

| Item | Calculo | Valor Anual |
|---|---|---|
| Licenca Profissional (anual com desconto) | R$ 890 x 12 x 0,85 | R$ 9.078 |
| Taxa de inscricao (350 x 12 x R$2,00) | 4.200 inscricoes | R$ 8.400 |
| Implantacao e onboarding | Unico | R$ 2.500 |
| Gestao de ranking anual | R$ 350 x 12 | R$ 4.200 |
| Gestao de recordes | R$ 250 x 12 | R$ 3.000 |
| **Total 1o ano** | | **R$ 27.178** |
| **Total anos seguintes** | (sem implantacao) | **R$ 24.678/ano** |
| **Custo medio por competicao** | | **~R$ 2.057** |

### Cenario 2 — Federacao de Grande Porte

**Perfil:** 25 competicoes/ano, media de 600 inscritos por evento

| Item | Calculo | Valor Anual |
|---|---|---|
| Licenca Federacao (anual com desconto) | R$ 1.390 x 12 x 0,85 | R$ 14.178 |
| Taxa de inscricao (600 x 25 x R$1,50) | 15.000 inscricoes | R$ 22.500 |
| Implantacao e onboarding | Unico | R$ 2.500 |
| Gestao de ranking anual | R$ 350 x 12 | R$ 4.200 |
| Gestao de recordes | R$ 250 x 12 | R$ 3.000 |
| Suporte remoto (10 eventos) | R$ 800 x 10 | R$ 8.000 |
| **Total 1o ano** | | **R$ 54.378** |
| **Total anos seguintes** | (sem implantacao) | **R$ 51.878/ano** |
| **Custo medio por competicao** | | **~R$ 2.075** |

### Cenario 3 — Clube ou Organizador Independente

**Perfil:** 4 competicoes/ano, media de 150 inscritos por evento

| Item | Calculo | Valor Anual |
|---|---|---|
| Licenca Essencial (anual com desconto) | R$ 490 x 12 x 0,85 | R$ 4.998 |
| Taxa de inscricao (150 x 4 x R$2,50) | 600 inscricoes | R$ 1.500 |
| Implantacao e onboarding | Unico | R$ 2.500 |
| **Total 1o ano** | | **R$ 8.998** |
| **Total anos seguintes** | (sem implantacao) | **R$ 6.498/ano** |
| **Custo medio por competicao** | | **~R$ 1.625** |

---

## 5. DIFERENCIAIS COMPETITIVOS

### 5.1 Tecnologia

- **PWA com funcionamento offline** — opera em locais sem internet (pistas, estadios rurais)
- **Sincronizacao automatica** — dados salvos localmente e enviados a nuvem quando conectar
- **Zero instalacao** — acesso via navegador, instalavel como app nativo
- **Multi-dispositivo** — funciona em celular, tablet e computador
- **Atualizacoes continuas** — novas funcionalidades entregues sem custo adicional

### 5.2 Atletismo

- **Seriacao automatica RT 20.3-20.8** — distribuicao em series conforme regras oficiais da World Athletics
- **Norma 12 CBAt** — controle automatico de limites de provas para Sub-14
- **80+ modalidades** — cobertura completa de provas de pista, campo, combinadas e marcha
- **Eventos combinados** — geracao automatica de provas componentes com pontuacao WA
- **Integracao FinishLynx** — importacao e exportacao de dados para cronometragem eletronica

### 5.3 Gestao

- **Recordes com deteccao automatica** — identificacao em tempo real durante a competicao
- **Ranking continuo** — extracao automatica pos-competicao com gestao centralizada
- **Pontuacao de equipes** — classificacao geral com tabela configuravel
- **Trilha de auditoria** — rastreabilidade completa de todas as acoes no sistema
- **LGPD** — conformidade com a Lei Geral de Protecao de Dados

### 5.4 Experiencia

- **URLs limpas e compartilhaveis** — gerentrack.com.br/competicao/nome-do-evento/resultados
- **Paginas publicas** — resultados, ranking e recordes acessiveis sem login
- **QR Code integrado** — identificacao de atletas, entrega de medalhas e link de resultados
- **Branding personalizado** — logos e identidade visual da federacao em todos os impressos
- **Remocao de fundo por IA** — ferramenta integrada para tratamento de logos

---

## 6. REQUISITOS TECNICOS

| Item | Especificacao |
|---|---|
| Navegadores suportados | Chrome, Firefox, Safari, Edge (versoes atuais) |
| Dispositivos | Celular, tablet, computador (responsivo) |
| Conexao minima | 3G (funciona offline apos carregamento inicial) |
| Infraestrutura | Nuvem (Firebase + Vercel) — sem servidor proprio |
| Disponibilidade | 99,5% SLA (plano Federacao) |
| Backup | Automatico, diario, com retencao de 30 dias |
| Seguranca | HTTPS, Firebase Auth, sanitizacao XSS, auditoria |

---

## 7. FLUXO DE CONTRATACAO

1. **Demonstracao** — Apresentacao online da plataforma (30-60 min, sem custo)
2. **Proposta** — Envio de proposta personalizada conforme o perfil da federacao
3. **Contrato** — Assinatura do contrato de licenca (mensal ou anual)
4. **Implantacao** — Configuracao, importacao de dados e treinamento (5-10 dias uteis)
5. **Operacao** — Uso contínuo com suporte conforme o plano contratado

---

## 8. CONTATO

**GERENTRACK — Plataforma de Competicoes de Atletismo**

- Site: gerentrack.com.br
- E-mail: contato@gerentrack.com.br

---

*Documento gerado em marco de 2026. Valores sujeitos a reajuste anual conforme IGPM.*
