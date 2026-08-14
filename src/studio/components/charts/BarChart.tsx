'use client';

import React, { useMemo, useCallback } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import { getEChartsTheme } from '../../lib/echarts/theme';
import { buildAxesOptions } from '../../lib/echarts/buildAxesOptions';
import type { ThemeMode } from '../../lib/echarts/theme';

interface BarChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  theme?: ThemeMode;
  animation?: boolean;
}

export const BarChart = React.memo(function BarChart({ data, formatting, width, height, crossFilterValue, onCrossFilter, theme = 'transparent', animation = false }: BarChartProps) {
  const xAxisField = data.columns[0];
  const valueField = data.columns[1];

  const option = useMemo(() => {
    const categories = data.rows.map(row => String(row[xAxisField] ?? ''));
    const values = data.rows.map(row => Number(row[valueField] ?? 0));

    const crossFilterSet = crossFilterValue instanceof Set ? crossFilterValue : undefined;
    const itemStyles = data.rows.map((row) => {
      if (!crossFilterSet || crossFilterSet.size === 0) return { opacity: 1 };
      return { opacity: crossFilterSet.has(row[xAxisField]) ? 1 : 0.3 };
    });

    const th = getEChartsTheme(theme);
    const { grid, xAxis, yAxis, legend } = buildAxesOptions(formatting, theme, categories);

    xAxis.data = categories;

    const seriesItem: Record<string, unknown> = {
      type: 'bar' as const,
      data: values.map((v, i) => ({ value: v, itemStyle: itemStyles[i] })),
      barWidth: formatting.barWidth ? `${formatting.barWidth}%` : 'auto',
      itemStyle: {
        color: formatting.barColor ?? th.color[0],
        borderRadius: formatting.barBorderRadius,
      },
      label: {
        show: !!formatting.dataLabels,
        position: (formatting.dataLabelPosition ?? 'top') as string,
        formatter: formatting.dataLabelFormat === 'percent' ? '{c}%' : '{c}',
        fontSize: formatting.dataLabelFontSize ?? 10,
        color: formatting.dataLabelColor,
        fontWeight: formatting.dataLabelFontWeight,
        fontStyle: formatting.dataLabelFontStyle,
      },
    };
    if (formatting.barGap) seriesItem.barGap = formatting.barGap;
    if (formatting.barCategoryGap) seriesItem.barCategoryGap = formatting.barCategoryGap;

    return {
      grid,
      xAxis,
      yAxis,
      series: [seriesItem],
      legend,
    };
  }, [data, formatting, crossFilterValue, xAxisField, valueField, theme]);

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
