'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { QueryResultData, VisualFormatting } from '../../types/visuals';

interface BarChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width: number;
  height: number;
}

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

export function BarChart({ data, formatting, width, height }: BarChartProps) {
  if (!data || data.columns.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Arraste um campo para Eixo X e um para Valores
      </div>
    );
  }

  const xKey = data.columns[0];
  const valueKeys = data.columns.slice(1);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data.rows} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        {formatting.showGridLines !== false && (
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        )}
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11 }}
          stroke="#9ca3af"
          label={formatting.xAxisLabel ? { value: formatting.xAxisLabel, position: 'insideBottom', offset: -5, fontSize: 11 } : undefined}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          stroke="#9ca3af"
          label={formatting.yAxisLabel ? { value: formatting.yAxisLabel, angle: -90, position: 'insideLeft', fontSize: 11 } : undefined}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(value) => [Number(value).toLocaleString('pt-BR'), '']}
        />
        {formatting.showLegend !== false && valueKeys.length > 1 && <Legend />}
        {valueKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={(formatting.colorPalette || DEFAULT_COLORS)[index % DEFAULT_COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
