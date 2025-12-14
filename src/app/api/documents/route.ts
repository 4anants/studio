import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { unlink } from 'fs/promises';
import { join } from 'path';

async function ensureDeletedAtColumn() {
    try {
        await pool.query('SELECT deleted_at FROM documents LIMIT 1');
    } catch (err: any) {
        if (err.code === 'ER_BAD_FIELD_ERROR') {
            await pool.query('ALTER TABLE documents ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL');
        }
    }
}

async function ensureIsDeletedColumn() {
    try {
        await pool.query('SELECT is_deleted FROM documents LIMIT 1');
    } catch (err: any) {
        if (err.code === 'ER_BAD_FIELD_ERROR') {
            await pool.query('ALTER TABLE documents ADD COLUMN is_deleted BOOLEAN DEFAULT 0');
        }
    }
}

async function deletePhysicalFile(url: string) {
    try {
        console.log('Attempting to delete file with URL:', url);

        // URL format: /uploads/{userId}/{docType}/{year}/{month}/{filename}
        // Remove leading slash if present
        const cleanUrl = url.startsWith('/') ? url.substring(1) : url;

        // Construct full filesystem path
        const filePath = join(process.cwd(), 'public', cleanUrl);
        console.log('Full file path:', filePath);

        // Check if file exists before attempting to delete
        const { access, constants } = await import('fs/promises');
        try {
            await access(filePath, constants.F_OK);
            console.log('File exists, proceeding with deletion');
        } catch {
            console.warn('File does not exist:', filePath);
            return; // File doesn't exist, nothing to delete
        }

        // Delete the file
        await unlink(filePath);
        console.log('✅ Successfully deleted physical file:', filePath);
    } catch (error: any) {
        console.error('❌ Error deleting physical file:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            path: error.path
        });
        // Don't throw - we still want to delete from DB even if file deletion fails
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const showDeleted = searchParams.get('deleted') === 'true';
    const session = await getServerSession(authOptions);

    try {
        let baseQuery = 'SELECT * FROM documents';
        let conditions = [];
        let params: (string | number)[] = [];

        await ensureIsDeletedColumn();
        await ensureDeletedAtColumn();

        if (session?.user?.role !== 'admin') {
            const userId = session?.user?.id;
            if (!userId) return NextResponse.json([]);
            conditions.push('employee_id = ?');
            params.push(userId);
        }

        if (showDeleted) {
            conditions.push('is_deleted = 1');
        } else {
            conditions.push('(is_deleted = 0 OR is_deleted IS NULL)');
        }

        if (conditions.length > 0) {
            baseQuery += ' WHERE ' + conditions.join(' AND ');
        }

        baseQuery += ' ORDER BY upload_date DESC';

        const [rows] = await pool.execute<RowDataPacket[]>(baseQuery, params);

        const documents = rows.map(row => ({
            id: row.id,
            name: row.filename,
            type: row.category,
            size: row.size,
            uploadDate: row.upload_date ? new Date(row.upload_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            ownerId: row.employee_id,
            fileType: row.file_type || 'pdf',
            url: row.url
        }));

        return NextResponse.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const permanent = searchParams.get('permanent') === 'true';

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await ensureIsDeletedColumn();
        await ensureDeletedAtColumn();

        if (session.user.role !== 'admin') {
            const [rows] = await pool.execute<RowDataPacket[]>('SELECT employee_id FROM documents WHERE id = ?', [id]);
            if (rows.length === 0 || rows[0].employee_id !== session.user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        if (permanent) {
            console.log('🗑️ Permanent delete requested for document ID:', id);

            // Get file URL before deleting from DB
            const [rows] = await pool.execute<RowDataPacket[]>('SELECT url, filename FROM documents WHERE id = ?', [id]);

            if (rows.length === 0) {
                console.warn('⚠️ Document not found in database:', id);
                return NextResponse.json({ error: 'Document not found' }, { status: 404 });
            }

            const document = rows[0];
            console.log('📄 Document details:', {
                id,
                filename: document.filename,
                url: document.url
            });

            if (document.url) {
                console.log('🔄 Attempting to delete physical file...');
                await deletePhysicalFile(document.url);
            } else {
                console.warn('⚠️ No URL found for document, skipping physical file deletion');
            }

            // Hard Delete from DB
            console.log('🗄️ Deleting from database...');
            await pool.execute('DELETE FROM documents WHERE id = ?', [id]);
            console.log('✅ Document permanently deleted from database');
        } else {
            // Soft Delete - mark as deleted with timestamp
            await pool.execute('UPDATE documents SET is_deleted = 1, deleted_at = NOW() WHERE id = ?', [id]);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting document:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await ensureIsDeletedColumn();
        await ensureDeletedAtColumn();

        // Check ownership if not admin
        if (session.user.role !== 'admin') {
            const [rows] = await pool.execute<RowDataPacket[]>('SELECT employee_id FROM documents WHERE id = ?', [id]);
            if (rows.length === 0 || rows[0].employee_id !== session.user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // Restore - clear deleted flag and timestamp
        await pool.execute('UPDATE documents SET is_deleted = 0, deleted_at = NULL WHERE id = ?', [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error restoring document:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
