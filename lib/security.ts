
import { db, ipBlacklist } from './db';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

/**
 * Checks if the given IP is in the blacklist.
 */
export async function isIPBlocked(ip: string): Promise<boolean> {
    const result = await db.select({ id: ipBlacklist.id })
        .from(ipBlacklist)
        .where(eq(ipBlacklist.ip, ip))
        .get();

    return !!result;
}

/**
 * Helper to get client IP from headers.
 * Supports various proxy headers common in deployments.
 */
export async function getClientIP(): Promise<string> {
    const headersList = await headers();

    const xForwardedFor = headersList.get('x-forwarded-for');
    if (xForwardedFor) {
        return xForwardedFor.split(',')[0].trim();
    }

    // Fallbacks
    return headersList.get('x-real-ip') ||
        headersList.get('cf-connecting-ip') ||
        '127.0.0.1';
}
