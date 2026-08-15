'use client';

import React, { useMemo, useCallback } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import type { ThemeMode } from '../../lib/echarts/theme';

interface SankeyChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  theme?: ThemeMode;
}

export const SankeyChart = React.memo(function SankeyChart({ data, formatting, width, height, crossFilterValue, onCrossFilter, theme = 'transparent' }: SankeyChartProps) {
  const sourceField = data.columns[0];
  const targetField = data.columns[1];
  const valueField = data.columns[2];

  const option = useMemo(() => {
    const nodes = [...new Set([
      ...data.rows.map(r => String(r[sourceField] ?? '')),
      ...data.rows.map(r => String(r[targetField] ?? '')),
    ])].map(name => ({ name }));

    const links = data.rows.map(row => ({
      source: String(row[sourceField] ?? ''),
      target: String(row[targetField] ?? ''),
      value: Number(row[valueField] ?? 0),
    }));

    return {
      tooltip: { trigger: 'item' as const },
      grid: {
        left: formatting.gridPaddingLeft ?? '10%',
        right: formatting.gridPaddingRight ?? '10%',
        top: formatting.gridPaddingTop ?? 60,
        bottom: formatting.gridPaddingBottom ?? 30,
      },
      series: [{
        type: 'sankey' as const,
        layoutIterations: 32,
        data: nodes,
        links,
        orient: formatting.sankeyOrient || 'horizontal',
        nodeAlign: formatting.sankeyNodeAlign || 'justify',
        nodeWidth: formatting.sankeyNodeWidth ?? 20,
        nodeGap: formatting.sankeyNodeGap ?? 8,
        draggable: formatting.sankeyDraggable ?? true,
        focusAdjacentNodesOnHover: formatting.sankeyFocusAdjacency ?? false,
        label: {
          show: formatting.dataLabels,
          fontSize: formatting.dataLabelFontSize,
          color: formatting.dataLabelColor,
          fontWeight: formatting.dataLabelFontWeight,
        },
        lineStyle: {
          color: formatting.sankeyLineStyle || 'gradient',
          curveness: formatting.sankeyLineCurveness ?? 0.5,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: formatting.emphasisShadowBlur,
            shadowColor: formatting.emphasisShadowColor,
          },
          lineStyle: {
            opacity: formatting.emphasisLineOpacity ?? 0.4,
          },
        },
      }],
    };
  }, [data, formatting, sourceField, targetField, valueField]);

  const handleClick = useCallback((params: unknown) => {
    if (onCrossFilter && sourceField) {
      const p = params as { name: string };
      onCrossFilter(sourceField, p.name);
    }
  }, [onCrossFilter, sourceField]);

  return <EChartWrapper option={option} width={width} height={height} theme={theme} onEvents={{ click: handleClick }} />;
});
