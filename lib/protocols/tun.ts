import { z } from 'zod';
import { ProtocolDefinition } from './types';
import { Radio } from 'lucide-react';

export const tun: ProtocolDefinition = {
    id: 'tun',
    name: 'TUN',
    color: 'text-sing-green',
    icon: Radio,
    description: 'Virtual Network Interface',
    schema: z.object({
        interface_name: z.string().optional(),
        auto_route: z.boolean().optional(),
        strict_route: z.boolean().optional(),
        stack: z.string().optional(),
    }),
    sections: [
        {
            id: 'tun_settings',
            title: 'TUN Settings',
            fields: [
                {
                    key: 'interface_name',
                    label: 'Interface Name',
                    type: 'text',
                    placeholder: 'tun0',
                },
                {
                    key: 'auto_route',
                    label: 'Auto Route',
                    type: 'boolean',
                    defaultValue: true,
                },
                {
                    key: 'strict_route',
                    label: 'Strict Route',
                    type: 'boolean',
                    defaultValue: true,
                },
                {
                    key: 'stack',
                    label: 'Stack',
                    type: 'select',
                    options: [{ label: 'system', value: 'system' }, { label: 'gvisor', value: 'gvisor' }, { label: 'mixed', value: 'mixed' }],
                    defaultValue: 'system',
                }
            ]
        }
    ],
    toSingBoxConfig: (data) => ({
        type: 'tun',
        interface_name: data.interface_name || 'tun0',
        auto_route: data.auto_route !== false,
        strict_route: data.strict_route !== false,
        stack: data.stack || 'system',
    }),
    fromSingBoxConfig: (json) => ({
        interface_name: json.interface_name || 'tun0',
        auto_route: json.auto_route ?? true,
        strict_route: json.strict_route ?? true,
        stack: json.stack || 'system',
    }),
    generateLink: () => '',
};
