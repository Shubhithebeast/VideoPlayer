import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import { apiError } from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, extractPublicIdFromUrl, uploadOnCloudinary} from "../utils/cloudinary.js"
import logger from "../utils/logger.js"
import { getCache, setCache, deleteCache } from "../utils/cache.js"
import { addVideoJob, videoQueue } from "../queues/videoQueue.js"


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

    // Validate required fields — done BEFORE the queue so the user
    // gets immediate feedback on bad requests (no point queuing invalid jobs)
    const { title, description } = req.body;
    if (!title || !description) {
        throw new apiError(400, "Title and description are required");
    }

    // Check the video file was uploaded by multer to temp folder
    const localVideoPath = req.files?.video?.[0]?.path;
    if (!localVideoPath) {
        throw new apiError(400, "Video file is required");
    }

    // Thumbnail is optional
    const localThumbnailPath = req.files?.thumbnail?.[0]?.path || null;

    // Add a job to the queue — this is INSTANT (just writes to Redis)
    // The worker will pick this up and do the actual Cloudinary upload + DB save
    const ownerId = req.user._id.toString();
    const job = await addVideoJob({
        localVideoPath,
        localThumbnailPath,
        title,
        description,
        ownerId,
    });

    logger.info(`Video upload job queued`, { jobId: job.id, title, ownerId });

    // Return immediately — don't make the user wait!
    return res.status(202).json(new apiResponse(202, "Video is being processed. Check status with the job ID.", {
        jobId: job.id,
        status: "queued",
    }));
})

const getVideoById = asyncHandler(async (req, res) => {
        
    const { videoId } = req.params

    if(!videoId){
        throw new apiError(400, "Video ID is required");
    }

    // --- CACHE CHECK ---
    // Try getting video details from Redis before hitting DB call.
    // Cache key format: "video:{videoId}" (e.g., "video:665a1b2c3d...")
    const cacheKey = `video:${videoId}`;
    let videoData = await getCache(cacheKey);

    if (!videoData) {
        // Cache MISS — run the full aggregation pipeline
        const video = await Video.aggregate([
            // Find video by _id using pipeline 
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

        videoData = video[0];

        // Store in Redis with 10 minute TTL (600 seconds)
        await setCache(cacheKey, videoData, 600);
    }

    // Increment views only on first watch by this user.
    // This prevents view inflation on page refresh/back navigation/like-refresh calls.
    const userId = req.user._id;
    const alreadyWatched = await mongoose.model("User").exists({
        _id: userId,
        watchHistory: videoId
    });

    if(!alreadyWatched){
        await Promise.all([
            Video.findByIdAndUpdate(videoId, {$inc: {views: 1}}),
            mongoose.model("User").findByIdAndUpdate(userId, {
                $addToSet: {watchHistory: videoId}
            })
        ]);
    }

    //Return response with video details
    return res.status(200).json(new apiResponse(200, "Video fetched successfully", {video: videoData}));

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

    // Invalidate cache — old video data is now stale
    await deleteCache(`video:${videoId}`);

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

        // Invalidate caches — video is gone, stats changed
        await deleteCache(`video:${videoId}`);
        await deleteCache(`dashboard:stats:${video.uploadBy}`);

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

    // Invalidate cache — publish status changed
    await deleteCache(`video:${videoId}`);

    logger.info(`Video publish status toggled. Video ID: ${videoId}, New Status: ${updatedVideo.isPublished}`);
    return res.status(200).json(new apiResponse(200, "Video publish status toggled successfully", {video: updatedVideo}));
})

// poll this to check the status of a queued upload
const getVideoJobStatus = asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    // Fetch the job from Redis using BullMQ's Queue API
    const job = await videoQueue.getJob(jobId);

    if (!job) {
        throw new apiError(404, "Job not found. It may have been cleaned up or never existed.");
    }

    // getState() returns: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'unknown'
    const state = await job.getState();

    const response = {
        jobId: job.id,
        status: state,
        progress: job.progress,  // 0-100, updated by job.updateProgress() in the worker
    };

    if (state === 'completed') {
        response.video = job.returnvalue;  // { videoId, title } from the worker's return
    }

    if (state === 'failed') {
        response.reason = job.failedReason;
        response.attempts = job.attemptsMade;
    }

    return res.status(200).json(new apiResponse(200, "Job status fetched", response));
})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    getVideoJobStatus,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
