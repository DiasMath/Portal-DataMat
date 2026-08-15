'use client';

import React from 'react';
import type { Measure } from '../../../types/dashboard';

interface MeasuresPanelProps {
  measures?: Measure[];
}

export function MeasuresPanel({ measures }: MeasuresPanelProps) {
  return (
    <div id="model-view-measures-panel" role="tabpanel" aria-labelledby="model-view-tab-measures" className="px-2 py-1">
      {(!measures || measures.length === 0) ? (
        <div className="text-xs text-neutral-500 px-2 py-4 text-center">
          Nenhuma medida criada
        </div>
      ) : (
        measures.map(m => (
          <div key={m.id} className="px-2 py-1.5 text-xs text-neutral-400 hover:bg-neutral-800 rounded">
            {m.name}
          </div>
        ))
      )}
    </div>
  );
}
