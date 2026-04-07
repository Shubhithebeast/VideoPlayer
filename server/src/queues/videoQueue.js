import { Queue } from 'bullmq';
import logger from '../utils/logger.js';

const isDisabled = process.env.DISABLE_REDIS === 'true';

// --- Redis connection config ---
// BullMQ manages its OWN Redis connections internally.
// BullMQ will create separate connections for the Queue and Worker.
const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
};

// --- Create the Queue ---
// All video processing jobs will be added to this queue.
// In Redis, keys like: bull:video-processing:...
const videoQueue = isDisabled ? null : new Queue('video-processing', { connection });

if (!isDisabled) logger.info('Video processing queue initialized');

// --- Helper: Add a video upload job ---
const addVideoJob = async (jobData) => {
    if (isDisabled) {
        logger.info('Video queue disabled (test mode), skipping job', { title: jobData.title });
        return { id: 'mock-job-id' };
    }

    const job = await videoQueue.add(
        'upload-video',     // Job name
        jobData,            // data the worker will receive (file paths, title, userId, etc.)
        {
            attempts: 3,    // If it fails, retry up to 3 times
            backoff: {
                type: 'exponential',    
                delay: 5000,            // 1st retry: 5s, 2nd: 10s, 3rd: 20s
            },
            removeOnComplete: { count: 50 },  // Keep last 50 completed jobs (for history)
            removeOnFail: { count: 100 },     // Keep last 100 failed jobs (for debugging)
        }
    );

    logger.info(`Video job added to queue`, { jobId: job.id, title: jobData.title });
    return job;
};

export { videoQueue, addVideoJob };
