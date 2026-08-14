'use client';

import React, { useMemo, useCallback } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import type { ThemeMode } from '../../lib/echarts/theme';

interface ScatterChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  theme?: ThemeMode;
  animation?: boolean;
}

export const ScatterChart = React.memo(function ScatterChart({ data, formatting, width, height, crossFilterValue, onCrossFilter, theme = 'transparent', animation = false }: ScatterChartProps) {
  const xField = data.columns[0];
  const yField = data.columns[1];
  const sizeField = data.columns[2];

  const option = useMemo(() => {
    const scatterData = data.rows.map(row => {
      const x = Number(row[xField] ?? 0);
      const y = Number(row[yField] ?? 0);
      const size = sizeField ? Number(row[sizeField] ?? 10) : 10;
      return [x, y, size];
    });

    const crossFilterSet = crossFilterValue instanceof Set ? crossFilterValue : undefined;

    const grid = {
      left: formatting.gridPaddingLeft ?? 50,
      right: formatting.gridPaddingRight ?? 20,
      top: formatting.gridPaddingTop ?? 20,
      bottom: formatting.gridPaddingBottom ?? 30,
    };

    const xAxis: Record<string, unknown> = {
      type: 'value' as const,
        name: formatting.xAxisTitle || xField,
      show: formatting.xAxisShow,
      axisLine: { lineStyle: { color: formatting.xAxisLineColor } },
      axisLabel: {
        color: formatting.xAxisColor,
        fontSize: formatting.xAxisFontSize,
        fontFamily: formatting.xAxisFontFamily,
        fontWeight: formatting.xAxisFontWeight,
        rotate: formatting.xAxisLabelRotate ? Number(formatting.xAxisLabelRotate) || undefined : undefined,
      },
      min: formatting.xAxisMin,
      max: formatting.xAxisMax,
    };

    const yAxis: Record<string, unknown> = {
      type: 'value' as const,
        name: formatting.yAxisTitle || yField,
      show: formatting.yAxisShow,
      axisLine: { lineStyle: { color: formatting.yAxisLineColor } },
      axisLabel: {
        color: formatting.yAxisColor,
        fontSize: formatting.yAxisFontSize,
        fontFamily: formatting.yAxisFontFamily,
        fontWeight: formatting.yAxisFontWeight,
      },
      min: formatting.yAxisMin,
      max: formatting.yAxisMax,
    };

    const series: Record<string, unknown>[] = [{
      type: 'scatter' as const,
      data: scatterData,
      symbolSize: (val: number[]) => val[2] || formatting.markerSize || 10,
      label: {
        show: !!formatting.dataLabels,
        formatter: formatting.dataLabelFormat === 'percent' ? '{d}%' : '{c}',
        fontSize: formatting.dataLabelFontSize || 10,
        color: formatting.dataLabelColor,
        fontWeight: formatting.dataLabelFontWeight,
        fontStyle: formatting.dataLabelFontStyle,
        position: (formatting.dataLabelPosition === 'outside' ? 'top' : formatting.dataLabelPosition ?? 'top') as 'top' | 'bottom' | 'inside' | 'insideTop' | 'insideBottom' | 'left' | 'right',
      },
    }];

    const legend: Record<string, unknown> = formatting.showLegend !== false
      ? {
          show: true,
          [formatting.legendPosition === 'left' ? 'left' : formatting.legendPosition === 'right' ? 'right' : formatting.legendPosition === 'top' ? 'top' : 'bottom']: formatting.legendPosition ? 0 : undefined,
          bottom: formatting.legendPosition === 'bottom' || !formatting.legendPosition ? 0 : undefined,
          top: formatting.legendPosition === 'top' ? 0 : undefined,
          left: formatting.legendPosition === 'left' ? 0 : undefined,
          right: formatting.legendPosition === 'right' ? 0 : undefined,
          textStyle: {
            color: formatting.legendColor,
            fontSize: formatting.legendFontSize,
            fontFamily: formatting.legendFontFamily,
            fontWeight: formatting.legendFontWeight,
            fontStyle: formatting.legendFontStyle,
          },
        }
      : { show: false };

    const splitLine: Record<string, unknown> = formatting.showGridLines === false
      ? { show: false }
      : {
          lineStyle: {
            color: formatting.gridLineColor,
            width: formatting.gridLineWidth,
            type: formatting.gridLineDash ? 'dashed' : undefined,
          },
        };

    xAxis.splitLine = splitLine;
    yAxis.splitLine = splitLine;

    return {
      grid,
      xAxis,
      yAxis,
      series,
      legend,
    };
  }, [data, formatting, xField, yField, sizeField]);

  const handleClick = useCallback((params: unknown) => {
    if (onCrossFilter && xField) {
      const p = params as { dataIndex: number };
      onCrossFilter(xField, data.rows[p.dataIndex]?.[xField]);
    }
  }, [onCrossFilter, xField, data.rows]);

  return (
    <EChartWrapper
      option={option}
      width={width}
      height={height}
      theme={theme}
      animation={animation}
      onEvents={{ click: handleClick }}
    />
  );
});
