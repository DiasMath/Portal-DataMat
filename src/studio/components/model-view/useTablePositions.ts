import { useCallback, useMemo } from 'react';
import type { TableSchema, ModelViewTab } from '../../types/dashboard';

interface TablePosition {
  id: string;
  x: number;
  y: number;
}

export function getDefaultPositions(
  tables: TableSchema[],
  tablePositions: TablePosition[],
): TablePosition[] {
  const factTables = tables.filter(t => t.type === 'fact');
  const dimTables = tables.filter(t => t.type === 'dimension');

  const positions: TablePosition[] = [];

  const centerX = 400;
  const startY = 80;
  factTables.forEach((table, index) => {
    const existing = tablePositions.find(p => p.id === table.name);
    if (existing) {
      positions.push(existing);
    } else if (table.position) {
      positions.push({ id: table.name, x: table.position.x, y: table.position.y });
    } else {
      positions.push({
        id: table.name,
        x: centerX,
        y: startY + index * 280,
      });
    }
  });

  const leftDims = dimTables.filter((_, i) => i % 2 === 0);
  const rightDims = dimTables.filter((_, i) => i % 2 === 1);

  leftDims.forEach((table, index) => {
    const existing = tablePositions.find(p => p.id === table.name);
    if (existing) {
      positions.push(existing);
    } else if (table.position) {
      positions.push({ id: table.name, x: table.position.x, y: table.position.y });
    } else {
      positions.push({
        id: table.name,
        x: 80,
        y: startY + index * 280,
      });
    }
  });

  rightDims.forEach((table, index) => {
    const existing = tablePositions.find(p => p.id === table.name);
    if (existing) {
      positions.push(existing);
    } else if (table.position) {
      positions.push({ id: table.name, x: table.position.x, y: table.position.y });
    } else {
      positions.push({
        id: table.name,
        x: 720,
        y: startY + index * 280,
      });
    }
  });

  return positions;
}

export function computeAutoLayout(tables: TableSchema[]): TablePosition[] {
  const factTables = tables.filter(t => t.type === 'fact');
  const dimTables = tables.filter(t => t.type === 'dimension');

  const newPositions: TablePosition[] = [];

  const centerX = 400;
  const startY = 80;
  factTables.forEach((table, index) => {
    newPositions.push({
      id: table.name,
      x: centerX,
      y: startY + index * 280,
    });
  });

  const leftDims = dimTables.filter((_, i) => i % 2 === 0);
  const rightDims = dimTables.filter((_, i) => i % 2 === 1);

  leftDims.forEach((table, index) => {
    newPositions.push({
      id: table.name,
      x: 80,
      y: startY + index * 280,
    });
  });

  rightDims.forEach((table, index) => {
    newPositions.push({
      id: table.name,
      x: 720,
      y: startY + index * 280,
    });
  });

  return newPositions;
}

interface UseTablePositionsOptions {
  tables: TableSchema[];
  tablePositions: TablePosition[];
  visibleTables?: string[];
}

export function useTablePositions({ tables, tablePositions, visibleTables }: UseTablePositionsOptions) {
  const getDefaultPositionsCb = useCallback(() => {
    return getDefaultPositions(tables, tablePositions);
  }, [tables, tablePositions]);

  const effectivePositions = useMemo(() => {
    const defaults = getDefaultPositionsCb();
    const savedMap = new Map(tablePositions.map(p => [p.id, p]));
    const merged = defaults.map(d => savedMap.get(d.id) || d);
    if (visibleTables !== undefined) {
      return merged.filter(p => visibleTables.includes(p.id));
    }
    return merged;
  }, [tablePositions, getDefaultPositionsCb, visibleTables]);

  return {
    getDefaultPositions: getDefaultPositionsCb,
    effectivePositions,
  };
}
