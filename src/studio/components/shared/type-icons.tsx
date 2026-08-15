import React from 'react';
import { Hash, Type, Calendar, ToggleLeft } from 'lucide-react';

export function getTypeIcon(type: string, size: number = 10): React.ReactNode {
  switch (type) {
    case 'number': return <Hash size={size} className="text-amber-500" />;
    case 'string': return <Type size={size} className="text-green-500" />;
    case 'date': return <Calendar size={size} className="text-purple-500" />;
    case 'boolean': return <ToggleLeft size={size} className="text-orange-500" />;
    default: return <Type size={size} className="text-neutral-500" />;
  }
}
