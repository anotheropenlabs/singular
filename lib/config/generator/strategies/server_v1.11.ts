import { ServerV110Strategy } from './server_v1.10';

/** v1.11 Server — sniff/domain_strategy migrated from inbound to route rules */
export class ServerV111Strategy extends ServerV110Strategy {
    version = '1.11';
    protected override migrateSniff = true;
}
