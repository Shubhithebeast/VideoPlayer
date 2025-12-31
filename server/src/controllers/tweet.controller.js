import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import { apiError } from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import logger from "../utils/logger.js"

const createTweet = asyncHandler(async (req, res) => {

    const {tweet} = req.body;
    if(!tweet || tweet.trim().length === 0){
        throw new apiError(400, 'Tweet content is required');
    }

    if(tweet.length > 280){
        throw new apiError(400, 'Tweet content exceeds maximum length of 280 characters');
    }

    const userId = req.user._id;

    const newTweet = new Tweet({
        content: tweet,
        owner: userId
    });
    await newTweet.save();

    // Populate owner details (username, avatar) without aggregation pipeline
    await newTweet.populate('owner', 'username avatar');

    logger.info(`New tweet created by user ${userId}: ${newTweet._id}`);
     return res.status(201).json(new apiResponse(true, 'Tweet created successfully', {tweet: newTweet}));
})

const getUserTweets = asyncHandler(async (req, res) => {

    const {page =1, limit=10} = req.query;
    
    const pageCount = parseInt(page, 10);
    const limitNumber = Math.min(parseInt(limit, 10) || 10, 50);
    
    const userId = req.params.userId;

    if(!await User.exists({_id: userId})){
        throw new apiError(404, 'User not found');
    }

    const aggregatePipeline = [
        {
            $match: {owner: new mongoose.Types.ObjectId(userId)}
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerDetails",
                pipeline:[
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
                from:"likes",
                localField:"tweet",
                foreignField:"_id",
                as:"likes",
            }
        },
        {
            $addFields:{
                likesCount:{$size:"$likes"}
            }
        },
        {
            $project:{
                __v:0,
                likes:0
            }
        },
        { $sort: {createdAt: -1} }
    ];

    const options = {
        page: pageCount,
        limit: limitNumber
    };

    const tweets = await Tweet.aggregatePaginate(
        Tweet.aggregate(aggregatePipeline),
        options
    );

    return res.status(200).json(new apiResponse(true, 'User tweets fetched successfully', 
        {
            tweets: tweets.docs,
            pagination :{
                totalDocs: tweets.totalDocs,
                totalPages: tweets.totalPages,
                currentPage: tweets.page,
                limit: tweets.limit,
                hasNextPage: tweets.hasNextPage,
                hasPrevPage: tweets.hasPrevPage,
                prevPage: tweets.prevPage,
                nextPage: tweets.nextPage
            }
        }));
})

const updateTweet = asyncHandler(async (req, res) => {

    const {tweetId} = req.params;
    const {content} = req.body;

    if(!mongoose.isValidObjectId(tweetId)){
        throw new apiError(400, 'Invalid tweet ID');
    }

    if(!content || content.trim().length === 0){
        throw new apiError(400, 'Tweet content is required');
    }
    if(content.length > 280){
        throw new apiError(400, 'Tweet content exceeds maximum length of 280 characters');
    }
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new apiError(404, 'Tweet not found');
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new apiError(403, 'You are not authorized to update this tweet');
    }

    tweet.content = content;
    await tweet.save();

    logger.info(`Tweet ${tweetId} updated by user ${req.user._id}`);
    return res.status(200).json(new apiResponse(true, 'Tweet updated successfully', {tweet}));

})

const deleteTweet = asyncHandler(async (req, res) => {

    const {tweetId} = req.params;

    if(!isValidObjectId(tweetId)){
        throw new apiError(400, 'Invalid tweet ID');
    }

    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new apiError(404, 'Tweet not found');
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new apiError(403, 'You are not authorized to delete this tweet');
    }

    await mongoose.model("Like").deleteMany({tweet: tweetId});
    await Tweet.deleteOne({_id: tweetId});

    logger.info(`Tweet ${tweetId} deleted by user ${req.user._id}`);
    return res.status(200).json(new apiResponse(true, 'Tweet deleted successfully'));

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
