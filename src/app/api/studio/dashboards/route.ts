import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const DASHBOARDS_COLLECTION = 'studio_dashboards';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dashboardId, data } = body;

    if (!dashboardId || !data) {
      return NextResponse.json({ error: 'Missing dashboardId or data' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    await adminDb.collection(DASHBOARDS_COLLECTION).doc(dashboardId).set({
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({ success: true, dashboardId });
  } catch (error) {
    console.error('Error saving dashboard:', error);
    return NextResponse.json({ error: 'Failed to save dashboard' }, { status: 500 });
  }
}
