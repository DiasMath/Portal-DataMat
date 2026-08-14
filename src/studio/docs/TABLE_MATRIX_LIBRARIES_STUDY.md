# Estudo: Bibliotecas de Tabelas e Matrizes para Dashboard
## Foco: Clone do Power BI (Table visual + Matrix visual)

---

## Sumário

O Power BI possui dois visuais de tabela principais:
1. **Tabela (Table)**: Tabela simples com colunas, linhas, ordenação
2. **Matriz (Matrix)**: Tabela hierárquica com group by, expandir/recolher, totais

Este estudo analisa as melhores bibliotecas React para replicar esses visuais.

---

## 1. Panorama das Bibliotecas de Tabela/Grid

### Ranking por Popularidade

| Biblioteca | GitHub Stars | Weekly Downloads | Tipo | Licença |
|------------|--------------|------------------|------|---------|
| **TanStack Table** | 26k+ | 1.6M | Headless | MIT (Grátis) |
| **AG Grid** | 12k+ | 1.2M | Completo | MIT + Enterprise (pago) |
| **MUI X DataGrid** | 5.7k | 845K | Componente | MIT + Pro/Premium (pago) |
| **React Data Grid** | 5k+ | 500K | Completo | MIT (Grátis) |
| **Glide Data Grid** | 5k+ | 300K | Canvas | MIT (Grátis) |
| **Infinite Table** | 1k+ | 100K | Completo | MIT + Comercial |
| **Handsontable** | 19k+ | 800K | Spreadsheet | Comercial |
| **Syncfusion** | 5k+ | 400K | Enterprise | Community + Comercial |
| **KendoReact** | 3k+ | 200K | Enterprise | Comercial |
| **DevExtreme** | 2k+ | 150K | Enterprise | Comercial |

---

## 2. Análise Detalhada

### 2.1 TanStack Table (React Table v8)

