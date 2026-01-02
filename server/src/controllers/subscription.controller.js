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
    const {page = 1, limit = 20} = req.query;

    const pageCount = parseInt(page, 10);
    const limitNumber = Math.min(parseInt(limit, 10) || 10, 50);


    if(!mongoose.isValidObjectId(channelId)){
        throw new apiError(400, 'Invalid channel ID');
    }

    const channelUser = await User.findById(channelId);
    if(!channelUser){
        throw new apiError(404, 'Channel (user) not found');
    }

    if(req.user._id.toString() !== channelId.toString()){
        throw new apiError(400, 'You can only view subscribers of your own channel');
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {channel: new mongoose.Types.ObjectId(channelId)}
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
                pipeline:[
                    { 
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1
                        }  
                    }
                ]    
            }
        },
        {
            $project:{
                _id:0,
                subscriberDetails:{$arrayElemAt:["$subscriberDetails", 0]},
                createdAt:1
            }
        },
        { $sort: {createdAt: -1} },
        { $skip: (pageCount - 1) * limitNumber },
        { $limit: limitNumber }

    ]);

    const totalSubscribers = await Subscription.countDocuments({channel: channelId});

    return res.status(200).json(new apiResponse(true, 'Subscribers fetched successfully', {
        subscribers,
        totalSubscribers
    }));

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const {page = 1, limit = 20} = req.query;

    const pageCount = parseInt(page, 10);
    const limitNumber = Math.min(parseInt(limit, 10) || 10, 50);


    if(!isValidObjectId(subscriberId)){
        throw new apiError(400, 'Invalid subscriber ID');
    }

    const subscriberUser = await User.findById(subscriberId);
    if(!subscriberUser){
        throw new apiError(404, 'Subscriber (user) not found');
    }

    if(req.user._id.toString() !== subscriberId.toString()){
        throw new apiError(400, 'You can only view your own subscribed channels');
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {subscriber: new mongoose.Types.ObjectId(subscriberId)}
        },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
                pipeline:[
                    {
                        $lookup:{
                            from: "videos",
                            localField: "_id",
                            foreignField: "uploadBy",
                            as: "videos"
                        }
                    },
                    {
                        $lookup:{
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $project:{
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            videosCount: {$size: "$videos"},
                            subscribersCount: {$size: "$subscribers"}
                        }
                    }
                ]
            }
        },
        {
            $project:{
                _id:0,
                channelDetails:{$arrayElemAt:["$channelDetails", 0]},
                createdAt:1
            }
        },
        { $sort: {createdAt: -1}},
        { $skip: (pageCount - 1) * limitNumber },
        { $limit: limitNumber }
    ]);

    const totalSubscribedChannels = await Subscription.countDocuments({subscriber: subscriberId});

    return res.status(200).json(new apiResponse(true, 'Subscribed channels fetched successfully', {
        subscribedChannels,
        totalSubscribedChannels
    }));

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}