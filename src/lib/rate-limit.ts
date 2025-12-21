/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and DDoS
 */

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

export interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Max requests per window
}

export const RATE_LIMITS = {
    // Authentication endpoints - strict
    login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 min
    pinVerify: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 min

    // API endpoints - moderate
    api: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 min

    // File operations - relaxed
    fileUpload: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 uploads per minute
    fileDownload: { windowMs: 60 * 1000, maxRequests: 50 }, // 50 downloads per minute

    // Admin operations - moderate
    admin: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 requests per minute
};

/**
 * Check if request is rate limited
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const key = identifier;

    // Clean up expired entries
    if (store[key] && now > store[key].resetTime) {
        delete store[key];
    }

    // Initialize or get existing entry
    if (!store[key]) {
        store[key] = {
            count: 1,
            resetTime: now + config.windowMs,
        };
        return { allowed: true };
    }

    // Check if limit exceeded
    if (store[key].count >= config.maxRequests) {
        const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
        return { allowed: false, retryAfter };
    }

    // Increment count
    store[key].count++;
    return { allowed: true };
}

/**
 * Reset rate limit for identifier
 */
export function resetRateLimit(identifier: string): void {
    delete store[identifier];
}

/**
 * Get client IP from request
 */
export function getClientIp(request: Request): string {
    // Try to get real IP from headers (for proxies/load balancers)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback to connection IP
    return 'unknown';
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimitStore(): void {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
        if (now > store[key].resetTime) {
            delete store[key];
        }
    });
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
