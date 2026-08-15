# Estudo Completo: Bibliotecas de Visuais para Dashboard Web
## Foco: Migração do Power BI para Plataforma Web

---

## Sumário Executivo

Este estudo analisa **12 bibliotecas de visualização** para React, com foco específico na migração do Power BI para uma plataforma web própria. O Power BI oferece cross-filtering, drill-down, drill-through e interações avançadas como padrão. Nossa objetivo é replicar essas funcionalidades na web.

---

## 1. Panorama das Bibliotecas (2026)

### Ranking por Popularidade

| Biblioteca | GitHub Stars | Weekly Downloads | Rendering | Principal Vantagem |
|------------|--------------|------------------|-----------|-------------------|
| **Recharts** | 27k+ | 48.9M | SVG | React-first, fácil uso |
| **Apache ECharts** | 66.3k | 2.6M | Canvas/SVG | Features completas |
| **MUI X Charts** | 5.7k | 747K | SVG | Integração Material UI |

---

## 2. Análise Detalhada por Biblioteca

### 2.1 Recharts (Já instalado ✅)

**Links**:
- 🌐 Site: [https://recharts.org](https://recharts.org)
- 📦 GitHub: [https://github.com/recharts/recharts](https://github.com/recharts/recharts)
- 📚 Docs: [https://recharts.org/en-US/api](https://recharts.org/en-US/api)
- 🎮 Exemplos: [https://recharts.org/en-US/examples](https://recharts.org/en-US/examples)

**Descrição**: Biblioteca declarativa built on D3, 100% React components.

**Gráficos**:
- Line, Area, Bar, Pie, Donut
- Scatter, Bubble, Radar, RadialBar
- Treemap, Composed (mix)

**Cross-Filtering**:
- ❌ Não nativo
- Implementação manual via `onClick` + estado global
- Exemplo: `<Bar onClick={(data) => setFilter(data.category)} />`

**Drill-Down**:
- ❌ Não nativo
- Requer controle manual de estados e dados

**Drill-Through**:
- ❌ Não nativo
- Navegação via React Router/Next.js

**Performance**:
- Até 5.000 pontos: ✅ Excelente
- 5.000-10.000: ⚠️ Limitações
- 10.000+: ❌ Lento (SVG)

**Bundle**: ~136KB gzipped (tree-shake para ~50KB)

**Vantagens para nosso caso**:
- ✅ Já instalado e funcionando
- ✅ API React nativa (JSX)
- ✅ shadcn/ui integration
- ✅ TypeScript support
- ✅ Boa documentação

**Desvantagens**:
- ❌ Sem cross-filtering nativo
- ❌ Performance limitada com muitos dados
- ❌ Sem drill-down/drill-through

---

### 2.2 Apache ECharts

**Links**:
- 🌐 Site: [https://echarts.apache.org](https://echarts.apache.org)
- 📦 GitHub: [https://github.com/apache/echarts](https://github.com/apache/echarts)
- 📚 Docs: [https://echarts.apache.org/en/option.html](https://echarts.apache.org/en/option.html)
- 🎮 Exemplos: [https://echarts.apache.org/examples/](https://echarts.apache.org/examples/)
- 📦 React Wrapper: [https://github.com/hustcc/echarts-for-react](https://github.com/hustcc/echarts-for-react)

**Descrição**: Biblioteca enterprise com 50+ tipos de gráficos, suporta Canvas e WebGL.

**Gráficos**:
- Básicos: Line, Bar, Pie, Scatter, Gauge
- Intermediários: Heatmap, Treemap, Sunburst, Radar, Funnel
- Avançados: Sankey, Graph, Map, Calendar, Candlestick, 3D

**Cross-Filtering**:
- ✅ Nativo via `dispatchAction`
- Suporte a seleção múltipla
- Eventos integrados

**Drill-Down**:
- ✅ Nativo em Sunburst, Treemap, Tree
- Breadcrumb navigation automática
- Zoom hierárquico

**Drill-Through**:
- ⚠️ Parcial (navegação via eventos)

**Performance**:
- Até 100.000 pontos: ✅ Excelente (Canvas)
- 100.000+: ✅ WebGL support
- Real-time updates: ✅

**Bundle**: ~520KB (tree-shake para ~80-130KB)

**Vantagens para nosso caso**:
- ✅ Features mais completas do mercado
- ✅ Performance superior
- ✅ Cross-filtering nativo
- ✅ Drill-down em hierarquias
- ✅ Suporte a mapas
- ✅ Temas e customização extensiva

**Desvantagens**:
- ❌ API de configuração (não React-first)
- ❌ Bundle maior
- ❌ Curva de aprendizado mais alta
- ❌ Wrapper React (echarts-for-react)

---

### 2.11 MUI X Charts

**Links**:
- 🌐 Site: [https://mui.com/x/react-charts/](https://mui.com/x/react-charts/)
- 📦 GitHub: [https://github.com/mui/mui-x](https://github.com/mui/mui-x)
- 📚 Docs: [https://mui.com/x/react-charts/](https://mui.com/x/react-charts/)
- 🎮 Exemplos: [https://mui.com/x/react-charts/](https://mui.com/x/react-charts/)

**Descrição**: Charts para apps Material UI.

**Gráficos**:
- Bar, Line, Pie, Scatter, Radar
- Gauge

**Cross-Filtering**:
- ⚠️ Limitado

**Performance**:
- SVG: Até 5.000 pontos

**Bundle**: ~165KB (zero marginal se já usa MUI)

**Vantagens**:
- ✅ Se já usa Material UI

**Desvantagens**:
- ❌ Poucos tipos de gráficos
- ❌ Menos features que ECharts

---

## 3. Tabela Comparativa: Funcionalidades Power BI

| Feature | Power BI | Recharts | ECharts | Nivo | Chart.js | Visx | Highcharts |
|---------|----------|----------|---------|------|----------|------|------------|
| **Cross-Filtering** | ✅ Nativo | ❌ Manual | ✅ Nativo | ⚠️ Parcial | ✅ Simples | ✅ Total | ✅ Nativo |
| **Drill-Down** | ✅ Nativo | ❌ Manual | ✅ Nativo | ⚠️ Parcial | ❌ | ✅ Total | ✅ Nativo |
| **Drill-Through** | ✅ Nativo | ❌ Manual | ⚠️ Eventos | ❌ | ❌ | ✅ Total | ⚠️ |
| **Slicers/Filtros** | ✅ Nativo | ❌ Custom | ❌ Custom | ❌ Custom | ❌ Custom | ❌ Custom | ❌ Custom |
| **Bookmarks** | ✅ Nativo | ❌ Custom | ❌ Custom | ❌ Custom | ❌ Custom | ❌ Custom | ❌ Custom |
| **Tooltips Custom** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Legend interativa** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Zoom/Pan** | ✅ | ❌ | ✅ | ⚠️ | ⚠️ Plugins | ❌ | ✅ |
| **Animações** | ✅ | ✅ | ✅ | ✅✅ | ✅ | ✅ D3 | ✅ |
| **Export PDF/Imagem** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Real-time** | ⚠️ | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ | ✅ |
| **3D Charts** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Mapas** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 4. Arquitetura: Cross-Filtering entre Bibliotecas Diferentes

### 4.1 O problema

Se usarmos Recharts para uns gráficos e ECharts para outros, como fazer o cross-filtering funcionar entre eles?

### 4.2 Solução: Camada de Abstração

```
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard State                          │
│  (crossFilter, drillState, filters, selectedData)          │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Recharts    │   │   ECharts     │   │    Nivo       │
│   (BarChart)  │   │  (PieChart)   │   │  (Heatmap)    │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                    ┌───────────────┐
                    │ 统一事件处理   │
                    │ Event Bridge  │
                    └───────────────┘
```

### 4.3 Implementação Prática

#### 4.3.1 Interface Padrão para Cross-Filter

```typescript
// src/studio/types/cross-filter.ts

export interface CrossFilterEvent {
  sourceVisualId: string;
  sourceChartType: string;
  field: string;
  value: unknown;
  operator: 'eq' | 'in' | 'gt' | 'lt' | 'between';
}

export interface ChartComponentProps {
  data: unknown[];
  crossFilter: CrossFilterState | null;
  onCrossFilter: (event: CrossFilterEvent) => void;
  onDrillDown?: (data: unknown) => void;
  onDrillUp?: () => void;
  drillLevel?: number;
}

export interface CrossFilterState {
  field: string;
  value: unknown;
  sourceVisualId: string;
}
```

#### 4.3.2 Event Bridge Universal

```typescript
// src/studio/lib/chart-event-bridge.ts

import { CrossFilterEvent } from '../types/cross-filter';

// Estado global de cross-filter
let globalCrossFilter: CrossFilterState | null = null;
const listeners: Set<(filter: CrossFilterState | null) => void> = new Set();

export function setCrossFilter(event: CrossFilterEvent | null) {
  globalCrossFilter = event ? {
    field: event.field,
    value: event.value,
    sourceVisualId: event.sourceVisualId,
  } : null;
  
  listeners.forEach(listener => listener(globalCrossFilter));
}

export function subscribeToCrossFilter(callback: (filter: CrossFilterState | null) => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// Hook React
export function useCrossFilter() {
  const [filter, setFilter] = useState<CrossFilterState | null>(null);
  
  useEffect(() => {
    return subscribeToCrossFilter(setFilter);
  }, []);
  
  return filter;
}
```

#### 4.3.3 Wrapper para Recharts com Cross-Filter

```typescript
// src/studio/components/charts/wrappers/RechartsBarWrapper.tsx

import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useCrossFilter, setCrossFilter } from '../../../lib/chart-event-bridge';

export function RechartsBarWrapper({ data, visualId, xAxisKey, yAxisKey }) {
  const crossFilter = useCrossFilter();
  
  const handleClick = (data) => {
    setCrossFilter({
      sourceVisualId: visualId,
      field: xAxisKey,
      value: data[xAxisKey],
      operator: 'eq',
    });
  };
  
  const isFiltered = crossFilter?.sourceVisualId !== visualId && 
                     crossFilter?.field === xAxisKey;
  
  return (
    <BarChart data={data}>
      <XAxis dataKey={xAxisKey} />
      <YAxis />
      <Tooltip />
      <Bar 
        dataKey={yAxisKey}
        onClick={handleClick}
        fill={isFiltered ? '#FFB03F' : '#666'}
        opacity={isFiltered && crossFilter?.value !== data[xAxisKey] ? 0.3 : 1}
      />
    </BarChart>
  );
}
```

#### 4.3.4 Wrapper para ECharts com Cross-Filter

```typescript
// src/studio/components/charts/wrappers/EChartsPieWrapper.tsx

import ReactECharts from 'echarts-for-react';
import { useCrossFilter, setCrossFilter } from '../../../lib/chart-event-bridge';

export function EChartsPieWrapper({ data, visualId, nameKey, valueKey }) {
  const crossFilter = useCrossFilter();
  
  const option = {
    series: [{
      type: 'pie',
      data: data.map(d => ({
        name: d[nameKey],
        value: d[valueKey],
        itemStyle: {
          opacity: crossFilter && 
                   crossFilter.sourceVisualId !== visualId &&
                   crossFilter.field === nameKey &&
                   crossFilter.value !== d[nameKey]
                   ? 0.3
                   : 1,
        },
      })),
    }],
  };
  
  const onEvents = {
    click: (params) => {
      setCrossFilter({
        sourceVisualId: visualId,
        field: nameKey,
        value: params.name,
        operator: 'eq',
      });
    },
  };
  
  return <ReactECharts option={option} onEvents={onEvents} />;
}
```

#### 4.3.5 Wrapper para Nivo com Cross-Filter

```typescript
// src/studio/components/charts/wrappers/NivoBarWrapper.tsx

import { ResponsiveBar } from '@nivo/bar';
import { useCrossFilter, setCrossFilter } from '../../../lib/chart-event-bridge';

export function NivoBarWrapper({ data, visualId, indexBy, keys }) {
  const crossFilter = useCrossFilter();
  
  return (
    <ResponsiveBar
      data={data}
      indexBy={indexBy}
      keys={keys}
      onClick={(data) => {
        setCrossFilter({
          sourceVisualId: visualId,
          field: indexBy,
          value: data.data[indexBy],
          operator: 'eq',
        });
      }}
      theme={{
        // Highlight filtered
      }}
    />
  );
}
```

### 4.4 Conclusão: É possível usar bibliotecas diferentes?

**SIM, é possível**, mas requer:
1. **Camada de abstração** (event bridge)
2. **Interface padrão** para todos os gráficos
3. **Hook React** para sincronizar estado
4. **Wrappers** para cada biblioteca

**Complexidade**: Média-Alta
**Manutenção**: Maior (wrappers para cada lib)

---

## 5. Análise para Caso Power BI → Web

### 5.1 O que o Power BI oferece

| Feature | Importância | Dificuldade de Replicar |
|---------|-------------|------------------------|
| Cross-filtering | 🔴 Crítica | Média |
| Drill-down | 🔴 Crítica | Média |
| Drill-through | 🟡 Média | Baixa |
| Slicers | 🔴 Crítica | Baixa |
| Bookmarks | 🟡 Média | Média |
| Formatação condicional | 🟡 Média | Baixa |
| Medidas DAX | 🔴 Crítica | Alta (usamos SQL) |
| Export | 🟢 Baixa | Baixa |

### 5.2 Recomendação: Estratégia Híbrida

#### Abordagem Recomendada

```
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard Framework                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Camada de Abstração (Event Bridge)        │   │
│  │  - Cross-filter state management                    │   │
│  │  - Drill-down state management                      │   │
│  │  - Filter synchronization                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│  ┌────────────┬────────────┼────────────┬────────────┐     │
│  │            │            │            │            │     │
│  ▼            ▼            ▼            ▼            ▼     │
│ Recharts   ECharts      Nivo       Chart.js      Visx     │
│ (Básicos)  (Complexos)  (Design)  (Performance)  (Custom) │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Estratégia por Tipo de Gráfico

| Gráfico | Biblioteca | Razão |
|---------|------------|-------|
| **Bar Chart** | Recharts | Já instalado, simples |
| **Line Chart** | Recharts | Já instalado, simples |
| **Pie/Donut** | ECharts | Melhor interatividade |
| **Treemap** | Nivo | Design superior |
| **Heatmap** | Nivo | Canvas mode para performance |
| **Scatter** | Recharts | Simples |
| **Gauge** | ECharts | Mais opções |
| **Sankey** | ECharts | Único que suporta nativamente |
| **Sunburst** | ECharts | Drill-down nativo |
| **Mapa** | ECharts | Único com mapas |
| **KPI Card** | Custom (HTML) | Total controle |
| **Tabela** | AG Grid ou custom | Se precisar de grid |

---

## 6. Recomendação Final

### 6.1 Para Nosso Caso (Migração Power BI)

**Recomendação Principal: ECharts como base + Recharts para simples**

Por quê?
1. **Cross-filtering nativo** em ECharts
2. **Drill-down nativo** em hierarquias
3. **Performance Canvas** para dados reais
4. **50+ tipos de gráficos** para cobrir todas as necessidades
5. **Mapas e visuais especiais** inclusos

**Manter Recharts** para:
- Gráficos básicos (bar, line, scatter)
- Componentes simples e rápidos
- Integração com shadcn/ui existente

### 6.2 Se não quiser misturar bibliotecas

**Opção A: Só ECharts**
- Pros: Mais features, cross-filter nativo
- Cons: Bundle maior, API não React-first

**Opção B: Só Recharts + extensões**
- Pros: Já instalado, React-first
- Cons: Cross-filter manual, menos tipos

**Opção C: Só Nivo**
- Pros: Design excelente, acessível
- Cons: Cross-filter limitado

### 6.3 Para Cross-Filtering entre Bibliotecas

**É totalmente viável**, mas requer:
- Camada de abstração (Event Bridge)
- Interface padrão para todos os gráficos
- Hooks React para sincronização
- Wrappers para cada biblioteca

**Complexidade**: Média-Alta
**Tempo estimado**: 2-3 dias para implementar base

---

## 7. Próximos Passos Recomendados

### Fase 1: Fundação (1-2 dias)
1. Criar `CrossFilterContext` global
2. Criar `EventBridge` para sincronizar eventos
3. Criar interface padrão `ChartComponentProps`

### Fase 2: Wrappers (2-3 dias)
1. Wrapper para Recharts (Bar, Line, Pie)
2. Wrapper para ECharts (Treemap, Sankey, Heatmap, Gauge)
3. Wrapper para Nivo (se necessário)

### Fase 3: Features Power BI (3-5 dias)
1. Cross-filtering completo
2. Drill-down com breadcrumb
3. Drill-through com navegação

### Fase 4: Polish (1-2 dias)
1. Animações
2. Tooltips customizados
3. Export

---

## 8. Conclusão

### Para um clone do Power BI:

1. **Melhor biblioteca única**: Apache ECharts
   - Mais features, cross-filter nativo, performance
   
2. **Melhor组合 (combo)**: ECharts + Recharts
   - ECharts para visuais complexos
   - Recharts para visuais simples e rápidos

3. **Cross-filtering entre libs**: Viável com Event Bridge
   - Requer camada de abstração
   - Complexidade média-alta

4. **Para começar agora**:
   - Implementar Event Bridge
   - Adicionar ECharts para treemap/sankey/heatmap
   - Manter Recharts para bar/line/scatter
   - Implementar cross-filtering progressivamente

---

*Estudo atualizado em: 2026-08-04*
*Próxima revisão: Após implementação da Fase 1*
