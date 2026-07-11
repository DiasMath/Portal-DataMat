import { getPool } from './mysql-pool';
import type { DatabaseSchema, TableInfo, ViewInfo, RoutineInfo } from '@/types/sql-workbench';
import { RowDataPacket } from 'mysql2/promise';

export async function readSchema(connectionId: string): Promise<DatabaseSchema | null> {
  const pool = await getPool(connectionId);
  if (!pool) return null;

  try {
    const [dbRows] = await pool.query<RowDataPacket[]>('SELECT DATABASE() as db');
    const currentDb = dbRows[0]?.db || null;

    const [schemaRows] = await pool.query<RowDataPacket[]>(
      'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA ORDER BY SCHEMA_NAME'
    );
    const databases: string[] = schemaRows.map((r) => r.SCHEMA_NAME);

    if (!currentDb) {
      return { database: '', databases, tables: [], views: [], procedures: [], functions: [] };
    }

    const [tableRows] = await pool.query<RowDataPacket[]>(`
      SELECT TABLE_NAME, TABLE_TYPE, TABLE_COMMENT
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [currentDb]);

    const [columnRows] = await pool.query<RowDataPacket[]>(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_TYPE,
             IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA, COLUMN_COMMENT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `, [currentDb]);

    const [indexRows] = await pool.query<RowDataPacket[]>(`
      SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, NON_UNIQUE, INDEX_TYPE
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `, [currentDb]);

    const columnMap = new Map<string, any[]>();
    for (const row of columnRows) {
      if (!columnMap.has(row.TABLE_NAME)) columnMap.set(row.TABLE_NAME, []);
      columnMap.get(row.TABLE_NAME)!.push({
        name: row.COLUMN_NAME,
        type: row.COLUMN_TYPE || row.DATA_TYPE,
        nullable: row.IS_NULLABLE === 'YES',
        key: row.COLUMN_KEY,
        default: row.COLUMN_DEFAULT,
        extra: row.EXTRA,
      });
    }

    const indexMap = new Map<string, any[]>();
    for (const row of indexRows) {
      if (!indexMap.has(row.TABLE_NAME)) indexMap.set(row.TABLE_NAME, []);
      const existing = indexMap.get(row.TABLE_NAME)!.find((i) => i.name === row.INDEX_NAME);
      if (existing) {
        existing.columns.push(row.COLUMN_NAME);
      } else {
        indexMap.get(row.TABLE_NAME)!.push({
          name: row.INDEX_NAME,
          columns: [row.COLUMN_NAME],
          unique: row.NON_UNIQUE === 0,
          type: row.INDEX_TYPE,
        });
      }
    }

    const tables: TableInfo[] = tableRows
      .filter((t) => t.TABLE_TYPE === 'BASE TABLE')
      .map((t) => ({
        name: t.TABLE_NAME,
        columns: columnMap.get(t.TABLE_NAME) || [],
        indexes: indexMap.get(t.TABLE_NAME) || [],
      }));

    const views: ViewInfo[] = tableRows
      .filter((t) => t.TABLE_TYPE === 'VIEW')
      .map((v) => ({ name: v.TABLE_NAME }));

    const [procRows] = await pool.query<RowDataPacket[]>(`
      SELECT ROUTINE_NAME, ROUTINE_DEFINITION
      FROM information_schema.ROUTINES
      WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
      ORDER BY ROUTINE_NAME
    `, [currentDb]);

    const [funcRows] = await pool.query<RowDataPacket[]>(`
      SELECT ROUTINE_NAME, ROUTINE_DEFINITION
      FROM information_schema.ROUTINES
      WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'FUNCTION'
      ORDER BY ROUTINE_NAME
    `, [currentDb]);

    const procedures: RoutineInfo[] = procRows.map((p) => ({
      name: p.ROUTINE_NAME,
      type: 'PROCEDURE' as const,
      definition: p.ROUTINE_DEFINITION,
    }));

    const functions: RoutineInfo[] = funcRows.map((f) => ({
      name: f.ROUTINE_NAME,
      type: 'FUNCTION' as const,
      definition: f.ROUTINE_DEFINITION,
    }));

    return { database: currentDb, databases, tables, views, procedures, functions };
  } catch (err) {
    console.error('readSchema error:', err);
    return null;
  }
}
