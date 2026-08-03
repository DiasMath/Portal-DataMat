import type { DataModel, DashboardPage, Visual, VisualQueryState } from './dashboard';
import type { BucketField, FilterCondition, VisualType, VisualBuckets } from './visuals';

export type StudioSnapshot = Pick<StudioState, 'pages' | 'activePageId' | 'globalFilters' | 'pageFilters' | 'visualFilters' | 'dashboardName' | 'dashboardDescription'>;

export interface CrossFilter {
  sourceVisualId: string;
  fieldName: string;
  value: unknown;
}

export interface DrillState {
  level: number;
  path: { fieldName: string; value: unknown }[];
}

export interface StudioState {
  dashboardId: string | null;
  dashboardName: string;
  dashboardDescription: string;
  companyId: string | null;
  datasetId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  authorUid: string | null;

  pages: DashboardPage[];
  activePageId: string | null;
  focusedVisualId: string | null;

  dataModel: DataModel | null;
  dataModelLoading: boolean;
  dataModelError: string | null;

  globalFilters: FilterCondition[];
  pageFilters: Record<string, FilterCondition[]>;
  visualFilters: Record<string, FilterCondition[]>;

  queryResults: Record<string, VisualQueryState>;

  selectedVisualId: string | null;
  selectedVisualIds: string[];
  activeView: 'editor' | 'model' | 'sql' | 'data';
  dataPanelCollapsed: boolean;
  propertiesPanelCollapsed: boolean;
  filtersPanelCollapsed: boolean;
  dataPanelVisible: boolean;
  propertiesPanelVisible: boolean;
  filtersPanelVisible: boolean;
  selectionPaneVisible: boolean;
  crossFilter: CrossFilter | null;
  drillStates: Record<string, DrillState>;
  groupCounter: number;
  dataPanelWidth: number;
  propertiesPanelWidth: number;
  filtersPanelWidth: number;
  canvasZoom: number;
  showGrid: boolean;
  isDirty: boolean;
  isSaving: boolean;
  mode: 'editor' | 'viewer';
  clipboard: Visual | null;
  pendingFilterDrop: { sectionId: string; tableName: string; columnName: string } | null;
  measureEditorOpen: boolean;
  editingMeasureId: string | null;

  undoStack: StudioSnapshot[];
  redoStack: StudioSnapshot[];
}

export const initialStudioState: StudioState = {
  dashboardId: null,
  dashboardName: 'Novo Dashboard',
  dashboardDescription: '',
  companyId: null,
  datasetId: null,
  createdAt: null,
  updatedAt: null,
  authorUid: null,

  pages: [],
  activePageId: null,
  focusedVisualId: null,

  dataModel: null,
  dataModelLoading: false,
  dataModelError: null,

  globalFilters: [],
  pageFilters: {},
  visualFilters: {},

  queryResults: {},

  selectedVisualId: null,
  selectedVisualIds: [],
  activeView: 'editor',
  dataPanelCollapsed: false,
  propertiesPanelCollapsed: false,
  filtersPanelCollapsed: false,
  dataPanelVisible: true,
  propertiesPanelVisible: true,
  filtersPanelVisible: true,
  selectionPaneVisible: false,
  crossFilter: null,
  drillStates: {},
  groupCounter: 0,
  dataPanelWidth: 260,
  propertiesPanelWidth: 300,
  filtersPanelWidth: 260,
  canvasZoom: 1,
  showGrid: true,
  isDirty: false,
  isSaving: false,
  mode: 'editor',
  clipboard: null,
  pendingFilterDrop: null,
  measureEditorOpen: false,
  editingMeasureId: null,

  undoStack: [],
  redoStack: [],
};

