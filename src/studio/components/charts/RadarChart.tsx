'use client';

import React, { useMemo, useCallback } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import type { ThemeMode } from '../../lib/echarts/theme';

interface RadarChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  theme?: ThemeMode;
}

export const RadarChart = React.memo(function RadarChart({ data, formatting, width, height, crossFilterValue, onCrossFilter, theme = 'transparent' }: RadarChartProps) {
  const indicatorField = data.columns[0];
  const valueField = data.columns[1];

  const option = useMemo(() => {
    const indicators = data.rows.map(row => ({
      name: String(row[indicatorField] ?? ''),
      max: Number(row[valueField] ?? 100) * 1.2,
    }));

    const values = data.rows.map(row => Number(row[valueField] ?? 0));

    return {
      radar: {
        indicator: indicators,
        shape: formatting.radarShape ?? 'polygon',
        radius: formatting.radarRadius ?? '70%',
        startAngle: formatting.radarStartAngle ?? 90,
        splitNumber: formatting.radarSplitNumber ?? 5,
        axisName: {
          show: formatting.radarAxisName !== false,
          color: formatting.radarAxisNameColor,
          fontSize: formatting.radarAxisNameFontSize ?? 11,
        },
        splitLine: {
          lineStyle: {
            color: formatting.radarSplitLineColor,
            width: formatting.radarSplitLineWidth,
            type: formatting.radarSplitLineDash,
          },
        },
        splitArea: {
          areaStyle: {
            color: formatting.radarSplitAreaColor ? [formatting.radarSplitAreaColor] : undefined,
          },
        },
        axisLine: {
          lineStyle: {
            color: formatting.radarAxisLineColor,
          },
        },
      },
      series: [{
        type: 'radar' as const,
        data: [{ value: values, name: '' }],
        areaStyle: { opacity: formatting.radarAreaOpacity ?? 0.3 },
        lineStyle: { width: formatting.radarLineWidth ?? 2 },
        symbol: formatting.markerShape,
        symbolSize: formatting.markerSize,
        label: {
          show: !!formatting.dataLabels,
          formatter: formatting.dataLabelFormat === 'percent' ? '{d}%' : '{c}',
          fontSize: formatting.dataLabelFontSize ?? 10,
          color: formatting.dataLabelColor,
          fontWeight: formatting.dataLabelFontWeight,
          fontStyle: formatting.dataLabelFontStyle,
          position: (formatting.dataLabelPosition === 'outside' ? 'top' : formatting.dataLabelPosition ?? 'top') as 'top' | 'bottom' | 'inside' | 'insideTop' | 'insideBottom' | 'left' | 'right',
        },
      }],
      legend: {
        show: formatting.showLegend !== false,
        top: formatting.legendPosition === 'top' ? 'top' : undefined,
        bottom: formatting.legendPosition === 'bottom' ? 'bottom' : undefined,
        left: formatting.legendPosition === 'left' ? 'left' : formatting.legendPosition === 'right' ? undefined : 'center',
        right: formatting.legendPosition === 'right' ? 'right' : undefined,
        textStyle: {
          color: formatting.legendColor,
          fontSize: formatting.legendFontSize,
          fontFamily: formatting.legendFontFamily,
          fontWeight: formatting.legendFontWeight,
          fontStyle: formatting.legendFontStyle,
        },
      },
      tooltip: { trigger: 'item' as const },
    };
  }, [data, formatting, indicatorField, valueField]);

  const handleClick = useCallback((params: unknown) => {
    if (onCrossFilter && indicatorField) {
      const p = params as { dataIndex: number };
      onCrossFilter(indicatorField, data.rows[p.dataIndex]?.[indicatorField]);
    }
  }, [onCrossFilter, indicatorField, data.rows]);

  return <EChartWrapper option={option} width={width} height={height} theme={theme} onEvents={{ click: handleClick }} />;
});
