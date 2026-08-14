import React from 'react';
import { getTemplatesByCategory, CATEGORY_LABELS, type SqlTemplate } from '../../lib/sql-templates';

export function TemplatesDropdown({ onSelect }: { onSelect: (template: SqlTemplate) => void }) {
  const grouped = getTemplatesByCategory();

  return (
    <div className="absolute right-0 top-full mt-1 w-72 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 max-h-[400px] overflow-auto scrollbar-minimal">
      {Object.entries(grouped).map(([category, templates]) => (
        <div key={category}>
          <div className="px-3 py-1.5 text-[10px] text-amber-400 font-medium bg-neutral-800/50">
            {CATEGORY_LABELS[category] || category}
          </div>
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-800 transition-colors"
            >
              <div className="text-neutral-300">{template.name}</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">{template.description}</div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
