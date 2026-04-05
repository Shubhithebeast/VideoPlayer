import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Channel subscriptions
 */

/**
 * @swagger
 * /subscriptions/channel/{channelId}:
 *   post:
 *     summary: Subscribe or unsubscribe to a channel
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unsubscribed
 *       201:
 *         description: Subscribed
 */

/**
 * @swagger
 * /subscriptions/channel/{channelId}/subscribers:
 *   get:
 *     summary: Get subscribers of a channel (channel owner only)
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of subscribers
 */

/**
 * @swagger
 * /subscriptions/subscriber/{subscriberId}/channels:
 *   get:
 *     summary: Get channels a user has subscribed to (self only)
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: subscriberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of subscribed channels
 */
// Subscribe/unsubscribe to a specific channel
router.route("/channel/:channelId").post(toggleSubscription);

// Get subscribers for a channel (channel owner only)
router.route("/channel/:channelId/subscribers").get(getUserChannelSubscribers);

// Get channels subscribed by a user (self only)
router.route("/subscriber/:subscriberId/channels").get(getSubscribedChannels);

export default router
