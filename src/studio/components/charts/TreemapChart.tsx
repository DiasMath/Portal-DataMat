'use client';

import React, { useMemo, useCallback } from 'react';
import type { VisualFormatting } from '../../types/visuals';
import type { QueryResultData } from '../../types/visuals';
import { EChartWrapper } from './EChartWrapper';
import type { ThemeMode } from '../../lib/echarts/theme';

interface TreemapChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  theme?: ThemeMode;
}

export const TreemapChart = React.memo(function TreemapChart({ data, formatting, width, height, crossFilterValue, onCrossFilter, theme = 'transparent' }: TreemapChartProps) {
  const labelField = data.columns[0];
  const valueField = data.columns[1];

  const option = useMemo(() => {
    const treeData = data.rows.map(row => ({
      name: String(row[labelField] ?? ''),
      value: Number(row[valueField] ?? 0),
    }));

    return {
      tooltip: { trigger: 'item' as const },
      series: [{
        type: 'treemap' as const,
        data: treeData,
        breadth: formatting.treemapBreadth ?? 20,
        depth: formatting.treemapDepth ?? 2,
        drillDownIcon: formatting.treemapDrillDownIcon ?? '▶',
        leafDepth: formatting.treemapLeafDepth ?? 2,
        roam: formatting.treemapRoam ?? 'zoom',
        nodeClick: formatting.treemapNodeClick ?? 'zoomToNode',
        zoomToNodeRatio: formatting.treemapZoomToNodeRatio ?? (0.1 * 0.1),
        label: {
          show: formatting.dataLabels ?? true,
          formatter: '{b}',
          fontSize: formatting.dataLabelFontSize,
          color: formatting.dataLabelColor,
          fontWeight: formatting.dataLabelFontWeight,
          fontStyle: formatting.dataLabelFontStyle,
        },
        upperLabel: {
          show: formatting.treemapUpperLabelShow ?? true,
          height: formatting.treemapUpperLabelHeight ?? 15,
        },
        levels: [{
          itemStyle: {
            borderColor: formatting.treemapItemBorderColor ?? formatting.treemapBorderColor ?? '#fff',
            borderWidth: formatting.treemapItemBorderWidth ?? formatting.treemapBorderWidth ?? 2,
            gapWidth: formatting.treemapItemGapWidth ?? formatting.treemapGapWidth ?? 2,
          },
        }],
        breadcrumb: { show: formatting.treemapBreadcrumbShow ?? true },
      }],
    };
  }, [data, formatting, labelField, valueField]);

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
      onEvents={{ click: handleClick }}
    />
  );
});