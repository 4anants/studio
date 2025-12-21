import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const isAdmin = session?.user?.role === 'admin';
        const userEmail = session?.user?.email;

        let userDept = '';
        let userLoc = '';

        if (!isAdmin && userEmail) {
            const uRows = await query('SELECT department, location FROM users WHERE email = ?', [userEmail]) as any[];
            if (uRows.length > 0) {
                userDept = uRows[0].department;
                userLoc = uRows[0].location;
            }
        }

        let sql = 'SELECT * FROM engagement_events WHERE 1=1';
        const params: any[] = [];

        if (!isAdmin) {
            // Location Filter
            if (userLoc) {
                sql += ' AND (target_location = ? OR target_location = "ALL" OR target_location IS NULL)';
                params.push(userLoc);
            } else {
                sql += ' AND (target_location = "ALL" OR target_location IS NULL)';
            }

            // Department Filter
            if (userDept) {
                sql += ' AND (target_department = ? OR target_department = "ALL" OR target_department IS NULL)';
                params.push(userDept);
            } else {
                sql += ' AND (target_department = "ALL" OR target_department IS NULL)';
            }
        } else {
            // Admin can filter via params if desired
            const { searchParams } = new URL(req.url);
            const location = searchParams.get('location');
            const department = searchParams.get('department');

            if (location && location !== 'ALL') {
                sql += ' AND (target_location = ? OR target_location = "ALL")';
                params.push(location);
            }

            if (department && department !== 'ALL') {
                sql += ' AND (target_department = ? OR target_department = "ALL")';
                params.push(department);
            }
        }

        sql += ' ORDER BY date ASC';

        const events = await query(sql, params);
        return NextResponse.json(events);
    } catch (error) {
        logger.error('Error fetching events:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, date, time, location, type, color, description, target_location, target_department } = body;

        const id = uuidv4();
        await query(
            'INSERT INTO engagement_events (id, title, date, time, location, type, color, description, target_location, target_department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, date, time, location, type, color || 'bg-blue-500', description, target_location || 'ALL', target_department || 'ALL']
        );

        return NextResponse.json({ success: true, id });
    } catch (error) {
        logger.error('Error creating event:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await query('DELETE FROM engagement_events WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error deleting event:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
