import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const location = searchParams.get('location');
        const department = searchParams.get('department');
        const status = searchParams.get('status') || 'active';

        let sql = 'SELECT * FROM engagement_resources WHERE 1=1';
        const params: any[] = [];

        if (status !== 'all') {
            sql += ' AND (status = ? OR status IS NULL)'; // Handle legacy NULL as active if needed, but we set default 'active'
            params.push(status);
        }

        if (location && location !== 'ALL') {
            sql += ' AND (target_location = ? OR target_location = "ALL")';
            params.push(location);
        }

        if (department && department !== 'ALL') {
            sql += ' AND (target_department = ? OR target_department = "ALL")';
            params.push(department);
        }

        sql += ' ORDER BY created_at DESC';

        const resources = await query(sql, params);
        return NextResponse.json(resources);
    } catch (error) {
        logger.error('Error fetching resources:', error);
        return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // Check if this is a RESTORE action
        if (body.action === 'restore' && body.id) {
            await query('UPDATE engagement_resources SET status = "active" WHERE id = ?', [body.id]);
            return NextResponse.json({ success: true });
        }

        const { category, name, type, size, url, target_location, target_department } = body;

        const id = uuidv4();
        await query(
            'INSERT INTO engagement_resources (id, category, name, type, size, url, target_location, target_department, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, category, name, type, size, url, target_location || 'ALL', target_department || 'ALL', 'active']
        );

        return NextResponse.json({ success: true, id });
    } catch (error) {
        logger.error('Error creating resource:', error);
        return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
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

        // Check current status
        const [current] = await query('SELECT status FROM engagement_resources WHERE id = ?', [id]);

        if (!current) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        if (current.status === 'deleted') {
            // Permanent Delete
            await query('DELETE FROM engagement_resources WHERE id = ?', [id]);
        } else {
            // Soft Delete
            await query('UPDATE engagement_resources SET status = "deleted" WHERE id = ?', [id]);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error deleting resource:', error);
        return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
    }
}
