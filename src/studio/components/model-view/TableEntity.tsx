'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { TableSchema, FieldSchema } from '../../types/dashboard';
import { GripVertical, Link2, Trash2, EyeOff, Eye, Pencil } from 'lucide-react';
import { useStudio } from '../../store/StudioContext';
import { getTypeIcon } from '../shared/type-icons';

interface TableEntityProps {
  table: TableSchema;
  x: number;
  y: number;
  zoom: number;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onMoveEnd: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFieldDragStart: (tableName: string, field: FieldSchema, e: React.DragEvent) => void;
  onFieldDragOver: (tableName: string, fieldName: string, e: React.DragEvent) => void;
  onFieldDrop: (fromTable: string, fromField: string, toTable: string, toField: string) => void;
  onFieldDragEnd: () => void;
  draggingField: { tableName: string; fieldName: string } | null;
  isDropTarget: (tableName: string, fieldName: string) => boolean;
  getSortedFields: (table: TableSchema) => FieldSchema[];
  selectedRelationshipFields?: { tableName: string; fieldName: string }[];
  onResize?: (tableId: string, height: number) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (tableId: string) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: 'table' | 'field';
  fieldName?: string;
}

export function TableEntity({
  table, x, y, zoom, isSelected,
  onSelect, onMove, onMoveEnd, onMouseEnter, onMouseLeave,
  onFieldDragStart, onFieldDragOver, onFieldDrop, onFieldDragEnd,
  draggingField, isDropTarget, getSortedFields,
  selectedRelationshipFields = [], onResize, isCollapsed = false, onToggleCollapse
}: TableEntityProps) {
  const { state, dispatch } = useStudio();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, type: 'table' });
  const [editingTableName, setEditingTableName] = useState(false);
  const [editingFieldName, setEditingFieldName] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [tableHeight, setTableHeight] = useState(200);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'view' | 'model' } | null>(null);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStart = useRef({ y: 0, height: 0 });
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingTableName || editingFieldName) {
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editingTableName, editingFieldName]);

  const handleContextMenu = useCallback((e: React.MouseEvent, type: 'table' | 'field', fieldName?: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Position menu near the table, not at mouse position
    const menuX = x + 230; // Right of table
    const menuY = y + 10; // Slightly below top
    setContextMenu({ visible: true, x: menuX, y: menuY, type, fieldName });
  }, [x, y]);

  const handleDeleteTable = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
    setDeleteConfirm({ type: 'model' });
  }, []);

  const handleRemoveFromView = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
    setDeleteConfirm({ type: 'view' });
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteConfirm) return;
    const activeTab = state.modelViewTabs.find(t => t.id === state.activeModelViewTab);
    if (!activeTab) return;

    if (deleteConfirm.type === 'model') {
      dispatch({
        type: 'REMOVE_TABLE_FROM_MODEL',
        payload: { tableName: table.name, tabId: activeTab.id },
      });
    } else {
      dispatch({
        type: 'UPDATE_MODEL_VIEW_TAB',
        payload: {
          id: activeTab.id,
          changes: {
            tablePositions: activeTab.tablePositions.filter(p => p.id !== table.name),
            visibleTables: activeTab.visibleTables !== undefined
              ? activeTab.visibleTables.filter(n => n !== table.name)
              : activeTab.visibleTables,
          },
        },
      });
    }
    setDeleteConfirm(null);
  }, [deleteConfirm, state, dispatch, table.name]);

  const handleHideField = useCallback((fieldName: string) => {
    dispatch({ type: 'HIDE_FIELD', payload: { tableName: table.name, fieldName } });
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, [dispatch, table.name]);

  const handleUnhideField = useCallback((fieldName: string) => {
    dispatch({ type: 'UNHIDE_FIELD', payload: { tableName: table.name, fieldName } });
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, [dispatch, table.name]);

  const handleRenameTable = useCallback(() => {
    setEditingTableName(true);
    setTempName(table.label);
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, [table.label]);

  const handleRenameField = useCallback((fieldName: string) => {
    setEditingFieldName(fieldName);
    const field = table.fields.find(f => f.name === fieldName);
    setTempName(field?.label || fieldName);
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, [table.fields]);

  const submitRenameTable = useCallback(() => {
    if (tempName.trim() && tempName !== table.label) {
      dispatch({ type: 'RENAME_TABLE', payload: { tableName: table.name, newLabel: tempName.trim() } });
    }
    setEditingTableName(false);
  }, [tempName, table.label, table.name, dispatch]);

  const submitRenameField = useCallback(() => {
    if (editingFieldName && tempName.trim()) {
      const field = table.fields.find(f => f.name === editingFieldName);
      if (field && tempName !== (field.label || field.name)) {
        dispatch({ type: 'RENAME_FIELD', payload: { tableName: table.name, fieldName: editingFieldName, newLabel: tempName.trim() } });
      }
    }
    setEditingFieldName(null);
  }, [editingFieldName, tempName, table.fields, table.name, dispatch]);

  // Header drag only - not on fields
  const handleHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, posX: x, posY: y };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - dragStart.current.x) / zoom;
      const dy = (moveEvent.clientY - dragStart.current.y) / zoom;
      onMove(dragStart.current.posX + dx, dragStart.current.posY + dy);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onMoveEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [x, y, zoom, onSelect, onMove, onMoveEnd]);

  // Resize handler
  const tableHeightRef = useRef(tableHeight);
  tableHeightRef.current = tableHeight;

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = { y: e.clientY, height: tableHeight };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dy = (moveEvent.clientY - resizeStart.current.y) / zoom;
      const newHeight = Math.max(60, Math.min(400, resizeStart.current.height + dy));
      setTableHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (onResize) {
        onResize(table.name, tableHeightRef.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [zoom, tableHeight, table.name, onResize]);

  // Toggle collapse handler
  const handleToggleCollapse = useCallback(() => {
    if (onToggleCollapse) {
      onToggleCollapse(table.name);
    }
  }, [table.name, onToggleCollapse]);

  const sortedFields = getSortedFields(table);
  const headerColor = table.type === 'fact'
    ? 'bg-blue-600/20 border-b-blue-500/50'
    : 'bg-amber-600/20 border-b-amber-500/50';

  const headerText = table.type === 'fact' ? 'text-blue-400' : 'text-amber-300';

  return (
    <>
      <div
        className={`absolute w-[220px] rounded-lg shadow-xl border transition-all select-none
          ${isSelected ? 'border-amber-500 shadow-amber-500/20' : 'border-neutral-600 hover:border-neutral-500'}
          ${isDragging ? 'opacity-80' : ''}
        `}
        style={{
          left: x,
          top: y,
          zIndex: isSelected ? 10 : 1,
          pointerEvents: 'auto',
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onContextMenu={(e) => handleContextMenu(e, 'table')}
      >
        {/* Header - only this area triggers table drag */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-t-lg border-b ${headerColor} cursor-grab active:cursor-grabbing`}
          onMouseDown={handleHeaderMouseDown}
          onDoubleClick={() => handleRenameTable()}
        >
          <GripVertical size={10} className="text-neutral-500" />
          {editingTableName ? (
            <input
              ref={inputRef}
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={submitRenameTable}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRenameTable();
                if (e.key === 'Escape') setEditingTableName(false);
              }}
              className="flex-1 px-1 py-0 text-xs bg-neutral-700 border border-amber-500 rounded text-white focus:outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={`text-xs font-semibold ${headerText}`}>{table.label}</span>
          )}
          <span className="ml-auto text-[9px] text-neutral-500">{table.type === 'fact' ? 'Fato' : 'Dim'}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleCollapse();
            }}
            className="p-0.5 rounded hover:bg-black/20 transition-colors"
            title={isCollapsed ? 'Expandir' : 'Recolher'}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              className={`text-neutral-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            >
              <path d="M2 3 L5 7 L8 3" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div
          className="bg-neutral-900 rounded-b-lg overflow-y-auto relative scrollbar-minimal"
          style={{ maxHeight: isCollapsed ? 0 : tableHeight }}
        >
          {!isCollapsed && sortedFields.map(field => {
            const isDraggingThis = draggingField?.tableName === table.name && draggingField?.fieldName === field.name;
            const isTarget = isDropTarget(table.name, field.name);
            const isEditing = editingFieldName === field.name;
            const isHighlighted = selectedRelationshipFields.some(
              f => f.tableName === table.name && f.fieldName === field.name
            );
            
            return (
              <div
                key={field.name}
                draggable={!isEditing}
                onDragStart={(e) => onFieldDragStart(table.name, field, e)}
                onDragOver={(e) => onFieldDragOver(table.name, field.name, e)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingField) {
                    onFieldDrop(draggingField.tableName, draggingField.fieldName, table.name, field.name);
                  }
                }}
                onDragEnd={onFieldDragEnd}
                onContextMenu={(e) => handleContextMenu(e, 'field', field.name)}
                onDoubleClick={() => handleRenameField(field.name)}
                className={`flex items-center gap-2 px-3 py-1 text-[11px] border-b border-neutral-800 last:border-0 transition-colors
                  ${field.hidden ? 'opacity-40 italic' : 'hover:bg-neutral-800/50 cursor-pointer'}
                  ${isDraggingThis ? 'bg-amber-500/20' : ''}
                  ${isTarget ? 'bg-green-500/20' : ''}
                  ${isHighlighted ? 'bg-blue-500/20 border-l-2 border-l-blue-500' : ''}
                `}
                style={{ opacity: isDraggingThis ? 0.5 : field.hidden ? 0.4 : 1 }}
              >
                {field.hidden ? <EyeOff size={9} className="text-neutral-600" /> : getTypeIcon(field.type, 9)}
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={submitRenameField}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitRenameField();
                      if (e.key === 'Escape') setEditingFieldName(null);
                    }}
                    className="flex-1 px-1 py-0 text-[11px] bg-neutral-700 border border-amber-500 rounded text-white focus:outline-none"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-neutral-400 truncate flex-1">{field.label || field.name}</span>
                )}
                {isDraggingThis && <Link2 size={12} className="text-amber-500" />}
                {isTarget && <Link2 size={12} className="text-green-500" />}
                {isHighlighted && <Link2 size={12} className="text-blue-500" />}
              </div>
            );
          })}
          
          {/* Resize handle */}
          {!isCollapsed && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-amber-500/30 transition-colors"
              onMouseDown={handleResizeMouseDown}
            />
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="absolute z-50 bg-[#2a2a2a] border border-[#444] rounded-lg shadow-xl py-1 w-48"
          style={{ left: contextMenu.x, top: contextMenu.y, pointerEvents: 'auto' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'table' ? (
            <>
              <button
                onClick={handleRenameTable}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700"
              >
                <Pencil size={12} /> Renomear tabela
              </button>
              <div className="border-t border-[#444] my-1" />
              <button
                onClick={handleRemoveFromView}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700"
              >
                <EyeOff size={12} /> Excluir da visualização
              </button>
              <button
                onClick={handleDeleteTable}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-neutral-700"
              >
                <Trash2 size={12} /> Excluir do modelo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => contextMenu.fieldName && handleRenameField(contextMenu.fieldName)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700"
              >
                <Pencil size={12} /> Renomear campo
              </button>
              <div className="border-t border-[#444] my-1" />
              {table.fields.find(f => f.name === contextMenu.fieldName)?.hidden ? (
                <button
                  onClick={() => contextMenu.fieldName && handleUnhideField(contextMenu.fieldName)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700"
                >
                  <Eye size={12} /> Mostrar campo
                </button>
              ) : (
                <button
                  onClick={() => contextMenu.fieldName && handleHideField(contextMenu.fieldName)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700"
                >
                  <EyeOff size={12} /> Ocultar campo
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog - Portal outside SVG */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" style={{ pointerEvents: 'auto' }}>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl p-6 max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">
                  {deleteConfirm.type === 'model' ? 'Excluir tabela do modelo?' : 'Remover tabela da visualização?'}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {deleteConfirm.type === 'model'
                    ? `A tabela "${table.label}" e todos os seus relacionamentos serão excluídos permanentemente.`
                    : `A tabela "${table.label}" será removida desta visualização.`}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded hover:bg-[#333]"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
