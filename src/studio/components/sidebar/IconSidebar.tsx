'use client';

import React from 'react';
import { useStudio } from '../../store/StudioContext';
import {
  BarChart3,
  Database,
  Link2,
  Code,
  Table2,
  Settings,
} from 'lucide-react';

const ICON_ITEMS = [
  { view: 'editor' as const, icon: BarChart3, label: 'Editor' },
  { view: 'data' as const, icon: Table2, label: 'Dados' },
  { view: 'model' as const, icon: Link2, label: 'Modelo' },
  { view: 'sql' as const, icon: Code, label: 'SQL' },
] as const;

export function IconSidebar() {
  const { state, dispatch } = useStudio();

  return (
    <div className="w-10 shrink-0 bg-neutral-950 flex flex-col items-center py-2 gap-0.5 border-r border-neutral-800">
      {ICON_ITEMS.map(({ view, icon: Icon, label }) => {
        const isActive = view === 'data'
          ? state.activeView === 'data'
          : state.activeView === view;

        return (
          <button
            key={view}
            onClick={() => {
              dispatch({ type: 'SET_ACTIVE_VIEW', payload: view });
            }}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all relative
              ${isActive
                ? 'bg-amber-600/20 text-amber-400'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
              }
            `}
            title={label}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-amber-500 rounded-r" />
            )}
            <Icon size={18} />
          </button>
        );
      })}

      <div className="flex-1" />

      <button
        className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-all"
        title="Configurações"
      >
        <Settings size={18} />
      </button>
    </div>
  );
}
