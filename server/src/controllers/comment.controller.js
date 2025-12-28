import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import { apiError } from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import logger from "../utils/logger.js"

const getVideoComments = asyncHandler(async (req, res) => {
    // get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!mongoose.isValidObjectId(videoId)){
        throw new apiError(400, "Invalid video ID");
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = Math.min(parseInt(limit, 10), 100);


    // build aggregation pipeline:
    const aggregateQuery = Comment.aggregate([
        {
            $match: {video: new mongoose.Types.ObjectId(videoId)}
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            fullName: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: {$first: "$owner"},
                likesCount: {$size: "$likes"}
            }
        },
        {
            $project: {
                content: 1,
                owner: 1,
                likesCount: 1,
                createdAt: 1,
                updatedAt: 1
            }
        },
        {
            $sort: {createdAt: -1}
        }
    ]);

    const options = {
        page: pageNumber,
        limit: limitNumber
    };

    const comments = await Comment.aggregatePaginate(aggregateQuery, options);

    return res.status(200).json(
        new apiResponse(200, comments, "Comments fetched successfully")
    );
})

const addComment = asyncHandler(async (req, res) => {
    // add a comment to a video
    // 1. Get videoId from req.params
    // 2. Get content from req.body
    // 3. Validate videoId (check if it's a valid MongoDB ObjectId)
    // 4. Validate content (check if it's not empty, trim whitespace)
    // 5. Check if video exists in database
    // 6. Get logged in user ID from req.user._id
    // 7. Create new comment document with: content, video (videoId), owner (userId)
    // 8. Save comment to database
    // 9. Return success response with created comment
})

const updateComment = asyncHandler(async (req, res) => {
    // update a comment
    // 1. Get commentId from req.params
    // 2. Get new content from req.body
    // 3. Validate commentId (check if it's a valid MongoDB ObjectId)
    // 4. Validate content (check if it's not empty, trim whitespace)
    // 5. Find comment by _id
    // 6. Check if comment exists, if not throw 404 error
    // 7. Verify comment owner is same as logged in user (req.user._id)
    // 8. Update comment content
    // 9. Save updated comment
    // 10. Return success response with updated comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // delete a comment
    // 1. Get commentId from req.params
    // 2. Validate commentId (check if it's a valid MongoDB ObjectId)
    // 3. Find comment by _id
    // 4. Check if comment exists, if not throw 404 error
    // 5. Verify comment owner is same as logged in user (req.user._id)
    // 6. Delete all likes associated with this comment
    // 7. Delete comment from database
    // 8. Return success response
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
