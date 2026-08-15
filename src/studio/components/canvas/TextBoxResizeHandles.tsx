'use client';

import React, { useCallback } from 'react';
import type { CanvasTextBox } from '../../types/dashboard';

interface TextBoxResizeHandlesProps {
  textBox: CanvasTextBox;
  canvasZoom: number;
  dispatch: React.Dispatch<any>;
}

interface ResizeConfig {
  cursor: string;
  style: React.CSSProperties;
  widthSign: 1 | -1;
  heightSign: 1 | -1;
  moveX: boolean;
  moveY: boolean;
}

const RESIZE_CONFIGS: ResizeConfig[] = [
  { cursor: 'cursor-se-resize', style: { right: -6, bottom: -6 }, widthSign: 1, heightSign: 1, moveX: false, moveY: false },
  { cursor: 'cursor-sw-resize', style: { left: -6, bottom: -6 }, widthSign: -1, heightSign: 1, moveX: true, moveY: false },
  { cursor: 'cursor-ne-resize', style: { right: -6, top: -6 }, widthSign: 1, heightSign: -1, moveX: false, moveY: true },
  { cursor: 'cursor-nw-resize', style: { left: -6, top: -6 }, widthSign: -1, heightSign: -1, moveX: true, moveY: true },
];

function ResizeHandle({ textBox, canvasZoom, dispatch, config }: TextBoxResizeHandlesProps & { config: ResizeConfig }) {
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = textBox.width;
    const startH = textBox.height;
    const startPosX = textBox.x;
    const startPosY = textBox.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / canvasZoom;
      const dy = (moveEvent.clientY - startY) / canvasZoom;
      dispatch({
        type: 'RESIZE_TEXT_BOX',
        payload: {
          id: textBox.id,
          width: Math.max(80, Math.round(startW + config.widthSign * dx)),
          height: Math.max(30, Math.round(startH + config.heightSign * dy)),
        },
      });
      if (config.moveX || config.moveY) {
        dispatch({
          type: 'MOVE_TEXT_BOX',
          payload: {
            id: textBox.id,
            x: config.moveX ? Math.round(startPosX + dx) : textBox.x,
            y: config.moveY ? Math.round(startPosY + dy) : textBox.y,
          },
        });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [textBox, canvasZoom, dispatch, config]);

  return (
    <div
      className={`absolute w-3 h-3 bg-amber-500 rounded-sm ${config.cursor} opacity-80 hover:opacity-100`}
      style={config.style}
      onMouseDown={onMouseDown}
    />
  );
}

export function TextBoxResizeHandles({ textBox, canvasZoom, dispatch }: TextBoxResizeHandlesProps) {
  return (
    <>
      {RESIZE_CONFIGS.map((config, i) => (
        <ResizeHandle
          key={i}
          textBox={textBox}
          canvasZoom={canvasZoom}
          dispatch={dispatch}
          config={config}
        />
      ))}
      <div className="absolute inset-0 border border-amber-500 pointer-events-none rounded" />
    </>
  );
}
