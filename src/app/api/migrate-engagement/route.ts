import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        logger.log('Starting Engagement Hub migration...');

        // 1. Events Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS engagement_events (
                id VARCHAR(255) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                time VARCHAR(50),
                location VARCHAR(255),
                type VARCHAR(50),
                color VARCHAR(50),
                description TEXT,
                target_location VARCHAR(255) DEFAULT 'ALL',
                target_department VARCHAR(255) DEFAULT 'ALL',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        logger.log('Table engagement_events created or already exists.');

        // 2. Resources Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS engagement_resources (
                id VARCHAR(255) PRIMARY KEY,
                category VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50),
                size VARCHAR(50),
                url TEXT,
                target_location VARCHAR(255) DEFAULT 'ALL',
                target_department VARCHAR(255) DEFAULT 'ALL',
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure status column exists (for existing tables)
        try {
            await pool.query("ALTER TABLE engagement_resources ADD COLUMN status VARCHAR(50) DEFAULT 'active'");
        } catch (e) {
            // Ignore error if column already exists
        }

        logger.log('Table engagement_resources created or updated.');

        // 3. Polls Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS engagement_polls (
                id VARCHAR(255) PRIMARY KEY,
                question TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                target_location VARCHAR(255) DEFAULT 'ALL',
                target_department VARCHAR(255) DEFAULT 'ALL',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        logger.log('Table engagement_polls created or already exists.');

        // 4. Poll Options Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS engagement_poll_options (
                id VARCHAR(255) PRIMARY KEY,
                poll_id VARCHAR(255) NOT NULL,
                text VARCHAR(255) NOT NULL,
                votes INT DEFAULT 0,
                FOREIGN KEY (poll_id) REFERENCES engagement_polls(id) ON DELETE CASCADE
            )
        `);
        logger.log('Table engagement_poll_options created or already exists.');

        // 5. Feedback Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS engagement_feedback (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                category VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        logger.log('Table engagement_feedback created or already exists.');

        // 6. User Votes Table (to prevent double voting)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS engagement_poll_votes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                poll_id VARCHAR(255) NOT NULL,
                user_id VARCHAR(255) NOT NULL,
                option_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY user_poll (user_id, poll_id),
                FOREIGN KEY (poll_id) REFERENCES engagement_polls(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        logger.log('Table engagement_poll_votes created or already exists.');

        return NextResponse.json({
            success: true,
            message: 'Engagement Hub tables migrated successfully!'
        });
    } catch (error: any) {
        logger.error('Error during engagement migration:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
