import { NextRequest, NextResponse } from 'next/server';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { listDatabaseGroups, createDatabaseGroup } from '@/lib/connections/groups-repository';

export async function GET(request: NextRequest) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const connectionId = request.nextUrl.searchParams.get('connectionId');
  if (!connectionId) return NextResponse.json({ error: 'connectionId obrigatório' }, { status: 400 });

  const groups = await listDatabaseGroups(currentUser.uid, connectionId);
  return NextResponse.json({ groups });
}

export async function POST(request: NextRequest) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const { connectionId, name, parentId } = await request.json();
  if (!connectionId || !name?.trim()) {
    return NextResponse.json({ error: 'connectionId e name são obrigatórios' }, { status: 400 });
  }
  const id = await createDatabaseGroup(currentUser.uid, connectionId, name.trim(), parentId || null);
  return NextResponse.json({ id, name: name.trim(), parentId: parentId || null, connectionId, databases: [] });
}
