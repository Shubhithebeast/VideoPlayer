import { Router } from "express";
import { changeCurrentUserPassword, getCurrentUser, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, userChannelProfile } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from './../middlewares/auth.middleware.js';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../database/redis.js';

const router = Router();

// --- Login Rate Limiter ---
// Prevents brute-force password guessing attacks.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,                     
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
        prefix: 'rl:login:',   // Keys in Redis: rl:login:192.168.1.5
    }),
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes."
    }
});

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User registration, auth, and profile management
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [username, email, fullname, password, avatar]
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               fullname:
 *                 type: string
 *                 example: John Doe
 *               password:
 *                 type: string
 *                 example: secret123
 *               avatar:
 *                 type: string
 *                 format: binary
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email or username already exists
 */
router.route("/register").post(
    upload.fields([
        {name:"avatar", maxCount:1},
        {name:"coverImage", maxCount:1}
    ])
    ,registerUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login user (rate limited — 5 attempts per 15 min)
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               username:
 *                 type: string
 *                 example: john_doe
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Login successful — sets accessToken and refreshToken cookies
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 */
router.route("/login").post(upload.none(), loginLimiter, loginUser);

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Logged out — cookies cleared
 */
router.route("/logout").post(upload.none(), verifyJWT, logoutUser);

/**
 * @swagger
 * /users/refreshToken:
 *   post:
 *     summary: Get a new access token using refresh token
 *     tags: [Users]
 *     security: []
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.route("/refreshToken").post(upload.none(), refreshAccessToken);

/**
 * @swagger
 * /users/getUser:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User details returned
 */
router.route("/getUser").get(upload.none(), getCurrentUser);

/**
 * @swagger
 * /users/changePassword:
 *   post:
 *     summary: Change current user password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Old password is incorrect
 */
router.route("/changePassword").post(upload.none(), verifyJWT, changeCurrentUserPassword);

/**
 * @swagger
 * /users/updateAccountDetails:
 *   post:
 *     summary: Update fullname, email, or username
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account details updated
 */
router.route("/updateAccountDetails").post(upload.none(), verifyJWT, updateAccountDetails);

/**
 * @swagger
 * /users/avatar:
 *   post:
 *     summary: Update user avatar image
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar updated
 */
router.route("/avatar").post(verifyJWT, upload.single("avatar"), updateUserAvatar);

/**
 * @swagger
 * /users/coverImage:
 *   post:
 *     summary: Update user cover image
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cover image updated
 */
router.route("/coverImage").post(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

/**
 * @swagger
 * /users/c/{username}:
 *   get:
 *     summary: Get channel profile by username
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Channel profile with subscriber counts
 *       404:
 *         description: Channel not found
 */
router.route("/c/:username").get(verifyJWT, userChannelProfile);

/**
 * @swagger
 * /users/history:
 *   get:
 *     summary: Get current user watch history
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of watched videos
 */
router.route("/history").get(verifyJWT, getWatchHistory);


export default router;