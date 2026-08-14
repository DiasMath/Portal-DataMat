'use client';

import React, { useMemo } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import { buildAxesOptions } from '../../lib/echarts/buildAxesOptions';
import type { ThemeMode } from '../../lib/echarts/theme';

interface BulletChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  theme?: ThemeMode;
}

export const BulletChart = React.memo(function BulletChart({ data, formatting, width, height, theme = 'transparent' }: BulletChartProps) {
  const labelField = data.columns[0];
  const valueField = data.columns[1];
  const targetField = data.columns[2];

  const option = useMemo(() => {
    const labels = data.rows.map(row => String(row[labelField] ?? ''));
    const values = data.rows.map(row => Number(row[valueField] ?? 0));
    const targets = data.rows.map(row => Number(row[targetField] ?? 0));

    const { grid, xAxis, yAxis, legend } = buildAxesOptions(formatting, theme, labels);

    xAxis.data = labels;

    return {
      grid,
      xAxis,
      yAxis,
      series: [
        {
          type: 'bar' as const,
          data: values,
          barWidth: formatting.bulletBarWidth ?? formatting.barWidth ?? '40%',
          itemStyle: {
            color: formatting.bulletColor ?? formatting.barColor ?? '#3b82f6',
            borderRadius: formatting.barBorderRadius,
          },
          markLine: {
            data: targets.map((t, i) => ({
              xAxis: labels[i],
              yAxis: t,
              symbol: 'none',
              lineStyle: { color: formatting.bulletTargetColor ?? formatting.bulletMarkerColor ?? '#f59e0b', width: formatting.bulletTargetWidth ?? formatting.bulletMarkerWidth ?? 2 },
            })),
          },
        },
      ],
      legend,
    };
  }, [data, formatting, labelField, valueField, targetField, theme]);

  return <EChartWrapper option={option} width={width} height={height} theme={theme} />;
});
