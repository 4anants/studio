import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { unlink, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await request.formData();
        const file: File | null = formData.get('file') as unknown as File;
        const category = formData.get('category') as string || 'Personal';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const userId = session.user.id;
        const year = new Date().getFullYear().toString();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

        // Sanitize category folder
        const safeCategory = category.replace(/[^a-z0-9]/gi, '_').toLowerCase();


        // Generate ID early to use in URL
        const docId = uuidv4();

        // Updated Directory Structure: storage_vault/{userId}/{category}/{year}/{month}/
        const vaultDir = 'storage_vault';
        const relativeStoragePath = join(vaultDir, userId, safeCategory, year, month);
        const uploadDir = join(process.cwd(), relativeStoragePath);

        await mkdir(uploadDir, { recursive: true });

        // Unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedFilename = file.name.replace(/[^a-z0-9.]/gi, '_');
        const finalFilename = `${uniqueSuffix}-${sanitizedFilename}`;
        const filePath = join(uploadDir, finalFilename);
        const finalStoragePath = join(relativeStoragePath, finalFilename);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Encrypt and Save
        const { encryptBuffer } = await import('@/lib/encryption');
        const encryptedBuffer = encryptBuffer(buffer);
        await writeFile(filePath, encryptedBuffer);

        // URL points to the secure gatekeeper
        const publicUrl = `/api/file?id=${docId}`;
        const sizeString = `${(file.size / 1024).toFixed(0)} KB`;
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        let fileType = 'pdf';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) fileType = 'image';
        else if (['doc', 'docx', 'xls', 'xlsx'].includes(ext)) fileType = 'doc';

        await pool.execute(
            `INSERT INTO documents (
            id, employee_id, filename, upload_date, file_type, category, url, size, storage_path, is_encrypted
        ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
            [docId, userId, file.name, fileType, category, publicUrl, sizeString, finalStoragePath, 1]
        );

        return NextResponse.json({ success: true, id: docId, url: publicUrl });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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

            // Get file details before deleting from DB
            const [rows] = await pool.execute<RowDataPacket[]>('SELECT url, filename, storage_path FROM documents WHERE id = ?', [id]);

            if (rows.length === 0) {
                console.warn('⚠️ Document not found in database:', id);
                return NextResponse.json({ error: 'Document not found' }, { status: 404 });
            }

            const document = rows[0];
            console.log('📄 Document details:', {
                id,
                filename: document.filename,
                url: document.url,
                storage_path: document.storage_path
            });

            if (document.storage_path) {
                console.log('🔒 Encrypted file detected. Deleting from vault...');
                try {
                    const filePath = join(process.cwd(), document.storage_path);
                    await unlink(filePath);
                    console.log('✅ Successfully deleted from vault:', filePath);
                } catch (err: any) {
                    console.error('❌ Error deleting from vault:', err);
                    if (err.code !== 'ENOENT') {
                        // Log but continue to delete DB record? Yes, otherwise we get stuck.
                    }
                }
            } else if (document.url) {
                console.log('🔄 Legacy file detected. Attempting to delete physical file...');
                await deletePhysicalFile(document.url);
            } else {
                console.warn('⚠️ No URL or storage_path found for document, skipping physical file deletion');
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
