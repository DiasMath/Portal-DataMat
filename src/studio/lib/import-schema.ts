import type { DatabaseSchema, ColumnInfo } from '@/types/sql-workbench';
import type { DataModel, TableSchema, FieldSchema, Relationship } from '../types/dashboard';

function mysqlTypeToFieldType(columnType: string): 'string' | 'number' | 'date' | 'boolean' {
  const t = columnType.toLowerCase();
  if (t.includes('int') || t.includes('decimal') || t.includes('float') || t.includes('double') || t.includes('numeric')) {
    return 'number';
  }
  if (t.includes('date') || t.includes('timestamp') || t.includes('datetime')) {
    return 'date';
  }
  if (t.includes('boolean') || t.includes('tinyint(1)')) {
    return 'boolean';
  }
  return 'string';
}

function isAggregatable(columnType: string): boolean {
  const t = columnType.toLowerCase();
  return t.includes('int') || t.includes('decimal') || t.includes('float') || t.includes('double');
}

function inferTableType(tableName: string, columns: ColumnInfo[]): 'fact' | 'dimension' {
  const numericCount = columns.filter(c =>
    c.type.includes('int') || c.type.includes('decimal') || c.type.includes('float')
  ).length;
  return numericCount >= 3 ? 'fact' : 'dimension';
}

function formatLabel(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function calculateGridPosition(index: number, total: number): { x: number; y: number } {
  const cols = Math.ceil(Math.sqrt(total));
  const spacingX = 280;
  const spacingY = 250;
  const startX = 100;
  const startY = 50;
  return {
    x: startX + (index % cols) * spacingX,
    y: startY + Math.floor(index / cols) * spacingY,
  };
}

export function convertSchemaToDataModel(
  schema: DatabaseSchema,
  connectionId: string
): DataModel {
  const tables: TableSchema[] = schema.tables.map((t, index) => ({
    name: t.name,
    label: formatLabel(t.name),
    type: inferTableType(t.name, t.columns),
    position: calculateGridPosition(index, schema.tables.length),
    fields: t.columns.map(c => ({
      name: c.name,
      label: formatLabel(c.name),
      type: mysqlTypeToFieldType(c.type),
      isAggregatable: isAggregatable(c.type),
    })),
  }));

  const relationships: Relationship[] = schema.foreignKeys.map((fk, i) => ({
    id: `rel-${i}`,
    fromTable: fk.fromTable,
    fromField: fk.fromColumn,
    toTable: fk.toTable,
    toField: fk.toColumn,
    cardinality: 'N:1' as const,
    active: true,
  }));

  return {
    id: `model-${Date.now()}`,
    name: schema.database,
    connectionId,
    tables,
    relationships,
  };
}