export type StudioAction =
  | { type: 'LOAD_DASHBOARD'; payload: Partial<StudioState> }
  | { type: 'SET_DASHBOARD_NAME'; payload: string }
  | { type: 'SET_DASHBOARD_DESCRIPTION'; payload: string }
  | { type: 'MARK_CLEAN' }

  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'PUSH_SNAPSHOT' }

  | { type: 'ADD_PAGE'; payload?: { name?: string; pageWidth?: number; pageHeight?: number } }
  | { type: 'DUPLICATE_PAGE'; payload: string }
  | { type: 'REMOVE_PAGE'; payload: string }
  | { type: 'RENAME_PAGE'; payload: { id: string; name: string } }
  | { type: 'SET_ACTIVE_PAGE'; payload: string }
  | { type: 'REORDER_PAGES'; payload: string[] }
  | { type: 'SET_PAGE_SIZE'; payload: { pageId: string; width: number; height: number; preset?: string } }
  | { type: 'SET_PAGE_BACKGROUND'; payload: { pageId: string; background: string } }

  | { type: 'ADD_VISUAL'; payload: { type: VisualType; x: number; y: number } }
  | { type: 'REMOVE_VISUAL'; payload: string }
  | { type: 'REMOVE_SELECTED_VISUALS' }
  | { type: 'DUPLICATE_VISUAL'; payload: string }
  | { type: 'DUPLICATE_SELECTED_VISUALS' }
  | { type: 'SELECT_VISUAL'; payload: string | null }
  | { type: 'SELECT_VISUAL_MULTI'; payload: string }
  | { type: 'SELECT_ALL_VISUALS' }
  | { type: 'ALIGN_VISUALS'; payload: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v' }
  | { type: 'DISTRIBUTE_VISUALS'; payload: 'horizontal' | 'vertical' }
  | { type: 'MOVE_VISUAL'; payload: { id: string; x: number; y: number } }
  | { type: 'MOVE_SELECTED_VISUALS'; payload: { id: string; x: number; y: number } }
  | { type: 'RESIZE_VISUAL'; payload: { id: string; width: number; height: number } }
  | { type: 'UPDATE_VISUAL'; payload: { id: string; updates: Partial<Visual> } }
  | { type: 'NUDGE_VISUAL'; payload: { id: string; dx: number; dy: number } }
  | { type: 'BRING_TO_FRONT'; payload: string }
  | { type: 'SEND_TO_BACK'; payload: string }
  | { type: 'BRING_FORWARD'; payload: string }
  | { type: 'SEND_BACKWARD'; payload: string }
  | { type: 'TOGGLE_VISUAL_LOCK'; payload: string }
  | { type: 'TOGGLE_VISUAL_HIDDEN'; payload: string }
  | { type: 'TOGGLE_LOCK_ALL' }
  | { type: 'SET_CLIPBOARD'; payload: Visual | null }
  | { type: 'PASTE_VISUAL' }
  | { type: 'REORDER_VISUALS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SET_CROSS_FILTER'; payload: { sourceVisualId: string; fieldName: string; value: unknown } | null }
  | { type: 'CLEAR_CROSS_FILTER' }
  | { type: 'DRILL_DOWN'; payload: { visualId: string; fieldName: string; value: unknown } }
  | { type: 'DRILL_UP'; payload: string }
  | { type: 'GROUP_SELECTED_VISUALS' }
  | { type: 'UNGROUP_SELECTED_VISUALS' }

  | { type: 'SET_BUCKET_FIELD'; payload: { visualId: string; bucket: keyof VisualBuckets; field: BucketField | null; index?: number } }
  | { type: 'REMOVE_BUCKET_FIELD'; payload: { visualId: string; bucket: keyof VisualBuckets; index: number } }
  | { type: 'REORDER_BUCKET_FIELDS'; payload: { visualId: string; bucket: keyof VisualBuckets; fromIndex: number; toIndex: number } }

  | { type: 'SET_DATA_MODEL'; payload: DataModel }
  | { type: 'TOGGLE_RELATIONSHIP_ACTIVE'; payload: string }
  | { type: 'SET_DATA_MODEL_LOADING'; payload: boolean }
  | { type: 'SET_DATA_MODEL_ERROR'; payload: string | null }

  | { type: 'SET_QUERY_RESULT'; payload: { visualId: string; result: VisualQueryState } }

  | { type: 'SET_ACTIVE_VIEW'; payload: 'editor' | 'model' | 'sql' | 'data' }
  | { type: 'TOGGLE_DATA_PANEL' }
  | { type: 'TOGGLE_PROPERTIES_PANEL' }
  | { type: 'TOGGLE_FILTERS_PANEL' }
  | { type: 'COLLAPSE_DATA_PANEL' }
  | { type: 'COLLAPSE_PROPERTIES_PANEL' }
  | { type: 'COLLAPSE_FILTERS_PANEL' }
  | { type: 'EXPAND_DATA_PANEL' }
  | { type: 'EXPAND_PROPERTIES_PANEL' }
  | { type: 'EXPAND_FILTERS_PANEL' }
  | { type: 'TOGGLE_SELECTION_PANE' }
  | { type: 'SET_DATA_PANEL_WIDTH'; payload: number }
  | { type: 'SET_PROPERTIES_PANEL_WIDTH'; payload: number }
  | { type: 'SET_FILTERS_PANEL_WIDTH'; payload: number }
  | { type: 'SET_CANVAS_ZOOM'; payload: number }
  | { type: 'TOGGLE_GRID' }
  | { type: 'SET_MODE'; payload: 'editor' | 'viewer' }
  | { type: 'SET_GLOBAL_FILTERS'; payload: FilterCondition[] }
  | { type: 'SET_PAGE_FILTERS'; payload: { pageId: string; filters: FilterCondition[] } }
  | { type: 'SET_VISUAL_FILTERS'; payload: { visualId: string; filters: FilterCondition[] } }
  | { type: 'SAVE_DASHBOARD' }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'FOCUS_VISUAL'; payload: string }
  | { type: 'EXIT_FOCUS_MODE' }
  | { type: 'SET_PENDING_FILTER_DROP'; payload: { sectionId: string; tableName: string; columnName: string } | null }
  | { type: 'OPEN_MEASURE_EDITOR'; payload?: string | null }
  | { type: 'CLOSE_MEASURE_EDITOR' }
  | { type: 'ADD_MEASURE'; payload: { name: string; expression: string; format?: string; decimalPlaces?: number; folderId?: string } }
  | { type: 'UPDATE_MEASURE'; payload: { id: string; name?: string; expression?: string; format?: string; decimalPlaces?: number; folderId?: string } }
  | { type: 'REMOVE_MEASURE'; payload: string }
  | { type: 'ADD_MEASURE_FOLDER'; payload: { name: string; parentId?: string } }
  | { type: 'RENAME_MEASURE_FOLDER'; payload: { id: string; name: string } }
  | { type: 'REMOVE_MEASURE_FOLDER'; payload: string };
