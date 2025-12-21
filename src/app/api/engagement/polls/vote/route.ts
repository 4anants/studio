import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await req.json();
        const { pollId, optionId } = body;

        if (!pollId || !optionId) {
            return NextResponse.json({ error: 'Missing pollId or optionId' }, { status: 400 });
        }

        // 1. Check if user already voted for this poll
        const existingVote: any = await query('SELECT id FROM engagement_poll_votes WHERE poll_id = ? AND user_id = ?', [pollId, userId]);

        if (existingVote.length > 0) {
            return NextResponse.json({ error: 'Already voted' }, { status: 400 });
        }

        // 2. Register vote
        await query(
            'INSERT INTO engagement_poll_votes (poll_id, user_id, option_id) VALUES (?, ?, ?)',
            [pollId, userId, optionId]
        );

        // 3. Increment vote count in options table
        await query(
            'UPDATE engagement_poll_options SET votes = votes + 1 WHERE id = ?',
            [optionId]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: 'Already voted' }, { status: 400 });
        }
        logger.error('Error voting:', error);
        return NextResponse.json({ error: 'Failed to register vote' }, { status: 500 });
    }
}
