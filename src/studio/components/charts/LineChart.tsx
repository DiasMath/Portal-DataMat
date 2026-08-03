'use client';

import React, { useCallback } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
  LabelList,
} from 'recharts';
import type { QueryResultData, VisualFormatting } from '../../types/visuals';
import { ChartTooltip, formatTooltipValue } from './ChartTooltip';

interface LineChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width: number;
  height: number;
  type?: 'line' | 'area';
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
}

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

export function LineChart({ data, formatting, width, height, type = 'line', crossFilterValue, onCrossFilter }: LineChartProps) {
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
  }, [onCrossFilter, xKey]);

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.rows} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          {formatting.showGridLines !== false && (
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          )}
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
          <ChartTooltipWrapper />
          {crossFilterValue !== undefined && (
            <ReferenceLine
              x={crossFilterValue as string | number}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}
          {formatting.showLegend !== false && valueKeys.length > 1 && <Legend />}
          {valueKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={(formatting.colorPalette || DEFAULT_COLORS)[index % DEFAULT_COLORS.length]}
              fill={(formatting.colorPalette || DEFAULT_COLORS)[index % DEFAULT_COLORS.length]}
              fillOpacity={0.3}
              strokeWidth={2}
              cursor="pointer"
              onClick={(data) => handleClick(data as { payload?: Record<string, unknown> })}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={data.rows} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        {formatting.showGridLines !== false && (
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        )}
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <ChartTooltipWrapper />
        {crossFilterValue !== undefined && (
          <ReferenceLine
            x={crossFilterValue as string | number}
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        )}
        {formatting.showLegend !== false && valueKeys.length > 1 && <Legend />}
          {valueKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={(formatting.colorPalette || DEFAULT_COLORS)[index % DEFAULT_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5, cursor: 'pointer' }}
            >
              {formatting.dataLabels && (
                <LabelList
                  dataKey={key}
                  position="top"
                  style={{ fontSize: formatting.dataLabelFontSize || 11, fill: formatting.dataLabelColor || '#374151' }}
                />
              )}
            </Line>
          ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

function ChartTooltipWrapper(props: Record<string, unknown>) {
  return <ChartTooltip {...(props as { active?: boolean; payload?: Array<{ name: string; value: unknown; color?: string }>; label?: string })} formatter={formatTooltipValue} />;
}
