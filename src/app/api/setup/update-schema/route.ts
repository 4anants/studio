import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        // Update engagement_feedback table
        try {
            await query('ALTER TABLE engagement_feedback ADD COLUMN is_public BOOLEAN DEFAULT 0');
        } catch (e) {
            // Column likely exists
        }

        try {
            await query('ALTER TABLE engagement_feedback ADD COLUMN votes INT DEFAULT 0');
        } catch (e) {
            // Column likely exists
        }

        // Create feedback votes table for uniqueness
        await query(`
            CREATE TABLE IF NOT EXISTS engagement_feedback_votes (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                feedback_id VARCHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_vote (user_id, feedback_id)
            )
        `);

        return NextResponse.json({ success: true, message: "Schema updated successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
