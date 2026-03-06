import { z } from 'zod';
import { ProtocolDefinition } from './types';
import { Globe } from 'lucide-react';

export const http: ProtocolDefinition = {
    id: 'http',
    name: 'HTTP',
    color: 'text-sing-cyan',
    icon: Globe,
    description: 'HTTP Proxy',
    schema: z.object({}),
    sections: [],
    toSingBoxConfig: (data) => ({
        type: 'http',
    }),
    fromSingBoxConfig: (json) => ({}),
    generateLink: () => '',
};
