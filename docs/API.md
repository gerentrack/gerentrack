# API Pública GERENTRACK v1

API read-only para consulta de resultados, atletas e ranking de atletismo.

**Base URL:** `https://gerentrack.com.br/api/v1`

---

## Autenticação

Todas as requisições exigem uma API key via header:

```
X-API-Key: gt_sua_chave_aqui
```

Para solicitar uma chave, entre em contato com o administrador.

---

## Rate Limiting

- **100 requisições/minuto** por chave (configurável)
- Headers de resposta:
  - `X-RateLimit-Limit` — limite total
  - `X-RateLimit-Remaining` — requisições restantes
  - `X-RateLimit-Reset` — timestamp Unix do reset
- Código `429` quando excedido, com header `Retry-After: 60`

---

## Paginação

Todos os endpoints suportam paginação:

| Parâmetro | Default | Máximo | Descrição |
|---|---|---|---|
| `page` | 1 | — | Número da página |
| `per_page` | 20 | 100 | Itens por página |

Resposta inclui objeto `paginacao`:

```json
{
  "dados": [...],
  "paginacao": {
    "pagina": 1,
    "por_pagina": 20,
    "total": 142,
    "total_paginas": 8
  }
}
```

---

## Endpoints

### GET /api/v1/resultados

Consulta resultados consolidados de competições finalizadas.

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `competicao_id` | string | Não | ID da competição |
| `competicao_slug` | string | Não | Slug da competição |
| `prova_id` | string | Não | ID da prova (ex: `100m`) |
| `categoria_id` | string | Não | Categoria (ex: `Sub-16`) |
| `sexo` | string | Não | `M` ou `F` |
| `atleta_id` | string | Não | ID do atleta |
| `fase` | string | Não | `Eliminatória`, `Semifinal`, `Final` |

**Exemplo:**

```
GET /api/v1/resultados?competicao_slug=campeonato-mineiro-2026&prova_id=100m&sexo=M
```

**Resposta:**

```json
{
  "dados": [
    {
      "id": "abc123",
      "competicao_id": "evt_001",
      "atleta_id": "atl_001",
      "prova_id": "100m",
      "prova_nome": "100 metros rasos",
      "categoria_id": "Adulto",
      "sexo": "M",
      "fase": "Final",
      "marca": "10.45",
      "marca_num": 10.45,
      "posicao": 1,
      "vento": "+1.2",
      "status": null,
      "equipe_id": "eq_001",
      "equipe_nome": "Clube Atlético",
      "pontos_equipe": 8
    }
  ],
  "paginacao": { "pagina": 1, "por_pagina": 20, "total": 8, "total_paginas": 1 }
}
```

---

### GET /api/v1/atletas

Busca atletas no banco consolidado. CPF é mascarado conforme LGPD.

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `q` | string | Não* | Busca por nome (mínimo 3 caracteres) |
| `cbat` | string | Não* | Busca por registro CBAt |
| `equipe_id` | string | Não* | Filtrar por equipe |
| `sexo` | string | Não | `M` ou `F` |

*Ao menos um filtro é obrigatório: `q`, `cbat` ou `equipe_id`.

**Exemplo:**

```
GET /api/v1/atletas?q=silva&sexo=F&per_page=10
```

**Resposta:**

```json
{
  "dados": [
    {
      "id": "atl_001",
      "nome": "Maria Silva",
      "sexo": "F",
      "ano_nasc": 2005,
      "cpf_masked": "***.***.**34",
      "cbat": "78249",
      "equipe_id": "eq_001",
      "clube": "Clube Atlético",
      "equipe_nome": "Clube Atlético Mineiro",
      "equipe_sigla": "CAM"
    }
  ],
  "paginacao": { "pagina": 1, "por_pagina": 10, "total": 1, "total_paginas": 1 }
}
```

---

### GET /api/v1/ranking

Ranking por prova, categoria e sexo.

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `prova_id` | string | Sim | ID da prova (ex: `100m`) |
| `categoria_id` | string | Sim | Categoria (ex: `Sub-16`) |
| `sexo` | string | Sim | `M` ou `F` |
| `temporada` | string | Não | Ano (ex: `2026`) |
| `uf` | string | Não | Estado (ex: `MG`) |

**Exemplo:**

```
GET /api/v1/ranking?prova_id=100m&categoria_id=Adulto&sexo=M&temporada=2026
```

**Resposta:**

```json
{
  "dados": [
    {
      "id": "rnk_001",
      "competicao_id": "evt_001",
      "evento_nome": "Campeonato Mineiro 2026",
      "evento_data": "2026-03-15",
      "evento_uf": "MG",
      "prova_id": "100m",
      "prova_nome": "100 metros rasos",
      "atleta_id": "atl_001",
      "atleta_nome": "João Santos",
      "atleta_cbat": "12345",
      "atleta_clube": "Clube Atlético",
      "categoria_id": "Adulto",
      "sexo": "M",
      "marca": "10.45",
      "marca_num": 10.45,
      "vento": "+1.2",
      "posicao": 1
    }
  ],
  "paginacao": { "pagina": 1, "por_pagina": 20, "total": 25, "total_paginas": 2 }
}
```

---

## Códigos de erro

| Código | Significado |
|---|---|
| `400` | Parâmetros inválidos ou ausentes |
| `401` | API key inválida ou ausente |
| `404` | Recurso não encontrado |
| `405` | Método não permitido (apenas GET) |
| `429` | Rate limit excedido |
| `500` | Erro interno do servidor |

Erros retornam JSON:

```json
{
  "erro": "Descrição do erro",
  "detalhe": "Informação adicional (quando disponível)"
}
```

---

## LGPD

- CPF de atletas é **sempre mascarado** (ex: `***.***.**34`)
- Data de nascimento não é exposta — apenas `ano_nasc`
- Emails não são expostos pela API pública
