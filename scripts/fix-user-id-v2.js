
const { createPool } = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const pool = createPool({
    host: process.env.DB_HOST || '192.168.10.3',
    user: process.env.DB_USER || 'anant',
    password: process.env.DB_PASSWORD || '#Shiva@321..',
    database: process.env.DB_NAME || 'IB',
    multipleStatements: true
});

async function fixUserId() {
    const oldId = '48bab544-4402-4bc1-b16b-7fc9a176609d';
    const newId = 'A-134';

    console.log(`Migrating User ID from ${oldId} to ${newId}...`);

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Disable FK checks
        await connection.query('SET FOREIGN_KEY_CHECKS=0');

        // 2. Update Documents (User's children)
        // Check if documents exist for this user
        const [docs] = await connection.query('SELECT id FROM documents WHERE employee_id = ?', [oldId]);
        console.log(`Found ${docs.length} documents to migrate.`);

        if (docs.length > 0) {
            await connection.query('UPDATE documents SET employee_id = ? WHERE employee_id = ?', [newId, oldId]);
            console.log('Documents updated.');
        }

        // 3. Update User
        // Check if old user exists
        const [users] = await connection.query('SELECT id FROM users WHERE id = ?', [oldId]);
        if (users.length === 0) {
            // Check if already migrated
            const [newUsers] = await connection.query('SELECT id FROM users WHERE id = ?', [newId]);
            if (newUsers.length > 0) {
                console.log('User already appears to be migrated.');
            } else {
                console.log('Old user not found.');
            }
        } else {
            await connection.query('UPDATE users SET id = ? WHERE id = ?', [newId, oldId]);
            console.log('User ID updated.');
        }

        // 4. Re-enable FK checks
        await connection.query('SET FOREIGN_KEY_CHECKS=1');

        await connection.commit();
        console.log('Migration committed successfully.');

    } catch (error) {
        await connection.rollback();
        console.error('Migration failed, rolled back:', error);
    } finally {
        connection.release();
        await pool.end();
    }
}

fixUserId();
