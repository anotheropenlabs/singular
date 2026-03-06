import { LucideIcon } from 'lucide-react';
import { z } from 'zod';

export type ParamType = 'text' | 'number' | 'password' | 'select' | 'boolean' | 'textarea';

export interface OutboundNode {
    name: string;
    type: string;
    server: string;
    port: number;
    config: any; // The raw sing-box outbound config object
}

export interface SelectOption {
    label: string;
    value: string;
}

export interface FieldDefinition {
    key: string;              // e.g., "uuid", "transport.path"
    label: string;
    type: ParamType;
    placeholder?: string;
    defaultValue?: any;
    options?: SelectOption[]; // For 'select' type
    required?: boolean;
    help?: string;            // Tooltip or helper text
    showIf?: (values: any) => boolean; // Dynamic visibility
}

export interface ConfigSection {
    id: string;
    title: string;
    fields: FieldDefinition[];
}

export interface ProtocolDefinition {
    id: string;               // e.g., "vless"
    name: string;             // e.g., "VLESS"
    color: string;            // Tailwind text color class, e.g., "text-blue-500"
    icon?: any;               // Lucide Icon component
    description: string;

    // Form Configuration
    sections: ConfigSection[];

    // Validation Schema (Zod)
    schema: z.ZodObject<any>;

    // Transformers
    toSingBoxConfig: (formData: any) => any;
    fromSingBoxConfig: (json: any) => any; // For editing

    // Link Generation (Outbound/Inbound sharing)
    generateLink: (inbound: any, user: any, host: string) => string;

    // URI Parsing (For Subscriptions and Client Outbounds)
    aliases?: string[]; // Alternative names or scheme prefixes (e.g., ['ss', 'hy2'])
    parseUri?: (uri: string) => OutboundNode | null;
}
