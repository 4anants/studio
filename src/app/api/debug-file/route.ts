import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { access, constants, unlink } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('docId');

    if (!docId) {
        return NextResponse.json({ error: 'docId parameter required' }, { status: 400 });
    }

    try {
        // Get document from database
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT id, filename, url, employee_id FROM documents WHERE id = ?',
            [docId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Document not found in database' }, { status: 404 });
        }

        const doc = rows[0];
        const cleanUrl = doc.url?.startsWith('/') ? doc.url.substring(1) : doc.url;
        const filePath = join(process.cwd(), 'public', cleanUrl || '');

        let fileExists = false;
        let fileError = null;

        try {
            await access(filePath, constants.F_OK);
            fileExists = true;
        } catch (error: any) {
            fileError = error.message;
        }

        return NextResponse.json({
            document: {
                id: doc.id,
                filename: doc.filename,
                url: doc.url,
                employee_id: doc.employee_id
            },
            filesystem: {
                cleanUrl,
                fullPath: filePath,
                fileExists,
                fileError
            },
            instructions: {
                message: 'This endpoint helps debug file deletion issues',
                nextSteps: fileExists
                    ? 'File exists. You can try permanent delete now.'
                    : 'File does not exist. Check if URL in database is correct.'
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            error: 'Debug failed',
            details: error.message
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('docId');
    const action = searchParams.get('action'); // 'check' or 'delete'

    if (!docId) {
        return NextResponse.json({ error: 'docId parameter required' }, { status: 400 });
    }

    try {
        // Get document from database
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT id, filename, url FROM documents WHERE id = ?',
            [docId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const doc = rows[0];
        const cleanUrl = doc.url?.startsWith('/') ? doc.url.substring(1) : doc.url;
        const filePath = join(process.cwd(), 'public', cleanUrl || '');

        if (action === 'delete') {
            // Attempt to delete the file
            try {
                await access(filePath, constants.F_OK);
                await unlink(filePath);

                return NextResponse.json({
                    success: true,
                    message: 'File deleted successfully',
                    path: filePath
                });
            } catch (error: any) {
                return NextResponse.json({
                    success: false,
                    error: 'Failed to delete file',
                    details: {
                        message: error.message,
                        code: error.code,
                        path: filePath
                    }
                }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Invalid action. Use ?action=delete' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({
            error: 'Operation failed',
            details: error.message
        }, { status: 500 });
    }
}
