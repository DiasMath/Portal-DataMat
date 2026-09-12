'use client';

import { useRef, useCallback, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';

interface QueryEditorProps {
  tabId: string;
  sql: string;
  connectionId?: string;
  fontSize?: number;
}

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
  'IS', 'NULL', 'AS', 'ON', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL',
  'CROSS', 'NATURAL', 'USING', 'HAVING', 'GROUP', 'BY', 'ORDER', 'ASC', 'DESC',
  'LIMIT', 'OFFSET', 'UNION', 'ALL', 'INTERSECT', 'EXCEPT',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
  'CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'RENAME',
  'TABLE', 'INDEX', 'VIEW', 'DATABASE', 'SCHEMA',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'CHECK', 'DEFAULT',
  'AUTO_INCREMENT', 'INCREMENT', 'START', 'WITH', 'END',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'SAVEPOINT',
  'IF', 'THEN', 'ELSE', 'ELSIF', 'CASE', 'WHEN', 'WHILE', 'LOOP', 'REPEAT', 'UNTIL',
  'DECLARE', 'CURSOR', 'HANDLER', 'SIGNAL', 'RESIGNAL',
  'PROCEDURE', 'FUNCTION', 'TRIGGER', 'EVENT',
  'GRANT', 'REVOKE', 'LOCK', 'UNLOCK',
  'EXPLAIN', 'DESCRIBE', 'DESC', 'SHOW', 'USE',
  'CALL', 'RETURN', 'RETURNS', 'DETERMINISTIC', 'CONTAINS', 'READS', 'MODIFIES',
  'VIRTUAL', 'STORED', 'GENERATED', 'COLUMNS', 'TABLES', 'INDEXES', 'PROCESSLIST',
  'VARIABLES', 'STATUS', 'ERRORS', 'WARNINGS',
];

const MYSQL_FUNCTIONS = [
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'IFNULL', 'NULLIF',
  'CONCAT', 'CONCAT_WS', 'SUBSTRING', 'SUBSTR', 'LENGTH', 'CHAR_LENGTH',
  'UPPER', 'LOWER', 'TRIM', 'LTRIM', 'RTRIM', 'LPAD', 'RPAD',
  'REPLACE', 'INSERT', 'INSTR', 'LOCATE', 'POSITION',
  'LEFT', 'RIGHT', 'MID', 'REVERSE',
  'NOW', 'CURDATE', 'CURRENT_DATE', 'CURTIME', 'CURRENT_TIME',
  'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND',
  'DATE_FORMAT', 'STR_TO_DATE', 'ADDDATE', 'SUBDATE', 'DATEDIFF', 'DATE_ADD', 'DATE_SUB',
  'IF', 'IFNULL', 'NULLIF', 'CAST', 'CONVERT',
  'ROUND', 'FLOOR', 'CEIL', 'CEILING', 'ABS', 'MOD', 'POWER', 'POW', 'SQRT',
  'RAND', 'RANDOM', 'UUID', 'LAST_INSERT_ID', 'ROW_COUNT',
  'DISTINCT', 'COUNT DISTINCT', 'GROUP_CONCAT', 'JSON_OBJECT', 'JSON_ARRAY',
  'INET_ATON', 'INET_NTOA', 'IS_IPV4', 'IS_IPV6',
  'FORMAT', 'LOCATE', 'FIELD', 'FIND_IN_SET',
];

const SQL_RESERVED_AFTER_TABLE = new Set([
  'WHERE', 'GROUP', 'ORDER', 'LIMIT', 'JOIN', 'ON', 'AND', 'OR', 'SET',
  'VALUES', 'HAVING', 'UNION', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS',
  'USING', 'AS',
]);

/**
 * Extrai as tabelas referenciadas num SQL (com apelido, se houver) a
 * partir das cláusulas FROM/JOIN — usado pro autocomplete priorizar
 * colunas das tabelas que você já está usando na query, em vez de
 * misturar tudo do banco junto. É um parser propositalmente simples
 * (regex, não uma gramática SQL completa) — não trata subqueries
 * aninhadas nem CTEs, cobre o caso comum de FROM/JOIN direto.
 */
function parseReferencedTables(sql: string): { table: string; alias?: string }[] {
  const results: { table: string; alias?: string }[] = [];
  const regex = /\b(?:FROM|JOIN)\s+`?([a-zA-Z_][a-zA-Z0-9_]*)`?(?:\s+(?:AS\s+)?`?([a-zA-Z_][a-zA-Z0-9_]*)`?)?/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sql)) !== null) {
    const table = match[1];
    let alias: string | undefined = match[2];
    if (alias && SQL_RESERVED_AFTER_TABLE.has(alias.toUpperCase())) alias = undefined;
    results.push({ table, alias });
  }
  return results;
}

