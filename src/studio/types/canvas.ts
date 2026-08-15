export interface CanvasPosition {
  x: number;
  y: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface CanvasRect extends CanvasPosition, CanvasSize {}

export const CANVAS_DEFAULTS = {
  MIN_WIDGET_WIDTH: 200,
  MIN_WIDGET_HEIGHT: 150,
  SNAP_SIZE: 10,
  DESIGN_WIDTH: 1920,
  DESIGN_HEIGHT: 1080,
  GRID_COLOR: 'rgba(128, 128, 128, 0.15)',
  BACKGROUND: '#171717',
  SELECTION_COLOR: '#f59e0b',
  SELECTION_BORDER: 2,
  RESIZE_HANDLE_SIZE: 8,
} as const;

export interface PagePreset {
  name: string;
  label: string;
  width: number;
  height: number;
}

export const PAGE_PRESETS: PagePreset[] = [
  { name: 'auto', label: 'Auto (Padrão)', width: 1920, height: 1080 },
  { name: 'fhd', label: 'Full HD (1920×1080)', width: 1920, height: 1080 },
];

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export function snapToGrid(value: number, snapSize: number = CANVAS_DEFAULTS.SNAP_SIZE): number {
  return Math.round(value / snapSize) * snapSize;
}

export function clampSize(
  value: number,
  min: number,
  max?: number
): number {
  const clamped = Math.max(min, value);
  return max !== undefined ? Math.min(clamped, max) : clamped;
}

export function clampToCanvas(
  x: number,
  y: number,
  width: number,
  height: number,
  pageWidth: number,
  pageHeight: number
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(x, pageWidth - width)),
    y: Math.max(0, Math.min(y, pageHeight - height)),
  };
}

export function getResizeCursor(direction: ResizeDirection): string {
  const cursors: Record<ResizeDirection, string> = {
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    ne: 'nesw-resize',
    nw: 'nwse-resize',
    se: 'nwse-resize',
    sw: 'nesw-resize',
  };
  return cursors[direction];
}

export function getResizeDelta(
  direction: ResizeDirection,
  deltaX: number,
  deltaY: number
): { dx: number; dy: number; dw: number; dh: number } {
  let dx = 0;
  let dy = 0;
  let dw = 0;
  let dh = 0;

  if (direction.includes('e')) dw += deltaX;
  if (direction.includes('w')) { dx += deltaX; dw -= deltaX; }
  if (direction.includes('s')) dh += deltaY;
  if (direction.includes('n')) { dy += deltaY; dh -= deltaY; }

  return { dx, dy, dw, dh };
}
