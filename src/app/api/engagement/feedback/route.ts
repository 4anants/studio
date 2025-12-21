import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let sql = `
            SELECT f.*, 
            CASE WHEN f.is_anonymous = 1 THEN 'Anonymous' ELSE u.first_name END as user_name, 
            CASE WHEN f.is_anonymous = 1 THEN 'anonymous@system.local' ELSE u.email END as user_email,
            (SELECT COUNT(*) FROM engagement_feedback_votes v WHERE v.feedback_id = f.id) as vote_count,
            (SELECT COUNT(*) > 0 FROM engagement_feedback_votes v WHERE v.feedback_id = f.id AND v.user_id = ?) as has_voted
            FROM engagement_feedback f
            JOIN users u ON f.user_id = u.id
            WHERE 1=1
        `;

        const params: any[] = [session.user.id];

        // If not admin, only show public feedback OR their own feedback
        if (session.user.role !== 'admin') {
            sql += ' AND (f.is_public = 1 OR f.user_id = ?)';
            params.push(session.user.id);
        }

        sql += ' ORDER BY f.votes DESC, f.created_at DESC';

        const feedback = await query(sql, params);

        return NextResponse.json(feedback);
    } catch (error: any) {
        logger.error('Error fetching feedback:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch feedback' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await req.json();
        const { message, category, is_public, is_anonymous } = body;

        const id = uuidv4();
        await query(
            'INSERT INTO engagement_feedback (id, user_id, message, category, is_public, is_anonymous, votes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, userId, message, category || 'General', is_public ? 1 : 0, is_anonymous ? 1 : 0, 0]
        );

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        logger.error('Error submitting feedback:', error);
        return NextResponse.json({ error: error.message || 'Failed to submit feedback' }, { status: 500 });
    }
}
