# Studio — Estrutura de Pastas Detalhada

O módulo `/studio/` é um **Power BI clone** — um editor e visualizador de dashboards nativo em Next.js.

---

## Visão Geral

```
src/studio/
├── __tests__/              # Testes unitários
├── components/             # Componentes React organizados por função
│   ├── canvas/             # Canvas do editor (arrastar, redimensionar, selecionar)
│   ├── charts/             # Gráficos e visuais (25 tipos, ECharts)
│   ├── data-panel/         # Painel lateral esquerdo (tabelas, campos, medidas)
│   ├── data-view/          # Aba "Dados" (visualização de tabelas do modelo)
│   ├── editor/             # Editor principal (StudioEditor)
│   ├── filters-panel/      # Painel de filtros
│   ├── model-view/         # Aba "Modelo" (diagrama de relações)
│   ├── page-tabs/          # Abas de páginas do relatório
│   ├── properties-panel/   # Painel lateral direito (propriedades do visual)
│   ├── selection-pane/     # Painê de seleção (lista de visuais)
│   ├── shared/             # Componentes compartilhados (BottomBar, ZoomBar...)
│   ├── sidebar/            # Ícones laterais (EditorSidebar)
│   ├── sql-runner/         # Aba "SQL" (editor de queries)
│   ├── toolbar/            # Ribbon toolbar e editores (Medida, Coluna Calculada...)
│   └── viewer/             # Modo visualização (somente leitura)
├── docs/                   # Documentação e estudos
│   └── backend/            # Planos de backend por tela
├── hooks/                  # Custom hooks
├── lib/                    # Utilitários e helpers
├── store/                  # Estado global (Context + Reducer + Undo)
├── types/                  # Definições de TypeScript
└── ROADMAP.md              # Roadmap do projeto
```

---

## `types/` — Definições de TypeScript

| Arquivo | O que define |
|---------|-------------|
| `state.ts` | `StudioState`, `StudioAction`, `StudioSnapshot`, `initialStudioState` |
| `dashboard.ts` | `DataModel`, `TableSchema`, `FieldSchema`, `Relationship`, `Measure`, `Visual`, `DashboardPage`, `CanvasTextBox`, `CalculatedColumn`, `CalculatedTable` |
| `visuals.ts` | `VisualType` (25 tipos), `VisualBuckets`, `VisualFormatting`, `FilterCondition`, `BucketField`, `QueryResultData` |
| `canvas.ts` | `CANVAS_DEFAULTS` (1920×1080), `PAGE_PRESETS`, `clampToCanvas()`, `snapToGrid()` |

---

## `store/` — Estado Global

### `StudioContext.tsx`
- **`StudioProvider`**: Envolve a aplicação, fornece `state` e `dispatch`
- **`studioReducer`**: Switch com ~80 cases
- **`useStudio()`**: Hook para acessar `{ state, dispatch, canUndo, canRedo }`
- **Auto-save**: Debounce 2s para `localStorage` quando `isDirty`

### `undo-middleware.ts`
- **`pushUndo(state)`**: Salva snapshot antes de mutations
- **`performUndo/performRedo`**: Restaura snapshots do stack

---

## `components/` — Componentes

### `canvas/` — Canvas do Editor

| Arquivo | Função |
|---------|--------|
| `Canvas.tsx` | Container principal do canvas. Renderiza visuals, textBoxes, grade, zoom/pan |
| `CanvasItem.tsx` | Wrapper de cada visual. Gerencia drag, resize, snap-to-grid, smart guides |
| `CanvasTextBox.tsx` | TextBox independente (não é visual) |
| `VisualContextMenu.tsx` | Menu de contexto (botão direito) |

### `charts/` — Visuais e Gráficos (25 tipos, ECharts)

