
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { join } from 'path';
import { stat, mkdir, unlink, access } from 'fs/promises';
import { constants } from 'fs';
import { encryptFile } from '../src/lib/encryption';

async function migrate() {
    // Dynamic import
    const pool = (await import('../src/lib/db')).default;

    console.log('Starting File Encryption Migration...');

    // Get all legacy documents
    const [rows] = await pool.query<any[]>(
        `SELECT * FROM documents WHERE storage_path IS NULL AND is_deleted = 0`
    );

    console.log(`Found ${rows.length} documents to migrate.`);

    let successCount = 0;
    let failCount = 0;

    for (const doc of rows) {
        try {
            if (!doc.url || !doc.url.startsWith('/uploads/')) {
                console.log(`Skipping invalid URL: ${doc.url} (ID: ${doc.id})`);
                continue;
            }

            const relativePath = doc.url.startsWith('/') ? doc.url.substring(1) : doc.url;
            const oldFilePath = join(process.cwd(), 'public', relativePath);

            // Check if file exists
            try {
                await access(oldFilePath, constants.F_OK);
            } catch {
                console.log(`File not found: ${oldFilePath} (ID: ${doc.id}). Skipping.`);
                failCount++;
                continue;
            }

            // Determine new storage path
            // Use the same structure: storage_vault/{...rest of path}
            // old: public/uploads/User001/doc/2024/01/file.pdf
            // url: /uploads/User001/doc/2024/01/file.pdf
            // part after /uploads/ is: User001/doc/2024/01/file.pdf
            const pathAfterUploads = relativePath.replace(/^uploads\//, '').replace(/^uploads\\/, '');

            const newRelativePath = join('storage_vault', pathAfterUploads);
            const newFullPath = join(process.cwd(), newRelativePath);

            // Encrypt
            await encryptFile(oldFilePath, newFullPath);

            // Update DB
            const newUrl = `/api/file?id=${doc.id}`;
            await pool.execute(
                `UPDATE documents SET storage_path = ?, is_encrypted = 1, url = ? WHERE id = ?`,
                [newRelativePath, newUrl, doc.id]
            );

            // Delete old file
            await unlink(oldFilePath);

            console.log(`Migrated: ${doc.filename} (ID: ${doc.id})`);
            successCount++;

        } catch (error) {
            console.error(`Error migrating doc ID ${doc.id}:`, error);
            failCount++;
        }
    }

    console.log(`Migration Complete. Success: ${successCount}, Failed: ${failCount}`);

    // Clean up empty directories in public/uploads if possible (optional)
    process.exit(0);
}

migrate();
