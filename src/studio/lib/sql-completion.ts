import type { DataModel } from '../types/dashboard';

interface MonacoCompletionRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

interface MonacoCompletionItem {
  label: string;
  kind: number;
  insertText: string;
  detail: string;
  documentation?: string;
  range: MonacoCompletionRange;
}

interface MonacoWordAtPosition {
  word: string;
  startColumn: number;
  endColumn: number;
}

interface MonacoModel {
  getWordUntilPosition(position: { lineNumber: number; column: number }): MonacoWordAtPosition;
}

interface MonacoPosition {
  lineNumber: number;
  column: number;
}

interface MonacoCompletionProvider {
  triggerCharacters?: string[];
  provideCompletionItems(model: MonacoModel, position: MonacoPosition): { suggestions: MonacoCompletionItem[] };
}

interface MonacoLanguages {
  registerCompletionItemProvider(language: string, provider: MonacoCompletionProvider): void;
}

interface MonacoInstance {
  languages: MonacoLanguages;
}

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

export function registerSqlCompletionProvider(monaco: MonacoInstance, getDataModel: () => DataModel | null) {
  monaco.languages.registerCompletionItemProvider('sql', {
    triggerCharacters: ['.', ' ', '(', ','],
    provideCompletionItems: (model: MonacoModel, position: MonacoPosition) => {
      const word = model.getWordUntilPosition(position);
      const range: MonacoCompletionRange = {
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn,
      };

      const suggestions: MonacoCompletionItem[] = [];

      SQL_KEYWORDS.forEach(keyword => {
        suggestions.push({
          label: keyword,
          kind: 1, // CompletionItemKind.Keyword
          insertText: keyword,
          detail: 'Palavra-chave SQL',
          range,
        });
      });

      SQL_FUNCTIONS.forEach(func => {
        suggestions.push({
          label: func,
          kind: 3,
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
            kind: 14,
            insertText: table.name,
            detail: `Tabela (${table.type === 'fact' ? 'Fato' : 'Dimensão'})`,
            documentation: `Tabela: ${table.label}`,
            range,
          });

          suggestions.push({
            label: table.label,
            kind: 14,
            insertText: table.name,
            detail: `Tabela: ${table.label}`,
            range,
          });

          table.fields.forEach(field => {
            suggestions.push({
              label: field.name,
              kind: 5,
              insertText: field.name,
              detail: `${table.label}.${field.label || field.name} (${field.type})`,
              range,
            });

            suggestions.push({
              label: `${table.name}.${field.name}`,
              kind: 5,
              insertText: `${table.name}.${field.name}`,
              detail: `Coluna: ${field.label || field.name} (${field.type})`,
              range,
            });

            if (field.label && field.label !== field.name) {
              suggestions.push({
                label: field.label,
                kind: 5,
                insertText: field.name,
                detail: `${table.label}.${field.name} (${field.type})`,
                range,
              });
            }
          });
        });

        if (dataModel.measures) {
          dataModel.measures.forEach(measure => {
            suggestions.push({
              label: measure.name,
              kind: 6,
              insertText: measure.name,
              detail: `Medida: ${measure.expression}`,
              range,
            });
          });
        }
      }

      return { suggestions };
    },
  });
}
