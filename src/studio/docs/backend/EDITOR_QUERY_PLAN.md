# Editor Query Execution — Plano Backend

## Status: 🔴 Não Implementado

O Editor precisa executar queries automaticamente para cada visual.

---

## Problema Atual

1. `buildSqlQuery()` em `sql-builder.ts` gera SQL a partir dos buckets + filtros + data model
2. Mas **nunca é executado** — os visuais usam `getMockDataForVisual()` como fallback
3. Não há hook que conecte mudança de buckets → execução de query → renderização

---

## Fluxo Desejado

```
Visual buckets mudam
    ↓
buildSqlQuery() gera SQL
    ↓
POST /api/sql/execute (com debounce)
    ↓
SET_QUERY_RESULT dispatch
    ↓
ChartRenderer renderiza dados reais
```

---

## Implementação Necessária

### 1. Hook `useVisualQuery`

```typescript
// src/studio/hooks/useVisualQuery.ts
export function useVisualQuery(visual: Visual, dataModel: DataModel | null) {
  // Quando buckets/filtros/dataModel mudam:
  //   1. buildSqlQuery() gera SQL
  //   2. POST /api/sql/execute (ou /api/studio/query)
  //   3. dispatch(SET_QUERY_RESULT)
  
  // Debounce: 500ms após última mudança
  // Cache: hash da query + connectionId
  // Abort: cancelar query anterior se nova query chegar
}
```

### 2. Integração no Canvas

```typescript
// Em Canvas.tsx ou CanvasItem.tsx
useVisualQuery(visual, state.dataModel);
```

### 3. Estado de Loading/Error

Adicionar ao `VisualQueryState`:
```typescript
interface VisualQueryState {
  result?: QueryResultData;
  loading: boolean;
  error?: string;
  lastExecutedAt?: string;
}
```

### 4. Condições para executar

A query só deve ser executada quando:
- O visual tem pelo menos 1 bucket com campo asignado
- `dataModel.connectionId` existe (modelo importado)
- Os buckets/filtros mudaram (não re-executar se só mudou posição/formato)

### 5. Tratamento de erros

- Se `connectionId` não existe: mostrar "Importe um modelo de dados"
- Se SQL é inválido: mostrar erro do MySQL
- Se timeout: mostrar "Query demorou muito"
- Se abort: ignorar silenciosamente

---

## Dependências

| Componente | Status |
|------------|--------|
| `buildSqlQuery()` | ✅ Existe |
| `/api/sql/execute` | ✅ Existe |
| `getPool()` | ✅ Existe |
| `useVisualQuery` hook | 🔴 Precisa criar |
| `SET_QUERY_RESULT` action | ✅ Existe |

---

## Tipos e Assinaturas Verificados no Código

### `buildSqlQuery()` — Assinatura Exata

**Arquivo**: `src/studio/lib/sql-builder.ts`

```typescript
export function buildSqlQuery(
  buckets: VisualBuckets,    // { xAxis, legend, values, yAxis, details } — todos BucketField[]
  filters: FilterCondition[],// { tableName, columnName, operator, value }
  dataModel: DataModel,      // ⚠️ NÃO É USADO internamente
  tableName?: string          // ⚠️ TAMBÉM NÃO É USADO
): SqlBuildResult

interface SqlBuildResult {
  sql: string;
  referencedTables: string[];
  needsGroupBy: boolean;
}
```

**⚠️ Problema**: `dataModel` é aceito mas ignorado. Joins são hardcoded via `getDefaultRelationships()` (só retorna relações de `fato_vendas`). Precisa ser corrigido para suportar data models customizados.

### `SET_QUERY_RESULT` — Action Shape

```typescript
// Em types/state.ts:
{ type: 'SET_QUERY_RESULT', payload: { visualId: string, result: VisualQueryState } }

// Estado resultante:
state.queryResults[visualId] = result
```

### `VisualQueryState` — Tipo Completo

**Arquivo**: `src/studio/types/dashboard.ts`

```typescript
interface VisualQueryState {
  result: QueryResultData | null;  // null quando não executou
  loading: boolean;                // true durante fetch
  error: string | null;            // null quando sem erro
}
```

### `QueryResultData` — Formato do Resultado

**Arquivo**: `src/studio/types/visuals.ts`

```typescript
interface QueryResultData {
  columns: string[];                    // nomes das colunas
  rows: Record<string, unknown>[];      // dados
  executionTime: number;                // ms
}
```

### Cache — Não Existe

**Nenhuma função de cache ou hash existe** no codebase atual. Para o `useVisualQuery`, criar:

```typescript
// Proposta de implementação
function getQueryKey(connectionId: string, sql: string): string {
  // Usar hash simples ou crypto.subtle
  return `${connectionId}:${btoa(sql)}`;
}
```

### Condições para Executar a Query

A query só deve ser executada quando:
1. O visual tem pelo menos **1 bucket com campo asignado**
2. `dataModel.connectionId` existe (modelo importado)
3. Os buckets/filtros mudaram (debounce 500ms)
4. Não há query em execução (AbortController cancela a anterior)

---

## Próximos Passos

| # | Tarefa | Complexidade |
|---|--------|-------------|
| 1 | Criar `useVisualQuery` hook | Média |
| 2 | Integrar no Canvas/CanvasItem | Média |
| 3 | Adicionar loading/error states | Baixa |
| 4 | Debounce e cache | Média |
| 5 | Remover mock data fallback | Baixa |
| 6 | Testar com queries reais | Baixa |
