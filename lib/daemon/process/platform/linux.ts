import { ProcessStrategy } from '../strategy';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export class LinuxStrategy implements ProcessStrategy {
    private useSystemd(): boolean {
        // Simple heuristic for systemd presence
        return fs.existsSync('/run/systemd/system');
    }

    async getBinaryPath(): Promise<string> {
        return '/usr/bin/sing-box';
    }

    async getConfigPath(): Promise<string> {
        return '/etc/sing-box/config.json';
    }

    async start(binPath: string, configPath: string): Promise<void> {
        if (this.useSystemd()) {
            try {
                await execAsync('systemctl start sing-box');
                return;
            } catch (e) {
                console.warn('Systemd start failed, falling back to manual...', e);
            }
        }

        // Manual Start
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
        if (this.useSystemd()) {
            try {
                await execAsync('systemctl stop sing-box');
            } catch {
                // Ignore failure
            }
        }

        // Fallback or ensure kill
        try {
            await execAsync('pkill -f "sing-box run"');
        } catch (e) {
            // Ignore if not found
        }
    }

    async getStatus(): Promise<'running' | 'stopped' | 'error'> {
        if (this.useSystemd()) {
            try {
                const { stdout } = await execAsync('systemctl is-active sing-box');
                if (stdout.trim() === 'active') return 'running';
            } catch {
                // Fallback
            }
        }

        try {
            const { stdout } = await execAsync('pgrep -f "sing-box run"');
            return stdout.trim().length > 0 ? 'running' : 'stopped';
        } catch {
            return 'stopped';
        }
    }

    async getPid(): Promise<number | null> {
        if (this.useSystemd()) {
            try {
                const { stdout } = await execAsync('systemctl show -p MainPID sing-box');
                // Output format: MainPID=1234
                const pid = parseInt(stdout.trim().split('=')[1]);
                if (pid > 0) return pid;
            } catch {
                // Fallback
            }
        }

        try {
            const { stdout } = await execAsync('pgrep -f "sing-box run"');
            const pid = parseInt(stdout.trim());
            return isNaN(pid) ? null : pid;
        } catch {
            return null;
        }
    }
}
