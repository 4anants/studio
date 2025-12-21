import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requireAuth } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

export async function GET() {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const session = auth.session;
    const isAdmin = session?.user?.role === 'admin';
    const userEmail = session?.user?.email;

    try {
        let userLoc = '';
        if (!isAdmin && userEmail) {
            const [uRows] = await pool.query<RowDataPacket[]>('SELECT location FROM users WHERE email = ?', [userEmail]);
            if (uRows.length > 0) userLoc = uRows[0].location;
        }

        let sql = 'SELECT * FROM holidays';
        const params: any[] = [];
        const conditions: string[] = [];

        if (!isAdmin) {
            if (userLoc) {
                conditions.push('(location = ? OR location = "ALL" OR location IS NULL OR location = "")');
                params.push(userLoc);
            } else {
                conditions.push('(location = "ALL" OR location IS NULL OR location = "")');
            }
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY date ASC';

        const [rows] = await pool.query<RowDataPacket[]>(sql, params);
        return NextResponse.json(rows);
    } catch (error) {
        logger.error('Error fetching holidays:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAuth();
    if (!auth.authorized || auth.session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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
        logger.error('Error creating/updating holiday:', error);
        return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await requireAuth();
    if (!auth.authorized || auth.session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        await pool.execute('DELETE FROM holidays WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        logger.error('Error deleting holiday:', error);
        return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
    }
}
