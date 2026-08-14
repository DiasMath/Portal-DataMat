'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useStudio } from '../../store/StudioContext';
import {
  Eye, EyeOff, Lock, Unlock, GripVertical, Layers, PanelRightClose, ArrowUp, ArrowDown,
  BarChart3, TrendingUp, AreaChart, PieChart, Circle, ScatterChart, Table, Hash, CreditCard,
  Gauge, TreePine, TrendingDown, Combine, Radar, Filter, Activity, Grid3X3, Target, Sun,
  GitBranch, Cloud, Box, BarChart2, Disc, CircleDot, Search, X
} from 'lucide-react';

const VISUAL_ICON_MAP: Record<string, React.ReactNode> = {
  bar: <BarChart3 size={12} />,
  line: <TrendingUp size={12} />,
  area: <AreaChart size={12} />,
  pie: <PieChart size={12} />,
  donut: <Circle size={12} />,
  scatter: <ScatterChart size={12} />,
  table: <Table size={12} />,
  kpi: <Hash size={12} />,
  card: <CreditCard size={12} />,
  gauge: <Gauge size={12} />,
  treemap: <TreePine size={12} />,
  waterfall: <TrendingDown size={12} />,
  combo: <Combine size={12} />,
  radar: <Radar size={12} />,
  funnel: <Filter size={12} />,
  ribbon: <Activity size={12} />,
  matrix: <Grid3X3 size={12} />,
  bullet: <Target size={12} />,
  sunburst: <Sun size={12} />,
  sankey: <GitBranch size={12} />,
  wordcloud: <Cloud size={12} />,
  boxplot: <Box size={12} />,
  histogram: <BarChart2 size={12} />,
  dotplot: <Disc size={12} />,
  lollipop: <CircleDot size={12} />,
};

