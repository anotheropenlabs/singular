
import { z } from 'zod';
import {
    singBoxConfigV110Schema,
    inboundSchema as inboundSchemaV110
} from '../v1.10/schemas';

// v1.11 still allows 'sniff' but it is deprecated.
// Re-export v1.10 as v1.11 base
export const inboundSchemaV111 = inboundSchemaV110;
