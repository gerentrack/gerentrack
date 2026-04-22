# Plano de Evolução do Stack — GERENTRACK

> **Objetivo**: preparar o GERENTRACK para escala nacional, migrando incrementalmente de um SPA Firebase-only para uma arquitetura com backend, banco relacional e SSR — sem interromper o produto em produção.

> **Data de criação**: 2026-04-21
> **Status**: planejado (não iniciado)

---

## Diagnóstico do estado atual

| Aspecto | Hoje | Risco em escala nacional |
|---|---|---|
| Banco de dados | Firestore (único) | Custo explosivo com leituras; queries limitadas |
| Lógica de negócio | 100% no cliente (browser) | Sem controle server-side; bugs exigem deploy frontend |
| Renderização | SPA pura (client-side only) | SEO zero; carregamento lento em 4G |
| Testes | Nenhum | Medo de refatorar; risco de bugs em scoring oficial |
| App.jsx | ~2.600 linhas | Orquestrador monolítico; qualquer mudança tem blast radius alto |
| Integrações | Nenhuma | Impossível sem API própria (CBAt, federações, World Athletics) |

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

## Fase 1 — Fundação (curto prazo)

**Meta**: criar a base de qualidade e a primeira camada de backend sem alterar a experiência do usuário.

**Duração estimada**: 4–6 semanas

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

- [ ] Vitest configurado com 5 suites de teste nos engines críticos
- [ ] 3 Vercel Functions operacionais (ranking, recordes, validação)
- [ ] Meta tags Open Graph nas páginas públicas de resultados
- [ ] Scripts `npm test` e `npm run test:coverage` funcionando

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

- [ ] PostgreSQL operacional com schema relacional
- [ ] Migração de dados históricos do Firestore concluída
- [ ] Consolidação automática pós-competição (Firestore → PostgreSQL)
- [ ] 8+ endpoints de API documentados
- [ ] App.jsx abaixo de 500 linhas
- [ ] SSR nativo em rotas públicas
- [ ] Ranking nacional consultável via SQL

---

## Fase 3 — Escala nacional e integrações (longo prazo)

**Meta**: suportar centenas de competições simultâneas, integrar com federações, e otimizar performance para dispositivos modestos em todo o Brasil.

**Duração estimada**: 12–20 semanas (pode ser faseada internamente)

### 3.1 Multi-tenancy para federações estaduais

**Por quê**: cada federação estadual terá seu espaço, seus organizadores, seus recordes — mas compartilhando a base nacional de atletas.

**Tarefas**:

```
3.1.1  Adicionar tabela federacoes no PostgreSQL:
       - id, nome, sigla, estado (UF), logo_url, configuracoes (JSONB)
3.1.2  Adicionar federacao_id em competicoes, organizadores, recordes
3.1.3  Criar painel de federação (nova role: "federacao_admin")
       - Dashboard com competições da UF
       - Gestão de organizadores credenciados
       - Recordes estaduais
       - Ranking estadual
3.1.4  Implementar Row Level Security por federação
3.1.5  Subdomínios ou paths por federação:
       - fasp.gerentrack.com.br ou gerentrack.com.br/sp
3.1.6  Permitir personalização de branding por federação (logo, cores)
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
3.2.5  Integração com CBAt (quando disponível)
       - Registro nacional de atletas
       - Envio automático de resultados oficiais
```

### 3.3 Performance e code splitting

```
3.3.1  Implementar lazy loading agressivo por rota:
       - React.lazy() para cada feature module
       - Suspense boundaries com fallback de loading
       - Prefetch de rotas prováveis (ex: ao hover no menu)
3.3.2  Analisar bundle com rollup-plugin-visualizer
       - Identificar dependências pesadas (firebase, exceljs, @imgly)
       - Mover para dynamic imports onde possível
3.3.3  Code splitting por role:
       - Admin bundle, Organizador bundle, Público bundle
       - Carregar apenas o código necessário para a role do usuário
3.3.4  Otimizar imagens:
       - CDN dedicado para logos de organizadores/competições (Cloudinary ou Vercel Image)
       - Formatos modernos (WebP/AVIF) com fallback
       - Lazy loading de imagens abaixo do fold
3.3.5  Service Worker otimizado:
       - Estratégia stale-while-revalidate para assets estáticos
       - Network-first para dados de competição ativa
       - Cache de API responses para modo offline
```

### 3.4 Observabilidade e monitoramento

```
3.4.1  Integrar Sentry (ou similar) para error tracking
       - Capturar erros no frontend e nas API routes
       - Source maps para stack traces legíveis
       - Alertas por severidade
3.4.2  Métricas de performance (já tem @vercel/analytics e speed-insights)
       - Definir budgets: LCP < 2.5s, INP < 200ms, CLS < 0.1
       - Dashboard de Web Vitals por rota
3.4.3  Logs estruturados nas API routes
       - Request ID para rastreamento
       - Tempo de resposta por endpoint
       - Erros de Firestore/PostgreSQL
3.4.4  Health check endpoint: api/health.js
       - Verifica conectividade Firestore + PostgreSQL
       - Usado pelo UptimeRobot
```

### 3.5 Segurança avançada

```
3.5.1  Rate limiting nas API routes (via @vercel/edge ou upstash/ratelimit)
3.5.2  CSRF protection para mutações
3.5.3  Audit log server-side (complementar ao historicoAcoes no cliente)
3.5.4  Backup automatizado do PostgreSQL (além do backup Firestore existente)
3.5.5  Política de retenção de dados conforme LGPD
       - Endpoint de exportação de dados pessoais (direito de portabilidade)
       - Endpoint de exclusão de dados (direito ao esquecimento)
3.5.6  Penetration testing antes do lançamento nacional
```

### Entregáveis da Fase 3

- [ ] Multi-tenancy por federação estadual operacional
- [ ] API pública v1 documentada e com rate limiting
- [ ] Bundle splitting por role (redução de 40%+ no bundle inicial)
- [ ] Sentry integrado com alertas
- [ ] Web Vitals dentro dos budgets (LCP < 2.5s, INP < 200ms)
- [ ] Endpoints LGPD (exportação e exclusão de dados)
- [ ] Health check monitorado

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
