import { adminDb } from '@/lib/firebase-admin';
import type { ConnectionGroup, DatabaseGroup } from './group-types';

const CONNECTION_GROUPS_COLLECTION = 'sql_connection_groups';
const DATABASE_GROUPS_COLLECTION = 'sql_database_groups';

// ---------- Grupos de conexão ----------

export async function listConnectionGroups(userId: string): Promise<ConnectionGroup[]> {
  if (!adminDb) return [];
  const snapshot = await adminDb.collection(CONNECTION_GROUPS_COLLECTION).where('userId', '==', userId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ConnectionGroup));
}

export async function createConnectionGroup(userId: string, name: string, parentId: string | null): Promise<string> {
  if (!adminDb) throw new Error('Firestore não inicializado');
  const docRef = await adminDb.collection(CONNECTION_GROUPS_COLLECTION).add({
    userId,
    name,
    parentId: parentId || null,
    createdAt: new Date(),
  });
  return docRef.id;
}

export async function updateConnectionGroup(
  userId: string,
  groupId: string,
  updates: { name?: string; parentId?: string | null }
): Promise<boolean> {
  if (!adminDb) return false;
  const doc = await adminDb.collection(CONNECTION_GROUPS_COLLECTION).doc(groupId).get();
  if (!doc.exists || doc.data()?.userId !== userId) return false;
  await doc.ref.update(updates);
  return true;
}

export async function deleteConnectionGroup(userId: string, groupId: string): Promise<boolean> {
  if (!adminDb) return false;
  const doc = await adminDb.collection(CONNECTION_GROUPS_COLLECTION).doc(groupId).get();
  if (!doc.exists || doc.data()?.userId !== userId) return false;

  // Sobe um nível quem estava dentro: subgrupos viram filhos do avô, e
  // conexões que apontavam pra esse grupo ficam sem grupo — evita deixar
  // referência solta pra um grupo que não existe mais.
  const parentId = doc.data()?.parentId ?? null;
  const batch = adminDb.batch();

  const childGroups = await adminDb.collection(CONNECTION_GROUPS_COLLECTION).where('parentId', '==', groupId).get();
  childGroups.docs.forEach((child) => batch.update(child.ref, { parentId }));

  const connections = await adminDb.collection('sql_connections').where('userId', '==', userId).where('groupId', '==', groupId).get();
  connections.docs.forEach((conn) => batch.update(conn.ref, { groupId: null }));

  batch.delete(doc.ref);
  await batch.commit();
  return true;
}

// ---------- Grupos de banco (dentro de uma conexão) ----------

export async function listDatabaseGroups(userId: string, connectionId: string): Promise<DatabaseGroup[]> {
  if (!adminDb) return [];
  const snapshot = await adminDb
    .collection(DATABASE_GROUPS_COLLECTION)
    .where('userId', '==', userId)
    .where('connectionId', '==', connectionId)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DatabaseGroup));
}

export async function createDatabaseGroup(
  userId: string,
  connectionId: string,
  name: string,
  parentId: string | null
): Promise<string> {
  if (!adminDb) throw new Error('Firestore não inicializado');
  const docRef = await adminDb.collection(DATABASE_GROUPS_COLLECTION).add({
    userId,
    connectionId,
    name,
    parentId: parentId || null,
    databases: [],
    createdAt: new Date(),
  });
  return docRef.id;
}

export async function updateDatabaseGroup(
  userId: string,
  groupId: string,
  updates: { name?: string; parentId?: string | null; databases?: string[] }
): Promise<boolean> {
  if (!adminDb) return false;
  const doc = await adminDb.collection(DATABASE_GROUPS_COLLECTION).doc(groupId).get();
  if (!doc.exists || doc.data()?.userId !== userId) return false;
  await doc.ref.update(updates);
  return true;
}

export async function deleteDatabaseGroup(userId: string, groupId: string): Promise<boolean> {
  if (!adminDb) return false;
  const doc = await adminDb.collection(DATABASE_GROUPS_COLLECTION).doc(groupId).get();
  if (!doc.exists || doc.data()?.userId !== userId) return false;

  const parentId = doc.data()?.parentId ?? null;
  const batch = adminDb.batch();
  const childGroups = await adminDb.collection(DATABASE_GROUPS_COLLECTION).where('parentId', '==', groupId).get();
  childGroups.docs.forEach((child) => batch.update(child.ref, { parentId }));

  batch.delete(doc.ref);
  await batch.commit();
  return true;
}

/** Move um banco de um grupo pra outro (ou pra "sem grupo") dentro da mesma conexão. */
export async function assignDatabaseToGroup(
  userId: string,
  connectionId: string,
  databaseName: string,
  targetGroupId: string | null
): Promise<boolean> {
  if (!adminDb) return false;
  const groups = await listDatabaseGroups(userId, connectionId);

  const batch = adminDb.batch();
  for (const group of groups) {
    const hasIt = group.databases.includes(databaseName);
    const shouldHaveIt = group.id === targetGroupId;
    if (hasIt && !shouldHaveIt) {
      batch.update(adminDb.collection(DATABASE_GROUPS_COLLECTION).doc(group.id), {
        databases: group.databases.filter((d) => d !== databaseName),
      });
    } else if (!hasIt && shouldHaveIt) {
      batch.update(adminDb.collection(DATABASE_GROUPS_COLLECTION).doc(group.id), {
        databases: [...group.databases, databaseName],
      });
    }
  }
  await batch.commit();
  return true;
}
