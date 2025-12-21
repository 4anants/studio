
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { join, extname } from 'path';
import { createReadStream, statSync } from 'fs';
import { stat } from 'fs/promises';
import { getDecryptedStream } from '@/lib/encryption';
import { logger } from '@/lib/logger';

function getMimeType(filename: string): string {
    const ext = extname(filename).toLowerCase();
    switch (ext) {
        case '.pdf': return 'application/pdf';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.png': return 'image/png';
        case '.gif': return 'image/gif';
        case '.webp': return 'image/webp';
        case '.doc': return 'application/msword';
        case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case '.xls': return 'application/vnd.ms-excel';
        case '.xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case '.txt': return 'text/plain';
        default: return 'application/octet-stream';
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch document metadata
        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT * FROM documents WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const doc = rows[0];

        // Access Control
        if (session.user.role !== 'admin' && doc.employee_id !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Determine File Path
        let filePath = '';
        const isEncrypted = doc.is_encrypted === 1;

        if (doc.storage_path) {
            // New path system
            filePath = join(process.cwd(), doc.storage_path);
        } else if (doc.url && doc.url.startsWith('/uploads/')) {
            // Legacy path system
            // doc.url is like "/uploads/USER/..."
            // FS path is public/uploads/USER/...
            const relativePath = doc.url.startsWith('/') ? doc.url.substring(1) : doc.url;
            filePath = join(process.cwd(), 'public', relativePath);
        } else {
            return NextResponse.json({ error: 'File path not found' }, { status: 404 });
        }

        // Verify file exists
        try {
            await stat(filePath);
        } catch {
            logger.error(`File missing at ${filePath}`);
            return NextResponse.json({ error: 'File not found on server' }, { status: 404 });
        }

        // Create Stream
        let fileStream;
        if (isEncrypted) {
            fileStream = await getDecryptedStream(filePath);
        } else {
            fileStream = createReadStream(filePath);
        }

        // Streaming Response
        // Next.js App Router streaming: return a specialized Response
        // We can pass the stream directly to the Response body

        // Node Readable to Web ReadableStream?
        // Actually, we can just use the Node stream if we bypass the NextResponse wrapper slightly,
        // or iterate chunks. 
        // Newer Next.js supports passing a Node stream to `new Response(stream)`.

        // Let's use `Iterator.toReadableStream` style adapter or simple generator
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of fileStream) {
                    controller.enqueue(chunk);
                }
                controller.close();
            }
        });

        const headers = new Headers();
        headers.set('Content-Type', getMimeType(doc.filename));
        headers.set('Content-Disposition', `inline; filename="${doc.filename}"`);
        headers.set('Cache-Control', 'private, max-age=3600');

        return new Response(stream, {
            status: 200,
            headers
        });

    } catch (error) {
        logger.error('Download error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
