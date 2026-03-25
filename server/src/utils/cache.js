import redis from '../database/redis.js';
import logger from './logger.js';

/**
 * Returns the parsed JS object, or null if not found.
 * Redis stores everything as strings, so we JSON.parse() automatically.
 */
const getCache = async (key) => {
    try {
        const data = await redis.get(key);
        if (!data) return null;

        logger.info(`Cache HIT: ${key}`);
        return JSON.parse(data);
    } catch (error) {
        logger.error(`Cache GET error for key ${key}:`, error);
        return null; // On error, app falls back to DB
    }
};

/**
 * Store data in cache with a TTL (time-to-live in seconds).
 * 'EX' tells Redis the TTL is in seconds (e.g., 600 = 10 minutes).
 */
const setCache = async (key, data, ttlSeconds) => {
    try {
        await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
        logger.info(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
        logger.error(`Cache SET error for key ${key}:`, error);
        // Don't throw — caching failure shouldn't break the app
    }
};

/**
 * Delete a single cached key.
 * when data changes (e.g., video updated → delete its cache).
 */
const deleteCache = async (key) => {
    try {
        await redis.del(key);
        logger.info(`Cache DEL: ${key}`);
    } catch (error) {
        logger.error(`Cache DEL error for key ${key}:`, error);
    }
};

/**
 * Delete all keys matching a pattern (e.g., 'video:*' deletes all video caches).
 *
 * Uses SCAN instead of KEYS because:
 * - KEYS blocks Redis while it scans ALL keys (bad for prod)
 * - SCAN does it incrementally(in batches) without blocking
 */
const deleteCachePattern = async (pattern) => {
    try {
        let cursor = '0';
        let deletedCount = 0;

        // SCAN iterates through keys in batches (100 at a time)
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;

            if (keys.length > 0) {
                await redis.del(...keys); // Delete this batch
                deletedCount += keys.length;
            }
        } while (cursor !== '0'); // cursor '0' means scan is complete

        if (deletedCount > 0) {
            logger.info(`Cache DEL pattern "${pattern}": removed ${deletedCount} keys`);
        }
    } catch (error) {
        logger.error(`Cache DEL pattern error for "${pattern}":`, error);
    }
};

export { getCache, setCache, deleteCache, deleteCachePattern };
