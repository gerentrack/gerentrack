# Plano de Evolução do Stack — GERENTRACK

> **Objetivo**: preparar o GERENTRACK para escala nacional, migrando incrementalmente de um SPA Firebase-only para uma arquitetura com backend, banco relacional e SSR — sem interromper o produto em produção.

> **Data de criação**: 2026-04-21
> **Última atualização**: 2026-04-30
> **Status**: Fase 1 e 2 concluídas (exceto SSR), Fase 3 parcial. React Router v7 migração completa.

---

## Diagnóstico do estado atual (atualizado 2026-04-28)

| Aspecto | Antes | Agora | Pendente |
|---|---|---|---|
| Banco de dados | Firestore (único) | Firestore + 4 API endpoints Vercel | PostgreSQL para dados históricos |
| Lógica de negócio | 100% no cliente | 3 operações server-side (ranking, recordes, validação) com fallback offline | Expandir API |
| Renderização | SPA pura, SEO zero | SPA + Open Graph para crawlers (WhatsApp, Google) | SSR real (Fase 2.4) |
| Testes | Nenhum | 265 testes (engines + componentes), CI no GitHub Actions | Expandir cobertura |
| App.jsx | ~2.600 linhas | 803 linhas (19 hooks + 1 componente extraídos) | Fiação apenas — sem lógica de negócio |
| Performance | Bundle 1.269KB | Bundle 246KB (-80%), lazy loading em 61 imagens | CDN imagens |
| Observabilidade | Nenhuma | Sentry + health check + logs estruturados (14 routes) | Web Vitals budgets |
| Integrações | Nenhuma | API privada (3 endpoints) | API pública (Fase 3.2) |

### Inventário de engines críticos (src/shared/engines/)

| Engine | Função | Prioridade de teste |
|---|---|---|
| `seriacaoEngine.js` | Distribuição de atletas em séries/baterias | Alta |
| `teamScoringEngine.js` | Pontuação por equipe com desempate | Alta |
| `combinedScoringEngine.js` | Pontuação de provas combinadas (decatlo, etc.) | Alta |
| `combinedEventEngine.js` | Lógica de provas combinadas | Alta |
| `recordDetectionEngine.js` | Detecção automática de recordes | Alta |
| `rankingExtractionEngine.js` | Extração de ranking nacional | Média |
| `inscricaoEngine.js` | Validação de inscrições | Média |
| `lynxImportEngine.js` | Import de resultados FinishLynx (.lif) | Média |
| `lynxExportEngine.js` | Export para formato FinishLynx | Baixa |
| `exportEngine.js` | Exportação de dados gerais | Baixa |
| `planEngine.js` | Engine de planos | Baixa |
| `recordHelper.js` | Helpers para recordes | Baixa |

---

## Fase 1 — Fundação (curto prazo) ✅ CONCLUÍDA

**Meta**: criar a base de qualidade e a primeira camada de backend sem alterar a experiência do usuário.

**Concluída em**: 2026-04-28

### 1.1 Testes unitários nos engines

**Por quê**: os engines calculam resultados oficiais de competição. Um bug na pontuação ou seriação pode invalidar uma competição inteira. Sem testes, não é possível refatorar com confiança.

**Escopo**:
- Instalar **Vitest** (compatível com Vite, zero config adicional)
- Criar testes para os 5 engines de prioridade alta
- Atingir cobertura mínima de 80% nesses engines

**Tarefas**:

