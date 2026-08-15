'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export function VisualLoading({ height }: { height?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-muted-foreground"
      style={{ height: height || '100%' }}
    >
      <Loader2 size={20} className="animate-spin text-amber-500" />
      <span className="text-[10px]">Carregando dados...</span>
    </div>
  );
}
