import type { CanvasPosition as Point, CanvasRect as Rect } from '../types/canvas';

const MARGIN = 20;

function pointInRect(p: Point, rect: Rect, margin: number = 0): boolean {
  return (
    p.x >= rect.x - margin &&
    p.x <= rect.x + rect.width + margin &&
    p.y >= rect.y - margin &&
    p.y <= rect.y + rect.height + margin
  );
}

function segmentIntersectsRect(p1: Point, p2: Point, rect: Rect, margin: number): boolean {
  const expandedRect = {
    x: rect.x - margin,
    y: rect.y - margin,
    width: rect.width + margin * 2,
    height: rect.height + margin * 2,
  };

  if (pointInRect(p1, expandedRect) || pointInRect(p2, expandedRect)) {
    return true;
  }

  const edges = [
    { x1: expandedRect.x, y1: expandedRect.y, x2: expandedRect.x + expandedRect.width, y2: expandedRect.y },
    { x1: expandedRect.x + expandedRect.width, y1: expandedRect.y, x2: expandedRect.x + expandedRect.width, y2: expandedRect.y + expandedRect.height },
    { x1: expandedRect.x, y1: expandedRect.y + expandedRect.height, x2: expandedRect.x + expandedRect.width, y2: expandedRect.y + expandedRect.height },
    { x1: expandedRect.x, y1: expandedRect.y, x2: expandedRect.x, y2: expandedRect.y + expandedRect.height },
  ];

  for (const edge of edges) {
    if (segmentsIntersect(p1.x, p1.y, p2.x, p2.y, edge.x1, edge.y1, edge.x2, edge.y2)) {
      return true;
    }
  }

  return false;
}

