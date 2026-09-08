import { NextRequest, NextResponse } from 'next/server';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { getConnection } from '@/lib/connections/repository';
import { getPool } from '@/lib/sql/mysql-pool';

export async function GET(request: NextRequest) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const tableName = searchParams.get('table');
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 10000);
    const sortField = searchParams.get('sort');
    const sortDirection = searchParams.get('dir')?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    if (!connectionId || !tableName) {
      return NextResponse.json(
        { success: false, error: 'connectionId and table are required' },
        { status: 400 }
      );
    }

    // Validate table name (prevent SQL injection)
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return NextResponse.json(
        { success: false, error: 'Invalid table name' },
        { status: 400 }
      );
    }

    // getConnection já confere que a conexão pertence a currentUser.uid.
    const conn = await getConnection(currentUser.uid, connectionId);
    if (!conn) {
      return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 });
    }

    const pool = await getPool(connectionId);
    if (!pool) {
      return NextResponse.json({ error: 'Falha ao conectar' }, { status: 500 });
    }

    // Validate sort field (prevent SQL injection)
    let orderClause = '';
    if (sortField && /^[a-zA-Z0-9_]+$/.test(sortField)) {
      orderClause = `ORDER BY \`${sortField}\` ${sortDirection}`;
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM \`${tableName}\``
    );
    const totalCount = Number((countResult as Record<string, unknown>[])[0]?.total) || 0;

    // Get paginated rows
    const [rows] = await pool.query(
      `SELECT * FROM \`${tableName}\` ${orderClause} LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return NextResponse.json({
      success: true,
      rows,
      totalCount,
      offset,
      limit,
      hasMore: offset + limit < totalCount,
    });
  } catch (err) {
    console.error('Erro ao buscar rows:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao buscar dados' },
      { status: 500 }
    );
  }
}
