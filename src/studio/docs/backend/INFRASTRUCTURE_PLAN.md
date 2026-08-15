# Studio — Plano de Infraestrutura Geral

Mapa completo de como cada parte do Studio se conecta ao backend.

---

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Editor   │  │  Viewer   │  │ SQL Runner│  │ DataView │       │
│  │  (Canvas) │  │ (Read-only)│  │ (Queries) │  │ (Tables) │       │
│  └─────┬─────┘  └─────┬────┘  └─────┬─────┘  └─────┬────┘       │
│        │              │              │              │             │
│        └──────────────┴──────┬───────┴──────────────┘             │
│                              │                                    │
│                    ┌─────────▼─────────┐                         │
│                    │   StudioContext    │                         │
│                    │   (useReducer)    │                         │
│                    └─────────┬─────────┘                         │
│                              │                                    │
│                    ┌─────────▼─────────┐                         │
│                    │   API Routes      │                         │
│                    │   (Next.js)       │                         │
│                    └─────────┬─────────┘                         │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                        BACKEND (Node.js)                        │
│                              │                                    │
│              ┌───────────────┼───────────────┐                   │
│              │               │               │                   │
│        ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐             │
│        │  Firebase  │  │   MySQL   │  │  Storage  │             │
│        │ (Firestore)│  │ (Pool Mgr)│  │  (Files)  │             │
│        └───────────┘  └───────────┘  └───────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

---

## Fluxos de Dados por Tela

### 1. Editor (Canvas)

```
┌─────────────────────────────────────────────────────────┐
│ Editor Flow                                              │
│                                                          │
│  DataPanel ──drag──► Canvas ──drop──► CanvasItem         │
│       │                    │              │               │
│       │ state.dataModel    │ SET_BUCKET   │ ChartRenderer │
│       │ (tabelas/campos)   │ _FIELD       │ (mock data)   │
│       │                    │              │               │
│  PropertiesPanel ◄─────────┘              │               │
│  (FormattingTab, BucketSlots)            │               │
│                                          │               │
│  RibbonToolbar ──► handleSave ──► POST /api/studio/      │
│                   handleVisualizar   dashboards          │
│                   handleImport      (só salva)          │
└─────────────────────────────────────────────────────────┘
```

**O que está conectado ao backend:**
- Import Dialog: importa schema MySQL → DataModel ✅
- Save: salva dashboard no Firestore ✅

**O que NÃO está conectado:**
- Queries dos visuais: usam mock data ❌
- Load do dashboard: lê de localStorage ❌
- Cross-filter: só funciona entre visuais no mesmo editor ❌

---

### 2. Viewer

```
┌─────────────────────────────────────────────────────────┐
│ Viewer Flow                                              │
│                                                          │
│  Editor ──localStorage──► Viewer ──► ChartRenderer       │
│  (handleVisualizar)       (snapshot)  (queryResults)     │
│                                                          │
│  O que é lido do snapshot:                               │
│  - pages, visuals, dataModel                             │
│  - globalFilters, pageFilters, visualFilters             │
│  - queryResults (congelado)                              │
│  - textBoxes, syncedFilters                              │
│                                                          │
│  O que NÃO funciona:                                     │
│  - Filtros interativos (sem UI)                          │
│  - Cross-filter (sem onCrossFilter)                      │
│  - Drill-down (sem onDrillDown)                          │
│  - Dados em tempo real (snapshot congelado)              │
└─────────────────────────────────────────────────────────┘
```

---

### 3. SQL Runner

```
┌─────────────────────────────────────────────────────────┐
│ SQL Runner Flow                                          │
│                                                          │
│  Monaco Editor ──► handleRun ──► POST /api/sql/execute   │
│  (SQL input)       (async)      (MySQL connection)       │
│                          │                               │
│                          ▼                               │
│                   QueryResultsGrid                       │
│                   (sorting, export)                      │
│                                                          │
│  Conexão: dataModel.connectionId (do modelo importado)   │
│  Histórico: localStorage (não persiste no servidor)      │
│  Queries salvas: localStorage (não persiste no servidor) │
└─────────────────────────────────────────────────────────┘
```

**Conectado:** ✅ Query execution via API
**Não conectado:** Histórico/salvas no servidor

---

### 4. DataView

```
┌─────────────────────────────────────────────────────────┐
│ DataView Flow                                            │
│                                                          │
│  Sidebar (tabelas) ──select──► GET /api/studio/rows      │
│       │                           │                      │
│       │ state.dataModel           │ rows + totalCount    │
│       │ (schema das tabelas)      │                      │
│       │                           ▼                      │
│       └──────────────────► TableVirtuoso                 │
│                            (sorting, virtual scroll)     │
│                                                          │
│  Conexão: dataModel.connectionId                         │
│  Sem conexão: mostra "Conecte-se a um banco de dados"    │
└─────────────────────────────────────────────────────────┘
```

