export interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
  color?: string;
  status: 'connected' | 'disconnected' | 'error';
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  key: string;
  default?: string;
  extra: string;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
}

export interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
  type: string;
}

export interface ViewInfo {
  name: string;
  definition?: string;
}

export interface RoutineInfo {
  name: string;
  type: 'PROCEDURE' | 'FUNCTION';
  definition?: string;
  parameters?: string;
}

export interface ForeignKeyInfo {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  constraintName: string;
}

export interface DatabaseSchema {
  database: string;
  databases: string[];
  tables: TableInfo[];
  views: ViewInfo[];
  procedures: RoutineInfo[];
  functions: RoutineInfo[];
  foreignKeys: ForeignKeyInfo[];
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  affectedRows?: number;
  executionTime: number;
  type: 'select' | 'insert' | 'update' | 'delete' | 'ddl' | 'transaction';
  message?: string;
}

export interface QueryTab {
  id: string;
  title: string;
  sql: string;
  connectionId: string;
  isDirty: boolean;
  results?: QueryResult;
  messages: QueryMessage[];
}

export interface QueryMessage {
  type: 'success' | 'error' | 'info';
  text: string;
  executionTime?: number;
}

export interface QueryHistoryEntry {
  id: string;
  sql: string;
  connectionId: string;
  timestamp: Date;
  success: boolean;
  executionTime?: number;
  rowCount?: number;
  error?: string;
}

export interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  connectionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Snippet {
  id: string;
  title: string;
  sql: string;
  category?: string;
}

export type SplitDirection = 'vertical' | 'horizontal';

export type SplitMode = 'none' | 'horizontal' | 'vertical';

export interface SqlWorkbenchState {
  connections: Connection[];
  activeConnectionId: string | null;
  activeDatabase: string | null;
  tabs: QueryTab[];
  activeTabId: string | null;
  secondaryTabId: string | null;
  schemas: Record<string, DatabaseSchema>;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  resultsHeight: number;
  resultsCollapsed: boolean;
  splitMode: SplitMode;
  splitSize: number;
  queryHistory: QueryHistoryEntry[];
  highlightEnabled: boolean;
}