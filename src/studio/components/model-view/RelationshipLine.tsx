'use client';

import React from 'react';

interface RelationshipLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  cardinality: '1:1' | '1:N' | 'N:1';
  isSelected: boolean;
  onClick: () => void;
}

export function RelationshipLine({ from, to, cardinality, isSelected, onClick }: RelationshipLineProps) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  const controlOffsetX = Math.abs(to.x - from.x) * 0.4;
  const controlOffsetY = 0;

  const path = `M ${from.x} ${from.y} C ${from.x + controlOffsetX} ${from.y + controlOffsetY}, ${to.x - controlOffsetX} ${to.y + controlOffsetY}, ${to.x} ${to.y}`;

  return (
    <g onClick={onClick} className="cursor-pointer">
      <path
        d={path}
        fill="none"
        stroke={isSelected ? '#FFB03F' : '#6b7280'}
        strokeWidth={isSelected ? 2.5 : 1.5}
        strokeDasharray={isSelected ? 'none' : '6 3'}
        className="transition-all"
      />

      <circle cx={from.x} cy={from.y} r={4} fill={isSelected ? '#FFB03F' : '#6b7280'} />
      <circle cx={to.x} cy={to.y} r={4} fill={isSelected ? '#FFB03F' : '#6b7280'} />

      <rect
        x={midX - 20}
        y={midY - 10}
        width={40}
        height={20}
        rx={4}
        fill="#1f2937"
        stroke={isSelected ? '#FFB03F' : '#4b5563'}
        strokeWidth={1}
      />
      <text
        x={midX}
        y={midY + 4}
        textAnchor="middle"
        fill={isSelected ? '#fbbf24' : '#9ca3af'}
        fontSize={10}
        fontFamily="monospace"
      >
        {cardinality}
      </text>
    </g>
  );
}
