import Redis from 'ioredis';

let redis = null;

export function getRedis() {
    if (!redis) {
        redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });
    }
    return redis;
}
