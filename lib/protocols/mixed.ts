import { z } from 'zod';
import { ProtocolDefinition } from './types';
import { Layers } from 'lucide-react';

export const mixed: ProtocolDefinition = {
    id: 'mixed',
    name: 'Mixed',
    color: 'text-sing-blue',
    icon: Layers,
    description: 'HTTP & SOCKS Proxy',
    schema: z.object({
        set_system_proxy: z.boolean().optional(),
    }),
    sections: [
        {
            id: 'general',
            title: 'General Settings',
            fields: [
                {
                    key: 'set_system_proxy',
                    label: 'Set System Proxy',
                    type: 'boolean',
                    help: 'Set as system proxy (Client only)',
                }
            ]
        }
    ],
    toSingBoxConfig: (data) => ({
        type: 'mixed',
        set_system_proxy: data.set_system_proxy || false,
    }),
    fromSingBoxConfig: (json) => ({
        set_system_proxy: json.set_system_proxy || false,
    }),
    generateLink: () => '',
};
