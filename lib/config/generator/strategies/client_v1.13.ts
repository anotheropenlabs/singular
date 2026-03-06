import { ClientV112Strategy } from './client_v1.12';

/** v1.13 Client — schema compatible with v1.12, extensible for future changes */
export class ClientV113Strategy extends ClientV112Strategy {
    version = 'client-1.13';
}
