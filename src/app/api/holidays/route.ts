import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM holidays ORDER BY date ASC');
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching holidays:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, date, location } = body;

        await pool.execute(
            `INSERT INTO holidays (id, name, date, location) 
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             date = VALUES(date),
             location = VALUES(location)`,
            [id, name, date, location]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error creating/updating holiday:', error);
        return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        await pool.execute('DELETE FROM holidays WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting holiday:', error);
        return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
    }
}
