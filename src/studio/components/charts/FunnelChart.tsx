'use client';

import React, { useMemo, useCallback } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import type { ThemeMode } from '../../lib/echarts/theme';

interface FunnelChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  theme?: ThemeMode;
}

const DEFAULT_PALETTE = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666',
  '#73c0de', '#3ba272', '#fc8452', '#9a60b4',
  '#ea7ccc', '#48b8d0', '#f5994e', '#c0504d',
];

export const FunnelChart = React.memo(function FunnelChart({ data, formatting, width, height, crossFilterValue, onCrossFilter, theme = 'transparent' }: FunnelChartProps) {
  const labelField = data.columns[0];
  const valueField = data.columns[1];

  const option = useMemo(() => {
    const funnelData = data.rows.map((row, idx) => ({
      name: String(row[labelField] ?? ''),
      value: Number(row[valueField] ?? 0),
      itemStyle: {
        color: DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
      },
    }));

    return {
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c}' },
      legend: formatting.showLegend !== false ? {
        show: true,
        orient: (formatting.legendPosition === 'left' || formatting.legendPosition === 'right' ? 'vertical' : 'horizontal') as 'vertical' | 'horizontal',
        left: formatting.legendPosition === 'right' ? 'right' : formatting.legendPosition === 'left' ? 'left' : 'center',
        top: formatting.legendPosition === 'top' ? 'top' : formatting.legendPosition === 'bottom' ? 'bottom' : undefined,
        textStyle: {
          color: formatting.legendColor,
          fontSize: formatting.legendFontSize,
          fontFamily: formatting.legendFontFamily,
          fontWeight: formatting.legendFontWeight,
          fontStyle: formatting.legendFontStyle,
        },
      } : { show: false },
      series: [{
        type: 'funnel' as const,
        left: formatting.gridPaddingLeft != null ? `${formatting.gridPaddingLeft}%` : '10%',
        right: formatting.gridPaddingRight != null ? `${formatting.gridPaddingRight}%` : '10%',
        top: formatting.gridPaddingTop != null ? `${formatting.gridPaddingTop}%` : undefined,
        bottom: formatting.gridPaddingBottom != null ? `${formatting.gridPaddingBottom}%` : undefined,
        width: '80%',
        sort: formatting.funnelSort ?? 'descending',
        align: formatting.funnelAlign ?? 'center',
        gap: formatting.funnelGap ?? 2,
        minSize: formatting.funnelMinSize ?? '0%',
        maxSize: formatting.funnelMaxSize ?? '100%',
        label: {
          show: !!formatting.dataLabels,
          position: (formatting.dataLabelPosition === 'outside' ? 'outer' : formatting.dataLabelPosition === 'inside' ? 'inner' : formatting.dataLabelPosition ?? 'inner') as 'center' | 'outer' | 'inner' | 'rightTop' | 'rightBottom' | 'leftTop' | 'leftBottom',
          formatter: '{b}: {c}',
          fontSize: formatting.dataLabelFontSize ?? 11,
          color: formatting.dataLabelColor,
          fontWeight: formatting.dataLabelFontWeight,
          fontStyle: formatting.dataLabelFontStyle,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: formatting.emphasisShadowBlur,
            shadowColor: formatting.emphasisShadowColor,
          },
        },
        data: funnelData,
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
