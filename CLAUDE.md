# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GERENTRACK is a track & field (atletismo) competition management web application. It handles event creation, athlete/team registration, result entry, scoring, records, dashboards, medal delivery, and roll call (câmara de chamada). The entire domain uses Portuguese naming conventions.

## Tech Stack

- **React 18** with **Vite 5** (ES modules, JSX)
- **React Router DOM v7** — roteamento declarativo com URLs limpas (migração incremental do sistema baseado em estado)
- **Firebase**: Firestore (database), Authentication (email/password), Storage (logos)
- **DOMPurify** for XSS prevention
- **ExcelJS** for XLSX export with embedded images
- **qrcode** for QR code generation (client-side)
- **html5-qrcode** for QR code scanning via camera
- **@imgly/background-removal** for client-side image background removal
- **Deployed on**: Vercel (frontend) + Firebase (backend)

## Commands

```bash
npm run dev      # Vite dev server with hot reload
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

No test framework is configured.

## Architecture

### Entry Flow

`index.html` → `src/main.jsx` → `src/App.jsx` (main orchestrator, ~2100 lines, manages state coordination and renderiza telas)

### Routing & Contexts

O app está em **migração incremental** do sistema de routing baseado em estado (`tela`/`setTela`) para **React Router DOM v7**:

- **`src/router/`** — Definição centralizada de rotas:
  - `routes.jsx` — Mapeamento `ROUTES` (path → URL), `TELA_TO_PATH` (tela → path), `buildPath()`, `telaToPath()`
  - `ProtectedRoute.jsx` — Guarda de autenticação
  - `EventoRoute.jsx` — Guarda de competição selecionada
  - `useRouterBridge.js` — Bridge entre o sistema legado (`setTela`) e React Router (`navigate`)
- **`src/layouts/`** — Layouts compartilhados:
  - `MainLayout.jsx` — Header + main + footer (telas autenticadas)
  - `EventoLayout.jsx` — Layout de competição (com slug dinâmico)
  - `PublicLayout.jsx` — Layout para páginas públicas
- **`src/contexts/`** — React Contexts extraídos do App.jsx para reduzir prop drilling:
  - `AppContext.jsx` (`useApp()`) — navegação, notificações, auditoria, branding, organizadores, funcionários, treinadores, solicitações
  - `AuthContext.jsx` (`useAuth()`) — usuarioLogado, login, logout, perfis, senhas
  - `EventoContext.jsx` (`useEvento()`) — eventos, inscrições, resultados, atletas, equipes, recordes, ranking

**NOTA**: O sistema `tela`/`setTela` coexiste com React Router via `useRouterBridge`. **TODAS as telas DEVEM ter rota registrada** — ao criar uma tela nova:
1. Adicionar path em `ROUTES` e `TELA_TO_PATH` em `routes.jsx`
2. Adicionar resolução URL→tela em `resolverPathParaTela()` do `useRouterBridge.js`
3. Adicionar resolução tela→URL no `staticMap` do `buildUrlForTela()` do `useRouterBridge.js`
4. **NUNCA** criar tela que funcione apenas via `setTela` sem rota — todas as telas devem ter URL acessível diretamente pelo browser.

### Source Structure

- **`src/domain/`** — Athletics domain definitions: event types (`provas/provasDef.json`), combined events, relay helpers
- **`src/router/`** — React Router routes, guards, and bridge (ver seção acima)
- **`src/contexts/`** — React Contexts: AppContext, AuthContext, EventoContext
- **`src/layouts/`** — Layout components: MainLayout, EventoLayout, PublicLayout
- **`src/features/`** — Feature modules organized by domain area:
  - `auth`, `eventos`, `inscricoes`, `resultados`, `recordes`, `paineis`, `admin`, `gestao`, `digitar`, `impressao`, `secretaria`
  - `cadastros` — Telas de cadastro público (atleta, equipe, organizador)
  - `configuracoes` — Configurações de pontuação de equipes
  - `layout` — Header.jsx
  - `organizadores` — Perfil do organizador
  - `ranking` — Sistema de ranking
  - `sumulas` — Geração de súmulas
  - `ui` — Componentes de UI reutilizáveis (ConfirmModal, FormField, BannerInstalar, AtualizacaoDisponivel)
  - `utilidades` — Auditoria, FinishLynx (import/export), gestão de inscrições, gerenciamento de membros
- **`src/hooks/`** — Custom hooks:
  - Firestore-backed CRUD: `useEventos`, `useInscricoes`, `useResultados`, `useAtletas`, `useEquipes`, `useMedalhasChamada`
  - UI/PWA: `useInstallPrompt`, `useOfflineStatus`, `useResponsivo`, `useStylesResponsivos`
- **`src/lib/`** — Reusable infrastructure: dual-persistence storage (`useLocalStorage` with Firestore sync), Firestore sanitization, XSS prevention, pagination, data migration
- **`src/shared/`** — Shared business logic and constants:
  - **`engines/`** — Core computation: `seriacaoEngine`, `teamScoringEngine`, `combinedScoringEngine`, `combinedEventEngine`, `recordDetectionEngine`, `rankingExtractionEngine`, `inscricaoEngine`, `lynxImportEngine`, `lynxExportEngine`, `recordHelper`
  - **`constants/`** — Age categories (Sub-14 through Adulto), race phases (Eliminatória, Semifinal, Final)
  - **`formatters/`** — Time, distance, and name formatting utilities
  - **`athletics/`** — Athletics-specific constants and event definitions
  - **`qrcode/`** — QR code generation (`gerarQrCode.js`), scanner component (`QrScanner.jsx`), sound feedback (`scannerSons.js`)
  - **`TemaContext.jsx`** + **`tema.js`** — Theme system (dark/light mode) with centralized tokens
  - **`branding.js`** — Constantes de branding (GT_DEFAULT_ICON, GT_DEFAULT_LOGO)
  - **`CortarImagem.jsx`** — Componente de recorte/remoção de fundo de imagem

### Theme System

- `tema.js` define dois temas: `temaDark` e `temaLight` com tokens de cor (bg, text, accent, status, borders, shadows)
- `TemaContext.jsx` provê `useTema()` hook — TODOS os componentes usam tokens do tema, não cores hardcoded
- Cada arquivo de feature tem `getStyles(t)` que recebe o tema e retorna estilos
- **NUNCA usar cores hex hardcoded** em estilos JSX — sempre usar `t.accent`, `t.bgCard`, `t.textPrimary`, etc.
- Exceções: cores de gênero (`#1a6ef5` masc, `#e54f9b` fem), cores de medalha metálica (`#C0C0C0` prata, `#CD7F32` bronze), strings HTML de impressão

