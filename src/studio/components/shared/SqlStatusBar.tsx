'use client';

import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface SqlStatusBarProps {
  valid: boolean;
  error?: string;
  lineCount: number;
}

export function SqlStatusBar({ valid, error, lineCount }: SqlStatusBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-[#333] text-xs">
      <div className="flex items-center gap-2">
        {valid ? (
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle size={12} />
            SQL válido
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-400">
            <AlertCircle size={12} />
            {error || 'Erro de sintaxe'}
          </span>
        )}
      </div>
      <div className="text-neutral-500">
        {lineCount} linhas
      </div>
    </div>
  );
}
