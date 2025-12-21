import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;
        const userEmail = session?.user?.email;
        const isAdmin = session?.user?.role === 'admin';

        let userDept = '';
        let userLoc = '';

        if (!isAdmin && userEmail) {
            const uRows = await query('SELECT department, location FROM users WHERE email = ?', [userEmail]) as any[];
            if (uRows.length > 0) {
                userDept = uRows[0].department;
                userLoc = uRows[0].location;
            }
        }

        let sql = 'SELECT * FROM engagement_polls WHERE 1=1';
        const params: any[] = [];

        if (!isAdmin) {
            if (userLoc) {
                sql += ' AND (target_location = ? OR target_location = "ALL" OR target_location IS NULL)';
                params.push(userLoc);
            } else {
                sql += ' AND (target_location = "ALL" OR target_location IS NULL)';
            }

            if (userDept) {
                sql += ' AND (target_department = ? OR target_department = "ALL" OR target_department IS NULL)';
                params.push(userDept);
            } else {
                sql += ' AND (target_department = "ALL" OR target_department IS NULL)';
            }
        } else {
            const { searchParams } = new URL(req.url);
            const location = searchParams.get('location');
            const department = searchParams.get('department');

            if (location && location !== 'ALL') {
                sql += ' AND (target_location = ? OR target_location = "ALL")';
                params.push(location);
            }

            if (department && department !== 'ALL') {
                sql += ' AND (target_department = ? OR target_department = "ALL")';
                params.push(department);
            }
        }

        sql += ' ORDER BY created_at DESC';

        const polls = await query<any[]>(sql, params);

        // For each poll, get options and check if user has voted
        const pollsWithData = await Promise.all(polls.map(async (poll) => {
            const options = await query('SELECT id, text, votes FROM engagement_poll_options WHERE poll_id = ?', [poll.id]);

            let userVotedOptionId = null;
            if (userId) {
                const userVote: any = await query('SELECT option_id FROM engagement_poll_votes WHERE poll_id = ? AND user_id = ?', [poll.id, userId]);
                if (userVote.length > 0) {
                    userVotedOptionId = userVote[0].option_id;
                }
            }

            return {
                ...poll,
                options,
                userVotedOptionId,
                totalVotes: (options as any[]).reduce((sum, opt) => sum + opt.votes, 0)
            };
        }));

        return NextResponse.json(pollsWithData);
    } catch (error) {
        logger.error('Error fetching polls:', error);
        return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { question, options, target_location, target_department, is_anonymous } = body;

        const pollId = uuidv4();
        const createdBy = session.user.id;

        // Deactivate other polls if this one is active (optional logic)
        // await query('UPDATE engagement_polls SET is_active = 0');

        await query(
            'INSERT INTO engagement_polls (id, question, is_active, target_location, target_department, created_by, is_anonymous) VALUES (?, ?, 1, ?, ?, ?, ?)',
            [pollId, question, target_location || 'ALL', target_department || 'ALL', createdBy, is_anonymous ? 1 : 0]
        );

        for (const optionText of options) {
            const optionId = uuidv4();
            await query(
                'INSERT INTO engagement_poll_options (id, poll_id, text, votes) VALUES (?, ?, ?, 0)',
                [optionId, pollId, optionText]
            );
        }

        return NextResponse.json({ success: true, id: pollId });
    } catch (error) {
        logger.error('Error creating poll:', error);
        return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await query('DELETE FROM engagement_polls WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error deleting poll:', error);
        return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 });
    }
}