### QR Code System

- **Dual QR**: público (URL resultados) + secretaria (JSON inline para uso offline)
- QR público: `https://gerentrack.com.br/competicao/{slug}/resultados` — mesmo para todos os atletas
- QR secretaria: `{"t":"sec","e":"eventoId","a":"atletaId","n":numPeito}` — individual por atleta
- Error correction level **H** (30% — máxima resistência para bibs de atleta)
- `parsearQrSecretaria()` faz parse e validação do QR
- Scanner usa `onScanRef` (useRef) para evitar stale closures no callback da câmera
- Exportação XLSX via ExcelJS com imagens QR embutidas

### Câmara de Chamada (Roll Call)

- Dois botões independentes: **Confirmado** e **DNS** (substituiu o ciclo ausente→presente→confirmado)
- Estados: `null` (sem marcação), `"confirmado"`, `"dns"`
- `getPresenca()` retorna `null` para valores legados ("ausente", "presente") — retrocompatibilidade
- `getPresencaProva()` sanitiza valores legados antes de retornar
- Badges "Conf." / "DNS" exibidos nas súmulas e na tela digitar resultados via `ChamadaBadge`
- Scanner QR na secretaria: confirma atleta na prova selecionada no filtro

### Medal System

- 3 modos configuráveis em TelaCadastroEvento (step 2, acordeão "Modo de Medalhas"):
  - `classificacao_participacao` — 1º/2º/3º + participação para demais
  - `apenas_participacao` — todos recebem participação
  - `apenas_classificacao` — apenas 1º/2º/3º recebem medalha
