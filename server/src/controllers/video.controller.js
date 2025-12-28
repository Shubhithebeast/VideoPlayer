import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import { apiError } from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, extractPublicIdFromUrl, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    
    //get all videos based on query, sort, pagination
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
    
    //  get video, upload to cloudinary, create video
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
            logger.error("Failed to upload thumbnail to Cloudinary");
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
    
    // update video details like title, description, thumbnail
    if(!mongoose.isValidObjectId(videoId)){
        throw new apiError(400, "Invalid video ID");
    }

    const { title, description } = req.body;
    if(!title && !description && !req.file){
        throw new apiError(400, "At least one field (title, description, thumbnail) is required to update");
    }
    
    const video = await Video.findById(videoId);
    if(!video){
        throw new apiError(404, "Video not found");
    }

    const thumbnailLocalPath = req.file?.path;
    if(thumbnailLocalPath){
        // Delete old thumbnail from Cloudinary
        const oldThumbnailPublicId = extractPublicIdFromUrl(video.thumbnail);
        if(oldThumbnailPublicId){
            try{
                await deleteFromCloudinary(oldThumbnailPublicId, "image");
                logger.info("Old thumbnail deleted from Cloudinary");
            }catch(error){
                logger.error("Error deleting old thumbnail from Cloudinary:", error);
            }
        }else{
            logger.error("Could not extract public ID from old thumbnail URL");
        }
        // Upload new thumbnail to Cloudinary
        const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if(!newThumbnail.url){
            throw new apiError(500, "Failed to upload new thumbnail image");
        }
        video.thumbnail = newThumbnail.url;
    }else if(description){
        video.description = description;
    }else{
        video.title = title;
    }


    //Save updated video document
    const updatedVideo = await video.save();

    return res.status(200).json(new apiResponse(200, "Video updated successfully", {video: updatedVideo}));
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new apiError(404, "Video not found");
    }

    // Cloudinary delete (non-transactional)
    try {
        const thumbnailPublicId = extractPublicIdFromUrl(video.thumbnail);
        const videoPublicId = extractPublicIdFromUrl(video.video);
        await deleteFromCloudinary(videoPublicId, "video");
        await deleteFromCloudinary(thumbnailPublicId, "image");
        logger.info("Video and thumbnail deleted from Cloudinary");
    } catch (err) {
        logger.error("Cloudinary delete failed:", err);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await mongoose.model("Like").deleteMany({ video: videoId }, { session });
        await mongoose.model("Comment").deleteMany({ video: videoId }, { session });

        await mongoose.model("Playlist").updateMany(
            { videos: videoId },
            { $pull: { videos: videoId } },
            { session }
        );

        await mongoose.model("User").updateMany(
            {},
            { $pull: { watchHistory: videoId } },
            { session }
        );

        await Video.findByIdAndDelete(videoId, { session });

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json(
            new apiResponse(200, "Video deleted successfully")
        );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new apiError(500, "An error occurred while deleting the video");
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!mongoose.isValidObjectId(videoId)){
        throw new apiError(400, "Invalid video ID");
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new apiError(404, "Video not found");
    }
    video.isPublished = !video.isPublished;
    const updatedVideo = await video.save();

    logger.info(`Video publish status toggled. Video ID: ${videoId}, New Status: ${updatedVideo.isPublished}`);
    return res.status(200).json(new apiResponse(200, "Video publish status toggled successfully", {video: updatedVideo}));
})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
