import { Router } from "express";
import { changeCurrentUserPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
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
router.route("/getUser").get(upload.none(), getCurrentUser);
router.route("/changePassword").post(upload.none(), changeCurrentUserPassword);
router.route("/updateAccountDetails").post(upload.none(), updateAccountDetails);
router.route("/updateAvatar").post(upload.none(), updateUserAvatar);
router.route("/updateCoverImage").post(upload.none(), updateUserCoverImage);

export default router;