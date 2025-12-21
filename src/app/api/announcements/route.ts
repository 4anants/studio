import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const session = auth.session;
    const isAdmin = session?.user?.role === 'admin';
    const userEmail = session?.user?.email;

    try {
        let userDept = '';
        if (!isAdmin && userEmail) {
            const [uRows] = await pool.query<RowDataPacket[]>('SELECT department FROM users WHERE email = ?', [userEmail]);
            if (uRows.length > 0) userDept = uRows[0].department;
        }

        let sql = `
            SELECT 
                id, 
                title, 
                message, 
                date, 
                author, 
                status, 
                priority, 
                event_date as eventDate, 
                target_departments as targetDepartments 
            FROM announcements 
        `;

        const params: any[] = [];
        const conditions: string[] = [];

        if (!isAdmin) {
            conditions.push("status = 'published'");
            if (userDept) {
                conditions.push(`(
                    target_departments IS NULL 
                    OR target_departments = '' 
                    OR target_departments LIKE '%ALL%'
                    OR target_departments LIKE ?
                )`);
                params.push(`%${userDept}%`);
            } else {
                conditions.push(`(
                    target_departments IS NULL 
                    OR target_departments = '' 
                    OR target_departments LIKE '%ALL%'
                 )`);
            }
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY event_date ASC';

        const [rows] = await pool.query<RowDataPacket[]>(sql, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error in GET /api/announcements:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAuth();
    if (!auth.authorized || auth.session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, title, message, date, author, event_date, status, priority, target_departments } = body;

        await pool.execute(
            `INSERT INTO announcements (id, title, message, date, author, event_date, status, priority, target_departments) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             title = VALUES(title),
             message = VALUES(message),
             date = VALUES(date),
             author = VALUES(author),
             event_date = VALUES(event_date),
             status = VALUES(status),
             priority = VALUES(priority),
             target_departments = VALUES(target_departments)`,
            [
                id,
                title,
                message,
                formatDateForMySQL(date),
                author,
                formatDateForMySQL(event_date),
                status || 'published',
                priority || 'medium',
                target_departments || null
            ]
        );

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error in POST /api/announcements:', error);
        return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
    }
}

function formatDateForMySQL(dateString: string | undefined): string | null {
    if (!dateString) return null;
    try {
        return new Date(dateString).toISOString().slice(0, 19).replace('T', ' ');
    } catch (e) {
        return null;
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await requireAuth();
    if (!auth.authorized || auth.session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        await pool.execute('DELETE FROM announcements WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in DELETE /api/announcements:', error);
        return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
    }
}
