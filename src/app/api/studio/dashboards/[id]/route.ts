import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const DASHBOARDS_COLLECTION = 'studio_dashboards';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const doc = await adminDb.collection(DASHBOARDS_COLLECTION).doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, dashboard: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { name, data } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (data !== undefined) updateData.data = data;

    await adminDb.collection(DASHBOARDS_COLLECTION).doc(id).set(updateData, { merge: true });

    const doc = await adminDb.collection(DASHBOARDS_COLLECTION).doc(id).get();

    return NextResponse.json({
      success: true,
      dashboard: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error('Error updating dashboard:', error);
    return NextResponse.json({ error: 'Failed to update dashboard' }, { status: 500 });
  }
}
