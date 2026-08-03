'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import { CANVAS_DEFAULTS } from '../../types/canvas';
import { Minus, Plus, Maximize } from 'lucide-react';

export function ZoomBar() {
  const { state, dispatch } = useStudio();
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const zoomPercent = Math.round(state.canvasZoom * 100);

  const handleZoomIn = useCallback(() => {
    dispatch({ type: 'SET_CANVAS_ZOOM', payload: Math.min(3, state.canvasZoom + 0.1) });
  }, [dispatch, state.canvasZoom]);

  const handleZoomOut = useCallback(() => {
    dispatch({ type: 'SET_CANVAS_ZOOM', payload: Math.max(0.1, state.canvasZoom - 0.1) });
  }, [dispatch, state.canvasZoom]);

  const handleFitToScreen = useCallback(() => {
    const canvasContainer = document.querySelector('[data-canvas-fit]');
    if (!canvasContainer) return;
    const rect = canvasContainer.getBoundingClientRect();
    const availW = rect.width;
    const availH = rect.height;
    const activePage = state.pages.find(p => p.id === state.activePageId);
    const pageWidth = activePage?.pageWidth || CANVAS_DEFAULTS.DESIGN_WIDTH;
    const pageHeight = activePage?.pageHeight || CANVAS_DEFAULTS.DESIGN_HEIGHT;
    const fitZoom = Math.min(availW / pageWidth, availH / pageHeight);
    dispatch({ type: 'SET_CANVAS_ZOOM', payload: fitZoom });
  }, [dispatch, state.pages, state.activePageId]);

  const handleSliderChange = useCallback((e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0.1, Math.min(3, x / rect.width * 3));
    dispatch({ type: 'SET_CANVAS_ZOOM', payload: percent });
  }, [dispatch]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleSliderChange(e);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const percent = Math.max(0.1, Math.min(3, x / rect.width * 3));
      dispatch({ type: 'SET_CANVAS_ZOOM', payload: percent });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [dispatch, handleSliderChange]);

  const sliderPercent = ((state.canvasZoom - 0.1) / (3 - 0.1)) * 100;

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleZoomOut}
        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-muted-foreground"
        title="Zoom out"
      >
        <Minus size={12} />
      </button>

      <div
        ref={sliderRef}
        className="relative w-32 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full cursor-pointer"
        onMouseDown={handleMouseDown}
      >
        <div
          className="absolute top-0 left-0 h-full bg-amber-500 rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, sliderPercent))}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-neutral-300 border-2 border-amber-500 rounded-full shadow-sm cursor-grab active:cursor-grabbing"
          style={{ left: `calc(${Math.max(0, Math.min(100, sliderPercent))}% - 6px)` }}
        />
      </div>

      <button
        onClick={handleZoomIn}
        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-muted-foreground"
        title="Zoom in"
      >
        <Plus size={12} />
      </button>

      <span className="text-[10px] text-muted-foreground w-9 text-center tabular-nums">
        {zoomPercent}%
      </span>

      <select
        value={zoomPercent}
        onChange={(e) => dispatch({ type: 'SET_CANVAS_ZOOM', payload: Number(e.target.value) / 100 })}
        className="text-[10px] bg-transparent text-muted-foreground border-none focus:outline-none cursor-pointer w-12 text-center"
      >
        <option value={25}>25%</option>
        <option value={50}>50%</option>
        <option value={75}>75%</option>
        <option value={100}>100%</option>
        <option value={125}>125%</option>
        <option value={150}>150%</option>
        <option value={200}>200%</option>
        <option value={300}>300%</option>
      </select>

      <button
        onClick={handleFitToScreen}
        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-muted-foreground"
        title="Ajustar à tela"
      >
        <Maximize size={12} />
      </button>
    </div>
  );
}
