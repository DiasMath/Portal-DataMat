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
  SELECTION_COLOR: '#FFB03F',
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
  { name: 'widescreen', label: 'Widescreen (16:9)', width: 1920, height: 1080 },
  { name: 'fullscreen', label: 'Tela Cheia (4:3)', width: 1440, height: 1080 },
  { name: 'portrait', label: 'Retrato (9:16)', width: 1080, height: 1920 },
  { name: 'square', label: 'Quadrado (1:1)', width: 1080, height: 1080 },
  { name: 'mobile', label: 'Mobile (9:19.5)', width: 393, height: 852 },
  { name: 'a4landscape', label: 'A4 Paisagem', width: 1123, height: 794 },
  { name: 'a4portrait', label: 'A4 Retrato', width: 794, height: 1123 },
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
