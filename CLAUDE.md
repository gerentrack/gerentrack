# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GERENTRACK is a track & field (atletismo) competition management web application. It handles event creation, athlete/team registration, result entry, scoring, records, and dashboards. The entire domain uses Portuguese naming conventions.

## Tech Stack

- **React 18** with **Vite 5** (ES modules, JSX)
- **Firebase**: Firestore (database), Authentication (email/password), Storage (logos)
- **DOMPurify** for XSS prevention
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
- **`src/features/`** — Feature modules organized by domain area (auth, eventos, inscricoes, resultados, recordes, paineis, admin, gestao, digitar, impressao, etc.)
- **`src/hooks/`** — Custom hooks for Firestore-backed CRUD: `useEventos`, `useInscricoes`, `useResultados`, `useAtletas`, `useEquipes`, `useMedalhasChamada`
- **`src/lib/`** — Reusable infrastructure: dual-persistence storage (`useLocalStorage` with Firestore sync), Firestore sanitization, XSS prevention, pagination, data migration
- **`src/shared/`** — Shared business logic and constants:
  - **`engines/`** — Core computation: `seriacaoEngine` (heat/lane assignment), `teamScoringEngine`, `combinedScoringEngine`, `recordDetectionEngine`, `inscricaoEngine`
  - **`constants/`** — Age categories (Sub-14 through Adulto), race phases (Eliminatória, Semifinal, Final)
  - **`formatters/`** — Time, distance, and name formatting utilities
  - **`athletics/`** — Athletics-specific constants and event definitions

### Data Persistence

Dual-persistence model: data is stored in both **localStorage** (offline/fast) and **Firestore** (cloud sync). The `src/lib/storage/` layer manages this with `useLocalStorage` and `useStorageSync`.

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

### Firebase Configuration

Environment variables are prefixed with `VITE_FIREBASE_*` and loaded via `.env`. Firebase is initialized in `src/firebase.js`. Project ID: `gerentrack-b88b5`.

## Regras críticas de desenvolvimento

- **CSS inline apenas** — NUNCA importar estilos externos
- **NUNCA usar `width: 100%` em btnPrimary**
- **Imports case-sensitive** — Vercel roda Linux; usar caminho exato (ex: `../../shared/constants/categorias` e não `../../shared/athletics/constants`)
- **useLocalStorage** = sincroniza com Firestore (cross-device) | **useLocalOnly** = apenas dispositivo — nunca trocar um pelo outro sem intenção deliberada e consciência do impacto
- **App.jsx tem ~1700 linhas** e é o orquestrador central — mudanças aqui têm impacto global, requer atenção redobrada

## Regras de dados e segurança

- `historicoAcoes` tem limite de 500 registros — nunca remover esse cap
- NUNCA armazenar campo `senha` em localStorage — migrations legadas já removeram esses dados
- Toda entrada de usuário passa por DOMPurify antes de renderizar — nunca renderizar HTML cru de dados do Firestore sem sanitização

## Domínio do atletismo

- **Sub-14** = atletas com `anoNasc` entre `anoBase - 13` e `anoBase - 12` (definido em `src/shared/constants/categorias.js`) — não alterar sem entender essa lógica
- Provas mistas usam flag `misto: true`; variantes `F_` duplicadas são ocultadas via `oculto: true`
- Slugs de competição: nome do evento como base, cidade como fallback de colisão — sem sufixo de ano

## Deploy e Git

- Push para `main` dispara deploy automático na Vercel — nunca commitar código quebrado
- Rodar `npm run build` localmente antes de commitar mudanças estruturais
- GitHub: `github.com/gerentrack/gerentrack` | Domínio: `gerentrack.com.br`
- Firebase project: `gerentrack-b88b5` · Storage bucket: `gerentrack-b88b5.firebasestorage.app` (US-Central1)

## Dívida técnica pendente

Firebase Auth migration ainda necessária em: `TelaTrocarSenha`, `TelaTreinadores`, `TelaGerenciarUsuarios`, `TelaConfiguracoes` (usuários não-admin), `TelaGerenciarEquipes`
