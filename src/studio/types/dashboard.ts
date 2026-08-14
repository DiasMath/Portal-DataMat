import type { VisualType, VisualBuckets, VisualFormatting, FilterCondition, QueryResultData } from './visuals';
import { CANVAS_DEFAULTS } from './canvas';

export interface FieldSchema {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  isAggregatable: boolean;
  label?: string;
  hidden?: boolean;
}

export interface TableSchema {
  name: string;
  label: string;
  type: 'fact' | 'dimension';
  fields: FieldSchema[];
  parquetPath?: string;
  position?: { x: number; y: number };
}

export interface Relationship {
  id: string;
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
  cardinality: '1:1' | '1:N' | 'N:1';
  active?: boolean;
  crossFilterDirection?: 'single' | 'both';
}

export interface Measure {
  id: string;
  name: string;
  expression: string;
  folderId?: string;
  format?: string;
  decimalPlaces?: number;
  description?: string;
  /** Temporary measures expire at end of session (page refresh) */
  isTemporary?: boolean;
}

export interface MeasureFolder {
  id: string;
  name: string;
  parentId?: string;
}

export interface DataModel {
  id: string;
  name: string;
  connectionId?: string;
  tables: TableSchema[];
  relationships: Relationship[];
  measures?: Measure[];
  measureFolders?: MeasureFolder[];
}

export interface ModelViewTab {
  id: string;
  name: string;
  tablePositions: { id: string; x: number; y: number }[];
  zoom: number;
  pan: { x: number; y: number };
  visibleTables?: string[];
  visibleRelationships?: string[];
}

/** Canvas element properties for visual positioning and appearance */
export interface VisualCanvasProperties {
  locked?: boolean;
  showShell?: boolean;
  backgroundColor?: string;
  backgroundTransparent?: boolean;
  backgroundImage?: string;
  backgroundOpacity?: number;
  showBorder?: boolean;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  headerMode?: 'hover' | 'always' | 'never';
  headerStyle?: 'default' | 'minimal' | 'bold';
  headerBackgroundColor?: string;
  headerTextColor?: string;
  headerHeight?: number;
  headerFontFamily?: string;
  headerFontSize?: number;
  headerFontWeight?: 'normal' | 'bold' | 'italic' | 'bold-italic';
  headerAlignment?: 'left' | 'center' | 'right';
  enableTooltip?: boolean;
  tooltipStyle?: 'default' | 'compact' | 'detailed';
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
  groupId?: string;
  buckets: VisualBuckets;
  formatting: VisualFormatting;
  filters: FilterCondition[];
  canvasProperties?: VisualCanvasProperties;
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
  backgroundImage?: string;
  backgroundImagePosition?: 'cover' | 'contain' | 'stretch' | 'center';
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

/** Canvas TextBox element - not a visual, but a standalone text element */
export interface CanvasTextBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  text: string;
  formatting: {
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textDecoration: 'none' | 'underline';
    textAlign: 'left' | 'center' | 'right';
    color: string;
  };
}

/** Calculated column - expression that adds a new column to an existing table */
export interface CalculatedColumn {
  id: string;
  name: string;
  tableName: string;
  expression: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
}

/** Calculated table - SQL query that generates a new table */
export interface CalculatedTable {
  id: string;
  name: string;
  expression: string;
  columns: { name: string; type: string }[];
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
    showTitle: false,
    buckets: {},
    formatting: {
      showLegend: true,
      showDataLabels: false,
      showGridLines: true,
      chartTheme: 'transparent',
    },
    filters: [],
    canvasProperties: {
      showShell: true,
      backgroundColor: '#ffffff',
      backgroundTransparent: false,
      showBorder: false,
      borderColor: '#e5e7eb',
      borderWidth: 1,
      borderRadius: 8,
      shadowEnabled: true,
      shadowColor: 'rgba(0,0,0,0.1)',
      shadowBlur: 10,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      headerMode: 'always',
      headerStyle: 'default',
      headerBackgroundColor: '#ffffff',
      headerTextColor: '#374151',
      headerHeight: 32,
      headerFontFamily: 'inherit',
      headerFontSize: 12,
      headerFontWeight: 'normal',
      headerAlignment: 'left',
    },
  };
}

export function createDefaultPage(name?: string, pageWidth?: number, pageHeight?: number): DashboardPage {
  return {
    id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: name || 'Página 1',
    order: 0,
    visuals: [],
    background: CANVAS_DEFAULTS.BACKGROUND,
    pageWidth: pageWidth || 1920,
    pageHeight: pageHeight || 1080,
  };
}
