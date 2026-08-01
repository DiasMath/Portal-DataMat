import type { DataModel } from '../types/dashboard';
import type { VisualBuckets, BucketField, FilterCondition } from '../types/visuals';

export interface SqlBuildResult {
  sql: string;
  referencedTables: string[];
  needsGroupBy: boolean;
}

export function buildSqlQuery(
  buckets: VisualBuckets,
  filters: FilterCondition[],
  dataModel: DataModel,
  tableName?: string
): SqlBuildResult {
  const referencedTables = new Set<string>();
  const allFields: BucketField[] = [
    ...(buckets.xAxis || []),
    ...(buckets.legend || []),
    ...(buckets.values || []),
    ...(buckets.yAxis || []),
    ...(buckets.details || []),
  ];

  for (const field of allFields) {
    referencedTables.add(field.tableName);
  }

  if (allFields.length === 0) {
    return { sql: '', referencedTables: [], needsGroupBy: false };
  }

  const isTableVisual = buckets.details && buckets.details.length > 0 && !buckets.values && !buckets.yAxis;
  const isScalarVisual = !buckets.xAxis && !buckets.legend && (buckets.values?.length === 1 || buckets.yAxis?.length === 1);

  if (isScalarVisual) {
    return buildScalarQuery(buckets, filters, referencedTables);
  }

  if (isTableVisual) {
    return buildTableQuery(buckets, filters, referencedTables);
  }

  return buildAggregateQuery(buckets, filters, referencedTables);
}

function buildAggregateQuery(
  buckets: VisualBuckets,
  filters: FilterCondition[],
  referencedTables: Set<string>
): SqlBuildResult {
  const selectColumns: string[] = [];
  const groupByColumns: string[] = [];

  for (const field of (buckets.xAxis || [])) {
    const alias = field.alias || field.fieldName;
    selectColumns.push(`"${field.tableName}"."${field.fieldName}" AS "${alias}"`);
    groupByColumns.push(`"${field.tableName}"."${field.fieldName}"`);
  }

  for (const field of (buckets.legend || [])) {
    const alias = field.alias || field.fieldName;
    selectColumns.push(`"${field.tableName}"."${field.fieldName}" AS "${alias}"`);
    groupByColumns.push(`"${field.tableName}"."${field.fieldName}"`);
  }

  for (const field of [...(buckets.values || []), ...(buckets.yAxis || [])]) {
    const agg = field.aggregation || 'SUM';
    const alias = field.alias || `${agg.toLowerCase()}_${field.fieldName}`;
    if (agg === 'NONE') {
      selectColumns.push(`"${field.tableName}"."${field.fieldName}" AS "${alias}"`);
    } else {
      selectColumns.push(`${agg}("${field.tableName}"."${field.fieldName}") AS "${alias}"`);
    }
  }

  const primaryTable = findPrimaryTable(referencedTables);
  let fromClause = `"${primaryTable}"`;

  const joinClauses = buildJoinClauses(referencedTables, primaryTable);
  for (const join of joinClauses) {
    fromClause += `\n  ${join}`;
  }

  let whereClause = '';
  if (filters.length > 0) {
    whereClause = `\nWHERE ${filters.map(buildFilterCondition).join(' AND ')}`;
  }

  const groupByClause = groupByColumns.length > 0
    ? `\nGROUP BY ${groupByColumns.join(', ')}`
    : '';

  const orderByParts: string[] = [];
  for (const field of (buckets.xAxis || [])) {
    orderByParts.push(`"${field.tableName}"."${field.fieldName}" ${field.sortDirection || 'ASC'}`);
  }
  const orderByClause = orderByParts.length > 0
    ? `\nORDER BY ${orderByParts.join(', ')}`
    : '';

  const sql = [
    `SELECT`,
    selectColumns.map(c => `  ${c}`).join(',\n'),
    `FROM ${fromClause}`,
    whereClause,
    groupByClause,
    orderByClause,
  ].filter(Boolean).join('\n');

  return {
    sql,
    referencedTables: Array.from(referencedTables),
    needsGroupBy: groupByColumns.length > 0,
  };
}

function buildTableQuery(
  buckets: VisualBuckets,
  filters: FilterCondition[],
  referencedTables: Set<string>
): SqlBuildResult {
  const fields = buckets.details || [];
  if (fields.length === 0) {
    return { sql: '', referencedTables: [], needsGroupBy: false };
  }

  const selectColumns = fields.map(f =>
    `"${f.tableName}"."${f.fieldName}" AS "${f.alias || f.fieldName}"`
  );

  const primaryTable = findPrimaryTable(referencedTables);
  let fromClause = `"${primaryTable}"`;

  const joinClauses = buildJoinClauses(referencedTables, primaryTable);
  for (const join of joinClauses) {
    fromClause += `\n  ${join}`;
  }

  let whereClause = '';
  if (filters.length > 0) {
    whereClause = `\nWHERE ${filters.map(buildFilterCondition).join(' AND ')}`;
  }

  const orderByClause = fields.length > 0
    ? `\nORDER BY "${fields[0].tableName}"."${fields[0].fieldName}" ASC`
    : '';

  const sql = [
    `SELECT`,
    selectColumns.map(c => `  ${c}`).join(',\n'),
    `FROM ${fromClause}`,
    whereClause,
    orderByClause,
    `\nLIMIT 500`,
  ].filter(Boolean).join('\n');

  return {
    sql,
    referencedTables: Array.from(referencedTables),
    needsGroupBy: false,
  };
}

