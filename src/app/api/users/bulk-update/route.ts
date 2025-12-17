import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { userIds, updates } = await req.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: 'No users specified' }, { status: 400 });
        }

        if (!updates || Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No updates specified' }, { status: 400 });
        }

        const allowedUpdates: any = {};
        // Map frontend fields to DB columns
        if (updates.status) allowedUpdates.status = updates.status;
        if (updates.role) allowedUpdates.is_admin = (updates.role === 'admin');

        if (Object.keys(allowedUpdates).length === 0) {
            return NextResponse.json({ error: 'Invalid updates provided' }, { status: 400 });
        }

        const setClauses: string[] = [];
        const values: any[] = [];

        for (const [key, value] of Object.entries(allowedUpdates)) {
            setClauses.push(`${key} = ?`);
            values.push(value);
        }

        // Add userIds to values for the IN clause
        values.push(userIds);

        // Prevent updating super admin if accidentally included (though UI should prevent it)
        const safeUserIds = userIds.filter((id: string) => id !== 'sadmin');

        if (safeUserIds.length > 0) {
            const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id IN (?)`;
            await pool.query(query, [...values.slice(0, -1), safeUserIds]);
        }

        return NextResponse.json({ success: true, count: safeUserIds.length });

    } catch (error: any) {
        console.error('Error bulk updating users:', error);
        return NextResponse.json({ error: error.message || 'Failed to update users' }, { status: 500 });
    }
}
