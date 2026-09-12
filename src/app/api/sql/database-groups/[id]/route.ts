import { NextRequest, NextResponse } from 'next/server';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { updateDatabaseGroup, deleteDatabaseGroup } from '@/lib/connections/groups-repository';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const { id } = await params;
  const updates = await request.json();
  const success = await updateDatabaseGroup(currentUser.uid, id, updates);
  if (!success) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const { id } = await params;
  const success = await deleteDatabaseGroup(currentUser.uid, id);
  if (!success) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
  return NextResponse.json({ success: true });
}
