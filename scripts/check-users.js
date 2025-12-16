const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const mysql = require('mysql2/promise');

async function checkUsers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306')
    });

    try {
        // Check table structure
        const [columns] = await connection.query("SHOW COLUMNS FROM users");
        console.log('\n=== Users Table Structure ===');
        console.table(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key, Default: c.Default })));

        // Check all users
        const [users] = await connection.query('SELECT id, email, first_name, last_name, is_admin FROM users');
        console.log('\n=== All Users ===');
        console.table(users);

        // Check specifically for admin users
        const [admins] = await connection.query('SELECT id, email, is_admin FROM users WHERE is_admin = 1 OR is_admin = true');
        console.log('\n=== Admin Users (is_admin = 1) ===');
        console.table(admins);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

checkUsers();
