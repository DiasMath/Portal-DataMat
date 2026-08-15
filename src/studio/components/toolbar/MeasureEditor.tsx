'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useStudio } from '../../store/StudioContext';
import { X, Calculator, AlertTriangle } from 'lucide-react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { registerSqlCompletionProvider } from '../../lib/sql-completion';
import { validateSqlMeasure, type SqlValidationResult } from '../../lib/sql-validator';
import { BASE_MONACO_OPTIONS } from '../../lib/monaco-options';
import { UnsavedChangesDialog } from '../shared/UnsavedChangesDialog';

const FORMAT_OPTIONS = [
  { value: 'general', label: 'Geral' },
  { value: 'number', label: 'Número' },
  { value: 'currency', label: 'Moeda' },
  { value: 'percent', label: 'Percentual' },
  { value: 'date', label: 'Data' },
  { value: 'text', label: 'Texto' },
];

const DECIMALS_DISABLED_FORMATS = new Set(['general', 'date', 'text']);

const MONACO_OPTIONS: Monaco.editor.IStandaloneEditorConstructionOptions = {
  ...BASE_MONACO_OPTIONS,
  fontFamily: 'var(--font-geist-mono), Consolas, monospace',
  renderLineHighlight: 'all',
  tabSize: 2,
  padding: { top: 8 },
  scrollbar: {
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  autoClosingBrackets: 'always',
  matchBrackets: 'always',
};

export function MeasureEditor() {
  const { state, dispatch } = useStudio();
  const editingMeasure = state.editingMeasureId
    ? (state.dataModel?.measures?.find(m => m.id === state.editingMeasureId) ?? null)
    : null;

  const [measureName, setMeasureName] = useState('');
  const [expression, setExpression] = useState('');
  const [format, setFormat] = useState(editingMeasure?.format ?? 'general');
  const [decimalPlaces, setDecimalPlaces] = useState(editingMeasure?.decimalPlaces ?? 2);
  const [editorHeight, setEditorHeight] = useState(220);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const heightUpdateRaf = useRef<number>(0);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedExpression, setDebouncedExpression] = useState('');

  useEffect(() => {
    if (state.measureEditorOpen) {
      setMeasureName(editingMeasure?.name ?? '');
      setExpression(editingMeasure?.expression ?? '');
      setDebouncedExpression(editingMeasure?.expression ?? '');
      setFormat(editingMeasure?.format ?? 'general');
      setDecimalPlaces(editingMeasure?.decimalPlaces ?? 2);
      setEditorHeight(220);
    }
  }, [state.measureEditorOpen, editingMeasure]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  const validation = useMemo<SqlValidationResult>(() => {
    if (!debouncedExpression.trim()) return { valid: false, errors: [] };
    return validateSqlMeasure(debouncedExpression, state.dataModel);
  }, [debouncedExpression, state.dataModel]);

  const canSave = !!measureName.trim() && !!expression.trim() && validation.valid;
  const decimalsDisabled = DECIMALS_DISABLED_FORMATS.has(format);
  const isTemporary = editingMeasure ? (editingMeasure.isTemporary ?? false) : state.newMeasureIsTemporary;

  const handleSave = useCallback(() => {
    const name = measureName.trim();
    const expr = expression.trim();
    if (!name || !expr) return;
    const payload = { name, expression: expr, format, decimalPlaces };
    if (editingMeasure) {
      dispatch({ type: 'UPDATE_MEASURE', payload: { id: editingMeasure.id, ...payload } });
    } else {
      dispatch({ type: 'ADD_MEASURE', payload: { ...payload, isTemporary } });
    }
    dispatch({ type: 'CLOSE_MEASURE_EDITOR' });
  }, [measureName, expression, format, decimalPlaces, editingMeasure, isTemporary, dispatch]);

  const handleClose = useCallback(() => {
    // Check if there are unsaved changes
    const hasChanges = measureName.trim() !== (editingMeasure?.name ?? '') ||
                       expression.trim() !== (editingMeasure?.expression ?? '');
    
    if (hasChanges) {
      setShowConfirmDialog(true);
      setPendingClose(true);
    } else {
      dispatch({ type: 'CLOSE_MEASURE_EDITOR' });
    }
  }, [measureName, expression, editingMeasure, dispatch]);

  const handleConfirmClose = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingClose(false);
    dispatch({ type: 'CLOSE_MEASURE_EDITOR' });
  }, [dispatch]);

  const handleCancelClose = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingClose(false);
  }, []);

  const updateEditorHeight = useCallback(() => {
    if (!editorRef.current) return;
    const contentHeight = editorRef.current.getContentHeight();
    const maxAvailable = window.innerHeight - 180;
    const newHeight = Math.min(Math.max(contentHeight + 16, 220), maxAvailable);
    setEditorHeight(newHeight);
  }, []);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
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
    registerSqlCompletionProvider(monaco, () => state.dataModel);
    editor.updateOptions({ theme: 'datamat-sql' });
    editorRef.current = editor;
    editor.focus();

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleSave();
    });