export function QueryEditor({ tabId, sql, connectionId, fontSize = 14 }: QueryEditorProps) {
  const { state, dispatch, registerEditor, unregisterEditor } = useSqlWorkbench();
  const editorRef = useRef<any>(null);
  const sqlRef = useRef(sql);
  sqlRef.current = sql;
  const completionDisposableRef = useRef<{ dispose: () => void } | null>(null);

  // Cada instância do QueryEditor é remontada quando você troca de aba
  // (o `key={tab.id}` no componente pai força isso). Sem descartar o
  // provider de autocomplete registrado no mount anterior, cada troca de
  // aba deixava um provider "sql" a mais pendurado no Monaco global —
  // acumulando ao longo do dia e deixando o autocomplete cada vez mais
  // pesado (e com sugestões duplicadas).
  useEffect(() => {
    return () => {
      completionDisposableRef.current?.dispose();
      unregisterEditor(tabId);
    };
  }, [tabId, unregisterEditor]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    registerEditor(tabId, editor);

    monaco.editor.defineTheme('datamat-sql', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'FFB03F', fontStyle: 'bold' },
        { token: 'keyword.sql', foreground: 'FFB03F', fontStyle: 'bold' },
        { token: 'predefined.sql', foreground: 'FFB03F', fontStyle: 'bold' },
        { token: 'string', foreground: '4EC9B0' },
        { token: 'string.sql', foreground: '4EC9B0' },
        { token: 'string.single', foreground: '4EC9B0' },
        { token: 'string.double', foreground: '4EC9B0' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'number.sql', foreground: 'B5CEA8' },
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'operator.sql', foreground: 'D4D4D4' },
        { token: 'identifier.sql', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.lineHighlightBackground': '#ffffff0a',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#FFB03F',
        'editorLineNumber.foreground': '#5a5a6e',
        'editorLineNumber.activeForeground': '#FFB03F',
      },
    });
    editor.updateOptions({ theme: 'datamat-sql' });

    completionDisposableRef.current = monaco.languages.registerCompletionItemProvider('sql', {
      triggerCharacters: [' ', '.', '(', ','],
      provideCompletionItems: (model: Monaco.editor.ITextModel, position: Monaco.Position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: any[] = [];
        const fullSql = model.getValue();
        const referencedTables = connectionId && state.schemas[connectionId] ? parseReferencedTables(fullSql) : [];
        const referencedTableNames = new Set(referencedTables.map((t) => t.table.toLowerCase()));

        // Se o texto antes do cursor termina em "algo." (ex: "p." ou
        // "produtos."), tenta resolver esse prefixo pra uma tabela real
        // (via apelido ou nome direto) e sugere só as colunas dela — é o
        // caso mais comum de "não quero ver coluna de outra tabela".
        const textBeforeCursor = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: word.startColumn,
        });
        const dotMatch = textBeforeCursor.match(/([a-zA-Z_][a-zA-Z0-9_]*)\.\s*$/);

        if (dotMatch && connectionId && state.schemas[connectionId]) {
          const prefix = dotMatch[1].toLowerCase();
          const schema = state.schemas[connectionId];
          const resolvedTable =
            referencedTables.find((t) => (t.alias || t.table).toLowerCase() === prefix)?.table ||
            schema.tables.find((t) => t.name.toLowerCase() === prefix)?.name;
          const table = resolvedTable ? schema.tables.find((t) => t.name === resolvedTable) : undefined;

          if (table) {
            table.columns.forEach((col) => {
              suggestions.push({
                label: col.name,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: `\`${col.name}\``,
                detail: `${col.type} — ${table.name}`,
                range,
              });
            });
            return { suggestions };
          }
        }

        SQL_KEYWORDS.forEach((kw) => {
          suggestions.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range,
            sortText: `2_${kw}`,
          });
        });

        MYSQL_FUNCTIONS.forEach((fn) => {
          suggestions.push({
            label: fn,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: fn + '($0)',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            sortText: `2_${fn}`,
          });
        });

        if (connectionId && state.schemas[connectionId]) {
          const schema = state.schemas[connectionId];

          schema.tables.forEach((table) => {
            const isReferenced = referencedTableNames.has(table.name.toLowerCase());
            // Prefixo de ordenação: tabelas/colunas já usadas na query
            // (FROM/JOIN atual) aparecem primeiro, mas as outras continuam
            // disponíveis — útil pra montar um JOIN novo, por exemplo.
            const sortPrefix = isReferenced ? '0' : '1';

            suggestions.push({
              label: table.name,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: `\`${table.name}\``,
              detail: 'Table',
              range,
              sortText: `${sortPrefix}_${table.name}`,
            });

            table.columns.forEach((col) => {
              suggestions.push({
                label: col.name,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: `\`${col.name}\``,
                detail: isReferenced ? `${col.type} — ${table.name}` : `${col.type}`,
                range,
                sortText: `${sortPrefix}_${col.name}`,
              });
            });
          });

          schema.views.forEach((view) => {
            suggestions.push({
              label: view.name,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: `\`${view.name}\``,
              detail: 'View',
              range,
              sortText: `1_${view.name}`,
            });
          });
        }

        return { suggestions };
      },
    });

    // Executar via Ctrl+Enter (mesmo com o foco aqui dentro) é tratado
    // pelo handler global em SqlWorkbench.tsx, que lê a seleção atual
    // deste editor através do registro compartilhado (`getSelectedSql`)
    // — mantido num só lugar pra não duplicar a lógica de "roda só o
    // trecho selecionado, senão roda tudo".
  };

  const handleChange: OnChange = useCallback((value) => {
    dispatch({
      type: 'UPDATE_TAB',
      payload: {
        id: tabId,
        updates: { sql: value || '', isDirty: true },
      },
    });
  }, [tabId, dispatch]);

  return (
    <div className="h-full">
      <Editor
        height="100%"
        language="sql"
        theme="datamat-sql"
        value={sql}
        onChange={handleChange}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize,
          fontFamily: 'var(--font-geist-mono), Consolas, monospace',
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 8 },
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
      />
    </div>
  );
}
