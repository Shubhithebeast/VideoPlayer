import Redis from 'ioredis';
import logger from '../utils/logger.js';

const shouldUseRedis =
    process.env.NODE_ENV !== 'test' &&
    process.env.DISABLE_REDIS !== 'true' &&
    process.env.REDIS_DISABLED !== 'true';

const createNoopRedisClient = () => ({
    call: async () => null,
    get: async () => null,
    set: async () => 'OK',
    del: async () => 0,
    keys: async () => [],
    quit: async () => 'OK',
    disconnect: () => {},
    on: () => {},
});

// Unlike MongoDB (where we call connectDB() manually), ioredis connects
// automatically when you create a new instance. It also auto-reconnects
// if the connection drops.
const redis = shouldUseRedis
    ? new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
        maxRetriesPerRequest: 3,
    })
    : createNoopRedisClient();

// --- Event Listeners ---
// These fire automatically as the connection state changes.

if (shouldUseRedis) {
    redis.on('connect', () => {
        logger.info('Redis: Connecting...');
    });

    redis.on('ready', () => {
        logger.info('Redis: Connected and ready to accept commands');
    });

    redis.on('error', (err) => {
        logger.error('Redis: Connection error', err);
    });

    redis.on('close', () => {
        logger.warn('Redis: Connection closed');
    });
} else {
    logger.info('Redis: Disabled, using in-memory/no-op behavior');
}

export default redis;
