import { ClientV110Strategy } from './client_v1.10';

/** v1.11 Client — sniff stripped from inbound, moved to route action */
export class ClientV111Strategy extends ClientV110Strategy {
    version = 'client-1.11';
    protected override stripInboundSniff = true;
}
