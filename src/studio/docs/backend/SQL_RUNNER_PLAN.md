# SQL Runner — Plano Backend

## Status: ✅ Implementado (Fase 1)

O SQL Runner está conectado ao backend real. A conexão vem do `dataModel.connectionId` (modelo importado).

---

## O que foi feito

### 1. Conexão com `/api/sql/execute`
- `handleRun` faz `fetch('/api/sql/execute', { connectionId, sql })`
- `connectionId` vem de `dataModel.connectionId` (do ImportDialog)
- Suporte a cancelamento via `AbortController`
- Estado de erro exibido na UI

### 2. UI melhorada
- Botão "Executar" → "Cancelar" durante execução
- Barra de erro com mensagem do MySQL
- Botão desabilitado quando não há conexão importada

---

## Infraestrutura Backend Existente

| Endpoint | Método | Função |
|----------|--------|--------|
| `/api/sql/execute` | POST | Executa SQL contra MySQL (rate limit, size limit) |
| `/api/studio/connections` | GET/POST | CRUD de conexões MySQL |
| `/api/studio/connections/[id]` | POST | Testa conexão |

### Limites Implementados
- **Rate limit**: 30 req/min por usuário
- **Tamanho máximo**: 100KB por query
- **Statements**: máximo 50 por execução
- **Sanitização de erros**: credentials redactadas

---

## O que falta

| # | Feature | Prioridade | Dependências |
|---|---------|-----------|--------------|
| 1 | Histórico de queries no servidor | Média | Dashboard save/load |
| 2 | Queries salvas no servidor | Média | Dashboard save/load |
| 3 | Column types no grid (formatação por tipo) | Baixa | Nenhuma |
| 4 | Search/filter nos resultados | Baixa | Nenhuma |
| 5 | Export XLSX (além de CSV/JSON) | Baixa | Biblioteca xlsx |
| 6 | Streaming de resultados para queries grandes | Média | Backend streaming |

---

## Padrões Verificados no Código

### `loadStudioConnection()` — Helper Duplicado

A função de conexão MySQL **não é um helper compartilhado**. Ela está duplicada em:
- `src/app/api/studio/preview-table/route.ts`
- `src/app/api/studio/import-schema/route.ts`

Para criar uma nova route MySQL, copiar a mesma função ou extrair para `src/app/api/studio/_lib/load-connection.ts`.

**Retorno**: `{ host, port, user, password, database }` ou `null`
