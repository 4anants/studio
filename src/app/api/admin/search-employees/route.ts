import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
        return NextResponse.json([]);
    }

    try {
        const searchTerm = `%${q}%`;
        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT id, first_name, last_name, email, department 
       FROM users 
       WHERE CONCAT(first_name, ' ', last_name) LIKE ? 
          OR email LIKE ? 
          OR id LIKE ?
       LIMIT 10`,
            [searchTerm, searchTerm, searchTerm]
        );

        const employees = rows.map(row => ({
            id: row.id,
            name: `${row.first_name} ${row.last_name}`.trim(),
            email: row.email,
            department: row.department,
            employeeCode: row.id // Using ID as code for now
        }));

        return NextResponse.json(employees);
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
