'use client';

import React, { useMemo } from 'react';
import type { Visual } from '../../types/dashboard';
import type { VisualQueryState } from '../../types/dashboard';
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
import { VisualLoading } from '../charts/VisualLoading';
import { VisualError } from '../charts/VisualError';
import { getMockDataForVisual } from '../../lib/mocks/mock-data';
import type { MeasureFormat } from '../../lib/format';
import type { ThemeMode } from '../../lib/echarts/theme';

interface ChartRendererProps {
  visual: Visual;
  queryState?: VisualQueryState;
  width?: number;
  height?: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  drillLevel?: number;
  onDrillDown?: (fieldName: string, value: unknown) => void;
  measureFormats?: Record<string, MeasureFormat>;
  onRetry?: () => void;
  theme?: ThemeMode;
  animation?: boolean;
}

export const ChartRenderer = React.memo(function ChartRenderer({ visual, queryState, width, height, crossFilterValue, onCrossFilter, drillLevel, onDrillDown, measureFormats, onRetry, theme = 'transparent', animation = false }: ChartRendererProps) {
  const data = useMemo(() => {
    if (queryState?.result) {
      return queryState.result;
    }
    if (visual.mockPreviewData) {
      return { ...visual.mockPreviewData, executionTime: 0 };
    }
    return getMockDataForVisual(visual.type);
  }, [queryState, visual.mockPreviewData, visual.type]);

  if (queryState?.loading) {
    return <VisualLoading height={height} />;
  }

  if (queryState?.error) {
    return <VisualError message={queryState.error} onRetry={onRetry} height={height} />;
  }

  if (!data || data.columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Arraste campos para os buckets
      </div>
    );
  }

  const commonProps = {
    data,
    formatting: visual.formatting,
    width,
    height,
    crossFilterValue,
    onCrossFilter,
    theme,
    animation,
  };

  switch (visual.type) {
    case 'bar':
      return <BarChart {...commonProps} />;
    case 'line':
      return <LineChart {...commonProps} type="line" />;
    case 'area':
      return <LineChart {...commonProps} type="area" />;
    case 'pie':
      return <PieChart {...commonProps} type="pie" />;
    case 'donut':
      return <PieChart {...commonProps} type="donut" />;
    case 'table':
      return <TableVisual data={data} formatting={visual.formatting} width={width} height={height} />;
    case 'kpi':
    case 'card':
      return <KpiCard data={data} formatting={visual.formatting} width={width} height={height} measureFormats={measureFormats} />;
    case 'scatter':
      return <ScatterChart {...commonProps} />;
    case 'gauge':
      return <GaugeChart data={data} formatting={visual.formatting} width={width} height={height} theme={theme} />;
    case 'treemap':
      return <TreemapChart {...commonProps} />;
    case 'waterfall':
      return <WaterfallChart data={data} formatting={visual.formatting} width={width} height={height} theme={theme} />;
    case 'combo':
      return <ComboChart {...commonProps} />;
    case 'radar':
      return <RadarChart {...commonProps} />;
    case 'funnel':
      return <FunnelChart {...commonProps} />;
    case 'ribbon':
      return <RibbonChart {...commonProps} />;
    case 'bullet':
      return <BulletChart data={data} formatting={visual.formatting} width={width} height={height} theme={theme} />;
    case 'sunburst':
      return <SunburstChart {...commonProps} />;
    case 'sankey':
      return <SankeyChart {...commonProps} />;
    case 'wordcloud':
      return <WordCloudChart data={data} formatting={visual.formatting} width={width} height={height} theme={theme} />;
    case 'boxplot':
      return <BoxPlotChart data={data} formatting={visual.formatting} width={width} height={height} theme={theme} />;
    case 'histogram':
      return <HistogramChart data={data} formatting={visual.formatting} width={width} height={height} theme={theme} />;
    case 'dotplot':
      return <DotPlotChart {...commonProps} />;
    case 'lollipop':
      return <LollipopChart {...commonProps} />;
    case 'matrix':
      return <MatrixVisual data={data} formatting={visual.formatting} width={width} height={height} />;
    default:
      return <BarChart {...commonProps} />;
  }
});
