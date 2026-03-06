
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';

// Singleton instances with global cache for HMR
const globalForDb = globalThis as unknown as {
    sqlite: Database.Database | undefined;
    drizzleClient: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

let sqlite = globalForDb.sqlite;
let _drizzleClient = globalForDb.drizzleClient;

/**
 * Get the database file path
 */
function getDatabasePath(): string {
    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
    return path.join(dataDir, 'singular.db');
}

/**
 * Get or create the database instance
 * Uses singleton pattern to ensure only one connection
 */
export function getDatabase(): Database.Database {
    if (sqlite) {
        return sqlite;
    }

    const dbPath = getDatabasePath();
    const dataDir = path.dirname(dbPath);

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log(`[DB] Opening connection to ${dbPath}`);
    // Create/open database
    sqlite = new Database(dbPath);

    // Enable WAL mode for better performance
    sqlite.pragma('journal_mode = WAL');

    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');

    if (process.env.NODE_ENV !== 'production') {
        globalForDb.sqlite = sqlite;
    }

    return sqlite;
}

/**
 * Get the Drizzle ORM instance
 */
export function getDrizzle() {
    if (_drizzleClient) {
        return _drizzleClient;
    }

    const client = getDatabase();
    _drizzleClient = drizzle(client, { schema });

    if (process.env.NODE_ENV !== 'production') {
        globalForDb.drizzleClient = _drizzleClient;
    }

    return _drizzleClient;
}

export function closeDatabase(): void {
    if (sqlite) {
        console.log('[DB] Closing connection');
        sqlite.close();
        sqlite = undefined;
        _drizzleClient = undefined;
        if (process.env.NODE_ENV !== 'production') {
            globalForDb.sqlite = undefined;
            globalForDb.drizzleClient = undefined;
        }
    }
}

// Export the drizzle instance directly only calls getDrizzle once. 
// But since getDatabase relies on runtime side effects (mkdir), 
// it's safer to use a getter or ensure init runs.
// However, top-level await isn't always safe.
// We'll export a helper 'db' that initializes on access or use getDrizzle().
// For simplicity in imports:
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
    get(_target, prop) {
        return (getDrizzle() as any)[prop];
    }
});


// Re-export all schema definitions for unified access
export * from './schema';

// --- Legacy Helpers Removed ---
// All database access has been migrated to Drizzle ORM.
// Use `db.select()`, `db.insert()`, etc.

export type { Database };