```
1.1.1  npm install -D vitest @vitest/coverage-v8
1.1.2  Criar vitest.config.js (ou adicionar config no vite.config.js)
1.1.3  Criar src/shared/engines/__tests__/seriacaoEngine.test.js
       - Distribuição equilibrada de atletas por série
       - Respeito a limites de raias (8 raias padrão)
       - Casos edge: 1 atleta, 0 atletas, mais atletas que raias
1.1.4  Criar src/shared/engines/__tests__/teamScoringEngine.test.js
       - Pontuação padrão (8-7-6-5-4-3-2-1)
       - Desempate estável (determinístico)
       - Equipes empatadas em pontos
       - Revezamento contando pontos para equipe
1.1.5  Criar src/shared/engines/__tests__/combinedScoringEngine.test.js
       - Tabelas de pontuação IAAF/World Athletics
       - Cálculo de pontos por marca em cada prova
1.1.6  Criar src/shared/engines/__tests__/combinedEventEngine.test.js
       - Sequência de provas do decatlo/heptatlo
       - Classificação geral por pontos combinados
1.1.7  Criar src/shared/engines/__tests__/recordDetectionEngine.test.js
       - Detecção de recorde quando marca supera existente
       - Respeito a categorias e sexo
       - Não detectar recorde em prova com vento acima do limite
1.1.8  Adicionar script "test" e "test:coverage" no package.json
1.1.9  (Opcional) Configurar CI no GitHub Actions para rodar testes no push
```

**Estrutura de diretórios resultante**:
```
src/shared/engines/
├── __tests__/
│   ├── seriacaoEngine.test.js
│   ├── teamScoringEngine.test.js
│   ├── combinedScoringEngine.test.js
│   ├── combinedEventEngine.test.js
│   └── recordDetectionEngine.test.js
├── seriacaoEngine.js
├── teamScoringEngine.js
└── ...
```

### 1.2 API mínima com Vercel Functions

**Por quê**: mover lógica crítica para o servidor permite controle de acesso real, integrações futuras, e desacopla regras de negócio do frontend.

**Escopo**:
- Criar pasta `api/` na raiz (convenção Vercel para serverless functions)
- Migrar 3 operações iniciais para o servidor:
  1. **Cálculo de ranking nacional** — query pesada que hoje roda no browser
  2. **Detecção de recordes** — lógica que deve ser autoritativa (server-side)
  3. **Validação de inscrição** — regras de elegibilidade por categoria/idade

**Tarefas**:

```
1.2.1  Criar api/ na raiz do projeto
1.2.2  Criar api/ranking.js
       - Recebe eventoId ou filtros (categoria, sexo)
       - Consulta Firestore server-side via firebase-admin
       - Retorna ranking calculado
       - Autenticação via token Firebase (req.headers.authorization)
1.2.3  Criar api/recordes.js
       - Recebe resultado + contexto da prova
       - Verifica contra recordes existentes no Firestore
       - Retorna se é recorde + detalhes
1.2.4  Criar api/validar-inscricao.js
       - Recebe dados do atleta + prova
       - Valida elegibilidade (categoria, idade, limite de inscrições)
       - Retorna aprovação ou motivo de rejeição
1.2.5  Instalar firebase-admin como dependência
1.2.6  Criar api/_lib/auth.js — middleware de verificação de token Firebase
1.2.7  Criar api/_lib/firestore.js — instância admin do Firestore
1.2.8  Atualizar vercel.json com rewrites para /api/*
1.2.9  Atualizar frontend para chamar API em vez de calcular localmente
       (manter cálculo local como fallback offline)
```

**Estrutura de diretórios resultante**:
```
api/
├── _lib/
│   ├── auth.js          # Verificação de token Firebase
│   └── firestore.js     # Instância firebase-admin
├── ranking.js           # GET /api/ranking?eventoId=...
├── recordes.js          # POST /api/recordes
└── validar-inscricao.js # POST /api/validar-inscricao
```

### 1.3 SSR para páginas públicas de resultados

**Por quê**: resultados de competição precisam ser indexáveis pelo Google e gerar previews ao compartilhar no WhatsApp/Instagram. Hoje, links compartilhados mostram apenas "GERENTRACK" sem contexto.

**Escopo**:
- Implementar SSR seletivo apenas para rotas públicas (`/competicao/:slug/resultados`)
- Gerar meta tags Open Graph dinâmicas (título da competição, data, local)
- Manter o restante do app como SPA (sem migrar tudo para SSR)

**Opções de implementação** (escolher uma):

