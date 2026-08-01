'use client';

import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { QueryResultData, VisualFormatting } from '../../types/visuals';

interface PieChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width: number;
  height: number;
  type?: 'pie' | 'donut';
}

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function PieChart({ data, formatting, width, height, type = 'pie' }: PieChartProps) {
  if (!data || data.columns.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Arraste um campo para Eixo X e um para Valores
      </div>
    );
  }

  const nameKey = data.columns[0];
  const valueKey = data.columns[1];
  const colors = formatting.colorPalette || DEFAULT_COLORS;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data.rows}
          cx="50%"
          cy="50%"
          innerRadius={type === 'donut' ? Math.min(width, height) * 0.2 : 0}
          outerRadius={Math.min(width, height) * 0.35}
          paddingAngle={2}
          dataKey={valueKey}
          nameKey={nameKey}
        >
          {data.rows.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(value) => [Number(value).toLocaleString('pt-BR'), '']}
        />
        {formatting.showLegend !== false && (
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(value) => value?.toString().slice(0, 20) || ''}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
