import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import { apiError } from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    
    // toggle like on video
    // 1. Validate videoId (check if it's a valid MongoDB ObjectId)
    // 2. Check if video exists in database
    // 3. Get logged in user ID from req.user._id
    // 4. Check if like already exists (find by likedBy=userId and video=videoId)
    // 5. If like exists:
    //    - Delete the like (unlike)
    //    - Return response: "Video unliked successfully"
    // 6. If like doesn't exist:
    //    - Create new like with: likedBy (userId), video (videoId)
    //    - Return response: "Video liked successfully"
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    
    // toggle like on comment
    // 1. Validate commentId (check if it's a valid MongoDB ObjectId)
    // 2. Check if comment exists in database
    // 3. Get logged in user ID from req.user._id
    // 4. Check if like already exists (find by likedBy=userId and comment=commentId)
    // 5. If like exists:
    //    - Delete the like (unlike)
    //    - Return response: "Comment unliked successfully"
    // 6. If like doesn't exist:
    //    - Create new like with: likedBy (userId), comment (commentId)
    //    - Return response: "Comment liked successfully"
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
    // toggle like on tweet
    // 1. Validate tweetId (check if it's a valid MongoDB ObjectId)
    // 2. Check if tweet exists in database
    // 3. Get logged in user ID from req.user._id
    // 4. Check if like already exists (find by likedBy=userId and tweet=tweetId)
    // 5. If like exists:
    //    - Delete the like (unlike)
    //    - Return response: "Tweet unliked successfully"
    // 6. If like doesn't exist:
    //    - Create new like with: likedBy (userId), tweet (tweetId)
    //    - Return response: "Tweet liked successfully"
})

const getLikedVideos = asyncHandler(async (req, res) => {
    // get all liked videos
    // 1. Get pagination parameters from req.query (page, limit)
    // 2. Get logged in user ID from req.user._id
    // 3. Build aggregation pipeline:
    //    - Match likes where likedBy = userId and video field exists (not null)
    //    - Lookup video details (title, thumbnail, duration, views, uploadBy)
    //    - Lookup video owner details (username, avatar)
    //    - Sort by like createdAt (recently liked first)
    // 4. Use Like.aggregatePaginate() for pagination
    // 5. Return success response with paginated liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}