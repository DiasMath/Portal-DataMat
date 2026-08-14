'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useStudio } from '../../store/StudioContext';
import { toggleSet } from '../../lib/set-utils';
import { getDataModel } from '../../lib/data-model-utils';
import { generateId } from '../../lib/generate-id';
import { ImportDialog } from './ImportDialog';
import { RelationshipEditor } from './RelationshipEditor';
import { ModelViewSidebar } from './ModelViewSidebar';
import { ModelViewToolbar } from './ModelViewToolbar';
import { ModelViewCanvas } from './ModelViewCanvas';
import { useTablePositions, computeAutoLayout } from './useTablePositions';
import type { FieldSchema, Relationship, TableSchema } from '../../types/dashboard';
import { routeRelationshipLine, getFieldPosition as getFieldPositionUtil } from '../../lib/orthogonal-router';

const SNAP_SIZE = 10;
const snap = (v: number) => Math.round(v / SNAP_SIZE) * SNAP_SIZE;
const TABLE_WIDTH = 220;
const TABLE_HEIGHT_ESTIMATE = 280;

export function ModelView() {
  const { state, dispatch } = useStudio();
  const dataModel = getDataModel(state.dataModel);

  const activeTab = state.modelViewTabs.find(t => t.id === state.activeModelViewTab);
  const [tablePositions, setTablePositions] = useState(activeTab?.tablePositions || []);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);
  const [zoom, setZoom] = useState(activeTab?.zoom || 1);
  const [pan, setPan] = useState(activeTab?.pan || { x: 0, y: 0 });
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [dragOverCanvas, setDragOverCanvas] = useState(false);
  const [draggingField, setDraggingField] = useState<{ tableName: string; fieldName: string; field: FieldSchema } | null>(null);
  const [relationshipEditorOpen, setRelationshipEditorOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [collapsedTables, setCollapsedTables] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const getSortedFields = useCallback((table: TableSchema): FieldSchema[] => {
    const relationshipFieldNames = new Set<string>();
    dataModel.relationships.forEach(r => {
      if (r.fromTable === table.name) relationshipFieldNames.add(r.fromField);
      if (r.toTable === table.name) relationshipFieldNames.add(r.toField);
    });

    const visibleFields = table.fields.filter(f => !f.hidden);
    const hiddenFields = table.fields.filter(f => f.hidden);

    const sorted = [...visibleFields].sort((a, b) => {
      const aIsRel = relationshipFieldNames.has(a.name);
      const bIsRel = relationshipFieldNames.has(b.name);
      if (aIsRel && !bIsRel) return -1;
      if (!aIsRel && bIsRel) return 1;
      return 0;
    });

    return [...sorted, ...hiddenFields];
  }, [dataModel.relationships]);

  const { effectivePositions } = useTablePositions({
    tables: dataModel.tables,
    tablePositions,
    visibleTables: activeTab?.visibleTables,
  });

  const relatedTables = useMemo(() => {
    if (!hoveredTable) return new Set<string>();
    const related = new Set<string>();
    dataModel.relationships.forEach(r => {
      if (r.fromTable === hoveredTable) related.add(r.toTable);
      if (r.toTable === hoveredTable) related.add(r.fromTable);
    });
    return related;
  }, [hoveredTable, dataModel]);

  const selectedRelationshipFields = useMemo(() => {
    if (!selectedRelationship) return [];
    const rel = dataModel.relationships.find(r => r.id === selectedRelationship);
    if (!rel) return [];
    return [
      { tableName: rel.fromTable, fieldName: rel.fromField },
      { tableName: rel.toTable, fieldName: rel.toField },
    ];
  }, [selectedRelationship, dataModel.relationships]);

  const filteredTables = useMemo(() => {
    if (!sidebarSearch) return dataModel.tables;
    const search = sidebarSearch.toLowerCase();
    return dataModel.tables.filter(t =>
      t.label.toLowerCase().includes(search) ||
      t.name.toLowerCase().includes(search) ||
      t.fields.some(f => (f.label || f.name).toLowerCase().includes(search))
    );
  }, [dataModel.tables, sidebarSearch]);

  useEffect(() => {
    if (activeTab) {
      setTablePositions(activeTab.tablePositions);
      setZoom(activeTab.zoom);
      setPan(activeTab.pan);
    }
  }, [activeTab?.id]);

  const saveTabState = useCallback((updates: { tablePositions?: { id: string; x: number; y: number }[]; zoom?: number; pan?: { x: number; y: number } }) => {
    if (!activeTab) return;
    dispatch({
      type: 'UPDATE_MODEL_VIEW_TAB',
      payload: { id: activeTab.id, changes: updates },
    });
  }, [activeTab, dispatch]);

  const saveTabStateRef = useRef(saveTabState);
  saveTabStateRef.current = saveTabState;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const isCtrl = e.ctrlKey || e.metaKey;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedRelationship) {
          dispatch({ type: 'REMOVE_RELATIONSHIP', payload: selectedRelationship });
          setSelectedRelationship(null);
        } else if (selectedTable && activeTab) {
          dispatch({
            type: 'REMOVE_TABLE_FROM_MODEL',
            payload: { tableName: selectedTable, tabId: activeTab.id },
          });
          setSelectedTable(null);
        }
      }

      if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }

      if (isCtrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }

      if (e.key === 'Escape') {
        setSelectedTable(null);
        setSelectedRelationship(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTable, selectedRelationship, activeTab, dispatch]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => {
          const newZoom = Math.min(3, Math.max(0.1, prev + delta));
          saveTabStateRef.current({ zoom: newZoom });
          return newZoom;
        });
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleTableMove = useCallback((tableId: string, x: number, y: number) => {
    const snappedX = snap(Math.max(0, x));
    const snappedY = snap(Math.max(0, y));
    setTablePositions(prev => {
      const existing = prev.find(p => p.id === tableId);
      if (existing) {
        return prev.map(p => p.id === tableId ? { ...p, x: snappedX, y: snappedY } : p);
      }
      return [...prev, { id: tableId, x: snappedX, y: snappedY }];
    });
  }, []);

  const tablePositionsRef = useRef(tablePositions);
  tablePositionsRef.current = tablePositions;

  const handleTableMoveEnd = useCallback(() => {
    saveTabState({ tablePositions: tablePositionsRef.current });
  }, [saveTabState]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset?.canvas === 'true') {
      setSelectedTable(null);
      setSelectedRelationship(null);
    }
  }, []);

  const handleDragOverCanvas = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverCanvas(true);
  }, []);

  const handleDragLeaveCanvas = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCanvas(false);
  }, []);

  const handleDropOnCanvas = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCanvas(false);

    const tableName = e.dataTransfer.getData('modelview/table-name');
    if (!tableName) return;

    const activeTab = state.modelViewTabs.find(t => t.id === state.activeModelViewTab);

    if (activeTab?.visibleTables?.includes(tableName)) return;
    if (activeTab?.tablePositions?.some(p => p.id === tableName)) return;

    const sourceTable = dataModel.tables.find(t => t.name === tableName);
    if (!sourceTable) return;

    if (dataModel.tables.some(t => t.name === tableName)) {
      dispatch({
        type: 'UPDATE_MODEL_VIEW_TAB',
        payload: {
          id: state.activeModelViewTab,
          changes: {
            visibleTables: [...(activeTab?.visibleTables ?? []), tableName],
          },
        },
      });
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dropX = (e.clientX - rect.left - pan.x) / zoom;
    const dropY = (e.clientY - rect.top - pan.y) / zoom;

    const snappedX = snap(Math.max(0, dropX));
    const snappedY = snap(Math.max(0, dropY));

    dispatch({
      type: 'ADD_TABLE_TO_MODEL',
      payload: {
        table: sourceTable,
        position: { x: snappedX, y: snappedY },
        tabId: state.activeModelViewTab,
      }
    });
  }, [dataModel, pan, zoom, state.activeModelViewTab, state.modelViewTabs, dispatch]);

  const handleFieldDragStart = useCallback((tableName: string, field: FieldSchema, e: React.DragEvent) => {
    e.dataTransfer.setData('modelview/field', JSON.stringify({ tableName, fieldName: field.name, field }));
    e.stopPropagation();
    setDraggingField({ tableName, fieldName: field.name, field });
  }, []);

  const handleFieldDragOver = useCallback((tableName: string, fieldName: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'link';
  }, []);

  const handleFieldDrop = useCallback((fromTable: string, fromField: string, toTable: string, toField: string) => {
    if (fromTable === toTable && fromField === toField) return;

    let newRel: Relationship;

    const fromTableObj = dataModel.tables.find(t => t.name === fromTable);
    const toTableObj = dataModel.tables.find(t => t.name === toTable);

    if (!fromTableObj || !toTableObj) return;

    if (fromTableObj.type === 'fact' && toTableObj.type === 'dimension') {
      newRel = {
        id: generateId('rel'),
        fromTable,
        fromField,
        toTable,
        toField,
        cardinality: 'N:1' as const,
        active: true,
      };
    } else if (fromTableObj.type === 'dimension' && toTableObj.type === 'fact') {
      newRel = {
        id: generateId('rel'),
        fromTable: toTable,
        fromField: toField,
        toTable: fromTable,
        toField: fromField,
        cardinality: 'N:1' as const,
        active: true,
      };
    } else if (fromTableObj.type === 'fact' && toTableObj.type === 'fact') {
      newRel = {
        id: generateId('rel'),
        fromTable,
        fromField,
        toTable,
        toField,
        cardinality: '1:1' as const,
        active: true,
      };
    } else {
      newRel = {
        id: generateId('rel'),
        fromTable,
        fromField,
        toTable,
        toField,
        cardinality: '1:1' as const,
        active: true,
      };
    }

    dispatch({
      type: 'ADD_RELATIONSHIP',
      payload: newRel,
    });
  }, [dataModel, dispatch]);

  const handleFieldDragEnd = useCallback(() => {
    setDraggingField(null);
  }, []);

  const toggleExpand = useCallback((tableName: string) => {
    setExpandedTables(prev => toggleSet(prev, tableName));
  }, []);

  const toggleCollapse = useCallback((tableName: string) => {
    setCollapsedTables(prev => toggleSet(prev, tableName));
  }, []);

  const handleOpenRelationshipEditor = useCallback((rel: Relationship) => {
    setEditingRelationship(rel);
    setRelationshipEditorOpen(true);
  }, []);

  const autoLayout = useCallback(() => {
    const newPositions = computeAutoLayout(dataModel.tables);
    setTablePositions(newPositions);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    saveTabState({ tablePositions: newPositions, zoom: 1, pan: { x: 0, y: 0 } });
  }, [dataModel.tables, saveTabState]);

  const zoomToFit = useCallback(() => {
    if (!containerRef.current || effectivePositions.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();

    const minX = Math.min(...effectivePositions.map(p => p.x));
    const maxX = Math.max(...effectivePositions.map(p => p.x + TABLE_WIDTH));
    const minY = Math.min(...effectivePositions.map(p => p.y));
    const maxY = Math.max(...effectivePositions.map(p => p.y + TABLE_HEIGHT_ESTIMATE));

    const contentWidth = maxX - minX + 100;
    const contentHeight = maxY - minY + 100;

    const newZoom = Math.min(rect.width / contentWidth, rect.height / contentHeight, 1.5);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom(newZoom);
    setPan({
      x: rect.width / 2 - centerX * newZoom,
      y: rect.height / 2 - centerY * newZoom,
    });
    saveTabState({ zoom: newZoom, pan: { x: rect.width / 2 - centerX * newZoom, y: rect.height / 2 - centerY * newZoom } });
  }, [effectivePositions, saveTabState]);

  const getFieldPosition = useCallback((tableName: string, fieldName: string, side: 'left' | 'right') => {
    return getFieldPositionUtil(tableName, fieldName, side, effectivePositions, dataModel.tables, TABLE_WIDTH);
  }, [effectivePositions, dataModel.tables]);

  const relationshipEndpoints = useMemo(() => {
    return dataModel.relationships.filter(rel => {
      const fromVisible = effectivePositions.some(p => p.id === rel.fromTable);
      const toVisible = effectivePositions.some(p => p.id === rel.toTable);
      return fromVisible && toVisible;
    }).map(rel => {
      const fromPos = effectivePositions.find(p => p.id === rel.fromTable);
      const toPos = effectivePositions.find(p => p.id === rel.toTable);

      let fromSide: 'left' | 'right' = 'right';
      let toSide: 'left' | 'right' = 'left';

      if (fromPos && toPos) {
        const fromCenterX = fromPos.x + 110;
        const toCenterX = toPos.x + 110;

        if (fromCenterX > toCenterX) {
          fromSide = 'left';
          toSide = 'right';
        }
      }

      const from = getFieldPositionUtil(rel.fromTable, rel.fromField, fromSide, effectivePositions, dataModel.tables, TABLE_WIDTH);
      const to = getFieldPositionUtil(rel.toTable, rel.toField, toSide, effectivePositions, dataModel.tables, TABLE_WIDTH);

      const path = routeRelationshipLine(
        from,
        to,
        rel.fromTable,
        rel.toTable,
        effectivePositions,
        TABLE_WIDTH,
        TABLE_HEIGHT_ESTIMATE
      );

      return {
        ...rel,
        active: rel.active !== false,
        from,
        to,
        path,
      };
    });
  }, [dataModel, effectivePositions]);

  return (
    <div className="flex-1 flex bg-neutral-900 overflow-hidden">
      <ModelViewSidebar
        tables={dataModel.tables}
        relationships={dataModel.relationships}
        measures={dataModel.measures}
        filteredTables={filteredTables}
        selectedTable={selectedTable}
        selectedRelationship={selectedRelationship}
        expandedTables={expandedTables}
        sidebarSearch={sidebarSearch}
        onSidebarSearchChange={setSidebarSearch}
        onSelectTable={setSelectedTable}
        onSelectRelationship={setSelectedRelationship}
        onToggleExpand={toggleExpand}
        getSortedFields={getSortedFields}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ModelViewToolbar
          zoom={zoom}
          onZoomIn={() => setZoom(z => Math.min(3, z + 0.1))}
          onZoomOut={() => setZoom(z => Math.max(0.1, z - 0.1))}
          onZoomToFit={zoomToFit}
          onAutoLayout={autoLayout}
          selectedRelationship={selectedRelationship}
          relationshipEndpoints={relationshipEndpoints}
          onToggleRelationshipActive={(relId) => dispatch({ type: 'TOGGLE_RELATIONSHIP_ACTIVE', payload: relId })}
          onAutoDetect={() => dispatch({ type: 'AUTO_DETECT_RELATIONSHIPS' })}
        />

        <ModelViewCanvas
          containerRef={containerRef}
          tables={dataModel.tables}
          effectivePositions={effectivePositions}
          relationshipEndpoints={relationshipEndpoints}
          zoom={zoom}
          pan={pan}
          selectedTable={selectedTable}
          selectedRelationship={selectedRelationship}
          hoveredTable={hoveredTable}
          dragOverCanvas={dragOverCanvas}
          draggingField={draggingField}
          collapsedTables={collapsedTables}
          selectedRelationshipFields={selectedRelationshipFields}
          getSortedFields={getSortedFields}
          onSelectTable={setSelectedTable}
          onSelectRelationship={setSelectedRelationship}
          onOpenRelationshipEditor={handleOpenRelationshipEditor}
          onTableMove={handleTableMove}
          onTableMoveEnd={handleTableMoveEnd}
          onHoveredTable={setHoveredTable}
          onToggleCollapse={toggleCollapse}
          onFieldDragStart={handleFieldDragStart}
          onFieldDragOver={handleFieldDragOver}
          onFieldDrop={handleFieldDrop}
          onFieldDragEnd={handleFieldDragEnd}
          onCanvasMouseDown={handleCanvasMouseDown}
          onDragOverCanvas={handleDragOverCanvas}
          onDragLeaveCanvas={handleDragLeaveCanvas}
          onDropOnCanvas={handleDropOnCanvas}
        />
      </div>

      <ImportDialog open={state.importDialogOpen} onOpenChange={(open) => dispatch({ type: open ? 'OPEN_IMPORT_DIALOG' : 'CLOSE_IMPORT_DIALOG' })} />

      <RelationshipEditor
        open={relationshipEditorOpen}
        onOpenChange={setRelationshipEditorOpen}
        relationship={editingRelationship}
      />
    </div>
  );
}
