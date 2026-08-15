# Estudo: Cartões KPI e Cards para Dashboard
## Foco: Clone do Power BI

---

## Sumário

O Power BI possui vários tipos de cartões:
1. **KPI Card**: Mostra um valor único com indicador de tendência
2. **Card (Value Card)**: Mostra um valor simples
3. **Multi-row Card**: Múltiplos valores em um cartão
4. **Gauge Card**: Medidor com meta
5. **Image Card**: Cartão com imagem
6. **Web Content Card**: HTML/iframe

Este estudo analisa como implementar esses visuais em React.

---

## 1. Tipos de Cartões no Power BI

### 1.1 KPI Card (Cartão KPI)

**O que é**: Mostra um valor único com comparação temporal

**Features**:
- Valor principal (ex: R$ 1.234.567)
- Indicador de tendência (↑↓→)
- Variação percentual (ex: +12,5% vs mês anterior)
- Meta/Target (ex: R$ 1.500.000)
- Formatação condicional (verde/vermelho)

**Exemplo Power BI**:
```
┌─────────────────────────────┐
│  Receita Total              │
│  R$ 1.234.567              │
│  ↑ +12,5% vs mês anterior  │
│  Meta: R$ 1.500.000        │
└─────────────────────────────┘
```

### 1.2 Card (Cartão de Valor)

**O que é**: Mostra um valor único simples

**Features**:
- Valor principal
- Label
- Formatação (moeda, percentual, etc.)

**Exemplo Power BI**:
```
┌─────────────────────────────┐
│  Total de Vendas            │
│  1.234.567                  │
└─────────────────────────────┘
```

### 1.3 Multi-row Card

**O que é**: Múltiplos valores em um cartão

**Features**:
- Vários valores com labels
- Layout vertical ou horizontal
- Formatação individual

**Exemplo Power BI**:
```
┌─────────────────────────────┐
│  Receita    R$ 1.234.567    │
│  Custos     R$ 456.789      │
│  Lucro      R$ 777.778      │
│  Margem     63,0%           │
└─────────────────────────────┘
```

### 1.4 Gauge Card (Medidor)

**O que é**: Mostra valor com meta/intervalo

**Features**:
- Arco com valor atual
- Mínimo, máximo, meta
- Cores por faixa

**Exemplo Power BI**:
```
┌─────────────────────────────┐
│         ┌─────┐             │
│        ╱  75%  ╲            │
│       ╱   ●    ╲           │
│      ╱         ╲           │
│     └───────────┘          │
│  Meta: 80%                 │
└─────────────────────────────┘
```

---

## 2. Abordagens de Implementação

### 2.1 Abordagem 1: React puro (Sem lib externa)

**Vantagens**:
- Controle total
- Bundle mínimo
- Sem dependências

**Desvantagens**:
- Mais código
- Sem animações prontas

**Exemplo**:
```tsx
interface KpiCardProps {
  value: number;
  label: string;
  previousValue?: number;
  target?: number;
  format?: 'currency' | 'percent' | 'number';
}

function KpiCard({ value, label, previousValue, target, format }: KpiCardProps) {
  const change = previousValue ? ((value - previousValue) / previousValue) * 100 : null;
  const isPositive = change !== null && change > 0;
  const isNegative = change !== null && change < 0;

  return (
    <div className="flex flex-col p-4 bg-white rounded-lg shadow">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-2xl font-bold">
        {format === 'currency' ? `R$ ${value.toLocaleString()}` : value}
      </span>
      {change !== null && (
        <span className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </span>
      )}
      {target && (
        <span className="text-xs text-gray-400">Meta: {target}</span>
      )}
    </div>
  );
}
```

### 2.2 Abordagem 2: Recharts (Já instalado)

**Vantagens**:
- Já instalado
- Animações prontas
- Compatível com ecosystem

**Desvantagens**:
- Recharts não tem KPI nativo
- Precisa de customização

**Exemplo com mini chart**:
```tsx
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

function KpiCardWithSparkline({ value, label, trend }: KpiCardProps) {
  return (
    <div className="flex flex-col p-4 bg-white rounded-lg shadow">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-2xl font-bold">{value}</span>
      <div className="h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend}>
            <Area type="monotone" dataKey="value" stroke="#FFB03F" fill="#FFB03F20" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

### 2.3 Abordagem 3: Apache ECharts

**Vantagens**:
- Gauge nativo
- Formatação rica
- Performance

**Desvantagens**:
- Bundle maior
- API de configuração

**Exemplo gauge**:
```tsx
import ReactECharts from 'echarts-for-react';

