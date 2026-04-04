import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
    video:{
        type: String,
        required: true,
    },
    thumbnail:{
        type: String,
    },
    title:{
        type: String,
        required: true,
    },
    description:{
        type: String,
        required: true,
    },
    duration:{
        type: Number,
        required: true,
    },
    views:{
        type: Number,
        default: 0,
    },
    isPublished:{
        type: Boolean,
        default: true,
    },
    uploadBy:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }


}, {timestamps: true}
);

videoSchema.plugin(mongooseAggregatePaginate);
videoSchema.index({title: "text", description: "text"});
videoSchema.index({uploadBy: 1, isPublished: 1}); // getAllVideos filters by both
videoSchema.index({isPublished: 1, createdAt: -1});  // feed sorted by newest

export const Video = mongoose.model('Video', videoSchema);