| Opção | Prós | Contras |
|---|---|---|
| **A) Vercel Edge Functions + meta injection** | Menor mudança; injeta `<meta>` tags no `index.html` antes de servir | Não é SSR real; crawlers avançados podem não executar JS |
| **B) React Router v7 com SSR** | Já usamos RR v7; suporte nativo a loaders/SSR | Requer reestruturar entry points (server + client) |
| **C) Migrar para Next.js** | SSR/SSG robusto; App Router maduro | Migração grande; muda build system inteiro |

**Recomendação**: **Opção A** como quick win imediato (1-2 dias), evoluindo para **Opção B** na Fase 2.

**Tarefas (Opção A — quick win)**:

```
1.3.1  Criar api/og/[...path].js — Edge Function que intercepta crawlers
       - Detecta User-Agent de crawlers (Googlebot, WhatsApp, Telegram, etc.)
       - Para crawlers: busca dados da competição no Firestore, retorna HTML
         com meta tags Open Graph preenchidas
       - Para browsers normais: serve o SPA normalmente
1.3.2  Meta tags a gerar:
       - og:title = "Resultados — {nome da competição}"
       - og:description = "{data} · {cidade} · {qtd atletas} atletas"
       - og:image = logo da competição (ou default GERENTRACK)
       - og:url = URL canônica
1.3.3  Atualizar vercel.json para rotear /competicao/*/resultados pelo Edge Function
1.3.4  Testar com ferramentas de debug de Open Graph (Facebook Debugger, etc.)
```

### Entregáveis da Fase 1

- [x] Vitest configurado com 8 suites de teste (265 testes, engines + componentes)
- [x] 3 Vercel Functions operacionais (ranking, recordes, validação) + health check
- [x] Meta tags Open Graph nas páginas públicas de resultados
- [x] Scripts `npm test`, `npm run test:coverage`, `npm run test:engines`, `npm run test:components`
- [x] GitHub Actions CI configurado
- [x] Frontend integrado com API (fallback offline automático)
- [x] Testes de integração no frontend (React Testing Library + jsdom)

---

## Fase 2 — Banco relacional e API robusta (médio prazo)

**Meta**: introduzir PostgreSQL para dados relacionais, expandir a API, e começar a desacoplar o App.jsx monolítico.

**Duração estimada**: 8–12 semanas

### 2.1 PostgreSQL para dados estruturados

**Por quê**: Firestore é excelente para real-time e offline, mas péssimo para queries relacionais. Rankings nacionais, histórico de atletas entre competições, relatórios cruzados — tudo isso é SQL nativo.

**Estratégia**: banco relacional como **source of truth** para dados históricos/analíticos. Firestore continua como **real-time layer** para dados da competição ativa.

**Provedor recomendado**: **Supabase** (PostgreSQL gerenciado, SDK JS nativo, Row Level Security, hosting em São Paulo disponível) ou **Neon** (serverless PostgreSQL, branching para dev).

**Modelo de dados relacional (tabelas principais)**:

