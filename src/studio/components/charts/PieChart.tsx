'use client';

import React, { useCallback } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { QueryResultData, VisualFormatting } from '../../types/visuals';
import { ChartTooltip, formatTooltipValue } from './ChartTooltip';

interface PieChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width: number;
  height: number;
  type?: 'pie' | 'donut';
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
}

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const FILTERED_COLOR = '#d1d5db';

export function PieChart({ data, formatting, width, height, type = 'pie', crossFilterValue, onCrossFilter }: PieChartProps) {
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

  const handleClick = useCallback((data: Record<string, unknown>) => {
    if (onCrossFilter) {
      onCrossFilter(nameKey, data[nameKey]);
    }
  }, [onCrossFilter, nameKey]);

  const hasFilter = crossFilterValue !== undefined;

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
          cursor="pointer"
          label={!!formatting.dataLabels}
          labelLine={!!formatting.dataLabels}
          onClick={(_, index) => {
            const row = data.rows[index];
            if (row) handleClick(row);
          }}
        >
          {data.rows.map((row, index) => {
            const isFiltered = hasFilter && row[nameKey] !== crossFilterValue;
            return (
              <Cell
                key={`cell-${index}`}
                fill={isFiltered ? FILTERED_COLOR : colors[index % colors.length]}
                opacity={hasFilter ? (isFiltered ? 0.4 : 1) : 1}
              />
            );
          })}
        </Pie>
        <ChartTooltipWrapper />
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

function ChartTooltipWrapper(props: Record<string, unknown>) {
  return <ChartTooltip {...(props as { active?: boolean; payload?: Array<{ name: string; value: unknown; color?: string }>; label?: string })} formatter={formatTooltipValue} />;
}
