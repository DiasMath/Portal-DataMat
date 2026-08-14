'use client';

import React from 'react';
import { useStudio } from '../../store/StudioContext';
import type { Visual } from '../../types/dashboard';
import { Type, Eye, BarChart3, Minus, Grid3X3, TrendingUp, Circle, Radar, Filter, TreePine, Target, Sun, GitBranch, Settings } from 'lucide-react';
import { FORMATTING_SECTIONS } from './formattingConfig';
import { FormattingSectionRenderer } from './FormattingSectionRenderer';

const ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  Type, Eye, BarChart3, Minus, Grid3X3, TrendingUp, Circle, Radar, Filter, TreePine, Target, Sun, GitBranch, Settings,
};

interface FormattingTabProps {
  visual: Visual;
}

export function FormattingTab({ visual }: FormattingTabProps) {
  const { dispatch } = useStudio();

  return (
    <div className="space-y-0">
      {FORMATTING_SECTIONS.map((section) => (
        <FormattingSectionRenderer
          key={section.id}
          visual={visual}
          dispatch={dispatch}
          section={section}
        />
      ))}
    </div>
  );
}
