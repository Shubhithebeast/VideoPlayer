import { Router } from "express";
import { changeCurrentUserPassword, getCurrentUser, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, userChannelProfile } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from './../middlewares/auth.middleware.js';

const router = Router();

// Register new user - Body: username, email, fullname, password, Files: avatar(required), coverImage(optional)
router.route("/register").post(
    upload.fields([
        {name:"avatar", maxCount:1},
        {name:"coverImage", maxCount:1}
    ])
    ,registerUser);

// Login user - Body: (email or username), password
router.route("/login").post(upload.none(), loginUser);

// Logout authenticated user - Auth: accessToken required
router.route("/logout").post(upload.none(), verifyJWT, logoutUser);

// Refresh access token - Body or Cookie: refreshToken
router.route("/refreshToken").post(upload.none(), refreshAccessToken);

// Get current authenticated user details - Auth: accessToken required
router.route("/getUser").get(upload.none(), getCurrentUser);

// Change password for authenticated user - Auth: accessToken, Body: oldPassword, newPassword
router.route("/changePassword").post(upload.none(), verifyJWT, changeCurrentUserPassword);

// Update user account details - Auth: accessToken, Body: fullname, email
router.route("/updateAccountDetails").post(upload.none(), verifyJWT, updateAccountDetails);

// Update user avatar image - Auth: accessToken, File: avatar
router.route("/avatar").post(verifyJWT, upload.single("avatar"), updateUserAvatar);

// Update user cover image - Auth: accessToken, File: coverImage
router.route("/coverImage").post(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

// Get user channel profile by username - Params: username
router.route("/c/:username").get(verifyJWT, userChannelProfile);

// Get user watch history - Auth: accessToken
router.route("/history").get(verifyJWT, getWatchHistory);


export default router;