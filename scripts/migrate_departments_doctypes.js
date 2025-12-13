const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function migrate() {
    const connectionConfig = {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    };

    console.log('Connecting to database with config:', { ...connectionConfig, password: '****' });

    const pool = mysql.createPool(connectionConfig);

    try {
        console.log('Creating departments table...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS departments (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                status ENUM('active', 'deleted') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('departments table created/verified.');

        console.log('Creating document_types table...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS document_types (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                status ENUM('active', 'deleted') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('document_types table created/verified.');

        // Seed Departments
        const [deptRows] = await pool.execute('SELECT COUNT(*) as count FROM departments');
        if (deptRows[0].count === 0) {
            console.log('Seeding departments...');
            const departments = ['Human Resources', 'Engineering', 'Marketing', 'Sales', 'Information & Technology'];
            for (const dept of departments) {
                await pool.execute('INSERT INTO departments (id, name, status) VALUES (?, ?, ?)', [dept.toLowerCase().replace(/\s+/g, '-'), dept, 'active']);
            }
            console.log('Departments seeded.');
        }

        // Seed Document Types
        const [docTypeRows] = await pool.execute('SELECT COUNT(*) as count FROM document_types');
        if (docTypeRows[0].count === 0) {
            console.log('Seeding document_types...');
            const docTypes = ['Salary Slip', 'Medical Report', 'Appraisal Letter', 'Personal'];
            for (const type of docTypes) {
                await pool.execute('INSERT INTO document_types (id, name, status) VALUES (?, ?, ?)', [type.toLowerCase().replace(/\s+/g, '-'), type, 'active']);
            }
            console.log('Document Types seeded.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
