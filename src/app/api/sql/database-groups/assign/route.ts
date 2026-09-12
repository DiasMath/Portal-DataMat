import { NextRequest, NextResponse } from 'next/server';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { assignDatabaseToGroup } from '@/lib/connections/groups-repository';

export async function POST(request: NextRequest) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const { connectionId, databaseName, targetGroupId } = await request.json();
  if (!connectionId || !databaseName) {
    return NextResponse.json({ error: 'connectionId e databaseName são obrigatórios' }, { status: 400 });
  }
  await assignDatabaseToGroup(currentUser.uid, connectionId, databaseName, targetGroupId || null);
  return NextResponse.json({ success: true });
}
