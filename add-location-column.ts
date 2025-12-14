// Run this script to add the missing location column to companies table
// Usage: npx tsx add-location-column.ts

import pool from './src/lib/db';

async function addLocationColumn() {
    try {
        console.log('Checking if location column exists...');

        // Check if column already exists
        const [columns]: any = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'companies' 
      AND COLUMN_NAME = 'location'
    `);

        if (columns.length > 0) {
            console.log('✅ Location column already exists!');
            process.exit(0);
        }

        console.log('Adding location column to companies table...');

        await pool.query(`
      ALTER TABLE companies 
      ADD COLUMN location VARCHAR(255) DEFAULT NULL AFTER email
    `);

        console.log('✅ Location column added successfully!');

        // Verify
        const [result]: any = await pool.query('DESCRIBE companies');
        console.log('\nCompanies table structure:');
        console.table(result);

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addLocationColumn();
