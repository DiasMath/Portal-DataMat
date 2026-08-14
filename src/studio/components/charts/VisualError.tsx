'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface VisualErrorProps {
  message?: string;
  onRetry?: () => void;
  height?: number;
}

export function VisualError({ message = 'Erro ao carregar dados', onRetry, height }: VisualErrorProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-center px-4"
      style={{ height: height || '100%' }}
    >
      <AlertTriangle size={20} className="text-red-400" />
      <span className="text-[10px] text-red-400">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={10} />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
