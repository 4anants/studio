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

    // Authorization Check
    // Allow if Admin OR if User is updating their own profile
    if (session.user.role !== 'admin' && session.user.id !== body.id) {
      return NextResponse.json({ error: 'Unauthorized: You can only edit your own profile' }, { status: 403 });
    }

    let {
      id,
      name,
      displayName,
      email,
      personalEmail,
      password,
      role,
      designation,
      department,
      mobile,
      emergencyContact,
      dateOfBirth,
      joiningDate,
      resignationDate,
      bloodGroup,
      company,
      location,
      status,
      avatar
    } = body;

    // Security: Prevent privilege escalation for non-admins
    if (session.user.role !== 'admin') {
      role = 'employee'; // Non-admins cannot change their role
      status = 'active'; // Non-admins cannot change their status
      // You might want to restrict other fields too, but these are the critical ones.
    }

    // Split name into first_name and last_name
    const nameParts = (name || '').trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    // Find company_id from company name
    let company_id = null;
    if (company) {
      try {
        const [companyRows] = await pool.query<RowDataPacket[]>(
          'SELECT id FROM companies WHERE name = ? LIMIT 1',
          [company]
        );
        if (companyRows.length > 0) {
          company_id = companyRows[0].id;
        }
      } catch (err) {
        console.error('Error finding company:', err);
      }
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const username = email.split('@')[0];
    const passwordHash = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('default123', 10);

    try {
      await pool.execute(
        `INSERT INTO users (
            id, username, first_name, last_name, display_name, email, personal_email, password_hash, is_admin, 
            designation, department, mobile, emergency_contact, date_of_birth, joining_date, 
            resignation_date, blood_group, company_id, location, status, avatar
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            display_name = VALUES(display_name),
            personal_email = VALUES(personal_email),
            designation = VALUES(designation),
            department = VALUES(department),
            mobile = VALUES(mobile),
            emergency_contact = VALUES(emergency_contact),
            date_of_birth = VALUES(date_of_birth),
            joining_date = VALUES(joining_date),
            resignation_date = VALUES(resignation_date),
            blood_group = VALUES(blood_group),
            company_id = VALUES(company_id),
            location = VALUES(location),
            status = VALUES(status),
            is_admin = VALUES(is_admin),
            avatar = VALUES(avatar)
        `,
        [
          id,
          username,
          first_name,
          last_name,
          displayName || null,
          email,
          personalEmail || null,
          passwordHash,
          role === 'admin',
          designation || null,
          department || null,
          mobile || null,
          emergencyContact || null,
          dateOfBirth || null,
          joiningDate || null,
          resignationDate || null,
          bloodGroup || null,
          company_id,
          location || null,
          status || 'active',
          avatar || null
        ]
      );
    } catch (err: any) {
      // Check if error is due to missing 'display_name' column (Error Code: 1054)
      if (err.code === 'ER_BAD_FIELD_ERROR' && err.sqlMessage?.includes("display_name")) {
        console.log("Column 'display_name' missing. Attempting to add it...");
        // Add the column
        await pool.query(`ALTER TABLE users ADD COLUMN display_name VARCHAR(255) AFTER last_name`);
        // Retry the insert
        await pool.execute(
          `INSERT INTO users (
                    id, username, first_name, last_name, display_name, email, personal_email, password_hash, is_admin, 
                    designation, department, mobile, emergency_contact, date_of_birth, joining_date, 
                    resignation_date, blood_group, company_id, location, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    first_name = VALUES(first_name),
                    last_name = VALUES(last_name),
                    display_name = VALUES(display_name),
                    personal_email = VALUES(personal_email),
                    designation = VALUES(designation),
                    department = VALUES(department),
                    mobile = VALUES(mobile),
                    emergency_contact = VALUES(emergency_contact),
                    date_of_birth = VALUES(date_of_birth),
                    joining_date = VALUES(joining_date),
                    resignation_date = VALUES(resignation_date),
                    blood_group = VALUES(blood_group),
                    company_id = VALUES(company_id),
                    location = VALUES(location),
                    status = VALUES(status),
                    is_admin = VALUES(is_admin)
                `,
          [
            id,
            username,
            first_name,
            last_name,
            displayName || null,
            email,
            personalEmail || null,
            passwordHash,
            role === 'admin',
            designation || null,
            department || null,
            mobile || null,
            emergencyContact || null,
            dateOfBirth || null,
            joiningDate || null,
            resignationDate || null,
            bloodGroup || null,
            company_id,
            location || null,
            status || 'active'
          ]
        );
      } else if (err.code === 'ER_DATA_TOO_LONG' && err.sqlMessage?.includes("'avatar'")) {
        console.log("Column 'avatar' too small. upgrading to LONGTEXT...");
        await pool.query(`ALTER TABLE users MODIFY COLUMN avatar LONGTEXT`);

        // Retry the insert with avatar (copy of the main insert block)
        await pool.execute(
          `INSERT INTO users (
              id, username, first_name, last_name, display_name, email, personal_email, password_hash, is_admin, 
              designation, department, mobile, emergency_contact, date_of_birth, joining_date, 
              resignation_date, blood_group, company_id, location, status, avatar
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
              first_name = VALUES(first_name),
              last_name = VALUES(last_name),
              display_name = VALUES(display_name),
              personal_email = VALUES(personal_email),
              designation = VALUES(designation),
              department = VALUES(department),
              mobile = VALUES(mobile),
              emergency_contact = VALUES(emergency_contact),
              date_of_birth = VALUES(date_of_birth),
              joining_date = VALUES(joining_date),
              resignation_date = VALUES(resignation_date),
              blood_group = VALUES(blood_group),
              company_id = VALUES(company_id),
              location = VALUES(location),
              status = VALUES(status),
              is_admin = VALUES(is_admin),
              avatar = VALUES(avatar)
          `,
          [
            id,
            username,
            first_name,
            last_name,
            displayName || null,
            email,
            personalEmail || null,
            passwordHash,
            role === 'admin',
            designation || null,
            department || null,
            mobile || null,
            emergencyContact || null,
            dateOfBirth || null,
            joiningDate || null,
            resignationDate || null,
            bloodGroup || null,
            company_id,
            location || null,
            status || 'active',
            avatar || null
          ]
        );
      } else {
        throw err;
      }
    }

    console.log('User saved successfully:', id);
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
