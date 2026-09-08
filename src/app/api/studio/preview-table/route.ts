import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/sql/mysql-pool';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { getConnection } from '@/lib/connections/repository';

const TABLE_NAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export async function POST(request: NextRequest) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  try {
    const { connectionId, tableName, limit = 10 } = await request.json();

    if (!connectionId || !tableName) {
      return NextResponse.json(
        { success: false, error: 'connectionId and tableName are required' },
        { status: 400 }
      );
    }

    if (!TABLE_NAME_PATTERN.test(tableName)) {
      return NextResponse.json({ success: false, error: 'Invalid table name' }, { status: 400 });
    }

    // `getConnection` confere que a conexão pertence a currentUser.uid —
    // antes esta rota lia direto da coleção `studio_connections` sem
    // nenhuma checagem de dono, permitindo preview de tabelas de conexões
    // de outros usuários caso o connectionId fosse conhecido.
    const conn = await getConnection(currentUser.uid, connectionId);
    if (!conn) {
      return NextResponse.json({ success: false, error: 'Conexão não encontrada' }, { status: 404 });
    }

    const pool = await getPool(connectionId);
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Falha ao conectar' }, { status: 500 });
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 1000);

    const [columns] = await pool.query(
      `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA, COLUMN_COMMENT
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION`,
      [conn.database, tableName]
    );

    const [rows] = await pool.query(`SELECT * FROM \`${tableName}\` LIMIT ${safeLimit}`);

    return NextResponse.json({ success: true, columns, rows });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}