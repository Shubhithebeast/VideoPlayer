import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import { apiError } from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import logger from "../utils/logger.js"
import { Video } from './../models/video.model.js';

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
    const {videoId} = req.params;
    const {content} = req.body;

    if(!mongoose.isValidObjectId(videoId)){
        throw new apiError(400, "Invalid video ID");
    }
    if(!content || content.trim() === ""){
        throw new apiError(400, "Comment content cannot be empty");
    }

    const userId = req.user._id;

    // Check if video exists 
    const video = await Video.findById(videoId);
    if(!video){
        throw new apiError(404, "Video not found");
    }

    // Create new comment document with: content, video (videoId), owner (userId)
    const newComment = new Comment({
        content: content.trim(),
        video: videoId,
        owner: userId
    });

    await newComment.save();

    return res.status(201).json(
        new apiResponse(201, newComment, "Comment added successfully")
    );
})

const updateComment = asyncHandler(async (req, res) => {
   
    const {commentId} = req.params;
    const {content} = req.body;

    if(!mongoose.isValidObjectId(commentId)){
        throw new apiError(400, "Invalid comment ID");
    }
    if(!content || content.trim() === ""){
        throw new apiError(400, "Comment content cannot be empty");
    }

    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new apiError(404, "Comment not found");
    }

    if(comment.owner.toString() !== userId.toString()){
        throw new apiError(403, "You are not authorized to update this comment");
    }
    comment.content = content.trim();
    await comment.save();

    return res.status(200).json(
        new apiResponse(200, comment, "Comment updated successfully")
    );
  
})

const deleteComment = asyncHandler(async (req, res) => {

    const {commentId} = req.params;

    if(!mongoose.isValidObjectId(commentId)){
        throw new apiError(400, "Invalid comment ID");
    }
    const userId = req.user._id;
    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new apiError(404, "Comment not found");
    }

    if(comment.owner.toString() !== userId.toString()){
        throw new apiError(403, "You are not authorized to delete this comment");
    }
    // Delete all likes associated with this comment
    await mongoose.model("Like").deleteMany({comment: comment._id});
    await comment.deleteOne();

    return res.status(200).json(
        new apiResponse(200, null, "Comment deleted successfully")
    );

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