export function SelectionPane() {
  const { state, dispatch } = useStudio();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showTextBoxes, setShowTextBoxes] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const activePage = state.pages.find(p => p.id === state.activePageId);
  const visuals = activePage?.visuals || [];
  const sortedVisuals = [...visuals].sort((a, b) => b.zIndex - a.zIndex);
  const sortedTextBoxes = [...state.textBoxes].sort((a, b) => b.zIndex - a.zIndex);

  const filteredVisuals = searchQuery
    ? sortedVisuals.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : sortedVisuals;

  const filteredTextBoxes = searchQuery
    ? sortedTextBoxes.filter(tb => tb.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : sortedTextBoxes;

  const handleRename = (id: string) => {
    if (editValue.trim()) {
      dispatch({ type: 'UPDATE_VISUAL', payload: { id, updates: { name: editValue.trim() } } });
    }
    setEditingId(null);
  };

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndex;
    if (fromIndex === null || fromIndex === toIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    dispatch({ type: 'REORDER_VISUALS', payload: { fromIndex, toIndex } });
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dispatch]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-900">
      <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Camadas</span>
        <button
          onClick={() => dispatch({ type: 'COLLAPSE_SELECTION_PANE' })}
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Recolher"
          aria-label="Recolher"
        >
          <PanelRightClose size={14} />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar camada..."
            className="w-full pl-6 pr-6 py-1 text-[10px] bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 text-foreground placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto studio-scrollbar">
        {(filteredVisuals.length === 0 && filteredTextBoxes.length === 0) && (
          <div className="px-3 py-6 text-center">
            <Layers size={24} className="mx-auto text-muted-foreground/40 mb-2" />
            <div className="text-xs text-muted-foreground">
              {searchQuery ? 'Nenhuma camada encontrada' : 'Nenhum visual na pagina'}
            </div>
            <div className="text-[10px] text-muted-foreground/60 mt-1">
              {searchQuery ? 'Tente outro termo' : 'Adicione visuais para comecar'}
            </div>
          </div>
        )}

        {filteredVisuals.map((visual, index) => (
          <div
            key={visual.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-1.5 px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer group
              ${(state.selectedVisualId === visual.id || state.selectedVisualIds.includes(visual.id))
                ? 'bg-amber-50 dark:bg-amber-900/20'
                : dragOverIndex === index
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-t-2 border-t-blue-400'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              }
              ${dragIndex === index ? 'opacity-50' : ''}
            `}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey) {
                dispatch({ type: 'SELECT_VISUAL_MULTI', payload: visual.id });
              } else {
                dispatch({ type: 'SELECT_VISUAL', payload: visual.id });
              }
            }}
          >
            <GripVertical size={12} className="text-neutral-300 dark:text-neutral-600 shrink-0 cursor-grab" />

            <div className="w-4 h-4 flex items-center justify-center shrink-0 text-amber-500" title={visual.name}>
              {VISUAL_ICON_MAP[visual.type] || <BarChart3 size={12} />}
            </div>

            <div className="flex-1 min-w-0">
              {editingId === visual.id ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleRename(visual.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(visual.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="w-full bg-transparent text-xs text-foreground outline-none border-b border-amber-500"
                  autoFocus
                  aria-label="Renomear visual"
                />
              ) : (
                <div className="flex items-center gap-1">
                  <span
                    className="text-xs text-foreground truncate"
                    onDoubleClick={() => {
                      setEditingId(visual.id);
                      setEditValue(visual.name);
                    }}
                  >
                    {visual.name}
                  </span>
                  {visual.groupId && (
                    <span title="Agrupado"><Layers size={10} className="text-blue-400 shrink-0" /></span>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'FOCUS_VISUAL', payload: visual.id });
              }}
              className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors opacity-0 group-hover:opacity-100"
              title="Isolar (Focus mode)"
              aria-label="Isolar"
            >
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'BRING_VISUAL_TO_FRONT', payload: visual.id });
              }}
              className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors opacity-0 group-hover:opacity-100"
              title="Trazer para frente"
              aria-label="Trazer para frente"
            >
              <ArrowUp size={10} className="text-muted-foreground" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'SEND_VISUAL_TO_BACK', payload: visual.id });
              }}
              className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors opacity-0 group-hover:opacity-100"
              title="Enviar para trás"
              aria-label="Enviar para trás"
            >
              <ArrowDown size={10} className="text-muted-foreground" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'TOGGLE_VISUAL_HIDDEN', payload: visual.id });
              }}
              className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              title={visual.hidden ? 'Mostrar' : 'Ocultar'}
              aria-label={visual.hidden ? 'Mostrar' : 'Ocultar'}
            >
              {visual.hidden ? (
                <EyeOff size={12} className="text-muted-foreground" />
              ) : (
                <Eye size={12} className="text-muted-foreground" />
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'TOGGLE_VISUAL_LOCK', payload: visual.id });
              }}
              className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              title={visual.locked ? 'Desbloquear' : 'Bloquear'}
              aria-label={visual.locked ? 'Desbloquear' : 'Bloquear'}
            >
              {visual.locked ? (
                <Lock size={12} className="text-amber-500" />
              ) : (
                <Unlock size={12} className="text-muted-foreground" />
              )}
            </button>
          </div>
        ))}

        {filteredTextBoxes.length > 0 && (
          <div className="border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setShowTextBoxes(!showTextBoxes)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
              <span className="text-[10px]">{showTextBoxes ? '▼' : '▶'}</span>
              <span>TextBoxes ({filteredTextBoxes.length})</span>
            </button>
            {showTextBoxes && filteredTextBoxes.map((textBox) => (
              <div
                key={textBox.id}
                className={`flex items-center gap-1.5 px-2 py-1.5 pl-6 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer group
                  ${state.selectedTextBoxId === textBox.id
                    ? 'bg-amber-50 dark:bg-amber-900/20'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }
                `}
                onClick={() => dispatch({ type: 'SELECT_TEXT_BOX', payload: textBox.id })}
              >
                <div className="w-4 h-4 flex items-center justify-center shrink-0 text-muted-foreground">
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs text-foreground truncate">
                    {textBox.text.slice(0, 20) || 'TextBox'}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'BRING_TEXT_BOX_TO_FRONT', payload: textBox.id });
                  }}
                  className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors opacity-0 group-hover:opacity-100"
                  title="Trazer para frente"
                  aria-label="Trazer para frente"
                >
                  <ArrowUp size={10} className="text-muted-foreground" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'SEND_TEXT_BOX_TO_BACK', payload: textBox.id });
                  }}
                  className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors opacity-0 group-hover:opacity-100"
                  title="Enviar para trás"
                  aria-label="Enviar para trás"
                >
                  <ArrowDown size={10} className="text-muted-foreground" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'REMOVE_TEXT_BOX', payload: textBox.id });
                  }}
                  className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors opacity-0 group-hover:opacity-100 text-red-500"
                  title="Remover"
                  aria-label="Remover"
                >
                  <span className="text-xs">✕</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
