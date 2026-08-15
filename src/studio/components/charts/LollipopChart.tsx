'use client';

import React, { useMemo, useCallback } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import { buildAxesOptions } from '../../lib/echarts/buildAxesOptions';
import type { ThemeMode } from '../../lib/echarts/theme';

interface LollipopChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  theme?: ThemeMode;
}

export const LollipopChart = React.memo(function LollipopChart({ data, formatting, width, height, crossFilterValue, onCrossFilter, theme = 'transparent' }: LollipopChartProps) {
  const xAxisField = data.columns[0];
  const valueField = data.columns[1];

  const option = useMemo(() => {
    const categories = data.rows.map(row => String(row[xAxisField] ?? ''));
    const values = data.rows.map(row => Number(row[valueField] ?? 0));

    const { grid, xAxis, yAxis, legend } = buildAxesOptions(formatting, theme, categories);

    xAxis.data = categories;

    return {
      grid,
      xAxis,
      yAxis,
      series: [
        {
          type: 'bar' as const,
          data: values,
          barWidth: formatting.barWidth ?? '20%',
          itemStyle: {
            color: formatting.barColor,
            borderRadius: formatting.barBorderRadius ?? [0, 0, 0, 0],
          },
          lineStyle: {
            color: formatting.lineColor,
            width: formatting.lineWidth,
          },
          z: 1,
        },
        {
          type: 'scatter' as const,
          data: values,
          symbolSize: formatting.markerSize ?? 10,
          symbol: formatting.markerShape,
          label: {
            show: formatting.dataLabels,
            position: (formatting.dataLabelPosition === 'outside' ? 'top' : formatting.dataLabelPosition ?? 'top') as 'top' | 'bottom' | 'inside' | 'insideTop' | 'insideBottom' | 'left' | 'right',
            formatter: formatting.dataLabelFormat === 'percent' ? '{c}%' : undefined,
            fontSize: formatting.dataLabelFontSize,
            color: formatting.dataLabelColor,
            fontWeight: formatting.dataLabelFontWeight,
          },
          z: 2,
        },
      ],
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
