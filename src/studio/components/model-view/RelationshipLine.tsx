'use client';

import React from 'react';

interface RelationshipLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  cardinality: '1:1' | '1:N' | 'N:1';
  isSelected: boolean;
  active?: boolean;
  onClick: () => void;
}

export function RelationshipLine({ from, to, cardinality, isSelected, active = true, onClick }: RelationshipLineProps) {
  const controlOffsetX = Math.abs(to.x - from.x) * 0.4;
  const controlOffsetY = 0;

  const path = `M ${from.x} ${from.y} C ${from.x + controlOffsetX} ${from.y + controlOffsetY}, ${to.x - controlOffsetX} ${to.y + controlOffsetY}, ${to.x} ${to.y}`;

  const fromLabel = cardinality === 'N:1' ? '*' : '1';
  const toLabel = cardinality === '1:N' ? '*' : cardinality === '1:1' ? '1' : '1';

  const strokeColor = isSelected ? '#FFB03F' : active ? '#6b7280' : '#6b7280';
  const opacity = active ? 1 : 0.5;

  return (
    <g onClick={onClick} className="cursor-pointer" style={{ opacity }}>
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isSelected ? 2.5 : 1.5}
        strokeDasharray={active ? 'none' : '8 4'}
        className="transition-all"
      />

      <circle cx={from.x} cy={from.y} r={4} fill={strokeColor} />
      <circle cx={to.x} cy={to.y} r={4} fill={strokeColor} />

      <text
        x={from.x - 12}
        y={from.y + 4}
        textAnchor="end"
        fill={isSelected ? '#fbbf24' : '#9ca3af'}
        fontSize={11}
        fontWeight="bold"
        fontFamily="monospace"
      >
        {fromLabel}
      </text>

      <text
        x={to.x + 12}
        y={to.y + 4}
        textAnchor="start"
        fill={isSelected ? '#fbbf24' : '#9ca3af'}
        fontSize={11}
        fontWeight="bold"
        fontFamily="monospace"
      >
        {toLabel}
      </text>
    </g>
  );
}
