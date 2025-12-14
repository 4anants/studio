import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requireAuth } from '@/lib/auth-helpers';

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
            location: row.location,
            logo: row.logo
        }));

        return NextResponse.json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('Received company data:', body);
        const { id, name, shortName, address, phone, email, location, logo } = body;

        console.log('Saving to database:', { id, name, shortName, address, phone, email, location, logo: logo ? 'has logo' : 'no logo' });

        await pool.execute(
            `INSERT INTO companies (id, name, short_name, address, phone, email, location, logo) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             short_name = VALUES(short_name),
             address = VALUES(address),
             phone = VALUES(phone),
             email = VALUES(email),
             location = VALUES(location),
             logo = VALUES(logo)`,
            [id, name, shortName, address, phone, email, location, logo]
        );

        console.log('Company saved successfully:', id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error creating company:', error);
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
        console.error('Error deleting company:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
