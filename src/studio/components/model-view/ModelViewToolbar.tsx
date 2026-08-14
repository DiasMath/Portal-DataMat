'use client';

import React from 'react';
import { ZoomIn, ZoomOut, Maximize, LayoutGrid, ToggleRight, ToggleLeft, GitBranch } from 'lucide-react';

interface RelationshipEndpoint {
  id: string;
  active: boolean;
}

interface ModelViewToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
  onAutoLayout: () => void;
  selectedRelationship: string | null;
  relationshipEndpoints: RelationshipEndpoint[];
  onToggleRelationshipActive: (relId: string) => void;
  onAutoDetect: () => void;
}

export function ModelViewToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onAutoLayout,
  selectedRelationship,
  relationshipEndpoints,
  onToggleRelationshipActive,
  onAutoDetect,
}: ModelViewToolbarProps) {
  return (
    <div className="h-10 flex items-center gap-2 px-3 border-b border-neutral-700 bg-neutral-900 shrink-0">
      <div className="flex-1" />
      {selectedRelationship && (
        <button
          onClick={() => onToggleRelationshipActive(selectedRelationship)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${
            relationshipEndpoints.find(r => r.id === selectedRelationship)?.active !== false
              ? 'border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20'
              : 'border-neutral-500/50 bg-neutral-500/10 text-neutral-400 hover:bg-neutral-500/20'
          }`}
          title="Ativar/Desativar relacionamento"
        >
          {relationshipEndpoints.find(r => r.id === selectedRelationship)?.active !== false ? (
            <>
              <ToggleRight size={16} />
              <span>Ativo</span>
            </>
          ) : (
            <>
              <ToggleLeft size={16} />
              <span>Inativo</span>
            </>
          )}
        </button>
      )}
      <button
        onClick={onAutoDetect}
        className="flex items-center gap-1.5 px-2 py-1 text-[10px] rounded hover:bg-neutral-800 text-muted-foreground transition-colors"
        title="Detectar relacionamentos automaticamente"
      >
        <GitBranch size={12} />
        <span>Detectar</span>
      </button>
      <div className="w-px h-4 bg-neutral-700" />
      <button
        onClick={onZoomOut}
        className="p-1 rounded hover:bg-neutral-800 text-muted-foreground"
        title="Zoom out"
        aria-label="Zoom out"
      >
        <ZoomOut size={14} />
      </button>
      <span className="text-[10px] text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
      <button
        onClick={onZoomIn}
        className="p-1 rounded hover:bg-neutral-800 text-muted-foreground"
        title="Zoom in"
        aria-label="Zoom in"
      >
        <ZoomIn size={14} />
      </button>
      <button
        onClick={onZoomToFit}
        className="p-1 rounded hover:bg-neutral-800 text-muted-foreground"
        title="Encaixar na tela"
        aria-label="Encaixar na tela"
      >
        <Maximize size={14} />
      </button>
      <div className="w-px h-4 bg-neutral-700 mx-1" />
      <button
        onClick={onAutoLayout}
        className="p-1 rounded hover:bg-neutral-800 text-muted-foreground"
        title="Auto-layout"
        aria-label="Auto-layout"
      >
        <LayoutGrid size={14} />
      </button>
    </div>
  );
}
