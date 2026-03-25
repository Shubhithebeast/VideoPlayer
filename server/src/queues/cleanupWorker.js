import { Worker } from 'bullmq';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
};

// Temp folder path — same as multer uses
const TEMP_DIR = path.resolve('./public/temp');

// Files older than this will be deleted (1 hour in ms)
// Why 1 hour? The video worker's retry window is ~35s (5s + 10s + 20s backoff).
// 1 hour gives plenty of buffer even if the server was briefly down.
const MAX_AGE_MS = 60 * 60 * 1000;

const cleanupWorker = new Worker(
    'temp-cleanup',  // Must match cleanupQueue.js queue name
    async (job) => {
        logger.info('Running temp folder cleanup...');

        if (!fs.existsSync(TEMP_DIR)) {
            logger.info('Temp folder does not exist, nothing to clean');
            return { deleted: 0 };
        }

        const files = fs.readdirSync(TEMP_DIR);
        const now = Date.now();
        let deletedCount = 0;

        for (const file of files) {
            const filePath = path.join(TEMP_DIR, file);
            try {
                const stats = fs.statSync(filePath);
                const ageMs = now - stats.mtimeMs;  // mtimeMs = last modified time in ms

                if (ageMs > MAX_AGE_MS) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    logger.info(`Deleted stale temp file: ${file} (age: ${Math.round(ageMs / 60000)} min)`);
                }
            } catch (err) {
                // Log but don't throw — one bad file shouldn't stop the whole cleanup
                logger.warn(`Could not process temp file ${file}:`, { error: err.message });
            }
        }

        logger.info(`Temp cleanup complete. Deleted ${deletedCount} of ${files.length} files.`);
        return { deleted: deletedCount, total: files.length };
    },
    {
        connection,
        concurrency: 1,  // Cleanup should only run one at a time
    }
);

cleanupWorker.on('completed', (job) => {
    logger.info(`Cleanup job ${job.id} finished`, { result: job.returnvalue });
});

cleanupWorker.on('failed', (job, err) => {
    logger.error(`Cleanup job ${job?.id} failed`, { error: err.message });
});

export default cleanupWorker;
