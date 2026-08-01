'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useStudio } from '../../store/StudioContext';
import { CanvasItem } from './CanvasItem';
import { VisualContextMenu } from './VisualContextMenu';
import { CANVAS_DEFAULTS } from '../../types/canvas';

export function Canvas() {
  const { state, dispatch } = useStudio();
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [contextMenu, setContextMenu] = useState<{ visualId: string; x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const spaceHeld = useRef(false);
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);

  const activePage = state.pages.find(p => p.id === state.activePageId);
  const visuals = activePage?.visuals || [];
  const pageWidth = activePage?.pageWidth || CANVAS_DEFAULTS.DESIGN_WIDTH;
  const pageHeight = activePage?.pageHeight || CANVAS_DEFAULTS.DESIGN_HEIGHT;

  useEffect(() => {
    if (!canvasRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return;
    const availW = containerSize.width;
    const availH = containerSize.height;
    const fitZoom = Math.min(availW / pageWidth, availH / pageHeight, 1);
    dispatch({ type: 'SET_CANVAS_ZOOM', payload: fitZoom });
  }, [containerSize, pageWidth, pageHeight, dispatch]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (spaceHeld.current) return;
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'true') {
      dispatch({ type: 'SELECT_VISUAL', payload: null });
    }
  }, [dispatch]);

  const handleMarqueeStart = useCallback((e: React.MouseEvent) => {
    if (spaceHeld.current) return;
    if (e.button !== 0) return;
    if (!(e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'true')) return;
    if (e.ctrlKey || e.metaKey) return;

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
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        spaceHeld.current = true;
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
  }, []);

  const hasAnyLocked = visuals.some(v => v.locked);

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
    >
      <div
        ref={scrollRef}
        data-canvas-fit
        className="w-full h-full overflow-auto studio-scrollbar"
        style={{ cursor: isPanning ? 'grabbing' : spaceHeld.current ? 'grab' : undefined }}
      >
        <div className="flex items-center justify-center" style={{ minHeight: '100%', minWidth: '100%' }}>
          <div
            data-canvas="true"
            className="relative shadow-2xl shrink-0"
            style={{
              width: `${pageWidth * state.canvasZoom}px`,
              height: `${pageHeight * state.canvasZoom}px`,
              background: state.showGrid
                ? `
                  linear-gradient(to right, ${CANVAS_DEFAULTS.GRID_COLOR} 1px, transparent 1px),
                  linear-gradient(to bottom, ${CANVAS_DEFAULTS.GRID_COLOR} 1px, transparent 1px)
                `
                : activePage?.background || '#ffffff',
              backgroundSize: state.showGrid
                ? `${CANVAS_DEFAULTS.SNAP_SIZE * state.canvasZoom}px ${CANVAS_DEFAULTS.SNAP_SIZE * state.canvasZoom}px`
                : 'auto',
            }}
          >
            {visuals.map(visual => (
              <CanvasItem
                key={visual.id}
                visual={visual}
                isSelected={state.selectedVisualId === visual.id}
                isMultiSelected={state.selectedVisualIds.length > 1 && state.selectedVisualIds.includes(visual.id) && state.selectedVisualId !== visual.id}
                zoom={state.canvasZoom}
                queryState={state.queryResults[visual.id]}
                mode={state.mode}
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
                  dispatch({ type: 'SELECT_VISUAL', payload: visual.id });
                  setContextMenu({ visualId: visual.id, x: e.clientX, y: e.clientY });
                }}
              />
            ))}

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