```sql
-- Atletas (registro único nacional, cross-competição)
CREATE TABLE atletas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE,          -- link com Firebase Auth
  nome TEXT NOT NULL,
  sexo CHAR(1) NOT NULL,             -- M / F
  ano_nasc INTEGER NOT NULL,
  cpf TEXT UNIQUE,                   -- identificador único nacional
  equipe_id UUID REFERENCES equipes(id),
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Equipes
CREATE TABLE equipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sigla TEXT,
  estado CHAR(2),                    -- UF para ranking estadual
  federada BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Competições (espelho do Firestore "eventos")
CREATE TABLE competicoes (
  id UUID PRIMARY KEY,               -- mesmo ID do Firestore
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cidade TEXT,
  estado CHAR(2),
  data_inicio DATE,
  data_fim DATE,
  organizador_id UUID,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Resultados (consolidados, pós-competição)
CREATE TABLE resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competicao_id UUID REFERENCES competicoes(id),
  atleta_id UUID REFERENCES atletas(id),
  prova TEXT NOT NULL,               -- ex: "100m", "salto_altura"
  categoria TEXT NOT NULL,           -- ex: "Sub-16", "Adulto"
  sexo CHAR(1) NOT NULL,
  fase TEXT DEFAULT 'Final',         -- Eliminatória, Semifinal, Final
  marca TEXT,                        -- tempo ou distância como string
  marca_ms INTEGER,                  -- milissegundos (para ordenação)
  posicao INTEGER,
  vento NUMERIC(3,1),
  pontos_equipe INTEGER,
  eh_recorde BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competicao_id, atleta_id, prova, categoria, fase)
);

-- Recordes (nacionais, estaduais, de competição)
CREATE TABLE recordes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prova TEXT NOT NULL,
  categoria TEXT NOT NULL,
  sexo CHAR(1) NOT NULL,
  escopo TEXT NOT NULL,              -- 'nacional', 'estadual', 'competicao'
  escopo_ref TEXT,                   -- UF ou competicao_id
  marca TEXT NOT NULL,
  marca_ms INTEGER NOT NULL,
  atleta_id UUID REFERENCES atletas(id),
  competicao_id UUID REFERENCES competicoes(id),
  data_registro DATE,
  criado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(prova, categoria, sexo, escopo, escopo_ref)
);

-- Ranking nacional (materializado, recalculado periodicamente)
CREATE TABLE ranking_nacional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temporada INTEGER NOT NULL,        -- ex: 2026
  prova TEXT NOT NULL,
  categoria TEXT NOT NULL,
  sexo CHAR(1) NOT NULL,
  atleta_id UUID REFERENCES atletas(id),
  melhor_marca TEXT,
  melhor_marca_ms INTEGER,
  posicao INTEGER,
  total_competicoes INTEGER,
  atualizado_em TIMESTAMPTZ DEFAULT now()
);
```

**Tarefas**:

```
2.1.1  Escolher provedor (Supabase vs Neon) — priorizar região São Paulo
2.1.2  Criar projeto e configurar banco com schema acima
2.1.3  Criar api/_lib/db.js — pool de conexão PostgreSQL (via @vercel/postgres ou pg)
2.1.4  Criar script de migração: sync Firestore → PostgreSQL
       - Ler coleções existentes do Firestore (atletas, equipes, eventos, resultados)
       - Inserir no PostgreSQL com deduplicação por CPF/email
       - Manter mapeamento de IDs (Firestore ID → PostgreSQL UUID)
2.1.5  Criar trigger/Cloud Function: ao finalizar competição no Firestore,
       consolidar resultados no PostgreSQL automaticamente
2.1.6  Criar índices otimizados:
       - resultados(prova, categoria, sexo, marca_ms)
       - ranking_nacional(temporada, prova, categoria, sexo, posicao)
       - atletas(cpf), atletas(nome)
2.1.7  Configurar Row Level Security (se Supabase) ou permissões de API
```

**Fluxo de dados resultante**:
```
Competição ativa (real-time):
  Browser ←→ Firestore (onSnapshot, offline-first)

Dados consolidados (pós-competição):
  Firestore → Cloud Function → PostgreSQL
  PostgreSQL → API → Browser (rankings, histórico, relatórios)
```

### 2.2 Expansão da API

**Tarefas**:

```
2.2.1  api/atletas/buscar.js — busca nacional de atletas (PostgreSQL full-text search)
2.2.2  api/atletas/[id]/historico.js — histórico cross-competição de um atleta
2.2.3  api/ranking/nacional.js — ranking nacional por prova/categoria/temporada
2.2.4  api/ranking/estadual.js — ranking por UF
2.2.5  api/resultados/consolidar.js — endpoint para consolidar competição finalizada
2.2.6  api/competicoes/buscar.js — busca de competições por nome/cidade/data
2.2.7  api/estatisticas/dashboard.js — dados agregados para painel admin nacional
2.2.8  Documentar API com OpenAPI/Swagger básico em docs/API.md
```

