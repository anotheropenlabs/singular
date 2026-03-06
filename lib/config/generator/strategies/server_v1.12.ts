import { ServerV111Strategy } from './server_v1.11';
import { inboundSchemaV112 } from '../../versions/v1.12/schemas';

/** v1.12 Server — typed DNS format + strict inbound schema validation */
export class ServerV112Strategy extends ServerV111Strategy {
    version = '1.12';
    protected override dnsFormat = 'typed' as const;
    protected override strictInboundValidation = true;

    protected override performStrictValidation(inbounds: any[]): any[] {
        const valid: any[] = [];
        for (const ib of inbounds) {
            const result = inboundSchemaV112.safeParse(ib);
            if (result.success) {
                valid.push(result.data);
            } else {
                console.error(`[V1.12] Strict validation failed for ${ib.tag}, dropping.`, result.error.format());
            }
        }
        return valid;
    }
}
