export type VisualType =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'table'
  | 'kpi'
  | 'card'
  | 'gauge'
  | 'treemap'
  | 'waterfall'
  | 'combo'
  | 'radar'
  | 'funnel'
  | 'ribbon'
  | 'matrix'
  | 'bullet'
  | 'sunburst'
  | 'sankey'
  | 'wordcloud'
  | 'boxplot'
  | 'histogram'
  | 'dotplot'
  | 'lollipop';

export interface VisualBuckets {
  xAxis?: BucketField[];
  yAxis?: BucketField[];
  legend?: BucketField[];
  values?: BucketField[];
  details?: BucketField[];
  tooltips?: BucketField[];
}

export interface BucketField {
  tableName: string;
  fieldName: string;
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'COUNT_DISTINCT' | 'NONE';
  alias?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface VisualFormatting {
  // --- Comuns (todos os visuais) ---
  chartTheme?: 'transparent' | 'dark' | 'light';

  // --- Dados (Rótulos) ---
  dataLabels?: boolean;
  dataLabelFormat?: 'value' | 'percent';
  dataLabelFontSize?: number;
  dataLabelColor?: string;
  dataLabelBgColor?: string;
  dataLabelFontWeight?: 'normal' | 'bold';
  dataLabelFontStyle?: 'normal' | 'italic';
  dataLabelPosition?: 'top' | 'outside' | 'inside';
  dataLabelShowFor?: 'all' | 'first' | 'last';

  // --- Legenda ---
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  legendColor?: string;
  legendFontSize?: number;
  legendFontFamily?: string;
  legendFontWeight?: 'normal' | 'bold';
  legendFontStyle?: 'normal' | 'italic';

  // --- Eixo X ---
  xAxisShow?: boolean;
  xAxisTitle?: string;
  xAxisColor?: string;
  xAxisFontSize?: number;
  xAxisFontFamily?: string;
  xAxisFontWeight?: 'normal' | 'bold';
  xAxisLabelRotate?: 'auto' | '0' | '45' | '90';
  xAxisMin?: number | 'auto';
  xAxisMax?: number | 'auto';
  xAxisLineColor?: string;

  // --- Eixo Y ---
  yAxisShow?: boolean;
  yAxisTitle?: string;
  yAxisColor?: string;
  yAxisFontSize?: number;
  yAxisFontFamily?: string;
  yAxisFontWeight?: 'normal' | 'bold';
  yAxisMin?: number | 'auto';
  yAxisMax?: number | 'auto';
  yAxisLineColor?: string;

  // --- Grade ---
  showGridLines?: boolean;
  gridLineColor?: string;
  gridLineWidth?: number;
  gridLineDash?: boolean;

  // --- Grid Padding ---
  gridPaddingTop?: number;
  gridPaddingBottom?: number;
  gridPaddingLeft?: number;
  gridPaddingRight?: number;

  // --- Barras ---
  barColor?: string;
  barWidth?: number | string;
  barGap?: string;
  barCategoryGap?: string;
  barBorderRadius?: number;
  showBackground?: boolean;

  // --- Linha / Área ---
  lineColor?: string;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  smooth?: boolean;
  step?: boolean;
  areaOpacity?: number;
  areaColor?: string;
  showMarkers?: boolean;
  markerSize?: number;
  markerShape?: 'circle' | 'rect' | 'triangle' | 'diamond';

  // --- Pizza / Rosca ---
  pieColor?: string;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  minAngle?: number;
  roseType?: 'none' | 'radius' | 'area';
  labelPosition?: 'inside' | 'outside';
  emphasisShadowBlur?: number;
  emphasisShadowColor?: string;

  // --- Radar ---
  radarShape?: 'polygon' | 'circle';
  radarRadius?: number;
  radarStartAngle?: number;
  radarSplitNumber?: number;
  radarAxisName?: boolean;
  radarAxisNameColor?: string;
  radarAxisNameFontSize?: number;
  radarSplitLineColor?: string;
  radarSplitLineWidth?: number;
  radarSplitLineDash?: 'solid' | 'dashed' | 'dotted';
  radarSplitAreaColor?: string;
  radarAxisLineColor?: string;
  radarAreaOpacity?: number;
  radarLineColor?: string;
  radarLineWidth?: number;

  // --- Funil ---
  funnelAlign?: 'left' | 'center' | 'right';
  funnelSort?: 'descending' | 'ascending' | 'none';
  funnelGap?: number;
  funnelMinSize?: string;
  funnelMaxSize?: string;

  // --- Sankey ---
  sankeyNodeAlign?: 'left' | 'right' | 'justify';
  sankeyNodeWidth?: number;
  sankeyNodeGap?: number;
  sankeyLineCurveness?: number;
  sankeyLineOpacity?: number;
  sankeyOrient?: 'horizontal' | 'vertical';
  sankeyDraggable?: boolean;
  sankeyFocusAdjacency?: boolean;
  sankeyLineStyle?: 'gradient' | 'opacity';
  emphasisLineOpacity?: number;

  // --- Treemap ---
  treemapBreadth?: number;
  treemapDepth?: number;
  treemapDrillDownIcon?: string;
  treemapDrillDown?: boolean;
  treemapLeafDepth?: number;
  treemapRoam?: 'zoom' | 'move' | boolean;
  treemapNodeClick?: 'zoomToNode' | 'link' | false;
  treemapZoomToNodeRatio?: number;
  treemapUpperLabelShow?: boolean;
  treemapUpperLabelHeight?: number;
  treemapItemBorderColor?: string;
  treemapItemBorderWidth?: number;
  treemapItemGapWidth?: number;
  treemapBreadcrumbShow?: boolean;
  treemapBorderColor?: string;
  treemapBorderWidth?: number;
  treemapGapWidth?: number;

  // --- Waterfall ---
  waterfallPositiveColor?: string;
  waterfallNegativeColor?: string;
  waterfallTotalColor?: string;
  waterfallLineColor?: string;
  waterfallLineWidth?: number;
  showTotals?: boolean;
  showSubtotals?: boolean;

  // --- Gauge ---
  gaugeMin?: number;
  gaugeMax?: number;
  gaugeTarget?: number;
  gaugeColor?: string;
  gaugeStartAngle?: number;
  gaugeEndAngle?: number;
  gaugeSplitNumber?: number;
  gaugeProgressWidth?: number;
  gaugeAxisLineWidth?: number;
  gaugeAxisLineColors?: [number, string][];
  gaugePointerLength?: string | number;
  gaugePointerWidth?: number;
  gaugePointerOffsetCenter?: [number | string, number | string];
  gaugeAnchorShow?: boolean;
  gaugeAnchorSize?: number;
  gaugeShowAxisTick?: boolean;
  gaugeSplitLineLength?: number;
  gaugeTitleOffsetCenter?: [number | string, number | string];
  gaugeTitleFontSize?: number;
  gaugeTitleColor?: string;
  gaugeDetailFontSize?: number;
  gaugeDetailOffsetCenter?: [number | string, number | string];
  gaugeDetailFormatter?: string;

  // --- KPI / Card ---
  kpiFontSize?: number;
  kpiColor?: string;
  kpiFontWeight?: string;
  kpiFontFamily?: string;
  kpiFontStyle?: string;
  kpiPadding?: number;
  kpiBorderRadius?: number;
  kpiSubtitleFontSize?: number;
  kpiSubtitleColor?: string;
  kpiSubtitleFontWeight?: string;
  kpiSubtitleFontFamily?: string;
  kpiSubtitleFontStyle?: string;
  kpiSubtitleMarginBottom?: number;
  kpiIconSize?: number;
  kpiIconColor?: string;
  kpiTrendUpColor?: string;
  kpiTrendDownColor?: string;
  kpiSparklineWidth?: number;
  kpiDecimals?: number;
  kpiDisplayUnits?: 'auto' | 'none' | 'thousands' | 'millions';
  showTrendIcon?: boolean;

  // --- Bullet ---
  bulletColor?: string;
  bulletBarWidth?: string;
  bulletMarkerColor?: string;
  bulletMarkerWidth?: number;
  bulletTargetColor?: string;
  bulletTargetWidth?: number;

  // --- Sunburst ---
  sunburstInnerRadius?: string;
  sunburstOuterRadius?: string;
  sunburstBorderColor?: string;
  sunburstBorderWidth?: number;
  sunburstLabelRotate?: 'radial' | 'tangential';
  sunburstRadius?: string;
  sunburstStartAngle?: number;
  sunburstSort?: 'desc' | 'asc';
  sunburstItemBorderWidth?: number;
  sunburstItemBorderColor?: string;

  // --- WordCloud ---
  wordCloudMinSize?: number;
  wordCloudMaxSize?: number;
  wordCloudSizeRange?: [number, number];
  wordCloudRotationRange?: [number, number];
  wordCloudRotationStep?: number;
  wordCloudShape?: string;
  wordCloudDrawOutOfBound?: boolean;
  wordCloudLayoutAnimation?: boolean;
  wordCloudTextShadowBlur?: number;
  wordCloudTextShadowColor?: string;

  // --- Histogram ---
  histogramBins?: number;
  histogramBarRadius?: number;
  histogramYAxisLabel?: string;

  // --- Tabela / Matriz ---
  showTotalsTable?: boolean;
  showSubtotalsTable?: boolean;
  rowPadding?: number;
  headerAlign?: 'left' | 'center' | 'right';
  matrixIndent?: boolean;
  matrixShowHeaders?: boolean;

  // --- Legado (compatibilidade) - @deprecated use colorPalette em vez de chartTheme ---
  /** @deprecated use chartTheme colorPalette */
  colorPalette?: string[];
  /** @deprecated use dataLabels */
  showDataLabels?: boolean;
  /** @deprecated */
  showAxisLabels?: boolean;
  /** @deprecated use xAxisTitle */
  xAxisLabel?: string;
  /** @deprecated use yAxisTitle */
  yAxisLabel?: string;
  /** @deprecated use canvasProperties.backgroundColor */
  backgroundColor?: string;
  /** @deprecated */
  borderColor?: string;
  /** @deprecated use barBorderRadius */
  borderRadius?: number;
  /** @deprecated use kpiDisplayUnits */
  displayUnits?: 'auto' | 'none' | 'thousands' | 'millions' | 'billions';
  /** @deprecated use kpiDecimals */
  decimalPlaces?: number;
  /** @deprecated use lineWidth */
  strokeWidth?: number;
  /** @deprecated */
  rotation?: number;
}

export interface FilterCondition {
  tableName: string;
  columnName: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN' | 'LIKE' | 'IS NULL' | 'IS NOT NULL' | 'BETWEEN';
  value: unknown;
  value2?: unknown;
}

export interface QueryResultData {
  columns: string[];
  rows: Record<string, unknown>[];
  executionTime: number;
}

export const VISUAL_TYPE_LABELS: Record<VisualType, string> = {
  bar: 'Barras',
  line: 'Linha',
  area: 'Area',
  pie: 'Pizza',
  donut: 'Rosca',
  scatter: 'Dispersao',
  table: 'Tabela',
  kpi: 'KPI',
  card: 'Cartao',
  gauge: 'Medidor',
  treemap: 'Arvore',
  waterfall: 'Cascata',
  combo: 'Combinado',
  radar: 'Radar',
  funnel: 'Funil',
  ribbon: 'Fita',
  matrix: 'Matriz',
  bullet: 'Bullet',
  sunburst: 'Sunburst',
  sankey: 'Sankey',
  wordcloud: 'Nuvem',
  boxplot: 'BoxPlot',
  histogram: 'Histograma',
  dotplot: 'DotPlot',
  lollipop: 'Lollipop',
};

export const VISUAL_TYPE_ICONS: Record<VisualType, string> = {
  bar: 'BarChart',
  line: 'TrendingUp',
  area: 'AreaChart',
  pie: 'PieChart',
  donut: 'Circle',
  scatter: 'ScatterChart',
  table: 'Table',
  kpi: 'Hash',
  card: 'CreditCard',
  gauge: 'Gauge',
  treemap: 'TreePine',
  waterfall: 'TrendingDown',
  combo: 'Combine',
  radar: 'Radar',
  funnel: 'Filter',
  ribbon: 'Stream',
  matrix: 'Grid3x3',
  bullet: 'Target',
  sunburst: 'Sun',
  sankey: 'GitBranch',
  wordcloud: 'Cloud',
  boxplot: 'Box',
  histogram: 'BarChart2',
  dotplot: 'Disc',
  lollipop: 'CircleDot',
};

export const BUCKET_LABELS: Record<string, string> = {
  xAxis: 'Eixo X (Categorias)',
  yAxis: 'Eixo Y (Valores)',
  legend: 'Legenda (Séries)',
  values: 'Valores',
  details: 'Detalhes (Colunas)',
  tooltips: 'Tooltips',
};

export type BucketFieldType = 'categorical' | 'numeric' | 'any';

export const BUCKET_FIELD_RULES: Record<VisualType, Record<string, BucketFieldType>> = {
  bar: { xAxis: 'categorical', values: 'numeric', legend: 'categorical', tooltips: 'any' },
  line: { xAxis: 'categorical', values: 'numeric', legend: 'categorical', tooltips: 'any' },
  area: { xAxis: 'categorical', values: 'numeric', legend: 'categorical', tooltips: 'any' },
  pie: { xAxis: 'categorical', values: 'numeric', tooltips: 'any' },
  donut: { xAxis: 'categorical', values: 'numeric', tooltips: 'any' },
  scatter: { xAxis: 'numeric', yAxis: 'numeric', legend: 'categorical', tooltips: 'any' },
  table: { details: 'any' },
  kpi: { values: 'numeric' },
  card: { values: 'numeric' },
  gauge: { values: 'numeric' },
  treemap: { xAxis: 'categorical', values: 'numeric', legend: 'categorical' },
  waterfall: { xAxis: 'categorical', values: 'numeric' },
  combo: { xAxis: 'categorical', values: 'numeric', yAxis: 'numeric', legend: 'categorical', tooltips: 'any' },
  radar: { xAxis: 'categorical', values: 'numeric', legend: 'categorical', tooltips: 'any' },
  funnel: { xAxis: 'categorical', values: 'numeric', tooltips: 'any' },
  ribbon: { xAxis: 'categorical', values: 'numeric', legend: 'categorical', tooltips: 'any' },
  matrix: { details: 'any', values: 'numeric' },
  bullet: { xAxis: 'categorical', values: 'numeric', legend: 'categorical' },
  sunburst: { xAxis: 'categorical', values: 'numeric', legend: 'categorical' },
  sankey: { xAxis: 'categorical', values: 'numeric', legend: 'categorical' },
  wordcloud: { xAxis: 'categorical', values: 'numeric' },
  boxplot: { xAxis: 'categorical', values: 'numeric', legend: 'categorical' },
  histogram: { xAxis: 'categorical', values: 'numeric' },
  dotplot: { xAxis: 'categorical', values: 'numeric', legend: 'categorical' },
  lollipop: { xAxis: 'categorical', values: 'numeric', legend: 'categorical' },
};

export function validateBucketField(
  visualType: VisualType,
  bucketKey: string,
  fieldType: 'string' | 'number' | 'date' | 'boolean'
): boolean {
  const rules = BUCKET_FIELD_RULES[visualType];
  if (!rules) return true;
  const rule = rules[bucketKey];
  if (!rule || rule === 'any') return true;
  if (rule === 'categorical') return fieldType === 'string' || fieldType === 'date' || fieldType === 'boolean';
  if (rule === 'numeric') return fieldType === 'number';
  return true;
}

export const BUCKET_FIELDS_FOR_VISUAL: Record<VisualType, string[]> = {
  bar: ['xAxis', 'values', 'legend', 'tooltips'],
  line: ['xAxis', 'values', 'legend', 'tooltips'],
  area: ['xAxis', 'values', 'legend', 'tooltips'],
  pie: ['xAxis', 'values', 'tooltips'],
  donut: ['xAxis', 'values', 'tooltips'],
  scatter: ['xAxis', 'yAxis', 'legend', 'tooltips'],
  table: ['details'],
  kpi: ['values'],
  card: ['values'],
  gauge: ['values'],
  treemap: ['xAxis', 'values', 'legend'],
  waterfall: ['xAxis', 'values'],
  combo: ['xAxis', 'values', 'yAxis', 'legend', 'tooltips'],
  radar: ['xAxis', 'values', 'legend', 'tooltips'],
  funnel: ['xAxis', 'values', 'tooltips'],
  ribbon: ['xAxis', 'values', 'legend', 'tooltips'],
  matrix: ['details', 'values'],
  bullet: ['xAxis', 'values', 'legend'],
  sunburst: ['xAxis', 'values', 'legend'],
  sankey: ['xAxis', 'values', 'legend'],
  wordcloud: ['xAxis', 'values'],
  boxplot: ['xAxis', 'values', 'legend'],
  histogram: ['xAxis', 'values'],
  dotplot: ['xAxis', 'values', 'legend'],
  lollipop: ['xAxis', 'values', 'legend'],
};

export const AGGREGATION_OPTIONS: { value: BucketField['aggregation']; label: string }[] = [
  { value: 'SUM', label: 'Soma' },
  { value: 'AVG', label: 'Média' },
  { value: 'COUNT', label: 'Contagem' },
  { value: 'MIN', label: 'Mínimo' },
  { value: 'MAX', label: 'Máximo' },
  { value: 'COUNT_DISTINCT', label: 'Contagem Distinta' },
  { value: 'NONE', label: 'Nenhuma' },
];
