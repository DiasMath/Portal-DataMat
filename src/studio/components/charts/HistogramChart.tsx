'use client';

import React, { useMemo } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import type { ThemeMode } from '../../lib/echarts/theme';

interface HistogramChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  theme?: ThemeMode;
}

export const HistogramChart = React.memo(function HistogramChart({ data, formatting, width, height, theme = 'transparent' }: HistogramChartProps) {
  const valueField = data.columns[0];

  const option = useMemo(() => {
    const values = data.rows.map(row => Number(row[valueField] ?? 0));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = formatting.histogramBins ?? 10;
    const binSize = (max - min) / binCount;

    const categories: string[] = [];
    const counts: number[] = [];

    for (let i = 0; i < binCount; i++) {
      const start = min + i * binSize;
      const end = start + binSize;
      categories.push(`${start.toFixed(1)}-${end.toFixed(1)}`);
      counts.filter(() => true);
      const count = values.filter(v => v >= start && (i === binCount - 1 ? v <= end : v < end)).length;
      counts.push(count);
    }

    return {
      grid: {
        left: formatting.gridPaddingLeft ?? 50,
        right: formatting.gridPaddingRight ?? 20,
        top: formatting.gridPaddingTop ?? 20,
        bottom: formatting.gridPaddingBottom ?? 40,
      },
      xAxis: {
        type: 'category' as const,
        data: categories,
        show: formatting.xAxisShow ?? true,
        name: formatting.xAxisTitle,
        axisLabel: {
          color: formatting.xAxisColor,
          fontSize: formatting.xAxisFontSize ?? 9,
          fontFamily: formatting.xAxisFontFamily,
          fontWeight: formatting.xAxisFontWeight,
          rotate: formatting.xAxisLabelRotate === 'auto' ? 0 : Number(formatting.xAxisLabelRotate ?? 45),
        },
        axisLine: { lineStyle: { color: formatting.xAxisLineColor } },
      },
      yAxis: {
        type: 'value' as const,
        name: formatting.yAxisTitle ?? 'Frequencia',
        show: formatting.yAxisShow ?? true,
        axisLabel: {
          color: formatting.yAxisColor,
          fontSize: formatting.yAxisFontSize,
          fontFamily: formatting.yAxisFontFamily,
          fontWeight: formatting.yAxisFontWeight,
        },
        min: formatting.yAxisMin === 'auto' ? undefined : formatting.yAxisMin,
        max: formatting.yAxisMax === 'auto' ? undefined : formatting.yAxisMax,
        axisLine: { lineStyle: { color: formatting.yAxisLineColor } },
      },
      series: [{
        type: 'bar' as const,
        data: counts,
        barWidth: formatting.barWidth,
        itemStyle: {
          color: formatting.barColor,
          borderRadius: formatting.barBorderRadius ?? [4, 4, 0, 0],
        },
        label: {
          show: formatting.dataLabels,
          position: (formatting.dataLabelPosition === 'outside' ? 'top' : formatting.dataLabelPosition ?? 'top') as 'top' | 'bottom' | 'inside' | 'insideTop' | 'insideBottom' | 'left' | 'right',
          formatter: formatting.dataLabelFormat === 'percent' ? '{c}%' : undefined,
          fontSize: formatting.dataLabelFontSize,
          color: formatting.dataLabelColor,
          fontWeight: formatting.dataLabelFontWeight,
        },
      }],
      legend: {
        show: formatting.showLegend ?? false,
        left: formatting.legendPosition === 'left' ? 'left' : formatting.legendPosition === 'right' ? 'right' : formatting.legendPosition === 'bottom' ? 'center' : undefined,
        top: formatting.legendPosition === 'top' ? 'top' : formatting.legendPosition === 'bottom' ? 'bottom' : undefined,
        textStyle: {
          color: formatting.legendColor,
          fontSize: formatting.legendFontSize,
          fontFamily: formatting.legendFontFamily,
          fontWeight: formatting.legendFontWeight,
        },
      },
    };
  }, [data, formatting, valueField]);

  return <EChartWrapper option={option} width={width} height={height} theme={theme} />;
});