function buildScalarQuery(
  buckets: VisualBuckets,
  filters: FilterCondition[],
  referencedTables: Set<string>
): SqlBuildResult {
  const field = buckets.values?.[0] || buckets.yAxis?.[0];
  if (!field) {
    return { sql: 'SELECT NULL AS "value"', referencedTables: [], needsGroupBy: false };
  }

  const agg = field.aggregation || 'SUM';
  const alias = field.alias || 'value';

  let whereClause = '';
  if (filters.length > 0) {
    whereClause = `\nWHERE ${filters.map(buildFilterCondition).join(' AND ')}`;
  }

  const sql = [
    `SELECT ${agg}("${field.tableName}"."${field.fieldName}") AS "${alias}"`,
    `FROM "${field.tableName}"`,
    whereClause,
  ].filter(Boolean).join('\n');

  return {
    sql,
    referencedTables: [field.tableName],
    needsGroupBy: false,
  };
}

function buildJoinClauses(referencedTables: Set<string>, primaryTable: string): string[] {
  const joins: string[] = [];
  const joined = new Set<string>([primaryTable]);
  const queue = [primaryTable];

  const relationships = getDefaultRelationships();

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const rel of relationships) {
      let nextTable: string | null = null;
      let joinCondition: string | null = null;

      if (rel.fromTable === current && referencedTables.has(rel.toTable) && !joined.has(rel.toTable)) {
        nextTable = rel.toTable;
        joinCondition = `"${rel.fromTable}"."${rel.fromField}" = "${rel.toTable}"."${rel.toField}"`;
      } else if (rel.toTable === current && referencedTables.has(rel.fromTable) && !joined.has(rel.fromTable)) {
        nextTable = rel.fromTable;
        joinCondition = `"${rel.toTable}"."${rel.toField}" = "${rel.fromTable}"."${rel.fromField}"`;
      }

      if (nextTable && joinCondition) {
        const joinType = rel.cardinality === 'N:1' ? 'LEFT JOIN' : 'INNER JOIN';
        joins.push(`${joinType} "${nextTable}" ON ${joinCondition}`);
        joined.add(nextTable);
        queue.push(nextTable);
      }
    }
  }

  return joins;
}

function findPrimaryTable(referencedTables: Set<string>): string {
  const factTables = ['fato_vendas', 'fato_movimentacao', 'fato_lancamentos', 'fato_ponto'];
  for (const fact of factTables) {
    if (referencedTables.has(fact)) return fact;
  }
  return referencedTables.values().next().value || '';
}

function buildFilterCondition(filter: FilterCondition): string {
  const col = `"${filter.tableName}"."${filter.columnName}"`;
  switch (filter.operator) {
    case '=': return `${col} = ${formatValue(filter.value)}`;
    case '!=': return `${col} != ${formatValue(filter.value)}`;
    case '>': return `${col} > ${formatValue(filter.value)}`;
    case '<': return `${col} < ${formatValue(filter.value)}`;
    case '>=': return `${col} >= ${formatValue(filter.value)}`;
    case '<=': return `${col} <= ${formatValue(filter.value)}`;
    case 'LIKE': return `${col} LIKE ${formatValue(filter.value)}`;
    case 'IS NULL': return `${col} IS NULL`;
    case 'IS NOT NULL': return `${col} IS NOT NULL`;
    case 'IN': {
      const vals = Array.isArray(filter.value) ? filter.value : [filter.value];
      return `${col} IN (${vals.map(formatValue).join(', ')})`;
    }
    case 'NOT IN': {
      const vals = Array.isArray(filter.value) ? filter.value : [filter.value];
      return `${col} NOT IN (${vals.map(formatValue).join(', ')})`;
    }
    default: return `${col} = ${formatValue(filter.value)}`;
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
  if (value instanceof Date) return `'${value.toISOString()}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function getDefaultRelationships() {
  return [
    { fromTable: 'fato_vendas', fromField: 'id_cliente', toTable: 'dim_cliente', toField: 'id_cliente', cardinality: 'N:1' as const },
    { fromTable: 'fato_vendas', fromField: 'id_produto', toTable: 'dim_produto', toField: 'id_produto', cardinality: 'N:1' as const },
    { fromTable: 'fato_vendas', fromField: 'data_venda', toTable: 'dim_calendario', toField: 'data', cardinality: 'N:1' as const },
  ];
}
