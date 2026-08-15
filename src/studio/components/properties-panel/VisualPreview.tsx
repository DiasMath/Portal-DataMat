'use client';

import React, { useMemo, useState } from 'react';
import type { VisualType, VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { BarChart } from '../charts/BarChart';
import { LineChart } from '../charts/LineChart';
import { PieChart } from '../charts/PieChart';
import { TableVisual } from '../charts/TableVisual';
import { KpiCard } from '../charts/KpiCard';
import { ScatterChart } from '../charts/ScatterChart';
import { GaugeChart } from '../charts/GaugeChart';
import { TreemapChart } from '../charts/TreemapChart';
import { WaterfallChart } from '../charts/WaterfallChart';
import { ComboChart } from '../charts/ComboChart';
import { FunnelChart } from '../charts/FunnelChart';
import { RadarChart } from '../charts/RadarChart';
import { RibbonChart } from '../charts/RibbonChart';
import { BulletChart } from '../charts/BulletChart';
import { SunburstChart } from '../charts/SunburstChart';
import { SankeyChart } from '../charts/SankeyChart';
import { WordCloudChart } from '../charts/WordCloudChart';
import { BoxPlotChart } from '../charts/BoxPlotChart';
import { HistogramChart } from '../charts/HistogramChart';
import { DotPlotChart } from '../charts/DotPlotChart';
import { LollipopChart } from '../charts/LollipopChart';
import { MatrixVisual } from '../charts/MatrixVisual';

interface VisualPreviewProps {
  type: VisualType;
  width?: number;
  height?: number;
}

// Error boundary for individual chart previews
class ChartPreviewWrapper extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded text-[8px] text-muted-foreground">
          Preview unavailable
        </div>
      );
    }
    return this.props.children;
  }
}

