import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import { apiError } from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    
    // TODO: get all videos based on query, sort, pagination
    //Parse and validate query parameters
    const pageNumber = parseInt(page, 10);
    const limitNumber = Math.min(parseInt(limit, 10) || 10, 50);

    // Build match conditions
    const matchConditions = { isPublished: true };

    // add userId filter if provided
    if(userId  && mongoose.isValidObjectId(userId)){
        matchConditions.uploadBy = new mongoose.Types.ObjectId(userId);
    }

    //add search query filter if provided
    // if(query){
    //     matchConditions.$or = [
    //         {title: {$regex: query, $options: "i"}},
    //         {description: {$regex: query, $options: "i"}}
    //     ];
    // }
    if(query){
        matchConditions.$text = { $search: query };
    }

    // buid sort options
    const sortOptions = {};
    if (sortBy) {
        const sortOrder = sortType === "asc" ? 1 : -1;
        sortOptions[sortBy] = sortOrder;
    }

    // Build aggregation pipeline:
    const pipeline = [
        {
            $match: matchConditions
        },
        {
            $lookup:{
                from: "users",
                localField: "uploadBy",
                foreignField: "_id",
                as: "uploadBy",
                pipeline:[{ 
                    $project:{
                        username:1,
                        fullname:1,
                        avatar:1
                    }
                }]
            }
        },
        {
            $lookup:{
                from: "likes",  
                localField: "_id",
                foreignField: "video",
                as: "likes" 
            }
        },
        {
            $addFields:{
                likesCount: { $size: "$likes" },
                uploadBy: { $first: "$uploadBy" }
            }
        }
    ];

    // Only add sort stage if sortBy was provided
    if (Object.keys(sortOptions).length > 0) {
        pipeline.push({ $sort: sortOptions });
    }

    pipeline.push({
        $project:{
            likes:0,
            __v:0
        }
    });

    const videos = await Video.aggregatePaginate(
        pipeline,
        { page: pageNumber, limit: limitNumber }
    );

    return res.status(200).json(new apiResponse(200, "Videos fetched successfully", 
        {
            videos: videos.docs,
            pagination: {
                totalDocs: videos.totalDocs,
                totalPages: videos.totalPages,
                currentPage: videos.page,
                limit: videos.limit,
                hasNextPage: videos.hasNextPage,
                hasPrevPage: videos.hasPrevPage,
                prevPage: videos.prevPage,
                nextPage: videos.nextPage
            }

        }));


})

const publishVideo = asyncHandler(async (req, res) => {
    
    // TODO: get video, upload to cloudinary, create video
    //Validate required fields (title, description)
    const {title, description} = req.body;
    if(!title || !description){
        throw new apiError(400, "Title and description are required");
    }

    // 2. Check if video file is present in req.files (uploaded via multer)
    const localVideoPath = req.files?.video?.[0]?.path;
    if(!localVideoPath){
        throw new apiError(400, "Video file is required");
    }

    //Upload video file to Cloudinary 
    const uploadVideo = await uploadOnCloudinary(localVideoPath);
    if(!uploadVideo?.secure_url){
        throw new apiError(500, "Failed to upload video to Cloudinary");
    }

    const videoUrl = uploadVideo.secure_url;

    // Check if thumbnail file is present in req.files
    const localThumbnailPath = req.files?.thumbnail?.[0]?.path;
    const uploadThumbnail = {};
 
    // Upload thumbnail to Cloudinary
    if(localThumbnailPath){
        uploadThumbnail = await uploadOnCloudinary(localThumbnailPath);
        if(!uploadThumbnail?.secure_url){
            console.error("Failed to upload thumbnail to Cloudinary");
        }
    }

    // if thumbnail not provided, generate thumbnail URL from video URL
    const thumbnailUrl = uploadThumbnail.secure_url || uploadVideo.secure_url.replace(/\.(mp4|mov|avi|mkv)$/i,".jpg");


    // Get video duration from Cloudinary response
    const videoDuration = uploadVideo.duration || 0;

    // Get video owner
    const ownerId = req.user._id;


    // Create video document in database with: title, description,videoURL, thumbnailURL, duration, owner
    const newVideo = await Video.create({
        title,
        description,
        video: videoUrl,
        thumbnail: thumbnailUrl,
        duration: videoDuration,
        uploadBy: ownerId
    })


    // Return response
    return res.status(201).json(new apiResponse(201, "Video published successfully", {video: newVideo}));
})

const getVideoById = asyncHandler(async (req, res) => {
        
    const { videoId } = req.params

    if(!videoId){
        throw new apiError(400, "Video ID is required");
    }

    const video = await Video.aggregate([
        // Find video by _id using aggregation pipeline 
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
         //Add lookup to get owner details (username, fullname, avatar)
        {
            $lookup:{
                from: "users",
                localField: "uploadBy",
                foreignField: "_id",
                as: "uploadBy",

                pipeline:[{
                    $project:{
                        username:1,
                        avatar:1
                    }
                }]
            }

        },
        // Add lookup to get likes
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        //Add lookup to get comments count
        {
            $lookup:{
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },
        // Convert arrays to proper format
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                commentsCount: { $size: "$comments" }
            }
        },
        // Remove full arrays from response
        {
            $project: {
                likes: 0,
                updatedAt: 0,
                __v: 0
            }
        }
    ])
 
    
    // Check if video exists, if not throw 404 error
    if(video.length === 0){
        throw new apiError(404, "Video not found");
    }

    // Increment views count
    await Video.findByIdAndUpdate(videoId, {$inc: {views: 1}});


    //Add video to user's watch history (req.user._id)
    const userId = req.user._id;
    await mongoose.model("User").findByIdAndUpdate(userId, {
        $addToSet: {watchHistory: videoId}
    });

    //Return response with video details
    return res.status(200).json(new apiResponse(200, "Video fetched successfully", {video: video[0]}));

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    // TODO: update video details like title, description, thumbnail
    // 1. Validate videoId (check if it's a valid MongoDB ObjectId)
    // 2. Get title and description from req.body
    // 3. Check if at least one field is provided to update
    // 4. Find video by _id
    // 5. Check if video exists, if not throw 404 error
    // 6. Verify video owner is same as logged in user (req.user._id)
    // 7. If new thumbnail file is provided:
    //    - Get thumbnail local path from req.file
    //    - Delete old thumbnail from Cloudinary (extract publicId from URL)
    //    - Upload new thumbnail to Cloudinary
    //    - Update thumbnail URL
    // 8. Update title and description if provided
    // 9. Save updated video document
    // 10. Return updated video details
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    // TODO: delete video
    // 1. Validate videoId (check if it's a valid MongoDB ObjectId)
    // 2. Find video by _id
    // 3. Check if video exists, if not throw 404 error
    // 4. Verify video owner is same as logged in user (req.user._id)
    // 5. Extract publicId from video URL
    // 6. Extract publicId from thumbnail URL
    // 7. Delete video file from Cloudinary
    // 8. Delete thumbnail from Cloudinary
    // 9. Delete all likes associated with this video
    // 10. Delete all comments associated with this video
    // 11. Remove video from all playlists
    // 12. Remove video from all users' watch history
    // 13. Delete video document from database
    // 14. Return success response
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    // TODO: toggle publish status
    // 1. Validate videoId (check if it's a valid MongoDB ObjectId)
    // 2. Find video by _id
    // 3. Check if video exists, if not throw 404 error
    // 4. Verify video owner is same as logged in user (req.user._id)
    // 5. Toggle isPublished field (true -> false or false -> true)
    // 6. Save updated video document
    // 7. Return updated video with new publish status
})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
