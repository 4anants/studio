
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function PATCH(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { photo_x_offset, photo_y_offset, photo_scale } = body;

        // Ensure columns exist (lazy migration)
        try {
            await pool.query('SELECT photo_x_offset FROM users LIMIT 1');
        } catch (err: any) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                logger.log('Adding photo offset columns to users table...');
                const addColumnSafe = async (query: string) => {
                    try {
                        await pool.query(query);
                    } catch (e: any) {
                        if (e.code !== 'ER_DUP_FIELDNAME') logger.warn(e.message);
                    }
                };
                await addColumnSafe('ALTER TABLE users ADD COLUMN photo_x_offset INT DEFAULT 0');
                await addColumnSafe('ALTER TABLE users ADD COLUMN photo_y_offset INT DEFAULT 0');
                await addColumnSafe('ALTER TABLE users ADD COLUMN photo_scale FLOAT DEFAULT 1.0');
            }
        }

        await pool.execute(
            'UPDATE users SET photo_x_offset = ?, photo_y_offset = ?, photo_scale = ? WHERE id = ?',
            [photo_x_offset || 0, photo_y_offset || 0, photo_scale || 1, session.user.id]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        logger.error('Error updating profile photo settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
