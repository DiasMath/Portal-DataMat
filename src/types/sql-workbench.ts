// `Connection` é um alias de `SavedConnection` (fonte única em
// `@/lib/connections/types`), compartilhado com o Studio. Mantido aqui
// para não quebrar os imports existentes de `@/types/sql-workbench`.
import type { SavedConnection } from '@/lib/connections/types';
export type Connection = SavedConnection;

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
  /** true quando um LIMIT de segurança foi adicionado automaticamente (ver executor.ts). */
  autoLimited?: boolean;
  /**
   * O SQL que realmente gerou este resultado — não necessariamente igual
   * ao texto atual do editor, que pode ter sido editado depois de rodar
   * (aba fica "dirty" sem reexecutar). Usado pelo drill-down e pelo
   * "filtrar por valor" pra não adivinhar a tabela errada nesse caso.
   */
  sourceSql?: string;
}

export interface QueryTab {
  id: string;
  title: string;
  sql: string;
  connectionId: string;
  isDirty: boolean;
  results?: QueryResult;
  messages: QueryMessage[];
  /**
   * 'table-editor'/'view-editor'/'procedure-editor'/'function-editor'
   * fazem essa aba renderizar o construtor visual correspondente (mesmo
   * lugar e tamanho da aba de query, como no MySQL Workbench) em vez do
   * editor SQL. Ausente/'query' = aba normal.
   */
  kind?: 'query' | 'table-editor' | 'view-editor' | 'procedure-editor' | 'function-editor';
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
  /** true enquanto uma query está rodando — usado pra trocar "Executar" por "Cancelar" no toolbar. */
  isExecuting: boolean;
  activeExecutionId: string | null;
}