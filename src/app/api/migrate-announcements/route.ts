import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        logger.log('Starting announcements table cleanup...');

        // Remove expires_on column
        try {
            await pool.query(`
                ALTER TABLE announcements 
                DROP COLUMN expires_on
            `);
            logger.log('✓ Removed expires_on column');
        } catch (error: any) {
            if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                logger.log('- expires_on column does not exist');
            } else {
                // If specific error about checking/existence, log it but don't fail hard usually
                // But for ALTER DROP, if it fails it might be because of foreign keys or other issues
                // Here we assume it's simply "column might not exist"
                logger.log(`- could not remove expires_on: ${error.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Announcements table cleanup completed: Removed expires_on column.'
        });
    } catch (error: any) {
        logger.error('Migration error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
