import { NextRequest, NextResponse } from 'next/server';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { getConnections, createConnection } from '@/lib/firebase/connections';
import type { Connection } from '@/types/sql-workbench';

function stripPassword(conn: Connection): Omit<Connection, 'password'> {
  const { password: _, ...rest } = conn;
  return rest;
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await validateMasterAdmin(request);

    if (!currentUser) {
      return NextResponse.json({ connections: [] });
    }

    const connections = await getConnections(currentUser.uid);
    return NextResponse.json({ connections: connections.map(stripPassword) });
  } catch (err) {
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
    const { id, ...rest } = connection;

    const newId = await createConnection(currentUser.uid, {
      ...rest,
      status: 'disconnected',
    });

    return NextResponse.json({ id: newId, ...rest, status: 'disconnected' });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}