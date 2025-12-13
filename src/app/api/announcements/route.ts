import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM announcements ORDER BY date DESC');
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error in GET /api/announcements:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, title, message, date, author, event_date, status, is_read } = body;

        await pool.execute(
            `INSERT INTO announcements (id, title, message, date, author, event_date, status, is_read) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             title = VALUES(title),
             message = VALUES(message),
             date = VALUES(date),
             author = VALUES(author),
             event_date = VALUES(event_date),
             status = VALUES(status),
             is_read = VALUES(is_read)`,
            [id, title, message, date, author, event_date, status || 'published', is_read || true]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in POST /api/announcements:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        await pool.execute('DELETE FROM announcements WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/announcements:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
