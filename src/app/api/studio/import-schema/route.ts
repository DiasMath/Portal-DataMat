import { NextRequest, NextResponse } from 'next/server';
import { readSchema } from '@/lib/sql/schema-reader';
import { convertSchemaToDataModel } from '@/studio/lib/import-schema';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { getConnection } from '@/lib/connections/repository';

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

    // Antes esta rota lia a conexão direto de `studio_connections` sem
    // checar o dono do documento. `getConnection` já faz essa checagem, e
    // `readSchema`/`getPool` cuidam de abrir o pool a partir do connectionId.
    const conn = await getConnection(currentUser.uid, connectionId);
    if (!conn) {
      return NextResponse.json(
        { success: false, error: 'Conexão não encontrada' },
        { status: 404 }
      );
    }

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