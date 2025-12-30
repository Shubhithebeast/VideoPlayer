import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router.use(verifyJWT); 

router.route("/:videoId").get(getVideoComments).post(upload.none(),addComment);
router.route("/c/:commentId").delete(deleteComment).patch(upload.none(),updateComment);

export default router