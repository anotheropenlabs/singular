import { ServerV112Strategy } from './server_v1.12';

/** v1.13 Server — schema compatible with v1.12, extensible for future changes */
export class ServerV113Strategy extends ServerV112Strategy {
    version = '1.13';
}
