'use client';

import React, { useRef, useState, useLayoutEffect, useMemo, useCallback, useEffect } from 'react';
import { useStudio } from '../../store/StudioContext';
import { CANVAS_DEFAULTS } from '../../types/canvas';
import type { FilterCondition } from '../../types/visuals';
import { ChartRenderer } from '../charts/ChartRenderer';
import { VisualShell, buildShellStyle } from '../canvas/VisualShell';
import { buildMeasureFormatMap } from '../../lib/format';
import { Filter, X, Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react';

export function StudioViewer({ dashboardId }: { dashboardId?: string }) {
  const { state, dispatch } = useStudio();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activePage = state.pages.find(p => p.id === state.activePageId);
  const visuals = activePage?.visuals || [];
  const pageWidth = activePage?.pageWidth || CANVAS_DEFAULTS.DESIGN_WIDTH;
  const pageHeight = activePage?.pageHeight || CANVAS_DEFAULTS.DESIGN_HEIGHT;

  const measureFormats = useMemo(
    () => buildMeasureFormatMap(state.dataModel?.measures),
    [state.dataModel]
  );

  const handleCrossFilter = useCallback((visualId: string, fieldName: string, value: unknown) => {
    if (state.crossFilter?.fieldName === fieldName && state.crossFilter?.value === value) {
      dispatch({ type: 'CLEAR_CROSS_FILTER' });
    } else {
      dispatch({ type: 'SET_CROSS_FILTER', payload: { sourceVisualId: visualId, fieldName, value } });
    }
  }, [state.crossFilter, dispatch]);

  const handleDrillDown = useCallback((visualId: string, fieldName: string, value: unknown) => {
    dispatch({ type: 'DRILL_DOWN', payload: { visualId, fieldName, value } });
  }, [dispatch]);

  const pageFilters = state.pageFilters[activePage?.id || ''] || [];
  const hasActiveFilters = pageFilters.length > 0 || !!state.crossFilter;

  const currentPageIndex = state.pages.findIndex(p => p.id === state.activePageId);
  const hasPrevPage = currentPageIndex > 0;
  const hasNextPage = currentPageIndex < state.pages.length - 1;

  const goToPrevPage = useCallback(() => {
    if (hasPrevPage) {
      dispatch({ type: 'SET_ACTIVE_PAGE', payload: state.pages[currentPageIndex - 1].id });
    }
  }, [hasPrevPage, currentPageIndex, state.pages, dispatch]);

  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      dispatch({ type: 'SET_ACTIVE_PAGE', payload: state.pages[currentPageIndex + 1].id });
    }
  }, [hasNextPage, currentPageIndex, state.pages, dispatch]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevPage();
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevPage, goToNextPage, isFullscreen]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      if (!containerRef.current) return;
      setContainerSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const zoom = (() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 1;
    const availW = containerSize.width;
    const availH = containerSize.height - 74;
    return Math.min(availW / pageWidth, availH / pageHeight, 1);
  })();

  const scaledWidth = pageWidth * zoom;
  const scaledHeight = pageHeight * zoom;
  const marginTop = Math.max(0, (containerSize.height - 32 - scaledHeight) / 2);

  const getChartTheme = (visual: { formatting?: { chartTheme?: string } }): 'dark' | 'light' | 'transparent' => {
    const chartTheme = visual.formatting?.chartTheme;
    if (chartTheme === 'dark' || chartTheme === 'light' || chartTheme === 'transparent') return chartTheme;
    return 'transparent';
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-hidden">
      <div
        className="flex-1 overflow-hidden bg-neutral-900 relative"
      >
        {/* Navigation arrows */}
        {state.pages.length > 1 && (
          <>
            <button
              onClick={goToPrevPage}
              disabled={!hasPrevPage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-40 p-2 bg-neutral-800/80 hover:bg-neutral-700 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Página anterior (←)"
            >
              <ChevronLeft size={16} className="text-white" />
            </button>
            <button
              onClick={goToNextPage}
              disabled={!hasNextPage}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-40 p-2 bg-neutral-800/80 hover:bg-neutral-700 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Próxima página (→)"
            >
              <ChevronRight size={16} className="text-white" />
            </button>
          </>
        )}

        <div className="w-full h-full flex items-center justify-center" style={{ paddingTop: `${marginTop}px` }}>
          <div
            className="relative shrink-0"
            style={{
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              background: activePage?.background || CANVAS_DEFAULTS.BACKGROUND,
            }}
          >
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
            {visuals.filter(v => !v.hidden).map(visual => {
              const cp = visual.canvasProperties || {};

              const visualStyle: React.CSSProperties = {
                ...buildShellStyle(cp, visual, zoom),
              };

              return (
                <div
                  key={visual.id}
                  className="absolute overflow-hidden"
                  style={visualStyle}
                >
                  <VisualShell visual={visual}>
                    <ChartRenderer
                      visual={visual}
                      queryState={state.queryResults[visual.id]}
                      measureFormats={measureFormats}
                      theme={getChartTheme(visual)}
                      crossFilterValue={state.crossFilter?.value}
                      onCrossFilter={(fieldName, value) => handleCrossFilter(visual.id, fieldName, value)}
                      onDrillDown={(fieldName, value) => handleDrillDown(visual.id, fieldName, value)}
                    />
                  </VisualShell>
                </div>
              );
            })}

            {state.textBoxes?.map(textBox => (
              <div
                key={textBox.id}
                className="absolute"
                style={{
                  left: `${textBox.x * zoom}px`,
                  top: `${textBox.y * zoom}px`,
                  width: `${textBox.width * zoom}px`,
                  height: `${textBox.height * zoom}px`,
                  zIndex: textBox.zIndex,
                }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    fontSize: `${(textBox.formatting?.fontSize || 14) * zoom}px`,
                    fontWeight: textBox.formatting?.fontWeight || 'normal',
                    fontStyle: textBox.formatting?.fontStyle || 'normal',
                    textAlign: textBox.formatting?.textAlign || 'left',
                    color: textBox.formatting?.color || '#ffffff',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    overflow: 'hidden',
                  }}
                >
                  {textBox.text}
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
        <button
          onClick={toggleFullscreen}
          className="ml-2 p-1.5 rounded text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        >
          {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
        </button>
        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className={`ml-1 p-1.5 rounded transition-colors ${hasActiveFilters ? 'bg-amber-500 text-white' : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          title="Filtros"
        >
          <Filter size={14} />
        </button>
      </div>

      {showFilterPanel && (
        <div className="absolute bottom-10 right-2 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Filtros Ativos</span>
            <button onClick={() => setShowFilterPanel(false)} className="text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          </div>
          {state.crossFilter && (
            <div className="flex items-center justify-between text-xs bg-amber-50 dark:bg-amber-900/20 px-2 py-1.5 rounded mb-1">
              <span className="truncate">{state.crossFilter.fieldName}: {String(state.crossFilter.value)}</span>
              <button onClick={() => dispatch({ type: 'CLEAR_CROSS_FILTER' })} className="text-muted-foreground hover:text-foreground ml-2 shrink-0">
                <X size={10} />
              </button>
            </div>
          )}
          {pageFilters.map((f: FilterCondition, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1.5 rounded mb-1">
              <span className="truncate">{f.columnName}: {String(f.value)}</span>
              <button
                onClick={() => {
                  const newFilters = pageFilters.filter((_, idx) => idx !== i);
                  dispatch({ type: 'SET_PAGE_FILTERS', payload: { pageId: activePage?.id || '', filters: newFilters } });
                }}
                className="text-muted-foreground hover:text-foreground ml-2 shrink-0"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {!state.crossFilter && pageFilters.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">Nenhum filtro ativo</p>
          )}
        </div>
      )}
    </div>
  );
}
