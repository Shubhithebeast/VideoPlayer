import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema(
    {
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment"
        },
        tweet: {
            type: Schema.Types.ObjectId,
            ref: "Tweet"
        },
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {timestamps: true}
);

likeSchema.plugin(mongooseAggregatePaginate);
likeSchema.index({likedBy: 1, video: 1});   // toggle video like — query by both
likeSchema.index({likedBy: 1, comment: 1}); // toggle comment like
likeSchema.index({likedBy: 1, tweet: 1});   // toggle tweet like
likeSchema.index({video: 1});               // count likes on a video (aggregation $lookup)

export const Like = mongoose.model("Like", likeSchema);
