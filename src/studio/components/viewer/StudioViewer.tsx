'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useStudio } from '../../store/StudioContext';
import { CANVAS_DEFAULTS } from '../../types/canvas';
import { ChartRenderer } from '../charts/ChartRenderer';

export function StudioViewer({ dashboardId }: { dashboardId?: string }) {
  const { state, dispatch } = useStudio();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const activePage = state.pages.find(p => p.id === state.activePageId);
  const visuals = activePage?.visuals || [];
  const pageWidth = activePage?.pageWidth || CANVAS_DEFAULTS.DESIGN_WIDTH;
  const pageHeight = activePage?.pageHeight || CANVAS_DEFAULTS.DESIGN_HEIGHT;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const zoom = (() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 1;
    const availW = containerSize.width;
    const availH = containerSize.height - 32;
    return Math.min(availW / pageWidth, availH / pageHeight, 1);
  })();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-neutral-900 relative"
      >
        <div className="w-full h-full flex items-center justify-center">
          <div
            className="relative shadow-2xl shrink-0"
            style={{
              width: `${pageWidth * zoom}px`,
              height: `${pageHeight * zoom}px`,
              background: activePage?.background || '#ffffff',
            }}
          >
            {visuals.filter(v => !v.hidden).map(visual => (
              <div
                key={visual.id}
                className="absolute overflow-hidden"
                style={{
                  left: `${visual.x * zoom}px`,
                  top: `${visual.y * zoom}px`,
                  width: `${visual.width * zoom}px`,
                  height: `${visual.height * zoom}px`,
                }}
              >
                {visual.showTitle && (
                  <div className="px-2 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate border-b border-neutral-200 dark:border-neutral-700">
                    {visual.title}
                  </div>
                )}
                <div
                  className="w-full"
                  style={{ height: visual.showTitle ? `calc(100% - 28px)` : '100%' }}
                >
                  <ChartRenderer
                    visual={visual}
                    queryState={state.queryResults[visual.id]}
                    width={visual.width * zoom - 16}
                    height={visual.height * zoom - (visual.showTitle ? 44 : 16)}
                  />
                </div>
              </div>
            ))}

            {visuals.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-neutral-400/50">
                <div className="text-center">
                  <p className="text-lg mb-2">Nenhum visual</p>
                  <p className="text-sm">Este dashboard está vazio</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {state.pages.length > 1 && (
        <div className="h-8 flex items-center bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 px-2 shrink-0">
          <div className="flex items-center gap-0.5 overflow-x-auto flex-1">
            {state.pages.map(page => (
              <button
                key={page.id}
                onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', payload: page.id })}
                className={`px-3 py-1 text-[10px] rounded transition-colors select-none
                  ${state.activePageId === page.id
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-foreground font-medium border-b-2 border-amber-500'
                    : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-foreground'
                  }
                `}
              >
                {page.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
