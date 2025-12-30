import mongoose from "mongoose"
import {Like} from "../models/like.model.js"
import { apiError } from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from './../models/video.model.js';
import logger from "../utils/logger.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if(!mongoose.isValidObjectId(videoId)){
        return apiError(res, 400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if(!video){
        return apiError(res, 404, "Video not found")
    }

    const userId = req.user._id;
    const existingLike = await Like.findOne({likedBy: userId, video: videoId});

    if(existingLike){
        // Unlike the video
        await Like.deleteOne({_id: existingLike._id});
        logger.info(`User ${userId} unliked video ${videoId}`);

        return res.status(200).json(
            new apiResponse(200, null, "Video unliked successfully")
        );
    }

    // Like the video
    const newLike = new Like({
        likedBy: userId,
        video: videoId
    });

    await newLike.save();
    logger.info(`User ${userId} liked the video ${videoId}`);
    return res.status(200).json(
        new apiResponse(200, null, "Video liked successfully")
    );

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!mongoose.isValidObjectId(commentId)){
        return apiError(res, 400, "Invalid comment ID")
    }

    if(!await mongoose.model("Comment").exists({_id: commentId})){
        return apiError(res, 404, "Comment not found")
    }

    const userId = req.user._id;
    const existingLike = await Like.findOne({likedBy: userId, comment: commentId});

    if(existingLike){
        // Unlike the comment
        await Like.deleteOne({_id: existingLike._id});
        logger.info(`User ${userId} unliked comment ${commentId}`);
        return res.status(200).json(
            new apiResponse(200, null, "Comment unliked successfully")
        );
    }

    // Like the comment
    const newLike = new Like({
        likedBy: userId,
        comment: commentId
    });
    await newLike.save();
    logger.info(`User ${userId} liked comment ${commentId}`);
    return res.status(200).json(
        new apiResponse(200, null, "Comment liked successfully")
    );
    
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!mongoose.isValidObjectId(tweetId)){
        return apiError(res, 400, "Invalid tweet ID")
    }

    if(!await mongoose.model("Tweet").exists({_id: tweetId})){
        return apiError(res, 404, "Tweet not found")
    }

    const userId = req.user._id;
    const existingLike = await Like.findOne({likedBy: userId, tweet: tweetId});
    if(existingLike){
        // Unlike the tweet
        await Like.deleteOne({_id: existingLike._id});
        logger.info(`User ${userId} unliked tweet ${tweetId}`);
        return res.status(200).json(
            new apiResponse(200, null, "Tweet unliked successfully")
        );
    }

    // Like the tweet
    const newLike = new Like({
        likedBy: userId,
        tweet: tweetId
    });

    await newLike.save();
    logger.info(`User ${userId} liked tweet ${tweetId}`);
    return res.status(200).json(
        new apiResponse(200, null, "Tweet liked successfully")
    );
    
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const {page = 1, limit = 10} = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = Math.min(parseInt(limit, 10), 10,50);

    const userId = req.user._id;

    const aggregateQuery = Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "uploadBy",
                            foreignField: "_id",
                            as: "uploader",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            uploadBy: { $first: "$uploader" }
                        }
                    },
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            uploadBy: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$videoDetails"    
        },
        {
            $sort: { createdAt: -1 } // Sort by like creation date (most recent first)
        }
    ])

    const options = {
        page: pageNumber,
        limit: limitNumber
    };

    const likedVideos = await Like.aggregatePaginate(aggregateQuery, options);

    return res.status(200).json(
        new apiResponse(200, likedVideos, "Liked videos fetched successfully")
    );

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