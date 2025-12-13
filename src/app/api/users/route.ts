import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';

export async function GET() {
  // const _url = request.url;
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users ORDER BY created_at DESC');
    // Remove password_hash from response
    const users = rows.map(u => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...rest } = u;
      return rest;
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id, email, password, first_name, last_name, role, designation, department,
      mobile, emergency_contact, date_of_birth, joining_date, blood_group, company_id, location, status
    } = body;

    // TODO: Validation

    // Check if update or create
    // If ID exists and we are updating? Usually PUT. But let's support UPSERT or just Create for now.
    // The AdminView uses "Save" which could be either.

    // For simplicity, let's assume this is separate Create/Update logic or just Create.
    // Let's implement CREATE for now.

    const passwordHash = await bcrypt.hash(password || 'default123', 10);
    const username = email.split('@')[0];

    await pool.execute(
      `INSERT INTO users (
            id, username, first_name, last_name, email, password_hash, is_admin, 
            designation, department, mobile, emergency_contact, date_of_birth, joining_date, 
            blood_group, company_id, location, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            designation = VALUES(designation),
            department = VALUES(department),
            mobile = VALUES(mobile),
            status = VALUES(status)
        `,
      [
        id, username, first_name, last_name, email, passwordHash, role === 'admin',
        designation, department, mobile, emergency_contact, date_of_birth, joining_date,
        blood_group, company_id, location, status || 'active'
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
