'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStudio } from '../../store/StudioContext';
import { X, Calculator } from 'lucide-react';

const FORMAT_OPTIONS = [
  { value: 'general', label: 'Geral' },
  { value: 'number', label: 'Número' },
  { value: 'currency', label: 'Moeda' },
  { value: 'percent', label: 'Percentual' },
  { value: 'date', label: 'Data' },
  { value: 'text', label: 'Texto' },
];

function parseNameExpression(text: string): { name: string; expression: string } | null {
  const eq = text.indexOf('=');
  if (eq <= 0) return null;
  return {
    name: text.slice(0, eq).trim(),
    expression: text.slice(eq + 1).trim(),
  };
}

function useAutoResize(value: string, ref: React.RefObject<HTMLTextAreaElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value, ref]);
}

export function MeasureEditor() {
  const { state, dispatch } = useStudio();
  const editingMeasure = state.editingMeasureId
    ? (state.dataModel?.measures?.find(m => m.id === state.editingMeasureId) ?? null)
    : null;

  const initialText = editingMeasure
    ? `${editingMeasure.name} = ${editingMeasure.expression}`
    : '';

  const [text, setText] = useState(initialText);
  const [format, setFormat] = useState(editingMeasure?.format ?? 'general');
  const [decimalPlaces, setDecimalPlaces] = useState(editingMeasure?.decimalPlaces ?? 2);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useAutoResize(text, textareaRef);

  useEffect(() => {
    if (state.measureEditorOpen) {
      setText(editingMeasure ? `${editingMeasure.name} = ${editingMeasure.expression}` : '');
      setFormat(editingMeasure?.format ?? 'general');
      setDecimalPlaces(editingMeasure?.decimalPlaces ?? 2);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [state.measureEditorOpen, editingMeasure]);

  if (!state.measureEditorOpen) return null;

  const lineNumbers = text.split('\n').map((_, i) => i + 1);
  const parsed = parseNameExpression(text);
  const canSave = !!parsed && !!parsed.name && !!parsed.expression;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = () => {
    const p = parseNameExpression(text);
    if (!p || !p.name || !p.expression) return;
    if (editingMeasure) {
      dispatch({ type: 'UPDATE_MEASURE', payload: { id: editingMeasure.id, name: p.name, expression: p.expression, format, decimalPlaces } });
    } else {
      dispatch({ type: 'ADD_MEASURE', payload: { name: p.name, expression: p.expression, format, decimalPlaces } });
    }
    dispatch({ type: 'CLOSE_MEASURE_EDITOR' });
  };

  return (
    <div className="relative z-50 border-b border-neutral-700 bg-neutral-800/95 backdrop-blur px-3 py-3 space-y-2.5 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-amber-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Calculator size={12} />
          {editingMeasure ? 'Editar medida' : 'Nova medida'}
        </span>
        <div className="flex-1 min-w-0" />
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-muted-foreground">Formato</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="px-2 py-1 text-[11px] bg-neutral-900 border border-neutral-700 rounded focus:outline-none"
          >
            {FORMAT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="text-[10px] text-muted-foreground">Decimais</span>
          <input
            type="number"
            value={decimalPlaces}
            min={0}
            max={8}
            onChange={(e) => setDecimalPlaces(Number(e.target.value))}
            onKeyDown={(e) => e.stopPropagation()}
            className="w-12 px-2 py-1 text-[11px] bg-neutral-900 border border-neutral-700 rounded focus:outline-none"
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
            onClick={() => dispatch({ type: 'CLOSE_MEASURE_EDITOR' })}
            className="p-1.5 rounded hover:bg-neutral-700 text-muted-foreground transition-colors"
            title="Cancelar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-stretch">
        <div className="pr-2 py-1.5 text-right select-none text-neutral-500 tabular-nums bg-transparent">
          {lineNumbers.map((n) => (
            <div key={n} className="leading-5 text-[11px] h-5">{n}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="nome_da_medida = SUM(Tabela[Coluna])"
          rows={1}
          spellCheck={false}
          className="flex-1 resize-none overflow-hidden px-2 py-1 text-xs leading-5 text-amber-200 bg-neutral-900 border border-amber-800 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        Digite <span className="font-mono text-amber-400">nome = expressão</span> · Enter para nova linha · Ctrl+Enter para confirmar
      </p>
    </div>
  );
}