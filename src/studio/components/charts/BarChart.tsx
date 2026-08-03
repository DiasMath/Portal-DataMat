'use client';

import React, { useCallback } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import type { QueryResultData, VisualFormatting } from '../../types/visuals';
import { ChartTooltip, formatTooltipValue } from './ChartTooltip';

interface BarChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width: number;
  height: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  drillLevel?: number;
  onDrillDown?: (fieldName: string, value: unknown) => void;
}

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];
const FILTERED_COLOR = '#d1d5db';

export function BarChart({ data, formatting, width, height, crossFilterValue, onCrossFilter, drillLevel = 0, onDrillDown }: BarChartProps) {
  if (!data || data.columns.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Arraste um campo para Eixo X e um para Valores
      </div>
    );
  }

  const xKey = data.columns[0];
  const valueKeys = data.columns.slice(1);

  const handleClick = useCallback((data: { payload?: Record<string, unknown> }) => {
    if (data.payload && onCrossFilter) {
      onCrossFilter(xKey, data.payload[xKey]);
    }
    if (data.payload && onDrillDown) {
      onDrillDown(xKey, data.payload[xKey]);
    }
  }, [onCrossFilter, onDrillDown, xKey]);

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
        <ChartTooltipWrapper />
        {formatting.showLegend !== false && valueKeys.length > 1 && <Legend />}
        {valueKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={(data) => handleClick(data as { payload?: Record<string, unknown> })}
          >
            {formatting.dataLabels && (
              <LabelList
                dataKey={key}
                position="top"
                style={{ fontSize: formatting.dataLabelFontSize || 11, fill: formatting.dataLabelColor || '#374151' }}
              />
            )}
            {data.rows.map((row, rowIndex) => {
              const isFiltered = crossFilterValue !== undefined && row[xKey] !== crossFilterValue;
              const color = (formatting.colorPalette || DEFAULT_COLORS)[index % DEFAULT_COLORS.length];
              return (
                <Cell
                  key={`cell-${rowIndex}`}
                  fill={isFiltered ? FILTERED_COLOR : color}
                  opacity={crossFilterValue !== undefined ? (isFiltered ? 0.4 : 1) : 1}
                />
              );
            })}
          </Bar>
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

function ChartTooltipWrapper(props: Record<string, unknown>) {
  return <ChartTooltip {...(props as { active?: boolean; payload?: Array<{ name: string; value: unknown; color?: string }>; label?: string })} formatter={formatTooltipValue} />;
}