| Arquivo | Função |
|---------|--------|
| `ChartRenderer.tsx` | **Router central**: recebe `VisualType` e renderiza o componente correto |
| `EChartWrapper.tsx` | Wrapper compartilhado com ResizeObserver, tema, React.memo |
| `BarChart.tsx` | Gráfico de barras (ECharts) |
| `LineChart.tsx` | Gráfico de linhas (ECharts) |
| `PieChart.tsx` | Gráfico de pizza/rosca (ECharts) |
| `ScatterChart.tsx` | Dispersão (ECharts) |
| `AreaChart.tsx` | Área (ECharts) |
| `DonutChart.tsx` | Rosca (ECharts) |
| `TreemapChart.tsx` | Mapa de árvore (ECharts) |
| `WaterfallChart.tsx` | Cascata (ECharts) |
| `ComboChart.tsx` | Combinado barras + linha (ECharts) |
| `GaugeChart.tsx` | Medidor (ECharts) |
| `RadarChart.tsx` | Radar (ECharts) |
| `FunnelChart.tsx` | Funil (ECharts) |
| `RibbonChart.tsx` | Ribbon/Sankey (ECharts) |
| `BulletChart.tsx` | Bullet (custom bar + markLine) |
| `SunburstChart.tsx` | Sunburst (ECharts) |
| `SankeyChart.tsx` | Sankey (ECharts) |
| `WordCloudChart.tsx` | Nuvem de palavras (scatter custom) |
| `BoxPlotChart.tsx` | BoxPlot (ECharts) |
| `HistogramChart.tsx` | Histograma (bar com binning) |
| `DotPlotChart.tsx` | Dot plot (scatter custom) |
| `LollipopChart.tsx` | Lollipop (bar + scatter) |
| `MatrixVisual.tsx` | Matriz (HTML table com expand/collapse) |
| `KpiCard.tsx` | Cartão KPI com sparkline e trend |
| `TableVisual.tsx` | Tabela de dados com sorting e seleção |
| `ChartTooltip.tsx` | Tooltip compartilhado |
| `VisualLoading.tsx` | Estado de loading |
| `VisualError.tsx` | Estado de erro |

### `data-panel/` — Painel Lateral Esquerdo

| Arquivo | Função |
|---------|--------|
| `DataPanel.tsx` | Painel principal: lista tabelas + campos + medidas |
| `TableNode.tsx` | Cada tabela na lista |
| `FieldNode.tsx` | Campo individual (draggable) |
| `MeasureNode.tsx` | Medida individual (draggable, com "fx") |

### `data-view/` — Aba "Dados"

| Arquivo | Função |
|---------|--------|
| `DataView.tsx` | Visualização de dados com API real (`/api/studio/rows`), sorting, loading states |

### `editor/` — Editor Principal

| Arquivo | Função |
|---------|--------|
| `StudioEditor.tsx` | Layout principal: DndContext, RibbonToolbar, Canvas, DataPanel, PropertiesPanel |

### `model-view/` — Aba "Modelo"

| Arquivo | Função |
|---------|--------|
| `ModelView.tsx` | Diagrama de relações (sidebar + canvas SVG) |
| `ModelViewTabs.tsx` | Abas de views do modelo |
| `TableEntity.tsx` | Cada tabela no diagrama (arrastável) |
| `RelationshipLine.tsx` | Linha SVG de relação com cardinalidade |

### `properties-panel/` — Painel Lateral Direito

| Arquivo | Função |
|---------|--------|
| `PropertiesPanel.tsx` | Router: TextBoxProperties, ou abas Visual/Formatação, ou PageSettings |
| `TextBoxProperties.tsx` | Formatação de TextBox |
| `BucketSlot.tsx` | Slot de arrastar campos |
| `FormattingTab.tsx` | Aba de formatação do visual (25 tipos) |
| `CanvasPropertiesTab.tsx` | Propriedades do elemento (borda, sombra, fundo, cabeçalho) |
| `PageSettings.tsx` | Configurações da página |
| `VisualPreview.tsx` | Preview de visuais com mock data |

### `toolbar/` — Ribbon e Editores

