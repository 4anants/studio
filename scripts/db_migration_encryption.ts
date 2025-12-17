

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
    // Dynamic import to ensure env is loaded before DB connection is created
    const pool = (await import('../src/lib/db')).default;

    console.log('Starting DB migration for encryption support...');
    try {
        await pool.query('ALTER TABLE documents ADD COLUMN storage_path TEXT');
        console.log('Added storage_path column');
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('storage_path column already exists');
        } else {
            console.error('Error adding storage_path:', e);
        }
    }

    try {
        await pool.query('ALTER TABLE documents ADD COLUMN is_encrypted BOOLEAN DEFAULT 0');
        console.log('Added is_encrypted column');
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('is_encrypted column already exists');
        } else {
            console.error('Error adding is_encrypted:', e);
        }
    }

    console.log('Migration complete.');
    process.exit(0);
}

migrate();
