'use client';

import React, { useMemo } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import type { ThemeMode } from '../../lib/echarts/theme';

interface WordCloudChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  theme?: ThemeMode;
}

export const WordCloudChart = React.memo(function WordCloudChart({ data, formatting, width, height, theme = 'transparent' }: WordCloudChartProps) {
  const wordField = data.columns[0];
  const valueField = data.columns[1];

  const option = useMemo(() => {
    const wordData = data.rows.map(row => ({
      name: String(row[wordField] ?? ''),
      value: Number(row[valueField] ?? 1),
    }));

    const palette = formatting.colorPalette ?? ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

    return {
      tooltip: { trigger: 'item' as const },
      series: [{
        type: 'scatter' as const,
        data: wordData.map((d, i) => ({
          value: [Math.random() * 100, Math.random() * 100, d.value],
          name: d.name,
          symbolSize: Math.max(
            formatting.wordCloudMinSize ?? formatting.wordCloudSizeRange?.[0] ?? 14,
            Math.min(formatting.wordCloudMaxSize ?? formatting.wordCloudSizeRange?.[1] ?? 80, d.value * 2)
          ),
        })),
        label: {
          show: true,
          formatter: (p: { name?: string }) => p.name || '',
          fontSize: formatting.dataLabelFontSize ?? 14,
          color: formatting.dataLabelColor,
          fontWeight: formatting.dataLabelFontWeight,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: formatting.wordCloudTextShadowBlur ?? 10,
            shadowColor: formatting.wordCloudTextShadowColor ?? '#333',
          },
        },
        symbol: formatting.markerShape,
        symbolSize: formatting.markerSize,
        itemStyle: {
          color: (params: { dataIndex: number }) => palette[params.dataIndex % palette.length],
        },
      }],
    };
  }, [data, formatting, wordField, valueField]);

  return <EChartWrapper option={option} width={width} height={height} theme={theme} />;
});
