import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        }
    },
    {timestamps: true}
);

tweetSchema.plugin(mongooseAggregatePaginate);
tweetSchema.index({owner: 1, createdAt: -1}); // getUserTweets — filter by owner, sort by newest

export const Tweet = mongoose.model("Tweet", tweetSchema);
