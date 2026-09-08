import type { DatabaseSchema, TableInfo } from '@/types/sql-workbench';

/**
 * Tenta identificar a tabela principal de um `SELECT` (só o `FROM` mais
 * externo — não resolve JOINs complexos nem subqueries). Serve pra dar
 * contexto ao drill-down e nomear exports; não é (nem precisa ser) um
 * parser de SQL de verdade.
 */
export function guessSourceTable(sql: string): string | undefined {
  const match = sql.match(/FROM\s+[`"']?([a-zA-Z0-9_]+)[`"']?/i);
  return match?.[1];
}

export type DrillConfidence = 'fk' | 'heuristic';

export interface DrillTarget {
  table: string;
  column: string;
  confidence: DrillConfidence;
}

function findPrimaryKeyColumn(table: TableInfo): string {
  return table.columns.find((c) => c.key === 'PRI')?.name || 'id';
}

/**
 * Gera nomes de tabela candidatos a partir do nome de uma coluna que
 * parece uma FK por convenção (`idProduto`, `produto_id`, `IDCliente`...),
 * cobrindo variações singular/plural em pt-BR e en-US básicas. Usado só
 * como fallback quando o banco não tem a constraint de FK declarada —
 * comum em schemas analíticos/reporting.
 */
export function guessCandidateTableNames(column: string): string[] {
  const patterns: RegExp[] = [
    /^id[_]?([A-Za-z]\w*)$/, // idProduto, id_produto
    /^([A-Za-z]\w*?)_?[Ii]d$/, // produtoId, produto_id, produtoID
  ];

  const bases = new Set<string>();
  for (const pattern of patterns) {
    const match = column.match(pattern);
    if (match?.[1]) bases.add(match[1]);
  }
  if (bases.size === 0) return [];

  const candidates = new Set<string>();
  for (const base of bases) {
    const lower = base.toLowerCase();
    candidates.add(lower);
    candidates.add(`${lower}s`); // plural en/pt simples
    candidates.add(lower.endsWith('s') ? lower.slice(0, -1) : lower);
    candidates.add(`${lower}es`);
    candidates.add(`dim_${lower}`);
    candidates.add(`dim${base}`);
  }
  return Array.from(candidates);
}

/**
 * Resolve o alvo de drill-down para uma coluna clicada, em duas etapas:
 * 1. FK real declarada no banco (alta confiança) — cruza com
 *    `schema.foreignKeys`, que vem de `information_schema` de verdade.
 * 2. Heurística por nome (fallback) — só entra em jogo quando não há FK
 *    declarada, comum em bancos analíticos. Marcada como `heuristic` pra
 *    a UI deixar claro que é um palpite, não uma certeza.
 */
export function findDrillTarget(
  schema: DatabaseSchema | undefined,
  sourceTable: string | undefined,
  column: string
): DrillTarget | null {
  if (!schema) return null;

  if (sourceTable) {
    const fk = schema.foreignKeys.find(
      (f) => f.fromTable.toLowerCase() === sourceTable.toLowerCase() && f.fromColumn.toLowerCase() === column.toLowerCase()
    );
    if (fk) {
      return { table: fk.toTable, column: fk.toColumn, confidence: 'fk' };
    }
  }

  const candidates = guessCandidateTableNames(column);
  if (candidates.length === 0) return null;

  const tableByLowerName = new Map(schema.tables.map((t) => [t.name.toLowerCase(), t]));
  for (const candidate of candidates) {
    const table = tableByLowerName.get(candidate);
    if (table && table.name.toLowerCase() !== sourceTable?.toLowerCase()) {
      return { table: table.name, column: findPrimaryKeyColumn(table), confidence: 'heuristic' };
    }
  }
  return null;
}

/** Formata um valor de célula como literal SQL seguro para uma cláusula WHERE. */
export function formatSqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

export function buildWhereEqualsQuery(table: string, column: string, value: unknown, limit = 100): string {
  return `SELECT\n    *\nFROM \`${table}\`\nWHERE \`${column}\` = ${formatSqlLiteral(value)}\nLIMIT ${limit};`;
}
