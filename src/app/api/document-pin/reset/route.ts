import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    // Only admins can reset other users' PINs
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { userId, userIds } = await req.json();

        if (!userId && (!userIds || !Array.isArray(userIds) || userIds.length === 0)) {
            return NextResponse.json({ error: 'User ID or User IDs array is required' }, { status: 400 });
        }

        const idsToReset = (userIds && Array.isArray(userIds) && userIds.length > 0) ? userIds : [userId];

        // Ensure columns exist (self-healing schema)
        try {
            await pool.query('SELECT document_pin FROM users LIMIT 1');
        } catch (err: any) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding PIN columns to users table (lazy migration)...');

                const addColumnSafe = async (query: string) => {
                    try {
                        await pool.query(query);
                    } catch (e: any) {
                        // Ignore duplicate column name error (ER_DUP_FIELDNAME)
                        if (e.code !== 'ER_DUP_FIELDNAME') {
                            console.warn('Warning during schema update:', e.message);
                        }
                    }
                };

                await addColumnSafe('ALTER TABLE users ADD COLUMN document_pin VARCHAR(255) NULL');
                await addColumnSafe('ALTER TABLE users ADD COLUMN pin_set BOOLEAN DEFAULT 0');
                await addColumnSafe('ALTER TABLE users ADD COLUMN failed_pin_attempts INT DEFAULT 0');
                await addColumnSafe('ALTER TABLE users ADD COLUMN pin_locked_until TIMESTAMP NULL DEFAULT NULL');
            }
        }

        // Reset the PIN fields for all target users
        await pool.query(
            'UPDATE users SET document_pin = NULL, pin_set = 0, failed_pin_attempts = 0, pin_locked_until = NULL WHERE id IN (?)',
            [idsToReset]
        );

        return NextResponse.json({ message: 'User PINs reset successfully', count: idsToReset.length });
    } catch (error: any) {
        console.error('Error resetting PIN:', error);
        return NextResponse.json({ error: error.message || 'Failed to reset PIN' }, { status: 500 });
    }
}
