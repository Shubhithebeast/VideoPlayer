import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import { apiError } from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    // create tweet
    // 1. Get content from req.body
    // 2. Validate content (required, not empty, max 280 characters)
    // 3. Get logged in user ID from req.user._id
    // 4. Create new tweet document with: content, owner (userId)
    // 5. Save tweet to database
    // 6. Return success response with created tweet
})

const getUserTweets = asyncHandler(async (req, res) => {
    // get user tweets
    // 1. Get userId from req.params
    // 2. Get pagination parameters from req.query (page, limit)
    // 3. Validate userId (check if it's a valid MongoDB ObjectId)
    // 4. Check if user exists in database
    // 5. Build aggregation pipeline:
    //    - Match tweets by owner (userId)
    //    - Lookup owner details (username, avatar)
    //    - Lookup likes count for each tweet
    //    - Sort by createdAt (newest first)
    // 6. Use Tweet.aggregatePaginate() for pagination
    // 7. Return success response with paginated tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    // update tweet
    // 1. Get tweetId from req.params
    // 2. Get new content from req.body
    // 3. Validate tweetId (check if it's a valid MongoDB ObjectId)
    // 4. Validate content (not empty, max 280 characters)
    // 5. Find tweet by _id
    // 6. Check if tweet exists, if not throw 404 error
    // 7. Verify tweet owner is same as logged in user (req.user._id)
    // 8. Update tweet content
    // 9. Save updated tweet
    // 10. Return success response with updated tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    // delete tweet
    // 1. Get tweetId from req.params
    // 2. Validate tweetId (check if it's a valid MongoDB ObjectId)
    // 3. Find tweet by _id
    // 4. Check if tweet exists, if not throw 404 error
    // 5. Verify tweet owner is same as logged in user (req.user._id)
    // 6. Delete all likes associated with this tweet
    // 7. Delete tweet from database
    // 8. Return success response
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
