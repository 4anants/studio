import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { userIds, userId } = await req.json();

        // Handle both single (userId) and bulk (userIds) requests
        let idsToReset: string[] = [];
        if (userIds && Array.isArray(userIds)) {
            idsToReset = userIds;
        } else if (userId) {
            idsToReset = [userId];
        }

        if (idsToReset.length === 0) {
            return NextResponse.json({ error: 'No users specified' }, { status: 400 });
        }

        const defaultPassword = 'Welcome@123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        // Reset password for all specified users
        await pool.query(
            'UPDATE users SET password_hash = ? WHERE id IN (?)',
            [passwordHash, idsToReset]
        );

        return NextResponse.json({
            success: true,
            message: `Password reset successfully for ${idsToReset.length} users.`,
            count: idsToReset.length
        });

    } catch (error: any) {
        console.error('Error resetting password:', error);
        return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 });
    }
}
