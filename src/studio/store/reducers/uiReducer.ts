import type { StudioState, StudioAction } from '../../types/state';
import { initialStudioState } from '../../types/state';
import { createDefaultPage } from '../../types/dashboard';
import { performUndo, performRedo, pushUndo } from '../undo-middleware';

export function uiReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    // Dashboard metadata
    case 'LOAD_DASHBOARD': {
      const loaded = { ...initialStudioState, ...action.payload };
      if (loaded.pages.length === 0) {
        const defaultPage = createDefaultPage();
        loaded.pages = [defaultPage];
        loaded.activePageId = defaultPage.id;
      }
      if (!loaded.activePageId && loaded.pages.length > 0) {
        loaded.activePageId = loaded.pages[0].id;
      }
      return loaded;
    }

    case 'SET_DASHBOARD_NAME':
      return { ...state, dashboardName: action.payload, isDirty: true };

    case 'SET_DASHBOARD_DESCRIPTION':
      return { ...state, dashboardDescription: action.payload, isDirty: true };

    case 'MARK_CLEAN':
      return { ...state, isDirty: false };

    // Undo/redo
    case 'UNDO':
      return performUndo(state);

    case 'REDO':
      return performRedo(state);

    case 'PUSH_SNAPSHOT':
      return pushUndo(state);

    // View/panel visibility
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload, selectedVisualId: action.payload === 'editor' ? state.selectedVisualId : null, selectedVisualIds: [] };

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

    case 'COLLAPSE_SELECTION_PANE':
      return { ...state, selectionPaneCollapsed: true };

    case 'EXPAND_SELECTION_PANE':
      return { ...state, selectionPaneCollapsed: false };

    case 'EXPAND_DATA_PANEL':
      return { ...state, dataPanelCollapsed: false };

    case 'EXPAND_PROPERTIES_PANEL':
      return { ...state, propertiesPanelCollapsed: false };

    case 'EXPAND_FILTERS_PANEL':
      return { ...state, filtersPanelCollapsed: false };

    case 'TOGGLE_SELECTION_PANE':
      return { ...state, selectionPaneVisible: !state.selectionPaneVisible };

    // Panel widths
    case 'SET_DATA_PANEL_WIDTH':
      return { ...state, dataPanelWidth: Math.max(180, Math.min(450, action.payload)) };

    case 'SET_PROPERTIES_PANEL_WIDTH':
      return { ...state, propertiesPanelWidth: Math.max(180, Math.min(500, action.payload)) };

    case 'SET_FILTERS_PANEL_WIDTH':
      return { ...state, filtersPanelWidth: Math.max(180, Math.min(450, action.payload)) };

    // Canvas/mode
    case 'SET_CANVAS_ZOOM':
      return { ...state, canvasZoom: Math.max(0.1, Math.min(3, action.payload)) };

    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid };

    case 'SET_MODE':
      return { ...state, mode: action.payload };

    // Persistence
    case 'SAVE_DASHBOARD':
      return { ...state, isSaving: true };

    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };

    case 'SET_LAST_SAVED_AT':
      return { ...state, lastSavedAt: action.payload };

    // Focus mode
    case 'FOCUS_VISUAL':
      return { ...state, focusedVisualId: action.payload };

    case 'EXIT_FOCUS_MODE':
      return { ...state, focusedVisualId: null };

    // Misc
    case 'SET_PENDING_FILTER_DROP':
      return { ...state, pendingFilterDrop: action.payload };

    case 'OPEN_MEASURE_EDITOR':
      return {
        ...state,
        measureEditorOpen: true,
        editingMeasureId: action.payload ?? null,
        newMeasureIsTemporary: action.isTemporary ?? false,
      };

    case 'CLOSE_MEASURE_EDITOR':
      return { ...state, measureEditorOpen: false, editingMeasureId: null };

    case 'OPEN_IMPORT_DIALOG':
      return { ...state, importDialogOpen: true };

    case 'CLOSE_IMPORT_DIALOG':
      return { ...state, importDialogOpen: false };

    case 'SET_SQL_RUNNER_STATE':
      return {
        ...state,
        sqlRunnerEditorTabs: action.payload.editorTabs,
        sqlRunnerActiveEditorTab: action.payload.activeEditorTab,
        sqlRunnerManualSql: action.payload.manualSql,
        sqlRunnerResultTabs: action.payload.resultTabs,
        sqlRunnerActiveResultTab: action.payload.activeResultTab,
      };

    case 'SAVE_VIEWER_STATE': {
      const viewerState = {
        pages: state.pages,
        activePageId: state.activePageId,
        dataModel: state.dataModel,
        dashboardName: state.dashboardName,
        dashboardDescription: state.dashboardDescription,
        globalFilters: state.globalFilters,
        pageFilters: state.pageFilters,
        visualFilters: state.visualFilters,
        queryResults: state.queryResults,
        textBoxes: state.textBoxes,
        syncedFilters: state.syncedFilters,
      };
      try {
        localStorage.setItem('studio_viewer_state', JSON.stringify(viewerState));
      } catch {
        // localStorage full or unavailable — continue anyway
      }
      return state;
    }

    default:
      return state;
  }
}
