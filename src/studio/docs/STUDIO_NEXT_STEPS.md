# Studio — Proximos Passos

## Concluido

### Fases 1-10: Foundation ✅
- Bugs críticos, shared components, SqlEditorBase
- UX/Performance, organização/imports
- SQL Runner refactor, acessibilidade
- Performance/organização, arquitetura

### Fase 11: Visual Kit Completo ✅
- 25 VisualTypes com ECharts
- Tema light/dark por visual
- Recharts removido do projeto

### Fase 12: ChartTypePicker Expansivel ✅
- Grid 4x4 com 16 visuais padrão
- VisualGalleryDialog com 9 adicionais

### Fase 13: Painel de Propriedades ✅
- Aba Visual (propriedades do gráfico)
- Aba Formatação (Geral = CanvasPropertiesTab)

### Fase 14: Cross-Highlight System ✅
- Highlight (30% opacity) e Filter (remove non-matching)
- Ctrl+click multi-select

### Fase 15: Performance ✅
- React.memo, animation control, ResizeObserver

### Dia Atual: Backend Connection ✅
- **sql-completion.ts**: 3 `any` types corrigidos com tipos Monaco
- **Viewer snapshot**: textBoxes e syncedFilters incluídos
- **Viewer renderização**: Cards padronizados (igual editor)
- **Viewer measureFormats**: Conectado ao ChartRenderer
- **SQL Runner**: Conectado à `/api/sql/execute` (API real)
- **DataView**: Conectado à `/api/studio/rows` (API real, sorting)
- **API rows**: Novo endpoint `GET /api/studio/rows`
- **Backend MDs**: Pasta `docs/backend/` criada com planos

---

## Pendente

### Editor Query Execution 🔴
- [ ] Criar `useVisualQuery` hook
- [ ] Integrar no Canvas/CanvasItem
- [ ] Conectar `buildSqlQuery()` → API → `SET_QUERY_RESULT`
- [ ] Debounce e cache de queries

### Viewer Server Loading 🔴
- [ ] Criar `GET /api/studio/dashboards/{id}`
- [ ] Substituir localStorage por fetch ao servidor
- [ ] Adicionar auth check

### Viewer Interactivity 🔴
- [ ] Passar `crossFilterValue`/`onCrossFilter` ao ChartRenderer
- [ ] Passar `drillLevel`/`onDrillDown` ao ChartRenderer
- [ ] Adicionar UI de filtros no viewer
- [ ] Cross-filter interativo

### Melhorias DataView 🟡
- [ ] Filtro por coluna (UI)
- [ ] Paginação via scroll (load more)
- [ ] Estatísticas por coluna
- [ ] Export CSV/Excel

### Melhorias SQL Runner 🟡
- [ ] Column types no grid
- [ ] Search/filter nos resultados
- [ ] Histórico no servidor

---

## Arquivos Criados/Atualizados Hoje

### Novos
- `src/app/api/studio/rows/route.ts` — API de rows paginados
- `src/studio/docs/backend/MODELVIEW_PLAN.md` — movido de docs/
- `src/studio/docs/backend/SQL_RUNNER_PLAN.md`
- `src/studio/docs/backend/DATAVIEW_PLAN.md`
- `src/studio/docs/backend/EDITOR_QUERY_PLAN.md`
- `src/studio/docs/backend/VIEWER_PLAN.md`

### Atualizados
- `src/studio/lib/sql-completion.ts` — tipos Monaco
- `src/studio/components/viewer/StudioViewer.tsx` — cards, measureFormats, textBoxes
- `src/studio/components/toolbar/RibbonToolbar.tsx` — snapshot completo
- `src/studio/components/sql-runner/SqlRunner.tsx` — conexão API real
- `src/studio/components/data-view/DataView.tsx` — conexão API real
- `src/studio/docs/STUDIO_STRUCTURE.md` — estrutura atualizada
- `src/studio/docs/STUDIO_NEXT_STEPS.md` — este arquivo

---

## Dados Verificados do Código (Exploração Real)

### Achados Importantes para Próximas Fases

| Achado | Impacto | Arquivo |
|--------|---------|---------|
| `loadStudioConnection()` duplicado | Extrair para shared helper | `preview-table`, `import-schema` |
| `buildSqlQuery()` ignora `dataModel` | Corrigir para usar data model real | `sql-builder.ts` |
| Nenhum cache de queries existe | Criar `getQueryKey()` para `useVisualQuery` | Novo arquivo |
| `POST /api/studio/dashboards` sem validação | Adicionar schema validation | `dashboards/route.ts` |
| `getDataModel()` retorna MOCK fallback | Garantir state.dataModel != null antes de queries | `data-model-utils.ts` |

### Detalhes dos Tipos (para `useVisualQuery`)

```typescript
// buildSqlQuery retorna:
{ sql: string, referencedTables: string[], needsGroupBy: boolean }

// VisualQueryState:
{ result: QueryResultData | null, loading: boolean, error: string | null }

// QueryResultData:
{ columns: string[], rows: Record<string, unknown>[], executionTime: number }
```

→ Ver `EDITOR_QUERY_PLAN.md` para assinaturas completas.
