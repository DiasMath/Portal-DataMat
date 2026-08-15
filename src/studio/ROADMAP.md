# Studio Roadmap


## Próximas Fases

### Fase 7 — Cross-Filter nos Visuais
- BarChart: já funciona (parcial)
- PieChart: adicionar click handler
- LineChart: adicionar click handler (area mode)
- ScatterChart: adicionar visual feedback
- TreemapChart: adicionar click handler
- ComboChart: adicionar click handler
- TableVisual: adicionar click handler
- KpiCard: adicionar click handler
- Separar cross-filter de drill-down (drill = duplo-clique ou Ctrl+click)

### Fase 8 — Drill-Down nos Visuais
- Adicionar `onDrillUp` como prop em CanvasItem
- BarChart: UI de drill (duplo-clique ou botão)
- LineChart, PieChart, ScatterChart, TreemapChart, ComboChart: drill handlers
- Breadcrumb de drill no visual (ex: "Produto > Categoria > Subcategoria")

### Fase 8.5 — Viewer Interativo
- Passar cross-filter/drill props para ChartRenderer no Viewer
- Permitir interação no modo visualização
- Medidas formatadas no Viewer

### Fase 9 — TextBox Visual ✅
- Novo visual tipo `TextBox` para títulos/anotações
- Editor de rich text (negrito, itálico, cor, alinhamento)
- Arrastar e redimensionar

### Fase 10 — Condicional Formatting
- Regras de formatação por valor (ex: > 100 = verde)
- Cores dinâmicas em KPI cards
- Ícones condicionais

### Fase 11 — Drill-Through
- Botão de drill-through em visuais
- Navegação para página de detalhe
- Filtros automáticos na página de destino
- Botão de retorno

### Fase 12 — Filtros Globais e Sincronizados ✅
- Filtros sincronizados entre páginas (Toggle sync em cada filtro)
- Filtros globais (aplicam em todas as páginas)
- Novo filtro (botão no ribbon abre o painel de filtros)

### Fase 13 — Validação de Medidas ✅
- Validação de sintaxe SQL (parênteses, aspas, caracteres)
- Validação de nomes de tabelas e campos contra o DataModel
- Erros inline no MeasureEditor com sugestões de correção
- Bloqueio de save quando há erros

### Fase 14 — Biblioteca de Medidas Prontas
- Gallery de medidas pré-definidas (Receita Total, Custo Médio, etc.)
- Templates de funções SQL comuns (YTD, MoM, YoY)
- Inserção rápida com um clique
- Categorias: Vendas, Financeiro, RH, etc.

### Fase 15 — Funções Customizadas
- Criar funções reutilizáveis (ex: `RECEITA_LIQUIDA = SUM(vendas.valor) - SUM(vendas.desconto)`)
- Biblioteca de funções do usuário
- Autocomplete de funções customizadas
- Compartilhar funções entre medidas

### Fase 16 — Melhoria dos Painéis Laterais
- Ícones de tipo nos campos (Data, Número, Texto, Boolean)
- Indicador de medida (Σ) nos campos calculados
- Labels de cardinalidade nas relações (1:N, 1:1)
- Auto-layout no ModelView
- Preview de dados (hover)
- Criar relacionamento por drag
- Formatar SQL
- Histórico de queries

---

## Ideias Futuras (Backlog)

### Tema
- Paleta de cores global
- Galeria de temas pré-definidos
- Tema customizado (import JSON)
- Fonte global do relatório

### Bookmarks
- Salvar estados de filtro/zoom
- Botões para alternar entre bookmarks
- Compartilhar bookmarks

### Exportar
- Exportar página como PDF
- Exportar dashboard inteiro
- Exportar como imagem

### Colaboração
- Múltiplos autores simultâneos
- Comentários em visuais
- Histórico de alterações

### Acessibilidade
- Navegação por teclado completa
- Screen reader support
- Alto contraste
