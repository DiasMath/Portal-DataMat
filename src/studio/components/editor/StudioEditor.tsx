'use client';

import React, { useEffect, useRef } from 'react';
import { DndContext, DragOverlay, closestCenter, pointerWithin, getFirstCollision, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, CollisionDetection } from '@dnd-kit/core';
import { useStudio } from '../../store/StudioContext';
import { useStudioKeyboard } from '../../hooks/useStudioKeyboard';
import { useStudioDnd } from '../../hooks/useStudioDnd';
import { RibbonToolbar } from '../toolbar/RibbonToolbar';
import { MeasureEditor } from '../toolbar/MeasureEditor';
import { CalculatedColumnEditor } from '../toolbar/CalculatedColumnEditor';
import { CalculatedTableEditor } from '../toolbar/CalculatedTableEditor';
import { IconSidebar } from '../sidebar/IconSidebar';
import { DataPanel } from '../data-panel/DataPanel';
import { PropertiesPanel } from '../properties-panel/PropertiesPanel';
import { FiltersPanel } from '../filters-panel/FiltersPanel';
import { Canvas } from '../canvas/Canvas';
import { ModelView } from '../model-view/ModelView';
import { ModelViewTabs } from '../model-view/ModelViewTabs';
import { SqlRunner } from '../sql-runner/SqlRunner';
import { DataView } from '../data-view/DataView';
import { SelectionPane } from '../selection-pane/SelectionPane';
import { BottomBar } from '../shared/BottomBar';
import { PanelResizer } from '../shared/PanelResizer';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { PanelRightOpen } from 'lucide-react';
import type { BucketField, VisualBuckets } from '../../types/visuals';
import { BUCKET_FIELD_RULES } from '../../types/visuals';

interface CollapsedStripProps {
  label: string;
  onExpand: () => void;
}

function CollapsedStrip({ label, onExpand }: CollapsedStripProps) {
  return (
    <button
      onClick={onExpand}
      className="w-10 shrink-0 h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-start gap-1 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group"
      title={`Expandir ${label}`}
    >
      <PanelRightOpen size={14} className="text-muted-foreground group-hover:text-amber-500 transition-colors" />
      <span className="text-[16px] text-muted-foreground group-hover:text-amber-500 transition-colors font-medium leading-tight writing-vertical select-none">
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

  // Refs for stable keyboard handler
  const stateRef = useRef(state);
  stateRef.current = state;
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  useStudioKeyboard(stateRef, dispatchRef);
  const { handleDragStart, handleDragEnd } = useStudioDnd({ state, dispatch, setActiveDragData });

  // Auto-collapse panels on smaller screens
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        if (state.propertiesPanelVisible && !state.propertiesPanelCollapsed) {
          dispatch({ type: 'COLLAPSE_PROPERTIES_PANEL' });
        }
        if (state.filtersPanelVisible && !state.filtersPanelCollapsed) {
          dispatch({ type: 'COLLAPSE_FILTERS_PANEL' });
        }
        if (state.dataPanelVisible && !state.dataPanelCollapsed) {
          dispatch({ type: 'COLLAPSE_DATA_PANEL' });
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const collisionDetection: CollisionDetection = (args) => {
    const pointerHits = pointerWithin(args);
    const first = getFirstCollision(pointerHits);
    if (first) return [first];
    const dragType = activeDragData?.type;
    if (dragType === 'field' || dragType === 'measure') return [];
    return closestCenter(args);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.isDirty]);

  const selectedIds = state.selectedVisualIds.length > 0
    ? state.selectedVisualIds
    : (state.selectedVisualId ? [state.selectedVisualId] : []);

  const renderMainView = () => {
    switch (state.activeView) {
      case 'model':
        return (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ErrorBoundary>
              <ModelView />
            </ErrorBoundary>
            <ModelViewTabs />
          </div>
        );
      case 'sql':
        return (
          <ErrorBoundary>
            <SqlRunner />
          </ErrorBoundary>
        );
      case 'data':
        return (
          <ErrorBoundary>
            <DataView />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary>
            <Canvas />
          </ErrorBoundary>
        );
    }
  };

  const renderSelectionPane = () => {
    if (state.activeView !== 'editor') return null;
    if (!state.selectionPaneVisible) return null;
    if (state.selectionPaneCollapsed) {
      return (
        <CollapsedStrip
          label="Camadas"
          onExpand={() => dispatch({ type: 'EXPAND_SELECTION_PANE' })}
        />
      );
    }
    return (
      <div className="w-56 shrink-0 overflow-hidden border-l border-neutral-200 dark:border-neutral-700">
        <SelectionPane />
      </div>
    );
  };

  const renderFiltersPanel = () => {
    if (state.activeView !== 'editor' || !state.filtersPanelVisible) return null;
    if (state.filtersPanelCollapsed) {
      return (
        <CollapsedStrip
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
          label="Visualizações"
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
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full overflow-hidden relative studio-editor">
        <div className="relative shrink-0">
          <RibbonToolbar />
          {state.measureEditorOpen && (
            <div className="absolute left-0 right-0 top-full z-50 max-h-[calc(100vh-180px)] min-h-[220px]">
              <MeasureEditor />
            </div>
          )}
          {state.calculatedColumnEditorOpen && (
            <div className="absolute left-0 right-0 top-full z-50 max-h-[calc(100vh-180px)] min-h-[220px]">
              <CalculatedColumnEditor />
            </div>
          )}
          {state.calculatedTableEditorOpen && (
            <div className="absolute left-0 right-0 top-full z-50 max-h-[calc(100vh-180px)] min-h-[220px]">
              <CalculatedTableEditor />
            </div>
          )}
        </div>

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
        {activeDragData?.type === 'measure' && (
          <div className="bg-white dark:bg-neutral-800 px-3 py-1.5 rounded-md shadow-lg border border-amber-500 text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <span className="text-amber-500">fx</span>
            {String(activeDragData.label)}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
