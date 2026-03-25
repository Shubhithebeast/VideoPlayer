import { Queue } from 'bullmq';
import logger from '../utils/logger.js';

const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
};

const cleanupQueue = new Queue('temp-cleanup', { connection });

// --- Register the repeatable job ---
// This runs once at startup and tells Redis: "run 'cleanup-temp-files' every hour".
// BullMQ stores the schedule in Redis, so even if the server restarts,
// the schedule is remembered and won't create duplicate schedules.
const scheduleCleanupJob = async () => {
    // Remove any existing schedule first to avoid duplicates on restart
    await cleanupQueue.obliterate({ force: true }).catch(() => {});

    await cleanupQueue.add(
        'cleanup-temp-files',
        {},  // No data needed — the worker knows what to do
        {
            repeat: {
                pattern: '0 * * * *',  // Cron: every hour at minute 0 (e.g., 1:00, 2:00, 3:00...)
            },
            removeOnComplete: { count: 5 },  // Keep last 5 runs for history
            removeOnFail: { count: 5 },
        }
    );

    logger.info('Temp cleanup job scheduled (runs every hour)');
};

export { cleanupQueue, scheduleCleanupJob };
