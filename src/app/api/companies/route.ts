import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requireAuth } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

export async function GET() {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM companies ORDER BY name ASC');

        // Map database column names to frontend field names
        const companies = rows.map(row => ({
            id: row.id,
            name: row.name,
            shortName: row.short_name,
            address: row.address,
            phone: row.phone,
            email: row.email,
            domain: row.domain,
            location: row.location,
            logo: row.logo
        }));

        return NextResponse.json(companies);
    } catch (error) {
        logger.error('Error fetching companies:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        logger.log('Received company data:', body);
        const { id, name, shortName, address, phone, email, domain, location, logo } = body;

        logger.log('Saving to database:', { id, name, shortName, address, phone, email, domain, location, logo: logo ? 'has logo' : 'no logo' });

        await pool.execute(
            `INSERT INTO companies (id, name, short_name, address, phone, email, domain, location, logo) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             short_name = VALUES(short_name),
             address = VALUES(address),
             phone = VALUES(phone),
             email = VALUES(email),
             domain = VALUES(domain),
             location = VALUES(location),
             logo = VALUES(logo)`,
            [id, name, shortName, address, phone, email, domain, location, logo]
        );

        logger.log('Company saved successfully:', id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        logger.error('Error creating company:', error);
        return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        await pool.execute('DELETE FROM companies WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error deleting company:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