**Links**:
- 🌐 Site: [https://tanstack.com/table](https://tanstack.com/table)
- 📦 GitHub: [https://github.com/TanStack/table](https://github.com/TanStack/table)
- 📚 Docs: [https://tanstack.com/table/docs](https://tanstack.com/table/docs)
- 🎮 Exemplos: [https://tanstack.com/table/docs/react/react-table](https://tanstack.com/table/docs/react/react-table)

**Descrição**: Biblioteca **headless** - fornece lógica (sort, filter, pagination) sem UI.

**Features**:
- ✅ Sorting (multi-coluna)
- ✅ Filtering (global, column, fuzzy)
- ✅ Pagination
- ✅ Row selection
- ✅ Column resizing
- ✅ Column pinning
- ✅ Row grouping (lógica apenas)
- ✅ Tree data (lógica apenas)
- ✅ Virtualization (via @tanstack/virtual)
- ✅ TypeScript excelente

**Para Power BI**:
- ✅ **Table visual**: Perfeito para tabelas simples
- ⚠️ **Matrix visual**: Precisa de implementação manual para hierarquia
- ✅ **Cross-filtering**: Fácil com onClick + estado
- ⚠️ **Drill-down**: Precisa de implementação custom

**Bundle**: ~15KB (headless) + ~10KB (virtual)

**Vantagens**:
- Total controle sobre UI
- Melhor para design systems custom
- Gratuito e MIT
- Flexibilidade máxima

**Desvantagens**:
- Precisa construir toda a UI
- Mais código para escrever
- Sem UI pronta

**Exemplo básico**:
```tsx
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

function Table({ data, columns }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

### 2.2 AG Grid

**Links**:
- 🌐 Site: [https://www.ag-grid.com](https://www.ag-grid.com)
- 📦 GitHub: [https://github.com/ag-grid/ag-grid](https://github.com/ag-grid/ag-grid)
- 📚 Docs: [https://www.ag-grid.com/react-data-grid/](https://www.ag-grid.com/react-data-grid/)
- 🎮 Exemplos: [https://www.ag-grid.com/example-gallery/](https://www.ag-grid.com/example-gallery/)
- 🎨 Themes: [https://www.ag-grid.com/themes/](https://www.ag-grid.com/themes/)

**Descrição**: Grid completo com UI pronta, mais próximo do Excel.

**Features**:
- ✅ Sorting (multi-coluna)
- ✅ Filtering (text, number, date, set, multi)
- ✅ Pagination
- ✅ Row selection (single, multi)
- ✅ Column resizing, pinning, grouping
- ✅ Row grouping (enterprise)
- ✅ Pivot tables (enterprise)
- ✅ Tree data (enterprise)
- ✅ Cell editing
- ✅ Row editing
- ✅ Clipboard (copy/paste)
- ✅ Excel export (enterprise)
- ✅ CSV export
- ✅ Server-side row model (enterprise)
- ✅ Virtualization built-in
- ✅ Integrated charts (enterprise)
- ✅ Master-detail (enterprise)

**Para Power BI**:
- ✅ **Table visual**: Perfeito, com todas as features
- ✅ **Matrix visual**: Pivot tables = matrix do Power BI
- ✅ **Cross-filtering**: Nativo via integrated charts
- ✅ **Drill-down**: Suportado em group hierarchies
- ✅ **Totais**: Agregação automática

**Bundle**: ~320KB (Community) / ~500KB+ (Enterprise)

**Licença**:
- Community: MIT (grátis)
- Enterprise: $999+/dev/ano

**Vantagens**:
- Mais completo do mercado
- UI pronta para usar
- Pivot tables (matrix)
- Integrated charts

**Desvantagens**:
- Bundle pesado
- Enterprise features são pagas
- Menos flexível que headless

**Exemplo básico**:
```tsx
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const columnDefs = [
  { field: 'product', rowGroup: true },
  { field: 'category' },
  { field: 'sales', aggFunc: 'sum' },
  { field: 'quantity' },
];

const defaultColDef = {
  sortable: true,
  filter: true,
  resizable: true,
};

function MyGrid({ rowData }) {
  return (
    <div className="ag-theme-alpine" style={{ height: 500 }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        rowSelection="multiple"
      />
    </div>
  );
}
```

---

### 2.3 MUI X DataGrid

**Links**:
- 🌐 Site: [https://mui.com/x/react-data-grid/](https://mui.com/x/react-data-grid/)
- 📦 GitHub: [https://github.com/mui/mui-x](https://github.com/mui/mui-x)
- 📚 Docs: [https://mui.com/x/react-data-grid/](https://mui.com/x/react-data-grid/)
- 🎮 Exemplos: [https://mui.com/x/react-data-grid/demo/](https://mui.com/x/react-data-grid/demo/)

**Descrição**: DataGrid para apps Material UI.

**Features**:
- ✅ Sorting
- ✅ Filtering
- ✅ Pagination
- ✅ Column pinning (Pro)
- ✅ Column resizing
- ✅ Row editing
- ✅ Cell editing
- ✅ Row grouping (Pro)
- ✅ Aggregation (Premium)
- ✅ Excel export (Pro)
- ✅ CSV export
- ✅ Virtualization (Pro para unlimited)

**Para Power BI**:
- ✅ **Table visual**: Bom para tabelas simples
- ⚠️ **Matrix visual**: Limitado (aggregation only no Premium)
- ✅ **Cross-filtering**: Fácil com selection

**Bundle**: ~165KB

**Licença**:
- Community: MIT (grátis)
- Pro: ~$180/dev/ano
- Premium: ~$360/dev/ano

**Vantagens**:
- Design Material UI integrado
- Bom para apps MUI existentes

**Desvantagens**:
- Enterprise features pagas
- Menos features que AG Grid

---

### 2.4 React Data Grid (Adazzle)

**Links**:
- 🌐 Site: [https://adazzle.github.io/react-data-grid/](https://adazzle.github.io/react-data-grid/)
- 📦 GitHub: [https://github.com/adazzle/react-data-grid](https://github.com/adazzle/react-data-grid)
- 📚 Docs: [https://adazzle.github.io/react-data-grid/](https://adazzle.github.io/react-data-grid/)
- 🎮 Exemplos: [https://adazzle.github.io/react-data-grid/](https://adazzle.github.io/react-data-grid/)

**Descrição**: Grid estilo Excel com foco em edição inline.

**Features**:
- ✅ Sorting
- ✅ Filtering
- ✅ Cell editing (onRowsChange)
- ✅ Row selection
- ✅ Column pinning
- ✅ Column resizing
- ✅ Copy/paste (Ctrl+C/V)
- ✅ Virtualization built-in
- ✅ Tree data (via plugin)

**Para Power BI**:
- ✅ **Table visual**: Excelente para edição
- ⚠️ **Matrix visual**: Limitado
- ✅ **Cross-filtering**: Fácil

**Bundle**: ~90KB

**Vantagens**:
- Copy/paste nativo
- Edição estilo Excel
- Bundle menor que AG Grid

**Desvantagens**:
- Sem pivot tables
- Sem row grouping avançado

---

### 2.5 Glide Data Grid

**Links**:
- 🌐 Site: [https://grid.glideapps.com](https://grid.glideapps.com)
- 📦 GitHub: [https://github.com/glideapps/glide-data-grid](https://github.com/glideapps/glide-data-grid)
- 📚 Docs: [https://grid.glideapps.com/docs/](https://grid.glideapps.com/docs/)

**Descrição**: Grid baseado em Canvas para performance máxima.

**Features**:
- ✅ Canvas rendering
- ✅ Virtualization
- ✅ Cell editing
- ✅ Column resizing
- ✅ Row selection
- ✅ Sorting
- ✅ Filtering
- ✅ Millions of rows

**Para Power BI**:
- ✅ **Table visual**: Performance máxima
- ⚠️ **Matrix visual**: Não suporta
- ✅ **Cross-filtering**: Fácil

**Bundle**: ~60KB

**Vantagens**:
- Performance.Canvas (milhões de linhas)
- Bundle pequeno

**Desvantagens**:
- Sem pivot/matrix
- Menos features que AG Grid

---

### 2.6 Handsontable

**Links**:
- 🌐 Site: [https://handsontable.com](https://handsontable.com)
- 📦 GitHub: [https://github.com/handsontable/handsontable](https://github.com/handsontable/handsontable)
- 📚 Docs: [https://handsontable.com/docs/](https://handsontable.com/docs/)
- 🎮 Exemplos: [https://handsontable.com/examples](https://handsontable.com/examples)

**Descrição**: Spreadsheet completo para web.

**Features**:
- ✅ Excel-like completo
- ✅ Cell editing
- ✅ Copy/paste
- ✅ Sorting
- ✅ Filtering
- ✅ Merge cells
- ✅ Comments
- ✅ Validation
- ✅ Import/Export Excel

**Para Power BI**:
- ✅ **Table visual**: Excelente
- ⚠️ **Matrix visual**: Limitado
- ✅ **Cross-filtering**: Fácil

**Bundle**: ~200KB+

**Licença**: Comercial (precisa de licença)

**Vantagens**:
- Mais parecido com Excel
- Spreadsheet completo

**Desvantagens**:
- Licença paga
- Não open-source para uso comercial

---

### 2.7 Infinite Table

**Links**:
- 🌐 Site: [https://infinite-table.com](https://infinite-table.com)
- 📦 GitHub: [https://github.com/infinite-table/infinite-react-table](https://github.com/infinite-table/infinite-react-table)
- 📚 Docs: [https://infinite-table.com/docs/](https://infinite-table.com/docs/)

**Descrição**: Grid de alta performance para React.

**Features**:
- ✅ Virtualization (row + column)
- ✅ Sorting
- ✅ Filtering
- ✅ Grouping
- ✅ Aggregation
- ✅ Tree data
- ✅ Cell editing
- ✅ Column pinning
- ✅ Server-side data

**Para Power BI**:
- ✅ **Table visual**: Excelente
- ✅ **Matrix visual**: Grouping + aggregation
- ✅ **Cross-filtering**: Fácil

**Bundle**: ~150KB

**Vantagens**:
- Performance excelente
- React-first API
- Grouping nativo

**Desvantagens**:
- Menor comunidade
- Licença comercial para suporte

---

## 3. Tabela Comparativa: Features Power BI

| Feature | Power BI | TanStack | AG Grid | MUI X | RDG | Glide | Infinite |
|---------|----------|----------|---------|-------|-----|-------|----------|
| **Tabela simples** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Matrix/Matrix** | ✅ | ⚠️ Manual | ✅ Enterprise | ⚠️ Premium | ❌ | ❌ | ✅ Group |
| **Row grouping** | ✅ | ⚠️ Lógica | ✅ Enterprise | ✅ Pro | ❌ | ❌ | ✅ |
| **Pivot tables** | ✅ | ❌ | ✅ Enterprise | ⚠️ Premium | ❌ | ❌ | ❌ |
| **Tree expand/collapse** | ✅ | ⚠️ Manual | ✅ Enterprise | ⚠️ | ✅ Plugin | ❌ | ✅ |
| **Totais/Aggregations** | ✅ | ⚠️ Manual | ✅ Enterprise | ✅ Premium | ❌ | ❌ | ✅ |
| **Cell editing** | ⚠️ | ⚠️ DIY | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Copy/paste** | ✅ | ❌ | ✅ Enterprise | ❌ | ✅ | ❌ | ❌ |
| **Export Excel** | ✅ | ❌ | ✅ Enterprise | ✅ Pro | ❌ | ❌ | ❌ |
| **Export CSV** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Cross-filtering** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Virtualização** | ✅ | ✅ Virtual | ✅ | ✅ Pro | ✅ | ✅ Canvas | ✅ |
| **Sorting** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Filtering** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Column pinning** | ✅ | ✅ | ✅ | ✅ Pro | ✅ | ❌ | ✅ |

---

## 4. Recomendação para Clone Power BI

### 4.1 Para Table Visual (Tabela Simples)

**Recomendação**: **TanStack Table** ou **React Data Grid**

| Opção | Prós | Contras |
|-------|------|---------|
| **TanStack Table** | Gratuito, flexível, headless | Precisa construir UI |
| **React Data Grid** | Pronto, copy/paste, MIT | Menos flexível |

**Por quê?**:
- Table visual do Power BI é relativamente simples
- Sort, filter, column resize são básicos
- Não precisa de pivot tables
- Cross-filtering é só onClick

### 4.2 Para Matrix Visual (Matriz Hierárquica)

**Recomendação**: **AG Grid** (Enterprise) ou **Infinite Table**

| Opção | Prós | Contras |
|-------|------|---------|
| **AG Grid Enterprise** | Pivot tables, grouping, totais | Licença paga ($999+/dev/ano) |
| **Infinite Table** | Grouping, aggregation, MIT | Menor que AG Grid |

**Por quê?**:
- Matrix visual = Pivot table + Tree data
- Precisa de row grouping com expand/collapse
- Precisa de aggregations (SUM, COUNT, etc.)
- AG Grid é o mais próximo do Power BI Matrix

### 4.3 Estratégia Recomendada

```
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard Tables                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Camada de Abstração                       │   │
│  │  - TableComponent interface                         │   │
│  │  - MatrixComponent interface                        │   │
│  │  - Cross-filter state                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│         ┌──────────────────┴──────────────────┐            │
│         ▼                                      ▼            │
│  ┌─────────────┐                       ┌─────────────┐     │
│  │ Table Visual │                       │Matrix Visual│     │
│  │  (TanStack)  │                       │  (AG Grid)  │     │
│  └─────────────┘                       └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Alternativa Mais Barata**:
- Usar **TanStack Table** para AMBOS
- Implementar grouping manual para matrix
- Custo: $0 (mas mais código)

---

## 5. Código: Interface Padrão

```typescript
// src/studio/types/table-visual.ts

export interface TableColumn {
  id: string;
  field: string;
  headerName: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  aggregable?: boolean;
  aggregations?: ('sum' | 'avg' | 'count' | 'min' | 'max')[];
  type: 'text' | 'number' | 'date' | 'currency' | 'boolean';
  format?: string;
}

export interface TableVisual {
  type: 'table' | 'matrix';
  columns: TableColumn[];
  rows: unknown[];
  
  // Matrix-specific
  rowFields?: string[]; // Fields para row grouping
  columnFields?: string[]; // Fields para column headers
  valueFields?: string[]; // Fields para values
  expandState?: Record<string, boolean>; // Which groups are expanded
  
  // Features
  sorting?: { field: string; direction: 'asc' | 'desc' }[];
  filtering?: Record<string, unknown>;
  pagination?: { page: number; pageSize: number };
  
  // Cross-filter
  crossFilter?: {
    field: string;
    value: unknown;
  };
}
```

---

## 6. Conclusão

### Para Table Visual:
- **TanStack Table** (se quiser controle total)
- **React Data Grid** (se quiser pronto + copy/paste)

### Para Matrix Visual:
- **AG Grid Enterprise** (mais completo, mas paga)
- **Infinite Table** (MIT, grouping nativo)
- **TanStack Table** (grátis, grouping manual)

### Recomendação Final:

| Componente | Biblioteca | Custo |
|------------|------------|-------|
| **Table Visual** | TanStack Table | $0 |
| **Matrix Visual** | AG Grid Community ou Infinite Table | $0-999/ano |

### Se o orçamento for apertado:
Usar **TanStack Table** para ambos e implementar grouping manual.

### Se precisar de features Power BI:
Investir em **AG Grid Enterprise** para o Matrix visual.

---

*Estudo atualizado em: 2026-08-04*
