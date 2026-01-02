import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import { apiError } from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {

    // Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id;

    const totalVideos = await Video.countDocuments({ uploadBy: userId });

    const totalViews = await Video.aggregate([
        { $match: { uploadBy: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);

    const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    const totalLikes = await Like.aggregate([
        { $match: { video: { $exists: true } } },
        { 
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        { $unwind: "$videoDetails" },
        { $match: { "videoDetails.uploadBy": new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, totalLikes: { $count: {} } } }
    ]);

    const stats = {
        totalVideos,
        totalViews: totalViews[0] ? totalViews[0].totalViews : 0,
        totalSubscribers,
        totalLikes: totalLikes[0] ? totalLikes[0].totalLikes : 0
    };

    return res.status(200).json(new apiResponse(true, 'Channel statistics fetched successfully', stats));
    
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
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    if(!mongoose.isValidObjectId(userId)){
        throw new apiError(400, 'Invalid user ID');
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = Math.min(parseInt(limit, 10) || 10, 50);

    // Using find() with populate as requested
    const skip = (pageNumber - 1) * limitNumber;
    
    const videos = await Video.find({ uploadBy: userId })
        .populate('uploadBy', 'username fullName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean();

    // Manually add likes and comments count for each video
    const videosWithStats = await Promise.all(
        videos.map(async (video) => {
            const likesCount = await Like.countDocuments({ video: video._id });
            const commentsCount = await Comment.countDocuments({ video: video._id });
            
            return {
                ...video,
                likesCount,
                commentsCount
            };
        })
    );

    const totalVideos = await Video.countDocuments({ uploadBy: userId });

    return res.status(200).json(new apiResponse(true, 'Channel videos fetched successfully', {
        videos: videosWithStats,
        pagination: {
            currentPage: pageNumber,
            totalPages: Math.ceil(totalVideos / limitNumber),
            totalVideos,
            limit: limitNumber
        }
    }));

})

export {
    getChannelStats, 
    getChannelVideos
    }