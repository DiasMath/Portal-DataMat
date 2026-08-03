'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import type { StudioState, StudioAction } from '../types/state';
import type { VisualType } from '../types/visuals';
import type { DashboardPage } from '../types/dashboard';
import { initialStudioState } from '../types/state';
import { createDefaultVisual, createDefaultPage } from '../types/dashboard';
import { shouldPushSnapshot, pushUndo, performUndo, performRedo } from './undo-middleware';
import { clampToCanvas, snapToGrid } from '../types/canvas';

function getActivePage(state: StudioState) {
  return state.pages.find(p => p.id === state.activePageId) || null;
}

function getVisualFromPage(state: StudioState, visualId: string) {
  const page = getActivePage(state);
  return page?.visuals.find(v => v.id === visualId) || null;
}

function updateVisualInState(
  state: StudioState,
  visualId: string,
  updater: (visual: NonNullable<ReturnType<typeof getVisualFromPage>>) => NonNullable<ReturnType<typeof getVisualFromPage>>
): StudioState {
  const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
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

function updateSelectedVisuals(
  state: StudioState,
  updater: (visual: NonNullable<ReturnType<typeof getVisualFromPage>>) => NonNullable<ReturnType<typeof getVisualFromPage>>
): StudioState {
  const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
  if (pageIndex === -1) return state;

  const page = state.pages[pageIndex];
  const ids = state.selectedVisualIds.length > 0 ? state.selectedVisualIds : (state.selectedVisualId ? [state.selectedVisualId] : []);

  if (ids.length === 0) return state;

  const newVisuals = page.visuals.map(v => ids.includes(v.id) ? updater(v) : v);
  const newPages = [...state.pages];
  newPages[pageIndex] = { ...page, visuals: newVisuals };

  return { ...state, pages: newPages, isDirty: true };
}

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'LOAD_DASHBOARD':
      return { ...initialStudioState, ...action.payload };

    case 'SET_DASHBOARD_NAME':
      return { ...state, dashboardName: action.payload, isDirty: true };

    case 'SET_DASHBOARD_DESCRIPTION':
      return { ...state, dashboardDescription: action.payload, isDirty: true };

    case 'MARK_CLEAN':
      return { ...state, isDirty: false };

    case 'UNDO':
      return performUndo(state);

    case 'REDO':
      return performRedo(state);

    case 'PUSH_SNAPSHOT':
      return pushUndo(state);

    case 'ADD_PAGE': {
      const newPage = createDefaultPage(action.payload?.name, action.payload?.pageWidth, action.payload?.pageHeight);
      newPage.order = state.pages.length;
      const newPages = [...state.pages, newPage];
      return {
        ...pushUndo(state),
        pages: newPages,
        activePageId: newPage.id,
        isDirty: true,
      };
    }

    case 'DUPLICATE_PAGE': {
      const sourcePage = state.pages.find(p => p.id === action.payload);
      if (!sourcePage) return state;
      const newPage: DashboardPage = {
        ...structuredClone(sourcePage),
        id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: `${sourcePage.name} (Cópia)`,
        order: state.pages.length,
        visuals: sourcePage.visuals.map(v => ({
          ...structuredClone(v),
          id: `visual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        })),
      };
      const newPages = [...state.pages, newPage];
      return {
        ...pushUndo(state),
        pages: newPages,
        activePageId: newPage.id,
        isDirty: true,
      };
    }

    case 'REMOVE_PAGE': {
      if (state.pages.length <= 1) return state;
      const filtered = state.pages.filter(p => p.id !== action.payload);
      const newActiveId = state.activePageId === action.payload
        ? filtered[0].id
        : state.activePageId;
      return {
        ...pushUndo(state),
        pages: filtered,
        activePageId: newActiveId,
        selectedVisualId: null,
        selectedVisualIds: [],
        isDirty: true,
      };
    }

    case 'RENAME_PAGE': {
      const pageIndex = state.pages.findIndex(p => p.id === action.payload.id);
      if (pageIndex === -1) return state;
      const newPages = [...state.pages];
      newPages[pageIndex] = { ...newPages[pageIndex], name: action.payload.name };
      return { ...pushUndo(state), pages: newPages, isDirty: true };
    }

    case 'SET_ACTIVE_PAGE':
      return { ...state, activePageId: action.payload, selectedVisualId: null, selectedVisualIds: [] };

    case 'REORDER_PAGES': {
      const reordered = action.payload
        .map(id => state.pages.find(p => p.id === id))
        .filter(Boolean)
        .map((p, i) => ({ ...p!, order: i }));
      return { ...pushUndo(state), pages: reordered, isDirty: true };
    }

    case 'SET_PAGE_SIZE': {
      const pageIndex = state.pages.findIndex(p => p.id === action.payload.pageId);
      if (pageIndex === -1) return state;
      const newPages = [...state.pages];
      newPages[pageIndex] = {
        ...newPages[pageIndex],
        pageWidth: action.payload.width,
        pageHeight: action.payload.height,
        pagePreset: action.payload.preset,
      };
      return { ...pushUndo(state), pages: newPages, isDirty: true };
    }

    case 'SET_PAGE_BACKGROUND': {
      const pageIndex = state.pages.findIndex(p => p.id === action.payload.pageId);
      if (pageIndex === -1) return state;
      const newPages = [...state.pages];
      newPages[pageIndex] = {
        ...newPages[pageIndex],
        background: action.payload.background,
      };
      return { ...pushUndo(state), pages: newPages, isDirty: true };
    }

    // ── Visuals ──

    case 'ADD_VISUAL': {
      const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIndex === -1) return state;

      const page = state.pages[pageIndex];
      const maxZ = page.visuals.reduce((max, v) => Math.max(max, v.zIndex), 0);
      const visual = createDefaultVisual(action.payload.type, action.payload.x, action.payload.y);
      visual.zIndex = maxZ + 1;

      const newPages = [...state.pages];
      newPages[pageIndex] = { ...page, visuals: [...page.visuals, visual] };

      return {
        ...pushUndo(state),
        pages: newPages,
        selectedVisualId: visual.id,
        selectedVisualIds: [visual.id],
        isDirty: true,
      };
    }

    case 'REMOVE_VISUAL': {
      const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIndex === -1) return state;

      const page = state.pages[pageIndex];
      const newPages = [...state.pages];
      newPages[pageIndex] = {
        ...page,
        visuals: page.visuals.filter(v => v.id !== action.payload),
      };

      const newIds = state.selectedVisualIds.filter(id => id !== action.payload);
      return {
        ...pushUndo(state),
        pages: newPages,
        selectedVisualId: state.selectedVisualId === action.payload ? (newIds.length > 0 ? newIds[newIds.length - 1] : null) : state.selectedVisualId,
        selectedVisualIds: newIds,
        isDirty: true,
      };
    }

    case 'REMOVE_SELECTED_VISUALS': {
      const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];
      const ids = state.selectedVisualIds.length > 0 ? state.selectedVisualIds : (state.selectedVisualId ? [state.selectedVisualId] : []);
      if (ids.length === 0) return state;

      const idsSet = new Set(ids);
      const groupIds = new Set<string>();
      page.visuals.forEach(v => {
        if (idsSet.has(v.id) && v.groupId) groupIds.add(v.groupId);
      });

      const allIdsToDelete = new Set(ids);
      if (groupIds.size > 0) {
        page.visuals.forEach(v => {
          if (v.groupId && groupIds.has(v.groupId)) {
            allIdsToDelete.add(v.id);
          }
        });
      }

      const newPages = [...state.pages];
      newPages[pageIndex] = {
        ...page,
        visuals: page.visuals.filter(v => !allIdsToDelete.has(v.id)),
      };

      return {
        ...pushUndo(state),
        pages: newPages,
        selectedVisualId: null,
        selectedVisualIds: [],
        isDirty: true,
      };
    }

    case 'DUPLICATE_VISUAL': {
      const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIndex === -1) return state;

      const page = state.pages[pageIndex];
      const original = page.visuals.find(v => v.id === action.payload);
      if (!original) return state;

      const maxZ = page.visuals.reduce((max, v) => Math.max(max, v.zIndex), 0);
      const duplicate = {
        ...structuredClone(original),
        id: `visual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        x: original.x + 20,
        y: original.y + 20,
        zIndex: maxZ + 1,
        name: `${original.name} (Cópia)`,
        title: `${original.title} (Cópia)`,
      };

      const newPages = [...state.pages];
      newPages[pageIndex] = { ...page, visuals: [...page.visuals, duplicate] };

      return {
        ...pushUndo(state),
        pages: newPages,
        selectedVisualId: duplicate.id,
        selectedVisualIds: [duplicate.id],
        isDirty: true,
      };
    }

    case 'DUPLICATE_SELECTED_VISUALS': {
      const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];
      const ids = state.selectedVisualIds.length > 0 ? state.selectedVisualIds : (state.selectedVisualId ? [state.selectedVisualId] : []);
      if (ids.length === 0) return state;

      const originals = page.visuals.filter(v => ids.includes(v.id));
      const maxZ = page.visuals.reduce((max, v) => Math.max(max, v.zIndex), 0);
      const newDuplicates = originals.map((v, i) => ({
        ...structuredClone(v),
        id: `visual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        x: v.x + 20,
        y: v.y + 20,
        zIndex: maxZ + 1 + i,
        name: `${v.name} (Cópia)`,
        title: `${v.title} (Cópia)`,
      }));

      const newPages = [...state.pages];
      newPages[pageIndex] = { ...page, visuals: [...page.visuals, ...newDuplicates] };

      return {
        ...pushUndo(state),
        pages: newPages,
        selectedVisualId: newDuplicates[newDuplicates.length - 1].id,
        selectedVisualIds: newDuplicates.map(d => d.id),
        isDirty: true,
      };
    }

    case 'SELECT_VISUAL':
      return {
        ...state,
        selectedVisualId: action.payload,
        selectedVisualIds: action.payload ? [action.payload] : [],
      };

    case 'SELECT_VISUAL_MULTI': {
      const id = action.payload;
      const ids = state.selectedVisualIds.includes(id)
        ? state.selectedVisualIds.filter(i => i !== id)
        : [...state.selectedVisualIds, id];
      return {
        ...state,
        selectedVisualId: ids.length > 0 ? ids[ids.length - 1] : null,
        selectedVisualIds: ids,
      };
    }

    case 'SELECT_ALL_VISUALS': {
      const page = state.pages.find(p => p.id === state.activePageId);
      if (!page || page.visuals.length === 0) return state;
      const allIds = page.visuals.map(v => v.id);
      return {
        ...state,
        selectedVisualId: allIds[allIds.length - 1],
        selectedVisualIds: allIds,
      };
    }

    case 'ALIGN_VISUALS': {
      const pageIdx = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIdx === -1) return state;
      const page = state.pages[pageIdx];
      const ids = state.selectedVisualIds;
      const selected = page.visuals.filter(v => ids.includes(v.id));
      if (selected.length < 2) return state;

      const direction = action.payload;
      let newPage = { ...page };

      if (direction === 'left') {
        const minX = Math.min(...selected.map(v => v.x));
        newPage = { ...page, visuals: page.visuals.map(v => ids.includes(v.id) ? { ...v, x: minX } : v) };
      } else if (direction === 'right') {
        const maxRight = Math.max(...selected.map(v => v.x + v.width));
        newPage = { ...page, visuals: page.visuals.map(v => ids.includes(v.id) ? { ...v, x: maxRight - v.width } : v) };
      } else if (direction === 'top') {
        const minY = Math.min(...selected.map(v => v.y));
        newPage = { ...page, visuals: page.visuals.map(v => ids.includes(v.id) ? { ...v, y: minY } : v) };
      } else if (direction === 'bottom') {
        const maxBottom = Math.max(...selected.map(v => v.y + v.height));
        newPage = { ...page, visuals: page.visuals.map(v => ids.includes(v.id) ? { ...v, y: maxBottom - v.height } : v) };
      } else if (direction === 'center-h') {
        const minX = Math.min(...selected.map(v => v.x));
        const maxRight = Math.max(...selected.map(v => v.x + v.width));
        const centerX = (minX + maxRight) / 2;
        newPage = { ...page, visuals: page.visuals.map(v => ids.includes(v.id) ? { ...v, x: centerX - v.width / 2 } : v) };
      } else if (direction === 'center-v') {
        const minY = Math.min(...selected.map(v => v.y));
        const maxBottom = Math.max(...selected.map(v => v.y + v.height));
        const centerY = (minY + maxBottom) / 2;
        newPage = { ...page, visuals: page.visuals.map(v => ids.includes(v.id) ? { ...v, y: centerY - v.height / 2 } : v) };
      }

      const newPages = state.pages.map((p, i) => i === pageIdx ? newPage : p);
      return pushUndo({ ...state, pages: newPages });
    }

    case 'DISTRIBUTE_VISUALS': {
      const pageIdx = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIdx === -1) return state;
      const page = state.pages[pageIdx];
      const ids = state.selectedVisualIds;
      const selected = page.visuals.filter(v => ids.includes(v.id));
      if (selected.length < 3) return state;

      const direction = action.payload;
      let newPage = { ...page };

      if (direction === 'horizontal') {
        const sorted = [...selected].sort((a, b) => a.x - b.x);
        const minX = sorted[0].x;
        const maxRight = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
        const totalWidth = sorted.reduce((sum, v) => sum + v.width, 0);
        const gap = (maxRight - minX - totalWidth) / (sorted.length - 1);
        let currentX = minX;
        const updates = new Map<string, number>();
        for (const v of sorted) {
          updates.set(v.id, currentX);
          currentX += v.width + gap;
        }
        newPage = { ...page, visuals: page.visuals.map(v => updates.has(v.id) ? { ...v, x: updates.get(v.id)! } : v) };
      } else {
        const sorted = [...selected].sort((a, b) => a.y - b.y);
        const minY = sorted[0].y;
        const maxBottom = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
        const totalHeight = sorted.reduce((sum, v) => sum + v.height, 0);
        const gap = (maxBottom - minY - totalHeight) / (sorted.length - 1);
        let currentY = minY;
        const updates = new Map<string, number>();
        for (const v of sorted) {
          updates.set(v.id, currentY);
          currentY += v.height + gap;
        }
        newPage = { ...page, visuals: page.visuals.map(v => updates.has(v.id) ? { ...v, y: updates.get(v.id)! } : v) };
      }

      const newPages = state.pages.map((p, i) => i === pageIdx ? newPage : p);
      return pushUndo({ ...state, pages: newPages });
    }

    case 'MOVE_VISUAL':
      return updateVisualInState(state, action.payload.id, v => ({
        ...v,
        x: action.payload.x,
        y: action.payload.y,
      }));

    case 'MOVE_SELECTED_VISUALS': {
      const ids = state.selectedVisualIds.length > 0 ? state.selectedVisualIds : (state.selectedVisualId ? [state.selectedVisualId] : []);
      if (ids.length === 0) return state;

      const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];

      const draggedVisual = page.visuals.find(v => v.id === action.payload.id);
      if (!draggedVisual) return state;

      const dx = action.payload.x - draggedVisual.x;
      const dy = action.payload.y - draggedVisual.y;

      const idsSet = new Set(ids);

      const groupIds = new Set<string>();
      page.visuals.forEach(v => {
        if (idsSet.has(v.id) && v.groupId) groupIds.add(v.groupId);
      });

      const allAffectedIds = new Set(ids);
      if (groupIds.size > 0) {
        page.visuals.forEach(v => {
          if (v.groupId && groupIds.has(v.groupId)) {
            allAffectedIds.add(v.id);
          }
        });
      }

      const pageWidth = page.pageWidth || 1920;
      const pageHeight = page.pageHeight || 1080;

      const newVisuals = page.visuals.map(v => {
        if (!allAffectedIds.has(v.id)) return v;
        if (v.id === action.payload.id) {
          const clamped = clampToCanvas(action.payload.x, action.payload.y, v.width, v.height, pageWidth, pageHeight);
          return { ...v, x: clamped.x, y: clamped.y };
        }
        const clamped = clampToCanvas(v.x + dx, v.y + dy, v.width, v.height, pageWidth, pageHeight);
        return { ...v, x: clamped.x, y: clamped.y };
      });

      const newPages = [...state.pages];
      newPages[pageIndex] = { ...page, visuals: newVisuals };
      return { ...state, pages: newPages, isDirty: true };
    }

    case 'RESIZE_VISUAL':
      return updateVisualInState(state, action.payload.id, v => ({
        ...v,
        width: action.payload.width,
        height: action.payload.height,
      }));

    case 'UPDATE_VISUAL':
      return updateVisualInState(state, action.payload.id, v => ({
        ...v,
        ...action.payload.updates,
      }));

    case 'NUDGE_VISUAL': {
      const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];
      const pageWidth = page.pageWidth || 1920;
      const pageHeight = page.pageHeight || 1080;
      return updateVisualInState(pushUndo(state), action.payload.id, v => {
        const clamped = clampToCanvas(
          Math.max(0, v.x + action.payload.dx),
          Math.max(0, v.y + action.payload.dy),
          v.width,
          v.height,
          pageWidth,
          pageHeight
        );
        const snappedX = state.showGrid ? snapToGrid(clamped.x) : clamped.x;
        const snappedY = state.showGrid ? snapToGrid(clamped.y) : clamped.y;
        return { ...v, x: snappedX, y: snappedY };
      });
    }

    case 'BRING_TO_FRONT': {
      const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];
      const maxZ = page.visuals.reduce((max, v) => Math.max(max, v.zIndex), 0);
      return updateVisualInState(pushUndo(state), action.payload, v => ({
        ...v,
        zIndex: maxZ + 1,
      }));
    }

    case 'SEND_TO_BACK': {
      const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];
      const minZ = page.visuals.reduce((min, v) => Math.min(min, v.zIndex), 0);
      return updateVisualInState(pushUndo(state), action.payload, v => ({
        ...v,
        zIndex: minZ - 1,
      }));
    }

    case 'BRING_FORWARD': {
      const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];
      const sorted = [...page.visuals].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex(v => v.id === action.payload);
      if (idx < sorted.length - 1) {
        const nextZ = sorted[idx + 1].zIndex;
        return updateVisualInState(pushUndo(state), action.payload, v => ({
          ...v,
          zIndex: nextZ + 1,
        }));
      }
      return state;
    }

    case 'SEND_BACKWARD': {
      const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];
      const sorted = [...page.visuals].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex(v => v.id === action.payload);
      if (idx > 0) {
        const prevZ = sorted[idx - 1].zIndex;
        return updateVisualInState(pushUndo(state), action.payload, v => ({
          ...v,
          zIndex: prevZ - 1,
        }));
      }
      return state;
    }

    case 'TOGGLE_VISUAL_LOCK':
      return updateVisualInState(pushUndo(state), action.payload, v => ({
        ...v,
        locked: !v.locked,
      }));

    case 'TOGGLE_VISUAL_HIDDEN':
      return updateVisualInState(pushUndo(state), action.payload, v => ({
        ...v,
        hidden: !v.hidden,
      }));

    case 'TOGGLE_LOCK_ALL': {
      const pageIdx = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIdx === -1) return state;
      const page = state.pages[pageIdx];
      const allLocked = page.visuals.every(v => v.locked);
      const newPages = state.pages.map((p, i) =>
        i === pageIdx
          ? { ...p, visuals: p.visuals.map(v => ({ ...v, locked: !allLocked })) }
          : p
      );
      return pushUndo({ ...state, pages: newPages });
    }

    case 'SET_CLIPBOARD':
      return { ...state, clipboard: action.payload };

    case 'PASTE_VISUAL': {
      if (!state.clipboard) return state;
      const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];
      const maxZ = page.visuals.reduce((max, v) => Math.max(max, v.zIndex), 0);
      const duplicate = {
        ...structuredClone(state.clipboard),
        id: `visual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        x: state.clipboard.x + 20,
        y: state.clipboard.y + 20,
        zIndex: maxZ + 1,
        name: `${state.clipboard.name} (Cópia)`,
        title: `${state.clipboard.title} (Cópia)`,
      };
      const newPages = [...state.pages];
      newPages[pageIndex] = { ...page, visuals: [...page.visuals, duplicate] };
      return {
        ...pushUndo(state),
        pages: newPages,
        selectedVisualId: duplicate.id,
        selectedVisualIds: [duplicate.id],
        isDirty: true,
      };
    }

    case 'REORDER_VISUALS': {
      const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];
      const sorted = [...page.visuals].sort((a, b) => b.zIndex - a.zIndex);
      const [moved] = sorted.splice(action.payload.fromIndex, 1);
      sorted.splice(action.payload.toIndex, 0, moved);
      const reindexed = sorted.map((v, i) => ({ ...v, zIndex: sorted.length - i }));
      const newPages = [...state.pages];
      newPages[pageIndex] = { ...page, visuals: reindexed };
      return pushUndo({ ...state, pages: newPages });
    }

    case 'SET_CROSS_FILTER':
      return { ...state, crossFilter: action.payload };

    case 'CLEAR_CROSS_FILTER':
      return { ...state, crossFilter: null };

    case 'DRILL_DOWN': {
      const { visualId, fieldName, value } = action.payload;
      const current = state.drillStates[visualId] || { level: 0, path: [] };
      return {
        ...state,
        drillStates: {
          ...state.drillStates,
          [visualId]: {
            level: current.level + 1,
            path: [...current.path, { fieldName, value }],
          },
        },
      };
    }

    case 'DRILL_UP': {
      const visualId = action.payload;
      const current = state.drillStates[visualId];
      if (!current || current.path.length === 0) return state;
      const newPath = current.path.slice(0, -1);
      return {
        ...state,
        drillStates: {
          ...state.drillStates,
          [visualId]: {
            level: current.level - 1,
            path: newPath,
          },
        },
      };
    }

    case 'GROUP_SELECTED_VISUALS': {
      const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];
      const ids = state.selectedVisualIds;
      if (ids.length < 2) return state;

      const newGroupId = `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newVisuals = page.visuals.map(v => ids.includes(v.id) ? { ...v, groupId: newGroupId } : v);
      const newPages = [...state.pages];
      newPages[pageIndex] = { ...page, visuals: newVisuals };
      return pushUndo({ ...state, pages: newPages, groupCounter: state.groupCounter + 1 });
    }

    case 'UNGROUP_SELECTED_VISUALS': {
      const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];
      const ids = state.selectedVisualIds;

      const groupIds = new Set<string>();
      page.visuals.forEach(v => {
        if (ids.includes(v.id) && v.groupId) groupIds.add(v.groupId);
      });

      if (groupIds.size === 0) return state;

      const newVisuals = page.visuals.map(v => (v.groupId && groupIds.has(v.groupId)) ? { ...v, groupId: undefined } : v);
      const newPages = [...state.pages];
      newPages[pageIndex] = { ...page, visuals: newVisuals };
      return pushUndo({ ...state, pages: newPages });
    }

    // ── Buckets ──

    case 'SET_BUCKET_FIELD': {
      const { visualId, bucket, field, index } = action.payload;
      return updateVisualInState(pushUndo(state), visualId, v => {
        const currentBuckets = { ...v.buckets };
        const currentBucket = [...(currentBuckets[bucket] || [])];

        if (field === null) {
          if (index !== undefined) {
            currentBucket.splice(index, 1);
          }
        } else {
          if (index !== undefined && index < currentBucket.length) {
            currentBucket[index] = field;
          } else {
            currentBucket.push(field);
          }
        }

        return { ...v, buckets: { ...currentBuckets, [bucket]: currentBucket } };
      });
    }

    case 'REMOVE_BUCKET_FIELD': {
      const { visualId, bucket, index } = action.payload;
      return updateVisualInState(pushUndo(state), visualId, v => {
        const currentBuckets = { ...v.buckets };
        const currentBucket = [...(currentBuckets[bucket] || [])];
        currentBucket.splice(index, 1);
        return { ...v, buckets: { ...currentBuckets, [bucket]: currentBucket } };
      });
    }

    case 'REORDER_BUCKET_FIELDS': {
      const { visualId, bucket, fromIndex, toIndex } = action.payload;
      return updateVisualInState(pushUndo(state), visualId, v => {
        const currentBuckets = { ...v.buckets };
        const currentBucket = [...(currentBuckets[bucket] || [])];
        const [moved] = currentBucket.splice(fromIndex, 1);
        currentBucket.splice(toIndex, 0, moved);
        return { ...v, buckets: { ...currentBuckets, [bucket]: currentBucket } };
      });
    }

    // ── Data Model ──

    case 'SET_DATA_MODEL':
      return { ...state, dataModel: action.payload, dataModelLoading: false, dataModelError: null };

    case 'TOGGLE_RELATIONSHIP_ACTIVE': {
      if (!state.dataModel) return state;
      const newDataModel = structuredClone(state.dataModel);
      const rel = newDataModel.relationships.find(r => r.id === action.payload);
      if (rel) {
        rel.active = rel.active === false ? true : false;
      }
      return { ...pushUndo(state), dataModel: newDataModel, isDirty: true };
    }

    case 'SET_DATA_MODEL_LOADING':
      return { ...state, dataModelLoading: action.payload };

    case 'SET_DATA_MODEL_ERROR':
      return { ...state, dataModelError: action.payload, dataModelLoading: false };

    // ── Query Results ──

    case 'SET_QUERY_RESULT':
      return {
        ...state,
        queryResults: {
          ...state.queryResults,
          [action.payload.visualId]: action.payload.result,
        },
      };

    // ── UI State ──

    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload, selectedVisualId: action.payload === 'editor' ? state.selectedVisualId : null };

    case 'TOGGLE_DATA_PANEL':
      return { ...state, dataPanelVisible: !state.dataPanelVisible };

    case 'TOGGLE_PROPERTIES_PANEL':
      return { ...state, propertiesPanelVisible: !state.propertiesPanelVisible };

    case 'TOGGLE_FILTERS_PANEL':
      return { ...state, filtersPanelVisible: !state.filtersPanelVisible };

    case 'COLLAPSE_DATA_PANEL':
      return { ...state, dataPanelCollapsed: true };

    case 'COLLAPSE_PROPERTIES_PANEL':
      return { ...state, propertiesPanelCollapsed: true };

    case 'COLLAPSE_FILTERS_PANEL':
      return { ...state, filtersPanelCollapsed: true };

    case 'EXPAND_DATA_PANEL':
      return { ...state, dataPanelCollapsed: false };

    case 'EXPAND_PROPERTIES_PANEL':
      return { ...state, propertiesPanelCollapsed: false };

    case 'EXPAND_FILTERS_PANEL':
      return { ...state, filtersPanelCollapsed: false };

    case 'TOGGLE_SELECTION_PANE':
      return { ...state, selectionPaneVisible: !state.selectionPaneVisible };

    case 'SET_DATA_PANEL_WIDTH':
      return { ...state, dataPanelWidth: Math.max(180, Math.min(450, action.payload)) };

    case 'SET_PROPERTIES_PANEL_WIDTH':
      return { ...state, propertiesPanelWidth: Math.max(220, Math.min(500, action.payload)) };

    case 'SET_FILTERS_PANEL_WIDTH':
      return { ...state, filtersPanelWidth: Math.max(180, Math.min(450, action.payload)) };

    case 'SET_CANVAS_ZOOM':
      return { ...state, canvasZoom: Math.max(0.1, Math.min(3, action.payload)) };

    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid };

    case 'SET_MODE':
      return { ...state, mode: action.payload };

    case 'SET_GLOBAL_FILTERS':
      return { ...pushUndo(state), globalFilters: action.payload, isDirty: true };

    case 'SET_PAGE_FILTERS':
      return {
        ...pushUndo(state),
        pageFilters: { ...state.pageFilters, [action.payload.pageId]: action.payload.filters },
        isDirty: true,
      };

    case 'SET_VISUAL_FILTERS':
      return {
        ...pushUndo(state),
        visualFilters: { ...state.visualFilters, [action.payload.visualId]: action.payload.filters },
        isDirty: true,
      };

    case 'SAVE_DASHBOARD':
      return { ...state, isSaving: true };

    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };

    case 'FOCUS_VISUAL':
      return { ...state, focusedVisualId: action.payload };

    case 'EXIT_FOCUS_MODE':
      return { ...state, focusedVisualId: null };

    case 'SET_PENDING_FILTER_DROP':
      return { ...state, pendingFilterDrop: action.payload };

    case 'OPEN_MEASURE_EDITOR':
      return { ...state, measureEditorOpen: true, editingMeasureId: action.payload ?? null };

    case 'CLOSE_MEASURE_EDITOR':
      return { ...state, measureEditorOpen: false, editingMeasureId: null };

    case 'ADD_MEASURE': {
      if (!state.dataModel) return state;
      const newMeasure = {
        id: `measure-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: action.payload.name,
        expression: action.payload.expression,
        format: action.payload.format,
        decimalPlaces: action.payload.decimalPlaces,
        folderId: action.payload.folderId,
      };
      const newDataModel = { ...state.dataModel, measures: [...(state.dataModel.measures || []), newMeasure] };
      return { ...state, dataModel: newDataModel, isDirty: true };
    }

    case 'UPDATE_MEASURE': {
      if (!state.dataModel) return state;
      const measures = (state.dataModel.measures || []).map(m =>
        m.id === action.payload.id ? { ...m, ...action.payload } : m
      );
      return { ...state, dataModel: { ...state.dataModel, measures }, isDirty: true };
    }

    case 'REMOVE_MEASURE': {
      if (!state.dataModel) return state;
      const measures = (state.dataModel.measures || []).filter(m => m.id !== action.payload);
      return { ...state, dataModel: { ...state.dataModel, measures }, isDirty: true };
    }

    case 'ADD_MEASURE_FOLDER': {
      if (!state.dataModel) return state;
      const newFolder = {
        id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: action.payload.name,
        parentId: action.payload.parentId,
      };
      const folders = [...(state.dataModel.measureFolders || []), newFolder];
      return { ...state, dataModel: { ...state.dataModel, measureFolders: folders }, isDirty: true };
    }

    case 'RENAME_MEASURE_FOLDER': {
      if (!state.dataModel) return state;
      const folders = (state.dataModel.measureFolders || []).map(f =>
        f.id === action.payload.id ? { ...f, name: action.payload.name } : f
      );
      return { ...state, dataModel: { ...state.dataModel, measureFolders: folders }, isDirty: true };
    }

    case 'REMOVE_MEASURE_FOLDER': {
      if (!state.dataModel) return state;
      const folders = (state.dataModel.measureFolders || []).filter(f => f.id !== action.payload);
      return { ...state, dataModel: { ...state.dataModel, measureFolders: folders }, isDirty: true };
    }

    default:
      return state;
  }
}

export function getInitialState(mode: 'editor' | 'viewer'): StudioState {
  const page = createDefaultPage();
  return {
    ...initialStudioState,
    mode,
    pages: [page],
    activePageId: page.id,
  };
}

interface StudioContextValue {
  state: StudioState;
  dispatch: React.Dispatch<StudioAction>;
  getActivePage: () => ReturnType<typeof getActivePage>;
  getSelectedVisual: () => ReturnType<typeof getVisualFromPage>;
  canUndo: boolean;
  canRedo: boolean;
}

const StudioContext = createContext<StudioContextValue | null>(null);

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

  const getActivePageCb = useCallback(() => {
    return getActivePage(stateRef.current);
  }, []);

  const getSelectedVisualCb = useCallback(() => {
    if (!stateRef.current.selectedVisualId) return null;
    return getVisualFromPage(stateRef.current, stateRef.current.selectedVisualId);
  }, []);

  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;

  return (
    <StudioContext.Provider value={{
      state,
      dispatch,
      getActivePage: getActivePageCb,
      getSelectedVisual: getSelectedVisualCb,
      canUndo,
      canRedo,
    }}>
      {children}
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

export { getActivePage, getVisualFromPage };
