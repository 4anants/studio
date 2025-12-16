
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const mysql = require('mysql2/promise');

async function checkAvatar() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306')
    });

    try {
        const [rows] = await connection.query('SELECT id, email, LENGTH(avatar) as avatar_len FROM users');
        console.log('User Avatar Sizes:');
        console.table(rows);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkAvatar();
