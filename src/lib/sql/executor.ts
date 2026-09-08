import { getPool, registerActiveExecution, unregisterActiveExecution } from './mysql-pool';
import type { QueryResult } from '@/types/sql-workbench';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

interface ExecuteResult {
  success: boolean;
  result?: QueryResult;
  error?: string;
  messages?: Array<{ type: 'success' | 'error'; text: string }>;
}

/**
 * Divide um script em statements individuais, respeitando aspas. Se o
 * script contiver um bloco `BEGIN...END` (fora de aspas) — o caso de
 * `CREATE PROCEDURE`/`FUNCTION`/`TRIGGER` — ele é tratado como um único
 * statement e NÃO é dividido por `;`, mesmo que exista mais de um comando
 * dentro do corpo. Dividir ingenuamente por `;` quebraria o corpo em
 * pedaços inválidos (o mesmo problema que o `DELIMITER //` resolve na
 * CLI do MySQL — aqui resolvemos não dividindo em vez de trocar o
 * delimitador, já que rodamos via driver/protocolo, não via CLI).
 *
 * Isso é deliberadamente conservador: construir um parser completo de
 * `IF/WHILE/LOOP/CASE...END` do MySQL pra permitir múltiplos statements
 * ao lado de uma rotina no mesmo script não vale a complexidade — o
 * padrão normal é uma rotina por execução.
 */
function splitStatements(sql: string): string[] {
  if (containsBeginBlock(sql)) {
    const trimmed = sql.trim().replace(/;\s*$/, '');
    return trimmed ? [trimmed] : [];
  }

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

function containsBeginBlock(sql: string): boolean {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let word = '';

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'" && !inDoubleQuote) { inSingleQuote = !inSingleQuote; word = ''; continue; }
    if (ch === '"' && !inSingleQuote) { inDoubleQuote = !inDoubleQuote; word = ''; continue; }
    if (inSingleQuote || inDoubleQuote) continue;

    if (/[a-zA-Z]/.test(ch)) {
      word += ch;
    } else {
      if (word.toUpperCase() === 'BEGIN') return true;
      word = '';
    }
  }
  return word.toUpperCase() === 'BEGIN';
}

const SAFETY_ROW_LIMIT = 1000;

/**
 * Se for um SELECT puro sem LIMIT explícito, adiciona um teto de segurança
 * antes de executar. Sem isso, um `SELECT * FROM tabela_grande` carrega a
 * tabela inteira pra memória do processo Node e depois pro navegador.
 * Detecção de LIMIT existente é uma checagem simples (não faz parsing real
 * de SQL) — propositalmente conservadora: se já houver qualquer `LIMIT` na
 * string (mesmo dentro de uma subquery), não mexe, pra nunca quebrar uma
 * query que o usuário já limitou de propósito.
 */
function applySafetyLimit(sql: string, upperTrimmed: string): { sql: string; limited: boolean } {
  const isPlainSelect = upperTrimmed.startsWith('SELECT');
  if (!isPlainSelect) return { sql, limited: false };
  if (/\bLIMIT\s+\d+/i.test(sql)) return { sql, limited: false };

  const withoutTrailingSemicolon = sql.trim().replace(/;\s*$/, '');
  return { sql: `${withoutTrailingSemicolon} LIMIT ${SAFETY_ROW_LIMIT}`, limited: true };
}

