import mysql, { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';

interface PoolConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
}

interface PoolEntry {
  pool: Pool;
  connectionId: string;
  config: PoolConfig;
  createdAt: number;
}

const pools = new Map<string, PoolEntry>();
const POOL_LIMIT = 10;
const POOL_TTL = 30 * 60 * 1000;

export async function getPool(connectionId: string): Promise<Pool | null> {
  const entry = pools.get(connectionId);
  if (entry) {
    return entry.pool;
  }

  const config = await loadConfigFromFirestore(connectionId);
  if (config) {
    return await createPool(connectionId, config);
  }

  return null;
}

export async function createPool(
  connectionId: string,
  config: PoolConfig
): Promise<Pool> {
  const existing = pools.get(connectionId);
  if (existing) {
    try {
      await existing.pool.end();
    } catch {}
  }

  if (pools.size >= POOL_LIMIT) {
    const oldest = [...pools.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
    await closePool(oldest[0]);
  }

  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  pools.set(connectionId, {
    pool,
    connectionId,
    config,
    createdAt: Date.now(),
  });

  return pool;
}

export async function closePool(connectionId: string): Promise<void> {
  const entry = pools.get(connectionId);
  if (entry) {
    await entry.pool.end();
    pools.delete(connectionId);
  }
}

export async function closeAllPools(): Promise<void> {
  for (const [id] of pools) {
    await closePool(id);
  }
}

export async function testConnection(config: PoolConfig): Promise<{ success: boolean; error?: string }> {
  let connection: PoolConnection | null = null;
  try {
    const tempPool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 5000,
    });

    connection = await tempPool.getConnection();
    await connection.ping();
    await tempPool.end();
    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, error };
  } finally {
    if (connection) {
      try {
        await connection.release();
      } catch {}
    }
  }
}

async function loadConfigFromFirestore(connectionId: string): Promise<PoolConfig | null> {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    if (!adminDb) {
      console.error('[mysql-pool] adminDb not available');
      return null;
    }

    const doc = await adminDb.collection('sql_connections').doc(connectionId).get();
    if (!doc.exists) {
      console.error('[mysql-pool] Connection doc not found:', connectionId);
      return null;
    }

    const data = doc.data()!;
    let password = data.password || '';

    if (password && password.includes(':') && password.split(':').length === 3) {
      const { decrypt } = await import('@/lib/crypto');
      try {
        password = decrypt(password);
      } catch (e) {
        console.error('[mysql-pool] Failed to decrypt password:', e);
      }
    }

    return {
      host: data.host,
      port: Number(data.port),
      user: data.user,
      password,
      database: data.database || undefined,
    };
  } catch (e) {
    console.error('[mysql-pool] loadConfigFromFirestore error:', e);
    return null;
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of pools) {
    if (now - entry.createdAt > POOL_TTL) {
      closePool(id).catch(() => {});
    }
  }
}, 5 * 60 * 1000);
