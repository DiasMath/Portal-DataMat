import { getPool } from './mysql-pool';
import type { DatabaseSchema, TableInfo, ViewInfo, RoutineInfo, ForeignKeyInfo } from '@/types/sql-workbench';
import { RowDataPacket } from 'mysql2/promise';

export async function readSchema(connectionId: string, database?: string): Promise<DatabaseSchema | null> {
  const pool = await getPool(connectionId);
  if (!pool) return null;

  try {
    const [schemaRows] = await pool.query<RowDataPacket[]>(
      'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA ORDER BY SCHEMA_NAME'
    );
    const databases: string[] = schemaRows.map((r) => r.SCHEMA_NAME);

    // Se um banco específico foi passado (ex: usuário expandiu outro banco
    // na sidebar), usamos ele diretamente como filtro nas queries de
    // information_schema — sem depender de `USE banco` + `SELECT DATABASE()`.
    // Um `pool.query()` pode pegar qualquer conexão física do pool a cada
    // chamada; um `USE` rodado numa chamada não garante que a consulta
    // seguinte caia na mesma conexão, o que fazia o schema lido às vezes
    // refletir o banco padrão da conexão em vez do banco escolhido.
    let currentDb = database;
    if (!currentDb) {
      const [dbRows] = await pool.query<RowDataPacket[]>('SELECT DATABASE() as db');
      currentDb = dbRows[0]?.db || undefined;
    }

    if (!currentDb) {
      return { database: '', databases, tables: [], views: [], procedures: [], functions: [], foreignKeys: [] };
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

    const [fkRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        kcu.TABLE_NAME as from_table,
        kcu.COLUMN_NAME as from_column,
        kcu.REFERENCED_TABLE_NAME as to_table,
        kcu.REFERENCED_COLUMN_NAME as to_column,
        rc.CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE kcu
      JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
        ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
        AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
      WHERE kcu.TABLE_SCHEMA = ?
        AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
    `, [currentDb]);

    const foreignKeys: ForeignKeyInfo[] = fkRows.map((row) => ({
      fromTable: row.from_table,
      fromColumn: row.from_column,
      toTable: row.to_table,
      toColumn: row.to_column,
      constraintName: row.CONSTRAINT_NAME,
    }));

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

    return { database: currentDb, databases, tables, views, procedures, functions, foreignKeys };
  } catch (err) {
    console.error('readSchema error:', err);
    return null;
  }
}
