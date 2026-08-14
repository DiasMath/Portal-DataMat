import type { DataModel } from '../types/dashboard';

export interface SqlValidationError {
  message: string;
  suggestion?: string;
  position?: { start: number; end: number };
  severity: 'error' | 'warning';
}

export interface SqlValidationResult {
  valid: boolean;
  errors: SqlValidationError[];
}

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'ORDER', 'HAVING', 'AS',
  'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'EXISTS', 'IS', 'NULL',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'DISTINCT', 'ASC', 'DESC',
  'LIMIT', 'OFFSET', 'UNION', 'ALL', 'INSERT', 'INTO', 'VALUES',
  'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER',
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'ON',
  'TRUE', 'FALSE', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE',
  'IFNULL', 'CAST', 'CONVERT', 'NOW', 'DATE', 'YEAR', 'MONTH', 'DAY',
  'CONCAT', 'SUBSTRING', 'TRIM', 'UPPER', 'LOWER', 'LENGTH',
  'ROUND', 'FLOOR', 'CEIL', 'ABS', 'MOD', 'POWER', 'SQRT',
  'DATE_FORMAT', 'DATE_ADD', 'DATE_SUB', 'DATEDIFF', 'CURDATE',
  'IF', 'NULLIF', 'GREATEST', 'LEAST', 'ABS', 'NULLIF',
]);

const SQL_FUNCTIONS = new Set([
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'IFNULL',
  'CAST', 'CONVERT', 'NOW', 'DATE', 'YEAR', 'MONTH', 'DAY',
  'CONCAT', 'SUBSTRING', 'TRIM', 'UPPER', 'LOWER', 'LENGTH',
  'ROUND', 'FLOOR', 'CEIL', 'ABS', 'MOD', 'POWER', 'SQRT',
  'DATE_FORMAT', 'DATE_ADD', 'DATE_SUB', 'DATEDIFF', 'CURDATE',
  'IF', 'NULLIF', 'GREATEST', 'LEAST',
]);

