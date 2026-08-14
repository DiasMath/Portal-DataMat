# Graph Report - D:\DATAMAT\Portal-DataMat\src\studio  (2026-08-03)

## Corpus Check
- Corpus is ~31,736 words - fits in a single context window. You may not need a graph.

## Summary
- 263 nodes · 723 edges · 7 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Properties & Page Tabs
- Chart Library
- Store, Undo & Filters
- Model View & Data Panel
- Field Buckets & Formatting
- SQL Runner & Builder
- Canvas & Chart Rendering

## God Nodes (most connected - your core abstractions)
1. `useStudio()` - 49 edges
2. `VisualFormatting` - 23 edges
3. `QueryResultData` - 23 edges
4. `Visual` - 13 edges
5. `studioReducer()` - 11 edges
6. `VisualType` - 11 edges
7. `StudioState` - 10 edges
8. `VisualBuckets` - 9 edges
9. `BucketField` - 9 edges
10. `CanvasItem()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `DraggableField()` --calls--> `useStudio()`  [EXTRACTED]
  components/properties-panel/BucketSlot.tsx → store/StudioContext.tsx
- `FormattingTabProps` --references--> `Visual`  [EXTRACTED]
  components/properties-panel/FormattingTab.tsx → types/dashboard.ts
- `CanvasItem()` --calls--> `useStudio()`  [EXTRACTED]
  components/canvas/CanvasItem.tsx → store/StudioContext.tsx
- `ChartRenderer()` --calls--> `getMockDataForVisual()`  [EXTRACTED]
  components/charts/ChartRenderer.tsx → lib/mock-data.ts
- `DataPanel()` --calls--> `useStudio()`  [EXTRACTED]
  components/data-panel/DataPanel.tsx → store/StudioContext.tsx

## Import Cycles
- None detected.

## Communities (7 total, 0 thin omitted)

### Community 0 - "Properties & Page Tabs"
Cohesion: 0.08
Nodes (36): Canvas(), VisualContextMenu(), VisualContextMenuProps, CollapsedStripProps, StudioEditor(), StudioEditorProps, FiltersPanel(), PageContextMenu() (+28 more)

### Community 1 - "Chart Library"
Cohesion: 0.09
Nodes (37): CanvasItemProps, BarChart(), BarChartProps, DEFAULT_COLORS, ChartRendererProps, ChartTooltip(), ChartTooltipProps, formatTooltipValue() (+29 more)

### Community 2 - "Store, Undo & Filters"
Cohesion: 0.13
Nodes (29): getActivePage(), getInitialState(), getVisualFromPage(), StudioContext, StudioContextValue, StudioProvider(), studioReducer(), updateVisualInState() (+21 more)

### Community 3 - "Model View & Data Panel"
Cohesion: 0.08
Nodes (27): DataPanel(), MeasureNode(), MeasureNodeProps, TableNode(), TableNodeProps, TYPE_ICONS, DataView(), MOCK_TABLE_ROWS (+19 more)

### Community 4 - "Field Buckets & Formatting"
Cohesion: 0.09
Nodes (23): FieldNode(), FieldNodeProps, getDefaultBucketForField(), isFieldInAnyBucket(), BucketSlot(), BucketSlotProps, DraggableField(), DraggableFieldProps (+15 more)

### Community 5 - "SQL Runner & Builder"
Cohesion: 0.16
Nodes (20): formatValue(), QueryResultsGrid(), QueryResultsGridProps, SqlRunner(), buildAggregateQuery(), buildFilterCondition(), buildJoinClauses(), buildScalarQuery() (+12 more)

### Community 6 - "Canvas & Chart Rendering"
Cohesion: 0.16
Nodes (17): SmartGuide, CanvasItem(), getResizeHandlePosition(), RESIZE_DIRECTIONS, CanvasRuler(), CanvasRulerProps, ChartRenderer(), CANVAS_DEFAULTS (+9 more)

## Knowledge Gaps
- **43 isolated node(s):** `SmartGuide`, `RESIZE_DIRECTIONS`, `CanvasRulerProps`, `VisualContextMenuProps`, `DEFAULT_COLORS` (+38 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useStudio()` connect `Properties & Page Tabs` to `Store, Undo & Filters`, `Model View & Data Panel`, `Field Buckets & Formatting`, `SQL Runner & Builder`, `Canvas & Chart Rendering`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `VisualFormatting` connect `Chart Library` to `Store, Undo & Filters`, `Field Buckets & Formatting`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `QueryResultData` connect `Chart Library` to `Store, Undo & Filters`, `Field Buckets & Formatting`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `SmartGuide`, `RESIZE_DIRECTIONS`, `CanvasRulerProps` to the rest of the system?**
  _43 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Properties & Page Tabs` be split into smaller, more focused modules?**
  _Cohesion score 0.08013468013468013 - nodes in this community are weakly interconnected._
- **Should `Chart Library` be split into smaller, more focused modules?**
  _Cohesion score 0.09143686502177069 - nodes in this community are weakly interconnected._
- **Should `Store, Undo & Filters` be split into smaller, more focused modules?**
  _Cohesion score 0.13063063063063063 - nodes in this community are weakly interconnected._