// src/lib/rate-limit.ts
// Simple in-memory rate limiter using token bucket algorithm

interface RateLimitEntry {
    tokens: number;
    lastRefill: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
    maxTokens: number;       // Maximum tokens in bucket
    refillRate: number;      // Tokens per second
    windowMs: number;        // Time window in milliseconds
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
    maxTokens: 10,
    refillRate: 1,
    windowMs: 60000, // 1 minute
};

export const AUTH_RATE_LIMIT: RateLimitConfig = {
    maxTokens: 5,
    refillRate: 0.1,      // 1 token per 10 seconds
    windowMs: 60000,
};

export const STRICT_RATE_LIMIT: RateLimitConfig = {
    maxTokens: 3,
    refillRate: 0.05,     // 1 token per 20 seconds
    windowMs: 60000,
};

/**
 * Check if request should be rate limited
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    if (!entry) {
        // First request, initialize bucket
        rateLimitStore.set(identifier, {
            tokens: config.maxTokens - 1,
            lastRefill: now,
        });
        return { allowed: true, remaining: config.maxTokens - 1, resetIn: 0 };
    }

    // Calculate tokens to add based on time passed
    const timePassed = now - entry.lastRefill;
    const tokensToAdd = Math.floor((timePassed / 1000) * config.refillRate);

    // Refill tokens (up to max)
    const newTokens = Math.min(config.maxTokens, entry.tokens + tokensToAdd);

    if (newTokens < 1) {
        // No tokens available, rate limited
        const resetIn = Math.ceil((1 - entry.tokens) / config.refillRate * 1000);
        return { allowed: false, remaining: 0, resetIn };
    }

    // Consume a token
    rateLimitStore.set(identifier, {
        tokens: newTokens - 1,
        lastRefill: tokensToAdd > 0 ? now : entry.lastRefill,
    });

    return { allowed: true, remaining: newTokens - 1, resetIn: 0 };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    if (realIP) {
        return realIP;
    }
    return 'unknown';
}

/**
 * Clean up old entries (call periodically)
 */
export function cleanupRateLimitStore(maxAgeMs: number = 300000): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now - entry.lastRefill > maxAgeMs) {
            rateLimitStore.delete(key);
        }
    }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => cleanupRateLimitStore(), 300000);
}
