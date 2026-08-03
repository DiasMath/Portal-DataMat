'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useStudio } from '../../store/StudioContext';
import { MOCK_DATA_MODEL } from '../../lib/mock-data';
import { TableEntity } from './TableEntity';
import { RelationshipLine } from './RelationshipLine';
import { Link2, ZoomIn, ZoomOut, Maximize, Table, Hash, Type, Calendar, ToggleLeft, ChevronRight, ToggleRight } from 'lucide-react';
import type { TableSchema } from '../../types/dashboard';

interface TablePosition {
  id: string;
  x: number;
  y: number;
}

const DEFAULT_POSITIONS: TablePosition[] = [
  { id: 'fato_vendas', x: 400, y: 80 },
  { id: 'dim_cliente', x: 100, y: 50 },
  { id: 'dim_produto', x: 700, y: 50 },
  { id: 'dim_vendedor', x: 100, y: 350 },
  { id: 'dim_calendario', x: 700, y: 350 },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  number: <Hash size={9} className="text-amber-500" />,
  string: <Type size={9} className="text-green-500" />,
  date: <Calendar size={9} className="text-purple-500" />,
  boolean: <ToggleLeft size={9} className="text-orange-500" />,
};

export function ModelView() {
  const { state, dispatch } = useStudio();
  const dataModel = state.dataModel || MOCK_DATA_MODEL;

  const [tablePositions, setTablePositions] = useState<TablePosition[]>(DEFAULT_POSITIONS);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const handleTableMove = useCallback((tableId: string, x: number, y: number) => {
    setTablePositions(prev =>
      prev.map(p => p.id === tableId ? { ...p, x, y } : p)
    );
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset?.canvas === 'true') {
      setSelectedTable(null);
      setSelectedRelationship(null);
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }
  }, [pan]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
  }, [isPanning]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const toggleExpand = useCallback((tableName: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  }, []);

  const getFieldPosition = useCallback((tableName: string, fieldName: string, side: 'left' | 'right') => {
    const pos = tablePositions.find(p => p.id === tableName);
    if (!pos) return { x: 0, y: 0 };
    const tableWidth = 220;
    const headerHeight = 32;
    const fieldHeight = 24;
    const table = dataModel.tables.find(t => t.name === tableName);
    if (!table) return { x: 0, y: 0 };
    const fieldIndex = table.fields.findIndex(f => f.name === fieldName);
    return {
      x: side === 'left' ? pos.x : pos.x + tableWidth,
      y: pos.y + headerHeight + fieldIndex * fieldHeight + fieldHeight / 2,
    };
  }, [tablePositions, dataModel]);

  const relationshipEndpoints = useMemo(() => {
    return dataModel.relationships.map(rel => ({
      ...rel,
      active: rel.active !== false,
      from: getFieldPosition(rel.fromTable, rel.fromField, 'right'),
      to: getFieldPosition(rel.toTable, rel.toField, 'left'),
    }));
  }, [dataModel, getFieldPosition]);

  return (
    <div className="flex-1 flex bg-neutral-900 overflow-hidden">
      <div className="w-56 shrink-0 border-r border-neutral-700 bg-neutral-900 flex flex-col">
        <div className="px-3 py-2 border-b border-neutral-700">
          <div className="flex items-center gap-2">
            <Link2 size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">MODELO DE DADOS</span>
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            {dataModel.tables.length} tabelas · {dataModel.relationships.length} relacionamentos
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {dataModel.tables.map(table => {
            const isExpanded = expandedTables.has(table.name);
            return (
              <div key={table.name}>
                <button
                  onClick={() => {
                    toggleExpand(table.name);
                    setSelectedTable(table.name);
                  }}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 transition-colors"
                >
                  {isExpanded ? <ChevronRight size={12} className="rotate-90" /> : <ChevronRight size={12} />}
                  <Table size={12} className={table.type === 'fact' ? 'text-amber-500' : 'text-amber-300'} />
                  <span className="font-medium truncate">{table.label}</span>
                  <span className="ml-auto text-[9px] text-muted-foreground">{table.fields.length}</span>
                </button>

                {isExpanded && (
                  <div className="ml-6">
                    {table.fields.map(field => (
                      <div key={field.name} className="flex items-center gap-1.5 px-3 py-1 text-[10px] text-neutral-500 hover:bg-neutral-800/50">
                        {TYPE_ICONS[field.type]}
                        <span className="truncate">{field.label || field.name}</span>
                        {field.isAggregatable && (
                          <span className="ml-auto text-[8px] text-amber-400 bg-amber-400/10 px-1 rounded">#</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-10 flex items-center gap-2 px-3 border-b border-neutral-700 bg-neutral-900 shrink-0">
          <div className="flex-1" />
          {selectedRelationship && (
            <button
              onClick={() => dispatch({ type: 'TOGGLE_RELATIONSHIP_ACTIVE', payload: selectedRelationship })}
              className="flex items-center gap-1.5 px-2 py-1 text-[10px] rounded hover:bg-neutral-800 text-muted-foreground transition-colors"
              title="Ativar/Desativar relacionamento"
            >
              {relationshipEndpoints.find(r => r.id === selectedRelationship)?.active !== false ? (
                <>
                  <ToggleRight size={14} className="text-green-400" />
                  <span>Ativo</span>
                </>
              ) : (
                <>
                  <ToggleLeft size={14} className="text-red-400" />
                  <span>Inativo</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
            className="p-1 rounded hover:bg-neutral-800 text-muted-foreground"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-[10px] text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="p-1 rounded hover:bg-neutral-800 text-muted-foreground"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="p-1 rounded hover:bg-neutral-800 text-muted-foreground"
            title="Resetar view"
          >
            <Maximize size={14} />
          </button>
        </div>

        <div
          className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          data-canvas="true"
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {relationshipEndpoints.map(rel => (
                <RelationshipLine
                  key={rel.id}
                  from={rel.from}
                  to={rel.to}
                  cardinality={rel.cardinality}
                  active={rel.active}
                  isSelected={selectedRelationship === rel.id}
                  onClick={() => setSelectedRelationship(rel.id)}
                />
              ))}
            </g>
          </svg>

          <div
            className="absolute inset-0"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
          >
            {dataModel.tables.map(table => {
              const pos = tablePositions.find(p => p.id === table.name) || { x: 0, y: 0 };
              return (
                <TableEntity
                  key={table.name}
                  table={table}
                  x={pos.x}
                  y={pos.y}
                  isSelected={selectedTable === table.name}
                  onSelect={() => setSelectedTable(table.name)}
                  onMove={(x, y) => handleTableMove(table.name, x, y)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
