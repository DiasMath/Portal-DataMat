import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { decrypt, isEncrypted } from '@/lib/crypto';
import { createPool } from '@/lib/sql/mysql-pool';
import { readSchema } from '@/lib/sql/schema-reader';
import { convertSchemaToDataModel } from '@/studio/lib/import-schema';
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
    const { connectionId, tables: selectedTables } = await request.json();

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'connectionId is required' },
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

    const schema = await readSchema(connectionId);
    if (!schema) {
      return NextResponse.json(
        { success: false, error: 'Falha ao ler schema do banco de dados' },
        { status: 500 }
      );
    }

    // Filter tables if selection provided
    if (selectedTables && selectedTables.length > 0) {
      const selectedSet = new Set(selectedTables);
      schema.tables = schema.tables.filter(t => selectedSet.has(t.name));
      // Filter foreign keys to only include those between selected tables
      const selectedTableNames = new Set(schema.tables.map(t => t.name));
      schema.foreignKeys = schema.foreignKeys.filter(
        fk => selectedTableNames.has(fk.fromTable) && selectedTableNames.has(fk.toTable)
      );
    }

    const dataModel = convertSchemaToDataModel(schema, connectionId);

    return NextResponse.json({ success: true, dataModel });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}