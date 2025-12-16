
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('--- Environment Check ---');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'NOT SET');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET (Hidden)' : 'NOT SET');
console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('DB_USER:', process.env.DB_USER || 'NOT SET');

// Test DB Connection
const mysql = require('mysql2/promise');

async function testDb() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306
    });
    console.log('Database connection successful!');
    await connection.end();
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
}

testDb();
