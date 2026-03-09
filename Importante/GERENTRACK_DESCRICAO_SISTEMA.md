# GerenTrack — Descrição Completa do Sistema

## O que é o GerenTrack

GerenTrack é uma plataforma web para **gestão de competições de atletismo**. Permite que organizadores criem e gerenciem eventos, inscrevam atletas, digitalizem resultados e emitam relatórios. Atletas e equipes têm acesso a painéis próprios para acompanhar suas inscrições e resultados. É construído em **React + Firebase**, com dados persistidos em localStorage sincronizados via Firestore.

---

## Perfis de Usuário

O sistema possui 6 tipos de usuário, cada um com acesso diferente:

| Perfil | Acesso |
|---|---|
| **Admin** | Acesso total. Gerencia organizadores, equipes, usuários, branding, auditoria e configurações globais |
| **Organizador** | Cria e gerencia competições, inscreve atletas, digita resultados, gerencia funcionários e treinadores |
| **Funcionário** | Acesso parcial ao painel do organizador, com permissões configuráveis (ex: só inscrições, só resultados) |
| **Atleta** | Painel próprio: vê suas inscrições, resultados, pode se inscrever em eventos abertos |
| **Equipe** | Painel da equipe: gerencia membros, inscreve atletas em revezamentos, vê resultados |
| **Treinador** | Vinculado a uma equipe, com permissões configuráveis sobre atletas e inscrições |

---

## Módulos e Funcionalidades

### 1. Autenticação
- Login com e-mail e senha via Firebase Auth
- Cadastro de conta para atletas e equipes (auto-registro)
- Recuperação de senha por e-mail
- Senha temporária gerada pelo admin/organizador
- Troca de senha obrigatória no primeiro acesso com senha temporária
- Suporte a múltiplos perfis por e-mail (ex: mesmo e-mail sendo organizador de 2 entidades)
- Configurações de perfil (nome, e-mail, senha)

---

### 2. Competições (Eventos)

Cada competição tem:
- Nome, data, local, descrição
- Status: `rascunho → inscrições abertas → inscrições restritas → encerrado`
- Norma de permissividade (quais categorias podem competir em provas acima da sua)
- Lista de provas do programa (quais modalidades fazem parte do evento)
- Configuração de pontuação por equipes (pontos por colocação, por prova)

**Telas:**
- `TelaHome` — lista todas as competições com cards, filtros por status
- `TelaCadastroEvento` — wizard de 3 passos para criar/editar evento
- `TelaEventoDetalhe` — hub central do evento com abas: Inscrições, Súmulas, Resultados, Configurações

---

### 3. Inscrições

Atletas podem ser inscritos de três formas:

**Inscrição Avulsa** (`TelaInscricaoAvulsa`)
- Wizard de 2 modos: atleta já cadastrado no sistema ou novo atleta
- Seleciona categoria, provas individuais e provas combinadas (decatlo/heptatlo)
- Valida se atleta já está inscrito, se a prova está no programa, se a categoria é permitida
- Permite inscrever atleta em categoria superior (se a norma do evento permitir)

**Inscrição de Revezamento** (`TelaInscricaoRevezamento`)
- Inscreve equipe em provas de revezamento (4x100m, 4x400m, etc.)
- Seleciona os atletas que compõem o revezamento (4 titulares + reservas conforme regra)
- Suporte a revezamentos mistos

**Gerenciar Inscrições** (`TelaGerenciarInscricoes`)
- Lista todas as inscrições do evento com filtros por categoria, prova, sexo
- Permite excluir inscrições individualmente
- Exporta lista de inscritos

**Gestão de Inscrições** (`TelaGestaoInscricoes`)
- Visão mais operacional: adicionar/remover inscrições em massa
- Controle de numeração de peito (`TelaNumericaPeito`): atribui número de peito a cada atleta inscrito

---

### 4. Súmulas

`TelaSumulas` — controle operacional de cada prova durante a competição:
- Filtra por prova, categoria, sexo, fase (classificatória, semifinal, final)
- Exibe lista de atletas com raia/posição, resultados digitados, status
- Suporte a múltiplas fases (seriação automática para semifinais/finais)
- Impressão de súmula (gera HTML standalone com CSS inline para impressão real)
- Campos de condições ambientais (vento, temperatura, umidade, horário de início/fim)
- Controle de status por atleta: DNS (não saiu), DNF (não terminou), DQ (desclassificado), NM (sem marca)

---

### 5. Digitar Resultados

