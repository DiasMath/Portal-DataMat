'use client';

import React, { useMemo, useCallback } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import type { ThemeMode } from '../../lib/echarts/theme';

interface PieChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  type?: 'pie' | 'donut';
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  theme?: ThemeMode;
  animation?: boolean;
}

export const PieChart = React.memo(function PieChart({ data, formatting, width, height, type = 'pie', crossFilterValue, onCrossFilter, theme = 'transparent', animation = false }: PieChartProps) {
  const labelField = data.columns[0];
  const valueField = data.columns[1];

  const option = useMemo(() => {
    const pieData = data.rows.map((row) => ({
      name: String(row[labelField] ?? ''),
      value: Number(row[valueField] ?? 0),
    }));

    const innerRadius = type === 'donut' ? `${formatting.innerRadius || 50}%` : '0%';
    const outerRadius = formatting.outerRadius ? `${formatting.outerRadius}%` : '70%';

    return {
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
      series: [{
        type: 'pie' as const,
        radius: [innerRadius, outerRadius],
        data: pieData,
        startAngle: formatting.startAngle ?? 90,
        minAngle: formatting.minAngle ?? 0,
        roseType: formatting.roseType === 'none' ? undefined : formatting.roseType,
        label: {
          show: !!formatting.dataLabels,
          position: formatting.labelPosition || 'outside',
          formatter: formatting.dataLabelFormat === 'percent' ? '{d}%' : '{b}: {c}',
          fontSize: formatting.dataLabelFontSize || 11,
          color: formatting.dataLabelColor || undefined,
          fontWeight: formatting.dataLabelFontWeight || 'normal',
          fontStyle: formatting.dataLabelFontStyle || 'normal',
        },
        itemStyle: {
          color: formatting.pieColor || undefined,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: formatting.emphasisShadowBlur ?? 10,
            shadowOffsetX: 0,
            shadowColor: formatting.emphasisShadowColor || 'rgba(0,0,0,0.3)',
          },
        },
      }],
      legend: formatting.showLegend !== false ? {
        show: true,
        [formatting.legendPosition || 'bottom']: 0,
        textStyle: {
          color: formatting.legendColor || undefined,
          fontSize: formatting.legendFontSize || undefined,
          fontFamily: formatting.legendFontFamily || undefined,
          fontWeight: formatting.legendFontWeight || 'normal',
          fontStyle: formatting.legendFontStyle || 'normal',
        },
      } : { show: false },
    };
  }, [data, formatting, type, labelField, valueField]);

  const handleClick = useCallback((params: unknown) => {
    if (onCrossFilter && labelField) {
      const p = params as { name: string };
      onCrossFilter(labelField, p.name);
    }
  }, [onCrossFilter, labelField]);

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
