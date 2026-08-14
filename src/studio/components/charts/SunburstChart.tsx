'use client';

import React, { useMemo, useCallback } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import type { ThemeMode } from '../../lib/echarts/theme';

interface SunburstChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  theme?: ThemeMode;
}

export const SunburstChart = React.memo(function SunburstChart({ data, formatting, width, height, crossFilterValue, onCrossFilter, theme = 'transparent' }: SunburstChartProps) {
  const labelField = data.columns[0];
  const valueField = data.columns[1];

  const option = useMemo(() => {
    const sunData = data.rows.map(row => ({
      name: String(row[labelField] ?? ''),
      value: Number(row[valueField] ?? 0),
    }));

    return {
      tooltip: { trigger: 'item' as const },
      series: [{
        type: 'sunburst' as const,
        data: sunData,
        radius: [formatting.sunburstInnerRadius ?? '15%', formatting.sunburstOuterRadius ?? '90%'],
        startAngle: formatting.sunburstStartAngle ?? 90,
        sort: (formatting.sunburstSort === 'asc' ? 'asc' : 'desc') as 'desc' | 'asc',
        label: {
          fontSize: formatting.dataLabelFontSize ?? 10,
          color: formatting.dataLabelColor,
          fontWeight: formatting.dataLabelFontWeight,
          rotate: formatting.sunburstLabelRotate ?? 'radial',
        },
        itemStyle: {
          borderWidth: formatting.sunburstItemBorderWidth ?? 2,
          borderColor: formatting.sunburstItemBorderColor ?? '#1a1a2e',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: formatting.emphasisShadowBlur,
            shadowColor: formatting.emphasisShadowColor,
          },
        },
      }],
    };
  }, [data, formatting, labelField, valueField]);

  const handleClick = useCallback((params: unknown) => {
    if (onCrossFilter && labelField) {
      const p = params as { name: string };
      onCrossFilter(labelField, p.name);
    }
  }, [onCrossFilter, labelField]);

  return <EChartWrapper option={option} width={width} height={height} theme={theme} onEvents={{ click: handleClick }} />;
});
