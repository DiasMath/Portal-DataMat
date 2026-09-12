import { NextRequest, NextResponse } from 'next/server';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { listConnectionGroups, createConnectionGroup } from '@/lib/connections/groups-repository';

export async function GET(request: NextRequest) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const groups = await listConnectionGroups(currentUser.uid);
  return NextResponse.json({ groups });
}

export async function POST(request: NextRequest) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const { name, parentId } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nome do grupo é obrigatório' }, { status: 400 });
  }
  const id = await createConnectionGroup(currentUser.uid, name.trim(), parentId || null);
  return NextResponse.json({ id, name: name.trim(), parentId: parentId || null });
}
