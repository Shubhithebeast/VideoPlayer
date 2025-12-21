import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from './../middlewares/auth.middleware.js';

const router = Router();

router.route("/register").post(
    upload.fields([
        {name:"avatar", maxCount:1},
        {name:"coverImage", maxCount:1}
    ])
    ,registerUser);

router.route("/login").post(upload.none(), loginUser);
router.route("/logout").post(upload.none(), verifyJWT, logoutUser);
router.route("/refreshToken").post(upload.none(), refreshAccessToken);

export default router;