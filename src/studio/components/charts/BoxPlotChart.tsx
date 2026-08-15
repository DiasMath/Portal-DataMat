'use client';

import React, { useMemo, useCallback } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import type { ThemeMode } from '../../lib/echarts/theme';
import { buildAxesOptions, buildDataLabelConfig } from '../../lib/chart-options';
import { EChartWrapper } from './EChartWrapper';

interface BoxPlotChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  theme?: ThemeMode;
}

export const BoxPlotChart = React.memo(function BoxPlotChart({ data, formatting, width, height, crossFilterValue, onCrossFilter, theme = 'transparent' }: BoxPlotChartProps) {
  const xAxisField = data.columns[0];
  const valueField = data.columns[1];

  const option = useMemo(() => {
    const categories = [...new Set(data.rows.map(row => String(row[xAxisField] ?? '')))];

    const boxData = categories.map(cat => {
      const values = data.rows
        .filter(row => String(row[xAxisField]) === cat)
        .map(row => Number(row[valueField] ?? 0))
        .sort((a, b) => a - b);

      if (values.length === 0) return [0, 0, 0, 0, 0];

      const q1 = values[Math.floor(values.length * 0.25)];
      const median = values[Math.floor(values.length * 0.5)];
      const q3 = values[Math.floor(values.length * 0.75)];
      const iqr = q3 - q1;
      const lower = Math.max(values[0], q1 - 1.5 * iqr);
      const upper = Math.min(values[values.length - 1], q3 + 1.5 * iqr);

      return [lower, q1, median, q3, upper];
    });

    const axesOptions = buildAxesOptions(formatting, theme);
    const labelConfig = buildDataLabelConfig(formatting);

    return {
      tooltip: { trigger: 'item' as const },
      grid: axesOptions.grid,
      xAxis: { ...axesOptions.xAxis, type: 'category' as const, data: categories },
      yAxis: { ...axesOptions.yAxis, type: 'value' as const },
      legend: axesOptions.legend,
      series: [{
        type: 'boxplot' as const,
        data: boxData,
        itemStyle: {
          color: formatting.barColor ?? '#3b82f6',
          borderColor: formatting.bulletMarkerColor ?? '#f59e0b',
          borderWidth: formatting.barBorderRadius ?? 1,
        },
        label: labelConfig.show ? {
          show: true,
          position: labelConfig.position,
          fontSize: labelConfig.fontSize,
          color: labelConfig.color,
          fontWeight: labelConfig.fontWeight,
        } : undefined,
      }],
    };
  }, [data, formatting, xAxisField, valueField, theme]);

  const handleClick = useCallback((params: unknown) => {
    if (onCrossFilter && xAxisField) {
      const p = params as { name: string };
      onCrossFilter(xAxisField, p.name);
    }
  }, [onCrossFilter, xAxisField]);

  return <EChartWrapper option={option} width={width} height={height} theme={theme} onEvents={{ click: handleClick }} />;
});
