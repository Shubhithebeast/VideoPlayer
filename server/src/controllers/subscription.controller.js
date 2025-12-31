import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { apiError } from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import logger from "../utils/logger.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!mongoose.isValidObjectId(channelId)){
        throw new apiError(400, 'Invalid channel ID');
    }

    const channelUser = await User.findById(channelId);
    if(!channelUser){
        throw new apiError(404, 'Channel (user) not found');
    }

    const subscriberId = req.user._id;

    if(subscriberId.toString() === channelId.toString()){
        throw new apiError(400, 'You cannot subscribe to your own channel');
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    });

    if(existingSubscription){
        // Unsubscribe
        await Subscription.deleteOne({_id: existingSubscription._id});
        logger.info(`User ${subscriberId} unsubscribed from channel ${channelId}`);
        return res.status(200).json(new apiResponse(true, 'Unsubscribed successfully'));
    }

    // Subscribe
    const newSubscription = new Subscription({
        subscriber: subscriberId,
        channel: channelId
    });
    await newSubscription.save();
    logger.info(`User ${subscriberId} subscribed to channel ${channelId}`);
    return res.status(201).json(new apiResponse(true, 'Subscribed successfully'));
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