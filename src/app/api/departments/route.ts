import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM departments ORDER BY created_at DESC');
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching departments:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, status } = body;

        // Validation
        if (!name && !id) {
            return NextResponse.json({ error: 'Name or ID required' }, { status: 400 });
        }

        // If ID provided (e.g. restore/soft-delete/update status), update specific record
        if (id) {
            await pool.execute('UPDATE departments SET status = ? WHERE id = ?', [status || 'active', id]);
            // Also update name if provided? But main use case is status change.
            if (name) {
                await pool.execute('UPDATE departments SET name = ? WHERE id = ?', [name, id]);
            }
            return NextResponse.json({ success: true });
        }

        // Create New Case
        if (name) {
            // Check existence by name
            const [existing] = await pool.execute<RowDataPacket[]>('SELECT * FROM departments WHERE name = ?', [name]);
            if (existing.length > 0) {
                const dept = existing[0];
                if (dept.status === 'deleted') {
                    // Restore
                    await pool.execute('UPDATE departments SET status = ? WHERE id = ?', ['active', dept.id]);
                    return NextResponse.json({ success: true, message: 'Restored from deleted' });
                } else {
                    return NextResponse.json({ error: 'Department already exists' }, { status: 409 });
                }
            }

            // Insert
            const newId = `dept-${Date.now()}`;
            await pool.execute('INSERT INTO departments (id, name, status) VALUES (?, ?, ?)', [newId, name, 'active']);
            return NextResponse.json({ success: true, id: newId });
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    } catch (error) {
        console.error('Error in departments API:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Permanent Delete
        await pool.execute('DELETE FROM departments WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting department:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
