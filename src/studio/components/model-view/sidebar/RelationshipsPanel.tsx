'use client';

import React from 'react';
import type { Relationship } from '../../../types/dashboard';
import { Link2 } from 'lucide-react';

interface RelationshipsPanelProps {
  relationships: Relationship[];
  selectedRelationship: string | null;
  onSelectRelationship: (relId: string) => void;
}

export function RelationshipsPanel({
  relationships,
  selectedRelationship,
  onSelectRelationship,
}: RelationshipsPanelProps) {
  return (
    <div id="model-view-relationships-panel" role="tabpanel" aria-labelledby="model-view-tab-relationships" className="px-2 py-1">
      {relationships.length === 0 ? (
        <div className="text-xs text-neutral-500 px-2 py-4 text-center">
          Nenhum relacionamento encontrado
        </div>
      ) : (
        relationships.map(rel => (
          <button
            key={rel.id}
            onClick={() => onSelectRelationship(rel.id)}
            className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
              selectedRelationship === rel.id ? 'bg-amber-600/20 text-amber-400' : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Link2 size={10} className={rel.active !== false ? 'text-green-400' : 'text-neutral-600'} />
              <span className="truncate">{rel.fromTable}.{rel.fromField}</span>
              <span className="text-neutral-600">→</span>
              <span className="truncate">{rel.toTable}.{rel.toField}</span>
            </div>
            <div className="text-[10px] text-neutral-600 mt-0.5 ml-4">
              {rel.cardinality} {rel.active === false ? '(inativo)' : ''}
            </div>
          </button>
        ))
      )}
    </div>
  );
}
