import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { apiError } from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import logger from "../utils/logger.js"
import { User } from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || name.trim() === ""){
        throw new apiError(400, 'Playlist name is required');
    }

    if(description && description.trim() === ""){
        throw new apiError(400, 'Playlist description cannot be empty if provided');
    }

    const userId = req.user._id;

    const newPlaylist = new Playlist({
        name: name.trim(),
        description: description ? description.trim() : "",
        owner: userId,
        videos: []
    });

    await newPlaylist.save();
    
    logger.info(`Playlist ${newPlaylist._id} created by user ${userId}`);
    return res.status(201).json(new apiResponse(true, 'Playlist created successfully', newPlaylist));

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    const {page = 1, limit = 10} = req.query;

    const pageCount = parseInt(page, 10);
    const limitNumber = Math.min(parseInt(limit, 10) || 10, 50);

    if(!isValidObjectId(userId)){
        throw new apiError(400, 'Invalid user ID');
    }

    const playlists = await Playlist.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project:{
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        { $unwind: "$ownerDetails"
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails"                  
            }
        },
        {
            $addFields: {
                videosCount: { $size: "$videoDetails" },
                previewThumbnail: { $arrayElemAt: [ "$videoDetails.thumbnail", 0 ] }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                ownerDetails: 1,
                videosCount: 1,
                previewThumbnail: 1,
                createdAt: 1,
                updatedAt: 1
            }
        },
        { $sort: { createdAt: -1 } },
        { $skip: (pageCount - 1) * limitNumber },
        { $limit: limitNumber }
    ]);

    const totalPlaylists = await Playlist.countDocuments({ owner: userId });

    return res.status(200).json(new apiResponse(true, 'User playlists fetched successfully', {
        playlists,
        pagination: {
            currentPage: pageCount,
            totalPages: Math.ceil(totalPlaylists / limitNumber),
            totalPlaylists,
            limit: limitNumber
        }
    }));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {page = 1, limit = 10} = req.query;

    const pageCount = parseInt(page, 10);
    const limitNumber = Math.min(parseInt(limit, 10) || 10, 50);


    if(!isValidObjectId(playlistId)){
        throw new apiError(400, 'Invalid playlist ID');
    }

    const playlistAggregation = await Playlist.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(playlistId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project:{
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails",
                pipeline:[
                    {
                        $project:{
                            title:1,
                            thumbnail:1,
                            duration:1,
                            views:1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalVideos: { $size: "$videoDetails" },
                totalViews: { $sum: "$videoDetails.views" }
            }
        },
        { $unwind: "$ownerDetails" },
        {
            $project:{
                name:1,
                description:1,
                ownerDetails:1,
                videoDetails:1,
                totalVideos:1,
                totalViews:1,
                createdAt:1,
                updatedAt:1
            }
        },
        { $sort: { createdAt: -1 } },
        { $skip: (pageCount - 1) * limitNumber },
        { $limit: limitNumber }
    ]);

    if(playlistAggregation.length === 0){
        throw new apiError(404, 'Playlist not found');
    }

    const playlist = playlistAggregation[0];

    return res.status(200).json(new apiResponse(true, 'Playlist fetched successfully', playlist));
    
    // get playlist by id
    // 1. Validate playlistId (check if it's a valid MongoDB ObjectId)
    // 2. Build aggregation pipeline:
    //    - Match playlist by _id
    //    - Lookup owner details (username, avatar)
    //    - Lookup all videos in playlist with full details (title, thumbnail, duration, views)
    //    - Add fields: totalVideos, totalViews
    // 3. Execute aggregation
    // 4. Check if playlist exists, if not throw 404 error
    // 5. Return success response with playlist details and videos
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new apiError(400, 'Invalid playlist ID');
    }

    if(!isValidObjectId(videoId)){
        throw new apiError(400, 'Invalid video ID');
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new apiError(404, 'Playlist not found');
    }

    if(req.user._id.toString() !== playlist.owner.toString()){
        throw new apiError(403, 'You are not authorized to modify this playlist');
    }

    const { Video } = await import('../models/video.model.js');
    const video = await Video.findById(videoId);
    if(!video){
        throw new apiError(404, 'Video not found');
    }

    if(playlist.videos.includes(videoId)){
        throw new apiError(400, 'Video already exists in playlist');
    }

    playlist.videos.push(videoId);
    await playlist.save();

    logger.info(`Video ${videoId} added to playlist ${playlistId} by user ${req.user._id}`);
    return res.status(200).json(new apiResponse(true, 'Video added to playlist successfully', playlist));

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new apiError(400, 'Invalid playlist ID');
    }

    if(!isValidObjectId(videoId)){
        throw new apiError(400, 'Invalid video ID');
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new apiError(404, 'Playlist not found');
    }

    if(req.user._id.toString() !== playlist.owner.toString()){
        throw new apiError(403, 'You are not authorized to modify this playlist');
    }

    if(!playlist.videos.includes(videoId)){
        throw new apiError(400, 'Video does not exist in playlist');
    }

    playlist.videos.pull(videoId);
    await playlist.save();

    logger.info(`Video ${videoId} removed from playlist ${playlistId} by user ${req.user._id}`);
    return res.status(200).json(new apiResponse(true, 'Video removed from playlist successfully', playlist));

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new apiError(400, 'Invalid playlist ID');
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new apiError(404, 'Playlist not found');
    }

    if(req.user._id.toString() !== playlist.owner.toString()){
        throw new apiError(403, 'You are not authorized to delete this playlist');
    }

    await Playlist.deleteOne({_id: playlistId});

    logger.info(`Playlist ${playlistId} deleted by user ${req.user._id}`);
    return res.status(200).json(new apiResponse(true, 'Playlist deleted successfully'));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!isValidObjectId(playlistId)){
        throw new apiError(400, 'Invalid playlist ID');
    }

    if(!name && !description){
        throw new apiError(400, 'At least one field (name or description) is required to update');
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new apiError(404, 'Playlist not found');
    }

    if(req.user._id.toString() !== playlist.owner.toString()){
        throw new apiError(403, 'You are not authorized to update this playlist');
    }

    if(name){
        if(name.trim() === ""){
            throw new apiError(400, 'Playlist name cannot be empty');
        }
        playlist.name = name.trim();
    }

    if(description !== undefined){
        if(description.trim() === ""){
            throw new apiError(400, 'Playlist description cannot be empty if provided');
        }
        playlist.description = description.trim();
    }

    await playlist.save();

    logger.info(`Playlist ${playlistId} updated by user ${req.user._id}`);
    return res.status(200).json(new apiResponse(true, 'Playlist updated successfully', playlist));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
