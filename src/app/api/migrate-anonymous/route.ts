import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    const connection = await pool.getConnection();
    try {
        // Check and add is_anonymous column to engagement_feedback table
        const [feedbackColumns]: any = await connection.query(`
            SHOW COLUMNS FROM engagement_feedback LIKE 'is_anonymous'
        `);

        if (feedbackColumns.length === 0) {
            await connection.query(`
                ALTER TABLE engagement_feedback 
                ADD COLUMN is_anonymous TINYINT(1) DEFAULT 0 AFTER is_public
            `);
            console.log('Added is_anonymous to engagement_feedback');
        }

        // Check and add is_anonymous column to engagement_polls table
        const [pollsAnonymousColumns]: any = await connection.query(`
            SHOW COLUMNS FROM engagement_polls LIKE 'is_anonymous'
        `);

        if (pollsAnonymousColumns.length === 0) {
            await connection.query(`
                ALTER TABLE engagement_polls 
                ADD COLUMN is_anonymous TINYINT(1) DEFAULT 0
            `);
            console.log('Added is_anonymous to engagement_polls');
        }

        // Check and add created_by column to engagement_polls table
        const [pollsCreatedByColumns]: any = await connection.query(`
            SHOW COLUMNS FROM engagement_polls LIKE 'created_by'
        `);

        if (pollsCreatedByColumns.length === 0) {
            await connection.query(`
                ALTER TABLE engagement_polls 
                ADD COLUMN created_by VARCHAR(255)
            `);
            console.log('Added created_by to engagement_polls');
        }

        connection.release();
        return NextResponse.json({
            success: true,
            message: 'Anonymous feature columns added successfully',
            details: {
                feedback_is_anonymous: feedbackColumns.length === 0 ? 'added' : 'exists',
                polls_is_anonymous: pollsAnonymousColumns.length === 0 ? 'added' : 'exists',
                polls_created_by: pollsCreatedByColumns.length === 0 ? 'added' : 'exists'
            }
        });
    } catch (error: any) {
        connection.release();
        console.error('Migration error:', error);
        return NextResponse.json({
            error: error.message,
            sqlMessage: error.sqlMessage
        }, { status: 500 });
    }
}