### 2.3 Decomposição do App.jsx

**Por quê**: com ~2.600 linhas, o App.jsx é o maior risco de regressão do projeto. Qualquer mudança pode quebrar qualquer tela.

**Estratégia**: extração incremental — mover blocos do App.jsx para módulos sem alterar comportamento.

**Tarefas (ordem de prioridade)**:

```
2.3.1  Extrair lógica de notificações para src/hooks/useNotificacoes.js
       - Estado de notificações, leitura, expiração, limpeza
       - Hoje está inline no App.jsx
2.3.2  Extrair lógica de auditoria para src/hooks/useAuditoria.js
       - historicoAcoes, registrarAcao, cap de 500 registros
2.3.3  Extrair gerenciamento de branding para src/hooks/useBranding.js
       - Logos de organizadores, branding de competição
2.3.4  Extrair lógica de solicitações para src/hooks/useSolicitacoes.js
2.3.5  Mover renderização condicional de telas para componentes de rota
       - Cada case do switch/if-chain no App.jsx vira um componente em src/features/
       - App.jsx fica apenas com providers e router
2.3.6  Meta: App.jsx abaixo de 500 linhas (apenas providers + router + layout)
```

### 2.4 SSR real com React Router v7

**Substituir o quick win da Fase 1 por SSR nativo**:

```
2.4.1  Criar entry-server.jsx e entry-client.jsx
2.4.2  Configurar React Router v7 loaders para rotas públicas:
       - /competicao/:slug/resultados — loader busca dados da competição
       - /ranking — loader busca ranking do PostgreSQL
       - /atleta/:id — loader busca perfil + histórico
2.4.3  Manter rotas autenticadas (admin, painel) como client-only
2.4.4  Atualizar vercel.json para suportar SSR (output: "hybrid" ou similar)
2.4.5  Implementar streaming SSR para páginas com muitos dados
```

### Entregáveis da Fase 2

- [x] PostgreSQL operacional (Supabase, São Paulo) com 5 tabelas + índices + RLS
- [x] Migração de dados históricos concluída (7 competições consolidadas)
- [x] Consolidação automática pós-competição (Firestore → PostgreSQL via /api/resultados/consolidar)
- [x] Desfinalização marca como "revisao" no PostgreSQL (/api/resultados/desfinalizar)
- [x] 8 endpoints de API operacionais: ranking, recordes, validar-inscricao, consolidar, desfinalizar, migrar-historico, atletas/buscar, atletas/historico
- [x] App.jsx: 19 hooks + 1 componente extraídos, toda lógica de negócio fora (1924→803 linhas, -58%)
- [x] React Router v7 completo: 40+ Route definitions, EventoLayout, FinalizedGuard, tela/setTela removidos
- [ ] SSR nativo em rotas públicas (adiado — Open Graph resolve SEO para crawlers)
- [x] Ranking nacional consultável via SQL (dados consolidados no Supabase)

---

## Fase 3 — Escala nacional e integrações (longo prazo)

**Meta**: suportar centenas de competições simultâneas, integrar com federações, e otimizar performance para dispositivos modestos em todo o Brasil.

**Duração estimada**: 12–20 semanas (pode ser faseada internamente)

### 3.1 Modelo de papéis: Federação + Confederação

**Contexto**: O GERENTRACK opera exclusivamente com **federações estaduais** como organizadores. Não existem organizadores genéricos — todo organizador é uma federação vinculada a uma UF. A **Confederação Brasileira de Atletismo (CBAt)** poderá acessar o sistema com papel similar ao admin, porém com restrições.

**Hierarquia de papéis**:

