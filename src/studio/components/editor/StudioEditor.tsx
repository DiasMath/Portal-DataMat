'use client';

import React, { useEffect } from 'react';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useStudio } from '../../store/StudioContext';
import { RibbonToolbar } from '../toolbar/RibbonToolbar';
import { IconSidebar } from '../sidebar/IconSidebar';
import { DataPanel } from '../data-panel/DataPanel';
import { PropertiesPanel } from '../properties-panel/PropertiesPanel';
import { FiltersPanel } from '../filters-panel/FiltersPanel';
import { Canvas } from '../canvas/Canvas';
import { ModelView } from '../model-view/ModelView';
import { SqlRunner } from '../sql-runner/SqlRunner';
import { DataView } from '../data-view/DataView';
import { SelectionPane } from '../selection-pane/SelectionPane';
import { BottomBar } from '../shared/BottomBar';
import { PanelResizer } from '../shared/PanelResizer';
import { Database, BarChart3, Filter, Layers } from 'lucide-react';
import type { BucketField, VisualBuckets } from '../../types/visuals';

interface CollapsedStripProps {
  icon: React.ReactNode;
  label: string;
  onExpand: () => void;
}

function CollapsedStrip({ icon, label, onExpand }: CollapsedStripProps) {
  return (
    <button
      onClick={onExpand}
      className="w-10 shrink-0 h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group"
      title={`Expandir ${label}`}
    >
      <div className="text-muted-foreground group-hover:text-amber-500 transition-colors">
        {icon}
      </div>
      <span className="text-[8px] text-muted-foreground group-hover:text-amber-500 transition-colors writing-vertical font-medium">
        {label}
      </span>
    </button>
  );
}

interface StudioEditorProps {
  dashboardId?: string;
}

