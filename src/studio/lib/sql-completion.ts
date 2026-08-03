import type { DataModel } from '../types/dashboard';

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'ORDER', 'HAVING', 'AS',
  'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'EXISTS', 'IS', 'NULL',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'DISTINCT', 'ASC', 'DESC',
  'LIMIT', 'OFFSET', 'UNION', 'ALL', 'INSERT', 'INTO', 'VALUES',
  'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER',
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'ON',
  'TRUE', 'FALSE',
];

const SQL_FUNCTIONS = [
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'IFNULL',
  'CAST', 'CONVERT', 'NOW', 'DATE', 'YEAR', 'MONTH', 'DAY',
  'CONCAT', 'SUBSTRING', 'TRIM', 'UPPER', 'LOWER', 'LENGTH',
  'ROUND', 'FLOOR', 'CEIL', 'ABS', 'MOD', 'POWER', 'SQRT',
  'DATE_FORMAT', 'DATE_ADD', 'DATE_SUB', 'DATEDIFF', 'CURDATE',
  'IF', 'NULLIF', 'GREATEST', 'LEAST',
];

let isRegistered = false;

export function registerSqlCompletionProvider(getDataModel: () => DataModel | null) {
  if (isRegistered) return;
  isRegistered = true;

  import('monaco-editor').then((monaco) => {
    monaco.languages.registerCompletionItemProvider('sql', {
      triggerCharacters: ['.', ' ', '('],
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endLineNumber: position.lineNumber,
          endColumn: word.endColumn,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const suggestions: any[] = [];

        SQL_KEYWORDS.forEach(keyword => {
          suggestions.push({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            detail: 'Palavra-chave SQL',
            range,
          });
        });

        SQL_FUNCTIONS.forEach(func => {
          suggestions.push({
            label: func,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: func,
            detail: 'Função SQL',
            range,
          });
        });

        const dataModel = getDataModel();
        if (dataModel) {
          dataModel.tables.forEach(table => {
            suggestions.push({
              label: table.name,
              kind: monaco.languages.CompletionItemKind.Struct,
              insertText: table.name,
              detail: `Tabela (${table.type === 'fact' ? 'Fato' : 'Dimensão'})`,
              documentation: `Tabela: ${table.label}`,
              range,
            });

            suggestions.push({
              label: table.label,
              kind: monaco.languages.CompletionItemKind.Struct,
              insertText: table.name,
              detail: `Tabela: ${table.label}`,
              range,
            });

            table.fields.forEach(field => {
              suggestions.push({
                label: field.name,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: field.name,
                detail: `${table.label}.${field.label || field.name} (${field.type})`,
                range,
              });

              suggestions.push({
                label: `${table.name}.${field.name}`,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: `${table.name}.${field.name}`,
                detail: `Coluna: ${field.label || field.name} (${field.type})`,
                range,
              });

              if (field.label && field.label !== field.name) {
                suggestions.push({
                  label: field.label,
                  kind: monaco.languages.CompletionItemKind.Field,
                  insertText: field.name,
                  detail: `${table.label}.${field.name} (${field.type})`,
                  range,
                });
              }
            });
          });
        }

        return { suggestions };
      },
    });
  });
}