| Arquivo | Função |
|---------|--------|
| `RibbonToolbar.tsx` | Ribbon completo com 7 abas |
| `ChartTypePicker.tsx` | Grid 4x4 com 16 visuais + botão "..." |
| `VisualGalleryDialog.tsx` | Dialog com 9 visuais adicionais + busca + categorias |
| `MeasureEditor.tsx` | Editor Monaco SQL para medidas |
| `CalculatedColumnEditor.tsx` | Editor para colunas calculadas |
| `CalculatedTableEditor.tsx` | Editor para tabelas calculadas |

### `shared/` — Componentes Compartilhados

| Arquivo | Função |
|---------|--------|
| `BottomBar.tsx` | Barra inferior: página X/Y, dimensões, zoom |
| `ZoomBar.tsx` | Seletor de zoom (fit-to-page, 50%-200%) |
| `PanelResizer.tsx` | Redimensionador de painéis laterais |
| `FolderDialog.tsx` | Modal para criar/renomear pastas de medidas |
| `SqlEditorBase.tsx` | Editor Monaco compartilhado para SQL |
| `SqlStatusBar.tsx` | Status bar do editor SQL |
| `SearchInput.tsx` | Input de busca compartilhado |
| `UnsavedChangesDialog.tsx` | Dialog de confirmação |
| `ErrorBoundary.tsx` | Error boundary compartilhado |
| `type-icons.tsx` | `getTypeIcon()` — ícones por tipo de campo |

### `filters-panel/` — Painel de Filtros

| Arquivo | Função |
|---------|--------|
| `FiltersPanel.tsx` | Filtros por página/global. Botão de sincronizar |

### `selection-pane/` — Painê de Seleção

| Arquivo | Função |
|---------|--------|
| `SelectionPane.tsx` | Lista de visuais na página, com ordenação e visibilidade |

### `page-tabs/` — Abas de Páginas

| Arquivo | Função |
|---------|--------|
| `PageTabs.tsx` | Abas inferiores para trocar de página |
| `PageContextMenu.tsx` | Menu de contexto para páginas |

### `sidebar/` — Barra Lateral de Ícones

| Arquivo | Função |
|---------|--------|
| `IconSidebar.tsx` | Ícones verticais para trocar entre abas |

### `sql-runner/` — Aba SQL

| Arquivo | Função |
|---------|--------|
| `SqlRunner.tsx` | Editor SQL conectado à API real (`/api/sql/execute`) |
| `grid/QueryResultsGrid.tsx` | Grid virtualizado com sorting e resize de colunas |
| `grid/GridColumnHeader.tsx` | Header da coluna com resize |
| `grid/GridToolbar.tsx` | Toolbar do grid (export, copy) |
| `grid/types.ts` | Tipos e cores do grid |

### `viewer/` — Modo Visualização

| Arquivo | Função |
|---------|--------|
| `StudioViewer.tsx` | Modo somente leitura. Cards padronizados, measureFormats, textBoxes |

---

## `hooks/` — Custom Hooks

| Arquivo | Função |
|---------|--------|
| `useStudioDnd.ts` | Lógica de drag-and-drop (fields → buckets) |
| `useStudioKeyboard.ts` | Atalhos de teclado (Delete, Ctrl+Z, Ctrl+C, etc.) |
| `useCopyToClipboard.ts` | Copiar para clipboard |

---

## `lib/` — Utilitários

