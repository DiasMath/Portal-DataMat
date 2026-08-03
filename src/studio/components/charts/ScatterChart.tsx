'use client';

import React from 'react';
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  ZAxis,
} from 'recharts';
import type { QueryResultData, VisualFormatting } from '../../types/visuals';
import { ChartTooltip, formatTooltipValue } from './ChartTooltip';

interface ScatterChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width: number;
  height: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
}

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

export function ScatterChart({ data, formatting, width, height, crossFilterValue, onCrossFilter }: ScatterChartProps) {
  if (!data || data.columns.length < 3) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Arraste campos para Eixo X, Eixo Y e Tamanho
      </div>
    );
  }

  const xKey = data.columns[0];
  const yKey = data.columns[1];
  const zKey = data.columns[2];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsScatterChart margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        {formatting.showGridLines !== false && (
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        )}
        <XAxis dataKey={xKey} type="category" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis dataKey={yKey} type="category" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <ZAxis dataKey={zKey} range={[50, 400]} />
        <ChartTooltip />
        {formatting.showLegend !== false && <Legend />}
        <Scatter
          data={data.rows}
          fill={formatting.colorPalette?.[0] || DEFAULT_COLORS[0]}
          cursor="pointer"
          onClick={(entry) => {
            if (onCrossFilter && entry) {
              onCrossFilter(xKey, (entry as unknown as Record<string, unknown>)[xKey]);
            }
          }}
        />
      </RechartsScatterChart>
    </ResponsiveContainer>
  );
}
