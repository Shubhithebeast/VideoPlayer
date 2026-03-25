import Redis from 'ioredis';
import logger from '../utils/logger.js';

// Unlike MongoDB (where we call connectDB() manually), ioredis connects
// automatically when you create a new instance. It also auto-reconnects
// if the connection drops.
const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: 3, 
});

// --- Event Listeners ---
// These fire automatically as the connection state changes.

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

export default redis;