export function StudioEditor({ dashboardId }: StudioEditorProps) {
  const { state, dispatch } = useStudio();
  const [activeDragData, setActiveDragData] = React.useState<Record<string, unknown> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const selectedIds = state.selectedVisualIds.length > 0
    ? state.selectedVisualIds
    : (state.selectedVisualId ? [state.selectedVisualId] : []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.mode !== 'editor') return;

      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
      if (isInput) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          dispatch({ type: 'REMOVE_SELECTED_VISUALS' });
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedIds.length > 0) {
          dispatch({ type: 'DUPLICATE_SELECTED_VISUALS' });
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (state.selectedVisualId) {
          const page = state.pages.find(p => p.id === state.activePageId);
          const visual = page?.visuals.find(v => v.id === state.selectedVisualId);
          if (visual) {
            dispatch({ type: 'SET_CLIPBOARD', payload: visual });
          }
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        if (state.selectedVisualId) {
          const page = state.pages.find(p => p.id === state.activePageId);
          const visual = page?.visuals.find(v => v.id === state.selectedVisualId);
          if (visual) {
            dispatch({ type: 'SET_CLIPBOARD', payload: visual });
            dispatch({ type: 'REMOVE_SELECTED_VISUALS' });
          }
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        dispatch({ type: 'PASTE_VISUAL' });
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        dispatch({ type: 'SELECT_ALL_VISUALS' });
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
      }

      if (selectedIds.length > 0) {
        const nudgeAmount = e.shiftKey ? 10 : 1;
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            selectedIds.forEach(id => dispatch({ type: 'NUDGE_VISUAL', payload: { id, dx: 0, dy: -nudgeAmount } }));
            break;
          case 'ArrowDown':
            e.preventDefault();
            selectedIds.forEach(id => dispatch({ type: 'NUDGE_VISUAL', payload: { id, dx: 0, dy: nudgeAmount } }));
            break;
          case 'ArrowLeft':
            e.preventDefault();
            selectedIds.forEach(id => dispatch({ type: 'NUDGE_VISUAL', payload: { id, dx: -nudgeAmount, dy: 0 } }));
            break;
          case 'ArrowRight':
            e.preventDefault();
            selectedIds.forEach(id => dispatch({ type: 'NUDGE_VISUAL', payload: { id, dx: nudgeAmount, dy: 0 } }));
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.mode, state.selectedVisualId, selectedIds, dispatch, state.pages, state.activePageId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragData(event.active.data.current as Record<string, unknown> | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragData(null);
    const { active, over } = event;

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    if (activeData.type === 'bucket-field' && overData.type === 'bucket') {
      const field: BucketField = {
        tableName: activeData.tableName,
        fieldName: activeData.fieldName,
        aggregation: activeData.aggregation || 'NONE',
      };

      if (activeData.sourceVisualId === overData.visualId && activeData.sourceBucket === overData.bucketKey) {
        return;
      }

      if (activeData.sourceVisualId && activeData.sourceBucket !== undefined) {
        dispatch({
          type: 'REMOVE_BUCKET_FIELD',
          payload: {
            visualId: activeData.sourceVisualId,
            bucket: activeData.sourceBucket as keyof VisualBuckets,
            index: activeData.sourceIndex,
          },
        });
      }

      dispatch({
        type: 'SET_BUCKET_FIELD',
        payload: {
          visualId: overData.visualId,
          bucket: overData.bucketKey,
          field,
        },
      });
      return;
    }

    if (activeData.type === 'field' && overData.type === 'bucket') {
      const field: BucketField = {
        tableName: activeData.tableName,
        fieldName: activeData.fieldName,
        aggregation: activeData.isAggregatable ? 'SUM' : 'NONE',
      };

      dispatch({
        type: 'SET_BUCKET_FIELD',
        payload: {
          visualId: overData.visualId,
          bucket: overData.bucketKey,
          field,
        },
      });
    }
  };

  const renderMainView = () => {
    switch (state.activeView) {
      case 'model':
        return <ModelView />;
      case 'sql':
        return <SqlRunner />;
      case 'data':
        return <DataView />;
      default:
        return <Canvas />;
    }
  };

  const renderSelectionPane = () => {
    if (state.activeView !== 'editor') return null;
    if (state.selectionPaneVisible) {
      return (
        <div className="w-56 shrink-0 overflow-hidden border-l border-neutral-200 dark:border-neutral-700">
          <SelectionPane />
        </div>
      );
    }
    return null;
  };

  const renderFiltersPanel = () => {
    if (state.activeView !== 'editor' || !state.filtersPanelVisible) return null;
    if (state.filtersPanelCollapsed) {
      return (
        <CollapsedStrip
          icon={<Filter size={18} />}
          label="Filtros"
          onExpand={() => dispatch({ type: 'EXPAND_FILTERS_PANEL' })}
        />
      );
    }
    return (
      <>
        <PanelResizer
          direction="left"
          currentSize={state.filtersPanelWidth}
          onResize={(size) => dispatch({ type: 'SET_FILTERS_PANEL_WIDTH', payload: size })}
        />
        <div style={{ width: state.filtersPanelWidth }} className="shrink-0 overflow-hidden">
          <FiltersPanel />
        </div>
      </>
    );
  };

  const renderPropertiesPanel = () => {
    if (state.activeView !== 'editor' || !state.propertiesPanelVisible) return null;
    if (state.propertiesPanelCollapsed) {
      return (
        <CollapsedStrip
          icon={<BarChart3 size={18} />}
          label="Propriedades"
          onExpand={() => dispatch({ type: 'EXPAND_PROPERTIES_PANEL' })}
        />
      );
    }
    return (
      <>
        <PanelResizer
          direction="left"
          currentSize={state.propertiesPanelWidth}
          onResize={(size) => dispatch({ type: 'SET_PROPERTIES_PANEL_WIDTH', payload: size })}
        />
        <div style={{ width: state.propertiesPanelWidth }} className="shrink-0 overflow-hidden">
          <PropertiesPanel />
        </div>
      </>
    );
  };

  const renderDataPanel = () => {
    if (state.activeView !== 'editor' || !state.dataPanelVisible) return null;
    if (state.dataPanelCollapsed) {
      return (
        <CollapsedStrip
          icon={<Database size={18} />}
          label="Dados"
          onExpand={() => dispatch({ type: 'EXPAND_DATA_PANEL' })}
        />
      );
    }
    return (
      <>
        <PanelResizer
          direction="left"
          currentSize={state.dataPanelWidth}
          onResize={(size) => dispatch({ type: 'SET_DATA_PANEL_WIDTH', payload: size })}
        />
        <div style={{ width: state.dataPanelWidth }} className="shrink-0 overflow-hidden">
          <DataPanel />
        </div>
      </>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <RibbonToolbar />

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <IconSidebar />

          {renderMainView()}

          {renderSelectionPane()}
          {renderFiltersPanel()}
          {renderPropertiesPanel()}
          {renderDataPanel()}
        </div>

        {state.activeView === 'editor' && <BottomBar />}
      </div>

      <DragOverlay>
        {activeDragData?.type === 'field' && (
          <div className="bg-white dark:bg-neutral-800 px-3 py-1.5 rounded-md shadow-lg border border-amber-300 text-xs font-medium text-amber-700 dark:text-amber-300">
            {String(activeDragData.label)}
          </div>
        )}
        {activeDragData?.type === 'bucket-field' && (
          <div className="bg-white dark:bg-neutral-800 px-3 py-1.5 rounded-md shadow-lg border border-amber-300 text-xs font-medium text-amber-700 dark:text-amber-300">
            {String(activeDragData.label)}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
