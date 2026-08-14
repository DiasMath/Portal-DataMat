'use client';

import type { EChartsOption } from 'echarts';
import { CANVAS_DEFAULTS } from '../../types/canvas';

const COLOR_PALETTE_DARK = [
  '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];

const COLOR_PALETTE_LIGHT = [
  '#2563eb', '#059669', '#dc2626', '#7c3aed', '#db2777',
  '#0d9488', '#ea580c', '#0891b2', '#65a30d', '#d97706',
];

export const ECHARTS_DARK_THEME = {
  color: COLOR_PALETTE_DARK,
  backgroundColor: CANVAS_DEFAULTS.BACKGROUND,
  textStyle: { color: '#e5e7eb' },
  title: { textStyle: { color: '#f3f4f6' }, subtextStyle: { color: '#9ca3af' } },
  legend: { textStyle: { color: '#d1d5db' } },
  tooltip: {
    backgroundColor: 'rgba(23,23,23,0.95)',
    borderColor: '#404040',
    textStyle: { color: '#e5e7eb' },
  },
  xAxis: {
    axisLine: { lineStyle: { color: '#4b5563' } },
    axisTick: { lineStyle: { color: '#4b5563' } },
    axisLabel: { color: '#9ca3af' },
    splitLine: { lineStyle: { color: '#374151' } },
  },
  yAxis: {
    axisLine: { lineStyle: { color: '#4b5563' } },
    axisTick: { lineStyle: { color: '#4b5563' } },
    axisLabel: { color: '#9ca3af' },
    splitLine: { lineStyle: { color: '#374151' } },
  },
  radar: {
    axisName: { color: '#d1d5db' },
    splitLine: { lineStyle: { color: '#374151' } },
    splitArea: { areaStyle: { color: ['transparent'] } },
    axisLine: { lineStyle: { color: '#4b5563' } },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#4b5563' } },
    axisTick: { lineStyle: { color: '#4b5563' } },
    axisLabel: { color: '#9ca3af' },
    splitLine: { lineStyle: { color: '#374151' } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#4b5563' } },
    axisTick: { lineStyle: { color: '#4b5563' } },
    axisLabel: { color: '#9ca3af' },
    splitLine: { lineStyle: { color: '#374151' } },
  },
};

export const ECHARTS_LIGHT_THEME = {
  color: COLOR_PALETTE_LIGHT,
  backgroundColor: '#ffffff',
  textStyle: { color: '#1f2937' },
  title: { textStyle: { color: '#111827' }, subtextStyle: { color: '#6b7280' } },
  legend: { textStyle: { color: '#374151' } },
  tooltip: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: '#e5e7eb',
    textStyle: { color: '#1f2937' },
  },
  xAxis: {
    axisLine: { lineStyle: { color: '#d1d5db' } },
    axisTick: { lineStyle: { color: '#d1d5db' } },
    axisLabel: { color: '#6b7280' },
    splitLine: { lineStyle: { color: '#f3f4f6' } },
  },
  yAxis: {
    axisLine: { lineStyle: { color: '#d1d5db' } },
    axisTick: { lineStyle: { color: '#d1d5db' } },
    axisLabel: { color: '#6b7280' },
    splitLine: { lineStyle: { color: '#f3f4f6' } },
  },
  radar: {
    axisName: { color: '#374151' },
    splitLine: { lineStyle: { color: '#e5e7eb' } },
    splitArea: { areaStyle: { color: ['transparent'] } },
    axisLine: { lineStyle: { color: '#d1d5db' } },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#d1d5db' } },
    axisTick: { lineStyle: { color: '#d1d5db' } },
    axisLabel: { color: '#6b7280' },
    splitLine: { lineStyle: { color: '#f3f4f6' } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#d1d5db' } },
    axisTick: { lineStyle: { color: '#d1d5db' } },
    axisLabel: { color: '#6b7280' },
    splitLine: { lineStyle: { color: '#f3f4f6' } },
  },
};

export const ECHARTS_TRANSPARENT_THEME = {
  color: COLOR_PALETTE_DARK,
  backgroundColor: 'transparent',
  textStyle: { color: '#d1d5db' },
  title: { textStyle: { color: '#f3f4f6' }, subtextStyle: { color: '#9ca3af' } },
  legend: { textStyle: { color: '#d1d5db' } },
  tooltip: {
    backgroundColor: 'rgba(23,23,23,0.95)',
    borderColor: '#404040',
    textStyle: { color: '#e5e7eb' },
  },
  xAxis: {
    axisLine: { lineStyle: { color: '#6b7280' } },
    axisTick: { lineStyle: { color: '#6b7280' } },
    axisLabel: { color: '#9ca3af' },
    splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
  },
  yAxis: {
    axisLine: { lineStyle: { color: '#6b7280' } },
    axisTick: { lineStyle: { color: '#6b7280' } },
    axisLabel: { color: '#9ca3af' },
    splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
  },
  radar: {
    axisName: { color: '#d1d5db' },
    splitLine: { lineStyle: { color: '#4b5563', type: 'dashed' } },
    splitArea: { areaStyle: { color: ['transparent'] } },
    axisLine: { lineStyle: { color: '#6b7280' } },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#6b7280' } },
    axisTick: { lineStyle: { color: '#6b7280' } },
    axisLabel: { color: '#9ca3af' },
    splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#6b7280' } },
    axisTick: { lineStyle: { color: '#6b7280' } },
    axisLabel: { color: '#9ca3af' },
    splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
  },
};

export type ThemeMode = 'dark' | 'light' | 'transparent';

export function getEChartsTheme(themeMode: ThemeMode) {
  if (themeMode === 'light') return ECHARTS_LIGHT_THEME;
  if (themeMode === 'transparent') return ECHARTS_TRANSPARENT_THEME;
  return ECHARTS_DARK_THEME;
}

export function getEChartsPalette(themeMode: ThemeMode) {
  if (themeMode === 'light') return COLOR_PALETTE_LIGHT;
  if (themeMode === 'transparent') return COLOR_PALETTE_DARK;
  return COLOR_PALETTE_DARK;
}

export function applyCrossHighlight(
  data: Record<string, unknown>[],
  fieldName: string,
  crossFilterValues: Set<unknown> | undefined,
  opacitySelected = 1,
  opacityDimmed = 0.3
): { values: number[]; selectedMode: boolean } {
  if (!crossFilterValues || crossFilterValues.size === 0) {
    return { values: data.map(() => opacitySelected), selectedMode: false };
  }
  return {
    values: data.map(row => crossFilterValues.has(row[fieldName]) ? opacitySelected : opacityDimmed),
    selectedMode: true,
  };
}
