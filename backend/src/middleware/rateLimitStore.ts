import { RedisStore, RedisReply } from 'rate-limit-redis';
import { getRedis } from '../infrastructure/redis';
export function redisRateLimitStore(namespace: string): RedisStore {
  return new RedisStore({
    prefix: `atacte:rate-limit:${namespace}:`,
    sendCommand: async (...args: string[]) => (await getRedis()).sendCommand(args) as Promise<RedisReply>,
  });
}