```
┌─────────────────────────────────────────────────────────────────┐
│ Admin (GERENTRACK)                                              │
│   - Gestão técnica do sistema (branding, config, usuários)      │
│   - Aprovação/recusa de federações                              │
│   - Acesso total a todos os dados                               │
│   - Gestão de planos e licenças                                 │
├─────────────────────────────────────────────────────────────────┤
│ Confederação (CBAt) — modelo a definir                          │
│   - Acesso a recordes nacionais e ranking consolidado           │
│   - Pode ser: papel interno (login), integração (API), ou ambos │
│   - Funcionalidades similares ao admin, com restrições          │
│   - Decisão depende de como a CBAt quer interagir               │
├─────────────────────────────────────────────────────────────────┤
│ Federação estadual (= organizador)                              │
│   - Gerencia competições, inscrições, resultados, funcionários  │
│   - Gerencia recordes ESTADUAIS da sua UF                       │
│   - Gerencia ranking da sua UF (aprovar/rejeitar entradas)      │
│   - Visualiza ranking nacional (read-only)                      │
│   - Gerencia equipes e atletas da sua jurisdição                │
└─────────────────────────────────────────────────────────────────┘
```

**Tarefas**:

```
3.1.1  Recordes por escopo (estadual / nacional)
       - Federação gerencia recordes do seu estado (escopo: UF)
       - Confederação gerencia recordes nacionais (escopo: nacional)
       - Admin mantém acesso total como fallback
       - Campo `escopo` + `uf` no tipo de recorde determina permissão
       - Homologação: federação/confederação marca como "homologado" ou "pendente"

3.1.2  Ranking por UF com gestão pela federação
       - Federação vê e gerencia entradas de ranking da sua UF
       - Aprovar/rejeitar entradas antes de publicar
       - Confederação visualiza ranking nacional (composição de todas UFs)
       - Exportação de ranking estadual (CSV/XLSX)

3.1.3  Confederação (CBAt) — modelo a definir
       - Opção A: Papel interno — novo tipo "confederacao" com painel admin restrito
       - Opção B: Integração externa — CBAt consome dados via API pública v1
       - Opção C: Híbrido — login no sistema (RO) + API para automações
       - Independente do modelo: acesso a recordes nacionais e ranking consolidado
       - Decisão depende de como a CBAt quer interagir com o sistema

3.1.4  (Opcional) Subdomínios por federação
       - fmat.gerentrack.com.br como atalho para o perfil público
       - Mesmo app, detecta federação pelo hostname
       - Configuração de DNS na Vercel (zero custo)

3.1.5  Renomear "organizador" → "federação" na UI
       - Labels, textos, notificações, auditoria
       - Manter campo `tipo: "organizador"` no banco por retrocompatibilidade
       - Alias na UI: organizador = federação
```

### 3.2 Integrações externas

```
3.2.1  API pública documentada (read-only) para consulta de resultados
       - Autenticação via API key
       - Rate limiting
       - Endpoints: /v1/resultados, /v1/atletas, /v1/ranking
3.2.2  Integração com World Athletics (formato de dados compatível)
       - Export de resultados no formato exigido pela WA
       - Import de tabelas de pontuação atualizadas
3.2.3  Webhook system para notificar sistemas externos
       - Competição finalizada → webhook com resultados
       - Recorde detectado → webhook com detalhes
3.2.4  Import de dados de outras plataformas de atletismo
3.2.5  Integração com CBAt
       - Modelo de acesso definido em 3.1.3 (papel interno, API, ou híbrido)
       - Exportação de resultados para formato World Athletics
       - Registro nacional de atletas (futuro, depende de especificação da CBAt)
```

### 3.3 Performance e code splitting

```
3.3.1  ✅ Lazy loading por rota + manualChunks (Firebase/React separados)
       - Bundle principal: 1269KB → 246KB (-80%)
       - 40 telas com React.lazy(), 4 telas migradas de estático para lazy
       - 6 imports mortos removidos
3.3.2  ✅ Análise de bundle realizada via rollup-plugin-visualizer
3.3.3  (DESCARTADO) Code splitting por role — benefício marginal com React.lazy() já ativo
3.3.4  ✅ Lazy loading de imagens (loading="lazy" em 61 <img>)
       - CDN dedicado e WebP/AVIF adiados — poucas imagens na escala atual
3.3.5  Service Worker otimizado:
       - Estratégia stale-while-revalidate para assets estáticos
       - Network-first para dados de competição ativa
       - Cache de API responses para modo offline
```

