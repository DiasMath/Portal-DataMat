'use client';

import type { VisualType } from '../types/visuals';

export type CrossFilterMode = 'highlight' | 'filter';

export const CROSS_FILTER_MODE: Record<VisualType, CrossFilterMode> = {
  bar: 'highlight',
  line: 'filter',
  area: 'filter',
  pie: 'highlight',
  donut: 'highlight',
  scatter: 'filter',
  table: 'highlight',
  kpi: 'highlight',
  card: 'highlight',
  gauge: 'highlight',
  treemap: 'highlight',
  waterfall: 'highlight',
  combo: 'highlight',
  radar: 'highlight',
  funnel: 'highlight',
  ribbon: 'highlight',
  matrix: 'highlight',
  bullet: 'highlight',
  sunburst: 'highlight',
  sankey: 'highlight',
  wordcloud: 'highlight',
  boxplot: 'filter',
  histogram: 'highlight',
  dotplot: 'highlight',
  lollipop: 'highlight',
};

export function getCrossFilterMode(visualType: VisualType): CrossFilterMode {
  return CROSS_FILTER_MODE[visualType] || 'highlight';
}

export function applyCrossFilterOpacity(
  value: unknown,
  crossFilterValues: Set<unknown> | undefined,
  opacitySelected = 1,
  opacityDimmed = 0.3
): number {
  if (!crossFilterValues || crossFilterValues.size === 0) return opacitySelected;
  return crossFilterValues.has(value) ? opacitySelected : opacityDimmed;
}

export function shouldShowItem(
  value: unknown,
  crossFilterValues: Set<unknown> | undefined,
  mode: CrossFilterMode
): boolean {
  if (!crossFilterValues || crossFilterValues.size === 0) return true;
  if (mode === 'highlight') return true;
  return crossFilterValues.has(value);
}
