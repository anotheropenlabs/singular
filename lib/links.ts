
import { Inbound, NodeUser } from "@/types";
import { getProtocol, getAllProtocols } from '@/lib/protocols/registry';

// Generic Link Generator
export function generateLink(inbound: Inbound, user: NodeUser, serverHost: string): string {
    const protocolDef = getProtocol(inbound.protocol);

    if (!protocolDef || !protocolDef.generateLink) {
        console.warn(`No link generator found for protocol: ${inbound.protocol}`);
        return '';
    }

    try {
        return protocolDef.generateLink(inbound, user, serverHost);
    } catch (e) {
        console.error(`Failed to generate link for inbound ${inbound.tag}:`, e);
        return '';
    }
}

// Generate base64 subscription content
export function generateSubscriptionContent(inbounds: Inbound[], user: NodeUser, serverHost: string): string {
    const links: string[] = [];

    for (const inbound of inbounds) {
        const link = generateLink(inbound, user, serverHost);
        if (link) {
            links.push(link);
        }
    }

    return btoa(links.join('\n'));
}
