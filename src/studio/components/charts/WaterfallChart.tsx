'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import type { QueryResultData, VisualFormatting } from '../../types/visuals';

interface WaterfallChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width: number;
  height: number;
}

export function WaterfallChart({ data, formatting, width, height }: WaterfallChartProps) {
  if (!data || data.columns.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Arraste um campo para Categorias e um para Valores
      </div>
    );
  }

  const catKey = data.columns[0];
  const valKey = data.columns[1];

  let running = 0;
  const processed = data.rows.map((row) => {
    const val = Number(row[valKey]) || 0;
    const start = running;
    running += val;
    return {
      name: String(row[catKey] ?? ''),
      start,
      value: val,
      end: running,
      isTotal: false,
    };
  });

  if (processed.length > 0) {
    processed.push({ name: 'Total', start: 0, value: running, end: running, isTotal: true });
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={processed} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        {formatting.showGridLines !== false && (
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        )}
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <ReferenceLine y={0} stroke="#6b7280" />
        <Bar dataKey="start" stackId="waterfall" fill="transparent" />
        <Bar dataKey="value" stackId="waterfall" radius={[4, 4, 0, 0]}>
          {processed.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.isTotal ? '#6b7280' : entry.value >= 0 ? '#22c55e' : '#ef4444'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
