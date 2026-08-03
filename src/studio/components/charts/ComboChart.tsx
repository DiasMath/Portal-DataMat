'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { QueryResultData, VisualFormatting } from '../../types/visuals';
import { ChartTooltip, formatTooltipValue } from './ChartTooltip';

interface ComboChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width: number;
  height: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
}

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

export function ComboChart({ data, formatting, width, height, crossFilterValue, onCrossFilter }: ComboChartProps) {
  if (!data || data.columns.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Arraste um campo para Eixo X e um ou mais para Valores
      </div>
    );
  }

  const xKey = data.columns[0];
  const valueKeys = data.columns.slice(1);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data.rows} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        {formatting.showGridLines !== false && (
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        )}
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <ChartTooltip />
        {formatting.showLegend !== false && valueKeys.length > 1 && <Legend />}
        {valueKeys.map((key, index) => {
          const color = (formatting.colorPalette || DEFAULT_COLORS)[index % DEFAULT_COLORS.length];
          if (index === 0) {
            return (
              <Bar
                key={key}
                dataKey={key}
                fill={color}
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
            );
          }
          return (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          );
        })}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
