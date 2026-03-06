import { ClientV111Strategy } from './client_v1.11';

/** v1.12 Client — typed DNS format (type+server instead of address+method) */
export class ClientV112Strategy extends ClientV111Strategy {
    version = 'client-1.12';
    protected override dnsFormat = 'typed' as const;
}
