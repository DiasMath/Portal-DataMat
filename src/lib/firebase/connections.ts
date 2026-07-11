import { adminDb } from '@/lib/firebase-admin';
import { encrypt, decrypt, isEncrypted } from '@/lib/crypto';
import type { Connection } from '@/types/sql-workbench';

const CONNECTIONS_COLLECTION = 'sql_connections';

function encryptConnection(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  if (result.password && typeof result.password === 'string' && !isEncrypted(result.password)) {
    result.password = encrypt(result.password);
  }
  return result;
}

function decryptConnection(doc: { id: string; data(): Record<string, unknown> | undefined }): Connection {
  const data = doc.data() || {};
  if (data.password && typeof data.password === 'string' && isEncrypted(data.password)) {
    data.password = decrypt(data.password);
  }
  return { id: doc.id, ...data } as Connection;
}

export async function getConnections(userId: string): Promise<Connection[]> {
  if (!adminDb) return [];
  try {
    const snapshot = await adminDb
      .collection(CONNECTIONS_COLLECTION)
      .where('userId', '==', userId)
      .get();

    const connections = snapshot.docs.map((doc) => decryptConnection(doc));
    connections.sort((a, b) => {
      const aTime = (a as any).createdAt?.seconds || 0;
      const bTime = (b as any).createdAt?.seconds || 0;
      return bTime - aTime;
    });
    return connections;
  } catch (err) {
    console.error('Erro ao buscar conexões:', err);
    return [];
  }
}

export async function getConnection(userId: string, connectionId: string): Promise<Connection | null> {
  if (!adminDb) return null;
  try {
    const doc = await adminDb
      .collection(CONNECTIONS_COLLECTION)
      .doc(connectionId)
      .get();

    if (!doc.exists || doc.data()?.userId !== userId) {
      return null;
    }

    return decryptConnection(doc);
  } catch (err) {
    console.error('Erro ao buscar conexão:', err);
    return null;
  }
}

export async function createConnection(
  userId: string,
  connection: Omit<Connection, 'id'>
): Promise<string> {
  if (!adminDb) throw new Error('Firestore não inicializado');
  const encryptedData = encryptConnection(connection as Record<string, unknown>);
  const docRef = await adminDb.collection(CONNECTIONS_COLLECTION).add({
    userId,
    ...encryptedData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return docRef.id;
}

export async function updateConnection(
  userId: string,
  connectionId: string,
  updates: Partial<Connection>
): Promise<boolean> {
  if (!adminDb) return false;
  try {
    const doc = await adminDb.collection(CONNECTIONS_COLLECTION).doc(connectionId).get();

    if (!doc.exists || doc.data()?.userId !== userId) {
      return false;
    }

    const encryptedUpdates = encryptConnection(updates as Record<string, unknown>);
    await doc.ref.update({
      ...encryptedUpdates,
      updatedAt: new Date(),
    });

    return true;
  } catch (err) {
    console.error('Erro ao atualizar conexão:', err);
    return false;
  }
}

export async function deleteConnection(userId: string, connectionId: string): Promise<boolean> {
  if (!adminDb) return false;
  try {
    const doc = await adminDb.collection(CONNECTIONS_COLLECTION).doc(connectionId).get();

    if (!doc.exists || doc.data()?.userId !== userId) {
      return false;
    }

    await doc.ref.delete();
    return true;
  } catch (err) {
    console.error('Erro ao deletar conexão:', err);
    return false;
  }
}