import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
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

router.route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router