async function executeSingle(
  conn: PoolConnection,
  sql: string
): Promise<{ success: boolean; result?: QueryResult; error?: string }> {
  const trimmed = sql.trim();
  const upperTrimmed = trimmed.toUpperCase();

  try {
    if (upperTrimmed.startsWith('SELECT') || upperTrimmed.startsWith('SHOW') || upperTrimmed.startsWith('DESCRIBE') || upperTrimmed.startsWith('DESC') || upperTrimmed.startsWith('EXPLAIN')) {
      const { sql: sqlToRun, limited } = applySafetyLimit(trimmed, upperTrimmed);
      const [rows, fields] = await conn.query<RowDataPacket[]>(sqlToRun);
      return {
        success: true,
        result: {
          columns: fields?.map((f) => f.name) || [],
          rows: rows as Record<string, unknown>[],
          executionTime: 0,
          type: 'select',
          message: limited
            ? `${rows.length} row(s) — limitado automaticamente a ${SAFETY_ROW_LIMIT} (adicione LIMIT na query para controlar isso)`
            : `${rows.length} row(s)`,
          autoLimited: limited,
        },
      };
    } else if (upperTrimmed.startsWith('INSERT')) {
      const [result] = await conn.query(sql) as [ResultSetHeader, unknown];
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
      const [result] = await conn.query(sql) as [ResultSetHeader, unknown];
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
      const [result] = await conn.query(sql) as [ResultSetHeader, unknown];
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
      await conn.query(sql);
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
      await conn.query(sql);
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
      await conn.query(sql);
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
      await conn.query(sql);
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
      await conn.query(sql);
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

/**
 * `database` opcional: quando informado, roda um `USE` antes das
 * statements — na MESMA conexão física que vai executar tudo o resto
 * (ver `pool.getConnection()` abaixo). Antes, o `USE` e as queries de
 * verdade eram chamadas separadas de `pool.query()`, que pode pegar
 * qualquer conexão do pool a cada chamada — sem garantia nenhuma de cair
 * na mesma sessão. Isso tinha dois efeitos ruins: (1) uma query contra um
 * banco não-padrão podia rodar no banco errado dependendo de qual conexão
 * o pool escolhesse; (2) um `BEGIN; ...; COMMIT;` digitado junto no editor
 * não necessariamente virava uma transação de verdade.
 */
export async function executeQuery(
  connectionId: string,
  sql: string,
  database?: string,
  executionId?: string,
  userId?: string
): Promise<ExecuteResult> {
  const pool = await getPool(connectionId);
  if (!pool) {
    return { success: false, error: 'Connection not found or expired' };
  }

  const conn = await pool.getConnection();

  // Guarda a thread ID de verdade do MySQL pra essa conexão, pra permitir
  // cancelar via `KILL QUERY` a partir de outra conexão do mesmo pool
  // (ver `/api/sql/cancel`). Só registra se o caller passou um
  // executionId — chamadas internas (ex: TableCreatorDialog) não
  // precisam disso.
  if (executionId && userId) {
    try {
      const [rows] = await conn.query<RowDataPacket[]>('SELECT CONNECTION_ID() as id');
      const mysqlThreadId = Number(rows[0]?.id);
      if (mysqlThreadId) {
        registerActiveExecution(executionId, { connectionId, mysqlThreadId, userId });
      }
    } catch {
      // Se isso falhar não é motivo pra abortar a query real — só não
      // vai dar pra cancelar essa execução específica.
    }
  }

  try {
    if (database) {
      const safeDb = database.replace(/[^a-zA-Z0-9_]/g, '');
      if (!safeDb || safeDb !== database) {
        return { success: false, error: 'Invalid database name' };
      }
      try {
        await conn.query(`USE \`${safeDb}\``);
      } catch {
        return { success: false, error: `Database '${safeDb}' not found` };
      }
    }

    const statements = splitStatements(sql);

    if (statements.length <= 1) {
      return await executeSingle(conn, sql);
    }

    const messages: Array<{ type: 'success' | 'error'; text: string }> = [];
    let lastResult: QueryResult | undefined;
    let anySuccess = false;
    let lastError = '';

    for (const stmt of statements) {
      const r = await executeSingle(conn, stmt);
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
      return { success: true, result: lastResult, messages };
    }

    return { success: false, error: lastError, messages };
  } finally {
    if (executionId) unregisterActiveExecution(executionId);
    conn.release();
  }
}
