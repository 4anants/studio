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

        // Directory Structure: public/uploads/{userId}/{docType}/{year}/{month}/
        // Sanitizing inputs to prevent directory traversal is handled by not letting user define structure openly,
        // but we should still be careful with filenames.

        // Fix: Month is 0-11 index, usually we want 01-12 for folders
        const monthFolder = (parseInt(month) + 1).toString().padStart(2, '0');

        // Sanitize doc type for folder name
        const safeDocType = docType.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        const uploadDir = join(process.cwd(), 'public', 'uploads', userId, safeDocType, year, monthFolder);

        // Create directory
        await mkdir(uploadDir, { recursive: true });

        // Filename: Using original or customized?
        // Let's keep original but ensure unique or timestamped?
        // For now, overwrite if exists or just save.
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedFilename = file.name.replace(/[^a-z0-9.]/gi, '_');
        const finalFilename = `${uniqueSuffix}-${sanitizedFilename}`;
        const filePath = join(uploadDir, finalFilename);

        // Save File
        await writeFile(filePath, buffer);

        // Public URL (relative)
        const publicUrl = `/uploads/${userId}/${safeDocType}/${year}/${monthFolder}/${finalFilename}`;

        // Format Upload Date (approximate to 1st of that month/year for record? or Current Time?)
        // Usually 'upload_date' is NOW.

        // DB Check for collision based on rules
        // For 'Salary Slip', we only allow one per month.
        let existingDocs: any[] = [];
        const targetFolderStr = `/${year}/${monthFolder}/`;

        if (docType === 'Salary Slip') {
            // Find any salary slip for this user in this month
            const folderPrefix = `/uploads/${userId}/${safeDocType}/${year}/${monthFolder}/`;
            const [rows] = await pool.query<any[]>(
                `SELECT id, url FROM documents WHERE employee_id = ? AND category = ? AND is_deleted = 0 AND url LIKE ?`,
                [userId, docType, `${folderPrefix}%`]
            );
            existingDocs = rows;
        } else {
            const [rows] = await pool.query<any[]>(
                `SELECT id, url FROM documents WHERE employee_id = ? AND filename = ? AND category = ? AND is_deleted = 0`,
                [userId, file.name, docType]
            );
            existingDocs = rows;
        }

        const duplicateDoc = existingDocs.find((d: any) => d.url.includes(targetFolderStr));

        const sizeString = `${(file.size / 1024).toFixed(0)} KB`;
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        let fileType = 'pdf';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) fileType = 'image';
        else if (['doc', 'docx', 'xls', 'xlsx'].includes(ext)) fileType = 'doc';

        if (duplicateDoc) {
            // Update existing
            // Try to delete old file
            try {
                const oldFilePath = join(process.cwd(), 'public', duplicateDoc.url);
                await unlink(oldFilePath);
            } catch (e) {
                console.warn('Failed to delete old file:', e);
            }

            await pool.execute(
                `UPDATE documents SET url = ?, size = ?, upload_date = NOW(), file_type = ? WHERE id = ?`,
                [publicUrl, sizeString, fileType, duplicateDoc.id]
            );
            return NextResponse.json({ success: true, url: publicUrl, id: duplicateDoc.id });
        } else {
            // Insert new
            const docId = uuidv4();
            await pool.execute(
                `INSERT INTO documents (
                id, employee_id, filename, upload_date, file_type, category, url, size
            ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)`,
                [docId, userId, file.name, fileType, docType, publicUrl, sizeString]
            );
            return NextResponse.json({ success: true, url: publicUrl, id: docId });
        }
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
