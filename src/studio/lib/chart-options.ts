import type { VisualFormatting } from '../types/visuals';
import type { ThemeMode } from './echarts/theme';
import { getEChartsTheme } from './echarts/theme';

export interface AxesOptions {
  grid: { left: number; right: number; top: number; bottom: number };
  xAxis: Record<string, unknown>;
  yAxis: Record<string, unknown>;
  legend: Record<string, unknown>;
}

export function buildAxesOptions(formatting: VisualFormatting, _theme: ThemeMode = 'transparent'): AxesOptions {
  const themeConfig = getEChartsTheme(_theme);

  const grid = {
    left: formatting.gridPaddingLeft ?? 50,
    right: formatting.gridPaddingRight ?? 20,
    top: formatting.gridPaddingTop ?? 20,
    bottom: formatting.gridPaddingBottom ?? 30,
  };

  const xAxis = {
    show: formatting.xAxisShow !== false,
    name: formatting.xAxisTitle,
    nameTextStyle: formatting.xAxisTitle ? {
      color: formatting.xAxisColor,
      fontSize: formatting.xAxisFontSize,
      fontFamily: formatting.xAxisFontFamily,
      fontWeight: formatting.xAxisFontWeight,
    } : undefined,
    axisLabel: {
      color: formatting.xAxisColor,
      fontSize: formatting.xAxisFontSize,
      fontFamily: formatting.xAxisFontFamily,
      fontWeight: formatting.xAxisFontWeight,
      rotate: formatting.xAxisLabelRotate === 'auto' ? 0 : Number(formatting.xAxisLabelRotate ?? 0),
    },
    axisLine: { lineStyle: { color: formatting.xAxisLineColor } },
    axisTick: formatting.xAxisShow === false ? { show: false } : undefined,
    min: formatting.xAxisMin === 'auto' ? undefined : formatting.xAxisMin,
    max: formatting.xAxisMax === 'auto' ? undefined : formatting.xAxisMax,
    splitLine: formatting.showGridLines === false ? { show: false } : {
      show: true,
      lineStyle: {
        color: formatting.gridLineColor,
        width: formatting.gridLineWidth,
        type: formatting.gridLineDash ? 'dashed' as const : 'solid' as const,
      },
    },
  };

  const yAxis = {
    show: formatting.yAxisShow !== false,
    name: formatting.yAxisTitle,
    nameTextStyle: formatting.yAxisTitle ? {
      color: formatting.yAxisColor,
      fontSize: formatting.yAxisFontSize,
      fontFamily: formatting.yAxisFontFamily,
      fontWeight: formatting.yAxisFontWeight,
    } : undefined,
    axisLabel: {
      color: formatting.yAxisColor,
      fontSize: formatting.yAxisFontSize,
      fontFamily: formatting.yAxisFontFamily,
      fontWeight: formatting.yAxisFontWeight,
    },
    axisLine: { lineStyle: { color: formatting.yAxisLineColor } },
    axisTick: formatting.yAxisShow === false ? { show: false } : undefined,
    min: formatting.yAxisMin === 'auto' ? undefined : formatting.yAxisMin,
    max: formatting.yAxisMax === 'auto' ? undefined : formatting.yAxisMax,
    splitLine: formatting.showGridLines === false ? { show: false } : {
      show: true,
      lineStyle: {
        color: formatting.gridLineColor,
        width: formatting.gridLineWidth,
        type: formatting.gridLineDash ? 'dashed' as const : 'solid' as const,
      },
    },
  };

  const legendColor = formatting.legendColor ?? (themeConfig as Record<string, unknown>).textStyle
    ? ((themeConfig as Record<string, unknown>).textStyle as Record<string, string>)?.color
    : undefined;

  const legend = {
    show: formatting.showLegend !== false,
    left: formatting.legendPosition === 'left' ? 'left' : formatting.legendPosition === 'right' ? 'right' : formatting.legendPosition === 'bottom' ? 'center' : undefined,
    top: formatting.legendPosition === 'top' ? 'top' : formatting.legendPosition === 'bottom' ? 'bottom' : undefined,
    textStyle: {
      color: formatting.legendColor ?? legendColor,
      fontSize: formatting.legendFontSize,
      fontFamily: formatting.legendFontFamily,
      fontWeight: formatting.legendFontWeight,
      fontStyle: formatting.legendFontStyle,
    },
  };

  return { grid, xAxis, yAxis, legend };
}

export function buildDataLabelConfig(formatting: VisualFormatting) {
  return {
    show: !!formatting.dataLabels,
    position: (formatting.dataLabelPosition === 'outside' ? 'top' : formatting.dataLabelPosition ?? 'top') as 'top' | 'bottom' | 'inside' | 'insideTop' | 'insideBottom' | 'left' | 'right',
    formatter: formatting.dataLabelFormat === 'percent' ? '{c}%' : '{c}',
    fontSize: formatting.dataLabelFontSize,
    color: formatting.dataLabelColor,
    fontWeight: formatting.dataLabelFontWeight,
    fontStyle: formatting.dataLabelFontStyle,
  };
}
