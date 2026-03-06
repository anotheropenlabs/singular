import { create } from 'zustand';

export interface Connection {
    id: string;
    metadata: {
        network: string;
        type: string;
        sourceIP: string;
        destinationIP: string;
        sourcePort: string;
        destinationPort: string;
        host: string;
        processPath: string;
        inbound?: string;
        inboundName?: string;
        inboundUser?: string;
        [key: string]: any;
    };
    upload: number;
    download: number;
    start: string;
    chains: string[];
    rule: string;
    rulePayload: string;
    status?: 'active' | 'closed';
    closedAt?: string;
    _lastSeen?: number;
    [key: string]: any;
}

interface ConnectionsState {
    connections: Connection[];
    downloadTotal: number;
    uploadTotal: number;
    updateConnections: (incoming: Connection[], downTotal?: number, upTotal?: number) => void;
    clearConnections: () => void;
}

export const useConnectionsStore = create<ConnectionsState>((set) => ({
    connections: [],
    downloadTotal: 0,
    uploadTotal: 0,
    updateConnections: (incoming, downTotal, upTotal) => set((state) => {
        const now = Date.now();
        const incomingDict = new Map<string, Connection>(incoming.map(c => [c.id, c]));
        const next = [...state.connections];

        for (let i = 0; i < next.length; i++) {
            const inc = incomingDict.get(next[i].id);
            if (inc) {
                // Update active connection metrics inline
                next[i] = {
                    ...inc,
                    status: 'active',
                    _lastSeen: now,
                    upload: inc.upload,
                    download: inc.download
                };
                incomingDict.delete(next[i].id);
            } else if (next[i].status === 'active') {
                // Connection just died
                next[i] = {
                    ...next[i],
                    status: 'closed',
                    closedAt: new Date().toISOString(),
                    _lastSeen: now
                };
            }
        }

        // Append entirely new connections to the top
        for (const inc of Array.from(incomingDict.values()) as Connection[]) {
            next.unshift({ ...inc, status: 'active', _lastSeen: now });
        }

        const active = next.filter(c => c.status === 'active');
        const closed = next.filter(c => c.status === 'closed')
            .sort((a, b) => (b._lastSeen || 0) - (a._lastSeen || 0))
            .slice(0, 100);

        return {
            connections: [...active, ...closed],
            downloadTotal: downTotal ?? state.downloadTotal,
            uploadTotal: upTotal ?? state.uploadTotal
        };
    }),
    clearConnections: () => set({ connections: [] })
}));
