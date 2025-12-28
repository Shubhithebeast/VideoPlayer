import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { apiError } from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    // toggle subscription
    // 1. Validate channelId (check if it's a valid MongoDB ObjectId)
    // 2. Check if channel (user) exists in database
    // 3. Get logged in user ID from req.user._id (subscriber)
    // 4. Check if user is trying to subscribe to their own channel (prevent self-subscription)
    // 5. Check if subscription already exists (find by subscriber and channel)
    // 6. If subscription exists:
    //    - Delete the subscription (unsubscribe)
    //    - Return response: "Unsubscribed successfully"
    // 7. If subscription doesn't exist:
    //    - Create new subscription with: subscriber (userId), channel (channelId)
    //    - Return response: "Subscribed successfully"
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    // get all subscribers of a channel
    // 1. Validate channelId (check if it's a valid MongoDB ObjectId)
    // 2. Check if channel exists in database
    // 3. Build aggregation pipeline:
    //    - Match subscriptions where channel = channelId
    //    - Lookup subscriber details from User collection (username, fullName, avatar)
    //    - Project only necessary fields
    //    - Sort by createdAt (newest subscribers first)
    // 4. Execute aggregation
    // 5. Return success response with subscribers list and count
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    
    // get all channels that user has subscribed to
    // 1. Validate subscriberId (check if it's a valid MongoDB ObjectId)
    // 2. Check if user exists in database
    // 3. Build aggregation pipeline:
    //    - Match subscriptions where subscriber = subscriberId
    //    - Lookup channel details from User collection (username, fullName, avatar)
    //    - Lookup channel stats (videos count, subscribers count)
    //    - Project only necessary fields
    //    - Sort by createdAt (recently subscribed first)
    // 4. Execute aggregation
    // 5. Return success response with subscribed channels list and count
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}