const MOCK_DATA: Record<VisualType, QueryResultData> = {
  bar: {
    columns: ['Categoria', 'Valor'],
    rows: [
      { Categoria: 'Jan', Valor: 120 },
      { Categoria: 'Fev', Valor: 190 },
      { Categoria: 'Mar', Valor: 300 },
      { Categoria: 'Abr', Valor: 500 },
      { Categoria: 'Mai', Valor: 230 },
      { Categoria: 'Jun', Valor: 340 },
    ],
    executionTime: 0,
  },
  line: {
    columns: ['Mes', 'Vendas'],
    rows: [
      { Mes: 'Jan', Vendas: 120 },
      { Mes: 'Fev', Vendas: 132 },
      { Mes: 'Mar', Vendas: 101 },
      { Mes: 'Abr', Vendas: 134 },
      { Mes: 'Mai', Vendas: 90 },
      { Mes: 'Jun', Vendas: 230 },
    ],
    executionTime: 0,
  },
  area: {
    columns: ['Mes', 'Vendas'],
    rows: [
      { Mes: 'Jan', Vendas: 120 },
      { Mes: 'Fev', Vendas: 132 },
      { Mes: 'Mar', Vendas: 101 },
      { Mes: 'Abr', Vendas: 134 },
      { Mes: 'Mai', Vendas: 90 },
      { Mes: 'Jun', Vendas: 230 },
    ],
    executionTime: 0,
  },
  pie: {
    columns: ['Produto', 'Vendas'],
    rows: [
      { Produto: 'A', Vendas: 300 },
      { Produto: 'B', Vendas: 200 },
      { Produto: 'C', Vendas: 150 },
      { Produto: 'D', Vendas: 100 },
      { Produto: 'E', Vendas: 50 },
    ],
    executionTime: 0,
  },
  donut: {
    columns: ['Produto', 'Vendas'],
    rows: [
      { Produto: 'A', Vendas: 300 },
      { Produto: 'B', Vendas: 200 },
      { Produto: 'C', Vendas: 150 },
      { Produto: 'D', Vendas: 100 },
      { Produto: 'E', Vendas: 50 },
    ],
    executionTime: 0,
  },
  scatter: {
    columns: ['X', 'Y', 'Tamanho'],
    rows: [
      { X: 10, Y: 20, Tamanho: 10 },
      { X: 20, Y: 30, Tamanho: 20 },
      { X: 30, Y: 25, Tamanho: 15 },
      { X: 40, Y: 40, Tamanho: 25 },
      { X: 50, Y: 35, Tamanho: 18 },
      { X: 60, Y: 50, Tamanho: 30 },
    ],
    executionTime: 0,
  },
  table: {
    columns: ['Produto', 'Vendas', 'Regiao'],
    rows: [
      { Produto: 'A', Vendas: 100, Regiao: 'Norte' },
      { Produto: 'B', Vendas: 200, Regiao: 'Sul' },
      { Produto: 'C', Vendas: 150, Regiao: 'Leste' },
      { Produto: 'D', Vendas: 300, Regiao: 'Oeste' },
    ],
    executionTime: 0,
  },
  kpi: {
    columns: ['Total'],
    rows: [{ Total: 1234567 }],
    executionTime: 0,
  },
  card: {
    columns: ['Total'],
    rows: [{ Total: 1234567 }],
    executionTime: 0,
  },
  gauge: {
    columns: ['Valor'],
    rows: [{ Valor: 75 }],
    executionTime: 0,
  },
  treemap: {
    columns: ['Categoria', 'Valor'],
    rows: [
      { Categoria: 'A', Valor: 400 },
      { Categoria: 'B', Valor: 300 },
      { Categoria: 'C', Valor: 200 },
      { Categoria: 'D', Valor: 100 },
    ],
    executionTime: 0,
  },
  waterfall: {
    columns: ['Mes', 'Valor'],
    rows: [
      { Mes: 'Jan', Valor: 100 },
      { Mes: 'Fev', Valor: -20 },
      { Mes: 'Mar', Valor: 50 },
      { Mes: 'Abr', Valor: 80 },
      { Mes: 'Mai', Valor: -30 },
    ],
    executionTime: 0,
  },
  combo: {
    columns: ['Mes', 'Vendas', 'Meta'],
    rows: [
      { Mes: 'Jan', Vendas: 120, Meta: 100 },
      { Mes: 'Fev', Vendas: 132, Meta: 110 },
      { Mes: 'Mar', Vendas: 101, Meta: 120 },
      { Mes: 'Abr', Vendas: 134, Meta: 130 },
      { Mes: 'Mai', Vendas: 90, Meta: 100 },
      { Mes: 'Jun', Vendas: 230, Meta: 150 },
    ],
    executionTime: 0,
  },
  radar: {
    columns: ['Indicador', 'Valor'],
    rows: [
      { Indicador: 'Vendas', Valor: 80 },
      { Indicador: 'Lucro', Valor: 60 },
      { Indicador: 'Crescimento', Valor: 70 },
      { Indicador: 'Satisfacao', Valor: 90 },
      { Indicador: 'Eficiencia', Valor: 85 },
    ],
    executionTime: 0,
  },
  funnel: {
    columns: ['Etapa', 'Valor'],
    rows: [
      { Etapa: 'Visitantes', Valor: 1000 },
      { Etapa: 'Leads', Valor: 500 },
      { Etapa: 'Propostas', Valor: 200 },
      { Etapa: 'Negociacao', Valor: 100 },
      { Etapa: 'Fechados', Valor: 50 },
    ],
    executionTime: 0,
  },
  ribbon: {
    columns: ['Origem', 'Destino', 'Valor'],
    rows: [
      { Origem: 'A', Destino: 'B', Valor: 100 },
      { Origem: 'A', Destino: 'C', Valor: 200 },
      { Origem: 'B', Destino: 'D', Valor: 150 },
      { Origem: 'C', Destino: 'D', Valor: 50 },
    ],
    executionTime: 0,
  },
  matrix: {
    columns: ['Produto', 'Jan', 'Fev', 'Mar'],
    rows: [
      { Produto: 'A', Jan: 100, Fev: 120, Mar: 90 },
      { Produto: 'B', Jan: 200, Fev: 180, Mar: 210 },
      { Produto: 'C', Jan: 150, Fev: 160, Mar: 140 },
    ],
    executionTime: 0,
  },
  bullet: {
    columns: ['Metrica', 'Atual', 'Meta'],
    rows: [
      { Metrica: 'Vendas', Atual: 80, Meta: 100 },
      { Metrica: 'Lucro', Atual: 60, Meta: 80 },
      { Metrica: 'Crescimento', Atual: 70, Meta: 90 },
    ],
    executionTime: 0,
  },
  sunburst: {
    columns: ['Categoria', 'Valor'],
    rows: [
      { Categoria: 'A', Valor: 400 },
      { Categoria: 'B', Valor: 300 },
      { Categoria: 'C', Valor: 200 },
      { Categoria: 'D', Valor: 100 },
    ],
    executionTime: 0,
  },
  sankey: {
    columns: ['Origem', 'Destino', 'Valor'],
    rows: [
      { Origem: 'A', Destino: 'B', Valor: 100 },
      { Origem: 'A', Destino: 'C', Valor: 200 },
      { Origem: 'B', Destino: 'D', Valor: 150 },
      { Origem: 'C', Destino: 'D', Valor: 50 },
    ],
    executionTime: 0,
  },
  wordcloud: {
    columns: ['Palavra', 'Frequencia'],
    rows: [
      { Palavra: 'Dados', Frequencia: 100 },
      { Palavra: 'Analise', Frequencia: 80 },
      { Palavra: 'Visualizacao', Frequencia: 60 },
      { Palavra: 'Dashboard', Frequencia: 50 },
      { Palavra: 'Metricas', Frequencia: 40 },
    ],
    executionTime: 0,
  },
  boxplot: {
    columns: ['Grupo', 'Valor'],
    rows: [
      { Grupo: 'A', Valor: 10 }, { Grupo: 'A', Valor: 20 }, { Grupo: 'A', Valor: 30 },
      { Grupo: 'A', Valor: 40 }, { Grupo: 'A', Valor: 50 }, { Grupo: 'A', Valor: 60 },
      { Grupo: 'B', Valor: 15 }, { Grupo: 'B', Valor: 25 }, { Grupo: 'B', Valor: 35 },
      { Grupo: 'B', Valor: 45 }, { Grupo: 'B', Valor: 55 }, { Grupo: 'B', Valor: 65 },
    ],
    executionTime: 0,
  },
  histogram: {
    columns: ['Valor'],
    rows: Array.from({ length: 50 }, (_, i) => ({ Valor: Math.floor(Math.random() * 100) })),
    executionTime: 0,
  },
  dotplot: {
    columns: ['Grupo', 'Valor'],
    rows: [
      { Grupo: 'A', Valor: 10 }, { Grupo: 'A', Valor: 20 }, { Grupo: 'A', Valor: 30 },
      { Grupo: 'B', Valor: 15 }, { Grupo: 'B', Valor: 25 }, { Grupo: 'B', Valor: 35 },
      { Grupo: 'C', Valor: 12 }, { Grupo: 'C', Valor: 22 }, { Grupo: 'C', Valor: 32 },
    ],
    executionTime: 0,
  },
  lollipop: {
    columns: ['Categoria', 'Valor'],
    rows: [
      { Categoria: 'A', Valor: 120 },
      { Categoria: 'B', Valor: 190 },
      { Categoria: 'C', Valor: 300 },
      { Categoria: 'D', Valor: 500 },
      { Categoria: 'E', Valor: 230 },
    ],
    executionTime: 0,
  },
};

