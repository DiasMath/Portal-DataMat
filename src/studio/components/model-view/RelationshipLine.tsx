'use client';

import React, { useState } from 'react';

interface RelationshipLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  path: string;
  cardinality: '1:1' | '1:N' | 'N:1';
  isSelected: boolean;
  isHighlighted?: boolean;
  active?: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
}

const ICON_SIZE = 20;

function getStrokeColor(isSelected: boolean, isHighlighted: boolean, active: boolean) {
  return isSelected || isHighlighted ? '#FFB03F' : active ? '#9ca3af' : '#6b7280';
}

function getOpacity(active: boolean) {
  return active ? 1 : 0.3;
}

function parsePath(path: string) {
  return path.replace(/^M /, '').split(' L ').map(p => {
    const [x, y] = p.split(' ').map(Number);
    return { x, y };
  });
}

export function calcArrowPosition(path: string, from: { x: number; y: number }) {
  const pathParts = parsePath(path);
  let totalLength = 0;
  const segmentLengths: number[] = [];
  for (let i = 1; i < pathParts.length; i++) {
    const dx = pathParts[i].x - pathParts[i - 1].x;
    const dy = pathParts[i].y - pathParts[i - 1].y;
    const len = Math.abs(dx) + Math.abs(dy);
    segmentLengths.push(len);
    totalLength += len;
  }

  // Place arrow near the END of the path (close to target table)
  const arrowOffset = 30;
  const targetLength = totalLength - arrowOffset;
  let accumulated = 0;
  let arrowX = from.x;
  let arrowY = from.y;
  let arrowAngle = 0;

  for (let i = 0; i < segmentLengths.length; i++) {
    if (accumulated + segmentLengths[i] >= targetLength) {
      const remaining = targetLength - accumulated;
      const ratio = segmentLengths[i] > 0 ? remaining / segmentLengths[i] : 0;
      arrowX = pathParts[i].x + (pathParts[i + 1].x - pathParts[i].x) * ratio;
      arrowY = pathParts[i].y + (pathParts[i + 1].y - pathParts[i].y) * ratio;
      arrowAngle = Math.atan2(
        pathParts[i + 1].y - pathParts[i].y,
        pathParts[i + 1].x - pathParts[i].x
      );
      break;
    }
    accumulated += segmentLengths[i];
  }

  const arrowSize = 10;
  return {
    arrowX,
    arrowY,
    arrow1X: arrowX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
    arrow1Y: arrowY - arrowSize * Math.sin(arrowAngle - Math.PI / 6),
    arrow2X: arrowX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
    arrow2Y: arrowY - arrowSize * Math.sin(arrowAngle + Math.PI / 6),
  };
}

export function RelationshipLinePath({ from, to, path, cardinality, isSelected, isHighlighted = false, active = true, onClick, onDoubleClick }: RelationshipLineProps) {
  const [isHovered, setIsHovered] = useState(false);
  const strokeColor = getStrokeColor(isSelected, isHighlighted, active);
  const opacity = getOpacity(active);
  const lineWeight = isHovered ? 2.5 : isSelected ? 2.5 : isHighlighted ? 2 : 1.5;

  return (
    <g
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer"
      style={{ opacity }}
    >
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="cursor-pointer"
      />
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={lineWeight}
        strokeDasharray={active ? 'none' : '8 4'}
        className="transition-all"
      />
    </g>
  );
}

interface ArrowProps {
  path: string;
  from: { x: number; y: number };
  isSelected: boolean;
  isHighlighted?: boolean;
  active?: boolean;
  onClick: () => void;
}

export function RelationshipArrow({ path, from, isSelected, isHighlighted = false, active = true, onClick }: ArrowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const strokeColor = getStrokeColor(isSelected, isHighlighted, active);
  const { arrowX, arrowY, arrow1X, arrow1Y, arrow2X, arrow2Y } = calcArrowPosition(path, from);

  return (
    <g
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer"
    >
      {/* Invisible hit area */}
      <circle cx={arrowX} cy={arrowY} r={16} fill="transparent" />
      <polygon
        points={`${arrowX},${arrowY} ${arrow1X},${arrow1Y} ${arrow2X},${arrow2Y}`}
        fill={strokeColor}
      />
    </g>
  );
}

interface CardinalityIconProps {
  x: number;
  y: number;
  label: string;
  cardinality: '1:1' | '1:N' | 'N:1';
  isSelected: boolean;
  isHighlighted?: boolean;
  isHovered?: boolean;
  onClick: () => void;
}

export function CardinalityIcon({ x, y, label, isSelected, isHighlighted = false, isHovered = false, onClick }: CardinalityIconProps) {
  const strokeColor = getStrokeColor(isSelected, isHighlighted, true);

  return (
    <g onClick={onClick} className="cursor-pointer">
      <rect
        x={x - ICON_SIZE / 2}
        y={y - ICON_SIZE / 2}
        width={ICON_SIZE}
        height={ICON_SIZE}
        rx={3}
        fill="#1a1a1a"
        stroke={strokeColor}
        strokeWidth={1.5}
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fill={isSelected || isHighlighted || isHovered ? '#fbbf24' : '#d1d5db'}
        fontSize={12}
        fontWeight="bold"
        fontFamily="monospace"
      >
        {label}
      </text>
    </g>
  );
}