| Arquivo | Função |
|---------|--------|
| `echarts/registry.ts` | Tree-shaken ECharts registration |
| `echarts/theme.ts` | Temas dark/light para ECharts |
| `cross-filter-utils.ts` | `CROSS_FILTER_MODE` por VisualType, opacity helpers |
| `format.ts` | `formatMeasureValue()`, `buildMeasureFormatMap()` |
| `mocks/mock-data.ts` | `MOCK_DATA_MODEL` — dados de teste |
| `sql-builder.ts` | Construção de queries SQL a partir dos visuais |
| `sql-completion.ts` | Autocomplete SQL no Monaco (tipado) |
| `sql-validator.ts` | Validação de expressões SQL |
| `sql-templates.ts` | Templates SQL pré-definidos |
| `monaco-options.ts` | `BASE_MONACO_OPTIONS` |
| `constants.ts` | `DEFAULT_CHART_COLORS`, `FILTERED_COLOR` |
| `relationship-validator.ts` | Validação de relações |
| `orthogonal-router.ts` | Roteamento de linhas de relação |
| `download-blob.ts` | Download de arquivos blob |
| `data-model-utils.ts` | `getDataModel()` — fallback para MOCK_DATA_MODEL |
| `set-utils.ts` | `toggleSet<T>()` |
| `import-schema.ts` | Importação de schema MySQL |

---

## `docs/` — Documentação

```
docs/
├── backend/                    # Planos de backend por tela
│   ├── MODELVIEW_PLAN.md       # ModelView: persistência, API, importação
│   ├── SQL_RUNNER_PLAN.md      # SQL Runner: conexão com /api/sql/execute ✅
│   ├── DATAVIEW_PLAN.md        # DataView: API de rows ✅
│   ├── EDITOR_QUERY_PLAN.md    # Editor: useVisualQuery hook
│   └── VIEWER_PLAN.md          # Viewer: servidor, filtros, compartilhamento
├── STUDIO_STRUCTURE.md         # Este arquivo
├── STUDIO_NEXT_STEPS.md        # Próximas tarefas
├── VISUAL_LIBRARIES_STUDY.md   # Estudo de bibliotecas de visuais
├── TABLE_MATRIX_LIBRARIES_STUDY.md  # Estudo de tabelas/matrizes
├── KPI_CARDS_STUDY.md          # Estudo de KPI cards
└── PANELS_IMPROVEMENT_PLAN.md  # Plano de melhorias dos painéis
```

---

## API Routes

| Route | Método | Função |
|-------|--------|--------|
| `/api/studio/connections` | GET/POST | CRUD de conexões MySQL |
| `/api/studio/connections/[id]` | GET/PUT/DELETE/POST | Conexão específica + testar |
| `/api/studio/dashboards` | POST | Salvar/atualizar dashboard |
| `/api/studio/import-schema` | POST | Importar schema MySQL → DataModel |
| `/api/studio/tables` | POST | Listar tabelas e colunas |
| `/api/studio/preview-table` | POST | Preview com 10 rows |
| `/api/studio/rows` | GET | **NOVO**: Rows paginados com sorting |
| `/api/sql/execute` | POST | Executar SQL (rate limit, auth) |

---

## Fluxo de Dados

```
┌─────────────┐    dispatch     ┌──────────────┐    state     ┌─────────────┐
│  Ribbon      │ ──────────────►│ StudioContext │ ────────────►│  Canvas     │
│  Toolbar     │                │  (reducer)    │              │  (render)   │
└─────────────┘                └──────────────┘              └─────────────┘
                                     │                            │
                                     │ queryResults               │ CanvasItem
                                     ▼                            ▼
                               ┌──────────────┐           ┌─────────────┐
                               │  SQL Runner   │           │ ChartRenderer│
                               │  (MySQL API)  │           │ (ECharts)   │
                               └──────────────┘           └─────────────┘
```

---

## Convenções

- **Accent color**: `#FFB03F` (amber-500)
- **Canvas**: Dark mode only (`#1a1a1a` background)
- **Estado**: `Context + useReducer` com `undo-middleware.ts`
- **Drag-and-drop**: `@dnd-kit/core`
- **Gráficos**: ECharts (tree-shaken)
- **Editor SQL**: Monaco Editor com tema custom `datamat-sql`
- **Canvas dimensions**: 1920×1080 (Full HD)
- **Auto-save**: `localStorage` com debounce 2s
- **Viewer**: Cards padronizados, measureFormats, textBoxes
- **Backend**: MySQL via `mysql2/promise`, Firebase Firestore para metadata
