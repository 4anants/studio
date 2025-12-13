import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    // Keep request for potential future filtering parameters
    // const _url = request.url;
    const session = await getServerSession(authOptions);

    // Admin sees all? Or filtered?
    // Current mock data: Admin sees all. Employees see theirs.

    try {
        let query = 'SELECT * FROM documents ORDER BY upload_date DESC';
        let params: (string | number)[] = [];

        if (session?.user?.role !== 'admin') {
            const userId = session?.user?.id;
            if (!userId) return NextResponse.json([]); // No session?

            query = 'SELECT * FROM documents WHERE employee_id = ? ORDER BY upload_date DESC';
            params = [userId];
        }

        const [rows] = await pool.execute<RowDataPacket[]>(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Check ownership if not admin? 
        // For simplicity, let's allow it for now or rely on frontend to hide button.
        // Ideally check session here.
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (session.user.role !== 'admin') {
            // Check if document belongs to user
            const [rows] = await pool.execute<RowDataPacket[]>('SELECT employee_id FROM documents WHERE id = ?', [id]);
            if (rows.length === 0 || rows[0].employee_id !== session.user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        await pool.execute('DELETE FROM documents WHERE id = ?', [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting document:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
