import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    getVideoJobStatus,
    publishVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../database/redis.js';

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// --- Upload Rate Limiter ---
// Uses user ID (not IP) as the key — so each user gets their own counter.
// Falls back to ipKeyGenerator (library's safe IP helper) for unauthenticated edge cases.
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  
    max: 10,                    
    keyGenerator: (req, res) => {
        return req.user?._id?.toString() || ipKeyGenerator(req, res);
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
        prefix: 'rl:upload:',  // Keys in Redis: rl:upload:665a1b2c...
    }),
    message: {
        success: false,
        message: "Upload limit reached. You can upload up to 10 videos per hour."
    }
});

/**
 * @swagger
 * tags:
 *   name: Videos
 *   description: Video upload, retrieval, and management
 */

/**
 * @swagger
 * /videos:
 *   get:
 *     summary: Get all published videos (paginated, searchable)
 *     tags: [Videos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Full-text search on title and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: createdAt
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter videos by uploader
 *     responses:
 *       200:
 *         description: Paginated list of videos
 *   post:
 *     summary: Upload a new video (rate limited — 10/hour per user)
 *     tags: [Videos]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description, video]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               video:
 *                 type: string
 *                 format: binary
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       202:
 *         description: Video queued for processing — returns jobId
 *       429:
 *         description: Upload limit reached
 */
router.route("/").get(getAllVideos).post(
    uploadLimiter,
    upload.fields(
    [
        {
            name: "video",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
            
    ]),
    publishVideo
);

/**
 * @swagger
 * /videos/jobs/{jobId}:
 *   get:
 *     summary: Check video processing job status
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job state (queued/active/completed/failed) + progress %
 *       404:
 *         description: Job not found
 */
router.route("/jobs/:jobId").get(getVideoJobStatus);

/**
 * @swagger
 * /videos/{videoId}:
 *   get:
 *     summary: Get video by ID (cached 10 min, increments views)
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video details with like/comment counts
 *       404:
 *         description: Video not found
 *   delete:
 *     summary: Delete a video
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video deleted
 *   patch:
 *     summary: Update video title, description, or thumbnail
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Video updated
 */
router.route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

/**
 * @swagger
 * /videos/toggle/publish/{videoId}:
 *   patch:
 *     summary: Toggle video publish status
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Publish status toggled
 */
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router