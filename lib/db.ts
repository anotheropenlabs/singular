import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

/**
 * Get the database file path
 */
function getDatabasePath(): string {
    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
    return path.join(dataDir, 'singui.db');
}

/**
 * Read the schema SQL file
 */
function readSchema(): string {
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');

    if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found: ${schemaPath}`);
    }

    return fs.readFileSync(schemaPath, 'utf-8');
}

/**
 * Initialize the database with the schema
 */
function initializeDatabase(database: Database.Database): void {
    const schema = readSchema();
    database.exec(schema);
}

/**
 * Get or create the database instance
 * Uses singleton pattern to ensure only one connection
 */
export function getDatabase(): Database.Database {
    if (db) {
        return db;
    }

    const dbPath = getDatabasePath();
    const dataDir = path.dirname(dbPath);

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // Create/open database
    db = new Database(dbPath);

    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Initialize schema
    initializeDatabase(db);

    return db;
}

/**
 * Run a SQL statement and return the result
 *
 * @WARNING Always use parameterized queries! Never interpolate user input into SQL.
 * @example
 * // GOOD - use params array
 * run('INSERT INTO users (name) VALUES (?)', [userName]);
 *
 * // BAD - SQL injection vulnerability!
 * run(`INSERT INTO users (name) VALUES ('${userName}')`);
 */
export function run(sql: string, params: unknown[] = []): Database.RunResult {
    const database = getDatabase();
    const stmt = database.prepare(sql);
    return stmt.run(...params);
}

/**
 * Get a single row from a SQL query
 *
 * @WARNING Always use parameterized queries! Never interpolate user input into SQL.
 * @example
 * // GOOD - use params array
 * get<User>('SELECT * FROM users WHERE id = ?', [userId]);
 *
 * // BAD - SQL injection vulnerability!
 * get<User>(`SELECT * FROM users WHERE id = ${userId}`);
 */
export function get<T = unknown>(sql: string, params: unknown[] = []): T | undefined {
    const database = getDatabase();
    const stmt = database.prepare(sql);
    return stmt.get(...params) as T | undefined;
}

/**
 * Get all rows from a SQL query
 *
 * @WARNING Always use parameterized queries! Never interpolate user input into SQL.
 * @example
 * // GOOD - use params array
 * all<User>('SELECT * FROM users WHERE status = ?', [status]);
 *
 * // BAD - SQL injection vulnerability!
 * all<User>(`SELECT * FROM users WHERE status = ${status}`);
 */
export function all<T = unknown>(sql: string, params: unknown[] = []): T[] {
    const database = getDatabase();
    const stmt = database.prepare(sql);
    return stmt.all(...params) as T[];
}

/**
 * Close the database connection
 * Should be called when the application shuts down
 */
export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
    }
}

// Export types for use in other modules
export type { Database };
