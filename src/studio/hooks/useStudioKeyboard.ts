import { useEffect, useRef } from 'react';
import type { StudioState, StudioAction } from '../types/state';

export function useStudioKeyboard(
  stateRef: React.RefObject<StudioState>,
  dispatchRef: React.RefObject<React.Dispatch<StudioAction>>
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentState = stateRef.current;
      const currentDispatch = dispatchRef.current;
      if (!currentState || !currentDispatch) return;

      const currentSelectedIds = currentState.selectedVisualIds.length > 0
        ? currentState.selectedVisualIds
        : (currentState.selectedVisualId ? [currentState.selectedVisualId] : []);

      if (currentState.mode !== 'editor') return;
      if (currentState.measureEditorOpen) return;

      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
      if (isInput) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (currentSelectedIds.length > 0) {
          e.preventDefault();
          currentDispatch({ type: 'REMOVE_SELECTED_VISUALS' });
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        currentDispatch({ type: 'UNDO' });
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        currentDispatch({ type: 'REDO' });
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (currentSelectedIds.length > 0) {
          currentDispatch({ type: 'DUPLICATE_SELECTED_VISUALS' });
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        if (currentState.selectedVisualId) {
          const page = currentState.pages.find(p => p.id === currentState.activePageId);
          const visual = page?.visuals.find(v => v.id === currentState.selectedVisualId);
          if (visual) {
            currentDispatch({ type: 'SET_CLIPBOARD', payload: visual });
          }
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        if (currentState.selectedVisualId) {
          const page = currentState.pages.find(p => p.id === currentState.activePageId);
          const visual = page?.visuals.find(v => v.id === currentState.selectedVisualId);
          if (visual) {
            currentDispatch({ type: 'SET_CLIPBOARD', payload: visual });
            currentDispatch({ type: 'REMOVE_SELECTED_VISUALS' });
          }
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        currentDispatch({ type: 'PASTE_VISUAL' });
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        currentDispatch({ type: 'SELECT_ALL_VISUALS' });
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const dashboardData = {
          title: currentState.dashboardName,
          description: currentState.dashboardDescription,
          pages: currentState.pages,
          dataModel: currentState.dataModel,
          globalFilters: currentState.globalFilters,
        };
        currentDispatch({ type: 'SET_SAVING', payload: true });
        currentDispatch({ type: 'SAVE_DASHBOARD' });
        fetch('/api/studio/dashboards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dashboardId: currentState.dashboardId || `dashboard-${Date.now()}`, data: dashboardData }),
        }).then((res) => {
          if (!res.ok) throw new Error('Save failed');
          currentDispatch({ type: 'SET_SAVING', payload: false });
          currentDispatch({ type: 'MARK_CLEAN' });
          currentDispatch({ type: 'SET_LAST_SAVED_AT', payload: new Date().toISOString() });
        }).catch(() => {
          currentDispatch({ type: 'SET_SAVING', payload: false });
        });
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        if (currentSelectedIds.length >= 2) {
          currentDispatch({ type: 'GROUP_SELECTED_VISUALS' });
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        currentDispatch({ type: 'UNGROUP_SELECTED_VISUALS' });
      }

      if (e.key === 'Escape') {
        currentDispatch({ type: 'CLEAR_CROSS_FILTER' });
        if (currentState.selectedVisualId) {
          const drillState = currentState.drillStates[currentState.selectedVisualId];
          if (drillState && drillState.level > 0) {
            currentDispatch({ type: 'DRILL_UP', payload: currentState.selectedVisualId });
          }
        }
      }

      if (currentSelectedIds.length > 0) {
        const nudgeAmount = e.shiftKey ? 10 : 1;
        const page = currentState.pages.find(p => p.id === currentState.activePageId);
        const unlockedIds = currentSelectedIds.filter(id => {
          const v = page?.visuals.find(vis => vis.id === id);
          return v && !v.locked;
        });
        if (unlockedIds.length === 0) return;
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            unlockedIds.forEach(id => currentDispatch({ type: 'NUDGE_VISUAL', payload: { id, dx: 0, dy: -nudgeAmount } }));
            break;
          case 'ArrowDown':
            e.preventDefault();
            unlockedIds.forEach(id => currentDispatch({ type: 'NUDGE_VISUAL', payload: { id, dx: 0, dy: nudgeAmount } }));
            break;
          case 'ArrowLeft':
            e.preventDefault();
            unlockedIds.forEach(id => currentDispatch({ type: 'NUDGE_VISUAL', payload: { id, dx: -nudgeAmount, dy: 0 } }));
            break;
          case 'ArrowRight':
            e.preventDefault();
            unlockedIds.forEach(id => currentDispatch({ type: 'NUDGE_VISUAL', payload: { id, dx: nudgeAmount, dy: 0 } }));
            break;
        }
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const page = currentState.pages.find(p => p.id === currentState.activePageId);
        if (!page || page.visuals.length === 0) return;
        const sorted = [...page.visuals].sort((a, b) => a.zIndex - b.zIndex);
        const currentIdx = currentState.selectedVisualId
          ? sorted.findIndex(v => v.id === currentState.selectedVisualId)
          : -1;
        if (e.shiftKey) {
          const prevIdx = currentIdx <= 0 ? sorted.length - 1 : currentIdx - 1;
          currentDispatch({ type: 'SELECT_VISUAL', payload: sorted[prevIdx].id });
        } else {
          const nextIdx = currentIdx >= sorted.length - 1 ? 0 : currentIdx + 1;
          currentDispatch({ type: 'SELECT_VISUAL', payload: sorted[nextIdx].id });
        }
      }

      if (e.key === 'F2' && currentState.selectedVisualId) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('studio:start-rename', { detail: { visualId: currentState.selectedVisualId } }));
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        currentDispatch({ type: 'SET_CANVAS_ZOOM', payload: 0.7 });
        const canvasContainer = document.querySelector('[data-canvas-fit]');
        if (canvasContainer) {
          canvasContainer.scrollLeft = 0;
          canvasContainer.scrollTop = 0;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stateRef, dispatchRef]);
}
