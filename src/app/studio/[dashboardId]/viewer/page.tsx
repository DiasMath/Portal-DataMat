'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StudioProvider, useStudio } from '@/studio/store/StudioContext';
import { StudioViewer } from '@/studio/components/viewer/StudioViewer';

function ViewerLoader({ dashboardId }: { dashboardId: string }) {
  const { dispatch } = useStudio();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('studio_viewer_state');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        dispatch({ type: 'LOAD_DASHBOARD', payload: data });
      } catch {}
      localStorage.removeItem('studio_viewer_state');
    }
    setLoaded(true);
  }, [dispatch]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full bg-neutral-900 text-neutral-400">
        Carregando...
      </div>
    );
  }

  return <StudioViewer dashboardId={dashboardId} />;
}

export default function StudioViewerPage() {
  const params = useParams<{ dashboardId: string }>();

  return (
    <StudioProvider mode="viewer">
      <ViewerLoader dashboardId={params.dashboardId} />
    </StudioProvider>
  );
}
