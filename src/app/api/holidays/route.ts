import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
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
            'INSERT INTO holidays (id, name, date, location) VALUES (?, ?, ?, ?)',
            [id, name, date, location]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error creating holiday:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