`TelaDigitarResultados` — entrada de resultados pelo organizador/funcionário:
- Seleciona categoria + prova + sexo
- Exibe tabela com todos os atletas inscritos naquela combinação
- Para provas de pista (velocidade, meio-fundo): entrada de tempo com formatação automática (ex: digitar `1085` vira `10,85s`)
- Para provas de campo (saltos, lançamentos): entrada de marca em metros
- Para provas de vento (100m, 200m, salto em distância, etc.): campo de vento
- Para provas combinadas (decatlo/heptatlo): entrada prova a prova com cálculo automático de pontos WA/CBAT
- Suporte a dupla cronometragem (cronômetro + foto-finish)
- Salvar e Publicar: grava resultado e atualiza placar em tempo real

---

### 6. Resultados

`TelaResultados` — exibição pública dos resultados:
- Acesso sem login (tela pública)
- Filtra por evento, prova, categoria, sexo, fase
- Ordena por colocação (melhor marca/tempo primeiro)
- Trata empates centesimais (exibe com indicador visual)
- Exibe pontuação por equipes quando configurado
- Placar geral de equipes com ranking
- Provas combinadas: exibe tabela com resultado de cada prova + total de pontos

---

### 7. Recordes

`TelaRecordes` — gestão do banco de recordes:
- Recordes cadastrados manualmente ou detectados automaticamente ao digitar resultados
- Categorias de recorde: brasileiro, sul-americano, mundial, estadual, do evento, pessoal
- Pendências de recorde: quando um resultado bate um recorde existente, gera pendência para revisão
- Aprovação/rejeição de pendências pelo organizador/admin
- Histórico de recordes quebrados

---

### 8. Impressão

`gerarHtmlImpressao` — gerador de documentos para impressão:
- Gera HTML standalone com CSS inline (sem dependências externas)
- Abre em nova aba do browser pronta para Ctrl+P
- Layouts para: súmula por prova, lista de inscritos, resultados finais
- Inclui logo do evento/federação, data, local, condições ambientais

---

### 9. Atletas

**Cadastrar Atleta** (`TelaCadastrarAtleta`)
- Cadastro completo: nome, CPF, data de nascimento, sexo, clube/equipe
- Validação de CPF
- Busca por CPF para evitar duplicatas
- Importação em lote via planilha (`TelaImportarAtletas`): importa CSV/Excel com múltiplos atletas de uma vez
- Desvincular atleta de equipe

**Editar Atleta** (`TelaEditarAtleta`)
- Edita todos os dados do atleta
- Exibe histórico de inscrições e resultados
- Exclui atleta do sistema

---

### 10. Equipes

**Cadastro de Equipe** (`TelaCadastroEquipe`)
- Cadastro com nome, CNPJ, responsável, contato
- Vinculada a uma federação/organizador

**Painel da Equipe** (`TelaPainelEquipe`)
- Visão geral dos atletas da equipe
- Inscrições ativas em competições
- Resultados dos atletas
- Pontuação acumulada

**Gerenciar Membros** (`TelaGerenciarMembros`)
- Adicionar/remover atletas da equipe
- Solicitações de vínculo: atleta solicita pertencer a uma equipe, equipe aprova/recusa

---

### 11. Funcionários e Treinadores

**Funcionários** (`TelaFuncionarios`)
- Cadastro de usuários auxiliares do organizador
- Permissões granulares configuráveis: ver competições, editar competições, gerenciar inscrições, digitar resultados, gerenciar súmulas, gerenciar atletas, ver funcionários
- Login próprio com acesso ao painel do organizador limitado pelas permissões

**Treinadores** (`TelaTreinadores`)
- Vinculados a equipes específicas
- Permissões: ver atletas, cadastrar atletas, inscrever atletas, gerenciar inscrições, importar atletas
- Login próprio com acesso ao painel da equipe

---

### 12. Painéis

**Painel do Organizador** (`TelaPainelOrganizador`)
- Dashboard com estatísticas: total de eventos, atletas inscritos, resultados publicados
- Lista de eventos com acesso rápido a cada um
- Acesso a todas as ferramentas de gestão

**Painel do Atleta** (`TelaPainelAtleta`)
- Dados pessoais e categoria atual
- Lista de eventos inscritos com provas e status
- Resultados obtidos
- Solicitações de vínculo com equipes
- Notificações (ex: inscrição confirmada, resultado publicado)

**Painel Geral / Equipe** (`TelaPainel`)
- Para usuários de equipe e treinadores
- Lista inscrições ativas, permite editar inscrições em eventos com inscrições abertas

