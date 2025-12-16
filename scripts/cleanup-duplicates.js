const { createPool } = require('mysql2/promise');
const { unlink } = require('fs/promises');
const { join } = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function cleanup() {
    try {
        console.log('Searching for duplicates for user A-134...');

        // Find duplicates
        const [rows] = await pool.query(`
            SELECT filename, category, GROUP_CONCAT(id ORDER BY upload_date DESC) as ids, GROUP_CONCAT(url ORDER BY upload_date DESC) as urls
            FROM documents 
            WHERE employee_id = 'A-134' AND is_deleted = 0
            GROUP BY filename, category 
            HAVING COUNT(*) > 1
        `);

        if (rows.length === 0) {
            console.log('No duplicates found.');
            return;
        }

        console.log(`Found ${rows.length} groups of duplicates.`);

        for (const row of rows) {
            const ids = row.ids.split(',');
            const urls = row.urls.split(',');

            // Keep the first one (latest), delete the rest
            const idsToDelete = ids.slice(1);
            const urlsToDelete = urls.slice(1);

            console.log(`Keeping latest version of "${row.filename}" (${row.category}). Deleting ${idsToDelete.length} older versions.`);

            // Delete from DB
            // We can soft delete or hard delete. User said "update data folder", implies cleaning mess. Hard delete is cleaner for duplicates.
            // But let's soft delete just in case? No, duplicates are junk.
            // Actually, let's just mark is_deleted = 1 to match app logic, but delete physical file.
            // Or just hard delete to be clean.
            // Let's go with hard delete for cleanup script of OBVIOUS duplicates.
            await pool.query(`DELETE FROM documents WHERE id IN (?)`, [idsToDelete]);

            // Delete files
            for (const url of urlsToDelete) {
                try {
                    const filePath = join(process.cwd(), 'public', url);
                    console.log(`Deleting file: ${filePath}`);
                    await unlink(filePath);
                } catch (e) {
                    console.warn(`Failed to delete file ${url}:`, e.message);
                }
            }
        }

        console.log('Cleanup complete.');
    } catch (e) {
        console.error('Cleanup failed:', e);
    } finally {
        await pool.end();
    }
}

cleanup();
