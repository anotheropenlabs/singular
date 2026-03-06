
import { db, auditLogs } from './db';

/**
 * Logs an administrative action to the database.
 * 
 * @param action - The type of action (e.g., 'LOGIN', 'CREATE_INBOUND', 'DELETE_INBOUND')
 * @param target - The target of the action (e.g., username, inbound tag)
 * @param details - Additional details (object will be stringified)
 * @param ip - The IP address of the actor
 */
export async function logAction(action: string, target: string, details: any, ip: string) {
    try {
        await db.insert(auditLogs).values({
            action,
            target,
            details: JSON.stringify(details),
            ip,
            created_at: Math.floor(Date.now() / 1000)
        });
    } catch (error) {
        console.error('Failed to write audit log:', error);
        // We generally don't want audit logging failure to crash the main request success,
        // so we log error and suppress.
    }
}
