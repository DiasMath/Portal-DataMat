import type { DataModel, DashboardPage, Visual, VisualQueryState, CanvasTextBox, CalculatedColumn, CalculatedTable, ModelViewTab, TableSchema, FieldSchema, Relationship } from './dashboard';
import type { BucketField, FilterCondition, VisualType, VisualBuckets } from './visuals';
import { MOCK_DATA_MODEL } from '../lib/mocks/mock-data';

export type StudioSnapshot = Pick<StudioState, 'pages' | 'activePageId' | 'globalFilters' | 'pageFilters' | 'visualFilters' | 'dashboardName' | 'dashboardDescription'>;

export type CloseAction = Extract<StudioAction, { type: `CLOSE_${string}` }>['type'];

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
  syncedFilters: { tableName: string; columnName: string }[];

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
  selectionPaneCollapsed: boolean;
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
  lastSavedAt: string | null;
  mode: 'editor' | 'viewer';
  clipboard: Visual | null;
  pendingFilterDrop: { sectionId: string; tableName: string; columnName: string } | null;
  measureEditorOpen: boolean;
  /** Whether the measure being created is temporary */
  newMeasureIsTemporary: boolean;
  editingMeasureId: string | null;
  selectedMeasureId: string | null;
  selectedTextBoxId: string | null;
  textBoxes: CanvasTextBox[];

  // Calculated columns and tables
  calculatedColumns: CalculatedColumn[];
  calculatedTables: CalculatedTable[];
  calculatedColumnEditorOpen: boolean;
  editingCalculatedColumnId: string | null;
  calculatedTableEditorOpen: boolean;
  editingCalculatedTableId: string | null;

  modelViewTabs: ModelViewTab[];
  activeModelViewTab: string;
  importDialogOpen: boolean;

  // SQL Runner persisted state
  sqlRunnerEditorTabs: { id: string; name: string; sql: string }[];
  sqlRunnerActiveEditorTab: string;
  sqlRunnerManualSql: string;
  sqlRunnerResultTabs: { id: string; name: string; sql: string; result: { columns: string[]; rows: Record<string, unknown>[]; executionTime: number }; createdAt: number }[];
  sqlRunnerActiveResultTab: string | null;

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

  dataModel: MOCK_DATA_MODEL,
  dataModelLoading: false,
  dataModelError: null,

  globalFilters: [],
  pageFilters: {},
  visualFilters: {},
  syncedFilters: [],

  queryResults: {},

  selectedVisualId: null,
  selectedVisualIds: [],
  activeView: 'editor',
  dataPanelCollapsed: false,
  propertiesPanelCollapsed: false,
  filtersPanelCollapsed: true,
  dataPanelVisible: true,
  propertiesPanelVisible: true,
  filtersPanelVisible: true,
  selectionPaneVisible: false,
  selectionPaneCollapsed: false,
  crossFilter: null,
  drillStates: {},
  groupCounter: 0,
  dataPanelWidth: 200,
  propertiesPanelWidth: 180,
  filtersPanelWidth: 200,
  canvasZoom: 0.7,
  showGrid: true,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  mode: 'editor',
  clipboard: null,
  pendingFilterDrop: null,
  measureEditorOpen: false,
  newMeasureIsTemporary: false,
  editingMeasureId: null,
  selectedMeasureId: null,
  selectedTextBoxId: null,
  textBoxes: [],

  calculatedColumns: [],
  calculatedTables: [],
  calculatedColumnEditorOpen: false,
  editingCalculatedColumnId: null,
  calculatedTableEditorOpen: false,
  editingCalculatedTableId: null,

  modelViewTabs: [
    {
      id: 'model-tab-default',
      name: 'Modelo completo',
      tablePositions: [],
      zoom: 1,
      pan: { x: 0, y: 0 },
    },
  ],
  activeModelViewTab: 'model-tab-default',
  importDialogOpen: false,

  sqlRunnerEditorTabs: [{ id: 'tab-1', name: 'Query 1', sql: '' }],
  sqlRunnerActiveEditorTab: 'tab-1',
  sqlRunnerManualSql: '',
  sqlRunnerResultTabs: [],
  sqlRunnerActiveResultTab: null,

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
  | { type: 'SET_PAGE_BACKGROUND_IMAGE'; payload: { pageId: string; backgroundImage?: string; backgroundImagePosition?: 'cover' | 'contain' | 'stretch' | 'center' } }

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
  | { type: 'BRING_VISUAL_TO_FRONT'; payload: string }
  | { type: 'SEND_VISUAL_TO_BACK'; payload: string }
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
  | { type: 'COLLAPSE_SELECTION_PANE' }
  | { type: 'EXPAND_SELECTION_PANE' }
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
  | { type: 'TOGGLE_SYNCED_FILTER'; payload: { tableName: string; columnName: string } }
  | { type: 'APPLY_SYNCED_FILTERS'; payload: { pageId: string; filters: FilterCondition[] } }
  | { type: 'SAVE_DASHBOARD' }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_LAST_SAVED_AT'; payload: string }
  | { type: 'FOCUS_VISUAL'; payload: string }
  | { type: 'EXIT_FOCUS_MODE' }
  | { type: 'SET_PENDING_FILTER_DROP'; payload: { sectionId: string; tableName: string; columnName: string } | null }
  | { type: 'OPEN_MEASURE_EDITOR'; payload?: string | null; isTemporary?: boolean }
  | { type: 'CLOSE_MEASURE_EDITOR' }
  | { type: 'SELECT_MEASURE'; payload: string | null }
  | { type: 'ADD_MEASURE'; payload: { name: string; expression: string; format?: string; decimalPlaces?: number; folderId?: string; isTemporary?: boolean } }
  | { type: 'UPDATE_MEASURE'; payload: { id: string; name?: string; expression?: string; format?: string; decimalPlaces?: number; folderId?: string } }
  | { type: 'REMOVE_MEASURE'; payload: string }
  | { type: 'ADD_MEASURE_FOLDER'; payload: { name: string; parentId?: string } }
  | { type: 'RENAME_MEASURE_FOLDER'; payload: { id: string; name: string } }
  | { type: 'REMOVE_MEASURE_FOLDER'; payload: string }

  // TextBox actions
  | { type: 'ADD_TEXT_BOX'; payload: { x: number; y: number } }
  | { type: 'REMOVE_TEXT_BOX'; payload: string }
  | { type: 'UPDATE_TEXT_BOX'; payload: { id: string; updates: Partial<CanvasTextBox> } }
  | { type: 'SELECT_TEXT_BOX'; payload: string | null }
  | { type: 'MOVE_TEXT_BOX'; payload: { id: string; x: number; y: number } }
  | { type: 'RESIZE_TEXT_BOX'; payload: { id: string; width: number; height: number } }
  | { type: 'BRING_TEXT_BOX_TO_FRONT'; payload: string }
  | { type: 'SEND_TEXT_BOX_TO_BACK'; payload: string }

  // Calculated Column actions
  | { type: 'OPEN_CALCULATED_COLUMN_EDITOR'; payload?: string | null }
  | { type: 'CLOSE_CALCULATED_COLUMN_EDITOR' }
  | { type: 'ADD_CALCULATED_COLUMN'; payload: { name: string; tableName: string; expression: string; dataType: 'string' | 'number' | 'date' | 'boolean' } }
  | { type: 'UPDATE_CALCULATED_COLUMN'; payload: { id: string; name?: string; tableName?: string; expression?: string; dataType?: 'string' | 'number' | 'date' | 'boolean' } }
  | { type: 'REMOVE_CALCULATED_COLUMN'; payload: string }

  // Calculated Table actions
  | { type: 'OPEN_CALCULATED_TABLE_EDITOR'; payload?: string | null }
  | { type: 'CLOSE_CALCULATED_TABLE_EDITOR' }
  | { type: 'ADD_CALCULATED_TABLE'; payload: { name: string; expression: string; columns: { name: string; type: string }[] } }
  | { type: 'UPDATE_CALCULATED_TABLE'; payload: { id: string; name?: string; expression?: string; columns?: { name: string; type: string }[] } }
  | { type: 'REMOVE_CALCULATED_TABLE'; payload: string }

  // Model View Tab actions
  | { type: 'SET_MODEL_VIEW_TABS'; payload: ModelViewTab[] }
  | { type: 'SET_ACTIVE_MODEL_VIEW_TAB'; payload: string }
  | { type: 'ADD_MODEL_VIEW_TAB'; payload: { name: string } }
  | { type: 'RENAME_MODEL_VIEW_TAB'; payload: { id: string; name: string } }
  | { type: 'REMOVE_MODEL_VIEW_TAB'; payload: string }
  | { type: 'UPDATE_MODEL_VIEW_TAB'; payload: { id: string; changes: Partial<ModelViewTab> } }

  // SQL Runner state
  | { type: 'SET_SQL_RUNNER_STATE'; payload: { editorTabs: { id: string; name: string; sql: string }[]; activeEditorTab: string; manualSql: string; resultTabs: { id: string; name: string; sql: string; result: { columns: string[]; rows: Record<string, unknown>[]; executionTime: number }; createdAt: number }[]; activeResultTab: string | null } }

  // Import Dialog
  | { type: 'OPEN_IMPORT_DIALOG' }
  | { type: 'CLOSE_IMPORT_DIALOG' }

  // Model View Table Management
  | { type: 'ADD_TABLE_TO_MODEL'; payload: { table: TableSchema; position: { x: number; y: number }; tabId: string } }
  | { type: 'REMOVE_TABLE_FROM_MODEL'; payload: { tableName: string; tabId: string } }
  | { type: 'ADD_RELATIONSHIP'; payload: Relationship }

  // Model View - Table/Field Management
  | { type: 'RENAME_TABLE'; payload: { tableName: string; newLabel: string } }
  | { type: 'RENAME_FIELD'; payload: { tableName: string; fieldName: string; newLabel: string } }
  | { type: 'HIDE_FIELD'; payload: { tableName: string; fieldName: string } }
  | { type: 'UNHIDE_FIELD'; payload: { tableName: string; fieldName: string } }
  | { type: 'AUTO_DETECT_RELATIONSHIPS' }
  | { type: 'UPDATE_RELATIONSHIP'; payload: { id: string; changes: Partial<Relationship> } }
  | { type: 'REMOVE_RELATIONSHIP'; payload: string }

  // Viewer state persistence
  | { type: 'SAVE_VIEWER_STATE' };
