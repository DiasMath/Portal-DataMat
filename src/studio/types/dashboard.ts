import type { VisualType, VisualBuckets, VisualFormatting, FilterCondition, QueryResultData } from './visuals';

export interface FieldSchema {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  isAggregatable: boolean;
  label?: string;
}

export interface TableSchema {
  name: string;
  label: string;
  type: 'fact' | 'dimension';
  fields: FieldSchema[];
  parquetPath?: string;
}

export interface Relationship {
  id: string;
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
  cardinality: '1:1' | '1:N' | 'N:1';
}

export interface DataModel {
  id: string;
  name: string;
  tables: TableSchema[];
  relationships: Relationship[];
}

export interface Visual {
  id: string;
  name: string;
  type: VisualType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  title: string;
  showTitle: boolean;
  locked?: boolean;
  hidden?: boolean;
  buckets: VisualBuckets;
  formatting: VisualFormatting;
  filters: FilterCondition[];
  mockPreviewData?: {
    columns: string[];
    rows: Record<string, unknown>[];
  };
}

export interface DashboardPage {
  id: string;
  name: string;
  order: number;
  visuals: Visual[];
  background?: string;
  pageWidth?: number;
  pageHeight?: number;
  pagePreset?: string;
}

export interface Dashboard {
  id: string;
  title: string;
  description?: string;
  companyId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  dataModel: DataModel;
  pages: DashboardPage[];
  globalFilters: FilterCondition[];
}

export interface VisualQueryState {
  result: QueryResultData | null;
  loading: boolean;
  error: string | null;
}

let visualCounter = 0;

export function createDefaultVisual(type: VisualType, x: number, y: number): Visual {
  visualCounter++;
  return {
    id: `visual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: `Gráfico ${visualCounter}`,
    type,
    x,
    y,
    width: 400,
    height: 300,
    zIndex: 1,
    title: 'Novo Visual',
    showTitle: true,
    buckets: {},
    formatting: {
      showLegend: true,
      showDataLabels: false,
      showGridLines: true,
      showAxisLabels: true,
    },
    filters: [],
  };
}

export function createDefaultPage(name?: string, pageWidth?: number, pageHeight?: number): DashboardPage {
  return {
    id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: name || 'Página 1',
    order: 0,
    visuals: [],
    pageWidth: pageWidth || 1920,
    pageHeight: pageHeight || 1080,
  };
}
