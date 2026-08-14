# Viewer — Plano Backend

## Status: 🟡 Parcialmente Implementado

O Viewer tem correções de renderização, mas falta carregamento do servidor e filtros interativos.

---

## O que foi feito

### 1. Snapshot completo (Editor → Viewer)
- `textBoxes` incluído no snapshot
- `syncedFilters` incluído no snapshot

### 2. Renderização padronizada
- Cards com `bg-white dark:bg-neutral-800 rounded-lg shadow-md border-2`
- Title bar com mesmo estilo do editor
- `measureFormats` conectado ao ChartRenderer
- TextBoxes renderizados com formatação

---

## O que falta

### Fase 1 — Carregamento do Servidor

**Problema**: O viewer lê de `localStorage` (snapshot). Se o editor muda após abrir o viewer, o viewer fica desatualizado.

**Solução**:
- Criar `GET /api/studio/dashboards/{id}` para buscar definição do dashboard
- Substituir localStorage por fetch ao servidor
- Adicionar auth check (quem pode visualizar)

```
GET /api/studio/dashboards/{id}
→ { pages, dataModel, globalFilters, pageFilters, visualFilters, textBoxes, ... }
```

### Fase 2 — Queries em Tempo Real

**Problema**: `queryResults` é snapshot congelado. Dados podem estar stale.

**Solução**:
- Reusar `useVisualQuery` hook do Editor
- Viewer carrega dashboard → executa queries para cada visual → renderiza
- Queries são re-executadas quando filtros mudam

### Fase 3 — Filtros Interativos

**Problema**: O viewer não tem UI de filtros. Não é possível interagir com os dados.

**Solução**:
- Adicionar barra de filtros no viewer
- Filtros globais e por página
- Cross-filter: clicar em um visual afeta outros
- Drill-down: duplo-clique para detalhar

### Fase 4 — Compartilhamento

| Feature | Implementação |
|---------|---------------|
| URL com estado | `?page=2&filters={...}` |
| Embed mode | `?embed=1` |
| Export PDF/imagem | Puppeteer ou html2canvas |
| Access control | Token-based sharing |

---

## API Endpoints Necessários

| Endpoint | Método | Função | Prioridade |
|----------|--------|--------|-----------|
| `/api/studio/dashboards/{id}` | GET | Buscar definição do dashboard | **CRÍTICA** |
| `/api/studio/dashboards/{id}` | PUT | Salvar dashboard completo | **CRÍTICA** |
| `/api/studio/dashboards/{id}` | DELETE | Deletar dashboard | Alta |
| `/api/studio/query` | POST | Executar query de um visual | **CRÍTICA** |
| `/api/studio/query/batch` | POST | Executar múltiplas queries (load inicial) | Média |

---

## Mudanças no StudioViewer

| Item | Status |
|------|--------|
| Card wrapper | ✅ Feito |
| measureFormats | ✅ Feito |
| textBoxes | ✅ Feito |
| cross-filter props | 🔴 Pendente |
| drill-down props | 🔴 Pendente |
| Loading states | 🔴 Pendente |
| Error boundary | 🔴 Pendente |
| Header com título | 🔴 Pendente |
| Filtros UI | 🔴 Pendente |

---

## Padrões Verificados no Código

### `POST /api/studio/dashboards` — Sem Validação

```typescript
// Body aceito: { dashboardId: string, data: any }
// NÃO há validação de schema — qualquer campo pode ser salvo
await adminDb.collection('studio_dashboards').doc(dashboardId).set({
  ...data,
  updatedAt: new Date().toISOString(),
}, { merge: true });
```

**Risco**: Para o Viewer server-side loading, é CRÍTICO criar `GET` e `PUT` com validação de schema para garantir que os dados retornados são consistentes.

### `loadStudioConnection()` — Padrão Duplicado

A função de conexão está duplicada em `preview-table` e `import-schema`. Para criar `GET /api/studio/dashboards/:id`, copiar a mesma função ou extrair para shared helper.