function GaugeCard({ value, min, max, target }: GaugeCardProps) {
  const option = {
    series: [{
      type: 'gauge',
      min,
      max,
      data: [{ value, name: 'Meta' }],
      detail: { formatter: '{value}%' },
      axisLine: {
        lineStyle: {
          color: [[0.3, '#ff4500'], [0.7, '#ffd700'], [1, '#32cd32']],
        },
      },
    }],
  };

  return <ReactECharts option={option} style={{ height: 200 }} />;
}
```

---

## 3. Análise: Bibliotecas para KPI Cards

### 3.1 React-countup (Números animados)

**Links**:
- 🌐 [https://www.npmjs.com/package/react-countup](https://www.npmjs.com/package/react-countup)
- 📦 Bundle: ~5KB

**Uso**: Animar números ao carregar

```tsx
import CountUp from 'react-countup';

<CountUp end={1234567} duration={2} separator="." prefix="R$ " />
```

### 3.2 react-spring-number (Números com spring)

**Links**:
- 🌐 [https://www.npmjs.com/package/react-spring-number](https://www.npmjs.com/package/react-spring-number)
- 📦 Bundle: ~3KB

### 3.3 framer-motion (Animações gerais)

**Links**:
- 🌐 [https://www.framer.com/motion/](https://www.framer.com/motion/)
- 📦 Bundle: ~30KB

**Uso**: Animações de entrada, transições

---

## 4. Recomendação para Clone Power BI

### 4.1 Estratégia Recomendada

**Usar React puro + Recharts para sparklines**

Por quê?
1. **KPI Card**: React puro (controle total)
2. **Card**: React puro (simples)
3. **Gauge**: ECharts ou React puro
4. **Sparklines**: Recharts (já instalado)

### 4.2 Componentes para Criar

| Componente | Biblioteca | Observação |
|------------|------------|------------|
| KpiCard | React puro | Valor + tendência + meta |
| ValueCard | React puro | Valor simples |
| MultiRowCard | React puro | Múltiplos valores |
| GaugeCard | React puro ou ECharts | Medidor |
| Sparkline | Recharts | Mini chart |

### 4.3 Interface Padrão

```typescript
// src/studio/types/kpi-card.ts

export interface KpiCardData {
  value: number;
  label: string;
  previousValue?: number;
  target?: number;
  trend?: number[]; // Dados para sparkline
  format?: 'currency' | 'percent' | 'number' | 'date';
  color?: string;
}

export interface GaugeCardData {
  value: number;
  min: number;
  max: number;
  target?: number;
  label: string;
  zones?: { min: number; max: number; color: string }[];
}
```

---

## 5. Código: KPI Card Completo

```tsx
'use client';

import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  value: number;
  label: string;
  previousValue?: number;
  target?: number;
  trend?: { value: number }[];
  format?: 'currency' | 'percent' | 'number';
  decimals?: number;
}

export function KpiCard({ 
  value, 
  label, 
  previousValue, 
  target, 
  trend, 
  format = 'number',
  decimals = 0 
}: KpiCardProps) {
  const change = previousValue 
    ? ((value - previousValue) / previousValue) * 100 
    : null;
  
  const isPositive = change !== null && change > 0;
  const isNegative = change !== null && change < 0;

  const formatValue = (v: number) => {
    if (format === 'currency') {
      return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    }
    if (format === 'percent') {
      return `${v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
    }
    return v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  return (
    <div className="flex flex-col p-4 bg-white dark:bg-neutral-800 rounded-lg shadow-sm h-full">
      <span className="text-xs text-muted-foreground mb-1">{label}</span>
      
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">
          {formatValue(value)}
        </span>
        
        {change !== null && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${
            isPositive ? 'text-emerald-500' : isNegative ? 'text-red-500' : 'text-muted-foreground'
          }`}>
            {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : <Minus size={12} />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>

      {target && (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Meta</span>
            <span>{formatValue(target)}</span>
          </div>
          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {trend && trend.length > 0 && (
        <div className="flex-1 min-h-0 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFB03F" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FFB03F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#FFB03F" 
                fill={`url(#gradient-${label})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
```

---

## 6. Conclusão

### Para Clone Power BI:

1. **KPI Card**: Implementar com React puro + Recharts sparkline
2. **Value Card**: Implementar com React puro
3. **Gauge**: Usar ECharts (já temos gauge nativo)
4. **Multi-row Card**: Implementar com React puro

### Não precisamos de lib externa para:
- Cards básicos
- Sparklines (Recharts já tem)
- Formatação de números

### Precisamos de lib apenas para:
- Gauge complexo (ECharts)
- Animações avançadas (framer-motion, opcional)

---

*Estudo atualizado em: 2026-08-04*
