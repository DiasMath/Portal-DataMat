import type { VisualFormatting } from '../../types/visuals';
import { getEChartsTheme } from './theme';
import type { ThemeMode } from './theme';

interface AxesOptions {
  grid: Record<string, unknown>;
  xAxis: Record<string, unknown>;
  yAxis: Record<string, unknown>;
  legend: Record<string, unknown>;
}

export function buildAxesOptions(
  formatting: VisualFormatting,
  theme: ThemeMode = 'transparent',
  categories?: string[],
): AxesOptions {
  const th = getEChartsTheme(theme);

  const gridPaddingLeft = formatting.gridPaddingLeft ?? 50;
  const gridPaddingRight = formatting.gridPaddingRight ?? 20;
  const gridPaddingTop = formatting.gridPaddingTop ?? (formatting.showLegend !== false ? 40 : 20);
  const gridPaddingBottom = formatting.gridPaddingBottom ?? 30;

  const gridLineDash = formatting.gridLineDash ? 'dashed' : 'solid';

  const xAxisLabelRotate = formatting.xAxisLabelRotate === 'auto'
    ? ((categories?.length || 0) > 8 ? 45 : 0)
    : Number(formatting.xAxisLabelRotate ?? 0);

  const xAxisLabel: Record<string, unknown> = {
    rotate: xAxisLabelRotate,
    fontSize: formatting.xAxisFontSize ?? 11,
    color: formatting.xAxisColor ?? th.xAxis.axisLabel.color,
  };
  if (formatting.xAxisFontFamily) xAxisLabel.fontFamily = formatting.xAxisFontFamily;
  if (formatting.xAxisFontWeight) xAxisLabel.fontWeight = formatting.xAxisFontWeight;

  const xAxisNameStyle: Record<string, unknown> | undefined = formatting.xAxisTitle
    ? { color: formatting.xAxisColor ?? th.xAxis.axisLabel.color, fontSize: formatting.xAxisFontSize ?? 11 }
    : undefined;

  const xAxis: Record<string, unknown> = {
    show: formatting.xAxisShow ?? true,
    type: 'category' as const,
    axisLine: { lineStyle: { color: formatting.xAxisLineColor ?? th.xAxis.axisLine.lineStyle.color } },
    axisLabel: xAxisLabel,
    splitLine: formatting.showGridLines !== false
      ? {
          show: true,
          lineStyle: {
            color: formatting.gridLineColor ?? th.xAxis.splitLine.lineStyle.color,
            width: formatting.gridLineWidth,
            type: gridLineDash,
          },
        }
      : { show: false },
  };
  if (formatting.xAxisTitle) {
    xAxis.name = formatting.xAxisTitle;
    xAxis.nameTextStyle = xAxisNameStyle;
  }
  if (formatting.xAxisMin !== undefined && formatting.xAxisMin !== 'auto') xAxis.min = formatting.xAxisMin;
  if (formatting.xAxisMax !== undefined && formatting.xAxisMax !== 'auto') xAxis.max = formatting.xAxisMax;

  const yAxisLabel: Record<string, unknown> = {
    color: formatting.yAxisColor ?? th.yAxis.axisLabel.color,
    fontSize: formatting.yAxisFontSize ?? 11,
  };
  if (formatting.yAxisFontFamily) yAxisLabel.fontFamily = formatting.yAxisFontFamily;
  if (formatting.yAxisFontWeight) yAxisLabel.fontWeight = formatting.yAxisFontWeight;

  const yAxisNameStyle: Record<string, unknown> | undefined = formatting.yAxisTitle
    ? { color: formatting.yAxisColor ?? th.yAxis.axisLabel.color, fontSize: formatting.yAxisFontSize ?? 11 }
    : undefined;

  const yAxis: Record<string, unknown> = {
    show: formatting.yAxisShow ?? true,
    type: 'value' as const,
    axisLine: { lineStyle: { color: formatting.yAxisLineColor ?? th.yAxis.axisLine.lineStyle.color } },
    axisLabel: yAxisLabel,
    splitLine: formatting.showGridLines !== false
      ? {
          show: true,
          lineStyle: {
            color: formatting.gridLineColor ?? th.yAxis.splitLine.lineStyle.color,
            width: formatting.gridLineWidth,
            type: gridLineDash,
          },
        }
      : { show: false },
  };
  if (formatting.yAxisTitle) {
    yAxis.name = formatting.yAxisTitle;
    yAxis.nameTextStyle = yAxisNameStyle;
  }
  if (formatting.yAxisMin !== undefined && formatting.yAxisMin !== 'auto') yAxis.min = formatting.yAxisMin;
  if (formatting.yAxisMax !== undefined && formatting.yAxisMax !== 'auto') yAxis.max = formatting.yAxisMax;

  const legendPos = formatting.legendPosition ?? 'bottom';
  const legendPositionMap: Record<string, { top?: number; bottom?: number; left?: number; right?: number }> = {
    top: { top: 0 },
    bottom: { bottom: 0 },
    left: { left: 0 },
    right: { right: 0 },
  };

  const legend = formatting.showLegend !== false
    ? {
        show: true,
        ...legendPositionMap[legendPos],
        textStyle: {
          color: formatting.legendColor ?? th.legend.textStyle.color,
          fontSize: formatting.legendFontSize,
          fontWeight: formatting.legendFontWeight,
          fontStyle: formatting.legendFontStyle,
          fontFamily: formatting.legendFontFamily,
        },
      }
    : { show: false };

  return {
    grid: { left: gridPaddingLeft, right: gridPaddingRight, top: gridPaddingTop, bottom: gridPaddingBottom },
    xAxis,
    yAxis,
    legend,
  };
}
