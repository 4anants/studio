import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = any>(sql: string, params: (string | number | boolean | null | undefined | Date)[] = []): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

export default pool;
