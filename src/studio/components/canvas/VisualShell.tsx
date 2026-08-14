'use client';

import React from 'react';
import type { Visual, VisualCanvasProperties } from '../../types/dashboard';

interface VisualShellProps {
  visual: Visual;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function buildShellStyle(cp: VisualCanvasProperties, visual: Visual, zoom: number = 1): React.CSSProperties {
  const showShell = cp.showShell !== false;

  const shellStyle: React.CSSProperties = {
    left: `${visual.x * zoom}px`,
    top: `${visual.y * zoom}px`,
    width: `${visual.width * zoom}px`,
    height: `${visual.height * zoom}px`,
    zIndex: visual.zIndex,
  };

  if (showShell) {
    shellStyle.backgroundColor = cp.backgroundTransparent ? 'transparent' : (cp.backgroundColor || '#ffffff');
    shellStyle.borderRadius = cp.borderRadius ?? 8;
    shellStyle.boxShadow = cp.shadowEnabled
      ? `${cp.shadowOffsetX || 0}px ${cp.shadowOffsetY || 2}px ${cp.shadowBlur || 10}px ${cp.shadowColor || 'rgba(0,0,0,0.1)'}`
      : 'none';
    if (cp.showBorder) {
      shellStyle.border = `${cp.borderWidth || 1}px solid ${cp.borderColor || '#e5e7eb'}`;
    }
  }

  return shellStyle;
}

export function buildHeaderStyle(cp: VisualCanvasProperties): React.CSSProperties {
  const headerHeight = cp.headerHeight || 32;
  const borderRadius = cp.borderRadius ?? 8;

  return {
    height: headerHeight,
    backgroundColor: cp.headerBackgroundColor || (cp.backgroundColor || '#ffffff'),
    color: cp.headerTextColor || '#374151',
    fontFamily: cp.headerFontFamily || 'inherit',
    fontSize: cp.headerFontSize || 12,
    fontWeight: (cp.headerFontWeight === 'bold' || cp.headerFontWeight === 'bold-italic') ? 'bold' : 'normal',
    fontStyle: (cp.headerFontWeight === 'italic' || cp.headerFontWeight === 'bold-italic') ? 'italic' : 'normal',
    textAlign: cp.headerAlignment || 'left',
    borderBottom: '1px solid #e5e7eb',
    borderTopLeftRadius: borderRadius,
    borderTopRightRadius: borderRadius,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  };
}

export function VisualShell({ visual, children, className = '', style }: VisualShellProps) {
  const cp = visual.canvasProperties || {};
  const showShell = cp.showShell !== false;
  const headerHeight = cp.headerHeight || 32;

  return (
    <>
      {showShell && visual.showTitle && (
        <div
          className="px-3 flex items-center truncate"
          style={buildHeaderStyle(cp)}
        >
          <span className="w-full truncate">{visual.title}</span>
        </div>
      )}
      <div
        className={`overflow-hidden ${className}`}
        style={{
          position: 'absolute',
          top: showShell && visual.showTitle ? headerHeight : 0,
          left: 0,
          right: 0,
          bottom: 0,
          ...style,
        }}
      >
        {children}
      </div>
    </>
  );
}
