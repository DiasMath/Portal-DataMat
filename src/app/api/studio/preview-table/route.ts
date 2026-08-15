import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { decrypt, isEncrypted } from '@/lib/crypto';
import { createPool } from '@/lib/sql/mysql-pool';
import { validateMasterAdmin } from '@/lib/auth-helpers';

const CONNECTIONS_COLLECTION = 'studio_connections';

async function loadStudioConnection(connectionId: string) {
  if (!adminDb) return null;
  try {
    const doc = await adminDb.collection(CONNECTIONS_COLLECTION).doc(connectionId).get();
    if (!doc.exists) return null;
    const data = doc.data() || {};
    if (data.password && typeof data.password === 'string' && isEncrypted(data.password)) {
      data.password = decrypt(data.password);
    }
    return data;
  } catch {
    return null;
  }
}

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

    const connConfig = await loadStudioConnection(connectionId);
    if (!connConfig) {
      return NextResponse.json(
        { success: false, error: 'Conexão não encontrada' },
        { status: 404 }
      );
    }

    await createPool(connectionId, {
      host: connConfig.host,
      port: connConfig.port,
      user: connConfig.user,
      password: connConfig.password,
      database: connConfig.database,
    });

    // Import mysql2 to query
    const mysql = await import('mysql2/promise');
    const pool = mysql.default.createPool({
      host: connConfig.host,
      port: connConfig.port,
      user: connConfig.user,
      password: connConfig.password,
      database: connConfig.database,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });

    // Get column info
    const [columns] = await pool.query(
      `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA, COLUMN_COMMENT
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION`,
      [connConfig.database, tableName]
    );

    // Get sample data
    const [rows] = await pool.query(
      `SELECT * FROM \`${tableName}\` LIMIT ?`,
      [limit]
    );

    await pool.end();

    return NextResponse.json({ success: true, columns, rows });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}