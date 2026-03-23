# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GERENTRACK is a track & field (atletismo) competition management web application. It handles event creation, athlete/team registration, result entry, scoring, records, dashboards, medal delivery, and roll call (câmara de chamada). The entire domain uses Portuguese naming conventions.

## Tech Stack

- **React 18** with **Vite 5** (ES modules, JSX)
- **Firebase**: Firestore (database), Authentication (email/password), Storage (logos)
- **DOMPurify** for XSS prevention
- **ExcelJS** for XLSX export with embedded images
- **qrcode** for QR code generation (client-side)
- **html5-qrcode** for QR code scanning via camera
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

`index.html` → `src/main.jsx` → `src/App.jsx` (main orchestrator, ~1700 lines, manages all routing/navigation and state coordination)

### Source Structure

- **`src/domain/`** — Athletics domain definitions: event types (`provas/provasDef.json`), combined events, relay helpers
- **`src/features/`** — Feature modules organized by domain area (auth, eventos, inscricoes, resultados, recordes, paineis, admin, gestao, digitar, impressao, secretaria, etc.)
- **`src/hooks/`** — Custom hooks for Firestore-backed CRUD: `useEventos`, `useInscricoes`, `useResultados`, `useAtletas`, `useEquipes`, `useMedalhasChamada`
- **`src/lib/`** — Reusable infrastructure: dual-persistence storage (`useLocalStorage` with Firestore sync), Firestore sanitization, XSS prevention, pagination, data migration
- **`src/shared/`** — Shared business logic and constants:
  - **`engines/`** — Core computation: `seriacaoEngine`, `teamScoringEngine`, `combinedScoringEngine`, `recordDetectionEngine`, `inscricaoEngine`
  - **`constants/`** — Age categories (Sub-14 through Adulto), race phases (Eliminatória, Semifinal, Final)
  - **`formatters/`** — Time, distance, and name formatting utilities
  - **`athletics/`** — Athletics-specific constants and event definitions
  - **`qrcode/`** — QR code generation (`gerarQrCode.js`), scanner component (`QrScanner.jsx`), sound feedback (`scannerSons.js`)
  - **`TemaContext.jsx`** + **`tema.js`** — Theme system (dark/light mode) with centralized tokens

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

### Firebase Auth

- `auth` (primário) — sessão do usuário logado
- `secondaryAuth` (secundário) — criar contas sem deslogar o usuário atual (admin/organizador criando funcionários, treinadores, equipes)
- **SEMPRE usar `secondaryAuth`** para `createUserWithEmailAndPassword` quando outro usuário já está logado
- Após criar conta com `secondaryAuth`, chamar `firebaseSignOut(secondaryAuth)`

### Data Persistence

Dual-persistence model: data is stored in both **localStorage** (offline/fast) and **Firestore** (cloud sync). The `src/lib/storage/` layer manages this with `useLocalStorage` and `useStorageSync`.

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
- **App.jsx tem ~1700 linhas** e é o orquestrador central — mudanças aqui têm impacto global, requer atenção redobrada
- **Cores do tema** — NUNCA usar hex hardcoded em JSX. Usar tokens: `t.accent`, `t.bgCard`, `t.textPrimary`, `t.success`, `t.danger`, etc. Exceções: cores de impressão (HTML strings), cores de gênero, cores metálicas de medalha
- **Variable shadowing** — NUNCA usar `t` como parâmetro de callback (`.map(t =>`, `.find(t =>`) — conflita com o tema `t` de `useTema()`. Usar nomes descritivos: `eq`, `tr`, `v`, `item`
- **secondaryAuth** — SEMPRE usar para `createUserWithEmailAndPassword` quando criando conta para outro usuário (funcionário, treinador, equipe via admin)
- **Filtro de provas na secretaria** — filtra por `prova.nome` (não `prova.id`), pois provas com variantes F_ têm IDs diferentes mas mesmo nome

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
- Firebase project: `gerentrack-b88b5` · Storage bucket: `gerentrack-b88b5.firebasestorage.app` (US-Central1)

## Dívida técnica pendente

- Firebase Auth migration necessária em: `TelaConfiguracoes` (validação senha não-admin), `TelaGerenciarEquipes` (criação sem Auth), `TelaGerenciarUsuarios` (criação sem Auth), `TelaTreinadores` (handleLoginExistente usa plaintext)
- Script de migração em massa para contas legadas (equipes importadas sem conta Auth)
- Troca de email no Gerenciar Usuários não reflete no Firebase Auth
