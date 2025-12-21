import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    const connection = await pool.getConnection();

    try {
        // Check if domain column exists
        const [columns]: any = await connection.query(`
            SHOW COLUMNS FROM companies LIKE 'domain'
        `);

        if (columns.length === 0) {
            // Add domain column to companies table
            await connection.query(`
                ALTER TABLE companies 
                ADD COLUMN domain VARCHAR(255) AFTER email
            `);
            console.log('Added domain column to companies table');
        }

        connection.release();

        return NextResponse.json({
            success: true,
            message: 'Companies table updated with domain column',
            details: {
                domain_column: columns.length === 0 ? 'added' : 'exists'
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
