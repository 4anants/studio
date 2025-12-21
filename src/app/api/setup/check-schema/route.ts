import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const columns = await query('DESCRIBE engagement_feedback');
        return NextResponse.json(columns);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
