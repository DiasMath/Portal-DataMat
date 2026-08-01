'use client';

import React, { useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import { ChartTypePicker } from './ChartTypePicker';
import { Save, Grid3X3, ZoomIn, ZoomOut, Plus, Undo2, Redo2, RefreshCw, Send, Calculator } from 'lucide-react';

export function EditorToolbar() {
  const { state, dispatch, canUndo, canRedo } = useStudio();
  const [showChartPicker, setShowChartPicker] = useState(false);

  const activePage = state.pages.find(p => p.id === state.activePageId);

  return (
    <div className="h-10 flex items-center gap-1 px-3 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
      <div className="flex items-center gap-1 mr-3">
        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 font-[family-name:var(--font-orbitron)]">
          STUDIO
        </span>
        <span className="text-[10px] text-muted-foreground bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
          Beta
        </span>
      </div>

      <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />

      <div className="relative">
        <button
          onClick={() => setShowChartPicker(!showChartPicker)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
        >
          <Plus size={14} />
          Adicionar Visual
        </button>
        {showChartPicker && (
          <ChartTypePicker
            onSelect={(type) => {
              dispatch({ type: 'ADD_VISUAL', payload: { type, x: 50, y: 50 } });
              setShowChartPicker(false);
            }}
            onClose={() => setShowChartPicker(false)}
          />
        )}
      </div>

      <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={!canUndo}
          className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Desfazer (Ctrl+Z)"
        >
          <Undo2 size={14} className="text-muted-foreground" />
        </button>
        <button
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={!canRedo}
          className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Refazer (Ctrl+Y)"
        >
          <Redo2 size={14} className="text-muted-foreground" />
        </button>
      </div>

      <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />

      <button
        onClick={() => dispatch({ type: 'TOGGLE_GRID' })}
        className={`p-1.5 rounded transition-colors ${state.showGrid ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
        title="Mostrar grade"
      >
        <Grid3X3 size={14} className="text-muted-foreground" />
      </button>

      <div className="flex items-center gap-1 ml-1">
        <button
          onClick={() => dispatch({ type: 'SET_CANVAS_ZOOM', payload: state.canvasZoom - 0.1 })}
          className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Zoom out"
        >
          <ZoomOut size={14} className="text-muted-foreground" />
        </button>
        <span className="text-[10px] text-muted-foreground w-10 text-center">
          {Math.round(state.canvasZoom * 100)}%
        </span>
        <button
          onClick={() => dispatch({ type: 'SET_CANVAS_ZOOM', payload: state.canvasZoom + 0.1 })}
          className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Zoom in"
        >
          <ZoomIn size={14} className="text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {state.isDirty && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400">
            • Não salvo
          </span>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{activePage?.visuals.length || 0} visuais</span>
        </div>

        <button
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          title="Atualizar dados"
        >
          <RefreshCw size={14} />
        </button>

        <button
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          title="Criar Medida (DAX)"
        >
          <Calculator size={14} />
        </button>

        <button
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          title="Publicar"
        >
          <Send size={14} />
        </button>

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
          title="Salvar (Ctrl+S)"
        >
          <Save size={14} />
          Salvar
        </button>
      </div>
    </div>
  );
}
