import { getPool } from './mysql-pool';
import type { QueryResult } from '@/types/sql-workbench';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface ExecuteResult {
  success: boolean;
  result?: QueryResult;
  error?: string;
  messages?: Array<{ type: 'success' | 'error'; text: string }>;
}

function splitStatements(sql: string): string[] {
  const stmts: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];

    if (ch === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += ch;
    } else if (ch === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += ch;
    } else if (ch === ';' && !inSingleQuote && !inDoubleQuote) {
      const trimmed = current.trim();
      if (trimmed) stmts.push(trimmed);
      current = '';
    } else {
      current += ch;
    }
  }

  const last = current.trim();
  if (last) stmts.push(last);

  return stmts;
}

async function executeSingle(
  pool: Awaited<ReturnType<typeof getPool>>,
  sql: string
): Promise<{ success: boolean; result?: QueryResult; error?: string }> {
  const trimmed = sql.trim();
  const upperTrimmed = trimmed.toUpperCase();

  try {
    if (upperTrimmed.startsWith('SELECT') || upperTrimmed.startsWith('SHOW') || upperTrimmed.startsWith('DESCRIBE') || upperTrimmed.startsWith('DESC') || upperTrimmed.startsWith('EXPLAIN')) {
      const [rows, fields] = await pool!.query<RowDataPacket[]>(sql);
      return {
        success: true,
        result: {
          columns: fields?.map((f) => f.name) || [],
          rows: rows as Record<string, unknown>[],
          executionTime: 0,
          type: 'select',
          message: `${rows.length} row(s)`,
        },
      };
    } else if (upperTrimmed.startsWith('INSERT')) {
      const [result] = await pool!.query(sql) as [ResultSetHeader, unknown];
      return {
        success: true,
        result: {
          columns: [],
          rows: [],
          affectedRows: result.affectedRows,
          executionTime: 0,
          type: 'insert',
          message: `${result.affectedRows} row(s) inserted`,
        },
      };
    } else if (upperTrimmed.startsWith('UPDATE')) {
      const [result] = await pool!.query(sql) as [ResultSetHeader, unknown];
      return {
        success: true,
        result: {
          columns: [],
          rows: [],
          affectedRows: result.affectedRows,
          executionTime: 0,
          type: 'update',
          message: `${result.affectedRows} row(s) updated`,
        },
      };
    } else if (upperTrimmed.startsWith('DELETE')) {
      const [result] = await pool!.query(sql) as [ResultSetHeader, unknown];
      return {
        success: true,
        result: {
          columns: [],
          rows: [],
          affectedRows: result.affectedRows,
          executionTime: 0,
          type: 'delete',
          message: `${result.affectedRows} row(s) deleted`,
        },
      };
    } else if (
      upperTrimmed.startsWith('CREATE') ||
      upperTrimmed.startsWith('ALTER') ||
      upperTrimmed.startsWith('DROP') ||
      upperTrimmed.startsWith('TRUNCATE') ||
      upperTrimmed.startsWith('RENAME')
    ) {
      await pool!.query(sql);
      return {
        success: true,
        result: {
          columns: [],
          rows: [],
          executionTime: 0,
          type: 'ddl',
          message: 'Statement executed successfully',
        },
      };
    } else if (upperTrimmed.startsWith('BEGIN') || upperTrimmed.startsWith('START TRANSACTION')) {
      await pool!.query(sql);
      return {
        success: true,
        result: {
          columns: [],
          rows: [],
          executionTime: 0,
          type: 'transaction',
          message: 'Transaction started',
        },
      };
    } else if (upperTrimmed === 'COMMIT') {
      await pool!.query(sql);
      return {
        success: true,
        result: {
          columns: [],
          rows: [],
          executionTime: 0,
          type: 'transaction',
          message: 'Transaction committed',
        },
      };
    } else if (upperTrimmed === 'ROLLBACK') {
      await pool!.query(sql);
      return {
        success: true,
        result: {
          columns: [],
          rows: [],
          executionTime: 0,
          type: 'transaction',
          message: 'Transaction rolled back',
        },
      };
    } else {
      await pool!.query(sql);
      return {
        success: true,
        result: {
          columns: [],
          rows: [],
          executionTime: 0,
          type: 'ddl',
          message: 'Statement executed successfully',
        },
      };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function executeQuery(
  connectionId: string,
  sql: string
): Promise<ExecuteResult> {
  const pool = await getPool(connectionId);
  if (!pool) {
    return { success: false, error: 'Connection not found or expired' };
  }

  const statements = splitStatements(sql);

  if (statements.length <= 1) {
    return executeSingle(pool, sql);
  }

  const messages: Array<{ type: 'success' | 'error'; text: string }> = [];
  let lastResult: QueryResult | undefined;
  let anySuccess = false;
  let lastError = '';

  for (const stmt of statements) {
    const r = await executeSingle(pool, stmt);
    if (r.success && r.result) {
      anySuccess = true;
      lastResult = r.result;
      messages.push({ type: 'success', text: r.result.message || 'OK' });
    } else {
      lastError = r.error || 'Unknown error';
      messages.push({ type: 'error', text: `[${stmt.substring(0, 60)}...] → ${lastError}` });
    }
  }

  if (anySuccess && lastResult) {
    return {
      success: true,
      result: lastResult,
      messages,
    };
  }

  return {
    success: false,
    error: lastError,
    messages,
  };
}
