import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

/**
 * @swagger
 * tags:
 *   name: Tweets
 *   description: Short text posts
 */

/**
 * @swagger
 * /tweets:
 *   post:
 *     summary: Create a tweet (max 280 chars)
 *     tags: [Tweets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 280
 *     responses:
 *       201:
 *         description: Tweet created
 */

/**
 * @swagger
 * /tweets/user/{userId}:
 *   get:
 *     summary: Get tweets by user (paginated)
 *     tags: [Tweets]
 *     parameters:
 *       - in: path
 *         name: userId
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of tweets
 */

/**
 * @swagger
 * /tweets/{tweetId}:
 *   patch:
 *     summary: Update tweet content
 *     tags: [Tweets]
 *     parameters:
 *       - in: path
 *         name: tweetId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tweet updated
 *   delete:
 *     summary: Delete a tweet
 *     tags: [Tweets]
 *     parameters:
 *       - in: path
 *         name: tweetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tweet deleted
 */
router.route("/").post(upload.none(), createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(upload.none(), updateTweet).delete(deleteTweet);

export default router