import { db } from './lib/db';
import { provider, proxyNode } from './lib/db/schema';

async function seed() {
    console.log('Seeding...');

    // 1. Create Provider
    const p = await db.insert(provider).values({
        name: 'Test Provider',
        url: 'https://example.com/sub',
        node_count: 5,
    }).returning();

    const providerId = p[0].id;
    console.log('Provider created:', providerId);

    // 2. Create Nodes
    const nodes = [
        { name: 'US Node 1', type: 'vless', server: 'us1.example.com', port: 443, latency: 150 },
        { name: 'HK Node 1', type: 'vmess', server: 'hk1.example.com', port: 443, latency: 50 },
        { name: 'JP Node 1', type: 'trojan', server: 'jp1.example.com', port: 443, latency: 80 },
        { name: 'SG Node 1', type: 'hysteria2', server: 'sg1.example.com', port: 443, latency: 120 },
        { name: 'Fail Node', type: 'ss', server: 'fail.example.com', port: 443, latency: -1 },
    ];

    for (const n of nodes) {
        await db.insert(proxyNode).values({
            provider_id: providerId,
            name: n.name,
            type: n.type,
            server: n.server,
            port: n.port,
            latency: n.latency,
            config: JSON.stringify({}), // dummy config
        });
    }

    console.log('Nodes created');
}

seed().catch(console.error);
