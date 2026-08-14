import type { StudioState, StudioAction } from '../../types/state';
import type { TableSchema, FieldSchema, Relationship } from '../../types/dashboard';
import { pushUndo } from '../undo-middleware';
import { generateId } from '../../lib/generate-id';

export function dataModelReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'SET_DATA_MODEL':
      return { ...state, dataModel: action.payload, dataModelLoading: false, dataModelError: null };

    case 'TOGGLE_RELATIONSHIP_ACTIVE': {
      if (!state.dataModel) return state;
      const rel = state.dataModel.relationships.find(r => r.id === action.payload);
      if (!rel) return state;
      const newActive = rel.active === false ? true : false;
      const newDataModel = {
        ...state.dataModel,
        relationships: state.dataModel.relationships.map(r =>
          r.id === action.payload ? { ...r, active: newActive } : r
        ),
      };
      return { ...pushUndo(state), dataModel: newDataModel, isDirty: true };
    }

    case 'SET_DATA_MODEL_LOADING':
      return { ...state, dataModelLoading: action.payload };

    case 'SET_DATA_MODEL_ERROR':
      return { ...state, dataModelError: action.payload, dataModelLoading: false };

    case 'SET_QUERY_RESULT':
      return {
        ...state,
        queryResults: {
          ...state.queryResults,
          [action.payload.visualId]: action.payload.result,
        },
      };

    case 'SELECT_MEASURE':
      return { ...state, selectedMeasureId: action.payload };

    case 'ADD_MEASURE': {
      if (!state.dataModel) return state;
      const newMeasure = {
        id: generateId('measure'),
        name: action.payload.name,
        expression: action.payload.expression,
        format: action.payload.format,
        decimalPlaces: action.payload.decimalPlaces,
        folderId: action.payload.folderId,
        isTemporary: action.payload.isTemporary,
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
        id: generateId('folder'),
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

    case 'OPEN_CALCULATED_COLUMN_EDITOR': {
      return {
        ...state,
        calculatedColumnEditorOpen: true,
        editingCalculatedColumnId: action.payload || null,
        calculatedTableEditorOpen: false,
        editingCalculatedTableId: null,
      };
    }

    case 'CLOSE_CALCULATED_COLUMN_EDITOR': {
      return {
        ...state,
        calculatedColumnEditorOpen: false,
        editingCalculatedColumnId: null,
      };
    }

    case 'ADD_CALCULATED_COLUMN': {
      const newColumn = {
        id: generateId('ccol'),
        name: action.payload.name,
        tableName: action.payload.tableName,
        expression: action.payload.expression,
        dataType: action.payload.dataType,
      };
      return {
        ...pushUndo(state),
        calculatedColumns: [...state.calculatedColumns, newColumn],
        isDirty: true,
      };
    }

    case 'UPDATE_CALCULATED_COLUMN': {
      return {
        ...pushUndo(state),
        calculatedColumns: state.calculatedColumns.map(col =>
          col.id === action.payload.id ? { ...col, ...action.payload } : col
        ),
        isDirty: true,
      };
    }

    case 'REMOVE_CALCULATED_COLUMN': {
      return {
        ...pushUndo(state),
        calculatedColumns: state.calculatedColumns.filter(col => col.id !== action.payload),
        isDirty: true,
      };
    }

    case 'OPEN_CALCULATED_TABLE_EDITOR': {
      return {
        ...state,
        calculatedTableEditorOpen: true,
        editingCalculatedTableId: action.payload || null,
        calculatedColumnEditorOpen: false,
        editingCalculatedColumnId: null,
      };
    }

    case 'CLOSE_CALCULATED_TABLE_EDITOR': {
      return {
        ...state,
        calculatedTableEditorOpen: false,
        editingCalculatedTableId: null,
      };
    }

    case 'ADD_CALCULATED_TABLE': {
      const newTable = {
        id: generateId('ctab'),
        name: action.payload.name,
        expression: action.payload.expression,
        columns: action.payload.columns,
      };
      return {
        ...pushUndo(state),
        calculatedTables: [...state.calculatedTables, newTable],
        isDirty: true,
      };
    }

    case 'UPDATE_CALCULATED_TABLE': {
      return {
        ...pushUndo(state),
        calculatedTables: state.calculatedTables.map(table =>
          table.id === action.payload.id ? { ...table, ...action.payload } : table
        ),
        isDirty: true,
      };
    }

    case 'REMOVE_CALCULATED_TABLE': {
      return {
        ...pushUndo(state),
        calculatedTables: state.calculatedTables.filter(table => table.id !== action.payload),
        isDirty: true,
      };
    }

    case 'SET_MODEL_VIEW_TABS':
      return { ...state, modelViewTabs: action.payload, isDirty: true };

    case 'SET_ACTIVE_MODEL_VIEW_TAB':
      return { ...state, activeModelViewTab: action.payload };

    case 'ADD_MODEL_VIEW_TAB': {
      const newTab = {
        id: generateId('model-tab'),
        name: action.payload.name,
        tablePositions: [],
        zoom: 1,
        pan: { x: 0, y: 0 },
        visibleTables: [],
      };
      return {
        ...state,
        modelViewTabs: [...state.modelViewTabs, newTab],
        activeModelViewTab: newTab.id,
        isDirty: true,
      };
    }

    case 'RENAME_MODEL_VIEW_TAB':
      return {
        ...state,
        modelViewTabs: state.modelViewTabs.map(t =>
          t.id === action.payload.id ? { ...t, name: action.payload.name } : t
        ),
        isDirty: true,
      };

    case 'REMOVE_MODEL_VIEW_TAB': {
      if (state.modelViewTabs.length <= 1) return state;
      const remaining = state.modelViewTabs.filter(t => t.id !== action.payload);
      const newActive = state.activeModelViewTab === action.payload
        ? remaining[0].id
        : state.activeModelViewTab;
      return { ...state, modelViewTabs: remaining, activeModelViewTab: newActive, isDirty: true };
    }

    case 'UPDATE_MODEL_VIEW_TAB':
      return {
        ...state,
        modelViewTabs: state.modelViewTabs.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload.changes } : t
        ),
        isDirty: true,
      };

    case 'ADD_TABLE_TO_MODEL': {
      if (!state.dataModel) return state;
      const { table, position, tabId } = action.payload;
      
      if (state.dataModel.tables.some(t => t.name === table.name)) return state;
      
      const tabIndex = state.modelViewTabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) return state;
      
      const newTables = [...state.dataModel.tables, table];
      const newRelationships = [...state.dataModel.relationships];
      
      newTables.forEach((t: TableSchema) => {
        table.fields.forEach((newField: FieldSchema) => {
          t.fields.forEach((existingField: FieldSchema) => {
            if (newField.name === existingField.name && newField.type === existingField.type) {
              if (table.type === 'fact' && t.type === 'dimension') {
                newRelationships.push({
                  id: generateId('rel'),
                  fromTable: table.name,
                  fromField: newField.name,
                  toTable: t.name,
                  toField: existingField.name,
                  cardinality: 'N:1',
                  active: true,
                });
              } else if (table.type === 'dimension' && t.type === 'fact') {
                newRelationships.push({
                  id: generateId('rel'),
                  fromTable: t.name,
                  fromField: existingField.name,
                  toTable: table.name,
                  toField: newField.name,
                  cardinality: 'N:1',
                  active: true,
                });
              }
            }
          });
        });
      });
      
      const updatedTabs = state.modelViewTabs.map((t, i) => 
        i === tabIndex ? {
          ...t,
          tablePositions: [...t.tablePositions, { id: table.name, ...position }],
          visibleTables: t.visibleTables !== undefined
            ? [...t.visibleTables, table.name]
            : t.visibleTables,
        } : t
      );
      
      return {
        ...pushUndo(state),
        dataModel: { ...state.dataModel, tables: newTables, relationships: newRelationships },
        modelViewTabs: updatedTabs,
        isDirty: true,
      };
    }

    case 'REMOVE_TABLE_FROM_MODEL': {
      if (!state.dataModel) return state;
      const { tableName, tabId } = action.payload;
      
      const newTables = state.dataModel.tables.filter(t => t.name !== tableName);
      const newRelationships = state.dataModel.relationships.filter(
        r => r.fromTable !== tableName && r.toTable !== tableName
      );
      
      const tabIndex = state.modelViewTabs.findIndex(t => t.id === tabId);
      const updatedTabs = state.modelViewTabs.map((t, i) => 
        i === tabIndex ? {
          ...t,
          tablePositions: t.tablePositions.filter(p => p.id !== tableName),
          visibleTables: t.visibleTables !== undefined
            ? t.visibleTables.filter(n => n !== tableName)
            : t.visibleTables,
        } : t
      );
      
      return {
        ...pushUndo(state),
        dataModel: { ...state.dataModel, tables: newTables, relationships: newRelationships },
        modelViewTabs: updatedTabs,
        isDirty: true,
      };
    }

    case 'ADD_RELATIONSHIP': {
      if (!state.dataModel) return state;
      const { payload } = action;
      
      const exists = state.dataModel.relationships.some(
        r => r.fromTable === payload.fromTable && r.fromField === payload.fromField &&
             r.toTable === payload.toTable && r.toField === payload.toField
      );
      if (exists) return state;
      
      return {
        ...pushUndo(state),
        dataModel: { ...state.dataModel, relationships: [...state.dataModel.relationships, payload] },
        isDirty: true,
      };
    }

    case 'RENAME_TABLE': {
      if (!state.dataModel) return state;
      const { tableName, newLabel } = action.payload;
      return {
        ...pushUndo(state),
        dataModel: {
          ...state.dataModel,
          tables: state.dataModel.tables.map(t =>
            t.name === tableName ? { ...t, label: newLabel } : t
          ),
        },
        isDirty: true,
      };
    }

    case 'RENAME_FIELD': {
      if (!state.dataModel) return state;
      const { tableName, fieldName, newLabel } = action.payload;
      return {
        ...pushUndo(state),
        dataModel: {
          ...state.dataModel,
          tables: state.dataModel.tables.map(t =>
            t.name === tableName
              ? { ...t, fields: t.fields.map(f => f.name === fieldName ? { ...f, label: newLabel } : f) }
              : t
          ),
        },
        isDirty: true,
      };
    }

    case 'HIDE_FIELD': {
      if (!state.dataModel) return state;
      const { tableName, fieldName } = action.payload;
      return {
        ...pushUndo(state),
        dataModel: {
          ...state.dataModel,
          tables: state.dataModel.tables.map(t =>
            t.name === tableName
              ? { ...t, fields: t.fields.map(f => f.name === fieldName ? { ...f, hidden: true } : f) }
              : t
          ),
        },
        isDirty: true,
      };
    }

    case 'UNHIDE_FIELD': {
      if (!state.dataModel) return state;
      const { tableName, fieldName } = action.payload;
      return {
        ...pushUndo(state),
        dataModel: {
          ...state.dataModel,
          tables: state.dataModel.tables.map(t =>
            t.name === tableName
              ? { ...t, fields: t.fields.map(f => f.name === fieldName ? { ...f, hidden: false } : f) }
              : t
          ),
        },
        isDirty: true,
      };
    }

    case 'AUTO_DETECT_RELATIONSHIPS': {
      if (!state.dataModel) return state;
      const newRelationships: Relationship[] = [];
      
      state.dataModel.tables.forEach(table => {
        state.dataModel!.tables.forEach(otherTable => {
          if (table.name === otherTable.name) return;
          
          table.fields.forEach(field => {
            otherTable.fields.forEach(otherField => {
              const isMatch = 
                field.name === otherField.name && field.name.includes('_id') ||
                field.name === `${otherTable.name}_id` && otherField.name === 'id' ||
                otherField.name === `${table.name}_id` && field.name === 'id';
              
              if (isMatch) {
                const exists = state.dataModel!.relationships.some(
                  r => (r.fromTable === table.name && r.fromField === field.name && r.toTable === otherTable.name && r.toField === otherField.name) ||
                       (r.fromTable === otherTable.name && r.fromField === otherField.name && r.toTable === table.name && r.toField === field.name)
                );
                
                if (!exists) {
                  let cardinality: '1:N' | 'N:1' = 'N:1';
                  if (table.type === 'fact' && otherTable.type === 'dimension') {
                    cardinality = 'N:1';
                  } else if (table.type === 'dimension' && otherTable.type === 'fact') {
                    cardinality = '1:N';
                  }
                  
                  newRelationships.push({
                    id: generateId('rel'),
                    fromTable: table.type === 'fact' ? table.name : otherTable.name,
                    fromField: table.type === 'fact' ? field.name : otherField.name,
                    toTable: table.type === 'fact' ? otherTable.name : table.name,
                    toField: table.type === 'fact' ? otherField.name : field.name,
                    cardinality,
                    active: true,
                  });
                }
              }
            });
          });
        });
      });
      
      if (newRelationships.length === 0) return state;
      
      return {
        ...pushUndo(state),
        dataModel: {
          ...state.dataModel,
          relationships: [...state.dataModel.relationships, ...newRelationships],
        },
        isDirty: true,
      };
    }

    case 'UPDATE_RELATIONSHIP': {
      if (!state.dataModel) return state;
      const { id, changes } = action.payload;
      return {
        ...pushUndo(state),
        dataModel: {
          ...state.dataModel,
          relationships: state.dataModel.relationships.map(r =>
            r.id === id ? { ...r, ...changes } : r
          ),
        },
        isDirty: true,
      };
    }

    case 'REMOVE_RELATIONSHIP': {
      if (!state.dataModel) return state;
      return {
        ...pushUndo(state),
        dataModel: {
          ...state.dataModel,
          relationships: state.dataModel.relationships.filter(r => r.id !== action.payload),
        },
        isDirty: true,
      };
    }

    default:
      return state;
  }
}
