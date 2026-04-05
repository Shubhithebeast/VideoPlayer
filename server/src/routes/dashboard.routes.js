import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Channel statistics and video management
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get channel stats — total videos, views, subscribers, likes (cached 1h)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Channel statistics
 *         content:
 *           application/json:
 *             example:
 *               totalVideos: 12
 *               totalViews: 45000
 *               totalSubscribers: 320
 *               totalLikes: 1800
 */

/**
 * @swagger
 * /dashboard/videos:
 *   get:
 *     summary: Get all videos for the current channel (paginated)
 *     tags: [Dashboard]
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
 *     responses:
 *       200:
 *         description: Paginated channel videos with like/comment counts
 */
router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);

export default router