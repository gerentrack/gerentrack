# PROMPT DE CONTEXTO — GERENTRACK

Cole este texto no início de qualquer nova conversa com uma IA para retomar o desenvolvimento do GerenTrack.

---

## CONTEXTO DO PROJETO

Estou desenvolvendo o **GerenTrack**, uma plataforma web para gestão de competições de atletismo.

**Stack:** React 18 + Firebase (Auth + Firestore) + Vite. CSS-in-JS (estilos inline). Sem router externo — navegação por estado (`tela`).

---

## ESTRUTURA DE ARQUIVOS

```
src/
├── App.jsx                          ← Componente raiz (~1.442 linhas)
├── firebase.js                      ← Config Firebase
├── useAtletas.js / useEquipes.js / useInscricoes.js / useResultados.js
│
├── shared/
│   ├── athletics/
│   │   ├── provasDef.js             ← todasAsProvas, getComposicaoCombinada
│   │   └── constants.js             ← CATEGORIAS, getCategoria, getPermissividade, ESTADOS_BR
│   ├── constants/
│   │   ├── fases.js                 ← getFasesProva, buscarSeriacao, serKey, resKey, FASE_NOME, FASE_ORDEM
│   │   └── categorias.js            ← definições de categoria
│   ├── engines/
│   │   ├── combinedEventEngine.js   ← CombinedEventEngine
│   │   ├── combinedScoringEngine.js ← CombinedScoringEngine, temDuasCronometragens
│   │   ├── recordHelper.js          ← RecordHelper
│   │   ├── recordDetectionEngine.js ← RecordDetectionEngine
│   │   ├── seriacaoEngine.js        ← SeriacaoEngine
│   │   └── teamScoringEngine.js     ← TeamScoringEngine
│   ├── formatters/
│   │   └── utils.jsx                ← _getClubeAtleta, _getNascDisplay, _getCbat, _getLocalEventoDisplay,
│   │                                   NomeProvaComImplemento, abreviarProva, formatarMarca,
│   │                                   formatarMarcaExibicao, _marcasComEmpateCentesimal, _marcaParaMs,
│   │                                   formatarTempo, autoFormatTempo, parseTempoPista,
│   │                                   exibirMarcaInput, normalizarMarca, validarCPF, validarCNPJ,
│   │                                   emailJaCadastrado
│   └── branding/
│       └── index.js                 ← GT_DEFAULT_LOGO, GT_DEFAULT_ICON
│
└── features/
    ├── layout/        Header.jsx, NavBtn.jsx
    ├── auth/          TelaLogin, TelaSelecaoPerfil, TelaRecuperacaoSenha, TelaTrocarSenha, TelaConfiguracoes
    ├── eventos/       TelaHome, TelaCadastroEvento, TelaEventoDetalhe, eventoHelpers.js, eventoStyles.js
    ├── inscricoes/    TelaGerenciarInscricoes, TelaInscricaoAvulsa, TelaInscricaoRevezamento, inscricaoStyles.js
    ├── sumulas/       TelaSumulas
    ├── resultados/    TelaResultados
    ├── recordes/      TelaRecordes
    ├── impressao/     gerarHtmlImpressao.js
    ├── digitar/       TelaDigitarResultados
    ├── configuracoes/ TelaConfigPontuacaoEquipes
    ├── admin/         TelaAdmin, TelaGerenciarUsuarios, TelaGerenciarEquipes
    ├── paineis/       TelaPainel, TelaPainelOrganizador, TelaPainelAtleta, TelaPainelEquipe
    ├── cadastros/     TelaCadastroEquipe, TelaCadastroOrganizador, TelaCadastroAtletaLogin
    ├── gestao/        TelaFuncionarios, TelaTreinadores, TelaCadastrarAtleta, TelaEditarAtleta
    ├── utilidades/    TelaImportarAtletas, TelaNumericaPeito, TelaGestaoInscricoes,
    │                  TelaGerenciarMembros, TelaAuditoria
    └── ui/            FormField, TableHelpers (Th/Td), ProvaSelector, StatCard
```

