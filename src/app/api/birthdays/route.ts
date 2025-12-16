import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch only necessary public info for all active users
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT id, first_name, last_name, display_name, date_of_birth, avatar, designation, department 
            FROM users 
            WHERE status = 'active'
        `);

        // Map to User type format expected by frontend
        const users = rows.map(u => ({
            id: u.id,
            name: u.display_name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            dateOfBirth: u.date_of_birth,
            avatar: u.avatar || '/placeholder-avatar.png',
            designation: u.designation,
            department: u.department,
            status: 'active'
        }));

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching birthdays:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
