import { Socket } from 'net';

export async function testTcpLatency(host: string, port: number, timeout = 2000): Promise<number> {
    return new Promise((resolve) => {
        const start = Date.now();
        const socket = new Socket();

        socket.setTimeout(timeout);

        socket.on('connect', () => {
            const latency = Date.now() - start;
            socket.destroy();
            resolve(latency);
        });

        socket.on('error', () => {
            socket.destroy();
            resolve(-1);
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve(-1);
        });

        try {
            socket.connect(port, host);
        } catch {
            resolve(-1);
        }
    });
}

export async function testHttpLatency(url: string, timeout = 5000): Promise<number> {
    const start = Date.now();
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        const res = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(id);

        if (res.ok || res.status < 500) {
            return Date.now() - start;
        }
        return -1;
    } catch {
        return -1;
    }
}
