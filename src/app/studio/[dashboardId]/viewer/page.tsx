'use client';

import { useParams } from 'next/navigation';
import { StudioProvider } from '@/studio/store/StudioContext';
import { StudioViewer } from '@/studio/components/viewer/StudioViewer';

export default function StudioViewerPage() {
  const params = useParams<{ dashboardId: string }>();

  return (
    <StudioProvider mode="viewer">
      <StudioViewer dashboardId={params.dashboardId} />
    </StudioProvider>
  );
}