function extractIdentifiers(expression: string): { table: string; field: string; full: string; start: number; end: number }[] {
  const results: { table: string; field: string; full: string; start: number; end: number }[] = [];

  // Match table.field pattern (e.g., tabela.campo or 'tabela'.'campo')
  const qualifiedPattern = /(?:(?:'([^']+)'|"([^"]+)"|(\w+))\.)\s*(?:'([^']+)'|"([^"]+)"|(\w+))/g;
  let match;
  while ((match = qualifiedPattern.exec(expression)) !== null) {
    const table = match[1] || match[2] || match[3] || '';
    const field = match[4] || match[5] || match[6] || '';
    results.push({
      table,
      field,
      full: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Match standalone identifiers that are not keywords (simple field references)
  const standalonePattern = /(?<!\w)([a-zA-Z_]\w*)(?!\w*\s*\()/g;
  while ((match = standalonePattern.exec(expression)) !== null) {
    const word = match[1].toUpperCase();
    if (SQL_KEYWORDS.has(word) || SQL_FUNCTIONS.has(word)) continue;
    // Check if it's part of a qualified reference we already captured
    const isPartOfQualified = results.some(r => match!.index >= r.start && match!.index < r.end);
    if (!isPartOfQualified) {
      results.push({
        table: '',
        field: match[1],
        full: match[1],
        start: match.index,
        end: match.index + match[1].length,
      });
    }
  }

  return results;
}

function checkBalancedParentheses(expression: string): SqlValidationError | null {
  let depth = 0;
  for (let i = 0; i < expression.length; i++) {
    if (expression[i] === '(') depth++;
    if (expression[i] === ')') depth--;
    if (depth < 0) {
      return {
        message: 'Parêntese de fechamento ")" sem correspondência',
        suggestion: 'Verifique se todos os parênteses estão balanceados',
        position: { start: i, end: i + 1 },
        severity: 'error',
      };
    }
  }
  if (depth > 0) {
    return {
      message: `${depth} parêntese(s) de abertura "(" sem fechamento`,
      suggestion: 'Adicione o(s) parêntese(s) de fechamento ")"',
      severity: 'error',
    };
  }
  return null;
}

function checkBalancedQuotes(expression: string): SqlValidationError | null {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    }
    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    }
  }
  if (inSingleQuote) {
    return {
      message: "Aspa simples (') sem fechamento",
      suggestion: 'Feche a string com outra aspa simples',
      severity: 'error',
    };
  }
  if (inDoubleQuote) {
    return {
      message: 'Aspa dupla (") sem fechamento',
      suggestion: 'Feche o identificador com outra aspa dupla',
      severity: 'error',
    };
  }
  return null;
}

export function validateSqlMeasure(expression: string, dataModel: DataModel | null): SqlValidationResult {
  const errors: SqlValidationError[] = [];

  if (!expression.trim()) {
    return { valid: false, errors: [{ message: 'Expressão vazia', severity: 'error' }] };
  }

  // Check for invalid characters
  const invalidChars = expression.match(/[^\w\s.,'"()*+\-\/=<>!&|;:]/g);
  if (invalidChars) {
    const unique = [...new Set(invalidChars)];
    errors.push({
      message: `Caractere(s) inválido(s): ${unique.join(', ')}`,
      suggestion: 'Use apenas caracteres permitidos: letras, números, aspas, parênteses, operadores',
      severity: 'error',
    });
  }

  // Check balanced parentheses
  const parenError = checkBalancedParentheses(expression);
  if (parenError) errors.push(parenError);

  // Check balanced quotes
  const quoteError = checkBalancedQuotes(expression);
  if (quoteError) errors.push(quoteError);

  // Check if expression looks like a bare word (not SQL)
  const trimmed = expression.trim();
  if (/^[a-zA-Z_]\w*$/i.test(trimmed) && !SQL_KEYWORDS.has(trimmed.toUpperCase()) && !SQL_FUNCTIONS.has(trimmed.toUpperCase())) {
    errors.push({
      message: `"${trimmed}" não é uma expressão SQL válida`,
      suggestion: 'Uma medida deve ser uma expressão SQL, como: COUNT(*) ou SUM(tabela.campo)',
      severity: 'error',
    });
  }

  // Check for SELECT * (not allowed in measures)
  if (/\bSELECT\s+\*/i.test(expression)) {
    errors.push({
      message: 'SELECT * não é permitido em medidas',
      suggestion: 'Especifique os campos específicos, como: COUNT(tabela.campo) ou SUM(tabela.campo)',
      severity: 'error',
    });
  }

  // Validate table and field references against data model
  if (dataModel) {
    const identifiers = extractIdentifiers(expression);
    const tableNames = new Set(dataModel.tables.map(t => t.name));
    const tableLabels = new Set(dataModel.tables.map(t => t.label));
    const allFields = new Map<string, Set<string>>();
    const allFieldLabels = new Map<string, Set<string>>();

    for (const table of dataModel.tables) {
      allFields.set(table.name, new Set(table.fields.map(f => f.name)));
      allFieldLabels.set(table.name, new Set(table.fields.filter(f => f.label).map(f => f.label!)));
    }

    for (const id of identifiers) {
      if (id.table) {
        // Qualified reference: table.field
        if (!tableNames.has(id.table) && !tableLabels.has(id.table)) {
          const suggestion = dataModel.tables.length > 0
            ? `Tabelas disponíveis: ${dataModel.tables.map(t => t.name).join(', ')}`
            : 'Nenhuma tabela encontrada no modelo de dados';
          errors.push({
            message: `Tabela "${id.table}" não encontrada`,
            suggestion,
            position: { start: id.start, end: id.end },
            severity: 'error',
          });
        } else {
          // Table exists, check field
          const tableName = tableNames.has(id.table) ? id.table : dataModel.tables.find(t => t.label === id.table)?.name;
          if (tableName) {
            const fields = allFields.get(tableName);
            const fieldLabels = allFieldLabels.get(tableName);
            if (fields && !fields.has(id.field) && fieldLabels && !fieldLabels.has(id.field)) {
              const suggestion = fields.size > 0
                ? `Campos disponíveis: ${[...fields].join(', ')}`
                : 'Nenhum campo encontrado na tabela';
              errors.push({
                message: `Campo "${id.field}" não encontrado na tabela "${id.table}"`,
                suggestion,
                position: { start: id.start, end: id.end },
                severity: 'error',
              });
            }
          }
        }
      }
    }
  }

  // Check for common mistakes
  if (/\bFROM\b/i.test(expression) && !/\bSELECT\b/i.test(expression)) {
    errors.push({
      message: 'Cláusula FROM sem SELECT',
      suggestion: 'Medidas devem ser expressões de agregação, como: SUM(tabela.campo) ou COUNT(tabela.campo)',
      severity: 'warning',
    });
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}