### 3.4 Observabilidade e monitoramento

```
3.4.1  ✅ Sentry integrado (@sentry/react, habilitado apenas em produção)
3.4.2  Métricas de performance (já tem @vercel/analytics e speed-insights)
       - Definir budgets: LCP < 2.5s, INP < 200ms, CLS < 0.1
       - Dashboard de Web Vitals por rota
3.4.3  ✅ Logs estruturados nas API routes
       - logger.js (JSON) + withLogger.js (wrapper com requestId + timing)
       - Aplicado em 14 routes (11 internas + 3 v1 via wrapHandler)
3.4.4  ✅ Health check endpoint (api/health.js) + UptimeRobot configurado
```

### 3.5 Segurança avançada

```
3.5.1  ✅ Rate limiting nas API routes (in-memory sliding window por IP+endpoint)
3.5.2  CSRF protection para mutações
3.5.3  Audit log server-side (complementar ao historicoAcoes no cliente)
3.5.4  Backup automatizado do PostgreSQL (além do backup Firestore existente)
3.5.5  Política de retenção de dados conforme LGPD
       - Endpoint de exportação de dados pessoais (direito de portabilidade)
       - Endpoint de exclusão de dados (direito ao esquecimento)
3.5.6  Penetration testing antes do lançamento nacional
```

### Entregáveis da Fase 3

- [x] API pública v1 documentada e com rate limiting (3 endpoints: resultados, atletas, ranking)
- [x] Code splitting: bundle principal de 1269KB → 246KB (-80%), manualChunks para Firebase/React
- [x] Sentry integrado (@sentry/react, habilitado em produção)
- [x] Health check monitorado (api/health.js + UptimeRobot)
- [ ] Modelo federação + confederação: recordes por escopo, ranking por UF, papel CBAt
- [ ] Web Vitals dentro dos budgets (LCP < 2.5s, INP < 200ms)
- [ ] Endpoints LGPD (exportação e exclusão de dados)

---

## Roadmap de execução (itens pendentes, em ordem)

> Atualizado em 2026-05-01. Ordem baseada em: dependências técnicas → impacto no produto → risco.

### Bloco 1 — Qualidade interna (pré-requisito para tudo)

| # | Item | Origem | Esforço | Status |
|---|---|---|---|---|
| 1 | **Decomposição do App.jsx** (803 linhas, -58%) | 2.3 | 2-3 dias | ✅ 19 hooks + 1 componente extraídos |
| 2 | **Logs estruturados nas API routes** | 3.4.3 | 1 dia | ✅ logger.js + withLogger.js em 14 routes |
| 3 | **Rate limiting nas API routes** | 3.5.1 | 1 dia | ✅ In-memory por IP+endpoint, integrado no withLogger |

### Bloco 2 — Modelo Federação + Confederação (feature principal)

| # | Item | Origem | Esforço | Dependências |
|---|---|---|---|---|
| 4 | **Recordes por escopo** (federação → estadual, confederação → nacional) | 3.1.1 | 3-5 dias | Rate limiting ✅ |
| 5 | **Ranking por UF** — federação gerencia, confederação visualiza | 3.1.2 | 3-5 dias | Recordes (4) |
| 6 | **Confederação (CBAt)** — modelo a definir (papel interno / API / híbrido) | 3.1.3 | 2-3 dias | Recordes (4) |
| 7 | **Renomear organizador → federação** na UI | 3.1.5 | 1 dia | Confederação (6) |
| 8 | **Subdomínios por federação** (opcional) | 3.1.4 | 1 dia | DNS Vercel, zero código |

### Bloco 3 — Compliance e segurança

