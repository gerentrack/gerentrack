# GERENTRACK - Tutorial Completo para Organizadores

## Sumario

1. [Primeiro Acesso e Painel](#1-primeiro-acesso-e-painel)
2. [Cadastrar Funcionarios](#2-cadastrar-funcionarios)
3. [Gerenciar Equipes](#3-gerenciar-equipes)
4. [Cadastrar Atletas](#4-cadastrar-atletas)
5. [Criar Competicao](#5-criar-competicao)
6. [Gerenciar Inscricoes](#6-gerenciar-inscricoes)
7. [Numeracao de Peito](#7-numeracao-de-peito)
8. [Seriacao (Baterias)](#8-seriacao-baterias)
9. [Sumulas](#9-sumulas)
10. [Digitar Resultados](#10-digitar-resultados)
11. [Camera de Chamada](#11-camera-de-chamada)
12. [Medalhas](#12-medalhas)
13. [Recordes](#13-recordes)
14. [Ranking](#14-ranking)
15. [Relatorio de Participacao](#15-relatorio-de-participacao)
16. [Auditoria](#16-auditoria)
17. [Configuracoes da Conta](#17-configuracoes-da-conta)

---

## 1. Primeiro Acesso e Painel

### O que e o Painel do Organizador?
E a tela principal apos o login. Mostra um resumo de tudo: competicoes, inscricoes, equipes pendentes, transferencias de atletas e acoes rapidas.

### O que voce ve no painel:
- **Estatisticas**: total de competicoes, inscricoes abertas, total de inscricoes e funcionarios
- **Notificacoes** (sino): solicitacoes de vinculo, aprovacoes pendentes
- **Botoes de acesso rapido**: Funcionarios, Equipes, Atletas, + Nova Competicao
- **Lista de competicoes**: todas as suas competicoes com status e acoes

### Acoes disponiveis nas competicoes:
- **Editar**: abre o cadastro da competicao para alterar dados
- **Sumulas**: gera as sumulas oficiais
- **Resultados**: abre a tela de digitacao de resultados
- **Encerrar/Reabrir**: muda o status da competicao
- **Liberar/Restringir Sumula**: controla se equipes podem ver sumulas
- **Excluir**: remove a competicao (irreversivel)

### Secoes especiais do painel:
- **Equipes aguardando aprovacao**: quando uma equipe se cadastra no sistema, aparece aqui para voce aprovar ou recusar
- **Vinculos pendentes**: quando uma equipe solicita transferencia de atleta, voce aprova/recusa aqui
- **Solicitacoes de relatorio**: quando atleta ou equipe pede relatorio oficial de participacao

---

## 2. Cadastrar Funcionarios

### O que sao funcionarios?
Sao pessoas da sua equipe de trabalho que precisam acessar o sistema com permissoes limitadas. Exemplo: fiscal de prova, secretario, digitador de resultados.

### Passo a passo:
1. No painel, clique em **Funcionarios**
2. Clique em **+ Novo Funcionario**
3. Preencha:
   - **Nome** (obrigatorio)
   - **Email** (obrigatorio - sera o login)
   - **Cargo** (ex: Fiscal, Secretario, Digitador)
   - **CPF** (opcional)
   - **Telefone** (opcional)
4. Selecione as **permissoes**:
   - **Visualizar competicoes** - pode ver as competicoes
   - **Criar/editar competicoes** - pode criar e modificar competicoes
   - **Gerenciar inscricoes** - pode inscrever/remover atletas
   - **Digitar resultados** - pode entrar com resultados das provas
   - **Gerenciar sumulas** - pode gerar e imprimir sumulas
   - **Camera de chamada/Medalhas** - pode fazer chamada e entregar medalhas
   - **Gerenciar atletas** - pode cadastrar e editar atletas
   - **Visualizar funcionarios** - pode ver a lista de funcionarios
5. Clique em **Salvar**
6. O sistema gera uma **senha automatica** - anote e passe para o funcionario

### Dicas:
- Voce pode **ativar/desativar** um funcionario sem excluir
- Cada funcionario so ve as competicoes que voce **liberar** para ele
- O **historico de acoes** registra tudo que cada funcionario faz

---

## 3. Gerenciar Equipes

### Passo a passo para cadastrar equipe:
1. No painel, clique em **Equipes**
2. Clique em **+ Nova Equipe**
3. Preencha:
   - **Nome da Equipe** (obrigatorio)
   - **Sigla** (obrigatorio - aparece nas sumulas)
   - **Cidade** e **Estado** (obrigatorios)
   - **CNPJ** (obrigatorio)
   - **Email** (obrigatorio - sera o login da equipe)
   - **Telefone** (opcional)
4. Clique em **Salvar**
5. O sistema gera **login e senha** para a equipe acessar

### Importar equipes em lote:
1. Clique em **Importar**
2. Selecione o arquivo Excel (.xlsx)
3. O arquivo deve ter as colunas: Nome, Sigla, Cidade, Estado, CNPJ, Email
4. O sistema valida duplicatas e campos obrigatorios
5. Revise o preview e confirme

### Aprovar equipes que se cadastraram:
Quando uma equipe se cadastra pelo site, aparece no seu painel como "aguardando aprovacao". Voce clica em **Aprovar** ou **Recusar**.

---

## 4. Cadastrar Atletas

### Passo a passo:
1. No painel, clique em **Atletas**
2. Clique em **+ Novo Atleta**
3. Preencha:
   - **Nome Completo** (obrigatorio)
   - **Data de Nascimento** (obrigatorio - calcula a categoria automaticamente)
   - **Sexo** (M ou F)
   - **CPF** (obrigatorio - evita duplicatas)
   - **N CBAt** (opcional - numero da Confederacao)
   - **Telefone** e **Email** (opcionais)
4. Na secao **Vinculacao**:
   - Se voce e equipe: o atleta e vinculado automaticamente
   - Se voce e organizador: o atleta fica avulso ou voce seleciona uma equipe
5. Aceite a **Politica de Privacidade** (LGPD)
6. Se o atleta for **menor de 18 anos**: preencha o nome do responsavel legal e aceite o consentimento parental
7. Clique em **Cadastrar Atleta**

### Deteccao de categoria:
O sistema calcula automaticamente a categoria do atleta pela data de nascimento:
- **Sub-14**: 12-13 anos
- **Sub-16**: 14-15 anos
- **Sub-18**: 16-17 anos
- **Sub-20**: 18-19 anos
- **Sub-23**: 20-22 anos
- **Adulto**: 23+ anos

### Atleta ja cadastrado (vinculacao):
Se o CPF ja existe no sistema, o sistema sugere **vincular** o atleta em vez de criar duplicata. Isso envia uma solicitacao para a equipe atual aprovar a transferencia.

---

## 5. Criar Competicao

### Passo 1 - Informacoes Basicas:
1. No painel, clique em **+ Nova Competicao**
2. Preencha:
   - **Nome do Evento** (obrigatorio)
   - **Data do Evento** (obrigatorio)
   - **Data Final** (opcional - para eventos de multiplos dias)
   - **Abertura das Inscricoes** (data e hora)
   - **Encerramento das Inscricoes** (data e hora)
   - **Descricao** (opcional)
   - **Observacoes** (opcional)
3. Clique em **Proximo**

### Passo 2 - Configuracoes:
- **Modo de Medalhas**:
  - *Classificacao + Participacao*: 1o/2o/3o recebem medalha de classificacao, demais recebem participacao
  - *Apenas Participacao*: todos recebem medalha de participacao
  - *Apenas Classificacao*: so 1o/2o/3o recebem medalha
- **Pontuacao de Equipes**: configure a tabela de pontos (1o lugar = X pontos, 2o = Y, etc.)
- Clique em **Proximo**

### Passo 3 - Logos/Branding:
- **Logo da Competicao**: aparece na pagina publica
- **Logo Cabecalho Esquerdo**: aparece nas sumulas impressas (lado esquerdo)
- **Logo Cabecalho Direito**: aparece nas sumulas impressas (lado direito)
- **Logo Rodape**: aparece no rodape das impressoes
- Para cada logo: clique para fazer upload, recorte a imagem, e salve
- Clique em **Proximo**

### Passo 4 - Selecao de Provas:
1. Use os filtros de **Sexo** e **Categoria** para facilitar
2. Marque as provas desejadas (100m, 200m, salto em distancia, etc.)
3. Voce pode usar **Selecionar Todos** para marcar todas as provas visiveis
4. Provas disponiveis incluem: pista (100m a 10000m), campo (saltos, lancamentos), marcha atletica, revezamentos, provas combinadas
5. Clique em **Proximo**

### Passo 5 - Programa Horario:
- Configure os horarios de cada prova
- Defina intervalos/pausas
- Configure o modo de cronometragem: **Eletronico** ou **Manual**
- Clique em **Salvar Competicao**

---

## 6. Gerenciar Inscricoes

### Inscrever atletas na competicao:
1. Selecione a competicao no painel
2. Acesse **Inscricoes**
3. Clique em **+ Inscrever Atleta**
4. Selecione o atleta (busque por nome)
5. Marque as provas em que ele vai competir
6. Confirme a inscricao

### Inscricao em lote (carrinho):
1. Acesse **Inscricoes** > **Adicionar**
2. Filtre atletas por sexo, categoria, equipe
3. Selecione multiplos atletas
4. Selecione as provas
5. Revise no carrinho
6. Confirme todas de uma vez

### Gerenciar inscricoes existentes:
- **Filtrar** por prova, categoria, sexo, equipe, status de pagamento
- **Editar** provas de um atleta ja inscrito
- **Remover** inscricao
- **Marcar como pago/pendente**

---

## 7. Numeracao de Peito

### Para que serve?
Atribui um numero unico (numero de peito/dorsal) para cada atleta na competicao. Esse numero aparece nas sumulas, resultados e pode ser impresso com QR Code.

### Passo a passo:
1. Selecione a competicao
2. Acesse **Numeracao de Peito**
3. Opcoes:
   - **Manual**: digite o numero para cada atleta
   - **Automatico**: defina o numero inicial e o sistema numera sequencialmente
4. Clique em **Salvar**

### Exportar com QR Code:
1. Apos salvar a numeracao, clique em **Exportar QR**
2. O sistema gera um arquivo Excel com:
   - Nome do atleta
   - Numero de peito
   - QR Code individual (para camera de chamada)
   - QR Code publico (para consulta de resultados)
3. Imprima e recorte os dorsais

---

## 8. Seriacao (Baterias)

### O que e?
Distribui os atletas em baterias/series para provas de pista. Exemplo: se tem 24 atletas nos 100m, o sistema cria 3 series de 8.

### Passo a passo:
1. Acesse **Sumulas**
2. Selecione a prova e categoria
3. Clique em **Gerar Seriacao**
4. Escolha o modo:
   - **Por marca**: distribui baseado nos melhores tempos (mais rapidos juntos na ultima serie)
   - **Aleatorio**: distribui aleatoriamente
   - **Manual**: voce define quem vai em cada serie
5. Selecione a **fase**: Eliminatoria, Semifinal ou Final
6. Revise a distribuicao
7. Confirme

### Para provas de 800m:
Modo especial: pode ser por **raias** (cada atleta em sua raia) ou **grupo** (saida em grupo).

---

## 9. Sumulas

### O que sao?
Sumulas sao os documentos oficiais de cada prova. Listam os atletas inscritos, raias, ordens de chamada e espacos para registrar resultados.

### Gerar sumulas:
1. Acesse **Sumulas**
2. Filtre por prova, categoria, sexo
3. Cada sumula mostra:
   - Nome da prova e categoria
   - Lista de atletas com numero de peito
   - Equipe/clube de cada atleta
   - Raia/ordem (se houver seriacao)
4. Escolha a **orientacao**: retrato ou paisagem
5. Clique em **Imprimir** para gerar o PDF

### Sumula em branco:
Voce pode gerar uma sumula em branco (sem atletas) para preencher manualmente.

### Sumula de Marcha Atletica:
Para provas de marcha, ha uma sumula especial com:
- 8 juizes com nome e registro
- Tabela de advertencias (~) e angulo (<)
- Cartoes vermelhos (DQ)
- PIT Lane, Notificacao DQ
- CHECK PAGE e CHECK TOTAL automaticos
- Botao **Salvar Sumula** para gravar os dados digitais

---

## 10. Digitar Resultados

### Passo a passo:
1. Selecione a competicao
2. Acesse **Resultados**
3. Filtre por prova, categoria, sexo e fase
4. Para cada atleta, digite:
   - **Provas de pista**: tempo (formato MM:SS.cc)
   - **Provas de campo**: distancia/altura em metros
   - **Salto em altura/vara**: tentativas por altura (O = valido, X = falha, - = passou)
5. Status especiais:
   - **DNS**: nao largou
   - **DNF**: nao completou
   - **DQ**: desqualificado
   - **NM**: sem marca
6. Clique em **Salvar**

### Cronometragem ELE/MAN:
Para cada serie, voce pode alternar entre:
- **ELE** (Eletronico): tempo com centesimos
- **MAN** (Manual): tempo com decimos

### Importar resultados FinishLynx:
1. Clique em **Importar .lif**
2. Selecione o arquivo do FinishLynx
3. Revise os resultados no preview
4. Confirme a importacao

### Classificacao automatica:
O sistema calcula automaticamente as posicoes (1o, 2o, 3o...) baseado nos tempos/distancias. Empates sao tratados conforme regras do atletismo.

---

## 11. Camera de Chamada

### O que e?
A camera de chamada (ou roll call) e onde voce confirma a presenca dos atletas antes de cada prova.

### Passo a passo:
1. Selecione a competicao
2. Acesse **Secretaria** > aba **Chamada**
3. Selecione a prova no filtro
4. Para cada atleta:
   - Clique em **Confirmado** se o atleta se apresentou
   - Clique em **DNS** se o atleta nao compareceu
5. Opcao: use o **Scanner QR** para confirmar rapidamente escaneando o dorsal do atleta

### Status:
- **Sem marcacao**: atleta ainda nao foi chamado
- **Confirmado**: atleta presente e pronto
- **DNS**: atleta ausente (Did Not Start)

### Badges nas sumulas:
Apos a chamada, os badges "Conf." e "DNS" aparecem nas sumulas e na tela de resultados.

---

## 12. Medalhas

### Configuracao:
O modo de medalhas e definido no cadastro da competicao (Passo 2). Tres opcoes:
- **Classificacao + Participacao**: 1o/2o/3o + participacao para os demais
- **Apenas Participacao**: todos recebem
- **Apenas Classificacao**: so 1o/2o/3o

### Entregar medalhas:
1. Acesse **Secretaria** > aba **Medalhas**
2. Escaneie o QR Code do atleta ou busque pelo nome
3. O sistema mostra todas as provas do atleta com:
   - Tipo de medalha (Ouro, Prata, Bronze, Participacao)
   - Status de entrega
4. Clique em **Entregar** para cada prova ou **Entregar Todas**

### Regras:
- Atleta com **DNS em todas as provas** nao recebe medalha
- **DQ, NM, DNF** contam como participacao (recebe medalha)
- **Revezamento**: cada atleta da equipe recebe medalha individual

---

## 13. Recordes

### Cadastrar tipo de recorde:
1. Acesse **Recordes**
2. Clique em **+ Novo Tipo de Recorde**
3. Preencha:
   - **Nome** (ex: "Recorde Estadual de Minas Gerais")
   - **Sigla** (ex: "RE-MG")
   - **Escopo**: Pais, Estado ou Municipio
   - Selecione o pais/estado/municipio correspondente
4. Salve

### Cadastrar recorde:
1. Selecione o tipo de recorde
2. Clique em **+ Novo Recorde**
3. Preencha: prova, categoria, sexo, marca, data, atleta, competicao, local
4. Salve

### Deteccao automatica:
Quando voce digita um resultado que supera um recorde existente, o sistema detecta automaticamente e cria uma **pendencia de recorde** para voce homologar.

### Importar recordes:
Voce pode importar recordes de um arquivo Excel com as colunas: Prova, Categoria, Sexo, Marca, Atleta, CBAt, Local, Competicao, Data.

---

## 14. Ranking

### O que e?
O ranking compila as melhores marcas dos atletas ao longo de varias competicoes.

### Visualizar:
1. Acesse **Ranking**
2. Filtre por: prova, ano, categoria, sexo, estado
3. Veja as melhores marcas ordenadas

### Aprovar entradas:
Quando resultados sao digitados em competicoes, entradas de ranking sao geradas automaticamente como **pendentes**. Voce revisa e aprova/rejeita.

### Entrada manual:
Voce pode adicionar uma entrada de ranking manualmente (ex: resultado de competicao externa).

### Importar:
Importe rankings de arquivo Excel com: Atleta, CBAt, Prova, Marca, Vento, Data, Competicao.

---

## 15. Relatorio de Participacao

### O que e?
Documento oficial que comprova a participacao de um atleta ou equipe numa competicao.

### Gerar relatorio:
1. No painel, na secao **Relatorio Oficial de Participacao**
2. Selecione a **competicao**
3. Filtre os atletas desejados
4. Opcionalmente, adicione uma **assinatura** (imagem)
5. Clique em **Gerar Relatorio**
6. O sistema gera um documento para impressao

### Solicitacoes de relatorio:
Atletas e equipes podem solicitar relatorios pelo sistema. As solicitacoes aparecem no seu painel para voce aprovar e gerar.

---

## 16. Auditoria

### O que e?
Registro de todas as acoes realizadas no sistema. Mostra quem fez o que e quando.

### Acessar:
1. No painel, na secao **Auditoria de Acoes**
2. Veja o historico com:
   - Data e hora
   - Usuario que realizou
   - Tipo de acao (cadastrou atleta, editou competicao, etc.)
   - Detalhes da acao
3. Use a busca para filtrar por usuario, acao ou detalhe

### Modulos rastreados:
- Equipes, Atletas, Competicoes, Inscricoes, Resultados, Sumulas, Recordes, Numeracao, Membros, Treinadores, Funcionarios, Autenticacao, Sistema, Secretaria

---

## 17. Configuracoes da Conta

### Dados pessoais:
1. Acesse **Configuracoes** (icone de engrenagem)
2. Na aba **Dados Pessoais**:
   - Edite nome, email, CPF/CNPJ, telefone
   - Salve as alteracoes

### Alterar senha:
1. Na aba **Alterar Senha**:
   - Digite a senha atual
   - Digite a nova senha (minimo 6 caracteres)
   - Confirme a nova senha
   - Salve

### Perfil publico (organizadores):
1. Na aba **Perfil Publico**:
   - Configure o banner e logo do perfil
   - Adicione links de redes sociais (Instagram, Facebook, etc.)
   - Ative/desative a visibilidade publica

### Backup de dados:
- **Exportar dados**: gera um arquivo com todos os seus dados
- **Importar dados**: restaura dados de um backup anterior
- **Limpar todos os dados**: remove tudo (irreversivel!)

### LGPD:
- **Portabilidade**: solicite seus dados em formato legivel
- **Revogar consentimento**: cancela o uso dos seus dados
- **Anonimizacao**: solicita a remocao dos seus dados pessoais

---

## Dicas Gerais

1. **Sempre salve** antes de sair de uma tela de edicao
2. **Inscricoes** so podem ser feitas com a competicao ativa (nao encerrada)
3. **Resultados** podem ser digitados a qualquer momento, mesmo durante a competicao
4. **QR Codes** facilitam muito a camera de chamada e entrega de medalhas - imprima os dorsais com QR
5. **Funcionarios** com permissoes limitadas sao ideais para fiscais de prova que so precisam digitar resultados
6. O sistema funciona **offline** - se a internet cair, os dados sao salvos localmente e sincronizados quando voltar
7. **Nunca compartilhe** sua senha de organizador - crie funcionarios com permissoes especificas
8. **Backup regular**: exporte seus dados periodicamente pela tela de Configuracoes
