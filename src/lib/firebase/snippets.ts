import { adminDb } from '@/lib/firebase-admin';
import type { Snippet, SavedQuery } from '@/types/sql-workbench';

const SNIPPETS_COLLECTION = 'sql_snippets';
const SAVED_QUERIES_COLLECTION = 'sql_saved_queries';

export async function getSnippets(userId: string): Promise<Snippet[]> {
  if (!adminDb) return [];
  const snapshot = await adminDb
    .collection(SNIPPETS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Snippet[];
}

export async function createSnippet(
  userId: string,
  snippet: Omit<Snippet, 'id'>
): Promise<string> {
  if (!adminDb) throw new Error('Firestore not initialized');
  const docRef = await adminDb.collection(SNIPPETS_COLLECTION).add({
    userId,
    ...snippet,
    createdAt: new Date(),
  });
  return docRef.id;
}

export async function updateSnippet(
  userId: string,
  snippetId: string,
  updates: Partial<Snippet>
): Promise<boolean> {
  if (!adminDb) return false;
  const doc = await adminDb.collection(SNIPPETS_COLLECTION).doc(snippetId).get();
  if (!doc.exists || doc.data()?.userId !== userId) return false;
  await doc.ref.update({ ...updates, updatedAt: new Date() });
  return true;
}

export async function deleteSnippet(userId: string, snippetId: string): Promise<boolean> {
  if (!adminDb) return false;
  const doc = await adminDb.collection(SNIPPETS_COLLECTION).doc(snippetId).get();
  if (!doc.exists || doc.data()?.userId !== userId) return false;
  await doc.ref.delete();
  return true;
}

export async function getSavedQueries(userId: string): Promise<SavedQuery[]> {
  if (!adminDb) return [];
  const snapshot = await adminDb
    .collection(SAVED_QUERIES_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('updatedAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SavedQuery[];
}

export async function createSavedQuery(
  userId: string,
  query: Omit<SavedQuery, 'id'>
): Promise<string> {
  if (!adminDb) throw new Error('Firestore not initialized');
  const docRef = await adminDb.collection(SAVED_QUERIES_COLLECTION).add({
    userId,
    ...query,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function updateSavedQuery(
  userId: string,
  queryId: string,
  updates: Partial<SavedQuery>
): Promise<boolean> {
  if (!adminDb) return false;
  const doc = await adminDb.collection(SAVED_QUERIES_COLLECTION).doc(queryId).get();
  if (!doc.exists || doc.data()?.userId !== userId) return false;
  await doc.ref.update({ ...updates, updatedAt: new Date() });
  return true;
}

export async function deleteSavedQuery(userId: string, queryId: string): Promise<boolean> {
  if (!adminDb) return false;
  const doc = await adminDb.collection(SAVED_QUERIES_COLLECTION).doc(queryId).get();
  if (!doc.exists || doc.data()?.userId !== userId) return false;
  await doc.ref.delete();
  return true;
}

export const DEFAULT_SNIPPETS: Snippet[] = [
  {
    id: 'snippet_1',
    title: 'Selecionar tudo de uma tabela',
    sql: 'SELECT * FROM `tabela` LIMIT 100;',
    category: 'Select',
  },
  {
    id: 'snippet_2',
    title: 'Contar registros',
    sql: 'SELECT COUNT(*) AS total FROM `tabela`;',
    category: 'Aggregate',
  },
  {
    id: 'snippet_3',
    title: 'Inserir registro',
    sql: "INSERT INTO `tabela` (coluna1, coluna2) VALUES ('valor1', 'valor2');",
    category: 'Insert',
  },
  {
    id: 'snippet_4',
    title: 'Atualizar registro',
    sql: "UPDATE `tabela` SET coluna1 = 'novo_valor' WHERE id = 1;",
    category: 'Update',
  },
  {
    id: 'snippet_5',
    title: 'Deletar registro',
    sql: 'DELETE FROM `tabela` WHERE id = 1;',
    category: 'Delete',
  },
  {
    id: 'snippet_6',
    title: 'Criar tabela simples',
    sql: 'CREATE TABLE `nova_tabela` (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(255) NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);',
    category: 'DDL',
  },
  {
    id: 'snippet_7',
    title: 'Inner Join',
    sql: 'SELECT t1.*, t2.*\nFROM `tabela1` t1\nINNER JOIN `tabela2` t2 ON t1.id = t2.tabela1_id\nLIMIT 100;',
    category: 'Join',
  },
  {
    id: 'snippet_8',
    title: 'Left Join',
    sql: 'SELECT t1.*, t2.*\nFROM `tabela1` t1\nLEFT JOIN `tabela2` t2 ON t1.id = t2.tabela1_id\nLIMIT 100;',
    category: 'Join',
  },
  {
    id: 'snippet_9',
    title: 'Group By com Sum',
    sql: 'SELECT categoria, SUM(valor) AS total\nFROM `tabela`\nGROUP BY categoria\nORDER BY total DESC;',
    category: 'Aggregate',
  },
  {
    id: 'snippet_10',
    title: 'Buscar por texto (LIKE)',
    sql: "SELECT * FROM `tabela`\nWHERE coluna LIKE '%termo%'\nLIMIT 100;",
    category: 'Select',
  },
];