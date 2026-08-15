import type { StudioState, StudioAction } from '../../types/state';
import { createDefaultVisual } from '../../types/dashboard';
import { pushUndo } from '../undo-middleware';
import { clampToCanvas, snapToGrid } from '../../types/canvas';
import { generateId } from '../../lib/generate-id';
import { getActivePageIndex, getSelectedIds, getMaxZIndex, updateVisualInState, updatePageVisuals } from './index';

export function visualsReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'ADD_VISUAL': {
      const pageIndex = getActivePageIndex(state);
      if (pageIndex === -1) return state;

      const page = state.pages[pageIndex];
      const maxZ = getMaxZIndex(state);
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
      const pageIndex = getActivePageIndex(state);
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
      const pageIndex = getActivePageIndex(state);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];
      const ids = getSelectedIds(state);
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

    case 'BRING_VISUAL_TO_FRONT': {
      const maxZ = getMaxZIndex(state);
      const next = updatePageVisuals(state, visuals =>
        visuals.map(v => v.id === action.payload ? { ...v, zIndex: maxZ + 1 } : v)
      );
      return pushUndo({ ...next, isDirty: true });
    }

    case 'SEND_VISUAL_TO_BACK': {
      const page = state.pages[getActivePageIndex(state)];
      const minZ = page.visuals.reduce((min, v) => Math.min(min, v.zIndex), Infinity);
      const next = updatePageVisuals(state, visuals =>
        visuals.map(v => v.id === action.payload ? { ...v, zIndex: Math.max(0, minZ - 1) } : v)
      );
      return pushUndo({ ...next, isDirty: true });
    }

    case 'DUPLICATE_VISUAL': {
      const pageIndex = getActivePageIndex(state);
      if (pageIndex === -1) return state;

      const page = state.pages[pageIndex];
      const original = page.visuals.find(v => v.id === action.payload);
      if (!original) return state;

      const maxZ = getMaxZIndex(state);
      const duplicate = {
        ...structuredClone(original),
        id: generateId('visual'),
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
      const pageIndex = getActivePageIndex(state);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];
      const ids = getSelectedIds(state);
      if (ids.length === 0) return state;

      const originals = page.visuals.filter(v => ids.includes(v.id));
      const maxZ = getMaxZIndex(state);
      const newDuplicates = originals.map((v, i) => ({
        ...structuredClone(v),
        id: generateId('visual'),
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
      const pageIdx = getActivePageIndex(state);
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
      const pageIdx = getActivePageIndex(state);
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
      const ids = getSelectedIds(state);
      if (ids.length === 0) return state;

      const pageIndex = getActivePageIndex(state);
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
      const pageIndex = getActivePageIndex(state);
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
      const pageIndex = getActivePageIndex(state);
      if (pageIndex === -1) return state;
      const maxZ = getMaxZIndex(state);
      return updateVisualInState(pushUndo(state), action.payload, v => ({
        ...v,
        zIndex: maxZ + 1,
      }));
    }

    case 'SEND_TO_BACK': {
      const pageIndex = getActivePageIndex(state);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];
      const minZ = page.visuals.reduce((min, v) => Math.min(min, v.zIndex), 0);
      return updateVisualInState(pushUndo(state), action.payload, v => ({
        ...v,
        zIndex: minZ - 1,
      }));
    }

    case 'BRING_FORWARD': {
      const pageIndex = getActivePageIndex(state);
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
      const pageIndex = getActivePageIndex(state);
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
      const pageIdx = getActivePageIndex(state);
      if (pageIdx === -1) return state;
      const allLocked = state.pages[pageIdx].visuals.every(v => v.locked);
      const next = updatePageVisuals(state, visuals => visuals.map(v => ({ ...v, locked: !allLocked })));
      return pushUndo(next);
    }

    case 'SET_CLIPBOARD':
      return { ...state, clipboard: action.payload };

    case 'PASTE_VISUAL': {
      if (!state.clipboard) return state;
      const pageIndex = getActivePageIndex(state);
      if (pageIndex === -1) return state;
      const page = state.pages[pageIndex];
      const maxZ = getMaxZIndex(state);
      const duplicate = {
        ...structuredClone(state.clipboard),
        id: generateId('visual'),
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
      const next = updatePageVisuals(state, visuals => {
        const sorted = [...visuals].sort((a, b) => b.zIndex - a.zIndex);
        const [moved] = sorted.splice(action.payload.fromIndex, 1);
        sorted.splice(action.payload.toIndex, 0, moved);
        return sorted.map((v, i) => ({ ...v, zIndex: sorted.length - i }));
      });
      return pushUndo(next);
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
      const ids = state.selectedVisualIds;
      if (ids.length < 2) return state;
      const newGroupId = generateId('group');
      const next = updatePageVisuals(state, visuals =>
        visuals.map(v => ids.includes(v.id) ? { ...v, groupId: newGroupId } : v)
      );
      return pushUndo({ ...next, groupCounter: state.groupCounter + 1 });
    }

    case 'UNGROUP_SELECTED_VISUALS': {
      const ids = state.selectedVisualIds;
      const page = state.pages[getActivePageIndex(state)];
      const groupIds = new Set<string>();
      page.visuals.forEach(v => {
        if (ids.includes(v.id) && v.groupId) groupIds.add(v.groupId);
      });
      if (groupIds.size === 0) return state;
      const next = updatePageVisuals(state, visuals =>
        visuals.map(v => (v.groupId && groupIds.has(v.groupId)) ? { ...v, groupId: undefined } : v)
      );
      return pushUndo(next);
    }

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

    default:
      return state;
  }
}
