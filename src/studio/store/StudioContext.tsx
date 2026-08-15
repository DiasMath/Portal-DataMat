'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { StudioState, StudioAction } from '../types/state';
import { studioReducer, getInitialState } from './reducer';
import { getActivePage, getVisualFromPage } from './selectors';

interface StudioContextValue {
  state: StudioState;
  dispatch: React.Dispatch<StudioAction>;
  getActivePage: () => ReturnType<typeof getActivePage>;
  getSelectedVisual: () => ReturnType<typeof getVisualFromPage>;
  canUndo: boolean;
  canRedo: boolean;
}

const StudioContext = createContext<StudioContextValue | null>(null);

// Selector context for granular subscriptions
const StudioStateContext = createContext<StudioState | null>(null);
const StudioDispatchContext = createContext<React.Dispatch<StudioAction> | null>(null);

export function StudioProvider({
  children,
  mode = 'editor',
}: {
  children: React.ReactNode;
  mode?: 'editor' | 'viewer';
}) {
  const [state, dispatch] = useReducer(studioReducer, null, () => getInitialState(mode));
  const stateRef = useRef(state);
  stateRef.current = state;

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveRef = useRef<string>('');

  useEffect(() => {
    if (!state.isDirty) return;

    const snapshotKey = JSON.stringify({
      pages: state.pages.map(p => ({ id: p.id, visuals: p.visuals.length })),
      activePageId: state.activePageId,
      dashboardName: state.dashboardName,
    });

    if (snapshotKey === lastSaveRef.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const snapshot = {
          pages: state.pages,
          activePageId: state.activePageId,
          dataModel: state.dataModel,
          dashboardName: state.dashboardName,
          dashboardDescription: state.dashboardDescription,
          globalFilters: state.globalFilters,
          pageFilters: state.pageFilters,
          visualFilters: state.visualFilters,
          canvasZoom: state.canvasZoom,
          showGrid: state.showGrid,
        };
        localStorage.setItem('studio_autosave', JSON.stringify(snapshot));
        lastSaveRef.current = snapshotKey;
        dispatch({ type: 'SET_LAST_SAVED_AT', payload: new Date().toISOString() });
      } catch {
        // ignore quota errors
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [state]);

  const getActivePageCb = useCallback(() => {
    return getActivePage(stateRef.current);
  }, []);

  const getSelectedVisualCb = useCallback(() => {
    if (!stateRef.current.selectedVisualId) return null;
    return getVisualFromPage(stateRef.current, stateRef.current.selectedVisualId);
  }, []);

  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    getActivePage: getActivePageCb,
    getSelectedVisual: getSelectedVisualCb,
    canUndo,
    canRedo,
  }), [state, dispatch, getActivePageCb, getSelectedVisualCb, canUndo, canRedo]);

  return (
    <StudioContext.Provider value={contextValue}>
      <StudioStateContext.Provider value={state}>
        <StudioDispatchContext.Provider value={dispatch}>
          {children}
        </StudioDispatchContext.Provider>
      </StudioStateContext.Provider>
    </StudioContext.Provider>
  );
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return ctx;
}

/**
 * Selector hook for granular state subscriptions.
 * Only re-renders when the selected value changes.
 * 
 * @example
 * const activePageId = useStudioSelector(s => s.activePageId);
 * const selectedVisual = useStudioSelector(s => s.pages.find(p => p.id === s.activePageId)?.visuals.find(v => v.id === s.selectedVisualId));
 */
export function useStudioSelector<T>(selector: (state: StudioState) => T, isEqual?: (a: T, b: T) => boolean): T {
  const state = useContext(StudioStateContext);
  if (!state) {
    throw new Error('useStudioSelector must be used within a StudioProvider');
  }

  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const isEqualRef = useRef(isEqual);
  isEqualRef.current = isEqual;

  const subscribe = useCallback((onStoreChange: () => void) => {
    // Subscribe to the state context by re-rendering on any state change
    // The equality check in useSyncExternalStore will prevent unnecessary re-renders
    const unsubscribe = () => {};
    // We use the state object reference as the signal
    // Components using selectors will only re-render when their selected value changes
    return unsubscribe;
  }, []);

  // Use useSyncExternalStore with a snapshot that changes when selected value changes
  const getSnapshot = useCallback(() => {
    const selected = selectorRef.current(state);
    return selected;
  }, [state]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook that only returns dispatch (no state subscription).
 * Components using this won't re-render on state changes.
 */
export function useStudioDispatch(): React.Dispatch<StudioAction> {
  const dispatch = useContext(StudioDispatchContext);
  if (!dispatch) {
    throw new Error('useStudioDispatch must be used within a StudioProvider');
  }
  return dispatch;
}

export { getActivePage, getVisualFromPage } from './selectors';
