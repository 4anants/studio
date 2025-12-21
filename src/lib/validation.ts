/**
 * Input Validation and Sanitization Utilities
 * Prevents XSS, SQL Injection, and other injection attacks
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
        ALLOWED_ATTR: ['href', 'target'],
    });
}

/**
 * Sanitize plain text (remove all HTML)
 */
export function sanitizeText(input: string): string {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate phone number (basic)
 */
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
    return phoneRegex.test(phone);
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate PIN (4-6 digits)
 */
export function isValidPin(pin: string): boolean {
    return /^\d{4,6}$/.test(pin);
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
    // Remove path separators and special characters
    return filename
        .replace(/[\/\\]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 255);
}

/**
 * Validate file type (whitelist)
 */
export function isAllowedFileType(
    filename: string,
    allowedExtensions: string[]
): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext ? allowedExtensions.includes(ext) : false;
}

/**
 * Validate file size
 */
export function isValidFileSize(sizeInBytes: number, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return sizeInBytes <= maxSizeBytes;
}

/**
 * Escape SQL special characters (additional layer of protection)
 */
export function escapeSql(input: string): string {
    return input.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
        switch (char) {
            case '\0':
                return '\\0';
            case '\x08':
                return '\\b';
            case '\x09':
                return '\\t';
            case '\x1a':
                return '\\z';
            case '\n':
                return '\\n';
            case '\r':
                return '\\r';
            case '"':
            case "'":
            case '\\':
            case '%':
                return '\\' + char;
            default:
                return char;
        }
    });
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Validate user ID format (A-XXX or UUID)
 */
export function isValidUserId(id: string): boolean {
    // Allow A-XXX format or UUID
    return /^A-\d+$/.test(id) || isValidUuid(id);
}

/**
 * Rate limit key generator
 */
export function getRateLimitKey(ip: string, endpoint: string): string {
    return `ratelimit:${ip}:${endpoint}`;
}

/**
 * Generate secure random string
 */
export function generateSecureToken(length: number = 32): string {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
        result += chars[randomValues[i] % chars.length];
    }

    return result;
}
