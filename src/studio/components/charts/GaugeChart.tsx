'use client';

import React, { useMemo } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import type { ThemeMode } from '../../lib/echarts/theme';

interface GaugeChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  theme?: ThemeMode;
  animation?: boolean;
}

export const GaugeChart = React.memo(function GaugeChart({ data, formatting, width, height, theme = 'transparent', animation = false }: GaugeChartProps) {
  const valueField = data.columns[0];

  const option = useMemo(() => {
    const value = data.rows[0] ? Number(data.rows[0][valueField] ?? 0) : 0;

    return {
      series: [{
        type: 'gauge' as const,
        startAngle: formatting.gaugeStartAngle ?? 225,
        endAngle: formatting.gaugeEndAngle ?? -45,
        min: formatting.gaugeMin ?? 0,
        max: formatting.gaugeMax ?? 100,
        splitNumber: formatting.gaugeSplitNumber ?? 10,
        progress: { show: true, width: formatting.gaugeProgressWidth ?? formatting.gaugeAxisLineWidth ?? 15 },
        axisLine: {
          lineStyle: {
            width: formatting.gaugeAxisLineWidth ?? 15,
            color: formatting.gaugeAxisLineColors ?? [[0.3,'#ee6666'],[0.7,'#fac858'],[1,'#91cc75']]
          }
        },
        axisTick: { show: formatting.gaugeShowAxisTick ?? false },
        splitLine: { length: formatting.gaugeSplitLineLength ?? 10, lineStyle: { width: 2 } },
        pointer: {
          length: formatting.gaugePointerLength ?? '80%',
          width: formatting.gaugePointerWidth ?? 8,
          offsetCenter: formatting.gaugePointerOffsetCenter ?? [0, '70%'],
          itemStyle: { color: formatting.gaugeColor || '#f59e0b' }
        },
        anchor: { show: formatting.gaugeAnchorShow ?? true, size: formatting.gaugeAnchorSize ?? 10 },
        title: {
          show: false,
          offsetCenter: formatting.gaugeTitleOffsetCenter ?? [0, '70%'],
          fontSize: formatting.gaugeTitleFontSize ?? 14,
          color: formatting.gaugeTitleColor ?? '#333'
        },
        detail: {
          valueAnimation: true,
          offsetCenter: formatting.gaugeDetailOffsetCenter ?? [0, '40%'],
          fontSize: formatting.gaugeDetailFontSize ?? 35,
          formatter: formatting.gaugeDetailFormatter ?? '{value}%',
        },
        data: [{ value, name: '' }],
      }],
    };
  }, [data, formatting, valueField]);

  return <EChartWrapper option={option} width={width} height={height} theme={theme} animation={animation} />;
});
