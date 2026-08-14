'use client';

import React, { useMemo } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import { buildAxesOptions } from '../../lib/echarts/buildAxesOptions';
import type { ThemeMode } from '../../lib/echarts/theme';

interface WaterfallChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  theme?: ThemeMode;
}

export const WaterfallChart = React.memo(function WaterfallChart({ data, formatting, width, height, theme = 'transparent' }: WaterfallChartProps) {
  const xAxisField = data.columns[0];
  const valueField = data.columns[1];

  const option = useMemo(() => {
    const categories = data.rows.map(row => String(row[xAxisField] ?? ''));
    const values = data.rows.map(row => Number(row[valueField] ?? 0));

    let runningTotal = 0;
    const transparentData: number[] = [];
    const positiveData: number[] = [];
    const negativeData: number[] = [];

    values.forEach((val) => {
      if (val >= 0) {
        transparentData.push(runningTotal);
        positiveData.push(val);
        negativeData.push(0);
        runningTotal += val;
      } else {
        runningTotal += val;
        transparentData.push(runningTotal);
        positiveData.push(0);
        negativeData.push(Math.abs(val));
      }
    });

    categories.push('Total');
    transparentData.push(0);
    positiveData.push(runningTotal);
    negativeData.push(0);

    const { grid, xAxis, yAxis, legend } = buildAxesOptions(formatting, theme, categories);

    xAxis.data = categories;

    return {
      grid,
      xAxis,
      yAxis,
      series: [
        {
          type: 'bar' as const,
          stack: 'waterfall',
          data: transparentData,
          itemStyle: { color: 'transparent' },
          emphasis: { itemStyle: { color: 'transparent' } },
          lineStyle: {
            color: formatting.waterfallLineColor ?? '#5470c6',
            width: formatting.waterfallLineWidth ?? 1,
          },
        },
        {
          type: 'bar' as const,
          stack: 'waterfall',
          data: positiveData,
          itemStyle: { color: formatting.waterfallPositiveColor ?? '#52c41a', borderRadius: formatting.barBorderRadius },
          label: {
            show: !!formatting.dataLabels,
            position: (formatting.dataLabelPosition === 'outside' ? 'top' : formatting.dataLabelPosition ?? 'top') as 'top' | 'bottom' | 'inside' | 'insideTop' | 'insideBottom' | 'left' | 'right',
            fontSize: formatting.dataLabelFontSize ?? 10,
            color: formatting.dataLabelColor,
            fontWeight: formatting.dataLabelFontWeight,
            fontStyle: formatting.dataLabelFontStyle,
          },
        },
        {
          type: 'bar' as const,
          stack: 'waterfall',
          data: negativeData,
          itemStyle: { color: formatting.waterfallNegativeColor ?? '#ee6666' },
          label: {
            show: !!formatting.dataLabels,
            position: 'bottom' as const,
            fontSize: formatting.dataLabelFontSize ?? 10,
            color: formatting.dataLabelColor,
            fontWeight: formatting.dataLabelFontWeight,
            fontStyle: formatting.dataLabelFontStyle,
          },
        },
      ],
      legend,
    };
  }, [data, formatting, xAxisField, valueField, theme]);

  return <EChartWrapper option={option} width={width} height={height} theme={theme} />;
});
