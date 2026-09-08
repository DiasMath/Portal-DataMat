import { adminDb } from '@/lib/firebase-admin';
import { encrypt, decrypt, isEncrypted } from '@/lib/crypto';
import type { SavedConnection, NewConnectionInput, ConnectionUpdateInput } from './types';

/**
 * Coleção única de conexões, usada tanto pelo SQL Workbench quanto pelo
 * Studio. Antes eram duas coleções (`sql_connections` e
 * `studio_connections`) com lógica de encrypt/decrypt duplicada em 4
 * arquivos diferentes — e a versão do Studio não conferia o dono do
 * documento em `GET`/`PUT`/`DELETE`. Este módulo é o único lugar que fala
 * com o Firestore para conexões; toda checagem de propriedade (`userId`)
 * acontece aqui, então nenhuma rota consegue esquecer de validar.
 *
 * Mantivemos o nome da coleção antiga (`sql_connections`) para não exigir
 * migração de dados. Conexões que só existiam em `studio_connections`
 * seguem lá até serem migradas manualmente (ver `scripts/migrate-connections.ts`).
 */
const CONNECTIONS_COLLECTION = 'sql_connections';

type FirestoreDoc = { id: string; data(): Record<string, unknown> | undefined };

function encryptConnection(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  if (result.password && typeof result.password === 'string' && !isEncrypted(result.password)) {
    result.password = encrypt(result.password);
  }
  return result;
}

function decryptConnection(doc: FirestoreDoc): SavedConnection {
  const data = doc.data() || {};
  const password = data.password;
  const decryptedPassword =
    typeof password === 'string' && isEncrypted(password) ? decrypt(password) : (password as string) || '';
  return { ...(data as object), id: doc.id, password: decryptedPassword } as SavedConnection;
}

function sortByCreatedAtDesc(a: SavedConnection, b: SavedConnection): number {
  const aTime = (a.createdAt as { seconds?: number } | undefined)?.seconds || 0;
  const bTime = (b.createdAt as { seconds?: number } | undefined)?.seconds || 0;
  return bTime - aTime;
}

export async function listConnections(userId: string): Promise<SavedConnection[]> {
  if (!adminDb) return [];
  try {
    const snapshot = await adminDb
      .collection(CONNECTIONS_COLLECTION)
      .where('userId', '==', userId)
      .get();

    return snapshot.docs.map((doc) => decryptConnection(doc)).sort(sortByCreatedAtDesc);
  } catch (err) {
    console.error('[connections] Erro ao listar conexões:', err);
    return [];
  }
}

export async function getConnection(userId: string, connectionId: string): Promise<SavedConnection | null> {
  if (!adminDb) return null;
  try {
    const doc = await adminDb.collection(CONNECTIONS_COLLECTION).doc(connectionId).get();
    if (!doc.exists || doc.data()?.userId !== userId) return null;
    return decryptConnection(doc);
  } catch (err) {
    console.error('[connections] Erro ao buscar conexão:', err);
    return null;
  }
}

/**
 * Igual a `getConnection`, mas retorna a senha já descriptografada mesmo
 * quando chamado internamente (ex: `mysql-pool.ts` ao abrir um pool a
 * partir de uma conexão salva). Não faz sentido para uma rota HTTP expor
 * isso diretamente ao client — use `stripPassword` antes de responder.
 */
export const getConnectionForConnect = getConnection;

export async function createConnection(userId: string, input: NewConnectionInput): Promise<string> {
  if (!adminDb) throw new Error('Firestore não inicializado');
  const encrypted = encryptConnection({ ...input, status: input.status || 'disconnected' } as Record<string, unknown>);
  const docRef = await adminDb.collection(CONNECTIONS_COLLECTION).add({
    ...encrypted,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function updateConnection(
  userId: string,
  connectionId: string,
  updates: ConnectionUpdateInput
): Promise<boolean> {
  if (!adminDb) return false;
  try {
    const doc = await adminDb.collection(CONNECTIONS_COLLECTION).doc(connectionId).get();
    if (!doc.exists || doc.data()?.userId !== userId) return false;

    const encrypted = encryptConnection(updates as Record<string, unknown>);
    await doc.ref.update({ ...encrypted, updatedAt: new Date() });
    return true;
  } catch (err) {
    console.error('[connections] Erro ao atualizar conexão:', err);
    return false;
  }
}

export async function deleteConnection(userId: string, connectionId: string): Promise<boolean> {
  if (!adminDb) return false;
  try {
    const doc = await adminDb.collection(CONNECTIONS_COLLECTION).doc(connectionId).get();
    if (!doc.exists || doc.data()?.userId !== userId) return false;
    await doc.ref.delete();
    return true;
  } catch (err) {
    console.error('[connections] Erro ao deletar conexão:', err);
    return false;
  }
}

export function stripPassword(conn: SavedConnection): Omit<SavedConnection, 'password'> {
  const { password: _password, ...rest } = conn;
  return rest;
}

/**
 * Usado pelo pool de conexões MySQL (`mysql-pool.ts`) para reconectar a
 * partir de um `connectionId` salvo, sem depender do client reenviar a
 * senha (que nunca é enviada de volta ao browser).
 */
export async function loadDecryptedConfig(
  connectionId: string
): Promise<{ host: string; port: number; user: string; password: string; database?: string } | null> {
  if (!adminDb) return null;
  try {
    const doc = await adminDb.collection(CONNECTIONS_COLLECTION).doc(connectionId).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    const password =
      typeof data.password === 'string' && isEncrypted(data.password) ? decrypt(data.password) : data.password || '';
    return {
      host: data.host,
      port: Number(data.port),
      user: data.user,
      password,
      database: data.database || undefined,
    };
  } catch (err) {
    console.error('[connections] Erro ao carregar config para pool:', err);
    return null;
  }
}
