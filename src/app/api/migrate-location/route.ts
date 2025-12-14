
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        console.log('Checking location column in users table...');

        // Check if column exists
        const [columns]: any = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'location'
        `);

        if (columns.length > 0) {
            return NextResponse.json({ message: 'Location column already exists in users table' });
        }

        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN location VARCHAR(255) DEFAULT NULL AFTER company_id
        `);

        return NextResponse.json({ message: 'Location column added successfully to users table' });
    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
