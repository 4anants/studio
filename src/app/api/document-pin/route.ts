import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Auto-repair: Add PIN columns if they don't exist
async function ensurePinColumns() {
    try {
        await pool.query('SELECT document_pin, pin_set, failed_pin_attempts, pin_locked_until FROM users LIMIT 1');
    } catch (err: any) {
        if (err.code === 'ER_BAD_FIELD_ERROR') {
            console.log('Adding PIN columns to users table...');
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS document_pin VARCHAR(255) NULL');
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_set BOOLEAN DEFAULT 0');
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_pin_attempts INT DEFAULT 0');
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMP NULL DEFAULT NULL');
            console.log('PIN columns added successfully');
        }
    }
}

// Check if user has set PIN
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await ensurePinColumns();

        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT pin_set, pin_locked_until, failed_pin_attempts FROM users WHERE id = ?',
            [session.user.id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = rows[0];
        const now = new Date();
        const lockedUntil = user.pin_locked_until ? new Date(user.pin_locked_until) : null;
        const isLocked = lockedUntil && lockedUntil > now;

        return NextResponse.json({
            pinSet: Boolean(user.pin_set),
            isLocked,
            lockedUntil: lockedUntil?.toISOString(),
            failedAttempts: user.failed_pin_attempts || 0
        });
    } catch (error) {
        console.error('Error checking PIN status:', error);
        return NextResponse.json({ error: 'Failed to check PIN status' }, { status: 500 });
    }
}

// Set or update PIN
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { pin, currentPin } = body;

        // Validate PIN format
        if (!pin || !/^\d{4}$/.test(pin)) {
            return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
        }

        await ensurePinColumns();

        // Check if user already has a PIN
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT document_pin, pin_set FROM users WHERE id = ?',
            [session.user.id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = rows[0];

        // If PIN already set, verify current PIN before allowing change
        if (user.pin_set && user.document_pin) {
            if (!currentPin) {
                return NextResponse.json({ error: 'Current PIN required to change PIN' }, { status: 400 });
            }

            const isValid = await bcrypt.compare(currentPin, user.document_pin);
            if (!isValid) {
                return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 403 });
            }
        }

        // Hash the new PIN
        const hashedPin = await bcrypt.hash(pin, 10);

        // Update PIN in database
        await pool.execute(
            'UPDATE users SET document_pin = ?, pin_set = 1, failed_pin_attempts = 0, pin_locked_until = NULL WHERE id = ?',
            [hashedPin, session.user.id]
        );

        return NextResponse.json({
            success: true,
            message: user.pin_set ? 'PIN updated successfully' : 'PIN set successfully'
        });
    } catch (error) {
        console.error('Error setting PIN:', error);
        return NextResponse.json({ error: 'Failed to set PIN' }, { status: 500 });
    }
}

// Verify PIN
export async function PATCH(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { pin } = body;

        if (!pin || !/^\d{4}$/.test(pin)) {
            return NextResponse.json({ error: 'Invalid PIN format' }, { status: 400 });
        }

        await ensurePinColumns();

        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT document_pin, pin_set, failed_pin_attempts, pin_locked_until FROM users WHERE id = ?',
            [session.user.id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = rows[0];

        // Check if PIN is set
        if (!user.pin_set || !user.document_pin) {
            return NextResponse.json({ error: 'PIN not set. Please set your PIN first.' }, { status: 400 });
        }

        // Check if account is locked
        const now = new Date();
        const lockedUntil = user.pin_locked_until ? new Date(user.pin_locked_until) : null;
        if (lockedUntil && lockedUntil > now) {
            const minutesLeft = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
            return NextResponse.json({
                error: `Too many failed attempts. Try again in ${minutesLeft} minute(s).`,
                locked: true,
                lockedUntil: lockedUntil.toISOString()
            }, { status: 429 });
        }

        // Verify PIN
        const isValid = await bcrypt.compare(pin, user.document_pin);

        if (isValid) {
            // Reset failed attempts on successful verification
            await pool.execute(
                'UPDATE users SET failed_pin_attempts = 0, pin_locked_until = NULL WHERE id = ?',
                [session.user.id]
            );

            return NextResponse.json({
                success: true,
                message: 'PIN verified successfully'
            });
        } else {
            // Increment failed attempts
            const newFailedAttempts = (user.failed_pin_attempts || 0) + 1;
            const maxAttempts = 5;

            if (newFailedAttempts >= maxAttempts) {
                // Lock account for 15 minutes
                const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                await pool.execute(
                    'UPDATE users SET failed_pin_attempts = ?, pin_locked_until = ? WHERE id = ?',
                    [newFailedAttempts, lockUntil, session.user.id]
                );

                return NextResponse.json({
                    error: 'Too many failed attempts. Account locked for 15 minutes.',
                    locked: true,
                    lockedUntil: lockUntil.toISOString()
                }, { status: 429 });
            } else {
                await pool.execute(
                    'UPDATE users SET failed_pin_attempts = ? WHERE id = ?',
                    [newFailedAttempts, session.user.id]
                );

                const attemptsLeft = maxAttempts - newFailedAttempts;
                return NextResponse.json({
                    error: `Incorrect PIN. ${attemptsLeft} attempt(s) remaining.`,
                    attemptsLeft
                }, { status: 403 });
            }
        }
    } catch (error) {
        console.error('Error verifying PIN:', error);
        return NextResponse.json({ error: 'Failed to verify PIN' }, { status: 500 });
    }
}

// Admin reset PIN (DELETE method)
export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can reset other users' PINs
    if (session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId parameter required' }, { status: 400 });
        }

        await ensurePinColumns();

        // Reset PIN for the specified user
        await pool.execute(
            'UPDATE users SET document_pin = NULL, pin_set = 0, failed_pin_attempts = 0, pin_locked_until = NULL WHERE id = ?',
            [userId]
        );

        return NextResponse.json({
            success: true,
            message: 'PIN reset successfully. User will be prompted to set a new PIN.'
        });
    } catch (error) {
        console.error('Error resetting PIN:', error);
        return NextResponse.json({ error: 'Failed to reset PIN' }, { status: 500 });
    }
}
