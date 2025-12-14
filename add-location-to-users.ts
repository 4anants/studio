
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pool from './src/lib/db';

async function addLocationToUsers() {
    try {
        console.log('Checking if location column exists in users table...');

        // Check if column already exists
        const [columns]: any = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'location'
    `);

        if (columns.length > 0) {
            console.log('✅ Location column already exists in users table!');
        } else {
            console.log('Adding location column to users table...');
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN location VARCHAR(255) DEFAULT NULL AFTER company_id
            `);
            console.log('✅ Location column added successfully!');
        }

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addLocationToUsers();
