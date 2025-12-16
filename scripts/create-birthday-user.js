const { createPool } = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const pool = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function run() {
    try {
        const id = 'B-DAY-BOY';
        // Check if exists
        const [rows] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
        if (rows.length > 0) {
            console.log('User already exists, updating DOB to today...');
            await pool.execute('UPDATE users SET date_of_birth = ? WHERE id = ?', ['2000-12-16', id]);
        } else {
            console.log('Creating new user with birthday today...');
            await pool.execute(`
                INSERT INTO users (id, first_name, last_name, display_name, email, password_hash, is_admin, status, date_of_birth, joining_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id, 'Party', 'Animal', 'Party Animal', 'party@example.com',
                '$2a$10$abcdefg', // dummy hash
                0, 'active', '2000-12-16', '2024-01-01'
            ]);
        }
        console.log('Success!');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
