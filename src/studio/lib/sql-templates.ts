/**
 * Pre-built SQL query templates for the SQL Runner.
 * Each template can include placeholders for table/field names.
 */

export interface SqlTemplate {
  id: string;
  name: string;
  description: string;
  sql: string;
  category: 'basic' | 'aggregation' | 'join' | 'analysis';
}

export const SQL_TEMPLATES: SqlTemplate[] = [
  // Basic
  {
    id: 'select-all',
    name: 'Selecionar tudo',
    description: 'SELECT * com LIMIT',
    sql: 'SELECT *\nFROM {tabela}\nLIMIT 100;',
    category: 'basic',
  },
  {
    id: 'select-columns',
    name: 'Selecionar colunas',
    description: 'SELECT com colunas específicas',
    sql: 'SELECT {coluna1}, {coluna2}\nFROM {tabela}\nLIMIT 100;',
    category: 'basic',
  },
  {
    id: 'where-filter',
    name: 'Filtro WHERE',
    description: 'SELECT com condição',
    sql: 'SELECT *\nFROM {tabela}\nWHERE {coluna} {operador} {valor}\nLIMIT 100;',
    category: 'basic',
  },
  {
    id: 'distinct',
    name: 'Valores únicos',
    description: 'SELECT DISTINCT',
    sql: 'SELECT DISTINCT {coluna}\nFROM {tabela}\nORDER BY {coluna};',
    category: 'basic',
  },

  // Aggregation
  {
    id: 'count',
    name: 'Contar registros',
    description: 'COUNT(*) por tabela',
    sql: 'SELECT COUNT(*) AS total_registros\nFROM {tabela};',
    category: 'aggregation',
  },
  {
    id: 'sum-group',
    name: 'Soma por grupo',
    description: 'SUM com GROUP BY',
    sql: 'SELECT {campo_grupo}, SUM({campo_valor}) AS total\nFROM {tabela}\nGROUP BY {campo_grupo}\nORDER BY total DESC;',
    category: 'aggregation',
  },
  {
    id: 'avg',
    name: 'Média',
    description: 'AVG de um campo',
    sql: 'SELECT AVG({campo}) AS media\nFROM {tabela};',
    category: 'aggregation',
  },
  {
    id: 'min-max',
    name: 'Mínimo e Máximo',
    description: 'MIN e MAX de um campo',
    sql: 'SELECT MIN({campo}) AS minimo, MAX({campo}) AS maximo\nFROM {tabela};',
    category: 'aggregation',
  },
  {
    id: 'count-group',
    name: 'Contagem por grupo',
    description: 'COUNT com GROUP BY',
    sql: 'SELECT {campo_grupo}, COUNT(*) AS quantidade\nFROM {tabela}\nGROUP BY {campo_grupo}\nORDER BY quantidade DESC;',
    category: 'aggregation',
  },

  // Join
  {
    id: 'inner-join',
    name: 'INNER JOIN',
    description: 'Join entre duas tabelas',
    sql: 'SELECT a.*, b.*\nFROM {tabela_a} a\nINNER JOIN {tabela_b} b ON a.{campo} = b.{campo}\nLIMIT 100;',
    category: 'join',
  },
  {
    id: 'left-join',
    name: 'LEFT JOIN',
    description: 'Left join entre duas tabelas',
    sql: 'SELECT a.*, b.*\nFROM {tabela_a} a\nLEFT JOIN {tabela_b} b ON a.{campo} = b.{campo}\nLIMIT 100;',
    category: 'join',
  },

  // Analysis
  {
    id: 'top-n',
    name: 'Top N registros',
    description: 'Top N por ordenação',
    sql: 'SELECT *\nFROM {tabela}\nORDER BY {campo} DESC\nLIMIT {n};',
    category: 'analysis',
  },
  {
    id: 'group-having',
    name: 'GROUP BY + HAVING',
    description: 'Agrupamento com filtro',
    sql: 'SELECT {campo_grupo}, COUNT(*) AS qtd\nFROM {tabela}\nGROUP BY {campo_grupo}\nHAVING COUNT(*) > {minimo}\nORDER BY qtd DESC;',
    category: 'analysis',
  },
  {
    id: 'date-range',
    name: 'Filtro por período',
    description: 'WHERE entre datas',
    sql: 'SELECT *\nFROM {tabela}\nWHERE {campo_data} BETWEEN "{data_inicio}" AND "{data_fim}"\nORDER BY {campo_data};',
    category: 'analysis',
  },
];

/** Get templates grouped by category */
export function getTemplatesByCategory(): Record<string, SqlTemplate[]> {
  const grouped: Record<string, SqlTemplate[]> = {};
  SQL_TEMPLATES.forEach(t => {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  });
  return grouped;
}

/** Category labels for UI */
export const CATEGORY_LABELS: Record<string, string> = {
  basic: 'Básico',
  aggregation: 'Agregação',
  join: 'Join',
  analysis: 'Análise',
};
