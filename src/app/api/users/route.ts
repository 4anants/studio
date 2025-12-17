import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Authentication check
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT users.*, companies.name as company_name 
      FROM users 
      LEFT JOIN companies ON users.company_id = companies.id 
      ORDER BY users.created_at DESC
    `);

    // Map database fields to frontend format
    let users = rows.map(u => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {
        password_hash,
        document_pin,
        pin_set,
        failed_pin_attempts,
        pin_locked_until,
        first_name,
        last_name,
        display_name,
        personal_email,
        emergency_contact,
        date_of_birth,
        joining_date,
        resignation_date,
        blood_group,
        company_id,
        is_admin,
        created_at,
        updated_at,
        company_name,
        ...rest
      } = u;

      return {
        ...rest,
        name: `${first_name || ''} ${last_name || ''}`.trim(),
        displayName: display_name,
        personalEmail: personal_email,
        emergencyContact: emergency_contact,
        dateOfBirth: date_of_birth,
        joiningDate: joining_date,
        resignationDate: resignation_date,
        bloodGroup: blood_group,
        company: company_name,
        companyId: company_id,
        role: is_admin ? 'admin' : 'employee',
        avatar: u.avatar || '/placeholder-avatar.png'
      };
    });

    // Security: Non-admin users can only see their own data
    if (session.user.role !== 'admin') {
      users = users.filter((user: any) => user.id === session.user.id);
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('Received user data:', body);

    // Authorization limits
    if (session.user.role !== 'admin' && session.user.id !== body.id) {
      return NextResponse.json({ error: 'Unauthorized: You can only edit your own profile' }, { status: 403 });
    }

    // Clone body to mutable object
    const userData = { ...body };

    // Security: Prevent privilege escalation for non-admins
    if (session.user.role !== 'admin') {
      userData.role = 'employee';
      userData.status = 'active';
    }

    if (!userData.email) {
      // If it's an update, email might be missing if we are just updating status? 
      // But usually we need ID.
      if (!userData.id) return NextResponse.json({ error: 'Email or ID is required' }, { status: 400 });
    }

    // Determine if insert or update
    let isUpdate = false;
    let existingUser: any = null;

    if (userData.id) {
      const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [userData.id]);
      if (rows.length > 0) {
        isUpdate = true;
        existingUser = rows[0];
      }
    }

    // Fields processing
    const nameParts = (userData.name || '').trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';
    const username = userData.email ? userData.email.split('@')[0] : (existingUser?.username || '');

    // Company ID lookup
    let company_id = existingUser?.company_id || null;
    if (userData.company) {
      try {
        const [companyRows] = await pool.query<RowDataPacket[]>('SELECT id FROM companies WHERE name = ? LIMIT 1', [userData.company]);
        if (companyRows.length > 0) company_id = companyRows[0].id;
      } catch (err) { console.error(err); }
    } else if (userData.companyId) {
      company_id = userData.companyId;
    }

    // Password handling
    let passwordHash = existingUser?.password_hash;
    if (userData.password) {
      passwordHash = await bcrypt.hash(userData.password, 10);
    } else if (!isUpdate) {
      // New user default password
      passwordHash = await bcrypt.hash('default123', 10);
    }

    if (isUpdate) {
      // UPDATE
      // We only update fields that are present in userData or derived.
      // But for simplicity/consistency with "Save" form, we update everything provided.
      // For "Soft Delete" (only status provided), we need to be careful not to nullify others if payload is partial.
      // The admin-view often sends full object, BUT `handleBulkSoftDeleteUsers` sends `{ ...user, status: 'deleted' }`.
      // So it sends full object.
      // EXCEPT `password` is usually missing in frontend object.

      await pool.query(
        `UPDATE users SET 
                first_name = ?, last_name = ?, display_name = ?, personal_email = ?, 
                designation = ?, department = ?, mobile = ?, emergency_contact = ?, 
                date_of_birth = ?, joining_date = ?, resignation_date = ?, blood_group = ?, 
                company_id = ?, location = ?, status = ?, is_admin = ?, avatar = ?, 
                password_hash = ?
             WHERE id = ?`,
        [
          first_name || existingUser.first_name,
          last_name || existingUser.last_name,
          userData.displayName || existingUser.display_name,
          userData.personalEmail || existingUser.personal_email,
          userData.designation || existingUser.designation,
          userData.department || existingUser.department,
          userData.mobile || existingUser.mobile,
          userData.emergencyContact || existingUser.emergency_contact,
          userData.dateOfBirth || existingUser.date_of_birth,
          userData.joiningDate || existingUser.joining_date,
          userData.resignationDate || existingUser.resignation_date,
          userData.bloodGroup || existingUser.blood_group,
          company_id,
          userData.location || existingUser.location,
          userData.status || existingUser.status,
          (userData.role === 'admin'),
          userData.avatar || existingUser.avatar, // keep existing avatar if not sent? Or if sent as null? 
          // Admin view sends avatar string.
          passwordHash,
          userData.id
        ]
      );
    } else {
      // INSERT
      // Needs all required fields.
      if (!userData.email) return NextResponse.json({ error: 'Email is required for new user' }, { status: 400 });

      await pool.query(
        `INSERT INTO users (
                id, username, first_name, last_name, display_name, email, personal_email, password_hash, is_admin, 
                designation, department, mobile, emergency_contact, date_of_birth, joining_date, 
                resignation_date, blood_group, company_id, location, status, avatar
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.id,
          username,
          first_name,
          last_name,
          userData.displayName || null,
          userData.email,
          userData.personalEmail || null,
          passwordHash,
          userData.role === 'admin',
          userData.designation || null,
          userData.department || null,
          userData.mobile || null,
          userData.emergencyContact || null,
          userData.dateOfBirth || null,
          userData.joiningDate || null,
          userData.resignationDate || null,
          userData.bloodGroup || null,
          company_id,
          userData.location || null,
          userData.status || 'active',
          userData.avatar || null
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving user:', error);
    return NextResponse.json({ error: error.message || 'Failed to save user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    // Delete all user's documents from DB
    await pool.execute('DELETE FROM documents WHERE employee_id = ?', [id]);

    // Delete user from DB
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    // Delete user's physical folder
    try {
      const { rm } = await import('fs/promises');
      const { join } = await import('path');
      const userFolderPath = join(process.cwd(), 'public', 'uploads', id);
      await rm(userFolderPath, { recursive: true, force: true });
      console.log(`Deleted user folder: ${userFolderPath}`);
    } catch (folderError) {
      console.error('Error deleting user folder:', folderError);
      // Continue even if folder deletion fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
