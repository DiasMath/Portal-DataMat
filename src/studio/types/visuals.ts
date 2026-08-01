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
  showGridLines?: boolean;
  showAxisLabels?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
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

export const BUCKET_LABELS: Record<string, string> = {
  xAxis: 'Eixo X (Categorias)',
  yAxis: 'Eixo Y (Valores)',
  legend: 'Legenda (Séries)',
  values: 'Valores',
  details: 'Detalhes (Colunas)',
  tooltips: 'Tooltips',
};

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
