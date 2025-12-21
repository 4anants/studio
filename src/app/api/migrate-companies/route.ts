import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        logger.log('Checking if location column exists in companies table...');

        // Check if column already exists
        const [columns]: any = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'companies' 
      AND COLUMN_NAME = 'location'
    `);

        if (columns.length > 0) {
            return NextResponse.json({
                success: true,
                message: 'Location column already exists!',
                alreadyExists: true
            });
        }

        logger.log('Adding location column to companies table...');

        await pool.query(`
      ALTER TABLE companies 
      ADD COLUMN location VARCHAR(255) DEFAULT NULL
    `);

        logger.log('Location column added successfully!');

        // Verify
        const [result]: any = await pool.query('DESCRIBE companies');

        return NextResponse.json({
            success: true,
            message: 'Location column added successfully!',
            tableStructure: result
        });
    } catch (error: any) {
        logger.error('Error adding location column:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
