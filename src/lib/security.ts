/**
 * Security Middleware for API Routes
 * Handles authentication, rate limiting, and security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { checkRateLimit, getClientIp, RATE_LIMITS } from './rate-limit';
import { logger } from './logger';

export interface SecurityOptions {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    rateLimit?: keyof typeof RATE_LIMITS;
    allowedMethods?: string[];
}

/**
 * Secure API wrapper with authentication and rate limiting
 */
export async function secureApi(
    request: NextRequest,
    handler: (req: NextRequest, session?: any) => Promise<NextResponse>,
    options: SecurityOptions = {}
): Promise<NextResponse> {
    const {
        requireAuth = true,
        requireAdmin = false,
        rateLimit = 'api',
        allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'],
    } = options;

    try {
        // Check HTTP method
        if (!allowedMethods.includes(request.method)) {
            return NextResponse.json(
                { error: 'Method not allowed' },
                { status: 405 }
            );
        }

        // Rate limiting
        const clientIp = getClientIp(request);
        const rateLimitKey = `${clientIp}:${request.nextUrl.pathname}`;
        const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS[rateLimit]);

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                {
                    error: 'Too many requests',
                    retryAfter: rateLimitResult.retryAfter,
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(rateLimitResult.retryAfter || 60),
                    },
                }
            );
        }

        // Authentication check
        if (requireAuth) {
            const session = await getServerSession(authOptions);

            if (!session || !session.user) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }

            // Admin check
            if (requireAdmin && session.user.role !== 'admin') {
                return NextResponse.json(
                    { error: 'Forbidden - Admin access required' },
                    { status: 403 }
                );
            }

            // Call handler with session
            return await handler(request, session);
        }

        // Call handler without session
        return await handler(request);
    } catch (error) {
        logger.error('Security middleware error:', error);

        // Don't expose error details in production
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=()'
    );

    return response;
}

/**
 * Sanitize error message for client
 */
export function sanitizeError(error: unknown): string {
    if (process.env.NODE_ENV === 'development') {
        return error instanceof Error ? error.message : String(error);
    }

    // In production, return generic message
    return 'An error occurred';
}
