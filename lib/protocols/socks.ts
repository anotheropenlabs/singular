import { z } from 'zod';
import { ProtocolDefinition } from './types';
import { Radio } from 'lucide-react';

export const socks: ProtocolDefinition = {
    id: 'socks',
    name: 'SOCKS',
    color: 'text-sing-yellow',
    icon: Radio,
    description: 'SOCKS5 Proxy',
    schema: z.object({
        version: z.string().optional(),
    }),
    sections: [],
    toSingBoxConfig: (data) => ({
        type: 'socks',
    }),
    fromSingBoxConfig: (json) => ({}),
    generateLink: () => '',
};
