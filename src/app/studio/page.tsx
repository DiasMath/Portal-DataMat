'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function StudioPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const mockDashboardId = 'new';
      router.replace(`/studio/${mockDashboardId}`);
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-muted-foreground">Carregando Studio...</div>
    </div>
  );
}
