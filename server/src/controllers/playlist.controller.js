import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { apiError } from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    // create playlist
    // 1. Validate name (required, not empty)
    // 2. Validate description (optional, but if provided should not be empty)
    // 3. Get logged in user ID from req.user._id
    // 4. Create new playlist document with: name, description, owner (userId), videos (empty array)
    // 5. Save playlist to database
    // 6. Return success response with created playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    // get user playlists
    // 1. Validate userId (check if it's a valid MongoDB ObjectId)
    // 2. Check if user exists in database
    // 3. Build aggregation pipeline:
    //    - Match playlists by owner (userId)
    //    - Lookup videos in each playlist
    //    - Add fields: videosCount, first video thumbnail for preview
    //    - Sort by createdAt (newest first)
    // 4. Execute aggregation
    // 5. Return success response with user's playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
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
    
    // add video to playlist
    // 1. Validate playlistId and videoId (check if they're valid MongoDB ObjectIds)
    // 2. Find playlist by _id
    // 3. Check if playlist exists, if not throw 404 error
    // 4. Verify playlist owner is same as logged in user (req.user._id)
    // 5. Check if video exists in database
    // 6. Check if video is already in playlist (avoid duplicates)
    // 7. Add videoId to playlist.videos array using $addToSet or $push
    // 8. Save updated playlist
    // 9. Return success response with updated playlist
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    // remove video from playlist
    // 1. Validate playlistId and videoId (check if they're valid MongoDB ObjectIds)
    // 2. Find playlist by _id
    // 3. Check if playlist exists, if not throw 404 error
    // 4. Verify playlist owner is same as logged in user (req.user._id)
    // 5. Check if video exists in playlist.videos array
    // 6. Remove videoId from playlist.videos array using $pull
    // 7. Save updated playlist
    // 8. Return success response
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    // delete playlist
    // 1. Validate playlistId (check if it's a valid MongoDB ObjectId)
    // 2. Find playlist by _id
    // 3. Check if playlist exists, if not throw 404 error
    // 4. Verify playlist owner is same as logged in user (req.user._id)
    // 5. Delete playlist from database
    // 6. Return success response
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    // update playlist
    // 1. Validate playlistId (check if it's a valid MongoDB ObjectId)
    // 2. Check if at least one field (name or description) is provided to update
    // 3. Find playlist by _id
    // 4. Check if playlist exists, if not throw 404 error
    // 5. Verify playlist owner is same as logged in user (req.user._id)
    // 6. Update name and/or description if provided
    // 7. Save updated playlist
    // 8. Return success response with updated playlist
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