function segmentsIntersect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean {
  const d1 = direction(x3, y3, x4, y4, x1, y1);
  const d2 = direction(x3, y3, x4, y4, x2, y2);
  const d3 = direction(x1, y1, x2, y2, x3, y3);
  const d4 = direction(x1, y1, x2, y2, x4, y4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  return false;
}

function direction(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function pathCollides(path: Point[], obstacles: Rect[], margin: number): boolean {
  for (const obs of obstacles) {
    for (let i = 0; i < path.length - 1; i++) {
      if (segmentIntersectsRect(path[i], path[i + 1], obs, margin)) {
        return true;
      }
    }
  }
  return false;
}

function pathCost(path: Point[]): number {
  let length = 0;
  let bends = 0;
  for (let i = 1; i < path.length; i++) {
    length += Math.abs(path[i].x - path[i - 1].x) + Math.abs(path[i].y - path[i - 1].y);
  }
  for (let i = 1; i < path.length - 1; i++) {
    const dx1 = path[i].x - path[i - 1].x;
    const dy1 = path[i].y - path[i - 1].y;
    const dx2 = path[i + 1].x - path[i].x;
    const dy2 = path[i + 1].y - path[i].y;
    if ((dx1 !== 0 && dx2 === 0) || (dx1 === 0 && dx2 !== 0) ||
        (dy1 !== 0 && dy2 === 0) || (dy1 === 0 && dy2 !== 0)) {
      bends++;
    }
  }
  return length + bends * 30;
}

function tryRoutes(
  from: Point,
  to: Point,
  obstacles: Rect[],
  extendDist: number
): Point[] {
  // Try multiple routing strategies: simple L, U-shape around obstacles, S-shape
  const candidates: Point[][] = [];

  // Strategy 1: Horizontal-first L-shape
  const midX1 = from.x + (to.x - from.x) / 2;
  candidates.push([
    from,
    { x: midX1, y: from.y },
    { x: midX1, y: to.y },
    to,
  ]);

  // Strategy 2: Vertical-first L-shape
  const midY1 = from.y + (to.y - from.y) / 2;
  candidates.push([
    from,
    { x: from.x, y: midY1 },
    { x: to.x, y: midY1 },
    to,
  ]);

  // Strategy 3: Extend from source, go around top
  const minY = Math.min(from.y, to.y) - extendDist;
  candidates.push([
    from,
    { x: from.x, y: minY },
    { x: to.x, y: minY },
    to,
  ]);

  // Strategy 4: Extend from source, go around bottom
  const maxY = Math.max(
    ...obstacles.map(o => o.y + o.height),
    from.y, to.y
  ) + extendDist;
  candidates.push([
    from,
    { x: from.x, y: maxY },
    { x: to.x, y: maxY },
    to,
  ]);

  // Strategy 5: Go left of everything
  const minX = Math.min(
    ...obstacles.map(o => o.x),
    from.x, to.x
  ) - extendDist;
  candidates.push([
    from,
    { x: minX, y: from.y },
    { x: minX, y: to.y },
    to,
  ]);

  // Strategy 6: Go right of everything
  const maxX = Math.max(
    ...obstacles.map(o => o.x + o.width),
    from.x, to.x
  ) + extendDist;
  candidates.push([
    from,
    { x: maxX, y: from.y },
    { x: maxX, y: to.y },
    to,
  ]);

  // Strategy 7: Source extends right, target extends left (or vice versa) with bend
  const ext = extendDist;
  candidates.push([
    from,
    { x: from.x + ext, y: from.y },
    { x: from.x + ext, y: to.y },
    { x: to.x - ext, y: to.y },
    { x: to.x - ext, y: to.y },
    to,
  ]);

  // Strategy 8: Source extends left, target extends right
  candidates.push([
    from,
    { x: from.x - ext, y: from.y },
    { x: from.x - ext, y: to.y },
    { x: to.x + ext, y: to.y },
    { x: to.x + ext, y: to.y },
    to,
  ]);

  // Strategy 9: Go around top-left
  candidates.push([
    from,
    { x: from.x, y: minY },
    { x: to.x, y: minY },
    to,
  ]);

  // Strategy 10: Go around bottom-right
  candidates.push([
    from,
    { x: from.x, y: maxY },
    { x: to.x, y: maxY },
    to,
  ]);

  // Deduplicate collinear points in each candidate
  const cleaned = candidates.map(path => deduplicateCollinear(path));

  // Filter to collision-free paths, pick cheapest
  const valid = cleaned.filter(p => !pathCollides(p, obstacles, MARGIN));

  if (valid.length > 0) {
    valid.sort((a, b) => pathCost(a) - pathCost(b));
    return valid[0];
  }

  // Fallback: direct line with midpoint
  const midX = from.x + (to.x - from.x) / 2;
  return [from, { x: midX, y: from.y }, { x: midX, y: to.y }, to];
}

function deduplicateCollinear(path: Point[]): Point[] {
  if (path.length <= 2) return path;
  const result: Point[] = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = path[i];
    const next = path[i + 1];
    // Skip if collinear (same direction)
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const sameDir = (dx1 === 0 && dx2 === 0) || (dy1 === 0 && dy2 === 0) ||
                    (dx1 !== 0 && dx2 !== 0 && Math.sign(dx1) === Math.sign(dx2) && dy1 === 0 && dy2 === 0) ||
                    (dy1 !== 0 && dy2 !== 0 && Math.sign(dy1) === Math.sign(dy2) && dx1 === 0 && dx2 === 0);
    if (!sameDir) {
      result.push(curr);
    }
  }
  result.push(path[path.length - 1]);
  return result;
}

export function routeRelationshipLine(
  from: Point,
  to: Point,
  fromTableName: string,
  toTableName: string,
  positions: { id: string; x: number; y: number }[],
  tableWidth: number = 220,
  tableHeight: number = 280
): string {
  const fromPos = positions.find(p => p.id === fromTableName);
  const toPos = positions.find(p => p.id === toTableName);

  if (!fromPos || !toPos) {
    const midX = from.x + (to.x - from.x) / 2;
    return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
  }

  const obstacles: Rect[] = positions
    .filter(p => p.id !== fromTableName && p.id !== toTableName)
    .map(p => ({ x: p.x, y: p.y, width: tableWidth, height: tableHeight }));

  const extendDist = Math.max(40, tableWidth * 0.3);
  const path = tryRoutes(from, to, obstacles, extendDist);

  if (path.length === 0) {
    const midX = from.x + (to.x - from.x) / 2;
    return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
  }

  return `M ${path.map(p => `${p.x} ${p.y}`).join(' L ')}`;
}

export function getFieldPosition(
  tableName: string,
  fieldName: string,
  side: 'left' | 'right',
  positions: { id: string; x: number; y: number }[],
  tables: { name: string; fields: { name: string }[] }[],
  tableWidth: number = 220
): Point {
  const pos = positions.find(p => p.id === tableName);
  if (!pos) return { x: 0, y: 0 };

  const headerHeight = 32;
  const fieldHeight = 24;
  const table = tables.find(t => t.name === tableName);
  if (!table) return { x: 0, y: 0 };

  const fieldIndex = table.fields.findIndex(f => f.name === fieldName);
  // Offset icon 12px outside the table edge so it sticks out
  const iconOffset = 12;
  return {
    x: side === 'left' ? pos.x - iconOffset : pos.x + tableWidth + iconOffset,
    y: pos.y + headerHeight + fieldIndex * fieldHeight + fieldHeight / 2,
  };
}