const DEFAULT_FORMATTING: VisualFormatting = {};

export const VisualPreview = React.memo(function VisualPreview({ type, width = 120, height = 80 }: VisualPreviewProps) {
  const data = useMemo(() => MOCK_DATA[type] || MOCK_DATA.bar, [type]);

  const commonProps = {
    data,
    formatting: DEFAULT_FORMATTING,
    width,
    height,
    theme: 'light' as const,
    animation: false,
  };

  switch (type) {
    case 'bar':
      return <ChartPreviewWrapper><BarChart {...commonProps} /></ChartPreviewWrapper>;
    case 'line':
      return <ChartPreviewWrapper><LineChart {...commonProps} type="line" /></ChartPreviewWrapper>;
    case 'area':
      return <ChartPreviewWrapper><LineChart {...commonProps} type="area" /></ChartPreviewWrapper>;
    case 'pie':
      return <ChartPreviewWrapper><PieChart {...commonProps} type="pie" /></ChartPreviewWrapper>;
    case 'donut':
      return <ChartPreviewWrapper><PieChart {...commonProps} type="donut" /></ChartPreviewWrapper>;
    case 'table':
      return <ChartPreviewWrapper><TableVisual data={data} formatting={DEFAULT_FORMATTING} width={width} height={height} /></ChartPreviewWrapper>;
    case 'kpi':
    case 'card':
      return <ChartPreviewWrapper><KpiCard data={data} formatting={DEFAULT_FORMATTING} width={width} height={height} measureFormats={{}} /></ChartPreviewWrapper>;
    case 'scatter':
      return <ChartPreviewWrapper><ScatterChart {...commonProps} /></ChartPreviewWrapper>;
    case 'gauge':
      return <ChartPreviewWrapper><GaugeChart data={data} formatting={DEFAULT_FORMATTING} width={width} height={height} theme="light" /></ChartPreviewWrapper>;
    case 'treemap':
      return <ChartPreviewWrapper><TreemapChart {...commonProps} /></ChartPreviewWrapper>;
    case 'waterfall':
      return <ChartPreviewWrapper><WaterfallChart data={data} formatting={DEFAULT_FORMATTING} width={width} height={height} theme="light" /></ChartPreviewWrapper>;
    case 'combo':
      return <ChartPreviewWrapper><ComboChart {...commonProps} /></ChartPreviewWrapper>;
    case 'radar':
      return <ChartPreviewWrapper><RadarChart {...commonProps} /></ChartPreviewWrapper>;
    case 'funnel':
      return <ChartPreviewWrapper><FunnelChart {...commonProps} /></ChartPreviewWrapper>;
    case 'ribbon':
      return <ChartPreviewWrapper><RibbonChart {...commonProps} /></ChartPreviewWrapper>;
    case 'bullet':
      return <ChartPreviewWrapper><BulletChart data={data} formatting={DEFAULT_FORMATTING} width={width} height={height} theme="light" /></ChartPreviewWrapper>;
    case 'sunburst':
      return <ChartPreviewWrapper><SunburstChart {...commonProps} /></ChartPreviewWrapper>;
    case 'sankey':
      return <ChartPreviewWrapper><SankeyChart {...commonProps} /></ChartPreviewWrapper>;
    case 'wordcloud':
      return <ChartPreviewWrapper><WordCloudChart data={data} formatting={DEFAULT_FORMATTING} width={width} height={height} theme="light" /></ChartPreviewWrapper>;
    case 'boxplot':
      return <ChartPreviewWrapper><BoxPlotChart data={data} formatting={DEFAULT_FORMATTING} width={width} height={height} theme="light" /></ChartPreviewWrapper>;
    case 'histogram':
      return <ChartPreviewWrapper><HistogramChart data={data} formatting={DEFAULT_FORMATTING} width={width} height={height} theme="light" /></ChartPreviewWrapper>;
    case 'dotplot':
      return <ChartPreviewWrapper><DotPlotChart {...commonProps} /></ChartPreviewWrapper>;
    case 'lollipop':
      return <ChartPreviewWrapper><LollipopChart {...commonProps} /></ChartPreviewWrapper>;
    case 'matrix':
      return <ChartPreviewWrapper><MatrixVisual data={data} formatting={DEFAULT_FORMATTING} width={width} height={height} /></ChartPreviewWrapper>;
    default:
      return <ChartPreviewWrapper><BarChart {...commonProps} /></ChartPreviewWrapper>;
  }
});