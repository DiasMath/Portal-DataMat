'use client';

import React, { useMemo } from 'react';
import type { Visual } from '../../types/dashboard';
import type { VisualQueryState } from '../../types/dashboard';
import { BarChart } from '../charts/BarChart';
import { LineChart } from '../charts/LineChart';
import { PieChart } from '../charts/PieChart';
import { TableVisual } from '../charts/TableVisual';
import { KpiCard } from '../charts/KpiCard';
import { getMockDataForVisual } from '../../lib/mock-data';

interface ChartRendererProps {
  visual: Visual;
  queryState?: VisualQueryState;
  width: number;
  height: number;
}

export function ChartRenderer({ visual, queryState, width, height }: ChartRendererProps) {
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
      return <TableVisual {...commonProps} />;
    case 'kpi':
    case 'card':
      return <KpiCard {...commonProps} />;
    default:
      return <BarChart {...commonProps} />;
  }
}
