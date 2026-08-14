'use client';

import React, { useMemo, useCallback } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import { buildAxesOptions } from '../../lib/echarts/buildAxesOptions';
import type { ThemeMode } from '../../lib/echarts/theme';

interface LineChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  type?: 'line' | 'area';
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  theme?: ThemeMode;
  animation?: boolean;
}

export const LineChart = React.memo(function LineChart({ data, formatting, width, height, type = 'line', crossFilterValue, onCrossFilter, theme = 'transparent', animation = false }: LineChartProps) {
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
      series: [{
        type: 'line' as const,
        data: values,
        smooth: formatting.smooth ?? false,
        step: formatting.step ? 'start' as const : (false as const),
        areaStyle: type === 'area'
          ? {
              opacity: formatting.areaOpacity ?? 0.3,
              color: formatting.areaColor,
            }
          : undefined,
        lineStyle: {
          color: formatting.lineColor,
          width: formatting.lineWidth ?? 2,
          type: formatting.lineStyle === 'dashed' ? 'dashed' as const
            : formatting.lineStyle === 'dotted' ? 'dotted' as const
            : 'solid' as const,
        },
        symbol: formatting.markerShape ?? (formatting.showMarkers !== false ? 'circle' : 'none'),
        symbolSize: formatting.markerSize ?? 4,
        label: {
          show: !!formatting.dataLabels,
          position: (formatting.dataLabelPosition === 'outside' ? 'top' : formatting.dataLabelPosition ?? 'top') as 'top' | 'bottom' | 'inside' | 'insideTop' | 'insideBottom' | 'left' | 'right',
          formatter: formatting.dataLabelFormat === 'percent' ? '{c}%' : '{c}',
          fontSize: formatting.dataLabelFontSize ?? 10,
          color: formatting.dataLabelColor,
          fontWeight: formatting.dataLabelFontWeight,
          fontStyle: formatting.dataLabelFontStyle,
        },
      }],
      legend,
    };
  }, [data, formatting, crossFilterValue, xAxisField, valueField, theme, type]);

  const handleClick = useCallback((params: unknown) => {
    if (onCrossFilter && xAxisField) {
      const p = params as { dataIndex: number };
      onCrossFilter(xAxisField, data.rows[p.dataIndex]?.[xAxisField]);
    }
  }, [onCrossFilter, xAxisField, data.rows]);

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
