/** Grid result data structure */
export interface GridData {
  columns: string[];
  columnTypes?: Record<string, 'number' | 'text' | 'date' | 'boolean' | 'null'>;
  rows: Record<string, unknown>[];
  executionTime: number;
}

/** Sort configuration */
export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

/** Column resize state */
export interface ColumnWidths {
  [column: string]: number;
}

/** Export format */
export type ExportFormat = 'csv' | 'json' | 'sql' | 'xlsx';

/** Grid color theme (Workbench-inspired dark) */
export const GRID_COLORS = {
  headerBg: '#1a1a1a',
  headerText: '#e5e5e5',
  headerBorder: '#333333',
  rowBg: '#1a1a1a',
  altRowBg: '#1e1e1e',
  rowOdd: '#1a1a1a',
  rowEven: '#1e1e1e',
  rowHover: '#2a2d2e',
  rowSelected: '#264f78',
  selectedRow: '#264f78',
  rowText: '#d4d4d4',
  rowNumber: '#6b7280',
  nullText: '#6b7280',
  gridLines: '#333333',
  sortArrow: '#FFB03F',
} as const;
