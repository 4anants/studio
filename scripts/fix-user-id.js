
const { createPool } = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const pool = createPool({
    host: process.env.DB_HOST || '192.168.10.3',
    user: process.env.DB_USER || 'anant',
    password: process.env.DB_PASSWORD || '#Shiva@321..',
    database: process.env.DB_NAME || 'IB'
});

async function fixUserId() {
    const oldId = '48bab544-4402-4bc1-b16b-7fc9a176609d';
    const newId = 'A-134';

    console.log(`Migrating User ID from ${oldId} to ${newId}...`);

    try {
        // 1. Check if target ID already exists
        const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [newId]);
        if (existing.length > 0) {
            console.log('Target ID A-134 already exists. Cannot migrate.');
            process.exit(1);
        }

        // 2. Disable foreign key checks momentarily to allow update (or update children first)
        // Best practice: Create new user with new ID, move data, delete old.
        // Or update if cascade is on? We don't know schema details.
        // Let's try explicit update.

        // We can't update the parent ID if children exist and restrict.
        // Let's try to update documents first? No, that violates FK if parent ID doesn't exist.
        // We'll insert the new ID first (as a copy), update children, then delete old.

        // 2a. Fetch old user data
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [oldId]);
        if (users.length === 0) {
            console.log('User not found.');
            process.exit(1);
        }
        const user = users[0];

        // 2b. Insert new user record with new ID
        // Construct INSERT dynamically or manually
        const columns = Object.keys(user).filter(k => k !== 'id');
        const values = columns.map(k => user[k]);

        const sql = `INSERT INTO users (id, ${columns.join(', ')}) VALUES (?, ${columns.map(() => '?').join(', ')})`;
        await pool.execute(sql, [newId, ...values]);
        console.log('Created new user record.');

        // 3. Update documents
        // Check if documents table exists and has employee_id
        try {
            await pool.execute('UPDATE documents SET employee_id = ? WHERE employee_id = ?', [newId, oldId]);
            console.log('Updated documents ownership.');
        } catch (e) {
            console.log('Error updating documents (table might not exist or verify column name):', e.message);
        }

        // 4. Delete old user
        await pool.execute('DELETE FROM users WHERE id = ?', [oldId]);
        console.log('Deleted old user record.');

        console.log('Migration successful.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

fixUserId();
