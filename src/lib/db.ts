import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 100, // Configured for 300+ users (concurrent load ~30-50 users)
  maxIdle: 20, // Keep 20 idle connections ready for quick response
  idleTimeout: 60000, // Close idle connections after 60 seconds
  queueLimit: 0, // No limit on queued connection requests
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true,
  connectTimeout: 10000, // Connection timeout: 10 seconds
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = any>(sql: string, params: (string | number | boolean | null | undefined | Date)[] = []): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

export default pool;