- Campo `modoMedalhas` no evento, retrocompatível com `medalhasApenasParticipacao` boolean
- Revezamento: 1 resultado da equipe → N medalhas individuais (expandido para cada atleta)
- `atletaSomenteDns()` — DNS em todas as provas = não recebe medalha; DQ/NM/DNF = recebe
- Scanner QR na aba Medalhas: escaneia atleta, mostra cards por prova com "Entregar" / "Entregar todas"
- Bloqueios: DNS total, limite de participação, classificação bloqueia participação, provas pendentes
- Modal de medalha recalcula automaticamente via `useEffect` quando `medalhas` muda (Firestore)

### FinishLynx Integration

- **Import** (`lynxImportEngine.js`): importa resultados de arquivos `.lif` (FinishLynx Image Format) — parser retorna tempos em milissegundos
- **Export** (`lynxExportEngine.js`): exporta dados de competição para formato compatível com FinishLynx
- Telas: `TelaFinishLynx.jsx` (import), `TelaExportLynx.jsx` (export) em `src/features/utilidades/`

### PWA & Offline

- `useInstallPrompt` — captura o evento `beforeinstallprompt` para prompt de instalação PWA
- `useOfflineStatus` — monitora status online/offline do navegador
- `BannerInstalar.jsx` e `AtualizacaoDisponivel.jsx` — UI para instalação e atualização do PWA
- `useResponsivo` / `useStylesResponsivos` — hooks para layout responsivo

### Firebase Auth

- `auth` (primário) — sessão do usuário logado
- `secondaryAuth` (secundário) — criar contas sem deslogar o usuário atual (admin/organizador criando funcionários, treinadores, equipes)
- **SEMPRE usar `secondaryAuth`** para `createUserWithEmailAndPassword` quando outro usuário já está logado
- Após criar conta com `secondaryAuth`, chamar `firebaseSignOut(secondaryAuth)`

### Data Persistence

Dual-persistence model: data is stored in both **IndexedDB/localStorage** (offline/fast) and **Firestore** (cloud sync).

- **Coleções Firestore** (atletas, equipes, inscrições, resultados, eventos): cache offline via **IndexedDB** (`src/lib/cacheDB.js`). Sem limite de 5MB, suporta 30k+ atletas. Os hooks (`useAtletas`, `useEquipes`, `useInscricoes`, `useResultados`, `useEventos`) hidratam do IndexedDB no startup e atualizam via `onSnapshot`.
- **Dados de estado do app** (ranking, recordes, notificações, branding, etc.): permanecem em **localStorage** via `useLocalStorage` (`src/lib/storage/`).
- **Chamada e medalhas**: permanecem em **localStorage** via `useMedalhasChamada`.

### Notificações

- Notificações lidas expiram após **48h** (campo `lidaEm`)
- Notificações não lidas expiram após **168h** (7 dias, campo `data`)
- Limpeza automática no carregamento do app via `useEffect`

### Key Domain Concepts

- **Evento** — A competition/meet
- **Prova** — An individual event (100m, salto em altura, etc.), defined in `provasDef.json`
- **Inscrição** — Athlete registration for an event
- **Resultado** — Result/performance for an athlete in an event
- **Categoria** — Age group (Sub-14, Sub-16, Sub-18, Sub-20, Sub-23, Adulto)
- **Fase** — Competition phase (Eliminatória, Semifinal, Final)
- **Seriação** — Heat/series assignment for track events
- **Equipe** — Team
- **Atleta** — Athlete
- **Chamada** — Roll call status per athlete per event (`confirmado` / `dns` / `null`)
- **Medalha** — Medal delivery tracking per athlete per event

### Firebase Configuration

Environment variables are prefixed with `VITE_FIREBASE_*` and loaded via `.env`. Firebase is initialized in `src/firebase.js` with duas instâncias: `app` (principal) e `secondaryApp` (criação de contas). Project ID: `gerentrack-b88b5`.

## Regras críticas de desenvolvimento