**Conectado:** ✅ Rows API com pagination e sorting
**Não conectado:** Filtros por coluna, estatísticas, export

---

### 5. ModelView

```
┌─────────────────────────────────────────────────────────┐
│ ModelView Flow                                           │
│                                                          │
│  Sidebar (tabelas) ──► Canvas SVG (entidades + linhas)   │
│       │                    │                             │
│       │ state.dataModel    │ state.modelViewTabs         │
│       │ (tabelas, rels)    │ (posições, zoom)            │
│       │                    │                             │
│  ImportDialog ──► POST /api/studio/import-schema         │
│       │               │                                  │
│       │               ▼                                  │
│       │         DataModel (tabelas, campos, relações)    │
│       │                                                  │
│  RelationshipEditor ──► dispatch (toggle, rename)        │
│  Auto-detect ──► heuristic frontend (não usa backend)    │
│                                                          │
│  Tudo é in-memory. Nada é persistido no servidor.        │
└─────────────────────────────────────────────────────────┘
```

**Conectado:** ✅ Import Dialog (schema import)
**Não conectado:** Save/load do modelo, auto-detect FK server-side

---

## APIs Existentes vs Necessárias

### ✅ Existentes (em `src/app/api/`)

| Endpoint | Método | Função | Usado por |
|----------|--------|--------|-----------|
| `/api/studio/connections` | GET | Listar conexões | ImportDialog |
| `/api/studio/connections` | POST | Criar conexão | ImportDialog |
| `/api/studio/connections/[id]` | GET/PUT/DELETE | CRUD conexão | ImportDialog |
| `/api/studio/connections/[id]` | POST | Testar conexão | ImportDialog |
| `/api/studio/tables` | POST | Listar tabelas MySQL | ImportDialog |
| `/api/studio/preview-table` | POST | Preview 10 rows | ImportDialog |
| `/api/studio/import-schema` | POST | Importar schema → DataModel | ImportDialog |
| `/api/studio/rows` | GET | Rows paginados com sorting | DataView |
| `/api/studio/dashboards` | POST | Salvar dashboard | RibbonToolbar |
| `/api/sql/execute` | POST | Executar SQL | SQL Runner |

### 🔴 Precisam ser criados

| Endpoint | Método | Função | Prioridade |
|----------|--------|--------|-----------|
| `/api/studio/dashboards/:id` | GET | **Carregar dashboard** | **CRÍTICA** |
| `/api/studio/dashboards/:id` | PUT | **Salvar dashboard completo** | **CRÍTICA** |
| `/api/studio/dashboards/:id` | DELETE | Deletar dashboard | Alta |
| `/api/studio/dashboards` | GET | Listar dashboards do usuário | Alta |
| `/api/studio/query` | POST | Executar query de visual (wrapper de `/api/sql/execute` com cache) | **CRÍTICA** |
| `/api/studio/filters/distinct/:table/:column` | GET | Valores distintos para dropdowns de filtro | Média |

---

## Estado: Frontend vs Backend

### Estado que deve ser persistido no backend

| Campo do State | Atual | Backend necessário |
|----------------|-------|-------------------|
| `dashboardId` | `null` sempre | Definido no load/create |
| `dashboardName` | string | Salvo no Firestore |
| `dashboardDescription` | string | Salvo no Firestore |
| `pages` | In-memory | Salvo como JSON no dashboard |
| `activePageId` | In-memory | Salvo no dashboard |
| `dataModel` | `MOCK_DATA_MODEL` | Salvo em `studio_models` + tabelas |
| `globalFilters` | In-memory | Salvo como JSON no dashboard |
| `pageFilters` | In-memory | Salvo como JSON no dashboard |
| `visualFilters` | In-memory | Salvo como JSON no dashboard |
| `textBoxes` | In-memory | Salvo nas páginas |
| `syncedFilters` | In-memory | Salvo como JSON no dashboard |
| `measures` | In-memory | Salvo no dataModel |
| `calculatedColumns` | In-memory | Salvo no dataModel |
| `calculatedTables` | In-memory | Salvo no dataModel |
| `modelViewTabs` | In-memory | Salvo em `model_views` |

### Estado que é só de UI (não precisa persistir)

| Campo do State | Função |
|----------------|--------|
| `selectedVisualId` | Qual visual está selecionado |
| `selectedTextBoxId` | Qual textBox está selecionado |
| `canvasZoom` | Zoom atual do canvas |
| `showGrid` | Se a grade está visível |
| `activeView` | Qual aba está ativa (editor/model/sql/data) |
| `dataPanelWidth` | Largura do painel de dados |
| `propertiesPanelWidth` | Largura do painel de propriedades |
| `undoStack` / `redoStack` | Undo/redo (client-only) |
| `isDirty` | Flag de alterações pendentes |

