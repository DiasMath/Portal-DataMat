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
import { getMockDataForVisual } from '../../lib/mock-data';

interface ChartRendererProps {
  visual: Visual;
  queryState?: VisualQueryState;
  width: number;
  height: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  drillLevel?: number;
  onDrillDown?: (fieldName: string, value: unknown) => void;
}

export function ChartRenderer({ visual, queryState, width, height, crossFilterValue, onCrossFilter, drillLevel, onDrillDown }: ChartRendererProps) {
  const data = useMemo(() => {
    if (queryState?.result) {
      return queryState.result;
    }
    if (visual.mockPreviewData) {
      return { ...visual.mockPreviewData, executionTime: 0 };
    }
    return getMockDataForVisual(visual.type);
  }, [queryState, visual.mockPreviewData, visual.type]);

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
    drillLevel,
    onDrillDown,
  };

  switch (visual.type) {
    case 'bar':
      return <BarChart {...commonProps} />;
    case 'line':
    case 'area':
      return <LineChart {...commonProps} type={visual.type} />;
    case 'pie':
    case 'donut':
      return <PieChart {...commonProps} type={visual.type} />;
    case 'table':
      return <TableVisual data={data} formatting={visual.formatting} width={width} height={height} />;
    case 'kpi':
    case 'card':
      return <KpiCard data={data} formatting={visual.formatting} width={width} height={height} />;
    case 'scatter':
      return <ScatterChart {...commonProps} />;
    case 'gauge':
      return <GaugeChart data={data} formatting={visual.formatting} width={width} height={height} />;
    case 'treemap':
      return <TreemapChart {...commonProps} />;
    case 'waterfall':
      return <WaterfallChart data={data} formatting={visual.formatting} width={width} height={height} />;
    case 'combo':
      return <ComboChart {...commonProps} />;
    default:
      return <BarChart {...commonProps} />;
  }
}
