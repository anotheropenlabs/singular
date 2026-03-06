export interface ProcessStrategy {
    getBinaryPath(): Promise<string>;
    getConfigPath(): Promise<string>;
    start(binPath: string, configPath: string): Promise<void>;
    stop(): Promise<void>;
    getStatus(): Promise<'running' | 'stopped' | 'error'>;
    getPid(): Promise<number | null>;
}
