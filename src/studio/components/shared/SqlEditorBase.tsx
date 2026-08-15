'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { useStudio } from '../../store/StudioContext';
import { registerSqlCompletionProvider } from '../../lib/sql-completion';
import { validateSqlMeasure } from '../../lib/sql-validator';
import { BASE_MONACO_OPTIONS } from '../../lib/monaco-options';
import { UnsavedChangesDialog } from '../shared/UnsavedChangesDialog';
import { SqlStatusBar } from '../shared/SqlStatusBar';
import { SYNTAX_COLORS } from '../../lib/colors';
import type { Monaco } from '@monaco-editor/react';
import type { StudioAction, CloseAction } from '../../types/state';

interface SqlEditorBaseProps {
  isOpen: boolean;
  icon: React.ReactNode;
  title: string;
  expression: string;
  onExpressionChange: (value: string) => void;
  canSave: boolean;
  hasChanges: boolean;
  onSave: () => void;
  onClose: () => void;
  closeAction: CloseAction;
  children?: React.ReactNode;
}

export function SqlEditorBase({
  isOpen,
  icon,
  title,
  expression,
  onExpressionChange,
  canSave,
  hasChanges,
  onSave,
  onClose,
  closeAction,
  children,
}: SqlEditorBaseProps) {
  const { state, dispatch } = useStudio();
  const [validation, setValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<unknown>(null);
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedExpression = useRef('');

  const handleEditorDidMount = useCallback((editor: unknown, monaco: Monaco) => {
    monacoRef.current = editor;
    if (state.dataModel) {
      registerSqlCompletionProvider(monaco, () => state.dataModel!);
    }
    if (editor && typeof editor === 'object' && 'focus' in editor) {
      (editor as { focus: () => void }).focus();
    }
  }, [state.dataModel]);

  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
    };
  }, []);

  const handleExpressionChange = useCallback((value: string | undefined) => {
    const newExpression = value || '';
    onExpressionChange(newExpression);
    if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
    validationTimeoutRef.current = setTimeout(() => {
      debouncedExpression.current = newExpression;
      if (state.dataModel && newExpression.trim()) {
        const result = validateSqlMeasure(newExpression, state.dataModel);
        setValidation({
          valid: result.valid,
          error: result.errors.length > 0 ? result.errors[0].message : undefined,
        });
      } else if (!newExpression.trim()) {
        setValidation({ valid: true });
      }
    }, 500);
  }, [state.dataModel, onExpressionChange]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      setShowConfirmDialog(true);
    } else {
      dispatch({ type: closeAction });
    }
  }, [hasChanges, closeAction, dispatch]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <span style={{ color: SYNTAX_COLORS.keyword }}>{icon}</span>
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={!canSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: canSave ? SYNTAX_COLORS.keyword : '#333',
              color: canSave ? '#000' : '#666',
            }}
          >
            <Save size={14} />
            Salvar
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded hover:bg-[#333] text-neutral-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Form fields slot */}
      {children && (
        <div className="flex gap-4 px-4 py-3 border-b border-[#333]">
          {children}
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 relative" ref={editorRef}>
        <MonacoEditor
          height="100%"
          language="sql"
          value={expression}
          onChange={handleExpressionChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={BASE_MONACO_OPTIONS}
        />
      </div>

      {/* Status bar */}
      <SqlStatusBar valid={validation.valid} error={validation.error} lineCount={expression.split('\n').length} />

      {/* Confirm dialog */}
      <UnsavedChangesDialog
        open={showConfirmDialog}
        onCancel={() => setShowConfirmDialog(false)}
        onDiscard={() => {
          setShowConfirmDialog(false);
          dispatch({ type: closeAction });
        }}
        onSave={() => {
          setShowConfirmDialog(false);
          onSave();
        }}
      />
    </div>
  );
}

import dynamic from 'next/dynamic';
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
