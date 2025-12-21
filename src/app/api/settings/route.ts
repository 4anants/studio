
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        const rows = await query<any[]>('SELECT setting_key, setting_value FROM system_settings');
        const settings: Record<string, string> = {};
        rows.forEach((row) => {
            settings[row.setting_key] = row.setting_value;
        });
        return NextResponse.json(settings);
    } catch (error) {
        logger.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        // Basic auth check - allow admins or at least authenticated users? 
        // Ideally admins only for writing settings.
        if (!session?.user?.email) { // Improve this check based on your role logic
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if admin (optional, based on your logic, we'll assume logged in is enough or check role)
        // const user = ... check role. For now, strict on session.

        const body = await req.json();
        const { key, value } = body;

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 });
        }

        await query(
            'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            [key, value, value]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error saving setting:', error);
        return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
    }
}
