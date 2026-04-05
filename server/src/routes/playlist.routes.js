import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getMyPlaylists,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { upload } from './../middlewares/multer.middleware.js';

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

/**
 * @swagger
 * tags:
 *   name: Playlists
 *   description: Playlist management
 */

/**
 * @swagger
 * /playlist:
 *   post:
 *     summary: Create a new playlist
 *     tags: [Playlists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Playlist created
 */

/**
 * @swagger
 * /playlist/me:
 *   get:
 *     summary: Get my playlists (paginated)
 *     tags: [Playlists]
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
 *         description: My playlists
 */

/**
 * @swagger
 * /playlist/user/{userId}:
 *   get:
 *     summary: Get playlists of a specific user (paginated)
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User playlists
 */

/**
 * @swagger
 * /playlist/{playlistId}:
 *   get:
 *     summary: Get playlist by ID with full video details
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Playlist with videos
 *       404:
 *         description: Playlist not found
 *   patch:
 *     summary: Update playlist name or description
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Playlist updated
 *   delete:
 *     summary: Delete a playlist
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Playlist deleted
 */

/**
 * @swagger
 * /playlist/add/{videoId}/{playlistId}:
 *   patch:
 *     summary: Add a video to a playlist (no duplicates)
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video added to playlist
 */

/**
 * @swagger
 * /playlist/remove/{videoId}/{playlistId}:
 *   patch:
 *     summary: Remove a video from a playlist
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video removed from playlist
 */
router.route("/").post(upload.none(),createPlaylist)
router.route("/me").get(getMyPlaylists);
router.route("/user/:userId").get(getUserPlaylists);

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(upload.none(), updatePlaylist)
    .delete(deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

export default router
