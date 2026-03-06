import { exec } from 'child_process';
import { promisify } from 'util';
import { getSingboxPath } from '@/lib/daemon/process-manager';

const execAsync = promisify(exec);

let versionCache: string | null = null;
let lastCheckTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache

export async function getSingBoxVersion(): Promise<string> {

    // 1. Check Cache
    const now = Date.now();
    if (versionCache && (now - lastCheckTime < CACHE_TTL)) {
        return versionCache;
    }

    // 2. Detect via stats/command
    try {
        const binPath = await getSingboxPath();
        // -n flag prints only the version number, e.g. "1.10.7"
        const { stdout } = await execAsync(`${binPath} version -n`);
        const version = stdout.trim();

        if (version) {
            versionCache = version;
            lastCheckTime = now;
            return version;
        }
    } catch (error) {
        console.warn('Failed to detect sing-box version via command:', error);
    }

    // 3. Fallback
    return 'Unknown';
}
