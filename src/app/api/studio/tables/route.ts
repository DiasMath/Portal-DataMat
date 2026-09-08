import { NextRequest, NextResponse } from 'next/server';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { getConnection } from '@/lib/connections/repository';
import { getPool } from '@/lib/sql/mysql-pool';

export async function POST(request: NextRequest) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  try {
    const { connectionId } = await request.json();
    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId obrigatório' }, { status: 400 });
    }

    const conn = await getConnection(currentUser.uid, connectionId);
    if (!conn) {
      return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 });
    }

    const pool = await getPool(connectionId);
    if (!pool) {
      return NextResponse.json({ error: 'Falha ao conectar' }, { status: 500 });
    }

    const [tableRows] = await pool.query(
      `SELECT TABLE_NAME, TABLE_COMMENT
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`,
      [conn.database]
    );

    const tables: { name: string; columns: { name: string; type: string; key: string; nullable: boolean }[] }[] = [];

    for (const row of tableRows as any[]) {
      const [columns] = await pool.query(
        `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [conn.database, row.TABLE_NAME]
      );
      tables.push({
        name: row.TABLE_NAME,
        columns: (columns as any[]).map(c => ({
          name: c.COLUMN_NAME,
          type: c.DATA_TYPE,
          key: c.COLUMN_KEY,
          nullable: c.IS_NULLABLE === 'YES',
        })),
      });
    }

    return NextResponse.json({ success: true, tables });
  } catch (err) {
    console.error('Erro ao carregar tabelas:', err);
    return NextResponse.json({ error: 'Erro ao conectar com o banco de dados' }, { status: 500 });
  }
}
