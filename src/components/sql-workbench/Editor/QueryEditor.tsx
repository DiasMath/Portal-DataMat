'use client';

import { useRef, useCallback } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';

interface QueryEditorProps {
  tabId: string;
  sql: string;
  connectionId?: string;
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

export function QueryEditor({ tabId, sql, connectionId }: QueryEditorProps) {
  const { state, dispatch, executeQuery } = useSqlWorkbench();
  const editorRef = useRef<any>(null);
  const sqlRef = useRef(sql);
  sqlRef.current = sql;

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

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

    monaco.languages.registerCompletionItemProvider('sql', {
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

        SQL_KEYWORDS.forEach((kw) => {
          suggestions.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range,
          });
        });

        MYSQL_FUNCTIONS.forEach((fn) => {
          suggestions.push({
            label: fn,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: fn + '($0)',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          });
        });

        if (connectionId && state.schemas[connectionId]) {
          const schema = state.schemas[connectionId];

          schema.tables.forEach((table) => {
            suggestions.push({
              label: table.name,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: `\`${table.name}\``,
              detail: 'Table',
              range,
            });

            table.columns.forEach((col) => {
              suggestions.push({
                label: col.name,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: `\`${col.name}\``,
                detail: `${col.type}`,
                range,
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
            });
          });
        }

        return { suggestions };
      },
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      const model = editor.getModel();
      const sel = editor.getSelection();
      let sqlToRun = '';

      if (sel && !sel.isEmpty()) {
        sqlToRun = model?.getValueInRange(sel) || '';
      } else {
        sqlToRun = model?.getValue() || '';
      }

      if (sqlToRun.trim()) {
        executeQuery(sqlToRun);
      }
    });
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
          fontSize: 14,
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
