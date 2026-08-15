import type { StudioState, StudioAction } from '../../types/state';
import type { DashboardPage } from '../../types/dashboard';
import { createDefaultPage } from '../../types/dashboard';
import { pushUndo } from '../undo-middleware';
import { generateId } from '../../lib/generate-id';

export function pagesReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'ADD_PAGE': {
      const nextPageNumber = state.pages.length + 1;
      const defaultName = `Página ${nextPageNumber}`;
      const newPage = createDefaultPage(action.payload?.name || defaultName, action.payload?.pageWidth, action.payload?.pageHeight);
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
        id: generateId('page'),
        name: `${sourcePage.name} (Cópia)`,
        order: state.pages.length,
        visuals: sourcePage.visuals.map(v => ({
          ...structuredClone(v),
          id: generateId('visual'),
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

    case 'SET_PAGE_BACKGROUND_IMAGE': {
      const pageIndex = state.pages.findIndex(p => p.id === action.payload.pageId);
      if (pageIndex === -1) return state;
      const newPages = [...state.pages];
      newPages[pageIndex] = {
        ...newPages[pageIndex],
        backgroundImage: action.payload.backgroundImage,
        backgroundImagePosition: action.payload.backgroundImagePosition ?? newPages[pageIndex].backgroundImagePosition,
      };
      return { ...pushUndo(state), pages: newPages, isDirty: true };
    }

    default:
      return state;
  }
}