---

### 13. Administração

**TelaAdmin** — painel exclusivo do administrador:
- Aprovação/recusa de organizadores e eventos pendentes
- Gerenciar todos os usuários do sistema
- Limpar todos os dados (reset do sistema)
- Exportar/importar dados (backup JSON)
- Configurar branding (logo, ícone, nome, slogan do site)
- Resolver solicitações de recuperação de senha manual
- Ver histórico de auditoria global

**TelaGerenciarUsuarios**
- CRUD completo de organizadores, equipes e atletas-usuários
- Edição administrativa (sem precisar do login do usuário)

**TelaGerenciarEquipes**
- Gerenciamento de equipes filiadas
- Gerar senha temporária para acesso de equipes

**TelaAuditoria**
- Log cronológico de todas as ações no sistema
- Filtros por tipo de ação, usuário, data
- Máximo de 2.000 registros mantidos

---

## Modelo de Dados

### Entidades principais:
- **eventos**: `{ id, nome, data, local, status, provasPrograma[], permissividadeNorma, pontuacaoConfig }`
- **atletas**: `{ id, nome, cpf, dataNasc, sexo, clubeId, anoNasc }`
- **equipes**: `{ id, nome, cnpj, responsavel, organizadorId }`
- **inscricoes**: `{ id, atletaId, eventoId, provaId, categoria, sexo, numeroPeito }`
- **resultados**: `{ id, inscricaoId, eventoId, provaId, marca, tempo, vento, status, fase, colocacao }`
- **recordes**: `{ id, provaId, categoria, sexo, tipo, marca, atletaId, data }`
- **organizadores**: `{ id, nome, cnpj, email, status, aprovado }`
- **funcionarios**: `{ id, nome, email, organizadorId, permissoes[] }`
- **treinadores**: `{ id, nome, email, equipeId, permissoes[] }`

### Persistência:
- **localStorage** para dados do cliente (cache local)
- **Firebase Firestore** para sincronização entre dispositivos
- Hook `useLocalStorage` sincroniza automaticamente entre os dois

---

## Domínio do Atletismo

### Provas suportadas:
- **Pista curta**: 60m, 100m, 200m, 400m, 60m com barreiras, 100m/110m com barreiras, 400m com barreiras
- **Meio-fundo e fundo**: 800m, 1500m, 3000m, 5000m, 10000m, 3000m com obstáculos
- **Revezamentos**: 4x100m, 4x400m, 4x100m misto, 4x400m misto, Maratona de revezamento
- **Saltos**: Salto em distância, Salto triplo, Salto em altura, Salto com vara
- **Lançamentos**: Arremesso de peso, Lançamento de disco, Lançamento de dardo, Lançamento de martelo
- **Marcha atlética**: 5km, 10km, 20km
- **Provas combinadas**: Decatlo (10 provas masculino), Heptatlo (7 provas feminino), Pentatlo

### Categorias:
Sub-12, Sub-14, Sub-16, Sub-18, Sub-20, Adulto, Master (35+, 40+, 45+... até 85+)

### Implementos por categoria:
Cada categoria usa implementos de peso diferente (ex: disco Sub-16 masculino = 1kg, Adulto masculino = 2kg). O sistema gerencia isso automaticamente.

### Pontuação combinadas:
Sistema de pontuação WA (World Athletics) e CBAT (Confederação Brasileira de Atletismo) para decatlo/heptatlo, calculado automaticamente ao digitar cada resultado parcial.

---

## Fluxo Típico de Uso

```
1. Admin aprova organizador
2. Organizador cria evento (nome, data, local, provas do programa)
3. Organizador abre inscrições
4. Atletas/equipes se inscrevem nas provas
5. Organizador atribui numeração de peito
6. Organizador imprime súmulas
7. Durante o evento: funcionário digita resultados prova a prova
8. Resultados são publicados automaticamente
9. Sistema detecta recordes quebrados → pendências para aprovação
10. Organizador encerra o evento
11. Resultados ficam disponíveis publicamente
```

---

## Tecnologias

- **Frontend**: React 18 (hooks, SPA sem router externo — navegação por estado)
- **Backend/DB**: Firebase (Auth + Firestore)
- **Build**: Vite
- **Estilo**: CSS-in-JS (objetos de estilo inline), sem framework CSS externo
- **Fontes**: Barlow Condensed (números/títulos), sistema padrão
- **Deploy**: Não identificado (provavelmente Firebase Hosting ou Vercel)
