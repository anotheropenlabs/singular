import { ProcessStrategy } from '../strategy';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export class MacOSStrategy implements ProcessStrategy {
    async getBinaryPath(): Promise<string> {
        if (fs.existsSync('/opt/homebrew/bin/sing-box')) {
            return '/opt/homebrew/bin/sing-box';
        }
        return '/usr/local/bin/sing-box';
    }

    async getConfigPath(): Promise<string> {
        // Default to local for development or specific path
        return path.resolve(process.cwd(), 'sing-box-config.json');
    }

    async start(binPath: string, configPath: string): Promise<void> {
        // Validate Config
        try {
            await execAsync(`"${binPath}" check -c "${configPath}"`);
        } catch (e: any) {
            throw new Error(`Configuration check failed: ${e.stderr || e.message}`);
        }

        const logPath = path.resolve(process.cwd(), 'sing-box.log');
        const errPath = path.resolve(process.cwd(), 'sing-box.err.log');
        const logFile = fs.openSync(logPath, 'a');
        const errFile = fs.openSync(errPath, 'a');

        const subprocess = spawn(binPath, ['run', '-c', configPath], {
            detached: true,
            stdio: ['ignore', logFile, errFile]
        });

        subprocess.unref();
    }

    async stop(): Promise<void> {
        try {
            await execAsync('pkill -f "sing-box run"');
        } catch (e) {
            // Ignore if not found
        }
    }

    async getStatus(): Promise<'running' | 'stopped' | 'error'> {
        try {
            const { stdout } = await execAsync('pgrep -f "sing-box run"');
            return stdout.trim().length > 0 ? 'running' : 'stopped';
        } catch {
            return 'stopped';
        }
    }

    async getPid(): Promise<number | null> {
        try {
            const { stdout } = await execAsync('pgrep -f "sing-box run"');
            const pid = parseInt(stdout.trim());
            return isNaN(pid) ? null : pid;
        } catch {
            return null;
        }
    }
}
