import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// Subscribe/unsubscribe to a specific channel
router.route("/channel/:channelId").post(toggleSubscription);

// Get subscribers for a channel (channel owner only)
router.route("/channel/:channelId/subscribers").get(getUserChannelSubscribers);

// Get channels subscribed by a user (self only)
router.route("/subscriber/:subscriberId/channels").get(getSubscribedChannels);

export default router
