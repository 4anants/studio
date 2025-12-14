import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { unlink, rm } from 'fs/promises';
import { join } from 'path';

async function deletePhysicalFile(url: string) {
    try {
        const filePath = join(process.cwd(), 'public', url);
        await unlink(filePath);
        console.log(`Deleted physical file: ${filePath}`);
    } catch (error) {
        console.error('Error deleting physical file:', error);
    }
}

async function deleteUserFolder(userId: string) {
    try {
        const userFolderPath = join(process.cwd(), 'public', 'uploads', userId);
        await rm(userFolderPath, { recursive: true, force: true });
        console.log(`Deleted user folder: ${userFolderPath}`);
    } catch (error) {
        console.error('Error deleting user folder:', error);
    }
}

export async function POST(request: NextRequest) {
    try {
        // This endpoint should be called by a cron job or scheduled task
        // For security, you might want to add authentication here

        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // Simple secret-based auth for cron jobs
        if (secret !== process.env.CLEANUP_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let deletedCount = 0;

        // 1. Auto-purge documents deleted more than 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get documents to delete
        const [docsToDelete] = await pool.execute<RowDataPacket[]>(
            'SELECT id, url FROM documents WHERE is_deleted = 1 AND deleted_at < ?',
            [thirtyDaysAgo]
        );

        // Delete physical files and DB records
        for (const doc of docsToDelete) {
            if (doc.url) {
                await deletePhysicalFile(doc.url);
            }
            await pool.execute('DELETE FROM documents WHERE id = ?', [doc.id]);
            deletedCount++;
        }

        // 2. Clean up folders for deleted users
        const [deletedUsers] = await pool.execute<RowDataPacket[]>(
            'SELECT id FROM users WHERE status = "deleted"'
        );

        for (const user of deletedUsers) {
            await deleteUserFolder(user.id);
        }

        return NextResponse.json({
            success: true,
            documentsDeleted: deletedCount,
            userFoldersDeleted: deletedUsers.length,
            message: `Cleanup completed: ${deletedCount} documents and ${deletedUsers.length} user folders deleted`
        });
    } catch (error) {
        console.error('Error during cleanup:', error);
        return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
    }
}
