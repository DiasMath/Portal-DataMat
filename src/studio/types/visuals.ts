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
  | 'combo';

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
  colorPalette?: string[];
  showLegend?: boolean;
  showDataLabels?: boolean;
  dataLabels?: boolean;
  dataLabelFormat?: 'value' | 'percent';
  showGridLines?: boolean;
  showAxisLabels?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  dataLabelFontSize?: number;
  dataLabelColor?: string;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  gaugeMin?: number;
  gaugeMax?: number;
  gaugeTarget?: number;
  gaugeColor?: string;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  strokeWidth?: number;
  showMarkers?: boolean;
  markerSize?: number;
  rotation?: number;
  innerRadius?: number;
  displayUnits?: 'auto' | 'none' | 'thousands' | 'millions' | 'billions';
  decimalPlaces?: number;
  showTrendIcon?: boolean;
  showTotals?: boolean;
  showSubtotals?: boolean;
  rowPadding?: number;
  headerAlign?: 'left' | 'center' | 'right';
}

export interface FilterCondition {
  tableName: string;
  columnName: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN' | 'LIKE' | 'IS NULL' | 'IS NOT NULL';
  value: unknown;
}

export interface QueryResultData {
  columns: string[];
  rows: Record<string, unknown>[];
  executionTime: number;
}

export const VISUAL_TYPE_LABELS: Record<VisualType, string> = {
  bar: 'Gráfico de Barras',
  line: 'Gráfico de Linha',
  area: 'Gráfico de Área',
  pie: 'Gráfico de Pizza',
  donut: 'Gráfico de Rosca',
  scatter: 'Gráfico de Dispersão',
  table: 'Tabela',
  kpi: 'Cartão KPI',
  card: 'Cartão de Valor',
  gauge: 'Medidor',
  treemap: 'Mapa de Árvore',
  waterfall: 'Cascata',
  combo: 'Gráfico Combinado',
};

export const VISUAL_TYPE_ICONS: Record<VisualType, string> = {
  bar: 'BarChart',
  line: 'TrendingUp',
  area: 'AreaChart',
  pie: 'PieChart',
  donut: 'PieChart',
  scatter: 'ScatterChart',
  table: 'Table',
  kpi: 'Hash',
  card: 'CreditCard',
  gauge: 'Gauge',
  treemap: 'LayoutGrid',
  waterfall: 'AlignVerticalSpaceAround',
  combo: 'BarChart2',
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
