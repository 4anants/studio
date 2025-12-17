import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;
        const userId = data.get('userId') as string;
        const docType = data.get('docType') as string;
        const month = data.get('month') as string;
        const year = data.get('year') as string;
        // const detectedName = data.get('detectedName') as string;

        if (!file || !userId) {
            return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 });
        }


        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Updated Directory Structure: storage_vault/{userId}/{docType}/{year}/{month}/
        const monthFolder = (parseInt(month) + 1).toString().padStart(2, '0');
        const safeDocType = docType.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        const vaultDir = 'storage_vault';
        const relativeStoragePath = join(vaultDir, userId, safeDocType, year, monthFolder);
        const uploadDir = join(process.cwd(), relativeStoragePath);

        // Create directory
        await mkdir(uploadDir, { recursive: true });

        // Filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedFilename = file.name.replace(/[^a-z0-9.]/gi, '_');
        const finalFilename = `${uniqueSuffix}-${sanitizedFilename}`;
        const filePath = join(uploadDir, finalFilename);
        const finalStoragePath = join(relativeStoragePath, finalFilename);

        // Encrypt and Save
        const { encryptBuffer } = await import('@/lib/encryption');
        const encryptedBuffer = encryptBuffer(buffer);
        await writeFile(filePath, encryptedBuffer);

        const sizeString = `${(file.size / 1024).toFixed(0)} KB`;
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        let fileType = 'pdf';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) fileType = 'image';
        else if (['doc', 'docx', 'xls', 'xlsx'].includes(ext)) fileType = 'doc';

        // Check for existing document
        let duplicateDoc: any = null;

        if (docType === 'Salary Slip') {
            // Check by Month/Year
            const targetMonth = parseInt(month) + 1;
            const [rows] = await pool.query<any[]>(
                `SELECT id, url, storage_path FROM documents 
                WHERE employee_id = ? 
                AND category = ? 
                AND is_deleted = 0 
                AND YEAR(upload_date) = ? 
                AND MONTH(upload_date) = ?`,
                [userId, docType, year, targetMonth]
            );
            if (rows.length > 0) duplicateDoc = rows[0];
        } else {
            // Check by filename
            const [rows] = await pool.query<any[]>(
                `SELECT id, url, storage_path FROM documents 
                 WHERE employee_id = ? 
                 AND filename = ? 
                 AND category = ? 
                 AND is_deleted = 0`,
                [userId, file.name, docType]
            );
            if (rows.length > 0) duplicateDoc = rows[0];
        }

        if (duplicateDoc) {
            // Update existing
            // Delete old file
            try {
                if (duplicateDoc.storage_path) {
                    const oldFilePath = join(process.cwd(), duplicateDoc.storage_path);
                    await unlink(oldFilePath);
                } else if (duplicateDoc.url && duplicateDoc.url.startsWith('/uploads')) {
                    const cleanUrl = duplicateDoc.url.startsWith('/') ? duplicateDoc.url.substring(1) : duplicateDoc.url;
                    const oldFilePath = join(process.cwd(), 'public', cleanUrl);
                    await unlink(oldFilePath);
                }
            } catch (e) {
                console.warn('Failed to delete old file:', e);
            }

            // Update DB
            // If we update, the URL should theoretically stay same if we want to preserve links,
            // BUT if we are migrating to secure URLs, we should update the URL to the API format.
            // AND we must ensure the ID is preserved.

            const newUrl = `/api/file?id=${duplicateDoc.id}`;

            await pool.execute(
                `UPDATE documents SET url = ?, size = ?, upload_date = NOW(), file_type = ?, storage_path = ?, is_encrypted = 1 WHERE id = ?`,
                [newUrl, sizeString, fileType, finalStoragePath, duplicateDoc.id]
            );
            return NextResponse.json({ success: true, url: newUrl, id: duplicateDoc.id });
        } else {
            // Insert new
            const docId = uuidv4();
            const publicUrl = `/api/file?id=${docId}`;

            await pool.execute(
                `INSERT INTO documents (
                id, employee_id, filename, upload_date, file_type, category, url, size, storage_path, is_encrypted
            ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
                [docId, userId, file.name, fileType, docType, publicUrl, sizeString, finalStoragePath, 1]
            );
            return NextResponse.json({ success: true, url: publicUrl, id: docId });
        }

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
