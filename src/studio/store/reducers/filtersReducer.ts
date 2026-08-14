import { pushUndo } from '../undo-middleware';
import type { StudioState, StudioAction } from '../../types/state';

export function filtersReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
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

    case 'TOGGLE_SYNCED_FILTER': {
      const { tableName, columnName } = action.payload;
      const existing = state.syncedFilters.find(
        f => f.tableName === tableName && f.columnName === columnName
      );
      const newSynced = existing
        ? state.syncedFilters.filter(
            f => !(f.tableName === tableName && f.columnName === columnName)
          )
        : [...state.syncedFilters, { tableName, columnName }];
      return { ...pushUndo(state), syncedFilters: newSynced, isDirty: true };
    }

    case 'APPLY_SYNCED_FILTERS': {
      const { pageId, filters } = action.payload;
      const newPageFilters = { ...state.pageFilters };

      filters.forEach(newFilter => {
        const existing = (newPageFilters[pageId] || []).find(
          f => f.tableName === newFilter.tableName && f.columnName === newFilter.columnName
        );

        if (!existing) {
          newPageFilters[pageId] = [...(newPageFilters[pageId] || []), newFilter];
        }
      });

      return { ...state, pageFilters: newPageFilters, isDirty: true };
    }

    default:
      return state;
  }
}
