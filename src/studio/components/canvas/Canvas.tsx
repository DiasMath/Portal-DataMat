'use client';

import React, { useRef, useCallback, useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { useStudio } from '../../store/StudioContext';
import { CanvasItem } from './CanvasItem';
import { CanvasTextBox as CanvasTextBoxComponent } from './CanvasTextBox';
import { VisualContextMenu } from './VisualContextMenu';
import { CANVAS_DEFAULTS } from '../../types/canvas';
import { useVisualQuery } from '../../hooks/useVisualQuery';
import { TextBoxResizeHandles } from './TextBoxResizeHandles';
import type { Visual, DataModel } from '../../types/dashboard';

interface SmartGuide {
  type: 'vertical' | 'horizontal';
  position: number;
}

function QuerySync({ visual, dataModel, dispatch }: { visual: Visual; dataModel: DataModel | null; dispatch: React.Dispatch<any> }) {
  const { result, loading, error } = useVisualQuery(visual, dataModel);
  useEffect(() => {
    dispatch({
      type: 'SET_QUERY_RESULT',
      payload: { visualId: visual.id, result: { result, loading, error } },
    });
  }, [visual.id, result, loading, error, dispatch]);
  return null;
}

export function Canvas() {
  const { state, dispatch } = useStudio();
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ visualId: string; x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const spaceHeld = useRef(false);
  const marqueeJustSelected = useRef(false);
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [smartGuides, setSmartGuides] = useState<SmartGuide[]>([]);
  const [draggingVisualId, setDraggingVisualId] = useState<string | null>(null);

  const activePage = state.pages.find(p => p.id === state.activePageId);
  const visuals = activePage?.visuals || [];
  const pageWidth = activePage?.pageWidth || CANVAS_DEFAULTS.DESIGN_WIDTH;
  const pageHeight = activePage?.pageHeight || CANVAS_DEFAULTS.DESIGN_HEIGHT;

  const dataModel = state.dataModel;

  const [initialFitDone, setInitialFitDone] = useState(false);

  useLayoutEffect(() => {
    if (initialFitDone) return;
    const el = scrollRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const fitZoom = Math.min(rect.width / pageWidth, rect.height / pageHeight);
    dispatch({ type: 'SET_CANVAS_ZOOM', payload: fitZoom });
    setInitialFitDone(true);
  }, [dispatch, pageWidth, pageHeight, initialFitDone]);

  // Scroll to selected visual when selection changes
  useEffect(() => {
    if (!state.selectedVisualId || !scrollRef.current) return;
    const page = state.pages.find(p => p.id === state.activePageId);
    if (!page) return;
    const visual = page.visuals.find(v => v.id === state.selectedVisualId);
    if (!visual) return;

    const el = scrollRef.current;
    const rect = el.getBoundingClientRect();
    const zoom = state.canvasZoom;

    // Visual center in canvas coordinates
    const visualCenterX = (visual.x + visual.width / 2) * zoom;
    const visualCenterY = (visual.y + visual.height / 2) * zoom;

    // Viewport center
    const viewportCenterX = el.scrollLeft + rect.width / 2;
    const viewportCenterY = el.scrollTop + rect.height / 2;

    // Calculate scroll offset
    const deltaX = visualCenterX - viewportCenterX;
    const deltaY = visualCenterY - viewportCenterY;

    // Only scroll if visual is outside viewport
    if (Math.abs(deltaX) > rect.width / 4 || Math.abs(deltaY) > rect.height / 4) {
      el.scrollBy({ left: deltaX, top: deltaY, behavior: 'smooth' });
    }
  }, [state.selectedVisualId, state.pages, state.activePageId, state.canvasZoom]);

  const SNAP_THRESHOLD = 5;

  const computeSmartGuides = useCallback((draggedVisualId: string) => {
    const page = state.pages.find(p => p.id === state.activePageId);
    if (!page) return;
    const dragged = page.visuals.find(v => v.id === draggedVisualId);
    if (!dragged) return;

    const guides: SmartGuide[] = [];
    const draggedEdges = {
      left: dragged.x,
      right: dragged.x + dragged.width,
      centerX: dragged.x + dragged.width / 2,
      top: dragged.y,
      bottom: dragged.y + dragged.height,
      centerY: dragged.y + dragged.height / 2,
    };

    for (const v of page.visuals) {
      if (v.id === draggedVisualId) continue;
      const edges = {
        left: v.x,
        right: v.x + v.width,
        centerX: v.x + v.width / 2,
        top: v.y,
        bottom: v.y + v.height,
        centerY: v.y + v.height / 2,
      };

      if (Math.abs(draggedEdges.left - edges.left) < SNAP_THRESHOLD) guides.push({ type: 'vertical', position: edges.left });
      if (Math.abs(draggedEdges.right - edges.right) < SNAP_THRESHOLD) guides.push({ type: 'vertical', position: edges.right });
      if (Math.abs(draggedEdges.centerX - edges.centerX) < SNAP_THRESHOLD) guides.push({ type: 'vertical', position: edges.centerX });
      if (Math.abs(draggedEdges.left - edges.right) < SNAP_THRESHOLD) guides.push({ type: 'vertical', position: edges.right });
      if (Math.abs(draggedEdges.right - edges.left) < SNAP_THRESHOLD) guides.push({ type: 'vertical', position: edges.left });

      if (Math.abs(draggedEdges.top - edges.top) < SNAP_THRESHOLD) guides.push({ type: 'horizontal', position: edges.top });
      if (Math.abs(draggedEdges.bottom - edges.bottom) < SNAP_THRESHOLD) guides.push({ type: 'horizontal', position: edges.bottom });
      if (Math.abs(draggedEdges.centerY - edges.centerY) < SNAP_THRESHOLD) guides.push({ type: 'horizontal', position: edges.centerY });
      if (Math.abs(draggedEdges.top - edges.bottom) < SNAP_THRESHOLD) guides.push({ type: 'horizontal', position: edges.bottom });
      if (Math.abs(draggedEdges.bottom - edges.top) < SNAP_THRESHOLD) guides.push({ type: 'horizontal', position: edges.top });
    }

    setSmartGuides(guides);
  }, [state.pages, state.activePageId]);

  useEffect(() => {
    if (draggingVisualId) {
      computeSmartGuides(draggingVisualId);
    }
  }, [draggingVisualId, computeSmartGuides]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (spaceHeld.current) return;
    if (marqueeJustSelected.current) {
      marqueeJustSelected.current = false;
      return;
    }
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'true') {
      dispatch({ type: 'SELECT_VISUAL', payload: null });
      dispatch({ type: 'SELECT_TEXT_BOX', payload: null });
    }
  }, [dispatch]);

  const handleMarqueeStart = useCallback((e: React.MouseEvent) => {
    if (spaceHeld.current) return;
    if (e.button !== 0) return;
    if (!(e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'true')) return;
    if (e.ctrlKey || e.metaKey) return;

    marqueeJustSelected.current = false;

    const rect = scrollRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0);
    const y = e.clientY - rect.top + (scrollRef.current?.scrollTop || 0);

    setMarquee({ startX: x, startY: y, endX: x, endY: y });
  }, []);

  const handleMarqueeMove = useCallback((e: React.MouseEvent) => {
    if (!marquee) return;
    const rect = scrollRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0);
    const y = e.clientY - rect.top + (scrollRef.current?.scrollTop || 0);

    setMarquee(prev => prev ? { ...prev, endX: x, endY: y } : null);
  }, [marquee]);

  const handleMarqueeEnd = useCallback(() => {
    if (!marquee) return;

    const minX = Math.min(marquee.startX, marquee.endX) / state.canvasZoom;
    const minY = Math.min(marquee.startY, marquee.endY) / state.canvasZoom;
    const maxX = Math.max(marquee.startX, marquee.endX) / state.canvasZoom;
    const maxY = Math.max(marquee.startY, marquee.endY) / state.canvasZoom;

    if (Math.abs(maxX - minX) > 5 || Math.abs(maxY - minY) > 5) {
      const activePage = state.pages.find(p => p.id === state.activePageId);
      if (activePage) {
        const selected = activePage.visuals.filter(v => {
          const vRight = v.x + v.width;
          const vBottom = v.y + v.height;
          return v.x < maxX && vRight > minX && v.y < maxY && vBottom > minY;
        });
        if (selected.length > 0) {
          marqueeJustSelected.current = true;
          dispatch({ type: 'SELECT_VISUAL', payload: selected[0].id });
          for (let i = 1; i < selected.length; i++) {
            dispatch({ type: 'SELECT_VISUAL_MULTI', payload: selected[i].id });
          }
        }
      }
    }

    setMarquee(null);
  }, [marquee, state.canvasZoom, state.pages, state.activePageId, dispatch]);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      dispatch({ type: 'SET_CANVAS_ZOOM', payload: state.canvasZoom + delta });
    }
  }, [dispatch, state.canvasZoom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (spaceHeld.current && e.button === 0)) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: scrollRef.current?.scrollLeft || 0,
        scrollTop: scrollRef.current?.scrollTop || 0,
      };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !scrollRef.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    scrollRef.current.scrollLeft = panStart.current.scrollLeft - dx;
    scrollRef.current.scrollTop = panStart.current.scrollTop - dy;
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.measureEditorOpen || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        spaceHeld.current = true;
      }

      // Delete selected TextBox
      if ((e.code === 'Delete' || e.code === 'Backspace') && state.selectedTextBoxId) {
        e.preventDefault();
        dispatch({ type: 'REMOVE_TEXT_BOX', payload: state.selectedTextBoxId });
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeld.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.measureEditorOpen, state.selectedTextBoxId, dispatch]);

  const hasAnyLocked = visuals.some(v => v.locked);

  const handleDragOverCanvas = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDropOnCanvas = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const visualType = e.dataTransfer.getData('studio/visual-type');
    if (!visualType) return;

    const el = scrollRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const zoom = state.canvasZoom;
    const x = (e.clientX - rect.left + el.scrollLeft) / zoom;
    const y = (e.clientY - rect.top + el.scrollTop) / zoom;

    dispatch({ type: 'ADD_VISUAL', payload: { type: visualType as any, x, y } });
  }, [state.canvasZoom, dispatch]);

  return (
    <div
      ref={canvasRef}
      className="flex-1 overflow-hidden bg-neutral-900 relative"
      onClick={handleCanvasClick}
      onMouseDown={(e) => { handleMouseDown(e); handleMarqueeStart(e); }}
      onMouseMove={(e) => { handleMouseMove(e); handleMarqueeMove(e); }}
      onMouseUp={() => { handleMouseUp(); handleMarqueeEnd(); }}
      onMouseLeave={() => { handleMouseUp(); handleMarqueeEnd(); }}
      onContextMenu={(e) => e.preventDefault()}
      onDragOver={handleDragOverCanvas}
      onDrop={handleDropOnCanvas}
    >
      <div
        ref={scrollRef}
        data-canvas-fit
        className="w-full h-full overflow-auto studio-scrollbar"
        style={{ cursor: isPanning ? 'grabbing' : spaceHeld.current ? 'grab' : undefined }}
      >
            <div className="flex items-start justify-start" style={{ minHeight: '100%', minWidth: '100%' }}>
              <div
                data-canvas="true"
                className="relative shadow-2xl shrink-0"
                style={{
                  width: `${pageWidth * state.canvasZoom}px`,
                  height: `${pageHeight * state.canvasZoom}px`,
                  background: activePage?.background || CANVAS_DEFAULTS.BACKGROUND,
                  backgroundSize: 'auto',
                }}
              >
                {state.showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${CANVAS_DEFAULTS.GRID_COLOR} 1px, transparent 1px), linear-gradient(to bottom, ${CANVAS_DEFAULTS.GRID_COLOR} 1px, transparent 1px)`,
                      backgroundSize: `${CANVAS_DEFAULTS.SNAP_SIZE * state.canvasZoom}px ${CANVAS_DEFAULTS.SNAP_SIZE * state.canvasZoom}px`,
                    }}
                  />
                )}
                {activePage?.backgroundImage && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `url(${activePage.backgroundImage})`,
                      backgroundSize: activePage.backgroundImagePosition || 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: activePage.backgroundImagePosition === 'stretch' ? 'no-repeat' : undefined,
                      opacity: 0.15,
                    }}
                  />
                )}
                {visuals.filter(v => {
                  const b = v.buckets;
                  return ((b.xAxis?.length || 0) + (b.legend?.length || 0) + (b.values?.length || 0) + (b.yAxis?.length || 0) + (b.details?.length || 0)) > 0;
                }).map(visual => (
                  <QuerySync key={`qs-${visual.id}`} visual={visual} dataModel={dataModel} dispatch={dispatch} />
                ))}

                {visuals.map(visual => {
                  if (state.focusedVisualId && state.focusedVisualId !== visual.id) return null;

                  const isCrossFilterSource = state.crossFilter?.sourceVisualId === visual.id;
                  const crossFilterValue = state.crossFilter && !isCrossFilterSource ? state.crossFilter.value : undefined;
                  const drillState = state.drillStates[visual.id];
                  const isFocused = state.focusedVisualId === visual.id;

                  const focusVisual = isFocused ? {
                    x: 0,
                    y: 0,
                    width: pageWidth,
                    height: pageHeight,
                    zIndex: 9999,
                  } : undefined;

                  return (
                    <CanvasItem
                      key={visual.id}
                      visual={focusVisual ? { ...visual, ...focusVisual } : visual}
                      isSelected={state.selectedVisualId === visual.id}
                      isMultiSelected={state.selectedVisualIds.length > 1 && state.selectedVisualIds.includes(visual.id) && state.selectedVisualId !== visual.id}
                      zoom={state.canvasZoom}
                      queryState={state.queryResults[visual.id]}
                      mode={state.mode}
                      pageWidth={pageWidth}
                      pageHeight={pageHeight}
                      showGrid={state.showGrid}
                      onSelect={(e) => {
                        if (e && (e.ctrlKey || e.metaKey)) {
                          dispatch({ type: 'SELECT_VISUAL_MULTI', payload: visual.id });
                        } else {
                          dispatch({ type: 'SELECT_VISUAL', payload: visual.id });
                        }
                      }}
                      onMove={(x, y) => dispatch({ type: 'MOVE_SELECTED_VISUALS', payload: { id: visual.id, x, y } })}
                      onResize={(width, height) => dispatch({ type: 'RESIZE_VISUAL', payload: { id: visual.id, width, height } })}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        const isPartOfSelection = state.selectedVisualIds.includes(visual.id) || state.selectedVisualId === visual.id;
                        if (!isPartOfSelection) {
                          dispatch({ type: 'SELECT_VISUAL', payload: visual.id });
                        }
                        setContextMenu({ visualId: visual.id, x: e.clientX, y: e.clientY });
                      }}
                      onDragStart={() => { setDraggingVisualId(visual.id); }}
                      onDragEnd={() => { setDraggingVisualId(null); setSmartGuides([]); }}
                      crossFilterValue={crossFilterValue}
                      onCrossFilter={(fieldName, value) => {
                        if (state.crossFilter?.sourceVisualId === visual.id) {
                          dispatch({ type: 'CLEAR_CROSS_FILTER' });
                        } else {
                          dispatch({ type: 'SET_CROSS_FILTER', payload: { sourceVisualId: visual.id, fieldName, value } });
                        }
                      }}
                      drillLevel={drillState?.level || 0}
                      onDrillDown={(fieldName, value) => {
                        dispatch({ type: 'DRILL_DOWN', payload: { visualId: visual.id, fieldName, value } });
                      }}
                    />
                  );
                })}

                {/* Render TextBoxes */}
                {state.textBoxes.map(textBox => {
                  const isSelected = state.selectedTextBoxId === textBox.id;
                  return (
                    <div
                      key={textBox.id}
                      className="absolute group"
                      style={{
                        left: textBox.x,
                        top: textBox.y,
                        width: textBox.width,
                        height: textBox.height,
                        zIndex: textBox.zIndex,
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'SELECT_TEXT_BOX', payload: textBox.id });

                        // Start drag
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startPosX = textBox.x;
                        const startPosY = textBox.y;
                        let hasMoved = false;

                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const dx = (moveEvent.clientX - startX) / state.canvasZoom;
                          const dy = (moveEvent.clientY - startY) / state.canvasZoom;
                          if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                            hasMoved = true;
                            dispatch({
                              type: 'MOVE_TEXT_BOX',
                              payload: {
                                id: textBox.id,
                                x: Math.round(startPosX + dx),
                                y: Math.round(startPosY + dy),
                              },
                            });
                          }
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    >
                      <CanvasTextBoxComponent
                        textBox={textBox}
                        isSelected={isSelected}
                        onSelect={() => dispatch({ type: 'SELECT_TEXT_BOX', payload: textBox.id })}
                        onUpdate={(updates) => dispatch({ type: 'UPDATE_TEXT_BOX', payload: { id: textBox.id, updates } })}
                      />

                      {/* Resize handles */}
                      {isSelected && state.mode === 'editor' && (
                        <TextBoxResizeHandles textBox={textBox} canvasZoom={state.canvasZoom} dispatch={dispatch} />
                      )}
                    </div>
                  );
                })}

                {visuals.length === 0 && state.mode === 'editor' && (
                  <div
                    data-canvas="true"
                    className="absolute inset-0 flex items-center justify-center text-neutral-400/50 pointer-events-none"
                  >
                    <div className="text-center">
                      <p className="text-lg mb-2">Canvas vazio</p>
                      <p className="text-sm">Use o ribbon Início → Novo visual para adicionar gráficos</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

      {state.focusedVisualId && (
        <button
          onClick={() => dispatch({ type: 'EXIT_FOCUS_MODE' })}
          className="absolute top-3 left-3 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-md shadow-lg border border-neutral-600 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5m7-7-7 7 7 7" />
          </svg>
          Voltar ao relatório
        </button>
      )}

      {marquee && (
        <div
          className="absolute border border-amber-500 bg-amber-500/10 pointer-events-none z-50"
          style={{
            left: `${Math.min(marquee.startX, marquee.endX)}px`,
            top: `${Math.min(marquee.startY, marquee.endY)}px`,
            width: `${Math.abs(marquee.endX - marquee.startX)}px`,
            height: `${Math.abs(marquee.endY - marquee.startY)}px`,
          }}
        />
      )}

      {smartGuides.map((guide, i) => (
        <div
          key={`guide-${i}`}
          className="absolute pointer-events-none z-40"
          style={guide.type === 'vertical' ? {
            left: `${guide.position * state.canvasZoom}px`,
            top: 0,
            width: '1px',
            height: '100%',
            borderLeft: `1px dashed ${CANVAS_DEFAULTS.SELECTION_COLOR}`,
          } : {
            left: 0,
            top: `${guide.position * state.canvasZoom}px`,
            width: '100%',
            height: '1px',
            borderTop: `1px dashed ${CANVAS_DEFAULTS.SELECTION_COLOR}`,
          }}
        />
      ))}

      {contextMenu && (
        <VisualContextMenu
          visualId={contextMenu.visualId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