---

## Fluxo de Conexão: Modelo → Tela → API

### Importação do Modelo

```
1. Usuário clica "Importar" no Ribbon
2. ImportDialog abre
3. Busca conexões: GET /api/studio/connections
4. Usuário seleciona conexão
5. Busca tabelas: POST /api/studio/tables { connectionId }
6. Usuário seleciona tabelas
7. Importa schema: POST /api/studio/import-schema { connectionId, tables }
8. Server lê INFORMATION_SCHEMA, retorna DataModel
9. Dispatch: SET_DATA_MODEL (substitui todo o dataModel)
10. dataModel.connectionId é definido
```

### Execução de Query (SQL Runner)

```
1. Usuário escreve SQL no Monaco Editor
2. Clica "Executar" ou Ctrl+Enter
3. handleRun() é chamado
4. Verifica: dataModel.connectionId existe? Se não, mostra erro
5. POST /api/sql/execute { connectionId: dataModel.connectionId, sql }
6. Server usa getPool(connectionId) para obter pool MySQL
7. Server executa SQL via executeQuery()
8. Retorna: { columns, rows, executionTime }
9. Resultado exibido no QueryResultsGrid
```

### Visualização de Dados (DataView)

```
1. Usuário clica na aba "Dados"
2. DataView renderiza sidebar com tabelas do dataModel
3. Usuário clica em uma tabela
4. GET /api/studio/rows?connectionId=X&table=Y&limit=500
5. Server busca rows do MySQL com pagination
6. Retorna: { rows, totalCount }
7. TableVirtuoso renderiza os dados
8. Usuário pode clicar em header para ordenar
```

### Dashboard Save/Load (futuro)

```
SAVE:
1. Usuário clica "Salvar" no Ribbon
2. handleSave() monta payload: { pages, dataModel, filters, ... }
3. POST /api/studio/dashboards { dashboardId, ...data }
4. Server salva no Firestore: studio_dashboards/{dashboardId}

LOAD:
1. Usuário abre /studio/[dashboardId]
2. GET /api/studio/dashboards/[dashboardId]
3. Server busca do Firestore
4. Retorna: { pages, dataModel, filters, ... }
5. Dispatch: LOAD_DASHBOARD (hidrata o state)
```

### Query de Visual (futuro)

```
1. Usuário cria visual e arrasta campos para buckets
2. CanvasItem detecta mudança nos buckets
3. useVisualQuery hook é acionado
4. buildSqlQuery() gera SQL a partir dos buckets + filtros + dataModel
5. POST /api/studio/query { connectionId, sql }
6. Server executa via /api/sql/execute
7. Retorna: { columns, rows }
8. Dispatch: SET_QUERY_RESULT
9. ChartRenderer renderiza dados reais
```

---

## Dependências entre Componentes

```
StudioProvider (Context)
├── StudioEditor
│   ├── RibbonToolbar ──► handleSave (POST dashboards)
│   │                  ──► handleVisualizar (localStorage → viewer)
│   │                  ──► ImportDialog (POST import-schema)
│   ├── IconSidebar ──► SET_ACTIVE_VIEW
│   ├── Canvas
│   │   ├── CanvasItem
│   │   │   ├── ChartRenderer (mock data por enquanto)
│   │   │   ├── Drag handles
│   │   │   └── Resize handles
│   │   ├── CanvasTextBox
│   │   └── Marquee selection
│   ├── DataPanel ──► state.dataModel (tabelas, campos, medidas)
│   ├── PropertiesPanel
│   │   ├── FormattingTab
│   │   ├── BucketSlots ──► SET_BUCKET_FIELD
│   │   └── CanvasPropertiesTab
│   ├── FiltersPanel ──► SET_GLOBAL_FILTERS / SET_PAGE_FILTERS
│   └── SelectionPane ──► SELECT_VISUAL / TOGGLE_HIDDEN
├── StudioViewer
│   └── ChartRenderer (queryResults do snapshot)
├── SqlRunner
│   ├── Monaco Editor (SQL input)
│   └── POST /api/sql/execute ──► QueryResultsGrid
├── DataView
│   └── GET /api/studio/rows ──► TableVirtuoso
├── ModelView
│   ├── TableEntity (draggable)
│   ├── RelationshipLine (SVG)
│   └── ImportDialog
└── BottomBar ──► state (page info, zoom)
```

---

## Prioridades de Implementação