---

## PERFIS DE USUÁRIO

| Perfil | Painel inicial |
|---|---|
| admin | TelaAdmin |
| organizador | TelaPainelOrganizador |
| funcionario | TelaPainelOrganizador (permissões limitadas) |
| atleta | TelaPainelAtleta |
| equipe | TelaPainel |
| treinador | TelaPainel (permissões limitadas) |

---

## PADRÕES DO CÓDIGO

**Imports comuns:**
```js
import { todasAsProvas } from "../../shared/athletics/provasDef";
import { CATEGORIAS, getCategoria } from "../../shared/athletics/constants";
import { _getClubeAtleta, formatarMarca, validarCPF } from "../../shared/formatters/utils";
import { Th, Td } from "../ui/TableHelpers";
import FormField from "../ui/FormField";
import { StatCard } from "../ui/StatCard";
import inscricaoStyles from "../inscricoes/inscricaoStyles";
const styles = inscricaoStyles;
```

**Navegação:**
```js
// Trocar de tela
setTela("nome-da-tela");

// Telas disponíveis:
// home, login, painel, painel-organizador, painel-atleta, painel-equipe,
// evento-detalhe, novo-evento, inscricao-avulsa, inscricao-revezamento,
// digitar-resultados, sumulas, resultados, recordes, gerenciar-inscricoes,
// gestao-inscricoes, numeracao-peito, config-pontuacao-equipes,
// cadastrar-atleta, editar-atleta, importar-atletas,
// funcionarios, treinadores, gerenciar-membros, auditoria,
// admin, gerenciar-usuarios, gerenciar-equipes,
// cadastro-equipe, cadastro-organizador, cadastro-atleta-login,
// recuperar-senha, trocar-senha, selecionar-perfil, configuracoes
```

**Estado global (App.jsx):**
```js
usuarioLogado      // { id, nome, tipo, email, ... }
eventoAtual        // evento selecionado
eventos[]          // todas as competições
atletas[]          // todos os atletas
equipes[]          // todas as equipes
inscricoes[]       // todas as inscrições
resultados[]       // todos os resultados
recordes[]         // banco de recordes
organizadores[]
funcionarios[]
treinadores[]
numeracaoPeito     // { eventoId: { atletaId: numero } }
```

**Estilo padrão (inscricaoStyles):**
- Fundo escuro: `#0D0E12` (página), `#111318` (cards), `#1A1D2E` (inputs)
- Bordas: `#1E2130`
- Azul primário: `#1976D2`
- Texto: `#E8EAF6` (principal), `#888` (secundário)
- Fonte títulos: `'Barlow Condensed', sans-serif`

---

## MODELO DE DADOS RESUMIDO

```js
// Evento
{ id, nome, data, local, status, provasPrograma[], permissividadeNorma, pontuacaoConfig }

// Atleta
{ id, nome, cpf, dataNasc, sexo, clubeId, anoNasc }

// Inscrição
{ id, atletaId, eventoId, provaId, categoria, sexo, numeroPeito }

// Resultado
{ id, inscricaoId, eventoId, provaId, marca, tempo, vento, status, fase, colocacao }

// Recorde
{ id, provaId, categoria, sexo, tipo, marca, atletaId, data }
```

---

## OBSERVAÇÕES IMPORTANTES

1. **Sem router externo** — navegação por `useState("tela")`
2. **CSS inline** — todos os estilos são objetos JS, nunca classes CSS externas
3. **inscricaoStyles** é o estilo base compartilhado por quase todos os componentes
4. **Firebase Auth** para autenticação; **Firestore** para sincronização de dados entre dispositivos
5. **localStorage** como cache local com hook `useLocalStorage`
6. Componentes recebem todos os dados e funções via props (não usa Context/Redux)
7. **Nunca usar** `localStorage` diretamente — sempre via `useLocalStorage` ou `useLocalOnly`
