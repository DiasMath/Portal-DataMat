import type { StudioState, StudioSnapshot } from '../types/state';

const MAX_UNDO_STACK = 50;

const SNAPSHOT_ACTIONS = new Set([
  'ADD_PAGE',
  'REMOVE_PAGE',
  'RENAME_PAGE',
  'REORDER_PAGES',
  'SET_PAGE_SIZE',
  'ADD_VISUAL',
  'REMOVE_VISUAL',
  'REMOVE_SELECTED_VISUALS',
  'DUPLICATE_VISUAL',
  'DUPLICATE_SELECTED_VISUALS',
  'MOVE_VISUAL',
  'MOVE_SELECTED_VISUALS',
  'RESIZE_VISUAL',
  'UPDATE_VISUAL',
  'NUDGE_VISUAL',
  'BRING_TO_FRONT',
  'SEND_TO_BACK',
  'BRING_FORWARD',
  'SEND_BACKWARD',
  'TOGGLE_VISUAL_LOCK',
  'TOGGLE_VISUAL_HIDDEN',
  'TOGGLE_LOCK_ALL',
  'ALIGN_VISUALS',
  'DISTRIBUTE_VISUALS',
  'REORDER_VISUALS',
  'SET_BUCKET_FIELD',
  'REMOVE_BUCKET_FIELD',
  'REORDER_BUCKET_FIELDS',
  'SET_DATA_MODEL',
  'SET_GLOBAL_FILTERS',
  'SET_DASHBOARD_NAME',
  'SET_DASHBOARD_DESCRIPTION',
  'LOAD_DASHBOARD',
]);

export function shouldPushSnapshot(actionType: string): boolean {
  return SNAPSHOT_ACTIONS.has(actionType);
}

export function takeSnapshot(state: StudioState): StudioSnapshot {
  return {
    pages: structuredClone(state.pages),
    activePageId: state.activePageId,
    globalFilters: structuredClone(state.globalFilters),
    pageFilters: structuredClone(state.pageFilters),
    visualFilters: structuredClone(state.visualFilters),
    dashboardName: state.dashboardName,
    dashboardDescription: state.dashboardDescription,
  };
}

export function pushUndo(state: StudioState): StudioState {
  const snapshot = takeSnapshot(state);
  const newStack = [...state.undoStack, snapshot];
  if (newStack.length > MAX_UNDO_STACK) {
    newStack.shift();
  }
  return {
    ...state,
    undoStack: newStack,
    redoStack: [],
  };
}

export function performUndo(state: StudioState): StudioState {
  if (state.undoStack.length === 0) return state;

  const currentSnapshot = takeSnapshot(state);
  const newUndoStack = [...state.undoStack];
  const previous = newUndoStack.pop()!;

  return {
    ...state,
    pages: previous.pages,
    activePageId: previous.activePageId,
    globalFilters: previous.globalFilters,
    pageFilters: previous.pageFilters,
    visualFilters: previous.visualFilters,
    dashboardName: previous.dashboardName,
    dashboardDescription: previous.dashboardDescription,
    undoStack: newUndoStack,
    redoStack: [...state.redoStack, currentSnapshot],
    selectedVisualId: null,
    isDirty: true,
  };
}

export function performRedo(state: StudioState): StudioState {
  if (state.redoStack.length === 0) return state;

  const currentSnapshot = takeSnapshot(state);
  const newRedoStack = [...state.redoStack];
  const next = newRedoStack.pop()!;

  return {
    ...state,
    pages: next.pages,
    activePageId: next.activePageId,
    globalFilters: next.globalFilters,
    pageFilters: next.pageFilters,
    visualFilters: next.visualFilters,
    dashboardName: next.dashboardName,
    dashboardDescription: next.dashboardDescription,
    undoStack: [...state.undoStack, currentSnapshot],
    redoStack: newRedoStack,
    selectedVisualId: null,
    isDirty: true,
  };
}