### Fase 1 — Fundamento (CRÍTICO)
1. `GET /api/studio/dashboards/:id` — carregar dashboard
2. `PUT /api/studio/dashboards/:id` — salvar dashboard completo
3. Substituir localStorage auto-save por server-side save
4. Substituir MOCK_DATA_MODEL por load do servidor

### Fase 2 — Dados Reais (CRÍTICO)
5. `useVisualQuery` hook — executar queries dos visuais
6. `POST /api/studio/query` — endpoint dedicado (wrapper com cache)
7. Conectar todos os visuais a dados reais
8. Remover `getMockDataForVisual()` e `mockPreviewData`

### Fase 3 — Viewer Funcional (ALTO)
9. Carregar dashboard do servidor no viewer
10. Executar queries em tempo real no viewer
11. Adicionar cross-filter ao viewer
12. Adicionar filtros interativos ao viewer

### Fase 4 — Melhorias (MÉDIO)
13. `GET /api/studio/filters/distinct/:table/:column` — valores para filtros
14. Histórico de queries no servidor
15. Queries salvas no servidor
16. Listar dashboards do usuário

### Fase 5 — Avançado (BAIXO)
17. Auto-detect FK server-side
18. Export PDF/imagem
19. Compartilhamento via URL
20. Embed mode

---

## Padrões Verificados no Código (Exploração Real)

### `loadStudioConnection()` — Helper Duplicado

A função `loadStudioConnection()` está **duplicada idêntica** em dois arquivos (não é shared helper):

- `src/app/api/studio/preview-table/route.ts`
- `src/app/api/studio/import-schema/route.ts`

```typescript
// Implementação idêntica em ambos:
const CONNECTIONS_COLLECTION = 'studio_connections';

async function loadStudioConnection(connectionId: string) {
  if (!adminDb) return null;
  try {
    const doc = await adminDb.collection(CONNECTIONS_COLLECTION).doc(connectionId).get();
    if (!doc.exists) return null;
    const data = doc.data() || {};
    if (data.password && typeof data.password === 'string' && isEncrypted(data.password)) {
      data.password = decrypt(data.password);
    }
    return data;
  } catch {
    return null;
  }
}
```

**Retorno**: `{ host, port, user, password, database }` ou `null`
**Dependências**: `adminDb` (Firebase), `decrypt`/`isEncrypted` (crypto)
**Recomendação**: Extrair para `src/app/api/studio/_lib/load-connection.ts`

---

### `buildSqlQuery()` — Assinatura e Comportamento

**Arquivo**: `src/studio/lib/sql-builder.ts`

```typescript
export function buildSqlQuery(
  buckets: VisualBuckets,    // { xAxis, legend, values, yAxis, details }
  filters: FilterCondition[],// { tableName, columnName, operator, value }
  dataModel: DataModel,      // ⚠️ PARAM NÃO É USADO INTERNAMENTE
  tableName?: string          // ⚠️ TAMBÉM NÃO É USADO
): SqlBuildResult

export interface SqlBuildResult {
  sql: string;
  referencedTables: string[];
  needsGroupBy: boolean;
}
```

**⚠️ Problema Crítico**: O parâmetro `dataModel` é aceito mas **NÃO é utilizado** na implementação atual. Joins são hardcoded via `getDefaultRelationships()` que retorna apenas relações de `fato_vendas`. Isso precisa ser corrigido para suportar data models customizados.

**Dispatch interno**: `buildScalarQuery` | `buildTableQuery` | `buildAggregateQuery`

---

### `POST /api/studio/dashboards` — Sem Validação

```typescript
// Body aceito: { dashboardId: string, data: any }
// NÃO há validação de schema no payload
await adminDb.collection('studio_dashboards').doc(dashboardId).set({
  ...data,
  updatedAt: new Date().toISOString(),
}, { merge: true });
```

**Risco**: Qualquer campo pode ser salvo sem validação. Recomenda-se adicionar schema validation.

---

### Cache de Queries — Não Existe

**Nenhuma função de cache ou hash de query existe** no codebase. Não há `getQueryKey()`, `hashQuery()`, `queryHash()`, ou `cacheKey()` em `src/studio/lib/`.

Para o `useVisualQuery`, será necessário criar:
```typescript
// Função proposta
function getQueryKey(connectionId: string, sql: string): string {
  return `${connectionId}:${crypto.subtle.digest('SHA-256', new TextEncoder().encode(sql))}`;
}
```

---

### `getDataModel()` — Fallback para Mock

```typescript
// src/studio/lib/data-model-utils.ts
export function getDataModel(dataModel: DataModel | null): DataModel {
  return dataModel ?? MOCK_DATA_MODEL;  // Retorna MOCK se null
}
```

Todos os componentes que usam `getDataModel()` precisam garantir que `state.dataModel` não seja null antes de gerar queries.