| # | Item | Origem | Esforço | Por quê nesta ordem |
|---|---|---|---|---|
| 9 | **Endpoints LGPD** (exportação + exclusão de dados) | 3.5.5 | 2-3 dias | Obrigação legal antes do lançamento nacional |
| 10 | **CSRF protection** para mutações | 3.5.2 | 1 dia | Segurança básica |
| 11 | **Audit log server-side** | 3.5.3 | 2 dias | Complementa historicoAcoes do cliente |
| 12 | **Backup automatizado PostgreSQL** | 3.5.4 | 0.5 dia | Config no Supabase |

### Bloco 4 — Performance e integrações

| # | Item | Origem | Esforço | Dependências |
|---|---|---|---|---|
| 13 | **Web Vitals budgets** (LCP < 2.5s, INP < 200ms) | 3.4.2 | 2 dias | Medir, definir budgets, otimizar rotas críticas |
| 14 | **Service Worker otimizado** | 3.3.5 | 2 dias | stale-while-revalidate para assets, network-first para dados |
| 15 | **Integrações externas** (World Athletics, webhooks) | 3.2 | 5-10 dias | API pública já existe; depende de especificações externas |
| 16 | **Penetration testing** | 3.5.6 | Externo | Antes do lançamento nacional |

### Adiados (sem prazo definido)

| Item | Motivo |
|---|---|
| SSR nativo (2.4) | Open Graph resolve SEO para crawlers. SSR real só se necessário para performance |

---

## Diagrama de migração de dados

```
                    FASE 1                    FASE 2                    FASE 3
                    ┌─────┐                   ┌─────┐                   ┌─────┐
                    │     │                   │     │                   │     │
  Browser ◄─────►  │ Firestore              │ Firestore              │ Firestore
  (SPA+PWA)        │ (tudo)         ──►      │ (real-time)    ──►     │ (real-time)
                    │     │                   │     │                   │     │
                    └─────┘                   └──┬──┘                   └──┬──┘
                        │                        │                         │
                   Vercel Functions          Cloud Function             Cloud Function
                   (ranking, recordes)      (consolidação)             (consolidação)
                        │                        │                         │
                        ▼                        ▼                         ▼
                                             PostgreSQL                PostgreSQL
                                             (histórico,              (histórico,
                                              rankings)                rankings)
                                                                          │
                                                                     API Pública v1
                                                                     (federações,
                                                                      WA, CBAt)
```

## Princípios de migração

1. **Nunca big-bang** — cada mudança deve ir para produção independentemente
2. **Feature flags** — novas funcionalidades atrás de flags até estabilizar
3. **Fallback offline** — se a API falhar, o cálculo local continua funcionando
4. **Backward compatible** — endpoints novos não quebram clientes antigos
5. **Data integrity first** — migração de dados sempre com validação e rollback
6. **Manter PWA** — o suporte offline é diferencial competitivo, nunca sacrificá-lo

## Dependências entre tarefas

```
1.1 (Testes) ──────────────────────────────────────► 2.3 (Decomposição App.jsx)
1.2 (API mínima) ─────────────────────► 2.2 (Expansão API) ──► 3.2 (Integrações)
1.3 (Open Graph) ──────────────────────► 2.4 (SSR real)
                                         2.1 (PostgreSQL) ────► 3.1 (Multi-tenancy)
                                                               3.3 (Performance)
                                                               3.4 (Observabilidade)
                                                               3.5 (Segurança)
```

## Custo estimado de infraestrutura (escala nacional)

| Serviço | Fase 1 | Fase 2 | Fase 3 |
|---|---|---|---|
| Vercel (Pro) | $20/mês | $20/mês | $20/mês |
| Firebase (Blaze) | ~$50/mês | ~$30/mês* | ~$20/mês* |
| PostgreSQL (Supabase Pro) | — | $25/mês | $25/mês |
| Sentry (Team) | — | — | $26/mês |
| **Total estimado** | **~$70/mês** | **~$75/mês** | **~$91/mês** |

*\* Firebase reduz conforme mais queries migram para PostgreSQL*

> Valores em USD, referência abril/2026. Podem variar com volume de uso.
