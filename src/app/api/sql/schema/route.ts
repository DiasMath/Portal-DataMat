import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/sql/mysql-pool';
import { readSchema } from '@/lib/sql/schema-reader';
import { validateMasterAdmin } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const connectionId = request.nextUrl.searchParams.get('connectionId');
  const database = request.nextUrl.searchParams.get('database');

  if (!connectionId) {
    return NextResponse.json(
      { success: false, error: 'connectionId is required' },
      { status: 400 }
    );
  }

  const pool = await getPool(connectionId);
  if (!pool) {
    return NextResponse.json(
      { success: false, error: 'Connection not found. Please reconnect.' },
      { status: 404 }
    );
  }

  if (database) {
    const safeDb = database.replace(/[^a-zA-Z0-9_]/g, '');
    if (!safeDb || safeDb !== database) {
      return NextResponse.json(
        { success: false, error: 'Invalid database name' },
        { status: 400 }
      );
    }
    try {
      await pool.query(`USE \`${safeDb}\``);
    } catch {
      return NextResponse.json(
        { success: false, error: `Database '${safeDb}' not found` },
        { status: 400 }
      );
    }
  }

  try {
    const schema = await readSchema(connectionId);

    if (!schema) {
      return NextResponse.json(
        { success: false, error: 'Failed to read schema' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, schema });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
