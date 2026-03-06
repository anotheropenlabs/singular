import { ProcessStrategy } from '../strategy';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export class WindowsStrategy implements ProcessStrategy {
    async getBinaryPath(): Promise<string> {
        // Check standard location
        if (fs.existsSync('C:\\Program Files\\sing-box\\sing-box.exe')) {
            return 'C:\\Program Files\\sing-box\\sing-box.exe';
        }
        // Assume in PATH
        return 'sing-box.exe';
    }

    async getConfigPath(): Promise<string> {
        return 'C:\\ProgramData\\sing-box\\config.json';
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
            stdio: ['ignore', logFile, errFile],
            windowsHide: true
        });

        subprocess.unref();
    }

    async stop(): Promise<void> {
        try {
            await execAsync('taskkill /F /IM sing-box.exe');
        } catch (e) {
            // Ignore if process not found
        }
    }

    async getStatus(): Promise<'running' | 'stopped' | 'error'> {
        try {
            const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq sing-box.exe"');
            return stdout.includes('sing-box.exe') ? 'running' : 'stopped';
        } catch {
            return 'error';
        }
    }

    async getPid(): Promise<number | null> {
        try {
            const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq sing-box.exe" /FO CSV /NH');
            // Output format: "sing-box.exe","1234","Console","1","10,000 K"
            if (!stdout.includes('sing-box.exe')) return null;

            const parts = stdout.split(',');
            if (parts.length >= 2) {
                const pid = parseInt(parts[1].replace(/"/g, ''));
                return isNaN(pid) ? null : pid;
            }
            return null;
        } catch {
            return null;
        }
    }
}
