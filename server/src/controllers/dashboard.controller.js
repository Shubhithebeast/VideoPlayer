import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import { apiError } from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    // 1. Get logged in user ID from req.user._id (channel owner)
    // 2. Build aggregation pipeline or multiple queries to get:
    //    a) Total videos count - Video.countDocuments({ uploadBy: userId })
    //    b) Total views - Sum of all video views using aggregation
    //    c) Total subscribers - Subscription.countDocuments({ channel: userId })
    //    d) Total likes on all videos - Use aggregation to join Video and Like collections
    // 3. Execute all queries
    // 4. Compile stats object with: totalVideos, totalViews, totalSubscribers, totalLikes
    // 5. Return success response with channel statistics
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // Get all the videos uploaded by the channel
    // 1. Get pagination parameters from req.query (page, limit)
    // 2. Get logged in user ID from req.user._id (channel owner)
    // 3. Build aggregation pipeline:
    //    - Match videos where uploadBy = userId
    //    - Lookup likes count for each video
    //    - Lookup comments count for each video
    //    - Add fields: likesCount, commentsCount
    //    - Sort by createdAt (newest first)
    //    - Project all video details with stats
    // 4. Use Video.aggregatePaginate() for pagination
    // 5. Return success response with paginated channel videos including stats
})

export {
    getChannelStats, 
    getChannelVideos
    }