editor.addCommand(monaco.KeyCode.Escape, () => {
      handleClose();
    });

    // Wheel zoom (Ctrl+Wheel) - add listener on editor DOM
    const editorDom = editor.getDomNode();
    if (editorDom) {
      editorDom.addEventListener('wheel', (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -1 : 1;
          const currentSize = editor.getOption(monaco.editor.EditorOption.fontSize);
          const newSize = Math.max(10, Math.min(24, (currentSize as number) + delta));
          editor.updateOptions({ fontSize: newSize });
        }
      }, { passive: false });
    }

    editor.onDidChangeModelContent(() => {
      if (heightUpdateRaf.current) cancelAnimationFrame(heightUpdateRaf.current);
      heightUpdateRaf.current = requestAnimationFrame(updateEditorHeight);
    });

    updateEditorHeight();
  }, [handleSave, handleClose, updateEditorHeight]);

  const handleEditorChange: OnChange = useCallback((value) => {
    setExpression(value || '');
    
    // Debounce validation - only validate after user stops typing
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    validationTimeoutRef.current = setTimeout(() => {
      setDebouncedExpression(value || '');
    }, 500);
  }, []);

  if (!state.measureEditorOpen) return null;

  return (
    <div className={`z-50 border-b bg-neutral-800/95 backdrop-blur shadow-lg flex flex-col ${
      isTemporary ? 'border-violet-500 border-dashed' : 'border-neutral-700'
    }`}>
      <div className="flex items-center gap-2 px-3 py-2 shrink-0">
        <span className={`text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 shrink-0 ${
          isTemporary ? 'text-violet-400' : 'text-amber-500'
        }`}>
          <Calculator size={12} />
          {editingMeasure ? 'Editar medida' : 'Nova medida'}
          {isTemporary && (
            <span className="ml-1 px-1.5 py-0.5 bg-violet-500/20 text-violet-300 rounded text-[9px]">
              TEMP
            </span>
          )}
        </span>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-muted-foreground">Nome</span>
          <input
            type="text"
            value={measureName}
            onChange={(e) => setMeasureName(e.target.value)}
            placeholder="nome_da_medida"
            className="w-40 px-1.5 py-1 text-[11px] bg-neutral-900 border border-neutral-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
          />

          <span className="text-[10px] text-muted-foreground">Formato</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="px-1.5 py-1 text-[11px] bg-neutral-900 border border-neutral-700 rounded focus:outline-none"
          >
            {FORMAT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <span className={`text-[10px] ${decimalsDisabled ? 'text-neutral-600' : 'text-muted-foreground'}`}>Decimais</span>
          <input
            type="number"
            value={decimalPlaces}
            min={0}
            max={8}
            disabled={decimalsDisabled}
            onChange={(e) => setDecimalPlaces(Number(e.target.value))}
            className="w-12 px-1.5 py-1 text-[11px] bg-neutral-900 border border-neutral-700 rounded focus:outline-none disabled:opacity-40"
          />

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="p-1.5 rounded bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 transition-colors"
            title="Confirmar (Ctrl+Enter)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded hover:bg-neutral-700 text-muted-foreground transition-colors"
            title="Cancelar (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="px-3 pb-3" style={{ height: `${editorHeight}px` }}>
        <div className="h-full rounded-md border border-neutral-700 bg-neutral-900 focus-within:ring-1 focus-within:ring-amber-500">
          <Editor
            height="100%"
            language="sql"
            theme="datamat-sql"
            value={expression}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            options={MONACO_OPTIONS}
          />
        </div>
      </div>

      {validation.errors.length > 0 && (
        <div className="px-3 pb-2 space-y-1">
          {validation.errors.map((err, i) => (
            <div
              key={i}
              className={`flex items-start gap-1.5 text-[10px] px-2 py-1 rounded ${
                err.severity === 'error'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              <AlertTriangle size={10} className="shrink-0 mt-0.5" />
              <div>
                <span>{err.message}</span>
                {err.suggestion && (
                  <span className="text-neutral-500 ml-1">→ {err.suggestion}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showConfirmDialog && (
        <UnsavedChangesDialog
          open={showConfirmDialog}
          title="Salvar alterações?"
          message="Você tem alterações não salvas. Deseja salvar antes de fechar?"
          onCancel={handleCancelClose}
          onDiscard={handleConfirmClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
}