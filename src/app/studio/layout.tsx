'use client';

import { StudioProvider } from '@/studio/store/StudioContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="h-full w-full overflow-hidden bg-background text-foreground flex flex-col">
        {children}
      </div>
    </ProtectedRoute>
  );
}
