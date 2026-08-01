'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { StudioProvider } from '@/studio/store/StudioContext';
import { StudioEditor } from '@/studio/components/editor/StudioEditor';

export default function StudioDashboardPage() {
  const params = useParams<{ dashboardId: string }>();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'viewer' ? 'viewer' : 'editor';

  return (
    <StudioProvider mode={mode}>
      <StudioEditor dashboardId={params.dashboardId} />
    </StudioProvider>
  );
}
