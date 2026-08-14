'use client';

import React from 'react';
import { TableEntity } from './TableEntity';
import { RelationshipLinePath, CardinalityIcon, RelationshipArrow } from './RelationshipLine';
import type { FieldSchema, Relationship, TableSchema } from '../../types/dashboard';

interface RelationshipEndpoint {
  id: string;
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
  cardinality: '1:1' | '1:N' | 'N:1';
  active: boolean;
  from: { x: number; y: number };
  to: { x: number; y: number };
  path: string;
}

interface TablePosition {
  id: string;
  x: number;
  y: number;
}

interface ModelViewCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  tables: TableSchema[];
  effectivePositions: TablePosition[];
  relationshipEndpoints: RelationshipEndpoint[];
  zoom: number;
  pan: { x: number; y: number };
  selectedTable: string | null;
  selectedRelationship: string | null;
  hoveredTable: string | null;
  dragOverCanvas: boolean;
  draggingField: { tableName: string; fieldName: string; field: FieldSchema } | null;
  collapsedTables: Set<string>;
  selectedRelationshipFields: { tableName: string; fieldName: string }[];
  getSortedFields: (table: TableSchema) => FieldSchema[];
  onSelectTable: (tableName: string) => void;
  onSelectRelationship: (relId: string) => void;
  onOpenRelationshipEditor: (rel: Relationship) => void;
  onTableMove: (tableId: string, x: number, y: number) => void;
  onTableMoveEnd: () => void;
  onHoveredTable: (tableName: string | null) => void;
  onToggleCollapse: (tableName: string) => void;
  onFieldDragStart: (tableName: string, field: FieldSchema, e: React.DragEvent) => void;
  onFieldDragOver: (tableName: string, fieldName: string, e: React.DragEvent) => void;
  onFieldDrop: (fromTable: string, fromField: string, toTable: string, toField: string) => void;
  onFieldDragEnd: () => void;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onDragOverCanvas: (e: React.DragEvent) => void;
  onDragLeaveCanvas: (e: React.DragEvent) => void;
  onDropOnCanvas: (e: React.DragEvent) => void;
}

export function ModelViewCanvas({
  containerRef,
  tables,
  effectivePositions,
  relationshipEndpoints,
  zoom,
  pan,
  selectedTable,
  selectedRelationship,
  hoveredTable,
  dragOverCanvas,
  draggingField,
  collapsedTables,
  selectedRelationshipFields,
  getSortedFields,
  onSelectTable,
  onSelectRelationship,
  onOpenRelationshipEditor,
  onTableMove,
  onTableMoveEnd,
  onHoveredTable,
  onToggleCollapse,
  onFieldDragStart,
  onFieldDragOver,
  onFieldDrop,
  onFieldDragEnd,
  onCanvasMouseDown,
  onDragOverCanvas,
  onDragLeaveCanvas,
  onDropOnCanvas,
}: ModelViewCanvasProps) {
  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-auto relative scrollbar-minimal ${dragOverCanvas ? 'bg-amber-500/5' : ''}`}
      onMouseDown={onCanvasMouseDown}
      onDragOver={onDragOverCanvas}
      onDragLeave={onDragLeaveCanvas}
      onDrop={onDropOnCanvas}
      data-canvas="true"
    >
      {/* Lines layer - BELOW tables (z-index: 1) */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {relationshipEndpoints.map(rel => (
            <RelationshipLinePath
              key={rel.id}
              from={rel.from}
              to={rel.to}
              path={rel.path}
              cardinality={rel.cardinality}
              active={rel.active}
              isSelected={selectedRelationship === rel.id}
              isHighlighted={hoveredTable !== null && (rel.fromTable === hoveredTable || rel.toTable === hoveredTable)}
              onClick={() => {
                onSelectRelationship(rel.id);
              }}
              onDoubleClick={() => {
                onSelectRelationship(rel.id);
                onOpenRelationshipEditor(rel);
              }}
            />
          ))}
        </g>
      </svg>

      {/* Tables layer - MIDDLE (z-index: 2) */}
      <div
        className="absolute inset-0"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', zIndex: 2, pointerEvents: 'none' }}
      >
        {tables.filter(table => effectivePositions.some(p => p.id === table.name)).map(table => {
          const pos = effectivePositions.find(p => p.id === table.name)!;
          return (
            <TableEntity
              key={table.name}
              table={table}
              x={pos.x}
              y={pos.y}
              zoom={zoom}
              isSelected={selectedTable === table.name}
              onSelect={() => onSelectTable(table.name)}
              onMove={(x, y) => onTableMove(table.name, x, y)}
              onMoveEnd={onTableMoveEnd}
              onMouseEnter={() => onHoveredTable(table.name)}
              onMouseLeave={() => onHoveredTable(null)}
              onFieldDragStart={onFieldDragStart}
              onFieldDragOver={onFieldDragOver}
              onFieldDrop={onFieldDrop}
              onFieldDragEnd={onFieldDragEnd}
              draggingField={draggingField}
              isDropTarget={(t, f) => draggingField !== null && draggingField.tableName !== t && draggingField.fieldName !== f}
              getSortedFields={getSortedFields}
              selectedRelationshipFields={selectedRelationshipFields}
              isCollapsed={collapsedTables.has(table.name)}
              onToggleCollapse={onToggleCollapse}
            />
          );
        })}
      </div>

      {/* Icons layer - ABOVE tables (z-index: 3) */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 3, pointerEvents: 'none' }}>
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {relationshipEndpoints.map(rel => {
            const fromLabel = rel.cardinality === 'N:1' ? '*' : '1';
            const toLabel = rel.cardinality === '1:N' ? '*' : '1';
            const isActive = hoveredTable !== null && (rel.fromTable === hoveredTable || rel.toTable === hoveredTable);
            return (
              <g key={rel.id}>
                <RelationshipArrow
                  path={rel.path}
                  from={rel.from}
                  isSelected={selectedRelationship === rel.id}
                  isHighlighted={isActive}
                  active={rel.active}
                  onClick={() => onSelectRelationship(rel.id)}
                />
                <CardinalityIcon
                  x={rel.from.x}
                  y={rel.from.y}
                  label={fromLabel}
                  cardinality={rel.cardinality}
                  isSelected={selectedRelationship === rel.id}
                  isHighlighted={isActive}
                  onClick={() => onSelectRelationship(rel.id)}
                />
                <CardinalityIcon
                  x={rel.to.x}
                  y={rel.to.y}
                  label={toLabel}
                  cardinality={rel.cardinality}
                  isSelected={selectedRelationship === rel.id}
                  isHighlighted={isActive}
                  onClick={() => onSelectRelationship(rel.id)}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
