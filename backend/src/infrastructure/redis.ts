import { createClient } from 'redis';
import { REDIS_URL } from './config';

const client = createClient({ url: REDIS_URL, socket: { connectTimeout: 3000, reconnectStrategy: false }, disableOfflineQueue: true });
client.on('error', () => { /* Requests fail closed; never log connection credentials. */ });
let connecting: Promise<unknown> | undefined;
export async function getRedis() {
  if (!client.isOpen) {
    connecting ??= client.connect().finally(() => { connecting = undefined; });
    await connecting;
  }
  if (!client.isReady) throw new Error('Serviço de segurança temporariamente indisponível');
  return client;
}
export async function closeRedis() { if (client.isOpen) await client.quit(); }
