
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [columns] = await pool.query('DESCRIBE users');
        const [rows] = await pool.query('SELECT id, display_name FROM users LIMIT 5');
        return NextResponse.json({ columns, rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