- **CSS inline apenas** — NUNCA importar estilos externos
- **NUNCA usar `width: 100%` em btnPrimary**
- **Imports case-sensitive** — Vercel roda Linux; usar caminho exato (ex: `../../shared/constants/categorias` e não `../../shared/athletics/constants`)
- **useLocalStorage** = sincroniza com Firestore (cross-device) | **useLocalOnly** = apenas dispositivo — nunca trocar um pelo outro sem intenção deliberada e consciência do impacto
- **App.jsx tem ~2100 linhas** e é o orquestrador central — mudanças aqui têm impacto global, requer atenção redobrada
- **Cores do tema** — NUNCA usar hex hardcoded em JSX. Usar tokens: `t.accent`, `t.bgCard`, `t.textPrimary`, `t.success`, `t.danger`, etc. Exceções: cores de impressão (HTML strings), cores de gênero, cores metálicas de medalha
- **Variable shadowing** — NUNCA usar `t` como parâmetro de callback (`.map(t =>`, `.find(t =>`) — conflita com o tema `t` de `useTema()`. Usar nomes descritivos: `eq`, `tr`, `v`, `item`
- **secondaryAuth** — SEMPRE usar para `createUserWithEmailAndPassword` quando criando conta para outro usuário (funcionário, treinador, equipe via admin)
- **Filtro de provas na secretaria** — filtra por `prova.nome` (não `prova.id`), pois provas com variantes F_ têm IDs diferentes mas mesmo nome
- **Contexts vs props** — features novas devem consumir dados via `useApp()`, `useAuth()`, `useEvento()` em vez de receber props diretamente do App.jsx. Os contexts são construídos via `buildAppValue()`, `buildAuthValue()`, `buildEventoValue()`
- **Rotas novas** — ao criar telas novas, OBRIGATÓRIO registrar em 3 lugares: (1) `routes.jsx` (ROUTES + TELA_TO_PATH), (2) `useRouterBridge.js` em `resolverPathParaTela()`, (3) `useRouterBridge.js` em `buildUrlForTela()` staticMap. NUNCA criar tela sem rota — toda tela deve ter URL acessível diretamente pelo browser

## Regras de dados e segurança

- `historicoAcoes` tem limite de 500 registros — nunca remover esse cap
- NUNCA armazenar campo `senha` em localStorage — migrations legadas já removeram esses dados
- Toda entrada de usuário passa por DOMPurify antes de renderizar — nunca renderizar HTML cru de dados do Firestore sem sanitização
- Ações via QR scan registram `{ metodo: "qr", modulo: "secretaria" }` no historicoAcoes

## Domínio do atletismo

- **Sub-14** = atletas com `anoNasc` entre `anoBase - 13` e `anoBase - 12` (definido em `src/shared/constants/categorias.js`) — não alterar sem entender essa lógica
- Provas mistas usam flag `misto: true`; variantes `F_` duplicadas são ocultadas via `oculto: true`
- Slugs de competição: nome do evento como base, cidade como fallback de colisão — sem sufixo de ano
- **Revezamento**: resultado armazenado por `equipeId`, expandido para atletas individuais na entrega de medalhas
- **DNS** = Did Not Start (não participou) · **DQ** = Desqualificado · **NM** = No Mark · **DNF** = Did Not Finish — DNS em todas as provas bloqueia medalha de participação; DQ/NM/DNF contam como participação

## Deploy e Git

- **git push é sempre manual** — nunca executar push automaticamente
- Push para `main` dispara deploy automático na Vercel — nunca commitar código quebrado
- Rodar `npm run build` localmente antes de commitar mudanças estruturais
- GitHub: `github.com/gerentrack/gerentrack` | Domínio: `gerentrack.com.br`
- Firebase project: `gerentrack-b88b5` · Firestore: `southamerica-east1` (São Paulo) · Storage bucket: `gerentrack-b88b5.firebasestorage.app`
- Backup Firestore: diário com retenção de 30 dias + recuperação pontual (7 dias)

## Dívida técnica pendente

- Firebase Auth migration necessária em: `TelaConfiguracoes` (validação senha não-admin), `TelaGerenciarEquipes` (criação sem Auth), `TelaGerenciarUsuarios` (criação sem Auth), `TelaTreinadores` (handleLoginExistente usa plaintext)
- Script de migração em massa para contas legadas (equipes importadas sem conta Auth)
- Troca de email no Gerenciar Usuários não reflete no Firebase Auth
- Sistema de chamados com severidade e SLA (cláusulas G.3, G.4, G.5) — abertura pelo org, gestão pelo admin, timer de SLA
- Notificação de incidente LGPD por email automático (cláusula I.3(iii)) — atualmente manual via aba Incidente no admin
- Monitoramento de disponibilidade: UptimeRobot configurado em uptimerobot.com para controle interno de SLA (G.2) — acesso restrito ao admin
