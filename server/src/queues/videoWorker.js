import { Worker } from 'bullmq';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { Video } from '../models/video.model.js';
import { deleteCache } from '../utils/cache.js';
import logger from '../utils/logger.js';

// --- Redis connection (same config as queue) ---
const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
};

// --- The Worker ---
// This function runs every time a job is picked up from the queue.
//  `job` parameter contains:
//   job.id    — unique job ID (auto-generated)
//   job.data  — the data we passed in addVideoJob() (file paths, title, etc.)
//   job.updateProgress(n) — report progress (0-100)
const videoWorker = new Worker(
    'video-processing',   
    async (job) => {
        const { localVideoPath, localThumbnailPath, title, description, ownerId } = job.data;

        logger.info(`Processing video job`, { jobId: job.id, title });

        try {
            // Upload video to Cloudinary 
            await job.updateProgress(10);
            const uploadVideo = await uploadOnCloudinary(localVideoPath);
            if (!uploadVideo?.secure_url) {
                throw new Error('Failed to upload video to Cloudinary');
            }
            await job.updateProgress(60);

            // Upload thumbnail (if provided)
            let uploadThumbnail = null;
            if (localThumbnailPath) {
                uploadThumbnail = await uploadOnCloudinary(localThumbnailPath);
                if (!uploadThumbnail?.secure_url) {
                    logger.warn('Thumbnail upload failed, using video frame', { jobId: job.id });
                }
            }
            await job.updateProgress(80);

            // Build URLs
            const videoUrl = uploadVideo.secure_url;
            const thumbnailUrl = uploadThumbnail?.secure_url
                || uploadVideo.secure_url.replace(/\.(mp4|mov|avi|mkv)$/i, '.jpg');
            const videoDuration = uploadVideo.duration || 0;

            // Save to MongoDB
            const newVideo = await Video.create({
                title,
                description,
                video: videoUrl,
                thumbnail: thumbnailUrl,
                duration: videoDuration,
                uploadBy: ownerId,
            });
            await job.updateProgress(100);

            // Invalidate dashboard cache
            await deleteCache(`dashboard:stats:${ownerId}`);

            logger.info(`Video job completed`, { jobId: job.id, videoId: newVideo._id });

            return { videoId: newVideo._id.toString(), title: newVideo.title };

        } catch (error) {
            logger.error(`Video job failed`, { jobId: job.id, error: error.message });
            throw error;  // BullMQ will catch this and retry based on our config
        }
    },
    {
        connection,
        concurrency: 2,  // Process up to 2 video uploads at the same time
    }
);

// --- Worker Event Listeners ---
// These fire globally for ALL jobs processed by this worker.

videoWorker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`, { result: job.returnvalue });
});

videoWorker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed`, { error: err.message, attempt: job?.attemptsMade });
});

videoWorker.on('error', (err) => {
    logger.error('Video worker error', { error: err.message });
});

export default videoWorker;
