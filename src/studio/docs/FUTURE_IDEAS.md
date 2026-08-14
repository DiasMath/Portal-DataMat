# Studio — Ideias Futuras

Ideias e features que podem ser implementadas no futuro.

---

## UI dos Visuais

### Importar Fonte Customizada
- Upload de arquivos TTF/OTF/WOFF para uso nos titulos dos visuais
- Persistir fontes no dashboard (base64 ou URL externa)
- SelectInput com lista de fontes do sistema + fontes importadas
- Preview da fonte antes de aplicar
- Considerar limites de tamanho (max 500KB por fonte)

### Mais Propriedades de Titulo
- Underline, strikethrough
- Letter spacing
- Line height
- Text shadow
- Gradiente de texto

### Efeitos Visuais
- Glassmorphism (blur + transparencia)
- Gradiente de fundo
- Border image
- Clip path

---

## Performance

### Lazy Loading de Visuais
- Renderizar apenas visuais visiveis no viewport
- Usar Intersection Observer
- Placeholder enquanto carrega

### Virtualizacao do Canvas
- Para dashboards com muitos visuais (>50)
- Renderizar apenas visuais proximos ao viewport

---

## Dados

### Conexoes em Tempo Real
- WebSocket para atualizacao automatica dos dados
- Polling configuravel (5s, 10s, 30s, 1min)
- Indicador de "dados atualizados em..."

### Cache de Queries
- Cache por hash da query + connectionId
- TTL configuravel (5min, 10min, 30min)
- Botao "Limpar cache" por visual

---

## Colaboracao

### Compartilhamento
- URL com estado (filtros, pagina ativa)
- Embed mode (iframe)
- Token-based sharing
- Permissoes (visualizar, editar, admin)

### Comentarios
- Comentarios por visual
- Comentarios por pagina
- Threads de discusao

---

## Export

### Export PDF
- Puppeteer ou html2canvas
- Export de pagina unica ou todas
- Configuracoes de qualidade

### Export Imagem
- PNG, JPG, SVG
- Resolucao configuravel
- Clipboard (copiar imagem)

### Export Dados
- CSV dos visuais
- Excel com multipas
- JSON dos dados brutos
