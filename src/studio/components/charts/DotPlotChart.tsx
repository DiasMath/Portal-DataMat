'use client';

import React, { useMemo, useCallback } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import { buildAxesOptions } from '../../lib/echarts/buildAxesOptions';
import type { ThemeMode } from '../../lib/echarts/theme';

interface DotPlotChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  theme?: ThemeMode;
}

export const DotPlotChart = React.memo(function DotPlotChart({ data, formatting, width, height, crossFilterValue, onCrossFilter, theme = 'transparent' }: DotPlotChartProps) {
  const xAxisField = data.columns[0];
  const valueField = data.columns[1];

  const option = useMemo(() => {
    const categories = [...new Set(data.rows.map(row => String(row[xAxisField] ?? '')))];

    const scatterData = data.rows.map(row => {
      const cat = String(row[xAxisField] ?? '');
      const y = Number(row[valueField] ?? 0);
      const x = categories.indexOf(cat);
      return [x, y];
    });

    const { grid, xAxis, yAxis, legend } = buildAxesOptions(formatting, theme, categories);

    xAxis.data = categories;

    return {
      grid,
      xAxis,
      yAxis,
      series: [{
        type: 'scatter' as const,
        data: scatterData,
        symbolSize: formatting.markerSize ?? 8,
        symbol: formatting.markerShape,
        itemStyle: { opacity: 0.7 },
        label: {
          show: formatting.dataLabels,
          position: (formatting.dataLabelPosition as 'top' | 'inside' | 'insideTop' | 'insideBottom') ?? 'top',
          formatter: formatting.dataLabelFormat === 'percent' ? '{c}%' : undefined,
          fontSize: formatting.dataLabelFontSize,
          color: formatting.dataLabelColor,
          fontWeight: formatting.dataLabelFontWeight,
        },
      }],
      legend,
    };
  }, [data, formatting, xAxisField, valueField, theme]);

  const handleClick = useCallback((params: unknown) => {
    if (onCrossFilter && xAxisField) {
      const p = params as { dataIndex: number };
      onCrossFilter(xAxisField, data.rows[p.dataIndex]?.[xAxisField]);
    }
  }, [onCrossFilter, xAxisField, data.rows]);

  return <EChartWrapper option={option} width={width} height={height} theme={theme} onEvents={{ click: handleClick }} />;
});
