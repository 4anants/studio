import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM companies ORDER BY name ASC');
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching companies:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, short_name, address, phone, email } = body;

        await pool.execute(
            `INSERT INTO companies (id, name, short_name, address, phone, email) 
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             short_name = VALUES(short_name),
             address = VALUES(address),
             phone = VALUES(phone),
             email = VALUES(email)`,
            [id, name, short_name, address, phone, email]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error creating company:', error);
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
        await pool.execute('DELETE FROM companies WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting company:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
