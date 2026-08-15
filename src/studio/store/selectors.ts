import type { StudioState } from '../types/state';
import type { Visual, DashboardPage } from '../types/dashboard';

export function getActivePage(state: StudioState) {
  return state.pages.find(p => p.id === state.activePageId) || null;
}

export function getActivePageIndex(state: StudioState): number {
  return state.pages.findIndex(p => p.id === state.activePageId);
}

export function getVisualFromPage(state: StudioState, visualId: string) {
  const page = getActivePage(state);
  return page?.visuals.find(v => v.id === visualId) || null;
}

export function getSelectedIds(state: StudioState): string[] {
  if (state.selectedVisualIds.length > 0) return state.selectedVisualIds;
  if (state.selectedVisualId) return [state.selectedVisualId];
  return [];
}

export function getMaxZIndex(state: StudioState): number {
  const page = getActivePage(state);
  if (!page) return 0;
  return page.visuals.reduce((max, v) => Math.max(max, v.zIndex), 0);
}

export function getTextBoxMaxZIndex(state: StudioState): number {
  return state.textBoxes.reduce((max, tb) => Math.max(max, tb.zIndex), 0);
}

export function getTextBoxMinZIndex(state: StudioState): number {
  return state.textBoxes.reduce((min, tb) => Math.min(min, tb.zIndex), Infinity);
}

export function updateVisualInState(
  state: StudioState,
  visualId: string,
  updater: (visual: Visual) => Visual
): StudioState {
  const pageIndex = getActivePageIndex(state);
  if (pageIndex === -1) return state;

  const page = state.pages[pageIndex];
  const visualIndex = page.visuals.findIndex(v => v.id === visualId);
  if (visualIndex === -1) return state;

  const newVisuals = [...page.visuals];
  newVisuals[visualIndex] = updater(newVisuals[visualIndex]);

  const newPages = [...state.pages];
  newPages[pageIndex] = { ...page, visuals: newVisuals };

  return { ...state, pages: newPages, isDirty: true };
}

export function updateSelectedVisuals(
  state: StudioState,
  updater: (visual: Visual) => Visual
): StudioState {
  const pageIndex = getActivePageIndex(state);
  if (pageIndex === -1) return state;

  const page = state.pages[pageIndex];
  const ids = getSelectedIds(state);

  if (ids.length === 0) return state;

  const newVisuals = page.visuals.map(v => ids.includes(v.id) ? updater(v) : v);
  const newPages = [...state.pages];
  newPages[pageIndex] = { ...page, visuals: newVisuals };

  return { ...state, pages: newPages, isDirty: true };
}

/**
 * Helper to update visuals in the active page.
 * Encapsulates the common pattern: find page → copy pages → update page → return.
 */
export function updatePageVisuals(
  state: StudioState,
  updater: (visuals: Visual[]) => Visual[]
): StudioState {
  const pageIndex = getActivePageIndex(state);
  if (pageIndex === -1) return state;

  const page = state.pages[pageIndex];
  const newVisuals = updater(page.visuals);

  const newPages = [...state.pages];
  newPages[pageIndex] = { ...page, visuals: newVisuals };

  return { ...state, pages: newPages, isDirty: true };
}

export function clampToCanvasHelper(
  x: number, y: number, width: number, height: number,
  pageWidth: number, pageHeight: number
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(x, pageWidth - width)),
    y: Math.max(0, Math.min(y, pageHeight - height)),
  };
}

export function getPageWidth(state: StudioState): number {
  const page = getActivePage(state);
  return page?.pageWidth || 1280;
}

export function getPageHeight(state: StudioState): number {
  const page = getActivePage(state);
  return page?.pageHeight || 720;
}
