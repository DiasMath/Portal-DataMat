import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { decrypt, isEncrypted } from '@/lib/crypto';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import type { StudioConnection } from '@/studio/types/connection';
import mysql from 'mysql2/promise';

const CONNECTIONS_COLLECTION = 'studio_connections';

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

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const doc = await adminDb.collection(CONNECTIONS_COLLECTION).doc(connectionId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 });
    }

    const data = doc.data()!;
    if (data.userId !== currentUser.uid) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const conn: StudioConnection = { id: doc.id, ...data } as StudioConnection;
    if (conn.password && typeof conn.password === 'string' && isEncrypted(conn.password)) {
      conn.password = decrypt(conn.password);
    }

    const pool = await mysql.createPool({
      host: conn.host,
      port: conn.port,
      user: conn.user,
      password: conn.password,
      database: conn.database,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });

    try {
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
    } finally {
      await pool.end();
    }
  } catch (err) {
    console.error('Erro ao carregar tabelas:', err);
    return NextResponse.json({ error: 'Erro ao conectar com o banco de dados' }, { status: 500 });
  }
}
