# DataView — Plano Backend

## Status: ✅ Implementado (Fase 1)

O DataView está conectado ao backend real via `GET /api/studio/rows`.

---

## O que foi feito

### 1. API `GET /api/studio/rows`
- **Endpoint**: `GET /api/studio/rows?connectionId=X&table=Y&offset=0&limit=500&sort=field&dir=ASC`
- **Response**: `{ rows, totalCount, offset, limit, hasMore }`
- **Validação**: SQL injection prevention via table name regex
- **Auth**: `validateMasterAdmin` + ownership check

### 2. DataView atualizado
- Removeu `MOCK_TABLE_ROWS` hardcoded
- Fetch automático quando tabela é selecionada
- Loading state com spinner
- Error state com mensagem
- Sorting por coluna (click no header)
- Indicadores de sort (setas ASC/DESC)
- Badge "Sem conexão" quando não há `connectionId`

---

## Infraestrutura Backend Existente

| Endpoint | Método | Função |
|----------|--------|--------|
| `/api/studio/rows` | GET | Rows paginados com sorting |
| `/api/studio/tables` | POST | Lista tabelas e colunas |
| `/api/studio/preview-table` | POST | Preview com 10 rows |
| `/api/studio/import-schema` | POST | Importa schema completo |

---

## O que falta

| # | Feature | Prioridade | Dependências |
|---|---------|-----------|--------------|
| 1 | Filtro por coluna (UI de filtros) | Alta | `GET /api/studio/filters/distinct` |
| 2 | Paginação via scroll (load more) | Média | Nenhuma |
| 3 | Estatísticas por coluna (min, max, avg, nulls) | Média | Nova API |
| 4 | Export CSV/Excel dos dados | Média | Biblioteca xlsx |
| 5 | Column resizing | Baixa | Nenhuma |
| 6 | Column hiding | Baixa | Nenhuma |
| 7 | Row count real do servidor | Baixa | Já implementado |

---

## Padrões Verificados no Código

### Validação de Segurança

- **SQL injection prevention**: Table name validada via regex `/^[a-zA-Z0-9_]+$/`
- **Auth**: `validateMasterAdmin` + ownership check em cada request
- **Pagination**: `offset` e `limit` parametrizados (não interpolados na query)

### `GET /api/studio/rows` — Response Format

```json
{
  "rows": [{ "column1": "value", ... }],
  "totalCount": 1234,
  "offset": 0,
  "limit": 500,
  "hasMore": true
}
```
