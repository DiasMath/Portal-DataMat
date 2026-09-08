import { NextRequest, NextResponse } from 'next/server';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { listConnections, createConnection, stripPassword } from '@/lib/connections/repository';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await validateMasterAdmin(request);

    if (!currentUser) {
      return NextResponse.json({ connections: [] });
    }

    const connections = await listConnections(currentUser.uid);
    return NextResponse.json({ connections: connections.map(stripPassword) });
  } catch {
    return NextResponse.json({ connections: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await validateMasterAdmin(request);

    if (!currentUser) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const connection = await request.json();
    const { id: _id, status: _status, ...rest } = connection;

    if (!rest.name || !rest.host || !rest.user) {
      return NextResponse.json({ error: 'name, host e user são obrigatórios' }, { status: 400 });
    }

    const newId = await createConnection(currentUser.uid, { ...rest, status: 'disconnected' });

    return NextResponse.json({ id: newId, ...rest, status: 'disconnected' });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
