import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { feedbackId } = body;
        const userId = session.user.id;

        // Check if already voted
        const existing = await query('SELECT id FROM engagement_feedback_votes WHERE user_id = ? AND feedback_id = ?', [userId, feedbackId]);

        if (existing.length > 0) {
            // Remove vote (toggle)
            await query('DELETE FROM engagement_feedback_votes WHERE user_id = ? AND feedback_id = ?', [userId, feedbackId]);
            await query('UPDATE engagement_feedback SET votes = votes - 1 WHERE id = ?', [feedbackId]);
            return NextResponse.json({ success: true, voted: false });
        } else {
            // Add vote
            const id = uuidv4();
            await query('INSERT INTO engagement_feedback_votes (id, user_id, feedback_id) VALUES (?, ?, ?)', [id, userId, feedbackId]);
            await query('UPDATE engagement_feedback SET votes = votes + 1 WHERE id = ?', [feedbackId]);
            return NextResponse.json({ success: true, voted: true });
        }
    } catch (error) {
        logger.error('Error voting on feedback:', error);
        return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
    }
}
