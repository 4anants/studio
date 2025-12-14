import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Check if user is authenticated
 * Returns session if authenticated, otherwise returns unauthorized response
 */
export async function requireAuth() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return {
            authorized: false,
            response: NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 }),
            session: null
        };
    }

    return {
        authorized: true,
        response: null,
        session
    };
}

/**
 * Check if user is an admin
 * Returns true if admin, otherwise returns forbidden response
 */
export async function requireAdmin() {
    const authCheck = await requireAuth();

    if (!authCheck.authorized) {
        return authCheck;
    }

    if (authCheck.session!.user.role !== 'admin') {
        return {
            authorized: false,
            response: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }),
            session: authCheck.session
        };
    }

    return {
        authorized: true,
        response: null,
        session: authCheck.session
    };
}

/**
 * Check if user can access a specific resource
 * Admins can access any resource, users can only access their own
 */
export async function requireOwnershipOrAdmin(resourceOwnerId: string) {
    const authCheck = await requireAuth();

    if (!authCheck.authorized) {
        return authCheck;
    }

    const isAdmin = authCheck.session!.user.role === 'admin';
    const isOwner = authCheck.session!.user.id === resourceOwnerId;

    if (!isAdmin && !isOwner) {
        return {
            authorized: false,
            response: NextResponse.json({ error: 'Forbidden - You can only access your own resources' }, { status: 403 }),
            session: authCheck.session
        };
    }

    return {
        authorized: true,
        response: null,
        session: authCheck.session
    };
}
